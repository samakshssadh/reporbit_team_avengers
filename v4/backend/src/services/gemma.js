// Google Gemma inference adapter. Two runtimes, same Gemma model family:
//   GEMMA_PROVIDER=ollama  -> local Ollama  (POST {OLLAMA_URL}/api/chat), e.g. GEMMA_MODEL=gemma3:4b
//   GEMMA_PROVIDER=google  -> Gemini API hosting Gemma (POST /v1beta/models/{model}:generateContent), e.g. gemma-3-27b-it
// No fallback to any non-Gemma model, ever. If Gemma is not reachable we throw MODEL_UNAVAILABLE.
import { config } from '../config.js';
import { AppError, errors } from '../lib/errors.js';

const GOOGLE_BASE = () => config.gemma.googleBaseUrl;
const MAX_PROMPT_CHARS = 60000;

export const gemmaInfo = () => ({ provider: config.gemma.provider, model: config.gemma.model || null });

// ---------- readiness (cached; never runs an inference) ----------
let readyCache = { at: 0, status: null };
export async function gemmaStatus({ force = false } = {}) {
  const { provider, model } = config.gemma;
  if (provider === 'none' || !model) return 'unconfigured';
  if (!force && readyCache.status && Date.now() - readyCache.at < 60_000) return readyCache.status;
  let status = 'unavailable';
  try {
    if (provider === 'ollama') {
      const r = await fetchWithTimeout(`${config.gemma.ollamaUrl}/api/tags`, {}, 3000);
      if (r.ok) {
        const tags = (await r.json()).models?.map((m) => m.name) || [];
        const want = model.includes(':') ? model : `${model}:latest`;
        status = tags.includes(want) || tags.includes(model) ? 'ready' : 'unavailable';
      }
    } else if (provider === 'google') {
      const r = await fetchWithTimeout(`${GOOGLE_BASE()}/models/${encodeURIComponent(model)}`, { headers: { 'x-goog-api-key': config.gemma.googleApiKey } }, 4000);
      status = r.ok ? 'ready' : 'unavailable';
    }
  } catch { status = 'unavailable'; }
  readyCache = { at: Date.now(), status };
  return status;
}

// ---------- core call ----------
// messages: [{role:'system'|'user'|'assistant', content}]
// returns { text, model, provider, latencyMs }
export async function generate(messages, { json = false, temperature = 0.3, maxTokens = 1024, timeoutMs } = {}) {
  const { provider, model } = config.gemma;
  if (provider === 'none' || !model) throw errors.modelUnavailable('Gemma is not configured on the server (set GEMMA_PROVIDER and GEMMA_MODEL)');
  const total = messages.reduce((n, m) => n + m.content.length, 0);
  if (total > MAX_PROMPT_CHARS) throw new AppError('VALIDATION_ERROR', 'Prompt context is too large for the model');
  const started = Date.now();
  const t = timeoutMs || config.gemma.timeoutMs;
  const text = provider === 'ollama'
    ? await callOllama(model, messages, { json, temperature, maxTokens, timeoutMs: t })
    : await callGoogle(model, messages, { json, temperature, maxTokens, timeoutMs: t });
  readyCache = { at: Date.now(), status: 'ready' };
  return { text, model, provider, latencyMs: Date.now() - started };
}

// Ask Gemma for JSON, validate with `check`, and do one automatic repair round if it misbehaves.
export async function generateJson(messages, { check = (x) => x, ...opts } = {}) {
  const first = await generate(messages, { ...opts, json: true });
  try {
    return { data: check(extractJson(first.text)), meta: first };
  } catch (e) {
    const repair = await generate([
      ...messages,
      { role: 'assistant', content: first.text.slice(0, 4000) },
      { role: 'user', content: `Your previous reply was not valid for this reason: ${e.message}. Reply again with ONLY one valid JSON object in the required shape. No markdown, no commentary.` },
    ], { ...opts, json: true });
    return { data: check(extractJson(repair.text)), meta: { ...repair, repaired: true, latencyMs: first.latencyMs + repair.latencyMs } };
  }
}

// Pull the first JSON object out of model text (handles ```json fences and chatter).
export function extractJson(text) {
  let s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(s); } catch { /* fall through */ }
  const start = s.indexOf('{');
  if (start === -1) throw new Error('no JSON object found');
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(s.slice(start, i + 1));
  }
  throw new Error('JSON object was not closed');
}

// ---------- providers ----------
async function callOllama(model, messages, { json, temperature, maxTokens, timeoutMs }) {
  const body = { model, messages, stream: false, options: { temperature, num_predict: maxTokens } };
  if (json) body.format = 'json';
  const r = await safeFetch(`${config.gemma.ollamaUrl}/api/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }, timeoutMs);
  if (r.status === 404) throw errors.modelUnavailable(`Gemma model "${model}" is not pulled in Ollama (run: ollama pull ${model})`);
  if (!r.ok) throw errors.modelUnavailable(`Ollama returned HTTP ${r.status}`);
  const data = await r.json();
  const text = data?.message?.content;
  if (!text) throw errors.modelUnavailable('Gemma returned an empty response');
  return text;
}

async function callGoogle(model, messages, { json, temperature, maxTokens, timeoutMs }) {
  // Gemma on the Gemini API does not support systemInstruction, so system text is folded into the first user turn.
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const convo = messages.filter((m) => m.role !== 'system');
  const contents = [];
  convo.forEach((m, i) => {
    let text = m.content;
    if (i === 0 && system) text = `${system}\n\n---\n\n${text}`;
    const role = m.role === 'assistant' ? 'model' : 'user';
    const last = contents[contents.length - 1];
    if (last && last.role === role) last.parts[0].text += `\n\n${text}`; // API wants alternating roles
    else contents.push({ role, parts: [{ text }] });
  });
  if (json) contents[contents.length - 1].parts[0].text += '\n\nRespond with ONLY a JSON object.';
  const r = await safeFetch(`${GOOGLE_BASE()}/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.gemma.googleApiKey },
    body: JSON.stringify({ contents, generationConfig: { temperature, maxOutputTokens: maxTokens } }),
  }, timeoutMs);
  if (r.status === 429) {
    const ra = Number(r.headers.get('retry-after')) || 30;
    throw new AppError('RATE_LIMITED', 'Gemma API quota reached, try again shortly', { retryAfterSeconds: ra });
  }
  if (r.status === 401 || r.status === 403) throw errors.modelUnavailable('Gemma API key was rejected');
  if (r.status === 404) throw errors.modelUnavailable(`Gemma model "${model}" not found on the Gemini API`);
  if (!r.ok) throw errors.modelUnavailable(`Gemma API returned HTTP ${r.status}`);
  const data = await r.json();
  // Gemma 4 returns its reasoning as separate parts flagged `thought: true`; only the answer parts are the reply.
  const text = data?.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text || '').join('') || '';
  if (!text) throw errors.modelUnavailable(`Gemma returned no text (finishReason: ${data?.candidates?.[0]?.finishReason || 'unknown'})`);
  return text;
}

async function safeFetch(url, opts, timeoutMs) {
  try {
    return await fetchWithTimeout(url, opts, timeoutMs);
  } catch (e) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') throw errors.timeout('Gemma took too long to respond');
    throw errors.modelUnavailable('Could not reach the Gemma runtime');
  }
}

function fetchWithTimeout(url, opts = {}, ms = 10000) {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(ms) });
}

// Tiny schema validator (zod-like) so we have zero extra dependencies.
// Each validator: (value, path) => value | throws {path,message}
import { errors } from './errors.js';

class Issue extends Error { constructor(path, message) { super(message); this.path = path; } }
const fail = (p, m) => { throw new Issue(p, m); };

export const v = {
  string: ({ min = 0, max = 10000, trim = true, pattern, optional, nullable, lower } = {}) => mark((x, p) => {
    if (x === undefined) return optional ? undefined : fail(p, 'is required');
    if (x === null) return nullable ? null : fail(p, 'cannot be null');
    if (typeof x !== 'string') fail(p, 'must be a string');
    let s = trim ? x.trim() : x;
    if (lower) s = s.toLowerCase();
    if (s.length < min) fail(p, min === 1 ? 'cannot be empty' : `must be at least ${min} characters`);
    if (s.length > max) fail(p, `must be at most ${max} characters`);
    if (pattern && !pattern.test(s)) fail(p, 'has an invalid format');
    return s;
  }, optional),
  email: (o = {}) => v.string({ ...o, max: 254, lower: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/ }),
  url: ({ optional, nullable } = {}) => mark((x, p) => {
    if (x === undefined) return optional ? undefined : fail(p, 'is required');
    if (x === null || x === '') return nullable ? null : fail(p, 'cannot be empty');
    if (typeof x !== 'string' || x.length > 2000) fail(p, 'must be a URL');
    let u; try { u = new URL(x); } catch { fail(p, 'must be a valid URL'); }
    if (!['http:', 'https:'].includes(u.protocol)) fail(p, 'must be http(s)');
    return u.toString();
  }, optional),
  enum: (values, { optional } = {}) => mark((x, p) => {
    if (x === undefined) return optional ? undefined : fail(p, 'is required');
    if (!values.includes(x)) fail(p, `must be one of: ${values.join(', ')}`);
    return x;
  }, optional),
  int: ({ min = -Infinity, max = Infinity, optional, nullable } = {}) => mark((x, p) => {
    if (x === undefined) return optional ? undefined : fail(p, 'is required');
    if (x === null) return nullable ? null : fail(p, 'cannot be null');
    const n = typeof x === 'string' && x.trim() !== '' ? Number(x) : x;
    if (!Number.isInteger(n)) fail(p, 'must be an integer');
    if (n < min || n > max) fail(p, `must be between ${min} and ${max}`);
    return n;
  }, optional),
  bool: ({ optional } = {}) => mark((x, p) => {
    if (x === undefined) return optional ? undefined : fail(p, 'is required');
    if (x === 'true') return true; if (x === 'false') return false;
    if (typeof x !== 'boolean') fail(p, 'must be true or false');
    return x;
  }, optional),
  date: ({ optional, nullable } = {}) => mark((x, p) => {
    if (x === undefined) return optional ? undefined : fail(p, 'is required');
    if (x === null) return nullable ? null : fail(p, 'cannot be null');
    if (typeof x !== 'string' || Number.isNaN(Date.parse(x))) fail(p, 'must be an ISO 8601 date');
    const d = new Date(x);
    if (d.getTime() > Date.now() + 24 * 3600e3) fail(p, 'cannot be in the future');
    if (d.getUTCFullYear() < 1990) fail(p, 'is too far in the past');
    return d.toISOString();
  }, optional),
  array: (item, { max = 100, optional, unique } = {}) => mark((x, p) => {
    if (x === undefined) return optional ? undefined : fail(p, 'is required');
    if (!Array.isArray(x)) fail(p, 'must be an array');
    if (x.length > max) fail(p, `can have at most ${max} items`);
    let out = x.map((el, i) => item(el, `${p}[${i}]`));
    if (unique) out = [...new Map(out.map((e) => [String(e).toLowerCase(), e])).values()];
    return out;
  }, optional),
  object: (shape, { optional, partial, strict = true, nullable } = {}) => mark((x, p) => {
    if (x === undefined) return optional ? undefined : fail(p, 'is required');
    if (x === null) return nullable ? null : fail(p, 'cannot be null');
    if (typeof x !== 'object' || x === null || Array.isArray(x)) fail(p, 'must be an object');
    if (strict) for (const k of Object.keys(x)) if (!(k in shape)) fail(p ? `${p}.${k}` : k, 'is not an allowed field');
    const out = {};
    for (const [k, fn] of Object.entries(shape)) {
      const path = p ? `${p}.${k}` : k;
      if (partial && x[k] === undefined) continue;
      const val = fn(x[k], path);
      if (val !== undefined) out[k] = val;
    }
    return out;
  }, optional),
};

function mark(fn, optional) { fn.optional = !!optional; return fn; }

// Run a schema; throw a contract VALIDATION_ERROR listing every problem we can find.
export function parse(schema, value, label = 'body') {
  try {
    return schema(value, '');
  } catch (e) {
    if (e instanceof Issue) {
      const field = e.path || label;
      throw errors.validation(`${field} ${e.message}`, [{ field, message: e.message }]);
    }
    throw e;
  }
}

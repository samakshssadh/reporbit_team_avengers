// Transparent, deterministic issue ↔ student matching. Every point is explained in `ranking.breakdown`.
// Gemma is NOT used to rank (no invented confidence %). Gemma explains + mentors on top of these facts.
import { githubLanguagesFor, skillForGithubLanguage, skillsMentioned, skillInfo } from './skillGraph.js';

export const WEIGHTS = {
  languageMatch: 30,      // repo/search language is one the student knows
  mentionedSkillMatch: 4, // per known skill mentioned in the issue (cap 12)
  beginnerLabel: 20,      // "good first issue", "beginner", "first-timers-only", "easy"
  helpWanted: 5,
  docsLabel: 5,           // docs issues are a gentle start
  freshness: 15,          // updated recently (linear decay to 0 at 90 days)
  quietThread: 8,         // 0–5 comments: less chance someone already took it
  clearBody: 7,           // body > 300 chars or has steps/expected/actual sections
  gapPenalty: -6,         // per prerequisite the student doesn't have (cap -18)
  busyThreadPenalty: -10, // > 15 comments
  stalePenalty: -10,      // not updated for > 1 year
};
export const MIN_SCORE = 20; // weaker candidates are omitted

const BEGINNER = ['good first issue', 'good-first-issue', 'beginner', 'beginner friendly', 'first-timers-only', 'easy', 'starter', 'newcomer', 'level: beginner', 'difficulty: easy'];
const HARD = ['difficulty: hard', 'hard', 'complex', 'advanced', 'expert', 'needs design', 'breaking change'];

export function scoreIssue(issue, { repoLanguages = [], userSkills = [], experience = 'beginner', now = new Date() }) {
  const known = new Map(userSkills.map((s) => [s.slug, s]));
  const labels = issue.labels.map((l) => l.toLowerCase());
  const text = `${issue.title}\n${issue.body || ''}\n${issue.labels.join(' ')}`;
  const breakdown = {};
  const fitReasons = [];
  const uncertainty = [];

  // language
  const repoSkillSlugs = repoLanguages.map(skillForGithubLanguage).filter(Boolean);
  const userLangs = new Set(githubLanguagesFor([...known.keys()]).map((l) => l.toLowerCase()));
  const langHits = repoLanguages.filter((l) => userLangs.has(l.toLowerCase()));
  if (langHits.length) { breakdown.languageMatch = WEIGHTS.languageMatch; fitReasons.push(`Uses ${langHits.join(', ')}, which you know`); }

  // skills mentioned in the issue
  const mentioned = skillsMentioned(text);
  const matched = [...new Set([...mentioned.filter((s) => known.has(s)), ...repoSkillSlugs.filter((s) => known.has(s))])];
  const mentionedKnown = mentioned.filter((s) => known.has(s));
  if (mentionedKnown.length) {
    breakdown.mentionedSkillMatch = Math.min(12, mentionedKnown.length * WEIGHTS.mentionedSkillMatch);
    fitReasons.push(`Mentions ${mentionedKnown.map((s) => skillInfo(s)?.name || s).join(', ')} from your profile`);
  }
  const gaps = mentioned.filter((s) => !known.has(s));
  if (gaps.length) breakdown.gapPenalty = Math.max(-18, gaps.length * WEIGHTS.gapPenalty);

  // labels
  if (labels.some((l) => BEGINNER.includes(l))) { breakdown.beginnerLabel = WEIGHTS.beginnerLabel; fitReasons.push('Maintainers labelled it as beginner-friendly'); }
  if (labels.some((l) => l.includes('help wanted'))) { breakdown.helpWanted = WEIGHTS.helpWanted; fitReasons.push('Maintainers asked for help'); }
  if (labels.some((l) => l.includes('doc'))) { breakdown.docsLabel = WEIGHTS.docsLabel; fitReasons.push('Documentation task — a gentle first contribution'); }

  // freshness
  const ageDays = (new Date(now) - new Date(issue.updatedAt)) / 86400e3;
  if (ageDays <= 90) breakdown.freshness = Math.round(WEIGHTS.freshness * (1 - ageDays / 90));
  if (ageDays <= 14) fitReasons.push('Active in the last two weeks');
  if (ageDays > 365) { breakdown.stalePenalty = WEIGHTS.stalePenalty; uncertainty.push('No activity for over a year — the issue may be outdated'); }

  // discussion
  if (issue.comments <= 5) breakdown.quietThread = WEIGHTS.quietThread;
  if (issue.comments > 15) { breakdown.busyThreadPenalty = WEIGHTS.busyThreadPenalty; uncertainty.push(`${issue.comments} comments — someone may already be working on it`); }
  if (issue.comments > 0) uncertainty.push('Read the comments: another contributor may have claimed it without being assigned');

  // clarity
  const body = issue.body || '';
  if (body.length > 300 || /(steps to reproduce|expected|actual behaviou?r|acceptance criteria|to do|todo)/i.test(body)) breakdown.clearBody = WEIGHTS.clearBody;
  if (!body.trim()) uncertainty.push('The issue has no description');
  if (issue.locked) uncertainty.push('The conversation is locked');

  uncertainty.push('Unassigned does not guarantee the issue is available or that a PR will be accepted');

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const difficulty = estimateDifficulty({ labels, body, gaps, comments: issue.comments, experience });

  return {
    matchedSkills: matched.map((s) => skillInfo(s)?.name || s),
    prerequisiteGaps: gaps.map((s) => skillInfo(s)?.name || s),
    fitReasons,
    difficulty,
    uncertainty,
    ranking: { score, breakdown },
  };
}

export function estimateDifficulty({ labels, body = '', gaps = [], comments = 0 }) {
  const why = [];
  let level = 'unknown';
  if (labels.some((l) => HARD.includes(l))) { level = 'advanced'; why.push('labelled as hard/advanced'); }
  else if (labels.some((l) => BEGINNER.includes(l))) {
    level = 'beginner'; why.push('beginner label from maintainers');
    if (gaps.length >= 2) { level = 'intermediate'; why.push(`but needs ${gaps.length} skills you don't list yet`); }
    if (body.length > 3000) { level = 'intermediate'; why.push('long, detailed description'); }
  } else if (labels.some((l) => l.includes('doc'))) { level = 'beginner'; why.push('documentation change'); }
  else if (gaps.length >= 3 || comments > 20) { level = 'intermediate'; why.push(gaps.length >= 3 ? 'several unfamiliar technologies' : 'long discussion'); }
  if (level === 'unknown') why.push('not enough signals to judge');
  return { level, rationale: `Estimated from labels and issue text: ${why.join('; ')}. Not verified against the code.` };
}

export function firstStepFor(issue, sourceIds) {
  return {
    text: issue.comments > 0
      ? 'Read the issue and all its comments, then comment to ask a maintainer whether it is still open for you to work on.'
      : 'Read the issue carefully, then comment to say you would like to work on it and confirm your understanding.',
    sourceIds,
  };
}

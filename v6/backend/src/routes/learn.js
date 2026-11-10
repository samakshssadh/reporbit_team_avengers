// Learn progress: tick off stages; finishing every stage of a language (or Git) adds it to the tech stack as "learned".
import { query, tx } from '../db/pool.js';
import { v, parse } from '../lib/validate.js';
import { requireAuth, requireCsrf } from '../lib/session.js';
import { resolveSkill } from '../services/skillGraph.js';
import { insertSkill, logEvent } from './profile.js';

export function learnRoutes(r) {
  r.get('/api/me/learn/progress', requireAuth, async (req, res) => {
    const { rows } = await query('SELECT subject, stage_id FROM learn_progress WHERE user_id = $1', [req.user.id]);
    const subjects = {};
    for (const x of rows) (subjects[x.subject] ||= []).push(x.stage_id);
    const { rows: learned } = await query("SELECT name, slug FROM skills WHERE user_id = $1 AND status = 'learned'", [req.user.id]);
    res.json({ subjects, learnedSkills: learned.map((s) => s.name) });
  });

  r.post('/api/me/learn/progress', requireAuth, requireCsrf, async (req, res) => {
    const b = parse(v.object({
      subject: v.string({ min: 1, max: 60 }),
      stageId: v.string({ min: 1, max: 80 }),
      done: v.bool(),
      totalStages: v.int({ min: 1, max: 50 }),
      // Optional: the current stage ids. Only these count, so stages from an older version of a course are ignored.
      stageIds: v.array(v.string({ min: 1, max: 80 }), { max: 50, optional: true }),
    }), req.body);
    const skill = resolveSkill(b.subject);
    const subject = skill.name;
    const out = await tx(async (c) => {
      if (b.done) await c.query('INSERT INTO learn_progress (user_id, subject, stage_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [req.user.id, subject, b.stageId]);
      else await c.query('DELETE FROM learn_progress WHERE user_id = $1 AND subject = $2 AND stage_id = $3', [req.user.id, subject, b.stageId]);
      const { rows } = await c.query('SELECT stage_id, completed_at FROM learn_progress WHERE user_id = $1 AND subject = $2 ORDER BY completed_at', [req.user.id, subject]);
      const doneIds = new Set(rows.map((x) => x.stage_id));
      const completed = b.stageIds?.length ? b.stageIds.every((id) => doneIds.has(id)) : rows.length >= b.totalStages;
      let addedToStack = false, upgraded = false;
      if (completed) {
        const { rows: ex } = await c.query('SELECT * FROM skills WHERE user_id = $1 AND slug = $2 FOR UPDATE', [req.user.id, skill.slug]);
        const today = new Date().toISOString().slice(0, 10);
        if (!ex.length) {
          await insertSkill(c, req.user.id, { name: subject, status: 'learned', proficiency: 3, startedAt: new Date(rows[0].completed_at).toISOString(), learnedAt: new Date().toISOString(), notes: 'Completed the Reporbit Learn path' });
          addedToStack = true;
        } else if (ex[0].status !== 'learned') {
          const s = ex[0];
          const { rows: [up] } = await c.query(
            "UPDATE skills SET status = 'learned', learned_at = GREATEST($1::date, started_at), proficiency = GREATEST(proficiency, 3), updated_at = now() WHERE id = $2 RETURNING *", [today, s.id]);
          await logEvent(c, req.user.id, up, 'learned', s.proficiency, up.proficiency, 'Completed the Reporbit Learn path');
          upgraded = true;
        }
      }
      return { subject, completedStages: rows.map((x) => x.stage_id), totalStages: b.totalStages, completed, addedToStack, upgraded };
    });
    res.json(out);
  });
}

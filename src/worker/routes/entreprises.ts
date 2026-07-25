import { Hono } from 'hono';
import type { Env } from '../index';

export const entreprisesRoutes = new Hono<{ Bindings: Env }>();

entreprisesRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, nom, created_at, updated_at FROM entreprises ORDER BY nom'
  ).all();
  return c.json(results);
});

entreprisesRoutes.post('/', async (c) => {
  const body = await c.req.json<{ nom?: string }>().catch(() => null);
  if (!body || !body.nom) return c.json({ error: "Le nom de l'entreprise est requis" }, 400);

  const result = await c.env.DB.prepare('INSERT INTO entreprises (nom) VALUES (?)').bind(body.nom).run();
  const entreprise = await c.env.DB.prepare('SELECT id, nom, created_at, updated_at FROM entreprises WHERE id = ?')
    .bind(result.meta.last_row_id).first();
  return c.json(entreprise, 201);
});

entreprisesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const entreprise = await c.env.DB.prepare('SELECT id, nom, created_at, updated_at FROM entreprises WHERE id = ?')
    .bind(id).first();
  if (!entreprise) return c.json({ error: 'Entreprise introuvable' }, 404);
  return c.json(entreprise);
});

entreprisesRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ nom?: string }>().catch(() => null);
  if (!body) return c.json({ error: 'Corps JSON invalide' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM entreprises WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'Entreprise introuvable' }, 404);

  await c.env.DB.prepare(
    "UPDATE entreprises SET nom = COALESCE(?, nom), updated_at = datetime('now') WHERE id = ?"
  ).bind(body.nom ?? null, id).run();

  const entreprise = await c.env.DB.prepare('SELECT id, nom, created_at, updated_at FROM entreprises WHERE id = ?')
    .bind(id).first();
  return c.json(entreprise);
});

entreprisesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM entreprises WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

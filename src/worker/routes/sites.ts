import { Hono } from 'hono';
import type { Env } from '../index';

export const sitesRoutes = new Hono<{ Bindings: Env }>();

sitesRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, nom, adresse, created_at, updated_at FROM sites ORDER BY nom'
  ).all();
  return c.json(results);
});

sitesRoutes.post('/', async (c) => {
  const body = await c.req.json<{ nom?: string; adresse?: string }>().catch(() => null);
  if (!body || !body.nom) return c.json({ error: 'Le nom du site est requis' }, 400);

  const result = await c.env.DB.prepare(
    'INSERT INTO sites (nom, adresse) VALUES (?, ?)'
  ).bind(body.nom, body.adresse ?? null).run();

  const site = await c.env.DB.prepare('SELECT id, nom, adresse, created_at, updated_at FROM sites WHERE id = ?')
    .bind(result.meta.last_row_id).first();
  return c.json(site, 201);
});

sitesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const site = await c.env.DB.prepare('SELECT id, nom, adresse, created_at, updated_at FROM sites WHERE id = ?')
    .bind(id).first();
  if (!site) return c.json({ error: 'Site introuvable' }, 404);
  return c.json(site);
});

sitesRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ nom?: string; adresse?: string }>().catch(() => null);
  if (!body) return c.json({ error: 'Corps JSON invalide' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM sites WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'Site introuvable' }, 404);

  await c.env.DB.prepare(
    "UPDATE sites SET nom = COALESCE(?, nom), adresse = COALESCE(?, adresse), updated_at = datetime('now') WHERE id = ?"
  ).bind(body.nom ?? null, body.adresse ?? null, id).run();

  const site = await c.env.DB.prepare('SELECT id, nom, adresse, created_at, updated_at FROM sites WHERE id = ?')
    .bind(id).first();
  return c.json(site);
});

sitesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM sites WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

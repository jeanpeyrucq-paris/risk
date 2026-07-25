import { Hono } from 'hono';
import type { Env } from '../index';

export const famillesRisquesRoutes = new Hono<{ Bindings: Env }>();

famillesRisquesRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, libelle, ordre FROM familles_risques ORDER BY ordre'
  ).all();
  return c.json(results);
});

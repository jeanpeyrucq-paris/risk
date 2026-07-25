import { Hono } from 'hono';
import type { Env } from '../index';

export const inrsCategoriesRoutes = new Hono<{ Bindings: Env }>();

inrsCategoriesRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, code, libelle, ordre FROM inrs_categories ORDER BY ordre'
  ).all();
  return c.json(results);
});

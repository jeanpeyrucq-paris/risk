import { Hono } from 'hono';
import { inrsCategoriesRoutes } from './routes/inrs-categories';
import { sitesRoutes } from './routes/sites';
import { planPreventionRoutes, planPreventionDocRoutes } from './routes/plan-prevention';
import { entreprisesRoutes } from './routes/entreprises';
import { duerRoutes, duerDocRoutes } from './routes/duer';
import { famillesRisquesRoutes } from './routes/familles-risques';
import {
  modesOperatoiresSiteRoutes,
  modesOperatoiresRoutes,
  moTachesRoutes,
  moAnalyseLignesRoutes
} from './routes/modes-operatoires';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = '/index.html';
  return c.env.ASSETS.fetch(new Request(url.toString(), c.req.raw));
});

app.get('/api/health', (c) => c.json({ ok: true }));

app.route('/api/inrs-categories', inrsCategoriesRoutes);
app.route('/api/sites', sitesRoutes);
app.route('/api/sites', planPreventionRoutes);
app.route('/api/plan-prevention', planPreventionDocRoutes);
app.route('/api/entreprises', entreprisesRoutes);
app.route('/api/entreprises', duerRoutes);
app.route('/api/duer', duerDocRoutes);
app.route('/api/familles-risques', famillesRisquesRoutes);
app.route('/api/sites', modesOperatoiresSiteRoutes);
app.route('/api/modes-operatoires', modesOperatoiresRoutes);
app.route('/api/mo-taches', moTachesRoutes);
app.route('/api/mo-analyse-lignes', moAnalyseLignesRoutes);

app.notFound((c) => c.json({ error: 'Route API inconnue' }, 404));

export default app;

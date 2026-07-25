import { Hono } from 'hono';
import type { Env } from '../index';
import { fromJsonArray } from '../json-utils';
import { buildAnalyseComparisonWorkbook } from '../xlsx-analyse-export';
import { workbookToBuffer } from '../xlsx-export';

// Mounted at /api/sites — handles /:siteId/analyses
export const analysesSiteRoutes = new Hono<{ Bindings: Env }>();
// Mounted at /api/analyses — handles /:id, /:id/items/:inrsCategoryId, /:id/export
export const analysesRoutes = new Hono<{ Bindings: Env }>();

function analyseRow(a: any) {
  return {
    id: a.id,
    site_id: a.site_id,
    entreprise_id: a.entreprise_id,
    site_nom: a.site_nom,
    entreprise_nom: a.entreprise_nom,
    created_at: a.created_at,
    updated_at: a.updated_at
  };
}

async function latestDocumentId(db: D1Database, table: string, fkColumn: string, fkValue: number): Promise<number | null> {
  const row = await db.prepare(
    `SELECT id FROM ${table} WHERE ${fkColumn} = ? ORDER BY imported_at DESC LIMIT 1`
  ).bind(fkValue).first<{ id: number }>();
  return row ? row.id : null;
}

export async function loadAnalyseDetail(db: D1Database, analyseId: number) {
  const analyse = await db.prepare(
    `SELECT a.*, s.nom as site_nom, e.nom as entreprise_nom
     FROM analyses a JOIN sites s ON s.id = a.site_id JOIN entreprises e ON e.id = a.entreprise_id
     WHERE a.id = ?`
  ).bind(analyseId).first<any>();
  if (!analyse) return null;

  const ppDocId = await latestDocumentId(db, 'plan_prevention_documents', 'site_id', analyse.site_id);
  const duerDocId = await latestDocumentId(db, 'duer_documents', 'entreprise_id', analyse.entreprise_id);

  const ppLignesByCategory = new Map<number, any[]>();
  if (ppDocId) {
    const { results } = await db.prepare(
      `SELECT ppl.*, ppr.titre as rubrique_titre
       FROM plan_prevention_lignes ppl
       JOIN plan_prevention_rubriques ppr ON ppr.id = ppl.rubrique_id
       WHERE ppr.document_id = ? AND ppl.concerne = 1 AND ppr.concerne = 1 AND ppl.inrs_category_id IS NOT NULL`
    ).bind(ppDocId).all<any>();
    for (const l of results) {
      const list = ppLignesByCategory.get(l.inrs_category_id) ?? [];
      list.push({
        rubrique_titre: l.rubrique_titre,
        dangers: fromJsonArray(l.dangers_json),
        risques: fromJsonArray(l.risques_json),
        moyens_prevention: fromJsonArray(l.moyens_prevention_json)
      });
      ppLignesByCategory.set(l.inrs_category_id, list);
    }
  }

  const duerTachesByCategory = new Map<number, any[]>();
  if (duerDocId) {
    const { results } = await db.prepare(
      `SELECT * FROM duer_taches WHERE document_id = ? AND inrs_category_id IS NOT NULL`
    ).bind(duerDocId).all<any>();
    for (const t of results) {
      const list = duerTachesByCategory.get(t.inrs_category_id) ?? [];
      list.push({
        principales_operations: t.principales_operations,
        facteur_exposition: t.facteur_exposition,
        epc_epi: fromJsonArray(t.epc_epi_json),
        mesures_organisationnelles: fromJsonArray(t.mesures_organisationnelles_json),
        formation_specifique: fromJsonArray(t.formation_specifique_json)
      });
      duerTachesByCategory.set(t.inrs_category_id, list);
    }
  }

  const { results: items } = await db.prepare(
    'SELECT * FROM analyse_items WHERE analyse_id = ?'
  ).bind(analyseId).all<any>();
  const itemsByCategory = new Map<number, any>(items.map((i) => [i.inrs_category_id, i]));

  const { results: categories } = await db.prepare(
    'SELECT * FROM inrs_categories ORDER BY ordre'
  ).all<any>();

  const comparisons = [];
  for (const cat of categories) {
    const ppLignes = ppLignesByCategory.get(cat.id);
    if (!ppLignes || ppLignes.length === 0) continue;
    const duerTaches = duerTachesByCategory.get(cat.id) ?? [];
    const item = itemsByCategory.get(cat.id);
    comparisons.push({
      inrs_category: { id: cat.id, code: cat.code, libelle: cat.libelle },
      mesures_plan_prevention: ppLignes,
      mesures_duer: duerTaches,
      couverture: duerTaches.length > 0 ? 'couvert' : 'non_traite_duer',
      procedure_source: item?.procedure_source ?? null,
      analyse_hse: item?.analyse_hse ?? null,
      statut_procedure_client: item?.statut_procedure_client ?? null
    });
  }

  return {
    ...analyseRow(analyse),
    plan_prevention_document_id: ppDocId,
    duer_document_id: duerDocId,
    comparisons
  };
}

analysesSiteRoutes.get('/:siteId/analyses', async (c) => {
  const siteId = c.req.param('siteId');
  const { results } = await c.env.DB.prepare(
    `SELECT a.*, s.nom as site_nom, e.nom as entreprise_nom
     FROM analyses a JOIN sites s ON s.id = a.site_id JOIN entreprises e ON e.id = a.entreprise_id
     WHERE a.site_id = ? ORDER BY a.created_at DESC`
  ).bind(siteId).all<any>();
  return c.json(results.map(analyseRow));
});

analysesSiteRoutes.post('/:siteId/analyses', async (c) => {
  const siteId = c.req.param('siteId');
  const body = await c.req.json<{ entreprise_id?: number }>().catch(() => null);
  if (!body || !body.entreprise_id) return c.json({ error: "L'entreprise est requise" }, 400);

  const site = await c.env.DB.prepare('SELECT id FROM sites WHERE id = ?').bind(siteId).first();
  if (!site) return c.json({ error: 'Site introuvable' }, 404);
  const entreprise = await c.env.DB.prepare('SELECT id FROM entreprises WHERE id = ?').bind(body.entreprise_id).first();
  if (!entreprise) return c.json({ error: 'Entreprise introuvable' }, 404);

  const ppDocId = await latestDocumentId(c.env.DB, 'plan_prevention_documents', 'site_id', Number(siteId));
  if (!ppDocId) return c.json({ error: "Ce site n'a pas encore de plan de prevention importe (module A)" }, 400);
  const duerDocId = await latestDocumentId(c.env.DB, 'duer_documents', 'entreprise_id', body.entreprise_id);
  if (!duerDocId) return c.json({ error: "Cette entreprise n'a pas encore de DUER importe (module B)" }, 400);

  const existing = await c.env.DB.prepare(
    'SELECT id FROM analyses WHERE site_id = ? AND entreprise_id = ?'
  ).bind(siteId, body.entreprise_id).first<{ id: number }>();

  let analyseId: number;
  if (existing) {
    analyseId = existing.id;
  } else {
    const result = await c.env.DB.prepare(
      'INSERT INTO analyses (site_id, entreprise_id) VALUES (?, ?) RETURNING id'
    ).bind(siteId, body.entreprise_id).first<{ id: number }>();
    analyseId = result!.id;
  }

  const full = await loadAnalyseDetail(c.env.DB, analyseId);
  return c.json(full, existing ? 200 : 201);
});

analysesRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const full = await loadAnalyseDetail(c.env.DB, id);
  if (!full) return c.json({ error: 'Analyse introuvable' }, 404);
  return c.json(full);
});

analysesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM analyses WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

analysesRoutes.patch('/:id/items/:inrsCategoryId', async (c) => {
  const analyseId = c.req.param('id');
  const inrsCategoryId = c.req.param('inrsCategoryId');

  const analyse = await c.env.DB.prepare('SELECT id FROM analyses WHERE id = ?').bind(analyseId).first();
  if (!analyse) return c.json({ error: 'Analyse introuvable' }, 404);

  const body = await c.req.json<{
    procedure_source?: 'cbre' | 'client' | null;
    analyse_hse?: string | null;
    statut_procedure_client?: 'acceptee' | 'refusee' | 'en_attente' | null;
  }>().catch(() => null);
  if (!body) return c.json({ error: 'Corps JSON invalide' }, 400);

  const existing = await c.env.DB.prepare(
    'SELECT * FROM analyse_items WHERE analyse_id = ? AND inrs_category_id = ?'
  ).bind(analyseId, inrsCategoryId).first<any>();

  if (existing) {
    await c.env.DB.prepare(
      `UPDATE analyse_items SET procedure_source = ?, analyse_hse = ?, statut_procedure_client = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).bind(
      body.procedure_source !== undefined ? body.procedure_source : existing.procedure_source,
      body.analyse_hse !== undefined ? body.analyse_hse : existing.analyse_hse,
      body.statut_procedure_client !== undefined ? body.statut_procedure_client : existing.statut_procedure_client,
      existing.id
    ).run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO analyse_items (analyse_id, inrs_category_id, procedure_source, analyse_hse, statut_procedure_client)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      analyseId, inrsCategoryId,
      body.procedure_source ?? null, body.analyse_hse ?? null, body.statut_procedure_client ?? null
    ).run();
  }

  const item = await c.env.DB.prepare(
    'SELECT * FROM analyse_items WHERE analyse_id = ? AND inrs_category_id = ?'
  ).bind(analyseId, inrsCategoryId).first<any>();
  return c.json({
    inrs_category_id: item.inrs_category_id,
    procedure_source: item.procedure_source,
    analyse_hse: item.analyse_hse,
    statut_procedure_client: item.statut_procedure_client,
    updated_at: item.updated_at
  });
});

analysesRoutes.get('/:id/export', async (c) => {
  const id = Number(c.req.param('id'));
  const full = await loadAnalyseDetail(c.env.DB, id);
  if (!full) return c.json({ error: 'Analyse introuvable' }, 404);

  const wb = buildAnalyseComparisonWorkbook(full);
  const buf = workbookToBuffer(wb);
  const filename = `analyse-${(full.site_nom || 'site').replace(/[^a-z0-9]+/gi, '-')}.xlsx`;

  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
});

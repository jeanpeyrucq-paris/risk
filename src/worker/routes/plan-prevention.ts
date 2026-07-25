import { Hono } from 'hono';
import type { Env } from '../index';
import { toJsonArray, fromJsonArray, toBoolInt } from '../json-utils';
import { buildPlanPreventionWorkbook, workbookToBuffer, loadInrsMap } from '../xlsx-export';

// Mounted at /api/sites — handles /:siteId/plan-prevention*
export const planPreventionRoutes = new Hono<{ Bindings: Env }>();
// Mounted at /api/plan-prevention — handles /documents/:docId, /rubriques/:id, /lignes/:id
export const planPreventionDocRoutes = new Hono<{ Bindings: Env }>();

interface ImportLigne {
  dangers?: string[];
  concerne?: boolean;
  risques?: string[];
  entreprises_concernees?: string;
  moyens_prevention?: string[];
}
interface ImportRubrique {
  titre: string;
  concerne?: boolean;
  page_source?: string | number;
  type?: string;
  lignes?: ImportLigne[];
  gestion_dechets?: unknown;
  [key: string]: unknown;
}
interface ImportPayload {
  document?: {
    titre?: string; numero?: string; reglementation?: string; source_pdf?: string; date_extraction?: string;
  };
  conditions_intervention?: unknown;
  plan_prevention?: { rubriques?: ImportRubrique[] };
}

function ligneRow(r: any) {
  return {
    id: r.id,
    ordre: r.ordre,
    dangers: fromJsonArray(r.dangers_json),
    concerne: !!r.concerne,
    risques: fromJsonArray(r.risques_json),
    entreprises_concernees: r.entreprises_concernees,
    moyens_prevention: fromJsonArray(r.moyens_prevention_json),
    inrs_category_id: r.inrs_category_id
  };
}

function rubriqueRow(r: any) {
  return {
    id: r.id,
    ordre: r.ordre,
    titre: r.titre,
    concerne: !!r.concerne,
    page_source: r.page_source,
    type: r.type,
    gestion_dechets: r.gestion_dechets_json ? JSON.parse(r.gestion_dechets_json) : null
  };
}

async function loadDocument(db: D1Database, documentId: number) {
  const doc = await db.prepare('SELECT * FROM plan_prevention_documents WHERE id = ?').bind(documentId).first<any>();
  if (!doc) return null;

  const { results: rubriques } = await db.prepare(
    'SELECT * FROM plan_prevention_rubriques WHERE document_id = ? ORDER BY ordre'
  ).bind(documentId).all<any>();

  const rubriquesOut = [];
  for (const rub of rubriques) {
    const { results: lignes } = await db.prepare(
      'SELECT * FROM plan_prevention_lignes WHERE rubrique_id = ? ORDER BY ordre'
    ).bind(rub.id).all<any>();
    rubriquesOut.push({ ...rubriqueRow(rub), lignes: lignes.map(ligneRow) });
  }

  return {
    id: doc.id,
    site_id: doc.site_id,
    titre: doc.titre,
    numero: doc.numero,
    reglementation: doc.reglementation,
    source_pdf: doc.source_pdf,
    date_extraction: doc.date_extraction,
    conditions_intervention: doc.conditions_intervention_json ? JSON.parse(doc.conditions_intervention_json) : null,
    imported_at: doc.imported_at,
    rubriques: rubriquesOut
  };
}

planPreventionRoutes.post('/:siteId/plan-prevention/import', async (c) => {
  const siteId = c.req.param('siteId');
  const site = await c.env.DB.prepare('SELECT id FROM sites WHERE id = ?').bind(siteId).first();
  if (!site) return c.json({ error: 'Site introuvable' }, 404);

  const payload = await c.req.json<ImportPayload>().catch(() => null);
  if (!payload || !payload.plan_prevention || !Array.isArray(payload.plan_prevention.rubriques)) {
    return c.json({ error: "JSON invalide : champ plan_prevention.rubriques[] attendu" }, 400);
  }

  const doc = payload.document ?? {};
  const docResult = await c.env.DB.prepare(
    `INSERT INTO plan_prevention_documents
      (site_id, titre, numero, reglementation, source_pdf, date_extraction, conditions_intervention_json, raw_import_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(
    siteId, doc.titre ?? null, doc.numero ?? null, doc.reglementation ?? null, doc.source_pdf ?? null,
    doc.date_extraction ?? null,
    payload.conditions_intervention ? JSON.stringify(payload.conditions_intervention) : null,
    JSON.stringify(payload)
  ).first<{ id: number }>();

  const documentId = docResult!.id;

  let rubriqueCount = 0;
  let ligneCount = 0;

  for (let i = 0; i < payload.plan_prevention.rubriques.length; i++) {
    const rub = payload.plan_prevention.rubriques[i];
    const isGestionDechets = rub.type === 'gestion_dechets';

    const rubResult = await c.env.DB.prepare(
      `INSERT INTO plan_prevention_rubriques (document_id, ordre, titre, concerne, page_source, type, gestion_dechets_json)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`
    ).bind(
      documentId, i, rub.titre, toBoolInt(rub.concerne ?? true),
      rub.page_source != null ? String(rub.page_source) : null,
      isGestionDechets ? 'gestion_dechets' : null,
      isGestionDechets ? JSON.stringify((rub as any).gestion_dechets ?? {}) : null
    ).first<{ id: number }>();

    rubriqueCount++;
    const rubriqueId = rubResult!.id;

    if (!isGestionDechets && Array.isArray(rub.lignes)) {
      for (let j = 0; j < rub.lignes.length; j++) {
        const l = rub.lignes[j];
        await c.env.DB.prepare(
          `INSERT INTO plan_prevention_lignes (rubrique_id, ordre, dangers_json, concerne, risques_json, entreprises_concernees, moyens_prevention_json)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          rubriqueId, j, toJsonArray(l.dangers), toBoolInt(l.concerne ?? true), toJsonArray(l.risques),
          l.entreprises_concernees ?? null, toJsonArray(l.moyens_prevention)
        ).run();
        ligneCount++;
      }
    }
  }

  const fullDoc = await loadDocument(c.env.DB, documentId);
  return c.json({ imported: { rubriques: rubriqueCount, lignes: ligneCount }, document: fullDoc }, 201);
});

planPreventionRoutes.get('/:siteId/plan-prevention', async (c) => {
  const siteId = c.req.param('siteId');
  const doc = await c.env.DB.prepare(
    'SELECT id FROM plan_prevention_documents WHERE site_id = ? ORDER BY imported_at DESC LIMIT 1'
  ).bind(siteId).first<{ id: number }>();
  if (!doc) return c.json({ error: 'Aucun plan de prevention importe pour ce site' }, 404);

  const full = await loadDocument(c.env.DB, doc.id);
  return c.json(full);
});

planPreventionDocRoutes.get('/documents/:docId', async (c) => {
  const docId = Number(c.req.param('docId'));
  const full = await loadDocument(c.env.DB, docId);
  if (!full) return c.json({ error: 'Document introuvable' }, 404);
  return c.json(full);
});

planPreventionDocRoutes.patch('/rubriques/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ titre?: string; concerne?: boolean }>().catch(() => null);
  if (!body) return c.json({ error: 'Corps JSON invalide' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM plan_prevention_rubriques WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'Rubrique introuvable' }, 404);

  await c.env.DB.prepare(
    'UPDATE plan_prevention_rubriques SET titre = COALESCE(?, titre), concerne = COALESCE(?, concerne) WHERE id = ?'
  ).bind(body.titre ?? null, body.concerne != null ? toBoolInt(body.concerne) : null, id).run();

  const rub = await c.env.DB.prepare('SELECT * FROM plan_prevention_rubriques WHERE id = ?').bind(id).first<any>();
  return c.json(rubriqueRow(rub));
});

planPreventionDocRoutes.post('/rubriques/:id/lignes', async (c) => {
  const rubriqueId = c.req.param('id');
  const rub = await c.env.DB.prepare('SELECT id FROM plan_prevention_rubriques WHERE id = ?').bind(rubriqueId).first();
  if (!rub) return c.json({ error: 'Rubrique introuvable' }, 404);

  const body = await c.req.json<ImportLigne>().catch(() => ({} as ImportLigne));
  const { count } = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM plan_prevention_lignes WHERE rubrique_id = ?'
  ).bind(rubriqueId).first<{ count: number }>() ?? { count: 0 };

  const result = await c.env.DB.prepare(
    `INSERT INTO plan_prevention_lignes (rubrique_id, ordre, dangers_json, concerne, risques_json, entreprises_concernees, moyens_prevention_json)
     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(
    rubriqueId, count, toJsonArray(body.dangers), toBoolInt(body.concerne ?? true), toJsonArray(body.risques),
    body.entreprises_concernees ?? null, toJsonArray(body.moyens_prevention)
  ).first<{ id: number }>();

  const ligne = await c.env.DB.prepare('SELECT * FROM plan_prevention_lignes WHERE id = ?').bind(result!.id).first<any>();
  return c.json(ligneRow(ligne), 201);
});

planPreventionDocRoutes.patch('/lignes/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare('SELECT * FROM plan_prevention_lignes WHERE id = ?').bind(id).first<any>();
  if (!existing) return c.json({ error: 'Ligne introuvable' }, 404);

  const body = await c.req.json<Partial<ImportLigne> & { inrs_category_id?: number | null }>().catch(() => null);
  if (!body) return c.json({ error: 'Corps JSON invalide' }, 400);

  await c.env.DB.prepare(
    `UPDATE plan_prevention_lignes SET
      dangers_json = ?, concerne = ?, risques_json = ?, entreprises_concernees = ?, moyens_prevention_json = ?, inrs_category_id = ?
     WHERE id = ?`
  ).bind(
    body.dangers !== undefined ? toJsonArray(body.dangers) : existing.dangers_json,
    body.concerne !== undefined ? toBoolInt(body.concerne) : existing.concerne,
    body.risques !== undefined ? toJsonArray(body.risques) : existing.risques_json,
    body.entreprises_concernees !== undefined ? body.entreprises_concernees : existing.entreprises_concernees,
    body.moyens_prevention !== undefined ? toJsonArray(body.moyens_prevention) : existing.moyens_prevention_json,
    body.inrs_category_id !== undefined ? body.inrs_category_id : existing.inrs_category_id,
    id
  ).run();

  const ligne = await c.env.DB.prepare('SELECT * FROM plan_prevention_lignes WHERE id = ?').bind(id).first<any>();
  return c.json(ligneRow(ligne));
});

planPreventionDocRoutes.delete('/lignes/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM plan_prevention_lignes WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

planPreventionDocRoutes.get('/documents/:docId/export', async (c) => {
  const docId = Number(c.req.param('docId'));
  const full = await loadDocument(c.env.DB, docId);
  if (!full) return c.json({ error: 'Document introuvable' }, 404);

  const site = await c.env.DB.prepare('SELECT nom, adresse FROM sites WHERE id = ?')
    .bind(full.site_id).first<{ nom: string; adresse: string | null }>();

  const inrsMap = await loadInrsMap(c.env.DB);
  const wb = buildPlanPreventionWorkbook(full, site ?? { nom: 'Site inconnu' }, inrsMap);
  const buf = workbookToBuffer(wb);

  const filename = `plan-prevention-${(site?.nom ?? 'site').replace(/[^a-z0-9]+/gi, '-')}.xlsx`;
  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
});

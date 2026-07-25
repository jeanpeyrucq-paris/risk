import { Hono } from 'hono';
import type { Env } from '../index';
import { toJsonArray, fromJsonArray } from '../json-utils';

// Mounted at /api/entreprises — handles /:entrepriseId/duer*
export const duerRoutes = new Hono<{ Bindings: Env }>();
// Mounted at /api/duer — handles /documents/:docId, /documents/:docId/taches, /taches/:id
export const duerDocRoutes = new Hono<{ Bindings: Env }>();

interface ImportTache {
  ligne_source?: number;
  principales_operations?: string;
  facteur_exposition?: string;
  risques?: string[];
  risques_inrs?: string;
  equipement?: string;
  fonctionnement?: string;
  mesures_conception?: string;
  regles_qui_sauvent?: string[];
  epc_epi?: string[];
  formation_specifique?: string[];
  mesures_organisationnelles?: string[];
  further_actions?: string[];
  comment?: string[];
}
interface ImportPayload {
  document?: {
    titre?: string; entite?: string; adresse?: string; perimetre?: string;
    date_mise_a_jour?: string; redacteurs?: string; source_fichier?: string;
  };
  duer?: { taches?: ImportTache[] };
}

function tacheRow(t: any) {
  return {
    id: t.id,
    ordre: t.ordre,
    ligne_source: t.ligne_source,
    principales_operations: t.principales_operations,
    facteur_exposition: t.facteur_exposition,
    risques: fromJsonArray(t.risques_json),
    risques_inrs: t.risques_inrs,
    equipement: t.equipement,
    fonctionnement: t.fonctionnement,
    mesures_conception: t.mesures_conception,
    regles_qui_sauvent: fromJsonArray(t.regles_qui_sauvent_json),
    epc_epi: fromJsonArray(t.epc_epi_json),
    formation_specifique: fromJsonArray(t.formation_specifique_json),
    mesures_organisationnelles: fromJsonArray(t.mesures_organisationnelles_json),
    further_actions: fromJsonArray(t.further_actions_json),
    comment: fromJsonArray(t.comment_json),
    inrs_category_id: t.inrs_category_id
  };
}

async function loadDocument(db: D1Database, documentId: number) {
  const doc = await db.prepare('SELECT * FROM duer_documents WHERE id = ?').bind(documentId).first<any>();
  if (!doc) return null;

  const { results: taches } = await db.prepare(
    'SELECT * FROM duer_taches WHERE document_id = ? ORDER BY ordre'
  ).bind(documentId).all<any>();

  return {
    id: doc.id,
    entreprise_id: doc.entreprise_id,
    titre: doc.titre,
    entite: doc.entite,
    adresse: doc.adresse,
    perimetre: doc.perimetre,
    date_mise_a_jour: doc.date_mise_a_jour,
    redacteurs: doc.redacteurs,
    source_fichier: doc.source_fichier,
    imported_at: doc.imported_at,
    taches: taches.map(tacheRow)
  };
}

duerRoutes.post('/:entrepriseId/duer/import', async (c) => {
  const entrepriseId = c.req.param('entrepriseId');
  const entreprise = await c.env.DB.prepare('SELECT id FROM entreprises WHERE id = ?').bind(entrepriseId).first();
  if (!entreprise) return c.json({ error: 'Entreprise introuvable' }, 404);

  const payload = await c.req.json<ImportPayload>().catch(() => null);
  if (!payload || !payload.duer || !Array.isArray(payload.duer.taches)) {
    return c.json({ error: 'JSON invalide : champ duer.taches[] attendu' }, 400);
  }

  const doc = payload.document ?? {};
  const docResult = await c.env.DB.prepare(
    `INSERT INTO duer_documents (entreprise_id, titre, entite, adresse, perimetre, date_mise_a_jour, redacteurs, source_fichier, raw_import_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(
    entrepriseId, doc.titre ?? null, doc.entite ?? null, doc.adresse ?? null, doc.perimetre ?? null,
    doc.date_mise_a_jour ?? null, doc.redacteurs ?? null, doc.source_fichier ?? null, JSON.stringify(payload)
  ).first<{ id: number }>();

  const documentId = docResult!.id;

  let tacheCount = 0;
  for (let i = 0; i < payload.duer.taches.length; i++) {
    const t = payload.duer.taches[i];
    await c.env.DB.prepare(
      `INSERT INTO duer_taches
        (document_id, ordre, ligne_source, principales_operations, facteur_exposition, risques_json, risques_inrs,
         equipement, fonctionnement, mesures_conception, regles_qui_sauvent_json, epc_epi_json,
         formation_specifique_json, mesures_organisationnelles_json, further_actions_json, comment_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      documentId, i, t.ligne_source ?? null, t.principales_operations ?? null, t.facteur_exposition ?? null,
      toJsonArray(t.risques), t.risques_inrs ?? null, t.equipement ?? null, t.fonctionnement ?? null,
      t.mesures_conception ?? null, toJsonArray(t.regles_qui_sauvent), toJsonArray(t.epc_epi),
      toJsonArray(t.formation_specifique), toJsonArray(t.mesures_organisationnelles),
      toJsonArray(t.further_actions), toJsonArray(t.comment)
    ).run();
    tacheCount++;
  }

  const fullDoc = await loadDocument(c.env.DB, documentId);
  return c.json({ imported: { taches: tacheCount }, document: fullDoc }, 201);
});

duerRoutes.get('/:entrepriseId/duer', async (c) => {
  const entrepriseId = c.req.param('entrepriseId');
  const doc = await c.env.DB.prepare(
    'SELECT id FROM duer_documents WHERE entreprise_id = ? ORDER BY imported_at DESC LIMIT 1'
  ).bind(entrepriseId).first<{ id: number }>();
  if (!doc) return c.json({ error: 'Aucun DUER importe pour cette entreprise' }, 404);

  const full = await loadDocument(c.env.DB, doc.id);
  return c.json(full);
});

duerDocRoutes.get('/documents/:docId', async (c) => {
  const docId = Number(c.req.param('docId'));
  const full = await loadDocument(c.env.DB, docId);
  if (!full) return c.json({ error: 'Document introuvable' }, 404);
  return c.json(full);
});

duerDocRoutes.post('/documents/:docId/taches', async (c) => {
  const docId = c.req.param('docId');
  const doc = await c.env.DB.prepare('SELECT id FROM duer_documents WHERE id = ?').bind(docId).first();
  if (!doc) return c.json({ error: 'Document introuvable' }, 404);

  const body = await c.req.json<ImportTache>().catch(() => ({} as ImportTache));
  const { count } = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM duer_taches WHERE document_id = ?'
  ).bind(docId).first<{ count: number }>() ?? { count: 0 };

  const result = await c.env.DB.prepare(
    `INSERT INTO duer_taches
      (document_id, ordre, ligne_source, principales_operations, facteur_exposition, risques_json, risques_inrs,
       equipement, fonctionnement, mesures_conception, regles_qui_sauvent_json, epc_epi_json,
       formation_specifique_json, mesures_organisationnelles_json, further_actions_json, comment_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(
    docId, count, body.ligne_source ?? null, body.principales_operations ?? null, body.facteur_exposition ?? null,
    toJsonArray(body.risques), body.risques_inrs ?? null, body.equipement ?? null, body.fonctionnement ?? null,
    body.mesures_conception ?? null, toJsonArray(body.regles_qui_sauvent), toJsonArray(body.epc_epi),
    toJsonArray(body.formation_specifique), toJsonArray(body.mesures_organisationnelles),
    toJsonArray(body.further_actions), toJsonArray(body.comment)
  ).first<{ id: number }>();

  const tache = await c.env.DB.prepare('SELECT * FROM duer_taches WHERE id = ?').bind(result!.id).first<any>();
  return c.json(tacheRow(tache), 201);
});

duerDocRoutes.patch('/taches/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare('SELECT * FROM duer_taches WHERE id = ?').bind(id).first<any>();
  if (!existing) return c.json({ error: 'Tache introuvable' }, 404);

  const body = await c.req.json<Partial<ImportTache> & { inrs_category_id?: number | null }>().catch(() => null);
  if (!body) return c.json({ error: 'Corps JSON invalide' }, 400);

  await c.env.DB.prepare(
    `UPDATE duer_taches SET
      principales_operations = ?, facteur_exposition = ?, risques_json = ?, risques_inrs = ?, equipement = ?,
      fonctionnement = ?, mesures_conception = ?, regles_qui_sauvent_json = ?, epc_epi_json = ?,
      formation_specifique_json = ?, mesures_organisationnelles_json = ?, further_actions_json = ?, comment_json = ?,
      inrs_category_id = ?
     WHERE id = ?`
  ).bind(
    body.principales_operations !== undefined ? body.principales_operations : existing.principales_operations,
    body.facteur_exposition !== undefined ? body.facteur_exposition : existing.facteur_exposition,
    body.risques !== undefined ? toJsonArray(body.risques) : existing.risques_json,
    body.risques_inrs !== undefined ? body.risques_inrs : existing.risques_inrs,
    body.equipement !== undefined ? body.equipement : existing.equipement,
    body.fonctionnement !== undefined ? body.fonctionnement : existing.fonctionnement,
    body.mesures_conception !== undefined ? body.mesures_conception : existing.mesures_conception,
    body.regles_qui_sauvent !== undefined ? toJsonArray(body.regles_qui_sauvent) : existing.regles_qui_sauvent_json,
    body.epc_epi !== undefined ? toJsonArray(body.epc_epi) : existing.epc_epi_json,
    body.formation_specifique !== undefined ? toJsonArray(body.formation_specifique) : existing.formation_specifique_json,
    body.mesures_organisationnelles !== undefined ? toJsonArray(body.mesures_organisationnelles) : existing.mesures_organisationnelles_json,
    body.further_actions !== undefined ? toJsonArray(body.further_actions) : existing.further_actions_json,
    body.comment !== undefined ? toJsonArray(body.comment) : existing.comment_json,
    body.inrs_category_id !== undefined ? body.inrs_category_id : existing.inrs_category_id,
    id
  ).run();

  const tache = await c.env.DB.prepare('SELECT * FROM duer_taches WHERE id = ?').bind(id).first<any>();
  return c.json(tacheRow(tache));
});

duerDocRoutes.delete('/taches/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM duer_taches WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

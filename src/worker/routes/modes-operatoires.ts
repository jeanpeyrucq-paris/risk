import { Hono } from 'hono';
import type { Env } from '../index';
import { computeCotationDerived } from '../mo-cotation';
import { buildModeOperatoireWorkbook, buildAnalyseWorkbook } from '../xlsx-mode-operatoire-export';
import { workbookToBuffer } from '../xlsx-export';

// Mounted at /api/sites — handles /:siteId/modes-operatoires
export const modesOperatoiresSiteRoutes = new Hono<{ Bindings: Env }>();
// Mounted at /api/modes-operatoires — handles /:id, /:id/taches, /:id/analyse-lignes, /:id/export
export const modesOperatoiresRoutes = new Hono<{ Bindings: Env }>();
// Mounted at /api/mo-taches — handles /:id
export const moTachesRoutes = new Hono<{ Bindings: Env }>();
// Mounted at /api/mo-analyse-lignes — handles /:id
export const moAnalyseLignesRoutes = new Hono<{ Bindings: Env }>();

function moRow(mo: any) {
  return {
    id: mo.id,
    site_id: mo.site_id,
    intitule_poste: mo.intitule_poste,
    sous_activite_code: mo.sous_activite_code,
    sous_activite_libelle: mo.sous_activite_libelle,
    personnes_concernees: mo.personnes_concernees,
    description_generale: mo.description_generale,
    created_at: mo.created_at,
    updated_at: mo.updated_at
  };
}

function tacheRow(t: any) {
  return {
    id: t.id,
    ordre: t.ordre,
    tache: t.tache,
    risque_present: t.risque_present,
    epi: t.epi,
    epc: t.epc,
    procedures: t.procedures,
    formations: t.formations
  };
}

function analyseLigneRow(l: any) {
  const derived = computeCotationDerived({
    f: l.f, p: l.p, g: l.g,
    cotation_epi: l.cotation_epi, cotation_epc: l.cotation_epc,
    cotation_mo: l.cotation_mo, cotation_mh: l.cotation_mh
  });
  return {
    id: l.id,
    contexte: l.contexte,
    ordre: l.ordre,
    danger: l.danger,
    famille_risque_id: l.famille_risque_id,
    risques_associes: l.risques_associes,
    corps_tete: !!l.corps_tete,
    corps_membres: !!l.corps_membres,
    corps_divers: !!l.corps_divers,
    corps_voies_penetration: !!l.corps_voies_penetration,
    corps_autres: l.corps_autres,
    f: l.f, p: l.p, g: l.g,
    epi: l.epi, cotation_epi: l.cotation_epi,
    epc: l.epc, cotation_epc: l.cotation_epc,
    mesures_organisationnelles: l.mesures_organisationnelles, cotation_mo: l.cotation_mo,
    mesures_humaines: l.mesures_humaines, cotation_mh: l.cotation_mh,
    ...derived
  };
}

export async function loadModeOperatoire(db: D1Database, id: number) {
  const mo = await db.prepare('SELECT * FROM modes_operatoires WHERE id = ?').bind(id).first<any>();
  if (!mo) return null;

  const { results: taches } = await db.prepare(
    'SELECT * FROM mo_taches WHERE mode_operatoire_id = ? ORDER BY ordre'
  ).bind(id).all<any>();

  const { results: lignes } = await db.prepare(
    'SELECT * FROM mo_analyse_lignes WHERE mode_operatoire_id = ? ORDER BY contexte, ordre'
  ).bind(id).all<any>();

  const analyseLignes = lignes.map(analyseLigneRow);

  return {
    ...moRow(mo),
    taches: taches.map(tacheRow),
    analyse_lignes: {
      activite: analyseLignes.filter((l) => l.contexte === 'activite'),
      environnement: analyseLignes.filter((l) => l.contexte === 'environnement')
    }
  };
}

modesOperatoiresSiteRoutes.get('/:siteId/modes-operatoires', async (c) => {
  const siteId = c.req.param('siteId');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM modes_operatoires WHERE site_id = ? ORDER BY intitule_poste'
  ).bind(siteId).all<any>();
  return c.json(results.map(moRow));
});

modesOperatoiresSiteRoutes.post('/:siteId/modes-operatoires', async (c) => {
  const siteId = c.req.param('siteId');
  const site = await c.env.DB.prepare('SELECT id FROM sites WHERE id = ?').bind(siteId).first();
  if (!site) return c.json({ error: 'Site introuvable' }, 404);

  const body = await c.req.json<{
    intitule_poste?: string; sous_activite_code?: string; sous_activite_libelle?: string;
    personnes_concernees?: string; description_generale?: string;
  }>().catch(() => null);
  if (!body || !body.intitule_poste) return c.json({ error: "L'intitule du poste est requis" }, 400);

  const result = await c.env.DB.prepare(
    `INSERT INTO modes_operatoires (site_id, intitule_poste, sous_activite_code, sous_activite_libelle, personnes_concernees, description_generale)
     VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(
    siteId, body.intitule_poste, body.sous_activite_code ?? null, body.sous_activite_libelle ?? null,
    body.personnes_concernees ?? null, body.description_generale ?? null
  ).first<{ id: number }>();

  const mo = await c.env.DB.prepare('SELECT * FROM modes_operatoires WHERE id = ?').bind(result!.id).first<any>();
  return c.json(moRow(mo), 201);
});

modesOperatoiresRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const full = await loadModeOperatoire(c.env.DB, id);
  if (!full) return c.json({ error: 'Mode operatoire introuvable' }, 404);
  return c.json(full);
});

modesOperatoiresRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare('SELECT * FROM modes_operatoires WHERE id = ?').bind(id).first<any>();
  if (!existing) return c.json({ error: 'Mode operatoire introuvable' }, 404);

  const body = await c.req.json<any>().catch(() => null);
  if (!body) return c.json({ error: 'Corps JSON invalide' }, 400);

  await c.env.DB.prepare(
    `UPDATE modes_operatoires SET
      intitule_poste = ?, sous_activite_code = ?, sous_activite_libelle = ?,
      personnes_concernees = ?, description_generale = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(
    body.intitule_poste ?? existing.intitule_poste,
    body.sous_activite_code !== undefined ? body.sous_activite_code : existing.sous_activite_code,
    body.sous_activite_libelle !== undefined ? body.sous_activite_libelle : existing.sous_activite_libelle,
    body.personnes_concernees !== undefined ? body.personnes_concernees : existing.personnes_concernees,
    body.description_generale !== undefined ? body.description_generale : existing.description_generale,
    id
  ).run();

  const mo = await c.env.DB.prepare('SELECT * FROM modes_operatoires WHERE id = ?').bind(id).first<any>();
  return c.json(moRow(mo));
});

modesOperatoiresRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM modes_operatoires WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

modesOperatoiresRoutes.post('/:id/taches', async (c) => {
  const moId = c.req.param('id');
  const mo = await c.env.DB.prepare('SELECT id FROM modes_operatoires WHERE id = ?').bind(moId).first();
  if (!mo) return c.json({ error: 'Mode operatoire introuvable' }, 404);

  const body = await c.req.json<any>().catch(() => ({}));
  const { count } = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM mo_taches WHERE mode_operatoire_id = ?'
  ).bind(moId).first<{ count: number }>() ?? { count: 0 };

  const result = await c.env.DB.prepare(
    `INSERT INTO mo_taches (mode_operatoire_id, ordre, tache, risque_present, epi, epc, procedures, formations)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(
    moId, count, body.tache ?? null, body.risque_present ?? null, body.epi ?? null,
    body.epc ?? null, body.procedures ?? null, body.formations ?? null
  ).first<{ id: number }>();

  const tache = await c.env.DB.prepare('SELECT * FROM mo_taches WHERE id = ?').bind(result!.id).first<any>();
  return c.json(tacheRow(tache), 201);
});

moTachesRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare('SELECT * FROM mo_taches WHERE id = ?').bind(id).first<any>();
  if (!existing) return c.json({ error: 'Tache introuvable' }, 404);

  const body = await c.req.json<any>().catch(() => null);
  if (!body) return c.json({ error: 'Corps JSON invalide' }, 400);

  await c.env.DB.prepare(
    `UPDATE mo_taches SET tache = ?, risque_present = ?, epi = ?, epc = ?, procedures = ?, formations = ? WHERE id = ?`
  ).bind(
    body.tache !== undefined ? body.tache : existing.tache,
    body.risque_present !== undefined ? body.risque_present : existing.risque_present,
    body.epi !== undefined ? body.epi : existing.epi,
    body.epc !== undefined ? body.epc : existing.epc,
    body.procedures !== undefined ? body.procedures : existing.procedures,
    body.formations !== undefined ? body.formations : existing.formations,
    id
  ).run();

  const tache = await c.env.DB.prepare('SELECT * FROM mo_taches WHERE id = ?').bind(id).first<any>();
  return c.json(tacheRow(tache));
});

moTachesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM mo_taches WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

modesOperatoiresRoutes.post('/:id/analyse-lignes', async (c) => {
  const moId = c.req.param('id');
  const mo = await c.env.DB.prepare('SELECT id FROM modes_operatoires WHERE id = ?').bind(moId).first();
  if (!mo) return c.json({ error: 'Mode operatoire introuvable' }, 404);

  const body = await c.req.json<any>().catch(() => ({}));
  const contexte = body.contexte === 'environnement' ? 'environnement' : 'activite';

  const { count } = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM mo_analyse_lignes WHERE mode_operatoire_id = ? AND contexte = ?'
  ).bind(moId, contexte).first<{ count: number }>() ?? { count: 0 };

  const result = await c.env.DB.prepare(
    `INSERT INTO mo_analyse_lignes
      (mode_operatoire_id, contexte, ordre, danger, famille_risque_id, risques_associes,
       corps_tete, corps_membres, corps_divers, corps_voies_penetration, corps_autres,
       f, p, g, epi, cotation_epi, epc, cotation_epc,
       mesures_organisationnelles, cotation_mo, mesures_humaines, cotation_mh)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(
    moId, contexte, count, body.danger ?? null, body.famille_risque_id ?? null, body.risques_associes ?? null,
    body.corps_tete ? 1 : 0, body.corps_membres ? 1 : 0, body.corps_divers ? 1 : 0, body.corps_voies_penetration ? 1 : 0,
    body.corps_autres ?? null,
    body.f ?? null, body.p ?? null, body.g ?? null,
    body.epi ?? null, body.cotation_epi ?? null, body.epc ?? null, body.cotation_epc ?? null,
    body.mesures_organisationnelles ?? null, body.cotation_mo ?? null,
    body.mesures_humaines ?? null, body.cotation_mh ?? null
  ).first<{ id: number }>();

  const ligne = await c.env.DB.prepare('SELECT * FROM mo_analyse_lignes WHERE id = ?').bind(result!.id).first<any>();
  return c.json(analyseLigneRow(ligne), 201);
});

moAnalyseLignesRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare('SELECT * FROM mo_analyse_lignes WHERE id = ?').bind(id).first<any>();
  if (!existing) return c.json({ error: 'Ligne introuvable' }, 404);

  const body = await c.req.json<any>().catch(() => null);
  if (!body) return c.json({ error: 'Corps JSON invalide' }, 400);

  const pick = (key: string) => (body[key] !== undefined ? body[key] : existing[key]);
  const pickBool = (key: string) => (body[key] !== undefined ? (body[key] ? 1 : 0) : existing[key]);

  await c.env.DB.prepare(
    `UPDATE mo_analyse_lignes SET
      danger = ?, famille_risque_id = ?, risques_associes = ?,
      corps_tete = ?, corps_membres = ?, corps_divers = ?, corps_voies_penetration = ?, corps_autres = ?,
      f = ?, p = ?, g = ?, epi = ?, cotation_epi = ?, epc = ?, cotation_epc = ?,
      mesures_organisationnelles = ?, cotation_mo = ?, mesures_humaines = ?, cotation_mh = ?
     WHERE id = ?`
  ).bind(
    pick('danger'), pick('famille_risque_id'), pick('risques_associes'),
    pickBool('corps_tete'), pickBool('corps_membres'), pickBool('corps_divers'), pickBool('corps_voies_penetration'),
    pick('corps_autres'),
    pick('f'), pick('p'), pick('g'), pick('epi'), pick('cotation_epi'), pick('epc'), pick('cotation_epc'),
    pick('mesures_organisationnelles'), pick('cotation_mo'), pick('mesures_humaines'), pick('cotation_mh'),
    id
  ).run();

  const ligne = await c.env.DB.prepare('SELECT * FROM mo_analyse_lignes WHERE id = ?').bind(id).first<any>();
  return c.json(analyseLigneRow(ligne));
});

moAnalyseLignesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM mo_analyse_lignes WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

modesOperatoiresRoutes.get('/:id/export', async (c) => {
  const id = Number(c.req.param('id'));
  const full = await loadModeOperatoire(c.env.DB, id);
  if (!full) return c.json({ error: 'Mode operatoire introuvable' }, 404);

  const type = c.req.query('type') === 'analyse' ? 'analyse' : 'mode-operatoire';
  const famillesMap = new Map<number, string>();
  const { results: familles } = await c.env.DB.prepare('SELECT id, libelle FROM familles_risques').all<{ id: number; libelle: string }>();
  for (const f of familles) famillesMap.set(f.id, f.libelle);

  const wb = type === 'analyse' ? buildAnalyseWorkbook(full, famillesMap) : buildModeOperatoireWorkbook(full);
  const buf = workbookToBuffer(wb);
  const filename = `${type}-${(full.intitule_poste || 'mode-operatoire').replace(/[^a-z0-9]+/gi, '-')}.xlsx`;

  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
});

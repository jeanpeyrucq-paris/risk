import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import {
  type CellUpdate, textCell, numberCell,
  patchSheetXml, readRowStyles, replaceMergeCellsFrom, forceFullRecalcOnLoad
} from './xlsx-xml-patch';

// Both exports patch the real client templates directly at the XML level
// (see xlsx-xml-patch.ts / README) instead of building a workbook from scratch,
// so the original formatting (fonts, fills, borders, merged cells) is preserved
// exactly. This mirrors the fix already applied to the DUER "export modele".

async function loadTemplateSheet1(assets: Fetcher, path: string, label: string) {
  const res = await assets.fetch(new Request(`https://assets.local/${path}`));
  if (!res.ok) throw new Error(`Modele ${label} introuvable (${path})`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const files = unzipSync(buf);
  return { files, sheetXml: strFromU8(files['xl/worksheets/sheet1.xml']) };
}

// ---------------------------------------------------------------------------
// Mode operatoire export (public/templates/mode-operatoire-template.xlsx)
// ---------------------------------------------------------------------------
// Layout confirmed from the real template's raw XML: title merged A1:F2
// (generic, untouched), Intitule du poste / Sous-activite on row 5, Personnes
// concernees on row 6, headers on row 7, taches data from row 8. Column A
// (tache name) is merged across the contiguous risque rows that share the
// same tache, e.g. "A8:A9" in the template's own example.

const MO_COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MO_FIRST_DATA_ROW = 8;
const MO_LAST_TEMPLATE_ROW = 11;

export async function buildModeOperatoireWorkbook(assets: Fetcher, mo: any): Promise<Uint8Array> {
  const { files, sheetXml: original } = await loadTemplateSheet1(
    assets, 'templates/mode-operatoire-template.xlsx', 'mode operatoire'
  );
  let sheetXml = original;

  const headerUpdates = new Map<number, Map<string, CellUpdate>>();
  headerUpdates.set(5, new Map([
    ['C', textCell(mo.intitule_poste || '')],
    ['F', textCell([mo.sous_activite_code, mo.sous_activite_libelle].filter(Boolean).join(' '))]
  ]));
  headerUpdates.set(6, new Map([['D', textCell(mo.personnes_concernees || '')]]));
  sheetXml = patchSheetXml(sheetXml, headerUpdates);

  const fallbackStyle = readRowStyles(sheetXml, MO_LAST_TEMPLATE_ROW, MO_COLS);

  const taches: any[] = mo.taches;
  const rowUpdates = new Map<number, Map<string, CellUpdate>>();
  const mergeRefs: string[] = [];
  // A row continues the previous row's tache (same merged A-column group)
  // either when its `tache` is blank/missing, or when it repeats the exact
  // same tache text - both conventions are used across existing data.
  let i = 0;
  while (i < taches.length) {
    const startRow = MO_FIRST_DATA_ROW + i;
    let j = i + 1;
    while (j < taches.length && (!taches[j].tache || taches[j].tache === taches[i].tache)) j++;
    const endRow = MO_FIRST_DATA_ROW + (j - 1);
    if (endRow > startRow) mergeRefs.push(`A${startRow}:A${endRow}`);

    for (let k = i; k < j; k++) {
      const row = MO_FIRST_DATA_ROW + k;
      const updates = new Map<string, CellUpdate>();
      if (k === i) updates.set('A', textCell(taches[k].tache || ''));
      updates.set('B', textCell(taches[k].risque_present || ''));
      updates.set('C', textCell(taches[k].epi || ''));
      updates.set('D', textCell(taches[k].epc || ''));
      updates.set('E', textCell(taches[k].procedures || ''));
      updates.set('F', textCell(taches[k].formations || ''));
      rowUpdates.set(row, updates);
    }
    i = j;
  }

  sheetXml = patchSheetXml(sheetXml, rowUpdates, fallbackStyle);
  sheetXml = replaceMergeCellsFrom(sheetXml, MO_FIRST_DATA_ROW, mergeRefs);

  files['xl/worksheets/sheet1.xml'] = strToU8(sheetXml);
  return zipSync(files, { level: 6 });
}

// ---------------------------------------------------------------------------
// Analyse ERPT export (public/templates/analyse-erpt-template.xlsx)
// ---------------------------------------------------------------------------
// Layout confirmed from the real template's raw XML: title merged A1:AA3
// (generic, untouched), "Intervention:" label/value on row 6 (A6:B6 / C6),
// 3-row header block rows 10-12 (untouched), then two fixed-size blocks:
// "liee a l'activite" rows 13-28 (16 rows, column A pre-merged A13:A28 with
// the section label already in the template) and "liee a l'environnement"
// rows 29-43 (15 rows, A29:A43). Columns M/R/W/X/Y/Z all hold LIVE Excel
// formulas (Rp, cotation MT, cotation FOH, cotation globale, niveau de
// maitrise, cotation Rr) and must never be overwritten - only raw input cells
// are written. The template now bundles a second sheet ("Cotation") with the
// lookup matrix X's formula (HLOOKUP against Cotation!$D$76:$M$86) depends on,
// so it travels with every export and Excel recalculates X correctly (earlier
// versions of this template didn't include that sheet, and X was a frozen
// value the app had to write explicitly - no longer the case). AA (Rr, the
// final F/M/S/C grade) stays untouched/manual, per the existing product
// decision (see mo-cotation.ts) - some AA cells in the template do carry a
// formula, but it errors out (#VALUE!) even in the template's own filled
// example rows, so there's nothing reliable to reproduce.

const ACTIVITE_FIRST_ROW = 13;
const ACTIVITE_ROW_COUNT = 16;
const ENVIRONNEMENT_FIRST_ROW = 29;
const ENVIRONNEMENT_ROW_COUNT = 15;

function analyseLigneUpdates(l: any, famillesMap: Map<number, string>): Map<string, CellUpdate> {
  const updates = new Map<string, CellUpdate>();
  updates.set('B', textCell(l.danger || ''));
  updates.set('C', textCell(l.famille_risque_id != null ? (famillesMap.get(l.famille_risque_id) || '') : ''));
  updates.set('D', textCell(l.risques_associes || ''));
  updates.set('E', textCell(l.corps_tete ? 'X' : ''));
  updates.set('F', textCell(l.corps_membres ? 'X' : ''));
  updates.set('G', textCell(l.corps_divers ? 'X' : ''));
  updates.set('H', textCell(l.corps_voies_penetration ? 'X' : ''));
  updates.set('I', textCell(l.corps_autres || ''));
  updates.set('J', numberCell(l.f ?? null));
  updates.set('K', numberCell(l.p ?? null));
  updates.set('L', numberCell(l.g ?? null));
  // M (Rp) is a live formula (J*K*L) - not written.
  updates.set('N', textCell(l.epi || ''));
  updates.set('O', numberCell(l.cotation_epi ?? null));
  updates.set('P', textCell(l.epc || ''));
  updates.set('Q', numberCell(l.cotation_epc ?? null));
  // R (cotation MT) is a live formula (PRODUCT(O,Q)) - not written.
  updates.set('S', textCell(l.mesures_organisationnelles || ''));
  updates.set('T', numberCell(l.cotation_mo ?? null));
  updates.set('U', textCell(l.mesures_humaines || ''));
  updates.set('V', numberCell(l.cotation_mh ?? null));
  // W (cotation FOH), X (cotation globale, HLOOKUP against Cotation!),
  // Y (niveau de maitrise) and Z (cotation Rr) are all live formulas - not written.
  // AA (Rr letter) intentionally left blank/manual - see mo-cotation.ts.
  return updates;
}

function maxRowNumber(sheetXml: string): number {
  const rows = [...sheetXml.matchAll(/<row r="(\d+)"/g)].map(m => Number(m[1]));
  return rows.length ? Math.max(...rows) : 0;
}

// The template's block sizes (16 activite rows, 15 environnement rows) are a
// fixed grid, not derived from the 16-entry familles_risques list - real seeded
// data (e.g. "Site TEST" / Maintenance CTA) already has 17 activite lignes and
// 16 environnement lignes, exceeding both blocks by one row. Rather than
// silently dropping real safety data past capacity, any overflow lignes are
// appended as extra rows after the template's last row (the disclaimer note),
// unstyled - same fallback already accepted for the DUER export's overflow rows.
function appendOverflowRows(
  sheetXml: string,
  activiteOverflow: any[],
  environnementOverflow: any[],
  famillesMap: Map<number, string>
): string {
  if (!activiteOverflow.length && !environnementOverflow.length) return sheetXml;

  let nextRow = maxRowNumber(sheetXml) + 1;
  const overflowUpdates = new Map<number, Map<string, CellUpdate>>();

  const appendBlock = (lignes: any[], label: string) => {
    lignes.forEach((l, i) => {
      const updates = analyseLigneUpdates(l, famillesMap);
      if (i === 0) updates.set('A', textCell(label));
      overflowUpdates.set(nextRow, updates);
      nextRow += 1;
    });
  };
  appendBlock(activiteOverflow, "Analyse liee a l'activite (suite - hors capacite du modele)");
  appendBlock(environnementOverflow, "Analyse liee a l'environnement de travail (suite - hors capacite du modele)");

  return patchSheetXml(sheetXml, overflowUpdates);
}

export async function buildAnalyseWorkbook(assets: Fetcher, mo: any, famillesMap: Map<number, string>): Promise<Uint8Array> {
  const { files, sheetXml: original } = await loadTemplateSheet1(
    assets, 'templates/analyse-erpt-template.xlsx', 'analyse ERPT'
  );
  let sheetXml = original;

  const headerUpdates = new Map<number, Map<string, CellUpdate>>();
  headerUpdates.set(6, new Map([
    ['C', textCell(mo.sous_activite_libelle || mo.intitule_poste || '')]
  ]));
  sheetXml = patchSheetXml(sheetXml, headerUpdates);

  const activiteAll: any[] = mo.analyse_lignes.activite;
  const environnementAll: any[] = mo.analyse_lignes.environnement;

  const rowUpdates = new Map<number, Map<string, CellUpdate>>();
  activiteAll.slice(0, ACTIVITE_ROW_COUNT).forEach((l, i) => {
    rowUpdates.set(ACTIVITE_FIRST_ROW + i, analyseLigneUpdates(l, famillesMap));
  });
  environnementAll.slice(0, ENVIRONNEMENT_ROW_COUNT).forEach((l, i) => {
    rowUpdates.set(ENVIRONNEMENT_FIRST_ROW + i, analyseLigneUpdates(l, famillesMap));
  });
  sheetXml = patchSheetXml(sheetXml, rowUpdates);

  sheetXml = appendOverflowRows(
    sheetXml,
    activiteAll.slice(ACTIVITE_ROW_COUNT),
    environnementAll.slice(ENVIRONNEMENT_ROW_COUNT),
    famillesMap
  );

  files['xl/worksheets/sheet1.xml'] = strToU8(sheetXml);
  // The live formulas (Rp, cotation MT/FOH, niveau, Rr) reference cells we've
  // just overwritten - force Excel to recalculate them on open rather than
  // displaying the original example's stale cached values.
  files['xl/workbook.xml'] = strToU8(forceFullRecalcOnLoad(strFromU8(files['xl/workbook.xml'])));
  return zipSync(files, { level: 6 });
}

import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { type CellUpdate, textCell, patchSheetXml } from './xlsx-xml-patch';

// Columns the app actually manages in the real DUER template ("Risk Register" sheet).
// Everything else (UT1-9, frequence/probabilite/gravite/risque brut, "en place?",
// risque residuel/net - several of which are live formulas referencing cells we
// never touch) is deliberately left untouched - those are excluded from the
// JSON import/export scope per the product spec.
const COLS: Record<string, string> = {
  principales_operations: 'B',
  facteur_exposition: 'C',
  risques: 'M',
  risques_inrs: 'N',
  equipement: 'O',
  fonctionnement: 'P',
  mesures_conception: 'W',
  regles_qui_sauvent: 'X',
  epc_epi: 'Y',
  formation_specifique: 'AA',
  mesures_organisationnelles: 'AC',
  further_actions: 'AH',
  comment: 'AI'
};

const ARRAY_FIELDS = new Set([
  'risques', 'regles_qui_sauvent', 'epc_epi', 'formation_specifique', 'mesures_organisationnelles', 'further_actions', 'comment'
]);

// Confirmed first data row in the real template (rows 1-9 are titles/headers).
const FIRST_DATA_ROW = 10;

function findRiskRegisterSheetPath(files: Record<string, Uint8Array>): string {
  const workbookXml = strFromU8(files['xl/workbook.xml']);
  const sheetTag = workbookXml.match(/<sheet name="Risk Register"[^>]*r:id="(rId\d+)"/);
  if (!sheetTag) throw new Error('Feuille "Risk Register" introuvable dans le modele');
  const rId = sheetTag[1];

  const relsXml = strFromU8(files['xl/_rels/workbook.xml.rels']);
  const relMatch = relsXml.match(new RegExp(`<Relationship Id="${rId}"[^>]*Target="([^"]+)"`));
  if (!relMatch) throw new Error('Relation vers la feuille "Risk Register" introuvable');

  return 'xl/' + relMatch[1].replace(/^\.?\//, '');
}

export async function buildDuerTemplateExport(assets: Fetcher, doc: any): Promise<Uint8Array> {
  const templateRes = await assets.fetch(new Request('https://assets.local/templates/duer-template.xlsx'));
  if (!templateRes.ok) {
    throw new Error('Modele DUER introuvable (public/templates/duer-template.xlsx)');
  }
  const templateBuf = new Uint8Array(await templateRes.arrayBuffer());
  const files = unzipSync(templateBuf);

  const sheetPath = findRiskRegisterSheetPath(files);
  let sheetXml = strFromU8(files[sheetPath]);

  const rowUpdates = new Map<number, Map<string, CellUpdate>>();
  doc.taches.forEach((t: any, i: number) => {
    const rowNumber = FIRST_DATA_ROW + i;
    const updates = new Map<string, CellUpdate>();
    for (const [field, col] of Object.entries(COLS)) {
      const raw = t[field];
      const value = ARRAY_FIELDS.has(field)
        ? (Array.isArray(raw) ? raw.join('\n') : '')
        : (raw ?? '');
      updates.set(col, textCell(String(value)));
    }
    rowUpdates.set(rowNumber, updates);
  });

  sheetXml = patchSheetXml(sheetXml, rowUpdates);
  files[sheetPath] = strToU8(sheetXml);

  return zipSync(files, { level: 6 });
}

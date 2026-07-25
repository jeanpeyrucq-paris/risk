import * as XLSX from 'xlsx';

// Columns the app actually manages in the real DUER template ("Risk Register" sheet).
// Everything else (UT1-9, frequence/probabilite/gravite/risque brut, "en place?",
// risque residuel/net) is deliberately left untouched - those are excluded from
// the JSON import/export scope per the product spec.
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

export async function buildDuerTemplateExport(assets: Fetcher, doc: any): Promise<Uint8Array> {
  const templateRes = await assets.fetch(new Request('https://assets.local/templates/duer-template.xlsx'));
  if (!templateRes.ok) {
    throw new Error('Modele DUER introuvable (public/templates/duer-template.xlsx)');
  }
  const templateBuf = await templateRes.arrayBuffer();

  const wb = XLSX.read(templateBuf, { type: 'array' });
  const sheetName = wb.SheetNames.includes('Risk Register') ? 'Risk Register' : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  let maxRowIndex = FIRST_DATA_ROW - 2; // 0-indexed, will be compared against rows written below

  doc.taches.forEach((t: any, i: number) => {
    const rowNumber = FIRST_DATA_ROW + i; // 1-indexed Excel row
    maxRowIndex = Math.max(maxRowIndex, rowNumber - 1);
    for (const [field, col] of Object.entries(COLS)) {
      const raw = t[field];
      const value = ARRAY_FIELDS.has(field)
        ? (Array.isArray(raw) ? raw.join('\n') : '')
        : (raw ?? '');
      ws[`${col}${rowNumber}`] = { t: 's', v: String(value) };
    }
  });

  const existingRange = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  existingRange.e.r = Math.max(existingRange.e.r, maxRowIndex);
  ws['!ref'] = XLSX.utils.encode_range(existingRange);

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}

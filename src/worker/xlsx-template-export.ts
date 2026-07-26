import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';

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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n/g, '\n');
}

function colToIndex(col: string): number {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function cellRegex(addr: string): RegExp {
  // Matches either a self-closing cell <c r="B10" s="46"/> or one with content
  // <c r="B10" s="46" t="s"><v>95</v></c>. Non-greedy content match anchored to
  // the specific closing tag keeps this safe even though sibling cells share
  // the same tag names.
  return new RegExp(`<c r="${addr}"([^>]*?)(?:/>|>([\\s\\S]*?)</c>)`);
}

function buildCellXml(addr: string, styleAttr: string, text: string): string {
  if (!text) return `<c r="${addr}"${styleAttr}/>`;
  return `<c r="${addr}"${styleAttr} t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
}

function extractStyleAttr(attrs: string): string {
  const m = attrs.match(/\ss="(\d+)"/);
  return m ? ` s="${m[1]}"` : '';
}

// Patches a single row's XML block in place: replaces the value of any managed
// cell that already exists, or inserts a new (unstyled) cell in the correct
// column position if the template's row never had that column at all.
function patchRow(rowXml: string, rowNum: number, updates: Map<string, string>): string {
  let result = rowXml;
  for (const [col, text] of updates) {
    const addr = `${col}${rowNum}`;
    const re = cellRegex(addr);
    const m = result.match(re);
    if (m) {
      const styleAttr = extractStyleAttr(m[1]);
      result = result.replace(re, buildCellXml(addr, styleAttr, text));
    } else if (text) {
      // Cell entirely absent from this row - insert in correct column order.
      const targetIdx = colToIndex(col);
      const cellRefs = [...result.matchAll(/<c r="([A-Z]+)\d+"/g)];
      let insertBefore: string | null = null;
      for (const ref of cellRefs) {
        if (colToIndex(ref[1]) > targetIdx) { insertBefore = ref[0]; break; }
      }
      const newCell = buildCellXml(addr, '', text);
      if (insertBefore) {
        result = result.replace(insertBefore, newCell + insertBefore);
      } else {
        result = result.replace('</row>', `${newCell}</row>`);
      }
    }
  }
  return result;
}

function buildNewRow(rowNum: number, updates: Map<string, string>): string {
  const cells = [...updates.entries()]
    .sort(([a], [b]) => colToIndex(a) - colToIndex(b))
    .map(([col, text]) => buildCellXml(`${col}${rowNum}`, '', text))
    .join('');
  return `<row r="${rowNum}">${cells}</row>`;
}

function patchSheetXml(sheetXml: string, rowUpdates: Map<number, Map<string, string>>): string {
  let result = sheetXml;

  for (const [rowNum, updates] of rowUpdates) {
    const rowRe = new RegExp(`<row r="${rowNum}"[^>]*>[\\s\\S]*?</row>|<row r="${rowNum}"[^>]*/>`);
    const rowMatch = result.match(rowRe);
    if (rowMatch) {
      const normalized = rowMatch[0].endsWith('/>') ? rowMatch[0].replace('/>', '>') + '</row>' : rowMatch[0];
      const patched = patchRow(normalized, rowNum, updates);
      result = result.replace(rowMatch[0], patched);
    } else {
      // Row doesn't exist at all (task list grew beyond the template's original
      // rows) - insert a fresh, unstyled row in the correct numeric position.
      const newRow = buildNewRow(rowNum, updates);
      const rowStarts = [...result.matchAll(/<row r="(\d+)"/g)];
      let insertBeforeTag: string | null = null;
      for (const r of rowStarts) {
        if (Number(r[1]) > rowNum) {
          const fullTagMatch = result.slice(r.index).match(/<row r="\d+"[^>]*>/);
          insertBeforeTag = fullTagMatch ? fullTagMatch[0] : null;
          break;
        }
      }
      if (insertBeforeTag) {
        result = result.replace(insertBeforeTag, newRow + insertBeforeTag);
      } else {
        result = result.replace('</sheetData>', `${newRow}</sheetData>`);
      }
    }
  }

  return result;
}

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

  const rowUpdates = new Map<number, Map<string, string>>();
  doc.taches.forEach((t: any, i: number) => {
    const rowNumber = FIRST_DATA_ROW + i;
    const updates = new Map<string, string>();
    for (const [field, col] of Object.entries(COLS)) {
      const raw = t[field];
      const value = ARRAY_FIELDS.has(field)
        ? (Array.isArray(raw) ? raw.join('\n') : '')
        : (raw ?? '');
      updates.set(col, String(value));
    }
    rowUpdates.set(rowNumber, updates);
  });

  sheetXml = patchSheetXml(sheetXml, rowUpdates);
  files[sheetPath] = strToU8(sheetXml);

  return zipSync(files, { level: 6 });
}

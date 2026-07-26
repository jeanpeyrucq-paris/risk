// Shared low-level helpers for patching real .xlsx templates by direct ZIP/XML
// manipulation (fflate), instead of round-tripping through SheetJS - which does
// not preserve cell formatting on write (verified experimentally, see README).
// Used by xlsx-template-export.ts (DUER) and xlsx-mode-operatoire-export.ts
// (mode operatoire + analyse ERPT).

export type CellUpdate =
  | { kind: 'text'; value: string }
  | { kind: 'number'; value: number | null };

export function textCell(value: string): CellUpdate {
  return { kind: 'text', value };
}

export function numberCell(value: number | null): CellUpdate {
  return { kind: 'number', value };
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n/g, '\n');
}

export function colToIndex(col: string): number {
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

export function extractStyleAttr(attrs: string): string {
  const m = attrs.match(/\ss="(\d+)"/);
  return m ? ` s="${m[1]}"` : '';
}

export function buildCellXml(addr: string, styleAttr: string, update: CellUpdate): string {
  if (update.kind === 'number') {
    if (update.value === null || update.value === undefined || Number.isNaN(update.value)) {
      return `<c r="${addr}"${styleAttr}/>`;
    }
    return `<c r="${addr}"${styleAttr}><v>${update.value}</v></c>`;
  }
  if (!update.value) return `<c r="${addr}"${styleAttr}/>`;
  return `<c r="${addr}"${styleAttr} t="inlineStr"><is><t xml:space="preserve">${escapeXml(update.value)}</t></is></c>`;
}

// Patches a single row's XML block in place: replaces the value of any managed
// cell that already exists (keeping its original style index), or inserts a
// new cell in the correct column position if the row never had that column.
// `fallbackStyleAttr` (e.g. " s=\"10\"") is used only for brand-new cells.
export function patchRow(
  rowXml: string,
  rowNum: number,
  updates: Map<string, CellUpdate>,
  fallbackStyleByCol?: Map<string, string>
): string {
  let result = rowXml;
  for (const [col, update] of updates) {
    const addr = `${col}${rowNum}`;
    const re = cellRegex(addr);
    const m = result.match(re);
    if (m) {
      const styleAttr = extractStyleAttr(m[1]);
      result = result.replace(re, buildCellXml(addr, styleAttr, update));
    } else {
      const isEmpty = update.kind === 'text' ? !update.value : (update.value === null || update.value === undefined);
      if (isEmpty) continue;
      const targetIdx = colToIndex(col);
      const cellRefs = [...result.matchAll(/<c r="([A-Z]+)\d+"/g)];
      let insertBefore: string | null = null;
      for (const ref of cellRefs) {
        if (colToIndex(ref[1]) > targetIdx) { insertBefore = ref[0]; break; }
      }
      const styleAttr = fallbackStyleByCol?.get(col) ?? '';
      const newCell = buildCellXml(addr, styleAttr, update);
      if (insertBefore) {
        result = result.replace(insertBefore, newCell + insertBefore);
      } else {
        result = result.replace('</row>', `${newCell}</row>`);
      }
    }
  }
  return result;
}

export function buildNewRow(
  rowNum: number,
  updates: Map<string, CellUpdate>,
  fallbackStyleByCol?: Map<string, string>
): string {
  const cells = [...updates.entries()]
    .sort(([a], [b]) => colToIndex(a) - colToIndex(b))
    .map(([col, update]) => buildCellXml(`${col}${rowNum}`, fallbackStyleByCol?.get(col) ?? '', update))
    .join('');
  return `<row r="${rowNum}">${cells}</row>`;
}

// Reads the per-column style attribute (e.g. " s=\"10\"") of an existing row,
// so overflow rows added beyond a template's original range can carry the same
// look as the template's last real row instead of being unstyled.
export function readRowStyles(sheetXml: string, rowNum: number, cols: string[]): Map<string, string> {
  const rowRe = new RegExp(`<row r="${rowNum}"[^>]*>[\\s\\S]*?</row>|<row r="${rowNum}"[^>]*/>`);
  const rowMatch = sheetXml.match(rowRe);
  const styles = new Map<string, string>();
  if (!rowMatch) return styles;
  for (const col of cols) {
    const m = rowMatch[0].match(cellRegex(`${col}${rowNum}`));
    if (m) styles.set(col, extractStyleAttr(m[1]));
  }
  return styles;
}

export function patchSheetXml(sheetXml: string, rowUpdates: Map<number, Map<string, CellUpdate>>, fallbackStyleByCol?: Map<string, string>): string {
  let result = sheetXml;

  for (const [rowNum, updates] of rowUpdates) {
    const rowRe = new RegExp(`<row r="${rowNum}"[^>]*>[\\s\\S]*?</row>|<row r="${rowNum}"[^>]*/>`);
    const rowMatch = result.match(rowRe);
    if (rowMatch) {
      const normalized = rowMatch[0].endsWith('/>') ? rowMatch[0].replace('/>', '>') + '</row>' : rowMatch[0];
      const patched = patchRow(normalized, rowNum, updates, fallbackStyleByCol);
      result = result.replace(rowMatch[0], patched);
    } else {
      // Row doesn't exist at all (data grew beyond the template's original
      // rows) - insert a fresh row in the correct numeric position, styled
      // like the template's last known row when available.
      const newRow = buildNewRow(rowNum, updates, fallbackStyleByCol);
      const rowStarts = [...result.matchAll(/<row r="(\d+)"/g)];
      let insertBeforeTag: string | null = null;
      for (const r of rowStarts) {
        if (Number(r[1]) > rowNum) {
          const fullTagMatch = result.slice(r.index!).match(/<row r="\d+"[^>]*>/);
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

// When a sheet's live formulas reference cells we've overwritten (e.g. the
// analyse ERPT template's Rp/cotation columns), Excel does not recompute them
// on open by default - it trusts the stale cached <v> from the original
// example and the (now-stale) calcChain.xml. Setting fullCalcOnLoad forces a
// full recalculation as soon as the file opens, regardless of cached values.
export function forceFullRecalcOnLoad(workbookXml: string): string {
  const m = workbookXml.match(/<calcPr([^>]*)\/>/);
  if (!m) return workbookXml;
  if (/\sfullCalcOnLoad=/.test(m[1])) return workbookXml;
  return workbookXml.replace(m[0], `<calcPr${m[1]} fullCalcOnLoad="1"/>`);
}

// Replaces the sheet's <mergeCells> block, keeping any existing merges whose
// top-left row is below `belowRow` (headers/titles) and swapping in a fresh
// set of data-region merges computed from the actual exported data.
export function replaceMergeCellsFrom(sheetXml: string, belowRow: number, newRefs: string[]): string {
  const existing = sheetXml.match(/<mergeCells count="\d+">([\s\S]*?)<\/mergeCells>/);
  const kept: string[] = [];
  if (existing) {
    const refs = [...existing[1].matchAll(/<mergeCell ref="([^"]+)"\/>/g)].map(m => m[1]);
    for (const ref of refs) {
      const startRow = Number(ref.match(/^[A-Z]+(\d+)/)![1]);
      if (startRow < belowRow) kept.push(ref);
    }
  }
  const allRefs = [...kept, ...newRefs];
  const block = allRefs.length
    ? `<mergeCells count="${allRefs.length}">${allRefs.map(r => `<mergeCell ref="${r}"/>`).join('')}</mergeCells>`
    : '';

  if (existing) {
    return sheetXml.replace(existing[0], block);
  }
  if (!block) return sheetXml;
  return sheetXml.replace('</sheetData>', `</sheetData>${block}`);
}

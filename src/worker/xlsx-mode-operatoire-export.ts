import * as XLSX from 'xlsx';

function setCell(ws: XLSX.WorkSheet, addr: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return;
  ws[addr] = typeof value === 'number' ? { t: 'n', v: value } : { t: 's', v: String(value) };
}

function extendRange(ws: XLSX.WorkSheet, rowIndex0: number, colIndex0: number) {
  const ref = ws['!ref'] || 'A1:A1';
  const range = XLSX.utils.decode_range(ref);
  range.e.r = Math.max(range.e.r, rowIndex0);
  range.e.c = Math.max(range.e.c, colIndex0);
  ws['!ref'] = XLSX.utils.encode_range(range);
}

export function buildModeOperatoireWorkbook(mo: any): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  const titre = mo.sous_activite_libelle || `MODE OPERATOIRE SECURITE DE ${(mo.intitule_poste || '').toUpperCase()}`;
  setCell(ws, 'A2', titre);
  setCell(ws, 'B3', 'Intitule du poste');
  setCell(ws, 'C3', mo.intitule_poste);
  setCell(ws, 'E3', 'Sous-activite');
  setCell(ws, 'F3', mo.sous_activite_code);
  setCell(ws, 'C4', 'Personnes concernees');
  setCell(ws, 'D4', mo.personnes_concernees);
  if (mo.description_generale) {
    setCell(ws, 'B4', 'Description generale');
    setCell(ws, 'A4', mo.description_generale);
  }

  const headerRow = 5;
  const headers = ['Tache', 'Risque present', 'Equipement de Protection Individuelle a porter',
    'Equipement de Protection Collective a utiliser', 'Procedures / Organisation a respecter',
    'Formations / Habilitations necessaires'];
  headers.forEach((h, i) => setCell(ws, XLSX.utils.encode_cell({ r: headerRow - 1, c: i }), h));

  mo.taches.forEach((t: any, i: number) => {
    const r = headerRow + 1 + i; // 1-indexed row after header
    setCell(ws, `A${r}`, t.tache);
    setCell(ws, `B${r}`, t.risque_present);
    setCell(ws, `C${r}`, t.epi);
    setCell(ws, `D${r}`, t.epc);
    setCell(ws, `E${r}`, t.procedures);
    setCell(ws, `F${r}`, t.formations);
  });

  extendRange(ws, headerRow - 1 + Math.max(mo.taches.length, 1), 5);
  ws['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 26 }, { wch: 26 }, { wch: 34 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Mode operatoire');
  return wb;
}

function writeAnalyseHeaders(ws: XLSX.WorkSheet, titre: string) {
  setCell(ws, 'B1', titre);
  setCell(ws, 'B2', 'Dangers identifies');
  setCell(ws, 'C2', 'Famille de risques');
  setCell(ws, 'D2', 'Risques associes a ces dangers et Nature des lesions probables / Facteurs aggravants potentiels');
  setCell(ws, 'E2', 'Partie(s) du corps concernee(s)');
  setCell(ws, 'J2', 'Cotation du risque potentiel');
  setCell(ws, 'M2', 'Rp');
  setCell(ws, 'N2', 'Moyens de maitrise et leur cotation');
  setCell(ws, 'X2', 'Cotation globale des moyens de maitrise');
  setCell(ws, 'Y2', 'Niveau de maitrise');
  setCell(ws, 'Z2', 'Cotation Rr');
  setCell(ws, 'AA2', 'Rr');

  setCell(ws, 'E3', 'Tete');
  setCell(ws, 'F3', 'Membres superieurs et/ou inferieurs');
  setCell(ws, 'G3', 'Divers');
  setCell(ws, 'H3', 'Voies de penetration');
  setCell(ws, 'I3', 'Autres');
  setCell(ws, 'J3', 'F');
  setCell(ws, 'K3', 'P');
  setCell(ws, 'L3', 'G');
  setCell(ws, 'N3', 'Mesures Techniques');
  setCell(ws, 'R3', 'Cotation MT');
  setCell(ws, 'S3', 'Facteurs Organisationnels et Humains');
  setCell(ws, 'W3', 'Cotation FOH');

  setCell(ws, 'N4', 'EPI');
  setCell(ws, 'O4', 'Cotation EPI');
  setCell(ws, 'P4', 'EPC');
  setCell(ws, 'Q4', 'Cotation EPC');
  setCell(ws, 'S4', 'Mesures Organisationnelles');
  setCell(ws, 'T4', 'Cotation MO');
  setCell(ws, 'U4', 'Mesures Humaines');
  setCell(ws, 'V4', 'Cotation MH');
}

function writeAnalyseLigneRow(ws: XLSX.WorkSheet, row: number, l: any, famillesMap: Map<number, string>) {
  setCell(ws, `B${row}`, l.danger);
  setCell(ws, `C${row}`, l.famille_risque_id != null ? famillesMap.get(l.famille_risque_id) : null);
  setCell(ws, `D${row}`, l.risques_associes);
  setCell(ws, `E${row}`, l.corps_tete ? 'X' : '');
  setCell(ws, `F${row}`, l.corps_membres ? 'X' : '');
  setCell(ws, `G${row}`, l.corps_divers ? 'X' : '');
  setCell(ws, `H${row}`, l.corps_voies_penetration ? 'X' : '');
  setCell(ws, `I${row}`, l.corps_autres);
  setCell(ws, `J${row}`, l.f);
  setCell(ws, `K${row}`, l.p);
  setCell(ws, `L${row}`, l.g);
  setCell(ws, `M${row}`, l.rp);
  setCell(ws, `N${row}`, l.epi);
  setCell(ws, `O${row}`, l.cotation_epi);
  setCell(ws, `P${row}`, l.epc);
  setCell(ws, `Q${row}`, l.cotation_epc);
  setCell(ws, `R${row}`, l.cotation_mt);
  setCell(ws, `S${row}`, l.mesures_organisationnelles);
  setCell(ws, `T${row}`, l.cotation_mo);
  setCell(ws, `U${row}`, l.mesures_humaines);
  setCell(ws, `V${row}`, l.cotation_mh);
  setCell(ws, `W${row}`, l.cotation_foh);
  setCell(ws, `X${row}`, l.cotation_globale);
  setCell(ws, `Y${row}`, l.niveau_maitrise);
  setCell(ws, `Z${row}`, l.rr);
  // AA (Rr, letter grade F/M/S/C) intentionally left blank - manual, filled by the user in Excel.
}

export function buildAnalyseWorkbook(mo: any, famillesMap: Map<number, string>): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  writeAnalyseHeaders(ws, mo.sous_activite_libelle || mo.intitule_poste || '');

  let row = 5;
  setCell(ws, `A${row}`, "ERPT liee a l'activite");
  const activite = mo.analyse_lignes.activite as any[];
  if (activite.length === 0) {
    row += 1;
  } else {
    for (const l of activite) {
      writeAnalyseLigneRow(ws, row, l, famillesMap);
      row += 1;
    }
  }

  setCell(ws, `A${row}`, "ERPT liee a l'environnement de travail");
  const environnement = mo.analyse_lignes.environnement as any[];
  if (environnement.length === 0) {
    row += 1;
  } else {
    for (const l of environnement) {
      writeAnalyseLigneRow(ws, row, l, famillesMap);
      row += 1;
    }
  }

  extendRange(ws, row, 26); // column AA = index 26
  ws['!cols'] = Array.from({ length: 27 }, (_, i) => ({ wch: i === 1 ? 26 : i === 3 ? 34 : 16 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Analyse');
  return wb;
}

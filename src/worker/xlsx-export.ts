import * as XLSX from 'xlsx';

type InrsMap = Map<number, string>;

function inrsLabel(id: number | null | undefined, inrsMap: InrsMap): string {
  if (id == null) return '';
  return inrsMap.get(id) ?? '';
}

function joinArr(v: unknown): string {
  return Array.isArray(v) ? v.join('\n') : '';
}

function flattenConditionsIntervention(conditions: any): (string | number)[][] {
  const rows: (string | number)[][] = [['Rubrique', 'Champ', 'Contenu']];
  if (!conditions || typeof conditions !== 'object') return rows;

  for (const [, section] of Object.entries<any>(conditions)) {
    if (!section || typeof section !== 'object') continue;
    const libelle = section.libelle ?? '';
    for (const [key, value] of Object.entries<any>(section)) {
      if (key === 'libelle') continue;
      let content: string;
      if (Array.isArray(value)) {
        content = value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join('\n');
      } else if (value && typeof value === 'object') {
        content = JSON.stringify(value);
      } else {
        content = String(value ?? '');
      }
      rows.push([libelle, key, content]);
    }
  }
  return rows;
}

export interface SiteInfo {
  nom: string;
  adresse?: string | null;
}

export function buildPlanPreventionWorkbook(doc: any, site: SiteInfo, inrsMap: InrsMap): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const documentRows: (string | number)[][] = [
    ['Champ', 'Valeur'],
    ['Site', site.nom],
    ['Adresse du site', site.adresse ?? ''],
    ['Titre', doc.titre ?? ''],
    ['Numero', doc.numero ?? ''],
    ['Reglementation', doc.reglementation ?? ''],
    ['Source PDF', doc.source_pdf ?? ''],
    ['Date extraction', doc.date_extraction ?? ''],
    ['Importe le', doc.imported_at ?? '']
  ];
  const wsDocument = XLSX.utils.aoa_to_sheet(documentRows);
  wsDocument['!cols'] = [{ wch: 22 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsDocument, 'Document');

  const wsConditions = XLSX.utils.aoa_to_sheet(flattenConditionsIntervention(doc.conditions_intervention));
  wsConditions['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsConditions, 'Conditions intervention');

  const ppRows: (string | number)[][] = [
    ['Page(s)', 'Rubrique', 'Concerne (rubrique)', 'Dangers', 'Concerne (ligne)', 'Risques',
     'Entreprises concernees', 'Moyens de prevention', 'Categorie INRS']
  ];

  for (const rub of doc.rubriques) {
    if (rub.type === 'gestion_dechets') {
      const gd = rub.gestion_dechets ?? {};
      const typesStr = (gd.types_dechets ?? [])
        .map((t: any) => `[${t.coche ? 'x' : ' '}] ${t.type}`)
        .join('\n');
      const contactsStr = (gd.contacts ?? [])
        .map((c: any) => `${c.nom ?? ''} ${c.tel ?? c.email ?? ''}`.trim())
        .join('\n');
      const moyens = [
        ...(gd.regles ?? []),
        'Types de dechets:', typesStr,
        `Localisation: ${gd.localisation_dechetterie ?? ''}`,
        'Contacts:', contactsStr
      ].join('\n');
      ppRows.push([
        String(rub.page_source ?? ''), rub.titre, rub.concerne ? 'oui' : 'non',
        `Gestion des dechets (${gd.entreprises_concernees ?? ''}) - horaires: ${gd.horaires_dechetterie ?? ''}`,
        '', '', gd.entreprises_concernees ?? '', moyens, ''
      ]);
      continue;
    }
    for (const l of rub.lignes) {
      ppRows.push([
        String(rub.page_source ?? ''), rub.titre, rub.concerne ? 'oui' : 'non',
        joinArr(l.dangers), l.concerne ? 'oui' : 'non', joinArr(l.risques),
        l.entreprises_concernees ?? '', joinArr(l.moyens_prevention),
        inrsLabel(l.inrs_category_id, inrsMap)
      ]);
    }
  }
  const wsPP = XLSX.utils.aoa_to_sheet(ppRows);
  wsPP['!cols'] = [{ wch: 10 }, { wch: 26 }, { wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 22 }, { wch: 24 }, { wch: 70 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, wsPP, 'Plan prevention');

  return wb;
}

export function buildDuerWorkbook(doc: any, inrsMap: InrsMap): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const documentRows: (string | number)[][] = [
    ['Champ', 'Valeur'],
    ['Titre', doc.titre ?? ''],
    ['Entite', doc.entite ?? ''],
    ['Adresse', doc.adresse ?? ''],
    ['Perimetre', doc.perimetre ?? ''],
    ['Date de mise a jour', doc.date_mise_a_jour ?? ''],
    ['Redacteurs', doc.redacteurs ?? ''],
    ['Source fichier', doc.source_fichier ?? ''],
    ['Importe le', doc.imported_at ?? '']
  ];
  const wsDocument = XLSX.utils.aoa_to_sheet(documentRows);
  wsDocument['!cols'] = [{ wch: 22 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsDocument, 'Document');

  const tacheRows: (string | number)[][] = [
    ['Ligne source', 'Principales operations/taches', "Facteur d'exposition", 'Risques', 'Risques INRS',
     'Equipement', 'Fonctionnement', 'Mesures de conception', 'Regles qui sauvent', 'EPC / EPI',
     'Formation specifique', 'Mesures organisationnelles', 'Further actions / mitigation', 'Comment', 'Categorie INRS']
  ];
  for (const t of doc.taches) {
    tacheRows.push([
      t.ligne_source ?? '', t.principales_operations ?? '', t.facteur_exposition ?? '',
      joinArr(t.risques), t.risques_inrs ?? '', t.equipement ?? '', t.fonctionnement ?? '',
      t.mesures_conception ?? '', joinArr(t.regles_qui_sauvent), joinArr(t.epc_epi),
      joinArr(t.formation_specifique), joinArr(t.mesures_organisationnelles),
      joinArr(t.further_actions), joinArr(t.comment), inrsLabel(t.inrs_category_id, inrsMap)
    ]);
  }
  const wsTaches = XLSX.utils.aoa_to_sheet(tacheRows);
  wsTaches['!cols'] = [
    { wch: 10 }, { wch: 24 }, { wch: 30 }, { wch: 26 }, { wch: 26 }, { wch: 20 }, { wch: 14 },
    { wch: 30 }, { wch: 28 }, { wch: 34 }, { wch: 30 }, { wch: 34 }, { wch: 30 }, { wch: 30 }, { wch: 28 }
  ];
  XLSX.utils.book_append_sheet(wb, wsTaches, 'DUER taches');

  return wb;
}

export function workbookToBuffer(wb: XLSX.WorkBook): Uint8Array {
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}

export async function loadInrsMap(db: D1Database): Promise<InrsMap> {
  const { results } = await db.prepare('SELECT id, libelle FROM inrs_categories').all<{ id: number; libelle: string }>();
  return new Map(results.map((r) => [r.id, r.libelle]));
}

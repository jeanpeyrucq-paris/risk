import * as XLSX from 'xlsx';

function joinArr(v: unknown): string {
  return Array.isArray(v) ? v.join('\n') : '';
}

const PROCEDURE_LABELS: Record<string, string> = { cbre: 'CBRE', client: 'Client' };
const STATUT_LABELS: Record<string, string> = {
  acceptee: 'Acceptee', refusee: 'Refusee', en_attente: 'En attente'
};

export function buildAnalyseComparisonWorkbook(analyse: any): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const documentRows: (string | number)[][] = [
    ['Champ', 'Valeur'],
    ['Site', analyse.site_nom],
    ['Entreprise', analyse.entreprise_nom],
    ['Cree le', analyse.created_at],
    ['Mis a jour le', analyse.updated_at]
  ];
  const wsDocument = XLSX.utils.aoa_to_sheet(documentRows);
  wsDocument['!cols'] = [{ wch: 20 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsDocument, 'Document');

  const rows: (string | number)[][] = [[
    'Categorie INRS', 'Couverture', 'Mesures Plan de prevention', 'Mesures DUER',
    'Procedure a appliquer', 'Analyse HSE', 'Statut procedure client'
  ]];

  for (const cmp of analyse.comparisons) {
    const mesuresPP = cmp.mesures_plan_prevention
      .map((l: any) => `[${l.rubrique_titre}] Dangers: ${joinArr(l.dangers)} | Risques: ${joinArr(l.risques)} | Moyens: ${joinArr(l.moyens_prevention)}`)
      .join('\n\n');
    const mesuresDuer = cmp.mesures_duer
      .map((t: any) => `[${t.principales_operations ?? ''} / ${t.facteur_exposition ?? ''}] EPC-EPI: ${joinArr(t.epc_epi)} | Mesures org.: ${joinArr(t.mesures_organisationnelles)} | Formation: ${joinArr(t.formation_specifique)}`)
      .join('\n\n');

    rows.push([
      `${cmp.inrs_category.code} - ${cmp.inrs_category.libelle}`,
      cmp.couverture === 'couvert' ? 'Couvert' : 'Non traite dans le DUER',
      mesuresPP,
      mesuresDuer,
      cmp.procedure_source ? PROCEDURE_LABELS[cmp.procedure_source] : '',
      cmp.analyse_hse ?? '',
      cmp.statut_procedure_client ? STATUT_LABELS[cmp.statut_procedure_client] : ''
    ]);
  }

  const wsAnalyse = XLSX.utils.aoa_to_sheet(rows);
  wsAnalyse['!cols'] = [
    { wch: 30 }, { wch: 22 }, { wch: 60 }, { wch: 60 }, { wch: 18 }, { wch: 40 }, { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsAnalyse, 'Analyse');

  return wb;
}

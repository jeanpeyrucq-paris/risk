// Derived cotation fields for the "analyse ERPT" lines of a mode operatoire.
// Formulas reverse-engineered from the real template (verified against 13 filled
// rows in `Evaluation des risques au poste de travail liée a l'activité.xlsx`):
// Rp = F x P x G ; cotation MT = MIN(EPI, EPC) ; cotation FOH = MO x MH ;
// cotation globale = AVERAGE(MT, FOH) ; niveau de maitrise = thresholded on globale ;
// Rr (numerique) = Rp x cotation globale.
// The final Rr LETTER (F/M/S/C) is intentionally not computed anywhere in the
// app, per explicit product decision: it stays a manual cell filled by the user
// directly in the exported Excel file.

export interface AnalyseLigneCotationInput {
  f: number | null;
  p: number | null;
  g: number | null;
  cotation_epi: number | null;
  cotation_epc: number | null;
  cotation_mo: number | null;
  cotation_mh: number | null;
}

export interface AnalyseLigneCotationDerived {
  rp: number | null;
  cotation_mt: number | null;
  cotation_foh: number | null;
  cotation_globale: number | null;
  niveau_maitrise: number | null;
  rr: number | null;
}

export function computeCotationDerived(l: AnalyseLigneCotationInput): AnalyseLigneCotationDerived {
  const rp = l.f != null && l.p != null && l.g != null ? l.f * l.p * l.g : null;
  const cotationMt = l.cotation_epi != null && l.cotation_epc != null
    ? Math.min(l.cotation_epi, l.cotation_epc)
    : null;
  const cotationFoh = l.cotation_mo != null && l.cotation_mh != null
    ? l.cotation_mo * l.cotation_mh
    : null;
  const cotationGlobale = cotationMt != null && cotationFoh != null
    ? (cotationMt + cotationFoh) / 2
    : null;
  const niveauMaitrise = cotationGlobale != null
    ? (cotationGlobale <= 0.5 ? 1 : (cotationGlobale < 0.75 ? 2 : 3))
    : null;
  const rr = rp != null && cotationGlobale != null ? rp * cotationGlobale : null;

  return {
    rp,
    cotation_mt: cotationMt,
    cotation_foh: cotationFoh,
    cotation_globale: cotationGlobale,
    niveau_maitrise: niveauMaitrise,
    rr
  };
}

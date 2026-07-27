// Derived cotation fields for the "analyse ERPT" lines of a mode operatoire.
// Formulas confirmed from the live Excel formulas embedded in the real template
// (`Grille_analyse_risques_export.xlsx`, e.g. row 13: M13=J13*K13*L13,
// R13=PRODUCT(O13,Q13), W13=PRODUCT(T13,V13), Y13=IF(...), Z13=M13*X13):
// Rp = F x P x G ; cotation MT = EPI x EPC ; cotation FOH = MO x MH ;
// niveau de maitrise = thresholded on cotation globale ;
// Rr (numerique) = Rp x cotation globale.
//
// `cotation_globale` here is an AVERAGE(MT, FOH) approximation, used only for
// the on-screen live preview (API response, UI). The real Excel formula (X)
// is `HLOOKUP(MT, Cotation!$D$76:$M$86, MATCH(FOH, Cotation!$C$76:$C$86, 0))`
// - a bilinear interpolation against a matrix in the template's "Cotation"
// sheet, itself derived from further anchor cells - not replicated here since
// the exported Excel file carries that sheet and computes X live (see
// xlsx-mode-operatoire-export.ts). AVERAGE happened to match on the sampled
// rows checked so far but is not proven equivalent in general.
//
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
    ? l.cotation_epi * l.cotation_epc
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

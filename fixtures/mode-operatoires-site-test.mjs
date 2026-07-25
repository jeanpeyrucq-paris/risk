// Two worked examples transcribed from the real template
// `Evaluation des risques au poste de travail liée a l'activité.xlsx`
// (sheets "Mode operatoire 1" + "Sheet1" rows 5-37 for the first example,
// "Mode operatoire 1 (2)" + "Sheet1" rows 47-77 for the second). Used to
// seed "Site TEST" with paired mode-operatoire + analyse examples.

export const modeOperatoireCTA = {
  intitule_poste: "Maintenance Centrale de Traitement d'Air animalerie",
  sous_activite_libelle: 'MODE OPERATOIRE SECURITE DE LA SOUS-ACTIVITE 1',
  taches: [
    {
      tache: "Consignation de la CTA\nDisjonction du soufflage et de l'extraction\nVAT\nPrise d'intensite sur les trois phases au niveau de l'armoire electrique\nResserage des connexions au niveau du boite a bornes moteur",
      risque_present: 'Electrisation lors de la consignation de la CTA',
      epi: 'Gants de protection electrique classe 00',
      procedures: "Verification de l'etancheite des gants de protection electrique avant toute operation sur l'armoire electrique ou pendant la VAT\n\nVerification d'absence de tension (VAT) avant intervention (etape de la consignation)\n\nRemplir l'attestation de consignation avant d'intervenir\n\nFermer systematiquement l'armoire apres etre intervenu dessus",
      formations: 'Personnel forme au risque electrique'
    },
    { tache: 'Changement des filtres', risque_present: 'Coupure/ecrasement au niveau des doigts', epi: 'Gants de protection mecanique' },
    {
      tache: 'Changement des filtres\n\nNettoyage du compartiment filtres et du compartiment moteur',
      risque_present: "Etranglement si port du badge autour du cou : badge pris dans les helices du ventilateur si la rotation des helices se declenche\n\nBlessures aux doigts si les doigts sont en contact avec la partie tournante active",
      epi: 'Gants de protection mecanique',
      procedures: "Retrait du badge avant intervention"
    },
    { tache: 'Changement des filtres\n\nNettoyage du compartiment filtres et du compartiment moteur', risque_present: 'Inhalation de poussieres', epi: 'Masque FFP3' },
    {
      tache: 'Nettoyage du compartiment filtres et du compartiment moteur',
      risque_present: 'Projection de produit nettoyant dans les yeux ou contamination sur les mains',
      epi: 'Gant de protection\nLunettes',
      procedures: 'La FDS du produit doit etre a disposition'
    },
    { tache: 'Changement des filtres\n\nNettoyage du compartiment filtres et du compartiment moteur', risque_present: 'Troubles Musculo-Squelettiques', formations: "Personnel forme au risque lies a l'ergonomie" },
    { tache: 'Activite en local technique', risque_present: "Chute d'objets en hauteur\nChoc contre les objets constituant le local technique", epi: 'Casquette / Casque de securite\nChaussures de securite' },
    { tache: 'Activite en local technique', risque_present: 'Chute liee a la configuration du local', epi: 'Casquette / Casque de securite\nChaussures de securite' },
    { tache: 'Activite en local technique', risque_present: 'Brulure chaude / froide', epi: 'Tenue de travail couvrante', procedures: 'Canalisations calorifugees' }
  ],
  // famille: one of the 16 familles_risques.libelle values (must match exactly)
  analyseActivite: [
    { danger: 'Armoire electrique 400 V', famille: 'ELECTRIQUE', risques_associes: 'Electrisation lors de la consignation de la CTA', f: 2, p: 2, g: 3, epi: 'Gants de protection electrique classe 00', cotation_epi: 0.5, cotation_epc: 1, mesures_organisationnelles: "Verification de l'etancheite des gants...", cotation_mo: 0.5, mesures_humaines: 'Personnel forme au risque electrique', cotation_mh: 0.5 },
    { danger: 'Filtres', famille: 'MECANIQUE', risques_associes: 'Coupure/ecrasement au niveau des doigts lors du changement des filtres', f: 2, p: 2, g: 1, epi: 'Gants de protection mecanique', cotation_epi: 0.5, cotation_epc: 1, cotation_mo: 1, cotation_mh: 1 },
    { danger: 'Parties tournantes du moteur', famille: 'MECANIQUE', risques_associes: "Etranglement si port du badge autour du cou / blessures aux doigts", f: 2, p: 1, g: 4, epi: 'Gants de protection mecanique', cotation_epi: 0.5, cotation_epc: 1, mesures_organisationnelles: 'Retrait du badge avant intervention', cotation_mo: 0.5, cotation_mh: 1 },
    { famille: 'CHUTE DE HAUTEUR' },
    { famille: 'MANUTENTION / ERGONOMIE' },
    { famille: 'INCENDIE / EXPLOSION' },
    { famille: 'BRUIT / VIBRATIONS' },
    { famille: 'RAYONNEMENTS IONISANTS / NON IONISANTS' },
    { famille: 'BIOLOGIQUE' },
    { danger: 'Poussiere', famille: 'HYGIENE', risques_associes: 'Inhalation de poussieres', f: 2, p: 1, g: 1, epi: 'Masque FFP3\nBlouse', cotation_epi: 0.5, cotation_epc: 1, cotation_mo: 1, cotation_mh: 1 },
    { danger: 'Produit de nettoyage', famille: 'CHIMIQUE', risques_associes: 'Projection de produit nettoyant dans les yeux ou contamination sur les mains', f: 2, p: 1, g: 1, epi: 'Gant de protection\nBlouse\nLunettes', cotation_epi: 0.75, cotation_epc: 1, mesures_organisationnelles: 'La FDS du produit doit etre a disposition', cotation_mo: 0.5, cotation_mh: 1 },
    { famille: "CHUTE D'OBJETS" },
    { famille: 'ANOXIE' },
    { famille: 'CHUTE DE PLAIN PIED' },
    { famille: 'FLUIDES / SURPRESSION' },
    { famille: 'TRAVAIL ISOLE' },
    { famille: 'AMBIANCE THERMIQUE / SURFACES CHAUDES OU FROIDES' }
  ],
  analyseEnvironnement: [
    { famille: 'ELECTRIQUE' },
    { famille: 'MECANIQUE' },
    { famille: 'CHUTE DE HAUTEUR' },
    { danger: 'Configuration exigue de la CTA', famille: 'MANUTENTION / ERGONOMIE', risques_associes: 'Douleurs', f: 2, p: 2, g: 1, cotation_epi: 1, cotation_epc: 1, cotation_mo: 1, mesures_humaines: "Personnel forme au risque lies a l'ergonomie", cotation_mh: 0.5 },
    { famille: 'INCENDIE / EXPLOSION' },
    { famille: 'BRUIT / VIBRATIONS' },
    { famille: 'RAYONNEMENTS IONISANTS / NON IONISANTS' },
    { famille: 'BIOLOGIQUE' },
    { famille: 'HYGIENE' },
    { famille: 'CHIMIQUE' },
    { danger: 'Configuration du Local technique', famille: "CHUTE D'OBJETS", risques_associes: "Chute d'objets en hauteur\nChoc contre les objets constituant le local technique", f: 2, p: 1, g: 1, epi: 'Casquette / Casque de securite\nChaussures de securite', cotation_epi: 0.5, cotation_epc: 1, cotation_mo: 1, cotation_mh: 1 },
    { famille: 'ANOXIE' },
    { danger: 'Configuration du Local technique', famille: 'CHUTE DE PLAIN PIED', risques_associes: 'Chute liee a la configuration du local', f: 3, p: 1, g: 1, epi: 'Casquette / Casque de securite\nChaussures de securite', cotation_epi: 0.5, cotation_epc: 1, cotation_mo: 1, cotation_mh: 1 },
    { famille: 'FLUIDES / SURPRESSION' },
    { famille: 'TRAVAIL ISOLE' },
    { danger: 'Canalisation eau chaude', famille: 'AMBIANCE THERMIQUE / SURFACES CHAUDES OU FROIDES', risques_associes: 'Brulure chaude / froide', f: 2, p: 1, g: 1, epi: 'Tenue de travail couvrante', cotation_epi: 0.5, cotation_epc: 1, mesures_organisationnelles: 'Canalisations calorifugees', cotation_mo: 0.5, cotation_mh: 1 }
  ]
};

export const modeOperatoirePanne = {
  intitule_poste: 'Recherche panne equipement sous tension',
  sous_activite_code: '002_03',
  sous_activite_libelle: 'MODE OPERATOIRE SECURITE DE LA RECHERCHE DE PANNE SUR UN EQUIPEMENT SOUS TENSION (002_03)',
  personnes_concernees: 'Equipes Elec',
  taches: [
    {
      tache: "Recherche de panne sur l'equipement",
      risque_present: 'Electrisation, electrocution car equipement alimente, lors de la recherche de panne avec voltmetre',
      epi: 'Verification et port des EPI :\n- Gants isolants de type 00\n- Casque avec visiere\n- Vetements couvrant (avant-bras et jambes)',
      epc: "Utilisation d'equipements adaptes a la tension et isoles",
      procedures: "Intervention d'ordre electrique a deux minimum\n\nPermis specifique de travail au voisinage de pieces nues sous tension\n\nUne fois la recherche de panne realisee sur l'equipement, celui-ci doit etre CONSIGNE a partir de l'armoire (avec cadenas)",
      formations: 'Habilitation electrique de type BR'
    },
    {
      risque_present: "Risque faible voir nul d'Electrisation, electrocution liees a l'intensite electrique circulant dans les armoires : armoires IP2X\n\nRecherche panne avec voltmetre ou pince ohmetrique",
      epi: 'Non necessaire',
      epc: "Isolation des parties actives de l'appareil de test (pointe de touche isolee)",
      procedures: "Affichage reglementaire sur les armoires, fermees a cles.\n\nA l'ouverture de l'armoire, verifier la presence de la protection IP2X. En cas d'anomalie constatee, porter les EPI et remonter l'anomalie.",
      formations: 'Habilitation electrique de type BR'
    },
    {
      tache: "Travail sur ou a proximite de l'armoire electrique et de l'equipement",
      risque_present: "Declenchement d'un incendie lie a la presence d'electricite dans l'armoire et l'equipement",
      epi: 'Non necessaire',
      epc: "Detection incendie\n\nDisjoncteur\n\nPresence d'extincteur CO2 a proximite de l'intervention",
      procedures: "Reperer les equipements d'urgence a proximite (BAU, boitiers bris de glaces, extincteurs CO2...)\n\nNe pas stocker d'outils/equipements devant les extincteurs",
      formations: "Intervenants sensibilises au risque incendie lie a l'electricite et aux conduites a tenir en cas d'alarme feu"
    },
    {
      tache: 'Deplacements',
      risque_present: 'Risque de chute de plain-pied lors des deplacements en zone technique',
      epi: 'Chaussures de securite, casquettes de securite',
      epc: 'Non necessaire',
      procedures: 'Tenir la rampe dans les escaliers\nRegarder devant soi en marchant\nRester vigilant aux marches et sols glissants\n\nRanger le materiel hors des zones de passage et a la fin de chaque intervention',
      formations: 'Intervenants et collaborateurs sensibilises aux risques de chute de plain pied'
    }
  ],
  analyseActivite: [
    { danger: 'Equipement alimente en electricite', famille: 'ELECTRIQUE', risques_associes: 'Electrisation, electrocution car equipement alimente, lors de la recherche de panne avec voltmetre', f: 3, p: 2, g: 4, epi: 'Vetements et EPI electriciens (gants isolants 00, casque avec visiere, vetements couvrants)', cotation_epi: 0.5, epc: "Utilisation d'equipements adaptes a la tension et isoles", cotation_epc: 0.5, mesures_organisationnelles: 'Intervention a deux minimum, permis de travail au voisinage', cotation_mo: 0.5, mesures_humaines: 'Habilitation electrique de type BR', cotation_mh: 0.5 },
    { danger: 'Armoires alimentees en electricite', famille: 'ELECTRIQUE', risques_associes: "Risque faible voir nul d'Electrisation, electrocution liees a l'intensite electrique circulant dans les armoires (IP2X)", f: 3, p: 2, g: 4, epi: 'Non necessaire', cotation_epi: 1, epc: "Isolation des parties actives de l'appareil de test", cotation_epc: 0.5, mesures_organisationnelles: 'Affichage reglementaire sur les armoires fermees a cles', cotation_mo: 0.5, mesures_humaines: 'Habilitation electrique de type BR', cotation_mh: 0.5 },
    { famille: 'MECANIQUE' },
    { famille: 'CHUTE DE HAUTEUR' },
    { famille: 'MANUTENTION / ERGONOMIE' },
    { danger: 'Traite dans la partie environnement', famille: 'INCENDIE / EXPLOSION' },
    { famille: 'BRUIT / VIBRATIONS' },
    { famille: 'RAYONNEMENTS IONISANTS / NON IONISANTS' },
    { famille: 'BIOLOGIQUE' },
    { famille: 'CHIMIQUE' },
    { famille: "CHUTE D'OBJETS" },
    { famille: 'ANOXIE' },
    { danger: 'Traite dans la partie environnement', famille: 'CHUTE DE PLAIN PIED' },
    { famille: 'FLUIDES / SURPRESSION' },
    { danger: 'Depannage a deux obligatoire', famille: 'TRAVAIL ISOLE', risques_associes: 'Risque nul : le travail isole est interdit' },
    { famille: 'AMBIANCE THERMIQUE / SURFACES CHAUDES OU FROIDES' }
  ],
  analyseEnvironnement: [
    { danger: "Traite dans la partie activite", famille: 'ELECTRIQUE' },
    { famille: 'MECANIQUE' },
    { famille: 'CHUTE DE HAUTEUR' },
    { famille: 'MANUTENTION / ERGONOMIE' },
    { danger: 'Armoires et equipement alimentes en electricite', famille: 'INCENDIE / EXPLOSION', risques_associes: "Declenchement d'un incendie lie a la presence d'electricite dans l'armoire et l'equipement", f: 3, p: 2, g: 3, epi: 'Non necessaire', cotation_epi: 1, epc: "Detection incendie, disjoncteur, extincteur CO2 a proximite", cotation_epc: 0.5, mesures_organisationnelles: "Reperer les equipements d'urgence a proximite", cotation_mo: 0.5, mesures_humaines: "Intervenants sensibilises au risque incendie lie a l'electricite", cotation_mh: 0.5 },
    { famille: 'BRUIT / VIBRATIONS' },
    { famille: 'RAYONNEMENTS IONISANTS / NON IONISANTS' },
    { famille: 'BIOLOGIQUE' },
    { famille: 'CHIMIQUE' },
    { danger: 'Locaux techniques', famille: "CHUTE D'OBJETS" },
    { famille: 'ANOXIE' },
    { danger: 'Locaux techniques', famille: 'CHUTE DE PLAIN PIED', risques_associes: 'Risque de chute de plain-pied lors des deplacements en zone technique', f: 3, p: 2, g: 2, epi: 'Chaussures de securite, casquettes de securite', cotation_epi: 0.5, epc: 'Non necessaire', cotation_epc: 1, mesures_organisationnelles: 'Tenir la rampe dans les escaliers, regarder devant soi en marchant', cotation_mo: 0.5, mesures_humaines: 'Intervenants et collaborateurs sensibilises aux risques de chute de plain pied', cotation_mh: 0.5 },
    { famille: 'FLUIDES / SURPRESSION' },
    { danger: "Traite dans la partie activite", famille: 'TRAVAIL ISOLE' },
    { famille: 'AMBIANCE THERMIQUE / SURFACES CHAUDES OU FROIDES' }
  ]
};

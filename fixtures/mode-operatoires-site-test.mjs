// Two worked examples transcribed from the real template
// `Evaluation des risques au poste de travail liée a l'activité.xlsx`
// (sheets "Mode operatoire 1" + "Sheet1" rows 5-37 for the first example,
// "Mode operatoire 1 (2)" + "Sheet1" rows 47-77 for the second). Used to
// seed "Site TEST" with paired mode-operatoire + analyse examples.
//
// Four more mode-operatoire-only examples (transcribed directly from the user,
// no matching cotation/analyse data exists for these) are appended below:
// Maintenance des pompes a vide, Essais hebdo motopompe sprinkler diesel et
// jockey, Entretien et controle du traitement d'eau, Maintenance preventive
// annuelle des CTA avec et sans courroies.

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
    { danger: 'Armoire electrique 400 V', famille: '5. Electricite', risques_associes: 'Electrisation lors de la consignation de la CTA', f: 2, p: 2, g: 3, epi: 'Gants de protection electrique classe 00', cotation_epi: 0.5, cotation_epc: 1, mesures_organisationnelles: "Verification de l'etancheite des gants...", cotation_mo: 0.5, mesures_humaines: 'Personnel forme au risque electrique', cotation_mh: 0.5 },
    { danger: 'Filtres', famille: '4.1 Mecanique', risques_associes: 'Coupure/ecrasement au niveau des doigts lors du changement des filtres', f: 2, p: 2, g: 1, epi: 'Gants de protection mecanique', cotation_epi: 0.5, cotation_epc: 1, cotation_mo: 1, cotation_mh: 1 },
    { danger: 'Parties tournantes du moteur', famille: '4.1 Mecanique', risques_associes: "Etranglement si port du badge autour du cou / blessures aux doigts", f: 2, p: 1, g: 4, epi: 'Gants de protection mecanique', cotation_epi: 0.5, cotation_epc: 1, mesures_organisationnelles: 'Retrait du badge avant intervention', cotation_mo: 0.5, cotation_mh: 1 },
    { famille: '2. Chute de hauteur' },
    { famille: '1.2 Manutention-ergonomie' },
    { famille: '6.2 Incendie' },
    { famille: '3. Bruit-vibration' },
    { famille: '9.5 Rayonnements ionisants - non ionisants' },
    { famille: '7.3 Biologique' },
    { danger: 'Poussiere', famille: '7.1 Hygiene', risques_associes: 'Inhalation de poussieres', f: 2, p: 1, g: 1, epi: 'Masque FFP3\nBlouse', cotation_epi: 0.5, cotation_epc: 1, cotation_mo: 1, cotation_mh: 1 },
    { danger: 'Produit de nettoyage', famille: '7.2 Chimique', risques_associes: 'Projection de produit nettoyant dans les yeux ou contamination sur les mains', f: 2, p: 1, g: 1, epi: 'Gant de protection\nBlouse\nLunettes', cotation_epi: 0.75, cotation_epc: 1, mesures_organisationnelles: 'La FDS du produit doit etre a disposition', cotation_mo: 0.5, cotation_mh: 1 },
    { famille: "1.3 Chute d'objet" },
    { famille: '7.4 Anoxie' },
    { famille: '1.1 Chute de plain-pied' },
    { famille: '4.3 Fluides-surpression' },
    { famille: '8.1 Travail isole' },
    { famille: '4.2 Ambiance thermique - surfaces chaudes ou froides' }
  ],
  analyseEnvironnement: [
    { famille: '5. Electricite' },
    { famille: '4.1 Mecanique' },
    { famille: '2. Chute de hauteur' },
    { danger: 'Configuration exigue de la CTA', famille: '1.2 Manutention-ergonomie', risques_associes: 'Douleurs', f: 2, p: 2, g: 1, cotation_epi: 1, cotation_epc: 1, cotation_mo: 1, mesures_humaines: "Personnel forme au risque lies a l'ergonomie", cotation_mh: 0.5 },
    { famille: '6.2 Incendie' },
    { famille: '3. Bruit-vibration' },
    { famille: '9.5 Rayonnements ionisants - non ionisants' },
    { famille: '7.3 Biologique' },
    { famille: '7.1 Hygiene' },
    { famille: '7.2 Chimique' },
    { danger: 'Configuration du Local technique', famille: "1.3 Chute d'objet", risques_associes: "Chute d'objets en hauteur\nChoc contre les objets constituant le local technique", f: 2, p: 1, g: 1, epi: 'Casquette / Casque de securite\nChaussures de securite', cotation_epi: 0.5, cotation_epc: 1, cotation_mo: 1, cotation_mh: 1 },
    { famille: '7.4 Anoxie' },
    { danger: 'Configuration du Local technique', famille: '1.1 Chute de plain-pied', risques_associes: 'Chute liee a la configuration du local', f: 3, p: 1, g: 1, epi: 'Casquette / Casque de securite\nChaussures de securite', cotation_epi: 0.5, cotation_epc: 1, cotation_mo: 1, cotation_mh: 1 },
    { famille: '4.3 Fluides-surpression' },
    { famille: '8.1 Travail isole' },
    { danger: 'Canalisation eau chaude', famille: '4.2 Ambiance thermique - surfaces chaudes ou froides', risques_associes: 'Brulure chaude / froide', f: 2, p: 1, g: 1, epi: 'Tenue de travail couvrante', cotation_epi: 0.5, cotation_epc: 1, mesures_organisationnelles: 'Canalisations calorifugees', cotation_mo: 0.5, cotation_mh: 1 }
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
    { danger: 'Equipement alimente en electricite', famille: '5. Electricite', risques_associes: 'Electrisation, electrocution car equipement alimente, lors de la recherche de panne avec voltmetre', f: 3, p: 2, g: 4, epi: 'Vetements et EPI electriciens (gants isolants 00, casque avec visiere, vetements couvrants)', cotation_epi: 0.5, epc: "Utilisation d'equipements adaptes a la tension et isoles", cotation_epc: 0.5, mesures_organisationnelles: 'Intervention a deux minimum, permis de travail au voisinage', cotation_mo: 0.5, mesures_humaines: 'Habilitation electrique de type BR', cotation_mh: 0.5 },
    { danger: 'Armoires alimentees en electricite', famille: '5. Electricite', risques_associes: "Risque faible voir nul d'Electrisation, electrocution liees a l'intensite electrique circulant dans les armoires (IP2X)", f: 3, p: 2, g: 4, epi: 'Non necessaire', cotation_epi: 1, epc: "Isolation des parties actives de l'appareil de test", cotation_epc: 0.5, mesures_organisationnelles: 'Affichage reglementaire sur les armoires fermees a cles', cotation_mo: 0.5, mesures_humaines: 'Habilitation electrique de type BR', cotation_mh: 0.5 },
    { famille: '4.1 Mecanique' },
    { famille: '2. Chute de hauteur' },
    { famille: '1.2 Manutention-ergonomie' },
    { danger: 'Traite dans la partie environnement', famille: '6.2 Incendie' },
    { famille: '3. Bruit-vibration' },
    { famille: '9.5 Rayonnements ionisants - non ionisants' },
    { famille: '7.3 Biologique' },
    { famille: '7.2 Chimique' },
    { famille: "1.3 Chute d'objet" },
    { famille: '7.4 Anoxie' },
    { danger: 'Traite dans la partie environnement', famille: '1.1 Chute de plain-pied' },
    { famille: '4.3 Fluides-surpression' },
    { danger: 'Depannage a deux obligatoire', famille: '8.1 Travail isole', risques_associes: 'Risque nul : le travail isole est interdit' },
    { famille: '4.2 Ambiance thermique - surfaces chaudes ou froides' }
  ],
  analyseEnvironnement: [
    { danger: "Traite dans la partie activite", famille: '5. Electricite' },
    { famille: '4.1 Mecanique' },
    { famille: '2. Chute de hauteur' },
    { famille: '1.2 Manutention-ergonomie' },
    { danger: 'Armoires et equipement alimentes en electricite', famille: '6.2 Incendie', risques_associes: "Declenchement d'un incendie lie a la presence d'electricite dans l'armoire et l'equipement", f: 3, p: 2, g: 3, epi: 'Non necessaire', cotation_epi: 1, epc: "Detection incendie, disjoncteur, extincteur CO2 a proximite", cotation_epc: 0.5, mesures_organisationnelles: "Reperer les equipements d'urgence a proximite", cotation_mo: 0.5, mesures_humaines: "Intervenants sensibilises au risque incendie lie a l'electricite", cotation_mh: 0.5 },
    { famille: '3. Bruit-vibration' },
    { famille: '9.5 Rayonnements ionisants - non ionisants' },
    { famille: '7.3 Biologique' },
    { famille: '7.2 Chimique' },
    { danger: 'Locaux techniques', famille: "1.3 Chute d'objet" },
    { famille: '7.4 Anoxie' },
    { danger: 'Locaux techniques', famille: '1.1 Chute de plain-pied', risques_associes: 'Risque de chute de plain-pied lors des deplacements en zone technique', f: 3, p: 2, g: 2, epi: 'Chaussures de securite, casquettes de securite', cotation_epi: 0.5, epc: 'Non necessaire', cotation_epc: 1, mesures_organisationnelles: 'Tenir la rampe dans les escaliers, regarder devant soi en marchant', cotation_mo: 0.5, mesures_humaines: 'Intervenants et collaborateurs sensibilises aux risques de chute de plain pied', cotation_mh: 0.5 },
    { famille: '4.3 Fluides-surpression' },
    { danger: "Traite dans la partie activite", famille: '8.1 Travail isole' },
    { famille: '4.2 Ambiance thermique - surfaces chaudes ou froides' }
  ]
};

export const modeOperatoirePompesAVide = {
  intitule_poste: 'Maintenance des pompes a vide',
  description_generale: "Les pompes a vide doivent regulierement faire l'objet de remplissage d'isopropanol-eau. Ce melange isopropanol-eau est realise au prealable : sous une sorbonne dans un local a proximite pour l'ajout d'isopropanol pur et dans les zones techniques sur le meme etage pour l'ajout d'eau.",
  taches: [
    {
      tache: 'Environnement de travail',
      risque_present: "Risques lies aux brulures ou a une explosion en cas de combustion de l'isopropanol stocke. Aggravation d'un incendie lie a la combustion d'isopropanol. Pas de risque incendie lie aux vapeurs : apres mesures de vapeurs, la concentration de ces dernieres en dehors de la sorbonne (lors du remplissage des bidons avec de l'eau) ne depassent pas 82 ppm dans les pires cas (20 000ppm sont necessaires pour une combustion)",
      epi: 'Non necessaire',
      epc: "Flacons d'isopropanol stockes dans une armoire coupe-feu. Introduction d'isopropanol dans les bidons sous sorbonne",
      procedures: "Interdiction de stocker d'autres produits dans l'armoire. Affichage realise sur l'armoire : « armoire reservee au stockage d'isopropanol (contacter les Services Techniques pour toute demande a ce sujet) »",
      formations: 'Non necessaire'
    },
    {
      tache: 'Deplacement des bidons',
      risque_present: 'Difficulte de deplacer les nombreux bidons. Possibilite de TMS (Troubles Musculo-Squelettiques)',
      epi: 'Port de chaussures de securite',
      epc: 'Non necessaires',
      procedures: "Utilisation d'un chariot pour deplacer les bidons et utilisation d'un tuyau pour remplir les bidons d'eau",
      formations: 'Non necessaire'
    },
    {
      tache: 'Melange sous la hotte',
      risque_present: "Penibilite de l'activite de preparation du melange sous la sorbonne. Possibilite de TMS (Troubles Musculo-squelettiques)",
      epi: 'Non necessaire', epc: 'Non necessaire', procedures: 'Non necessaire', formations: 'Non necessaire'
    },
    {
      tache: "Versement de l'isopropanol dans les bidons",
      risque_present: 'Risques lies aux produits chimiques, appartenant aux chimistes, presents dans la sorbonne',
      epi: 'Port de blouse, gants et lunettes',
      epc: 'Non necessaire',
      procedures: 'Non necessaire',
      formations: 'Sensibilisation au probleme de rangement de la sorbonne realisee aupres des collaborateurs'
    },
    {
      tache: 'Remplissage de la pompe',
      risque_present: "Projection du melange contenant de l'isopropanol, toxicite liee a l'inhalation : apres mesures des vapeurs, pas de toxicite liee aux activites. Mesures : 1,85ppm mesure au maximum au niveau des voies respiratoires (seuil reglementaire de 400 ppm pour 15min)",
      epi: 'Port de blouse, gants et lunettes',
      epc: 'Non necessaire',
      procedures: "Utilisation d'un entonnoir pour faciliter le versement sous la sorbonne et dans les pompes",
      formations: 'Non necessaire'
    },
    {
      tache: "Versement d'isopropanol dans un bidon",
      risque_present: "Projection du melange contenant de l'isopropanol, toxicite liee a l'inhalation : apres mesures des vapeurs, pas de toxicite liee aux activites. Mesures : 1,85ppm mesure au maximum au niveau des voies respiratoires (seuil reglementaire de 400 ppm pour 15min)",
      epi: 'Port de blouse, gants et lunettes',
      epc: 'Utilisation de la sorbonne pour le versement',
      procedures: "Utilisation d'un entonnoir pour faciliter le versement sous la sorbonne et dans les pompes",
      formations: 'Non necessaire'
    },
    {
      tache: "Remplissage d'un bidon avec de l'eau",
      risque_present: "Projection du melange contenant de l'isopropanol, toxicite liee a l'inhalation : apres mesures des vapeurs, pas de toxicite liee aux activites. Mesures : 1,85ppm mesure au maximum au niveau des voies respiratoires (seuil reglementaire de 400 ppm pour 15min)",
      epi: 'Port de blouse, gants et lunettes',
      epc: 'Non necessaire',
      procedures: "Utilisation d'un flexible pour faciliter le melange eau-isopropanol",
      formations: 'Non necessaire'
    },
    {
      tache: "Manipulation des bidons et flacons d'isopropanol",
      risque_present: "Deversement accidentel d'isopropanol ou de melange isopropanol-eau",
      epi: 'Port de blouse, gants et lunettes',
      epc: "Utilisation du kit de deversement accidentel a disposition dans le sas du pignon technique",
      procedures: "Prevenir en cas de deversement en appelant le PCS (numero d'urgence) et le service HSE",
      formations: 'Intervenants sensibilises au deversement accidentel de produit chimique'
    },
    {
      tache: 'Environnement de travail',
      risque_present: "Mesure de bruit realisees : pas de consequences sur l'audition. Bruit max : 80dB au fond du local, bruit moyen : 75dB, sachant que l'intervenant ne reste dans le local qu'une heure maximum par jour.",
      epi: 'Non necessaire', epc: 'Non necessaire', procedures: 'Non necessaire', formations: 'Non necessaire'
    }
  ],
  analyseActivite: [],
  analyseEnvironnement: []
};

export const modeOperatoireMotopompeSprinkler = {
  intitule_poste: 'Essais hebdo motopompe sprinkler diesel et jockey',
  description_generale: "Il est necessaire de verifier les niveaux suivants : - huile : verification a l'aide de la jauge, - liquide de refroidissement : verification visuelle du niveau, - electrolytes : verification du niveau d'electrolytes dans les batteries. Si ce niveau est insuffisant, il est necessaire d'ajouter de l'eau demineralisee dans les batteries, - cuve fuel : verification du niveau de remplissage, remplissage si necessaire.",
  taches: [
    {
      tache: 'Verification du niveau de liquide de refroidissement',
      risque_present: "Brulure lors de l'ouverture du bouchon pour la verification du niveau de liquide de refroidissement.\nEffet aggravant : pas de possibilite de rincage a proximite",
      epi: "Cette operation ne doit pas etre realisee lorsque le liquide de refroidissement est chaud. L'intervenant garde ses lunettes de securite en permanence.",
      epc: 'Rince-oeil en cas de projection',
      procedures: "Il ne faut jamais ouvrir le reservoir pendant le fonctionnement du moteur. Attendre 1h apres arret du moteur. Checker la temperature du liquide de refroidissement sur l'indicateur.",
      formations: 'Sensibilisation des operateurs'
    },
    {
      tache: 'Verification du niveau et remplissage de la cuve fuel',
      risque_present: "Projection de fuel sur l'operateur pendant la verification visuelle du niveau et/ou le remplissage de la cuve.\nEffet aggravant : pas de possibilite de rincage a proximite",
      epi: 'Port des standards chantiers, dont les chaussures de securite, les lunettes de securite, les vetements couvrant bras et jambes et la casquette de securite',
      epc: 'Non necessaire',
      procedures: "Adaptation de la sortie d'air (sortie ramenee a la cuve de retention)",
      formations: 'Sensibilisation des operateurs'
    },
    {
      tache: 'Verification du niveau et remplissage de la cuve fuel',
      risque_present: 'Inhalation de vapeurs de fuel lors du remplissage de la cuve',
      epi: "Des mesures PID doivent etre realisees, selon le resultat le risque sera avere ou non. Si le risque est avere, le port d'un masque a cartouches sera necessaire.",
      epc: 'Non necessaire',
      procedures: "Adaptation de la sortie d'air (sortie ramenee a la cuve de retention)",
      formations: 'Sensibilisation des operateurs'
    },
    {
      tache: "Controles visuels de l'etat de la pompe",
      risque_present: 'Ecrasement des doigts au niveau de la partie tournante de la pompe moteur diesel',
      epi: 'Intervenant garde ses standards chantier en permanence',
      epc: 'Caracterisation adaptee pour une protection totale',
      procedures: "Aucune operation ne necessite de mettre les doigts dans la partie tournante de la pompe. Etre vigilant quand au port d'objets autour du cou (badge,...) pouvant se prendre dans la partie tournante.",
      formations: 'Sensibilisation des operateurs'
    },
    {
      tache: "Ajout d'eau demineralisee dans les batteries",
      risque_present: "Projection d'acide pouvant entrainer des brulures. Effet aggravant : pas de possibilite de rincage a proximite.",
      epi: 'Coin EPI dedie dans le local pour les visieres et les gants. Port de la visiere de protection (« coin EPI »), des gants de protection chimique (neoprene conseille) et des standards chantiers.',
      epc: 'Station de rincage en cas de brulure',
      procedures: "Travail a deux obligatoire pour l'ajout d'eau demineralisee",
      formations: 'Sensibilisation des operateurs au risque de projection de fluide dangereux.'
    },
    {
      tache: 'Mise en marche du moteur diesel de la pompe',
      risque_present: "Bruit genere par la pompe diesel en fonctionnement : atteinte de l'ouie, peut entrainer une fatigue auditive, voire une lesion de l'oreille interne.",
      epi: "Mise a disposition de casques 3M Moldex M5. Utiliser les bouchons d'oreille a disposition a l'entree du local.",
      procedures: "Prendre le casque de protection auditive avec soi et/ou se servir des bouchons d'oreille avant d'intervenir dans le local",
      formations: "Sensibilisation des operateurs. Preciser avec eux la maniere de positionner les bouchons d'oreille."
    },
    {
      tache: 'Mise en marche du moteur diesel de la pompe',
      risque_present: "Ajout d'eau demineralisee dans les batteries : projection d'acide pouvant entrainer des brulures. Effet aggravant : pas de possibilite de rincage a proximite",
      epi: 'Port de la visiere de protection (« coin EPI »), des gants de protection chimique (neoprene conseille) et des standards chantiers',
      epc: 'Station de rincage en cas de brulure',
      procedures: 'Coin EPI dedie dans le local pour les visieres et les gants',
      formations: 'Sensibilisation des operateurs'
    },
    {
      tache: 'Deplacement dans le local',
      risque_present: "L'operateur peut se cogner la tete sur les bords coupants du caisson d'air neuf",
      epi: 'Port des standards chantiers',
      epc: "Installation d'une mousse de protection",
      procedures: 'Non necessaire',
      formations: 'Sensibilisation des operateurs'
    },
    {
      tache: 'Deplacement dans le local',
      risque_present: "L'operateur doit etre en extension et peut meme etre amene a grimper pour atteindre le point de controle. Chute et TMS possibles",
      epi: 'Port des standards chantiers',
      epc: "Installation d'une plateforme d'acces",
      procedures: 'Utiliser la plateforme pour checker le niveau de remplissage et effectuer le remplissage si necessaire',
      formations: 'Sensibilisation des operateurs'
    },
    {
      tache: 'Deplacement dans le local',
      risque_present: "Deplacements genes par la presence de tuyaux d'apport du fuel situes au niveau du sol : risque de chute de plain-pied",
      epi: 'Port des chaussures de securite',
      epc: "Protection type carterisation des tuyaux au sol, ajout de ruban pour une meilleure visibilite et ajout de plateformes pour l'accessibilite en securite",
      procedures: 'Non necessaire',
      formations: 'Sensibilisation des operateurs au port des standards chantiers'
    },
    {
      tache: 'Deplacement dans le local',
      risque_present: "Risque de brulure au contact du tuyau d'echappement des fumees (au niveau de la tete surtout). Effet aggravant : pas de possibilite de rincage a proximite",
      epi: 'Port de la casquette de securite',
      epc: "Installation d'une protection type carterisation autour du tuyau",
      procedures: 'Non necessaire',
      formations: 'Intervenants sensibilises au port des standards chantiers'
    }
  ],
  analyseActivite: [],
  analyseEnvironnement: []
};

export const modeOperatoireTraitementEau = {
  intitule_poste: "Entretien et controle du traitement d'eau",
  description_generale: "Dans les locaux de traitement d'eau, il y a un adoucisseur et un osmoseur, le premier permet d'adoucir l'eau par echange ionique et le deuxieme debarasse l'eau de la majeure partie du Chlore. Un remplissage de soude tous les deux mois est necessaire, de meme que des tests hebdomadaires de Chlore et de TH pour assurer le bon fonctionnement de l'installation. Au sein du local de traitement d'eau, deux equipements sont mis en place, adoucisseur et osmoseur, qui pour leur fonctionnement necessitent un remplissage manuel de bidons de soude (20kg) de maniere periodique. La nature de cette intervention presente des risques lies a la manutention et au produit chimique. L'ERPT realisee sur cette activite a permis de maitriser ces risques en mettant en place un nouveau systeme automatique de remplissage de soude ainsi que des tubulures de protection sur les conduites de soude.",
  taches: [
    {
      tache: 'Dans les locaux techniques',
      epi: 'Chaussures de securite et casquette de securite'
    },
    {
      tache: 'Ouverture des sacs de sel',
      risque_present: 'Coupures superficielles',
      epi: 'Vetements couvrants bras et jambes. Cuter securite et gants de protection mecanique anti-coupure (indice = 3min.)',
      epc: 'Non necessaire',
      procedures: 'Non necessaire',
      formations: "Intervenants sensibilises aux risques de coupure et sensibilises a l'utilisation de cuter securises"
    },
    {
      tache: 'Transport des sacs de sel et deversement. Transport des bidons de soude vers station deportee',
      risque_present: "TMS ou ecrasement des pieds lies au port de charges lourdes. Une amelioration a ete apportee vis-a-vis des bidons qui n'ont plus besoin d'etre depotes.",
      epi: 'Chaussure de securite',
      epc: 'Systeme de remplissage deporte de la soude evitant le depotage',
      procedures: 'Non necessaire',
      formations: 'Intervenants sensibilises aux risques lies a la manutention et aux TMS'
    },
    {
      tache: 'Changement du bidon de soude ou utilisation de la pompe',
      risque_present: 'Projection lors du changement de bidon ou lors du rincage du systeme lorsque la pompe est en marche',
      epi: 'Gants de protection chimique « epais », vetements couvrant bras et jambe, tablier, visiere, et chaussures de securite.',
      epc: "Systeme de remplissage deporte de la soude evitant le depotage, double tubulure du tuyau pouvant contenir la soude. En cas de deversement accidentel ou d'exposition accidentelle : kit de deversement de produits chimiques, rinces oeil, douche de securite sur eau du reseau.",
      procedures: "Travail a deux si possible, presence de telephones fixes dans les couloirs a proximite en cas d'urgence.",
      formations: "Intervenants sensibilises aux risques lies a l'utilisation de soude."
    },
    {
      tache: 'Changement reactif test TH',
      risque_present: "Risque de projection lors du changement de bidon contenant le colorant pour le test TH, dans l'equipement Testomat",
      epi: 'Lunettes de securite (ou visiere) et gants.',
      epc: 'Rinces-oeil, douche de securite',
      procedures: "Travail a deux si possible, presence de telephones fixes dans les couloirs a proximite en cas d'urgence.",
      formations: 'Intervenants sensibilises aux risques lies au reactif test TH.'
    }
  ],
  analyseActivite: [],
  analyseEnvironnement: []
};

export const modeOperatoireCTAAvecCourroies = {
  intitule_poste: 'Maintenance preventive annuelle des CTA avec et sans courroies',
  description_generale: "La maintenance annuelle des CTA avec courroies presente differentes taches : ouverture du bypass si necessaire, arret electrique de la CTA, verification de l'absence de pieces en mouvement, ouverture du boitier electrique du moteur (VAT), verification de la tension des courroies et de l'alignement des poulies, controle de l'etat des filtres. L'environnement presente des dangers : escalier, tuyauteries du clarificateur au sol a enjamber, sol escarpe. Cette ERPT ne traite pas de la maintenance des clarificateurs reseaux et autres elements sous pression contenant des fluides dangereux. Le reseau vapeur est actuellement non calorifuge et possede une temperature tres elevee (mesuree a 98°C).",
  taches: [
    {
      tache: "Arrivee sur le lieu et durant toute l'intervention",
      risque_present: "Chute pouvant entrainer un AAA de quelques jours liee a : escaliers, sol avec asperites, possibilite de presence d'eau au sol, presence au sol de flexibles ou autres tuyaux (clarificateur magnetique,...)",
      epi: 'Chaussures de securite, casquette de securite et vetements couvrants bras et jambes',
      epc: 'Non necessaire',
      procedures: 'Intervention a deux, tenir la rampe dans les escaliers, regarder devant soi en marchant, rester vigilant aux marches et sols glissants. Ranger le materiel hors des zones de passage et a la fin de chaque intervention.',
      formations: 'Intervenants et collaborateurs sensibilises aux risques de chute de plain pied'
    },
    {
      tache: "Durant toute l'intervention",
      risque_present: 'Projection liee aux batteries froides/chaudes et clarificateurs de reseaux : pression de service 8-10 bars',
      epi: 'Chaussures de securite, casquettes, et vetements couvrants bras et jambes.',
      epc: "Bouchons-obturateurs a l'extremite des reseaux ouverts (fermes uniquement par vanne)",
      procedures: "Verifier la presence des bouchons obturateurs, retrait si possible des poignees de vannes quart de tour, reperer les equipements de rincage d'urgence a proximite (douche portative, evier, douche de securite, rinces-oeil,...)",
      formations: 'Intervenants sensibilises aux risques lies aux projections de fluides dangereux'
    },
    {
      tache: "Durant toute l'intervention (si travail isole)",
      risque_present: "Risques lies au travail isole si un intervenant se retrouve seul dans la zone technique au cours de l'intervention. Facteur aggravant : travailleur isole dans la CTA",
      epi: 'PTI (protection du travailleur isole)',
      epc: 'Non necessaire',
      procedures: "Intervention a deux dans la mesure du possible, test PTI sur la zone d'intervention",
      formations: "Intervenants formes a l'utilisation du PTI et sensibilises aux risques lies au travail isole."
    },
    {
      tache: 'En B8 uniquement : ouverture du by-pass des 2 CTA',
      risque_present: 'Brulures superficielles sur les mains et avant-bras liees au reseau vapeur alimentant la CTA (T=98°C)',
      epi: 'Gants, et vetements couvrant bras et jambes.',
      epc: 'Calorifugeage des tuyaux (plan d\'action en cours)',
      procedures: "Reperer les equipements de rincage d'urgence a proximite (douche portative, evier, douche de securite...)",
      formations: 'Intervenants sensibilises aux risques de brulure'
    },
    {
      tache: "Consignation electrique complete de la CTA au niveau de l'armoire electrique (cadenas et fiche de consignation)",
      risque_present: 'Electrisation, electrocution',
      epi: "Gant protection 00 pour l'ouverture de l'armoire et jusqu'a V.A.T",
      epc: 'Armoire IP2X',
      procedures: "Affichage reglementaire sur l'armoire",
      formations: 'Habilitation electrique B1/B2 et/ou BC, intervenants sensibilises aux risques electriques.'
    },
    {
      tache: "Pour les CTA avec courroie : ouverture du compartiment moteur et retrait de la grille de protection par devissage a l'aide d'un outil",
      risque_present: 'Coupures au niveau des bras, jambes, mains liees a la manipulation des grilles de protection du module moteur (bords saillants)',
      epi: 'Casquettes, vetements couvrant bras et jambes, gants de protection mecanique',
      epc: 'Non necessaire',
      procedures: "Deposer de maniere stable la grille hors d'une zone de passage",
      formations: 'Intervenants sensibilises aux risques de coupures'
    },
    {
      tache: 'Pour les CTA avec et sans courroie : intervention dans le compartiment moteur-ventilateur avec volute et avec/sans courroie (pieces mecaniques en mouvement)',
      risque_present: 'Blessures aux mains, aux membres superieurs et inferieurs, liees aux pieces en mouvement (roue de ventilateur = volute, courroie, roue de recuperation)',
      epi: 'Gants de protection mecanique',
      epc: "Conception de la CTA : flux d'air stoppes par la fermeture automatique des volets lors de l'arret d'une CTA",
      procedures: "Attendre l'arret complet de la courroie et de la volute. Consignation mecanique en bloquant la courroie (plan d'actions en cours)",
      formations: 'Intervenants sensibilises aux risques lies aux pieces mecaniques en mouvement'
    },
    {
      tache: 'Intervention sur le boitier electrique du moteur et resserrage des borniers le cas echeant (courant residuel possible du aux variateurs)',
      risque_present: "Electrisation, electrocution liee a l'alimentation 380V du moteur des CTA",
      epi: "Tournevis d'electricien, gant protection 00 jusqu'a V.A.T",
      epc: 'Non necessaire',
      procedures: "Consignation obligatoire du moteur au niveau de l'armoire et VAT sur l'equipement (travaux de nature electrique). Consignation : etre obligatoirement a deux pour sa realisation. S'assurer de l'absence de courant residuel avant intervention, mise a la terre le cas echeant.",
      formations: 'Habilitation electrique B1,B2 et/ou BC. Intervenants sensibilises aux risques electriques.'
    },
    {
      tache: 'Intervention sur le boitier electrique du moteur et resserrage des borniers le cas echeant (protection thermique du moteur egalement alimentee en electricite)',
      risque_present: "Electrisation, electrocution liee a l'alimentation electrique de la protection thermique du moteur (ipsotherme). Le variateur peut creer une energie residuelle. La protection moteur est autonome.",
      epi: "Tournevis d'electricien, gant protection 00 jusqu'a V.A.T",
      epc: 'Non necessaire',
      procedures: "Consignation obligatoire de la protection thermique du moteur (deux cadenas au total car vient en plus de la consignation du moteur) au niveau de l'armoire et VAT sur l'equipement. Consignation : etre obligatoirement a deux pour sa realisation. S'assurer de l'absence de courant residuel avant intervention ; mise a la terre le cas echeant.",
      formations: 'Habilitation electrique B1,B2 et/ou BC. Intervenants sensibilises aux risques electriques.'
    },
    {
      tache: 'Verification visuelle et changement des filtres le cas echeant',
      risque_present: 'Blessures aux mains, aux membres superieurs et inferieurs, liees a la manipulation des filtres.',
      epi: 'Gants de protection mecanique et vetements couvrant bras et jambes',
      epc: 'Non necessaire',
      procedures: 'Non necessaire',
      formations: 'Intervenants sensibilises aux risques de coupures'
    },
    {
      tache: 'Nettoyage a l\'eau claire des compartiments et batteries',
      risque_present: "Chute pouvant entrainer un AAA de quelques jours",
      epi: 'Port des chaussures de securite, casquettes et vetements couvrants',
      epc: 'Non necessaire',
      procedures: 'Intervention a deux dans la mesure du possible',
      formations: 'Intervenants et collaborateurs sensibilises aux risques de chute de plain pied.'
    },
    {
      tache: "Nettoyage a l'aide d'une mousse degraissante - FLAMOUSS D",
      risque_present: 'Pas de risque chimique specifique pour l\'utilisateur. Mesure << VLE (VLCT). Facteur aggravant : espace restreint',
      epi: 'Lunettes de securite, gants de protection chimique jetables',
      epc: 'Non necessaire',
      procedures: "Mesures PID (FLAMOUSS D - 24 ppm, WD40 - 6 ppm), ne rien stocker devant l'acces a l'exterieur des CTA",
      formations: 'Intervenants sensibilises aux risques chimiques'
    }
  ],
  analyseActivite: [],
  analyseEnvironnement: []
};

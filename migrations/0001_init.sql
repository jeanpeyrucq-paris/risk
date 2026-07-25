-- risk-control-app initial schema: INRS reference data, module A (Plan de prevention), module B (DUER)

CREATE TABLE inrs_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  ordre INTEGER NOT NULL
);

INSERT INTO inrs_categories (code, libelle, ordre) VALUES
 ('01','Chute de plain-pied',1),
 ('02','Chute de hauteur',2),
 ('03','Circulations internes (vehicules/engins)',3),
 ('04','Risques routiers en mission',4),
 ('05','Charge physique de travail',5),
 ('06','Manutention mecanique',6),
 ('07','Produits chimiques / emissions / dechets',7),
 ('08','Agents biologiques',8),
 ('09','Equipements de travail',9),
 ('10','Effondrements et chutes d''objets',10),
 ('11','Bruit',11),
 ('12','Ambiances thermiques',12),
 ('13','Incendie / explosion',13),
 ('14','Electricite',14),
 ('15','Ambiances lumineuses',15),
 ('16','Rayonnements',16),
 ('17','Risques psychosociaux',17),
 ('18','Vibrations',18),
 ('19','Heurt / cognement',19),
 ('20','Pratiques addictives',20);

-- Module A: Plan de prevention (site-based)

CREATE TABLE sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  adresse TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE plan_prevention_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  titre TEXT,
  numero TEXT,
  reglementation TEXT,
  source_pdf TEXT,
  date_extraction TEXT,
  conditions_intervention_json TEXT,
  raw_import_json TEXT,
  imported_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_pp_documents_site ON plan_prevention_documents(site_id);

CREATE TABLE plan_prevention_rubriques (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES plan_prevention_documents(id) ON DELETE CASCADE,
  ordre INTEGER NOT NULL,
  titre TEXT NOT NULL,
  concerne INTEGER NOT NULL DEFAULT 1,
  page_source TEXT,
  type TEXT,
  gestion_dechets_json TEXT
);
CREATE INDEX idx_pp_rubriques_document ON plan_prevention_rubriques(document_id);

CREATE TABLE plan_prevention_lignes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rubrique_id INTEGER NOT NULL REFERENCES plan_prevention_rubriques(id) ON DELETE CASCADE,
  ordre INTEGER NOT NULL,
  dangers_json TEXT NOT NULL DEFAULT '[]',
  concerne INTEGER NOT NULL DEFAULT 1,
  risques_json TEXT NOT NULL DEFAULT '[]',
  entreprises_concernees TEXT,
  moyens_prevention_json TEXT NOT NULL DEFAULT '[]',
  inrs_category_id INTEGER REFERENCES inrs_categories(id)
);
CREATE INDEX idx_pp_lignes_rubrique ON plan_prevention_lignes(rubrique_id);

CREATE TABLE pp_activites_non_couvertes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES plan_prevention_documents(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_pp_non_couvertes_document ON pp_activites_non_couvertes(document_id);

-- Module B: DUER (entreprise-based)

CREATE TABLE entreprises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE duer_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entreprise_id INTEGER NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  titre TEXT,
  entite TEXT,
  adresse TEXT,
  perimetre TEXT,
  date_mise_a_jour TEXT,
  redacteurs TEXT,
  source_fichier TEXT,
  raw_import_json TEXT,
  imported_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_duer_documents_entreprise ON duer_documents(entreprise_id);

CREATE TABLE duer_taches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES duer_documents(id) ON DELETE CASCADE,
  ordre INTEGER NOT NULL,
  ligne_source INTEGER,
  principales_operations TEXT,
  facteur_exposition TEXT,
  risques_json TEXT NOT NULL DEFAULT '[]',
  risques_inrs TEXT,
  equipement TEXT,
  fonctionnement TEXT,
  mesures_conception TEXT,
  regles_qui_sauvent_json TEXT NOT NULL DEFAULT '[]',
  epc_epi_json TEXT NOT NULL DEFAULT '[]',
  formation_specifique_json TEXT NOT NULL DEFAULT '[]',
  mesures_organisationnelles_json TEXT NOT NULL DEFAULT '[]',
  further_actions_json TEXT NOT NULL DEFAULT '[]',
  comment_json TEXT NOT NULL DEFAULT '[]',
  inrs_category_id INTEGER REFERENCES inrs_categories(id)
);
CREATE INDEX idx_duer_taches_document ON duer_taches(document_id);

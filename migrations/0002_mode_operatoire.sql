-- Module D: Mode operatoire securite + analyse ERPT (site-based, reuses `sites`)

CREATE TABLE familles_risques (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  libelle TEXT NOT NULL UNIQUE,
  ordre INTEGER NOT NULL
);

INSERT INTO familles_risques (libelle, ordre) VALUES
 ('ELECTRIQUE', 1),
 ('MECANIQUE', 2),
 ('CHUTE DE HAUTEUR', 3),
 ('MANUTENTION / ERGONOMIE', 4),
 ('INCENDIE / EXPLOSION', 5),
 ('BRUIT / VIBRATIONS', 6),
 ('RAYONNEMENTS IONISANTS / NON IONISANTS', 7),
 ('BIOLOGIQUE', 8),
 ('HYGIENE', 9),
 ('CHIMIQUE', 10),
 ("CHUTE D'OBJETS", 11),
 ('ANOXIE', 12),
 ('CHUTE DE PLAIN PIED', 13),
 ('FLUIDES / SURPRESSION', 14),
 ('TRAVAIL ISOLE', 15),
 ('AMBIANCE THERMIQUE / SURFACES CHAUDES OU FROIDES', 16);

CREATE TABLE modes_operatoires (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  intitule_poste TEXT NOT NULL,
  sous_activite_code TEXT,
  sous_activite_libelle TEXT,
  personnes_concernees TEXT,
  description_generale TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mo_site ON modes_operatoires(site_id);

CREATE TABLE mo_taches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mode_operatoire_id INTEGER NOT NULL REFERENCES modes_operatoires(id) ON DELETE CASCADE,
  ordre INTEGER NOT NULL,
  tache TEXT,
  risque_present TEXT,
  epi TEXT,
  epc TEXT,
  procedures TEXT,
  formations TEXT
);
CREATE INDEX idx_mo_taches_mo ON mo_taches(mode_operatoire_id);

CREATE TABLE mo_analyse_lignes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mode_operatoire_id INTEGER NOT NULL REFERENCES modes_operatoires(id) ON DELETE CASCADE,
  contexte TEXT NOT NULL CHECK (contexte IN ('activite','environnement')),
  ordre INTEGER NOT NULL,
  danger TEXT,
  famille_risque_id INTEGER REFERENCES familles_risques(id),
  risques_associes TEXT,
  corps_tete INTEGER NOT NULL DEFAULT 0,
  corps_membres INTEGER NOT NULL DEFAULT 0,
  corps_divers INTEGER NOT NULL DEFAULT 0,
  corps_voies_penetration INTEGER NOT NULL DEFAULT 0,
  corps_autres TEXT,
  f INTEGER,
  p INTEGER,
  g INTEGER,
  epi TEXT,
  cotation_epi REAL,
  epc TEXT,
  cotation_epc REAL,
  mesures_organisationnelles TEXT,
  cotation_mo REAL,
  mesures_humaines TEXT,
  cotation_mh REAL
);
CREATE INDEX idx_mo_analyse_mo ON mo_analyse_lignes(mode_operatoire_id);

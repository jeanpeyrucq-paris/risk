-- Module C: Analyse des risques (compare a site's plan de prevention against an entreprise's DUER)

CREATE TABLE analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  entreprise_id INTEGER NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (site_id, entreprise_id)
);
CREATE INDEX idx_analyses_site ON analyses(site_id);
CREATE INDEX idx_analyses_entreprise ON analyses(entreprise_id);

CREATE TABLE analyse_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analyse_id INTEGER NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  inrs_category_id INTEGER NOT NULL REFERENCES inrs_categories(id),
  procedure_source TEXT CHECK (procedure_source IN ('cbre','client')),
  analyse_hse TEXT,
  statut_procedure_client TEXT CHECK (statut_procedure_client IN ('acceptee','refusee','en_attente')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (analyse_id, inrs_category_id)
);
CREATE INDEX idx_analyse_items_analyse ON analyse_items(analyse_id);

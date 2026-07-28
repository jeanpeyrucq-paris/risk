-- Link each analysed danger to the specific tache it was found on (nullable :
-- unlinked = general/environmental risk not tied to one task, or legacy data
-- predating this link). Per the method (informations.html
-- #methode-mode-operatoire): "le mode operatoire securite reprend les
-- taches, les risques presents et les moyens de maitrise" - the tache's
-- fields are meant to be derived from the linked analyse lignes rather than
-- entered a second time. Existing mo_taches rows and their manually-entered
-- risque_present/epi/epc/procedures/formations are left untouched and stay
-- in use as a fallback whenever no analyse ligne is linked to them (this is
-- the case for every currently seeded "Site TEST" example).

ALTER TABLE mo_analyse_lignes ADD COLUMN mo_tache_id INTEGER REFERENCES mo_taches(id);

-- Adopt the richer 12-family / ~29 sub-family risk taxonomy from
-- referentiel-mesures-maitrise-risques.md for the analyse ERPT module
-- (module D). Existing rows are updated IN PLACE (same id) so that
-- mo_analyse_lignes.famille_risque_id references stay valid across the
-- change ; only genuinely new sub-families (no old equivalent) are inserted.
-- The xlsx export/templates are unaffected : they only ever read the
-- `libelle` text at export time, with no fixed row/family correspondence.

ALTER TABLE familles_risques ADD COLUMN groupe TEXT;

UPDATE familles_risques SET libelle = '1.1 Chute de plain-pied', ordre = 1,
  groupe = 'Famille 1 - Risques de heurts / chocs / ecrasement / coupure'
  WHERE libelle = 'CHUTE DE PLAIN PIED';
UPDATE familles_risques SET libelle = '1.2 Manutention-ergonomie', ordre = 2,
  groupe = 'Famille 1 - Risques de heurts / chocs / ecrasement / coupure'
  WHERE libelle = 'MANUTENTION / ERGONOMIE';
UPDATE familles_risques SET libelle = '1.3 Chute d''objet', ordre = 3,
  groupe = 'Famille 1 - Risques de heurts / chocs / ecrasement / coupure'
  WHERE libelle = 'CHUTE D''OBJETS';
UPDATE familles_risques SET libelle = '2. Chute de hauteur', ordre = 4,
  groupe = 'Famille 2 - Hauteur'
  WHERE libelle = 'CHUTE DE HAUTEUR';
UPDATE familles_risques SET libelle = '3. Bruit-vibration', ordre = 5,
  groupe = 'Famille 3 - Bruit'
  WHERE libelle = 'BRUIT / VIBRATIONS';
UPDATE familles_risques SET libelle = '4.1 Mecanique', ordre = 6,
  groupe = 'Famille 4 - Risques mecaniques, thermiques, fluides, gaz'
  WHERE libelle = 'MECANIQUE';
UPDATE familles_risques SET libelle = '4.2 Ambiance thermique - surfaces chaudes ou froides', ordre = 7,
  groupe = 'Famille 4 - Risques mecaniques, thermiques, fluides, gaz'
  WHERE libelle = 'AMBIANCE THERMIQUE / SURFACES CHAUDES OU FROIDES';
UPDATE familles_risques SET libelle = '4.3 Fluides-surpression', ordre = 8,
  groupe = 'Famille 4 - Risques mecaniques, thermiques, fluides, gaz'
  WHERE libelle = 'FLUIDES / SURPRESSION';
UPDATE familles_risques SET libelle = '5. Electricite', ordre = 10,
  groupe = 'Famille 5 - Electricite'
  WHERE libelle = 'ELECTRIQUE';
-- Famille 6 is split into 3 sub-items (point chaud / incendie / explosion).
-- The old row maps to 6.2 Incendie (same id, preserves FK references) since
-- the existing analyse data it's used on describes general fire risk, not
-- hot-work-specific or explosion-specific scenarios.
UPDATE familles_risques SET libelle = '6.2 Incendie', ordre = 12,
  groupe = 'Famille 6 - Incendie - explosion'
  WHERE libelle = 'INCENDIE / EXPLOSION';
UPDATE familles_risques SET libelle = '7.1 Hygiene', ordre = 14,
  groupe = 'Famille 7 - Hygiene, chimique, biologique, anoxie'
  WHERE libelle = 'HYGIENE';
UPDATE familles_risques SET libelle = '7.2 Chimique', ordre = 15,
  groupe = 'Famille 7 - Hygiene, chimique, biologique, anoxie'
  WHERE libelle = 'CHIMIQUE';
UPDATE familles_risques SET libelle = '7.3 Biologique', ordre = 16,
  groupe = 'Famille 7 - Hygiene, chimique, biologique, anoxie'
  WHERE libelle = 'BIOLOGIQUE';
UPDATE familles_risques SET libelle = '7.4 Anoxie', ordre = 17,
  groupe = 'Famille 7 - Hygiene, chimique, biologique, anoxie'
  WHERE libelle = 'ANOXIE';
UPDATE familles_risques SET libelle = '8.1 Travail isole', ordre = 18,
  groupe = 'Famille 8 - Organisation du travail'
  WHERE libelle = 'TRAVAIL ISOLE';
UPDATE familles_risques SET libelle = '9.5 Rayonnements ionisants - non ionisants', ordre = 24,
  groupe = 'Famille 9 - Travail en zones dangereuses'
  WHERE libelle = 'RAYONNEMENTS IONISANTS / NON IONISANTS';

INSERT INTO familles_risques (libelle, ordre, groupe) VALUES
 ('4.4 Gaz', 9, 'Famille 4 - Risques mecaniques, thermiques, fluides, gaz'),
 ('6.1 Travail par point chaud (soudage, meulage...)', 11, 'Famille 6 - Incendie - explosion'),
 ('6.3 Explosion', 13, 'Famille 6 - Incendie - explosion'),
 ('8.2 Travail de nuit / horaires decales', 19, 'Famille 8 - Organisation du travail'),
 ('9.1 Espaces confines', 20, 'Famille 9 - Travail en zones dangereuses'),
 ('9.2 Locaux ATEX', 21, 'Famille 9 - Travail en zones dangereuses'),
 ('9.3 Laboratoires de biologie', 22, 'Famille 9 - Travail en zones dangereuses'),
 ('9.4 Laboratoires de chimie', 23, 'Famille 9 - Travail en zones dangereuses'),
 ('9.6 Autres locaux (cryoconservateurs, animalerie)', 25, 'Famille 9 - Travail en zones dangereuses'),
 ('10.1 Chaufferie vapeur', 26, 'Famille 10 - Equipements sous pression'),
 ('10.2 Groupes froids', 27, 'Famille 10 - Equipements sous pression'),
 ('10.3 Air comprime', 28, 'Famille 10 - Equipements sous pression'),
 ('10.4 Autres equipements sous pression', 29, 'Famille 10 - Equipements sous pression'),
 ('11. Levage-manutention mecanique', 30, 'Famille 11 - Levage - manutention mecanique'),
 ('12. Amiante', 31, 'Famille 12 - Amiante');

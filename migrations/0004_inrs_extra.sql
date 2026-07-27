-- Precise the label of category 12 and add two categories requested for the
-- Plan de prevention classification (21, 22).

UPDATE inrs_categories SET libelle = 'Ambiances thermiques - surfaces chaudes ou froides' WHERE code = '12';

INSERT INTO inrs_categories (code, libelle, ordre) VALUES
 ('21','Travail avec/sur des equipements sous pression',21),
 ('22','Travail en zones dangereuses',22);

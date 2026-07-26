# risk-control-app

Outil interne CBRE HSE pour gerer le **plan de prevention** d'un site client et le **DUER**
(Document Unique d'Evaluation des Risques) de l'entreprise, classes selon les 20 categories
de risques INRS.

**Deploye sur Cloudflare Workers sous le nom `riskassist`** :
[riskassist.jean-peyrucq.workers.dev](https://riskassist.jean-peyrucq.workers.dev). Le Worker
deploye reutilise la base D1 existante `risk-control-db` (le compte etait au plafond du nombre
de bases D1 autorisees, donc pas de base separee creee pour la prod) ; le dossier local, le
`package.json` et le depot GitHub (`jeanpeyrucq-paris/risk`) gardent le nom `risk-control-app`.

## Perimetre de cette version

Le produit complet prevoit 5 rubriques : (A) Plan de prevention du site, (B) DUER de
l'entreprise, (C) Analyse des risques (comparaison A/B), (D) Mode operatoire securite,
(E) Informations. **Les 5 modules sont construits.**

## Module C : analyse des risques (comparaison plan de prevention / DUER)

Compare, categorie INRS par categorie INRS, le plan de prevention d'un site et le DUER d'une
entreprise. Decisions de conception (aucun precedent a reutiliser, donc explicitees ici) :

- **Lien site↔entreprise** : table `analyses` (`site_id`, `entreprise_id`), creee par
  l'utilisateur en choisissant les deux dans des listes deroulantes existantes — le module ne
  cree ni site ni entreprise, ceux-ci doivent deja exister (modules A/B).
- **Granularite = categorie INRS**, pas ligne/tache individuelle : une carte de comparaison par
  categorie ayant au moins une ligne de plan de prevention concernee (`concerne=1`) classee
  dans cette categorie. Une categorie presente uniquement cote DUER (aucune ligne PP) n'est
  pas listee — l'ancrage est toujours le plan de prevention, comme demande.
- **Rien n'est duplique/persiste cote comparaison** : les lignes PP et taches DUER
  correspondantes sont recherchees en direct via `inrs_category_id` a chaque lecture (la
  "couverture" — couvert / non traite dans le DUER — est donc toujours a jour). Seule la
  decision de l'utilisateur (`procedure_source`, `analyse_hse`, `statut_procedure_client`)
  est stockee, uniquement si renseignee (`PATCH` en upsert, pas de pre-creation systematique).

L'export Excel est genere de zero (control-style), aucun modele client fourni pour ce module.

## Module D : mode operatoire + analyse ERPT

Chaque mode operatoire (rattache a un site, comme le plan de prevention) regroupe :
- des **taches** (tache / risque present / EPI / EPC / procedures / formations) ;
- une **analyse ERPT**, deux blocs de lignes ("liee a l'activite" / "liee a l'environnement"),
  chacune pre-listant les 16 familles de risques fixes (table `familles_risques`), avec
  cotation F·P·G, EPI/EPC/mesures organisationnelles/mesures humaines et leurs cotations.

Les formules de cotation ont ete confirmees en inspectant les formules Excel **reelles**
embarquees dans le modele client (`Grille_analyse_risques_export.xlsx`, colonnes M/R/W/Y/Z -
voir "Export mode operatoire / analyse ERPT" ci-dessous) :
`Rp = F×P×G`, `cotation MT = EPI×EPC`, `cotation FOH = MO×MH`,
`cotation globale = MOYENNE(MT, FOH)`, `niveau de maitrise` (seuils a 0,5 et 0,75),
`Rr numerique = Rp × cotation globale`.

**Correction** : une premiere version se basait sur un modele plus ancien et utilisait
`MIN(EPI, EPC)` pour la cotation MT. Les deux formules donnent le meme resultat des que l'une
des deux cotations vaut 1 (le cas "aucune mesure"), ce qui a masque l'erreur sur les exemples
verifies a l'epoque. La formule reelle du classeur (`PRODUCT(O13,Q13)`) confirme qu'il s'agit
d'un produit, pas d'un minimum ; corrige dans `mo-cotation.ts` et `mode-operatoire.js`.

**Decision produit explicite : la note finale Rr (lettre F/M/S/C) n'est calculee nulle part
dans l'application.** Elle reste une cellule vide dans l'export Excel, remplie manuellement
par l'utilisateur — aucune donnee du fichier source ne permettait de deviner les seuils
M/S/C (tous les exemples reels sont notes 'F').

"Site TEST" est seede avec deux exemples complets (mode operatoire + analyse) transcrits du
modele reel : "Maintenance Centrale de Traitement d'Air animalerie" et "Recherche panne
equipement sous tension".

## Decision de conception : classification INRS

Le DUER importe porte deja un champ `risques_inrs` (texte libre, ex. `"14. Risques lies a
l'electricite"`). Ce champ est **verifie non equivalent** a la liste canonique des 20
categories INRS demandee par l'utilisateur (numerotation et libelles differents dans le
fichier source reel). Les deux champs sont donc distincts :
- `risques_inrs` : conserve tel quel, non modifiable, historique de l'import.
- `inrs_category_id` : classification geree par l'application, choisie manuellement par
  l'utilisateur dans l'interface (select vers la table `inrs_categories`).

## Stack

Cloudflare Worker + [Hono](https://hono.dev) + D1 (SQLite), assets statiques servis
directement (pas de build front, HTML/CSS/JS vanilla). Meme convention que les projets
freres `talentops` et `propulse-rdv`. Charte graphique (`public/assets/tmf.css`) reprise de
[projets.talentops.fr](https://projets.talentops.fr).

Export Excel via [SheetJS](https://sheetjs.com) (`xlsx`, installe depuis le CDN officiel
SheetJS plutot que le registre npm — la derniere version publiee sur npm, 0.18.5, porte des
vulnerabilites connues sans correctif ; SheetJS distribue les versions patchees uniquement
via son propre CDN depuis la fin de sa publication sur npm) pour les classeurs generes de
zero (plan de prevention, DUER "tableau", analyse des risques).

**Les exports "modele"** (DUER, mode operatoire, analyse ERPT — voir ci-dessous) n'utilisent
pas SheetJS : verifie experimentalement (y compris sur un aller-retour lecture/ecriture sans
aucune modification), SheetJS Community Edition ne preserve pas la mise en forme des cellules
a l'ecriture — police, remplissage, retour a la ligne et bordures repassent systematiquement
aux valeurs par defaut. Ces exports patchent donc directement le XML des classeurs modeles
(`fflate` pour dezip/rezip ; helpers communs dans `xlsx-xml-patch.ts`) : remplacement cible du
contenu des cellules gerees uniquement, en conservant leur attribut de style d'origine — la
mise en forme des modeles est ainsi preservee a l'identique.

Le modele **analyse ERPT** (`Grille_analyse_risques_export.xlsx`) contient des **formules
Excel vivantes** pour les colonnes derivees (Rp, cotation MT, cotation FOH, niveau de
maitrise, Rr numerique) : ces cellules ne sont jamais ecrites par l'export, seules les
cellules d'entree le sont (F/P/G, cotations EPI/EPC/MO/MH...), et Excel recalcule les
formules a partir des nouvelles valeurs. Seule la colonne X (cotation globale) est une valeur
figee dans ce modele (formule referencant un classeur externe non joint) et doit donc etre
ecrite explicitement par l'application. Comme les valeurs mises en cache dans le modele
d'origine deviendraient sinon perimees (Excel ne recalcule pas automatiquement a l'ouverture
sauf indication contraire), l'export force `fullCalcOnLoad="1"` dans `workbook.xml`.

Les blocs "liee a l'activite" (16 lignes) et "liee a l'environnement" (15 lignes) du modele
ont une taille fixe qui ne correspond pas toujours au nombre reel de lignes d'analyse (les
deux exemples seedes de "Site TEST" en comptent respectivement 17 et 16) : les lignes en
surplus sont ajoutees a la suite de la derniere ligne du modele plutot que d'etre perdues,
sans mise en forme specifique (cas limite, previsible mais rare).

Le modele **mode operatoire** (`Mode_operatoire_securite_export.xlsx`) fusionne la cellule
Tache (colonne A) sur les lignes de risque consecutives qui partagent la meme tache —
l'export reconstruit ce fusionnement dynamiquement a partir des donnees (une tache vide ou
identique a la precedente prolonge le groupe).

## Demarrage

```bash
npm install
npx wrangler d1 create risk-control-db   # puis reporter le database_id dans wrangler.jsonc
npm run db:migrate:local
npm run dev                               # wrangler dev --port 8787
npm run db:seed:local                     # importe les deux fixtures reelles (voir fixtures/)
```

`npm run db:seed:local` suppose `npm run dev` deja lance sur le port 8787 (`PORT=xxxx npm run
db:seed:local` sinon). Il importe les deux fixtures via les vrais endpoints d'import (pas de
SQL brut), ce qui sert aussi de test de bout en bout : le script echoue si les comptages
n'egalent pas 13 rubriques / 42 lignes, 92 taches, et les comptages exacts des 6 exemples
"Site TEST".

Pour seeder une instance deployee plutot que le dev local :
`BASE_URL=https://riskassist.jean-peyrucq.workers.dev node scripts/seed.mjs`
(c'est ainsi que la prod a ete initialement peuplee).

## Modes d'export

- **Plan de prevention** (`GET /api/plan-prevention/documents/:id/export`) : classeur genere
  a partir de zero, reprenant la mise en page deja validee (feuilles `Document`,
  `Conditions intervention`, `Plan prevention`), plus une colonne `Categorie INRS`.
- **DUER, export tableau** (`.../export?format=control`, par defaut) : meme principe,
  feuilles `Document` + `DUER taches`.
- **DUER, export modele** (`.../export?format=template`) : reinjecte les donnees dans le
  vrai modele client (`public/templates/duer-template.xlsx`, feuille "Risk Register"),
  colonnes B/C/M/N/O/P/W/X/Y/AA/AC/AH/AI uniquement — les colonnes non gerees par
  l'application (unites de travail, frequence/probabilite/gravite, "en place ?", risque
  residuel) restent intactes, a completer manuellement.
- **Mode operatoire** (`GET /api/modes-operatoires/:id/export?type=mode-operatoire`) : reinjecte
  les donnees dans le vrai modele client (`public/templates/mode-operatoire-template.xlsx`),
  avec fusion dynamique de la cellule Tache sur les lignes de risque consecutives.
- **Analyse ERPT** (`.../export?type=analyse`) : reinjecte les donnees dans le vrai modele
  client (`public/templates/analyse-erpt-template.xlsx`) — colonnes d'entree uniquement,
  les colonnes a formule vivante (Rp, cotation MT/FOH, niveau de maitrise, Rr numerique) sont
  recalculees par Excel ; colonne AA, la note finale Rr, laissee vide — voir "Module D"
  ci-dessus.
- **Analyse des risques** (`GET /api/analyses/:id/export`) : classeur genere de zero, une ligne
  par categorie INRS (couverture, mesures des deux cotes, procedure choisie, analyse HSE,
  statut).

## Structure

```
src/worker/index.ts                  point d'entree Hono, montage des routes
src/worker/routes/*.ts               un fichier par ressource (sites, entreprises, plan-prevention,
                                      duer, inrs-categories, familles-risques, modes-operatoires, analyses)
src/worker/xlsx-export.ts            export "controle" (plan de prevention + DUER, classeurs generes)
src/worker/xlsx-xml-patch.ts          helpers communs de patch XML (fflate) pour les exports "modele"
src/worker/xlsx-template-export.ts   export DUER dans le vrai modele client
src/worker/xlsx-mode-operatoire-export.ts  export mode operatoire + analyse ERPT dans les vrais modeles
src/worker/xlsx-analyse-export.ts    export analyse des risques (module C)
src/worker/mo-cotation.ts            formules de cotation partagees (API + export)
migrations/0001_init.sql             schema D1 modules A/B + seed des 20 categories INRS
migrations/0002_mode_operatoire.sql  schema D1 module D + seed des 16 familles de risques
migrations/0003_analyse.sql          schema D1 module C
public/                              pages HTML + assets (JS vanilla, tmf.css)
fixtures/                            fixtures JSON/JS reelles utilisees pour le seed/smoke test
scripts/seed.mjs                     seed via les endpoints d'import (voir ci-dessus)
```

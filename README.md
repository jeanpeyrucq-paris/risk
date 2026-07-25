# risk-control-app

Outil interne CBRE HSE pour gerer le **plan de prevention** d'un site client et le **DUER**
(Document Unique d'Evaluation des Risques) de l'entreprise, classes selon les 20 categories
de risques INRS.

## Perimetre de cette version (V1)

Le produit complet prevoit 5 rubriques : (A) Plan de prevention du site, (B) DUER de
l'entreprise, (C) Analyse des risques (comparaison A/B), (D) Mode operatoire securite,
(E) Informations. **Seuls les modules A et B sont construits dans cette version** — C et D
sont volontairement reportes, et apparaissent grises ("a venir") sur la page d'accueil.
E (contenu de reference statique) est traite de la meme facon.

Le schema de donnees anticipe neanmoins le module C : chaque ligne de plan de prevention et
chaque tache DUER porte un `inrs_category_id` optionnel, pointant vers la meme table de
reference des 20 categories INRS — c'est le concept partage dont C aura besoin pour comparer
les risques des deux documents.

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
via son propre CDN depuis la fin de sa publication sur npm).

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
n'egalent pas 13 rubriques / 42 lignes et 92 taches.

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

## Structure

```
src/worker/index.ts              point d'entree Hono, montage des routes
src/worker/routes/*.ts           un fichier par ressource (sites, entreprises, plan-prevention, duer, inrs-categories)
src/worker/xlsx-export.ts        export "controle" (classeurs generes)
src/worker/xlsx-template-export.ts   export DUER dans le vrai modele client
migrations/0001_init.sql         schema D1 + seed des 20 categories INRS
public/                          pages HTML + assets (JS vanilla, tmf.css)
fixtures/                        les deux JSON reels utilises pour le seed/smoke test
scripts/seed.mjs                 seed via les endpoints d'import (voir ci-dessus)
```

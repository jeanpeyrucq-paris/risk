// Seeds a database with the two real fixtures, via the actual import
// endpoints (not raw SQL) so this also serves as an end-to-end smoke test of
// the import parsers. Targets local dev by default (npm run dev, port 8787;
// override with PORT=xxxx); pass BASE_URL=https://... to seed a deployed
// Worker instead.
import { readFile } from 'node:fs/promises';
import {
  modeOperatoireCTA,
  modeOperatoirePanne,
  modeOperatoirePompesAVide,
  modeOperatoireMotopompeSprinkler,
  modeOperatoireTraitementEau,
  modeOperatoireCTAAvecCourroies
} from '../fixtures/mode-operatoires-site-test.mjs';

const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8787}`;

async function postJson(path, body) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${data?.error || 'erreur inconnue'}`);
  return data;
}

async function getJson(path) {
  const res = await fetch(base + path);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${data?.error || 'erreur inconnue'}`);
  return data;
}

async function seedModeOperatoire(siteId, def, famillesByName) {
  const mo = await postJson(`/api/sites/${siteId}/modes-operatoires`, {
    intitule_poste: def.intitule_poste,
    sous_activite_code: def.sous_activite_code,
    sous_activite_libelle: def.sous_activite_libelle,
    personnes_concernees: def.personnes_concernees
  });

  for (const t of def.taches) {
    await postJson(`/api/modes-operatoires/${mo.id}/taches`, t);
  }
  for (const l of def.analyseActivite) {
    const { famille, ...rest } = l;
    await postJson(`/api/modes-operatoires/${mo.id}/analyse-lignes`, {
      ...rest, contexte: 'activite', famille_risque_id: famillesByName.get(famille)
    });
  }
  for (const l of def.analyseEnvironnement) {
    const { famille, ...rest } = l;
    await postJson(`/api/modes-operatoires/${mo.id}/analyse-lignes`, {
      ...rest, contexte: 'environnement', famille_risque_id: famillesByName.get(famille)
    });
  }

  const full = await getJson(`/api/modes-operatoires/${mo.id}`);
  console.log(
    `Mode operatoire "${def.intitule_poste}" : ${full.taches.length} taches, ` +
    `${full.analyse_lignes.activite.length} lignes activite, ${full.analyse_lignes.environnement.length} lignes environnement`
  );
  if (full.taches.length !== def.taches.length
    || full.analyse_lignes.activite.length !== def.analyseActivite.length
    || full.analyse_lignes.environnement.length !== def.analyseEnvironnement.length) {
    throw new Error(`Comptage inattendu pour "${def.intitule_poste}"`);
  }
  return mo;
}

async function main() {
  console.log(`Seed cible : ${base}`);

  const site = await postJson('/api/sites', {
    nom: 'Sanofi Vitry - A016-26 Partie 2',
    adresse: '13 quai Jules Guesde, Vitry-sur-Seine'
  });
  console.log(`Site cree (id=${site.id})`);

  const ppFixture = await readFile(new URL('../fixtures/plan-prevention-sanofi-vitry.json', import.meta.url), 'utf8');
  const ppResult = await postJson(`/api/sites/${site.id}/plan-prevention/import`, ppFixture);
  console.log(`Plan de prevention importe : ${ppResult.imported.rubriques} rubriques, ${ppResult.imported.lignes} lignes`);
  if (ppResult.imported.rubriques !== 13 || ppResult.imported.lignes !== 42) {
    throw new Error(`Comptage inattendu (attendu 13 rubriques / 42 lignes)`);
  }

  const entreprise = await postJson('/api/entreprises', { nom: 'CBRE GWS France SAS' });
  console.log(`Entreprise creee (id=${entreprise.id})`);

  const duerFixture = await readFile(new URL('../fixtures/duer-cbre-gws-france.json', import.meta.url), 'utf8');
  const duerResult = await postJson(`/api/entreprises/${entreprise.id}/duer/import`, duerFixture);
  console.log(`DUER importe : ${duerResult.imported.taches} taches`);
  if (duerResult.imported.taches !== 92) {
    throw new Error(`Comptage inattendu (attendu 92 taches)`);
  }

  const familles = await getJson('/api/familles-risques');
  const famillesByName = new Map(familles.map((f) => [f.libelle, f.id]));

  const siteTest = await postJson('/api/sites', { nom: 'Site TEST' });
  console.log(`Site TEST cree (id=${siteTest.id})`);

  await seedModeOperatoire(siteTest.id, modeOperatoireCTA, famillesByName);
  await seedModeOperatoire(siteTest.id, modeOperatoirePanne, famillesByName);
  await seedModeOperatoire(siteTest.id, modeOperatoirePompesAVide, famillesByName);
  await seedModeOperatoire(siteTest.id, modeOperatoireMotopompeSprinkler, famillesByName);
  await seedModeOperatoire(siteTest.id, modeOperatoireTraitementEau, famillesByName);
  await seedModeOperatoire(siteTest.id, modeOperatoireCTAAvecCourroies, famillesByName);

  console.log('Seed termine avec succes.');
}

main().catch((err) => {
  console.error('Echec du seed :', err.message);
  process.exit(1);
});

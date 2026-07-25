// Seeds the local dev database with the two real fixtures, via the actual
// import endpoints (not raw SQL) so this also serves as an end-to-end
// smoke test of the import parsers. Requires `wrangler dev` running locally
// (npm run dev, port 8787 by default; override with PORT=xxxx).
import { readFile } from 'node:fs/promises';

const base = `http://localhost:${process.env.PORT || 8787}`;

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

  console.log('Seed termine avec succes.');
}

main().catch((err) => {
  console.error('Echec du seed :', err.message);
  process.exit(1);
});

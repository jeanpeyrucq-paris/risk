import { api, el } from './app.js';

const siteSelect = document.getElementById('site-select');
const entrepriseSelect = document.getElementById('entreprise-select');
const openBtn = document.getElementById('open-analyse');
const openStatus = document.getElementById('open-status');
const content = document.getElementById('analyse-content');

async function init() {
  const [sites, entreprises] = await Promise.all([api('/sites'), api('/entreprises')]);
  siteSelect.innerHTML = '';
  siteSelect.appendChild(el('option', { value: '' }, '— choisir un site —'));
  for (const s of sites) siteSelect.appendChild(el('option', { value: s.id }, s.nom));

  entrepriseSelect.innerHTML = '';
  entrepriseSelect.appendChild(el('option', { value: '' }, '— choisir une entreprise —'));
  for (const e of entreprises) entrepriseSelect.appendChild(el('option', { value: e.id }, e.nom));
}

openBtn.addEventListener('click', async () => {
  const siteId = siteSelect.value;
  const entrepriseId = entrepriseSelect.value;
  if (!siteId || !entrepriseId) {
    openStatus.textContent = 'Choisir un site et une entreprise.';
    return;
  }
  openStatus.textContent = 'Chargement...';
  try {
    const analyse = await api(`/sites/${siteId}/analyses`, {
      method: 'POST',
      body: JSON.stringify({ entreprise_id: Number(entrepriseId) })
    });
    openStatus.textContent = '';
    renderAnalyse(analyse);
  } catch (err) {
    openStatus.textContent = 'Erreur : ' + err.message;
    content.innerHTML = '';
  }
});

function mesureLabel(procedureSource) {
  return { cbre: 'CBRE', client: 'Client' }[procedureSource] || '';
}

function renderAnalyse(analyse) {
  content.innerHTML = '';

  const header = el('div', { class: 'page-head-row', style: 'margin-bottom:20px;' }, [
    el('div', {}, [
      el('h3', {}, `${analyse.site_nom} × ${analyse.entreprise_nom}`),
      el('p', { class: 'hint' }, `${analyse.comparisons.length} categorie(s) de risque identifiee(s) dans le plan de prevention`)
    ]),
    el('a', { class: 'btn btn-primary btn-sm', href: `/api/analyses/${analyse.id}/export` }, 'Exporter Excel')
  ]);
  content.appendChild(header);

  if (analyse.comparisons.length === 0) {
    content.appendChild(el('p', { class: 'hint' },
      "Aucune ligne du plan de prevention n'est encore classee selon une categorie INRS. Rendez-vous dans le module Plan de prevention pour classer les lignes."));
    return;
  }

  for (const cmp of analyse.comparisons) {
    content.appendChild(renderComparisonCard(analyse.id, cmp));
  }
}

function renderComparisonCard(analyseId, cmp) {
  const card = el('div', { class: 'analyse-card' });

  const badgeClass = cmp.couverture === 'couvert' ? 'badge badge-couvert' : 'badge badge-non-traite';
  const badgeText = cmp.couverture === 'couvert' ? 'Couvert' : 'Non traite dans le DUER';

  card.appendChild(el('div', { class: 'analyse-card-head' }, [
    el('h3', {}, `${cmp.inrs_category.code} — ${cmp.inrs_category.libelle}`),
    el('span', { class: badgeClass }, badgeText)
  ]));

  const mesuresGrid = el('div', { class: 'analyse-mesures' });

  const ppCol = el('div', {}, [el('h4', {}, 'Mesures — Plan de prevention')]);
  if (cmp.mesures_plan_prevention.length === 0) {
    ppCol.appendChild(el('p', { class: 'hint' }, 'Aucune'));
  }
  for (const l of cmp.mesures_plan_prevention) {
    ppCol.appendChild(el('div', { class: 'mesure-item' }, [
      el('b', {}, l.rubrique_titre + ' — '), l.dangers.join(', '),
      el('br', {}), 'Moyens : ' + l.moyens_prevention.join('; ')
    ]));
  }
  mesuresGrid.appendChild(ppCol);

  const duerCol = el('div', {}, [el('h4', {}, 'Mesures — DUER')]);
  if (cmp.mesures_duer.length === 0) {
    duerCol.appendChild(el('p', { class: 'hint' }, 'Aucune'));
  }
  for (const t of cmp.mesures_duer) {
    duerCol.appendChild(el('div', { class: 'mesure-item' }, [
      el('b', {}, (t.principales_operations || '') + ' — '), (t.facteur_exposition || ''),
      el('br', {}), 'Mesures organisationnelles : ' + t.mesures_organisationnelles.join('; ')
    ]));
  }
  mesuresGrid.appendChild(duerCol);

  card.appendChild(mesuresGrid);

  const procedureSelect = el('select', {}, [
    el('option', { value: '' }, '—'),
    el('option', { value: 'cbre' }, 'CBRE'),
    el('option', { value: 'client' }, 'Client')
  ]);
  procedureSelect.value = cmp.procedure_source || '';

  const decisionWrap = el('div', { class: 'form-grid', style: 'margin-top:14px;' }, [
    el('div', { class: 'field' }, [el('label', {}, 'Procedure a appliquer'), procedureSelect])
  ]);
  card.appendChild(decisionWrap);

  const clientFields = el('div', { class: 'form-grid', style: 'margin-top:14px;' });
  const analyseHse = el('textarea', {}, cmp.analyse_hse || '');
  const statutSelect = el('select', {}, [
    el('option', { value: '' }, '—'),
    el('option', { value: 'acceptee' }, 'Acceptee'),
    el('option', { value: 'refusee' }, 'Refusee'),
    el('option', { value: 'en_attente' }, 'En attente')
  ]);
  statutSelect.value = cmp.statut_procedure_client || '';
  clientFields.appendChild(el('div', { class: 'field span-2' }, [el('label', {}, 'Analyse HSE'), analyseHse]));
  clientFields.appendChild(el('div', { class: 'field' }, [el('label', {}, 'Statut procedure client'), statutSelect]));

  function updateClientFieldsVisibility() {
    clientFields.hidden = procedureSelect.value !== 'client';
  }
  updateClientFieldsVisibility();
  procedureSelect.addEventListener('change', updateClientFieldsVisibility);

  card.appendChild(clientFields);

  const status = el('span', { class: 'hint' }, '');
  const saveBtn = el('button', { class: 'btn btn-primary btn-sm', type: 'button', style: 'margin-top:14px;' }, 'Enregistrer');
  saveBtn.addEventListener('click', async () => {
    status.textContent = '...';
    try {
      await api(`/analyses/${analyseId}/items/${cmp.inrs_category.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          procedure_source: procedureSelect.value || null,
          analyse_hse: procedureSelect.value === 'client' ? analyseHse.value : null,
          statut_procedure_client: procedureSelect.value === 'client' ? (statutSelect.value || null) : null
        })
      });
      status.textContent = 'Enregistre';
      setTimeout(() => { status.textContent = ''; }, 1500);
    } catch {
      status.textContent = 'Erreur';
    }
  });
  card.appendChild(el('div', {}, [saveBtn, status]));

  return card;
}

init();

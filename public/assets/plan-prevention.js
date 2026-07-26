import { api, linesToArray, arrayToLines, el, renderConditionsIntervention } from './app.js';

let inrsCategories = [];
let currentSiteId = null;

const siteSelect = document.getElementById('site-select');
const newSiteToggle = document.getElementById('new-site-toggle');
const newSiteForm = document.getElementById('new-site-form');
const siteContent = document.getElementById('site-content');

async function init() {
  inrsCategories = await api('/inrs-categories');
  await refreshSites();
}

async function refreshSites(selectId = null) {
  const sites = await api('/sites');
  siteSelect.innerHTML = '';
  siteSelect.appendChild(el('option', { value: '' }, '— choisir un site —'));
  for (const s of sites) {
    siteSelect.appendChild(el('option', { value: s.id }, s.nom));
  }
  if (selectId) {
    siteSelect.value = String(selectId);
    await loadSiteContent(selectId);
  }
}

newSiteToggle.addEventListener('click', () => {
  newSiteForm.hidden = !newSiteForm.hidden;
});

newSiteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nom = document.getElementById('site-nom').value.trim();
  const adresse = document.getElementById('site-adresse').value.trim();
  if (!nom) return;
  const site = await api('/sites', { method: 'POST', body: JSON.stringify({ nom, adresse }) });
  newSiteForm.reset();
  newSiteForm.hidden = true;
  await refreshSites(site.id);
});

siteSelect.addEventListener('change', async () => {
  const id = siteSelect.value;
  currentSiteId = id || null;
  siteContent.innerHTML = '';
  if (id) await loadSiteContent(id);
});

async function loadSiteContent(siteId) {
  currentSiteId = siteId;
  siteContent.innerHTML = '';
  let doc = null;
  try {
    doc = await api(`/sites/${siteId}/plan-prevention`);
  } catch {
    doc = null;
  }

  if (!doc) {
    siteContent.appendChild(renderImportPanel(siteId));
    return;
  }
  siteContent.appendChild(renderDocument(doc));
}

function renderImportPanel(siteId) {
  const fileInput = el('input', { type: 'file', accept: 'application/json' });
  const status = el('p', { class: 'hint' }, '');

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    status.textContent = 'Import en cours...';
    try {
      const text = await file.text();
      await fetch(`/api/sites/${siteId}/plan-prevention/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text
      }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Erreur ${res.status}`);
        }
      });
      await loadSiteContent(siteId);
    } catch (err) {
      status.textContent = 'Erreur : ' + err.message;
    }
  });

  return el('div', { class: 'form-card' }, [
    el('h3', {}, "Importer le plan de prevention (JSON)"),
    el('p', { class: 'hint', style: 'margin:8px 0 16px;' }, "Aucun plan de prevention n'est encore importe pour ce site."),
    fileInput,
    status
  ]);
}

function inrsSelect(selectedId) {
  const select = el('select', { class: 'inrs-select' });
  select.appendChild(el('option', { value: '' }, '—'));
  for (const cat of inrsCategories) {
    const opt = el('option', { value: cat.id }, `${cat.code} — ${cat.libelle}`);
    if (selectedId && Number(selectedId) === cat.id) opt.selected = true;
    select.appendChild(opt);
  }
  return select;
}

function renderDocument(doc) {
  const wrap = el('div', {});

  const header = el('div', { class: 'page-head-row', style: 'margin-bottom:20px;' }, [
    el('div', {}, [
      el('h3', {}, doc.titre || 'Plan de prevention'),
      el('p', { class: 'hint' }, doc.numero || '')
    ]),
    el('a', { class: 'btn btn-primary btn-sm', href: `/api/plan-prevention/documents/${doc.id}/export` }, 'Exporter Excel')
  ]);
  wrap.appendChild(header);

  const conditionsDetails = el('details', { class: 'rubrique', id: 'conditions-intervention' });
  conditionsDetails.appendChild(el('summary', {}, "Conditions d'intervention"));
  conditionsDetails.appendChild(el('div', { class: 'rubrique-body' }, renderConditionsIntervention(doc.conditions_intervention)));
  wrap.appendChild(conditionsDetails);

  for (const rub of doc.rubriques) {
    wrap.appendChild(rub.type === 'gestion_dechets' ? renderGestionDechets(rub) : renderRubrique(rub));
  }

  return wrap;
}

function renderGestionDechets(rub) {
  const gd = rub.gestion_dechets || {};
  const details = el('details', { class: 'rubrique' });
  details.appendChild(el('summary', {}, rub.titre));
  const body = el('div', { class: 'rubrique-body' }, [
    el('p', {}, `Entreprises concernees : ${gd.entreprises_concernees || '—'} · Horaires dechetterie : ${gd.horaires_dechetterie || '—'}`),
    el('ul', { class: 'check-list' }, (gd.regles || []).map((r) => el('li', {}, r))),
    el('p', {}, `Localisation : ${gd.localisation_dechetterie || '—'}`)
  ]);
  details.appendChild(body);
  return details;
}

function renderRubrique(rub) {
  const details = el('details', { class: 'rubrique', open: rub.ordre === 0 ? '' : null });
  details.appendChild(el('summary', {}, `${rub.titre} ${rub.concerne ? '' : '(non concerne)'}`));

  const table = el('table', { class: 'admin-table' });
  table.appendChild(el('thead', {}, el('tr', {}, [
    el('th', {}, 'Dangers'), el('th', {}, 'Risques'), el('th', {}, 'Entreprises'),
    el('th', {}, 'Moyens de prevention'), el('th', {}, 'Categorie INRS'), el('th', {}, '')
  ])));
  const tbody = el('tbody', {});
  for (const ligne of rub.lignes) {
    tbody.appendChild(renderLigneRow(ligne));
  }
  table.appendChild(tbody);

  const addBtn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button', style: 'margin-top:14px;' }, '+ Ajouter une ligne');
  addBtn.addEventListener('click', async () => {
    const ligne = await api(`/plan-prevention/rubriques/${rub.id}/lignes`, { method: 'POST', body: JSON.stringify({}) });
    tbody.appendChild(renderLigneRow(ligne));
  });

  const body = el('div', { class: 'rubrique-body' }, [table, addBtn]);
  details.appendChild(body);
  return details;
}

function renderLigneRow(ligne) {
  const dangers = el('textarea', {}, arrayToLines(ligne.dangers));
  const risques = el('textarea', {}, arrayToLines(ligne.risques));
  const entreprises = el('input', { value: ligne.entreprises_concernees || '' });
  const moyens = el('textarea', {}, arrayToLines(ligne.moyens_prevention));
  const inrs = inrsSelect(ligne.inrs_category_id);
  const status = el('span', { class: 'hint' }, '');

  const saveBtn = el('button', { class: 'btn btn-primary btn-sm', type: 'button' }, 'Enregistrer');
  const delBtn = el('button', { class: 'btn btn-danger btn-sm', type: 'button' }, 'Supprimer');

  const tr = el('tr', {}, [
    el('td', {}, dangers),
    el('td', {}, risques),
    el('td', {}, entreprises),
    el('td', {}, moyens),
    el('td', {}, inrs),
    el('td', {}, [saveBtn, delBtn, status])
  ]);

  saveBtn.addEventListener('click', async () => {
    status.textContent = '...';
    try {
      await api(`/plan-prevention/lignes/${ligne.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          dangers: linesToArray(dangers.value),
          risques: linesToArray(risques.value),
          entreprises_concernees: entreprises.value,
          moyens_prevention: linesToArray(moyens.value),
          inrs_category_id: inrs.value ? Number(inrs.value) : null
        })
      });
      status.textContent = 'Enregistre';
      setTimeout(() => { status.textContent = ''; }, 1500);
    } catch (err) {
      status.textContent = 'Erreur';
    }
  });

  delBtn.addEventListener('click', async () => {
    if (!confirm('Supprimer cette ligne ?')) return;
    await api(`/plan-prevention/lignes/${ligne.id}`, { method: 'DELETE' });
    tr.remove();
  });

  return tr;
}

init();

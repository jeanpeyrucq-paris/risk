import { api, linesToArray, arrayToLines, el } from './app.js';

let inrsCategories = [];

const entrepriseSelect = document.getElementById('entreprise-select');
const newEntrepriseToggle = document.getElementById('new-entreprise-toggle');
const newEntrepriseForm = document.getElementById('new-entreprise-form');
const entrepriseContent = document.getElementById('entreprise-content');

async function init() {
  inrsCategories = await api('/inrs-categories');
  await refreshEntreprises();
}

async function refreshEntreprises(selectId = null) {
  const entreprises = await api('/entreprises');
  entrepriseSelect.innerHTML = '';
  entrepriseSelect.appendChild(el('option', { value: '' }, '— choisir une entreprise —'));
  for (const e of entreprises) {
    entrepriseSelect.appendChild(el('option', { value: e.id }, e.nom));
  }
  if (selectId) {
    entrepriseSelect.value = String(selectId);
    await loadEntrepriseContent(selectId);
  }
}

newEntrepriseToggle.addEventListener('click', () => {
  newEntrepriseForm.hidden = !newEntrepriseForm.hidden;
});

newEntrepriseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nom = document.getElementById('entreprise-nom').value.trim();
  if (!nom) return;
  const entreprise = await api('/entreprises', { method: 'POST', body: JSON.stringify({ nom }) });
  newEntrepriseForm.reset();
  newEntrepriseForm.hidden = true;
  await refreshEntreprises(entreprise.id);
});

entrepriseSelect.addEventListener('change', async () => {
  const id = entrepriseSelect.value;
  entrepriseContent.innerHTML = '';
  if (id) await loadEntrepriseContent(id);
});

async function loadEntrepriseContent(entrepriseId) {
  entrepriseContent.innerHTML = '';
  let doc = null;
  try {
    doc = await api(`/entreprises/${entrepriseId}/duer`);
  } catch {
    doc = null;
  }

  if (!doc) {
    entrepriseContent.appendChild(renderImportPanel(entrepriseId));
    return;
  }
  entrepriseContent.appendChild(renderDocument(doc));
}

function renderImportPanel(entrepriseId) {
  const fileInput = el('input', { type: 'file', accept: 'application/json' });
  const status = el('p', { class: 'hint' }, '');

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    status.textContent = 'Import en cours...';
    try {
      const text = await file.text();
      const res = await fetch(`/api/entreprises/${entrepriseId}/duer/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur ${res.status}`);
      }
      await loadEntrepriseContent(entrepriseId);
    } catch (err) {
      status.textContent = 'Erreur : ' + err.message;
    }
  });

  return el('div', { class: 'form-card' }, [
    el('h3', {}, 'Importer le DUER (JSON)'),
    el('p', { class: 'hint', style: 'margin:8px 0 16px;' }, "Aucun DUER n'est encore importe pour cette entreprise."),
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
      el('h3', {}, doc.entite || doc.titre || 'DUER'),
      el('p', { class: 'hint' }, doc.perimetre || '')
    ]),
    el('div', { style: 'display:flex; gap:10px;' }, [
      el('a', { class: 'btn btn-ghost btn-sm', href: `/api/duer/documents/${doc.id}/export?format=control` }, 'Export tableau'),
      el('a', { class: 'btn btn-primary btn-sm', href: `/api/duer/documents/${doc.id}/export?format=template` }, 'Export modele DUER')
    ])
  ]);
  wrap.appendChild(header);

  const scroll = el('div', { class: 'table-scroll' });
  const table = el('table', { class: 'admin-table' });
  table.appendChild(el('thead', {}, el('tr', {}, [
    'Operation', "Facteur d'exposition", 'Risques', 'Risques INRS', 'Equipement', 'Fonctionnement',
    'Mesures de conception', 'Regles qui sauvent', 'EPC / EPI', 'Formation specifique',
    'Mesures organisationnelles', 'Further actions', 'Comment', 'Categorie INRS', ''
  ].map((h) => el('th', {}, h)))));
  const tbody = el('tbody', {});
  for (const t of doc.taches) tbody.appendChild(renderTacheRow(t));
  table.appendChild(tbody);
  scroll.appendChild(table);
  wrap.appendChild(scroll);

  const addBtn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button', style: 'margin-top:14px;' }, '+ Ajouter une tache');
  addBtn.addEventListener('click', async () => {
    const tache = await api(`/duer/documents/${doc.id}/taches`, { method: 'POST', body: JSON.stringify({}) });
    tbody.appendChild(renderTacheRow(tache));
  });
  wrap.appendChild(addBtn);

  return wrap;
}

function renderTacheRow(t) {
  const principales = el('input', { value: t.principales_operations || '' });
  const facteur = el('input', { value: t.facteur_exposition || '' });
  const risques = el('textarea', {}, arrayToLines(t.risques));
  const risquesInrs = el('input', { value: t.risques_inrs || '', readonly: '' });
  const equipement = el('input', { value: t.equipement || '' });
  const fonctionnement = el('input', { value: t.fonctionnement || '' });
  const mesuresConception = el('textarea', {}, t.mesures_conception || '');
  const reglesQuiSauvent = el('textarea', {}, arrayToLines(t.regles_qui_sauvent));
  const epcEpi = el('textarea', {}, arrayToLines(t.epc_epi));
  const formation = el('textarea', {}, arrayToLines(t.formation_specifique));
  const mesuresOrg = el('textarea', {}, arrayToLines(t.mesures_organisationnelles));
  const furtherActions = el('textarea', {}, arrayToLines(t.further_actions));
  const comment = el('textarea', {}, arrayToLines(t.comment));
  const inrs = inrsSelect(t.inrs_category_id);
  const status = el('span', { class: 'hint' }, '');

  const saveBtn = el('button', { class: 'btn btn-primary btn-sm', type: 'button' }, 'Enregistrer');
  const delBtn = el('button', { class: 'btn btn-danger btn-sm', type: 'button' }, 'Supprimer');

  const tr = el('tr', {}, [
    el('td', {}, principales), el('td', {}, facteur), el('td', {}, risques), el('td', {}, risquesInrs),
    el('td', {}, equipement), el('td', {}, fonctionnement), el('td', {}, mesuresConception),
    el('td', {}, reglesQuiSauvent), el('td', {}, epcEpi), el('td', {}, formation), el('td', {}, mesuresOrg),
    el('td', {}, furtherActions), el('td', {}, comment), el('td', {}, inrs),
    el('td', {}, [saveBtn, delBtn, status])
  ]);

  saveBtn.addEventListener('click', async () => {
    status.textContent = '...';
    try {
      await api(`/duer/taches/${t.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          principales_operations: principales.value,
          facteur_exposition: facteur.value,
          risques: linesToArray(risques.value),
          equipement: equipement.value,
          fonctionnement: fonctionnement.value,
          mesures_conception: mesuresConception.value,
          regles_qui_sauvent: linesToArray(reglesQuiSauvent.value),
          epc_epi: linesToArray(epcEpi.value),
          formation_specifique: linesToArray(formation.value),
          mesures_organisationnelles: linesToArray(mesuresOrg.value),
          further_actions: linesToArray(furtherActions.value),
          comment: linesToArray(comment.value),
          inrs_category_id: inrs.value ? Number(inrs.value) : null
        })
      });
      status.textContent = 'Enregistre';
      setTimeout(() => { status.textContent = ''; }, 1500);
    } catch {
      status.textContent = 'Erreur';
    }
  });

  delBtn.addEventListener('click', async () => {
    if (!confirm('Supprimer cette tache ?')) return;
    await api(`/duer/taches/${t.id}`, { method: 'DELETE' });
    tr.remove();
  });

  return tr;
}

init();

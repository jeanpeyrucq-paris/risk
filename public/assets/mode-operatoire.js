import { api, el } from './app.js';

let familles = [];
let currentSiteId = null;

const siteSelect = document.getElementById('site-select');
const newSiteToggle = document.getElementById('new-site-toggle');
const newSiteForm = document.getElementById('new-site-form');
const siteContent = document.getElementById('site-content');

// Mirrors src/worker/mo-cotation.ts computeCotationDerived() for a live preview.
function computeDerived(l) {
  const rp = l.f != null && l.p != null && l.g != null ? l.f * l.p * l.g : null;
  const mt = l.cotation_epi != null && l.cotation_epc != null ? l.cotation_epi * l.cotation_epc : null;
  const foh = l.cotation_mo != null && l.cotation_mh != null ? l.cotation_mo * l.cotation_mh : null;
  const globale = mt != null && foh != null ? (mt + foh) / 2 : null;
  const niveau = globale != null ? (globale <= 0.5 ? 1 : (globale < 0.75 ? 2 : 3)) : null;
  const rr = rp != null && globale != null ? rp * globale : null;
  return { rp, cotation_mt: mt, cotation_foh: foh, cotation_globale: globale, niveau_maitrise: niveau, rr };
}

function fmt(n) {
  return n === null || n === undefined ? '—' : (Math.round(n * 1000) / 1000).toString();
}

async function init() {
  familles = await api('/familles-risques');
  await refreshSites();
}

async function refreshSites(selectId = null) {
  const sites = await api('/sites');
  siteSelect.innerHTML = '';
  siteSelect.appendChild(el('option', { value: '' }, '— choisir un site —'));
  for (const s of sites) siteSelect.appendChild(el('option', { value: s.id }, s.nom));
  if (selectId) {
    siteSelect.value = String(selectId);
    await loadSiteContent(selectId);
  }
}

newSiteToggle.addEventListener('click', () => { newSiteForm.hidden = !newSiteForm.hidden; });

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
  currentSiteId = siteSelect.value || null;
  siteContent.innerHTML = '';
  if (currentSiteId) await loadSiteContent(currentSiteId);
});

async function loadSiteContent(siteId) {
  currentSiteId = siteId;
  siteContent.innerHTML = '';

  const modes = await api(`/sites/${siteId}/modes-operatoires`);

  const list = el('div', { class: 'form-card', style: 'margin-bottom:24px;' });
  list.appendChild(el('h3', {}, 'Modes operatoires du site'));
  const ul = el('div', { style: 'display:flex; flex-direction:column; gap:8px; margin:14px 0;' });
  for (const mo of modes) {
    const btn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button', style: 'text-align:left;' },
      `${mo.intitule_poste}${mo.sous_activite_code ? ' — ' + mo.sous_activite_code : ''}`);
    btn.addEventListener('click', () => showDetail(mo.id));
    ul.appendChild(btn);
  }
  if (modes.length === 0) ul.appendChild(el('p', { class: 'hint' }, 'Aucun mode operatoire pour ce site.'));
  list.appendChild(ul);

  const newForm = el('form', {}, [
    el('div', { class: 'form-grid' }, [
      el('div', { class: 'field' }, [el('label', {}, 'Intitule du poste'), el('input', { id: 'mo-intitule', required: '' })]),
      el('div', { class: 'field' }, [el('label', {}, 'Code sous-activite'), el('input', { id: 'mo-code' })]),
      el('div', { class: 'field' }, [el('label', {}, 'Libelle sous-activite'), el('input', { id: 'mo-libelle' })]),
      el('div', { class: 'field' }, [el('label', {}, 'Personnes concernees'), el('input', { id: 'mo-personnes' })]),
      el('div', { class: 'field span-2' }, [el('label', {}, 'Description generale'), el('textarea', { id: 'mo-description' })])
    ]),
    el('div', { class: 'form-actions' }, [el('button', { type: 'submit', class: 'btn btn-primary' }, '+ Nouveau mode operatoire')])
  ]);
  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const intitule = document.getElementById('mo-intitule').value.trim();
    if (!intitule) return;
    const mo = await api(`/sites/${siteId}/modes-operatoires`, {
      method: 'POST',
      body: JSON.stringify({
        intitule_poste: intitule,
        sous_activite_code: document.getElementById('mo-code').value.trim(),
        sous_activite_libelle: document.getElementById('mo-libelle').value.trim(),
        personnes_concernees: document.getElementById('mo-personnes').value.trim(),
        description_generale: document.getElementById('mo-description').value.trim()
      })
    });
    newForm.reset();
    await loadSiteContent(siteId);
    showDetail(mo.id);
  });
  list.appendChild(newForm);

  siteContent.appendChild(list);
  siteContent.appendChild(el('div', { id: 'mo-detail' }));
}

async function showDetail(moId) {
  const detail = document.getElementById('mo-detail');
  detail.innerHTML = 'Chargement...';
  const mo = await api(`/modes-operatoires/${moId}`);
  detail.innerHTML = '';

  const header = el('div', { class: 'page-head-row', style: 'margin-bottom:20px;' }, [
    el('div', {}, [
      el('h3', {}, mo.intitule_poste),
      el('p', { class: 'hint' }, mo.sous_activite_libelle || mo.sous_activite_code || '')
    ]),
    el('div', { style: 'display:flex; gap:10px;' }, [
      el('a', { class: 'btn btn-ghost btn-sm', href: `/api/modes-operatoires/${mo.id}/export?type=mode-operatoire` }, 'Exporter le mode operatoire'),
      el('a', { class: 'btn btn-primary btn-sm', href: `/api/modes-operatoires/${mo.id}/export?type=analyse` }, "Exporter l'analyse")
    ])
  ]);
  detail.appendChild(header);

  const methodeLink = el('a', { href: '#methode-mode-operatoire' }, 'methode');
  const referentielLink = el('a', { href: '#referentiel-mesures' }, 'referentiel des mesures de maitrise');
  [methodeLink, referentielLink].forEach((link) => {
    link.addEventListener('click', () => {
      const guide = document.querySelector('details.rubrique');
      if (guide) guide.open = true;
    });
  });
  detail.appendChild(el('p', { class: 'hint', style: 'margin:-10px 0 18px;' }, [
    "Methode : nommez d'abord les taches de la gamme de maintenance, puis analysez l'activite et l'environnement (ci-dessous) en liant chaque danger identifie a la tache concernee. Le mode operatoire reprend automatiquement les risques et moyens de maitrise de l'analyse — voir la ",
    methodeLink,
    ' et le ',
    referentielLink,
    '.'
  ]));

  detail.appendChild(renderTachesSection(mo));
  detail.appendChild(renderAnalyseSection(mo, 'activite', "Analyse — liee a l'activite"));
  detail.appendChild(renderAnalyseSection(mo, 'environnement', "Analyse — liee a l'environnement"));
}

function renderMultiline(text) {
  if (!text) return el('span', { class: 'hint' }, '—');
  const lines = text.split('\n').filter(Boolean);
  if (lines.length <= 1) return el('span', {}, text);
  return el('ul', { class: 'check-list' }, lines.map((line) => el('li', {}, line)));
}

function renderTachesSection(mo) {
  const wrap = el('div', { class: 'form-card', style: 'margin-bottom:24px;' });
  wrap.appendChild(el('h3', {}, 'Taches'));
  wrap.appendChild(el('p', { class: 'hint', style: 'margin-top:6px;' },
    "Risque present / EPI / EPC / procedures / formations se remplissent automatiquement des qu'une ligne d'analyse est liee a la tache."));

  const scroll = el('div', { class: 'table-scroll', style: 'margin-top:14px;' });
  const table = el('table', { class: 'admin-table' });
  table.appendChild(el('thead', {}, el('tr', {}, [
    'Tache', 'Risque present', 'EPI a porter', 'EPC a utiliser', 'Procedures / Organisation', 'Formations / Habilitations', ''
  ].map((h) => el('th', {}, h)))));
  const tbody = el('tbody', {});
  for (const t of mo.taches) tbody.appendChild(renderTacheRow(mo, t));
  table.appendChild(tbody);
  scroll.appendChild(table);
  wrap.appendChild(scroll);

  const nameInput = el('input', { placeholder: 'Nom de la tache', style: 'max-width:360px;' });
  const addBtn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, '+ Ajouter une tache');
  const form = el('div', { style: 'display:flex; gap:10px; align-items:center; margin-top:14px;' }, [nameInput, addBtn]);
  addBtn.addEventListener('click', async () => {
    const tache = nameInput.value.trim();
    if (!tache) return;
    await api(`/modes-operatoires/${mo.id}/taches`, { method: 'POST', body: JSON.stringify({ tache }) });
    await showDetail(mo.id);
  });
  wrap.appendChild(form);
  return wrap;
}

// Taches with >=1 linked analyse ligne show their derived (read-only)
// content - editing happens on the analyse lignes below, per the method.
// Legacy taches with no link (existing Site TEST examples, entered before
// this link existed) keep the original free-text editable form unchanged.
function renderTacheRow(mo, t) {
  const delBtn = el('button', { class: 'btn btn-danger btn-sm', type: 'button' }, 'Supprimer');
  delBtn.addEventListener('click', async () => {
    if (!confirm('Supprimer cette tache ?')) return;
    await api(`/mo-taches/${t.id}`, { method: 'DELETE' });
    await showDetail(mo.id);
  });

  if (t.derived) {
    const badge = el('span', { class: 'hint', style: 'display:block; margin-top:6px;' },
      `Automatique — ${t.linked_dangers} danger${t.linked_dangers > 1 ? 's' : ''} lie${t.linked_dangers > 1 ? 's' : ''}`);
    return el('tr', {}, [
      el('td', {}, [t.tache || '', badge]),
      el('td', {}, renderMultiline(t.risque_present)),
      el('td', {}, renderMultiline(t.epi)),
      el('td', {}, renderMultiline(t.epc)),
      el('td', {}, renderMultiline(t.procedures)),
      el('td', {}, renderMultiline(t.formations)),
      el('td', {}, delBtn)
    ]);
  }

  const tache = el('textarea', {}, t.tache || '');
  const risque = el('textarea', {}, t.risque_present || '');
  const epi = el('textarea', {}, t.epi || '');
  const epc = el('textarea', {}, t.epc || '');
  const procedures = el('textarea', {}, t.procedures || '');
  const formations = el('textarea', {}, t.formations || '');
  const status = el('span', { class: 'hint' }, '');
  const saveBtn = el('button', { class: 'btn btn-primary btn-sm', type: 'button' }, 'Enregistrer');

  const tr = el('tr', {}, [
    el('td', {}, tache), el('td', {}, risque), el('td', {}, epi), el('td', {}, epc),
    el('td', {}, procedures), el('td', {}, formations), el('td', {}, [saveBtn, delBtn, status])
  ]);

  saveBtn.addEventListener('click', async () => {
    status.textContent = '...';
    try {
      await api(`/mo-taches/${t.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          tache: tache.value, risque_present: risque.value, epi: epi.value,
          epc: epc.value, procedures: procedures.value, formations: formations.value
        })
      });
      status.textContent = 'Enregistre';
      setTimeout(() => { status.textContent = ''; }, 1500);
    } catch { status.textContent = 'Erreur'; }
  });

  return tr;
}

function familleSelect(selectedId) {
  const select = el('select', {});
  select.appendChild(el('option', { value: '' }, '—'));
  let currentGroup = null;
  let groupEl = null;
  for (const f of familles) {
    if (f.groupe !== currentGroup) {
      currentGroup = f.groupe;
      groupEl = f.groupe ? el('optgroup', { label: f.groupe }) : null;
      if (groupEl) select.appendChild(groupEl);
    }
    const opt = el('option', { value: f.id }, f.libelle);
    if (selectedId && Number(selectedId) === f.id) opt.selected = true;
    (groupEl || select).appendChild(opt);
  }
  return select;
}

function tacheSelect(mo, selectedId) {
  const select = el('select', {});
  select.appendChild(el('option', { value: '' }, '— (non liee)'));
  for (const t of mo.taches) {
    const opt = el('option', { value: t.id }, t.tache || `Tache #${t.id}`);
    if (selectedId && Number(selectedId) === t.id) opt.selected = true;
    select.appendChild(opt);
  }
  return select;
}

function renderAnalyseSection(mo, contexte, title) {
  const wrap = el('div', { class: 'form-card', style: 'margin-bottom:24px;' });
  wrap.appendChild(el('h3', {}, title));

  const scroll = el('div', { class: 'table-scroll', style: 'margin-top:14px;' });
  const table = el('table', { class: 'admin-table' });
  table.appendChild(el('thead', {}, el('tr', {}, [
    'Tache', 'Danger', 'Famille de risque', 'Risques associes', 'Tete', 'Membres', 'Divers', 'Voies penetr.', 'Autres',
    'F', 'P', 'G', 'Rp', 'EPI', 'Cot. EPI', 'EPC', 'Cot. EPC', 'Cot. MT',
    'Mesures org.', 'Cot. MO', 'Mesures hum.', 'Cot. MH', 'Cot. FOH', 'Cot. globale', 'Niveau maitrise', 'Rr', ''
  ].map((h) => el('th', {}, h)))));
  const tbody = el('tbody', {});
  for (const l of mo.analyse_lignes[contexte]) tbody.appendChild(renderAnalyseRow(mo, l, contexte));
  table.appendChild(tbody);
  scroll.appendChild(table);
  wrap.appendChild(scroll);

  const addBtn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button', style: 'margin-top:14px;' }, '+ Ajouter une ligne');
  addBtn.addEventListener('click', async () => {
    await api(`/modes-operatoires/${mo.id}/analyse-lignes`, { method: 'POST', body: JSON.stringify({ contexte }) });
    await showDetail(mo.id);
  });
  wrap.appendChild(addBtn);
  return wrap;
}

function renderAnalyseRow(mo, l, contexte) {
  const tache = tacheSelect(mo, l.mo_tache_id);
  const danger = el('textarea', {}, l.danger || '');
  const famille = familleSelect(l.famille_risque_id);
  const risques = el('textarea', {}, l.risques_associes || '');
  const teteCb = el('input', { type: 'checkbox' }); teteCb.checked = !!l.corps_tete;
  const membresCb = el('input', { type: 'checkbox' }); membresCb.checked = !!l.corps_membres;
  const diversCb = el('input', { type: 'checkbox' }); diversCb.checked = !!l.corps_divers;
  const voiesCb = el('input', { type: 'checkbox' }); voiesCb.checked = !!l.corps_voies_penetration;
  const autres = el('input', { value: l.corps_autres || '' });
  const f = el('input', { type: 'number', min: '1', max: '5', value: l.f ?? '' });
  const p = el('input', { type: 'number', min: '1', max: '5', value: l.p ?? '' });
  const g = el('input', { type: 'number', min: '1', max: '5', value: l.g ?? '' });
  const rpCell = el('span', {}, fmt(l.rp));
  const epi = el('textarea', {}, l.epi || '');
  const cotEpi = el('input', { type: 'number', step: '0.05', value: l.cotation_epi ?? '' });
  const epc = el('textarea', {}, l.epc || '');
  const cotEpc = el('input', { type: 'number', step: '0.05', value: l.cotation_epc ?? '' });
  const mtCell = el('span', {}, fmt(l.cotation_mt));
  const mo_ = el('textarea', {}, l.mesures_organisationnelles || '');
  const cotMo = el('input', { type: 'number', step: '0.05', value: l.cotation_mo ?? '' });
  const mh = el('textarea', {}, l.mesures_humaines || '');
  const cotMh = el('input', { type: 'number', step: '0.05', value: l.cotation_mh ?? '' });
  const fohCell = el('span', {}, fmt(l.cotation_foh));
  const globaleCell = el('span', {}, fmt(l.cotation_globale));
  const niveauCell = el('span', {}, fmt(l.niveau_maitrise));
  const rrCell = el('span', {}, fmt(l.rr));
  const status = el('span', { class: 'hint' }, '');

  function recompute() {
    const derived = computeDerived({
      f: f.value ? Number(f.value) : null, p: p.value ? Number(p.value) : null, g: g.value ? Number(g.value) : null,
      cotation_epi: cotEpi.value ? Number(cotEpi.value) : null, cotation_epc: cotEpc.value ? Number(cotEpc.value) : null,
      cotation_mo: cotMo.value ? Number(cotMo.value) : null, cotation_mh: cotMh.value ? Number(cotMh.value) : null
    });
    rpCell.textContent = fmt(derived.rp);
    mtCell.textContent = fmt(derived.cotation_mt);
    fohCell.textContent = fmt(derived.cotation_foh);
    globaleCell.textContent = fmt(derived.cotation_globale);
    niveauCell.textContent = fmt(derived.niveau_maitrise);
    rrCell.textContent = fmt(derived.rr);
  }
  [f, p, g, cotEpi, cotEpc, cotMo, cotMh].forEach((input) => input.addEventListener('input', recompute));

  const saveBtn = el('button', { class: 'btn btn-primary btn-sm', type: 'button' }, 'Enregistrer');
  const delBtn = el('button', { class: 'btn btn-danger btn-sm', type: 'button' }, 'Supprimer');

  const tr = el('tr', {}, [
    el('td', {}, tache), el('td', {}, danger), el('td', {}, famille), el('td', {}, risques),
    el('td', {}, teteCb), el('td', {}, membresCb), el('td', {}, diversCb), el('td', {}, voiesCb), el('td', {}, autres),
    el('td', {}, f), el('td', {}, p), el('td', {}, g), el('td', {}, rpCell),
    el('td', {}, epi), el('td', {}, cotEpi), el('td', {}, epc), el('td', {}, cotEpc), el('td', {}, mtCell),
    el('td', {}, mo_), el('td', {}, cotMo), el('td', {}, mh), el('td', {}, cotMh), el('td', {}, fohCell),
    el('td', {}, globaleCell), el('td', {}, niveauCell), el('td', {}, rrCell),
    el('td', {}, [saveBtn, delBtn, status])
  ]);

  saveBtn.addEventListener('click', async () => {
    status.textContent = '...';
    try {
      await api(`/mo-analyse-lignes/${l.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          mo_tache_id: tache.value ? Number(tache.value) : null,
          danger: danger.value,
          famille_risque_id: famille.value ? Number(famille.value) : null,
          risques_associes: risques.value,
          corps_tete: teteCb.checked, corps_membres: membresCb.checked,
          corps_divers: diversCb.checked, corps_voies_penetration: voiesCb.checked,
          corps_autres: autres.value,
          f: f.value ? Number(f.value) : null, p: p.value ? Number(p.value) : null, g: g.value ? Number(g.value) : null,
          epi: epi.value, cotation_epi: cotEpi.value ? Number(cotEpi.value) : null,
          epc: epc.value, cotation_epc: cotEpc.value ? Number(cotEpc.value) : null,
          mesures_organisationnelles: mo_.value, cotation_mo: cotMo.value ? Number(cotMo.value) : null,
          mesures_humaines: mh.value, cotation_mh: cotMh.value ? Number(cotMh.value) : null
        })
      });
      // Tache derivation (risque/EPI/EPC/procedures/formations) depends on
      // this ligne's linked lignes, so refresh the whole detail view rather
      // than patching this row in place.
      await showDetail(mo.id);
    } catch { status.textContent = 'Erreur'; }
  });
  delBtn.addEventListener('click', async () => {
    if (!confirm('Supprimer cette ligne ?')) return;
    await api(`/mo-analyse-lignes/${l.id}`, { method: 'DELETE' });
    await showDetail(mo.id);
  });

  return tr;
}

init();

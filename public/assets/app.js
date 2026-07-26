// Helper partage pour tous les appels API JSON de risk-control-app.
export async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options
  });
  let data = null;
  try { data = await res.json(); } catch { /* pas de corps JSON (ex: DELETE vide) */ }
  if (!res.ok) throw new Error((data && data.error) || `Erreur ${res.status}`);
  return data;
}

export function linesToArray(text) {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

export function arrayToLines(arr) {
  return Array.isArray(arr) ? arr.join('\n') : '';
}

function fieldLabel(key) {
  return key.replace(/_/g, ' ');
}

function renderConditionValue(key, value) {
  if (Array.isArray(value)) {
    const ul = el('ul', { class: 'check-list' });
    for (const item of value) {
      if (item && typeof item === 'object') {
        ul.appendChild(el('li', {}, Object.entries(item).filter(([, v]) => v).map(([k, v]) => `${fieldLabel(k)} : ${v}`).join(' — ')));
      } else {
        ul.appendChild(el('li', {}, String(item)));
      }
    }
    return ul;
  }
  if (value && typeof value === 'object') {
    const div = el('div', { style: 'margin:6px 0 10px;' });
    for (const [k, v] of Object.entries(value)) {
      if (v === null || v === undefined || v === '') continue;
      div.appendChild(renderConditionField(k, v));
    }
    return div;
  }
  return el('p', { class: 'mesure-item', style: 'margin-bottom:10px;' }, String(value ?? ''));
}

function renderConditionField(key, value) {
  if (Array.isArray(value)) {
    const wrap = el('div', {}, [el('p', { class: 'mesure-item' }, [el('b', {}, fieldLabel(key) + ' :')])]);
    wrap.appendChild(renderConditionValue(key, value));
    return wrap;
  }
  return el('p', { class: 'mesure-item' }, [el('b', {}, fieldLabel(key) + ' : '), String(value)]);
}

// Rend le bloc "conditions_intervention" d'un plan de prevention (heterogeneite
// des sous-champs par section : texte simple, liste, ou objet imbrique).
export function renderConditionsIntervention(conditions) {
  const wrap = el('div', { class: 'conditions-intervention' });
  if (!conditions || typeof conditions !== 'object' || Object.keys(conditions).length === 0) {
    wrap.appendChild(el('p', { class: 'hint' }, "Aucune condition d'intervention disponible pour ce site."));
    return wrap;
  }
  for (const section of Object.values(conditions)) {
    if (!section || typeof section !== 'object') continue;
    const block = el('div', { style: 'margin-bottom:18px;' });
    if (section.libelle) block.appendChild(el('h4', {}, section.libelle));
    for (const [key, value] of Object.entries(section)) {
      if (key === 'libelle' || value === null || value === undefined || value === '') continue;
      block.appendChild(renderConditionValue(key, value));
    }
    wrap.appendChild(block);
  }
  return wrap;
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === null || child === undefined) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

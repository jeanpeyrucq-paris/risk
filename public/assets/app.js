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

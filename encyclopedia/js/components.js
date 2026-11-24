// Reusable article building blocks shared by every module.
import { h, link, slug, store } from './util.js';

export const state = { mode: store.get('mode', 'patient') };

export function crumbs(...items) {
  return h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, h('ol', null,
    [['Home', '#/'], ...items].map(([t, href], i, a) => h('li', null, i === a.length - 1 || !href ? h('span', { 'aria-current': i === a.length - 1 ? 'page' : null }, t) : link(href, t)))));
}

const REVIEW = {
  'legacy-unreviewed': ['Awaiting medical review', 'review', 'Migrated from the original reference. Doses, sources and classical locators have not yet been verified by a qualified BAMS/MD reviewer.'],
  draft: ['Draft', 'review', 'Draft content: not for clinical use.'],
  'in-review': ['In review', 'review', 'Under review by a qualified practitioner.'],
  reviewed: ['Medically reviewed', 'ok', null],
  editorial: ['Editorial overview', 'ok', null],
};
export function reviewBadge(status) { const r = REVIEW[status] || REVIEW.draft; return h('span', { class: 'badge ' + r[1], title: r[2] || '' }, r[0]); }
export function reviewNotice(item) {
  const st = item.review?.status || item.status; const r = REVIEW[st];
  if (!r?.[2]) return item.review?.reviewer ? h('p', { class: 'muted' }, `Reviewed by ${item.review.reviewer} on ${item.review.date}.`) : null;
  return h('div', { class: 'panel amb', role: 'note' }, h('strong', null, r[0] + '. '), r[2]);
}
export const SAFETY = {
  herbal: ['Herbal', ''],
  'herbo-mineral': ['Contains metals or minerals', 'danger'],
  'contains-toxic-herb': ['Contains a toxic herb', 'danger'],
};
export const safetyBadge = (c) => { const s = SAFETY[c] || SAFETY.herbal; return h('span', { class: 'badge ' + s[1] }, s[0]); };
export const EVIDENCE = { some: ['Some clinical evidence', 'ok'], limited: ['Limited clinical evidence', 'warn'], 'very-limited': ['Very limited clinical evidence', 'warn'] };
export const evidenceBadge = (r) => { const e = EVIDENCE[r] || EVIDENCE['very-limited']; return h('span', { class: 'badge ' + e[1] }, e[0]); };

export function section(title, ...body) {
  const id = slug(title);
  return h('section', { 'aria-labelledby': id }, h('h2', { id }, title), ...body);
}
export const list = (items, cls = 'clean') => h('ul', { class: cls }, items.map((x) => h('li', null, x)));
export const panel = (cls, title, ...body) => h('div', { class: 'panel ' + cls }, title ? h('h3', null, title) : null, ...body);
export function kvTable(rows, caption) {
  return h('div', { class: 'tbl' }, h('table', null, caption ? h('caption', { class: 'sr' }, caption) : null,
    h('tbody', null, rows.filter((r) => r[1]).map(([k, v]) => h('tr', null, h('th', { scope: 'row' }, k), h('td', null, v))))));
}
export function table(head, rows, caption) {
  return h('div', { class: 'tbl' }, h('table', null, caption ? h('caption', { class: 'sr' }, caption) : null,
    h('thead', null, h('tr', null, head.map((x) => h('th', { scope: 'col' }, x)))),
    h('tbody', null, rows.map((r) => h('tr', null, r.map((c) => h('td', null, c)))))));
}
export function cards(items, cls = '') {
  return h('div', { class: 'grid ' + cls }, items.map((x) => h('a', { class: 'card', href: x.href }, x.img ? h('img', { src: x.img, alt: '', loading: 'lazy', decoding: 'async' }) : null, h('b', null, x.title), x.sub ? h('small', null, x.sub) : null)));
}
export function figure(im) {
  return h('figure', null,
    h('img', { src: im.thumb || im.src, srcset: im.thumb ? `${im.thumb} 480w, ${im.src} 960w` : null, sizes: '(max-width: 600px) 100vw, 480px', alt: im.alt, loading: 'lazy', decoding: 'async',
      onerror: (e) => { e.target.replaceWith(h('p', { class: 'muted' }, 'Image could not be loaded. ', link(im.sourceUrl, 'View on Wikimedia Commons'))); } }),
    h('figcaption', null, im.caption ? im.caption + ' ' : '', h('i', null, im.depicts), '. ', h('span', null, `Photo: ${im.author} · `), link(im.licenseUrl || im.sourceUrl, im.license, { rel: 'license' }), ' · ', link(im.sourceUrl, 'source'),
      im.generated ? h('strong', null, ' · Illustration, not a photograph') : null));
}

// Bookmarks and recently viewed
export function saveButton(route, title) {
  const saved = () => store.get('saved', []).some((s) => s.route === route);
  const b = h('button', { class: 'btn', type: 'button', 'aria-pressed': String(saved()) }, saved() ? '★ Saved' : '☆ Save');
  b.onclick = () => {
    let s = store.get('saved', []);
    s = saved() ? s.filter((x) => x.route !== route) : [{ route, title, at: Date.now() }, ...s];
    store.set('saved', s); b.textContent = saved() ? '★ Saved' : '☆ Save'; b.setAttribute('aria-pressed', String(saved()));
  };
  return b;
}
export function recordVisit(route, title) {
  const r = store.get('recent', []).filter((x) => x.route !== route);
  store.set('recent', [{ route, title, at: Date.now() }, ...r].slice(0, 20));
}
export function actions(route, title, extra = []) {
  return h('div', { class: 'actions noprint' }, saveButton(route, title), h('button', { class: 'btn', type: 'button', onclick: () => print() }, 'Print'), ...extra);
}
export function modeNote() {
  const t = { patient: 'Patient view: plain-language guidance. Switch to Doctor view for classical pathogenesis and formulation details.', doctor: 'Doctor view: classical frameworks and formulation safety details. Doses are withheld until verified by a qualified reviewer.', student: 'Student view: study notes, Samprapti Ghataka, references and self-test.' }[state.mode];
  return h('p', { class: 'muted noprint' }, t);
}

// Article with automatic table of contents built from its h2 headings.
export function article(head, body) {
  const art = h('article', null, ...head, ...body);
  const hs = [...art.querySelectorAll('h2[id]')];
  const toc = hs.length > 2 ? h('nav', { class: 'toc', 'aria-label': 'On this page' }, h('strong', null, 'On this page'), hs.map((x) => h('a', { href: '#' + x.id, onclick: (e) => { e.preventDefault(); x.scrollIntoView(); x.setAttribute('tabindex', '-1'); x.focus({ preventScroll: true }); } }, x.textContent))) : null;
  return h('div', { class: 'layout' }, art, toc || h('div'));
}
export const refList = (refs) => list(refs.map((r) => [r.text, ' ', h('span', { class: 'badge ' + (r.verified ? 'ok' : 'review') }, r.verified ? 'verified' : 'locator unverified')]));

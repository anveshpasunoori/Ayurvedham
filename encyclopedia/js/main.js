// Entry point: hash router, header controls, global search suggestions.
import { h, store } from './util.js';
import { MODULES, load } from './store.js';
import { search } from './search.js';
import { state, recordVisit, crumbs } from './components.js';
import { conditionView } from './views/condition.js';
import { herbView, formulationView, therapyView, yogaView, ailmentView, textView, termView, branchView, centreView, topicView } from './views/entities.js';
import { listView } from './views/lists.js';
import { homeView, searchView, safetyView, aboutView, savedView } from './views/pages.js';
import { academyView } from './views/academy.js';
import { toolsView } from './views/tools.js';

const $ = (id) => document.getElementById(id);
const main = $('main');
const DETAIL = { learn: topicView, conditions: conditionView, herbs: herbView, formulations: formulationView, therapies: therapyView, yoga: yogaView, ailments: ailmentView, texts: textView, dictionary: termView, branches: branchView, centres: centreView };
const PAGES = { '': homeView, search: (p) => searchView(p), safety: safetyView, about: aboutView, saved: savedView };
const NAV = [['learn', 'Learn'], ['conditions', 'Conditions'], ['herbs', 'Plants'], ['formulations', 'Formulations'], ['therapies', 'Therapies'], ['ailments', 'Everyday'], ['yoga', 'Yoga'], ['branches', 'Branches'], ['texts', 'Library'], ['dictionary', 'Dictionary'], ['tools', 'Tools'], ['academy', 'Academy'], ['safety', 'Safety']];
// Hashes used by the original reference and the first prototype, kept working.
const LEGACY = { 'reading-evidence': '#/about', 'urgent-care': '#/safety', library: '#/texts', herbs: '#/herbs', everyday: '#/everyday', safety: '#/safety', centres: '#/centres', healers: '#/centres', az: '#/dictionary', medicines: '#/formulations', home: '#/', routine: '#/tools/routine', prevention: '#/learn/swasthavritta', origins: '#/texts', how: '#/learn/pathya-kalpana', finder: '#/tools/finder' };

async function legacyRedirect(raw) {
  if (LEGACY[raw]) return LEGACY[raw] === '#/everyday' ? '#/ailments' : LEGACY[raw];
  const C = await load('conditions'); if (C.byId.has(raw)) return '#/conditions/' + raw;
  const A = await load('ailments'); if (A.byId.has(raw)) return '#/ailments/' + raw;
  return null;
}

async function route() {
  let raw = decodeURIComponent(location.hash.slice(1));
  if (raw && !raw.startsWith('/')) {
    // In-page anchors (table of contents) are handled by the TOC itself.
    if (document.getElementById(raw)) return;
    const to = await legacyRedirect(raw); if (to) { location.replace(to); return; }
  }
  const [path, qs] = raw.replace(/^\//, '').split('?');
  const params = new URLSearchParams(qs || '');
  const [seg, id] = path.split('/');
  main.replaceChildren(h('p', { class: 'loading' }, 'Loading…'));
  let view;
  try {
    if (seg === 'academy') view = await academyView(id, params);
    else if (seg === 'tools') view = await toolsView(id, params);
    else if (id && DETAIL[seg]) view = await DETAIL[seg](id, params);
    else if (DETAIL[seg]) view = await listView(seg, params);
    else if (seg in PAGES) view = await PAGES[seg](params);
  } catch (e) {
    console.error(e);
    view = { title: 'Error', node: h('div', null, h('h1', null, 'Something went wrong'), h('p', null, 'This page could not be loaded. If you opened the file directly, serve the repository through a web server (for example: python3 -m http.server).'), h('pre', null, String(e.message))) };
  }
  if (!view) view = { title: 'Not found', node: h('div', null, crumbs(['Not found']), h('h1', null, 'Page not found'), h('p', null, 'This article does not exist yet. Try searching, or browse a module from the menu.')) };
  main.replaceChildren(view.node);
  document.title = (view.title === 'Home' ? '' : view.title + ' · ') + 'Ayurvedham Encyclopedia';
  if (id && view.route) recordVisit(view.route, view.title);
  for (const a of $('mainnav').children) a.setAttribute('aria-current', a.dataset.seg === seg ? 'page' : 'false');
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

function setupHeader() {
  $('mainnav').append(...NAV.map(([seg, label]) => h('a', { href: '#/' + seg, 'data-seg': seg }, label)));
  const mode = $('mode'); mode.value = state.mode;
  mode.onchange = () => { state.mode = mode.value; store.set('mode', mode.value); route(); };
  $('theme').onclick = () => {
    const root = document.documentElement;
    const cur = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.dataset.theme = cur === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('ayu-theme', root.dataset.theme); } catch { /* ignore */ }
  };
  const q = $('q'), sug = $('suggest');
  let sel = -1, timer;
  const close = () => { sug.hidden = true; q.setAttribute('aria-expanded', 'false'); sel = -1; };
  q.oninput = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const res = await search(q.value, 8);
      if (!q.value.trim()) return close();
      sug.replaceChildren(...res.map((r, i) => h('li', { role: 'option', id: 'sg' + i }, h('a', { href: `#/${r.mod.id}/${r.id}`, tabindex: '-1' }, h('span', null, r.title), h('small', null, r.mod.singular)))),
        h('li', { role: 'option', id: 'sgall' }, h('a', { href: '#/search?q=' + encodeURIComponent(q.value), tabindex: '-1' }, h('span', null, `All results for “${q.value}”`))));
      sug.hidden = false; q.setAttribute('aria-expanded', 'true'); sel = -1;
    }, 120);
  };
  q.onkeydown = (e) => {
    const items = [...sug.children];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (sug.hidden) return;
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((li, i) => li.setAttribute('aria-selected', String(i === sel)));
      q.setAttribute('aria-activedescendant', items[sel].id);
    } else if (e.key === 'Escape') close();
  };
  $('searchform').onsubmit = (e) => {
    e.preventDefault();
    const items = [...sug.children];
    location.hash = sel >= 0 && !sug.hidden ? items[sel].querySelector('a').getAttribute('href') : '#/search?q=' + encodeURIComponent(q.value);
    close(); q.blur();
  };
  sug.onclick = () => { close(); q.value = ''; };
  document.addEventListener('click', (e) => { if (!$('searchform').contains(e.target)) close(); });
}

setupHeader();
window.addEventListener('hashchange', route);
route();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

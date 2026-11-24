// Module index pages: A–Z, text filter and category chips.
import { h } from '../util.js';
import { load, moduleById } from '../store.js';
import { crumbs, reviewBadge } from '../components.js';

const FILTERS = {
  learn: { label: 'Category', get: (x) => x.categoryLabel },
  conditions: { label: 'System', get: (x) => x.groupName || 'Other', param: 'group', key: (x) => x.group || '' },
  formulations: { label: 'Safety', get: (x) => ({ herbal: 'Herbal', 'herbo-mineral': 'Metals or minerals', 'contains-toxic-herb': 'Toxic herb' })[x.safetyClass] },
  therapies: { label: 'Category', get: (x) => ({ shodhana: 'Shodhana (purification)', purvakarma: 'Preparatory', bahya: 'External', shalya: 'Para-surgical' })[x.category] },
  texts: { label: 'Group', get: (x) => x.group },
  centres: { label: 'Region', get: (x) => x.region },
};
const INTRO = {
  learn: 'Foundations of Ayurveda, diagnosis, food, daily and seasonal routine, health across life, toxicology and research. Each article separates the traditional model from modern science.',
  conditions: 'Each condition gives warning signs first, then modern standard care, diet, yoga and the classical treatment framework. Switch reading mode for doses (Doctor) or study notes (Student).',
  herbs: 'Botanical identity, Rasa Panchaka, traditional uses, cautions and the formulations each plant appears in.',
  formulations: 'Formulations referenced across the encyclopedia. Mineral and toxic-herb preparations are clearly marked and are for physician supervision only.',
  therapies: 'What each therapy is, who it suits, who must avoid it and who should perform it. No procedure instructions are given.',
  ailments: 'Mild everyday complaints with simple home measures and clear signs for when to see a doctor.',
  yoga: 'Yoga postures and breathing practices referenced in condition articles, with cautions.',
  branches: 'The eight branches (Ashtanga Ayurveda) and how much of each this encyclopedia covers so far.',
  texts: 'Classical and modern authoritative texts, with authorship and approximate period.',
  dictionary: 'Ayurvedic terminology in plain English.',
  centres: 'Established Ayurveda hospitals and colleges, listed for information only.',
};

export async function listView(modId, params) {
  const mod = moduleById[modId]; if (!mod) return null;
  const D = await load(mod.data);
  const f = FILTERS[modId];
  let active = params.get(f?.param || 'f') || '';
  const items = [...D.items].sort((a, b) => mod.title(a).localeCompare(mod.title(b)));
  const input = h('input', { class: 'listfilter', type: 'search', placeholder: `Filter ${mod.label.toLowerCase()}…`, 'aria-label': `Filter ${mod.label}`, value: params.get('q') || '' });
  const out = h('div', { 'aria-live': 'polite' });
  const chipsBox = f ? h('div', { class: 'filters', role: 'group', 'aria-label': f.label }) : null;
  const cats = f ? [...new Set(items.map(f.get))].filter(Boolean).sort() : [];
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    const shown = items.filter((x) => (!active || (f.key ? f.key(x) === active : f.get(x) === active)) && (!q || (mod.title(x) + ' ' + (mod.sub(x) || '')).toLowerCase().includes(q)));
    const letters = [...new Set(shown.map((x) => mod.title(x)[0].toUpperCase()))];
    out.replaceChildren(...[h('p', { class: 'muted' }, `${shown.length} of ${items.length}`),
      letters.length > 6 ? h('nav', { class: 'az', 'aria-label': 'Alphabetical index' }, letters.map((l) => h('a', { href: '#az-' + l, onclick: (e) => { e.preventDefault(); document.getElementById('az-' + modId + l)?.scrollIntoView(); } }, l))) : null,
      ...letters.flatMap((l) => [h('h2', { id: 'az-' + modId + l, class: 'azh' }, l), h('div', { class: 'grid' }, shown.filter((x) => mod.title(x)[0].toUpperCase() === l).map((x) => {
        const img = x.images?.[0]?.thumb;
        return h('a', { class: 'card', href: `#/${modId}/${x.id}` }, img ? h('img', { src: img, alt: '', loading: 'lazy', decoding: 'async' }) : null, h('b', null, mod.title(x)), h('small', null, mod.sub(x)), x.status === 'legacy-unreviewed' ? h('small', null, reviewBadge(x.status)) : null);
      }))])].filter(Boolean));
  };
  if (f) {
    const mk = (label, val) => { const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(active === val) }, label); b.onclick = () => { active = val; [...chipsBox.children].forEach((c) => c.setAttribute('aria-pressed', String(c === b))); draw(); }; return b; };
    chipsBox.append(mk('All', ''), ...cats.map((c) => mk(c, f.key ? f.key(items.find((x) => f.get(x) === c)) : c)));
  }
  input.oninput = draw; draw();
  return { title: mod.label, route: '#/' + modId, node: h('div', null, crumbs([mod.label]), h('h1', null, mod.label), h('p', { class: 'lead' }, INTRO[modId] || ''), input, chipsBox, out) };
}

// Lazy data loading from ../data/*.json with an in-memory cache.
const cache = new Map();
export const DATA = '../data/';

export function load(name) {
  if (!cache.has(name)) cache.set(name, fetch(DATA + name + '.json').then((r) => {
    if (!r.ok) throw new Error(`Could not load ${name} (${r.status})`);
    return r.json();
  }).then((j) => { j.byId = new Map((j.items || []).map((x) => [x.id, x])); return j; }));
  return cache.get(name);
}
export const loadAll = (...names) => Promise.all(names.map(load));

// Module registry: route segment → dataset, labels and how to name an item.
export const MODULES = [
  { id: 'learn', label: 'Learn', singular: 'Article', data: 'topics', title: (x) => x.title, sub: (x) => x.english },
  { id: 'conditions', label: 'Conditions', singular: 'Condition', data: 'conditions', title: (x) => x.names.en, sub: (x) => [x.names.iast, x.names.sa].filter(Boolean).join(' · ') },
  { id: 'herbs', label: 'Medicinal plants', singular: 'Plant', data: 'herbs', title: (x) => x.names.sa, sub: (x) => x.names.botanical },
  { id: 'formulations', label: 'Formulations', singular: 'Formulation', data: 'formulations', title: (x) => x.name, sub: (x) => x.form },
  { id: 'therapies', label: 'Therapies', singular: 'Therapy', data: 'therapies', title: (x) => x.name, sub: (x) => x.english },
  { id: 'ailments', label: 'Everyday ailments', singular: 'Everyday ailment', data: 'ailments', title: (x) => x.name, sub: () => 'Home care and when to see a doctor' },
  { id: 'yoga', label: 'Yoga & breathing', singular: 'Practice', data: 'yoga', title: (x) => x.name, sub: (x) => x.english },
  { id: 'branches', label: 'Eight branches', singular: 'Branch', data: 'branches', title: (x) => x.name, sub: (x) => x.english },
  { id: 'texts', label: 'Classical library', singular: 'Text', data: 'texts', title: (x) => x.title, sub: (x) => x.period },
  { id: 'dictionary', label: 'Dictionary', singular: 'Term', data: 'terms', title: (x) => x.term, sub: (x) => x.definition.slice(0, 70) + (x.definition.length > 70 ? '…' : '') },
  { id: 'centres', label: 'Centres', singular: 'Centre', data: 'centres', title: (x) => x.name, sub: (x) => x.place },
];
export const moduleById = Object.fromEntries(MODULES.map((m) => [m.id, m]));

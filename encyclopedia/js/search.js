// Global search across every module, with multilingual synonyms and
// native-script input (transliterated to a phonetic key before matching).
import { load, MODULES } from './store.js';
import { key, hasIndic, toLatin, skeleton } from './translit.js';

let index = null;

function aliasesFor(mod, x) {
  switch (mod.id) {
    case 'conditions': return [x.names.iast, x.names.sa, ...x.keywords];
    case 'herbs': return [x.names.botanical, ...x.names.common, ...x.matchKeywords];
    case 'formulations': return [x.form, ...(x.aliases || [])];
    case 'therapies': return [x.english, x.category];
    case 'ailments': return x.keywords;
    case 'yoga': return [x.english];
    case 'texts': return [x.author, x.group];
    case 'dictionary': return [];
    case 'learn': return [x.english, x.categoryLabel, ...x.sections.map((s) => s.h)];
    case 'branches': return [x.english, x.modernParallel];
    case 'centres': return [x.place, x.region];
    default: return [];
  }
}

export async function buildIndex() {
  if (index) return index;
  const [syn, ...sets] = await Promise.all([load('synonyms'), ...MODULES.map((m) => load(m.data))]);
  const entries = [];
  MODULES.forEach((m, i) => {
    for (const x of sets[i].items) {
      const title = m.title(x);
      const aliases = aliasesFor(m, x).filter(Boolean);
      entries.push({ mod: m, id: x.id, title, sub: m.sub(x), tKey: key(title), sk: [skeleton(key(title)), ...aliases.map((a) => skeleton(key(a)))], aKeys: aliases.map(key), raw: (title + ' ' + aliases.join(' ')).toLowerCase() });
    }
  });
  const byRoute = new Map(entries.map((e) => [e.mod.id + '/' + e.id, e]));
  for (const s of syn.items) {
    const target = s.target.startsWith('ev-') ? byRoute.get('ailments/' + s.target.slice(3)) : byRoute.get('conditions/' + s.target);
    if (target) { target.aKeys.push(key(s.term)); target.sk.push(skeleton(key(s.term))); target.raw += ' ' + s.term; (target.syn ||= []).push(s.term); }
  }
  index = entries;
  return index;
}

export async function search(q, limit = 40) {
  const idx = await buildIndex();
  q = q.trim(); if (!q) return [];
  const qk = key(q), ql = q.toLowerCase();
  const qWords = qk.split(' ').filter(Boolean), qs = skeleton(qk);
  const res = [];
  for (const e of idx) {
    let s = 0;
    if (e.tKey === qk) s = 100;
    else if (e.tKey.startsWith(qk)) s = 70;
    else if (e.aKeys.includes(qk)) s = 85;
    else if (e.tKey.includes(qk)) s = 45;
    else if (e.aKeys.some((a) => a.startsWith(qk))) s = 40;
    else if (e.raw.includes(ql)) s = 30;
    else if (qWords.length > 1 && qWords.every((w) => e.tKey.includes(w) || e.aKeys.some((a) => a.includes(w)))) s = 25;
    else if (qk.length >= 4 && e.aKeys.some((a) => a.includes(qk))) s = 20;
    else if (qk.length >= 4 && e.sk.includes(qs)) s = 15;
    if (s) res.push({ ...e, score: s + (e.mod.id === 'conditions' ? 3 : 0) + (e.mod.id === 'herbs' ? 2 : 0) });
  }
  return res.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}

export const describeQuery = (q) => (hasIndic(q) ? `“${q}” read as “${toLatin(q)}”` : `“${q}”`);

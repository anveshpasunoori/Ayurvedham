#!/usr/bin/env node
// Extracts the data literals embedded in the legacy single-file app (index.html)
// into versioned JSON modules under data/. Only literal declarations are
// evaluated (in an isolated vm context); no DOM code from the page is run.
// Re-run after any edit to the legacy file:  node tools/extract-legacy.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const root = new URL('..', import.meta.url).pathname;
const html = readFileSync(root + 'index.html', 'utf8');

// Return the source text of `const NAME=...;` up to the terminating semicolon
// at bracket depth 0, skipping string and template literal contents.
function declaration(name) {
  const re = new RegExp(`\\n\\s*(?:const|let)\\s+${name}\\s*=`);
  const m = re.exec(html);
  if (!m) throw new Error('Declaration not found: ' + name);
  let i = m.index + m[0].length, depth = 0, q = null;
  for (; i < html.length; i++) {
    const c = html[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ';' && depth === 0) break;
  }
  return html.slice(m.index, i + 1).trim();
}

const ctx = vm.createContext({});
const names = ['E', 'T', 'G', 'G0', 'D', 'SB', 'CS0', 'SG', 'SYL', 'TERMS', 'HB', 'GL', 'YP', 'YG', 'FRED', 'MA', 'SEA', 'CT', 'RG', 'SYN', 'LIB', 'LS', 'RQ'];
let src = '';
for (const n of names) src += declaration(n).replace(/^\s*const\s+/, 'var ').replace(/^\s*let\s+/, 'var ') + '\n';
vm.runInContext(src, ctx, { timeout: 2000 });
const L = (n) => ctx[n];

const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const legacyReview = { status: 'legacy-unreviewed', reviewer: null, date: null,
  note: 'Migrated from the legacy reference; requires verification of edition, locator and dose by a qualified BAMS/MD reviewer before it can be marked reviewed.' };
const out = {};
const sourceHash = createHash('sha256').update(html).digest('hex').slice(0, 12);
const meta = (type, extra = {}) => ({ schema: type, version: 1, migratedFrom: 'index.html', legacySha: sourceHash, ...extra });

// --- Classical source locators for formulations
// The legacy `const CS={};CS0.forEach(...)` is two statements; rebuild it here.
const CS = {}; for (const [ks, v] of L('CS0')) for (const k of ks) CS[k] = v;
const csOf = (name) => {
  const k = name.toLowerCase();
  const keys = Object.keys(CS).sort((a, b) => b.length - a.length);
  for (const key of keys) if (k.includes(key)) return CS[key];
  return null;
};

// --- Conditions
const E = L('E'), T = L('T'), G = L('G'), G0 = L('G0'), SG = L('SG'), YG = L('YG');
const evidence = { s: 'some', l: 'limited', v: 'very-limited' };
const tag = { h: 'herbal', r: 'herbo-mineral', t: 'contains-toxic-herb' };
const formulations = new Map();
const SEVERITY = ['herbal', 'herbo-mineral', 'contains-toxic-herb'];
const FORM_WORD = /(churna|vati|vatakam|gutika|kwatha|kashaya|ghrita|taila|rasa|guggulu|avaleha|paka|arishta|asava|bhasma|lauha|mandura|pishti|parpati|rasayana|lepa|ghana)$/i;
// "Ashwagandha / Bala / Rasna Churna" -> ["Ashwagandha Churna", "Bala Churna", "Rasna Churna"].
// Slashes inside parentheses are not split; a trailing "(external)" applies to every component.
function splitCombined(name) {
  const paren = name.match(/\s*\(([^)]*)\)\s*$/);
  const base = paren && !paren[1].includes('/') ? name.slice(0, paren.index) : name;
  const note = paren && !paren[1].includes('/') ? paren[1] : null;
  const outside = base.replace(/\([^)]*\)/g, (m) => m.replace(/\//g, '\u0000'));
  if (!outside.includes(' / ')) return [{ name: base.replace(/\u0000/g, '/'), note }];
  const parts = outside.split(' / ').map((x) => x.replace(/\u0000/g, '/').trim());
  const last = parts[parts.length - 1].split(' ');
  const fi = last.findIndex((w) => FORM_WORD.test(w));
  const suffix = fi > 0 ? last.slice(fi).join(' ') : '';
  return parts.map((p) => ({ name: !suffix || p.split(' ').some((w) => FORM_WORD.test(w)) ? p : `${p} ${suffix}`, note }));
}
const conditions = L('D').map((d) => {
  const meds = (d.m || []).map((x) => {
    const [name, form, dose, when, anupana, duration, tg, caution, level] = x;
    const cls = tag[tg] || 'herbal';
    const ids = splitCombined(name).map(({ name: n, note }) => {
      const id = slug(n.replace(/\(.*?\)/g, '')).replace(/kashaya/g, 'kwatha').replace(/([a-z])mula/g, '$1moola');
      if (formulations.has(id) && formulations.get(id).name !== n) formulations.get(id).aliases.add(n);
      if (!formulations.has(id)) formulations.set(id, { id, name: n, aliases: new Set(), form, route: note, safetyClass: cls, classicalSource: csOf(n), usedIn: [], cautions: new Set(), combinedIn: new Set() });
      const f = formulations.get(id);
      if (SEVERITY.indexOf(cls) > SEVERITY.indexOf(f.safetyClass)) f.safetyClass = cls;
      f.usedIn.push(d.id); if (caution) f.cautions.add(caution);
      if (name.includes(' / ')) f.combinedIn.add(name);
      return id;
    });
    return { formulations: ids, name, form, dose, timing: when, anupana: anupana === '—' ? null : anupana, duration,
      safetyClass: cls, caution, treatmentLevel: level, alternatives: ids.length > 1 };
  });
  const sg = SG[d.id];
  const group = d.g || G0[d.id] || null;
  return {
    id: d.id, legacyUrl: `../index.html#${d.id}`, status: legacyReview.status,
    names: { en: d.en, sa: d.skt || null, iast: d.tr || null },
    keywords: (d.kw || '').split(/\s+/).filter(Boolean),
    group, groupName: group ? G[group] : null,
    summary: d.sum, types: d.types || null,
    symptoms: d.sym || [], redFlags: d.red || [],
    medicines: meds, pathya: d.pa || [], apathya: d.ap || [],
    course: d.course || null,
    evidence: { rating: evidence[d.ev] || 'very-limited', label: E[d.ev]?.[1] || null, clinical: d.evn || null,
      traditional: 'Classical textual description; not equivalent to clinical-trial evidence.' },
    standardCare: d.mod || null,
    guidelineNote: d.pk || null,
    samprapti: sg ? { dosha: sg[0], dushya: sg[1], srotas: sg[2], adhishthana: sg[3], chikitsaSutra: sg[4], source: sg[5] } : null,
    yoga: YG[d.id] ? { practices: YG[d.id][0], caution: YG[d.id][1] } : null,
    references: (d.refs || []).map((r) => ({ text: r, verified: false })),
    mappingCaution: 'Classical disease categories are not validated equivalents of modern diagnoses; the English name is an approximate orientation only.',
    review: legacyReview,
  };
});

// --- Herbs
const herbs = L('HB').map((h) => ({
  id: slug(h[0]), status: legacyReview.status,
  names: { sa: h[0], botanical: h[1], common: h[2].split(/;\s*/).filter(Boolean) },
  partUsed: h[3], rasa: h[4], guna: h[5], virya: h[6], vipaka: h[7], doshaEffect: h[8],
  uses: h[9], cautions: h[10], matchKeywords: h[11],
  formulations: [], conditions: [], images: [], review: legacyReview,
}));
for (const h of herbs) {
  for (const [fid, f] of formulations) if (h.matchKeywords.some((k) => f.name.toLowerCase().includes(k))) {
    h.formulations.push(fid); for (const c of f.usedIn) if (!h.conditions.includes(c)) h.conditions.push(c);
  }
}

// Attach photographs from the image registry (data/images.json is hand-curated, never generated).
const fp = (file, w) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${w}`;
try {
  const reg = JSON.parse(readFileSync(root + 'data/images.json', 'utf8'));
  for (const im of reg.items) {
    const h = herbs.find((x) => x.id === im.herb); if (!h) throw new Error('images.json: unknown herb ' + im.herb);
    const { herb, file, ...rest } = im;
    h.images.push({ ...rest, src: fp(file, 960), thumb: fp(file, 480) });
  }
} catch (e) { if (e.code !== 'ENOENT') throw e; }

// --- Formulations (derived from the medicine tables)
const forms = [...formulations.values()].map((f) => ({ ...f, cautions: [...f.cautions], usedIn: [...new Set(f.usedIn)], combinedIn: [...f.combinedIn], aliases: [...f.aliases],
  herbs: herbs.filter((h) => h.formulations.includes(f.id)).map((h) => h.id),
  classicalSource: f.classicalSource ? { text: f.classicalSource, verified: false } : null, status: legacyReview.status, review: legacyReview }))
  .sort((a, b) => a.name.localeCompare(b.name));

// --- Terms (dictionary)
const seen = new Set();
const terms = L('GL').filter(([t]) => { const k = slug(t); if (seen.has(k)) return false; seen.add(k); return true; })
  .map(([t, d]) => ({ id: slug(t), term: t, definition: d, status: 'editorial' }));

// --- Yoga
const yoga = Object.entries(L('YP')).map(([id, p]) => ({ id, name: p[0], english: p[1], description: p[2], source: p[3], avoidIf: p[4],
  usedFor: Object.entries(YG).filter(([, v]) => v[0].includes(id)).map(([k]) => k), status: 'editorial' }));

// --- Everyday ailments
const ailments = L('MA').map((a) => ({ id: a.id, name: a.en, linkedCondition: a.ln || null, keywords: (a.kw || '').split(/\s+/).filter(Boolean),
  remedies: a.r.map(([remedy, how, caution]) => ({ remedy, how, caution: caution || null })), redFlags: a.red || [], status: legacyReview.status, review: legacyReview }));

// --- Library
const LS = L('LS');
const texts = L('LIB').map((b) => ({ id: slug(b[0]), title: b[0], author: b[1], period: b[2], group: b[3], contribution: b[4],
  siteStatus: { c: 'cited', i: 'indirect', p: 'planned' }[b[5]] || b[5], siteStatusLabel: LS[b[5]]?.[1] || null }));

// --- Centres
const centres = L('CT').map((c) => ({ id: c.id, name: c.n, place: c.p, founded: c.y, type: c.t, region: c.r, inpatient: c.ip, outpatient: c.op,
  treatments: c.tx, note: c.k, website: c.w || null, suitedFor: c.g, listingStatus: 'informational-not-endorsement' }));

// --- Misc
const synonyms = Object.entries(L('SYN')).map(([term, target]) => ({ term, target, verified: false }));
const syllabus = L('SYL').map(([year, subject, coverage]) => ({ year, subject, coverageHtml: coverage }));
const seasons = Object.entries(L('SEA')).map(([id, s]) => ({ id, name: s[0], guidance: s[1] }));
const emergency = L('FRED');
const groups = Object.entries(G).map(([id, name]) => ({ id, name }));

mkdirSync(root + 'data', { recursive: true });
const write = (file, type, items, extra) => writeFileSync(root + 'data/' + file, JSON.stringify({ ...meta(type, extra), count: items.length, items }, null, 1) + '\n');
write('conditions.json', 'condition', conditions, { groups });
write('herbs.json', 'herb', herbs);
write('formulations.json', 'formulation', forms);
write('terms.json', 'term', terms);
write('yoga.json', 'yoga', yoga);
write('ailments.json', 'ailment', ailments);
write('texts.json', 'text', texts);
write('centres.json', 'centre', centres);
write('synonyms.json', 'synonym', synonyms);
write('syllabus.json', 'syllabus', syllabus);
write('seasons.json', 'season', seasons);
write('prakriti-questions.json', 'prakriti-question', L('RQ').map(([q, o], i) => ({ id: 'pq' + (i + 1), question: q, options: { vata: o[0], pitta: o[1], kapha: o[2] } })));
write('emergency.json', 'red-flag', emergency.map((t, i) => ({ id: 'rf' + (i + 1), text: t })));
console.log(Object.entries({ conditions, herbs, formulations: forms, terms, yoga, ailments, texts, centres, synonyms, syllabus, seasons, emergency })
  .map(([k, v]) => `${k}: ${v.length}`).join('\n'));

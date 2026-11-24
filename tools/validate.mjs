#!/usr/bin/env node
// Zero-dependency validation for every dataset under data/.
// Errors fail the build; warnings are printed for editorial follow-up.
//   node tools/validate.mjs           # summary
//   node tools/validate.mjs --verbose # list every warning
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const verbose = process.argv.includes('--verbose');
const load = (f) => JSON.parse(readFileSync(root + 'data/' + f, 'utf8'));
const errors = [], warnings = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);

const files = readdirSync(root + 'data').filter((f) => f.endsWith('.json') && !f.endsWith('.schema.json') && !['coverage.json', 'condition-candidates.json', 'emergency.json', 'images.json'].includes(f));
const data = {};
for (const f of files) {
  let j; try { j = load(f); } catch (e) { err(`${f}: invalid JSON (${e.message})`); continue; }
  if (!Array.isArray(j.items)) { err(`${f}: missing items array`); continue; }
  if (j.count !== undefined && j.count !== j.items.length) err(`${f}: count ${j.count} != items ${j.items.length}`);
  const ids = new Set();
  for (const it of j.items) {
    if (it.id === undefined) continue;
    if (!/^[a-z0-9-]+$/.test(it.id)) err(`${f}: invalid id "${it.id}"`);
    if (ids.has(it.id)) err(`${f}: duplicate id "${it.id}"`);
    ids.add(it.id);
  }
  data[f.replace('.json', '')] = j;
}
const idset = (k) => new Set((data[k]?.items || []).map((x) => x.id));
const C = idset('conditions'), H = idset('herbs'), F = idset('formulations'), TH = idset('therapies'), Y = idset('yoga'), A = idset('ailments');
const REVIEW = ['draft', 'legacy-unreviewed', 'in-review', 'reviewed'];

function checkReview(f, it) {
  const r = it.review; if (!r) return err(`${f}/${it.id}: missing review block`);
  if (!REVIEW.includes(r.status)) err(`${f}/${it.id}: unknown review status ${r.status}`);
  if (r.status === 'reviewed' && (!r.reviewer || !/^\d{4}-\d{2}-\d{2}$/.test(r.date || ''))) err(`${f}/${it.id}: reviewed entry needs reviewer and ISO date`);
}
function checkImages(f, it) {
  for (const im of it.images || []) {
    for (const k of ['src', 'alt', 'author', 'license', 'sourceUrl']) if (!im[k]) err(`${f}/${it.id}: image missing ${k}`);
    if (im.kind === 'photograph' && im.generated) err(`${f}/${it.id}: generated image cannot be labelled a photograph`);
    if (im.kind === 'photograph' && !im.depicts) err(`${f}/${it.id}: photograph must state the species or subject it depicts`);
    if (im.alt && im.alt.length < 15) warn(`${f}/${it.id}: alt text too short`);
  }
}

for (const c of data.conditions?.items || []) {
  for (const k of ['summary', 'standardCare']) if (!c[k]) err(`conditions/${c.id}: missing ${k}`);
  if (!c.names?.en) err(`conditions/${c.id}: missing English name`);
  if (!c.redFlags?.length) err(`conditions/${c.id}: needs at least one red flag`);
  if (!c.mappingCaution) err(`conditions/${c.id}: missing mapping caution`);
  checkReview('conditions', c); checkImages('conditions', c);
  for (const m of c.medicines || []) {
    if (!m.formulations?.length) err(`conditions/${c.id}: medicine row without formulation ids`);
    for (const fid of m.formulations || []) if (!F.has(fid)) err(`conditions/${c.id}: unknown formulation ${fid}`);
    if (m.safetyClass !== 'herbal' && !m.caution) err(`conditions/${c.id}: ${m.name} is ${m.safetyClass} but has no caution`);
  }
  for (const p of c.yoga?.practices || []) if (!Y.has(p)) err(`conditions/${c.id}: unknown yoga practice ${p}`);
  if (!c.samprapti) warn(`conditions/${c.id}: no Samprapti Ghataka yet`);
  if (!(c.references || []).some((r) => r.verified)) warn(`conditions/${c.id}: no verified classical reference`);
}
for (const h of data.herbs?.items || []) {
  checkReview('herbs', h); checkImages('herbs', h);
  for (const x of h.formulations) if (!F.has(x)) err(`herbs/${h.id}: unknown formulation ${x}`);
  for (const x of h.conditions) if (!C.has(x)) err(`herbs/${h.id}: unknown condition ${x}`);
  if (!h.names?.botanical) err(`herbs/${h.id}: missing botanical name`);
  if (!h.images?.length) warn(`herbs/${h.id}: no photograph`);
}
const normName = (s) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/\b(churna|vati|kwatha|kashaya|ghrita|taila|rasa|guggulu|avaleha|arishta|asava|bhasma)\b/g, '').replace(/[^a-z]/g, '');
const byNorm = new Map();
for (const f of data.formulations?.items || []) {
  checkReview('formulations', f);
  for (const u of f.usedIn) if (!C.has(u)) err(`formulations/${f.id}: unknown condition ${u}`);
  if (f.safetyClass !== 'herbal' && !f.cautions.length) err(`formulations/${f.id}: ${f.safetyClass} without cautions`);
  if (!f.classicalSource) warn(`formulations/${f.id}: no classical source locator`);
  const n = f.name.toLowerCase().replace(/[^a-z]/g, '');
  if (byNorm.has(n)) warn(`formulations: possible duplicate ${byNorm.get(n)} ~ ${f.id}`); else byNorm.set(n, f.id);
  if (f.name.replace(/\([^)]*\)/g, '').includes(' / ')) err(`formulations/${f.id}: combined entry "${f.name}" must be split`);
}
for (const t of data.therapies?.items || []) {
  for (const r of t.related || []) if (!TH.has(r)) err(`therapies/${t.id}: unknown related therapy ${r}`);
  for (const r of t.conditions || []) if (!C.has(r)) err(`therapies/${t.id}: unknown condition ${r}`);
  if (!t.contraindications?.length) err(`therapies/${t.id}: needs contraindications`);
  if (!t.practitioner) err(`therapies/${t.id}: needs practitioner requirement`);
}
for (const b of data.branches?.items || []) for (const r of b.conditionIds || []) if (!C.has(r)) err(`branches/${b.id}: unknown condition ${r}`);
for (const y of data.yoga?.items || []) for (const r of y.usedFor) if (!C.has(r)) err(`yoga/${y.id}: unknown condition ${r}`);
for (const s of data.synonyms?.items || []) {
  const t = s.target; const ok = C.has(t) || (t.startsWith('ev-') && A.has(t.slice(3)));
  if (!ok) err(`synonyms: "${s.term}" points to unknown target ${t}`);
}
for (const a of data.ailments?.items || []) {
  if (a.linkedCondition && !C.has(a.linkedCondition)) warn(`ailments/${a.id}: linked condition ${a.linkedCondition} not in conditions`);
  if (!a.redFlags.length) err(`ailments/${a.id}: needs red flags`);
}
const termNames = new Map();
for (const t of data.terms?.items || []) { const k = t.term.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z]/g, ''); if (termNames.has(k)) warn(`terms: possible duplicate ${termNames.get(k)} ~ ${t.id}`); termNames.set(k, t.id); }

const group = (list) => { const m = {}; for (const w of list) { const k = w.replace(/^[a-z]+(\/[a-z0-9-]+)?: /, '').replace(/ [a-z0-9-]+ ~ [a-z0-9-]+$/, '').replace(/"[^"]*"/g, '…'); m[k] = (m[k] || 0) + 1; } return m; };
console.log(`Datasets: ${Object.entries(data).map(([k, v]) => `${k}=${v.items.length}`).join(', ')}`);
console.log(`Errors: ${errors.length}  Warnings: ${warnings.length}`);
if (verbose) warnings.forEach((w) => console.log('  warn ' + w));
else for (const [k, n] of Object.entries(group(warnings)).sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`  ${n}× ${k}`);
errors.forEach((e) => console.log('  ERROR ' + e));
process.exit(errors.length ? 1 : 0);

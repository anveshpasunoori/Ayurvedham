// Article views for herbs, formulations, therapies, yoga, ailments, texts, terms, branches and centres.
import { h, link } from '../util.js';
import { loadAll } from '../store.js';
import { state, crumbs, reviewBadge, reviewNotice, safetyBadge, section, list, panel, kvTable, table, cards, actions, modeNote, article, refList, figure } from '../components.js';

const condCards = (C, ids) => cards(ids.map((i) => C.byId.get(i)).filter(Boolean).map((x) => ({ href: '#/conditions/' + x.id, title: x.names.en, sub: x.names.iast })));

export async function herbView(id) {
  const [Hs, F, C] = await loadAll('herbs', 'formulations', 'conditions');
  const x = Hs.byId.get(id); if (!x) return null;
  const route = '#/herbs/' + id;
  const head = [crumbs(['Medicinal plants', '#/herbs'], [x.names.sa]),
    h('h1', null, x.names.sa), h('div', { class: 'names' }, h('i', null, x.names.botanical), x.names.common.length ? h('span', null, x.names.common.join(' · ')) : null),
    x.names.regional ? h('dl', { class: 'kv regional' }, Object.entries(x.names.regional).flatMap(([l, n]) => [h('dt', null, { hi: 'Hindi', te: 'Telugu', ta: 'Tamil', ml: 'Malayalam', kn: 'Kannada' }[l]), h('dd', { lang: l }, n)]),
      h('dt', null, ''), h('dd', { class: 'muted' }, 'Regional names: draft, not yet verified by native speakers or the Pharmacopoeia.')) : null,
    h('div', { class: 'badges' }, reviewBadge(x.status), h('span', { class: 'badge' }, 'Part used: ' + x.partUsed)), actions(route, x.names.sa), modeNote()];
  const body = [
    x.images.length ? section('Identification photographs', h('div', { class: 'gallery' }, x.images.map(figure))) : panel('', null, h('p', { class: 'muted' }, 'No verified photograph yet. Images are added only with a confirmed species, author, licence and source.')),
    reviewNotice(x),
    section('Traditional uses', h('p', null, x.uses)),
    panel('amb', 'Safety and cautions', h('p', null, x.cautions), h('p', { class: 'muted' }, 'Check with a doctor before use in pregnancy or breastfeeding, in children, with liver or kidney disease, or alongside prescription medicines.')),
    section('Dravyaguna (pharmacological properties)', kvTable([['Rasa (taste)', x.rasa], ['Guna (qualities)', x.guna], ['Virya (potency)', x.virya], ['Vipaka (post-digestive effect)', x.vipaka], ['Effect on doshas', x.doshaEffect]], 'Rasa Panchaka'),
      h('p', { class: 'muted' }, 'Rasa Panchaka is a traditional classification, not a measure of pharmacological activity.')),
    state.mode !== 'patient' ? section('Pharmacopoeial standard', h('p', { class: 'muted' }, 'Ayurvedic Pharmacopoeia of India monograph locator not yet recorded for this entry.')) : null,
    x.formulations.length ? section('Formulations containing it', list(x.formulations.map((f) => F.byId.get(f)).filter(Boolean).map((f) => [link('#/formulations/' + f.id, f.name), ` — ${f.form}`]))) : null,
    x.conditions.length ? section('Conditions where it is used', condCards(C, x.conditions)) : null,
  ];
  return { title: x.names.sa, route, node: article(head, body.filter(Boolean)) };
}

export async function formulationView(id) {
  const [F, C, Hs] = await loadAll('formulations', 'conditions', 'herbs');
  const f = F.byId.get(id); if (!f) return null;
  const route = '#/formulations/' + id;
  const danger = f.safetyClass !== 'herbal';
  const head = [crumbs(['Formulations', '#/formulations'], [f.name]), h('h1', null, f.name),
    h('div', { class: 'badges' }, reviewBadge(f.status), h('span', { class: 'badge' }, f.form), safetyBadge(f.safetyClass)), actions(route, f.name), modeNote()];
  const body = [
    danger ? panel('red', 'Physician supervision only', h('p', null, f.safetyClass === 'herbo-mineral'
      ? 'This preparation contains processed metals or minerals (for example mercury, lead, arsenic, iron or calcium compounds). Studies of products sold online have found heavy metals in a substantial share of samples. Use only when prescribed by a qualified physician, only products from licensed GMP manufacturers, and never in pregnancy or for children without specialist advice.'
      : 'This preparation contains a herb that is toxic unless correctly purified (Shodhana) and dosed. Use only when prescribed by a qualified physician.')) : null,
    reviewNotice(f),
    f.aliases?.length ? h('p', { class: 'muted' }, 'Also written: ' + f.aliases.join(', ')) : null,
    f.route ? h('p', null, h('strong', null, 'Route: '), f.route) : null,
    f.cautions.length ? section('Cautions', list(f.cautions)) : null,
    section('Classical source', f.classicalSource ? refList([f.classicalSource]) : h('p', { class: 'muted' }, 'Locator not yet recorded.')),
    f.herbs.length ? section('Key ingredients', h('p', { class: 'muted' }, 'Ingredients matched from the plant encyclopedia; a full verified ingredient list is pending.'), list(f.herbs.map((x) => Hs.byId.get(x)).map((x) => [link('#/herbs/' + x.id, x.names.sa), ' — ', h('i', null, x.names.botanical)]))) : null,
    section('Used for', condCards(C, f.usedIn),
      panel('amb', null, 'Dose, timing, vehicle (Anupana) and duration are withheld until verified against the Ayurvedic Formulary of India and the classical source by a qualified reviewer. Take only as prescribed by a qualified physician.'),
      f.combinedIn?.length ? h('p', { class: 'muted' }, 'Listed in the original reference as an alternative within: ' + f.combinedIn.join('; ')) : null),
    section('Quality standard', h('p', { class: 'muted' }, 'Ayurvedic Formulary of India / Pharmacopoeia reference not yet recorded. Buy only from licensed manufacturers; ask for heavy-metal and microbial test results for mineral preparations.')),
  ];
  return { title: f.name, route, node: article(head, body.filter(Boolean)) };
}

const RISK = { low: ['Low risk with a trained therapist', 'ok'], moderate: ['Moderate risk: supervised', 'warn'], high: ['High risk: specialist only', 'danger'] };
export async function therapyView(id) {
  const [T, C] = await loadAll('therapies', 'conditions');
  const t = T.byId.get(id); if (!t) return null;
  const route = '#/therapies/' + id;
  const head = [crumbs(['Therapies', '#/therapies'], [t.name]), h('h1', null, t.name), h('div', { class: 'names' }, t.english),
    h('div', { class: 'badges' }, reviewBadge('editorial'), h('span', { class: 'badge ' + RISK[t.risk][1] }, RISK[t.risk][0]), h('span', { class: 'badge' }, t.category)), actions(route, t.name)];
  const body = [h('p', { class: 'lead' }, t.summary),
    t.risk !== 'low' ? panel('red', 'Not a home procedure', h('p', null, 'This therapy must be planned and performed by a qualified practitioner in an equipped setting. This page explains what it is; it does not teach how to do it.')) : null,
    section('Indications', list(t.indications)),
    section('Contraindications', list(t.contraindications)),
    section('Risks', list(t.risks)),
    section('Aftercare', h('p', null, t.aftercare)),
    section('Who should perform it', h('p', null, t.practitioner)),
    section('Evidence', h('p', null, t.evidence)),
    section('Classical sources', t.sources.length ? refList(t.sources) : h('p', { class: 'muted' }, 'A later practice tradition; no specific Brihat Trayi chapter is cited.')),
    t.conditions?.length ? section('Related conditions', condCards(C, t.conditions)) : null,
    t.related?.length ? section('Related therapies', cards(t.related.map((r) => T.byId.get(r)).map((r) => ({ href: '#/therapies/' + r.id, title: r.name, sub: r.english })))) : null];
  return { title: t.name, route, node: article(head, body.filter(Boolean)) };
}

export async function yogaView(id) {
  const [Y, C] = await loadAll('yoga', 'conditions');
  const y = Y.byId.get(id); if (!y) return null;
  const route = '#/yoga/' + id;
  return { title: y.name, route, node: article([crumbs(['Yoga & breathing', '#/yoga'], [y.name]), h('h1', null, y.name), h('div', { class: 'names' }, y.english), actions(route, y.name)], [
    h('p', { class: 'lead' }, y.description),
    panel('amb', 'Avoid if', h('p', null, y.avoidIf)),
    h('p', { class: 'muted' }, 'Learn new practices from a qualified teacher. Stop if you feel pain, dizziness or breathlessness.'),
    section('Source', refList([{ text: y.source, verified: false }])),
    y.usedFor.length ? section('Suggested in', condCards(C, y.usedFor)) : null].filter(Boolean)) };
}

export async function ailmentView(id) {
  const [A, C] = await loadAll('ailments', 'conditions');
  const a = A.byId.get(id); if (!a) return null;
  const route = '#/ailments/' + id; const lc = a.linkedCondition && C.byId.get(a.linkedCondition);
  return { title: a.name, route, node: article([crumbs(['Everyday ailments', '#/ailments'], [a.name]), h('h1', null, a.name), h('div', { class: 'badges' }, reviewBadge(a.status)), actions(route, a.name)], [
    panel('red', 'See a doctor if', list(a.redFlags)),
    reviewNotice(a),
    section('Simple home measures', table(['Remedy', 'How it is taken', 'Caution'], a.remedies.map((r) => [r.remedy, r.how, r.caution || '—']), 'Home measures'),
      h('p', { class: 'muted' }, 'Home measures are for mild, short-lived symptoms in otherwise healthy adults. For children, pregnancy, chronic illness or regular medicines, ask a doctor first.')),
    lc ? section('Related condition', condCards(C, [lc.id])) : null].filter(Boolean)) };
}

export async function textView(id) {
  const [L] = await loadAll('texts');
  const t = L.byId.get(id); if (!t) return null;
  const route = '#/texts/' + id;
  return { title: t.title, route, node: article([crumbs(['Classical library', '#/texts'], [t.title]), h('h1', null, t.title), h('div', { class: 'badges' }, h('span', { class: 'badge' }, t.group), h('span', { class: 'badge' }, t.siteStatusLabel)), actions(route, t.title)], [
    kvTable([['Author / compiler', t.author], ['Period', t.period + ' (dates are approximate and often debated)'], ['Group', t.group], ['Contribution', t.contribution]], t.title),
    section('Edition and chapter index', h('p', { class: 'muted' }, 'A chapter-by-chapter index with a recorded edition (publisher, year, editor) is pending. Where the encyclopedia cites this text, locators are marked unverified until checked against that edition.'))]) };
}

export async function termView(id) {
  const [T] = await loadAll('terms');
  const t = T.byId.get(id); if (!t) return null;
  const route = '#/dictionary/' + id;
  return { title: t.term, route, node: article([crumbs(['Dictionary', '#/dictionary'], [t.term]), h('h1', null, t.term), actions(route, t.term)], [
    h('p', { class: 'lead' }, t.definition),
    h('p', { class: 'muted' }, 'Ayurvedic concepts such as dosha, agni and ojas are traditional explanatory models. They are not equivalent to structures or processes in modern physiology.')]) };
}

export async function branchView(id) {
  const [B, C] = await loadAll('branches', 'conditions');
  const b = B.byId.get(id); if (!b) return null;
  const route = '#/branches/' + id;
  const conds = C.items.filter((c) => b.conditionIds?.includes(c.id) || b.groups.includes(c.group));
  return { title: b.name, route, node: article([crumbs(['Eight branches', '#/branches'], [b.name]), h('h1', null, b.name), h('div', { class: 'names' }, b.english), h('div', { class: 'badges' }, h('span', { class: 'badge ' + (b.coverage === 'partial' ? 'warn' : 'review') }, 'Coverage: ' + b.coverage)), actions(route, b.name)], [
    h('p', { class: 'lead' }, b.scope),
    kvTable([['Closest modern specialty', b.modernParallel], ['Curriculum', b.curriculum]], b.name),
    section('Conditions in this encyclopedia', conds.length ? cards(conds.map((x) => ({ href: '#/conditions/' + x.id, title: x.names.en, sub: x.names.iast }))) : h('p', { class: 'muted' }, 'No conditions yet. This branch is a priority for expansion.')),
    section('Sources', refList(B.sources))]) };
}

export async function centreView(id) {
  const [CT] = await loadAll('centres');
  const c = CT.byId.get(id); if (!c) return null;
  const route = '#/centres/' + id;
  return { title: c.name, route, node: article([crumbs(['Centres', '#/centres'], [c.name]), h('h1', null, c.name), h('div', { class: 'names' }, c.place), actions(route, c.name)], [
    panel('amb', null, 'Listed for information only, not as an endorsement. Check registration, current services and fees directly with the centre.'),
    kvTable([['Founded', c.founded], ['Type', c.type], ['Region', c.region], ['In-patient', c.inpatient], ['Out-patient', c.outpatient], ['Website', c.website ? link(c.website, c.website, { rel: 'noopener' }) : null]], c.name),
    section('Treatments offered', list(c.treatments)), h('p', null, c.note)]) };
}

const DIAGRAMS = {
  'panchamahabhuta-tridosha': 'Illustration: the five elements and how they combine into the three doshas.',
  'shat-kriyakala': 'Illustration: the six stages of disease described by Sushruta.',
};
const TOOLS = { prakriti: ['#/tools/prakriti', 'Try the constitution self-assessment'], routine: ['#/tools/routine', 'Plan your daily routine'] };
export async function topicView(id) {
  const [T, C, S] = await loadAll('topics', 'conditions', 'seasons');
  const t = T.byId.get(id); if (!t) return null;
  const route = '#/learn/' + id;
  const block = (s) => section(s.h,
    ...(s.p || []).map((x) => h('p', null, x)),
    s.list ? list(s.list) : null,
    s.table ? table(s.table.head, s.table.rows, s.h) : null);
  const body = [h('p', { class: 'lead' }, t.summary),
    t.diagram ? h('figure', null, h('img', { src: `img/${t.diagram}.svg`, alt: DIAGRAMS[t.diagram], width: 640, loading: 'lazy' }), h('figcaption', null, h('strong', null, 'Educational illustration, '), 'not a photograph or a clinical reference.')) : null,
    t.tool ? h('p', null, link(TOOLS[t.tool][0], TOOLS[t.tool][1] + ' →', { class: 'btn primary' })) : null,
    ...t.sections.map(block),
    t.seasons ? section('Guidance for each season', table(['Season', 'Guidance'], S.items.map((x) => [x.name, x.guidance]), 'Seasons')) : null,
    t.conditions?.length ? section('Related conditions', condCards(C, t.conditions)) : null,
    section('Sources', t.sources.length ? refList(t.sources) : h('p', { class: 'muted' }, 'Editorial content; no specific classical locator.'))];
  return { title: t.title, route, node: article([crumbs(['Learn', '#/learn'], [t.categoryLabel, '#/learn?f=' + encodeURIComponent(t.categoryLabel)], [t.title]), h('h1', null, t.title), h('div', { class: 'names' }, t.english),
    h('div', { class: 'badges' }, reviewBadge(t.status), h('span', { class: 'badge' }, t.categoryLabel)), actions(route, t.title)], body.filter(Boolean)) };
}

import { h, link } from '../util.js';
import { t } from '../i18n.js';
import { loadAll } from '../store.js';
import { state, crumbs, reviewBadge, reviewNotice, safetyBadge, evidenceBadge, section, list, panel, kvTable, table, cards, actions, modeNote, article, refList } from '../components.js';

export async function conditionView(id) {
  const [C, H, F, TH, Y, A, B, DX] = await loadAll('conditions', 'herbs', 'formulations', 'therapies', 'yoga', 'ailments', 'branches', 'differentials');
  const dx = DX.byId.get(id);
  const dxSection = () => section('Differential diagnosis', dx
    ? [h('p', null, reviewBadge('draft'), ' Modern conditions to consider; draft, awaiting clinical review. Not exhaustive.'), list(dx.differentials), h('h3', null, 'Initial investigations to consider'), list(dx.investigations)]
    : h('p', { class: 'muted' }, 'Not yet compiled for this entry.'));
  const c = C.byId.get(id); if (!c) return null;
  const route = '#/conditions/' + id, mode = state.mode;
  const branches = B.items.filter((b) => b.conditionIds?.includes(id) || b.groups.includes(c.group));
  const head = [
    crumbs(['Conditions', '#/conditions'], ...(c.group && c.groupName !== c.names.en ? [[c.groupName, '#/conditions?group=' + c.group]] : []), [c.names.en]),
    h('h1', null, c.names.en, c.names.iast ? h('span', { class: 'muted' }, ' · ' + c.names.iast) : null),
    h('div', { class: 'names' }, c.names.sa ? h('span', { class: 'skt', lang: 'sa' }, c.names.sa) : null),
    h('div', { class: 'badges' }, reviewBadge(c.status), evidenceBadge(c.evidence.rating), branches.map((b) => h('a', { class: 'badge', href: '#/branches/' + b.id }, b.name))),
    actions(route, c.names.en, [link(c.legacyUrl, 'Open in original reference', { class: 'btn' })]),
    modeNote(),
  ];
  // A row may list alternatives ("A / B"): link each component formulation.
  const medLink = (m) => m.formulations.length === 1 ? link('#/formulations/' + m.formulations[0], m.name)
    : h('span', null, m.formulations.map((fid, i) => [i ? ' / ' : '', link('#/formulations/' + fid, F.byId.get(fid)?.name || fid)]), h('small', { class: 'muted' }, ' (alternatives)'));
  const yogaPr = (c.yoga?.practices || []).map((p) => Y.byId.get(p)).filter(Boolean);
  const body = [
    h('p', { class: 'lead' }, c.summary),
    panel('red', t('urgent'), list(c.redFlags)),
    reviewNotice(c),
    h('p', { class: 'muted' }, h('strong', null, 'Naming note. '), c.mappingCaution),
  ];

  if (mode === 'patient') {
    body.push(
      section(t('symptoms'), list(c.symptoms)),
      section('What modern medicine advises', h('p', null, c.standardCare)),
      section('Diet and daily habits', h('div', { class: 'two' }, panel('', 'Favour (Pathya)', list(c.pathya)), panel('', 'Avoid (Apathya)', list(c.apathya)))),
      yogaPr.length ? section('Yoga and breathing', list(yogaPr.map((y) => [link('#/yoga/' + y.id, y.name), ` (${y.english})`])), c.yoga.caution ? h('p', { class: 'muted' }, c.yoga.caution) : null) : null,
      section('Classical treatment, in outline',
        h('p', null, 'An Ayurveda physician may choose from medicines such as those below. Unverified dosing is withheld; take medicines only as prescribed, and tell every doctor you see what you are taking.'),
        list(c.medicines.map((m) => [medLink(m), m.safetyClass !== 'herbal' ? [' ', safetyBadge(m.safetyClass)] : null])),
        null),
      section('How strong is the evidence?', h('p', null, c.evidence.clinical)),
    );
  }
  if (mode === 'doctor') {
    body.push(
      c.types ? section('Classification', h('p', null, c.types)) : null,
      c.samprapti ? section('Samprapti Ghataka', sampraptiTable(c)) : null,
      c.samprapti ? section('Chikitsa Sutra (treatment principles)', h('p', null, c.samprapti.chikitsaSutra)) : null,
      section('Formulations as recorded',
        panel('amb', null, h('p', null, 'Dosing, timing and duration are withheld pending qualified review. ', h('strong', null, 'Do not use this list as a prescription.'), ' Herbo-mineral and toxic-herb preparations are for physician supervision only. Adjust for pregnancy, children, the elderly and hepatic or renal impairment.')),
        table(['Formulation', 'Form', 'Safety', 'Caution'],
          c.medicines.map((m) => [medLink(m), m.form, safetyBadge(m.safetyClass), m.caution || '—']), 'Formulations')),
      c.guidelineNote ? section('Standard Treatment Guideline note', h('p', null, c.guidelineNote), h('p', { class: 'muted' }, 'As recorded from the Ministry of AYUSH Ayurvedic Standard Treatment Guidelines (2017) in the original reference; page locator not yet recorded.')) : null,
      dxSection(),
      section('Modern standard of care', h('p', null, c.standardCare)),
      section('Pathya and Apathya', h('div', { class: 'two' }, panel('', 'Pathya', list(c.pathya)), panel('', 'Apathya', list(c.apathya)))),
      section('Evidence', h('p', null, c.evidence.clinical), h('p', { class: 'muted' }, c.evidence.traditional)),
      section('Classical references', refList(c.references), c.samprapti?.source ? h('p', { class: 'muted' }, 'Samprapti source: ' + c.samprapti.source) : null),
    );
  }
  if (mode === 'student') {
    const cardsQ = studyCards(c);
    body.push(
      section('Study notes', kvTable([['English', c.names.en], ['Sanskrit', c.names.iast], ['System group', c.groupName], ['Classification', c.types], ['Key symptoms (Rupa)', c.symptoms.join('; ')]], 'Study notes')),
      c.samprapti ? section('Samprapti Ghataka', sampraptiTable(c), h('p', null, h('strong', null, 'Chikitsa Sutra: '), c.samprapti.chikitsaSutra)) : section('Samprapti Ghataka', h('p', { class: 'muted' }, 'Not yet compiled for this entry.')),
      section('Self-test', ...cardsQ.map(([q, a]) => h('details', { class: 'panel' }, h('summary', null, q), h('p', null, a))), h('p', null, link('#/academy/quiz?topic=conditions', 'Take a quiz on conditions →'))),
      dxSection(),
      section('Formulations to know', list(c.medicines.map((m) => [medLink(m), ` — ${m.form}`]))),
      section('Classical references', refList(c.references)),
      section('Curriculum mapping', list(['II BAMS Roga Nidana evam Vikriti Vijnana: Nidana Panchaka and Samprapti', 'III BAMS Kayachikitsa (or the relevant specialty): Chikitsa Sutra and formulations', 'Swasthavritta: Pathya-Apathya'])),
    );
  }
  const relHerbs = H.items.filter((x) => x.conditions.includes(id));
  const relTher = TH.items.filter((x) => x.conditions?.includes(id));
  const relAil = A.items.filter((x) => x.linkedCondition === id);
  const sameGroup = C.items.filter((x) => x.group && x.group === c.group && x.id !== id);
  body.push(section('Related articles',
    relHerbs.length ? [h('h3', null, 'Medicinal plants'), cards(relHerbs.map((x) => ({ href: '#/herbs/' + x.id, title: x.names.sa, sub: x.names.botanical, img: x.images[0]?.thumb })))] : null,
    relTher.length ? [h('h3', null, 'Therapies'), cards(relTher.map((x) => ({ href: '#/therapies/' + x.id, title: x.name, sub: x.english })))] : null,
    relAil.length ? [h('h3', null, 'Everyday ailments'), cards(relAil.map((x) => ({ href: '#/ailments/' + x.id, title: x.name })))] : null,
    sameGroup.length ? [h('h3', null, 'Same system: ' + c.groupName), cards(sameGroup.map((x) => ({ href: '#/conditions/' + x.id, title: x.names.en, sub: x.names.iast })))] : null));
  return { title: c.names.en, route, node: article(head, body.filter(Boolean)) };
}

function sampraptiTable(c) {
  const s = c.samprapti;
  return kvTable([['Dosha', s.dosha], ['Dushya (tissues)', s.dushya], ['Srotas (channels)', s.srotas], ['Adhishthana (seat)', s.adhishthana]], 'Samprapti Ghataka');
}
function studyCards(c) {
  const out = [];
  if (c.samprapti) out.push([`Which srotas are involved in ${c.names.iast}?`, c.samprapti.srotas], [`Name the dosha involvement in ${c.names.iast}.`, c.samprapti.dosha], [`What is the Adhishthana of ${c.names.iast}?`, c.samprapti.adhishthana]);
  if (c.types) out.push([`How is ${c.names.iast} classified?`, c.types]);
  out.push([`List three warning signs that need modern medical care in ${c.names.en.toLowerCase()}.`, c.redFlags.slice(0, 3).join('; ')]);
  return out;
}

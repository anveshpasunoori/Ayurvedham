// Home, search results, safety, editorial standards and saved items.
import { h, link, store } from '../util.js';
import { load, loadAll, MODULES } from '../store.js';
import { search, describeQuery } from '../search.js';
import { crumbs, section, list, panel, cards, kvTable, table, article, refList } from '../components.js';

export async function homeView() {
  const sets = await loadAll(...MODULES.map((m) => m.data));
  const recent = store.get('recent', []).slice(0, 6);
  const plants = (await load('herbs')).items.filter(x=>x.images?.length).slice(0,8);
  return { title: 'Home', route: '#/', node: h('div', null,
    h('section', { class: 'hero' }, h('h1', null, 'Ayurveda encyclopedia'),
      h('p', { class: 'lead' }, 'Conditions, medicinal plants, formulations, therapies and the classical library, with warning signs, modern standard care and the strength of evidence set beside every traditional treatment.'),
      h('p', null, 'Choose a reading mode at the top: ', h('strong', null, 'Patient'), ' for plain guidance, ', h('strong', null, 'Doctor'), ' for classical frameworks, formulations and safety classes, ', h('strong', null, 'Student'), ' for study notes and self-tests. Search works in English, Sanskrit and Indian scripts.')),
    h('div', { class: 'quicklinks' }, [['conditions','Explore conditions'],['herbs','Browse medicinal plants'],['academy','Study Ayurveda'],['tools','Explore wellness tools']].map(([id,label])=>h('a',{class:'btn',href:'#/'+id},label))),
    h('h2',null,'Explore the encyclopedia'),
    h('div', { class: 'grid tiles' }, MODULES.map((m, i) => h('a', { class: 'card tile', href: '#/' + m.id }, h('span', { class: 'stat' }, sets[i].items.length), h('b', null, m.label)))),
    h('div', { class: 'grid tiles' }, h('a', { class: 'card tile', href: '#/tools' }, h('b', null, 'Tools'), h('small', null, 'Symptom finder, constitution, daily routine')), h('a', { class: 'card tile', href: '#/academy' }, h('b', null, 'Student academy'), h('small', null, 'Flashcards, quizzes, BAMS syllabus map')), h('a', { class: 'card tile', href: '#/safety' }, h('b', null, 'Medical safety'), h('small', null, 'Emergency signs, metals, toxic herbs, special groups')), h('a', { class: 'card tile', href: '#/about' }, h('b', null, 'Editorial standards'), h('small', null, 'Review status, evidence ratings, coverage'))),
    h('section',{class:'featured-plants'},h('h2',null,'Medicinal plant atlas'),h('p',{class:'muted'},'Photographs from credited sources. Botanical identification still requires expert confirmation.'),cards(plants.map(x=>({href:'#/herbs/'+x.id,title:x.names.sa,sub:x.names.botanical,img:x.images[0].thumb||x.images[0].src}))),link('#/herbs','Explore all medicinal plants')),
    recent.length ? [h('h2', null, 'Recently viewed'), cards(recent.map((r) => ({ href: r.route, title: r.title })))] : null) };
}

export async function searchView(params) {
  const q = params.get('q') || '';
  const res = await search(q, 80);
  const groups = new Map(); for (const r of res) { if (!groups.has(r.mod.label)) groups.set(r.mod.label, []); groups.get(r.mod.label).push(r); }
  return { title: 'Search', route: '#/search', node: h('div', null, crumbs(['Search']), h('h1', null, 'Search results'),
    h('p', { class: 'muted' }, res.length ? `${res.length} results for ${describeQuery(q)}` : `No results for ${describeQuery(q)}. Try the English name, the Sanskrit name or a regional name.`),
    [...groups].map(([label, rs]) => [h('h2', null, label), cards(rs.map((r) => ({ href: `#/${r.mod.id}/${r.id}`, title: r.title, sub: r.sub })))])) };
}

export async function safetyView() {
  const [E, F, HB] = await loadAll('emergency', 'formulations', 'herbs');
  const metals = F.items.filter((f) => f.safetyClass === 'herbo-mineral'), toxic = F.items.filter((f) => f.safetyClass === 'contains-toxic-herb');
  const fl = (xs) => list(xs.map((f) => link('#/formulations/' + f.id, f.name)));
  return { title: 'Medical safety', route: '#/safety', node: article([crumbs(['Medical safety']), h('h1', null, 'Medical safety')], [
    panel('red', 'Call emergency services now for', list(E.items.map((x) => x.text)), h('p', null, 'Do not wait to try any traditional remedy first.')),
    section('Never stop prescribed medicine', h('p', null, 'Do not stop or reduce medicines for diabetes, blood pressure, epilepsy, thyroid disease, mental health, blood thinning or any other condition because you have started an Ayurvedic treatment. Tell every doctor and pharmacist about all herbs and supplements you take.')),
    section('Metal and mineral preparations', h('p', null, 'Rasa Shastra preparations (Bhasma, Rasa, Parpati, Lauha, Mandura and similar) are made from processed metals and minerals. A study of Ayurvedic products bought online in the United States found lead, mercury or arsenic in about a fifth of products, and more often in Rasa Shastra products (Saper RB et al., JAMA 2008;300(8):915–923). Lead poisoning linked to such products has been reported repeatedly.'), h('p', null, `${metals.length} formulations in this encyclopedia are marked as containing metals or minerals:`), fl(metals)),
    section('Preparations containing toxic herbs', h('p', null, 'Some formulations contain herbs such as Vatsanabha (aconite), Kupilu (nux vomica), Bhallataka (marking nut), Jayapala (croton seed) or Dhattura, which are poisonous unless correctly purified and dosed. Physician supervision only.'), fl(toxic)),
    section('Special groups', table(['Group', 'What to know'], [
      ['Pregnancy and breastfeeding', 'Avoid all herbal and mineral medicines unless prescribed by a doctor who knows you are pregnant. Purification therapies (Vamana, Virechana, Basti, Nasya, Raktamokshana) are generally contraindicated.'],
      ['Children', 'Doses differ by age and weight. Do not give adult preparations, mineral preparations or toxic-herb preparations to children. Any fever in a baby under 3 months needs urgent medical care.'],
      ['Older adults', 'More likely to take several medicines and to have reduced kidney and liver function; review every supplement with a doctor.'],
      ['Liver disease', 'Liver injury has been reported with several herbs, including Guduchi (Tinospora cordifolia) and Ashwagandha (Withania somnifera). Stop and seek care for dark urine, yellow eyes or abdominal pain.'],
      ['Kidney disease', 'Mineral preparations and high-potassium or nephrotoxic herbs need specialist advice; fluid and salt advice from your nephrologist takes priority.'],
    ], 'Special groups')),
    section('Herb–drug interactions', h('p', null, 'Herbs can change the effect of prescription medicines. Examples noted in plant articles include blood-sugar lowering (Guduchi, Gudmar), sedation (Ashwagandha, Jatamansi), bleeding risk with anticoagulants (Haridra in high doses, Guggulu), and thyroid effects (Ashwagandha, Guggulu). These are illustrative; check each plant article and ask a pharmacist.'),
      list(HB.items.filter((x) => /interact|blood thinner|warfarin|sedative|thyroid|blood sugar|anticoag/i.test(x.cautions)).map((x) => [link('#/herbs/' + x.id, x.names.sa), ': ', x.cautions]))),
    section('Understanding evidence', h('p', null, 'A classical reference documents traditional use; it does not by itself establish that a treatment works or is safe. Each condition article separates the classical source from the clinical evidence and rates the clinical evidence.')),
  ]) };
}

export async function aboutView() {
  const [C, Hs, F] = await loadAll('conditions', 'herbs', 'formulations');
  const verifiedRefs = C.items.filter((c) => c.references.some((r) => r.verified)).length;
  const reviewed = (s) => s.items.filter((x) => x.review?.status === 'reviewed').length;
  return { title: 'Editorial standards', route: '#/about', node: article([crumbs(['Editorial standards']), h('h1', null, 'Editorial standards')], [
    h('p', { class: 'lead' }, 'Accuracy matters more than quantity. This page explains how content is labelled and how much has been verified so far.'),
    section('Review status', table(['Label', 'Meaning'], [
      ['Awaiting medical review', 'Migrated from the original Ayurvedham reference. Shown because it was already public, but doses, sources and locators are not yet verified.'],
      ['Draft', 'New clinical content; not shown in search until reviewed.'],
      ['Editorial overview', 'Non-clinical descriptive content (definitions, history, therapy overviews without procedure steps).'],
      ['Medically reviewed', 'Checked by a named qualified reviewer on a recorded date.'],
    ], 'Review status')),
    section('Evidence ratings', h('p', null, 'Classical textual evidence and modern clinical evidence are kept separate. The clinical rating reflects the quality of human studies, not the authority of a text.'), list(['Some clinical evidence: at least some controlled trials with consistent results.', 'Limited: small or low-quality studies.', 'Very limited: case reports, uncontrolled studies or none.'])),
    section('Sources and locators', h('p', null, 'Every classical locator records the text, section and chapter, and is marked “locator unverified” until it is checked against a named edition (editor, publisher and year). References are never invented; when a locator is unknown the field says so.')),
    section('Images', h('p', null, 'Photographs are used only when the species or subject is confirmed, and each carries the author, licence and source link. Generated illustrations are never used as botanical identification references and are always labelled.')),
    section('Verification progress', kvTable([
      ['Conditions', `${C.items.length} (${reviewed(C)} medically reviewed; ${verifiedRefs} with a verified locator)`],
      ['Medicinal plants', `${Hs.items.length} (${reviewed(Hs)} reviewed; ${Hs.items.filter((x) => x.images.length).length} with a verified photograph)`],
      ['Formulations', `${F.items.length} (${F.items.filter((x) => x.classicalSource).length} with a classical locator, none yet verified against an edition)`],
    ], 'Verification progress')),
    section('Disclaimer', h('p', null, 'This is an educational reference, not medical advice or a prescription. Consult a qualified doctor before starting any treatment, and never stop prescribed medicine.')),
  ]) };
}

export async function savedView() {
  const saved = store.get('saved', []), recent = store.get('recent', []);
  const clear = h('button', { class: 'btn', type: 'button', onclick: () => { store.set('recent', []); location.reload(); } }, 'Clear history');
  return { title: 'Saved', route: '#/saved', node: h('div', null, crumbs(['Saved and recent']), h('h1', null, 'Saved and recent'),
    h('h2', null, 'Saved'), saved.length ? cards(saved.map((s) => ({ href: s.route, title: s.title }))) : h('p', { class: 'muted' }, 'Use ☆ Save on any article to keep it here. Saved items stay on this device only.'),
    h('h2', null, 'Recently viewed'), recent.length ? [cards(recent.map((s) => ({ href: s.route, title: s.title }))), clear] : h('p', { class: 'muted' }, 'Nothing yet.')) };
}

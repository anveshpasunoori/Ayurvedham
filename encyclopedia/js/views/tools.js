// Interactive tools: treatment finder, constitution self-assessment and daily-routine planner.
// All tools put warning signs first and never recommend medicines or doses.
import { h, link, store } from '../util.js';
import { loadAll } from '../store.js';
import { search } from '../search.js';
import { crumbs, panel, list, cards, table } from '../components.js';

const shell = (title, route, ...body) => ({ title, route, node: h('div', null, crumbs(['Tools', '#/tools'], [title]), h('h1', null, title), ...body) });

export async function toolsView(sub) {
  if (sub === 'finder') return finderView();
  if (sub === 'prakriti') return prakritiView();
  if (sub === 'routine') return routineView();
  return { title: 'Tools', route: '#/tools', node: h('div', null, crumbs(['Tools']), h('h1', null, 'Tools'),
    h('p', { class: 'lead' }, 'Interactive guides. None of them diagnoses illness or prescribes medicine.'),
    h('div', { class: 'grid tiles' },
      h('a', { class: 'card tile', href: '#/tools/finder' }, h('b', null, 'Find information for my symptoms'), h('small', null, 'Warning signs first, then matching articles')),
      h('a', { class: 'card tile', href: '#/tools/prakriti' }, h('b', null, 'Constitution self-assessment'), h('small', null, 'Seven questions; a lifestyle guide, not a test')),
      h('a', { class: 'card tile', href: '#/tools/routine' }, h('b', null, 'Daily routine planner'), h('small', null, 'A Dinacharya timetable fitted to your day and season')))) };
}

// ---------------------------------------------------------------- Finder
async function finderView() {
  const [E, C] = await loadAll('emergency', 'conditions');
  const G = C.groups.filter((g) => C.items.some((c) => c.group === g.id && c.id !== 'autism'));
  const S = { step: 0, age: '', preg: false, g: '', sym: new Set(), txt: '' };
  const box = h('div', { 'aria-live': 'polite' });
  const btn = (label, fn, primary) => h('button', { class: 'btn' + (primary ? ' primary' : ''), type: 'button', onclick: fn }, label);
  const go = (n) => { S.step = n; draw(); box.querySelector('h2,h3,button,input')?.focus(); };
  const prog = () => h('p', { class: 'muted' }, `Step ${Math.min(S.step + 1, 4)} of 4`);
  async function draw() {
    if (S.step === 0) {
      const checks = E.items.map((r) => h('label', { class: 'chk' }, h('input', { type: 'checkbox' }), ' ', r.text));
      box.replaceChildren(prog(), panel('red', 'First: do you have any of these right now?', ...checks),
        h('div', { class: 'actions' }, btn('None of these: continue', () => go(1), true), btn('I have one or more', () => go(-1))));
      checks.forEach((c) => c.querySelector('input').onchange = () => { if (checks.some((x) => x.querySelector('input').checked)) go(-1); });
    } else if (S.step === -1) {
      box.replaceChildren(panel('red', 'Please get urgent medical help now',
        h('p', null, 'These signs can be an emergency. Call your local emergency number (112 in India, 911 in the US, 999 in the UK) or go to the nearest emergency department. Ayurveda and home remedies are not suitable for this.'),
        h('p', null, 'If you are thinking of harming yourself, call a crisis line now: 988 in the US, Tele-MANAS 14416 in India, or your local emergency number.')), btn('Start again', () => go(0)));
    } else if (S.step === 1) {
      const opts = [['adult', 'An adult (18–65)'], ['older', 'An older adult (over 65)'], ['teen', 'A teenager (12–17)'], ['child', 'A child under 12']];
      const preg = h('input', { type: 'checkbox', checked: S.preg || null }); preg.onchange = () => { S.preg = preg.checked; };
      box.replaceChildren(prog(), h('h2', { tabindex: '-1' }, 'Who is this for?'), h('div', { class: 'filters' }, opts.map(([k, l]) => h('button', { class: 'chip', type: 'button', 'aria-pressed': String(S.age === k), onclick: () => { S.age = k; go(2); } }, l))),
        h('label', { class: 'chk' }, preg, ' Pregnant or breastfeeding'), h('div', { class: 'actions' }, btn('Back', () => go(0))));
    } else if (S.step === 2) {
      box.replaceChildren(prog(), h('h2', { tabindex: '-1' }, 'Which part of the body is troubling you most?'),
        h('div', { class: 'filters' }, [...G.map((g) => [g.id, g.name]), ['*', 'Not sure / several']].map(([k, l]) => h('button', { class: 'chip', type: 'button', 'aria-pressed': String(S.g === k), onclick: () => { S.g = k; S.sym.clear(); go(3); } }, l))),
        h('div', { class: 'actions' }, btn('Back', () => go(1))));
    } else if (S.step === 3) {
      const ds = C.items.filter((d) => d.id !== 'autism' && (S.g === '*' || d.group === S.g));
      const sy = [...new Set(ds.flatMap((d) => d.symptoms))];
      const txt = h('input', { class: 'listfilter', type: 'search', id: 'ftxt', value: S.txt, placeholder: 'e.g. burning after meals, knee pain in the morning' }); txt.oninput = () => { S.txt = txt.value; };
      box.replaceChildren(prog(), h('h2', { tabindex: '-1' }, 'Tick the symptoms you have'),
        h('div', { class: 'panel' }, sy.map((s) => { const i = h('input', { type: 'checkbox', checked: S.sym.has(s) || null }); i.onchange = () => i.checked ? S.sym.add(s) : S.sym.delete(s); return h('label', { class: 'chk' }, i, ' ', s); })),
        h('label', { for: 'ftxt', class: 'muted' }, 'Anything else, in your own words (optional)'), txt,
        h('div', { class: 'actions' }, btn('Back', () => go(2)), btn('Show matching articles', () => go(4), true)));
    } else {
      const ds = C.items.filter((d) => d.id !== 'autism' && (S.g === '*' || d.group === S.g));
      const txtRes = S.txt.trim() ? (await search(S.txt, 12)).filter((r) => r.mod.id === 'conditions').map((r) => r.id) : [];
      const sc = ds.map((d) => { const hit = d.symptoms.filter((s) => S.sym.has(s)).length; const ti = txtRes.indexOf(d.id); return { d, s: hit * 2 + (hit / d.symptoms.length) * 3 + (ti >= 0 ? (8 - ti) * 0.5 : 0) }; })
        .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3);
      const warn = [];
      if (S.age === 'child') warn.push('For children, doses differ by weight and many medicines are unsuitable. Use simple home care only and see a paediatrician.');
      if (S.age === 'teen') warn.push('For teenagers, a doctor should guide any treatment.');
      if (S.age === 'older') warn.push('Older adults often take other medicines: check every herb for interactions with a doctor or pharmacist.');
      if (S.preg) warn.push('In pregnancy and breastfeeding, do not take any herbal or mineral medicine without your obstetrician agreeing.');
      box.replaceChildren(...[h('h2', { tabindex: '-1' }, 'Articles that may be relevant'),
        panel('amb', null, h('p', null, 'This is not a diagnosis. Symptoms overlap between many conditions, including serious ones. Read the warning signs in each article and see a doctor if symptoms are severe, persistent or worrying.')),
        warn.length ? panel('blue', 'For this person', list(warn)) : null,
        sc.length ? cards(sc.map(({ d }) => ({ href: '#/conditions/' + d.id, title: d.names.en, sub: `${d.names.iast} · ${d.symptoms.filter((s) => S.sym.has(s)).length} of your symptoms` }))) : h('p', null, 'No close match. Try another body area, or search the encyclopedia.'),
        h('div', { class: 'actions' }, btn('Start again', () => { S.sym.clear(); S.txt = ''; go(0); }))].filter(Boolean));
    }
  }
  draw();
  return shell('Find information for my symptoms', '#/tools/finder', box);
}

// ---------------------------------------------------------------- Prakriti
const DN = { vata: 'Vata', pitta: 'Pitta', kapha: 'Kapha' };
const TIPS = {
  vata: 'Keep a regular schedule; favour warm, moist, slightly oily food; daily oil massage; protect from cold and wind; gentle, steady exercise; enough sleep.',
  pitta: 'Avoid skipping meals and very spicy, sour or fried food; favour cooling foods; avoid the midday sun; make time to unwind; moderate, non-competitive exercise.',
  kapha: 'Wake early; favour light, warm, less oily food with pungent and bitter tastes; avoid daytime sleep and heavy sweets; vigorous daily exercise.',
};
async function prakritiView() {
  const [Q] = await loadAll('prakriti-questions');
  const ans = store.get('prakriti-answers', {});
  const out = h('div', { 'aria-live': 'polite' });
  const form = h('form', { class: 'quiz', onsubmit: (e) => { e.preventDefault(); result(); } }, Q.items.map((q) => h('fieldset', null, h('legend', null, q.question),
    Object.entries(q.options).map(([d, text]) => { const id = `${q.id}-${d}`; const i = h('input', { type: 'radio', name: q.id, id, value: d, checked: ans[q.id] === d || null }); i.onchange = () => { ans[q.id] = d; store.set('prakriti-answers', ans); }; return h('label', { for: id }, i, ' ', text); }))),
    h('button', { class: 'btn primary', type: 'submit' }, 'Show my result'));
  function result() {
    const n = Object.keys(ans).length;
    if (n < Q.items.length) { out.replaceChildren(panel('amb', null, `Please answer all ${Q.items.length} questions (${n} answered).`)); return; }
    const cnt = { vata: 0, pitta: 0, kapha: 0 }; Object.values(ans).forEach((d) => cnt[d]++);
    const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
    const dom = sorted[0][1] - sorted[1][1] <= 1 ? [sorted[0][0], sorted[1][0]] : [sorted[0][0]];
    store.set('prakriti', dom);
    out.replaceChildren(panel('blue', 'Your answers lean towards: ' + dom.map((d) => DN[d]).join('–'),
      table(['Dosha', 'Answers'], sorted.map(([d, c]) => [DN[d], String(c)]), 'Answer count'),
      list(dom.map((d) => [h('strong', null, DN[d] + ': '), TIPS[d]]))),
      panel('amb', null, h('p', null, 'Seven questions cannot determine Prakriti reliably; a physician assesses many more features. Use this only as a lifestyle guide. It says nothing about any disease.')),
      h('p', null, link('#/tools/routine', 'Use this in the daily routine planner →'), ' · ', link('#/learn/prakriti', 'Read about Prakriti')));
    out.scrollIntoView();
  }
  return shell('Constitution self-assessment', '#/tools/prakriti', h('p', { class: 'lead' }, 'Choose the description that has been true for you for most of your life, not just recently.'), form, out);
}

// ---------------------------------------------------------------- Routine planner
const SEASON_BY_MONTH = ['shishira', 'shishira', 'vasanta', 'vasanta', 'grishma', 'grishma', 'varsha', 'varsha', 'sharad', 'sharad', 'hemanta', 'hemanta'];
const toMin = (s) => { const [a, b] = (s || '0:0').split(':').map(Number); return a * 60 + b; };
const fmt = (m) => { m = ((Math.round(m / 5) * 5) % 1440 + 1440) % 1440; const hh = Math.floor(m / 60), mm = m % 60; return `${(hh % 12) || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'}`; };
async function routineView() {
  const [S] = await loadAll('seasons');
  const saved = store.get('routine', { age: 'adult', start: '09:00', end: '17:00', commute: 30, home: false, season: 'auto', flags: [] });
  const pr = store.get('prakriti', []);
  const field = (label, input) => h('label', { class: 'field' }, h('span', null, label), input);
  const age = h('select', null, [['adult', 'Adult (18–64)'], ['older', '65 or over']].map(([v, l]) => h('option', { value: v, selected: saved.age === v || null }, l)));
  const start = h('input', { type: 'time', value: saved.start }), end = h('input', { type: 'time', value: saved.end });
  const commute = h('input', { type: 'number', min: 0, max: 180, step: 5, value: saved.commute });
  const home = h('input', { type: 'checkbox', checked: saved.home || null });
  const season = h('select', null, [h('option', { value: 'auto' }, 'From today’s date (north Indian calendar)'), ...S.items.map((x) => h('option', { value: x.id, selected: saved.season === x.id || null }, x.name))]);
  const FLAGS = [['diabetes', 'Diabetes'], ['heart', 'Heart disease or high blood pressure'], ['preg', 'Pregnant'], ['fever', 'Currently unwell with fever'], ['night', 'Night shifts']];
  const flagBoxes = FLAGS.map(([k, l]) => { const i = h('input', { type: 'checkbox', value: k, checked: saved.flags.includes(k) || null }); return h('label', { class: 'chk' }, i, ' ', l); });
  const out = h('div', { 'aria-live': 'polite' });
  const make = (e) => {
    e?.preventDefault();
    const st = { age: age.value, start: start.value, end: end.value, commute: Number(commute.value) || 0, home: home.checked, season: season.value, flags: flagBoxes.filter((b) => b.querySelector('input').checked).map((b) => b.querySelector('input').value) };
    store.set('routine', st);
    const has = (f) => st.flags.includes(f), elder = st.age === 'older';
    const sk = st.season === 'auto' ? SEASON_BY_MONTH[new Date().getMonth()] : st.season;
    const sea = S.items.find((x) => x.id === sk);
    const ws = toMin(st.start), leave = st.home ? null : ws - st.commute;
    const kapha = pr.includes('kapha'), vata = pr.includes('vata');
    if (has('night')) { out.replaceChildren(panel('amb', 'Night-shift routine', h('p', null, 'Classical routines assume daytime work. On night shifts: keep the same sleep window every day, sleep in a dark, quiet room, have the main meal before the shift, eat light during the night, and avoid heavy meals just before sleeping. Discuss shift-related sleep problems with a doctor.'))); return; }
    let wake = kapha ? 300 : elder || vata ? 360 : 330;
    if (leave != null && wake > leave - 90) wake = leave - 90;
    const sleepH = elder ? 8 : 7.5;
    const bed = wake - sleepH * 60 + 1440;
    const back = st.home ? 1050 : toMin(st.end) + st.commute;
    const lunch = st.home || (ws <= 750 && toMin(st.end) >= 810) ? 750 : Math.min(Math.max(ws + 180, 720), 810);
    const dinner = Math.min(Math.max(back + 30, 1110), bed - 150);
    const fever = has('fever');
    const rows = [
      [wake, 'Wake', 'Drink a glass of warm water. Attend to natural urges without straining.'],
      [wake + 10, 'Mouth care', 'Brush with a soft brush, scrape the tongue, rinse or swish with warm water or sesame oil (do not swallow).'],
      [wake + 25, fever ? 'Rest' : 'Oil massage', fever ? 'No massage or exercise while you have fever.' : 'Self-massage (Abhyanga) for 10–15 minutes with warm sesame oil; coconut oil in hot weather. Skip if you have a cold, indigestion or skin infection.'],
      [wake + 45, fever ? 'Light walk only if well enough' : 'Exercise', fever ? 'Rest until fever settles.' : `${elder ? '20–30' : has('heart') ? '30 (moderate, as cleared by your doctor)' : '30–40'} minutes of walking, yoga or sport, to about half your capacity (light sweating, able to talk).${has('diabetes') ? ' Check blood sugar first if you take insulin or sulfonylureas, and carry glucose.' : ''}${has('preg') ? ' Use pregnancy-safe exercise as advised by your obstetrician.' : ''}`],
      [wake + 90, 'Bath', 'Warm (not hot) water for the body; lukewarm or cool water for the head.'],
      [wake + 110, 'Breakfast', kapha ? 'Light: fruit, or warm water with a little ginger if not hungry.' : 'Warm, simple breakfast such as porridge, upma, idli or poha.'],
      leave != null ? [leave, 'Leave for work', ''] : null,
      [lunch, 'Main meal', 'Make lunch the largest meal: grains, pulses, vegetables, a little ghee; buttermilk after the meal. Sit and eat without screens.'],
      [lunch + 15, 'Short walk', 'A few hundred steps after eating; avoid sleeping after lunch.'],
      [back, 'Home', 'Change, wash hands and feet, unwind.'],
      [dinner, 'Light dinner', 'Soup, khichdi or vegetables; at least 2–3 hours before bed.'],
      [bed - 60, 'Wind down', 'Screens off; reading, prayer or meditation. Warm milk with a pinch of nutmeg if it suits you.'],
      [bed, 'Lights out', `Aim for ${sleepH} hours of sleep.`],
    ].filter(Boolean).sort((a, b) => ((a[0] - wake + 1440) % 1440) - ((b[0] - wake + 1440) % 1440));
    out.replaceChildren(...[h('h2', null, 'Your routine'), pr.length ? h('p', { class: 'muted' }, 'Adjusted for your self-assessed constitution: ' + pr.map((d) => DN[d]).join('–') + '.') : h('p', { class: 'muted' }, link('#/tools/prakriti', 'Take the constitution self-assessment'), ' to tailor this further.'),
      table(['Time', 'Activity', 'Details'], rows.map(([t, a, d]) => [fmt(t), a, d]), 'Daily routine'),
      sea ? panel('blue', 'This season: ' + sea.name, h('p', null, sea.guidance)) : null,
      has('preg') || has('heart') || has('diabetes') ? panel('amb', null, 'Medical conditions: follow your own doctor’s advice on exercise, diet, fasting and fluids where it differs from this plan.') : null].filter(Boolean));
  };
  const form = h('form', { class: 'panel planner', onsubmit: make },
    h('div', { class: 'two' }, field('Age group', age), field('Season', season), field('Work starts', start), field('Work ends', end), field('Commute each way (minutes)', commute)),
    h('label', { class: 'chk' }, home, ' I work from home or am not working'),
    h('fieldset', null, h('legend', null, 'Any of these apply?'), flagBoxes),
    h('button', { class: 'btn primary', type: 'submit' }, 'Make my routine'));
  setTimeout(() => make(), 0);
  return shell('Daily routine planner', '#/tools/routine', h('p', { class: 'lead' }, 'A Dinacharya timetable fitted around your working day and the season. General guidance for healthy adults, not treatment.'), form, out);
}

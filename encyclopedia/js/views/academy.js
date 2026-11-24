// Student academy: syllabus map, flashcards and auto-generated MCQs from shared data.
import { h, link, stripTags } from '../util.js';
import { loadAll } from '../store.js';
import { crumbs, table, panel } from '../components.js';

const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n, not) => shuffle([...new Set(a.filter((x) => x && x !== not))]).slice(0, n);

async function bank() {
  const [C, Hs, T] = await loadAll('conditions', 'herbs', 'terms');
  const q = [];
  const sc = C.items.filter((c) => c.samprapti);
  for (const c of sc) {
    q.push({ topic: 'conditions', q: `Which srotas are involved in ${c.names.iast}?`, a: c.samprapti.srotas, o: pick(sc.map((x) => x.samprapti.srotas), 3, c.samprapti.srotas), link: '#/conditions/' + c.id });
    q.push({ topic: 'conditions', q: `What is the Adhishthana (seat) of ${c.names.iast}?`, a: c.samprapti.adhishthana, o: pick(sc.map((x) => x.samprapti.adhishthana), 3, c.samprapti.adhishthana), link: '#/conditions/' + c.id });
  }
  for (const x of Hs.items) {
    q.push({ topic: 'herbs', q: `Botanical name of ${x.names.sa}?`, a: x.names.botanical, o: pick(Hs.items.map((y) => y.names.botanical), 3, x.names.botanical), link: '#/herbs/' + x.id, italic: true });
    if (/^(Ushna|Shita)$/.test(x.virya)) q.push({ topic: 'herbs', q: `Virya of ${x.names.sa}?`, a: x.virya, o: [x.virya === 'Ushna' ? 'Shita' : 'Ushna', 'Madhura', 'Katu'], link: '#/herbs/' + x.id });
    q.push({ topic: 'herbs', q: `Part of ${x.names.sa} mainly used?`, a: x.partUsed, o: pick(Hs.items.map((y) => y.partUsed), 3, x.partUsed), link: '#/herbs/' + x.id });
  }
  for (const t of T.items) q.push({ topic: 'terms', q: `Which term means: “${t.definition.split(/[.:;]/)[0]}”?`, a: t.term, o: pick(T.items.map((y) => y.term), 3, t.term), link: '#/dictionary/' + t.id });
  return q.filter((x) => x.o.length === 3);
}

export async function academyView(sub, params) {
  if (sub === 'quiz') return quizView(params);
  if (sub === 'flashcards') return flashView(params);
  const [S] = await loadAll('syllabus');
  return { title: 'Student academy', route: '#/academy', node: h('div', null, crumbs(['Student academy']), h('h1', null, 'Student academy'),
    h('p', { class: 'lead' }, 'Self-study tools built from the same records as the encyclopedia. Switch the reading mode to Student for study notes and Samprapti Ghataka on every condition.'),
    panel('amb', null, 'Questions are generated from content that is still awaiting medical review. Check answers against your prescribed textbooks.'),
    h('div', { class: 'grid tiles' }, h('a', { class: 'card tile', href: '#/academy/flashcards' }, h('b', null, 'Flashcards'), h('small', null, 'Dictionary terms and Dravyaguna')),
      h('a', { class: 'card tile', href: '#/academy/quiz?topic=conditions' }, h('b', null, 'Quiz: Roga Nidana'), h('small', null, 'Srotas and Adhishthana')),
      h('a', { class: 'card tile', href: '#/academy/quiz?topic=herbs' }, h('b', null, 'Quiz: Dravyaguna'), h('small', null, 'Botanical names, Virya, parts used')),
      h('a', { class: 'card tile', href: '#/academy/quiz?topic=terms' }, h('b', null, 'Quiz: Terminology'), h('small', null, 'Padartha Vijnana and core terms'))),
    h('h2', null, 'BAMS syllabus map'),
    h('p', { class: 'muted' }, 'Subjects follow the BAMS course structure; coverage notes describe what this encyclopedia offers for each. Check the current NCISM syllabus for official content.'),
    table(['Year', 'Subject', 'What the encyclopedia covers'], S.items.map((s) => [s.year, s.subject, stripTags(s.coverageHtml)]), 'Syllabus map')) };
}

async function quizView(params) {
  const topic = params.get('topic') || 'conditions';
  const qs = shuffle((await bank()).filter((x) => x.topic === topic)).slice(0, 10);
  let i = 0, score = 0;
  const box = h('div', { class: 'quiz', 'aria-live': 'polite' });
  const draw = () => {
    if (i >= qs.length) { box.replaceChildren(h('h2', null, `Score: ${score} / ${qs.length}`), h('a', { class: 'btn primary', href: '#/academy/quiz?topic=' + topic + '&r=' + Date.now() }, 'New quiz')); return; }
    const x = qs[i], opts = shuffle([x.a, ...x.o]);
    const fb = h('p');
    const fs = h('fieldset', null, h('legend', null, `Question ${i + 1} of ${qs.length}: ${x.q}`), opts.map((o, k) => {
      const inp = h('input', { type: 'radio', name: 'q', id: 'o' + k, value: o });
      const lab = h('label', { for: 'o' + k }, inp, ' ', x.italic ? h('i', null, o) : o);
      inp.onchange = () => {
        const ok = o === x.a; if (ok) score++;
        [...fs.querySelectorAll('label')].forEach((l) => { l.querySelector('input').disabled = true; if (l.querySelector('input').value === x.a) l.classList.add('right'); });
        if (!ok) lab.classList.add('wrong');
        fb.replaceChildren(ok ? 'Correct. ' : `Answer: ${x.a}. `, link(x.link, 'Read the article'), ' ', h('button', { class: 'btn primary', type: 'button', onclick: () => { i++; draw(); } }, 'Next'));
      };
      return lab;
    }));
    box.replaceChildren(fs, fb);
  };
  draw();
  return { title: 'Quiz', route: '#/academy/quiz', node: h('div', null, crumbs(['Student academy', '#/academy'], ['Quiz']), h('h1', null, 'Quiz: ' + ({ conditions: 'Roga Nidana', herbs: 'Dravyaguna', terms: 'Terminology' })[topic]), box) };
}

async function flashView() {
  const [T, Hs] = await loadAll('terms', 'herbs');
  const deck = shuffle([...T.items.map((t) => [t.term, t.definition]), ...Hs.items.map((x) => [`${x.names.sa}: Rasa, Virya, Vipaka?`, `Rasa ${x.rasa}; Virya ${x.virya}; Vipaka ${x.vipaka}`])]);
  let i = 0, back = false;
  const card = h('button', { class: 'panel flash', type: 'button', 'aria-live': 'polite' });
  const count = h('p', { class: 'muted' });
  const draw = () => { card.textContent = deck[i][back ? 1 : 0]; card.setAttribute('aria-label', (back ? 'Answer: ' : 'Question: ') + deck[i][back ? 1 : 0] + '. Activate to flip.'); count.textContent = `Card ${i + 1} of ${deck.length} · tap the card to flip`; };
  card.onclick = () => { back = !back; draw(); };
  const nav = (d) => () => { i = (i + d + deck.length) % deck.length; back = false; draw(); };
  draw();
  return { title: 'Flashcards', route: '#/academy/flashcards', node: h('div', null, crumbs(['Student academy', '#/academy'], ['Flashcards']), h('h1', null, 'Flashcards'), count, card,
    h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: nav(-1) }, '← Previous'), h('button', { class: 'btn primary', type: 'button', onclick: nav(1) }, 'Next →'))) };
}

// Unit tests: transliteration/search keys and dataset integrity rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { key, toLatin, skeleton } from '../encyclopedia/js/translit.js';

const data = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url))).items;

test('Indic scripts transliterate to the same key as Latin spellings', () => {
  const pairs = [['ज्वर', 'jwara'], ['జ్వరం', 'jwara'], ['காய்ச்சல்', 'kaichal'], ['അശ്വഗന്ധ', 'ashwagandha'], ['ಅಶ್ವಗಂಧ', 'Ashwagandha'], ['मधुमेह', 'madhumeha'], ['ആമവാതം', 'amavata'], ['आमलकी', 'Amalaki']];
  for (const [native, latin] of pairs) assert.equal(key(native), key(latin), `${native} vs ${latin}`);
  assert.equal(skeleton(key('తులసి')), skeleton(key('tulsi')));
  assert.equal(toLatin('ज्वर'), 'jvara');
});

test('Latin spelling variants fold together', () => {
  assert.equal(key('Shirodhara'), key('shirodhaara'));
  assert.equal(key('Jwara'), key('Jvara'));
  assert.equal(key('Guduchee'), key('Guduchi'));
});

test('every condition has warning signs, standard care and a review status', () => {
  for (const c of data('conditions')) {
    assert.ok(c.redFlags.length > 0, c.id);
    assert.ok(c.standardCare, c.id);
    assert.ok(['draft', 'legacy-unreviewed', 'in-review', 'reviewed'].includes(c.review.status), c.id);
    if (c.review.status === 'reviewed') assert.ok(c.review.reviewer && c.review.date, c.id);
  }
});

test('no migrated record is marked reviewed without a reviewer', () => {
  for (const n of ['conditions', 'herbs', 'formulations', 'ailments'])
    for (const x of data(n)) assert.notEqual(x.review?.status === 'reviewed' && !x.review.reviewer, true, `${n}/${x.id}`);
});

test('metal and toxic-herb formulations always carry cautions', () => {
  for (const f of data('formulations')) if (f.safetyClass !== 'herbal') assert.ok(f.cautions.length > 0, f.id);
});

test('photographs carry author, licence, source, species and alt text', () => {
  for (const h of data('herbs')) for (const im of h.images) {
    for (const k of ['src', 'alt', 'author', 'license', 'sourceUrl', 'depicts']) assert.ok(im[k], `${h.id} ${k}`);
    assert.match(im.sourceUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.notEqual(im.generated, true);
  }
});

test('no locator is claimed as verified until an edition is recorded', () => {
  for (const c of data('conditions')) for (const r of c.references) if (r.verified) assert.ok(r.edition, `${c.id}: verified reference needs edition`);
});

test('therapy pages give no procedure quantities', () => {
  for (const t of data('therapies')) assert.doesNotMatch(JSON.stringify(t), /\b\d+\s?(ml|mg|g|minutes?)\b/i, t.id);
});

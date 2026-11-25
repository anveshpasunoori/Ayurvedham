// Script-agnostic Indic → Latin transliteration plus a phonetic match key.
// Devanagari, Bengali, Gurmukhi, Gujarati, Oriya, Tamil, Telugu, Kannada and
// Malayalam Unicode blocks share one layout (ISCII heritage), so a single table
// indexed by offset within the 128-code-point block covers them all.
const BLOCKS = [0x0900, 0x0980, 0x0a00, 0x0a80, 0x0b00, 0x0b80, 0x0c00, 0x0c80, 0x0d00];
const V = { 0x05: 'a', 0x06: 'aa', 0x07: 'i', 0x08: 'ii', 0x09: 'u', 0x0a: 'uu', 0x0b: 'ri', 0x0c: 'li', 0x0e: 'e', 0x0f: 'e', 0x10: 'ai', 0x12: 'o', 0x13: 'o', 0x14: 'au', 0x60: 'rri' };
const C = { 0x15: 'k', 0x16: 'kh', 0x17: 'g', 0x18: 'gh', 0x19: 'ng', 0x1a: 'ch', 0x1b: 'chh', 0x1c: 'j', 0x1d: 'jh', 0x1e: 'ny',
  0x1f: 't', 0x20: 'th', 0x21: 'd', 0x22: 'dh', 0x23: 'n', 0x24: 't', 0x25: 'th', 0x26: 'd', 0x27: 'dh', 0x28: 'n', 0x29: 'n',
  0x2a: 'p', 0x2b: 'ph', 0x2c: 'b', 0x2d: 'bh', 0x2e: 'm', 0x2f: 'y', 0x30: 'r', 0x31: 'r', 0x32: 'l', 0x33: 'l', 0x34: 'zh',
  0x35: 'v', 0x36: 'sh', 0x37: 'sh', 0x38: 's', 0x39: 'h', 0x58: 'q', 0x59: 'kh', 0x5a: 'gh', 0x5b: 'z', 0x5c: 'r', 0x5d: 'rh', 0x5e: 'f', 0x5f: 'y' };
const S = { 0x3e: 'aa', 0x3f: 'i', 0x40: 'ii', 0x41: 'u', 0x42: 'uu', 0x43: 'ri', 0x44: 'rri', 0x46: 'e', 0x47: 'e', 0x48: 'ai', 0x4a: 'o', 0x4b: 'o', 0x4c: 'au', 0x57: 'au' };
const MOD = { 0x01: 'm', 0x02: 'm', 0x03: 'h', 0x50: 'om' };
const CHILLU = { 0x0d7a: 'n', 0x0d7b: 'n', 0x0d7c: 'r', 0x0d7d: 'l', 0x0d7e: 'l', 0x0d7f: 'k' };
const VIRAMA = 0x4d, NUKTA = 0x3c;

function info(cp) {
  if (CHILLU[cp]) return { type: 'chillu', v: CHILLU[cp] };
  for (const b of BLOCKS) if (cp >= b && cp < b + 128) {
    const o = cp - b;
    if (C[o]) return { type: 'c', v: C[o] };
    if (V[o]) return { type: 'v', v: V[o] };
    if (S[o]) return { type: 's', v: S[o] };
    if (o === VIRAMA) return { type: 'virama' };
    if (o === NUKTA) return { type: 'nukta' };
    if (MOD[o]) return { type: 'mod', v: MOD[o] };
    if (o >= 0x66 && o <= 0x6f) return { type: 'd', v: String(o - 0x66) };
    return { type: 'x' };
  }
  return null;
}

export const hasIndic = (s) => /[ऀ-ൿ]/.test(s);

export function toLatin(text) {
  let out = '';
  const cps = [...text].map((ch) => ch.codePointAt(0));
  for (let i = 0; i < cps.length; i++) {
    const a = info(cps[i]);
    if (!a) { out += String.fromCodePoint(cps[i]); continue; }
    if (a.type === 'c') {
      out += a.v;
      let j = i + 1; while (j < cps.length && info(cps[j])?.type === 'nukta') j++;
      const nx = j < cps.length ? info(cps[j]) : null;
      if (nx?.type === 'virama') i = j;
      else if (nx?.type === 's') { out += nx.v; i = j; }
      else { out += 'a'; i = j - 1; }
    } else if (a.type !== 'virama' && a.type !== 'nukta' && a.type !== 'x') out += a.v;
  }
  return out;
}

// Phonetic key: folds diacritics, aspirates, vowel length, v/w, doubled letters and
// the Dravidian neuter -am ending so "jwara", "ज्वर" and "జ్వరం" all compare equal.
export function key(s) {
  let t = String(s);
  if (hasIndic(t)) t = toLatin(t);
  t = t.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  return t.split(/[^a-z0-9]+/).filter(Boolean).map((w) => w
    .replace(/w/g, 'v').replace(/z/g, 'zh').replace(/x/g, 'ksh')
    .replace(/([kgcjtdpbsz])h/g, '$1')
    .replace(/ee|ii/g, 'i').replace(/oo|uu/g, 'u').replace(/aa/g, 'a')
    .replace(/ay(?=[^aeiou]|$)/g, 'ai')
    .replace(/m(?=[kgcjtdn])/g, 'n')
    .replace(/(.)\1+/g, '$1')
    .replace(/(.{3,})am$/, '$1a')).join(' ');
}

// Consonant skeleton for a low-scoring fuzzy fallback (handles schwa deletion: tulasi ~ tulsi).
export const skeleton = (k) => k.split(' ').map((w) => w[0] + w.slice(1).replace(/[aeiou]/g, '')).join(' ');

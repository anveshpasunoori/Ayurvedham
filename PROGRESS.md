# Ayurvedham encyclopedia — progress and continuation checklist

Last updated: 2026-11-24 · Branch: `encyclopedia-expansion`

This file is the single source of truth for what is done and what is not. A module is **done** only when it has no placeholders and its clinical content has passed qualified medical review. By that standard, **no clinical module is done yet**: the platform is built, but nearly all clinical content still awaits review.

## How to run

```
npm install            # dev-only: axe-core for accessibility tests
npm run serve          # then open http://localhost:8000/encyclopedia/
npm test               # data validation + unit tests
python3 tests/browser_test.py [--chrome /path/to/chrome] [--shots]
npm run migrate        # re-extract data/ from the legacy index.html
```

## Status legend
- [x] implemented and tested
- [~] implemented, content partial or unverified
- [ ] not started

## 1. Architecture and platform
- [x] Legacy `index.html` preserved unchanged as the production entry point (no URLs broken)
- [x] Legacy data extracted into versioned JSON (`tools/extract-legacy.mjs`, re-runnable)
- [x] Stable ids; hash routes `#/<module>/<id>`; legacy hashes (`#jwara`, `#library`, `#reading-evidence`, …) redirect
- [x] Modular ES-module app (`encyclopedia/js/`), no runtime dependencies, no build step
- [x] Lazy per-module data loading; search index built on first search
- [x] Zero-dependency validator: ids, cross-references, review gates, image metadata, safety cautions, duplicate hints
- [x] Unit tests (`tests/data.test.mjs`) and browser tests with axe-core WCAG 2 A/AA (`tests/browser_test.py`)
- [x] Service worker: offline shell and visited articles (tested)
- [x] Review fields on every clinical record: `review.status`, `reviewer`, `date`, `note`
- [ ] Content versioning beyond git history (per-record `changelog`)
- [ ] Generated sitemap / static pre-render for search engines
- [ ] CI workflow (GitHub Actions) running `npm test` and the browser suite
- [ ] Broken external-link checker (needs network access in CI)

## 2. User experience
- [x] Patient / Doctor / Student modes rendered from the same record
- [x] Global search: English, Sanskrit (IAST and Devanagari), regional names (276 synonyms), native-script input in Devanagari, Telugu, Tamil, Kannada and Malayalam via transliteration
- [x] A–Z index, text filter and category chips on every module index
- [x] Breadcrumbs, automatic table of contents, related articles, cross-links between modules
- [x] Bookmarks and recently viewed (on device)
- [x] Light / dark theme; print stylesheet for clinical reference
- [x] Responsive layout tested at 390 px and 1280 px
- [x] Safety notice on every page; red flags shown first in every article
- [ ] Interface translation (menus and labels) into Hindi, Telugu, Tamil, Malayalam, Kannada, Sanskrit
- [ ] Native-script names stored per record (`names.hi`, `names.te`, …) with a `verified` flag
- [ ] Image lightbox / gallery for multiple photos

## 3. Content modules

| Module | Records | Status | What is missing |
|---|---|---|---|
| Conditions | 55 | [~] legacy-unreviewed | Medical review; verified edition and verse locators; differential diagnosis (field shown as "not yet compiled"); regional names; investigations; prognosis |
| Medicinal plants | 59 | [~] legacy-unreviewed | API monograph locators; distribution; identification features; adulteration; research summaries; photos for 52 plants |
| Formulations | 255 | [~] legacy-unreviewed | 115 lack a classical locator; 61 are combined entries ("A / B") to split; full verified ingredient lists; AFI references; quality standards |
| Therapies | 16 | [~] editorial | Chapter locators unverified; illustrations; more classical therapies (Shirobasti, Tarpana, Putapaka, Kavala/Gandusha, Lepa, Upanaha, Pinda Sveda …) |
| Everyday ailments | 22 | [~] legacy-unreviewed | Medical review |
| Yoga & breathing | 26 | [~] editorial | Illustrations; verified editions of Hatha Yoga Pradipika locators |
| Eight branches | 8 | [~] editorial | Shalya, Kaumarabhritya, Agada, Bhuta Vidya, Rasayana and Vajikarana have minimal condition coverage |
| Classical library | 44 | [~] | Edition records (editor, publisher, year); chapter indexes |
| Dictionary | 55 | [~] editorial | Expand to full terminology; Sanskrit script; cross-links from articles |
| Centres | 13 | [~] informational | Verify current details |
| Student academy | — | [x] tools / [~] content | Quizzes and flashcards are generated from unreviewed data; case studies not started |
| Safety | — | [x] | — |
| Anatomy & physiology, Marma, Prakriti, diagnostics, nutrition & recipes, Dinacharya/Ritucharya, women's / paediatric / geriatric / mental health, toxicology | — | [ ] | Not started as dedicated modules (season data exists in `data/seasons.json`; legacy routine planner still lives in the original page) |

## 4. Images
- [x] Image registry `data/images.json`; validator requires species, author, licence, source URL and alt text
- [x] 7 Wikimedia Commons photographs (Ashwagandha, Brahmi, Guduchi, Haridra, Amalaki, Tulsi, Nimba) with licence confirmed from the file page
- [~] Identity is as described on Commons (`identification: "commons-description"`); botanist confirmation pending
- [ ] Remaining 52 plants. Workflow: find a Commons file showing the part used, confirm species, author and licence on the file page, add an entry to `data/images.json`, run `npm run migrate && npm test`
- [ ] Educational diagrams (Samprapti flow, Shat Kriyakala, Srotas map), clearly labelled as illustrations
- [ ] Self-hosted resized copies (currently served from Commons via `Special:FilePath`)

## 5. Medical accuracy work queue (needs a qualified reviewer)
1. Verify each condition's references against a named edition; record `edition` and set `verified: true` only then.
2. Check every recorded dose against the Ayurvedic Formulary of India / API and the cited classical text.
3. Split the 61 combined formulation entries and attach verified ingredients.
4. Write differential diagnosis and investigations for each condition.
5. Promote records to `reviewed` with reviewer name and date; the validator enforces both.
6. Review `data/condition-candidates.json` (acne, painful urination, hair loss) and `data/coverage.json` gaps before adding them.

## 6. Known limitations
- The original reference's interactive tools (find-my-treatment guide, daily routine planner, prakriti quiz) are not yet ported; they remain available in `index.html`.
- Photos load from Wikimedia Commons; if Commons is unreachable the page shows a link instead.
- Search keys fold spelling variants phonetically; rare false matches are possible.

## Next session: start here
1. Port the routine planner and prakriti quiz into an `encyclopedia/js/views/tools.js` module.
2. Add photographs for the next 15 plants by usage frequency (see `herbs[].conditions.length`).
3. Build the Ayurvedic anatomy/physiology module (Dosha, Dhatu, Srotas, Agni, Ama, Ojas, Prakriti) from `data/terms.json` plus new editorial records.
4. Add a GitHub Actions workflow for `npm test` and the browser suite.

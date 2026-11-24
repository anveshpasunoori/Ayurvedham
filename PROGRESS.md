# Ayurvedham encyclopedia — progress and continuation checklist

Last updated: 2026-11-24 · Branch: `encyclopedia-expansion`

This file is the single source of truth for what is done and what is not. A clinical module counts as **done** only when its content has passed qualified medical review. By that standard, **no clinical module is done yet**: the platform, tools and editorial content are built, but every clinical record still awaits a named BAMS/MD reviewer. Run `node tools/review-queue.mjs` for the current review inventory.

## How to run

```
npm install            # dev-only: axe-core for accessibility tests
npm run serve          # then open http://localhost:8000/encyclopedia/
npm test               # syntax check, data validation, all unit tests (encyclopedia, commerce, backend)
python3 tests/browser_test.py [--chrome /path/to/chrome] [--shots]
npm run migrate        # re-extract data/ from legacy index.html and rebuild data/topics.json
node tools/review-queue.mjs   # export unreviewed records, high-risk first
```

CI (`.github/workflows/validate.yml`) runs `npm test`, then the browser suite with axe-core.

Legend: [x] implemented and tested · [~] implemented, content draft or unverified · [ ] not started

## 1. Platform
- [x] Legacy `index.html` preserved unchanged; legacy hashes redirect into the new app
- [x] Versioned JSON datasets with stable ids; extractor is re-runnable; hand-curated files are never overwritten
- [x] Modular ES-module app, no runtime dependencies, no build step
- [x] Validator: ids, cross-references, review gates, image metadata, safety cautions, unsplit formulations, topic tables, differential coverage
- [x] Unit tests (28 in total across encyclopedia, commerce and backend) and browser tests (40+ routes at two viewports, multilingual search, modes, keyboard, bookmarks, theme, axe WCAG 2 A/AA, offline)
- [x] Service worker offline support
- [x] Review fields on every clinical record; dose, timing, anupana and duration withheld in all new views until review (enforced by a test)
- [ ] Per-record changelog beyond git history
- [ ] Static pre-rendering for search engines (hash routes are not indexed)

## 2. User experience
- [x] Patient / Doctor / Student modes from the same record
- [x] Global search: English, IAST, Devanagari, 276 regional synonyms, regional plant names, and native-script input in Devanagari, Telugu, Tamil, Kannada and Malayalam
- [x] Interface in English, Hindi, Telugu, Tamil, Malayalam, Kannada and Sanskrit, marked as not professionally verified; English safety notice always shown
- [x] A–Z indexes, filters, breadcrumbs, table of contents, related articles, cross-links, bookmarks, recents, dark/light theme, print stylesheet
- [x] Tools: symptom finder (warning signs first), constitution self-assessment, daily routine planner
- [~] Article text is English only; translated articles not started

## 3. Content

| Module | Records | Status | Remaining work |
|---|---|---|---|
| Conditions | 55 | [~] legacy-unreviewed | Medical review; verified edition/verse locators; regional names; prognosis |
| Differential diagnosis | 55 | [~] draft | Clinical review |
| Medicinal plants | 59 | [~] legacy-unreviewed | API monograph locators; distribution; identification features; adulteration; research |
| Plant photographs | 11 | [~] identity per Commons description | 48 plants without photos; botanist confirmation |
| Regional plant names | 30 plants × 5 languages | [~] draft | Native-speaker and Pharmacopoeia check; remaining 29 plants |
| Formulations | 265 | [~] legacy-unreviewed | 133 lack a classical locator; verified ingredient lists; AFI references |
| Therapies | 24 | [~] editorial | Edition-verified locators; illustrations |
| Learn articles | 37 | [~] editorial | Fundamentals, diagnosis, nutrition and recipes, lifestyle, women/pregnancy/postpartum/children/men/ageing/mental health, toxicology, research. Edition-verified locators; more diagrams |
| Everyday ailments | 22 | [~] legacy-unreviewed | Medical review |
| Yoga & breathing | 26 | [~] editorial | Illustrations |
| Eight branches | 8 | [~] editorial | Shalya, Kaumarabhritya, Agada, Bhuta Vidya, Rasayana, Vajikarana need more conditions |
| Classical library | 44 | [~] | Edition records and chapter indexes |
| Dictionary | 55 | [~] editorial | Expand terminology |
| Student academy | — | [x] tools / [~] content | Case studies; questions drawn from unreviewed data |

## 4. What cannot be completed by software alone
- **Medical review.** Every clinical record needs a named, qualified reviewer and date before `review.status` can become `reviewed`; the validator enforces this.
- **Edition-verified references.** Locators are chapter-level; verifying verse and page needs physical or licensed editions.
- **Professional translation** of the interface and future articles.
- **Botanical confirmation** of photographs and expansion to the remaining plants (workflow: add to `data/images.json`, run `npm run migrate && npm test`).
- **Legacy page audit.** The original `index.html` still shows recorded doses; decide whether to withhold them there too.

## 5. Next steps
1. Recruit reviewers; work through `tools/review-queue.mjs` output, high-risk formulations first.
2. Photographs for the next plants by usage (`herbs[].conditions.length`).
3. Expand Shalya, Kaumarabhritya, Agada and Rasayana condition coverage from `data/condition-candidates.json` and `data/coverage.json`.
4. Decide on the legacy page's dose display once the new app reaches feature parity, then retire it.

## Subsequent safety and commercial foundation work (parallel contributor)
- Withheld structured dosage, timing, anupana and duration in modular condition and formulation views. Legacy site and other narrative clinical text still require audit; this is not a complete publication gate.
- Added GitHub Actions unit/data validation workflow and included commerce tests in npm test.
- Added pure account ownership, tenant membership and verified directory projection policies with tests. Not wired to a deployed backend.
- No live payment or identity services configured.

## API integration increment (parallel contributor)
- Added read-only API handler, PostgreSQL repository adapter and HTTP server factory; trusted identity adapter and production database configuration remain pending.
- Added API and repository unit tests; they run in `npm test`.
- Added local editorial review queue exporter and workflow documentation. No medical records approved by automation.
- Payment signature verification helper and tests added; checkout remains disabled.

## Visual refinement increment
- Added homepage quick links, photo-led medicinal plant atlas using existing credited photos, full-size photo links, image error handling, responsive card grids and larger touch targets.
- Current registry contains 11 photographs; no new photograph identity or license was independently verified in this increment. Browser visual regression testing remains pending.

## Agriculture and trade integration
- Agriculture preview: six crop profiles, existing credited botanical photos, local farm economics calculator and resource links.
- Trade preview: six business roles, verified-only empty directory, local RFQ draft, proposed SQL schema and tests.
- Cross-links between encyclopedia, agriculture, trade and membership. No live listings, checkout or procurement transmission.
- Browser, SQL migration and CI results not independently verified. Medical and agronomic review, image expansion, identity provider and production deployment remain pending.

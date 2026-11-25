# Ayurvedham encyclopedia roadmap

Preserve the existing index.html application until replacement modules reach feature parity. Build incremental, reviewed datasets.

## Coverage
- Eight branches: Kayachikitsa, Shalya, Shalakya, Kaumarabhritya, Agada, Bhuta Vidya, Rasayana, Vajikarana.
- Cross-cutting: women's health, diagnostics, anatomy, physiology, nutrition, lifestyle, yoga, pharmacology, classical literature, research, safety.
- Inventory each chapter of Charaka, Sushruta, Ashtanga Hridaya, Ashtanga Sangraha, Kashyapa, Madhava Nidana, Sharangadhara, Bhavaprakasha, Bhaishajya Ratnavali, Chakradatta and Yogaratnakara; record edition and verse before publication.
- Use official Ayurvedic Pharmacopoeia and Formulary, NCISM curriculum and applicable clinical guidelines as coverage benchmarks.

## Publication gates
Each clinical entry requires a source locator, modern differential and red flags, separate traditional and clinical evidence, reviewer and review date. Do not infer modern disease equivalence. No unverified doses, invasive home procedures or claims of cure. Keep drafts outside public search until reviewed.
Images require species or procedure identification, author, source URL, license and alt text. Do not use generated images as botanical identification references.

## Architecture
Implemented (see PROGRESS.md for status):
- Legacy data extracted to `data/*.json` by `tools/extract-legacy.mjs`; hand-curated files (`branches`, `therapies`, `images`) sit beside them.
- `encyclopedia/` renders patient, doctor and student views from the same record; doses and Samprapti appear only in doctor/student views and are labelled unverified.
- Search folds English, IAST, Devanagari, regional synonyms and Indic-script input through one phonetic key (`js/translit.js`).
- `tools/validate.mjs` enforces publication gates; `tests/` covers data rules, routes, accessibility and offline use.

## Milestones
1. Inventory and schemas; audit existing content and fix unsafe mappings. (Platform done; content audit pending review.)
2. Expand reviewed condition and herb records; verify sources and images.
3. Formulary and procedure catalogs, cross-links and search.
4. Classical chapter index, nutrition and student modules.
5. Automated validation, browser accessibility testing and independent medical review.

Targets are planning goals, not claims of completeness. No draft is a prescription.

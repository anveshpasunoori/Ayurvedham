# Ayurvedham handover

Work on `encyclopedia-expansion`. Read `PROGRESS.md` first: it is the continuation checklist.

## Layout
- `index.html` — legacy single-file reference; still the production entry point. Do not edit its data without re-running `npm run migrate`.
- `data/*.json` — versioned datasets. Most are generated from `index.html` by `tools/extract-legacy.mjs`; `branches.json`, `therapies.json` and `images.json` are hand-curated and must never be overwritten by the extractor.
- `encyclopedia/` — modular app (ES modules, no build). Routes are `#/<module>/<id>`; `js/store.js` registers modules; `js/views/` holds one file per view family.
- `tools/validate.mjs` — run before every commit (`npm test`).
- `tests/` — unit tests (node:test) and browser tests (Playwright + axe-core).

## Rules
- Never invent doses, references, evidence or images. Unknown fields say so explicitly.
- A reference gets `verified: true` only with a recorded `edition`.
- A record becomes `reviewed` only with a named qualified reviewer and ISO date.
- Herbo-mineral and toxic-herb formulations must carry cautions and stay physician-only.
- Images need species, author, licence, source URL and alt text; generated images are never photographs.
- Distinguish traditional models from modern physiology and classical sources from clinical evidence.
- Keep the app dependency-free at runtime; dev dependencies only for tests.

Serve with `npm run serve` and open `/encyclopedia/`.

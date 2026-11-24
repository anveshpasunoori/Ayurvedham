# Editorial review queue
Run node tools/review-queue.mjs to export the current unreviewed record inventory. High-risk formulations are prioritized. This is a local editorial tool, not a public admin interface.
A qualified reviewer must check source edition and locator, modern evidence, contraindications, interactions, dose and special populations before changing review.status. Record reviewer and date. Never infer clinical approval from automated tests.
The API module is framework-neutral and tested with mock adapters; no real identity provider, database or checkout is configured.

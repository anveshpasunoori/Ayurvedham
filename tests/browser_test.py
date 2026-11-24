#!/usr/bin/env python3
"""Browser tests for the encyclopedia (Playwright + axe-core).

Usage:  npm install && python3 tests/browser_test.py [--chrome /path/to/chrome] [--shots]
Starts its own static server on a free port; exits non-zero on any failure.
"""
import argparse, functools, http.server, json, pathlib, socketserver, sys, threading
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
AXE = (ROOT / 'node_modules/axe-core/axe.min.js')
ROUTES = ['#/', '#/conditions', '#/conditions/jwara', '#/conditions/madhumeha', '#/herbs', '#/herbs/ashwagandha', '#/formulations',
          '#/formulations/jwaramurari-rasa', '#/therapies', '#/therapies/basti', '#/ailments', '#/ailments/cold', '#/yoga', '#/yoga/nadi',
          '#/branches', '#/branches/shalya', '#/texts', '#/texts/charaka-samhita', '#/dictionary', '#/dictionary/ojas', '#/centres',
          '#/centres/avs', '#/academy', '#/academy/quiz?topic=herbs', '#/academy/flashcards', '#/safety', '#/about', '#/saved', '#/nope/x', '#/learn', '#/learn/tridosha', '#/learn/ritucharya', '#/learn/pregnancy', '#/learn/snakebite', '#/tools', '#/tools/finder', '#/tools/prakriti', '#/tools/routine']
SEARCHES = {'ज्वर': 'Fever', 'జ్వరం': 'Fever', 'moolam': 'Piles', 'tulsi': 'Tulsi', 'ashwagandha': 'Ashwagandha', 'basti': 'Basti', 'ojas': 'Ojas', 'snake': 'Snakebite'}
AXE_PAGES = ['#/learn/shat-kriyakala', '#/tools/routine', '#/tools/prakriti', '#/', '#/conditions', '#/conditions/jwara', '#/herbs/haridra', '#/formulations/jwaramurari-rasa', '#/academy/quiz?topic=terms', '#/safety']

failures = []
def check(ok, msg):
    if not ok: failures.append(msg); print('FAIL', msg)

def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    handler = functools.partial(Quiet, directory=str(ROOT))
    srv = socketserver.TCPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f'http://127.0.0.1:{srv.server_address[1]}/encyclopedia/'

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--chrome'); ap.add_argument('--shots', action='store_true'); a = ap.parse_args()
    srv, base = serve()
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=a.chrome, args=['--no-sandbox']) if a.chrome else p.chromium.launch()
        for name, vp in [('desktop', dict(width=1280, height=900)), ('mobile', dict(width=390, height=844))]:
            ctx = browser.new_context(viewport=vp); pg = ctx.new_page(); errors = []
            pg.on('pageerror', lambda e: errors.append(str(e)))
            pg.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and errors.append(m.text))
            for r in ROUTES:
                pg.goto(base + r); pg.wait_for_selector('main h1', timeout=5000)
                text = pg.inner_text('main')
                check(not any(x in text for x in ['[object ', 'undefined', 'NaN']) and '\nnull' not in text, f'{name} {r}: stray JS value in text')
                check(not pg.evaluate('document.documentElement.scrollWidth > innerWidth + 1'), f'{name} {r}: horizontal overflow')
                if a.shots: pg.screenshot(path=str(ROOT / f'tests/screenshots/{name}-{r.strip("#/").replace("/", "_").replace("?", "_") or "home"}.png'))
            for q, want in SEARCHES.items():
                pg.goto(base + '#/search?q=' + q); pg.wait_for_selector('main h1')
                first = pg.locator('main .card b').first.text_content() if pg.locator('main .card').count() else ''
                check(want.lower() in first.lower(), f'{name} search {q!r}: first result {first!r}, wanted {want!r}')
            check(not errors, f'{name}: console/page errors {errors[:3]}')
            ctx.close()

        ctx = browser.new_context(viewport=dict(width=1280, height=900)); pg = ctx.new_page()
        # Legacy hashes from the original reference and prototype redirect to stable routes.
        for old, new in [('#jwara', '#/conditions/jwara'), ('#reading-evidence', '#/about'), ('#urgent-care', '#/safety'), ('#library', '#/texts')]:
            pg.goto(base + old); pg.wait_for_timeout(300); check(pg.url.endswith(new), f'legacy {old} -> {pg.url}')
        # Reading modes change content from the same record.
        pg.goto(base + '#/conditions/madhumeha'); pg.wait_for_selector('main h1')
        check(pg.locator('text=Formulations as recorded').count() == 0, 'patient mode should not show dose table')
        pg.select_option('#mode', 'doctor'); pg.wait_for_selector('#formulations-as-recorded'); check(pg.locator('main table').count() >= 2, 'doctor mode tables')
        pg.select_option('#mode', 'student'); pg.wait_for_selector('#self-test'); pg.select_option('#mode', 'patient')
        # Keyboard search: type, arrow down, enter.
        pg.fill('#q', 'ashwagandha'); pg.wait_for_selector('#suggest li'); pg.keyboard.press('ArrowDown'); pg.keyboard.press('Enter'); pg.wait_for_timeout(400)
        check('#/herbs/ashwagandha' in pg.url, f'keyboard search went to {pg.url}')
        # Bookmark persists to the saved page.
        pg.click('text=☆ Save'); pg.goto(base + '#/saved'); pg.wait_for_selector('main h1'); check(pg.locator('main .card', has_text='Ashwagandha').count() >= 1, 'saved bookmark listed')
        # Theme toggle.
        pg.click('#theme'); check(pg.evaluate('document.documentElement.dataset.theme') in ('dark', 'light'), 'theme toggle')
        # Accessibility (axe-core, WCAG 2 A/AA).
        if AXE.exists():
            for r in AXE_PAGES:
                pg.goto(base + r); pg.wait_for_selector('main h1'); pg.add_script_tag(path=str(AXE))
                res = pg.evaluate("async () => (await axe.run(document, {runOnly: ['wcag2a','wcag2aa']})).violations.map(v => v.id + ' x' + v.nodes.length + ': ' + v.nodes[0].target.join(' '))")
                check(not res, f'axe {r}: {res}')
        else: print('skip axe: run npm install first')
        # Offline: after one visit the service worker serves the shell and data.
        pg.goto(base + '#/conditions/kasa'); pg.wait_for_selector('main h1'); pg.wait_for_timeout(800); pg.reload(); pg.wait_for_selector('main h1'); pg.wait_for_timeout(500)
        ctx.set_offline(True); pg.reload(); pg.wait_for_selector('main h1', timeout=5000)
        check('Cough' in pg.inner_text('main h1') or 'Kasa' in pg.inner_text('main h1'), 'offline reload of a visited article')
        ctx.close(); browser.close()
    srv.shutdown()
    print(f'\n{len(failures)} failure(s)'); sys.exit(1 if failures else 0)

if __name__ == '__main__':
    main()

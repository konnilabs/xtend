# Maraca FastPass

Native RMT event bindings invoke navigation, focus and close without entering the business command queue. Build from the repository root with Node 24:

```sh
node xtend-builder/bin/xt maraca build demos/xtendrmt/maraca-fastpass/app.rmt --out .xtend-build/maraca/fastpass --orchestration strict --kernel strict --hydration auto --css external
node xtend-builder/bin/xt serve --root .xtend-build/maraca/fastpass
```

The browser composition supplies default navigation and focus ports. Applications can replace them in `bootXtendMaraca({ navigationAdapter, focusAdapter })`, for example to update a client router immediately while its content loads independently.

The root remains available after closing `panel`. Focus can return to `navigation`. Observe lightweight events through `XTendMaraca.subscribeEvents()` and explicitly request `XTendMaraca.snapshot()` for diagnostics. See the German/English FastPass and Abort Boundary API documentation under `docs/` for worker preparation and guarded commits.

Run the deterministic and native browser checks from the repository root:

```sh
node scripts/run_xtend_tests.js maraca-responsiveness rmt-kernel-scheduler
node tests/maraca/maraca_responsiveness_browser.mjs
```

The browser check uses the shared browser hypervisor, holds `loadReports` host responses and `updatePanel` hydration, and measures shell input to paint with full diagnostics on/off. Configure `XTEND_BROWSER_HYPERVISOR_URL` if using an external WebDriver. Results are written to `.xtend-test-results/maraca-responsiveness-browser.json`.

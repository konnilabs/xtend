# RMT-first Demo-App

Contract: `xtend.epic10.rmt-first-demo-app.v1`

The RMT-first Demo-App proves a shell-first XTend app that is authored from RMT vNext, rendered from committed Core records and hosted without manual shell markup.

## Runtime Evidence

- Authoring source: `xtendrmt/rmt-first-demo-app.rmt`
- Runtime parity core: `xtendrmt/rmt-first-demo-app.core.json`
- vNext core artifact: `xtendrmt/rmt-first-demo-app.vnext.core.json`
- Browser host: `tests/browser/fixtures/rmt-first-demo-app-smoke.html`
- Runtime module: `xtendrmt/rmt-first-demo-app.js`

The browser host provides only `data-rmt-host="rmt-first-demo"`. It loads `data-rmt-document-src="/xtendrmt/rmt-first-demo-app.core.json"` for runtime parity and `data-rmt-source-src="/xtendrmt/rmt-first-demo-app.rmt"` to prove the authoring source is vNext.

## Local Gate

```bash
node scripts/run_xtend_tests.js rmt-first-demo-app --json
```

The gate checks shell, routes, templates, schedules, Fabric lane metadata, XTend component records and the `sourceSyntax: "rmt-vnext"` runtime evidence.

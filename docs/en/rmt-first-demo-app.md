# RMT-first Demo App

A small sample app as orientation for your own hosts.

## What it covers

The demo shows the smallest complete path from an `.rmt` source through core records to a browser-ready app. It is a learning and regression fixture, not a finished product template.

## Public building blocks

- `xtendrmt/rmt-first-demo-app.rmt` is the editable source.
- `xtendrmt/rmt-first-demo-app.vnext.core.json` shows vNext compile output.
- `tests/browser/fixtures/rmt-first-demo-app-smoke.html` proves host materialization.

## Recommended workflow

Change the RMT source first, compile again, and inspect the core diff. Then open the browser fixture and verify content, event flow, and cleanup; never edit generated JSON as the primary source.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Run the demo gate

```bash
node scripts/run_xtend_tests.js rmt-first-demo-app --json
```

A passing run proves source, core model, loader-free host shell, and browser smoke for the same demo. Inspect `xtendrmt/rmt-first-demo-app.rmt` first when output drifts.

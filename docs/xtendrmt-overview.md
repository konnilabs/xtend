# XTendRMT Developer Overview

- Status: aktuell nach Epic 05 Abschluss
- Contract: `xtend.docs.xtendrmt-overview.v1`
- Produktversion: `XTendRMT 0.2.0`
- Kernartefakte:
  - `xtendrmt/rmt-core.esm.js`
  - `xtendrmt/rmt-runtime.esm.js`
  - `xtendrmt/rmt-runtime.browser.js`
  - `xtendrmt/rmt-core.d.ts`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-manifest.json`

## Zielbild

XTendRMT verbindet zwei Produkte, ohne ihre Grenzen zu verwischen:

| Produkt | Rolle |
|---------|-------|
| XTend UI | UI Builder und Web-Component-System |
| XTendRMT | Scheduler, Runtime Kernel und Templating Engine |

XTend ist First-Class Host fuer RMT, aber keine Pflichtabhaengigkeit des RMT Kernels. RMT kann XTend Components, XRouter Routes und Scheduler Policies beschreiben und ausfuehren lassen, ohne XTend, XRouter, DOM oder `xstate` in den Kernel einzubetten.

## Aktueller Implementierungsstand

Epic 05 ist abgeschlossen. Der produktive Pfad besteht aus:

- nativen `.rmt` Top-Level-Domains: `adapters`, `components`, `routes`, `schedules`, `templates`
- Runtime Registry fuer Route- und Component-Indizes
- XRouter Adapter `createRmtXRouterAdapter`
- XTend Component Adapter `createRmtXtendComponentAdapter`
- State-/Scheduler-/Diagnostics Bridge `createRmtStateSchedulerDiagnosticsBridge`
- ESM- und Browser-Bundles mit Artefakt-Paritaetsgate
- Browser-Smoke fuer RMT/XRouter/XTend/Vanilla

Die wichtigsten Regressionen liegen in:

- `tests/fixtures/rmt-app-dsl.native-bridge.rmt`
- `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html`
- `xtendrmt/xtendrmt-bestcase-demo.rmt`
- `xtendrmt-bestcase.html`

## Architekturgrenze

RMT darf:

- `.rmt` Dokumente normalisieren
- DSL-Domains indizieren
- Adapter Records validieren
- Scheduler Policies beschreiben
- Diagnostics und Reference Graphs erzeugen

RMT darf nicht:

- `components/xrouter.js` importieren
- XTend Components importieren
- `window.XTend` voraussetzen
- `xstate` direkt schreiben
- DOM-Mounting im Kernel ausfuehren
- React, Vue, Vanilla oder Custom Hosts auf XTend migrieren

Host-Arbeit gehoert in Adapter. Das ist der Kern der First-Class-Citizen-Strategie: XTend bekommt hochwertige Adapter, aber der Kernel bleibt framework-agnostisch.

## Offizielle Entwicklerdokumente

| Thema | Dokument |
|-------|----------|
| Native Authoring | [XTendRMT Native Authoring Guide](./xtendrmt-native-authoring.md) |
| Native App-DSL Referenz | [XTendRMT App-DSL Reference](./xtendrmt-app-dsl.md) |
| Runtime Bridge und Adapter | [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md) |
| Migration aus alten Metadatenpfaden | [XTendRMT Native Migration Guide](./xtendrmt-migration-guide.md) |
| Docs-App / Parsedown Scheduling | [XTendRMT Parsedown Scheduling Pilot](./xtendrmt-parsedown-scheduling.md) |

## Empfohlener lokaler Gate

```bash
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js browser --json
node scripts/verify_xtendrmt_artifact_parity.js --json
npm test
```

`references` prueft die offizielle Entwicklerdokumentation, `rmt-compatibility` prueft DSL, Adapter, Bridge und Artefakt-Paritaet, `browser` prueft den browsernahen Multi-Host-Pfad.

## Entwicklungsregel

Neue RMT-nahe Arbeit soll zuerst klaeren, ob sie Kernel-, DSL-, Adapter-, Host- oder Dokumentationsverantwortung ist. Wenn XTend-spezifisches Verhalten benoetigt wird, entsteht ein Adapter- oder Host-Contract, kein Kernel-Sonderfall.

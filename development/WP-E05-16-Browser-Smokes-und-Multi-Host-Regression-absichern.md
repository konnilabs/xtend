# WP-E05-16 - Browser-Smokes und Multi-Host-Regression absichern

- Status: `completed`
- Datum: 5. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md`
  - `development/WP-E05-11-XTend-Component-Adapter-produktfaehig-implementieren.md`
  - `development/WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md`
  - `development/WP-E05-14-Bestcase-Demo-auf-native-Routes-und-Components-migrieren.md`
  - `development/WP-E05-15-Contract-Schema-und-Runtime-Tests-erweitern.md`
  - `tests/browser/browser_smoke_suite.js`
  - `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `xtendrmt-bestcase.html`

## Ziel

`WP-16` hebt die in `WP-15` deterministisch abgesicherten Adapter- und Bridge-Contracts in einen browsernahen Joint Flow. Der neue Smoke prueft RMT Runtime, native RMT Routes, XRouter, XTend Components, Scheduler Endpoint Signale und einen nicht-XTend Host-Pfad gemeinsam.

Die Leitplanke bleibt:

- RMT normalisiert und indiziert native Domains
- XRouter rendert native Routes nur ueber den Router Adapter
- XTend Components werden nur ueber den Component Adapter gemountet und hydriert
- Scheduler Endpoints werden ueber die State-/Scheduler-/Diagnostics-Bridge beobachtet
- Framework-Agnostik wird durch einen Vanilla Custom-Element Host belegt

## Browser-Smoke-Fixture

Die neue Fixture `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html` traegt das Contract-Metadatum:

```text
xtend.rmt.wp16.browser-smoke-fixture.v1
```

Die Fixture laedt repo-lokale Artefakte:

- `xtendrmt/rmt-runtime.browser.js`
- `components/xstate.js`
- `components/xrouter.js`
- `components/xsection.js`
- `components/xcards.js`

Sie exposes ihr Ergebnis unter:

```text
window.__xtendRmtBrowserSmokeResult
```

Der Smoke fuehrt drei native Routes aus:

- `/` mit `x-section`
- `/settings` mit `x-card`
- `/vanilla` mit `vanilla-panel`

## Joint Flow

Der Browser-Smoke prueft:

- `createRmtFormat` normalisiert das native `.rmt` Dokument
- `createRuntimeRegistries` erzeugt Route- und Component-Registries
- `createRmtXRouterAdapter` registriert native Routes in einem echten `<x-router>`
- `createRmtXtendComponentAdapter` mountet und hydriert echte XTend Custom Elements
- `createRmtStateSchedulerDiagnosticsBridge` spiegelt Adapter Results nach `xstate`
- Scheduler Calls fuer `xtendrmt.route.render`, `xtendrmt.component.hydrate` und `xtendrmt.vanilla.mount` werden aufgezeichnet
- ein Vanilla Host Adapter mountet `vanilla-panel` ohne XTend-Sonderpfad

Damit wird der Bestcase-Produktpfad browsernah sichtbar: RMT orchestriert, XRouter navigiert, XTend rendert und ein nicht-XTend Host bleibt gleichberechtigter Adapter-Konsument.

## Multi-Host-Regression

Der Vanilla-Pfad ist bewusst klein, aber fachlich entscheidend. Er zeigt, dass die native RMT Component Domain nicht auf XTend festgeschrieben ist.

Der Smoke verwendet dafuer:

- Adapter-ID `vanilla.component`
- Component `vanilla-panel`
- Schedule Policy `vanilla.visible.mount`
- Scheduler Endpoint `xtendrmt.vanilla.mount`

Dieser Pfad darf keine XTend-Manifeste, keine XTend Hydration Marker und keine XRouter-Sonderlogik benoetigen. Er prueft nur dieselben generischen RMT Registry-, Adapter-Result- und Scheduler-Bridge-Konzepte wie der XTend-Pfad.

## Bestcase-Anschluss

`xtendrmt-bestcase.html` referenziert die Fixture ueber:

```html
<meta name="xtendrmt-browser-smoke" content="tests/browser/fixtures/rmt-xrouter-xtend-smoke.html">
```

Der Demo-Router traegt ausserdem:

```html
data-rmt-browser-smoke="wp-16"
```

Damit ist die Bestcase-Demo als Produktreferenz mit dem browsernahen Smoke-Gate verbunden, ohne Demo-Code zur Test-Source-of-Truth zu machen.

## Test- und Referenzgates

Aktualisiert wurden:

- `tests/browser/browser_smoke_suite.js`
- `tests/browser/README.md`
- `tests/rmt/rmt_compatibility_suite.js`
- `tests/rmt/README.md`
- `tests/README.md`
- `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
- `tests/references/reference_path_suite.js`

Der Browser-Harness prueft die Fixture statisch im Default-Gate und kann sie mit einem installierten Browser-Treiber browsernah ausfuehren.

Optionaler Safari-Lauf:

```bash
XTEND_BROWSER_SMOKE_DRIVER=safari node scripts/run_xtend_tests.js browser
```

## Kernel Boundary

`WP-16` fuehrt keine neue Kernel-Kopplung ein.

Der RMT Kernel sieht weiterhin nur:

- native `adapters`
- native `components`
- native `routes`
- native `schedules`
- Adapter Results
- Scheduler Endpoint Policies

Die Host-Arbeit bleibt ausserhalb des Kernels:

- DOM-Operationen
- Custom Element Registration
- XRouter Navigation
- XTend Hydration
- `xstate` Spiegelung
- Vanilla Host Mounting

## Verifikation

Mindestgates:

```bash
node --check tests/browser/browser_smoke_suite.js
node --check tests/rmt/rmt_compatibility_suite.js
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js browser --json
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-16` ist abgeschlossen. Die produktive XTendRMT Bridge ist nun nicht nur schema-, registry- und bundle-nah abgesichert, sondern auch als browsernaher RMT/XRouter/XTend/Vanilla Joint Flow sichtbar. `WP-17` kann die Authoring- und Migrationsdokumentation auf diesen getesteten Browser-Smoke-Pfad setzen; `WP-18` bleibt bis zum Abschluss von `WP-17` geblockt.

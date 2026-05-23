# XTend RMT-first Demo-App

Contract: `xtend.epic10.rmt-first-demo-app.v1`

Status: `accepted-demo`

Workpackage: `WP-E10-13`

## Ziel

Die Demo-App beweist den produktiven Epic-10-Pfad: XTend liefert lokale Web Components, RMT liefert Shell, Routes, Templates, Schedules und Metadaten. Der Host stellt nur einen Root und lokale Runtime-Artefakte bereit; es gibt keine manuelle App-Shell und keine CDN-Abhaengigkeit.

## Artefakte

- RMT App Document: `xtendrmt/rmt-first-demo-app.rmt`
- Demo Host / Browser Smoke: `tests/browser/fixtures/rmt-first-demo-app-smoke.html`
- Demo Runtime: `xtendrmt/rmt-first-demo-app.js`
- Gate: `tests/rmt/rmt_first_demo_app_suite.js`
- Developer Docs: `docs/rmt-first-demo-app.md`

## Architekturentscheidung

Die Shell ist ein `dom_descriptor` Template in `app.shell.template`. Der Host enthaelt nur:

- einen generischen `data-rmt-host="rmt-first-demo"` Root
- `xtendrmt/rmt-runtime.browser.js`
- den lokalen `xtend-loader.js` mit `components/manifest.json`
- den Import von `xtendrmt/rmt-first-demo-app.js`

Die Runtime rendert das RMT-Dokument generisch ueber `renderRmtShellFromDocument` und `renderDomDescriptor`. Komponenten werden aus Records erzeugt, Attribute/Props/Slots/Events werden aus dem RMT-Dokument uebernommen, und Routen werden als `x-route` Eintraege aus `routes` abgeleitet.

## No-Manual-Shell-Regel

Die Demo ist nur akzeptiert, wenn:

- `tests/browser/fixtures/rmt-first-demo-app-smoke.html` keine statischen `x-section` oder `x-router` Shell-Elemente enthaelt
- `xtendrmt/rmt-first-demo-app.js` keine `innerHTML`-Materialisierung nutzt
- `manifest.metadata.manualShellAllowed` auf `false` steht
- `manifest.metadata.hostShellMarkup` auf `false` steht
- der Browser-Smoke die Shell aus dem `.rmt` Dokument rendert

Damit bleibt der Demo-Pfad ein belastbarer Vorgriff auf vollstaendig in RMT templated XTend Apps.

## RMT Domains

Die Demo nutzt diese Adapter:

- `xtend.component`
- `xtend.xrouter`
- `rmt.state-scheduler-diagnostics`
- `xtend.fabric-telemetry`

Die Demo nutzt diese Routen:

- `dashboard` unter `/`
- `settings` unter `/settings`
- `overlays` unter `/overlays`

Die Demo nutzt diese Schedule-Gruppen:

- Shell Render: `app.shell.render`
- Route Render: `route.visible.render`, `route.transition.render`
- Component Mount/Hydration: `component.visible.mount`, `component.idle.hydrate`
- User Input: `ui.user-blocking.input`
- Overlay Mount/Hydration: `overlay.visible.mount`, `overlay.idle.hydrate`
- Diagnostics: `diagnostics.snapshot`

## Komponentenabdeckung

Neben `x-section`, `x-router`, `x-link` und `x-form` nutzt die Demo alle neuen P0-Komponenten aus Epic 10:

- `x-select`
- `x-checkbox`
- `x-radio`
- `x-textarea`
- `x-status`
- `x-progress`
- `x-tooltip`
- `x-popover`
- `x-drawer`

## Kernel Boundary

RMT besitzt Records, Routes, Templates, Schedules und Metadaten. XTend-Komponenten, Fabric-Ausfuehrung, Manifest Lookup, DOM-Materialisierung und XRouter-Registration bleiben ausserhalb des RMT-Kernels in Host-Adaptern.

Boundary: `no-rmt-kernel-import-of-xtend-types`

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js rmt-first-demo-app --json
```

Der Gate prueft:

- RMT Dokumentstruktur und Referenzauflösung
- Runtime-Registry-Normalisierung
- No-Manual-Shell-Regel
- Browser-Smoke-Contract
- Package-Metadata
- Epic-, Backlog-, Docs- und Referenzpfade

## Handoff

`WP-E10-14` kann auf dieser Demo aufsetzen, um bestehende priorisierte Komponenten mit RMT/Fabric Metadata nachzuziehen. Die Demo sollte dabei als Abnahme-Host erhalten bleiben: neue Metadata- oder Adapter-Erweiterungen muessen in dieser Shell sichtbar und testbar bleiben.

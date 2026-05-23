# RMT-first Demo-App

Contract: `xtend.epic10.rmt-first-demo-app.v1`

Die RMT-first Demo-App zeigt den Zielpfad fuer Epic 10: Eine XTend App wird nicht mehr als manuelle HTML-Shell gebaut, sondern aus einem `.rmt` App-Dokument gerendert. XTend liefert lokale Web Components. RMT liefert Shell, Routes, Templates, Schedules, Fabric/Lane Metadata und Diagnostics.

## Startpunkt

- Demo / Browser Smoke: `tests/browser/fixtures/rmt-first-demo-app-smoke.html`
- RMT Document: `xtendrmt/rmt-first-demo-app.rmt`
- Runtime: `xtendrmt/rmt-first-demo-app.js`
- Browser Smoke: `tests/browser/fixtures/rmt-first-demo-app-smoke.html`

Die Hostseite enthaelt nur den RMT Root:

```html
<div
  id="rmt-first-demo-root"
  data-rmt-host="rmt-first-demo"
  data-rmt-document-src="xtendrmt/rmt-first-demo-app.rmt"></div>
```

Die Shell selbst kommt aus `app.shell.template`.

## Was RMT besitzt

- App Shell
- Routes
- `dom_descriptor` Templates
- Component Records
- Props, Attribute, Slots und Event Commands
- Schedules und Lanes
- Fabric/Fiber Metadata
- Diagnostics

## Was XTend besitzt

- Custom Elements
- Manifest Lookup
- Component Lifecycle
- DOM-Ausfuehrung
- XRouter-Registrierung
- Fabric-Ausfuehrung und Telemetry Hooks

Der RMT-Kernel importiert keine XTend-Komponenten. Diese Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Demo-Routen

| Route | Pfad | Inhalt |
|-------|------|--------|
| `dashboard` | `/` | Shell-first Status und Performance Coverage |
| `settings` | `/settings` | Form Controls mit `x-select`, `x-checkbox`, `x-radio`, `x-textarea` |
| `overlays` | `/overlays` | `x-tooltip`, `x-popover`, `x-drawer` |

## No-Manual-Shell-Regel

Die Demo gilt nur als korrekt, wenn:

- der Host keine statischen `x-section` oder `x-router` Shell-Tags enthaelt
- die Runtime kein `innerHTML` nutzt
- `manifest.metadata.manualShellAllowed` auf `false` steht
- `manifest.metadata.hostShellMarkup` auf `false` steht
- der Browser-Smoke die Shell aus RMT rendert

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js rmt-first-demo-app --json
```

Der Gate prueft RMT-Referenzen, Runtime-Registry-Normalisierung, Host-Boundary, Browser-Smoke, Package-Metadata und die Dokumentationspfade.

## Weiterfuehrung

`WP-E10-14` migriert bestehende priorisierte Komponenten in dieselbe RMT/Fabric-Metadata-Linie. Die Demo-App bleibt dafuer der erste produktive Abnahme-Host.

Seit `WP-E13-09` ist die Demo-App Teil von [RMT Production Readiness](./rmt-production-readiness.md). Der Contract `xtend.epic13.rmt-production-readiness.v1` nutzt sie als shell-first Evidence fuer Routing, Components, Fabric/Lane, Lifecycle Telemetry und Diagnostics.

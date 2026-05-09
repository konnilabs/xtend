# WP-E11-14 Browsernahe UX- und Kompatibilitaets-Smokes erweitern

Status: `completed`

Epic: `EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife`

## Ziel

Die Component-UX-Arbeit aus `WP-E11-08` bis `WP-E11-13` wird in einen browsernahen Smoke-Gate ueberfuehrt. Der Gate prueft nicht nur Contract-Metadaten, sondern verifiziert representative User Journeys mit produktiven XTend-Komponenten, lokalem Loader und lokalem Manifest.

## Umgesetzte Artefakte

- `tests/browser/component-ux-browser-smoke-plan.js`
- `tests/browser/component_ux_browser_smoke_suite.js`
- `tests/browser/fixtures/epic11-ux-compatibility-smoke.html`
- `tests/browser/fixtures/components/manifest.json`
- `development/XTend-Epic11-Browsernahe-UX-Smoke-Matrix.md`

## Umsetzung

- Die Smoke-Matrix definiert fuenf Journeys: `form-validation-journey`, `feedback-status-journey`, `navigation-routing-journey`, `overlay-focus-journey` und `layout-display-media-journey`.
- Die HTML-Fixture laedt `xtend-loader.js` als lokales ES-Modul und nutzt `tests/browser/fixtures/components/manifest.json`.
- Die Fixture schreibt ihr Ergebnis in `window.__xtendEpic11UxSmokeResult`.
- Der zentrale Browser-Harness kennt die neue Fixture und kann sie optional ueber `XTEND_BROWSER_SMOKE_DRIVER=safari` ausfuehren.
- Der neue lokale Gate ist ueber `node scripts/run_xtend_tests.js component-ux-browser-smokes --json` und `npm run test:component-ux-browser-smokes` erreichbar.

## Akzeptanzkriterien

- `xtend.epic11.component-ux-browser-smokes.v1` ist als stabiler Contract dokumentiert.
- Alle fuenf Epic-11-UX-Familien sind mindestens mit einem browsernahen Journey vertreten.
- Die Fixture enthaelt keine CDN-Referenzen und keine Importmap.
- Das lokale Manifest enthaelt alle fuer die Fixture benoetigten Komponenten.
- Browser-Harness, Test-Runner, Package-Metadaten, Scaffold-Konfiguration und Referenzdokumentation zeigen auf dieselben Pfade.
- `WP-E11-14` ist abgeschlossen und `WP-E11-15` ist inzwischen als naechstes Paket umgesetzt.

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js component-ux-browser-smokes --json
```

## Handoff

`WP-E11-15` kann nun die Visual Regression und Theme Matrix aufbauen. Die Matrix sollte die in diesem Paket definierten Journeys als Baseline uebernehmen und pro Theme, Motion Policy, Density und Viewport pruefbar machen.

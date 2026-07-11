# WP-E18-03 - Bugfix Contract- und Browser-Smokes bauen

- Status: `completed`
- Datum: 2026-05-19
- Epic Docs: `development/docs-evidence/root/epic18-media-manager-vendor-upstream.md`
- Backlog: `development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md`
- Depends on: `WP-E18-02`
- WP Contract: `xtend.epic18.wp03.vendor-bugfix-regression-smokes.v1`
- Test Contract: `xtend.epic18.vendor-component-bugfix-smokes.v1`
- Browser Fixture Contract: `xtend.epic18.vendor-component-bugfix.browser-smoke.v1`
- Zielzustand: `vendor-bugfix-regressions-gated`
- Boundary: `no-media-manager-product-surface-clone`
- Boundary: `local-browser-smokes-no-cdn`
- Lokale Gates:
  - `node scripts/run_xtend_tests.js epic18-vendor-bugfix-smokes --json`
  - `node scripts/run_xtend_tests.js browser --json`
  - `node scripts/run_xtend_tests.js components surface-controller surface-manager-browser overlay-interaction-ux layout-display-media-ux epic18-vendor-bugfix-smokes browser references --json`

## Ziel

`WP-E18-03` schuetzt die fuenf Backports aus `WP-E18-02` durch gezielte
Contract- und browsernahe Regression-Smokes. Die Tests beschreiben keine
Media-Manager-Produktoberflaeche, sondern generische XTend-Komponenten-
Garantien fuer App-Shells, Surfaces, Overlays und Media-Komponenten.

## Artefakte

| Datei | Zweck |
|-------|-------|
| `tests/components/epic18_vendor_bugfix_smoke_suite.js` | neuer Runner-Gate `epic18-vendor-bugfix-smokes` fuer die fuenf Vendor-Backports |
| `tests/browser/fixtures/epic18-vendor-bugfix-smoke.html` | browsernahe Fixture fuer Tooltip, XPlayer, SurfaceWindow, SidePanel und Surface Controller |
| `tests/browser/browser_smoke_suite.js` | bindet die Epic-18-Fixture in den bestehenden Browser-Harness ein |
| `scripts/run_xtend_tests.js` | registriert `epic18-vendor-bugfix-smokes` als XTend-Test-Suite |

## Abgedeckte Regressionen

| Bereich | Regression Gate |
|---------|-----------------|
| `x-tooltip` | `viewportFixedLayer`, `position: fixed`, RAF-Positionierung und Scroll/Resize-Repositionierung |
| `x-player` | idempotenter ESM-Reimport, ResizeObserver, Containment, lange Titel, native `play`/`pause` Events mit `source: "media-event"` |
| `x-surface-window` | `.content` nutzt `overflow-y: auto` und blockiert horizontale Surface-Scrollbars |
| `x-side-panel` | `.content` blockiert horizontale Scrollbars; Collapse-Icon folgt `placement` und `collapsed` |
| `xsurfacemanager-controller` | Re-Register bewahrt Bounds, Previous Bounds, Status, Active, Z-Order, Maximized, Pinned, Collapsed, Placement und Mode |

## Gate-Ergebnisse

| Gate | Ergebnis |
|------|----------|
| `epic18-vendor-bugfix-smokes` | `passed`, 76 Assertions, 0 Failures, 0 Warnings |
| `browser` | `passed`, 453 Assertions, 0 Failures, 0 Warnings |
| Bugfix-Gate-Kette | `passed`, 8/8 Suites, 11904 Assertions, 0 Failures, 0 Warnings |

Hinweis: Der Browser-Harness bindet fuer den lokalen Dev-Server an
`127.0.0.1`. Innerhalb der Sandbox wurde dieser Bind mit `EPERM` blockiert; der
gleiche Gate lief ausserhalb der Sandbox erfolgreich.

## Nicht-Scope

- keine Playwright-/Safari-Pflicht im Standard-Gate
- keine Produkt-Surface-Namen oder Media-Manager-Records als Framework-Default
- keine externen Netzwerke, CDNs oder produktlokalen HTML-Renderer
- keine neuen RMT-App-Platform-Features; diese starten mit `WP-E18-04`

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Tests schlagen ohne die fuenf Backports reproduzierbar an | erfuellt |
| Browsernahe Fixture ist im bestehenden Browser-Harness eingebunden | erfuellt |
| Lokale Smokes bleiben CDN- und netzwerkfrei | erfuellt |
| Bugfix-Welle hat einen eigenen Runner-Gate | erfuellt |
| `WP-E18-04` kann den RMT-App-Platform-Slice starten | erfuellt |

## Handoff

`WP-E18-03` ist abgeschlossen. Der konkrete Vendor-Bugfix-Stream ist damit
durch Backport-Paritaet und Regression-Smokes abgesichert. Als naechstes kann
`WP-E18-04` die generischen RMT App Platform Authoring-Primitives vorbereiten.

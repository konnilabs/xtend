# XTend Epic 13 Package Export Lock Contract

- Contract: `xtend.epic13.package-export-lock.v1`
- Report: `xtend.epic13.package-export-lock-report.v1`
- Surface Snapshot: `xtend.epic13.package-export-surface.v1`
- Dry-Run Artifact: `xtend.epic13.package-dry-run-artifact.v1`
- Workpackage: `WP-E13-04`
- Status: Accepted
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-package-export-lock --json`
- Capture Script: `npm run pack:dry-run:report`
- Publish Boundary: `private-until-release-owner-acceptance`

## Zweck

`WP-E13-04` schliesst die RC1-Luecke, dass `npm run pack:dry-run` bisher nur als manueller Textlauf existierte. Der Contract trennt deshalb drei Ebenen:

| Ebene | Zweck |
|-------|-------|
| Static Lock Gate | prueft `package.json#exports`, `files`, Package Roots und Surface Groups ohne `npm pack` auszufuehren |
| Dry-Run Capture | fuehrt `npm pack --dry-run --json` mit lokalem Cache aus und schreibt ein Release-Artefakt |
| Surface Snapshot | friert Loader, Components, Fabric, XTendRMT, Builder, Docs, Security und Catalog als RC1-Package-Oberflaeche ein |

## Artefakte

| Artefakt | Bedeutung |
|----------|-----------|
| `.xtend-test-results/xtend-pack-dry-run.json` | rohe JSON-Ausgabe von `npm pack --dry-run --json` |
| `.xtend-test-results/xtend-package-export-surface-lock.json` | maschinenlesbarer Export-/Files-Snapshot |
| `.xtend-test-results/xtend-package-export-lock-report.json` | validierter RC1-Report fuer den Release Owner |

## Export Surface

Der Lock erwartet 121 Package-Exports inklusive `./design-tokens/xtheme-token-alias-layer`, `./catalog/epic13-known-residual-triage`, `./catalog/epic13-hydration-performance-closure`, `./catalog/epic13-prod-browser-csp-smoke`, `./catalog/epic13-visual-owner-artifact`, `./catalog/epic13-rmt-production-readiness`, `./catalog/epic13-docs-rmt-production-hardening`, `./catalog/epic13-trusted-dom-boundary`, `./catalog/epic13-rc1-migration-notes`, `./catalog/epic13-rc1-gate-matrix-ci-handoff`, `./catalog/epic13-release-report-pack-dry-run-evidence`, `./catalog/epic13-conditional-network-evidence-ci`, `./rmt-language/kernel-trust-authority`, `./rmt-language/kernel-security-regression`, `./rmt-language/app-platform-tooling`, `./catalog/epic14-rmt-tooling`, `./catalog/epic14-lsp-handoff` und der RMT-Tooling-Surface unter `./rmt-language/*`, `./rmt-language-server`, `./rmt-linter/*` und `./rmt-editor/vscode`. Neue Public Exports muessen bewusst in `catalog/epic13-package-export-lock.js`, `package.json`, Changelog, README und Docs nachgezogen werden. Dadurch werden zufaellige Surface-Drifts vor RC1 sichtbar.

Maschinenlesbarer Status: expectedExportCount: `121`.

Die Surface Groups sind:

- Loader
- Components
- Fabric
- XTendRMT
- Builder
- Docs
- Security
- Catalog

## Lokale Gate-Regel

Der lokale Gate `node scripts/run_xtend_tests.js epic13-package-export-lock --json` fuehrt kein `npm pack` aus. Er prueft den statischen Lock und bleibt damit schnell und cache-unabhaengig. Fuer Release Owner Evidence wird zusaetzlich ausgefuehrt:

```bash
npm run pack:dry-run:report
```

Das Capture Script nutzt einen lokalen npm Cache unter `.xtend-test-results/npm-cache`, damit root-owned globale npm Caches den RC1-Lauf nicht blockieren.

## Handoff

`WP-E13-04` ist abgeschlossen. `WP-E13-05` hat `xtend.epic13.known-residual-triage.v1` nachgezogen; `WP-E13-06` hat `xtend.epic13.hydration-performance-closure.v1` abgeschlossen; `WP-E13-07` hat `xtend.epic13.prod-browser-csp-smoke.v1` vorbereitet; `WP-E13-08` hat `xtend.epic13.visual-owner-artifact.v1` und `./catalog/epic13-visual-owner-artifact` nachgezogen. `WP-E13-09` hat `xtend.epic13.rmt-production-readiness.v1` und `./catalog/epic13-rmt-production-readiness` nachgezogen. `WP-E13-10` hat `xtend.epic13.docs-rmt-production-hardening.v1` und `./catalog/epic13-docs-rmt-production-hardening` nachgezogen. `WP-E13-11` hat `xtend.epic13.trusted-dom-boundary.v1` und `./catalog/epic13-trusted-dom-boundary` nachgezogen. `WP-E13-12` hat `xtend.epic13.rc1-migration-notes-semver.v1` und `./catalog/epic13-rc1-migration-notes` nachgezogen. `WP-E13-13` hat `xtend.epic13.rc1-gate-matrix-ci-handoff.v1` nachgezogen; `DPF-WP-02` hat `xtend.epic13.release-report-pack-dry-run-evidence.v1` und `./catalog/epic13-release-report-pack-dry-run-evidence` nachgezogen; `DPF-WP-03` hat `xtend.epic13.conditional-network-evidence-ci.v1` und `./catalog/epic13-conditional-network-evidence-ci` nachgezogen.

# Package Export Lock

- Contract: `xtend.epic13.package-export-lock.v1`
- Report: `xtend.epic13.package-export-lock-report.v1`
- Surface: `xtend.epic13.package-export-surface.v1`
- Dry-Run Artifact: `xtend.epic13.package-dry-run-artifact.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-package-export-lock --json`

Der Package Export Lock macht den RC1-Paketinhalt pruefbar. Der lokale Gate validiert `package.json#exports`, `files`, die erwarteten Package Roots und die Surface Groups ohne `npm pack` auszufuehren.

## Surface Groups

| Gruppe | Zweck |
|--------|-------|
| Loader | `xtend-loader.js`, Legacy Stub, API, CSS und Manifest |
| Components | Manifest und Component-Dateien |
| Fabric | Fabric Runtime, RMT Lane Mapping und Hydration Policy |
| XTendRMT | ESM- und Browser-Runtime |
| Builder | Scaffold CLI, Preview, Typing und Performance Contracts |
| Docs | Docs-App, Markdown, Parsedown/RMT Shell und Referenzen |
| Security | Manifest, Trusted DOM und Supply-Chain Policies |
| Catalog | Gate-, Handoff- und Epic-Contracts |

## Release Owner Artifact

```bash
npm run pack:dry-run:report
```

Das Script schreibt:

- `.xtend-test-results/xtend-pack-dry-run.json`
- `.xtend-test-results/xtend-package-export-surface-lock.json`
- `.xtend-test-results/xtend-package-export-lock-report.json`

`private-until-release-owner-acceptance` bleibt aktiv. Der Lock beweist nur, dass Paketinhalt und Export Surface kontrolliert sind; er oeffnet kein Publishing.

## Handoff

Nach `WP-E13-04` hat `WP-E13-05` die Known Residual Triage unter [Known Residual Triage](./known-residual-triage.md) mit `xtend.epic13.known-residual-triage.v1` abgeschlossen. `WP-E13-06` hat die [Hydration Performance Closure](./hydration-performance-closure.md) mit `xtend.epic13.hydration-performance-closure.v1` abgeschlossen. `WP-E13-07` hat die [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md) vorbereitet, `WP-E13-08` hat [Visual Owner Artifacts](./visual-owner-artifacts.md) normalisiert, `WP-E13-09` hat [RMT Production Readiness](./rmt-production-readiness.md) gebuendelt, `WP-E13-10` hat [Docs RMT Production Hardening](./docs-rmt-production-hardening.md) abgeschlossen, `WP-E13-11` hat [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md) abgeschlossen und `WP-E13-12` hat [RC1 Migration Notes](./rc1-migration-notes.md) abgeschlossen. Der aktuelle Export Lock erwartet 78 Package-Exports inklusive `./catalog/epic13-rc1-migration-notes`, `./catalog/epic14-rmt-tooling`, `./catalog/epic14-lsp-handoff` und der RMT-Tooling-Surface.

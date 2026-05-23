# XTend CI Default Gates Workflow

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.ci.default-gates.v1`
- Workflow: `.github/workflows/xtend-default-gates.yml`
- Primaeres Gate: `npm run test:report`
- Report: `.xtend-test-results/xtend-test-report.json`
- Artifact: `xtend-test-report-node-26`
- Node-Version: `26.x`

## Zweck

Dieses Dokument macht den lokalen XTend-Default-Gate-Lauf reproduzierbar in CI. Der Workflow ist bewusst minimal: Er fuehrt dieselbe Vollsuite aus, die lokal hinter `npm test` liegt, schreibt aber zusaetzlich den maschinenlesbaren JSON-Report ueber `npm run test:report`.

Damit bleiben die Enterprise-Gates lokal zuerst entwickelbar und werden trotzdem fuer Pull Requests und Pushes sichtbar. Seit `ER-WP-37` ist dieser Workflow in eine Gate-Matrix aufgeteilt: Pull Requests laufen ueber `pr-fast`, Pushes, manuelle Runs und Release-Events ueber `full-release`. Nightly-Ausfuehrungen laufen getrennt in `.github/workflows/xtend-nightly-build.yml`, damit geplante Artefaktlaeufe die Pflicht-Gates nicht aufblaehen.

## Workflow Contract

| Feld | Wert |
|------|------|
| Contract | `xtend.ci.default-gates.v1` |
| Provider | GitHub Actions |
| Workflow | `.github/workflows/xtend-default-gates.yml` |
| Runner | `ubuntu-latest` |
| Node | `26.x` |
| Gate | `npm run test:report` |
| Report Schema | `xtend.test.report.v1` |
| Report Path | `.xtend-test-results/xtend-test-report.json` |
| Artifact | `xtend-test-report-node-26` |
| Upload Policy | `if: always()` |

Die erweiterte Gate-Matrix liegt in `development/XTend-CI-Gate-Matrix.md` unter `xtend.ci.gate-matrix.v1`.

## Gate-Umfang

`npm run test:report` ruft den zentralen Runner mit Report-Ausgabe auf:

```bash
node scripts/run_xtend_tests.js --report .xtend-test-results/xtend-test-report.json
```

Der Lauf umfasst damit die Default-Suites des lokalen Runners, darunter Core, Architecture, Components, A11y, Fabric, Performance, Security, Catalog, RMT, Browser-Smokes und References. Die Performance Regression Suite darf weiterhin Warnungen im JSON-Report sichtbar machen, solange der Default-Runner nicht fehlschlaegt.

## ER-WP-37 Gate-Matrix

| Gate | Contract | Trigger | Command | Artifact |
|------|----------|---------|---------|----------|
| `pr-fast` | `xtend.ci.pr-fast-gate.v1` | `pull_request` | `npm run test:pr:report` | `xtend-pr-gate-report-node-26` |
| `full-release` | `xtend.ci.full-release-gate.v1` | `push`, `workflow_dispatch`, `release: published` | `npm run test:release:full:report` | `xtend-release-gate-report-node-26` |
| `package-structure` | `xtend.ci.package-structure-gate.v1` | `pull_request`, `push`, `workflow_dispatch`, `release: published` | `npm run pack:dry-run` + `npm publish --dry-run --tag next --access public` | `xtend-package-structure-node-26` |
| `nightly-build` | `xtend.ci.nightly-build.v1` | `47 2 * * *` in `.github/workflows/xtend-nightly-build.yml` | `npm run test:release:full:report` + `npm run test:rmt-vnext-primitives:report` + `npm run nightly:manifest` | `xtend-nightly-build-node-26` |
| `npm-publish-next` | `xtend.npm.publish-next.github-actions.v1` | `workflow_dispatch` mit `publish_to_npm=true` oder `release: published` | `npm publish --tag next --provenance --access public` | npm Provenance |

## Nicht im Scope

- kein automatisches `npm publish` ohne manuelle Release-Owner-Freigabe
- keine aktive SemVer-Entscheidung fuer einen konkreten Release
- keine verpflichtenden Netzwerk-Gates in lokalen Default-Gates wie `npm audit` oder `npm sbom`

`ER-WP-38` hat diese Punkte als Release-Checklist-Policy und Conditional Network Gates eingeordnet. `ER-WP-39` dokumentiert darauf den Enterprise Adoption Guide. `DPF-WP-03` ergaenzt fuer CI/Release einen separaten, nicht fuer Pull Requests verpflichtenden Job `conditional-network-evidence`, der `npm run conditional-network:evidence` mit `XTEND_CONDITIONAL_NETWORK_EXECUTE=1` ausfuehrt oder strukturierte Owner-Deferrals als Artefakte hochlaedt.

## Verifikation

Lokale Verifikation:

```bash
npm run test:report
node scripts/run_xtend_tests.js references --json
```

CI-Verifikation:

- Workflow wird auf `pull_request`, `push` nach `main`, `master`, `develop` und manuell per `workflow_dispatch` ausgefuehrt.
- Der JSON-Report wird auch bei Fehlschlag als Artifact hochgeladen.
- Der Workflow bleibt ohne CDN- oder externe Runtime-Abhaengigkeit im XTend-Default-Pfad.
- Der Nightly Build wird separat ueber `.github/workflows/xtend-nightly-build.yml` geplant und laedt `xtend-nightly-build-node-26` inklusive `.xtend-test-results/xtend-nightly-build-manifest.json` hoch.

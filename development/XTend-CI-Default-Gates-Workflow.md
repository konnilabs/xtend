# XTend CI Default Gates Workflow

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.ci.default-gates.v1`
- Workflow: `.github/workflows/xtend-default-gates.yml`
- Primaeres Gate: `npm run test:report`
- Report: `.xtend-test-results/xtend-test-report.json`
- Artifact: `xtend-test-report-node-20`
- Node-Version: `20.x`

## Zweck

Dieses Dokument macht den lokalen XTend-Default-Gate-Lauf reproduzierbar in CI. Der Workflow ist bewusst minimal: Er fuehrt dieselbe Vollsuite aus, die lokal hinter `npm test` liegt, schreibt aber zusaetzlich den maschinenlesbaren JSON-Report ueber `npm run test:report`.

Damit bleiben die Enterprise-Gates lokal zuerst entwickelbar und werden trotzdem fuer Pull Requests und Pushes sichtbar. Seit `ER-WP-37` ist dieser Workflow in eine Gate-Matrix aufgeteilt: Pull Requests laufen ueber `pr-fast`, Pushes, manuelle Runs und Nightly-Ausfuehrungen ueber `full-release`.

## Workflow Contract

| Feld | Wert |
|------|------|
| Contract | `xtend.ci.default-gates.v1` |
| Provider | GitHub Actions |
| Workflow | `.github/workflows/xtend-default-gates.yml` |
| Runner | `ubuntu-latest` |
| Node | `20.x` |
| Gate | `npm run test:report` |
| Report Schema | `xtend.test.report.v1` |
| Report Path | `.xtend-test-results/xtend-test-report.json` |
| Artifact | `xtend-test-report-node-20` |
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
| `pr-fast` | `xtend.ci.pr-fast-gate.v1` | `pull_request` | `npm run test:pr:report` | `xtend-pr-gate-report-node-20` |
| `full-release` | `xtend.ci.full-release-gate.v1` | `push`, `workflow_dispatch`, `schedule` | `npm run test:release:full:report` | `xtend-release-gate-report-node-20` |
| `nightly` | `xtend.ci.nightly-gate.v1` | `17 3 * * *` | `npm run test:release:full:report` | `xtend-release-gate-report-node-20` |

## Nicht im Scope

- kein `npm publish`
- keine aktive SemVer-Entscheidung fuer einen konkreten Release
- keine verpflichtenden Netzwerk-Gates wie `npm audit` oder `npm sbom`

`ER-WP-38` hat diese Punkte als Release-Checklist-Policy und Conditional Network Gates eingeordnet. `ER-WP-39` dokumentiert darauf den Enterprise Adoption Guide.

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

# XTend CI Default Gates Workflow

- Status: Accepted
- Datum: 6. Mai 2026
- Aktualisiert: 19. Juli 2026 fuer die Stage-A-Node-Matrix
- Contract: `xtend.ci.default-gates.v1`
- Workflow: `.github/workflows/xtend-default-gates.yml`
- Primaeres Gate: `npm run test:report`
- Report: `.xtend-test-results/xtend-test-report.json`
- Artifact-Metadaten: `xtend-test-report-{artifactSuffix}`
- Workflow-Artifact: `xtend-test-report-${{ matrix.artifact_suffix }}`
- Primaere Node-Version: `24.18.0`
- Verpflichtende zweite Lane: `26.5.0`
- Package Manager: `npm@11.17.0`

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
| Node | primaer `24.18.0`, verpflichtend `26.5.0` |
| npm | `11.17.0` in jeder Lane |
| Gate | `npm run test:report` |
| Report Schema | `xtend.test.report.v1` |
| Report Path | `.xtend-test-results/xtend-test-report.json` |
| Artifact-Metadaten | `xtend-test-report-{artifactSuffix}` |
| Workflow-Artifact | `xtend-test-report-${{ matrix.artifact_suffix }}` |
| Runtime-Evidence | `.xtend-test-results/runtime/xtend-node-runtime-${{ matrix.runtime_lane }}.json` |
| Upload Policy | `if: always()` |

Die erweiterte Gate-Matrix liegt in `development/XTend-CI-Gate-Matrix.md` unter `xtend.ci.gate-matrix.v1`.

### Stage-A Runtime-Matrix

| Rolle | Node | `runtime_lane` | `artifact_suffix` |
|------|------|----------------|-------------------|
| Primaere LTS-Lane | `24.18.0` | `node-24-lts` | `node-24-18-0` |
| Verpflichtende Current-Lane | `26.5.0` | `node-26-current` | `node-26-5-0` |

Beide Lanes sind Pflicht-Gates und installieren vor dem Workspace-Install `npm@11.17.0`. `scripts/capture_node_runtime_evidence.js` validiert die tatsaechliche Node-/npm-Laufzeit und schreibt pro Lane ein eigenes Runtime-Evidence-Artefakt. Die Metadaten verwenden den providerneutralen Platzhalter `{artifactSuffix}`; GitHub Actions materialisiert ihn als `${{ matrix.artifact_suffix }}`.

## Gate-Umfang

`npm run test:report` ruft den zentralen Runner mit Report-Ausgabe auf:

```bash
node scripts/run_xtend_tests.js --report .xtend-test-results/xtend-test-report.json
```

Der Lauf umfasst damit die Default-Suites des lokalen Runners, darunter Core, Architecture, Components, A11y, Fabric, Performance, Security, Catalog, RMT, Browser-Smokes und References. Die Performance Regression Suite darf weiterhin Warnungen im JSON-Report sichtbar machen, solange der Default-Runner nicht fehlschlaegt.

## ER-WP-37 Gate-Matrix

| Gate | Contract | Trigger | Command | Artifact |
|------|----------|---------|---------|----------|
| `pr-fast` | `xtend.ci.pr-fast-gate.v1` | `pull_request` | `npm run test:pr:report` | `xtend-pr-gate-report-${{ matrix.artifact_suffix }}` |
| `full-release` | `xtend.ci.full-release-gate.v1` | `push`, `workflow_dispatch` | `npm run test:release:full:report` | `xtend-release-gate-report-${{ matrix.artifact_suffix }}` |
| `package-structure` | `xtend.ci.package-structure-gate.v1` | `pull_request`, `push`, `workflow_dispatch` | `npm run pack:dry-run` + Workspace-`npm pack --dry-run --json` | `xtend-package-structure-${{ matrix.artifact_suffix }}` |
| `node-native-toolchain-smoke` | `xtend.node-native-toolchain-smoke.v1` | `pull_request`, `push`, `workflow_dispatch` | `npm run test:node-native-toolchain` | `xtend-node-native-toolchain-smoke-${{ matrix.artifact_suffix }}` |
| `nightly-build` | `xtend.ci.nightly-build.v1` | `47 2 * * *` in `.github/workflows/xtend-nightly-build.yml` | `npm run test:release:full:report` + `npm run test:rmt-vnext-primitives:report` + `npm run nightly:manifest` | `xtend-nightly-build-${{ matrix.artifact_suffix }}` |
| `npm-publish-latest` | `xtend.npm.publish-latest.github-actions.v1` | `workflow_dispatch` mit `publish_to_npm=true` | `npm publish --tag latest --provenance --access public` | `xtend-npm-publish-latest-evidence-node-24-18-0` |

Der Publish-Job ist nicht Teil der Node-Matrix: Er laeuft nach erfolgreicher Matrix und expliziter Owner-Freigabe ausschliesslich mit Node `24.18.0`, pinnt ebenfalls npm `11.17.0` und laedt Runtime-Evidence fuer `node-24-publish` hoch. Alle genannten GitHub-Pfade sind Electron-frei. Das Produktkommando `test:catfood` delegiert auf `test:catfood:ci`; lokale Electron-Kommandos sind weder direkte noch transitive Workflow- oder Publish-Abhaengigkeiten.

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
- Die primaere Lane `24.18.0` und die verpflichtende Lane `26.5.0` laufen mit `fail-fast: false`, bleiben aber beide release-blockierend.
- Jede Lane pinnt npm `11.17.0`, validiert die Runtime-Evidence und verwendet einen kollisionsfreien `${{ matrix.artifact_suffix }}`.
- `node-native-toolchain-smoke` prueft nur die Root-Toolchain und startet kein Electron; lokale Desktop-Evidence bleibt upstream-owned und nicht blockierend.
- Der JSON-Report wird auch bei Fehlschlag als Artifact hochgeladen.
- Der Workflow bleibt ohne CDN- oder externe Runtime-Abhaengigkeit im XTend-Default-Pfad.
- Der Nightly Build wird separat ueber `.github/workflows/xtend-nightly-build.yml` geplant und laedt `xtend-nightly-build-${{ matrix.artifact_suffix }}` inklusive Runtime-Evidence und `.xtend-test-results/xtend-nightly-build-manifest.json` hoch.

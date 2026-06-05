# XTend Native-First Dependency Diet Policy Contract

- Status: `accepted by NFM-WP-04`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-04-Dependency-Diet-Policy-und-Runtime-Dependency-Exit-Plaene-erstellen.md`
- Contract: `xtend.native-first.dependency-diet-policy.v1`
- Exit Plan Matrix: `xtend.native-first.dependency-exit-plan-matrix.v1`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Supply Chain Gate Plan: `xtend.security.supply-chain-gate-plan.v1`
- Boundary: `avoid-runtime-dependency-by-default`
- Boundary: `dependency-classification-precedes-adoption`
- Boundary: `tooling-dependencies-remain-outside-core-runtime`
- Boundary: `network-evidence-is-ci-or-release-only`
- Zielzustand: `dependency-diet-policy-accepted`

## Zweck

Dieser Contract finalisiert die Native-First Dependency Diet Policy fuer XTend. Er trennt Runtime-, Build-, Dev-, Test-, Docs-, Editor-, Vendor- und interne Peer-Flaechen, bevor Dependencies als Produktentscheidung akzeptiert werden.

Der Default bleibt:

```text
avoid-runtime-dependency
```

Eine Dependency darf nicht dadurch produktfaehig werden, dass sie nur in einem Manifest steht. Sie braucht eine Klasse, einen Owner, einen Zweck, eine Gate-Anbindung und einen Exit-Plan.

## Dependency-Klassen

| Klasse | Bedeutung | Default |
|--------|-----------|---------|
| `core-runtime-dependency` | externe Dependency in Browser-, Component-, RMT-, Fabric- oder Loader-Runtime-Pfaden | `blocked-by-default` |
| `runtime-peer-dependency` | externe Dependency wird von App-Autoren bereitgestellt und im Runtime-Pfad benutzt | `blocked-by-default` |
| `internal-peer-dependency` | Peer auf anderes `@ccslabs/*` Workspace-Paket | `allowed-if-version-synced` |
| `build-tooling-dependency` | Tooling erzeugt Artefakte, wird aber nicht in Core-Runtime importiert | `allowed-with-owner-and-exit-plan` |
| `dev-test-dependency` | lokale Entwicklung, Tests oder Fixtures | `allowed-with-lockfile-and-license-policy` |
| `docs-demo-dependency` | Docs-, Demo- oder Preview-only | `allowed-if-not-runtime-imported` |
| `editor-extension-dependency` | VS-Code- oder IDE-spezifische Integration | `allowed-in-extension-scope` |
| `vendored-utility` | lokal eingecheckte Fremd- oder fremdkompatible Utility-Flaeche | `contain-with-facade-and-exit-plan` |
| `legacy-runtime-surface` | bestehende XTend-Runtime-Flaeche ohne externe Dependency, aber mit Migrationslast | `defer-to-migration-plan` |

## Blocking-Regeln

Eine neue `core-runtime-dependency` oder `runtime-peer-dependency` ist blockiert, bis alle Felder erfuellt sind:

- `dependencyName`
- `dependencyClass`
- `runtimeSurface`
- `capabilityGap`
- `whyNativeInsufficient`
- `whyOwnedPrimitiveInsufficient`
- `securityImpact`
- `supplyChainImpact`
- `bundleImpact`
- `owner`
- `reviewCadence`
- `exitPlan`
- `gateEvidence`

Eine Dependency ist ebenfalls blockiert, wenn:

- sie freie DOM-, URL-, Eval-, Import- oder HTML-Sinks oeffnet
- sie den RMT-Kernel an Host-, Component-, Browser- oder Framework-Typen koppelt
- sie ohne Lockfile in ein release-relevantes Manifest kommt
- sie ohne License- und Vulnerability-Policy in Release-Artefakte gelangt
- sie aus Tooling-, Docs- oder Editor-Scope in Core-Runtime importiert wird
- sie nur Framework-Paritaet liefert, aber keine native, owned oder auditierbare XTend-Faehigkeit begruendet

## Erlaubte Entscheidungen

| Entscheidung | Wann verwenden | Pflichtfolge |
|--------------|----------------|--------------|
| `reject-runtime-dependency` | Native oder owned Alternative reicht aus oder Risiko ist zu hoch | keine Produktaufnahme |
| `allow-runtime-dependency-exception` | echter Runtime-Capability-Gap, kein nativer oder owned Ersatz | Owner-Signoff, Exit-Plan, Review-Datum, Audit Evidence |
| `allow-tooling-dependency` | Dependency bleibt in Build- oder CLI-Tooling und erzeugt nur Artefakte | Lockfile, License, Vulnerability Gate, Runtime-Import-Verbot |
| `allow-editor-extension-dependency` | Dependency ist IDE-spezifisch und nicht Teil von XTend-Core | Extension-Scope, eigener Owner, kein Runtime-Handoff |
| `allow-internal-peer` | Peer zeigt auf versioniertes `@ccslabs/*` Workspace-Paket | Version-Sync und optionales Peer-Meta, wenn passend |
| `contain-vendored-utility` | lokale Utility-Flaeche ist kurzfristig akzeptiert | schmale Fassade, Provenance-Hinweis, Exit-Plan |
| `defer-with-watch` | Entscheidung braucht Radar-, License-, Vulnerability- oder Browser-Evidence | Review-Datum und Folgepaket |

## Current Dependency Baseline

| Bereich | Klassifikation | Entscheidung |
|---------|----------------|--------------|
| Root `@ccslabs/xtend` | `core-runtime-package` | keine externen Runtime-Dependencies im Root-Manifest |
| `@ccslabs/xtend-rmt` | `core-runtime-package` | keine externen Dependencies im Workspace-Manifest |
| `@ccslabs/xtend-fabric` | `core-runtime-package` | keine externen Dependencies im Workspace-Manifest |
| `@ccslabs/xtend-cli` | `build-tooling-package` | nur interne optionale Peers auf XTend-Pakete |
| `@ccslabs/xtend-compiler` | `build-tooling-package` | keine externen Dependencies im Workspace-Manifest |
| `@ccslabs/xtend-maraca` | `build-tooling-package` | `rollup` und `terser` als produktnahe Toolchain-Dependencies akzeptiert |
| `tools/rmt-editor/vscode` | `editor-extension-package` | `vscode-languageclient` als Extension-Dependency akzeptiert |
| `components/prism.js` | `vendored-utility` | akzeptiert als contained Fassade mit Exit-Plan |
| `components/turndown.js` | `vendored-utility` | akzeptiert mit Trust-/Structured-Writer-Follow-up |
| `xtend-dev.js` und `./legacy-loader` | `legacy-runtime-surface` | keine Dependency, aber Migrationsplanung in `NFM-WP-21` |

## Runtime Dependency Baseline

Der aktuelle Native-First-Stand akzeptiert keine externe `core-runtime-dependency`.

`rollup`, `terser` und `vscode-languageclient` sind keine Core-Runtime-Dependencies. Sie bleiben auf Build-Tooling- oder Editor-Scope begrenzt. Transitive Lockfile-Eintraege aus diesen Paketen duerfen nicht direkt aus Browser-, Component-, RMT-, Fabric- oder Loader-Pfaden importiert werden.

## Gate-Anbindung

Lokale Gates bleiben deterministisch und offline:

```bash
node scripts/verify_supply_chain_policy.js --json
node scripts/run_xtend_tests.js supply-chain --json
node scripts/run_xtend_tests.js references --json
```

CI- und Release-Gates duerfen Netzwerkzugriff besitzen:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
npm run release:report
npm run pack:dry-run
```

Das lokale Gate beweist Policy, Manifest- und Lockfile-Konsistenz. Vulnerability- und SBOM-Evidence wird als conditional network evidence in CI oder Release Automation erzeugt.

## Review-Kadenz

| Klasse | Review |
|--------|--------|
| `core-runtime-dependency` | pro Aufnahme, pro Minor Release und bei jeder Vulnerability |
| `runtime-peer-dependency` | pro Aufnahme, pro Minor Release und bei SemVer-/License-Aenderung |
| `build-tooling-dependency` | pro Minor Release oder Toolchain-Upgrade |
| `dev-test-dependency` | pro Release Candidate oder Security-Finding |
| `docs-demo-dependency` | pro Docs-Release oder Preview-Surface-Aenderung |
| `editor-extension-dependency` | pro Extension-Release |
| `vendored-utility` | pro Minor Release und bei Security-/License-Finding |
| `legacy-runtime-surface` | pro Migration-/Deprecation-Paket |

## Handoff

| Folgepaket | Handoff |
|------------|---------|
| `NFM-WP-05` | Replacement-Kandidaten sind gegen diese Policy final klassifiziert |
| `NFM-WP-06` | UI Capability Matrix kann `owned`, `vendor-backed`, `tooling-only`, `legacy` und `missing` unterscheiden |
| `NFM-WP-13` | Audit Evidence Pack uebernimmt Dependency-Klassen, Owner, Review-Kadenz und CI-/Release-Evidence |
| `NFM-WP-19` | Performance-, Complexity- und Bundle-Budgets koennen Dependency-Impact als Gate-Feld fuehren |
| `NFM-WP-21` | Migration und Deprecation uebernimmt Exit-Plan-Matrix fuer Residuals |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Runtime-, Dev-, Test-, Build- und Docs-Dependencies sind getrennt bewertet | erfuellt |
| neue Runtime-Dependencies sind default-blocked | erfuellt |
| Owner-, Zweck-, Risiko-, Exit- und Review-Felder sind Pflicht | erfuellt |
| Vendor-Utility-Fassaden sind sichtbar | erfuellt |
| WP-05-Replacement-Kandidaten sind angebunden | erfuellt |
| lokale und conditional network Gates sind getrennt | erfuellt |

# XTend Native-First Migration Deprecation Plan Contract

- Status: `accepted by NFM-WP-21`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-21-Migration-und-Deprecation-fuer-Vendor-Legacy-und-Non-Native-Pfade-planen.md`
- Contract: `xtend.native-first.migration-deprecation-plan.v1`
- Matrix: `xtend.native-first.migration-deprecation-matrix.v1`
- Item Schema: `xtend.native-first.migration-deprecation-item.v1`
- Fixture Schema: `xtend.native-first.migration-deprecation-fixture.v1`
- Fixture Pack Schema: `xtend.native-first.migration-deprecation-fixtures.v1`
- Report Schema: `xtend.native-first.migration-deprecation-report.v1`
- Source Candidate Contract: `xtend.native-first.vendor-legacy-replacement.v1`
- Dependency Diet Policy: `xtend.native-first.dependency-diet-policy.v1`
- Budget Gate Contract: `xtend.native-first.performance-complexity-bundle-budget-gates.v1`
- Docs Authoring Contract: `xtend.native-first.docs-authoring-guides.v1`
- Local Gate: `node scripts/run_xtend_tests.js native-first-migration-deprecation --json`
- Package Script: `npm run test:native-first-migration-deprecation`
- Boundary: `no-silent-deprecation`
- Boundary: `alternative-before-removal`
- Boundary: `migration-guide-before-public-deprecation`
- Boundary: `gate-before-release-decision`
- Boundary: `no-new-runtime-dependency`

## Zweck

Dieser Contract macht aus den Vendor-, Legacy- und non-native Residuals einen kontrollierten Migration- und Deprecation-Plan. Jede Deprecation braucht eine Alternative, einen Migration Guide, lokale Gates, eine SemVer-Policy, Owner und eine Release-Entscheidung.

WP-21 entfernt keine Runtime-Flaeche. Das Paket entscheidet, welche Pfade blockiert, eingefroren, enthalten, migriert oder als Guardrail geschlossen bleiben.

## Item Schema

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `migrationId` | ja | stabile Migration-ID, zum Beispiel `NFM-MIG-01` |
| `sourceCandidate` | ja | Kandidat aus `NFM-RC-01` bis `NFM-RC-08` |
| `priority` | ja | `P0`, `P1` oder `P2` |
| `migrationClass` | ja | Candidate-Klasse, zum Beispiel `manual-html-path` oder `legacy-runtime-surface` |
| `currentSurface` | ja | aktueller Pfad, Export, Helper oder Tooling-Bereich |
| `status` | ja | Migration-/Deprecation-Status |
| `deprecationStage` | ja | aktueller Deprecation- oder Containment-Schritt |
| `alternative` | ja | Native-First-, RMT-first- oder owned Alternative |
| `migrationGuide` | ja | oeffentlicher oder interner Guide-Pfad |
| `requiredGates` | ja | lokale Gates fuer diese Entscheidung |
| `semverPolicy` | ja | SemVer- oder Compatibility-Regel |
| `releaseDecision` | ja | Freigabeentscheidung oder blockierter Claim |
| `owner` | ja | Pflege- und Review-Owner |
| `nextHandoff` | ja | Folgepaket oder Owner-Review |

## Statusmodell

| Status | Bedeutung | Erlaubte Claims |
|--------|-----------|-----------------|
| `migration-required` | Pfad bleibt sichtbar, aber neue Produktclaims muessen auf Alternative oder Trust Boundary wechseln | nur mit Alternative, Gate und Migration Guide |
| `deprecation-planned` | Pfad bleibt kompatibel, ist aber eingefroren oder bekommt Warnfenster | kein Ausbau der alten Surface |
| `containment-accepted` | Pfad ist erlaubt, solange er ausserhalb der Core Runtime bleibt und Gates aktiv sind | Containment-Claim mit Budget- und Supply-Chain-Nachweis |
| `closed-guardrail` | Pfad ist abgeschlossen oder positives owned Muster; Regression Guard bleibt | kein neuer Migration-Claim erforderlich |

## Source Gates

```bash
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
node scripts/run_xtend_tests.js native-first-docs-authoring --json
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js supply-chain --json
node scripts/run_xtend_tests.js type-exports-vendor --json
node scripts/run_xtend_tests.js type-exports-loader --json
node scripts/run_xtend_tests.js component-long-tail-migration --json
node scripts/run_xtend_tests.js manifest-import-policy --json
node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json
node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json
node scripts/run_xtend_tests.js rmt-native-shell-migration --json
node scripts/run_xtend_tests.js maraca-bundle --json
node scripts/run_xtend_tests.js maraca-size-budget --json
node scripts/run_xtend_tests.js rmt-tooling-docs --json
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
node scripts/run_xtend_tests.js epic18-vendor-bugfix-smokes --json
node scripts/run_xtend_tests.js component-contract-v2 --json
node scripts/run_xtend_tests.js docs-public-quality --json
node scripts/run_xtend_tests.js references --json
```

## Deprecation-Regeln

- Keine Entfernung ohne Alternative, Migration Guide, Gate und SemVer-Policy.
- Keine neue Produktdokumentation fuer manuelle HTML-Sinks in normaler App-UI.
- Keine breiteren Public Re-Exports fuer vendored Utilities.
- Keine Runtime-Default-Abhaengigkeit aus Build-, Editor- oder Docs-Tooling.
- Legacy Loader bleibt kompatibel, bis Warnfenster, Migration Guide und Release-Entscheidung vorhanden sind.
- Geschlossene Vendor-Backports bleiben Regression-Guardrails, aber keine neue Vendor-Kopie.

## Nicht-Ziele

- kein Big-Bang-Removal
- keine Runtime-Deletion in WP-21
- keine neue externe UI-Framework-Dependency
- kein Ersatz fuer Browser-Lab- oder Visual-Evidence
- kein Import von Host-, Component- oder Browser-Typen in den RMT-Kernel

## Handoff

- `NFM-WP-22` entscheidet Mission-Handoff und naechste Epic-Grenze anhand dieses no-silent-deprecation Plans, der Migration-, Deprecation-, Containment- und Guardrail-Entscheidungen zusammenfuehrt.

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Alle `NFM-RC-01` bis `NFM-RC-08` besitzen einen Migration- oder Guardrail-Eintrag | erfuellt |
| Jede Deprecation besitzt Alternative, Migration Guide, Gate und Release-Entscheidung | erfuellt |
| Public Migration Guide existiert in Deutsch und Englisch | erfuellt |
| Registry, Package und Runner expose `native-first-migration-deprecation` | erfuellt |
| Keine neue Runtime-Dependency entsteht | erfuellt |

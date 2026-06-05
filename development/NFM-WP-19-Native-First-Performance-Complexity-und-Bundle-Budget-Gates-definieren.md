# NFM-WP-19 - Native-First Performance Complexity und Bundle Budget Gates definieren

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.performance-complexity-bundle-budget-gates.v1`
- Budget Matrix: `xtend.native-first.performance-complexity-bundle-budget-gate-matrix.v1`
- Budget Item Schema: `xtend.native-first.performance-complexity-bundle-budget-gate.v1`
- Fixture Schema: `xtend.native-first.performance-complexity-bundle-budget-gate-fixture.v1`
- Fixture Pack: `xtend.native-first.performance-complexity-bundle-budget-gate-fixtures.v1`
- Report Schema: `xtend.native-first.performance-complexity-bundle-budget-gates-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js native-first-budget-gates --json`
- Package Script: `npm run test:native-first-budget-gates`
- Fuehrender Contract: `development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md`
- Fuehrende Matrix: `development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Matrix.md`
- Fixture Pack: `tests/fixtures/native-first/native-first-budget-gate-fixtures.json`

## Ziel

WP-19 schliesst den Budget-Handoff aus WP-18. Native-First-Features duerfen nur dann als mission-konform gelten, wenn sie keine unbegruendete Bundle-, Dependency-, Performance-, Interaction-, Scheduler-, Complexity-, Browser-Smoke- oder Visual-Evidence-Verschlechterung einfuehren.

## Umgesetzte Artefakte

| Artefakt | Ergebnis |
|----------|----------|
| `development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md` | definiert Contract, Budget Schema, Statusmodell, Source Gates, Grenzen und Handoffs |
| `development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Matrix.md` | erfasst sechs Budget-Gates fuer Bundle, Performance, Interaction, Complexity, Browser/Visual und Release-Handoff |
| `tests/fixtures/native-first/native-first-budget-gate-fixtures.json` | enthaelt maschinenlesbare Budget-Fixtures mit Thresholds, Gate-Verweisen, Residuals und blocked Claims |
| `tests/native-first/native_first_budget_gate_suite.js` | prueft Contract, Matrix, Fixtures, Package-Metadaten, Registry, Roadmap, Mission und Runner |
| `package.json` | ergaenzt `xtend.nativeFirstBudgetGates` und `npm run test:native-first-budget-gates` |
| `scripts/run_xtend_tests.js` | registriert Suite-ID `native-first-budget-gates` |
| `development/XTend-Native-First-Contract-Registry.md` | fuehrt WP-19 als Native-First-Contract-Index-Eintrag |

## Budget Outcomes

| Status | Anzahl | Budget Gates |
|--------|--------|--------------|
| `budget-accepted` | 2 | `NFM-BGT-03`, `NFM-BGT-04` |
| `budget-accepted-with-existing-gate` | 2 | `NFM-BGT-01`, `NFM-BGT-02` |
| `budget-accepted-with-browser-lab-residual` | 1 | `NFM-BGT-05` |
| `budget-handoff-to-release-owner` | 1 | `NFM-BGT-06` |

## Budget-Oberflaechen

| Oberflaeche | Fuehrende Budgets | Entscheidung |
|-------------|-------------------|--------------|
| Bundle und Dependencies | `NFM-BGT-01` | existing Gate ueber Supply Chain und Maraca Size Budget |
| Mount, Hydration, SSR und CLS | `NFM-BGT-02` | existing Gate ueber Performance Regression, Component UX Performance und Docs-Budgets |
| Interaction und Scheduler Lanes | `NFM-BGT-03` | accepted ueber Component UX Performance, Event Routing und Action/Effect Runtime |
| Adapter- und Framework-Hebel-Komplexitaet | `NFM-BGT-04` | accepted ueber Contract Runtime Parity und DOM Descriptor Renderer Proofs |
| Browser Smoke und Visual Evidence | `NFM-BGT-05` | accepted mit Browser-Lab-Residual |
| Regression und Release-Handoff | `NFM-BGT-06` | Handoff an Release Owner und `NFM-WP-22` |

## Blockierte Claims

| Claim | Entscheidung |
|-------|--------------|
| Production-Budget-Claim ohne Gate | bleibt verboten |
| Production-Bundle-Claim ohne Release- oder Size-Budget-Gate | bleibt verboten |
| Runtime-Dependency-Zuwachs ohne Exit-Plan | bleibt verboten |
| Neue Abstraktion ohne Complexity-Budget | bleibt verboten |
| Echte Browser-/Visual-Claims ohne Artefakt | bleibt Residual bis owner-kontrollierte Browser-Lab-Evidence existiert |

## Verifikation

```bash
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json
node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json
node scripts/run_xtend_tests.js native-first-evidence-pack --json
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js contract-runtime-parity --json
node scripts/run_xtend_tests.js supply-chain --json
node scripts/run_xtend_tests.js performance-regression --json
node scripts/run_xtend_tests.js component-ux-performance --json
node scripts/run_xtend_tests.js docs-php-ssr-performance-budget --json
node scripts/run_xtend_tests.js docs-php-ssr-cls-budget --json
node scripts/run_xtend_tests.js maraca-size-budget --json
node scripts/run_xtend_tests.js browser --json
node scripts/run_xtend_tests.js rmt-vnext-source-to-sea --json
node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json
node scripts/run_xtend_tests.js rmt-event-routing-runtime --json
node scripts/run_xtend_tests.js rmt-action-effect-runtime --json
node scripts/run_xtend_tests.js references --json
```

## Handoff

| Folgepaket | Startstatus nach WP-19 |
|------------|------------------------|
| `NFM-WP-20` | `ready`; kann Docs und Authoring Guides mit Budget-Pflichten, Gate-Kommandos und blocked Claims schreiben |
| `NFM-WP-21` | `planned`; kann Vendor-, Legacy- und Non-Native-Pfade anhand Bundle-/Dependency-/Complexity-Budgets priorisieren |
| `NFM-WP-22` | `planned`; kann Mission-Handoff und naechste Epic-Grenze anhand Budget-Residuals entscheiden |
| `surface-browser-lab` | `planned`; kann echte Browser-Lab- und Visual-Artefakte fuer Surface-Residuals liefern |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Native-First-Budget-Schema ist stabil dokumentiert | erfuellt |
| Bundle-, Dependency-, Performance-, Complexity-, Browser- und Visual-Budgets sind definiert | erfuellt |
| WP-18 Browser-Lab-Handoff ist in Budget-Gates ueberfuehrt | erfuellt |
| Bestehende lokale Gates sind angebunden | erfuellt |
| Kein neues Runtime-Dependency oder externes UI-Framework wird eingefuehrt | erfuellt |

# XTend Native-First Performance Complexity Bundle Budget Gates Contract

- Status: `accepted by NFM-WP-19`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-19-Native-First-Performance-Complexity-und-Bundle-Budget-Gates-definieren.md`
- Contract: `xtend.native-first.performance-complexity-bundle-budget-gates.v1`
- Budget Matrix: `xtend.native-first.performance-complexity-bundle-budget-gate-matrix.v1`
- Budget Item Schema: `xtend.native-first.performance-complexity-bundle-budget-gate.v1`
- Fixture Schema: `xtend.native-first.performance-complexity-bundle-budget-gate-fixture.v1`
- Fixture Pack: `xtend.native-first.performance-complexity-bundle-budget-gate-fixtures.v1`
- Report Schema: `xtend.native-first.performance-complexity-bundle-budget-gates-report.v1`
- Source Renderer Proof Contract: `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1`
- Source Recipe Contract: `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1`
- Source Audit Pack Contract: `xtend.native-first.audit-evidence-pack.v1`
- Local Gate: `node scripts/run_xtend_tests.js native-first-budget-gates --json`
- Package Script: `npm run test:native-first-budget-gates`
- Boundary: `budget-gate-before-native-first-claim`
- Boundary: `no-production-budget-claim-without-gate`
- Boundary: `no-new-runtime-dependency`
- Boundary: `complexity-budget-before-abstraction`
- Boundary: `browser-lab-evidence-is-conditional`
- Boundary: `visual-evidence-before-release-claim`
- Boundary: `rmt-kernel-remains-host-neutral`
- Zielzustand: `native-first-budget-gates-accepted`

## Zweck

WP-19 macht Native-First-Entscheidungen messbar. Ein neues Feature, Primitive, RMT-Syntaxelement oder Adapter darf nur dann als mission-konform gelten, wenn Bundle-, Dependency-, Mount-, Hydration-, Interaction-, Scheduler-, Complexity-, Browser-Smoke- und Visual-Evidence-Budgets explizit bewertet wurden.

Das Paket fuehrt keine neue Runtime und keine neue produktive Browser-Messung ein. Es definiert ein statisches Budget-Gate mit maschinenlesbaren Fixtures und verbindet vorhandene lokale Gates wie `performance-regression`, `component-ux-performance`, `docs-php-ssr-performance-budget`, `docs-php-ssr-cls-budget`, `maraca-size-budget`, `browser`, `rmt-vnext-source-to-sea`, `supply-chain` und `native-first-evidence-pack`.

## Budget Gate Schema

Pflichtfelder je Budget-Zeile:

- `budgetId`
- `budgetClass`
- `sourceWorkpackages`
- `sourceRecipes`
- `sourceProofs`
- `status`
- `measuredSurface`
- `budgetMetric`
- `threshold`
- `requiredGates`
- `evidenceArtifacts`
- `enforcementMode`
- `residual`
- `owner`
- `nextHandoff`

## Statusmodell

| Status | Bedeutung |
|--------|-----------|
| `budget-accepted` | Budget ist als Native-First-Pflichtgrenze akzeptiert und lokal gatebar |
| `budget-accepted-with-existing-gate` | Budget wird durch vorhandene Performance-, Bundle-, Browser- oder Contract-Gates belegt |
| `budget-accepted-with-browser-lab-residual` | Budget ist definiert, echte Browser-Lab- oder Visual-Artefakte bleiben owner-kontrolliert |
| `budget-handoff-to-release-owner` | Budget ist releasefaehig beschrieben, finale Release-Auswertung liegt bei Owner-Reports |

## Pflichtgrenzen

- Jede neue Native-First-Entscheidung braucht eine Budget-Zeile oder einen begruendeten negativen Claim.
- Runtime-Dependencies und externe UI-Framework-Dependencies bleiben `0` als Default-Budget.
- Production-Bundle-Claims sind nur mit `maraca-size-budget`, `supply-chain` oder einem gleichwertigen Release-Gate erlaubt.
- Mount-, Hydration-, Interaction- und Scheduler-Lane-Claims muessen vorhandene Performance- oder Component-UX-Gates referenzieren.
- Adapter- und Framework-Hebel-Komplexitaet wird ueber Layer-, Owner-, Source-Map-, Contract-Parity- und no-kernel-import-Budgets begrenzt.
- Browser-Smoke- und Visual-Evidence-Claims sind ohne Browser-Lab-Artefakt nur als `conditional` oder `residual` erlaubt.
- Budget-Gates duerfen keine freien HTML-Sinks, keine Inline-Handler, keine JavaScript-URL-Bypaesse und keine Host-Typen im RMT-Kernel erlauben.

## Source Gates

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

## Nicht-Ziele

- keine neue produktive Performance-Messruntime
- keine Freigabe von echten Browser-Lab- oder Visual-Claims ohne Artefakte
- keine Aufweichung der Dependency-Diet-Policy
- keine neue Bundler- oder UI-Framework-Dependency
- keine automatische Migration von Legacy-/Vendor-Pfaden
- kein Import von Browser-, Host- oder Component-Typen in den RMT-Kernel

## Handoff

| Folgepaket | Handoff |
|------------|---------|
| `NFM-WP-20` | kann Authoring Guides mit Budget-Pflichten, Blocked Claims und Gate-Kommandos dokumentieren |
| `NFM-WP-21` | muss Vendor-, Legacy- und Non-Native-Pfade gegen Dependency-, Bundle- und Complexity-Budgets priorisieren |
| `NFM-WP-22` | kann Mission-Handoff und naechste Epic-Grenze mit Budget-Residuals und Release-Owner-Auswertung entscheiden; final release acceptance bleibt NFM-WP-22 |
| `surface-browser-lab` | muss Browser-Lab-Residuals fuer Surface-/Overlay-/Visual-Claims mit echten Artefakten schliessen |

## Akzeptanz

| Kriterium | Entscheidung |
|-----------|--------------|
| Budget-Gate-Schema ist stabil und maschinenlesbar | erfuellt |
| Bundle-, Dependency-, Performance-, Complexity-, Browser- und Visual-Budgets sind abgedeckt | erfuellt |
| WP-18 Budget-Handoff ist geschlossen, ohne unbewiesene Browser-Lab-Claims zu erzeugen | erfuellt |
| Bestehende lokale Gates sind referenziert | erfuellt |
| Kein neues Runtime-Dependency oder externes UI-Framework wird eingefuehrt | erfuellt |

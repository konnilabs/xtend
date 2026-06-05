# XTend Native-First RMT Renderer DOM Descriptor Proofs Contract

- Status: `accepted by NFM-WP-18`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-18-Browser-native-Renderer-und-DOM-Descriptor-Proofs-ausbauen.md`
- Contract: `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1`
- Proof Matrix: `xtend.native-first.rmt-renderer-dom-descriptor-proof-matrix.v1`
- Proof Item Schema: `xtend.native-first.rmt-renderer-dom-descriptor-proof.v1`
- Fixture Schema: `xtend.native-first.rmt-renderer-dom-descriptor-proof-fixture.v1`
- Fixture Pack: `xtend.native-first.rmt-renderer-dom-descriptor-proof-fixtures.v1`
- Report Schema: `xtend.native-first.rmt-renderer-dom-descriptor-proofs-report.v1`
- Source Recipe Contract: `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1`
- Source DOM Renderer Contract: `xtend.epic18.rmt-dom-descriptor-renderer.v1`
- Source Trusted DOM Contract: `xtend.security.trusted-dom-policy.v1`
- Source Security Gate: `xtend.epic13.trusted-dom-boundary.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json`
- Package Script: `npm run test:rmt-renderer-dom-descriptor-proofs`
- Boundary: `structured-dom-descriptor-default`
- Boundary: `trusted-html-explicit-boundary-only`
- Boundary: `no-manual-html-normal-ui`
- Boundary: `no-inline-handler-or-javascript-url`
- Boundary: `browser-lab-budget-claim-deferred-to-wp19`
- Boundary: `no-new-runtime-dependency`
- Boundary: `rmt-kernel-remains-host-neutral`
- Zielzustand: `rmt-renderer-dom-descriptor-proofs-accepted`

## Zweck

WP-18 beweist, dass RMT-Output ueber browser-native DOM-Primitives materialisiert werden kann, ohne freie HTML-Sinks, Inline-Handler oder Host-Typen in den RMT-Kernel zu ziehen. Das Paket bindet die Complete-UI-Recipes aus WP-17 an den vorhandenen Epic18 DOM Descriptor Renderer und die Epic13 Trusted-DOM-Boundary an.

Das Paket baut keine neue Runtime. Es friert Proof-Zeilen, Fixture-Daten und Gate-Quellen ein, damit Renderer-, Template-/Slot-, Surface-, Attribute-/URL-, Property- und Event-Grenzen gegen reale UI-Recipes auditierbar bleiben.

## Proof Schema

Pflichtfelder je Proof-Zeile:

- `proofId`
- `proofClass`
- `sourceRecipes`
- `sourceSyntaxDecisions`
- `sourcePrimitiveDecisions`
- `status`
- `uiSurfaces`
- `rmtDomains`
- `nativePrimitivePlan`
- `trustBoundaryPlan`
- `runtimeGates`
- `browserLabPlan`
- `forbiddenSinks`
- `blockedClaims`
- `sourceMapPlan`
- `fixture`
- `expectedOutcome`
- `owner`
- `nextHandoff`

## Statusmodell

| Status | Bedeutung |
|--------|-----------|
| `proof-accepted` | Proof ist mit vorhandenen Runtime-, Security- und Contract-Gates belegbar |
| `proof-accepted-with-surface-residual` | Proof ist belegbar, aber Surface-/Portal-Maximalitaet bleibt als negativer Claim offen |
| `proof-handoff-to-budget-gate` | Proof definiert Browser-Lab- und Budget-Handoff, ohne WP-19 Performance-Claims freizugeben |

## Pflichtgrenzen

- Strukturierte RMT-UI-Ausgabe nutzt DOM Descriptor Records als Default.
- Normale UI-Materialisierung nutzt `document.createElement`, `document.createTextNode`, `document.createDocumentFragment`, `replaceChildren`, `setAttribute`, Property-Allowlists und `addEventListener`.
- `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `template.innerHTML`, `document.write`, Inline-Handler und `javascript:`-URLs bleiben fuer normale UI verboten.
- Trusted HTML ist nur ueber eine explizite Trusted-DOM- oder Sanitizing-Boundary zulaessig.
- Renderer-Proofs duerfen keine Runtime-Dependency, kein externes UI-Framework und keine Host-Typen im RMT-Kernel einfuehren.
- Browser-Lab-Proofs benennen Smoke- und Safety-Pfade; Performance-, Complexity- und Bundle-Budget-Freigabe folgt in `NFM-WP-19`.

## Source Gates

```bash
node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json
node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json
node scripts/run_xtend_tests.js rmt-syntax-growth --json
node scripts/run_xtend_tests.js rmt-action-effect-data-resource-primitives --json
node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json
node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json
node scripts/run_xtend_tests.js rmt-component-template-primitives --json
node scripts/run_xtend_tests.js rmt-vnext-composition --json
node scripts/run_xtend_tests.js rmt-vnext-surfaces --json
node scripts/run_xtend_tests.js rmt-vnext-security --json
node scripts/run_xtend_tests.js rmt-vnext-events --json
node scripts/run_xtend_tests.js rmt-state-selector-runtime --json
node scripts/run_xtend_tests.js rmt-event-routing-runtime --json
node scripts/run_xtend_tests.js rmt-action-effect-runtime --json
node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json
node scripts/run_xtend_tests.js rmt-app-platform-fixture --json
node scripts/run_xtend_tests.js native-first-form-navigation-media --json
node scripts/run_xtend_tests.js native-first-overlay-focus --json
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
node scripts/run_xtend_tests.js contract-runtime-parity --json
node scripts/run_xtend_tests.js references --json
```

## Nicht-Ziele

- keine neue produktive Renderer-Implementierung neben `xtendrmt/rmt-dom-descriptor-renderer.js`
- keine Freigabe von freien HTML-Sinks, Inline-Handlern oder JavaScript-URL-Bypaessen
- keine vollstaendige Surface-/Portal-Maximalitaetsbehauptung
- keine Performance-, Complexity- oder Bundle-Budget-Freigabe vor `NFM-WP-19`
- kein Import von Browser-, Host- oder Component-Typen in den RMT-Kernel

## Handoff

| Folgepaket | Handoff |
|------------|---------|
| `NFM-WP-19` | uebernimmt Browser-Lab-, Safety-, Performance-, Complexity- und Bundle-Budget-Plaene aus den Proof-Fixtures |
| `NFM-WP-20` | kann Authoring Guides auf DOM Descriptor Default, Trusted-DOM-Boundary und verbotene Sink-Bypaesse zuschneiden |
| `surface-browser-lab` | kann Surface-/Portal-/Overlay-Proofs gegen echte Browser-Fokus- und Popover/Dialog-Pfade haerten |
| `owned-data-display-package` | muss spaetere Collection-/Grid-Proofs weiterhin ueber structured DOM statt HTML-Bypass fuehren |

## Akzeptanz

| Kriterium | Entscheidung |
|-----------|--------------|
| DOM Descriptor Renderer, Trusted DOM und Complete-UI-Recipes sind verbunden | erfuellt |
| native Element-, Text-, Fragment-, Attribute-, URL-, Property- und Event-Grenzen sind als Proofs erfasst | erfuellt |
| unsichere HTML-Sinks und Inline-Bypaesse bleiben blockiert | erfuellt |
| Browser-Lab-Proofs sind fuer WP-19 budgetierbar, aber noch keine Performance-Claims | erfuellt |
| Keine neue Runtime-Dependency oder externe UI-Framework-Kopplung wird eingefuehrt | erfuellt |

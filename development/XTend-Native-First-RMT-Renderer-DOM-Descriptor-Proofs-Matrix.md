# XTend Native-First RMT Renderer DOM Descriptor Proofs Matrix

- Status: `accepted by NFM-WP-18`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1`
- Proof Matrix: `xtend.native-first.rmt-renderer-dom-descriptor-proof-matrix.v1`
- Proof Item Schema: `xtend.native-first.rmt-renderer-dom-descriptor-proof.v1`
- Fixture Schema: `xtend.native-first.rmt-renderer-dom-descriptor-proof-fixture.v1`
- Fixture Pack: `xtend.native-first.rmt-renderer-dom-descriptor-proof-fixtures.v1`
- Report Schema: `xtend.native-first.rmt-renderer-dom-descriptor-proofs-report.v1`
- Source Recipe Matrix: `development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md`
- Source DOM Renderer Docs: `docs/rmt-dom-descriptor-renderer.md`
- Source Trusted DOM Policy: `development/XTend-Trusted-DOM-und-Sanitizing-Policy.md`
- Fixture Pack: `tests/fixtures/native-first/rmt-renderer-dom-descriptor-proof-fixtures.json`
- Local Gate: `node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json`

## Bewertungsrahmen

WP-18 bewertet Renderer-Proofs nach vier Fragen:

- Wird normale UI-Ausgabe ueber strukturierte DOM Descriptor Records statt HTML-Strings materialisiert?
- Sind native Element-, Text-, Fragment-, Attribute-, URL-, Property- und Event-Grenzen benannt?
- Sind Trusted-DOM- und Sanitizing-Grenzen fuer HTML-Fragmente explizit statt implizit?
- Bleiben Surface-, Browser-Lab-, Budget- und Produktclaims als Handoff oder Residual sichtbar?

Pflichtfelder je Proof-Zeile: `proofId`, `proofClass`, `sourceRecipes`, `sourceSyntaxDecisions`, `sourcePrimitiveDecisions`, `status`, `uiSurfaces`, `rmtDomains`, `nativePrimitivePlan`, `trustBoundaryPlan`, `runtimeGates`, `browserLabPlan`, `forbiddenSinks`, `blockedClaims`, `sourceMapPlan`, `fixture`, `expectedOutcome`, `owner`, `nextHandoff`.

## Proof Matrix

| Proof-ID | Proof Class | Source Recipes | Source Syntax Decisions | Source Primitive Decisions | Status | UI Surfaces | RMT Domains | Native Primitive Plan | Trust Boundary Plan | Runtime Gates | Browser Lab Plan | Forbidden Sinks | Blocked Claims | Source Map Plan | Fixture | Expected Outcome | Owner | Next Handoff |
|----------|-------------|----------------|-------------------------|----------------------------|--------|-------------|-------------|-----------------------|---------------------|---------------|------------------|-----------------|----------------|-----------------|---------|------------------|-------|--------------|
| `NFM-RDP-01` | `structured-dom-descriptor-materialization` | `NFM-RCR-01`, `NFM-RCR-02`, `NFM-RCR-09` | `NFM-RSG-01`, `NFM-RSG-02`, `NFM-RSG-07` | `NFM-RAE-02`, `NFM-RAE-05` | `proof-accepted` | `app-shell`, `dashboard-layout`, `docs-shell`, `template-slot-materialization` | `templates`, `slots`, `components`, `routes`, `sourceMap` | `document.createElement`, `document.createTextNode`, `document.createDocumentFragment`, `Element.replaceChildren`, `keyed-child-reuse` | `descriptor-only-output`, `no-html-string-renderer`, `diagnostic-source-map-required` | `rmt-dom-descriptor-renderer`, `rmt-component-template-primitives`, `rmt-vnext-composition`, `rmt-app-platform-fixture` | `dom-node-materialization-smoke`, `slot-replacement-smoke`, `source-map-dom-anchor-smoke` | `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `template.innerHTML`, `document.write` | `none` | `descriptor sourceRef to /templates/{index}; slot sourceRef to /slots/{index}` | `NFM-RDP-FIX-01` | `accepted-structured-dom-materialization-proof` | `rmt-renderer-security-owner` | `NFM-WP-19`, `NFM-WP-20` |
| `NFM-RDP-02` | `surface-portal-overlay-proof` | `NFM-RCR-04`, `NFM-RCR-05` | `NFM-RSG-03`, `NFM-RSG-06` | `NFM-RAE-02`, `NFM-RAE-04`, `NFM-RAE-07` | `proof-accepted-with-surface-residual` | `overlay`, `portal`, `focus-scope`, `surface-stack`, `modal-action` | `surfaces`, `slots`, `events`, `actions`, `effects`, `securityPolicies`, `sourceMap` | `HTMLElement`, `HTMLDialogElement`, `popover`, `inert`, `focus`, `AbortController` | `surface-trust-policy-required`, `effect-policy-required`, `release-on-owner-dispose` | `rmt-vnext-surfaces`, `rmt-dom-descriptor-renderer`, `native-first-overlay-focus`, `rmt-vnext-security`, `rmt-action-effect-runtime` | `portal-attach-detach-smoke`, `focus-return-smoke`, `escape-dismiss-smoke`, `inert-boundary-smoke` | `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `onclick`, `javascript:` | `no-complete-surface-maximality-claim` | `surface sourceRef to /surfaces/{index}; effect sourceRef to /effects/{index}` | `NFM-RDP-FIX-02` | `accepted-with-surface-runtime-residual` | `component-overlay-owner` | `NFM-WP-19`, `surface-browser-lab` |
| `NFM-RDP-03` | `trusted-dom-sanitizing-proof` | `NFM-RCR-04`, `NFM-RCR-09` | `NFM-RSG-08` | `NFM-RAE-08` | `proof-accepted` | `trusted-rich-content`, `docs-progressive-boot`, `diagnostic-boundary` | `securityPolicies`, `templates`, `components`, `dataSources`, `diagnostics`, `sourceMap` | `TrustedHTML`, `URL`, `textContent`, `setAttribute`, `replaceChildren` | `trusted-dom-boundary-required`, `sanitizer-policy-required`, `unsafe-html-sink-forbidden` | `epic13-trusted-dom-boundary`, `rmt-vnext-security`, `contract-runtime-parity`, `references` | `trusted-html-boundary-smoke`, `sanitizer-refusal-smoke`, `redacted-diagnostic-smoke` | `innerHTML`, `insertAdjacentHTML`, `template.innerHTML`, `eval(`, `new Function`, `javascript:` | `unsafe-html-sink-forbidden` | `securityPolicy sourceRef to /securityPolicies/{index}; diagnostics sourceRef to /diagnostics/{index}` | `NFM-RDP-FIX-03` | `accepted-trusted-dom-boundary-proof` | `security-owner` | `NFM-WP-19`, `NFM-WP-20` |
| `NFM-RDP-04` | `attribute-url-property-boundary-proof` | `NFM-RCR-08`, `NFM-RCR-09` | `NFM-RSG-02`, `NFM-RSG-07` | `NFM-RAE-05`, `NFM-RAE-07` | `proof-accepted` | `media-preview`, `docs-link`, `resource-cleanup`, `diagnostic-boundary` | `components`, `templates`, `resources`, `effects`, `securityPolicies`, `sourceMap` | `setAttribute`, `removeAttribute`, `URL`, `dataset`, `property-allowlist`, `AbortController` | `url-policy-required`, `property-allowlist-required`, `resource-owner-required` | `rmt-dom-descriptor-renderer`, `rmt-action-effect-runtime`, `rmt-surface-resource-graph-runtime`, `rmt-vnext-security` | `safe-url-smoke`, `property-allowlist-smoke`, `object-url-release-smoke` | `srcdoc`, `javascript:`, `innerHTML`, `outerHTML`, `onerror` | `javascript-url-forbidden` | `attribute sourceRef to /components/{index}; resource sourceRef to /resources/{index}` | `NFM-RDP-FIX-04` | `accepted-attribute-url-property-boundary-proof` | `rmt-renderer-security-owner` | `NFM-WP-19`, `NFM-WP-20` |
| `NFM-RDP-05` | `event-listener-and-action-ref-proof` | `NFM-RCR-03`, `NFM-RCR-05`, `NFM-RCR-07` | `NFM-RSG-06`, `NFM-RSG-08` | `NFM-RAE-01`, `NFM-RAE-02`, `NFM-RAE-08` | `proof-accepted` | `form-submit`, `navigation-feedback`, `command-action-placeholder`, `scheduler-lane` | `events`, `actions`, `effects`, `state`, `schedules`, `sourceMap` | `addEventListener`, `EventTarget`, `CustomEvent`, `AbortController`, `structured-payload` | `action-ref-required`, `payload-shape-required`, `inline-handler-forbidden` | `rmt-event-routing-runtime`, `rmt-action-effect-runtime`, `rmt-vnext-events`, `rmt-dom-descriptor-renderer` | `event-listener-smoke`, `action-ref-routing-smoke`, `abort-listener-cleanup-smoke` | `onclick`, `onchange`, `javascript:`, `eval(`, `function ` | `inline-handler-forbidden` | `event sourceRef to /events/{index}; action sourceRef to /actions/{index}` | `NFM-RDP-FIX-05` | `accepted-event-action-ref-proof` | `rmt-event-action-owner` | `NFM-WP-19`, `NFM-WP-20` |
| `NFM-RDP-06` | `browser-lab-proof-budget-handoff` | `NFM-RCR-01`, `NFM-RCR-02`, `NFM-RCR-04`, `NFM-RCR-08`, `NFM-RCR-09` | `NFM-RSG-01`, `NFM-RSG-02`, `NFM-RSG-03`, `NFM-RSG-07` | `NFM-RAE-02`, `NFM-RAE-05`, `NFM-RAE-07` | `proof-handoff-to-budget-gate` | `app-shell`, `dashboard-layout`, `overlay`, `media-preview`, `docs-shell` | `templates`, `slots`, `surfaces`, `resources`, `diagnostics`, `sourceMap` | `PerformanceObserver`, `MutationObserver`, `requestAnimationFrame`, `DocumentFragment`, `replaceChildren` | `safety-before-budget-claim`, `redacted-diagnostics-required`, `no-production-budget-claim-before-nfm-wp19` | `rmt-complete-ui-recipes`, `rmt-dom-descriptor-renderer`, `native-first-evidence-pack`, `contract-runtime-parity` | `browser-render-smoke`, `mutation-budget-baseline`, `interaction-safety-smoke`, `visual-baseline-plan` | `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `createContextualFragment` | `no-production-budget-claim-before-nfm-wp19` | `browserLab sourceRef to /sourceMap/{index}; metric sourceRef to /diagnostics/{index}` | `NFM-RDP-FIX-06` | `handoff-to-native-first-budget-gates` | `performance-owner` | `NFM-WP-19` |

## Status Summary

| Status | Anzahl | Proof-IDs |
|--------|--------|-----------|
| `proof-accepted` | 4 | `NFM-RDP-01`, `NFM-RDP-03`, `NFM-RDP-04`, `NFM-RDP-05` |
| `proof-accepted-with-surface-residual` | 1 | `NFM-RDP-02` |
| `proof-handoff-to-budget-gate` | 1 | `NFM-RDP-06` |

## Coverage Summary

| Proof-Flaeche | Entscheidung |
|---------------|--------------|
| Strukturierte DOM-Materialisierung | accepted ueber vorhandenen DOM Descriptor Renderer |
| Surface, Portal und Overlay | accepted mit Surface-Maximality-Residual |
| Trusted DOM und Sanitizing | accepted ueber explizite Trusted-DOM-Boundary |
| Attribute, URL und Property | accepted ueber Allowlists, URL-Policy und Resource Owner |
| Event Listener und ActionRef | accepted ueber deklarative ActionRefs statt Inline-Handler |
| Browser-Lab und Budgets | Handoff an `NFM-WP-19`, keine Budgetfreigabe in WP-18 |

## Handoff

| Folgepaket | Startbare Proof-Evidence |
|------------|--------------------------|
| `NFM-WP-19` | alle Proof-Fixtures fuer Performance-, Complexity-, Bundle-, Browser-Smoke- und Visual-Evidence-Budgets |
| `NFM-WP-20` | `NFM-RDP-01`, `NFM-RDP-03`, `NFM-RDP-04`, `NFM-RDP-05` fuer Authoring Guides und Sink-Regeln |
| `surface-browser-lab` | `NFM-RDP-02` fuer echte Dialog-/Popover-/Focus-/Inert-Browserpfade |
| `owned-data-display-package` | spaetere Data-Display-Proofs muessen structured DOM und Trust-Gates uebernehmen |

## Akzeptanz

| Kriterium | Entscheidung |
|-----------|--------------|
| sechs Renderer-Proof-Zeilen sind dokumentiert | erfuellt |
| DOM Descriptor Renderer und Trusted-DOM-Policy sind als Source Gates verbunden | erfuellt |
| verbotene HTML-, URL- und Event-Bypaesse sind je Proof sichtbar | erfuellt |
| Surface-Maximality und Budget-Claims bleiben als Residual/Handoff sichtbar | erfuellt |
| WP-19 und WP-20 sind aus Proof-Evidence startbar | erfuellt |

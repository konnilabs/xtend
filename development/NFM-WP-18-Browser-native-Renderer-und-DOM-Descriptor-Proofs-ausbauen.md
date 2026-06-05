# NFM-WP-18 - Browser-native Renderer- und DOM-Descriptor-Proofs ausbauen

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1`
- Proof Matrix: `xtend.native-first.rmt-renderer-dom-descriptor-proof-matrix.v1`
- Proof Item Schema: `xtend.native-first.rmt-renderer-dom-descriptor-proof.v1`
- Fixture Schema: `xtend.native-first.rmt-renderer-dom-descriptor-proof-fixture.v1`
- Fixture Pack: `xtend.native-first.rmt-renderer-dom-descriptor-proof-fixtures.v1`
- Report Schema: `xtend.native-first.rmt-renderer-dom-descriptor-proofs-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json`
- Package Script: `npm run test:rmt-renderer-dom-descriptor-proofs`
- Fuehrender Contract: `development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Contract.md`
- Fuehrende Matrix: `development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Matrix.md`
- Fixture Pack: `tests/fixtures/native-first/rmt-renderer-dom-descriptor-proof-fixtures.json`

## Ziel

WP-18 belegt, dass RMT-Output browsernah ueber DOM Descriptor Records materialisiert werden kann, ohne manuelle HTML-Sinks, Inline-Handler oder JavaScript-URL-Bypaesse zu oeffnen. Das Paket setzt auf WP-17 Complete-UI-Recipes, den vorhandenen Epic18 DOM Descriptor Renderer und die Epic13 Trusted-DOM-Boundary.

## Umgesetzte Artefakte

| Artefakt | Ergebnis |
|----------|----------|
| `development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Contract.md` | definiert Contract, Proof Schema, Statusmodell, Grenzen, Source Gates und Handoffs |
| `development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Matrix.md` | erfasst sechs Proof-Zeilen fuer DOM, Surface, Trusted DOM, Attribute/URL/Property, Events und Browser-Lab-Handoff |
| `tests/fixtures/native-first/rmt-renderer-dom-descriptor-proof-fixtures.json` | enthaelt maschinenlesbare Proof-Fixtures mit Browser-Lab-, Trust- und blocked-Claim-Plaenen |
| `tests/native-first/native_first_rmt_renderer_dom_descriptor_proofs_suite.js` | prueft Contract, Matrix, Fixtures, Quellen, Registry, Roadmap, Package-Metadaten und Runner |
| `package.json` | ergaenzt `xtend.nativeFirstRmtRendererDomDescriptorProofs` und `npm run test:rmt-renderer-dom-descriptor-proofs` |
| `scripts/run_xtend_tests.js` | registriert Suite-ID `rmt-renderer-dom-descriptor-proofs` |
| `development/XTend-Native-First-Contract-Registry.md` | fuehrt WP-18 als Native-First-Contract-Index-Eintrag |

## Proof Outcomes

| Status | Anzahl | Proofs |
|--------|--------|--------|
| `proof-accepted` | 4 | `NFM-RDP-01`, `NFM-RDP-03`, `NFM-RDP-04`, `NFM-RDP-05` |
| `proof-accepted-with-surface-residual` | 1 | `NFM-RDP-02` |
| `proof-handoff-to-budget-gate` | 1 | `NFM-RDP-06` |

## Positive Proof-Oberflaechen

| Proof-Flaeche | Fuehrende Proofs | Entscheidung |
|---------------|------------------|--------------|
| Strukturierte DOM-Materialisierung | `NFM-RDP-01` | accepted ueber DOM Descriptor Renderer |
| Surface, Portal und Overlay | `NFM-RDP-02` | accepted mit Surface-Maximality-Residual |
| Trusted DOM und Sanitizing | `NFM-RDP-03` | accepted ueber explizite Trusted-DOM-Boundary |
| Attribute, URL und Property | `NFM-RDP-04` | accepted ueber Allowlists und URL-Policy |
| Event Listener und ActionRef | `NFM-RDP-05` | accepted ueber deklarative ActionRefs |
| Browser-Lab und Budget-Handoff | `NFM-RDP-06` | Handoff an `NFM-WP-19` |

## Blockierte Claims

| Claim | Entscheidung |
|-------|--------------|
| freie HTML-Sinks fuer normale UI | bleibt verboten |
| Inline-Handler oder JavaScript-URL-Bypaesse | bleibt verboten |
| vollstaendige Surface-/Portal-/Overlay-Maximality | bleibt Residual bis `surface-browser-lab` und WP-19 |
| produktive Performance-, Complexity- und Bundle-Budget-Claims | bleiben bis `NFM-WP-19` offen |

## Verifikation

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

## Handoff

| Folgepaket | Startstatus nach WP-18 |
|------------|------------------------|
| `NFM-WP-19` | `ready`; kann Proof-Fixtures in Performance-, Complexity-, Bundle-, Browser-Smoke- und Visual-Evidence-Budgets uebersetzen |
| `NFM-WP-20` | `planned`; kann Authoring Guides fuer DOM Descriptor Default, Trusted DOM und verbotene Sinks ableiten |
| `surface-browser-lab` | `planned`; kann Surface-/Portal-/Overlay-Proofs browserreal haerten |
| `owned-data-display-package` | `planned`; muss spaetere Collection-Proofs ohne HTML-Bypass fuehren |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| DOM Descriptor Renderer, Trusted DOM und Complete-UI-Recipes sind als Proof-Kette verbunden | erfuellt |
| Native Element-, Text-, Fragment-, Attribute-, URL-, Property- und Event-Grenzen sind dokumentiert | erfuellt |
| Unsichere HTML-, URL- und Event-Bypaesse bleiben blockiert | erfuellt |
| Browser-Lab- und Budget-Handoffs sind fuer WP-19 startbar | erfuellt |
| Kein neues Runtime-Dependency oder externes UI-Framework wird eingefuehrt | erfuellt |

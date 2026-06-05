# NFM-WP-16 - RMT Action-, Effect-, Data- und Resource-Primitives erweitern

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.rmt-action-effect-data-resource-primitives.v1`
- Primitive Matrix: `xtend.native-first.rmt-action-effect-data-resource-primitives-matrix.v1`
- Primitive Item Schema: `xtend.native-first.rmt-action-effect-data-resource-primitive.v1`
- Fixture Schema: `xtend.native-first.rmt-action-effect-data-resource-fixture.v1`
- Fixture Pack: `xtend.native-first.rmt-action-effect-data-resource-fixtures.v1`
- Report Schema: `xtend.native-first.rmt-action-effect-data-resource-primitives-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-action-effect-data-resource-primitives --json`
- Package Script: `npm run test:rmt-action-effect-data-resource-primitives`
- Fuehrender Contract: `development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Contract.md`
- Fuehrende Matrix: `development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Matrix.md`
- Fixture Pack: `tests/fixtures/native-first/rmt-action-effect-data-resource-fixtures.json`

## Ziel

WP-16 macht App-Interaktion und Datenfluss declarativ authorbar, ohne freie Runtime-Ausfuehrung zu erlauben. Das Paket schneidet Form Binding, Command Action Binding, Resource Query Lifecycle, Effect Policy, DataSource Policy, Command/Search Resource Binding, Resource Cleanup und die Reject-Regeln fuer freie Runtime-Ausfuehrung als Native-First-RMT-Primitives.

## Umgesetzte Artefakte

| Artefakt | Ergebnis |
|----------|----------|
| `development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Contract.md` | definiert Contract, Primitive Schema, Statusmodell, Grenzen, Source Gates und Handoffs |
| `development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Matrix.md` | entscheidet acht Primitive-, Policy-, Deferral- und Reject-Zeilen |
| `tests/fixtures/native-first/rmt-action-effect-data-resource-fixtures.json` | enthaelt positive, negative und Handoff-Fixtures |
| `tests/native-first/native_first_rmt_action_effect_data_resource_suite.js` | prueft Contract, Matrix, Fixtures, Registry, Roadmap, Package-Metadaten und Runner |
| `package.json` | ergaenzt `xtend.nativeFirstRmtActionEffectDataResourcePrimitives` und `npm run test:rmt-action-effect-data-resource-primitives` |
| `scripts/run_xtend_tests.js` | registriert Suite-ID `rmt-action-effect-data-resource-primitives` |
| `development/XTend-Native-First-Contract-Registry.md` | fuehrt WP-16 als Native-First-Contract-Index-Eintrag |

## Entscheidungen

| Kategorie | Anzahl | Primitives |
|-----------|--------|------------|
| `accept-action-binding` | 2 | `NFM-RAE-01`, `NFM-RAE-02` |
| `accept-resource-lifecycle` | 2 | `NFM-RAE-03`, `NFM-RAE-07` |
| `accept-effect-policy` | 1 | `NFM-RAE-04` |
| `accept-datasource-policy` | 1 | `NFM-RAE-05` |
| `defer-owned-ui-primitive` | 1 | `NFM-RAE-06` |
| `reject-free-runtime-execution` | 1 | `NFM-RAE-08` |

## Positive Primitive-Oberflaechen

| Primitive Surface | Fuehrende Primitive | Bedingung |
|-------------------|---------------------|-----------|
| `form-action`, `validation-result`, `result-state` | `NFM-RAE-01` | Payload- und Result-Shape sind sichtbar |
| `command-action`, `event-action-ref`, `status-state` | `NFM-RAE-02` | Command UI bleibt owned-primitive-residual |
| `resource-query`, `loading-success-error-cancel`, `resource-owner` | `NFM-RAE-03` | Resource Owner und Release sind Pflicht |
| `feedback-effect`, `navigation-effect`, `focus-effect`, `lazy-import-effect`, `side-effect-policy` | `NFM-RAE-04` | Effects brauchen Policy Records und injizierte Adapter |
| `datasource-policy`, `adapter-ref`, `payload-shape`, `result-shape` | `NFM-RAE-05` | DataSource Adapter bleiben injiziert |
| `object-url`, `stream`, `observer`, `timer`, `lazy-import` | `NFM-RAE-07` | Cleanup ist owner- oder cancel-gebunden |

## Blockierte Claims

| Claim | Entscheidung |
|-------|--------------|
| fertige DataGrid-, Table-, Tree- und VirtualList-Paritaet | bleibt blockiert bis `owned-data-display-package` existiert |
| fertige Command Palette-, Autocomplete- und rich Combobox-Paritaet | bleibt blockiert bis `owned-command-search-package` existiert |
| freie Handler-Funktionen, Eval, Inline-JavaScript oder Inline-HTML in RMT Actions | bleibt verboten durch `NFM-RAE-08` |
| Kernel-Netzwerkzugriff ohne injizierten Adapter | bleibt verboten durch `NFM-RAE-05` |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-action-effect-data-resource-primitives --json
node scripts/run_xtend_tests.js rmt-syntax-growth --json
node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json
node scripts/run_xtend_tests.js rmt-vnext-events --json
node scripts/run_xtend_tests.js rmt-vnext-security --json
node scripts/run_xtend_tests.js rmt-state-selector-runtime --json
node scripts/run_xtend_tests.js rmt-action-effect-runtime --json
node scripts/run_xtend_tests.js rmt-event-routing-runtime --json
node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json
node scripts/run_xtend_tests.js rmt-app-platform-fixture --json
node scripts/run_xtend_tests.js native-first-form-navigation-media --json
node scripts/run_xtend_tests.js native-first-market-pattern-parity --json
node scripts/run_xtend_tests.js contract-runtime-parity --json
node scripts/run_xtend_tests.js references --json
```

## Handoff

| Folgepaket | Startstatus nach WP-16 |
|------------|------------------------|
| `NFM-WP-17` | `completed`; hat Complete-UI-Recipe-Fixtures fuer Form Binding, Command Action, Resource Query, DataSource Policy, Cleanup und weitere UI-Klassen gebaut |
| `NFM-WP-18` | `ready`; kann Trusted-DOM-, URL-, Effect- und Bypass-Proofs pruefen |
| `NFM-WP-19` | `planned`; kann Action-, Effect-, Resource- und Adapter-Komplexitaet budgetieren |
| `owned-data-display-package` | `planned`; bleibt Voraussetzung fuer Data Display UI-Claims |
| `owned-command-search-package` | `planned`; bleibt Voraussetzung fuer Command/Search UI-Claims |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| RMT kann App-Interaktion und Datenfluss ohne freie Runtime-Ausfuehrung authoren | erfuellt |
| Action-, Effect-, DataSource- und Resource-Primitives sind als Matrix geschnitten | erfuellt |
| positive, negative und Handoff-Fixtures sind vorhanden | erfuellt |
| bestehende Epic18 Runtime-Gates bleiben Source-of-Truth fuer Runtime-Verhalten | erfuellt |
| `NFM-WP-17` ist aus WP-16 startbar | erfuellt |

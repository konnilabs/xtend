# NFM-WP-14 - RMT UI Primitive Gap Analysis erstellen

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.rmt-ui-primitive-gap.v1`
- Matrix Schema: `xtend.native-first.rmt-ui-primitive-gap-matrix.v1`
- Gap Item Schema: `xtend.native-first.rmt-ui-primitive-gap-item.v1`
- Report Schema: `xtend.native-first.rmt-ui-primitive-gap-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json`
- Package Script: `npm run test:rmt-ui-primitive-gap`
- Fuehrende Matrix: `development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md`
- Fuehrender Contract: `development/XTend-Native-First-RMT-UI-Primitive-Gap-Contract.md`

## Ziel

WP-14 quantifiziert, welche UI-Faehigkeiten RMT fuer praktisch jede XTend-App-UI bereits besitzt und welche noch fehlen. Das Ergebnis ist bewusst kein Syntax-Implementierungs-Paket. Es ist die belastbare Gap-Basis fuer Syntax Growth, Resource/Data-Erweiterungen, Complete-UI-Fixtures und Renderer-Proofs.

## Umgesetzte Artefakte

| Artefakt | Ergebnis |
|----------|----------|
| `development/XTend-Native-First-RMT-UI-Primitive-Gap-Contract.md` | definiert Contract, Gap Item Schema, Gap Classes, Coverage Status, Grenzen und Source Gates |
| `development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md` | bewertet `NFM-MP-01` bis `NFM-MP-12` in 12 Gap-Zeilen |
| `tests/native-first/native_first_rmt_ui_primitive_gap_suite.js` | prueft Contract, Matrix, Registry, Roadmap, Package-Metadaten und Gate-Registrierung |
| `package.json` | ergaenzt `xtend.nativeFirstRmtUiPrimitiveGapAnalysis` und `npm run test:rmt-ui-primitive-gap` |
| `scripts/run_xtend_tests.js` | registriert Suite-ID `rmt-ui-primitive-gap` |
| `development/XTend-Native-First-Contract-Registry.md` | fuehrt WP-14 als Native-First-Contract-Index-Eintrag |

## Bewertete Quellen

| Quelle | genutzte Evidence |
|--------|-------------------|
| `development/XTend-Native-First-UI-Primitive-Capability-Matrix.md` | `NFM-CAP-07`, `NFM-CAP-08`, `NFM-CAP-14`, `NFM-CAP-15`, `NFM-CAP-16`, `NFM-CAP-17`, `NFM-CAP-18` als RMT-relevante oder fehlende Capabilities |
| `development/XTend-Native-First-Market-Pattern-Parity-Matrix.md` | `NFM-MP-01` bis `NFM-MP-12`, insbesondere Data Display und Command/Search als negative Claims |
| `development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md` | RMT Core Format, Surface Registry und Trusted-DOM-Residuals |
| `development/XTend-Native-First-Audit-Evidence-Pack.md` | releasefaehige Eingabe fuer Contract-, Security-, Dependency- und Redaction-Evidence |
| `development/XTendRMT-vNext-Core-Format-Contract.md` | RMT Core Domains fuer Templates, Surfaces, Slots, Events, DataSources und Security Policies |
| `development/XTendRMT-vNext-Surface-Registry-Contract.md` | Surface-Typen und Surface Registry Residuals |
| Epic18 RMT App Platform Gates | DOM Descriptor, Component Template, State Selector, Action Effect, Event Routing, Surface Resource Graph und App Platform Fixture Evidence |

## Ergebnis

| Kategorie | Anzahl | Gap-IDs |
|-----------|--------|---------|
| `authorable-now` | 3 | `NFM-RUG-04`, `NFM-RUG-08`, `NFM-RUG-10` |
| `authorable-with-adapter-residual` | 4 | `NFM-RUG-01`, `NFM-RUG-03`, `NFM-RUG-05`, `NFM-RUG-09` |
| `contract-only-gap` | 1 | `NFM-RUG-06` |
| `syntax-growth-needed` | 2 | `NFM-RUG-02`, `NFM-RUG-07` |
| `owned-primitive-needed` | 2 | `NFM-RUG-11`, `NFM-RUG-12` |

## Blockierte Claims

| Claim | Entscheidung |
|-------|--------------|
| fertige DataGrid-, Table-, Tree- und VirtualList-Paritaet | bleibt blockiert bis owned Data Display package existiert |
| fertige Command Palette-, Autocomplete- und rich Combobox-Paritaet | bleibt blockiert bis owned Command/Search package existiert |
| vollstaendige RMT UI-Maximality ohne Syntax Growth | bleibt blockiert bis WP-15 Route/Layout/Surface/Collection/Command Syntax entscheidet |
| vollstaendige Resource/Data UI-Familie | bleibt blockiert bis WP-16 Resource Query Lifecycle und Data UI-Vertrag schneidet |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json
node scripts/run_xtend_tests.js native-first-market-pattern-parity --json
node scripts/run_xtend_tests.js contract-runtime-parity --json
node scripts/run_xtend_tests.js native-first-evidence-pack --json
node scripts/run_xtend_tests.js rmt-vnext-compiler --json
node scripts/run_xtend_tests.js rmt-vnext-scheduler --json
node scripts/run_xtend_tests.js rmt-vnext-surfaces --json
node scripts/run_xtend_tests.js rmt-vnext-composition --json
node scripts/run_xtend_tests.js rmt-vnext-events --json
node scripts/run_xtend_tests.js rmt-vnext-security --json
node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json
node scripts/run_xtend_tests.js rmt-component-template-primitives --json
node scripts/run_xtend_tests.js rmt-state-selector-runtime --json
node scripts/run_xtend_tests.js rmt-action-effect-runtime --json
node scripts/run_xtend_tests.js rmt-event-routing-runtime --json
node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json
node scripts/run_xtend_tests.js rmt-app-platform-tooling --json
node scripts/run_xtend_tests.js rmt-app-platform-fixture --json
node scripts/run_xtend_tests.js rmt-native-shell-migration --json
node scripts/run_xtend_tests.js epic18-rmt-app-platform --json
```

## Handoff

| Folgepaket | Startstatus nach WP-14 |
|------------|------------------------|
| `NFM-WP-15` | `ready`; entscheidet Syntax Growth fuer Layout, Route Shell, Surface/Portal und Collection/Command Source Records |
| `NFM-WP-16` | `completed`; hat Action-, Effect-, DataSource- und Resource-Primitives fuer `NFM-RUG-03`, `NFM-RUG-05`, `NFM-RUG-06` und `NFM-RUG-12` entschieden |
| `NFM-WP-17` | `completed`; hat Complete-UI-Recipe-Fixtures aus den priorisierten Gaps gebaut |
| `NFM-WP-18` | `planned`; prueft DOM Descriptor und Trusted-DOM-Browserproofs |
| `NFM-WP-19` | `planned`; budgetiert Performance, Complexity und Bundle Claims |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Vergleich von RMT Core Domains, vNext Syntax, Component Metadata, Surface Runtime und UI Primitive Matrix ist dokumentiert | erfuellt |
| Gap-Klassen `syntax`, `core-record`, `adapter`, `component-contract`, `security-policy`, `tooling` und `docs` sind definiert | erfuellt |
| Priorisierung nach `app-authorable-without-manual-shell` ist vorhanden | erfuellt |
| Konkrete RMT-Erweiterungen ohne Kernel-Host-Kopplung sind benannt | erfuellt |
| `NFM-WP-15` und `NFM-WP-16` sind aus der Matrix startbar | erfuellt |

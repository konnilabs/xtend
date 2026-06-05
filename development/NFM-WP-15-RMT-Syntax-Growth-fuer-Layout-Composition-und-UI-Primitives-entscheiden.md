# NFM-WP-15 - RMT Syntax Growth fuer Layout, Composition und UI-Primitives entscheiden

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.rmt-syntax-growth.v1`
- Decision Matrix: `xtend.native-first.rmt-syntax-growth-decision-matrix.v1`
- Decision Item Schema: `xtend.native-first.rmt-syntax-growth-decision.v1`
- Migration Fixture Schema: `xtend.native-first.rmt-syntax-growth-migration-fixture.v1`
- Migration Fixture Pack: `xtend.native-first.rmt-syntax-growth-migration-fixtures.v1`
- Report Schema: `xtend.native-first.rmt-syntax-growth-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-syntax-growth --json`
- Package Script: `npm run test:rmt-syntax-growth`
- Fuehrender Contract: `development/XTend-Native-First-RMT-Syntax-Growth-Contract.md`
- Fuehrende Matrix: `development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md`
- Migration Fixtures: `tests/fixtures/native-first/rmt-syntax-growth-migration-fixtures.json`

## Ziel

WP-15 entscheidet die aus `NFM-WP-14` abgeleiteten Syntax-Growth-Luecken fuer Layout, Composition, Surface, Route Shell, Data Display und Command/Search. Das Paket implementiert keine Syntax. Es definiert, welche Syntax wachsen darf, welche Core-Records nur vorbereitet werden, welche Claims blockiert bleiben und welche Migration-Fixtures spaetere Compiler-/Runtime-Arbeit pruefbar machen.

## Umgesetzte Artefakte

| Artefakt | Ergebnis |
|----------|----------|
| `development/XTend-Native-First-RMT-Syntax-Growth-Contract.md` | definiert Contract, Decision Schema, Statusmodell, Grenzen, Source Gates und Handoffs |
| `development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md` | entscheidet acht Syntax-/Core-/Owned-Primitive-/Reject-Zeilen |
| `tests/fixtures/native-first/rmt-syntax-growth-migration-fixtures.json` | enthaelt positive, negative und Handoff-Migration-Fixtures |
| `tests/native-first/native_first_rmt_syntax_growth_suite.js` | prueft Contract, Matrix, Fixtures, Registry, Roadmap, Package-Metadaten und Runner |
| `package.json` | ergaenzt `xtend.nativeFirstRmtSyntaxGrowth` und `npm run test:rmt-syntax-growth` |
| `scripts/run_xtend_tests.js` | registriert Suite-ID `rmt-syntax-growth` |
| `development/XTend-Native-First-Contract-Registry.md` | fuehrt WP-15 als Native-First-Contract-Index-Eintrag |

## Entscheidungen

| Kategorie | Anzahl | Decisions |
|-----------|--------|-----------|
| `accept-syntax-growth` | 3 | `NFM-RSG-02`, `NFM-RSG-03`, `NFM-RSG-07` |
| `accept-core-record-only` | 1 | `NFM-RSG-01` |
| `defer-owned-primitive` | 2 | `NFM-RSG-04`, `NFM-RSG-05` |
| `defer-to-wp16-resource-action` | 1 | `NFM-RSG-06` |
| `reject-imperative-or-html-bypass` | 1 | `NFM-RSG-08` |

## Positive Syntax-Growth-Oberflaechen

| Syntax Surface | Fuehrende Decision | Bedingung |
|----------------|--------------------|-----------|
| `layout`, `region`, `slot` | `NFM-RSG-02` | Compiler muss in `templates[]`, `slots[]`, `components[]` und `sourceMap[]` kompilieren |
| `surface`, `portal`, `overlay` | `NFM-RSG-03` | Renderer- und Trusted-DOM-Proof folgt in `NFM-WP-18` |
| `component-compose`, `part`, `props` | `NFM-RSG-07` | Component Contracts bleiben fuehrend, keine Framework-API-Emulation |

## Blockierte Claims

| Claim | Entscheidung |
|-------|--------------|
| Syntax Growth ist bereits produktiv implementiert | bleibt blockiert; WP-15 ist ein Decision Gate |
| fertige DataGrid-, Table-, Tree- und VirtualList-Paritaet | bleibt blockiert bis `owned-data-display-package` existiert |
| fertige Command Palette-, Autocomplete- und rich Combobox-Paritaet | bleibt blockiert bis `owned-command-search-package` existiert |
| Inline-JavaScript, Eval, Inline-HTML oder imperative Control-Flow-Syntax | bleibt verboten durch `NFM-RSG-08` |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-syntax-growth --json
node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json
node scripts/run_xtend_tests.js rmt-vnext-compiler --json
node scripts/run_xtend_tests.js rmt-vnext-composition --json
node scripts/run_xtend_tests.js rmt-vnext-surfaces --json
node scripts/run_xtend_tests.js rmt-vnext-events --json
node scripts/run_xtend_tests.js rmt-vnext-security --json
node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json
node scripts/run_xtend_tests.js rmt-component-template-primitives --json
node scripts/run_xtend_tests.js rmt-action-effect-runtime --json
node scripts/run_xtend_tests.js rmt-event-routing-runtime --json
node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json
node scripts/run_xtend_tests.js rmt-app-platform-tooling --json
node scripts/run_xtend_tests.js rmt-app-platform-fixture --json
node scripts/run_xtend_tests.js rmt-native-shell-migration --json
node scripts/run_xtend_tests.js native-first-market-pattern-parity --json
node scripts/run_xtend_tests.js contract-runtime-parity --json
node scripts/run_xtend_tests.js references --json
```

## Handoff

| Folgepaket | Startstatus nach WP-15 |
|------------|------------------------|
| `NFM-WP-16` | `completed`; hat Binding-, Action-, Effect-, DataSource-, Resource- und Command-Source-Records aus `NFM-RSG-05` und `NFM-RSG-06` entschieden |
| `NFM-WP-17` | `completed`; hat Complete-UI-Recipe-Fixtures aus Migration-Fixtures, positiven Syntax-Decisions und blockierten Claims gebaut |
| `NFM-WP-18` | `ready`; kann Surface-, Portal-, Overlay- und Trusted-DOM-Proofs aus `NFM-RSG-03` und `NFM-RSG-08` pruefen |
| `owned-data-display-package` | `planned`; muss Data Display Primitives schneiden, bevor positive Table-/Tree-/VirtualList-Claims erlaubt sind |
| `owned-command-search-package` | `planned`; muss Command/Search Primitives schneiden, bevor positive Command-Palette-/Autocomplete-Claims erlaubt sind |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| akzeptierter Syntax-Growth-Contract mit positiven, negativen und Migration-Fixtures | erfuellt |
| jede akzeptierte Syntax hat Core-Record-, Source-Map- und Diagnostics-Pfad | erfuellt |
| keine imperative Sprache, kein Inline-JavaScript und kein Inline-HTML als Bypass | erfuellt |
| keine neue Runtime-Dependency und keine RMT-Kernel-Host-Kopplung | erfuellt |
| `NFM-WP-16` ist aus WP-15 startbar | erfuellt |

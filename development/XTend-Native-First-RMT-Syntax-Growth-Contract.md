# XTend Native-First RMT Syntax Growth Contract

- Status: `accepted by NFM-WP-15`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-15-RMT-Syntax-Growth-fuer-Layout-Composition-und-UI-Primitives-entscheiden.md`
- Contract: `xtend.native-first.rmt-syntax-growth.v1`
- Decision Matrix: `xtend.native-first.rmt-syntax-growth-decision-matrix.v1`
- Decision Item Schema: `xtend.native-first.rmt-syntax-growth-decision.v1`
- Migration Fixture Schema: `xtend.native-first.rmt-syntax-growth-migration-fixture.v1`
- Migration Fixture Pack: `xtend.native-first.rmt-syntax-growth-migration-fixtures.v1`
- Report Schema: `xtend.native-first.rmt-syntax-growth-report.v1`
- Source Gap Contract: `xtend.native-first.rmt-ui-primitive-gap.v1`
- RMT Core Contract: `xtend.rmt.core-format.vnext.v1`
- RMT Grammar Contract: `xtend.rmt.vnext.grammar.v1`
- RMT Surface Contract: `xtend.rmt.vnext-surface-registry.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-syntax-growth --json`
- Boundary: `syntax-growth-decisions-only-no-runtime-implementation`
- Boundary: `compile-to-core-record-required`
- Boundary: `source-map-and-diagnostics-required`
- Boundary: `no-inline-javascript-or-unsafe-html-sink`
- Boundary: `no-imperative-control-flow`
- Boundary: `no-new-runtime-dependency`
- Boundary: `rmt-kernel-remains-host-neutral`
- Boundary: `migration-fixture-required-for-accepted-syntax`
- Boundary: `owned-primitive-needed-remains-negative-claim`
- Zielzustand: `rmt-syntax-growth-decisions-accepted`

## Zweck

Dieser Contract entscheidet, welche RMT-Syntax nach der Native-First-Mission wachsen darf. WP-15 ist dabei kein Compiler- oder Runtime-Paket. Es friert die Entscheidungsregeln, Core-Record-Ziele, Source-Map- und Diagnostics-Pfade sowie Migration-Fixtures ein, damit spaetere Implementierungen ohne Produktclaim-Drift starten koennen.

RMT-Syntax darf nur wachsen, wenn sie eine reale UI-Authoring-Luecke aus `NFM-WP-14` schliesst, deterministisch in bestehende oder explizit benannte Core-Records kompiliert, keine imperative Sprache einfuehrt und keine neue UI-Framework-Dependency in den Runtime-Default zieht.

## Scope

| Quelle | Rolle im WP-15-Gate |
|--------|---------------------|
| `development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md` | fuehrende Gap-Quelle fuer `NFM-RUG-01`, `NFM-RUG-02`, `NFM-RUG-07`, `NFM-RUG-11` und `NFM-RUG-12` |
| `development/XTendRMT-vNext-Grammar-Contract.md` | deklarative Sprachgrenze und Verbot von Inline-JavaScript, Inline-HTML, Eval und imperativem Control Flow |
| `development/XTendRMT-vNext-Core-Format-Contract.md` | Core-Ziel fuer `templates`, `surfaces`, `lanes`, `operations`, `slots`, `events`, `dataSources`, `securityPolicies` und `sourceMap` |
| `development/XTendRMT-vNext-Surface-Registry-Contract.md` | Surface-, Portal-, Overlay-, Panel-, Modal- und Workspace-Mapping |
| `development/XTend-Native-First-Market-Pattern-Parity-Matrix.md` | negative Produktclaims fuer Data Display, Command/Search und Framework-API-Emulation |
| `development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md` | Contract-to-Runtime-Residuals, die nicht durch Syntax-Sugar kaschiert werden duerfen |

## Decision Item Schema

`xtend.native-first.rmt-syntax-growth-decision.v1` muss je Entscheidungszeile diese Felder besitzen:

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `decisionId` | ja | stabile ID `NFM-RSG-xx` |
| `sourceGap` | ja | fuehrende Gap-ID aus `NFM-WP-14` oder `cross-cutting-security-boundary` |
| `proposal` | ja | Syntax-, Core-Record- oder Handoff-Vorschlag |
| `decision` | ja | eine Entscheidung aus dem Statusmodell |
| `syntaxSurface` | ja | betroffene RMT-Surface, zum Beispiel `layout`, `region`, `slot`, `surface`, `portal`, `component-compose`, `bind` |
| `coreRecordPlan` | ja | Ziel-Records oder `none` fuer abgelehnte Syntax |
| `sourceMapPlan` | ja | Source-Map-Anforderung oder `none` |
| `diagnosticPlan` | ja | erwartete Diagnostics oder `none` |
| `migrationFixture` | ja | Fixture-ID aus `xtend.native-first.rmt-syntax-growth-migration-fixture.v1` |
| `positiveClaim` | ja | erlaubter Claim nach WP-15 |
| `negativeClaim` | ja | weiterhin blockierter Claim |
| `owner` | ja | Owner-Rolle fuer Folgeumsetzung |
| `sourceGates` | ja | lokale Gates, die Entscheidung und Eingangsstatus absichern |
| `nextHandoff` | ja | Folgepaket, Runtime-WP oder Owned-Primitive-Paket |

## Decision Status Model

| Decision | Bedeutung |
|----------|-----------|
| `accept-syntax-growth` | Syntax-Sugar darf geplant werden, wenn er deterministisch in Core-Records, Source Maps und Diagnostics kompiliert |
| `accept-core-record-only` | Core-Record-Ausdruckskraft wird akzeptiert, aber Syntax-Sugar bleibt fuer das Paket nicht versprochen |
| `defer-owned-primitive` | RMT kann die UI-Familie nicht allein claimen; ein owned Component-/Primitive-Paket bleibt Voraussetzung |
| `defer-to-wp16-resource-action` | Action-, Effect-, Data- oder Resource-Ausdruckskraft geht an `NFM-WP-16` |
| `reject-imperative-or-html-bypass` | Syntax oder Migration ist verboten, weil sie imperative Sprache, Inline-JavaScript, Inline-HTML oder Trusted-DOM-Bypass einfuehrt |

## Syntax Growth Rules

- Jede `accept-syntax-growth`-Zeile braucht einen Core-Record-Plan, einen Source-Map-Plan, einen Diagnostic-Plan und mindestens ein Migration-Fixture.
- Syntax muss deklarativ bleiben. `if`, `for`, `while`, `switch`, `try`, `catch`, Funktionen, freie Function Calls, Eval, dynamische Imports und Inline-HTML sind keine RMT-Syntax-Growth-Oberflaechen.
- Syntax-Sugar kompiliert in Core-Records. Der Compiler darf keine Runtime-Sonderlogik verstecken, die nicht in `templates`, `surfaces`, `slots`, `events`, `operations`, `dataSources`, `securityPolicies` oder `sourceMap` sichtbar wird.
- Source Maps sind Pflicht fuer jede migrierbare Syntax, damit Diagnostics und Migration Notes auf Quellbereiche zeigen koennen.
- Diagnostics muessen deterministisch benannte Codes erhalten und duerfen keine Host-, Browser- oder Component-Interna in den RMT-Kernel importieren.
- Owned-Primitive-Luecken fuer Data Display und Command/Search bleiben negative Claims. Syntax kann vorbereiten, aber kein fertiges DataGrid-, Table-, Tree-, VirtualList-, Command-Palette-, Autocomplete- oder rich Combobox-Produktversprechen erzeugen.
- Keine Entscheidung darf eine neue Runtime-Dependency oder ein marktuebliches UI-Framework als Default einfuehren.

## Source Gates

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

## Nicht-Ziele

- keine Runtime-Implementierung neuer Syntax in WP-15
- kein Parser- oder Compiler-Code als Produktivpfad in WP-15
- kein fertiger DataGrid-, Table-, Tree-, VirtualList-, Command-Palette-, Autocomplete- oder rich Combobox-Claim
- keine imperative Sprache, keine Inline-JavaScript-Auswertung, kein Inline-HTML-Bypass
- keine Kopie von React-, Vue-, Angular-, Svelte-, Next- oder Nuxt-APIs
- keine neue Runtime-Dependency
- kein RMT-Kernel-Import von Host-, Component-, Browser- oder Framework-Typen

## Handoff

| Folgepaket | Handoff |
|------------|---------|
| `NFM-WP-16` | uebernimmt Resource-, Action-, Effect-, Data- und Command-Source-Records aus `NFM-RSG-05` und `NFM-RSG-06` |
| `NFM-WP-17` | hat positive und negative Complete-UI-Recipe-Fixtures gegen `NFM-RSG-02`, `NFM-RSG-03`, `NFM-RSG-07` und die Migration-Fixtures gebaut |
| `NFM-WP-18` | prueft Surface-, Portal-, Overlay- und Trusted-DOM-Renderer-Proofs fuer `NFM-RSG-03` |
| `owned-data-display-package` | schneidet Table-, Tree-, VirtualList- und Collection-View-Primitives vor positiven Data-Display-Claims |
| `owned-command-search-package` | schneidet Command Palette, Autocomplete und rich Combobox vor positiven Command/Search-Claims |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Decision Matrix besitzt positive, negative und Migration-Zeilen | erfuellt |
| Jede akzeptierte Syntax besitzt Core-Record-, Source-Map-, Diagnostics- und Migration-Fixture-Pfad | erfuellt |
| Owned-Primitive-Luecken bleiben negative Claims | erfuellt |
| Imperative Sprache und Inline-HTML/-JavaScript sind explizit abgelehnt | erfuellt |
| `NFM-WP-16`, `NFM-WP-17`, `NFM-WP-18` und Owned-Primitive-Pakete sind startbar | erfuellt |

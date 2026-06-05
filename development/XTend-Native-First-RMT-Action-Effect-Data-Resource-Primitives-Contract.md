# XTend Native-First RMT Action Effect Data Resource Primitives Contract

- Status: `accepted by NFM-WP-16`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-16-RMT-Action-Effect-Data-und-Resource-Primitives-erweitern.md`
- Contract: `xtend.native-first.rmt-action-effect-data-resource-primitives.v1`
- Primitive Matrix: `xtend.native-first.rmt-action-effect-data-resource-primitives-matrix.v1`
- Primitive Item Schema: `xtend.native-first.rmt-action-effect-data-resource-primitive.v1`
- Fixture Schema: `xtend.native-first.rmt-action-effect-data-resource-fixture.v1`
- Fixture Pack: `xtend.native-first.rmt-action-effect-data-resource-fixtures.v1`
- Report Schema: `xtend.native-first.rmt-action-effect-data-resource-primitives-report.v1`
- Source Gap Contract: `xtend.native-first.rmt-ui-primitive-gap.v1`
- Source Syntax Contract: `xtend.native-first.rmt-syntax-growth.v1`
- RMT Event Contract: `xtend.rmt.vnext-event-action-contract.v1`
- Runtime Source: `xtend.epic18.rmt-action-effect-runtime.v1`
- Runtime Source: `xtend.epic18.rmt-event-routing-runtime.v1`
- Runtime Source: `xtend.epic18.rmt-surface-resource-graph-runtime.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-action-effect-data-resource-primitives --json`
- Boundary: `declarative-action-resource-authoring-only`
- Boundary: `no-free-runtime-execution`
- Boundary: `no-inline-javascript-or-unsafe-html-sink`
- Boundary: `data-source-adapters-are-injected`
- Boundary: `resource-ownership-and-release-required`
- Boundary: `side-effects-require-policy-records`
- Boundary: `rmt-kernel-remains-host-neutral`
- Boundary: `owned-ui-primitive-gaps-remain-negative-claims`
- Boundary: `no-new-runtime-dependency`
- Zielzustand: `rmt-action-effect-data-resource-primitives-accepted`

## Zweck

Dieser Contract erweitert die Native-First-RMT-Mission um deklarative Action-, Effect-, DataSource- und Resource-Primitives. WP-16 nutzt die vorhandenen Epic18-Runtime-Flaechen als belegte Implementierungsbasis und schneidet darueber ein Native-First-Produktgate fuer App-Interaktion und Datenfluss.

Das Paket oeffnet keine freie Runtime-Ausfuehrung. App-Autoren duerfen Actions, Effects, DataSources, Resources, Binding-Policies, Result-State und Cleanup declarativ authoren. Adapter bleiben injiziert und ausserhalb des RMT-Kernels. Data Display und Command/Search bleiben UI-Primitive-Residuals, solange die Owned-Primitive-Pakete nicht existieren.

## Scope

| Quelle | Rolle im WP-16-Gate |
|--------|---------------------|
| `development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md` | fuehrende Gap-Quelle fuer `NFM-RUG-03`, `NFM-RUG-05`, `NFM-RUG-06` und `NFM-RUG-12` |
| `development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md` | Handoff fuer `NFM-RSG-05` und `NFM-RSG-06` |
| `development/XTendRMT-vNext-Event-Action-DataSource-Contract.md` | Event-, Action-, Action-Ref- und DataSource-Core-Vertrag |
| `development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md` | Parity-Residuals fuer Runtime-, Test-, Docs- und Report-Gegenstuecke |
| `development/XTend-Native-First-Market-Pattern-Parity-Matrix.md` | negative Claims fuer Data Display, Command/Search und Framework-API-Emulation |
| `catalog/epic18-rmt-action-effect-runtime.js` | belegte Runtime-Faehigkeiten fuer Actions, DataSources, Effects, Resources, Diagnostics und Cleanup |
| `xtendrmt/rmt-action-effect-runtime.js` | Runtime-Implementierung fuer `createRmtActionEffectRuntime` und `createRmtResourceManager` |
| `tests/fixtures/rmt-action-effect-runtime.rmt` | bestehende Runtime-Fixture fuer Fixture-, REST-, SSR- und Host-DataSources sowie Resource Ownership |

## Primitive Item Schema

`xtend.native-first.rmt-action-effect-data-resource-primitive.v1` muss je Zeile diese Felder besitzen:

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `primitiveId` | ja | stabile ID `NFM-RAE-xx` |
| `sourceGap` | ja | fuehrende Gap-ID aus `NFM-WP-14` oder `cross-cutting-security-boundary` |
| `sourceSyntaxDecision` | ja | fuehrende WP-15-Decision oder `none` |
| `proposal` | ja | kleinster Action-, Effect-, DataSource- oder Resource-Schnitt |
| `decision` | ja | Entscheidung aus dem Statusmodell |
| `primitiveSurface` | ja | betroffene Authoring-Oberflaeche |
| `rmtDomains` | ja | RMT Core- oder Runtime-Domains |
| `coreRecordPlan` | ja | Ziel-Records oder `none` fuer abgelehnte Ausfuehrung |
| `runtimeSurface` | ja | vorhandene Runtime- oder Adapter-Flaeche |
| `policyPlan` | ja | Policy-, Trust-, Adapter- oder Cleanup-Regel |
| `sourceMapPlan` | ja | Source-Map-Anforderung oder `none` |
| `diagnosticPlan` | ja | erwartete Diagnostics |
| `fixture` | ja | Fixture-ID aus `xtend.native-first.rmt-action-effect-data-resource-fixture.v1` |
| `positiveClaim` | ja | erlaubter Claim nach WP-16 |
| `negativeClaim` | ja | weiterhin blockierter Claim |
| `owner` | ja | Owner-Rolle fuer Folgeumsetzung |
| `sourceGates` | ja | lokale Gates, die Entscheidung und Eingangsstatus absichern |
| `nextHandoff` | ja | Folgepaket, Runtime-WP oder Owned-Primitive-Paket |

## Decision Status Model

| Decision | Bedeutung |
|----------|-----------|
| `accept-action-binding` | Action- oder Command-Binding ist declarativ authorbar, wenn Action-Refs, Payload Shapes, Result-State und Diagnostics vorhanden sind |
| `accept-resource-lifecycle` | Resource Query, Ownership, Cancel und Release sind als RMT-Primitive akzeptiert |
| `accept-datasource-policy` | DataSource-Adapter-Policy ist akzeptiert, solange Adapter injiziert bleiben und keine Kernel-Netzwerkausfuehrung entsteht |
| `accept-effect-policy` | Effects sind akzeptiert, wenn sie benannte Policy Records und erlaubte Adapter besitzen |
| `defer-owned-ui-primitive` | Daten- oder Command-UI bleibt blockiert, bis ein owned UI-Primitive-Paket existiert |
| `reject-free-runtime-execution` | Handler-Funktionen, Eval, Inline-JavaScript, Inline-HTML oder freie Side Effects sind verboten |

## Primitive Rules

- Actions muessen `payloadShape`, `resultShape` oder einen gleichwertigen Contract-Pfad besitzen, wenn sie Daten oder Validation Results uebernehmen.
- DataSources muessen ueber deklarierte Adapter laufen. REST, Host, SSR, Fixture, Endpoint, SSE und Worker-Pfade duerfen keinen Kernel-Netzwerk-Default erzeugen.
- Resources muessen Owner, Scope und Release-Verhalten besitzen. Object URLs, Streams, Observer, Timer und Lazy Imports duerfen nicht ohne Cleanup bleiben.
- Effects muessen benannte Policy Records nutzen. Feedback, Navigation, Focus, Lazy Import und Side Effect sind nur ueber explizite Runtime-Adapter erlaubt.
- Event Routing darf Action-Refs verbinden, aber keine freien Handler-Funktionen oder Inline-JavaScript ausfuehren.
- Data Display und Command/Search Records sind Datenfluss-faehig, aber kein positiver UI-Primitive-Claim.
- Jede akzeptierte Zeile braucht Fixture, Core-Record-Plan, Source-Map-Plan und Diagnostics.

## Source Gates

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

## Nicht-Ziele

- kein neues Produkt-Action-Framework neben RMT
- keine freie Runtime-Ausfuehrung, keine Handler-Funktionen, kein Eval
- keine Inline-HTML- oder String-Renderer-Flaeche
- kein fertiger DataGrid-, Table-, Tree-, VirtualList-, Command-Palette-, Autocomplete- oder rich Combobox-Claim
- kein Kernel-Netzwerkzugriff ohne injizierten Adapter
- keine neue Runtime-Dependency
- kein RMT-Kernel-Import von Host-, Component-, Browser- oder Framework-Typen

## Handoff

| Folgepaket | Handoff |
|------------|---------|
| `NFM-WP-17` | hat Complete-UI-Recipe-Fixtures fuer Form Binding, Command Action, Resource Query, DataSource Policy und Cleanup gebaut |
| `NFM-WP-18` | prueft Trusted-DOM-, URL-, Resource- und Side-Effect-Boundaries im Browser-/Renderer-Proof |
| `NFM-WP-19` | budgetiert Action-, Effect-, Resource- und Adapter-Komplexitaet |
| `owned-data-display-package` | bleibt erforderlich fuer positive Data Display UI-Claims |
| `owned-command-search-package` | bleibt erforderlich fuer positive Command Palette-, Autocomplete- und rich Combobox-Claims |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Form Binding, Command Action, Resource Query, Effect Policy, DataSource Policy und Cleanup sind als RMT-Primitives entschieden | erfuellt |
| App-Interaktion und Datenfluss sind ohne freie Runtime-Ausfuehrung authorbar | erfuellt |
| DataSource Adapter bleiben injiziert und kernel-neutral | erfuellt |
| Resource Ownership und Release sind Pflicht | erfuellt |
| Data Display und Command/Search UI-Claims bleiben blockiert | erfuellt |

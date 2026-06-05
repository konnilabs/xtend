# XTend Native-First Framework Leverage Layer Matrix

- Status: `accepted by NFM-WP-09`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.framework-leverage-layer-matrix.v1`
- Parent Contract: `xtend.native-first.framework-leverage-layer.v1`
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-09-Framework-Hebel-Layer-fuer-Theme-State-Events-Slots-und-Scheduler-schneiden.md`
- Capability Package: `NFM-OP-05`

## Framework-Hebel-Matrix

| ID | Hebel | Source-Evidence | Entscheidung | Residual |
|----|-------|-----------------|--------------|----------|
| `NFM-FL-01` | Theme Tokens, Density und CSS Parts | `design-tokens`, `xtheme-token-alias-layer`, `component-shell-theme-matrix` | `owned-framework-leverage-ready` | keine externe Design-System-Runtime |
| `NFM-FL-02` | Theme State und Propagation | `x-theme`, Component Network, Theme Matrix | `owned-framework-leverage-ready` | Theme Runtime bleibt Component Surface, nicht Kernel Surface |
| `NFM-FL-03` | State Selectors | `rmt-state-selector-runtime`, `xstateBridgeMode: injected-host-adapter` | `owned-framework-leverage-ready-with-residual` | `xstate` hat Catalog-Residuals, wird aber nicht vom RMT-Kernel importiert |
| `NFM-FL-04` | Component Network Events und Commands | `component-network-contract` | `owned-framework-leverage-ready` | kein global magic state |
| `NFM-FL-05` | Feedback, Status und Live Events | `feedback-status-ux`, Component Network | `owned-framework-leverage-ready` | native A11y/CSS Primitives bleiben `NFM-BPR-020` |
| `NFM-FL-06` | RMT Shell Slots und Component Composition | `rmt-shell-authoring-ux`, `rmt-vnext-composition` | `owned-framework-leverage-ready` | volle UI-Maximalitaet bleibt WP14/WP15 |
| `NFM-FL-07` | Declarative Event Routing | `rmt-event-routing-runtime`, `rmt-vnext-events` | `owned-framework-leverage-ready` | kein Produkt-Event-Framework, keine closest-only Delegation |
| `NFM-FL-08` | Scheduler Lanes und Fabric Mapping | `fabric-lane-mapping`, `rmt-vnext-scheduler` | `owned-framework-leverage-ready` | native scheduler-style APIs bleiben wrapped und budgetpflichtig |
| `NFM-FL-09` | Resource Lifecycle Handoff | `rmt-action-effect-runtime`, `rmt-shell-authoring-ux` | `contract-handoff-ready` | vollstaendige Resource UI-Familie bleibt `NFM-CAP-15`/WP14-WP16 |
| `NFM-FL-10` | Diagnostics und Release Evidence | Component UX Performance, Fabric telemetry, `diagnostics.snapshot` | `owned-framework-leverage-ready` | Budget-/Complexity-Gates bleiben WP19 |

## Capability-Handoff

| Capability | Vor WP-09 | WP-09 Entscheidung |
|------------|-----------|--------------------|
| `NFM-CAP-02` | `ready-as-owned` | Theme/Tokens/Density sind als Framework-Hebel bestaetigt |
| `NFM-CAP-03` | `ready-as-owned` | Controls nutzen Event-/Command-/Scheduler-Hebel aus Component Network und RMT Shell Authoring |
| `NFM-CAP-05` | `ready-as-owned` | Feedback/Status ist als Event-, Live-Region- und A11y-Hebel angebunden |
| `NFM-CAP-13` | `needs-hardening` | wird `ready-with-contract-residual`: State, Theme State und Component Network sind schneidbar; `xstate` bleibt Residual und Host-Adapter |
| `NFM-CAP-15` | `contract-only` | Resource Lifecycle bleibt als Handoff angebunden, aber keine fertige UI Primitive Familie |

## Grenzen

| Grenze | Entscheidung |
|--------|--------------|
| Externes UI-Framework | `reject-for-now` als Runtime-Default |
| Externe State-Library im RMT-Kernel | verboten |
| Impliziter globaler Event-Bus | verboten |
| Freie imperative RMT-Sprache | verboten |
| Scheduler ohne Contract Record | verboten |
| Theme Runtime ohne Token-/CSS-Part-Contract | verboten |
| Resource Lifecycle ohne Owner und Cleanup | nur als contract-handoff |

## Gate-Handoff

| Gate | Erwartung |
|------|-----------|
| `native-first-framework-leverage` | WP-09 Contract, Matrix, Roadmap, package script und Source-Gates bleiben synchron |
| `design-tokens` | Token-, Density-, Theme- und CSS-Part-Hebel bleiben lokal und gatebar |
| `xtheme-token-alias-layer` | Compatibility Alias Layer bleibt owned und lokal |
| `component-shell-theme-matrix` | Theme/Density/Motion werden als Shell Matrix geprueft |
| `component-network-contract` | Events, Commands, Contexts, Theme und State sind contractfaehig |
| `rmt-shell-authoring-ux` | Slots, Events, Commands und Schedules bleiben RMT Records |
| `rmt-state-selector-runtime` | State Selectors bleiben host-neutral und `xstate`-frei im Runtime-Modul |
| `rmt-event-routing-runtime` | Event Routing bleibt deklarativ und frameworkfrei |
| `fabric-lane-mapping` | Scheduler-Lanes werden als Fabric/RMT Records gemappt |
| `rmt-vnext-scheduler` | vNext Scheduler Policy bleibt host-neutral |
| `rmt-vnext-events` | vNext Event/Action Records bleiben compile-time-pruefbar |


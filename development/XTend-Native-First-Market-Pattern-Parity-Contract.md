# XTend Native-First Market Pattern Parity Contract

- Status: `accepted by NFM-WP-10`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.market-pattern-parity.v1`
- Matrix Contract: `xtend.native-first.market-pattern-parity-matrix.v1`
- Report Contract: `xtend.native-first.market-pattern-parity-report.v1`
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-10-Market-Pattern-Parity-Matrix-ohne-Framework-Abhaengigkeit-erstellen.md`
- Parent Contract: `xtend.native-first.framework-leverage-layer.v1`
- Local Gate: `node scripts/run_xtend_tests.js native-first-market-pattern-parity --json`
- Boundary: `market-patterns-not-framework-api-emulation`
- Boundary: `no-external-ui-framework-runtime`
- Boundary: `negative-claims-must-stay-visible`
- Boundary: `rmt-kernel-remains-host-neutral`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `docs-demo-claims-require-pattern-id`

## Zweck

WP-10 uebersetzt marktuebliche UI-Framework-Erwartungen in XTend-Faehigkeiten, ohne fremde Framework-APIs als Produktdefault zu kopieren. Die Matrix benennt fuer jedes Pattern, ob XTend die Erwartung nativ, mit owned Components, mit RMT Records, ueber Fabric Hooks, als docs-only Handoff oder als bewusste Luecke beantwortet.

Das Paket fuehrt keine Runtime-Dependency ein und legitimiert keine React-, Vue-, Angular-, Svelte-, Next- oder Router-API als XTend-Oberflaeche. Marktvergleich dient nur als Produktvokabular; die XTend-Antwort bleibt Contract-, Component-, RMT- und Fabric-basiert.

## Pattern-Kategorien

| Kategorie | XTend-Antwort |
|-----------|---------------|
| App Shell und Routing | owned Components, RMT Shell Authoring, Router/Link/Menu/Tabs und SSR Adapter |
| Layout und Composition | owned layout/list-like Components, CSS native Primitives und RMT Composition Records |
| Forms und Validation | owned form Components, native-backed Form Gates und RMT Form/Action Records |
| State und Theme State | RMT State Selector Runtime, Component Network, `x-theme` und injected Host Adapter |
| Events, Actions und Effects | Component Network, RMT Event Routing, Action/Effect Runtime und Resource Ownership |
| Transitions und Scheduling | Fabric Lanes, RMT Scheduler, Hydration Policy and Feedback Status Gates |
| SSR, Hydration und Error Handling | RMT Node/PHP SSR Adapter, Docs Prehydration, Hydration Policy and lifecycle/error contracts |
| Data Display und Command Search | negative claims until owned primitives are cut |

## Source Gates

| Gate | Rolle |
|------|-------|
| `native-first-framework-leverage` | Theme, State, Events, Slots, Scheduler and Diagnostics as framework levers |
| `native-first-form-navigation-media` | Forms, routing, list-like layout and media without framework dependency |
| `native-first-overlay-focus` | Overlay, Focus and Surface Stack as owned app-shell primitives |
| `form-controls-ux` | Form and validation product controls |
| `navigation-routing-ux` | Router, Link, Menu and Tabs app navigation |
| `layout-display-media-ux` | Layout, display and media shell maturity |
| `overlay-interaction-ux` | Dialog, Popover, Drawer, Tooltip and focus interaction maturity |
| `component-network-contract` | Events, Commands, Contexts, Theme and State contract layer |
| `rmt-shell-authoring-ux` | Slots, commands, events and schedules as RMT authoring surface |
| `rmt-state-selector-runtime` | State selector runtime without kernel import of `xstate` |
| `rmt-action-effect-runtime` | Actions, Effects, DataSources and Resource Ownership |
| `rmt-event-routing-runtime` | Declarative Event Routing without product event framework |
| `rmt-surface-resource-graph-runtime` | Surface, Portal, Overlay and Resource Graph lifecycle |
| `fabric-lane-mapping` | Scheduler-style work as Fabric/RMT lane records |
| `rmt-vnext-composition` | Component binding and slots as RMT records |
| `rmt-vnext-events` | Event, Action and Data Source contract surface |
| `rmt-vnext-scheduler` | Scheduler policy as host-neutral RMT contract |
| `hydration-policy` | visible, idle and lazy hydration as Fabric/RMT schedules |
| `rmt-node-ssr-adapter` | Node SSR and hydration adapter evidence |
| `rmt-php-ssr-adapter` | PHP/Laravel SSR and hydration adapter evidence |
| `docs-php-ssr-prehydration` | Docs app prehydration bridge evidence |
| `catalog-coverage` | Component catalog claims remain synchronized |
| `references` | Docs and demo reference paths stay reachable |
| `supply-chain` | no new runtime dependency and audit baseline |

## Claim-Regeln

| Regel | Entscheidung |
|-------|--------------|
| `parity-ready-owned` | Claim ist erlaubt, wenn owned Component/RMT/Fabric evidence existiert |
| `parity-ready-radar-watch` | Claim ist erlaubt, aber native primitive adoption bleibt ADR-pflichtig |
| `parity-contract-only` | Claim darf nur als Contract/Handoff beschrieben werden |
| `parity-docs-only` | Claim darf nur als Orientierung oder Migration-Hinweis erscheinen |
| `parity-gap-owned-primitive-needed` | Claim ist verboten, bis ein owned primitive package existiert |

## Negative Claims

| Pattern | Verbotener Claim | Erlaubte Aussage |
|---------|------------------|------------------|
| Data Grid, Table, Tree, Virtual List | XTend besitzt fertige Data-Grid-Parity | XTend hat eine bestaetigte Business-UI-Luecke und braucht ein owned package |
| Command Palette, Combobox, Autocomplete | XTend besitzt fertige Command/Search-Parity | XTend kann Basis-Selection kombinieren, beansprucht aber keine rich command/search primitive |
| Framework API Compatibility | XTend ist React/Vue/Angular/Svelte-kompatibel auf API-Ebene | XTend bildet vergleichbare Patterns ueber eigene Contracts ab |

## Handoff

- `NFM-WP-11` hat Pattern-IDs in die Contract Registry aufgenommen.
- `NFM-WP-14` muss RMT UI Gap Analysis gegen `NFM-MP-01` bis `NFM-MP-12` quantifizieren.
- Ein Folgeepic oder `NFM-WP-14` muss `NFM-OP-06` Data Display und ein Command/Search-Paket schneiden.
- `NFM-WP-19` kann Performance-, Complexity- und Bundle-Budgets pro Pattern anwenden.

# XTend Native-First Market Pattern Parity Matrix

- Status: `accepted by NFM-WP-10`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.market-pattern-parity-matrix.v1`
- Parent Contract: `xtend.native-first.market-pattern-parity.v1`
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-10-Market-Pattern-Parity-Matrix-ohne-Framework-Abhaengigkeit-erstellen.md`
- Parent Evidence: `development/XTend-Native-First-Framework-Leverage-Layer-Matrix.md`

## Market-Pattern-Parity-Matrix

| ID | Marktpattern | Framework-Erwartung | XTend-Antwort | Status | Residual / Grenze |
|----|--------------|---------------------|---------------|--------|-------------------|
| `NFM-MP-01` | App Shell und Routing | Route Records, Links, nested shells, navigation state | `x-router`, `x-link`, `x-tabs`, `x-menu`, RMT Shell Authoring, SSR Adapter | `parity-ready-radar-watch` | Navigation API bleibt Radar-Watch; keine Router-API-Kopie |
| `NFM-MP-02` | Layout und responsive Composition | Sections, cards, masonry, slots, responsive shells | owned layout/list-like Components, CSS native Primitives, RMT vNext Composition | `parity-ready-radar-watch` | Data Display wird nicht mit Layout verwechselt |
| `NFM-MP-03` | Forms und Validation | controlled inputs, validation, form submit, feedback | owned Form Controls, RMT Actions, native-backed FormData/Validation bridge | `parity-ready-radar-watch` | ElementInternals/FormData Adoption bleibt ADR-pflichtig |
| `NFM-MP-04` | State, Selectors und Theme State | local state, derived state, theme propagation | RMT State Selector Runtime, Component Network, `x-theme`, injected `xstateBridge` | `parity-ready-owned` | `xstate` bleibt Host Adapter und Kernel-frei |
| `NFM-MP-05` | Events, Actions und Commands | event handlers, action dispatch, command binding | Component Network, RMT Event Routing, RMT Action/Effect Runtime | `parity-ready-owned` | kein globaler Event-Bus, kein Produkt-Event-Framework |
| `NFM-MP-06` | Effects, DataSources und Resource Lifecycles | async effects, resource cleanup, datasource hooks | RMT Action/Effect Runtime, DataSources, Resource Ownership, Surface Resource Graph | `parity-contract-only` | UI-Familie fuer Resource/Data bleibt WP14/WP16 |
| `NFM-MP-07` | Slots, Portals und Surface Composition | component slots, portals, overlays, nested surfaces | RMT Shell Authoring, SurfaceManager, Surface Resource Graph, RMT vNext Composition | `parity-ready-owned` | Surface RMT Maximality wird in WP14 quantifiziert |
| `NFM-MP-08` | Transitions, Feedback und Scheduling | suspense-like feedback, transitions, scheduler lanes | Feedback Status UX, Fabric Lane Mapping, RMT vNext Scheduler, Hydration Policy | `parity-ready-owned` | Budget- und Complexity-Gates bleiben WP19 |
| `NFM-MP-09` | SSR, Hydration und Progressive Boot | SSR adapters, prehydration, lazy/idle hydration | RMT Node SSR, PHP SSR, Docs Prehydration, Fabric Hydration Policy | `parity-ready-owned` | Production bundle claims bleiben release-gate-pflichtig |
| `NFM-MP-10` | Error Boundaries und Diagnostics | error boundaries, lifecycle recovery, diagnostics | Component Lifecycle Error Boundary, Fabric diagnostics, Component Network diagnostics | `parity-ready-owned` | Recovery semantics bleiben Contract-/Audit-Flaeche |
| `NFM-MP-11` | Data Display Collections | table, tree, data grid, virtual list, collection controls | kein owned primitive package; nur negative claim und future package | `parity-gap-owned-primitive-needed` | `NFM-CAP-16`, `NFM-OP-06`, kein Data-Grid-Claim |
| `NFM-MP-12` | Command Palette und rich Search Controls | combobox, autocomplete, command palette, fuzzy actions | kein owned primitive package; `x-select` bleibt Basis-Selection | `parity-gap-owned-primitive-needed` | `NFM-CAP-17`, kein Command-/Autocomplete-Claim |

## Framework-Vergleichsgrenze

| Framework-Vokabular | XTend-Interpretation |
|---------------------|----------------------|
| React state/effects | RMT State Selectors, Action/Effect Runtime, Component Network |
| Vue/Svelte reactivity | Component Network, `x-theme`, selector runtime and RMT records |
| Angular forms/routing | owned Form Controls, Router/Link/Menu/Tabs, RMT actions |
| Next/Nuxt SSR | RMT Node/PHP SSR adapters and prehydration evidence |
| Router libraries | XTend Router/Link plus RMT route records |
| UI kits | owned Components, CSS Parts, Design Tokens and Theme Matrix |

Die Matrix erlaubt Produktvergleiche, aber keine API-Kompatibilitaetsbehauptung. Alle externen Framework-Namen sind Vergleichsvokabular, nicht Abhaengigkeit, nicht Export und nicht Default-API.

## Status-Legende

| Status | Bedeutung |
|--------|-----------|
| `parity-ready-owned` | Pattern ist ueber owned Components, RMT Records oder Fabric Hooks belegbar |
| `parity-ready-radar-watch` | Pattern ist belegbar, aber einzelne native Primitives bleiben ADR-pflichtig |
| `parity-contract-only` | Pattern ist nur als Contract/Handoff claimbar |
| `parity-docs-only` | Pattern ist nur als Orientierung oder Migration-Hinweis claimbar |
| `parity-gap-owned-primitive-needed` | Pattern ist blockiert, bis ein owned primitive package existiert |

## Priorisierung

| Prioritaet | Pattern | Folge |
|------------|---------|-------|
| `P0` | `NFM-MP-11` Data Display Collections | owned Data Display package schneiden |
| `P1` | `NFM-MP-12` Command Palette und rich Search Controls | owned Command/Search package schneiden |
| `P1` | `NFM-MP-06` Effects, DataSources und Resource Lifecycles | RMT UI Gap in WP14/WP16 quantifizieren |
| `P1` | `NFM-MP-09` SSR, Hydration und Progressive Boot | Budget- und release-gate-parity in WP19/WP20 fortfuehren |

## Capability-Mapping

| Capability | Pattern-IDs | Entscheidung |
|------------|-------------|--------------|
| `NFM-CAP-01` | `NFM-MP-01`, `NFM-MP-02`, `NFM-MP-07` | Custom Element Runtime ist Framework-Basis |
| `NFM-CAP-02` | `NFM-MP-02`, `NFM-MP-04`, `NFM-MP-08` | Theme/Tokens sind Pattern-Parity-Hebel |
| `NFM-CAP-04` | `NFM-MP-03`, `NFM-MP-05` | Forms/Validation sind owned-native-backed |
| `NFM-CAP-06` | `NFM-MP-07`, `NFM-MP-10` | Overlay/Focus ist parity-ready mit Radar-Watch |
| `NFM-CAP-08` | `NFM-MP-01` | Navigation ist ready, native Navigation API bleibt Watch |
| `NFM-CAP-09` | `NFM-MP-02`, `NFM-MP-11` | Layout ready, Data Display nicht claimed |
| `NFM-CAP-13` | `NFM-MP-04`, `NFM-MP-05` | State/Event-Hebel ready-with-contract-residual |
| `NFM-CAP-15` | `NFM-MP-06` | Resource/Data bleibt contract-only |
| `NFM-CAP-16` | `NFM-MP-11` | missing-owned-primitive |
| `NFM-CAP-17` | `NFM-MP-12` | missing-owned-primitive |
| `NFM-CAP-18` | `NFM-MP-01`, `NFM-MP-07`, `NFM-MP-10` | Shell/Workspace Composition bleibt RMT-Gap-relevant |

## Claim-Handoff

| Claim | Status |
|-------|--------|
| XTend kann App Shell, Routing, Forms, Overlay, Theme, State, Events, Slots, Scheduler, SSR und Hydration ohne externe UI-Framework-Dependency adressieren | `allowed-with-pattern-evidence` |
| XTend hat fertige Table/Tree/DataGrid/VirtualList Parity, Data Grid Parity oder Virtual List Parity | `blocked-negative-claim` |
| XTend hat fertige Command Palette/Autocomplete/Combobox Parity | `blocked-negative-claim` |
| XTend kopiert React/Vue/Angular/Svelte/Next APIs | `blocked-non-goal` |
| XTend nutzt Marktpatterns als Produktvokabular fuer eigene Contracts | `allowed` |

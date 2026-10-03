# XTend Native-First Form Navigation Media Hardening Matrix

- Status: `accepted by NFM-WP-08`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.form-navigation-media-hardening-matrix.v1`
- Parent Contract: `xtend.native-first.form-navigation-media-hardening.v1`
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-08-Owned-Form-List-Navigation-und-Media-Primitives-haerten.md`
- Capability Matrix: `development/XTend-Native-First-UI-Primitive-Capability-Matrix.md`
- Evidence Source: component manifest, Form Controls UX gate, Navigation Routing UX gate, Layout Display Media UX gate, catalog coverage, radar

## Baseline

| Quelle | Ergebnis |
|--------|----------|
| `components/manifest.json` | Form-, Navigation-, Layout- und Media-Komponenten sind lokale XTend-Komponenten |
| `xtend.component.form-controls-ux.v1` | `x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-calendar`, `x-form`, `x-writer` sind gatebar |
| `xtend.component.navigation-routing-ux.v1` | `x-router`, `x-link` sind als Router/Link UX gatebar; `x-tabs` und `x-menu` besitzen Navigation UX Profile |
| `xtend.component.layout-display-media-ux.v1` | Layout, Display, list-like Cards und Media Shells sind gatebar |
| `xtend.native-first.browser-primitive-radar.v2` | Form-, Navigation-, Layout- und Media-Primitives besitzen atomare terminale Entscheidungen |

## Hardening-Matrix

| ID | Primitive-Gruppe | Klasse | Status | Artefakte | Radar-Refs | Gate-Evidence | Naechster Schritt |
|----|------------------|--------|--------|-----------|------------|---------------|-------------------|
| `NFM-FNM-01` | Text Inputs und Textarea | `owned-native-backed` | `hardened-owned-terminal` | `x-input`, `x-textarea` | `NFM-BPR-003`, `NFM-BPR-004`, `NFM-BPR-020` | `form-controls-ux` | ElementInternals/Form Association bleiben XTend-gewrappte Pfade |
| `NFM-FNM-02` | Selection Controls und Calendar | `owned-native-backed` | `hardened-owned-terminal` | `x-select`, `x-checkbox`, `x-radio`, `x-calendar` | `NFM-BPR-003`, `NFM-BPR-004`, `NFM-BPR-020` | `form-controls-ux` | Selection bleibt nicht Autocomplete-/Command-Palette-Claim |
| `NFM-FNM-03` | Form Host, Validation und FormData Aggregation | `owned-native-backed` | `hardened-owned-terminal` | `x-form`, validation events, error regions, form data aggregation | `NFM-BPR-004` | `form-controls-ux` | Constraint Validation/FormData sind als XTend-Wrapper akzeptiert |
| `NFM-FNM-04` | Rich Text Entry und Writer | `owned-with-vendor-residual` | `hardened-owned-with-residual` | `x-writer`, form aggregation, Turndown residual | `NFM-BPR-001`, `NFM-BPR-016` | `form-controls-ux`, `supply-chain` | Vendor residual in `NFM-CAP-12` bleibt WP18/WP21 |
| `NFM-FNM-05` | Router und Link | `owned-native-backed` | `hardened-owned-with-rmt-followup` | `x-router`, `x-link`, route announcements, focus restore | `NFM-BPR-015`, `NFM-BPR-011`, `NFM-BPR-020` | `navigation-routing-ux` | WP14 quantifiziert RMT Route-/App-Shell-Gaps |
| `NFM-FNM-06` | Menu und Tabs Navigation | `owned` | `hardened-owned` | `x-menu`, `x-tabs`, nav tokens, keyboard path | `NFM-BPR-020` | `navigation-routing-ux`, `catalog-coverage` | WP09 kann Event/State/Scheduler-Hebel schneiden |
| `NFM-FNM-07` | List-like Display und Cards | `owned-native-backed` | `hardened-owned-terminal` | `x-cards`, `x-masonry`, `x-summary`, `x-section` | `NFM-BPR-009`, `NFM-BPR-013` | `layout-display-media-ux` | Container Queries akzeptiert; kein Table/Tree/VirtualList Claim |
| `NFM-FNM-08` | Media Player und Lightbox | `owned-native-backed` | `hardened-owned-terminal` | `x-player`, `x-lightbox`, lazy media, media commands | `NFM-BPR-018`, `NFM-BPR-010`, `NFM-BPR-020` | `layout-display-media-ux` | PiP capability-gated akzeptiert; Media Session abgelehnt |
| `NFM-FNM-09` | Data Display Table/Tree/VirtualList | `missing` | `missing-owned-primitive` | keine dedizierten `x-table`, `x-tree`, `x-list`, `x-virtual-list` Manifest-Komponenten | `NFM-BPR-013`, `NFM-BPR-009` | `native-first-form-navigation-media` negative claim check | `NFM-WP-10` oder Folgeepic |
| `NFM-FNM-10` | Command Palette, Autocomplete und rich Combobox | `missing` | `missing-owned-primitive` | keine dedizierten `x-command-palette`, `x-autocomplete`, `x-combobox` Manifest-Komponenten | `NFM-BPR-003`, `NFM-BPR-013` | `native-first-form-navigation-media` negative claim check | Folgepaket nach Market-Pattern-Priorisierung |
| `NFM-FNM-11` | RMT App Forms, Navigation und Media Authoring | `owned` | `hardened-owned-with-rmt-followup` | RMT fixtures fuer forms, navigation, layout/media | `NFM-BPR-001`, `NFM-BPR-012`, `NFM-BPR-013` | `form-controls-ux`, `navigation-routing-ux`, `layout-display-media-ux` | WP14 quantifiziert verbleibende UI Maximality |
| `NFM-FNM-12` | Dependency und Security Boundary | `owned` | `hardened-owned` | local components, no UI framework, no new runtime dependency | `NFM-BPR-016` | `supply-chain`, `references`, `catalog-coverage` | WP18 Trusted-DOM-/Renderer-Proofs |

## Native-Decision-Schnitt

| Primitive | Entscheidung | Status |
|-----------|--------------|--------|
| `ElementInternals` und form-associated Custom Elements | `wrap-as-xtend-primitive` | owned Forms bleiben fuehrend |
| Constraint Validation und FormData APIs | `wrap-as-xtend-primitive` | native Interop bleibt ADR-pflichtig |
| History API | `wrap-as-xtend-primitive` | `x-router` bleibt Owner |
| URLPattern und Navigation API | `reject-for-now` | `closed`; `x-router` bleibt Owner |
| CSS Container Queries | `adopt-native` | bestehender Layout-Pfad ist akzeptiert |
| Picture-in-Picture | `wrap-as-xtend-primitive` | capability-gated `x-player`-Pfad |
| Media Session | `reject-for-now` | `closed`; owned Media bleibt fuehrend |
| `focus-visible`, forced-colors, reduced-motion | `adopt-native` | bestehende A11y-CSS-Primitives bleiben erlaubt |

## Capability-Handoff

| Capability | WP-06 Status | WP-08 Entscheidung |
|------------|--------------|--------------------|
| `NFM-CAP-04` Forms, Validation und Input Composition | `ready-with-terminal-radar-decision` | owned Form Controls sind gehaertet; ElementInternals/Constraint Validation sind als Wrapper akzeptiert |
| `NFM-CAP-08` Navigation, Routing und App Shell | `needs-rmt-gap-analysis` | owned Router/Link/Tabs/Menu sind gehaertet; RMT Route-Ausdruckskraft bleibt WP14 |
| `NFM-CAP-09` Layout, Display und Content Surfaces | `ready-with-terminal-radar-decision` | list-like Layout/Display ist gehaertet; Container Queries sind akzeptiert; Data Grid/List wird nicht geclaimt |
| `NFM-CAP-10` Media Shells und Rich Media | `ready-with-terminal-radar-decision` | PiP ist capability-gated akzeptiert; Media Session ist terminal abgelehnt |
| `NFM-CAP-16` Data Display: Table, Tree, Virtual List und Collection Controls | `missing-owned-primitive` | bestaetigt missing; kein Framework-Parity-Claim |
| `NFM-CAP-17` Command Palette, Combobox und Autocomplete | `missing-owned-primitive` | bestaetigt missing; `x-select` bleibt Selection Control |

## Residuals

| Residual | Status | Owner-Folge |
|----------|--------|--------------|
| `ElementInternals` produktiv nutzen | `accepted-existing` | Wrapper- und Fallback-Vertrag aus `NFM-BPR-003` |
| Constraint Validation/FormData tiefer nativ integrieren | `accepted-existing` | Wrapper- und Fallback-Vertrag aus `NFM-BPR-004` |
| Navigation API/URLPattern produktiv nutzen | `closed` | `followUp: none` nach `NFM-BPR-015` |
| Media Session produktiv nutzen | `closed` | `followUp: none` nach `NFM-BPR-018`; PiP ist separat akzeptiert |
| Data Display Table/Tree/VirtualList | `missing-owned-primitive` | `NFM-WP-10` oder Folgeepic |
| Command Palette/Autocomplete/rich Combobox | `missing-owned-primitive` | Market-Pattern-Priorisierung |

## Gate-Matrix

| Gate | Erwartung |
|------|-----------|
| `native-first-form-navigation-media` | WP-08 Contract, Matrix, Roadmap, package script und existing gates bleiben synchron |
| `form-controls-ux` | Form Controls, Validation, State, Events, RMT und A11y bleiben gatebar |
| `navigation-routing-ux` | Router/Link, Route Announcements, Focus Restore und RMT bleiben gatebar |
| `layout-display-media-ux` | Layout, list-like Display, Media Shells und lazy media bleiben gatebar |
| `catalog-coverage` | Manifest und Component-Reife bleiben stabil |
| `references` | neue WP-08-Artefakte bleiben referenzierbar |
| `supply-chain` | keine neue Runtime-Dependency wurde eingefuehrt |

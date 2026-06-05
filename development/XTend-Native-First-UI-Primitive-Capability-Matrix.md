# XTend Native-First UI Primitive Capability Matrix

- Status: `accepted by NFM-WP-06`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.ui-primitive-capability-matrix.v1`
- Parent Contract: `xtend.native-first.ui-primitive-capability.v1`
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-06-XTend-UI-Primitive-Capability-Matrix-erstellen.md`
- Browser Primitive Radar: `xtend.native-first.browser-primitive-radar.v1`
- Component Contract: `xtend.component.contract.v2`
- Component Maturity Model: `xtend.component.maturity-model.v2`
- Vendor Replacement Matrix: `xtend.native-first.vendor-legacy-replacement-matrix.v1`
- Evidence Source: local component manifest, catalog coverage, scaffold capability contracts, radar, dependency and replacement matrices

## Baseline

| Quelle | Ergebnis |
|--------|----------|
| `components/manifest.json` | 45 lokale Component-Eintraege |
| `development/XTend-Component-Catalog-Coverage-Matrix.md` | 42 `enterprise-ready`, 2 `typed-contract-gated`, 1 `contract-gated` |
| `development/XTend-Component-Contract-v2.md` | Component Surface, RMT, Fabric, A11y, Performance und Docs als Pflichtdomains |
| `development/XTend-Native-First-Browser-Primitive-Radar.md` | `NFM-BPR-001` bis `NFM-BPR-020` fuer Native-Refs |
| `development/XTend-Native-First-Vendor-Legacy-Replacement-Matrix.md` | Prism, Turndown, Legacy Loader und x-icon Residuals klassifiziert |
| `xtend-builder/scaffold.config.js` | etablierte Capability-Gruppen fuer Forms, Feedback, Navigation, Overlay, Layout/Media, Surfaces und RMT Authoring |
| `development/XTend-Native-First-Overlay-Focus-Hardening-Matrix.md` | `NFM-OP-01` Overlay, Focus, Inert, Keyboard und Surface Stack durch `NFM-WP-07` gehaertet |
| `development/XTend-Native-First-Form-Navigation-Media-Hardening-Matrix.md` | `NFM-OP-02` und `NFM-OP-04` fuer Forms, Navigation, list-like Display und Media durch `NFM-WP-08` gehaertet |
| `development/XTend-Native-First-Framework-Leverage-Layer-Matrix.md` | `NFM-OP-05` fuer Theme, State, Events, Slots, Scheduler und Diagnostics durch `NFM-WP-09` geschnitten |
| `development/XTend-Native-First-Market-Pattern-Parity-Matrix.md` | Market Pattern Parity Matrix durch `NFM-WP-10` abgeschlossen; positive Claims und blockierte Claims getrennt |
| `development/XTend-Native-First-Contract-Registry.md` | Contract Registry durch `NFM-WP-11` abgeschlossen; Capability-, Component-, RMT-, Kernel-, Security-, Supply-Chain- und Release-Contract-IDs sind discoverable |

## Capability-Matrix

| ID | Capability | Klasse | Status | Komponenten / Artefakte | Radar-Refs | Bewertung | Naechster Schritt |
|----|------------|--------|--------|--------------------------|------------|-----------|-------------------|
| `NFM-CAP-01` | Custom Element Runtime und Component Shell | `owned-native-backed` | `ready-as-owned` | 45 Manifest-Komponenten, Component Contract v2, Maturity v2 | `NFM-BPR-002` | XTend besitzt lokale Web-Component-Primitives ohne externe UI-Framework-Dependency | Coverage halten, WP11 Registry und WP12 Parity Gate anbinden |
| `NFM-CAP-02` | Theme, Design Tokens, Density und CSS Parts | `owned` | `ready-as-owned` | `x-theme`, design-tokens, token contract, CSS parts, `NFM-WP-09` leverage matrix | `NFM-BPR-020` | stabiler Framework-Hebel fuer Brand, Theme, Density, Motion und Contrast; Framework-Hebel-Layer durch `NFM-WP-09` bestaetigt | Pattern-Parity durch `NFM-WP-10` abgeschlossen; `NFM-WP-19` Budgets |
| `NFM-CAP-03` | Controls und Interaction Basics | `owned` | `ready-as-owned` | `x-button`, `x-menu`, `x-tabs`, `x-link`, Component Network, `NFM-WP-09` leverage matrix | `NFM-BPR-002`, `NFM-BPR-020` | Basis-Controls sind lokal, typisiert und durch `NFM-WP-08` sowie Event-/Command-/Scheduler-Hebel aus `NFM-WP-09` bestaetigt | Pattern-Parity durch `NFM-WP-10` abgeschlossen |
| `NFM-CAP-04` | Forms, Validation und Input Composition | `owned-native-backed` | `ready-with-radar-watch` | `x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-calendar`, `x-form`, `x-writer`, `NFM-WP-08` hardening matrix | `NFM-BPR-003`, `NFM-BPR-004` | owned Form Controls sind durch `NFM-WP-08` gehaertet; ElementInternals/Constraint Validation und FormData bleiben Radar-Watch mit ADR-Pflicht | Browser-Lab ADRs nur bei produktiver Native-Adoption |
| `NFM-CAP-05` | Feedback, Status und Progress | `owned` | `ready-as-owned` | `x-alert`, `x-toast`, `x-status`, `x-progress`, `x-spinner`, Feedback Status UX, `NFM-WP-09` leverage matrix | `NFM-BPR-020` | lokale Live-/Status- und Feedback-Primitives sind als Event-, Command-, Live-Region- und Scheduler-Hebel durch `NFM-WP-09` angebunden | Pattern-Parity durch `NFM-WP-10` abgeschlossen |
| `NFM-CAP-06` | Overlay, Dialog, Popover, Drawer und Focus | `owned-native-backed` | `ready-with-radar-watch` | `x-modal`, `x-dialog`, `x-popover`, `x-tooltip`, `x-drawer`, overlay bridge, `NFM-WP-07` hardening matrix | `NFM-BPR-005`, `NFM-BPR-006`, `NFM-BPR-007`, `NFM-BPR-008`, `NFM-BPR-016`, `NFM-BPR-020` | owned Overlay-/Focus-Pfad ist durch `NFM-WP-07` gehaertet; native Dialog/Popover/Anchor bleiben Radar-Watch | Browser-Lab ADRs fuer native Dialog/Popover/Anchor nur bei Produktadoption |
| `NFM-CAP-07` | Surface Runtime und Multi-Window Shell | `owned` | `needs-rmt-gap-analysis` | `x-surface-manager`, `x-surface-window`, `x-side-panel`, `x-surface-portal`, `x-surface-region` | `NFM-BPR-005`, `NFM-BPR-011`, `NFM-BPR-012` | Komponenten und Controller existieren; native RMT Surfaces Domain bleibt Contract-/Follow-up-Pfad | `NFM-WP-14` und spaeter Surface-RMT-Follow-up |
| `NFM-CAP-08` | Navigation, Routing und App Shell | `owned-native-backed` | `needs-rmt-gap-analysis` | `x-router`, `x-link`, `x-tabs`, `x-menu`, shell authoring contracts, `NFM-WP-08` hardening matrix | `NFM-BPR-015`, `NFM-BPR-011` | owned Router/Link/Tabs/Menu-Pfad ist durch `NFM-WP-08` gehaertet; History/Navigation API und RMT Route-Ausdruckskraft brauchen Gap-Analyse | `NFM-WP-14` |
| `NFM-CAP-09` | Layout, Display und Content Surfaces | `owned-native-backed` | `ready-with-radar-watch` | `x-section`, `x-cards`, `x-header`, `x-footer`, `x-hero`, `x-type`, `x-masonry`, `x-summary`, `NFM-WP-08` hardening matrix | `NFM-BPR-009`, `NFM-BPR-013`, `NFM-BPR-020` | breite owned Display-Flaeche ist fuer list-like Layout durch `NFM-WP-08` gehaertet; Data Display wird nicht behauptet; Container Query Evidence bleibt Radar-Watch | Pattern-Parity durch `NFM-WP-10` abgeschlossen; `NFM-WP-19` |
| `NFM-CAP-10` | Media Shells und Rich Media | `owned-native-backed` | `ready-with-radar-watch` | `x-player`, `x-lightbox`, `NFM-WP-08` hardening matrix | `NFM-BPR-018`, `NFM-BPR-010` | owned Media-Shells sind durch `NFM-WP-08` gehaertet; Media Session/PiP bleibt Watch | Browser-Lab ADR nur bei produktiver Media Session/PiP-Adoption |
| `NFM-CAP-11` | Iconography und vendor-kompatible lokale Packs | `owned-vendor-adapter` | `accepted-residual` | `x-icon`, lokale Lucide-kompatible Packs | `NFM-BPR-002` | positives Pattern: vendor-kompatibel, aber owned, lokal und ohne CDN | als Adapter-Muster fuer WP09/WP10 nutzen |
| `NFM-CAP-12` | Code Highlighting und Rich Text Conversion | `vendor-backed` | `accepted-residual` | `x-code`/`components/prism.js`, `x-writer`/`components/turndown.js` | `NFM-BPR-001`, `NFM-BPR-016` | lokale Fassaden, aber Prism/Turndown bleiben vendored/HTML-nahe Residuals | `NFM-WP-18`, `NFM-WP-21` |
| `NFM-CAP-13` | State, Theme State und Component Network | `owned` | `ready-with-contract-residual` | `xstate`, `x-theme`, Component Network Contract, RMT State Selector Runtime, RMT Event Routing Runtime, Fabric Lane Mapping, `NFM-WP-09` leverage matrix | `NFM-BPR-012`, `NFM-BPR-014` | Kernhebel fuer marktuebliche Framework-Patterns ist durch `NFM-WP-09` schneidbar; `xstate` bleibt Host-Adapter/Residual und wird nicht in den RMT-Kernel importiert | Pattern-Parity durch `NFM-WP-10` abgeschlossen; `NFM-WP-14`, `NFM-WP-19` |
| `NFM-CAP-14` | RMT Component Authoring und DOM Descriptor Rendering | `owned` | `needs-rmt-gap-analysis` | RMT Component Metadata, DOM Descriptor Renderer, RMT-first fixtures | `NFM-BPR-001`, `NFM-BPR-012`, `NFM-BPR-013` | starkes Native-First Fundament; volle UI-Abdeckung wird in WP14 quantifiziert | `NFM-WP-14`, `NFM-WP-18` |
| `NFM-CAP-15` | Resource, Effects, Data und Storage UI-Faehigkeiten | `contract-only` | `needs-rmt-gap-analysis` | RMT action/effect/resource contracts, surface resource graph runtime | `NFM-BPR-017`, `NFM-BPR-019` | Faehigkeit existiert teilweise als RMT-/Runtime-Contract, aber noch nicht als vollstaendige UI Primitive Familie | `NFM-WP-14`, `NFM-WP-16` |
| `NFM-CAP-16` | Data Display: Table, Tree, Virtual List und Collection Controls | `missing` | `missing-owned-primitive` | keine dedizierten `x-table`, `x-tree`, `x-list`, `x-virtual-list` Manifest-Komponenten; `NFM-WP-10` hat die Luecke priorisiert und als blockierten Claim bestaetigt | `NFM-BPR-013`, `NFM-BPR-009` | groesste Framework-Parity-Luecke fuer Business-UIs; kein Data-Grid-Claim bis owned primitive package existiert | neues Owned-Primitive-Paket durch `NFM-WP-14` oder Folgeepic schneiden |
| `NFM-CAP-17` | Command Palette, Combobox und Autocomplete | `missing` | `missing-owned-primitive` | keine dedizierten `x-combobox`, `x-command-palette`, `x-autocomplete` Manifest-Komponenten; `NFM-WP-10` hat die Luecke priorisiert und als blockierten Claim bestaetigt | `NFM-BPR-003`, `NFM-BPR-013` | wichtig fuer SaaS-/IDE-Patterns; `x-select` bleibt Basis-Selection, kein rich Command/Search-Claim | owned Command/Search-Paket durch `NFM-WP-14` oder Folgeepic schneiden |
| `NFM-CAP-18` | Native Shell, Drawer/Panel/App Workspace Composition | `owned` | `needs-rmt-gap-analysis` | `x-drawer`, `x-side-panel`, `x-surface-manager`, native shell migration tests | `NFM-BPR-005`, `NFM-BPR-011`, `NFM-BPR-012` | gute owned Shell-Basis; RMT-Ausdruckskraft und Legacy-HTML-Migration bleiben Folgearbeit | `NFM-WP-14`, `NFM-WP-21` |

## P0/P1/P2-Capability-Schnitt

| Prioritaet | Capabilities | Grund |
|------------|--------------|-------|
| `P0` | `NFM-CAP-01`, `NFM-CAP-04`, `NFM-CAP-06`, `NFM-CAP-07`, `NFM-CAP-08`, `NFM-CAP-14`, `NFM-CAP-16` | Grundfaehigkeiten fuer App-Authoring, Overlay, Forms, Surfaces, Routing, RMT und Business-Data-UIs |
| `P1` | `NFM-CAP-02`, `NFM-CAP-03`, `NFM-CAP-05`, `NFM-CAP-09`, `NFM-CAP-10`, `NFM-CAP-13`, `NFM-CAP-15`, `NFM-CAP-17`, `NFM-CAP-18` | Framework-Hebel, Layout/Media, State, Resources und produktive App-Komposition |
| `P2` | `NFM-CAP-11`, `NFM-CAP-12` | akzeptierte Residuals und Utility-Flaechen mit Exit-Plan |

## Owned-Primitive-Pakete

| Paket | Prioritaet | Ziel | Capabilities | Folgepaket |
|-------|------------|------|--------------|------------|
| `NFM-OP-01` | P0 | Overlay, Focus, Dialog, Popover und Surface Stack haerten | `NFM-CAP-06`, `NFM-CAP-07`, `NFM-CAP-18` | `NFM-WP-07` |
| `NFM-OP-02` | P0 | Forms, Validation, Inputs, Writer und FormData-Bruecken haerten | `NFM-CAP-04`, `NFM-CAP-17` | `NFM-WP-08` |
| `NFM-OP-03` | P0 | RMT UI Authoring und DOM Descriptor als Standardpfad quantifizieren | `NFM-CAP-14`, `NFM-CAP-15`, `NFM-CAP-18` | `NFM-WP-14`, `NFM-WP-18` |
| `NFM-OP-04` | P1 | Navigation, App Shell, Layout und Media komplettieren | `NFM-CAP-08`, `NFM-CAP-09`, `NFM-CAP-10` | `NFM-WP-08`, `NFM-WP-14` |
| `NFM-OP-05` | P1 | Theme, State, Events, Slots und Scheduler als Framework-Hebel schneiden | `NFM-CAP-02`, `NFM-CAP-05`, `NFM-CAP-13` | `NFM-WP-09` |
| `NFM-OP-06` | P1 | Data Display und Business-UI Collection Primitives planen | `NFM-CAP-16` | `NFM-WP-10` hat priorisiert; Umsetzung in `NFM-WP-14` oder Folgeepic |
| `NFM-OP-08` | P1 | Command Palette, Combobox und Autocomplete als owned Search Primitives planen | `NFM-CAP-17` | `NFM-WP-10` hat priorisiert; Umsetzung in `NFM-WP-14` oder Folgeepic |
| `NFM-OP-07` | P2 | Vendor Utilities und Legacy Surfaces kontrolliert reduzieren | `NFM-CAP-11`, `NFM-CAP-12`, `NFM-CAP-18` | `NFM-WP-21` |

## Status-Zusammenfassung

| Klasse | Anzahl | Capabilities |
|--------|--------|--------------|
| `owned` | 7 | `NFM-CAP-02`, `NFM-CAP-03`, `NFM-CAP-05`, `NFM-CAP-07`, `NFM-CAP-13`, `NFM-CAP-14`, `NFM-CAP-18` |
| `owned-native-backed` | 6 | `NFM-CAP-01`, `NFM-CAP-04`, `NFM-CAP-06`, `NFM-CAP-08`, `NFM-CAP-09`, `NFM-CAP-10` |
| `owned-vendor-adapter` | 1 | `NFM-CAP-11` |
| `vendor-backed` | 1 | `NFM-CAP-12` |
| `contract-only` | 1 | `NFM-CAP-15` |
| `missing` | 2 | `NFM-CAP-16`, `NFM-CAP-17` |
| `legacy` | 0 | Legacy ist in dieser Matrix als Residual an betroffenen Capabilities markiert, nicht als eigene UI-Familie |

## Blockierende Luecken

| Luecke | Risiko | Folge |
|--------|--------|-------|
| Data Display ohne dedizierte owned Table/Tree/List Primitives | P0 fuer Business-Framework-Paritaet | `NFM-WP-10` hat die Luecke priorisiert; `NFM-WP-14` oder Folgeepic muss Paket schneiden |
| Command Palette, Autocomplete und rich Combobox ohne dedizierte owned Primitives | P1 fuer SaaS-/IDE-Framework-Paritaet | `NFM-WP-10` hat die Luecke priorisiert; `NFM-WP-14` oder Folgeepic muss Paket schneiden |
| Native Dialog/Popover/Anchor-Evidence fehlt fuer produktive Native-Adoption | P1/P0 je nach Overlay-Pfad | `NFM-WP-07` haertet owned Pfad; Produktadoption bleibt Browser-Lab ADR |
| RMT UI Maximality noch nicht quantitativ bewertet | P0 fuer "jede UI" Claim | `NFM-WP-14` |
| Prism/Turndown bleiben vendored Utility Residuals | P1 Security-/Audit-Flaeche | `NFM-WP-18`, `NFM-WP-21` |
| `xstate` ist nicht voll enterprise-ready in Catalog Coverage | P1 Framework-Hebel-Risiko | `NFM-WP-09` hat State-Hebel als injected Host-Adapter schneidbar gemacht; Coverage-Residual bleibt fuer `NFM-WP-19` oder Folgeepic |

## Nicht-Ziele

- keine Behauptung, dass jede UI bereits vollstaendig per RMT authorbar ist
- keine neue Runtime-Dependency fuer fehlende UI-Primitives
- keine Big-Bang-Migration bestehender Komponenten
- keine produktive Native-Adoption ohne Radar-Ref und ADR
- kein Re-Export fremder UI-Framework-APIs als XTend Contract

# XTend Native-First Form Navigation Media Hardening Contract

- Status: `accepted by NFM-WP-08`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-08-Owned-Form-List-Navigation-und-Media-Primitives-haerten.md`
- Contract: `xtend.native-first.form-navigation-media-hardening.v1`
- Matrix Contract: `xtend.native-first.form-navigation-media-hardening-matrix.v1`
- Report Contract: `xtend.native-first.form-navigation-media-hardening-report.v1`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Capability Contract: `xtend.native-first.ui-primitive-capability.v1`
- Adoption Gate: `xtend.native-first.primitive-adoption-gate.v1`
- Browser Primitive Radar: `xtend.native-first.browser-primitive-radar.v1`
- Component Contract: `xtend.component.contract.v2`
- Form Controls UX Contract: `xtend.component.form-controls-ux.v1`
- Navigation Routing UX Contract: `xtend.component.navigation-routing-ux.v1`
- Layout Display Media UX Contract: `xtend.component.layout-display-media-ux.v1`
- Boundary: `owned-app-primitives-before-framework-dependency`
- Boundary: `native-form-navigation-media-remain-radar-linked`
- Boundary: `missing-list-and-combobox-primitives-are-not-claimed`
- Boundary: `rmt-kernel-remains-host-neutral`
- Zielzustand: `native-first-owned-form-navigation-media-hardened`

## Zweck

Dieser Contract haertet `NFM-OP-02` und `NFM-OP-04`: Forms, Validation, Inputs, Navigation, App Shell, Layout und Media. Er buendelt die bestehenden Component-UX-Gates in der Native-First-Mission und trennt produktiv owned Faehigkeiten von bewusst fehlenden Framework-Parity-Primitives.

WP-08 fuehrt keine neue externe UI-Framework-Abhaengigkeit ein. Native Form-, Navigation-, Layout- und Media-Primitives bleiben an Radar, Adoption Gate und Browser-Lab-Evidence gebunden.

## Scope

| Bereich | Owned XTend-Pfad | Native-First-Entscheidung |
|---------|------------------|---------------------------|
| Text- und Value-Inputs | `x-input`, `x-textarea`, `x-select`, `x-checkbox`, `x-radio`, `x-calendar` | owned baseline bleibt fuehrend; ElementInternals bleibt Radar- und ADR-pflichtig |
| Form Host und Validation | `x-form`, validation events, form data aggregation | owned host validation bleibt fuehrend; Constraint Validation/FormData Adoption bleibt radar-linked |
| Rich Text Entry | `x-writer` | owned form primitive mit vendored conversion residual aus `NFM-CAP-12` |
| Navigation und App Shell | `x-router`, `x-link`, `x-tabs`, `x-menu` | owned routing/navigation bleibt fuehrend; Navigation API/URLPattern bleiben Radar-Watch |
| List-like Layout | `x-cards`, `x-masonry`, `x-summary`, `x-section` | owned display/list-like primitives, aber kein Data Grid/Table/Tree Claim |
| Media | `x-player`, `x-lightbox` | owned media shell bleibt fuehrend; Media Session/PiP bleiben Radar-Watch |
| RMT Authoring | Form, Navigation und Layout/Media RMT fixtures | authorbar ueber records/adapters/schedules, nicht ueber Inline-JS |

## Native Primitive Decisions

| Radar Ref | Primitive | Entscheidung fuer WP-08 | Produktfolge |
|-----------|-----------|-------------------------|--------------|
| `NFM-BPR-003` | `ElementInternals` und form-associated Custom Elements | `wrap-as-xtend-primitive` | bestehende owned Form Controls bleiben fuehrend; produktive native Adoption braucht Browser-Lab ADR |
| `NFM-BPR-004` | Constraint Validation und FormData APIs | `wrap-as-xtend-primitive` | `x-form` Aggregation bleibt Gate-Basis; native Interop bleibt ADR-pflichtig |
| `NFM-BPR-009` | CSS Container Queries | `adopt-candidate` | Layout-/List-like Primitives duerfen Radar-Evidence vorbereiten, kein ungepruefter Produktclaim |
| `NFM-BPR-013` | Resize/Mutation/Intersection Observer | `wrap-as-xtend-primitive` | Layout measurement, lazy hydration und diagnostics bleiben XTend-gesteuert |
| `NFM-BPR-015` | History, URLPattern und Navigation API Kandidaten | `defer-with-watch` | `x-router`/`x-link` bleiben owned; native Navigation API braucht WP14/WP18 Evidence |
| `NFM-BPR-018` | Media Session, PiP und media-control Primitives | `defer-with-watch` | `x-player`/`x-lightbox` bleiben owned; native Media-Adoption braucht Browser-Lab Evidence |
| `NFM-BPR-020` | `focus-visible`, forced-colors, reduced-motion CSS | `adopt-native` | A11y CSS Primitives bleiben unter Component-Gates erlaubt |

## Hardening Requirements

| Requirement | Pflicht |
|-------------|---------|
| `ownedForms` | Form Controls besitzen lokale Komponenten, Typen, Docs, RMT Metadata und UX Gate |
| `ownedNavigation` | Router/Link/Tabs/Menu besitzen lokale Runtime, A11y, events, commands und route-state Evidence |
| `ownedMedia` | Player/Lightbox besitzen lokale Runtime, RMT Metadata, lazy media und a11y/performance Evidence |
| `listClaimSafe` | Cards/Masonry/Summary duerfen als list-like Display gelten, aber nicht als Table/Tree/VirtualList |
| `comboboxClaimSafe` | `x-select` ist Selection Control, nicht Command Palette, Autocomplete oder rich Combobox |
| `rmtAuthorable` | Representative App Forms, Navigation und Media werden ueber RMT Records/Fixtures authorbar |
| `dependencySafe` | keine neue Runtime-Dependency und kein externes UI-Framework |
| `radarLinked` | Form-, Navigation-, Layout- und Media-Adoption referenziert Radar-IDs |

## Gate-Basis

| Gate | Rolle |
|------|------|
| `node scripts/run_xtend_tests.js native-first-form-navigation-media --json` | WP-08 Handoff- und Contract-Gate |
| `node scripts/run_xtend_tests.js form-controls-ux --json` | Form Controls, Validation, RMT Fixture und A11y |
| `node scripts/run_xtend_tests.js navigation-routing-ux --json` | Router, Link, Route Announcements, Focus und RMT Fixture |
| `node scripts/run_xtend_tests.js layout-display-media-ux --json` | Layout, list-like Display, Media Shells, Lazy Media und RMT Fixture |
| `node scripts/run_xtend_tests.js catalog-coverage --json` | Manifest-weite Component-Reife |
| `node scripts/run_xtend_tests.js references --json` | Dokumentations- und Pfad-Parity |
| `node scripts/run_xtend_tests.js supply-chain --json` | keine neue Runtime-Dependency ohne Policy |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Form-/Navigation-/Media-Hardening ist als Native-First Contract beschrieben | erfuellt |
| `NFM-CAP-04`, `NFM-CAP-08`, `NFM-CAP-09`, `NFM-CAP-10`, `NFM-CAP-16`, `NFM-CAP-17` sind angebunden | erfuellt |
| Native Form-, Navigation- und Media-Adoption bleibt radar-linked | erfuellt |
| Missing Data/List und Command/Autocomplete Primitives werden nicht geclaimt | erfuellt |
| RMT-Kernel bleibt host-neutral | erfuellt |
| Keine Runtime-Dependency wird eingefuehrt | erfuellt |
| Lokales WP-08-Gate ist definiert | erfuellt |


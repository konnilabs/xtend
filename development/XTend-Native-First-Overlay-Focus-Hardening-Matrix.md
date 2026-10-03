# XTend Native-First Overlay Focus Hardening Matrix

- Status: `accepted by NFM-WP-07`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.overlay-focus-hardening-matrix.v1`
- Parent Contract: `xtend.native-first.overlay-focus-hardening.v1`
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-07-Owned-Overlay-Dialog-Popover-und-Focus-Primitives-haerten.md`
- Capability Matrix: `development/XTend-Native-First-UI-Primitive-Capability-Matrix.md`
- Evidence Source: component manifest, Overlay Interaction UX gate, Surface Overlay Bridge gate, Surface Stack Policy gate, Surface Manager Quality gates

## Baseline

| Quelle | Ergebnis |
|--------|----------|
| `components/manifest.json` | `x-modal`, `x-dialog`, `x-popover`, `x-tooltip`, `x-drawer`, `x-side-panel`, `x-lightbox`, `x-surface-manager`, `x-surface-portal`, `x-surface-window`, `x-surface-region` sind lokale XTend-Komponenten |
| `xtend.component.overlay-interaction-ux.v1` | Focus Trap, Inert, Scroll Lock, Portal, Escape, RMT und Fabric Anforderungen sind gatebar |
| `xtend.surface.overlay-stack-bridge.v1` | bestehende Overlays koennen als Surface Records in den gemeinsamen Stack ueberfuehrt werden |
| `xtend.surface.stack-policy.v1` | Modal-, Focus-, Inert-, Escape- und Layer-Policy gehoert dem Surface Manager |
| `xtend.surface.quality-gates.v1` | Browser-, A11y-, Performance- und Visual-Domains sind fuer Surface Manager Gate-Basis |

## Hardening-Matrix

| ID | Primitive-Gruppe | Klasse | Status | Artefakte | Radar-Refs | Gate-Evidence | Naechster Schritt |
|----|------------------|--------|--------|-----------|------------|---------------|-------------------|
| `NFM-OF-01` | Modal und Dialog | `owned-native-backed` | `hardened-owned-terminal` | `x-modal`, `x-dialog`, `x-surface-manager`, Overlay UX profile | `NFM-BPR-005`, `NFM-BPR-006`, `NFM-BPR-020` | `overlay-interaction-ux`, `surface-stack-policy` | `inert` bleibt gewrappt; native Dialog-Uebernahme ist terminal abgelehnt |
| `NFM-OF-02` | Popover und Tooltip | `owned-native-backed` | `hardened-owned-terminal` | `x-popover`, `x-tooltip`, Overlay UX profile | `NFM-BPR-007`, `NFM-BPR-008`, `NFM-BPR-020` | `overlay-interaction-ux`, `surface-overlay-bridge` | Popover API und Anchor Positioning sind terminal abgelehnt |
| `NFM-OF-03` | Drawer und Side Panel | `owned` | `hardened-owned` | `x-drawer`, `x-side-panel`, `x-surface-manager` | `NFM-BPR-005`, `NFM-BPR-013` | `surface-side-panel`, `surface-stack-policy`, `surface-manager-quality` | WP08 kann Navigation/Media-Verzahnung pruefen |
| `NFM-OF-04` | Lightbox und Media Overlay | `owned` | `hardened-owned` | `x-lightbox`, Overlay Bridge profile | `NFM-BPR-005`, `NFM-BPR-020` | `surface-overlay-bridge`, `layout-display-media-ux` | WP08 Media Hardening |
| `NFM-OF-05` | Surface Portal und Surface Region | `owned` | `hardened-owned` | `x-surface-portal`, `x-surface-window`, `x-surface-region` | `NFM-BPR-001`, `NFM-BPR-013` | `surface-workbench-fixture`, `surface-native-rmt`, `surface-native-materialization` | WP14 bewertet RMT Maximality |
| `NFM-OF-06` | Focus Trap, Focus Restore und Inert | `owned-native-backed` | `hardened-owned` | `x-surface-manager` stack policy, component-local Escape/focus handling | `NFM-BPR-005`, `NFM-BPR-020` | `surface-stack-policy`, `overlay-interaction-ux`, `surface-manager-a11y` | Browser-Lab kann native `inert` Regressionen vertiefen |
| `NFM-OF-07` | Keyboard und Topmost Stack | `owned` | `hardened-owned` | Escape priority, focusin listener, layer tokens, scroll lock | `NFM-BPR-005` | `surface-stack-policy`, `surface-manager-quality` | keine zweite Registry einfuehren |
| `NFM-OF-08` | RMT Overlay Authoring | `owned` | `hardened-owned-with-rmt-followup` | Overlay Interaction UX fixture, Surface Workbench, Surface adapter runtime | `NFM-BPR-001`, `NFM-BPR-012`, `NFM-BPR-013` | `rmt-surface-authoring`, `surface-adapter-runtime` | WP14 quantifiziert verbleibende RMT Syntax-/Record-Gaps |
| `NFM-OF-09` | Fabric und Diagnostics | `owned` | `hardened-owned` | overlay schedules, Fabric lane markers, diagnostics snapshot | `NFM-BPR-012`, `NFM-BPR-014` | `fabric-lane-mapping`, `overlay-interaction-ux` | WP09 Framework-Hebel-Layer |
| `NFM-OF-10` | Trusted DOM und Dependency Boundary | `owned` | `hardened-owned` | no inline JS, no free HTML sink, local components only | `NFM-BPR-016` | `supply-chain`, `manifest-import-policy`, `references` | WP18 Renderer-/Trusted-DOM-Proofs |

## Native-Decision-Schnitt

| Primitive | Entscheidung | Status |
|-----------|--------------|--------|
| `inert` und Focus-Isolation | `wrap-as-xtend-primitive` | owned Stack Policy bleibt fuehrend |
| `HTMLDialogElement` | `reject-for-now` | `closed`; owned `x-dialog`/`x-modal` bleibt fuehrend |
| Popover API | `reject-for-now` | `closed`; owned Popover-/Tooltip-Pfad bleibt fuehrend |
| CSS Anchor Positioning | `reject-for-now` | `closed`; owned Positioning bleibt fuehrend |
| `focus-visible`, forced-colors, reduced-motion | `adopt-native` | bestehende A11y-CSS-Primitives bleiben erlaubt |

## Capability-Handoff

| Capability | WP-06 Status | WP-07 Entscheidung |
|------------|--------------|--------------------|
| `NFM-CAP-06` Overlay, Dialog, Popover, Drawer und Focus | `ready-with-terminal-radar-decision` | owned Overlay-/Focus-Pfad ist gehaertet; native Dialog/Popover/Anchor sind terminal abgelehnt |
| `NFM-CAP-07` Surface Runtime und Multi-Window Shell | `needs-rmt-gap-analysis` | Stack- und Focus-Policy ist gehaertet; RMT Maximality bleibt WP14 |
| `NFM-CAP-18` Native Shell, Drawer/Panel/App Workspace Composition | `needs-rmt-gap-analysis` | Drawer/Panel/Surface Stack ist owned; Shell-Migration bleibt WP14/WP21 |

## Residuals

| Residual | Status | Owner-Folge |
|----------|--------|--------------|
| `HTMLDialogElement` produktiv nutzen | `closed` | `followUp: none` nach `NFM-BPR-006` |
| Popover API produktiv nutzen | `closed` | `followUp: none` nach `NFM-BPR-007` |
| CSS Anchor Positioning produktiv nutzen | `closed` | `followUp: none` nach `NFM-BPR-008` |
| Vollstaendige RMT Overlay Syntax | `needs-rmt-gap-analysis` | `NFM-WP-14`, danach `NFM-WP-15` |
| Surface Shell Migration | `planned-followup` | `NFM-WP-21` |

## Gate-Matrix

| Gate | Erwartung |
|------|-----------|
| `native-first-overlay-focus` | WP-07 Contract, Matrix, Roadmap, package script und existing gates bleiben synchron |
| `overlay-interaction-ux` | Component UX profile deckt Modal, Dialog, Popover, Tooltip und Drawer ab |
| `surface-overlay-bridge` | Overlay Bridge adaptiert bestehende Overlay-Komponenten in Surface Records |
| `surface-stack-policy` | Focus, Inert, Escape, modal policy und no-second-registry Boundary sind stabil |
| `surface-manager-quality` | Browser-, A11y-, Performance- und Visual-Domains bleiben releasefaehig |
| `references` | neue WP-07-Artefakte bleiben referenzierbar |
| `supply-chain` | keine neue Runtime-Dependency wurde eingefuehrt |

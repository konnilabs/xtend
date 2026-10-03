# XTend Native-First Overlay Focus Hardening Contract

- Status: `accepted by NFM-WP-07`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-07-Owned-Overlay-Dialog-Popover-und-Focus-Primitives-haerten.md`
- Contract: `xtend.native-first.overlay-focus-hardening.v1`
- Matrix Contract: `xtend.native-first.overlay-focus-hardening-matrix.v1`
- Report Contract: `xtend.native-first.overlay-focus-hardening-report.v1`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Capability Contract: `xtend.native-first.ui-primitive-capability.v1`
- Adoption Gate: `xtend.native-first.primitive-adoption-gate.v2`
- Browser Primitive Radar: `xtend.native-first.browser-primitive-radar.v2`
- Component Contract: `xtend.component.contract.v2`
- Overlay UX Contract: `xtend.component.overlay-interaction-ux.v1`
- Surface Stack Policy Contract: `xtend.surface.stack-policy.v1`
- Boundary: `owned-overlay-focus-stack-before-framework-dependency`
- Boundary: `native-dialog-popover-anchor-remain-radar-linked`
- Boundary: `rmt-kernel-remains-host-neutral`
- Boundary: `no-second-surface-registry`
- Zielzustand: `native-first-owned-overlay-focus-hardened`

## Zweck

Dieser Contract haertet `NFM-OP-01`: Overlay, Focus, Dialog, Popover und Surface Stack. Er macht die vorhandenen XTend-eigenen Overlay- und Surface-Primitives als Native-First Framework-Hebel sichtbar und verbindet sie mit bestehenden Gates.

WP-07 fuehrt keine neue externe UI-Framework-Abhaengigkeit ein. Browser-native Primitives werden nur ueber Radar-Refs, Adoption Gate und lokale Evidence in den produktiven Pfad aufgenommen.

## Scope

| Bereich | Owned XTend-Pfad | Native-First-Entscheidung |
|---------|------------------|---------------------------|
| Modal und Dialog | `x-modal`, `x-dialog`, `x-surface-manager`, Overlay Bridge | owned baseline bleibt fuehrend; `HTMLDialogElement` ist terminal abgelehnt |
| Popover und Tooltip | `x-popover`, `x-tooltip`, Overlay UX profile | owned baseline bleibt fuehrend; Popover API ist terminal abgelehnt |
| Drawer und Side Panel | `x-drawer`, `x-side-panel`, Surface Manager stack | owned baseline ist Surface-/Workspace-Pfad |
| Lightbox und Media Overlay | `x-lightbox`, Overlay Bridge | owned media overlay bleibt Stack-kompatibel |
| Surface Portal | `x-surface-portal`, `x-surface-window`, `x-surface-region` | owned portal/surface path, keine zweite Registry |
| Focus und Inert | `x-surface-manager` stack policy, component-local fallback behavior | `inert` und Focus-Isolation werden als XTend Primitive gewrappt |
| Keyboard | Escape, Tab cycle, focus restore, topmost policy | contract-safe und a11y-gatebar |
| RMT Authoring | Overlay Interaction UX fixture, Surface Workbench, Surface adapter runtime | RMT authorable ueber records/adapters, nicht ueber Inline-JS |

## Native Primitive Decisions

| Radar Ref | Primitive | Entscheidung fuer WP-07 | Produktfolge |
|-----------|-----------|-------------------------|--------------|
| `NFM-BPR-005` | `inert` und browsernahe Focus-Isolation | `wrap-as-xtend-primitive` | `x-surface-manager` besitzt Focus-/Inert-Stack-Policy; lokale Fallbacks bleiben erlaubt |
| `NFM-BPR-006` | `HTMLDialogElement` | `reject-for-now` | `closed`; `x-dialog` und `x-modal` bleiben owned; `followUp: none` |
| `NFM-BPR-007` | Popover API | `reject-for-now` | `closed`; `x-popover` und `x-tooltip` bleiben owned; `followUp: none` |
| `NFM-BPR-008` | CSS Anchor Positioning | `reject-for-now` | `closed`; Positioning bleibt im owned Overlay-Pfad; `followUp: none` |
| `NFM-BPR-013` | Resize/Mutation/Intersection Observer | `wrap-as-xtend-primitive` | Diagnostics und surface measurements bleiben ueber XTend Gates kontrolliert |
| `NFM-BPR-020` | `focus-visible`, forced-colors, reduced-motion CSS | `adopt-native` | Component CSS darf diese Primitives nutzen; A11y Gates bleiben Pflicht |

## Hardening Requirements

| Requirement | Pflicht |
|-------------|---------|
| `ownedSurface` | jedes geclaimte Overlay hat lokale Component- oder Surface-Artefakte |
| `keyboardSafe` | Escape, Tab/Fokus, topmost handling und focus restore sind gatebar |
| `inertSafe` | aktive modale Surfaces setzen Hintergrund inert oder aria-hidden kontrolliert |
| `stackSafe` | ein Manager/Controller bleibt Stack-Quelle; keine zweite Registry |
| `rmtAuthorable` | RMT erreicht Overlays ueber records/adapters/schedules, nicht ueber Inline-Code |
| `trustedDomSafe` | keine neuen freien HTML-, URL-, Event-, Import- oder Style-Sinks |
| `dependencySafe` | keine neue Runtime-Dependency und kein externes UI-Framework |
| `radarLinked` | native Dialog-, Popover-, Anchor- und Focus-Entscheidungen referenzieren Radar-IDs |

## Gate-Basis

| Gate | Rolle |
|------|------|
| `node scripts/run_xtend_tests.js native-first-overlay-focus --json` | WP-07 Handoff- und Contract-Gate |
| `node scripts/run_xtend_tests.js overlay-interaction-ux --json` | Component Overlay UX, Focus Trap, Inert, RMT Fixture |
| `node scripts/run_xtend_tests.js surface-overlay-bridge --json` | Legacy Overlay zu Surface Stack Bridge |
| `node scripts/run_xtend_tests.js surface-stack-policy --json` | Modal-, Focus-, Inert- und Escape-Stack |
| `node scripts/run_xtend_tests.js surface-manager-quality --json` | Browser-, A11y-, Performance- und Visual-Gates |
| `node scripts/run_xtend_tests.js references --json` | Dokumentations- und Pfad-Parity |
| `node scripts/run_xtend_tests.js supply-chain --json` | keine neue Runtime-Dependency ohne Policy |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Overlay-/Focus-Capability ist als Native-First Contract beschrieben | erfuellt |
| `NFM-CAP-06`, `NFM-CAP-07`, `NFM-CAP-18` sind angebunden | erfuellt |
| Native Dialog/Popover/Anchor bleiben radar-linked statt ungeprueft adoptiert | erfuellt |
| Focus/Inert/Keyboard sind ueber bestehende Runtime-Gates belegbar | erfuellt |
| RMT-Kernel bleibt host-neutral | erfuellt |
| Keine Runtime-Dependency wird eingefuehrt | erfuellt |
| Lokales WP-07-Gate ist definiert | erfuellt |

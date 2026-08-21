# XTend Native-First Browser Primitive Radar

- Status: `resolved`
- Contract: `xtend.native-first.browser-primitive-radar.v2`
- Entry Contract: `xtend.native-first.browser-primitive-radar-entry.v2`
- Current Run: `NFM-OBS-2026-09-03`
- Last Review: `2026-09-03`
- Next Hygiene Review: `2026-12-03`
- Machine-readable Matrix: `tests/fixtures/native-first/browser-primitive-radar-v2.json`
- Decision Set: `development/observatory/observatory-adoption-decisions-2026-09-03.json`
- Browser Evidence Contract: `xtend.browser-hypervisor-evidence.v1`

## Abschlussregeln

Die 24 stabilen Parent-IDs bleiben erhalten. Atomare Teilfähigkeiten stehen in `members[]`; ein gemischter Parent ist `resolved`, sobald jedes Member entweder akzeptiert oder `reject-for-now` entschieden ist. Akzeptierte Fähigkeiten werden am `2026-12-03` hygienisch geprüft. Geschlossene Fähigkeiten haben `followUp: none` und `nextReview: none`; eine Wiederaufnahme braucht einen neuen Observatory-Fund und eine supersedierende ADR.

## Terminale Radar-Matrix

| ID | Primitive | Parent-Status | Member-Outcomes | Evidence | ADR | Next Review | Follow-up |
|----|-----------|---------------|-----------------|----------|-----|-------------|-----------|
| `NFM-BPR-001` | strukturierte DOM-APIs | `accepted-existing` | structured DOM: `adopt-native` | `accepted-evidence` | `ADR-NFM-BPR-001-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-002` | Custom Elements, Shadow DOM | `accepted-existing` | beide: `wrap-as-xtend-primitive` | `accepted-evidence` | `ADR-NFM-BPR-002-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-003` | ElementInternals, Form Association | `accepted-existing` | beide: `wrap-as-xtend-primitive` | `accepted-evidence` | `ADR-NFM-BPR-003-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-004` | Constraint Validation, FormData | `accepted-existing` | beide: `wrap-as-xtend-primitive` | `accepted-evidence` | `ADR-NFM-BPR-004-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-005` | inert, Focus-Isolation | `accepted-existing` | beide: `wrap-as-xtend-primitive` | `accepted-evidence` | `ADR-NFM-BPR-005-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-006` | Dialog, closedby, :open | `closed` | alle: `reject-for-now` | `rejection-evidence` | `ADR-NFM-BPR-006-2026-09-03` | `none` | `none` |
| `NFM-BPR-007` | Popover API, popover hint | `closed` | alle: `reject-for-now` | `rejection-evidence` | `ADR-NFM-BPR-007-2026-09-03` | `none` | `none` |
| `NFM-BPR-008` | CSS Anchor Positioning | `closed` | `reject-for-now` | `rejection-evidence` | `ADR-NFM-BPR-008-2026-09-03` | `none` | `none` |
| `NFM-BPR-009` | CSS Container Queries | `accepted-existing` | `adopt-native` | `accepted-evidence` | `ADR-NFM-BPR-009-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-010` | Web Animations API | `accepted-existing` | `wrap-as-xtend-primitive` | `accepted-evidence` | `ADR-NFM-BPR-010-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-011` | Same-/Cross-document View Transitions | `closed` | beide: `reject-for-now` | `rejection-evidence` | `ADR-NFM-BPR-011-2026-09-03` | `none` | `none` |
| `NFM-BPR-012` | rAF, Idle Callback, Microtasks, scheduler.yield | `resolved` | erste drei: `wrap-as-xtend-primitive`; scheduler.yield: `reject-for-now` | `accepted-evidence` | `ADR-NFM-BPR-012-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-013` | Intersection-, Resize-, MutationObserver | `accepted-existing` | alle: `wrap-as-xtend-primitive` | `accepted-evidence` | `ADR-NFM-BPR-013-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-014` | Performance APIs, User Timing | `accepted-existing` | beide: `wrap-as-xtend-primitive` | `accepted-evidence` | `ADR-NFM-BPR-014-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-015` | History, URLPattern, Navigation API | `resolved` | History: `wrap-as-xtend-primitive`; übrige: `reject-for-now` | `accepted-evidence` | `ADR-NFM-BPR-015-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-016` | browsernative Trusted Types/Sanitizer | `closed` | alle: `reject-for-now` | `rejection-evidence` | `ADR-NFM-BPR-016-2026-09-03` | `none` | `none` |
| `NFM-BPR-017` | Cache API, IndexedDB, Storage Buckets | `resolved` | Cache: `wrap-as-xtend-primitive`; übrige: `reject-for-now` | `accepted-evidence` | `ADR-NFM-BPR-017-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-018` | Picture-in-Picture, Media Session | `resolved` | PiP: `wrap-as-xtend-primitive`; Media Session: `reject-for-now` | `accepted-evidence` | `ADR-NFM-BPR-018-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-019` | AbortSignal, Fetch Streams, BroadcastChannel | `resolved` | Abort/Response: `wrap-as-xtend-primitive`; Request/Broadcast: `reject-for-now` | `accepted-evidence` | `ADR-NFM-BPR-019-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-020` | forced-colors, reduced-motion, focus-visible | `accepted-existing` | alle: `adopt-native` | `accepted-evidence` | `ADR-NFM-BPR-020-2026-09-03` | `2026-12-03` | `none` |
| `NFM-BPR-021` | Scoped Custom Element Registries | `closed` | `reject-for-now` | `rejection-evidence` | `ADR-NFM-BPR-021-2026-09-03` | `none` | `none` |
| `NFM-BPR-022` | JSPI | `closed` | `reject-for-now` | `rejection-evidence` | `ADR-NFM-BPR-022-2026-09-03` | `none` | `none` |
| `NFM-BPR-023` | DSD shadowrootslotassignment | `closed` | `reject-for-now` | `rejection-evidence` | `ADR-NFM-BPR-023-2026-09-03` | `none` | `none` |
| `NFM-BPR-024` | Explicit Resource Management | `closed` | `reject-for-now` | `rejection-evidence` | `ADR-NFM-BPR-024-2026-09-03` | `none` | `none` |

## Unveränderte Grenzen

- Öffentliche Package-Exports, Runtime-Dependencies und RMT-Syntax bleiben unverändert.
- Der RMT-Kernel bleibt hostneutral.
- `x-router`, RMT-Lanes, Surface-/Overlay-Ownership, Trusted DOM und bestehende idempotente `dispose()`-Pfade bleiben führend, wo ein Member abgelehnt wurde.
- Raw-Observatory-Findings dürfen Radar oder Runtime nicht automatisch mutieren.
- Infrastrukturfehler sind Hypervisor-Fehler und keine Browser-Evidence.

## Historie

Die sechs Lab-Entscheidungen vom 17. August 2026 bleiben im historischen Decision Set erhalten und sind durch die September-ADRs `superseded`.

- `NFM-WP-09` bleibt der abgeschlossene Handoff fuer den Framework Leverage Layer.
- `NFM-WP-10` bleibt der abgeschlossene Handoff fuer die Market Pattern Parity; die terminale Radar-v2-Entscheidung erzeugt daraus kein neues Follow-up.

# ADR: XTend Observatory Adoption Review vom 17. August 2026

- Status: `superseded`
- Superseded by: `ADR-NFM-BPR-001-2026-09-03` bis `ADR-NFM-BPR-024-2026-09-03`
- ADR Contract: `xtend.native-first.primitive-adoption-adr.v1`
- Decision Set: `xtend.native-first.observatory-adoption-decisions.v1`
- Machine-readable Evidence: `development/observatory/observatory-adoption-decisions.json`
- Intakes: `NFM-OBS-2026-08-09`, `NFM-OBS-2026-08-17`
- Reviews: `NFM-OBS-REVIEW-2026-08-17`, `NFM-OBS-REVIEW-2026-08-17-R2`
- Runtime Dependencies: `none`
- RMT Boundary: `rmt-kernel-remains-host-neutral`

## Entscheidung

Die Observatory-Prototypen bleiben intern, opt-in und ohne Produktclaim. Fuer jeden begonnenen Lab-Pfad ist genau ein Outcome festgehalten:

| Decision ID | Radar | Prototype | Outcome | Residual |
|-------------|-------|-----------|---------|----------|
| `ADR-NFM-OBS-OVERLAY-ANCHOR-2026-08-17` | `NFM-BPR-006`, `NFM-BPR-007`, `NFM-BPR-008` | getrenntes Dialog-, non-modales Popover- und Anchor-Lab | `defer-with-watch` | vollstaendige Keyboard-, Fokus-, A11y- und Multi-Engine-Evidence fehlt |
| `ADR-NFM-OBS-SCHEDULER-YIELD-2026-08-17` | `NFM-BPR-012` | 500-Unit-/4-ms-Scheduler-Modell und Browser-Fixture | `defer-with-watch` | echte p95-Input-Delay- und Target-Engine-Evidence fehlt |
| `ADR-NFM-OBS-SCOPED-REGISTRIES-2026-08-17` | `NFM-BPR-021` | zwei Registry-Scope-Hosts, identische Tags, getrennte Konstruktoren | `defer-with-watch` | Firefox-Flag, WebKit-Beleg und Component-Constructor-Exports fehlen |
| `ADR-NFM-OBS-NAVIGATION-API-2026-08-17` | `NFM-BPR-015` | optionales Hostadapter-Modell | `defer-with-watch` | vollstaendige Router-Lifecycle- und Engine-Evidence fehlt |
| `ADR-NFM-OBS-CROSS-DOCUMENT-VT-2026-08-17` | `NFM-BPR-011` | gleich-originige Zwei-Dokument-Fixture | `defer-with-watch` | Docs besitzt keinen MPA-Navigationspfad; Multi-Engine-Evidence fehlt |
| `ADR-NFM-OBS-EXPLICIT-RESOURCE-MANAGEMENT-2026-08-17` | `NFM-BPR-024` | LIFO-/Exactly-once-Lifecycle-Lab mit dynamisch isolierter `using`-Syntax | `defer-with-watch` | Safari ist Technology Preview; vollstaendige Target-Engine-, Performance- und Parse-Evidence fehlt |

## Unveraenderte Ownership

Owned Komponenten, History/Hash-Routing, RMT-Lanes, Cancellation, Backpressure, Surface-Stack-Records, Fokus, Announcements, Scroll Restore und Security Policies bleiben Default und Fallback. Browser und XTend duerfen Modalitaet, Focus Trap, `inert`, Escape oder Scroll Lock nicht parallel ausfuehren.

## Nicht autorisiert

Diese ADR autorisiert keine neuen Package-Exports, produktiven `[Symbol.dispose]`-Methoden, RMT-Syntax, Runtime-Dependencies, Docs-Umstellung, Component-Self-Registration-Aenderung oder Default-Verhaltensaenderung. JSPI, Accessibility Testing und `shadowrootslotassignment` bleiben Watchpoints ohne Prototypfreigabe. Fetch Request Streaming bleibt bis zu einem requestseitigen Streaming-Contract ohne Prototyp.

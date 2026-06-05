# XTend Native-First Browser Primitive Radar

- Status: `accepted by NFM-WP-02`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.browser-primitive-radar.v1`
- Entry Contract: `xtend.native-first.browser-primitive-radar-entry.v1`
- Review Cadence: `xtend.native-first.browser-primitive-review-cadence.v1`
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-02-Browser-Primitive-Radar-und-Review-Kadenz-aufbauen.md`
- Adoption Gate: `xtend.native-first.primitive-adoption-gate.v1`
- Dependency Diet Policy: `xtend.native-first.dependency-diet-policy.v1`
- Last Review: `2026-06-03`
- Next Quarterly Review: `2026-09-03`
- Evidence Mode: `local-contract-baseline-plus-future-browser-lab`

## Zweck

Dieser Radar listet browser-native Primitive-Kandidaten fuer XTend. Er priorisiert Bewertung, nicht Adoption. Ein Eintrag mit `watch`, `adopt-candidate` oder `wrap-candidate` ist erst produktfaehig, wenn eine Adoption ADR mit Browser-, Security-, A11y-, RMT-, Performance-, Dependency- und Fallback-Evidence vorliegt.

## Radar-Status

| Status | Bedeutung |
|--------|-----------|
| `adopt-candidate` | Direktnutzung koennte Framework-Komplexitaet reduzieren, braucht aber Gate-Evidence |
| `wrap-candidate` | Native Primitive ist wertvoll, braucht aber XTend-Contract, Adapter oder Scheduler-Anbindung |
| `watch` | relevant, aber noch keine Produktentscheidung |
| `reject` | aktuell kein Produktpfad |
| `accepted-existing` | XTend nutzt einen browsernahen owned Pfad bereits kontrolliert |
| `closed` | kein aktiver Radar-Follow-up |

## Initiale Radar-Matrix

| ID | Kategorie | Primitive | Target Surface | Radar Status | Decision Outcome | Evidence Status | Risiko | Owner | Next Review | Follow-up |
|----|-----------|-----------|----------------|--------------|------------------|-----------------|--------|-------|-------------|-----------|
| `NFM-BPR-001` | `dom` | strukturierte DOM APIs, `DocumentFragment`, `replaceChildren`, Template Content | `rmt`, `component`, `security` | `accepted-existing` | `adopt-native` | `local-contract-evidence` | P0 | RMT/Runtime Owner | `2026-09-03` | `NFM-WP-18` DOM Descriptor Proofs |
| `NFM-BPR-002` | `component` | Custom Elements und Shadow DOM | `component`, `rmt` | `accepted-existing` | `wrap-as-xtend-primitive` | `local-contract-evidence` | P0 | Component Owner | `2026-09-03` | `NFM-WP-06` Capability Matrix |
| `NFM-BPR-003` | `component` | `ElementInternals` und form-associated Custom Elements | `component`, `form`, `rmt` | `wrap-candidate` | `wrap-as-xtend-primitive` | `needs-browser-lab` | P1 | Forms Owner | `2026-09-03` | `NFM-WP-08` Forms |
| `NFM-BPR-004` | `form` | Constraint Validation und FormData APIs | `component`, `rmt` | `wrap-candidate` | `wrap-as-xtend-primitive` | `needs-browser-lab` | P1 | Forms Owner | `2026-09-03` | `NFM-WP-08` Forms |
| `NFM-BPR-005` | `accessibility` | `inert` und browsernahe Focus-Isolation | `component`, `security` | `wrap-candidate` | `wrap-as-xtend-primitive` | `local-contract-evidence` | P0 | Overlay/A11y Owner | `2026-09-03` | `NFM-WP-07` Overlays |
| `NFM-BPR-006` | `component` | `HTMLDialogElement` | `component`, `a11y` | `watch` | `defer-with-watch` | `needs-browser-lab` | P1 | Overlay Owner | `2026-09-03` | `NFM-WP-07` Dialog ADR |
| `NFM-BPR-007` | `component` | Popover API | `component`, `layout`, `a11y` | `watch` | `defer-with-watch` | `needs-browser-lab` | P1 | Overlay Owner | `2026-09-03` | `NFM-WP-07` Popover ADR |
| `NFM-BPR-008` | `layout` | CSS Anchor Positioning | `component`, `layout` | `watch` | `defer-with-watch` | `needs-browser-lab` | P1 | Layout/Overlay Owner | `2026-09-03` | `NFM-WP-07` Overlay Positioning |
| `NFM-BPR-009` | `layout` | CSS Container Queries | `component`, `docs` | `adopt-candidate` | `adopt-native` | `needs-browser-lab` | P1 | Component Owner | `2026-09-03` | `NFM-WP-06` Responsive Capabilities |
| `NFM-BPR-010` | `animation` | Web Animations API | `component`, `fabric` | `wrap-candidate` | `wrap-as-xtend-primitive` | `needs-browser-lab` | P1 | Motion Owner | `2026-09-03` | `NFM-WP-19` Motion Budgets |
| `NFM-BPR-011` | `animation` | View Transitions API | `rmt`, `navigation`, `component` | `watch` | `defer-with-watch` | `needs-browser-lab` | P1 | Surface Owner | `2026-09-03` | `NFM-WP-18` Renderer Proofs |
| `NFM-BPR-012` | `scheduling` | `requestAnimationFrame`, `requestIdleCallback`, `queueMicrotask`, scheduler-style APIs | `runtime`, `fabric`, `rmt` | `wrap-candidate` | `wrap-as-xtend-primitive` | `local-contract-evidence` | P0 | Scheduler Owner | `2026-09-03` | `NFM-WP-19` Scheduler Budgets |
| `NFM-BPR-013` | `observability` | `IntersectionObserver`, `ResizeObserver`, `MutationObserver` | `component`, `fabric`, `rmt` | `wrap-candidate` | `wrap-as-xtend-primitive` | `local-contract-evidence` | P1 | Runtime Diagnostics Owner | `2026-09-03` | `NFM-WP-06` Capability Matrix |
| `NFM-BPR-014` | `observability` | Performance APIs und User Timing | `fabric`, `runtime`, `tooling` | `wrap-candidate` | `wrap-as-xtend-primitive` | `local-contract-evidence` | P1 | Performance Owner | `2026-09-03` | `NFM-WP-19` Budgets |
| `NFM-BPR-015` | `navigation` | History, URLPattern und Navigation API Kandidaten | `component`, `rmt` | `watch` | `defer-with-watch` | `needs-browser-lab` | P1 | Router Owner | `2026-09-03` | `NFM-WP-14` RMT Routes |
| `NFM-BPR-016` | `security` | Trusted Types und Sanitizer-like Browser Primitives | `security`, `docs`, `rmt` | `watch` | `defer-with-watch` | `needs-browser-lab` | P0 | Security Owner | `security-triggered-review` | `NFM-WP-18` Trusted DOM Proofs |
| `NFM-BPR-017` | `storage` | IndexedDB, Cache APIs und Storage Buckets | `rmt`, `resource`, `docs` | `watch` | `defer-with-watch` | `needs-browser-lab` | P2 | Resource Owner | `2026-09-03` | `NFM-WP-16` Resources |
| `NFM-BPR-018` | `media` | Media Session, Picture-in-Picture und media-control Primitives | `component`, `rmt` | `watch` | `defer-with-watch` | `needs-browser-lab` | P2 | Media Owner | `2026-09-03` | `NFM-WP-08` Media |
| `NFM-BPR-019` | `network` | AbortSignal, fetch streams und BroadcastChannel | `rmt`, `resource`, `tooling` | `wrap-candidate` | `wrap-as-xtend-primitive` | `needs-browser-lab` | P1 | Resource/Effects Owner | `2026-09-03` | `NFM-WP-16` Effects |
| `NFM-BPR-020` | `accessibility` | forced-colors, prefers-reduced-motion und focus-visible CSS primitives | `component`, `docs` | `accepted-existing` | `adopt-native` | `local-contract-evidence` | P1 | A11y Owner | `2026-09-03` | `NFM-WP-06` Capability Matrix |

## P0/P1/P2-Schnitt

| Prioritaet | Eintraege | Grund |
|------------|-----------|-------|
| `P0` | `NFM-BPR-001`, `NFM-BPR-002`, `NFM-BPR-005`, `NFM-BPR-012`, `NFM-BPR-016` | DOM Descriptor, owned Components, Focus/Trust, Scheduler und Security sind Native-First-Grundlagen |
| `P1` | `NFM-BPR-003` bis `NFM-BPR-015`, `NFM-BPR-019`, `NFM-BPR-020` | direkte Auswirkung auf Framework-Hebel, Forms, Overlays, Layout, Routing und Performance |
| `P2` | `NFM-BPR-017`, `NFM-BPR-018` | relevant fuer spaetere Resource- und Media-UI-Abdeckung |

## Review-Regeln

- Jeder Eintrag wird mindestens quartalsweise geprueft.
- Jeder Eintrag wird vor produktiver Adoption gegen das Adoption Gate geprueft.
- `needs-browser-lab` darf nicht als Browser-Support-Claim in Docs oder Runtime erscheinen.
- `accepted-existing` bedeutet nicht "fertig fuer immer"; es bedeutet, dass XTend bereits einen kontrollierten browsernahen Pfad besitzt.
- `watch` bleibt Default fuer Primitives, deren Compatibility-, A11y-, Security- oder RMT-Auswirkung noch nicht belegt ist.

## Handoff an Workpackages

| Folgepaket | Radar-Nutzung |
|------------|---------------|
| `NFM-WP-03` | `pre-radar` wird fuer neue Produktentscheidungen durch `radar-linked` ersetzt |
| `NFM-WP-06` | Capability Matrix nutzt Radar-IDs fuer native, owned, wrapped und missing Faehigkeiten und ist unter `development/XTend-Native-First-UI-Primitive-Capability-Matrix.md` abgeschlossen |
| `NFM-WP-07` | Overlay-, Dialog-, Popover-, Focus- und Inert-Entscheidungen sind in `development/XTend-Native-First-Overlay-Focus-Hardening-Matrix.md` radar-linked; native Dialog/Popover/Anchor bleiben `defer-with-watch` |
| `NFM-WP-08` | Form-, Navigation-, list-like Display- und Media-Entscheidungen sind in `development/XTend-Native-First-Form-Navigation-Media-Hardening-Matrix.md` radar-linked; ElementInternals/FormData werden als XTend-Primitives gewrappt, Navigation API und Media Session/PiP bleiben `defer-with-watch` |
| `NFM-WP-09` | Framework-Hebel fuer Theme, State, Events, Slots und Scheduler sind in `development/XTend-Native-First-Framework-Leverage-Layer-Matrix.md` radar-linked; Scheduler APIs, Observers und Performance APIs bleiben wrapped, forced-colors/reduced-motion/focus-visible bleibt `adopt-native` |
| `NFM-WP-10` | Market-Pattern-Parity nutzt Radar-Refs als Claim-Grenze: native Navigation, Form, Container, Scheduler, Hydration und A11y-Primitives bleiben ADR-pflichtig, waehrend Data Display und Command/Search als owned primitive Luecken markiert sind |
| `NFM-WP-14` | RMT Gap Analysis kann Radar-Kategorien gegen RMT-Authoring mappen |
| `NFM-WP-18` | DOM Descriptor und Renderer-Proofs koennen P0/P1 Radar-Entries priorisieren |
| `NFM-WP-19` | Performance-, Complexity- und Bundle-Budgets koennen Radar-Evidence uebernehmen |

## Nicht-Ziele

- keine Live-Aussage ueber aktuellen Browser-Support ohne Browser-Lab-Evidence
- keine Produktfreigabe durch Radar-Listung allein
- keine Runtime-Dependency als Ersatz fuer native Primitive
- kein Host- oder DOM-Typ im RMT-Kernel
- keine unsicheren DOM-, URL-, Event-, Import- oder Style-Sinks als Primitive-Shortcut

# XTend Native-First Browser Primitive Radar Contract

- Status: `accepted by NFM-WP-02`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-02-Browser-Primitive-Radar-und-Review-Kadenz-aufbauen.md`
- Contract: `xtend.native-first.browser-primitive-radar.v1`
- Radar Entry Contract: `xtend.native-first.browser-primitive-radar-entry.v1`
- Review Cadence Contract: `xtend.native-first.browser-primitive-review-cadence.v1`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Adoption Gate: `xtend.native-first.primitive-adoption-gate.v1`
- Dependency Diet Policy: `xtend.native-first.dependency-diet-policy.v1`
- Boundary: `browser-native-first-before-framework-abstraction`
- Boundary: `radar-entry-precedes-runtime-adoption`
- Boundary: `no-browser-support-claim-without-evidence`
- Boundary: `radar-does-not-override-adoption-gate`
- Zielzustand: `browser-primitive-radar-ready`

## Zweck

Dieser Contract macht browser-native Primitives fuer XTend regelmaessig bewertbar. Der Radar ist kein Produkt-Claim und keine Runtime-Freigabe. Er ist die Source of Truth fuer Kandidaten, Kategorien, Review-Kadenz, Evidence-Pflichten und Handoff in Adoption ADRs.

Ein Primitive darf im Radar vorkommen, ohne dass XTend es adoptiert. Eine Runtime-, Component-, RMT-, Fabric-, Security-, Docs- oder Tooling-Adoption bleibt weiterhin an `xtend.native-first.primitive-adoption-gate.v1` gebunden.

## Radar-Kategorien

| Kategorie | Beispiele | Typische XTend-Flaeche |
|-----------|-----------|------------------------|
| `dom` | strukturierte DOM APIs, DocumentFragment, Template Content | DOM Descriptor, Trusted DOM, Renderer |
| `component` | Custom Elements, Shadow DOM, ElementInternals | owned Components, Component Contract v2 |
| `form` | Constraint Validation, FormData, form-associated Custom Elements | x-input, x-form, RMT form records |
| `layout` | Container Queries, Anchor Positioning, CSS Layers | responsive Components, Overlay Positioning, Design Tokens |
| `navigation` | History, URLPattern, Navigation APIs | x-router, RMT routes, surface navigation |
| `animation` | Web Animations, View Transitions, Scroll Timelines | surface transitions, motion policy |
| `scheduling` | requestAnimationFrame, requestIdleCallback, scheduler APIs, queueMicrotask | RMT Scheduler, Fabric lanes, hydration |
| `observability` | IntersectionObserver, ResizeObserver, MutationObserver, Performance APIs | lazy hydration, diagnostics, budgets |
| `storage` | IndexedDB, Cache APIs, Storage Buckets | resource graph, offline state, docs cache |
| `security` | Trusted Types, Sanitizer-like APIs, CSP-adjacent browser primitives | Trusted DOM, URL/import policies |
| `network` | fetch streams, AbortSignal, WebSocket, BroadcastChannel | resource primitives, effects, collaboration |
| `media` | Media Session, Picture-in-Picture, WebCodecs-style primitives | media Components, docs demos |
| `accessibility` | focus management, inert, forced-colors, prefers-reduced-motion | overlays, forms, a11y gates |

## Radar Entry Schema

Jeder Radar-Eintrag muss mindestens diese Felder besitzen:

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `radarId` | ja | stabile ID im Format `NFM-BPR-###` |
| `primitiveName` | ja | Browser-Primitive, API oder platformnahes Pattern |
| `category` | ja | Kategorie aus diesem Contract |
| `targetSurface` | ja | `runtime`, `component`, `rmt`, `fabric`, `docs`, `tooling`, `security` |
| `radarStatus` | ja | `adopt-candidate`, `wrap-candidate`, `watch`, `reject`, `accepted-existing`, `closed` |
| `decisionOutcome` | ja | Outcome aus `xtend.native-first.decision-matrix.v1` |
| `evidenceStatus` | ja | `needs-browser-lab`, `local-contract-evidence`, `accepted-evidence`, `insufficient-evidence` |
| `riskClass` | ja | `P0`, `P1`, `P2` |
| `owner` | ja | Owner-Rolle fuer Review |
| `lastReview` | ja | Datum der letzten Bewertung |
| `nextReview` | ja | Datum oder Trigger |
| `adoptionGateMode` | ja | `radar-linked`, `runtime-adoption`, `exception`, `closed` |
| `followUp` | ja | Workpackage, ADR, Gate oder explizit `none` |

## Review-Kadenz

| Review-Typ | Kadenz | Ausloeser |
|------------|--------|-----------|
| `quarterly-radar-review` | alle 3 Monate | normale Radar-Hygiene, neue Browser-/Platform-Signale |
| `release-radar-review` | vor RC oder Minor Release | neue Produktclaims, Release Evidence, Migration |
| `adoption-request-review` | vor jeder Runtime- oder Component-Adoption | neue ADR, neuer Adapter, neue Syntax |
| `security-triggered-review` | sofort | DOM-, URL-, Import-, Eval-, Event-, Style- oder Supply-Chain-Auswirkung |
| `dependency-triggered-review` | sofort | Runtime-Dependency-Exception oder Replacement-Kandidat |

Der erste regulaere Folgetermin nach `NFM-WP-02` ist `2026-09-03`. Release-, Security- und Dependency-Trigger duerfen frueher greifen.

## Evidence-Regeln

Ein Radar-Eintrag darf nur dann von `watch` zu `adopt-candidate` oder `wrap-candidate` wechseln, wenn diese Evidence vorhanden ist:

- Browser-Lab- oder Zielbrowser-Evidence
- Performance- oder Complexity-Einschaetzung
- A11y-Einschaetzung fuer UI-relevante Primitives
- Security- und Trusted-DOM-Einschaetzung fuer DOM-, URL-, Event-, Style-, Import- oder Storage-Flaechen
- RMT-Auswirkung mit Kernel-Neutralitaet
- Dependency-Auswirkung gegen `xtend.native-first.dependency-diet-policy.v1`
- Fallback-, Degradation- oder No-Fallback-Entscheidung
- Handoff an Contract, Runtime, Tests, Docs oder Release Evidence

Der Radar darf Kandidaten ohne diese Evidence listen. Solche Eintraege bleiben `needs-browser-lab` oder `insufficient-evidence` und duerfen nicht produktiv adoptiert werden.

## Mapping auf Adoption Gate

| Radar Status | Adoption Gate Folge |
|--------------|---------------------|
| `adopt-candidate` | ADR mit `radar-linked`; Runtime erst mit vollstaendiger Evidence |
| `wrap-candidate` | ADR mit `wrap-as-xtend-primitive`; Contract- und Adapter-Grenze Pflicht |
| `watch` | keine Produktadoption; naechstes Review bleibt im Radar |
| `reject` | ADR optional; kein Produktpfad |
| `accepted-existing` | bestehender XTend-Pfad bleibt, Review-Kadenz dokumentiert |
| `closed` | kein aktives Follow-up |

Nach `NFM-WP-02` ist `pre-radar` kein Default fuer neue Produktentscheidungen mehr. Neue Primitive-ADRs muessen einen `radarId` referenzieren oder bewusst als `exception` mit Owner-Signoff laufen.

## Blocking-Regeln

Ein Radar-Eintrag blockiert Adoption, wenn:

- kein `radarId` existiert
- Browser-Support oder Baseline nur behauptet wird
- Security-Sinks nicht klassifiziert sind
- RMT-Kernel-Neutralitaet unklar bleibt
- Fallback oder Degradation fehlt
- Dependency-Auswirkung gegen `NFM-WP-04` fehlt
- ein Produktclaim ohne Adoption ADR entsteht

## Source-of-Truth

| Artefakt | Rolle |
|----------|-------|
| `development/XTend-Native-First-Browser-Primitive-Radar.md` | fuehrende Radar-Matrix |
| `development/XTend-Native-Primitive-Adoption-Gate-Contract.md` | ADR- und Evidence-Pflichten |
| `development/ADR-TEMPLATE-XTend-Native-Primitive-Adoption.md` | Format fuer konkrete Adoption-Entscheidungen |
| `development/XTend-Native-First-Dependency-Diet-Policy-Contract.md` | Dependency-Bewertung |
| `development/XTend-Native-First-Vendor-Legacy-Replacement-Matrix.md` | Replacement-Kandidaten und Residuals |
| `development/XTend-Trusted-DOM-und-Sanitizing-Policy.md` | DOM- und Sanitizing-Grenze |
| `development/XTendRMT-vNext-*.md` | RMT-Syntax-, Core- und Security-Grenzen |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Primitive-Kategorien sind definiert | erfuellt |
| Review-Kadenz ist definiert | erfuellt |
| Radar-Eintraege besitzen stabile IDs | erfuellt |
| Adoption Gate kann `primitiveRadarRef` nutzen | erfuellt |
| Produktadoption ohne Evidence bleibt blockiert | erfuellt |
| Dependency- und Security-Grenzen sind angebunden | erfuellt |

# XTend Native Primitive Adoption Gate Contract

- Status: `accepted by NFM-WP-03`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-03-Native-Primitive-Adoption-Gate-und-ADR-Template-definieren.md`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Gate Contract: `xtend.native-first.primitive-adoption-gate.v1`
- ADR Contract: `xtend.native-first.primitive-adoption-adr.v1`
- Evidence Contract: `xtend.native-first.primitive-adoption-evidence.v1`
- ADR Template: `development/ADR-TEMPLATE-XTend-Native-Primitive-Adoption.md`
- Browser Primitive Radar: `xtend.native-first.browser-primitive-radar.v1`
- Boundary: `native-primitive-adoption-requires-recorded-decision`
- Boundary: `runtime-adoption-requires-gate-evidence`
- Boundary: `rmt-kernel-remains-host-neutral`
- Boundary: `unsafe-dom-sinks-remain-trust-gated`
- Zielzustand: `native-primitive-adoption-gate-ready`
- Folgepakete: `NFM-WP-02`, `NFM-WP-06`, `NFM-WP-07`, `NFM-WP-08`, `NFM-WP-09`, `NFM-WP-10`, `NFM-WP-11`, `NFM-WP-18`, `NFM-WP-19`

## Zweck

Dieser Contract definiert das verbindliche Gate fuer die Uebernahme browser-nativer Primitives in XTend Runtime-, Component-, RMT-, Fabric-, Docs- oder Tooling-Pfade. Das Gate setzt die Native-First-Mission in eine reproduzierbare ADR- und Evidence-Struktur um.

Die wichtigste Entscheidung:

- Keine neue browser-native Primitive-Adoption ohne dokumentierte Entscheidung.
- Keine Runtime-, Component- oder RMT-Aufnahme ohne Gate-Evidence.
- Keine Host- oder Browser-Typen im RMT-Kernel.
- Keine Trusted-DOM-, Attribute-, URL-, Property- oder Event-Sink-Aenderung ohne Security- und Contract-Parity-Pruefung.

## Gate-Scope

Das Gate gilt fuer jede Entscheidung, die mindestens einen dieser Pfade betrifft:

| Pfad | Beispiele | Gate-Pflicht |
|------|-----------|--------------|
| `runtime` | Loader, Fabric, API, Scheduler-nahe Adapter | ADR und Evidence erforderlich |
| `component` | Custom Elements, owned primitives, Component Contract v2 | ADR, Component Contract und Browser/A11y Evidence erforderlich |
| `rmt` | Syntax, Core Records, Adapter, Renderer, DOM Descriptor | ADR, RMT Boundary und Security Evidence erforderlich |
| `security` | Trusted DOM, Sanitizing, URLs, Attributes, Properties, Events | ADR und Trust/Sink-Parity erforderlich |
| `docs` | Authoring Guides, Docs-App Runtime, examples | ADR bei Runtime- oder Security-Auswirkung |
| `tooling` | Linter, LSP, Builder, Scaffold | ADR wenn Produkt- oder Runtime-Claims entstehen |

Reine redaktionelle Dokumentation ohne Runtime-, Component-, RMT- oder Security-Auswirkung braucht kein Adoption Gate.

## Gate-Modi

| Modus | Wann verwenden | Entscheidung |
|-------|----------------|--------------|
| `pre-radar` | historische Uebergangs-ADRs vor Abschluss von `NFM-WP-02`. | Keine neue Produktentscheidung; bestehende ADRs muessen einen spaeteren `primitiveRadarRef` nachtragen. |
| `radar-linked` | Primitive ist im Browser Primitive Radar erfasst. | Default fuer neue ADRs; ADR referenziert Radar-Kategorie, Review-Datum und Radar-Entscheidung. |
| `runtime-adoption` | Primitive soll in Runtime, Component oder RMT aufgenommen werden. | Alle Evidence-Felder sind Pflicht. |
| `exception` | Runtime-Dependency oder nicht-native Fallback wird beantragt. | `allow-runtime-dependency-exception` oder `reject-for-now` mit Owner-Signoff erforderlich. |

`pre-radar` war ein Uebergangsmodus fuer `NFM-WP-03`. Nach Abschluss von `NFM-WP-02` duerfen neue Produktentscheidungen nicht mehr mit `pre-radar` starten. Neue Primitive-ADRs nutzen `radar-linked` oder laufen bewusst als `exception` mit Owner-Signoff.

## Pflichtinputs

Eine gueltige Adoption-ADR muss mindestens diese Felder enthalten:

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `schema` | ja | `xtend.native-first.primitive-adoption-adr.v1` |
| `status` | ja | `draft`, `accepted`, `accepted-with-residuals`, `rejected`, `superseded` |
| `decisionId` | ja | stabile ID der Entscheidung |
| `primitiveName` | ja | Browser-Primitive, API, Platform-Faehigkeit oder Pattern |
| `primitiveCategory` | ja | `dom`, `component`, `form`, `layout`, `navigation`, `animation`, `scheduling`, `lifecycle`, `observability`, `storage`, `security`, `network`, `media`, `accessibility`, `compute`, `other` |
| `targetSurface` | ja | `runtime`, `component`, `rmt`, `fabric`, `docs`, `tooling`, `security` |
| `decisionOutcome` | ja | erlaubtes Outcome aus der Native-First-Mission |
| `owner` | ja | Owner oder Owner-Rolle |
| `reviewDate` | ja | naechstes Review-Datum |
| `primitiveRadarRef` | ja | Radar-ID aus `xtend.native-first.browser-primitive-radar.v1`; `pre-radar` nur fuer historische Uebergangs-ADRs |
| `evidence` | ja | strukturierte Evidence nach diesem Contract |
| `fallbackPolicy` | ja | Fallback, Degradation oder Nicht-Fallback-Entscheidung |
| `contractParity` | ja | Contract-, Runtime-, Test-, Docs- und Report-Gegenstuecke |
| `securityReview` | ja | Trusted-DOM-, URL-, Attribute-, Property-, Event- und Supply-Chain-Auswirkung |
| `rmtBoundary` | ja | Kernel-Neutralitaet und Core-/Adapter-Grenze |

## Evidence-Matrix

| Evidence | Pflicht fuer | Mindestinhalt |
|----------|--------------|---------------|
| `browserSupport` | alle Outcomes ausser `reject-for-now` | Zielbrowser, Baseline, Degradation, bekannte Luecken |
| `performanceImpact` | Runtime, Component, RMT, Fabric | Mount, Hydration, Interaction, Scheduler-Lane oder Bundle-Auswirkung |
| `complexityImpact` | alle | entfernte Abstraktion, neue Adapterlast, Maintenance-Risiko |
| `a11yImpact` | Component, DOM, Form, Navigation, Media | Keyboard, Focus, ARIA, Screenreader, Motion, Contrast |
| `securityImpact` | alle | Trusted DOM, Attribute, URL, Property, Event, Supply Chain |
| `rmtImpact` | RMT, Component, Runtime | Core Record, Syntax, Adapter, Source Map, Diagnostics |
| `contractParity` | alle | Contract, runtime artifact, tests, docs, report/evidence |
| `fallbackAndDegradation` | alle | Fallback-Strategie, Kill-Switch, No-Fallback-Begruendung |
| `migrationImpact` | existing paths | Compatibility, SemVer, opt-in, deprecation, residuals |

## Decision Outcomes

Das Gate uebernimmt die Outcomes aus `xtend.native-first.decision-matrix.v1` und konkretisiert ihre Gate-Bedeutung:

| Outcome | Gate-Bedeutung |
|---------|----------------|
| `adopt-native` | Native Primitive darf direkt oder ueber duenne Utility-Schicht verwendet werden. |
| `wrap-as-xtend-primitive` | Native Primitive braucht XTend-Contract, Fallback, Diagnostics oder Scheduler-Anbindung. |
| `build-owned-primitive` | XTend baut eigene Komponente oder Runtime-Faehigkeit, weil native Primitive nicht reicht. |
| `keep-existing-owned-path` | Bestehende XTend-Loesung bleibt fuehrend; Radar-Watch bleibt moeglich. |
| `defer-with-watch` | Keine Produktadoption; Radar-Review und Kriterien sind dokumentiert. |
| `allow-runtime-dependency-exception` | Runtime-Dependency bleibt Ausnahme mit Owner-Signoff und Exit-Plan. |
| `reject-for-now` | Keine Adoption; Begruendung und erneutes Review optional. |

## Blocking-Regeln

Das Gate blockiert eine Adoption, wenn:

- kein ADR-Dokument existiert
- `decisionOutcome` fehlt oder nicht erlaubt ist
- Runtime-Adoption im `pre-radar` Modus ohne ausdrueckliches Owner-Residual erfolgt
- Browser-Support nur angenommen, aber nicht dokumentiert ist
- Security-Auswirkungen auf DOM-, URL-, Attribute-, Property- oder Event-Sinks fehlen
- RMT-Auswirkungen Host-Typen in den Kernel ziehen wuerden
- `allow-runtime-dependency-exception` ohne Exit-Plan verwendet wird
- Fallback oder Degradation unklar bleibt
- Contract-, Runtime-, Test- oder Docs-Parity fuer produktive Adoption fehlt

## RMT-Grenze

Native Browser-Primitives duerfen RMT nur als Daten, Capabilities, Adapter-Contracts, Core Records, Source Maps oder Diagnostics erreichen.

Nicht erlaubt:

- Import von Browser-, DOM-, XTend-, Custom-Element- oder Host-Runtime-Typen in den RMT-Kernel
- Inline-JavaScript als Primitive-Adoption
- Inline-HTML als Convenience-Sink
- Runtime-Eval als Fallback fuer fehlende Primitive
- Host-spezifische APIs als unausweichlicher Core-Record

## Security-Grenze

Jede Primitive-Adoption muss explizit sagen, ob sie diese Sinks beruehrt:

| Sink | Erwartung |
|------|-----------|
| `html` | Trusted-DOM- oder Sanitizing-Policy erforderlich |
| `attribute` | Allowlist, URL Policy und Diagnostics erforderlich |
| `url` | Protokoll-, Origin- und Navigation-Grenze erforderlich |
| `property` | Property-Policy oder No-Property-Write-Begruendung erforderlich |
| `event` | Typed Payload, keine Handler-Strings, keine Code-Strings |
| `style` | Token-, CSS-Property- oder Style-Sink-Policy erforderlich |
| `import` | Loader-/Manifest-Policy und Supply-Chain-Evidence erforderlich |

## Relationship zu bestehenden Contracts

| Bestehender Contract | Gate-Beziehung |
|----------------------|----------------|
| `xtend.native-first.mission-source-of-truth.v1` | liefert Mission, Outcomes und Dependency-Default |
| `xtend.native-first.browser-primitive-radar.v1` | liefert Radar-Kategorie, Review-Kadenz und `primitiveRadarRef` |
| `xtend.component.contract.v2` | fuehrt Component-Surface, RMT Metadata, A11y, Performance und Tests |
| `xtend.fabric.fiber.v1` | fuehrt Fiber-/Lane-Grenzen fuer Scheduler-nahe Arbeit |
| `xtend.fabric.rmt-lane-mapping.v1` | verbindet Component-/Runtime-Arbeit mit RMT Schedules |
| `xtend.security.trusted-dom-policy.v1` | fuehrt DOM-Sink- und Sanitizing-Grenzen |
| `xtend.rmt.kernel-trust-hardening.v1` | fuehrt Runtime Trust, Panic und Recovery |
| `xtend.rmt.core-format.vnext.v1` | fuehrt Core-Records und Source-Map-Grenzen |
| `xtend.security.release-supply-chain-gate.v1` | fuehrt Dependency- und Audit-Evidence |

## ADR Template Pflicht

Neue Primitive-Adoptionsentscheidungen sollen auf diesem Template basieren:

```text
development/ADR-TEMPLATE-XTend-Native-Primitive-Adoption.md
```

Das Template ist absichtlich ausfuehrungsfrei. Es ist ein Review- und Evidence-Format, kein Runtime-Manifest.

## Verifikation

Der urspruengliche Dokumentations- und Contract-Gate aus `NFM-WP-03` ist nun als ausfuehrbarer lokaler Adoption Gate umgesetzt:

```bash
node scripts/run_xtend_tests.js primitive-adoption-gate --json
```

Das Gate prueft Primitive-ADR-Pflichtfelder, erlaubte Outcomes, Radar-Refs, Evidence-Bloecke, Fallback, Security, RMT-Kernel-Neutralitaet, Runtime-Dependencies und blockierende `insufficient-evidence`-Engine-Artefakte. Seine Negativtests belegen, dass fehlende Felder, ungueltige Outcomes, unbekannte Radar-IDs, unvollstaendige Evidence, Runtime-Dependencies und Adoption ohne ausreichende Engine-Evidence abgewiesen werden.

## Handoff

`NFM-WP-03` macht diese Folgearbeit startklar:

- `NFM-WP-02` hat Radar-Eintraege auf diese ADR-Struktur gemappt.
- `NFM-WP-06` kann UI Capability Matrix Ergebnisse mit Gate-Outcomes verbinden.
- `NFM-WP-07` hat owned Overlay-/Focus-Hardening mit Radar-Refs abgeschlossen; native Dialog/Popover/Anchor Adoption bleibt ADR-pflichtig.
- `NFM-WP-08` hat owned Form-/Navigation-/Media-Hardening mit Radar-Refs abgeschlossen; native Form-, Navigation- und Media-Adoption bleibt ADR-pflichtig.
- `NFM-WP-09` hat Framework-Hebel fuer Theme, State, Events, Slots und Scheduler mit Radar-Refs abgeschlossen; native Scheduler-, Observer- und Performance-Adoption bleibt contract- und ADR-pflichtig.
- `NFM-WP-10` hat Market-Pattern-Parity abgeschlossen; neue Produktclaims muessen Pattern-ID, Radar-Ref und negative-claim-Pruefung nennen.
- `NFM-WP-11` hat Contract Registry abgeschlossen; neue Adoption- oder Produktclaims muessen registrierbare Contract-ID, Owner, Gate, Report-Schema und Docs-Pfad besitzen.
- `NFM-WP-18` kann DOM-Descriptor- und Renderer-Proofs gegen Security- und RMT-Grenzen pruefen.
- `NFM-WP-19` kann Performance-, Complexity- und Bundle-Budgets als Evidence-Felder gatebar machen.

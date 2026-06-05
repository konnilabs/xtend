# NFM-WP-03 - Native Primitive Adoption Gate und ADR-Template definieren

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Gate Contract: `xtend.native-first.primitive-adoption-gate.v1`
- ADR Contract: `xtend.native-first.primitive-adoption-adr.v1`
- Evidence Contract: `xtend.native-first.primitive-adoption-evidence.v1`
- Browser Primitive Radar: `xtend.native-first.browser-primitive-radar.v1`
- Contract-Dokument: `development/XTend-Native-Primitive-Adoption-Gate-Contract.md`
- ADR Template: `development/ADR-TEMPLATE-XTend-Native-Primitive-Adoption.md`
- Boundary: `native-primitive-adoption-requires-recorded-decision`
- Boundary: `runtime-adoption-requires-gate-evidence`
- Boundary: `rmt-kernel-remains-host-neutral`
- Boundary: `unsafe-dom-sinks-remain-trust-gated`
- Zielzustand: `native-primitive-adoption-gate-ready`
- Gate: Dokumentationsreview gegen Native-First Mission, Browser Primitive Radar, Component Contract v2, Fabric, Trusted DOM, RMT vNext und Supply Chain

## Ziel

`NFM-WP-03` macht Native-Primitive-Adoption reproduzierbar entscheidbar. Das Paket definiert ein Gate und ein ADR-Template, bevor konkrete Browser-Primitives, owned Components oder RMT-Erweiterungen in Runtime-Pfade uebernommen werden.

Das Paket implementierte den Browser Primitive Radar noch nicht selbst. `NFM-WP-02` hat den Radar nachtraeglich auf diese Pflichtstruktur gemappt. Ein maschinenlesbarer Runner fuer Primitive-ADRs bleibt Folgearbeit.

## Umgesetzt

- `development/XTend-Native-Primitive-Adoption-Gate-Contract.md` angelegt
- Gate Contract `xtend.native-first.primitive-adoption-gate.v1` akzeptiert
- ADR Contract `xtend.native-first.primitive-adoption-adr.v1` definiert
- Evidence Contract `xtend.native-first.primitive-adoption-evidence.v1` definiert
- `development/ADR-TEMPLATE-XTend-Native-Primitive-Adoption.md` angelegt
- Gate-Modi `pre-radar`, `radar-linked`, `runtime-adoption` und `exception` definiert
- Pflichtinputs fuer Primitive-Adoptionsentscheidungen festgelegt
- Evidence-Matrix fuer Browser Support, Performance, Complexity, A11y, Security, RMT, Contract Parity, Fallback und Migration definiert
- Blocking-Regeln fuer fehlende ADRs, fehlende Evidence, Runtime-Dependencies ohne Exit-Plan und RMT-Kernel-Kopplung dokumentiert
- Security-Sink-Matrix fuer HTML, Attribute, URL, Property, Event, Style und Import eingefuehrt
- Relationship zu Component Contract v2, Fabric/Fiber, RMT vNext, Trusted DOM, Kernel Trust und Supply Chain dokumentiert

## Scope-Entscheidung

In Scope fuer `NFM-WP-03`:

- Native-Primitive-Adoption-Gate als verbindlicher Contract
- ADR-Template fuer Primitive-Entscheidungen
- Pflichtfelder und erlaubte Outcomes
- Evidence-Pflichten fuer Runtime-, Component-, RMT-, Security-, Docs- und Tooling-Pfade
- Fallback- und Degradation-Regeln
- Security-, A11y-, Performance-, Complexity- und RMT-Boundary-Pruefung
- `pre-radar` Uebergangsmodus, der durch `NFM-WP-02` fuer neue Produktentscheidungen geschlossen wurde

Out of Scope fuer `NFM-WP-03`:

- konkrete Browser-Primitive-Bewertungen
- Primitive Radar und Review-Kadenz
- Runtime-, Component- oder Renderer-Aenderungen
- neuer Test-Runner fuer Primitive-ADRs
- Dependency Diet Policy
- RMT Syntax Growth
- UI Primitive Capability Matrix

## Gate-Entscheidung

Eine Native-Primitive-Adoption ist erst produktfaehig, wenn sie:

- eine ADR nach `xtend.native-first.primitive-adoption-adr.v1` besitzt
- ein erlaubtes Decision Outcome verwendet
- Browser-, Performance-, Complexity-, A11y-, Security-, RMT- und Contract-Parity-Evidence dokumentiert
- Fallback, Degradation oder No-Fallback begruendet
- Runtime-Dependencies nur als explizite Ausnahme mit Exit-Plan akzeptiert
- den RMT-Kernel host-neutral haelt
- DOM-, URL-, Attribute-, Property-, Event-, Style- und Import-Sinks trust-gated behandelt

## Pre-Radar-Abschluss

`NFM-WP-03` wurde vor `NFM-WP-02` umgesetzt. Nach Abschluss von `NFM-WP-02` gilt:

- Neue Primitive-ADRs duerfen nicht mehr mit `Primitive Radar Ref: pre-radar` starten.
- Historische Uebergangs-ADRs muessen einen Radar-Ref nachtragen, bevor Runtime-Adoption produktiv wird.
- Runtime-Adoption darf im `pre-radar` Modus weiterhin nicht still produktiv werden.
- `NFM-WP-02` mapped Radar-Kategorien, Review-Kadenz und Radar-Entscheidungen auf diesen Gate-Contract.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Adoption Gate ist als Contract dokumentiert | erfuellt: `xtend.native-first.primitive-adoption-gate.v1` |
| ADR Template ist vorhanden | erfuellt: `development/ADR-TEMPLATE-XTend-Native-Primitive-Adoption.md` |
| Performance-, A11y-, Evergreen-, Security-, RMT- und Complexity-Checks sind enthalten | erfuellt |
| Fallback- und Degradation-Regeln sind dokumentiert | erfuellt |
| Beziehung zu Fabric, Scheduler, Trusted DOM und Component Contract v2 ist dokumentiert | erfuellt |
| Runtime-Adoption braucht Gate-Evidence | erfuellt |
| RMT-Kernel-Boundary bleibt host-neutral | erfuellt |
| Folgepakete haben Handoff | erfuellt |

## Verifikation

`NFM-WP-03` ist ein Dokumentations-, Scope- und Contract-Gate. Ein Runtime-, Browser- oder Parser-Test ist noch nicht erforderlich, weil konkrete Primitive-Adoptionsentscheidungen erst in Folgepaketen entstehen.

Referenzpfad-Gate:

```bash
node scripts/run_xtend_tests.js references --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `2073`
- Failures: `0`
- Warnings: `0`

## Handoff

`NFM-WP-03` ist abgeschlossen. Das Native Primitive Adoption Gate und das ADR-Template sind akzeptiert.

Naechste Folgearbeit:

- `NFM-WP-02` hat Browser Primitive Radar Eintraege auf `primitiveRadarRef` und Gate-Modi gemappt.
- `NFM-WP-06` kann UI Capability Matrix Ergebnisse gegen Gate-Outcomes klassifizieren.
- `NFM-WP-07` hat owned Overlay-/Focus-Hardening radar-linked abgeschlossen; `NFM-WP-08` hat owned Form-/Navigation-/Media-Hardening radar-linked abgeschlossen und haelt native Adoption ADR-pflichtig.
- `NFM-WP-18` kann DOM-Descriptor- und Renderer-Proofs gegen Security- und RMT-Boundaries pruefen.
- `NFM-WP-19` kann Performance-, Complexity- und Bundle-Budgets als Evidence-Felder produktisieren.

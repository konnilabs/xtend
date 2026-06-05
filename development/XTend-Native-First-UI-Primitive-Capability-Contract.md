# XTend Native-First UI Primitive Capability Contract

- Status: `accepted by NFM-WP-06`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-06-XTend-UI-Primitive-Capability-Matrix-erstellen.md`
- Contract: `xtend.native-first.ui-primitive-capability.v1`
- Matrix Contract: `xtend.native-first.ui-primitive-capability-matrix.v1`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Browser Primitive Radar: `xtend.native-first.browser-primitive-radar.v1`
- Component Contract: `xtend.component.contract.v2`
- Component Maturity Model: `xtend.component.maturity-model.v2`
- Dependency Diet Policy: `xtend.native-first.dependency-diet-policy.v1`
- Boundary: `owned-ui-primitive-before-framework-dependency`
- Boundary: `capability-claim-requires-contract-and-gate`
- Boundary: `rmt-kernel-remains-host-neutral`
- Boundary: `vendor-compatible-is-not-vendor-owned`
- Zielzustand: `ui-primitive-capability-matrix-accepted`

## Zweck

Dieser Contract definiert, wie XTend UI-Faehigkeiten als Native-First Capability Matrix bewertet. Die Matrix ersetzt keine Component-Coverage-Matrix und keine Maturity-Pruefung. Sie beantwortet eine andere Produktfrage:

```text
Welche UI-Primitives besitzt XTend als Framework-Hebel, und welche fehlen fuer Framework-Paritaet ohne externe UI-Framework-Abhaengigkeit?
```

## Capability-Klassen

| Klasse | Bedeutung | Produktfolge |
|--------|-----------|--------------|
| `owned` | XTend besitzt lokale Komponenten, Contracts, Tests, Docs und RMT-/Fabric-Anbindung oder einen klaren lokalen Pfad | als Framework-Hebel nutzbar |
| `owned-native-backed` | owned XTend Primitive nutzt oder bewertet browser-native Primitive ueber Radar und Adoption Gate | ADR/Evidence vor produktiver Native-Adoption |
| `owned-vendor-adapter` | XTend besitzt einen lokalen, vendor-kompatiblen Adapter ohne CDN oder Runtime-Dependency | behalten, aber nicht als fremde API ausweiten |
| `vendor-backed` | Capability haengt an lokaler vendored Utility-Flaeche oder fremdkompatibler Utility-Implementierung | contain, Fassade schmal halten, Exit-Plan |
| `legacy` | Capability existiert als bestehende Runtime- oder Authoring-Flaeche, aber mit Migrationslast | NFM-WP-21 Deprecation-/Migration-Plan |
| `contract-only` | Contract, Schema, RMT-Domain oder Planung existiert, Runtime-/Authoring-Reife ist noch nicht vollstaendig | Folgepaket fuer Umsetzung/Gate |
| `missing` | weder owned Runtime noch belastbarer Contract existieren | neues Owned-Primitive-Paket oder Reject-Entscheidung |
| `tooling-only` | Faehigkeit existiert im Tooling, nicht im App- oder Component-Runtime-Pfad | nicht als UI Runtime Capability claimen |

## Capability-Dimensionen

Jede Capability wird gegen diese Dimensionen bewertet:

| Dimension | Frage |
|-----------|-------|
| `componentSurface` | Gibt es lokale XTend-Komponenten oder Runtime-Artefakte? |
| `nativeRadar` | Gibt es passende `NFM-BPR-*` Radar-Refs? |
| `componentContract` | Ist Component Contract v2 oder ein aequivalenter Contract angebunden? |
| `maturity` | Ist die Faehigkeit enterprise-ready, stable/core, preview, contract-only oder legacy? |
| `rmtAuthoring` | Kann RMT die Faehigkeit deklarativ authoren oder als Adapter-Contract erreichen? |
| `fabricLane` | Gibt es Scheduler-, Lane-, Telemetry- oder Diagnostics-Anbindung? |
| `a11y` | Sind Fokus, Keyboard, Screenreader, Motion und Contrast bewertbar? |
| `performance` | Gibt es Budget-, Hydration-, Cleanup- oder Regression-Anbindung? |
| `security` | Sind DOM-, URL-, Event-, Style-, Import- und Trust-Grenzen klar? |
| `dependency` | Bleibt die Faehigkeit frei von Core-Runtime-Dependencies? |
| `nextPackage` | Welches NFM- oder bestehende WP macht die Faehigkeit produktiver? |

## Claim-Regeln

XTend darf eine Capability als `owned` claimen, wenn:

- eine lokale Runtime- oder Component-Flaeche existiert
- kein externer UI-Framework-Default noetig ist
- der RMT-Kernel keine Host-, DOM- oder Component-Typen importiert
- Component Contract, Maturity, Docs, Tests oder ein akzeptierter Ausnahmevertrag existieren
- Security- und Dependency-Grenzen nicht offen sind

Eine Capability darf nicht als `owned` claimen, wenn:

- sie nur durch eine externe Runtime-Dependency entsteht
- sie nur als Demo, Docs-Shortcut oder vendored Utility existiert
- RMT sie nur ueber freie HTML-Strings oder Inline-JavaScript ausdruecken kann
- Contract-, A11y-, Performance- oder Security-Pflichten fehlen und kein Folgepaket benannt ist

## Status-Schnitt

| Status | Bedeutung |
|--------|-----------|
| `ready-as-owned` | als Native-First Framework-Hebel direkt nutzbar |
| `ready-with-radar-watch` | owned, aber native Primitive-Evaluation bleibt offen |
| `needs-hardening` | owned oder contract-only, braucht WP07/WP08/WP09/WP18/WP19 |
| `needs-rmt-gap-analysis` | Capability existiert, aber RMT-Ausdruckskraft muss in WP14/WP15/WP16 bewertet werden |
| `accepted-residual` | Restflaeche bleibt mit Exit-Plan akzeptiert |
| `missing-owned-primitive` | neues Owned-Primitive-Paket erforderlich |

## Handoff

| Folgepaket | Handoff |
|------------|---------|
| `NFM-WP-07` | Overlay-, Dialog-, Popover-, Surface-, Focus- und Inert-Paket ist gehaertet |
| `NFM-WP-08` | Form-, List-, Navigation- und Media-Pakete sind gehaertet |
| `NFM-WP-09` | Theme-, State-, Event-, Slot- und Scheduler-Hebel sind geschnitten |
| `NFM-WP-10` | Market-Pattern-Parity gegen diese Matrix abgeschlossen; Data Display und Command/Search bleiben blockierte Claims |
| `NFM-WP-11` | Contract Registry inventarisiert Capability- und Contract-Oberflaechen |
| `NFM-WP-14` | RMT UI Primitive Gap Analysis nutzt Capability-Klassen und Radar-Refs |
| `NFM-WP-18` | DOM Descriptor, Trusted DOM und Renderer-Proofs priorisieren |
| `NFM-WP-19` | Bundle-, Complexity- und Performance-Budgets auf Capability-Gruppen anwenden |
| `NFM-WP-21` | Vendor-, Legacy- und Residual-Migration schneiden |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Capability-Klassen sind definiert | erfuellt |
| Component Contract v2 und Maturity sind angebunden | erfuellt |
| Browser Primitive Radar ist angebunden | erfuellt |
| Vendor-, Legacy- und Dependency-Grenzen sind angebunden | erfuellt |
| P0/P1/P2-Owned-Primitive-Pakete sind ableitbar | erfuellt |
| Framework-Claims ohne Contracts bleiben blockiert | erfuellt |

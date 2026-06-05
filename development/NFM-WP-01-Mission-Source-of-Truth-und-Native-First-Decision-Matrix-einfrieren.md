# NFM-WP-01 - Mission Source-of-Truth und Native-First-Decision-Matrix einfrieren

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.mission-source-of-truth.v1`
- Decision Matrix: `xtend.native-first.decision-matrix.v1`
- Contract-Dokument: `development/XTend-Native-First-Mission-Source-of-Truth-Contract.md`
- Boundary: `browser-native-first-before-framework-abstraction`
- Boundary: `avoid-runtime-dependency-by-default`
- Boundary: `rmt-kernel-remains-host-neutral`
- Boundary: `contracts-are-auditable-product-surface`
- Zielzustand: `native-first-mission-baseline-accepted`
- Gate: Dokumentationsreview gegen abgeschlossene Roadmaps, Component Contract v2, RMT vNext und Kernel Trust

## Ziel

`NFM-WP-01` macht die Native-First-Mission operativ startbar. Das Paket friert die Conference-Entscheidungen als dauerhafte Architecture- und Product-Governance-Sprache ein, bevor Folgepakete Browser-Primitives, Dependencies, eigene UI-Primitives, Contract Registry oder RMT-Syntax erweitern.

Das Paket implementiert noch keinen Browser-Radar, keine Dependency-Auswertung, keine Runtime-Aenderung und keine neue RMT-Syntax. Es verhindert bewusst, dass Folgepakete ohne gemeinsame Mission, Entscheidungslogik oder Non-Goals starten.

## Umgesetzt

- `development/XTend-Native-First-Mission-Source-of-Truth-Contract.md` angelegt
- Contract `xtend.native-first.mission-source-of-truth.v1` akzeptiert
- Decision Matrix `xtend.native-first.decision-matrix.v1` definiert
- Native-First Precedence als Beweislastregel dokumentiert
- Dependency-Default `avoid-runtime-dependency` eingefroren
- RMT Maximality Boundary von imperativer Sprache und Host-Kopplung abgegrenzt
- Contracts als auditierbare Produktoberflaeche definiert
- Non-Goals fuer externe Framework-Kopplung, Eval, unsichere HTML-Sinks und Big-Bang-Migrationen festgelegt
- Source-of-Truth fuer Roadmap, Workpackages, Component Contracts, RMT Contracts, Kernel Trust, Supply Chain, Tests und Docs definiert
- Handoff fuer `NFM-WP-02`, `NFM-WP-03`, `NFM-WP-04`, `NFM-WP-06`, `NFM-WP-11` und `NFM-WP-14` dokumentiert

## Mission-Entscheidung

XTend wird als browsernahes, contract-sicheres und RMT-orchestriertes UI-Framework weiterentwickelt.

Die Mission besteht aus fuenf fuehrenden Entscheidungen:

- Browser-native Primitives werden vor eigenen Abstraktionen und vor externen Dependencies geprueft.
- Eigene XTend-Komponenten und Adapter sind die bevorzugte Antwort, wenn native Primitives allein nicht reichen.
- Runtime-Dependencies sind Ausnahme und brauchen Capability-Gap, Owner, Audit-Nutzen, Exit-Plan und Review-Datum.
- Contracts muessen auffindbar, maschinenlesbar, testbar und in Release Evidence sichtbar sein.
- RMT soll vollstaendige UIs deklarativ ausdruecken koennen, ohne den Kernel an Host-, Browser- oder Framework-Runtimes zu koppeln.

## Decision-Matrix-Entscheidung

Jede kuenftige Mission-relevante Erweiterung wird gegen diese Bewertungsachsen geprueft:

| Achse | Pflichtfrage |
|-------|--------------|
| Browser-Native | Gibt es ein natives Primitive oder einen absehbaren Browser-Standard? |
| Evergreen Compatibility | Ist die Faehigkeit fuer den Zielbrowser-Satz stabil genug? |
| Performance | Verbessert oder begrenzt sie Mount-, Hydration-, Interaction- oder Bundle-Kosten? |
| Complexity | Entfernt sie Framework-Code oder erzeugt sie neue Abstraktionslast? |
| Security | Passt sie zu Trusted DOM, Kernel Trust und Supply-Chain-Gates? |
| A11y | Ist das Verhalten browsernah und assistive-tech-sicher pruefbar? |
| RMT Authoring | Ist die Faehigkeit als RMT Core Record, Syntax oder Adapter-Contract ausdrueckbar? |
| Contract Parity | Gibt es Contract-, Runtime-, Test-, Docs- und Report-Gegenstuecke? |
| Exit Plan | Kann die Entscheidung spaeter migriert, ersetzt oder deaktiviert werden? |

Erlaubte Outcomes:

- `adopt-native`
- `wrap-as-xtend-primitive`
- `build-owned-primitive`
- `keep-existing-owned-path`
- `defer-with-watch`
- `allow-runtime-dependency-exception`
- `reject-for-now`

## Scope-Entscheidung

In Scope fuer die Native-First-Mission-Baseline:

- Browser-native-first als Architekturgrundsatz
- eigene Framework-Komponenten und Framework-Hebel als strategischer Produktpfad
- Dependency-Minimierung und Runtime-Dependency-Ausnahmen
- Contract Discoverability, Auditierbarkeit und Runtime-Parity als Produktstaerke
- RMT-Maximalitaet fuer UI-Authoring bei deklarativer, pruefbarer Semantik
- host-neutrale Kernel-Grenze
- Handoff an Radar-, Dependency-, Component-, Contract- und RMT-Gap-Folgepakete

Out of Scope fuer `NFM-WP-01`:

- konkrete Browser-Primitive-Adoptionsentscheidungen
- Package-, Bundle- oder Dependency-Aenderungen
- Component-Migrationen
- Runtime- oder Renderer-Umbauten
- neue RMT-Syntax
- neue Testsuiten ausser Dokumentations- und Referenzpfad-Review
- Public-Publish-Entscheidungen

## Source-of-Truth

| Artefaktklasse | Rolle |
|----------------|-------|
| `development/ROADMAP-XTend-Native-First-Framework-Mission.md` | Roadmap, Phasen, Workpackages und Handoff |
| `development/XTend-Native-First-Mission-Source-of-Truth-Contract.md` | fuehrender Mission- und Decision-Matrix-Contract |
| `development/NFM-WP-*.md` | Workpackage-Abnahmen |
| `development/XTend-Component-Contract-v2.md` | Basis fuer owned Framework-Primitives |
| `development/XTendRMT-vNext-*.md` | Basis fuer RMT-Ausdruckskraft und Syntax/Core-Grenzen |
| `development/XTendRMT-Kernel-Trust-Hardening-Contract.md` | Basis fuer Runtime Trust und Security-Parity |
| `development/XTend-Supply-Chain-Gate-Plan.md` | Basis fuer Dependency- und Audit-Policy |
| `tests/rmt/` | RMT Contract-, Fixture-, Golden- und Authoring-Gates |
| `tests/references/` | Dokumentations- und Referenzpfad-Gates |
| `docs/` | produktive Adoption-, Migration- und Authoring-Oberflaeche |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Mission ist als Contract dokumentiert | erfuellt: `xtend.native-first.mission-source-of-truth.v1` |
| Decision Matrix ist benannt | erfuellt: `xtend.native-first.decision-matrix.v1` |
| Browser-native-first ist fuehrende Beweislastregel | erfuellt |
| Dependency-Default ist festgelegt | erfuellt: `avoid-runtime-dependency` |
| RMT-Kernel-Boundary ist bestaetigt | erfuellt: `rmt-kernel-remains-host-neutral` |
| Contracts sind als Produktoberflaeche definiert | erfuellt |
| Non-Goals sind explizit | erfuellt |
| Folgepakete haben Handoff | erfuellt |

## Verifikation

`NFM-WP-01` ist ein Dokumentations-, Scope- und Contract-Gate. Ein Runtime-, Browser- oder Parser-Test ist noch nicht erforderlich, weil Radar, Dependency Policy, Contract Registry und RMT-Gap-Tests erst in Folgepaketen entstehen.

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

`NFM-WP-01` ist abgeschlossen. Die Native-First-Mission-Baseline ist akzeptiert.

Folgestatus nach `NFM-WP-02`, `NFM-WP-03`, `NFM-WP-04`, `NFM-WP-05` und `NFM-WP-06`:

- `NFM-WP-02` hat den Browser Primitive Radar aufgebaut.
- `NFM-WP-03` hat das Adoption Gate und ADR-Template definiert.
- `NFM-WP-04` hat die Dependency Diet Policy auf `avoid-runtime-dependency` finalisiert.
- `NFM-WP-05` hat Vendor- und Legacy-Replacement-Kandidaten priorisiert.
- `NFM-WP-06` hat die XTend UI Primitive Capability Matrix erstellt.
- `NFM-WP-11` kann Contract Registry und Discoverability produktisieren.
- `NFM-WP-14` kann die RMT UI Primitive Gap Analysis starten.

Neue Primitive-Adoptionsentscheidungen sollen nach `NFM-WP-02` einen Browser-Primitive-Radar-Ref nutzen.

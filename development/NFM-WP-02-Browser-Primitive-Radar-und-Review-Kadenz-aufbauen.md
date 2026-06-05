# NFM-WP-02 - Browser Primitive Radar und Review-Kadenz aufbauen

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Radar Contract: `xtend.native-first.browser-primitive-radar.v1`
- Radar Entry Contract: `xtend.native-first.browser-primitive-radar-entry.v1`
- Review Cadence Contract: `xtend.native-first.browser-primitive-review-cadence.v1`
- Contract-Dokument: `development/XTend-Native-First-Browser-Primitive-Radar-Contract.md`
- Radar: `development/XTend-Native-First-Browser-Primitive-Radar.md`
- Adoption Gate: `xtend.native-first.primitive-adoption-gate.v1`
- Dependency Diet Policy: `xtend.native-first.dependency-diet-policy.v1`
- Boundary: `radar-entry-precedes-runtime-adoption`
- Boundary: `no-browser-support-claim-without-evidence`
- Boundary: `radar-does-not-override-adoption-gate`
- Zielzustand: `browser-primitive-radar-ready`
- Gate: lokale Referenzpfad- und ASCII-Pruefung

## Ziel

`NFM-WP-02` baut den Browser Primitive Radar und die Review-Kadenz fuer die Native-First-Mission auf. Das Paket macht neue Browser-Faehigkeiten sichtbar, priorisierbar und ADR-faehig, ohne spekulative Adoption in Runtime-, Component-, RMT-, Fabric-, Docs- oder Tooling-Pfade zu tragen.

## Umgesetzt

- `development/XTend-Native-First-Browser-Primitive-Radar-Contract.md` angelegt
- Contract `xtend.native-first.browser-primitive-radar.v1` akzeptiert
- Entry Contract `xtend.native-first.browser-primitive-radar-entry.v1` definiert
- Review Cadence Contract `xtend.native-first.browser-primitive-review-cadence.v1` definiert
- `development/XTend-Native-First-Browser-Primitive-Radar.md` angelegt
- Radar-Kategorien fuer DOM, Components, Forms, Layout, Navigation, Animation, Scheduling, Observability, Storage, Security, Network, Media und Accessibility definiert
- erste Radar-IDs `NFM-BPR-001` bis `NFM-BPR-020` angelegt
- Review-Kadenz fuer quartalsweise Reviews, Release-Reviews, Adoption Requests, Security-Trigger und Dependency-Trigger definiert
- `pre-radar` aus `NFM-WP-03` als Uebergangsmodus geschlossen
- Handoff an `NFM-WP-06`, `NFM-WP-07`, `NFM-WP-08`, `NFM-WP-14`, `NFM-WP-18` und `NFM-WP-19` beschrieben

## Scope-Entscheidung

In Scope fuer `NFM-WP-02`:

- primitive Kategorien fuer DOM, Components, Forms, Layout, Navigation, Animation, Scheduling, Observability, Storage, Security, Network, Media und Accessibility
- quartalsweiser und release-bezogener Review
- Browser-Lab-Evidence als Pflicht vor Produktadoption
- Radar-IDs fuer Adoption ADRs
- Mapping auf `adopt-native`, `wrap-as-xtend-primitive`, `defer-with-watch`, `reject-for-now` und bestehende Mission-Outcomes
- Handoff an Adoption Gate, Dependency Diet, Trusted DOM und RMT vNext

Out of Scope fuer `NFM-WP-02`:

- echte Browser-Lab-Ausfuehrung
- Live-Kompatibilitaetsclaim fuer einzelne Browser
- Runtime-, Component-, Renderer- oder Parser-Aenderungen
- maschinenlesbarer Radar-Runner
- konkrete Adoption ADRs fuer einzelne Primitives
- neue RMT-Syntax

## Radar-Entscheidung

Der Radar ist ab jetzt die Pflichtquelle fuer neue Primitive-ADRs. Neue Produktentscheidungen sollen einen `primitiveRadarRef` wie `NFM-BPR-001` referenzieren. `pre-radar` bleibt nur fuer historische Uebergangsentscheidungen vor Abschluss von `NFM-WP-02` akzeptiert.

Ein Radar-Eintrag mit `needs-browser-lab` ist ein Arbeitsauftrag, kein Produktclaim.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Primitive-Radar-Datei fuehrt Kandidaten | erfuellt |
| Radar-Kategorien sind definiert | erfuellt |
| Review-Datum und naechste Review-Kadenz sind definiert | erfuellt |
| Entscheidungen und Risiken sind dokumentiert | erfuellt |
| Folgepakete sind benannt | erfuellt |
| `pre-radar` ist auf `radar-linked` gemappt | erfuellt |

## Verifikation

`NFM-WP-02` ist ein Dokumentations-, Scope- und Contract-Gate. Ein Browser-Lab- oder Runtime-Test ist noch nicht erforderlich, weil konkrete Adoptionen erst in Folgepaketen entstehen.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js references --json
```

Ergebnis am 3. Juni 2026:

- `references`: `passed` mit 2073 Referenzpfad-Checks, 0 Failures, 0 Warnings
- `supply-chain`: `passed` mit 67 Checks, 0 Failures, 0 Warnings
- ASCII-Check fuer WP-02-, Roadmap-, Mission-, Adoption-Gate-, ADR-Template- und WP-01/WP-03-Dateien: sauber

## Handoff

`NFM-WP-02` ist abgeschlossen. Der Browser Primitive Radar und die Review-Kadenz sind akzeptiert.

Naechste Folgearbeit:

- `NFM-WP-03` nutzt fuer neue ADRs `radar-linked` statt `pre-radar`.
- `NFM-WP-06` hat UI Capability Matrix Ergebnisse gegen Radar-IDs klassifiziert.
- `NFM-WP-07` hat Overlay- und Focus-Primitives mit Radar-Refs gehaertet; `NFM-WP-08` hat Form-, Navigation-, list-like Display- und Media-Primitives mit Radar-Refs bewertet.
- `NFM-WP-14` kann RMT UI Gap Analysis nach Radar-Kategorien strukturieren.
- `NFM-WP-18` kann DOM Descriptor und Renderer-Proofs anhand P0/P1-Radar-Entries priorisieren.
- `NFM-WP-19` kann Performance-, Complexity- und Bundle-Budget-Evidence an Radar-Entries haengen.

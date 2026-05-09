# WP-E05-01 - Epic-04-Handoff akzeptieren und Upstream-Source-of-Truth festlegen

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E04-11-Upstream-Handoff-Spezifikation-fuer-XTendRMT-DSL-und-Bridge-vorbereiten.md`
  - `development/WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-manifest.json`
  - `xtendrmt/rmt-core.d.ts`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `xtendrmt/xtendrmt-bestcase-demo.js`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E05-01` nimmt den Epic-04-Handoff verbindlich an und legt fest, welche Ebene ab Epic 05 als Source-of-Truth fuer produktive XTendRMT Bridge-, DSL-, Routing-, Component-, Adapter- und Testarbeit gilt.

Das Paket klaert bewusst zuerst die Strukturfrage, bevor `WP-02` den Host Adapter Contract definiert. Dadurch landen die naechsten Bridge-Features nicht in generierten Bundles, Demo-Code oder losen `manifest.metadata`-Ausweichpfaden.

## Handoff-Annahme

Epic 04 ist mit `development/WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md` abgeschlossen. Die Eingangsbedingungen fuer Epic 05 werden angenommen:

- `development/XTendRMT-Upstream-Handoff-Spezifikation.md` ist der fachliche Startcontract fuer DSL, Bridge, native Routes und Adapter.
- Build-Artefakte in `xtendrmt/` bleiben Output, Demo-Basis und Regression-Referenz.
- Produktive RMT-Arbeit wird in upstream Source oder aequivalent getrennten Modulverantwortungen verankert.
- RMT Kernel, DSL, Routing, Components, Host Adapter, XTend Adapter, XRouter Adapter und Tests bleiben getrennte Verantwortungsbereiche.
- XTend wird First-Class Host ueber Adapterqualitaet, nicht ueber Kernel-Sonderfaelle.
- XRouter wird erster produktiver Router Adapter, aber nicht das einzige Routing-Modell.
- Template-only-`.rmt` Dokumente bleiben gueltig.

## Source-of-Truth-Entscheidung

Die Source-of-Truth fuer Epic 05 ist die upstream RMT-Quellstruktur. In diesem Repository ist diese Struktur aktuell nicht als eigene Source-Tree-Ebene oberhalb der Artefakte vorhanden. Bis sie in `WP-13` durch Build-Pipeline und Artefakt-Paritaet physisch angebunden wird, gilt folgende Entscheidung:

| Ebene | Rolle ab Epic 05 | Darf produktive Entscheidungen fuehren? |
|-------|------------------|------------------------------------------|
| upstream RMT Source | fuehrende Architekturquelle fuer Kernel, DSL, Adapter, Routing, Components, Tests und Build-Pipeline | ja |
| `development/XTendRMT-Upstream-Handoff-Spezifikation.md` | verbindlicher Startcontract, solange upstream Source hier noch nicht physisch liegt | ja, fuer Architektur- und Contract-Entscheidungen |
| `development/WP-E05-*.md` | operative Entscheidungs- und Review-Dokumente fuer einzelne Epic-05-Schritte | ja, fuer Workpackage-Ergebnisse |
| `xtendrmt/rmt.schema.json` | generierter oder bewusst synchronisierter Schema-Output und statische Regression-Referenz | nein, nur synchronisiert |
| `xtendrmt/rmt-core.d.ts` | Typ-Artefakt und Konsumentenvertrag der aktuellen Build-Version | nein, nur synchronisiert |
| `xtendrmt/rmt-core.esm.js`, `xtendrmt/rmt-runtime.esm.js`, `xtendrmt/rmt-runtime.browser.js` | Runtime-Bundles der aktuellen Artefaktversion | nein, nur Build-Output |
| `xtendrmt/xtendrmt-bestcase-demo.rmt` | Demo- und Handoff-Referenz fuer Pilotdaten | nein, keine produktive DSL-Quelle |
| `xtendrmt/xtendrmt-bestcase-demo.js` | UI-Inspect-Demo und Regression-Referenz | nein, kein produktiver Adapter |
| `tests/rmt/*` und `tests/references/*` | lokale Gates fuer Contract-, Handoff- und Regression-Stabilitaet | ja, als Abnahmequelle |

Damit ist die lokale Build-Artefaktversion arbeitsfaehig, aber nicht fuehrend. Neue Bridge-, Adapter- und Routing-Features duerfen nur dann in `xtendrmt/` erscheinen, wenn sie als Output aus upstream Source erzeugt oder bewusst mit einem Workpackage-Entscheid synchronisiert wurden.

Kurzform: `xtendrmt/` bleibt Build-Artefakt, Demo-Basis und Regression-Referenz.

## Modulverantwortungsmatrix

Die konkrete upstream-Paketbenennung darf spaeter abweichen. Die Verantwortungen sind fuer Epic 05 verbindlich:

| Modulbereich | Source-of-Truth-Verantwortung | Artefakt-/Demo-Grenze |
|--------------|-------------------------------|------------------------|
| `rmt-kernel` | Scheduler, Runtime, Template Registry, Execution Plans, Diagnostics und Performance-Budgets | kein XTend-, XRouter- oder `xstate`-Import |
| `rmt-dsl` | Dokumentmodell, Parser/Normalizer, Schema Source, Referenzaufloesung und Backward Compatibility | `rmt.schema.json` bleibt Output |
| `rmt-routing` | native `routes` Domain, Route Registry, Lifecycle Events, Params, Query und Metadata | XRouter bleibt Adapter |
| `rmt-components` | native `components` Domain, Component Registry, Mount/Hydration Contracts | XTend Tags bleiben Adapterdaten |
| `rmt-adapters` | Host Adapter Contract, Capability Negotiation, Diagnostics und Adapter Lifecycle | Kernel sieht nur neutrale Adapter-Records |
| `rmt-adapter-xtend` | XTend Manifest, Custom Elements, Slots, Events, Hydration, Theme, API und optionale `xstate` Bridge | XTend wird optionaler First-Class Host |
| `rmt-adapter-xrouter` | Mapping von RMT Routes auf XRouter, Navigation Sync und Route Lifecycle | XRouter wird erste Implementierung, nicht Pflichtmodell |
| `rmt-tests` | Schema-, Contract-, Runtime-, Browser- und Artifact-Parity-Gates | lokale Gates muessen Handoff und Regression pruefen |

## Build-Artefakt-Grenze fuer `xtendrmt/`

Ab `WP-E05-01` gilt fuer `xtendrmt/`:

- `xtendrmt/` darf fuer Regression, Demos und Smoke Tests gelesen werden.
- `xtendrmt/` darf als synchronisierter Output aktualisiert werden, wenn ein Workpackage die Herkunft und Gate-Abnahme dokumentiert.
- `xtendrmt/` darf nicht als alleinige Architekturquelle fuer Bridge-, Routing-, Component-, Adapter- oder DSL-Entscheidungen verwendet werden.
- Demo-Metadaten duerfen als Fixtures dienen, muessen aber in native Domains und Adapter-Contracts ueberfuehrt werden, bevor sie produktive Semantik erhalten.
- Bundle-Patches ohne upstream Source- oder Workpackage-Entscheidung sind kein erlaubter Umsetzungspfad.

## Startentscheidung fuer WP-02

`WP-02` darf jetzt starten. Der Host Adapter Contract wird gegen `rmt-adapters` als upstream Verantwortungsbereich entworfen und darf keine XTend-Sonderfaelle in den Kernel schreiben.

Die erste Contract-Arbeit muss mindestens diese neutrale Flaeche vorbereiten:

- Adapter Registrierung
- Capability Negotiation
- Component Mounting und Hydration
- Route Registrierung und Navigation
- State Bridge als optionale Host Capability
- Scheduler Endpoint Binding
- Diagnostics Emission

XTend, XRouter, React, Vue, Vanilla JS und Custom Hosts muessen denselben Host Adapter Contract nutzen koennen. XTend- und XRouter-spezifische Details duerfen erst in `rmt-adapter-xtend` und `rmt-adapter-xrouter` sichtbar werden.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Epic 05 hat eine klare Architekturquelle | erfuellt: upstream RMT Source ist Source-of-Truth; Handoff- und WP-Dokumente fuehren, bis sie physisch angebunden ist |
| Build-Artefakte sind weiterhin Output, nicht Source-of-Truth | erfuellt: `xtendrmt/` ist Output, Demo-Basis und Regression-Referenz |
| Modulverantwortungen sind getrennt | erfuellt: Kernel, DSL, Routing, Components, Adapter, XTend Adapter, XRouter Adapter und Tests sind getrennt |
| `WP-02` kann ohne Strukturunklarheit starten | erfuellt: Host Adapter Contract startet in `rmt-adapters` und bleibt host-neutral |

## Verifikation

Mindestgate fuer diese Entscheidung:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js rmt-compatibility --json
npm test
```

## Ergebnis

`WP-E05-01` ist abgeschlossen. Epic 05 akzeptiert den Epic-04-Handoff, legt upstream RMT Source als Source-of-Truth fest, haelt `xtendrmt/` als Build-Artefakt- und Regressionsebene abgetrennt und macht `WP-02` startbereit.

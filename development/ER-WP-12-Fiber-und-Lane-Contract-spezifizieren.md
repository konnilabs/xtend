# ER-WP-12 - Fiber- und Lane-Contract spezifizieren

- Status: `completed`
- Datum: 5. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-12.fiber-lane-contract.v1`
- Zielcontract: `development/XTend-Fiber-und-Lane-Contract.md`
- Fiber Contract: `xtend.fabric.fiber.v1`
- Lane Contract: `xtend.fabric.lane.v1`
- Bezug:
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/ADR-XTend-Fabric.md`
  - `development/WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md`
  - `development/WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `tests/references/reference_path_suite.js`

## Ziel

`ER-WP-12` definiert UI-Arbeit in XTend als Fiber und priorisiert sie ueber Fabric-Lanes.

Das Paket implementiert noch keine Runtime-Instrumentierung. Es friert die Contract-Sprache ein, damit `ER-WP-08`, `ER-WP-09`, `ER-WP-13`, `ER-WP-14`, `ER-WP-15` und `ER-WP-16` dieselbe Basis verwenden.

## Ergebnisartefakt

Der verbindliche Contract liegt in:

```text
development/XTend-Fiber-und-Lane-Contract.md
```

Er traegt:

- `xtend.fabric.fiber-lane-contract.v1`
- `xtend.fabric.fiber.v1`
- `xtend.fabric.lane.v1`

## Fiber-Mindestform

Eine Fiber muss mindestens diese Felder modellieren koennen:

- `schema`
- `id`
- `kind`
- `lane`
- `phase`
- `status`
- `source`
- `scope`
- `componentRef`
- `routeRef`
- `scheduleRef`
- `endpointNameHint`
- `fiberParentId`
- `correlationId`
- `budgetClass`
- `deadlineMs`
- `preferIdle`
- `coalesceKey`
- `startedAt`
- `endedAt`
- `durationMs`
- `result`
- `diagnostics`
- `metadata`

Pflichtfelder fuer eine valide Runtime-Fiber sind `schema`, `id`, `kind`, `lane`, `phase`, `status`, `source` und `scope`.

## Kanonische Lanes

`ER-WP-12` akzeptiert diese Fabric-Lanes:

| Lane | Zweck |
|------|-------|
| `user-blocking` | Eingabe, Fokus, Navigation, Dialog-Interaktion |
| `a11y` | Screenreader, Fokusreparatur und ARIA-State |
| `visible` | sichtbarer Mount, Render und Hydration |
| `transition` | Route- und UI-Uebergaenge |
| `idle` | nicht sichtbare Hydration, Prefetch und Follow-up |
| `background` | Cache, Preview und Docs-nahe Arbeit |
| `diagnostics` | Telemetry, Snapshots und Reporter-Vorbereitung |

Die Lanes sind Fabric-semantisch. Sie sind kein erzwungener Ersatz fuer bestehende RMT Schedule-Lanes. Das konkrete Mapping startet in `ER-WP-13`.

## RMT Boundary

Der Contract bereitet RMT Scheduling vor, ohne XTendRMT zu vereinnahmen.

Erlaubt:

- `scheduleRef` auf RMT Schedule Policies vorbereiten
- `endpointNameHint`, `budgetClass`, `deadlineMs`, `preferIdle` und `coalesceKey` als Mapping-Hints nutzen
- RMT Adapter Results als `rmt.adapter-result` Fiber darstellen
- Diagnostics ueber `fiberId`, `lane` und `correlationId` korrelieren

Nicht erlaubt:

- RMT Kernel importieren
- RMT Scheduler Policies in Fabric parsen oder validieren
- RMT-Lane-Namen als Fabric Public API erzwingen
- XTend als Pflicht-Host fuer RMT etablieren

## Handoff an Folgepakete

| Folgepaket | Startstatus nach ER-WP-12 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-08` | ready | `runFiber` kann die Fiber-Mindestform verwenden |
| `ER-WP-09` | next | Component Lifecycle Boundaries koennen `fiberId`, `lane`, `phase` und `componentRef` melden |
| `ER-WP-13` | ready | Lane Mapping auf RMT Schedule Policies kann starten |
| `ER-WP-14` | blocked | wartet auf Fabric Runtime und RMT Lane Mapping |
| `ER-WP-15` | completed | Route Navigation/Render Fibers setzen auf Fabric Runtime, Mapping und Component Instrumentierung auf |
| `ER-WP-16` | completed | fuehrt Runtime-, Diagnostics- und Instrumentierungsdaten als Telemetry Snapshot zusammen |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Fiber-Felder sind definiert | erfuellt: `xtend.fabric.fiber.v1` |
| Lane-Liste ist definiert | erfuellt: `xtend.fabric.lane.v1` |
| Budget- und Diagnostics-Korrelation ist vorbereitet | erfuellt: `budgetClass`, `deadlineMs`, `diagnostics`, `correlationId` |
| RMT-Grenze ist klar | erfuellt: Mapping erst in `ER-WP-13`, kein Kernel-Import |
| `ER-WP-13` kann starten | erfuellt |

## Verifikation

Mindestgate fuer dieses Paket:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`ER-WP-12` ist abgeschlossen. XTend UI-Arbeit ist als Fiber mit Lane, Budget, Phase, Ergebnis und Diagnostics-Korrelation spezifiziert. `ER-WP-13` ist startbereit und kann die Fabric-Lanes auf RMT Schedule Policies abbilden.

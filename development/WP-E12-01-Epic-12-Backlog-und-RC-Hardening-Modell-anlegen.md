# WP-E12-01 - Epic-12-Backlog und RC-Hardening-Modell anlegen

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung`
- Backlog: `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md`
- Contract: `xtend.epic12.wp01.backlog-and-rc-hardening.v1`
- Bezug:
  - `development/XTend-Epic12-RC-Hardening-Modell.md`
  - `development/XTend-Epic11-Abschluss-und-Enterprise-UX-Handoff.md`
  - `development/XTend-Epic11-Legacy-Long-Tail-Migrationsplan.md`
  - `docs/epic11-enterprise-ux-handoff.md`
  - `docs/component-long-tail-migration.md`
  - `catalog/epic11-enterprise-ux-handoff.js`
  - `catalog/component-long-tail-migration.js`

## Ziel

`WP-E12-01` macht Epic 12 operativ startbar. Das Paket uebernimmt den Epic-11-Handoff und legt ein RC-Hardening-Modell fest, das die akzeptierten Long-Tail-Restpunkte in konkrete Runtime-, Visual- und Release-Candidate-Reife ueberfuehrt.

Das Paket erzeugt bewusst noch keine Runtime-Aenderung. Es verhindert, dass die Long-Tail-Haertung als ungeordnete Einzelkorrektur startet.

## Ausgangslage

Epic 11 ist im Modus `completed-with-accepted-long-tail-handoff` abgeschlossen.

Akzeptierte Restpunkte:

- `x-tabs`: P0, Performance Profile
- `x-theme`: P1, A11y und Performance
- `x-button`: P1, Performance Profile
- `x-menu`: P1, Performance Profile
- `xstate`: P1, Suite, Fixture, Types, A11y, Performance
- `x-utils`: P2, Suite, Fixture, Types, Performance

Der wichtigste fachliche Blocker ist `x-tabs`, weil damit der P0-Performance-Restpunkt geschlossen wird.

## Backlog-Entscheidung

Epic 12 wird in 16 Workpackages zerlegt.

Die Startlogik lautet:

- `WP-E12-02` und `WP-E12-03` schliessen `x-tabs`.
- `WP-E12-04` und `WP-E12-05` schliessen `x-theme`.
- `WP-E12-06` und `WP-E12-07` haerten `x-button` und `x-menu`.
- `WP-E12-08` und `WP-E12-09` bauen Boundary-Probes fuer `xstate` und `x-utils`.
- `WP-E12-10` und `WP-E12-11` fuehren Visual Snapshot Automation ein.
- `WP-E12-12` und `WP-E12-13` bereiten Design Tokens und RMT DSL Polish vor.
- `WP-E12-14` bis `WP-E12-16` finalisieren RC0 Gate Matrix, Docs und Handoff.

## RC-Hardening-Entscheidung

Das neue Modell `xtend.epic12.rc-hardening-model.v1` wird akzeptiert.

Die Reifegrade sind:

- `handoff-accepted`
- `runtime-ready`
- `visual-ready`
- `rc-candidate-ready`
- `deferred-with-owner`

Wichtige Entscheidung:

Eine Komponente ist nach Epic 12 nicht mehr nur deshalb release-kandidatenfaehig, weil ein Handoff existiert. Sie muss die relevante Restdimension aktiv verlieren oder eine Owner-gezeichnete Ausnahme erhalten. Fuer `x-tabs` ist keine Ausnahme vorgesehen; der P0-Restpunkt muss geschlossen werden.

## Startbare Folgepakete

### WP-E12-02

`WP-E12-02` darf sofort starten und finalisiert `x-tabs` Performance Profile und Runtime-Budget.

### WP-E12-04

`WP-E12-04` ist fachlich startbar, sollte aber nicht vor `WP-E12-02` priorisiert werden.

### WP-E12-08

`WP-E12-08` ist fachlich startbar, eignet sich aber eher als paralleler Boundary-Probe-Pfad.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Backlog liegt vor | erfuellt: `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md` |
| RC-Hardening-Modell liegt vor | erfuellt: `development/XTend-Epic12-RC-Hardening-Modell.md` |
| Workpackages sind priorisiert | erfuellt: `WP-E12-01` bis `WP-E12-16` mit P0/P1/P2 |
| naechstes Paket ist startbar | erfuellt: `WP-E12-02` |
| Long-Tail-Komponenten sind mit Zielreife markiert | erfuellt |
| keine RMT-Kernelkopplung an XTend | erfuellt |
| Publish Boundary bleibt erhalten | erfuellt: `private-until-release-owner-acceptance` |

## Verifikation

Mindestgate fuer dieses Paket:

```bash
node scripts/run_xtend_tests.js references --json
```

## Ergebnis

`WP-E12-01` ist abgeschlossen. Epic 12 besitzt ein startbares Backlog, ein akzeptiertes RC-Hardening-Modell und eine klare Folge-Sequenz fuer `x-tabs`, `x-theme`, `x-button`, `x-menu`, `xstate`, `x-utils`, Visual Snapshot Automation und RC0-Handoff.

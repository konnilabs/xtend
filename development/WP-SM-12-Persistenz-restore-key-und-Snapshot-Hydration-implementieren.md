# WP-SM-12 - Persistenz, `restore-key` und Snapshot-Hydration implementieren

Status: `completed`

## Ziel

Surface Layouts und Lifecycle-Zustaende koennen kontrolliert gespeichert, geladen, invalidiert und zurueckgesetzt werden. `x-surface-manager` bleibt dabei die UI-nahe Orchestrierungsschicht; der SurfaceController bleibt die einzige Registry-Wahrheit.

## Contract

| Feld | Wert |
| --- | --- |
| Schema | `xtend.surface.manager-persistence.v1` |
| Persisted Snapshot | `xtend.surface.persisted-snapshot.v1` |
| Snapshot | `xtend.surface.snapshot.v1` |
| Gate | `node scripts/run_xtend_tests.js surface-persistence --json` |
| Package Script | `npm run test:surface-persistence` |

## Umsetzung

- `x-surface-manager` unterstuetzt `restore-key`, `persistence-mode` und `restore-policy`.
- `persistence-mode` kennt `none`, `memory`, `session` und `local`.
- Ohne `restore-key` wird nichts persistiert.
- Mit `restore-key` und ohne explizites `persistence-mode` wird `session` als entwicklerfreundlicher Default genutzt.
- Gespeichert wird ein layout-only Envelope unter `xtend.surface.persisted-snapshot.v1`.
- Restore validiert Manager, Restore-Key, Snapshot-Schema und Version.
- Legacy-Snapshots im direkten `xtend.surface.snapshot.v1` Format koennen als Version `0` migriert werden.
- Restore spielt Bounds, Open/Closed/Minimized, Stack, Active Surface, Placement, Mode, Pin/Collapse und Modalitaet ueber Controller-Operationen ein.
- `clearPersistedSnapshot()` und `resetSurfaceLayout()` liefern Opt-out- und Reset-Verhalten.
- Ungueltige Snapshots fuehren zu `surface-restore-skipped` oder `surface-persistence-error`, nicht zu einem harten Laufzeitabbruch.

## Artefakte

| Artefakt | Rolle |
| --- | --- |
| `components/xsurfacemanager.js` | Runtime-Persistenzadapter am Manager |
| `components/xsurfacemanager.d.ts` | Public Types fuer Persistenzmethoden und Events |
| `catalog/surface-manager-persistence.js` | Maschinenlesbarer WP-SM-12 Contract |
| `tests/components/fixtures/xsurfacemanager-persistence.component.html` | Browsernahe Fixture |
| `tests/components/surface_manager_persistence_suite.js` | Lokaler Gate |
| `docs/surface-manager-persistence.md` | Entwicklerdokumentation |

## Abnahme

- Reload mit `restore-key` kann ein Surface Layout wieder herstellen.
- Inkompatible Snapshots werden kontrolliert uebersprungen.
- Keine Persistenz erfolgt ohne `restore-key` oder aktive Policy.
- Content-Payloads werden nicht gespeichert.
- Keine zweite Registry entsteht (`no-second-surface-registry`).
- Der RMT-Kernel importiert keine XTend-Typen oder Komponenten.

## Folge

`WP-SM-13` kann Shell-first Lazy Loading und Skeleton-Hydration auf persistierten Surface-Zustaenden aufsetzen.

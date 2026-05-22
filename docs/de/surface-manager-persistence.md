# SurfaceManager Persistence

`x-surface-manager` kann Surface-Layouts unter einem `restore-key` speichern und beim naechsten Start wieder ueber den SurfaceController einspielen.

## Attribute

| Attribut | Werte | Zweck |
| --- | --- | --- |
| `restore-key` | string | Stabiler Schluessel fuer das App-Shell-Layout |
| `persistence-mode` | `none`, `memory`, `session`, `local` | Storage-Backend fuer Snapshots |
| `restore-policy` | `auto`, `manual`, `reset` | Auto-Restore beim Connect oder manuelle Steuerung |

Ohne `restore-key` bleibt Persistenz aus. Mit `restore-key` und ohne explizites `persistence-mode` nutzt die Runtime `session`.

## API

- `snapshotPersistence()` gibt den aktiven Persistenzcontract zurueck.
- `persistSnapshot(snapshot, options)` speichert einen layout-only Snapshot.
- `restorePersistedSnapshot(options)` liest und hydriert einen gespeicherten Snapshot.
- `clearPersistedSnapshot(options)` entfernt den gespeicherten Snapshot.
- `resetSurfaceLayout(options)` loescht Persistenz und registriert die deklarierten Surface-Elemente neu.

Gespeichert wird `xtend.surface.persisted-snapshot.v1`. Content-Payloads werden nicht persistiert; erhalten bleiben Surface IDs, Bounds, Stack, Active Surface, Panel Modes, Status und Content-Refs.

## Boundaries

- Der SurfaceController bleibt die einzige Registry-Wahrheit.
- Restore laeuft ueber Controller-Operationen, nicht durch direktes Mutieren einer zweiten Registry.
- Ungueltige oder inkompatible Snapshots fuehren zu einem kontrollierten Skip mit Diagnostic.
- Der RMT-Kernel importiert keine XTend-Komponenten.

# SurfaceManager Controller

Der Controller ist das hostneutrale Zustandsmodell hinter `x-surface-manager`. Sein öffentlicher Vertrag ist `xtend.surface.controller.v1`. Die TypeScript-Source liegt in `src/components/x-surface-manager/surface-controller.ts`; die Browser-Ausgabe und Deklaration liegen in `components/xsurfacemanager-controller.js` und `.d.ts`.

## Record-Modell

Jede Surface besitzt einen stabilen Record mit ID, Typ, Status, Bounds, Capabilities, Lifecycle und optionalem Persistence-Metadatum. Der Controller verwaltet eine Registry und genau eine aktive Surface. Er veröffentlicht `xtend.surface.snapshot` Records und spiegelt Zustand nur dann nach `xstate`, wenn der Host einen Adapter bereitstellt.

Fenster, Side Panels, Modals, Dialoge, Drawer, Popovers, Regionen und weitere Typen erhalten unterschiedliche Default-Capabilities. Ein Tooltip darf beispielsweise nicht implizit maximiert werden. Zusätzliche Capabilities werden explizit registriert; deaktivierte Capabilities bleiben blockiert.

## Operationen und Lanes

`registerSurface`, `openSurface`, `focusSurface`, `closeSurface`, `destroySurface`, `moveSurface`, `resizeSurface` und `snapshot` liefern strukturierte Operation Results. Interaktionen laufen in der Lane `user-blocking`, Geometrieänderungen in `transition`, Snapshots in `diagnostics` und Cleanup in `background`.

Der Controller verändert kein DOM. Die Komponente interpretiert erfolgreiche Results und aktualisiert das jeweilige Element. Dadurch kann dieselbe Zustandslogik in Tests ohne Browser ausgeführt werden.

## Fehlerverhalten

Fehlende IDs, Duplikate, unbekannte Records oder nicht erlaubte Operationen erzeugen Diagnostics mit Manager-, Surface- und Operationsbezug. Ein Fehler darf die Registry nicht halb verändern. `destroySurface` liefert einen `xtend.surface.tombstone.v1` Record, entfernt den aktiven Owner und gibt bekannte Handles frei.

Ein Host sollte Results auf `ok` prüfen und Diagnostics an Fabric weiterreichen. Private Maps oder Z-Index-Zähler sind keine öffentliche API; verwende `snapshot()` für Beobachtung und Reproduzierbarkeit.

## Verwandte Seiten

- [Authoring Guide](./surface-manager-authoring-guide.md)
- [Runtime](./surface-manager-runtime.md)
- [Stack Policy](./surface-manager-stack-policy.md)

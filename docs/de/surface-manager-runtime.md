# SurfaceManager Runtime

Die Runtime verbindet den hostneutralen Controller mit den Custom Elements `x-surface-manager`, `x-surface-window`, `x-side-panel`, `x-surface-region`, `x-surface-portal` und der Overlay Bridge. Jede Schicht hat eine eigene Verantwortung.

## Komponentenrollen

`x-surface-manager` entdeckt deklarierte Kinder, führt Controller-Operationen aus und publiziert Lifecycle-Events. Fenster und Side Panels übersetzen ihren sichtbaren Zustand in Surface Records. Regionen markieren Layoutbereiche; Portals benennen DOM-Ziele. Die Overlay Bridge integriert Dialoge, Drawer und Popovers in dieselbe Fokus- und Stack Policy.

Die Runtime-Datei `components/xsurfacemanager.js` enthält Materialisierung, Persistenz, Layout Engine, Route Lifecycle und Remote Policy. Die öffentliche Methoden- und Eventliste steht in der [Komponentenreferenz](./components/xsurfacemanager.md).

## Lifecycle

Registrierung legt einen Record an, Mount materialisiert Inhalt und Open macht eine Surface sichtbar. Focus aktualisiert den aktiven Owner und den Stack. Close versteckt eine wiederverwendbare Surface; Destroy entfernt sie dauerhaft und führt Cleanup aus. Persistierte Snapshots werden erst nach Schema- und Policy-Prüfung angewendet.

Lazy Content darf einen Skeleton-Zustand zeigen. `hydrateSurfaceContent()` beendet ihn mit `surface-content-hydrated` oder einer sichtbaren Error-/Skipped-Diagnose. Die Runtime startet keine undokumentierten Netzwerkzugriffe während des Renderns.

## Grenzen

Der Manager besitzt Layout- und Lifecycle-State, nicht den Fachzustand innerhalb eines Fensters. Fabric erhält Diagnostics und Telemetrie, übernimmt aber nicht die Registry. Router-Adapter dürfen Surfaces öffnen oder schließen, bleiben jedoch Owner der kanonischen URL.

Bei fehlender Capability wird nur die betroffene Operation abgelehnt. Ein Fehler in einer Remote Surface darf lokale Fenster nicht schließen; der registrierte Fallback bleibt innerhalb derselben Surface-ID aktiv.

## Weiterführend

- [Controller](./surface-manager-controller.md)
- [Window Runtime](./surface-manager-window-runtime.md)
- [Side Panel Runtime](./surface-manager-side-panel-runtime.md)
- [Overlay Bridge](./surface-manager-overlay-bridge.md)

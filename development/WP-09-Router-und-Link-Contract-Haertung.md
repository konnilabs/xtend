# WP-09 - Router- und Link-Contract-Haertung

- Status: Completed
- Datum: 24. Maerz 2026
- Epic: `EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung`

## Ziel

Den Navigationsvertrag fuer deklarative und programmatische Fluesse stabilisieren und den Drift zwischen `x-router`, `x-link`, Nested Routes und Doku schliessen.

## Umgesetzte Aenderungen

- `x-router` verarbeitet Top-Level-Routen nur noch ueber direkte Kind-Elemente
- Nested Routes werden weiterhin rekursiv ueber direkte Kind-Routen der Elternroute gematcht
- `routesrc` wird vor dem ersten Rendern geladen
- Route-Details werden zentral zusammengebaut und als `route-changed`, `routechange` und `xrouter-after-navigate` ausgespielt
- Router-State wird unter Legacy- und kanonischen XState-Pfaden gespiegelt
- `x-link` haelt den Active-State jetzt auch bei History-Navigation und programmatischer Navigation aktuell
- Router- und Link-Doku wurden auf den realen Contract umgestellt

## Betroffene Dateien

- `components/xrouter.js`
- `components/xlink.js`
- `docs/components/xrouter.md`
- `docs/components/xlink.md`

## Verifikation

- Syntax-Check fuer `components/xrouter.js` nach Normalisierung des ES-Modul-Headers erfolgreich
- Syntax-Check fuer `components/xlink.js` erfolgreich
- statische Pruefung der Nested-Route- und Event-Pfade gegen den neuen Contract durchgefuehrt

## Ergebnis

`WP-09` ist abgeschlossen. Der naechste Router-nahe Ausbau liegt jetzt nicht mehr im Contract selbst, sondern in Tests und angrenzenden Komponentenfluesen.

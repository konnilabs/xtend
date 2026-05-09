# WP-06 - XTend-API idempotent und contract-safe

- Status: Completed
- Datum: 24. Maerz 2026
- Epic: `EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung`

## Ziel

`api.js` als sichere Orchestrierungsschicht haerten, sodass Mehrfachinitialisierung keinen bestehenden UI-State zerstoert und die globalen Helper sauber an die reale Runtime gekoppelt bleiben.

## Umgesetzte Aenderungen

- `ui`-State wird in `api.js` nur noch defensiv normalisiert statt bei jedem Init neu geschrieben
- Komponenten werden fuer API-nahe Flows ueber ES-Modul-Skripte geladen, inklusive dedupliziertem Ladepfad
- `window.XTend` wird als primaerer Namespace fuer `theme`, `toast`, `alert`, `dialog` und `modal` stabil angebunden
- Dialog- und Modal-Open-Flags werden kompatibel ueber Legacy- und Zielpfade gesetzt
- die API-Doku in `docs/api.md` beschreibt jetzt den realen Laufzeitvertrag

## Betroffene Dateien

- `api.js`
- `docs/api.md`

## Verifikation

- Syntax-Check fuer `api.js` nach Normalisierung des ES-Modul-Headers erfolgreich
- Re-Init-Pfade statisch gegen State-Reset und doppelte Helper-Bindung geprueft

## Ergebnis

`WP-06` ist abgeschlossen. `WP-07` und `WP-08` koennen jetzt ohne weitere Vorarbeit auf der gehaerteten API-Schicht aufsetzen.

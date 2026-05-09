# WP-07 - Dialog- und Modal-Contract-Konsolidierung

- Status: Completed
- Datum: 24. Maerz 2026
- Epic: `EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung`

## Ziel

Dialoge und Modals auf einen gemeinsamen, state-getriebenen Overlay-Contract bringen, damit API, Benutzerinteraktion und `xstate` dieselbe Wahrheitsquelle teilen.

## Umgesetzte Aenderungen

- `x-dialog` auf den konsolidierten Open-State umgestellt
- `x-modal` von einer rein attributgetriebenen Implementierung auf einen state-getriebenen Lifecycle gehoben
- beide Komponenten schreiben Benutzerinteraktionen wie ESC, Overlay-Klick und Close-Button in die Open-Flags zurueck
- API-gemanagte Overlays entfernen ihre Eintraege nach dem Schliessen aus `ui.dialogs` bzw. `ui.modals`
- `dialog-opened`, `dialog-closed`, `modal-opened`, `modal-closed` und `modal-action` sind jetzt vertragstreu emittiert
- Dokumentation fuer `xdialog` aktualisiert und fuer `xmodal` neu angelegt

## Betroffene Dateien

- `components/xdialog.js`
- `components/xmodal.js`
- `api.js`
- `docs/components/xdialog.md`
- `docs/components/xmodal.md`
- `docs/README.md`
- `docs/menu.json`

## Verifikation

- normalisierter Syntax-Check fuer `components/xdialog.js` erfolgreich
- normalisierter Syntax-Check fuer `components/xmodal.js` erfolgreich
- normalisierter Syntax-Check fuer `api.js` erfolgreich

## Ergebnis

`WP-07` ist abgeschlossen. Die Overlay-Schicht folgt jetzt einem konsistenten Laufzeitvertrag und kann als stabile Basis fuer Tests und Compliance-Checks dienen.

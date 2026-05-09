# WP-08 - Toast- und Alert-Contract-Konsolidierung

- Status: Completed
- Datum: 24. Maerz 2026
- Epic: `EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung`

## Ziel

Toast und Alert semantisch sowie technisch sauber trennen und die Feedback-Schicht auf einen nachvollziehbaren Lifecycle ohne verdeckte Nebenpfade bringen.

## Umgesetzte Aenderungen

- `x-toast` auf einen klaren Lifecycle mit `toast-shown` und `toast-dismissed` umgestellt
- der versteckte globale `showToast`-Pfad wurde aus der Komponente entfernt; der API-Helper lebt jetzt ausschliesslich in `api.js`
- `x-alert` auf einen konsolidierten Lifecycle mit kompatibler Instanz-State-Abbildung gehoben
- `x-alert` spiegelt seinen Zustand kompatibel in `xtend.component.x-alert.<id>` und `xalert-state-<id>`
- API-seitige Alert-Erzeugung unterstuetzt jetzt auch `overlay` und `ariaLabel`
- Dokumentation fuer `xtoast` und `xalert` auf die neue semantische Trennung gezogen

## Betroffene Dateien

- `components/xtoast.js`
- `components/xalert.js`
- `api.js`
- `docs/components/xtoast.md`
- `docs/components/xalert.md`

## Verifikation

- Syntax-Check fuer `components/xtoast.js` erfolgreich
- Syntax-Check fuer `components/xalert.js` erfolgreich
- normalisierter Syntax-Check fuer `api.js` erfolgreich

## Ergebnis

`WP-08` ist abgeschlossen. Die Feedback-Schicht ist jetzt semantisch klarer: Toasts sind kurzlebige Hinweise, Alerts sind laenger sichtbare oder blockierende Rueckmeldungen.

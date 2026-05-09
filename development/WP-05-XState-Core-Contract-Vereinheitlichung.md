# WP-05 - XState-Core-Contract-Vereinheitlichung

- Status: Completed
- Datum: 24. Maerz 2026
- Epic: `EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung`

## Umgesetzte Aenderungen

- `components/xstate.js` definiert `subscribe(fn, keyFilter)` explizit als kanonischen Subscription-Contract.
- fuer Legacy-Kompatibilitaet wurden `on(key, fn)` und `off(key, fn)` als Fassade ueber `subscribe` eingefuehrt.
- `components/xrouter.js` nutzt jetzt den realen `subscribe`-/Unsubscribe-Contract statt nicht vorhandener `window.xstate.on/off`-Methoden.
- die `xstate`-Dokumentation wurde auf den aktuellen API-Stand erweitert.

## Betroffene Dateien

- `components/xstate.js`
- `components/xrouter.js`
- `docs/components/xstate.md`

## Ergebnis

Der XTend-Core besitzt jetzt wieder einen klaren Subscription-Contract fuer State-Aenderungen. Neue Core-Implementierungen koennen sich verbindlich an `subscribe(fn, keyFilter)` orientieren, waehrend bestaehende Legacy-Erwartungen ueber `on/off` abgefedert werden.

## Offene Anschlussarbeit

- die State-Key-Benennung zwischen API, Dialog, Modal, Toast, Alert und Router muss in den Folgepaketen weiter vereinheitlicht werden.
- bestehende API-nahe Komponenten sollen schrittweise auf die kanonische `subscribe`-Nutzung umgestellt bleiben.

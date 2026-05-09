# WP-04 - Loader- und Manifest-Contract-Haertung

- Status: Completed
- Datum: 24. Maerz 2026
- Epic: `EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung`

## Umgesetzte Aenderungen

- `xstate` wurde als explizites Bootstrap-Basismodul in `components/manifest.json` verankert.
- `xtend-dev.js` loest Manifest-Eintraege jetzt relativ zur Manifest-URL auf.
- der Loader fuehrt den Core-Bootstrap nun in definierter Reihenfolge aus:
  1. Manifest laden
  2. `xstate` laden
  3. `x-theme` laden
  4. Preload-Komponenten laden
  5. DOM-basierte Komponentenerkennung starten
- Preload-Komponenten werden vor der DOM-Erkennung geladen und nicht mehr erst danach.
- die Manifest- und Loader-Dokumentation wurde auf den neuen Contract aktualisiert.

## Betroffene Dateien

- `components/manifest.json`
- `xtend-dev.js`
- `docs/manifest.md`
- `docs/xtend-loader.md`

## Ergebnis

Loader und Manifest folgen jetzt einem gemeinsamen, manifest-first Bootstrap-Contract. Relative und absolute Manifest-Werte koennen ueber denselben Mechanismus verarbeitet werden, und `xstate` ist wieder sauber als Basismodul im Startpfad des Frameworks verankert.

## Offene Anschlussarbeit

- API- und Komponenten-Contracts muessen auf den geharteten Loader-/Manifest-Contract aufsetzen.
- die Trennung zwischen Bootstrap-Keys und Custom-Element-Tags bleibt in den Folgepaketen mitzudenken.

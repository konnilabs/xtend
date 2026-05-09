# WP-02 - Hydrations- und URL-Aufloesungsstrategie

- Status: Completed
- Datum: 24. Maerz 2026
- Epic: `EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung`

## Ziel

Dieses Workpackage legt fest, wie XTend kuenftig Modulpfade aufloest und wie konkrete URLs fuer die Hydration von ES-Modulen behandelt werden.

## Ausgangspunkt

Die bestehenden CDN-Artefakte sind historisch dadurch entstanden, dass XTend-Komponenten fuer die ES6-Hydration konkrete, direkt aufloesbare URLs benoetigten. Diese Randbedingung ist real und wird in Epic 01 nicht ignoriert.

## Entscheidung

XTend folgt kuenftig einem **manifest-first URL-Contract mit expliziten Delivery-Profilen**.

Das bedeutet:

- das Manifest bleibt die autoritative Quelle fuer konkrete Komponenten-URLs
- konkrete Manifest-Werte duerfen absolut, root-relativ oder relativ sein
- CDN ist ein zulaessiges Delivery-Profil, aber keine implizite Architekturvorgabe fuer jede Core-Datei
- lokale Entwicklung und CDN-Deployment sollen ueber denselben semantischen Contract, nicht ueber verschiedene Architekturmodelle laufen

## Kanonischer URL-Contract

### Manifest-Eintraege

Manifest-Eintraege sind konkrete ES-Modul-Adressen in einer der folgenden Formen:

- relative URL, bezogen auf den Manifest-Standort
- root-relative URL
- absolute URL

### Delivery-Profile

XTend unterstuetzt mindestens diese Profile:

- `local`
  - Manifest verweist auf lokale oder relative Modulpfade
- `cdn`
  - Manifest verweist auf absolute CDN-URLs

### Wichtige Regel

Das Delivery-Profil wird ueber Manifest und Loader-Konfiguration bestimmt, nicht ueber verstreute Einzelentscheidungen in Core-Modulen.

## Zielarchitektur fuer Core-Module

Die Zielrichtung fuer den Core ist:

- Loader und Manifest entscheiden, woher Module kommen
- Core-Module sollen mittelfristig bevorzugt relative oder paketinterne Imports verwenden, wenn sie im selben Delivery-Context ausgeliefert werden
- waehrend Epic 01 bleibt CDN-Kompatibilitaet erhalten, bis der neue Contract sauber implementiert und getestet ist

## Uebergangsregeln fuer Epic 01

- bestehende konkrete CDN-URLs bleiben waehrend der Umstellung erlaubt
- neue Core-Aenderungen sollen keine zusaetzlichen unkoordinierten CDN-Abhaengigkeiten einfuehren
- `xstate` wird als explizites Basismodul im Bootstrap beruecksichtigt
- Manifest und Loader werden auf den gleichen Hydrationsvertrag ausgerichtet

## Implementierungsfolgen

- `components/manifest.json` muss Basismodule vollstaendig und explizit abbilden
- `xtend-dev.js` muss Basismodule anhand des Manifests in definierter Reihenfolge laden
- spaetere Konsolidierungsschritte duerfen relative und absolute Modulpfade gleichbehandeln, solange der Contract dokumentiert ist

## Risiken

- ein sofortiges Entfernen aller CDN-Imports wuerde bestehende Auslieferungswege gefaehrden
- ein unbegrenztes Weiterfuehren harter CDN-Imports in Core-Dateien zementiert technische Schulden
- ohne dokumentierte Delivery-Profile bleibt jede Hydrationskorrektur regressionsanfaellig

## Ergebnis fuer die Folgearbeit

Die Folgearbeit in WP-04 und WP-10 orientiert sich an diesem Standard:

- Manifest-first
- konkrete URL-Aufloesung
- klare Trennung zwischen Delivery-Profil und Core-Contract

# Component Long-Tail Migration

Diese Seite erklärt, wie XTend verbleibende Hilfs- und Infrastrukturflächen bewertet, ohne daraus einen umfassenden Umbau sichtbarer Komponenten zu machen. Der Fokus liegt auf nachvollziehbaren Prüfpunkten, stabilen Typen, klaren Integrationsproben und einer weiterhin neutralen RMT-Grenze.

## Wann diese Seite hilft

Nutze diese Seite, wenn du einschätzen möchtest, ob eine Hilfsfläche eine visuelle Komponente, eine Integrationsprobe oder nur einen schmalen öffentlichen Vertrag braucht. `xstate` und `x-utils` stehen für solche Grenzen: Sie sind wichtig für Anwendungen, sollen aber nicht künstlich in eine visuelle Oberfläche gedrückt werden.

## Aktueller Prüfpfad

```bash
node scripts/run_xtend_tests.js component-long-tail-migration --json
```

Die Prüfung liest den lokalen Katalog, bewertet die verbleibenden Einträge und bestätigt, dass RMT keine harte Kopplung an XTend-Typen bekommt.

## Entscheidungsregeln

- Sichtbare Komponenten brauchen Bedienbarkeit, Styling, Tastaturverhalten und messbare Laufzeitprofile.
- Hilfsflächen brauchen einen schmalen öffentlichen Vertrag und eine Integrationsprobe.
- RMT beschreibt Verbindungen und Verhalten deklarativ, importiert aber keine Komponententypen.
- Neue Produktaussagen entstehen erst, wenn der passende lokale Prüfpfad stabil ist.


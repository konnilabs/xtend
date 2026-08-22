# Component Long-Tail Migration

Diese Seite erklärt, wie XTend verbleibende Hilfs- und Infrastrukturflächen bewertet, ohne daraus einen umfassenden Umbau sichtbarer Komponenten zu machen. Der Fokus liegt auf nachvollziehbaren Prüfpunkten, stabilen Typen, klaren Integrationsproben und einer weiterhin neutralen RMT-Grenze.

## Wann diese Seite hilft

Nutze diese Seite, wenn du einschätzen möchtest, ob eine Hilfsfläche eine visuelle Komponente, eine Integrationsprobe oder nur einen schmalen öffentlichen Vertrag braucht. `xtend-state` und `x-utils` stehen für solche Grenzen: Sie sind wichtig für Anwendungen, sollen aber nicht künstlich in eine visuelle Oberfläche gedrückt werden.

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

## Review Flow

Die Migration beginnt mit einer Kataloglesung. Ein Eintrag wird nicht deshalb zur Komponente, weil er im Produkt oft vorkommt, sondern weil er eine eigenständige Bedienoberfläche, eigene Zustandsübergänge oder sichtbare Semantik besitzt. `xtend-state` bleibt darum ein Runtime-Vertrag: Es synchronisiert kanonische Keys, Events und Abonnements, ohne als visuelle Surface aufzutreten. `x-utils` bleibt eine Hilfsfläche, solange die API aus reinen Funktionen, Formatierung oder schmalen Integrationspunkten besteht. Erst wenn eine Hilfsfläche selbst Fokus, Rollen, Layout oder Benutzeraktionen besitzt, wird sie in die Komponentenbewertung verschoben.

Bei jedem Kandidaten wird die kleinste stabile Evidence gesucht. Für einen visuellen Eintrag ist das eine Fixture mit Loader, Manifest, Keyboardpfad und Dokumentation. Für eine Hilfsfläche reicht oft eine gezielte Integrationsprobe, die Exportnamen, Fehlerverhalten und RMT-Neutralität bestätigt. Der Gate `component-long-tail-migration` sammelt diese Entscheidungen, damit Reviewende sehen können, warum ein Restposten akzeptiert, verschoben oder blockiert wurde.

## Evidence für Owner

Ein Owner sollte im Review drei Fragen beantworten können: Welche Nutzer- oder Host-Aktion wird abgesichert, welcher lokale Test beweist die Aussage, und welche Grenze verhindert eine spätere Kopplung an RMT- oder Framework-Typen. Bei `xtend-state` ist die Grenze der kanonische Store-Vertrag; bei `x-utils` ist sie die Abwesenheit von DOM- und Browser-Side-Effects. `xtend-i18n` bleibt ein Integrationsdienst, solange es Locale-Lookup und Message Formatting besitzt, aber keine sichtbare Fokus-, Layout- oder Interaktionsfläche. Diese Helfer dürfen in Guides, Recipes und Fixtures referenziert werden, erzeugen aber keine neuen Produktversprechen wie Dragging, Popover-Logik oder Surface-Orchestrierung.

Wenn ein Kandidat später aufgewertet wird, braucht er einen neuen Contract mit klarer Nutzerwirkung. Dazu gehören ein Manifest-Eintrag, eine docs/menu.json-Platzierung, deutsch/englische Autorendokumentation und ein lokaler Gate, der die Migration reproduzierbar macht. Ohne diesen Nachweis bleibt der Eintrag bewusst schmal. So verhindert XTend, dass interne Helfer durch zufällige Verwendung zu öffentlichen Komponenten werden.

## Release Entscheidung

Für Releases ist die Seite ein Negativ- und Positivfilter zugleich. Positiv bedeutet: Der Long-Tail ist inventarisiert, die verbleibenden Hilfsflächen haben akzeptierte Grenzen, und neue Komponentenaussagen besitzen eigene Tests. Negativ bedeutet: Kein Release darf behaupten, eine Hilfsfläche sei bereits eine vollwertige UI-Komponente, solange Bedienbarkeit, Styling, Accessibility und Runtime-Evidence fehlen. Diese Unterscheidung schützt Native-First- und RMT-Integrationen vor unklaren Abhängigkeiten.

## Weiterführend

Die Komponentenübersicht hilft bei der Wahl eines unterstützten Ersatzes, bevor ein Legacy-Element entfernt wird. [Verwandter Artikel](./components.md)

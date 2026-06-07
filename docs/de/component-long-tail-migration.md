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

## Review Flow

Die Migration beginnt mit einer Kataloglesung. Ein Eintrag wird nicht deshalb zur Komponente, weil er im Produkt oft vorkommt, sondern weil er eine eigenstaendige Bedienoberflaeche, eigene Zustandsuebergaenge oder sichtbare Semantik besitzt. `xstate` bleibt darum ein Runtime-Vertrag: Es synchronisiert kanonische Keys, Events und Abonnements, ohne als visuelle Surface aufzutreten. `x-utils` bleibt eine Hilfsflaeche, solange die API aus reinen Funktionen, Formatierung oder schmalen Integrationspunkten besteht. Erst wenn eine Hilfsflaeche selbst Fokus, Rollen, Layout oder Benutzeraktionen besitzt, wird sie in die Komponentenbewertung verschoben.

Bei jedem Kandidaten wird die kleinste stabile Evidence gesucht. Fuer einen visuellen Eintrag ist das eine Fixture mit Loader, Manifest, Keyboardpfad und Dokumentation. Fuer eine Hilfsflaeche reicht oft eine gezielte Integrationsprobe, die Exportnamen, Fehlerverhalten und RMT-Neutralitaet bestaetigt. Der Gate `component-long-tail-migration` sammelt diese Entscheidungen, damit Reviewende sehen koennen, warum ein Restposten akzeptiert, verschoben oder blockiert wurde.

## Evidence fuer Owner

Ein Owner sollte im Handoff drei Fragen beantworten koennen: Welche Nutzer- oder Host-Aktion wird abgesichert, welcher lokale Test beweist die Aussage, und welche Grenze verhindert eine spaetere Kopplung an RMT- oder Framework-Typen. Bei `xstate` ist die Grenze der kanonische Store-Vertrag; bei `x-utils` ist sie die Abwesenheit von DOM- und Browser-Side-Effects. Beide duerfen in Guides, Recipes und Fixtures referenziert werden, aber sie erzeugen keine neuen Produktversprechen wie Dragging, Popover-Logik oder Surface-Orchestrierung.

Wenn ein Kandidat spaeter aufgewertet wird, braucht er einen neuen Contract mit klarer Nutzerwirkung. Dazu gehoeren ein Manifest-Eintrag, eine docs/menu.json-Platzierung, deutsch/englische Autorendokumentation und ein lokaler Gate, der die Migration reproduzierbar macht. Ohne diesen Nachweis bleibt der Eintrag bewusst schmal. So verhindert XTend, dass interne Helfer durch zufaellige Verwendung zu oeffentlichen Komponenten werden.

## Release Entscheidung

Fuer Releases ist die Seite ein Negativ- und Positivfilter zugleich. Positiv bedeutet: Der Long-Tail ist inventarisiert, die verbleibenden Hilfsflaechen haben akzeptierte Grenzen, und neue Komponentenaussagen besitzen eigene Tests. Negativ bedeutet: Kein Release darf behaupten, eine Hilfsflaeche sei bereits eine vollwertige UI-Komponente, solange Bedienbarkeit, Styling, Accessibility und Runtime-Evidence fehlen. Diese Unterscheidung schuetzt Native-First- und RMT-Handoffs vor unklaren Abhaengigkeiten.

# RMT App Platform Migration Guide

Dieser Guide beschreibt den Weg von externen Host-Hilfen wie
`root.innerHTML`, produktgebundenen Surface-Listen oder lokalen Registry-
Repaints hin zu nativen RMT-App-Platform-Primitives.

## Zielbild

- UI wird als DOM Descriptor oder component-native Template Primitive
  beschrieben.
- State, Selectors und Derived Values liegen in der RMT State Selector Runtime.
- Interaktionen laufen ueber deklarative Events und Actions.
- DataSources bleiben austauschbar: `fixture`, `rest`, `ssr` und `host`.
- Surfaces, Overlays, Portals und Resources werden ueber den Surface Resource
  Graph materialisiert und aufgeraeumt.

## Migration

1. Externe HTML-Host-Renderer identifizieren.
   Suchen nach `innerHTML`, `outerHTML`, `insertAdjacentHTML` und
   `document.write`.
2. Shell-Struktur in RMT Templates ueberfuehren.
   Normale App-UI nutzt `mode: "dom_descriptor"` oder component-native
   Template-Nodes.
3. Produktlisten entkoppeln.
   Statt einer festen Record-Klasse werden konfigurierbare Record-Contracts
   mit stabilen IDs und Keys genutzt.
4. Interaktionen deklarieren.
   DOM- oder Custom-Events erhalten `payloadContract` und routen zu Actions.
5. DataSources austauschbar halten.
   Lokale Fixture-Daten, SSR-Bootstrap, REST-Suche und Host-Mutation teilen
   denselben Action-Pfad.
6. Surface Lifecycle pruefen.
   Jede Surface mit `resource`-Eintraegen braucht einen Owner, Overlays laufen ueber
   Portals, und Destroy/Close muss Ressourcen freigeben.
7. Scaffold Evidence erzeugen.
   Der RMT App Platform Builder schreibt Diagnostics, Source Map und Build
   Report.

## Referenz

Die Referenz-Fixture liegt in `tests/fixtures/rmt-app-platform-fixture.rmt` und
belegt `generic-catalog`, `admin-queue` und `content-board` mit denselben
Primitives.

```bash
node scripts/run_xtend_tests.js rmt-app-platform-fixture --json
```

## Grenze

Trusted HTML bleibt ein expliziter Sonderfall mit Trusted-DOM-Boundary. Normale
App-UI darf keine HTML-Strings als Renderpfad verwenden.

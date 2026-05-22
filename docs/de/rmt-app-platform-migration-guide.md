# RMT App Platform Migration Guide

Dieser Guide beschreibt den Weg von externen Host-Hilfen wie
`root.innerHTML`, produktgebundenen Surface-Listen oder lokalen Registry-
Repaints hin zu nativen RMT-App-Platform-Primitives.

## Zielbild

- Neue UI wird in RMT vNext beschrieben; DOM Descriptor, App-Platform-JSON und
  Component Records sind generierter Output oder Compatibility Mirror.
- State, Selectors und Derived Values liegen in der RMT State Selector Runtime.
- Interaktionen laufen ueber deklarative Events und Actions.
- DataSources bleiben austauschbar: `fixture`, `rest`, `ssr` und `host`.
- Surfaces, Overlays, Portals und Resources werden ueber den Surface Resource
  Graph materialisiert und aufgeraeumt.

```rmt
template migration.catalog {
  state records type collection initial []

  selector visibleRecords from state records {
    output CatalogRecord[]
  }

  datasource catalog from fixture records.generic-items {
    contract CatalogRecord[]
  }

  action load-records {
    effect fetch datasource catalog
    on success -> reduce state.records = result.records
  }

  portal surface.root root "#app-root" layer surface

  surface catalog.board kind workspace component x-cards {
    repeat from selector visibleRecords
    key record.id
    portal surface.root

    lane visible weight 80 {
      hydrate catalog-cards from selector visibleRecords
    }

    on card-click target item -> action load-records {
      payload source from target.dataset.source
    }
  }
}
```

## Migration

1. Externe HTML-Host-Renderer identifizieren.
   Suchen nach `innerHTML`, `outerHTML`, `insertAdjacentHTML` und
   `document.write`.
2. Shell-Struktur in RMT vNext ueberfuehren.
   Normale App-UI nutzt `template`, `surface`, `portal`, `lane`, `hydrate` und
   Events; `mode: "dom_descriptor"` entsteht erst im Output.
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

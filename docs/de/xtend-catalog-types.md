# XTend Catalog Types

XTend Catalog Types beschreiben die öffentlichen Plan- und Report-Formen für Catalog-Module. Diese Typen sind klein, aber wichtig: Viele XTend-Prüfungen erzeugen strukturierte Pläne, validieren sie und schreiben daraus Reports. `./catalog/catalog-public-types.d.ts` gibt diesen wiederkehrenden Formen gemeinsame Namen, damit Tests, Builder und externe Analysewerkzeuge dieselbe Sprache verwenden.

## Catalog-Oberfläche

Die wichtigsten Namen sind `XtendCatalogPlan`, `XtendCatalogReport` und `XtendCatalogFactory`. Sie beschreiben, wie ein Catalog-Modul seinen stabilen Schema-Namen, seinen Status, seine lokalen Prüfungen und seine Report-Daten offenlegt. SurfaceManager-Catalogs bleiben interne XTend-UI-Unterstützung, aber die Datenformen der Plan-/Report-Module sind öffentlich genug, um von Tests und Release-Werkzeugen gelesen zu werden.

Ein Host muss diese Typen nicht importieren, um XTend UI zu verwenden. Sie sind vor allem für Tooling, Quality Gates und Integrationen nützlich, die mehrere Catalog-Module nebeneinander auswerten. Wenn ein neues Catalog-Modul entsteht, kann es dieselbe Form verwenden, statt eigene Report-Strukturen zu erfinden.

## Stabilitätsregel

Catalog-Typen sollen breit genug sein, um wiederkehrende Plan-/Report-Muster abzudecken, aber nicht so breit, dass sie jede interne Datei beschreiben. Öffentliche Namen gehören in `./catalog/catalog-public-types.d.ts`; konkrete Moduldetails bleiben in den jeweiligen Catalog-Dateien. Dadurch kann ein Report maschinenlesbar bleiben, während ein spezieller Plan trotzdem seine eigenen Felder besitzen darf.

Diese Trennung ist hilfreich für CI und Nightly-Jobs. Ein Runner kann prüfen, ob ein Report erfolgreich war, welches Schema er nutzt und welches Artefakt geschrieben wurde, ohne die Geschäftslogik des jeweiligen Catalogs zu kennen.

## Lokale Prüfung

Führe die Catalog-Type-Prüfung aus, wenn Plan-/Report-Module, Catalog-Deklarationen oder Paket-Metadaten verändert werden.

```bash
node scripts/run_xtend_tests.js type-exports-catalog --json
```

```txt
schema: xtend.type-exports.catalog-declarations.v1
local gate: node scripts/run_xtend_tests.js type-exports-catalog --json
report: .xtend-test-results/xtend-type-exports-catalog-report.json
```

## Pflegehinweise

Neue Catalogs sollten ein klares Schema, einen lokalen Prüfpfad und einen Report mit stabilen Feldern besitzen. Wenn mehrere Module dieselbe Struktur benötigen, ergänze zuerst den gemeinsamen Typ und nutze ihn danach in den Modulen. Das hält die öffentliche Tooling-Schicht lesbar und verhindert, dass jeder Report seine eigene kleine Welt erfindet.

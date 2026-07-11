# Release Readiness

Release Readiness beschreibt, welche technischen Nachweise zusammenpassen müssen, bevor ein XTend-Paket als veröffentlichungsnah gelten kann. Die Seite ist öffentlich formuliert: Sie erklärt nicht die interne Planung, sondern zeigt Drittanbietern, welche Signale sie bei einer Änderung an Runtime, Package Exports, TypeExports, Maraca oder i18n prüfen sollten.

## Nachweisgruppen

Die wichtigsten Gruppen sind Package Export Lock, TypeExports, Conditional Network Gates, Package Dry Run und Feature Drift. Package Export Lock schützt die veröffentlichte Oberfläche. TypeExports stellt sicher, dass neue Einstiegspunkte mit Deklarationen und Klassifikation sichtbar sind. Conditional Network Gates trennen optionale Audit- oder SBOM-Läufe von lokalen Standardchecks. Package Dry Run zeigt, welche Dateien wirklich im Paket landen würden. Feature Drift beschreibt, ob dokumentierte Funktionen, Tests und Paket-Metadaten auseinanderlaufen.

Für Drittanbieter ist die praktische Botschaft einfach: Eine Änderung ist erst dann sauber, wenn die lokale Oberfläche, das Paket-Archiv und die Dokumentation dieselben Namen kennen. Das gilt für sichtbare Komponenten ebenso wie für nicht-visuelle Infrastrukturmodule wie `xtend-i18n`.

## Lokaler Ablauf

Beginne mit den schmalen Prüfungen, die direkt zur Änderung gehören. Für i18n sind das Komponenten-, Manifest-Policy- und Type-Export-Prüfungen. Für Maraca kommen Bundle-, Package-Export- und Größenprüfungen hinzu. Für Paketgrenzen ist der Package Export Lock die zentrale Kontrolle. Erst wenn diese lokalen Signale grün sind, lohnt sich der Blick auf langsamere Browser- oder Nightly-Jobs.

```bash
node scripts/run_xtend_tests.js components manifest-import-policy type-exports --json
node scripts/run_xtend_tests.js type-exports epic13-package-export-lock maraca-package-exports --json
```

```txt
schema: xtend.epic13.rc1-production-readiness.v1
local gate: node scripts/run_xtend_tests.js epic13-rc1-readiness --json
target: rc1-production-candidate-ready
Release Owner Acceptance
Conditional Network Evidence
Conditional Network Gates
Package Export Lock
Package Dry Run
Feature Drift
WP-E13-02
WP-E13-03
WP-E13-09
./release-owner-acceptance.md
./package-export-lock.md
./hydration-performance-closure.md
```

## CI-Bezug

Die CI sollte dieselben Nachweise nicht neu erfinden, sondern die lokalen Verträge ausführen und die Artefakte einsammeln. Standard-Gates prüfen schnelle, offlinefähige Signale. Nightly-Jobs dürfen zusätzlich Browser-Smokes, Workspace-Dry-Runs und optionale Netzwerk-Evidenz sammeln. Dadurch bleibt ein Pull Request schnell, während der nächtliche Lauf die breitere Veröffentlichungssicht abdeckt.

Wenn ein neuer Export hinzukommt, muss der Zähler im TypeExports-Plan, im Package Export Lock und in den Dokumenten gemeinsam steigen. Wenn ein neues Infrastrukturmodul wie `xtend-i18n` hinzukommt, muss es im Loader als Bootstrap-Grenze behandelt werden und darf keine Custom-Element-Wartebedingung erzeugen.

## Pflegehinweise

Halte diese Seite als Orientierung für öffentliche Release-Signale. Interne Bezeichner bleiben im maschinenlesbaren Block, damit Tests sie finden können, ohne den sichtbaren Text mit Planungsdetails zu füllen. Änderungen an Package Exports, Type Declarations, GitHub Actions oder Nightly-Artefakten sollten diese Seite aktualisieren, wenn sich der Nachweispfad für externe Entwickler ändert.

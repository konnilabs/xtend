# Previous Release Bridge

Previous Release Bridge dokumentiert den Übergang vom älteren Stabilisierungspfad in die aktuelle Release-Readiness. Die Seite ist öffentlich lesbar formuliert und erklärt, welche Nachweise weiterhin als Grundlage dienen: Long-Tail-Status, Visual Snapshot, Design Tokens, RMT DSL und Conditional Network Gates. Interne Bezeichner bleiben im maschinenlesbaren Block, damit die lokalen Suiten den historischen Vertrag weiterhin finden.

## Zweck

Ein Release-Pfad beginnt selten bei null. XTend nutzt frühere Stabilisierungsergebnisse, damit neue Gates nicht dieselben Fragen wiederholen. Diese Seite zeigt, welche Signale aus dem vorherigen Abschluss in die heutige Paket- und Runtime-Bewertung übernommen werden. Für Drittanbieter ist wichtig, dass diese Signale keine private Projektplanung voraussetzen: Sie beschreiben sichtbare Qualität, stabile Paketgrenzen und nachvollziehbare Artefakte.

Der Bridge-Artikel hilft besonders, wenn eine neue Infrastruktur wie `xtend-i18n` hinzukommt. Das Modul nutzt moderne Loader-Regeln, profitiert aber von denselben Grundannahmen: keine unkontrollierte Veröffentlichung, klare Owner-Prüfung, reproduzierbare Nachweise und lokale Ausführbarkeit.

## Nachweisblock

```txt
schema: xtend.epic12.rc0-handoff.v1
local gate: node scripts/run_xtend_tests.js epic12-rc0-handoff --json
status: ready-for-release-owner-review-not-publish
RC0 Gate Matrix
Long-Tail
Visual Snapshot
Design Tokens
RMT DSL
Conditional Network Gates
publish boundary: private-until-release-owner-approval
```

## Öffentliche Signale

Long-Tail-Signale zeigen, ob alte Komponenten und Dokumentationspfade noch erreichbar sind. Visual Snapshot steht für überprüfbare UI-Evidenz. Design Tokens sichern Theme- und Surface-Kontrakte. RMT DSL beschreibt, dass deklarative App-Shells weiterhin lintbar und dokumentiert bleiben. Conditional Network Gates trennen lokale Standardprüfungen von optionalen Audit- oder SBOM-Läufen.

Diese Signale sind bewusst grob genug, um langfristig zu bleiben, aber konkret genug für CI. Wenn ein neuer Gate dazukommt, sollte er entweder eines dieser Signale verbessern oder klar erklären, warum ein neues Signal notwendig ist.

## Pflegehinweise

Halte diesen Artikel als historische Brücke und nicht als neue Produktplanung. Änderungen gehören hierher, wenn sie den öffentlichen Übergang zwischen früherer Stabilisierung und aktueller Release-Readiness erklären. Neue Paketmodule sollten trotzdem in TypeExports, Package Export Lock, Docs-Menü und Workflow-Artefakten gepflegt werden.

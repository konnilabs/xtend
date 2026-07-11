# XTend Builder Types

XTend Builder Types beschreiben die öffentlichen Datenformen für Scaffold, Component Lab und Workflow-Automation. Sie richten sich an Teams, die den XTend Builder in eigene Werkzeuge integrieren oder generierte Komponenten prüfen möchten. Die Deklarationen liegen unter anderem in `./xtend-builder/scaffold.d.ts` und `./xtend-builder/builder-public-types.d.ts`; die JavaScript-CLI bleibt dabei unverändert.

## Builder-Oberfläche

Wichtige Typen sind `XtendBuilderComponentInput`, `XtendBuilderComponentPlan`, `XtendBuilderComponentFilesResult`, `XtendBuilderWorkflow` und `XtendBuilderComponentLabPlan`. Sie machen sichtbar, welche Eingaben ein Scaffold-Schritt erwartet, welche Dateien geplant werden, welche Resultate zurückkommen und wie Workflows ihre Schritte beschreiben.

Die Typen sind bewusst auf Daten statt auf konkrete Prozesssteuerung ausgerichtet. Ein Host kann einen Component-Plan validieren, ein internes Tool kann einen Lab-Plan anzeigen und eine CI-Prüfung kann generierte Dateien vergleichen, ohne die CLI neu zu implementieren. Dadurch bleibt der Builder für Drittanbieter erweiterbar, während die bestehende JavaScript-Ausführung erhalten bleibt.

## Stabilitätsregel

Die CLI bleibt kompatibel und muss nicht nach TypeScript portiert werden. TypeExports prüft nur, dass öffentliche Builder-Deklarationen, Paket-Metadaten und Dokumentation dieselbe Oberfläche beschreiben. Wenn eine neue Builder-Option entsteht, sollte sie im Plan-Typ auftauchen, in der Runtime verarbeitet werden und einen lokalen Testpfad besitzen. Wenn ein Feld nur intern ist, bleibt es außerhalb der öffentlichen Typen.

Diese Grenze verhindert, dass generierte Artefakte von privaten Variablen oder Dateinamen abhängig werden. Öffentliche Host-Integrationen sollten mit Inputs, Plans, Results und Workflows arbeiten, nicht mit temporären Build-Zwischenständen.

## Lokale Prüfung

Führe die Builder-Type-Prüfung aus, wenn Scaffold-Optionen, Builder-Reports, Component-Lab-Pläne oder Package Exports geändert werden.

```bash
node scripts/run_xtend_tests.js type-exports-builder --json
```

```txt
schema: xtend.type-exports.builder-declarations.v1
local gate: node scripts/run_xtend_tests.js type-exports-builder --json
report: .xtend-test-results/xtend-type-exports-builder-report.json
```

## Pflegehinweise

Halte Builder-Typen nah an den Artefakten, die ein Host wirklich sehen muss. Ergänze klare optionale Felder, wenn ein neuer Modus entsteht, und vermeide vage `any`-Flächen. Ein gutes Builder-Update ändert Runtime, Deklarationen, Tests und Dokumentation gemeinsam. So kann ein Drittanbieter den Builder als zuverlässigen Automationsbaustein verwenden, ohne interne XTend-Verzeichnisregeln lernen zu müssen.

## Weiterführend

Der App-Platform-Tooling-Leitfaden nutzt die Builder-Deklarationen in einem vollständigen Authoring-Ablauf. [Verwandter Artikel](./rmt-app-platform-tooling.md)

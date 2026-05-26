# XTend Policy Types

XTend Policy Types dokumentieren die gemeinsamen Typen für Fabric, Accessibility- und Security-Policies. Diese Oberfläche ist für Teams relevant, die Diagnoseberichte, A11y-Signale, Security-Klassifikationen oder Fabric-Fiber-Inputs auswerten, ohne interne Module zu importieren. Die gemeinsamen Deklarationen liegen in `./fabric/xtend-policy-public-types.d.ts` und werden von den öffentlichen Fabric-Typen genutzt.

## Policy-Oberfläche

Die Paketoberfläche umfasst `./fabric/xtend-fabric.d.ts` und die geteilten Policy-Typen. Wichtige Namen sind `XtendPolicyDiagnostic`, `XtendPolicyReport`, `XtendFabricFiberInput`, `XtendA11ySignal` und `XtendSecurityClassification`. Sie beschreiben, wie XTend Laufzeitentscheidungen, Barrierefreiheitspräferenzen, Sicherheitsbewertungen und Scheduler-Eingaben als Daten sichtbar macht.

Für Host-Anwendungen ist diese Trennung nützlich, weil sie Policy-Ergebnisse verarbeiten können, ohne die Implementierung einer konkreten Komponente oder eines RMT-Kernels zu kennen. Ein Monitoring-Adapter kann zum Beispiel Reports sammeln, ein Test kann A11y-Signale verifizieren und ein Shell-Adapter kann Fabric-Fiber-Eingaben typisiert weiterreichen.

## Stabilitätsregel

Policy-Typen dürfen keine neuen Runtime-Abhängigkeiten in Komponenten oder RMT-Kernel einführen. Die Deklarationen beschreiben Datenformen; sie laden keine zusätzlichen Module. Dadurch bleibt die Oberfläche für Browser-Hosts, Node-Prüfungen und Paketnutzer gleich. Wenn neue Policy-Daten ergänzt werden, sollten sie als additive Felder oder neue spezifische Typen erscheinen, damit bestehende Hosts weiter kompilieren.

Die Regel schützt besonders eingebettete Umgebungen. Ein Host kann `XtendPolicyReport` speichern oder weitergeben, ohne dass dadurch Fabric selbst geladen werden muss. Ebenso kann ein Security-Adapter `XtendSecurityClassification` auswerten, während die eigentliche Komponente unverändert bleibt.

## Lokale Prüfung

Führe die Policy-Type-Prüfung aus, wenn Fabric-Deklarationen, A11y-Signale, Security-Klassifikationen, Package Exports oder Release-Metadaten verändert werden.

```bash
node scripts/run_xtend_tests.js type-exports-policy --json
```

```txt
schema: xtend.type-exports.policy-declarations.v1
local gate: node scripts/run_xtend_tests.js type-exports-policy --json
report: .xtend-test-results/xtend-type-exports-policy-report.json
```

## Pflegehinweise

Halte Policy-Typen datenzentriert. Ein neuer Report sollte klar sagen, welche Quelle ihn erzeugt, welche Felder stabil sind und wie ein Host fehlende optionale Daten behandeln kann. Wenn ein Name in `./fabric/xtend-fabric.d.ts` öffentlich wird, muss er auch in der gemeinsamen Deklaration und im TypeExports-Plan sichtbar sein. So bleiben Diagnose, Accessibility und Security als öffentliche Verträge nutzbar, ohne interne Scheduling-Details freizulegen.

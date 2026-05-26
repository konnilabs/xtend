# XTend API Types

XTend API Types beschreiben die globale Browser-API, die `api.js` nach dem Laden bereitstellt. Sie richtet sich an Hosts, die Toasts, Alerts, Dialoge, Modals, Theme-Laufzeit und Compliance-Metadaten über `window.XTend` oder die historischen Kurzformen nutzen. Die Deklaration in `./api.d.ts` macht diese Oberfläche sichtbar, ohne `api.js` selbst umzubauen oder eine TypeScript-Runtime einzuführen.

## Namespace und Globals

Der zentrale Namespace ist `XTendNamespace`. Er fasst `XTendComplianceApi`, `XTendThemeApi`, `XTendToastApi`, `XTendAlertApi`, `XTendDialogApi` und `XTendModalApi` zusammen. Zusätzlich bleiben die globalen Namen `XTend`, `XTheme`, `XToast`, `XAlert`, `XDialog`, `XModal`, `showToast`, `showAlert`, `showDialog` und `showModal` typisiert, weil ältere Host-Seiten diese Kurznamen direkt verwenden.

Für Drittanbieter bedeutet das: ein Host kann vorhandene Browser-Integrationen weiter nutzen und trotzdem neue Codepfade sauber typisieren. Wer `XTend.theme.setTheme(...)` oder `showToast.success(...)` aufruft, bekommt dieselbe öffentliche Form wie die Runtime sie bereitstellt. Die Typdatei beschreibt außerdem das Ready-Event `xtend-api-ready`, damit Anwendungen nicht auf Timing-Annahmen oder private Initialisierungsdetails angewiesen sind.

## Laufzeitvertrag

`api.js` bleibt die einzige Runtime-Quelle. Die Typen dokumentieren Methoden wie `initXTendAPI`, `getChecklist`, `getCoreContracts`, `getThemeTokens`, `setTheme`, `loadExternalTheme`, `registerTheme`, `removeTheme`, `show`, `success`, `error`, `warning`, `info`, `clearAll` und `close`. Der Check stellt sicher, dass diese Namen in der Runtime und in `api.d.ts` konsistent bleiben.

Das ist besonders nützlich für Design-System-Hosts, die XTend UI mit eigener Shell kombinieren. Die Shell kann den Theme- oder Dialog-Namespace nutzen, ohne konkrete Komponenten importieren zu müssen. Gleichzeitig verhindert die Gate-Prüfung, dass ein globaler Name versehentlich verschwindet oder nur noch in einer Datei existiert.

## Lokale Prüfung

Führe die API-Type-Prüfung aus, wenn du `api.js`, `api.d.ts`, die Package Exports oder die Release-Metadaten änderst.

```bash
node scripts/run_xtend_tests.js type-exports-api --json
```

```txt
schema: xtend.type-exports.api-declarations.v1
local gate: node scripts/run_xtend_tests.js type-exports-api --json
report: .xtend-test-results/xtend-type-exports-api-report.json
```

## Pflegehinweise

Neue öffentliche Funktionen gehören zuerst in die Runtime, dann in `api.d.ts`, dann in die lokale Prüfung. Private Helfer bleiben privat und werden nicht im Namespace dokumentiert. Wenn ein Host eine neue globale Abkürzung benötigt, sollte sie denselben Status wie die bestehenden Globals bekommen: Runtime-Zuweisung, TypeScript-Deklaration, Event- oder Methodenprüfung und ein kurzer Hinweis in dieser Seite. So bleibt die globale API bequem, aber nicht unkontrolliert.

# WP-E04-07 - Scaffold-, Typing- und Extension-Contracts an RMT-Kompatibilitaet anbinden

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
- Backlog: `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`
- Bezug:
  - `development/WP-E04-03-XTend-Component-Contract-fuer-RMT-Kompatibilitaet-definieren.md`
  - `development/WP-E04-04-RMT-Template-Authoring-Model-fuer-XTend-UI-vorbereiten.md`
  - `development/WP-E04-05-Root-Lifecycle-und-Scheduler-Handshakes-fuer-XTend-Roots-standardisieren.md`
  - `development/WP-E04-06-XTend-Host-Capabilities-fuer-Manifest-State-Theme-API-und-Hydration-beschreiben.md`
  - `development/XTend-Scaffold-Extension-Points.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `xtend-builder/scaffold.config.js`
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/preview/component-preview.js`
  - `xtend-builder/extensions/component-extension-points.js`
  - `xtend-builder/generators/component-files.js`
  - `xtend-builder/workflows/developer-workflow.js`
  - `xtend-builder/templates/component/types.template.d.ts`
  - `xtend-builder/templates/component/docs.template.md`
  - `xtend-builder/templates/component/demo-plan.template.md`
  - `xtend-builder/templates/component/manifest-plan.template.json`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E04-07` bindet die Epic-03-Scaffold-Oberflaechen an die Epic-04-RMT-Kompatibilitaetscontracts. Typing, Manifest-Plan, Preview-Plan, Extension-Punkte, Component-Files und Developer-Workflow zeigen nun denselben RMT-Kompatibilitaetsstatus maschinenlesbar an.

Der verbindliche Binding-Contract heisst:

```text
xtend.scaffold.rmt-compatibility-binding.v1
```

Der Contract ist ein Dry-Run- und Handoff-Contract. Er macht XTend UI First-Class-vorbereitbar fuer RMT, ohne den XTendRMT Kernel, XRouter, Template-Parser oder produktive Bridge-Laufzeit in das Scaffold einzubauen.

## Umgesetzte Artefakte

- Workpackage-Dokument fuer das RMT-Kompatibilitaets-Binding
- Top-Level-Config `rmtCompatibility` in `xtend-builder/scaffold.config.js`
- Typing-Contract `rmtCompatibility` in `xtend-builder/typing/component-types.js`
- Preview-Contract `rmtCompatibility` in `xtend-builder/preview/component-preview.js`
- Extension-Contract `rmtCompatibilityBinding` in `xtend-builder/extensions/component-extension-points.js`
- Component-Files- und Manifest-Plan-Anschluss in `xtend-builder/generators/component-files.js`
- `.d.ts` Interface `{{className}}RmtCompatibilityBinding`
- Dokumentations- und Demo-Plan-Abschnitte fuer RMT-Kompatibilitaets-Binding
- Developer-Workflow- und Verify-Plan-Anschluss fuer `rmt-compatibility`
- additive Referenz-Metadaten in `xtendrmt/rmt.schema.json` und `xtendrmt/xtendrmt-bestcase-demo.rmt`
- Reference-Gates fuer WP-07, Config, Scaffold-Generatoren, Workflow und RMT-Demo-Metadata

## Contract-Entscheidung

Das RMT-Kompatibilitaets-Binding ist eine Verknuepfungsschicht zwischen bestehenden Scaffold-Dry-Runs. Es ersetzt keine produktive Runtime.

| Oberflaeche | Contract-Feld | Verantwortung |
|-------------|----------------|----------------|
| Typing | `rmtCompatibility` | Component-, Template-, Root- und Host-Capability-Contract-Refs zusammenfuehren |
| Manifest-Plan | `rmtCompatibility` | lokale Importregeln, Host-Capabilities, Scheduler-Handshakes und Preview-Referenz pruefbar machen |
| Preview-Plan | `rmtCompatibility` | Preview-Ref, Registry und Local-Only-Grenze an denselben Contract binden |
| Extension-Punkte | `rmtCompatibilityBinding` | Template Authoring, Scheduler Handshake und Host Capabilities als no-op Metadaten spiegeln |
| Component-Files | `rmtCompatibility` | generierte Dry-Run-Artefakte mit einem gemeinsamen Binding ausgeben |
| Workflow | `rmtCompatibility` | Inspect-Kommandos und Mindestgate fuer die naechste Testhaertung ausweisen |

## Binding-Matrix

| Binding | Quelle | Ziel | Mindestanforderung |
|---------|--------|------|--------------------|
| `typing` | `createComponentTypingContract` | `components/<tag>.d.ts` | types-only, keine Runtime-Imports |
| `manifest-plan` | `createComponentFiles` | `components/manifest.json` Dry-Run | `localImportOnly: true`, `cdnAllowed: false` |
| `preview-plan` | `createComponentPreviewContract` | `docs/previews/<name>.preview.md` | Registry-Ref und `externalNetworkAllowed: false` |
| `extension-points` | `createComponentExtensionPoints` | `xtendScaffoldExtensionPoints` | no-op Hooks, keine produktive Ausfuehrung |
| `workflow` | `createDeveloperWorkflow` und `createVerifyPlan` | Scaffold CLI | `node scripts/run_xtend_tests.js rmt-compatibility --json` |

## Contract-Refs

Das Binding fuehrt die bestehenden Epic-04-Contracts zusammen:

- `xtend.rmt.component-contract.v1`
- `xtend.rmt.template-authoring.v1`
- `xtend.rmt.root-handshake.v1`
- `xtend.rmt.host-capabilities.v1`

Adapter-Refs bleiben Daten:

- `xtend.component`
- `xtend.template`
- `xtend.xrouter`
- `xtend`

## Grenzen

`WP-E04-07` ist absichtlich kein Bridge-Paket.

- `typesOnly: true`
- `noRuntimeImports: true`
- `noProductiveWrites: true`
- `noRmtKernelCoupling: true`
- `noRouterRegistration: true`
- `noTemplateParsing: true`
- `bridgeRuntime: reserved-for-Epic-05`

Damit bleibt XTendRMT framework-agnostisch. XTend UI wird als First-Class Host vorbereitet, aber nicht in den Kernel eingebettet.

## Scaffold-Anschluss

`xtend-builder/typing/component-types.js` erzeugt ab WP-07:

- Konstante `RMT_COMPATIBILITY_BINDING_SCHEMA`
- Contract `rmtCompatibility`
- Interface-Name `{{className}}RmtCompatibilityBinding`
- Artifact-Bindings fuer Typing, Manifest, Preview und Extension-Punkte
- Contract- und Adapter-Refs
- Verifikationspfade fuer Reference- und Full-Gate
- Boundaries fuer Runtime-, Kernel-, Router- und Template-Parser-Grenzen

`xtend-builder/preview/component-preview.js` spiegelt dieses Binding in:

- `contracts.requiresRmtCompatibilityBinding`
- `rmtCompatibility.status: preview-bound-to-rmt-compatibility`
- `signals.rmtCompatibilityBinding`
- Local-Only- und Registry-Grenzen

`xtend-builder/extensions/component-extension-points.js` spiegelt es in:

- `rmtCompatibilityBinding.status: extension-bound-to-rmt-compatibility`
- `manifestPlanRequirements`
- `previewPlan`
- `extensionPlanRequirements`
- `verification`
- `boundaries`

`xtend-builder/generators/component-files.js` rendert das Binding in:

- `typing.rmtCompatibility`
- `preview.rmtCompatibility`
- `extensions.rmtCompatibilityBinding`
- Top-Level `rmtCompatibility`
- Manifest-Plan-Feld `rmtCompatibility`
- `.d.ts`, Docs- und Demo-Plan-Abschnitte

## RMT-Demo- und Schema-Anschluss

`xtendrmt/rmt.schema.json` fuehrt `x-xtendrmt.scaffoldCompatibilityBindings` additiv. Das ist eine Referenz fuer Contract- und Handoff-Pruefungen, kein neues Required Field.

`xtendrmt/xtendrmt-bestcase-demo.rmt` traegt `manifest.metadata.scaffoldCompatibility` mit dem Schema `xtend.scaffold.rmt-compatibility-binding.v1`. Die Demo zeigt damit, dass RMT-Kompatibilitaet als Scaffold-/Handoff-Metadatum sichtbar ist, waehrend `kernelVisible: false` bleibt.

## Auswirkungen auf Folgepakete

| Folgepaket | Nutzung des WP-07-Contracts |
|------------|-----------------------------|
| `WP-E04-08` | erweitert Tests und Referenzgates fuer RMT-kompatible XTend-Artefakte |
| `WP-E04-09` | kann Pilot-Flows gegen Manifest-, Preview- und Extension-Bindings pruefen |
| `WP-E04-10` | nutzt Boundaries fuer Framework-Agnostik und Parallelbetrieb |
| `WP-E04-11` | uebernimmt Binding- und Handoff-Records fuer upstream XTendRMT DSL/Bridge |
| Epic 05 | baut produktive Bridge, native RMT Routes und XRouter Adapter auf den Contracts auf |

## Lokaler Testpfad

```bash
node --check xtend-builder/typing/component-types.js
node --check xtend-builder/preview/component-preview.js
node --check xtend-builder/extensions/component-extension-points.js
node --check xtend-builder/generators/component-files.js
node --check xtend-builder/workflows/developer-workflow.js
node --check tests/references/reference_path_suite.js
node --check tests/rmt/rmt_compatibility_suite.js
node xtend-builder/scaffold.js typing --tag x-example --profile routing --feature state --json
node xtend-builder/scaffold.js preview --tag x-example --profile routing --feature state --json
node xtend-builder/scaffold.js extensions --tag x-example --profile routing --feature state --json
node xtend-builder/scaffold.js component-files --tag x-example --profile routing --feature state --json
node xtend-builder/scaffold.js workflow --tag x-example --profile routing --feature state --json
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-E04-07` ist abgeschlossen. XTend-Scaffold gibt RMT-Kompatibilitaet nun als stabilen Dry-Run-Contract aus und verbindet Typing, Manifest-Plan, Preview-Plan, Extension-Punkte, Component-Files und Workflow unter `xtend.scaffold.rmt-compatibility-binding.v1`. `WP-E04-08` kann Tests und Referenzgates fuer RMT-kompatible XTend-Artefakte erweitern.

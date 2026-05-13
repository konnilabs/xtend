# XTend Builder Types

Status: `completed`  
Workpackage: `WP-TypeExports-06`  
Schema: `xtend.type-exports.builder-declarations.v1`  
Gate: `node scripts/run_xtend_tests.js type-exports-builder --json`

## Scope

`WP-TypeExports-06` typisiert die Builder-, Scaffold- und Component-Lab-Programm-APIs, ohne die CLI oder die Generatoren nach TypeScript zu portieren.

Die gemeinsame Grundlage liegt in `./xtend-builder/builder-public-types.d.ts`:

- `XtendBuilderComponentInput`
- `XtendBuilderComponentPlan`
- `XtendBuilderComponentFilesResult`
- `XtendBuilderWorkflow`
- `XtendBuilderComponentLabPlan`

## Declaration Pack

Die Root- und Workflow-APIs sind ueber diese Facades stabilisiert:

- `./xtend-builder/scaffold.d.ts`
- `./xtend-builder/lib/cli.d.ts`
- `./xtend-builder/blueprints/component-blueprint.contract.d.ts`
- `./xtend-builder/generators/component-plan.d.ts`
- `./xtend-builder/generators/component-files.d.ts`
- `./xtend-builder/generators/registry.d.ts`
- `./xtend-builder/workflows/developer-workflow.d.ts`

Component-Lab- und Preview-Consumer erhalten eigene Contracts:

- `./xtend-builder/preview/component-preview.d.ts`
- `./xtend-builder/preview/component-lab.d.ts`
- `./xtend-builder/preview/component-lab-ux-inspector.d.ts`

Die bereits exportierten Typing- und UX-Contract-Module sind als schmale Facades abgebildet, darunter `component-shell-contract`, `component-styling-contract`, `component-network-contract`, `rmt-shell-authoring-contract`, `rmt-dsl-authoring-polish`, die Form-/Feedback-/Navigation-/Overlay-/Layout-UX Contracts und `component-ux-performance-contract`.

## Package Exports

Die Package-Exports `./builder`, `./builder/*` sowie die expliziten Builder-Subexports erhalten `types`-Conditions. Beispiel:

```json
"./builder": {
  "types": "./xtend-builder/scaffold.d.ts",
  "default": "./xtend-builder/scaffold.js"
}
```

`./builder/*` bleibt als generischer Anschluss fuer repo-lokale Builder-Module erhalten und zeigt auf `./xtend-builder/*.d.ts`.

## Boundary

Die Declarations bleiben `types-only-no-runtime-imports`. Sie importieren keine Builder-Runtime, keine Komponenten, keinen RMT-Kernel und keine Loader-/API-Laufzeit. Der lokale Gate vergleicht Runtime-Exports, Package-`types`-Conditions, vorhandene Declaration-Dateien und die gemeinsame Builder-Type-Basis.

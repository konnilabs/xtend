# XTend Builder Types

Status: `completed`  
Workpackage: `WP-TypeExports-06`  
Schema: `xtend.type-exports.builder-declarations.v1`  
Gate: `node scripts/run_xtend_tests.js type-exports-builder --json`

## Scope

`WP-TypeExports-06` types the Builder, Scaffold and Component Lab program APIs without porting the CLI or generators to TypeScript.

The shared basis lives in `./xtend-builder/builder-public-types.d.ts`:

- `XtendBuilderComponentInput`
- `XtendBuilderComponentPlan`
- `XtendBuilderComponentFilesResult`
- `XtendBuilderWorkflow`
- `XtendBuilderComponentLabPlan`

## Declaration Pack

The root and workflow APIs are stabilized through these facades:

- `./xtend-builder/scaffold.d.ts`
- `./xtend-builder/lib/cli.d.ts`
- `./xtend-builder/blueprints/component-blueprint.contract.d.ts`
- `./xtend-builder/generators/component-plan.d.ts`
- `./xtend-builder/generators/component-files.d.ts`
- `./xtend-builder/generators/registry.d.ts`
- `./xtend-builder/workflows/developer-workflow.d.ts`

Component Lab and preview consumers receive their own contracts:

- `./xtend-builder/preview/component-preview.d.ts`
- `./xtend-builder/preview/component-lab.d.ts`
- `./xtend-builder/preview/component-lab-ux-inspector.d.ts`

The already exported typing and UX contract modules are represented as narrow facades, including `component-shell-contract`, `component-styling-contract`, `component-network-contract`, `rmt-shell-authoring-contract`, `rmt-dsl-authoring-polish`, the form/feedback/navigation/overlay/layout UX contracts and `component-ux-performance-contract`.

## Package Exports

The package exports `./builder`, `./builder/*` and the explicit builder subexports receive `types` conditions. Example:

```json
"./builder": {
  "types": "./xtend-builder/scaffold.d.ts",
  "default": "./xtend-builder/scaffold.js"
}
```

`./builder/*` remains a generic connection for repo-local builder modules and points to `./xtend-builder/*.d.ts`.

## Boundary

The declarations remain `types-only-no-runtime-imports`. They import no builder runtime, components, RMT kernel or loader/API runtime. The local gate compares runtime exports, package `types` conditions, existing declaration files and the shared builder type base.

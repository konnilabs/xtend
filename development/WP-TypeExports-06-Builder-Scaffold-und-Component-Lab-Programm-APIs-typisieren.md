# WP-TypeExports-06 - Builder-, Scaffold- und Component-Lab-Programm-APIs typisieren

Status: `completed`  
Prioritaet: `P1`  
Workspace: `WS4`  
Schema: `xtend.type-exports.builder-declarations.v1`

## Ziel

XTend Builder APIs sind fuer externe und interne Tooling-Consumer typisiert nutzbar. Die CLI bleibt CommonJS/Node-kompatibel und muss nicht nach TypeScript portiert werden.

## Ergebnis

- `xtend-builder/builder-public-types.d.ts`
- `xtend-builder/scaffold.d.ts`
- `xtend-builder/lib/cli.d.ts`
- `xtend-builder/blueprints/component-blueprint.contract.d.ts`
- `xtend-builder/generators/component-plan.d.ts`
- `xtend-builder/generators/component-files.d.ts`
- `xtend-builder/generators/registry.d.ts`
- `xtend-builder/preview/component-lab.d.ts`
- `xtend-builder/preview/component-lab-ux-inspector.d.ts`
- `xtend-builder/workflows/developer-workflow.d.ts`
- `xtend-builder/typing/**/*.d.ts`
- `catalog/type-exports-builder.js`
- `tests/types/builder_type_exports_suite.js`
- `docs/xtend-builder-types.md`
- `.xtend-test-results/xtend-type-exports-builder-report.json`
- `node scripts/run_xtend_tests.js type-exports-builder --json`

## Definition Of Done

- externe oder interne Builder-Aufrufer koennen Generatoren typisiert nutzen
- Package-Exports fuer `./builder`, `./builder/*` und explizite Builder-Subexports besitzen `types`-Conditions
- Component-Lab, Scaffold, Blueprint, Preview, Workflow und Typing-Contract APIs sind als Declarations sichtbar
- CLI bleibt kompatibel und muss nicht nach TypeScript portiert werden
- keine Declaration importiert Builder-Runtime, Komponenten, Loader, API oder RMT-Kernel zur Laufzeit

## Handoff

`WP-TypeExports-07` kann nun das generische Catalog Declaration Pattern auf denselben Gate-Mechanismus stuetzen.

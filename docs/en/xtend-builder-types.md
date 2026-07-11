# XTend Builder Types

XTend Builder Types describe the public data shapes for scaffold, Component Lab and workflow automation. They are meant for teams that integrate the XTend builder into their own tools or verify generated components. The declarations live in files such as `./xtend-builder/scaffold.d.ts` and `./xtend-builder/builder-public-types.d.ts`; the JavaScript CLI remains unchanged.

## Builder Surface

Important types include `XtendBuilderComponentInput`, `XtendBuilderComponentPlan`, `XtendBuilderComponentFilesResult`, `XtendBuilderWorkflow` and `XtendBuilderComponentLabPlan`. They make it clear which inputs a scaffold step expects, which files are planned, which results come back and how workflows describe their steps.

The types intentionally focus on data rather than process control. A host can validate a component plan, an internal tool can display a lab plan and a CI check can compare generated files without reimplementing the CLI. That keeps the builder extensible for third-party developers while preserving the existing JavaScript execution path.

## Stability Rule

The CLI remains compatible and does not need to be ported to TypeScript. TypeExports only verifies that public builder declarations, package metadata and documentation describe the same surface. When a new builder option appears, it should be represented in the plan type, handled by the runtime and covered by a local test path. If a field is internal only, keep it out of the public types.

This boundary prevents generated artifacts from depending on private variables or temporary filenames. Public host integrations should work with inputs, plans, results and workflows rather than intermediate build state.

## Local Verification

Run the builder type check whenever scaffold options, builder reports, Component Lab plans or package exports change.

```bash
node scripts/run_xtend_tests.js type-exports-builder --json
```

```txt
schema: xtend.type-exports.builder-declarations.v1
local gate: node scripts/run_xtend_tests.js type-exports-builder --json
report: .xtend-test-results/xtend-type-exports-builder-report.json
```

## Maintenance Notes

Keep builder types close to the artifacts a host actually needs to see. Add clear optional fields when a new mode appears, and avoid vague `any` surfaces. A good builder update changes runtime, declarations, tests and documentation together. This lets third-party developers use the builder as a reliable automation building block without learning private XTend directory rules.

## Related reading

The app-platform tooling guide exercises the builder declarations in a complete authoring flow. [Related article](./rmt-app-platform-tooling.md)

# {{tag}} Preview Reference Plan

- Status: scaffolded preview candidate
- Schema: `{{previewContractSchema}}`
- Preview path: `{{previewTargetPath}}`
- Registry: `{{previewRegistryPath}}`
- Component: `components/{{tag}}.js`
- Docs: `docs/components/{{name}}.md`
- Fixture: `{{previewFixtureDocument}}`
- Types: `components/{{tag}}.d.ts`
- Manifest source: `{{manifestSource}}`
- External network allowed: `{{previewExternalNetworkAllowed}}`

## Purpose

This preview plan makes the scaffolded component visible to the documentation and demo reference gate before productive file writes are introduced.

## Reference Registry Entry

| Path | Status | Purpose |
|------|--------|---------|
| `{{previewTargetPath}}` | {{previewRegistryStatus}} | {{previewRegistryPurpose}} |

## Local Assets

| Asset | Path |
|-------|------|
| component | `components/{{tag}}.js` |
| docs | `docs/components/{{name}}.md` |
| fixture | `{{previewFixtureDocument}}` |
| types | `components/{{tag}}.d.ts` |
| manifest | `components/manifest.json` |

## Feature Signals

| Signal | Contract |
|--------|----------|
{{previewSignalRows}}

## XTendRMT Attachment

- Component adapter: `{{typeRmtAdapter}}`
- Router adapter: `{{typeRmtRouterAdapter}}`
- Kernel boundary: {{typeRmtKernelBoundary}}

## RMT Compatibility Binding

- Schema: `{{rmtCompatibilitySchema}}`
- Contract refs: `{{rmtCompatibilityContractRefsCsv}}`
- Dry-run surfaces: `{{rmtCompatibilityDryRunSurfacesCsv}}`
- Minimum gate: `{{rmtCompatibilityMinimumGate}}`
- Boundary: {{rmtCompatibilityBoundary}}

## Extension Points

- Schema: `{{extensionContractSchema}}`
- Root lifecycle schema: `{{extensionRootLifecycleSchema}}`
- Template adapter: `{{extensionTemplateAdapter}}`
- Rendering mode: `{{extensionRenderingMode}}`
- Schedule hint: `{{extensionScheduleHint}}`

## Local Verification

```bash
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js components a11y-hydration
npm test
```

## Boundary

This is a dry-run preview reference plan. It does not write files, does not patch the reference registry, does not start browser automation and does not implement XTendRMT bridge runtime.

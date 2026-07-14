# Native-First Migration Guide

This guide describes how XTend reduces existing vendor-backed, legacy or non-native paths in a controlled way. The goal is not fast removal; it is traceable migration with an alternative, local check, SemVer rule and release decision.

## Rule

An old surface may be deprecated or removed only when these four items are visible:

- a Native-First alternative
- a migration guide
- a local check
- a release decision with a SemVer rule

Relevant contracts:

- `xtend.native-first.vendor-legacy-replacement.v1`
- `xtend.native-first.migration-deprecation-plan.v1`
- `xtend.native-first.performance-complexity-bundle-budget-gates.v1`
- `xtend.native-first.docs-authoring-guides.v1`

## Migration Classes

| Class | Decision | Alternative |
| --- | --- | --- |
| Untrusted HTML string sinks | block new normal app UI | authored XTend Classic markup, DOM Descriptor Renderer, Trusted DOM, structured DOM APIs |
| Vendored utilities | freeze the facade, no broad public surface | owned docs highlighter, structured writer, sanitizing boundary |
| Build tooling | contain it outside runtime | local fallbacks, budget and supply-chain evidence |
| Editor tooling | keep it in editor scope | owned RMT Language Server over stdio |
| Legacy loader surfaces | keep compatibility, plan warning window | XTend Classic through `xtend-loader.js`, RMT Native Shell, App Platform Authoring |
| Controlled backports | keep as closed guardrail | regression smokes and owned component contracts |
| Owned adapters | keep as positive pattern | local packs, no CDN or vendor runtime |

## Manual HTML Paths

Normal app UI should not be created through free HTML string sinks. Patterns such as `innerHTML`, `template.innerHTML` and `insertAdjacentHTML` are affected when they create visible product UI without a Trusted DOM boundary.

Migration:

1. Describe structure as an RMT recipe or DOM descriptor record.
2. Separate text, attributes, properties, URLs and events.
3. Use Trusted DOM only for intentionally reviewed HTML fragments.
4. Provide budget and renderer evidence before a production claim.

Local checks:

```bash
node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json
node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
```

## Prism And Turndown

`components/prism.js` and `components/turndown.js` remain narrow local utilities. They must not grow into broad public vendor surfaces. New production uses need an owned alternative or a clear trust boundary.

Migration:

- Prism: prefer an owned docs highlighter or RMT-aware semantic tokens.
- Turndown: prefer a structured writer, Markdown AST or sanitizing boundary.
- Both paths remain free of new runtime dependencies.

Local checks:

```bash
node scripts/run_xtend_tests.js type-exports-vendor --json
node scripts/run_xtend_tests.js supply-chain --json
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
```

## Tooling Dependencies

`rollup`, `terser` and `vscode-languageclient` are not frontend defaults. They stay build or editor tooling and must not move into the core runtime.

Migration:

- Maraca keeps local fallbacks for import graph and minification.
- Editor integration stays bound to the RMT Language Server over stdio.
- Bundle, size and supply-chain evidence remain required.

## Legacy Loader Surfaces

Only `xtend-dev.js` and `./legacy-loader` are legacy compatibility surfaces. [XTend Classic](./xtend-classic.md) through the canonical `xtend-loader.js` is supported product delivery, as are RMT Native Shell and App Platform Authoring. Any later removal of a compatibility surface needs a major window and at least two earlier minor warnings.

Local checks:

```bash
node scripts/run_xtend_tests.js type-exports-loader --json
node scripts/run_xtend_tests.js rmt-native-shell-migration --json
node scripts/run_xtend_tests.js component-long-tail-migration --json
node scripts/run_xtend_tests.js references --json
```

## Schema IDs and exact aliases

Schema IDs are wire-level discriminators. Do not replace an ID only because a
runtime sample has the same fields. SchemaDB requires a complete declared or
formal contract, an identical authoritative fingerprint set and an explicit
semantic owner decision before two IDs become exact aliases.

The first consolidation is the XTensions host-resource cleanup record:

- Canonical: `xtend.xtensions.host-resource-cleanup-record.v1`
- Legacy aliases: Chart, Leaflet, React host-controller, Three and Vue
  host-controller cleanup record IDs
- Separate contract: `xtend.xtensions.host-controller-cleanup-record.v1`
  remains unchanged because it has no `xtensionId`

New cleanup producers write the canonical ID. Readers can use the domain-local
resolver exposed by the existing XTensions modules; it accepts the canonical ID
and the five deprecated aliases and reports whether the input was legacy.
Unknown IDs remain invalid. The aliases stay readable for two minor releases and
may be removed only in a later major release.

Schema versions use major-only `vN` suffixes. Any structural or validation
change creates a new major schema ID; descriptions, examples and governance
notes do not.

Local checks:

```bash
node scripts/scan_schema_inventory.js --audit-duplicates --json
node scripts/run_xtend_tests.js schema-inventory --json
```

## Guardrails

Controlled vendor backports and owned adapters are not open deprecations. They remain visible guardrails:

- no new vendor copy
- no CDN runtime
- no broader foreign API than the public XTend contract
- regression smokes and component contracts stay active

## Minimal Check

```bash
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js contract-registry --json
```

Read next:

- [Native-First Authoring Guide](./native-first-authoring-guide.md)
- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
- [Native-First Release Review](./native-first-release-review.md)

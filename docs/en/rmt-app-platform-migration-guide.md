# RMT App Platform Migration Guide

Move larger app structures to the RMT app platform APIs.

## What it covers

This guide moves an existing application from handwritten host callbacks to typed App Platform records one vertical slice at a time. The goal is behavioral parity: state, actions, events, resources, and surfaces change owners without losing navigation, failure states, or cleanup.

## Public building blocks

- `tests/fixtures/rmt-app-platform-authoring.rmt` demonstrates the target structure.
- `tools/rmt-language/vnext-compiler.js` emits the comparable core model.
- `rmt-app-platform-migration-guide` is the public migration path; internal release reports do not belong here.

## Recommended workflow

Inventory state and side effects in the old host first. Then migrate one complete surface with its action and resource, compare core output, and remove legacy wiring only after the browser smoke passes.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Verify target and coexistence

```bash
node scripts/run_xtend_tests.js rmt-app-platform-authoring native-first-migration-deprecation --json
```

The first gate proves the target model; the second protects coexistence boundaries during migration. Both reports must assign each surface to one unambiguous owner.

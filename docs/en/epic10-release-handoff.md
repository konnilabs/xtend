# Epic 10 Release Handoff

Contract: `xtend.epic10.release-handoff.v1`

This document is the official closure and handoff point for Epic 10.

## Status

Epic 10 is complete. All 16 workpackages are `completed`.

The local gate is:

```bash
node scripts/run_xtend_tests.js epic10-release-handoff --json
npm run test:epic10-release-handoff
```

## Canonical Guides

| Topic | Guide |
|-------|-------|
| Component Platform | [Component Platform](./component-platform.md) |
| TypeScript-first components | [TypeScript Components](./typescript-components.md) |
| RMT-first XTend apps | [RMT-first XTend Apps](./rmt-first-xtend-apps.md) |
| Component Lab | [Component Lab](./component-lab.md) |
| Existing Component Metadata | [Existing Component Metadata](./existing-component-metadata.md) |
| Platform Gates | [Epic 10 Platform Gates](./epic10-platform-gates.md) |
| Enterprise Adoption | [Enterprise Adoption](./enterprise-adoption.md) |

## Fabric Boundary

The canonical component Fabric boundary is:

```text
adapter-injection-via-xtend-component-resolveFabricContext
```

Components receive Fabric, lane and fiber context through the `xtend.component` adapter. `window.XTendFabric` remains usable for hosts and enterprise integration, but is not the component contract. The RMT boundary remains `no-rmt-kernel-import-of-xtend-types`.

## Migration Notes

For apps and components from the state before Epic 10:

- New components are planned TypeScript-first under `src/components/<tag>/`.
- Runtime artifacts remain local ES modules under `components/`.
- `xtend-loader.js` is canonical; `xtend-dev.js` remains the legacy boundary.
- Complete XTend apps are described in RMT.
- Existing JS components are first connected through RMT/Fabric metadata overlays.
- Big-bang TypeScript migrations are not part of the target path.
- Performance, a11y and visual gates are part of the component definition.
- CDN paths remain removed from default, demo and test paths.

## Release Candidate Gate

Before a release candidate:

```bash
npm run test:pr:report
npm run test:release:full:report
npm run release:report
npm run pack:dry-run
```

Conditional network gates:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
```

Publishing remains blocked until a release owner explicitly approves `private-until-release-owner-acceptance`.

## Next-Wave Handoff

The next product wave should pick up:

- long-tail component runtime migration
- remaining performance profile authoring
- component catalog completion
- release candidate packaging
- XTendRMT upstream DSL polish

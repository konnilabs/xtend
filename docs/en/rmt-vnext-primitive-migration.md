# RMT vNext Primitive Migration

- Contract: `xtend.rmt.vnext.primitive-migration-preview.v1`
- Workpackage: `RMT-VNEXT-PRIM-08`
- Status: `in_progress`
- Source fixture: `tests/fixtures/rmt-app-platform-tooling.rmt`
- Local gate: `node scripts/run_xtend_tests.js rmt-vnext-compatibility --json`

## Goal

`RMT-VNEXT-PRIM-08` pushes Legacy and App Platform JSON authoring into the background. Existing App Platform primitive records remain available as compiler targets and compatibility evidence, but the primary authoring surface is RMT vNext.

The migration path therefore does not create a new legacy work mode. It creates a vNext preview draft from existing App Platform records and immediately compiles that draft through the vNext compiler again. Only when this draft can lower state, data sources, actions, events, portals, overlays, resources, surfaces, lanes and Kernel records is the migration considered compatible.

## Preview and Apply-Plan Contract

The API `createAppPlatformPrimitiveMigrationPreview(...)` detects App Platform JSON documents with primitive domains such as `state`, `dataSources`, `actions`, `events`, `portals`, `overlays`, `resources` and `surfaces`.

The preview report contains:

- `schema: "xtend.rmt.vnext.primitive-migration-preview.v1"`
- `workpackage: "RMT-VNEXT-PRIM-08"`
- `languageMode: "legacy-app-platform-json"`
- `vNextAuthoring.role: "default"`
- `legacyAuthoring.role: "compiler-target"`
- `legacyAuthoring.backgrounded: true`
- `authoringDraft` with vNext primitive syntax
- `authoringDraftCompileStatus: "compiled"`
- `projection.appPlatform` and `projection.kernelRecords`
- `domainMapping` for the detected primitive families

Report-only mode writes no source. Instead, it reports `rmt.vnext.migration.opt_in_required` and `rmt.vnext.primitive_migration.preview_available`. Preview mode is deliberately opt-in so existing downstream fixtures are not migrated silently.

The API `createAppPlatformPrimitiveMigrationApplyPlan(...)` builds on that and creates a deterministic apply plan:

- `schema: "xtend.rmt.vnext.primitive-migration-apply-plan.v1"`
- `status: "apply-plan-ready"` when the vNext draft compiles and a projection can be produced
- `status: "blocked"` when JSON parsing or vNext compilation fails
- `targetPath` as target path hint, by default `<source>.vnext.rmt`
- `automaticWrite: false`
- `writePolicy: "manual-apply-only"`

The apply plan performs no file write. It is a verifiable handoff for agents, CLIs or editors that want to adopt the vNext draft into a new authoring path after review. Legacy/App Platform JSON remains mirror and compiler target, not the user-facing authoring surface.

## Authoring Draft

The App Platform fixture is converted into a vNext shell of this shape:

```rmt
template epic18.app-platform-tooling.fixture {
  state items type collection initial []

  datasource items from fixture records.generic-items {
    contract "domain.record.generic-item.v1[]"
  }

  action load-items {
    effect fetch datasource items
    reduce state.items = result.records
  }

  portal app root "#app-root" layer surface

  surface workspace kind window component workspace {
    repeat from datasource items
    portal app

    lane visible weight 70 {
      hydrate workspace from datasource items
    }

    on open-detail target ref.row -> action open-detail {
      payload id from detail.id
    }
  }
}
```

The preview normalizes known App Platform prefixes for vNext authoring: `state.items` becomes `state items`, `datasource.items` becomes `datasource items`, `surface.workspace` becomes `surface workspace` and `action.open-detail` becomes `action open-detail`. Runtime and Kernel records remain correlatable through the compiler projection.

## Gate Expectation

The compatibility gate verifies for PRIM-08 that:

- App Platform primitive JSON is detected as `legacy-app-platform-json`.
- Report-only mode requires explicit preview opt-in.
- Preview mode creates a vNext draft and compiles it.
- Apply-plan mode creates the same draft, a target path hint and a blocking compile/parse check without writing files.
- The projection contains App Platform and Kernel records.
- Legacy is marked as `compiler-target`, not as the authoring path.
- The compatibility matrix accepts App Platform preview and native vNext source together.

This makes the upgrade rule testable: Legacy remains provably compatible, but the developer experience for new app-shell work lives in vNext.

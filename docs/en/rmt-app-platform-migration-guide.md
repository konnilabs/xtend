# RMT App Platform Migration Guide

This guide describes the path from external host helpers such as `root.innerHTML`, product-bound surface lists or local registry repaints to native RMT App Platform primitives.

## Target State

- New UI is described in RMT vNext; DOM Descriptor, App Platform JSON and component records are generated output or compatibility mirrors.
- State, selectors and derived values live in the RMT State Selector Runtime.
- Interactions run through declarative events and actions.
- Datasources remain interchangeable: `fixture`, `rest`, `ssr` and `host`.
- Surfaces, overlays, portals and resources are materialized and cleaned up through the Surface Resource Graph.

```rmt
template migration.catalog {
  state records type collection initial []

  selector visibleRecords from state records {
    output CatalogRecord[]
  }

  datasource catalog from fixture records.generic-items {
    contract CatalogRecord[]
  }

  action load-records {
    effect fetch datasource catalog
    on success -> reduce state.records = result.records
  }

  portal surface.root root "#app-root" layer surface

  surface catalog.board kind workspace component x-cards {
    repeat from selector visibleRecords
    key record.id
    portal surface.root

    lane visible weight 80 {
      hydrate catalog-cards from selector visibleRecords
    }

    on card-click target item -> action load-records {
      payload source from target.dataset.source
    }
  }
}
```

## Migration

1. Identify external HTML host renderers.
   Search for `innerHTML`, `outerHTML`, `insertAdjacentHTML` and `document.write`.
2. Move shell structure to RMT vNext.
   Normal app UI uses `template`, `surface`, `portal`, `lane`, `hydrate` and events; `mode: "dom_descriptor"` appears only in output.
3. Decouple product lists.
   Instead of a fixed record class, use configurable record contracts with stable IDs and keys.
4. Declare interactions.
   DOM or custom events receive `payloadContract` and route to actions.
5. Keep datasources interchangeable.
   Local fixture data, SSR bootstrap, REST search and host mutation share the same action path.
6. Check surface lifecycle.
   Every surface with `resource` entries needs an owner, overlays run through portals, and destroy/close must release resources.
7. Create scaffold evidence.
   The RMT App Platform Builder writes diagnostics, source map and build report.

## Reference

The reference fixture is located at `tests/fixtures/rmt-app-platform-fixture.rmt` and proves `generic-catalog`, `admin-queue` and `content-board` with the same primitives.

```bash
node scripts/run_xtend_tests.js rmt-app-platform-fixture --json
```

## Boundary

Trusted HTML remains an explicit special case with Trusted DOM boundary. Normal app UI must not use HTML strings as the render path.

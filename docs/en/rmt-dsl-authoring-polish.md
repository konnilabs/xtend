# RMT DSL Authoring Polish

The contract `xtend.rmt.dsl-authoring-polish.v1` prepares a friendlier RMT DSL
for XTend component shells. It makes RMT authoring shorter without embedding
XTend in the RMT kernel.

Local gate:

```bash
node scripts/run_xtend_tests.js rmt-dsl-authoring-polish --json
```

## Why This Package Exists

After `WP-E12-12`, XTend has a productive design-token vocabulary.
`WP-E12-13` uses these tokens so shells, slots, styles, a11y, events, commands,
hydration, Fabric lanes, and XRouter routes can be described more easily in
RMT.

RMT remains host-neutral:

- `xtend.component` renders and hydrates components in the host.
- `xtend.xrouter` connects route records to XRouter.
- `xtend.fabric` and telemetry remain adapter/host data.
- `no-rmt-kernel-import-of-xtend-types` remains mandatory.

## Authoring Aliases

| Alias | Target |
|-------|--------|
| `component` | XTend component record |
| `shell` | shell state, slots, parts, and focus |
| `slot` | template, component, or text slots |
| `style` | variant, theme, density, tokens, and parts |
| `token` | productive `--xtend-*` tokens |
| `theme` | theme pack |
| `density` | density pack |
| `a11y` | role, label, live region, keyboard, and announcements |
| `on` | event to command |
| `command` | command to schedule |
| `hydrate` | hydration policy |
| `lane` | Fabric lane and fiber |
| `route` | XRouter route |
| `link` | XLink-compatible link |
| `outlet` | route outlet in the template |

## Example

```rmt
template settings.shell {
  state settings.theme type string initial "dark"
  state settings.density type string initial "comfortable"

  portal surface.root root "#settings-root" layer surface

  surface settings.shell kind page component x-section {
    portal surface.root

    lane visible weight 80 {
      hydrate settings-header {
        slot header hydrate settings.header.template
      }

      hydrate feedback-toast from endpoint xtendrmt.component.hydrate {
        slot feedback hydrate feedback.toast
      }
    }

    lane idle weight 20 {
      hydrate settings-shell-style from endpoint xtendrmt.component.hydrate {
        trust boundary "xtend.security.sanitizing-boundary.v1"
      }
    }
  }
}
```

Token aliases remain part of the contract: productive styles continue to
reference stable custom properties such as `--xtend-surface` and
`--xtend-color-primary`, while vNext describes structure, slots, and hydration.

The normalized output becomes `components[]`, `templates[]`, and `schedules[]`.
RMT describes the structure; XTend executes component hydration.

## Routing Sugar

Routes can be described in an author-friendly surface, link, and outlet
structure:

```rmt
template settings.routing {
  portal surface.root root "#app-root" layer surface

  surface settings.route kind page component x-section {
    portal surface.root

    lane visible weight 80 {
      hydrate settings-shell from endpoint xtendrmt.route.render
      hydrate settings-link from endpoint xtendrmt.component.hydrate
      slot outlet hydrate primary
    }

    on click target settings-link -> action route.navigate {
      payload href from "/settings"
    }
  }
}
```

This becomes `routes[]`, `components[]`, and `templates[]` with adapter
`xtend.xrouter`. XRouter remains a host adapter, not an RMT kernel dependency.

## Diagnostics

The polish plan defines these diagnostic codes:

- `rmt.dsl.alias.unknown`
- `rmt.dsl.alias.required-field-missing`
- `rmt.dsl.token.unknown`
- `rmt.dsl.route.target-unresolved`
- `rmt.dsl.link.route-unresolved`
- `rmt.dsl.slot.target-unresolved`
- `rmt.dsl.schedule.unresolved`
- `rmt.dsl.inline-runtime-code-refused`
- `rmt.dsl.kernel-boundary.refused`

This lets XTendRMT upstream build friendlier parser errors and editor hints
without importing the XTend runtime.

## Artifacts

- Contract: `development/XTend-RMT-DSL-Authoring-Polish-fuer-Component-Shells.md`
- Module: `xtend-builder/typing/rmt-dsl-authoring-polish.js`
- Fixture: `tests/fixtures/rmt-dsl-authoring-polish.rmt`
- Suite: `tests/rmt/rmt_dsl_authoring_polish_suite.js`

## RC0 Adoption Update

Since `WP-E12-15`, the [RC0 Adoption Guide](./rc0-adoption-guide.md) describes
how app authors use this DSL polish layer for shell-first XTend apps. The most
important migration rule remains: RMT may construct and schedule XTend
components, XRouter routes, and content slots without embedding XTend types in
the RMT kernel.

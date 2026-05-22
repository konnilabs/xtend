# Epic 11 Enterprise UX Handoff

Docs contract: `xtend.epic11.enterprise-ux-handoff.v1`

Epic 11 closes the visible enterprise UX maturity of the XTend components. Shell, styling, runtime a11y, performance, component network, RMT shell authoring, Component Lab, browser smokes, theme matrix, authoring guides and long-tail migration are now connected as local gates.

## Completion Mode

```text
completed-with-accepted-long-tail-handoff
```

This means: the central Component UX platform is accepted. Open long-tail points continue as product handoff, not as unrecognized residual work.

## Local Gate

```bash
node scripts/run_xtend_tests.js epic11-enterprise-ux-handoff --json
```

## Historical Accepted Residuals

This table describes the state of the Epic 11 handoff. The current RC1 state is continued by [Known Residual Triage](./known-residual-triage.md).

| Component | Priority | Goal | Residual dimension |
|-----------|----------|------|--------------------|
| `xstate` | P1 | `ux-baseline-probe` | historical: a11y, performance |
| `x-utils` | P2 | `ux-baseline-probe` | historical: suite, fixture, types, performance |

`x-tabs` is closed by `WP-E12-02`/`WP-E12-03`. `x-theme` is closed by `WP-E12-04`/`WP-E12-05`. `x-button` is closed by `WP-E12-06`. `x-menu` is closed by `WP-E12-07` and is now `enterprise-ready`. Since `WP-E12-08`, `xstate` has suite, fixture, public types, lifecycle events, Fabric diagnostics and RMT state adapter. Since `WP-E12-09`, `x-utils` has utility contract, import policy, fixture and public types. The later [Known Residual Triage](./known-residual-triage.md) closes both scopes for RC1 as runtime and utility boundary respectively.

## Gate Chain

- `component-shell-contract`
- `component-styling-contract`
- `runtime-a11y-contract`
- `component-ux-performance`
- `component-network-contract`
- `rmt-shell-authoring-ux`
- `form-controls-ux`
- `feedback-status-ux`
- `navigation-routing-ux`
- `overlay-interaction-ux`
- `layout-display-media-ux`
- `component-lab-ux-inspector`
- `component-ux-browser-smokes`
- `component-shell-theme-matrix`
- `component-ux-authoring-docs`
- `component-long-tail-migration`
- `catalog-coverage`
- `regression-priority`
- `references`

## Release Boundary

`package.json` remains `private: true`. Publishing remains blocked until Release Owner Acceptance:

```text
private-until-release-owner-acceptance
```

## Next-Wave Handoff

- Long-tail runtime implementation
- Visual snapshot automation
- Enterprise design system token productization
- RMT DSL authoring polish
- Release candidate owner acceptance

The RMT kernel boundary remains `no-rmt-kernel-import-of-xtend-types`.

# Epic18 Vendor Bugfixes

This page mirrors the Epic18 vendor bugfix evidence for `x-tooltip`, `x-player`, `x-surface-window`, `x-side-panel`, and `x-surface-manager-controller`.

Local gate:

```bash
node scripts/run_xtend_tests.js epic18-vendor-bugfix-smokes --json
```

## Scope

The Epic18 vendor bugfixes capture concrete feedback from the App Platform and Surface work. They are not a new vendor package and not a broad API expansion; they are targeted corrections to existing owned components. `x-tooltip` remains responsible for simple help text and trigger focus. `x-player` remains the media component for controlled playback and caption cases. `x-surface-window`, `x-side-panel`, and `x-surface-manager-controller` keep the Surface Manager runtime stable when windows, panels and controllers are used together inside an RMT app.

The main release concern is traceability. Every correction must attach to a visible symptom: incorrect focus, an incomplete event, an unstable stack value, an unclear media state, or a controller action that was not written back to the Surface snapshot. A fix counts only when the smoke covers the same path that host applications will use later. That keeps cosmetic changes from being treated as vendor bugfix evidence.

## Evidence Model

The local `epic18-vendor-bugfix-smokes` gate checks the affected components as a small integration group. Reviewers should look first at the component names and then at the behavior chain: input, runtime state, DOM output and event. For tooltips, trigger and descriptive content must stay consistent. For the player, media controls and host events must not drift apart. For Surface components, window and panel state must be read by the controller, updated, and made observable again.

The evidence is intentionally local. There is no network assumption, no external browser service and no new third-party dependency. If a reproduction needs real media or complex layout, the fixture is reduced until the bugfix core remains visible. That makes the smokes fast enough for PR gates and concrete enough for release owners.

## Reviewer Notes

A bugfix is accepted when it tightens an existing contract without opening new product claims. A fix is blocked when it introduces a framework-specific API, requires manual `innerHTML` hosts, duplicates the Surface registry or blurs the Native-First boundary between RMT and XTend components. Residuals belong in the Epic18 handoff, not in silent code paths. That keeps closed defects and remaining app-platform evidence separate.

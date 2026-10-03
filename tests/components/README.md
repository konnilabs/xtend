# Component Tests

Scope:

- attributes and properties
- slots
- custom events
- state synchronization
- accessibility expectations
- hydration and rehydration behavior

Component-level tests follow `development/XTend-Component-Level-Teststandard.md`.

Current entry point:

```bash
node scripts/run_xtend_tests.js components
```

Dedicated Accessibility/Hydration gate:

```bash
node scripts/run_xtend_tests.js a11y-hydration
```

Standard layout:

```text
tests/components/
  <tag>.component_suite.js
  fixtures/
    <tag>.component.html
```

Required dimensions:

- source, manifest and registration contract
- attributes and properties
- slots and rendered DOM contract
- documented Custom Events
- canonical `state` synchronization where applicable
- accessibility minimum checks
- hydration and rehydration behavior

`WP-07` defines the standard. `WP-08` adds the first pilot component suites. `WP-09` adds the cross-component Accessibility/Hydration gate. `ER-WP-33` expands the local Component-Level-Suite baseline to prioritized P0/P1 catalog components.

Test obligation and scaffold contract:

- New, modernized and scaffolded components follow `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`.
- `XTend-Scaffold` must create or explicitly exclude component, docs, tests, fixtures, types and manifest artifacts.
- Component suites must contain real assertions; placeholder test files do not satisfy the contract.
- AI agents and human reviewers must record skipped or non-applicable profile checks in the workpackage, suite or component docs.

Implemented component suites:

- `xalert.component_suite.js`: feedback + stateful contract for `x-alert`
- `xtoast.component_suite.js`: feedback + interactive dismissal contract for `x-toast`
- `xmodal.component_suite.js`: overlay + stateful + accessibility contract for `x-modal`
- `xrouter.component_suite.js` and `xlink.component_suite.js`: native routing, XRouter events and RMT route metadata
- `xinput.component_suite.js`, `xform.component_suite.js`, `xcalendar.component_suite.js` and `xwriter.component_suite.js`: form, validation, state and authoring contracts
- `xtabs.component_suite.js`, `xbutton.component_suite.js`, `xmenu.component_suite.js`, `xsummary.component_suite.js` and `xspinner.component_suite.js`: interactive, feedback and keyboard contracts
- `xdialog.component_suite.js` and `xlightbox.component_suite.js`: overlay, focus and state contracts
- `xtheme.component_suite.js`: theme core-module namespace and state contract
- `xplayer.component_suite.js`: media control, event and state contract
- `accessibility_hydration_suite.js`: shared A11y/Hydration minimum gate for prioritized runtime UI components and browser fixtures
- `component_suite.js`: aggregate entry point for the local runner

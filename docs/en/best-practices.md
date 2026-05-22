# Best Practices for XTend

These recommendations help you build XTend projects that are robust,
performant, and maintainable for human developers and AI coding agents alike.

---

## Component Usage

- **Prefer declarative usage:** Use XTend components directly in HTML whenever
  possible, not only dynamically through JavaScript.
- **Lazy loading:** Build pages so components load only when needed
  (viewport, user interaction).
- **Shadow DOM:** Use Shadow DOM for style encapsulation and conflict
  prevention.
- **Slots and attributes:** Use slots and attributes for flexible, reusable
  components.

---

## State Management

- **Use xstate:** Share global and local state through the central state
  management module.
- **Subscriptions:** React to state changes with `xstate.subscribe` instead of
  expensive DOM queries.

---

## Theming and Styling

- **CSS custom properties:** Use variables for colors, spacing, and similar
  values so design stays flexible.
- **Use xtheme:** Apply global styles and theme changes centrally through the
  theme module.
- **Dark/light mode:** Support both modes and respect system preferences.

---

## Accessibility

- **ARIA roles:** Use meaningful ARIA attributes and roles.
- **Keyboard navigation:** Ensure every interactive component is operable by
  keyboard.
- **Focus management:** Dialogs, modals, and menus should place and restore
  focus correctly.

---

## Performance

- **Minimized manifest:** Remove unused components from the manifest for
  production builds.
- **Small bundles:** Keep components modular and small to optimize load time.
- **IntersectionObserver:** Use lazy loading for large or rarely used
  components.

---

## Development and Maintenance

- **Documentation:** Every component should have its own current Markdown
  documentation.
- **Naming conventions:** Keep the `x` prefix and use descriptive names.
- **Testing:** Test components in isolation and together.
- **Cross references:** Maintain cross-links in the docs for better orientation.

---

## Testing Requirement for New Components

- **Choose a profile:** Assign every new or modernized component to a profile
  from `development/XTend-Component-Level-Teststandard.md`.
- **Keep artifacts complete:** Component, docs, component suite, fixture, type
  definition, and manifest entry are required unless an exception is explicitly
  justified.
- **Use scaffold as the default path:** `XTend-Scaffold` must use the testing
  requirement from `development/XTend-Testpflicht-und-Scaffold-Anschluss.md` as
  its blueprint.
- **Run local gates:** Use at least `node scripts/run_xtend_tests.js components`,
  `a11y-hydration`, `references`, and for RMT-compatible scaffold artifacts
  `rmt-compatibility`; when core behavior is involved, also run `core`,
  `architecture`, and `browser`.
- **No placeholder tests:** Test files without real assertions do not satisfy
  the testing requirement.

## XTendRMT-Compatible Development

- **Prefer native domains:** New RMT-adjacent work uses `adapters`,
  `components`, `routes`, `schedules`, and `templates` instead of operational
  `manifest.metadata` blocks.
- **Keep the kernel boundary:** XTend, XRouter, DOM, `window.XTend`, and
  `xstate` belong in adapters or host code, not in the RMT kernel.
- **Use productive factories:** Use `createRmtXRouterAdapter`,
  `createRmtXtendComponentAdapter`, and
  `createRmtStateSchedulerDiagnosticsBridge` instead of private demo bridge
  logic.
- **Check multi-host behavior:** XTend is a first-class host, but not a required
  host. A non-XTend path such as `vanilla.component` should be considered for
  framework-adjacent changes.
- **Respect Trusted DOM:** RMT `dom_descriptor` is preferred. RMT
  `html_fragment` and Parsedown HTML need
  `xtend.security.sanitizing-boundary.v1`; raw `innerHTML` sinks do not belong
  in components or adapters.
- **Respect the Docs App:** The official docs use Parsedown as parser host, but
  render their shell shell-first through RMT. New docs convenience features
  should use `docs/xtendrmt-parsedown-scheduling.md`, `docs.app.shell`, and the
  existing RMT schedules instead of building a second SPA layer next to the host
  adapter.
- **Run gates:** For RMT-adjacent changes, run at least
  `node scripts/run_xtend_tests.js rmt-compatibility --json`,
  `node scripts/run_xtend_tests.js references --json`, and, for browser paths,
  `node scripts/run_xtend_tests.js browser --json`.

---

## AI Optimization

- **Consistent API:** Keep methods and attributes consistent and descriptive.
- **Example code:** Add concrete code examples to every doc.
- **Semantic structure:** Use clear headings, tables, and lists for AI parsing.

---

*Last updated: May 5, 2026*

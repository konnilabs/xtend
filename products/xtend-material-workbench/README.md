# XTend Material Workbench

The XTM-12 Catfooding product turns XTend Material browser, performance and lesson evidence into a small internal operations app. It is intentionally a real RMT/Maraca product rather than a component gallery.

```bash
npm run plan
npm run build
npm run tune
npm test
```

The product started from the XTM-09 Material app scaffold contract. Its build remains air-gapped, uses explicit RMT/CSS sources, disables Preflight and authors layout exclusively through semantic `xtm-*` recipes. RMT owns filter, validation, confirmation transition and feedback state; the direct-browser site is the Browser Hypervisor evidence projection and installs a concrete enterprise-light product theme through the public XTend token contract. The committed tune config is checked against all 12 Maraca candidates by the root XTM-12 gate.

The evidence projection has its own blocking visual contract. It verifies the computed color scheme, page surface, usable primary width, overflow and effective viewport, keeps confirmation closed until the declarative `commandfor` action is used, and fails the Browser Hypervisor when system-color fallbacks or cropped captures reappear. The compact headless evidence uses Chromium's real 500 CSS px minimum instead of labelling a cropped 500 px layout as 390 px. It does not add a Tailwind browser runtime or private DOM integration.

`site/runtime.html` is the isolated production-runtime surface. Its tracked host module boots the built `dist/xtend.maraca.mjs` artifact eagerly and the Catfooding gate requires active orchestration plus all 15 materialized RMT surfaces. Keeping this runtime surface separate prevents generated evidence components from replacing the intentionally composed Browser Hypervisor dashboard.

The HTML evidence projection intentionally does not expose `window.__XTEND_DEV_API__`; it is not an XTend runtime and must appear as uninstrumented in XTend DevTools. The runtime diagnostics host installs the complete synchronous `xtend.devsurface.dev-api.v1` contract after Maraca boot. Its Performance, Fabric, Kernel and Hydration methods read fresh, JSON-serializable snapshots from the owning browser and Maraca controllers.

The flat materialized RMT surface graph is an orchestration boundary, not a second authored app layout. It remains connected inside an inert one-pixel mount so component lifecycle, telemetry and DEV API snapshots stay real. The visible runtime page presents a composed diagnostics dashboard populated from actual boot state and never reaches into component shadow roots to cosmetically rearrange independent surfaces.

The evidence shell uses a tracked hash-navigation host for `#evidence`, `#lessons` and `#settings`. It restores the active item on both hash transitions and direct reloads. The workspace is viewport-bounded and delegates scrolling exclusively to the primary slot, keeping desktop navigation and detail surfaces visible during anchor jumps. The browser gate measures the rendered navigation rectangle after every direct route load rather than accepting DOM presence alone. Runtime diagnostics open in a separate browsing context and repeat the complete product navigation.

Catfooding decisions live in `src/data/lessons.json`. There are no undecided or unowned upstream lessons and no app-local monkeypatches.

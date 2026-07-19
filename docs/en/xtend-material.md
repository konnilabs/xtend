# XTend Material

Build calm, accessible application shells with XTend components, RMT and an optional local Tailwind compiler.

Contract schema: `xtend.material.design-kit.v1`  
Support status: `supported-opt-in`

## Start here

XTend Material is a design kit for dashboards, administration tools, content applications, settings screens and small utility products. It gives these applications a consistent surface hierarchy, spacing system, typography and responsive shell without creating another component framework.

Three layers work together:

1. XTend components own behavior, keyboard interaction, accessibility, slots and public CSS parts.
2. RMT owns application state, actions, validation, transitions and surface orchestration.
3. XTend Material owns visual composition through semantic classes such as `xtm-app-shell`, `xtm-dashboard` and `xtm-form-flow`.

Tailwind CSS is an implementation tool behind the Maraca CSS provider. It runs locally during the build and never becomes a browser dependency. Application code should use `xtm-*` names instead of Tailwind utility lists.

XTend Material is not Angular Material, Material Web or a claim of complete Google Material Design parity. The name describes XTend's own neutral design language for everyday product surfaces.

## When to choose it

Choose XTend Material when you want an RMT-first Maraca application with a useful default presentation and you do not need a product-specific visual language on day one. It is a particularly good fit for internal dashboards, operational tools and rapidly deployed utilities.

Keep an existing design system when the product already has carefully tailored brand rules or specialized layout behavior. Choose plain XTend components when you need component behavior but want to author every visual decision yourself. The design kit is optional: installing XTend or Maraca does not activate it.

The current support status means the documented package exports, recipes, themes, density modes, native fallback and Maraca provider are supported when explicitly selected. It does not change the default CSS provider for other applications.

## Create your first app

You need Node.js 24 or newer and a local XTend checkout or installed XTend packages. With the default `--server both`, the scaffold command creates twelve artifacts: RMT source, Tailwind input, typed browser and Node AppServices, a PHP callable registry, strict TypeScript config, HTML/runtime hosts, the DEV API bridge, Maraca config, package metadata, and a smoke test. Use `--server none`, `node`, or `php` to omit unneeded backend targets.

```bash
xt create app --runtime maraca --design-kit material --name operations-console --out operations-console --write
cd operations-console
npm install
npm run plan
npm run serve
npm test
```

The generated package uses `@xtend-material/core`, `@xtend-material/maraca-tailwind`, `@ccslabs/xtend-maraca` and the XTend CLI. The generated `maraca.config.json` declares every CSS source explicitly, disables Tailwind Preflight and blocks provider fallback:

```json
{
  "schema": "xtend.maraca.build-config.v1",
  "options": {
    "source": "src/app.rmt",
    "out": "dist",
    "css": "external",
    "cssProvider": "tailwind",
    "cssInput": "src/app.css",
    "cssSources": ["src/app.rmt", "src/app.css"],
    "cssPreflight": "disabled",
    "cssProviderFallback": "none"
  }
}
```

`npm run plan` is the fastest diagnostic step. It validates RMT and the source inventory without treating a browser as a compiler. `npm run serve` runs the deterministic Maraca build first, writes `dist/`, and then serves the generated `site/index.html` through the packaged `xt serve` command on `http://127.0.0.1:4173/`. Use `xt serve --help` to select another root, default document, host or port, or to run a bind-only `--check`. Opening ESM directly with a `file:` URL is not a supported deployment model.

## Author with semantic recipes

An RMT state can attach one stable Material class through `viewTemplate`. The class names express layout intent and stay readable during review:

```rmt
state operations.dashboard type object preserve {
  initial {
    id "operations-dashboard"
    title "Operations"
    viewTemplate { class "xtm-dashboard" }
  }
}
```

Do not replace that class with `grid gap-4 p-6 lg:grid-cols-3`. Raw utilities are private recipe implementation details. The source inventory rejects unknown classes, dynamic class construction, variants, slash modifiers and arbitrary values before Tailwind compilation.

The foundation vocabulary covers common layout and typography:

| Purpose | Recipes |
| --- | --- |
| Layout | `xtm-page`, `xtm-stack`, `xtm-stack-compact`, `xtm-cluster`, `xtm-grid` |
| Surfaces | `xtm-surface`, `xtm-card`, `xtm-toolbar` |
| Typography | `xtm-title`, `xtm-heading`, `xtm-body`, `xtm-muted` |
| Actions | `xtm-actions`, `xtm-primary-action` |

Composite shell recipes describe stable application regions:

| Recipe | Use it for | Typical XTend components |
| --- | --- | --- |
| `xtm-app-shell` | complete application frame | `x-surface-manager`, `x-header`, `x-router`, `x-drawer` |
| `xtm-top-app-bar` | title and global actions | `x-header`, `x-button`, `x-icon` |
| `xtm-workspace` | navigation, primary and detail regions | `x-surface-region`, `x-section`, `x-side-panel` |
| `xtm-navigation-rail` | responsive application navigation | `x-drawer`, `x-menu` |
| `xtm-detail-pane` | contextual details | `x-side-panel`, `x-section` |

Flow recipes compose familiar product tasks:

| Recipe | Use it for |
| --- | --- |
| `xtm-form-flow` | labeled controls, validation status and actions |
| `xtm-feedback-stack` | persistent status, progress and transient feedback |
| `xtm-dashboard` | summaries, metrics and supporting content |
| `xtm-content-page` | article-like pages with header, body and aside |
| `xtm-settings-page` | grouped preferences and save actions |
| `xtm-empty-state` | an empty result with a useful next action |
| `xtm-confirmation-flow` | a confirmation surface coordinated by RMT |

Recipes do not create interaction behavior. An `xtm-form-flow` still needs `x-form`, suitable controls and an RMT validation declaration. An `xtm-confirmation-flow` still needs dialog semantics, focus restoration and an RMT action or transition. This ownership line prevents visual CSS from becoming an inaccessible behavior layer.

## Tokens, themes and density

`--xtend-*` custom properties are the only productive token source. XTend Material maps its recipes to those tokens and does not introduce an independent palette. Load both public stylesheets when you use the native path or a host CSS pipeline:

```css
@import "@xtend-material/core/tokens.css";
@import "@xtend-material/core/styles.css";
```

Select a presentation pack and density on a stable application ancestor:

```html
<html data-theme="light" data-material-pack="enterprise" data-density="comfortable">
```

`enterprise` with `comfortable` density is the durable general-purpose combination. `utility` with `compact` density suits focused tools with frequent actions. `dense` is available for information-heavy expert interfaces; it must not remove target size, visible focus or readable labels.

Theme changes remain owned by `x-theme`. The supported theme intentions are light, dark, high contrast and forced colors. Recipes use token fallback chains and reduced-motion rules, so a theme switch does not require regenerating RMT or constructing new class names.

Override semantic XTend tokens at the product boundary when branding is required:

```css
:root {
  --xtend-surface-page: #f6f8fb;
  --xtend-surface-panel: #ffffff;
  --xtend-text-primary: #172033;
  --xtend-focus-ring: #155eef;
}
```

Do not edit generated Tailwind CSS and do not depend on private recipe utility expansion. A token override survives the native provider exit path; a copied generated selector does not.

## Build, tune and inspect

Use the normal Maraca lifecycle. Production applications should tune after the source topology and routes are representative:

```bash
xt maraca plan --config maraca.config.json --json
xt maraca build --config maraca.config.json --json
xt maraca tune src/app.rmt --config maraca.tuned.config.json --out dist --write --json
```

Tune evaluates the supported profile, lazy-loading and CSS-output combinations while locking semantic options such as the CSS provider, source list, validation and transitions. Commit the generated tune config and use `--check` in regression runs. A tune result is specific to the application source; copying another product's selected combination is not equivalent evidence.

Inspect `xtend.maraca.report.json` for the provider identity, explicit source inventory, toolchain versions, output fingerprint and supply-chain evidence. A healthy Material build reports no network access, no temporary compiler files, disabled Preflight and zero Tailwind runtime bytes.

## Supported syntax and boundaries

The RMT authoring contract accepts static, quoted `xtm-*` class names known to the recipe registry. It intentionally rejects:

- raw utilities such as `flex`, `p-4` or `grid-cols-3`;
- variants such as `hover:`, `dark:` or responsive prefixes;
- arbitrary values such as `w-[37rem]`;
- slash modifiers and opacity shortcuts;
- string interpolation or classes assembled at runtime;
- executable Tailwind configuration and third-party Tailwind plugins;
- automatic monorepo source discovery;
- browser imports from `tailwindcss` or `@tailwindcss/node`.

If a product needs a reusable visual pattern that the registry lacks, first compose existing recipes and components. Add a design-kit recipe only when the pattern is general, has token, responsive, accessibility and native-fallback behavior, and can be supported as public vocabulary. Product-specific brand styling normally belongs in the product token layer.

## Compatibility

| Area | Supported contract |
| --- | --- |
| Node.js | 24 or newer |
| Tailwind CSS | exact reviewed baseline `4.3.2` |
| XTend Material | `@xtend-material/core` `0.1.x` |
| Maraca adapter | `@xtend-material/maraca-tailwind` `0.1.x` |
| XTend / Maraca peers | `^0.5.0` |
| Browser Tailwind runtime | not supported |
| Tailwind Preflight | disabled |
| Native CSS provider exit | supported |
| Angular Material or Material Web APIs | not compatible APIs |

Version `0.1.x` means the package is usable through the documented surface while recipe additions and pre-1.0 refinements may continue. Removing or changing a documented recipe, export or behavior requires a minor version with migration notes during the pre-1.0 line. Patch versions are reserved for compatible fixes and documentation corrections.

## Troubleshooting

**The plan reports an unknown Material class.** Check spelling and compare the class with the tables above. Do not add the class to a Tailwind safelist; either use a public recipe or propose an owned recipe with a native fallback.

**The adapter cannot be resolved.** Install `@xtend-material/maraca-tailwind` beside the application and confirm that the configured provider is `tailwind`. The framework does not silently download or substitute the adapter.

**A class is present in RMT but no CSS is generated.** Confirm that the RMT and CSS paths are both listed under `cssSources`, that the paths remain inside the project root and that `src/app.css` imports Tailwind theme and utilities layers.

**Controls look unstyled or behave incorrectly.** Material recipes do not replace component registration. Verify that the RMT surface references a known XTend component and read that component's public attributes, slots and events. Never reach into a component shadow root to repair presentation.

**The application needs a custom brand.** Override semantic `--xtend-*` tokens. Keep layout recipes where their structure still fits; replace a recipe only when the product has a genuinely different composition.

**You need to remove Tailwind.** Follow the bidirectional [XTend Material migration guide](./xtend-material-migration.md). The same semantic classes can use the public native stylesheet without changing RMT business records.

## Next steps

- [Migrate to or from XTend Material](./xtend-material-migration.md)
- [Understand XTend Maraca](./xtend-maraca.md)
- [Author RMT applications](./rmt-vnext-authoring.md)
- [Customize design tokens](./design-tokens.md)
- [Browse XTend components](./components.md)

# XTend Material Migration

Move an existing Maraca shell to semantic Material recipes, or remove the Tailwind provider without changing application behavior.

Migration contract: `xtend.material.migration.v1`

## Choose a direction

This guide covers two independent changes:

- **Adopt the design kit:** replace handwritten shell and flow layout CSS with public `xtm-*` recipes, then compile those recipes through the local Maraca Tailwind provider.
- **Return to native CSS:** keep the semantic recipes and RMT business records, remove the Tailwind adapter, and load the native stylesheet from `@xtend-material/core`.

Neither direction requires changing component APIs, state identifiers, selectors, actions, validation records or transition records. Treat a behavioral change during this migration as a separate application change and review it independently.

Before editing, make sure the current application builds and record its bundle report, CSS byte count and representative browser screenshots. A migration is easier to review when layout changes are not mixed with unrelated feature work.

## Inventory the existing shell

Start with an ownership inventory. For each handwritten selector, write down its purpose, the component or RMT surface that uses it, and whether it controls visual composition or behavior.

```text
.app-shell          complete page frame
.app-header         global header layout
.sidebar            application navigation
.content-grid       dashboard content layout
.profile-form       field and action layout
.save-message       status presentation
```

Move only visual composition to Material recipes. Keep component-owned focus, validation, dialog, keyboard and live-region behavior on the component or in RMT. Remove any workaround that accesses a component shadow root instead of translating it.

A common first mapping is:

| Existing selector | Material recipe | Review note |
| --- | --- | --- |
| `.app-shell` | `xtm-app-shell` | requires clear banner, navigation and main regions |
| `.app-header` | `xtm-top-app-bar` | header behavior still belongs to `x-header` |
| `.sidebar` | `xtm-navigation-rail` | responsive drawer behavior belongs to navigation components |
| `.workspace` | `xtm-workspace` | preserve source order for compact layouts |
| `.content-grid` | `xtm-dashboard` or `xtm-grid` | choose flow intent, not visual similarity alone |
| `.profile-form` | `xtm-form-flow` | RMT validation remains required |
| `.save-message` | `xtm-feedback-stack` | use component-owned status semantics |

Do not map a selector merely because the screenshots look similar. Read the recipe's slot, responsive and accessibility intent in the [XTend Material guide](./xtend-material.md).

## Adopt XTend Material

### 1. Add packages

Install exact compatible package lines. Keep the lockfile in the same change.

```bash
npm install @xtend-material/core@0.1 @xtend-material/maraca-tailwind@0.1 @ccslabs/xtend-maraca@^0.3.1
```

Tailwind is already a package dependency of the design kit and adapter. Do not add a browser script, CDN stylesheet, `npx` build step or a second Tailwind configuration.

### 2. Add the owned CSS input

Create `src/app.css`:

```css
@layer theme, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
```

Preflight is intentionally absent. Existing XTend component and theme baselines continue to own element normalization.

### 3. Configure Maraca

Add the CSS provider settings to the existing build config. Preserve existing orchestration, kernel, hydration, validation and transition options.

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

Explicit `cssSources` make review and air-gapped compilation deterministic. Do not use automatic source discovery to compensate for missing paths.

### 4. Replace selectors one region at a time

Begin with the outer shell, then navigation, primary content and flows. Keep each intermediate revision buildable.

Before:

```rmt
state app.shell type object preserve {
  initial {
    id "app-shell"
    viewTemplate { class "app-shell" }
  }
}
```

After:

```rmt
state app.shell type object preserve {
  initial {
    id "app-shell"
    viewTemplate { class "xtm-app-shell" }
  }
}
```

The state ID and every business record remain unchanged. Repeat this replacement for classes with a clear public recipe. Keep brand-specific token overrides in a small product stylesheet rather than copying generated recipe selectors.

### 5. Remove superseded CSS

Delete a legacy selector only after every consumer has moved and the browser check is green. Retain application CSS that represents genuine product identity, content-specific typography or a layout without a public recipe. The goal is clear ownership, not zero application CSS.

Run a text search before removal:

```bash
rg -n "app-shell|app-header|sidebar|content-grid|profile-form|save-message" src site tests
```

### 6. Plan, build and tune

```bash
xt maraca plan --config maraca.config.json --json
xt maraca build --config maraca.config.json --json
xt maraca tune src/app.rmt --config maraca.tuned.config.json --out dist --write --json
```

Resolve inventory diagnostics at the source. A safelist or raw utility escape hatch hides an ownership problem and is not part of the supported migration.

### 7. Verify user-visible behavior

Check at least one desktop and one compact viewport. Exercise keyboard order, visible focus, validation, dialog open/close and focus restore, status announcements, dark theme, forced colors and reduced motion. Compare the new CSS bytes and Maraca report with the recorded baseline.

The migration is complete when every remaining application selector has an explicit product reason and every new `xtm-*` class is recognized by the source inventory.

## Return to the native provider

The exit path is intentionally smaller than adoption. It proves that Tailwind is not an application runtime or a business-logic dependency.

### 1. Keep semantic classes

Do not rewrite `xtm-app-shell`, `xtm-dashboard` or other public recipes. `@xtend-material/core/styles.css` implements the same semantic surface as a native fallback.

### 2. Load public native styles

Import the token bridge and native stylesheet through the host CSS pipeline:

```css
@import "@xtend-material/core/tokens.css";
@import "@xtend-material/core/styles.css";
```

### 3. Remove Tailwind provider options

Remove `cssProvider: "tailwind"`, `cssInput`, `cssSources`, `cssPreflight` and the Tailwind-specific fallback setting from the Maraca config. Select the normal native CSS path used by the host. Keep all unrelated build and orchestration settings.

### 4. Remove the adapter

```bash
npm uninstall @xtend-material/maraca-tailwind
```

Keep `@xtend-material/core` because it owns the recipe metadata, tokens and native stylesheet. Remove a direct `tailwindcss` dependency only when no other local build tool uses it.

### 5. Prove parity

Build again and compare the RMT source fingerprint, selected components, actions, validation and transition records. Those records must be identical. CSS fingerprints will differ because the compiler path changed; semantic class coverage and browser behavior must remain intact.

```bash
xt maraca plan --config maraca.config.json --json
xt maraca build --config maraca.config.json --json
```

The browser bundle must contain no Tailwind runtime code before or after the migration.

## Rollback strategy

Keep package, config, RMT class replacements and legacy CSS removal in reviewable commits. If visual verification fails, restore the last region's legacy selector and RMT class while keeping already verified regions. Do not create a hybrid selector that combines copied Tailwind output with legacy CSS; it has no stable owner and makes the later native exit unreliable.

If the provider itself fails, return to the native provider as described above. Do not silently enable network access or swap in an unreviewed Tailwind version.

## Common migration failures

**A raw Tailwind class appears in RMT.** Replace it with a public recipe. If no recipe expresses the intent, keep a product-owned semantic class until a reusable contract exists.

**A dialog looks correct but keyboard behavior regressed.** Restore component and RMT ownership. Material may style the confirmation flow, but dialog focus containment, Escape and focus restoration are not CSS responsibilities.

**Compact layout overflows.** Check semantic source order and recipe slots before adding a breakpoint. Shell recipes intentionally degrade navigation and detail regions; manual fixed widths often defeat that behavior.

**The native exit changes business records.** Stop and revert those RMT edits. Provider migration should only affect CSS configuration and package dependencies.

**Generated CSS was edited by hand.** Move the intended brand change to a `--xtend-*` token or a product-owned semantic selector, regenerate the output and discard the edited artifact.

## Migration checklist

- [ ] Baseline build report, CSS bytes and browser screenshots are recorded.
- [ ] Legacy selectors have purpose and ownership notes.
- [ ] Packages and lockfile use compatible exact lines.
- [ ] Maraca sources are explicit and Preflight is disabled.
- [ ] RMT contains only known static `xtm-*` classes.
- [ ] Component behavior and RMT business records are unchanged.
- [ ] Product token overrides are separate from generated CSS.
- [ ] Desktop, compact, keyboard, theme and accessibility checks pass.
- [ ] Tune output belongs to the migrated source.
- [ ] The native-provider return path has been exercised.

## Related guides

- [XTend Material](./xtend-material.md)
- [XTend Maraca](./xtend-maraca.md)
- [Design tokens](./design-tokens.md)
- [RMT authoring](./rmt-vnext-authoring.md)

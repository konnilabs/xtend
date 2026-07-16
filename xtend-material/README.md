# XTend Material Core

**English (primary)** | [Deutsch](#deutsch)

<a id="english"></a>

## English

`@xtend-material/core` is the CSS-and-metadata foundation for modern, minimal and enterprise-ready XTend application shells. It provides a calm surface hierarchy, compact typography, adaptive density, accessible motion and semantic `xtm-*` authoring classes. It does not register custom elements and it does not ship a Tailwind browser runtime. Existing XTend components remain responsible for behavior, accessibility, slots and parts.

Support status is `supported-opt-in`: activate the design kit explicitly for an application. It does not change XTend or Maraca defaults. See [CHANGELOG.md](./CHANGELOG.md) for the supported `0.1.x` surface.

Install the package together with the XTend stack:

```bash
npm install @xtend-material/core @ccslabs/xtend
```

The primary API is intentionally small. `createXtendMaterialDesignKit` returns the introspectable product contract, `createMaterialRecipeRegistry` exposes the single canonical foundation-recipe registry, and `createMaterialMaracaPreset` provides build defaults without mutating Maraca. Every recipe includes slots, compatible native or XTend components, token dependencies, private utility expansion, responsive degradation, accessibility behavior and a native-CSS fallback.

```js
const {
  createMaterialMaracaPreset,
  createMaterialRecipeRegistry,
  createXtendMaterialDesignKit
} = require('@xtend-material/core');

const kit = createXtendMaterialDesignKit();
const recipes = createMaterialRecipeRegistry();
const preset = createMaterialMaracaPreset();
console.log(kit.schema, recipes.records.length, preset.cssProvider);
```

Load `@xtend-material/core/tokens.css` and `@xtend-material/core/styles.css` through the application CSS pipeline. The token stylesheet delegates productive values to `--xtend-*`; the style sheet is a native fallback and semantic presentation layer. Select the durable default with `data-material-pack="enterprise"` and `data-density="comfortable"`, or choose `utility` plus `compact` for focused tools. Light, dark, high-contrast and forced-colors remain runtime concerns of `x-theme`.

Verify the package contract and bilingual package documentation with:

```bash
node scripts/run_xtend_tests.js xtend-material-contract scoped-package-readmes --json
npm run test:scoped-package-readmes
```

The package includes five composite XTM-07 shell recipes and seven XTM-08 flow recipes for forms, feedback, dashboards, content, settings, empty states and confirmations. Validation and interactive state remain component/RMT behavior; DataGrid, autocomplete and command-palette parity are explicit non-claims. Tailwind 4.3.2 is pinned as a build-time dependency; utilities remain private implementation details.

The `./performance-contract` export provides the blocking `xtend.material.quality-policy.v1` budgets, report validator and anti-monkeypatching audit used by XTM-11. Browser Tailwind imports, private shadow-root access, platform prototype mutation and runtime style injection are rejected.

<a id="deutsch"></a>

## Deutsch

`@xtend-material/core` ist die CSS- und Metadaten-Basis für moderne, minimalistische und Enterprise-taugliche XTend App Shells. Das Paket liefert eine ruhige Flächenhierarchie, kompakte Typografie, adaptive Dichte, zugängliche Motion und semantische `xtm-*`-Authoring-Klassen. Es registriert keine Custom Elements und liefert keine Tailwind-Browser-Runtime aus. Bestehende XTend-Komponenten bleiben für Verhalten, Barrierefreiheit, Slots und Parts verantwortlich.

Der Supportstatus lautet `supported-opt-in`: Aktiviere das Design Kit ausdrücklich pro Anwendung. XTend- und Maraca-Defaults bleiben unverändert. Die unterstützte `0.1.x`-Oberfläche steht in [CHANGELOG.md](./CHANGELOG.md).

Installiere das Paket gemeinsam mit dem XTend Stack:

```bash
npm install @xtend-material/core @ccslabs/xtend
```

Die primäre API bleibt bewusst klein. `createXtendMaterialDesignKit` liefert den introspektierbaren Produktvertrag, `createMaterialRecipeRegistry` stellt die einzige kanonische Foundation-Recipe-Registry bereit und `createMaterialMaracaPreset` liefert Build-Vorgaben ohne Maraca zu verändern. Jedes Recipe beschreibt Slots, kompatible native oder XTend-Komponenten, Token-Abhängigkeiten, private Utility-Expansion, responsive Degradation, Accessibility-Verhalten und einen nativen CSS-Fallback.

```js
const {
  createMaterialMaracaPreset,
  createMaterialRecipeRegistry,
  createXtendMaterialDesignKit
} = require('@xtend-material/core');

const kit = createXtendMaterialDesignKit();
const recipes = createMaterialRecipeRegistry();
const preset = createMaterialMaracaPreset();
console.log(kit.schema, recipes.records.length, preset.cssProvider);
```

Lade `@xtend-material/core/tokens.css` und `@xtend-material/core/styles.css` über die CSS-Pipeline der Anwendung. Das Token-Stylesheet delegiert produktive Werte an `--xtend-*`; das Style Sheet bildet den nativen Fallback und die semantische Präsentationsschicht. Wähle den robusten Standard mit `data-material-pack="enterprise"` und `data-density="comfortable"` oder `utility` plus `compact` für fokussierte Werkzeuge. Light, Dark, High Contrast und Forced Colors bleiben Runtime-Aufgaben von `x-theme`.

Prüfe Package-Contract und zweisprachige Package-Dokumentation mit:

```bash
node scripts/run_xtend_tests.js xtend-material-contract scoped-package-readmes --json
npm run test:scoped-package-readmes
```

Das Paket enthält zusätzlich zum Foundation-Vokabular fünf zusammengesetzte XTM-07-Shell-Recipes und sieben XTM-08-Flow-Recipes für Formulare, Feedback, Dashboards, Content, Settings, Empty States und Bestätigungen. Validation und interaktive Zustände bleiben Component-/RMT-Verhalten; DataGrid-, Autocomplete- und Command-Palette-Parität sind explizite Nicht-Claims. Tailwind 4.3.2 ist als Build-Time-Dependency fest gepinnt; Utilities bleiben private Implementierungsdetails.

Der Export `./performance-contract` stellt die blockierenden Budgets aus `xtend.material.quality-policy.v1`, den Report-Validator und den XTM-11-Anti-Monkeypatching-Audit bereit. Tailwind-Imports im Browser, private Shadow-Root-Zugriffe, Plattform-Prototyp-Mutationen und Runtime-Style-Injection werden blockiert.

# XTend Material Design Kit Contract

- Status: `accepted-by-XTM-06`
- Datum: 2026-07-16
- Schema: `xtend.material.design-kit.v1`
- Recipe Schema: `xtend.material.recipe.v1`
- Recipe Registry: `xtend.material.recipe-registry.v1`
- Package: `@xtend-material/core`
- Owner: `CCS Labs (ccslabs)`
- Local Gate: `node scripts/run_xtend_tests.js xtend-material-contract scoped-package-readmes package-exports --json`

## Zweck

XTend Material Core ist die versionierte Design-Kit-Schicht für moderne, minimalistische und Enterprise-reife App Shells. Das Paket besitzt visuelle Prinzipien, semantische Foundation-Recipes, Styles, Token-Delegation und ein Maraca Preset. Es besitzt weder Component-Verhalten noch eine Custom-Element-Registry.

## Designprinzipien

| Prinzip | Produktregel |
|---------|--------------|
| Surface | Ruhige Flächen, feine Borders und zurückhaltende Elevation bilden die Hierarchie. |
| Hierarchy | Primäre Arbeitsinhalte dominieren; Shell-Chrome bleibt visuell leise. |
| Typography | Eine kompakte Skala, klare Headings und hohe Lesbarkeit tragen dichte Enterprise-Inhalte. |
| Shape | Konsistente XTend-Radien erzeugen kontrollierte Weichheit ohne dekorativen Überschuss. |
| Density | Comfortable, Compact und Dense verändern Raumnutzung, nicht Bedienbarkeit oder Semantik. |
| Motion | Motion erklärt Zustandswechsel und respektiert Reduced Motion. |
| Status | Status bleibt semantisch, fokussierbar und in Forced Colors verständlich. |

Das Erscheinungsbild wird nicht durch eine zweite Farbpalette erzeugt. Alle produktiven Werte stammen aus `--xtend-*`; `data-material-pack="enterprise"` und `data-material-pack="utility"` verändern lediglich Komposition, Hierarchie und Dichte.

## Recipe Contract

Jedes `xtend.material.recipe.v1` Recipe enthält:

- stabile `id`, `version`, `className`, Kategorie und Status;
- mindestens den erforderlichen Slot `root` mit semantischer Rolle;
- ausschließlich bekannte XTend-Komponenten oder native HTML-Tags;
- ausschließlich `--xtend-*` Token-Referenzen;
- eine geschlossene private Utility-Menge ohne arbitrary values oder Varianten;
- intrinsische Responsive-Strategie und definierte Degradation;
- Forced-Colors-, Reduced-Motion- und Focus-Angaben;
- nativen CSS-Fallback über `@xtend-material/core/styles.css`.

Die Foundation-Recipes werden durch die fünf in XTM-07 akzeptierten Shell-Recipes und die sieben in XTM-08 akzeptierten Flow-Recipes ergänzt. XTM-08 umfasst Form, Feedback, Dashboard, Content, Settings, Empty State und Confirmation. Validation und interaktive Zustände bleiben Component-/RMT-Verhalten; es entsteht keine zweite Recipe- oder Component-Wahrheit.

## Package Surface

| Export | Rolle |
|--------|-------|
| `@xtend-material/core` | Design-Kit-Contract, Validator und Metadaten |
| `@xtend-material/core/recipes` | kanonische Recipe Registry |
| `@xtend-material/core/shell-recipes` | typisierte XTM-07 Shell Composition |
| `@xtend-material/core/flow-recipes` | typisierte XTM-08 Form-, Feedback-, Dashboard- und Content-Composition |
| `@xtend-material/core/maraca-preset` | deklarative, mutationsfreie Maraca Defaults |
| `@xtend-material/core/tokens.css` | Delegation an XTend Token- und Theme-Verträge |
| `@xtend-material/core/styles.css` | native semantische Darstellung und Exit Path |

JavaScript-Exports sind introspektierbar und erzeugen keine DOM-Side-Effects. CSS registriert keine Komponenten und importiert keine Tailwind-Browser-Runtime.

## Kompatibilität

| Abhängigkeit | XTM-06 Baseline |
|--------------|-----------------|
| XTend | `^0.6.1` Peer |
| Tailwind CSS | `4.3.2` exakte Build-Time-Dependency |
| Node | `>=24` |
| CSS Provider | `xtend.maraca.css-provider.v1` |
| Token Bridge | `xtend.material.tailwind-token-bridge.v1` |
| Preflight | `disabled` |

## Grenzen

- keine `customElements.define()`-Aufrufe;
- keine zweite Component Registry oder Manifestkopie;
- keine freien Tailwind-Klassen in RMT oder Component APIs;
- keine Tailwind-Browser-Runtime, CDN- oder Network-Pflicht;
- kein Import in den RMT-Kernel;
- keine Behauptung vollständiger Google-Material-Parität.

## Verifikation

```bash
node scripts/run_xtend_tests.js xtend-material-contract scoped-package-readmes package-exports --json
npm pack --dry-run --workspace @xtend-material/core
```

Der Gate validiert Package Surface, Designprinzipien, alle Recipe-Felder, bekannte Component-Referenzen, XTend-Token-Namespace, sichere Utility-Mengen, native Fallbacks, TypeScript-Deklarationen, CSS-Boundaries und Pack-Inhalt.

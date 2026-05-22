# xtheme - XTend Core-Modul

## Uebersicht

`xtheme.js` ist das zentrale Theme-Management von XTend. Die Runtime wird unter `window.XTend.theme` bereitgestellt; `window.XTheme` bleibt als oeffentliche Kompatibilitaets-Fassade erhalten.

## Oeffentliche API

| Methode | Beschreibung |
|---------|--------------|
| `getCurrentTheme()` | liefert das aktive Theme |
| `getAvailableThemes()` | liefert alle bekannten Themes |
| `setTheme(themeName)` | schaltet auf ein Theme um |
| `toggleDarkMode()` | schaltet zwischen `light` und `dark` um |
| `registerTheme(name, properties)` | registriert oder erweitert ein Theme |
| `loadExternalTheme(name, cssUrl)` | laedt ein externes Theme-CSS |
| `removeExternalTheme(name)` | entfernt ein externes Theme-CSS |
| `set(name, value)` | Kompatibilitaets-Fassade fuer Theme oder CSS-Variable |
| `get(name)` | liest aktuelles Theme oder CSS-Variable |
| `subscribe(fn)` | registriert einen Listener fuer Theme-Aenderungen |
| `getDesignTokens(themeName?)` | liefert die zentralen XTend-Design-Tokens fuer ein Theme |
| `getDesignTokenContract()` | liefert den produktiven Contract `xtend.design-tokens.product-contract.v1` mit Theme Packs, Density Packs und CSS Parts |
| `setDensity(density)` | setzt die globale Density Boundary auf `compact`, `comfortable` oder `dense` |
| `getDensity()` | liefert die aktive Density |
| `getAvailableDensities()` | liefert alle unterstuetzten Density Presets |
| `getThemeContext()` | liefert den propagierten Theme-/Density-/Preference-Kontext |
| `snapshotPerformance()` | liefert den aktuellen Performance-/Fabric-Diagnostics-Snapshot |
| `getPerformanceProfile()` | liefert das Performance Profile `xtend.performance.component-profile.v1` |
| `getRmtMetadata()` | liefert RMT Shell Authoring Metadata ohne RMT-Kernel-Kopplung |
| `getComponentNetworkContext()` | liefert den Component Network Provider Contract |
| `getA11yPreferences()` | liefert Reduced-Motion-, Forced-Colors- und Color-Scheme-Snapshot |
| `getMotionPreference()` | liefert `default` oder `reduced` |
| `getContrastPreference()` | liefert `normal` oder `forced-colors` |
| `getA11yProfile()` | liefert den Runtime-A11y-Provider-Contract |
| `getMotionContrastPolicy()` | liefert die Motion-/Contrast-Policy fuer Gates |

## `set(name, value)` Contract

```js
window.XTend.theme.setTheme('dark');
window.XTend.theme.set('light');
window.XTend.theme.set('--primary-color', '#0e4e81');
```

- `set('dark')` ist ein Alias fuer `setTheme('dark')`
- `set('--primary-color', '#0e4e81')` schreibt eine CSS-Variable in das aktuelle Theme

## Theme-Lifecycle

- das aktive Theme wird ueber `data-theme` auf `document.documentElement` gespiegelt
- Density wird ueber `data-xtend-density` auf `document.documentElement` gespiegelt
- Motion- und Contrast-Preferences werden ueber `data-xtend-motion`, `data-xtend-contrast` und `data-xtend-forced-colors` gespiegelt
- `document.documentElement.style.colorScheme` folgt dem aktiven Theme (`light`/`dark`)
- registrierte CSS-Variablen werden pro Theme verwaltet und beim Wechsel neu angewendet
- extern geladene Themes werden zwischengespeichert und spaeter beim Aktivieren erneut angewendet
- Theme-Aenderungen werden ueber `xstate` synchronisiert:
  - `theme`
  - `themes`
  - `xtend.theme.current`
  - `xtend.theme.density`
  - `xtend.theme.available`
  - `xtend.theme.preferences`
  - `xtend.theme.context`
  - `xtend.theme.performanceProfile`
  - `xtend.theme.performanceSnapshot`
  - `xtend.theme.rmtMetadata`
  - `xtend.theme.componentNetwork`
  - `xtend.theme.prefersReducedMotion`
  - `xtend.theme.forcedColors`
  - `xtend.a11y.motion`
  - `xtend.a11y.contrast`

## Zentrale XTend-Tokens

Die Default-Themes liefern produktive Basistokens fuer Core-Komponenten, unter anderem:

- `--xtend-color-primary`
- `--xtend-color-primary-dark`
- `--xtend-color-accent`
- `--xtend-glass-bg`
- `--xtend-glass-blur`
- `--xtend-shadow`
- `--xtend-border`
- `--xtend-radius`
- `--xtend-font-family`
- `--xtend-focus-outline`
- `--xtend-focus-outline-offset`
- `--xtend-surface`
- `--xtend-surface-muted`
- `--xtend-text`
- `--xtend-overlay-bg`
- `--xtend-motion-duration-fast`
- `--xtend-motion-duration-base`
- `--xtend-motion-scale`
- `--xtend-density-scale`
- `--xtend-density-spacing`
- `--xtend-control-height`
- `--xtend-font-scale`

Ab `WP-E12-12` sind diese Tokens Teil des Produktcontracts `xtend.design-tokens.product-contract.v1`. `getDesignTokenContract()` gibt Theme Packs (`light`, `dark`, `high-contrast`, `forced-colors`), Density Packs (`compact`, `comfortable`, `dense`) und stabile CSS Parts zurueck. Die separate Entwicklerdokumentation liegt in [Design Tokens](../design-tokens.md).

## Performance Profile und Density Boundary

`x-theme` ist ab `WP-E12-05` die zentrale Theme-, Preference- und Density Boundary fuer den Komponentenstack. Das Modul besitzt ein explizites Performance Profile:

- Schema: `xtend.performance.component-profile.v1`
- Lane: `user-blocking`
- Hydration Policy: `eager`
- Messpunkte: `xtend.theme.initialize`, `xtend.theme.apply`, `xtend.theme.propagate`, `xtend.theme.density` und `xtend.theme.external-css`
- Fabric Snapshot Path: `xtend.theme.performanceSnapshot`

Density wird als Provider-Kontext behandelt, nicht als lokale Komponenteneigenschaft. `setDensity('compact')`, `setDensity('comfortable')` und `setDensity('dense')` setzen `data-xtend-density` und die Tokens `--xtend-density-scale`, `--xtend-density-spacing`, `--xtend-control-height` und `--xtend-font-scale`. `spacious` ist kein produktiver Density-Name mehr und wird bei alten Persistenzdaten auf `comfortable` normalisiert.

Der propagierte Kontext liegt unter `xtend.theme.context` und nutzt das Schema `xtend.theme.context.v1`. Er enthaelt Theme, Density, A11y Preferences, aktive Tokens, Density Tokens, RMT Metadata, Fabric Lane und eine `propagationVersion`.

## RMT und Component Network

`x-theme` stellt RMT Shell Authoring Metadata bereit, ohne XTend in den RMT Kernel einzubetten:

- RMT Schema: `xtend.rmt.component-contract.v1`
- Adapter: `xtend.theme-provider`
- Shell Authoring Schema: `xtend.rmt.shell-authoring.component.v1`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

Der Component Network Contract nutzt `xtend.component.network.v1`. Verbraucher wie `xtend.component`, `xtend.xrouter`, `xtend.fabric-telemetry` oder `rmt.shell-authoring` lesen den publizierten Kontext ueber Events und `xstate`, nicht ueber harte Imports.

## Reduced Motion und Forced Colors

`x-theme` ist ab `WP-E12-04` die zentrale A11y-Preference-Boundary fuer den Komponentenstack. Das Modul beobachtet `prefers-reduced-motion: reduce`, `forced-colors: active` und `prefers-color-scheme: dark`, ohne XTendRMT oder Host-Frameworks zu importieren.

- Reduced Motion setzt `data-xtend-motion="reduced"` und reduziert zentrale Motion-Tokens auf `0ms`.
- Forced Colors setzt `data-xtend-contrast="forced-colors"` und `data-xtend-forced-colors="active"`.
- Die internen CSS-Regeln nutzen `forced-color-adjust: auto`, `Canvas`, `CanvasText`, `Highlight` und `HighlightText`.
- Bei System-Preference-Wechseln feuert `theme-preference-changed`.
- Eine unsichtbare Live-Region mit `role="status"` und `aria-live="polite"` meldet Theme- und Preference-Wechsel fuer Screenreader.
- Die Policy liegt als `xtend.a11y.motion-contrast-policy.v1` vor und wird ueber `getMotionContrastPolicy()` sichtbar.

## Events

| Event | Beschreibung |
|-------|--------------|
| `theme-initialized` | nach Initialisierung des Theme-Managers |
| `theme-changed` | nach Theme-Wechsel |
| `theme-variable-changed` | nach Anpassung einer CSS-Variable |
| `theme-preference-changed` | nach Reduced-Motion-, Forced-Colors- oder System-Preference-Wechsel |
| `theme-a11y-announcement` | nach Screenreader-Announcement fuer Theme- oder Preference-Wechsel |
| `theme-density-changed` | nach Density-Wechsel |
| `theme-context-changed` | nach Propagation eines neuen Theme-Kontexts |
| `theme-performance-measured` | nach lokaler Theme-/Density-/Propagation-Messung |

## Beispiel

```js
window.XTend.theme.setTheme('light');
window.XTend.theme.set('--body-bg', '#f9f9f9');

window.XTend.theme.registerTheme('dark', {
  '--body-bg': '#181a1b',
  '--text-color': '#fff'
});
```

## Hinweise

- `xtheme.js` ist ein Core-Modul, kein separates Styling-Framework.
- Die Runtime ist namespaced unter `window.XTend.theme`; `window.XTheme` ist nur die oeffentliche Kompatibilitaets-Fassade.
- Externe Theme-CSS-Dateien bleiben nach dem ersten Laden fuer spaetere Aktivierungen verfuegbar.

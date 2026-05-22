# Drittanbieter Design Authoring

Docs Contract: `xtend.enterprise.third-party-authoring-guide.v1`

Workpackage: `ECH-WP-11`

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js enterprise-third-party-authoring-guide --json
npm run test:enterprise-third-party-authoring-guide
```

Dieser Guide richtet sich an Teams, die XTend-Komponenten in ein eigenes Corporate Design, White-Label-Produkt oder internes Enterprise Designsystem einbinden wollen. Der Zielpfad ist: XTend bleibt optisch hochwertig und eigenstaendig, aber alle sichtbaren Entscheidungen laufen ueber XTend.css, XTheme, CSS Parts, Slots, Attribute oder Icon Packs. Forks von Komponenten sind kein regulaerer Skinning-Pfad.

## Prinzipien

1. Corporate Tokens zuerst definieren, dann Komponententokens ableiten.
2. XTend Signature UI als Qualitaetsbasis behalten, aber Markenfarbe, Typografie, Radius, Elevation und Dichte bewusst ersetzen.
3. Shadow-DOM-Interna nicht selektieren. Skinning passiert ueber CSS Custom Properties und `::part(...)`.
4. Light, Dark, High Contrast, Forced Colors, Reduced Motion, Comfortable, Compact und Dense sind Pflichtvarianten.
5. Controls verwenden `x-icon`, Inline-SVG oder tokenisierte CSS-Grafik, nie sichtbare Textzeichen.
6. Status, Active, Error, Disabled und Focus duerfen nicht nur ueber Farbe kommunizieren.

## XTend.css Override Patterns

Corporate Overrides gehoeren in eine eigene Cascade Layer. Dadurch bleiben Host-Tokens nachvollziehbar, und Produktteams koennen XTend-Updates einspielen, ohne Shadow-DOM-Regeln zu kopieren.

```css
@layer xtend-customer {
  :root {
    --acme-ink: #17231f;
    --acme-muted: #5f6b64;
    --acme-canvas: #f7f4ee;
    --acme-panel: #fffdf8;
    --acme-action: #0e6e8f;
    --acme-action-strong: #173f35;
    --acme-warm: #b56b35;
    --acme-edge: rgba(23, 35, 31, 0.22);
    --acme-radius-control: 0.35rem;
    --acme-radius-panel: 0.55rem;
    --acme-focus: 3px solid var(--acme-warm);
    --acme-font-body: "Aptos", "Segoe UI", system-ui, sans-serif;
    --acme-font-display: "Aptos Display", "Aptos", "Segoe UI", system-ui, sans-serif;
    --acme-font-code: "Cascadia Code", "SFMono-Regular", Consolas, monospace;

    --xtend-surface: var(--acme-canvas);
    --xtend-surface-muted: var(--acme-panel);
    --xtend-text: var(--acme-ink);
    --xtend-color-primary: var(--acme-action);
    --xtend-border-color: var(--acme-edge);
    --xtend-focus-outline: var(--acme-focus);
    --xtend-radius: var(--acme-radius-panel);
    --xtend-font-family: var(--acme-font-body);
    --xtend-font-family-body: var(--acme-font-body);
    --xtend-font-family-heading: var(--acme-font-display);
    --xtend-font-family-control: var(--acme-font-body);
    --xtend-font-family-code: var(--acme-font-code);
  }

  :root[data-theme="dark"] {
    --acme-ink: #f6f1e8;
    --acme-muted: #d4c9b8;
    --acme-canvas: #121916;
    --acme-panel: #1c2823;
    --acme-action: #8bd4e6;
    --acme-action-strong: #b56b35;
    --acme-edge: rgba(246, 241, 232, 0.2);
  }

  :root[data-theme="high-contrast"] {
    --acme-ink: #ffffff;
    --acme-muted: #ffffff;
    --acme-canvas: #000000;
    --acme-panel: #000000;
    --acme-action: #ffff00;
    --acme-action-strong: #ffffff;
    --acme-edge: #ffffff;
    --acme-focus: 3px solid #ffff00;
  }

  :root[data-theme="forced-colors"] {
    --acme-ink: CanvasText;
    --acme-muted: CanvasText;
    --acme-canvas: Canvas;
    --acme-panel: Canvas;
    --acme-action: Highlight;
    --acme-action-strong: Highlight;
    --acme-edge: CanvasText;
    --acme-focus: 2px solid Highlight;
  }
}
```

## XTheme Token Bridge

`x-theme` und `window.XTend.theme` sind der Runtime-Pfad fuer Theme-Wechsel, Density, Reduced Motion und Forced Colors. Ein Corporate Theme sollte dieselben Werte setzen wie XTend.css, damit statische CSS-Overrides und Runtime-Wechsel identisch bleiben.

```js
window.XTend.theme.registerTheme('acme-enterprise', {
  '--xtend-surface-page': '#f7f4ee',
  '--xtend-surface-panel': '#fffdf8',
  '--xtend-surface-raised': '#ffffff',
  '--xtend-text-primary': '#17231f',
  '--xtend-text-muted': '#5f6b64',
  '--xtend-color-action': '#0e6e8f',
  '--xtend-color-action-hover': '#173f35',
  '--xtend-text-on-action': '#fffaf0',
  '--xtend-border-subtle': 'rgba(23, 35, 31, 0.22)',
  '--xtend-radius-control': '0.35rem',
  '--xtend-radius-panel': '0.55rem',
  '--xtend-space-control-gap': '0.55rem',
  '--xtend-elevation-2': '0 14px 34px rgba(23, 35, 31, 0.14)',
  '--xtend-font-family-body': '"Aptos", "Segoe UI", system-ui, sans-serif',
  '--xtend-font-family-heading': '"Aptos Display", "Aptos", "Segoe UI", system-ui, sans-serif',
  '--xtend-header-surface': 'var(--xtend-surface-panel)',
  '--xtend-header-menu-surface': 'var(--xtend-surface-raised)',
  '--xtend-button-primary-surface': 'var(--xtend-color-action)',
  '--xtend-button-primary-text': 'var(--xtend-text-on-action)',
  '--xtend-menu-item-hover-surface': 'rgba(181, 107, 53, 0.14)',
  '--xtend-drawer-overlay-surface': 'rgba(23, 35, 31, 0.45)',
  '--xtend-modal-overlay-surface': 'rgba(23, 35, 31, 0.45)',
  '--xtend-icon-color': 'currentColor'
});

window.XTend.theme.setTheme('acme-enterprise');
window.XTend.theme.setDensity('compact');
```

Pflichtmodi:

| Modus | Regel |
|-------|-------|
| `light` | Text, Icons, Controls und Focus muessen auf hellen Flaechen lesbar bleiben |
| `dark` | keine hart gesetzten Light-Flaechen ohne dunklen Text-Fallback |
| `high-contrast` | aktive und fehlerhafte Zustaende brauchen Form, Border oder Marker |
| `forced-colors` | Systemfarben wie `Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `ButtonFace`, `ButtonText` verwenden |

Density-Presets:

| Density | Einsatz |
|---------|---------|
| `comfortable` | Default fuer gemischte Enterprise-Shells |
| `compact` | Toolbars, Datendichte, Workbench-Shells |
| `dense` | Navigation, Filterleisten, Tabellenumfelder |

## CSS Parts

CSS Parts sind Skinning API. Verwende sie fuer Zonen, nicht fuer private Shadow-DOM-Strukturen.

```css
@layer xtend-customer {
  x-header::part(root) {
    border-block-end: 1px solid var(--acme-edge);
  }

  x-header::part(menu-surface),
  x-drawer::part(surface),
  x-modal::part(surface),
  x-dialog::part(surface),
  x-popover::part(surface) {
    border: 1px solid var(--acme-edge);
    border-radius: var(--acme-radius-panel);
  }

  x-button::part(control),
  x-menu::part(item) {
    border-radius: var(--acme-radius-control);
  }

  x-icon::part(icon),
  x-header::part(trigger-icon) {
    color: currentColor;
  }
}
```

Regel: Ein `::part(...)` darf Corporate-Optik setzen, aber keine semantische Bedienbarkeit entfernen. Focus, Disabled, Busy, Active und Error muessen erhalten bleiben.

## Icon Pack Registrierung

Produkticons gehoeren in ein lokales Icon Pack. Remote-CDNs sind kein XTend-Default-Pfad.

```js
window.XTend.icons.register({
  id: 'acme',
  label: 'Acme Enterprise Icons',
  cdnAllowed: false,
  icons: {
    product: {
      aliases: ['brand-mark'],
      nodes: [
        { tag: 'path', attrs: { d: 'M12 3 21 8v8l-9 5-9-5V8Z' } }
      ]
    },
    command: {
      nodes: [
        { tag: 'path', attrs: { d: 'M5 7h14M5 12h14M5 17h14' } }
      ]
    }
  }
});
```

Controls brauchen ein echtes Button-Element, einen zugaenglichen Namen und getrennte Parts fuer Control und Icon. Sichtbare Zeichen wie `X`, `+`, `-`, `...` oder Emoji sind als Control-Grafik nicht erlaubt.

## Layout Modes

Layoutvarianten sind Public API. Host-Apps sollen Modi deklarativ setzen und per Token feinjustieren.

```html
<x-header
  menu-mode="side-panel"
  menu-placement="end"
  menu-modal
  menu-width="min(30rem, 92vw)"
  menu-max-height="calc(100dvh - 2rem)"
  menu-align="stretch">
  <span slot="title">Acme Operations</span>
  <x-link slot="nav" href="/overview" aria-current="page">Overview</x-link>
  <x-link slot="nav" href="/control-room">Control Room</x-link>
</x-header>
```

`x-header` unterstuetzt `drawer`, `side-panel`, `popover`, `fullscreen` und `inline-main`. Modale Varianten brauchen Escape, Focus Return und bei Focus Trap einen sichtbaren Backdrop. Nicht-modale Varianten duerfen den Hauptinhalt nicht aus dem Lesefluss nehmen.

Overlay-nahe Komponenten nutzen gemeinsame Skinning-Zonen:

| Komponente | Modi/Variante | Pflichtparts |
|------------|---------------|--------------|
| `x-drawer` | Drawer/Overlay | `surface`, `backdrop`, `close`, `content` |
| `x-side-panel` | docked, pinned, overlay, collapsed | `surface`, `backdrop`, `close`, `content` |
| `x-modal` | modal overlay | `surface`, `backdrop`, `close`, `content` |
| `x-dialog` | modal dialog | `surface`, `backdrop`, `close`, `content` |
| `x-popover` | non-modal oder `modal` | `surface`, `backdrop`, `close`, `content` |

## A11y-Dos and Donts

| Do | Dont |
|----|------|
| sichtbaren `focus-visible` Ring ueber Token erhalten | Fokus durch `outline: none` ohne Ersatz entfernen |
| `prefers-reduced-motion` bis in Overlay- und Feedback-Komponenten respektieren | Motion nur in Light Mode testen |
| `forced-colors` mit `Canvas`, `CanvasText`, `Highlight` und `HighlightText` pruefen | Markenfarben in Forced Colors erzwingen |
| Active, Selected, Error und Disabled nicht nur ueber Farbe darstellen | Status nur durch Rot/Gruen kommunizieren |
| Long Labels mit `overflow-wrap` und stabiler Control-Hoehe absichern | Text in Buttons, Tabs oder Menues clippen |
| Icon Controls mit `aria-label`, `part="... control"` und `part="... icon"` authoren | sichtbare Textglyphen als Close/Menu/Disclosure verwenden |

Status- und Routeninformationen muessen in jedem Theme lesbar bleiben und nicht nur ueber Farbe kommunizieren. Nutze Border, Marker, Unterstreichung, Icon, Text oder Form als zweites Signal.

## Vollstaendiges Fremdtheme-Beispiel

Dieses Beispiel kombiniert XTend.css, XTheme, CSS Parts, Icon Pack, Header Mode, Density und A11y-Modi. Es ist bewusst nicht blau-generisch: die Palette mischt Tinte, warmes Panel, kuehles Action-Blau, tiefes Gruen und Kupfer-Akzent.

```html
<html data-theme="light" data-xtend-density="compact">
  <head>
    <link rel="stylesheet" href="/xtend.css">
    <meta name="xtend-preload" content="x-theme,x-header,x-link,x-button,x-icon">
    <style>
      @layer xtend-customer {
        :root {
          --acme-ink: #17231f;
          --acme-canvas: #f7f4ee;
          --acme-panel: #fffdf8;
          --acme-action: #0e6e8f;
          --acme-action-strong: #173f35;
          --acme-warm: #b56b35;
          --acme-edge: rgba(23, 35, 31, 0.22);
          --acme-focus: 3px solid var(--acme-warm);
          --acme-font-body: "Aptos", "Segoe UI", system-ui, sans-serif;
          --acme-font-display: "Aptos Display", "Aptos", "Segoe UI", system-ui, sans-serif;

          --xtend-surface: var(--acme-canvas);
          --xtend-surface-muted: var(--acme-panel);
          --xtend-text: var(--acme-ink);
          --xtend-border-color: var(--acme-edge);
          --xtend-color-primary: var(--acme-action);
          --xtend-focus-outline: var(--acme-focus);
          --xtend-font-family-body: var(--acme-font-body);
          --xtend-font-family-heading: var(--acme-font-display);
          --xtend-header-surface: var(--acme-panel);
          --xtend-header-menu-surface: #ffffff;
          --xtend-header-menu-backdrop: rgba(23, 35, 31, 0.45);
          --xtend-button-primary-surface: var(--acme-action);
          --xtend-button-primary-text: #fffaf0;
          --xtend-menu-item-hover-surface: rgba(181, 107, 53, 0.14);
          --xtend-nav-current-indicator: var(--acme-warm);
          --xtend-overlay-surface: #ffffff;
          --xtend-overlay-text: var(--acme-ink);
          --xtend-overlay-backdrop: rgba(23, 35, 31, 0.45);
        }

        :root[data-theme="dark"] {
          --acme-ink: #f6f1e8;
          --acme-canvas: #121916;
          --acme-panel: #1c2823;
          --acme-action: #8bd4e6;
          --acme-action-strong: #b56b35;
          --acme-edge: rgba(246, 241, 232, 0.2);
          --xtend-button-primary-text: #121916;
        }

        :root[data-theme="forced-colors"] {
          --acme-ink: CanvasText;
          --acme-canvas: Canvas;
          --acme-panel: Canvas;
          --acme-action: Highlight;
          --acme-action-strong: Highlight;
          --acme-warm: Highlight;
          --acme-edge: CanvasText;
          --xtend-button-primary-text: HighlightText;
          --xtend-overlay-backdrop: Canvas;
        }

        @media (prefers-reduced-motion: reduce) {
          :root {
            --xtend-motion-duration-fast: 0ms;
            --xtend-motion-duration-base: 0ms;
          }
        }

        x-header::part(root),
        x-modal::part(surface),
        x-drawer::part(surface) {
          border: 1px solid var(--acme-edge);
        }

        x-header::part(trigger-icon),
        x-button::part(icon),
        x-menu::part(disclosure-icon) {
          color: currentColor;
        }
      }
    </style>
    <script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
  </head>
  <body>
    <x-header menu-mode="side-panel" menu-placement="end" menu-modal>
      <span slot="title">Acme Operations</span>
      <x-link slot="nav" href="/overview" aria-current="page">Overview</x-link>
      <x-link slot="nav" href="/reports">Reports</x-link>
      <x-button slot="actions" variant="primary">
        <x-icon pack="acme" name="command" decorative></x-icon>
        Command
      </x-button>
    </x-header>
  </body>
</html>
```

## P0 Token-/Part-Referenz

Jede P0-Komponente muss in diesem Guide eine Token-/Part-Referenz haben. Die Detailtabellen bleiben in den Komponentendokumenten, damit sie neben Attributen, Slots, Events und A11y-Regeln gepflegt werden.

| Komponente | Doku | Alias Prefix | Token-/Part-Tabelle | Pflichtparts |
|------------|------|--------------|---------------------|--------------|
| `x-theme` | [xtheme](./components/xtheme.md) | `--xtend-theme-` | `Zentrale XTend-Tokens` / [Design Tokens](./design-tokens.md) | `root` |
| `x-header` | [xheader](./components/xheader.md) | `--xtend-header-` | `ECH-WP-07 Token-Tabelle und signatureDesign`, `ECH-WP-09 Token-Tabelle und Navigation States` | `root`, `brand`, `trigger`, `trigger-icon`, `menu`, `menu-surface`, `backdrop` |
| `x-icon` | [xicon](./components/xicon.md) | `--xtend-icon-` | `Styling & Theming`, `ECH-WP-04 Control-Regel` | `root`, `control`, `icon` |
| `x-button` | [xbutton](./components/xbutton.md) | `--xtend-button-` | `Styling & Theming` | `root`, `control`, `label`, `icon` |
| `x-menu` | [xmenu](./components/xmenu.md) | `--xtend-menu-` | `ECH-WP-09 Token-Tabelle und Navigation States` | `root`, `nav`, `item`, `disclosure-icon` |
| `x-drawer` | [xdrawer](./components/xdrawer.md) | `--xtend-drawer-` | `ECH-WP-06 Overlay-Paritaet` | `root`, `surface`, `backdrop`, `close`, `content` |
| `x-side-panel` | [xsidepanel](./components/xsidepanel.md) | `--xtend-side-panel-` | `ECH-WP-06 Overlay-Paritaet` | `root`, `surface`, `backdrop`, `close`, `content` |
| `x-modal` | [xmodal](./components/xmodal.md) | `--xtend-modal-` | `ECH-WP-06 Overlay-Paritaet` | `root`, `surface`, `backdrop`, `close`, `content` |
| `x-dialog` | [xdialog](./components/xdialog.md) | `--xtend-dialog-` | `ECH-WP-06 Overlay-Paritaet` | `root`, `surface`, `backdrop`, `close`, `content` |
| `x-popover` | [xpopover](./components/xpopover.md) | `--xtend-popover-` | `ECH-WP-06 Overlay-Paritaet` | `root`, `surface`, `backdrop`, `close`, `content` |
| `x-toast` | [xtoast](./components/xtoast.md) | `--xtend-toast-` | `Styling & Theming` | `root`, `surface`, `content`, `close`, `icon` |

## Migration von Legacy Token-Namen

Legacy Tokens bleiben als Bridge sichtbar, sollen in neuen Corporate Themes aber auf die normalisierte Alias-Schicht gemappt werden.

| Legacy Token | Neuer Alias |
|--------------|-------------|
| `--xtend-glass-bg` | `--xtend-surface-overlay` |
| `--xtend-shadow` | `--xtend-elevation-2` |
| `--xtend-radius` | `--xtend-radius-md` |
| `--xtend-font-family` | `--xtend-font-family-body` |
| `--xtend-overlay-bg` | `--xtend-surface-overlay` |
| `--xtend-border-color` | `--xtend-border-subtle` |
| `--header-bg` | `--xtend-header-surface` |
| `--header-fg` | `--xtend-header-text` |
| `--drawer-bg` | `--xtend-drawer-surface` |
| `--drawer-color` | `--xtend-drawer-text` |
| `--button-text-color` | `--xtend-button-text` |

Migrationsregel: Alte Namen duerfen als Fallback bleiben, aber neue Dokumentation, neue Themes und neue Komponenten muessen die `--xtend-*` Alias-Kette fuehren. Entfernen oder Umbenennen von Public Parts und Tokens braucht Migration Notes.

## Abnahme fuer Corporate Themes

Vor der Uebergabe an ein Host-Designsystem sollten diese Gates laufen:

```bash
node scripts/run_xtend_tests.js enterprise-third-party-authoring-guide --json
node scripts/run_xtend_tests.js xtheme-token-alias-layer --json
node scripts/run_xtend_tests.js enterprise-component-style-audit --json
node scripts/run_xtend_tests.js enterprise-visual-dom-snapshot-matrix --json
node scripts/run_xtend_tests.js enterprise-component-flex-release-handoff --json
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
```

Die Abnahme ist erst belastbar, wenn Light, Dark, High Contrast, Forced Colors, Reduced Motion, Comfortable, Compact und Dense im selben Corporate Theme geprueft wurden.

## Release Handoff

Ab `ECH-WP-12` fuehrt [Enterprise Component Flex Release Handoff](./enterprise-component-flex-release-handoff.md) den Contract `xtend.enterprise.component-flex-release-handoff.v1`. Er verbindet SemVer-Bewertung, Deprecated Aliases, Migration Notes, Release Checklist und Adoption Risiken fuer Corporate Themes. Der lokale Gate `node scripts/run_xtend_tests.js enterprise-component-flex-release-handoff --json` muss vor Release Owner Review gruen sein; Publishing bleibt bis dahin durch `private-until-release-owner-acceptance` blockiert.

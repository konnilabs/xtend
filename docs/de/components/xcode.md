# xcode - XTend Komponente

> Siehe auch: [xwriter](./xwriter.md), [xstate](./xstate.md)

## Uebersicht

`<x-code>` rendert Codebeispiele als XTend Web Component mit Copy-Control,
State-Integration, Theming und optionalem Prism.js Syntax Highlighting. Die
Komponente ist Shadow-DOM-basiert und kann deshalb in jeder App- oder
Developer-Center-Surface eingesetzt werden, ohne dass globale `pre code`
Selektoren in den Host hineinreichen muessen.

Prism bleibt optional und host-neutral. Wenn `window.Prism` oder ein
registrierter XCode-Highlighter vorhanden ist, rendert XCode Token-Spans. Wenn
keine Grammatik verfuegbar ist, bleibt der Code sicher escaped als Plaintext
sichtbar.

## Verwendung

```html
<x-code lang="js">
  <template data-x-code-mode="text">console.log('Hallo XTend!');</template>
</x-code>
```

Das Alias-Attribut `language` ist fuer bestehende Fixtures und fremde Hosts
unterstuetzt:

```html
<x-code language="rmt">
  <template data-x-code-mode="text">template docs.demo { surface root { lane visible { hydrate page } } }</template>
</x-code>
```

## Prism und RMT

Das Developer Center laedt `components/prism.js` und danach
`components/prism-rmt.js`. Die RMT-Middleware registriert
`Prism.languages.rmt` sowie die Aliase `rmt-vnext` und `xtendrmt`. Damit kann
jede XCode-Instanz RMT-vNext-App-Shells, Primitives, Lanes, Events und
Boundary-Regeln highlighten:

- `template`, `state`, `selector`, `datasource`, `action`, `portal`,
  `overlay`, `resource`, `surface`, `remote surface`
- `lane`, Lifecycle-Operationen, `when`, `slot`, `trust boundary`, `sanitize`
- Event-Bindings, Payloads, Reducer, Effects, dotted Primitive IDs und
  Component-Tags

Hosts koennen einen eigenen Highlighter registrieren:

```js
customElements.get('x-code')?.registerHighlighter({
  highlight({ code, language }) {
    return { html: code, highlighted: false, engine: 'plain-text', language };
  }
});
```

## Developer Center

Markdown-Codefences aus Parsedown werden nach dem Trusted-DOM-Sanitizing in
`<x-code>` ueberfuehrt. Dadurch laufen alle Codeflaechen im Developer Center
ueber denselben Pfad:

- Copy-Control und A11y-Signale aus XCode
- `docs.syntax.highlight` als RMT-Schedule
- Prism-Highlighting im Shadow DOM
- Fallback auf Plaintext ohne Raw-HTML-Sink

## Attribute

| Attribut | Typ | Beschreibung |
| --- | --- | --- |
| `lang` | String | Primaere Sprache, z. B. `js`, `html`, `rmt` |
| `language` | String | Kompatibilitaetsalias, wenn `lang` nicht gesetzt ist |

## Events

| Event | Beschreibung |
| --- | --- |
| `code-copied` | Wird nach erfolgreichem Copy-Control ausgeloest |

## API

- `hydrate()` rendert Code und Highlighting neu.
- `snapshot()` liefert Sprache, Code-Laenge und Highlighting-Metadaten.
- `customElements.get('x-code').registerHighlighter(provider)` registriert
  einen optionalen Host-Highlighter.

Der Snapshot enthaelt nicht-brechend zusaetzlich:

- `highlighted`
- `highlightEngine`
- `highlightLanguage`
- `languageAlias`

## Layout Display Media UX Profil

`x-code` stellt das Profil
`xtend.component.layout-display-media-ux-profile.v1` bereit. Code-Bloecke
koennen damit als idle hydrierbare Display-Shell in RMT authoriert werden und
nutzen den State-Key `xcode-state-<id>`.

- Profil-Getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `component.idle.hydrate`
- Event: `code-copied`
- Snapshot: `snapshot()`
- CSS Parts: `root`, `copy`, `pre`, `code`

## Token-Tabelle

ECH-WP-07 bleibt als Tokenization-Contract sichtbar. `signatureDesign`:
Lesbare Enterprise-Codeflaeche mit klarem Copy-Control, internem Overflow,
Prism-kompatibler Token-Farbgebung und eigenstaendiger, themebarer
Monospace-Persoenlichkeit.

| Token | Zweck |
| --- | --- |
| `--xtend-layout-surface` | Code-Flaeche |
| `--xtend-layout-text` | Code-Textfarbe |
| `--xtend-layout-border-color` | Code- und Copy-Kante |
| `--xtend-layout-radius` | Code- und Copy-Radius |
| `--xtend-layout-elevation` | Code-Schatten |
| `--xtend-layout-spacing` | Code-Padding |
| `--xtend-layout-gap` | Theme-Abstand fuer Tooling |
| `--xtend-layout-font-family` | Monospace-/Code-Typografie |
| `--xtend-layout-font-size` | Code-Schriftgroesse |
| `--xtend-layout-media-radius` | Copy-Control-Radius |
| `--xtend-layout-focus-ring` | Copy-Control-Fokus |
| `--xtend-layout-grid-min` | Code-Layout-Untergrenze |
| `--xtend-layout-content-max` | Code-Maximalbreite |
| `--x-code-token-keyword` | Prism Keyword und RMT Primitive |
| `--x-code-token-string` | Prism String |
| `--x-code-token-property` | Prism Property und RMT IDs |
| `--x-code-token-class` | Component Tags |
| `--x-code-token-comment` | Kommentare |

## Fremdtheme

```css
[data-xtend-layout-theme="enterprise-foreign"] x-code {
  --xtend-layout-surface: #151b19;
  --xtend-layout-text: #f7f1e7;
  --xtend-layout-border-color: rgba(247, 241, 231, 0.18);
  --xtend-layout-radius: 0.35rem;
  --xtend-layout-elevation: 0 16px 40px rgba(21, 27, 25, 0.22);
  --xtend-layout-spacing: 1.25rem 1.4rem;
  --xtend-layout-gap: 0.75rem;
  --xtend-layout-font-family: "Cascadia Code", "Fira Mono", monospace;
  --xtend-layout-font-size: 0.95rem;
  --xtend-layout-media-radius: 999px;
  --xtend-layout-focus-ring: 3px solid #d48b57;
  --xtend-layout-grid-min: minmax(0, 1fr);
  --xtend-layout-content-max: 68rem;
}
```

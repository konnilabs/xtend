# RMT Component Template Primitives

- Contract: `xtend.epic18.rmt-component-template-primitives.v1`
- Fixture: `tests/fixtures/rmt-component-template-primitives.rmt`
- Runtime Basis: `xtendrmt/rmt-dom-descriptor-renderer.js`
- Local Gate: `node scripts/run_xtend_tests.js rmt-component-template-primitives --json`
- Workpackage: `WP-E18-06`
- Handoff: `WP-E18-07`

RMT kann XTend-Komponenten jetzt nativ komponieren, ohne dass Host-Apps
HTML-Strings zusammenbauen. Der Slice erweitert den DOM Descriptor Renderer um
component-nahe Primitives fuer App-Shells, Listen, Formulare, Tooltips, Icons,
leere Zustaende und Fehlerzustaende.

## Primitives

| Primitive | Zweck |
|-----------|-------|
| `component` | Loest eine Component-ID auf ein Custom Element wie `x-section`, `x-card`, `x-tooltip` oder beliebige Entwickler-Tags auf. |
| `props` | Setzt sichere DOM Properties und spiegelt primitive Werte als Attribute. |
| `attributes` | Setzt sichere Attribute ohne Inline-Event- oder URL-Sinks. |
| `parts` | Schreibt CSS Parts fuer themingfaehige Komponenten. |
| `slots` | Fuellt Slots mit Text, Templates, Komponenten oder Fragmenten. |
| `text` | Erzeugt Textknoten ueber `createTextNode`. |
| `when` | Rendert bedingte Teilbaeume. |
| `repeat` | Rendert Listen und nutzt `key` fuer stabile Knoten. |
| `empty` | Rendert einen expliziten leeren Zustand. |
| `fallback` | Rendert deklarative Ersatzinhalte. |
| `key` | Markiert wiederverwendbare Listenelemente mit `data-rmt-key`. |
| `ref` | Schreibt `data-rmt-ref` und legt die Elementreferenz in `refs` ab. |
| `class` | Mappt Klassen aus Strings, Arrays oder bedingten Objekten. |
| `style-token` | Spiegelt Design Tokens als `data-style-token-*` und `--xtend-*`. |

## Component-Familien

Die Fixture beweist generische Familien statt Produkt-Surfaces:
Icons, Tooltips, Form Controls (`x-input`, `x-select`, `x-checkbox`),
Navigation, Listen, Selection, Empty State, Error State und freie Custom
Elements. Die Komponenten bleiben Entwickler-definiert; RMT kennt nur
Descriptoren und Adapterfaehigkeiten.

## Component Capability Registry

Die vNext-Schicht fuehrt diese Primitives ueber
`xtendrmt/rmt-component-capability-registry.js` mit dem ganzen XTend-
Component-Stack zusammen. Die Registry normalisiert alle 44 public
Manifest-Eintraege, klassifiziert 40 renderbare UI-Komponenten und verbindet
Component Contracts, `xtendRmtMetadata`, `observedAttributes`, Events, Slots,
Parts, Form-State und Lazy Import mit den generischen DOM Descriptoren.

Damit bleiben `component`, `props`, `attributes`, `parts`, `slots`, `repeat`
und `key` dieselben Primitives, aber sie bekommen eine stack-weite
Kompatibilitaetsmatrix. Produktcode braucht keine Shadow-DOM-Patches, keine
privaten Component-Maps und keine komponentenspezifischen Renderer.

Details stehen in
[RMT vNext Component Primitives und XTend UI](./rmt-vnext-component-primitives.md).

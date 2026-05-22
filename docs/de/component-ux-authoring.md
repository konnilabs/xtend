# Component UX Authoring

Docs Contract: `xtend.docs.component-ux-authoring.v1`

Dieser Guide ist die kanonische Arbeitsanleitung fuer XTend-Komponentenautorinnen und -autoren nach `WP-E11-16`. Er uebersetzt die Epic-11-Vertraege in konkrete Regeln fuer neue und modernisierte Web Components.

## Grundsatz

Eine XTend-Komponente ist erst dann UX-reif, wenn ihre sichtbare Shell, ihr Styling, ihre A11y, ihre Performance, ihr Component Network, ihre RMT-Autorierbarkeit und ihre browsernahen Smokes zusammenpassen. Einzelne Komponenten duerfen klein bleiben, aber ihre Contracts muessen vollstaendig sein.

Die technische Boundary bleibt:

```text
no-rmt-kernel-import-of-xtend-types
```

RMT darf XTend-Komponenten schedulen, rendern und konfigurieren. Der RMT-Kernel importiert aber keine XTend-Klassen oder XTend-Typen.

## Pflichtcontracts

| Contract | Zweck | Gate |
| --- | --- | --- |
| `xtend.component.shell.v1` | Root, DOM-Modus, States, Slots, Parts, Focus und Lifecycle | `component-shell-contract` |
| `xtend.component.styling.v1` | Tokens, CSS Parts, Variants, Size, Density und Theme Bridges | `component-styling-contract` |
| `xtend.component.runtime-a11y.v1` | Keyboard, Focus, ARIA, Screenreader und High Contrast | `runtime-a11y-contract` |
| `xtend.component.ux-performance.v1` | Shell-, Hydration-, Render-, Event- und Interaction-Budgets | `component-ux-performance` |
| `xtend.component.network.v1` | Events, Commands, Form Association, Router Context und Feedback | `component-network-contract` |
| `xtend.rmt.shell-authoring.v1` | Shell, Style, A11y, Variants, Commands und Events in RMT | `rmt-shell-authoring-ux` |
| `xtend.epic11.component-lab-ux-inspector.v1` | Preview, RMT Inspector, State, A11y, Performance und Source Links | `component-lab-ux-inspector` |
| `xtend.epic11.component-ux-browser-smokes.v1` | reale UX-Journeys fuer priorisierte Familien | `component-ux-browser-smokes` |
| `xtend.epic11.component-shell-theme-matrix.v1` | Theme, Motion, Density, Viewport und Visual States | `component-shell-theme-matrix` |

## Authoring-Reihenfolge

1. Familie waehlen: `form-controls`, `feedback-status`, `navigation-routing`, `overlay-interaction` oder `layout-display-media`.
2. Shell Contract definieren: Root, Slots, States, Parts, Focus und Lifecycle festlegen.
3. Styling als API behandeln: Tokens, Parts, Variants, Size und Density dokumentieren.
4. A11y zuerst modellieren: Keyboard, Labels, ARIA, Live Regions, Focus Restore und Screenreader-Signale festlegen.
5. Performance-Profil setzen: Lane, Hydration Policy, kritische Messpunkte und Budgetklasse festlegen.
6. Component Network beschreiben: Events, Commands, Form Association, Router Context oder Feedback-Kanaele definieren.
7. RMT-Authoring ergaenzen: `xtend.component` Record, `dom_descriptor`, Schedules, Commands und Events pflegen.
8. Fabric-Kontext akzeptieren: Lane, Fiber und Telemetry ueber Adapterdaten aufnehmen.
9. Component Lab sichtbar machen: Preview, Docs, Types, Fixture, State, A11y und Performance verlinken.
10. Browser- und Theme-Matrix pruefen: lokale Smokes und Shell-Matrix laufen lassen.

## Familienregeln

| Familie | Minimum |
| --- | --- |
| Form Controls | Label, Help Text, Error Region, Required/Invalid, Form Association, Value Event, Keyboard Entry |
| Feedback/Status | Live Region, Role, Tone, Dismiss/Timeout, non-color Status, Reduced Motion |
| Navigation/Routing | Active State, `aria-current`, Keyboard Activation, Route Announcement, Focus Restore, Tablist ARIA und roving `tabindex` |
| Overlay/Interaction | Initial Focus, Focus Trap, Escape, Focus Restore, Scroll Lock, Reduced Motion |
| Layout/Display/Media | Responsive Slots, Stable Layout, Lazy/Visible Hydration, Media Shell, Code/Display Semantics |

## Theme Matrix

Jede priorisierte Shell muss in der Component Shell Theme Matrix darstellbar bleiben:

- Themes: `light`, `dark`, `high-contrast`, `forced-colors`
- Motion: `default-motion`, `reduced-motion`
- Density: `comfortable`, `compact`, `dense`
- Viewports: `desktop-1280`, `tablet-768`, `mobile-390`

Der Gate prueft aktuell `360` Shell-Kombinationen:

Seit `WP-E12-03` ist `x-tabs` Teil der Navigation/Routing-Matrix und muss Arrow-Key, `Home`, `End`, `aria-controls`, `role=tabpanel`, `aria-selected` und sichtbaren Fokus in Browser-Smokes und Theme-Matrix halten.

```bash
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
```

## Lokale Gates

```bash
node scripts/run_xtend_tests.js component-shell-contract --json
node scripts/run_xtend_tests.js component-styling-contract --json
node scripts/run_xtend_tests.js runtime-a11y-contract --json
node scripts/run_xtend_tests.js component-ux-performance --json
node scripts/run_xtend_tests.js component-network-contract --json
node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json
node scripts/run_xtend_tests.js component-lab-ux-inspector --json
node scripts/run_xtend_tests.js component-ux-browser-smokes --json
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
node scripts/run_xtend_tests.js references --json
```

## Definition of Done

- Docs, `.d.ts`, Fixture, Component Suite und RMT Metadata existieren.
- Shell, Styling, A11y, Performance und Network Contracts sind sichtbar.
- Events sind `bubbles: true` und `composed: true`, wenn Hosts oder RMT sie konsumieren sollen.
- Commands sind deklarierbar und nicht nur private Methoden.
- Theme, Density und Motion sind nicht hart im Shadow DOM versteckt.
- Browser-Smoke oder Theme-Matrix deckt den relevanten sichtbaren Pfad ab.
- Kein neuer Pfad fuehrt eine harte XTend-Abhaengigkeit in den RMT-Kernel ein.

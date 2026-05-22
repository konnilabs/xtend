# RMT vNext Component Primitives und XTend UI

- Schema: `xtend.rmt.component-capability-registry.v1`
- Report Schema: `xtend.rmt.component-capability-registry-report.v1`
- Runtime: `xtendrmt/rmt-component-capability-registry.js`
- Export: `@ccslabs/xtend/rmt/component-capability-registry`
- Local Gate: `node scripts/run_xtend_tests.js rmt-vnext-component-primitives --json`
- Aggregat: `npm run test:rmt-vnext-primitives:report`

RMT vNext und XTend UI sind keine Parallelwelten. Die Component Primitives
verbinden RMT-Templates, Kernel Records, DOM Descriptor Renderer und die
public XTend Web Components ueber eine gemeinsame Capability Registry. RMT
beschreibt Shell, State, Surfaces, Events und Lifecycle; XTend Components
liefern die konkreten UI-Bausteine, Accessibility-Profile, Parts, Slots,
Events und Performance-Profile.

## Source-to-Sea-Fluss

```text
.rmt template
  -> RMT Compiler und Core Records
  -> Kernel Records und Fabric Lanes
  -> DOM Descriptor Renderer
  -> Component Capability Registry
  -> XTend Component aus components/manifest.json
  -> Browser DOM und Component Lifecycle
```

Der RMT-Kernel importiert keine XTend-Komponenten und keine XTend-Typen. Die
Registry liest Manifest, Component Contracts, `xtendRmtMetadata`,
`observedAttributes`, Events, Slots, Parts, Form-Assoziation sowie A11y- und
Performance-Profile. Daraus entsteht eine normalisierte Matrix fuer alle 42
public Eintraege aus `components/manifest.json`.

## Matrix

| Bereich | Abdeckung |
| --- | --- |
| Manifest-Eintraege | 42 |
| Renderbare public UI-Komponenten | 38 |
| Nicht-visuelle Sonderfaelle | 4 |
| RMT-Metadaten | 40 Eintraege |
| Component Contracts | 38 Eintraege |
| Form-associated Components | 6 |

Nicht-visuelle Sonderfaelle sind `x-theme`, `xstate`, `x-utils` und
`x-rmt-lifecycle-demo-build`. `x-theme` und `xstate` sind Infrastrukturmodule;
sie werden ueber Host-/Loader-Dienste genutzt, aber nicht als normale RMT-App-
UI gerendert. `x-utils` bleibt Utility-Modul, der Lifecycle-Demo-Build bleibt
Demo-Artefakt.

## Component-Familien

| Familie | Tags |
| --- | --- |
| Form | `x-calendar`, `x-checkbox`, `x-form`, `x-input`, `x-radio`, `x-select`, `x-textarea` |
| Navigation | `x-router`, `x-link`, `x-menu`, `x-drawer` |
| Overlay/Surface | `x-dialog`, `x-lightbox`, `x-modal`, `x-popover`, `x-side-panel`, `x-surface-manager`, `x-surface-window`, `x-toast`, `x-tooltip` |
| Media/Feedback/Layout | `x-alert`, `x-button`, `x-cards`, `x-code`, `x-icon`, `x-masonry`, `x-player`, `x-progress`, `x-spinner`, `x-status`, `x-summary`, `x-type`, `x-writer` |
| Theme/Layout | `x-footer`, `x-header`, `x-hero`, `x-section`, `x-tabs` |
| Infrastruktur | `x-theme`, `xstate`, `x-utils`, `x-rmt-lifecycle-demo-build` |

Die risikoreichen Familien `form`, `navigation`, `overlay-surface`,
`media-feedback-layout` und `theme-layout` bleiben fuer representative Browser
Smokes markiert. Der Default-Gate prueft die breite Matrix fake-DOM-nah und
haelt Browser-Flakiness aus dem schnellen Primitive-Gate heraus.

## Runtime API

```js
import {
  createRmtComponentCapabilityRegistry
} from '@ccslabs/xtend/rmt/component-capability-registry';
import {
  createRmtDomDescriptorRenderer
} from '@ccslabs/xtend/rmt/dom-descriptor-renderer';

const registry = createRmtComponentCapabilityRegistry({
  manifest,
  sourceTexts,
  importer: async (modulePath) => import(`/components/${modulePath.replace(/^\.\//u, '')}`)
});

const descriptor = registry.buildComponentDescriptor({
  tag: 'x-select',
  id: 'plan-select',
  key: 'settings:plan',
  attributes: {
    name: 'plan',
    value: 'pro'
  },
  slots: {
    label: { text: 'Plan' }
  },
  events: {
    'select-changed': 'settings.plan.changed'
  }
});

const renderer = createRmtDomDescriptorRenderer({ documentTarget: document });

renderer.renderKeyed(root, [descriptor], {
  componentRegistry: registry,
  dispatchEvent(event) {
    actions.dispatch(event.action, event.payload);
  },
  stateBridge: {
    read(key) {
      return state.read(key);
    },
    write(key, value) {
      state.write(key, value);
    }
  }
});
```

Wichtige Registry-Funktionen:

| Funktion | Zweck |
| --- | --- |
| `resolveComponentCapability(tag)` | Liefert normalisierte Capabilities fuer einen Manifest-Tag. |
| `listCapabilities(filter)` | Listet Capabilities nach Familie oder Visual Kind. |
| `buildComponentDescriptor(input)` | Baut einen DOM Descriptor fuer XTend-Komponenten inklusive Capability-Markern. |
| `bindComponentInstance(element, binding, options)` | Verbindet Events, Form-State und State Bridge ueber public DOM APIs. |
| `ensureComponentLoaded(tag, options)` | Fuehrt lazy Import ueber einen expliziten Importer aus. |
| `createMatrixReport()` | Erzeugt den Compatibility-Report fuer CI und lokale Diagnose. |

## Event- und State-Bridge

Form Controls liefern `value`, `checked`, `validity`, `dataset` und Datei-
Metadaten in einem sicheren Payload-Record
`xtend.rmt.component-event-payload.v1`. Fuer Form-Familien werden `input` und
`change` ergaenzt, wenn keine explizite Event-Bindung gesetzt ist.

Navigation, Overlays, Feedback- und Layout-Komponenten bleiben ebenfalls ueber
public Events und Properties angebunden. Produktcode muss nicht in
`shadowRoot` greifen, keine privaten Component-Maps lesen und keine
komponentenspezifischen Renderer einbauen.

## Renderer-Integration

Der DOM Descriptor Renderer akzeptiert `componentRegistry` in
`render(...)` und `renderKeyed(...)`. Bei `type: "component"` werden Tag,
Attribute, Properties, Slots, Parts und Event-Bindings ueber die Registry
normalisiert. Keyed Reuse bleibt erhalten, unkeyed Repeat-UI wird weiterhin
diagnostiziert.

Normale RMT-App-UI nutzt keine HTML-Sinks. `innerHTML`, `outerHTML`,
`insertAdjacentHTML`, `document.write`, `createContextualFragment` und
unsichere URL-/Inline-Event-Sinks bleiben durch den No-Manual-HTML-Gate und
die Trusted-DOM-Boundary gesperrt.

## Architekturregeln

- Component Contracts bleiben die Quelle der Wahrheit.
- RMT erweitert XTend UI ueber Metadaten und Runtime-Bridges, nicht ueber
  Monkeypatching.
- Lazy Import laeuft nur ueber Manifest und explizite Importer.
- Der RMT-Kernel bleibt framework-neutral und importiert keine XTend-Typen.
- Overlays, Surfaces und Portals brauchen Resource Ownership und Cleanup.
- `x-player` nutzt den public Player Contract fuer Play/Pause, State Bridge,
  Theme Tokens und Parts; Produktcode patcht kein Shadow DOM.
- Infrastrukturmodule wie `x-theme` und `xstate` werden als Services genutzt,
  nicht als normale Surface-Elemente.

## Gates

```bash
node scripts/run_xtend_tests.js rmt-vnext-component-primitives --json
npm run test:rmt-vnext-primitives:report
node scripts/run_xtend_tests.js component-ux-browser-smokes --json
node scripts/run_xtend_tests.js type-exports-rmt --json
```

Das schnelle Primitive-Gate prueft Registry, Matrix, Renderer-Bindung,
Package-Exports, Type Declarations, Lazy Import, State Roundtrip und negative
Grenzen gegen Shadow-DOM-Patches, manuelle HTML-Sinks und direkte Component-
Imports.

## Verwandte Doku

- [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
- [RMT DOM Descriptor Renderer](./rmt-dom-descriptor-renderer.md)
- [RMT Component Template Primitives](./rmt-component-template-primitives.md)
- [XTend Components](./components.md)
- [Component Platform](./component-platform.md)
- [XTend-Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md)

# RMT vNext Component Primitives and XTend UI

- Schema: `xtend.rmt.component-capability-registry.v1`
- Report schema: `xtend.rmt.component-capability-registry-report.v1`
- Runtime: `xtendrmt/rmt-component-capability-registry.js`
- Export: `@ccslabs/xtend/rmt/component-capability-registry`
- Local gate: `node scripts/run_xtend_tests.js rmt-vnext-component-primitives --json`
- Aggregate gate: `npm run test:rmt-vnext-primitives:report`

RMT vNext and XTend UI are not parallel stacks. The Component Primitives connect
RMT templates, kernel records, the DOM Descriptor Renderer, and the public XTend
Web Components through one capability registry. RMT describes shell, state,
surfaces, events, and lifecycle intent; XTend Components provide the concrete UI
building blocks, accessibility profiles, parts, slots, events, and performance
profiles.

## Source-to-Sea Flow

```text
.rmt template
  -> RMT compiler and Core records
  -> Kernel records and Fabric lanes
  -> DOM Descriptor Renderer
  -> Component Capability Registry
  -> XTend Component from components/manifest.json
  -> Browser DOM and component lifecycle
```

The RMT kernel does not import XTend components or XTend types. The registry
reads the manifest, Component Contracts, `xtendRmtMetadata`,
`observedAttributes`, events, slots, parts, form association, accessibility
profiles, and performance profiles. It normalizes those signals into one matrix
for all 44 public entries in `components/manifest.json`.

## Matrix

| Area | Coverage |
| --- | --- |
| Manifest entries | 44 |
| Renderable public UI components | 40 |
| Non-visual special cases | 4 |
| RMT metadata | 42 entries |
| Component Contracts | 40 entries |
| Form-associated components | 6 |

The non-visual special cases are `x-theme`, `xstate`, `x-utils`, and
`x-rmt-lifecycle-demo-build`. `x-theme` and `xstate` are infrastructure
modules; hosts and loaders consume them as services, but normal RMT app UI does
not render them as surface elements. `x-utils` remains a utility module, and
the lifecycle demo build remains a demo artifact.

## Component Families

| Family | Tags |
| --- | --- |
| Form | `x-calendar`, `x-checkbox`, `x-form`, `x-input`, `x-radio`, `x-select`, `x-textarea` |
| Navigation | `x-router`, `x-link`, `x-menu`, `x-drawer` |
| Overlay/Surface | `x-dialog`, `x-lightbox`, `x-modal`, `x-popover`, `x-side-panel`, `x-surface-manager`, `x-surface-window`, `x-toast`, `x-tooltip` |
| Media/Feedback/Layout | `x-alert`, `x-button`, `x-cards`, `x-code`, `x-icon`, `x-masonry`, `x-player`, `x-progress`, `x-spinner`, `x-status`, `x-summary`, `x-type`, `x-writer` |
| Theme/Layout | `x-footer`, `x-header`, `x-hero`, `x-section`, `x-tabs` |
| Infrastructure | `x-theme`, `xstate`, `x-utils`, `x-rmt-lifecycle-demo-build` |

The higher-risk families `form`, `navigation`, `overlay-surface`,
`media-feedback-layout`, and `theme-layout` stay marked for representative
browser smokes. The default gate verifies the broad matrix in a fake-DOM runtime
and keeps browser flakiness out of the fast primitive gate.

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

Key registry functions:

| Function | Purpose |
| --- | --- |
| `resolveComponentCapability(tag)` | Returns normalized capabilities for a manifest tag. |
| `listCapabilities(filter)` | Lists capabilities by family or visual kind. |
| `buildComponentDescriptor(input)` | Builds a DOM descriptor for an XTend component with capability markers. |
| `bindComponentInstance(element, binding, options)` | Connects events, form state, and the state bridge through public DOM APIs. |
| `ensureComponentLoaded(tag, options)` | Runs lazy import through an explicit importer. |
| `createMatrixReport()` | Creates the compatibility report for CI and local diagnosis. |

## Event and State Bridge

Form controls provide `value`, `checked`, `validity`, `dataset`, and file
metadata in the safe payload record `xtend.rmt.component-event-payload.v1`.
For form families, `input` and `change` are inferred when no explicit event
binding is present.

Navigation, overlays, feedback, and layout components are also connected through
public events and properties. Product code does not need to reach into
`shadowRoot`, read private component maps, or add component-specific renderers.

## Renderer Integration

The DOM Descriptor Renderer accepts `componentRegistry` in `render(...)` and
`renderKeyed(...)`. For `type: "component"`, the registry normalizes tag,
attributes, properties, slots, parts, and event bindings. Keyed reuse remains
intact, and unkeyed repeat UI remains diagnosable.

Normal RMT app UI does not use HTML sinks. `innerHTML`, `outerHTML`,
`insertAdjacentHTML`, `document.write`, `createContextualFragment`, unsafe URLs,
and inline event sinks stay blocked by the No-Manual-HTML gate and the Trusted
DOM Boundary.

## Architecture Rules

- Component Contracts remain the source of truth.
- RMT extends XTend UI through metadata and runtime bridges, not monkeypatching.
- Lazy import runs only through the manifest and explicit importers.
- The RMT kernel stays framework-neutral and imports no XTend types.
- Overlays, surfaces, and portals need resource ownership and cleanup.
- `x-player` uses the public Player Contract for play/pause, state bridge,
  theme tokens, and parts; product code does not patch Shadow DOM.
- Infrastructure modules such as `x-theme` and `xstate` are consumed as
  services, not rendered as normal surface elements.

## Gates

```bash
node scripts/run_xtend_tests.js rmt-vnext-component-primitives --json
npm run test:rmt-vnext-primitives:report
node scripts/run_xtend_tests.js component-ux-browser-smokes --json
node scripts/run_xtend_tests.js type-exports-rmt --json
```

The fast primitive gate verifies the registry, matrix, renderer binding,
package exports, type declarations, lazy import, state roundtrip, and negative
boundaries against Shadow-DOM patches, manual HTML sinks, and direct component
imports.

## Related Docs

- [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
- [RMT DOM Descriptor Renderer](./rmt-dom-descriptor-renderer.md)
- [RMT Component Template Primitives](./rmt-component-template-primitives.md)
- [XTend Components](./components.md)
- [Component Platform](./component-platform.md)
- [XTend-Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md)

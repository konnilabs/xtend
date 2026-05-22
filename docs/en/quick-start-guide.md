# Quick Start Guide

This guide takes you from a local XTend page to a small RMT vNext app shell. The fastest first step is still HTML with Web Components; the recommended growth path for apps is RMT-first.

## Requirements

- Node.js 18 or newer
- a local checkout of the XTend repository
- a browser with Custom Elements and ES Module support

Start the local dev server:

```bash
npm run dev:local
```

The server usually serves the app at `http://127.0.0.1:4173/`.

## 1. Start a Minimal Host

Create an HTML file in the project, for example `quick-start.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="xtend-preload" content="x-theme,x-section,x-button">
  <title>XTend Quick Start</title>
  <script
    type="module"
    src="/xtend-loader.js"
    data-manifest="/components/manifest.json">
  </script>
</head>
<body>
  <main>
    <x-section layout="column" label="Quick Start">
      <h1>Hello XTend</h1>
      <p>This app runs with local Web Components.</p>
      <x-button variant="primary">Get started</x-button>
    </x-section>
  </main>
</body>
</html>
```

Then open `http://127.0.0.1:4173/quick-start.html`.

What happens here?

- `xtend-loader.js` is the local loader.
- `components/manifest.json` is the component registry.
- `meta name="xtend-preload"` loads critical modules early.
- `x-theme` is an infrastructure module; `x-section` and `x-button` are
  normal XTend Web Components.
- `/xtend.css` is optional host theming.

## 2. Describe the App Shell in RMT vNext

When the page becomes an app, the shell should live in RMT. RMT vNext describes UI structure, state, actions, events, surfaces, and scheduling in a readable `.rmt` source.

```rmt
template quickstart.app {
  state counter type number initial 0

  selector counterLabel from state counter {
    output text
  }

  action increment {
    input amount number
    reduce state.counter = input.amount
    emit counter.changed with action increment
  }

  portal app root "#app-root" layer surface

  surface home kind page component x-section {
    source state counter
    portal app
    key route.path

    lane visible weight 80 {
      hydrate x-section from state counter
    }

    on click target button.primary -> action increment {
      payload amount from 1
    }
  }
}
```

This document is the app description. The compiler turns it into Core and kernel records that host adapters can connect to XTend Components, XRouter, and Fabric.

## 3. Materialize XTend UI from RMT

Runtime hosts connect RMT descriptors with the existing XTend components from
the manifest through the Component Capability Registry. Component Contracts,
events, slots, parts, and state bindings stay the shared source of truth:

```js
import {
  createRmtComponentCapabilityRegistry
} from '@ccslabs/xtend/rmt/component-capability-registry';
import {
  createRmtDomDescriptorRenderer
} from '@ccslabs/xtend/rmt/dom-descriptor-renderer';

const registry = createRmtComponentCapabilityRegistry({ manifest, sourceTexts });
const renderer = createRmtDomDescriptorRenderer({ documentTarget: document });

renderer.renderKeyed(root, [
  registry.buildComponentDescriptor({
    tag: 'x-button',
    key: 'primary-action',
    attributes: { variant: 'primary' },
    slots: { default: { text: 'Get started' } },
    events: { click: 'quickstart.increment' }
  })
], {
  componentRegistry: registry,
  dispatchEvent: actions.dispatch,
  stateBridge
});
```

That lets RMT primitives use XTend UI without Shadow-DOM patches,
component-specific renderers, or manual HTML sinks.

## 4. Check RMT Locally

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
```

The agent report contains `repairPlan`, `fixOrder`, `confidence`, `impact`, `relatedDiagnostics`, and explained no-ops for repairs that intentionally stay manual.

## 5. Enable Editor Support

```bash
node tools/rmt-language-server/server.js
```

The server provides diagnostics, completion, hover, document symbols, definition, and code actions. For a minimal native app shell, use the `rmt-app` snippet prefix; for vNext primitives, `rmt-vnext-primitive-shell` is the fastest start.

## Next Steps

- [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Component Primitives and XTend UI](./rmt-vnext-component-primitives.md)
- [XTendRMT Developer Overview](./xtendrmt-overview.md)
- [RMT Linter and AI-Agent Repair Report](./rmt-linter.md)
- [RMT Language Server and Editor Setup](./rmt-language-server.md)
- [XTend Loader](./xtend-loader.md)
- [Manifest Format](./manifest.md)
- [Component Development](./components.md)

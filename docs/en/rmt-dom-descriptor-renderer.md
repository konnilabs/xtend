# RMT DOM Descriptor Renderer

The RMT DOM Descriptor Renderer turns structured RMT records into browser nodes without treating application data as HTML. Use it when an RMT template, component binding or surface must materialize owned DOM while keeping the trust boundary inspectable.

The runtime contract is `xtend.epic18.rmt-dom-descriptor-renderer.v1`. Its implementation and declarations live in `xtendrmt/rmt-dom-descriptor-renderer.js` and `xtendrmt/rmt-dom-descriptor-renderer.d.ts`; the package subpath is `@ccslabs/xtend/rmt/dom-descriptor-renderer`.

## Mental model

A descriptor says what kind of node to create. It can describe an element, text, a registered XTend component, a conditional branch, a repeated record or a slot. The renderer resolves that structure against explicit model, selector, template and component registries. It then uses `createElement`, `createTextNode`, `createDocumentFragment` and `replaceChildren` to materialize the result.

The root remains host-owned. `commit()` is the canonical write API. Its
`create-node`, `replace-children`, `reconcile-children`, `reconcile-element`
and `merge-element` operations make the intended mutation semantics explicit.
Full reconcile removes renderer-owned state which disappeared from the next
descriptor; merge keeps fields which were not supplied. The result schema is
`xtend.rmt.dom-commit-result.v1` and reports changed nodes, structural work and
diagnostics.

The compatibility methods remain synchronous. `render()`, `renderNode()` and
`renderKeyed()` delegate to the corresponding commit operations.
`patchElement()` remains a merge operation during the 0.6/0.7 migration and
emits `rmt.dom.patch-element.legacy-merge` once per renderer. New framework
code should call `commit()` directly.

Ownership is resolved before writing. Structure, content and base values
belong to the descriptor renderer; compiled events, transition visibility and
validation state remain reserved for their runtimes. Strict ownership
collisions fail closed. Compatibility mode keeps the reserved owner and
records a diagnostic. `dispose()` releases renderer-owned event, ref and
component-binding handles and can optionally clear owned root DOM.

## Minimal example

```js
import { createRmtDomDescriptorRenderer } from '@ccslabs/xtend/rmt/dom-descriptor-renderer';

const root = document.querySelector('[data-rmt-host]');
const renderer = createRmtDomDescriptorRenderer({ documentTarget: document });

const result = renderer.render(root, {
  type: 'element',
  tag: 'section',
  attributes: { 'aria-label': 'Build status' },
  children: [
    { type: 'text', text: 'Ready' }
  ]
});

console.log(result.nodeCount, result.diagnostics);
```

The result uses `xtend.epic18.rmt-dom-render-result.v1`. Pass source locations through the render options when diagnostics must map back to a document, template, node, line or column.

## Trust boundary

Normal UI follows the No-Manual-HTML rule. The renderer blocks `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `createContextualFragment`, inline event handlers, unsafe URL schemes and blocked tags such as `script` or `iframe`. Attributes and properties pass through explicit allowlists instead of arbitrary assignment.

Trusted rich content is a separate path. A descriptor of that kind is accepted only when the host provides an explicit `trustedDomRenderer` for `xtend.rmt.trusted-dom-boundary.explicit`. Do not turn a rejection into a fallback string sink; render text or a declared fallback surface instead.

## Failure behavior

An invalid root, blocked tag, unsafe URL, unknown component or forbidden property throws with an `xtend.epic18.rmt-dom-renderer-diagnostic.v2` diagnostic. `listDiagnostics()` returns diagnostics observed by the renderer. A host can additionally provide `diagnosticsHub.publish()` to forward them without giving the renderer canonical application state.

Use `createNoManualHtmlGate()` to scan source files for forbidden sinks before browser execution. The gate reports the file and sink; it does not rewrite source automatically.

## Verify the contract

```bash
node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer rmt-renderer-dom-descriptor-proofs --json
```

The accepted result proves node materialization, event cleanup, keyed updates, source diagnostics and refusal of manual HTML sinks. A failure should be fixed in the descriptor or host policy, not hidden by bypassing the renderer.

The renderer is the completed prerequisite for `WP-E18-06`.

## Related pages

- [RMT vNext Component Primitives](./rmt-vnext-component-primitives.md)
- [Trusted DOM and Sanitizing](./trusted-dom-sanitizing.md)
- [RMT App Platform Fixture](./rmt-app-platform-fixture.md)
- [RMT Security Policies](./rmt-reference-security-policies.md)

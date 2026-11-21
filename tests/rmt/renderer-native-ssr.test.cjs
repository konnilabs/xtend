'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const apiPromise = import('../../xtendrmt/rmt-dom-descriptor-renderer.js');
const literal = value => ({ op: 'literal', value });
const text = (key, value) => ({ type: 'text', key: literal(key), text: literal(value) });
const element = (key, tag, children, extra = {}) => ({ type: 'element', tag, key: literal(key), ...(children === undefined ? {} : { children }), ...extra });
async function fixture(markup = '<main></main>', registry) {
  const dom = new JSDOM(markup), api = await apiPromise, root = dom.window.document.querySelector('main');
  const renderer = api.createRmtDomDescriptorRenderer({ documentTarget: dom.window.document, componentRegistry: registry });
  return { dom, api, root, renderer, close() { renderer.dispose(); dom.window.close(); } };
}
const shell = (f, descriptors, extra = {}) => f.renderer.renderSsrShell({ schema: f.api.RMT_DOM_SSR_SHELL_REQUEST_SCHEMA, target: f.root, descriptors, ...extra });
const adopt = (f, descriptors, extra = {}) => f.renderer.adoptChildren({ schema: f.api.RMT_DOM_ADOPTION_REQUEST_SCHEMA, target: f.root, descriptors, ...extra });

test('native SSR keeps typed keyed text, empty nodes and ordinary DOM identity across HTML transport', async () => {
  const descriptors = [element('surface', 'section', [
    text(JSON.stringify(['document', 'text', [1]]), 'one'),
    text(JSON.stringify(['document', 'text', ['1']]), 'two'),
    text('empty', ''),
    element('input', 'input', [], { properties: { value: literal('server value'), checked: literal(true) } })
  ])];
  const server = await fixture();
  let client;
  try {
    shell(server, descriptors);
    assert.match(server.root.innerHTML, /<!--rmt-text:/u);
    assert.match(server.root.innerHTML, /value="server value"/u);
    client = await fixture('<main>' + server.root.innerHTML + '</main>');
    const section = client.root.firstElementChild, first = section.childNodes[1], second = section.childNodes[4], input = section.lastElementChild;
    adopt(client, descriptors);
    assert.equal(client.root.firstElementChild, section);
    assert.equal(section.childNodes[0], first);
    assert.equal(section.childNodes[1], second);
    assert.equal(section.childNodes[2].data, '');
    assert.equal(section.lastElementChild, input);
    assert.equal(input.value, 'server value');
    assert.equal(input.checked, true);
    assert.equal(section.childNodes.length, 4);
    assert.throws(() => adopt(client, descriptors), { code: 'rmt.dom.adoption.already-owned' });
    const swapped = [element('surface', 'section', [descriptors[0].children[1], descriptors[0].children[0], ...descriptors[0].children.slice(2)])];
    client.renderer.commit({ operation: 'reconcile-children', target: client.root, descriptors: swapped });
    assert.equal(section.childNodes[0], second);
    assert.equal(section.childNodes[1], first);
  } finally { client?.close(); server.close(); }
});

test('native adoption preserves opaque framework children and rejects owned mismatches before effects', async () => {
  const descriptors = [element('surface', 'section', [element('native', 'p', [text('text', 'safe')]), element('provider', 'div', undefined)])];
  const server = await fixture();
  let client;
  try {
    shell(server, descriptors);
    client = await fixture('<main>' + server.root.innerHTML + '</main>');
    const provider = client.root.querySelector('[data-rmt-key="provider"]');
    provider.innerHTML = '<button>framework-owned</button>';
    const button = provider.firstChild;
    const nativeText = client.root.querySelector('p').childNodes[1];
    nativeText.data = 'tampered';
    const before = client.root.innerHTML, observer = new client.dom.window.MutationObserver(() => {});
    observer.observe(client.root, { subtree: true, attributes: true, childList: true, characterData: true });
    assert.throws(() => adopt(client, descriptors), { code: 'rmt.dom.adoption.mismatch' });
    assert.equal(client.root.innerHTML, before);
    assert.deepEqual(observer.takeRecords(), []);
    nativeText.data = 'safe';
    adopt(client, descriptors);
    assert.equal(provider.firstChild, button);
    assert.equal(button.textContent, 'framework-owned');
    observer.disconnect();
  } finally { client?.close(); server.close(); }
});

test('native managed server shells never prepare, bind or invoke custom property setters', async () => {
  const calls = [];
  const registry = {
    resolveComponentCapability: () => ({ properties: ['data'], managed: true }),
    validateNativeComponentDescriptor() { calls.push('validate'); return true; },
    prepareNativeComponent() { throw Error('server preparation is forbidden'); },
    updateNativeComponent() { throw Error('server update is forbidden'); },
    bindComponentInstance() { throw Error('server binding is forbidden'); }
  };
  const f = await fixture('<main></main>', registry);
  try {
    const descriptor = { type: 'component', component: 'x-test', tag: 'x-test', key: literal('managed'), attributes: { title: literal('shell') }, properties: { data: literal({ nested: ['trusted'] }) }, children: [], nativeBinding: { declarationId: 'component', ref: 'test', surfaceId: 'surface', keys: [] } };
    shell(f, [descriptor]);
    assert.equal(f.root.firstChild.localName, 'x-test');
    assert.equal(f.root.firstChild.getAttribute('title'), 'shell');
    assert.equal(f.root.firstChild.data, undefined);
    assert.ok(calls.includes('validate'));
    assert.throws(() => shell(f, [descriptor]), { code: 'rmt.dom.ssr.target-not-empty' });
  } finally { f.close(); }
});

test('managed adoption validates the entire owned subtree before preparation and prepares before first update', async () => {
  const order = [], prepared = new WeakSet();
  const registry = {
    resolveComponentCapability: () => ({ properties: ['value'], managed: true }),
    validateNativeComponentDescriptor() { return true; },
    prepareNativeComponent(node) { order.push('prepare'); prepared.add(node); return { dispose() { order.push('dispose'); } }; },
    updateNativeComponent(node) { assert.ok(prepared.has(node)); order.push('update'); },
    bindComponentInstance(node) { assert.ok(prepared.has(node)); order.push('bind'); return { dispose() { order.push('dispose-bind'); } }; }
  };
  const descriptor = { type: 'component', component: 'x-test', tag: 'x-test', key: literal('managed'), attributes: { title: literal('shell') }, properties: { value: literal('model') }, children: [], nativeBinding: { declarationId: 'component', ref: 'test', surfaceId: 'surface', keys: [] } };
  const descriptors = [descriptor, element('native', 'p', [text('message', 'safe')])];
  const server = await fixture('<main></main>', registry);
  let client;
  try {
    shell(server, descriptors);
    assert.deepEqual(order, []);
    client = await fixture('<main>' + server.root.innerHTML + '</main>', registry);
    const node = client.root.firstChild, p = client.root.querySelector('p');
    p.setAttribute('data-rmt-key', 'wrong');
    assert.throws(() => adopt(client, descriptors), { code: 'rmt.dom.adoption.mismatch' });
    assert.deepEqual(order, []);
    p.setAttribute('data-rmt-key', 'native');
    adopt(client, descriptors);
    assert.equal(client.root.firstChild, node);
    assert.deepEqual(order, ['prepare', 'update', 'bind']);
  } finally { client?.close(); server.close(); }
});

test('native SSR requires its request version and rejects registered client custom elements before construction', async () => {
  const f = await fixture();
  try {
    let constructed = 0;
    f.dom.window.customElements.define('x-test', class extends f.dom.window.HTMLElement { constructor() { super(); constructed++; } });
    assert.throws(() => shell(f, [element('custom', 'x-test', [])]), { code: 'rmt.dom.ssr.custom-element-defined' });
    assert.equal(constructed, 0);
    assert.equal(f.root.childNodes.length, 0);
    assert.throws(() => f.renderer.renderSsrShell({ schema: 'xtend.rmt.dom-ssr-shell.v99', target: f.root, descriptors: [] }), { code: 'rmt.dom.ssr.request-invalid' });
    const descriptor = element('native', 'p', [text('message', 'safe')]);
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [descriptor], context: { nativeSsrShells: true } }, { nativeSsrShells: true });
    assert.doesNotMatch(f.root.innerHTML, /<!--rmt-text:/u);
  } finally { f.close(); }
});

test('a failed native managed adoption releases preparations and already bound component handles', async () => {
  const disposed = [], registry = {
    resolveComponentCapability: () => ({ properties: [], managed: true }),
    validateNativeComponentDescriptor() { return true; },
    prepareNativeComponent(node) { const key = node.getAttribute('data-rmt-key'); return { dispose() { disposed.push('prepared:' + key); } }; },
    updateNativeComponent(node) { if (node.getAttribute('data-rmt-key') === 'second') throw Error('client adoption failed'); },
    bindComponentInstance(node) { const key = node.getAttribute('data-rmt-key'); return { dispose() { disposed.push('bound:' + key); } }; }
  };
  const component = key => ({ type: 'component', component: 'x-test', tag: 'x-test', key: literal(key), attributes: {}, properties: {}, children: [], nativeBinding: { declarationId: key, ref: key, surfaceId: 'surface', keys: [] } });
  const descriptors = [component('first'), component('second')], server = await fixture('<main></main>', registry);
  let client;
  try {
    shell(server, descriptors);
    client = await fixture('<main>' + server.root.innerHTML + '</main>', registry);
    assert.throws(() => adopt(client, descriptors), /client adoption failed/u);
    assert.deepEqual(disposed.sort(), ['bound:first', 'prepared:first', 'prepared:second']);
  } finally { client?.close(); server.close(); }
});

test('real custom-element upgrade defers Classic callbacks until authenticated managed preparation and controlled values', async () => {
  const managed = await import('../../components/native-managed.js');
  const bridge = require('../../tools/xtensions/native-component-managed');
  const metadata = require('../../tools/xtensions/native-component-catalog-v2').NATIVE_COMPONENT_CATALOG_V2.find(row => row.tag === 'x-button');
  let classicEffects = 0, managedConnections = 0, nestedConnections = 0, constructed = 0;
  const legacyState = { set() { classicEffects++; } };
  const serverRegistry = {
    resolveComponentCapability: () => ({ properties: ['title'], managed: true }),
    validateNativeComponentDescriptor() { return true; },
    prepareNativeComponent() { throw Error('no server preparation'); },
    updateNativeComponent() { throw Error('no server update'); },
    bindComponentInstance() { throw Error('no server binding'); }
  };
  const descriptor = { type: 'component', component: 'x-button', tag: 'x-button', key: literal('managed'), attributes: { label: literal('controlled') }, properties: { title: literal('model title') }, children: [], nativeBinding: { declarationId: 'component', ref: 'test', surfaceId: 'surface', keys: [] } };
  const server = await fixture('<main></main>', serverRegistry);
  let client;
  try {
    shell(server, [descriptor]);
    assert.match(server.root.innerHTML, /data-rmtx-native-pending="v1"/u);
    const contexts = new WeakMap();
    const clientRegistry = {
      ...serverRegistry,
      prepareNativeComponent(node) {
        const context = bridge.prepareNativeComponent(node, { descriptor: metadata, owner: { documentId: 'ssr-test', surfaceId: 'surface', controllerId: 'controller', generation: 1 }, ref: 'test', keys: [], isCurrent: () => true, isActive: () => true });
        contexts.set(node, context);
        return { dispose() { bridge.disposeNativeComponent(node); } };
      },
      updateNativeComponent(node, _descriptor, _context, values) { bridge.updateNativeComponent(node, values); },
      bindComponentInstance(node) { assert.ok(contexts.has(node)); return { dispose() { bridge.disposeNativeComponent(node); } }; }
    };
    client = await fixture('<main>' + server.root.innerHTML + '</main>', clientRegistry);
    const node = client.root.firstChild;
    assert.equal(node.shadowRoot, null);
    class Nested extends client.dom.window.HTMLElement {
      static observedAttributes = ['label'];
      attributeChangedCallback() { classicEffects++; }
      connectedCallback() { classicEffects++; }
    }
    managed.markManagedComponentClass(Nested, 'x-inner', { attribute() {}, connect() { nestedConnections++; } });
    client.dom.window.customElements.define('x-inner', Nested);
    class Button extends client.dom.window.HTMLElement {
      static observedAttributes = ['label'];
      constructor() { super(); constructed++; this.attachShadow({ mode: 'open' }).innerHTML = '<x-inner label="nested"></x-inner>'; managed.componentState(this, legacyState).set('constructor', 'forbidden'); }
      attributeChangedCallback() { classicEffects++; }
      connectedCallback() { classicEffects++; }
    }
    managed.markManagedComponentClass(Button, 'x-button', {
      attribute() { assert.equal(this.title, 'model title'); },
      connect() { managedConnections++; assert.equal(this.getAttribute('label'), 'controlled'); assert.equal(this.title, 'model title'); }
    });
    client.dom.window.customElements.define('x-button', Button);
    assert.equal(constructed, 1);
    assert.equal(classicEffects, 0);
    assert.equal(managedConnections, 0);
    assert.equal(nestedConnections, 0, 'shadow dependencies inherit their pending owner barrier');
    assert.equal(managed.getManagedContext(node), null, 'a markup marker does not grant managed authority');
    adopt(client, [descriptor]);
    assert.equal(client.root.firstChild, node);
    assert.equal(classicEffects, 0);
    assert.equal(managedConnections, 1);
    assert.equal(nestedConnections, 1, 'deferred shadow dependencies connect under the prepared owner');
    assert.equal(node.hasAttribute('data-rmtx-native-pending'), false);
    assert.equal(managed.getManagedContext(node).isActive(), true);
  } finally { client?.close(); server.close(); }
});

test('retained Source7-style custom components defer Classic connection until native adoption finishes controlled props', async () => {
  const managed = await import('../../components/native-managed.js');
  const descriptor = { type: 'component', component: 'x-classic', tag: 'x-classic', key: literal('classic'), attributes: { label: literal('restored') }, properties: { title: literal('controlled title') }, children: [] };
  const registry = { resolveComponentCapability: tag => tag === 'x-classic' ? { properties: ['title'] } : null };
  const server = await fixture('<main></main>', registry);
  let client, classicConnections = 0, classicAttributes = 0;
  try {
    shell(server, [descriptor]);
    client = await fixture('<main>' + server.root.innerHTML + '</main>', registry);
    const node = client.root.firstChild;
    class Classic extends client.dom.window.HTMLElement {
      static observedAttributes = ['label'];
      attributeChangedCallback() { classicAttributes++; }
      connectedCallback() { classicConnections++; assert.equal(this.getAttribute('label'), 'restored'); assert.equal(this.title, 'controlled title'); }
    }
    managed.markManagedComponentClass(Classic, 'x-classic');
    client.dom.window.customElements.define('x-classic', Classic);
    assert.equal(classicAttributes, 0);
    assert.equal(classicConnections, 0);
    assert.equal(managed.getManagedContext(node), null);
    adopt(client, [descriptor]);
    assert.equal(client.root.firstChild, node);
    assert.equal(classicConnections, 1);
    assert.equal(managed.getManagedContext(node), null, 'retained Source7 component does not acquire Source8 grants');
    assert.equal(node.hasAttribute('data-rmtx-native-pending'), false);
  } finally { client?.close(); server.close(); }
});

test('the real Footer constructor cannot project SSR resource attributes before managed owner admission', async () => {
  const bridge = require('../../tools/xtensions/native-component-managed');
  const metadata = require('../../tools/xtensions/native-component-catalog-v2').NATIVE_COMPONENT_CATALOG_V2.find(row => row.tag === 'x-footer');
  const order = [], saved = new Map();
  const serverRegistry = {
    resolveComponentCapability: () => ({ properties: [], managed: true }), validateNativeComponentDescriptor() { return true; },
    prepareNativeComponent() { throw Error('server preparation'); }, updateNativeComponent() { throw Error('server update'); }, bindComponentInstance() { throw Error('server binding'); }
  };
  const descriptor = { type: 'component', component: 'x-footer', tag: 'x-footer', key: literal('footer'), attributes: { src: literal('https://example.invalid/logo.svg') }, properties: {}, children: [], nativeBinding: { declarationId: 'footer', ref: 'footer', surfaceId: 'surface', keys: [] } };
  const server = await fixture('<main></main>', serverRegistry);
  let client;
  try {
    shell(server, [descriptor]);
    const registry = { ...serverRegistry,
      prepareNativeComponent(node) {
        bridge.prepareNativeComponent(node, { descriptor: metadata, owner: { documentId: 'footer-ssr', surfaceId: 'surface', controllerId: 'controller', generation: 1 }, ref: 'footer', keys: [], isCurrent: () => true, isActive: () => true,
          ports: { dispatch(capability) { assert.equal(capability, 'resource.image'); order.push('resource-admitted'); return { release() {} }; } } });
        return { dispose() { bridge.disposeNativeComponent(node); } };
      },
      updateNativeComponent(node, _descriptor, _context, values) { bridge.updateNativeComponent(node, values); },
      bindComponentInstance(node) { return { dispose() { bridge.disposeNativeComponent(node); } }; }
    };
    client = await fixture('<main>' + server.root.innerHTML + '</main>', registry);
    for (const name of ['window','document','HTMLElement','Element','Node','Event','CustomEvent','MutationObserver','customElements']) {
      saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: name === 'window' ? client.dom.window : client.dom.window[name] });
    }
    const source = Object.getOwnPropertyDescriptor(client.dom.window.HTMLImageElement.prototype, 'src');
    Object.defineProperty(client.dom.window.HTMLImageElement.prototype, 'src', { ...source, set(value) { order.push('image-src'); source.set.call(this, value); } });
    const { default: Footer } = await import('../../components/xfooter.definition.js');
    client.dom.window.customElements.define('x-footer', Footer);
    const node = client.root.firstChild;
    assert.deepEqual(order, [], 'constructor does not consume the server resource attribute');
    assert.equal(node.shadowRoot.querySelector('img'), null);
    adopt(client, [descriptor]);
    assert.equal(client.root.firstChild, node);
    assert.equal(order[0], 'resource-admitted');
    assert.ok(order.includes('image-src'));
  } finally {
    client?.close(); server.close();
    for (const [name, original] of saved) if (original) Object.defineProperty(globalThis, name, original); else delete globalThis[name];
  }
});

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const api = require('../../tools/xtensions/native-view-projection');
const sharedScopes = require('../../tools/xtensions/repeat-scopes');
const copy = value => structuredClone(value);
const literal = value => ({ op: 'literal', value });
const path = (symbol, parts = [], root = 'state') => ({ kind: 'path', root, symbol, path: parts });
const projected = projection => ({ op: 'native-projection', projection });
const text = (id, value) => ({ type: 'text', nativeDeclarationId: id, value });
const element = (id, tag, children = [], attributes = {}, properties = {}) => ({ type: 'element', nativeDeclarationId: id, tag, attributes, properties, children });
const surface = (id, component, children) => ({ type: 'element', tag: component, id: `surface:${id}`, key: id, surface: id,
  attributes: { 'data-rmt-surface': literal(id), 'data-maraca-surface': literal(id), 'data-rmt-primitive-id': literal(id),
    'data-rmt-component': literal(component), 'data-maraca-kind': literal('region') }, ...(children === undefined ? {} : { children }) });
const outer = { state: 'catalog', path: ['groups'], key: ['id'] };
const inner = { path: ['products'], key: ['id'] };
const productPath = name => path('catalog', ['groups', { repeat: 0 }, 'products', { repeat: 1 }, name]);
function fixture() {
  const state = { title: '$model.must-stay-literal', allow: true, groups: [
    { id: 'g', products: [{ id: 1, label: 'number', enabled: true }, { id: '1', label: 'string', enabled: true }] },
    { id: 'h', products: [{ id: 1, label: 'other parent', enabled: true }] }
  ] };
  const children = [element('native:heading', 'h1', [text('native:title', projected(path('catalog', ['title'])))]),
    { type: 'native-repeat', nativeDeclarationId: 'native:groups', repeat: copy([outer]), children: [
      element('native:group', 'article', [
        { type: 'native-repeat', nativeDeclarationId: 'native:products', repeat: copy([outer, inner]), children: [
          { type: 'native-when', nativeDeclarationId: 'native:enabled', test: productPath('enabled'), children: [
            element('native:row', 'div', [
              element('native:input', 'input', [], { 'aria-label': projected(productPath('label')) }, { value: projected(productPath('label')) }),
              text('native:label', projected(productPath('label')))
            ], { 'data-label': projected(productPath('label')) })
          ] }
        ] }
      ], { 'data-group': projected(path('catalog', ['groups', { repeat: 0 }, 'id'])) })
    ] }];
  const program = { schema: 'xtend.rmt.app-orchestration.v3', state: { states: [{ id: 'catalog', initial: state }], selectors: [{ id: 'caption' }] },
    surfaces: [{ id: 'owner', component: 'section', kind: 'region' }], render: { nativeView: { schema: api.NATIVE_VIEW_SCHEMA, documentId: 'native-app', surfaces: ['owner'] },
      root: surface('owner', 'section', children) } };
  return { state, program, snapshot: { states: { catalog: state }, selectors: { caption: 'selected caption' } } };
}
async function domFixture() {
  const dom = new JSDOM('<main></main>', { pretendToBeVisual: true });
  const rendererApi = await import('../../xtendrmt/rmt-dom-descriptor-renderer.js');
  const renderer = rendererApi.createRmtDomDescriptorRenderer({ documentTarget: dom.window.document });
  const root = dom.window.document.querySelector('main');
  const commit = descriptor => renderer.commit({ operation: 'reconcile-children', target: root, descriptors: [descriptor] });
  return { dom, root, renderer, commit, close() { renderer.dispose(); dom.window.close(); } };
}

test('Native View requires Program3 and returns an immutable copy without touching source data', () => {
  const f = fixture(), before = copy(f.program), validated = api.validateNativeViewProgram(f.program);
  assert.equal(api.NATIVE_VIEW_PROJECTION_API_VERSION, '1.0.0');
  assert(Object.isFrozen(validated)); assert(Object.isFrozen(validated.render.root)); assert.notEqual(validated, f.program);
  assert.deepEqual(f.program, before); assert(!Object.isFrozen(f.program.render.root));
  for (const version of ['v1', 'v2']) assert.throws(() => api.validateNativeViewProgram({ ...f.program, schema: 'xtend.rmt.app-orchestration.' + version }), /versioned/);
  assert.throws(() => api.validateNativeViewProgram({ ...f.program, render: { root: f.program.render.root } }), /JSON|object/);
});

test('materialization emits only ordinary literal descriptors and preserves literal-looking text in real DOM', async () => {
  const f = fixture(), dom = await domFixture();
  try {
    const descriptor = api.materializeNativeView(f.program, f.snapshot);
    assert(!JSON.stringify(descriptor).includes('native-projection')); assert(!JSON.stringify(descriptor).includes('nativeDeclarationId'));
    dom.commit(descriptor);
    assert.equal(dom.root.querySelector('h1').textContent, '$model.must-stay-literal');
    assert.equal(dom.root.querySelectorAll('input').length, 3);
    assert.equal(dom.root.querySelector('input').value, 'number');
    assert.equal(dom.root.querySelector('input').getAttribute('aria-label'), 'number');
    assert.equal(dom.root.querySelectorAll('[data-rmt-key]').length, 10);
  } finally { dom.close(); }
});

test('typed keys, nested parents, reordering and property updates retain the actual element and text nodes', async () => {
  const f = fixture(), dom = await domFixture(), program = api.validateNativeViewProgram(f.program);
  try {
    dom.commit(api.materializeNativeView(program, f.snapshot));
    const rows = [...dom.root.querySelectorAll('[data-label]')], inputs = rows.map(row => row.querySelector('input')), labels = rows.map(row => row.lastChild);
    assert.notEqual(rows[0].getAttribute('data-rmt-key'), rows[1].getAttribute('data-rmt-key'));
    assert.notEqual(rows[0].getAttribute('data-rmt-key'), rows[2].getAttribute('data-rmt-key'));
    inputs[0].focus();
    const next = copy(f.snapshot); next.states.catalog.groups.reverse(); next.states.catalog.groups[1].products.reverse();
    next.states.catalog.groups[1].products[1].label = 'updated number';
    dom.commit(api.materializeNativeView(program, next));
    const reordered = [...dom.root.querySelectorAll('[data-label]')];
    assert.deepEqual(reordered, [rows[2], rows[1], rows[0]]);
    assert.equal(rows[0].querySelector('input'), inputs[0]); assert.equal(rows[0].lastChild, labels[0]);
    assert.equal(inputs[0].value, 'updated number'); assert.equal(labels[0].textContent, 'updated number');
    assert.equal(dom.dom.window.document.activeElement, inputs[0]);
  } finally { dom.close(); }
});

test('boolean presence removes only its branch and empty collections render no placeholder identities', async () => {
  const f = fixture(), dom = await domFixture();
  try {
    dom.commit(api.materializeNativeView(f.program, f.snapshot));
    const sibling = dom.root.querySelectorAll('[data-label]')[1], heading = dom.root.querySelector('h1');
    const next = copy(f.snapshot); next.states.catalog.groups[0].products[0].enabled = false;
    dom.commit(api.materializeNativeView(f.program, next));
    assert.equal(dom.root.querySelectorAll('[data-label]').length, 2); assert.equal(dom.root.querySelector('[data-label]'), sibling);
    next.states.catalog.groups = []; dom.commit(api.materializeNativeView(f.program, next));
    assert.equal(dom.root.querySelectorAll('article').length, 0); assert.equal(dom.root.querySelector('h1'), heading);
  } finally { dom.close(); }
});

test('both native projection and XTension materialization share the same depth-first typed scope traversal', () => {
  const f = fixture(), rows = [];
  sharedScopes.expandRepeatScopes([outer, inner], f.snapshot, (keys, item) => rows.push([keys, item.label]));
  assert.deepEqual(rows, [[['g', 1], 'number'], [['g', '1'], 'string'], [['h', 1], 'other parent']]);
  assert.deepEqual(sharedScopes.templatePath({ state: 'catalog', path: ['groups', { repeat: 0 }, 'products', { repeat: 1 }, 'label'] }, { repeat: [outer, inner] }, ['g', 1]),
    ['groups', { key: { path: ['id'], value: 'g' } }, 'products', { key: { path: ['id'], value: 1 } }, 'label']);
});

for (const [label, update] of [
  ['duplicate keys', f => { f.snapshot.states.catalog.groups[0].products[1].id = 1; }],
  ['missing key', f => { delete f.snapshot.states.catalog.groups[0].products[0].id; }],
  ['negative key', f => { f.snapshot.states.catalog.groups[0].products[0].id = -1; }],
  ['negative zero key', f => { f.snapshot.states.catalog.groups[0].products[0].id = -0; }],
  ['padded key', f => { f.snapshot.states.catalog.groups[0].products[0].id = ' padded '; }],
  ['empty key', f => { f.snapshot.states.catalog.groups[0].products[0].id = ''; }],
  ['wrong collection', f => { f.snapshot.states.catalog.groups[0].products = {}; }],
  ['nonboolean guard', f => { f.snapshot.states.catalog.groups[0].products[0].enabled = 1; }],
  ['object text', f => { f.snapshot.states.catalog.title = { label: 'cannot stringify objects' }; }],
  ['unknown Model path', f => { delete f.snapshot.states.catalog.title; }]
]) test(`invalid ${label} fails before any shared-renderer mutation`, async () => {
  const f = fixture(), dom = await domFixture();
  try {
    dom.commit(api.materializeNativeView(f.program, f.snapshot)); const before = dom.root.innerHTML, nodes = [...dom.root.querySelectorAll('*')];
    update(f); assert.throws(() => api.materializeNativeView(f.program, f.snapshot), TypeError);
    assert.equal(dom.root.innerHTML, before); assert.deepEqual([...dom.root.querySelectorAll('*')], nodes);
  } finally { dom.close(); }
});

test('validation rejects malformed scope chains, undeclared symbols, duplicate declarations and raw projection escapes', () => {
  for (const change of [
    f => { f.program.render.root.children[1].children[0].children[0].repeat[0].key = ['other']; },
    f => { f.program.render.root.children[0].children[0].value = projected(path('missing')); },
    f => { f.program.render.root.children[0].children[0].value = projected(path('catalog', [{ repeat: 0 }])); },
    f => { f.program.render.root.children[0].nativeDeclarationId = 'native:title'; },
    f => { f.program.render.root.children[0].children[0].value = { op: 'path', path: '$model.catalog.title' }; },
    f => { f.program.render.root.children[0].children[0].value = projected({ kind: 'call', callee: 'run' }); },
    f => { f.program.render.root.children[0].children[0].value = projected({ kind: 'object', fields: {} }); },
    f => { f.program.render.root.children[0].children[0].value = projected(path('catalog', ['constructor'])); }
  ]) { const f = fixture(); change(f); assert.throws(() => api.validateNativeViewProgram(f.program), TypeError); }
});

test('compiled and snapshot accessors are rejected without running their getters', () => {
  const f = fixture(); let reads = 0;
  Object.defineProperty(f.program.render.root.children[0].attributes, 'title', { enumerable: true, get() { reads++; return literal('unsafe'); } });
  assert.throws(() => api.validateNativeViewProgram(f.program)); assert.equal(reads, 0);
  const g = fixture(), snapshot = { get states() { reads++; return g.snapshot.states; } };
  assert.throws(() => api.materializeNativeView(g.program, snapshot)); assert.equal(reads, 0);
  Object.defineProperty(g.snapshot.states.catalog, 'title', { enumerable: true, get() { reads++; return 'unsafe'; } });
  assert.throws(() => api.materializeNativeView(g.program, g.snapshot)); assert.equal(reads, 0);
});

test('reserved attributes, executable sinks, unsupported properties/tags and repeated DOM ids are closed', () => {
  for (const name of ['onclick', 'style', 'srcdoc', 'part', 'slot', 'data-rmt-key', 'data-maraca-surface', 'data-xt-surface-transitioning', 'data-xtend-owner', 'data-rmtx-owner']) {
    const f = fixture(); f.program.render.root.children[0].attributes[name] = literal('forbidden');
    assert.throws(() => api.validateNativeViewProgram(f.program), /Native attributes/);
  }
  const f = fixture(); f.program.render.root.children[0].properties.innerHTML = literal('<script>'); assert.throws(() => api.validateNativeViewProgram(f.program), /properties/);
  const g = fixture(); g.program.render.root.children[0].tag = 'script'; assert.throws(() => api.validateNativeViewProgram(g.program), /HTML/);
  const h = fixture(); h.program.render.root.children[1].children[0].attributes.id = projected(path('catalog', ['title'])); assert.throws(() => api.validateNativeViewProgram(h.program), /DOM ids/);
  const dynamic = fixture(); dynamic.program.render.root.children[0].attributes.id = projected(path('catalog', ['title'])); assert.throws(() => api.validateNativeViewProgram(dynamic.program), /static literal/);
});

test('boolean/native-property sinks reject coercion and scalar failures before committing anything', () => {
  for (const [kind, name, value] of [['properties', 'checked', 'false'], ['attributes', 'hidden', 0], ['properties', 'tabIndex', 1.5], ['properties', 'title', 1], ['properties', 'value', true]]) {
    const f = fixture(); f.program.render.root.children[0][kind][name] = literal(value);
    assert.throws(() => api.materializeNativeView(f.program, f.snapshot), /Native/);
  }
});

test('native root projection preserves source mutability and existing static portal/Surface descriptors', () => {
  const f = fixture(), target = element('native:portal', 'div', [], { id: literal('framework-target') });
  target.children.push(surface('provider', 'div'));
  target.children[0].attributes.tone = undefined;
  f.program.surfaces.push({ id: 'provider', component: 'div', kind: 'region' }); f.program.render.root.children.push(target);
  const root = copy(f.program.render.root), before = copy(root), result = api.materializeNativeView(f.program, f.snapshot, root);
  assert.deepEqual(root, before); assert(!Object.isFrozen(root.attributes));
  assert.deepEqual(result.children.at(-1).children[0], JSON.parse(JSON.stringify(target.children[0])));
  const conditional = fixture(); conditional.program.render.root.children.push({ type: 'native-when', nativeDeclarationId: 'native:portal-when', test: { kind: 'literal', value: true }, children: [target] });
  conditional.program.surfaces.push({ id: 'provider', component: 'div', kind: 'region' });
  assert.throws(() => api.validateNativeViewProgram(conditional.program), /independently orchestrated/);
});

test('oversized encoded keys reject instead of truncating or aliasing DOM identities', () => {
  const f = fixture(); f.program.render.nativeView.documentId = 'x'.repeat(api.NATIVE_VIEW_MAX_KEY_LENGTH);
  assert.throws(() => api.materializeNativeView(f.program, f.snapshot), /4096-code-unit/);
});

test('native DOM ids are static selector-safe tokens and null explicitly means no id', () => {
  for (const id of ['has:colon', 'has.dot', '1leading', 'has space', ' padded ', '']) {
    const f = fixture(); f.program.render.root.children[0].attributes.id = literal(id);
    assert.throws(() => api.validateNativeViewProgram(f.program), /selector-safe/);
  }
  const f = fixture(); f.program.render.root.children[0].attributes.id = literal(null);
  assert.equal(api.materializeNativeView(f.program, f.snapshot).children[0].attributes.id.value, null);
});

test('compiled Native ids have only the attributes.id channel after source-level canonicalization', () => {
  for (const value of [literal('target'), literal(null), projected(path('catalog', ['title']))]) {
    for (const attribute of [undefined, literal('other-target'), literal(null), literal('target')]) {
      const f = fixture(), node = f.program.render.root.children[0]; node.properties.id = value;
      if (attribute !== undefined) node.attributes.id = attribute;
      assert.throws(() => api.validateNativeViewProgram(f.program), /canonical attributes.id/);
    }
  }
});

test('forged Surface wrappers and untracked legacy descriptor escapes cannot bypass the native HTML grammar', () => {
  for (const tag of ['script', 'style', 'template', 'x-untracked']) {
    const f = fixture(); f.program.surfaces[0].component = tag; f.program.render.root.tag = tag;
    assert.throws(() => api.validateNativeViewProgram(f.program), /safe HTML/);
  }
  for (const mutate of [
    f => { f.program.render.root.tag = 'article'; },
    f => { f.program.render.root.key = 'forged'; },
    f => { f.program.render.root.id = 'forged'; },
    f => { f.program.render.root.attributes['data-rmt-surface'] = literal('forged'); },
    f => { f.program.render.root.attributes.id = literal('untracked-id'); },
    f => { f.program.render.root.children.push({ type: 'element', tag: 'style', text: 'raw' }); },
    f => { f.program.render.root.children.push({ type: 'text', text: 'untracked' }); },
    f => { f.program.render.root.children.push('untracked raw text'); },
    f => { f.program.render.root.children = { type: 'text', text: 'untracked object' }; },
    f => { f.program.render.root.children.push({ type: 'repeat', source: '$model.rows', template: { type: 'text', text: '$item' } }); }
  ]) { const f = fixture(); mutate(f); assert.throws(() => api.validateNativeViewProgram(f.program), TypeError); }
});

test('canonical Native data rejects raw negative zero before JSON cloning can hide its sign', () => {
  assert.throws(() => api.assertNativeCanonicalData({ value: -0 }), /negative zero/);
  const f = fixture(); f.snapshot.states.catalog.groups[0].products[0].id = -0;
  assert.throws(() => api.materializeNativeView(f.program, f.snapshot), /negative zero/);
  const program = fixture(); program.program.state.states[0].initial.title = -0;
  assert.throws(() => api.validateNativeViewProgram(program.program), /negative zero/);
});

test('canonical Native data rejects getters before reading them and preserves legacy data policy', () => {
  let reads = 0; const value = { get data() { reads++; return -0; } };
  assert.throws(() => api.assertNativeCanonicalData(value), /accessor/); assert.equal(reads, 0);
  assert.doesNotThrow(() => require('../../tools/xtensions/state-binding-contract').data({ value: -0 }));
});

test('canonical zero and optional in-memory compiler fields remain accepted in the explicit Native port', () => {
  assert.doesNotThrow(() => api.assertNativeCanonicalData({ value: 0, rows: [0, '0'] }));
  assert.doesNotThrow(() => api.assertNativeCanonicalData({ optional: undefined, value: 0 }, true));
  assert.throws(() => api.assertNativeCanonicalData({ optional: undefined }), /JSON/);
});

test('canonical Native data accepts genuine cross-realm JSON objects and nested arrays without changing the originals', () => {
  const vm = require('node:vm'), value = vm.runInNewContext('({ value: 0, rows: [{ id: 1 }, { id: "1", values: [null, false, "text"] }] })');
  const prototype = Object.getPrototypeOf(value), row = value.rows[0], before = JSON.stringify(value);
  assert.notEqual(prototype, Object.prototype);
  assert.doesNotThrow(() => api.assertNativeCanonicalData(value));
  assert.equal(Object.getPrototypeOf(value), prototype); assert.equal(value.rows[0], row); assert.equal(JSON.stringify(value), before);
  assert.throws(() => require('../../tools/xtensions/state-binding-contract').data(value), /plain objects/);
});

test('cross-realm Native data never reads an accessor while inspecting its descriptors', () => {
  const vm = require('node:vm'), context = vm.createContext({ reads: 0 });
  const value = vm.runInContext('({ nested: { get value() { reads++; return 0; } } })', context);
  assert.throws(() => api.assertNativeCanonicalData(value), /accessor/); assert.equal(context.reads, 0);
});

test('foreign native prototypes cannot introduce an inherited JSON normalization hook or accessor', () => {
  const vm = require('node:vm');
  for (const expression of ['Object.prototype', 'Array.prototype']) {
    const context = vm.createContext({ reads: 0 });
    const value = vm.runInContext(`Object.defineProperty(${expression}, 'toJSON', { get() { reads++; return () => ({ value: -0 }); } }); ({ rows: [1] })`, context);
    assert.throws(() => api.assertNativeCanonicalData(value), /serialization hooks/); assert.equal(context.reads, 0);
  }
});

test('cross-realm Native data does not admit class, DOM or forged native prototypes', () => {
  const vm = require('node:vm'), dom = new JSDOM('<main></main>');
  try {
    for (const value of [vm.runInNewContext('new (class Record { constructor() { this.value = 0; } })()'),
      vm.runInNewContext('new (class Items extends Array {})(0)'), dom.window.document.querySelector('main'),
      Object.create(Object.assign(Object.create(null), { constructor: Object }))]) {
      assert.throws(() => api.assertNativeCanonicalData(value), /plain objects/);
    }
  } finally { dom.window.close(); }
});

test('cross-realm Native adaptation preserves negative zero and rejects cycles and sparse JSON arrays', () => {
  const vm = require('node:vm'), negative = vm.runInNewContext('({ rows: [{ value: -0 }] })');
  assert.throws(() => api.assertNativeCanonicalData(negative), /negative zero/); assert(Object.is(negative.rows[0].value, -0));
  for (const expression of ['(() => { const value = {}; value.self = value; return value; })()', '[,1]']) {
    assert.throws(() => api.assertNativeCanonicalData(vm.runInNewContext(expression)), /acyclic|dense/);
  }
});

test('the actual regular Native-only build plan enters the public PlanRuntime without a serialized DTO workaround', async () => {
  const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-native-direct-plan-'));
  const { createXtendFabric } = require('../../fabric/xtend-fabric'), fabric = createXtendFabric();
  let runtime;
  try {
    const build = await require('../../development/rmtx-a06/native-view-profile/reference.cjs').build(temporary, true);
    assert.equal(build.ok, true, build.status); assert.equal(build.plan.schema, 'xtend.maraca.build-plan.v9');
    const foreign = [];
    function inspect(value) { if (!value || typeof value !== 'object') return; if (!Array.isArray(value) && ![null, Object.prototype].includes(Object.getPrototypeOf(value))) foreign.push(value); Object.values(value).forEach(inspect); }
    inspect(build.plan.performance); assert(foreign.length > 0, 'real VM performance factory values must remain in the actual build plan');
    const { createMaracaPlanRuntime } = await import('../../xtend-maraca/plan-runtime.mjs');
    runtime = createMaracaPlanRuntime({ plan: build.plan, root: {}, fabric, nativeViewRuntimePort: api });
    assert.equal(runtime.schema, 'xtend.maraca.plan-runtime.v14');
    assert(foreign.every(value => Object.getPrototypeOf(value) !== Object.prototype), 'Native validation must not mutate official factory data');
  } finally { runtime?.dispose(); fabric.dispose?.(); fs.rmSync(temporary, { recursive: true, force: true }); }
});

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const { compileRmtClassicSource } = require('../../tools/rmt-language/classic-compiler');
const routerModule = import(pathToFileURL(path.join(root, 'xtendrmt/rmt-event-routing-runtime.js')));
const modelModule = import(pathToFileURL(path.join(root, 'xtendrmt/rmt-state-selector-runtime.js')));

function compile(expression) {
  const result = compileRmtClassicSource(`template guardtest {
    state app type object initial { ready true; count 2; name "alpha" }
    selector selected from state app { output object }
    action save { input id string; reduce state.app.count = 3 }
    surface panel kind panel component x-section {
      lane visible { hydrate panel from state app }
      on click "x-section" -> action save when ${expression} {
        payload id from detail.id
        preventDefault true
      }
    }
  }`);
  assert(result.ok, JSON.stringify(result.diagnostics));
  return result;
}

async function runtime(condition, options = {}) {
  const { createRmtEventRoutingRuntime } = await routerModule;
  const commands = [];
  const router = createRmtEventRoutingRuntime({
    events: [{ id: 'test', event: 'submit', action: 'save', condition, payload: '$detail', ...options.binding }],
    commandRuntime: { dispatchCommand(command) { commands.push(command); return { status: 'success' }; } },
    ...(options.modelReader ? { modelReader: options.modelReader } : {})
  });
  return { router, commands };
}

test('compiler condition reaches the event artifact and false blocks before payload or DOM governance', async () => {
  const result = compile('false'), binding = result.orchestrationArtifacts.events[0];
  assert.deepEqual(binding.condition, result.coreDocument.events[0].condition);
  const { createRmtEventRoutingRuntime } = await routerModule;
  let sideEffects = 0;
  const router = createRmtEventRoutingRuntime({ events: [binding], commandRuntime: { dispatchCommand() { sideEffects += 1; } } });
  const detail = Object.defineProperty({}, 'id', { enumerable: true, get() { sideEffects += 1; throw Error('must not map payload'); } });
  const outcome = await router.routeEvent(binding.id, { detail, preventDefault() { sideEffects += 1; } });
  assert.equal(outcome.status, 'skipped'); assert.equal(outcome.reason, 'condition'); assert.equal(sideEffects, 0);
  router.dispose();
});

test('compound compiled guards read live Model, Selector, detail and target values', async () => {
  const compiled = compile('app.ready && state.app.count >= 2 && selector.selected.name == "alpha" && detail.id == "x" && target.value != "blocked"');
  const { createRmtStateSelectorRuntime } = await modelModule;
  const model = createRmtStateSelectorRuntime(compiled.orchestrationArtifacts.state);
  const { router, commands } = await runtime(compiled.coreDocument.events[0].condition, { modelReader: model.modelReader });
  const event = { detail: { id: 'x' }, target: { value: 'allowed' } };
  assert.equal((await router.routeEvent('test', event)).status, 'success');
  model.modelCommandPort.apply({ operation: 'set', state: 'app', value: { ready: false, count: 2, name: 'alpha' } });
  assert.equal((await router.routeEvent('test', event)).status, 'skipped');
  assert.equal(commands.length, 1);
  router.dispose();
});

test('Classic negation precedence and strict equality survive Core expression evaluation', async () => {
  for (const [expression, expected] of [['!detail.name == null', 'success'], ['(!detail.name) == null', 'skipped'], ['detail.count == "2"', 'skipped'], ['detail.count < 3 && detail.count > 1', 'success']]) {
    const { router } = await runtime(compile(expression).coreDocument.events[0].condition);
    assert.equal((await router.routeEvent('test', { detail: { name: 'alpha', count: 2 } })).status, expected, expression);
    router.dispose();
  }
});

test('logical RHS values inside comparisons match the compiled Model selector semantics', async () => {
  const { createRmtStateSelectorRuntime } = await modelModule;
  for (const [expression, detail] of [
    ['(detail.a && detail.b) == "x"', { a: true, b: 'x' }],
    ['(detail.a || detail.b) == "x"', { a: false, b: 'x' }],
    ['(detail.a || detail.b) == true', { a: 'left', b: 'x' }],
    ['(detail.a && detail.b) == false', { a: false, b: 'x' }]
  ]) {
    const selected = compileRmtClassicSource(`state rows type array initial []\nselector matched from state rows { where ${expression.replaceAll('detail.', 'item.')} }`);
    assert(selected.ok, JSON.stringify(selected.diagnostics));
    const model = createRmtStateSelectorRuntime(selected.orchestrationArtifacts.state);
    model.modelCommandPort.apply({ operation: 'set', state: 'rows', value: [detail] });
    const expected = model.modelReader.select('matched').length === 1;
    const { router } = await runtime(compile(expression).coreDocument.events[0].condition);
    assert.equal((await router.routeEvent('test', { detail })).status === 'success', expected, expression);
    assert.equal(expected, true); router.dispose();
  }
});

test('compiled event guards read native input value and dataset through actual DOM events', async () => {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<main><input data-id="row"></main>');
  const target = dom.window.document.querySelector('input'); target.value = 'allowed';
  const condition = compile('target.value == "allowed" && target.dataset.id == detail.id').coreDocument.events[0].condition;
  const { router, commands } = await runtime(condition, { binding: { event: 'change', target } });
  try {
    router.attach(dom.window.document.querySelector('main'));
    target.dispatchEvent(new dom.window.CustomEvent('change', { bubbles: true, detail: { id: 'row' } }));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(commands.length, 1); assert.equal(commands[0].payload.id, 'row');
    target.value = 'blocked';
    target.dispatchEvent(new dom.window.CustomEvent('change', { bubbles: true, detail: { id: 'row' } }));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(commands.length, 1);
    assert.deepEqual(router.listRoutes().map(entry => entry.status), ['success', 'skipped']);
  } finally { router.dispose(); dom.window.close(); }
});

test('longest declared Model symbol wins; explicit namespaces disambiguate State and Selector', async () => {
  const snapshot = { states: { app: { status: { ready: false } }, 'app.status': { ready: true } }, selectors: { 'app.status': { ready: false } } };
  for (const [parts, expected] of [[['state', 'app', 'status', 'ready'], 'success'], [['selector', 'app', 'status', 'ready'], 'skipped'], [['app', 'status', 'ready'], 'skipped']]) {
    const { router } = await runtime({ kind: 'path', path: parts }, { modelReader: { snapshot: () => snapshot } });
    assert.equal((await router.routeEvent('test')).status, expected); router.dispose();
  }
});

test('one snapshot supplies the whole guard and short circuit does not read an unused event getter', async () => {
  let reads = 0, getterReads = 0;
  const snapshot = { states: { app: { ready: true, count: 2 } } };
  const guard = compile('app.ready && app.count == 2 || detail.unused').coreDocument.events[0].condition;
  const { router } = await runtime(guard, { modelReader: { snapshot() { reads += 1; return snapshot; } } });
  const detail = Object.defineProperty({}, 'unused', { get() { getterReads += 1; return false; } });
  assert.equal((await router.routeEvent('test', { detail })).status, 'success');
  assert.equal(reads, 1); assert.equal(getterReads, 0); router.dispose();
});

test('boolean guards and the when alias preserve false rather than normalizing it away', async () => {
  for (const [condition, expected] of [[false, 'skipped'], [true, 'success'], [null, 'success']]) {
    const { router } = await runtime(condition); assert.equal((await router.routeEvent('test')).status, expected); router.dispose();
  }
  const { createRmtEventRoutingRuntime } = await routerModule;
  for (const fields of [{ when: false }, { condition: undefined, when: false }]) {
    const router = createRmtEventRoutingRuntime({ events: [{ id: 'test', action: 'save', ...fields }], commandRuntime: { dispatchCommand() { throw Error('must not dispatch'); } } });
    assert.equal((await router.routeEvent('test')).status, 'skipped'); router.dispose();
  }
});

test('legacy equality, falsy, includes and keyboard guard records retain their behavior', async () => {
  for (const [condition, event, expected] of [
    [{ left: '$event.key', op: 'equals', right: 'Escape' }, { key: 'Escape' }, 'success'],
    [{ left: '$event.key', op: 'equals', right: 'Escape' }, { key: 'Enter' }, 'skipped'],
    [{ left: '$detail.value', op: 'not-equals', right: 3 }, { detail: { value: 2 } }, 'success'],
    [{ value: '$detail.cancelled', op: 'falsy' }, { detail: {} }, 'success'],
    [{ left: '$detail.tags', op: 'includes', right: 'a' }, { detail: { tags: ['a'] } }, 'success']
  ]) { const { router } = await runtime(condition); assert.equal((await router.routeEvent('test', event)).status, expected); router.dispose(); }
});

test('unsupported or malformed guards fail closed, including an invalid unused logical branch', async () => {
  const literal = value => ({ kind: 'literal', value });
  const cycle = { kind: 'group' }; cycle.expression = cycle;
  const conditions = [
    { op: 'unknown', value: true }, { op: 'equals' }, { kind: 'condition' }, { kind: 'literal', value: true, extra: true },
    { kind: 'unary', op: '!', argument: { kind: 'path', path: ['missing'] } },
    { kind: 'logical', op: '||', left: literal(true), right: { kind: 'call', name: 'run' } },
    { kind: 'path', path: ['detail', 'constructor'] }, { kind: 'literal', value: Infinity }, cycle
  ];
  for (const condition of conditions) {
    const { router, commands } = await runtime(condition);
    assert.equal((await router.routeEvent('test', { detail: {} })).status, 'skipped'); assert.equal(commands.length, 0); router.dispose();
  }
});

test('guard AST accessors and plain event-data getters are never invoked', async () => {
  let reads = 0;
  const accessor = Object.defineProperty({}, 'kind', { enumerable: true, get() { reads += 1; return 'literal'; } });
  const pathWithGetter = ['detail']; Object.defineProperty(pathWithGetter, '1', { get() { reads += 1; return 'value'; } });
  const detail = Object.defineProperty({}, 'value', { get() { reads += 1; return true; } });
  for (const condition of [accessor, { kind: 'path', path: pathWithGetter }, { kind: 'path', path: ['detail', 'value'] }]) {
    const { router } = await runtime(condition); assert.equal((await router.routeEvent('test', { detail })).status, 'skipped'); router.dispose();
  }
  assert.equal(reads, 0);
});

test('invalid or failing Model ports cannot grant an event and module API declares the new behavior', async () => {
  const api = await routerModule;
  assert.equal(api.RMT_EVENT_ROUTING_API_VERSION, '4.0.0');
  assert.throws(() => api.createRmtEventRoutingRuntime({ modelReader: {} }), /snapshot port/);
  for (const modelReader of [undefined, { snapshot() { throw Error('unavailable'); } }]) {
    const { router, commands } = await runtime({ kind: 'path', path: ['app', 'ready'] }, { modelReader });
    assert.equal((await router.routeEvent('test')).status, 'skipped'); assert.equal(commands.length, 0); router.dispose();
  }
});

test('Kernel MVC declares the Event Router Model reader without granting state writes', () => {
  const { analyzeKernelMvcArchitecture } = require('../../xtend-builder/generators/rmt-kernel-lab');
  const manifest = require('../../xtendrmt/kernel/rmt-kernel-sources.json');
  const module = manifest.modules.find(entry => entry.id === 'rmt-event-routing-runtime-source');
  assert(module.ports.includes('RmtModelReader')); assert(module.capabilities.includes('state.read'));
  assert(!module.capabilities.includes('state.write')); assert.equal(module.compatibility, undefined);
  const report = analyzeKernelMvcArchitecture({ rootDir: root, manifest });
  assert(report.ok, JSON.stringify(report.violations));
  const observed = report.entries.find(entry => entry.id === module.id).observedCapabilities;
  assert(observed.includes('state.read')); assert(!observed.includes('state.write'));
  const missingRead = structuredClone(manifest);
  missingRead.modules.find(entry => entry.id === module.id).capabilities = module.capabilities.filter(capability => capability !== 'state.read');
  const rejected = analyzeKernelMvcArchitecture({ rootDir: root, manifest: missingRead });
  assert(!rejected.ok);
  assert(rejected.violations.some(entry => entry.code === 'xtend.rmt.kernel_mvc.capability_undeclared' && entry.moduleId === module.id && entry.capability === 'state.read'));
});

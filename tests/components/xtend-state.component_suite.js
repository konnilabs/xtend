const vm = require('vm');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    }
  };
}

function loadClassicRuntime(source, storage = createStorage()) {
  const browserEvents = [];
  const windowTarget = {
    XTend: {},
    dispatchEvent(event) {
      browserEvents.push(event);
      return true;
    }
  };
  class TestCustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }
  const executableSource = source
    .replace(/^export\s*\{[\s\S]*?\};?\s*$/gmu, '')
    .concat('\nglobalThis.__xtendStateUnderTest = xtendState;')
    .concat('\nglobalThis.__singletonIdentity = window.XTend.state === xtendState;');
  const sandbox = {
    console: { log() {}, error() {} },
    CustomEvent: TestCustomEvent,
    globalThis: null,
    localStorage: storage,
    module: { exports: {} },
    sessionStorage: createStorage(),
    window: windowTarget
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(executableSource, sandbox, { filename: 'components/xtend-state.js' });
  return {
    browserEvents,
    runtime: sandbox.__xtendStateUnderTest,
    singletonIdentity: sandbox.__singletonIdentity,
    storage,
    windowTarget
  };
}

function runXTendStateComponentSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'component:xtend-state',
    label: 'XTend State boundary component contract'
  });
  const manifest = readJson('components/manifest.json', rootDir);
  const source = readText('components/xtend-state.js', rootDir);
  const types = readText('components/xtend-state.d.ts', rootDir);
  const fixture = readText('tests/components/fixtures/xtend-state.component.html', rootDir);
  const docs = readText('docs/en/components/xtend-state.md', rootDir);
  const syntaxCheck = syntaxCheckFile('components/xtend-state.js', {
    rootDir,
    extension: '.js'
  });

  context.assert(manifest['xtend-state'] === './xtend-state.js', 'xtend-state manifest entry points to local source');
  context.assert(syntaxCheck.ok, `XTend State source passes syntax check${syntaxCheck.ok ? '' : ` (${syntaxCheck.message})`}`);
  context.assert(!source.includes('customElements.define'), 'XTend State does not register a visual Custom Element');
  context.assertIncludes(source, 'xtend.state.boundary-probe.v1', 'XTend State declares boundary-probe schema');
  context.assertIncludes(source, 'xtend.rmt.state-scheduler-compatibility.v2', 'XTend State declares RMT state scheduler compatibility');
  context.assertIncludes(source, 'xtend.fabric.state-diagnostics.v1', 'XTend State declares Fabric diagnostics schema');
  context.assertIncludes(source, 'xtend.state.lifecycle-event.v1', 'XTend State declares lifecycle event schema');
  context.assertIncludes(source, "new CustomEvent('xtend-state:lifecycle'", 'XTend State dispatches the canonical lifecycle event');
  context.assertIncludes(source, 'window.XTend.state = xtendState', 'XTend State publishes the singleton on the XTend namespace');
  context.assertIncludes(source, "const XTEND_STATE_STORAGE_KEY = 'xtend-state-data'", 'XTend State uses the 0.7 storage key');

  context.assertIncludes(types, 'interface XTendStateRuntime', 'Classic state types declare the runtime interface');
  context.assertIncludes(types, 'XTendStateBoundaryContract', 'Classic state types declare the boundary contract');
  context.assertIncludes(types, 'XTendStateRmtStateAdapter', 'Classic state types declare the RMT adapter');
  context.assertIncludes(types, 'batchUpdate(updates: Record<string, unknown>): void', 'Classic state adapter types expose atomic batch projection');
  context.assertIncludes(types, "'xtend-state:lifecycle'", 'Classic state types expose the canonical lifecycle event');
  context.assertIncludes(types, 'export declare const xtendState: XTendStateRuntime', 'Classic state types expose the singleton');

  const contract = loadClassicRuntime(source);
  const { runtime } = contract;
  context.assert(contract.singletonIdentity === true, 'browser namespace and ESM binding share one singleton');
  runtime.clear();
  const observed = [];
  const unsubscribe = runtime.subscribe((key, value, allData) => observed.push({ key, value, allData }), ['alpha', 'beta']);
  context.assert(observed.length === 1 && observed[0].key === null, 'subscribe immediately emits the current snapshot');
  runtime.set('ignored', 1);
  runtime.set('alpha', 2);
  context.assert(observed.length === 2 && observed[1].value === 2, 'key-filtered subscriptions receive matching set operations only');
  runtime.batchUpdate({ alpha: 3, beta: 4 });
  context.assert(observed.length === 3 && observed[2].key === 'batch-update', 'batch updates retain the Classic callback contract');
  unsubscribe();
  runtime.set('alpha', 5);
  context.assert(observed.length === 3, 'unsubscribe stops subsequent callbacks');
  runtime.setPath('profile.name', 'Ada');
  context.assert(runtime.getPath('profile.name') === 'Ada', 'path reads and writes remain available');
  const diagnostics = runtime.snapshotDiagnostics();
  context.assert(diagnostics.source === 'xtend-state' && diagnostics.operationCounts.set >= 3, 'diagnostics retain operation counters under the new source');
  context.assert(contract.browserEvents.length > 0 && contract.browserEvents.every((event) => event.type === 'xtend-state:lifecycle'), 'Classic runtime emits only the canonical browser lifecycle event');

  const persisted = loadClassicRuntime(source);
  persisted.runtime.set('saved', true);
  persisted.runtime.saveToStorage();
  context.assert(persisted.storage.getItem('xtend-state-data') === '{"saved":true}', 'default persistence writes the new storage key');

  const legacyStorage = createStorage({ 'xstate-data': '{"migrated":42}' });
  const migrated = loadClassicRuntime(source, legacyStorage);
  context.assert(migrated.runtime.loadFromStorage() === true && migrated.runtime.get('migrated') === 42, 'valid legacy data migrates once');
  context.assert(legacyStorage.getItem('xtend-state-data') === '{"migrated":42}' && legacyStorage.getItem('xstate-data') === null, 'legacy data is removed only after the new value is written');

  const invalidStorage = createStorage({ 'xtend-state-data': '{broken' });
  const invalid = loadClassicRuntime(source, invalidStorage);
  context.assert(invalid.runtime.loadFromStorage() === false, 'malformed persisted JSON is rejected');

  const failingStorage = createStorage({ 'xstate-data': '{"preserved":true}' });
  const originalSetItem = failingStorage.setItem;
  failingStorage.setItem = (key, value) => {
    if (key === 'xtend-state-data') throw new Error('quota');
    originalSetItem.call(failingStorage, key, value);
  };
  const failedMigration = loadClassicRuntime(source, failingStorage);
  context.assert(failedMigration.runtime.loadFromStorage() === false, 'failed migration writes do not load partial state');
  context.assert(failingStorage.getItem('xstate-data') === '{"preserved":true}' && failingStorage.getItem('xtend-state-data') === null, 'failed migration writes preserve the legacy value');

  context.assertIncludes(fixture, "import { xtendState } from '/components/xtend-state.js'", 'fixture imports the repo-local Classic runtime');
  context.assertIncludes(fixture, 'window.XTend.state === xtendState', 'fixture verifies singleton identity');
  context.assertIncludes(docs, '# XTend State', 'XTend State documentation is present');
  context.assertIncludes(docs, '@ccslabs/xtend/classic-state', 'XTend State docs describe the package subpath');

  return context.result({
    tag: 'xtend-state',
    profiles: ['stateful', 'infrastructure']
  });
}

function printXTendStateComponentReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend State boundary component contract erfolgreich.',
    failureTitle: 'XTend State boundary component contract fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runXTendStateComponentSuite();
  printXTendStateComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXTendStateComponentReport,
  runXTendStateComponentSuite
};

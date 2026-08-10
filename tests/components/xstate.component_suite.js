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

function runXStateComponentSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'component:xstate',
    label: 'xstate boundary component contract'
  });
  const manifest = readJson('components/manifest.json', rootDir);
  const source = readText('components/xstate.js', rootDir);
  const types = readText('components/xstate.d.ts', rootDir);
  const fixture = readText('tests/components/fixtures/xstate.component.html', rootDir);
  const docs = readText('docs/components/xstate.md', rootDir);
  const syntaxCheck = syntaxCheckFile('components/xstate.js', {
    rootDir,
    extension: '.js'
  });

  context.assert(manifest.xstate === './xstate.js', 'xstate manifest entry points to local source');
  context.assert(syntaxCheck.ok, `xstate source passes syntax check${syntaxCheck.ok ? '' : ` (${syntaxCheck.message})`}`);
  context.assert(!source.includes('customElements.define'), 'xstate does not register a visual Custom Element');
  context.assertIncludes(source, 'xtend.state.boundary-probe.v1', 'xstate declares boundary-probe schema');
  context.assertIncludes(source, 'xtend.rmt.state-scheduler-compatibility.v2', 'xstate declares RMT state scheduler compatibility');
  context.assertIncludes(source, 'xtend.fabric.state-diagnostics.v1', 'xstate declares Fabric diagnostics schema');
  context.assertIncludes(source, 'xtend.state.lifecycle-event.v1', 'xstate declares lifecycle event schema');
  context.assertIncludes(source, 'xtendStateBoundaryContract', 'xstate exposes boundary contract metadata');
  context.assertIncludes(source, 'xtendRmtMetadata', 'xstate exposes RMT metadata');
  context.assertIncludes(source, 'xtendComponentLifecycleTelemetry', 'xstate exposes lifecycle telemetry metadata');
  context.assertIncludes(source, 'subscribeLifecycle(fn)', 'xstate exposes lifecycle subscription API');
  context.assertIncludes(source, 'snapshot()', 'xstate exposes snapshot API');
  context.assertIncludes(source, 'snapshotDiagnostics()', 'xstate exposes diagnostics snapshot API');
  context.assertIncludes(source, 'createRmtStateAdapter(options = {})', 'xstate exposes RMT state adapter factory');
  context.assertIncludes(source, 'batchUpdate: this.batchUpdate.bind(this)', 'xstate RMT adapter exposes atomic batch projection');
  context.assertIncludes(source, 'no-rmt-kernel-import-of-xtend-types', 'xstate preserves RMT kernel boundary');
  context.assertIncludes(source, 'rmt.bridge.ready', 'xstate documents RMT bridge ready key');
  context.assertIncludes(source, 'rmt.scheduler.lastEndpoint', 'xstate documents RMT scheduler endpoint key');

  context.assertIncludes(types, 'XStateApi', 'xstate public types declare API interface');
  context.assertIncludes(types, 'XStateBoundaryContract', 'xstate public types declare boundary contract');
  context.assertIncludes(types, 'XStateRmtStateAdapter', 'xstate public types declare RMT state adapter');
  context.assertIncludes(types, 'batchUpdate(updates: Record<string, unknown>): void', 'xstate RMT adapter types expose atomic batch projection');
  context.assertIncludes(types, 'XStateDiagnosticsSnapshot', 'xstate public types declare diagnostics snapshot');
  context.assertIncludes(types, 'XStateLifecycleEventDetail', 'xstate public types declare lifecycle detail');
  context.assertIncludes(types, 'addEventListener<K extends keyof XStateEventMap>', 'xstate public types expose typed lifecycle event listener overload');

  context.assertIncludes(fixture, "import { xstate } from '/components/xstate.js'", 'xstate fixture imports repo-local module');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de'), 'xstate fixture has no CDN dependency');
  context.assertIncludes(fixture, 'data-boundary="adapter-probe"', 'xstate fixture marks non-visual boundary probe');
  context.assertIncludes(fixture, 'subscribeLifecycle', 'xstate fixture observes lifecycle events');
  context.assertIncludes(fixture, 'createRmtStateAdapter', 'xstate fixture creates RMT state adapter');
  context.assertIncludes(fixture, 'snapshotDiagnostics', 'xstate fixture reads Fabric diagnostics');
  context.assertIncludes(fixture, 'rmt.route.docs.lastResult', 'xstate fixture mirrors RMT route result');
  context.assertIncludes(fixture, '__xtendComponentResult', 'xstate fixture records component result contract');

  context.assertIncludes(docs, '# xstate', 'xstate documentation is present');
  context.assertIncludes(docs, 'xtend-loader.js', 'xstate docs describe loader integration');
  context.assertIncludes(docs, 'components/manifest.json', 'xstate docs reference the component manifest');
  context.assertIncludes(docs, 'RMT Hosts', 'xstate docs describe RMT host integration');

  return context.result({
    tag: 'xstate',
    profiles: ['stateful', 'infrastructure']
  });
}

function printXStateComponentReport(result) {
  printSuiteReport(result, {
    successTitle: 'xstate boundary component contract erfolgreich.',
    failureTitle: 'xstate boundary component contract fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runXStateComponentSuite();
  printXStateComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXStateComponentReport,
  runXStateComponentSuite
};

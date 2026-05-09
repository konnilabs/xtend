const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  CONTRACTS,
  createConsoleReporter,
  createNoopReporter,
  createReporterAdapter,
  createTestReporter,
  createXtendFabric
} = require('../../fabric/xtend-fabric');

function runFabricReporterAdapterSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'fabric-reporters',
    label: 'XTend-Fabric reporter adapter contract'
  });
  const { assert } = context;
  const source = readText('fabric/xtend-fabric.js', rootDir);
  const syntax = syntaxCheckFile('fabric/xtend-fabric.js', { rootDir, extension: '.js' });

  assert(syntax.ok, `Fabric runtime syntax check passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  context.assertIncludes(source, 'xtend.fabric.reporter.v1', 'Fabric runtime declares reporter contract');
  context.assertIncludes(source, 'createReporterAdapter', 'Fabric runtime exposes reporter adapter factory');
  context.assertIncludes(source, 'createConsoleReporter', 'Fabric runtime exposes console reporter factory');
  context.assertIncludes(source, 'createTestReporter', 'Fabric runtime exposes test reporter factory');
  context.assertIncludes(source, 'REPORTER_LEVEL_ORDER', 'Fabric runtime defines reporter severity ordering');

  assert(CONTRACTS.reporter === 'xtend.fabric.reporter.v1', 'Fabric exports reporter contract');
  assert(createNoopReporter().kind === 'noop', 'Noop reporter factory remains available');
  assert(typeof createReporterAdapter === 'function', 'Reporter adapter factory is exported');
  assert(typeof createConsoleReporter === 'function', 'Console reporter factory is exported');
  assert(typeof createTestReporter === 'function', 'Test reporter factory is exported');

  const fabric = createXtendFabric({
    idPrefix: 'reporter.fabric',
    now: () => new Date('2026-05-06T12:00:00.000Z')
  });

  assert(fabric.getReporters().length === 1 && fabric.getReporters()[0].id === 'noop', 'Fabric default uses only noop reporter');
  assert(typeof fabric.createReporterAdapter === 'function', 'Fabric instance exposes reporter adapter factory');
  assert(typeof fabric.createConsoleReporter === 'function', 'Fabric instance exposes console reporter factory');
  assert(typeof fabric.createTestReporter === 'function', 'Fabric instance exposes test reporter factory');

  const testReporter = createTestReporter({
    id: 'memory-test',
    minimumLevel: 'warn'
  });
  const unregisterTestReporter = fabric.registerReporter(testReporter);

  fabric.emitDiagnostic({
    level: 'info',
    code: 'xtend.fabric.reporter.info_skipped',
    message: 'Info should be filtered',
    source: 'fabric',
    phase: 'report'
  });
  assert(testReporter.getEvents().length === 0, 'Test reporter respects minimum severity');

  fabric.emitDiagnostic({
    level: 'warn',
    code: 'xtend.fabric.reporter.warn_visible',
    message: 'Warn should be collected',
    source: 'fabric',
    phase: 'report',
    metadata: {
      safe: 'value',
      token: 'hidden',
      nested: {
        authorization: 'secret'
      }
    }
  });
  assert(testReporter.getEvents().length === 1, 'Test reporter collects opt-in diagnostics');
  assert(testReporter.getEvents()[0].metadata.token === '[redacted]', 'Test reporter receives redacted metadata');
  assert(testReporter.getEvents()[0].metadata.nested.authorization === '[redacted]', 'Test reporter receives deeply redacted metadata');
  assert(Array.isArray(testReporter.flush()) && testReporter.flush().length === 1, 'Test reporter flush returns collected events');
  testReporter.clear();
  assert(testReporter.getEvents().length === 0, 'Test reporter can clear collected events');

  unregisterTestReporter();
  fabric.emitDiagnostic({
    level: 'error',
    code: 'xtend.fabric.reporter.after_unregister',
    message: 'After unregister',
    source: 'fabric',
    phase: 'report'
  });
  assert(testReporter.getEvents().length === 0, 'Unregistered test reporter receives no further diagnostics');

  const consoleCalls = [];
  const fakeConsole = {
    debug: (event) => consoleCalls.push(['debug', event]),
    info: (event) => consoleCalls.push(['info', event]),
    warn: (event) => consoleCalls.push(['warn', event]),
    error: (event) => consoleCalls.push(['error', event]),
    log: (event) => consoleCalls.push(['log', event])
  };
  const consoleReporter = createConsoleReporter({
    id: 'local-console',
    console: fakeConsole,
    minimumLevel: 'error'
  });
  const unregisterConsoleReporter = fabric.registerReporter(consoleReporter);
  fabric.emitDiagnostic({
    level: 'warn',
    code: 'xtend.fabric.reporter.console_warn_skipped',
    message: 'Warn should not reach console',
    source: 'fabric',
    phase: 'report'
  });
  fabric.emitDiagnostic({
    level: 'fatal',
    code: 'xtend.fabric.reporter.console_fatal',
    message: 'Fatal reaches console',
    source: 'fabric',
    phase: 'report'
  });
  assert(consoleCalls.length === 1, 'Console reporter is opt-in and respects severity');
  assert(consoleCalls[0][0] === 'error', 'Console reporter maps fatal diagnostics to error method');
  unregisterConsoleReporter();

  const adapterEvents = [];
  const enterpriseReporter = createReporterAdapter({
    id: 'enterprise-probe',
    kind: 'enterprise',
    delivery: 'adapter',
    external: true,
    minimumLevel: 'error',
    capabilities: ['diagnostics', 'lifecycle-errors'],
    filter: (event) => event.source === 'component',
    mapEvent: (event) => ({
      ...event,
      metadata: {
        ...event.metadata,
        reporterToken: 'should-redact',
        mapped: true
      }
    }),
    sink(event, reporterContext) {
      adapterEvents.push({ event, reporterContext });
      return true;
    }
  });
  assert(enterpriseReporter.schema === CONTRACTS.reporter, 'Reporter adapter uses stable reporter schema');
  assert(enterpriseReporter.external === true, 'Reporter adapter can mark future enterprise reporters');
  assert(enterpriseReporter.capabilities.includes('lifecycle-errors'), 'Reporter adapter preserves declared capabilities');
  fabric.registerReporter(enterpriseReporter);
  fabric.emitDiagnostic({
    level: 'error',
    code: 'xtend.fabric.reporter.non_component_filtered',
    message: 'Filtered',
    source: 'fabric',
    phase: 'report'
  });
  fabric.emitDiagnostic({
    level: 'error',
    code: 'xtend.fabric.reporter.component_visible',
    message: 'Component reporter visible',
    source: 'component',
    phase: 'render',
    componentRef: 'x-alert'
  });
  assert(adapterEvents.length === 1, 'Reporter adapter filter controls enterprise delivery');
  assert(adapterEvents[0].event.metadata.reporterToken === '[redacted]', 'Reporter adapter redacts mapped metadata');
  assert(adapterEvents[0].event.metadata.mapped === true, 'Reporter adapter can map events');
  assert(adapterEvents[0].reporterContext.reporterId === 'enterprise-probe', 'Reporter adapter receives reporter context');

  fabric.registerReporter({
    id: 'throwing-reporter',
    schema: CONTRACTS.reporter,
    publish() {
      throw new Error('reporter transport failed');
    }
  });
  fabric.emitDiagnostic({
    level: 'error',
    code: 'xtend.fabric.reporter.failure_probe',
    message: 'Reporter failure probe',
    source: 'fabric',
    phase: 'report'
  });
  assert(fabric.getDiagnostics().some((event) => event.code === 'xtend.fabric.reporter.failed'), 'Reporter failures become local diagnostics');

  return context.result();
}

function printFabricReporterAdapterReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend-Fabric Reporter Adapter Contract erfolgreich.',
    failureTitle: 'XTend-Fabric Reporter Adapter Contract fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runFabricReporterAdapterSuite();
  printFabricReporterAdapterReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printFabricReporterAdapterReport,
  runFabricReporterAdapterSuite
};

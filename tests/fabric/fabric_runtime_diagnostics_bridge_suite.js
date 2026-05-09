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
  createXtendFabric
} = require('../../fabric/xtend-fabric');

function createFakeXState() {
  const values = {};
  const listeners = [];
  return {
    values,
    set(key, value) {
      values[key] = value;
      listeners.slice().forEach((listener) => listener(key, value, { ...values }));
    },
    get(key) {
      return values[key];
    },
    subscribe(callback, keyFilter) {
      const listener = (key, value, snapshot) => {
        if (!keyFilter || keyFilter === key || (Array.isArray(keyFilter) && keyFilter.includes(key))) {
          callback(key, value, snapshot);
        }
      };
      listeners.push(listener);
      callback(null, null, { ...values });
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    }
  };
}

function createIncrementingClock() {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 4, 6, 13, 15, tick++));
}

function runFabricRuntimeDiagnosticsBridgeSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'fabric-runtime-bridge',
    label: 'XTend-Fabric xstate API and RMT diagnostics bridge'
  });
  const { assert } = context;
  const source = readText('fabric/xtend-fabric.js', rootDir);
  const apiSource = readText('api.js', rootDir);
  const xstateSource = readText('components/xstate.js', rootDir);
  const rmtSource = readText('xtendrmt/rmt-runtime.esm.js', rootDir);
  const syntax = syntaxCheckFile('fabric/xtend-fabric.js', { rootDir, extension: '.js' });

  assert(syntax.ok, `Fabric runtime syntax check passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  context.assertIncludes(source, 'xtend.fabric.runtime-diagnostics-bridge.v1', 'Fabric runtime declares runtime diagnostics bridge contract');
  context.assertIncludes(source, 'createRuntimeDiagnosticsBridge', 'Fabric runtime exposes runtime diagnostics bridge factory');
  context.assertIncludes(source, 'connectXState', 'Fabric runtime exposes xstate bridge connector');
  context.assertIncludes(source, 'connectApi', 'Fabric runtime exposes API bridge connector');
  context.assertIncludes(source, 'createRmtDiagnosticsHub', 'Fabric runtime exposes RMT diagnostics hub');
  context.assertIncludes(source, 'xtend.fabric.xstate.connected', 'Fabric runtime declares xstate connected diagnostic');
  context.assertIncludes(source, 'xtend.fabric.api.connected', 'Fabric runtime declares API connected diagnostic');
  context.assertIncludes(source, 'xtend.fabric.rmt.connected', 'Fabric runtime declares RMT connected diagnostic');
  assert(!source.includes("require('../../xtendrmt") && !source.includes('rmt-runtime.esm'), 'Runtime diagnostics bridge does not import the RMT runtime');

  context.assertIncludes(xstateSource, 'subscribe(fn, keyFilter)', 'xstate exposes canonical subscribe surface');
  context.assertIncludes(apiSource, 'ensureComplianceAPI', 'API exposes compliance metadata path');
  context.assertIncludes(apiSource, 'xtend.compliance.contracts', 'API mirrors compliance contracts into xstate');
  context.assertIncludes(rmtSource, 'createRmtStateSchedulerDiagnosticsBridge', 'RMT runtime exposes state/scheduler/diagnostics bridge factory');
  context.assertIncludes(rmtSource, 'diagnosticsHub', 'RMT bridge supports diagnosticsHub injection');

  assert(CONTRACTS.runtimeDiagnosticsBridge === 'xtend.fabric.runtime-diagnostics-bridge.v1', 'Fabric exports runtime diagnostics bridge contract');

  const xstate = createFakeXState();
  const fabric = createXtendFabric({
    idPrefix: 'runtime.bridge.fabric',
    now: createIncrementingClock()
  });
  const reporterEvents = [];
  fabric.registerReporter(fabric.createTestReporter({
    id: 'runtime-bridge-reporter',
    events: reporterEvents,
    minimumLevel: 'warn'
  }));

  assert(typeof fabric.createRuntimeDiagnosticsBridge === 'function', 'Fabric instance exposes createRuntimeDiagnosticsBridge');

  const bridge = fabric.createRuntimeDiagnosticsBridge({
    id: 'runtime.bridge',
    xstate
  });
  assert(bridge.schema === CONTRACTS.runtimeDiagnosticsBridge, 'Runtime diagnostics bridge exposes stable schema');
  assert(typeof bridge.connectXState === 'function', 'Runtime diagnostics bridge exposes connectXState');
  assert(typeof bridge.connectApi === 'function', 'Runtime diagnostics bridge exposes connectApi');
  assert(typeof bridge.connectRmtDiagnostics === 'function', 'Runtime diagnostics bridge exposes connectRmtDiagnostics');
  assert(typeof bridge.createRmtDiagnosticsHub === 'function', 'Runtime diagnostics bridge exposes createRmtDiagnosticsHub');
  assert(typeof bridge.getSnapshot === 'function', 'Runtime diagnostics bridge exposes getSnapshot');

  const xstateConnection = bridge.connectXState();
  assert(xstateConnection.schema === CONTRACTS.runtimeDiagnosticsBridge, 'xstate connection carries runtime bridge schema');
  assert(xstate.values['xtend.fabric.bridge.ready'].schema === CONTRACTS.runtimeDiagnosticsBridge, 'xstate mirror receives Fabric bridge ready state');

  fabric.emitDiagnostic({
    level: 'warn',
    code: 'xtend.fabric.runtime.bridge.probe',
    message: 'Runtime bridge probe',
    source: 'fabric',
    phase: 'bridge',
    metadata: {
      token: 'secret',
      safe: 'visible'
    }
  });
  assert(xstate.values['xtend.fabric.diagnostics.last'].code === 'xtend.fabric.runtime.bridge.probe', 'xstate mirror receives last Fabric diagnostic');
  assert(xstate.values['xtend.fabric.diagnostics.last'].metadata.token === '[redacted]', 'xstate mirror receives redacted Fabric diagnostic');
  assert(xstate.values['xtend.fabric.diagnostics.snapshot'].diagnosticCount >= 2, 'xstate mirror receives diagnostic snapshot');

  xstate.set('app.ready', { ok: true });
  assert(fabric.getDiagnostics().some((event) => event.code === 'xtend.fabric.xstate.changed' && event.metadata.key === 'app.ready'), 'xstate changes become Fabric diagnostics');
  const diagnosticsAfterAppReady = fabric.getDiagnostics().length;
  xstate.set('xtend.fabric.diagnostics.last', { ignored: true });
  assert(fabric.getDiagnostics().length === diagnosticsAfterAppReady, 'Fabric ignores its own mirrored xstate keys');

  const fakeApi = {
    compliance: {
      version: '2026-05-06',
      getCoreContracts() {
        return {
          bootstrap: ['xstate', 'api.js'],
          routing: ['router-navigate']
        };
      },
      getChecklist() {
        return ['State ist die einzige Wahrheitsquelle.'];
      }
    },
    toast: {},
    theme: {}
  };
  const apiConnection = bridge.connectApi(fakeApi);
  assert(apiConnection.schema === CONTRACTS.runtimeDiagnosticsBridge, 'API connection carries runtime bridge schema');
  const apiDiagnostic = fabric.getDiagnostics().find((event) => event.code === 'xtend.fabric.api.connected');
  assert(apiDiagnostic && apiDiagnostic.source === 'api', 'API metadata is consumed as Fabric diagnostic');
  assert(apiDiagnostic && apiDiagnostic.metadata.complianceVersion === '2026-05-06', 'API diagnostic carries compliance version');
  assert(apiDiagnostic && apiDiagnostic.metadata.coreContracts.bootstrap.includes('xstate'), 'API diagnostic carries core contracts');

  const rmtHub = bridge.createRmtDiagnosticsHub();
  assert(rmtHub.schema === 'xtend.fabric.rmt-diagnostics-hub.v1', 'Runtime bridge exposes RMT diagnostics hub schema');
  rmtHub.publish({
    level: 'warn',
    code: 'rmt.bridge.adapter.result.degraded',
    message: 'Adapter degraded',
    operation: 'recordAdapterResult',
    metadata: {
      adapterId: 'xtend.xrouter',
      routeId: 'home',
      scheduleRef: 'route.visible.render',
      token: 'secret'
    }
  });
  const rmtDiagnostic = fabric.getDiagnostics().find((event) => event.code === 'xtend.rmt.bridge.adapter.result.degraded');
  assert(rmtDiagnostic && rmtDiagnostic.source === 'rmt', 'RMT diagnostics hub publishes into Fabric');
  assert(rmtDiagnostic && rmtDiagnostic.routeRef === 'home', 'RMT diagnostic maps route id to routeRef');
  assert(rmtDiagnostic && rmtDiagnostic.scheduleRef === 'route.visible.render', 'RMT diagnostic maps scheduleRef');
  assert(rmtDiagnostic && rmtDiagnostic.metadata.metadata.token === '[redacted]', 'RMT diagnostic metadata is redacted');
  assert(reporterEvents.some((event) => event.code === 'xtend.rmt.bridge.adapter.result.degraded'), 'RMT diagnostic reaches opt-in reporter');

  bridge.connectRmtDiagnostics({
    listDiagnostics() {
      return [{
        level: 'info',
        code: 'rmt.bridge.scheduler.endpoint.scheduled',
        message: 'Scheduled from listed diagnostics.',
        operation: 'scheduleEndpoint',
        phase: 'schedule',
        metadata: {
          scheduleRef: 'route.transition.render',
          routeId: 'settings'
        }
      }];
    }
  });
  assert(fabric.getDiagnostics().some((event) => event.code === 'xtend.rmt.bridge.scheduler.endpoint.scheduled' && event.scheduleRef === 'route.transition.render'), 'Runtime bridge consumes RMT listDiagnostics sources');

  const snapshot = bridge.getSnapshot({ source: 'suite' });
  assert(snapshot.schema === CONTRACTS.runtimeDiagnosticsBridge, 'Runtime bridge snapshot carries schema');
  assert(snapshot.diagnosticCount === fabric.getDiagnostics().length, 'Runtime bridge snapshot exposes diagnostic count');
  assert(snapshot.fiberCount === fabric.getFibers().length, 'Runtime bridge snapshot exposes fiber count');

  xstateConnection.dispose();
  const diagnosticsBeforeDisposedState = fabric.getDiagnostics().length;
  xstate.set('app.afterDispose', true);
  assert(fabric.getDiagnostics().length === diagnosticsBeforeDisposedState, 'Disposed xstate connection stops state diagnostics');

  bridge.dispose();
  assert(bridge.getSnapshot().diagnosticCount === fabric.getDiagnostics().length, 'Disposed bridge keeps local snapshot readable');

  return context.result();
}

function printFabricRuntimeDiagnosticsBridgeReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend-Fabric Runtime Diagnostics Bridge erfolgreich.',
    failureTitle: 'XTend-Fabric Runtime Diagnostics Bridge fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runFabricRuntimeDiagnosticsBridgeSuite();
  printFabricRuntimeDiagnosticsBridgeReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printFabricRuntimeDiagnosticsBridgeReport,
  runFabricRuntimeDiagnosticsBridgeSuite
};

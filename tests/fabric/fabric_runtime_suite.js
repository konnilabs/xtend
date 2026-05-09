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
  createXtendFabric,
  createNoopReporter,
  normalizeDiagnosticCode
} = require('../../fabric/xtend-fabric');

function createFakeWindow() {
  const events = [];
  class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  }

  return {
    events,
    CustomEvent,
    dispatchEvent(event) {
      events.push(event);
      return true;
    }
  };
}

function runFabricRuntimeSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'fabric',
    label: 'XTend-Fabric runtime skeleton'
  });
  const { assert } = context;
  const source = readText('fabric/xtend-fabric.js', rootDir);
  const syntax = syntaxCheckFile('fabric/xtend-fabric.js', { rootDir, extension: '.js' });

  assert(syntax.ok, `Fabric runtime syntax check passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  context.assertIncludes(source, 'xtend.fabric.api.v1', 'Fabric runtime declares API contract');
  context.assertIncludes(source, 'xtend.fabric.diagnostic.v1', 'Fabric runtime declares diagnostic contract');
  context.assertIncludes(source, 'xtend.fabric.reporter.v1', 'Fabric runtime declares reporter contract');
  context.assertIncludes(source, 'xtend.fabric.redaction.v1', 'Fabric runtime declares redaction contract');
  context.assertIncludes(source, 'window.XTendFabric', 'Fabric runtime exposes browser namespace');
  context.assertIncludes(source, 'createXtendFabric', 'Fabric runtime exposes factory');
  context.assertIncludes(source, 'wrapComponent', 'Fabric runtime exposes component wrapper');
  context.assertIncludes(source, 'runFiber', 'Fabric runtime exposes fiber runner');
  context.assertIncludes(source, 'emitDiagnostic', 'Fabric runtime exposes diagnostic emitter');
  context.assertIncludes(source, 'connectRmtDiagnostics', 'Fabric runtime exposes RMT diagnostic connector');

  assert(CONTRACTS.api === 'xtend.fabric.api.v1', 'Fabric module exports API contract');
  assert(CONTRACTS.diagnostic === 'xtend.fabric.diagnostic.v1', 'Fabric module exports diagnostic contract');
  assert(CONTRACTS.reporter === 'xtend.fabric.reporter.v1', 'Fabric module exports reporter contract');
  assert(CONTRACTS.redaction === 'xtend.fabric.redaction.v1', 'Fabric module exports redaction contract');
  assert(CONTRACTS.fiber === 'xtend.fabric.fiber.v1', 'Fabric module exports fiber contract');
  assert(CONTRACTS.lane === 'xtend.fabric.lane.v1', 'Fabric module exports lane contract');
  assert(normalizeDiagnosticCode('rmt.bridge.test') === 'xtend.rmt.bridge.test', 'Fabric normalizes RMT diagnostic codes without importing RMT');

  const fakeWindow = createFakeWindow();
  const fabric = createXtendFabric({
    idPrefix: 'test.fabric',
    now: () => new Date('2026-05-05T19:30:00.000Z'),
    window: fakeWindow
  });

  assert(fabric.schema === CONTRACTS.api, 'Fabric instance exposes stable API schema');
  assert(typeof fabric.wrapComponent === 'function', 'Fabric instance exposes wrapComponent');
  assert(typeof fabric.runFiber === 'function', 'Fabric instance exposes runFiber');
  assert(typeof fabric.emitDiagnostic === 'function', 'Fabric instance exposes emitDiagnostic');
  assert(typeof fabric.registerReporter === 'function', 'Fabric instance exposes registerReporter');
  assert(typeof fabric.createBoundary === 'function', 'Fabric instance exposes createBoundary');
  assert(typeof fabric.captureError === 'function', 'Fabric instance exposes captureError');
  assert(typeof fabric.connectRmtDiagnostics === 'function', 'Fabric instance exposes connectRmtDiagnostics');
  assert(fabric.lanes.visible.schema === CONTRACTS.lane, 'Fabric instance exposes canonical lane records');
  assert(createNoopReporter().id === 'noop', 'Fabric exports a noop reporter factory');
  assert(fabric.getReporters().length === 1 && fabric.getReporters()[0].id === 'noop', 'Fabric defaults to noop reporter only');

  const diagnostic = fabric.emitDiagnostic({
    level: 'warn',
    code: 'xtend.fabric.test',
    message: 'Diagnostic probe',
    source: 'fabric',
    phase: 'test',
    metadata: {
      safe: 'value',
      token: 'secret',
      node: { nodeType: 1, nodeName: 'DIV' }
    }
  });
  assert(diagnostic.schema === CONTRACTS.diagnostic, 'Fabric diagnostics use stable schema');
  assert(diagnostic.id.startsWith('test.fabric.'), 'Fabric diagnostics receive local ids');
  assert(diagnostic.metadata.safe === 'value', 'Fabric diagnostics preserve safe metadata');
  assert(diagnostic.metadata.token === '[redacted]', 'Fabric diagnostics redact sensitive metadata');
  assert(diagnostic.metadata.node === '[redacted:dom-node]', 'Fabric diagnostics redact DOM-like metadata');
  assert(fakeWindow.events.some((event) => event.type === 'xtend-fabric-diagnostic'), 'Fabric dispatches local browser diagnostic events');

  const reporterEvents = [];
  const unregisterReporter = fabric.registerReporter({
    id: 'test',
    schema: CONTRACTS.reporter,
    kind: 'test',
    publish(event) {
      reporterEvents.push(event);
    }
  });
  fabric.emitDiagnostic({
    code: 'xtend.fabric.reporter_probe',
    message: 'Reporter probe',
    source: 'fabric',
    phase: 'report',
    metadata: {
      value: 'visible',
      password: 'hidden'
    }
  });
  assert(reporterEvents.length === 1, 'Fabric sends diagnostics only to opt-in reporters');
  assert(reporterEvents[0].metadata.password === '[redacted]', 'Fabric sends redacted diagnostics to reporters');
  unregisterReporter();
  fabric.emitDiagnostic({
    code: 'xtend.fabric.after_unregister',
    message: 'After unregister',
    source: 'fabric',
    phase: 'report'
  });
  assert(reporterEvents.length === 1, 'Fabric reporter unregister stops further reporter delivery');

  const fiberResult = fabric.runFiber({
    kind: 'component.hydrate',
    scope: 'x-alert#demo',
    componentRef: 'x-alert',
    correlationId: 'route.alerts'
  }, (fiber) => {
    assert(fiber.schema === CONTRACTS.fiber, 'Fabric runFiber provides a normalized running fiber');
    assert(fiber.lane === 'visible', 'Fabric runFiber infers lane from fiber kind');
    return 'ok';
  });
  assert(fiberResult === 'ok', 'Fabric runFiber returns callback result');
  assert(fabric.getFibers().some((fiber) => fiber.kind === 'component.hydrate' && fiber.status === 'completed'), 'Fabric records completed fibers locally');

  let failedFiberThrown = false;
  try {
    fabric.runFiber({
      kind: 'component.render',
      scope: 'x-broken#render',
      componentRef: 'x-broken'
    }, () => {
      throw new Error('render failed');
    });
  } catch (_) {
    failedFiberThrown = true;
  }
  assert(failedFiberThrown, 'Fabric runFiber preserves failure semantics for callers');
  assert(fabric.getFibers().some((fiber) => fiber.kind === 'component.render' && fiber.status === 'failed'), 'Fabric records failed fibers locally');
  assert(fabric.getDiagnostics().some((event) => event.code === 'xtend.fabric.fiber.failed'), 'Fabric emits diagnostics for failed fibers');

  const boundary = fabric.createBoundary('x-safe#render', {
    source: 'component',
    componentRef: 'x-safe',
    swallowErrors: true,
    fallbackValue: 'fallback'
  });
  const boundaryResult = boundary.run('render', () => {
    throw new Error('boundary failed');
  });
  assert(boundaryResult === 'fallback', 'Fabric boundary can swallow errors with an explicit fallback');
  assert(fabric.getDiagnostics().some((event) => event.componentRef === 'x-safe' && event.phase === 'render'), 'Fabric boundary records component diagnostics');

  class BrokenElement {
    connectedCallback() {
      throw new Error('connect failed');
    }
  }
  const WrappedElement = fabric.wrapComponent(BrokenElement, {
    componentRef: 'x-broken',
    swallowErrors: true
  });
  const wrapped = new WrappedElement();
  wrapped.connectedCallback();
  assert(fabric.getDiagnostics().some((event) => event.componentRef === 'x-broken' && event.phase === 'connectedCallback'), 'Fabric wrapComponent captures lifecycle diagnostics');

  fabric.connectRmtDiagnostics([
    {
      level: 'warn',
      code: 'rmt.bridge.adapter_result.degraded',
      message: 'RMT bridge result degraded',
      phase: 'recordAdapterResult',
      metadata: {
        scheduleRef: 'route.visible.render'
      }
    }
  ]);
  assert(fabric.getDiagnostics().some((event) => event.code === 'xtend.rmt.bridge.adapter_result.degraded' && event.source === 'rmt'), 'Fabric consumes RMT diagnostics through adapter output');

  return context.result();
}

function printFabricRuntimeReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend-Fabric Runtime Skeleton erfolgreich.',
    failureTitle: 'XTend-Fabric Runtime Skeleton fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runFabricRuntimeSuite();
  printFabricRuntimeReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  runFabricRuntimeSuite,
  printFabricRuntimeReport
};

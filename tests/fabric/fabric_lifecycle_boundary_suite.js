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
const {
  BROKEN_LIFECYCLE_FIXTURE_CONTRACT,
  BrokenLifecycleComponent
} = require('./fixtures/broken-lifecycle.component');

function findDiagnostic(diagnostics, phase) {
  return diagnostics.find((event) => (
    event.code === 'xtend.fabric.component.lifecycle.failed'
    && event.componentRef === 'x-broken-lifecycle'
    && event.phase === phase
  ));
}

function assertLifecycleDiagnostic(context, diagnostic, expected) {
  const { assert } = context;
  assert(!!diagnostic, `${expected.phase} emits lifecycle diagnostic`);
  if (!diagnostic) return;

  assert(diagnostic.schema === CONTRACTS.diagnostic, `${expected.phase} diagnostic uses diagnostic schema`);
  assert(diagnostic.severity === 'error', `${expected.phase} diagnostic carries severity`);
  assert(diagnostic.level === 'error', `${expected.phase} diagnostic keeps level compatibility`);
  assert(diagnostic.component === 'x-broken-lifecycle', `${expected.phase} diagnostic carries component`);
  assert(diagnostic.componentRef === 'x-broken-lifecycle', `${expected.phase} diagnostic carries componentRef`);
  assert(diagnostic.phase === expected.phase, `${expected.phase} diagnostic carries phase`);
  assert(diagnostic.lane === expected.lane, `${expected.phase} diagnostic carries lane`);
  assert(typeof diagnostic.fiberId === 'string' && diagnostic.fiberId.includes('.fiber.'), `${expected.phase} diagnostic carries fiber id`);
  assert(diagnostic.cause && diagnostic.cause.message.includes(expected.cause), `${expected.phase} diagnostic carries cause`);
  assert(diagnostic.metadata && diagnostic.metadata.lifecycleBoundary === CONTRACTS.lifecycleBoundary, `${expected.phase} diagnostic carries lifecycle boundary metadata`);
}

async function runFabricLifecycleBoundarySuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'fabric-lifecycle-boundary',
    label: 'XTend-Fabric component lifecycle error boundary'
  });
  const { assert } = context;
  const source = readText('fabric/xtend-fabric.js', rootDir);
  const fixtureSource = readText('tests/fabric/fixtures/broken-lifecycle.component.js', rootDir);
  const syntax = syntaxCheckFile('fabric/xtend-fabric.js', { rootDir, extension: '.js' });
  const fixtureSyntax = syntaxCheckFile('tests/fabric/fixtures/broken-lifecycle.component.js', { rootDir, extension: '.js' });

  assert(syntax.ok, `Fabric runtime syntax check passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  assert(fixtureSyntax.ok, `Broken lifecycle fixture syntax check passes${fixtureSyntax.ok ? '' : ` (${fixtureSyntax.message})`}`);
  context.assertIncludes(source, 'xtend.fabric.lifecycle-error-boundary.v1', 'Fabric runtime declares lifecycle boundary contract');
  context.assertIncludes(source, 'createComponentLifecycleBoundary', 'Fabric runtime exposes component lifecycle boundary factory');
  context.assertIncludes(source, 'wrapEventHandler', 'Fabric runtime exposes event handler wrapping');
  context.assertIncludes(source, 'xtend.fabric.component.lifecycle.failed', 'Fabric runtime emits stable lifecycle failure diagnostic code');
  context.assertIncludes(fixtureSource, BROKEN_LIFECYCLE_FIXTURE_CONTRACT, 'Broken lifecycle fixture declares stable contract');

  assert(CONTRACTS.lifecycleBoundary === 'xtend.fabric.lifecycle-error-boundary.v1', 'Fabric module exports lifecycle boundary contract');

  const reporterEvents = [];
  const fabric = createXtendFabric({
    idPrefix: 'lifecycle.fabric',
    now: () => new Date('2026-05-06T10:00:00.000Z')
  });
  fabric.registerReporter({
    id: 'lifecycle-test',
    schema: CONTRACTS.reporter,
    publish(event) {
      reporterEvents.push(event);
    }
  });

  assert(typeof fabric.createComponentLifecycleBoundary === 'function', 'Fabric instance exposes createComponentLifecycleBoundary');

  const boundary = fabric.createComponentLifecycleBoundary('x-broken-lifecycle', {
    swallowErrors: true,
    fallbackValue: 'fallback',
    correlationId: 'route.lifecycle-test'
  });
  assert(boundary.schema === CONTRACTS.lifecycleBoundary, 'Lifecycle boundary exposes stable schema');
  assert(typeof boundary.runPhase === 'function', 'Lifecycle boundary exposes runPhase');
  assert(typeof boundary.wrapMethod === 'function', 'Lifecycle boundary exposes wrapMethod');
  assert(typeof boundary.wrapEventHandler === 'function', 'Lifecycle boundary exposes wrapEventHandler');

  const fixture = new BrokenLifecycleComponent();
  assert(boundary.runPhase('connectedCallback', () => fixture.connectedCallback()) === 'fallback', 'Lifecycle boundary swallows connectedCallback failure');
  assert(boundary.runPhase('render', () => fixture.render()) === 'fallback', 'Lifecycle boundary swallows render failure');
  assert(await boundary.runPhase('hydrate', () => fixture.hydrate()) === 'fallback', 'Lifecycle boundary swallows async hydrate failure');
  assert(boundary.runPhase('disconnectedCallback', () => fixture.disconnectedCallback()) === 'fallback', 'Lifecycle boundary swallows disconnectedCallback failure');

  const wrappedClick = boundary.wrapEventHandler(fixture.handleClick, {
    method: 'handleClick',
    eventName: 'click'
  });
  assert(wrappedClick.call(fixture, { type: 'click', token: 'hidden' }) === 'fallback', 'Lifecycle boundary swallows event handler failure');

  const WrappedComponent = fabric.wrapComponent(BrokenLifecycleComponent, {
    componentRef: 'x-broken-lifecycle',
    swallowErrors: true,
    fallbackValue: 'fallback',
    eventHandlers: ['handleClick']
  });
  const wrapped = new WrappedComponent();
  assert(wrapped.connectedCallback() === 'fallback', 'wrapComponent catches connectedCallback failure');
  assert(wrapped.attributeChangedCallback('status', 'old', 'new') === 'fallback', 'wrapComponent catches attributeChangedCallback failure');
  assert(wrapped.render() === 'fallback', 'wrapComponent catches render failure');
  assert(await wrapped.hydrate() === 'fallback', 'wrapComponent catches async hydrate failure');
  assert(wrapped.disconnectedCallback() === 'fallback', 'wrapComponent catches disconnectedCallback failure');
  assert(wrapped.handleClick({ type: 'click' }) === 'fallback', 'wrapComponent catches configured event handler failure');

  const diagnostics = fabric.getDiagnostics();
  assertLifecycleDiagnostic(context, findDiagnostic(diagnostics, 'connectedCallback'), {
    phase: 'connectedCallback',
    lane: 'visible',
    cause: 'connected lifecycle failure'
  });
  assertLifecycleDiagnostic(context, findDiagnostic(diagnostics, 'render'), {
    phase: 'render',
    lane: 'visible',
    cause: 'render lifecycle failure'
  });
  assertLifecycleDiagnostic(context, findDiagnostic(diagnostics, 'hydrate'), {
    phase: 'hydrate',
    lane: 'visible',
    cause: 'hydrate lifecycle failure'
  });
  assertLifecycleDiagnostic(context, findDiagnostic(diagnostics, 'disconnectedCallback'), {
    phase: 'disconnectedCallback',
    lane: 'background',
    cause: 'disconnect lifecycle failure'
  });
  assertLifecycleDiagnostic(context, findDiagnostic(diagnostics, 'eventHandler'), {
    phase: 'eventHandler',
    lane: 'user-blocking',
    cause: 'event handler failure'
  });

  assert(fabric.getFibers().some((fiber) => fiber.kind === 'component.mount' && fiber.status === 'failed'), 'Lifecycle boundary records failed mount fiber');
  assert(fabric.getFibers().some((fiber) => fiber.kind === 'component.render' && fiber.status === 'failed'), 'Lifecycle boundary records failed render fiber');
  assert(fabric.getFibers().some((fiber) => fiber.kind === 'component.hydrate' && fiber.status === 'failed'), 'Lifecycle boundary records failed hydrate fiber');
  assert(fabric.getFibers().some((fiber) => fiber.kind === 'component.disconnect' && fiber.status === 'failed'), 'Lifecycle boundary records failed disconnect fiber');
  assert(fabric.getFibers().some((fiber) => fiber.kind === 'event.handler' && fiber.status === 'failed'), 'Lifecycle boundary records failed event handler fiber');
  assert(reporterEvents.some((event) => event.code === 'xtend.fabric.component.lifecycle.failed'), 'Lifecycle diagnostics are sent to opt-in reporters');

  return context.result();
}

function printFabricLifecycleBoundaryReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend-Fabric Component Lifecycle Error Boundary erfolgreich.',
    failureTitle: 'XTend-Fabric Component Lifecycle Error Boundary fehlgeschlagen:'
  });
}

if (require.main === module) {
  runFabricLifecycleBoundarySuite().then((result) => {
    printFabricLifecycleBoundaryReport(result);
    if (!result.ok) {
      process.exit(1);
    }
  }).catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  });
}

module.exports = {
  printFabricLifecycleBoundaryReport,
  runFabricLifecycleBoundarySuite
};

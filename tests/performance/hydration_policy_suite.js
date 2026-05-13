const path = require('path');
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
const {
  createXtendFabric
} = require('../../fabric/xtend-fabric');
const {
  resolveRmtScheduleForFiber
} = require('../../fabric/rmt-lane-mapping');
const {
  CONTRACTS,
  HYDRATION_POLICIES,
  createHydrationFiberInput,
  createHydrationPolicyController,
  createHydrationScheduleRecords,
  resolveHydrationPolicy
} = require('../../fabric/hydration-policy');

function createIncrementingClock() {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 4, 6, 18, 20, tick++));
}

async function runHydrationPolicySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'hydration-policy',
    label: 'XTend Lazy/Idle/Visible hydration policy gates'
  });
  const { assert } = context;
  const policySource = readText('fabric/hydration-policy.js', rootDir);
  const mappingSource = readText('fabric/rmt-lane-mapping.js', rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Enterprise-Reife.md', rootDir);
  const contractDoc = readText('development/XTend-Hydration-Policy-Contract.md', rootDir);
  const developerDocs = readText('docs/hydration-policies.md', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const policySyntax = syntaxCheckFile('fabric/hydration-policy.js', { rootDir, extension: '.js' });
  const mappingSyntax = syntaxCheckFile('fabric/rmt-lane-mapping.js', { rootDir, extension: '.js' });

  assert(policySyntax.ok, `Hydration policy syntax check passes${policySyntax.ok ? '' : ` (${policySyntax.message})`}`);
  assert(mappingSyntax.ok, `Fabric/RMT lane mapping syntax check passes${mappingSyntax.ok ? '' : ` (${mappingSyntax.message})`}`);
  context.assertIncludes(policySource, 'xtend.fabric.hydration-policy.v1', 'Policy module declares hydration policy contract');
  context.assertIncludes(policySource, 'xtend.fabric.hydration-decision.v1', 'Policy module declares hydration decision contract');
  context.assertIncludes(policySource, 'component.lazy.hydrate', 'Policy module defines lazy hydration schedule');
  context.assertIncludes(policySource, 'createHydrationPolicyController', 'Policy module exposes controller helper');
  context.assertIncludes(mappingSource, 'component.lazy.hydrate', 'RMT lane mapping exposes lazy hydration schedule');
  context.assert(!policySource.includes('rmt-runtime'), 'Hydration policy module does not import the RMT runtime');

  assert(CONTRACTS.hydrationPolicy === 'xtend.fabric.hydration-policy.v1', 'Exports hydration policy contract');
  assert(CONTRACTS.hydrationDecision === 'xtend.fabric.hydration-decision.v1', 'Exports hydration decision contract');
  assert(HYDRATION_POLICIES.visible.scheduleRef === 'component.visible.hydrate', 'Visible policy keeps visible hydration schedule');
  assert(HYDRATION_POLICIES.idle.scheduleRef === 'component.idle.hydrate', 'Idle policy keeps idle hydration schedule');
  assert(HYDRATION_POLICIES.lazy.scheduleRef === 'component.lazy.hydrate', 'Lazy policy keeps lazy hydration schedule');

  const visibleDecision = resolveHydrationPolicy({
    componentRef: 'x-alert',
    isVisible: true
  });
  assert(visibleDecision.policy === 'visible', 'Visible component resolves visible hydration policy');
  assert(visibleDecision.lane === 'visible', 'Visible hydration stays on visible lane');
  assert(visibleDecision.scheduleRef === 'component.visible.hydrate', 'Visible hydration delegates to visible schedule');
  assert(visibleDecision.preferIdle === false, 'Visible hydration does not prefer idle work');
  assert(visibleDecision.endpointNameHint === 'xtendrmt.component.hydrate', 'Visible hydration keeps XTendRMT endpoint hint');

  const idleDecision = resolveHydrationPolicy({
    componentRef: 'x-card'
  });
  assert(idleDecision.policy === 'idle', 'Unspecified non-critical hydration defaults to idle');
  assert(idleDecision.lane === 'idle', 'Idle hydration uses idle lane');
  assert(idleDecision.scheduleRef === 'component.idle.hydrate', 'Idle hydration delegates to idle schedule');
  assert(idleDecision.preferIdle === true, 'Idle hydration prefers idle work');

  const lazyDecision = resolveHydrationPolicy({
    componentRef: 'x-gallery',
    isVisible: false,
    loading: 'lazy'
  });
  assert(lazyDecision.policy === 'lazy', 'Non-visible lazy component resolves lazy hydration policy');
  assert(lazyDecision.lane !== 'user-blocking', 'Lazy hydration does not use user-blocking lane');
  assert(lazyDecision.scheduleRef === 'component.lazy.hydrate', 'Lazy hydration delegates to lazy schedule');
  assert(lazyDecision.rmtLane === 'idle', 'Lazy hydration maps to RMT idle lane');

  const refusedDecision = resolveHydrationPolicy({
    componentRef: 'x-hidden',
    isVisible: false,
    lane: 'user-blocking'
  });
  assert(refusedDecision.lane === 'idle', 'Non-visible hydration user-blocking override falls back to idle');
  assert(refusedDecision.diagnostics.some((entry) => entry.code === 'xtend.fabric.hydration_policy.user_blocking_refused'), 'User-blocking override emits refusal diagnostic');

  const deferredDecision = resolveHydrationPolicy({
    componentRef: 'x-feed',
    backpressureLevel: 'high'
  });
  assert(deferredDecision.policy === 'lazy', 'High backpressure defers neutral hydration to lazy policy');
  assert(deferredDecision.diagnostics.some((entry) => entry.code === 'xtend.fabric.hydration_policy.backpressure_deferred'), 'Backpressure deferral emits diagnostic');

  const lazyFiber = createHydrationFiberInput('x-gallery', {
    lazy: true,
    metadata: {
      reason: 'below-fold'
    }
  });
  assert(lazyFiber.kind === 'component.hydrate', 'Hydration policy fiber uses component.hydrate kind');
  assert(lazyFiber.lane === 'idle', 'Hydration policy fiber uses idle lane for lazy hydration');
  assert(lazyFiber.scheduleRef === 'component.lazy.hydrate', 'Hydration policy fiber carries lazy scheduleRef');
  assert(lazyFiber.metadata.hydrationPolicy === CONTRACTS.hydrationPolicy, 'Hydration policy fiber carries policy metadata');

  const lazySchedule = resolveRmtScheduleForFiber(lazyFiber);
  assert(lazySchedule.scheduleRef === 'component.lazy.hydrate', 'RMT resolver honors lazy hydration scheduleRef');
  assert(lazySchedule.endpointName === 'xtendrmt.component.hydrate', 'RMT resolver preserves hydration endpoint');
  assert(lazySchedule.rmtLane === 'idle', 'RMT resolver maps lazy hydration to idle lane');

  const hydrationSchedules = createHydrationScheduleRecords();
  assert(hydrationSchedules.length === 3, 'Hydration policy exposes visible, idle and lazy schedule records');
  assert(hydrationSchedules.every((schedule) => schedule.endpointName === 'xtendrmt.component.hydrate'), 'Hydration schedules delegate to XTendRMT hydration endpoint');
  assert(hydrationSchedules.find((schedule) => schedule.id === 'component.lazy.hydrate').preferIdle === true, 'Lazy schedule prefers idle work');

  const fabric = createXtendFabric({
    idPrefix: 'hydration.policy.fabric',
    now: createIncrementingClock()
  });
  const instrumentation = fabric.createComponentFiberInstrumentation('x-policy-card');
  const controller = createHydrationPolicyController('x-policy-card', {
    loading: 'lazy'
  });
  const hydrated = await controller.hydrate(instrumentation, (fiber) => Promise.resolve({
    hydrated: true,
    lane: fiber.lane,
    scheduleRef: fiber.scheduleRef
  }));
  assert(hydrated.hydrated === true, 'Hydration policy controller runs instrumentation task');
  assert(hydrated.lane === 'idle', 'Controller-controlled lazy hydration runs on idle lane');
  assert(hydrated.scheduleRef === 'component.lazy.hydrate', 'Controller-controlled lazy hydration carries lazy schedule');
  const recordedFiber = fabric.getFibers().find((fiber) => fiber.componentRef === 'x-policy-card' && fiber.kind === 'component.hydrate');
  assert(recordedFiber && recordedFiber.lane === 'idle', 'Recorded hydration fiber stays off user-blocking lane');
  assert(recordedFiber && recordedFiber.scheduleRef === 'component.lazy.hydrate', 'Recorded hydration fiber keeps lazy scheduleRef');
  assert(recordedFiber && recordedFiber.metadata.metadata && recordedFiber.metadata.metadata.hydrationPolicyId === 'lazy', 'Recorded hydration fiber keeps policy metadata');

  const hydrationPolicyExport = packageManifest.exports['./fabric/hydration-policy'];
  assert((typeof hydrationPolicyExport === 'string' ? hydrationPolicyExport : hydrationPolicyExport.default) === './fabric/hydration-policy.js', 'Package exports hydration policy module');
  assert(packageManifest.scripts['test:hydration-policy'] === 'node scripts/run_xtend_tests.js hydration-policy', 'Package exposes hydration policy suite script');
  assert(packageManifest.xtend.hydrationPolicy.schema === CONTRACTS.hydrationPolicy, 'Package metadata exposes hydration policy schema');
  assert(packageManifest.xtend.hydrationPolicy.localGate === 'node scripts/run_xtend_tests.js hydration-policy --json', 'Package metadata exposes local hydration policy gate');
  assert(roadmap.includes('| `ER-WP-20` | P1 | completed | Phase 3 | EPIC 08 | Lazy/Idle/Visible Hydration Policies haerten |'), 'Roadmap marks ER-WP-20 completed');
  assert(contractDoc.includes('xtend.fabric.hydration-policy.v1'), 'Contract document declares hydration policy contract');
  assert(developerDocs.includes('npm run test:hydration-policy'), 'Developer docs document package gate');

  return context.result();
}

function printHydrationPolicyReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Hydration Policy Gates erfolgreich.',
    failureTitle: 'XTend Hydration Policy Gates fehlgeschlagen:'
  });
}

if (require.main === module) {
  runHydrationPolicySuite().then((result) => {
    printHydrationPolicyReport(result);
    if (!result.ok) {
      process.exit(1);
    }
  }).catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  });
}

module.exports = {
  printHydrationPolicyReport,
  runHydrationPolicySuite
};

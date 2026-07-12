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
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
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

function extractFencedCodeBlocks(markdown, language = '') {
  const segments = String(markdown || '').split('```');
  const blocks = [];
  for (let index = 1; index < segments.length; index += 2) {
    const segment = segments[index];
    const lineBreak = segment.indexOf('\n');
    if (lineBreak < 0) continue;
    const info = segment.slice(0, lineBreak).trim();
    if (!language || info === language) blocks.push(segment.slice(lineBreak + 1).trim());
  }
  return blocks;
}

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
  const developerDocsDe = readText('docs/de/hydration-policies.md', rootDir);
  const developerDocsEn = readText('docs/en/hydration-policies.md', rootDir);
  const docsMenu = readJson('docs/menu.json', rootDir);
  const runtimeSchema = readJson('xtendrmt/rmt.schema.json', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const policySyntax = syntaxCheckFile('fabric/hydration-policy.js', { rootDir, extension: '.js' });
  const mappingSyntax = syntaxCheckFile('fabric/rmt-lane-mapping.js', { rootDir, extension: '.js' });

  assert(policySyntax.ok, `Hydration policy syntax check passes${policySyntax.ok ? '' : ` (${policySyntax.message})`}`);
  assert(mappingSyntax.ok, `Fabric/RMT lane mapping syntax check passes${mappingSyntax.ok ? '' : ` (${mappingSyntax.message})`}`);
  context.assertIncludes(policySource, 'xtend.fabric.hydration-policy.v1', 'Policy module declares hydration policy contract');
  context.assertIncludes(policySource, 'xtend.fabric.hydration-decision.v1', 'Policy module declares hydration decision contract');
  context.assertIncludes(policySource, 'component.lazy.hydrate', 'Policy module defines lazy hydration schedule');
  context.assertIncludes(policySource, 'component.prewarm.prepare', 'Policy module defines prewarm hydration schedule');
  context.assertIncludes(policySource, 'component.worker_prerender_hydrate', 'Policy module defines worker prerender hydration schedule');
  context.assertIncludes(policySource, 'stream_pressure_deferred', 'Policy module handles stream-pressure deferral');
  context.assertIncludes(policySource, 'lazy_stream_pressure_throttled', 'Policy module handles lazy throttling under stream pressure');
  context.assertIncludes(policySource, 'createHydrationPolicyController', 'Policy module exposes controller helper');
  context.assertIncludes(mappingSource, 'component.lazy.hydrate', 'RMT lane mapping exposes lazy hydration schedule');
  context.assertIncludes(mappingSource, 'component.prewarm.prepare', 'RMT lane mapping exposes prewarm hydration schedule');
  context.assertIncludes(mappingSource, 'component.worker_prerender_hydrate', 'RMT lane mapping exposes worker prerender hydration schedule');
  context.assert(!policySource.includes('rmt-runtime'), 'Hydration policy module does not import the RMT runtime');

  assert(CONTRACTS.hydrationPolicy === 'xtend.fabric.hydration-policy.v1', 'Exports hydration policy contract');
  assert(CONTRACTS.hydrationDecision === 'xtend.fabric.hydration-decision.v1', 'Exports hydration decision contract');
  assert(HYDRATION_POLICIES.visible.scheduleRef === 'component.visible.hydrate', 'Visible policy keeps visible hydration schedule');
  assert(HYDRATION_POLICIES.idle.scheduleRef === 'component.idle.hydrate', 'Idle policy keeps idle hydration schedule');
  assert(HYDRATION_POLICIES.lazy.scheduleRef === 'component.lazy.hydrate', 'Lazy policy keeps lazy hydration schedule');
  assert(HYDRATION_POLICIES.warm.scheduleRef === 'component.warm.reentry', 'Warm reentry policy keeps warm schedule');
  assert(HYDRATION_POLICIES.prewarm.scheduleRef === 'component.prewarm.prepare', 'Prewarm policy keeps prewarm schedule');
  assert(HYDRATION_POLICIES.worker_prerender_hydrate.scheduleRef === 'component.worker_prerender_hydrate', 'Worker prerender policy keeps worker schedule');

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

  const streamDeferredDecision = resolveHydrationPolicy({
    componentRef: 'x-stream-feed',
    streamPressureLevel: 'high'
  });
  assert(streamDeferredDecision.policy === 'lazy', 'High stream pressure defers neutral hydration to lazy policy');
  assert(streamDeferredDecision.status === 'throttled' && streamDeferredDecision.throttled === true, 'High stream pressure throttles lazy hydration behind visible work');
  assert(streamDeferredDecision.streamPressureLevel === 'high', 'Stream pressure level is exposed on hydration decision');
  assert(streamDeferredDecision.diagnostics.some((entry) => entry.code === 'xtend.fabric.hydration_policy.stream_pressure_deferred'), 'Stream pressure deferral emits diagnostic');
  assert(streamDeferredDecision.diagnostics.some((entry) => entry.code === 'xtend.fabric.hydration_policy.lazy_stream_pressure_throttled'), 'Lazy stream pressure throttling emits diagnostic');

  const warmDecision = resolveHydrationPolicy({
    componentRef: 'x-returning-card',
    warmReentry: true,
    backpressureLevel: 'high'
  });
  assert(warmDecision.policy === 'warm', 'Warm reentry request resolves warm policy');
  assert(warmDecision.status === 'reduced', 'High backpressure reduces warm reentry work');
  assert(warmDecision.lane === 'idle', 'Warm reentry remains opportunistic on idle lane');
  assert(warmDecision.scheduleRef === 'component.warm.reentry', 'Warm reentry delegates to warm schedule');

  const pausedPrewarm = resolveHydrationPolicy({
    componentRef: 'x-below-fold',
    prewarm: true,
    backpressureLevel: 'critical'
  });
  assert(pausedPrewarm.policy === 'prewarm', 'Prewarm request resolves prewarm policy');
  assert(pausedPrewarm.status === 'paused' && pausedPrewarm.paused === true, 'Critical backpressure pauses prewarm work');
  assert(pausedPrewarm.scheduleRef === 'diagnostics.snapshot', 'Paused prewarm records diagnostics instead of scheduling prewarm endpoint');
  assert(pausedPrewarm.diagnostics.some((entry) => entry.code === 'xtend.fabric.hydration_policy.prewarm_paused'), 'Paused prewarm emits diagnostic');

  const streamPausedPrewarm = resolveHydrationPolicy({
    componentRef: 'x-stream-prewarm',
    prewarm: true,
    streamPressureLevel: 'critical'
  });
  assert(streamPausedPrewarm.policy === 'prewarm', 'Prewarm request still resolves prewarm policy under stream pressure');
  assert(streamPausedPrewarm.status === 'paused' && streamPausedPrewarm.blockedByBackpressure === true, 'Critical stream pressure pauses prewarm work');
  assert(streamPausedPrewarm.scheduleRef === 'diagnostics.snapshot', 'Critical stream pressure records diagnostics instead of prewarm scheduling');

  const pausedWorkerPrerender = resolveHydrationPolicy({
    componentRef: 'x-worker-card',
    mode: 'worker_prerender_hydrate',
    backpressureLevel: 'critical'
  });
  assert(pausedWorkerPrerender.policy === 'worker_prerender_hydrate', 'Worker prerender request resolves worker policy');
  assert(pausedWorkerPrerender.status === 'paused' && pausedWorkerPrerender.paused === true, 'Critical backpressure pauses worker prerender hydration');
  assert(pausedWorkerPrerender.scheduleRef === 'diagnostics.snapshot', 'Paused worker prerender records diagnostics instead of scheduling worker endpoint');
  assert(pausedWorkerPrerender.diagnostics.some((entry) => entry.code === 'xtend.fabric.hydration_policy.worker_prerender_paused'), 'Paused worker prerender emits diagnostic');

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

  const prewarmFiber = createHydrationFiberInput('x-below-fold', {
    prewarm: true
  });
  assert(prewarmFiber.kind === 'component.prewarm', 'Prewarm hydration policy emits component.prewarm fiber');
  assert(prewarmFiber.lane === 'background', 'Prewarm hydration policy uses background lane');
  assert(prewarmFiber.scheduleRef === 'component.prewarm.prepare', 'Prewarm hydration policy carries prewarm scheduleRef');

  const workerPrerenderFiber = createHydrationFiberInput('x-worker-card', {
    mode: 'worker_prerender_hydrate'
  });
  assert(workerPrerenderFiber.kind === 'component.worker_prerender_hydrate', 'Worker prerender hydration policy emits worker Fiber kind');
  assert(workerPrerenderFiber.lane === 'background', 'Worker prerender hydration policy uses background lane');
  assert(workerPrerenderFiber.scheduleRef === 'component.worker_prerender_hydrate', 'Worker prerender hydration policy carries worker scheduleRef');
  assert(workerPrerenderFiber.metadata.workerPrerender === true, 'Worker prerender Fiber carries worker metadata');

  const workerPrerenderSchedule = resolveRmtScheduleForFiber(workerPrerenderFiber);
  assert(workerPrerenderSchedule.scheduleRef === 'component.worker_prerender_hydrate', 'RMT resolver honors worker prerender scheduleRef');
  assert(workerPrerenderSchedule.endpointName === 'xtendrmt.component.worker_prerender_hydrate', 'RMT resolver preserves worker prerender endpoint');
  assert(workerPrerenderSchedule.rmtLane === 'background', 'RMT resolver maps worker prerender to background lane');

  const hydrationSchedules = createHydrationScheduleRecords();
  assert(hydrationSchedules.length === 6, 'Hydration policy exposes visible, idle, lazy, warm, prewarm and worker prerender schedule records');
  assert(hydrationSchedules.every((schedule) => schedule.endpointName === 'xtendrmt.component.hydrate' || schedule.endpointName === 'xtendrmt.component.prewarm' || schedule.endpointName === 'xtendrmt.component.worker_prerender_hydrate'), 'Hydration schedules delegate to XTendRMT hydration/prewarm/worker endpoints');
  assert(hydrationSchedules.find((schedule) => schedule.id === 'component.lazy.hydrate').preferIdle === true, 'Lazy schedule prefers idle work');
  assert(hydrationSchedules.find((schedule) => schedule.id === 'component.prewarm.prepare').lane === 'background', 'Prewarm schedule stays on background lane');
  assert(hydrationSchedules.find((schedule) => schedule.id === 'component.worker_prerender_hydrate').lane === 'background', 'Worker prerender schedule stays on background lane');

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
  const docsMenuEntry = docsMenu.find((entry) => entry.slug === 'hydration-policies');
  const executionModes = runtimeSchema.$defs.hydrationMode.enum;
  const policyIds = Object.keys(HYDRATION_POLICIES);
  const requiredDiagnostics = [
    'xtend.fabric.hydration_policy.user_blocking_refused',
    'xtend.fabric.hydration_policy.backpressure_deferred',
    'xtend.fabric.hydration_policy.stream_pressure_deferred',
    'xtend.fabric.hydration_policy.lazy_stream_pressure_throttled',
    'xtend.fabric.hydration_policy.prewarm_paused',
    'xtend.fabric.hydration_policy.worker_prerender_paused',
    'xtend.maraca.hydration_error'
  ];
  [developerDocsDe, developerDocsEn].forEach((developerDocs, localeIndex) => {
    const locale = localeIndex === 0 ? 'de' : 'en';
    context.assertIncludes(developerDocs, 'node scripts/run_xtend_tests.js hydration-policy --json', `${locale} developer docs document the runnable hydration policy gate`);
    context.assertIncludes(developerDocs, 'xtend.rmt.app-hydration-plan.v1', `${locale} developer docs identify the compiled hydration plan`);
    context.assertIncludes(developerDocs, 'RmtTemplateExecutionMode', `${locale} developer docs distinguish template execution modes`);
    context.assertIncludes(developerDocs, 'server_prerender_resume', `${locale} developer docs explain server resumability`);
    context.assertIncludes(developerDocs, 'worker_prerender_resume', `${locale} developer docs state worker resume maturity`);
    context.assertIncludes(developerDocs, 'hydrate_existing', `${locale} developer docs explain DOM ownership`);
    context.assertIncludes(developerDocs, 'replace_children', `${locale} developer docs explain runtime render ownership`);
    context.assertIncludes(developerDocs, 'window.XTendMaraca?.hydration?.snapshot()', `${locale} developer docs expose Maraca hydration inspection`);
    context.assertIncludes(developerDocs, 'window.__XTEND_DEV_API__?.getHydrationSnapshot?.()', `${locale} developer docs expose DEV API hydration inspection`);
    executionModes.forEach((mode) => context.assertIncludes(developerDocs, mode, `${locale} developer docs include runtime execution mode ${mode}`));
    policyIds.forEach((policyId) => {
      const policy = HYDRATION_POLICIES[policyId];
      context.assertIncludes(developerDocs, `\`${policyId}\``, `${locale} developer docs include policy ${policyId}`);
      context.assertIncludes(developerDocs, `\`${policy.trigger}\``, `${locale} developer docs include trigger ${policy.trigger}`);
      context.assertIncludes(developerDocs, `${policy.deadlineMs} ms`, `${locale} developer docs include ${policyId} deadline`);
      context.assertIncludes(developerDocs, `\`${policy.budgetClass}\``, `${locale} developer docs include ${policyId} budget class`);
    });
    requiredDiagnostics.forEach((code) => context.assertIncludes(developerDocs, code, `${locale} developer docs include diagnostic ${code}`));
    [
      './rmt-vnext-authoring.md',
      './xtend-maraca-orchestration.md',
      './rmt-node-ssr-adapter.md',
      './rmt-php-ssr-adapter.md',
      './xscaler-protocol.md',
      './xtend-dev-api.md',
      './xtend-dev-surface.md'
    ].forEach((target) => context.assertIncludes(developerDocs, target, `${locale} developer docs link ${target}`));
  });
  const codeBlocksDe = extractFencedCodeBlocks(developerDocsDe);
  const codeBlocksEn = extractFencedCodeBlocks(developerDocsEn);
  const rmtBlocks = extractFencedCodeBlocks(developerDocsEn, 'rmt');
  context.assert(codeBlocksDe.length === 6 && JSON.stringify(codeBlocksDe) === JSON.stringify(codeBlocksEn), 'DE and EN hydration docs contain six technically identical code examples');
  context.assert(rmtBlocks.length === 3, 'Hydration docs contain three complete RMT examples');
  rmtBlocks.forEach((source, index) => {
    const compiled = compileRmtVNextSource({
      text: source,
      filePath: path.join(rootDir, 'tests', 'fixtures', 'docs', `hydration-policies-example-${index + 1}.rmt`)
    });
    context.assert(compiled.ok === true, `Hydration docs RMT example ${index + 1} compiles${compiled.ok ? '' : ` (${JSON.stringify(compiled.diagnostics || [])})`}`);
  });
  context.assert(docsMenuEntry && docsMenuEntry.trunk === 'operate' && docsMenuEntry.section === 'performance' && docsMenuEntry.contentType === 'operations', 'Hydration docs keep the Operate Performance operations placement');
  ['runtime_render', 'hydrate_prerendered', 'server_prerender_hydrate', 'server_prerender_resume', 'worker_prerender_hydrate', 'visible', 'idle', 'lazy', 'backpressure'].forEach((keyword) => {
    const localizedKeywords = (docsMenuEntry && docsMenuEntry.keywords && docsMenuEntry.keywords.en || []).map((entry) => String(entry).toLowerCase());
    context.assert(localizedKeywords.includes(keyword.toLowerCase()), `Hydration docs search keywords include ${keyword}`);
  });
  [
    'docs/de/rmt-vnext-authoring.md',
    'docs/en/rmt-vnext-authoring.md',
    'docs/de/xtend-maraca-orchestration.md',
    'docs/en/xtend-maraca-orchestration.md',
    'docs/de/rmt-node-ssr-adapter.md',
    'docs/en/rmt-node-ssr-adapter.md',
    'docs/de/rmt-php-ssr-adapter.md',
    'docs/en/rmt-php-ssr-adapter.md'
  ].forEach((docPath) => context.assertIncludes(readText(docPath, rootDir), './hydration-policies.md', `${docPath} links the hydration policy deep dive`));

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

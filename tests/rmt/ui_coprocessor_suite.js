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
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  MARACA_PREWARM_WORKER_RUNTIME_SCHEMA,
  MARACA_UI_COPROCESSOR_PLAN_SCHEMA,
  createMaracaBuildPlan
} = require('../../xtend-maraca');

const SUITE_PATH = 'tests/rmt/ui_coprocessor_suite.js';
const RUNTIME_PATHS = [
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-runtime.browser.js',
  'xtendrmt/rmt-core.esm.js'
];

const UI_COPROCESSOR_SOURCE = [
  'template ui.coprocessor.demo {',
  '  state ui.coprocessor.card type object preserve {',
  '    initial {',
  '      id "worker-card"',
  '      text "Worker"',
  '    }',
  '  }',
  '',
  '  selector ui.coprocessor.card from state ui.coprocessor.card {',
  '    output WorkerCard',
  '  }',
  '',
  '  surface ui.coprocessor.card kind card component section {',
  '    lane idle weight 30 {',
  '      hydrate worker-card from selector ui.coprocessor.card {',
  '        hydration mode worker_prerender_hydrate',
  '      }',
  '      prewarm worker-card from selector ui.coprocessor.card',
  '    }',
  '  }',
  '}'
].join('\n');

function assertSourceIncludes(context, source, expected, message) {
  context.assert(source.includes(expected), message);
}

function findCapability(report, key) {
  return report && Array.isArray(report.capabilities)
    ? report.capabilities.find((capability) => capability && capability.key === key)
    : null;
}

function runUiCoprocessorSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'ui-coprocessor',
    label: 'XTend RMT UI Coprocessor'
  });
  const suiteSyntax = syntaxCheckFile(SUITE_PATH, { rootDir, extension: '.js' });
  const maracaSource = readText('xtend-maraca/index.js', rootDir);
  const maracaTypes = readText('xtend-maraca/index.d.ts', rootDir);
  const kernelControllerSource = readText('xtendrmt/rmt-kernel-orchestration-controller.js', rootDir);
  const featureAdoptionSource = readText('xtendrmt/rmt-kernel-feature-adoption-registry.js', rootDir);
  const compilerSource = readText('tools/rmt-language/vnext-compiler.js', rootDir);
  const coreTypes = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const manifest = readJson('xtendrmt/rmt-manifest.json', rootDir);

  context.assert(suiteSyntax.ok, `UI Coprocessor suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(MARACA_UI_COPROCESSOR_PLAN_SCHEMA === 'xtend.maraca.ui-coprocessor-plan.v1', 'Maraca exports UI Coprocessor plan schema');
  assertSourceIncludes(context, maracaTypes, 'MARACA_UI_COPROCESSOR_PLAN_SCHEMA', 'Maraca types export UI Coprocessor schema');
  assertSourceIncludes(context, maracaTypes, 'enableUiCoprocessor', 'Maraca types expose enableUiCoprocessor input');
  assertSourceIncludes(context, maracaTypes, 'MaracaUiCoprocessorPlan', 'Maraca types expose UI Coprocessor plan');
  assertSourceIncludes(context, coreTypes, 'requestUiCompute', 'RMT public types expose requestUiCompute');
  assertSourceIncludes(context, coreTypes, 'getUiCoprocessorSnapshot', 'RMT public types expose getUiCoprocessorSnapshot');
  assertSourceIncludes(context, coreTypes, 'RmtUiCoprocessorSnapshot', 'RMT public types expose UI Coprocessor snapshot');

  RUNTIME_PATHS.forEach((runtimePath) => {
    const source = readText(runtimePath, rootDir);
    assertSourceIncludes(context, source, 'requestUiCompute', `${runtimePath} exposes requestUiCompute`);
    assertSourceIncludes(context, source, 'getUiCoprocessorSnapshot', `${runtimePath} exposes getUiCoprocessorSnapshot`);
    assertSourceIncludes(context, source, "stateOwnership: 'main-thread'", `${runtimePath} keeps Coprocessor state ownership on main thread`);
    assertSourceIncludes(context, source, "trustedDomCommit: 'main-thread'", `${runtimePath} keeps trusted DOM commit on main thread`);
    assertSourceIncludes(context, source, 'ssrRoundtripCount: 0', `${runtimePath} keeps UI Coprocessor off SSR roundtrips`);
    assertSourceIncludes(context, source, 'ui_coprocessor_worker_unavailable', `${runtimePath} degrades when Worker APIs are unavailable`);
  });

  assertSourceIncludes(context, kernelControllerSource, 'enableUiCoprocessor', 'Kernel controller accepts enableUiCoprocessor');
  assertSourceIncludes(context, kernelControllerSource, "enabledBy: options.enablePrewarmWorker", 'Kernel controller records enabledBy source');
  assertSourceIncludes(context, featureAdoptionSource, "key: 'uiCoprocessor'", 'Feature adoption registry includes UI Coprocessor capability');
  assertSourceIncludes(context, compilerSource, 'uiCoprocessorEligible', 'RMT compiler emits UI Coprocessor eligibility');
  assertSourceIncludes(context, compilerSource, 'component.prewarm.prepare', 'RMT compiler keeps prewarm schedule ref stable');
  assertSourceIncludes(context, compilerSource, 'component.warm.reentry', 'RMT compiler keeps warm reentry schedule ref stable');
  assertSourceIncludes(context, compilerSource, 'component.worker_prerender_hydrate', 'RMT compiler keeps worker hydrate schedule ref stable');
  context.assert(manifest.kernelFeatureAdoption.capabilityKeys.includes('uiCoprocessor'), 'RMT manifest declares uiCoprocessor capability');

  const compileResult = compileRmtVNextSource({
    text: UI_COPROCESSOR_SOURCE,
    filePath: path.join(rootDir, 'tests/rmt-language/fixtures/ui-coprocessor-inline.rmt')
  });
  const hydration = compileResult.orchestrationArtifacts && compileResult.orchestrationArtifacts.hydration;
  const eligibleRecords = hydration && Array.isArray(hydration.records)
    ? hydration.records.filter((record) => record.uiCoprocessorEligible === true)
    : [];
  const workerRecord = eligibleRecords.find((record) => record.mode === 'worker_prerender_hydrate');
  const prewarmRecord = eligibleRecords.find((record) => record.op === 'prewarm');
  context.assert(compileResult.ok === true, 'UI Coprocessor fixture compiles');
  context.assert(hydration && hydration.uiCoprocessor && hydration.uiCoprocessor.id === 'uiCoprocessor', 'Hydration artifact exposes UI Coprocessor capability');
  context.assert(hydration && hydration.uiCoprocessor && hydration.uiCoprocessor.recordCount >= 2, 'Hydration artifact counts eligible worker/prewarm records');
  context.assert(workerRecord && workerRecord.uiCoprocessor && workerRecord.uiCoprocessor.clientDetermined === true, 'Worker hydration record is client-determined and Coprocessor eligible');
  context.assert(prewarmRecord && prewarmRecord.fabricSchedule && prewarmRecord.fabricSchedule.scheduleRef === 'component.prewarm.prepare', 'Prewarm record keeps component.prewarm.prepare schedule');
  context.assert(workerRecord && workerRecord.fabricSchedule && workerRecord.fabricSchedule.scheduleRef === 'component.worker_prerender_hydrate', 'Worker hydration record keeps worker schedule');
  context.assert(workerRecord && workerRecord.fabricSchedule.metadata && workerRecord.fabricSchedule.metadata.uiCoprocessor === true, 'Fabric metadata marks UI Coprocessor fibers');

  const plan = createMaracaBuildPlan({
    sourceText: UI_COPROCESSOR_SOURCE,
    virtualSourcePath: 'tests/rmt-language/fixtures/ui-coprocessor-inline.rmt',
    out: '.xtend-build/maraca/ui-coprocessor',
    orchestration: 'strict',
    kernel: 'strict',
    hydration: 'strict',
    enableUiCoprocessor: true
  }, { rootDir });
  const uiCapability = findCapability(plan.kernel && plan.kernel.featureAdoption, 'uiCoprocessor');
  context.assert(plan.ok === true, `UI Coprocessor Maraca plan passes${plan.ok ? '' : ` (${plan.diagnostics.map((diagnostic) => diagnostic.message).join(', ')})`}`);
  context.assert(plan.enableUiCoprocessor === true, 'Maraca plan reflects enableUiCoprocessor opt-in');
  context.assert(plan.kernel && plan.kernel.prewarmWorker && plan.kernel.prewarmWorker.schema === MARACA_PREWARM_WORKER_RUNTIME_SCHEMA, 'UI Coprocessor reuses Prewarm Worker runtime schema');
  context.assert(plan.kernel.prewarmWorker.enabled === true, 'UI Coprocessor opt-in enables the existing Prewarm Worker');
  context.assert(plan.kernel.prewarmWorker.enabledBy === 'uiCoprocessor', 'Prewarm Worker reports uiCoprocessor as enabling source');
  context.assert(plan.kernel.prewarmWorker.coprocessor && plan.kernel.prewarmWorker.coprocessor.enabled === true, 'Prewarm Worker topology reserves Coprocessor snapshot');
  context.assert(plan.uiCoprocessor && plan.uiCoprocessor.schema === MARACA_UI_COPROCESSOR_PLAN_SCHEMA, 'Maraca plan records UI Coprocessor plan schema');
  context.assert(plan.uiCoprocessor && plan.uiCoprocessor.enabled === true, 'Maraca UI Coprocessor plan is enabled');
  context.assert(plan.uiCoprocessor && plan.uiCoprocessor.eligibility.eligibleRecordCount >= 2, 'Maraca UI Coprocessor plan counts eligible records');
  context.assert(plan.uiCoprocessor && plan.uiCoprocessor.ownership.stateOwnership === 'main-thread', 'Maraca UI Coprocessor keeps state ownership on main thread');
  context.assert(plan.uiCoprocessor && plan.uiCoprocessor.ssr.ssrRoundtripCount === 0, 'Maraca UI Coprocessor plan forbids SSR roundtrips');
  context.assert(plan.uiCoprocessor && plan.uiCoprocessor.summary.releaseBlocking === false, 'Maraca UI Coprocessor evidence remains non-blocking');
  context.assert(uiCapability && uiCapability.active === true, 'Kernel feature adoption marks UI Coprocessor active');
  assertSourceIncludes(context, maracaSource, 'const MARACA_UI_COPROCESSOR = freezeMaracaSnapshot(', 'Generated Maraca bundle keeps the UI Coprocessor plan immutable');
  assertSourceIncludes(context, maracaSource, 'uiCoprocessor: MARACA_UI_COPROCESSOR,', 'Generated Maraca bundle passes the immutable UI Coprocessor plan into the composition root');
  assertSourceIncludes(context, packageManifest.xtend.maraca.uiCoprocessorPlanSchema, 'xtend.maraca.ui-coprocessor-plan.v1', 'Package metadata declares UI Coprocessor plan schema');
  context.assert(runner.hasSuite('ui-coprocessor'), 'Runner registers UI Coprocessor suite');
  context.assert(packageManifest.scripts['test:ui-coprocessor'] === 'node scripts/run_xtend_tests.js ui-coprocessor', 'Package exposes UI Coprocessor test script');

  return context.result({
    schema: 'xtend.rmt.ui-coprocessor-suite-report.v1',
    eligibleRecordCount: eligibleRecords.length,
    uiCoprocessorStatus: plan.uiCoprocessor && plan.uiCoprocessor.status
  });
}

function printUiCoprocessorReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend RMT UI Coprocessor erfolgreich.',
    failureTitle: 'XTend RMT UI Coprocessor fehlgeschlagen:'
  });
}

module.exports = {
  runUiCoprocessorSuite,
  printUiCoprocessorReport
};

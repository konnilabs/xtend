const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  MARACA_BUILD_PLAN_SCHEMA,
  MARACA_BUNDLE_REPORT_SCHEMA,
  MARACA_KERNEL_PLAN_SCHEMA,
  MARACA_HYDRATION_PLAN_SCHEMA,
  MARACA_VALIDATION_PLAN_SCHEMA,
  MARACA_TRANSITION_PLAN_SCHEMA,
  MARACA_ORCHESTRATION_PLAN_SCHEMA,
  MARACA_SIZE_BUDGET_REPORT_SCHEMA,
  buildMaracaBundleAsync,
  createMaracaBuildPlan
} = require('../../xtend-maraca');
const {
  runCliAsync
} = require('../../xtend-builder/lib/cli');
const {
  listenXtendDevServer
} = require('../../scripts/serve_xtend_dev');

const MARACA_MODULE_PATH = 'xtend-maraca/index.js';
const MARACA_RUNTIME_PATH = 'xtend-maraca/runtime.js';
const MARACA_PACKAGE_PATH = 'xtend-maraca/package.json';
const MARACA_FIXTURE = 'tests/rmt-language/fixtures/maraca-known-components.rmt';
const MARACA_NATIVE_FIXTURE = 'tests/rmt-language/fixtures/maraca-native-html-component.rmt';
const MARACA_UNKNOWN_FIXTURE = 'tests/rmt-language/fixtures/vnext-source-to-sea.rmt';
const MARACA_ORCHESTRATION_FIXTURE = 'tests/rmt-language/fixtures/maraca-orchestration-app.rmt';
const MARACA_ORCHESTRATION_INCOMPLETE_FIXTURE = 'tests/rmt-language/fixtures/maraca-orchestration-incomplete.rmt';
const MARACA_KERNEL_INTEGRITY_FIXTURE = 'tests/rmt-language/fixtures/maraca-kernel-integrity-app.rmt';
const MARACA_VALIDATION_FIXTURE = 'tests/rmt-language/fixtures/maraca-validation-app.rmt';
const MARACA_TRANSITIONS_FIXTURE = 'tests/rmt-language/fixtures/maraca-transitions-app.rmt';
const MARACA_OUT_DIR = '.xtend-build/maraca/source-to-sea';
const MARACA_RMT_OUT_DIR = '.xtend-build/maraca/rmt-command';
const MARACA_ORCHESTRATION_OUT_DIR = '.xtend-build/maraca/orchestration';
const MARACA_KERNEL_ORCHESTRATION_OUT_DIR = '.xtend-build/maraca/kernel-orchestration';
const MARACA_KERNEL_INTEGRITY_OUT_DIR = '.xtend-build/maraca/kernel-integrity';
const MARACA_VALIDATION_OUT_DIR = '.xtend-build/maraca/validation';
const MARACA_TRANSITIONS_OUT_DIR = '.xtend-build/maraca/transitions';
const MARACA_SUITES = [
  'maraca-plan',
  'maraca-bundle',
  'maraca-rmt-source-to-bundle',
  'maraca-orchestration',
  'maraca-kernel-orchestration',
  'maraca-kernel-integrity',
  'maraca-validation',
  'maraca-transitions',
  'maraca-package-exports',
  'maraca-size-budget'
];

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function createCliIo() {
  const stdout = [];
  const stderr = [];
  return {
    stdout: {
      write(value) {
        stdout.push(value);
      }
    },
    stderr: {
      write(value) {
        stderr.push(value);
      }
    },
    readStdout() {
      return stdout.join('');
    },
    readStderr() {
      return stderr.join('');
    }
  };
}

function planFixture(rootDir, overrides = {}) {
  return createMaracaBuildPlan({
    source: MARACA_FIXTURE,
    out: MARACA_OUT_DIR,
    profile: 'production',
    lazy: 'component',
    css: 'inline',
    ...overrides
  }, { rootDir });
}

function buildFixtureAsync(rootDir, overrides = {}) {
  return buildMaracaBundleAsync({
    source: MARACA_FIXTURE,
    out: MARACA_OUT_DIR,
    profile: 'production',
    lazy: 'component',
    css: 'inline',
    ...overrides
  }, { rootDir });
}

function planOrchestrationFixture(rootDir, overrides = {}) {
  return createMaracaBuildPlan({
    source: MARACA_ORCHESTRATION_FIXTURE,
    out: MARACA_ORCHESTRATION_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    ...overrides
  }, { rootDir });
}

function buildOrchestrationFixtureAsync(rootDir, overrides = {}) {
  return buildMaracaBundleAsync({
    source: MARACA_ORCHESTRATION_FIXTURE,
    out: MARACA_ORCHESTRATION_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    ...overrides
  }, { rootDir });
}

function planKernelOrchestrationFixture(rootDir, overrides = {}) {
  return createMaracaBuildPlan({
    source: MARACA_ORCHESTRATION_FIXTURE,
    out: MARACA_KERNEL_ORCHESTRATION_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    ...overrides
  }, { rootDir });
}

function buildKernelOrchestrationFixtureAsync(rootDir, overrides = {}) {
  return buildMaracaBundleAsync({
    source: MARACA_ORCHESTRATION_FIXTURE,
    out: MARACA_KERNEL_ORCHESTRATION_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    ...overrides
  }, { rootDir });
}

function planKernelIntegrityFixture(rootDir, overrides = {}) {
  return createMaracaBuildPlan({
    source: MARACA_KERNEL_INTEGRITY_FIXTURE,
    out: MARACA_KERNEL_INTEGRITY_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    hydration: 'strict',
    validation: 'off',
    transitions: 'strict',
    ...overrides
  }, { rootDir });
}

function buildKernelIntegrityFixtureAsync(rootDir, overrides = {}) {
  return buildMaracaBundleAsync({
    source: MARACA_KERNEL_INTEGRITY_FIXTURE,
    out: MARACA_KERNEL_INTEGRITY_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    hydration: 'strict',
    validation: 'off',
    transitions: 'strict',
    ...overrides
  }, { rootDir });
}

function planValidationFixture(rootDir, overrides = {}) {
  return createMaracaBuildPlan({
    source: MARACA_VALIDATION_FIXTURE,
    out: MARACA_VALIDATION_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    hydration: 'strict',
    validation: 'strict',
    ...overrides
  }, { rootDir });
}

function buildValidationFixtureAsync(rootDir, overrides = {}) {
  return buildMaracaBundleAsync({
    source: MARACA_VALIDATION_FIXTURE,
    out: MARACA_VALIDATION_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    hydration: 'strict',
    validation: 'strict',
    ...overrides
  }, { rootDir });
}

function planTransitionFixture(rootDir, overrides = {}) {
  return createMaracaBuildPlan({
    source: MARACA_TRANSITIONS_FIXTURE,
    out: MARACA_TRANSITIONS_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    hydration: 'strict',
    validation: 'off',
    transitions: 'strict',
    ...overrides
  }, { rootDir });
}

function buildTransitionFixtureAsync(rootDir, overrides = {}) {
  return buildMaracaBundleAsync({
    source: MARACA_TRANSITIONS_FIXTURE,
    out: MARACA_TRANSITIONS_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    hydration: 'strict',
    validation: 'off',
    transitions: 'strict',
    ...overrides
  }, { rootDir });
}

function runMaracaPlanSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-plan',
    label: 'XTend Maraca Build Plan'
  });
  const plan = planFixture(rootDir);
  const maxPlan = planFixture(rootDir, { profile: 'max' });
  const unknownPlan = createMaracaBuildPlan({
    source: MARACA_UNKNOWN_FIXTURE,
    out: MARACA_OUT_DIR,
    profile: 'production',
    lazy: 'component',
    css: 'inline'
  }, { rootDir });
  const allowedUnknownPlan = createMaracaBuildPlan({
    source: MARACA_UNKNOWN_FIXTURE,
    out: MARACA_OUT_DIR,
    allowDynamicComponents: true
  }, { rootDir });
  const nativePlan = createMaracaBuildPlan({
    source: MARACA_NATIVE_FIXTURE,
    out: MARACA_OUT_DIR,
    profile: 'production',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'off',
    hydration: 'off',
    validation: 'off',
    transitions: 'off'
  }, { rootDir });
  const orchestrationOffPlan = planFixture(rootDir, { orchestration: 'off' });
  const kernelOffPlan = planFixture(rootDir, { kernel: 'off' });

  assertFileExists(context, MARACA_MODULE_PATH, rootDir, 'Maraca module exists');
  assertFileExists(context, MARACA_RUNTIME_PATH, rootDir, 'Maraca runtime helper exists');
  assertFileExists(context, MARACA_FIXTURE, rootDir, 'Maraca known-component fixture exists');
  assertFileExists(context, MARACA_NATIVE_FIXTURE, rootDir, 'Maraca native HTML component fixture exists');
  assertFileExists(context, MARACA_ORCHESTRATION_FIXTURE, rootDir, 'Maraca orchestration fixture exists');
  context.assert(syntaxCheckFile(MARACA_MODULE_PATH, { rootDir, extension: '.js' }).ok, 'Maraca module syntax passes');
  context.assert(syntaxCheckFile(MARACA_RUNTIME_PATH, { rootDir, extension: '.js' }).ok, 'Maraca runtime helper syntax passes');
  context.assert(plan.schema === MARACA_BUILD_PLAN_SCHEMA, 'plan uses Maraca build-plan schema');
  context.assert(plan.ok === true, `known-component plan passes${plan.ok ? '' : ` (${plan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(plan.loader && plan.loader.mode === 'inline-registry', 'plan selects inline registry loader mode');
  context.assert(plan.loader && plan.loader.usesExternalManifest === false, 'plan disables runtime component manifest loading');
  context.assert(plan.loader && plan.loader.usesXtendLoader === false, 'plan does not require the legacy XTend loader');
  context.assert(plan.components.requiredTags.join(',') === 'x-progress,x-status,x-toast', 'plan selects exactly the fixture components');
  context.assert(plan.components.selected.every((entry) => entry.known === true), 'selected components are manifest-backed');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-runtime.esm.js'), 'plan includes the RMT ESM runtime module need');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-event-routing-runtime.js'), 'plan includes the event routing runtime when RMT events exist');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-state-selector-runtime.js'), 'plan includes state selector runtime when selectors exist');
  context.assert(plan.orchestration && plan.orchestration.schema === MARACA_ORCHESTRATION_PLAN_SCHEMA, 'plan records orchestration plan schema');
  context.assert(plan.orchestration && plan.orchestration.mode === 'auto', 'plan defaults orchestration mode to auto');
  context.assert(plan.orchestration && plan.orchestration.enabled === true, 'auto orchestration is enabled for complete primitive Maraca fixture');
  context.assert(plan.orchestration.summary.eventCount === 2, 'auto orchestration summarizes event count');
  context.assert(plan.kernel && plan.kernel.schema === MARACA_KERNEL_PLAN_SCHEMA, 'plan records kernel plan schema');
  context.assert(plan.kernel && plan.kernel.mode === 'auto', 'plan defaults kernel mode to auto');
  context.assert(plan.kernel && plan.kernel.enabled === true, 'auto kernel integration is enabled for complete primitive Maraca fixture');
  context.assert(plan.kernel.summary.scheduleCount >= 1, 'auto kernel integration summarizes schedule count');
  context.assert(plan.kernel.summary.fiberCount >= 1, 'auto kernel integration summarizes fiber count');
  context.assert(plan.validation && plan.validation.schema === MARACA_VALIDATION_PLAN_SCHEMA, 'plan records validation plan schema');
  context.assert(plan.validation && plan.validation.mode === 'auto', 'plan defaults validation mode to auto');
  context.assert(plan.validation && plan.validation.enabled === false, 'auto validation stays disabled when no validation artifact exists');
  context.assert(plan.transitions && plan.transitions.schema === MARACA_TRANSITION_PLAN_SCHEMA, 'plan records transition plan schema');
  context.assert(plan.transitions && plan.transitions.mode === 'auto', 'plan defaults transition mode to auto');
  context.assert(plan.transitions && plan.transitions.enabled === false, 'auto transitions stay disabled when no transition artifact exists');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-runtime.esm.js'), 'auto kernel integration keeps the RMT kernel runtime module in the runtime graph');
  context.assert(orchestrationOffPlan.ok === true && orchestrationOffPlan.orchestration.enabled === false, 'orchestration off keeps legacy Surface mount plan available');
  context.assert(kernelOffPlan.ok === true && kernelOffPlan.kernel.enabled === false, 'kernel off keeps the non-kernel Maraca build path available');
  context.assert(plan.events.length === 2, 'plan derives public RMT events from the fixture');
  context.assert(plan.lanes.map((lane) => lane.name).sort().join(',') === 'idle,transition,visible', 'plan derives Fabric lane needs');
  context.assert(plan.publicNameReservations.includes('XTendMaraca'), 'plan reserves XTendMaraca public bridge name');
  context.assert(plan.publicNameReservations.includes('x-status') === false, 'component tags stay in component records, not bridge globals');
  context.assert(maxPlan.propertyMangling.enabled === true, 'max profile enables private-property mangling policy');
  context.assert(maxPlan.propertyMangling.reserved.includes('XTendMaraca'), 'max profile keeps public name reservations');
  context.assert(unknownPlan.ok === false, 'unknown component plan fails by default');
  context.assert(unknownPlan.components.unknown.includes('x-detail'), 'unknown plan reports x-detail');
  context.assert(unknownPlan.components.unknown.includes('x-audit'), 'unknown plan reports x-audit');
  context.assert(unknownPlan.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.component_unknown' && diagnostic.severity === 'error'), 'unknown plan emits blocking diagnostics');
  context.assert(allowedUnknownPlan.ok === true, 'unknown component plan can be explicitly allowed');
  context.assert(allowedUnknownPlan.diagnostics.every((diagnostic) => diagnostic.severity !== 'error'), 'allowed dynamic component diagnostics are non-blocking');
  context.assert(nativePlan.ok === true, `native HTML component plan passes strict orchestration${nativePlan.ok ? '' : ` (${nativePlan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(nativePlan.components.selected.some((entry) => entry.tag === 'img' && entry.native === true && entry.source === 'browser-native-element'), 'native img is selected as a browser-native component');
  context.assert(nativePlan.components.unknown.includes('img') === false, 'native img is not reported as an unknown dynamic component');
  context.assert(nativePlan.orchestration && nativePlan.orchestration.enabled === true, 'strict orchestration accepts native browser components');

  return context.result({
    schema: MARACA_BUILD_PLAN_SCHEMA,
    selectedComponents: plan.components.requiredTags,
    unknownComponents: unknownPlan.components.unknown
  });
}

function printMaracaPlanReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Build Plan erfolgreich.',
    failureTitle: 'XTend Maraca Build Plan fehlgeschlagen:'
  });
}

async function runMaracaBundleSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-bundle',
    label: 'XTend Maraca Bundle'
  });
  const result = await buildFixtureAsync(rootDir);
  const entryPath = result.bundleReport && result.bundleReport.entry;
  const reportPath = resolveRepoPath(`${MARACA_OUT_DIR}/xtend.maraca.report.json`, rootDir);
  const sizePath = resolveRepoPath(`${MARACA_OUT_DIR}/xtend.maraca.size.json`, rootDir);
  const entrySource = entryPath && fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';
  const report = fs.existsSync(reportPath) ? readJson(`${MARACA_OUT_DIR}/xtend.maraca.report.json`, rootDir) : null;
  const bundleFiles = report && Array.isArray(report.bundleFiles) ? report.bundleFiles : [];
  const bundleText = bundleFiles
    .map((file) => fs.existsSync(resolveRepoPath(file.path, rootDir)) ? fs.readFileSync(resolveRepoPath(file.path, rootDir), 'utf8') : '')
    .join('\n');
  const appBundleText = bundleFiles
    .filter((file) => file.fileName !== 'runtime/xtendrmt-rmt-runtime.esm.js')
    .map((file) => fs.existsSync(resolveRepoPath(file.path, rootDir)) ? fs.readFileSync(resolveRepoPath(file.path, rootDir), 'utf8') : '')
    .join('\n');

  context.assert(result.schema === MARACA_BUNDLE_REPORT_SCHEMA, 'bundle result uses Maraca bundle-report schema');
  context.assert(result.ok === true, `Maraca bundle passes${result.ok ? '' : ` (${result.status})`}`);
  context.assert(Boolean(entryPath && fs.existsSync(entryPath)), 'ESM entry is written');
  context.assert(fs.existsSync(reportPath), 'bundle report is written');
  context.assert(fs.existsSync(sizePath), 'size-budget report is written');
  context.assert(report && report.schema === MARACA_BUNDLE_REPORT_SCHEMA, 'bundle report schema is stable');
  context.assert(report && report.loader && report.loader.mode === 'inline-registry', 'bundle report records inline registry mode');
  context.assert(report && report.orchestration && report.orchestration.enabled === true, 'bundle report records enabled auto orchestration');
  context.assert(report && report.orchestration && report.orchestration.artifactSchema === 'xtend.rmt.app-orchestration.v1', 'bundle report mirrors orchestration artifact schema');
  context.assert(report && report.kernel && report.kernel.enabled === true, 'bundle report records enabled auto kernel integration');
  context.assert(report && report.kernel && report.kernel.recordsSchema === 'xtend.rmt.vnext.kernel-records.v1', 'bundle report mirrors kernel records schema');
  context.assert(report && report.toolchain && report.toolchain.active === 'rollup-terser', 'bundle uses the Rollup/Terser toolchain');
  context.assert(report && report.toolchain && report.toolchain.rollup && report.toolchain.rollup.available === true, 'Rollup is available in Maraca report');
  context.assert(report && report.toolchain && report.toolchain.terser && report.toolchain.terser.available === true, 'Terser is available in Maraca report');
  context.assert(report && report.forbiddenRuntimeDependencies.componentManifestJson === false, 'bundle report rejects component manifest runtime dependency');
  context.assert(!bundleText.includes('components/manifest.json'), 'bundle does not reference the component manifest JSON file');
  context.assert(!bundleText.includes('data-manifest'), 'bundle does not reference a data-manifest attribute');
  context.assert(!bundleText.includes('xtend-loader.js'), 'bundle does not reference the legacy loader file');
  context.assert(bundleFiles.some((file) => file.fileName === 'runtime/xtendrmt-rmt-runtime.esm.js'), 'bundle package includes the RMT kernel runtime asset');
  context.assert(bundleFiles.some((file) => file.fileName.includes('x-status')), 'bundle writes an x-status lazy chunk');
  context.assert(bundleFiles.some((file) => file.fileName.includes('x-toast')), 'bundle writes an x-toast lazy chunk');
  context.assert(bundleFiles.some((file) => file.fileName.includes('x-progress')), 'bundle writes an x-progress lazy chunk');
  context.assert(!appBundleText.includes('x-modal'), 'bundle excludes unused x-modal module from app chunks');
  context.assert(!bundleFiles.some((file) => file.fileName.includes('x-button')), 'bundle excludes unused x-button lazy chunk');
  context.assert(entrySource.includes('window.XTendMaraca'), 'entry exposes the documented XTendMaraca bridge');
  context.assert(entrySource.includes('MARACA_ORCHESTRATION'), 'entry includes orchestration bootstrap metadata');
  context.assert(entrySource.includes('import('), 'default lazy build uses native ESM import chunks');
  context.assert(entrySource.includes('IntersectionObserver'), 'boot path supports viewport-driven lazy component loading');
  context.assert(!entrySource.includes('Promise.all(MARACA_COMPONENTS.map'), 'boot path avoids unconditional eager Promise.all component loading');

  return context.result({
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    entry: entryPath,
    bytes: result.bundleReport && result.bundleReport.bytes
  });
}

function printMaracaBundleReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Bundle erfolgreich.',
    failureTitle: 'XTend Maraca Bundle fehlgeschlagen:'
  });
}

async function runMaracaRmtSourceToBundleSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-rmt-source-to-bundle',
    label: 'XTend Maraca RMT Source-to-Bundle CLI'
  });
  const planIo = createCliIo();
  const buildIo = createCliIo();
  const rmtIo = createCliIo();
  const planStatus = await runCliAsync(['maraca', 'plan', MARACA_FIXTURE, '--json'], planIo);
  const buildStatus = await runCliAsync([
    'maraca',
    'build',
    MARACA_FIXTURE,
    '--out',
    MARACA_OUT_DIR,
    '--profile',
    'production',
    '--lazy',
    'component',
    '--css',
    'inline',
    '--json'
  ], buildIo);
  const rmtStatus = await runCliAsync([
    'rmt',
    'build',
    MARACA_FIXTURE,
    '--bundle',
    'maraca',
    '--out',
    MARACA_RMT_OUT_DIR,
    '--json'
  ], rmtIo);
  const planJson = JSON.parse(planIo.readStdout());
  const buildJson = JSON.parse(buildIo.readStdout());
  const rmtJson = JSON.parse(rmtIo.readStdout());

  context.assert(planStatus === 0, 'xt maraca plan exits successfully');
  context.assert(planJson.schema === MARACA_BUILD_PLAN_SCHEMA && planJson.ok === true, 'xt maraca plan returns JSON build plan');
  context.assert(buildStatus === 0, 'xt maraca build exits successfully');
  context.assert(buildJson.schema === MARACA_BUNDLE_REPORT_SCHEMA && buildJson.ok === true, 'xt maraca build returns JSON bundle result');
  context.assert(rmtStatus === 0, 'xt rmt build --bundle maraca exits successfully');
  context.assert(rmtJson.schema === MARACA_BUNDLE_REPORT_SCHEMA && rmtJson.ok === true, 'xt rmt build --bundle maraca returns JSON bundle result');
  context.assert(fs.existsSync(resolveRepoPath(`${MARACA_RMT_OUT_DIR}/xtend.maraca.mjs`, rootDir)), 'RMT one-step command writes Maraca ESM entry');
  context.assert(planIo.readStderr() === '', 'plan command has no stderr output');
  context.assert(buildIo.readStderr() === '', 'build command has no stderr output');
  context.assert(rmtIo.readStderr() === '', 'rmt build command has no stderr output');

  return context.result({
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    cliCommands: [
      'xt maraca plan',
      'xt maraca build',
      'xt rmt build --bundle maraca'
    ]
  });
}

function printMaracaRmtSourceToBundleReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca RMT Source-to-Bundle CLI erfolgreich.',
    failureTitle: 'XTend Maraca RMT Source-to-Bundle CLI fehlgeschlagen:'
  });
}

async function runMaracaOrchestrationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-orchestration',
    label: 'XTend Maraca App Orchestration'
  });
  const plan = planOrchestrationFixture(rootDir);
  const incompleteStrictPlan = createMaracaBuildPlan({
    source: MARACA_ORCHESTRATION_INCOMPLETE_FIXTURE,
    out: '.xtend-build/maraca/orchestration-incomplete',
    orchestration: 'strict'
  }, { rootDir });
  const result = await buildOrchestrationFixtureAsync(rootDir);
  const entryPath = result.bundleReport && result.bundleReport.entry;
  const reportPath = resolveRepoPath(`${MARACA_ORCHESTRATION_OUT_DIR}/xtend.maraca.report.json`, rootDir);
  const cssPath = resolveRepoPath(`${MARACA_ORCHESTRATION_OUT_DIR}/xtend.maraca.css`, rootDir);
  const entrySource = entryPath && fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';
  const cssSource = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
  const report = fs.existsSync(reportPath) ? readJson(`${MARACA_ORCHESTRATION_OUT_DIR}/xtend.maraca.report.json`, rootDir) : null;
  const cliIo = createCliIo();
  const cliStatus = await runCliAsync([
    'maraca',
    'plan',
    MARACA_ORCHESTRATION_FIXTURE,
    '--orchestration',
    'strict',
    '--json'
  ], cliIo);
  const cliPlan = JSON.parse(cliIo.readStdout());

  context.assert(plan.ok === true, `strict orchestration plan passes${plan.ok ? '' : ` (${plan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(plan.orchestration && plan.orchestration.enabled === true, 'strict orchestration is enabled for complete fixture');
  context.assert(plan.orchestration.summary.schema === 'xtend.rmt.app-orchestration.v1', 'strict plan records compiler orchestration schema');
  context.assert(plan.orchestration.summary.stateCount >= 2, 'strict plan summarizes state graph');
  context.assert(plan.orchestration.summary.actionCount === 1, 'strict plan summarizes action graph');
  context.assert(plan.orchestration.summary.eventCount === 1, 'strict plan summarizes event graph');
  const saveEvent = (plan.events || []).find((event) => event && event.action === 'demo.orchestration.save');
  context.assert(saveEvent && saveEvent.event === 'click' && saveEvent.type === 'click', 'strict plan preserves RMT DOM event type for runtime listener binding');
  context.assert(saveEvent && saveEvent.payload && saveEvent.payload.label === '$target.dataset.label', 'strict plan preserves RMT event payload mappings for runtime routing');
  context.assert(saveEvent && saveEvent.governance && saveEvent.governance.preventDefault === true, 'strict plan preserves RMT event governance for runtime routing');
  context.assert(plan.orchestration.summary.surfaceCount === 2, 'strict plan summarizes surface graph');
  context.assert(plan.kernel && plan.kernel.enabled === true, 'strict orchestration plan enables kernel integration by default');
  context.assert(plan.kernel.summary.recordsSchema === 'xtend.rmt.vnext.kernel-records.v1', 'strict orchestration plan records kernel records schema');
  context.assert(plan.kernel.summary.scheduleCount >= 10, 'strict orchestration plan summarizes detailed kernel schedules including hydration/action/event endpoints');
  context.assert(plan.kernel.summary.fiberCount >= 10, 'strict orchestration plan summarizes detailed kernel fibers including hydration/action/event endpoints');
  context.assert(plan.hydration && plan.hydration.enabled === true, 'strict orchestration plan enables hydration orchestration by default');
  context.assert(plan.hydration && plan.hydration.schema === MARACA_HYDRATION_PLAN_SCHEMA, 'strict orchestration plan records hydration plan schema');
  context.assert(plan.hydration.summary.recordCount >= 2, 'strict orchestration plan summarizes hydration records');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-action-effect-runtime.js'), 'strict orchestration requires action runtime module');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-runtime.esm.js'), 'strict orchestration requires kernel runtime module');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-dom-descriptor-renderer.js'), 'strict orchestration requires DOM descriptor renderer module');
  context.assert(plan.stackModules.some((entry) => entry.source === 'xtendrmt/rmt-runtime.esm.js'), 'strict plan includes kernel runtime in the bundle graph');
  context.assert(plan.stackModules.some((entry) => entry.source === 'xtendrmt/rmt-state-selector-runtime.js'), 'strict plan includes orchestration runtime modules in bundle graph');
  context.assert(incompleteStrictPlan.ok === false, 'strict orchestration blocks incomplete graph');
  context.assert(incompleteStrictPlan.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.orchestration_event_contract_missing' || diagnostic.code === 'rmt.vnext.primitive.payload-contract-missing'), 'strict diagnostics include missing payload contract');

  context.assert(result.ok === true, `strict orchestration bundle passes${result.ok ? '' : ` (${result.status})`}`);
  context.assert(report && report.orchestration && report.orchestration.enabled === true, 'bundle report includes orchestration telemetry');
  context.assert(report && report.kernel && report.kernel.enabled === true, 'bundle report includes kernel telemetry');
  context.assert(report && report.hydration && report.hydration.enabled === true, 'bundle report includes hydration telemetry');
  context.assert(report && report.kernel && report.kernel.summary.scheduleCount >= 10, 'bundle report summarizes detailed kernel schedules including hydration endpoints');
  context.assert(report && report.orchestration && report.orchestration.summary.reducerCount >= 3, 'bundle report summarizes reducer patch plan');
  context.assert(report && report.orchestration && report.orchestration.diagnostics.every((diagnostic) => diagnostic.severity !== 'error'), 'bundle report diagnostics are non-blocking for complete fixture');
  context.assert(entrySource.includes('createOrchestrationController'), 'bundle initializes orchestration controller');
  context.assert(entrySource.includes('createKernelController'), 'bundle initializes kernel controller');
  context.assert(entrySource.includes('createHydrationController'), 'bundle initializes hydration controller');
  context.assert(entrySource.includes('MARACA_HYDRATION'), 'bundle embeds hydration plan');
  context.assert(entrySource.includes('XTendMaracaKernelRuntimeModule'), 'bundle imports the RMT kernel runtime module');
  context.assert(entrySource.includes('xtendrmt-rmt-kernel-orchestration-controller.js'), 'bundle imports reusable kernel orchestration controller asset');
  context.assert(entrySource.includes('XTendRmtStateSelectorRuntime'), 'bundle wires state runtime');
  context.assert(entrySource.includes('XTendRmtActionEffectRuntime'), 'bundle wires action runtime');
  context.assert(entrySource.includes('XTendRmtEventRoutingRuntime'), 'bundle wires event runtime');
  context.assert(entrySource.includes('XTendRmtSurfaceResourceGraphRuntime'), 'bundle wires surface runtime');
  context.assert(entrySource.includes('XTendRmtDomDescriptorRenderer'), 'bundle wires DOM descriptor renderer');
  context.assert(entrySource.includes('querySelectorAll("[data-rmt-component], [data-maraca-surface]")'), 'bundle lazy loader observes orchestrated component tags after descriptor render');
  context.assert(entrySource.includes('entry.element.getAttribute("data-rmt-component")'), 'bundle lazy loader resolves component tags from rendered RMT component attributes');
  context.assert(entrySource.includes('"type": "$model.demo.orchestration.status.tone"'), 'bundle maps RMT tone state onto x-status public type attribute');
  context.assert(entrySource.includes('"variant": "$model.demo.orchestration.command.tone"'), 'bundle maps RMT tone state onto x-button public variant attribute');
  context.assert(entrySource.includes('window.__XTendMaracaOrchestration'), 'bundle exposes orchestration bridge handle');
  context.assert(entrySource.includes('window.__XTendMaracaKernel'), 'bundle exposes kernel bridge handle');
  context.assert(entrySource.includes('window.__XTendMaracaHydration'), 'bundle exposes hydration bridge handle');
  context.assert(entrySource.includes('snapshot: runtimeSnapshot'), 'bundle exposes orchestration snapshot API');
  context.assert(entrySource.includes('shouldPatchSurfaceDescriptorStructure'), 'bundle guards structured surface patches through the framework SSOT');
  context.assert(entrySource.includes('descriptorHasNestedSurface'), 'bundle does not structured-patch x-surface-manager child surface graphs');
  context.assert(entrySource.includes('changedStates'), 'bundle scopes Maraca surface patching to changed state IDs');
  context.assert(entrySource.includes('patchPlanChangedKeys'), 'bundle normalizes array and object patch-plan changed keys');
  context.assert(entrySource.includes('hydrateSurfaceComponents'), 'bundle hydrates visible surface component islands after action/state patches');
  context.assert(entrySource.includes('surface-state'), 'bundle records state-driven surface hydration strategy');
  context.assert(!entrySource.includes('Object.keys(patchPlan.changedStates)'), 'bundle preserves patch-plan changed state IDs instead of array indexes');
  context.assert(entrySource.includes('xtend-maraca:kernel-boot'), 'bundle dispatches kernel boot event');
  context.assert(entrySource.includes('xtend-maraca:kernel-schedule'), 'bundle dispatches kernel schedule event');
  context.assert(entrySource.includes('xtend-maraca:orchestration-boot'), 'bundle dispatches orchestration boot event');
  context.assert(entrySource.includes('xtend-maraca:state-change'), 'bundle dispatches state change event');
  context.assert(entrySource.includes('xtend-maraca:hydration-start'), 'bundle dispatches hydration telemetry');
  context.assert(!/\.innerHTML\s*=/u.test(entrySource), 'bundle entry has no innerHTML assignment sink');
  context.assert(!/\.outerHTML\s*=/u.test(entrySource), 'bundle entry has no outerHTML assignment sink');
  context.assert(!/\.insertAdjacentHTML\s*\(/u.test(entrySource), 'bundle entry has no insertAdjacentHTML sink');
  context.assert(!/document\.write\s*\(/u.test(entrySource), 'bundle entry has no document.write sink');
  context.assert(cssSource.includes('[data-maraca-surface="demo.orchestration.status"]'), 'external CSS includes surface layout selector');
  context.assert(cssSource.includes('--xtend-surface-x:16px'), 'external CSS includes layout token bridge');
  context.assert(!cssSource.includes('--xtend-theme'), 'external CSS avoids full theme generation');
  context.assert(cliStatus === 0, 'xt maraca plan --orchestration strict exits successfully');
  context.assert(cliPlan.orchestration && cliPlan.orchestration.enabled === true, 'CLI returns strict orchestration plan JSON');
  context.assert(cliIo.readStderr() === '', 'strict orchestration CLI plan has no stderr output');

  return context.result({
    schema: MARACA_ORCHESTRATION_PLAN_SCHEMA,
    orchestration: plan.orchestration.summary,
    entry: entryPath
  });
}

function printMaracaOrchestrationReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca App-Orchestrierung erfolgreich.',
    failureTitle: 'XTend Maraca App-Orchestrierung fehlgeschlagen:'
  });
}

async function runMaracaKernelOrchestrationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-kernel-orchestration',
    label: 'XTend Maraca Kernel Orchestration'
  });
  const strictPlan = planKernelOrchestrationFixture(rootDir);
  const kernelOffPlan = planKernelOrchestrationFixture(rootDir, { kernel: 'off' });
  const strictWithoutOrchestration = createMaracaBuildPlan({
    source: MARACA_ORCHESTRATION_FIXTURE,
    out: '.xtend-build/maraca/kernel-strict-without-orchestration',
    orchestration: 'off',
    kernel: 'strict'
  }, { rootDir });
  const result = await buildKernelOrchestrationFixtureAsync(rootDir);
  const entryPath = result.bundleReport && result.bundleReport.entry;
  const reportPath = resolveRepoPath(`${MARACA_KERNEL_ORCHESTRATION_OUT_DIR}/xtend.maraca.report.json`, rootDir);
  const kernelRuntimePath = resolveRepoPath(`${MARACA_KERNEL_ORCHESTRATION_OUT_DIR}/runtime/xtendrmt-rmt-runtime.esm.js`, rootDir);
  const entrySource = entryPath && fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';
  const report = fs.existsSync(reportPath) ? readJson(`${MARACA_KERNEL_ORCHESTRATION_OUT_DIR}/xtend.maraca.report.json`, rootDir) : null;
  const cliIo = createCliIo();
  const cliStatus = await runCliAsync([
    'maraca',
    'plan',
    MARACA_ORCHESTRATION_FIXTURE,
    '--orchestration',
    'strict',
    '--kernel',
    'strict',
    '--json'
  ], cliIo);
  const cliPlan = JSON.parse(cliIo.readStdout());

  context.assert(strictPlan.ok === true, `strict kernel plan passes${strictPlan.ok ? '' : ` (${strictPlan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(strictPlan.kernel && strictPlan.kernel.schema === MARACA_KERNEL_PLAN_SCHEMA, 'strict kernel plan uses kernel plan schema');
  context.assert(strictPlan.kernel && strictPlan.kernel.mode === 'strict', 'strict kernel plan records strict mode');
  context.assert(strictPlan.kernel && strictPlan.kernel.enabled === true, 'strict kernel plan enables kernel integration');
  context.assert(strictPlan.kernel.summary.scheduleCount >= 10, 'strict kernel plan summarizes detailed schedules including hydration endpoints');
  context.assert(strictPlan.kernel.summary.fiberCount >= 10, 'strict kernel plan summarizes detailed fibers including hydration endpoints');
  context.assert(strictPlan.kernel.summary.endpointCount >= 10, 'strict kernel plan summarizes detailed scheduler endpoints');
  context.assert(strictPlan.kernel.runtimeModules.includes('xtendrmt/rmt-runtime.esm.js'), 'strict kernel plan requires RMT runtime module');
  context.assert(kernelOffPlan.ok === true && kernelOffPlan.kernel.enabled === false, 'kernel off keeps orchestration without kernel available');
  context.assert(strictWithoutOrchestration.ok === false, 'strict kernel blocks when orchestration is disabled');
  context.assert(strictWithoutOrchestration.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.kernel_missing'), 'strict kernel without orchestration reports missing kernel integration precondition');

  context.assert(result.ok === true, `strict kernel bundle passes${result.ok ? '' : ` (${result.status})`}`);
  context.assert(report && report.kernel && report.kernel.enabled === true, 'kernel bundle report records enabled kernel integration');
  context.assert(report && report.kernel && report.kernel.recordsSchema === 'xtend.rmt.vnext.kernel-records.v1', 'kernel bundle report records kernel records schema');
  context.assert(report && report.bundleFiles && report.bundleFiles.some((file) => file.fileName === 'runtime/xtendrmt-rmt-runtime.esm.js'), 'kernel runtime is packaged as a runtime asset');
  context.assert(report && report.bundleFiles && report.bundleFiles.some((file) => file.fileName === 'runtime/xtendrmt-rmt-kernel-orchestration-controller.js'), 'kernel orchestration controller is packaged as a runtime asset');
  context.assert(fs.existsSync(kernelRuntimePath), 'kernel runtime asset exists in the build package');
  const kernelRuntimeSource = fs.readFileSync(kernelRuntimePath, 'utf8');
  const kernelRuntimeModule = await import(`data:text/javascript;base64,${Buffer.from(kernelRuntimeSource).toString('base64')}`);
  const kernelHostAdapter = {
    hostKind: 'node_fake_maraca_kernel',
    now: () => 0,
    scheduleTimeout(callback) {
      callback();
      return 0;
    },
    cancelTimeout() {},
    scheduleAnimationFrame(callback) {
      callback(0);
      return 0;
    },
    cancelAnimationFrame() {},
    scheduleIdleCallback(callback) {
      callback({ didTimeout: false, timeRemaining: () => 0 });
      return 0;
    },
    cancelIdleCallback() {},
    createAbortController: () => null,
    createCustomEvent: (name, init = {}) => ({ type: name, detail: init.detail || null })
  };
  const kernelCore = kernelRuntimeModule.createRmtCore({ hostAdapter: kernelHostAdapter, documentTarget: null, windowTarget: globalThis });
  const kernelPerformance = kernelRuntimeModule.createRmtPerformanceRuntime({ hostAdapter: kernelHostAdapter, documentTarget: null, windowTarget: globalThis });
  const schedulerBridge = kernelRuntimeModule.createRmtStateSchedulerDiagnosticsBridge({
    performanceRuntime: kernelPerformance,
    schedules: strictPlan.kernel.artifact.scheduler.schedules
  });
  const scheduleSmoke = schedulerBridge.scheduleEndpoint(
    strictPlan.kernel.artifact.scheduler.schedules[0].endpointName,
    strictPlan.kernel.artifact.scheduler.schedules[0].scope,
    () => ({ ok: true, status: 'node-smoke' }),
    { schedule: strictPlan.kernel.artifact.scheduler.schedules[0], runInline: true }
  );
  context.assert(kernelCore && typeof kernelCore.getCapabilities === 'function', 'packaged kernel runtime creates an RMT core instance in the node smoke');
  context.assert(kernelPerformance && typeof kernelPerformance.scheduleEndpoint === 'function', 'packaged kernel runtime creates a performance scheduler in the node smoke');
  context.assert(scheduleSmoke && scheduleSmoke.status === 'ok', 'packaged kernel scheduler bridge executes a scheduled endpoint in the node smoke');
  context.assert(schedulerBridge.listScheduledEndpoints().length >= 1, 'packaged kernel scheduler bridge records scheduled endpoints in the node smoke');
  context.assert(entrySource.includes('XTendMaracaKernelRuntimeModule') && entrySource.includes('./runtime/xtendrmt-rmt-runtime.esm.js'), 'entry imports the packaged kernel runtime asset');
  context.assert(entrySource.includes('./runtime/xtendrmt-rmt-kernel-orchestration-controller.js'), 'entry imports the reusable kernel orchestration controller asset');
  context.assert(entrySource.includes('createRmtRuntime'), 'entry creates an RMT runtime instance');
  context.assert(entrySource.includes('createRmtCore'), 'entry creates an RMT core instance');
  context.assert(entrySource.includes('createRmtPerformanceRuntime'), 'entry creates a performance runtime instance');
  context.assert(entrySource.includes('createRmtStateSchedulerDiagnosticsBridge'), 'entry creates a scheduler diagnostics bridge');
  context.assert(entrySource.includes('window.__XTendMaracaKernel'), 'entry exposes kernel bridge handle');
  context.assert(entrySource.includes('listScheduledEndpoints'), 'entry exposes scheduled endpoint inspection');
  context.assert(entrySource.includes('xtend-maraca:kernel-fiber'), 'entry dispatches kernel fiber telemetry');
  context.assert(!/\.innerHTML\s*=/u.test(entrySource), 'kernel-backed entry has no innerHTML assignment sink');
  context.assert(!/\.outerHTML\s*=/u.test(entrySource), 'kernel-backed entry has no outerHTML assignment sink');
  context.assert(!/\.insertAdjacentHTML\s*\(/u.test(entrySource), 'kernel-backed entry has no insertAdjacentHTML sink');
  context.assert(!/document\.write\s*\(/u.test(entrySource), 'kernel-backed entry has no document.write sink');
  context.assert(cliStatus === 0, 'xt maraca plan --kernel strict exits successfully');
  context.assert(cliPlan.kernel && cliPlan.kernel.enabled === true, 'CLI returns strict kernel plan JSON');
  context.assert(cliIo.readStderr() === '', 'strict kernel CLI plan has no stderr output');

  return context.result({
    schema: MARACA_KERNEL_PLAN_SCHEMA,
    kernel: strictPlan.kernel.summary,
    entry: entryPath
  });
}

function printMaracaKernelOrchestrationReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Kernel-Orchestrierung erfolgreich.',
    failureTitle: 'XTend Maraca Kernel-Orchestrierung fehlgeschlagen:'
  });
}

function findChromiumExecutable() {
  const candidates = [
    process.env.XTEND_CHROMIUM,
    process.env.CHROME_BIN,
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    'chromium-browser',
    'chromium',
    'google-chrome'
  ].filter(Boolean);
  return candidates.find((candidate) => {
    const resolvedCandidate = (() => {
      if (path.isAbsolute(candidate) || candidate.includes('/')) return candidate;
      const which = spawnSync('which', [candidate], { encoding: 'utf8', timeout: 2000 });
      return which.status === 0 ? String(which.stdout || '').trim().split(/\r?\n/u)[0] || candidate : candidate;
    })();
    if (process.env.XTEND_ALLOW_SNAP_CHROMIUM !== '1') {
      try {
        const source = fs.existsSync(resolvedCandidate) ? fs.readFileSync(resolvedCandidate, 'utf8') : '';
        if (source.includes('/snap/bin/chromium')) return false;
        if (fs.realpathSync(resolvedCandidate).includes('/snap/')) return false;
      } catch (_) {}
    }
    const probe = spawnSync(candidate, ['--version'], { encoding: 'utf8', timeout: 5000 });
    return probe.status === 0;
  }) || null;
}

function htmlDecode(value) {
  return String(value || '')
    .replace(/&quot;/gu, '"')
    .replace(/&#39;/gu, "'")
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&amp;/gu, '&');
}

function writeKernelIntegritySmokeFixture(rootDir) {
  const fixturePath = resolveRepoPath(`${MARACA_KERNEL_INTEGRITY_OUT_DIR}/kernel-integrity-smoke.html`, rootDir);
  fs.writeFileSync(fixturePath, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Maraca Kernel Integrity Smoke</title>
</head>
<body>
  <div id="xtend-maraca-root" data-maraca-root></div>
  <pre id="result">{"ok":false,"status":"pending"}</pre>
  <script>
    window.__XTendMaracaDisableAutoBoot = true;
  </script>
  <script type="module">
    const result = document.getElementById('result');
    const playCalls = [];
    const fullscreenEvents = [];
    let fullscreenElement = null;
    const media = {
      'video-one': { mediaId: 'video-one', kind: 'video', mediaType: 'video/mp4', src: '/tests/fixtures/kernel-video-one.mp4', title: 'Video One' },
      'audio-one': { mediaId: 'audio-one', kind: 'audio', mediaType: 'audio/mpeg', src: '/tests/fixtures/kernel-audio-one.mp3', title: 'Audio One' },
      'video-two': { mediaId: 'video-two', kind: 'video', mediaType: 'video/mp4', src: '/tests/fixtures/kernel-video-two.mp4', title: 'Video Two' },
      'image-one': { mediaId: 'image-one', kind: 'image', mediaType: 'image/jpeg', src: '/tests/fixtures/kernel-image-one.jpg', title: 'Image One' }
    };
    const basePlayer = {
      id: 'demo-kernel-player',
      label: 'Player',
      title: 'No media',
      subtitle: 'Waiting for media',
      kind: 'video',
      src: '',
      poster: '',
      mediaType: 'video',
      controls: true,
      hidden: true,
      open: false,
      surfaceId: 'demo.kernel.player',
      active: false,
      minimized: false,
      maximized: false,
      draggable: true,
      resizable: true,
      modal: false,
      initialX: 80,
      initialY: 80,
      initialWidth: 640,
      initialHeight: 380,
      tone: 'neutral',
      actions: []
    };
    const closedLightbox = { id: 'demo-kernel-lightbox', title: 'Lightbox', src: '', hidden: true, open: false, tone: 'neutral' };
    const closedPlayer = () => ({ ...basePlayer });
    const playerState = (record) => ({
      ...basePlayer,
      title: record.title,
      subtitle: record.src,
      mediaId: record.mediaId,
      kind: record.kind,
      src: record.src,
      mediaType: record.mediaType,
      hidden: false,
      open: true,
      active: true
    });
    const lightboxState = (record) => ({
      id: 'demo-kernel-lightbox',
      title: record.title,
      src: record.src,
      hidden: false,
      open: true,
      tone: 'neutral',
      surfaceId: 'demo.kernel.lightbox'
    });
    const statusState = (text, tone = 'neutral') => ({ id: 'demo-kernel-status', text, tone });
    function patchFor(actionId, payload = {}) {
      const action = String(actionId || '');
      if (action.endsWith('.play')) {
        const record = media[payload.mediaId] || media['video-one'];
        return { status: statusState('Playing ' + record.title, 'success'), player: playerState(record), lightbox: { ...closedLightbox } };
      }
      if (action.endsWith('.lightbox')) {
        const record = media[payload.mediaId] || media['image-one'];
        return { status: statusState('Lightbox ' + record.title, 'info'), player: closedPlayer(), lightbox: lightboxState(record) };
      }
      if (action.endsWith('.dismiss')) {
        return { status: statusState('Dismissed', 'neutral'), player: closedPlayer(), lightbox: { ...closedLightbox } };
      }
      return { status: statusState('Player closed', 'neutral'), player: closedPlayer(), lightbox: { ...closedLightbox } };
    }
    function write(value) {
      result.textContent = JSON.stringify(value, null, 2);
      document.documentElement.setAttribute('data-kernel-integrity-ok', value.ok ? 'true' : 'false');
    }
    function wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async function waitFor(label, predicate, timeout = 5000) {
      const started = Date.now();
      let last = '';
      while (Date.now() - started < timeout) {
        try {
          const value = predicate();
          if (value) return value;
        } catch (error) {
          last = error && error.message ? error.message : String(error);
        }
        await wait(50);
      }
      throw new Error(label + ' did not settle' + (last ? ': ' + last : ''));
    }
    function surface(id) {
      return document.querySelector('[data-maraca-surface="' + id + '"]');
    }
    function player() {
      const host = surface('demo.kernel.player');
      return host && host.querySelector('x-player') || document.querySelector('x-player');
    }
    function manager() {
      return document.querySelector('x-surface-manager');
    }
    function managerRecord(id) {
      const target = manager();
      const snapshot = target && (typeof target.readSnapshot === 'function' ? target.readSnapshot() : target.snapshot && target.snapshot());
      return snapshot && Array.isArray(snapshot.surfaces) ? snapshot.surfaces.find((entry) => entry.id === id) : null;
    }
    async function run(action, payload = {}) {
      const output = await window.__XTendMaracaOrchestration.actionRuntime.runAction(action, payload, {
        eventId: 'integrity:' + action,
        eventName: 'integrity'
      });
      if (!output || output.status !== 'success') {
        throw new Error('Action ' + action + ' did not return an action success result.');
      }
      return output;
    }

    if (window.HTMLMediaElement) {
      HTMLMediaElement.prototype.play = function play() {
        playCalls.push({ src: this.currentSrc || this.src || '', localName: this.localName });
        this.dispatchEvent(new Event('play'));
        this.dispatchEvent(new Event('playing'));
        return Promise.resolve();
      };
      HTMLMediaElement.prototype.pause = function pause() {
        this.dispatchEvent(new Event('pause'));
      };
    }
    if (window.Element) {
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreenElement });
      document.exitFullscreen = () => {
        fullscreenElement = null;
        document.dispatchEvent(new Event('fullscreenchange'));
        return Promise.resolve();
      };
      Element.prototype.requestFullscreen = function requestFullscreen() {
        fullscreenElement = this;
        fullscreenEvents.push(this.localName || this.tagName || 'element');
        document.dispatchEvent(new Event('fullscreenchange'));
        return Promise.resolve();
      };
      Element.prototype.webkitRequestFullscreen = Element.prototype.requestFullscreen;
      document.webkitExitFullscreen = document.exitFullscreen;
      Object.defineProperty(document, 'webkitFullscreenElement', { configurable: true, get: () => fullscreenElement });
    }

    try {
      const maraca = await import('./xtend.maraca.mjs');
      const boot = await maraca.bootXtendMaraca({
        root: document.getElementById('xtend-maraca-root'),
        lazyStrategy: 'eager',
        dataSourceAdapters: {
          host: {
            async invoke({ payload, context }) {
              const actionId = context && context.action && context.action.id || '';
              return { schema: 'xtend.maraca.kernel-integrity-state.v1', state: patchFor(actionId, payload || {}) };
            }
          }
        }
      });
      if (!boot.ok || !window.__XTendMaracaKernel || !window.__XTendMaracaOrchestration) {
        throw new Error('Maraca kernel boot did not expose runtime handles.');
      }
      await customElements.whenDefined('x-surface-manager');
      await customElements.whenDefined('x-surface-window');
      await customElements.whenDefined('x-player');
      await customElements.whenDefined('x-lightbox');

      const first = await run('demo.kernel.play', { mediaId: 'video-one' });
      await waitFor('first player src', () => player() && player().getAttribute('src') === media['video-one'].src);
      await waitFor('first player materialized', () => {
        const record = managerRecord('demo.kernel.player');
        return record && record.status === 'open' && record.active === true;
      });

      await run('demo.kernel.closePlayer');
      await waitFor('player closed', () => {
        const record = managerRecord('demo.kernel.player');
        return record && (record.status === 'closed' || record.status === 'minimized' || surface('demo.kernel.player').hasAttribute('hidden'));
      });

      await run('demo.kernel.lightbox', { mediaId: 'image-one' });
      const lightbox = await waitFor('lightbox opened', () => {
        const target = surface('demo.kernel.lightbox');
        return target && target.hasAttribute('open') && target.getAttribute('src') === media['image-one'].src && target;
      });
      if (typeof lightbox.close === 'function') lightbox.close({ source: 'kernel-integrity' });
      await run('demo.kernel.dismiss');
      await waitFor('lightbox dismissed', () => {
        const target = surface('demo.kernel.lightbox');
        return target && !target.hasAttribute('open') && target.hasAttribute('hidden');
      });

      const second = await run('demo.kernel.play', { mediaId: 'audio-one' });
      await waitFor('audio player src', () => player() && player().getAttribute('src') === media['audio-one'].src);
      await waitFor('audio materialized', () => {
        const record = managerRecord('demo.kernel.player');
        return record && record.status === 'open' && record.active === true;
      });

      const fullscreen = player().shadowRoot && player().shadowRoot.querySelector('#fullscreen');
      if (!fullscreen) throw new Error('XPlayer fullscreen control was not rendered.');
      fullscreen.click();
      await waitFor('fullscreen toggled', () => fullscreenEvents.length > 0 && document.fullscreenElement);

      await run('demo.kernel.closePlayer');
      const third = await run('demo.kernel.play', { mediaId: 'video-two' });
      await waitFor('third player src', () => player() && player().getAttribute('src') === media['video-two'].src);

      const kernelSnapshot = window.__XTendMaracaKernel.snapshot();
      const hydrationSnapshot = window.__XTendMaracaHydration.snapshot();
      const checks = {
        firstActionResult: first.schema === 'xtend.epic18.rmt-action-result.v1',
        secondActionResult: second.schema === 'xtend.epic18.rmt-action-result.v1',
        thirdActionResult: third.schema === 'xtend.epic18.rmt-action-result.v1',
        remotePlayCount: playCalls.length >= 3,
        playerReopenedAfterClose: player().getAttribute('src') === media['video-two'].src,
        lightboxCycle: surface('demo.kernel.lightbox').hasAttribute('hidden') && !surface('demo.kernel.lightbox').hasAttribute('open'),
        fullscreenEvent: fullscreenEvents.length > 0,
        kernelScheduled: kernelSnapshot.enabled === true && kernelSnapshot.scheduledEndpoints.length > 0,
        kernelFibers: kernelSnapshot.fibers.some((entry) => entry.kind === 'action') && kernelSnapshot.fibers.some((entry) => entry.kind === 'hydration'),
        hydrationRecords: hydrationSnapshot.records.some((entry) => entry.component === 'x-player') && hydrationSnapshot.records.some((entry) => entry.component === 'x-lightbox')
      };
      write({
        ok: Object.values(checks).every(Boolean),
        schema: 'xtend.maraca.kernel-integrity.browser-smoke.v1',
        checks,
        playCalls,
        fullscreenEvents,
        kernel: kernelSnapshot,
        hydration: hydrationSnapshot
      });
    } catch (error) {
      write({
        ok: false,
        schema: 'xtend.maraca.kernel-integrity.browser-smoke.v1',
        error: error && error.stack ? error.stack : String(error)
      });
    }
  </script>
</body>
</html>
`, 'utf8');
  return fixturePath;
}

async function runKernelIntegrityBrowserSmoke(context, rootDir) {
  const chromium = findChromiumExecutable();
  if (!chromium) {
    context.skip('kernel integrity browser smoke skipped because Chromium is not available');
    return null;
  }
  const fixturePath = writeKernelIntegritySmokeFixture(rootDir);
  const relativeFixturePath = path.relative(rootDir, fixturePath).replace(/\\/gu, '/');
  let serverHandle = null;
  try {
    serverHandle = await listenXtendDevServer({
      rootDir,
      defaultPath: relativeFixturePath,
      port: 0
    });
    const targetUrl = `${serverHandle.origin}/${relativeFixturePath}`;
    const browser = spawnSync('timeout', [
      '--kill-after=5s',
      '35s',
      chromium,
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--autoplay-policy=no-user-gesture-required',
      '--run-all-compositor-stages-before-draw',
      '--dump-dom',
      targetUrl
    ], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024
    });
    if (browser.error) {
      const reason = browser.error.message || String(browser.error);
      context.fail(`kernel integrity Chromium smoke ${reason}`);
      return null;
    }
    if (browser.status === 124 || browser.status === 137) {
      context.fail('kernel integrity Chromium smoke timed out');
      return null;
    }
    if (browser.status !== 0) {
      context.fail(`kernel integrity Chromium smoke exited ${browser.status}: ${(browser.stderr || '').trim()}`);
      return null;
    }
    const match = /<pre id="result"[^>]*>([\s\S]*?)<\/pre>/u.exec(browser.stdout || '');
    if (!match) {
      context.fail('kernel integrity browser smoke did not expose a result payload');
      return null;
    }
    const payload = JSON.parse(htmlDecode(match[1]));
    context.assert(payload.ok === true, `kernel integrity browser smoke passes${payload.ok ? '' : ` (${payload.error || JSON.stringify(payload.checks || {})})`}`);
    if (payload.checks) {
      Object.entries(payload.checks).forEach(([key, value]) => {
        context.assert(value === true, `kernel integrity browser check ${key} passes`);
      });
    }
    return payload;
  } catch (error) {
    const code = error && error.code ? error.code : '';
    const message = error && error.message ? error.message : String(error);
    if ((code === 'EPERM' || code === 'EACCES') && /listen/u.test(message)) {
      context.skip(`kernel integrity browser smoke skipped because loopback listen is denied (${message})`);
      return null;
    }
    context.fail(`kernel integrity browser smoke failed (${message})`);
    return null;
  } finally {
    if (serverHandle && serverHandle.server) {
      await new Promise((resolve) => serverHandle.server.close(resolve));
    }
  }
}

async function runMaracaKernelIntegritySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-kernel-integrity',
    label: 'XTend Maraca Kernel Integrity'
  });
  const strictPlan = planKernelIntegrityFixture(rootDir);
  const result = await buildKernelIntegrityFixtureAsync(rootDir);
  const entryPath = result.bundleReport && result.bundleReport.entry;
  const reportPath = resolveRepoPath(`${MARACA_KERNEL_INTEGRITY_OUT_DIR}/xtend.maraca.report.json`, rootDir);
  const controllerPath = resolveRepoPath(`${MARACA_KERNEL_INTEGRITY_OUT_DIR}/runtime/xtendrmt-rmt-kernel-orchestration-controller.js`, rootDir);
  const entrySource = entryPath && fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';
  const report = fs.existsSync(reportPath) ? readJson(`${MARACA_KERNEL_INTEGRITY_OUT_DIR}/xtend.maraca.report.json`, rootDir) : null;

  context.assert(strictPlan.ok === true, `kernel integrity plan passes${strictPlan.ok ? '' : ` (${strictPlan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(strictPlan.kernel && strictPlan.kernel.enabled === true, 'kernel integrity plan enables strict kernel');
  context.assert(strictPlan.hydration && strictPlan.hydration.enabled === true, 'kernel integrity plan enables strict hydration');
  context.assert(strictPlan.transitions && strictPlan.transitions.enabled === true, 'kernel integrity plan enables strict transitions');
  context.assert(strictPlan.kernel.summary.fiberCount >= 12, 'kernel integrity plan emits action, event, render and hydration fibers');
  const selectedComponents = strictPlan.components && Array.isArray(strictPlan.components.selected)
    ? strictPlan.components.selected
    : [];
  context.assert(selectedComponents.some((entry) => entry.source === 'components/xplayer.js'), 'kernel integrity component graph includes x-player');
  context.assert(selectedComponents.some((entry) => entry.source === 'components/xlightbox.js'), 'kernel integrity component graph includes x-lightbox');
  context.assert(result.ok === true, `kernel integrity bundle passes${result.ok ? '' : ` (${result.status})`}`);
  context.assert(report && report.kernel && report.kernel.enabled === true, 'kernel integrity bundle report records enabled kernel');
  context.assert(report && report.hydration && report.hydration.enabled === true, 'kernel integrity bundle report records enabled hydration');
  context.assert(report && report.bundleFiles && report.bundleFiles.some((file) => file.fileName === 'runtime/xtendrmt-rmt-kernel-orchestration-controller.js'), 'kernel integrity bundle packages the reusable controller');
  context.assert(fs.existsSync(controllerPath), 'kernel integrity controller runtime asset exists');
  context.assert(entrySource.includes('effect-surface-materialization'), 'bundle includes generic media-effect surface materialization');
  context.assert(entrySource.includes('remote-play') && entrySource.includes('lightbox'), 'bundle includes remote-play and lightbox default effects');
  context.assert(entrySource.includes('window.__XTendMaracaKernel'), 'bundle exposes the kernel handle');
  context.assert(!/\.innerHTML\s*=/u.test(entrySource), 'kernel integrity entry has no innerHTML assignment sink');
  context.assert(!/\.outerHTML\s*=/u.test(entrySource), 'kernel integrity entry has no outerHTML assignment sink');
  context.assert(!/\.insertAdjacentHTML\s*\(/u.test(entrySource), 'kernel integrity entry has no insertAdjacentHTML sink');
  context.assert(!/document\.write\s*\(/u.test(entrySource), 'kernel integrity entry has no document.write sink');

  const browserSmoke = await runKernelIntegrityBrowserSmoke(context, rootDir);

  return context.result({
    schema: 'xtend.maraca.kernel-integrity.v1',
    kernel: strictPlan.kernel.summary,
    entry: entryPath,
    browserSmoke
  });
}

function printMaracaKernelIntegrityReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Kernel Integrity erfolgreich.',
    failureTitle: 'XTend Maraca Kernel Integrity fehlgeschlagen:'
  });
}

async function runMaracaValidationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-validation',
    label: 'XTend Maraca Form Validation'
  });
  const strictPlan = planValidationFixture(rootDir);
  const validationOffPlan = planValidationFixture(rootDir, { validation: 'off' });
  const strictWithoutArtifact = planOrchestrationFixture(rootDir, { out: '.xtend-build/maraca/validation-missing', validation: 'strict' });
  const result = await buildValidationFixtureAsync(rootDir);
  const entryPath = result.bundleReport && result.bundleReport.entry;
  const reportPath = resolveRepoPath(`${MARACA_VALIDATION_OUT_DIR}/xtend.maraca.report.json`, rootDir);
  const entrySource = entryPath && fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';
  const report = fs.existsSync(reportPath) ? readJson(`${MARACA_VALIDATION_OUT_DIR}/xtend.maraca.report.json`, rootDir) : null;
  const cliIo = createCliIo();
  const cliStatus = await runCliAsync([
    'maraca',
    'plan',
    MARACA_VALIDATION_FIXTURE,
    '--orchestration',
    'strict',
    '--kernel',
    'strict',
    '--hydration',
    'strict',
    '--validation',
    'strict',
    '--json'
  ], cliIo);
  const cliPlan = JSON.parse(cliIo.readStdout());

  context.assert(strictPlan.ok === true, `strict validation plan passes${strictPlan.ok ? '' : ` (${strictPlan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(strictPlan.validation && strictPlan.validation.schema === MARACA_VALIDATION_PLAN_SCHEMA, 'strict validation plan uses validation plan schema');
  context.assert(strictPlan.validation && strictPlan.validation.mode === 'strict', 'strict validation plan records strict mode');
  context.assert(strictPlan.validation && strictPlan.validation.enabled === true, 'strict validation plan enables validation runtime');
  context.assert(strictPlan.validation.summary.groupCount === 1, 'strict validation plan summarizes validation groups');
  context.assert(strictPlan.validation.summary.fieldCount === 2, 'strict validation plan summarizes validation fields');
  context.assert(strictPlan.validation.summary.actionGateCount === 1, 'strict validation plan summarizes action gates');
  context.assert(strictPlan.validation.summary.statePatchCount === 1, 'strict validation plan summarizes command disabled patches');
  context.assert(strictPlan.runtimeModules.includes('xtendrmt/rmt-form-validation-runtime.js'), 'strict validation plan requires form validation runtime module');
  context.assert(strictPlan.stackModules.some((entry) => entry.source === 'xtendrmt/rmt-form-validation-runtime.js'), 'strict validation plan includes form validation runtime in the bundle graph');
  context.assert(strictPlan.kernel && strictPlan.kernel.artifact.scheduler.fibers.some((fiber) => fiber.kind === 'validation'), 'strict validation plan has kernel validation fiber');
  context.assert(validationOffPlan.ok === true && validationOffPlan.validation.enabled === false, 'validation off keeps legacy action behavior available');
  context.assert(strictWithoutArtifact.ok === false, 'strict validation blocks when no validation plan exists');
  context.assert(strictWithoutArtifact.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.validation_missing'), 'strict validation without artifact reports validation precondition');

  context.assert(result.ok === true, `strict validation bundle passes${result.ok ? '' : ` (${result.status})`}`);
  context.assert(report && report.validation && report.validation.enabled === true, 'bundle report includes validation telemetry');
  context.assert(report && report.validation && report.validation.summary.actionGateCount === 1, 'bundle report summarizes validation action gates');
  context.assert(report && report.validation && report.validation.diagnostics.every((diagnostic) => diagnostic.severity !== 'error'), 'bundle report validation diagnostics are non-blocking');
  context.assert(entrySource.includes('MARACA_VALIDATION'), 'bundle embeds validation plan');
  context.assert(entrySource.includes('XTendRmtFormValidationRuntime'), 'bundle wires form validation runtime');
  context.assert(entrySource.includes('createRmtFormValidationRuntime'), 'bundle creates form validation runtime');
  context.assert(entrySource.includes('globalTarget.XTendRmtFormValidationRuntime = api'), 'bundle materializes form validation runtime global API');
  context.assert(entrySource.includes('validationRuntime.validateAction'), 'bundle gates actions through validation runtime');
  context.assert(entrySource.includes('window.__XTendMaracaValidation'), 'bundle exposes validation bridge handle');
  context.assert(entrySource.includes('validationPlan: MARACA_VALIDATION'), 'bundle exposes validation plan on XTendMaraca');
  context.assert(entrySource.includes('xtend-maraca:validation-blocked'), 'bundle dispatches validation-blocked telemetry');
  context.assert(entrySource.includes('setIfPresent("invalid")'), 'bundle syncs public invalid attribute');
  context.assert(!/\.innerHTML\s*=/u.test(entrySource), 'validation bundle entry has no innerHTML assignment sink');
  context.assert(!/\.outerHTML\s*=/u.test(entrySource), 'validation bundle entry has no outerHTML assignment sink');
  context.assert(!/\.insertAdjacentHTML\s*\(/u.test(entrySource), 'validation bundle entry has no insertAdjacentHTML sink');
  context.assert(!/document\.write\s*\(/u.test(entrySource), 'validation bundle entry has no document.write sink');

  const runtimePath = resolveRepoPath('xtendrmt/rmt-form-validation-runtime.js', rootDir);
  const runtimeSource = fs.readFileSync(runtimePath, 'utf8');
  const validationModule = await import(`data:text/javascript;base64,${Buffer.from(runtimeSource).toString('base64')}`);
  const values = {
    'demo.validation.name': { value: '', field: 'name' },
    'demo.validation.email': { value: '', field: 'email' },
    'demo.validation.next': { disabled: true }
  };
  const stateRuntime = {
    getState(id) {
      return values[id];
    },
    setState(id, value) {
      values[id] = value;
    }
  };
  const fakeElements = strictPlan.validation.artifact.fields.map((field) => {
    const attributes = new Map([
      ['data-maraca-surface', field.surface],
      ['data-field', values[field.state] && values[field.state].field || '']
    ]);
    return {
      getAttribute(name) {
        return attributes.get(name) || '';
      },
      setAttribute(name, value) {
        attributes.set(name, value === undefined ? '' : String(value));
      },
      removeAttribute(name) {
        attributes.delete(name);
      },
      hasAttribute(name) {
        return attributes.has(name);
      }
    };
  });
  const fakeRoot = {
    querySelectorAll(selector) {
      if (selector === '[data-maraca-surface]' || selector === '[data-field]') return fakeElements;
      return [];
    }
  };
  const validationRuntime = validationModule.createRmtFormValidationRuntime({
    validationPlan: strictPlan.validation.artifact,
    stateRuntime,
    root: fakeRoot,
    windowTarget: null
  });
  validationRuntime.refresh({ reason: 'boot' });
  context.assert(fakeElements.every((element) => !element.hasAttribute('invalid')), 'Node validation smoke does not reveal field errors during boot refresh');
  const invalidGate = validationRuntime.validateAction('demo.validation.next', { report: true });
  context.assert(invalidGate.valid === false, 'Node validation smoke blocks invalid action');
  context.assert(values['demo.validation.next'].disabled === true, 'Node validation smoke keeps command disabled while invalid');
  context.assert(fakeElements.some((element) => element.hasAttribute('invalid')), 'Node validation smoke reveals field errors after blocked action gate');
  values['demo.validation.name'] = { value: 'Avery Stone', field: 'name' };
  values['demo.validation.email'] = { value: 'avery@example.com', field: 'email' };
  validationRuntime.refresh({ reason: 'node-smoke' });
  const validGate = validationRuntime.validateAction('demo.validation.next', { report: true });
  context.assert(values['demo.validation.next'].disabled === false, 'Node validation smoke enables command after valid input');
  context.assert(validGate.valid === true, 'Node validation smoke allows valid action');
  context.assert(fakeElements.every((element) => !element.hasAttribute('invalid')), 'Node validation smoke clears revealed field errors after valid input');
  context.assert(validationRuntime.snapshot().actionGateCount === 1, 'Validation runtime snapshot exposes action gate count');

  context.assert(cliStatus === 0, 'xt maraca plan --validation strict exits successfully');
  context.assert(cliPlan.validation && cliPlan.validation.enabled === true, 'CLI returns strict validation plan JSON');
  context.assert(cliIo.readStderr() === '', 'strict validation CLI plan has no stderr output');

  return context.result({
    schema: MARACA_VALIDATION_PLAN_SCHEMA,
    validation: strictPlan.validation.summary,
    entry: entryPath
  });
}

function printMaracaValidationReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Form Validation erfolgreich.',
    failureTitle: 'XTend Maraca Form Validation fehlgeschlagen:'
  });
}

async function runMaracaTransitionSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-transitions',
    label: 'XTend Maraca Surface Transitions'
  });
  const strictPlan = planTransitionFixture(rootDir);
  const transitionsOffPlan = planTransitionFixture(rootDir, { transitions: 'off' });
  const strictWithoutArtifact = planOrchestrationFixture(rootDir, { out: '.xtend-build/maraca/transitions-missing', transitions: 'strict' });
  const result = await buildTransitionFixtureAsync(rootDir);
  const entryPath = result.bundleReport && result.bundleReport.entry;
  const reportPath = resolveRepoPath(`${MARACA_TRANSITIONS_OUT_DIR}/xtend.maraca.report.json`, rootDir);
  const entrySource = entryPath && fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';
  const report = fs.existsSync(reportPath) ? readJson(`${MARACA_TRANSITIONS_OUT_DIR}/xtend.maraca.report.json`, rootDir) : null;
  const cliIo = createCliIo();
  const cliStatus = await runCliAsync([
    'maraca',
    'plan',
    MARACA_TRANSITIONS_FIXTURE,
    '--orchestration',
    'strict',
    '--kernel',
    'strict',
    '--hydration',
    'strict',
    '--validation',
    'off',
    '--transitions',
    'strict',
    '--json'
  ], cliIo);
  const cliPlan = JSON.parse(cliIo.readStdout());

  context.assert(strictPlan.ok === true, `strict transition plan passes${strictPlan.ok ? '' : ` (${strictPlan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(strictPlan.transitions && strictPlan.transitions.schema === MARACA_TRANSITION_PLAN_SCHEMA, 'strict transition plan uses transition plan schema');
  context.assert(strictPlan.transitions && strictPlan.transitions.mode === 'strict', 'strict transition plan records strict mode');
  context.assert(strictPlan.transitions && strictPlan.transitions.enabled === true, 'strict transition plan enables transition runtime');
  context.assert(strictPlan.transitions.summary.transitionCount === 2, 'strict transition plan summarizes transition count');
  context.assert(strictPlan.transitions.summary.scheduledEndpointCount === 2, 'strict transition plan summarizes transition scheduler endpoints');
  context.assert(strictPlan.runtimeModules.includes('xtendrmt/rmt-surface-transition-runtime.js'), 'strict transition plan requires surface transition runtime module');
  context.assert(strictPlan.runtimeModules.includes('components/xutils.js'), 'strict transition plan requires x-utils effect policy module');
  context.assert(strictPlan.runtimeModules.includes('components/xstate.js'), 'strict transition plan requires xstate mirror module');
  context.assert(strictPlan.stackModules.some((entry) => entry.source === 'xtendrmt/rmt-surface-transition-runtime.js'), 'strict transition plan includes transition runtime in the bundle graph');
  context.assert(strictPlan.stackModules.some((entry) => entry.source === 'components/xutils.js'), 'strict transition plan includes x-utils in the bundle graph');
  context.assert(strictPlan.stackModules.some((entry) => entry.source === 'components/xstate.js'), 'strict transition plan includes xstate in the bundle graph');
  context.assert(strictPlan.kernel && strictPlan.kernel.artifact.scheduler.fibers.some((fiber) => fiber.kind === 'surface-transition'), 'strict transition plan has kernel surface-transition fibers');
  context.assert(transitionsOffPlan.ok === true && transitionsOffPlan.transitions.enabled === false, 'transitions off keeps legacy attribute-sync behavior available');
  context.assert(strictWithoutArtifact.ok === false, 'strict transitions block when no transition plan exists');
  context.assert(strictWithoutArtifact.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.transitions_missing'), 'strict transitions without artifact reports transition precondition');

  context.assert(result.ok === true, `strict transition bundle passes${result.ok ? '' : ` (${result.status})`}`);
  context.assert(report && report.transitions && report.transitions.enabled === true, 'bundle report includes transition telemetry');
  context.assert(report && report.transitions && report.transitions.summary.transitionCount === 2, 'bundle report summarizes transition count');
  context.assert(report && report.transitions && report.transitions.diagnostics.every((diagnostic) => diagnostic.severity !== 'error'), 'bundle report transition diagnostics are non-blocking');
  context.assert(entrySource.includes('MARACA_TRANSITIONS'), 'bundle embeds transition plan');
  context.assert(entrySource.includes('XTendRmtSurfaceTransitionRuntime'), 'bundle wires surface transition runtime');
  context.assert(entrySource.includes('createRmtSurfaceTransitionRuntime'), 'bundle creates surface transition runtime');
  context.assert(entrySource.includes('globalTarget.XTendRmtSurfaceTransitionRuntime = api'), 'bundle materializes surface transition runtime global API');
  context.assert(entrySource.includes('transitionRuntime.applyVisibilityPatch'), 'bundle routes hidden patches through transition runtime');
  context.assert(entrySource.includes('window.__XTendMaracaTransitions'), 'bundle exposes transition bridge handle');
  context.assert(entrySource.includes('transitionPlan: MARACA_TRANSITIONS'), 'bundle exposes transition plan on XTendMaraca');
  context.assert(entrySource.includes('xtend-maraca:surface-transition-start'), 'bundle dispatches transition start telemetry');
  context.assert(entrySource.includes('xtend-maraca:surface-transition-complete'), 'bundle dispatches transition complete telemetry');
  context.assert(entrySource.includes('runUiTransition'), 'bundle integrates x-utils transition runner');
  context.assert(entrySource.includes('xstate.set'), 'bundle integrates xstate transition mirror');
  context.assert(!/\.innerHTML\s*=/u.test(entrySource), 'transition bundle entry has no innerHTML assignment sink');
  context.assert(!/\.outerHTML\s*=/u.test(entrySource), 'transition bundle entry has no outerHTML assignment sink');
  context.assert(!/\.insertAdjacentHTML\s*\(/u.test(entrySource), 'transition bundle entry has no insertAdjacentHTML sink');
  context.assert(!/document\.write\s*\(/u.test(entrySource), 'transition bundle entry has no document.write sink');

  const runtimePath = resolveRepoPath('xtendrmt/rmt-surface-transition-runtime.js', rootDir);
  const runtimeSource = fs.readFileSync(runtimePath, 'utf8');
  const transitionModule = await import(`data:text/javascript;base64,${Buffer.from(runtimeSource).toString('base64')}`);
  const attributes = new Map([['data-maraca-surface', 'demo.transitions.contact']]);
  const fakeElement = {
    style: {},
    getAttribute(name) {
      return attributes.get(name) || '';
    },
    setAttribute(name, value) {
      attributes.set(name, value === undefined ? '' : String(value));
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    hasAttribute(name) {
      return attributes.has(name);
    }
  };
  const fakeRoot = {
    querySelectorAll(selector) {
      if (selector === '[data-maraca-surface]') return [fakeElement];
      return [];
    }
  };
  const xstateValues = {};
  const transitionRuntime = transitionModule.createRmtSurfaceTransitionRuntime({
    transitionPlan: strictPlan.transitions.artifact,
    root: fakeRoot,
    xUtils: {
      runUiTransition(input) {
        return Promise.resolve({ schema: 'xtend.utility.ui-transition-result.v1', status: input.effect === 'none' ? 'fallback' : 'complete' });
      }
    },
    xstate: {
      set(key, value) {
        xstateValues[key] = value;
      }
    },
    windowTarget: null
  });
  const exitResult = await transitionRuntime.applyVisibilityPatch({
    surface: 'demo.transitions.contact',
    element: fakeElement,
    nextHidden: true,
    previousHidden: false,
    action: 'demo.transitions.next'
  });
  context.assert(exitResult && exitResult.status === 'complete', 'Node transition smoke completes an exit transition');
  context.assert(fakeElement.hasAttribute('hidden'), 'Node transition smoke delays and then applies hidden state');
  const enterResult = await transitionRuntime.applyVisibilityPatch({
    surface: 'demo.transitions.contact',
    element: fakeElement,
    nextHidden: false,
    previousHidden: true,
    action: 'demo.transitions.back'
  });
  context.assert(enterResult && enterResult.status === 'complete', 'Node transition smoke completes an enter transition');
  context.assert(!fakeElement.hasAttribute('hidden'), 'Node transition smoke removes hidden state before enter transition');
  context.assert(Object.keys(xstateValues).some((key) => key.includes('xtend.surface.transition.demo.transitions')), 'Node transition smoke mirrors transition state into xstate');
  context.assert(transitionRuntime.snapshot().transitionCount === 2, 'Transition runtime snapshot exposes transition count');

  const createFakeSurfaceElement = (surfaceId, hidden = false) => {
    const attrs = new Map([['data-maraca-surface', surfaceId]]);
    if (hidden) attrs.set('hidden', '');
    return {
      style: hidden ? { display: 'none' } : {},
      getAttribute(name) {
        return attrs.get(name) || '';
      },
      setAttribute(name, value) {
        attrs.set(name, value === undefined ? '' : String(value));
      },
      removeAttribute(name) {
        attrs.delete(name);
      },
      hasAttribute(name) {
        return attrs.has(name);
      }
    };
  };
  const exitSurface = createFakeSurfaceElement('demo.transitions.contact', false);
  const enterSurface = createFakeSurfaceElement('demo.transitions.issue', true);
  let resolveExitEffect = null;
  let enterEffectStarted = false;
  const delayedRuntime = transitionModule.createRmtSurfaceTransitionRuntime({
    transitionPlan: strictPlan.transitions.artifact,
    root: {
      querySelectorAll(selector) {
        if (selector === '[data-maraca-surface]') return [exitSurface, enterSurface];
        return [];
      }
    },
    xUtils: {
      runUiTransition(input) {
        if (input.phase === 'exit') {
          return new Promise((resolve) => {
            resolveExitEffect = () => resolve({ schema: 'xtend.utility.ui-transition-result.v1', status: 'complete' });
          });
        }
        enterEffectStarted = true;
        return Promise.resolve({ schema: 'xtend.utility.ui-transition-result.v1', status: 'complete' });
      }
    },
    windowTarget: null
  });
  const delayedExit = delayedRuntime.applyVisibilityPatch({
    surface: 'demo.transitions.contact',
    element: exitSurface,
    nextHidden: true,
    previousHidden: false,
    action: 'demo.transitions.next'
  });
  await Promise.resolve();
  const delayedEnter = delayedRuntime.applyVisibilityPatch({
    surface: 'demo.transitions.issue',
    element: enterSurface,
    nextHidden: false,
    previousHidden: true,
    action: 'demo.transitions.next'
  });
  await Promise.resolve();
  context.assert(enterSurface.hasAttribute('hidden'), 'Node transition smoke keeps entering surface hidden while exit runs');
  context.assert(enterEffectStarted === false, 'Node transition smoke delays enter effect until exit completes');
  resolveExitEffect();
  await delayedExit;
  await delayedEnter;
  context.assert(exitSurface.hasAttribute('hidden'), 'Node transition smoke hides exiting surface after transition');
  context.assert(!enterSurface.hasAttribute('hidden'), 'Node transition smoke materializes entering surface after exit completes');
  context.assert(enterEffectStarted === true, 'Node transition smoke runs enter effect after exit completes');

  context.assert(cliStatus === 0, 'xt maraca plan --transitions strict exits successfully');
  context.assert(cliPlan.transitions && cliPlan.transitions.enabled === true, 'CLI returns strict transition plan JSON');
  context.assert(cliIo.readStderr() === '', 'strict transition CLI plan has no stderr output');

  return context.result({
    schema: MARACA_TRANSITION_PLAN_SCHEMA,
    transitions: strictPlan.transitions.summary,
    entry: entryPath
  });
}

function printMaracaTransitionReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Surface Transitions erfolgreich.',
    failureTitle: 'XTend Maraca Surface Transitions fehlgeschlagen:'
  });
}

function runMaracaPackageExportsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-package-exports',
    label: 'XTend Maraca Package Exports'
  });
  const packageManifest = readJson('package.json', rootDir);
  const lockfile = readJson('package-lock.json', rootDir);
  const maracaPackage = readJson(MARACA_PACKAGE_PATH, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const cli = readText('xtend-builder/lib/cli.js', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.maraca;

  context.assert(packageManifest.workspaces.includes('xtend-maraca'), 'root package registers xtend-maraca workspace');
  context.assert(packageManifest.files.includes('xtend-maraca'), 'root package includes xtend-maraca package files');
  context.assert(packageManifest.exports['./maraca'] && packageManifest.exports['./maraca'].default === './xtend-maraca/index.js', 'root package exports @ccslabs/xtend/maraca');
  context.assert(packageManifest.exports['./maraca/runtime'] && packageManifest.exports['./maraca/runtime'].default === './xtend-maraca/runtime.js', 'root package exports @ccslabs/xtend/maraca/runtime');
  context.assert(packageManifest.scopedPackages.some((entry) => entry.name === '@ccslabs/xtend-maraca' && entry.path === 'xtend-maraca'), 'scoped package metadata includes @ccslabs/xtend-maraca');
  context.assert(maracaPackage.dependencies.rollup && maracaPackage.dependencies.rollup.startsWith('^4.'), 'Maraca package declares Rollup as a real dependency');
  context.assert(maracaPackage.dependencies.terser && maracaPackage.dependencies.terser.startsWith('^5.'), 'Maraca package declares Terser as a real dependency');
  context.assert(!maracaPackage.peerDependencies.rollup, 'Rollup is not left as an optional peer');
  context.assert(!maracaPackage.peerDependencies.terser, 'Terser is not left as an optional peer');
  context.assert(lockfile.packages['xtend-maraca'] && lockfile.packages['xtend-maraca'].name === '@ccslabs/xtend-maraca', 'package-lock tracks xtend-maraca workspace');
  context.assert(lockfile.packages['node_modules/@ccslabs/xtend-maraca'] && lockfile.packages['node_modules/@ccslabs/xtend-maraca'].link === true, 'package-lock tracks xtend-maraca workspace link');
  context.assert(metadata && metadata.schema === 'xtend.maraca.package-metadata.v1', 'package metadata declares Maraca package schema');
  context.assert(metadata && metadata.buildPlanSchema === MARACA_BUILD_PLAN_SCHEMA, 'package metadata declares build-plan schema');
  context.assert(metadata && metadata.bundleReportSchema === MARACA_BUNDLE_REPORT_SCHEMA, 'package metadata declares bundle-report schema');
  context.assert(metadata && metadata.sizeBudgetReportSchema === MARACA_SIZE_BUDGET_REPORT_SCHEMA, 'package metadata declares size-budget schema');
  context.assert(metadata && metadata.kernelPlanSchema === MARACA_KERNEL_PLAN_SCHEMA, 'package metadata declares kernel-plan schema');
  context.assert(metadata && metadata.hydrationPlanSchema === MARACA_HYDRATION_PLAN_SCHEMA, 'package metadata declares hydration-plan schema');
  context.assert(metadata && metadata.validationPlanSchema === MARACA_VALIDATION_PLAN_SCHEMA, 'package metadata declares validation-plan schema');
  context.assert(metadata && metadata.transitionPlanSchema === MARACA_TRANSITION_PLAN_SCHEMA, 'package metadata declares transition-plan schema');
  context.assert(packageManifest.scripts['build:maraca'].includes('maraca build'), 'package exposes build:maraca script');
  context.assert(packageManifest.scripts['test:maraca'].includes(MARACA_SUITES.join(' ')), 'package exposes combined Maraca test script');
  MARACA_SUITES.forEach((suiteId) => {
    context.assert(runner.includes(`id: '${suiteId}'`), `test runner registers ${suiteId}`);
  });
  context.assert(cli.includes('xt maraca plan app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json'), 'CLI help documents Maraca kernel hydration validation transition orchestration plan command');
  context.assert(cli.includes('xt rmt build app.rmt --bundle maraca --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict'), 'CLI help documents one-step RMT Maraca kernel hydration validation transition orchestration build');

  return context.result({
    schema: 'xtend.maraca.package-exports-report.v1',
    suites: MARACA_SUITES
  });
}

function printMaracaPackageExportsReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Package Exports erfolgreich.',
    failureTitle: 'XTend Maraca Package Exports fehlgeschlagen:'
  });
}

async function runMaracaSizeBudgetSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-size-budget',
    label: 'XTend Maraca Size Budget'
  });
  const result = await buildFixtureAsync(rootDir);
  const debugResult = await buildFixtureAsync(rootDir, {
    out: '.xtend-build/maraca/debug-external',
    profile: 'debug',
    lazy: 'none',
    css: 'external'
  });
  const maxResult = await buildFixtureAsync(rootDir, {
    out: '.xtend-build/maraca/max',
    profile: 'max',
    lazy: 'component',
    css: 'inline'
  });
  const sizeReport = result.sizeBudgetReport;
  const debugCssPath = resolveRepoPath('.xtend-build/maraca/debug-external/xtend.maraca.css', rootDir);
  const debugEntryPath = debugResult.bundleReport && debugResult.bundleReport.entry;
  const debugEntry = debugEntryPath && fs.existsSync(debugEntryPath) ? fs.readFileSync(debugEntryPath, 'utf8') : '';
  const debugBundleFiles = debugResult.bundleReport && Array.isArray(debugResult.bundleReport.bundleFiles)
    ? debugResult.bundleReport.bundleFiles
    : [];
  const maxNameCache = maxResult.bundleReport && maxResult.bundleReport.toolchain && maxResult.bundleReport.toolchain.nameCache;

  context.assert(sizeReport && sizeReport.schema === MARACA_SIZE_BUDGET_REPORT_SCHEMA, 'size report uses Maraca size-budget schema');
  context.assert(sizeReport && sizeReport.ok === true, 'production bundle is smaller than the legacy loader baseline');
  context.assert(sizeReport && sizeReport.bundleBytes > 0, 'size report records bundle bytes');
  context.assert(sizeReport && sizeReport.baselineBytes > sizeReport.bundleBytes, 'size report baseline exceeds bundle bytes');
  context.assert(sizeReport && sizeReport.baseline.loaderBytes > 0, 'size report includes legacy loader baseline bytes');
  context.assert(debugResult.ok === true, 'debug external-CSS build passes');
  context.assert(fs.existsSync(debugCssPath), 'external CSS build writes CSS asset');
  context.assert(debugResult.sizeBudgetReport && debugResult.sizeBudgetReport.status === 'debug_not_enforced', 'debug build records a non-enforced size budget');
  context.assert(debugBundleFiles.every((file) => !file.isDynamicEntry), 'lazy none debug build avoids dynamic component chunks');
  context.assert(!debugEntry.includes('import('), 'lazy none debug build avoids dynamic imports');
  context.assert(maxResult.ok === true, 'max Rollup/Terser build passes');
  context.assert(maxResult.bundleReport && maxResult.bundleReport.toolchain && maxResult.bundleReport.toolchain.nameCache, 'max build persists a Terser name cache');
  context.assert(Boolean(maxNameCache && fs.existsSync(maxNameCache)), 'max build writes the Terser name-cache file');
  context.assert(maxResult.sizeBudgetReport && maxResult.sizeBudgetReport.bundleBytes <= sizeReport.bundleBytes, 'max build is at least as small as production');

  return context.result({
    schema: MARACA_SIZE_BUDGET_REPORT_SCHEMA,
    baselineBytes: sizeReport && sizeReport.baselineBytes,
    bundleBytes: sizeReport && sizeReport.bundleBytes
  });
}

function printMaracaSizeBudgetReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Size Budget erfolgreich.',
    failureTitle: 'XTend Maraca Size Budget fehlgeschlagen:'
  });
}

module.exports = {
  MARACA_SUITES,
  printMaracaBundleReport,
  printMaracaKernelIntegrityReport,
  printMaracaKernelOrchestrationReport,
  printMaracaOrchestrationReport,
  printMaracaPackageExportsReport,
  printMaracaPlanReport,
  printMaracaRmtSourceToBundleReport,
  printMaracaSizeBudgetReport,
  printMaracaTransitionReport,
  printMaracaValidationReport,
  runMaracaBundleSuite,
  runMaracaKernelIntegritySuite,
  runMaracaKernelOrchestrationSuite,
  runMaracaOrchestrationSuite,
  runMaracaPackageExportsSuite,
  runMaracaPlanSuite,
  runMaracaRmtSourceToBundleSuite,
  runMaracaSizeBudgetSuite,
  runMaracaTransitionSuite,
  runMaracaValidationSuite
};

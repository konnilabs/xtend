const fs = require('fs');
const path = require('path');
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
  MARACA_SIZE_BUDGET_REPORT_SCHEMA,
  buildMaracaBundleAsync,
  createMaracaBuildPlan
} = require('../../xtend-maraca');
const {
  runCliAsync
} = require('../../xtend-builder/lib/cli');

const MARACA_MODULE_PATH = 'xtend-maraca/index.js';
const MARACA_RUNTIME_PATH = 'xtend-maraca/runtime.js';
const MARACA_PACKAGE_PATH = 'xtend-maraca/package.json';
const MARACA_FIXTURE = 'tests/rmt-language/fixtures/maraca-known-components.rmt';
const MARACA_UNKNOWN_FIXTURE = 'tests/rmt-language/fixtures/vnext-source-to-sea.rmt';
const MARACA_OUT_DIR = '.xtend-build/maraca/source-to-sea';
const MARACA_RMT_OUT_DIR = '.xtend-build/maraca/rmt-command';
const MARACA_SUITES = [
  'maraca-plan',
  'maraca-bundle',
  'maraca-rmt-source-to-bundle',
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

  assertFileExists(context, MARACA_MODULE_PATH, rootDir, 'Maraca module exists');
  assertFileExists(context, MARACA_RUNTIME_PATH, rootDir, 'Maraca runtime helper exists');
  assertFileExists(context, MARACA_FIXTURE, rootDir, 'Maraca known-component fixture exists');
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

  context.assert(result.schema === MARACA_BUNDLE_REPORT_SCHEMA, 'bundle result uses Maraca bundle-report schema');
  context.assert(result.ok === true, `Maraca bundle passes${result.ok ? '' : ` (${result.status})`}`);
  context.assert(Boolean(entryPath && fs.existsSync(entryPath)), 'ESM entry is written');
  context.assert(fs.existsSync(reportPath), 'bundle report is written');
  context.assert(fs.existsSync(sizePath), 'size-budget report is written');
  context.assert(report && report.schema === MARACA_BUNDLE_REPORT_SCHEMA, 'bundle report schema is stable');
  context.assert(report && report.loader && report.loader.mode === 'inline-registry', 'bundle report records inline registry mode');
  context.assert(report && report.toolchain && report.toolchain.active === 'rollup-terser', 'bundle uses the Rollup/Terser toolchain');
  context.assert(report && report.toolchain && report.toolchain.rollup && report.toolchain.rollup.available === true, 'Rollup is available in Maraca report');
  context.assert(report && report.toolchain && report.toolchain.terser && report.toolchain.terser.available === true, 'Terser is available in Maraca report');
  context.assert(report && report.forbiddenRuntimeDependencies.componentManifestJson === false, 'bundle report rejects component manifest runtime dependency');
  context.assert(!bundleText.includes('components/manifest.json'), 'bundle does not reference the component manifest JSON file');
  context.assert(!bundleText.includes('data-manifest'), 'bundle does not reference a data-manifest attribute');
  context.assert(!bundleText.includes('xtend-loader.js'), 'bundle does not reference the legacy loader file');
  context.assert(bundleFiles.some((file) => file.fileName.includes('x-status')), 'bundle writes an x-status lazy chunk');
  context.assert(bundleFiles.some((file) => file.fileName.includes('x-toast')), 'bundle writes an x-toast lazy chunk');
  context.assert(bundleFiles.some((file) => file.fileName.includes('x-progress')), 'bundle writes an x-progress lazy chunk');
  context.assert(!bundleText.includes('x-modal'), 'bundle excludes unused x-modal module');
  context.assert(!bundleText.includes('x-button'), 'bundle excludes unused x-button module');
  context.assert(entrySource.includes('window.XTendMaraca'), 'entry exposes the documented XTendMaraca bridge');
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
  context.assert(packageManifest.scripts['build:maraca'].includes('maraca build'), 'package exposes build:maraca script');
  context.assert(packageManifest.scripts['test:maraca'].includes(MARACA_SUITES.join(' ')), 'package exposes combined Maraca test script');
  MARACA_SUITES.forEach((suiteId) => {
    context.assert(runner.includes(`id: '${suiteId}'`), `test runner registers ${suiteId}`);
  });
  context.assert(cli.includes('xt maraca plan app.rmt --json'), 'CLI help documents Maraca plan command');
  context.assert(cli.includes('xt rmt build app.rmt --bundle maraca'), 'CLI help documents one-step RMT Maraca build');

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
  printMaracaPackageExportsReport,
  printMaracaPlanReport,
  printMaracaRmtSourceToBundleReport,
  printMaracaSizeBudgetReport,
  runMaracaBundleSuite,
  runMaracaPackageExportsSuite,
  runMaracaPlanSuite,
  runMaracaRmtSourceToBundleSuite,
  runMaracaSizeBudgetSuite
};

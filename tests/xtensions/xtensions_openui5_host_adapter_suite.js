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
  XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA
} = require('../../tools/xtensions/host-controller-contract');
const {
  normalizeXTensionManifest
} = require('../../tools/xtensions/maraca-xtension-manifest');
const {
  evaluateXTensionSecurity
} = require('../../tools/xtensions/security-integrity-gate');
const {
  OPENUI5_CAPABILITIES,
  OPENUI5_DEPENDENCY_BOUNDARY_CODE,
  OPENUI5_REMOTE_LOADER_CODE,
  XTENSIONS_OPENUI5_ADAPTER_CONTRACT_PATH,
  XTENSIONS_OPENUI5_ADAPTER_FIXTURE_PATH,
  XTENSIONS_OPENUI5_ADAPTER_MODULE_PATH,
  XTENSIONS_OPENUI5_ADAPTER_PACKAGE_SCRIPT,
  XTENSIONS_OPENUI5_ADAPTER_SCHEMA,
  XTENSIONS_OPENUI5_ADAPTER_SUITE_PATH,
  XTENSIONS_OPENUI5_ADAPTER_TYPES_PATH,
  XTENSIONS_OPENUI5_ADAPTER_WORKPACKAGE,
  XTENSIONS_OPENUI5_LOADER_BOUNDARY_PACKAGE_SCRIPT,
  XTENSIONS_OPENUI5_LOADER_BOUNDARY_SCHEMA,
  XTENSIONS_OPENUI5_REPORT_SCHEMA,
  assertOpenUi5DependencyBoundary,
  createFrameworklessOpenUi5HostAdapter,
  createOpenUi5AdapterContract,
  createOpenUi5AdapterReport,
  normalizeOpenUi5LoaderBoundary,
  serializeOpenUi5AdapterReport
} = require('../../tools/xtensions/openui5-host-adapter');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function createClock() {
  let tick = 0;
  return () => {
    tick += 1;
    return `2026-06-30T10:20:${String(tick).padStart(2, '0')}Z`;
  };
}

function loadCommon(rootDir) {
  return {
    packageManifest: require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir)),
    runner: require('../utils/test-catalog').readRunnerCatalog(rootDir),
    backlog: readText(BACKLOG_PATH, rootDir),
    contractDoc: readText(XTENSIONS_OPENUI5_ADAPTER_CONTRACT_PATH, rootDir),
    fixture: readJson(XTENSIONS_OPENUI5_ADAPTER_FIXTURE_PATH, rootDir),
    moduleText: readText(XTENSIONS_OPENUI5_ADAPTER_MODULE_PATH, rootDir),
    typesText: readText(XTENSIONS_OPENUI5_ADAPTER_TYPES_PATH, rootDir)
  };
}

function assertCommonFiles(context, rootDir) {
  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, XTENSIONS_OPENUI5_ADAPTER_CONTRACT_PATH, rootDir, 'OpenUI5 XTension contract document exists');
  assertFileExists(context, XTENSIONS_OPENUI5_ADAPTER_MODULE_PATH, rootDir, 'OpenUI5 Host Adapter module exists');
  assertFileExists(context, XTENSIONS_OPENUI5_ADAPTER_TYPES_PATH, rootDir, 'OpenUI5 Host Adapter types exist');
  assertFileExists(context, XTENSIONS_OPENUI5_ADAPTER_SUITE_PATH, rootDir, 'OpenUI5 Host Adapter suite exists');
  assertFileExists(context, XTENSIONS_OPENUI5_ADAPTER_FIXTURE_PATH, rootDir, 'OpenUI5 Host Adapter fixture exists');
  const moduleSyntax = syntaxCheckFile(XTENSIONS_OPENUI5_ADAPTER_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_OPENUI5_ADAPTER_SUITE_PATH, { rootDir, extension: '.js' });
  context.assert(moduleSyntax.ok, `OpenUI5 Host Adapter module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `OpenUI5 Host Adapter suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
}

function assertPackageWiring(context, common) {
  const packageManifest = common.packageManifest;
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsOpenUi5HostAdapter;
  context.assert(metadata && metadata.schema === XTENSIONS_OPENUI5_ADAPTER_SCHEMA, 'package metadata declares OpenUI5 adapter schema');
  context.assert(metadata && metadata.loaderBoundarySchema === XTENSIONS_OPENUI5_LOADER_BOUNDARY_SCHEMA, 'package metadata declares OpenUI5 loader boundary schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_OPENUI5_ADAPTER_WORKPACKAGE, 'package metadata points to XTN-16');
  context.assert(metadata && metadata.module === XTENSIONS_OPENUI5_ADAPTER_MODULE_PATH, 'package metadata points to OpenUI5 adapter module');
  context.assert(metadata && metadata.types === XTENSIONS_OPENUI5_ADAPTER_TYPES_PATH, 'package metadata points to OpenUI5 adapter types');
  context.assert(metadata && metadata.fixture === XTENSIONS_OPENUI5_ADAPTER_FIXTURE_PATH, 'package metadata points to OpenUI5 adapter fixture');
  context.assert(metadata && metadata.suite === XTENSIONS_OPENUI5_ADAPTER_SUITE_PATH, 'package metadata points to OpenUI5 adapter suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-openui5-host-controller xtensions-openui5-loader-boundary --json', 'package metadata declares OpenUI5 local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_OPENUI5_ADAPTER_PACKAGE_SCRIPT, 'package metadata declares OpenUI5 host package script');
  context.assert(metadata && metadata.loaderBoundaryScript === XTENSIONS_OPENUI5_LOADER_BOUNDARY_PACKAGE_SCRIPT, 'package metadata declares OpenUI5 loader boundary package script');
  context.assert(metadata && metadata.sameRealmHardSecurity === false, 'package metadata does not claim same-realm hard security');
  context.assert(metadata && metadata.sapUi5CdnAllowed === false, 'package metadata blocks SAPUI5 CDN');

  const exportEntry = packageManifest.exports['./xtensions/openui5-host-adapter'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/openui5-host-adapter.js', 'package exports OpenUI5 host adapter module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/openui5-host-adapter.d.ts', 'package exports OpenUI5 host adapter types');
  context.assert(packageManifest.scripts['test:xtensions-openui5-host-controller'] === 'node scripts/run_xtend_tests.js xtensions-openui5-host-controller', 'package exposes OpenUI5 host test script');
  context.assert(packageManifest.scripts['test:xtensions-openui5-loader-boundary'] === 'node scripts/run_xtend_tests.js xtensions-openui5-loader-boundary', 'package exposes OpenUI5 loader boundary test script');
  context.assert(common.runner.hasSuite('xtensions-openui5-host-controller'), 'runner exposes OpenUI5 host controller suite');
  context.assert(common.runner.hasSuite('xtensions-openui5-loader-boundary'), 'runner exposes OpenUI5 loader boundary suite');
  context.assert(common.backlog.includes('| `XTN-16` | P2 | completed | WS14 |'), 'backlog marks XTN-16 completed');
  context.assert(common.contractDoc.includes('Contract: `xtend.xtensions.openui5-adapter.v1`'), 'contract document declares OpenUI5 schema');
  context.assert(common.contractDoc.includes('product-local-bundled'), 'contract document names product-local bundled dependency policy');
}

function runXTensionsOpenUi5HostControllerSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-openui5-host-controller',
    label: 'XTensions OpenUI5 Host Adapter Contract'
  });
  const common = loadCommon(rootDir);
  const fixture = common.fixture;

  assertCommonFiles(context, rootDir);
  assertPackageWiring(context, common);
  context.assert(fixture.schema === 'xtend.xtensions.openui5-host-adapter.fixture.v1', 'fixture declares OpenUI5 host adapter fixture schema');
  context.assert(fixture.contract === XTENSIONS_OPENUI5_ADAPTER_SCHEMA, 'fixture points to OpenUI5 adapter contract');
  context.assert(fixture.expectedFramework === 'openui5', 'fixture names OpenUI5 framework');
  context.assert(!('@openui5/sap.ui.core' in (common.packageManifest.dependencies || {})), 'root package does not depend on OpenUI5 core');

  const contract = createOpenUi5AdapterContract({ loader: fixture.loader });
  context.assert(contract.schema === XTENSIONS_OPENUI5_ADAPTER_SCHEMA, 'contract factory exposes OpenUI5 adapter schema');
  context.assert(contract.loaderBoundary.ok === true, 'contract factory accepts product-local OpenUI5 loader boundary');
  OPENUI5_CAPABILITIES.forEach((capability) => {
    context.assert(contract.capabilities.includes(capability), `contract exposes capability ${capability}`);
  });

  const adapter = createFrameworklessOpenUi5HostAdapter({
    id: fixture.expectedXtensionId,
    surfaceId: 'surface.openui5.procurement',
    clock: createClock()
  });
  const target = {};
  const mountResult = adapter.mount(target, { orders: [{ id: 'PO-1000' }], seed: 'seed-ui5' }, { loader: fixture.loader });
  const updateResult = adapter.update({ props: { orders: [{ id: 'PO-1001' }], seed: 'seed-next' }, reason: 'demo-reseed' });
  const suspendResult = adapter.suspend('visibility-hidden');
  const resumeResult = adapter.resume('visibility-visible');
  const errorResult = adapter.reportError(new Error('synthetic OpenUI5 adapter error'), { recoverable: true });
  const unmountResult = adapter.unmount('suite-complete');
  const snapshot = adapter.snapshot();

  context.assert(mountResult.schema === XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA && mountResult.ok === true, 'frameworkless OpenUI5 adapter mounts');
  context.assert(target.openUi5Mounted === true, 'frameworkless OpenUI5 adapter marks host-owned target');
  context.assert(updateResult.ok === true && updateResult.lifecycleRecord.event === 'surface:updated', 'frameworkless OpenUI5 adapter updates model data');
  context.assert(suspendResult.ok === true && suspendResult.lifecycleRecord.event === 'surface:suspended', 'frameworkless OpenUI5 adapter suspends');
  context.assert(resumeResult.ok === true && resumeResult.lifecycleRecord.event === 'surface:resumed', 'frameworkless OpenUI5 adapter resumes');
  context.assert(errorResult.status === 'degraded' && errorResult.lifecycleRecord.event === 'surface:error', 'frameworkless OpenUI5 adapter reports degraded errors');
  context.assert(unmountResult.ok === true && unmountResult.cleanupRecords.some((record) => record.resource === 'openui5-control-tree'), 'frameworkless OpenUI5 adapter releases control tree');
  context.assert(snapshot.destroyed === true && snapshot.controlDestroyed === true && snapshot.lifecycleCount >= 6, 'frameworkless OpenUI5 adapter snapshot records cleanup');

  return context.result({
    schema: XTENSIONS_OPENUI5_REPORT_SCHEMA,
    adapterSchema: XTENSIONS_OPENUI5_ADAPTER_SCHEMA,
    workpackage: XTENSIONS_OPENUI5_ADAPTER_WORKPACKAGE,
    module: XTENSIONS_OPENUI5_ADAPTER_MODULE_PATH,
    suite: XTENSIONS_OPENUI5_ADAPTER_SUITE_PATH,
    fixture: XTENSIONS_OPENUI5_ADAPTER_FIXTURE_PATH,
    lifecycleRecordCount: snapshot.lifecycleCount
  });
}

function runXTensionsOpenUi5LoaderBoundarySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-openui5-loader-boundary',
    label: 'XTensions OpenUI5 Loader Boundary Contract'
  });
  const common = loadCommon(rootDir);
  const fixture = common.fixture;

  assertCommonFiles(context, rootDir);
  assertPackageWiring(context, common);

  const loader = normalizeOpenUi5LoaderBoundary(fixture.loader);
  context.assert(loader.schema === XTENSIONS_OPENUI5_LOADER_BOUNDARY_SCHEMA, 'loader boundary normalizes with schema');
  context.assert(loader.ok === true, 'product-local OpenUI5 loader boundary is accepted');
  context.assert(loader.sameRealmHardSecurity === false, 'loader boundary does not claim same-realm hard security');
  context.assert(loader.bootstrap === '/dist/xtensions/openui5/resources/sap-ui-core.js', 'loader boundary uses local sap-ui-core bootstrap');

  const remoteLoader = normalizeOpenUi5LoaderBoundary({
    resourceRoot: 'https://ui5.sap.com/resources/',
    bootstrap: 'https://ui5.sap.com/resources/sap-ui-core.js'
  });
  context.assert(remoteLoader.ok === false, 'remote SAPUI5/OpenUI5 loader boundary is rejected');
  context.assert(remoteLoader.diagnostics.some((diagnostic) => diagnostic.code === OPENUI5_REMOTE_LOADER_CODE), 'remote loader emits remote-loader diagnostic');

  const dependencyBoundary = assertOpenUi5DependencyBoundary({
    packageManifest: common.packageManifest,
    sourceText: `${common.moduleText}\n${common.typesText}`
  });
  context.assert(dependencyBoundary.ok === true, 'OpenUI5 adapter avoids root OpenUI5 dependencies and remote loaders');

  const badBoundary = assertOpenUi5DependencyBoundary({
    packageManifest: {
      dependencies: {
        '@openui5/sap.ui.core': '1.149.1'
      }
    },
    sourceText: 'const ui5 = "https://ui5.sap.com/resources/sap-ui-core.js";'
  });
  context.assert(badBoundary.ok === false, 'OpenUI5 dependency boundary rejects root dependencies and remote loaders');
  context.assert(badBoundary.diagnostics.some((diagnostic) => diagnostic.code === OPENUI5_DEPENDENCY_BOUNDARY_CODE), 'root dependency diagnostic is emitted');
  context.assert(badBoundary.diagnostics.some((diagnostic) => diagnostic.code === OPENUI5_REMOTE_LOADER_CODE), 'remote source diagnostic is emitted');

  const normalizedManifest = normalizeXTensionManifest(fixture.manifest);
  context.assert(normalizedManifest.ok === true, 'OpenUI5 product-local bundled manifest normalizes successfully');
  context.assert(normalizedManifest.dependencies.productLocalBundledCount >= 1, 'manifest records product-local bundled dependencies');

  const securityReport = evaluateXTensionSecurity(fixture.manifest);
  context.assert(securityReport.status === 'ready', 'OpenUI5 product-local bundled manifest passes security gate');

  const report = createOpenUi5AdapterReport({
    loader: fixture.loader,
    dependencyBoundary: {
      packageManifest: common.packageManifest,
      sourceText: common.moduleText
    }
  }, { clock: createClock() });
  context.assert(report.ok === true, 'OpenUI5 adapter report is ok for product-local loader');
  context.assert(serializeOpenUi5AdapterReport(report).includes(XTENSIONS_OPENUI5_REPORT_SCHEMA), 'OpenUI5 report serializes schema');

  return context.result({
    schema: XTENSIONS_OPENUI5_REPORT_SCHEMA,
    adapterSchema: XTENSIONS_OPENUI5_ADAPTER_SCHEMA,
    loaderBoundarySchema: XTENSIONS_OPENUI5_LOADER_BOUNDARY_SCHEMA,
    workpackage: XTENSIONS_OPENUI5_ADAPTER_WORKPACKAGE,
    localLoader: loader.bootstrap
  });
}

function printXTensionsOpenUi5HostControllerReport(result) {
  printSuiteReport(result);
}

function printXTensionsOpenUi5LoaderBoundaryReport(result) {
  printSuiteReport(result);
}

module.exports = {
  printXTensionsOpenUi5HostControllerReport,
  printXTensionsOpenUi5LoaderBoundaryReport,
  runXTensionsOpenUi5HostControllerSuite,
  runXTensionsOpenUi5LoaderBoundarySuite
};

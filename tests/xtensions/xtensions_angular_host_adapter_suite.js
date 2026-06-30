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
  ANGULAR_CAPABILITIES,
  ANGULAR_DEPENDENCY_BOUNDARY_CODE,
  ANGULAR_REMOTE_LOADER_CODE,
  ANGULAR_RUNTIME_COMPILER_CODE,
  XTENSIONS_ANGULAR_ADAPTER_CONTRACT_PATH,
  XTENSIONS_ANGULAR_ADAPTER_FIXTURE_PATH,
  XTENSIONS_ANGULAR_ADAPTER_MODULE_PATH,
  XTENSIONS_ANGULAR_ADAPTER_PACKAGE_SCRIPT,
  XTENSIONS_ANGULAR_ADAPTER_SCHEMA,
  XTENSIONS_ANGULAR_ADAPTER_SUITE_PATH,
  XTENSIONS_ANGULAR_ADAPTER_TYPES_PATH,
  XTENSIONS_ANGULAR_ADAPTER_WORKPACKAGE,
  XTENSIONS_ANGULAR_REPORT_SCHEMA,
  XTENSIONS_ANGULAR_ZONE_BOUNDARY_PACKAGE_SCRIPT,
  XTENSIONS_ANGULAR_ZONE_BOUNDARY_SCHEMA,
  assertAngularDependencyBoundary,
  createAngularAdapterContract,
  createAngularAdapterReport,
  createFrameworklessAngularHostAdapter,
  normalizeAngularZoneBoundary,
  serializeAngularAdapterReport
} = require('../../tools/xtensions/angular-host-adapter');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function createClock() {
  let tick = 0;
  return () => {
    tick += 1;
    return `2026-06-30T11:20:${String(tick).padStart(2, '0')}Z`;
  };
}

function loadCommon(rootDir) {
  return {
    packageManifest: readJson('package.json', rootDir),
    runner: readText('scripts/run_xtend_tests.js', rootDir),
    backlog: readText(BACKLOG_PATH, rootDir),
    contractDoc: readText(XTENSIONS_ANGULAR_ADAPTER_CONTRACT_PATH, rootDir),
    fixture: readJson(XTENSIONS_ANGULAR_ADAPTER_FIXTURE_PATH, rootDir),
    moduleText: readText(XTENSIONS_ANGULAR_ADAPTER_MODULE_PATH, rootDir),
    typesText: readText(XTENSIONS_ANGULAR_ADAPTER_TYPES_PATH, rootDir)
  };
}

function assertCommonFiles(context, rootDir) {
  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, XTENSIONS_ANGULAR_ADAPTER_CONTRACT_PATH, rootDir, 'Angular XTension contract document exists');
  assertFileExists(context, XTENSIONS_ANGULAR_ADAPTER_MODULE_PATH, rootDir, 'Angular Host Adapter module exists');
  assertFileExists(context, XTENSIONS_ANGULAR_ADAPTER_TYPES_PATH, rootDir, 'Angular Host Adapter types exist');
  assertFileExists(context, XTENSIONS_ANGULAR_ADAPTER_SUITE_PATH, rootDir, 'Angular Host Adapter suite exists');
  assertFileExists(context, XTENSIONS_ANGULAR_ADAPTER_FIXTURE_PATH, rootDir, 'Angular Host Adapter fixture exists');
  const moduleSyntax = syntaxCheckFile(XTENSIONS_ANGULAR_ADAPTER_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_ANGULAR_ADAPTER_SUITE_PATH, { rootDir, extension: '.js' });
  context.assert(moduleSyntax.ok, `Angular Host Adapter module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Angular Host Adapter suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
}

function assertPackageWiring(context, common) {
  const packageManifest = common.packageManifest;
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsAngularHostAdapter;
  context.assert(metadata && metadata.schema === XTENSIONS_ANGULAR_ADAPTER_SCHEMA, 'package metadata declares Angular adapter schema');
  context.assert(metadata && metadata.zoneBoundarySchema === XTENSIONS_ANGULAR_ZONE_BOUNDARY_SCHEMA, 'package metadata declares Angular zone boundary schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_ANGULAR_ADAPTER_WORKPACKAGE, 'package metadata points to XTN-17');
  context.assert(metadata && metadata.module === XTENSIONS_ANGULAR_ADAPTER_MODULE_PATH, 'package metadata points to Angular adapter module');
  context.assert(metadata && metadata.types === XTENSIONS_ANGULAR_ADAPTER_TYPES_PATH, 'package metadata points to Angular adapter types');
  context.assert(metadata && metadata.fixture === XTENSIONS_ANGULAR_ADAPTER_FIXTURE_PATH, 'package metadata points to Angular adapter fixture');
  context.assert(metadata && metadata.suite === XTENSIONS_ANGULAR_ADAPTER_SUITE_PATH, 'package metadata points to Angular adapter suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-angular-host-controller xtensions-angular-zone-boundary --json', 'package metadata declares Angular local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_ANGULAR_ADAPTER_PACKAGE_SCRIPT, 'package metadata declares Angular host package script');
  context.assert(metadata && metadata.zoneBoundaryScript === XTENSIONS_ANGULAR_ZONE_BOUNDARY_PACKAGE_SCRIPT, 'package metadata declares Angular zone boundary package script');
  context.assert(metadata && metadata.runtimeCompilerAllowed === false, 'package metadata blocks runtime Angular compiler');
  context.assert(metadata && metadata.angularCdnAllowed === false, 'package metadata blocks Angular CDN');

  const exportEntry = packageManifest.exports['./xtensions/angular-host-adapter'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/angular-host-adapter.js', 'package exports Angular host adapter module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/angular-host-adapter.d.ts', 'package exports Angular host adapter types');
  context.assert(packageManifest.scripts['test:xtensions-angular-host-controller'] === 'node scripts/run_xtend_tests.js xtensions-angular-host-controller', 'package exposes Angular host test script');
  context.assert(packageManifest.scripts['test:xtensions-angular-zone-boundary'] === 'node scripts/run_xtend_tests.js xtensions-angular-zone-boundary', 'package exposes Angular zone boundary test script');
  context.assert(common.runner.includes("id: 'xtensions-angular-host-controller'"), 'runner exposes Angular host controller suite');
  context.assert(common.runner.includes("id: 'xtensions-angular-zone-boundary'"), 'runner exposes Angular zone boundary suite');
  context.assert(common.backlog.includes('| `XTN-17` | P2 | completed | WS14 |'), 'backlog marks XTN-17 completed');
  context.assert(common.contractDoc.includes('Contract: `xtend.xtensions.angular-adapter.v1`'), 'contract document declares Angular schema');
  context.assert(common.contractDoc.includes('AOT'), 'contract document names AOT boundary');
}

function runXTensionsAngularHostControllerSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-angular-host-controller',
    label: 'XTensions Angular Host Adapter Contract'
  });
  const common = loadCommon(rootDir);
  const fixture = common.fixture;

  assertCommonFiles(context, rootDir);
  assertPackageWiring(context, common);
  context.assert(fixture.schema === 'xtend.xtensions.angular-host-adapter.fixture.v1', 'fixture declares Angular host adapter fixture schema');
  context.assert(fixture.contract === XTENSIONS_ANGULAR_ADAPTER_SCHEMA, 'fixture points to Angular adapter contract');
  context.assert(fixture.expectedFramework === 'angular', 'fixture names Angular framework');
  context.assert(!('@angular/core' in (common.packageManifest.dependencies || {})), 'root package does not depend on Angular core');

  const contract = createAngularAdapterContract({ zoneBoundary: fixture.zoneBoundary });
  context.assert(contract.schema === XTENSIONS_ANGULAR_ADAPTER_SCHEMA, 'contract factory exposes Angular adapter schema');
  context.assert(contract.zoneBoundary.ok === true, 'contract factory accepts AOT zoneless boundary');
  ANGULAR_CAPABILITIES.forEach((capability) => {
    context.assert(contract.capabilities.includes(capability), `contract exposes capability ${capability}`);
  });

  const adapter = createFrameworklessAngularHostAdapter({
    id: fixture.expectedXtensionId,
    surfaceId: 'surface.angular.risk',
    clock: createClock()
  });
  const target = {};
  const mountResult = adapter.mount(target, { risks: [{ id: 'RISK-1000' }], seed: 'seed-ng' }, { zoneBoundary: fixture.zoneBoundary });
  const updateResult = adapter.update({ props: { risks: [{ id: 'RISK-1001' }], seed: 'seed-next' }, reason: 'demo-reseed' });
  const suspendResult = adapter.suspend('visibility-hidden');
  const resumeResult = adapter.resume('visibility-visible');
  const errorResult = adapter.reportError(new Error('synthetic Angular adapter error'), { recoverable: true });
  const unmountResult = adapter.unmount('suite-complete');
  const snapshot = adapter.snapshot();

  context.assert(mountResult.schema === XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA && mountResult.ok === true, 'frameworkless Angular adapter mounts');
  context.assert(target.angularMounted === true, 'frameworkless Angular adapter marks host-owned target');
  context.assert(updateResult.ok === true && updateResult.lifecycleRecord.event === 'surface:updated', 'frameworkless Angular adapter updates signal data');
  context.assert(suspendResult.ok === true && suspendResult.lifecycleRecord.event === 'surface:suspended', 'frameworkless Angular adapter suspends');
  context.assert(resumeResult.ok === true && resumeResult.lifecycleRecord.event === 'surface:resumed', 'frameworkless Angular adapter resumes');
  context.assert(errorResult.status === 'degraded' && errorResult.lifecycleRecord.event === 'surface:error', 'frameworkless Angular adapter reports degraded errors');
  context.assert(unmountResult.ok === true && unmountResult.cleanupRecords.some((record) => record.resource === 'angular-application-ref'), 'frameworkless Angular adapter releases ApplicationRef');
  context.assert(snapshot.destroyed === true && snapshot.applicationDestroyed === true && snapshot.lifecycleCount >= 6, 'frameworkless Angular adapter snapshot records cleanup');

  return context.result({
    schema: XTENSIONS_ANGULAR_REPORT_SCHEMA,
    adapterSchema: XTENSIONS_ANGULAR_ADAPTER_SCHEMA,
    workpackage: XTENSIONS_ANGULAR_ADAPTER_WORKPACKAGE,
    module: XTENSIONS_ANGULAR_ADAPTER_MODULE_PATH,
    suite: XTENSIONS_ANGULAR_ADAPTER_SUITE_PATH,
    fixture: XTENSIONS_ANGULAR_ADAPTER_FIXTURE_PATH,
    lifecycleRecordCount: snapshot.lifecycleCount
  });
}

function runXTensionsAngularZoneBoundarySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-angular-zone-boundary',
    label: 'XTensions Angular Zone Boundary Contract'
  });
  const common = loadCommon(rootDir);
  const fixture = common.fixture;

  assertCommonFiles(context, rootDir);
  assertPackageWiring(context, common);

  const boundary = normalizeAngularZoneBoundary(fixture.zoneBoundary);
  context.assert(boundary.schema === XTENSIONS_ANGULAR_ZONE_BOUNDARY_SCHEMA, 'zone boundary normalizes with schema');
  context.assert(boundary.ok === true, 'AOT zoneless Angular boundary is accepted');
  context.assert(boundary.runtimeCompilerAllowed === false, 'zone boundary blocks runtime compiler');
  context.assert(boundary.remoteArtifactsAllowed === false, 'zone boundary blocks remote artifacts');

  const remoteBoundary = normalizeAngularZoneBoundary({
    buildMode: 'jit',
    runtimeCompiler: true,
    remoteArtifactsAllowed: true
  });
  context.assert(remoteBoundary.ok === false, 'JIT/runtime compiler boundary is rejected');
  context.assert(remoteBoundary.diagnostics.some((diagnostic) => diagnostic.code === ANGULAR_RUNTIME_COMPILER_CODE), 'runtime compiler diagnostic is emitted');
  context.assert(remoteBoundary.diagnostics.some((diagnostic) => diagnostic.code === ANGULAR_REMOTE_LOADER_CODE), 'remote artifact diagnostic is emitted');

  const dependencyBoundary = assertAngularDependencyBoundary({
    packageManifest: common.packageManifest,
    sourceText: `${common.moduleText}\n${common.typesText}`
  });
  context.assert(dependencyBoundary.ok === true, 'Angular adapter avoids root Angular dependencies and runtime compiler imports');

  const badBoundary = assertAngularDependencyBoundary({
    packageManifest: {
      dependencies: {
        '@angular/core': '~19.2.0'
      }
    },
    sourceText: 'import "@angular/compiler"; const loader = "https://unpkg.com/@angular/core";'
  });
  context.assert(badBoundary.ok === false, 'Angular dependency boundary rejects root dependencies, compiler imports and remote loaders');
  context.assert(badBoundary.diagnostics.some((diagnostic) => diagnostic.code === ANGULAR_DEPENDENCY_BOUNDARY_CODE), 'root dependency diagnostic is emitted');
  context.assert(badBoundary.diagnostics.some((diagnostic) => diagnostic.code === ANGULAR_RUNTIME_COMPILER_CODE), 'runtime compiler source diagnostic is emitted');
  context.assert(badBoundary.diagnostics.some((diagnostic) => diagnostic.code === ANGULAR_REMOTE_LOADER_CODE), 'remote source diagnostic is emitted');

  const normalizedManifest = normalizeXTensionManifest(fixture.manifest);
  context.assert(normalizedManifest.ok === true, 'Angular product-local bundled manifest normalizes successfully');
  context.assert(normalizedManifest.dependencies.productLocalBundledCount >= 1, 'manifest records product-local bundled dependencies');

  const securityReport = evaluateXTensionSecurity(fixture.manifest);
  context.assert(securityReport.status === 'ready', 'Angular product-local bundled manifest passes security gate');

  const report = createAngularAdapterReport({
    zoneBoundary: fixture.zoneBoundary,
    dependencyBoundary: {
      packageManifest: common.packageManifest,
      sourceText: common.moduleText
    }
  }, { clock: createClock() });
  context.assert(report.ok === true, 'Angular adapter report is ok for AOT product-local boundary');
  context.assert(serializeAngularAdapterReport(report).includes(XTENSIONS_ANGULAR_REPORT_SCHEMA), 'Angular report serializes schema');

  return context.result({
    schema: XTENSIONS_ANGULAR_REPORT_SCHEMA,
    adapterSchema: XTENSIONS_ANGULAR_ADAPTER_SCHEMA,
    zoneBoundarySchema: XTENSIONS_ANGULAR_ZONE_BOUNDARY_SCHEMA,
    workpackage: XTENSIONS_ANGULAR_ADAPTER_WORKPACKAGE,
    buildMode: boundary.buildMode
  });
}

function printXTensionsAngularHostControllerReport(result) {
  printSuiteReport(result);
}

function printXTensionsAngularZoneBoundaryReport(result) {
  printSuiteReport(result);
}

module.exports = {
  printXTensionsAngularHostControllerReport,
  printXTensionsAngularZoneBoundaryReport,
  runXTensionsAngularHostControllerSuite,
  runXTensionsAngularZoneBoundarySuite
};

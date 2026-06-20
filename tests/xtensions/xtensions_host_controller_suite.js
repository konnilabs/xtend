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
  DEFAULT_CLEANUP_RESOURCES,
  HOST_CONTROLLER_RESULT_STATUSES,
  REQUIRED_HOST_CONTROLLER_METHODS,
  XTENSIONS_HOST_CONTROLLER_FIXTURE_PATH,
  XTENSIONS_HOST_CONTROLLER_FRAMEWORK_DEPENDENCY_CODE,
  XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA,
  XTENSIONS_HOST_CONTROLLER_METHOD_MISSING_CODE,
  XTENSIONS_HOST_CONTROLLER_MODULE_PATH,
  XTENSIONS_HOST_CONTROLLER_PACKAGE_SCRIPT,
  XTENSIONS_HOST_CONTROLLER_REPORT_SCHEMA,
  XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA,
  XTENSIONS_HOST_CONTROLLER_SCHEMA,
  XTENSIONS_HOST_CONTROLLER_SUITE_PATH,
  XTENSIONS_HOST_CONTROLLER_TYPES_PATH,
  XTENSIONS_HOST_CONTROLLER_WORKPACKAGE,
  assertNoFrameworkDependencies,
  createFrameworklessHostControllerStub,
  createLifecycleRecord,
  createXTensionHostControllerContract,
  normalizeHostControllerDefinition,
  normalizeHostControllerResult
} = require('../../tools/xtensions/host-controller-contract');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';
const ARCHITECTURE_CONTRACT_PATH = 'development/XTensions-Architecture-and-Threat-Model-Contract.md';
const HOST_CONTROLLER_CONTRACT_PATH = 'development/XTensions-HostController-Lifecycle-Contract.md';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function createClock() {
  let tick = 0;
  return () => {
    tick += 1;
    return `2026-06-20T00:00:${String(tick).padStart(2, '0')}Z`;
  };
}

function runXTensionsHostControllerSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-host-controller',
    label: 'XTensions HostController Lifecycle Contract'
  });

  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsHostController;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const architectureContract = readText(ARCHITECTURE_CONTRACT_PATH, rootDir);
  const hostControllerContract = readText(HOST_CONTROLLER_CONTRACT_PATH, rootDir);
  const fixture = readJson(XTENSIONS_HOST_CONTROLLER_FIXTURE_PATH, rootDir);
  const moduleText = readText(XTENSIONS_HOST_CONTROLLER_MODULE_PATH, rootDir);
  const typesText = readText(XTENSIONS_HOST_CONTROLLER_TYPES_PATH, rootDir);
  const fixtureText = readText(XTENSIONS_HOST_CONTROLLER_FIXTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(XTENSIONS_HOST_CONTROLLER_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_HOST_CONTROLLER_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, ARCHITECTURE_CONTRACT_PATH, rootDir, 'XTensions architecture contract exists');
  assertFileExists(context, HOST_CONTROLLER_CONTRACT_PATH, rootDir, 'XTensions HostController contract document exists');
  assertFileExists(context, XTENSIONS_HOST_CONTROLLER_MODULE_PATH, rootDir, 'XTensions HostController module exists');
  assertFileExists(context, XTENSIONS_HOST_CONTROLLER_TYPES_PATH, rootDir, 'XTensions HostController types exist');
  assertFileExists(context, XTENSIONS_HOST_CONTROLLER_SUITE_PATH, rootDir, 'XTensions HostController suite exists');
  assertFileExists(context, XTENSIONS_HOST_CONTROLLER_FIXTURE_PATH, rootDir, 'XTensions HostController dummy fixture exists');
  context.assert(moduleSyntax.ok, `XTensions HostController module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTensions HostController suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'package metadata declares HostController schema');
  context.assert(metadata && metadata.resultSchema === XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA, 'package metadata declares HostController result schema');
  context.assert(metadata && metadata.lifecycleRecordSchema === XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA, 'package metadata declares HostController lifecycle record schema');
  context.assert(metadata && metadata.reportSchema === XTENSIONS_HOST_CONTROLLER_REPORT_SCHEMA, 'package metadata declares HostController report schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_HOST_CONTROLLER_WORKPACKAGE, 'package metadata points to XTN-01');
  context.assert(metadata && metadata.module === XTENSIONS_HOST_CONTROLLER_MODULE_PATH, 'package metadata points to HostController module');
  context.assert(metadata && metadata.types === XTENSIONS_HOST_CONTROLLER_TYPES_PATH, 'package metadata points to HostController types');
  context.assert(metadata && metadata.fixture === XTENSIONS_HOST_CONTROLLER_FIXTURE_PATH, 'package metadata points to HostController fixture');
  context.assert(metadata && metadata.suite === XTENSIONS_HOST_CONTROLLER_SUITE_PATH, 'package metadata points to HostController suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-host-controller --json', 'package metadata declares HostController local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_HOST_CONTROLLER_PACKAGE_SCRIPT, 'package metadata declares HostController package script');
  context.assert(metadata && metadata.frameworkDependenciesAllowed === false, 'package metadata blocks framework dependencies');
  context.assert(metadata && metadata.vendoredFrameworksAllowed === false, 'package metadata blocks vendored frameworks');

  const exportEntry = packageManifest.exports['./xtensions/host-controller-contract'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/host-controller-contract.js', 'package exports HostController contract module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/host-controller-contract.d.ts', 'package exports HostController contract types');
  context.assert(packageManifest.scripts['test:xtensions-host-controller'] === 'node scripts/run_xtend_tests.js xtensions-host-controller', 'package exposes HostController test script');
  context.assert(runner.includes("id: 'xtensions-host-controller'"), 'test runner exposes xtensions-host-controller suite');

  context.assert(backlog.includes('| `XTN-01` | P0 | completed | WS1 |'), 'backlog marks XTN-01 completed');
  context.assert(backlog.includes('development/XTensions-HostController-Lifecycle-Contract.md'), 'backlog references HostController contract');
  context.assert(architectureContract.includes('frameworkless Contract Stubs'), 'architecture contract keeps frameworkless test boundary');
  context.assert(hostControllerContract.includes('Contract: `xtend.xtensions.host-controller.v1`'), 'HostController contract declares schema');
  context.assert(hostControllerContract.includes('no-framework-test-fixture-dependencies-in-xtend-package'), 'HostController contract declares test dependency boundary');
  context.assert(hostControllerContract.includes('node scripts/run_xtend_tests.js xtensions-host-controller --json'), 'HostController contract declares local gate');

  context.assert(fixture.schema === 'xtend.xtensions.host-controller.fixture.v1', 'dummy fixture declares HostController fixture schema');
  context.assert(fixture.contract === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'dummy fixture points to HostController contract');
  context.assert(fixture.dependencyPolicy && fixture.dependencyPolicy.frameworkDependenciesAllowed === false, 'dummy fixture blocks framework dependencies');
  context.assert(fixture.dependencyPolicy && fixture.dependencyPolicy.vendoredFrameworksAllowed === false, 'dummy fixture blocks vendored frameworks');
  assertIncludesAll(context, fixture.dummyHost.methods, REQUIRED_HOST_CONTROLLER_METHODS, 'dummy fixture exposes all required methods');
  assertIncludesAll(context, fixture.dummyHost.cleanupResources, DEFAULT_CLEANUP_RESOURCES, 'dummy fixture names required cleanup resources');

  const dependencyCheck = assertNoFrameworkDependencies({
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}`
  });
  context.assert(dependencyCheck.ok, `HostController package, module and fixture avoid framework dependencies${dependencyCheck.ok ? '' : ` (${dependencyCheck.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);

  const badDependencyCheck = assertNoFrameworkDependencies({
    packageManifest: {
      dependencies: {
        react: '^0.0.0'
      }
    }
  });
  context.assert(
    badDependencyCheck.diagnostics.some((diagnostic) => diagnostic.code === XTENSIONS_HOST_CONTROLLER_FRAMEWORK_DEPENDENCY_CODE),
    'dependency guard rejects forbidden framework dependencies'
  );

  const contract = createXTensionHostControllerContract();
  context.assert(contract.schema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'contract factory exposes HostController schema');
  context.assert(contract.hostNeutral === true, 'contract factory stays host-neutral');
  context.assert(contract.dependencyPolicy.frameworkDependenciesAllowed === false, 'contract factory blocks framework dependencies');
  context.assert(contract.dependencyPolicy.vendoredFrameworksAllowed === false, 'contract factory blocks vendored frameworks');
  assertIncludesAll(context, contract.requiredMethods, REQUIRED_HOST_CONTROLLER_METHODS, 'contract factory names required methods');
  assertIncludesAll(context, contract.resultStatuses, HOST_CONTROLLER_RESULT_STATUSES, 'contract factory names result statuses');
  assertIncludesAll(context, contract.cleanupResources, DEFAULT_CLEANUP_RESOURCES, 'contract factory names cleanup resources');
  assertIncludesAll(context, contract.lifecycle.map((entry) => entry.emittedEvent), fixture.dummyHost.expectedLifecycleEvents, 'contract lifecycle emits expected events');

  const normalizedFixtureHost = normalizeHostControllerDefinition(fixture.dummyHost);
  context.assert(normalizedFixtureHost.ok === true, 'dummy HostController definition validates');
  const normalizedBrokenHost = normalizeHostControllerDefinition({
    id: 'broken.host',
    framework: 'frameworkless-stub',
    methods: ['mount'],
    imports: ['react']
  });
  context.assert(normalizedBrokenHost.ok === false, 'broken HostController definition fails validation');
  context.assert(normalizedBrokenHost.diagnostics.some((diagnostic) => diagnostic.code === XTENSIONS_HOST_CONTROLLER_METHOD_MISSING_CODE), 'broken HostController reports missing methods');
  context.assert(normalizedBrokenHost.diagnostics.some((diagnostic) => diagnostic.code === XTENSIONS_HOST_CONTROLLER_FRAMEWORK_DEPENDENCY_CODE), 'broken HostController reports framework import');

  const stub = createFrameworklessHostControllerStub({
    id: fixture.dummyHost.id,
    surfaceId: 'surface.xtensions.dummy',
    clock: createClock()
  });
  const mountResult = stub.mount({ id: 'xtension-host-container' }, { title: 'Dummy' });
  const updateResult = stub.update({ type: 'props', payload: { title: 'Updated' } });
  const suspendResult = stub.suspend('visibility-hidden');
  const resumeResult = stub.resume('visibility-visible');
  const errorResult = stub.reportError(new Error('dummy render failure'), { recoverable: true });
  const unmountResult = stub.unmount('test-complete');
  const secondUnmountResult = stub.unmount('test-complete');
  const lifecycleRecords = stub.getLifecycleRecords();
  const cleanupRecords = stub.getCleanupRecords();
  const lifecycleEvents = lifecycleRecords.slice(0, fixture.dummyHost.expectedLifecycleEvents.length).map((record) => record.event);

  context.assert(mountResult.ok === true && mountResult.status === 'ok', 'frameworkless stub mounts successfully');
  context.assert(updateResult.ok === true && updateResult.lifecycleRecord.event === 'surface:updated', 'frameworkless stub updates through signal record');
  context.assert(suspendResult.ok === true && suspendResult.lifecycleRecord.event === 'surface:suspended', 'frameworkless stub suspends');
  context.assert(resumeResult.ok === true && resumeResult.lifecycleRecord.event === 'surface:resumed', 'frameworkless stub resumes');
  context.assert(errorResult.status === 'degraded' && errorResult.lifecycleRecord.event === 'surface:error', 'frameworkless stub reports degraded errors');
  context.assert(unmountResult.ok === true && unmountResult.lifecycleRecord.event === 'surface:destroyed', 'frameworkless stub unmounts with destroyed event');
  context.assert(secondUnmountResult.status === 'skipped' && secondUnmountResult.cleanupRecords.length === 0, 'frameworkless stub unmount is idempotent');
  context.assert(cleanupRecords.length === DEFAULT_CLEANUP_RESOURCES.length, 'frameworkless stub releases required resources once');
  assertIncludesAll(context, cleanupRecords.map((record) => record.resource), DEFAULT_CLEANUP_RESOURCES, 'frameworkless stub cleanup records name required resources');
  context.assert(JSON.stringify(lifecycleEvents) === JSON.stringify(fixture.dummyHost.expectedLifecycleEvents), 'frameworkless stub emits expected lifecycle event order');
  context.assert(lifecycleRecords.every((record, index) => record.sequence === index + 1), 'frameworkless stub lifecycle records have monotone sequence');
  context.assert(lifecycleRecords.every((record) => record.schema === XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA), 'frameworkless stub lifecycle records keep schema');

  const normalizedResult = normalizeHostControllerResult('update', { status: 'unknown-status' });
  context.assert(normalizedResult.schema === XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA, 'normalized HostController result keeps result schema');
  context.assert(normalizedResult.status === 'failed' && normalizedResult.ok === false, 'unknown HostController result statuses normalize to failed');
  const standaloneRecord = createLifecycleRecord('update', 'surface:updated', { sequence: 42, payload: { serializable: true } });
  const roundTrippedRecord = JSON.parse(JSON.stringify(standaloneRecord));
  context.assert(roundTrippedRecord.schema === XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA, 'standalone lifecycle record is serializable');

  return context.result({
    schema: XTENSIONS_HOST_CONTROLLER_REPORT_SCHEMA,
    contractSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    workpackage: XTENSIONS_HOST_CONTROLLER_WORKPACKAGE,
    module: XTENSIONS_HOST_CONTROLLER_MODULE_PATH,
    suite: XTENSIONS_HOST_CONTROLLER_SUITE_PATH,
    fixture: XTENSIONS_HOST_CONTROLLER_FIXTURE_PATH,
    lifecycleRecordCount: lifecycleRecords.length,
    cleanupRecordCount: cleanupRecords.length
  });
}

function printXTensionsHostControllerReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions HostController Lifecycle Contract erfolgreich.',
    failureTitle: 'XTensions HostController Lifecycle Contract fehlgeschlagen:'
  });
}

module.exports = {
  printXTensionsHostControllerReport,
  runXTensionsHostControllerSuite
};

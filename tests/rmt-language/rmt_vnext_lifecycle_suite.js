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
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  LIFECYCLE_ADAPTER_MISSING_CODE,
  LIFECYCLE_CAPABILITY_MISSING_CODE,
  LIFECYCLE_OPERATION_MATRIX,
  LIFECYCLE_OPERATION_UNSUPPORTED_CODE,
  LIFECYCLE_TARGET_MISSING_CODE,
  LIFECYCLE_TARGET_UNSUPPORTED_CODE,
  RMT_VNEXT_LIFECYCLE_MODULE_PATH,
  RMT_VNEXT_LIFECYCLE_PACKAGE_SCRIPT,
  RMT_VNEXT_LIFECYCLE_REPORT_SCHEMA,
  RMT_VNEXT_LIFECYCLE_RESULT_SCHEMA,
  RMT_VNEXT_LIFECYCLE_SCHEMA,
  RMT_VNEXT_LIFECYCLE_SUITE_PATH,
  RMT_VNEXT_LIFECYCLE_WORKPACKAGE,
  createLifecycleAdapterStub,
  createLifecycleOperationPlan,
  createRmtVNextLifecycleContract,
  listLifecycleOperations,
  normalizeLifecycleOperationResult
} = require('../../tools/rmt-language/vnext-lifecycle');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const LIFECYCLE_CONTRACT_PATH = 'development/XTendRMT-vNext-Lifecycle-Operation-Contract.md';
const WP_E15_06_PATH = 'development/WP-E15-06-Lifecycle-Semantik-und-Operation-Contract-haerten.md';
const VALID_LIFECYCLE_FIXTURE = 'tests/rmt-language/fixtures/vnext-lifecycle-valid.rmt';
const VALID_COMPLEX_FIXTURE = 'tests/rmt-language/fixtures/vnext-valid-complex.rmt';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function compileFixture(relativePath, rootDir) {
  return compileRmtVNextSource({
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir)
  });
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function createAllLifecycleAdapter() {
  return createLifecycleAdapterStub({
    id: 'adapter.lifecycle.all',
    providedCapabilities: listLifecycleOperations().map((op) => `lifecycle.${op}`)
  });
}

function runRmtVNextLifecycleSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-lifecycle',
    label: 'Epic 15 RMT vNext Lifecycle Operation Contract'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextLifecycle;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const lifecycleContract = readText(LIFECYCLE_CONTRACT_PATH, rootDir);
  const lifecycleSyntax = syntaxCheckFile(RMT_VNEXT_LIFECYCLE_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_LIFECYCLE_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_LIFECYCLE_MODULE_PATH, rootDir, 'vNext lifecycle contract module exists');
  assertFileExists(context, RMT_VNEXT_LIFECYCLE_SUITE_PATH, rootDir, 'vNext lifecycle suite exists');
  assertFileExists(context, WP_E15_06_PATH, rootDir, 'WP-E15-06 workpackage document exists');
  assertFileExists(context, VALID_LIFECYCLE_FIXTURE, rootDir, 'vNext lifecycle fixture exists');
  context.assert(lifecycleSyntax.ok, `vNext lifecycle module syntax passes${lifecycleSyntax.ok ? '' : ` (${lifecycleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext lifecycle suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_LIFECYCLE_SCHEMA, 'package metadata declares lifecycle schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_LIFECYCLE_REPORT_SCHEMA, 'package metadata declares lifecycle report schema');
  context.assert(metadata && metadata.resultSchema === RMT_VNEXT_LIFECYCLE_RESULT_SCHEMA, 'package metadata declares lifecycle result schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_LIFECYCLE_WORKPACKAGE, 'package metadata points to WP-E15-06');
  context.assert(metadata && metadata.module === RMT_VNEXT_LIFECYCLE_MODULE_PATH, 'package metadata points to lifecycle module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_LIFECYCLE_SUITE_PATH, 'package metadata points to lifecycle suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-lifecycle --json', 'package metadata declares lifecycle local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_LIFECYCLE_PACKAGE_SCRIPT, 'package metadata declares lifecycle package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-lifecycle'] === 'string' ? packageManifest.exports['./rmt-language/vnext-lifecycle'] : packageManifest.exports['./rmt-language/vnext-lifecycle'] && packageManifest.exports['./rmt-language/vnext-lifecycle'].default) === './tools/rmt-language/vnext-lifecycle.js', 'package exports vNext lifecycle contract');
  context.assert(packageManifest.scripts['test:rmt-vnext-lifecycle'] === 'node scripts/run_xtend_tests.js rmt-vnext-lifecycle', 'package exposes vNext lifecycle script');
  context.assert(runner.includes("id: 'rmt-vnext-lifecycle'"), 'test runner exposes rmt-vnext-lifecycle suite');
  context.assert(epic.includes('| `WP-E15-06` | P1 | completed | WS2 |'), 'Epic marks WP-E15-06 completed');
  context.assert(epic.includes('| `WP-E15-10` | P1 | completed | WS3 |'), 'Epic records WP-E15-10 after lifecycle handoff');
  context.assert(lifecycleContract.includes('schema: "xtend.rmt.vnext-lifecycle.v1"'), 'Lifecycle contract document declares schema');

  const operations = listLifecycleOperations();
  context.assert(operations.length === 10, 'lifecycle operation matrix covers ten operations');
  assertIncludesAll(context, operations, ['mount', 'hydrate', 'suspend', 'resume', 'invalidate', 'dispose', 'prewarm', 'recycle', 'detach', 'reattach'], 'lifecycle operation matrix names');
  operations.forEach((op) => {
    const matrixEntry = LIFECYCLE_OPERATION_MATRIX[op];
    context.assert(matrixEntry && matrixEntry.requiredCapability === `lifecycle.${op}`, `${op} capability is explicit`);
    context.assert(matrixEntry && Array.isArray(matrixEntry.resultStatusValues), `${op} result status values are explicit`);
  });

  const compileResult = compileFixture(VALID_LIFECYCLE_FIXTURE, rootDir);
  context.assert(compileResult.ok === true, 'lifecycle fixture compiles successfully');
  context.assert(compileResult.coreDocument.schema === RMT_VNEXT_CORE_SCHEMA, 'lifecycle fixture emits vNext core schema');
  context.assert(compileResult.coreDocument.operations.length === 10, 'lifecycle fixture compiles ten lifecycle operations');

  const allAdapter = createAllLifecycleAdapter();
  context.assert(allAdapter.hostNeutral === true, 'adapter stubs remain host-neutral');
  const readyPlan = createLifecycleOperationPlan(compileResult.coreDocument, {
    adapters: [allAdapter]
  });
  context.assert(readyPlan.schema === RMT_VNEXT_LIFECYCLE_SCHEMA, 'ready lifecycle plan emits lifecycle schema');
  context.assert(readyPlan.ok === true, 'ready lifecycle plan has no errors');
  context.assert(readyPlan.status === 'ready', 'ready lifecycle plan is ready');
  context.assert(readyPlan.operationCount === 10, 'ready lifecycle plan includes ten operations');
  context.assert(readyPlan.operations.every((operation) => operation.status === 'ready'), 'all lifecycle operations are ready with full adapter');
  context.assert(readyPlan.operations.every((operation) => operation.adapterId === allAdapter.id), 'ready lifecycle operations bind to declared adapter candidate');
  context.assert(readyPlan.operations.every((operation) => operation.idempotency && operation.idempotency.key && operation.idempotency.key.includes(operation.op)), 'ready lifecycle operations expose idempotency keys');
  context.assert(readyPlan.operations.every((operation) => operation.resultContract && operation.resultContract.schema === RMT_VNEXT_LIFECYCLE_RESULT_SCHEMA), 'ready lifecycle operations expose result contracts');
  context.assert(readyPlan.operations.every((operation) => operation.sourceRef && operation.sourceRef.startsWith('src:')), 'ready lifecycle operations keep source refs');

  const limitedPlan = createLifecycleOperationPlan(compileResult.coreDocument, {
    adapters: [
      createLifecycleAdapterStub({
        id: 'adapter.lifecycle.partial',
        providedCapabilities: ['lifecycle.mount', 'lifecycle.hydrate']
      })
    ]
  });
  context.assert(limitedPlan.ok === false, 'limited adapter plan fails contract validation');
  context.assert(limitedPlan.status === 'blocked', 'limited adapter plan is blocked');
  context.assert(limitedPlan.operations.filter((operation) => operation.status === 'ready').length === 2, 'limited adapter keeps supported operations ready');
  context.assert(limitedPlan.operations.filter((operation) => operation.status === 'blocked').length === 8, 'limited adapter blocks unsupported lifecycle operations');
  context.assert(limitedPlan.diagnostics.filter((diagnostic) => diagnostic.code === LIFECYCLE_CAPABILITY_MISSING_CODE).length === 8, 'missing adapter capabilities produce diagnostics');
  context.assert(limitedPlan.operations.filter((operation) => operation.status === 'blocked').every((operation) => operation.adapterId === null), 'missing adapter capabilities do not choose implicit fallback');

  const noAdapterPlan = createLifecycleOperationPlan(compileResult.coreDocument);
  context.assert(noAdapterPlan.diagnostics.some((diagnostic) => diagnostic.code === LIFECYCLE_ADAPTER_MISSING_CODE), 'missing adapter stubs produce diagnostics');

  const unsupportedTargetCore = cloneJson(compileResult.coreDocument);
  unsupportedTargetCore.operations[0].target = { kind: 'inline_code', ref: 'app-shell' };
  const unsupportedTargetPlan = createLifecycleOperationPlan(unsupportedTargetCore, { adapters: [allAdapter] });
  context.assert(unsupportedTargetPlan.diagnostics.some((diagnostic) => diagnostic.code === LIFECYCLE_TARGET_UNSUPPORTED_CODE), 'unsupported target kinds produce diagnostics');

  const missingTargetCore = cloneJson(compileResult.coreDocument);
  missingTargetCore.operations[0].target = { kind: 'ref', ref: '' };
  const missingTargetPlan = createLifecycleOperationPlan(missingTargetCore, { adapters: [allAdapter] });
  context.assert(missingTargetPlan.diagnostics.some((diagnostic) => diagnostic.code === LIFECYCLE_TARGET_MISSING_CODE), 'missing targets produce diagnostics');

  const unsupportedOperationCore = cloneJson(compileResult.coreDocument);
  unsupportedOperationCore.operations[0].op = 'teleport';
  const unsupportedOperationPlan = createLifecycleOperationPlan(unsupportedOperationCore, { adapters: [allAdapter] });
  context.assert(unsupportedOperationPlan.diagnostics.some((diagnostic) => diagnostic.code === LIFECYCLE_OPERATION_UNSUPPORTED_CODE), 'unknown lifecycle operations produce diagnostics');

  const complexResult = compileFixture(VALID_COMPLEX_FIXTURE, rootDir);
  const complexPlan = createLifecycleOperationPlan(complexResult.coreDocument, { adapters: [allAdapter] });
  context.assert(complexPlan.operationCount === complexResult.coreDocument.operations.filter((operation) => operation.kind === 'lifecycle').length, 'lifecycle plan ignores stream operations');
  context.assert(complexPlan.operationCount < complexResult.coreDocument.operations.length, 'stream operation stays outside lifecycle contract');

  const normalizedOk = normalizeLifecycleOperationResult(readyPlan.operations[0], {
    status: 'ok',
    metadata: { source: 'stub' }
  });
  context.assert(normalizedOk.schema === RMT_VNEXT_LIFECYCLE_RESULT_SCHEMA, 'normalized result keeps result schema');
  context.assert(normalizedOk.ok === true, 'normalized ok result reports success');
  context.assert(normalizedOk.idempotencyKey === readyPlan.operations[0].idempotency.key, 'normalized result preserves idempotency key');
  const normalizedUnknown = normalizeLifecycleOperationResult(readyPlan.operations[0], { status: 'unknown-status' });
  context.assert(normalizedUnknown.status === 'failed' && normalizedUnknown.ok === false, 'unknown result statuses normalize to failed');

  const contract = createRmtVNextLifecycleContract();
  context.assert(contract.schema === RMT_VNEXT_LIFECYCLE_SCHEMA, 'factory exposes lifecycle schema');
  context.assert(contract.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'factory exposes core schema');
  context.assert(contract.operations.length === 10, 'factory exposes lifecycle operations');

  return context.result({
    schema: RMT_VNEXT_LIFECYCLE_REPORT_SCHEMA,
    lifecycleSchema: RMT_VNEXT_LIFECYCLE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_LIFECYCLE_WORKPACKAGE,
    lifecycleModule: RMT_VNEXT_LIFECYCLE_MODULE_PATH,
    suite: RMT_VNEXT_LIFECYCLE_SUITE_PATH,
    operationCount: operations.length
  });
}

function printRmtVNextLifecycleReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Lifecycle Operation Contract erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Lifecycle Operation Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextLifecycleReport,
  runRmtVNextLifecycleSuite
};

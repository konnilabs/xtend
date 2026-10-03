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
  CANONICAL_SCHEDULER_LANES,
  RMT_VNEXT_SCHEDULER_LANE_SCHEMA,
  RMT_VNEXT_SCHEDULER_MODULE_PATH,
  RMT_VNEXT_SCHEDULER_PACKAGE_SCRIPT,
  RMT_VNEXT_SCHEDULER_REPORT_SCHEMA,
  RMT_VNEXT_SCHEDULER_SCHEMA,
  RMT_VNEXT_SCHEDULER_SUITE_PATH,
  RMT_VNEXT_SCHEDULER_WORKPACKAGE,
  SCHEDULER_BUDGET_INVALID_CODE,
  SCHEDULER_LANE_DUPLICATE_CODE,
  SCHEDULER_LANE_UNKNOWN_CODE,
  SCHEDULER_OPERATION_LANE_MISMATCH_CODE,
  SCHEDULER_OPERATION_REF_MISSING_CODE,
  SCHEDULER_WEIGHT_OUT_OF_RANGE_CODE,
  createRmtVNextScheduler,
  createSchedulerPolicy,
  listSchedulerLanes,
  normalizeLaneName,
  serializeSchedulerPolicy
} = require('../../tools/rmt-language/vnext-scheduler');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const SCHEDULER_CONTRACT_PATH = 'development/XTendRMT-vNext-Scheduler-Policy-Contract.md';
const WP_E15_07_PATH = 'development/WP-E15-07-Scheduling-Lanes-Chunking-und-Backpressure-modellieren.md';
const VALID_SCHEDULER_FIXTURE = 'tests/rmt-language/fixtures/vnext-scheduler-valid.rmt';
const VALID_MINIMAL_FIXTURE = 'tests/rmt-language/fixtures/vnext-valid-minimal.rmt';

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

function findLane(policy, name) {
  return policy.lanes.find((lane) => lane.name === name);
}

function runRmtVNextSchedulerSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-scheduler',
    label: 'Epic 15 RMT vNext Scheduler Policy Contract'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextScheduler;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const schedulerContract = readText(SCHEDULER_CONTRACT_PATH, rootDir);
  const schedulerSyntax = syntaxCheckFile(RMT_VNEXT_SCHEDULER_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_SCHEDULER_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_SCHEDULER_MODULE_PATH, rootDir, 'vNext scheduler policy module exists');
  assertFileExists(context, RMT_VNEXT_SCHEDULER_SUITE_PATH, rootDir, 'vNext scheduler suite exists');
  assertFileExists(context, WP_E15_07_PATH, rootDir, 'WP-E15-07 workpackage document exists');
  assertFileExists(context, VALID_SCHEDULER_FIXTURE, rootDir, 'vNext scheduler fixture exists');
  context.assert(schedulerSyntax.ok, `vNext scheduler module syntax passes${schedulerSyntax.ok ? '' : ` (${schedulerSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext scheduler suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_SCHEDULER_SCHEMA, 'package metadata declares scheduler schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.laneSchema === RMT_VNEXT_SCHEDULER_LANE_SCHEMA, 'package metadata declares scheduler lane schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_SCHEDULER_REPORT_SCHEMA, 'package metadata declares scheduler report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_SCHEDULER_WORKPACKAGE, 'package metadata points to WP-E15-07');
  context.assert(metadata && metadata.module === RMT_VNEXT_SCHEDULER_MODULE_PATH, 'package metadata points to scheduler module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_SCHEDULER_SUITE_PATH, 'package metadata points to scheduler suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-scheduler --json', 'package metadata declares scheduler local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_SCHEDULER_PACKAGE_SCRIPT, 'package metadata declares scheduler package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-scheduler'] === 'string' ? packageManifest.exports['./rmt-language/vnext-scheduler'] : packageManifest.exports['./rmt-language/vnext-scheduler'] && packageManifest.exports['./rmt-language/vnext-scheduler'].default) === './tools/rmt-language/vnext-scheduler.js', 'package exports vNext scheduler policy');
  context.assert(packageManifest.scripts['test:rmt-vnext-scheduler'] === 'node scripts/run_xtend_tests.js rmt-vnext-scheduler', 'package exposes vNext scheduler script');
  context.assert(runner.hasSuite("rmt-vnext-scheduler"), 'test runner exposes rmt-vnext-scheduler suite');
  context.assert(epic.includes('| `WP-E15-07` | P1 | completed | WS2 |'), 'Epic marks WP-E15-07 completed');
  context.assert(
    epic.includes('| `WP-E15-08` | P1 | completed | WS2 |'),
    'Epic records WP-E15-08 surface registry handoff'
  );
  context.assert(schedulerContract.includes('schema: "xtend.rmt.vnext-scheduler-policy.v1"'), 'Scheduler contract document declares schema');

  const schedulerLanes = listSchedulerLanes();
  context.assert(schedulerLanes.length === 6, 'scheduler contract exposes six canonical lanes');
  assertIncludesAll(context, schedulerLanes, ['user-blocking', 'visible', 'transition', 'idle', 'background', 'diagnostics'], 'scheduler canonical lanes');
  context.assert(CANONICAL_SCHEDULER_LANES.visible.deadlineMs === 160, 'visible lane keeps interactive budget');
  context.assert(CANONICAL_SCHEDULER_LANES.idle.preferIdle === true, 'idle lane prefers idle scheduling');
  context.assert(normalizeLaneName('critical').schedulerLane === 'user-blocking', 'critical authoring lane maps to user-blocking');
  context.assert(normalizeLaneName('normal').schedulerLane === 'visible', 'normal authoring lane maps to visible');

  const compileResult = compileFixture(VALID_SCHEDULER_FIXTURE, rootDir);
  context.assert(compileResult.ok === true, 'scheduler fixture compiles successfully');
  context.assert(compileResult.coreDocument.schema === RMT_VNEXT_CORE_SCHEMA, 'scheduler fixture emits vNext core schema');
  context.assert(compileResult.coreDocument.lanes.length === 6, 'scheduler fixture compiles six lanes');
  context.assert(compileResult.coreDocument.operations.length === 7, 'scheduler fixture compiles seven operations');

  const policy = createSchedulerPolicy(compileResult.coreDocument);
  context.assert(policy.schema === RMT_VNEXT_SCHEDULER_SCHEMA, 'scheduler policy emits scheduler schema');
  context.assert(policy.ok === true, 'scheduler policy validates successfully');
  context.assert(policy.status === 'ready', 'scheduler policy is ready');
  context.assert(policy.laneCount === 6, 'scheduler policy includes six lanes');
  context.assert(policy.operationCount === 7, 'scheduler policy reports core operation count');
  context.assert(policy.schedule[0].schedulerLane === 'user-blocking', 'schedule is ordered by priority');

  const critical = findLane(policy, 'critical');
  const normal = findLane(policy, 'normal');
  const transition = findLane(policy, 'transition');
  const idle = findLane(policy, 'idle');
  const background = findLane(policy, 'background');
  const diagnostics = findLane(policy, 'diagnostics');
  context.assert(critical && critical.schema === RMT_VNEXT_SCHEDULER_LANE_SCHEMA, 'critical lane uses scheduler lane schema');
  context.assert(critical && critical.schedulerLane === 'user-blocking' && critical.priority === 100, 'critical lane normalizes to user-blocking priority');
  context.assert(normal && normal.schedulerLane === 'visible' && normal.priority === 60, 'normal lane normalizes to visible with author weight');
  context.assert(transition && transition.schedulerLane === 'transition' && transition.budget.class === 'interactive', 'transition lane keeps transition budget class');
  context.assert(idle && idle.chunking.preferIdle === true && idle.backpressure.behavior === 'pause-until-idle', 'idle lane carries idle chunking and backpressure metadata');
  context.assert(background && background.backpressure.behavior === 'drop-stale', 'background lane carries stale-drop backpressure');
  context.assert(diagnostics && diagnostics.budget.class === 'diagnostics', 'diagnostics lane keeps diagnostics budget');
  context.assert(policy.lanes.every((lane) => lane.operationRefs.length === lane.operationCount), 'scheduler lanes preserve operation refs');
  context.assert(policy.lanes.every((lane) => lane.sourceRef && lane.sourceRef.startsWith('src:')), 'scheduler lanes keep source refs');

  const repeatPolicy = createSchedulerPolicy(compileFixture(VALID_SCHEDULER_FIXTURE, rootDir).coreDocument);
  context.assert(serializeSchedulerPolicy(policy) === serializeSchedulerPolicy(repeatPolicy), 'scheduler policy serialization is byte-stable');
  context.assert(JSON.parse(serializeSchedulerPolicy(policy)).schema === RMT_VNEXT_SCHEDULER_SCHEMA, 'serialized scheduler policy is parseable JSON');

  const minimalResult = compileFixture(VALID_MINIMAL_FIXTURE, rootDir);
  const minimalPolicy = createSchedulerPolicy(minimalResult.coreDocument);
  const minimalLane = minimalPolicy.lanes[0];
  context.assert(minimalLane.name === 'critical' && minimalLane.weight === null, 'missing lane weight remains explicit null');
  context.assert(minimalLane.priority === 100, 'missing lane weight uses lane profile default priority');

  const unknownCore = cloneJson(compileResult.coreDocument);
  unknownCore.lanes[1].name = 'mystery';
  const unknownPolicy = createSchedulerPolicy(unknownCore);
  context.assert(unknownPolicy.ok === true, 'unknown lane names remain normalizable');
  context.assert(unknownPolicy.diagnostics.some((diagnostic) => diagnostic.code === SCHEDULER_LANE_UNKNOWN_CODE), 'unknown lane names produce diagnostics');
  context.assert(unknownPolicy.lanes[1].schedulerLane === 'visible', 'unknown lane names fall back to visible policy metadata');

  const outOfRangeCore = cloneJson(compileResult.coreDocument);
  outOfRangeCore.lanes[0].weight = 250;
  const outOfRangePolicy = createSchedulerPolicy(outOfRangeCore);
  context.assert(outOfRangePolicy.ok === true, 'out-of-range weights are normalized');
  context.assert(outOfRangePolicy.diagnostics.some((diagnostic) => diagnostic.code === SCHEDULER_WEIGHT_OUT_OF_RANGE_CODE), 'out-of-range weights produce diagnostics');
  context.assert(outOfRangePolicy.lanes[0].priority === 100, 'out-of-range weights clamp to max priority');

  const invalidBudgetCore = cloneJson(compileResult.coreDocument);
  invalidBudgetCore.lanes[0].schedule = { deadlineMs: -1 };
  const invalidBudgetPolicy = createSchedulerPolicy(invalidBudgetCore);
  context.assert(invalidBudgetPolicy.ok === true, 'invalid budgets are normalized');
  context.assert(invalidBudgetPolicy.diagnostics.some((diagnostic) => diagnostic.code === SCHEDULER_BUDGET_INVALID_CODE), 'invalid budgets produce diagnostics');
  context.assert(invalidBudgetPolicy.lanes[0].budget.deadlineMs === 80, 'invalid budgets fall back to lane profile deadline');

  const missingOperationCore = cloneJson(compileResult.coreDocument);
  missingOperationCore.lanes[0].operationRefs.push('operation:missing');
  const missingOperationPolicy = createSchedulerPolicy(missingOperationCore);
  context.assert(missingOperationPolicy.ok === false && missingOperationPolicy.status === 'blocked', 'missing operation refs block scheduler policy');
  context.assert(missingOperationPolicy.diagnostics.some((diagnostic) => diagnostic.code === SCHEDULER_OPERATION_REF_MISSING_CODE), 'missing operation refs produce diagnostics');

  const mismatchCore = cloneJson(compileResult.coreDocument);
  const mismatchedRef = mismatchCore.lanes[0].operationRefs[0];
  const mismatchedOperation = mismatchCore.operations.find((operation) => operation.id === mismatchedRef);
  mismatchedOperation.scope.lane = mismatchCore.lanes[1].id;
  const mismatchPolicy = createSchedulerPolicy(mismatchCore);
  context.assert(mismatchPolicy.ok === false, 'operation lane mismatches block scheduler policy');
  context.assert(mismatchPolicy.diagnostics.some((diagnostic) => diagnostic.code === SCHEDULER_OPERATION_LANE_MISMATCH_CODE), 'operation lane mismatches produce diagnostics');

  const duplicateCore = cloneJson(compileResult.coreDocument);
  duplicateCore.lanes.push(cloneJson(duplicateCore.lanes[0]));
  const duplicatePolicy = createSchedulerPolicy(duplicateCore);
  context.assert(duplicatePolicy.ok === false, 'duplicate lane ids block scheduler policy');
  context.assert(duplicatePolicy.diagnostics.some((diagnostic) => diagnostic.code === SCHEDULER_LANE_DUPLICATE_CODE), 'duplicate lane ids produce diagnostics');

  const scheduler = createRmtVNextScheduler();
  context.assert(scheduler.schema === RMT_VNEXT_SCHEDULER_SCHEMA, 'factory exposes scheduler schema');
  context.assert(scheduler.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'factory exposes core schema');
  context.assert(scheduler.createPolicy(compileResult.coreDocument).ok === true, 'factory creates scheduler policy');

  return context.result({
    schema: RMT_VNEXT_SCHEDULER_REPORT_SCHEMA,
    schedulerSchema: RMT_VNEXT_SCHEDULER_SCHEMA,
    laneSchema: RMT_VNEXT_SCHEDULER_LANE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_SCHEDULER_WORKPACKAGE,
    schedulerModule: RMT_VNEXT_SCHEDULER_MODULE_PATH,
    suite: RMT_VNEXT_SCHEDULER_SUITE_PATH,
    laneCount: schedulerLanes.length
  });
}

function printRmtVNextSchedulerReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Scheduler Policy Contract erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Scheduler Policy Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextSchedulerReport,
  runRmtVNextSchedulerSuite
};

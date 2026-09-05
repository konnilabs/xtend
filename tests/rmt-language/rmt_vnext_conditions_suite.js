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
  CONDITION_EXPRESSION_KIND_UNSUPPORTED_CODE,
  CONDITION_OPERATOR_UNSUPPORTED_CODE,
  CONDITION_PATH_UNKNOWN_CODE,
  CONDITION_ROOT_TYPE_CODE,
  CONDITION_TYPE_MISMATCH_CODE,
  DEFAULT_CONDITION_PATH_TYPES,
  RMT_VNEXT_CONDITION_MODULE_PATH,
  RMT_VNEXT_CONDITION_PACKAGE_SCRIPT,
  RMT_VNEXT_CONDITION_RECORD_SCHEMA,
  RMT_VNEXT_CONDITION_REPORT_SCHEMA,
  RMT_VNEXT_CONDITION_SCHEMA,
  RMT_VNEXT_CONDITION_SUITE_PATH,
  RMT_VNEXT_CONDITION_WORKPACKAGE,
  RMT_VNEXT_EXPRESSION_SCHEMA,
  createConditionContract,
  createRmtVNextConditionContract,
  serializeConditionContract
} = require('../../tools/rmt-language/vnext-conditions');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const CONDITION_CONTRACT_PATH = 'development/XTendRMT-vNext-Condition-Expression-Contract.md';
const WP_E15_09_PATH = 'development/WP-E15-09-Conditions-und-deklaratives-Expression-Subset-definieren.md';
const VALID_CONDITIONS_FIXTURE = 'tests/rmt-language/fixtures/vnext-conditions-valid.rmt';
const VALID_MINIMAL_FIXTURE = 'tests/rmt-language/fixtures/vnext-valid-minimal.rmt';
const INVALID_CONDITION_CALL_FIXTURE = 'tests/rmt-language/fixtures/vnext-invalid-condition-call.rmt';

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

function firstConditionCore(coreDocument) {
  return coreDocument.operations.find((operation) => operation.condition);
}

function runRmtVNextConditionsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-conditions',
    label: 'Epic 15 RMT vNext Condition Expression Contract'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextConditions;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const conditionContract = readText(CONDITION_CONTRACT_PATH, rootDir);
  const conditionSyntax = syntaxCheckFile(RMT_VNEXT_CONDITION_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_CONDITION_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_CONDITION_MODULE_PATH, rootDir, 'vNext condition contract module exists');
  assertFileExists(context, RMT_VNEXT_CONDITION_SUITE_PATH, rootDir, 'vNext condition suite exists');
  assertFileExists(context, WP_E15_09_PATH, rootDir, 'WP-E15-09 workpackage document exists');
  assertFileExists(context, VALID_CONDITIONS_FIXTURE, rootDir, 'vNext conditions fixture exists');
  context.assert(conditionSyntax.ok, `vNext condition module syntax passes${conditionSyntax.ok ? '' : ` (${conditionSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext condition suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_CONDITION_SCHEMA, 'package metadata declares condition schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.conditionSchema === RMT_VNEXT_CONDITION_RECORD_SCHEMA, 'package metadata declares condition record schema');
  context.assert(metadata && metadata.expressionSchema === RMT_VNEXT_EXPRESSION_SCHEMA, 'package metadata declares expression schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_CONDITION_REPORT_SCHEMA, 'package metadata declares condition report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_CONDITION_WORKPACKAGE, 'package metadata points to WP-E15-09');
  context.assert(metadata && metadata.module === RMT_VNEXT_CONDITION_MODULE_PATH, 'package metadata points to condition module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_CONDITION_SUITE_PATH, 'package metadata points to condition suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-conditions --json', 'package metadata declares condition local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_CONDITION_PACKAGE_SCRIPT, 'package metadata declares condition package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-conditions'] === 'string' ? packageManifest.exports['./rmt-language/vnext-conditions'] : packageManifest.exports['./rmt-language/vnext-conditions'] && packageManifest.exports['./rmt-language/vnext-conditions'].default) === './tools/rmt-language/vnext-conditions.js', 'package exports vNext condition contract');
  context.assert(packageManifest.scripts['test:rmt-vnext-conditions'] === 'node scripts/run_xtend_tests.js rmt-vnext-conditions', 'package exposes vNext condition script');
  context.assert(runner.hasSuite("rmt-vnext-conditions"), 'test runner exposes rmt-vnext-conditions suite');
  context.assert(epic.includes('| `WP-E15-09` | P1 | completed | WS3 |'), 'Epic marks WP-E15-09 completed');
  context.assert(epic.includes('| `WP-E15-12` | P1 | completed | WS3 |'), 'Epic records WP-E15-12 after condition handoff');
  context.assert(conditionContract.includes('schema: "xtend.rmt.vnext-condition-contract.v1"'), 'Condition contract document declares schema');

  assertIncludesAll(context, Object.keys(DEFAULT_CONDITION_PATH_TYPES), ['route.visible', 'user.role', 'user.blocked', 'feature.enabled', 'viewport.width'], 'condition default path catalog');

  const compileResult = compileFixture(VALID_CONDITIONS_FIXTURE, rootDir);
  context.assert(compileResult.ok === true, 'conditions fixture compiles successfully');
  context.assert(compileResult.coreDocument.schema === RMT_VNEXT_CORE_SCHEMA, 'conditions fixture emits vNext core schema');
  context.assert(compileResult.coreDocument.operations.filter((operation) => operation.condition).length === 4, 'conditions fixture compiles four conditions');

  const contract = createConditionContract(compileResult.coreDocument);
  context.assert(contract.schema === RMT_VNEXT_CONDITION_SCHEMA, 'condition contract emits condition schema');
  context.assert(contract.ok === true, 'condition contract validates successfully');
  context.assert(contract.status === 'ready', 'condition contract is ready');
  context.assert(contract.conditionCount === 4, 'condition contract contains four condition records');
  context.assert(contract.conditions.every((condition) => condition.schema === RMT_VNEXT_CONDITION_RECORD_SCHEMA), 'condition records use condition schema');
  context.assert(contract.conditions.every((condition) => condition.expression.schema === RMT_VNEXT_EXPRESSION_SCHEMA), 'condition expressions use expression schema');
  context.assert(contract.conditions.every((condition) => condition.resultType === 'boolean'), 'condition root expressions resolve to boolean');
  context.assert(contract.conditions.every((condition) => condition.sourceRef && condition.sourceRef.startsWith('src:condition:')), 'condition records keep condition source refs');
  context.assert(contract.conditions.some((condition) => condition.pathRefs.includes('route.visible') && condition.pathRefs.includes('user.blocked')), 'logical condition collects path refs');
  context.assert(contract.conditions.some((condition) => condition.pathRefs.includes('viewport.width')), 'numeric comparison collects path refs');
  context.assert(contract.conditions.some((condition) => condition.expression.kind === 'unary' || condition.expression.children.some((child) => child.kind === 'unary')), 'unary condition is normalized');

  const repeatContract = createConditionContract(compileFixture(VALID_CONDITIONS_FIXTURE, rootDir).coreDocument);
  context.assert(serializeConditionContract(contract) === serializeConditionContract(repeatContract), 'condition contract serialization is byte-stable');
  context.assert(JSON.parse(serializeConditionContract(contract)).schema === RMT_VNEXT_CONDITION_SCHEMA, 'serialized condition contract is parseable JSON');

  const minimalResult = compileFixture(VALID_MINIMAL_FIXTURE, rootDir);
  const minimalContract = createConditionContract(minimalResult.coreDocument);
  context.assert(minimalContract.ok === true && minimalContract.conditionCount === 0, 'documents without conditions produce empty ready contract');

  const invalidCallResult = compileFixture(INVALID_CONDITION_CALL_FIXTURE, rootDir);
  context.assert(invalidCallResult.ok === false, 'function-call condition fixture does not compile');
  context.assert(invalidCallResult.coreDocument === null, 'function-call condition fixture has no core document');
  context.assert(invalidCallResult.diagnostics.some((diagnostic) => diagnostic.message.includes('Function calls are not allowed')), 'function-call condition emits parser diagnostic');

  const unknownPathCore = cloneJson(compileResult.coreDocument);
  firstConditionCore(unknownPathCore).condition.expression.left.left = {
    kind: 'path',
    path: ['session', 'ready']
  };
  const unknownPathContract = createConditionContract(unknownPathCore);
  context.assert(unknownPathContract.ok === false, 'unknown condition paths block contract');
  context.assert(unknownPathContract.diagnostics.some((diagnostic) => diagnostic.code === CONDITION_PATH_UNKNOWN_CODE), 'unknown paths produce diagnostics');

  const unaryTypeCore = cloneJson(compileResult.coreDocument);
  firstConditionCore(unaryTypeCore).condition.expression = {
    kind: 'unary',
    op: '!',
    argument: {
      kind: 'literal',
      value: 'not-boolean'
    }
  };
  const unaryTypeContract = createConditionContract(unaryTypeCore);
  context.assert(unaryTypeContract.ok === false, 'unary type mismatch blocks contract');
  context.assert(unaryTypeContract.diagnostics.some((diagnostic) => diagnostic.code === CONDITION_TYPE_MISMATCH_CODE), 'unary type mismatch produces diagnostics');

  const unsupportedKindCore = cloneJson(compileResult.coreDocument);
  firstConditionCore(unsupportedKindCore).condition.expression = {
    kind: 'call',
    callee: 'canAccess',
    args: []
  };
  const unsupportedKindContract = createConditionContract(unsupportedKindCore);
  context.assert(unsupportedKindContract.ok === false, 'unsupported expression kinds block contract');
  context.assert(unsupportedKindContract.diagnostics.some((diagnostic) => diagnostic.code === CONDITION_EXPRESSION_KIND_UNSUPPORTED_CODE), 'unsupported expression kinds produce diagnostics');

  const unsupportedOperatorCore = cloneJson(compileResult.coreDocument);
  firstConditionCore(unsupportedOperatorCore).condition.expression.op = '??';
  const unsupportedOperatorContract = createConditionContract(unsupportedOperatorCore);
  context.assert(unsupportedOperatorContract.ok === false, 'unsupported operators block contract');
  context.assert(unsupportedOperatorContract.diagnostics.some((diagnostic) => diagnostic.code === CONDITION_OPERATOR_UNSUPPORTED_CODE), 'unsupported operators produce diagnostics');

  const nonBooleanRootCore = cloneJson(compileResult.coreDocument);
  firstConditionCore(nonBooleanRootCore).condition.expression = {
    kind: 'literal',
    value: 'ready'
  };
  const nonBooleanRootContract = createConditionContract(nonBooleanRootCore);
  context.assert(nonBooleanRootContract.ok === false, 'non-boolean root expressions block contract');
  context.assert(nonBooleanRootContract.diagnostics.some((diagnostic) => diagnostic.code === CONDITION_ROOT_TYPE_CODE), 'non-boolean root expressions produce diagnostics');

  const numericMismatchCore = cloneJson(compileResult.coreDocument);
  firstConditionCore(numericMismatchCore).condition.expression = {
    kind: 'binary',
    op: '>',
    left: {
      kind: 'path',
      path: ['user', 'role']
    },
    right: {
      kind: 'literal',
      value: 1
    }
  };
  const numericMismatchContract = createConditionContract(numericMismatchCore);
  context.assert(numericMismatchContract.ok === false, 'numeric operator type mismatch blocks contract');
  context.assert(numericMismatchContract.diagnostics.some((diagnostic) => diagnostic.code === CONDITION_TYPE_MISMATCH_CODE), 'numeric operator type mismatch produces diagnostics');

  const customPathContract = createConditionContract(compileResult.coreDocument, {
    pathTypes: {
      'session.ready': 'boolean'
    }
  });
  context.assert(customPathContract.pathTypes['session.ready'] === 'boolean', 'custom path catalog entries are accepted');

  const factory = createRmtVNextConditionContract();
  context.assert(factory.schema === RMT_VNEXT_CONDITION_SCHEMA, 'factory exposes condition schema');
  context.assert(factory.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'factory exposes core schema');
  context.assert(factory.createContract(compileResult.coreDocument).ok === true, 'factory creates condition contract');

  return context.result({
    schema: RMT_VNEXT_CONDITION_REPORT_SCHEMA,
    conditionSchema: RMT_VNEXT_CONDITION_SCHEMA,
    expressionSchema: RMT_VNEXT_EXPRESSION_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_CONDITION_WORKPACKAGE,
    conditionModule: RMT_VNEXT_CONDITION_MODULE_PATH,
    suite: RMT_VNEXT_CONDITION_SUITE_PATH,
    conditionCount: contract.conditionCount
  });
}

function printRmtVNextConditionsReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Condition Expression Contract erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Condition Expression Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextConditionsReport,
  runRmtVNextConditionsSuite
};

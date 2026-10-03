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
  DEFAULT_TRUST_BOUNDARY_PROFILES,
  RMT_VNEXT_SANITIZE_POLICY_SCHEMA,
  RMT_VNEXT_SECURITY_MODULE_PATH,
  RMT_VNEXT_SECURITY_PACKAGE_SCRIPT,
  RMT_VNEXT_SECURITY_POLICY_SCHEMA,
  RMT_VNEXT_SECURITY_POSTURE_SCHEMA,
  RMT_VNEXT_SECURITY_REPORT_SCHEMA,
  RMT_VNEXT_SECURITY_SUITE_PATH,
  RMT_VNEXT_SECURITY_WORKPACKAGE,
  RMT_VNEXT_TRUST_BOUNDARY_SCHEMA,
  SECURITY_ALLOWED_SANITIZE_FORMATS,
  SECURITY_POLICY_CONFLICT_CODE,
  SECURITY_POLICY_DUPLICATE_CODE,
  SECURITY_POLICY_OWNER_MISSING_CODE,
  SECURITY_SANITIZE_FORMAT_UNSUPPORTED_CODE,
  SECURITY_SANITIZE_MISSING_CODE,
  SECURITY_SANITIZE_WITHOUT_BOUNDARY_CODE,
  SECURITY_TRUST_BOUNDARY_MISSING_CODE,
  SECURITY_TRUST_BOUNDARY_UNKNOWN_CODE,
  createRmtVNextSecurityPolicyContract,
  createSecurityPolicyContract,
  normalizeDataSourceSecurityCatalog,
  normalizeTrustBoundaryCatalog,
  serializeSecurityPolicyContract
} = require('../../tools/rmt-language/vnext-security');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const SECURITY_CONTRACT_PATH = 'development/XTendRMT-vNext-Security-Policy-Contract.md';
const WP_E15_13_PATH = 'development/WP-E15-13-Trust-Boundaries-Sanitizing-und-Security-Policies-integrieren.md';
const VALID_SECURITY_FIXTURE = 'tests/rmt-language/fixtures/vnext-security-valid.rmt';
const MISSING_SECURITY_FIXTURE = 'tests/rmt-language/fixtures/vnext-security-missing-policy.rmt';
const CONFLICT_SECURITY_FIXTURE = 'tests/rmt-language/fixtures/vnext-security-conflict.rmt';
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

function createSecurityDataSources() {
  return [
    {
      id: 'docs.parse',
      kind: 'endpoint',
      unsafe: true,
      format: 'html',
      requiresTrustBoundary: true,
      requiresSanitize: ['html']
    },
    {
      id: 'docs.feed',
      kind: 'sse',
      unsafe: true,
      format: 'html',
      requiresTrustBoundary: true,
      requiresSanitize: ['html']
    },
    {
      id: 'preview.render',
      kind: 'worker',
      unsafe: true,
      format: 'html',
      requiresTrustBoundary: true,
      requiresSanitize: ['html']
    }
  ];
}

function createComplexDataSources() {
  return [
    {
      id: 'settings.load',
      kind: 'endpoint',
      unsafe: false
    },
    {
      id: 'docs.feed',
      kind: 'sse',
      unsafe: true,
      format: 'html',
      requiresTrustBoundary: true,
      requiresSanitize: ['html']
    }
  ];
}

function createStrictContract(coreDocument, overrides = {}) {
  return createSecurityPolicyContract(coreDocument, {
    dataSources: createSecurityDataSources(),
    ...overrides
  });
}

function runRmtVNextSecuritySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-security',
    label: 'Epic 15 RMT vNext Security Policy Contract'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextSecurity;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const securityContract = readText(SECURITY_CONTRACT_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_SECURITY_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_SECURITY_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_SECURITY_MODULE_PATH, rootDir, 'vNext security module exists');
  assertFileExists(context, RMT_VNEXT_SECURITY_SUITE_PATH, rootDir, 'vNext security suite exists');
  assertFileExists(context, WP_E15_13_PATH, rootDir, 'WP-E15-13 workpackage document exists');
  assertFileExists(context, VALID_SECURITY_FIXTURE, rootDir, 'vNext security fixture exists');
  assertFileExists(context, MISSING_SECURITY_FIXTURE, rootDir, 'vNext missing-security fixture exists');
  assertFileExists(context, CONFLICT_SECURITY_FIXTURE, rootDir, 'vNext conflicting-security fixture exists');
  context.assert(moduleSyntax.ok, `vNext security module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext security suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_SECURITY_POLICY_SCHEMA, 'package metadata declares security policy schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.trustBoundarySchema === RMT_VNEXT_TRUST_BOUNDARY_SCHEMA, 'package metadata declares trust boundary schema');
  context.assert(metadata && metadata.sanitizePolicySchema === RMT_VNEXT_SANITIZE_POLICY_SCHEMA, 'package metadata declares sanitize policy schema');
  context.assert(metadata && metadata.postureSchema === RMT_VNEXT_SECURITY_POSTURE_SCHEMA, 'package metadata declares security posture schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_SECURITY_REPORT_SCHEMA, 'package metadata declares security report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_SECURITY_WORKPACKAGE, 'package metadata points to WP-E15-13');
  context.assert(metadata && metadata.module === RMT_VNEXT_SECURITY_MODULE_PATH, 'package metadata points to security module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_SECURITY_SUITE_PATH, 'package metadata points to security suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-security --json', 'package metadata declares security local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_SECURITY_PACKAGE_SCRIPT, 'package metadata declares security package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-security'] === 'string' ? packageManifest.exports['./rmt-language/vnext-security'] : packageManifest.exports['./rmt-language/vnext-security'] && packageManifest.exports['./rmt-language/vnext-security'].default) === './tools/rmt-language/vnext-security.js', 'package exports vNext security contract');
  context.assert(packageManifest.scripts['test:rmt-vnext-security'] === 'node scripts/run_xtend_tests.js rmt-vnext-security', 'package exposes vNext security script');
  context.assert(runner.hasSuite("rmt-vnext-security"), 'test runner exposes rmt-vnext-security suite');
  context.assert(epic.includes('| `WP-E15-13` | P1 | completed | WS4 |'), 'Epic marks WP-E15-13 completed');
  context.assert(epic.includes('| `WP-E15-14` | P1 | completed | WS4 |'), 'Epic keeps WP-E15-14 completed after security contract');
  context.assert(securityContract.includes('schema: "xtend.rmt.vnext-security-policy-contract.v1"'), 'Security contract document declares schema');

  const trustCatalog = normalizeTrustBoundaryCatalog();
  context.assert(trustCatalog.count === 3, 'default trust boundary catalog exposes three profiles');
  assertIncludesAll(context, trustCatalog.ids, [
    'xtend.security.sanitizing-boundary.v1',
    'xtend.security.streaming-boundary.v1',
    'xtend.security.worker-boundary.v1'
  ], 'default trust boundary ids');
  assertIncludesAll(context, SECURITY_ALLOWED_SANITIZE_FORMATS, ['html', 'text', 'url', 'json'], 'allowed sanitize formats');
  context.assert(DEFAULT_TRUST_BOUNDARY_PROFILES['xtend.security.sanitizing-boundary.v1'].csp.requireTrustedTypes === true, 'sanitizing boundary requires Trusted Types');
  const dataSourceSecurityCatalog = normalizeDataSourceSecurityCatalog(createSecurityDataSources());
  context.assert(dataSourceSecurityCatalog.count === 3, 'data source security catalog normalizes three data sources');

  const compileResult = compileFixture(VALID_SECURITY_FIXTURE, rootDir);
  const core = compileResult.coreDocument;
  context.assert(compileResult.ok === true, 'security fixture compiles successfully');
  context.assert(core.schema === RMT_VNEXT_CORE_SCHEMA, 'security fixture emits vNext core schema');
  context.assert(core.dataSources.length === 3, 'security fixture compiles three data sources');
  context.assert(core.securityPolicies.length === 6, 'security fixture compiles six security policies');

  const contract = createStrictContract(core);
  context.assert(contract.schema === RMT_VNEXT_SECURITY_POLICY_SCHEMA, 'security contract emits security schema');
  context.assert(contract.ok === true, 'security contract validates successfully');
  context.assert(contract.status === 'ready', 'security contract is ready');
  context.assert(contract.policyCount === 6, 'security contract includes six core policies');
  context.assert(contract.trustBoundaryCount === 3, 'security contract includes three trust boundaries');
  context.assert(contract.sanitizePolicyCount === 3, 'security contract includes three sanitize policies');
  context.assert(contract.unsafeFlowCount === 3, 'security contract tracks three unsafe flows');
  context.assert(contract.trustBoundaries.every((policy) => policy.schema === RMT_VNEXT_TRUST_BOUNDARY_SCHEMA), 'trust boundary records use trust boundary schema');
  context.assert(contract.sanitizers.every((policy) => policy.schema === RMT_VNEXT_SANITIZE_POLICY_SCHEMA), 'sanitize records use sanitize policy schema');
  context.assert(contract.postures.every((posture) => posture.schema === RMT_VNEXT_SECURITY_POSTURE_SCHEMA), 'operation postures use security posture schema');
  context.assert(contract.trustBoundaries.every((policy) => policy.csp && policy.csp.requireTrustedTypes === true), 'trust boundaries expose CSP requirements');
  context.assert(contract.trustBoundaries.every((policy) => policy.isolation && policy.sandbox && policy.escaping), 'trust boundaries expose isolation, sandbox and escaping profiles');
  context.assert(contract.sanitizers.every((policy) => policy.format === 'html'), 'sanitize policies preserve html format');
  context.assert(contract.postures.every((posture) => posture.required.trustBoundary === true), 'unsafe postures require trust boundaries');
  context.assert(contract.postures.every((posture) => posture.escaping.required === true && posture.escaping.formats.includes('html')), 'unsafe postures require html escaping');
  context.assert(contract.postures.some((posture) => posture.dataSource && posture.dataSource.kind === 'sse' && posture.boundaryIds.includes('xtend.security.streaming-boundary.v1')), 'sse posture uses streaming boundary');
  context.assert(contract.postures.some((posture) => posture.dataSource && posture.dataSource.kind === 'worker' && posture.boundaryIds.includes('xtend.security.worker-boundary.v1')), 'worker posture uses worker boundary');

  const repeatContract = createStrictContract(compileFixture(VALID_SECURITY_FIXTURE, rootDir).coreDocument);
  context.assert(serializeSecurityPolicyContract(contract) === serializeSecurityPolicyContract(repeatContract), 'security contract serialization is byte-stable');
  context.assert(JSON.parse(serializeSecurityPolicyContract(contract)).schema === RMT_VNEXT_SECURITY_POLICY_SCHEMA, 'serialized security contract is parseable JSON');

  const complexResult = compileFixture(VALID_COMPLEX_FIXTURE, rootDir);
  const complexContract = createSecurityPolicyContract(complexResult.coreDocument, {
    dataSources: createComplexDataSources()
  });
  context.assert(complexContract.ok === true, 'complex fixture security contract validates successfully');
  context.assert(complexContract.trustBoundaryCount === 1 && complexContract.sanitizePolicyCount === 1, 'complex fixture exposes one trust boundary and one sanitizer');
  context.assert(complexContract.postures.some((posture) => posture.dataSource && posture.dataSource.target === 'docs.feed'), 'complex fixture audits docs.feed stream');

  const missingResult = compileFixture(MISSING_SECURITY_FIXTURE, rootDir);
  const missingContract = createSecurityPolicyContract(missingResult.coreDocument, {
    dataSources: createSecurityDataSources()
  });
  context.assert(missingContract.ok === false, 'missing security policies block security contract');
  context.assert(missingContract.diagnostics.some((diagnostic) => diagnostic.code === SECURITY_TRUST_BOUNDARY_MISSING_CODE), 'missing trust boundaries produce diagnostics');
  context.assert(missingContract.diagnostics.some((diagnostic) => diagnostic.code === SECURITY_SANITIZE_MISSING_CODE), 'missing sanitize policies produce diagnostics');

  const conflictResult = compileFixture(CONFLICT_SECURITY_FIXTURE, rootDir);
  const conflictContract = createSecurityPolicyContract(conflictResult.coreDocument, {
    dataSources: createSecurityDataSources()
  });
  context.assert(conflictContract.ok === false, 'conflicting trust boundaries block security contract');
  context.assert(conflictContract.diagnostics.some((diagnostic) => diagnostic.code === SECURITY_POLICY_CONFLICT_CODE), 'conflicting trust boundaries produce diagnostics');

  const unknownBoundaryCore = cloneJson(core);
  unknownBoundaryCore.securityPolicies.find((policy) => policy.kind === 'trust_boundary').boundary = 'xtend.security.unknown-boundary.v1';
  const unknownBoundaryContract = createStrictContract(unknownBoundaryCore);
  context.assert(unknownBoundaryContract.ok === false, 'unknown trust boundaries block security contract');
  context.assert(unknownBoundaryContract.diagnostics.some((diagnostic) => diagnostic.code === SECURITY_TRUST_BOUNDARY_UNKNOWN_CODE), 'unknown trust boundaries produce diagnostics');

  const unsupportedSanitizeCore = cloneJson(core);
  unsupportedSanitizeCore.securityPolicies.find((policy) => policy.kind === 'sanitize').format = 'markdown';
  const unsupportedSanitizeContract = createStrictContract(unsupportedSanitizeCore);
  context.assert(unsupportedSanitizeContract.ok === false, 'unsupported sanitize formats block security contract');
  context.assert(unsupportedSanitizeContract.diagnostics.some((diagnostic) => diagnostic.code === SECURITY_SANITIZE_FORMAT_UNSUPPORTED_CODE), 'unsupported sanitize formats produce diagnostics');

  const missingOwnerCore = cloneJson(core);
  missingOwnerCore.securityPolicies[0].ownerOperation = 'operation:missing';
  const missingOwnerContract = createStrictContract(missingOwnerCore);
  context.assert(missingOwnerContract.ok === false, 'missing policy owners block security contract');
  context.assert(missingOwnerContract.diagnostics.some((diagnostic) => diagnostic.code === SECURITY_POLICY_OWNER_MISSING_CODE), 'missing policy owners produce diagnostics');

  const duplicatePolicyCore = cloneJson(core);
  duplicatePolicyCore.securityPolicies.push(cloneJson(duplicatePolicyCore.securityPolicies[0]));
  const duplicatePolicyContract = createStrictContract(duplicatePolicyCore);
  context.assert(duplicatePolicyContract.ok === false, 'duplicate security policies block security contract');
  context.assert(duplicatePolicyContract.diagnostics.some((diagnostic) => diagnostic.code === SECURITY_POLICY_DUPLICATE_CODE), 'duplicate security policies produce diagnostics');

  const sanitizeOnlyCore = cloneJson(core);
  sanitizeOnlyCore.securityPolicies = sanitizeOnlyCore.securityPolicies.filter((policy) => policy.kind !== 'trust_boundary');
  const sanitizeOnlyContract = createStrictContract(sanitizeOnlyCore);
  context.assert(sanitizeOnlyContract.ok === false, 'sanitize without trust boundary blocks security contract');
  context.assert(sanitizeOnlyContract.diagnostics.some((diagnostic) => diagnostic.code === SECURITY_SANITIZE_WITHOUT_BOUNDARY_CODE), 'sanitize without trust boundary produces diagnostics');

  const factory = createRmtVNextSecurityPolicyContract({
    dataSources: createSecurityDataSources()
  });
  context.assert(factory.schema === RMT_VNEXT_SECURITY_POLICY_SCHEMA, 'factory exposes security schema');
  context.assert(factory.trustBoundarySchema === RMT_VNEXT_TRUST_BOUNDARY_SCHEMA, 'factory exposes trust boundary schema');
  context.assert(factory.sanitizePolicySchema === RMT_VNEXT_SANITIZE_POLICY_SCHEMA, 'factory exposes sanitize policy schema');
  context.assert(factory.postureSchema === RMT_VNEXT_SECURITY_POSTURE_SCHEMA, 'factory exposes posture schema');
  context.assert(factory.createContract(core).ok === true, 'factory creates security contract');

  return context.result({
    schema: RMT_VNEXT_SECURITY_REPORT_SCHEMA,
    securitySchema: RMT_VNEXT_SECURITY_POLICY_SCHEMA,
    trustBoundarySchema: RMT_VNEXT_TRUST_BOUNDARY_SCHEMA,
    sanitizePolicySchema: RMT_VNEXT_SANITIZE_POLICY_SCHEMA,
    postureSchema: RMT_VNEXT_SECURITY_POSTURE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_SECURITY_WORKPACKAGE,
    securityModule: RMT_VNEXT_SECURITY_MODULE_PATH,
    suite: RMT_VNEXT_SECURITY_SUITE_PATH,
    policyCount: contract.policyCount,
    unsafeFlowCount: contract.unsafeFlowCount
  });
}

function printRmtVNextSecurityReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Security Policy Contract erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Security Policy Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextSecurityReport,
  runRmtVNextSecuritySuite
};

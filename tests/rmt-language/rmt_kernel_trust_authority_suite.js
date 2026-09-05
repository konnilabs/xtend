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
  HTML_TRUST_SINKS,
  KERNEL_TRUST_DIAGNOSTIC_CODES,
  KERNEL_TRUST_REASON_CODES,
  KERNEL_TRUST_SCOPES,
  KERNEL_TRUST_SINKS,
  KERNEL_TRUST_VERDICTS,
  RMT_KERNEL_TRUST_AUTHORITY_CONTRACT_PATH,
  RMT_KERNEL_TRUST_AUTHORITY_MODULE_PATH,
  RMT_KERNEL_TRUST_AUTHORITY_PACKAGE_SCRIPT,
  RMT_KERNEL_TRUST_AUTHORITY_REPORT_SCHEMA,
  RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
  RMT_KERNEL_TRUST_AUTHORITY_SUITE_PATH,
  RMT_KERNEL_TRUST_AUTHORITY_WORKPACKAGE,
  RMT_KERNEL_TRUST_AUTHORITY_WP_PATH,
  RMT_KERNEL_TRUST_DIAGNOSTIC_SCHEMA,
  RMT_KERNEL_TRUST_HARDENING_CONTRACT,
  RMT_KERNEL_TRUST_VERDICT_SCHEMA,
  createKernelTrustAuthority,
  createKernelTrustAuthorityContract,
  createKernelTrustDiagnostic,
  createKernelTrustVerdict,
  hasUnsafeProtocol,
  serializeKernelTrustAuthorityContract,
  serializeKernelTrustVerdict
} = require('../../tools/rmt-language/kernel-trust-authority');

const BACKLOG_PATH = 'development/XTendRMT-Kernel-Sicherheits-Hardening-Backlog.md';
const BASELINE_CONTRACT_PATH = 'development/XTendRMT-Kernel-Trust-Hardening-Contract.md';
const DECLARATION_PATH = 'tools/rmt-language/kernel-trust-authority.d.ts';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function getPackageExport(packageManifest, exportKey) {
  const entry = packageManifest.exports && packageManifest.exports[exportKey];
  return entry && typeof entry === 'object' ? entry : null;
}

function runRmtKernelTrustAuthoritySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-kernel-trust-authority',
    label: 'RKSH-WP-01 Kernel Trust Authority Contract'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtKernelTrustAuthority;
  const packageExport = getPackageExport(packageManifest, './rmt-language/kernel-trust-authority');
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const baselineContract = readText(BASELINE_CONTRACT_PATH, rootDir);
  const trustAuthorityContract = readText(RMT_KERNEL_TRUST_AUTHORITY_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_KERNEL_TRUST_AUTHORITY_WP_PATH, rootDir);
  const declaration = readText(DECLARATION_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_KERNEL_TRUST_AUTHORITY_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_KERNEL_TRUST_AUTHORITY_SUITE_PATH, { rootDir, extension: '.js' });

  [
    RMT_KERNEL_TRUST_AUTHORITY_MODULE_PATH,
    DECLARATION_PATH,
    RMT_KERNEL_TRUST_AUTHORITY_SUITE_PATH,
    RMT_KERNEL_TRUST_AUTHORITY_CONTRACT_PATH,
    RMT_KERNEL_TRUST_AUTHORITY_WP_PATH,
    BACKLOG_PATH,
    BASELINE_CONTRACT_PATH
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `Kernel trust authority module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Kernel trust authority suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(packageExport && packageExport.default === './tools/rmt-language/kernel-trust-authority.js', 'package exports kernel trust authority module');
  context.assert(packageExport && packageExport.types === './tools/rmt-language/kernel-trust-authority.d.ts', 'package exports kernel trust authority declarations');
  context.assert(packageManifest.scripts['test:rmt-kernel-trust-authority'] === 'node scripts/run_xtend_tests.js rmt-kernel-trust-authority', 'package exposes kernel trust authority script');
  context.assert(metadata && metadata.schema === RMT_KERNEL_TRUST_AUTHORITY_SCHEMA, 'package metadata exposes kernel trust authority schema');
  context.assert(metadata && metadata.verdictSchema === RMT_KERNEL_TRUST_VERDICT_SCHEMA, 'package metadata exposes trust verdict schema');
  context.assert(metadata && metadata.diagnosticSchema === RMT_KERNEL_TRUST_DIAGNOSTIC_SCHEMA, 'package metadata exposes trust diagnostic schema');
  context.assert(metadata && metadata.reportSchema === RMT_KERNEL_TRUST_AUTHORITY_REPORT_SCHEMA, 'package metadata exposes trust authority report schema');
  context.assert(metadata && metadata.workpackage === RMT_KERNEL_TRUST_AUTHORITY_WORKPACKAGE, 'package metadata points to RKSH-WP-01');
  context.assert(metadata && metadata.module === RMT_KERNEL_TRUST_AUTHORITY_MODULE_PATH, 'package metadata points to trust authority module');
  context.assert(metadata && metadata.suite === RMT_KERNEL_TRUST_AUTHORITY_SUITE_PATH, 'package metadata points to trust authority suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-kernel-trust-authority --json', 'package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === RMT_KERNEL_TRUST_AUTHORITY_PACKAGE_SCRIPT, 'package metadata exposes package script');
  context.assert(runner.hasSuite("rmt-kernel-trust-authority"), 'runner registers kernel trust authority suite');
  context.assert(runner.hasImplementation({ function: "runRmtKernelTrustAuthoritySuite" }), 'runner imports kernel trust authority suite');

  assertIncludesAll(context, KERNEL_TRUST_VERDICTS, ['trusted', 'sanitized', 'blocked', 'panic'], 'trust verdicts');
  assertIncludesAll(context, KERNEL_TRUST_SCOPES, ['binding', 'slot', 'template', 'surface', 'remote-surface', 'scheduler-job', 'kernel'], 'trust scopes');
  assertIncludesAll(context, KERNEL_TRUST_SINKS, ['textContent', 'attribute', 'url-attribute', 'property', 'innerHTML', 'slot.html', 'prerender.html', 'fallback.html'], 'trust sinks');
  assertIncludesAll(context, HTML_TRUST_SINKS, ['innerHTML', 'insertAdjacentHTML', 'template.innerHTML', 'slot.html', 'prerender.html', 'fallback.html'], 'html trust sinks');
  assertIncludesAll(context, Object.values(KERNEL_TRUST_REASON_CODES), [
    'rmt.kernel.trust.html_sanitizer_missing',
    'rmt.kernel.trust.attribute_refused',
    'rmt.kernel.trust.url_protocol_refused',
    'rmt.kernel.trust.property_refused',
    'rmt.kernel.trust.remote_boundary_missing'
  ], 'trust reason codes');
  assertIncludesAll(context, KERNEL_TRUST_DIAGNOSTIC_CODES, [
    'rmt.kernel.trust.sink_refused',
    'rmt.kernel.trust.html_sanitizer_missing',
    'rmt.kernel.trust.attribute_refused',
    'rmt.kernel.panic.candidate'
  ], 'trust diagnostic codes');

  const contract = createKernelTrustAuthorityContract();
  context.assert(contract.schema === RMT_KERNEL_TRUST_AUTHORITY_SCHEMA, 'contract exposes trust authority schema');
  context.assert(contract.hardeningContract === RMT_KERNEL_TRUST_HARDENING_CONTRACT, 'contract links kernel trust hardening baseline');
  context.assert(contract.verdictSchema === RMT_KERNEL_TRUST_VERDICT_SCHEMA, 'contract exposes trust verdict schema');
  context.assert(contract.diagnosticSchema === RMT_KERNEL_TRUST_DIAGNOSTIC_SCHEMA, 'contract exposes trust diagnostic schema');
  context.assert(contract.hostNeutral === true, 'contract is host-neutral');
  context.assert(contract.runtimeMutations === false, 'contract does not mutate runtime sinks in WP-01');
  context.assert(contract.defaultPolicy.htmlRequiresSanitizing === true, 'default policy requires html sanitizing');
  context.assert(contract.defaultPolicy.eventAttributesAllowed === false, 'default policy refuses event attributes');
  context.assert(contract.defaultPolicy.unknownPropertyWritesAllowed === false, 'default policy refuses unknown property writes');
  context.assert(contract.hostAdapterExtension.required === false, 'host adapter extension is optional in WP-01');
  assertIncludesAll(context, contract.handoff, ['RKSH-WP-02', 'RKSH-WP-03', 'RKSH-WP-04', 'RKSH-WP-05'], 'contract handoff');
  context.assert(JSON.parse(serializeKernelTrustAuthorityContract(contract)).schema === RMT_KERNEL_TRUST_AUTHORITY_SCHEMA, 'serialized contract is parseable JSON');
  context.assert(serializeKernelTrustAuthorityContract(contract) === serializeKernelTrustAuthorityContract(createKernelTrustAuthorityContract()), 'contract serialization is stable');

  const authority = createKernelTrustAuthority();
  context.assert(authority.schema === RMT_KERNEL_TRUST_AUTHORITY_SCHEMA, 'authority factory exposes schema');
  context.assert(authority.contract.schema === RMT_KERNEL_TRUST_AUTHORITY_SCHEMA, 'authority factory exposes contract');

  const textVerdict = authority.evaluateOutput({
    scope: 'binding',
    sink: 'textContent',
    sourceRef: 'template:demo/title',
    value: 'Hello'
  });
  context.assert(textVerdict.verdict === 'trusted', 'textContent output is trusted');
  context.assert(textVerdict.commitAllowed === true, 'trusted text output may commit');
  context.assert(textVerdict.diagnosticCode === null, 'trusted text output has no diagnostic');

  const sanitizedHtmlVerdict = authority.evaluateOutput({
    scope: 'slot',
    sink: 'slot.html',
    sourceRef: 'template:demo/body',
    value: '<strong>Safe</strong>',
    sanitized: true,
    trustBoundary: 'xtend.security.sanitizing-boundary.v1'
  });
  context.assert(sanitizedHtmlVerdict.verdict === 'sanitized', 'sanitized html output is marked sanitized');
  context.assert(sanitizedHtmlVerdict.commitAllowed === true, 'sanitized html output may commit');
  context.assert(sanitizedHtmlVerdict.sanitized === true, 'sanitized html verdict preserves sanitized flag');

  const blockedHtmlVerdict = createKernelTrustVerdict({
    scope: 'slot',
    sink: 'innerHTML',
    sourceRef: 'template:demo/unsafe',
    value: '<script>alert(1)</script>'
  });
  context.assert(blockedHtmlVerdict.verdict === 'blocked', 'unsanitized html output is blocked');
  context.assert(blockedHtmlVerdict.commitAllowed === false, 'blocked html output may not commit');
  context.assert(blockedHtmlVerdict.reasonCode === KERNEL_TRUST_REASON_CODES.HTML_SANITIZER_MISSING, 'blocked html reports missing sanitizer');
  context.assert(blockedHtmlVerdict.diagnosticCode === 'rmt.kernel.trust.html_sanitizer_missing', 'blocked html maps to sanitizer diagnostic');

  const eventAttributeVerdict = authority.evaluateOutput({
    scope: 'binding',
    kind: 'attribute',
    attributeName: 'onclick',
    value: 'alert(1)'
  });
  context.assert(eventAttributeVerdict.verdict === 'blocked', 'event attributes are blocked');
  context.assert(eventAttributeVerdict.reasonCode === KERNEL_TRUST_REASON_CODES.ATTRIBUTE_REFUSED, 'event attribute uses attribute refused reason');

  const urlVerdict = authority.evaluateOutput({
    scope: 'binding',
    kind: 'attribute',
    attributeName: 'href',
    value: 'javascript:alert(1)'
  });
  context.assert(urlVerdict.verdict === 'blocked', 'unsafe url attribute is blocked');
  context.assert(urlVerdict.reasonCode === KERNEL_TRUST_REASON_CODES.URL_PROTOCOL_REFUSED, 'unsafe url uses protocol refused reason');
  context.assert(hasUnsafeProtocol('java\nscript:alert(1)') === true, 'url protocol detection normalizes control characters');
  context.assert(hasUnsafeProtocol('/docs/index.html') === false, 'relative url is not flagged as unsafe protocol');

  const propertyVerdict = authority.evaluateOutput({
    scope: 'binding',
    sink: 'property',
    propertyName: 'innerHTML',
    value: '<img onerror=alert(1)>'
  });
  context.assert(propertyVerdict.verdict === 'blocked', 'unsafe property write is blocked');
  context.assert(propertyVerdict.reasonCode === KERNEL_TRUST_REASON_CODES.PROPERTY_REFUSED, 'unsafe property uses property refused reason');

  const remoteVerdict = authority.evaluateOutput({
    scope: 'remote-surface',
    sink: 'remote-surface-output',
    sourceRef: 'remote:unknown',
    critical: true
  });
  context.assert(remoteVerdict.verdict === 'blocked', 'remote output without boundary is blocked');
  context.assert(remoteVerdict.panicCandidate === true, 'critical remote boundary miss is a panic candidate');

  const panicVerdict = authority.evaluateOutput({
    scope: 'kernel',
    sink: 'diagnostic-event',
    critical: true
  });
  context.assert(panicVerdict.verdict === 'panic', 'critical kernel output creates panic verdict');
  context.assert(panicVerdict.commitAllowed === false, 'panic verdict does not allow commit');
  context.assert(panicVerdict.severity === 'fatal', 'panic verdict is fatal');

  const diagnostic = createKernelTrustDiagnostic(blockedHtmlVerdict);
  context.assert(diagnostic.schema === 'xtend.rmt.linter.diagnostic.v1', 'trust diagnostic uses linter diagnostic schema');
  context.assert(diagnostic.trustDiagnosticSchema === RMT_KERNEL_TRUST_DIAGNOSTIC_SCHEMA, 'trust diagnostic exposes trust diagnostic schema');
  context.assert(diagnostic.code === 'rmt.kernel.trust.html_sanitizer_missing', 'trust diagnostic uses verdict diagnostic code');
  context.assert(diagnostic.commitAllowed === false, 'trust diagnostic preserves commit decision');
  context.assert(diagnostic.correlationId === blockedHtmlVerdict.correlationId, 'trust diagnostic preserves correlation id');
  context.assert(!JSON.stringify(diagnostic.metadata).includes('<script>'), 'trust diagnostic metadata does not include raw html');
  context.assert(JSON.parse(serializeKernelTrustVerdict(blockedHtmlVerdict)).schema === RMT_KERNEL_TRUST_VERDICT_SCHEMA, 'serialized verdict is parseable JSON');
  context.assert(authority.serializeVerdict(blockedHtmlVerdict) === serializeKernelTrustVerdict(blockedHtmlVerdict), 'authority serializer delegates to stable verdict serializer');

  assertTextIncludesAll(context, declaration, [
    'RmtKernelTrustVerdict',
    'RmtKernelTrustAuthorityContract',
    'RmtKernelTrustAuthority',
    'createKernelTrustAuthority',
    'RMT_KERNEL_TRUST_VERDICT_SCHEMA'
  ], 'trust authority declaration');
  assertTextIncludesAll(context, trustAuthorityContract, [
    'schema: "xtend.rmt.kernel-trust-authority.v1"',
    'RmtKernelTrustVerdict',
    'rmt.kernel.trust.html_sanitizer_missing',
    'RKSH-WP-02'
  ], 'trust authority contract document');
  assertTextIncludesAll(context, workpackage, [
    'Status: `completed`',
    RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
    'node scripts/run_xtend_tests.js rmt-kernel-trust-authority --json',
    'RKSH-WP-02'
  ], 'RKSH-WP-01 document');
  assertTextIncludesAll(context, backlog, [
    '| `RKSH-WP-01` | P0 | completed | Trust | `KernelTrustAuthority` Contract definieren |',
    RMT_KERNEL_TRUST_AUTHORITY_PACKAGE_SCRIPT
  ], 'kernel security hardening backlog');
  assertTextIncludesAll(context, baselineContract, [
    'runtime-output-requires-kernel-trust-verdict',
    'RKSH-WP-01'
  ], 'kernel trust hardening baseline');

  return context.result({
    schema: RMT_KERNEL_TRUST_AUTHORITY_REPORT_SCHEMA,
    trustAuthoritySchema: RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
    verdictSchema: RMT_KERNEL_TRUST_VERDICT_SCHEMA,
    diagnosticSchema: RMT_KERNEL_TRUST_DIAGNOSTIC_SCHEMA,
    workpackage: RMT_KERNEL_TRUST_AUTHORITY_WORKPACKAGE,
    module: RMT_KERNEL_TRUST_AUTHORITY_MODULE_PATH,
    suite: RMT_KERNEL_TRUST_AUTHORITY_SUITE_PATH,
    verdictCount: KERNEL_TRUST_VERDICTS.length,
    scopeCount: KERNEL_TRUST_SCOPES.length,
    sinkCount: KERNEL_TRUST_SINKS.length
  });
}

function printRmtKernelTrustAuthorityReport(result) {
  printSuiteReport(result, {
    successTitle: 'RKSH-WP-01 Kernel Trust Authority Contract erfolgreich.',
    failureTitle: 'RKSH-WP-01 Kernel Trust Authority Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtKernelTrustAuthorityReport,
  runRmtKernelTrustAuthoritySuite
};

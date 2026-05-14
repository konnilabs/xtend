'use strict';

const {
  RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
  RMT_KERNEL_TRUST_VERDICT_SCHEMA
} = require('./kernel-trust-authority');
const {
  RMT_KERNEL_PANIC_MONITOR_SCHEMA,
  RMT_KERNEL_PANIC_STATE_SCHEMA
} = require('./kernel-panic-monitor');
const {
  RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA,
  RMT_KERNEL_RECOVERY_SCHEMA
} = require('./kernel-recovery');

const RMT_KERNEL_SECURITY_REGRESSION_SCHEMA = 'xtend.rmt.kernel-security-regression.v1';
const RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA = 'xtend.rmt.kernel-security-regression-fixture.v1';
const RMT_KERNEL_SECURITY_REGRESSION_REPORT_SCHEMA = 'xtend.rmt.kernel-security-regression-report.v1';
const RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_SCHEMA = 'xtend.rmt.kernel-security-regression-browser-smoke.v1';
const RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE = 'RKSH-WP-09';
const RMT_KERNEL_SECURITY_REGRESSION_MODULE_PATH = 'tools/rmt-language/kernel-security-regression.js';
const RMT_KERNEL_SECURITY_REGRESSION_SUITE_PATH = 'tests/rmt-language/rmt_kernel_security_regression_suite.js';
const RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_PATH = 'tests/rmt-language/fixtures/kernel-security-regression-fixtures.json';
const RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_PATH = 'tests/browser/fixtures/rmt-kernel-security-regression-smoke.html';
const RMT_KERNEL_SECURITY_REGRESSION_CONTRACT_PATH = 'development/XTendRMT-Kernel-Security-Regression-Contract.md';
const RMT_KERNEL_SECURITY_REGRESSION_WP_PATH = 'development/WP-RKSH-09-Negative-Fixtures-Fuzzing-und-Browser-Smokes-erweitern.md';
const RMT_KERNEL_SECURITY_REGRESSION_PACKAGE_SCRIPT = 'npm run test:rmt-kernel-security-regression';
const RMT_KERNEL_SECURITY_REGRESSION_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-kernel-security-regression --json';
const RMT_KERNEL_SECURITY_REGRESSION_DIAGNOSTIC_CHANNEL = 'rmt.kernel.security_regression';

const KERNEL_SECURITY_REGRESSION_ARTIFACTS = Object.freeze([
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-runtime.browser.js'
]);

const KERNEL_SECURITY_REGRESSION_REQUIRED_CATEGORIES = Object.freeze([
  'maliciousHtmlFragments',
  'maliciousAttributes',
  'maliciousUrls',
  'maliciousProperties',
  'panicSequences',
  'browserSmokeScenarios'
]);

const DEFAULT_KERNEL_SECURITY_REGRESSION_FIXTURES = Object.freeze({
  maliciousHtmlFragments: Object.freeze([
    Object.freeze({
      id: 'html-script-event-url-srcdoc',
      sink: 'slot.html',
      payload: '<img src="javascript:alert(1)" onerror="alert(1)"><script>alert(1)</script><p srcdoc="x">Ok</p><iframe src="/frame"></iframe><a href="/safe">Safe</a>',
      expectedVerdict: 'sanitized',
      expectedRemovedPatterns: Object.freeze(['script', 'iframe', 'onerror', 'javascript:', 'srcdoc'])
    }),
    Object.freeze({
      id: 'html-svg-style-data-url',
      sink: 'prerender.html',
      payload: '<svg onload="alert(1)"><a href="javascript:alert(1)">x</a></svg><style>body{background:url(javascript:alert(1))}</style><strong>Keep</strong>',
      expectedVerdict: 'sanitized',
      expectedRemovedPatterns: Object.freeze(['svg', 'onload', 'style', 'javascript:'])
    }),
    Object.freeze({
      id: 'html-fallback-event-handler',
      sink: 'fallback.html',
      payload: '<strong onclick="alert(1)">Recovered</strong><script>alert(1)</script>',
      expectedVerdict: 'sanitized',
      expectedRemovedPatterns: Object.freeze(['onclick', 'script'])
    })
  ]),
  maliciousAttributes: Object.freeze([
    Object.freeze({
      id: 'attribute-onclick',
      sink: 'attribute',
      attributeName: 'onclick',
      payload: 'alert(1)',
      expectedVerdict: 'blocked',
      expectedDiagnosticCode: 'rmt.kernel.trust.attribute_refused'
    }),
    Object.freeze({
      id: 'attribute-style-url',
      sink: 'attribute',
      attributeName: 'style',
      payload: 'background:url(javascript:alert(1))',
      expectedVerdict: 'blocked',
      expectedDiagnosticCode: 'rmt.kernel.trust.attribute_refused'
    }),
    Object.freeze({
      id: 'attribute-srcdoc',
      sink: 'attribute',
      attributeName: 'srcdoc',
      payload: '<script>alert(1)</script>',
      expectedVerdict: 'blocked',
      expectedDiagnosticCode: 'rmt.kernel.trust.attribute_refused'
    }),
    Object.freeze({
      id: 'attribute-custom-danger',
      sink: 'attribute',
      attributeName: 'customDanger',
      payload: 'unknown',
      expectedVerdict: 'blocked',
      expectedDiagnosticCode: 'rmt.kernel.trust.attribute_refused'
    })
  ]),
  maliciousUrls: Object.freeze([
    Object.freeze({
      id: 'url-javascript-newline',
      sink: 'url-attribute',
      attributeName: 'href',
      payload: 'java\nscript:alert(1)',
      expectedVerdict: 'blocked',
      expectedDiagnosticCode: 'rmt.kernel.trust.url_protocol_refused'
    }),
    Object.freeze({
      id: 'url-data-html',
      sink: 'url-attribute',
      attributeName: 'src',
      payload: 'data:text/html,<script>alert(1)</script>',
      expectedVerdict: 'blocked',
      expectedDiagnosticCode: 'rmt.kernel.trust.url_protocol_refused'
    }),
    Object.freeze({
      id: 'url-vbscript',
      sink: 'url-attribute',
      attributeName: 'href',
      payload: 'vbscript:msgbox(1)',
      expectedVerdict: 'blocked',
      expectedDiagnosticCode: 'rmt.kernel.trust.url_protocol_refused'
    })
  ]),
  maliciousProperties: Object.freeze([
    Object.freeze({
      id: 'property-innerhtml',
      sink: 'property',
      propertyName: 'innerHTML',
      payload: '<script>alert(1)</script>',
      expectedVerdict: 'blocked',
      expectedDiagnosticCode: 'rmt.kernel.trust.property_refused'
    }),
    Object.freeze({
      id: 'property-onclick',
      sink: 'property',
      propertyName: 'onclick',
      payload: 'alert(1)',
      expectedVerdict: 'blocked',
      expectedDiagnosticCode: 'rmt.kernel.trust.property_refused'
    })
  ]),
  panicSequences: Object.freeze([
    Object.freeze({
      id: 'three-blocks-activate-panic',
      repeatedBlockThreshold: 3,
      verdicts: Object.freeze(['blocked', 'blocked', 'blocked']),
      expectedState: 'active',
      expectedTrigger: 'threshold-breached',
      expectedRecoveryStatus: 'recovered'
    })
  ]),
  browserSmokeScenarios: Object.freeze([
    Object.freeze({
      id: 'slot-html-fragment',
      sink: 'slot.html',
      expectedVerdict: 'sanitized',
      artifactTargets: Object.freeze(['core', 'runtime', 'browser'])
    }),
    Object.freeze({
      id: 'prerender-chunk',
      sink: 'prerender.html',
      expectedVerdict: 'sanitized',
      artifactTargets: Object.freeze(['core', 'runtime', 'browser'])
    }),
    Object.freeze({
      id: 'error-fallback',
      sink: 'fallback.html',
      expectedVerdict: 'sanitized',
      artifactTargets: Object.freeze(['core', 'runtime', 'browser'])
    })
  ])
});

function cloneJson(value, fallback = null) {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return fallback;
  }
}

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function uniqueList(values) {
  return Array.from(new Set(normalizeArray(values).map((value) => normalizeString(value, '')).filter(Boolean))).sort();
}

function stableSort(value) {
  if (Array.isArray(value)) return value.map((entry) => stableSort(entry));
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = stableSort(value[key]);
    return result;
  }, {});
}

function redactUnsafePayload(value) {
  const text = normalizeString(value, '');
  if (!text) return '';
  return text
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/giu, '[redacted-script]')
    .replace(/<\s*iframe[\s\S]*?<\s*\/\s*iframe\s*>/giu, '[redacted-frame]')
    .replace(/\son[a-z0-9_-]+\s*=\s*(['"]).*?\1/giu, ' [redacted-event]')
    .replace(/\son[a-z0-9_-]+\s*=\s*[^\s>]+/giu, ' [redacted-event]')
    .replace(/javascript\s*:/giu, 'blocked-protocol:')
    .replace(/vbscript\s*:/giu, 'blocked-protocol:')
    .replace(/srcdoc\s*=\s*(['"]).*?\1/giu, 'srcdoc=[redacted]');
}

function summarizeFixture(entry = {}) {
  return {
    id: normalizeString(entry.id, 'fixture'),
    sink: normalizeString(entry.sink, ''),
    attributeName: normalizeString(entry.attributeName, ''),
    propertyName: normalizeString(entry.propertyName, ''),
    expectedVerdict: normalizeString(entry.expectedVerdict, ''),
    expectedDiagnosticCode: normalizeString(entry.expectedDiagnosticCode, ''),
    payloadSummary: redactUnsafePayload(entry.payload)
  };
}

function createKernelSecurityRegressionFixtures(options = {}) {
  const source = options.fixtures && typeof options.fixtures === 'object'
    ? options.fixtures
    : DEFAULT_KERNEL_SECURITY_REGRESSION_FIXTURES;
  const categories = KERNEL_SECURITY_REGRESSION_REQUIRED_CATEGORIES.reduce((result, category) => {
    result[category] = cloneJson(source[category], []);
    return result;
  }, {});
  const totalFixtureCount = KERNEL_SECURITY_REGRESSION_REQUIRED_CATEGORIES.reduce((count, category) => {
    return count + normalizeArray(categories[category]).length;
  }, 0);
  return {
    schema: RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA,
    regressionSchema: RMT_KERNEL_SECURITY_REGRESSION_SCHEMA,
    workpackage: RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE,
    status: 'active-negative-regression-fixtures',
    fixtureCategories: KERNEL_SECURITY_REGRESSION_REQUIRED_CATEGORIES.slice(),
    totalFixtureCount,
    ...categories
  };
}

function validateKernelSecurityRegressionFixtures(fixtures = createKernelSecurityRegressionFixtures()) {
  const fixtureSet = fixtures && typeof fixtures === 'object' ? fixtures : {};
  const issues = [];
  if (fixtureSet.schema !== RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA) {
    issues.push({
      code: 'rmt.kernel.security_regression.fixture_schema_mismatch',
      message: 'Fixture set must use the kernel security regression fixture schema.'
    });
  }
  KERNEL_SECURITY_REGRESSION_REQUIRED_CATEGORIES.forEach((category) => {
    const entries = normalizeArray(fixtureSet[category]);
    if (entries.length === 0) {
      issues.push({
        code: 'rmt.kernel.security_regression.fixture_category_missing',
        category,
        message: `Fixture category ${category} must not be empty.`
      });
    }
    entries.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        issues.push({
          code: 'rmt.kernel.security_regression.fixture_invalid',
          category,
          index,
          message: `Fixture ${category}[${index}] must be an object.`
        });
        return;
      }
      if (!normalizeString(entry.id, '')) {
        issues.push({
          code: 'rmt.kernel.security_regression.fixture_id_missing',
          category,
          index,
          message: `Fixture ${category}[${index}] requires an id.`
        });
      }
      if (category !== 'panicSequences' && category !== 'browserSmokeScenarios' && !normalizeString(entry.payload, '')) {
        issues.push({
          code: 'rmt.kernel.security_regression.fixture_payload_missing',
          category,
          id: normalizeString(entry.id, ''),
          message: `Fixture ${normalizeString(entry.id, category)} requires a payload.`
        });
      }
    });
  });
  return {
    schema: RMT_KERNEL_SECURITY_REGRESSION_REPORT_SCHEMA,
    regressionSchema: RMT_KERNEL_SECURITY_REGRESSION_SCHEMA,
    fixtureSchema: RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA,
    workpackage: RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE,
    ok: issues.length === 0,
    issueCount: issues.length,
    issues
  };
}

function normalizeArtifactRegressionResult(input = {}) {
  const artifact = normalizeString(input.artifact, 'unknown-artifact');
  const sanitizedSinks = uniqueList(input.sanitizedSinks);
  const browserSmokeScenarios = uniqueList(input.browserSmokeScenarios);
  const diagnosticChannels = uniqueList(input.diagnosticChannels);
  return {
    artifact,
    artifactKind: normalizeString(input.artifactKind, artifact.includes('browser') ? 'browser-runtime' : 'core-runtime'),
    unsafeCommitDetected: input.unsafeCommitDetected === true,
    trustVerdictCount: Number.isFinite(input.trustVerdictCount) ? input.trustVerdictCount : 0,
    blockedCommitCount: Number.isFinite(input.blockedCommitCount) ? input.blockedCommitCount : 0,
    panicState: normalizeString(input.panicState, ''),
    panicTrigger: normalizeString(input.panicTrigger, ''),
    recoveryStatus: normalizeString(input.recoveryStatus, ''),
    sanitizedSinks,
    browserSmokeScenarios,
    diagnosticChannels
  };
}

function createKernelSecurityRegressionReport(input = {}) {
  const fixtures = createKernelSecurityRegressionFixtures({ fixtures: input.fixtures });
  const validation = validateKernelSecurityRegressionFixtures(fixtures);
  const artifactResults = normalizeArray(input.artifactResults).map((entry) => normalizeArtifactRegressionResult(entry));
  const browserSmokeResults = normalizeArray(input.browserSmokeResults).map((entry) => ({
    id: normalizeString(entry.id, 'browser-smoke'),
    status: normalizeString(entry.status, 'unknown'),
    scenarioCount: Number.isFinite(entry.scenarioCount) ? entry.scenarioCount : normalizeArray(entry.scenarios).length,
    scenarios: uniqueList(entry.scenarios),
    unsafeCommitDetected: entry.unsafeCommitDetected === true
  }));
  const unsafeCommitCount = artifactResults.filter((entry) => entry.unsafeCommitDetected).length
    + browserSmokeResults.filter((entry) => entry.unsafeCommitDetected).length;
  const requiredArtifactCount = Number.isFinite(input.requiredArtifactCount) ? input.requiredArtifactCount : 0;
  const artifactCoverageOk = requiredArtifactCount <= 0 || artifactResults.length >= requiredArtifactCount;
  const panicRecoveryCovered = input.requirePanicRecovery === true
    ? artifactResults.some((entry) => entry.blockedCommitCount >= 3 && (entry.panicState === 'recovered' || entry.panicState === 'active') && entry.recoveryStatus === 'recovered')
    : true;
  const browserSmokeCovered = input.requireBrowserSmokes === true
    ? browserSmokeResults.some((entry) => entry.status === 'passed' && entry.scenarioCount >= 3)
      || artifactResults.every((entry) => entry.browserSmokeScenarios.length >= 3)
    : true;
  const ok = validation.ok && artifactCoverageOk && panicRecoveryCovered && browserSmokeCovered && unsafeCommitCount === 0;
  const fixtureSummaries = KERNEL_SECURITY_REGRESSION_REQUIRED_CATEGORIES.reduce((result, category) => {
    result[category] = normalizeArray(fixtures[category]).map((entry) => summarizeFixture(entry));
    return result;
  }, {});
  return {
    schema: RMT_KERNEL_SECURITY_REGRESSION_REPORT_SCHEMA,
    regressionSchema: RMT_KERNEL_SECURITY_REGRESSION_SCHEMA,
    fixtureSchema: RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA,
    browserSmokeSchema: RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_SCHEMA,
    trustAuthoritySchema: RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
    trustVerdictSchema: RMT_KERNEL_TRUST_VERDICT_SCHEMA,
    panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    panicStateSchema: RMT_KERNEL_PANIC_STATE_SCHEMA,
    recoverySchema: RMT_KERNEL_RECOVERY_SCHEMA,
    recoveryOutcomeSchema: RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA,
    workpackage: RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE,
    status: ok ? 'passed' : 'failed',
    ok,
    validation,
    fixtureSummary: {
      totalFixtureCount: fixtures.totalFixtureCount,
      categories: fixtures.fixtureCategories.slice(),
      summaries: fixtureSummaries
    },
    artifactCoverageOk,
    requiredArtifactCount,
    artifactResultCount: artifactResults.length,
    browserSmokeCovered,
    panicRecoveryCovered,
    unsafeCommitCount,
    artifactResults,
    browserSmokeResults,
    diagnosticChannel: RMT_KERNEL_SECURITY_REGRESSION_DIAGNOSTIC_CHANNEL
  };
}

function createKernelSecurityRegressionContract(options = {}) {
  const fixtures = createKernelSecurityRegressionFixtures(options);
  return {
    schema: RMT_KERNEL_SECURITY_REGRESSION_SCHEMA,
    fixtureSchema: RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA,
    reportSchema: RMT_KERNEL_SECURITY_REGRESSION_REPORT_SCHEMA,
    browserSmokeSchema: RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_SCHEMA,
    trustAuthoritySchema: RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
    trustVerdictSchema: RMT_KERNEL_TRUST_VERDICT_SCHEMA,
    panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
    panicStateSchema: RMT_KERNEL_PANIC_STATE_SCHEMA,
    recoveryOutcomeSchema: RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA,
    workpackage: RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE,
    status: 'completed-negative-regression-fixtures',
    module: RMT_KERNEL_SECURITY_REGRESSION_MODULE_PATH,
    suite: RMT_KERNEL_SECURITY_REGRESSION_SUITE_PATH,
    fixturePath: RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_PATH,
    browserSmoke: RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_PATH,
    contract: RMT_KERNEL_SECURITY_REGRESSION_CONTRACT_PATH,
    workpackageDocument: RMT_KERNEL_SECURITY_REGRESSION_WP_PATH,
    localGate: RMT_KERNEL_SECURITY_REGRESSION_LOCAL_GATE,
    packageScript: RMT_KERNEL_SECURITY_REGRESSION_PACKAGE_SCRIPT,
    diagnosticChannel: RMT_KERNEL_SECURITY_REGRESSION_DIAGNOSTIC_CHANNEL,
    artifacts: KERNEL_SECURITY_REGRESSION_ARTIFACTS.slice(),
    fixtureCategories: fixtures.fixtureCategories.slice(),
    invariants: [
      'Unsafe HTML, attributes, URLs and properties never commit without a Trust Authority verdict.',
      'Repeated blocked commits activate PanicMonitor threshold semantics.',
      'Recovery fallback markup is sanitized through the same trusted DOM path as normal template output.',
      'Core, runtime and browser artifacts execute the same negative fixture catalog.'
    ],
    handoff: ['RKSH-WP-10', 'RKSH-WP-11']
  };
}

function serializeKernelSecurityRegressionContract(contract) {
  return JSON.stringify(stableSort(contract));
}

function serializeKernelSecurityRegressionReport(report) {
  return JSON.stringify(stableSort(report));
}

module.exports = {
  DEFAULT_KERNEL_SECURITY_REGRESSION_FIXTURES,
  KERNEL_SECURITY_REGRESSION_ARTIFACTS,
  KERNEL_SECURITY_REGRESSION_REQUIRED_CATEGORIES,
  RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_PATH,
  RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_SCHEMA,
  RMT_KERNEL_SECURITY_REGRESSION_CONTRACT_PATH,
  RMT_KERNEL_SECURITY_REGRESSION_DIAGNOSTIC_CHANNEL,
  RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_PATH,
  RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA,
  RMT_KERNEL_SECURITY_REGRESSION_LOCAL_GATE,
  RMT_KERNEL_SECURITY_REGRESSION_MODULE_PATH,
  RMT_KERNEL_SECURITY_REGRESSION_PACKAGE_SCRIPT,
  RMT_KERNEL_SECURITY_REGRESSION_REPORT_SCHEMA,
  RMT_KERNEL_SECURITY_REGRESSION_SCHEMA,
  RMT_KERNEL_SECURITY_REGRESSION_SUITE_PATH,
  RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE,
  RMT_KERNEL_SECURITY_REGRESSION_WP_PATH,
  createKernelSecurityRegressionContract,
  createKernelSecurityRegressionFixtures,
  createKernelSecurityRegressionReport,
  redactUnsafePayload,
  serializeKernelSecurityRegressionContract,
  serializeKernelSecurityRegressionReport,
  validateKernelSecurityRegressionFixtures
};

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
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
  createEnterpriseSurfaceRegistry
} = require('../../tools/rmt-language/vnext-enterprise-registry');
const {
  RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
  RMT_VNEXT_DEGRADATION_SURFACE_SCHEMA,
  createDegradationReport
} = require('../../tools/rmt-language/vnext-degradation');
const {
  REMOTE_SECURITY_CAPABILITY_ESCALATION_CODE,
  REMOTE_SECURITY_CAPABILITY_MODE,
  REMOTE_SECURITY_CSP_MISSING_CODE,
  REMOTE_SECURITY_DEGRADATION_BLOCKED_CODE,
  REMOTE_SECURITY_EVENT_PAYLOAD_MISSING_CODE,
  REMOTE_SECURITY_INTEGRITY_MISSING_CODE,
  REMOTE_SECURITY_ORIGIN_NOT_ALLOWED_CODE,
  REMOTE_SECURITY_SANDBOX_CONFLICT_CODE,
  REMOTE_SECURITY_TRUST_BOUNDARY,
  REMOTE_SECURITY_TRUST_BOUNDARY_MISSING_CODE,
  REMOTE_SECURITY_TRUST_BOUNDARY_UNKNOWN_CODE,
  RMT_VNEXT_REMOTE_SECURITY_CONTRACT_PATH,
  RMT_VNEXT_REMOTE_SECURITY_MODULE_PATH,
  RMT_VNEXT_REMOTE_SECURITY_PACKAGE_SCRIPT,
  RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
  RMT_VNEXT_REMOTE_SECURITY_POSTURE_SCHEMA,
  RMT_VNEXT_REMOTE_SECURITY_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_SECURITY_SUITE_PATH,
  RMT_VNEXT_REMOTE_SECURITY_WORKPACKAGE,
  RMT_VNEXT_REMOTE_SECURITY_WP_PATH,
  createRmtVNextRemoteSecurityAdapter,
  createRmtVNextRemoteSecurityReport,
  serializeRemoteSecurityReport
} = require('../../tools/rmt-language/vnext-remote-security');

const EPIC_16_PATH = 'development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md';
const ENTERPRISE_FIXTURE = 'tests/rmt-language/fixtures/vnext-enterprise-registry-fixture.json';
const LOCAL_SURFACES_FIXTURE = 'tests/rmt-language/fixtures/vnext-surfaces-valid.rmt';
const REMOTE_MANIFEST_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-manifest-valid.json';
const DEGRADATION_FIXTURE = 'tests/rmt-language/fixtures/vnext-degradation-policy-fixture.json';
const REMOTE_SECURITY_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-security-policy-fixture.json';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function diagnosticCodes(result) {
  return (result.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function compileFixture(relativePath, rootDir) {
  return compileRmtVNextSource({
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir)
  });
}

function createEnterpriseRegistryFromFixtures(rootDir) {
  const fixture = readJson(ENTERPRISE_FIXTURE, rootDir);
  const localCompile = compileFixture(LOCAL_SURFACES_FIXTURE, rootDir);
  const remoteManifest = readJson(REMOTE_MANIFEST_FIXTURE, rootDir);
  return createEnterpriseSurfaceRegistry({
    ...fixture,
    coreDocument: localCompile.coreDocument,
    remoteManifests: [remoteManifest]
  });
}

function createDegradationFromRegistry(rootDir, enterpriseRegistry) {
  const fixture = readJson(DEGRADATION_FIXTURE, rootDir);
  return createDegradationReport({
    ...fixture,
    enterpriseRegistry
  });
}

function createSecurityReportFromFixtures(rootDir, overrides = {}) {
  const enterpriseRegistry = overrides.enterpriseRegistry || createEnterpriseRegistryFromFixtures(rootDir);
  const degradationReport = overrides.degradationReport || createDegradationFromRegistry(rootDir, enterpriseRegistry);
  const securityFixture = {
    ...readJson(REMOTE_SECURITY_FIXTURE, rootDir),
    ...overrides.security
  };
  return createRmtVNextRemoteSecurityReport({
    enterpriseRegistry,
    degradationReport,
    ...securityFixture
  });
}

function findPosture(report, name) {
  return report.postures.find((posture) => posture.name === name);
}

function runRmtVNextRemoteSecuritySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-remote-security',
    label: 'Epic 16 RMT vNext Remote Security Policy Contract'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextRemoteSecurity;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_16_PATH, rootDir);
  const contract = readText(RMT_VNEXT_REMOTE_SECURITY_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_VNEXT_REMOTE_SECURITY_WP_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_REMOTE_SECURITY_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_REMOTE_SECURITY_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_REMOTE_SECURITY_MODULE_PATH, rootDir, 'remote security module exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_SECURITY_SUITE_PATH, rootDir, 'remote security suite exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_SECURITY_CONTRACT_PATH, rootDir, 'remote security contract exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_SECURITY_WP_PATH, rootDir, 'WP-E16-05 workpackage document exists');
  assertFileExists(context, REMOTE_SECURITY_FIXTURE, rootDir, 'remote security fixture exists');
  context.assert(moduleSyntax.ok, `remote security module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `remote security suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA, 'package metadata declares remote security policy schema');
  context.assert(metadata && metadata.postureSchema === RMT_VNEXT_REMOTE_SECURITY_POSTURE_SCHEMA, 'package metadata declares remote security posture schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_REMOTE_SECURITY_REPORT_SCHEMA, 'package metadata declares remote security report schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'package metadata declares enterprise registry schema');
  context.assert(metadata && metadata.enterpriseSurfaceSchema === RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA, 'package metadata declares enterprise surface schema');
  context.assert(metadata && metadata.degradationReportSchema === RMT_VNEXT_DEGRADATION_REPORT_SCHEMA, 'package metadata declares degradation report schema');
  context.assert(metadata && metadata.degradationSurfaceSchema === RMT_VNEXT_DEGRADATION_SURFACE_SCHEMA, 'package metadata declares degradation surface schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_REMOTE_SECURITY_WORKPACKAGE, 'package metadata points to WP-E16-05');
  context.assert(metadata && metadata.module === RMT_VNEXT_REMOTE_SECURITY_MODULE_PATH, 'package metadata points to remote security module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_REMOTE_SECURITY_SUITE_PATH, 'package metadata points to remote security suite');
  context.assert(metadata && metadata.contract === RMT_VNEXT_REMOTE_SECURITY_CONTRACT_PATH, 'package metadata points to remote security contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-remote-security --json', 'package metadata declares remote security local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_REMOTE_SECURITY_PACKAGE_SCRIPT, 'package metadata declares remote security package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-remote-security'] === 'string' ? packageManifest.exports['./rmt-language/vnext-remote-security'] : packageManifest.exports['./rmt-language/vnext-remote-security'] && packageManifest.exports['./rmt-language/vnext-remote-security'].default) === './tools/rmt-language/vnext-remote-security.js', 'package exports vNext remote security contract');
  context.assert(packageManifest.scripts['test:rmt-vnext-remote-security'] === 'node scripts/run_xtend_tests.js rmt-vnext-remote-security', 'package exposes vNext remote security script');
  context.assert(runner.hasSuite("rmt-vnext-remote-security"), 'test runner exposes rmt-vnext-remote-security suite');
  context.assert(runner.hasSuite("rmt-vnext-remote-security"), 'runner help references remote security gate');
  context.assert(epic.includes('- Status: `completed / Epic 16 Enterprise MFE Release Handoff accepted`'), 'Epic records current E16 accepted status');
  context.assert(epic.includes('| `WP-E16-05` | P1 | completed | WS2 |'), 'Epic marks WP-E16-05 completed');
  context.assert(epic.includes('| `WP-E16-06` | P1 | completed | WS3 |'), 'Epic marks WP-E16-06 completed');
  context.assert(contract.includes('schema: "xtend.rmt.vnext-remote-security-policy.v1"'), 'contract document declares remote security schema');
  context.assert(workpackage.includes('WP-E16-05` ist abgeschlossen'), 'workpackage records handoff completion');

  const enterpriseRegistry = createEnterpriseRegistryFromFixtures(rootDir);
  const degradationReport = createDegradationFromRegistry(rootDir, enterpriseRegistry);
  context.assert(enterpriseRegistry.ok === true, 'enterprise registry fixture is ready');
  context.assert(degradationReport.status === 'compatible', 'degradation fixture is compatible');
  const report = createSecurityReportFromFixtures(rootDir, { enterpriseRegistry, degradationReport });
  context.assert(report.schema === RMT_VNEXT_REMOTE_SECURITY_REPORT_SCHEMA, 'remote security emits report schema');
  context.assert(report.policySchema === RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA, 'remote security records policy schema');
  context.assert(report.postureSchema === RMT_VNEXT_REMOTE_SECURITY_POSTURE_SCHEMA, 'remote security records posture schema');
  context.assert(report.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'remote security records enterprise registry schema');
  context.assert(report.degradationReportSchema === RMT_VNEXT_DEGRADATION_REPORT_SCHEMA, 'remote security records degradation report schema');
  context.assert(report.ok === true && report.status === 'ready', 'remote security report is ready');
  context.assert(report.remoteSurfaceCount === 1, 'remote security report includes one remote surface');
  context.assert(report.trustBoundary === REMOTE_SECURITY_TRUST_BOUNDARY, 'remote security uses remote trust boundary');
  context.assert(report.capabilityMode === REMOTE_SECURITY_CAPABILITY_MODE, 'remote security uses deny-by-default');
  const checkout = findPosture(report, 'checkout.cart');
  context.assert(checkout && checkout.schema === RMT_VNEXT_REMOTE_SECURITY_POSTURE_SCHEMA, 'checkout emits remote security posture schema');
  context.assert(checkout && checkout.status === 'ready', 'checkout remote security posture is ready');
  context.assert(checkout && checkout.remote.origin === 'https://cdn.xtend.example', 'checkout records origin');
  context.assert(checkout && checkout.remote.trustBoundary === REMOTE_SECURITY_TRUST_BOUNDARY, 'checkout records trust boundary');
  context.assert(checkout && checkout.remote.integrity.algorithm === 'sha256', 'checkout records manifest integrity');
  context.assert(checkout && checkout.csp.requireTrustedTypes === true, 'checkout requires trusted types');
  context.assert(checkout && checkout.sandbox.allowScripts === false && checkout.sandbox.allowSameOrigin === false, 'checkout sandbox blocks scripts and same-origin');
  context.assert(checkout && checkout.kernelBoundary.remoteRuntimeExecution === false, 'checkout does not execute remote runtime in kernel');

  const serialized = serializeRemoteSecurityReport(report);
  const repeat = serializeRemoteSecurityReport(createSecurityReportFromFixtures(rootDir, { enterpriseRegistry, degradationReport }));
  context.assert(serialized === repeat, 'remote security report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === RMT_VNEXT_REMOTE_SECURITY_REPORT_SCHEMA, 'serialized remote security report is parseable JSON');

  const disallowedOriginReport = createSecurityReportFromFixtures(rootDir, {
    security: {
      policies: {
        'checkout.cart': {
          ...readJson(REMOTE_SECURITY_FIXTURE, rootDir).policies['checkout.cart'],
          allowedOrigins: ['https://evil.example']
        }
      }
    }
  });
  context.assert(disallowedOriginReport.ok === false, 'disallowed origin blocks remote security');
  context.assert(diagnosticCodes(disallowedOriginReport).includes(REMOTE_SECURITY_ORIGIN_NOT_ALLOWED_CODE), 'disallowed origin diagnostic is emitted');

  const omittedAllowlistsReport = createSecurityReportFromFixtures(rootDir, {
    security: {
      policies: {
        'checkout.cart': {
          trustBoundary: REMOTE_SECURITY_TRUST_BOUNDARY,
          allowedIntegrityAlgorithms: ['sha256'],
          capabilityMode: REMOTE_SECURITY_CAPABILITY_MODE,
          csp: {
            requireTrustedTypes: true,
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"]
          },
          sandbox: {}
        }
      }
    }
  });
  context.assert(omittedAllowlistsReport.ok === false, 'omitted origin and capability allowlists block remote security');
  context.assert(diagnosticCodes(omittedAllowlistsReport).includes(REMOTE_SECURITY_ORIGIN_NOT_ALLOWED_CODE), 'omitted origin allowlist diagnostic is emitted');
  context.assert(diagnosticCodes(omittedAllowlistsReport).includes(REMOTE_SECURITY_CAPABILITY_ESCALATION_CODE), 'omitted capability allowlist diagnostic is emitted');
  context.assert(diagnosticCodes(omittedAllowlistsReport).includes(REMOTE_SECURITY_CSP_MISSING_CODE), 'omitted CSP connect-src allowlist diagnostic is emitted');

  const missingIntegrityRegistry = cloneJson(enterpriseRegistry);
  missingIntegrityRegistry.surfaces.find((surface) => surface.name === 'checkout.cart').remote.integrity = null;
  const missingIntegrityReport = createSecurityReportFromFixtures(rootDir, { enterpriseRegistry: missingIntegrityRegistry });
  context.assert(missingIntegrityReport.ok === false, 'missing integrity blocks remote security');
  context.assert(diagnosticCodes(missingIntegrityReport).includes(REMOTE_SECURITY_INTEGRITY_MISSING_CODE), 'missing integrity diagnostic is emitted');

  const missingTrustRegistry = cloneJson(enterpriseRegistry);
  missingTrustRegistry.surfaces.find((surface) => surface.name === 'checkout.cart').remote.trustBoundary = null;
  const missingTrustReport = createSecurityReportFromFixtures(rootDir, { enterpriseRegistry: missingTrustRegistry });
  context.assert(missingTrustReport.ok === false, 'missing trust boundary blocks remote security');
  context.assert(diagnosticCodes(missingTrustReport).includes(REMOTE_SECURITY_TRUST_BOUNDARY_MISSING_CODE), 'missing trust boundary diagnostic is emitted');

  const unknownTrustRegistry = cloneJson(enterpriseRegistry);
  unknownTrustRegistry.surfaces.find((surface) => surface.name === 'checkout.cart').remote.trustBoundary = 'xtend.security.other.v1';
  const unknownTrustReport = createSecurityReportFromFixtures(rootDir, { enterpriseRegistry: unknownTrustRegistry });
  context.assert(unknownTrustReport.ok === false, 'unknown trust boundary blocks remote security');
  context.assert(diagnosticCodes(unknownTrustReport).includes(REMOTE_SECURITY_TRUST_BOUNDARY_UNKNOWN_CODE), 'unknown trust boundary diagnostic is emitted');

  const cspReport = createSecurityReportFromFixtures(rootDir, {
    security: {
      policies: {
        'checkout.cart': {
          ...readJson(REMOTE_SECURITY_FIXTURE, rootDir).policies['checkout.cart'],
          csp: {
            requireTrustedTypes: false,
            objectSrc: ["'self'"]
          }
        }
      }
    }
  });
  context.assert(cspReport.ok === false, 'weak CSP blocks remote security');
  context.assert(diagnosticCodes(cspReport).includes(REMOTE_SECURITY_CSP_MISSING_CODE), 'weak CSP diagnostic is emitted');

  const cspConnectReport = createSecurityReportFromFixtures(rootDir, {
    security: {
      policies: {
        'checkout.cart': {
          ...readJson(REMOTE_SECURITY_FIXTURE, rootDir).policies['checkout.cart'],
          csp: {
            requireTrustedTypes: true,
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"]
          }
        }
      }
    }
  });
  context.assert(cspConnectReport.ok === false, 'CSP without remote origin blocks remote security');
  context.assert(diagnosticCodes(cspConnectReport).includes(REMOTE_SECURITY_CSP_MISSING_CODE), 'CSP remote origin diagnostic is emitted');

  const sandboxReport = createSecurityReportFromFixtures(rootDir, {
    security: {
      policies: {
        'checkout.cart': {
          ...readJson(REMOTE_SECURITY_FIXTURE, rootDir).policies['checkout.cart'],
          sandbox: {
            allowScripts: true
          }
        }
      }
    }
  });
  context.assert(sandboxReport.ok === false, 'weak sandbox blocks remote security');
  context.assert(diagnosticCodes(sandboxReport).includes(REMOTE_SECURITY_SANDBOX_CONFLICT_CODE), 'weak sandbox diagnostic is emitted');

  const capabilityReport = createSecurityReportFromFixtures(rootDir, {
    security: {
      policies: {
        'checkout.cart': {
          ...readJson(REMOTE_SECURITY_FIXTURE, rootDir).policies['checkout.cart'],
          allowedCapabilities: ['surface.mount']
        }
      }
    }
  });
  context.assert(capabilityReport.ok === false, 'capability escalation blocks remote security');
  context.assert(diagnosticCodes(capabilityReport).includes(REMOTE_SECURITY_CAPABILITY_ESCALATION_CODE), 'capability escalation diagnostic is emitted');

  const missingPayloadRegistry = cloneJson(enterpriseRegistry);
  delete missingPayloadRegistry.surfaces.find((surface) => surface.name === 'checkout.cart').events.emits[0].payload;
  const missingPayloadReport = createSecurityReportFromFixtures(rootDir, { enterpriseRegistry: missingPayloadRegistry });
  context.assert(missingPayloadReport.ok === false, 'missing remote event payload blocks remote security');
  context.assert(diagnosticCodes(missingPayloadReport).includes(REMOTE_SECURITY_EVENT_PAYLOAD_MISSING_CODE), 'missing event payload diagnostic is emitted');

  const blockedDegradation = cloneJson(degradationReport);
  blockedDegradation.surfaces.find((surface) => surface.name === 'checkout.cart').state = 'blocked';
  const blockedDegradationReport = createSecurityReportFromFixtures(rootDir, { enterpriseRegistry, degradationReport: blockedDegradation });
  context.assert(blockedDegradationReport.ok === false, 'blocked degradation blocks remote security');
  context.assert(diagnosticCodes(blockedDegradationReport).includes(REMOTE_SECURITY_DEGRADATION_BLOCKED_CODE), 'blocked degradation diagnostic is emitted');

  const adapter = createRmtVNextRemoteSecurityAdapter();
  context.assert(adapter.schema === RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA, 'adapter exposes remote security policy schema');
  context.assert(adapter.reportSchema === RMT_VNEXT_REMOTE_SECURITY_REPORT_SCHEMA, 'adapter exposes remote security report schema');
  context.assert(adapter.postureSchema === RMT_VNEXT_REMOTE_SECURITY_POSTURE_SCHEMA, 'adapter exposes remote security posture schema');
  context.assert(adapter.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'adapter exposes enterprise registry schema');
  context.assert(adapter.degradationReportSchema === RMT_VNEXT_DEGRADATION_REPORT_SCHEMA, 'adapter exposes degradation report schema');
  context.assert(adapter.createReport({
    enterpriseRegistry,
    degradationReport,
    ...readJson(REMOTE_SECURITY_FIXTURE, rootDir)
  }).ok === true, 'adapter creates remote security report');

  return context.result({
    schema: RMT_VNEXT_REMOTE_SECURITY_REPORT_SCHEMA,
    policySchema: RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
    postureSchema: RMT_VNEXT_REMOTE_SECURITY_POSTURE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_SECURITY_WORKPACKAGE,
    module: RMT_VNEXT_REMOTE_SECURITY_MODULE_PATH,
    suite: RMT_VNEXT_REMOTE_SECURITY_SUITE_PATH,
    remoteSurfaceCount: report.remoteSurfaceCount
  });
}

function printRmtVNextRemoteSecurityReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 16 RMT vNext Remote Security Policy Contract erfolgreich.',
    failureTitle: 'Epic 16 RMT vNext Remote Security Policy Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextRemoteSecurityReport,
  runRmtVNextRemoteSecuritySuite
};

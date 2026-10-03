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
  COMMAND_ARTIFACTS,
  DEFERRAL_REASONS,
  EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CONTRACT,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_DOCS,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_LOCAL_GATE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_MODULE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_PACKAGE_SCRIPT,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STATUS,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STEERING,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SUITE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_TARGET,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE_DOC,
  EVIDENCE_STATUSES,
  PUBLISH_BOUNDARY,
  REQUIRED_ARTIFACTS,
  REQUIRED_DOCS,
  REQUIRED_SOURCE_SCHEMAS,
  createEpic13ConditionalNetworkEvidencePlan,
  createEpic13ConditionalNetworkEvidenceReport,
  validateEpic13ConditionalNetworkEvidencePlan
} = require('../../catalog/epic13-conditional-network-evidence');
const {
  CONDITIONAL_NETWORK_COMMANDS
} = require('../../catalog/epic12-rc0-gate-matrix');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function runEpic13ConditionalNetworkEvidenceSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-conditional-network-evidence',
    label: 'Epic 13 Conditional Network Evidence'
  });
  const plan = createEpic13ConditionalNetworkEvidencePlan({ rootDir });
  const validation = validateEpic13ConditionalNetworkEvidencePlan(plan);
  const report = createEpic13ConditionalNetworkEvidenceReport({ rootDir, plan });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13ConditionalNetworkEvidence;
  const ownerMetadata = packageManifest.xtend && packageManifest.xtend.epic13ReleaseOwnerAcceptance;
  const rc1Metadata = packageManifest.xtend && packageManifest.xtend.epic13Rc1Readiness;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const steering = readText(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STEERING, rootDir);
  const contractDoc = readText(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_DOCS, rootDir);
  const ownerDocs = readText('development/docs-evidence/legacy-routes/en/release-owner-acceptance.md', rootDir);
  const rc1Docs = readText('development/docs-evidence/legacy-routes/en/rc1-readiness.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const enterpriseAdoption = readText('docs/enterprise-adoption.md', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const readme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SUITE, { rootDir, extension: '.js' });

  [
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_MODULE,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SUITE,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STEERING,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CONTRACT,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE_DOC,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required network evidence doc`);
  });

  context.assert(moduleSyntax.ok, `Epic 13 Conditional Network Evidence module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 13 Conditional Network Evidence suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA, 'Network evidence exposes stable schema');
  context.assert(plan.reportSchema === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA, 'Network evidence exposes report schema');
  context.assert(plan.deferralSchema === EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA, 'Network evidence exposes deferral schema');
  context.assert(plan.workpackage === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE, 'Network evidence belongs to WP-E13-03');
  context.assert(plan.status === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STATUS, 'Network evidence contract is accepted');
  context.assert(plan.targetReadiness === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_TARGET, 'Network evidence target is ready');
  context.assert(plan.sourceValidationOk === true && plan.sourceReportOk === true, 'Network evidence consumes accepted owner contract');
  context.assert(plan.rc0GateMatrixOk === true, 'Network evidence consumes valid RC0 gate matrix');
  context.assert(plan.localDefaultMode === 'defer-with-owner-reason', 'Network evidence defaults to structured local deferral');
  context.assert(plan.externalNetworkAllowedInLocalGate === false, 'Network evidence local gate does not require network');
  context.assert(plan.ownerDeferralAllowed === true, 'Network evidence permits owner deferral');
  context.assert(plan.ownerDeferralRequiredWhenNotExecuted === true, 'Network evidence requires deferral when not executed');
  context.assert(plan.publishRequiresExecutedOrOwnerAcceptedDeferral === true, 'Network evidence blocks publish until executed or owner-accepted');
  context.assert(plan.nextWorkpackage === 'WP-E13-13', 'Network evidence hands off to WP-E13-09 after visual owner artifact normalization');
  context.assert(plan.nextDecision === 'rc1-gate-matrix-ci-handoff', 'Network evidence hands off to RMT-first production readiness bundling');
  context.assert(plan.publishBoundary === PUBLISH_BOUNDARY, 'Network evidence keeps publish boundary');
  context.assert(plan.publishAllowed === false, 'Network evidence keeps publish blocked');
  context.assert(validation.schema === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA, 'Network evidence validator emits report schema');
  context.assert(validation.ok === true, 'Network evidence plan validates');
  context.assert(report.ok === true, 'Network evidence report validates');
  context.assert(report.commandCount === CONDITIONAL_NETWORK_COMMANDS.length, 'Network evidence report counts conditional commands');
  context.assert(report.evidenceSummary.deferred.length === COMMAND_ARTIFACTS.length, 'Network evidence default report defers all network commands');
  assertIncludesAll(context, plan.commands, CONDITIONAL_NETWORK_COMMANDS, 'Conditional network commands');
  assertIncludesAll(context, plan.allowedEvidenceStatuses, EVIDENCE_STATUSES, 'Evidence statuses');
  assertIncludesAll(context, plan.allowedDeferralReasons, DEFERRAL_REASONS, 'Deferral reasons');
  assertIncludesAll(context, plan.requiredArtifacts, REQUIRED_ARTIFACTS, 'Required artifacts');
  assertIncludesAll(context, plan.requiredSourceSchemas, REQUIRED_SOURCE_SCHEMAS, 'Source schemas');
  context.assert(plan.evidenceRecords.every((record) => record.schema === EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA), 'All evidence records use deferral schema');
  context.assert(plan.evidenceRecords.every((record) => record.localGateBlocking === false), 'No evidence record blocks local gate');
  context.assert(plan.evidenceRecords.every((record) => record.publishBlocking === true), 'Every evidence record blocks publish until accepted');

  context.assert(packageManifest.private === false, 'Package is public-ready for network evidence');
  context.assert((packageManifest.exports['./catalog/epic13-conditional-network-evidence'] === './catalog/epic13-conditional-network-evidence.js' || (packageManifest.exports['./catalog/epic13-conditional-network-evidence'] && packageManifest.exports['./catalog/epic13-conditional-network-evidence'].default === './catalog/epic13-conditional-network-evidence.js')), 'Package exports network evidence module');
  context.assert(packageManifest.scripts['test:epic13-conditional-network-evidence'] === 'node scripts/run_xtend_tests.js epic13-conditional-network-evidence', 'Package exposes network evidence script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_PACKAGE_SCRIPT), 'Package release gates include network evidence script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_PACKAGE_SCRIPT), 'Release checklist metadata includes network evidence script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CONTRACT), 'Artifact checklist includes network evidence contract');
  context.assert(metadata && metadata.schema === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA, 'Package metadata exposes network evidence schema');
  context.assert(metadata && metadata.workpackage === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE, 'Package metadata exposes WP-E13-03');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-E13-13', 'Package metadata exposes next workpackage');
  context.assert(metadata && metadata.externalNetworkAllowedInLocalGate === false, 'Package metadata keeps local network gate optional');
  context.assert(ownerMetadata && ownerMetadata.nextWorkpackage === 'WP-E13-13', 'Owner acceptance metadata now hands off to WP-E13-09');
  context.assert(rc1Metadata && rc1Metadata.nextWorkpackage === 'WP-E13-13', 'RC1 readiness metadata now hands off to WP-E13-09');
  context.assertIncludes(scaffoldConfig, 'epic13ConditionalNetworkEvidence', 'Scaffold config exposes network evidence metadata');
  context.assertIncludes(scaffoldConfig, EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA, 'Scaffold config declares network evidence schema');
  context.assertIncludes(scaffoldConfig, EPIC13_CONDITIONAL_NETWORK_EVIDENCE_LOCAL_GATE, 'Scaffold config references network evidence gate');
  context.assertIncludes(scaffoldConfig, 'nextWorkpackage: "WP-E13-13"', 'Scaffold config advances Epic 13 handoff');
  context.assert(runner.hasSuite("epic13-conditional-network-evidence"), 'Runner registers network evidence suite');

  assertTextIncludesAll(context, steering, [
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA,
    '| `WP-E13-03` | P0 | completed | WS1 | Conditional Network Gate Evidence vorbereiten |',
    '| `WP-E13-04` | P0 | completed | WS1 | Package Dry Run Artefakt und Export-Surface-Lock bauen |',
    '| `WP-E13-05` | P0 | completed | WS2 | RC0 Known Residuals fuer RC1 triagieren |',
    '| `WP-E13-06` | P0 | completed | WS2 | Hydration Performance Warning schliessen oder RC1 Owner-Entscheid bauen |',
    '| `WP-E13-07` | P1 | completed | WS3 | PROD-nahe Browser-, Local-Server- und CSP-Smokes vorbereiten |',
    '| `WP-E13-08` | P1 | completed | WS3 | Visual Screenshot/Pixels als RC1-Artefakt normalisieren |',
    '| `WP-E13-09` | P1 | completed | WS4 | RMT-first App Production Readiness Gate buendeln |',
    'Handoff nach WP-E13-03',
    'Offline-/Sandbox-Laeufe'
  ], 'Epic 13 steering document');
  assertTextIncludesAll(context, contractDoc, [
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA,
    EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_LOCAL_GATE,
    'npm audit --audit-level=moderate',
    'npm sbom --sbom-format=cyclonedx --json',
    '.xtend-test-results/xtend-npm-audit-report.json',
    'WP-E13-09'
  ], 'Network evidence contract doc');
  assertTextIncludesAll(context, workpackage, [
    'xtend.epic13.wp03.conditional-network-evidence.v1',
    'Status: `completed`',
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_LOCAL_GATE,
    'WP-E13-09'
  ], 'WP-E13-03 workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_LOCAL_GATE,
    'npm audit --audit-level=moderate',
    'npm sbom --sbom-format=cyclonedx --json',
    'network-restricted-local-default',
    PUBLISH_BOUNDARY
  ], 'Network evidence docs');
  assertTextIncludesAll(context, ownerDocs, [
    'xtend.epic13.conditional-network-evidence.v1',
    'WP-E13-09',
    './package-export-lock.md'
  ], 'Owner acceptance docs handoff');
  assertTextIncludesAll(context, rc1Docs, [
    'Conditional Network Evidence',
    'WP-E13-09',
    './package-export-lock.md'
  ], 'RC1 readiness docs handoff');
  assertTextIncludesAll(context, registry, [
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_MODULE,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CONTRACT,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_DOCS,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SUITE,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_LOCAL_GATE
  ], 'Reference registry');
  assertTextIncludesAll(context, releaseChecklist, [
    'npm run test:epic13-conditional-network-evidence',
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CONTRACT,
    '.xtend-test-results/xtend-conditional-network-evidence-report.json'
  ], 'Release checklist');
  assertTextIncludesAll(context, ciMatrix, [
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_LOCAL_GATE,
    'Conditional Network Evidence'
  ], 'CI gate matrix');
  assertTextIncludesAll(context, enterpriseAdoption, [
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA,
    './conditional-network-evidence.md',
    'network-restricted-local-default'
  ], 'Enterprise adoption docs');
  context.assertIncludes(docsReadme, './conditional-network-evidence.md', 'Docs README links network evidence');
  context.assertIncludes(docsMenu, 'conditional-network-evidence', 'Docs menu exposes network evidence');
  context.assertIncludes(testsReadme, EPIC13_CONDITIONAL_NETWORK_EVIDENCE_LOCAL_GATE, 'Tests README documents network evidence gate');
  context.assertIncludes(readme, 'xtend.epic13ConditionalNetworkEvidence', 'Root README documents network evidence metadata');
  context.assertIncludes(changelog, EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA, 'Changelog records network evidence contract');

  return context.result({
    report: {
      schema: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA,
      commandCount: report.commandCount,
      evidenceSummary: report.evidenceSummary,
      requiredArtifactCount: report.requiredArtifactCount,
      publishAllowed: report.publishAllowed,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13ConditionalNetworkEvidenceReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 13 Conditional Network Evidence erfolgreich.',
    failureTitle: 'Epic 13 Conditional Network Evidence fehlgeschlagen:'
  });
}

module.exports = {
  printEpic13ConditionalNetworkEvidenceReport,
  runEpic13ConditionalNetworkEvidenceSuite
};

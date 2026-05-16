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
  EPIC13_RELEASE_OWNER_ACCEPTANCE_CONTRACT,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_DOCS,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_LOCAL_GATE,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_MODULE,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_PACKAGE_SCRIPT,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_STATUS,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_STEERING,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_SUITE,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_TARGET,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE,
  EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE_DOC,
  OWNER_DECISION_STATES,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_LOCAL_GATES,
  REQUIRED_OWNER_INPUTS,
  REQUIRED_SOURCE_SCHEMAS,
  createEpic13ReleaseOwnerAcceptanceContract,
  createEpic13ReleaseOwnerAcceptanceReport,
  validateEpic13ReleaseOwnerAcceptanceContract
} = require('../../catalog/epic13-release-owner-acceptance');
const {
  EPIC13_RC1_READINESS_SCHEMA
} = require('../../catalog/epic13-rc1-readiness');

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

function runEpic13ReleaseOwnerAcceptanceSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-release-owner-acceptance',
    label: 'Epic 13 Release Owner Acceptance'
  });
  const contract = createEpic13ReleaseOwnerAcceptanceContract({ rootDir });
  const validation = validateEpic13ReleaseOwnerAcceptanceContract(contract);
  const report = createEpic13ReleaseOwnerAcceptanceReport({ rootDir, contract });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13ReleaseOwnerAcceptance;
  const rc1Metadata = packageManifest.xtend && packageManifest.xtend.epic13Rc1Readiness;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const steering = readText(EPIC13_RELEASE_OWNER_ACCEPTANCE_STEERING, rootDir);
  const contractDoc = readText(EPIC13_RELEASE_OWNER_ACCEPTANCE_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_RELEASE_OWNER_ACCEPTANCE_DOCS, rootDir);
  const rc1Docs = readText('docs/rc1-readiness.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const enterpriseAdoption = readText('docs/enterprise-adoption.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const readme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_RELEASE_OWNER_ACCEPTANCE_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_RELEASE_OWNER_ACCEPTANCE_SUITE, { rootDir, extension: '.js' });

  [
    EPIC13_RELEASE_OWNER_ACCEPTANCE_MODULE,
    EPIC13_RELEASE_OWNER_ACCEPTANCE_SUITE,
    EPIC13_RELEASE_OWNER_ACCEPTANCE_STEERING,
    EPIC13_RELEASE_OWNER_ACCEPTANCE_CONTRACT,
    EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE_DOC,
    EPIC13_RELEASE_OWNER_ACCEPTANCE_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required owner acceptance doc`);
  });

  context.assert(moduleSyntax.ok, `Epic 13 Release Owner Acceptance module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 13 Release Owner Acceptance suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(contract.schema === EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA, 'Owner acceptance exposes stable schema');
  context.assert(contract.reportSchema === EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA, 'Owner acceptance exposes report schema');
  context.assert(contract.workpackage === EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE, 'Owner acceptance belongs to WP-E13-02');
  context.assert(contract.status === EPIC13_RELEASE_OWNER_ACCEPTANCE_STATUS, 'Owner acceptance contract is accepted');
  context.assert(contract.sourceSchema === EPIC13_RC1_READINESS_SCHEMA, 'Owner acceptance consumes RC1 readiness schema');
  context.assert(contract.targetReadiness === EPIC13_RELEASE_OWNER_ACCEPTANCE_TARGET, 'Owner acceptance target is contract-ready');
  context.assert(contract.nextWorkpackage === 'WP-E13-13', 'Owner acceptance makes WP-E13-09 ready after visual owner artifact normalization');
  context.assert(contract.nextDecision === 'rc1-gate-matrix-ci-handoff', 'Owner acceptance hands off to RMT-first production readiness bundling');
  context.assert(contract.publishBoundary === PUBLISH_BOUNDARY, 'Owner acceptance keeps publish boundary');
  context.assert(contract.publishAllowed === false, 'Owner acceptance keeps publish blocked');
  context.assert(contract.automaticPublishApproval === false, 'Owner acceptance rejects automatic publish approval');
  context.assert(contract.packagePrivateRequired === true, 'Owner acceptance requires private package');
  context.assert(validation.schema === EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA, 'Owner acceptance validator emits report schema');
  context.assert(validation.ok === true, 'Owner acceptance contract validates');
  context.assert(report.ok === true, 'Owner acceptance report validates');
  context.assert(report.checklistCount === contract.reviewChecklist.length, 'Owner acceptance report counts checklist items');
  context.assert(report.decisionSummary.accepted >= 5, 'Owner acceptance accepts RC1 baseline items');
  context.assert(report.decisionSummary.accepted >= 7, 'Owner acceptance accepts package export lock after WP-E13-04');
  context.assert(report.decisionSummary.accepted >= 9, 'Owner acceptance accepts visual owner artifact after WP-E13-08');
  context.assert(report.decisionSummary.deferred >= 1, 'Owner acceptance defers remaining hardening items');
  context.assert(report.decisionSummary.blocked >= 1, 'Owner acceptance blocks automatic publish');
  assertIncludesAll(context, contract.ownerDecisionStates, OWNER_DECISION_STATES, 'Owner decision states');
  assertIncludesAll(context, contract.requiredOwnerInputs, REQUIRED_OWNER_INPUTS, 'Owner inputs');
  assertIncludesAll(context, contract.requiredLocalGates, REQUIRED_LOCAL_GATES, 'Local gates');
  assertIncludesAll(context, contract.requiredSourceSchemas, REQUIRED_SOURCE_SCHEMAS, 'Source schemas');
  context.assert(contract.reviewChecklist.some((entry) => entry.id === 'automatic-publish-approval' && entry.status === 'blocked'), 'Automatic publish approval is blocked');
  context.assert(contract.reviewChecklist.some((entry) => entry.id === 'conditional-network-evidence' && entry.status === 'accepted' && entry.evidence === 'xtend.epic13.conditional-network-evidence.v1'), 'Network evidence is accepted after WP-E13-03');
  context.assert(contract.reviewChecklist.some((entry) => entry.id === 'package-dry-run-export-lock' && entry.status === 'accepted' && entry.evidence === 'xtend.epic13.package-export-lock.v1'), 'Package export lock is accepted after WP-E13-04');
  context.assert(contract.reviewChecklist.some((entry) => (
    entry.id === 'known-residual-renewal'
      && entry.status === 'accepted'
      && entry.evidence.includes('xtend.epic13.known-residual-triage.v1')
      && entry.evidence.includes('xtend.epic13.hydration-performance-closure.v1')
  )), 'Known residual triage is accepted after WP-E13-05 and closed after WP-E13-06');
  context.assert(contract.reviewChecklist.some((entry) => entry.id === 'visual-owner-artifact' && entry.status === 'accepted' && entry.evidence === 'xtend.epic13.visual-owner-artifact.v1'), 'Visual owner artifact is accepted after WP-E13-08');
  context.assert(contract.reviewChecklist.some((entry) => entry.id === 'rc1-migration-notes' && entry.status === 'accepted' && entry.evidence === 'xtend.epic13.rc1-migration-notes-semver.v1'), 'RC1 migration notes are accepted after WP-E13-12');
  context.assert(contract.reviewChecklist.every((entry) => OWNER_DECISION_STATES.includes(entry.status)), 'All owner checklist statuses are allowed');

  context.assert(packageManifest.private === false, 'Package is public-ready after owner publish prep');
  context.assert((packageManifest.exports['./catalog/epic13-release-owner-acceptance'] === './catalog/epic13-release-owner-acceptance.js' || (packageManifest.exports['./catalog/epic13-release-owner-acceptance'] && packageManifest.exports['./catalog/epic13-release-owner-acceptance'].default === './catalog/epic13-release-owner-acceptance.js')), 'Package exports owner acceptance module');
  context.assert(packageManifest.scripts['test:epic13-release-owner-acceptance'] === 'node scripts/run_xtend_tests.js epic13-release-owner-acceptance', 'Package exposes owner acceptance script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC13_RELEASE_OWNER_ACCEPTANCE_PACKAGE_SCRIPT), 'Package release gates include owner acceptance script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_RELEASE_OWNER_ACCEPTANCE_PACKAGE_SCRIPT), 'Release checklist metadata includes owner acceptance script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_RELEASE_OWNER_ACCEPTANCE_CONTRACT), 'Artifact checklist includes owner acceptance contract');
  context.assert(metadata && metadata.schema === EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA, 'Package metadata exposes owner acceptance schema');
  context.assert(metadata && metadata.workpackage === EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE, 'Package metadata exposes WP-E13-02');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-E13-13', 'Package metadata exposes next workpackage');
  context.assert(metadata && metadata.publishAllowed === false, 'Package metadata blocks owner acceptance publish');
  context.assert(metadata && metadata.automaticPublishApproval === false, 'Package metadata blocks automatic publish');
  context.assert(rc1Metadata && rc1Metadata.nextWorkpackage === 'WP-E13-13', 'RC1 readiness metadata now hands off to WP-E13-09');
  context.assertIncludes(scaffoldConfig, 'epic13ReleaseOwnerAcceptance', 'Scaffold config exposes owner acceptance metadata');
  context.assertIncludes(scaffoldConfig, EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA, 'Scaffold config declares owner acceptance schema');
  context.assertIncludes(scaffoldConfig, EPIC13_RELEASE_OWNER_ACCEPTANCE_LOCAL_GATE, 'Scaffold config references owner acceptance local gate');
  context.assertIncludes(scaffoldConfig, 'nextWorkpackage: "WP-E13-13"', 'Scaffold config advances Epic 13 handoff');
  context.assertIncludes(runner, "id: 'epic13-release-owner-acceptance'", 'Runner registers owner acceptance suite');

  assertTextIncludesAll(context, steering, [
    EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA,
    '| `WP-E13-02` | P0 | completed | WS0 | Release Owner Acceptance Contract definieren |',
    '| `WP-E13-03` | P0 | completed | WS1 | Conditional Network Gate Evidence vorbereiten |',
    '| `WP-E13-04` | P0 | completed | WS1 | Package Dry Run Artefakt und Export-Surface-Lock bauen |',
    '| `WP-E13-05` | P0 | completed | WS2 | RC0 Known Residuals fuer RC1 triagieren |',
    '| `WP-E13-06` | P0 | completed | WS2 | Hydration Performance Warning schliessen oder RC1 Owner-Entscheid bauen |',
    '| `WP-E13-07` | P1 | completed | WS3 | PROD-nahe Browser-, Local-Server- und CSP-Smokes vorbereiten |',
    '| `WP-E13-08` | P1 | completed | WS3 | Visual Screenshot/Pixels als RC1-Artefakt normalisieren |',
    '| `WP-E13-09` | P1 | completed | WS4 | RMT-first App Production Readiness Gate buendeln |',
    'Handoff nach WP-E13-02',
    'keine automatische Publish-Freigabe'
  ], 'Epic 13 steering document');
  assertTextIncludesAll(context, contractDoc, [
    EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA,
    EPIC13_RELEASE_OWNER_ACCEPTANCE_LOCAL_GATE,
    'accepted',
    'deferred',
    'blocked',
    'automatic-publish-approval',
    'WP-E13-09'
  ], 'Owner acceptance contract doc');
  assertTextIncludesAll(context, workpackage, [
    'xtend.epic13.wp02.release-owner-acceptance.v1',
    'Status: `completed`',
    EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA,
    EPIC13_RELEASE_OWNER_ACCEPTANCE_LOCAL_GATE,
    'WP-E13-09'
  ], 'WP-E13-02 workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA,
    EPIC13_RELEASE_OWNER_ACCEPTANCE_LOCAL_GATE,
    'xtend.epic13.prod-browser-csp-smoke.v1',
    'Release Owner Acceptance',
    'accepted',
    'deferred',
    'blocked',
    './prod-browser-csp-smokes.md',
    PUBLISH_BOUNDARY
  ], 'Owner acceptance docs');
  assertTextIncludesAll(context, rc1Docs, [
    'Release Owner Acceptance',
    'WP-E13-03',
    './release-owner-acceptance.md'
  ], 'RC1 readiness docs handoff');
  assertTextIncludesAll(context, registry, [
    EPIC13_RELEASE_OWNER_ACCEPTANCE_MODULE,
    EPIC13_RELEASE_OWNER_ACCEPTANCE_CONTRACT,
    EPIC13_RELEASE_OWNER_ACCEPTANCE_DOCS,
    EPIC13_RELEASE_OWNER_ACCEPTANCE_SUITE,
    EPIC13_RELEASE_OWNER_ACCEPTANCE_LOCAL_GATE
  ], 'Reference registry');
  assertTextIncludesAll(context, releaseChecklist, [
    'npm run test:epic13-release-owner-acceptance',
    EPIC13_RELEASE_OWNER_ACCEPTANCE_CONTRACT,
    'Epic 13 Release Owner Acceptance'
  ], 'Release checklist');
  assertTextIncludesAll(context, ciMatrix, [
    EPIC13_RELEASE_OWNER_ACCEPTANCE_LOCAL_GATE,
    'Release Owner Acceptance'
  ], 'CI gate matrix');
  assertTextIncludesAll(context, enterpriseAdoption, [
    EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA,
    './release-owner-acceptance.md',
    'automatic-publish-approval'
  ], 'Enterprise adoption docs');
  context.assertIncludes(docsReadme, './release-owner-acceptance.md', 'Docs README links owner acceptance');
  context.assertIncludes(docsMenu, 'release-owner-acceptance', 'Docs menu exposes owner acceptance');
  context.assertIncludes(testsReadme, EPIC13_RELEASE_OWNER_ACCEPTANCE_LOCAL_GATE, 'Tests README documents owner acceptance gate');
  context.assertIncludes(readme, 'xtend.epic13ReleaseOwnerAcceptance', 'Root README documents owner acceptance metadata');
  context.assertIncludes(changelog, EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA, 'Changelog records owner acceptance contract');

  return context.result({
    report: {
      schema: EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA,
      decisionSummary: report.decisionSummary,
      checklistCount: report.checklistCount,
      targetReadiness: contract.targetReadiness,
      publishAllowed: report.publishAllowed,
      automaticPublishApproval: report.automaticPublishApproval,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13ReleaseOwnerAcceptanceReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 13 Release Owner Acceptance erfolgreich.',
    failureTitle: 'Epic 13 Release Owner Acceptance fehlgeschlagen:'
  });
}

module.exports = {
  printEpic13ReleaseOwnerAcceptanceReport,
  runEpic13ReleaseOwnerAcceptanceSuite
};

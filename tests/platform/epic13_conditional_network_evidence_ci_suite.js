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
  CI_EVIDENCE_ARTIFACTS,
  CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_COMMAND,
  CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_MODULE,
  CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_SCRIPT,
  CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW,
  CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_ARTIFACT,
  CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_JOB,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_CONTRACT,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_DOCS,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_LOCAL_GATE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_MODULE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_EXPORT,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_SCRIPT,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_ARTIFACT,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_SCHEMA,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_STATUS,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SUITE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_TARGET,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE_DOC,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PUBLISH_BOUNDARY,
  REQUIRED_REFERENCE_PATHS,
  createEpic13ConditionalNetworkEvidenceCiPlan,
  createEpic13ConditionalNetworkEvidenceCiReport,
  validateEpic13ConditionalNetworkEvidenceCiPlan
} = require('../../catalog/epic13-conditional-network-evidence-ci');
const {
  COMMAND_ARTIFACTS,
  DEFERRAL_REASONS,
  EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA,
  REQUIRED_ARTIFACTS
} = require('../../catalog/epic13-conditional-network-evidence');

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

function runEpic13ConditionalNetworkEvidenceCiSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-conditional-network-evidence-ci',
    label: 'Epic 13 Conditional Network Evidence CI'
  });
  const plan = createEpic13ConditionalNetworkEvidenceCiPlan({ rootDir });
  const validation = validateEpic13ConditionalNetworkEvidenceCiPlan(plan);
  const report = createEpic13ConditionalNetworkEvidenceCiReport({ rootDir, plan });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13ConditionalNetworkEvidenceCi;
  const packageLockMetadata = packageManifest.xtend && packageManifest.xtend.epic13PackageExportLock;
  const typeExportsMetadata = packageManifest.xtend && packageManifest.xtend.typeExports;
  const expectedExportCount = packageLockMetadata && packageLockMetadata.expectedExportCount;
  const workflow = readText(CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW, rootDir);
  const captureScript = readText(CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_MODULE, rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const contract = readText(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_DOCS, rootDir);
  const conditionalDocs = readText('docs/conditional-network-evidence.md', rootDir);
  const releaseEvidenceDocs = readText('docs/release-report-pack-dry-run-evidence.md', rootDir);
  const rc1HandoffDocs = readText('development/docs-evidence/legacy-routes/en/rc1-gate-matrix-ci-handoff.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const packageExportContract = readText('development/XTend-Epic13-Package-Export-Lock-Contract.md', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const rootReadme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const roadmap = readText('development/ROADMAP-Docs-Planned-Features.md', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SUITE, { rootDir, extension: '.js' });
  const captureSyntax = syntaxCheckFile(CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_MODULE, { rootDir, extension: '.js' });

  [
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_MODULE,
    'catalog/epic13-conditional-network-evidence-ci.d.ts',
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SUITE,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_CONTRACT,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE_DOC,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_DOCS,
    CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_MODULE,
    CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_REFERENCE_PATHS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as conditional network CI reference`);
  });

  context.assert(moduleSyntax.ok, `Conditional Network Evidence CI module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Conditional Network Evidence CI suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(captureSyntax.ok, `Conditional Network capture script syntax passes${captureSyntax.ok ? '' : ` (${captureSyntax.message})`}`);
  context.assert(plan.schema === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA, 'conditional network CI exposes stable schema');
  context.assert(plan.reportSchema === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_SCHEMA, 'conditional network CI exposes report schema');
  context.assert(plan.workpackage === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE, 'conditional network CI belongs to DPF-WP-03');
  context.assert(plan.status === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_STATUS, 'conditional network CI is accepted');
  context.assert(plan.targetReadiness === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_TARGET, 'conditional network CI target is ready');
  context.assert(plan.sourceValidationOk === true && plan.sourceReportOk === true, 'conditional network source validates');
  context.assert(plan.releaseEvidenceValidationOk === true && plan.releaseEvidenceReportOk === true, 'DPF-WP-02 source validates');
  context.assert(plan.captureScript === CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_SCRIPT, 'conditional network CI records capture script');
  context.assert(plan.captureCommand === CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_COMMAND, 'conditional network CI records capture command');
  context.assert(plan.expectedDeferralSchema === EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA, 'conditional network CI keeps deferral schema');
  context.assert(plan.localGateRequiresNetwork === false, 'local gate remains network-free');
  context.assert(plan.ciJobRequiresNetwork === true, 'CI job is network execution boundary');
  context.assert(plan.ownerDeferralAllowed === true, 'owner deferral remains allowed');
  context.assert(plan.publishRequiresExecutedOrOwnerAcceptedDeferral === true, 'publish requires execution or accepted deferral');
  context.assert(plan.dependencyUpgradesIncluded === false && plan.vulnerabilityFixesIncluded === false && plan.publicPublishDecisionIncluded === false, 'conditional network CI excludes remediation and publish decision');
  context.assert(plan.nextDecision === NEXT_DECISION, 'conditional network CI hands off to visual pixel evidence');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'conditional network CI makes DPF-WP-04 ready');
  context.assert(plan.publishBoundary === PUBLISH_BOUNDARY, 'conditional network CI keeps publish boundary');
  context.assert(plan.publishAllowed === false && plan.packagePrivateRequired === true, 'conditional network CI keeps package private');
  context.assert(validation.schema === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_SCHEMA, 'conditional network CI validator emits report schema');
  context.assert(validation.ok === true, 'conditional network CI plan validates');
  context.assert(report.ok === true, 'conditional network CI report validates');
  context.assert(report.commandCount === COMMAND_ARTIFACTS.length, 'conditional network CI report counts commands');
  context.assert(report.evidenceArtifactCount === CI_EVIDENCE_ARTIFACTS.length, 'conditional network CI report counts artifacts');
  assertIncludesAll(context, plan.evidenceArtifacts, CI_EVIDENCE_ARTIFACTS, 'CI evidence artifacts');
  assertIncludesAll(context, plan.evidenceArtifacts, REQUIRED_ARTIFACTS, 'existing network artifacts');
  assertIncludesAll(context, plan.allowedDeferralReasons, DEFERRAL_REASONS, 'deferral reasons');
  assertIncludesAll(context, plan.referencePaths, REQUIRED_REFERENCE_PATHS, 'reference paths');
  COMMAND_ARTIFACTS.forEach((entry) => {
    const command = plan.commands.find((candidate) => candidate.id === entry.id);
    context.assert(command && command.command === entry.command, `${entry.id} command is stable`);
    context.assert(command && command.jsonCommand === entry.jsonCommand, `${entry.id} JSON command is stable`);
    context.assert(command && command.expectedArtifact === entry.expectedArtifact, `${entry.id} artifact is stable`);
    context.assert(command && command.ciMode === 'execute-or-owner-deferral', `${entry.id} uses execute-or-owner-deferral`);
  });

  context.assert((packageManifest.exports[EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_EXPORT] && packageManifest.exports[EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_EXPORT].default === './catalog/epic13-conditional-network-evidence-ci.js'), 'package exports conditional network CI catalog');
  context.assert(packageManifest.scripts['conditional-network:evidence'] === CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_SCRIPT, 'package exposes conditional-network:evidence capture');
  context.assert(packageManifest.scripts['test:epic13-conditional-network-evidence-ci'] === 'node scripts/run_xtend_tests.js epic13-conditional-network-evidence-ci', 'package exposes conditional network CI test script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_SCRIPT), 'release gates include conditional network CI script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_SCRIPT), 'release checklist includes conditional network CI script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_CONTRACT), 'release checklist includes conditional network CI contract');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_DOCS), 'release checklist includes conditional network CI docs');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_ARTIFACT), 'release checklist includes conditional network CI report artifact');
  context.assert(metadata && metadata.schema === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA, 'package metadata exposes conditional network CI schema');
  context.assert(metadata && metadata.workpackage === EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE, 'package metadata exposes DPF-WP-03');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'package metadata hands off to DPF-WP-04');
  context.assert(metadata && metadata.workflowJob === CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_JOB, 'package metadata exposes CI workflow job');
  context.assert(packageLockMetadata && packageLockMetadata.expectedExportCount === expectedExportCount, `package export lock expects ${expectedExportCount} exports after current catalog updates`);
  context.assert(typeExportsMetadata && typeExportsMetadata.expectedExportCount === expectedExportCount, `TypeExports lock expects ${expectedExportCount} exports after current catalog updates`);

  assertTextIncludesAll(context, workflow, [
    `${CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_JOB}:`,
    'XTEND_CONDITIONAL_NETWORK_EXECUTE: "1"',
    CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_COMMAND,
    CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_ARTIFACT.replace('{artifactSuffix}', '${{ matrix.artifact_suffix }}'),
    '.xtend-test-results/xtend-npm-audit-report.json',
    '.xtend-test-results/xtend-npm-sbom.json',
    '.xtend-test-results/xtend-conditional-network-evidence-report.json'
  ], 'GitHub workflow');
  assertTextIncludesAll(context, captureScript, [
    'XTEND_CONDITIONAL_NETWORK_EXECUTE',
    'XTEND_CONDITIONAL_NETWORK_ALLOW_DEFERRAL',
    'npm-audit-moderate',
    'npm-sbom-json',
    'xtend-conditional-network-evidence-report.json'
  ], 'capture script');
  assertTextIncludesAll(context, scaffoldConfig, [
    'epic13ConditionalNetworkEvidenceCi',
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA,
    `expectedExportCount: ${expectedExportCount}`
  ], 'scaffold config');
  assertTextIncludesAll(context, runner, [
    'epic13_conditional_network_evidence_ci_suite',
    'epic13-conditional-network-evidence-ci',
    'runEpic13ConditionalNetworkEvidenceCiSuite'
  ], 'test runner');
  assertTextIncludesAll(context, contract, [
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA,
    'XTEND_CONDITIONAL_NETWORK_EXECUTE=1',
    CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_ARTIFACT,
    'DPF-WP-03'
  ], 'conditional network CI contract');
  assertTextIncludesAll(context, workpackage, [
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA,
    'Status: completed',
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_LOCAL_GATE,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_ARTIFACT
  ], 'conditional network CI workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA,
    CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_COMMAND,
    'XTEND_CONDITIONAL_NETWORK_EXECUTE=1',
    '.xtend-test-results/xtend-npm-audit-report.json',
    'DPF-WP-04'
  ], 'conditional network CI docs');
  assertTextIncludesAll(context, conditionalDocs, [EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA, CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_COMMAND], 'conditional network docs');
  assertTextIncludesAll(context, releaseEvidenceDocs, [EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA, 'DPF-WP-03'], 'release evidence docs');
  assertTextIncludesAll(context, rc1HandoffDocs, [EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA, EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_ARTIFACT], 'RC1 handoff docs');
  assertTextIncludesAll(context, ciMatrix, [EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_SCRIPT, CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_COMMAND, CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_JOB], 'CI gate matrix');
  assertTextIncludesAll(context, releaseChecklist, [
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_SCRIPT,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_CONTRACT,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_DOCS,
    EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_ARTIFACT
  ], 'release checklist');
  assertTextIncludesAll(context, registry, [EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA, EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_DOCS], 'documentation registry');
  assertTextIncludesAll(context, packageExportContract, [`expectedExportCount: \`${expectedExportCount}\``, EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_EXPORT], 'package export contract');
  assertTextIncludesAll(context, docsReadme, ['./conditional-network-evidence-ci.md', EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA], 'docs README');
  assertTextIncludesAll(context, docsMenu, ['"slug": "conditional-network-evidence-ci"', 'Conditional Network Evidence CI'], 'docs menu');
  assertTextIncludesAll(context, testsReadme, [EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_LOCAL_GATE, EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA], 'tests README');
  assertTextIncludesAll(context, rootReadme, ['xtend.epic13ConditionalNetworkEvidenceCi', EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_SCRIPT, EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA], 'root README');
  assertTextIncludesAll(context, changelog, [EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA, 'Conditional Network Evidence CI'], 'changelog');
  assertTextIncludesAll(context, roadmap, [EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE, EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA], 'planned features roadmap');

  return context.result({
    report: {
      schema: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_SCHEMA,
      commandCount: report.commandCount,
      evidenceArtifactCount: report.evidenceArtifactCount,
      referencePathCount: report.referencePathCount,
      workflowJob: report.workflowJob,
      publishAllowed: report.publishAllowed,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13ConditionalNetworkEvidenceCiReport(report) {
  printSuiteReport(report, {
    successTitle: 'Epic 13 Conditional Network Evidence CI Gates erfolgreich.',
    failureTitle: 'Epic 13 Conditional Network Evidence CI Gates fehlgeschlagen:'
  });
}

module.exports = {
  printEpic13ConditionalNetworkEvidenceCiReport,
  runEpic13ConditionalNetworkEvidenceCiSuite
};

if (require.main === module) {
  const report = runEpic13ConditionalNetworkEvidenceCiSuite();
  printEpic13ConditionalNetworkEvidenceCiReport(report);
  process.exit(report.ok ? 0 : 1);
}

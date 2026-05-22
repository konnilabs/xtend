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
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_CONTRACT,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_DOCS,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_LOCAL_GATE,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_MODULE,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_EXPORT,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_SCRIPT,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_ARTIFACT,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_SCHEMA,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_STATUS,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SUITE,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_TARGET,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE,
  EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE_DOC,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PACK_DRY_RUN_COMMAND,
  PACK_DRY_RUN_RAW_COMMAND,
  PACK_DRY_RUN_REPORT_COMMAND,
  PUBLISH_BOUNDARY,
  RELEASE_REPORT_ARTIFACT,
  RELEASE_REPORT_COMMAND,
  REQUIRED_OWNER_EVIDENCE,
  REQUIRED_REFERENCE_PATHS,
  createEpic13ReleaseReportPackDryRunEvidencePlan,
  createEpic13ReleaseReportPackDryRunEvidenceReport,
  validateEpic13ReleaseReportPackDryRunEvidencePlan
} = require('../../catalog/epic13-release-report-pack-dry-run-evidence');

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

function runEpic13ReleaseReportPackDryRunEvidenceSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-release-report-pack-dry-run-evidence',
    label: 'Epic 13 Release Report and Pack Dry Run Evidence'
  });
  const plan = createEpic13ReleaseReportPackDryRunEvidencePlan({ rootDir });
  const validation = validateEpic13ReleaseReportPackDryRunEvidencePlan(plan);
  const report = createEpic13ReleaseReportPackDryRunEvidenceReport({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13ReleaseReportPackDryRunEvidence;
  const packageLockMetadata = packageManifest.xtend && packageManifest.xtend.epic13PackageExportLock;
  const typeExportsMetadata = packageManifest.xtend && packageManifest.xtend.typeExports;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const contract = readText(EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_DOCS, rootDir);
  const rc1HandoffContract = readText('development/XTend-Epic13-RC1-Gate-Matrix-und-CI-Handoff.md', rootDir);
  const rc1HandoffDocs = readText('docs/rc1-gate-matrix-ci-handoff.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const packageExportContract = readText('development/XTend-Epic13-Package-Export-Lock-Contract.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const rootReadme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const roadmap = readText('development/ROADMAP-Docs-Planned-Features.md', rootDir);
  const referencesSuite = readText('tests/references/reference_path_suite.js', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SUITE, { rootDir, extension: '.js' });

  [
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_MODULE,
    'catalog/epic13-release-report-pack-dry-run-evidence.d.ts',
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SUITE,
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_CONTRACT,
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE_DOC,
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_REFERENCE_PATHS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as release evidence reference`);
  });

  context.assert(moduleSyntax.ok, `Release evidence module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Release evidence suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA, 'release evidence exposes stable schema');
  context.assert(plan.reportSchema === EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_SCHEMA, 'release evidence exposes report schema');
  context.assert(plan.workpackage === EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE, 'release evidence belongs to DPF-WP-02');
  context.assert(plan.status === EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_STATUS, 'release evidence is accepted');
  context.assert(plan.targetReadiness === EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_TARGET, 'release evidence target is reproducible owner artifacts');
  context.assert(plan.sourceValidationOk === true && plan.sourceReportOk === true, 'RC1 gate matrix source validates');
  context.assert(plan.releaseReportCommand === RELEASE_REPORT_COMMAND, 'release evidence records release:report command');
  context.assert(plan.releaseReportArtifact === RELEASE_REPORT_ARTIFACT, 'release evidence records release report artifact');
  context.assert(plan.packDryRunCommand === PACK_DRY_RUN_COMMAND, 'release evidence records pack:dry-run command');
  context.assert(plan.packDryRunReportCommand === PACK_DRY_RUN_REPORT_COMMAND, 'release evidence keeps pack:dry-run:report alias');
  context.assert(plan.packDryRunRawCommand === PACK_DRY_RUN_RAW_COMMAND, 'release evidence exposes raw pack dry-run command');
  context.assert(plan.packageScripts.releaseReport === 'node scripts/run_xtend_tests.js --report .xtend-test-results/xtend-release-report.json', 'release:report writes release report artifact');
  context.assert(plan.packageScripts.packDryRun === 'node scripts/capture_pack_dry_run.js', 'pack:dry-run writes reproducible artifacts');
  context.assert(plan.packageScripts.packDryRunReport === 'node scripts/capture_pack_dry_run.js', 'pack:dry-run:report remains compatibility alias');
  context.assert(plan.packageScripts.packDryRunRaw === 'npm pack --dry-run', 'pack:dry-run:raw exposes raw npm command');
  context.assert(plan.auditSbomIncluded === false && plan.publicPublishDecisionIncluded === false && plan.licenseDecisionIncluded === false, 'release evidence excludes audit, SBOM, publish and license decisions');
  context.assert(plan.nextDecision === NEXT_DECISION, 'release evidence hands off to conditional network evidence CI');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'release evidence makes DPF-WP-03 ready');
  context.assert(plan.publishBoundary === PUBLISH_BOUNDARY, 'release evidence keeps publish boundary');
  context.assert(plan.publishAllowed === false && plan.packagePrivateRequired === true, 'release evidence keeps publish blocked');
  context.assert(validation.schema === EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_SCHEMA, 'release evidence validator emits report schema');
  context.assert(validation.ok === true, 'release evidence plan validates');
  context.assert(report.ok === true, 'release evidence report validates');
  context.assert(report.ownerEvidenceCount === REQUIRED_OWNER_EVIDENCE.length, 'release evidence report counts owner evidence');

  REQUIRED_OWNER_EVIDENCE.forEach((entry) => {
    const evidence = plan.ownerEvidence.find((candidate) => candidate.id === entry.id);
    context.assert(evidence && evidence.artifact === entry.artifact, `${entry.id} artifact is stable`);
    context.assert(evidence && evidence.reproducible === true, `${entry.id} is reproducible`);
    context.assert(evidence && evidence.ownerVisible === true, `${entry.id} is owner-visible`);
    context.assert(evidence && evidence.networkRequired === false, `${entry.id} stays network-free`);
  });
  assertIncludesAll(context, plan.referencePaths, REQUIRED_REFERENCE_PATHS, 'release evidence reference paths');
  assertIncludesAll(context, plan.rc1HandoffReferences, [
    '.xtend-test-results/xtend-release-report.json',
    '.xtend-test-results/xtend-pack-dry-run.json',
    '.xtend-test-results/xtend-package-export-surface-lock.json',
    '.xtend-test-results/xtend-package-export-lock-report.json'
  ], 'RC1 handoff references');

  context.assert((packageManifest.exports[EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_EXPORT] && packageManifest.exports[EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_EXPORT].default === './catalog/epic13-release-report-pack-dry-run-evidence.js'), 'package exports release evidence catalog');
  context.assert(packageManifest.scripts['test:epic13-release-report-pack-dry-run-evidence'] === 'node scripts/run_xtend_tests.js epic13-release-report-pack-dry-run-evidence', 'package exposes release evidence test script');
  context.assert(packageManifest.scripts['pack:dry-run'] === 'node scripts/capture_pack_dry_run.js', 'package pack:dry-run writes artifacts');
  context.assert(packageManifest.scripts['pack:dry-run:raw'] === 'npm pack --dry-run', 'package exposes raw pack dry-run script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_SCRIPT), 'release gates include release evidence package script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_SCRIPT), 'release checklist includes release evidence package script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_CONTRACT), 'release checklist includes release evidence contract');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_DOCS), 'release checklist includes release evidence docs');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_ARTIFACT), 'release checklist includes release evidence report artifact');
  context.assert(metadata && metadata.schema === EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA, 'package metadata exposes release evidence schema');
  context.assert(metadata && metadata.workpackage === EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE, 'package metadata exposes DPF-WP-02');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'package metadata hands off to DPF-WP-03');
  context.assert(metadata && metadata.reportArtifact === EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_ARTIFACT, 'package metadata exposes report artifact');
  context.assert(packageLockMetadata && packageLockMetadata.expectedExportCount === 123, 'package export lock expects 123 exports after release evidence catalog');
  context.assert(typeExportsMetadata && typeExportsMetadata.expectedExportCount === 123, 'TypeExports lock expects 123 exports after release evidence catalog');

  assertTextIncludesAll(context, scaffoldConfig, [
    'epic13ReleaseReportPackDryRunEvidence',
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA,
    'expectedExportCount: 123'
  ], 'scaffold config');
  assertTextIncludesAll(context, runner, [
    'epic13_release_report_pack_dry_run_evidence_suite',
    'epic13-release-report-pack-dry-run-evidence',
    'runEpic13ReleaseReportPackDryRunEvidenceSuite'
  ], 'test runner');
  assertTextIncludesAll(context, contract, [
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA,
    RELEASE_REPORT_COMMAND,
    PACK_DRY_RUN_COMMAND,
    'DPF-WP-03'
  ], 'release evidence contract');
  assertTextIncludesAll(context, workpackage, [
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA,
    'Status: completed',
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_LOCAL_GATE,
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_ARTIFACT
  ], 'release evidence workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA,
    RELEASE_REPORT_ARTIFACT,
    '.xtend-test-results/xtend-pack-dry-run.json',
    'npm run pack:dry-run:raw'
  ], 'release evidence docs');
  assertTextIncludesAll(context, rc1HandoffContract, [EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA, EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_ARTIFACT], 'RC1 handoff contract');
  assertTextIncludesAll(context, rc1HandoffDocs, [EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA, 'release-report-pack-dry-run-evidence'], 'RC1 handoff docs');
  assertTextIncludesAll(context, ciMatrix, [EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_SCRIPT, RELEASE_REPORT_COMMAND, PACK_DRY_RUN_COMMAND], 'CI gate matrix');
  assertTextIncludesAll(context, releaseChecklist, [
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_SCRIPT,
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_CONTRACT,
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_DOCS,
    EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_ARTIFACT
  ], 'release checklist');
  assertTextIncludesAll(context, registry, [EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA, EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_DOCS], 'documentation registry');
  assertTextIncludesAll(context, packageExportContract, ['expectedExportCount: `123`', EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_EXPORT], 'package export contract');
  assertTextIncludesAll(context, docsReadme, ['./release-report-pack-dry-run-evidence.md', EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA], 'docs README');
  assertTextIncludesAll(context, docsMenu, ['"slug": "release-report-pack-dry-run-evidence"', 'Release Report und Pack Dry Run Evidence'], 'docs menu');
  assertTextIncludesAll(context, testsReadme, [EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_LOCAL_GATE, EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA], 'tests README');
  assertTextIncludesAll(context, rootReadme, ['xtend.epic13ReleaseReportPackDryRunEvidence', EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_SCRIPT, EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA], 'root README');
  assertTextIncludesAll(context, changelog, [EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA, 'Release Report und Pack Dry Run Evidence'], 'changelog');
  assertTextIncludesAll(context, roadmap, [EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE, EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA], 'planned features roadmap');
  assertTextIncludesAll(context, referencesSuite, ['"pack:dry-run": "node scripts/capture_pack_dry_run.js"', '"pack:dry-run:raw": "npm pack --dry-run"'], 'reference path suite');

  return context.result({
    report: {
      schema: EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_SCHEMA,
      ownerEvidenceCount: report.ownerEvidenceCount,
      referencePathCount: report.referencePathCount,
      releaseReportArtifact: report.releaseReportArtifact,
      packDryRunArtifact: report.packDryRunArtifact,
      publishAllowed: report.publishAllowed,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13ReleaseReportPackDryRunEvidenceReport(report) {
  printSuiteReport(report, {
    successTitle: 'Epic 13 Release Report und Pack Dry Run Evidence Gates erfolgreich.',
    failureTitle: 'Epic 13 Release Report und Pack Dry Run Evidence Gates fehlgeschlagen:'
  });
}

module.exports = {
  printEpic13ReleaseReportPackDryRunEvidenceReport,
  runEpic13ReleaseReportPackDryRunEvidenceSuite
};

if (require.main === module) {
  const report = runEpic13ReleaseReportPackDryRunEvidenceSuite();
  printEpic13ReleaseReportPackDryRunEvidenceReport(report);
  process.exit(report.ok ? 0 : 1);
}

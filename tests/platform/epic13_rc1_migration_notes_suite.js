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
  CURRENT_VERSION,
  EPIC13_RC1_MIGRATION_NOTES_CONTRACT,
  EPIC13_RC1_MIGRATION_NOTES_DOCS,
  EPIC13_RC1_MIGRATION_NOTES_LOCAL_GATE,
  EPIC13_RC1_MIGRATION_NOTES_MODULE,
  EPIC13_RC1_MIGRATION_NOTES_PACKAGE_SCRIPT,
  EPIC13_RC1_MIGRATION_NOTES_REPORT_ARTIFACT,
  EPIC13_RC1_MIGRATION_NOTES_REPORT_SCHEMA,
  EPIC13_RC1_MIGRATION_NOTES_SCHEMA,
  EPIC13_RC1_MIGRATION_NOTES_STATUS,
  EPIC13_RC1_MIGRATION_NOTES_STEERING,
  EPIC13_RC1_MIGRATION_NOTES_SUITE,
  EPIC13_RC1_MIGRATION_NOTES_TARGET,
  EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE,
  EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE_DOC,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PROPOSED_VERSION,
  PUBLISH_BOUNDARY,
  REQUIRED_ARTIFACTS,
  REQUIRED_CHANGELOG_SECTIONS,
  REQUIRED_MIGRATION_SECTIONS,
  REQUIRED_SOURCE_GATES,
  createEpic13Rc1MigrationNotesPlan,
  createEpic13Rc1MigrationNotesReport,
  validateEpic13Rc1MigrationNotesPlan
} = require('../../catalog/epic13-rc1-migration-notes');

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

function runEpic13Rc1MigrationNotesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-rc1-migration-notes',
    label: 'Epic 13 RC1 Migration Notes'
  });
  const plan = createEpic13Rc1MigrationNotesPlan({ rootDir });
  const validation = validateEpic13Rc1MigrationNotesPlan(plan);
  const report = createEpic13Rc1MigrationNotesReport({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13Rc1MigrationNotes;
  const rc1Metadata = packageManifest.xtend && packageManifest.xtend.epic13Rc1Readiness;
  const ownerMetadata = packageManifest.xtend && packageManifest.xtend.epic13ReleaseOwnerAcceptance;
  const trustedDomMetadata = packageManifest.xtend && packageManifest.xtend.epic13TrustedDomBoundary;
  const packageLockMetadata = packageManifest.xtend && packageManifest.xtend.epic13PackageExportLock;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const steering = readText(EPIC13_RC1_MIGRATION_NOTES_STEERING, rootDir);
  const contract = readText(EPIC13_RC1_MIGRATION_NOTES_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_RC1_MIGRATION_NOTES_DOCS, rootDir);
  const rc1ReadinessDocs = readText('docs/rc1-readiness.md', rootDir);
  const ownerDocs = readText('docs/release-owner-acceptance.md', rootDir);
  const trustedDomDocs = readText('docs/trusted-dom-boundary-browser-proof.md', rootDir);
  const packageExportContract = readText('development/XTend-Epic13-Package-Export-Lock-Contract.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const rootReadme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_RC1_MIGRATION_NOTES_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_RC1_MIGRATION_NOTES_SUITE, { rootDir, extension: '.js' });

  [
    EPIC13_RC1_MIGRATION_NOTES_MODULE,
    EPIC13_RC1_MIGRATION_NOTES_SUITE,
    EPIC13_RC1_MIGRATION_NOTES_STEERING,
    EPIC13_RC1_MIGRATION_NOTES_CONTRACT,
    EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE_DOC,
    EPIC13_RC1_MIGRATION_NOTES_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required migration artifact`);
  });

  context.assert(moduleSyntax.ok, `RC1 migration notes module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RC1 migration notes suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === EPIC13_RC1_MIGRATION_NOTES_SCHEMA, 'RC1 migration notes exposes stable schema');
  context.assert(plan.reportSchema === EPIC13_RC1_MIGRATION_NOTES_REPORT_SCHEMA, 'RC1 migration notes exposes report schema');
  context.assert(plan.workpackage === EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE, 'RC1 migration notes belongs to WP-E13-12');
  context.assert(plan.status === EPIC13_RC1_MIGRATION_NOTES_STATUS, 'RC1 migration notes is accepted');
  context.assert(plan.sourceSchema === 'xtend.epic13.trusted-dom-boundary.v1', 'RC1 migration notes consumes Trusted DOM boundary');
  context.assert(plan.sourceValidationOk === true && plan.sourceReportOk === true, 'Trusted DOM source validates');
  context.assert(plan.ownerSourceValidationOk === true && plan.ownerSourceReportOk === true, 'Release owner source validates');
  context.assert(plan.targetReadiness === EPIC13_RC1_MIGRATION_NOTES_TARGET, 'RC1 migration notes target is consumer communication ready');
  context.assert(plan.currentVersion === CURRENT_VERSION, 'RC1 migration notes records current version');
  context.assert(plan.semverDecision.proposedVersion === PROPOSED_VERSION, 'RC1 migration notes records proposed RC version');
  context.assert(plan.semverDecision.publicSurfaceChanged === true, 'SemVer decision marks public surface change');
  context.assert(plan.semverDecision.migrationNotesRequired === true, 'SemVer decision requires migration notes');
  context.assert(plan.semverDecision.changelogRequired === true, 'SemVer decision requires changelog');
  context.assert(plan.semverDecision.publishAllowed === false, 'SemVer decision keeps publish blocked');
  assertIncludesAll(context, plan.sourceGates, REQUIRED_SOURCE_GATES, 'RC1 migration source gates');
  assertIncludesAll(context, plan.requiredChangelogSections, REQUIRED_CHANGELOG_SECTIONS, 'RC1 migration changelog sections');
  REQUIRED_MIGRATION_SECTIONS.forEach((section) => {
    context.assert(plan.migrationSections.some((entry) => entry.id === section && entry.consumerFacing === true), `migration section exists: ${section}`);
  });
  context.assert(plan.docsMenuSlug === 'rc1-migration-notes', 'RC1 migration notes exposes docs menu slug');
  context.assert(plan.frameworkAgnostic === true && plan.rmtKernelImportsXtendTypes === false, 'RC1 migration preserves RMT framework boundary');
  context.assert(plan.nextDecision === NEXT_DECISION, 'RC1 migration notes hands off to gate matrix');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'RC1 migration notes makes WP-E13-13 ready');
  context.assert(plan.publishBoundary === PUBLISH_BOUNDARY, 'RC1 migration notes keeps owner publish boundary');
  context.assert(validation.schema === EPIC13_RC1_MIGRATION_NOTES_REPORT_SCHEMA, 'RC1 migration validator emits report schema');
  context.assert(validation.ok === true, 'RC1 migration notes plan validates');
  context.assert(report.ok === true, 'RC1 migration notes report validates');
  context.assert(report.migrationSectionCount === REQUIRED_MIGRATION_SECTIONS.length, 'RC1 migration notes report counts migration sections');

  context.assert((packageManifest.exports['./catalog/epic13-rc1-migration-notes'] === './catalog/epic13-rc1-migration-notes.js' || (packageManifest.exports['./catalog/epic13-rc1-migration-notes'] && packageManifest.exports['./catalog/epic13-rc1-migration-notes'].default === './catalog/epic13-rc1-migration-notes.js')), 'package exports RC1 migration notes catalog');
  context.assert(packageManifest.scripts['test:epic13-rc1-migration-notes'] === 'node scripts/run_xtend_tests.js epic13-rc1-migration-notes', 'package exposes RC1 migration notes test script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC13_RC1_MIGRATION_NOTES_PACKAGE_SCRIPT), 'release gates include RC1 migration notes package script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_RC1_MIGRATION_NOTES_PACKAGE_SCRIPT), 'release checklist includes RC1 migration notes package script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_RC1_MIGRATION_NOTES_CONTRACT), 'release checklist includes RC1 migration notes contract');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_RC1_MIGRATION_NOTES_DOCS), 'release checklist includes RC1 migration notes docs');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_RC1_MIGRATION_NOTES_REPORT_ARTIFACT), 'release checklist includes RC1 migration notes report artifact');
  context.assert(metadata && metadata.schema === EPIC13_RC1_MIGRATION_NOTES_SCHEMA, 'package metadata exposes RC1 migration notes schema');
  context.assert(metadata && metadata.workpackage === EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE, 'package metadata exposes WP-E13-12');
  context.assert(metadata && metadata.proposedVersion === PROPOSED_VERSION, 'package metadata exposes proposed RC version');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'package metadata hands off to WP-E13-13');
  context.assert(metadata && metadata.nextDecision === NEXT_DECISION, 'package metadata hands off to RC1 gate matrix decision');
  context.assert(rc1Metadata && rc1Metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'RC1 readiness metadata now hands off to WP-E13-13');
  context.assert(ownerMetadata && ownerMetadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Release owner metadata now hands off to WP-E13-13');
  context.assert(trustedDomMetadata && trustedDomMetadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Trusted DOM metadata now hands off to WP-E13-13');
  context.assert(packageLockMetadata && packageLockMetadata.expectedExportCount === 124, 'package export lock expects 124 exports after RC1 gate matrix and kernel surfaces');

  assertTextIncludesAll(context, scaffoldConfig, [
    'epic13Rc1MigrationNotes',
    EPIC13_RC1_MIGRATION_NOTES_SCHEMA,
    PROPOSED_VERSION,
    'expectedExportCount: 124',
    'nextWorkpackage: "WP-E13-13"'
  ], 'scaffold config');
  assertTextIncludesAll(context, runner, [
    'epic13_rc1_migration_notes_suite',
    'epic13-rc1-migration-notes',
    'runEpic13Rc1MigrationNotesSuite'
  ], 'test runner');
  assertTextIncludesAll(context, steering, [
    '| `WP-E13-12` | P1 | completed |',
    '| `WP-E13-13` | P2 | completed |',
    '| `WP-E13-14` | P2 | ready |',
    'Handoff nach WP-E13-12',
    EPIC13_RC1_MIGRATION_NOTES_SCHEMA,
    NEXT_DECISION
  ], 'Epic 13 steering');
  assertTextIncludesAll(context, contract, [
    EPIC13_RC1_MIGRATION_NOTES_SCHEMA,
    PROPOSED_VERSION,
    CURRENT_VERSION,
    'Migration Notes',
    'SemVer',
    'WP-E13-13'
  ], 'RC1 migration contract');
  assertTextIncludesAll(context, workpackage, [
    EPIC13_RC1_MIGRATION_NOTES_SCHEMA,
    'Status: completed',
    EPIC13_RC1_MIGRATION_NOTES_LOCAL_GATE,
    EPIC13_RC1_MIGRATION_NOTES_REPORT_ARTIFACT
  ], 'RC1 migration workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC13_RC1_MIGRATION_NOTES_SCHEMA,
    PROPOSED_VERSION,
    'loader-local-esm-cdn-free',
    'trusted-dom-boundary',
    'npm run test:epic13-rc1-migration-notes'
  ], 'RC1 migration docs');
  assertTextIncludesAll(context, rc1ReadinessDocs, [EPIC13_RC1_MIGRATION_NOTES_SCHEMA, 'WP-E13-13'], 'RC1 readiness docs');
  assertTextIncludesAll(context, ownerDocs, [EPIC13_RC1_MIGRATION_NOTES_SCHEMA, 'accepted', 'WP-E13-13'], 'release owner docs');
  assertTextIncludesAll(context, trustedDomDocs, [EPIC13_RC1_MIGRATION_NOTES_SCHEMA, 'WP-E13-13'], 'Trusted DOM docs');
  assertTextIncludesAll(context, packageExportContract, ['expectedExportCount: `124`', './catalog/epic13-rc1-migration-notes'], 'package export contract');
  assertTextIncludesAll(context, releaseChecklist, [
    EPIC13_RC1_MIGRATION_NOTES_PACKAGE_SCRIPT,
    EPIC13_RC1_MIGRATION_NOTES_CONTRACT,
    EPIC13_RC1_MIGRATION_NOTES_DOCS,
    EPIC13_RC1_MIGRATION_NOTES_REPORT_ARTIFACT
  ], 'release checklist');
  assertTextIncludesAll(context, ciMatrix, [EPIC13_RC1_MIGRATION_NOTES_PACKAGE_SCRIPT, 'RC1 Migration Notes'], 'CI gate matrix');
  assertTextIncludesAll(context, docsReadme, ['./rc1-migration-notes.md', EPIC13_RC1_MIGRATION_NOTES_SCHEMA], 'docs README');
  assertTextIncludesAll(context, docsMenu, ['"slug": "rc1-migration-notes"', 'RC1 Migration Notes'], 'docs menu');
  assertTextIncludesAll(context, testsReadme, [EPIC13_RC1_MIGRATION_NOTES_LOCAL_GATE, EPIC13_RC1_MIGRATION_NOTES_SCHEMA], 'tests README');
  assertTextIncludesAll(context, rootReadme, ['xtend.epic13Rc1MigrationNotes', EPIC13_RC1_MIGRATION_NOTES_PACKAGE_SCRIPT, EPIC13_RC1_MIGRATION_NOTES_SCHEMA], 'root README');
  assertTextIncludesAll(context, changelog, [EPIC13_RC1_MIGRATION_NOTES_SCHEMA, PROPOSED_VERSION, 'Migration Notes'], 'changelog');
  assertTextIncludesAll(context, registry, [EPIC13_RC1_MIGRATION_NOTES_SCHEMA, EPIC13_RC1_MIGRATION_NOTES_DOCS], 'documentation registry');

  return context.result({
    report: {
      schema: EPIC13_RC1_MIGRATION_NOTES_REPORT_SCHEMA,
      migrationSectionCount: report.migrationSectionCount,
      changelogSectionCount: report.changelogSectionCount,
      proposedVersion: report.proposedVersion,
      publishAllowed: report.publishAllowed,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13Rc1MigrationNotesReport(report) {
  printSuiteReport(report, {
    successTitle: 'Epic 13 RC1 Migration Notes Gates erfolgreich.',
    failureTitle: 'Epic 13 RC1 Migration Notes Gates fehlgeschlagen:'
  });
}

module.exports = {
  printEpic13Rc1MigrationNotesReport,
  runEpic13Rc1MigrationNotesSuite
};

if (require.main === module) {
  const report = runEpic13Rc1MigrationNotesSuite();
  printEpic13Rc1MigrationNotesReport(report);
  process.exit(report.ok ? 0 : 1);
}

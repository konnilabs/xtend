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
  EPIC13_PACKAGE_DRY_RUN_ARTIFACT_SCHEMA,
  EPIC13_PACKAGE_EXPORT_LOCK_CAPTURE_SCRIPT,
  EPIC13_PACKAGE_EXPORT_LOCK_CONTRACT,
  EPIC13_PACKAGE_EXPORT_LOCK_DOCS,
  EPIC13_PACKAGE_EXPORT_LOCK_LOCAL_GATE,
  EPIC13_PACKAGE_EXPORT_LOCK_MODULE,
  EPIC13_PACKAGE_EXPORT_LOCK_PACKAGE_SCRIPT,
  EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA,
  EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA,
  EPIC13_PACKAGE_EXPORT_LOCK_STATUS,
  EPIC13_PACKAGE_EXPORT_LOCK_STEERING,
  EPIC13_PACKAGE_EXPORT_LOCK_SUITE,
  EPIC13_PACKAGE_EXPORT_LOCK_TARGET,
  EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE,
  EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE_DOC,
  EPIC13_PACKAGE_EXPORT_SURFACE_SCHEMA,
  EXPECTED_EXPORT_KEYS,
  PACKAGE_DRY_RUN_ARTIFACT,
  PACKAGE_DRY_RUN_COMMAND,
  PACKAGE_DRY_RUN_JSON_COMMAND,
  PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT,
  PACKAGE_EXPORT_SURFACE_ARTIFACT,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_PACK_ROOTS,
  SURFACE_GROUPS,
  createEpic13PackageExportLockPlan,
  createEpic13PackageExportLockReport,
  createPackDryRunArtifactSummary,
  validateEpic13PackageExportLockPlan
} = require('../../catalog/epic13-package-export-lock');

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

function createSyntheticPackArtifact(packageManifest) {
  return [
    {
      id: `${packageManifest.name}@${packageManifest.version}`,
      name: packageManifest.name,
      version: packageManifest.version,
      filename: `${packageManifest.name}-${packageManifest.version}.tgz`,
      files: REQUIRED_PACK_ROOTS.map((root) => ({
        path: root.includes('.') ? root : `${root}/__surface__.txt`
      })),
      entryCount: REQUIRED_PACK_ROOTS.length,
      bundled: []
    }
  ];
}

function runEpic13PackageExportLockSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-package-export-lock',
    label: 'Epic 13 Package Export Lock'
  });
  const packageManifest = readJson('package.json', rootDir);
  const plan = createEpic13PackageExportLockPlan({ rootDir, packageManifest });
  const validation = validateEpic13PackageExportLockPlan(plan);
  const report = createEpic13PackageExportLockReport({ rootDir, plan });
  const syntheticArtifact = createSyntheticPackArtifact(packageManifest);
  const artifactSummary = createPackDryRunArtifactSummary(syntheticArtifact);
  const planWithArtifact = createEpic13PackageExportLockPlan({
    rootDir,
    packageManifest,
    packDryRunArtifact: syntheticArtifact
  });
  const artifactValidation = validateEpic13PackageExportLockPlan(planWithArtifact);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13PackageExportLock;
  const ownerMetadata = packageManifest.xtend && packageManifest.xtend.epic13ReleaseOwnerAcceptance;
  const networkMetadata = packageManifest.xtend && packageManifest.xtend.epic13ConditionalNetworkEvidence;
  const rc1Metadata = packageManifest.xtend && packageManifest.xtend.epic13Rc1Readiness;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const steering = readText(EPIC13_PACKAGE_EXPORT_LOCK_STEERING, rootDir);
  const contractDoc = readText(EPIC13_PACKAGE_EXPORT_LOCK_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_PACKAGE_EXPORT_LOCK_DOCS, rootDir);
  const rc1Docs = readText('docs/rc1-readiness.md', rootDir);
  const ownerDocs = readText('docs/release-owner-acceptance.md', rootDir);
  const networkDocs = readText('docs/conditional-network-evidence.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const packageStrategy = readText('development/XTend-Package-Export-und-Release-Strategie.md', rootDir);
  const enterpriseAdoption = readText('docs/enterprise-adoption.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const readme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_PACKAGE_EXPORT_LOCK_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_PACKAGE_EXPORT_LOCK_SUITE, { rootDir, extension: '.js' });
  const captureSyntax = syntaxCheckFile('scripts/capture_pack_dry_run.js', { rootDir, extension: '.js' });

  [
    EPIC13_PACKAGE_EXPORT_LOCK_MODULE,
    EPIC13_PACKAGE_EXPORT_LOCK_SUITE,
    'scripts/capture_pack_dry_run.js',
    EPIC13_PACKAGE_EXPORT_LOCK_STEERING,
    EPIC13_PACKAGE_EXPORT_LOCK_CONTRACT,
    EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE_DOC,
    EPIC13_PACKAGE_EXPORT_LOCK_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required package export lock doc`);
  });

  context.assert(moduleSyntax.ok, `Epic 13 Package Export Lock module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 13 Package Export Lock suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(captureSyntax.ok, `Pack dry-run capture script syntax passes${captureSyntax.ok ? '' : ` (${captureSyntax.message})`}`);
  context.assert(plan.schema === EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA, 'Package export lock exposes stable schema');
  context.assert(plan.reportSchema === EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA, 'Package export lock exposes report schema');
  context.assert(plan.surfaceSchema === EPIC13_PACKAGE_EXPORT_SURFACE_SCHEMA, 'Package export lock exposes surface schema');
  context.assert(plan.dryRunArtifactSchema === EPIC13_PACKAGE_DRY_RUN_ARTIFACT_SCHEMA, 'Package export lock exposes dry-run artifact schema');
  context.assert(plan.workpackage === EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE, 'Package export lock belongs to WP-E13-04');
  context.assert(plan.status === EPIC13_PACKAGE_EXPORT_LOCK_STATUS, 'Package export lock is accepted');
  context.assert(plan.targetReadiness === EPIC13_PACKAGE_EXPORT_LOCK_TARGET, 'Package export lock target is ready');
  context.assert(plan.sourceValidationOk === true && plan.sourceReportOk === true, 'Package export lock consumes conditional network evidence');
  context.assert(plan.packagePrivate === true, 'Package export lock keeps package private');
  context.assert(plan.packageDryRunCommand === PACKAGE_DRY_RUN_COMMAND, 'Package dry-run command remains stable');
  context.assert(plan.packageDryRunJsonCommand === PACKAGE_DRY_RUN_JSON_COMMAND, 'Package dry-run JSON command is documented');
  context.assert(plan.captureScript === EPIC13_PACKAGE_EXPORT_LOCK_CAPTURE_SCRIPT, 'Package export lock exposes capture script');
  context.assert(plan.packageDryRunArtifact === PACKAGE_DRY_RUN_ARTIFACT, 'Package export lock exposes dry-run artifact path');
  context.assert(plan.packageExportSurfaceArtifact === PACKAGE_EXPORT_SURFACE_ARTIFACT, 'Package export lock exposes surface artifact path');
  context.assert(plan.packageExportLockReportArtifact === PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT, 'Package export lock exposes report artifact path');
  context.assert(plan.artifactRequiredForRc1 === true, 'Package export lock requires artifact for RC1');
  context.assert(plan.localGateRequiresNpmPackExecution === false, 'Package export lock local gate stays static');
  context.assert(plan.nextWorkpackage === 'WP-E13-13', 'Package export lock hands off to WP-E13-09 after visual owner artifact normalization');
  context.assert(plan.nextDecision === 'rc1-gate-matrix-ci-handoff', 'Package export lock hands off to RMT-first production readiness bundling');
  context.assert(plan.publishBoundary === PUBLISH_BOUNDARY, 'Package export lock keeps publish boundary');
  context.assert(plan.publishAllowed === false, 'Package export lock keeps publish blocked');
  context.assert(validation.schema === EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA, 'Package export lock validator emits report schema');
  context.assert(validation.ok === true, 'Package export lock plan validates');
  context.assert(report.ok === true, 'Package export lock report validates');
  context.assert(report.exportCount === EXPECTED_EXPORT_KEYS.length, 'Package export lock report counts locked exports');
  context.assert(report.missingExpectedExports.length === 0, 'Package export lock has no missing expected exports');
  context.assert(report.unexpectedExports.length === 0, 'Package export lock has no unexpected exports');
  context.assert(artifactSummary.schema === EPIC13_PACKAGE_DRY_RUN_ARTIFACT_SCHEMA, 'Pack dry-run artifact summary exposes schema');
  context.assert(artifactSummary.missingRequiredRoots.length === 0, 'Synthetic pack dry-run artifact covers all required roots');
  context.assert(artifactValidation.ok === true, 'Package export lock validates with a pack dry-run artifact');
  assertIncludesAll(context, plan.expectedExportKeys, EXPECTED_EXPORT_KEYS, 'Expected export keys');
  assertIncludesAll(context, plan.requiredPackRoots, REQUIRED_PACK_ROOTS, 'Required pack roots');
  context.assert(plan.surfaceSnapshot.schema === EPIC13_PACKAGE_EXPORT_SURFACE_SCHEMA, 'Surface snapshot exposes schema');
  context.assert(plan.surfaceSnapshot.exportCount === EXPECTED_EXPORT_KEYS.length, 'Surface snapshot locks export count');
  context.assert(plan.surfaceSnapshot.missingExpectedExports.length === 0, 'Surface snapshot has no missing exports');
  context.assert(plan.surfaceSnapshot.unexpectedExports.length === 0, 'Surface snapshot has no unexpected exports');
  context.assert(plan.surfaceSnapshot.missingRequiredPackRoots.length === 0, 'Surface snapshot has no missing package roots');
  context.assert(plan.surfaceSnapshot.uncoveredExportTargets.length === 0, 'Surface snapshot has no export targets outside package files');
  context.assert(plan.surfaceSnapshot.externalExportTargets.length === 0, 'Surface snapshot has no external export targets');
  context.assert(plan.surfaceSnapshot.surfaceGroups.length === SURFACE_GROUPS.length, 'Surface snapshot exposes all surface groups');
  context.assert(plan.surfaceSnapshot.surfaceGroups.every((group) => group.ok), 'All package surface groups are complete');

  context.assert(packageManifest.private === true, 'Package remains private for package export lock');
  context.assert(packageManifest.exports['./catalog/epic13-package-export-lock'] === './catalog/epic13-package-export-lock.js', 'Package exports package export lock module');
  context.assert(packageManifest.exports['./catalog/epic13-known-residual-triage'] === './catalog/epic13-known-residual-triage.js', 'Package exports known residual triage module');
  context.assert(packageManifest.exports['./catalog/epic13-hydration-performance-closure'] === './catalog/epic13-hydration-performance-closure.js', 'Package exports hydration performance closure module');
  context.assert(packageManifest.exports['./catalog/epic13-prod-browser-csp-smoke'] === './catalog/epic13-prod-browser-csp-smoke.js', 'Package exports PROD Browser CSP smoke module');
  context.assert(packageManifest.exports['./catalog/epic13-visual-owner-artifact'] === './catalog/epic13-visual-owner-artifact.js', 'Package exports visual owner artifact module');
  context.assert(packageManifest.scripts['test:epic13-package-export-lock'] === 'node scripts/run_xtend_tests.js epic13-package-export-lock', 'Package exposes package export lock script');
  context.assert(packageManifest.scripts['pack:dry-run:report'] === 'node scripts/capture_pack_dry_run.js', 'Package exposes pack dry-run report script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC13_PACKAGE_EXPORT_LOCK_PACKAGE_SCRIPT), 'Package release gates include package export lock script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_PACKAGE_EXPORT_LOCK_PACKAGE_SCRIPT), 'Release checklist metadata includes package export lock script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_PACKAGE_EXPORT_LOCK_CAPTURE_SCRIPT), 'Release checklist metadata includes pack dry-run capture script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_PACKAGE_EXPORT_LOCK_CONTRACT), 'Artifact checklist includes package export lock contract');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT), 'Artifact checklist includes package export lock report');
  context.assert(metadata && metadata.schema === EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA, 'Package metadata exposes package export lock schema');
  context.assert(metadata && metadata.workpackage === EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE, 'Package metadata exposes WP-E13-04');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-E13-13', 'Package metadata exposes next workpackage');
  context.assert(metadata && metadata.expectedExportCount === EXPECTED_EXPORT_KEYS.length, 'Package metadata exposes expected export count');
  context.assert(ownerMetadata && ownerMetadata.nextWorkpackage === 'WP-E13-13', 'Owner acceptance metadata now hands off to WP-E13-09');
  context.assert(networkMetadata && networkMetadata.nextWorkpackage === 'WP-E13-13', 'Network evidence metadata now hands off to WP-E13-09');
  context.assert(rc1Metadata && rc1Metadata.nextWorkpackage === 'WP-E13-13', 'RC1 readiness metadata now hands off to WP-E13-09');
  context.assertIncludes(scaffoldConfig, 'epic13PackageExportLock', 'Scaffold config exposes package export lock metadata');
  context.assertIncludes(scaffoldConfig, EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA, 'Scaffold config declares package export lock schema');
  context.assertIncludes(scaffoldConfig, EPIC13_PACKAGE_EXPORT_LOCK_LOCAL_GATE, 'Scaffold config references package export lock gate');
  context.assertIncludes(scaffoldConfig, 'nextWorkpackage: "WP-E13-13"', 'Scaffold config advances Epic 13 handoff');
  context.assertIncludes(runner, "id: 'epic13-package-export-lock'", 'Runner registers package export lock suite');

  assertTextIncludesAll(context, steering, [
    EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA,
    '| `WP-E13-04` | P0 | completed | WS1 | Package Dry Run Artefakt und Export-Surface-Lock bauen |',
    '| `WP-E13-05` | P0 | completed | WS2 | RC0 Known Residuals fuer RC1 triagieren |',
    '| `WP-E13-06` | P0 | completed | WS2 | Hydration Performance Warning schliessen oder RC1 Owner-Entscheid bauen |',
    '| `WP-E13-07` | P1 | completed | WS3 | PROD-nahe Browser-, Local-Server- und CSP-Smokes vorbereiten |',
    '| `WP-E13-08` | P1 | completed | WS3 | Visual Screenshot/Pixels als RC1-Artefakt normalisieren |',
    '| `WP-E13-09` | P1 | completed | WS4 | RMT-first App Production Readiness Gate buendeln |',
    'Handoff nach WP-E13-04',
    PACKAGE_DRY_RUN_ARTIFACT,
    PACKAGE_EXPORT_SURFACE_ARTIFACT
  ], 'Epic 13 steering document');
  assertTextIncludesAll(context, contractDoc, [
    EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA,
    EPIC13_PACKAGE_EXPORT_SURFACE_SCHEMA,
    EPIC13_PACKAGE_DRY_RUN_ARTIFACT_SCHEMA,
    EPIC13_PACKAGE_EXPORT_LOCK_LOCAL_GATE,
    EPIC13_PACKAGE_EXPORT_LOCK_CAPTURE_SCRIPT,
    PACKAGE_DRY_RUN_ARTIFACT,
    PACKAGE_EXPORT_SURFACE_ARTIFACT,
    'WP-E13-09'
  ], 'Package export lock contract doc');
  assertTextIncludesAll(context, workpackage, [
    'xtend.epic13.wp04.package-export-lock.v1',
    'Status: `completed`',
    EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA,
    EPIC13_PACKAGE_EXPORT_LOCK_LOCAL_GATE,
    EPIC13_PACKAGE_EXPORT_LOCK_CAPTURE_SCRIPT,
    'WP-E13-09'
  ], 'WP-E13-04 workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA,
    EPIC13_PACKAGE_EXPORT_LOCK_LOCAL_GATE,
    EPIC13_PACKAGE_EXPORT_LOCK_CAPTURE_SCRIPT,
    'Loader',
    'Components',
    'Fabric',
    'XTendRMT',
    'Builder',
    'Docs'
  ], 'Package export lock docs');
  assertTextIncludesAll(context, rc1Docs, [
    'Package Export Lock',
    'WP-E13-09',
    './hydration-performance-closure.md'
  ], 'RC1 readiness docs handoff');
  assertTextIncludesAll(context, ownerDocs, [
    'xtend.epic13.package-export-lock.v1',
    'WP-E13-09',
    './hydration-performance-closure.md'
  ], 'Owner acceptance docs handoff');
  assertTextIncludesAll(context, networkDocs, [
    'WP-E13-04',
    'WP-E13-09',
    './package-export-lock.md'
  ], 'Network evidence docs handoff');
  assertTextIncludesAll(context, registry, [
    EPIC13_PACKAGE_EXPORT_LOCK_MODULE,
    EPIC13_PACKAGE_EXPORT_LOCK_CONTRACT,
    EPIC13_PACKAGE_EXPORT_LOCK_DOCS,
    EPIC13_PACKAGE_EXPORT_LOCK_SUITE,
    EPIC13_PACKAGE_EXPORT_LOCK_LOCAL_GATE
  ], 'Reference registry');
  assertTextIncludesAll(context, releaseChecklist, [
    'npm run test:epic13-package-export-lock',
    'npm run pack:dry-run:report',
    EPIC13_PACKAGE_EXPORT_LOCK_CONTRACT,
    PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT
  ], 'Release checklist');
  assertTextIncludesAll(context, ciMatrix, [
    EPIC13_PACKAGE_EXPORT_LOCK_LOCAL_GATE,
    'Package Export Lock'
  ], 'CI gate matrix');
  assertTextIncludesAll(context, packageStrategy, [
    EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA,
    'npm run pack:dry-run:report',
    PACKAGE_EXPORT_SURFACE_ARTIFACT
  ], 'Package strategy');
  assertTextIncludesAll(context, enterpriseAdoption, [
    EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA,
    './package-export-lock.md',
    'pack:dry-run:report'
  ], 'Enterprise adoption docs');
  context.assertIncludes(docsReadme, './package-export-lock.md', 'Docs README links package export lock');
  context.assertIncludes(docsMenu, 'package-export-lock', 'Docs menu exposes package export lock');
  context.assertIncludes(testsReadme, EPIC13_PACKAGE_EXPORT_LOCK_LOCAL_GATE, 'Tests README documents package export lock gate');
  context.assertIncludes(readme, 'xtend.epic13PackageExportLock', 'Root README documents package export lock metadata');
  context.assertIncludes(changelog, EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA, 'Changelog records package export lock contract');

  return context.result({
    report: {
      schema: EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA,
      exportCount: report.exportCount,
      packageFileRootCount: report.packageFileRootCount,
      surfaceGroupCount: report.surfaceGroupCount,
      publishAllowed: report.publishAllowed,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13PackageExportLockReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 13 Package Export Lock erfolgreich.',
    failureTitle: 'Epic 13 Package Export Lock fehlgeschlagen:'
  });
}

module.exports = {
  printEpic13PackageExportLockReport,
  runEpic13PackageExportLockSuite
};

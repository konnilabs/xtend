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
  DETERMINISTIC_VIEWPORTS,
  EPIC13_VISUAL_OWNER_ARTIFACT_CONTRACT,
  EPIC13_VISUAL_OWNER_ARTIFACT_DOCS,
  EPIC13_VISUAL_OWNER_ARTIFACT_LOCAL_GATE,
  EPIC13_VISUAL_OWNER_ARTIFACT_MANIFEST_SCHEMA,
  EPIC13_VISUAL_OWNER_ARTIFACT_MODULE,
  EPIC13_VISUAL_OWNER_ARTIFACT_PACKAGE_SCRIPT,
  EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA,
  EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
  EPIC13_VISUAL_OWNER_ARTIFACT_STATUS,
  EPIC13_VISUAL_OWNER_ARTIFACT_STEERING,
  EPIC13_VISUAL_OWNER_ARTIFACT_SUITE,
  EPIC13_VISUAL_OWNER_ARTIFACT_TARGET,
  EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE,
  EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE_DOC,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_SOURCE_GATES,
  VISUAL_OWNER_ARTIFACT_MANIFEST,
  VISUAL_OWNER_ARTIFACT_PATH_TEMPLATE,
  VISUAL_OWNER_ARTIFACT_REPORT,
  VISUAL_OWNER_ARTIFACT_ROOT,
  createEpic13VisualOwnerArtifactPlan,
  createEpic13VisualOwnerArtifactReport,
  validateEpic13VisualOwnerArtifactPlan
} = require('../../catalog/epic13-visual-owner-artifact');

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

function runEpic13VisualOwnerArtifactSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-visual-owner-artifact',
    label: 'Epic 13 Visual Owner Artifact'
  });
  const plan = createEpic13VisualOwnerArtifactPlan({ rootDir });
  const validation = validateEpic13VisualOwnerArtifactPlan(plan);
  const report = createEpic13VisualOwnerArtifactReport({ rootDir, plan });
  const manifest = readJson(VISUAL_OWNER_ARTIFACT_MANIFEST, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13VisualOwnerArtifact;
  const rc1Metadata = packageManifest.xtend && packageManifest.xtend.epic13Rc1Readiness;
  const ownerMetadata = packageManifest.xtend && packageManifest.xtend.epic13ReleaseOwnerAcceptance;
  const networkMetadata = packageManifest.xtend && packageManifest.xtend.epic13ConditionalNetworkEvidence;
  const packageLockMetadata = packageManifest.xtend && packageManifest.xtend.epic13PackageExportLock;
  const hydrationMetadata = packageManifest.xtend && packageManifest.xtend.epic13HydrationPerformanceClosure;
  const prodCspMetadata = packageManifest.xtend && packageManifest.xtend.epic13ProdBrowserCspSmoke;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const steering = readText(EPIC13_VISUAL_OWNER_ARTIFACT_STEERING, rootDir);
  const contractDoc = readText(EPIC13_VISUAL_OWNER_ARTIFACT_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_VISUAL_OWNER_ARTIFACT_DOCS, rootDir);
  const visualAutomationDocs = readText('docs/visual-snapshot-automation.md', rootDir);
  const prodCspDocs = readText('docs/prod-browser-csp-smokes.md', rootDir);
  const rc1Docs = readText('docs/rc1-readiness.md', rootDir);
  const ownerDocs = readText('docs/release-owner-acceptance.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const packageExportContract = readText('development/XTend-Epic13-Package-Export-Lock-Contract.md', rootDir);
  const enterpriseAdoption = readText('docs/enterprise-adoption.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const readme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_VISUAL_OWNER_ARTIFACT_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_VISUAL_OWNER_ARTIFACT_SUITE, { rootDir, extension: '.js' });

  [
    EPIC13_VISUAL_OWNER_ARTIFACT_MODULE,
    EPIC13_VISUAL_OWNER_ARTIFACT_SUITE,
    EPIC13_VISUAL_OWNER_ARTIFACT_STEERING,
    EPIC13_VISUAL_OWNER_ARTIFACT_CONTRACT,
    EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE_DOC,
    EPIC13_VISUAL_OWNER_ARTIFACT_DOCS,
    VISUAL_OWNER_ARTIFACT_MANIFEST
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required visual owner artifact doc`);
  });

  context.assert(moduleSyntax.ok, `Epic 13 Visual Owner Artifact module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 13 Visual Owner Artifact suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA, 'Visual owner artifact exposes stable schema');
  context.assert(plan.manifestSchema === EPIC13_VISUAL_OWNER_ARTIFACT_MANIFEST_SCHEMA, 'Visual owner artifact exposes manifest schema');
  context.assert(plan.reportSchema === EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA, 'Visual owner artifact exposes report schema');
  context.assert(plan.workpackage === EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE, 'Visual owner artifact belongs to WP-E13-08');
  context.assert(plan.status === EPIC13_VISUAL_OWNER_ARTIFACT_STATUS, 'Visual owner artifact is accepted');
  context.assert(plan.sourceSchema === 'xtend.epic13.prod-browser-csp-smoke.v1', 'Visual owner artifact consumes PROD browser CSP smoke');
  context.assert(plan.sourceValidationOk === true && plan.sourceReportOk === true, 'Visual owner artifact consumes valid PROD browser CSP smoke');
  context.assert(plan.visualSnapshotValidationOk === true, 'Visual owner artifact consumes valid visual snapshot run');
  context.assert(plan.targetReadiness === EPIC13_VISUAL_OWNER_ARTIFACT_TARGET, 'Visual owner artifact target is normalized');
  context.assert(plan.artifactRoot === VISUAL_OWNER_ARTIFACT_ROOT, 'Visual owner artifact exposes artifact root');
  context.assert(plan.artifactManifest === VISUAL_OWNER_ARTIFACT_MANIFEST, 'Visual owner artifact exposes manifest path');
  context.assert(plan.reportPath === VISUAL_OWNER_ARTIFACT_REPORT, 'Visual owner artifact exposes report path');
  context.assert(plan.screenshotPathTemplate === VISUAL_OWNER_ARTIFACT_PATH_TEMPLATE, 'Visual owner artifact exposes screenshot path template');
  context.assert(plan.snapshotCount === 5 && plan.familyCount === 5, 'Visual owner artifact preserves five family snapshots');
  context.assert(plan.componentCount === 17, 'Visual owner artifact preserves component coverage');
  context.assert(plan.matrixCombinationCount === 360, 'Visual owner artifact preserves matrix coverage');
  context.assert(plan.domDiffCount === 0, 'Visual owner artifact is backed by clean DOM diff');
  context.assert(plan.captureEntries.length === 5, 'Visual owner artifact defines five capture entries');
  context.assert(plan.deterministicViewports.length === DETERMINISTIC_VIEWPORTS.length, 'Visual owner artifact defines deterministic viewports');
  context.assert(plan.localGateMode === 'static-artifact-manifest-plus-dom-snapshot-gate', 'Visual owner artifact local gate is manifest plus DOM snapshot gate');
  context.assert(plan.ownerArtifactMode === 'optional-browser-driver-or-ci-artifact', 'Visual owner artifact keeps screenshots as owner artifact');
  context.assert(plan.pixelDiffMode === 'optional-owner-artifact-pixel-diff', 'Visual owner artifact normalizes optional pixel diff mode');
  context.assert(plan.pixelDiffRequiredInLocalGate === false && plan.screenshotRequiredInLocalGate === false, 'Visual owner artifact keeps pixel and screenshot capture optional locally');
  context.assert(plan.binaryBaselineCommitted === false, 'Visual owner artifact does not commit binary baselines');
  context.assert(plan.externalBrowserRequiredInLocalGate === false && plan.externalNetworkAllowedInLocalGate === false, 'Visual owner artifact local gate has no external browser or network dependency');
  context.assert(plan.nextWorkpackage === 'WP-E13-13', 'Visual owner artifact makes WP-E13-09 ready');
  context.assert(plan.nextDecision === 'rc1-gate-matrix-ci-handoff', 'Visual owner artifact hands off to RMT-first production readiness bundling');
  context.assert(plan.publishBoundary === PUBLISH_BOUNDARY, 'Visual owner artifact keeps publish boundary');
  context.assert(plan.publishAllowed === false, 'Visual owner artifact keeps publish blocked');
  context.assert(validation.schema === EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA, 'Visual owner artifact validator emits report schema');
  context.assert(validation.ok === true, 'Visual owner artifact plan validates');
  context.assert(report.ok === true, 'Visual owner artifact report validates');
  context.assert(report.captureEntryCount === 5, 'Visual owner artifact report counts capture entries');
  assertIncludesAll(context, plan.sourceGates, REQUIRED_SOURCE_GATES, 'Visual owner artifact source gates');

  context.assert(manifest.schema === EPIC13_VISUAL_OWNER_ARTIFACT_MANIFEST_SCHEMA, 'Manifest declares visual owner artifact schema');
  context.assert(manifest.artifactRoot === VISUAL_OWNER_ARTIFACT_ROOT, 'Manifest mirrors artifact root');
  context.assert(manifest.reportPath === VISUAL_OWNER_ARTIFACT_REPORT, 'Manifest mirrors report path');
  context.assert(manifest.screenshotPathTemplate === VISUAL_OWNER_ARTIFACT_PATH_TEMPLATE, 'Manifest mirrors screenshot path template');
  context.assert(manifest.fixture === plan.fixture, 'Manifest mirrors visual snapshot fixture');
  context.assert(manifest.domBaseline === plan.domBaseline, 'Manifest mirrors DOM baseline');
  context.assert(manifest.localGateMode === plan.localGateMode, 'Manifest mirrors local gate mode');
  context.assert(manifest.ownerArtifactMode === plan.ownerArtifactMode, 'Manifest mirrors owner artifact mode');
  context.assert(manifest.pixelDiffRequiredInLocalGate === false && manifest.screenshotRequiredInLocalGate === false, 'Manifest keeps local pixel and screenshot capture optional');
  context.assert(manifest.binaryBaselineCommitted === false, 'Manifest rejects binary baseline commits');
  context.assert(manifest.deterministicViewports.length === 3, 'Manifest defines three deterministic viewports');
  context.assert(manifest.captures.length === plan.captureEntries.length, 'Manifest mirrors capture entry count');
  plan.captureEntries.forEach((entry) => {
    context.assert(manifest.captures.some((candidate) => (
      candidate.id === entry.id
        && candidate.family === entry.family
        && candidate.sourceSnapshot === entry.sourceSnapshot
        && candidate.artifactPathTemplate === entry.artifactPathTemplate
    )), `Manifest contains capture entry ${entry.id}`);
  });

  context.assert(packageManifest.private === false, 'Package is public-ready for visual owner artifact');
  context.assert((packageManifest.exports['./catalog/epic13-visual-owner-artifact'] === './catalog/epic13-visual-owner-artifact.js' || (packageManifest.exports['./catalog/epic13-visual-owner-artifact'] && packageManifest.exports['./catalog/epic13-visual-owner-artifact'].default === './catalog/epic13-visual-owner-artifact.js')), 'Package exports visual owner artifact module');
  context.assert(packageManifest.scripts['test:epic13-visual-owner-artifact'] === 'node scripts/run_xtend_tests.js epic13-visual-owner-artifact', 'Package exposes visual owner artifact script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC13_VISUAL_OWNER_ARTIFACT_PACKAGE_SCRIPT), 'Package release gates include visual owner artifact script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_VISUAL_OWNER_ARTIFACT_PACKAGE_SCRIPT), 'Release checklist metadata includes visual owner artifact script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_VISUAL_OWNER_ARTIFACT_CONTRACT), 'Artifact checklist includes visual owner artifact contract');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(VISUAL_OWNER_ARTIFACT_MANIFEST), 'Artifact checklist includes visual owner artifact manifest');
  context.assert(metadata && metadata.schema === EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA, 'Package metadata exposes visual owner artifact schema');
  context.assert(metadata && metadata.manifestSchema === EPIC13_VISUAL_OWNER_ARTIFACT_MANIFEST_SCHEMA, 'Package metadata exposes visual owner artifact manifest schema');
  context.assert(metadata && metadata.workpackage === EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE, 'Package metadata exposes WP-E13-08');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-E13-13', 'Package metadata exposes next workpackage');
  context.assert(metadata && metadata.pixelDiffRequiredInLocalGate === false, 'Package metadata keeps pixel diff optional locally');
  context.assert(metadata && metadata.publishAllowed === false, 'Package metadata blocks visual owner artifact publish');
  [
    rc1Metadata,
    ownerMetadata,
    networkMetadata,
    packageLockMetadata,
    hydrationMetadata,
    prodCspMetadata
  ].forEach((entry) => {
    context.assert(entry && entry.nextWorkpackage === 'WP-E13-13', `${entry && entry.schema ? entry.schema : 'Epic 13 metadata'} hands off to WP-E13-09`);
    context.assert(entry && entry.nextDecision === 'rc1-gate-matrix-ci-handoff', `${entry && entry.schema ? entry.schema : 'Epic 13 metadata'} hands off to RMT-first production readiness`);
  });
  context.assert(packageLockMetadata && packageLockMetadata.expectedExportCount === 123, 'Package export lock metadata includes RC1 gate matrix and kernel exports');
  context.assertIncludes(scaffoldConfig, 'epic13VisualOwnerArtifact', 'Scaffold config exposes visual owner artifact metadata');
  context.assertIncludes(scaffoldConfig, EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA, 'Scaffold config declares visual owner artifact schema');
  context.assertIncludes(scaffoldConfig, EPIC13_VISUAL_OWNER_ARTIFACT_LOCAL_GATE, 'Scaffold config references visual owner artifact local gate');
  context.assertIncludes(scaffoldConfig, 'expectedExportCount: 123', 'Scaffold config updates package export count');
  context.assertIncludes(runner, "id: 'epic13-visual-owner-artifact'", 'Runner registers visual owner artifact suite');

  assertTextIncludesAll(context, steering, [
    EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
    '| `WP-E13-08` | P1 | completed | WS3 | Visual Screenshot/Pixels als RC1-Artefakt normalisieren |',
    '| `WP-E13-09` | P1 | completed | WS4 | RMT-first App Production Readiness Gate buendeln |',
    'Handoff nach WP-E13-08',
    'rmt-first-production-readiness-bundling'
  ], 'Epic 13 steering document');
  assertTextIncludesAll(context, contractDoc, [
    EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
    EPIC13_VISUAL_OWNER_ARTIFACT_MANIFEST_SCHEMA,
    EPIC13_VISUAL_OWNER_ARTIFACT_LOCAL_GATE,
    VISUAL_OWNER_ARTIFACT_MANIFEST,
    VISUAL_OWNER_ARTIFACT_PATH_TEMPLATE,
    'optional-browser-driver-or-ci-artifact',
    'WP-E13-09'
  ], 'Visual owner artifact contract doc');
  assertTextIncludesAll(context, workpackage, [
    'xtend.epic13.wp08.visual-owner-artifact.v1',
    'Status: `completed`',
    EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
    EPIC13_VISUAL_OWNER_ARTIFACT_LOCAL_GATE,
    VISUAL_OWNER_ARTIFACT_MANIFEST,
    'WP-E13-09'
  ], 'WP-E13-08 workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
    EPIC13_VISUAL_OWNER_ARTIFACT_LOCAL_GATE,
    VISUAL_OWNER_ARTIFACT_MANIFEST,
    VISUAL_OWNER_ARTIFACT_PATH_TEMPLATE,
    'optional-browser-driver-or-ci-artifact',
    './visual-snapshot-automation.md',
    './prod-browser-csp-smokes.md',
    PUBLISH_BOUNDARY
  ], 'Visual owner artifact docs');
  assertTextIncludesAll(context, visualAutomationDocs, [
    EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
    './visual-owner-artifacts.md',
    VISUAL_OWNER_ARTIFACT_MANIFEST
  ], 'Visual snapshot automation docs');
  assertTextIncludesAll(context, prodCspDocs, [
    './visual-owner-artifacts.md',
    'WP-E13-09'
  ], 'PROD browser CSP docs handoff');
  assertTextIncludesAll(context, rc1Docs, [
    EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
    './visual-owner-artifacts.md',
    'WP-E13-09'
  ], 'RC1 readiness docs');
  assertTextIncludesAll(context, ownerDocs, [
    EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
    './visual-owner-artifacts.md',
    'visual-owner-artifact'
  ], 'Owner acceptance docs');
  assertTextIncludesAll(context, registry, [
    EPIC13_VISUAL_OWNER_ARTIFACT_MODULE,
    EPIC13_VISUAL_OWNER_ARTIFACT_CONTRACT,
    EPIC13_VISUAL_OWNER_ARTIFACT_DOCS,
    EPIC13_VISUAL_OWNER_ARTIFACT_SUITE,
    EPIC13_VISUAL_OWNER_ARTIFACT_LOCAL_GATE,
    VISUAL_OWNER_ARTIFACT_MANIFEST
  ], 'Reference registry');
  assertTextIncludesAll(context, releaseChecklist, [
    EPIC13_VISUAL_OWNER_ARTIFACT_PACKAGE_SCRIPT,
    EPIC13_VISUAL_OWNER_ARTIFACT_CONTRACT,
    VISUAL_OWNER_ARTIFACT_MANIFEST,
    'Visual Owner Artifact'
  ], 'Release checklist');
  assertTextIncludesAll(context, ciMatrix, [
    EPIC13_VISUAL_OWNER_ARTIFACT_LOCAL_GATE,
    'Visual Owner Artifact'
  ], 'CI gate matrix');
  assertTextIncludesAll(context, packageExportContract, [
    './catalog/epic13-visual-owner-artifact',
    'expectedExportCount: `123`'
  ], 'Package export lock contract');
  assertTextIncludesAll(context, enterpriseAdoption, [
    EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA,
    './visual-owner-artifacts.md',
    'optional-browser-driver-or-ci-artifact'
  ], 'Enterprise adoption docs');
  context.assertIncludes(docsReadme, './visual-owner-artifacts.md', 'Docs README links visual owner artifacts');
  context.assertIncludes(docsMenu, 'visual-owner-artifacts', 'Docs menu exposes visual owner artifacts');
  context.assertIncludes(testsReadme, EPIC13_VISUAL_OWNER_ARTIFACT_LOCAL_GATE, 'Tests README documents visual owner artifact gate');
  context.assertIncludes(readme, 'xtend.epic13VisualOwnerArtifact', 'Root README documents visual owner artifact metadata');
  context.assertIncludes(changelog, EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA, 'Changelog records visual owner artifact contract');

  return context.result({
    report: {
      schema: EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA,
      artifactManifest: report.artifactManifest,
      captureEntryCount: report.captureEntryCount,
      snapshotCount: report.snapshotCount,
      matrixCombinationCount: report.matrixCombinationCount,
      pixelDiffRequiredInLocalGate: report.pixelDiffRequiredInLocalGate,
      screenshotRequiredInLocalGate: report.screenshotRequiredInLocalGate,
      publishAllowed: report.publishAllowed,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13VisualOwnerArtifactReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 13 Visual Owner Artifact erfolgreich.',
    failureTitle: 'Epic 13 Visual Owner Artifact fehlgeschlagen:'
  });
}

module.exports = {
  printEpic13VisualOwnerArtifactReport,
  runEpic13VisualOwnerArtifactSuite
};

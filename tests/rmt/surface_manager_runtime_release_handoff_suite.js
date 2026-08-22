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
  COMPATIBILITY_FIXTURES,
  KERNEL_BOUNDARY,
  OPEN_SCOPES,
  PRODUCTIVE_RUNTIME_CLAIMS,
  RELEASE_GATES,
  REQUIRED_ARTIFACTS,
  SURFACE_MANAGER_RUNTIME_COMPATIBILITY_NOTES_SCHEMA,
  SURFACE_MANAGER_RUNTIME_MIGRATION_NOTES_SCHEMA,
  SURFACE_MANAGER_RUNTIME_RELEASE_GATE_MATRIX_SCHEMA,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_BACKLOG,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_CONTRACT,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_DOCS,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_LOCAL_GATE,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_MODULE,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_PACKAGE_SCRIPT,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_REPORT_SCHEMA,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SCHEMA,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_STATUS,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SUITE,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_TARGET,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE_DOC,
  UPDATED_GUIDES,
  createSurfaceManagerRuntimeReleaseHandoffPlan,
  createSurfaceManagerRuntimeReleaseHandoffReport,
  validateSurfaceManagerRuntimeReleaseHandoffPlan
} = require('../../catalog/surface-manager-runtime-release-handoff');

const REQUIRED_RUNTIME_METADATA = Object.freeze([
  ['surfaceManagerAdapterRuntime', 'WP-SM-10', 'surface-adapter-runtime'],
  ['surfaceManagerMaterialization', 'WP-SM-11', 'surface-native-materialization'],
  ['surfaceManagerPersistence', 'WP-SM-12', 'surface-persistence'],
  ['surfaceManagerLazyLoading', 'WP-SM-13', 'surface-lazy-hydration'],
  ['surfaceManagerRouteLifecycle', 'WP-SM-14', 'surface-route-lifecycle'],
  ['surfaceManagerStackPolicy', 'WP-SM-15', 'surface-stack-policy'],
  ['surfaceManagerLayoutEngines', 'WP-SM-16', 'surface-layout-engines'],
  ['surfaceManagerRemotePolicy', 'WP-SM-17', 'surface-remote-policy'],
  ['surfaceManagerBrowserLab', 'WP-SM-18', 'surface-browser-lab']
]);

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

function runSurfaceManagerRuntimeReleaseHandoffSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-runtime-release-handoff',
    label: 'SurfaceManager productive runtime release handoff'
  });
  const plan = createSurfaceManagerRuntimeReleaseHandoffPlan({ rootDir });
  const validation = validateSurfaceManagerRuntimeReleaseHandoffPlan(plan);
  const report = createSurfaceManagerRuntimeReleaseHandoffReport({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerRuntimeReleaseHandoff;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_BACKLOG, rootDir);
  const contractDoc = readText(SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_CONTRACT, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE_DOC, rootDir);
  const releaseDocs = readText(SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_DOCS, rootDir);
  const authoringGuide = readText('docs/en/surface-manager-authoring-guide.md', rootDir);
  const migrationGuide = readText('docs/en/surface-manager-migration-guide.md', rootDir);
  const previousReleaseDocs = readText('development/docs-evidence/root/surface-manager-release-handoff.md', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const rmtReadme = readText('tests/rmt/README.md', rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as runtime release handoff artifact`);
  });

  [
    SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_MODULE,
    SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SUITE,
    'scripts/run_xtend_tests.js'
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SCHEMA, 'Runtime release handoff schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_REPORT_SCHEMA, 'Runtime release handoff report schema is stable');
  context.assert(plan.migrationNotesSchema === SURFACE_MANAGER_RUNTIME_MIGRATION_NOTES_SCHEMA, 'Runtime migration notes schema is stable');
  context.assert(plan.releaseGateMatrixSchema === SURFACE_MANAGER_RUNTIME_RELEASE_GATE_MATRIX_SCHEMA, 'Runtime release gate matrix schema is stable');
  context.assert(plan.compatibilityNotesSchema === SURFACE_MANAGER_RUNTIME_COMPATIBILITY_NOTES_SCHEMA, 'Runtime compatibility notes schema is stable');
  context.assert(plan.workpackage === SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE, 'Runtime release handoff belongs to WP-SM-19');
  context.assert(plan.status === SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_STATUS, 'Runtime release handoff status is accepted');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_TARGET, 'Runtime release handoff target is ready');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Runtime release handoff keeps kernel boundary');
  context.assert(validation.ok === true, 'Runtime release handoff plan validates');
  context.assert(report.ok === true, 'Runtime release handoff report validates');
  assertIncludesAll(context, plan.productiveRuntimeClaims, PRODUCTIVE_RUNTIME_CLAIMS, 'Productive runtime claims');
  assertIncludesAll(context, plan.releaseGates, RELEASE_GATES, 'Runtime release gates');
  assertIncludesAll(context, plan.updatedGuides, UPDATED_GUIDES, 'Updated SurfaceManager guides');
  assertIncludesAll(context, plan.compatibilityFixtures, COMPATIBILITY_FIXTURES, 'Compatibility fixtures');
  assertIncludesAll(context, plan.openScopes, OPEN_SCOPES, 'Open scopes');
  context.assert(plan.releaseDecision.productiveRuntimeClaimDocumented === true, 'Productive runtime claim is documented');
  context.assert(plan.releaseDecision.nativeSurfacesAuthoringDefault === true, 'Native surfaces are the authoring default');
  context.assert(plan.releaseDecision.componentMetadataCompatibilityKept === true, 'Component metadata compatibility is kept');
  context.assert(plan.releaseDecision.adapterRuntimeImplemented === true, 'Surface adapter runtime is implemented');
  context.assert(plan.releaseDecision.materializationImplemented === true, 'Surface materialization is implemented');
  context.assert(plan.releaseDecision.publicPublishBlockedUntilReleaseOwnerSignoff === true, 'Public publish boundary is explicit');
  context.assert(plan.runtimeBoundary.surfaceControllerSingleRegistry === true, 'SurfaceController remains the single registry');
  context.assert(plan.runtimeBoundary.replacesFabric === false, 'SurfaceManager does not replace Fabric');
  context.assert(plan.runtimeBoundary.replacesRmtKernel === false, 'SurfaceManager does not replace RMT kernel');
  context.assert(plan.runtimeBoundary.replacesState === false, 'SurfaceManager does not replace state');
  context.assert(plan.runtimeBoundary.remoteRuntimeExecutionInKernel === false, 'Remote runtime execution stays outside the RMT kernel');
  context.assert(plan.runtimeBoundary.createsSecondRegistry === false, 'Runtime handoff creates no second registry');

  REQUIRED_RUNTIME_METADATA.forEach(([key, workpackage, gate]) => {
    const entry = packageManifest.xtend && packageManifest.xtend[key];
    context.assert(entry && entry.workpackage === workpackage, `Package metadata exposes ${workpackage} via ${key}`);
    context.assert(entry && typeof entry.localGate === 'string' && entry.localGate.includes(gate), `Package metadata ${key} exposes ${gate} gate`);
  });
  context.assert(packageManifest.xtend.surfaceManagerAdapterRuntime.runtimeBoundaryClaimsProductive !== false, 'Package metadata no longer marks adapter runtime as deferred');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SCHEMA, 'Package metadata exposes runtime handoff schema');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_LOCAL_GATE, 'Package metadata exposes runtime handoff gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_PACKAGE_SCRIPT, 'Package metadata exposes runtime handoff package script');
  context.assert(metadata && metadata.productiveRuntimeClaimDocumented === true, 'Package metadata documents productive runtime claim');
  context.assert(metadata && metadata.surfaceControllerSingleRegistry === true, 'Package metadata keeps single registry');
  context.assert(metadata && metadata.replacesFabric === false, 'Package metadata keeps Fabric boundary');
  context.assert(metadata && metadata.replacesRmtKernel === false, 'Package metadata keeps RMT kernel boundary');
  context.assert(metadata && metadata.createsSecondRegistry === false, 'Package metadata keeps no-second-registry boundary');
  assertIncludesAll(context, metadata && metadata.releaseGates, RELEASE_GATES, 'Package metadata release gates');
  assertIncludesAll(context, metadata && metadata.openScopes, OPEN_SCOPES, 'Package metadata open scopes');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-runtime-release-handoff'] === 'node scripts/run_xtend_tests.js surface-runtime-release-handoff', 'Package script test:surface-runtime-release-handoff exists');
  context.assertIncludes(runner, "require('../tests/rmt/surface_manager_runtime_release_handoff_suite')", 'Runner imports runtime release handoff suite');
  context.assertIncludes(runner, "id: 'surface-runtime-release-handoff'", 'Runner registers runtime release handoff suite');

  assertTextIncludesAll(context, contractDoc, [
    SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SCHEMA,
    SURFACE_MANAGER_RUNTIME_MIGRATION_NOTES_SCHEMA,
    SURFACE_MANAGER_RUNTIME_RELEASE_GATE_MATRIX_SCHEMA,
    SURFACE_MANAGER_RUNTIME_COMPATIBILITY_NOTES_SCHEMA,
    SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_LOCAL_GATE,
    'productive-xtend-surface-adapter-runtime',
    'SurfaceController bleibt die einzige Registry',
    'SurfaceManager ersetzt weder Fabric noch den RMT Kernel',
    '0.x-minor-with-migration-notes',
    KERNEL_BOUNDARY
  ], 'Runtime release handoff contract doc');
  assertTextIncludesAll(context, workpackageDoc, [
    'Status: `completed`',
    SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SCHEMA,
    SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_LOCAL_GATE,
    'produktiver Runtime-Claim ist dokumentiert und gatebar',
    'Handoff benennt offene Scopes explizit',
    'bestehende SurfaceManager-Demos und Fixtures bleiben lauffaehig'
  ], 'Runtime release handoff workpackage doc');
  assertTextIncludesAll(context, releaseDocs, [
    '# SurfaceManager Runtime Release Handoff',
    SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SCHEMA,
    SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_LOCAL_GATE,
    'productive-xtend-surface-adapter-runtime',
    'surface-adapter-runtime',
    'surface-native-materialization',
    'surface-browser-lab',
    'project-specific-pixel-artifact-storage',
    'release-owner-signoff-before-public-npm-publish'
  ], 'Runtime release handoff docs');
  assertTextIncludesAll(context, authoringGuide, [
    'xtend.surface.record.v1',
    'destroySurface()',
    'surface-destroyed',
    'node scripts/run_xtend_tests.js surface-controller surface-manager --json'
  ], 'Public Surface authoring guide');
  assertTextIncludesAll(context, migrationGuide, [
    "openSurface('legacy-report')",
    'destroySurface()',
    'surface-controller surface-manager surface-manager-a11y',
    'Remote failure removes the local fallback.'
  ], 'Public Surface migration guide');
  assertTextIncludesAll(context, previousReleaseDocs, [
    'WP-SM-19',
    SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SCHEMA,
    'node scripts/run_xtend_tests.js surface-runtime-release-handoff --json',
    'produktive Runtime-Linie'
  ], 'Previous release handoff doc links WP-SM-19');
  context.assertIncludes(docsReadme, 'SurfaceManager Migration Guide', 'Docs README links public SurfaceManager migration guidance');
  context.assertIncludes(testsReadme, SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_LOCAL_GATE, 'Tests README documents runtime release handoff');
  context.assertIncludes(rmtReadme, SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_LOCAL_GATE, 'RMT README documents runtime release handoff');
  assertTextIncludesAll(context, backlog, [
    '`WP-SM-19` | P2 | completed',
    'Migration, Doku und Release-Handoff fuer Surface Runtime finalisieren',
    SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_LOCAL_GATE
  ], 'Backlog marks WP-SM-19 complete');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE,
      targetReadiness: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_TARGET,
      releaseGates: RELEASE_GATES.length,
      openScopes: OPEN_SCOPES.length
    }
  });
}

function printSurfaceManagerRuntimeReleaseHandoffReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Runtime Release Handoff erfolgreich.',
    failureTitle: 'SurfaceManager Runtime Release Handoff fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerRuntimeReleaseHandoffReport,
  runSurfaceManagerRuntimeReleaseHandoffSuite
};

if (require.main === module) {
  const result = runSurfaceManagerRuntimeReleaseHandoffSuite();
  printSurfaceManagerRuntimeReleaseHandoffReport(result);
  process.exit(result.ok ? 0 : 1);
}

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
  MANAGER_METHODS,
  PERSISTENCE_EVENTS,
  PERSISTENCE_MODES,
  REQUIRED_ARTIFACTS,
  RESTORE_POLICIES,
  SURFACE_MANAGER_PERSISTENCE_BACKLOG,
  SURFACE_MANAGER_PERSISTENCE_DOCS,
  SURFACE_MANAGER_PERSISTENCE_FIXTURE,
  SURFACE_MANAGER_PERSISTENCE_LOCAL_GATE,
  SURFACE_MANAGER_PERSISTENCE_MODULE,
  SURFACE_MANAGER_PERSISTENCE_PACKAGE_SCRIPT,
  SURFACE_MANAGER_PERSISTENCE_REPORT_SCHEMA,
  SURFACE_MANAGER_PERSISTENCE_SCHEMA,
  SURFACE_MANAGER_PERSISTENCE_STATUS,
  SURFACE_MANAGER_PERSISTENCE_SUITE,
  SURFACE_MANAGER_PERSISTENCE_TARGET,
  SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE,
  SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE_DOC,
  SURFACE_PERSISTED_SNAPSHOT_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  createSurfaceManagerPersistencePlan,
  createSurfaceManagerPersistenceReport,
  validateSurfaceManagerPersistencePlan
} = require('../../catalog/surface-manager-persistence');

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

function runSurfaceManagerPersistenceSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-persistence',
    label: 'SurfaceManager restore-key and snapshot persistence'
  });
  const plan = createSurfaceManagerPersistencePlan({ rootDir });
  const validation = validateSurfaceManagerPersistencePlan(plan);
  const report = createSurfaceManagerPersistenceReport({ rootDir, plan });
  const managerRuntime = readText('components/xsurfacemanager.js', rootDir);
  const managerTypes = readText('components/xsurfacemanager.d.ts', rootDir);
  const controllerRuntime = readText('components/xsurfacemanager-controller.js', rootDir);
  const fixture = readText(SURFACE_MANAGER_PERSISTENCE_FIXTURE, rootDir);
  const docs = readText(SURFACE_MANAGER_PERSISTENCE_DOCS, rootDir);
  const backlog = readText(SURFACE_MANAGER_PERSISTENCE_BACKLOG, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE_DOC, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerPersistence;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as surface persistence artifact`);
  });

  [
    SURFACE_MANAGER_PERSISTENCE_MODULE,
    SURFACE_MANAGER_PERSISTENCE_SUITE,
    'components/xsurfacemanager.js',
    'components/xsurfacemanager-controller.js'
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_PERSISTENCE_SCHEMA, 'Surface persistence schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_PERSISTENCE_REPORT_SCHEMA, 'Surface persistence report schema is stable');
  context.assert(plan.persistedSnapshotSchema === SURFACE_PERSISTED_SNAPSHOT_SCHEMA, 'Persisted snapshot schema is stable');
  context.assert(plan.snapshotSchema === SURFACE_SNAPSHOT_SCHEMA, 'Surface persistence reuses snapshot schema');
  context.assert(plan.workpackage === SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE, 'Surface persistence belongs to WP-SM-12');
  context.assert(plan.status === SURFACE_MANAGER_PERSISTENCE_STATUS, 'Surface persistence status is implemented');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_PERSISTENCE_TARGET, 'Surface persistence target readiness is stable');
  context.assert(plan.runtimeBoundary.persistenceAdapterOutsideControllerCore === true, 'Persistence adapter stays outside controller core');
  context.assert(plan.runtimeBoundary.controllerRemainsRegistryTruth === true, 'SurfaceController remains registry truth');
  context.assert(plan.runtimeBoundary.createsSecondRegistry === false, 'Surface persistence does not create a second registry');
  context.assert(plan.runtimeBoundary.storesContentPayload === false, 'Surface persistence stores no content payload');
  context.assert(validation.ok === true, 'Surface persistence plan validates');
  context.assert(report.ok === true, 'Surface persistence report validates');
  assertIncludesAll(context, plan.persistenceModes, PERSISTENCE_MODES, 'Surface persistence modes');
  assertIncludesAll(context, plan.restorePolicies, RESTORE_POLICIES, 'Surface restore policies');
  assertIncludesAll(context, plan.managerMethods, MANAGER_METHODS, 'Surface persistence manager methods');
  assertIncludesAll(context, plan.events, PERSISTENCE_EVENTS, 'Surface persistence events');

  assertTextIncludesAll(context, managerRuntime, [
    "const SURFACE_MANAGER_PERSISTENCE_SCHEMA = 'xtend.surface.manager-persistence.v1'",
    "const SURFACE_PERSISTED_SNAPSHOT_SCHEMA = 'xtend.surface.persisted-snapshot.v1'",
    'globalThis.__XTendSurfaceManagerPersistenceMemory',
    "'persistence-mode'",
    "'restore-policy'",
    'snapshotPersistence(options = {})',
    'persistSnapshot(snapshot = this.snapshot(), options = {})',
    'restorePersistedSnapshot(options = {})',
    'clearPersistedSnapshot(options = {})',
    'resetSurfaceLayout(options = {})',
    '_applyPersistedSurfaceSnapshot(snapshot, options = {})',
    'migratePersistedSnapshotEnvelope',
    'createPersistableSurfaceSnapshot',
    'noContentPayload: true',
    'surface-snapshot-persisted',
    'surface-snapshot-restored',
    'surface-restore-skipped',
    'surface-persistence-error',
    'createsSecondRegistry: false'
  ], 'x-surface-manager persistence runtime');

  assertTextIncludesAll(context, managerTypes, [
    'XSurfaceManagerPersistenceMode',
    'XSurfaceManagerRestorePolicy',
    'XSurfaceManagerPersistenceSnapshot',
    'XSurfaceManagerPersistenceResult',
    'persistence-mode',
    'restore-policy',
    'snapshotPersistence',
    'persistSnapshot',
    'restorePersistedSnapshot',
    'clearPersistedSnapshot',
    'resetSurfaceLayout',
    'surface-snapshot-restored'
  ], 'x-surface-manager persistence public types');

  context.assert(!controllerRuntime.includes('localStorage'), 'SurfaceController core does not access localStorage');
  context.assert(!controllerRuntime.includes('sessionStorage'), 'SurfaceController core does not access sessionStorage');
  context.assert(!controllerRuntime.includes('xtend.surface.persisted-snapshot.v1'), 'SurfaceController core does not own persistence envelopes');

  assertTextIncludesAll(context, fixture, [
    '<x-surface-manager',
    'restore-key="fixture.persistence.layout"',
    'persistence-mode="session"',
    'restore-policy="auto"',
    'manager.persistSnapshot',
    'manager.restorePersistedSnapshot',
    'manager.clearPersistedSnapshot',
    '__xtendComponentResult'
  ], 'Surface persistence fixture');

  assertTextIncludesAll(context, docs, [
    '# SurfaceManager Persistence',
    'restore-key',
    'persistence-mode',
    'restore-policy',
    SURFACE_PERSISTED_SNAPSHOT_SCHEMA,
    'Content-Payloads werden nicht persistiert',
    'Der SurfaceController bleibt die einzige Registry-Wahrheit'
  ], 'Surface persistence docs');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_PERSISTENCE_SCHEMA, 'Package metadata exposes surface persistence schema');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_PERSISTENCE_LOCAL_GATE, 'Package metadata exposes surface persistence gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_PERSISTENCE_PACKAGE_SCRIPT, 'Package metadata exposes surface persistence package script');
  context.assert(metadata && metadata.createsSecondRegistry === false, 'Package metadata keeps no-second-registry boundary');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-persistence'] === 'node scripts/run_xtend_tests.js surface-persistence', 'Package script test:surface-persistence exists');
  context.assertIncludes(runner, "require('../tests/components/surface_manager_persistence_suite')", 'Runner imports surface persistence suite');
  context.assertIncludes(runner, "id: 'surface-persistence'", 'Runner registers surface persistence suite');

  assertTextIncludesAll(context, backlog, [
    '`WP-SM-12` | P0 | completed',
    'Persistenz, `restore-key` und Snapshot-Hydration implementieren',
    'WP-SM-13'
  ], 'Surface persistence backlog status');
  assertTextIncludesAll(context, workpackageDoc, [
    'Status: `completed`',
    SURFACE_MANAGER_PERSISTENCE_SCHEMA,
    SURFACE_PERSISTED_SNAPSHOT_SCHEMA,
    SURFACE_MANAGER_PERSISTENCE_LOCAL_GATE,
    'no-second-surface-registry',
    'Content-Payloads werden nicht gespeichert'
  ], 'Surface persistence workpackage doc');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_PERSISTENCE_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE,
      targetReadiness: SURFACE_MANAGER_PERSISTENCE_TARGET,
      modes: PERSISTENCE_MODES.length,
      methods: MANAGER_METHODS.length,
      events: PERSISTENCE_EVENTS.length
    }
  });
}

function printSurfaceManagerPersistenceReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Persistence erfolgreich.',
    failureTitle: 'SurfaceManager Persistence fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerPersistenceReport,
  runSurfaceManagerPersistenceSuite
};

if (require.main === module) {
  const result = runSurfaceManagerPersistenceSuite();
  printSurfaceManagerPersistenceReport(result);
  process.exit(result.ok ? 0 : 1);
}

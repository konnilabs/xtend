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
  RMT_VNEXT_SURFACE_REGISTRY_SCHEMA
} = require('../../tools/rmt-language/vnext-surfaces');
const {
  RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
  RMT_VNEXT_REMOTE_SURFACE_SCHEMA
} = require('../../tools/rmt-language/vnext-remote-manifest');
const {
  ENTERPRISE_OWNER_MISSING_CODE,
  ENTERPRISE_REMOTE_MANIFEST_BLOCKED_CODE,
  ENTERPRISE_SHELL_TARGET_MISSING_CODE,
  ENTERPRISE_SURFACE_DUPLICATE_CODE,
  ENTERPRISE_SURFACE_KINDS,
  ENTERPRISE_VERSION_MISSING_CODE,
  RMT_VNEXT_ENTERPRISE_REGISTRY_CONTRACT_PATH,
  RMT_VNEXT_ENTERPRISE_REGISTRY_MODULE_PATH,
  RMT_VNEXT_ENTERPRISE_REGISTRY_PACKAGE_SCRIPT,
  RMT_VNEXT_ENTERPRISE_REGISTRY_REPORT_SCHEMA,
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_REGISTRY_SUITE_PATH,
  RMT_VNEXT_ENTERPRISE_REGISTRY_WORKPACKAGE,
  RMT_VNEXT_ENTERPRISE_REGISTRY_WP_PATH,
  RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
  createEnterpriseSurfaceRegistry,
  createRmtVNextEnterpriseRegistryAdapter,
  serializeEnterpriseSurfaceRegistry
} = require('../../tools/rmt-language/vnext-enterprise-registry');

const EPIC_16_PATH = 'development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md';
const ENTERPRISE_FIXTURE = 'tests/rmt-language/fixtures/vnext-enterprise-registry-fixture.json';
const LOCAL_SURFACES_FIXTURE = 'tests/rmt-language/fixtures/vnext-surfaces-valid.rmt';
const REMOTE_MANIFEST_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-manifest-valid.json';
const INVALID_REMOTE_MANIFEST_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-manifest-invalid.json';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
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

function createRegistryFromFixtures(rootDir, overrides = {}) {
  const fixture = {
    ...readJson(ENTERPRISE_FIXTURE, rootDir),
    ...overrides
  };
  const localCompile = compileFixture(LOCAL_SURFACES_FIXTURE, rootDir);
  const remoteManifest = readJson(REMOTE_MANIFEST_FIXTURE, rootDir);
  return createEnterpriseSurfaceRegistry({
    ...fixture,
    coreDocument: localCompile.coreDocument,
    remoteManifests: fixture.remoteManifests || [remoteManifest]
  });
}

function findSurface(registry, name) {
  return registry.surfaces.find((surface) => surface.name === name);
}

function runRmtVNextEnterpriseRegistrySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-enterprise-registry',
    label: 'Epic 16 RMT vNext Enterprise Surface Registry Contract'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextEnterpriseRegistry;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_16_PATH, rootDir);
  const contract = readText(RMT_VNEXT_ENTERPRISE_REGISTRY_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_VNEXT_ENTERPRISE_REGISTRY_WP_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_ENTERPRISE_REGISTRY_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_ENTERPRISE_REGISTRY_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_ENTERPRISE_REGISTRY_MODULE_PATH, rootDir, 'enterprise registry module exists');
  assertFileExists(context, RMT_VNEXT_ENTERPRISE_REGISTRY_SUITE_PATH, rootDir, 'enterprise registry suite exists');
  assertFileExists(context, RMT_VNEXT_ENTERPRISE_REGISTRY_CONTRACT_PATH, rootDir, 'enterprise registry contract exists');
  assertFileExists(context, RMT_VNEXT_ENTERPRISE_REGISTRY_WP_PATH, rootDir, 'WP-E16-03 workpackage document exists');
  assertFileExists(context, ENTERPRISE_FIXTURE, rootDir, 'enterprise registry fixture exists');
  context.assert(moduleSyntax.ok, `enterprise registry module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `enterprise registry suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'package metadata declares enterprise registry schema');
  context.assert(metadata && metadata.enterpriseSurfaceSchema === RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA, 'package metadata declares enterprise surface schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_ENTERPRISE_REGISTRY_REPORT_SCHEMA, 'package metadata declares enterprise registry report schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.surfaceRegistrySchema === RMT_VNEXT_SURFACE_REGISTRY_SCHEMA, 'package metadata declares surface registry schema');
  context.assert(metadata && metadata.remoteManifestSchema === RMT_VNEXT_REMOTE_MANIFEST_SCHEMA, 'package metadata declares remote manifest schema');
  context.assert(metadata && metadata.remoteSurfaceSchema === RMT_VNEXT_REMOTE_SURFACE_SCHEMA, 'package metadata declares remote surface schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_ENTERPRISE_REGISTRY_WORKPACKAGE, 'package metadata points to WP-E16-03');
  context.assert(metadata && metadata.module === RMT_VNEXT_ENTERPRISE_REGISTRY_MODULE_PATH, 'package metadata points to enterprise registry module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_ENTERPRISE_REGISTRY_SUITE_PATH, 'package metadata points to enterprise registry suite');
  context.assert(metadata && metadata.contract === RMT_VNEXT_ENTERPRISE_REGISTRY_CONTRACT_PATH, 'package metadata points to enterprise registry contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry --json', 'package metadata declares enterprise registry local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_ENTERPRISE_REGISTRY_PACKAGE_SCRIPT, 'package metadata declares enterprise registry package script');
  context.assert(packageManifest.exports['./rmt-language/vnext-enterprise-registry'] === './tools/rmt-language/vnext-enterprise-registry.js', 'package exports vNext enterprise registry contract');
  context.assert(packageManifest.scripts['test:rmt-vnext-enterprise-registry'] === 'node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry', 'package exposes vNext enterprise registry script');
  context.assert(runner.includes("id: 'rmt-vnext-enterprise-registry'"), 'test runner exposes rmt-vnext-enterprise-registry suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry'), 'runner help references enterprise registry gate');
  context.assert(epic.includes('- Status: `completed / Epic 16 Enterprise MFE Release Handoff accepted`'), 'Epic records current E16 accepted status');
  context.assert(epic.includes('| `WP-E16-03` | P0 | completed | WS1 |'), 'Epic marks WP-E16-03 completed');
  context.assert(epic.includes('| `WP-E16-04` | P1 | completed | WS2 |'), 'Epic records WP-E16-04 handoff');
  context.assert(epic.includes('| `WP-E16-05` | P1 | completed | WS2 |'), 'Epic marks WP-E16-05 completed');
  context.assert(epic.includes('| `WP-E16-06` | P1 | completed | WS3 |'), 'Epic marks WP-E16-06 completed');
  context.assert(contract.includes('schema: "xtend.rmt.vnext-enterprise-surface-registry.v1"'), 'contract document declares enterprise registry schema');
  context.assert(workpackage.includes('WP-E16-03` ist abgeschlossen'), 'workpackage records handoff completion');

  assertIncludesAll(context, ENTERPRISE_SURFACE_KINDS, ['local', 'remote'], 'enterprise registry surface kinds');

  const localCompile = compileFixture(LOCAL_SURFACES_FIXTURE, rootDir);
  context.assert(localCompile.ok === true, 'local surface fixture compiles');
  const registry = createRegistryFromFixtures(rootDir);
  context.assert(registry.schema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'enterprise registry emits registry schema');
  context.assert(registry.enterpriseSurfaceSchema === RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA, 'enterprise registry emits enterprise surface schema');
  context.assert(registry.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'enterprise registry records core schema');
  context.assert(registry.surfaceRegistrySchema === RMT_VNEXT_SURFACE_REGISTRY_SCHEMA, 'enterprise registry records local surface registry schema');
  context.assert(registry.remoteManifestSchema === RMT_VNEXT_REMOTE_MANIFEST_SCHEMA, 'enterprise registry records remote manifest schema');
  context.assert(registry.ok === true && registry.status === 'ready', 'enterprise registry is ready');
  context.assert(registry.surfaceCount === 7, 'enterprise registry contains six local and one remote surface');
  context.assert(registry.localSurfaceCount === 6, 'enterprise registry counts local surfaces');
  context.assert(registry.remoteSurfaceCount === 1, 'enterprise registry counts remote surfaces');
  context.assert(registry.ownerCount === 7, 'enterprise registry counts seven owners');
  context.assert(registry.versionedSurfaceCount === 7, 'enterprise registry marks all surfaces versioned');
  context.assert(registry.shellTargetCount === 8, 'enterprise registry records shell targets');
  context.assert(registry.discoverability.operatorReady === true, 'discoverability report is operator ready');
  context.assert(registry.discoverability.surfaceIds.length === 7, 'discoverability report lists all surfaces');
  context.assert(registry.discoverability.ownerIds.includes('checkout-platform'), 'discoverability report lists remote owner');
  context.assert(registry.indexes.byKind.local.length === 6, 'registry indexes local surfaces');
  context.assert(registry.indexes.byKind.remote.length === 1, 'registry indexes remote surfaces');
  context.assert(registry.indexes.byOwner['checkout-platform'].length === 1, 'registry indexes checkout owner');
  context.assert(registry.indexes.byShellTarget['shell.slot:sidebar.cart'].length === 1, 'registry indexes remote shell target');

  const root = findSurface(registry, 'root');
  const checkout = findSurface(registry, 'checkout.cart');
  context.assert(root && root.schema === RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA, 'local root emits enterprise surface schema');
  context.assert(root && root.kind === 'local' && root.remote.enabled === false, 'root remains a local surface');
  context.assert(root && root.owner.id === 'shell-platform', 'root records owner');
  context.assert(root && root.version.active === '1.0.0', 'root records active version');
  context.assert(root && root.shellTargets[0].target === 'shell.slot:app.root', 'root records shell target');
  context.assert(checkout && checkout.kind === 'remote' && checkout.remote.enabled === true, 'checkout is remote');
  context.assert(checkout && checkout.owner.id === 'checkout-platform', 'checkout records owner');
  context.assert(checkout && checkout.version.active === '2.4.3', 'checkout records active version');
  context.assert(checkout && checkout.remote.remoteId === '@xtend/checkout-cart', 'checkout records remote id');
  context.assert(checkout && checkout.remote.trustBoundary === 'xtend.security.remote-surface.v1', 'checkout records trust boundary');
  context.assert(checkout && checkout.fallback.ref === 'checkout.cart.fallback', 'checkout records fallback');
  context.assert(checkout && checkout.events.emits.length === 1 && checkout.events.consumes.length === 1, 'checkout records event discoverability');

  const serialized = serializeEnterpriseSurfaceRegistry(registry);
  const repeat = serializeEnterpriseSurfaceRegistry(createRegistryFromFixtures(rootDir));
  context.assert(serialized === repeat, 'enterprise registry serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'serialized enterprise registry is parseable JSON');

  const missingOwnerFixture = cloneJson(readJson(ENTERPRISE_FIXTURE, rootDir));
  delete missingOwnerFixture.owners.root;
  const missingOwnerRegistry = createRegistryFromFixtures(rootDir, missingOwnerFixture);
  context.assert(missingOwnerRegistry.ok === false, 'missing owner blocks enterprise registry');
  context.assert(diagnosticCodes(missingOwnerRegistry).includes(ENTERPRISE_OWNER_MISSING_CODE), 'missing owner diagnostic is emitted');

  const missingVersionFixture = cloneJson(readJson(ENTERPRISE_FIXTURE, rootDir));
  delete missingVersionFixture.versions.root;
  const missingVersionRegistry = createRegistryFromFixtures(rootDir, missingVersionFixture);
  context.assert(missingVersionRegistry.ok === false, 'missing version blocks enterprise registry');
  context.assert(diagnosticCodes(missingVersionRegistry).includes(ENTERPRISE_VERSION_MISSING_CODE), 'missing version diagnostic is emitted');

  const missingShellTargetFixture = cloneJson(readJson(ENTERPRISE_FIXTURE, rootDir));
  delete missingShellTargetFixture.shellTargets.root;
  const missingShellTargetRegistry = createRegistryFromFixtures(rootDir, missingShellTargetFixture);
  context.assert(missingShellTargetRegistry.ok === false, 'missing shell target blocks enterprise registry');
  context.assert(diagnosticCodes(missingShellTargetRegistry).includes(ENTERPRISE_SHELL_TARGET_MISSING_CODE), 'missing shell target diagnostic is emitted');

  const invalidRemoteManifest = readJson(INVALID_REMOTE_MANIFEST_FIXTURE, rootDir);
  const invalidRemoteRegistry = createRegistryFromFixtures(rootDir, {
    remoteManifests: [invalidRemoteManifest]
  });
  context.assert(invalidRemoteRegistry.ok === false, 'blocked remote manifest blocks enterprise registry');
  context.assert(diagnosticCodes(invalidRemoteRegistry).includes(ENTERPRISE_REMOTE_MANIFEST_BLOCKED_CODE), 'blocked remote manifest diagnostic is emitted');

  const duplicateRemoteRegistry = createRegistryFromFixtures(rootDir, {
    remoteManifests: [
      readJson(REMOTE_MANIFEST_FIXTURE, rootDir),
      readJson(REMOTE_MANIFEST_FIXTURE, rootDir)
    ]
  });
  context.assert(duplicateRemoteRegistry.ok === false, 'duplicate remote surfaces block enterprise registry');
  context.assert(diagnosticCodes(duplicateRemoteRegistry).includes(ENTERPRISE_SURFACE_DUPLICATE_CODE), 'duplicate surface diagnostic is emitted');

  const adapter = createRmtVNextEnterpriseRegistryAdapter();
  context.assert(adapter.schema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'adapter exposes enterprise registry schema');
  context.assert(adapter.enterpriseSurfaceSchema === RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA, 'adapter exposes enterprise surface schema');
  context.assert(adapter.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'adapter exposes core schema');
  context.assert(adapter.createRegistry({
    ...readJson(ENTERPRISE_FIXTURE, rootDir),
    coreDocument: localCompile.coreDocument,
    remoteManifests: [readJson(REMOTE_MANIFEST_FIXTURE, rootDir)]
  }).ok === true, 'adapter creates enterprise registry');

  return context.result({
    schema: RMT_VNEXT_ENTERPRISE_REGISTRY_REPORT_SCHEMA,
    registrySchema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    enterpriseSurfaceSchema: RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_REGISTRY_WORKPACKAGE,
    module: RMT_VNEXT_ENTERPRISE_REGISTRY_MODULE_PATH,
    suite: RMT_VNEXT_ENTERPRISE_REGISTRY_SUITE_PATH,
    surfaceCount: registry.surfaceCount
  });
}

function printRmtVNextEnterpriseRegistryReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 16 RMT vNext Enterprise Surface Registry Contract erfolgreich.',
    failureTitle: 'Epic 16 RMT vNext Enterprise Surface Registry Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextEnterpriseRegistryReport,
  runRmtVNextEnterpriseRegistrySuite
};

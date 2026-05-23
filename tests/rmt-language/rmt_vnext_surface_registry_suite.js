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
  RMT_VNEXT_SURFACE_MODULE_PATH,
  RMT_VNEXT_SURFACE_PACKAGE_SCRIPT,
  RMT_VNEXT_SURFACE_REGISTRY_SCHEMA,
  RMT_VNEXT_SURFACE_REPORT_SCHEMA,
  RMT_VNEXT_SURFACE_SCHEMA,
  RMT_VNEXT_SURFACE_SUITE_PATH,
  RMT_VNEXT_SURFACE_WORKPACKAGE,
  SURFACE_ID_DUPLICATE_CODE,
  SURFACE_KIND_UNKNOWN_CODE,
  SURFACE_LANE_REF_MISSING_CODE,
  SURFACE_LANE_SCOPE_MISMATCH_CODE,
  SURFACE_OPERATION_REF_MISSING_CODE,
  SURFACE_OPERATION_SCOPE_MISMATCH_CODE,
  SURFACE_TEMPLATE_REF_MISSING_CODE,
  createRmtVNextSurfaceRegistry,
  createSurfaceRegistry,
  listSurfaceTypes,
  normalizeSurfaceType,
  serializeSurfaceRegistry
} = require('../../tools/rmt-language/vnext-surfaces');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const SURFACE_CONTRACT_PATH = 'development/XTendRMT-vNext-Surface-Registry-Contract.md';
const WP_E15_08_PATH = 'development/WP-E15-08-Surface-Orchestrierung-und-Host-neutral-Surface-Registry-bauen.md';
const VALID_SURFACES_FIXTURE = 'tests/rmt-language/fixtures/vnext-surfaces-valid.rmt';
const VALID_COMPLEX_FIXTURE = 'tests/rmt-language/fixtures/vnext-valid-complex.rmt';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function compileFixture(relativePath, rootDir) {
  return compileRmtVNextSource({
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir)
  });
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function findSurface(registry, type) {
  return registry.surfaces.find((surface) => surface.type === type);
}

function runRmtVNextSurfaceRegistrySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-surfaces',
    label: 'Epic 15 RMT vNext Surface Registry Contract'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextSurfaces;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const surfaceContract = readText(SURFACE_CONTRACT_PATH, rootDir);
  const surfaceSyntax = syntaxCheckFile(RMT_VNEXT_SURFACE_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_SURFACE_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_SURFACE_MODULE_PATH, rootDir, 'vNext surface registry module exists');
  assertFileExists(context, RMT_VNEXT_SURFACE_SUITE_PATH, rootDir, 'vNext surface registry suite exists');
  assertFileExists(context, WP_E15_08_PATH, rootDir, 'WP-E15-08 workpackage document exists');
  assertFileExists(context, VALID_SURFACES_FIXTURE, rootDir, 'vNext surfaces fixture exists');
  context.assert(surfaceSyntax.ok, `vNext surface module syntax passes${surfaceSyntax.ok ? '' : ` (${surfaceSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext surface suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_SURFACE_REGISTRY_SCHEMA, 'package metadata declares surface registry schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.surfaceSchema === RMT_VNEXT_SURFACE_SCHEMA, 'package metadata declares surface schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_SURFACE_REPORT_SCHEMA, 'package metadata declares surface report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_SURFACE_WORKPACKAGE, 'package metadata points to WP-E15-08');
  context.assert(metadata && metadata.module === RMT_VNEXT_SURFACE_MODULE_PATH, 'package metadata points to surface module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_SURFACE_SUITE_PATH, 'package metadata points to surface suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-surfaces --json', 'package metadata declares surface local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_SURFACE_PACKAGE_SCRIPT, 'package metadata declares surface package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-surfaces'] === 'string' ? packageManifest.exports['./rmt-language/vnext-surfaces'] : packageManifest.exports['./rmt-language/vnext-surfaces'] && packageManifest.exports['./rmt-language/vnext-surfaces'].default) === './tools/rmt-language/vnext-surfaces.js', 'package exports vNext surfaces contract');
  context.assert(packageManifest.scripts['test:rmt-vnext-surfaces'] === 'node scripts/run_xtend_tests.js rmt-vnext-surfaces', 'package exposes vNext surfaces script');
  context.assert(runner.includes("id: 'rmt-vnext-surfaces'"), 'test runner exposes rmt-vnext-surfaces suite');
  context.assert(epic.includes('| `WP-E15-08` | P1 | completed | WS2 |'), 'Epic marks WP-E15-08 completed');
  context.assert(
    epic.includes('| `WP-E15-09` | P1 | completed | WS3 |'),
    'Epic records WP-E15-09 condition handoff'
  );
  context.assert(surfaceContract.includes('schema: "xtend.rmt.vnext-surface-registry.v1"'), 'Surface contract document declares schema');

  const surfaceTypes = listSurfaceTypes();
  context.assert(surfaceTypes.length === 11, 'surface registry exposes eleven SurfaceManager runtime surface types');
  assertIncludesAll(context, surfaceTypes, ['region', 'window', 'side-panel', 'modal', 'dialog', 'drawer', 'popover', 'tooltip', 'toast', 'lightbox', 'menu'], 'surface registry canonical types');
  context.assert(normalizeSurfaceType({ name: 'root', kind: 'root' }).type === 'region', 'root kind lowers to region');
  context.assert(normalizeSurfaceType({ name: 'modal.settings', kind: 'named_surface' }).type === 'modal', 'modal surface type is inferred');
  context.assert(normalizeSurfaceType({ name: 'panel.tools', kind: 'named_surface' }).type === 'side-panel', 'panel surface type is inferred');
  context.assert(normalizeSurfaceType({ name: 'overlay.toast', kind: 'named_surface' }).type === 'toast', 'overlay toast surface type is inferred');
  context.assert(normalizeSurfaceType({ name: 'workspace.editor', kind: 'named_surface' }).type === 'region', 'workspace surface type lowers to region');
  context.assert(normalizeSurfaceType({ name: 'portal.help', kind: 'overlay-host' }).type === 'region', 'overlay-host surface type lowers to region');
  context.assert(normalizeSurfaceType({ name: 'demo.card', kind: 'card' }).type === 'region', 'explicit card kind lowers to region');
  context.assert(normalizeSurfaceType({ name: 'help.menu', kind: 'menu' }).type === 'menu', 'explicit menu kind wins over name alias');

  const compileResult = compileFixture(VALID_SURFACES_FIXTURE, rootDir);
  context.assert(compileResult.ok === true, 'surfaces fixture compiles successfully');
  context.assert(compileResult.coreDocument.schema === RMT_VNEXT_CORE_SCHEMA, 'surfaces fixture emits vNext core schema');
  context.assert(compileResult.coreDocument.surfaces.length === 6, 'surfaces fixture compiles six surfaces');
  context.assert(compileResult.coreDocument.lanes.length === 6, 'surfaces fixture compiles six lanes');
  context.assert(compileResult.coreDocument.operations.length === 7, 'surfaces fixture compiles seven operations');

  const registry = createSurfaceRegistry(compileResult.coreDocument);
  context.assert(registry.schema === RMT_VNEXT_SURFACE_REGISTRY_SCHEMA, 'surface registry emits registry schema');
  context.assert(registry.ok === true, 'surface registry validates successfully');
  context.assert(registry.status === 'ready', 'surface registry is ready');
  context.assert(registry.surfaceCount === 6, 'surface registry includes six surfaces');
  context.assert(registry.laneCount === 6, 'surface registry reports core lane count');
  context.assert(registry.operationCount === 7, 'surface registry reports core operation count');
  assertIncludesAll(context, Object.keys(registry.byType), ['region', 'modal', 'side-panel', 'toast'], 'surface registry byType index');

  const root = registry.surfaces.find((surface) => surface.kind === 'root');
  const modal = findSurface(registry, 'modal');
  const panel = findSurface(registry, 'side-panel');
  const toast = findSurface(registry, 'toast');
  const workspace = registry.surfaces.find((surface) => surface.kind === 'workspace');
  const portal = registry.surfaces.find((surface) => surface.kind === 'overlay-host');
  context.assert(root && root.schema === RMT_VNEXT_SURFACE_SCHEMA, 'root surface uses surface schema');
  context.assert(root && root.type === 'region' && root.hostBinding.domCoupled === false && root.hostBinding.hostRole === 'region-container', 'root kind lowers to a host-neutral region');
  context.assert(modal && modal.hostBinding.modal === true && modal.hostBinding.portal === true, 'modal surface records modal portal metadata');
  context.assert(panel && panel.hostBinding.hostRole === 'panel-container', 'panel surface records panel host role');
  context.assert(toast && toast.hostBinding.stack === 'toast-region', 'toast surface records toast-region stack');
  context.assert(workspace && workspace.type === 'region' && workspace.hostBinding.stack === 'workspace', 'workspace kind records workspace stack');
  context.assert(portal && portal.type === 'region' && portal.hostBinding.portal === true, 'overlay-host kind records portal metadata');
  context.assert(registry.surfaces.every((surface) => surface.sourceRef && surface.sourceRef.startsWith('src:')), 'surfaces keep source refs');
  context.assert(registry.surfaces.every((surface) => surface.laneRefs.length === surface.laneCount), 'surfaces preserve lane refs');
  context.assert(registry.surfaces.every((surface) => surface.operationRefs.length === surface.operationCount), 'surfaces preserve operation refs');
  context.assert(root.operationCount === 2, 'root surface owns two operations through its lane');

  const repeatRegistry = createSurfaceRegistry(compileFixture(VALID_SURFACES_FIXTURE, rootDir).coreDocument);
  context.assert(serializeSurfaceRegistry(registry) === serializeSurfaceRegistry(repeatRegistry), 'surface registry serialization is byte-stable');
  context.assert(JSON.parse(serializeSurfaceRegistry(registry)).schema === RMT_VNEXT_SURFACE_REGISTRY_SCHEMA, 'serialized surface registry is parseable JSON');

  const complexResult = compileFixture(VALID_COMPLEX_FIXTURE, rootDir);
  const complexRegistry = createSurfaceRegistry(complexResult.coreDocument);
  context.assert(complexRegistry.ok === true, 'complex fixture surfaces normalize successfully');
  context.assert(complexRegistry.surfaces.some((surface) => surface.type === 'modal'), 'complex fixture includes modal surface');
  context.assert(complexRegistry.surfaces.some((surface) => surface.type === 'popover'), 'complex fixture includes overlay-compatible popover surface');

  const unknownCore = cloneJson(compileResult.coreDocument);
  unknownCore.surfaces[1].name = 'mystery.zone';
  unknownCore.surfaces[1].kind = 'mystery';
  const unknownRegistry = createSurfaceRegistry(unknownCore);
  context.assert(unknownRegistry.ok === false && unknownRegistry.status === 'blocked', 'unknown surface types block registry');
  context.assert(unknownRegistry.diagnostics.some((diagnostic) => diagnostic.code === SURFACE_KIND_UNKNOWN_CODE), 'unknown surface types produce diagnostics');

  const duplicateCore = cloneJson(compileResult.coreDocument);
  duplicateCore.surfaces.push(cloneJson(duplicateCore.surfaces[0]));
  const duplicateRegistry = createSurfaceRegistry(duplicateCore);
  context.assert(duplicateRegistry.ok === false, 'duplicate surface ids block registry');
  context.assert(duplicateRegistry.diagnostics.some((diagnostic) => diagnostic.code === SURFACE_ID_DUPLICATE_CODE), 'duplicate surface ids produce diagnostics');

  const missingLaneCore = cloneJson(compileResult.coreDocument);
  missingLaneCore.surfaces[0].laneRefs.push('lane:missing');
  const missingLaneRegistry = createSurfaceRegistry(missingLaneCore);
  context.assert(missingLaneRegistry.ok === false, 'missing lane refs block registry');
  context.assert(missingLaneRegistry.diagnostics.some((diagnostic) => diagnostic.code === SURFACE_LANE_REF_MISSING_CODE), 'missing lane refs produce diagnostics');

  const laneMismatchCore = cloneJson(compileResult.coreDocument);
  laneMismatchCore.lanes[0].scope.surface = laneMismatchCore.surfaces[1].id;
  const laneMismatchRegistry = createSurfaceRegistry(laneMismatchCore);
  context.assert(laneMismatchRegistry.ok === false, 'lane surface mismatches block registry');
  context.assert(laneMismatchRegistry.diagnostics.some((diagnostic) => diagnostic.code === SURFACE_LANE_SCOPE_MISMATCH_CODE), 'lane surface mismatches produce diagnostics');

  const missingOperationCore = cloneJson(compileResult.coreDocument);
  missingOperationCore.lanes[0].operationRefs.push('operation:missing');
  const missingOperationRegistry = createSurfaceRegistry(missingOperationCore);
  context.assert(missingOperationRegistry.ok === false, 'missing operation refs block registry');
  context.assert(missingOperationRegistry.diagnostics.some((diagnostic) => diagnostic.code === SURFACE_OPERATION_REF_MISSING_CODE), 'missing operation refs produce diagnostics');

  const operationMismatchCore = cloneJson(compileResult.coreDocument);
  const mismatchedOperation = operationMismatchCore.operations.find((operation) => operation.id === operationMismatchCore.lanes[0].operationRefs[0]);
  mismatchedOperation.scope.surface = operationMismatchCore.surfaces[1].id;
  const operationMismatchRegistry = createSurfaceRegistry(operationMismatchCore);
  context.assert(operationMismatchRegistry.ok === false, 'operation surface mismatches block registry');
  context.assert(operationMismatchRegistry.diagnostics.some((diagnostic) => diagnostic.code === SURFACE_OPERATION_SCOPE_MISMATCH_CODE), 'operation surface mismatches produce diagnostics');

  const missingTemplateCore = cloneJson(compileResult.coreDocument);
  missingTemplateCore.surfaces[0].scope.template = 'template:missing';
  const missingTemplateRegistry = createSurfaceRegistry(missingTemplateCore);
  context.assert(missingTemplateRegistry.ok === false, 'missing template refs block registry');
  context.assert(missingTemplateRegistry.diagnostics.some((diagnostic) => diagnostic.code === SURFACE_TEMPLATE_REF_MISSING_CODE), 'missing template refs produce diagnostics');

  const factory = createRmtVNextSurfaceRegistry();
  context.assert(factory.schema === RMT_VNEXT_SURFACE_REGISTRY_SCHEMA, 'factory exposes surface registry schema');
  context.assert(factory.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'factory exposes core schema');
  context.assert(factory.createRegistry(compileResult.coreDocument).ok === true, 'factory creates surface registry');

  return context.result({
    schema: RMT_VNEXT_SURFACE_REPORT_SCHEMA,
    registrySchema: RMT_VNEXT_SURFACE_REGISTRY_SCHEMA,
    surfaceSchema: RMT_VNEXT_SURFACE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_SURFACE_WORKPACKAGE,
    surfaceModule: RMT_VNEXT_SURFACE_MODULE_PATH,
    suite: RMT_VNEXT_SURFACE_SUITE_PATH,
    surfaceTypeCount: surfaceTypes.length
  });
}

function printRmtVNextSurfaceRegistryReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Surface Registry Contract erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Surface Registry Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextSurfaceRegistryReport,
  runRmtVNextSurfaceRegistrySuite
};

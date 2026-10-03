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
  RMT_VNEXT_CORE_SCHEMA
} = require('../../tools/rmt-language/vnext-compiler');
const {
  ALLOWED_EXTENSIONS,
  ALLOWED_GLOB_FORMS,
  ALLOWED_IMPORT_MODES,
  IMPORT_BOUNDARY_VIOLATION_CODE,
  IMPORT_CYCLE_CODE,
  IMPORT_FILE_MISSING_CODE,
  IMPORT_GLOB_UNSUPPORTED_CODE,
  RMT_VNEXT_IMPORT_EDGE_SCHEMA,
  RMT_VNEXT_IMPORT_RESOLVER_MODULE_PATH,
  RMT_VNEXT_IMPORT_RESOLVER_PACKAGE_SCRIPT,
  RMT_VNEXT_IMPORT_RESOLVER_REPORT_SCHEMA,
  RMT_VNEXT_IMPORT_RESOLVER_SCHEMA,
  RMT_VNEXT_IMPORT_RESOLVER_SUITE_PATH,
  RMT_VNEXT_IMPORT_RESOLVER_WORKPACKAGE,
  RMT_VNEXT_MODULE_GRAPH_SCHEMA,
  RMT_VNEXT_MODULE_RECORD_SCHEMA,
  createModuleGraph,
  createRmtVNextImportResolver,
  serializeModuleGraph
} = require('../../tools/rmt-language/vnext-import-resolver');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const IMPORT_CONTRACT_PATH = 'development/XTendRMT-vNext-Import-Resolver-Contract.md';
const WP_E15_11_PATH = 'development/WP-E15-11-Imports-Module-Resolution-und-Package-Boundaries-implementieren.md';
const VALID_MODULE_ROOT = 'tests/rmt-language/fixtures/vnext-modules';
const VALID_MODULE_ENTRY = 'tests/rmt-language/fixtures/vnext-modules/app.rmt';
const CYCLE_MODULE_ROOT = 'tests/rmt-language/fixtures/vnext-modules-cycle';
const MISSING_MODULE_ROOT = 'tests/rmt-language/fixtures/vnext-modules-missing';
const BOUNDARY_MODULE_ROOT = 'tests/rmt-language/fixtures/vnext-modules-boundary';
const INVALID_GLOB_MODULE_ROOT = 'tests/rmt-language/fixtures/vnext-modules-invalid-glob';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function createGraphFor(relativeEntry, relativeRoot, rootDir) {
  return createModuleGraph({
    entryFile: resolveRepoPath(relativeEntry, rootDir)
  }, {
    rootDir,
    roots: [resolveRepoPath(relativeRoot, rootDir)]
  });
}

function moduleIds(graph) {
  return graph.modules.map((moduleRecord) => moduleRecord.id);
}

function edgeByImportPath(graph, importPath) {
  return graph.edges.find((edge) => edge.importPath === importPath);
}

function createSymlinkBoundaryFixture(context, rootDir, fixtureName, entryText, outsideFileName, outsideText, linkPath) {
  if (typeof fs.symlinkSync !== 'function') return null;

  const baseDir = path.join(rootDir, '.tmp', fixtureName);
  const packageDir = path.join(baseDir, 'pkg');
  const outsideDir = path.join(baseDir, 'outside');
  fs.rmSync(baseDir, { recursive: true, force: true });
  fs.mkdirSync(packageDir, { recursive: true });
  fs.mkdirSync(outsideDir, { recursive: true });
  fs.writeFileSync(path.join(packageDir, 'app.rmt'), entryText, 'utf8');
  fs.writeFileSync(path.join(outsideDir, outsideFileName), outsideText, 'utf8');

  const linkFullPath = path.join(packageDir, linkPath);
  fs.mkdirSync(path.dirname(linkFullPath), { recursive: true });
  try {
    const linkTarget = path.extname(linkPath) ? path.join(outsideDir, outsideFileName) : outsideDir;
    fs.symlinkSync(linkTarget, linkFullPath);
  } catch (error) {
    context.assert(error && (error.code === 'EPERM' || error.code === 'EACCES'), `symlink fixture can be created or skipped for ${fixtureName}`);
    return null;
  }

  return {
    entryFile: path.join(packageDir, 'app.rmt'),
    root: packageDir,
    cleanup: () => fs.rmSync(baseDir, { recursive: true, force: true })
  };
}

function runRmtVNextImportResolverSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-imports',
    label: 'Epic 15 RMT vNext Import Resolver and Module Graph Contract'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextImportResolver;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const importContract = readText(IMPORT_CONTRACT_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_IMPORT_RESOLVER_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_IMPORT_RESOLVER_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_IMPORT_RESOLVER_MODULE_PATH, rootDir, 'vNext import resolver module exists');
  assertFileExists(context, RMT_VNEXT_IMPORT_RESOLVER_SUITE_PATH, rootDir, 'vNext import resolver suite exists');
  assertFileExists(context, WP_E15_11_PATH, rootDir, 'WP-E15-11 workpackage document exists');
  assertFileExists(context, VALID_MODULE_ENTRY, rootDir, 'vNext module graph fixture exists');
  context.assert(moduleSyntax.ok, `vNext import resolver module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext import resolver suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_IMPORT_RESOLVER_SCHEMA, 'package metadata declares import resolver schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.moduleGraphSchema === RMT_VNEXT_MODULE_GRAPH_SCHEMA, 'package metadata declares module graph schema');
  context.assert(metadata && metadata.moduleRecordSchema === RMT_VNEXT_MODULE_RECORD_SCHEMA, 'package metadata declares module record schema');
  context.assert(metadata && metadata.importEdgeSchema === RMT_VNEXT_IMPORT_EDGE_SCHEMA, 'package metadata declares import edge schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_IMPORT_RESOLVER_REPORT_SCHEMA, 'package metadata declares import resolver report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_IMPORT_RESOLVER_WORKPACKAGE, 'package metadata points to WP-E15-11');
  context.assert(metadata && metadata.module === RMT_VNEXT_IMPORT_RESOLVER_MODULE_PATH, 'package metadata points to import resolver module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_IMPORT_RESOLVER_SUITE_PATH, 'package metadata points to import resolver suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-imports --json', 'package metadata declares import resolver local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_IMPORT_RESOLVER_PACKAGE_SCRIPT, 'package metadata declares import resolver package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-import-resolver'] === 'string' ? packageManifest.exports['./rmt-language/vnext-import-resolver'] : packageManifest.exports['./rmt-language/vnext-import-resolver'] && packageManifest.exports['./rmt-language/vnext-import-resolver'].default) === './tools/rmt-language/vnext-import-resolver.js', 'package exports vNext import resolver contract');
  context.assert(packageManifest.scripts['test:rmt-vnext-imports'] === 'node scripts/run_xtend_tests.js rmt-vnext-imports', 'package exposes vNext import resolver script');
  context.assert(runner.hasSuite("rmt-vnext-imports"), 'test runner exposes rmt-vnext-imports suite');
  context.assert(epic.includes('| `WP-E15-11` | P1 | completed | WS3 |'), 'Epic marks WP-E15-11 completed');
  context.assert(epic.includes('| `WP-E15-12` | P1 | completed | WS3 |'), 'Epic records WP-E15-12 event/action handoff after import resolver');
  context.assert(importContract.includes('schema: "xtend.rmt.vnext-import-resolver.v1"'), 'Import resolver contract document declares schema');

  assertIncludesAll(context, ALLOWED_IMPORT_MODES, ['static_file', 'static_glob'], 'import resolver allowed modes');
  assertIncludesAll(context, ALLOWED_EXTENSIONS, ['.rmt'], 'import resolver allowed extensions');
  assertIncludesAll(context, ALLOWED_GLOB_FORMS, ['./dir/*.rmt', './dir/**/*.rmt'], 'import resolver allowed glob forms');

  const graph = createGraphFor(VALID_MODULE_ENTRY, VALID_MODULE_ROOT, rootDir);
  context.assert(graph.schema === RMT_VNEXT_MODULE_GRAPH_SCHEMA, 'module graph emits graph schema');
  context.assert(graph.resolverSchema === RMT_VNEXT_IMPORT_RESOLVER_SCHEMA, 'module graph points to resolver schema');
  context.assert(graph.ok === true, 'valid module graph resolves successfully');
  context.assert(graph.status === 'ready', 'valid module graph is ready');
  context.assert(graph.moduleCount === 5, 'valid graph resolves five modules');
  context.assert(graph.edgeCount === 3, 'valid graph resolves three import edges');
  context.assert(graph.modules.every((moduleRecord) => moduleRecord.schema === RMT_VNEXT_MODULE_RECORD_SCHEMA), 'modules use module record schema');
  context.assert(graph.edges.every((edge) => edge.schema === RMT_VNEXT_IMPORT_EDGE_SCHEMA), 'import edges use import edge schema');
  assertIncludesAll(context, moduleIds(graph), [
    'module:app.rmt',
    'module:shared/footer.rmt',
    'module:shared/header.rmt',
    'module:feature/card.rmt',
    'module:feature/details.rmt'
  ], 'module graph ids');
  context.assert(JSON.stringify(graph.loadOrder) === JSON.stringify([
    'module:app.rmt',
    'module:shared/footer.rmt',
    'module:shared/header.rmt',
    'module:feature/card.rmt',
    'module:feature/details.rmt'
  ]), 'module load order is deterministic and import-order aware');
  context.assert(JSON.stringify(graph.merge.order) === JSON.stringify([
    'module:shared/footer.rmt',
    'module:shared/header.rmt',
    'module:feature/details.rmt',
    'module:feature/card.rmt',
    'module:app.rmt'
  ]), 'module merge order is deterministic dependency-first postorder');
  const globEdge = edgeByImportPath(graph, './shared/*.rmt');
  context.assert(globEdge && globEdge.status === 'ready' && globEdge.resolvedPaths.length === 2, 'static glob resolves two shared modules');
  context.assert(globEdge && globEdge.resolvedPaths[0].endsWith('/shared/footer.rmt') && globEdge.resolvedPaths[1].endsWith('/shared/header.rmt'), 'static glob results are sorted by stable path');
  const nestedEdge = edgeByImportPath(graph, './details.rmt');
  context.assert(nestedEdge && nestedEdge.importer === 'module:feature/card.rmt', 'nested import edge keeps importer module');
  context.assert(graph.modules.find((moduleRecord) => moduleRecord.id === 'module:feature/card.rmt').dependencies.includes('module:feature/details.rmt'), 'module dependencies include nested detail module');

  const repeatGraph = createGraphFor(VALID_MODULE_ENTRY, VALID_MODULE_ROOT, rootDir);
  context.assert(serializeModuleGraph(graph) === serializeModuleGraph(repeatGraph), 'module graph serialization is byte-stable');
  context.assert(JSON.parse(serializeModuleGraph(graph)).schema === RMT_VNEXT_MODULE_GRAPH_SCHEMA, 'serialized module graph is parseable JSON');

  const missingGraph = createGraphFor('tests/rmt-language/fixtures/vnext-modules-missing/app.rmt', MISSING_MODULE_ROOT, rootDir);
  context.assert(missingGraph.ok === false, 'missing imports block module graph');
  context.assert(missingGraph.diagnostics.some((diagnostic) => diagnostic.code === IMPORT_FILE_MISSING_CODE), 'missing imports produce diagnostics');

  const cycleGraph = createGraphFor('tests/rmt-language/fixtures/vnext-modules-cycle/a.rmt', CYCLE_MODULE_ROOT, rootDir);
  context.assert(cycleGraph.ok === false, 'cyclic imports block module graph');
  context.assert(cycleGraph.diagnostics.some((diagnostic) => diagnostic.code === IMPORT_CYCLE_CODE), 'cyclic imports produce diagnostics');
  const cycleDiagnostic = cycleGraph.diagnostics.find((diagnostic) => diagnostic.code === IMPORT_CYCLE_CODE);
  context.assert(cycleDiagnostic && Array.isArray(cycleDiagnostic.metadata.cycle) && cycleDiagnostic.metadata.cycle.includes('module:a.rmt'), 'cycle diagnostic includes module path');

  const boundaryGraph = createGraphFor('tests/rmt-language/fixtures/vnext-modules-boundary/app.rmt', BOUNDARY_MODULE_ROOT, rootDir);
  context.assert(boundaryGraph.ok === false, 'package boundary violations block module graph');
  context.assert(boundaryGraph.diagnostics.some((diagnostic) => diagnostic.code === IMPORT_BOUNDARY_VIOLATION_CODE), 'package boundary violations produce diagnostics');

  const symlinkFileFixture = createSymlinkBoundaryFixture(
    context,
    rootDir,
    'rmt-vnext-import-file-symlink-boundary',
    'import "./link.rmt"\n\ntemplate app.page {\n  surface root {\n    lane critical {\n      hydrate app-shell\n    }\n  }\n}\n',
    'secret.rmt',
    'template outside.secret {\n  surface root {\n    lane critical {\n      hydrate outside-secret\n    }\n  }\n}\n',
    'link.rmt'
  );
  if (symlinkFileFixture) {
    try {
      const symlinkFileGraph = createModuleGraph({ entryFile: symlinkFileFixture.entryFile }, {
        rootDir,
        roots: [symlinkFileFixture.root]
      });
      context.assert(symlinkFileGraph.ok === false, 'symlinked file import outside package roots blocks module graph');
      context.assert(symlinkFileGraph.diagnostics.some((diagnostic) => diagnostic.code === IMPORT_BOUNDARY_VIOLATION_CODE), 'symlinked file import outside package roots produces boundary diagnostic');
      context.assert(!moduleIds(symlinkFileGraph).includes('module:link.rmt'), 'symlinked outside file is not compiled as an in-root module');
    } finally {
      symlinkFileFixture.cleanup();
    }
  }

  const symlinkGlobFixture = createSymlinkBoundaryFixture(
    context,
    rootDir,
    'rmt-vnext-import-glob-symlink-boundary',
    'import "./linked/*.rmt"\n\ntemplate app.page {\n  surface root {\n    lane critical {\n      hydrate app-shell\n    }\n  }\n}\n',
    'secret.rmt',
    'template outside.globsecret {\n  surface root {\n    lane critical {\n      hydrate outside-glob-secret\n    }\n  }\n}\n',
    'linked'
  );
  if (symlinkGlobFixture) {
    try {
      const symlinkGlobGraph = createModuleGraph({ entryFile: symlinkGlobFixture.entryFile }, {
        rootDir,
        roots: [symlinkGlobFixture.root]
      });
      context.assert(symlinkGlobGraph.ok === false, 'symlinked glob directory outside package roots blocks module graph');
      context.assert(symlinkGlobGraph.diagnostics.some((diagnostic) => diagnostic.code === IMPORT_BOUNDARY_VIOLATION_CODE), 'symlinked glob directory outside package roots produces boundary diagnostic');
      context.assert(!moduleIds(symlinkGlobGraph).some((moduleId) => moduleId.includes('secret.rmt')), 'symlinked outside glob file is not compiled as an in-root module');
    } finally {
      symlinkGlobFixture.cleanup();
    }
  }

  const invalidGlobGraph = createGraphFor('tests/rmt-language/fixtures/vnext-modules-invalid-glob/app.rmt', INVALID_GLOB_MODULE_ROOT, rootDir);
  context.assert(invalidGlobGraph.ok === false, 'unsupported globs block module graph');
  context.assert(invalidGlobGraph.diagnostics.some((diagnostic) => diagnostic.code === IMPORT_GLOB_UNSUPPORTED_CODE), 'unsupported globs produce diagnostics');

  const factory = createRmtVNextImportResolver({
    rootDir,
    roots: [resolveRepoPath(VALID_MODULE_ROOT, rootDir)]
  });
  context.assert(factory.schema === RMT_VNEXT_IMPORT_RESOLVER_SCHEMA, 'factory exposes import resolver schema');
  context.assert(factory.moduleGraphSchema === RMT_VNEXT_MODULE_GRAPH_SCHEMA, 'factory exposes module graph schema');
  context.assert(factory.importEdgeSchema === RMT_VNEXT_IMPORT_EDGE_SCHEMA, 'factory exposes import edge schema');
  context.assert(factory.createGraph({ entryFile: resolveRepoPath(VALID_MODULE_ENTRY, rootDir) }).ok === true, 'factory creates module graph');

  return context.result({
    schema: RMT_VNEXT_IMPORT_RESOLVER_REPORT_SCHEMA,
    resolverSchema: RMT_VNEXT_IMPORT_RESOLVER_SCHEMA,
    moduleGraphSchema: RMT_VNEXT_MODULE_GRAPH_SCHEMA,
    moduleRecordSchema: RMT_VNEXT_MODULE_RECORD_SCHEMA,
    importEdgeSchema: RMT_VNEXT_IMPORT_EDGE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_IMPORT_RESOLVER_WORKPACKAGE,
    importResolverModule: RMT_VNEXT_IMPORT_RESOLVER_MODULE_PATH,
    suite: RMT_VNEXT_IMPORT_RESOLVER_SUITE_PATH,
    moduleCount: graph.moduleCount,
    edgeCount: graph.edgeCount
  });
}

function printRmtVNextImportResolverReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Import Resolver and Module Graph Contract erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Import Resolver and Module Graph Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextImportResolverReport,
  runRmtVNextImportResolverSuite
};

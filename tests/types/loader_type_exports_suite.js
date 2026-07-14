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
  createTypeExportsPlan
} = require('../../catalog/type-exports');
const {
  LOADER_API_METHODS,
  LOADER_DECLARATION_FILES,
  LOADER_EVENT_NAMES,
  LOADER_GLOBALS,
  LOADER_PACKAGE_EXPORTS,
  SKELETON_LOADER_METHODS,
  STYLE_REGISTRY_METHODS,
  TYPE_EXPORTS_LOADER_BACKLOG,
  TYPE_EXPORTS_LOADER_DOCS,
  TYPE_EXPORTS_LOADER_LOCAL_GATE,
  TYPE_EXPORTS_LOADER_MODULE,
  TYPE_EXPORTS_LOADER_PACKAGE_SCRIPT,
  TYPE_EXPORTS_LOADER_REPORT_ARTIFACT,
  TYPE_EXPORTS_LOADER_REPORT_SCHEMA,
  TYPE_EXPORTS_LOADER_SCHEMA,
  TYPE_EXPORTS_LOADER_STATUS,
  TYPE_EXPORTS_LOADER_SUITE,
  TYPE_EXPORTS_LOADER_TARGET,
  TYPE_EXPORTS_LOADER_WORKPACKAGE,
  TYPE_EXPORTS_LOADER_WORKPACKAGE_DOC,
  createTypeExportsLoaderPlan,
  createTypeExportsLoaderReport,
  validateTypeExportsLoaderPlan
} = require('../../catalog/type-exports-loader');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function getTypesCondition(packageManifest, exportKey) {
  const entry = packageManifest.exports && packageManifest.exports[exportKey];
  return entry && typeof entry === 'object' ? entry.types : null;
}

function runTypeExportsLoaderSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'type-exports-loader',
    label: 'TypeExports Loader Declaration Gate'
  });
  const packageManifest = readJson('package.json', rootDir);
  const loaderSource = readText('xtend-loader.js', rootDir);
  const loaderDeclarationSource = readText('xtend-loader.d.ts', rootDir);
  const legacyDeclarationSource = readText('xtend-dev.d.ts', rootDir);
  const typeExportsPlan = createTypeExportsPlan({ rootDir, packageManifest });
  const plan = createTypeExportsLoaderPlan({
    rootDir,
    packageManifest,
    loaderSource,
    loaderDeclarationSource,
    legacyDeclarationSource,
    typeExportsPlan
  });
  const validation = validateTypeExportsLoaderPlan(plan);
  const report = createTypeExportsLoaderReport({ plan });
  const metadata = packageManifest.xtend && packageManifest.xtend.typeExportsLoader;
  const typeExportsMetadata = packageManifest.xtend && packageManifest.xtend.typeExports;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const backlog = readText(TYPE_EXPORTS_LOADER_BACKLOG, rootDir);
  const workpackage = readText(TYPE_EXPORTS_LOADER_WORKPACKAGE_DOC, rootDir);
  const docs = readText(TYPE_EXPORTS_LOADER_DOCS, rootDir);
  const typeExportsDocs = readText('docs/type-exports.md', rootDir);
  const packageExportLockDocs = readText('docs/package-export-lock.md', rootDir);
  const moduleSyntax = syntaxCheckFile(TYPE_EXPORTS_LOADER_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(TYPE_EXPORTS_LOADER_SUITE, { rootDir, extension: '.js' });

  [
    TYPE_EXPORTS_LOADER_MODULE,
    TYPE_EXPORTS_LOADER_SUITE,
    TYPE_EXPORTS_LOADER_DOCS,
    TYPE_EXPORTS_LOADER_WORKPACKAGE_DOC,
    'xtend-loader.d.ts',
    'xtend-dev.d.ts'
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `TypeExports Loader catalog syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `TypeExports Loader suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === TYPE_EXPORTS_LOADER_SCHEMA, 'Loader TypeExports plan exposes stable schema');
  context.assert(plan.reportSchema === TYPE_EXPORTS_LOADER_REPORT_SCHEMA, 'Loader TypeExports plan exposes report schema');
  context.assert(plan.workpackage === TYPE_EXPORTS_LOADER_WORKPACKAGE, 'Loader TypeExports plan belongs to WP-TypeExports-02');
  context.assert(plan.status === TYPE_EXPORTS_LOADER_STATUS, 'Loader TypeExports plan is accepted');
  context.assert(plan.targetReadiness === TYPE_EXPORTS_LOADER_TARGET, 'Loader TypeExports target is ready');
  context.assert(plan.localGate === TYPE_EXPORTS_LOADER_LOCAL_GATE, 'Loader TypeExports exposes local gate');
  context.assert(plan.packageScript === TYPE_EXPORTS_LOADER_PACKAGE_SCRIPT, 'Loader TypeExports exposes package script');
  context.assert(plan.reportArtifact === TYPE_EXPORTS_LOADER_REPORT_ARTIFACT, 'Loader TypeExports exposes report artifact');
  context.assert(validation.schema === TYPE_EXPORTS_LOADER_REPORT_SCHEMA, 'Loader TypeExports validator emits report schema');
  context.assert(validation.ok === true, 'Loader TypeExports plan validates');
  context.assert(report.ok === true, 'Loader TypeExports report validates');
  context.assert(plan.declarationFiles.length === LOADER_DECLARATION_FILES.length, 'Loader TypeExports tracks declaration files');
  context.assert(plan.packageExports.length === LOADER_PACKAGE_EXPORTS.length, 'Loader TypeExports tracks package exports');
  context.assert(plan.loaderApiMethods.length === LOADER_API_METHODS.length, 'Loader TypeExports tracks loader API methods');
  context.assert(plan.styleRegistryMethods.length === STYLE_REGISTRY_METHODS.length, 'Loader TypeExports tracks StyleRegistry methods');
  context.assert(plan.skeletonLoaderMethods.length === SKELETON_LOADER_METHODS.length, 'Loader TypeExports tracks SkeletonLoader methods');
  context.assert(plan.eventNames.length === LOADER_EVENT_NAMES.length, 'Loader TypeExports tracks loader events');
  context.assert(plan.missingLoaderRuntimeMethods.length === 0, 'XTendLoader runtime methods match declaration gate');
  context.assert(plan.missingStyleRegistryRuntimeMethods.length === 0, 'XTendStyleRegistry runtime methods match declaration gate');
  context.assert(plan.missingSkeletonRuntimeMethods.length === 0, 'XTendSkeletonLoader runtime methods match declaration gate');
  context.assert(plan.missingDeclarationTokens.length === 0, 'xtend-loader.d.ts exposes all required tokens');
  context.assert(plan.legacyDeclarationReexportsLoaderTypes === true, 'xtend-dev.d.ts re-exports loader types');
  context.assert(plan.runtimeImportsDeclarationFiles === false, 'Loader runtime does not import declaration files');
  context.assert(plan.bootPathUnchanged === true, 'Loader boot path remains unchanged');
  context.assert(plan.xtendCssOptionalThemeOnly === true, 'xtend.css stays optional theme stylesheet in types');
  context.assert(plan.nextWorkpackage === 'WP-TypeExports-03', 'Loader TypeExports hands off to WP-TypeExports-03');

  context.assert(getTypesCondition(packageManifest, '.') === './xtend-loader.d.ts', 'Root package export exposes loader types condition');
  context.assert(getTypesCondition(packageManifest, './loader') === './xtend-loader.d.ts', './loader package export exposes loader types condition');
  context.assert(getTypesCondition(packageManifest, './legacy-loader') === './xtend-dev.d.ts', './legacy-loader package export exposes legacy types condition');
  context.assert(packageManifest.files.includes('xtend-loader.d.ts'), 'Package files include xtend-loader.d.ts');
  context.assert(packageManifest.files.includes('xtend-dev.d.ts'), 'Package files include xtend-dev.d.ts');
  context.assert(packageManifest.files.includes('xtend-classic-dev-api.d.ts'), 'Package files include Classic DEV API declarations');
  context.assert(packageManifest.exports['./style.css'] === './xtend.css', 'xtend.css package export remains optional stylesheet asset');
  context.assert(typeExportsPlan.classifications.find((entry) => entry.exportKey === '.').declarationExists === true, 'TypeExports sees root loader declaration');
  context.assert(typeExportsPlan.classifications.find((entry) => entry.exportKey === './legacy-loader').declarationExists === true, 'TypeExports sees legacy loader declaration');

  assertTextIncludesAll(context, loaderDeclarationSource, [
    'export interface XTendLoaderApi',
    'export interface XTendStyleRegistryApi',
    'export interface XTendSkeletonLoaderApi',
    'interface WindowEventMap',
    'XTendStyleRegistry: XTendStyleRegistryApi',
    'XTendSkeletonLoader: XTendSkeletonLoaderApi',
    '__XTendLoaderBootPromise?: Promise<XTendLoaderBootResult>',
    '__XTEND_DEV_API__?: XTendDevApi',
    'devApi?: boolean',
    'export interface XTendDevApi',
    'ensureComponent(tag: string',
    'hydrateTree(root?: Document | ShadowRoot | Element',
    'showSkeleton(target: Element | DocumentFragment',
    'hideSkeleton(target: Element | DocumentFragment',
    'ensureRuntimeStyles(options?: XTendRuntimeStyleOptions)',
    'defineComponentStyle(tag: string',
    'adoptStyle(root: XTendStyleRoot | Element',
    "'xtend-loader-diagnostic'",
    "'xtend-loader-performance'",
    "'xtend-loader-tree-hydrated'",
    "standardFileName: 'xtend.css'"
  ], 'xtend-loader.d.ts');
  LOADER_GLOBALS.forEach((globalName) => {
    context.assertIncludes(loaderDeclarationSource, globalName, `xtend-loader.d.ts includes ${globalName}`);
  });

  context.assert(packageManifest.scripts['test:type-exports-loader'] === 'node scripts/run_xtend_tests.js type-exports-loader', 'Package exposes Loader TypeExports script');
  context.assert(packageManifest.xtend.releaseGates.includes(TYPE_EXPORTS_LOADER_PACKAGE_SCRIPT), 'Release gates include Loader TypeExports script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(TYPE_EXPORTS_LOADER_PACKAGE_SCRIPT), 'Release checklist includes Loader TypeExports script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(TYPE_EXPORTS_LOADER_WORKPACKAGE_DOC), 'Artifact checklist includes Loader TypeExports workpackage');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(TYPE_EXPORTS_LOADER_REPORT_ARTIFACT), 'Artifact checklist includes Loader TypeExports report artifact');
  context.assert(metadata && metadata.schema === TYPE_EXPORTS_LOADER_SCHEMA, 'Package metadata exposes Loader TypeExports schema');
  context.assert(metadata && metadata.workpackage === TYPE_EXPORTS_LOADER_WORKPACKAGE, 'Package metadata exposes WP-TypeExports-02');
  context.assert(metadata && metadata.status === TYPE_EXPORTS_LOADER_STATUS, 'Package metadata exposes Loader TypeExports status');
  context.assert(metadata && metadata.localGate === TYPE_EXPORTS_LOADER_LOCAL_GATE, 'Package metadata exposes Loader TypeExports local gate');
  context.assert(metadata && metadata.packageScript === TYPE_EXPORTS_LOADER_PACKAGE_SCRIPT, 'Package metadata exposes Loader TypeExports package script');
  context.assert(metadata && metadata.xtendCssDependency === false, 'Package metadata keeps xtend.css out of type dependency');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-TypeExports-03', 'Package metadata hands off to WP-TypeExports-03');
  context.assert(typeExportsMetadata && typeExportsMetadata.completedWorkpackages.includes(TYPE_EXPORTS_LOADER_WORKPACKAGE), 'TypeExports metadata records WP-TypeExports-02 completion');
  context.assertIncludes(runner, "id: 'type-exports-loader'", 'Runner registers Loader TypeExports suite');
  context.assertIncludes(runner, 'runTypeExportsLoaderSuite', 'Runner imports Loader TypeExports suite');
  context.assertIncludes(docsReadme, './xtend-loader-types.md', 'Docs README links Loader Type docs');
  context.assertIncludes(testsReadme, TYPE_EXPORTS_LOADER_LOCAL_GATE, 'Tests README documents Loader TypeExports gate');

  assertTextIncludesAll(context, backlog, [
    '| `WP-TypeExports-02` | P0 | completed | WS1 | XTendLoader, StyleRegistry und SkeletonLoader typisieren |',
    '| `WP-TypeExports-03` | P0 | completed | WS1 | `api.js` und `window.XTend.*` Namespace typisieren |',
    '| `WP-TypeExports-04` | P1 | completed | WS2 | XTendRMT Runtime-, Browser- und RMT-Language-Exports typisieren |',
    '| `WP-TypeExports-05` | P1 | completed | WS3 | Fabric-, A11y- und Security-Policy-APIs typisieren |',
    '| `WP-TypeExports-09` | P1 | completed | WS7 | TypeExports Gate, Drift-Report und Docs-Handoff produktisieren |',
    'xtend-loader.d.ts',
    TYPE_EXPORTS_LOADER_LOCAL_GATE
  ], 'TypeExports backlog');
  assertTextIncludesAll(context, workpackage, [
    TYPE_EXPORTS_LOADER_SCHEMA,
    TYPE_EXPORTS_LOADER_LOCAL_GATE,
    TYPE_EXPORTS_LOADER_REPORT_ARTIFACT,
    'Status: `completed`',
    'xtend.css bleibt optionales Theme-Artefakt'
  ], 'WP-TypeExports-02 document');
  assertTextIncludesAll(context, docs, [
    TYPE_EXPORTS_LOADER_SCHEMA,
    TYPE_EXPORTS_LOADER_LOCAL_GATE,
    'XTendLoaderApi',
    'XTendStyleRegistryApi',
    'XTendSkeletonLoaderApi',
    './xtend-dev.d.ts',
    'xtend-loader-diagnostic',
    'xtend.css bleibt optional'
  ], 'Loader Type docs');
  assertTextIncludesAll(context, typeExportsDocs, [
    './xtend-loader.d.ts',
    './xtend-loader-types.md'
  ], 'TypeExports docs');
  assertTextIncludesAll(context, packageExportLockDocs, [
    './xtend-loader.d.ts',
    './xtend-dev.d.ts',
    TYPE_EXPORTS_LOADER_LOCAL_GATE
  ], 'Package Export Lock docs');

  return context.result({
    report: {
      schema: TYPE_EXPORTS_LOADER_REPORT_SCHEMA,
      declarationFiles: report.declarationFiles,
      packageExports: report.packageExports,
      loaderApiMethodCount: report.loaderApiMethodCount,
      styleRegistryMethodCount: report.styleRegistryMethodCount,
      skeletonLoaderMethodCount: report.skeletonLoaderMethodCount,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printTypeExportsLoaderReport(result) {
  printSuiteReport(result, {
    successTitle: 'TypeExports Loader Declaration Gate erfolgreich.',
    failureTitle: 'TypeExports Loader Declaration Gate fehlgeschlagen:'
  });
}

module.exports = {
  printTypeExportsLoaderReport,
  runTypeExportsLoaderSuite
};

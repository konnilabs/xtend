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
  API_DECLARATION_FILES,
  API_GLOBALS,
  API_METHOD_TOKENS,
  API_PACKAGE_EXPORTS,
  API_READY_EVENTS,
  TYPE_EXPORTS_API_BACKLOG,
  TYPE_EXPORTS_API_DOCS,
  TYPE_EXPORTS_API_LOCAL_GATE,
  TYPE_EXPORTS_API_MODULE,
  TYPE_EXPORTS_API_PACKAGE_SCRIPT,
  TYPE_EXPORTS_API_REPORT_ARTIFACT,
  TYPE_EXPORTS_API_REPORT_SCHEMA,
  TYPE_EXPORTS_API_SCHEMA,
  TYPE_EXPORTS_API_STATUS,
  TYPE_EXPORTS_API_SUITE,
  TYPE_EXPORTS_API_TARGET,
  TYPE_EXPORTS_API_WORKPACKAGE,
  TYPE_EXPORTS_API_WORKPACKAGE_DOC,
  XTEND_NAMESPACE_KEYS,
  createTypeExportsApiPlan,
  createTypeExportsApiReport,
  validateTypeExportsApiPlan
} = require('../../catalog/type-exports-api');

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

function runTypeExportsApiSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'type-exports-api',
    label: 'TypeExports API Declaration Gate'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const apiSource = readText('api.js', rootDir);
  const apiDeclarationSource = readText('api.d.ts', rootDir);
  const typeExportsPlan = createTypeExportsPlan({ rootDir, packageManifest });
  const plan = createTypeExportsApiPlan({
    rootDir,
    packageManifest,
    apiSource,
    apiDeclarationSource,
    typeExportsPlan
  });
  const validation = validateTypeExportsApiPlan(plan);
  const report = createTypeExportsApiReport({ plan });
  const metadata = packageManifest.xtend && packageManifest.xtend.typeExportsApi;
  const typeExportsMetadata = packageManifest.xtend && packageManifest.xtend.typeExports;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const backlog = readText(TYPE_EXPORTS_API_BACKLOG, rootDir);
  const workpackage = readText(TYPE_EXPORTS_API_WORKPACKAGE_DOC, rootDir);
  const docs = readText(TYPE_EXPORTS_API_DOCS, rootDir);
  const typeExportsDocs = readText('docs/type-exports.md', rootDir);
  const packageExportLockDocs = readText('docs/package-export-lock.md', rootDir);
  const moduleSyntax = syntaxCheckFile(TYPE_EXPORTS_API_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(TYPE_EXPORTS_API_SUITE, { rootDir, extension: '.js' });

  [
    TYPE_EXPORTS_API_MODULE,
    TYPE_EXPORTS_API_SUITE,
    TYPE_EXPORTS_API_DOCS,
    TYPE_EXPORTS_API_WORKPACKAGE_DOC,
    'api.d.ts'
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `TypeExports API catalog syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `TypeExports API suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === TYPE_EXPORTS_API_SCHEMA, 'API TypeExports plan exposes stable schema');
  context.assert(plan.reportSchema === TYPE_EXPORTS_API_REPORT_SCHEMA, 'API TypeExports plan exposes report schema');
  context.assert(plan.workpackage === TYPE_EXPORTS_API_WORKPACKAGE, 'API TypeExports plan belongs to WP-TypeExports-03');
  context.assert(plan.status === TYPE_EXPORTS_API_STATUS, 'API TypeExports plan is accepted');
  context.assert(plan.targetReadiness === TYPE_EXPORTS_API_TARGET, 'API TypeExports target is ready');
  context.assert(plan.localGate === TYPE_EXPORTS_API_LOCAL_GATE, 'API TypeExports exposes local gate');
  context.assert(plan.packageScript === TYPE_EXPORTS_API_PACKAGE_SCRIPT, 'API TypeExports exposes package script');
  context.assert(plan.reportArtifact === TYPE_EXPORTS_API_REPORT_ARTIFACT, 'API TypeExports exposes report artifact');
  context.assert(validation.schema === TYPE_EXPORTS_API_REPORT_SCHEMA, 'API TypeExports validator emits report schema');
  context.assert(validation.ok === true, 'API TypeExports plan validates');
  context.assert(report.ok === true, 'API TypeExports report validates');
  context.assert(plan.declarationFiles.length === API_DECLARATION_FILES.length, 'API TypeExports tracks declaration files');
  context.assert(plan.packageExports.length === API_PACKAGE_EXPORTS.length, 'API TypeExports tracks package exports');
  context.assert(plan.globals.length === API_GLOBALS.length, 'API TypeExports tracks globals');
  context.assert(plan.namespaceKeys.length === XTEND_NAMESPACE_KEYS.length, 'API TypeExports tracks XTend namespace keys');
  context.assert(plan.eventNames.length === API_READY_EVENTS.length, 'API TypeExports tracks API events');
  context.assert(plan.methodTokens.length === API_METHOD_TOKENS.length, 'API TypeExports tracks API method tokens');
  context.assert(plan.missingRuntimeGlobals.length === 0, 'api.js runtime globals match declaration gate');
  context.assert(plan.missingNamespaceAssignments.length === 0, 'api.js XTend namespace assignments match declaration gate');
  context.assert(plan.missingRuntimeEvents.length === 0, 'api.js runtime events match declaration gate');
  context.assert(plan.missingRuntimeMethods.length === 0, 'api.js runtime methods match declaration gate');
  context.assert(plan.missingDeclarationTokens.length === 0, 'api.d.ts exposes all required tokens');
  context.assert(plan.runtimeImportsDeclarationFiles === false, 'API runtime does not import declaration files');
  context.assert(plan.typeExportsApiDeclarationExists === true, 'TypeExports sees api.d.ts declaration');
  context.assert(plan.nextWorkpackage === 'WP-TypeExports-04', 'API TypeExports hands off to WP-TypeExports-04');

  context.assert(getTypesCondition(packageManifest, './api') === './api.d.ts', './api package export exposes API types condition');
  context.assert(packageManifest.files.includes('api.d.ts'), 'Package files include api.d.ts');
  context.assert(typeExportsPlan.classifications.find((entry) => entry.exportKey === './api').declarationExists === true, 'TypeExports sees API declaration');

  assertTextIncludesAll(context, apiDeclarationSource, [
    'export function initXTendAPI',
    'export interface XTendNamespace',
    'export interface XTendComplianceApi',
    'export interface XTendThemeApi',
    'export interface XTendToastApi',
    'export interface XTendAlertApi',
    'export interface XTendDialogApi',
    'export interface XTendModalApi',
    'export interface XTendApiReadyDetail',
    'interface WindowEventMap',
    "'xtend-api-ready'",
    'XTend?: XTendNamespace',
    'XTheme?: XTendThemeApi',
    'XToast?: XTendToastApi',
    'XAlert?: XTendAlertApi',
    'XDialog?: XTendDialogApi',
    'XModal?: XTendModalApi',
    'showToast?: XTendToastApi',
    'showAlert?: XTendAlertApi',
    'showDialog?: XTendDialogApi',
    'showModal?: XTendModalApi'
  ], 'api.d.ts');
  API_GLOBALS.forEach((globalName) => {
    context.assertIncludes(apiDeclarationSource, globalName, `api.d.ts includes ${globalName}`);
  });
  XTEND_NAMESPACE_KEYS.forEach((namespaceKey) => {
    context.assertIncludes(apiDeclarationSource, namespaceKey, `api.d.ts includes XTend.${namespaceKey}`);
  });

  context.assert(packageManifest.scripts['test:type-exports-api'] === 'node scripts/run_xtend_tests.js type-exports-api', 'Package exposes API TypeExports script');
  context.assert(packageManifest.xtend.releaseGates.includes(TYPE_EXPORTS_API_PACKAGE_SCRIPT), 'Release gates include API TypeExports script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(TYPE_EXPORTS_API_PACKAGE_SCRIPT), 'Release checklist includes API TypeExports script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(TYPE_EXPORTS_API_WORKPACKAGE_DOC), 'Artifact checklist includes API TypeExports workpackage');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(TYPE_EXPORTS_API_REPORT_ARTIFACT), 'Artifact checklist includes API TypeExports report artifact');
  context.assert(metadata && metadata.schema === TYPE_EXPORTS_API_SCHEMA, 'Package metadata exposes API TypeExports schema');
  context.assert(metadata && metadata.workpackage === TYPE_EXPORTS_API_WORKPACKAGE, 'Package metadata exposes WP-TypeExports-03');
  context.assert(metadata && metadata.status === TYPE_EXPORTS_API_STATUS, 'Package metadata exposes API TypeExports status');
  context.assert(metadata && metadata.localGate === TYPE_EXPORTS_API_LOCAL_GATE, 'Package metadata exposes API TypeExports local gate');
  context.assert(metadata && metadata.packageScript === TYPE_EXPORTS_API_PACKAGE_SCRIPT, 'Package metadata exposes API TypeExports package script');
  context.assert(metadata && metadata.runtimeChanged === false, 'Package metadata keeps API runtime unchanged');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-TypeExports-04', 'Package metadata hands off to WP-TypeExports-04');
  context.assert(typeExportsMetadata && typeExportsMetadata.completedWorkpackages.includes(TYPE_EXPORTS_API_WORKPACKAGE), 'TypeExports metadata records WP-TypeExports-03 completion');
  context.assert(runner.hasSuite("type-exports-api"), 'Runner registers API TypeExports suite');
  context.assert(runner.hasImplementation({ function: "runTypeExportsApiSuite" }), 'Runner imports API TypeExports suite');
  context.assertIncludes(docsReadme, './xtend-api-types.md', 'Docs README links API Type docs');
  context.assertIncludes(testsReadme, TYPE_EXPORTS_API_LOCAL_GATE, 'Tests README documents API TypeExports gate');

  assertTextIncludesAll(context, backlog, [
    '| `WP-TypeExports-03` | P0 | completed | WS1 | `api.js` und `window.XTend.*` Namespace typisieren |',
    '| `WP-TypeExports-04` | P1 | completed | WS2 | XTendRMT Runtime-, Browser- und RMT-Language-Exports typisieren |',
    '| `WP-TypeExports-05` | P1 | completed | WS3 | Fabric-, A11y- und Security-Policy-APIs typisieren |',
    '| `WP-TypeExports-09` | P1 | completed | WS7 | TypeExports Gate, Drift-Report und Docs-Handoff produktisieren |',
    'api.d.ts',
    TYPE_EXPORTS_API_LOCAL_GATE
  ], 'TypeExports backlog');
  assertTextIncludesAll(context, workpackage, [
    TYPE_EXPORTS_API_SCHEMA,
    TYPE_EXPORTS_API_LOCAL_GATE,
    TYPE_EXPORTS_API_REPORT_ARTIFACT,
    'Status: `completed`',
    'api.js bleibt runtime-unveraendert'
  ], 'WP-TypeExports-03 document');
  assertTextIncludesAll(context, docs, [
    TYPE_EXPORTS_API_SCHEMA,
    TYPE_EXPORTS_API_LOCAL_GATE,
    'XTendNamespace',
    'XTendComplianceApi',
    'XTendThemeApi',
    'XTendToastApi',
    'xtend-api-ready'
  ], 'API Type docs');
  assertTextIncludesAll(context, typeExportsDocs, [
    'WP-TypeExports-03',
    './api.d.ts',
    './xtend-api-types.md'
  ], 'TypeExports docs');
  assertTextIncludesAll(context, packageExportLockDocs, [
    './api.d.ts',
    TYPE_EXPORTS_API_LOCAL_GATE
  ], 'Package Export Lock docs');

  return context.result({
    report: {
      schema: TYPE_EXPORTS_API_REPORT_SCHEMA,
      declarationFiles: report.declarationFiles,
      packageExports: report.packageExports,
      globalCount: report.globalCount,
      namespaceKeyCount: report.namespaceKeyCount,
      eventNames: report.eventNames,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printTypeExportsApiReport(result) {
  printSuiteReport(result, {
    successTitle: 'TypeExports API Declaration Gate erfolgreich.',
    failureTitle: 'TypeExports API Declaration Gate fehlgeschlagen:'
  });
}

module.exports = {
  printTypeExportsApiReport,
  runTypeExportsApiSuite
};

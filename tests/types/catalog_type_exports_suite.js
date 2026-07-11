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
  CATALOG_PACKAGE_EXPORTS,
  CATALOG_REPRESENTATIVE_DECLARATION_TOKENS,
  CATALOG_SHARED_DECLARATION_FILE,
  CATALOG_SHARED_TYPE_TOKENS,
  TYPE_EXPORTS_CATALOG_BACKLOG,
  TYPE_EXPORTS_CATALOG_DOCS,
  TYPE_EXPORTS_CATALOG_LOCAL_GATE,
  TYPE_EXPORTS_CATALOG_MODULE,
  TYPE_EXPORTS_CATALOG_PACKAGE_SCRIPT,
  TYPE_EXPORTS_CATALOG_REPORT_ARTIFACT,
  TYPE_EXPORTS_CATALOG_REPORT_SCHEMA,
  TYPE_EXPORTS_CATALOG_SCHEMA,
  TYPE_EXPORTS_CATALOG_STATUS,
  TYPE_EXPORTS_CATALOG_SUITE,
  TYPE_EXPORTS_CATALOG_TARGET,
  TYPE_EXPORTS_CATALOG_WORKPACKAGE,
  TYPE_EXPORTS_CATALOG_WORKPACKAGE_DOC,
  createTypeExportsCatalogPlan,
  createTypeExportsCatalogReport,
  resolveDeclarationForExport,
  validateTypeExportsCatalogPlan
} = require('../../catalog/type-exports-catalog');

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

function runTypeExportsCatalogSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'type-exports-catalog',
    label: 'TypeExports Catalog Declaration Gate'
  });
  const packageManifest = readJson('package.json', rootDir);
  const typeExportsPlan = createTypeExportsPlan({ rootDir, packageManifest });
  const plan = createTypeExportsCatalogPlan({ rootDir, packageManifest, typeExportsPlan });
  const validation = validateTypeExportsCatalogPlan(plan);
  const report = createTypeExportsCatalogReport({ plan });
  const metadata = packageManifest.xtend && packageManifest.xtend.typeExportsCatalog;
  const typeExportsMetadata = packageManifest.xtend && packageManifest.xtend.typeExports;
  const sharedDeclarationSource = readText(CATALOG_SHARED_DECLARATION_FILE, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const backlog = readText(TYPE_EXPORTS_CATALOG_BACKLOG, rootDir);
  const workpackage = readText(TYPE_EXPORTS_CATALOG_WORKPACKAGE_DOC, rootDir);
  const docs = readText(TYPE_EXPORTS_CATALOG_DOCS, rootDir);
  const typeExportsDocs = readText('docs/type-exports.md', rootDir);
  const packageExportLockDocs = readText('docs/package-export-lock.md', rootDir);
  const moduleSyntax = syntaxCheckFile(TYPE_EXPORTS_CATALOG_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(TYPE_EXPORTS_CATALOG_SUITE, { rootDir, extension: '.js' });

  [
    TYPE_EXPORTS_CATALOG_MODULE,
    TYPE_EXPORTS_CATALOG_SUITE,
    TYPE_EXPORTS_CATALOG_DOCS,
    TYPE_EXPORTS_CATALOG_WORKPACKAGE_DOC,
    ...plan.declarationFiles.map((entry) => entry.filePath)
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `TypeExports Catalog catalog syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `TypeExports Catalog suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === TYPE_EXPORTS_CATALOG_SCHEMA, 'Catalog TypeExports plan exposes stable schema');
  context.assert(plan.reportSchema === TYPE_EXPORTS_CATALOG_REPORT_SCHEMA, 'Catalog TypeExports plan exposes report schema');
  context.assert(plan.workpackage === TYPE_EXPORTS_CATALOG_WORKPACKAGE, 'Catalog TypeExports plan belongs to WP-TypeExports-07');
  context.assert(plan.status === TYPE_EXPORTS_CATALOG_STATUS, 'Catalog TypeExports plan is accepted');
  context.assert(plan.targetReadiness === TYPE_EXPORTS_CATALOG_TARGET, 'Catalog TypeExports target is ready');
  context.assert(plan.localGate === TYPE_EXPORTS_CATALOG_LOCAL_GATE, 'Catalog TypeExports exposes local gate');
  context.assert(plan.packageScript === TYPE_EXPORTS_CATALOG_PACKAGE_SCRIPT, 'Catalog TypeExports exposes package script');
  context.assert(plan.reportArtifact === TYPE_EXPORTS_CATALOG_REPORT_ARTIFACT, 'Catalog TypeExports exposes report artifact');
  context.assert(validation.schema === TYPE_EXPORTS_CATALOG_REPORT_SCHEMA, 'Catalog TypeExports validator emits report schema');
  context.assert(validation.ok === true, 'Catalog TypeExports plan validates');
  context.assert(report.ok === true, 'Catalog TypeExports report validates');
  context.assert(plan.packageExports.length === CATALOG_PACKAGE_EXPORTS.length, 'Catalog TypeExports tracks package exports');
  context.assert(plan.declarationFiles.length === plan.sourceModules.length + 1, 'Catalog TypeExports tracks shared plus per-module declarations');
  context.assert(plan.familyCounts['surface-manager-catalog'] > 0, 'Catalog TypeExports classifies SurfaceManager catalogs');
  context.assert(plan.familyCounts['epic-catalog'] > 0, 'Catalog TypeExports classifies Epic catalogs');
  context.assert(plan.familyCounts.release > 0, 'Catalog TypeExports classifies release catalogs');
  context.assert(plan.missingTypesConditions.length === 0, 'Catalog package exports expose types conditions');
  context.assert(plan.mismatchedTypesConditions.length === 0, 'Catalog package exports use expected declaration targets');
  context.assert(plan.missingRuntimeTargets.length === 0, 'Catalog package exports keep expected runtime targets');
  context.assert(plan.missingDeclarationFiles.length === 0, 'Catalog declaration files exist');
  context.assert(plan.missingSharedTypeTokens.length === 0, 'Catalog shared types expose stable tokens');
  context.assert(plan.missingRepresentativeDeclarationTokens.length === 0, 'Catalog representative declarations expose service tokens');
  context.assert(plan.missingRuntimeExportTokens.length === 0, 'Catalog declaration facades expose runtime export symbols');
  context.assert(plan.forbiddenDeclarationRuntimeImports.length === 0, 'Catalog declarations do not import forbidden runtime surfaces');
  context.assert(plan.runtimeImportsDeclarationFiles.length === 0, 'Catalog runtime does not import declaration files');
  context.assert(plan.typeExportsMissingDeclarations.length === 0, 'TypeExports sees Catalog declarations');
  context.assert(plan.runtimeChanged === false, 'Catalog TypeExports changes no runtime code');
  context.assert(plan.nextWorkpackage === 'WP-TypeExports-08', 'Catalog TypeExports hands off to WP-TypeExports-08');

  CATALOG_PACKAGE_EXPORTS.forEach((exportKey) => {
    const expectedTypes = resolveDeclarationForExport(exportKey);
    context.assert(getTypesCondition(packageManifest, exportKey) === expectedTypes, `${exportKey} package export exposes ${expectedTypes}`);
    const classification = typeExportsPlan.classifications.find((entry) => entry.exportKey === exportKey);
    context.assert(classification && classification.proposedTypesCondition === expectedTypes, `TypeExports proposes ${expectedTypes} for ${exportKey}`);
    context.assert(classification && classification.declarationExists === true, `TypeExports sees ${exportKey} declaration`);
    context.assert(classification && classification.typeDecision === 'declaration-ready', `TypeExports marks ${exportKey} declaration ready`);
  });

  CATALOG_SHARED_TYPE_TOKENS.forEach((token) => {
    context.assertIncludes(sharedDeclarationSource, token, `Catalog shared declaration includes ${token}`);
  });
  Object.entries(CATALOG_REPRESENTATIVE_DECLARATION_TOKENS).forEach(([filePath, tokens]) => {
    const source = readText(filePath, rootDir);
    assertTextIncludesAll(context, source, tokens, filePath);
  });

  context.assert(packageManifest.scripts['test:type-exports-catalog'] === 'node scripts/run_xtend_tests.js type-exports-catalog', 'Package exposes Catalog TypeExports script');
  context.assert(packageManifest.xtend.releaseGates.includes(TYPE_EXPORTS_CATALOG_PACKAGE_SCRIPT), 'Release gates include Catalog TypeExports script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(TYPE_EXPORTS_CATALOG_PACKAGE_SCRIPT), 'Release checklist includes Catalog TypeExports script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(TYPE_EXPORTS_CATALOG_WORKPACKAGE_DOC), 'Artifact checklist includes Catalog TypeExports workpackage');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(TYPE_EXPORTS_CATALOG_REPORT_ARTIFACT), 'Artifact checklist includes Catalog TypeExports report artifact');
  context.assert(metadata && metadata.schema === TYPE_EXPORTS_CATALOG_SCHEMA, 'Package metadata exposes Catalog TypeExports schema');
  context.assert(metadata && metadata.workpackage === TYPE_EXPORTS_CATALOG_WORKPACKAGE, 'Package metadata exposes WP-TypeExports-07');
  context.assert(metadata && metadata.status === TYPE_EXPORTS_CATALOG_STATUS, 'Package metadata exposes Catalog TypeExports status');
  context.assert(metadata && metadata.localGate === TYPE_EXPORTS_CATALOG_LOCAL_GATE, 'Package metadata exposes Catalog TypeExports local gate');
  context.assert(metadata && metadata.packageScript === TYPE_EXPORTS_CATALOG_PACKAGE_SCRIPT, 'Package metadata exposes Catalog TypeExports package script');
  context.assert(metadata && metadata.runtimeChanged === false, 'Package metadata keeps Catalog runtime unchanged');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-TypeExports-08', 'Package metadata hands off to WP-TypeExports-08');
  context.assert(typeExportsMetadata && typeExportsMetadata.completedWorkpackages.includes(TYPE_EXPORTS_CATALOG_WORKPACKAGE), 'TypeExports metadata records WP-TypeExports-07 completion');
  context.assert(typeExportsMetadata && typeExportsMetadata.completedWorkpackages.includes('WP-TypeExports-09'), 'TypeExports metadata records WP-TypeExports-09 completion');
  context.assert(typeExportsMetadata && Array.isArray(typeExportsMetadata.nextWorkpackages) && typeExportsMetadata.nextWorkpackages.length === 0, 'TypeExports metadata has no remaining TypeExports workpackages');
  context.assertIncludes(runner, "id: 'type-exports-catalog'", 'Runner registers Catalog TypeExports suite');
  context.assertIncludes(runner, 'runTypeExportsCatalogSuite', 'Runner imports Catalog TypeExports suite');
  context.assertIncludes(docsReadme, './xtend-catalog-types.md', 'Docs README links Catalog Type docs');
  context.assertIncludes(testsReadme, TYPE_EXPORTS_CATALOG_LOCAL_GATE, 'Tests README documents Catalog TypeExports gate');

  assertTextIncludesAll(context, backlog, [
    '| `WP-TypeExports-07` | P2 | completed | WS5 | Catalog Declaration Pattern fuer Plan-/Report-Module einfuehren |',
    '| `WP-TypeExports-09` | P1 | completed | WS7 | TypeExports Gate, Drift-Report und Docs-Handoff produktisieren |',
    CATALOG_SHARED_DECLARATION_FILE,
    TYPE_EXPORTS_CATALOG_LOCAL_GATE
  ], 'TypeExports backlog');
  assertTextIncludesAll(context, workpackage, [
    TYPE_EXPORTS_CATALOG_SCHEMA,
    TYPE_EXPORTS_CATALOG_LOCAL_GATE,
    TYPE_EXPORTS_CATALOG_REPORT_ARTIFACT,
    'Status: `completed`',
    'SurfaceManager-Catalogs bleiben interne XTend-UI-Unterstuetzung'
  ], 'WP-TypeExports-07 document');
  assertTextIncludesAll(context, docs, [
    TYPE_EXPORTS_CATALOG_SCHEMA,
    TYPE_EXPORTS_CATALOG_LOCAL_GATE,
    './catalog/catalog-public-types.d.ts',
    'XtendCatalogPlan',
    'XtendCatalogReport',
    'XtendCatalogFactory',
    'SurfaceManager-Catalogs'
  ], 'Catalog Type docs');
  assertTextIncludesAll(context, typeExportsDocs, [
    'WP-TypeExports-07',
    './catalog/catalog-public-types.d.ts',
    './xtend-catalog-types.md'
  ], 'TypeExports docs');
  assertTextIncludesAll(context, packageExportLockDocs, [
    './catalog/catalog-public-types.d.ts',
    TYPE_EXPORTS_CATALOG_LOCAL_GATE
  ], 'Package Export Lock docs');

  return context.result({
    report: {
      schema: TYPE_EXPORTS_CATALOG_REPORT_SCHEMA,
      declarationFileCount: report.declarationFileCount,
      packageExportCount: report.packageExportCount,
      sourceModuleCount: report.sourceModuleCount,
      familyCounts: report.familyCounts,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printTypeExportsCatalogReport(result) {
  printSuiteReport(result, {
    successTitle: 'TypeExports Catalog Declaration Gate erfolgreich.',
    failureTitle: 'TypeExports Catalog Declaration Gate fehlgeschlagen:'
  });
}

module.exports = {
  printTypeExportsCatalogReport,
  runTypeExportsCatalogSuite
};

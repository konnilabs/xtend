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
  BUILDER_DECLARATION_FILES,
  BUILDER_PACKAGE_EXPORTS,
  BUILDER_REPRESENTATIVE_DECLARATION_TOKENS,
  BUILDER_SHARED_DECLARATION_FILE,
  BUILDER_SHARED_TYPE_TOKENS,
  TYPE_EXPORTS_BUILDER_BACKLOG,
  TYPE_EXPORTS_BUILDER_DOCS,
  TYPE_EXPORTS_BUILDER_LOCAL_GATE,
  TYPE_EXPORTS_BUILDER_MODULE,
  TYPE_EXPORTS_BUILDER_PACKAGE_SCRIPT,
  TYPE_EXPORTS_BUILDER_REPORT_ARTIFACT,
  TYPE_EXPORTS_BUILDER_REPORT_SCHEMA,
  TYPE_EXPORTS_BUILDER_SCHEMA,
  TYPE_EXPORTS_BUILDER_STATUS,
  TYPE_EXPORTS_BUILDER_SUITE,
  TYPE_EXPORTS_BUILDER_TARGET,
  TYPE_EXPORTS_BUILDER_WORKPACKAGE,
  TYPE_EXPORTS_BUILDER_WORKPACKAGE_DOC,
  createTypeExportsBuilderPlan,
  createTypeExportsBuilderReport,
  resolveDeclarationForExport,
  validateTypeExportsBuilderPlan
} = require('../../catalog/type-exports-builder');

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

function runTypeExportsBuilderSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'type-exports-builder',
    label: 'TypeExports Builder Declaration Gate'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const typeExportsPlan = createTypeExportsPlan({ rootDir, packageManifest });
  const plan = createTypeExportsBuilderPlan({ rootDir, packageManifest, typeExportsPlan });
  const validation = validateTypeExportsBuilderPlan(plan);
  const report = createTypeExportsBuilderReport({ plan });
  const metadata = packageManifest.xtend && packageManifest.xtend.typeExportsBuilder;
  const typeExportsMetadata = packageManifest.xtend && packageManifest.xtend.typeExports;
  const sharedDeclarationSource = readText(BUILDER_SHARED_DECLARATION_FILE, rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const backlog = readText(TYPE_EXPORTS_BUILDER_BACKLOG, rootDir);
  const workpackage = readText(TYPE_EXPORTS_BUILDER_WORKPACKAGE_DOC, rootDir);
  const docs = readText(TYPE_EXPORTS_BUILDER_DOCS, rootDir);
  const typeExportsDocs = readText('docs/type-exports.md', rootDir);
  const packageExportLockDocs = readText('docs/package-export-lock.md', rootDir);
  const moduleSyntax = syntaxCheckFile(TYPE_EXPORTS_BUILDER_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(TYPE_EXPORTS_BUILDER_SUITE, { rootDir, extension: '.js' });

  [
    TYPE_EXPORTS_BUILDER_MODULE,
    TYPE_EXPORTS_BUILDER_SUITE,
    TYPE_EXPORTS_BUILDER_DOCS,
    TYPE_EXPORTS_BUILDER_WORKPACKAGE_DOC,
    ...BUILDER_DECLARATION_FILES
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `TypeExports Builder catalog syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `TypeExports Builder suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === TYPE_EXPORTS_BUILDER_SCHEMA, 'Builder TypeExports plan exposes stable schema');
  context.assert(plan.reportSchema === TYPE_EXPORTS_BUILDER_REPORT_SCHEMA, 'Builder TypeExports plan exposes report schema');
  context.assert(plan.workpackage === TYPE_EXPORTS_BUILDER_WORKPACKAGE, 'Builder TypeExports plan belongs to WP-TypeExports-06');
  context.assert(plan.status === TYPE_EXPORTS_BUILDER_STATUS, 'Builder TypeExports plan is accepted');
  context.assert(plan.targetReadiness === TYPE_EXPORTS_BUILDER_TARGET, 'Builder TypeExports target is ready');
  context.assert(plan.localGate === TYPE_EXPORTS_BUILDER_LOCAL_GATE, 'Builder TypeExports exposes local gate');
  context.assert(plan.packageScript === TYPE_EXPORTS_BUILDER_PACKAGE_SCRIPT, 'Builder TypeExports exposes package script');
  context.assert(plan.reportArtifact === TYPE_EXPORTS_BUILDER_REPORT_ARTIFACT, 'Builder TypeExports exposes report artifact');
  context.assert(validation.schema === TYPE_EXPORTS_BUILDER_REPORT_SCHEMA, 'Builder TypeExports validator emits report schema');
  context.assert(validation.ok === true, 'Builder TypeExports plan validates');
  context.assert(report.ok === true, 'Builder TypeExports report validates');
  context.assert(plan.packageExports.length === BUILDER_PACKAGE_EXPORTS.length, 'Builder TypeExports tracks package exports');
  context.assert(plan.declarationFiles.length === BUILDER_DECLARATION_FILES.length, 'Builder TypeExports tracks declaration files');
  context.assert(plan.missingTypesConditions.length === 0, 'Builder package exports expose types conditions');
  context.assert(plan.mismatchedTypesConditions.length === 0, 'Builder package exports use expected declaration targets');
  context.assert(plan.missingRuntimeTargets.length === 0, 'Builder package exports keep expected runtime targets');
  context.assert(plan.missingDeclarationFiles.length === 0, 'Builder declaration files exist');
  context.assert(plan.missingSharedTypeTokens.length === 0, 'Builder shared types expose stable tokens');
  context.assert(plan.missingRepresentativeDeclarationTokens.length === 0, 'Builder representative declarations expose service tokens');
  context.assert(plan.missingRuntimeExportTokens.length === 0, 'Builder declaration facades expose runtime export symbols');
  context.assert(plan.forbiddenDeclarationRuntimeImports.length === 0, 'Builder declarations do not import forbidden runtime surfaces');
  context.assert(plan.runtimeImportsDeclarationFiles.length === 0, 'Builder runtime does not import declaration files');
  context.assert(plan.typeExportsMissingDeclarations.length === 0, 'TypeExports sees Builder declarations');
  context.assert(plan.runtimeChanged === false, 'Builder TypeExports changes no runtime code');
  context.assert(plan.nextWorkpackage === 'WP-TypeExports-07', 'Builder TypeExports hands off to WP-TypeExports-07');

  BUILDER_PACKAGE_EXPORTS.forEach((exportKey) => {
    const expectedTypes = resolveDeclarationForExport(exportKey);
    context.assert(getTypesCondition(packageManifest, exportKey) === expectedTypes, `${exportKey} package export exposes ${expectedTypes}`);
    const classification = typeExportsPlan.classifications.find((entry) => entry.exportKey === exportKey);
    context.assert(classification && classification.proposedTypesCondition === expectedTypes, `TypeExports proposes ${expectedTypes} for ${exportKey}`);
    if (exportKey !== './builder/*') {
      context.assert(classification && classification.declarationExists === true, `TypeExports sees ${exportKey} declaration`);
      context.assert(classification && classification.typeDecision === 'declaration-ready', `TypeExports marks ${exportKey} declaration ready`);
    }
  });
  context.assert(packageManifest.files.includes('xtend-builder'), 'Package files include xtend-builder root');

  BUILDER_SHARED_TYPE_TOKENS.forEach((token) => {
    context.assertIncludes(sharedDeclarationSource, token, `Builder shared declaration includes ${token}`);
  });
  Object.entries(BUILDER_REPRESENTATIVE_DECLARATION_TOKENS).forEach(([filePath, tokens]) => {
    const source = readText(filePath, rootDir);
    assertTextIncludesAll(context, source, tokens, filePath);
  });

  context.assert(packageManifest.scripts['test:type-exports-builder'] === 'node scripts/run_xtend_tests.js type-exports-builder', 'Package exposes Builder TypeExports script');
  context.assert(packageManifest.xtend.releaseGates.includes(TYPE_EXPORTS_BUILDER_PACKAGE_SCRIPT), 'Release gates include Builder TypeExports script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(TYPE_EXPORTS_BUILDER_PACKAGE_SCRIPT), 'Release checklist includes Builder TypeExports script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(TYPE_EXPORTS_BUILDER_WORKPACKAGE_DOC), 'Artifact checklist includes Builder TypeExports workpackage');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(TYPE_EXPORTS_BUILDER_REPORT_ARTIFACT), 'Artifact checklist includes Builder TypeExports report artifact');
  context.assert(metadata && metadata.schema === TYPE_EXPORTS_BUILDER_SCHEMA, 'Package metadata exposes Builder TypeExports schema');
  context.assert(metadata && metadata.workpackage === TYPE_EXPORTS_BUILDER_WORKPACKAGE, 'Package metadata exposes WP-TypeExports-06');
  context.assert(metadata && metadata.status === TYPE_EXPORTS_BUILDER_STATUS, 'Package metadata exposes Builder TypeExports status');
  context.assert(metadata && metadata.localGate === TYPE_EXPORTS_BUILDER_LOCAL_GATE, 'Package metadata exposes Builder TypeExports local gate');
  context.assert(metadata && metadata.packageScript === TYPE_EXPORTS_BUILDER_PACKAGE_SCRIPT, 'Package metadata exposes Builder TypeExports package script');
  context.assert(metadata && metadata.runtimeChanged === false, 'Package metadata keeps Builder runtime unchanged');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-TypeExports-07', 'Package metadata hands off to WP-TypeExports-07');
  context.assert(typeExportsMetadata && typeExportsMetadata.completedWorkpackages.includes(TYPE_EXPORTS_BUILDER_WORKPACKAGE), 'TypeExports metadata records WP-TypeExports-06 completion');
  context.assert(typeExportsMetadata && typeExportsMetadata.completedWorkpackages.includes('WP-TypeExports-09'), 'TypeExports metadata records WP-TypeExports-09 completion');
  context.assert(typeExportsMetadata && Array.isArray(typeExportsMetadata.nextWorkpackages) && typeExportsMetadata.nextWorkpackages.length === 0, 'TypeExports metadata has no remaining TypeExports workpackages');
  context.assert(runner.hasSuite("type-exports-builder"), 'Runner registers Builder TypeExports suite');
  context.assert(runner.hasImplementation({ function: "runTypeExportsBuilderSuite" }), 'Runner imports Builder TypeExports suite');
  context.assertIncludes(docsReadme, './xtend-builder-types.md', 'Docs README links Builder Type docs');
  context.assertIncludes(testsReadme, TYPE_EXPORTS_BUILDER_LOCAL_GATE, 'Tests README documents Builder TypeExports gate');

  assertTextIncludesAll(context, backlog, [
    '| `WP-TypeExports-06` | P1 | completed | WS4 | Builder-, Scaffold- und Component-Lab-Programm-APIs typisieren |',
    '| `WP-TypeExports-09` | P1 | completed | WS7 | TypeExports Gate, Drift-Report und Docs-Handoff produktisieren |',
    'xtend-builder/builder-public-types.d.ts',
    TYPE_EXPORTS_BUILDER_LOCAL_GATE
  ], 'TypeExports backlog');
  assertTextIncludesAll(context, workpackage, [
    TYPE_EXPORTS_BUILDER_SCHEMA,
    TYPE_EXPORTS_BUILDER_LOCAL_GATE,
    TYPE_EXPORTS_BUILDER_REPORT_ARTIFACT,
    'Status: `completed`',
    'CLI bleibt kompatibel und muss nicht nach TypeScript portiert werden'
  ], 'WP-TypeExports-06 document');
  assertTextIncludesAll(context, docs, [
    TYPE_EXPORTS_BUILDER_SCHEMA,
    TYPE_EXPORTS_BUILDER_LOCAL_GATE,
    './xtend-builder/scaffold.d.ts',
    'XtendBuilderComponentInput',
    'XtendBuilderComponentPlan',
    'XtendBuilderComponentFilesResult',
    'XtendBuilderWorkflow',
    'XtendBuilderComponentLabPlan'
  ], 'Builder Type docs');
  assertTextIncludesAll(context, typeExportsDocs, [
    'WP-TypeExports-06',
    './xtend-builder/builder-public-types.d.ts',
    './xtend-builder-types.md'
  ], 'TypeExports docs');
  assertTextIncludesAll(context, packageExportLockDocs, [
    './xtend-builder/scaffold.d.ts',
    TYPE_EXPORTS_BUILDER_LOCAL_GATE
  ], 'Package Export Lock docs');

  return context.result({
    report: {
      schema: TYPE_EXPORTS_BUILDER_REPORT_SCHEMA,
      declarationFileCount: report.declarationFileCount,
      packageExportCount: report.packageExportCount,
      sharedTypeTokens: report.sharedTypeTokens,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printTypeExportsBuilderReport(result) {
  printSuiteReport(result, {
    successTitle: 'TypeExports Builder Declaration Gate erfolgreich.',
    failureTitle: 'TypeExports Builder Declaration Gate fehlgeschlagen:'
  });
}

module.exports = {
  printTypeExportsBuilderReport,
  runTypeExportsBuilderSuite
};

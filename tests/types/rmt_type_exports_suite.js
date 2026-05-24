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
  RMT_DECLARATION_FILES,
  RMT_PACKAGE_EXPORTS,
  RMT_REPRESENTATIVE_DECLARATION_TOKENS,
  RMT_RUNTIME_CORE_TOKENS,
  RMT_RUNTIME_PACKAGE_EXPORTS,
  RMT_SHARED_DECLARATION_FILE,
  RMT_SHARED_TYPE_TOKENS,
  RMT_TOOLING_PACKAGE_EXPORTS,
  TYPE_EXPORTS_RMT_BACKLOG,
  TYPE_EXPORTS_RMT_DOCS,
  TYPE_EXPORTS_RMT_LOCAL_GATE,
  TYPE_EXPORTS_RMT_MODULE,
  TYPE_EXPORTS_RMT_PACKAGE_SCRIPT,
  TYPE_EXPORTS_RMT_REPORT_ARTIFACT,
  TYPE_EXPORTS_RMT_REPORT_SCHEMA,
  TYPE_EXPORTS_RMT_SCHEMA,
  TYPE_EXPORTS_RMT_STATUS,
  TYPE_EXPORTS_RMT_SUITE,
  TYPE_EXPORTS_RMT_TARGET,
  TYPE_EXPORTS_RMT_WORKPACKAGE,
  TYPE_EXPORTS_RMT_WORKPACKAGE_DOC,
  createTypeExportsRmtPlan,
  createTypeExportsRmtReport,
  resolveDeclarationForExport,
  validateTypeExportsRmtPlan
} = require('../../catalog/type-exports-rmt');

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

function runTypeExportsRmtSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'type-exports-rmt',
    label: 'TypeExports RMT Declaration Gate'
  });
  const packageManifest = readJson('package.json', rootDir);
  const typeExportsPlan = createTypeExportsPlan({ rootDir, packageManifest });
  const plan = createTypeExportsRmtPlan({ rootDir, packageManifest, typeExportsPlan });
  const validation = validateTypeExportsRmtPlan(plan);
  const report = createTypeExportsRmtReport({ plan });
  const metadata = packageManifest.xtend && packageManifest.xtend.typeExportsRmt;
  const typeExportsMetadata = packageManifest.xtend && packageManifest.xtend.typeExports;
  const sharedDeclarationSource = readText(RMT_SHARED_DECLARATION_FILE, rootDir);
  const rmtCoreDeclarationSource = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const backlog = readText(TYPE_EXPORTS_RMT_BACKLOG, rootDir);
  const workpackage = readText(TYPE_EXPORTS_RMT_WORKPACKAGE_DOC, rootDir);
  const docs = readText(TYPE_EXPORTS_RMT_DOCS, rootDir);
  const moduleSyntax = syntaxCheckFile(TYPE_EXPORTS_RMT_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(TYPE_EXPORTS_RMT_SUITE, { rootDir, extension: '.js' });

  [
    TYPE_EXPORTS_RMT_MODULE,
    TYPE_EXPORTS_RMT_SUITE,
    TYPE_EXPORTS_RMT_DOCS,
    TYPE_EXPORTS_RMT_WORKPACKAGE_DOC,
    ...RMT_DECLARATION_FILES
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `TypeExports RMT catalog syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `TypeExports RMT suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === TYPE_EXPORTS_RMT_SCHEMA, 'RMT TypeExports plan exposes stable schema');
  context.assert(plan.reportSchema === TYPE_EXPORTS_RMT_REPORT_SCHEMA, 'RMT TypeExports plan exposes report schema');
  context.assert(plan.workpackage === TYPE_EXPORTS_RMT_WORKPACKAGE, 'RMT TypeExports plan belongs to WP-TypeExports-04');
  context.assert(plan.status === TYPE_EXPORTS_RMT_STATUS, 'RMT TypeExports plan is accepted');
  context.assert(plan.targetReadiness === TYPE_EXPORTS_RMT_TARGET, 'RMT TypeExports target is ready');
  context.assert(plan.localGate === TYPE_EXPORTS_RMT_LOCAL_GATE, 'RMT TypeExports exposes local gate');
  context.assert(plan.packageScript === TYPE_EXPORTS_RMT_PACKAGE_SCRIPT, 'RMT TypeExports exposes package script');
  context.assert(plan.reportArtifact === TYPE_EXPORTS_RMT_REPORT_ARTIFACT, 'RMT TypeExports exposes report artifact');
  context.assert(validation.schema === TYPE_EXPORTS_RMT_REPORT_SCHEMA, 'RMT TypeExports validator emits report schema');
  context.assert(validation.ok === true, 'RMT TypeExports plan validates');
  context.assert(report.ok === true, 'RMT TypeExports report validates');
  context.assert(plan.packageExports.length === RMT_PACKAGE_EXPORTS.length, 'RMT TypeExports tracks package exports');
  context.assert(plan.runtimePackageExports.length === RMT_RUNTIME_PACKAGE_EXPORTS.length, 'RMT TypeExports tracks runtime exports');
  context.assert(plan.toolingPackageExports.length === RMT_TOOLING_PACKAGE_EXPORTS.length, 'RMT TypeExports tracks tooling exports');
  context.assert(plan.declarationFiles.length === RMT_DECLARATION_FILES.length, 'RMT TypeExports tracks declaration files');
  context.assert(plan.missingTypesConditions.length === 0, 'RMT package exports expose types conditions');
  context.assert(plan.mismatchedTypesConditions.length === 0, 'RMT package exports use expected declaration targets');
  context.assert(plan.missingRuntimeTargets.length === 0, 'RMT package exports keep expected runtime targets');
  context.assert(plan.missingDeclarationFiles.length === 0, 'RMT declaration files exist');
  context.assert(plan.missingSharedTypeTokens.length === 0, 'RMT shared tooling types expose stable tokens');
  context.assert(plan.missingRuntimeCoreTokens.length === 0, 'RMT runtime core declaration exposes runtime tokens');
  context.assert(plan.missingRepresentativeDeclarationTokens.length === 0, 'RMT representative declarations expose service tokens');
  context.assert(plan.missingRuntimeExportTokens.length === 0, 'RMT declaration facades expose runtime export symbols');
  context.assert(plan.forbiddenDeclarationRuntimeImports.length === 0, 'RMT declarations do not import XTend UI runtime surfaces');
  context.assert(plan.runtimeImportsDeclarationFiles.length === 0, 'RMT runtime does not import declaration files');
  context.assert(plan.typeExportsMissingDeclarations.length === 0, 'TypeExports sees RMT declarations');
  context.assert(plan.runtimeChanged === false, 'RMT TypeExports changes no runtime code');
  context.assert(plan.nextWorkpackage === 'WP-TypeExports-05', 'RMT TypeExports hands off to WP-TypeExports-05');

  RMT_PACKAGE_EXPORTS.forEach((exportKey) => {
    const expectedTypes = resolveDeclarationForExport(exportKey);
    context.assert(getTypesCondition(packageManifest, exportKey) === expectedTypes, `${exportKey} package export exposes ${expectedTypes}`);
    const classification = typeExportsPlan.classifications.find((entry) => entry.exportKey === exportKey);
    context.assert(classification && classification.declarationExists === true, `TypeExports sees ${exportKey} declaration`);
    context.assert(classification && classification.typeDecision === 'declaration-ready', `TypeExports marks ${exportKey} declaration ready`);
  });
  context.assert(packageManifest.files.includes('xtendrmt'), 'Package files include xtendrmt root');
  context.assert(packageManifest.files.includes('tools'), 'Package files include tools root');

  RMT_SHARED_TYPE_TOKENS.forEach((token) => {
    context.assertIncludes(sharedDeclarationSource, token, `RMT shared declaration includes ${token}`);
  });
  RMT_RUNTIME_CORE_TOKENS.forEach((token) => {
    context.assertIncludes(rmtCoreDeclarationSource, token, `RMT core declaration includes ${token}`);
  });
  Object.entries(RMT_REPRESENTATIVE_DECLARATION_TOKENS).forEach(([filePath, tokens]) => {
    const source = readText(filePath, rootDir);
    assertTextIncludesAll(context, source, tokens, filePath);
  });

  context.assert(packageManifest.scripts['test:type-exports-rmt'] === 'node scripts/run_xtend_tests.js type-exports-rmt', 'Package exposes RMT TypeExports script');
  context.assert((packageManifest.scripts['test:rmt-vnext-primitives:report'] || '').includes('type-exports-rmt'), 'RMT primitive aggregate includes RMT TypeExports suite');
  context.assert(packageManifest.xtend.ciGateMatrix.rmtVNextPrimitiveGate.suites.includes('type-exports-rmt'), 'CI RMT primitive gate tracks RMT TypeExports suite');
  context.assert(typeExportsMetadata.releaseGateBundle.includes(TYPE_EXPORTS_RMT_PACKAGE_SCRIPT), 'TypeExports release bundle includes RMT TypeExports script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(TYPE_EXPORTS_RMT_WORKPACKAGE_DOC), 'Artifact checklist includes RMT TypeExports workpackage');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(TYPE_EXPORTS_RMT_REPORT_ARTIFACT), 'Artifact checklist includes RMT TypeExports report artifact');
  context.assert(metadata && metadata.schema === TYPE_EXPORTS_RMT_SCHEMA, 'Package metadata exposes RMT TypeExports schema');
  context.assert(metadata && metadata.workpackage === TYPE_EXPORTS_RMT_WORKPACKAGE, 'Package metadata exposes WP-TypeExports-04');
  context.assert(metadata && metadata.status === TYPE_EXPORTS_RMT_STATUS, 'Package metadata exposes RMT TypeExports status');
  context.assert(metadata && metadata.localGate === TYPE_EXPORTS_RMT_LOCAL_GATE, 'Package metadata exposes RMT TypeExports local gate');
  context.assert(metadata && metadata.packageScript === TYPE_EXPORTS_RMT_PACKAGE_SCRIPT, 'Package metadata exposes RMT TypeExports package script');
  context.assert(metadata && metadata.runtimeChanged === false, 'Package metadata keeps RMT runtime unchanged');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-TypeExports-05', 'Package metadata hands off to WP-TypeExports-05');
  context.assert(typeExportsMetadata && typeExportsMetadata.completedWorkpackages.includes(TYPE_EXPORTS_RMT_WORKPACKAGE), 'TypeExports metadata records WP-TypeExports-04 completion');
  context.assert(typeExportsMetadata && typeExportsMetadata.completedWorkpackages.includes('WP-TypeExports-09'), 'TypeExports metadata records WP-TypeExports-09 completion');
  context.assert(typeExportsMetadata && Array.isArray(typeExportsMetadata.nextWorkpackages) && typeExportsMetadata.nextWorkpackages.length === 0, 'TypeExports metadata has no remaining TypeExports workpackages');
  context.assertIncludes(runner, "id: 'type-exports-rmt'", 'Runner registers RMT TypeExports suite');
  context.assertIncludes(runner, 'runTypeExportsRmtSuite', 'Runner imports RMT TypeExports suite');
  context.assertIncludes(testsReadme, TYPE_EXPORTS_RMT_LOCAL_GATE, 'Tests README documents RMT TypeExports gate');

  assertTextIncludesAll(context, backlog, [
    '| `WP-TypeExports-04` | P1 | completed | WS2 | XTendRMT Runtime-, Browser- und RMT-Language-Exports typisieren |',
    '| `WP-TypeExports-05` | P1 | completed | WS3 | Fabric-, A11y- und Security-Policy-APIs typisieren |',
    '| `WP-TypeExports-09` | P1 | completed | WS7 | TypeExports Gate, Drift-Report und Docs-Handoff produktisieren |',
    'tools/rmt-language/rmt-tooling-public-types.d.ts',
    TYPE_EXPORTS_RMT_LOCAL_GATE
  ], 'TypeExports backlog');
  assertTextIncludesAll(context, workpackage, [
    TYPE_EXPORTS_RMT_SCHEMA,
    TYPE_EXPORTS_RMT_LOCAL_GATE,
    TYPE_EXPORTS_RMT_REPORT_ARTIFACT,
    'Status: `completed`',
    'RMT-Kernel importiert keine XTend-UI-Typen'
  ], 'WP-TypeExports-04 document');
  assertTextIncludesAll(context, docs, [
    '@ccslabs/xtend/rmt',
    '@ccslabs/xtend/rmt/browser',
    '@ccslabs/xtend/rmt-language/vnext-compiler',
    './xtendrmt/rmt-core.d.ts',
    './tools/rmt-language/rmt-tooling-public-types.d.ts',
    'RmtToolingDiagnostic',
    'RmtTextEdit',
    'RmtWorkspaceEdit',
    'RmtLanguageServiceReport',
    'RmtJsonRpcMessage'
  ], 'RMT Type docs');

  return context.result({
    report: {
      schema: TYPE_EXPORTS_RMT_REPORT_SCHEMA,
      declarationFileCount: report.declarationFileCount,
      packageExportCount: report.packageExportCount,
      runtimePackageExports: report.runtimePackageExports,
      toolingPackageExportCount: report.toolingPackageExportCount,
      sharedTypeTokens: report.sharedTypeTokens,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printTypeExportsRmtReport(result) {
  printSuiteReport(result, {
    successTitle: 'TypeExports RMT Declaration Gate erfolgreich.',
    failureTitle: 'TypeExports RMT Declaration Gate fehlgeschlagen:'
  });
}

module.exports = {
  printTypeExportsRmtReport,
  runTypeExportsRmtSuite
};

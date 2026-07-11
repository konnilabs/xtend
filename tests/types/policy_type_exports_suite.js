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
  POLICY_DECLARATION_FILES,
  POLICY_PACKAGE_EXPORTS,
  POLICY_REPRESENTATIVE_DECLARATION_TOKENS,
  POLICY_SHARED_DECLARATION_FILE,
  POLICY_SHARED_TYPE_TOKENS,
  TYPE_EXPORTS_POLICY_BACKLOG,
  TYPE_EXPORTS_POLICY_DOCS,
  TYPE_EXPORTS_POLICY_LOCAL_GATE,
  TYPE_EXPORTS_POLICY_MODULE,
  TYPE_EXPORTS_POLICY_PACKAGE_SCRIPT,
  TYPE_EXPORTS_POLICY_REPORT_ARTIFACT,
  TYPE_EXPORTS_POLICY_REPORT_SCHEMA,
  TYPE_EXPORTS_POLICY_SCHEMA,
  TYPE_EXPORTS_POLICY_STATUS,
  TYPE_EXPORTS_POLICY_SUITE,
  TYPE_EXPORTS_POLICY_TARGET,
  TYPE_EXPORTS_POLICY_WORKPACKAGE,
  TYPE_EXPORTS_POLICY_WORKPACKAGE_DOC,
  createTypeExportsPolicyPlan,
  createTypeExportsPolicyReport,
  resolveDeclarationForExport,
  validateTypeExportsPolicyPlan
} = require('../../catalog/type-exports-policy');

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

function runTypeExportsPolicySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'type-exports-policy',
    label: 'TypeExports Policy Declaration Gate'
  });
  const packageManifest = readJson('package.json', rootDir);
  const typeExportsPlan = createTypeExportsPlan({ rootDir, packageManifest });
  const plan = createTypeExportsPolicyPlan({ rootDir, packageManifest, typeExportsPlan });
  const validation = validateTypeExportsPolicyPlan(plan);
  const report = createTypeExportsPolicyReport({ plan });
  const metadata = packageManifest.xtend && packageManifest.xtend.typeExportsPolicy;
  const typeExportsMetadata = packageManifest.xtend && packageManifest.xtend.typeExports;
  const sharedDeclarationSource = readText(POLICY_SHARED_DECLARATION_FILE, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const backlog = readText(TYPE_EXPORTS_POLICY_BACKLOG, rootDir);
  const workpackage = readText(TYPE_EXPORTS_POLICY_WORKPACKAGE_DOC, rootDir);
  const docs = readText(TYPE_EXPORTS_POLICY_DOCS, rootDir);
  const typeExportsDocs = readText('docs/type-exports.md', rootDir);
  const packageExportLockDocs = readText('docs/package-export-lock.md', rootDir);
  const moduleSyntax = syntaxCheckFile(TYPE_EXPORTS_POLICY_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(TYPE_EXPORTS_POLICY_SUITE, { rootDir, extension: '.js' });

  [
    TYPE_EXPORTS_POLICY_MODULE,
    TYPE_EXPORTS_POLICY_SUITE,
    TYPE_EXPORTS_POLICY_DOCS,
    TYPE_EXPORTS_POLICY_WORKPACKAGE_DOC,
    ...POLICY_DECLARATION_FILES
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `TypeExports Policy catalog syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `TypeExports Policy suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === TYPE_EXPORTS_POLICY_SCHEMA, 'Policy TypeExports plan exposes stable schema');
  context.assert(plan.reportSchema === TYPE_EXPORTS_POLICY_REPORT_SCHEMA, 'Policy TypeExports plan exposes report schema');
  context.assert(plan.workpackage === TYPE_EXPORTS_POLICY_WORKPACKAGE, 'Policy TypeExports plan belongs to WP-TypeExports-05');
  context.assert(plan.status === TYPE_EXPORTS_POLICY_STATUS, 'Policy TypeExports plan is accepted');
  context.assert(plan.targetReadiness === TYPE_EXPORTS_POLICY_TARGET, 'Policy TypeExports target is ready');
  context.assert(plan.localGate === TYPE_EXPORTS_POLICY_LOCAL_GATE, 'Policy TypeExports exposes local gate');
  context.assert(plan.packageScript === TYPE_EXPORTS_POLICY_PACKAGE_SCRIPT, 'Policy TypeExports exposes package script');
  context.assert(plan.reportArtifact === TYPE_EXPORTS_POLICY_REPORT_ARTIFACT, 'Policy TypeExports exposes report artifact');
  context.assert(validation.schema === TYPE_EXPORTS_POLICY_REPORT_SCHEMA, 'Policy TypeExports validator emits report schema');
  context.assert(validation.ok === true, 'Policy TypeExports plan validates');
  context.assert(report.ok === true, 'Policy TypeExports report validates');
  context.assert(plan.packageExports.length === POLICY_PACKAGE_EXPORTS.length, 'Policy TypeExports tracks package exports');
  context.assert(plan.declarationFiles.length === POLICY_DECLARATION_FILES.length, 'Policy TypeExports tracks declaration files');
  context.assert(plan.missingTypesConditions.length === 0, 'Policy package exports expose types conditions');
  context.assert(plan.mismatchedTypesConditions.length === 0, 'Policy package exports use expected declaration targets');
  context.assert(plan.missingRuntimeTargets.length === 0, 'Policy package exports keep expected runtime targets');
  context.assert(plan.missingDeclarationFiles.length === 0, 'Policy declaration files exist');
  context.assert(plan.missingSharedTypeTokens.length === 0, 'Policy shared types expose stable tokens');
  context.assert(plan.missingRepresentativeDeclarationTokens.length === 0, 'Policy representative declarations expose service tokens');
  context.assert(plan.missingRuntimeExportTokens.length === 0, 'Policy declaration facades expose runtime export symbols');
  context.assert(plan.forbiddenDeclarationRuntimeImports.length === 0, 'Policy declarations do not import forbidden runtime surfaces');
  context.assert(plan.runtimeImportsDeclarationFiles.length === 0, 'Policy runtime does not import declaration files');
  context.assert(plan.typeExportsMissingDeclarations.length === 0, 'TypeExports sees Policy declarations');
  context.assert(plan.runtimeChanged === false, 'Policy TypeExports changes no runtime code');
  context.assert(plan.nextWorkpackage === 'WP-TypeExports-06', 'Policy TypeExports hands off to WP-TypeExports-06');

  POLICY_PACKAGE_EXPORTS.forEach((exportKey) => {
    const expectedTypes = resolveDeclarationForExport(exportKey);
    context.assert(getTypesCondition(packageManifest, exportKey) === expectedTypes, `${exportKey} package export exposes ${expectedTypes}`);
    const classification = typeExportsPlan.classifications.find((entry) => entry.exportKey === exportKey);
    context.assert(classification && classification.declarationExists === true, `TypeExports sees ${exportKey} declaration`);
    context.assert(classification && classification.typeDecision === 'declaration-ready', `TypeExports marks ${exportKey} declaration ready`);
  });
  context.assert(packageManifest.files.includes('fabric'), 'Package files include fabric root');
  context.assert(packageManifest.files.includes('a11y'), 'Package files include a11y root');
  context.assert(packageManifest.files.includes('security'), 'Package files include security root');

  POLICY_SHARED_TYPE_TOKENS.forEach((token) => {
    context.assertIncludes(sharedDeclarationSource, token, `Policy shared declaration includes ${token}`);
  });
  Object.entries(POLICY_REPRESENTATIVE_DECLARATION_TOKENS).forEach(([filePath, tokens]) => {
    const source = readText(filePath, rootDir);
    assertTextIncludesAll(context, source, tokens, filePath);
  });

  context.assert(packageManifest.scripts['test:type-exports-policy'] === 'node scripts/run_xtend_tests.js type-exports-policy', 'Package exposes Policy TypeExports script');
  context.assert(packageManifest.xtend.releaseGates.includes(TYPE_EXPORTS_POLICY_PACKAGE_SCRIPT), 'Release gates include Policy TypeExports script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(TYPE_EXPORTS_POLICY_PACKAGE_SCRIPT), 'Release checklist includes Policy TypeExports script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(TYPE_EXPORTS_POLICY_WORKPACKAGE_DOC), 'Artifact checklist includes Policy TypeExports workpackage');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(TYPE_EXPORTS_POLICY_REPORT_ARTIFACT), 'Artifact checklist includes Policy TypeExports report artifact');
  context.assert(metadata && metadata.schema === TYPE_EXPORTS_POLICY_SCHEMA, 'Package metadata exposes Policy TypeExports schema');
  context.assert(metadata && metadata.workpackage === TYPE_EXPORTS_POLICY_WORKPACKAGE, 'Package metadata exposes WP-TypeExports-05');
  context.assert(metadata && metadata.status === TYPE_EXPORTS_POLICY_STATUS, 'Package metadata exposes Policy TypeExports status');
  context.assert(metadata && metadata.localGate === TYPE_EXPORTS_POLICY_LOCAL_GATE, 'Package metadata exposes Policy TypeExports local gate');
  context.assert(metadata && metadata.packageScript === TYPE_EXPORTS_POLICY_PACKAGE_SCRIPT, 'Package metadata exposes Policy TypeExports package script');
  context.assert(metadata && metadata.runtimeChanged === false, 'Package metadata keeps Policy runtime unchanged');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-TypeExports-06', 'Package metadata hands off to WP-TypeExports-06');
  context.assert(typeExportsMetadata && typeExportsMetadata.completedWorkpackages.includes(TYPE_EXPORTS_POLICY_WORKPACKAGE), 'TypeExports metadata records WP-TypeExports-05 completion');
  context.assert(typeExportsMetadata && typeExportsMetadata.completedWorkpackages.includes('WP-TypeExports-09'), 'TypeExports metadata records WP-TypeExports-09 completion');
  context.assert(typeExportsMetadata && Array.isArray(typeExportsMetadata.nextWorkpackages) && typeExportsMetadata.nextWorkpackages.length === 0, 'TypeExports metadata has no remaining TypeExports workpackages');
  context.assertIncludes(runner, "id: 'type-exports-policy'", 'Runner registers Policy TypeExports suite');
  context.assertIncludes(runner, 'runTypeExportsPolicySuite', 'Runner imports Policy TypeExports suite');
  context.assertIncludes(docsReadme, './xtend-policy-types.md', 'Docs README links Policy Type docs');
  context.assertIncludes(testsReadme, TYPE_EXPORTS_POLICY_LOCAL_GATE, 'Tests README documents Policy TypeExports gate');

  assertTextIncludesAll(context, backlog, [
    '| `WP-TypeExports-05` | P1 | completed | WS3 | Fabric-, A11y- und Security-Policy-APIs typisieren |',
    '| `WP-TypeExports-09` | P1 | completed | WS7 | TypeExports Gate, Drift-Report und Docs-Handoff produktisieren |',
    'fabric/xtend-policy-public-types.d.ts',
    TYPE_EXPORTS_POLICY_LOCAL_GATE
  ], 'TypeExports backlog');
  assertTextIncludesAll(context, workpackage, [
    TYPE_EXPORTS_POLICY_SCHEMA,
    TYPE_EXPORTS_POLICY_LOCAL_GATE,
    TYPE_EXPORTS_POLICY_REPORT_ARTIFACT,
    'Status: `completed`',
    'keine Policy fuehrt Runtime-Abhaengigkeiten in Komponenten oder RMT-Kernel ein'
  ], 'WP-TypeExports-05 document');
  assertTextIncludesAll(context, docs, [
    TYPE_EXPORTS_POLICY_SCHEMA,
    TYPE_EXPORTS_POLICY_LOCAL_GATE,
    './fabric/xtend-fabric.d.ts',
    'XtendPolicyDiagnostic',
    'XtendPolicyReport',
    'XtendFabricFiberInput',
    'XtendA11ySignal',
    'XtendSecurityClassification'
  ], 'Policy Type docs');
  assertTextIncludesAll(context, typeExportsDocs, [
    'WP-TypeExports-05',
    './fabric/xtend-policy-public-types.d.ts',
    './xtend-policy-types.md'
  ], 'TypeExports docs');
  assertTextIncludesAll(context, packageExportLockDocs, [
    './fabric/xtend-fabric.d.ts',
    TYPE_EXPORTS_POLICY_LOCAL_GATE
  ], 'Package Export Lock docs');

  return context.result({
    report: {
      schema: TYPE_EXPORTS_POLICY_REPORT_SCHEMA,
      declarationFileCount: report.declarationFileCount,
      packageExportCount: report.packageExportCount,
      sharedTypeTokens: report.sharedTypeTokens,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printTypeExportsPolicyReport(result) {
  printSuiteReport(result, {
    successTitle: 'TypeExports Policy Declaration Gate erfolgreich.',
    failureTitle: 'TypeExports Policy Declaration Gate fehlgeschlagen:'
  });
}

module.exports = {
  printTypeExportsPolicyReport,
  runTypeExportsPolicySuite
};

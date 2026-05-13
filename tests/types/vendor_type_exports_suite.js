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
  TYPE_EXPORTS_VENDOR_BACKLOG,
  TYPE_EXPORTS_VENDOR_DOCS,
  TYPE_EXPORTS_VENDOR_LOCAL_GATE,
  TYPE_EXPORTS_VENDOR_MODULE,
  TYPE_EXPORTS_VENDOR_PACKAGE_SCRIPT,
  TYPE_EXPORTS_VENDOR_REPORT_ARTIFACT,
  TYPE_EXPORTS_VENDOR_REPORT_SCHEMA,
  TYPE_EXPORTS_VENDOR_SCHEMA,
  TYPE_EXPORTS_VENDOR_STATUS,
  TYPE_EXPORTS_VENDOR_SUITE,
  TYPE_EXPORTS_VENDOR_TARGET,
  TYPE_EXPORTS_VENDOR_WORKPACKAGE,
  TYPE_EXPORTS_VENDOR_WORKPACKAGE_DOC,
  VENDOR_DECLARATION_FILES,
  VENDOR_JSON_BOUNDARIES,
  VENDOR_PACKAGE_EXPORTS,
  VENDOR_REPRESENTATIVE_DECLARATION_TOKENS,
  VENDOR_WILDCARD_EXPORTS,
  createTypeExportsVendorPlan,
  createTypeExportsVendorReport,
  resolveDeclarationForExport,
  validateTypeExportsVendorPlan
} = require('../../catalog/type-exports-vendor');

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

function getRuntimeTarget(packageManifest, exportKey) {
  const entry = packageManifest.exports && packageManifest.exports[exportKey];
  if (typeof entry === 'string') return entry;
  return entry && typeof entry === 'object' ? entry.default || entry.browser || entry.import : null;
}

function runTypeExportsVendorSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'type-exports-vendor',
    label: 'TypeExports Vendor and Utility Facade Gate'
  });
  const packageManifest = readJson('package.json', rootDir);
  const typeExportsPlan = createTypeExportsPlan({ rootDir, packageManifest });
  const plan = createTypeExportsVendorPlan({ rootDir, packageManifest, typeExportsPlan });
  const validation = validateTypeExportsVendorPlan(plan);
  const report = createTypeExportsVendorReport({ plan });
  const metadata = packageManifest.xtend && packageManifest.xtend.typeExportsVendor;
  const typeExportsMetadata = packageManifest.xtend && packageManifest.xtend.typeExports;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const backlog = readText(TYPE_EXPORTS_VENDOR_BACKLOG, rootDir);
  const workpackage = readText(TYPE_EXPORTS_VENDOR_WORKPACKAGE_DOC, rootDir);
  const docs = readText(TYPE_EXPORTS_VENDOR_DOCS, rootDir);
  const typeExportsDocs = readText('docs/type-exports.md', rootDir);
  const packageExportLockDocs = readText('docs/package-export-lock.md', rootDir);
  const designTokenDocs = readText('docs/design-tokens.md', rootDir);
  const moduleSyntax = syntaxCheckFile(TYPE_EXPORTS_VENDOR_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(TYPE_EXPORTS_VENDOR_SUITE, { rootDir, extension: '.js' });

  [
    TYPE_EXPORTS_VENDOR_MODULE,
    TYPE_EXPORTS_VENDOR_SUITE,
    TYPE_EXPORTS_VENDOR_DOCS,
    TYPE_EXPORTS_VENDOR_WORKPACKAGE_DOC,
    ...VENDOR_DECLARATION_FILES
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `TypeExports Vendor catalog syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `TypeExports Vendor suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === TYPE_EXPORTS_VENDOR_SCHEMA, 'Vendor TypeExports plan exposes stable schema');
  context.assert(plan.reportSchema === TYPE_EXPORTS_VENDOR_REPORT_SCHEMA, 'Vendor TypeExports plan exposes report schema');
  context.assert(plan.workpackage === TYPE_EXPORTS_VENDOR_WORKPACKAGE, 'Vendor TypeExports plan belongs to WP-TypeExports-08');
  context.assert(plan.status === TYPE_EXPORTS_VENDOR_STATUS, 'Vendor TypeExports plan is accepted');
  context.assert(plan.targetReadiness === TYPE_EXPORTS_VENDOR_TARGET, 'Vendor TypeExports target is ready');
  context.assert(plan.localGate === TYPE_EXPORTS_VENDOR_LOCAL_GATE, 'Vendor TypeExports exposes local gate');
  context.assert(plan.packageScript === TYPE_EXPORTS_VENDOR_PACKAGE_SCRIPT, 'Vendor TypeExports exposes package script');
  context.assert(plan.reportArtifact === TYPE_EXPORTS_VENDOR_REPORT_ARTIFACT, 'Vendor TypeExports exposes report artifact');
  context.assert(validation.schema === TYPE_EXPORTS_VENDOR_REPORT_SCHEMA, 'Vendor TypeExports validator emits report schema');
  context.assert(validation.ok === true, 'Vendor TypeExports plan validates');
  context.assert(report.ok === true, 'Vendor TypeExports report validates');
  context.assert(plan.declarationFiles.length === VENDOR_DECLARATION_FILES.length, 'Vendor TypeExports tracks declaration files');
  context.assert(plan.packageExports.length === VENDOR_PACKAGE_EXPORTS.length, 'Vendor TypeExports tracks package exports');
  context.assert(plan.missingTypesConditions.length === 0, 'Vendor package exports expose types conditions');
  context.assert(plan.mismatchedTypesConditions.length === 0, 'Vendor package exports use expected declaration targets');
  context.assert(plan.missingRuntimeTargets.length === 0, 'Vendor package exports keep expected runtime targets');
  context.assert(plan.missingDeclarationFiles.length === 0, 'Vendor declaration files exist');
  context.assert(plan.missingRepresentativeDeclarationTokens.length === 0, 'Vendor declarations expose facade tokens');
  context.assert(plan.missingRuntimeExportTokens.length === 0, 'Design Token declaration exposes runtime export symbols');
  context.assert(plan.componentDeclarationGaps.length === 0, 'Components directory has no JS declaration gaps');
  context.assert(plan.forbiddenDeclarationRuntimeImports.length === 0, 'Vendor declarations do not import runtime surfaces');
  context.assert(plan.runtimeImportsDeclarationFiles.length === 0, 'Vendor runtime does not import declaration files');
  context.assert(plan.forbiddenVendorInternalTokens.length === 0, 'Vendor facades do not copy implementation internals');
  context.assert(plan.largeVendorDeclarations.length === 0, 'Vendor facades remain intentionally narrow');
  context.assert(plan.typeExportsMissingDeclarations.length === 0, 'TypeExports sees Vendor declarations');
  context.assert(plan.jsonBoundaries.every((entry) => entry.typesRequired === false), 'Theme JSON exports remain types-not-required boundaries');
  context.assert(plan.runtimeChanged === false, 'Vendor TypeExports changes no runtime code');
  context.assert(plan.nextWorkpackage === 'WP-TypeExports-09', 'Vendor TypeExports hands off to WP-TypeExports-09');

  VENDOR_PACKAGE_EXPORTS.forEach((exportKey) => {
    const expectedTypes = resolveDeclarationForExport(exportKey);
    context.assert(getTypesCondition(packageManifest, exportKey) === expectedTypes, `${exportKey} package export exposes ${expectedTypes}`);
    context.assert(getRuntimeTarget(packageManifest, exportKey) === './design-tokens/xtend-design-tokens.js', `${exportKey} keeps runtime target`);
    const classification = typeExportsPlan.classifications.find((entry) => entry.exportKey === exportKey);
    context.assert(classification && classification.proposedTypesCondition === expectedTypes, `TypeExports proposes ${expectedTypes} for ${exportKey}`);
    context.assert(classification && classification.declarationExists === true, `TypeExports sees ${exportKey} declaration`);
    context.assert(classification && classification.typeDecision === 'declaration-ready', `TypeExports marks ${exportKey} declaration ready`);
  });
  VENDOR_WILDCARD_EXPORTS.forEach((exportKey) => {
    context.assert(packageManifest.exports[exportKey] === './components/*', `${exportKey} stays a component wildcard export`);
  });
  VENDOR_JSON_BOUNDARIES.forEach((exportKey) => {
    context.assert(packageManifest.exports[exportKey] === './design-tokens/themes/enterprise-light.json', `${exportKey} stays a JSON boundary export`);
  });

  Object.entries(VENDOR_REPRESENTATIVE_DECLARATION_TOKENS).forEach(([filePath, tokens]) => {
    const source = readText(filePath, rootDir);
    assertTextIncludesAll(context, source, tokens, filePath);
  });

  context.assert(packageManifest.scripts['test:type-exports-vendor'] === 'node scripts/run_xtend_tests.js type-exports-vendor', 'Package exposes Vendor TypeExports script');
  context.assert(packageManifest.xtend.releaseGates.includes(TYPE_EXPORTS_VENDOR_PACKAGE_SCRIPT), 'Release gates include Vendor TypeExports script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(TYPE_EXPORTS_VENDOR_PACKAGE_SCRIPT), 'Release checklist includes Vendor TypeExports script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(TYPE_EXPORTS_VENDOR_WORKPACKAGE_DOC), 'Artifact checklist includes Vendor TypeExports workpackage');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(TYPE_EXPORTS_VENDOR_REPORT_ARTIFACT), 'Artifact checklist includes Vendor TypeExports report artifact');
  context.assert(metadata && metadata.schema === TYPE_EXPORTS_VENDOR_SCHEMA, 'Package metadata exposes Vendor TypeExports schema');
  context.assert(metadata && metadata.workpackage === TYPE_EXPORTS_VENDOR_WORKPACKAGE, 'Package metadata exposes WP-TypeExports-08');
  context.assert(metadata && metadata.status === TYPE_EXPORTS_VENDOR_STATUS, 'Package metadata exposes Vendor TypeExports status');
  context.assert(metadata && metadata.localGate === TYPE_EXPORTS_VENDOR_LOCAL_GATE, 'Package metadata exposes Vendor TypeExports local gate');
  context.assert(metadata && metadata.packageScript === TYPE_EXPORTS_VENDOR_PACKAGE_SCRIPT, 'Package metadata exposes Vendor TypeExports package script');
  context.assert(metadata && metadata.runtimeChanged === false, 'Package metadata keeps Vendor runtime unchanged');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-TypeExports-09', 'Package metadata hands off to WP-TypeExports-09');
  context.assert(typeExportsMetadata && typeExportsMetadata.completedWorkpackages.includes(TYPE_EXPORTS_VENDOR_WORKPACKAGE), 'TypeExports metadata records WP-TypeExports-08 completion');
  context.assert(typeExportsMetadata && typeExportsMetadata.completedWorkpackages.includes('WP-TypeExports-09'), 'TypeExports metadata records WP-TypeExports-09 completion');
  context.assert(typeExportsMetadata && Array.isArray(typeExportsMetadata.nextWorkpackages) && typeExportsMetadata.nextWorkpackages.length === 0, 'TypeExports metadata has no remaining TypeExports workpackages');
  context.assertIncludes(runner, "id: 'type-exports-vendor'", 'Runner registers Vendor TypeExports suite');
  context.assertIncludes(runner, 'runTypeExportsVendorSuite', 'Runner imports Vendor TypeExports suite');
  context.assertIncludes(docsReadme, './xtend-vendor-types.md', 'Docs README links Vendor Type docs');
  context.assertIncludes(testsReadme, TYPE_EXPORTS_VENDOR_LOCAL_GATE, 'Tests README documents Vendor TypeExports gate');

  assertTextIncludesAll(context, backlog, [
    '| `WP-TypeExports-08` | P2 | completed | WS6 | Vendor-/Utility-Facades fuer Prism, Turndown und Design Tokens ergaenzen |',
    '| `WP-TypeExports-09` | P1 | completed | WS7 | TypeExports Gate, Drift-Report und Docs-Handoff produktisieren |',
    'components/prism.d.ts',
    'components/turndown.d.ts',
    'design-tokens/xtend-design-tokens.d.ts',
    TYPE_EXPORTS_VENDOR_LOCAL_GATE
  ], 'TypeExports backlog');
  assertTextIncludesAll(context, workpackage, [
    TYPE_EXPORTS_VENDOR_SCHEMA,
    TYPE_EXPORTS_VENDOR_LOCAL_GATE,
    TYPE_EXPORTS_VENDOR_REPORT_ARTIFACT,
    'Status: `completed`',
    'Vendor-Facades bleiben schmal'
  ], 'WP-TypeExports-08 document');
  assertTextIncludesAll(context, docs, [
    TYPE_EXPORTS_VENDOR_SCHEMA,
    TYPE_EXPORTS_VENDOR_LOCAL_GATE,
    './components/prism.d.ts',
    './components/turndown.d.ts',
    './design-tokens/xtend-design-tokens.d.ts',
    'Theme JSON'
  ], 'Vendor Type docs');
  assertTextIncludesAll(context, typeExportsDocs, [
    'WP-TypeExports-08',
    './design-tokens/xtend-design-tokens.d.ts',
    './components/prism.d.ts',
    './xtend-vendor-types.md'
  ], 'TypeExports docs');
  assertTextIncludesAll(context, packageExportLockDocs, [
    './design-tokens/xtend-design-tokens.d.ts',
    TYPE_EXPORTS_VENDOR_LOCAL_GATE
  ], 'Package Export Lock docs');
  assertTextIncludesAll(context, designTokenDocs, [
    'xtend.design-tokens.product-contract.v1',
    'design-tokens/themes/enterprise-light.json'
  ], 'Design Token docs');

  return context.result({
    report: {
      schema: TYPE_EXPORTS_VENDOR_REPORT_SCHEMA,
      declarationFileCount: report.declarationFileCount,
      packageExportCount: report.packageExportCount,
      componentDeclarationGapCount: report.componentDeclarationGapCount,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printTypeExportsVendorReport(result) {
  printSuiteReport(result, {
    successTitle: 'TypeExports Vendor and Utility Facade Gate erfolgreich.',
    failureTitle: 'TypeExports Vendor and Utility Facade Gate fehlgeschlagen:'
  });
}

module.exports = {
  printTypeExportsVendorReport,
  runTypeExportsVendorSuite
};

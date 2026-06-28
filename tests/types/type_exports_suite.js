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
  EXPECTED_EXPORT_KEYS
} = require('../../catalog/epic13-package-export-lock');
const {
  TYPE_EXPORTS_BACKLOG,
  TYPE_EXPORTS_BOUNDARY,
  TYPE_EXPORTS_DECLARATION_BOUNDARY,
  TYPE_EXPORTS_DRIFT_REPORT_SCHEMA,
  TYPE_EXPORTS_DOCS,
  TYPE_EXPORTS_KERNEL_BOUNDARY,
  TYPE_EXPORTS_LOCAL_GATE,
  TYPE_EXPORTS_LOCKED_EXPORT_COUNT,
  TYPE_EXPORTS_LOCKED_EXPORT_FINGERPRINT,
  TYPE_EXPORTS_MODULE,
  TYPE_EXPORTS_PACKAGE_SCRIPT,
  TYPE_EXPORTS_REPORT_ARTIFACT,
  TYPE_EXPORTS_REPORT_SCHEMA,
  TYPE_EXPORTS_RELEASE_GATE_SCRIPTS,
  TYPE_EXPORTS_RELEASE_LOCAL_GATE,
  TYPE_EXPORTS_RELEASE_PACKAGE_SCRIPT,
  TYPE_EXPORTS_RELEASE_REPORT_ARTIFACTS,
  TYPE_EXPORTS_RELEASE_STATUS,
  TYPE_EXPORTS_RELEASE_TARGET,
  TYPE_EXPORTS_RELEASE_WORKPACKAGE,
  TYPE_EXPORTS_SCHEMA,
  TYPE_EXPORTS_STATUS,
  TYPE_EXPORTS_SUITE,
  TYPE_EXPORTS_TARGET,
  TYPE_EXPORTS_WORKPACKAGE,
  TYPE_EXPORTS_WORKPACKAGE_DOC,
  createExportFingerprint,
  createTypeExportsPlan,
  createTypeExportsReport,
  validateTypeExportsPlan
} = require('../../catalog/type-exports');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function findClassification(plan, exportKey) {
  return plan.classifications.find((entry) => entry.exportKey === exportKey);
}

function runTypeExportsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'type-exports',
    label: 'TypeExports Public Declaration Gate'
  });
  const packageManifest = readJson('package.json', rootDir);
  const plan = createTypeExportsPlan({ rootDir, packageManifest });
  const validation = validateTypeExportsPlan(plan);
  const report = createTypeExportsReport({ rootDir, plan });
  const metadata = packageManifest.xtend && packageManifest.xtend.typeExports;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const backlog = readText(TYPE_EXPORTS_BACKLOG, rootDir);
  const workpackage = readText(TYPE_EXPORTS_WORKPACKAGE_DOC, rootDir);
  const releaseWorkpackage = readText('development/WP-TypeExports-09-TypeExports-Gate-Drift-Report-und-Docs-Handoff-produktisieren.md', rootDir);
  const docs = readText(TYPE_EXPORTS_DOCS, rootDir);
  const moduleSyntax = syntaxCheckFile(TYPE_EXPORTS_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(TYPE_EXPORTS_SUITE, { rootDir, extension: '.js' });
  const packageExportFingerprint = createExportFingerprint(EXPECTED_EXPORT_KEYS);

  [
    TYPE_EXPORTS_MODULE,
    TYPE_EXPORTS_SUITE,
    TYPE_EXPORTS_DOCS,
    TYPE_EXPORTS_BACKLOG,
    TYPE_EXPORTS_WORKPACKAGE_DOC,
    'development/WP-TypeExports-09-TypeExports-Gate-Drift-Report-und-Docs-Handoff-produktisieren.md'
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `TypeExports catalog syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `TypeExports suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === TYPE_EXPORTS_SCHEMA, 'TypeExports plan exposes stable schema');
  context.assert(plan.reportSchema === TYPE_EXPORTS_REPORT_SCHEMA, 'TypeExports plan exposes report schema');
  context.assert(plan.workpackage === TYPE_EXPORTS_WORKPACKAGE, 'TypeExports plan belongs to WP-TypeExports-01');
  context.assert(plan.status === TYPE_EXPORTS_STATUS, 'TypeExports plan is accepted for first run');
  context.assert(plan.targetReadiness === TYPE_EXPORTS_TARGET, 'TypeExports target readiness is classified');
  context.assert(plan.localGate === TYPE_EXPORTS_LOCAL_GATE, 'TypeExports plan exposes local gate');
  context.assert(plan.packageScript === TYPE_EXPORTS_PACKAGE_SCRIPT, 'TypeExports plan exposes package script');
  context.assert(plan.reportArtifact === TYPE_EXPORTS_REPORT_ARTIFACT, 'TypeExports plan exposes report artifact path');
  context.assert(plan.boundaries.includes(TYPE_EXPORTS_BOUNDARY), 'TypeExports plan keeps types-only boundary');
  context.assert(plan.boundaries.includes(TYPE_EXPORTS_KERNEL_BOUNDARY), 'TypeExports plan keeps RMT kernel boundary');
  context.assert(plan.boundaries.includes(TYPE_EXPORTS_DECLARATION_BOUNDARY), 'TypeExports plan keeps declaration/runtime boundary');
  context.assert(plan.lockedExportCount === TYPE_EXPORTS_LOCKED_EXPORT_COUNT, 'TypeExports plan locks export count');
  context.assert(plan.lockedExportFingerprint === TYPE_EXPORTS_LOCKED_EXPORT_FINGERPRINT, 'TypeExports plan locks export fingerprint');
  context.assert(packageExportFingerprint === TYPE_EXPORTS_LOCKED_EXPORT_FINGERPRINT, 'Package export lock fingerprint is unchanged');
  context.assert(validation.schema === TYPE_EXPORTS_REPORT_SCHEMA, 'TypeExports validator emits report schema');
  context.assert(validation.ok === true, 'TypeExports plan validates');
  context.assert(report.ok === true, 'TypeExports report validates');
  context.assert(report.exportCount === TYPE_EXPORTS_LOCKED_EXPORT_COUNT, 'TypeExports report counts all package exports');
  context.assert(plan.exportCount === Object.keys(packageManifest.exports).length, 'TypeExports plan reads package exports');
  context.assert(plan.expectedExportKeys.length === TYPE_EXPORTS_LOCKED_EXPORT_COUNT, 'TypeExports expected export list is locked');
  context.assert(plan.classifications.length === TYPE_EXPORTS_LOCKED_EXPORT_COUNT, 'TypeExports classifies every package export');
  context.assert(plan.missingPackageExports.length === 0, 'TypeExports has no missing package exports');
  context.assert(plan.unexpectedPackageExports.length === 0, 'TypeExports has no unexpected package exports');
  context.assert(plan.missingTypeClassifications.length === 0, 'TypeExports has no missing classifications');
  context.assert(plan.unclassifiedExports.length === 0, 'TypeExports has no unclassified package exports');
  context.assert(plan.p0WithoutTypesDecision.length === 0, 'TypeExports gives every P0 export a types decision');
  context.assert(plan.declarationDrift.length === 0, 'TypeExports has no declaration drift');
  context.assert(plan.packageTypesConditionDrift.length === 0, 'TypeExports has no package types condition drift');
  context.assert(plan.driftReportSchema === TYPE_EXPORTS_DRIFT_REPORT_SCHEMA, 'TypeExports exposes drift report schema');
  context.assert(plan.releaseHandoff.schema === TYPE_EXPORTS_DRIFT_REPORT_SCHEMA, 'TypeExports release handoff uses drift report schema');
  context.assert(plan.releaseHandoff.workpackage === TYPE_EXPORTS_RELEASE_WORKPACKAGE, 'TypeExports release handoff belongs to WP-TypeExports-09');
  context.assert(plan.releaseHandoff.status === TYPE_EXPORTS_RELEASE_STATUS, 'TypeExports release handoff is accepted');
  context.assert(plan.releaseHandoff.targetReadiness === TYPE_EXPORTS_RELEASE_TARGET, 'TypeExports release handoff target is ready');
  context.assert(plan.releaseHandoff.localGate === TYPE_EXPORTS_RELEASE_LOCAL_GATE, 'TypeExports release handoff exposes aggregate local gate');
  context.assert(plan.releaseHandoff.packageScript === TYPE_EXPORTS_RELEASE_PACKAGE_SCRIPT, 'TypeExports release handoff exposes package script');
  context.assert(plan.releaseHandoff.reportArtifact === TYPE_EXPORTS_REPORT_ARTIFACT, 'TypeExports release handoff emits the release report artifact');
  context.assert(plan.releaseHandoff.gateScripts.length === TYPE_EXPORTS_RELEASE_GATE_SCRIPTS.length, 'TypeExports release handoff tracks all gate scripts');
  context.assert(plan.releaseHandoff.reportArtifacts.length === TYPE_EXPORTS_RELEASE_REPORT_ARTIFACTS.length, 'TypeExports release handoff tracks all report artifacts');
  context.assert(plan.releaseHandoff.missingReleaseGateScripts.length === 0, 'TypeExports release gates include the full gate bundle');
  context.assert(plan.releaseHandoff.missingCandidateGateScripts.length === 0, 'TypeExports candidate gates include the full gate bundle');
  context.assert(plan.releaseHandoff.missingArtifactChecklistEntries.length === 0, 'TypeExports artifact checklist includes all release artifacts');
  context.assert(plan.releaseHandoff.releaseOwnerVisible === true, 'TypeExports release handoff is visible to release owners');
  context.assert(plan.releaseHandoff.driftReportReady === true, 'TypeExports release handoff has a clean drift report');
  context.assert(plan.completedWorkpackages.includes(TYPE_EXPORTS_RELEASE_WORKPACKAGE), 'TypeExports records WP-TypeExports-09 completion');
  context.assert(plan.nextWorkpackages.length === 0, 'TypeExports has no remaining workpackages after WP-TypeExports-09');
  context.assert(plan.localGateFailsOnNewUntypedPublicExport === true, 'TypeExports gate fails on new untyped public export');
  context.assert(plan.packageTypesConditionsApplyInFollowUps === true, 'TypeExports keeps package types conditions in follow-up WPs');

  [
    ['.', 'loader', 'WP-TypeExports-02', './xtend-loader.d.ts'],
    ['./loader', 'loader', 'WP-TypeExports-02', './xtend-loader.d.ts'],
    ['./legacy-loader', 'loader', 'WP-TypeExports-02', './xtend-dev.d.ts'],
    ['./api', 'core-api', 'WP-TypeExports-03', './api.d.ts'],
    ['./components/*', 'components', 'ER-WP-34', './components/*.d.ts'],
    ['./components/xkeymap.js', 'components', 'ER-WP-34', './components/xkeymap.d.ts'],
    ['./xcommand', 'xcommand', 'WP-XCommand-01', './xcommand/xcommand.d.ts'],
    ['./maraca', 'maraca', 'WP-Maraca-01', './xtend-maraca/index.d.ts'],
    ['./maraca/runtime', 'maraca', 'WP-Maraca-01', './xtend-maraca/runtime.d.ts'],
    ['./rmt', 'rmt-runtime', 'WP-TypeExports-04', './xtendrmt/rmt-core.d.ts'],
    ['./rmt/browser', 'rmt-runtime', 'WP-TypeExports-04', './xtendrmt/rmt-core.d.ts'],
    ['./rmt-language/parser', 'rmt-language', 'WP-TypeExports-04', './tools/rmt-language/parser.d.ts'],
    ['./fabric', 'fabric', 'WP-TypeExports-05', './fabric/xtend-fabric.d.ts'],
    ['./security/trusted-dom-policy', 'security', 'WP-TypeExports-05', './security/trusted-dom-policy.d.ts'],
    ['./builder', 'builder', 'WP-TypeExports-06', './xtend-builder/scaffold.d.ts'],
    ['./builder/*', 'builder', 'WP-TypeExports-06', './xtend-builder/*.d.ts'],
    ['./catalog/epic13-package-export-lock', 'catalog', 'WP-TypeExports-07', './catalog/epic13-package-export-lock.d.ts'],
    ['./design-tokens', 'design-tokens', 'WP-TypeExports-08', './design-tokens/xtend-design-tokens.d.ts'],
    ['./design-tokens/xtheme-token-alias-layer', 'design-tokens', 'WP-TypeExports-08', './design-tokens/xtheme-token-alias-layer.d.ts']
  ].forEach(([exportKey, group, workpackageId, proposedTypesCondition]) => {
    const entry = findClassification(plan, exportKey);
    context.assert(entry && entry.group === group, `${exportKey} is classified as ${group}`);
    context.assert(entry && entry.workpackage === workpackageId, `${exportKey} maps to ${workpackageId}`);
    context.assert(entry && entry.proposedTypesCondition === proposedTypesCondition, `${exportKey} prepares ${proposedTypesCondition}`);
  });

  ['./style.css', './manifest', './components/manifest.json', './package.json'].forEach((exportKey) => {
    const entry = findClassification(plan, exportKey);
    context.assert(entry && entry.typeDecision === 'types-not-required', `${exportKey} is a documented types-not-required boundary`);
  });

  context.assert(packageManifest.scripts['test:type-exports'] === 'node scripts/run_xtend_tests.js type-exports', 'Package exposes TypeExports script');
  context.assert(packageManifest.scripts['test:type-exports:release'] === TYPE_EXPORTS_RELEASE_LOCAL_GATE, 'Package exposes TypeExports release report script');
  context.assert(metadata && metadata.schema === TYPE_EXPORTS_SCHEMA, 'Package metadata exposes TypeExports schema');
  context.assert(metadata && metadata.workpackage === TYPE_EXPORTS_WORKPACKAGE, 'Package metadata exposes WP-TypeExports-01');
  context.assert(metadata && metadata.status === TYPE_EXPORTS_STATUS, 'Package metadata exposes TypeExports status');
  context.assert(metadata && metadata.expectedExportCount === TYPE_EXPORTS_LOCKED_EXPORT_COUNT, 'Package metadata exposes locked export count');
  context.assert(metadata && metadata.lockedExportFingerprint === TYPE_EXPORTS_LOCKED_EXPORT_FINGERPRINT, 'Package metadata exposes locked export fingerprint');
  context.assert(metadata && Array.isArray(metadata.boundaries) && metadata.boundaries.includes(TYPE_EXPORTS_BOUNDARY), 'Package metadata exposes types-only boundary');
  context.assert(metadata && metadata.localGate === TYPE_EXPORTS_LOCAL_GATE, 'Package metadata exposes TypeExports local gate');
  context.assert(metadata && metadata.packageScript === TYPE_EXPORTS_PACKAGE_SCRIPT, 'Package metadata exposes TypeExports package script');
  context.assert(metadata && metadata.reportArtifact === TYPE_EXPORTS_REPORT_ARTIFACT, 'Package metadata exposes TypeExports report artifact');
  context.assert(metadata && metadata.driftReportSchema === TYPE_EXPORTS_DRIFT_REPORT_SCHEMA, 'Package metadata exposes drift report schema');
  context.assert(metadata && metadata.releaseWorkpackage === TYPE_EXPORTS_RELEASE_WORKPACKAGE, 'Package metadata exposes WP-TypeExports-09 release workpackage');
  context.assert(metadata && metadata.releaseStatus === TYPE_EXPORTS_RELEASE_STATUS, 'Package metadata exposes TypeExports release status');
  context.assert(metadata && metadata.releaseTargetReadiness === TYPE_EXPORTS_RELEASE_TARGET, 'Package metadata exposes TypeExports release target');
  context.assert(metadata && metadata.releaseLocalGate === TYPE_EXPORTS_RELEASE_LOCAL_GATE, 'Package metadata exposes TypeExports release local gate');
  context.assert(metadata && metadata.releasePackageScript === TYPE_EXPORTS_RELEASE_PACKAGE_SCRIPT, 'Package metadata exposes TypeExports release package script');
  context.assert(metadata && Array.isArray(metadata.releaseGateBundle) && metadata.releaseGateBundle.includes(TYPE_EXPORTS_RELEASE_PACKAGE_SCRIPT), 'Package metadata exposes TypeExports release gate bundle');
  context.assert(metadata && Array.isArray(metadata.releaseReportArtifacts) && metadata.releaseReportArtifacts.includes(TYPE_EXPORTS_REPORT_ARTIFACT), 'Package metadata exposes TypeExports release report artifacts');
  context.assert(metadata && Array.isArray(metadata.completedWorkpackages) && metadata.completedWorkpackages.includes(TYPE_EXPORTS_RELEASE_WORKPACKAGE), 'Package metadata records WP-TypeExports-09 completion');
  context.assert(metadata && Array.isArray(metadata.nextWorkpackages) && metadata.nextWorkpackages.length === 0, 'Package metadata has no remaining TypeExports workpackages');
  context.assert(packageManifest.xtend.releaseGates.includes(TYPE_EXPORTS_RELEASE_PACKAGE_SCRIPT), 'Release gates include TypeExports release bundle');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(TYPE_EXPORTS_RELEASE_PACKAGE_SCRIPT), 'Candidate gates include TypeExports release bundle');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes('development/WP-TypeExports-09-TypeExports-Gate-Drift-Report-und-Docs-Handoff-produktisieren.md'), 'Artifact checklist includes WP-TypeExports-09 handoff');
  context.assertIncludes(runner, "id: 'type-exports'", 'Runner registers TypeExports suite');
  context.assertIncludes(runner, "runTypeExportsSuite", 'Runner imports TypeExports suite');
  context.assertIncludes(docsReadme, './type-exports.md', 'Docs README links TypeExports docs');
  context.assertIncludes(testsReadme, TYPE_EXPORTS_LOCAL_GATE, 'Tests README documents TypeExports gate');

  assertTextIncludesAll(context, backlog, [
    'Status: `completed`',
    '| `WP-TypeExports-01` | P0 | completed | WS1 | Public Package Entry Points und `types`-Conditions haerten |',
    '| `WP-TypeExports-02` | P0 | completed | WS1 | XTendLoader, StyleRegistry und SkeletonLoader typisieren |',
    '| `WP-TypeExports-03` | P0 | completed | WS1 | `api.js` und `window.XTend.*` Namespace typisieren |',
    '| `WP-TypeExports-04` | P1 | completed | WS2 | XTendRMT Runtime-, Browser- und RMT-Language-Exports typisieren |',
    '| `WP-TypeExports-05` | P1 | completed | WS3 | Fabric-, A11y- und Security-Policy-APIs typisieren |',
    '| `WP-TypeExports-06` | P1 | completed | WS4 | Builder-, Scaffold- und Component-Lab-Programm-APIs typisieren |',
    '| `WP-TypeExports-07` | P2 | completed | WS5 | Catalog Declaration Pattern fuer Plan-/Report-Module einfuehren |',
    '| `WP-TypeExports-08` | P2 | completed | WS6 | Vendor-/Utility-Facades fuer Prism, Turndown und Design Tokens ergaenzen |',
    '| `WP-TypeExports-09` | P1 | completed | WS7 | TypeExports Gate, Drift-Report und Docs-Handoff produktisieren |',
    'Keine offenen TypeExports-Workpackages',
    TYPE_EXPORTS_SCHEMA,
    TYPE_EXPORTS_LOCAL_GATE
  ], 'TypeExports backlog');
  assertTextIncludesAll(context, workpackage, [
    TYPE_EXPORTS_SCHEMA,
    TYPE_EXPORTS_LOCAL_GATE,
    TYPE_EXPORTS_REPORT_ARTIFACT,
    TYPE_EXPORTS_LOCKED_EXPORT_FINGERPRINT,
    'Status: `completed`'
  ], 'WP-TypeExports-01 document');
  assertTextIncludesAll(context, docs, [
    TYPE_EXPORTS_SCHEMA,
    TYPE_EXPORTS_DRIFT_REPORT_SCHEMA,
    TYPE_EXPORTS_LOCAL_GATE,
    TYPE_EXPORTS_RELEASE_PACKAGE_SCRIPT,
    './xtend-loader.d.ts',
    './api.d.ts',
    './xtendrmt/rmt-core.d.ts',
    'types-not-required'
  ], 'TypeExports docs');
  assertTextIncludesAll(context, releaseWorkpackage, [
    TYPE_EXPORTS_RELEASE_WORKPACKAGE,
    TYPE_EXPORTS_DRIFT_REPORT_SCHEMA,
    TYPE_EXPORTS_RELEASE_LOCAL_GATE,
    TYPE_EXPORTS_REPORT_ARTIFACT,
    'Status: `completed`'
  ], 'WP-TypeExports-09 document');

  return context.result({
    report: {
      schema: TYPE_EXPORTS_REPORT_SCHEMA,
      exportCount: report.exportCount,
      p0ExportCount: report.p0ExportCount,
      preparedTypesConditionCount: report.preparedTypesConditionCount,
      unclassifiedExports: report.unclassifiedExports,
      declarationDrift: report.declarationDrift,
      packageTypesConditionDrift: report.packageTypesConditionDrift,
      releaseHandoff: report.releaseHandoff,
      nextWorkpackages: report.nextWorkpackages
    }
  });
}

function printTypeExportsReport(result) {
  printSuiteReport(result, {
    successTitle: 'TypeExports Public Declaration Gate erfolgreich.',
    failureTitle: 'TypeExports Public Declaration Gate fehlgeschlagen:'
  });
}

module.exports = {
  printTypeExportsReport,
  runTypeExportsSuite
};

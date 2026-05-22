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
  DPF_WORKPACKAGE,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_CONTRACT,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_DOCS,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_LOCAL_GATE,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_MODULE,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_EXPORT,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_SCRIPT,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_ARTIFACT,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_SCHEMA,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STATUS,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STEERING,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SUITE,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_TARGET,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE,
  EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE_DOC,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PUBLISH_BOUNDARY,
  REQUIRED_REFERENCE_PATHS,
  REQUIRED_REPORT_ARTIFACTS,
  REQUIRED_SOURCE_GATES,
  SOURCE_GATE_DEFINITIONS,
  createEpic13Rc1GateMatrixCiHandoffPlan,
  createEpic13Rc1GateMatrixCiHandoffReport,
  validateEpic13Rc1GateMatrixCiHandoffPlan
} = require('../../catalog/epic13-rc1-gate-matrix-ci-handoff');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function runEpic13Rc1GateMatrixCiHandoffSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-rc1-gate-matrix-ci-handoff',
    label: 'Epic 13 RC1 Gate Matrix and CI Handoff'
  });
  const plan = createEpic13Rc1GateMatrixCiHandoffPlan({ rootDir });
  const validation = validateEpic13Rc1GateMatrixCiHandoffPlan(plan);
  const report = createEpic13Rc1GateMatrixCiHandoffReport({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13Rc1GateMatrixCiHandoff;
  const packageLockMetadata = packageManifest.xtend && packageManifest.xtend.epic13PackageExportLock;
  const typeExportsMetadata = packageManifest.xtend && packageManifest.xtend.typeExports;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const steering = readText(EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STEERING, rootDir);
  const contract = readText(EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_DOCS, rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const packageExportContract = readText('development/XTend-Epic13-Package-Export-Lock-Contract.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const rootReadme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const roadmap = readText('development/ROADMAP-Docs-Planned-Features.md', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SUITE, { rootDir, extension: '.js' });

  [
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_MODULE,
    'catalog/epic13-rc1-gate-matrix-ci-handoff.d.ts',
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SUITE,
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STEERING,
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_CONTRACT,
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE_DOC,
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_REFERENCE_PATHS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as RC1 handoff reference`);
  });

  context.assert(moduleSyntax.ok, `RC1 gate matrix module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RC1 gate matrix suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA, 'RC1 gate matrix exposes stable schema');
  context.assert(plan.reportSchema === EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_SCHEMA, 'RC1 gate matrix exposes report schema');
  context.assert(plan.workpackage === EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE, 'RC1 gate matrix belongs to WP-E13-13');
  context.assert(plan.dpfWorkpackage === DPF_WORKPACKAGE, 'RC1 gate matrix maps to DPF-WP-01');
  context.assert(plan.status === EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STATUS, 'RC1 gate matrix is accepted');
  context.assert(plan.targetReadiness === EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_TARGET, 'RC1 gate matrix target is CI handoff ready');
  context.assert(plan.packageExport === EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_EXPORT, 'RC1 gate matrix declares package export');
  context.assert(plan.handoffContract.releaseOwnerVisible === true, 'handoff is release-owner visible');
  context.assert(plan.handoffContract.ciMaintainerVisible === true, 'handoff is CI-maintainer visible');
  context.assert(plan.handoffContract.localGateRequiresNetwork === false, 'handoff local gate remains network-free');
  context.assert(plan.handoffContract.conditionalNetworkMode === 'executed-or-owner-deferral', 'handoff keeps conditional network evidence mode');
  context.assert(plan.handoffContract.packDryRunReportRequired === true, 'handoff requires pack dry-run report');
  context.assert(plan.handoffContract.typeExportsReleaseGateRequired === true, 'handoff requires TypeExports release gate');
  context.assert(plan.nextDecision === NEXT_DECISION, 'RC1 gate matrix hands off to Epic 13 final RC1 handoff');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'RC1 gate matrix makes WP-E13-14 ready');
  context.assert(plan.publishBoundary === PUBLISH_BOUNDARY, 'RC1 gate matrix keeps publish boundary');
  context.assert(plan.publishAllowed === false && plan.packagePrivateRequired === true, 'RC1 gate matrix keeps publish blocked');
  context.assert(validation.schema === EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_SCHEMA, 'RC1 gate matrix validator emits report schema');
  context.assert(validation.ok === true, 'RC1 gate matrix plan validates');
  context.assert(report.ok === true, 'RC1 gate matrix report validates');
  context.assert(report.sourceGateCount === SOURCE_GATE_DEFINITIONS.length, 'RC1 gate matrix report counts source gates');
  context.assert(report.localGateCount === REQUIRED_SOURCE_GATES.length, 'RC1 gate matrix report counts local gates');

  SOURCE_GATE_DEFINITIONS.forEach((definition) => {
    const source = plan.sourceGates.find((entry) => entry.id === definition.id);
    context.assert(source && source.schema === definition.schema, `${definition.id} schema is linked`);
    context.assert(source && source.workpackage === definition.workpackage, `${definition.id} workpackage is linked`);
    context.assert(source && source.packageScript === definition.packageScript, `${definition.id} package script is linked`);
    context.assert(source && source.validationOk === true && source.reportOk === true, `${definition.id} source gate validates`);
  });
  assertIncludesAll(context, plan.localGateMatrix.map((entry) => entry.command), REQUIRED_SOURCE_GATES, 'RC1 local gate matrix');
  assertIncludesAll(context, plan.reportArtifacts, REQUIRED_REPORT_ARTIFACTS, 'RC1 report artifacts');
  assertIncludesAll(context, plan.referencePaths, REQUIRED_REFERENCE_PATHS, 'RC1 reference paths');
  assertIncludesAll(context, plan.ciLanes.map((entry) => entry.id), ['pr-fast', 'rc1-full-release', 'conditional-network-evidence', 'owner-handoff'], 'RC1 CI lanes');

  context.assert((packageManifest.exports[EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_EXPORT] && packageManifest.exports[EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_EXPORT].default === './catalog/epic13-rc1-gate-matrix-ci-handoff.js'), 'package exports RC1 gate matrix catalog');
  context.assert(packageManifest.scripts['test:epic13-rc1-gate-matrix-ci-handoff'] === 'node scripts/run_xtend_tests.js epic13-rc1-gate-matrix-ci-handoff', 'package exposes RC1 gate matrix test script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_SCRIPT), 'release gates include RC1 gate matrix package script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_SCRIPT), 'release checklist includes RC1 gate matrix package script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_CONTRACT), 'release checklist includes RC1 gate matrix contract');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_DOCS), 'release checklist includes RC1 gate matrix docs');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_ARTIFACT), 'release checklist includes RC1 gate matrix report artifact');
  context.assert(metadata && metadata.schema === EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA, 'package metadata exposes RC1 gate matrix schema');
  context.assert(metadata && metadata.workpackage === EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE, 'package metadata exposes WP-E13-13');
  context.assert(metadata && metadata.dpfWorkpackage === DPF_WORKPACKAGE, 'package metadata exposes DPF workpackage');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'package metadata hands off to WP-E13-14');
  context.assert(metadata && metadata.nextDecision === NEXT_DECISION, 'package metadata hands off to final RC1 decision');
  context.assert(metadata && metadata.reportArtifact === EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_ARTIFACT, 'package metadata exposes report artifact');
  context.assert(packageLockMetadata && packageLockMetadata.expectedExportCount === 123, 'package export lock expects 123 exports after RC1 gate matrix and kernel catalogs');
  context.assert(typeExportsMetadata && typeExportsMetadata.expectedExportCount === 123, 'TypeExports lock expects 123 exports after RC1 gate matrix and kernel catalogs');

  assertTextIncludesAll(context, scaffoldConfig, [
    'epic13Rc1GateMatrixCiHandoff',
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA,
    'expectedExportCount: 123',
    'nextWorkpackage: "WP-E13-14"'
  ], 'scaffold config');
  assertTextIncludesAll(context, runner, [
    'epic13_rc1_gate_matrix_ci_handoff_suite',
    'epic13-rc1-gate-matrix-ci-handoff',
    'runEpic13Rc1GateMatrixCiHandoffSuite'
  ], 'test runner');
  assertTextIncludesAll(context, steering, [
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA,
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_LOCAL_GATE,
    'WP-E13-14'
  ], 'Epic 13 steering');
  assertTextIncludesAll(context, contract, [
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA,
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_SCHEMA,
    'owner-handoff',
    'conditional-network-evidence',
    'WP-E13-14'
  ], 'RC1 gate matrix contract');
  assertTextIncludesAll(context, workpackage, [
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA,
    DPF_WORKPACKAGE,
    'Status: completed',
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_LOCAL_GATE,
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_ARTIFACT
  ], 'RC1 gate matrix workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA,
    'owner-handoff',
    'npm run test:epic13-rc1-gate-matrix-ci-handoff',
    'WP-E13-14'
  ], 'RC1 gate matrix docs');
  assertTextIncludesAll(context, ciMatrix, [EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_SCRIPT, 'RC1 Gate Matrix'], 'CI gate matrix');
  assertTextIncludesAll(context, releaseChecklist, [
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_SCRIPT,
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_CONTRACT,
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_DOCS,
    EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_ARTIFACT
  ], 'release checklist');
  assertTextIncludesAll(context, registry, [EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA, EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_DOCS], 'documentation registry');
  assertTextIncludesAll(context, packageExportContract, ['expectedExportCount: `123`', EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_EXPORT], 'package export contract');
  assertTextIncludesAll(context, docsReadme, ['./rc1-gate-matrix-ci-handoff.md', EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA], 'docs README');
  assertTextIncludesAll(context, docsMenu, ['"slug": "rc1-gate-matrix-ci-handoff"', 'RC1 Gate Matrix und CI-Handoff'], 'docs menu');
  assertTextIncludesAll(context, testsReadme, [EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_LOCAL_GATE, EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA], 'tests README');
  assertTextIncludesAll(context, rootReadme, ['xtend.epic13Rc1GateMatrixCiHandoff', EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_SCRIPT, EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA], 'root README');
  assertTextIncludesAll(context, changelog, [EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA, 'RC1 Gate Matrix'], 'changelog');
  assertTextIncludesAll(context, roadmap, [DPF_WORKPACKAGE, EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA], 'planned features roadmap');

  return context.result({
    report: {
      schema: EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_SCHEMA,
      sourceGateCount: report.sourceGateCount,
      localGateCount: report.localGateCount,
      reportArtifactCount: report.reportArtifactCount,
      ciLaneCount: report.ciLaneCount,
      publishAllowed: report.publishAllowed,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13Rc1GateMatrixCiHandoffReport(report) {
  printSuiteReport(report, {
    successTitle: 'Epic 13 RC1 Gate Matrix und CI-Handoff Gates erfolgreich.',
    failureTitle: 'Epic 13 RC1 Gate Matrix und CI-Handoff Gates fehlgeschlagen:'
  });
}

module.exports = {
  printEpic13Rc1GateMatrixCiHandoffReport,
  runEpic13Rc1GateMatrixCiHandoffSuite
};

if (require.main === module) {
  const report = runEpic13Rc1GateMatrixCiHandoffSuite();
  printEpic13Rc1GateMatrixCiHandoffReport(report);
  process.exit(report.ok ? 0 : 1);
}

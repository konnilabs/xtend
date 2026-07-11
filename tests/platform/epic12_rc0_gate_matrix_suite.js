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
  CONDITIONAL_NETWORK_COMMANDS,
  KERNEL_BOUNDARY,
  PUBLISH_BOUNDARY,
  RC0_AUTHORING_SUITES,
  RC0_GATE_MATRIX_CONTRACT,
  RC0_GATE_MATRIX_DOCS,
  RC0_GATE_MATRIX_LOCAL_GATE,
  RC0_GATE_MATRIX_MODULE,
  RC0_GATE_MATRIX_PACKAGE_SCRIPT,
  RC0_GATE_MATRIX_REPORT_SCHEMA,
  RC0_GATE_MATRIX_SCHEMA,
  RC0_GATE_MATRIX_STATUS,
  RC0_GATE_MATRIX_SUITE,
  RC0_GATE_MATRIX_WORKPACKAGE,
  RC0_GATE_MATRIX_WORKPACKAGE_DOC,
  RC0_GATE_RECORD_SCHEMA,
  RC0_KNOWN_RESIDUAL_POLICY_SCHEMA,
  RC0_RELEASE_MUST_INCLUDE,
  RC0_SNAPSHOT_SUITES,
  createEpic12Rc0GateMatrix,
  createEpic12Rc0GateMatrixReport,
  validateEpic12Rc0GateMatrix
} = require('../../catalog/epic12-rc0-gate-matrix');

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

function runEpic12Rc0GateMatrixSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rc0-gate-matrix',
    label: 'Epic 12 RC0 Gate Matrix'
  });
  const matrix = createEpic12Rc0GateMatrix();
  const validation = validateEpic12Rc0GateMatrix(matrix);
  const report = createEpic12Rc0GateMatrixReport({ matrix });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rc0GateMatrix;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const contract = readText(RC0_GATE_MATRIX_CONTRACT, rootDir);
  const workpackage = readText(RC0_GATE_MATRIX_WORKPACKAGE_DOC, rootDir);
  const docs = readText(RC0_GATE_MATRIX_DOCS, rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md', rootDir);
  const rcModel = readText('development/XTend-Epic12-RC-Hardening-Modell.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const moduleSyntax = syntaxCheckFile(RC0_GATE_MATRIX_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RC0_GATE_MATRIX_SUITE, { rootDir, extension: '.js' });
  const gateIds = matrix.gates.map((gate) => gate.id);

  [
    RC0_GATE_MATRIX_MODULE,
    RC0_GATE_MATRIX_SUITE,
    RC0_GATE_MATRIX_CONTRACT,
    RC0_GATE_MATRIX_WORKPACKAGE_DOC,
    RC0_GATE_MATRIX_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  context.assert(moduleSyntax.ok, `RC0 Gate Matrix module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RC0 Gate Matrix suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(matrix.schema === RC0_GATE_MATRIX_SCHEMA, 'RC0 matrix exposes stable schema');
  context.assert(matrix.gateRecordSchema === RC0_GATE_RECORD_SCHEMA, 'RC0 matrix exposes gate record schema');
  context.assert(matrix.reportSchema === RC0_GATE_MATRIX_REPORT_SCHEMA, 'RC0 matrix exposes report schema');
  context.assert(matrix.workpackage === RC0_GATE_MATRIX_WORKPACKAGE, 'RC0 matrix belongs to WP-E12-14');
  context.assert(matrix.status === RC0_GATE_MATRIX_STATUS, 'RC0 matrix is accepted');
  context.assert(matrix.releaseCandidate === 'RC0', 'RC0 matrix targets RC0');
  context.assert(matrix.kernelBoundary === KERNEL_BOUNDARY, 'RC0 matrix keeps RMT kernel boundary');
  context.assert(matrix.publishBoundary === PUBLISH_BOUNDARY, 'RC0 matrix keeps publish boundary');
  context.assert(matrix.publishAllowed === false, 'RC0 matrix blocks publish');
  context.assert(matrix.packagePrivateRequired === true, 'RC0 matrix requires private package');
  context.assert(validation.schema === RC0_GATE_MATRIX_REPORT_SCHEMA, 'RC0 validator emits report schema');
  context.assert(validation.ok === true, 'RC0 matrix validates');
  context.assert(report.ok === true, 'RC0 matrix report passes');
  context.assert(report.blockerCount === 0, 'RC0 matrix has no accepted blockers');
  context.assert(report.publishAllowed === false, 'RC0 matrix report blocks publish');
  context.assert(report.packagePrivateRequired === true, 'RC0 matrix report requires private package');
  context.assert(matrix.summary.requiredLocalGateCount === 7, 'RC0 matrix exposes seven required local gates');
  context.assert(matrix.summary.conditionalNetworkGateCount === 2, 'RC0 matrix exposes two conditional network gates');

  assertIncludesAll(context, gateIds, [
    'rc0-pr-fast',
    'rc0-full-release',
    'rc0-snapshot',
    'rc0-rmt-authoring',
    'rc0-conditional-network',
    'rc0-package-dry-run',
    'rc0-known-residual-policy',
    'rc0-self'
  ], 'RC0 gate ids');
  matrix.gates.forEach((gate) => {
    context.assert(gate.schema === RC0_GATE_RECORD_SCHEMA, `${gate.id} declares gate record schema`);
    context.assert(gate.command && gate.tier, `${gate.id} exposes command and tier`);
    context.assert(Array.isArray(gate.validates) && gate.validates.length > 0, `${gate.id} declares validation targets`);
  });
  context.assert(matrix.commands.prFast === 'npm run test:pr:report', 'RC0 PR Fast command reuses existing PR report gate');
  context.assert(matrix.commands.fullRelease === 'npm run test:release:full:report', 'RC0 Full Release command reuses release report gate');
  context.assert(matrix.commands.packageDryRun === 'npm run pack:dry-run', 'RC0 package dry run command is stable');
  context.assert(matrix.commands.self === RC0_GATE_MATRIX_LOCAL_GATE, 'RC0 self gate command is stable');
  assertIncludesAll(context, matrix.snapshotGate.suiteIds, RC0_SNAPSHOT_SUITES, 'RC0 snapshot suites');
  assertIncludesAll(context, matrix.rmtAuthoringGate.suiteIds, RC0_AUTHORING_SUITES, 'RC0 RMT authoring suites');
  assertIncludesAll(context, matrix.gates.find((gate) => gate.id === 'rc0-full-release').requiredSuites, RC0_RELEASE_MUST_INCLUDE, 'RC0 full release required suites');
  assertIncludesAll(context, matrix.conditionalNetworkGates.commands, CONDITIONAL_NETWORK_COMMANDS, 'RC0 conditional network commands');
  context.assert(matrix.conditionalNetworkGates.requiredForLocalRc0 === false, 'RC0 conditional network gates are not local default gates');
  context.assert(matrix.conditionalNetworkGates.requiredForPublish === true, 'RC0 conditional network gates are required before publish');
  context.assert(matrix.packageDryRun.publishAllowedAfterDryRun === false, 'Package dry-run alone does not unlock publish');
  assertIncludesAll(context, matrix.packageDryRun.requiredFiles, ['package.json', 'xtend-loader.js', 'components', 'fabric', 'xtendrmt', 'xtend-builder', 'docs'], 'RC0 package dry-run required files');
  context.assert(matrix.knownResidualPolicy.schema === RC0_KNOWN_RESIDUAL_POLICY_SCHEMA, 'Known residual policy declares schema');
  context.assert(matrix.knownResidualPolicy.maxWarningCount === 2, 'Known residual policy allows at most two warnings');
  context.assert(matrix.knownResidualPolicy.failCountAllowed === 0, 'Known residual policy allows no failures');
  context.assert(matrix.knownResidualPolicy.blockers.length === 0, 'Known residual policy has no blockers');
  context.assert(matrix.knownResidualPolicy.acceptedResiduals.some((entry) => entry.scope === 'xstate'), 'Known residual policy covers xstate');
  context.assert(matrix.knownResidualPolicy.acceptedResiduals.some((entry) => entry.scope === 'x-utils'), 'Known residual policy covers x-utils');
  context.assert(matrix.knownResidualPolicy.acceptedResiduals.some((entry) => entry.measurement === 'xtend.component.hydrate'), 'Known residual policy covers hydration warning');
  context.assert(matrix.knownResidualPolicy.ownerAcceptanceRequired === true, 'Known residual policy requires owner acceptance');
  context.assert(matrix.handoff.includes('WP-E12-15'), 'RC0 matrix hands off to WP-E12-15');

  context.assert(packageManifest.private === false, 'Package is public-ready after RC1 owner publish prep');
  context.assert((packageManifest.exports['./catalog/epic12-rc0-gate-matrix'] === './catalog/epic12-rc0-gate-matrix.js' || (packageManifest.exports['./catalog/epic12-rc0-gate-matrix'] && packageManifest.exports['./catalog/epic12-rc0-gate-matrix'].default === './catalog/epic12-rc0-gate-matrix.js')), 'Package exports RC0 Gate Matrix module');
  context.assert(packageManifest.scripts['test:rc0-gate-matrix'] === 'node scripts/run_xtend_tests.js rc0-gate-matrix', 'Package exposes RC0 Gate Matrix test script');
  context.assert(Array.isArray(packageManifest.xtend.releaseGates) && packageManifest.xtend.releaseGates.includes(RC0_GATE_MATRIX_PACKAGE_SCRIPT), 'Package release gates include RC0 gate matrix script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(RC0_GATE_MATRIX_PACKAGE_SCRIPT), 'Release checklist metadata includes RC0 gate matrix script');
  context.assert(metadata && metadata.schema === RC0_GATE_MATRIX_SCHEMA, 'Package metadata exposes RC0 Gate Matrix schema');
  context.assert(metadata && metadata.workpackage === RC0_GATE_MATRIX_WORKPACKAGE, 'Package metadata exposes WP-E12-14');
  context.assert(metadata && metadata.module === RC0_GATE_MATRIX_MODULE, 'Package metadata exposes RC0 module');
  context.assert(metadata && metadata.contract === RC0_GATE_MATRIX_CONTRACT, 'Package metadata exposes RC0 contract doc');
  context.assert(metadata && metadata.localGate === RC0_GATE_MATRIX_LOCAL_GATE, 'Package metadata exposes RC0 local gate');
  context.assert(metadata && metadata.packageScript === RC0_GATE_MATRIX_PACKAGE_SCRIPT, 'Package metadata exposes RC0 package script');
  context.assert(metadata && metadata.publishAllowed === false, 'Package metadata blocks RC0 publish');
  context.assert(metadata && metadata.publishBoundary === PUBLISH_BOUNDARY, 'Package metadata exposes RC0 publish boundary');
  context.assert(metadata && Array.isArray(metadata.snapshotSuites) && metadata.snapshotSuites.includes('visual-snapshots'), 'Package metadata exposes snapshot gate');
  context.assert(metadata && Array.isArray(metadata.rmtAuthoringSuites) && metadata.rmtAuthoringSuites.includes('rmt-dsl-authoring-polish'), 'Package metadata exposes RMT authoring gate');
  context.assert(metadata && metadata.knownResidualPolicy === RC0_KNOWN_RESIDUAL_POLICY_SCHEMA, 'Package metadata exposes known residual policy');
  context.assertIncludes(scaffoldConfig, 'rc0GateMatrix', 'Scaffold config exposes RC0 Gate Matrix');
  context.assertIncludes(scaffoldConfig, RC0_GATE_MATRIX_SCHEMA, 'Scaffold config declares RC0 Gate Matrix schema');
  context.assertIncludes(scaffoldConfig, RC0_GATE_MATRIX_LOCAL_GATE, 'Scaffold config references RC0 local gate');
  context.assertIncludes(runner, "id: 'rc0-gate-matrix'", 'Runner registers RC0 Gate Matrix suite');

  assertTextIncludesAll(context, contract, [
    RC0_GATE_MATRIX_SCHEMA,
    RC0_GATE_MATRIX_LOCAL_GATE,
    'PR Fast Gate',
    'Full Release Gate',
    'Snapshot Gate',
    'Conditional Network Gates',
    'Package Dry Run',
    'Known Residual Policy',
    PUBLISH_BOUNDARY
  ], 'RC0 contract doc');
  assertTextIncludesAll(context, workpackage, [
    'xtend.epic12.wp14.rc0-gate-matrix.v1',
    'Status: `completed`',
    RC0_GATE_MATRIX_SCHEMA,
    RC0_GATE_MATRIX_LOCAL_GATE,
    '`WP-E12-15` startbar'
  ], 'WP-E12-14 workpackage');
  assertTextIncludesAll(context, docs, [
    RC0_GATE_MATRIX_SCHEMA,
    RC0_GATE_MATRIX_LOCAL_GATE,
    'visual-snapshots',
    'rmt-dsl-authoring-polish',
    'npm run pack:dry-run',
    PUBLISH_BOUNDARY
  ], 'RC0 docs');
  context.assertIncludes(docsReadme, 'rc0-gate-matrix.md', 'Docs README links RC0 Gate Matrix');
  context.assertIncludes(docsMenu, 'rc0-gate-matrix', 'Docs menu exposes RC0 Gate Matrix');
  context.assertIncludes(testsReadme, RC0_GATE_MATRIX_LOCAL_GATE, 'Tests README documents RC0 Gate Matrix gate');
  context.assertIncludes(backlog, '| `WP-E12-14` | P2 | completed | WS8 |', 'Backlog marks WP-E12-14 completed');
  context.assertIncludes(backlog, '| `WP-E12-15` | P2 | completed | WS9 |', 'Backlog marks WP-E12-15 completed');
  context.assertIncludes(backlog, '| `WP-E12-16` | P2 | completed | WS10 |', 'Backlog marks WP-E12-16 completed');
  context.assertIncludes(backlog, 'Handoff nach WP-E12-14', 'Backlog contains WP-E12-14 handoff');
  context.assertIncludes(rcModel, RC0_GATE_MATRIX_SCHEMA, 'RC model documents RC0 Gate Matrix schema');
  context.assertIncludes(rcModel, 'Epic 12 ist abgeschlossen', 'RC model documents Epic 12 closure after RC0 handoff');
  context.assertIncludes(ciMatrix, RC0_GATE_MATRIX_SCHEMA, 'CI matrix documents RC0 overlay schema');
  context.assertIncludes(releaseChecklist, RC0_GATE_MATRIX_PACKAGE_SCRIPT, 'Release checklist documents RC0 gate matrix script');
  context.assertIncludes(registry, RC0_GATE_MATRIX_MODULE, 'Reference registry links RC0 module');
  context.assertIncludes(registry, RC0_GATE_MATRIX_CONTRACT, 'Reference registry links RC0 contract');
  context.assertIncludes(registry, RC0_GATE_MATRIX_SUITE, 'Reference registry links RC0 suite');
  context.assertIncludes(registry, RC0_GATE_MATRIX_DOCS, 'Reference registry links RC0 docs');

  return context.result({
    report: {
      schema: RC0_GATE_MATRIX_REPORT_SCHEMA,
      gateCount: matrix.gates.length,
      requiredLocalGateCount: matrix.summary.requiredLocalGateCount,
      conditionalNetworkGateCount: matrix.summary.conditionalNetworkGateCount,
      acceptedResidualCount: matrix.summary.acceptedResidualCount,
      publishAllowed: matrix.publishAllowed,
      handoff: matrix.handoff
    }
  });
}

function printEpic12Rc0GateMatrixReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 12 RC0 Gate Matrix erfolgreich.',
    failureTitle: 'Epic 12 RC0 Gate Matrix fehlgeschlagen:'
  });
}

module.exports = {
  printEpic12Rc0GateMatrixReport,
  runEpic12Rc0GateMatrixSuite
};

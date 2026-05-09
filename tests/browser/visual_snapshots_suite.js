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
  VISUAL_SNAPSHOT_AUTOMATION_SCHEMA
} = require('./visual-snapshot-automation-plan');
const {
  VISUAL_SNAPSHOTS_BASELINE_PATH,
  VISUAL_SNAPSHOTS_BASELINE_SCHEMA,
  VISUAL_SNAPSHOTS_FIXTURE_PATH,
  VISUAL_SNAPSHOTS_FIXTURE_SCHEMA,
  VISUAL_SNAPSHOTS_LOCAL_GATE,
  VISUAL_SNAPSHOTS_PACKAGE_SCRIPT,
  VISUAL_SNAPSHOTS_RECORD_SCHEMA,
  VISUAL_SNAPSHOTS_REPORT_PATH,
  VISUAL_SNAPSHOTS_REPORT_SCHEMA,
  VISUAL_SNAPSHOTS_RESULT_KEY,
  VISUAL_SNAPSHOTS_RUNNER_PATH,
  VISUAL_SNAPSHOTS_SCHEMA,
  VISUAL_SNAPSHOTS_SUITE_PATH,
  VISUAL_SNAPSHOTS_WORKPACKAGE,
  VISUAL_SNAPSHOTS_WP_PATH,
  createVisualSnapshotsRun,
  validateVisualSnapshotsRun
} = require('./visual-snapshots-runner');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function runVisualSnapshotsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'visual-snapshots',
    label: 'Epic 12 Visual Snapshot local DOM diff runner'
  });
  const baseline = readJson(VISUAL_SNAPSHOTS_BASELINE_PATH, rootDir);
  const report = createVisualSnapshotsRun({ rootDir, baseline });
  const validation = validateVisualSnapshotsRun(report);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.visualSnapshots;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const fixture = readText(VISUAL_SNAPSHOTS_FIXTURE_PATH, rootDir);
  const runner = readText(VISUAL_SNAPSHOTS_RUNNER_PATH, rootDir);
  const runnerIndex = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md', rootDir);
  const rcModel = readText('development/XTend-Epic12-RC-Hardening-Modell.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const workpackage = readText(VISUAL_SNAPSHOTS_WP_PATH, rootDir);
  const snapshotDocs = readText('docs/visual-snapshot-automation.md', rootDir);
  const browserReadme = readText('tests/browser/README.md', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const runnerSyntax = syntaxCheckFile(VISUAL_SNAPSHOTS_RUNNER_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(VISUAL_SNAPSHOTS_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, VISUAL_SNAPSHOTS_RUNNER_PATH, rootDir, 'Visual Snapshots runner module exists');
  assertFileExists(context, VISUAL_SNAPSHOTS_SUITE_PATH, rootDir, 'Visual Snapshots suite exists');
  assertFileExists(context, VISUAL_SNAPSHOTS_FIXTURE_PATH, rootDir, 'Visual Snapshots fixture exists');
  assertFileExists(context, VISUAL_SNAPSHOTS_BASELINE_PATH, rootDir, 'Visual Snapshots DOM baseline exists');
  assertFileExists(context, VISUAL_SNAPSHOTS_WP_PATH, rootDir, 'WP-E12-11 workpackage document exists');
  context.assert(runnerSyntax.ok, `Visual Snapshots runner syntax passes${runnerSyntax.ok ? '' : ` (${runnerSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Visual Snapshots suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(baseline.schema === VISUAL_SNAPSHOTS_BASELINE_SCHEMA, 'Visual Snapshots baseline declares schema');
  context.assert(baseline.sourceAutomationContract === VISUAL_SNAPSHOT_AUTOMATION_SCHEMA, 'Visual Snapshots baseline derives from automation contract');
  context.assert(baseline.binaryBaselines === false, 'Visual Snapshots baseline is JSON-only');
  context.assert(baseline.snapshotCount === 5, 'Visual Snapshots baseline contains five snapshots');
  context.assert(baseline.matrixCombinationCount === 360, 'Visual Snapshots baseline preserves 360 combinations');
  context.assert(Array.isArray(baseline.records) && baseline.records.length === 5, 'Visual Snapshots baseline exposes five records');

  context.assert(report.schema === VISUAL_SNAPSHOTS_REPORT_SCHEMA, 'Visual Snapshots report declares schema');
  context.assert(report.runnerSchema === VISUAL_SNAPSHOTS_SCHEMA, 'Visual Snapshots report declares runner schema');
  context.assert(report.fixtureSchema === VISUAL_SNAPSHOTS_FIXTURE_SCHEMA, 'Visual Snapshots report declares fixture schema');
  context.assert(report.sourceAutomationContract === VISUAL_SNAPSHOT_AUTOMATION_SCHEMA, 'Visual Snapshots runner derives from WP-E12-10');
  context.assert(report.workpackage === VISUAL_SNAPSHOTS_WORKPACKAGE, 'Visual Snapshots runner belongs to WP-E12-11');
  context.assert(report.ok === true, 'Visual Snapshots report passes');
  context.assert(report.domDiffCount === 0, 'Visual Snapshots DOM diff has no differences');
  context.assert(report.pixelDiff.mode === 'optional-local-pixel-diff', 'Visual Snapshots exposes optional local pixel diff');
  context.assert(report.pixelDiff.status === 'not-run-in-node-contract-gate', 'Visual Snapshots keeps pixel diff out of node contract gate');
  context.assert(report.snapshotCount === 5, 'Visual Snapshots runner covers five snapshots');
  context.assert(report.familyCount === 5, 'Visual Snapshots runner covers five UX families');
  context.assert(report.componentCount === 17, 'Visual Snapshots runner covers seventeen components');
  context.assert(report.matrixCombinationCount === 360, 'Visual Snapshots runner preserves Theme Matrix combinations');
  context.assert(report.localOnly === true, 'Visual Snapshots runner is local-only');
  context.assert(report.externalNetworkAllowed === false, 'Visual Snapshots runner rejects external network');
  context.assert(report.reportPath === VISUAL_SNAPSHOTS_REPORT_PATH, 'Visual Snapshots report path is stable');
  context.assert(validation.ok === true, 'Visual Snapshots report validator accepts report');

  report.snapshots.forEach((snapshot) => {
    context.assert(snapshot.schema === VISUAL_SNAPSHOTS_RECORD_SCHEMA, `${snapshot.family}: snapshot record schema is stable`);
    context.assert(snapshot.capturePolicy.fixture === VISUAL_SNAPSHOTS_FIXTURE_PATH, `${snapshot.family}: snapshot uses local fixture`);
    context.assert(snapshot.diff.primary === 'dom-structure-and-state-diff', `${snapshot.family}: snapshot uses DOM-first diff`);
    context.assert(snapshot.components.length >= 2, `${snapshot.family}: snapshot covers multiple components`);
    context.assert(snapshot.visualStates.length >= 3, `${snapshot.family}: snapshot keeps visual states`);
    context.assert(snapshot.snapshotScopes.length >= 5, `${snapshot.family}: snapshot keeps scoped assertions`);
    context.assert(snapshot.domSignature.root.includes(`data-snapshot-family="${snapshot.family}"`), `${snapshot.family}: DOM signature targets family panel`);
    context.assert(snapshot.domSignature.tokenKeys.includes('--xtend-color-primary'), `${snapshot.family}: DOM signature tracks product visual token`);
  });

  context.assertIncludes(fixture, VISUAL_SNAPSHOTS_FIXTURE_SCHEMA, 'Visual Snapshots fixture declares fixture schema');
  context.assertIncludes(fixture, VISUAL_SNAPSHOTS_RESULT_KEY, 'Visual Snapshots fixture exposes result key');
  context.assertIncludes(fixture, 'type="module"', 'Visual Snapshots fixture uses module loader');
  context.assertIncludes(fixture, 'src="/xtend-loader.js"', 'Visual Snapshots fixture uses canonical local loader');
  context.assertIncludes(fixture, 'data-manifest="/tests/browser/fixtures/components/manifest.json"', 'Visual Snapshots fixture uses local manifest');
  context.assertIncludes(fixture, 'name="xtend-preload"', 'Visual Snapshots fixture preloads representative components');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de/xtend'), 'Visual Snapshots fixture has no XTend CDN dependency');
  assertIncludesAll(context, fixture, [
    'data-snapshot-family="form-controls"',
    'data-snapshot-family="feedback-status"',
    'data-snapshot-family="navigation-routing"',
    'data-snapshot-family="overlay-interaction"',
    'data-snapshot-family="layout-display-media"',
    'data-rmt-shell="shell-first"',
    'data-rmt-shell-descriptor="xtend.rmt.shell.navigation-routing"',
    'data-rmt-shell-descriptor="xtend.rmt.shell.layout-display-media"'
  ], 'Visual Snapshots fixture family markers');
  [
    'visual snapshots fixture hydrated local loader',
    'visual snapshots fixture exposes five family snapshots',
    'visual snapshots fixture keeps shell first root',
    'visual snapshots form controls snapshot state',
    'visual snapshots feedback status snapshot state',
    'visual snapshots navigation rmt descriptor state',
    'visual snapshots overlay focus snapshot state',
    'visual snapshots layout media snapshot state',
    'visual snapshots fixture remains local only'
  ].forEach((check) => {
    context.assertIncludes(fixture, `recordCheck('${check}'`, `Visual Snapshots fixture records ${check}`);
  });

  context.assertIncludes(runner, VISUAL_SNAPSHOTS_SCHEMA, 'Visual Snapshots runner declares runner schema');
  context.assertIncludes(runner, VISUAL_SNAPSHOTS_FIXTURE_SCHEMA, 'Visual Snapshots runner declares fixture schema');
  context.assertIncludes(runner, VISUAL_SNAPSHOTS_BASELINE_SCHEMA, 'Visual Snapshots runner declares baseline schema');
  context.assertIncludes(runner, 'optional-local-pixel-diff', 'Visual Snapshots runner exposes optional pixel diff mode');
  context.assertIncludes(runnerIndex, "id: 'visual-snapshots'", 'XTend runner registers Visual Snapshots suite');
  context.assert(packageManifest.scripts['test:visual-snapshots'] === 'node scripts/run_xtend_tests.js visual-snapshots', 'Package exposes Visual Snapshots test script');
  context.assert(metadata && metadata.schema === VISUAL_SNAPSHOTS_SCHEMA, 'Package metadata exposes Visual Snapshots runner schema');
  context.assert(metadata && metadata.fixtureSchema === VISUAL_SNAPSHOTS_FIXTURE_SCHEMA, 'Package metadata exposes Visual Snapshots fixture schema');
  context.assert(metadata && metadata.reportSchema === VISUAL_SNAPSHOTS_REPORT_SCHEMA, 'Package metadata exposes Visual Snapshots report schema');
  context.assert(metadata && metadata.fixture === VISUAL_SNAPSHOTS_FIXTURE_PATH, 'Package metadata exposes Visual Snapshots fixture path');
  context.assert(metadata && metadata.baseline === VISUAL_SNAPSHOTS_BASELINE_PATH, 'Package metadata exposes Visual Snapshots baseline path');
  context.assert(metadata && metadata.localGate === VISUAL_SNAPSHOTS_LOCAL_GATE, 'Package metadata exposes Visual Snapshots local gate');
  context.assert(metadata && metadata.packageScript === VISUAL_SNAPSHOTS_PACKAGE_SCRIPT, 'Package metadata exposes Visual Snapshots package script');
  context.assert(metadata && metadata.domDiffMode === 'dom-structure-and-state-diff', 'Package metadata exposes Visual Snapshots DOM diff mode');
  context.assert(metadata && metadata.pixelDiffMode === 'optional-local-pixel-diff', 'Package metadata exposes Visual Snapshots pixel diff mode');
  context.assert(metadata && metadata.matrixCombinationCount === 360, 'Package metadata exposes Visual Snapshots combination count');
  context.assertIncludes(scaffoldConfig, 'visualSnapshots', 'Scaffold config exposes Visual Snapshots metadata');
  context.assertIncludes(scaffoldConfig, VISUAL_SNAPSHOTS_SCHEMA, 'Scaffold config exposes Visual Snapshots schema');

  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E12-11 is completed');
  context.assertIncludes(workpackage, VISUAL_SNAPSHOTS_SCHEMA, 'WP-E12-11 documents runner schema');
  context.assertIncludes(workpackage, VISUAL_SNAPSHOTS_LOCAL_GATE, 'WP-E12-11 documents local gate');
  context.assertIncludes(workpackage, '`WP-E12-12` startbar', 'WP-E12-11 hands off WP-E12-12');
  context.assertIncludes(backlog, '| `WP-E12-11` | P1 | completed | WS5 | Snapshot Fixture und lokaler Pixel-/DOM-Diff-Runner vorbereiten |', 'Backlog marks WP-E12-11 completed');
  context.assertIncludes(backlog, '| `WP-E12-12` | P1 | completed | WS6 | Enterprise Design System Token Productization vorbereiten |', 'Backlog marks WP-E12-12 completed');
  context.assertIncludes(backlog, 'Handoff nach WP-E12-11', 'Backlog contains WP-E12-11 handoff');
  context.assertIncludes(rcModel, '`WP-E12-11` Snapshot Fixture und lokaler Diff-Runner: abgeschlossen', 'RC model marks WP-E12-11 complete');
  context.assertIncludes(registry, VISUAL_SNAPSHOTS_RUNNER_PATH, 'Reference registry links Visual Snapshots runner');
  context.assertIncludes(registry, VISUAL_SNAPSHOTS_FIXTURE_PATH, 'Reference registry links Visual Snapshots fixture');
  context.assertIncludes(registry, VISUAL_SNAPSHOTS_BASELINE_PATH, 'Reference registry links Visual Snapshots baseline');
  context.assertIncludes(registry, VISUAL_SNAPSHOTS_SUITE_PATH, 'Reference registry links Visual Snapshots suite');
  context.assertIncludes(snapshotDocs, VISUAL_SNAPSHOTS_SCHEMA, 'Snapshot docs document runner schema');
  context.assertIncludes(snapshotDocs, VISUAL_SNAPSHOTS_LOCAL_GATE, 'Snapshot docs document runner gate');
  context.assertIncludes(browserReadme, VISUAL_SNAPSHOTS_LOCAL_GATE, 'Browser README documents Visual Snapshots gate');
  context.assertIncludes(testsReadme, VISUAL_SNAPSHOTS_LOCAL_GATE, 'Test README documents Visual Snapshots gate');

  return context.result({
    report: {
      schema: VISUAL_SNAPSHOTS_REPORT_SCHEMA,
      snapshotCount: report.snapshotCount,
      componentCount: report.componentCount,
      matrixCombinationCount: report.matrixCombinationCount,
      domDiffCount: report.domDiffCount,
      pixelDiffMode: report.pixelDiff.mode
    }
  });
}

function printVisualSnapshotsReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 12 Visual Snapshot local DOM diff runner erfolgreich.',
    failureTitle: 'Epic 12 Visual Snapshot local DOM diff runner fehlgeschlagen:'
  });
}

module.exports = {
  printVisualSnapshotsReport,
  runVisualSnapshotsSuite
};

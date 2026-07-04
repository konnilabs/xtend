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
  COMPONENT_SHELL_THEME_MATRIX_SCHEMA
} = require('./component-shell-theme-matrix-plan');
const {
  COMPONENT_REGRESSION_PRIORITY_SCHEMA
} = require('../../catalog/component-regression-priority');
const {
  VISUAL_SNAPSHOT_AUTOMATION_DOC_PATH,
  VISUAL_SNAPSHOT_AUTOMATION_ENTRY_SCHEMA,
  VISUAL_SNAPSHOT_AUTOMATION_LOCAL_GATE,
  VISUAL_SNAPSHOT_AUTOMATION_NEXT_WORKPACKAGE,
  VISUAL_SNAPSHOT_AUTOMATION_PACKAGE_SCRIPT,
  VISUAL_SNAPSHOT_AUTOMATION_PLAN_PATH,
  VISUAL_SNAPSHOT_AUTOMATION_REPORT_SCHEMA,
  VISUAL_SNAPSHOT_AUTOMATION_SCHEMA,
  VISUAL_SNAPSHOT_AUTOMATION_SUITE_PATH,
  VISUAL_SNAPSHOT_AUTOMATION_WORKPACKAGE,
  VISUAL_SNAPSHOT_AUTOMATION_WP_PATH,
  VISUAL_SNAPSHOT_BASELINE_ROOT,
  VISUAL_SNAPSHOT_DIFF_STRATEGY,
  VISUAL_SNAPSHOT_KERNEL_BOUNDARY,
  VISUAL_SNAPSHOT_OUTPUT_ROOT,
  VISUAL_SNAPSHOT_SCOPES,
  createVisualSnapshotAutomationGate,
  createVisualSnapshotAutomationPlan,
  validateVisualSnapshotAutomationPlan
} = require('./visual-snapshot-automation-plan');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function runVisualSnapshotAutomationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'visual-snapshot-automation',
    label: 'Epic 12 Visual Snapshot Automation Contract'
  });
  const plan = createVisualSnapshotAutomationPlan({ rootDir });
  const validation = validateVisualSnapshotAutomationPlan(plan);
  const gate = createVisualSnapshotAutomationGate({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.visualSnapshotAutomation;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md', rootDir);
  const rcModel = readText('development/XTend-Epic12-RC-Hardening-Modell.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const contractDoc = readText(VISUAL_SNAPSHOT_AUTOMATION_DOC_PATH, rootDir);
  const workpackage = readText(VISUAL_SNAPSHOT_AUTOMATION_WP_PATH, rootDir);
  const browserReadme = readText('tests/browser/README.md', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const developerDocs = readText('docs/visual-browser-regression.md', rootDir);
  const snapshotDocs = readText('docs/visual-snapshot-automation.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const planSyntax = syntaxCheckFile(VISUAL_SNAPSHOT_AUTOMATION_PLAN_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(VISUAL_SNAPSHOT_AUTOMATION_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, VISUAL_SNAPSHOT_AUTOMATION_PLAN_PATH, rootDir, 'Visual Snapshot Automation plan exists');
  assertFileExists(context, VISUAL_SNAPSHOT_AUTOMATION_SUITE_PATH, rootDir, 'Visual Snapshot Automation suite exists');
  assertFileExists(context, VISUAL_SNAPSHOT_AUTOMATION_DOC_PATH, rootDir, 'Visual Snapshot Automation contract document exists');
  assertFileExists(context, VISUAL_SNAPSHOT_AUTOMATION_WP_PATH, rootDir, 'WP-E12-10 workpackage document exists');
  assertFileExists(context, 'docs/visual-snapshot-automation.md', rootDir, 'Visual Snapshot Automation developer docs exist');
  context.assert(planSyntax.ok, `Visual Snapshot Automation plan syntax passes${planSyntax.ok ? '' : ` (${planSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Visual Snapshot Automation suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(plan.schema === VISUAL_SNAPSHOT_AUTOMATION_SCHEMA, 'Snapshot plan declares schema');
  context.assert(plan.entrySchema === VISUAL_SNAPSHOT_AUTOMATION_ENTRY_SCHEMA, 'Snapshot plan declares entry schema');
  context.assert(plan.reportSchema === VISUAL_SNAPSHOT_AUTOMATION_REPORT_SCHEMA, 'Snapshot plan declares report schema');
  context.assert(plan.status === 'accepted-snapshot-contract', 'Snapshot plan is accepted');
  context.assert(plan.workpackage === VISUAL_SNAPSHOT_AUTOMATION_WORKPACKAGE, 'Snapshot plan belongs to WP-E12-10');
  context.assert(plan.handoff.nextWorkpackage === VISUAL_SNAPSHOT_AUTOMATION_NEXT_WORKPACKAGE, 'Snapshot plan hands off to WP-E12-11');
  context.assert(plan.localOnly === true, 'Snapshot plan is local-only');
  context.assert(plan.externalNetworkAllowed === false, 'Snapshot plan rejects external network');
  context.assert(plan.runnerImplementation === 'deferred-to-WP-E12-11', 'Snapshot runner is deferred to WP-E12-11');
  context.assert(plan.renderMode === 'shell-first', 'Snapshot plan keeps shell-first render mode');
  context.assert(plan.kernelBoundary === VISUAL_SNAPSHOT_KERNEL_BOUNDARY, 'Snapshot plan keeps RMT kernel boundary');
  context.assert(plan.sourceThemeMatrix.schema === COMPONENT_SHELL_THEME_MATRIX_SCHEMA, 'Snapshot plan derives from Theme Matrix');
  context.assert(plan.sourceRegressionPriority.schema === COMPONENT_REGRESSION_PRIORITY_SCHEMA, 'Snapshot plan links regression priority');
  context.assert(plan.coverage.entryCount === 5, 'Snapshot plan covers five family entries');
  context.assert(plan.coverage.familyCount === 5, 'Snapshot plan covers five UX families');
  context.assert(plan.coverage.componentCount === 18, 'Snapshot plan covers eighteen representative components');
  context.assert(plan.coverage.snapshotScopeCount === VISUAL_SNAPSHOT_SCOPES.length, 'Snapshot plan covers all snapshot scopes');
  context.assert(plan.coverage.matrixCombinationCount === 360, 'Snapshot plan preserves 360 Theme Matrix combinations');
  context.assert(validation.schema === VISUAL_SNAPSHOT_AUTOMATION_REPORT_SCHEMA, 'Snapshot validator emits report schema');
  context.assert(validation.ok === true, 'Snapshot validator accepts generated plan');
  context.assert(gate.ok === true, 'Snapshot gate passes');
  context.assert(plan.localGate === VISUAL_SNAPSHOT_AUTOMATION_LOCAL_GATE, 'Snapshot plan exposes local gate');
  context.assert(plan.packageScript === VISUAL_SNAPSHOT_AUTOMATION_PACKAGE_SCRIPT, 'Snapshot plan exposes package script');

  assertIncludesAll(context, plan.themeVariants, ['light', 'dark', 'high-contrast', 'forced-colors'], 'Snapshot theme variants');
  assertIncludesAll(context, plan.motionModes, ['default-motion', 'reduced-motion'], 'Snapshot motion modes');
  assertIncludesAll(context, plan.densities, ['comfortable', 'compact', 'dense'], 'Snapshot densities');
  assertIncludesAll(context, plan.viewports, ['desktop-1280', 'tablet-768', 'mobile-390'], 'Snapshot viewports');
  assertIncludesAll(context, plan.snapshotScopes, VISUAL_SNAPSHOT_SCOPES, 'Snapshot scopes');

  context.assert(plan.diffStrategy.schema === VISUAL_SNAPSHOT_DIFF_STRATEGY.schema, 'Snapshot plan declares diff strategy schema');
  context.assert(plan.diffStrategy.mode === 'dom-first-pixel-ready', 'Snapshot plan uses DOM-first pixel-ready strategy');
  context.assert(plan.diffStrategy.primary === 'dom-structure-and-state-diff', 'Snapshot plan keeps DOM diff as primary strategy');
  context.assert(plan.diffStrategy.secondary === 'pixel-diff-deferred-to-wp-e12-11', 'Snapshot plan defers pixel diff to WP-E12-11');
  context.assert(plan.diffStrategy.tolerances.domStructuralChanges === 0, 'Snapshot plan has zero DOM structural tolerance');
  context.assert(plan.diffStrategy.tolerances.cssTokenChanges === 0, 'Snapshot plan has zero CSS token tolerance');
  context.assert(plan.diffStrategy.tolerances.maxPixelMismatchRatio === 0.01, 'Snapshot plan caps pixel mismatch ratio');
  context.assert(plan.diffStrategy.tolerances.layoutShiftPx === 1, 'Snapshot plan caps layout shift tolerance');
  assertIncludesAll(context, plan.diffStrategy.stabilization, ['custom-elements-defined', 'document-fonts-ready', 'xtend-loader-complete', 'animation-frame-flushed'], 'Snapshot stabilization steps');
  context.assert(plan.artifactPolicy.outputRoot === VISUAL_SNAPSHOT_OUTPUT_ROOT, 'Snapshot plan uses local output root');
  context.assert(plan.artifactPolicy.baselineRoot === VISUAL_SNAPSHOT_BASELINE_ROOT, 'Snapshot plan defines baseline root');
  context.assert(plan.artifactPolicy.baselineCommitPolicy === 'no-binary-baselines-in-WP-E12-10', 'Snapshot plan avoids binary baselines in WP-E12-10');
  context.assert(plan.artifactPolicy.ciUpload === 'deferred-to-WP-E12-11', 'Snapshot plan defers CI upload policy to WP-E12-11');

  plan.entries.forEach((entry) => {
    context.assert(entry.schema === VISUAL_SNAPSHOT_AUTOMATION_ENTRY_SCHEMA, `${entry.family}: snapshot entry declares schema`);
    context.assert(entry.sourceSchema === 'xtend.epic11.component-shell-theme-matrix-entry.v1', `${entry.family}: snapshot entry links Theme Matrix entry`);
    context.assert(entry.components.length >= 2, `${entry.family}: snapshot entry covers multiple components`);
    context.assert(entry.visualStates.length >= 3, `${entry.family}: snapshot entry preserves visual states`);
    context.assert(entry.snapshotScopes.length >= 4, `${entry.family}: snapshot entry exposes scoped assertions`);
    context.assert(entry.capturePolicy.mode === 'deterministic-local-fixture', `${entry.family}: snapshot entry uses deterministic local fixture`);
    context.assert(entry.capturePolicy.shellFirst === true, `${entry.family}: snapshot entry renders shell-first`);
    context.assert(entry.artifacts.reportPath.startsWith(VISUAL_SNAPSHOT_OUTPUT_ROOT), `${entry.family}: snapshot report path uses output root`);
    context.assert(entry.artifacts.baselinePath.startsWith(VISUAL_SNAPSHOT_BASELINE_ROOT), `${entry.family}: snapshot baseline path uses baseline root`);
  });

  context.assertIncludes(runner, "id: 'visual-snapshot-automation'", 'XTend runner registers Visual Snapshot Automation suite');
  context.assert(packageManifest.scripts['test:visual-snapshot-automation'] === 'node scripts/run_xtend_tests.js visual-snapshot-automation', 'Package exposes Visual Snapshot Automation test script');
  context.assert(metadata && metadata.schema === VISUAL_SNAPSHOT_AUTOMATION_SCHEMA, 'Package metadata exposes Snapshot schema');
  context.assert(metadata && metadata.entrySchema === VISUAL_SNAPSHOT_AUTOMATION_ENTRY_SCHEMA, 'Package metadata exposes Snapshot entry schema');
  context.assert(metadata && metadata.reportSchema === VISUAL_SNAPSHOT_AUTOMATION_REPORT_SCHEMA, 'Package metadata exposes Snapshot report schema');
  context.assert(metadata && metadata.module === VISUAL_SNAPSHOT_AUTOMATION_PLAN_PATH, 'Package metadata exposes Snapshot plan module');
  context.assert(metadata && metadata.suite === VISUAL_SNAPSHOT_AUTOMATION_SUITE_PATH, 'Package metadata exposes Snapshot suite');
  context.assert(metadata && metadata.localGate === VISUAL_SNAPSHOT_AUTOMATION_LOCAL_GATE, 'Package metadata exposes Snapshot local gate');
  context.assert(metadata && metadata.runnerImplementation === 'deferred-to-WP-E12-11', 'Package metadata defers Snapshot runner');
  context.assert(metadata && metadata.localOnly === true, 'Package metadata keeps Snapshot local-only');
  context.assert(metadata && metadata.matrixCombinationCount === 360, 'Package metadata exposes Snapshot combination count');
  context.assert(metadata && Array.isArray(metadata.snapshotScopes) && metadata.snapshotScopes.length === VISUAL_SNAPSHOT_SCOPES.length, 'Package metadata exposes Snapshot scopes');
  context.assert(metadata && metadata.kernelBoundary === VISUAL_SNAPSHOT_KERNEL_BOUNDARY, 'Package metadata keeps Snapshot kernel boundary');
  context.assertIncludes(scaffoldConfig, 'visualSnapshotAutomation', 'Scaffold config exposes Visual Snapshot metadata');
  context.assertIncludes(scaffoldConfig, VISUAL_SNAPSHOT_AUTOMATION_SCHEMA, 'Scaffold config exposes Visual Snapshot schema');

  context.assertIncludes(contractDoc, VISUAL_SNAPSHOT_AUTOMATION_SCHEMA, 'Snapshot contract document declares schema');
  context.assertIncludes(contractDoc, VISUAL_SNAPSHOT_AUTOMATION_LOCAL_GATE, 'Snapshot contract document declares local gate');
  context.assertIncludes(contractDoc, 'dom-first-pixel-ready', 'Snapshot contract document describes diff strategy');
  context.assertIncludes(contractDoc, 'no-binary-baselines-in-WP-E12-10', 'Snapshot contract document keeps binary baseline boundary');
  context.assertIncludes(contractDoc, 'WP-E12-11', 'Snapshot contract document hands off runner');
  context.assertIncludes(contractDoc, VISUAL_SNAPSHOT_KERNEL_BOUNDARY, 'Snapshot contract document keeps kernel boundary');
  assertIncludesAll(context, contractDoc, ['light', 'dark', 'high-contrast', 'forced-colors', 'reduced-motion', 'comfortable', 'compact', 'dense', 'desktop-1280', 'tablet-768', 'mobile-390'], 'Snapshot contract document matrix');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E12-10 is completed');
  context.assertIncludes(workpackage, VISUAL_SNAPSHOT_AUTOMATION_SCHEMA, 'WP-E12-10 documents accepted contract');
  context.assertIncludes(workpackage, '`WP-E12-11` startbar', 'WP-E12-10 hands off WP-E12-11');
  context.assertIncludes(workpackage, VISUAL_SNAPSHOT_AUTOMATION_LOCAL_GATE, 'WP-E12-10 documents local gate');
  context.assertIncludes(backlog, '| `WP-E12-10` | P1 | completed | WS5 | Visual Snapshot Automation Contract definieren |', 'Backlog marks WP-E12-10 completed');
  context.assertIncludes(backlog, '| `WP-E12-11` | P1 | completed | WS5 | Snapshot Fixture und lokaler Pixel-/DOM-Diff-Runner vorbereiten |', 'Backlog marks WP-E12-11 completed');
  context.assertIncludes(backlog, 'Handoff nach WP-E12-10', 'Backlog contains WP-E12-10 handoff');
  context.assertIncludes(rcModel, '`WP-E12-10` Visual Snapshot Automation Contract: abgeschlossen', 'RC model marks Snapshot Contract complete');
  context.assertIncludes(rcModel, '`WP-E12-11` Snapshot Fixture und lokaler Diff-Runner: abgeschlossen', 'RC model marks WP-E12-11 complete');
  context.assertIncludes(registry, VISUAL_SNAPSHOT_AUTOMATION_DOC_PATH, 'Reference registry links Snapshot contract');
  context.assertIncludes(registry, VISUAL_SNAPSHOT_AUTOMATION_PLAN_PATH, 'Reference registry links Snapshot plan');
  context.assertIncludes(registry, VISUAL_SNAPSHOT_AUTOMATION_SUITE_PATH, 'Reference registry links Snapshot suite');
  context.assertIncludes(browserReadme, VISUAL_SNAPSHOT_AUTOMATION_SCHEMA, 'Browser README documents Snapshot schema');
  context.assertIncludes(browserReadme, VISUAL_SNAPSHOT_AUTOMATION_LOCAL_GATE, 'Browser README documents Snapshot local gate');
  context.assertIncludes(testsReadme, VISUAL_SNAPSHOT_AUTOMATION_LOCAL_GATE, 'Test README documents Snapshot gate');
  context.assertIncludes(developerDocs, VISUAL_SNAPSHOT_AUTOMATION_SCHEMA, 'Visual browser docs document Snapshot contract');
  context.assertIncludes(snapshotDocs, VISUAL_SNAPSHOT_AUTOMATION_SCHEMA, 'Snapshot docs declare Snapshot schema');
  context.assertIncludes(snapshotDocs, VISUAL_SNAPSHOT_AUTOMATION_LOCAL_GATE, 'Snapshot docs document local gate');
  context.assertIncludes(snapshotDocs, 'WP-E12-11', 'Snapshot docs document runner handoff');

  return context.result({
    report: {
      schema: VISUAL_SNAPSHOT_AUTOMATION_REPORT_SCHEMA,
      entryCount: plan.coverage.entryCount,
      componentCount: plan.coverage.componentCount,
      matrixCombinationCount: plan.coverage.matrixCombinationCount,
      runnerImplementation: plan.runnerImplementation
    }
  });
}

function printVisualSnapshotAutomationReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 12 Visual Snapshot Automation Contract erfolgreich.',
    failureTitle: 'Epic 12 Visual Snapshot Automation Contract fehlgeschlagen:'
  });
}

module.exports = {
  printVisualSnapshotAutomationReport,
  runVisualSnapshotAutomationSuite
};

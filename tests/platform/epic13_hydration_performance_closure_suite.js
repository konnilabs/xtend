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
  PERFORMANCE_BUDGET_MS_BY_MEASURE
} = require('../../fabric/xtend-fabric');
const {
  createPerformanceRegressionReport
} = require('../performance/performance_regression_suite');
const {
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_CONTRACT,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_DOCS,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_LOCAL_GATE,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_MODULE,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_PACKAGE_SCRIPT,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STATUS,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STEERING,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SUITE,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_TARGET,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE,
  EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE_DOC,
  EPIC13_HYDRATION_PERFORMANCE_DECISION_SCHEMA,
  HYDRATION_BASELINE,
  HYDRATION_MEASURE,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_SOURCE_GATES,
  createEpic13HydrationPerformanceClosurePlan,
  createEpic13HydrationPerformanceClosureReport,
  validateEpic13HydrationPerformanceClosurePlan
} = require('../../catalog/epic13-hydration-performance-closure');

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

function runEpic13HydrationPerformanceClosureSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-hydration-performance-closure',
    label: 'Epic 13 Hydration Performance Closure'
  });
  const baseline = readJson(HYDRATION_BASELINE, rootDir);
  const performanceReport = createPerformanceRegressionReport({ baseline, baselinePath: HYDRATION_BASELINE });
  const plan = createEpic13HydrationPerformanceClosurePlan({ rootDir });
  const validation = validateEpic13HydrationPerformanceClosurePlan(plan);
  const report = createEpic13HydrationPerformanceClosureReport({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13HydrationPerformanceClosure;
  const rc1Metadata = packageManifest.xtend && packageManifest.xtend.epic13Rc1Readiness;
  const ownerMetadata = packageManifest.xtend && packageManifest.xtend.epic13ReleaseOwnerAcceptance;
  const networkMetadata = packageManifest.xtend && packageManifest.xtend.epic13ConditionalNetworkEvidence;
  const packageLockMetadata = packageManifest.xtend && packageManifest.xtend.epic13PackageExportLock;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const steering = readText(EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STEERING, rootDir);
  const contractDoc = readText(EPIC13_HYDRATION_PERFORMANCE_CLOSURE_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_HYDRATION_PERFORMANCE_CLOSURE_DOCS, rootDir);
  const knownResidualDocs = readText('docs/known-residual-triage.md', rootDir);
  const performanceDocs = readText('docs/performance-regression.md', rootDir);
  const performancePlan = readText('development/XTend-Performance-Regression-Gate.md', rootDir);
  const rc1Docs = readText('docs/rc1-readiness.md', rootDir);
  const ownerDocs = readText('docs/release-owner-acceptance.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const enterpriseAdoption = readText('docs/enterprise-adoption.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const readme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_HYDRATION_PERFORMANCE_CLOSURE_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SUITE, { rootDir, extension: '.js' });
  const hydrationEntry = baseline.entries.find((entry) => entry.name === HYDRATION_MEASURE);
  const hydrationCheck = performanceReport.checks.find((entry) => entry.name === HYDRATION_MEASURE);
  const decision = plan.decisions.find((entry) => entry.scope === HYDRATION_MEASURE);

  [
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_MODULE,
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SUITE,
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STEERING,
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_CONTRACT,
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE_DOC,
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required hydration closure doc`);
  });

  context.assert(moduleSyntax.ok, `Epic 13 Hydration Performance Closure module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 13 Hydration Performance Closure suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA, 'Hydration performance closure exposes stable schema');
  context.assert(plan.decisionSchema === EPIC13_HYDRATION_PERFORMANCE_DECISION_SCHEMA, 'Hydration performance closure exposes decision schema');
  context.assert(plan.reportSchema === EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA, 'Hydration performance closure exposes report schema');
  context.assert(plan.workpackage === EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE, 'Hydration performance closure belongs to WP-E13-06');
  context.assert(plan.status === EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STATUS, 'Hydration performance closure is accepted');
  context.assert(plan.targetReadiness === EPIC13_HYDRATION_PERFORMANCE_CLOSURE_TARGET, 'Hydration performance closure target is closed');
  context.assert(plan.sourceValidationOk === true && plan.sourceReportOk === true, 'Hydration closure consumes known residual triage');
  context.assert(plan.sourceWatchpoints.includes(HYDRATION_MEASURE), 'Hydration closure consumes hydration source watchpoint');
  context.assert(plan.nextWorkpackage === 'WP-E13-13', 'Hydration closure hands off to WP-E13-09 after visual owner artifact normalization');
  context.assert(plan.nextDecision === 'rc1-gate-matrix-ci-handoff', 'Hydration closure hands off to RMT-first production readiness bundling');
  context.assert(plan.publishBoundary === PUBLISH_BOUNDARY, 'Hydration closure keeps publish boundary');
  context.assert(plan.publishAllowed === false, 'Hydration closure keeps publish blocked');
  context.assert(validation.schema === EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA, 'Hydration closure validator emits report schema');
  context.assert(validation.ok === true, 'Hydration closure plan validates');
  context.assert(report.ok === true, 'Hydration closure report validates');
  context.assert(report.closedWatchpoints.length === 1 && report.closedWatchpoints[0] === HYDRATION_MEASURE, 'Hydration closure closes the hydration watchpoint');
  context.assert(report.remainingWatchpoints.length === 0, 'Hydration closure leaves no remaining watchpoints');
  context.assert(report.publishBlockingResiduals.length === 0, 'Hydration closure leaves no publish-blocking residuals');
  context.assert(report.ownerDecisionRequiredResiduals.length === 0, 'Hydration closure requires no owner decision');
  assertIncludesAll(context, plan.sourceGates, REQUIRED_SOURCE_GATES, 'Source gates');

  context.assert(hydrationEntry && hydrationEntry.duration === 31, 'Baseline records 31ms hydration sample');
  context.assert(hydrationEntry && hydrationEntry.duration <= PERFORMANCE_BUDGET_MS_BY_MEASURE[HYDRATION_MEASURE], 'Baseline hydration sample stays inside unchanged budget');
  context.assert(hydrationCheck && hydrationCheck.status === 'pass', 'Performance report marks hydration as pass');
  context.assert(performanceReport.ok === true, 'Performance report remains hard-gate green');
  context.assert(performanceReport.warnCount === 0, 'Performance report has no warnings after hydration closure');
  context.assert(performanceReport.failCount === 0, 'Performance report has no failures after hydration closure');
  context.assert(performanceReport.phaseSummary.hydrate.warnCount === 0, 'Hydration phase has no warnings after closure');
  context.assert(decision && decision.currentStatus === 'pass', 'Hydration decision records pass status');
  context.assert(decision && decision.currentDurationMs === 31, 'Hydration decision records RC1 duration');
  context.assert(decision && decision.budgetMs === 32, 'Hydration decision preserves 32ms budget');
  context.assert(decision && decision.budgetAction === 'kept-existing-budget', 'Hydration decision does not lower quality by changing budget');
  context.assert(decision && decision.closureMode === 'owner-free-closure', 'Hydration decision closes owner-free');
  context.assert(decision && decision.ownerDecisionRequired === false && decision.publishBlocking === false, 'Hydration decision removes owner residual and publish blocker');

  context.assert(packageManifest.private === false, 'Package is public-ready for hydration closure');
  context.assert((packageManifest.exports['./catalog/epic13-hydration-performance-closure'] === './catalog/epic13-hydration-performance-closure.js' || (packageManifest.exports['./catalog/epic13-hydration-performance-closure'] && packageManifest.exports['./catalog/epic13-hydration-performance-closure'].default === './catalog/epic13-hydration-performance-closure.js')), 'Package exports hydration closure module');
  context.assert(packageManifest.scripts['test:epic13-hydration-performance-closure'] === 'node scripts/run_xtend_tests.js epic13-hydration-performance-closure', 'Package exposes hydration closure script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC13_HYDRATION_PERFORMANCE_CLOSURE_PACKAGE_SCRIPT), 'Package release gates include hydration closure script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_HYDRATION_PERFORMANCE_CLOSURE_PACKAGE_SCRIPT), 'Release checklist metadata includes hydration closure script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_HYDRATION_PERFORMANCE_CLOSURE_CONTRACT), 'Artifact checklist includes hydration closure contract');
  context.assert(metadata && metadata.schema === EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA, 'Package metadata exposes hydration closure schema');
  context.assert(metadata && metadata.workpackage === EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE, 'Package metadata exposes WP-E13-06');
  context.assert(metadata && metadata.nextWorkpackage === 'WP-E13-13', 'Package metadata exposes next workpackage');
  context.assert(metadata && metadata.closedWatchpoints.includes(HYDRATION_MEASURE), 'Package metadata exposes closed hydration watchpoint');
  context.assert(metadata && metadata.remainingWatchpoints.length === 0, 'Package metadata exposes no remaining hydration watchpoints');
  context.assert(rc1Metadata && rc1Metadata.nextWorkpackage === 'WP-E13-13', 'RC1 readiness metadata now hands off to WP-E13-09');
  context.assert(ownerMetadata && ownerMetadata.nextWorkpackage === 'WP-E13-13', 'Owner acceptance metadata now hands off to WP-E13-09');
  context.assert(networkMetadata && networkMetadata.nextWorkpackage === 'WP-E13-13', 'Network evidence metadata now hands off to WP-E13-09');
  context.assert(packageLockMetadata && packageLockMetadata.nextWorkpackage === 'WP-E13-13', 'Package export lock metadata now hands off to WP-E13-09');
  context.assertIncludes(scaffoldConfig, 'epic13HydrationPerformanceClosure', 'Scaffold config exposes hydration closure metadata');
  context.assertIncludes(scaffoldConfig, EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA, 'Scaffold config declares hydration closure schema');
  context.assertIncludes(scaffoldConfig, EPIC13_HYDRATION_PERFORMANCE_CLOSURE_LOCAL_GATE, 'Scaffold config references hydration closure gate');
  context.assertIncludes(scaffoldConfig, 'nextWorkpackage: "WP-E13-13"', 'Scaffold config advances Epic 13 handoff to WP-E13-09');
  context.assertIncludes(runner, "id: 'epic13-hydration-performance-closure'", 'Runner registers hydration closure suite');

  assertTextIncludesAll(context, steering, [
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA,
    '| `WP-E13-06` | P0 | completed | WS2 | Hydration Performance Warning schliessen oder RC1 Owner-Entscheid bauen |',
    '| `WP-E13-07` | P1 | completed | WS3 | PROD-nahe Browser-, Local-Server- und CSP-Smokes vorbereiten |',
    '| `WP-E13-08` | P1 | completed | WS3 | Visual Screenshot/Pixels als RC1-Artefakt normalisieren |',
    '| `WP-E13-09` | P1 | completed | WS4 | RMT-first App Production Readiness Gate buendeln |',
    'Handoff nach WP-E13-06',
    HYDRATION_MEASURE,
    'owner-free-closure'
  ], 'Epic 13 steering document');
  assertTextIncludesAll(context, contractDoc, [
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA,
    EPIC13_HYDRATION_PERFORMANCE_DECISION_SCHEMA,
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_LOCAL_GATE,
    '31ms / 32ms',
    'kept-existing-budget',
    'owner-free-closure'
  ], 'Hydration closure contract doc');
  assertTextIncludesAll(context, workpackage, [
    'xtend.epic13.wp06.hydration-performance-closure.v1',
    'Status: `completed`',
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA,
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_LOCAL_GATE,
    'WP-E13-09'
  ], 'WP-E13-06 workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA,
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_LOCAL_GATE,
    HYDRATION_MEASURE,
    'warnCount === 0',
    './prod-browser-csp-smokes.md',
    PUBLISH_BOUNDARY
  ], 'Hydration closure docs');
  assertTextIncludesAll(context, knownResidualDocs, [
    './hydration-performance-closure.md',
    'owner-frei geschlossen'
  ], 'Known residual docs closure handoff');
  assertTextIncludesAll(context, performanceDocs, [
    'RC1',
    'warnCount === 0',
    './hydration-performance-closure.md'
  ], 'Performance regression docs closure status');
  assertTextIncludesAll(context, performancePlan, [
    'WP-E13-06',
    '31ms',
    'warnCount === 0'
  ], 'Performance regression plan closure status');
  assertTextIncludesAll(context, rc1Docs, [
    'Hydration Performance Closure',
    'WP-E13-09',
    './hydration-performance-closure.md'
  ], 'RC1 readiness docs handoff');
  assertTextIncludesAll(context, ownerDocs, [
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA,
    'known-residual-renewal',
    'WP-E13-09',
    './hydration-performance-closure.md'
  ], 'Owner acceptance docs handoff');
  assertTextIncludesAll(context, registry, [
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_MODULE,
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_CONTRACT,
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_DOCS,
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SUITE,
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_LOCAL_GATE
  ], 'Reference registry');
  assertTextIncludesAll(context, releaseChecklist, [
    'npm run test:epic13-hydration-performance-closure',
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_CONTRACT,
    '.xtend-test-results/xtend-hydration-performance-closure-report.json'
  ], 'Release checklist');
  assertTextIncludesAll(context, ciMatrix, [
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_LOCAL_GATE,
    'Hydration Performance Closure'
  ], 'CI gate matrix');
  assertTextIncludesAll(context, enterpriseAdoption, [
    EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA,
    './hydration-performance-closure.md',
    HYDRATION_MEASURE
  ], 'Enterprise adoption docs');
  context.assertIncludes(docsReadme, './hydration-performance-closure.md', 'Docs README links hydration closure');
  context.assertIncludes(docsMenu, 'hydration-performance-closure', 'Docs menu exposes hydration closure');
  context.assertIncludes(testsReadme, EPIC13_HYDRATION_PERFORMANCE_CLOSURE_LOCAL_GATE, 'Tests README documents hydration closure gate');
  context.assertIncludes(readme, 'xtend.epic13HydrationPerformanceClosure', 'Root README documents hydration closure metadata');
  context.assertIncludes(changelog, EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA, 'Changelog records hydration closure contract');

  return context.result({
    report: {
      schema: EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA,
      decisionCount: report.decisionCount,
      closedWatchpoints: report.closedWatchpoints,
      remainingWatchpoints: report.remainingWatchpoints,
      publishBlockingResiduals: report.publishBlockingResiduals,
      publishAllowed: report.publishAllowed,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13HydrationPerformanceClosureReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 13 Hydration Performance Closure erfolgreich.',
    failureTitle: 'Epic 13 Hydration Performance Closure fehlgeschlagen:'
  });
}

module.exports = {
  printEpic13HydrationPerformanceClosureReport,
  runEpic13HydrationPerformanceClosureSuite
};

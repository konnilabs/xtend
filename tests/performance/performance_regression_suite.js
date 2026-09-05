const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  CONTRACTS,
  PERFORMANCE_BUDGET_MS_BY_MEASURE,
  PERFORMANCE_MEASURE_PHASES,
  createXtendFabric
} = require('../../fabric/xtend-fabric');

const PERFORMANCE_REGRESSION_GATE_CONTRACT = 'xtend.performance.regression-gate.v1';
const PERFORMANCE_REGRESSION_BASELINE_CONTRACT = 'xtend.performance.regression-baseline.v1';
const PERFORMANCE_REGRESSION_REPORT_SCHEMA = 'xtend.performance.regression-report.v1';
const DEFAULT_BASELINE_PATH = 'tests/performance/baselines/local-performance-baseline.json';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toRoundedNumber(value) {
  return Number(toNumber(value).toFixed(2));
}

function classifyRegressionStatus(durationMs, budgetMs, options = {}) {
  const normalizedDuration = toNumber(durationMs);
  const normalizedBudget = toNumber(budgetMs);
  const warnMultiplier = toNumber(options.warnMultiplier, 1);
  const failMultiplier = toNumber(options.failMultiplier, 1.5);

  if (normalizedBudget <= 0) return 'pass';
  if (normalizedDuration <= normalizedBudget * warnMultiplier) return 'pass';
  if (normalizedDuration <= normalizedBudget * failMultiplier) return 'warn';
  return 'fail';
}

function normalizeMeasurement(measurement, options = {}) {
  const budgetMs = toNumber(measurement.budgetMs);
  const durationMs = toNumber(measurement.durationMs);
  const status = classifyRegressionStatus(durationMs, budgetMs, options);
  return {
    schema: CONTRACTS.performanceMeasurement,
    id: measurement.id,
    name: measurement.name || measurement.entryName,
    entryName: measurement.entryName || measurement.name,
    phase: measurement.phase || PERFORMANCE_MEASURE_PHASES[measurement.name] || 'runtime',
    profile: measurement.profile || 'runtime',
    sampleKind: measurement.sampleKind || options.sampleKind || 'local',
    durationMs: toRoundedNumber(durationMs),
    budgetMs,
    status,
    budgetDeltaMs: toRoundedNumber(durationMs - budgetMs),
    failThresholdMs: toRoundedNumber(budgetMs * toNumber(options.failMultiplier, 1.5)),
    metadata: measurement.metadata || {}
  };
}

function summarizeByPhase(checks) {
  return checks.reduce((summary, check) => {
    const phase = check.phase || 'runtime';
    if (!summary[phase]) {
      summary[phase] = {
        schema: CONTRACTS.performanceMeasurement,
        phase,
        measurementCount: 0,
        passCount: 0,
        warnCount: 0,
        failCount: 0,
        durationMs: 0,
        maxDurationMs: 0,
        names: []
      };
    }

    const phaseSummary = summary[phase];
    phaseSummary.measurementCount += 1;
    phaseSummary.durationMs = toRoundedNumber(phaseSummary.durationMs + check.durationMs);
    phaseSummary.maxDurationMs = Math.max(phaseSummary.maxDurationMs, check.durationMs);
    if (check.status === 'pass') phaseSummary.passCount += 1;
    if (check.status === 'warn') phaseSummary.warnCount += 1;
    if (check.status === 'fail') phaseSummary.failCount += 1;
    if (check.name && !phaseSummary.names.includes(check.name)) {
      phaseSummary.names.push(check.name);
    }
    return summary;
  }, {});
}

function createPerformanceSnapshotFromBaseline(baseline = {}) {
  const fabric = createXtendFabric({
    idPrefix: 'performance.regression',
    performance: null
  });
  return fabric.createTelemetrySnapshot({
    id: `${baseline.name || 'xtend-performance-baseline'}.snapshot`,
    performanceEntries: Array.isArray(baseline.entries) ? baseline.entries : [],
    performanceEntryLimit: Number.isInteger(baseline.performanceEntryLimit) ? baseline.performanceEntryLimit : 100,
    performanceSampleKind: baseline.sampleKind || 'local'
  });
}

function createPerformanceRegressionReport(options = {}) {
  const baseline = options.baseline || {};
  const snapshot = options.snapshot || createPerformanceSnapshotFromBaseline(baseline);
  const measurements = snapshot.performance && Array.isArray(snapshot.performance.measurements)
    ? snapshot.performance.measurements
    : [];
  const checks = measurements.map((measurement) => normalizeMeasurement(measurement, baseline));
  const warnings = checks.filter((check) => check.status === 'warn');
  const failures = checks.filter((check) => check.status === 'fail');
  const allowedFailCount = Number.isInteger(baseline.allowedFailCount) ? baseline.allowedFailCount : 0;

  return {
    schema: PERFORMANCE_REGRESSION_REPORT_SCHEMA,
    contract: PERFORMANCE_REGRESSION_GATE_CONTRACT,
    ok: failures.length <= allowedFailCount,
    baseline: {
      schema: baseline.schema || PERFORMANCE_REGRESSION_BASELINE_CONTRACT,
      name: baseline.name || 'unknown',
      sampleKind: baseline.sampleKind || 'local',
      allowedWarningCount: Number.isInteger(baseline.allowedWarningCount) ? baseline.allowedWarningCount : null,
      allowedFailCount,
      warnMultiplier: toNumber(baseline.warnMultiplier, 1),
      failMultiplier: toNumber(baseline.failMultiplier, 1.5)
    },
    measurementSchema: CONTRACTS.performanceMeasurement,
    measurementCount: checks.length,
    passCount: checks.filter((check) => check.status === 'pass').length,
    warnCount: warnings.length,
    failCount: failures.length,
    warnings,
    failures,
    checks,
    phaseSummary: summarizeByPhase(checks),
    source: {
      baselinePath: options.baselinePath || DEFAULT_BASELINE_PATH,
      snapshotId: snapshot.id
    }
  };
}

function createFailureFixtureReport(baseline) {
  return createPerformanceRegressionReport({
    baseline: {
      ...baseline,
      name: 'xtend-local-deterministic-failure-fixture',
      allowedWarningCount: 0,
      allowedFailCount: 0,
      entries: [
        {
          name: 'xtend.component.render',
          entryType: 'measure',
          startTime: 1,
          duration: PERFORMANCE_BUDGET_MS_BY_MEASURE['xtend.component.render'] * 2
        }
      ]
    },
    baselinePath: 'tests/performance/fixtures/failing-render-budget'
  });
}

async function runPerformanceRegressionSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const baselinePath = options.baselinePath || DEFAULT_BASELINE_PATH;
  const context = createSuiteContext({
    id: 'performance',
    label: 'XTend Performance regression gates'
  });
  const baseline = readJson(baselinePath, rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const suiteSource = readText('tests/performance/performance_regression_suite.js', rootDir);
  const runnerSource = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Enterprise-Reife.md', rootDir);
  const performanceDocs = readText('development/docs-evidence/root/performance-regression.md', rootDir);
  const regressionPlan = readText('development/XTend-Performance-Regression-Gate.md', rootDir);
  const suiteSyntax = syntaxCheckFile('tests/performance/performance_regression_suite.js', { rootDir, extension: '.js' });
  const report = createPerformanceRegressionReport({ baseline, baselinePath });
  const failureFixture = createFailureFixtureReport(baseline);

  context.assert(suiteSyntax.ok, `Performance regression suite syntax check passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assertIncludes(suiteSource, PERFORMANCE_REGRESSION_REPORT_SCHEMA, 'Suite declares Performance regression report schema');
  context.assertIncludes(suiteSource, 'createTelemetrySnapshot', 'Suite builds on Fabric telemetry snapshots');
  context.assertIncludes(suiteSource, 'classifyRegressionStatus', 'Suite owns deterministic budget classification');
  context.assert(runnerSource.hasSuite("performance-regression"), 'Runner exposes performance-regression suite id');
  context.assertIncludes(regressionPlan, PERFORMANCE_REGRESSION_GATE_CONTRACT, 'Regression plan declares gate contract');
  context.assertIncludes(performanceDocs, PERFORMANCE_REGRESSION_REPORT_SCHEMA, 'Docs declare JSON report schema');
  context.assert(baseline.schema === PERFORMANCE_REGRESSION_BASELINE_CONTRACT, 'Baseline declares performance regression baseline contract');
  context.assert(baseline.contract === PERFORMANCE_REGRESSION_GATE_CONTRACT, 'Baseline links performance regression gate contract');
  context.assert(Array.isArray(baseline.entries) && baseline.entries.length >= 10, 'Baseline contains deterministic local performance entries');
  context.assert(packageManifest.scripts['test:performance'] === 'node scripts/run_xtend_tests.js performance-regression', 'Package exposes performance regression test script');
  context.assert(packageManifest.xtend.performanceRegression.schema === PERFORMANCE_REGRESSION_GATE_CONTRACT, 'Package metadata exposes performance regression gate schema');
  context.assert(packageManifest.xtend.performanceRegression.baseline === baselinePath, 'Package metadata points to local baseline');
  context.assert(roadmap.includes('| `ER-WP-19` | P1 | completed | Phase 3 | EPIC 08 | Performance Regression Suite anlegen |'), 'Roadmap marks ER-WP-19 completed');
  context.assert(report.schema === PERFORMANCE_REGRESSION_REPORT_SCHEMA, 'Report uses stable performance regression report schema');
  context.assert(report.ok === true, 'Current local deterministic baseline passes hard regression gate');
  context.assert(report.baseline.allowedWarningCount === 0, 'Current baseline allows no RC1 warnings');
  context.assert(report.measurementSchema === CONTRACTS.performanceMeasurement, 'Report evaluates performance measurement contract records');
  context.assert(report.measurementCount >= baseline.entries.length, 'Report evaluates all baseline entries');
  context.assert(report.failCount === 0, 'Current baseline has no hard budget failures');
  context.assert(report.warnCount === 0, 'Current baseline has no warn-level overshoot for RC1');
  context.assert(!report.warnings.some((warning) => warning.name === 'xtend.component.hydrate'), 'Hydration warning is closed in the RC1 baseline');
  context.assert(report.phaseSummary.hydrate.warnCount === 0, 'Hydration phase summary exposes no warnings');
  context.assert(report.phaseSummary.hydrate.passCount >= 1, 'Hydration phase summary exposes a passing sample');
  context.assert(failureFixture.ok === false, 'Failure fixture proves budget violations fail the regression gate');
  context.assert(failureFixture.failures.some((failure) => (
    failure.name === 'xtend.component.render'
    && failure.status === 'fail'
    && failure.durationMs > failure.failThresholdMs
  )), 'Failure fixture exposes render budget violation details');

  return context.result({
    report,
    warnings: report.warnings,
    failureFixture
  });
}

function printPerformanceRegressionReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Performance Regression Gates erfolgreich.',
    failureTitle: 'XTend Performance Regression Gates fehlgeschlagen:'
  });

  if (result.report) {
    console.log(`\nPerformance report: ${result.report.schema}`);
    console.log(`- measurements: ${result.report.measurementCount}`);
    console.log(`- warnings: ${result.report.warnCount}`);
    console.log(`- failures: ${result.report.failCount}`);
    result.report.warnings.forEach((warning) => {
      console.log(`- warn: ${warning.name} ${warning.durationMs}ms / ${warning.budgetMs}ms`);
    });
  }
}

if (require.main === module) {
  runPerformanceRegressionSuite().then((result) => {
    printPerformanceRegressionReport(result);
    if (!result.ok) {
      process.exit(1);
    }
  }).catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  });
}

module.exports = {
  PERFORMANCE_REGRESSION_BASELINE_CONTRACT,
  PERFORMANCE_REGRESSION_GATE_CONTRACT,
  PERFORMANCE_REGRESSION_REPORT_SCHEMA,
  classifyRegressionStatus,
  createPerformanceRegressionReport,
  runPerformanceRegressionSuite,
  printPerformanceRegressionReport
};

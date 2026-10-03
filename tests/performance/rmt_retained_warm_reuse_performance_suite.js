const crypto = require('crypto');
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

const BASELINE_PATH = 'tests/performance/baselines/rmt-retained-warm-reuse-baseline.json';
const EVIDENCE_PATH = 'tests/performance/evidence/rmt-retained-warm-reuse-chromium-2026-08-30.json';
const HARNESS_PATH = 'tests/browser/fixtures/rmt-retained-warm-reuse-performance.html';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function runRmtRetainedWarmReusePerformanceSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-retained-warm-reuse-performance',
    label: 'RMT 0.8 retained warm reuse browser performance'
  });
  const baseline = readJson(BASELINE_PATH, rootDir);
  const evidence = readJson(EVIDENCE_PATH, rootDir);
  const harness = readText(HARNESS_PATH, rootDir);
  const runtimeSource = readText('xtendrmt/kernel/modules/rmt-performance-runtime.js', rootDir);

  context.assert(fs.existsSync(resolveRepoPath(HARNESS_PATH, rootDir)), 'browser performance harness exists');
  context.assert(baseline.schema === 'xtend.rmt.retained-warm-reuse-baseline.v1', 'baseline uses retained warm reuse schema');
  context.assert(evidence.schema === 'xtend.rmt.retained-warm-reuse-browser-lab.v1', 'evidence uses browser lab schema');
  context.assert(baseline.warmupCount === 5 && evidence.warmupCount === 5, 'lab uses five warmups');
  context.assert(baseline.measurementCount === 30 && evidence.measurementCount === 30, 'lab uses 30 measurements');
  context.assert(evidence.harness === HARNESS_PATH && evidence.harnessSha256 === sha256(harness), 'evidence is bound to the current browser harness');
  context.assert(evidence.engine === 'Chromium' && /^151\./u.test(evidence.engineVersion), 'evidence is engine and version bound');
  context.assert(evidence.retainedCount === 32, 'browser evidence reaches the 32-entry retained chunk LRU cap');
  context.assert(evidence.withinBudget === true, 'browser evidence records a successful budget run');

  ['durationMs', 'waitMs', 'totalMs', 'longTaskMs'].forEach((metric) => {
    context.assert(evidence.budgets[metric] === baseline.budgets[metric], `${metric} budget matches baseline`);
    context.assert(evidence.p95[metric] <= baseline.budgets[metric], `${metric} p95 stays within release budget`);
    context.assert(evidence.p95[metric] <= baseline.p95[metric] * (1 + baseline.maxRegressionPercent / 100), `${metric} p95 regresses by no more than five percent`);
  });

  context.assertIncludes(harness, 'const WARMUP_COUNT = 5;', 'harness declares five warmups');
  context.assertIncludes(harness, 'const MEASUREMENT_COUNT = 30;', 'harness declares 30 measurements');
  context.assertIncludes(harness, 'percentile95', 'harness computes p95');
  context.assertIncludes(harness, 'registerSurfaceChunkHandle', 'harness exercises retained chunk reuse');
  context.assertIncludes(runtimeSource, 'budgetId: \'retained_warm_reuse\'', 'performance runtime exposes retained warm reuse budget');
  context.assertIncludes(runtimeSource, 'maxDurationMs: 12', 'runtime locks the duration budget');
  context.assertIncludes(runtimeSource, 'maxWaitMs: 24', 'runtime locks the wait budget');
  context.assertIncludes(runtimeSource, 'maxTotalMs: 28', 'runtime locks the total budget');
  context.assertIncludes(runtimeSource, 'maxLongTaskMs: 24', 'runtime locks the long-task budget');

  return context.result({ baseline, evidence });
}

function printRmtRetainedWarmReusePerformanceReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT retained warm reuse Browser-Performance-Lab erfolgreich.',
    failureTitle: 'RMT retained warm reuse Browser-Performance-Lab fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runRmtRetainedWarmReusePerformanceSuite();
  printRmtRetainedWarmReusePerformanceReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  BASELINE_PATH,
  EVIDENCE_PATH,
  HARNESS_PATH,
  printRmtRetainedWarmReusePerformanceReport,
  runRmtRetainedWarmReusePerformanceSuite
};

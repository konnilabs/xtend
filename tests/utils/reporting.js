const fs = require('fs');
const path = require('path');
const { resolveRepoPath, resolveRootDir } = require('./files');

function normalizeSuiteResult(result) {
  const failures = Array.isArray(result.failures) ? result.failures : [];
  const skips = Array.isArray(result.skips) ? result.skips : [];
  const warnings = Array.isArray(result.warnings) ? result.warnings : [];

  const normalized = {
    id: result.id,
    label: result.label || result.id,
    status: result.status || (failures.length > 0 ? 'failed' : 'passed'),
    exitCode: Number.isInteger(result.exitCode) ? result.exitCode : (failures.length > 0 ? 1 : 0),
    passCount: Number.isInteger(result.passCount) ? result.passCount : (Array.isArray(result.passes) ? result.passes.length : 0),
    failureCount: Number.isInteger(result.failureCount) ? result.failureCount : failures.length,
    skipCount: Number.isInteger(result.skipCount) ? result.skipCount : skips.length,
    warningCount: Number.isInteger(result.warningCount) ? result.warningCount : warnings.length,
    failures,
    skips,
    warnings
  };

  if (result.report) {
    normalized.report = result.report;
  }

  return normalized;
}

function createRunSummary(results, options = {}) {
  const suites = results.map(normalizeSuiteResult);
  const failed = suites.filter((suite) => suite.status !== 'passed');
  const startedAt = options.startedAt || new Date().toISOString();
  const completedAt = options.completedAt || new Date().toISOString();

  return {
    schema: 'xtend.test.report.v1',
    status: failed.length > 0 ? 'failed' : 'passed',
    startedAt,
    completedAt,
    durationMs: Number.isFinite(options.durationMs) ? options.durationMs : null,
    suiteCount: suites.length,
    passedCount: suites.filter((suite) => suite.status === 'passed').length,
    failedCount: failed.length,
    skippedCount: suites.reduce((sum, suite) => sum + suite.skipCount, 0),
    warningCount: suites.reduce((sum, suite) => sum + suite.warningCount, 0),
    suites
  };
}

function printTextSummary(summary) {
  console.log('\nXTend Test Summary\n');
  summary.suites.forEach((suite) => {
    const skipped = suite.skipCount > 0 ? ` (${suite.skipCount} skipped)` : '';
    const warnings = suite.warningCount > 0 ? `, ${suite.warningCount} warnings` : '';
    console.log(`- ${suite.id}: ${suite.status}${skipped}${warnings}`);
  });
}

function resolveReportPath(reportPath, rootDir) {
  if (path.isAbsolute(reportPath)) {
    return reportPath;
  }
  return resolveRepoPath(reportPath, resolveRootDir(rootDir));
}

function writeJsonReport(summary, reportPath, rootDir) {
  const resolvedPath = resolveReportPath(reportPath, rootDir);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  fs.writeFileSync(resolvedPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  return resolvedPath;
}

module.exports = {
  createRunSummary,
  normalizeSuiteResult,
  printTextSummary,
  writeJsonReport
};

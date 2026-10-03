const fs = require('fs');
const path = require('path');
const { resolveRepoPath, resolveRootDir } = require('./files');

function normalizeSuiteResult(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    result = { status: 'failed', failures: [{ message: 'Suite returned no valid result.' }] };
  }
  const failures = Array.isArray(result.failures) ? result.failures : [];
  const skips = Array.isArray(result.skips) ? result.skips : [];
  const warnings = Array.isArray(result.warnings) ? result.warnings : [];
  const valid = ['passed', 'failed'].includes(result.status) || typeof result.ok === 'boolean';
  const failed = !valid || failures.length > 0 || result.failureCount > 0 || result.ok === false ||
    (result.status !== undefined && result.status !== 'passed') ||
    (result.exitCode !== undefined && result.exitCode !== 0);
  if (failed && !failures.length) failures.push({ message: valid ? 'Suite reported a negative or contradictory result.' : 'Suite returned no explicit outcome.' });

  const normalized = {
    id: result.id,
    label: result.label || result.id,
    status: failed ? 'failed' : 'passed',
    exitCode: failed ? (Number.isInteger(result.exitCode) && result.exitCode !== 0 ? result.exitCode : 1) : 0,
    passCount: Number.isInteger(result.passCount) ? result.passCount : (Array.isArray(result.passes) ? result.passes.length : 0),
    failureCount: Math.max(Number.isInteger(result.failureCount) ? result.failureCount : 0, failures.length),
    skipCount: Math.max(Number.isInteger(result.skipCount) ? result.skipCount : 0, skips.length),
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
  const temporaryPath = `${resolvedPath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryPath, resolvedPath);
  return resolvedPath;
}

module.exports = {
  createRunSummary,
  normalizeSuiteResult,
  printTextSummary,
  writeJsonReport
};

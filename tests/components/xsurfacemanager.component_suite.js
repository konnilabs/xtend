const {
  printSurfaceManagerRuntimeReport,
  runSurfaceManagerRuntimeSuite
} = require('./surface_manager_runtime_suite');

function runXSurfaceManagerComponentSuite(options = {}) {
  return runSurfaceManagerRuntimeSuite(options);
}

function printXSurfaceManagerComponentReport(result) {
  printSurfaceManagerRuntimeReport(result);
}

if (require.main === module) {
  const result = runXSurfaceManagerComponentSuite();
  printXSurfaceManagerComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXSurfaceManagerComponentReport,
  runXSurfaceManagerComponentSuite
};

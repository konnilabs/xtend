const {
  printSurfaceManagerRuntimeReport,
  runSurfaceManagerRuntimeSuite
} = require('./surface_manager_runtime_suite');

function runXSurfaceWindowComponentSuite(options = {}) {
  return runSurfaceManagerRuntimeSuite(options);
}

function printXSurfaceWindowComponentReport(result) {
  printSurfaceManagerRuntimeReport(result);
}

if (require.main === module) {
  const result = runXSurfaceWindowComponentSuite();
  printXSurfaceWindowComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXSurfaceWindowComponentReport,
  runXSurfaceWindowComponentSuite
};

const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXSelectComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-select', options);
}

function printXSelectComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXSelectComponentSuite();
  printXSelectComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXSelectComponentReport,
  runXSelectComponentSuite
};

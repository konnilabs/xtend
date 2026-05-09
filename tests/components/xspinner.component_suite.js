const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXSpinnerComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-spinner', options);
}

function printXSpinnerComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXSpinnerComponentSuite();
  printXSpinnerComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXSpinnerComponentReport,
  runXSpinnerComponentSuite
};

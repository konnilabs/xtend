const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXSummaryComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-summary', options);
}

function printXSummaryComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXSummaryComponentSuite();
  printXSummaryComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXSummaryComponentReport,
  runXSummaryComponentSuite
};

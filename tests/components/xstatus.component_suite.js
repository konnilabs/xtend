const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXStatusComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-status', options);
}

function printXStatusComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXStatusComponentSuite();
  printXStatusComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXStatusComponentReport,
  runXStatusComponentSuite
};

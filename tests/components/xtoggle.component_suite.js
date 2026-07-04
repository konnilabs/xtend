const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXToggleComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-toggle', options);
}

function printXToggleComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXToggleComponentSuite();
  printXToggleComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXToggleComponentReport,
  runXToggleComponentSuite
};


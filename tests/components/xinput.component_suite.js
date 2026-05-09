const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXInputComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-input', options);
}

function printXInputComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXInputComponentSuite();
  printXInputComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXInputComponentReport,
  runXInputComponentSuite
};

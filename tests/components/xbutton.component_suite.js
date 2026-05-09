const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXButtonComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-button', options);
}

function printXButtonComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXButtonComponentSuite();
  printXButtonComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXButtonComponentReport,
  runXButtonComponentSuite
};

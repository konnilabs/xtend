const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXMenuComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-menu', options);
}

function printXMenuComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXMenuComponentSuite();
  printXMenuComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXMenuComponentReport,
  runXMenuComponentSuite
};

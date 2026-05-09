const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXCheckboxComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-checkbox', options);
}

function printXCheckboxComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXCheckboxComponentSuite();
  printXCheckboxComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXCheckboxComponentReport,
  runXCheckboxComponentSuite
};

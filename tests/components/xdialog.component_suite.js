const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXDialogComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-dialog', options);
}

function printXDialogComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXDialogComponentSuite();
  printXDialogComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXDialogComponentReport,
  runXDialogComponentSuite
};

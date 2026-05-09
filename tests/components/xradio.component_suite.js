const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXRadioComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-radio', options);
}

function printXRadioComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXRadioComponentSuite();
  printXRadioComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXRadioComponentReport,
  runXRadioComponentSuite
};

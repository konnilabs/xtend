const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXFormComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-form', options);
}

function printXFormComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXFormComponentSuite();
  printXFormComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXFormComponentReport,
  runXFormComponentSuite
};

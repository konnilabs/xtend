const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXTextareaComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-textarea', options);
}

function printXTextareaComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXTextareaComponentSuite();
  printXTextareaComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXTextareaComponentReport,
  runXTextareaComponentSuite
};

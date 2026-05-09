const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXWriterComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-writer', options);
}

function printXWriterComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXWriterComponentSuite();
  printXWriterComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXWriterComponentReport,
  runXWriterComponentSuite
};

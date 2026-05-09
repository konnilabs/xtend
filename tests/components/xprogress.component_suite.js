const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXProgressComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-progress', options);
}

function printXProgressComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXProgressComponentSuite();
  printXProgressComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXProgressComponentReport,
  runXProgressComponentSuite
};

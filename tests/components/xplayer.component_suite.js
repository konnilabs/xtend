const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXPlayerComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-player', options);
}

function printXPlayerComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXPlayerComponentSuite();
  printXPlayerComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXPlayerComponentReport,
  runXPlayerComponentSuite
};

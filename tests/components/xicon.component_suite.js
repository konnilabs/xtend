const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXIconComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-icon', options);
}

function printXIconComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXIconComponentSuite();
  printXIconComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXIconComponentReport,
  runXIconComponentSuite
};

const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXTabsComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-tabs', options);
}

function printXTabsComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXTabsComponentSuite();
  printXTabsComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXTabsComponentReport,
  runXTabsComponentSuite
};

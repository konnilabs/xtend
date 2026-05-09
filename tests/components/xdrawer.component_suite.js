const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXDrawerComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-drawer', options);
}

function printXDrawerComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXDrawerComponentSuite();
  printXDrawerComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXDrawerComponentReport,
  runXDrawerComponentSuite
};

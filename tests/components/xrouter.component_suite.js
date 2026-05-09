const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXRouterComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-router', options);
}

function printXRouterComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXRouterComponentSuite();
  printXRouterComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXRouterComponentReport,
  runXRouterComponentSuite
};

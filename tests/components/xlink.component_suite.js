const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXLinkComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-link', options);
}

function printXLinkComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXLinkComponentSuite();
  printXLinkComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXLinkComponentReport,
  runXLinkComponentSuite
};

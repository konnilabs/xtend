const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXPopoverComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-popover', options);
}

function printXPopoverComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXPopoverComponentSuite();
  printXPopoverComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXPopoverComponentReport,
  runXPopoverComponentSuite
};

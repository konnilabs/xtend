const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXCalendarComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-calendar', options);
}

function printXCalendarComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXCalendarComponentSuite();
  printXCalendarComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXCalendarComponentReport,
  runXCalendarComponentSuite
};

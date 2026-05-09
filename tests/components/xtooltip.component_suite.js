const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXTooltipComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-tooltip', options);
}

function printXTooltipComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXTooltipComponentSuite();
  printXTooltipComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXTooltipComponentReport,
  runXTooltipComponentSuite
};

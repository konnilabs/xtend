const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXLightboxComponentSuite(options = {}) {
  return runPriorityComponentSuite('x-lightbox', options);
}

function printXLightboxComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXLightboxComponentSuite();
  printXLightboxComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXLightboxComponentReport,
  runXLightboxComponentSuite
};

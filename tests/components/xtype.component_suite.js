const { printLayoutDisplayMediaComponentReport, runLayoutDisplayMediaComponentSuite } = require('./layout_display_media_component_contracts');

function runXTypeComponentSuite(options = {}) {
  return runLayoutDisplayMediaComponentSuite('x-type', options);
}

if (require.main === module) {
  const result = runXTypeComponentSuite();
  printLayoutDisplayMediaComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = { runXTypeComponentSuite };

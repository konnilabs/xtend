const { printLayoutDisplayMediaComponentReport, runLayoutDisplayMediaComponentSuite } = require('./layout_display_media_component_contracts');

function runXCodeComponentSuite(options = {}) {
  return runLayoutDisplayMediaComponentSuite('x-code', options);
}

if (require.main === module) {
  const result = runXCodeComponentSuite();
  printLayoutDisplayMediaComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = { runXCodeComponentSuite };

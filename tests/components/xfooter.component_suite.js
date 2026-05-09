const { printLayoutDisplayMediaComponentReport, runLayoutDisplayMediaComponentSuite } = require('./layout_display_media_component_contracts');

function runXFooterComponentSuite(options = {}) {
  return runLayoutDisplayMediaComponentSuite('x-footer', options);
}

if (require.main === module) {
  const result = runXFooterComponentSuite();
  printLayoutDisplayMediaComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = { runXFooterComponentSuite };

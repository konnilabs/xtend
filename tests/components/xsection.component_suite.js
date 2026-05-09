const { printLayoutDisplayMediaComponentReport, runLayoutDisplayMediaComponentSuite } = require('./layout_display_media_component_contracts');

function runXSectionComponentSuite(options = {}) {
  return runLayoutDisplayMediaComponentSuite('x-section', options);
}

if (require.main === module) {
  const result = runXSectionComponentSuite();
  printLayoutDisplayMediaComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = { runXSectionComponentSuite };

const { printLayoutDisplayMediaComponentReport, runLayoutDisplayMediaComponentSuite } = require('./layout_display_media_component_contracts');

function runXHeaderComponentSuite(options = {}) {
  return runLayoutDisplayMediaComponentSuite('x-header', options);
}

if (require.main === module) {
  const result = runXHeaderComponentSuite();
  printLayoutDisplayMediaComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = { runXHeaderComponentSuite };

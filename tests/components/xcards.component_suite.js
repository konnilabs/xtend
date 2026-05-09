const { printLayoutDisplayMediaComponentReport, runLayoutDisplayMediaComponentSuite } = require('./layout_display_media_component_contracts');

function runXCardsComponentSuite(options = {}) {
  return runLayoutDisplayMediaComponentSuite('x-cards', options);
}

if (require.main === module) {
  const result = runXCardsComponentSuite();
  printLayoutDisplayMediaComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = { runXCardsComponentSuite };

const { printLayoutDisplayMediaComponentReport, runLayoutDisplayMediaComponentSuite } = require('./layout_display_media_component_contracts');

function runXHeroComponentSuite(options = {}) {
  return runLayoutDisplayMediaComponentSuite('x-hero', options);
}

if (require.main === module) {
  const result = runXHeroComponentSuite();
  printLayoutDisplayMediaComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = { runXHeroComponentSuite };

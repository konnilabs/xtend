const { printLayoutDisplayMediaComponentReport, runLayoutDisplayMediaComponentSuite } = require('./layout_display_media_component_contracts');

function runXMasonryComponentSuite(options = {}) {
  return runLayoutDisplayMediaComponentSuite('x-masonry', options);
}

if (require.main === module) {
  const result = runXMasonryComponentSuite();
  printLayoutDisplayMediaComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = { runXMasonryComponentSuite };

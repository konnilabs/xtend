const {
  printSurfaceManagerSidePanelReport,
  runSurfaceManagerSidePanelSuite
} = require('./surface_manager_side_panel_suite');

function runXSidePanelComponentSuite(options = {}) {
  return runSurfaceManagerSidePanelSuite(options);
}

function printXSidePanelComponentReport(result) {
  printSurfaceManagerSidePanelReport(result);
}

if (require.main === module) {
  const result = runXSidePanelComponentSuite();
  printXSidePanelComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXSidePanelComponentReport,
  runXSidePanelComponentSuite
};

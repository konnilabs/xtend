'use strict';

const { checkRmtDemos } = require('../../scripts/check_rmt_demos');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');

function runRmtDemoInventorySuite() {
  const check = checkRmtDemos();
  const context = createSuiteContext({ id: 'rmt-demo-inventory', label: 'XTendRMT Demo Inventory' });
  context.assert(check.ok, `all demo manifests and generated artifacts are current${check.ok ? '' : `: ${check.errors.join('; ')}`}`);
  return context.result();
}

function printRmtDemoInventoryReport(result) {
  printSuiteReport(result, { successTitle: 'XTendRMT Demo Inventory erfolgreich.', failureTitle: 'XTendRMT Demo Inventory fehlgeschlagen:' });
}

module.exports = { runRmtDemoInventorySuite, printRmtDemoInventoryReport };

'use strict';

const fs = require('fs');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { createRmtAppBuild } = require('../../xtend-builder/generators/rmt-build');
const { verifyRmtDemoInventory } = require('../../scripts/verify_rmt_demo_inventory');

const DEMO = 'demos/xtendrmt/examples/lifecycle/demo.json';

function runRmtLifecycleDemoSuite(options = {}) {
  const rootDir = path.resolve(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'rmt-lifecycle-demo', label: 'RMT Lifecycle Demo' });
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, DEMO), 'utf8'));
  const inventory = verifyRmtDemoInventory();
  const build = createRmtAppBuild({ demo: DEMO, check: true }, { rootDir });
  context.assert(inventory.ok, 'Lifecycle is registered in the valid demo inventory');
  context.assert(manifest.role === 'tutorial', 'Lifecycle is classified as a tutorial');
  context.assert(manifest.buildCommand.includes('rmt-build --demo'), 'Lifecycle uses the generic manifest-driven RMT build');
  context.assert(build.ok, `Lifecycle generated outputs match rmt-build${build.ok ? '' : `: ${(build.errors || []).join('; ')}`}`);
  context.assert(!fs.existsSync(path.join(rootDir, 'xtend-builder/generators/rmt-lifecycle-demo.js')), 'Legacy lifecycle special generator is removed');
  return context.result();
}

function printRmtLifecycleDemoReport(result) {
  printSuiteReport(result, { successTitle: 'RMT Lifecycle Demo erfolgreich.', failureTitle: 'RMT Lifecycle Demo fehlgeschlagen:' });
}

if (require.main === module) {
  const result = runRmtLifecycleDemoSuite();
  printRmtLifecycleDemoReport(result);
  if (!result.ok) process.exitCode = 1;
}

module.exports = { runRmtLifecycleDemoSuite, printRmtLifecycleDemoReport };

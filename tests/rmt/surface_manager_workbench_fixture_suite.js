'use strict';

const fs = require('fs');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { compileRmtVNextSource } = require('../../tools/rmt-language/vnext-compiler');

const BASE = 'demos/xtendrmt/fixtures/surface-workbench';

function runSurfaceManagerWorkbenchFixtureSuite(options = {}) {
  const rootDir = path.resolve(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'surface-workbench-fixture', label: 'SurfaceManager Workbench Fixture' });
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, BASE, 'demo.json'), 'utf8'));
  const source = fs.readFileSync(path.join(rootDir, BASE, manifest.source), 'utf8');
  const coreText = fs.readFileSync(path.join(rootDir, BASE, manifest.outputs.core), 'utf8');
  const core = JSON.parse(coreText);
  const runtime = fs.readFileSync(path.join(rootDir, BASE, manifest.outputs.app), 'utf8');
  const smoke = fs.readFileSync(path.join(rootDir, BASE, manifest.outputs.browserSmoke), 'utf8');
  const compiled = compileRmtVNextSource({ text: source, filePath: `${BASE}/${manifest.source}` });
  context.assert(manifest.role === 'regression-fixture', 'Workbench is classified as a regression fixture');
  context.assert(compiled.ok && compiled.coreJson === coreText, 'Workbench core exactly matches the vNext compiler');
  context.assert(core.schema === 'xtend.rmt.core-format.vnext.v1', 'Workbench uses only the vNext core contract');
  context.assert(runtime.includes('xtend.surface.workbench-fixture.v1'), 'Workbench runtime exposes its fixture contract');
  context.assert(smoke.includes('/demos/xtendrmt/fixtures/surface-workbench/generated/app.js'), 'Workbench browser smoke loads the colocated app');
  context.assert(!fs.existsSync(path.join(rootDir, 'xtendrmt/surface-workbench.core.json')), 'Legacy Workbench core is removed');
  return context.result();
}

function printSurfaceManagerWorkbenchFixtureReport(result) {
  printSuiteReport(result, { successTitle: 'SurfaceManager Workbench Fixture erfolgreich.', failureTitle: 'SurfaceManager Workbench Fixture fehlgeschlagen:' });
}

if (require.main === module) { const result = runSurfaceManagerWorkbenchFixtureSuite(); printSurfaceManagerWorkbenchFixtureReport(result); if (!result.ok) process.exitCode = 1; }
module.exports = { runSurfaceManagerWorkbenchFixtureSuite, printSurfaceManagerWorkbenchFixtureReport };

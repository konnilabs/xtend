'use strict';

const fs = require('fs');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { compileRmtVNextSource } = require('../../tools/rmt-language/vnext-compiler');

const BASE = 'demos/xtendrmt/examples/first-app';

function runRmtFirstDemoAppSuite(options = {}) {
  const rootDir = path.resolve(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'rmt-first-demo-app', label: 'Epic 10 RMT-first Demo App' });
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, BASE, 'demo.json'), 'utf8'));
  const source = fs.readFileSync(path.join(rootDir, BASE, manifest.source), 'utf8');
  const coreText = fs.readFileSync(path.join(rootDir, BASE, manifest.outputs.core), 'utf8');
  const core = JSON.parse(coreText);
  const runtime = fs.readFileSync(path.join(rootDir, BASE, manifest.outputs.app), 'utf8');
  const smoke = fs.readFileSync(path.join(rootDir, BASE, manifest.outputs.browserSmoke), 'utf8');
  const compiled = compileRmtVNextSource({ text: source, filePath: `${BASE}/${manifest.source}` });
  context.assert(manifest.role === 'tutorial', 'First App is classified as a tutorial');
  context.assert(compiled.ok && compiled.coreJson === coreText, 'First App core exactly matches the vNext compiler');
  context.assert(core.schema === 'xtend.rmt.core-format.vnext.v1', 'First App uses only the vNext core contract');
  context.assert(runtime.includes('xtend.epic10.rmt-first-demo-app.v1'), 'First App runtime exposes its contract');
  context.assert(smoke.includes('/demos/xtendrmt/examples/first-app/generated/app.js'), 'First App browser smoke loads the colocated app');
  context.assert(!fs.existsSync(path.join(rootDir, 'xtendrmt/rmt-first-demo-app.core.json')), 'Legacy First App core is removed');
  return context.result();
}

function printRmtFirstDemoAppReport(result) {
  printSuiteReport(result, { successTitle: 'RMT-first Demo App erfolgreich.', failureTitle: 'RMT-first Demo App fehlgeschlagen:' });
}

if (require.main === module) { const result = runRmtFirstDemoAppSuite(); printRmtFirstDemoAppReport(result); if (!result.ok) process.exitCode = 1; }
module.exports = { runRmtFirstDemoAppSuite, printRmtFirstDemoAppReport };

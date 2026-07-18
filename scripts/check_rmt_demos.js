'use strict';

const fs = require('fs');
const path = require('path');
const { compileRmtVNextSource } = require('../tools/rmt-language/vnext-compiler');
const { createRmtAppBuild } = require('../xtend-builder/generators/rmt-build');
const { verifyRmtDemoInventory } = require('./verify_rmt_demo_inventory');

const ROOT = path.resolve(__dirname, '..');

function checkRmtDemos() {
  const inventoryResult = verifyRmtDemoInventory();
  const errors = inventoryResult.errors.slice();
  const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'demos/xtendrmt/demo-inventory.json'), 'utf8'));
  for (const entry of inventory.demos) {
    const manifestPath = path.posix.join('demos/xtendrmt', entry);
    const base = path.posix.dirname(manifestPath);
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, manifestPath), 'utf8'));
    const sourcePath = path.posix.join(base, manifest.source);
    const source = fs.readFileSync(path.join(ROOT, sourcePath), 'utf8');
    const compiled = compileRmtVNextSource({ text: source, filePath: sourcePath });
    if (!compiled.ok) { errors.push(`${manifest.id}: compilation failed`); continue; }
    const corePath = path.posix.join(base, manifest.outputs.core);
    if (fs.readFileSync(path.join(ROOT, corePath), 'utf8') !== compiled.coreJson) errors.push(`${manifest.id}: generated/core.json is stale`);
    if (manifest.buildCommand) {
      const build = createRmtAppBuild({ demo: manifestPath, check: true }, { rootDir: ROOT });
      if (!build.ok) errors.push(...build.errors.map((error) => `${manifest.id}: ${error}`));
    }
  }
  return { schema: 'xtend.rmt.demo-check-report.v1', ok: errors.length === 0, demos: inventory.demos.length, errors };
}

if (require.main === module) {
  const result = checkRmtDemos();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
}

module.exports = { checkRmtDemos };

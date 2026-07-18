'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INVENTORY_PATH = 'demos/xtendrmt/demo-inventory.json';
const ROLES = new Set(['tutorial', 'showcase', 'regression-fixture', 'language-reference']);

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(ROOT, relativePath), 'utf8'));
}

function verifyRmtDemoInventory() {
  const errors = [];
  const inventory = readJson(INVENTORY_PATH);
  const ids = new Set();
  const manifests = [];

  if (inventory.schema !== 'xtend.rmt.demo-inventory.v1' || !Array.isArray(inventory.demos)) {
    errors.push('Invalid XTendRMT demo inventory schema.');
  }

  (inventory.demos || []).forEach((entry) => {
    const manifestPath = path.posix.join('demos/xtendrmt', entry);
    if (!fs.existsSync(path.resolve(ROOT, manifestPath))) {
      errors.push(`Missing demo manifest: ${manifestPath}`);
      return;
    }
    const manifest = readJson(manifestPath);
    const base = path.posix.dirname(manifestPath);
    manifests.push({ path: manifestPath, manifest });
    if (manifest.schema !== 'xtend.rmt.demo.v1') errors.push(`${manifestPath}: invalid schema`);
    if (!manifest.id || ids.has(manifest.id)) errors.push(`${manifestPath}: missing or duplicate id`);
    ids.add(manifest.id);
    if (!ROLES.has(manifest.role)) errors.push(`${manifestPath}: unknown role ${manifest.role}`);
    const sourcePath = path.posix.join(base, manifest.source || '');
    if (!fs.existsSync(path.resolve(ROOT, sourcePath))) {
      errors.push(`${manifestPath}: missing source ${sourcePath}`);
    } else if (sha256(fs.readFileSync(path.resolve(ROOT, sourcePath))) !== manifest.sourceSha256) {
      errors.push(`${manifestPath}: stale sourceSha256`);
    }
    Object.values(manifest.outputs || {}).forEach((output) => {
      const outputPath = output.startsWith('components/') ? output : path.posix.join(base, output);
      if (!fs.existsSync(path.resolve(ROOT, outputPath))) errors.push(`${manifestPath}: missing output ${outputPath}`);
    });
    (manifest.docs || []).forEach((doc) => {
      if (!fs.existsSync(path.resolve(ROOT, doc))) errors.push(`${manifestPath}: missing docs ${doc}`);
    });
    if (!manifest.gate) errors.push(`${manifestPath}: missing gate`);
  });

  return { schema: 'xtend.rmt.demo-inventory-report.v1', ok: errors.length === 0, inventory: INVENTORY_PATH, demos: manifests.length, errors };
}

if (require.main === module) {
  const result = verifyRmtDemoInventory();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
}

module.exports = { verifyRmtDemoInventory };

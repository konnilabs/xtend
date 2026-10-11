'use strict';
// Controlled envelope data only; this is not real paired scanner/product evidence.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
function receipt({ manifest, coreSha, demoSha, generatedAt = new Date().toISOString() }) {
  const root = path.resolve(__dirname, '../..'), prefix = path.join(root, 'tools/schema-inventory');
  const bytes = zlib.gunzipSync(fs.readFileSync(path.join(prefix, 'ownership-ledger.json.gz')));
  const ledger = JSON.parse(bytes);
  const ids = require(path.join(prefix, 'selection.json'));
  const bindings = require(path.join(prefix, 'authority-bindings.json'));
  const overlay = require(path.join(prefix, 'command-lexical-overlay.json'));
  const item = manifest.packages.find(entry => entry.name === '@ccslabs/xtend');
  const rows = ids.map(schemaId => ({ schemaId, hashes: ledger.entries.find(entry => entry.schemaId === schemaId).shapePolicy.acceptedFingerprints.slice().sort() }));
  const demo = structuredClone(rows);
  const command = demo.find(row => row.schemaId === overlay.schemaId);
  command.hashes = [...new Set([...command.hashes, ...overlay.variants.map(variant => variant.hash)])].sort();
  const union = structuredClone(demo);
  return { selection: ids, coreSha, demoSha, packageSha256: item.sha256, packageVersion: item.version,
    ledgerSha256: crypto.createHash('sha256').update(bytes).digest('hex'), selectionOk: true, migrationComplete: false,
    remainingOwnershipIds: 23, generatedAt, core: structuredClone(rows), demo, union,
    authorities: bindings.map(binding => ({ ...binding, coreSha, packageSha256: item.sha256, packageVersion: item.version,
      importedSource: 'imports/core/' + coreSha + '/' + binding.oldSource })) };
}
module.exports = { receipt };

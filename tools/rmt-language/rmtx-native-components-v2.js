// SPDX-License-Identifier: Apache-2.0
'use strict';
const catalog = require('./rmtx-native-components-v2.json');
const { validateNativeComponentMetadataV2, canonical } = require('../xtensions/native-component-contract-v2');
const { data, freeze, clone } = require('../xtensions/state-binding-contract');
const RMTX_NATIVE_COMPONENTS_API_VERSION_V2 = '2.0.0';
const RMTX_NATIVE_COMPONENTS_SCHEMA_V2 = 'xtend.rmtx.native-components.v2';
const rows = new Map(catalog.components.map(input => { const row = validateNativeComponentMetadataV2(input); return [row.tag, row]; }));
function getRmtxNativeComponentV2(tag) { const row = rows.get(tag); if (!row || !['ui', 'platform'].includes(row.role)) throw new TypeError('Source8 RMT.Component requires a captured productive CustomElement; services have authority ports.'); return row; }
function getRmtxNativeComponentCatalogV2() { return freeze(clone(catalog)); }
function validateRmtxNativeComponentsV2(input) {
  data(input); if (!Array.isArray(input) || input.length > rows.size) throw new TypeError('Native metadata2 requires a bounded captured array.');
  const tags = new Set();
  for (const value of input) { const row = validateNativeComponentMetadataV2(value), expected = getRmtxNativeComponentV2(row.tag); if (tags.has(row.tag) || canonical(expected) !== canonical(row)) throw new TypeError('Native component2 metadata differs from the captured reviewed catalog.'); tags.add(row.tag); }
  return freeze(clone(input));
}
function verifyNativeComponentSourcesV2(input, { rootDir } = {}) {
  const checked = validateRmtxNativeComponentsV2(input); if (!checked.length) return checked;
  const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
  if (typeof rootDir !== 'string' || !rootDir) throw new TypeError('Native source2 verification requires a source root.');
  let root = fs.realpathSync(rootDir), pkg;
  try { pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')); } catch {}
  if (pkg?.name !== '@ccslabs/xtend' || !fs.existsSync(path.join(root, 'components/manifest.json'))) root = path.dirname(path.dirname(fs.realpathSync(require.resolve('@ccslabs/xtend/components/manifest.json', { paths: [root, __dirname] }))));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'components/manifest.json'), 'utf8'));
  for (const row of checked) {
    if (manifest[row.tag] !== './' + row.module.slice('components/'.length)) throw new TypeError('Native source2 tag differs from manifest.');
    for (const capture of [{ module: row.module, sha256: row.sha256 }, ...row.dependencies]) {
      const file = fs.realpathSync(path.join(root, capture.module)), relative = path.relative(root, file);
      if (relative.startsWith('..') || path.isAbsolute(relative) || crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== capture.sha256) throw new TypeError('Native source2 entry or local dependency bytes differ: ' + capture.module);
    }
  }
  return checked;
}
module.exports = { RMTX_NATIVE_COMPONENTS_API_VERSION_V2, RMTX_NATIVE_COMPONENTS_SCHEMA_V2, getRmtxNativeComponentV2, getNativeComponentV2: getRmtxNativeComponentV2, getRmtxNativeComponentCatalogV2, validateRmtxNativeComponentsV2, validateNativeComponentsV2: validateRmtxNativeComponentsV2, verifyNativeComponentSourcesV2 };

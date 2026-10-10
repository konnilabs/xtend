'use strict';
// Fixture-only module loader. Production has no injectable retirement option.
// Only the scanner dependency is a temporary source-retired copy of the real
// migration engine; the publish implementation and every other dependency are
// the actual files. This cannot publish: callers supply in-memory publishers.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
function loadPublisher(retired = true) {
  const file = path.resolve(__dirname, '../../scripts/release/publish.cjs');
  const scanner = require('../migration/manifest-initial-authority/harness.cjs').load(retired);
  const fixture = new Module(file, module), realRequire = Module.createRequire(file);
  fixture.filename = file;
  fixture.require = name => name === '../scan_schema_inventory' ? scanner : realRequire(name);
  fixture._compile(fs.readFileSync(file, 'utf8'), file);
  return fixture.exports;
}
module.exports = { loadPublisher };

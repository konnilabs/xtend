'use strict';
const fs = require('node:fs'), path = require('node:path');
const api = require('../tools/schema-inventory/index.cjs');
function run({ archive, destination, expected, output, typescript = require('typescript') }) {
  const provider = api.createSourceProvider({ archive, destination, expected });
  const scanner = api.createScanner({ typescript });
  const startedAt = new Date().toISOString();
  const scan = scanner.scanSchemaInventory({ rootDir: path.join(destination, 'current/core'), sourceProvider: provider });
  const inventory = api.createExpectedInventory(provider);
  const validation = scanner.validateInventoryDocument(inventory, scan, { sourceProvider: provider });
  const report = { startedAt, finishedAt: new Date().toISOString(), ok: validation.valid,
    productiveSource: provider.provenance(), stats: scan.stats, validation };
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  return report;
}
if (require.main === module) {
  try {
    const options = {}; for (let i = 2; i < process.argv.length; i += 2) options[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
    const expected = JSON.parse(fs.readFileSync(options.expected));
    const report = run({ ...options, expected });
    console.log(JSON.stringify({ ok: report.ok, stats: report.stats, errors: report.validation.errors.length, output: options.output }));
    if (!report.ok) process.exitCode = 1;
  } catch (error) { console.error(error.stack); process.exitCode = 1; }
}
module.exports = { run };

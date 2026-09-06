'use strict';
const fs = require('node:fs');
const path = require('node:path');
async function runXtendShopSuite({rootDir = path.resolve(__dirname, '../..'), group = 'contracts'} = {}) {
  const fixture = process.env.XTEND_SHOP_FIXTURE || path.join(rootDir, 'products/xtend-shop');
  if (!['contracts', 'php', 'browser'].includes(group)) throw new Error('Unknown XTend.store suite.');
  const report = await require(path.join(fixture, 'scripts/test.cjs')).run(group, {
    reportDirectory: path.join(rootDir, '.xtend-test-results/xtend-store/browser')
  });
  const target = path.join(rootDir, '.xtend-test-results', `xtend-store-${group}.json`);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target + '.tmp', JSON.stringify(report, null, 2) + '\n');
  fs.renameSync(target + '.tmp', target);
  return {
    ok: report.ok,
    passes: report.results.flatMap(result => result.checks || []),
    failures: report.results.flatMap(result => result.failures || []),
    report
  };
}
module.exports = {runXtendShopSuite};

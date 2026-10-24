'use strict';
const fs = require('node:fs'), path = require('node:path'), {spawnSync} = require('node:child_process');
function testFiles(root) {
  return fs.readdirSync(path.join(root, 'tests/security'))
    .filter(name => /\.test\.(?:cjs|mjs|js)$/.test(name) && name !== 'browser.test.mjs')
    .sort().map(name => 'tests/security/' + name);
}
if (require.main === module) {
  const root = path.resolve(__dirname, '..'), files = testFiles(root);
  if (!files.length) throw Error('Node security test coverage missing');
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], {cwd:root, stdio:'inherit'});
  if (result.error) throw result.error;
  process.exitCode = result.status === 0 && result.signal === null ? 0 : 1;
}
module.exports = {testFiles};

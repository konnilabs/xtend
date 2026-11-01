'use strict';
const fs = require('node:fs'), path = require('node:path');
function run(options) {
  const expected = JSON.parse(fs.readFileSync(options.expected));
  if (process.env.GITHUB_ACTIONS === 'true' && (expected.coreSha !== process.env.GITHUB_SHA || expected.context.runId !== process.env.GITHUB_RUN_ID || expected.context.runAttempt !== process.env.GITHUB_RUN_ATTEMPT)) throw Error('Current source/run identity mismatch');
  const provider = require('../tools/schema-inventory/source-provider.cjs').createSourceProvider({...options, expected});
  const result = require('../tools/schema-inventory/current-full-union.cjs').verify(provider, require('typescript'));
  fs.mkdirSync(path.dirname(options.output), {recursive: true}); fs.writeFileSync(options.output, JSON.stringify(result, null, 2) + '\n');
  return result;
}
if (require.main === module) try {
  const options = {}; for (let i = 2; i < process.argv.length; i += 2) options[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
  const result = run(options); console.log(JSON.stringify({coverage: result.coverage, coreSha: result.source.coreSha, demoSha: result.source.demoSha, acceptedForRelease: false}));
} catch (error) { console.error(error.stack); process.exitCode = 1; }
module.exports = {run};

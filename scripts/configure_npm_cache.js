'use strict';

const fs = require('node:fs');
const path = require('node:path');

// This runs before setup-node. Do not invoke npm here: the bundled npm can be
// older than package.json's required devEngines.packageManager version.
function configureNpmCache(environment = process.env) {
  if (!environment.RUNNER_TEMP || !environment.GITHUB_ENV) throw new Error('RUNNER_TEMP and GITHUB_ENV are required to configure the CI npm cache');
  const directory = path.join(path.resolve(environment.RUNNER_TEMP), 'xtend-npm-cache');
  if (/[\r\n]/u.test(directory)) throw new Error('Invalid cache directory');
  fs.mkdirSync(directory, { recursive: true });
  fs.appendFileSync(environment.GITHUB_ENV, `NPM_CONFIG_CACHE=${directory}\nXTEND_NPM_CACHE=${directory}\n`);
  return directory;
}

if (require.main === module) {
  try { console.log(`npm download cache: ${configureNpmCache()}`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { configureNpmCache };

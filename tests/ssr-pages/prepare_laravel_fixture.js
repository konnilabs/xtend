'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { buildLaravelPackage } = require('../../scripts/build_laravel_package');
function prepareLaravelFixture({ rootDir = path.resolve(__dirname, '../..'), output, version = '12' }) {
  if (!['12', '13'].includes(String(version))) throw new Error('Unsupported Laravel fixture version.');
  if (!output || fs.existsSync(output)) throw new Error('Fixture needs a fresh output directory.');
  fs.mkdirSync(output, { recursive: true });
  const built = buildLaravelPackage({ rootDir, output: path.join(output, 'staged-package') });
  const packageDir = path.join(output, 'package'); fs.mkdirSync(packageDir);
  execFileSync(process.env.XTEND_PHP_BINARY || 'php', ['-r', '(new PharData($argv[1]))->extractTo($argv[2]);', built.archive, packageDir], { timeout: 30000 });
  fs.rmSync(built.directory, { recursive: true });
  const fixture = path.join(rootDir, 'tests/fixtures/ssr-pages', `laravel${version}`);
  for (const entry of fs.readdirSync(fixture)) fs.copyFileSync(path.join(fixture, entry), path.join(output, entry));
  if (fs.existsSync(path.join(rootDir, 'tests/ssr-pages/LaravelIntegrationTest.php'))) fs.copyFileSync(path.join(rootDir, 'tests/ssr-pages/LaravelIntegrationTest.php'), path.join(output, 'LaravelIntegrationTest.php'));
  return { output, version, packageSha256: built.sha256 };
}
if (require.main === module) console.log(JSON.stringify(prepareLaravelFixture({ output: process.argv[2], version: process.argv[3] })));
module.exports = { prepareLaravelFixture };

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
function buildLaravelPackage(options = {}) {
  const root = options.rootDir || path.resolve(__dirname, '..');
  const output = path.resolve(options.output || path.join(root, '.xtend-test-results/laravel-package'));
  if (fs.existsSync(output)) throw new Error(`Package output already exists: ${output}`);
  fs.mkdirSync(output, { recursive: true });
  const source = path.join(root, 'laravel');
  for (const entry of ['src', 'config', 'resources', 'composer.json', 'README.md']) fs.cpSync(path.join(source, entry), path.join(output, entry), { recursive: true });
  const composer = JSON.parse(fs.readFileSync(path.join(output, 'composer.json')));
  composer.version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).version;
  fs.writeFileSync(path.join(output, 'composer.json'), JSON.stringify(composer, null, 2) + '\n');
  const runtime = path.join(output, 'runtime'); fs.mkdirSync(runtime);
  const files = {};
  // The Composer autoload declaration is the canonical runtime dependency list.
  for (const entry of composer.autoload.files) {
    const name = path.basename(entry);
    const contents = fs.readFileSync(path.join(root, 'xtendrmt', name));
    fs.writeFileSync(path.join(runtime, name), contents);
    files[name] = createHash('sha256').update(contents).digest('hex');
  }
  fs.copyFileSync(path.join(root, 'LICENSE'), path.join(output, 'LICENSE'));
  fs.writeFileSync(path.join(runtime, 'sources.json'), JSON.stringify({ schema: 'xtend.php-package-sources.v1', files }, null, 2) + '\n');
  function timestamps(directory) { for (const file of fs.readdirSync(directory)) { const target = path.join(directory, file); if (fs.statSync(target).isDirectory()) timestamps(target); fs.utimesSync(target, 315532800, 315532800); } }
  timestamps(output);
  const archive = `${output}.tar`;
  if (fs.existsSync(archive)) throw new Error(`Archive output already exists: ${archive}`);
  execFileSync(options.php || process.env.XTEND_PHP_BINARY || 'php', ['-r', '$archive = new PharData($argv[1]); $archive->buildFromDirectory($argv[2]);', archive, output], { stdio: 'pipe', timeout: 30000 });
  return { directory: output, archive, sha256: createHash('sha256').update(fs.readFileSync(archive)).digest('hex'), files };
}
if (require.main === module) console.log(JSON.stringify(buildLaravelPackage({ output: process.argv[2] }), null, 2));
module.exports = { buildLaravelPackage };

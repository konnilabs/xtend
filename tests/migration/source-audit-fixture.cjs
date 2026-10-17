'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { execFileSync } = require('node:child_process');
// A committed, isolated source fixture, never a productive/remote Core identity.
function sourceFixture(t) {
  const root = path.resolve(__dirname, '../..');
  const coreRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'source-audit-fixture-')));
  t.after(() => fs.rmSync(coreRoot, { recursive: true, force: true }));
  for (const relative of ['tools/schema-inventory', 'tools/project-index', 'candidate-integrity.cjs', 'package.json']) {
    const target = path.join(coreRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(path.join(root, relative), target, { recursive: true });
  }
  fs.writeFileSync(path.join(coreRoot, '.gitignore'), 'node_modules/\n');
  const git = args => execFileSync('git', args, { cwd: coreRoot, encoding: 'utf8' }).trim();
  git(['init', '-q']); git(['add', '.']);
  git(['-c', 'user.name=Controlled audit fixture', '-c', 'user.email=fixture@localhost', 'commit', '-qm', 'Controlled private audit fixture']);
  return { coreRoot, coreSha: git(['rev-parse', 'HEAD']), git };
}
module.exports = { sourceFixture };

'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const { sourceFixture } = require('./source-audit-fixture.cjs');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function setup(t, version) {
  const source = sourceFixture(t), directory = fs.mkdtempSync(path.join(os.tmpdir(), 'source-audit-candidates-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const ownerRoot = path.join(directory, 'owner'); fs.mkdirSync(ownerRoot);
  const bytes = Buffer.from('Controlled candidate bytes; no productive package or install evidence');
  fs.writeFileSync(path.join(directory, 'core.tgz'), bytes); fs.writeFileSync(path.join(directory, 'php.tar'), bytes);
  const demoSha = 'b'.repeat(40), manifest = { schema: 'xtend.product-candidates.v' + version, coreSha: source.coreSha,
    ...(version === 1 ? { demoSha } : { profile: 'xtend.npm.core-only.v1' }),
    packages: [{ name: '@ccslabs/xtend', version: require('../../package.json').version, file: 'core.tgz', sha256: sha(bytes), integrity: 'sha512-' + crypto.createHash('sha512').update(bytes).digest('base64') }],
    php: { file: 'php.tar', sha256: sha(bytes), sources: { controlled: sha(bytes) } } };
  const loader = require(path.join(source.coreRoot, 'tools/schema-inventory/source-audit.cjs'));
  return { ...source, loader, api: loader.loadSourceAudit(source), options: { manifest, directory, ownerRoot, demoSha } };
}
for (const version of [1, 2]) test('private source audit binds all 24 original authorities to v' + version + ' candidate bytes', t => {
  const f = setup(t, version), rows = f.api.importAuthorities(f.options);
  assert.equal(rows.length, 24);
  assert.throws(() => f.api.importAuthorities({ ...f.options, ownerRoot: f.coreRoot }), /independent Demo owner/);
  for (const row of rows) assert.equal(sha(fs.readFileSync(path.join(f.options.ownerRoot, row.importedSource))), row.sourceSha256);
  const changed = structuredClone(f.options.manifest); changed.packages[0].sha256 = '0'.repeat(64);
  assert.throws(() => f.api.importAuthorities({ ...f.options, manifest: changed }), /digest mismatch/);
  const imports = path.join(f.options.ownerRoot, 'imports');
  fs.renameSync(imports, imports + '-saved'); fs.symlinkSync(f.options.directory, imports);
  assert.throws(() => f.api.importAuthorities(f.options), /symlink rejected/);
  fs.unlinkSync(imports); fs.renameSync(imports + '-saved', imports);
  fs.appendFileSync(path.join(f.coreRoot, 'tools/project-index/sources.js'), '\n// changed\n');
  assert.throws(() => f.api.importAuthorities(f.options), /clean exact committed/);
});
test('foreign pins, module shadows and source symlinks cannot load as the pinned audit', t => {
  const f = setup(t, 1);
  assert.throws(() => f.loader.loadSourceAudit({ ...f, coreSha: 'a'.repeat(40) }), /clean exact committed/);
  // This no-extension shadow wins Node resolution over tracked sources.js.
  const shadow = path.join(f.coreRoot, 'tools/project-index/sources'); fs.writeFileSync(shadow, 'throw Error("must not execute")');
  assert.throws(() => f.loader.loadSourceAudit(f), /does not exist|exists on disk|Command failed/);
  fs.unlinkSync(shadow);
  const helper = path.join(f.coreRoot, 'tools/project-index/sources.js'); fs.renameSync(helper, helper + '.saved'); fs.symlinkSync(helper + '.saved', helper);
  assert.throws(() => f.loader.loadSourceAudit(f), /clean exact committed|symlink/);
});
test('current paired decision belongs to the committed private dependency closure', t => {
  const f = setup(t, 2), relative = 'tools/schema-inventory/current-pair-decision.json';
  assert.equal(typeof f.api.verifyCurrentPair, 'function');
  assert.ok(f.loader.assertSourceCheckout(f).files.includes(relative));
  f.git(['update-index', '--assume-unchanged', relative]);
  fs.appendFileSync(path.join(f.coreRoot, relative), '\n');
  assert.throws(() => f.loader.loadSourceAudit(f), /differs from committed/);
});

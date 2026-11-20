'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const baseCommit = '6a123f9657b533554a455a8ee44d853b6b77bf6d';
const hash = value => createHash('sha256').update(value).digest('hex');
const fixtures = [
  'frontend/two-host.rmtx', 'selector-profile/two-host.rmtx', 'keyed-profile/source.rmtx', 'orchestration-profile/source.rmtx',
  'native-view-profile/source.rmtx', 'lifecycle-profile/source.rmtx', 'native-orchestration-profile/source.rmtx', 'native-component-catalog/source.rmtx'
].map(file => 'development/rmtx-a06/' + file);
function pins(directory) {
  const result = {};
  function visit(relative) {
    for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true })) {
      const file = relative + '/' + entry.name;
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && /\.(?:[cm]?js|json|rmtx?|d\.ts)$/u.test(file)) result[file] = hash(fs.readFileSync(path.join(directory, file)));
    }
  }
  for (const folder of ['tools/rmt-language', 'tools/xtensions']) visit(folder);
  for (const file of fixtures) result[file] = hash(fs.readFileSync(path.join(directory, file)));
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
}
async function run({ baseline, output } = {}) {
  if (!baseline) throw new Error('An isolated git-archive baseline must be supplied with --baseline.');
  baseline = fs.realpathSync(baseline);
  assert.notEqual(baseline, fs.realpathSync(root), 'The current worktree cannot stand in for the archived baseline.');
  const before = { baseline: pins(baseline), current: pins(root) };
  const tree = execFileSync('git', ['-C', root, 'ls-tree', '-r', baseCommit, '--', 'tools/rmt-language', 'tools/xtensions', ...fixtures], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const tracked = {};
  for (const line of tree.trim().split('\n')) {
    const row = /^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/u.exec(line);
    if (!row || !/\.(?:[cm]?js|json|rmtx?|d\.ts)$/u.test(row[3])) continue;
    const bytes = fs.readFileSync(path.join(baseline, row[3]));
    const objectId = createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
    assert.equal(objectId, row[2], 'Archived bytes do not match the original Git object: ' + row[3]);
    assert.equal((fs.statSync(path.join(baseline, row[3])).mode & 0o111) ? '100755' : '100644', row[1], 'Archived mode drift: ' + row[3]);
    tracked[row[3]] = { objectId, mode: row[1] };
  }
  assert.deepEqual(Object.keys(before.baseline).sort(), Object.keys(tracked).sort(), 'Archived compiler source membership differs from the selected Git tree.');
  const baselineCompiler = require(path.join(baseline, 'tools/rmt-language/rmtx-compiler')).compileRmtxSource;
  const currentCompiler = require(path.join(root, 'tools/rmt-language/rmtx-compiler')).compileRmtxSource;
  const catalog = require('../orchestration-profile/reference.cjs').catalog();
  const sidecar = (await require('../keyed-profile/reference.cjs').createInput('/tmp/xtend-a065-raw-parity-unused')).xtensionBindings;
  const cases = [];
  for (const [index, source] of fixtures.entries()) {
    const version = `${index + 1}.0.0`, text = fs.readFileSync(path.join(root, source), 'utf8');
    assert.equal(text, fs.readFileSync(path.join(baseline, source), 'utf8'), `Retained fixture bytes drifted from ${baseCommit}: ${source}`);
    const options = { syntaxVersion: version, ...(index === 2 ? { xtensionBindings: sidecar } : {}), ...(index >= 3 ? { componentInterfaceCatalog: catalog } : {}) };
    // Both compilers receive precisely the same text, absolute source identity
    // and JSON-data options. No schema/version/path fields are removed from a
    // result before comparing the complete serialized compiler bytes.
    for (const [name, inputText, expected] of [['positive', text, true], ['type-import-rejected', text.replace(/^import\s*\{/u, 'import type {'), false]]) {
      const input = { text: inputText, filePath: path.join(root, source) };
      const baselineResult = baselineCompiler(input, JSON.parse(JSON.stringify(options)));
      const currentResult = currentCompiler(input, JSON.parse(JSON.stringify(options)));
      assert.equal(baselineResult.ok, expected, `Baseline ${version}/${name}: ${JSON.stringify(baselineResult.diagnostics)}`);
      assert.equal(currentResult.ok, expected, `Current ${version}/${name}: ${JSON.stringify(currentResult.diagnostics)}`);
      const baselineBytes = JSON.stringify(baselineResult), currentBytes = JSON.stringify(currentResult);
      assert.equal(currentBytes, baselineBytes, `Raw profile output changed for ${version}/${name}.`);
      cases.push({ version, name, source, inputSha256: hash(inputText), optionsSha256: hash(JSON.stringify(options)),
        accepted: expected, bytes: Buffer.byteLength(currentBytes), baselineSha256: hash(baselineBytes), currentSha256: hash(currentBytes), byteIdentical: true });
    }
  }
  assert.deepEqual(pins(baseline), before.baseline, 'Archived baseline sources changed during compilation.');
  assert.deepEqual(pins(root), before.current, 'Current compiler sources changed during compilation.');
  const report = { schema: 'xtend.rmt.raw-profile-parity.v1', format: 1, passed: true, node: process.version,
    baseCommit, baseline, current: root, cases, inputs: before, baselineTrackedObjects: tracked, comparison: 'complete JSON.stringify result bytes; no fields removed',
    baselineAndCurrentSourceIdentityEqual: true, acceptedForRelease: false };
  if (output) fs.writeFileSync(path.resolve(output), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, cases: cases.length, profiles: 8, baselineSources: Object.keys(before.baseline).length, currentSources: Object.keys(before.current).length }));
  return report;
}
if (require.main === module) {
  const option = name => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; };
  run({ baseline: option('--baseline'), output: option('--output') }).catch(error => { console.error(error); process.exitCode = 1; });
}
module.exports = { run };

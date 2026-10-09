'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { fixture, write, repo } = require('./fixtures.cjs');
const { loadInventory, edges, orderPackages } = require('../../scripts/release/inventory.cjs');
test('real inventory covers all ten packages and preserves seven/one/two groups and versions', () => {
  const result = loadInventory(repo);
  assert.equal(result.packages.length, 10);
  for (const [group, count, version] of [['core', 7, '0.9.0'], ['mcp', 1, '0.1.0'], ['material', 2, '0.1.0']]) {
    const entries = result.packages.filter(entry => entry.group === group);
    assert.equal(entries.length, count); assert.ok(entries.every(entry => entry.version === version));
  }
  assert.equal(result.edges.filter(edge => edge.hard).length, 5);
});
for (const mutation of ['omitted', 'duplicate-name', 'duplicate-path', 'private', 'repository-url', 'repository-directory', 'outside-workspace', 'new-public']) {
  test(`inventory fails closed on ${mutation}`, t => {
    const f = fixture(t), spec = f.specification;
    if (mutation === 'omitted') spec.packages.pop();
    if (mutation === 'duplicate-name') spec.packages[1].name = spec.packages[0].name;
    if (mutation === 'duplicate-path') spec.packages[1].path = spec.packages[0].path;
    if (mutation === 'private') f.mutate('fabric', p => { p.private = true; });
    if (mutation === 'repository-url') f.mutate('xtend-material', p => { delete p.repository.url; });
    if (mutation === 'repository-directory') f.mutate('xtend-material', p => { delete p.repository.directory; });
    if (mutation === 'outside-workspace') f.mutate('.', p => { p.workspaces = p.workspaces.filter(v => v !== 'fabric'); });
    if (mutation === 'new-public') { f.mutate('.', p => { p.workspaces.push('future'); }); write(path.join(f.rootDir, 'future/package.json'), { name: '@ccslabs/future', private: false }); }
    assert.throws(() => loadInventory(f.rootDir, spec));
  });
}
test('private products and VSIX never enter discovery', t => {
  const f = fixture(t);
  for (const [index, name] of ['@xtend-products/store', '@ccslabs/rmt-animation-testbench-product', '@ccslabs/xtend-material-workbench', '@ccslabs/xtend-llm-product', 'xtend-rmt-language'].entries()) {
    const dir = `private-${index}`; f.mutate('.', p => p.workspaces.push(dir));
    write(path.join(f.rootDir, dir, 'package.json'), { name, private: true, version: '0.1.0' });
  }
  assert.equal(loadInventory(f.rootDir).packages.length, 10);
});
test('workspace wildcards, traversal and duplicate declarations are rejected', t => {
  const f = fixture(t);
  for (const value of ['../foreign', 'products/*', 'fabric']) {
    f.mutate('.', p => { p.workspaces.push(value); }); assert.throws(() => loadInventory(f.rootDir));
    f.mutate('.', p => p.workspaces.pop());
  }
});
test('optional Compiler/Maraca peer cycle is ignored, required peer cycle blocks', t => {
  const f = fixture(t); assert.equal(loadInventory(f.rootDir).order.length, 10);
  f.mutate('tools', p => { p.peerDependenciesMeta['@ccslabs/xtend-maraca'].optional = false; });
  f.mutate('xtend-maraca', p => { p.peerDependenciesMeta['@ccslabs/xtend-compiler'].optional = false; });
  assert.throws(() => loadInventory(f.rootDir), /Hard dependency cycle/);
});
test('internal ranges including optional peers must satisfy artifact versions', t => {
  const f = fixture(t);
  f.mutate('products/xtend-mcp', p => { p.dependencies['@ccslabs/xtend-rmt'] = '^1.0.0'; });
  assert.throws(() => loadInventory(f.rootDir), /Unsatisfied internal dependency/);
});
test('future 1.x minor versions are handled by SemVer without updating release configuration', () => {
  const packages = [{ name: 'a', version: '1.7.0', manifest: {} }, { name: 'b', version: '1.3.0', manifest: { dependencies: { a: '^1.0.0' } } }];
  assert.equal(edges(packages)[0].hard, true); assert.deepEqual(orderPackages(packages).map(p => p.name), ['a', 'b']);
  packages[0].version = '2.0.0'; assert.throws(() => edges(packages), /Unsatisfied/);
});

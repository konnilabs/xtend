import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { exportLocalBundle, localSourceIdentity, backendSources, hash } from '../scripts/export-local-bundle.mjs';

function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-local-export-')); t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const root = path.join(temp, 'source'), output = path.join(temp, 'bundle'); fs.mkdirSync(root);
  const write = (relative, content) => { const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content)); };
  execFileSync('git', ['init', '--quiet', root]);
  execFileSync('git', ['-C', root, '-c', 'core.hooksPath=/dev/null', '-c', 'user.name=Local export fixture', '-c', 'user.email=fixture@localhost', 'commit', '--quiet', '--allow-empty', '-m', 'Fixture base']);
  const docs = ['de', 'en'].map(locale => { const content = '# Fixture\nCanonical local documentation.\n'; const sourcePath = `docs/${locale}/fixture.md`; write(sourcePath, content); return { schema: 'xtend.mcp.docs-resource.v1', locale, slug: 'fixture', uri: `xtend://docs/${locale}/fixture`, sourcePath, content, sha256: hash(content), bytes: Buffer.byteLength(content) }; });
  const menu = JSON.stringify([{ slug: 'fixture' }]); write('docs/menu.json', menu);
  for (const source of backendSources) write(source, '// Backend fixture.\n');
  write('xtendrmt/kernel/rmt-kernel-sources.json', '{}');
  write('xtendrmt/rmt-kernel-module-manifest.json', {
    sourceManifest: { path: 'xtendrmt/kernel/rmt-kernel-sources.json', sha256: hash('{}') },
    canonicalSources: backendSources.filter(name => /^(?:xtendrmt|components|xtend-maraca)\//u.test(name)),
    sourceModules: ['xtendrmt/rmt-action-effect-runtime.js', 'xtendrmt/rmt-event-routing-runtime.js', 'xtendrmt/rmt-surface-resource-graph-runtime.js'].map(sourcePath => ({ sourcePath, sourceSha256: hash('// Backend fixture.\n') })),
    sourceArtifacts: ['xtendrmt/rmt-core.esm.js', 'xtendrmt/rmt-runtime.esm.js', 'xtendrmt/rmt-runtime.browser.js'].map(path => ({ path, sha256: hash('// Backend fixture.\n') }))
  });
  const canonical = 'Canonical fixture source.\n'; write('tools/fixture.js', canonical);
  const kit = new Map([
    ['rmt-ai-kit.compact.md', 'Compact fixture.\n'], ['rmt-ai-kit.guardrails.json', '{}'], ['rmt-ai-kit.prompts.md', 'Fixture prompts.\n'],
    ['rmt-ai-kit.recipes.jsonl', ''], ['rmt-ai-kit.reference.jsonl', ''],
    ['rmt-ai-kit.manifest.json', JSON.stringify({ kitSchema: 'xtend.rmt.ai-developer-kit.v1', sourceHashes: [{ path: 'tools/fixture.js', sha256: hash(canonical), bytes: Buffer.byteLength(canonical) }], recordCounts: { recipes: 0, reference: 0 } })]
  ]);
  for (const [name, bytes] of kit) { write(`tools/rmt-language/generated/rmt-ai-developer-kit/${name}`, bytes); write(`products/xtend-mcp/generated/rmt-ai-kit/${name}`, bytes); }
  const docsJsonl = docs.map(JSON.stringify).join('\n') + '\n'; write('products/xtend-mcp/generated/docs.jsonl', docsJsonl);
  write('products/xtend-mcp/generated/knowledge-manifest.json', { schema: 'xtend.mcp.knowledge-manifest.v1', docs: { count: docs.length, artifactSha256: hash(docsJsonl), menuSha256: hash(menu) }, rmtKit: { artifacts: Object.fromEntries([...kit].map(([name, bytes]) => [name, { sha256: hash(bytes), bytes: Buffer.byteLength(bytes) }])) } });
  return { root, output, canonical };
}

test('local deployment export binds canonical docs, kit and changed backend bytes without a GitHub-main claim', t => {
  const { root, output } = fixture(t), first = exportLocalBundle({ rootDir: root, outputDir: output });
  const descriptor = JSON.parse(fs.readFileSync(path.join(output, 'local-source.json'), 'utf8'));
  assert.equal(descriptor.version, '1.0.0'); assert.equal(descriptor.sourceKind, 'local-worktree'); assert.equal(descriptor.worktreeDirty, true);
  assert.equal(descriptor.sourceFingerprint, hash(JSON.stringify(localSourceIdentity(descriptor)))); assert.equal(first.snapshotId, descriptor.sourceFingerprint.slice(0, 40));
  assert.equal(exportLocalBundle({ rootDir: root, outputDir: output }).sourceFingerprint, first.sourceFingerprint);
  fs.appendFileSync(path.join(root, backendSources[0]), '// Fixed backend.\n');
  assert.notEqual(exportLocalBundle({ rootDir: root, outputDir: output }).sourceFingerprint, first.sourceFingerprint);
});
test('stale canonical documentation and AI-kit provenance cannot replace a previously valid local export', t => {
  const { root, output, canonical } = fixture(t); exportLocalBundle({ rootDir: root, outputDir: output });
  const descriptor = fs.readFileSync(path.join(output, 'local-source.json'));
  const doc = path.join(root, 'docs/de/fixture.md'), original = fs.readFileSync(doc);
  fs.appendFileSync(doc, 'Changed source.\n'); assert.throws(() => exportLocalBundle({ rootDir: root, outputDir: output }), /documentation is stale/);
  assert.deepEqual(fs.readFileSync(path.join(output, 'local-source.json')), descriptor); fs.writeFileSync(doc, original);
  fs.writeFileSync(path.join(root, 'tools/fixture.js'), canonical + 'Changed source.\n');
  assert.throws(() => exportLocalBundle({ rootDir: root, outputDir: output }), /AI kit source is stale/);
  assert.deepEqual(fs.readFileSync(path.join(output, 'local-source.json')), descriptor);
  fs.writeFileSync(path.join(root, 'tools/fixture.js'), canonical);
  fs.appendFileSync(path.join(root, 'xtendrmt/rmt-event-routing-runtime.js'), '// Changed without a kernel rebuild.\n');
  assert.throws(() => exportLocalBundle({ rootDir: root, outputDir: output }), /Kernel source membership is stale/);
  assert.deepEqual(fs.readFileSync(path.join(output, 'local-source.json')), descriptor);
});
test('local deployment export refuses to overwrite the source checkout', t => {
  const { root } = fixture(t); assert.throws(() => exportLocalBundle({ rootDir: root, outputDir: root }), /must not replace/);
});

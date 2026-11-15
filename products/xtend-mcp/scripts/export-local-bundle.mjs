#!/usr/bin/env node

// Deployment artifact for the separately hosted read-only knowledge service.
// It contains no credentials and makes no claim that a dirty worktree is GitHub main.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const kitRoot = 'tools/rmt-language/generated/rmt-ai-developer-kit';
const bundleRoot = 'products/xtend-mcp/generated';
const kitFiles = ['rmt-ai-kit.compact.md', 'rmt-ai-kit.guardrails.json', 'rmt-ai-kit.manifest.json', 'rmt-ai-kit.prompts.md', 'rmt-ai-kit.recipes.jsonl', 'rmt-ai-kit.reference.jsonl'];
const artifactFiles = ['knowledge-manifest.json', 'docs.jsonl', ...kitFiles.map(name => `rmt-ai-kit/${name}`)];
export const backendSources = Object.freeze([
  'tools/rmt-language/classic-compiler.js', 'tools/rmt-language/classic-semantic-rules.js',
  'tools/rmt-language/vnext-compiler.js', 'tools/rmt-language/action-execution-lowering.js',
  'xtend-maraca/index.js', 'xtend-maraca/plan-runtime.mjs',
  'xtendrmt/rmt-action-effect-runtime.js', 'xtendrmt/rmt-event-routing-runtime.js',
  'xtendrmt/rmt-surface-resource-graph-runtime.js', 'xtendrmt/kernel/rmt-kernel-sources.json',
  'xtendrmt/rmt-kernel-module-manifest.json', 'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js', 'xtendrmt/rmt-runtime.browser.js',
  'xtendrmt/rmt-dom-descriptor-renderer.js', 'xtendrmt/rmt-dom-descriptor-renderer.d.ts'
]);
export const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export function localSourceIdentity(source) {
  return { format: source.format, version: source.version, sourceKind: source.sourceKind, repository: source.repository,
    baseCommit: source.baseCommit, worktreeDirty: source.worktreeDirty, files: source.files };
}
function safeRelative(relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Invalid bundle source path.');
  return relative;
}
function canonicalSource(root, relative) {
  const file = path.join(root, safeRelative(relative));
  if (!fs.lstatSync(file).isFile() || !fs.realpathSync(file).startsWith(root + path.sep)) throw new Error(`Source is not a contained regular file: ${relative}`);
  return Buffer.from(fs.readFileSync(file, 'utf8').replace(/\r\n/gu, '\n'));
}
function markdownPaths(root, prefix) {
  return fs.readdirSync(path.join(root, prefix), { withFileTypes: true }).flatMap(entry => {
    const name = `${prefix}/${entry.name}`;
    return entry.isDirectory() ? markdownPaths(root, name) : entry.isFile() && name.endsWith('.md') ? [name] : [];
  }).sort();
}
function verifyKernelCapture(root) {
  const registry = 'xtendrmt/kernel/rmt-kernel-sources.json';
  const manifest = JSON.parse(canonicalSource(root, 'xtendrmt/rmt-kernel-module-manifest.json'));
  if (manifest.sourceManifest?.path !== registry || manifest.sourceManifest.sha256 !== hash(canonicalSource(root, registry))) throw new Error('Kernel manifest is stale against its source registry.');
  if (!Array.isArray(manifest.canonicalSources) || !manifest.canonicalSources.length || manifest.canonicalSources.length > 1000 || !Array.isArray(manifest.sourceModules)) throw new Error('Kernel manifest is missing its curated canonical source membership.');
  const sources = [...new Set(manifest.canonicalSources)];
  for (const relative of sources) {
    safeRelative(relative);
    if (!/^(?:xtendrmt|components|xtend-maraca)\//u.test(relative) || !/\.(?:js|mjs|json|d\.ts)$/u.test(relative)) throw new Error('Kernel canonical membership contains an unsupported source path.');
  }
  for (const entry of manifest.sourceModules) {
    if (!sources.includes(entry.sourcePath) || entry.sourceSha256 !== hash(canonicalSource(root, entry.sourcePath))) throw new Error(`Kernel source membership is stale: ${entry.sourcePath}`);
  }
  if (!Array.isArray(manifest.sourceArtifacts) || !manifest.sourceArtifacts.length || manifest.sourceArtifacts.length > 100) throw new Error('Kernel manifest is missing its output membership.');
  for (const entry of manifest.sourceArtifacts) {
    const relative = safeRelative(entry.path);
    if (!relative.startsWith('xtendrmt/') || !/\.(?:js|mjs|json|d\.ts)$/u.test(relative) || entry.sha256 !== hash(canonicalSource(root, relative))) throw new Error(`Kernel runtime output is stale: ${relative}`);
    sources.push(relative);
  }
  return [...new Set(sources)];
}

export function exportLocalBundle({ rootDir = defaultRoot, outputDir } = {}) {
  if (!outputDir) throw new Error('An explicit output directory is required.');
  const root = fs.realpathSync(rootDir), target = path.resolve(outputDir);
  if (root === target || root.startsWith(target + path.sep)) throw new Error('The output must not replace the source checkout or its parent.');
  const kernelSources = verifyKernelCapture(root);
  const bytes = new Map(), sourcePaths = new Set(['docs/menu.json', ...backendSources]);
  kernelSources.forEach(relative => sourcePaths.add(relative));
  for (const name of artifactFiles) bytes.set(name, fs.readFileSync(path.join(root, bundleRoot, name)));
  const manifest = JSON.parse(bytes.get('knowledge-manifest.json')), kit = JSON.parse(bytes.get('rmt-ai-kit/rmt-ai-kit.manifest.json'));
  if (hash(bytes.get('docs.jsonl')) !== manifest.docs?.artifactSha256) throw new Error('Generated documentation hash mismatch.');
  const docs = bytes.get('docs.jsonl').toString('utf8').trim().split('\n').map(JSON.parse);
  const sourceDocs = ['docs/de', 'docs/en'].flatMap(prefix => markdownPaths(root, prefix)).sort();
  if (docs.length !== manifest.docs.count || JSON.stringify(docs.map(doc => doc.sourcePath).sort()) !== JSON.stringify(sourceDocs)) throw new Error('Generated documentation does not cover the canonical Markdown sources.');
  for (const doc of docs) {
    const content = canonicalSource(root, doc.sourcePath);
    if (content.toString('utf8') !== doc.content || hash(content) !== doc.sha256 || content.length !== doc.bytes) throw new Error(`Generated documentation is stale: ${doc.sourcePath}`);
    sourcePaths.add(doc.sourcePath);
  }
  if (hash(canonicalSource(root, 'docs/menu.json')) !== manifest.docs.menuSha256) throw new Error('Generated documentation menu is stale.');
  if (!Array.isArray(kit.sourceHashes) || kit.sourceHashes.length === 0) throw new Error('The AI kit has no canonical source provenance.');
  for (const source of kit.sourceHashes) {
    const content = canonicalSource(root, source.path);
    if (hash(content) !== source.sha256 || content.length !== source.bytes) throw new Error(`AI kit source is stale: ${source.path}`);
    sourcePaths.add(source.path);
  }
  for (const name of kitFiles) {
    const bundled = bytes.get(`rmt-ai-kit/${name}`), canonical = fs.readFileSync(path.join(root, kitRoot, name)), expected = manifest.rmtKit?.artifacts?.[name];
    if (!canonical.equals(bundled) || hash(bundled) !== expected?.sha256 || bundled.length !== expected?.bytes) throw new Error(`Bundled AI kit differs from its canonical artifact: ${name}`);
    sourcePaths.add(`${kitRoot}/${name}`);
  }
  for (const relative of [...sourcePaths].sort()) bytes.set(`sources/${relative}`, canonicalSource(root, relative));
  const source = { format: 1, version: '1.0.0', sourceKind: 'local-worktree', repository: 'konnilabs/xtend',
    baseCommit: execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    worktreeDirty: Boolean(execFileSync('git', ['-C', root, 'status', '--porcelain', '--untracked-files=normal'], { encoding: 'utf8' }).trim()),
    files: [...bytes].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([relative, content]) => ({ path: relative, bytes: content.length, sha256: hash(content) })) };
  source.sourceFingerprint = hash(JSON.stringify(localSourceIdentity(source)));
  source.snapshotId = source.sourceFingerprint.slice(0, 40);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const staged = fs.mkdtempSync(path.join(path.dirname(target), '.xtend-local-bundle-'));
  const backup = `${target}.previous-${crypto.randomUUID()}`;
  let previous = false;
  try {
    for (const [relative, content] of bytes) { const file = path.join(staged, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); }
    fs.writeFileSync(path.join(staged, 'local-source.json'), JSON.stringify(source, null, 2) + '\n');
    if (fs.existsSync(target)) { fs.renameSync(target, backup); previous = true; }
    try { fs.renameSync(staged, target); } catch (error) { if (previous) fs.renameSync(backup, target); throw error; }
    if (previous) fs.rmSync(backup, { recursive: true, force: true });
  } finally { fs.rmSync(staged, { recursive: true, force: true }); }
  return { outputDir: target, snapshotId: source.snapshotId, sourceFingerprint: source.sourceFingerprint, baseCommit: source.baseCommit, worktreeDirty: source.worktreeDirty, files: bytes.size, docs: docs.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2), index = args.indexOf('--out'), sourceIndex = args.indexOf('--source-root');
  try { console.log(JSON.stringify(exportLocalBundle({ outputDir: index >= 0 ? args[index + 1] : undefined, rootDir: sourceIndex >= 0 ? args[sourceIndex + 1] : defaultRoot }), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

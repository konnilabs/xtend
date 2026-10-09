'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const tar = require('tar');
const { isDeepStrictEqual } = require('node:util');
const { check, readJson, relativePath, loadInventory } = require('./inventory.cjs');
const { selectRelease } = require('./selection.cjs');
const digest = bytes => `sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`;
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const objectDigest = value => digest(JSON.stringify(canonical(value)));
const metadata = manifest => structuredClone(manifest);
function artifactFile(directory, file) {
  relativePath(file);
  const root = fs.realpathSync(directory), target = path.join(root, file);
  check(fs.lstatSync(target).isFile() && fs.realpathSync(target) === target, `Artifact must be a regular contained file: ${file}`);
  return target;
}
async function inspectTarball(file) {
  const files = [], names = new Set();
  let manifestBytes, total = 0, inspectionError;
  await tar.t({ file, strict: true, onReadEntry(entry) {
    try {
    check(entry.path.startsWith('package/'), `Archive path outside package/: ${entry.path}`);
    const name = entry.path.slice(8).replace(/\/$/, '');
    if (!name && entry.type === 'Directory') return;
    relativePath(name);
    check(!name.split('/').some(part => ['.git', '.npmrc', 'node_modules'].includes(part)), `Forbidden archive file: ${name}`);
    check(['File', 'Directory'].includes(entry.type), `Archive links/special files forbidden: ${name}`);
    if (entry.type === 'Directory') return;
    check(!names.has(name), `Duplicate archive file: ${name}`); names.add(name);
    total += entry.size;
    check(files.length < 50000 && total <= 512 * 1024 * 1024, 'Archive exceeds inspection budget');
    const record = { path: name, size: entry.size, integrity: null };
    const hash = crypto.createHash('sha512');
    entry.on('data', chunk => hash.update(chunk));
    entry.on('end', () => { record.integrity = `sha512-${hash.digest('base64')}`; });
    files.push(record);
    if (name === 'package.json') {
      check(entry.size <= 4 * 1024 * 1024, 'Oversized package.json');
      const chunks = []; entry.on('data', chunk => chunks.push(chunk));
      entry.on('end', () => { manifestBytes = Buffer.concat(chunks); });
    }
    } catch (error) { inspectionError ||= error; entry.resume(); }
  } });
  if (inspectionError) throw inspectionError;
  check(manifestBytes, 'Archive package.json missing');
  return { manifest: JSON.parse(manifestBytes.toString('utf8')), files: files.sort((a, b) => a.path.localeCompare(b.path)) };
}
function checkEntrypoints(manifest, files) {
  const names = new Set(files.map(entry => entry.path));
  function target(value) {
    if (value === null) return;
    if (Array.isArray(value)) { value.forEach(target); return; }
    if (value && typeof value === 'object') { Object.values(value).forEach(target); return; }
    check(typeof value === 'string', 'Invalid entrypoint');
    const file = value.replace(/^\.\//, '');
    if (file.includes('*')) {
      const pattern = new RegExp(`^${file.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+')}\u0024`);
      check([...names].some(name => pattern.test(name)), `Missing wildcard entrypoint: ${file}`);
    } else { relativePath(file); check(names.has(file), `Missing export/bin/type/file: ${file}`); }
  }
  for (const key of ['exports', 'bin', 'main', 'module', 'types', 'typings']) if (manifest[key]) target(manifest[key]);
  check(names.has('package.json') && names.has('README.md'), `Required package metadata/files missing: ${manifest.name}`);
}
function releaseSetIntegrity(manifest) {
  return objectDigest({ sourceSha: manifest.sourceSha, toolchain: manifest.toolchain, edges: manifest.edges,
    selection: manifest.selection, registryDependencies: manifest.registryDependencies,
    ...(manifest.candidateBinding ? { candidateBinding: manifest.candidateBinding } : {}),
    packages: manifest.packages.map(({ name, version, group, file, size, integrity }) => ({ name, version, group, file, size, integrity })) });
}
async function verifyArtifact({ directory, manifestIntegrity, sourceSha, rootDir, requireCanary = true, selection: requestedSelection }) {
  check(typeof directory === 'string' && directory.length > 0, 'Artifact directory required');
  check(/^sha512-[A-Za-z0-9+/]{86}==$/.test(manifestIntegrity || ''), 'Reviewed external manifest SHA-512 required');
  check(/^[a-f0-9]{40}$/.test(sourceSha || ''), 'Expected full source SHA required');
  const manifestBytes = fs.readFileSync(artifactFile(directory, 'release-manifest.json'));
  check(digest(manifestBytes) === manifestIntegrity, 'Manifest integrity mismatch');
  const manifest = JSON.parse(manifestBytes);
  check(manifest.schema === 'xtend.release.artifact.v1' && manifest.sourceSha === sourceSha, 'Artifact schema/source mismatch');
  const inventory = loadInventory(rootDir);
  const scope = selectRelease(inventory, manifest.selection);
  if (requestedSelection !== undefined) check(isDeepStrictEqual(scope.selection, selectRelease(inventory, requestedSelection).selection),
    'Requested release selection differs from immutable artifact');
  const mcpSelected = scope.order.includes('@ccslabs/xtend-mcp');
  const root = readJson(path.join(rootDir, 'package.json'));
  const toolchain = { node: fs.readFileSync(path.join(rootDir, '.nvmrc'), 'utf8').trim(), npm: root.packageManager.replace(/^npm@/, '') };
  check(isDeepStrictEqual(manifest.toolchain, toolchain), 'Artifact toolchain differs from committed pins');
  check(manifest.buildEvidence?.file && manifest.buildEvidence?.integrity, 'Explicit build evidence required');
  const buildBytes = fs.readFileSync(artifactFile(directory, manifest.buildEvidence.file));
  check(digest(buildBytes) === manifest.buildEvidence.integrity, 'Build evidence integrity mismatch');
  const buildEvidence = JSON.parse(buildBytes);
  check(buildEvidence.schema === 'xtend.release.build.v1' && buildEvidence.sourceSha === sourceSha &&
    isDeepStrictEqual(buildEvidence.toolchain, toolchain) && (!mcpSelected || buildEvidence.mcpKnowledgeGenerated === true &&
    buildEvidence.mcpKnowledgeChecked === true), 'Explicit MCP knowledge generation/check must precede packing');
  check(Array.isArray(manifest.packages) && manifest.packages.length === scope.order.length, 'Artifact package set incomplete');
  const registryDependencies = Object.hasOwn(manifest, 'registryDependencies') ? manifest.registryDependencies : [];
  check(Array.isArray(registryDependencies) && registryDependencies.length === scope.registryDependencyNames.length &&
    new Set(registryDependencies.map(entry => entry.name)).size === registryDependencies.length,
    'Registry dependency closure incomplete/duplicate');
  for (const entry of registryDependencies) {
    const expected = inventory.packages.find(item => item.name === entry.name);
    check(expected && scope.registryDependencyNames.includes(entry.name) && entry.version === expected.version && entry.group === expected.group &&
      /^sha512-[A-Za-z0-9+/]{86}==$/.test(entry.integrity || '') && /^[a-f0-9]{40}$/.test(entry.sourceSha || '') &&
      Object.keys(entry).every(key => ['name', 'version', 'group', 'integrity', 'sourceSha'].includes(key)),
      `Invalid pinned registry dependency: ${entry.name}`);
  }
  check(isDeepStrictEqual(canonical(manifest.edges), canonical(inventory.edges)), 'Artifact dependency edges mismatch');
  const names = new Set(), tarballs = new Set(), inspected = [];
  for (const entry of manifest.packages) {
    const expected = inventory.packages.find(item => item.name === entry.name);
    check(expected && scope.order.includes(entry.name) && !names.has(entry.name), `Unexpected/duplicate artifact package: ${entry.name}`); names.add(entry.name);
    check(entry.version === expected.version && entry.group === expected.group, `Artifact version/group mismatch: ${entry.name}`);
    check(typeof entry.file === 'string' && entry.file.endsWith('.tgz') && !tarballs.has(entry.file), 'Duplicate/invalid tarball path'); tarballs.add(entry.file);
    const file = artifactFile(directory, entry.file), bytes = fs.readFileSync(file);
    check(bytes.length === entry.size && digest(bytes) === entry.integrity, `Tarball size/integrity mismatch: ${entry.name}`);
    const content = await inspectTarball(file);
    check(isDeepStrictEqual(canonical(metadata(content.manifest)), canonical(metadata(expected.manifest))), `Packed metadata differs from source: ${entry.name}`);
    check(isDeepStrictEqual(content.files, entry.files), `Packed file inventory mismatch: ${entry.name}`);
    checkEntrypoints(content.manifest, content.files);
    inspected.push({ ...entry, absoluteFile: file });
  }
  const tarballSetIntegrity = releaseSetIntegrity(manifest);
  if (requireCanary) {
    check(manifest.canary?.file && manifest.canary?.integrity, 'Bound canary evidence required');
    const bytes = fs.readFileSync(artifactFile(directory, manifest.canary.file));
    check(digest(bytes) === manifest.canary.integrity, 'Canary evidence integrity mismatch');
    const evidence = JSON.parse(bytes);
    check(evidence.schema === 'xtend.release.canary.v1' && evidence.sourceSha === sourceSha && evidence.ok === true &&
      evidence.tarballSetIntegrity === tarballSetIntegrity && isDeepStrictEqual(evidence.toolchain, toolchain), 'Canary source/toolchain/tarball binding mismatch');
    check(evidence.packages?.length === inspected.length && new Set(evidence.packages.map(item => item.name)).size === inspected.length,
      'Canary package set incomplete/duplicate');
    for (const entry of inspected) {
      const result = evidence.packages.find(item => item.name === entry.name);
      check(result && result.integrity === entry.integrity && result.consumerInstall === true && result.entrypoints === true &&
        result.types === true && result.bin === true && result.files === true, `Incomplete canary: ${entry.name}`);
    }
    check(isDeepStrictEqual(canonical(evidence.registryDependencies ?? []), canonical(registryDependencies.map(entry => ({ ...entry, consumerInstall: true })))),
      'Canary registry dependency identity/integrity binding mismatch');
    check((!mcpSelected || evidence.mcpKnowledgeGenerated === true && evidence.mcpKnowledgeChecked === true) && evidence.runtimeImports === true,
      'MCP knowledge build/check and actual consumer runtime evidence required');
  }
  return { manifest, manifestIntegrity, sourceSha, toolchain, tarballSetIntegrity, packages: inspected,
    ...scope, registryDependencies, inventory, buildEvidence };
}
module.exports = { digest, objectDigest, releaseSetIntegrity, artifactFile, metadata, inspectTarball, checkEntrypoints, verifyArtifact };

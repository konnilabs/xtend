'use strict';
// Test-only miniature archives, never a production packer or release artifact.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const tar = require('tar');
const specification = require('../../scripts/release/inventory.json');
const { loadInventory, REPOSITORY } = require('../../scripts/release/inventory.cjs');
const { selectRelease } = require('../../scripts/release/selection.cjs');
const { digest, releaseSetIntegrity, inspectTarball, verifyArtifact } = require('../../scripts/release/artifact.cjs');
const sourceSha = 'a'.repeat(40);
const repo = path.resolve(__dirname, '../..');
function write(file, json) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`); }
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-release-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const rootDir = path.join(directory, 'source'), artifactDir = path.join(directory, 'artifact');
  fs.mkdirSync(artifactDir, { recursive: true });
  const originalRoot = require('../../package.json');
  const names = new Set(specification.packages.map(entry => entry.name));
  for (const entry of specification.packages) {
    const original = JSON.parse(fs.readFileSync(path.join(repo, entry.path, 'package.json')));
    const manifest = { name: entry.name, version: original.version, private: false, type: 'commonjs',
      repository: { type: 'git', url: REPOSITORY, ...(entry.path === '.' ? {} : { directory: entry.path }) },
      publishConfig: { access: 'public', provenance: true, tag: 'latest' },
      exports: { '.': { types: './index.d.ts', default: './index.cjs' }, './package.json': './package.json' },
      main: './index.cjs', types: './index.d.ts', files: ['index.cjs', 'index.d.ts', 'README.md'] };
    for (const key of ['dependencies', 'optionalDependencies', 'peerDependencies', 'peerDependenciesMeta']) {
      if (original[key]) manifest[key] = Object.fromEntries(Object.entries(original[key]).filter(([name]) => names.has(name)));
    }
    if (entry.path === '.') Object.assign(manifest, { workspaces: [...originalRoot.workspaces], scopedPackages: originalRoot.scopedPackages,
      packageManager: 'npm@11.17.0' });
    write(path.join(rootDir, entry.path, 'package.json'), manifest);
    fs.writeFileSync(path.join(rootDir, entry.path, 'index.cjs'), 'module.exports = {value:42};\n');
    fs.writeFileSync(path.join(rootDir, entry.path, 'index.d.ts'), 'export declare const value: number;\n');
    fs.writeFileSync(path.join(rootDir, entry.path, 'README.md'), '# Test fixture\n');
  }
  fs.writeFileSync(path.join(rootDir, '.nvmrc'), `${process.versions.node}\n`);
  return { directory, rootDir, artifactDir, specification: structuredClone(specification), sourceSha,
    ledgerFile: path.join(directory, 'results/ledger.json'),
    mutate(packagePath, update) { const file = path.join(rootDir, packagePath, 'package.json'); const data = JSON.parse(fs.readFileSync(file)); update(data); write(file, data); } };
}
async function packedFixture(t, { selection, beforePack = () => {} } = {}) {
  const f = fixture(t); beforePack(f);
  const inventory = loadInventory(f.rootDir), scope = selectRelease(inventory, selection);
  const manifest = { schema: 'xtend.release.artifact.v1', sourceSha,
    toolchain: { node: process.versions.node, npm: '11.17.0' }, edges: inventory.edges, packages: [],
    selection: scope.selection, registryDependencies: scope.registryDependencyNames.map(name => {
      const entry = inventory.packages.find(item => item.name === name);
      return { name, version: entry.version, group: entry.group, integrity: digest(`old registry fixture: ${name}`), sourceSha: 'b'.repeat(40) };
    }) };
  const build = { schema: 'xtend.release.build.v1', sourceSha, toolchain: manifest.toolchain,
    mcpKnowledgeGenerated: true, mcpKnowledgeChecked: true };
  write(path.join(f.artifactDir, 'build.json'), build);
  manifest.buildEvidence = { file: 'build.json', integrity: digest(fs.readFileSync(path.join(f.artifactDir, 'build.json'))) };
  for (const [index, entry] of inventory.packages.entries()) {
    if (!scope.order.includes(entry.name)) continue;
    const packRoot = path.join(f.directory, `fixture-${index}`), packageDir = path.join(packRoot, 'package');
    fs.mkdirSync(packageDir, { recursive: true });
    for (const file of ['package.json', 'index.cjs', 'index.d.ts', 'README.md']) fs.copyFileSync(path.join(f.rootDir, entry.path, file), path.join(packageDir, file));
    const file = `${index}.tgz`, target = path.join(f.artifactDir, file);
    await tar.c({ gzip: true, file: target, cwd: packRoot }, ['package']);
    const bytes = fs.readFileSync(target), content = await inspectTarball(target);
    manifest.packages.push({ name: entry.name, version: entry.version, group: entry.group, file,
      size: bytes.length, integrity: digest(bytes), files: content.files });
  }
  const tarballSetIntegrity = releaseSetIntegrity(manifest);
  const canary = { schema: 'xtend.release.canary.v1', sourceSha, toolchain: manifest.toolchain, tarballSetIntegrity,
    ok: true, runtimeImports: true, mcpKnowledgeGenerated: true, mcpKnowledgeChecked: true,
    registryDependencies: manifest.registryDependencies.map(entry => ({ ...entry, consumerInstall: true })),
    packages: manifest.packages.map(entry => ({ name: entry.name, integrity: entry.integrity,
      consumerInstall: true, entrypoints: true, types: true, files: true, bin: true })) };
  write(path.join(f.artifactDir, 'canary.json'), canary);
  manifest.canary = { file: 'canary.json', integrity: digest(fs.readFileSync(path.join(f.artifactDir, 'canary.json'))) };
  write(path.join(f.artifactDir, 'release-manifest.json'), manifest);
  f.manifest = manifest; f.canary = canary;
  f.integrity = () => digest(fs.readFileSync(path.join(f.artifactDir, 'release-manifest.json')));
  f.reseal = () => write(path.join(f.artifactDir, 'release-manifest.json'), manifest);
  f.verify = (options = {}) => verifyArtifact({ directory: f.artifactDir, manifestIntegrity: f.integrity(), sourceSha, rootDir: f.rootDir, ...options });
  f.artifact = await f.verify(); return f;
}
function registryFixture(artifact) {
  const versions = new Map(), packages = new Map(), calls = [];
  for (const entry of [...artifact.packages, ...(artifact.registryDependencies || [])]) packages.set(entry.name, { name: entry.name, versions: [], 'dist-tags': {} });
  function installed(entry, tag) {
    const expected = artifact.inventory.packages.find(item => item.name === entry.name)?.manifest || {};
    const value = { ...structuredClone(expected), name: entry.name, version: entry.version, dist: { integrity: entry.integrity,
      attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/test', provenance: { predicateType: 'https://slsa.dev/provenance/v1' } } },
      provenanceStatements: [{ subject: [{ digest: { sha512: Buffer.from(entry.integrity.slice(7), 'base64').toString('hex') } }],
        predicate: { buildDefinition: { resolvedDependencies: [{ uri: 'git+https://github.com/konnilabs/xtend', digest: { gitCommit: entry.sourceSha || artifact.sourceSha } }] } } }] };
    versions.set(entry.name, value);
    const packument = packages.get(entry.name) || { name: entry.name, versions: [], 'dist-tags': {} };
    if (!packument.versions.includes(entry.version)) packument.versions.push(entry.version);
    packument['dist-tags'][tag] = entry.version; packages.set(entry.name, packument);
  }
  return { versions, packages, calls, installed,
    registry: { async version(entry) { calls.push(['version', entry.name]); return versions.get(entry.name) || null; },
      async package(entry) { calls.push(['package', entry.name]); return packages.get(entry.name) || null; } },
    publisher: { async publish(entry, tag) { calls.push(['publish', entry.name, tag]); installed(entry, tag); },
      async tag(entry, tag) { calls.push(['tag', entry.name, tag]); packages.get(entry.name)['dist-tags'][tag] = entry.version; } } };
}
module.exports = { fixture, packedFixture, registryFixture, write, sourceSha, repo };

#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify, parseArgs } = require('node:util');
const { createRequire } = require('node:module');
const { verifyInstalledClosure, verifyResolution } = require('../../candidate-integrity.cjs');
const { verifyCandidateBinding, consumerScopes } = require('./candidates.cjs');
const { check } = require('./inventory.cjs');
const { verifyArtifact, digest } = require('./artifact.cjs');
const { buildCanaryIntegrity } = require('./contracts.cjs');
const { PROFILE, lanes } = require('./profile.cjs');
const { runNpm, npmAdapters } = require('./npm.cjs');
const { verifyRegistryDependency } = require('./publish.cjs');
const execute = promisify(execFile);
async function runInstalledScope({ scope, artifact, rootDir, npmCli, temporary, offline, outputFile, registry }) {
  const installedEntries = [...scope.packages, ...scope.registryPackages];
  const report = { ok: false, packages: [], registryDependencies: [], runtimeImports: false,
    resolution: false, mcpKnowledgeGenerated: false, mcpKnowledgeChecked: false };
  fs.mkdirSync(temporary);
  for (const entry of scope.registryPackages) await verifyRegistryDependency(artifact, entry, registry);
  const dependencies = Object.fromEntries([...scope.packages.map(entry => [entry.name, `file:${entry.absoluteFile}`]),
    ...scope.registryPackages.map(entry => [entry.name, entry.version])]);
  fs.writeFileSync(path.join(temporary, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies }));
  for (const entry of scope.packages) check(digest(fs.readFileSync(entry.absoluteFile)) === entry.integrity,
    'Artifact changed before ' + scope.id + ' consumer install');
  const install = await runNpm(npmCli, ['install', '--ignore-scripts', '--no-audit', '--fund=false',
    ...(offline ? ['--offline'] : []), '--cache', path.join(temporary, 'npm-cache')], temporary, 300000);
  check(install.status === 0, 'Clean ' + scope.id + ' consumer installation failed');
  const lockBytes = fs.readFileSync(path.join(temporary, 'package-lock.json')), lock = JSON.parse(lockBytes);
  verifyInstalledClosure(lock, scope.manifest, { app: scope.app, registryPackages: scope.registryPackages });
  verifyResolution(createRequire(path.join(temporary, 'package.json')), scope.manifest,
    path.join(temporary, 'node_modules'), scope.app);
  report.resolution = true;
  report.lockIntegrity = digest(Buffer.from(JSON.stringify(lock)));
  fs.writeFileSync(outputFile, lockBytes, { flag: 'wx' });
  const typeImports = [];
  for (const entry of installedEntries) {
    const installed = path.join(temporary, 'node_modules', entry.name);
    for (const file of entry.files || []) {
      const bytes = fs.readFileSync(path.join(installed, file.path));
      check(bytes.length === file.size && digest(bytes) === file.integrity, `Installed file changed: ${entry.name}/${file.path}`);
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(installed, 'package.json')));
    check(manifest.name === entry.name && manifest.version === entry.version, `Installed dependency identity mismatch: ${entry.name}`);
    const bins = typeof manifest.bin === 'string' ? { [entry.name.split('/')[1]]: manifest.bin } : manifest.bin || {};
    for (const name of Object.keys(bins)) check(fs.existsSync(path.join(temporary, 'node_modules/.bin', name)), `Installed bin missing: ${name}`);
    const exports = manifest.exports && Object.keys(manifest.exports).some(key => key.startsWith('.'))
      ? Object.keys(manifest.exports).filter(key => !key.includes('*')) : ['.'];
    const resolveScript = exports.map(key => `import.meta.resolve(${JSON.stringify(entry.name + (key === '.' ? '' : key.slice(1)))});`).join('\n');
    await execute(process.execPath, ['--input-type=module', '-e', resolveScript], { cwd: temporary, timeout: 30000 });
    typeImports.push(`import type * as P${typeImports.length} from ${JSON.stringify(entry.name)};`);
    if (entry.absoluteFile) report.packages.push({ name: entry.name, integrity: entry.integrity, consumerInstall: true, entrypoints: true,
      files: true, bin: true, types: false, resolution: true });
    else report.registryDependencies.push({ ...artifact.registryDependencies.find(item => item.name === entry.name), consumerInstall: true });
  }
  fs.writeFileSync(path.join(temporary, 'consumer.ts'), typeImports.join('\n'));
  await execute(process.execPath, [path.join(rootDir, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict',
    '--skipLibCheck', '--module', 'nodenext', '--moduleResolution', 'nodenext', '--target', 'es2022', 'consumer.ts'],
    { cwd: temporary, timeout: 60000 });
  report.packages.forEach(entry => { entry.types = true; });
  // Real imports are executed independently in each clean installed context.
  const smoke = `import {createRequire} from 'node:module';\nconst require=createRequire(import.meta.url);\n` +
    `const {JSDOM}=require(${JSON.stringify(require.resolve('jsdom', { paths: [rootDir] }))});const host=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://consumer.invalid/'});\n` +
    `for(const key of ['window','document','HTMLElement','customElements','CustomEvent','MutationObserver','Node','Element','CSSStyleSheet','ShadowRoot'])if(host.window[key])globalThis[key]=host.window[key];\n` +
    `try{for(const name of ${JSON.stringify(installedEntries.map(entry => entry.name))})await import(name);}finally{host.window.close();}\n`;
  fs.writeFileSync(path.join(temporary, 'smoke.mjs'), smoke);
  await execute(process.execPath, ['smoke.mjs'], { cwd: temporary, timeout: 60000, maxBuffer: 8 * 1024 * 1024 });
  report.runtimeImports = true;
  if (scope.packages.some(entry => entry.name === '@ccslabs/xtend-mcp')) {
    check(artifact.buildEvidence.mcpKnowledgeGenerated === true && artifact.buildEvidence.mcpKnowledgeChecked === true,
      'MCP knowledge producer generation/check required for installed SDK coverage');
    await execute(process.execPath, [path.join(rootDir, 'products/xtend-mcp/scripts/build-knowledge.mjs'), '--check', '--quiet'],
      { cwd: rootDir, timeout: 60000 });
    report.mcpKnowledgeGenerated = true; report.mcpKnowledgeChecked = true;
  }
  // Recheck both immutable install state and required live registry identities.
  verifyInstalledClosure(JSON.parse(fs.readFileSync(path.join(temporary, 'package-lock.json'))), scope.manifest,
    { app: scope.app, registryPackages: scope.registryPackages });
  verifyResolution(createRequire(path.join(temporary, 'package.json')), scope.manifest, path.join(temporary, 'node_modules'), scope.app);
  check(fs.readFileSync(path.join(temporary, 'package-lock.json')).equals(lockBytes), 'Consumer lock changed during installed tests');
  for (const entry of scope.registryPackages) await verifyRegistryDependency(artifact, entry, registry);
  report.ok = true;
  return report;
}
async function runConsumers({ artifact, rootDir, npmCli, buildEvidence = artifact.buildEvidence, outputFile, executeCanary = false, offline = false,
  registry = npmAdapters({ npmCli, cwd: rootDir }).registry }) {
  const plan = { sourceSha: artifact.sourceSha, tarballSetIntegrity: artifact.tarballSetIntegrity,
    packages: artifact.packages.map(entry => entry.name), registryDependencies: artifact.registryDependencies,
    actions: ['independent fresh installation and real installed tests of all ten exact SDK candidate archives',
      'separate fresh installation and real installed tests of selected publication archives plus pinned registry dependency closure',
      'shared candidate lock metadata/integrity and live isolated dependency resolution checks for both scopes',
      'installed file, export, runtime import, bin, TypeScript and explicit MCP checks; no lifecycle scripts'] };
  if (!executeCanary) return { mode: 'dry-run', ...plan };
  check(lanes.includes(process.versions.node), 'Core consumer must run on a committed Node lane');
  const npm = await runNpm(npmCli, ['--version'], rootDir);
  check(npm.status === 0 && npm.stdout.trim() === artifact.toolchain.npm, 'Canary npm pin mismatch');
  check(buildEvidence?.schema === 'xtend.release.build.v1' && buildEvidence.sourceSha === artifact.sourceSha &&
    buildEvidence.mcpKnowledgeGenerated === true && buildEvidence.mcpKnowledgeChecked === true,
    'Reviewed producer evidence for all-SDK prepack MCP generation/check required');
  check(typeof outputFile === 'string' && outputFile.length > 0, 'Core report output required');
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  const directory = path.dirname(artifact.packages[0].absoluteFile);
  const original = await verifyCandidateBinding(artifact, { directory, rootDir });
  const scopes = consumerScopes(artifact, original).map(scope => ({ ...scope,
    packages: scope.packages.map(entry => ({ ...entry, absoluteFile: path.join(directory, entry.file) })) }));
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-release-consumer-'));
  const report = { schema: 'xtend.release.canary.v1', profile: PROFILE, startedAt: new Date().toISOString(),
    runtime: { node: process.versions.node, npm: artifact.toolchain.npm }, ok: false, sourceSha: artifact.sourceSha,
    toolchain: artifact.toolchain, tarballSetIntegrity: artifact.tarballSetIntegrity,
    buildEvidenceIntegrity: buildCanaryIntegrity(buildEvidence), candidateSDK: null,
    mcpKnowledgeGenerated: false, mcpKnowledgeChecked: false, runtimeImports: false,
    resolution: false, packages: [], registryDependencies: [], error: null };
  try {
    report.candidateSDK = await runInstalledScope({ scope: scopes[0], artifact, rootDir, npmCli,
      temporary: path.join(temporary, 'candidate-sdk'), offline, registry,
      outputFile: path.join(path.dirname(outputFile), 'candidate-sdk-lock.json') });
    const selected = await runInstalledScope({ scope: scopes[1], artifact, rootDir, npmCli,
      temporary: path.join(temporary, 'selected-release'), offline, registry,
      outputFile: path.join(path.dirname(outputFile), 'consumer-lock.json') });
    Object.assign(report, selected);
  } catch (error) { report.error = error.message; throw error; }
  finally {
    try { report.finishedAt = new Date().toISOString(); fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' }); }
    finally { fs.rmSync(temporary, { recursive: true, force: true }); }
  }
  return report;
}
async function main() {
  const { values } = parseArgs({ options: { artifact: { type: 'string' }, 'manifest-integrity': { type: 'string' },
    'source-sha': { type: 'string' }, 'npm-cli': { type: 'string' },
    output: { type: 'string' }, execute: { type: 'boolean', default: false } } });
  const rootDir = path.resolve(__dirname, '../..');
  const artifact = await verifyArtifact({ directory: values.artifact, manifestIntegrity: values['manifest-integrity'],
    sourceSha: values['source-sha'], rootDir, requireCanary: false });
  if (values.execute) check(values.output, '--output required; evidence never overwrites an existing file');
  console.log(JSON.stringify(await runConsumers({ artifact, rootDir,
    npmCli: values['npm-cli'] || process.env.npm_execpath, outputFile: values.output, executeCanary: values.execute }), null, 2));
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { runConsumers };

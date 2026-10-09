#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify, parseArgs } = require('node:util');
const { check } = require('./inventory.cjs');
const { verifyArtifact, digest } = require('./artifact.cjs');
const { runNpm, npmAdapters } = require('./npm.cjs');
const { verifyRegistryDependency } = require('./publish.cjs');
const execute = promisify(execFile);
async function runConsumers({ artifact, rootDir, npmCli, buildEvidence = artifact.buildEvidence, outputFile, executeCanary = false, offline = false,
  registry = npmAdapters({ npmCli, cwd: rootDir }).registry }) {
  const dependenciesFromRegistry = artifact.registryDependencies || [];
  const mcpSelected = artifact.order.includes('@ccslabs/xtend-mcp');
  const installedEntries = [...artifact.packages, ...dependenciesFromRegistry];
  const plan = { sourceSha: artifact.sourceSha, tarballSetIntegrity: artifact.tarballSetIntegrity,
    packages: artifact.packages.map(entry => entry.name), registryDependencies: dependenciesFromRegistry,
    actions: ['fresh install of selected exact tarballs and pinned registry dependency closure without lifecycle scripts',
      'installed file integrity, export resolution, runtime imports, bin and TypeScript consumer checks', 'explicit MCP knowledge check when MCP is selected'] };
  if (!executeCanary) return { mode: 'dry-run', ...plan };
  check(process.versions.node === artifact.toolchain.node, 'Canary Node pin mismatch');
  const npm = await runNpm(npmCli, ['--version'], rootDir);
  check(npm.status === 0 && npm.stdout.trim() === artifact.toolchain.npm, 'Canary npm pin mismatch');
  check(buildEvidence?.schema === 'xtend.release.build.v1' && buildEvidence.sourceSha === artifact.sourceSha &&
    (!mcpSelected || buildEvidence.mcpKnowledgeGenerated === true && buildEvidence.mcpKnowledgeChecked === true),
    'Reviewed producer evidence for explicit prepack MCP generation/check required');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-release-consumer-'));
  const report = { schema: 'xtend.release.canary.v1', ok: false, sourceSha: artifact.sourceSha,
    toolchain: artifact.toolchain, tarballSetIntegrity: artifact.tarballSetIntegrity,
    buildEvidenceIntegrity: digest(JSON.stringify(buildEvidence)), mcpKnowledgeGenerated: mcpSelected && buildEvidence.mcpKnowledgeGenerated === true,
    mcpKnowledgeChecked: false, runtimeImports: false, packages: [], registryDependencies: [], error: null };
  try {
    for (const entry of dependenciesFromRegistry) await verifyRegistryDependency(artifact, entry, registry);
    const dependencies = Object.fromEntries([...artifact.packages.map(entry => [entry.name, `file:${entry.absoluteFile}`]),
      ...dependenciesFromRegistry.map(entry => [entry.name, entry.version])]);
    fs.writeFileSync(path.join(temporary, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies }));
    for (const entry of artifact.packages) check(digest(fs.readFileSync(entry.absoluteFile)) === entry.integrity, 'Artifact changed before consumer install');
    const install = await runNpm(npmCli, ['install', '--ignore-scripts', '--no-audit', '--fund=false',
      ...(offline ? ['--offline'] : []), '--cache', path.join(temporary, 'npm-cache')], temporary, 300000);
    check(install.status === 0, 'Clean tarball consumer installation failed');
    const lock = JSON.parse(fs.readFileSync(path.join(temporary, 'package-lock.json')));
    for (const entry of dependenciesFromRegistry) {
      const record = lock.packages?.[`node_modules/${entry.name}`];
      check(record?.version === entry.version && record.integrity === entry.integrity &&
        record.resolved?.startsWith('https://registry.npmjs.org/'), `Consumer registry dependency integrity mismatch: ${entry.name}`);
    }
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
        files: true, bin: true, types: false });
      else report.registryDependencies.push({ ...entry, consumerInstall: true });
    }
    fs.writeFileSync(path.join(temporary, 'consumer.ts'), typeImports.join('\n'));
    await execute(process.execPath, [path.join(rootDir, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict',
      '--skipLibCheck', '--module', 'nodenext', '--moduleResolution', 'nodenext', '--target', 'es2022', 'consumer.ts'],
      { cwd: temporary, timeout: 60000 });
    report.packages.forEach(entry => { entry.types = true; });
    // Execute all public root entrypoints in a real DOM host. This is a clean
    // installed consumer, with no source/workspace resolution fallback.
    const smoke = `import {createRequire} from 'node:module';\nconst require=createRequire(import.meta.url);\n` +
      `const {JSDOM}=require(${JSON.stringify(require.resolve('jsdom', { paths: [rootDir] }))});const host=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://consumer.invalid/'});\n` +
      `for(const key of ['window','document','HTMLElement','customElements','CustomEvent','MutationObserver','Node','Element','CSSStyleSheet','ShadowRoot'])if(host.window[key])globalThis[key]=host.window[key];\n` +
      `try{for(const name of ${JSON.stringify(installedEntries.map(entry => entry.name))})await import(name);}finally{host.window.close();}\n`;
    fs.writeFileSync(path.join(temporary, 'smoke.mjs'), smoke);
    await execute(process.execPath, ['smoke.mjs'], { cwd: temporary, timeout: 60000, maxBuffer: 8 * 1024 * 1024 });
    report.runtimeImports = true;
    if (mcpSelected) {
      await execute(process.execPath, [path.join(rootDir, 'products/xtend-mcp/scripts/build-knowledge.mjs'), '--check', '--quiet'],
        { cwd: rootDir, timeout: 60000 });
      report.mcpKnowledgeChecked = true;
    }
    report.ok = true;
  } catch (error) { report.error = error.message; throw error; }
  finally {
    try { fs.mkdirSync(path.dirname(outputFile), { recursive: true }); fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' }); }
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

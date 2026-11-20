'use strict';
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto'), { createRequire } = require('node:module'), { pathToFileURL } = require('node:url');
const rootDir = path.resolve(__dirname, '../../../..');
const source = path.relative(rootDir, path.join(__dirname, 'source.rmtx')).replace(/\\/gu, '/');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function sourceFiles() {
  const files = new Set(require('../../native-component-catalog/source-files.cjs').sourceFiles());
  for (const file of ['source.rmtx', 'shared.rmt', 'runtime-test.cjs']) files.add(path.relative(rootDir, path.join(__dirname, file)).replace(/\\/gu, '/'));
  files.add('fabric/xtend-fabric.js');
  const catalog = JSON.parse(fs.readFileSync(path.join(rootDir, 'tools/rmt-language/rmtx-native-components-v2.json')));
  for (const row of catalog.components.filter(row => ['x-header', 'x-button'].includes(row.tag))) for (const file of [row.module, row.managedModule, ...row.dependencies.map(item => item.module)]) files.add(file);
  return [...files].sort();
}
async function waitFor(predicate, message) {
  for (let index = 0; index < 300; index++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 5)); }
  throw new Error(message);
}
async function run() {
  if (!process.env.XTEND_A065_TEST_PEERS) throw new Error('XTEND_A065_TEST_PEERS must identify the installed isolated runtime peers.');
  const peers = createRequire(path.join(path.resolve(process.env.XTEND_A065_TEST_PEERS), 'package.json'));
  const { JSDOM, VirtualConsole } = peers('jsdom');
  const { buildMaracaProjectBundle } = require('../../../../xtend-maraca');
  const { createXtendFabric } = require('../../../../fabric/xtend-fabric');
  const before = Object.fromEntries(sourceFiles().map(file => [file, hash(fs.readFileSync(path.join(rootDir, file)))]));
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-a065-runtime-')), saved = new Map(), pageErrors = [], names = [];
  let dom, entry, application, fabric;
  try {
    const built = buildMaracaProjectBundle({ source, project: true, sourceSyntax: 'rmtx', rmtxSyntaxVersion: '8.0.0', out: path.join(directory, 'build'),
      profile: 'production', orchestration: 'strict', kernel: 'strict', hydration: 'off', validation: 'off', transitions: 'off', services: false, pwa: false, lazy: false }, { rootDir });
    assert.equal(built.ok, true, built.status + JSON.stringify(built.diagnostics));
    assert.equal(built.schema, 'xtend.maraca.project-build-result.v1');
    assert.equal(built.project.dependencies.length, 2);
    assert.equal(built.project.effectiveSourceProfile.syntax, 'rmtx');
    const build = built.build;
    assert.equal(build.plan.schema, 'xtend.maraca.build-plan.v12');
    assert.equal(build.plan.orchestration.artifact.actions.actions.find(item => item.id === 'rename').inputs.find(item => item.name === 'value').type, 'string');
    names.push('regular production project build links real Classic State/Action declarations into Source8 Program6');
    const virtualConsole = new VirtualConsole(); virtualConsole.on('jsdomError', error => pageErrors.push(error.message));
    dom = new JSDOM('<!doctype html><main></main>', { pretendToBeVisual: true, url: 'https://xtend.test/project', virtualConsole });
    for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'SVGElement', 'navigator', 'MutationObserver', 'Event', 'CustomEvent', 'customElements', 'AbortController', 'AbortSignal', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) {
      saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
      Object.defineProperty(globalThis, key, { configurable: true, value: ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame'].includes(key) ? dom.window[key].bind(dom.window) : dom.window[key] });
    }
    dom.window.__XTendMaracaDisableAutoBoot = true;
    dom.window.matchMedia ||= () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    entry = await import(pathToFileURL(build.plan.outputs.entry).href);
    application = entry.createXtendMaraca(); fabric = createXtendFabric();
    const root = dom.window.document.querySelector('main');
    await application.boot({ root, fabric });
    const heading = root.querySelector('x-header'), button = root.querySelector('x-button');
    assert.ok(heading && button); assert.equal(heading.title, 'first'); assert.equal(root.querySelector('#project-value').textContent, 'first');
    names.push('emitted native ESM boots its actual shared Header/Button classes and displays imported Model state');
    const control = button.shadowRoot.querySelector('button'); assert.ok(control);
    control.click();
    await waitFor(() => application.facade.model.getState('title') === 'click', 'Native DTO did not execute the imported Classic Action through the real application.');
    await application.facade.whenXTensionsIdle();
    assert.equal(heading.title, 'click'); assert.equal(root.querySelector('#project-value').textContent, 'click');
    assert.strictEqual(root.querySelector('x-header'), heading); assert.strictEqual(root.querySelector('x-button'), button);
    names.push('actual native click DTO executes imported Classic Action and updates Model/DOM without replacing controlled hosts');
    await application.facade.dispatchCommand('rename', { value: 'external' });
    await application.facade.whenXTensionsIdle();
    assert.equal(heading.title, 'external'); assert.equal(root.querySelector('#project-value').textContent, 'external');
    names.push('the linked imported Action remains executable through the public application facade');
    await application.facade.dispatchCommand('focus', {});
    await application.facade.whenXTensionsIdle();
    const program = build.plan.orchestration.artifact;
    const command = program.render.nativeView.commands.find(item => item.action === 'focus' && item.ref === 'trigger');
    const fiber = program.kernel.scheduler.fibers.find(item => item.kind === 'component-command' && item.operation === command?.id);
    assert.ok(fiber); assert.ok(fabric.getFibers().some(item => item.id === fiber.id && item.status === 'completed' && typeof item.metadata?.schedulerJobId === 'string'));
    assert.equal(application.facade.snapshot().kernel.fallbackCount, 0);
    names.push('genuine compiled native focus Effect uses its exact Kernel fiber delegated to real Fabric');
    assert.deepEqual(pageErrors, []);
    const after = Object.fromEntries(sourceFiles().map(file => [file, hash(fs.readFileSync(path.join(rootDir, file)))]));
    assert.deepEqual(after, before, 'Inputs changed during the project CSR proof.');
    const files = build.bundleReport.bundleFiles.map(file => { const bytes = fs.readFileSync(path.join(path.dirname(build.plan.outputs.entry), file.fileName)); assert.equal(bytes.length, file.bytes); return { fileName: file.fileName, bytes: bytes.length, sha256: hash(bytes) }; });
    const report = { schema: 'xtend.rmt.project-runtime-acceptance.v1', format: 1, stage: 'A06.5-project-tooling-csr', node: process.version,
      mode: 'jsdom-native-esm', passed: true, cases: names.length, names, project: built.project, source, sources: before, pageErrors,
      compilerSchema: build.plan.rmt.compilerSchema, buildPlanSchema: build.plan.schema, programSchema: program.schema, delivery: { files, totalBytes: files.reduce((sum, file) => sum + file.bytes, 0) },
      realKernelFabricVerified: true, realClassicActionExecutionVerified: true, ssrAcceptancePerformed: false, acceptedForRelease: false };
    const output = process.argv.indexOf('--output'); if (output >= 0) fs.writeFileSync(path.resolve(process.argv[output + 1]), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ passed: report.passed, cases: report.cases, sources: Object.keys(before).length, names }));
    return report;
  } finally {
    application?.dispose(); await application?.facade.whenXTensionsIdle(); entry?.disposeXtendMaraca(); fabric?.dispose?.(); dom?.window.close();
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { run, sourceFiles };

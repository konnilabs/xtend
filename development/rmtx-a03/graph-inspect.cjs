'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const { createResourceGraphBinding } = require('../../tools/xtensions/resource-graph-binding');
async function inspect() {
  const { createRmtCore } = await import('../../xtendrmt/rmt-runtime.esm.js');
  const { createRmtKernelScheduler } = await import('../../xtendrmt/rmt-kernel-scheduler.js');
  const { createRmtSurfaceResourceGraphRuntime } = await import('../../xtendrmt/rmt-surface-resource-graph-runtime.js');
  const { createSurfaceController } = await import('../../components/xsurfacemanager-controller.js');
  const root = path.resolve(__dirname, '../..'), checked = [];
  const check = (name, callback) => { callback(); checked.push(name); };
  const scheduler = createRmtKernelScheduler({ preferPostTask: false });
  const kernel = createRmtCore({ scheduler }).rmt, container = {}, element = { contains: item => item === container };
  kernel.mountRoot('graph-reference', element);
  const surfaceController = createSurfaceController();
  const surfaceGraph = createRmtSurfaceResourceGraphRuntime({ surfaces: [{ id: 'panel', initialState: 'open' }], surfaceController, strict: true });
  surfaceGraph.materialize();
  const input = { kernel, surfaceGraph, surfaceController, surfaceId: 'panel' };
  const work = { scheduler, rootId: 'graph-reference', scope: 'reference-instance' };
  const identity = { framework: 'react', hostId: 'h', surfaceId: 's', xtensionId: 'x' };
  const changes = [];
  const callbacks = { pause: () => changes.push('pause'), resume: () => changes.push('resume'), destroy: () => changes.push('destroy') };
  const binding = createResourceGraphBinding(input, work, container, identity, callbacks);
  try {
    check('construction does not acquire resources', () => assert.equal(kernel.listResources().length, 0));
    for (const [label, changed] of [['missing ports', null], ['foreign controller version', { ...input, surfaceController: { ...surfaceController, schema: 'unsupported' } }], ['component-selected policy', { ...input, lane: 'user-blocking' }]]) {
      check('reject ' + label, () => assert.throws(() => createResourceGraphBinding(changed, work, container, identity, callbacks)));
    }
    for (const [label, config, target] of [['foreign root', { ...work, rootId: 'missing' }, container], ['foreign scheduler', { ...work, scheduler: {} }, container], ['foreign container', work, {}]]) {
      check('reject ' + label, () => assert.throws(() => createResourceGraphBinding(input, config, target, identity, callbacks).attach()));
    }
    check('reject unknown owning Surface', () => assert.throws(() => createResourceGraphBinding({ ...input, surfaceId: 'missing' }, work, container, identity, callbacks).attach()));
    binding.attach();
    check('native kernel resource identifies the concrete Surface generation', () => {
      const resource = kernel.listResources('graph-reference')[0]; assert.equal(resource.id, binding.snapshot().resourceId); assert.equal(resource.meta.surfaceGeneration, 1); assert.equal(resource.meta.scope, work.scope);
    });
    check('duplicate scopes cannot steal the resource', () => {
      const other = createResourceGraphBinding(input, work, container, identity, callbacks); assert.throws(() => other.attach()); other.dispose(); assert.equal(kernel.listResources().length, 1);
    });
    surfaceGraph.closeSurface('panel');
    check('Surface close notifies synchronously', () => { assert.equal(binding.snapshot().state, 'suspended'); assert.equal(changes.at(-1), 'pause'); });
    await surfaceGraph.openSurface('panel');
    check('Surface opening notifies resume', () => { assert.equal(binding.snapshot().state, 'active'); assert.equal(changes.at(-1), 'resume'); });
    surfaceGraph.minimizeSurface('panel');
    check('Surface minimize gates the same lifetime', () => { assert.equal(binding.snapshot().state, 'suspended'); assert.equal(binding.snapshot().surfaceGeneration, 1); });
    surfaceGraph.restoreSurface('panel');
    surfaceGraph.destroySurface('panel');
    check('Surface destruction removes its resource and observer', () => { assert.equal(binding.snapshot().state, 'disposed'); assert.equal(kernel.listResources().length, 0); assert.equal(changes.filter(x => x === 'destroy').length, 1); });
    await surfaceGraph.openSurface('panel', { recreate: true });
    check('recreated Surface cannot revive the old binding', () => assert.equal(binding.snapshot().state, 'disposed'));
    const next = createResourceGraphBinding(input, work, container, identity, callbacks); next.attach();
    check('new binding captures the new Surface generation', () => assert.equal(next.snapshot().surfaceGeneration, 2));
    kernel.disposeRoot('graph-reference');
    check('native root disposal invokes terminal cleanup synchronously', () => { assert.equal(next.snapshot().state, 'disposed'); assert.equal(changes.filter(x => x === 'destroy').length, 2); });
    assert.equal(await scheduler.schedule({ rootId: 'other', scope: 'other' }, () => 42).result, 42);
    checked.push('binding disposal preserves the shared scheduler');
    check('registry API identifies the additional host major', () => assert.equal(require('../../tools/xtensions/state-binding').XTENSION_STATE_BINDING_API_VERSION, '2.4.0'));
    const sources = ['tools/xtensions/resource-graph-binding.js', 'tools/xtensions/runtime-host-controller.js', 'tools/xtensions/runtime-host-controller.d.ts', 'tools/xtensions/react-runtime-adapter.d.ts', 'tools/xtensions/vue-runtime-adapter.d.ts', 'tools/xtensions/state-binding.js', 'tools/xtensions/state-binding.d.ts', 'xtend-maraca/plan-runtime.d.ts', 'tests/xtensions/resource-graph-acceptance.js', 'tests/xtensions/resource-graph-maraca-acceptance.js', 'tests/types/xtensions_resource_graph.mts', 'tests/xtensions/xtensions_runtime_gate_suite.js', 'tests/xtensions/xtensions_consumer_package_suite.js', 'tests/xtensions/runtime-adapter-exports.cjs'];
    const report = { format: 1, stage: 'A03.2-surface-kernel-resource-graph', status: 'a03-in-progress', graphHostApiVersion: '4.0.0', registryApiVersion: '2.4.0', fabricRequired: true,
      frameworkExecutionInPreparationCheck: false, contractChecks: checked.length, names: checked, requiredRealIntegrationCases: 32, requiredRuntimeCasesPerEnvironment: 216, requiredCompilerChecks: 88,
      sources: Object.fromEntries(sources.map(name => [name, createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex')])) };
    const text = JSON.stringify(report, null, 2) + '\n', file = path.join(__dirname, 'graph-evidence.json');
    if (process.argv.includes('--write')) fs.writeFileSync(file, text);
    if (process.argv.includes('--check')) assert.equal(fs.readFileSync(file, 'utf8'), text, 'A03.2 graph contract/source drift');
    console.log(`A03.2: ${checked.length} native Surface/Kernel resource checks; real framework execution remains mandatory in Runtime gates.`);
    return report;
  } finally { binding.dispose(); surfaceGraph.dispose(); surfaceController.dispose(); kernel.disposeRoot('graph-reference'); scheduler.dispose(); }
}
if (require.main === module) inspect().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { inspect };

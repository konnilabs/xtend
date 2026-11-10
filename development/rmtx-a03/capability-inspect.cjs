'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const { createXtendFabric } = require('../../fabric/xtend-fabric');
async function inspect() {
  const { createRmtCore } = await import('../../xtendrmt/rmt-runtime.esm.js');
  const { createRmtKernelScheduler } = await import('../../xtendrmt/rmt-kernel-scheduler.js');
  const { createRmtSurfaceResourceGraphRuntime } = await import('../../xtendrmt/rmt-surface-resource-graph-runtime.js');
  const { createSurfaceController } = await import('../../components/xsurfacemanager-controller.js');
  const root = path.resolve(__dirname, '../..'), checked = [], events = [], hosts = [];
  const scheduler = createRmtKernelScheduler({ preferPostTask: false, observer: event => events.push(event) }), kernel = createRmtCore({ scheduler }).rmt;
  const container = {}, fabric = createXtendFabric(), surfaceController = createSurfaceController({ fabric });
  kernel.mountRoot('negotiation-reference', { contains: value => value === container });
  const surfaceGraph = createRmtSurfaceResourceGraphRuntime({ surfaces: [{ id: 'panel', initialState: 'open' }], surfaceController, strict: true }); surfaceGraph.materialize();
  const required = { schema: 'xtend.xtensions.host-capability-requirements.v1', required: { features: ['kernel.lifecycle', 'fabric.boundary'], work: ['scan'], resources: ['subscription'], events: ['selection'] } };
  const base = { container, component: {}, fabric, kernelWork: { scheduler, rootId: 'negotiation-reference', scope: 'negotiation-instance', work: { scan: { lane: 'background' } } },
    policy: { allowedResources: ['subscription'], events: { selection: 'xtend.schemas.xtension.intent.v1' } }, capabilityRequirements: required };
  const graph = { kernel, surfaceGraph, surfaceController, surfaceId: 'panel' }, budget = { schema: 'xtend.xtensions.work-budget-policy.v1', maxPending: 1, work: { scan: { maxPending: 1 } } };
  const make = (framework, input) => { const api = require('../../tools/xtensions/' + framework + '-runtime-adapter'); const host = api['create' + (framework === 'react' ? 'React' : 'Vue') + 'KernelRuntimeAdapter'](input); hosts.push(host); return host; };
  const check = (name, callback) => { callback(); checked.push(name); };
  try {
    for (const framework of ['react', 'vue']) for (const profile of ['kernel', 'graph', 'budget']) {
      const host = make(framework, { ...base, ...(profile === 'kernel' ? {} : { resourceGraph: graph }), ...(profile === 'budget' ? { workBudget: budget } : {}) });
      check(framework + ' ' + profile + ' facts come from actual adapter composition', () => {
        assert.equal(host.apiVersion, '6.0.0'); assert.equal(host.getCapabilities().schema, 'xtend.xtensions.runtime-capabilities.v2'); assert.equal(host.getCapabilities().framework, framework); assert.equal(host.getCapabilities().profile, profile);
        assert.equal(host.getCapabilities().features['surface.lifecycle'], profile !== 'kernel'); assert.equal(host.getCapabilities().features['work.bounded'], profile === 'budget'); assert.equal(host.getCapabilityNegotiation().status, 'matched');
      });
    }
    const first = hosts[0];
    check('public negotiation is deeply immutable', () => { assert(Object.isFrozen(first.getCapabilityNegotiation().requirements.required.work)); assert(Object.isFrozen(first.getCapabilities().features)); });
    for (const [label, requirements] of [['unsupported schema', { ...required, schema: 'unsupported' }], ['missing required section', { schema: required.schema }], ['unknown field', { ...required, provided: {} }],
      ['unknown feature', { ...required, required: { features: ['invented.feature'] } }], ['duplicate grant', { ...required, required: { work: ['scan', 'scan'] } }],
      ['overlapping required and optional', { ...required, optional: { work: ['scan'] } }], ['unbounded names', { ...required, required: { work: Array.from({ length: 33 }, (_, i) => 'work' + i) } }]]) {
      check('reject ' + label, () => assert.throws(() => make('react', { ...base, capabilityRequirements: requirements })));
    }
    const optional = make('vue', { ...base, capabilityRequirements: { ...required, optional: { features: ['render.ssr'], events: ['missing'] } } });
    check('optional gaps remain explicit and never add grants', () => { const report = optional.getCapabilityNegotiation(); assert.equal(report.status, 'degraded'); assert.equal(report.ok, true); assert.deepEqual(report.missingOptional.events, ['missing']); assert.equal(report.capabilities.features['render.ssr'], false); });
    const blocked = make('react', { ...base, resourceGraph: graph, workBudget: budget, loadRuntime() { throw new Error('provider must never execute'); }, capabilityRequirements: { schema: required.schema, required: { features: ['execution.preemption'] } } });
    const result = await blocked.mount();
    check('mandatory missing capability blocks before queue provider and graph acquisition', () => { assert.equal(result.status, 'policy-blocked'); assert.equal(result.metadata.reason, 'capability-requirements-unsatisfied'); assert.equal(events.length, 0); assert.equal(kernel.listResources().length, 0); });
    const mismatch = make('vue', { ...base, capabilityRequirements: { ...required, framework: 'angular' } });
    check('unsupported requested framework cannot replace actual adapter identity', () => { const report = mismatch.getCapabilityNegotiation(); assert.equal(report.framework, 'vue'); assert.equal(report.requiredFramework, 'angular'); assert.equal(report.frameworkMatched, false); assert.equal(report.ok, false); });
    check('preflight is not a runtime or publication certificate', () => { assert.equal(first.getCapabilityNegotiation().runtimeExecutionVerified, false); assert.equal(first.getCapabilities().features['framework.internal-scheduling'], false); });
    check('registry is explicitly versioned for v6 suppliers', () => assert.equal(require('../../tools/xtensions/state-binding').XTENSION_STATE_BINDING_API_VERSION, '2.4.0'));
    const sources = ['tools/xtensions/host-capability-negotiation.js', 'tools/xtensions/runtime-host-controller.js', 'tools/xtensions/runtime-host-controller.d.ts', 'tools/xtensions/react-runtime-adapter.d.ts', 'tools/xtensions/vue-runtime-adapter.d.ts', 'tools/xtensions/state-binding.js', 'tools/xtensions/state-binding.d.ts', 'tools/package.json', 'xtend-maraca/plan-runtime.d.ts', 'tests/xtensions/capability-negotiation-acceptance.js', 'tests/xtensions/capability-negotiation-maraca-acceptance.js', 'tests/types/xtensions_capability_negotiation.mts', 'tests/xtensions/xtensions_runtime_gate_suite.js', 'tests/xtensions/xtensions_consumer_package_suite.js'];
    const report = { format: 1, stage: 'A03.4-actual-adapter-capability-negotiation', status: 'a03-explicit-react-vue-path-implemented', negotiatedHostApiVersion: '6.0.0', registryApiVersion: '2.4.0', fabricRequired: true,
      frameworkExecutionInPreparationCheck: false, frameworkPreemption: false, contractChecks: checked.length, names: checked, requiredRealIntegrationCases: 27, requiredRuntimeCasesPerEnvironment: 269, requiredCompilerChecks: 88,
      sources: Object.fromEntries(sources.map(name => [name, createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex')])) };
    const text = JSON.stringify(report, null, 2) + '\n', file = path.join(__dirname, 'capability-evidence.json');
    if (process.argv.includes('--write')) fs.writeFileSync(file, text);
    if (process.argv.includes('--check')) assert.equal(fs.readFileSync(file, 'utf8'), text, 'A03.4 capability/source drift');
    console.log(`A03.4: ${checked.length} native capability checks; actual React/Vue and Maraca execution remains mandatory.`); return report;
  } finally { await Promise.all(hosts.map(host => host.unmount())); surfaceGraph.dispose(); surfaceController.dispose(); kernel.disposeRoot('negotiation-reference'); scheduler.dispose(); }
}
if (require.main === module) inspect().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { inspect };

'use strict';
const react = require('@ccslabs/xtend/xtensions/react-runtime-adapter');
const vue = require('@ccslabs/xtend/xtensions/vue-runtime-adapter');
const { createXtendFabric } = require('../../fabric/xtend-fabric');

async function runCapabilityNegotiationAcceptance({ React, ReactDOM, Vue, document, test, check, equal }) {
  const { createRmtCore } = await import('../../xtendrmt/rmt-runtime.esm.js');
  const { createRmtKernelScheduler } = await import('../../xtendrmt/rmt-kernel-scheduler.js');
  const { createSurfaceController } = await import('../../components/xsurfacemanager-controller.js');
  const { createRmtSurfaceResourceGraphRuntime } = await import('../../xtendrmt/rmt-surface-resource-graph-runtime.js');
  const requirements = required => ({ schema: 'xtend.xtensions.host-capability-requirements.v1', required });
  async function rejected(action) { let error; try { await action(); } catch (caught) { error = caught; } check(!!error, 'operation must reject'); return error; }
  const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
  function fixture(framework, extra = {}) {
    const root = document.createElement('main'), container = document.createElement('section'); root.append(container); document.body.append(root);
    const events = [], fabric = createXtendFabric(), scheduler = createRmtKernelScheduler({ preferPostTask: false, observer: event => events.push(event) });
    const kernel = createRmtCore({ scheduler, documentTarget: document, windowTarget: document.defaultView }).rmt; kernel.mountRoot('capability-root', root);
    const surfaceController = createSurfaceController({ fabric }), surfaceGraph = createRmtSurfaceResourceGraphRuntime({ surfaces: [{ id: 'panel', initialState: 'open' }], surfaceController, strict: true }); surfaceGraph.materialize();
    const stats = { starts: 0, stops: 0, loads: 0, facade: null, emitted: [] };
    const register = facade => { stats.facade = facade; return facade.resources.register('subscription', () => { stats.starts++; return () => stats.stops++; }); };
    const component = framework === 'react' ? function Panel(props) {
      React.useLayoutEffect(() => register(props.xtension), []);
      return React.createElement('output', null, props.title);
    } : { props: ['title', 'xtension'], setup(props) {
      let stop; Vue.onMounted(() => { stop = register(props.xtension); }); Vue.onUnmounted(() => stop?.()); return () => Vue.h('output', props.title);
    } };
    const peers = framework === 'react' ? { React, ReactDOM } : { Vue };
    const profile = extra.profile || 'budget';
    const config = { container, component, peers, fabric, loadRuntime() { stats.loads++; return peers; },
      kernelWork: { scheduler, rootId: 'capability-root', scope: 'capability-instance', work: { scan: { lane: 'background', maxChunkMs: 4 } } },
      ...(profile === 'kernel' ? {} : { resourceGraph: { kernel, surfaceGraph, surfaceController, surfaceId: 'panel' } }),
      ...(profile === 'budget' ? { workBudget: { schema: 'xtend.xtensions.work-budget-policy.v1', maxPending: 1, work: { scan: { maxPending: 1, pressure: { critical: { admission: 'reject' } } } } } } : {}),
      policy: { allowedResources: ['subscription'], events: { selection: 'xtend.schemas.xtension.intent.v1' } }, onEvent: event => stats.emitted.push(event),
      capabilityRequirements: requirements({ features: ['kernel.lifecycle', 'fabric.boundary', 'props.controlled', 'work.named'], work: ['scan'], resources: ['subscription'], events: ['selection'] }), ...extra.options };
    const factory = (framework === 'react' ? react : vue)[framework === 'react' ? 'createReactKernelRuntimeAdapter' : 'createVueKernelRuntimeAdapter'];
    const adapter = factory(config);
    return { root, container, events, fabric, scheduler, kernel, surfaceGraph, surfaceController, stats, config, factory, adapter,
      mount: () => adapter.mount(container, { title: 'negotiated' }),
      async close() { await adapter.unmount(); surfaceGraph.dispose(); surfaceController.dispose(); kernel.disposeRoot('capability-root'); scheduler.dispose(); root.remove(); } };
  }
  for (const framework of ['react', 'vue']) {
    await test(`A03.4: ${framework} negotiates actual kernel graph and budget profiles with versioned reports`, async () => {
      for (const profile of ['kernel', 'graph', 'budget']) {
        const f = fixture(framework, { profile }); try {
          const report = f.adapter.getCapabilityNegotiation(), caps = f.adapter.getCapabilities();
          equal([f.adapter.apiVersion, f.adapter.schema, f.adapter.adapterSchema], ['6.0.0', 'xtend.xtensions.runtime-host-controller.v6', `xtend.xtensions.${framework}-runtime-adapter.v6`], 'separate API and adapter major');
          equal([caps.schema, caps.framework, caps.profile], ['xtend.xtensions.runtime-capabilities.v2', framework, profile], 'actual adapter/profile capability report');
          equal([report.schema, report.stage, report.status, report.ok], ['xtend.xtensions.host-capability-negotiation.v1', 'preflight', 'matched', true], 'explicit negotiation result');
          check(!report.runtimeExecutionVerified && !caps.features['execution.preemption'] && !caps.features['framework.internal-scheduling'], 'preflight never promises runtime execution or private scheduling');
          equal([caps.features['surface.lifecycle'], caps.features['work.bounded'], caps.features['work.pressure-budgets']], [profile !== 'kernel', profile === 'budget', profile === 'budget'], 'availability follows actual injected ports');
          check((await f.mount()).ok, 'matched host mounts'); equal(f.container.textContent, 'negotiated', 'actual framework renders'); equal(f.stats.starts, 1, 'actual granted cooperative resource starts');
          const work = f.stats.facade.work.schedule('scan', () => 42); equal(await work.result, 42, 'granted named work executes');
          check(f.fabric.getFibers().some(fiber => fiber.metadata.kernelJobId === work.jobId), 'actual work remains in Fabric after native admission');
          await f.adapter.whenIdle(); equal(f.kernel.listResources().length, profile === 'kernel' ? 0 : 1, 'only graph profiles own a real lease');
        } finally { await f.close(); }
      }
    });
    await test(`A03.4: ${framework} missing hard capabilities block before queue provider ownership and DOM`, async () => {
      const unsupported = ['execution.preemption', 'framework.internal-scheduling', 'render.ssr', 'render.adoption'];
      const f = fixture(framework, { options: { capabilityRequirements: requirements({ features: unsupported }), capabilities: { preemption: true, ssr: true } } }); try {
        const report = f.adapter.getCapabilityNegotiation(); equal(report.status, 'blocked', 'hard requirements fail closed'); equal(report.missingRequired.features, [...unsupported].sort(), 'each missing control unit is explicit');
        for (const result of [await f.mount(), await f.adapter.update({ type: 'props.update', props: { title: 'blocked' } }), await f.adapter.suspend(), await f.adapter.resume()]) {
          equal(result.status, 'policy-blocked', 'retained operations cannot bypass a failed negotiation');
        }
        equal([f.events.length, f.stats.loads, f.stats.starts, f.kernel.listResources().length, f.container.childNodes.length], [0, 0, 0, 0, 0], 'no kernel job, provider, resource or root is created');
        equal(f.fabric.getFibers().length, 0, 'no Fabric execution is invented'); check(!f.adapter.getCapabilities().features['execution.preemption'], 'caller capability claims cannot promote unsupported implementation');
      } finally { await f.close(); }
    });
    await test(`A03.4: ${framework} optional gaps degrade explicitly without adding grants`, async () => {
      const f = fixture(framework, { options: { capabilityRequirements: { ...requirements({ work: ['scan'] }), optional: { features: ['execution.preemption'], work: ['missing'], resources: ['other'], events: ['other'] } } } }); try {
        const report = f.adapter.getCapabilityNegotiation(); equal([report.status, report.ok], ['degraded', true], 'optional gaps allow the explicitly declared degraded path');
        equal(report.missingOptional, { features: ['execution.preemption'], work: ['missing'], resources: ['other'], events: ['other'] }, 'gaps retain their distinct categories');
        check((await f.mount()).ok, 'optional gaps do not block the framework');
        await rejected(() => f.stats.facade.work.schedule('missing', () => true)); await rejected(() => f.stats.facade.resources.register('other', () => () => {}));
        check(!f.stats.facade.emit({ type: 'other', payload: {} }).ok, 'missing optional event remains denied'); equal(await f.stats.facade.work.schedule('scan', () => 42).result, 42, 'existing grant works');
      } finally { await f.close(); }
    });
    await test(`A03.4: ${framework} separates framework mismatches from missing named grants`, async () => {
      const requiredFramework = framework === 'react' ? 'vue' : 'react';
      const f = fixture(framework, { options: { capabilityRequirements: { ...requirements({ work: ['absent'], resources: ['absent'], events: ['absent'] }), framework: requiredFramework } } }); try {
        const report = f.adapter.getCapabilityNegotiation(); check(!report.frameworkMatched && !report.ok, 'wrong real adapter is not a match');
        equal([report.framework, report.requiredFramework], [framework, requiredFramework], 'requested framework cannot overwrite actual driver identity');
        equal(report.missingRequired, { features: [], work: ['absent'], resources: ['absent'], events: ['absent'] }, 'grants are evaluated independently of framework identity');
        check(!(await f.mount()).ok && f.stats.loads === 0, 'wrong framework never reaches provider loading');
      } finally { await f.close(); }
    });
    await test(`A03.4: ${framework} hard profile requirements never silently enable missing ports`, async () => {
      for (const profile of ['kernel', 'graph', 'budget']) {
        const f = fixture(framework, { profile, options: { capabilityRequirements: requirements({ features: ['surface.lifecycle', 'work.bounded', 'work.pressure-budgets'] }) } }); try {
          equal(f.adapter.getCapabilityNegotiation().ok, profile === 'budget', 'all requested features require the actual budget/graph composition');
          if (profile !== 'budget') { check(!(await f.mount()).ok, 'less capable profiles cannot be silently upgraded'); equal(f.events.length, 0, 'no job created for an unavailable profile'); }
        } finally { await f.close(); }
      }
    });
    await test(`A03.4: ${framework} rejects malformed ambiguous and unbounded requirement contracts`, async () => {
      const f = fixture(framework); try {
        const accessor = requirements({}); Object.defineProperty(accessor, 'optional', { enumerable: true, get() { throw new Error('accessor must not execute'); } });
        for (const capabilityRequirements of [undefined, null, { schema: 'unsupported', required: {} }, { ...requirements({}), provided: { preemption: true } }, requirements({ features: ['unknown.feature'] }),
          requirements({ work: ['scan', 'scan'] }), requirements({ work: Array.from({ length: 33 }, (_, i) => 'work' + i) }), { ...requirements({ work: ['scan'] }), optional: { work: ['scan'] } },
          requirements({ resources: ['__proto__'] }), { ...requirements({}), framework: 'invented' }, { schema: 'xtend.xtensions.host-capability-requirements.v1' }, accessor]) {
          await rejected(() => f.factory({ ...f.config, capabilityRequirements }));
        }
        equal([f.events.length, f.kernel.listResources().length], [0, 0], 'malformed requirements have no execution or ownership effects');
      } finally { await f.close(); }
    });
    await test(`A03.4: ${framework} captures requirements grants and deeply immutable negotiation facts`, async () => {
      const f = fixture(framework); try {
        const report = f.adapter.getCapabilityNegotiation(), caps = f.adapter.getCapabilities();
        check(Object.isFrozen(report.requirements.required.work) && Object.isFrozen(caps.features) && Object.isFrozen(caps.grants.resources), 'all public authoritative data is deeply frozen');
        await rejected(() => { caps.features['execution.preemption'] = true; }); await rejected(() => { report.requirements.required.work.push('other'); });
        f.config.capabilityRequirements.required.work.push('other'); f.config.policy.allowedResources.push('other'); f.config.policy.events.other = 'xtend.schemas.xtension.intent.v1'; f.config.kernelWork.work.other = {};
        const snapshot = f.adapter.snapshot(); snapshot.capabilities.features['execution.preemption'] = true; snapshot.capabilityNegotiation.status = 'matched'; snapshot.capabilityNegotiation.requirements.required.work.push('forged');
        equal(f.adapter.getCapabilities().grants, { work: ['scan'], resources: ['subscription'], events: ['selection'] }, 'caller mutations cannot grant authority');
        equal(f.adapter.getCapabilityNegotiation().requirements.required.work, ['scan'], 'snapshot edits cannot rewrite captured requirements');
        check((await f.mount()).ok, 'captured original requirements remain valid'); await rejected(() => f.stats.facade.work.schedule('other', () => true));
        check(!JSON.stringify(report).includes('loadRuntime'), 'report contains no runtime/provider ports');
      } finally { await f.close(); }
    });
    await test(`A03.4: ${framework} successful negotiation never bypasses current host authorization`, async () => {
      let allow = false;
      const f = fixture(framework, { options: { policy: { allowedResources: ['subscription'], events: { selection: 'xtend.schemas.xtension.intent.v1' }, authorize: context => context.operation !== 'work:scan' || allow } } }); try {
        await f.mount(); equal(f.adapter.getCapabilityNegotiation().status, 'matched', 'static grants match'); let calls = 0;
        await rejected(() => f.stats.facade.work.schedule('scan', () => calls++).result); equal(calls, 0, 'current host authorization remains mandatory');
        allow = true; equal(await f.stats.facade.work.schedule('scan', () => 42).result, 42, 'host policy can authorize later work without renegotiating grants');
      } finally { await f.close(); }
    });
    await test(`A03.4: ${framework} static capability facts preserve Surface revocation generations and idle delivery`, async () => {
      const f = fixture(framework), entered = deferred(), release = deferred(); try {
        await f.mount(); let stale, hits = 0;
        const work = f.stats.facade.work.schedule('scan', async context => { stale = context.guard(() => hits++); entered.resolve(); await release.promise; stale(); }); await entered.promise;
        f.surfaceGraph.closeSurface('panel'); check(work.signal.aborted, 'actual Surface close revokes the current work generation'); await rejected(() => work.result);
        equal(f.adapter.getCapabilityNegotiation().status, 'matched', 'implementation support does not masquerade as current liveness');
        check((await f.adapter.update({ type: 'props.update', props: { title: 'latest negotiated' } })).ok, 'closed graph host accepts staged props');
        await f.surfaceGraph.openSurface('panel'); await f.adapter.whenIdle(); equal(f.container.textContent, 'latest negotiated', 'v6 idle includes retained Surface resume');
        release.resolve(); await Promise.resolve(); stale(); equal(hits, 0, 'static capabilities cannot restore an old guard'); equal(f.stats.starts, 2, 'cooperative resources restart once');
      } finally { release.resolve(); await f.close(); }
    });
    await test(`A03.4: ${framework} preflight does not replace actual peer and provider-version validation`, async () => {
      const dependency = framework === 'react' ? 'react' : 'vue';
      for (const options of [{ loadRuntime: () => ({}) }, { expectedVersions: { [dependency]: '0.0.0' } }]) {
        const f = fixture(framework, { options }); try {
          check(f.adapter.getCapabilityNegotiation().ok, 'adapter implementation matches before loading'); check(!(await f.mount()).ok, 'invalid actual provider or peer version still fails mount');
          check(!f.adapter.getCapabilityNegotiation().runtimeExecutionVerified, 'preflight never becomes a fake runtime certificate');
          equal([f.container.childNodes.length, f.kernel.listResources().length], [0, 0], 'failed loading cleans up its graph lease and creates no orphan root');
        } finally { await f.close(); }
      }
      const loaded = deferred(), entered = deferred();
      const cancelled = fixture(framework, { options: { loadRuntime() { entered.resolve(); return loaded.promise; } } });
      try {
        const mounting = cancelled.mount(); await entered.promise; await cancelled.adapter.unmount(); loaded.resolve(cancelled.config.peers);
        equal((await mounting).status, 'skipped', 'explicit disposal still reports cancellation, independently of real provider failure');
        equal(cancelled.container.childNodes.length, 0, 'a late valid provider cannot resurrect a disposed v6 host');
      } finally { loaded.resolve(cancelled.config.peers); await cancelled.close(); }
    });
    await test(`A03.4: ${framework} explicit fallback can claim an untouched blocked container safely`, async () => {
      const f = fixture(framework, { options: { capabilityRequirements: requirements({ features: ['render.adoption'] }) } }); let fallback;
      try {
        check(!(await f.mount()).ok, 'unavailable mandatory adoption blocks');
        fallback = f.factory({ ...f.config, capabilityRequirements: requirements({ features: ['props.controlled'] }) });
        check((await fallback.mount(f.container, { title: 'explicit fallback' })).ok, 'application explicitly creates an acceptable replacement');
        await f.adapter.unmount(); equal(f.container.textContent, 'explicit fallback', 'old blocked cleanup cannot remove replacement DOM'); equal(f.kernel.listResources().length, 1, 'old cleanup cannot release the replacement lease');
        equal(f.stats.loads, 1, 'only the explicitly selected fallback loads a runtime');
      } finally { await fallback?.unmount(); await f.close(); }
    });
    await test(`A03.4: ${framework} component and lifecycle data cannot renegotiate capabilities`, async () => {
      const f = fixture(framework); try {
        check(!(await f.adapter.mount(f.container, {}, { capabilityRequirements: requirements({}) })).ok, 'mount options cannot replace captured requirements');
        await f.mount(); const queued = f.events.filter(event => event.phase === 'queued').length;
        const update = await f.adapter.update({ type: 'props.update', props: { title: 'forged' }, capabilityRequirements: requirements({}) }); equal(update.status, 'policy-blocked', 'update envelope cannot renegotiate');
        await rejected(() => f.stats.facade.work.schedule('scan', () => true, { capabilities: { preemption: true } }));
        equal(f.events.filter(event => event.phase === 'queued').length, queued, 'rejected authority data never schedules a job');
        equal(Object.keys(f.stats.facade).sort(), ['emit', 'resources', 'work'], 'component facade exposes no negotiation or pressure administration');
      } finally { await f.close(); }
    });
  }
}
module.exports = { runCapabilityNegotiationAcceptance };

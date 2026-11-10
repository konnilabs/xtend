'use strict';
const react = require('@ccslabs/xtend/xtensions/react-runtime-adapter');
const vue = require('@ccslabs/xtend/xtensions/vue-runtime-adapter');
const { createXtendFabric } = require('../../fabric/xtend-fabric');

async function runWorkBudgetAcceptance({ React, ReactDOM, Vue, document, test, check, equal }) {
  const { createRmtCore } = await import('../../xtendrmt/rmt-runtime.esm.js');
  const { createRmtKernelScheduler } = await import('../../xtendrmt/rmt-kernel-scheduler.js');
  const { createSurfaceController } = await import('../../components/xsurfacemanager-controller.js');
  const { createRmtSurfaceResourceGraphRuntime } = await import('../../xtendrmt/rmt-surface-resource-graph-runtime.js');
  const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
  async function rejected(promise, reason) { let error; try { await promise; } catch (caught) { error = caught; } check(!!error, 'work must reject'); if (reason) equal(error.reason, reason, 'explicit admission reason'); return error; }
  function fixture(framework, extra = {}) {
    const root = document.createElement('main'), container = document.createElement('section'); root.append(container); document.body.append(root);
    const events = [], callbacks = []; let holding = false, at = 0;
    const scheduler = createRmtKernelScheduler({ preferPostTask: false, observer(event) { events.push(event); extra.observe?.(event); },
      hostPort: { now: () => at, queueMicrotask(callback) { if (holding) callbacks.push(callback); else queueMicrotask(callback); } } });
    const kernel = createRmtCore({ scheduler, documentTarget: document, windowTarget: document.defaultView }).rmt; kernel.mountRoot('budget-root', root);
    const fabric = createXtendFabric(), surfaceController = createSurfaceController({ fabric });
    const surfaceGraph = createRmtSurfaceResourceGraphRuntime({ surfaces: [{ id: 'panel', initialState: 'open' }], surfaceController, strict: true }); surfaceGraph.materialize();
    let facade;
    const component = framework === 'react' ? function Panel(props) { facade = props.xtension; return React.createElement('output', null, props.title); }
      : { props: ['title', 'xtension'], setup(props) { return () => { facade = props.xtension; return Vue.h('output', props.title); }; } };
    const factory = (framework === 'react' ? react : vue)[framework === 'react' ? 'createReactKernelRuntimeAdapter' : 'createVueKernelRuntimeAdapter'];
    const config = { container, component, peers: framework === 'react' ? { React, ReactDOM } : { Vue }, fabric,
      kernelWork: { scheduler, rootId: 'budget-root', scope: 'budget-instance', work: { scan: { lane: 'background', maxChunkMs: 8, ...extra.scan }, other: { lane: 'idle', maxChunkMs: 8 } } },
      resourceGraph: { kernel, surfaceGraph, surfaceController, surfaceId: 'panel' },
      workBudget: { schema: 'xtend.xtensions.work-budget-policy.v1', maxPending: extra.maxPending || 2, work: {
        scan: { maxPending: 1, overflow: extra.overflow || 'reject-new', pressure: { constrained: { maxChunkMs: 1 }, critical: { admission: 'reject', maxChunkMs: 1 } } }, other: { maxPending: 1 } } },
      policy: extra.policy };
    const adapter = factory(config);
    const release = () => { holding = false; callbacks.splice(0).forEach(callback => queueMicrotask(callback)); };
    return { root, container, scheduler, kernel, fabric, surfaceGraph, surfaceController, config, factory, adapter, events, facade: () => facade,
      advance(ms) { at += ms; }, hold() { holding = true; }, release, mount: () => adapter.mount(container, { title: 'initial' }),
      async close() { release(); await adapter.unmount(); surfaceGraph.dispose(); surfaceController.dispose(); kernel.disposeRoot('budget-root'); scheduler.dispose(); root.remove(); } };
  }
  for (const framework of ['react', 'vue']) {
    await test(`A03.3: ${framework} validates and versions the explicit bounded-work contract`, async () => {
      const f = fixture(framework); try {
        for (const workBudget of [undefined, null, { ...f.config.workBudget, maxPending: 0 }, { ...f.config.workBudget, maxPending: 129 },
          { ...f.config.workBudget, work: {} }, { ...f.config.workBudget, work: { ...f.config.workBudget.work, missing: { maxPending: 1 } } },
          { ...f.config.workBudget, work: { ...f.config.workBudget.work, scan: { maxPending: 3 } } },
          { ...f.config.workBudget, work: { ...f.config.workBudget.work, scan: { maxPending: 1, pressure: { constrained: { maxChunkMs: 9 } } } } },
          { ...f.config.workBudget, work: { ...f.config.workBudget.work, scan: { maxPending: 1, pressure: { critical: { lane: 'user-blocking' } } } } }]) {
          let error; try { f.factory({ ...f.config, workBudget }); } catch (caught) { error = caught; } check(!!error, 'invalid policy fails before mounting');
        }
        let error; try { const { resourceGraph, ...rest } = f.config; f.factory(rest); } catch (caught) { error = caught; } check(!!error, 'budget policy requires graph ownership');
        equal(f.events.length, 0, 'construction creates no jobs'); await f.mount();
        equal([f.adapter.apiVersion, f.adapter.schema, f.adapter.adapterSchema], ['5.0.0', 'xtend.xtensions.runtime-host-controller.v5', `xtend.xtensions.${framework}-runtime-adapter.v5`], 'new API major is explicit');
        equal(f.adapter.snapshot().workBudget.schema, 'xtend.xtensions.work-budget-state.v1', 'budget observation has its own contract');
        check(!f.adapter.getCapabilities().preemption && !f.adapter.getCapabilities().frameworkInternalScheduling, 'existing cooperative capability statement stays truthful');
      } finally { await f.close(); }
    });
    await test(`A03.3: ${framework} rejects pressured work without fake jobs and retains controlled lifecycle delivery`, async () => {
      const f = fixture(framework); try {
        await f.mount(); f.scheduler.updatePressure('critical'); const before = f.events.length, fibers = f.fabric.getFibers().length;
        const task = f.facade().work.schedule('scan', () => { throw new Error('must not execute'); });
        equal(task.jobId, null, 'pressure refusal creates no kernel job'); check(task.signal.aborted, 'refused handle is inert'); await rejected(task.result, 'kernel-pressure');
        equal(f.events.length, before, 'no fabricated kernel event'); equal(f.fabric.getFibers().length, fibers, 'no fabricated Fabric work');
        check((await f.adapter.update({ type: 'props.update', props: { title: 'under pressure' } })).ok, 'work policy does not reject controlled lifecycle jobs');
        equal(f.container.textContent, 'under pressure', 'actual framework props arrive'); equal(f.adapter.snapshot().workBudget.rejected, 1, 'refusal is observable');
        f.scheduler.updatePressure('normal'); equal(await f.facade().work.schedule('scan', () => 42).result, 42, 'recovery requires fresh explicit work');
      } finally { await f.close(); }
    });
    await test(`A03.3: ${framework} rechecks native pressure before queued work enters Fabric`, async () => {
      const f = fixture(framework); try {
        await f.mount(); f.hold(); let calls = 0;
        const task = f.facade().work.schedule('scan', () => calls++); f.scheduler.updatePressure('critical'); f.release(); await rejected(task.result, 'kernel-pressure');
        equal(calls, 0, 'old admission cannot authorize execution at a new pressure level'); equal(f.scheduler.getJob(task.jobId).status, 'failed', 'actual admitted job records the start rejection');
        check(!f.fabric.getFibers().some(fiber => fiber.metadata.kernelJobId === task.jobId), 'business boundary was never entered');
        check(!f.adapter.snapshot().disposed && f.adapter.snapshot().diagnostics.length === 0, 'expected backpressure is not a framework error');
      } finally { await f.close(); }
    });
    await test(`A03.3: ${framework} reduces live cooperative chunks and still yields through the native queue`, async () => {
      const f = fixture(framework); try {
        await f.mount(); const order = []; let urgent;
        const task = f.facade().work.schedule('scan', async context => {
          check(!context.shouldYield(), 'fresh normal chunk'); f.advance(2); check(!context.shouldYield(), 'base eight millisecond chunk not exhausted');
          f.scheduler.updatePressure('constrained'); check(context.shouldYield(), 'live pressure reduces the active chunk to one millisecond');
          urgent = f.scheduler.schedule({ lane: 'user-blocking', rootId: 'other', scope: 'other' }, () => order.push('urgent'));
          order.push('first'); await context.yield('pressure-chunk'); order.push('second');
          check(!context.shouldYield(), 'yield resets the cooperative chunk clock'); return 'done';
        });
        equal(await task.result, 'done', 'real cooperative result'); await urgent.result; equal(order, ['first', 'urgent', 'second'], 'native priority wins at the yield');
        equal(f.scheduler.getJob(task.jobId).snapshot().request.maxChunkMs, 8, 'live budget does not rewrite an existing kernel request');
        const next = f.facade().work.schedule('scan', () => true); await next.result;
        equal(f.scheduler.getJob(next.jobId).snapshot().request.maxChunkMs, 1, 'new native job receives the reduced chunk hint');
        check(f.fabric.getFibers().some(fiber => fiber.metadata.kernelJobId === task.jobId && fiber.lane === 'background'), 'effective lane and job identity still pass through Fabric');
      } finally { await f.close(); }
    });
    await test(`A03.3: ${framework} per-grant limits count active work and release capacity synchronously on cancel`, async () => {
      const f = fixture(framework), entered = deferred(), release = deferred(); try {
        await f.mount(); const first = f.facade().work.schedule('scan', async () => { entered.resolve(); await release.promise; }); await entered.promise;
        const next = f.facade().work.schedule('scan', () => true); equal(next.jobId, null, 'active work occupies its grant slot'); await rejected(next.result, 'pending-limit');
        first.cancel(); const replacement = f.facade().work.schedule('scan', () => 42);
        equal(await replacement.result, 42, 'cancel frees logical capacity before its promise handlers run'); await rejected(first.result);
      } finally { release.resolve(); await f.close(); }
    });
    await test(`A03.3: ${framework} total limits never replace another grant to make room`, async () => {
      const f = fixture(framework, { maxPending: 1, overflow: 'replace-oldest' }), entered = deferred(), release = deferred(); try {
        await f.mount(); const other = f.facade().work.schedule('other', async () => { entered.resolve(); await release.promise; }); await entered.promise;
        const task = f.facade().work.schedule('scan', () => true); await rejected(task.result, 'pending-limit');
        check(!other.signal.aborted, 'scan cannot evict another grant'); equal(f.adapter.snapshot().workBudget.pending, 1, 'total native work remains bounded');
      } finally { release.resolve(); await f.close(); }
    });
    await test(`A03.3: ${framework} replace-oldest revokes only the replaced work guard`, async () => {
      const f = fixture(framework, { overflow: 'replace-oldest' }), entered = deferred(), release = deferred(); try {
        await f.mount(); let stale, hits = 0;
        const first = f.facade().work.schedule('scan', async context => { stale = context.guard(() => hits++); entered.resolve(); await release.promise; stale(); }); await entered.promise;
        const next = f.facade().work.schedule('scan', () => 42); check(first.signal.aborted, 'replacement immediately revokes the old guard'); await rejected(first.result);
        equal(await next.result, 42, 'replacement is a new real job'); release.resolve(); await Promise.resolve(); stale(); equal(hits, 0, 'late old work stays fenced');
        equal(f.adapter.snapshot().workBudget.replaced, 1, 'explicit replacement is observable'); check(!f.adapter.snapshot().suspended, 'replacing work does not suspend the host');
      } finally { release.resolve(); await f.close(); }
    });
    await test(`A03.3: ${framework} reserves capacity before native scheduler observers can reenter`, async () => {
      let reentrant, enabled = false, closeSurface = false, f;
      f = fixture(framework, { maxPending: 1, observe(event) { if (event.phase !== 'queued' || event.endpointName !== 'xtension.work.scan') return;
        if (enabled) { enabled = false; reentrant = f.facade().work.schedule('scan', () => true); }
        if (closeSurface) { closeSurface = false; f.surfaceGraph.closeSurface('panel'); }
      } });
      try {
        await f.mount(); enabled = true; const task = f.facade().work.schedule('scan', () => 42);
        equal(reentrant.jobId, null, 'reentrant observer cannot overbook the in-flight reservation'); await rejected(reentrant.result, 'pending-limit'); equal(await task.result, 42, 'original admitted job completes');
        closeSurface = true; const obsolete = f.facade().work.schedule('scan', () => { throw new Error('obsolete work'); });
        check(obsolete.signal.aborted, 'Surface exit inside native schedule revokes before schedule returns'); await rejected(obsolete.result);
        equal(f.adapter.snapshot().workBudget.pending, 0, 'reentrant exit releases both reservation and queued job');
      } finally { await f.close(); }
    });
    await test(`A03.3: ${framework} replacement cancellation listeners cannot overbook reserved capacity`, async () => {
      const f = fixture(framework, { maxPending: 1, overflow: 'replace-oldest' }), entered = deferred(), release = deferred(); try {
        await f.mount(); let reentrant;
        const first = f.facade().work.schedule('scan', async context => { context.signal.addEventListener('abort', () => { reentrant = f.facade().work.schedule('scan', () => 'overbooked'); }); entered.resolve(); await release.promise; }); await entered.promise;
        const next = f.facade().work.schedule('scan', () => 42); equal(reentrant.jobId, null, 'reservation covers synchronous AbortSignal reentrancy');
        await rejected(reentrant.result, 'pending-limit'); await rejected(first.result); equal(await next.result, 42, 'only the intended replacement is admitted');
      } finally { release.resolve(); await f.close(); }
    });
    await test(`A03.3: ${framework} Surface exit during replacement prevents new job admission`, async () => {
      const f = fixture(framework, { overflow: 'replace-oldest' }), entered = deferred(), release = deferred(); try {
        await f.mount(); const first = f.facade().work.schedule('scan', async context => { context.signal.addEventListener('abort', () => f.surfaceGraph.closeSurface('panel')); entered.resolve(); await release.promise; }); await entered.promise;
        const before = f.events.filter(event => event.phase === 'queued').length, next = f.facade().work.schedule('scan', () => true);
        equal(next.jobId, null, 'reentrant Surface suspension wins over an admitted reservation'); await rejected(next.result); await rejected(first.result);
        equal(f.events.filter(event => event.phase === 'queued').length, before, 'no obsolete replacement job reaches the kernel');
        await f.surfaceGraph.openSurface('panel'); await f.adapter.whenIdle(); equal(f.adapter.snapshot().workBudget.pending, 0, 'resume never replays discarded work');
      } finally { release.resolve(); await f.close(); }
    });
    await test(`A03.3: ${framework} kernel timeouts revoke guards and free admission without framework teardown`, async () => {
      const f = fixture(framework, { scan: { timeoutMs: 20 } }), release = deferred(); try {
        await f.mount(); let stale, hits = 0;
        const task = f.facade().work.schedule('scan', async context => { stale = context.guard(() => hits++); await release.promise; stale(); });
        await rejected(task.result); check(task.signal.aborted, 'real kernel timeout revokes the cooperative signal'); equal(f.scheduler.getJob(task.jobId).reason, 'timeout_exceeded', 'timeout belongs to the actual kernel');
        equal(await f.facade().work.schedule('scan', () => 42).result, 42, 'logical timeout frees capacity'); release.resolve(); await Promise.resolve(); stale(); equal(hits, 0, 'late timed out work remains fenced');
        equal(f.container.textContent, 'initial', 'timeout does not fabricate preemptive framework cleanup');
      } finally { release.resolve(); await f.close(); }
    });
    await test(`A03.3: ${framework} captures host budgets and rechecks pressure after host authorization`, async () => {
      let f, deny = false; f = fixture(framework, { policy: { authorize({ operation }) { if (deny && operation === 'work:scan') f.scheduler.updatePressure('critical'); return true; } } });
      try {
        await f.mount(); f.config.workBudget.work.scan.maxPending = 2; f.config.workBudget.work.scan.pressure.critical.admission = 'allow';
        deny = true; let calls = 0; const task = f.facade().work.schedule('scan', () => calls++); await rejected(task.result, 'kernel-pressure'); equal(calls, 0, 'authorization cannot bypass a later pressure check');
        const refused = f.facade().work.schedule('scan', () => calls++); equal(refused.jobId, null, 'mutating caller policy never changes captured authority'); await rejected(refused.result, 'kernel-pressure');
        check(!('scheduler' in f.facade().work) && !('workBudget' in f.facade()), 'component receives no pressure or budget administration port');
      } finally { await f.close(); }
    });
  }
}
module.exports = { runWorkBudgetAcceptance };

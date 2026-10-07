'use strict';

const { createReactRuntimeAdapter } = require('@ccslabs/xtend/xtensions/react-runtime-adapter');
const { createVueRuntimeAdapter } = require('@ccslabs/xtend/xtensions/vue-runtime-adapter');
const { createCooperativeResourceScope } = require('../../tools/xtensions/cooperative-resource-scope');
const { normalizeHostResourceCleanupRecord } = require('../../tools/xtensions/host-resource-cleanup-record');
const { createXtendFabric } = require('../../fabric/xtend-fabric');

// Shared by jsdom and Chromium: no substitute framework roots or DOM stubs.
async function runRuntimeAcceptance({ React: R, ReactDOM, Vue: V, document }) {
  const passed = [], failed = [];
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const equal = (a, b, message) => check(JSON.stringify(a) === JSON.stringify(b), `${message}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
  const test = async (name, fn) => { try { await fn(); passed.push(name); } catch (error) { failed.push({ name, message: error.stack || String(error) }); } };
  const tick = () => new Promise((resolve) => setTimeout(resolve, 15));
  const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
  const within = async (promise, label) => {
    let timer;
    try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} did not settle`)), 1000); })]); }
    finally { clearTimeout(timer); }
  };
  function fixture(framework, extra = {}) {
    const container = document.createElement('section');
    const outside = document.createElement('aside'); outside.textContent = 'host-owned';
    document.body.append(container, outside);
    const stats = { mounts: 0, destroys: 0, starts: 0, stops: 0, ticks: 0, events: [], stale: [], order: [], watchers: 0 };
    let handle;
    const resource = ({ signal, guard }) => {
      stats.starts++; stats.signal = signal;
      const guarded = guard(() => stats.ticks++); stats.stale.push(guarded);
      const timer = setInterval(guarded, 5);
      return () => { clearInterval(timer); stats.stops++; };
    };
    let component;
    if (framework === 'react') {
      component = function Panel({ title, xtension, explode, throwCleanup, failureMode }) {
        const [count, setCount] = R.useState(0), [draft, setDraft] = R.useState('');
        R.useLayoutEffect(() => { stats.mounts++; handle = xtension;
          const unregister = xtension.resources.register('timer', resource);
          return () => { stats.destroys++; unregister(); if (throwCleanup) throw new Error('component-cleanup'); };
        }, []);
        if (explode) throw new Error('render-explosion');
        if (failureMode === 'render' && count) throw new Error('internal-render-error');
        return R.createElement('div', null,
          R.createElement('button', { onClick: () => { setCount((c) => c + 1); xtension.emit({ type: 'select', payload: { title } }); } }, `${title}:${count}`),
          R.createElement('input', { value: draft, onInput: (event) => setDraft(event.target.value) }),
          R.createElement('div', { 'data-scroll': '', style: { overflow: 'auto', height: '20px' } }, R.createElement('div', { style: { height: '200px' } }, 'scroll')));
      };
    } else {
      component = { props: ['title', 'xtension', 'explode', 'throwCleanup', 'failureMode'], setup(props) {
        const count = V.ref(0), draft = V.ref(''); let unregister;
        V.watch(count, () => { stats.watchers++; if (props.failureMode === 'watch') throw new Error('internal-watch-error'); });
        V.onMounted(() => { stats.mounts++; handle = props.xtension; unregister = props.xtension.resources.register('timer', resource); });
        V.onUnmounted(() => { stats.destroys++; unregister?.(); if (props.throwCleanup) throw new Error('component-cleanup'); });
        return () => {
          if (props.explode) throw new Error('render-explosion');
          if (props.failureMode === 'render' && count.value) throw new Error('internal-render-error');
          return V.h('div', [V.h('button', { onClick: () => { count.value++; if (props.failureMode === 'event') throw new Error('internal-event-error'); props.xtension.emit({ type: 'select', payload: { title: props.title } }); } }, `${props.title}:${count.value}`),
            V.h('input', { value: draft.value, onInput: (event) => { draft.value = event.target.value; } }),
            V.h('div', { 'data-scroll': '', style: { overflow: 'auto', height: '20px' } }, V.h('div', { style: { height: '200px' } }, 'scroll'))]);
        };
      } };
    }
    const peers = framework === 'react' ? { React: R, ReactDOM } : { Vue: V };
    const create = framework === 'react' ? createReactRuntimeAdapter : createVueRuntimeAdapter;
    const config = { container, component, peers, policy: { allowedResources: ['timer'], events: { select: 'xtend.schemas.xtension.intent.v1' } }, onEvent: (event) => stats.events.push(event), ...extra };
    const adapter = create(config);
    return { container, outside, stats, adapter, peers, component, config, create, handle: () => handle,
      update: (props) => adapter.update({ props, updateAdapter: 'applyPropsUpdate' }),
      async close() { await adapter.unmount(); container.remove(); outside.remove(); } };
  }
  await test('resource scope: reverse cleanup, abort, generations and failure containment', async () => {
    const released = [], callbacks = [], signals = [];
    const scope = createCooperativeResourceScope({ allowedResources: ['a', 'b', 'c'], onRelease: (name, error) => released.push([name, !!error]) });
    for (const name of ['a', 'b', 'c']) scope.register(name, ({ signal, guard }) => {
      signals.push(signal); callbacks.push(guard(() => released.push(['stale', false])));
      return () => { if (name === 'b') throw new Error('cleanup'); };
    });
    scope.start(); scope.stop(); callbacks.forEach((cb) => cb());
    equal(released, [['c', false], ['b', true], ['a', false]], 'all cleanups execute in reverse order');
    check(signals.every((signal) => signal.aborted), 'all generations abort');
    check(scope.snapshot().active === 0 && scope.snapshot().failures.length === 1, 'failure observable');
    let denied = false; try { scope.start(); } catch (_) { denied = true; }
    check(denied, 'failed cleanup cannot be resumed'); scope.dispose();
  });
  await test('resource scope: nested registration starts once per generation', () => {
    let starts = 0, stops = 0;
    const scope = createCooperativeResourceScope({ allowedResources: ['parent', 'child'] });
    scope.register('parent', () => scope.register('child', () => { starts++; return () => { stops++; }; }));
    scope.start(); equal(starts, 1, 'nested factory activated once'); scope.stop(); equal(stops, 1, 'nested cleanup once');
    scope.start(); equal(starts, 2, 'fresh generation once'); scope.dispose(); equal(stops, 2, 'all nested work released');
  });
  for (const throwing of [false, true]) await test(`resource scope: self-unregister during activation (${throwing ? 'throwing' : 'successful'} cleanup)`, () => {
    let unregister, generation = 0, active = 0, cleanups = 0;
    const releases = [];
    const scope = createCooperativeResourceScope({ allowedResources: ['a'], onRelease: (name, error) => releases.push({ name, failed: !!error, active }) });
    unregister = scope.register('a', () => {
      active++;
      if (++generation === 2) {
        unregister();
        equal(releases.length, 1, 'no release record before cleanup exists');
        equal(scope.snapshot().active, 1, 'pending activation remains observable');
      }
      return () => {
        equal(scope.snapshot().active, 1, 'cleanup remains observable until it returns');
        active--; cleanups++; if (throwing && generation === 2) throw new Error('late-cleanup');
      };
    });
    scope.start(); scope.stop(); scope.start(); scope.dispose(); unregister();
    equal(active, 0, 'self-unregistered activation cleaned'); equal(cleanups, 2, 'each cleanup exactly once');
    equal(releases, [{ name: 'a', failed: false, active: 0 }, { name: 'a', failed: throwing, active: 0 }], 'truthful release records after cleanup');
    equal(scope.snapshot().active, 0, 'no orphan activation'); equal(scope.snapshot().failures.length, throwing ? 1 : 0, 'cleanup failure preserved');
  });
  await test('resource scope: shutdown accepts inert registrations until final disposal', () => {
    let starts = 0, stops = 0; const released = [];
    const scope = createCooperativeResourceScope({ allowedResources: ['a'], onRelease: (name) => released.push(name) });
    scope.register('a', () => { starts++; return () => stops++; }); scope.start(); scope.beginShutdown();
    const unregister = scope.register('a', () => { starts++; return () => stops++; });
    unregister(); scope.dispose();
    equal([starts, stops], [1, 1], 'shutdown cannot activate passive registrations'); equal(released, ['a'], 'no fictitious release for inert registration');
    let denied = false; try { scope.register('a', () => () => {}); } catch (_) { denied = true; }
    check(denied, 'final disposal still rejects registration');
  });
  await test('resource scope: falsy thrown cleanup values are failures, never successful releases', () => {
    for (const thrown of [null, undefined, false, 0, '']) {
      const releases = [];
      const scope = createCooperativeResourceScope({ allowedResources: ['a'], onRelease: (_, error) => releases.push(error) });
      scope.register('a', () => () => { throw thrown; }); scope.start(); scope.dispose();
      check(releases.length === 1 && releases[0] instanceof Error, 'thrown value normalized as failure');
      equal(scope.snapshot().failures.length, 1, 'cleanup failure retained');
    }
  });
  await test('cleanup compatibility requires host-supplied xtension identity', () => {
    const input = { schema: 'xtend.xtensions.host-controller-cleanup-record.v1', hostId: 'h', surfaceId: 's', resource: 'timer', status: 'released', sequence: 1, timestamp: '2026-10-06T00:00:00Z' };
    const normalized = normalizeHostResourceCleanupRecord(input, { xtensionId: 'trusted-id' });
    check(normalized.schema === 'xtend.xtensions.host-resource-cleanup-record.v1' && normalized.xtensionId === 'trusted-id', 'generic record normalizes');
    let denied = false; try { normalizeHostResourceCleanupRecord(input); } catch (_) { denied = true; }
    check(denied, 'missing identity is not invented');
  });
  await test('react: immediate disposal safely drains pending passive effects', async () => {
    let closingEffects = 0;
    for (let iteration = 0; iteration < 3; iteration++) {
      let effects = 0, cleanups = 0, starts = 0, stops = 0, registrationErrors = 0, adapter;
      function PassivePanel({ xtension }) {
        const until = performance.now() + 30; while (performance.now() < until) { /* Force a pending passive flush. */ }
        R.useEffect(() => {
          effects++; if (adapter.snapshot().resources.closing) closingEffects++;
          let unregister;
          try { unregister = xtension.resources.register('timer', () => { starts++; return () => stops++; }); }
          catch (error) { registrationErrors++; throw error; }
          return () => { cleanups++; unregister(); };
        }, []);
        return R.createElement('span', null, 'healthy');
      }
      const f = fixture('react', { component: PassivePanel }); adapter = f.adapter;
      try {
        check((await adapter.mount(f.container, {})).ok, 'healthy passive component mounted');
        check((await within(adapter.unmount(), 'passive unmount')).ok, 'immediate unmount succeeds');
        equal([effects, cleanups, registrationErrors], [1, 1, 0], 'passive effect and its cleanup finish without registration error');
        equal(starts, stops, 'only activated resources need release');
        equal(adapter.snapshot().diagnostics, [], 'no hidden or reported cleanup failure');
        check(adapter.snapshot().resources.disposed && !adapter.snapshot().mounted, 'final disposal complete');
      } finally { await within(f.close(), 'passive cleanup'); }
    }
    check(closingEffects > 0, 'regression actually exercised a passive effect during shutdown');
  });
  for (const framework of ['react', 'vue']) {
    for (const operation of ['mount', 'resume']) {
      for (const action of ['reportError', 'unmount', 'throwing-self-unregister', 'successful-self-unregister']) {
        await test(`${framework}: ${operation} rechecks resource activation after ${action}`, async () => {
          let adapter, starts = 0, cleanups = 0, destroys = 0, unregister;
          const trigger = operation === 'mount' ? 1 : 2;
          const error = new Error(`activation-${action}`);
          const register = (xtension) => {
            unregister = xtension.resources.register('timer', () => {
              const current = ++starts;
              if (current === trigger) {
                if (action === 'reportError') adapter.reportError(error);
                else if (action === 'unmount') adapter.unmount('resource-request');
                else unregister();
              }
              return () => { cleanups++; if (current === trigger && action === 'throwing-self-unregister') throw error; };
            });
            return () => { destroys++; unregister(); };
          };
          const component = framework === 'react' ? function ActivationPanel({ xtension }) {
            R.useLayoutEffect(() => register(xtension), []);
            return R.createElement('span', null, 'activation');
          } : { props: ['xtension'], setup(props) {
            let cleanup;
            V.onMounted(() => { cleanup = register(props.xtension); });
            V.onUnmounted(() => cleanup());
            return () => V.h('span', 'activation');
          } };
          const f = fixture(framework, { component }); adapter = f.adapter;
          try {
            let outcome;
            if (operation === 'resume') {
              check((await adapter.mount(f.container, { title: 'before' })).ok, 'initial mount succeeds');
              check((await adapter.suspend()).ok, 'initial suspension succeeds');
              outcome = await within(adapter.resume(), 'reentrant resume');
            } else outcome = await within(adapter.mount(f.container, { title: 'activation' }), 'reentrant mount');
            const successful = action === 'successful-self-unregister';
            equal(outcome.status, successful ? 'ok' : action === 'unmount' ? 'skipped' : 'failed', 'activation result reflects reentrant state');
            const snapshot = adapter.snapshot();
            if (successful) {
              check(!snapshot.disposed && snapshot.mounted, 'successful unregister preserves root');
              equal(snapshot.resources.active, 0, 'successfully removed resource stays inactive');
            } else {
              check(snapshot.disposed && !snapshot.mounted && snapshot.phase === 'destroyed', 'activation cannot overwrite terminal state');
              check(snapshot.resources.disposed && snapshot.resources.active === 0, 'scope fully disposed');
              equal(destroys, 1, 'one root teardown');
              const records = adapter.getLifecycleRecords().filter((entry) => entry.operation === operation);
              check(!records.some((entry) => entry.status === 'ok'), 'no success lifecycle record after interrupted activation');
              if (action !== 'unmount') check(snapshot.diagnostics.some((entry) => entry.message === error.message), 'original activation failure retained');
              if (action === 'throwing-self-unregister') {
                equal(snapshot.resources.failures.length, 1, 'one recorded cleanup failure');
                equal(adapter.getCleanupRecords().filter((entry) => entry.resource === 'timer').length, trigger - 1, 'failed cleanup never recorded as release');
              }
            }
            equal([starts, cleanups], [trigger, trigger], 'each started resource cleaned exactly once');
          } finally { await within(f.close(), 'activation cleanup'); }
        });
      }
    }
    await test(`${framework}: real Fabric awaits asynchronous mount and lifecycle completion`, async () => {
      const fabric = createXtendFabric(), gate = deferred();
      const f = fixture(framework, { fabric, loadRuntime: () => gate.promise });
      try {
        let invalid = false;
        try { f.create({ ...f.config, fabric: { createBoundary: () => null } }); } catch (_) { invalid = true; }
        check(invalid, 'an invalid injected Fabric boundary cannot silently disable instrumentation');
        const mounted = f.adapter.mount(f.container, { title: 'fabric async' }); await tick();
        equal(fabric.getFibers().length, 0, 'pending provider has no completed fiber');
        gate.resolve(f.peers); check((await mounted).ok, 'async mount completes');
        await f.update({ title: 'committed' }); await f.adapter.suspend(); await f.adapter.resume(); await f.adapter.unmount();
        equal(fabric.getFibers().map(({ phase, status }) => [phase, status]), ['mount', 'update', 'suspend', 'resume', 'unmount'].map((operation) => [operation, 'completed']), 'real Fabric completes each awaited action');
      } finally { gate.resolve(f.peers); await within(f.close(), 'real Fabric cleanup'); fabric.dispose(); }
    });
    for (const failureMode of framework === 'react' ? ['render'] : ['render', 'watch', 'event']) {
      await test(`${framework}: autonomous ${failureMode} failure terminates without a host update`, async () => {
        const f = fixture(framework);
        try {
          check((await f.adapter.mount(f.container, { title: 'internal', failureMode })).ok, 'healthy initial mount');
          f.container.querySelector('button').click();
          await tick();
          const snapshot = f.adapter.snapshot();
          check(snapshot.disposed && !snapshot.mounted && snapshot.phase === 'destroyed', 'autonomous failure finishes terminal teardown');
          check(snapshot.resources.disposed && !snapshot.resources.running && snapshot.resources.active === 0, 'scope terminated');
          equal(f.stats.destroys, 1, 'one framework teardown'); equal(f.stats.stops, 1, 'cooperative timer released');
          const ticks = f.stats.ticks; await tick(); equal(f.stats.ticks, ticks, 'no post-failure timer work');
          check(snapshot.diagnostics.some((entry) => entry.message === `internal-${failureMode}-error`), 'original error recorded');
          check(!(await within(f.update({ title: 'valid' }), 'post-failure update')).ok, 'later valid props fail promptly');
          check((await within(f.adapter.unmount(), 'post-failure unmount')).status === 'degraded', 'fatal error preserved in terminal result');
          check(!(await f.adapter.mount(f.container, { title: 'retry' })).ok, 'terminal adapter cannot revive');
        } finally { await within(f.close(), 'failure cleanup'); }
      });
    }
    await test(`${framework}: disposal bypasses a blocked lifecycle queue`, async () => {
      const entered = deferred(), gate = deferred();
      const fabric = createXtendFabric();
      const f = fixture(framework, { fabric: { createBoundary(...args) {
        const boundary = fabric.createBoundary(...args);
        return { run(operation, action) { if (operation === 'update') { entered.resolve(); return gate.promise.then(() => boundary.run(operation, action)); } return boundary.run(operation, action); } };
      } } });
      try {
        await f.adapter.mount(f.container, { title: 'queue' }); const pending = f.update({ title: 'queued' }); await within(entered.promise, 'queued update entry');
        check((await within(f.adapter.unmount(), 'independent unmount')).ok, 'teardown independent of blocked update');
        check(!f.adapter.snapshot().mounted && f.adapter.snapshot().resources.disposed, 'root and resources gone before queue released');
        gate.resolve(); check(!(await within(pending, 'cancelled queued update')).ok, 'released queue cannot revive root');
      } finally { gate.resolve(); await within(f.close(), 'queue cleanup'); fabric.dispose(); }
    });
    await test(`${framework}: disposal cancels an update awaiting a lost render completion`, async () => {
      let renders = 0; const gate = deferred();
      const f = fixture(framework, { loadRuntime: () => framework === 'react'
        ? { React: R, ReactDOM: { ...ReactDOM, createRoot(...args) {
          const root = ReactDOM.createRoot(...args);
          return { render(view) { if (++renders === 1) root.render(view); }, unmount: root.unmount.bind(root) };
        } } }
        : { Vue: { ...V, nextTick() { return ++renders === 1 ? V.nextTick() : gate.promise; } } } });
      try {
        await f.adapter.mount(f.container, { title: 'render' }); const pending = f.update({ title: 'pending' }); await tick();
        equal(renders, 2, 'real root mounted and update reached the driver');
        check((await within(f.adapter.unmount(), 'lost-commit unmount')).ok, 'teardown cannot wait for render completion');
        check((await within(pending, 'cancelled render update')).status === 'skipped', 'in-flight update cancelled canonically');
        gate.resolve(); await tick();
        equal(f.container.childNodes.length, 0, 'late completion cannot revive DOM'); equal(f.stats.destroys, 1, 'root destroyed once');
      } finally { gate.resolve(); await within(f.close(), 'lost-commit cleanup'); }
    });
    await test(`${framework}: real props, events, local state, DOM identity and 50 retained cycles`, async () => {
      const f = fixture(framework);
      try {
        const mounted = await f.adapter.mount(f.container, { title: 'first' });
        check(mounted.ok, JSON.stringify(mounted));
        const button = f.container.querySelector('button'), input = f.container.querySelector('input'), scroll = f.container.querySelector('[data-scroll]');
        button.click(); input.value = 'retained draft'; input.dispatchEvent(new document.defaultView.Event('input', { bubbles: true })); await tick();
        scroll.scrollTop = 37;
        check(button.textContent === 'first:1', 'real state updated');
        check((await f.update({ title: 'second' })).ok, 'props update succeeded');
        check(button.textContent === 'second:1', 'props render and state retained');
        button.click(); await tick();
        check(f.stats.events.at(-1).payload.title === 'second', 'event handler reads latest props');
        check(f.stats.events.at(-1).schema === 'xtend.xtensions.surface-event.v1' && f.stats.events.at(-1).ok, 'canonical normalized event');
        for (let i = 0; i < 50; i++) {
          check((await f.adapter.suspend()).ok, 'suspend succeeded');
          check(f.stats.signal.aborted && f.adapter.snapshot().resources.active === 0, 'scope stopped');
          const ticks = f.stats.ticks; f.stats.stale.forEach((cb) => cb()); equal(f.stats.ticks, ticks, 'stale callbacks blocked');
          check((await f.update({ title: 'ignored' })).status === 'skipped', 'suspended update explicitly skipped');
          check((await f.adapter.resume()).ok, 'resume succeeded');
          check(f.container.querySelector('button') === button && f.container.querySelector('input') === input, 'DOM retained');
        }
        equal(input.value, 'retained draft', 'draft retained'); equal(scroll.scrollTop, 37, 'scroll retained');
        equal(f.stats.mounts, 1, 'one framework mount'); equal(f.stats.starts, 51, 'resource generations restarted');
        equal(f.outside.textContent, 'host-owned', 'host sibling unchanged');
        const unmounted = await f.adapter.unmount(); check(unmounted.ok, 'unmount succeeded');
        equal(f.stats.destroys, 1, 'one framework destroy'); equal(f.stats.stops, 51, 'all resources released');
        equal(f.container.childNodes.length, 0, 'root empty');
        check(unmounted.cleanupRecords.every((record) => record.xtensionId && record.schema === 'xtend.xtensions.host-resource-cleanup-record.v1'), 'canonical cleanup records');
        check((await f.adapter.mount(f.container, {})).status === 'failed', 'disposed instance cannot remount');
      } finally { await f.close(); }
    });
    await test(`${framework}: suspension is cooperative, ordinary component work continues`, async () => {
      const f = fixture(framework);
      try { await f.adapter.mount(f.container, { title: 'work' }); await f.adapter.suspend();
        const events = f.stats.events.length; f.container.querySelector('button').click(); await tick();
        equal(f.container.querySelector('button').textContent, 'work:1', 'framework state is not frozen');
        equal(f.stats.events.length, events, 'suspended event delivery denied');
        if (framework === 'vue') equal(f.stats.watchers, 1, 'ordinary Vue watcher still runs');
      } finally { await f.close(); }
    });
    await test(`${framework}: simultaneous mount shares one load and root`, async () => {
      const gate = deferred(); let loads = 0;
      const f = fixture(framework, { loadRuntime: () => { loads++; return gate.promise; } });
      try {
        const first = f.adapter.mount(f.container, { title: 'one' }), second = f.adapter.mount(f.container, { title: 'two' });
        check(first === second, 'single-flight promise'); await tick(); gate.resolve(f.peers);
        check((await first).ok && (await second).ok, 'both callers complete');
        equal(loads, 1, 'one peer load'); equal(f.stats.mounts, 1, 'one real mount');
        equal(f.container.querySelector('button').textContent, 'one:0', 'first mount wins');
      } finally { await f.close(); }
    });
    for (const reject of [false, true]) await test(`${framework}: dispose cancels pending load (${reject ? 'reject' : 'resolve'})`, async () => {
      const gate = deferred(); let signal;
      const f = fixture(framework, { loadRuntime: (ctx) => { signal = ctx.signal; return gate.promise; } });
      try {
        const mounting = f.adapter.mount(f.container, { title: 'late' }); await tick();
        const unmounting = f.adapter.unmount(); check((await unmounting).ok, 'dispose completes without provider');
        check((await mounting).status === 'skipped' && signal.aborted, 'pending mount cancelled');
        if (reject) gate.reject(new Error('late provider failure')); else gate.resolve(f.peers);
        await tick(); equal(f.stats.mounts, 0, 'late provider cannot mount'); equal(f.container.childNodes.length, 0, 'no late DOM');
      } finally { await f.close(); }
    });
    for (const mode of ['missing', 'version', 'mismatch', 'exports']) await test(`${framework}: rejects ${mode} peers`, async () => {
      const f = fixture(framework, { loadRuntime: () => {
        if (mode === 'missing') return undefined;
        if (framework === 'react') return { React: { ...R, ...(mode === 'version' ? { version: '17.0.2' } : {}) }, ReactDOM: { ...ReactDOM, ...(mode === 'mismatch' ? { version: '18.0.0' } : {}), ...(mode === 'exports' ? { createRoot: null } : {}) } };
        return { Vue: { ...V, ...(mode === 'version' ? { version: '2.7.0' } : {}), ...(mode === 'mismatch' ? { version: '3.5.0-lie' } : {}), ...(mode === 'exports' ? { nextTick: null } : {}) } };
      } });
      try { const result = await f.adapter.mount(f.container, { title: 'bad' }); check(!result.ok, 'bad peer rejected'); equal(f.stats.mounts, 0, 'component never mounted'); }
      finally { await f.close(); }
    });
    await test(`${framework}: accepts ERP flat peer ABI with explicit actual version metadata`, async () => {
      const f = fixture(framework, { peers: framework === 'react' ? { default: R, createRoot: ReactDOM.createRoot, reactDOMVersion: ReactDOM.version } : V });
      try { check((await f.adapter.mount(f.container, { title: 'flat' })).ok, 'flat runtime mounted'); }
      finally { await f.close(); }
    });
    for (const when of ['mount', 'update']) await test(`${framework}: ${when} render error is contained and root torn down`, async () => {
      const f = fixture(framework);
      try {
        let result = await f.adapter.mount(f.container, { title: 'error', explode: when === 'mount' });
        if (when === 'update') result = await f.update({ title: 'error', explode: true });
        check(!result.ok && result.diagnostics.length > 0, 'render failure reported');
        check(!f.adapter.snapshot().mounted && f.adapter.snapshot().resources.active === 0, 'failed root and resources released');
        equal(f.outside.textContent, 'host-owned', 'host still usable');
      } finally { await f.close(); }
    });
    await test(`${framework}: throwing resource cleanup cannot prevent root teardown`, async () => {
      const f = fixture(framework, { policy: { allowedResources: ['timer', 'bad', 'last'] } });
      try {
        await f.adapter.mount(f.container, { title: 'cleanup' });
        f.handle().resources.register('bad', () => () => { f.stats.order.push('bad'); throw new Error('throwing cleanup'); });
        f.handle().resources.register('last', () => () => f.stats.order.push('last'));
        const result = await f.adapter.unmount(); equal(result.status, 'degraded', 'cleanup failure observable');
        equal(f.stats.order, ['last', 'bad'], 'reverse cleanup'); equal(f.stats.destroys, 1, 'framework unmounted');
        equal(f.stats.stops, 1, 'remaining resource released');
        check(!result.cleanupRecords.some((record) => record.resource === 'bad'), 'failed cleanup never falsely recorded as released');
      } finally { await f.close(); }
    });
    await test(`${framework}: host authority, DOM and payload boundaries`, async () => {
      const f = fixture(framework);
      try {
        check((await f.adapter.mount(f.outside, { title: 'bad' })).status === 'policy-blocked', 'foreign target denied');
        check((await f.adapter.mount(f.container, {}, { policy: { trusted: true } })).status === 'policy-blocked', 'mount cannot elevate policy');
        let accessed = false; const getter = {}; Object.defineProperty(getter, 'title', { enumerable: true, get() { accessed = true; return 'bad'; } });
        const cycle = {}; cycle.self = cycle;
        for (const payload of [getter, cycle, { element: document.body }, { callback() {} }, { dangerouslySetInnerHTML: { __html: '<script />' } }, JSON.parse('{"__proto__":{"admin":true}}'), { ref: 'host' }, { nested: V.reactive({ value: 1 }) }, framework === 'react' ? { reactContext: {} } : { globalProperties: {} }]) {
          check((await f.adapter.mount(f.container, payload)).status === 'policy-blocked', 'unsafe initial props blocked');
        }
        check(!accessed, 'accessor never invoked');
        check((await f.adapter.mount(f.container, { title: 'safe' })).ok, 'valid mount remains usable');
        check((await f.update({ node: document.body })).status === 'policy-blocked', 'DOM in update denied');
        check(!f.adapter.emit({ type: 'global.any', payload: {} }).ok, 'ungranted event denied');
        check(!f.adapter.emit({ type: 'select', owner: 'host', payload: {} }).ok, 'event authority cannot be forged');
        check(!f.adapter.emit({ type: 'select', payload: cycle }).ok, 'cyclic event denied without throwing');
        let blocked = false; try { f.handle().resources.register('network', () => () => {}); } catch (_) { blocked = true; }
        check(blocked, 'component cannot grant itself a resource');
        check(!('policy' in f.handle()) && !('container' in f.handle()) && !('start' in f.handle().resources), 'component facade has no host authority');
        f.config.policy.events.rogue = 'rogue.v1'; check(!f.adapter.emit({ type: 'rogue' }).ok, 'host config captured, not live-mutated');
      } finally { await f.close(); }
    });
    await test(`${framework}: occupied SSR container and remote runtime stay blocked`, async () => {
      const f = fixture(framework, { runtimeBoundary: { runtimeProvider: { modules: ['https://example.invalid/peer', '//remote/peer'], remoteAllowed: true } } });
      try {
        check((await f.adapter.mount(f.container, {})).status === 'policy-blocked', 'unsafe runtime provider denied');
        const clean = f.create({ ...f.config, runtimeBoundary: {} });
        const ssr = document.createElement('p'); ssr.textContent = 'SSR'; f.container.append(ssr);
        check((await clean.mount(f.container, {})).status === 'policy-blocked', 'SSR requires adoption path');
        check(f.container.firstChild === ssr, 'SSR node identity preserved'); await clean.unmount(); check(f.container.firstChild === ssr, 'unmounted rejected adapter leaves SSR alone');
      } finally { await f.close(); }
    });
    await test(`${framework}: manifest version mismatch is rejected`, async () => {
      const f = fixture(framework, { expectedVersions: framework === 'react' ? { react: '19.0.0' } : { vue: '3.5.0' } });
      try { check(!(await f.adapter.mount(f.container, { title: 'version' })).ok, 'actual peer disagrees with host manifest'); equal(f.stats.mounts, 0, 'no bootstrap'); }
      finally { await f.close(); }
    });
    await test(`${framework}: declared dependency ranges validate actual runtime versions`, async () => {
      const f = fixture(framework, { runtimeBoundary: { dependencies: [{ name: framework, versionRange: framework === 'react' ? '20.x' : '3.5.0', classification: 'host-provided' }] } });
      try { check(!(await f.adapter.mount(f.container, { title: 'range' })).ok, 'manifest dependency mismatch rejected'); equal(f.stats.mounts, 0, 'no framework mount'); }
      finally { await f.close(); }
    });
    await test(`${framework}: two controllers cannot claim the same container`, async () => {
      const gate = deferred(); const f = fixture(framework, { loadRuntime: () => gate.promise });
      const other = f.create({ ...f.config, loadRuntime: undefined });
      try {
        const first = f.adapter.mount(f.container, { title: 'owner' });
        check((await other.mount(f.container, { title: 'collision' })).status === 'policy-blocked', 'in-flight container already owned');
        gate.resolve(f.peers); check((await first).ok, 'first owner completes');
        await other.unmount(); check(f.container.querySelector('button'), 'unmount of rejected controller cannot clear owner');
      } finally { await other.unmount(); await f.close(); }
    });
    await test(`${framework}: ownership is rechecked after async load`, async () => {
      const gate = deferred(); const f = fixture(framework, { loadRuntime: () => gate.promise });
      try {
        const pending = f.adapter.mount(f.container, { title: 'race' });
        const hostNode = document.createElement('span'); hostNode.textContent = 'new host content'; f.container.append(hostNode);
        gate.resolve(f.peers); check(!(await pending).ok, 'changed container rejected');
        check(f.container.firstChild === hostNode, 'new host content preserved');
      } finally { await f.close(); }
    });
    await test(`${framework}: dispose after root creation cannot revive a render`, async () => {
      let disposed;
      const f = fixture(framework, { loadRuntime: () => {
        if (framework === 'react') return { React: R, ReactDOM: { ...ReactDOM, createRoot(target, options) {
          const root = ReactDOM.createRoot(target, options);
          return { render(view) { root.render(view); disposed = f.adapter.unmount(); }, unmount() { root.unmount(); } };
        } } };
        return { Vue: { ...V, createApp(...args) {
          const app = V.createApp(...args); const mount = app.mount.bind(app);
          app.mount = (...mountArgs) => { const value = mount(...mountArgs); disposed = f.adapter.unmount(); return value; }; return app;
        } } };
      } });
      try {
        check((await f.adapter.mount(f.container, { title: 'late render' })).status === 'skipped', 'mount result invalidated after render');
        check((await disposed).ok && f.adapter.snapshot().disposed, 'disposal completes');
        await tick(); equal(f.container.childNodes.length, 0, 'no delayed root can reappear');
        equal(f.adapter.snapshot().resources.active, 0, 'no resumed resources');
      } finally { await f.close(); }
    });
    await test(`${framework}: Fabric observes every lifecycle operation`, async () => {
      const operations = [];
      const f = fixture(framework, { fabric: { createBoundary(id, options) {
        check(id === `surface.${framework}` && options.source === 'xtension', 'boundary ownership');
        return { run(operation, action) { operations.push(operation); return action(); } };
      } } });
      try {
        await f.adapter.mount(f.container, { title: 'fabric' }); await f.update({ title: 'next' });
        await f.adapter.suspend(); await f.adapter.resume(); await f.adapter.unmount();
        equal(operations, ['mount', 'update', 'suspend', 'resume', 'unmount'], 'Fabric transition trace');
        equal(f.adapter.getLifecycleRecords().map((record) => record.sequence), [1, 2, 3, 4, 5], 'canonical monotonic lifecycle records');
      } finally { await f.close(); }
    });
    await test(`${framework}: real component cleanup errors are reported during disposal`, async () => {
      const f = fixture(framework);
      try {
        check((await f.adapter.mount(f.container, { title: 'cleanup', throwCleanup: true })).ok, 'real component mounted');
        const result = await f.adapter.unmount();
        check(result.status === 'degraded', 'framework-reported cleanup error retained during disposal');
        check(result.diagnostics.some((entry) => entry.message.includes('component-cleanup')), 'actual cleanup exception diagnosed');
        check(!result.cleanupRecords.some((entry) => entry.resource === `${framework}-root`), 'failed root cleanup not marked released');
        equal(f.adapter.snapshot().resources.active, 0, 'other resources released');
      } finally { await f.close(); }
    });
    await test(`${framework}: throwing framework teardown is observable and idempotent`, async () => {
      const f = fixture(framework, { loadRuntime: () => framework === 'react'
        ? { React: R, ReactDOM: { ...ReactDOM, createRoot(...args) { const root = ReactDOM.createRoot(...args); return { render: root.render.bind(root), unmount() { root.unmount(); throw new Error('root cleanup'); } }; } } }
        : { Vue: { ...V, createApp(...args) { const app = V.createApp(...args); const unmount = app.unmount.bind(app); app.unmount = () => { unmount(); throw new Error('app cleanup'); }; return app; } } } });
      try {
        check((await f.adapter.mount(f.container, { title: 'teardown' })).ok, 'real root mounted');
        const first = f.adapter.unmount(); check(first === f.adapter.unmount(), 'one terminal teardown');
        check((await first).status === 'degraded', 'framework cleanup failure visible');
        equal(f.stats.stops, 1, 'resources still released'); equal(f.stats.destroys, 1, 'framework cleanup attempted once');
      } finally { await f.close(); }
    });
    await test(`${framework}: host policy also restricts suspend and props validation`, async () => {
      const f = fixture(framework, { policy: { allowedResources: ['timer'], authorize: ({ operation }) => operation !== 'suspend', validateProps: (props) => typeof props.title === 'string' } });
      try {
        check((await f.adapter.mount(f.container, { title: 'allowed' })).ok, 'mount allowed');
        check((await f.adapter.suspend()).status === 'policy-blocked', 'suspend denial is a policy result');
        check(!f.adapter.snapshot().suspended, 'denied suspend leaves instance active');
        check((await f.update({ title: 3 })).status === 'policy-blocked', 'host props validator enforced');
        check((await f.adapter.update({ type: 'grant.policy', props: { title: 'bad' } })).status === 'policy-blocked', 'unsupported operation denied');
      } finally { await f.close(); }
    });
    await test(`${framework}: host policy denial applies before render`, async () => {
      const f = fixture(framework, { policy: { authorize: () => false } });
      try { check((await f.adapter.mount(f.container, {})).status === 'policy-blocked', 'host denial respected'); equal(f.stats.mounts, 0, 'no framework work'); }
      finally { await f.close(); }
    });
  }
  return { ok: failed.length === 0, passed, failed, versions: { react: R.version, reactDOM: ReactDOM.version, vue: V.version }, retainedCyclesPerFramework: 50 };
}
module.exports = { runRuntimeAcceptance };

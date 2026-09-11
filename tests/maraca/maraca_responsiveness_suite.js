const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { pathToFileURL } = require('url');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { createDeterministicHost } = require('../rmt-language/rmt_kernel_scheduler_suite');
const { createFakeDocument } = require('../rmt/rmt_dom_descriptor_renderer_suite');
const { compileRmtVNextSource } = require('../../tools/rmt-language/vnext-compiler');
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const turns = async (count = 40) => { for (let i = 0; i < count; i++) await Promise.resolve(); };

async function runMaracaResponsivenessSuite({ rootDir = path.resolve(__dirname, '../..') } = {}) {
  const context = createSuiteContext({ id: 'maraca-responsiveness', label: 'Maraca shell responsiveness and presentation lifetimes' });
  const imp = file => import(pathToFileURL(path.join(rootDir, file)).href);
  const [{ createMaracaPlanRuntime, createMaracaAbortBoundary }, schedulerApi] = await Promise.all([
    imp('xtend-maraca/plan-runtime.mjs'), imp('xtendrmt/rmt-kernel-scheduler.js')
  ]);
  const modules = Object.fromEntries(await Promise.all(Object.entries({
    state: 'rmt-state-selector-runtime', action: 'rmt-action-effect-runtime', app: 'rmt-app-runtime',
    renderer: 'rmt-dom-descriptor-renderer', viewProjection: 'rmt-maraca-view-projection-adapter',
    surfaces: 'rmt-surface-resource-graph-runtime', events: 'rmt-event-routing-runtime',
    presentation: 'rmt-presentation-effect-adapter'
  }).map(async ([key, name]) => [key, await imp(`xtendrmt/${name}.js`)])));
  modules.surfaceController = await imp('components/xsurfacemanager-controller.js');

  for (const source of [
    'action go { execution fastpass; effect navigation "/next"; }',
    'action go { execution fastpass; input path string; effect navigation input.path; }',
    'surface panel kind region component x-button {} action shut { execution fastpass; effect close surface panel; }'
  ]) {
    const compiled = compileRmtVNextSource(source);
    context.assert(compiled.ok, `compiler accepts shell authoring: ${source} (${JSON.stringify(compiled.diagnostics)})`);
    if (compiled.ok) context.assert(compiled.orchestrationArtifacts.actions.actions.some(action => action.execution === 'fastpass'), 'execution survives orchestration lowering');
  }
  for (const body of ['effect fetch datasource api;', 'reduce state.count = 1;', 'emit saved;', 'status state.loading;', 'on success effect custom;']) {
    const compiled = compileRmtVNextSource(`action bad { execution fastpass; effect navigation "/next"; ${body} }`);
    context.assert(!compiled.ok, `compiler rejects business work: ${body}`);
  }
  const host = createDeterministicHost();
  const scheduler = schedulerApi.createRmtKernelScheduler({ hostPort: host, preferPostTask: false });
  const parent = createMaracaAbortBoundary({ id: 'parent' });
  const child = createMaracaAbortBoundary({ id: 'child', parent });
  let commits = 0;
  const old = child.capture();
  const queued = child.scheduleCommit(scheduler, () => commits++, old, { delayMs: 100 });
  parent.setActive(false, 'close');
  context.assert((await queued).status === 'superseded' && commits === 0, 'parent close cancels a scheduled child commit');
  await host.advance(200);
  context.assert(commits === 0 && scheduler.snapshot().activeJobId == null, 'cancelled presentation leaves no executing job');
  parent.setActive(true, 'reopen');
  context.assert(!child.isCurrent(old) && child.isCurrent(child.capture()), 'rapid reopen never revives an old token');
  const response = deferred();
  const work = child.run(() => response.promise);
  child.invalidate('new-data');
  context.assert((await work).status === 'superseded', 'new data supersedes a held computation');
  response.reject(new Error('late worker failure'));
  await turns();
  context.assert(!child.isCurrent(parent.capture()), 'tokens cannot cross boundary identities');
  const stale = child.capture(); child.dispose();
  const replacement = createMaracaAbortBoundary({ id: 'child', parent });
  context.assert(!replacement.isCurrent(stale), 'same ID after recreate has a distinct presentation identity');
  parent.dispose();
  context.assert(replacement.disposed && !replacement.isCurrent(replacement.capture()), 'parent disposal includes child boundaries');
  scheduler.dispose();

  // Native Maraca model, actions, renderer, Surface Controller and shared scheduler.
  const documentTarget = createFakeDocument();
  const root = documentTarget.createElement('main'); root.ownerDocument = documentTarget;
  root.contains = node => { for (let current = node; current; current = current.parentNode) if (current === root) return true; return false; };
  root.querySelectorAll = selector => {
    const found = [];
    const visit = node => { if (node !== root && node.getAttribute && selector === '[data-maraca-surface]' && node.getAttribute('data-maraca-surface')) found.push(node); (node.childNodes || []).forEach(visit); };
    visit(root); return found;
  };
  const shared = schedulerApi.createRmtKernelScheduler({ preferPostTask: false });
  const surfaceController = modules.surfaceController.createSurfaceController();
  let held = deferred();
  let hostStarted = 0, snapshots = 0, hydrationWork = null, hydrationContext = null;
  const navigation = [], focuses = [], modelCommits = [];
  const artifact = {
    state: { states: [{ id: 'count', type: 'number', initial: 0 }], reducers: [
      { id: 'slow-count', action: 'slow', state: 'count', value: 1 },
      { id: 'next-count', action: 'next', state: 'count', value: 2 }
    ] },
    actions: { actions: [{ id: 'slow', datasource: 'held', effects: ['old-navigation'] }, { id: 'next' }], dataSources: [{ id: 'held', kind: 'host' }], effects: [{ id: 'old-navigation', kind: 'navigation', path: '/stale' }] },
    surfaces: [{ id: 'panel', kind: 'region', component: 'div', initialState: 'open', source: 'count', repeat: false }],
    render: { root: { type: 'element', tag: 'div', surface: 'panel', attributes: { 'data-maraca-surface': 'panel' }, children: ['Panel'] } },
    patchPlan: { reducers: [{ action: 'next', surface: 'panel' }, { action: 'slow', surface: 'panel' }] }
  };
  const runtime = createMaracaPlanRuntime({
    plan: { artifact }, root, documentTarget, surfaceController, scheduler: shared,
    kernelController: { scheduler: shared, scheduleWork(kind, work) { return shared.schedule({ lane: 'visible', endpointName: kind }, work); }, snapshot() { snapshots++; return shared.snapshot(); } },
    loadModules: async () => modules,
    dataSourceAdapters: { host: { invoke() { hostStarted++; return held.promise; } } },
    navigationAdapter: { navigate(path) { navigation.push(path); } }, focusAdapter: { focus(id) { focuses.push(id); } },
    componentRegistry: { hydrate(_root, _tags, metadata) { hydrationContext = metadata; return hydrationWork ? hydrationWork.promise : null; } },
    fastPassActions: [
      { id: 'navigate', effects: [{ kind: 'navigation', path: { kind: 'reference', path: 'input.path' } }] },
      { id: 'focus', effects: [{ kind: 'focus', target: 'panel' }] },
      { id: 'close', effects: [{ kind: 'close', target: 'panel' }] }
    ]
  });
  await runtime.boot();
  snapshots = 0;
  const events = [];
  const unsubscribeEvents = runtime.subscribeEvents(event => { events.push(event); });
  runtime.stateRuntime;
  context.assert(snapshots === 0 && events.length > 0 && Object.isFrozen(events[0]), 'event-only subscribers receive immutable events without full snapshots');
  const oldEvent = events[0];
  const full = [];
  const unsubscribeFull = runtime.subscribe(value => full.push(value));
  await runtime.dispatchFastPass('focus');
  focuses.length = 0;
  context.assert(snapshots === 1 && full.length === 1 && JSON.stringify(full[0].lastEvent) === JSON.stringify(events[events.length - 1]), `a publication produces one shared full snapshot when requested (snapshots=${snapshots}, full=${full.length}, last=${JSON.stringify(full[0]?.lastEvent)}, event=${JSON.stringify(events.at(-1))})`);
  unsubscribeFull(); snapshots = 0;
  let reentrant = 0;
  const stopReentrant = runtime.subscribeEvents(event => { reentrant++; if (reentrant === 1) runtime.snapshot(); throw new Error('observer'); });
  const stopModel = runtime.model.subscribe(event => { const value = event.next && event.next.states && event.next.states.count; if (value != null) modelCommits.push(value); });
  const slow = runtime.dispatchCommand('slow');
  const next = runtime.dispatchCommand('next');
  await turns();
  context.assert(hostStarted === 1, 'business command is held in its host effect');
  const first = runtime.dispatchFastPass('navigate', { path: '/old' });
  const latest = runtime.dispatchCommand('navigate', { path: '/new' });
  await latest;
  await runtime.dispatchFastPass('focus').result;
  const panelBoundary = runtime.getSurfaceBoundary('panel');
  const panelToken = panelBoundary.capture();
  await runtime.dispatchCommand('close');
  await runtime.dispatchCommand('close');
  context.assert(first.status === 'cancelled' && navigation.join() === '/new' && focuses.join() === 'panel', 'FastPass coalesces navigation and bypasses the held command queue');
  context.assert(!panelBoundary.isCurrent(panelToken) && !panelBoundary.active, 'close invalidates the managed boundary and remains idempotent');
  const panel = root.querySelectorAll('[data-maraca-surface]')[0];
  context.assert(panel && panel.getAttribute('hidden') !== null, 'FastPass closes the visible shell through the renderer');
  held.resolve({ count: 1 });
  await Promise.all([slow, next]);
  context.assert(runtime.model.getState('count') === 2 && modelCommits.join() === '1,2', 'business model commits keep their order after FastPass');
  context.assert(navigation.join() === '/new' && panel.getAttribute('hidden') !== null, 'late model completion cannot restore the old navigation or reopen the panel');
  context.assert(oldEvent.type === 'diagnostic' && Object.isFrozen(oldEvent), 'later publications preserve immutable lastEvent values');
  stopReentrant(); snapshots = 0;
  await runtime.dispatchCommand('next');
  context.assert(snapshots === 0, 'unsubscribing full observers restores demand-free operation');
  const snap = runtime.snapshot();
  context.assert(snap.phase === 'ready' && JSON.parse(JSON.stringify(snap)).phase === 'ready' && snapshots === 1, 'on-demand snapshots remain current and serializable');
  surfaceController.apply([{ operation: 'open', id: 'panel' }]);
  held = deferred();
  const obsoleteCommand = runtime.dispatchCommand('slow');
  await turns();
  const commitsBeforeClose = runtime.snapshot().commitCount;
  surfaceController.apply([{ operation: 'close', id: 'panel' }]);
  held.resolve({ count: 1 }); await obsoleteCommand;
  context.assert(!panelBoundary.active && runtime.snapshot().commitCount === commitsBeforeClose, 'direct lifecycle close blocks an older command presentation while its model commits');
  // Failed atomic lifecycle work must not advance the boundary.
  surfaceController.apply([{ operation: 'open', id: 'panel' }]);
  const valid = panelBoundary.capture();
  const failed = surfaceController.apply([{ operation: 'close', id: 'panel' }, { operation: 'open', id: 'missing' }]);
  context.assert(!failed.ok && panelBoundary.isCurrent(valid), 'failed atomic surface operations leave the epoch intact');
  hydrationWork = deferred();
  const hydrating = runtime.dispatchCommand('next');
  await turns();
  context.assert(hydrationContext && hydrationContext.surfaces[0]?.isCurrent(), 'hydration receives current per-surface scopes');
  await runtime.dispatchFastPass('close').result;
  await hydrating;
  context.assert(!hydrationContext.surfaces[0]?.isCurrent(), 'surface close settles held hydration and invalidates its commit context');
  let staleChart = 0;
  hydrationWork.resolve(panelBoundary.commit(() => staleChart++, valid));
  await turns();
  context.assert(staleChart === 0, 'late chart initialization cannot commit after close');
  unsubscribeEvents(); stopModel(); runtime.dispose(); shared.dispose();
  context.assert(!panelBoundary.isCurrent(panelBoundary.capture()), 'runtime disposal closes owned boundaries');

  // Reopen while an older resource acquisition is still returning.
  const leaseBoundary = createMaracaAbortBoundary({ id: 'lease' });
  const leaseController = modules.surfaceController.createSurfaceController();
  leaseController.subscribe(snapshot => {
    const record = snapshot.surfaces.find(entry => entry.id === 'lease');
    if (record) leaseBoundary.setActive(record.status === 'open');
  });
  const acquisitions = [], owners = new Set(), released = [];
  const graph = modules.surfaces.createRmtSurfaceResourceGraphRuntime({
    surfaces: [{ id: 'lease', kind: 'region', resources: ['chart'], closeReleasesResources: true }],
    surfaceController: leaseController, getSurfaceBoundary: () => leaseBoundary,
    resourceManager: {
      async acquireMany(_resources, owner) { const gate = deferred(); acquisitions.push({ gate, owner }); await gate.promise; owners.add(owner); return [{ owner }]; },
      releaseOwner(owner) { released.push(owner); owners.delete(owner); return { releasedCount: 1 }; }
    }
  });
  const oldOpen = graph.openSurface('lease');
  graph.closeSurface('lease');
  context.assert((await oldOpen).status === 'superseded', 'close settles a held resource acquisition');
  const newOpen = graph.openSurface('lease');
  acquisitions[1].gate.resolve(); await newOpen;
  acquisitions[0].gate.resolve(); await turns();
  context.assert(owners.size === 1 && owners.has(acquisitions[1].owner) && !released.includes(acquisitions[1].owner), 'late acquisition cleanup cannot release the reopened surface resources');
  graph.dispose(); leaseBoundary.dispose(); leaseController.dispose();
  context.assert(owners.size === 0, 'surface disposal releases the current presentation lease');

  // Actual worker transport: closing a presentation settles/removes only its request.
  const scope = { __XTENDRMT_GLOBAL__: { AppModules: {} } };
  vm.runInNewContext(fs.readFileSync(path.join(rootDir, 'xtendrmt/kernel/modules/rmt-prewarm-worker-runtime.js'), 'utf8'), scope);
  let worker;
  class Worker {
    constructor() { worker = this; this.messages = []; }
    postMessage(message) { this.messages.push(message); if (message.action === 'sync_templates') queueMicrotask(() => this.onmessage({ data: { id: message.id, result: {} } })); }
    terminate() { this.terminated = true; }
  }
  const prewarm = scope.__XTENDRMT_GLOBAL__.AppModules.createRmtPrewarmWorkerRuntime({ workerCtor: Worker, blobCtor: Blob, urlApi: { createObjectURL: () => 'blob:test', revokeObjectURL() {} }, buildWorkerSource: () => '', templateApi: { listTemplates: () => [] } });
  const boundary = createMaracaAbortBoundary();
  const compute = prewarm.dispatchUiComputeEnvelope({ rootId: 'panel' }, { abortBoundary: boundary });
  await turns();
  const sent = worker.messages.find(message => message.action === 'ui_compute');
  context.assert(Boolean(sent), 'worker compute starts with a scoped presentation');
  boundary.invalidate('close');
  context.assert((await compute).status === 'superseded' && prewarm.getTopologySnapshot().pendingJobs === 0, 'invalidated worker request settles and frees its resolver');
  if (sent) worker.onmessage({ data: { id: sent.id, result: { ok: true } } });
  context.assert(!worker.terminated && prewarm.getTopologySnapshot().pendingJobs === 0, 'late worker reply is ignored while shared prewarming stays available');
  boundary.dispose(); prewarm.terminateWorker();
  const { installMaterialDevApi } = await imp('xtend-builder/templates/app/material-dev-api.template.mjs');
  const devTarget = new EventTarget();
  let devSnapshots = 0, eventSink = null, connections = 0, disconnections = 0, state = 'ready';
  const devApi = installMaterialDevApi({ target: devTarget, bootResult: { ok: true, password: 'boot-secret' } });
  const observations = [];
  const stopEarly = devApi.subscribe(event => observations.push(event));
  devTarget.XTendMaraca = {
    kernel: { snapshot() { devSnapshots++; return { enabled: true, status: 'booted', panicRecovery: { state }, credentials: { accessToken: 'secret' } }; } },
    subscribeEvents(listener) { connections++; eventSink = listener; return () => { disconnections++; eventSink = null; }; }
  };
  devTarget.dispatchEvent(new Event('xtend-maraca:boot'));
  context.assert(connections === 1 && devSnapshots === 0, 'early DEV attachment connects to events without snapshot demand');
  eventSink({ type: 'state', generation: 2, privatePayload: 'sensitive' });
  context.assert(observations.length === 1 && !JSON.stringify(observations).includes('sensitive') && devSnapshots === 0, 'DEV observation emits only a small immutable change signal');
  state = 'panic';
  const panic = devApi.getKernelSnapshot();
  context.assert(panic.metadata.runtime.panicRecovery.state === 'panic' && panic.metadata.runtime.credentials.accessToken === '[redacted]', 'explicit DEV snapshots read current panic diagnostics and redact credentials');
  stopEarly();
  const stopLate = devApi.subscribe(() => {});
  context.assert(connections === 2 && disconnections === 1 && devSnapshots === 1, 'late DEV reconnect does not enable continuous snapshots');
  stopLate();
  context.assert(disconnections === 2 && eventSink === null, 'DEV disconnect releases its subscription');
  const example = compileRmtVNextSource(fs.readFileSync(path.join(rootDir, 'demos/xtendrmt/maraca-fastpass/app.rmt'), 'utf8'));
  context.assert(example.ok && example.orchestrationArtifacts.events.length === 3, 'native FastPass example compiles its event bindings');
  for (const extra of [{ reducers: [{}] }, { datasource: 'service' }, { emits: ['saved'] }, { effects: [{ kind: 'service' }] }, { effects: [] }]) {
    let rejected = false;
    try { createMaracaPlanRuntime({ root, plan: {}, fastPassActions: [{ id: 'bad', effects: [{ kind: 'navigation', path: '/ok' }], ...extra }] }); }
    catch (error) { rejected = error.code === 'xtend.maraca.fastpass.invalid-action'; }
    context.assert(rejected, `runtime rejects unsafe FastPass definition ${JSON.stringify(extra)}`);
  }
  return context.result();
}
function printMaracaResponsivenessReport(result) { printSuiteReport(result); }
module.exports = { runMaracaResponsivenessSuite, printMaracaResponsivenessReport };
if (require.main === module) runMaracaResponsivenessSuite().then(result => { console.log(JSON.stringify({ ok: result.ok, passes: result.passes.length, failures: result.failures })); process.exitCode = result.ok ? 0 : 1; }).catch(error => { console.error(error); process.exitCode = 1; });

import { runKeyedRuntimeAcceptance } from '../keyed-profile/runtime-acceptance.mjs';
import { createScopedFixture } from '../scoped-fixture.mjs';

const check = (value, message) => { if (!value) throw Error(message); };
const clone = value => structuredClone(value);
const selected = context => context.container.querySelector('select');
const address = context => JSON.stringify([context.identity.address.documentId, context.identity.address.declarationId, context.identity.address.keys]);
const host = (fixture, declaration, group, product) => [...fixture.contexts].reverse().find(context => context.identity.address.declarationId === declaration && JSON.stringify(context.identity.address.keys) === JSON.stringify([group, product]));
const row = (fixture, slug) => [...fixture.root.querySelectorAll('[data-native-slug]')].find(node => node.getAttribute('data-native-slug') === slug);
const owner = fixture => fixture.root.querySelector('[data-rmt-surface="product-details"]');
const domain = fixture => JSON.stringify(fixture.app.facade.model.snapshot().states);
const capture = fixture => JSON.stringify(fixture.app.facade.model.getState('intentCapture'));
const emit = (context, event, payload) => context.onEvent({ ok: true, direction: 'upstream', event, payloadSchema: context.events[event], payload,
  source: { hostId: context.hostId, surfaceId: context.surfaceId, xtensionId: context.xtensionId } });
async function waitFor(callback) {
  for (let attempt = 0; attempt < 200; attempt++) { if (callback()) return; await new Promise(resolve => setTimeout(resolve, 5)); }
  throw Error('The declared Native/Framework transaction did not reach its boundary.');
}
async function replaceCatalog(fixture, value) { await fixture.app.facade.dispatchCommand('catalog.replace', { catalog: value }); await fixture.idle(); }
async function rejectsWithoutMutation(fixture, command, payload) {
  const before = domain(fixture), html = fixture.root.innerHTML, roots = fixture.hosts.map(entry => entry.host.snapshot()), count = fixture.contexts.length;
  const projectedState = JSON.stringify(fixture.options.stateProjectionTarget.snapshot().data);
  let rejected = false;
  try { const result = await fixture.app.facade.dispatchCommand(command, payload); rejected = ['error', 'failed', 'rejected'].includes(result?.status); }
  catch (_) { rejected = true; }
  check(rejected, 'invalid Native View command must reject');
  await fixture.idle();
  check(domain(fixture) === before, 'invalid native data changed the real Model');
  check(JSON.stringify(fixture.options.stateProjectionTarget.snapshot().data) === projectedState, 'invalid native data changed XTend State');
  check(fixture.root.innerHTML === html, 'invalid native data mutated the DOM');
  check(fixture.contexts.length === count, 'invalid native data created a provider lifetime');
  check(fixture.hosts.every((entry, index) => JSON.stringify(entry.host.snapshot().props) === JSON.stringify(roots[index].props)
    && entry.host.snapshot().disposed === roots[index].disposed), 'invalid native data changed provider delivery or lifetime');
}

function createNativeOnlyFixture(options) {
  const { document, createFabric, kernelModule, surfaces, state } = options;
  const root = document.createElement('main'); document.body.append(root);
  const previous = state.snapshot().data, actualFabric = createFabric(), admissions = [], controllers = [];
  const fabric = { ...actualFabric, runFiber(input, callback) {
    if (input?.metadata?.schedulerJobId) admissions.push(input);
    return actualFabric.runFiber(input, callback);
  }, createBoundary(...args) {
    const boundary = actualFabric.createBoundary(...args);
    return { ...boundary, run(phase, task, metadata) { if (metadata?.kernelJobId) admissions.push(metadata); return boundary.run(phase, task, metadata); } };
  } };
  let graph;
  const app = options.source.nativeEntry.createXtendMaraca({ windowTarget: document.defaultView, documentTarget: document, platformTarget: {},
    runtimeApis: { XTendRmtSurfaceResourceGraphRuntime: { ...surfaces, createRmtSurfaceResourceGraphRuntime(input) { graph = surfaces.createRmtSurfaceResourceGraphRuntime(input); return graph; } } },
    kernelControllerModule: { ...kernelModule, createRmtKernelOrchestrationController(input) { const controller = kernelModule.createRmtKernelOrchestrationController(input); controllers.push(controller); return controller; } } });
  return { app, root, admissions, controllers, get graph() { return graph; },
    async boot() { await app.boot({ root, fabric, stateProjectionTarget: state }); await app.facade.whenXTensionsIdle(); },
    async idle() { await app.facade.whenXTensionsIdle(); },
    async close() { app.dispose(); await app.facade.whenXTensionsIdle(); root.remove(); state.clear(); state.batchUpdate(previous); }
  };
}

async function verifyNativeAutoBoot(options) {
  const win = options.document.defaultView, root = options.document.createElement('main'); options.document.body.append(root);
  const keys = ['__XTendMaracaDisableAutoBoot', '__XTendMaracaAutoBootOptions', '__XTendMaracaAutoBootError', 'XTendMaraca'];
  const saved = keys.map(key => Object.getOwnPropertyDescriptor(win, key)), previous = options.state.snapshot().data;
  let auto;
  try {
    win.__XTendMaracaDisableAutoBoot = false;
    win.__XTendMaracaAutoBootOptions = { root, stateProjectionTarget: options.state };
    delete win.__XTendMaracaAutoBootError;
    auto = await options.source.loadNativeAutoBoot();
    await waitFor(() => root.querySelector('h1') || win.__XTendMaracaAutoBootError);
    check(!win.__XTendMaracaAutoBootError, 'generated Native autoboot must obtain its own actual Fabric port: ' + JSON.stringify(win.__XTendMaracaAutoBootError));
    await auto.default.whenXTensionsIdle();
    const heading = root.querySelector('h1'); check(heading.textContent === 'Native only', 'generated default Native application boots without an injected Fabric');
    const next = clone(auto.default.model.getState('view')); next.title = 'Native autoboot committed';
    await auto.default.dispatchCommand('view.replace', { view: next }); await auto.default.whenXTensionsIdle();
    check(root.querySelector('h1') === heading && heading.textContent === 'Native autoboot committed', 'default Native Fabric continues through actual commits');
  } finally {
    auto?.disposeXtendMaraca(); await auto?.default.whenXTensionsIdle(); root.remove();
    options.state.clear(); options.state.batchUpdate(previous);
    keys.forEach((key, index) => { if (saved[index]) Object.defineProperty(win, key, saved[index]); else delete win[key]; });
  }
}

export async function runNativeRuntimeAcceptance(options) {
  const inherited = await runKeyedRuntimeAcceptance(options);
  const names = inherited.names.map(name => name.replace('v3 source scopes', 'Source5 provider scopes'));
  const fixture = () => createScopedFixture(options);
  async function test(name, execute) { try { await execute(); names.push(name); } catch (error) { throw Error(name + ': ' + error.message, { cause: error }); } }

  await test('productive Source5 native header, literal text and static portal targets coexist with six real React/Vue roots', async () => {
    const f = fixture(); try {
      await f.boot();
      check(owner(f).localName === 'section', 'native owner keeps its declared element');
      check(owner(f).getAttribute('part').includes('region'), 'implicit kind has a safe region part');
      check(f.root.querySelector('h1').textContent === 'Product details', 'native Model text');
      check(f.root.querySelector('[data-native-literal]').textContent === '$model.literal-stays-data', 'literal-looking text remains data');
      check(f.root.querySelector('#gallery-target').querySelectorAll('select').length === 3, 'React roots use the real static native portal target');
      check(f.root.querySelector('#reviews-target').querySelectorAll('select').length === 3, 'Vue roots use their distinct native target');
      const numeric = row(f, 'numeric'), textual = row(f, 'text');
      check(numeric && textual && numeric !== textual, 'two native rows exist');
      check(numeric.getAttribute('data-rmt-key') !== textual.getAttribute('data-rmt-key'), 'native numeric and text keys remain distinct');
      check(f.hosts.every(entry => entry.host.snapshot().resourceGraph.surfaceId === 'product-details'), 'framework owners stay in the Surface/Kernel resource graph');
    } finally { await f.close(); }
  });

  await test('a provider intent and the native output observe the same accepted Model/View commit', async () => {
    const f = fixture(); try {
      await f.boot(); const target = host(f, 'product-reviews', 'g', '1'), output = f.root.querySelector('[data-native-intent]');
      selected(target).value = 'rating'; selected(target).dispatchEvent(new options.document.defaultView.Event('change', { bubbles: true }));
      await f.idle();
      check(f.app.facade.model.getState('intentCapture').productId === '1', 'trusted typed address reaches Action');
      check(output.textContent === 'rating' && f.root.querySelector('[data-native-intent]') === output, 'native node updates within the provider commit');
      check(options.state.getPath('intentCapture.value') === 'rating', 'XTend State sees the same accepted data');
    } finally { await f.close(); }
  });

  await test('cross-State selector changes update native text and provider props without replacing their DOM roots', async () => {
    const f = fixture(); try {
      await f.boot(); const counter = f.root.querySelector('[data-native-count]'), selects = new Map(f.contexts.map(context => [address(context), selected(context)]));
      check(counter.textContent === '2', 'actual selector result initially has two values');
      await f.app.facade.dispatchCommand('images.replace', { images: ['front'] }); await f.idle();
      check(counter.textContent === '1' && f.root.querySelector('[data-native-count]') === counter, 'selector update retains native counter node');
      for (const entry of f.hosts.filter(entry => entry.host.snapshot().props.context)) check(JSON.stringify(entry.host.snapshot().props.images) === '["front"]', 'actual React receives the updated selector array');
      for (const context of f.contexts) check(selected(context) === selects.get(address(context)), 'framework root retained on cross-State projection');
    } finally { await f.close(); }
  });

  await test('native boolean branches and nested typed loops retain unaffected native nodes on reorder and empty arrays', async () => {
    const f = fixture(); try {
      await f.boot(); const heading = f.root.querySelector('h1'), numeric = row(f, 'numeric'), textual = row(f, 'text'), input = numeric.querySelector('input'), textNode = numeric.querySelector('[data-native-value]').firstChild;
      const next = clone(f.app.facade.model.getState('catalog')); next.items.reverse(); next.items.forEach(group => group.products.reverse());
      next.items[1].products.find(product => product.id === 1).slug = 'numeric-updated'; await replaceCatalog(f, next);
      check(row(f, 'numeric-updated') === numeric && row(f, 'text') === textual, 'typed native keys survive parent/item reorder');
      check(numeric.querySelector('input') === input && input.value === 'numeric-updated', 'native controlled input retains identity');
      check(numeric.querySelector('[data-native-value]').firstChild === textNode, 'native text node retains identity');
      await f.app.facade.dispatchCommand('native.show', { show: false }); await f.idle();
      check(!f.root.querySelector('[data-native-count]') && f.root.querySelector('h1') === heading, 'only guarded branch is absent');
      await f.app.facade.dispatchCommand('native.show', { show: true }); await f.idle();
      check(f.root.querySelector('[data-native-count]').textContent === '2', 'new native guarded branch reads current selector');
      await replaceCatalog(f, { items: [] });
      check(f.root.querySelectorAll('[data-native-slug]').length === 0 && f.root.querySelectorAll('select').length === 0, 'empty Model removes native and framework instances');
      check(f.root.querySelector('h1') === heading, 'empty repeat retains native shell');
    } finally { await f.close(); }
  });

  await test('invalid native booleans, nonscalar text, unsafe URLs and duplicate keys fail before Model/DOM/provider mutation', async () => {
    const f = fixture(); try {
      await f.boot();
      const initialView = clone(f.app.facade.model.getState('nativeView'));
      await rejectsWithoutMutation(f, 'native.replace', { view: { ...initialView, show: 'truthy' } });
      await rejectsWithoutMutation(f, 'native.replace', { view: { ...initialView, title: { unsafe: 'object text' } } });
      await rejectsWithoutMutation(f, 'native.replace', { view: { ...initialView, href: 'javascript:alert(1)' } });
      const duplicate = clone(f.app.facade.model.getState('catalog')); duplicate.items[0].products[1].id = 1;
      await rejectsWithoutMutation(f, 'catalog.replace', { catalog: duplicate });
      const missing = clone(f.app.facade.model.getState('catalog')); delete missing.items[0].products[0].id;
      await rejectsWithoutMutation(f, 'catalog.replace', { catalog: missing });
      const negativeKey = clone(f.app.facade.model.getState('catalog')); negativeKey.items[0].products[0].id = -0;
      await rejectsWithoutMutation(f, 'catalog.replace', { catalog: negativeKey });
      const negativeNumber = clone(f.app.facade.model.getState('catalog')); negativeNumber.items[0].products[0].reviewsSort = -0;
      await rejectsWithoutMutation(f, 'catalog.replace', { catalog: negativeNumber });
      let reads = 0;
      const accessor = { ...initialView }; Object.defineProperty(accessor, 'title', { enumerable: true, get() { reads++; return 'unsafe'; } });
      await rejectsWithoutMutation(f, 'native.replace', { view: accessor });
      check(reads === 0, 'native raw ingress does not read getters before validation');
      await f.app.facade.dispatchCommand('native.title', { title: 'Still usable' }); await f.idle();
      check(f.root.querySelector('h1').textContent === 'Still usable', 'rejected native commands do not destroy the application session');
    } finally { await f.close(); }
  });

  await test('shared owner close/resume stages framework props and keeps native presentation hidden while Model text advances', async () => {
    const f = fixture(); try {
      await f.boot(); const section = owner(f), heading = section.querySelector('h1'), context = host(f, 'product-gallery', 'h', 1), select = selected(context);
      f.graph.closeSurface('product-details'); await f.idle();
      await f.app.facade.dispatchCommand('native.title', { title: 'Updated while closed' });
      const next = clone(f.app.facade.model.getState('catalog')); next.items[1].products[0].selectedImageId = 'back'; await replaceCatalog(f, next);
      check(section.hidden && heading.textContent === 'Updated while closed', 'native Model projection preserves the Controller visibility overlay');
      check(select.value === 'front', 'closed foreign root holds delivery');
      await f.graph.openSurface('product-details'); await f.idle();
      check(owner(f) === section && section.querySelector('h1') === heading && !section.hidden, 'native owner and heading retained on resume');
      check(selected(context) === select && select.value === 'back', 'framework root resumes the latest props');
    } finally { await f.close(); }
  });

  await test('native owner Destroy and explicit Recreate never revive old Surface tokens, provider callbacks or detached native event routes', async () => {
    const f = fixture(); try {
      await f.boot(); await f.app.facade.dispatchCommand('native.enable', {}); await f.idle();
      const priorOwner = owner(f), priorHeading = priorOwner.querySelector('h1'), boundary = f.app.facade.getSurfaceBoundary('product-details'), token = boundary.capture();
      const oldContext = host(f, 'product-gallery', 'g', 1);
      f.graph.destroySurface('product-details'); await f.idle();
      check(boundary.disposed && !boundary.isCurrent(token) && !owner(f), 'destroy revokes native authority synchronously');
      check(f.root.querySelectorAll('select').length === 0, 'destroy releases all framework roots');
      await f.graph.openSurface('product-details', { recreate: true });
      await f.app.facade.dispatchCommand('native.title', { title: 'Recreated' }); await f.idle();
      const current = f.app.facade.getSurfaceBoundary('product-details');
      check(current !== boundary && current.active && !boundary.isCurrent(token), 'only the new generation gets authority');
      check(owner(f) !== priorOwner && owner(f).querySelector('h1') !== priorHeading && owner(f).querySelector('h1').textContent === 'Recreated', 'native recreation uses fresh nodes');
      check(f.root.querySelectorAll('select').length === 6, 'new generation owns six fresh framework roots');
      const before = capture(f); emit(oldContext, 'selectImage', { imageId: 'back' });
      priorOwner.dispatchEvent(new options.document.defaultView.CustomEvent('native-select', { bubbles: true, detail: { group: 'g', product: 1, image: 'back' } }));
      await f.idle(); check(capture(f) === before, 'old provider and detached native routes stay revoked');
      owner(f).dispatchEvent(new options.document.defaultView.CustomEvent('native-select', { bubbles: true, cancelable: true, detail: { group: 'g', product: 1, image: 'back' } }));
      await waitFor(() => f.app.facade.model.getState('intentCapture').value === 'back'); await f.idle();
      check(f.root.querySelector('[data-native-intent]').textContent === 'back', 'new native route remains interactive');
    } finally { await f.close(); }
  });

  await test('native Event guards and typed Action defaults still precede payload reads and DOM governance', async () => {
    const f = fixture(); try {
      await f.boot(); const target = owner(f); let reads = 0;
      target.dispatchEvent(new options.document.defaultView.CustomEvent('native-select', { bubbles: true, cancelable: true,
        detail: Object.defineProperty({}, 'image', { enumerable: true, get() { reads++; return 'forbidden'; } }) }));
      await waitFor(() => f.app.facade.snapshot().events.length === 1); check(reads === 0, 'false guard never reads event payload');
      await f.app.facade.dispatchCommand('native.enable', {}); check(f.app.facade.model.getState('nativeFlags').allow === true, 'Action default reaches existing template reducer');
      const before = capture(f), bad = new options.document.defaultView.CustomEvent('native-select', { bubbles: true, cancelable: true, detail: { group: 'g', product: 1, image: 123 } });
      target.dispatchEvent(bad); await waitFor(() => f.app.facade.snapshot().events.length === 2);
      check(!bad.defaultPrevented && capture(f) === before, 'invalid typed event is rejected before governance/Model');
      const good = new options.document.defaultView.CustomEvent('native-select', { bubbles: true, cancelable: true, detail: { group: 'g', product: 1, image: 'back' } });
      target.dispatchEvent(good); await waitFor(() => f.app.facade.model.getState('intentCapture').value === 'back'); await f.idle();
      check(good.defaultPrevented && f.root.querySelector('[data-native-intent]').textContent === 'back', 'accepted event reaches native and State projections');
      const galleries = f.hosts.filter(entry => entry.host.snapshot().props.context);
      check(galleries.length === 3 && galleries.every(entry => entry.host.snapshot().props.label === 'Gallery' && !Object.hasOwn(entry.host.snapshot().props, 'description')), 'provider-owned defaults and omitted props remain unchanged');
    } finally { await f.close(); }
  });

  await test('Native URL API3 and XRouter Host3 retain wire2 tokens, typed restore and native/framework DOM identity', async () => {
    const codec = options.urlStateRuntime; check(codec?.API_VERSION === '3.0.0', 'explicit Native URL API3 required');
    const f = fixture(); f.options.urlStateRuntime = codec;
    f.options.urlStatePolicy = { schema: 'xtend.xtensions.url-state-policy.v2', id: 'inline-products-public', version: 1, documentId: 'inline.products', exposure: 'public-url',
      fields: [{ id: 'reviewsSort', surface: 'product-reviews-host', prop: 'sort', default: 'recent' }], limits: { tokenBytes: 4096, entries: 16, valueBytes: 128, instances: 16 } };
    const win = options.document.defaultView, previousURL = win.location.href; let route;
    try {
      await f.boot(); const numeric = selected(host(f, 'product-reviews', 'g', 1)), textual = selected(host(f, 'product-reviews', 'g', '1'));
      const nativeSort = row(f, 'numeric').querySelector('[data-native-sort]'), nativeText = nativeSort.firstChild;
      const url = new URL(win.location.href); url.search = 'view=products'; url.hash = 'native5'; win.history.replaceState({ native5: 'route-owner' }, '', url);
      route = options.createURLStateHost({ runtime: f.app.facade, codec, windowTarget: win, mode: 'history', listen: true });
      check(route.schema === 'xtend.router.url-state-host.v3' && route.apiVersion === '3.0.0', 'actual Native XRouter host3');
      await route.navigate('initialize'); const next = clone(f.app.facade.model.getState('catalog')); next.items[0].products[0].reviewsSort = 'rating'; await replaceCatalog(f, next);
      const published = await route.publish('checkpoint'), checkpoint = win.location.href, token = codec.readQuery(win.location.search.slice(1));
      check(published.mode === 'push' && token?.startsWith('2.') && win.history.state.native5 === 'route-owner' && win.location.search.includes('view=products') && win.location.hash === '#native5', 'URL3API uses unchanged wire2 and preserves route/History ownership');
      await route.reset(); await f.idle(); check(numeric.value === 'recent' && textual.value === 'recent' && nativeSort.textContent === 'recent', 'public defaults reach Native and Vue');
      const before = domain(f), invalid = new URL(win.location.href); invalid.search = 'view=products&xtend-state=1.' + token.slice(2); win.history.replaceState(win.history.state, '', invalid);
      let rejected = false; try { await route.navigate('traverse', true); } catch (_) { rejected = true; }
      check(rejected && domain(f) === before, 'wire1 cannot cross Native restore');
      win.history.replaceState(win.history.state, '', checkpoint); win.dispatchEvent(new win.PopStateEvent('popstate', { state: win.history.state }));
      await route.whenIdle(); await f.idle();
      check(numeric.value === 'rating' && textual.value === 'recent' && selected(host(f, 'product-reviews', 'g', 1)) === numeric, 'typed Vue restore retains roots');
      check(row(f, 'numeric').querySelector('[data-native-sort]') === nativeSort && nativeSort.firstChild === nativeText && nativeSort.textContent === 'rating', 'the same restore updates retained native text');
    } finally { route?.dispose(); await f.close(); win.history.replaceState({}, '', previousURL); }
  });

  await test('native-only builds boot and commit through real Kernel/Fabric jobs without any provider platform', async () => {
    const f = createNativeOnlyFixture(options); try {
      await f.boot(); check(f.admissions.length > 0, 'native-only boot entered a real Kernel/Fabric job');
      check(f.app.facade.getXTensionBindings().length === 0 && f.root.querySelectorAll('select').length === 0, 'no provider resources exist');
      const heading = f.root.querySelector('h1'), nodes = [...f.root.querySelectorAll('input')], bootAdmissions = f.admissions.length;
      check(heading.textContent === 'Native only' && f.root.querySelector('strong').textContent === '$model.literal-stays-data', 'productive native-only source rendered');
      const next = clone(f.app.facade.model.getState('view')); next.title = 'Native committed'; next.items.reverse();
      await f.app.facade.dispatchCommand('view.replace', { view: next }); await f.idle();
      check(f.admissions.length > bootAdmissions, 'native-only command/commit used Kernel/Fabric admission');
      check(f.root.querySelector('h1') === heading && heading.textContent === 'Native committed', 'native-only Model commit retains heading');
      check([...f.root.querySelectorAll('input')].every((node, index) => node === nodes[1 - index]), 'native-only keys preserve numeric/text input identities');
    } finally { await f.close(); }
    await verifyNativeAutoBoot(options);
  });

  await test('native-only invalid guards and keys do not mutate the Model or native DOM', async () => {
    const f = createNativeOnlyFixture(options); try {
      await f.boot(); const before = domain(f), html = f.root.innerHTML, projectedState = JSON.stringify(options.state.snapshot().data);
      let reads = 0;
      for (const update of [value => { value.show = 1; }, value => { value.items[1].id = 1; }, value => { value.title = { object: true }; }, value => { value.items[0].id = -0; }, value => { value.title = -0; }, value => { Object.defineProperty(value, 'title', { enumerable: true, get() { reads++; return 'unsafe'; } }); }]) {
        const next = clone(f.app.facade.model.getState('view')); update(next); let rejected = false;
        try { const result = await f.app.facade.dispatchCommand('view.replace', { view: next }); rejected = ['error', 'failed', 'rejected'].includes(result?.status); } catch (_) { rejected = true; }
        await f.idle(); check(rejected && domain(f) === before && f.root.innerHTML === html, 'native-only rejection is atomic before the real writer');
        check(JSON.stringify(options.state.snapshot().data) === projectedState, 'native-only preflight cannot change XTend State');
      }
      check(reads === 0, 'native-only raw ingress does not read getters before validation');
    } finally { await f.close(); }
  });

  return { ...inherited, cases: names.length, names, nativeRepeatSupported: true, productiveNativeViewVerified: true,
    nativeDOMIdentityVerified: true, nativePreflightVerified: true, nativeOnlyKernelFabricVerified: true,
    inlineBindingsVerified: true, selectorProjectionVerified: true, providerDefaultsVerified: true, nativeInputValidationVerified: true,
    nativeURLStateVerified: true, xrouterNativeURLStateVerified: true, urlWireVersion: 2, componentContract: 'xtend.maraca.xtension-composition-artifact.v10',
    lifecycleWhenSupported: false, semanticProjectToolingImplemented: false, ssrAcceptancePerformed: false, acceptedForRelease: false };
}

export { runNativeRuntimeAcceptance as runKeyedRuntimeAcceptance };

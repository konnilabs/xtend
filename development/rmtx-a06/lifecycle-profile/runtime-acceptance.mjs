import { createScopedFixture } from '../scoped-fixture.mjs';
const check = (value, message) => { if (!value) throw Error(message); };
const owner = fixture => fixture.root.querySelector('[data-rmt-surface="product-details"]');
const waitFor = async predicate => {
  for (let attempt = 0; attempt < 200; attempt++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 5)); }
  throw Error('Lifecycle acceptance did not reach its real provider boundary.');
};
const retiredIntent = context => context.onEvent({ ok: true, direction: 'upstream', event: 'selectImage', payloadSchema: context.events.selectImage,
  payload: { imageId: 'back' }, source: { hostId: context.hostId, surfaceId: context.surfaceId, xtensionId: context.xtensionId } });
export async function runLifecycleRuntimeAcceptance(options) {
  const names = [], fixture = createScopedFixture(options);
  try {
    const root = options.document.createElement('main'); options.document.body.append(root);
    const previous = options.state.snapshot().data;
    const native = options.source.nativeEntry.createXtendMaraca({ windowTarget: options.document.defaultView, documentTarget: options.document, platformTarget: {} });
    try {
      await native.boot({ root, fabric: options.createFabric(), stateProjectionTarget: options.state });
      check(root.querySelector('h1') === null, 'native-only initialfalse must have no content');
      const value = structuredClone(native.facade.model.getState('view'));
      await native.facade.dispatchCommand('view.replace', { view: { ...value, show: true } });
      check(root.querySelector('h1')?.textContent === 'Native only', 'independent native-only Source6 must enter through real Fabric');
      const scope = native.facade.getSurfaceBoundary('native-only-owner'), token = scope.capture();
      await native.facade.dispatchCommand('view.replace', { view: { ...value, show: false } });
      check(root.querySelector('h1') === null && !scope.isCurrent(token), 'native-only false must retire content authority');
      names.push('independent native-only FullBuild enters and retires actual Kernel/Fabric content');
    } finally { native.dispose(); await native.facade.whenXTensionsIdle(); root.remove(); options.state.clear(); options.state.batchUpdate(previous); }
    await fixture.boot();
    check(fixture.app.schema === 'xtend.maraca.browser-composition-root.v12', 'actual generated entry must expose Browser12');
    check(fixture.app.facade.snapshot().schema === 'xtend.maraca.plan-runtime.v15', 'actual generated entry must use Runtime15');
    check(owner(fixture) === null && fixture.contexts.length === 0 && fixture.requests.length === 0, 'initialfalse must admit neither native DOM nor providers');
    const controllerGeneration = fixture.app.facade.snapshot().surfaceController.surfaces.find(surface => surface.id === 'product-details').generation;
    check(Number.isSafeInteger(controllerGeneration), 'initialfalse must retain a real authoritative Controller generation');
    names.push('actual Source6 initialfalse admits no Native DOM or React/Vue provider load');
    await fixture.app.facade.dispatchCommand('native.show', { show: true }); await fixture.idle();
    await waitFor(() => fixture.contexts.length === 6 && fixture.hosts.every(entry => entry.host.snapshot().mounted));
    check(owner(fixture)?.querySelector('h1')?.textContent === 'Product details', 'false→true must render the actual Native View');
    check(fixture.root.querySelectorAll('select').length === 6, 'three typed React and three Vue instances must mount');
    check(fixture.requests.every(request => request.admitted), 'every provider import must follow real Kernel/Fabric admission');
    const identities = fixture.contexts.map(context => JSON.stringify(context.identity.address));
    check(new Set(identities).size === 6, 'typed addresses remain independent');
    names.push('false→true mounts six typed framework instances through actual Kernel/Fabric');
    const modelBefore = JSON.stringify(fixture.app.facade.model.snapshot().states), htmlBefore = fixture.root.innerHTML, countBefore = fixture.contexts.length;
    let rejected = false;
    try { const result = await fixture.app.facade.dispatchCommand('native.replace', { view: { title: 'invalid', show: 'true', href: 'https://example.test/products' } }); rejected = ['error', 'failed', 'rejected'].includes(result?.status); }
    catch (_) { rejected = true; }
    await fixture.idle();
    check(rejected && JSON.stringify(fixture.app.facade.model.snapshot().states) === modelBefore && fixture.root.innerHTML === htmlBefore && fixture.contexts.length === countBefore,
      'nonboolean guard must reject atomically before Model, DOM or providers change');
    names.push('prospective nonboolean guards reject before Model, DOM or provider effects');
    let reads = 0; const accessor = { title: 'invalid', href: 'https://example.test/products' };
    Object.defineProperty(accessor, 'show', { enumerable: true, get() { reads++; return true; } });
    rejected = false;
    try { const result = await fixture.app.facade.dispatchCommand('native.replace', { view: accessor }); rejected = ['error', 'failed', 'rejected'].includes(result?.status); }
    catch (_) { rejected = true; }
    await fixture.idle();
    check(rejected && reads === 0 && JSON.stringify(fixture.app.facade.model.snapshot().states) === modelBefore && fixture.root.innerHTML === htmlBefore,
      'guard accessors must reject without execution or writes');
    names.push('guard accessors reject without invocation across the productive Action boundary');
    const token = fixture.app.facade.getSurfaceBoundary('product-details').capture(), previousContexts = [...fixture.contexts], previousHosts = [...fixture.hosts];
    await fixture.app.facade.dispatchCommand('native.show', { show: false }); await fixture.idle();
    check(owner(fixture) === null && previousHosts.every(entry => entry.host.snapshot().disposed), 'false must retire Native content and every provider lifetime');
    check(!fixture.app.facade.getSurfaceBoundary('product-details').isCurrent(token), 'false must invalidate previous content tokens');
    const before = JSON.stringify(fixture.app.facade.model.getState('intentCapture'));
    await retiredIntent(previousContexts.find(context => context.identity.address.declarationId === 'product-gallery')); await fixture.idle();
    check(JSON.stringify(fixture.app.facade.model.getState('intentCapture')) === before, 'retired provider intent must not write Model state');
    names.push('true→false retires providers and stale content intents before writes');
    await fixture.app.facade.dispatchCommand('native.show', { show: true }); await fixture.idle();
    await waitFor(() => fixture.contexts.length === 12 && fixture.root.querySelectorAll('select').length === 6);
    check(!fixture.app.facade.getSurfaceBoundary('product-details').isCurrent(token), 're-admission must not revive old tokens');
    check(fixture.contexts.slice(6).every(context => identities.includes(JSON.stringify(context.identity.address))), 're-admission preserves full typed declaration addresses');
    check(fixture.app.facade.snapshot().surfaceController.surfaces.find(surface => surface.id === 'product-details').generation === controllerGeneration,
      'content re-admission must preserve the authoritative Controller generation');
    names.push('false→true recreates content with stable typed addresses and fresh lifetime tokens');
    fixture.graph.closeSurface('product-details'); await fixture.idle();
    await fixture.app.facade.dispatchCommand('native.show', { show: false }); await fixture.idle();
    const contexts = fixture.contexts.length;
    await fixture.app.facade.dispatchCommand('native.show', { show: true }); await fixture.idle();
    check(owner(fixture) === null && fixture.contexts.length === contexts, 'true guard must not reopen a closed owning Controller');
    names.push('guard changes cannot reopen a closed Controller owner');
    check(fixture.controllers.length > 0 && fixture.requests.length > 0 && fixture.requests.every(request => request.admitted), 'real Core/Kernel/Fabric jobs must exist');
    return { passed: true, cases: names.length, names, realReactVueProviders: true, initialFalseVerified: true,
      stableTypedAddressesVerified: true, staleProviderIntentVerified: true, controllerAuthorityVerified: true, kernelFabricVerified: true };
  } finally { await fixture.close(); }
}

import { runKeyedRuntimeAcceptance as runExistingAcceptance } from '../keyed-profile/runtime-acceptance.mjs';
import { createScopedFixture } from '../scoped-fixture.mjs';
// Reuse the same behavioral acceptance against a newly built inline source4 app.
export async function runKeyedRuntimeAcceptanceSource4(options) {
  const result = await runExistingAcceptance(options);
  const fixture = createScopedFixture(options);
  try {
    await fixture.boot();
    const waitFor = async check => {
      for (let attempt = 0; attempt < 200; attempt++) { if (check()) return; await new Promise(resolve => setTimeout(resolve, 5)); }
      throw Error('Native Event/Action did not reach its expected boundary.');
    };
    const nativeOwner = fixture.root.querySelector('[data-rmt-surface="product-details"]');
    let reads = 0;
    nativeOwner.dispatchEvent(new options.document.defaultView.CustomEvent('native-select', { bubbles: true, cancelable: true,
      detail: Object.defineProperty({}, 'image', { enumerable: true, get() { reads++; return 'forbidden'; } }) }));
    await waitFor(() => fixture.app.facade.snapshot().events.length === 1);
    if (reads !== 0) throw Error('False native guard read the provider/event payload.');
    await fixture.app.facade.dispatchCommand('native.enable', {});
    if (fixture.app.facade.model.getState('nativeFlags').allow !== true) throw Error('Default input was lost before a closed reducer template.');
    const before = JSON.stringify(fixture.app.facade.model.getState('intentCapture'));
    const invalid = new options.document.defaultView.CustomEvent('native-select', { bubbles: true, cancelable: true, detail: { group: 'g', product: 1, image: 123 } });
    nativeOwner.dispatchEvent(invalid); await waitFor(() => fixture.app.facade.snapshot().events.length === 2);
    if (invalid.defaultPrevented || JSON.stringify(fixture.app.facade.model.getState('intentCapture')) !== before) throw Error('Invalid native input crossed DOM governance/Model boundary.');
    const valid = new options.document.defaultView.CustomEvent('native-select', { bubbles: true, cancelable: true, detail: { group: 'g', product: 1, image: 'back' } });
    nativeOwner.dispatchEvent(valid); await waitFor(() => fixture.app.facade.model.getState('intentCapture').value === 'back');
    if (!valid.defaultPrevented) throw Error('Valid native input did not reach declared governance.');
    const galleries = fixture.hosts.filter(entry => entry.host.snapshot().props.context);
    if (galleries.length !== 3) throw Error('Three actual React roots must receive closed object/array props.');
    for (const entry of galleries) {
      const props = entry.host.snapshot().props;
      if (props.label !== 'Gallery' || Object.hasOwn(props, 'description')) throw Error('Provider-owned omitted/default props differ.');
      if (JSON.stringify(props.images) !== '["front","back"]' || props.context.flags[0] !== true || props.context.flags[1] !== true)
        throw Error('Existing selector snapshot or closed array projection did not reach the framework.');
    }
    const next = structuredClone(fixture.app.facade.model.getState('catalog'));
    next.items[0].products[0].slug = 'updated-projection';
    await fixture.app.facade.dispatchCommand('catalog.replace', { catalog: next }); await fixture.idle();
    if (!fixture.hosts.some(entry => entry.host.snapshot().props.context?.displayId === 'updated-projection')) throw Error('Projected props were not updated from the live Model.');
  } finally { await fixture.close(); }
  const codec = options.urlStateRuntime;
  if (codec?.API_VERSION !== '2.0.0') throw Error('The Source4 URL acceptance requires its explicit v2 codec port.');
  const linked = createScopedFixture(options);
  linked.options.urlStateRuntime = codec;
  linked.options.urlStatePolicy = { schema: 'xtend.xtensions.url-state-policy.v2', id: 'inline-products-public', version: 1,
    documentId: 'inline.products', exposure: 'public-url',
    fields: [{ id: 'reviewsSort', surface: 'product-reviews-host', prop: 'sort', default: 'recent' }],
    limits: { tokenBytes: 4096, entries: 16, valueBytes: 128, instances: 16 } };
  const previousURL = options.document.defaultView.location.href;
  let owner;
  try {
    await linked.boot();
    const address = context => context.identity.address;
    const review = keys => linked.contexts.find(context => address(context).declarationId === 'product-reviews'
      && JSON.stringify(address(context).keys) === JSON.stringify(keys)).container.querySelector('select');
    const numeric = review(['g', 1]), textual = review(['g', '1']);
    const win = options.document.defaultView, initialURL = new URL(win.location.href);
    initialURL.search = 'view=products'; initialURL.hash = 'source4';
    win.history.replaceState({ source4: 'history-owner' }, '', initialURL);
    owner = options.createURLStateHost({ runtime: linked.app.facade, codec, windowTarget: win, mode: 'history', listen: true });
    if (owner.schema !== 'xtend.router.url-state-host.v2' || owner.apiVersion !== '2.0.0') throw Error('The actual XRouter projection owner v2 is required.');
    await owner.navigate('initialize');
    const next = structuredClone(linked.app.facade.model.getState('catalog'));
    next.items[0].products[0].reviewsSort = 'rating';
    await linked.app.facade.dispatchCommand('catalog.replace', { catalog: next }); await linked.idle();
    const published = await owner.publish('checkpoint');
    const checkpointURL = win.location.href, token = codec.readQuery(win.location.search.slice(1));
    if (published.mode !== 'push' || !token?.startsWith('2.') || win.history.state.source4 !== 'history-owner'
      || !win.location.search.includes('view=products') || win.location.hash !== '#source4')
      throw Error('URL2 publication did not preserve route, fragment, unrelated query and History ownership.');
    await owner.reset(); await linked.idle();
    if (numeric.value !== 'recent' || textual.value !== 'recent') throw Error('URL2 public defaults did not reach existing framework roots.');
    const beforeInvalid = JSON.stringify(linked.app.facade.model.getState('catalog'));
    const invalidURL = new URL(win.location.href); invalidURL.search = 'view=products&xtend-state=1.' + token.slice(2);
    win.history.replaceState(win.history.state, '', invalidURL);
    let rejected = false;
    try { await owner.navigate('traverse', true); } catch (_) { rejected = true; }
    if (!rejected || JSON.stringify(linked.app.facade.model.getState('catalog')) !== beforeInvalid) throw Error('Legacy URL token crossed the Source4 restore boundary.');
    win.history.replaceState(win.history.state, '', checkpointURL);
    win.dispatchEvent(new win.PopStateEvent('popstate', { state: win.history.state }));
    await owner.whenIdle(); await linked.idle();
    if (numeric.value !== 'rating' || textual.value !== 'recent' || review(['g', 1]) !== numeric || review(['g', '1']) !== textual)
      throw Error('XRouter URL2 restore lost typed key separation or framework identity.');
  } finally { owner?.dispose(); await linked.close(); options.document.defaultView.history.replaceState({}, '', previousURL); }
  return {...result, cases: result.cases + 3, names: [...result.names.map(name => name.replace('v3 source scopes', 'v4 inline declarations')),
    'provider-owned defaults, omitted optional fields, selector reads and closed object/array projections reach actual framework hosts',
    'native guards and typed payloads precede DOM governance and Model effects; Action defaults reach closed reducer templates',
    'actual XRouter URL2 history and atomic restore preserve typed keys, live framework props and DOM identity'],
    inlineBindingsVerified: true, selectorProjectionVerified: true, providerDefaultsVerified: true,
    nativeInputValidationVerified: true, projectionURLStateVerified: true, xrouterProjectionURLStateVerified: true, componentContract: 'xtend.maraca.xtension-composition-artifact.v9'};
}
export { runKeyedRuntimeAcceptanceSource4 as runKeyedRuntimeAcceptance };

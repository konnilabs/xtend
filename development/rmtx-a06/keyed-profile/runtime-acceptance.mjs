import { createScopedFixture } from '../scoped-fixture.mjs';

export async function runKeyedRuntimeAcceptance(options) {
  const names = [];
  const check = (value, message) => { if (!value) throw Error(message); };
  const fixture = () => createScopedFixture(options);
  const address = context => JSON.stringify([context.identity.address.documentId, context.identity.address.declarationId, context.identity.address.keys]);
  const host = (f, declaration, group, product) => [...f.contexts].reverse().find(context => context.identity.address.declarationId === declaration && JSON.stringify(context.identity.address.keys) === JSON.stringify([group, product]));
  const select = context => context.container.querySelector('select');
  const catalog = f => structuredClone(f.app.facade.model.getState('catalog'));
  const capture = f => JSON.stringify(f.app.facade.model.getState('intentCapture'));
  async function test(name, fn) { try { await fn(); names.push(name); } catch (error) { throw Error(name + ': ' + error.message, { cause: error }); } }
  async function replace(f, value) { await f.app.facade.dispatchCommand('catalog.replace', { catalog: value }); await f.idle(); }
  function emit(context, event, payload) { return context.onEvent({ ok: true, direction: 'upstream', event, payloadSchema: context.events[event], payload, source: { hostId: context.hostId, surfaceId: context.surfaceId, xtensionId: context.xtensionId } }); }
  async function change(f, context, value) { const node = select(context); node.value = value; node.dispatchEvent(new options.document.defaultView.Event('change', { bubbles: true })); await f.idle(); }

  await test('v3 source scopes produce six React/Vue roots with typed parent addresses and Kernel/Fabric admission', async () => {
    const f = fixture(); try {
      await f.boot();
      check(f.root.querySelectorAll('select').length === 6, 'six actual framework roots');
      check(new Set(f.contexts.map(address)).size === 6, 'six typed addresses');
      check(f.hosts.every(entry => entry.host.snapshot().resourceGraph.surfaceId === 'product-details'), 'one native owner');
      check(f.requests.length > 0 && f.requests.every(request => request.admitted), 'real Kernel/Fabric admission');
      check(select(host(f, 'product-gallery', 'g', 1)) !== select(host(f, 'product-gallery', 'g', '1')), 'numeric/text keys remain distinct');
    } finally { await f.close(); }
  });

  await test('React and Vue provider intents reach actual Actions with trusted typed parent and child keys', async () => {
    const f = fixture(); try {
      await f.boot();
      await change(f, host(f, 'product-gallery', 'g', 1), 'back');
      let value = f.app.facade.model.getState('intentCapture');
      check(value.groupId === 'g' && value.productId === 1 && value.value === 'back' && value.kind === 'image', 'React numeric intent');
      await change(f, host(f, 'product-reviews', 'g', '1'), 'rating');
      value = f.app.facade.model.getState('intentCapture');
      check(value.groupId === 'g' && value.productId === '1' && value.value === 'rating' && value.kind === 'reviews', 'Vue string intent');
      await change(f, host(f, 'product-reviews', 'h', 1), 'rating');
      value = f.app.facade.model.getState('intentCapture');
      check(value.groupId === 'h' && value.productId === 1, 'same child key under another parent');
      check(options.state.getPath('intentCapture.groupId') === 'h', 'deep XTend State projection');
    } finally { await f.close(); }
  });

  await test('nested source reorder preserves all concrete addresses and framework DOM nodes', async () => {
    const f = fixture(); try {
      await f.boot(); const nodes = new Map(f.contexts.map(context => [address(context), select(context)]));
      const next = catalog(f); next.items.reverse(); next.items.forEach(group => group.products.reverse()); await replace(f, next);
      check(f.contexts.length === 6, 'no reincarnation on reorder');
      for (const context of f.contexts) check(select(context) === nodes.get(address(context)), 'retained framework node');
    } finally { await f.close(); }
  });

  await test('removing a typed item revokes stale callbacks and retains sibling roots', async () => {
    const f = fixture(); try {
      await f.boot(); const old = host(f, 'product-reviews', 'g', '1'), sibling = select(host(f, 'product-reviews', 'g', 1));
      const next = catalog(f); next.items[0].products = next.items[0].products.filter(product => product.id !== '1'); await replace(f, next);
      check(f.root.querySelectorAll('select').length === 4, 'only removed providers retired');
      const before = capture(f); emit(old, 'changeSort', { sort: 'rating' }); await f.idle();
      check(capture(f) === before, 'removed callback revoked');
      check(select(host(f, 'product-reviews', 'g', 1)) === sibling, 'numeric sibling retained');
    } finally { await f.close(); }
  });

  await test('source boolean presence retires and reincarnates both providers while revoking old callbacks', async () => {
    const f = fixture(); try {
      await f.boot(); const old = host(f, 'product-reviews', 'g', '1'), oldNode = select(old);
      let next = catalog(f); next.items[0].products[1].enabled = false; await replace(f, next);
      check(f.root.querySelectorAll('select').length === 4, 'false presence removes two roots');
      const before = capture(f); emit(old, 'changeSort', { sort: 'rating' }); await f.idle(); check(capture(f) === before, 'hidden callback revoked');
      next = catalog(f); next.items[0].products[1].enabled = true; await replace(f, next);
      const current = host(f, 'product-reviews', 'g', '1'); check(f.root.querySelectorAll('select').length === 6 && select(current) !== oldNode, 'fresh incarnation');
      emit(old, 'changeSort', { sort: 'rating' }); await f.idle(); check(capture(f) === before, 'old callback remains revoked after reappearance');
      await change(f, current, 'rating'); check(f.app.facade.model.getState('intentCapture').productId === '1', 'new incarnation remains interactive');
    } finally { await f.close(); }
  });

  await test('changing a source key creates a fresh lifetime without changing another parent with the same prior key', async () => {
    const f = fixture(); try {
      await f.boot(); const old = host(f, 'product-gallery', 'g', 1), oldNode = select(old), other = select(host(f, 'product-gallery', 'h', 1));
      const next = catalog(f); next.items[0].products[0].id = 2; await replace(f, next);
      check(select(host(f, 'product-gallery', 'g', 2)) !== oldNode, 'key mutation creates a root');
      check(select(host(f, 'product-gallery', 'h', 1)) === other, 'other parent retained');
      const before = capture(f); emit(old, 'selectImage', { imageId: 'back' }); await f.idle(); check(capture(f) === before, 'old keyed callback revoked');
    } finally { await f.close(); }
  });

  await test('shared owner close and resume stage latest scoped Model props while preserving framework roots', async () => {
    const f = fixture(); try {
      await f.boot(); const context = host(f, 'product-gallery', 'h', 1), node = select(context);
      const reviews = host(f, 'product-reviews', 'h', 1), reviewsNode = select(reviews);
      f.graph.closeSurface('product-details'); await f.idle();
      const next = catalog(f); next.items[1].products[0].selectedImageId = 'back'; next.items[1].products[0].reviewsSort = 'rating'; await replace(f, next);
      check(node.value === 'front' && reviewsNode.value === 'recent', 'closed React and Vue delivery held');
      await f.graph.openSurface('product-details'); await f.idle();
      check(node.value === 'back' && select(context) === node, 'latest React props resumed into retained root');
      check(reviewsNode.value === 'rating' && select(reviews) === reviewsNode, 'latest Vue props resumed into retained root');
    } finally { await f.close(); }
  });

  await test('empty outer and nested source collections retire roots and later repopulate safely', async () => {
    const f = fixture(); try {
      await f.boot(); const initial = catalog(f), old = host(f, 'product-gallery', 'g', 1);
      await replace(f, { items: [] }); check(f.root.querySelectorAll('select').length === 0, 'empty outer source');
      const before = capture(f); emit(old, 'selectImage', { imageId: 'back' }); await f.idle(); check(capture(f) === before, 'empty-source callback revoked');
      const nested = structuredClone(initial); nested.items.forEach(group => { group.products = []; }); await replace(f, nested);
      check(f.root.querySelectorAll('select').length === 0, 'empty nested sources');
      await replace(f, initial); check(f.root.querySelectorAll('select').length === 6, 'source repopulation remounts six roots');
    } finally { await f.close(); }
  });

  await test('destroying the common native owner revokes all scoped leases and framework facades', async () => {
    const f = fixture(); try {
      await f.boot(); f.graph.destroySurface('product-details');
      check(f.controllers[0].core.rmt.listResources().length === 0, 'immediate native revocation'); await f.idle();
      check(f.root.querySelectorAll('select').length === 0, 'all provider roots unmounted');
      check(f.hosts.every(entry => entry.host.snapshot().disposed), 'all lifetimes terminal');
    } finally { await f.close(); }
  });

  return { passed: true, cases: names.length, names, typedKeyScopes: true, sourceHostScopesVerified: true,
    booleanPresenceVerified: true, trustedIntentKeysVerified: true, nativeRepeatSupported: false,
    ssrAcceptancePerformed: false, acceptedForRelease: false };
}

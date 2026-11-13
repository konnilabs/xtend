import { createTwoHostCase } from './two-host-runtime.mjs';

export async function runTwoHostAcceptance(options) {
  const results = [];
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const equal = (a, b, message) => check(JSON.stringify(a) === JSON.stringify(b), message);
  const test = async (name, fn) => { await fn(); results.push(name); };
  const fixture = extra => createTwoHostCase({ ...options, ...extra });
  const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
  async function ready(extra) { const f = fixture(extra); try { await f.runtime.boot(); return f; } catch (error) { await f.close(); throw error; } }
  await test('two actual framework roots share one native resource owner and retain separate targets', async () => {
    const f = await ready(); try {
      equal(f.hosts.length, 2, 'two concrete hosts');
      equal(f.root.querySelectorAll('select').length, 2, 'real React and Vue controls');
      check(f.hosts[0].context.container !== f.hosts[1].context.container && !f.hosts[0].context.container.contains(f.hosts[1].context.container), 'disjoint framework containers');
      equal(f.kernel.listResources('a06-product-details').length, 2, 'two real kernel leases');
      check(f.hosts.every(entry => entry.host.snapshot().resourceGraph.surfaceId === options.lowered.ownerSurface), 'common owning Surface');
      for (const entry of f.hosts) {
        check(entry.host.getCapabilities().features['execution.preemption'] === false, 'no private framework preemption claim');
        check(f.fabric.getFibers().some(record => record.phase === 'mount' && record.lane === entry.definition.lane && record.metadata?.kernelJobId), 'real Kernel/Fabric lane admission');
      }
    } finally { await f.close(); }
  });
  await test('framework events run declared Actions and return controlled props through XTend State', async () => {
    const f = await ready(); try {
      const gallery = f.latest('product-gallery'), reviews = f.latest('product-reviews');
      const galleryNode = gallery.context.container.querySelector('select'), reviewsNode = reviews.context.container.querySelector('select');
      galleryNode.value = 'back'; galleryNode.dispatchEvent(new options.document.defaultView.Event('change', { bubbles: true })); await f.idle();
      equal(f.runtime.model.getState('product').selectedImageId, 'back', 'gallery Action updates authoritative Model');
      equal(f.state.getPath('product.selectedImageId'), 'back', 'deep State projection');
      equal(gallery.context.container.querySelector('output').textContent, 'back', 'controlled React echo');
      check(reviews.context.container.querySelector('select') === reviewsNode, 'Vue sibling DOM retained');
      reviewsNode.value = 'rating'; reviewsNode.dispatchEvent(new options.document.defaultView.Event('change', { bubbles: true })); await f.idle();
      equal(f.runtime.model.getState('product').reviewsSort, 'rating', 'Vue Action updates Model');
      equal(reviews.context.container.querySelector('output').textContent, 'rating', 'controlled Vue echo');
      check(gallery.context.container.querySelector('select') === galleryNode, 'React sibling DOM retained');
    } finally { await f.close(); }
  });
  await test('unknown, mistyped, extra-field and forged-source intents do not write Model', async () => {
    const f = await ready(); try {
      const entry = f.latest('product-gallery'), context = entry.context, before = f.runtime.model.getState('product');
      for (const payload of [{ imageId: 42 }, { imageId: 'back', command: 'product.changeSort' }]) {
        entry.host.emit({ type: 'selectImage', payload }); await f.idle();
        equal(f.runtime.model.getState('product'), before, 'invalid payload cannot commit');
      }
      context.onEvent({ ok: true, direction: 'upstream', event: 'selectImage', payloadSchema: context.events.selectImage,
        payload: { imageId: 'back' }, source: { hostId: 'forged', surfaceId: context.surfaceId, xtensionId: context.xtensionId } });
      equal(f.runtime.model.getState('product'), before, 'forged source cannot commit');
      check(entry.host.emit({ type: 'changeSort', payload: { sort: 'rating' } }).ok === false, 'undeclared event blocked');
    } finally { await f.close(); }
  });
  await test('common Surface close stages latest Model props and resume preserves both roots', async () => {
    const f = await ready(); try {
      const nodes = [...f.root.querySelectorAll('select')];
      f.graph.closeSurface(options.lowered.ownerSurface); await f.idle();
      check(f.hosts.every(entry => entry.host.snapshot().suspended), 'both hosts suspended');
      await f.runtime.dispatchCommand('product.selectImage', { imageId: 'back' });
      await f.runtime.dispatchCommand('product.changeSort', { sort: 'rating' }); await f.idle();
      equal(nodes.map(node => node.value), ['front', 'recent'], 'closed owner defers framework projection');
      await f.graph.openSurface(options.lowered.ownerSurface); await f.idle();
      equal(nodes.map(node => node.value), ['back', 'rating'], 'resume delivers newest Model');
      check([...f.root.querySelectorAll('select')].every((node, index) => node === nodes[index]), 'both DOM roots retained');
    } finally { await f.close(); }
  });
  await test('removing one host preserves its sibling and invalidates old intents across reincarnation', async () => {
    const f = await ready(); try {
      const old = f.latest('product-gallery'), sibling = f.latest('product-reviews').context.container.querySelector('select');
      await f.runtime.dispatchCommand('hosts.replace', { hosts: { gallery: false, reviews: true } }); await f.idle();
      check(old.host.snapshot().disposed, 'old host disposed');
      equal(f.kernel.listResources('a06-product-details').length, 1, 'only own lease removed');
      check(f.latest('product-reviews').context.container.querySelector('select') === sibling, 'sibling DOM retained');
      await f.runtime.dispatchCommand('hosts.replace', { hosts: { gallery: true, reviews: true } }); await f.idle();
      const fresh = f.latest('product-gallery');
      equal(fresh.context.identity.address, old.context.identity.address, 'logical address retained');
      check(fresh.context.identity.incarnation !== old.context.identity.incarnation, 'new incarnation');
      const before = f.runtime.model.getState('product');
      check(old.context.onEvent({ ok: true, direction: 'upstream', event: 'selectImage', payloadSchema: old.context.events.selectImage,
        payload: { imageId: 'back' }, source: old.context }) === false, 'retired registry callback fenced');
      equal(f.runtime.model.getState('product'), before, 'retired intent cannot write a replacement');
    } finally { await f.close(); }
  });
  await test('common Surface destroy immediately revokes both scopes and late provider completion', async () => {
    const entered = deferred(), release = deferred(); let count = 0;
    const f = fixture({ waitForProvider: async () => { if (++count === 1) entered.resolve(); await release.promise; } });
    const boot = f.runtime.boot().catch(() => {});
    try {
      await entered.promise;
      f.graph.destroySurface(options.lowered.ownerSurface);
      equal(f.kernel.listResources('a06-product-details').length, 0, 'destroy revokes resources before provider settles');
      release.resolve(); await boot; await f.idle();
      equal(f.root.querySelectorAll('select').length, 0, 'late provider creates no root');
      check(f.hosts.every(entry => entry.host.snapshot().disposed), 'all acquired hosts are terminal');
    } finally { release.resolve(); await boot; await f.close(); }
  });
  await test('common Surface destroy cancels active work on both hosts and fences result callbacks', async () => {
    const f = await ready(), release = deferred(); const started = [deferred(), deferred()]; let writes = 0;
    const jobs = f.hosts.map((entry, index) => entry.facade.work.schedule('inspect', async context => {
      started[index].resolve(); await release.promise; context.guard(() => { writes++; })();
    }));
    const settled = Promise.allSettled(jobs.map(job => job.result));
    try {
      await Promise.all(started.map(value => value.promise));
      const before = f.runtime.model.getState('product');
      f.graph.destroySurface(options.lowered.ownerSurface);
      check(jobs.every(job => job.signal.aborted), 'both work signals immediately aborted');
      equal(f.kernel.listResources('a06-product-details').length, 0, 'both resource leases synchronously revoked');
      release.resolve(); await settled; await f.idle();
      equal(writes, 0, 'old result guards cannot execute');
      equal(f.root.querySelectorAll('select').length, 0, 'both actual framework roots unmounted');
      check(f.hosts.every(entry => entry.host.emit({ type: Object.keys(entry.definition.intents)[0], payload: {} }).ok === false), 'retired hosts reject events');
      equal(f.runtime.model.getState('product'), before, 'destroy writes no Model state');
    } finally { release.resolve(); await settled; await f.close(); }
  });
  await test('source lane requests do not manufacture trusted application grants', async () => {
    const lowered = JSON.parse(JSON.stringify(options.lowered)); lowered.hosts[0].lane = 'idle';
    const f = fixture({ lowered }); let rejected = false;
    try { await f.runtime.boot(); } catch { rejected = true; }
    finally { await f.close(); }
    check(rejected, 'request/grant mismatch is rejected');
  });
  return { passed: true, cases: results.length, names: results };
}

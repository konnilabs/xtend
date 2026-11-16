import { runAutomaticAcceptance } from '../automatic-acceptance.mjs';

// Exercise the selected values in real Provider props, after the existing eight
// Kernel/Fabric/ownership regressions have run unchanged.
export async function runSelectorRuntimeAcceptance(dependencies = {}) {
  const base = await runAutomaticAcceptance(dependencies);
  const { source, document, React, ReactDOM, Vue, createFabric, state } = dependencies;
  const names = base.names.slice();
  const check = (condition, message) => { if (!condition) throw Error(message); };
  async function test(name, callback) {
    try { await callback(); names.push(name); }
    catch (error) { throw new Error(name + ': ' + error.message, { cause: error }); }
  }
  function fixture() {
    const root = document.createElement('main');
    document.body.append(root);
    const previous = state.snapshot().data;
    let graph;
    const app = source.entry.createXtendMaraca({
      xtensionCompanion: source.companion, xtensionPlatform: source.platform,
      windowTarget: document.defaultView, documentTarget: document, platformTarget: {},
      runtimeApis: { XTendRmtSurfaceResourceGraphRuntime: {
        ...dependencies.surfaces,
        createRmtSurfaceResourceGraphRuntime(options) {
          graph = dependencies.surfaces.createRmtSurfaceResourceGraphRuntime(options);
          return graph;
        }
      } },
      kernelControllerModule: dependencies.kernelModule
    });
    const grants = {
      'product-gallery': { lifecycle: { lane: 'visible' }, work: { inspect: { lane: 'background', maxChunkMs: 2 } } },
      'product-reviews': { lifecycle: { lane: 'idle' }, work: { inspect: { lane: 'background', maxChunkMs: 2 } } }
    };
    return {
      app, root, get graph() { return graph; },
      async boot() {
        await app.boot({ root, fabric: createFabric(), stateProjectionTarget: state,
          xtensions: { grants, loadPeerGroup({ group }) { return group.framework === 'react' ? { React, ReactDOM } : { Vue }; } } });
        await app.facade.whenXTensionsIdle();
        return this;
      },
      async command(name, payload = {}) {
        await app.facade.dispatchCommand(name, payload);
        await app.facade.whenXTensionsIdle();
      },
      async idle() { await app.facade.whenXTensionsIdle(); },
      async close() {
        app.dispose();
        await app.facade.whenXTensionsIdle();
        root.remove();state.clear();state.batchUpdate(previous);
      }
    };
  }
  const selects = instance => [...instance.root.querySelectorAll('select')];
  const optionValues = select => [...select.options].map(option => option.value);

  await test('v2 selector output flows through Action and Model into actual React props while Vue retains its root', async () => {
    const f = fixture();
    try {
      await f.boot();
      const [gallery, reviews] = selects(f);
      check(gallery && reviews, 'both actual framework roots mounted');
      await f.command('imageQuery.replace', { value: 'back' });
      await f.command('product.selectImage', { imageId: 'back' });
      await f.command('product.applyImages');
      check(JSON.stringify(state.getPath('product.images')) === JSON.stringify(['back']), 'selector value committed to controlled Model state');
      check(JSON.stringify(optionValues(gallery)) === JSON.stringify(['back']) && gallery.value === 'back', 'React received the filtered selector result');
      check(selects(f)[0] === gallery && selects(f)[1] === reviews, 'React and sibling Vue nodes retained');
    } finally { await f.close(); }
  });

  await test('source replacement and query changes recompute the v2 selector before a later props commit', async () => {
    const f = fixture();
    try {
      await f.boot();
      const [gallery, reviews] = selects(f);
      await f.command('sourceImages.replace', { images: ['front'] });
      await f.command('imageQuery.replace', { value: 'front' });
      await f.command('product.selectImage', { imageId: 'front' });
      await f.command('product.applyImages');
      check(JSON.stringify(state.getPath('sourceImages')) === JSON.stringify(['front']), 'source state replaced');
      check(JSON.stringify(state.getPath('product.images')) === JSON.stringify(['front']), 'latest source/query result committed');
      check(JSON.stringify(optionValues(gallery)) === JSON.stringify(['front']) && gallery.value === 'front', 'React options follow the current selector');
      check(selects(f)[0] === gallery && selects(f)[1] === reviews, 'both roots preserved after source change');
    } finally { await f.close(); }
  });

  await test('closed owner stages changed v2 selector props and resumes with both framework nodes preserved', async () => {
    const f = fixture();
    try {
      await f.boot();
      const [gallery, reviews] = selects(f);
      const before = optionValues(gallery);
      check(f.graph, 'actual native owner graph captured');
      f.graph.closeSurface('product-details');await f.idle();
      await f.command('imageQuery.replace', { value: 'back' });
      await f.command('product.selectImage', { imageId: 'back' });
      await f.command('product.applyImages');
      check(JSON.stringify(state.getPath('product.images')) === JSON.stringify(['back']), 'closed Model received the selector value');
      check(JSON.stringify(optionValues(gallery)) === JSON.stringify(before), 'closed framework props remain staged');
      await f.graph.openSurface('product-details');await f.idle();
      check(selects(f)[0] === gallery && selects(f)[1] === reviews, 'resume preserves React and Vue node identities');
      check(JSON.stringify(optionValues(gallery)) === JSON.stringify(['back']) && gallery.value === 'back', 'resumed props use the latest selector result');
    } finally { await f.close(); }
  });

  return { passed: true, cases: names.length, names, existingAutomaticCases: base.cases, selectorActionModelPropsCases: 3,
    selectorActionModelPropsVerified: true, automaticCompositionSupported: true, ssrAcceptancePerformed: false, acceptedForRelease: false };
}

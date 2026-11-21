import { React, ReactDOM, Vue } from './vendor.mjs';
import fabricApi from '../../../../fabric/xtend-fabric.js';

window.__XTendMaracaDisableAutoBoot = true;
const generated = await import('./__ENTRY__');
const platform = (await import('./runtime/xtension-platform.mjs')).default;
const fixture = await (await fetch('./fixture.json' + location.search)).json();
async function until(predicate, message) {
  const deadline = performance.now() + 10000;
  while (!predicate()) {
    if (performance.now() >= deadline) throw new Error(message);
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}

window.runRmtxSSR = async scenario => {
  const root = document.querySelector('#xtend-maraca-root');
  const originalNodes = [...root.querySelectorAll('*')];
  const selects = [...root.querySelectorAll('select')];
  const headers = [...root.querySelectorAll('x-header')];
  const buttons = [...root.querySelectorAll('x-button')];
  const nativePreActivated = [...headers, ...buttons].some(node => node.shadowRoot !== null);
  const variant = scenario === 'mount-invalid-identity' ? 'signed-owner' : scenario;
  const snapshot = structuredClone(fixture.variants[variant] || fixture.snapshot);
  const app = generated.createXtendRmtxSSR({ windowTarget: window, documentTarget: document,
    platformTarget: {}, xtensionPlatform: { ...platform, adapters: { ...platform.adapters,
      vue: { ...platform.adapters.vue, createVueSSRRuntimeAdapter(options) {
        const host = platform.adapters.vue.createVueSSRRuntimeAdapter(options);
        return { ...host, async adopt(...args) {
          if (scenario === 'hydrate-error') throw new Error('deliberate adoption failure');
          const result = await host.adopt(...args);
          if (scenario === 'held' && !window.heldEmitted) {
            window.heldEmitted = true;
            host.emit({ type: 'changeSort', payload: { order: 'rating' } });
          }
          return result;
        } };
      } }
    } }
  });
  let loads = 0, admissions = 0, queue = [];
  const originalFabric = fabricApi.createXtendFabric();
  const fabric = { ...originalFabric, createBoundary(...args) {
    const boundary = originalFabric.createBoundary(...args);
    return { ...boundary, run(name, task, metadata) {
      if (metadata?.kernelJobId) admissions++;
      return boundary.run(name, task, metadata);
    } };
  } };
  const review = snapshot.payload.hosts.find(host => host.address.declarationId === 'product-reviews' && typeof host.address.keys[0] === 'string');
  const image = snapshot.payload.hosts.find(host => host.address.declarationId === 'product-gallery' && typeof host.address.keys[0] === 'number');
  const intent = { schema: 'xtend.maraca.xtension-ssr-intent.v3', id: 'early-sort',
    generation: snapshot.payload.generation, address: review?.address,
    event: 'changeSort', payload: { order: 'rating' }, payloadOrigin: 'provider' };
  if (['replay', 'duplicate', 'wrong-payload', 'bad-key', 'bad-generation', 'conflict', 'invalid-batch'].includes(scenario)) {
    queue = [structuredClone(intent)];
    if (scenario === 'duplicate') queue.push(structuredClone(intent));
    if (scenario === 'wrong-payload') queue[0].payload = { sort: 'rating' };
    if (scenario === 'bad-key') queue[0].address.keys[0] = 99;
    if (scenario === 'bad-generation') queue[0].generation = 'other';
    if (scenario === 'conflict') queue.push({ ...intent, payload: { order: 'recent' } });
    if (scenario === 'invalid-batch') queue.push({ ...intent, id: 'invalid-later-entry', payload: { order: 42 } });
  }
  if (scenario === 'image-replay') queue = [{ ...intent, id: 'early-image', address: image.address,
    event: 'selectImage', payload: { imageId: 'front' } }];
  if (scenario === 'signature') snapshot.signature = '00';
  if (scenario === 'source') snapshot.payload.sourceHash = '0'.repeat(64);
  if (scenario === 'old-wire') snapshot.schema = 'xtend.maraca.xtension-ssr-snapshot.v2';
  if (scenario === 'shell') root.append(document.createElement('aside'));
  if (scenario === 'dom-reject' || scenario === 'fallback') selects[0].parentNode.append(document.createElement('em'));
  if (scenario === 'native-tamper') root.querySelector('[data-native-title]').textContent = 'untrusted native text';
  const before = root.outerHTML;
  const publicKey = await crypto.subtle.importKey('jwk', fixture.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  let entered = false, release;
  const wait = new Promise(resolve => { release = resolve; });
  const verify = async (text, signature) => {
    if (scenario === 'cancel') { entered = true; await wait; }
    return typeof signature === 'string' && signature.length === 128 && crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' }, publicKey,
      Uint8Array.from(signature.match(/../g) || [], value => parseInt(value, 16)), new TextEncoder().encode(text));
  };
  const pending = app.boot({ root, fabric, xtensions: { grants: fixture.grants,
    ssr: { schema: 'xtend.maraca.xtension-ssr-options.v3', mode: 'client', snapshot, verify,
      fallback: ['fallback', 'hydrate-error', 'mount-invalid-identity'].includes(scenario) ? 'mount' : 'reject', intents: () => queue },
    loadPeerGroup({ group }) {
      loads++;
      if (scenario === 'late-container') selects[0].closest('[data-maraca-surface]').setAttribute('title', 'changed');
      return group.framework === 'react' ? { React, ReactDOM } : { Vue };
    }
  } });
  if (scenario === 'cancel') {
    while (!entered) await new Promise(resolve => setTimeout(resolve, 1));
    app.dispose(); release();
  }
  let error, report, reordered = false, renewed = false, nativeActivated = false;
  try {
    await pending; await app.facade.whenXTensionsIdle();
    report = app.facade.snapshot().xtensionSSR;
    nativeActivated = buttons.every(node => node.shadowRoot?.querySelector('button'));
    if (scenario === 'live') {
      const select = root.querySelector('select[aria-label="Sort"]');
      select.value = 'rating'; select.dispatchEvent(new Event('change', { bubbles: true }));
      await until(() => app.facade.model.getState('capture').kind === 'reviews', 'Live provider intent did not execute the imported Classic Action.');
      await app.facade.whenXTensionsIdle();
    }
    if (scenario === 'native') {
      buttons[0].shadowRoot.querySelector('button').click();
      await until(() => app.facade.model.getState('capture').kind === 'native', 'Native DTO did not execute the imported Classic Action.');
      await app.facade.whenXTensionsIdle();
    }
    if (scenario === 'reorder') {
      const catalog = structuredClone(app.facade.model.getState('catalog'));
      catalog.items.reverse();
      await app.facade.dispatchCommand('catalog.replace', { catalog });
      await app.facade.whenXTensionsIdle();
      reordered = selects.every(node => root.contains(node)) && headers.every(node => root.contains(node));
    }
    if (scenario === 'renew') {
      const catalog = structuredClone(app.facade.model.getState('catalog'));
      const removed = catalog.items.shift();
      await app.facade.dispatchCommand('catalog.replace', { catalog });
      await app.facade.whenXTensionsIdle();
      catalog.items.unshift(removed);
      await app.facade.dispatchCommand('catalog.replace', { catalog });
      await app.facade.whenXTensionsIdle();
      renewed = !root.contains(selects[0]) && root.contains(selects[2]) && !root.contains(headers[0]) && root.contains(headers[1]);
    }
  } catch (failure) { error = String(failure.message); }
  const result = { error, report, loads, admissions, reordered, renewed, nativeActivated, nativePreActivated,
    nativeInternalsPresent: [...headers, ...buttons].some(node => node.shadowRoot !== null),
    preserved: originalNodes.every(node => root.contains(node)),
    firstPreserved: selects.length > 0 && root.contains(selects[0]),
    siblingPreserved: selects.length > 1 && root.contains(selects[1]),
    nativePreserved: headers.every(node => root.contains(node)) && buttons.every(node => root.contains(node)),
    unchanged: root.outerHTML === before, capture: app.facade.model?.getState('capture'),
    catalog: app.facade.model?.getState('catalog'), nativeTitles: [...root.querySelectorAll('[data-native-title]')].map(node => node.textContent) };
  const model = app.facade.model;
  app.dispose(); await app.facade.whenXTensionsIdle();
  const disposedState = model?.snapshot();
  const disposedFibers = JSON.stringify(originalFabric.getFibers());
  for (const button of root.querySelectorAll('x-button')) {
    button.dispatchEvent(new CustomEvent('button-interaction', { detail: { type: 'click' }, bubbles: true, composed: true }));
  }
  try { await app.facade.dispatchCommand('native.select', { productId: 'post-dispose' }); result.postDisposeCommandRejected = false; }
  catch { result.postDisposeCommandRejected = true; }
  await app.facade.whenXTensionsIdle();
  result.postDisposeStateUnchanged = JSON.stringify(model?.snapshot()) === JSON.stringify(disposedState);
  result.postDisposeFibersUnchanged = JSON.stringify(originalFabric.getFibers()) === disposedFibers;
  originalFabric.dispose?.();
  result.remaining = root.querySelectorAll('select,x-header,x-button').length;
  result.remainingFramework = root.querySelectorAll('select').length;
  result.remainingNative = root.querySelectorAll('x-header,x-button').length;
  return result;
};
window.rmtxSSRReady = true;

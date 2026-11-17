'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const codec = require('../../tools/xtensions/url-state');
const api = import('../../components/xrouter-url-state.js');
const nextTurn = () => new Promise(resolve => setTimeout(resolve, 0));
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
function fixture(mode = 'history') {
  const dom = new JSDOM('<!doctype html><body></body>', { url: mode === 'hash' ? 'http://xtend.test/shell?locale=de#/filters?x=a+b&xtend-state=2.initial' : 'http://xtend.test/filters?locale=de&x=a%20b&xtend-state=2.initial#anchor' });
  const calls = [], control = { token: '2.changed', status: 'restored', owner: true, gate: null };
  // The route-owner unit seam injects Maraca ports. The separate Source4 E2E
  // acceptance supplies the actual Model/View/React/Vue runtime to this host.
  const runtime = {
    async restoreURLState(token, lifetime) { calls.push({ kind: 'restore', token, lifetime }); if (control.gate) await control.gate.promise; return { status: control.status }; },
    async publishURLState({ cause, currentToken, lifetime, write }) {
      calls.push({ kind: 'publish', cause, currentToken, lifetime });
      if (!lifetime.isCurrent()) return { status: 'superseded' };
      const mode = currentToken === control.token || cause === 'traverse' ? 'none' : cause === 'checkpoint' ? 'push' : 'replace';
      if (mode !== 'none') write({ schema: 'xtend.xtensions.url-history-proposal.v2', mode, token: control.token });
      return { status: 'published', mode };
    }
  };
  return { dom, win: dom.window, runtime, calls, control, async owner(extra = {}) { const a = await api; return a.createXRouterProjectionURLStateHost({ runtime, codec: codec.PROJECTION_URL_STATE_RUNTIME, windowTarget: dom.window, mode, isOwnerCurrent: () => control.owner, ...extra }); } };
}
test('route-owner factories keep legacy API1 closed and expose the explicit API2 host', async () => {
  const a = await api, f = fixture();
  try {
    assert.equal(a.XROUTER_URL_STATE_API_VERSION, '1.0.0'); assert.equal(a.XROUTER_PROJECTION_URL_STATE_API_VERSION, '2.0.0');
    assert.throws(() => a.createXRouterURLStateHost({ runtime: f.runtime, codec: codec.PROJECTION_URL_STATE_RUNTIME, windowTarget: f.win }), /v1 codec/);
    assert.throws(() => a.createXRouterProjectionURLStateHost({ runtime: f.runtime, codec, windowTarget: f.win }), /v2 codec/);
    const old = a.createXRouterURLStateHost({ runtime: f.runtime, codec, windowTarget: f.win }), current = await f.owner();
    assert.equal(old.schema, 'xtend.router.url-state-host.v1'); assert.equal(old.apiVersion, '1.0.0');
    assert.equal(current.schema, 'xtend.router.url-state-host.v2'); assert.equal(current.apiVersion, '2.0.0');
    assert.deepEqual(Object.keys(old).sort(), Object.keys(current).sort()); assert(Object.isFrozen(current)); old.dispose(); current.dispose();
  } finally { f.dom.window.close(); }
});
for (const mode of ['history', 'hash']) test(`projection ${mode} host delegates restore/publication and preserves route-owned URL bytes`, async () => {
  const f = fixture(mode), owner = await f.owner();
  try {
    const state = { unrelated: 'owned' }; f.win.history.replaceState(state, '', f.win.location.href);
    const result = await owner.navigate('initialize'); assert.equal(result.status, 'restored');
    assert.equal(f.calls[0].token, '2.initial'); assert.equal(f.calls[0].lifetime.isCurrent(), true);
    assert(f.win.location.href.includes(mode === 'hash' ? '?locale=de#/filters?x=a+b&xtend-state=2.changed' : '/filters?locale=de&x=a%20b&xtend-state=2.changed#anchor'));
    assert.deepEqual(f.win.history.state, state);
    const length = f.win.history.length; f.control.token = '2.checkpoint'; await owner.publish('checkpoint');
    assert.equal(f.win.history.length, length + 1); assert(f.win.location.href.includes('xtend-state=2.checkpoint'));
    await owner.publish('checkpoint'); assert.equal(f.win.history.length, length + 1);
    assert.throws(() => codec.withToken('', '2.checkpoint')); assert.equal(f.calls.at(-1).currentToken, '2.checkpoint');
  } finally { owner.dispose(); f.dom.window.close(); }
});
test('route departure, owner retirement and superseded navigation revoke pending URL2 authority', async () => {
  for (const invalidate of [f => f.win.history.replaceState(null, '', '/other'), f => { f.control.owner = false; }]) {
    const f = fixture(), owner = await f.owner();
    try {
      f.control.gate = deferred(); const pending = owner.navigate('initialize'), lifetime = f.calls[0].lifetime;
      invalidate(f); f.control.gate.resolve(); assert.equal((await pending).status, 'superseded'); assert.equal(lifetime.isCurrent(), false);
      assert.equal(f.calls.filter(call => call.kind === 'publish').length, 0);
    } finally { owner.dispose(); f.dom.window.close(); }
  }
  const f = fixture(), owner = await f.owner();
  try {
    f.control.gate = deferred(); const first = owner.navigate('initialize'), old = f.calls[0].lifetime, gate = f.control.gate;
    f.control.gate = null; f.win.history.replaceState(null, '', '/filters?locale=de&xtend-state=2.new');
    const second = owner.navigate('traverse'); gate.resolve(); assert.equal((await first).status, 'superseded'); assert.equal((await second).status, 'restored'); assert(old.signal.aborted);
  } finally { owner.dispose(); f.dom.window.close(); }
});
test('deferred URL2 navigation publishes nothing until explicit retry succeeds', async () => {
  const f = fixture(), owner = await f.owner();
  try {
    f.control.status = 'deferred'; assert.equal((await owner.navigate('initialize')).status, 'deferred');
    assert.equal((await owner.publish()).status, 'superseded'); assert.equal(f.calls.filter(call => call.kind === 'publish').length, 0);
    f.control.status = 'restored'; assert.equal((await owner.retry()).status, 'restored'); assert.equal(f.calls.filter(call => call.kind === 'restore').length, 2);
  } finally { owner.dispose(); f.dom.window.close(); }
});
test('disposing URL2 listeners revokes callbacks and preserves route-owner state', async () => {
  const f = fixture('hash'), owner = await f.owner({ listen: true });
  try {
    await owner.navigate('initialize'); const lifetime = f.calls[0].lifetime, before = f.calls.length;
    assert.equal(owner.dispose(), true); assert.equal(owner.dispose(), false); assert(lifetime.signal.aborted);
    f.win.dispatchEvent(new f.win.PopStateEvent('popstate')); f.win.dispatchEvent(new f.win.HashChangeEvent('hashchange'));
    await nextTurn(); assert.equal(f.calls.length, before); assert.equal((await owner.publish()).status, 'superseded');
    await assert.rejects(owner.navigate(), /disposed/);
  } finally { owner.dispose(); f.dom.window.close(); }
});
test('actual x-router connectURLState chooses the API2 route host and delegates query navigation', async () => {
  const f = fixture(), saved = new Map();
  for (const key of ['window', 'document', 'HTMLElement', 'CustomEvent', 'customElements', 'history', 'location', 'xtendState']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === 'xtendState' ? { subscribe: () => () => {} } : f.win[key] });
  }
  let router, owner;
  try {
    await import('../../components/xrouter.js'); router = f.win.document.createElement('x-router'); router.setAttribute('mode', 'history'); f.win.document.body.append(router);
    owner = router.connectURLState(f.runtime, codec.PROJECTION_URL_STATE_RUNTIME); await owner.whenIdle(); await nextTurn();
    assert.equal(owner.schema, 'xtend.router.url-state-host.v2'); assert.equal(owner.apiVersion, '2.0.0');
    const node = f.win.document.createElement('input'); router.shadowRoot.querySelector('#outlet').append(node);
    assert.equal(router.navigate('/filters?locale=de&x=a%20b&xtend-state=2.router'), true); await owner.whenIdle();
    assert.equal(f.calls.filter(call => call.kind === 'restore').at(-1).token, '2.router'); assert.equal(router.shadowRoot.querySelector('input'), node);
    router.remove(); assert.equal((await owner.publish()).status, 'superseded');
  } finally {
    owner?.dispose(); router?.remove(); f.dom.window.close();
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
  }
});

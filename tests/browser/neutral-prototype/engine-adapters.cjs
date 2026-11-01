'use strict';
// Test transport only: existing WebDriver controller owns startup, deadlines,
// sandbox checks and process cleanup. No engine fallback, launch or installation.
const assert = require('node:assert/strict');
const {connect} = require('./bidi.cjs');
const {localUrl} = require('./adapter.cjs');
const {browserNameForEngine} = require('../../../tools/browser-hypervisor');
const names = Object.freeze(Object.fromEntries(['firefox','chromium'].map(engine => [engine,browserNameForEngine(engine)])));
async function createEngineAdapter({engine, command, identity, sessionId, owner, connectBiDi = connect}) {
  assert(Object.hasOwn(names, engine), 'Explicit supported engine required');
  assert.equal(identity?.browserName, names[engine], 'Engine/session identity mismatch');
  assert.equal(typeof command, 'function'); assert.equal(typeof owner?.assertCurrent, 'function');
  assert(/^[\w-]+$/.test(sessionId), 'Owned session identity required');
  let closed = false, bidi;
  const request = async (method, route, body) => {
    assert(!closed, 'Adapter closed'); owner.assertCurrent();
    const value = await command(method, `/session/${sessionId}${route}`, body);
    owner.assertCurrent(); return value;
  };
  const primary = await request('GET', '/window');
  assert.equal(typeof primary, 'string'); assert(primary.length > 0, 'Window identity required');
  const contexts = new Set([primary]), preloads = new Map();
  if (engine === 'firefox') {
    bidi = await connectBiDi(identity.webSocketUrl, sessionId, owner);
    try {
      const tree = await bidi.command('browsingContext.getTree', {maxDepth:0});
      assert(tree.contexts.some(row => row.context === primary), 'Primary context absent from BiDi tree');
    } catch (error) {
      try { await bidi.close(); } catch (cleanup) { error.cleanup = cleanup; }
      throw error;
    }
  }
  const known = context => { assert(!closed, 'Adapter closed'); assert(contexts.has(context), 'Unknown owned context'); owner.assertCurrent(); };
  const inContext = async (context, action) => {
    known(context);
    const previous = await request('GET', '/window');
    assert(contexts.has(previous), 'Unexpected current window');
    if (previous !== context) await request('POST', '/window', {handle:context});
    let failure;
    try { return await action(); } catch (error) { failure = error; throw error; }
    finally {
      if (previous !== context) {
        try { await request('POST', '/window', {handle:previous}); }
        catch (cleanup) { if (failure) failure.cleanup = cleanup; else throw cleanup; }
      }
    }
  };
  const cdp = (cmd, params) => request('POST', '/goog/cdp/execute', {cmd, params});
  return {
    engine, primary, protocol: engine === 'firefox' ? 'webdriver-bidi' : 'webdriver-cdp',
    async addPreload(context, source) {
      known(context); assert.equal(typeof source, 'string'); assert(source.length > 0);
      const value = bidi ? await bidi.command('script.addPreloadScript', {functionDeclaration:`() => {\n${source}\n}`, contexts:[context]}) :
        await inContext(context, () => cdp('Page.addScriptToEvaluateOnNewDocument', {source}));
      const id = bidi ? value.script : value.identifier;
      assert(typeof id === 'string' && id.length > 0 && !preloads.has(id), 'Invalid or duplicate preload identity');
      preloads.set(id, context); return id;
    },
    async removePreload(id) {
      assert(preloads.has(id), 'Unknown preload identity'); const context = preloads.get(id); known(context);
      if (bidi) await bidi.command('script.removePreloadScript', {script:id});
      else await inContext(context, () => cdp('Page.removeScriptToEvaluateOnNewDocument', {identifier:id}));
      preloads.delete(id);
    },
    async createContext() {
      known(primary);
      const value = bidi ? await bidi.command('browsingContext.create', {type:'tab'}) : await request('POST', '/window/new', {type:'tab'});
      const context = bidi ? value.context : value.handle;
      assert(typeof context === 'string' && context.length > 0 && !contexts.has(context), 'Invalid or duplicate context');
      contexts.add(context); return context;
    },
    async navigateContext(context, url) {
      known(context); localUrl(url);
      if (bidi) await bidi.command('browsingContext.navigate', {context, url, wait:'complete'});
      else await inContext(context, () => request('POST', '/url', {url}));
    },
    async evaluateContext(context, expression) {
      known(context); assert.equal(typeof expression, 'string');
      if (!bidi) return inContext(context, () => request('POST', '/execute/sync', {script:`return (${expression});`, args:[]}));
      const value = await bidi.command('script.evaluate', {expression:`JSON.stringify(${expression})`, target:{context}, awaitPromise:false});
      assert.equal(value.type, 'success', 'BiDi evaluation failed');
      assert.equal(value.result.type, 'string', 'JSON result required'); return JSON.parse(value.result.value);
    },
    async closeContext(context) {
      known(context); assert.notEqual(context, primary, 'Primary context remains owned by session cleanup');
      assert(![...preloads.values()].includes(context), 'Remove context preloads before closing');
      if (bidi) await bidi.command('browsingContext.close', {context});
      else { await request('POST', '/window', {handle:context}); await request('DELETE', '/window'); }
      contexts.delete(context); await request('POST', '/window', {handle:primary});
    },
    async close() {
      assert(!closed, 'Adapter already closed'); assert.equal(preloads.size, 0, 'Unremoved preloads');
      assert.equal(contexts.size, 1, 'Unclosed secondary contexts');
      if (bidi) { const result = await bidi.close(); assert.equal(result.status, 'passed'); assert.equal(result.closed, true); }
      closed = true;
      return {status:'passed', closed:true, scope:bidi ? 'bidi-connection' : 'adapter-only; session and process cleanup remain required'};
    }
  };
}
module.exports = {createEngineAdapter};

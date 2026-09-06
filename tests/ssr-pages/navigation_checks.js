'use strict';
const assert = require('node:assert/strict');

async function navigationChecks({check, createPageClient, page}) {
  const tick = () => new Promise(resolve => setImmediate(resolve));
  function browser({reduced = false, delayed = false, unsupported = false, skipped = false} = {}) {
    const handlers = {}, transitions = [], snapshots = [];
    const win = {location: new URL('http://localhost/start'), scrollX: 0, scrollY: 240,
      addEventListener(name, handler) {handlers[name] = handler;}, removeEventListener() {},
      matchMedia: () => ({matches: reduced}), scrollTo(x, y) {win.scrollX = x; win.scrollY = y;},
      history: {state: {}, replaceState(state, _, url) {this.state = state; win.location = new URL(url, win.location);}, pushState(state, _, url) {this.replaceState(state, _, url);}},
      document: {head: {querySelectorAll: () => []}, querySelectorAll: () => [], getElementById: () => null,
        addEventListener(name, handler) {handlers[name] = handler;}, removeEventListener() {}}
    };
    const target = {localName: 'main', style: {}, hasAttribute: () => false, getAnimations: () => transitions,
      querySelector: () => null, focus() {}};
    if (!unsupported) target.animate = () => {
      let finish;
      const finished = new Promise(resolve => {finish = resolve;});
      const transition = {finished, run: finish, cancelled: false, cancel() {this.cancelled = true; finish();}};
      transitions.push(transition); snapshots.push(win.scrollY);
      if (!delayed) finish();
      return transition;
    };
    win.XUtils = {async runUiTransition({target}) {
      const animation = target.animate();
      await animation.finished;
      if (skipped) throw new Error('Animation unavailable');
      return {status: 'complete'};
    }};
    win.document.getElementById = id => id === 'xtend-page' ? target : null;
    return {win, handlers, transitions, snapshots};
  }
  const setup = (configuration, overrides = {}) => {
    const state = browser(configuration), rendered = [];
    const client = createPageClient({initialPage: page('start'), viewTransitions: true, window: state.win, renderer: {commit() {}},
      render: async next => {rendered.push(next.page);}, fetch: async url => Response.json(page(new URL(url).pathname.slice(1))), ...overrides});
    return {...state, client, rendered};
  };
  await check('owned navigation animations start at destination scroll and skip reloads, opt-outs and reduced motion', async () => {
    for (const configuration of [{}, {reduced: true}, {unsupported: true}, {skipped: true}]) {
      const {client, win, transitions, snapshots} = setup(configuration);
      try {
        await client.visit('/next');
        assert.equal(client.page.page, 'next');
        assert.equal(win.scrollY, 0);
        assert.deepEqual(win.history.state.xtend.data.scroll, [0, 0]);
        const expected = configuration.reduced || configuration.unsupported ? 0 : 1;
        assert.equal(transitions.length, expected);
        assert.deepEqual(snapshots, expected ? [0] : []);
        await client.reload();
        win.scrollY = 240;
        await client.visit('/variant', {preserveScroll: true, transition: false});
        assert.equal(win.scrollY, 240);
        assert.equal(transitions.length, expected);
      } finally {client.dispose();}
    }
  });
  await check('variant link attributes preserve position and remembered data without a page transition', async () => {
    const {client, handlers, win, transitions} = setup();
    const attributes = {'data-xtend-preserve-scroll': 'true', 'data-xtend-preserve-state': 'true', 'data-xtend-transition': 'none'};
    const link = {href: 'http://localhost/variant', hasAttribute: name => name in attributes, getAttribute: name => attributes[name], closest: () => null};
    let prevented = false;
    try {
      client.remember('quantity', 3);
      handlers.click({button: 0, target: {closest: () => link}, preventDefault() {prevented = true;}});
      for (let n = 0; n < 100 && win.location.pathname !== '/variant'; n++) await tick();
      assert(prevented); assert.equal(win.location.pathname, '/variant');
      assert.equal(win.scrollY, 240); assert.equal(client.remember('quantity'), 3); assert.equal(transitions.length, 0);
    } finally {client.dispose();}
  });
  await check('new visits and disposal cancel pending animations without delaying page commits', async () => {
    for (const dispose of [false, true]) {
      const {client, transitions, rendered} = setup({delayed: true});
      await client.visit('/slow');
      assert.equal(transitions.length, 1);
      assert.equal(client.page.page, 'slow');
      if (dispose) client.dispose();
      else await client.visit('/fast', {transition: false});
      assert.equal(transitions[0].cancelled, true);
      assert.deepEqual(rendered, dispose ? ['slow'] : ['slow', 'fast']);
      assert.equal(client.page.page, dispose ? 'slow' : 'fast');
      client.dispose();
    }
  });
  await check('superseded and disposed custom transition callbacks cannot render an obsolete page', async () => {
    for (const dispose of [false, true]) {
      let release, entered;
      const started = new Promise(resolve => {entered = resolve;});
      const pending = new Promise(resolve => {release = resolve;});
      const {client, rendered} = setup({}, {transition: async update => {entered(); await pending; await update();}});
      const slow = client.visit('/slow');
      await started;
      const fast = dispose ? (client.dispose(), null) : client.visit('/fast', {transition: false});
      release();
      await Promise.all([slow, fast]);
      assert.deepEqual(rendered, dispose ? [] : ['fast']);
      assert.equal(client.page.page, dispose ? 'start' : 'fast');
      client.dispose();
    }
  });
  await check('transition update failures reject the visit and retain the previous page', async () => {
    const {client} = setup({}, {render: async () => {throw new Error('Render failed');}});
    try {await assert.rejects(client.visit('/broken'), /Render failed/); assert.equal(client.page.page, 'start');}
    finally {client.dispose();}
  });
}
module.exports = {navigationChecks};

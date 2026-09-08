'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { pathToFileURL } = require('url');
const { createDeterministicHost } = require('../rmt-language/rmt_kernel_scheduler_suite');

function declaration(source, name) {
  const match = source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}`, 'u'));
  assert(match, `Missing Docs function: ${name}`);
  return match[0];
}

async function runDocsSchedulerConsumerChecks(rootDir, context) {
  const [{ createRmtKernelScheduler }, { createRmtBrowserScheduler }] = await Promise.all([
    import(pathToFileURL(path.join(rootDir, 'xtendrmt/rmt-kernel-scheduler.js')).href),
    import(pathToFileURL(path.join(rootDir, 'xtendrmt/rmt-browser-scheduler.js')).href)
  ]);
  const host = createDeterministicHost();
  const kernel = createRmtKernelScheduler({ hostPort: host });
  const browser = createRmtBrowserScheduler({ scheduler: kernel });
  const shell = fs.readFileSync(path.join(rootDir, 'docs/utils/docs-shell-runtime.mjs'), 'utf8');
  const routes = fs.readFileSync(path.join(rootDir, 'docs/utils/page/route-controller.mjs'), 'utf8');
  const queries = [];
  const rendered = [];
  const disposers = [];
  const cleanup = [];
  let searchDisposed = false;
  let listenerDisposed = false;
  let hidden = 0;
  try {
    // Execute the production search and cleanup functions with the real job
    // handles and a deterministic clock; DOM presentation is the test boundary.
    const search = vm.runInNewContext([
      shell.match(/let searchSchedule\w+ = null;/u)[0],
      "let currentQuery = '';",
      ...['runSearch', 'scheduleSearch', 'dispose', 'schedulePrismHighlight', 'scheduleRouteRegistration', 'scheduleCompactIndex'].map(name => declaration(shell, name)),
      '({ scheduleSearch, dispose, schedulePrismHighlight, scheduleRouteRegistration, scheduleCompactIndex })'
    ].join('\n'), {
      browserScheduler: browser, disposers, fabric: null,
      window: { location: { pathname: '/docs/de/readme' } }, document: {},
      performance: { now: host.now }, locale: () => 'de', SEARCH_SOURCE_PREFIX: 'searchSource:docs.search.',
      appRuntime: { command: async () => {} },
      searchRuntime: {
        query: async (_, query) => { queries.push(query); return { results: [{ slug: query }] }; },
        dispose: () => { searchDisposed = true; }
      },
      showSearchResults: (_, query) => rendered.push(query),
      hideSearchResults: () => { hidden += 1; }, setSearchStatus() {},
      XUtils: { find: () => null, findAll: () => [] }, currentSlug: () => 'readme', ensureRouterRoutes() {}
    });
    search.scheduleSearch('hy');
    await host.flushMicrotasks();
    await host.advance(20);
    search.scheduleSearch('hydr');
    await host.advance(20);
    search.scheduleSearch('hydration');
    await host.advance(79);
    assert.deepEqual(queries, [], 'Search must wait for the final debounce interval');
    await host.advance(1);
    await host.flushMicrotasks();
    assert.deepEqual(queries, ['hydration']);
    assert.deepEqual(rendered, ['hydration']);
    context.pass('Rapid search input cancels earlier jobs and renders only the final query after 80 ms');

    search.scheduleSearch('discard');
    search.scheduleSearch('');
    await host.advance(80);
    assert.deepEqual(queries, ['hydration']);
    assert.equal(hidden, 1);
    context.pass('Clearing the search cancels pending input and hides results without another query');

    search.scheduleSearch('pending');
    search.schedulePrismHighlight();
    search.scheduleRouteRegistration();
    search.scheduleCompactIndex();
    assert(disposers.every(disposer => typeof disposer === 'function'), 'Scheduler handles must not enter the listener disposer list');
    disposers.push(() => { listenerDisposed = true; });
    search.dispose();
    search.dispose();
    await host.advance(2000);
    assert(searchDisposed && listenerDisposed);
    assert.deepEqual(queries, ['hydration']);
    assert.equal(browser.snapshot().activeHandleCount, 0);
    assert.deepEqual(kernel.snapshot().pendingJobIds, []);
    context.pass('Shell disposal cancels pending search and background jobs while releasing event listeners');

    const playgroundBrowser = createRmtBrowserScheduler({ scheduler: kernel });
    const calls = [];
    const start = routes.indexOf('  let compileDisposer = null;');
    const end = routes.indexOf("  lifecycleDisposers.push(bindDocsLifecycle(editor, 'textarea-changed'", start);
    assert(start >= 0 && end > start, 'Missing Playground scheduling callbacks');
    const playground = vm.runInNewContext([
      declaration(routes, 'createDocsScheduleDisposer'), routes.slice(start, end),
      '({ scheduleDiagnostics, scheduleCompile, cancelScheduledWork })'
    ].join('\n'), {
      docsBrowserScheduler: playgroundBrowser, window: { location: { pathname: '/docs/de/learn-rmt-playground' } },
      root: {}, editor: {}, status: {}, copy: {}, locale: 'de',
      DOCS_RMT_PLAYGROUND_DIAGNOSTIC_DEBOUNCE_MS: 100, DOCS_RMT_PLAYGROUND_DEBOUNCE_MS: 200,
      setDocsRmtPlaygroundOutputPending() {}, getDocsRmtPlaygroundEditorValue: () => '', setDocsRmtPlaygroundStatus() {},
      runDocsRmtPlaygroundLanguageDiagnostics: async () => { calls.push('diagnostics'); },
      compileDocsRmtPlayground: async () => { calls.push('compile'); }
    });
    for (let input = 0; input < 3; input += 1) {
      playground.scheduleDiagnostics();
      playground.scheduleCompile();
      await host.advance(20);
    }
    await host.advance(180);
    assert.deepEqual(calls, ['diagnostics', 'compile']);
    playground.scheduleDiagnostics();
    playground.scheduleCompile();
    playground.cancelScheduledWork();
    playground.cancelScheduledWork();
    await host.advance(500);
    assert.deepEqual(calls, ['diagnostics', 'compile']);
    context.pass('Playground input debounces compile and diagnostics with cancellable jobs and cancels both on teardown');

    const attributes = new Map();
    const codeRoot = { querySelectorAll: () => [{}], setAttribute: (key, value) => attributes.set(key, value), removeAttribute: key => attributes.delete(key) };
    const enhanceCode = vm.runInNewContext([
      declaration(routes, 'createDocsScheduleDisposer'), declaration(routes, 'scheduleDocsSsrCodeEnhancement'),
      'scheduleDocsSsrCodeEnhancement'
    ].join('\n'), {
      docsBrowserScheduler: playgroundBrowser, window: { location: { pathname: '/docs/de/readme' } },
      customElements: { get: () => ({}), whenDefined: async () => {} }, getRmtSchedule: () => null,
      bindDocsLifecycle: () => () => {}, normalizeDocsParsedownCodeEntities: () => 0,
      upgradeDocsParsedownCodeFences: () => ({ upgraded: 1 }), hydrateDocsCodeBlocks: async () => {}
    });
    const cancelEnhancement = enhanceCode(codeRoot);
    cleanup.push(cancelEnhancement);
    for (let turn = 0; turn < 10 && playgroundBrowser.snapshot().activeHandleCount === 0; turn += 1) await Promise.resolve();
    assert.equal(playgroundBrowser.snapshot().activeHandleCount, 1);
    cancelEnhancement();
    assert.deepEqual(kernel.snapshot().pendingJobIds, []);
    await host.advance(1);
    assert.equal(attributes.get('data-docs-code-enhancement'), 'idle-pending');
    const completedBefore = kernel.snapshot().counts.completed;
    const finishEnhancement = enhanceCode(codeRoot);
    cleanup.push(finishEnhancement);
    for (let turn = 0; turn < 10 && playgroundBrowser.snapshot().activeHandleCount === 0; turn += 1) await Promise.resolve();
    await host.advance(1);
    assert.equal(attributes.get('data-docs-code-enhancement'), 'idle-committed');
    assert.equal(kernel.snapshot().counts.completed, completedBefore + 1, 'An idle callback must not cancel its own job');
    finishEnhancement();
    playgroundBrowser.dispose();
    context.pass('Deferred code highlighting cancels on teardown and completes normally when its idle job runs');
  } finally {
    cleanup.forEach(dispose => dispose());
    browser.dispose();
    kernel.dispose();
  }
}

module.exports = { runDocsSchedulerConsumerChecks };

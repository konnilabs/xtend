(function installDocsDevApi(globalTarget) {
  'use strict';

  const state = {
    status: 'degraded',
    bootStartedAt: globalTarget.performance && typeof globalTarget.performance.now === 'function' ? globalTarget.performance.now() : 0,
    hydratedAt: 0,
    hydrationMs: 0,
    route: null,
    search: null,
    content: null,
    diagnostics: []
  };
  const subscribers = new Set();

  function clone(value, fallback = null) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return fallback;
    }
  }

  function statusFor(durationMs, budgetMs) {
    if (!Number.isFinite(durationMs) || durationMs < 0) return 'unknown';
    if (durationMs <= budgetMs) return 'pass';
    return durationMs <= budgetMs * 1.25 ? 'warn' : 'fail';
  }

  function measurement(id, name, phase, durationMs, budgetMs, lane) {
    const duration = Math.max(0, Number(durationMs || 0));
    return {
      schema: 'xtend.performance.measurement.v1',
      id,
      name,
      phase,
      profile: 'docs-shell',
      lane: lane || null,
      durationMs: Math.round(duration * 100) / 100,
      budgetMs,
      status: statusFor(duration, budgetMs),
      sampleKind: 'runtime'
    };
  }

  function navigationEntry() {
    if (!globalTarget.performance || typeof globalTarget.performance.getEntriesByType !== 'function') return null;
    return globalTarget.performance.getEntriesByType('navigation')[0] || null;
  }

  function paintEntry(name) {
    if (!globalTarget.performance || typeof globalTarget.performance.getEntriesByName !== 'function') return null;
    return globalTarget.performance.getEntriesByName(name)[0] || null;
  }

  function getPerformanceSnapshot() {
    const measurements = [];
    const navigation = navigationEntry();
    const fcp = paintEntry('first-contentful-paint');
    if (navigation) measurements.push(measurement('docs.ssr.response', 'SSR response', 'ssr', navigation.responseEnd, 650, 'critical'));
    if (fcp) measurements.push(measurement('docs.paint.fcp', 'First contentful paint', 'paint', fcp.startTime, 1200, 'critical'));
    if (state.hydratedAt) measurements.push(measurement('docs.shell.hydration', 'Docs shell hydration', 'hydration', state.hydrationMs, 80, 'visible'));
    if (state.content) measurements.push(measurement('docs.content.commit', 'Parsedown content commit', 'content', state.content.durationMs, 120, 'visible'));
    if (state.route) measurements.push(measurement('docs.route.transition', 'Route transition', 'route', state.route.durationMs, 140, 'transition'));
    if (state.search) measurements.push(measurement('docs.search.query', 'Documentation search', 'search', state.search.durationMs, 80, 'user-blocking'));
    if (measurements.length === 0) measurements.push(measurement('docs.shell.bootstrap', 'Docs shell bootstrap', 'boot', 0, 80, 'critical'));
    return {
      schema: 'xtend.docs.performance-snapshot.v1',
      supported: true,
      status: state.status,
      measurements,
      metadata: { route: clone(state.route), search: clone(state.search) }
    };
  }

  function getFabricTelemetrySnapshot() {
    const shellRuntime = globalTarget.xtendDocsShellRuntime;
    const docsFabric = globalTarget.xtendDocsFabric;
    const snapshot = (shellRuntime && typeof shellRuntime.createFabricSnapshot === 'function'
        ? shellRuntime.createFabricSnapshot('dev-api-read', { routeRef: state.route && state.route.routeRef })
        : null)
      || (docsFabric && typeof docsFabric.snapshot === 'function' ? docsFabric.snapshot('dev-api-read', { routeRef: state.route && state.route.routeRef }) : null)
      || globalTarget.xtendDocsFabricLastSnapshot;
    if (snapshot) return clone(snapshot, {});
    return {
      schema: 'xtend.fabric.telemetry-snapshot.v1',
      id: 'xtend.docs.fabric.degraded',
      status: 'degraded',
      lanes: {},
      totals: { fiberCount: 0, completedCount: 0, failedCount: 0, budgetMissCount: 0 },
      diagnosticCount: state.diagnostics.length
    };
  }

  function getKernelSnapshot() {
    const trustedDomRuntime = globalTarget.xtendDocsTrustedDomRuntime;
    const shellRuntime = globalTarget.xtendDocsShellRuntime;
    const runtimeSnapshot = shellRuntime && shellRuntime.appRuntime && typeof shellRuntime.appRuntime.getPanicRecoverySnapshot === 'function'
      ? shellRuntime.appRuntime.getPanicRecoverySnapshot()
      : null;
    const trustedSnapshot = trustedDomRuntime && typeof trustedDomRuntime.getPanicRecoverySnapshot === 'function'
      ? trustedDomRuntime.getPanicRecoverySnapshot()
      : null;
    const records = runtimeSnapshot && Array.isArray(runtimeSnapshot.records) ? runtimeSnapshot.records : [];
    const source = runtimeSnapshot && runtimeSnapshot.kernel && typeof runtimeSnapshot.kernel === 'object'
      ? runtimeSnapshot.kernel
      : (records.length > 0 ? records[records.length - 1] : (
        trustedSnapshot && trustedSnapshot.state ? trustedSnapshot : null
      ));
    return source && Object.keys(source).length ? clone(source, {}) : {
      schema: 'xtend.rmt.kernel-panic-state.v1',
      state: 'none',
      severity: 'info',
      recoveryAction: 'none',
      mitigationStrategy: 'observe',
      affectedScopes: [],
      affectedJobs: [],
      blockedCommitCount: 0,
      criticalViolationCount: 0,
      metadata: {
        recoverySchema: runtimeSnapshot && runtimeSnapshot.schema || null,
        recoveryRecordCount: Number(runtimeSnapshot && runtimeSnapshot.recordCount || 0),
        fabric: clone(runtimeSnapshot && runtimeSnapshot.fabric, {})
      }
    };
  }

  function getHydrationSnapshot() {
    const prehydration = globalTarget.xtendDocsSsrPrehydration || {};
    return {
      schema: 'xtend.devsurface.hydration-snapshot.v1',
      supported: true,
      strategy: 'server_prerender_hydrate',
      status: state.status === 'ready' ? 'ready' : 'hydrating',
      rootId: 'xtend-docs-rmt-root',
      adapterKind: 'php-ssr-parsedown',
      responseKind: 'rmt_template_chunk',
      hydrationSchema: prehydration.hydration && prehydration.hydration.schema || null,
      timing: {
        ssrRenderMs: 0,
        resumeReadMs: 0,
        hydrateMs: state.hydrationMs,
        firstInteractiveMs: state.hydrationMs,
        clsValue: Number(globalTarget.xtendDocsLayoutShiftValue || 0)
      },
      surfaces: [{ id: 'docs.root', status: state.status === 'ready' ? 'ready' : 'pending', strategy: 'server_prerender_hydrate' }],
      xscaler: {
        mode: 'same-origin-lazy',
        preflightEndpoint: null,
        lazyEndpoint: globalTarget.xtendDocsPageEndpoint || null,
        preflightCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        networkDuringRender: false,
        lazyLoadedCount: state.content ? 1 : 0,
        atcSessions: []
      },
      diagnostics: clone(state.diagnostics, [])
    };
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') return function noop() {};
    subscribers.add(listener);
    return function unsubscribe() { subscribers.delete(listener); };
  }

  function update(patch = {}) {
    Object.assign(state, clone(patch, {}));
    const snapshot = {
      schema: 'xtend.docs.dev-api-update.v1',
      status: state.status,
      route: clone(state.route),
      search: clone(state.search),
      content: clone(state.content)
    };
    subscribers.forEach((listener) => {
      try { listener(snapshot); } catch (_) {}
    });
    return snapshot;
  }

  const api = Object.freeze({
    version: '1.0.0',
    getPerformanceSnapshot,
    getFabricTelemetrySnapshot,
    getKernelSnapshot,
    getHydrationSnapshot,
    subscribe
  });

  globalTarget.__XTEND_DEV_API__ = api;
  globalTarget.xtendDocsDevApi = Object.freeze({ schema: 'xtend.docs.dev-api.v1', update });
})(typeof window !== 'undefined' ? window : globalThis);

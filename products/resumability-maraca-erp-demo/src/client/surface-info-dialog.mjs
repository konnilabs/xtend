let nativeComponentsPromise = null;

function now() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function formatMs(value) {
  if (!Number.isFinite(value) || value < 0) return 'n/a';
  if (value >= 1000) return `${(value / 1000).toFixed(2)} s`;
  return `${Math.round(value)} ms`;
}

function formatCount(value) {
  if (!Number.isFinite(Number(value))) return 'n/a';
  return new Intl.NumberFormat('de-DE').format(Number(value));
}

function safeCall(fn, fallback = null) {
  try {
    return typeof fn === 'function' ? fn() : fallback;
  } catch {
    return fallback;
  }
}

function safeSnapshot(handle) {
  if (!handle) return null;
  if (typeof handle.snapshot === 'function') return safeCall(() => handle.snapshot(), null);
  return null;
}

function safeList(handle, methodName) {
  if (!handle || typeof handle[methodName] !== 'function') return [];
  const value = safeCall(() => handle[methodName](), []);
  return Array.isArray(value) ? value : [];
}

function readPaintMetric(name) {
  const entries = typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function'
    ? performance.getEntriesByType('paint')
    : [];
  const entry = entries.find((item) => item.name === name);
  return entry ? entry.startTime : null;
}

function readNavigationMetric(key) {
  const entries = typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function'
    ? performance.getEntriesByType('navigation')
    : [];
  const navigation = entries[0];
  return navigation && Number.isFinite(navigation[key]) ? navigation[key] : null;
}

function countEntries(type) {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') return 0;
  if (type === 'longtask') return 0;
  return performance.getEntriesByType(type).length;
}

function getDataset(id) {
  const element = document.getElementById(id);
  return element ? { ...element.dataset } : {};
}

function getXtendDevApiSnapshot() {
  const maraca = window.XTendMaraca || {};
  const kernelHandle = maraca.kernel || window.__XTendMaracaKernel || null;
  const orchestrationHandle = maraca.orchestration || window.__XTendMaracaOrchestration || null;
  const hydrationHandle = maraca.hydration || window.__XTendMaracaHydration || null;
  const transitionsHandle = maraca.transitions || window.__XTendMaracaTransitions || null;
  const telemetryHandle = maraca.telemetry || window.__XTendMaracaTelemetry || null;
  const result = window.__XTendMaracaResult || {};
  const kernel = safeSnapshot(kernelHandle);
  const orchestration = safeSnapshot(orchestrationHandle);
  const hydration = safeSnapshot(hydrationHandle);
  const transitions = safeSnapshot(transitionsHandle);
  const telemetry = safeSnapshot(telemetryHandle);

  return {
    schema: 'xtend.local.resumability-maraca-erp-demo.dev-api-telemetry.v1',
    result: {
      ok: result.ok === true,
      status: result.status || '',
      surfaceCount: result.surfaceCount || 0,
      pendingComponentCount: result.pendingComponentCount || 0,
      componentTags: Array.isArray(result.componentTags) ? result.componentTags.slice() : [],
      lazyStrategy: result.lazyStrategy || '',
      kernelEnabled: Boolean(result.kernel && result.kernel.enabled),
      hydrationEnabled: Boolean(result.hydration && result.hydration.enabled),
      transitionActiveCount: result.transitions && result.transitions.activeCount || 0
    },
    kernel: {
      enabled: Boolean(kernelHandle && (kernelHandle.enabled || kernel)),
      status: kernel && kernel.status || result.kernel && result.kernel.status || '',
      scheduledEndpointCount: safeList(kernelHandle, 'listScheduledEndpoints').length || result.kernel && result.kernel.scheduledEndpointCount || 0,
      diagnosticCount: safeList(kernelHandle, 'listDiagnostics').length || result.kernel && result.kernel.diagnosticCount || 0,
      snapshot: kernel
    },
    orchestration: {
      enabled: Boolean(orchestrationHandle && (orchestrationHandle.enabled || orchestration)),
      status: orchestration && orchestration.status || result.orchestration && result.orchestration.status || '',
      surfaceCount: orchestration && Array.isArray(orchestration.surfaces) ? orchestration.surfaces.length : result.surfaceCount || 0,
      eventCount: orchestration && Array.isArray(orchestration.events) ? orchestration.events.length : result.eventCount || 0,
      snapshot: orchestration
    },
    hydration: {
      enabled: Boolean(hydrationHandle && (hydrationHandle.enabled || hydration)),
      status: hydration && hydration.status || result.hydration && result.hydration.status || '',
      recordCount: hydration && Array.isArray(hydration.records) ? hydration.records.length : 0,
      historyCount: hydration && Array.isArray(hydration.history) ? hydration.history.length : 0,
      diagnosticCount: safeList(hydrationHandle, 'listDiagnostics').length || result.hydration && result.hydration.diagnosticCount || 0,
      snapshot: hydration
    },
    transitions: {
      enabled: Boolean(transitionsHandle && (transitionsHandle.enabled || transitions)),
      status: transitions && transitions.status || result.transitions && result.transitions.status || '',
      activeCount: safeList(transitionsHandle, 'listActiveTransitions').length || result.transitions && result.transitions.activeCount || 0,
      diagnosticCount: safeList(transitionsHandle, 'listDiagnostics').length || result.transitions && result.transitions.diagnosticCount || 0,
      snapshot: transitions
    },
    telemetry: {
      eventCount: telemetry && Number.isFinite(Number(telemetry.eventCount)) ? Number(telemetry.eventCount) : 0,
      historyCount: telemetry && Array.isArray(telemetry.history) ? telemetry.history.length : 0,
      snapshot: telemetry
    }
  };
}

function collectTelemetry(metrics = {}, reason = 'manual') {
  const requestAt = Number(metrics.surfaceInfoDialogOpenRequestedAt || metrics.lastSurfaceInfoRequestAt || now());
  const componentLoadedAt = Number(metrics.surfaceInfoDialogLoadedAt || now());
  const openAt = Number(metrics.surfaceInfoDialogOpenedAt || now());
  const devApi = getXtendDevApiSnapshot();
  const smoke = getDataset('erp-demo-smoke-result');
  const timing = {
    fcpMs: readPaintMetric('first-contentful-paint'),
    firstPaintMs: readPaintMetric('first-paint'),
    domContentLoadedMs: readNavigationMetric('domContentLoadedEventEnd'),
    loadMs: readNavigationMetric('loadEventEnd'),
    maracaBootMs: Number.isFinite(Number(metrics.maracaBootAt)) ? Number(metrics.maracaBootAt) : null,
    xtensionMountMs: Number.isFinite(Number(metrics.xtensionsMountedAt)) ? Number(metrics.xtensionsMountedAt) : null,
    modalLoadMs: componentLoadedAt >= requestAt ? componentLoadedAt - requestAt : null,
    modalOpenMs: openAt >= requestAt ? openAt - requestAt : null
  };

  return {
    schema: 'xtend.local.resumability-maraca-erp-demo.surface-info-telemetry.v1',
    reason,
    capturedAt: new Date().toISOString(),
    timing,
    resources: {
      resourceCount: countEntries('resource'),
      longTaskCount: countEntries('longtask')
    },
    smoke,
    devApi
  };
}

function createElement(tag, options = {}, children = []) {
  const element = document.createElement(tag);
  if (options.className) element.className = options.className;
  if (options.id) element.id = options.id;
  if (options.text !== undefined) element.textContent = options.text;
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([name, value]) => {
      if (value === false || value === null || value === undefined) return;
      element.setAttribute(name, value === true ? '' : String(value));
    });
  }
  children.filter(Boolean).forEach((child) => element.append(child));
  return element;
}

function createKpi(label, value, note) {
  return createElement('div', { className: 'erp-telemetry-kpi' }, [
    createElement('span', { text: label }),
    createElement('b', { text: value }),
    note ? createElement('small', { text: note }) : null
  ]);
}

function createTimingBar(label, value, max) {
  const numeric = Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  return createElement('div', { className: 'erp-telemetry-bar' }, [
    createElement('span', { text: label }),
    createElement('meter', {
      attrs: {
        min: '0',
        max: String(max),
        value: String(Math.min(numeric, max)),
        'aria-label': `${label}: ${formatMs(value)}`
      }
    }),
    createElement('b', { text: formatMs(value) })
  ]);
}

function createDevApiRow(label, value, source) {
  return createElement('tr', {}, [
    createElement('th', { text: label }),
    createElement('td', { text: value }),
    createElement('td', { text: source })
  ]);
}

function renderTelemetry(container, telemetry) {
  container.replaceChildren();
  const timingItems = [
    ['FCP', telemetry.timing.fcpMs],
    ['DOM Ready', telemetry.timing.domContentLoadedMs],
    ['Maraca Boot', telemetry.timing.maracaBootMs],
    ['XTensions Mounted', telemetry.timing.xtensionMountMs],
    ['Lazy Modal Load', telemetry.timing.modalLoadMs],
    ['Dialog Open', telemetry.timing.modalOpenMs]
  ];
  const maxTiming = Math.max(100, ...timingItems.map(([, value]) => Number(value) || 0));

  const devApi = telemetry.devApi;
  const result = devApi.result;
  const kernel = devApi.kernel;
  const hydration = devApi.hydration;
  const transitions = devApi.transitions;
  const smoke = telemetry.smoke || {};

  container.append(
    createElement('div', { className: 'erp-surface-info-head' }, [
      createElement('div', {}, [
        createElement('strong', { text: 'Render-Telemetrie der offenen App Shell' }),
        createElement('span', { text: `Snapshot ${telemetry.capturedAt}` })
      ]),
      createElement('code', { text: telemetry.reason })
    ]),
    createElement('section', { className: 'erp-telemetry-kpis', attrs: { 'aria-label': 'Telemetry Kennzahlen' } }, [
      createKpi('Kernel', kernel.enabled ? 'aktiv' : 'aus', `${formatCount(kernel.scheduledEndpointCount)} Endpoints`),
      createKpi('Surfaces', formatCount(result.surfaceCount), `${formatCount(hydration.recordCount)} Hydration Records`),
      createKpi('XTensions', smoke.xtensionMounted || 'n/a', smoke.fallbackDegraded === 'false' ? 'keine Fallback-Degradation' : 'Fallback prüfen'),
      createKpi('Long Tasks', formatCount(telemetry.resources.longTaskCount), `${formatCount(telemetry.resources.resourceCount)} Ressourcen`)
    ]),
    createElement('section', { className: 'erp-telemetry-chart', attrs: { 'aria-label': 'Render Timing Balken' } },
      timingItems.map(([label, value]) => createTimingBar(label, value, maxTiming))
    ),
    createElement('table', { className: 'erp-devapi-table' }, [
      createElement('thead', {}, [
        createElement('tr', {}, [
          createElement('th', { text: 'Dev API' }),
          createElement('th', { text: 'Wert' }),
          createElement('th', { text: 'Quelle' })
        ])
      ]),
      createElement('tbody', {}, [
        createDevApiRow('Maraca Status', `${result.ok ? 'ok' : 'prüfen'} / ${result.status || 'n/a'}`, 'window.__XTendMaracaResult'),
        createDevApiRow('Kernel', `${kernel.status || 'n/a'} / ${formatCount(kernel.diagnosticCount)} Diagnostics`, 'XTendMaraca.kernel.snapshot()'),
        createDevApiRow('Hydration', `${hydration.status || 'n/a'} / ${formatCount(hydration.historyCount)} History`, 'XTendMaraca.hydration.snapshot()'),
        createDevApiRow('Transitions', `${transitions.status || 'n/a'} / ${formatCount(transitions.activeCount)} aktiv`, 'XTendMaraca.transitions'),
        createDevApiRow('Telemetry Bridge', `${formatCount(devApi.telemetry.eventCount)} Events`, 'XTendMaraca.telemetry.snapshot()'),
        createDevApiRow('Lazy Load', formatMs(telemetry.timing.modalLoadMs), 'surface-info-dialog.mjs')
      ])
    ])
  );
}

async function ensureNativeComponents() {
  if (!nativeComponentsPromise) {
    nativeComponentsPromise = Promise.all([
      import('/components/xdialog.js'),
      import('/components/xbutton.js')
    ]).then(async () => {
      await Promise.all([
        customElements.whenDefined('x-dialog'),
        customElements.whenDefined('x-button')
      ]);
      return true;
    });
  }
  return nativeComponentsPromise;
}

function setStateValue(stateRuntime, key, value) {
  if (stateRuntime && typeof stateRuntime.set === 'function') stateRuntime.set(key, value);
}

function createActionButton(id, label, variant = 'secondary') {
  const button = document.createElement('x-button');
  button.id = id;
  button.setAttribute('slot', 'actions');
  button.setAttribute('size', 'small');
  button.setAttribute('variant', variant);
  button.setAttribute('label', label);
  button.textContent = label;
  return button;
}

function ensureDialog(options) {
  const host = document.getElementById('erp-surface-info-dialog-host') || document.body.appendChild(
    createElement('div', {
      id: 'erp-surface-info-dialog-host',
      attrs: {
        'data-rmt-ssr-surface': 'erp.shell.surfaceInfoDialog',
        'data-rmt-lazy-modal': 'surface-info',
        'data-lazy-state': 'created-client'
      }
    })
  );
  host.hidden = false;
  host.dataset.lazyState = 'loaded';

  let dialog = document.getElementById('erp-surface-info-dialog');
  if (dialog) return { host, dialog, content: dialog.querySelector('.erp-surface-info-content') };

  dialog = document.createElement('x-dialog');
  dialog.id = 'erp-surface-info-dialog';
  dialog.className = 'erp-surface-info-dialog';
  dialog.setAttribute('overlay', '');
  dialog.setAttribute('title', 'RMT Surface Info');
  dialog.setAttribute('width', 'min(960px, calc(100vw - 32px))');
  dialog.setAttribute('height', 'min(78vh, 720px)');
  dialog.dataset.rmtIntent = 'surface-info-dialog';

  const content = createElement('section', {
    className: 'erp-surface-info-content',
    attrs: { 'aria-live': 'polite' }
  });
  const refresh = createActionButton('erp-surface-info-refresh', 'Aktualisieren', 'secondary');
  const close = createActionButton('erp-surface-info-close', 'Schließen', 'primary');
  dialog.append(content, refresh, close);
  host.append(dialog);

  refresh.addEventListener('click', () => {
    const telemetry = collectTelemetry(options.metrics || {}, 'button-refresh');
    renderTelemetry(content, telemetry);
    window.__XTendResumeDemo.surfaceInfoTelemetry = telemetry;
    setStateValue(options.stateRuntime, 'erp.shell.surfaceInfoDialog.telemetryStatus', 'refreshed');
    if (typeof options.onRefresh === 'function') options.onRefresh('button-refresh', telemetry);
  });

  close.addEventListener('click', () => {
    if (typeof dialog.close === 'function') dialog.close({ source: 'button' });
  });

  dialog.addEventListener('dialog-closed', (event) => {
    host.hidden = true;
    host.dataset.lazyState = 'loaded-closed';
    window.__XTendResumeDemo.surfaceInfoDialogOpen = false;
    setStateValue(options.stateRuntime, 'erp.shell.surfaceInfoDialog.open', false);
    setStateValue(options.stateRuntime, 'erp.shell.surfaceInfoDialog.hidden', true);
    setStateValue(options.stateRuntime, 'erp.shell.surfaceInfoDialog.telemetryStatus', 'closed');
    if (typeof options.onClose === 'function') {
      options.onClose(event && event.detail && event.detail.source || 'dialog-closed');
    }
    document.dispatchEvent(new CustomEvent('erp-demo:surface-info-closed', {
      detail: { source: event && event.detail && event.detail.source || 'dialog-closed' }
    }));
  });

  return { host, dialog, content };
}

export async function openSurfaceInfoDialog(options = {}) {
  const metrics = options.metrics || {};
  metrics.surfaceInfoDialogOpenRequestedAt = metrics.surfaceInfoDialogOpenRequestedAt || now();
  await ensureNativeComponents();
  metrics.surfaceInfoDialogLoadedAt = now();

  const { dialog, content } = ensureDialog(options);
  const telemetry = collectTelemetry(metrics, options.reason || 'manual');
  renderTelemetry(content, telemetry);

  window.__XTendResumeDemo.surfaceInfoDialogLoaded = true;
  window.__XTendResumeDemo.surfaceInfoDialogOpen = true;
  window.__XTendResumeDemo.surfaceInfoTelemetry = telemetry;
  setStateValue(options.stateRuntime, 'erp.shell.surfaceInfoDialog.open', true);
  setStateValue(options.stateRuntime, 'erp.shell.surfaceInfoDialog.loaded', true);
  setStateValue(options.stateRuntime, 'erp.shell.surfaceInfoDialog.hidden', false);
  setStateValue(options.stateRuntime, 'erp.shell.surfaceInfoDialog.telemetryStatus', 'ready');

  if (typeof dialog.open === 'function') dialog.open();
  else dialog.setAttribute('open', '');

  metrics.surfaceInfoDialogOpenedAt = now();
  document.dispatchEvent(new CustomEvent('erp-demo:surface-info-opened', {
    detail: { telemetry, reason: options.reason || 'manual' }
  }));
  return telemetry;
}

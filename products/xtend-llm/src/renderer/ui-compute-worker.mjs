const SURFACE_COST = Object.freeze({
  'settings-dialog': 8,
  'delete-conversation-dialog': 4,
  'code-bridge': 7,
  'retry-generation': 2,
  'generation-spinner': 1,
  'runtime-error': 3,
  'runtime-diagnostics': 5
});

function normalizeTargets(targets) {
  return Array.from(new Set((Array.isArray(targets) ? targets : [])
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)));
}

function computePrewarmManifest(targets = [], context = {}) {
  const entries = normalizeTargets(targets).map((target) => ({
    target,
    cacheKey: `ui-compute:${target}`,
    fiberKind: 'component.worker_prerender_hydrate',
    lane: 'background',
    estimatedCost: SURFACE_COST[target] || 3,
    invalidation: ['surface.destroy', 'settings.change', 'backpressure.critical']
  }));
  return {
    schema: 'xtend-llm.ui-compute-prewarm.v1',
    ok: true,
    targetCount: entries.length,
    totalEstimatedCost: entries.reduce((sum, entry) => sum + entry.estimatedCost, 0),
    entries,
    backpressureLevel: context.backpressureLevel || 'normal'
  };
}

function computeLayoutSummary(payload = {}) {
  const widgets = Array.isArray(payload.widgets) ? payload.widgets : [];
  const visible = widgets.filter((widget) => widget && widget.hidden !== true);
  return {
    schema: 'xtend-llm.ui-compute-layout-summary.v1',
    widgetCount: widgets.length,
    visibleCount: visible.length,
    lanes: Array.from(new Set(visible.map((widget) => widget.lane || 'visible'))).sort()
  };
}

function computeColumnStats(payload = {}) {
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const column = String(payload.column || '');
  const values = rows
    .map((row) => Number(row && row[column]))
    .filter((value) => Number.isFinite(value));
  const sum = values.reduce((total, value) => total + value, 0);
  return {
    schema: 'xtend-llm.ui-compute-column-stats.v1',
    column,
    count: values.length,
    sum,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    average: values.length ? sum / values.length : null
  };
}

function executeJob(job = {}) {
  switch (job.kind) {
    case 'prewarm.surface':
      return computePrewarmManifest(job.targets, job.context);
    case 'compute.layoutSummary':
      return computeLayoutSummary(job.payload);
    case 'compute.columnStats':
      return computeColumnStats(job.payload);
    default:
      throw new Error(`Unsupported UI compute job: ${job.kind || '<empty>'}`);
  }
}

self.addEventListener('message', (event) => {
  const message = event.data || {};
  const id = message.id || '';
  try {
    if (message.action === 'health') {
      self.postMessage({
        id,
        ok: true,
        result: {
          schema: 'xtend-llm.ui-compute-health.v1',
          status: 'ready',
          responsibilities: ['ui_compute', 'layout_precompute', 'analytics_precompute', 'template_prerender_compute'],
          excludedResponsibilities: ['dom_mutation', 'event_binding', 'state_ownership']
        }
      });
      return;
    }
    const result = executeJob(message.job || {});
    self.postMessage({ id, ok: true, result });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: {
        message: error && error.message ? error.message : String(error)
      }
    });
  }
});

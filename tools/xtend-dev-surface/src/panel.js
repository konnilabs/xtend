'use strict';

(function createXTendDevSurfacePanel() {
  const state = {
    view: 'performance',
    snapshot: null,
    worker: null,
    bridge: globalThis.XTendDevSurfaceRuntimeBridge || null,
    gateStream: null,
    companionHandshake: null,
    companionOrigin: 'http://127.0.0.1:27864',
    companionStatus: 'not-configured',
    companionMessage: 'Token missing',
    companionGates: []
  };

  const statusNode = document.getElementById('xds-status');
  const viewNode = document.getElementById('xds-view');
  const refreshButton = document.getElementById('xds-refresh');
  const tabButtons = Array.from(document.querySelectorAll('[data-view]'));

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setStatus(text) {
    statusNode.textContent = text;
  }

  function createFallbackSnapshot(reason) {
    if (state.bridge && typeof state.bridge.createFallbackSnapshot === 'function') {
      return state.bridge.createFallbackSnapshot(reason);
    }
    return {
      schema: 'xtend.devsurface.snapshot.v1',
      devApiVersion: null,
      performance: {
        summary: { totalCount: 0, grade: 'blocked' },
        measurements: []
      },
      hydration: {
        supported: false,
        strategy: 'unknown',
        status: 'unknown',
        summary: { status: 'unknown', supported: false },
        timeline: [],
        surfaces: [],
        xscaler: { status: 'unknown', preflightCount: 0, atcSessionCount: 0 }
      },
      fabric: {
        health: 'blocked',
        lanes: [],
        fiberCount: 0,
        backpressure: { level: 'unknown', action: 'observe' }
      },
      kernel: {
        state: 'unknown',
        health: 'blocked',
        recoveryAction: 'none',
        affectedScopes: []
      },
      gates: [],
      diagnostics: [{
        severity: 'warning',
        code: 'xtend.devsurface.dev_api.missing',
        message: reason || 'XTend DEV API unavailable.'
      }],
      ok: false
    };
  }

  function readInspectedPageSnapshot() {
    if (state.bridge && typeof state.bridge.readRuntimeSnapshotFromInspectedWindow === 'function') {
      return state.bridge.readRuntimeSnapshotFromInspectedWindow(globalThis.chrome && chrome.devtools);
    }
    return Promise.resolve(createFallbackSnapshot('XTend Runtime Bridge module is unavailable.'));
  }

  function normalizeWithWorker(rawSnapshot) {
    return new Promise((resolve) => {
      if (!state.worker) {
        try {
          state.worker = new Worker('prewarm-worker.js');
        } catch (_error) {
          resolve(rawSnapshot);
          return;
        }
      }

      const requestId = `xds.${Date.now()}.${Math.random()}`;
      const timeout = setTimeout(() => {
        resolve(rawSnapshot);
      }, 1500);

      function handleMessage(event) {
        if (!event.data || event.data.requestId !== requestId) return;
        clearTimeout(timeout);
        state.worker.removeEventListener('message', handleMessage);
        resolve(event.data.snapshot || rawSnapshot);
      }

      state.worker.addEventListener('message', handleMessage);
      state.worker.postMessage({
        type: 'xds:normalize-snapshot',
        requestId,
        snapshot: rawSnapshot
      });
    });
  }

  function renderBadge(value) {
    const normalized = value || 'unknown';
    return `<span class="xds-badge ${escapeHtml(normalized)}">${escapeHtml(normalized)}</span>`;
  }

  function formatNumber(value, fallback = '0') {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return fallback;
    return Number.isInteger(numberValue) ? String(numberValue) : numberValue.toFixed(2).replace(/\.?0+$/u, '');
  }

  function formatMs(value) {
    return `${formatNumber(value)}ms`;
  }

  function clampPercent(value) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return 0;
    return Math.max(0, Math.min(100, Math.round(numberValue)));
  }

  function renderBudgetBar(value) {
    return `<div class="xds-bar"><span style="width:${escapeHtml(clampPercent(value))}%"></span></div>`;
  }

  function renderDiagnostics(snapshot) {
    const diagnostics = Array.isArray(snapshot && snapshot.diagnostics) ? snapshot.diagnostics : [];
    if (diagnostics.length === 0) return '';
    return `
      <section class="xds-card xds-diagnostics">
        <h2>Runtime Diagnostics</h2>
        <ul class="xds-list">
          ${diagnostics.slice(0, 5).map((diagnostic) => `
            <li>
              <div class="xds-row">
                <strong>${escapeHtml(diagnostic.code || 'xtend.devsurface.diagnostic')}</strong>
                ${renderBadge(diagnostic.severity || 'warning')}
              </div>
              <div class="xds-muted">${escapeHtml(diagnostic.message || 'XTend Dev Surface diagnostic.')}</div>
            </li>
          `).join('')}
        </ul>
      </section>
    `;
  }

  function statusTextForSnapshot(snapshot) {
    const diagnostics = Array.isArray(snapshot && snapshot.diagnostics) ? snapshot.diagnostics : [];
    const firstError = diagnostics.find((diagnostic) => diagnostic.severity === 'error');
    const firstWarning = diagnostics.find((diagnostic) => diagnostic.severity === 'warning');
    if (firstError) return firstError.code || 'Snapshot blocked';
    if (snapshot && snapshot.ok === false && firstWarning) return firstWarning.code || 'Degraded snapshot';
    if (snapshot && snapshot.ok === false) return 'Degraded snapshot';
    return 'Snapshot ready';
  }

  function renderBudget(performance) {
    const summary = performance.summary || {};
    const budget = performance.budget || summary;
    return `
      <article class="xds-card">
        <h2>Budget</h2>
        <div class="xds-kpi">${escapeHtml(formatNumber(budget.budgetUsedPct))}%</div>
        ${renderBudgetBar(budget.budgetUsedPct)}
        <p class="xds-muted">${escapeHtml(formatMs(budget.totalDurationMs))} / ${escapeHtml(formatMs(budget.totalBudgetMs))}, ${escapeHtml(budget.budgetMissCount || 0)} misses</p>
      </article>
    `;
  }

  function renderTrend(performance) {
    const trend = performance.trend || {};
    const delta = Number(trend.deltaBudgetUsedPct) || 0;
    const signedDelta = delta > 0 ? `+${formatNumber(delta)}` : formatNumber(delta);
    return `
      <article class="xds-card">
        <h2>Trend</h2>
        <div>${renderBadge(trend.direction || 'stable')}</div>
        <p class="xds-muted">${escapeHtml(signedDelta)}% budget, ${escapeHtml(trend.sampleCount || 0)} samples</p>
      </article>
    `;
  }

  function normalizePhaseRows(phaseSummary) {
    if (Array.isArray(phaseSummary)) return phaseSummary;
    if (!phaseSummary || typeof phaseSummary !== 'object') return [];
    return Object.keys(phaseSummary).sort().map((phase) => ({
      phase,
      ...(phaseSummary[phase] || {})
    }));
  }

  function renderPhaseSummary(performance) {
    const phases = normalizePhaseRows(performance.phaseSummary);
    return `
      <section class="xds-card">
        <h2>Phase Summary</h2>
        <ul class="xds-list">
          ${phases.map((phase) => `
            <li>
              <div class="xds-row">
                <strong>${escapeHtml(phase.phase)}</strong>
                ${renderBadge(phase.grade || 'unknown')}
              </div>
              ${renderBudgetBar(phase.budgetUsedPct)}
              <div class="xds-muted">${escapeHtml(phase.measurementCount || 0)} measurements, ${escapeHtml(formatMs(phase.totalDurationMs))} / ${escapeHtml(formatMs(phase.totalBudgetMs))}, ${escapeHtml(phase.budgetMissCount || 0)} misses</div>
            </li>
          `).join('') || '<li class="xds-muted">No phase data reported.</li>'}
        </ul>
      </section>
    `;
  }

  function normalizeKernelRows(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    return [value];
  }

  function renderKernelRecovery(kernel) {
    const recovery = kernel.recovery || {};
    return `
      <article class="xds-card">
        <h2>Recovery</h2>
        <div>${renderBadge(recovery.status || 'unknown')}</div>
        <p class="xds-muted">${escapeHtml(recovery.action || kernel.recoveryAction || 'none')}</p>
        <div class="xds-muted">${escapeHtml(recovery.attemptCount || 0)} attempts, ${escapeHtml(recovery.failureCount || 0)} failures, ${escapeHtml(recovery.blockedCommitCount || kernel.blockedCommitCount || 0)} blocked commits</div>
      </article>
    `;
  }

  function renderKernelPanic(kernel) {
    const panic = kernel.panic || {};
    return `
      <section class="xds-card">
        <h2>Panic State</h2>
        <ul class="xds-list">
          <li>
            <div class="xds-row">
              <strong>${escapeHtml(panic.trigger || kernel.trigger || 'none')}</strong>
              ${renderBadge(panic.severity || kernel.severity || 'info')}
            </div>
            <div class="xds-muted">${escapeHtml(panic.panicId || kernel.panicId || 'no-panic-id')} / ${escapeHtml(panic.correlationId || kernel.correlationId || 'no-correlation-id')}</div>
            <div class="xds-muted">${escapeHtml(panic.detectedAt || 'not-detected')} / ${escapeHtml(panic.lastSeenAt || 'not-seen')}</div>
          </li>
        </ul>
      </section>
    `;
  }

  function renderKernelMitigations(kernel) {
    const mitigation = kernel.mitigation || {};
    const strategies = normalizeKernelRows(mitigation.strategies);
    return `
      <section class="xds-card">
        <h2>Mitigation Strategies</h2>
        <ul class="xds-list">
          ${strategies.map((strategy) => `
            <li>
              <div class="xds-row">
                <strong>${escapeHtml(strategy.strategy || mitigation.strategy || 'none')}</strong>
                ${renderBadge(strategy.status || 'pending')}
              </div>
              <div class="xds-muted">${escapeHtml(strategy.action || mitigation.action || kernel.recoveryAction || 'none')} ${strategy.scope ? `/ ${escapeHtml(strategy.scope)}` : ''}</div>
            </li>
          `).join('') || '<li class="xds-muted">No mitigation strategy reported.</li>'}
        </ul>
      </section>
    `;
  }

  function renderKernelScopes(kernel) {
    const scopes = normalizeKernelRows(kernel.affectedScopes);
    const jobs = normalizeKernelRows(kernel.affectedJobs);
    return `
      <section class="xds-grid">
        <article class="xds-card">
          <h2>Affected Scopes</h2>
          <ul class="xds-list">
            ${scopes.map((scope) => `
              <li>
                <div class="xds-row">
                  <strong>${escapeHtml(scope.label || scope.id || scope)}</strong>
                  ${renderBadge(scope.severity || kernel.severity || 'warning')}
                </div>
                <div class="xds-muted">${escapeHtml(scope.status || 'affected')} ${scope.mitigationStrategy ? `/ ${escapeHtml(scope.mitigationStrategy)}` : ''}</div>
              </li>
            `).join('') || '<li class="xds-muted">No affected scopes reported.</li>'}
          </ul>
        </article>
        <article class="xds-card">
          <h2>Affected Jobs</h2>
          <ul class="xds-list">
            ${jobs.map((job) => `
              <li>
                <div class="xds-row">
                  <strong>${escapeHtml(job.label || job.id || job)}</strong>
                  ${renderBadge(job.status || 'affected')}
                </div>
                <div class="xds-muted">${escapeHtml(job.lane || 'no-lane')} / ${escapeHtml(job.severity || kernel.severity || 'warning')}</div>
              </li>
            `).join('') || '<li class="xds-muted">No affected jobs reported.</li>'}
          </ul>
        </article>
      </section>
    `;
  }

  function renderFabricFiberSummary(fabric) {
    const fiberSummary = fabric.fiberSummary || {};
    return `
      <article class="xds-card">
        <h2>Fiber Summary</h2>
        <div class="xds-kpi">${escapeHtml(fiberSummary.fiberCount || fabric.fiberCount || 0)}</div>
        <p class="xds-muted">${escapeHtml(fiberSummary.completedCount || 0)} completed, ${escapeHtml(fiberSummary.activeFiberCount || 0)} active, ${escapeHtml(fiberSummary.pendingFiberCount || 0)} pending</p>
      </article>
    `;
  }

  function renderFabricBackpressure(fabric) {
    const backpressure = fabric.backpressure || {};
    return `
      <section class="xds-card">
        <h2>Backpressure</h2>
        <div class="xds-row">
          ${renderBadge(backpressure.level || 'unknown')}
          <span class="xds-muted">${escapeHtml(backpressure.pressureLaneCount || 0)} lanes</span>
        </div>
        <p class="xds-muted">${escapeHtml(backpressure.action || 'observe')}</p>
        <ul class="xds-list">
          ${(backpressure.laneIds || []).map((laneId) => `<li>${escapeHtml(laneId)}</li>`).join('') || '<li class="xds-muted">No pressure lanes reported.</li>'}
        </ul>
      </section>
    `;
  }

  function renderFabricCriticalLanes(fabric) {
    const criticalLanes = fabric.criticalLanes || [];
    return `
      <section class="xds-card">
        <h2>Critical Lanes</h2>
        <ul class="xds-list">
          ${criticalLanes.map((lane) => `
            <li>
              <div class="xds-row">
                <strong>${escapeHtml(lane.lane)}</strong>
                ${renderBadge(lane.health)}
              </div>
              ${renderBudgetBar(lane.utilizationPct)}
              <div class="xds-muted">${escapeHtml(formatNumber(lane.utilizationRawPct || lane.utilizationPct))}% utilization, ${escapeHtml(lane.failedCount || 0)} failed, ${escapeHtml(lane.budgetMissCount || 0)} budget misses</div>
            </li>
          `).join('') || '<li class="xds-muted">No critical lanes reported.</li>'}
        </ul>
      </section>
    `;
  }

  function getCompanionToken() {
    try {
      return localStorage.getItem('xtend.devSurface.token') || '';
    } catch (_error) {
      return '';
    }
  }

  function setCompanionToken(token) {
    const normalized = String(token || '').trim();
    try {
      if (normalized) localStorage.setItem('xtend.devSurface.token', normalized);
      else localStorage.removeItem('xtend.devSurface.token');
    } catch (_error) {
      // Storage failures degrade through the visible companion status.
    }
    return normalized;
  }

  function closeGateStream() {
    if (!state.gateStream) return;
    state.gateStream.close();
    state.gateStream = null;
  }

  function setCompanionState(status, message, gates) {
    state.companionStatus = status || 'unknown';
    state.companionMessage = message || '';
    if (Array.isArray(gates)) state.companionGates = gates;
  }

  function firstDiagnosticMessage(body, fallback) {
    const diagnostics = body && Array.isArray(body.diagnostics) ? body.diagnostics : [];
    const diagnostic = diagnostics[0];
    return diagnostic && diagnostic.message || fallback;
  }

  function gateButtonsDisabled() {
    return !getCompanionToken() || state.companionStatus === 'unavailable' || state.companionStatus === 'unauthorized';
  }

  function upsertGateRun(gateRun) {
    if (!gateRun) return;
    state.snapshot = state.snapshot || createFallbackSnapshot('No runtime snapshot loaded.');
    const runs = state.snapshot.gates || [];
    const runId = gateRun.runId || gateRun.id;
    const index = runs.findIndex((entry) => (entry.runId || entry.id) === runId);
    if (index >= 0) runs[index] = { ...runs[index], ...gateRun };
    else runs.push(gateRun);
    state.snapshot.gates = runs;
  }

  async function fetchCompanion(path, options = {}) {
    const headers = {
      ...(options.headers || {})
    };
    if (options.body) headers['content-type'] = 'application/json';
    headers['x-xtend-dev-surface-token'] = getCompanionToken();
    const response = await fetch(`${state.companionOrigin}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const body = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      body
    };
  }

  async function handshakeCompanion() {
    const token = getCompanionToken();
    if (!token) {
      setCompanionState('not-configured', 'Token missing', []);
      throw new Error('Companion token missing.');
    }
    const result = await fetchCompanion('/handshake', { method: 'POST' });
    state.companionHandshake = result.body;
    if (result.ok && result.body && result.body.ok === true) {
      setCompanionState('connected', `${state.companionOrigin} connected`, result.body.gates || []);
    } else {
      setCompanionState('unauthorized', firstDiagnosticMessage(result.body, 'Companion token invalid.'), []);
    }
    return result;
  }

  async function refreshGateRuns() {
    const result = await fetchCompanion('/gate-runs');
    if (result.ok && result.body && Array.isArray(result.body.runs)) {
      state.snapshot = state.snapshot || createFallbackSnapshot('No runtime snapshot loaded.');
      state.snapshot.gates = result.body.runs;
    }
    return result;
  }

  function connectGateStream() {
    if (state.gateStream || typeof EventSource !== 'function') return;
    const token = getCompanionToken();
    if (!token) return;
    state.gateStream = new EventSource(`${state.companionOrigin}/gate-runs/events?token=${encodeURIComponent(token)}`);
    state.gateStream.addEventListener('snapshot', (event) => {
      const payload = JSON.parse(event.data || '{}');
      if (Array.isArray(payload.runs)) {
        state.snapshot = state.snapshot || createFallbackSnapshot('No runtime snapshot loaded.');
        state.snapshot.gates = payload.runs;
        if (state.view === 'gates') renderDashboard();
      }
    });
    ['gate-run.queued', 'gate-run.started', 'gate-run.stdout', 'gate-run.stderr', 'gate-run.completed', 'gate-run.failed', 'gate-run.updated'].forEach((eventName) => {
      state.gateStream.addEventListener(eventName, (event) => {
        const payload = JSON.parse(event.data || '{}');
        upsertGateRun(payload.run);
        if (state.view === 'gates') renderDashboard();
      });
    });
    state.gateStream.addEventListener('error', () => {
      state.gateStream.close();
      state.gateStream = null;
    });
  }

  async function verifyCompanion() {
    setStatus('Checking companion');
    try {
      const handshake = await handshakeCompanion();
      if (!handshake.ok || !handshake.body || handshake.body.ok !== true) {
        closeGateStream();
        setStatus(state.companionMessage || 'Companion unauthorized');
        renderDashboard();
        return;
      }
      connectGateStream();
      await refreshGateRuns();
      setStatus('Companion connected');
    } catch (error) {
      closeGateStream();
      if (state.companionStatus !== 'not-configured' && state.companionStatus !== 'unauthorized') {
        setCompanionState('unavailable', error && error.message ? error.message : 'Companion unavailable.', []);
      }
      setStatus(state.companionMessage || 'Companion unavailable');
    }
    renderDashboard();
  }

  function renderPerformance(snapshot) {
    const performance = snapshot.performance || {};
    const summary = performance.summary || {};
    const measurements = performance.measurements || [];
    viewNode.innerHTML = `
      ${renderDiagnostics(snapshot)}
      <section class="xds-grid">
        <article class="xds-card">
          <h2>Performance Grade</h2>
          <div>${renderBadge(summary.grade || 'unknown')}</div>
          <p class="xds-muted">${escapeHtml(summary.totalCount || 0)} measurements, ${escapeHtml(summary.passCount || 0)} pass</p>
        </article>
        ${renderBudget(performance)}
        ${renderTrend(performance)}
        <article class="xds-card">
          <h2>Warnings</h2>
          <div class="xds-kpi">${escapeHtml(summary.warnCount || 0)}</div>
        </article>
        <article class="xds-card">
          <h2>Failures</h2>
          <div class="xds-kpi">${escapeHtml(summary.failCount || 0)}</div>
        </article>
      </section>
      ${renderPhaseSummary(performance)}
      <section class="xds-card">
        <h2>Measurements</h2>
        <ul class="xds-list">
          ${measurements.map((measurement) => `
            <li>
              <div class="xds-row">
                <strong>${escapeHtml(measurement.name)}</strong>
                ${renderBadge(measurement.grade)}
              </div>
              ${renderBudgetBar(measurement.budgetUsedPct)}
              <div class="xds-muted">${escapeHtml(measurement.phase)} - ${escapeHtml(formatMs(measurement.durationMs))} / ${escapeHtml(formatMs(measurement.budgetMs))}, ${escapeHtml(formatNumber(measurement.budgetUsedPct))}% budget</div>
            </li>
          `).join('') || '<li class="xds-muted">No measurements reported.</li>'}
        </ul>
      </section>
    `;
  }

  function renderHydrationTimeline(hydration) {
    const timeline = hydration.timeline || [];
    return `
      <section class="xds-card">
        <h2>Timeline</h2>
        <ol class="xds-timeline">
          ${timeline.map((step) => `
            <li>
              <div class="xds-row">
                <strong>${escapeHtml(step.label || step.id)}</strong>
                ${renderBadge(step.status || 'unknown')}
              </div>
              <div class="xds-muted">${escapeHtml(step.kind || 'step')} - ${escapeHtml(formatMs(step.durationMs || 0))}</div>
            </li>
          `).join('') || '<li class="xds-muted">No hydration timeline reported.</li>'}
        </ol>
      </section>
    `;
  }

  function renderHydrationSurfaces(hydration) {
    const surfaces = hydration.surfaces || [];
    return `
      <section class="xds-card">
        <h2>Surfaces</h2>
        <ul class="xds-list">
          ${surfaces.map((surface) => `
            <li>
              <div class="xds-row">
                <strong>${escapeHtml(surface.label || surface.id)}</strong>
                ${renderBadge(surface.status || 'unknown')}
              </div>
              <div class="xds-muted">${escapeHtml(surface.strategy || hydration.strategy || 'unknown')} ${surface.rootId ? `/ ${escapeHtml(surface.rootId)}` : ''}</div>
              <div class="xds-muted">${surface.lazy ? 'lazy' : 'eager'} / ${escapeHtml(surface.xscalerState || 'unknown')} preflight / ${surface.resumeTokenPresent ? 'resume token' : 'no resume token'}</div>
            </li>
          `).join('') || '<li class="xds-muted">No hydration surfaces reported.</li>'}
        </ul>
      </section>
    `;
  }

  function renderHydrationXScaler(hydration) {
    const xscaler = hydration.xscaler || {};
    const atcSessions = xscaler.atcSessions || [];
    const acceptancePct = xscaler.preflightCount > 0
      ? Math.round(((xscaler.acceptedCount || 0) / xscaler.preflightCount) * 100)
      : 0;
    return `
      <section class="xds-card">
        <h2>XScaler</h2>
        <section class="xds-grid">
          <article class="xds-metric">
            <strong>${escapeHtml(xscaler.mode || 'unknown')}</strong>
            <span class="xds-muted">mode</span>
          </article>
          <article class="xds-metric">
            <strong>${escapeHtml(formatNumber(acceptancePct))}%</strong>
            <span class="xds-muted">${escapeHtml(xscaler.acceptedCount || 0)} accepted / ${escapeHtml(xscaler.rejectedCount || 0)} rejected</span>
          </article>
          <article class="xds-metric">
            <strong>${escapeHtml(xscaler.networkDuringRender ? 'true' : 'false')}</strong>
            <span class="xds-muted">networkDuringRender</span>
          </article>
          <article class="xds-metric">
            <strong>${escapeHtml(xscaler.lazyLoadedCount || 0)}</strong>
            <span class="xds-muted">lazy loaded surfaces</span>
          </article>
        </section>
        ${renderBudgetBar(acceptancePct)}
        <div class="xds-muted">${escapeHtml(xscaler.preflightEndpoint || 'no-preflight-endpoint')} / ${escapeHtml(xscaler.lazyEndpoint || 'no-lazy-endpoint')}</div>
        <h3>ATC Sessions</h3>
        <ul class="xds-list">
          ${atcSessions.map((session) => `
            <li>
              <div class="xds-row">
                <strong>${escapeHtml(session.sessionId || session.id)}</strong>
                ${renderBadge(session.lifecycleState || session.activation || 'unknown')}
              </div>
              <div class="xds-muted">${escapeHtml(session.route || 'no-route')} / ${escapeHtml(session.schedulerLane || 'no-lane')}</div>
            </li>
          `).join('') || '<li class="xds-muted">No ATC handoff sessions reported.</li>'}
        </ul>
      </section>
    `;
  }

  function renderHydration(snapshot) {
    const hydration = snapshot.hydration || {};
    const summary = hydration.summary || {};
    const timing = hydration.timing || {};
    const xscaler = hydration.xscaler || {};
    const resumeToken = hydration.resumeToken || 'none';
    if (hydration.supported === false) {
      viewNode.innerHTML = `
        ${renderDiagnostics(snapshot)}
        <section class="xds-card">
          <h2>Hydration</h2>
          <div>${renderBadge('unknown')}</div>
          <p class="xds-muted">No optional getHydrationSnapshot() data reported.</p>
        </section>
      `;
      return;
    }
    viewNode.innerHTML = `
      ${renderDiagnostics(snapshot)}
      <section class="xds-grid">
        <article class="xds-card">
          <h2>Strategy</h2>
          <div>${renderBadge(hydration.strategy || 'unknown')}</div>
          <p class="xds-muted">${escapeHtml(hydration.hydrationSchema || 'no-hydration-schema')}</p>
        </article>
        <article class="xds-card">
          <h2>Status</h2>
          <div>${renderBadge(summary.status || hydration.status || 'unknown')}</div>
          <p class="xds-muted">${escapeHtml(summary.surfaceCount || hydration.surfaceCount || 0)} surfaces, ${escapeHtml(summary.pendingSurfaceCount || 0)} pending</p>
        </article>
        <article class="xds-card">
          <h2>Resume Token</h2>
          <div class="xds-token">${escapeHtml(resumeToken)}</div>
          <p class="xds-muted">${hydration.resumeTokenRedacted ? 'redacted' : 'provided by app'}</p>
        </article>
        <article class="xds-card">
          <h2>Timing</h2>
          <div class="xds-kpi">${escapeHtml(formatMs(timing.firstInteractiveMs || timing.hydrateMs || 0))}</div>
          <p class="xds-muted">SSR ${escapeHtml(formatMs(timing.ssrRenderMs || 0))}, resume ${escapeHtml(formatMs(timing.resumeReadMs || 0))}, CLS ${escapeHtml(formatNumber(timing.clsValue || 0))}</p>
        </article>
        <article class="xds-card">
          <h2>XScaler</h2>
          <div>${renderBadge(xscaler.status || 'unknown')}</div>
          <p class="xds-muted">${escapeHtml(xscaler.preflightCount || 0)} preflights, ${escapeHtml(xscaler.atcSessionCount || 0)} ATC</p>
        </article>
      </section>
      ${renderHydrationTimeline(hydration)}
      ${renderHydrationSurfaces(hydration)}
      ${renderHydrationXScaler(hydration)}
    `;
  }

  function renderKernel(snapshot) {
    const kernel = snapshot.kernel || {};
    const summary = kernel.summary || {};
    viewNode.innerHTML = `
      ${renderDiagnostics(snapshot)}
      <section class="xds-grid">
        <article class="xds-card">
          <h2>Kernel Health</h2>
          <div>${renderBadge(kernel.health)}</div>
          <p class="xds-muted">${escapeHtml(kernel.state || 'unknown')}</p>
        </article>
        <article class="xds-card">
          <h2>Panic</h2>
          <div>${renderBadge(kernel.state || 'unknown')}</div>
          <p class="xds-muted">${escapeHtml(kernel.trigger || 'none')}</p>
        </article>
        ${renderKernelRecovery(kernel)}
        <article class="xds-card">
          <h2>Violations</h2>
          <div class="xds-kpi">${escapeHtml(summary.criticalViolationCount || kernel.criticalViolationCount || 0)}</div>
          <p class="xds-muted">${escapeHtml(summary.affectedScopeCount || 0)} scopes, ${escapeHtml(summary.affectedJobCount || 0)} jobs</p>
        </article>
      </section>
      ${renderKernelPanic(kernel)}
      ${renderKernelMitigations(kernel)}
      ${renderKernelScopes(kernel)}
    `;
  }

  function renderFabric(snapshot) {
    const fabric = snapshot.fabric || {};
    const summary = fabric.summary || {};
    const lanes = fabric.lanes || [];
    viewNode.innerHTML = `
      ${renderDiagnostics(snapshot)}
      <section class="xds-grid">
        <article class="xds-card">
          <h2>Fabric Health</h2>
          <div>${renderBadge(fabric.health)}</div>
          <p class="xds-muted">${escapeHtml(summary.laneCount || fabric.laneCount || 0)} lanes, ${escapeHtml(summary.criticalLaneCount || 0)} critical</p>
        </article>
        ${renderFabricFiberSummary(fabric)}
        <article class="xds-card">
          <h2>Failures</h2>
          <div class="xds-kpi">${escapeHtml(summary.failedCount || 0)}</div>
          <p class="xds-muted">${escapeHtml(summary.budgetMissCount || 0)} budget misses</p>
        </article>
        <article class="xds-card">
          <h2>Utilization</h2>
          <div class="xds-kpi">${escapeHtml(formatNumber(summary.maxUtilizationPct || 0))}%</div>
          <p class="xds-muted">${escapeHtml(formatNumber(summary.averageUtilizationPct || 0))}% average</p>
        </article>
      </section>
      ${renderFabricBackpressure(fabric)}
      ${renderFabricCriticalLanes(fabric)}
      <section class="xds-card">
        <h2>Lanes</h2>
        <ul class="xds-list">
          ${lanes.map((lane) => `
            <li>
              <div class="xds-row">
                <strong>${escapeHtml(lane.lane)}</strong>
                ${renderBadge(lane.health)}
              </div>
              ${renderBudgetBar(lane.utilizationPct)}
              <div class="xds-muted">${escapeHtml(formatNumber(lane.utilizationRawPct || lane.utilizationPct))}% utilization, ${escapeHtml(lane.fiberCount)} fibers, ${escapeHtml(lane.failedCount)} failed, ${escapeHtml(lane.budgetMissCount)} budget misses, ${escapeHtml(lane.backpressureLevel || 'none')} pressure</div>
            </li>
          `).join('') || '<li class="xds-muted">No lanes reported.</li>'}
        </ul>
      </section>
    `;
  }

  function renderGates(snapshot) {
    const gates = snapshot.gates || [];
    const token = getCompanionToken();
    const disabled = gateButtonsDisabled() ? ' disabled' : '';
    viewNode.innerHTML = `
      ${renderDiagnostics(snapshot)}
      <section class="xds-card">
        <h2>Companion</h2>
        <form class="xds-companion-form" data-companion-form>
          <label>
            <span>Origin</span>
            <input type="text" value="${escapeHtml(state.companionOrigin)}" readonly>
          </label>
          <label>
            <span>Token</span>
            <input type="password" data-companion-token value="${escapeHtml(token)}" autocomplete="off" placeholder="XTEND_DEV_SURFACE_TOKEN">
          </label>
          <div class="xds-actions">
            <button type="submit">Save Token</button>
            <button type="button" data-companion-check>Check</button>
            <button type="button" data-companion-clear>Clear</button>
          </div>
        </form>
        <div class="xds-row xds-companion-status">
          ${renderBadge(state.companionStatus)}
          <span class="xds-muted">${escapeHtml(state.companionMessage || 'No companion status')}</span>
          <span class="xds-muted">${escapeHtml(state.companionGates.length)} gates</span>
        </div>
      </section>
      <section class="xds-card">
        <h2>Local Gates</h2>
        <div class="xds-grid">
          ${['xtend-dev-surface', 'fabric-telemetry-snapshot', 'rmt-kernel-panic-monitor', 'pr-fast'].map((gateId) => `
            <button type="button" data-gate="${escapeHtml(gateId)}"${disabled}>${escapeHtml(gateId)}</button>
          `).join('')}
        </div>
      </section>
      <section class="xds-card">
        <h2>Runs</h2>
        <ul class="xds-list">
          ${gates.map((gate) => `
            <li>
              <strong>${escapeHtml(gate.gateId)}</strong>
              ${renderBadge(gate.status)}
              <div class="xds-muted">${escapeHtml(gate.runId || gate.id || '')}</div>
              ${gate.artifactUrl ? `<a href="${escapeHtml(state.companionOrigin + gate.artifactUrl)}" target="_blank" rel="noreferrer">artifact</a>` : ''}
            </li>
          `).join('') || '<li class="xds-muted">No gate runs in this snapshot.</li>'}
        </ul>
      </section>
    `;
    Array.from(viewNode.querySelectorAll('[data-gate]')).forEach((button) => {
      button.addEventListener('click', () => runGate(button.getAttribute('data-gate')));
    });
    const form = viewNode.querySelector('[data-companion-form]');
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = form.querySelector('[data-companion-token]');
        const savedToken = setCompanionToken(input && input.value);
        closeGateStream();
        setCompanionState(savedToken ? 'configured' : 'not-configured', savedToken ? 'Token saved' : 'Token missing', []);
        renderDashboard();
      });
    }
    const checkButton = viewNode.querySelector('[data-companion-check]');
    if (checkButton) checkButton.addEventListener('click', verifyCompanion);
    const clearButton = viewNode.querySelector('[data-companion-clear]');
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        setCompanionToken('');
        closeGateStream();
        setCompanionState('not-configured', 'Token missing', []);
        setStatus('Companion token cleared');
        renderDashboard();
      });
    }
  }

  function renderDashboard() {
    const snapshot = state.snapshot || createFallbackSnapshot('No snapshot loaded.');
    if (state.view === 'hydration') renderHydration(snapshot);
    else if (state.view === 'kernel') renderKernel(snapshot);
    else if (state.view === 'fabric') renderFabric(snapshot);
    else if (state.view === 'gates') renderGates(snapshot);
    else renderPerformance(snapshot);
  }

  async function refreshSnapshot() {
    setStatus('Reading XTend DEV API');
    const rawSnapshot = await readInspectedPageSnapshot();
    state.snapshot = await normalizeWithWorker(rawSnapshot);
    setStatus(statusTextForSnapshot(state.snapshot));
    renderDashboard();
  }

  async function runGate(gateId) {
    setStatus(`Queueing ${gateId}`);
    try {
      const handshake = await handshakeCompanion();
      if (!handshake.ok || !handshake.body || handshake.body.ok !== true) {
        setStatus(`${gateId} unauthorized`);
        renderDashboard();
        return;
      }
      connectGateStream();
      const result = await fetchCompanion('/gate-runs', {
        method: 'POST',
        body: { gateId }
      });
      upsertGateRun(result.body);
      setStatus(result.ok ? `${gateId} running` : `${gateId} blocked`);
      setTimeout(() => {
        refreshGateRuns().then(() => {
          if (state.view === 'gates') renderDashboard();
        }).catch(() => {});
      }, 1200);
    } catch (error) {
      if (state.companionStatus !== 'not-configured' && state.companionStatus !== 'unauthorized') {
        setCompanionState('unavailable', error.message, []);
      }
      state.snapshot = state.snapshot || createFallbackSnapshot('No runtime snapshot loaded.');
      upsertGateRun({
        gateId,
        status: 'blocked',
        diagnostics: [{ message: error.message }]
      });
      setStatus(`${gateId} unavailable`);
    }
    renderDashboard();
  }

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.view = button.getAttribute('data-view');
      tabButtons.forEach((entry) => entry.classList.toggle('is-active', entry === button));
      renderDashboard();
    });
  });

  refreshButton.addEventListener('click', refreshSnapshot);
  window.addEventListener('message', (event) => {
    if (!event.data || event.data.source !== 'xtend-dev-surface') return;
    if (event.data.type === 'xds:panel-shown') refreshSnapshot();
  });

  refreshSnapshot();
}());

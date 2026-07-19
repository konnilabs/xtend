export const TESTBENCH_SCHEMA = 'xtend.product.rmt-animation-testbench.v1';
export const XSCALER_PROTOCOL_SCHEMA = 'xtend.xscaler.preflight-response.v1';
export const XSCALER_ATC_SCHEMA = 'xtend.xscaler.atc-handoff.v1';

export const EFFECTS = Object.freeze([
  'fade',
  'crossfade',
  'slide-left',
  'slide-right',
  'slide-up',
  'slide-down',
  'scale',
  'pop',
  'zoom',
  'flip',
  'rotate',
  'expand',
  'collapse',
  'fade-blur',
  'shared-element',
  'layout-flip',
  'none'
]);

export const DURATIONS = Object.freeze([0, 120, 180, 240, 280, 300, 420, 650, 900]);
export const EASINGS = Object.freeze([
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'cubic-bezier(.2,.8,.2,1)',
  'cubic-bezier(.18,.9,.22,1)'
]);
export const INTERRUPTS = Object.freeze(['replace', 'cancel', 'finish']);
export const REDUCED_MOTION = Object.freeze(['fade', 'instant', 'none']);
export const LAYOUT_MODES = Object.freeze(['auto', 'shared-shell', 'content-card']);

export const SURFACES = Object.freeze([
  {
    id: 'dashboard',
    rmtId: 'rmt.animation.testbench.dashboard',
    title: 'Operations Dashboard',
    eyebrow: 'Surface 01',
    tone: 'neutral',
    componentMix: ['x-section', 'x-status', 'x-button'],
    lazy: false,
    metrics: [
      ['Queue depth', '128', 'stable'],
      ['AOT lane budget', '6.4 ms', 'good'],
      ['Hydrated islands', '14', 'good'],
      ['Motion budget', '280 ms', 'warn']
    ],
    sections: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae eros sed sem posuere posuere.',
      'Duis non risus et neque eleifend tincidunt. Suspendisse potenti. Integer at congue justo.',
      'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.'
    ],
    rows: [
      ['Kernel transition lane', 'ready', '88%'],
      ['AnimationEngine facade', 'active', '100%'],
      ['Lazy surface preflight', 'cold', '32%'],
      ['Telemetry fanout', 'warm', '74%']
    ]
  },
  {
    id: 'settings',
    rmtId: 'rmt.animation.testbench.settings',
    title: 'Settings Workbench',
    eyebrow: 'Surface 02',
    tone: 'primary',
    componentMix: ['x-input', 'x-toggle', 'x-select', 'x-status'],
    lazy: true,
    metrics: [
      ['Policy fields', '9', 'good'],
      ['Validation groups', '3', 'stable'],
      ['Reduced motion', 'required', 'good'],
      ['Interrupt policy', 'replace', 'stable']
    ],
    sections: [
      'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.',
      'Praesent finibus, augue et rhoncus consequat, est neque imperdiet mi, vitae gravida quam lectus id quam.',
      'Donec sagittis ligula in urna volutpat, vel posuere lorem tempor.'
    ],
    form: [
      ['Profile name', 'Motion QA profile'],
      ['Sampling window', '12 frames'],
      ['Budget class', 'transition'],
      ['Telemetry mode', 'verbose']
    ]
  },
  {
    id: 'grid',
    rmtId: 'rmt.animation.testbench.grid',
    title: 'Data Grid',
    eyebrow: 'Surface 03',
    tone: 'warning',
    componentMix: ['x-surface-region', 'x-status', 'x-button'],
    lazy: true,
    metrics: [
      ['Rows', '48', 'stable'],
      ['Column groups', '7', 'good'],
      ['Virtual window', '16', 'good'],
      ['CLS delta', '0.004', 'good']
    ],
    sections: [
      'Aliquam erat volutpat. Cras luctus fringilla mi, vel faucibus leo ultrices a.',
      'Curabitur fermentum, erat at pellentesque ultricies, neque sapien finibus nibh, vel dictum est mi vel ante.',
      'Nulla facilisi. In blandit porta lacus, in laoreet ipsum consequat a.'
    ],
    rows: [
      ['TB-1001', 'Crossfade overlap', 'complete', '0.008'],
      ['TB-1002', 'Spring sampling', 'complete', '0.004'],
      ['TB-1003', 'FLIP fallback', 'queued', '0.006'],
      ['TB-1004', 'Reduced motion', 'complete', '0.000'],
      ['TB-1005', 'Blur opt-in', 'active', '0.009']
    ]
  },
  {
    id: 'detail',
    rmtId: 'rmt.animation.testbench.detail',
    title: 'Detail Timeline',
    eyebrow: 'Surface 04',
    tone: 'success',
    componentMix: ['x-section', 'x-status', 'x-toggle'],
    lazy: true,
    metrics: [
      ['Timeline phases', '6', 'good'],
      ['Exit waiters', '0', 'good'],
      ['Fallback count', '0', 'good'],
      ['Budget slack', '42 ms', 'stable']
    ],
    sections: [
      'Morbi a sem ut metus facilisis facilisis. Aenean interdum metus nec mi congue.',
      'Vivamus lacinia, libero eu egestas mollis, enim purus posuere arcu, et finibus erat massa in magna.',
      'Sed congue magna id tortor aliquam, ac porta risus tempor.'
    ],
    events: [
      ['00:00', 'action -> reducer patch'],
      ['00:04', 'animation-engine start'],
      ['00:08', 'exit phase scheduled'],
      ['00:12', 'enter phase materialized'],
      ['00:18', 'telemetry completed']
    ]
  },
  {
    id: 'media',
    rmtId: 'rmt.animation.testbench.media',
    title: 'Media Cards',
    eyebrow: 'Surface 05',
    tone: 'accent',
    componentMix: ['x-surface-region', 'x-button', 'x-status'],
    lazy: true,
    visualAsset: '/src/assets/motion-map.svg',
    metrics: [
      ['Shared targets', '5', 'good'],
      ['Layout keys', '2', 'stable'],
      ['Asset budget', '18 KB', 'good'],
      ['Paint holds', '0', 'good']
    ],
    sections: [
      'Nam eu pharetra risus. In a diam id risus tristique feugiat vitae sed est.',
      'Etiam non blandit mi. Nam ut sapien vitae nibh suscipit porttitor.',
      'Integer laoreet nibh sed tellus condimentum, sit amet laoreet eros volutpat.'
    ],
    cards: [
      ['Shared shell', 'layoutKey testbench-shared-shell'],
      ['Content card', 'layoutKey testbench-content-card'],
      ['Compositor path', 'opacity + transform'],
      ['Fallback path', 'CSS timeout']
    ]
  }
]);

export const INITIAL_SURFACE_ID = 'dashboard';

function text(value) {
  return String(value ?? '');
}

export function escapeHtml(value) {
  return text(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeJsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e');
}

export function findSurface(surfaceId) {
  return SURFACES.find((surface) => surface.id === surfaceId) || SURFACES[0];
}

export function surfaceSummaries() {
  return SURFACES.map((surface, index) => ({
    id: surface.id,
    rmtId: surface.rmtId,
    title: surface.title,
    eyebrow: surface.eyebrow,
    tone: surface.tone,
    componentMix: surface.componentMix.slice(),
    lazy: surface.lazy,
    index
  }));
}

export function createRuntimeTransition({ from, to, effect, durationMs, easing, interrupt, reducedMotion, layoutMode }) {
  const fromSurface = typeof from === 'string' ? findSurface(from) : from;
  const toSurface = typeof to === 'string' ? findSurface(to) : to;
  const normalizedEffect = EFFECTS.includes(effect) ? effect : 'fade';
  const layoutKey = layoutMode === 'content-card'
    ? 'testbench-content-card'
    : (layoutMode === 'shared-shell' || normalizedEffect === 'shared-element' || normalizedEffect === 'layout-flip'
      ? 'testbench-shared-shell'
      : '');
  return {
    id: `runtime.${fromSurface.id}.to.${toSurface.id}.${normalizedEffect}`,
    name: `Runtime ${fromSurface.id} to ${toSurface.id}`,
    trigger: {
      kind: 'action',
      id: `rmt.animation.testbench.runtime.${fromSurface.id}.to.${toSurface.id}`
    },
    from: [fromSurface.rmtId],
    to: [toSurface.rmtId],
    animation: `rmt.animation.testbench.${normalizedEffect.replace(/-([a-z])/gu, (_, char) => char.toUpperCase())}`,
    effect: normalizedEffect,
    durationMs: Math.max(0, Math.min(Math.round(Number(durationMs) || 0), 3000)),
    easing: EASINGS.includes(easing) ? easing : 'ease-out',
    lane: 'transition',
    layoutKey,
    interrupt: INTERRUPTS.includes(interrupt) ? interrupt : 'replace',
    reducedMotion: REDUCED_MOTION.includes(reducedMotion) ? reducedMotion : 'fade',
    timeline: normalizedEffect === 'crossfade'
      ? { mode: 'parallel', steps: [{ kind: 'parallel', text: 'parallel enter exit', phase: null, delayMs: 0, durationMs: null }] }
      : null,
    phasing: normalizedEffect === 'crossfade' ? 'overlap' : 'serial'
  };
}

export function createXScalerPreflight(surfaceId, reason = 'navigation') {
  const surface = findSurface(surfaceId);
  return {
    schema: XSCALER_PROTOCOL_SCHEMA,
    protocol: 'xscaler',
    requestId: `xscaler:testbench:preflight:${surface.id}:${reason}`,
    accepted: true,
    ok: true,
    surface: surface.id,
    compatibility: {
      ssr: 'compatible',
      remoteSurfacePlan: 'required',
      xtensionDeployment: 'allowed'
    },
    requiredAnchors: ['#schemas', '#ssr-kompatibilitaet', '#xtensions-deployment'],
    remoteSurfacePlan: {
      schema: 'xtend.xscaler.remote-surface-plan.v1',
      protocol: 'xscaler',
      surface: surface.id,
      surfaceId: `remoteSurface:${surface.id}`,
      owner: 'rmt-animation-testbench',
      origin: 'https://testbench.xtend.invalid',
      integrity: {
        algorithm: 'sha256',
        digest: 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
      },
      fallbackSurface: 'dashboard',
      lanes: [{ lane: 'transition', target: `shell.slot:${surface.id}` }],
      ssr: { mode: 'preflight-only', networkDuringRender: false },
      runtimeBoundary: {
        remoteRuntimeExecution: false,
        kernelRemoteExecution: false,
        networkRequiredByKernel: false
      }
    },
    rmtSurface: surface.rmtId,
    reason,
    networkDuringRender: false,
    lazyAfterHydration: true,
    cacheKey: `xscaler:surface:${surface.id}:v1`,
    atc: {
      schema: XSCALER_ATC_SCHEMA,
      protocol: 'xscaler',
      surfaceId: `remoteSurface:${surface.id}`,
      sessionId: `xscaler:testbench:${surface.id}`,
      handoffSignal: 'attach',
      lifecycleState: 'client-hydrated-navigation',
      accepted: true,
      ok: true,
      status: 'ready',
      fallback: { surface: 'dashboard' },
      runtimeBoundary: {
        remoteRuntimeExecution: false,
        kernelRemoteExecution: false,
        networkRequiredByHandoff: false
      },
      diagnostics: [],
      route: `/api/lazy-surface/${surface.id}`,
      mode: 'protocol-lazy',
      activation: 'client-hydrated-navigation',
      schedulerLane: 'transition',
      componentMix: surface.componentMix.slice()
    },
    rejection: null,
    diagnostics: []
  };
}

export function createResumePayload({ token, compileResult, ssrResult, activeSurfaceId }) {
  return {
    schema: 'xtend.product.rmt-animation-testbench.resume-payload.v1',
    token,
    activeSurfaceId,
    generatedAt: new Date().toISOString(),
    hydration: ssrResult && ssrResult.hydration || null,
    response: ssrResult && ssrResult.response ? {
      kind: ssrResult.response.kind,
      ok: ssrResult.response.ok,
      status: ssrResult.response.status,
      executionMode: ssrResult.response.executionMode,
      adapterKind: ssrResult.response.adapterKind,
      rootId: ssrResult.response.rootId
    } : null,
    rmt: {
      ok: Boolean(compileResult && compileResult.ok),
      animationEngineSchema: compileResult && compileResult.orchestrationArtifacts && compileResult.orchestrationArtifacts.animationEngine && compileResult.orchestrationArtifacts.animationEngine.schema || null,
      surfaceTransitionSchema: compileResult && compileResult.orchestrationArtifacts && compileResult.orchestrationArtifacts.transitions && compileResult.orchestrationArtifacts.transitions.schema || null
    }
  };
}

function renderMetric([label, value, state]) {
  return `
    <div class="tb-metric" data-state="${escapeHtml(state)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderLorem(surface) {
  return surface.sections.map((section) => `<p>${escapeHtml(section)}</p>`).join('');
}

function renderDashboard(surface) {
  return `
    <aside class="tb-sidebar" data-layout-key="testbench-shared-shell">
      <x-status type="info" label="Kernel lane" message="transition"></x-status>
      <nav class="tb-nav-list" aria-label="Surface list">
        ${SURFACES.map((entry) => `<span class="${entry.id === surface.id ? 'is-active' : ''}">${escapeHtml(entry.title)}</span>`).join('')}
      </nav>
    </aside>
    <main class="tb-main">
      <div class="tb-metrics">${surface.metrics.map(renderMetric).join('')}</div>
      <x-section label="Dashboard copy" layout="column" bordered>${renderLorem(surface)}</x-section>
      <section class="tb-table-shell" aria-label="Motion rows">
        ${surface.rows.map((row) => `
          <div class="tb-row">
            <span>${escapeHtml(row[0])}</span>
            <b>${escapeHtml(row[1])}</b>
            <em>${escapeHtml(row[2])}</em>
          </div>
        `).join('')}
      </section>
    </main>
  `;
}

function renderSettings(surface) {
  return `
    <aside class="tb-sidebar tb-sidebar-alt" data-layout-key="testbench-shared-shell">
      <x-status type="success" label="Policy" message="server-prehydrated"></x-status>
      <div class="tb-toggle-stack">
        <x-toggle label="View Transitions API"></x-toggle>
        <x-toggle label="FLIP fallback"></x-toggle>
        <x-toggle label="Telemetry"></x-toggle>
      </div>
    </aside>
    <main class="tb-main">
      <div class="tb-metrics">${surface.metrics.map(renderMetric).join('')}</div>
      <section class="tb-form-grid">
        ${surface.form.map((field) => `
          <label class="tb-field">
            <span>${escapeHtml(field[0])}</span>
            <x-input value="${escapeHtml(field[1])}"></x-input>
          </label>
        `).join('')}
        <x-select label="Default policy" value="fade">
          <option value="fade">fade</option>
          <option value="instant">instant</option>
          <option value="none">none</option>
        </x-select>
      </section>
      <x-section label="Settings copy" layout="column">${renderLorem(surface)}</x-section>
    </main>
  `;
}

function renderGrid(surface) {
  return `
    <aside class="tb-sidebar tb-sidebar-grid" data-layout-key="testbench-shared-shell">
      <x-status type="warning" label="Grid load" message="lazy surface"></x-status>
      <div class="tb-mini-bars">
        ${surface.metrics.map((metric, index) => `<span style="--bar:${28 + index * 16}%">${escapeHtml(metric[0])}</span>`).join('')}
      </div>
    </aside>
    <main class="tb-main">
      <div class="tb-metrics">${surface.metrics.map(renderMetric).join('')}</div>
      <section class="tb-data-grid" aria-label="Animation evidence rows">
        <div class="tb-grid-head"><span>ID</span><span>Case</span><span>Status</span><span>CLS</span></div>
        ${surface.rows.map((row) => `<div class="tb-grid-row"><span>${escapeHtml(row[0])}</span><b>${escapeHtml(row[1])}</b><em>${escapeHtml(row[2])}</em><span>${escapeHtml(row[3])}</span></div>`).join('')}
      </section>
      <x-section label="Grid copy" layout="column">${renderLorem(surface)}</x-section>
    </main>
  `;
}

function renderDetail(surface) {
  return `
    <aside class="tb-sidebar tb-sidebar-detail" data-layout-key="testbench-shared-shell">
      <x-status type="success" label="Timeline" message="phased"></x-status>
      <div class="tb-timeline-mini">
        ${surface.events.map((event) => `<span><b>${escapeHtml(event[0])}</b>${escapeHtml(event[1])}</span>`).join('')}
      </div>
    </aside>
    <main class="tb-main">
      <div class="tb-metrics">${surface.metrics.map(renderMetric).join('')}</div>
      <section class="tb-timeline">
        ${surface.events.map((event) => `
          <article data-layout-key="testbench-content-card">
            <time>${escapeHtml(event[0])}</time>
            <strong>${escapeHtml(event[1])}</strong>
            <p>Phasellus tincidunt mi nec fermentum finibus. Etiam a nibh eget neque dignissim congue.</p>
          </article>
        `).join('')}
      </section>
      <x-section label="Detail copy" layout="column">${renderLorem(surface)}</x-section>
    </main>
  `;
}

function renderMedia(surface) {
  return `
    <aside class="tb-sidebar tb-sidebar-media" data-layout-key="testbench-shared-shell">
      <img class="tb-motion-map" src="${escapeHtml(surface.visualAsset)}" alt="Motion lane map">
      <x-status type="info" label="Media" message="asset backed"></x-status>
    </aside>
    <main class="tb-main">
      <div class="tb-metrics">${surface.metrics.map(renderMetric).join('')}</div>
      <section class="tb-card-grid">
        ${surface.cards.map((card) => `
          <article class="tb-media-card" data-layout-key="testbench-content-card">
            <span>${escapeHtml(card[0])}</span>
            <strong>${escapeHtml(card[1])}</strong>
            <p>Quisque luctus posuere dolor, vitae consequat ipsum viverra non.</p>
          </article>
        `).join('')}
      </section>
      <x-section label="Media copy" layout="column">${renderLorem(surface)}</x-section>
    </main>
  `;
}

export function renderSurfaceHtml(surfaceInput, options = {}) {
  const surface = typeof surfaceInput === 'string' ? findSurface(surfaceInput) : surfaceInput;
  const active = options.active !== false;
  const body = surface.id === 'settings'
    ? renderSettings(surface)
    : (surface.id === 'grid'
      ? renderGrid(surface)
      : (surface.id === 'detail'
        ? renderDetail(surface)
        : (surface.id === 'media' ? renderMedia(surface) : renderDashboard(surface))));
  return `
    <section
      id="surface-${escapeHtml(surface.id)}"
      class="tb-surface${active ? ' is-active' : ''}"
      data-surface-id="${escapeHtml(surface.id)}"
      data-maraca-surface="${escapeHtml(surface.rmtId)}"
      data-rmt-ssr-surface="${escapeHtml(surface.rmtId)}"
      data-lazy-state="${surface.lazy && !active ? 'unloaded' : 'loaded'}"
      data-tone="${escapeHtml(surface.tone)}"
      aria-label="${escapeHtml(surface.title)}"
    >
      <header class="tb-surface-header">
        <span>${escapeHtml(surface.eyebrow)}</span>
        <h1>${escapeHtml(surface.title)}</h1>
        <x-status type="info" label="Component mix" message="${escapeHtml(surface.componentMix.join(', '))}"></x-status>
      </header>
      <div class="tb-surface-body">${body}</div>
    </section>
  `;
}

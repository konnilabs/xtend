const IWEBKIT_SRC = '/dist/xtensions/vanilla-legacy-lab/iwebkit/index.html';
const SANDBOX_EVENT_SCHEMA = 'xtend.local.iwebkit5.sandbox-event.v1';
const HOST_UPDATE_SCHEMA = 'xtend.local.iwebkit5.host-update.v1';

function safeText(value) {
  return String(value ?? '');
}

function resultFor(operation, status, options = {}, metadata = {}) {
  const timestamp = new Date().toISOString();
  return {
    schema: 'xtend.xtensions.host-controller-result.v1',
    operation,
    ok: status === 'mounted' || status === 'ok' || status === 'resumed',
    status,
    hostId: options.hostId || null,
    surfaceId: options.surfaceId || null,
    timestamp,
    lifecycleRecord: {
      schema: 'xtend.local.vanilla-legacy-lab.lifecycle.v1',
      framework: 'vanilla',
      surfaceId: options.surfaceId || 'vanilla-legacy-lab',
      operation,
      status,
      metadata,
      timestamp
    },
    cleanupRecords: [],
    diagnostics: [],
    metadata
  };
}

function renderCooperativeMarkup(props) {
  const queue = props.exceptionQueue || [];
  const blockers = queue.filter((entry) => entry.severity === 'blocker').length;
  return `
    <style>
      :host {
        all: initial;
        display: block;
        font-family: Arial, Helvetica, sans-serif;
        color: #111827;
      }
      .vanilla-panel {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 6px;
        align-items: center;
        min-height: 54px;
        padding: 6px;
        border-bottom: 1px solid #aab6c4;
        background: #f4f7fa;
        box-sizing: border-box;
      }
      .vanilla-panel span,
      .vanilla-panel b,
      .vanilla-panel small {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 11px;
      }
      .vanilla-panel b {
        margin-bottom: 2px;
        font-size: 12px;
      }
      button {
        height: 24px;
        min-width: 84px;
        padding: 0 8px;
        border: 1px solid #6b7d90;
        border-radius: 0;
        background: #e8eef5;
        color: #111827;
        font: 11px Arial, Helvetica, sans-serif;
        cursor: pointer;
      }
      button:focus-visible {
        outline: 2px solid #214f86;
        outline-offset: 1px;
      }
    </style>
    <div class="vanilla-panel" data-vanilla-boundary="shadow-root">
      <div>
        <b>Vanilla Boundary</b>
        <span>Seed ${safeText(props.seed)} / ${safeText(props.company)}</span>
        <small>${queue.length} Legacy-Meldungen, ${blockers} Blocker</small>
      </div>
      <button type="button" data-vanilla-intent="cooperative">Intent</button>
    </div>
  `;
}

function createShellIntentEvent(detail) {
  return new CustomEvent('xtend-command', {
    bubbles: true,
    composed: true,
    detail
  });
}

export function createVanillaLegacyLab(options = {}) {
  let container = null;
  let cooperativeHost = null;
  let cooperativeRoot = null;
  let iframe = null;
  let sandboxPort = null;
  let currentProps = {};
  let frameLoadCount = 0;
  let messageCount = 0;
  const lifecycle = [];
  const allowedSandboxEventTypes = new Set(['ready', 'navigation-intent', 'user-intent', 'diagnostic']);

  function push(operation, status, metadata = {}) {
    const result = resultFor(operation, status, options, metadata);
    lifecycle.push(result.lifecycleRecord);
    if (typeof options.emit === 'function') {
      options.emit(`erp.vanilla.legacy.${operation}`, result.lifecycleRecord);
    }
    return result;
  }

  function dispatchShellIntent(intent) {
    if (!container) return;
    container.dispatchEvent(createShellIntentEvent({
      schema: 'xtend.local.vanilla-legacy-lab.intent.v1',
      command: 'erp.shell.legacyNavigationIntent',
      sourceId: 'vanilla-legacy-lab',
      href: intent.href || '',
      linkText: intent.text || intent.label || '',
      seed: currentProps.seed || ''
    }));
  }

  function renderCooperative() {
    if (!cooperativeHost) return;
    if (!cooperativeRoot && typeof cooperativeHost.attachShadow === 'function') {
      cooperativeRoot = cooperativeHost.attachShadow({ mode: 'open' });
    }
    const target = cooperativeRoot || cooperativeHost;
    target.innerHTML = renderCooperativeMarkup(currentProps);
    const button = target.querySelector('[data-vanilla-intent]');
    if (button) {
      button.addEventListener('click', () => {
        dispatchShellIntent({
          href: '#vanilla-cooperative',
          text: 'Vanilla Boundary Intent'
        });
      });
    }
  }

  function postUpdateToIframe(reason = 'update') {
    if (!iframe || !iframe.contentWindow) return;
    try {
      iframe.contentWindow.postMessage({
        schema: HOST_UPDATE_SCHEMA,
        reason,
        seed: currentProps.seed || '',
        company: currentProps.company || '',
        exceptionCount: (currentProps.exceptionQueue || []).length
      }, '*');
    } catch {
      // A sandboxed frame may not be ready yet; the next update/load will retry.
    }
  }

  function handleSandboxEnvelope(data, metadata = {}) {
    if (data.schema !== SANDBOX_EVENT_SCHEMA || !allowedSandboxEventTypes.has(data.type)) return;
    messageCount += 1;
    if (container) {
      container.dataset.iwebkitLastEvent = data.type;
      container.dataset.iwebkitMessageCount = String(messageCount);
      container.dataset.iwebkitTransport = metadata.transport || 'window-message';
    }
    if (typeof options.emit === 'function') {
      options.emit('erp.vanilla.iwebkit.intent', {
        schema: 'xtend.local.vanilla-legacy-lab.iwebkit-intent.v1',
        type: data.type,
        payload: data.payload || {},
        transport: metadata.transport || 'window-message',
        seed: currentProps.seed || ''
      });
    }
    if (data.type === 'navigation-intent' || data.type === 'user-intent') {
      dispatchShellIntent({
        href: data.payload && data.payload.href || data.href || '',
        text: data.payload && data.payload.text || data.label || 'iWebKit Intent'
      });
    }
  }

  function handleSandboxMessage(event) {
    const data = event.data || {};
    if (data.schema !== SANDBOX_EVENT_SCHEMA || !allowedSandboxEventTypes.has(data.type)) return;
    const fromCurrentFrame = iframe && event.source === iframe.contentWindow;
    const fromOpaqueSandbox = event.origin === 'null';
    if (!fromCurrentFrame && !fromOpaqueSandbox) return;
    handleSandboxEnvelope(data, { transport: 'window-message', origin: event.origin || '' });
  }

  function attachSandboxPort(reason = 'attach-channel') {
    if (!iframe || !iframe.contentWindow || typeof MessageChannel !== 'function') return;
    if (sandboxPort) {
      postUpdateToIframe(reason);
      return;
    }
    const channel = new MessageChannel();
    sandboxPort = channel.port1;
    sandboxPort.onmessage = (event) => {
      handleSandboxEnvelope(event.data || {}, { transport: 'message-channel' });
    };
    if (typeof sandboxPort.start === 'function') sandboxPort.start();
    iframe.contentWindow.postMessage({
      schema: HOST_UPDATE_SCHEMA,
      reason,
      seed: currentProps.seed || '',
      company: currentProps.company || '',
      exceptionCount: (currentProps.exceptionQueue || []).length,
      channel: 'iwebkit-sandbox-port'
    }, '*', [channel.port2]);
  }

  function mountDom(target) {
    target.innerHTML = `
      <div class="vanilla-legacy-lab" data-vanilla-status="mounting">
        <div class="vanilla-cooperative-host" data-vanilla-boundary-host></div>
        <div class="vanilla-iwebkit-frame-shell">
          <div class="vanilla-iwebkit-title">
            <span>iWebKit 5 iframe-sandbox</span>
            <b>allow-scripts</b>
          </div>
          <iframe
            title="iWebKit 5 Legacy Sandbox Proof"
            data-iwebkit-sandbox="true"
            sandbox="allow-scripts"
            referrerpolicy="no-referrer"
          ></iframe>
        </div>
      </div>
    `;
    cooperativeHost = target.querySelector('[data-vanilla-boundary-host]');
    iframe = target.querySelector('iframe[data-iwebkit-sandbox="true"]');
    if (iframe) {
      iframe.addEventListener('load', () => {
        frameLoadCount += 1;
        sandboxPort = null;
        if (container) {
          container.dataset.iwebkitSandbox = 'true';
          container.dataset.iwebkitFrameLoads = String(frameLoadCount);
        }
        attachSandboxPort('iframe-load');
      });
      iframe.src = `${IWEBKIT_SRC}?seed=${encodeURIComponent(currentProps.seed || '')}`;
    }
    renderCooperative();
  }

  return {
    schema: 'xtend.xtensions.host-controller.v1',
    mount(target, initialProps = {}, mountOptions = {}) {
      container = target;
      currentProps = initialProps;
      container.dataset.xtensionStatus = 'mounted';
      container.dataset.xtensionFramework = 'vanilla';
      container.dataset.vanillaStatus = 'mounted';
      container.dataset.iwebkitSandbox = 'true';
      container.dataset.iwebkitFrameLoads = '0';
      window.addEventListener('message', handleSandboxMessage);
      mountDom(container);
      return push('mount', 'mounted', {
        ...mountOptions,
        isolation: {
          cooperative: 'shadow-root',
          legacy: 'iframe-sandbox'
        }
      });
    },
    adopt(target, initialProps = {}, resumeContext = {}) {
      container = target;
      currentProps = initialProps;
      cooperativeHost = container.querySelector('[data-vanilla-boundary-host]');
      iframe = container.querySelector('iframe[data-iwebkit-sandbox="true"]');
      window.addEventListener('message', handleSandboxMessage);
      if (iframe) {
        frameLoadCount = Math.max(1, Number(container.dataset.iwebkitFrameLoads || 0));
        container.dataset.iwebkitFrameLoads = String(frameLoadCount);
        iframe.addEventListener('load', () => {
          frameLoadCount += 1;
          sandboxPort = null;
          container.dataset.iwebkitFrameLoads = String(frameLoadCount);
          attachSandboxPort('iframe-reload');
        });
        attachSandboxPort('server-resume');
      }
      const iframeFallback = container.querySelector('[data-xtension-fallback="vanilla-legacy-lab-iwebkit"]');
      if (iframe && iframeFallback) {
        iframeFallback.hidden = true;
        iframeFallback.setAttribute('aria-hidden', 'true');
        iframeFallback.dataset.activationStatus = 'runtime-active';
      }
      container.dataset.xtensionStatus = 'resumed';
      container.dataset.xtensionFramework = 'vanilla';
      container.dataset.vanillaStatus = 'host-activated';
      container.dataset.iwebkitSandbox = String(Boolean(iframe));
      return { ...push('adopt', 'resumed', resumeContext), status: 'host_activated', nodeIdentityPreserved: true, generation: resumeContext.generation || null };
    },
    update(signal = {}) {
      currentProps = signal.props || signal || currentProps;
      renderCooperative();
      if (sandboxPort) postUpdateToIframe(signal.reason || 'update');
      else attachSandboxPort(signal.reason || 'update');
      return push('update', 'ok', {
        seed: currentProps.seed || '',
        iframeReloads: frameLoadCount
      });
    },
    suspend(reason = 'host-policy') {
      if (container) container.dataset.xtensionSuspended = 'true';
      postUpdateToIframe(`suspend:${reason}`);
      return push('suspend', 'ok', { reason });
    },
    resume(reason = 'host-policy') {
      if (container) container.dataset.xtensionSuspended = 'false';
      renderCooperative();
      postUpdateToIframe(`resume:${reason}`);
      return push('resume', 'resumed', { reason });
    },
    reportError(error, metadata = {}) {
      if (container) container.dataset.xtensionStatus = 'degraded';
      return push('reportError', 'degraded', {
        ...metadata,
        message: error && error.message ? error.message : String(error)
      });
    },
    unmount(reason = 'host-dispose') {
      window.removeEventListener('message', handleSandboxMessage);
      if (sandboxPort) sandboxPort.close();
      if (container) {
        container.dataset.xtensionStatus = 'unmounted';
        container.innerHTML = '';
      }
      cooperativeHost = null;
      cooperativeRoot = null;
      iframe = null;
      sandboxPort = null;
      return push('unmount', 'ok', { reason });
    },
    snapshot() {
      return {
        schema: 'xtend.local.vanilla-legacy-lab.snapshot.v1',
        seed: currentProps.seed || '',
        frameLoadCount,
        messageCount,
        sandbox: 'allow-scripts',
        lifecycle: lifecycle.slice()
      };
    },
    getLifecycleRecords() {
      return lifecycle.slice();
    }
  };
}

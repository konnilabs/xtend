import {
  XTENSION_DEFINITIONS,
  applyXTensionBootConfig,
  normalizeXTensionBootConfig,
  readXTensionBootConfig,
  writeXTensionBootConfig
} from './xtension-host.mjs';

let nativeComponentsPromise = null;

function now() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
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

function createOption(value, label) {
  return createElement('option', {
    text: label,
    attrs: { value }
  });
}

function cloneConfig(config) {
  const normalized = normalizeXTensionBootConfig(config);
  return {
    enabled: { ...normalized.enabled },
    enabledKeys: normalized.enabledKeys.slice(),
    disabledKeys: normalized.disabledKeys.slice()
  };
}

function summarizeDraft(draft) {
  const enabledKeys = XTENSION_DEFINITIONS
    .map((entry) => entry.key)
    .filter((key) => draft.enabled[key] !== false);
  const disabledKeys = XTENSION_DEFINITIONS
    .map((entry) => entry.key)
    .filter((key) => draft.enabled[key] === false);
  return normalizeXTensionBootConfig({
    enabledKeys,
    disabledKeys
  });
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

async function ensureNativeComponents() {
  if (!nativeComponentsPromise) {
    nativeComponentsPromise = Promise.all([
      import('/components/xdialog.js'),
      import('/components/xbutton.js'),
      import('/components/xselect.js')
    ]).then(async () => {
      await Promise.all([
        customElements.whenDefined('x-dialog'),
        customElements.whenDefined('x-button'),
        customElements.whenDefined('x-select')
      ]);
      return true;
    });
  }
  return nativeComponentsPromise;
}

function setXStateValue(xstate, key, value) {
  if (xstate && typeof xstate.set === 'function') xstate.set(key, value);
}

function dispatchRmtCommand(target, command, label, extra = {}) {
  target.dispatchEvent(new CustomEvent('xtend-command', {
    bubbles: true,
    composed: true,
    cancelable: true,
    detail: {
      schema: 'xtend.rmt.command.v1',
      command,
      payload: {
        label,
        source: label,
        ...extra
      }
    }
  }));
}

function renderSummary(dialog, draft) {
  const summary = dialog.querySelector('.erp-xtension-control-summary');
  const config = summarizeDraft(draft);
  if (!summary) return config;
  summary.replaceChildren(
    createElement('div', {}, [
      createElement('span', { text: 'Boot aktiv' }),
      createElement('b', { text: String(config.enabledCount) })
    ]),
    createElement('div', {}, [
      createElement('span', { text: 'Placeholder' }),
      createElement('b', { text: String(config.disabledCount) })
    ]),
    createElement('div', {}, [
      createElement('span', { text: 'Persistenz' }),
      createElement('b', { text: 'LocalStorage' })
    ])
  );
  return config;
}

function syncSelectValues(dialog, draft) {
  XTENSION_DEFINITIONS.forEach((definition) => {
    const select = dialog.querySelector(`[data-xtension-control-select="${definition.key}"]`);
    if (!select) return;
    const value = draft.enabled[definition.key] === false ? 'disabled' : 'enabled';
    select.setAttribute('value', value);
    select.value = value;
  });
}

function renderRows(dialog, container, draft) {
  container.replaceChildren();
  XTENSION_DEFINITIONS.forEach((definition) => {
    const value = draft.enabled[definition.key] === false ? 'disabled' : 'enabled';
    const select = document.createElement('x-select');
    select.setAttribute('label', definition.label);
    select.setAttribute('density', 'dense');
    select.setAttribute('value', value);
    select.setAttribute('data-xtension-control-select', definition.key);
    select.append(
      createOption('enabled', 'booten'),
      createOption('disabled', 'nicht booten')
    );
    select.addEventListener('select-changed', (event) => {
      draft.enabled[definition.key] = event.detail.value !== 'disabled';
      dialog.__xtendDraft = draft;
      renderSummary(dialog, draft);
    });
    const row = createElement('div', {
      className: 'erp-xtension-control-row',
      attrs: {
        'data-xtension-control-row': definition.key,
        'data-framework': definition.framework
      }
    }, [
      createElement('div', {}, [
        createElement('b', { text: definition.label }),
        createElement('span', { text: `${definition.framework} / ${definition.key}` })
      ]),
      select
    ]);
    container.append(row);
  });
}

function ensureDialog(options = {}) {
  const host = document.getElementById('erp-xtension-control-dialog-host') || document.body.appendChild(
    createElement('div', {
      id: 'erp-xtension-control-dialog-host',
      attrs: {
        'data-rmt-ssr-surface': 'erp.shell.xtensionControlDialog',
        'data-rmt-lazy-modal': 'xtension-control',
        'data-lazy-state': 'created-client'
      }
    })
  );
  host.hidden = false;
  host.dataset.lazyState = 'loaded';

  let dialog = document.getElementById('erp-xtension-control-dialog');
  if (dialog) return {
    host,
    dialog,
    content: dialog.querySelector('.erp-xtension-control-content'),
    rows: dialog.querySelector('.erp-xtension-control-rows'),
    summary: dialog.querySelector('.erp-xtension-control-summary')
  };

  dialog = document.createElement('x-dialog');
  dialog.id = 'erp-xtension-control-dialog';
  dialog.className = 'erp-xtension-control-dialog';
  dialog.setAttribute('overlay', '');
  dialog.setAttribute('title', 'XTension Teststeuerung');
  dialog.setAttribute('width', 'min(880px, calc(100vw - 32px))');
  dialog.setAttribute('height', 'min(78vh, 700px)');
  dialog.dataset.rmtIntent = 'xtension-control-dialog';

  const summary = createElement('section', {
    className: 'erp-xtension-control-summary',
    attrs: { 'aria-live': 'polite' }
  });
  const rows = createElement('section', {
    className: 'erp-xtension-control-rows',
    attrs: { 'aria-label': 'XTension Boot Auswahl' }
  });
  const content = createElement('section', {
    className: 'erp-xtension-control-content'
  }, [
    createElement('div', { className: 'erp-surface-info-head' }, [
      createElement('div', {}, [
        createElement('strong', { text: 'Boot-Auswahl fuer XTensions' }),
        createElement('span', { text: 'Deaktivierte XTensions bleiben als native Placeholder sichtbar und werden nicht importiert.' })
      ]),
      createElement('code', { text: 'LocalStorage' })
    ]),
    summary,
    rows
  ]);

  const enableAll = createActionButton('erp-xtension-control-enable-all', 'Alle booten', 'secondary');
  const disableAll = createActionButton('erp-xtension-control-disable-all', 'Alle stoppen', 'secondary');
  const apply = createActionButton('erp-xtension-control-apply', 'Uebernehmen', 'primary');
  const close = createActionButton('erp-xtension-control-close', 'Schliessen', 'secondary');
  dialog.append(content, enableAll, disableAll, apply, close);
  host.append(dialog);

  enableAll.addEventListener('click', () => {
    const draft = dialog.__xtendDraft;
    XTENSION_DEFINITIONS.forEach((definition) => {
      draft.enabled[definition.key] = true;
    });
    dialog.__xtendDraft = draft;
    syncSelectValues(dialog, draft);
    renderSummary(dialog, draft);
  });

  disableAll.addEventListener('click', () => {
    const draft = dialog.__xtendDraft;
    XTENSION_DEFINITIONS.forEach((definition) => {
      draft.enabled[definition.key] = false;
    });
    dialog.__xtendDraft = draft;
    syncSelectValues(dialog, draft);
    renderSummary(dialog, draft);
  });

  apply.addEventListener('click', async () => {
    const draft = dialog.__xtendDraft || cloneConfig(readXTensionBootConfig());
    const config = writeXTensionBootConfig(summarizeDraft(draft));
    const snapshot = window.__XTendResumeDemo && window.__XTendResumeDemo.lastSnapshot || options.snapshot;
    const result = await applyXTensionBootConfig(snapshot, config, {
      reason: 'xtension-control-dialog'
    });
    window.__XTendResumeDemo.xtensionControlLastApply = result;
    setXStateValue(options.xstate, 'erp.shell.xtensionControlDialog.configStatus', 'applied');
    setXStateValue(options.xstate, 'erp.shell.xtensionControlDialog.enabledCount', config.enabledCount);
    setXStateValue(options.xstate, 'erp.shell.xtensionControlDialog.disabledCount', config.disabledCount);
    dialog.__xtendDraft = cloneConfig(config);
    syncSelectValues(dialog, dialog.__xtendDraft);
    renderSummary(dialog, dialog.__xtendDraft);
    dispatchRmtCommand(apply, 'erp.shell.applyXtensionControl', 'button-apply', {
      enabledCount: config.enabledCount,
      disabledCount: config.disabledCount
    });
    if (typeof options.onApply === 'function') options.onApply(config, result);
    document.dispatchEvent(new CustomEvent('erp-demo:xtension-control-applied', {
      detail: { config, result }
    }));
  });

  close.addEventListener('click', () => {
    dispatchRmtCommand(close, 'erp.shell.closeXtensionControl', 'button-close');
    if (typeof dialog.close === 'function') dialog.close({ source: 'button' });
  });

  dialog.addEventListener('dialog-closed', (event) => {
    host.hidden = true;
    host.dataset.lazyState = 'loaded-closed';
    window.__XTendResumeDemo.xtensionControlDialogOpen = false;
    setXStateValue(options.xstate, 'erp.shell.xtensionControlDialog.open', false);
    setXStateValue(options.xstate, 'erp.shell.xtensionControlDialog.hidden', true);
    setXStateValue(options.xstate, 'erp.shell.xtensionControlDialog.configStatus', 'closed');
    if (typeof options.onClose === 'function') {
      options.onClose(event && event.detail && event.detail.source || 'dialog-closed');
    }
    document.dispatchEvent(new CustomEvent('erp-demo:xtension-control-closed', {
      detail: { source: event && event.detail && event.detail.source || 'dialog-closed' }
    }));
  });

  return { host, dialog, content, rows, summary };
}

function renderDialogState(dialog, draft) {
  dialog.__xtendDraft = cloneConfig(draft);
  const rows = dialog.querySelector('.erp-xtension-control-rows');
  renderSummary(dialog, dialog.__xtendDraft);
  if (rows) {
    renderRows(dialog, rows, dialog.__xtendDraft);
  }
}

export async function openXTensionControlDialog(options = {}) {
  const metrics = options.metrics || {};
  metrics.xtensionControlDialogOpenRequestedAt = metrics.xtensionControlDialogOpenRequestedAt || now();
  await ensureNativeComponents();
  metrics.xtensionControlDialogLoadedAt = now();

  const { dialog } = ensureDialog(options);
  renderDialogState(dialog, cloneConfig(readXTensionBootConfig()));

  const config = summarizeDraft(dialog.__xtendDraft);
  window.__XTendResumeDemo.xtensionControlDialogLoaded = true;
  window.__XTendResumeDemo.xtensionControlDialogOpen = true;
  window.__XTendResumeDemo.xtensionBootConfig = config;
  setXStateValue(options.xstate, 'erp.shell.xtensionControlDialog.open', true);
  setXStateValue(options.xstate, 'erp.shell.xtensionControlDialog.loaded', true);
  setXStateValue(options.xstate, 'erp.shell.xtensionControlDialog.hidden', false);
  setXStateValue(options.xstate, 'erp.shell.xtensionControlDialog.configStatus', 'editing');
  setXStateValue(options.xstate, 'erp.shell.xtensionControlDialog.enabledCount', config.enabledCount);
  setXStateValue(options.xstate, 'erp.shell.xtensionControlDialog.disabledCount', config.disabledCount);

  if (typeof dialog.open === 'function') dialog.open();
  else dialog.setAttribute('open', '');

  metrics.xtensionControlDialogOpenedAt = now();
  document.dispatchEvent(new CustomEvent('erp-demo:xtension-control-opened', {
    detail: { config, reason: options.reason || 'manual' }
  }));
  return config;
}

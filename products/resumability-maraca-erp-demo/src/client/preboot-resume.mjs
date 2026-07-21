import { createRmtResumeRuntime } from '/xtendrmt/rmt-resume-runtime.js';

function exposeBootError(kind, value) {
  const message = value && value.message ? value.message : String(value || 'unknown');
  document.documentElement.dataset.erpBootErrorKind = kind;
  document.documentElement.dataset.erpBootError = message.slice(0, 500);
}

window.addEventListener('error', (event) => exposeBootError('error', event.error || event.message));
window.addEventListener('unhandledrejection', (event) => exposeBootError('unhandledrejection', event.reason));

const maracaEntry = document.getElementById('xtend-maraca-entry');
if (maracaEntry) {
  maracaEntry.addEventListener('load', () => {
    document.documentElement.dataset.erpMaracaModule = 'loaded';
    queueMicrotask(() => {
      if (window.__XTendMaracaAutoBootError) exposeBootError('maraca-auto-boot', window.__XTendMaracaAutoBootError);
    });
  }, { once: true });
  maracaEntry.addEventListener('error', () => exposeBootError('maraca-module', 'Maraca module graph failed to load.'), { once: true });
}

const payloadElement = document.querySelector('[data-rmt-ssr-resume]');
const payload = payloadElement ? JSON.parse(payloadElement.textContent || '{}') : {};
const envelope = payload.resume || payload.response && payload.response.resume || {};
const slotNodes = new Map();
const innerNodes = new Map();
let resumeEventCount = 0;

window.addEventListener('xtend-maraca:resume', () => {
  resumeEventCount += 1;
});

document.querySelectorAll('[data-xtension-slot]').forEach((slot) => {
  const key = slot.getAttribute('data-xtension-slot');
  slotNodes.set(key, slot);
  innerNodes.set(key, key === 'angular-risk-workbench'
    ? slot.querySelector('xtend-angular-risk-workbench-root > .angular-risk-workbench')
    : slot.firstElementChild);
});

const records = Array.from(document.querySelectorAll('[data-xtend-command]')).map((node, index) => {
  const action = node.getAttribute('data-xtend-command');
  return {
    id: `erp-preboot-${index}`,
    event: 'click',
    action,
    selector: `[data-xtend-command="${CSS.escape(action)}"]`,
    surface: node.closest('[data-rmt-ssr-surface]')?.getAttribute('data-rmt-ssr-surface') || 'erp.shell'
  };
});

const runtime = createRmtResumeRuntime({ generation: envelope.generation });
const capture = runtime.installPrebootCapture(document, records, { generation: envelope.generation });
const prebootAction = new URL(window.location.href).searchParams.get('preboot_intent');
if (prebootAction) {
  const target = document.querySelector(`[data-xtend-command="${CSS.escape(prebootAction)}"]`);
  if (target) target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

window.__XTendErpPrebootResume = Object.freeze({
  schema: 'xtend.rmt.erp-catfood-preboot-evidence.v1',
  generation: envelope.generation || '',
  root: document.getElementById(envelope.rootId || 'xtend-maraca-root'),
  slotNodes,
  innerNodes,
  runtime,
  capture,
  requestedIntent: prebootAction || '',
  get resumeEventCount() {
    return resumeEventCount;
  }
});

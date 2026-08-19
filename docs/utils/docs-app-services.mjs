const BOOT_SCHEMA = 'xtend.docs.boot.v1';
const TOAST_COMMAND = 'docs.toast.show';
let applicationServices = null;

function immutable(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(immutable);
  return Object.freeze(value);
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function readDocsBootDescriptor(documentTarget = document) {
  const node = documentTarget.getElementById('xtend-docs-boot');
  if (!node) throw new Error('Missing #xtend-docs-boot descriptor.');
  const descriptor = JSON.parse(node.textContent || '{}');
  if (descriptor.schema !== BOOT_SCHEMA) throw new Error(`Unsupported Docs boot schema: ${descriptor.schema || 'missing'}`);
  return immutable(descriptor);
}

export function createLocaleService(descriptor, environment = window) {
  const config = immutable(clone(descriptor.configuration.i18n));
  let current = normalize(descriptor.document.locale || config.defaultLocale);
  let transition = null;
  let token = 0;
  function normalize(value) {
    const raw = String(value || '').toLowerCase();
    if (config.available.includes(raw)) return raw;
    const short = raw.slice(0, 2);
    return config.available.includes(short) ? short : config.fallbackLocale;
  }
  function publish(locale, source = 'route') {
    const previousLocale = current;
    current = normalize(locale);
    environment.dispatchEvent(new CustomEvent('xtend-docs-locale-changed', { detail: immutable({
      schema: config.schema, locale: current, previousLocale, source
    }) }));
    return current;
  }
  return Object.freeze({ config, normalize, current: () => current, publish,
    begin(locale, detail = {}) { transition = immutable({ schema: 'xtend.docs.locale-transition.v1', status: 'loading', busy: true, token: ++token, targetLocale: normalize(locale), ...clone(detail) }); return transition; },
    complete(detail = {}) { transition = immutable({ ...(transition || {}), ...clone(detail), status: 'ready', busy: false }); return transition; },
    snapshot: () => immutable(clone({ schema: config.schema, current, transition }))
  });
}

export function createDocsAppServices(descriptor, environment = window) {
  const snapshots = new Map();
  const content = new Map();
  const locale = createLocaleService(descriptor, environment);
  const diagnostics = Object.freeze({
    publish(name, value) {
      const snapshot = immutable(clone(value));
      snapshots.set(name, snapshot);
      environment.dispatchEvent(new CustomEvent('xtend-docs-diagnostics-snapshot', { detail: immutable({ name, snapshot }) }));
      return snapshot;
    },
    snapshot: () => immutable(Object.fromEntries([...snapshots].map(([key, value]) => [key, clone(value)])))
  });
  const contentService = Object.freeze({
    get: (localeName, slug) => content.get(`${localeName}:${slug}`) || null,
    set(localeName, slug, value) { const entry = immutable(clone(value)); content.set(`${localeName}:${slug}`, entry); return entry; },
    snapshot: () => immutable([...content.entries()].map(([key, value]) => immutable({ key, value: clone(value) })))
  });
  async function toast(message, type = 'info', duration = 3000) {
    const detail = immutable({ schema: 'xtend.docs.toast-command.v1', command: TOAST_COMMAND, message: String(message), type, duration });
    environment.dispatchEvent(new CustomEvent('xtend-command', { detail }));
    environment.dispatchEvent(new CustomEvent(TOAST_COMMAND, { detail }));
    return detail;
  }
  return Object.freeze({ descriptor, locale, content: contentService, diagnostics, toast,
    snapshot: () => immutable({ schema: 'xtend.docs.services-snapshot.v1', locale: locale.snapshot(), content: contentService.snapshot(), diagnostics: diagnostics.snapshot() })
  });
}

export function getDocsAppServices(documentTarget = document, environment = window) {
  if (!applicationServices) applicationServices = createDocsAppServices(readDocsBootDescriptor(documentTarget), environment);
  return applicationServices;
}

export { BOOT_SCHEMA, TOAST_COMMAND, immutable };

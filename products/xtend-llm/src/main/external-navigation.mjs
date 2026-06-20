const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

export function normalizeExternalUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(url.protocol)) return '';
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.hostname) return '';
    return url.href;
  } catch {
    return '';
  }
}

export function isSameOriginUrl(value, appOrigin) {
  if (!value || !appOrigin) return false;

  try {
    return new URL(value).origin === new URL(appOrigin).origin;
  } catch {
    return false;
  }
}

export function shouldOpenExternalUrl(value, appOrigin) {
  const href = normalizeExternalUrl(value);
  if (!href) return '';
  return isSameOriginUrl(href, appOrigin) ? '' : href;
}

export function configureExternalNavigation(webContents, options = {}) {
  const appOrigin = options.appOrigin || '';
  const openExternal = typeof options.openExternal === 'function' ? options.openExternal : null;
  const logger = options.logger || console;

  const openExternalUrl = async (value) => {
    const href = shouldOpenExternalUrl(value, appOrigin);
    if (!href || !openExternal) return false;
    await openExternal(href);
    return true;
  };

  if (webContents && typeof webContents.setWindowOpenHandler === 'function') {
    webContents.setWindowOpenHandler(({ url }) => {
      openExternalUrl(url).catch((error) => {
        if (logger && typeof logger.warn === 'function') {
          logger.warn('[xtend-llm] Failed to open external URL.', error);
        }
      });
      return { action: 'deny' };
    });
  }

  if (webContents && typeof webContents.on === 'function') {
    webContents.on('will-navigate', (event, url) => {
      if (isSameOriginUrl(url, appOrigin)) return;
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      openExternalUrl(url).catch((error) => {
        if (logger && typeof logger.warn === 'function') {
          logger.warn('[xtend-llm] Failed to open external URL.', error);
        }
      });
    });
  }

  return { openExternalUrl };
}

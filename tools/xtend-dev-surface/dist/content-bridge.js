'use strict';

(function installXTendDevSurfaceContentBridge() {
  window.addEventListener('message', function onMessage(event) {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== 'xtend-dev-surface-page') return;
    chrome.runtime.sendMessage({
      source: 'xtend-dev-surface',
      type: 'xds:page-event',
      payload: data.payload || null
    });
  });
}());

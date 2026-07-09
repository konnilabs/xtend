'use strict';

(function registerXTendDevSurfacePanel() {
  if (!globalThis.chrome || !chrome.devtools || !chrome.devtools.panels) {
    return;
  }

  chrome.devtools.panels.create('XTend', 'assets/icon.svg', 'panel.html', function onPanelCreated(panel) {
    panel.onShown.addListener(function onShown(panelWindow) {
      if (panelWindow && typeof panelWindow.postMessage === 'function') {
        panelWindow.postMessage({
          source: 'xtend-dev-surface',
          type: 'xds:panel-shown',
          tabId: chrome.devtools.inspectedWindow.tabId
        }, '*');
      }
    });
  });
}());

// Classic bootstrap uses the shared manager with the existing browser environment.
(async function () {
  let state = window.XTend?.state;
  if (!state) {
    try { state = (await import('./xtend-state.js')).xtendState; }
    catch (error) { console.error('Fehler beim Laden von xtendState in xtheme.js:', error); state = { get: () => null, set() {}, subscribe: () => () => {} }; }
  }
  const { createThemeManager } = await import('./xtheme.definition.js');
  const themeManager = createThemeManager({ state });
  window.XTend = window.XTend || {};
  window.XTend.theme = themeManager;
  window.XTend.toggleDarkMode = () => themeManager.toggleDarkMode();
  window.XTheme = themeManager;
})();

import { xstate } from './components/xstate.js';

const DEFAULT_UI_STATE = Object.freeze({
  toasts: [],
  alerts: [],
  dialogs: [],
  modals: []
});

const componentLoaders = new Map();
const XTEND_COMPLIANCE_VERSION = '2026-03-24';
const XTEND_CORE_REVIEW_CHECKLIST = Object.freeze([
  'State ist die einzige Wahrheitsquelle fuer UI-Status im Core.',
  'UI-Aktionen schreiben deterministisch in xstate zurueck.',
  'Legacy-Vertraege bleiben nur als dokumentierte Kompatibilitaets-Fassade bestehen.',
  'Accessibility-Pflichten wie Rollen, Labels, Fokus und Tastatursteuerung sind implementiert.',
  'Animationen respektieren prefers-reduced-motion.',
  'Neue Core-Aenderungen werden gegen Manifest-, Loader- und API-Contracts verifiziert.'
]);
const XTEND_CORE_CONTRACTS = Object.freeze({
  bootstrap: ['xstate', 'x-theme', 'api.js'],
  overlays: ['xtend.component.x-dialog.<id>.open', 'xtend.component.x-modal.<id>.open'],
  feedback: ['toast-shown', 'toast-dismissed', 'alert-shown', 'alert-dismissed'],
  routing: ['router-navigate', 'router-current', 'router-rendered'],
  theme: ['theme', 'themes', 'xtend.theme.current', 'xtend.theme.available']
});

function ensureXTendNamespace() {
  window.XTend = window.XTend || {};
  return window.XTend;
}

function cloneCoreContracts() {
  return Object.fromEntries(
    Object.entries(XTEND_CORE_CONTRACTS).map(([key, values]) => [key, [...values]])
  );
}

function ensureComplianceAPI() {
  const namespace = ensureXTendNamespace();

  namespace.compliance = {
    version: XTEND_COMPLIANCE_VERSION,
    getChecklist() {
      return [...XTEND_CORE_REVIEW_CHECKLIST];
    },
    getCoreContracts() {
      return cloneCoreContracts();
    },
    getThemeTokens(themeName) {
      const themeApi = namespace.theme || window.XTheme;
      if (themeApi && typeof themeApi.getDesignTokens === 'function') {
        return themeApi.getDesignTokens(themeName);
      }
      return {};
    }
  };

  xstate.set('xtend.compliance.version', XTEND_COMPLIANCE_VERSION);
  xstate.set('xtend.compliance.checklist', [...XTEND_CORE_REVIEW_CHECKLIST]);
  xstate.set('xtend.compliance.contracts', cloneCoreContracts());

  return namespace.compliance;
}

function cloneDefaultUIState() {
  return {
    toasts: [],
    alerts: [],
    dialogs: [],
    modals: []
  };
}

function normalizeUIState(candidate) {
  const normalized = {
    ...cloneDefaultUIState(),
    ...(candidate && typeof candidate === 'object' ? candidate : {})
  };

  for (const key of Object.keys(DEFAULT_UI_STATE)) {
    if (!Array.isArray(normalized[key])) {
      normalized[key] = [];
    }
  }

  return normalized;
}

function ensureUIState() {
  const current = xstate.get('ui');
  const normalized = normalizeUIState(current);

  if (current !== normalized) {
    const needsSync =
      !current ||
      typeof current !== 'object' ||
      Object.keys(DEFAULT_UI_STATE).some((key) => !Array.isArray(current[key]));

    if (needsSync) {
      xstate.set('ui', normalized);
    }
  }

  return normalized;
}

function updateUIState(updater) {
  const current = ensureUIState();
  const draft = {
    ...current,
    toasts: [...current.toasts],
    alerts: [...current.alerts],
    dialogs: [...current.dialogs],
    modals: [...current.modals]
  };

  const nextState = updater(draft) || draft;
  const normalized = normalizeUIState(nextState);
  xstate.set('ui', normalized);
  return normalized;
}

function syncThemeState(themeName, availableThemes) {
  xstate.set('theme', themeName);
  xstate.set('xtend.theme.current', themeName);
  xstate.set('themes', availableThemes);
  xstate.set('xtend.theme.available', availableThemes);
}

function getOpenStateKeys(type, id) {
  if (!id) return [];

  if (type === 'dialog') {
    return [
      `dialog-open-${id}`,
      `xdialog-open-${id}`,
      `xtend.component.x-dialog.${id}.open`
    ];
  }

  if (type === 'modal') {
    return [
      `modal-open-${id}`,
      `xtend.component.x-modal.${id}.open`
    ];
  }

  return [];
}

function setComponentOpenState(type, id, isOpen) {
  for (const key of getOpenStateKeys(type, id)) {
    xstate.set(key, isOpen);
  }
}

function isRuntimeReady(tag) {
  if (tag === 'x-theme') {
    return !!(window.XTend && window.XTend.theme);
  }

  if (tag === 'xstate') {
    return !!window.xstate;
  }

  return !!customElements.get(tag);
}

async function waitForRuntimeReady(tag, timeoutMs = 3000) {
  if (isRuntimeReady(tag)) return true;

  if (tag.includes('-') && typeof customElements !== 'undefined' && typeof customElements.whenDefined === 'function') {
    let timeoutId;
    try {
      await Promise.race([
        customElements.whenDefined(tag),
        new Promise((resolve) => {
          timeoutId = setTimeout(resolve, timeoutMs);
        })
      ]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  return isRuntimeReady(tag);
}

function loadModuleScript(url, cacheKey) {
  const key = cacheKey || url;
  if (componentLoaders.has(key)) {
    return componentLoaders.get(key);
  }

  const absoluteUrl = new URL(url, document.baseURI).href;
  const existingScript = Array.from(document.querySelectorAll('script[type="module"]')).find(
    (script) => script.dataset.xtendComponent === key || script.src === absoluteUrl
  );

  const loader = new Promise((resolve, reject) => {
    const handleLoad = () => resolve();
    const handleError = () => reject(new Error(`Fehler beim Laden von ${key}`));

    if (existingScript) {
      if (existingScript.dataset.xtendLoaded === 'true') {
        resolve();
        return;
      }

      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.src = absoluteUrl;
    script.dataset.xtendComponent = key;
    script.onload = () => {
      script.dataset.xtendLoaded = 'true';
      resolve();
    };
    script.onerror = handleError;
    document.head.appendChild(script);
  }).finally(() => {
    if (!isRuntimeReady(cacheKey)) {
      componentLoaders.delete(key);
    }
  });

  componentLoaders.set(key, loader);
  return loader;
}

export async function initXTendAPI(manifest) {
  ensureXTendNamespace();
  ensureUIState();

  // Initialize theme state unless xtheme.js already did it
  const currentTheme = xstate.get('theme') || xstate.get('xtend.theme.current');
  const availableThemes = xstate.get('themes') || xstate.get('xtend.theme.available');

  if (!currentTheme) {
    syncThemeState('light', Array.isArray(availableThemes) && availableThemes.length ? availableThemes : ['light', 'dark']);
  } else if (!Array.isArray(availableThemes) || availableThemes.length === 0) {
    syncThemeState(currentTheme, ['light', 'dark']);
  }

  await setupXToastAPI(manifest);
  await setupXAlertAPI(manifest);
  await setupXDialogAPI(manifest);
  await setupXModalAPI(manifest);
  await setupXThemeAPI(manifest);
  ensureComplianceAPI();
  window.dispatchEvent(new CustomEvent('xtend-api-ready', {
    detail: {
      schema: 'xtend.api.ready.v1',
      toast: Boolean(window.XToast),
      alert: Boolean(window.XAlert),
      dialog: Boolean(window.XDialog),
      modal: Boolean(window.XModal),
      theme: Boolean(window.XTheme)
    }
  }));
}

async function ensureComponentLoaded(tag, manifest) {
  if (isRuntimeReady(tag)) return;

  const url = manifest?.[tag];
  if (!url) throw new Error(`Kein Manifest-Eintrag für ${tag}`);

  await loadModuleScript(url, tag);

  if (!await waitForRuntimeReady(tag)) {
    throw new Error(`${tag} wurde geladen, hat aber keinen gueltigen Runtime-Contract bereitgestellt`);
  }
}

const TOAST_CONTAINER_ID = 'xtoast-container';

function applyToastContainerLayout(container) {
  if (!container) return null;
  container.id = TOAST_CONTAINER_ID;
  container.setAttribute('data-xtend-surface', 'toast-stack');
  container.style.position = "fixed";
  container.style.bottom = "max(1rem, env(safe-area-inset-bottom))";
  container.style.right = "max(1rem, env(safe-area-inset-right))";
  container.style.zIndex = "9999";
  container.style.display = "flex";
  container.style.flexDirection = "column-reverse";
  container.style.alignItems = "stretch";
  container.style.gap = "0.7rem";
  container.style.pointerEvents = "none";
  container.style.width = "min(24rem, calc(100vw - 2rem))";
  container.style.maxWidth = "calc(100vw - 2rem)";
  container.style.boxSizing = "border-box";
  container.style.overflow = "visible";
  container.style.margin = "0";
  return container;
}

function getToastContainer() {
  let container = document.getElementById(TOAST_CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    document.body.appendChild(container);
  }
  return applyToastContainerLayout(container);
}

async function setupXThemeAPI(manifest) {
  // Return early when XTheme already exists
  ensureXTendNamespace();
  if (window.XTheme && typeof window.XTheme === 'object') {
    window.XTend.theme = window.XTheme;
    return;
  }
  
  // Load the XTheme script when it is defined in the manifest
  try {
    await ensureComponentLoaded("x-theme", manifest);
  } catch (err) {
    console.warn("x-theme nicht im Manifest definiert, lade lokale Standard-Implementierung...");
    await loadModuleScript(new URL('./components/xtheme.js', import.meta.url).href, "x-theme");
  }
  
  // Check whether the loaded script provided the XTheme API
  if (!window.XTend || !window.XTend.theme) {
    console.error("XTheme konnte nicht geladen werden oder stellt keine API bereit");
    
    // Minimale Fallback-Implementierung
    const fallbackThemeApi = {
      getCurrentTheme() {
        return xstate.get('theme') || 'light';
      },
      getAvailableThemes() {
        return xstate.get('themes') || ['light', 'dark'];
      },
      setTheme(themeName) {
        if (!themeName) return false;
        
        const current = document.documentElement.getAttribute("data-theme");
        if (current === themeName) return true;
        
        document.documentElement.setAttribute("data-theme", themeName);
        localStorage.setItem("theme", themeName);
        syncThemeState(themeName, this.getAvailableThemes());
        
        document.dispatchEvent(new CustomEvent("theme-changed", { 
          detail: { theme: themeName } 
        }));
        
        return true;
      },
      set(name, value) {
        if (typeof name !== 'string' || !name) return false;
        if (name.startsWith('--')) {
          document.documentElement.style.setProperty(name, value);
          return true;
        }
        return this.setTheme(name);
      },
      get(name) {
        if (typeof name !== 'string' || !name) {
          return this.getCurrentTheme();
        }
        if (name.startsWith('--')) {
          return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        }
        return this.getCurrentTheme();
      },
      subscribe(fn) {
        if (typeof fn !== 'function') return () => {};
        const handler = (event) => fn(event.detail);
        document.addEventListener('theme-changed', handler);
        fn({
          theme: this.getCurrentTheme(),
          availableThemes: this.getAvailableThemes()
        });
        return () => document.removeEventListener('theme-changed', handler);
      },
      registerTheme(themeName, properties = {}) {
        const availableThemes = new Set(this.getAvailableThemes());
        availableThemes.add(themeName);
        syncThemeState(this.getCurrentTheme(), Array.from(availableThemes));
        if (properties && typeof properties === 'object') {
          for (const [key, propertyValue] of Object.entries(properties)) {
            if (key.startsWith('--')) {
              document.documentElement.style.setProperty(key, propertyValue);
            }
          }
        }
        return true;
      },
      toggleDarkMode() {
        const current = this.getCurrentTheme();
        const newTheme = current === 'dark' ? 'light' : 'dark';
        return this.setTheme(newTheme);
      }
    };

    window.XTend.theme = fallbackThemeApi;
    window.XTheme = fallbackThemeApi;
    
    return;
  }
  
  const baseTheme = window.XTend.theme;

  // Integration mit XState und Bereitstellen einer erweiterten API
  const themeApi = {
    // Basic theme functions (proxy to XTend.theme)
    getCurrentTheme() {
      return baseTheme.getCurrentTheme();
    },
    getAvailableThemes() {
      return baseTheme.getAvailableThemes();
    },
    setTheme(themeName) {
      const result = baseTheme.setTheme(themeName);
      // XState is already updated in the XTend.theme implementation
      return result;
    },
    set(name, value) {
      return typeof baseTheme.set === 'function'
        ? baseTheme.set(name, value)
        : baseTheme.setTheme(name);
    },
    get(name) {
      return typeof baseTheme.get === 'function'
        ? baseTheme.get(name)
        : baseTheme.getCurrentTheme();
    },
    subscribe(fn) {
      return typeof baseTheme.subscribe === 'function'
        ? baseTheme.subscribe(fn)
        : () => {};
    },
    toggleDarkMode() {
      return baseTheme.toggleDarkMode();
    },
    
    // External theme management
    async loadExternalTheme(themeName, cssUrl) {
      try {
        const result = await baseTheme.loadExternalTheme(themeName, cssUrl);
        
        // Extend state with theme information
        const themeState = xstate.get('theme-registry') || {};
        themeState[themeName] = {
          name: themeName,
          cssUrl: cssUrl,
          type: 'external',
          loadedAt: new Date().toISOString()
        };
        xstate.set('theme-registry', themeState);
        xstate.set('xtend.theme.registry', themeState);
        
        // Dedicated event for theme registry changes
        document.dispatchEvent(new CustomEvent('theme-registry-changed', {
          detail: { 
            themes: Object.keys(themeState),
            action: 'add',
            theme: themeName
          }
        }));
        
        return result;
      } catch (err) {
        console.error(`Fehler beim Laden des externen Themes "${themeName}":`, err);
        throw err;
      }
    },
    
    // Register theme with metadata
    registerTheme(name, properties = {}) {
      const result = baseTheme.registerTheme(name, properties);
      
      if (result) {
        // Extend state with theme information
        const themeState = xstate.get('theme-registry') || {};
        themeState[name] = {
          name: name,
          ...properties,
          type: 'registered',
          registeredAt: new Date().toISOString()
        };
        xstate.set('theme-registry', themeState);
        xstate.set('xtend.theme.registry', themeState);
        
        // Dedicated event for theme registry changes
        document.dispatchEvent(new CustomEvent('theme-registry-changed', {
          detail: { 
            themes: Object.keys(themeState),
            action: 'register',
            theme: name
          }
        }));
      }
      
      return result;
    },
    
    // Remove theme
    removeTheme(themeName) {
      let result = false;
      
      // If it is an external theme, try to remove it
      if (baseTheme.hasExternalCSS && baseTheme.hasExternalCSS(themeName)) {
        result = baseTheme.removeExternalTheme(themeName);
      }
      
      // Update state
      const themeState = xstate.get('theme-registry') || {};
      if (themeState[themeName]) {
        delete themeState[themeName];
        xstate.set('theme-registry', themeState);
        xstate.set('xtend.theme.registry', themeState);
        
        // Dedicated event for theme registry changes
        document.dispatchEvent(new CustomEvent('theme-registry-changed', {
          detail: { 
            themes: Object.keys(themeState),
            action: 'remove',
            theme: themeName
          }
        }));
        
        result = true;
      }
      
      return result;
    },
    
    // Get theme metadata
    getThemeInfo(themeName) {
      const themeState = xstate.get('theme-registry') || {};
      return themeState[themeName] || null;
    },
    
    // Get all registered themes with metadata
    getAllThemeInfo() {
      return xstate.get('theme-registry') || {};
    },
    
    // Check whether a theme is available
    hasTheme(themeName) {
      const availableThemes = this.getAvailableThemes();
      return availableThemes.includes(themeName);
    },
    getThemeRegistry() {
      return typeof baseTheme.getThemeRegistry === 'function'
        ? baseTheme.getThemeRegistry()
        : {};
    },
    
    // Watch the system theme
    listenToSystemTheme(enabled = true) {
      if (!enabled) {
        if (this._systemThemeListener) {
          window.matchMedia("(prefers-color-scheme: dark)").removeEventListener('change', this._systemThemeListener);
          this._systemThemeListener = null;
        }
        return;
      }
      
      // If a listener is already active, do nothing
      if (this._systemThemeListener) return;
      
      // Create a new listener
      this._systemThemeListener = (e) => {
        const newTheme = e.matches ? 'dark' : 'light';
        const currentTheme = this.getCurrentTheme();
        
        // Only update when the current theme is "light" or "dark"
        if (currentTheme === 'light' || currentTheme === 'dark') {
          this.setTheme(newTheme);
          
          // UI-Notification (optional)
          if (window.XToast) {
            window.XToast.info(`Theme an Systemeinstellung angepasst: ${newTheme}`, 3000);
          }
        }
      };
      
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener('change', this._systemThemeListener);
    }
  };

  if (!xstate.get('theme-registry') && typeof baseTheme.getThemeRegistry === 'function') {
    const themeRegistry = baseTheme.getThemeRegistry();
    xstate.set('theme-registry', themeRegistry);
    xstate.set('xtend.theme.registry', themeRegistry);
  }

  window.XTheme = themeApi;
  window.XTend.themeRuntime = baseTheme;
  window.XTend.theme = themeApi;
  
  // Inform the application about theme changes
  document.dispatchEvent(new CustomEvent('theme-api-ready', {
    detail: {
      currentTheme: window.XTheme.getCurrentTheme(),
      availableThemes: window.XTheme.getAvailableThemes()
    }
  }));
  
  console.log("XTheme API erfolgreich initialisiert");
}

async function setupXToastAPI(manifest) {
  ensureXTendNamespace();
  if (window.XToast) {
    window.XTend.toast = window.XToast;
    window.showToast = window.XToast.show.bind(window.XToast);
    return;
  }
  await ensureComponentLoaded("x-toast", manifest);

  window.XToast = {
    show(message, type = "info", duration = 3000) {
      const validTypes = ["info", "success", "warning", "error"];
      if (!validTypes.includes(type)) type = "info";
      if (isNaN(duration) || duration < 0) duration = 3000;

      const toast = document.createElement("x-toast");
      toast.setAttribute("type", type);
      toast.setAttribute("duration", duration);
      toast.textContent = message;
      toast.dataset.managed = 'api';
      
      // Unique ID for state management
      const toastId = `toast-${Math.random().toString(36).slice(2, 10)}`;
      toast.id = toastId;

      const container = getToastContainer();
      toast.style.pointerEvents = "auto";
      toast.style.width = "100%";
      toast.style.maxWidth = "100%";
      toast.style.boxSizing = "border-box";
      container.appendChild(toast);

      // Update state
      updateUIState((uiState) => {
        uiState.toasts.push({
          id: toastId,
          message,
          type,
          duration,
          timestamp: Date.now()
        });
        return uiState;
      });

      toast.addEventListener("toast-dismissed", () => {
        if (toast.parentNode === container) {
          container.removeChild(toast);
        }
        if (container.childElementCount === 0) container.remove();
        
        // Remove from state
        updateUIState((currentState) => {
          currentState.toasts = currentState.toasts.filter((item) => item.id !== toastId);
          return currentState;
        });
      });

      return toast;
    },
    success(msg, dur) { return this.show(msg, "success", dur); },
    error(msg, dur) { return this.show(msg, "error", dur); },
    warning(msg, dur) { return this.show(msg, "warning", dur); },
    info(msg, dur) { return this.show(msg, "info", dur); },
    
    // New method: remove all toasts
    clearAll() {
      const container = document.getElementById(TOAST_CONTAINER_ID);
      if (container) {
        container.innerHTML = '';
        container.remove();
      }
      
      // Update state
      updateUIState((uiState) => {
        uiState.toasts = [];
        return uiState;
      });
    }
  };

  window.XTend.toast = window.XToast;
  window.showToast = window.XToast.show.bind(window.XToast);
}

async function setupXAlertAPI(manifest) {
  ensureXTendNamespace();
  if (window.XAlert) {
    window.XTend.alert = window.XAlert;
    window.showAlert = window.XAlert.show.bind(window.XAlert);
    return;
  }
  await ensureComponentLoaded("x-alert", manifest);

  window.XAlert = {
    show(message, type = "info", opts = {}) {
      const validTypes = ["info", "success", "warning", "error"];
      if (!validTypes.includes(type)) type = "info";

      const alert = document.createElement("x-alert");
      alert.setAttribute("type", type);
      if (opts.closable !== false) alert.setAttribute("closable", "");
      if (opts.duration && Number(opts.duration) > 0) {
        alert.setAttribute("duration", String(opts.duration));
      }
      if (opts.overlay) {
        alert.setAttribute('overlay', '');
      }
      if (opts.ariaLabel) {
        alert.setAttribute('aria-label', String(opts.ariaLabel));
      }

      // Unique ID for state management
      const alertId = `alert-${Math.random().toString(36).slice(2, 10)}`;
      alert.id = alertId;
      alert.dataset.managed = 'api';
      
      alert.textContent = message;
      document.body.appendChild(alert);
      
      // Update state
      updateUIState((uiState) => {
        uiState.alerts.push({
          id: alertId,
          message,
          type,
          closable: opts.closable !== false,
          duration: opts.duration,
          overlay: opts.overlay === true,
          ariaLabel: opts.ariaLabel || null,
          timestamp: Date.now()
        });
        return uiState;
      });
      
      // Remove alert from state when it is closed
      alert.addEventListener("alert-dismissed", () => {
        updateUIState((currentState) => {
          currentState.alerts = currentState.alerts.filter((item) => item.id !== alertId);
          return currentState;
        });
      });
      
      return alert;
    },
    success(msg, opts) { return this.show(msg, "success", opts); },
    error(msg, opts) { return this.show(msg, "error", opts); },
    warning(msg, opts) { return this.show(msg, "warning", opts); },
    info(msg, opts) { return this.show(msg, "info", opts); }
  };

  window.XTend.alert = window.XAlert;
  window.showAlert = window.XAlert.show.bind(window.XAlert);
}

async function setupXDialogAPI(manifest) {
  ensureXTendNamespace();
  if (window.XDialog) {
    window.XTend.dialog = window.XDialog;
    window.showDialog = window.XDialog.show.bind(window.XDialog);
    return;
  }
  await ensureComponentLoaded("x-dialog", manifest);

  window.XDialog = {
    show(opts = {}) {
      // Unique ID for state management
      const dialogId = `dialog-${Math.random().toString(36).slice(2, 10)}`;
      // Dialog object for state
      const dialogState = {
        id: dialogId,
        title: opts.title || '',
        content: opts.content || '',
        hasOverlay: opts.overlay !== false,
        actions: Array.isArray(opts.actions) ? opts.actions : [],
        timestamp: Date.now(),
        open: true
      };
      // Add dialog to state
      updateUIState((uiState) => {
        uiState.dialogs.push(dialogState);
        return uiState;
      });
      // Set dialog open flag in state
      setComponentOpenState('dialog', dialogId, true);
      // --- Add <x-dialog> to the DOM when it is missing ---
      if (!document.getElementById(dialogId)) {
        const dialogEl = document.createElement('x-dialog');
        dialogEl.id = dialogId;
        dialogEl.dataset.managed = 'api';
        if (opts.overlay !== false) dialogEl.setAttribute('overlay', '');
        dialogEl.setAttribute('open', ''); // Open the dialog immediately
        document.body.appendChild(dialogEl);
      }
      return dialogId;
    },
    close(dialogId) {
      // Reset dialog open flag in state
      setComponentOpenState('dialog', dialogId, false);
      // Remove dialog from state
      updateUIState((uiState) => {
        uiState.dialogs = uiState.dialogs.filter((item) => item.id !== dialogId);
        return uiState;
      });
      // Remove <x-dialog> from the DOM
      const dialogEl = document.getElementById(dialogId);
      if (dialogEl) dialogEl.remove();
    }
  };

  window.XTend.dialog = window.XDialog;
  window.showDialog = window.XDialog.show.bind(window.XDialog);
}

async function setupXModalAPI(manifest) {
  ensureXTendNamespace();
  if (window.XModal) {
    window.XTend.modal = window.XModal;
    window.showModal = window.XModal.show.bind(window.XModal);
    return;
  }
  await ensureComponentLoaded("x-modal", manifest);

  window.XModal = {
    show(opts = {}) {
      // Unique ID for state management
      const modalId = `modal-${Math.random().toString(36).slice(2, 10)}`;
      // Modal object for state
      const modalState = {
        id: modalId,
        title: opts.title || '',
        content: opts.content || '',
        hasOverlay: opts.overlay !== false,
        actions: Array.isArray(opts.actions) ? opts.actions : [],
        timestamp: Date.now(),
        open: true
      };
      // Modal in State aufnehmen
      updateUIState((uiState) => {
        uiState.modals.push(modalState);
        return uiState;
      });
      // Set modal open flag in state
      setComponentOpenState('modal', modalId, true);
      // Add <x-modal> to the DOM when it is missing
      if (!document.getElementById(modalId)) {
        const modalEl = document.createElement('x-modal');
        modalEl.id = modalId;
        modalEl.dataset.managed = 'api';
        modalEl.setAttribute('title', modalState.title);
        modalEl.setAttribute('content', modalState.content);
        if (modalState.hasOverlay) modalEl.setAttribute('overlay', '');
        if (modalState.actions.length) modalEl.setAttribute('actions', JSON.stringify(modalState.actions));
        document.body.appendChild(modalEl);
      }
      return modalId;
    },
    close(modalId) {
      setComponentOpenState('modal', modalId, false);
      // Remove modal from state
      updateUIState((uiState) => {
        uiState.modals = uiState.modals.filter((item) => item.id !== modalId);
        return uiState;
      });
      // Remove <x-modal> from the DOM
      const modalEl = document.getElementById(modalId);
      if (modalEl) modalEl.remove();
    }
  };

  window.XTend.modal = window.XModal;
  window.showModal = window.XModal.show.bind(window.XModal);
}

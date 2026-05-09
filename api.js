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

  // Theme-State initialisieren (falls nicht durch xtheme.js bereits geschehen)
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

  if (!isRuntimeReady(tag)) {
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
  // Früh zurückkehren, wenn XTheme bereits existiert
  ensureXTendNamespace();
  if (window.XTheme && typeof window.XTheme === 'object') {
    window.XTend.theme = window.XTheme;
    return;
  }
  
  // XTheme-Skript laden, wenn es im Manifest definiert ist
  try {
    await ensureComponentLoaded("x-theme", manifest);
  } catch (err) {
    console.warn("x-theme nicht im Manifest definiert, lade lokale Standard-Implementierung...");
    await loadModuleScript(new URL('./components/xtheme.js', import.meta.url).href, "x-theme");
  }
  
  // Überprüfen, ob die XTheme API durch das geladene Skript bereitgestellt wurde
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
    // Grundlegende Theme-Funktionen (Proxy zu XTend.theme)
    getCurrentTheme() {
      return baseTheme.getCurrentTheme();
    },
    getAvailableThemes() {
      return baseTheme.getAvailableThemes();
    },
    setTheme(themeName) {
      const result = baseTheme.setTheme(themeName);
      // XState wird bereits in der XTend.theme-Implementierung aktualisiert
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
    
    // Externe Theme-Verwaltung
    async loadExternalTheme(themeName, cssUrl) {
      try {
        const result = await baseTheme.loadExternalTheme(themeName, cssUrl);
        
        // State mit Theme-Informationen erweitern
        const themeState = xstate.get('theme-registry') || {};
        themeState[themeName] = {
          name: themeName,
          cssUrl: cssUrl,
          type: 'external',
          loadedAt: new Date().toISOString()
        };
        xstate.set('theme-registry', themeState);
        xstate.set('xtend.theme.registry', themeState);
        
        // Eigenes Event für Theme-Registry-Änderungen
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
    
    // Theme registrieren (mit Metadaten)
    registerTheme(name, properties = {}) {
      const result = baseTheme.registerTheme(name, properties);
      
      if (result) {
        // State mit Theme-Informationen erweitern
        const themeState = xstate.get('theme-registry') || {};
        themeState[name] = {
          name: name,
          ...properties,
          type: 'registered',
          registeredAt: new Date().toISOString()
        };
        xstate.set('theme-registry', themeState);
        xstate.set('xtend.theme.registry', themeState);
        
        // Eigenes Event für Theme-Registry-Änderungen
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
    
    // Theme entfernen
    removeTheme(themeName) {
      let result = false;
      
      // Falls es ein externes Theme ist, versuchen wir es zu entfernen
      if (baseTheme.hasExternalCSS && baseTheme.hasExternalCSS(themeName)) {
        result = baseTheme.removeExternalTheme(themeName);
      }
      
      // State aktualisieren
      const themeState = xstate.get('theme-registry') || {};
      if (themeState[themeName]) {
        delete themeState[themeName];
        xstate.set('theme-registry', themeState);
        xstate.set('xtend.theme.registry', themeState);
        
        // Eigenes Event für Theme-Registry-Änderungen
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
    
    // Theme-Metadaten abrufen
    getThemeInfo(themeName) {
      const themeState = xstate.get('theme-registry') || {};
      return themeState[themeName] || null;
    },
    
    // Alle registrierten Themes mit Metadaten abrufen
    getAllThemeInfo() {
      return xstate.get('theme-registry') || {};
    },
    
    // Prüfen, ob ein Theme verfügbar ist
    hasTheme(themeName) {
      const availableThemes = this.getAvailableThemes();
      return availableThemes.includes(themeName);
    },
    getThemeRegistry() {
      return typeof baseTheme.getThemeRegistry === 'function'
        ? baseTheme.getThemeRegistry()
        : {};
    },
    
    // System-Theme überwachen
    listenToSystemTheme(enabled = true) {
      if (!enabled) {
        if (this._systemThemeListener) {
          window.matchMedia("(prefers-color-scheme: dark)").removeEventListener('change', this._systemThemeListener);
          this._systemThemeListener = null;
        }
        return;
      }
      
      // Wenn bereits ein Listener aktiv ist, nichts tun
      if (this._systemThemeListener) return;
      
      // Neuen Listener erstellen
      this._systemThemeListener = (e) => {
        const newTheme = e.matches ? 'dark' : 'light';
        const currentTheme = this.getCurrentTheme();
        
        // Nur aktualisieren, wenn das aktuelle Theme "light" oder "dark" ist
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
  
  // Anwendung über Themen-Änderungen informieren
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
      
      // Eindeutige ID für State-Management
      const toastId = `toast-${Math.random().toString(36).slice(2, 10)}`;
      toast.id = toastId;

      const container = getToastContainer();
      toast.style.pointerEvents = "auto";
      toast.style.width = "100%";
      toast.style.maxWidth = "100%";
      toast.style.boxSizing = "border-box";
      container.appendChild(toast);

      // State aktualisieren
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
        
        // Aus State entfernen
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
    
    // Neue Methode: Alle Toasts entfernen
    clearAll() {
      const container = document.getElementById(TOAST_CONTAINER_ID);
      if (container) {
        container.innerHTML = '';
        container.remove();
      }
      
      // State aktualisieren
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

      // Eindeutige ID für State-Management
      const alertId = `alert-${Math.random().toString(36).slice(2, 10)}`;
      alert.id = alertId;
      alert.dataset.managed = 'api';
      
      alert.textContent = message;
      document.body.appendChild(alert);
      
      // State aktualisieren
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
      
      // Alert aus State entfernen, wenn es geschlossen wird
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
      // Eindeutige ID für State-Management
      const dialogId = `dialog-${Math.random().toString(36).slice(2, 10)}`;
      // Dialog-Objekt für State
      const dialogState = {
        id: dialogId,
        title: opts.title || '',
        content: opts.content || '',
        hasOverlay: opts.overlay !== false,
        actions: Array.isArray(opts.actions) ? opts.actions : [],
        timestamp: Date.now(),
        open: true
      };
      // Dialog in State aufnehmen
      updateUIState((uiState) => {
        uiState.dialogs.push(dialogState);
        return uiState;
      });
      // Dialog-Open-Flag im State setzen
      setComponentOpenState('dialog', dialogId, true);
      // --- NEU: <x-dialog> ins DOM einfügen, falls nicht vorhanden ---
      if (!document.getElementById(dialogId)) {
        const dialogEl = document.createElement('x-dialog');
        dialogEl.id = dialogId;
        dialogEl.dataset.managed = 'api';
        if (opts.overlay !== false) dialogEl.setAttribute('overlay', '');
        dialogEl.setAttribute('open', ''); // <--- Dialog sofort öffnen
        document.body.appendChild(dialogEl);
      }
      return dialogId;
    },
    close(dialogId) {
      // Dialog-Open-Flag im State zurücksetzen
      setComponentOpenState('dialog', dialogId, false);
      // Dialog aus State entfernen
      updateUIState((uiState) => {
        uiState.dialogs = uiState.dialogs.filter((item) => item.id !== dialogId);
        return uiState;
      });
      // <x-dialog> aus DOM entfernen
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
      // Eindeutige ID für State-Management
      const modalId = `modal-${Math.random().toString(36).slice(2, 10)}`;
      // Modal-Objekt für State
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
      // Modal-Open-Flag im State setzen
      setComponentOpenState('modal', modalId, true);
      // <x-modal> ins DOM einfügen, falls nicht vorhanden
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
      // Modal aus State entfernen
      updateUIState((uiState) => {
        uiState.modals = uiState.modals.filter((item) => item.id !== modalId);
        return uiState;
      });
      // <x-modal> aus DOM entfernen
      const modalEl = document.getElementById(modalId);
      if (modalEl) modalEl.remove();
    }
  };

  window.XTend.modal = window.XModal;
  window.showModal = window.XModal.show.bind(window.XModal);
}

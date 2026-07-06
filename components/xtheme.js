(async function () {
  // Try to load xstate, either as a global variable or through dynamic import
  let xstate;
  if (window.xstate) {
    xstate = window.xstate;
  } else {
    try {
      const module = await import('./xstate.js');
      xstate = module.xstate;
    } catch (e) {
      console.error('Fehler beim Laden von xstate in xtheme.js:', e);
      // Dummy implementation as fallback
      xstate = {
        get: () => null,
        set: () => {},
        subscribe: () => () => {}
      };
    }
  }

  const THEME_ATTRIBUTE = 'data-theme';
  const STORAGE_KEY = 'xtend-theme';
  const THEME_STYLES_ID = 'xtend-theme-styles';
  const THEME_A11Y_STYLES_ID = 'xtend-theme-a11y-styles';
  const THEME_ANNOUNCER_ID = 'xtend-theme-announcer';
  const DENSITY_ATTRIBUTE = 'data-xtend-density';
  const DEFAULT_DENSITY = 'comfortable';
  const PERFORMANCE_PROFILE_SCHEMA = 'xtend.performance.component-profile.v1';
  const RMT_COMPONENT_CONTRACT_SCHEMA = 'xtend.rmt.component-contract.v1';
  const RMT_SHELL_AUTHORING_SCHEMA = 'xtend.rmt.shell-authoring.component.v1';
  const COMPONENT_NETWORK_SCHEMA = 'xtend.component.network.v1';
  const THEME_CONTEXT_SCHEMA = 'xtend.theme.context.v1';
  const THEME_PERFORMANCE_SNAPSHOT_SCHEMA = 'xtend.theme.performance-snapshot.v1';
  const DESIGN_TOKEN_CONTRACT_SCHEMA = 'xtend.design-tokens.product-contract.v1';
  const DESIGN_TOKEN_PACK_SCHEMA = 'xtend.design-tokens.pack.v1';
  const XTHEME_TOKEN_ALIAS_LAYER_SCHEMA = 'xtend.theme.token-alias-layer.v1';
  const MOTION_CONTRAST_POLICY_SCHEMA = 'xtend.a11y.motion-contrast-policy.v1';
  const MOTION_POLICY_SCHEMA = 'xtend.a11y.motion-policy.v1';
  const CONTRAST_POLICY_SCHEMA = 'xtend.a11y.contrast-policy.v1';
  const MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';
  const CONTRAST_MEDIA_QUERY = '(forced-colors: active)';
  const ANNOUNCER_STYLE = [
    'position:absolute',
    'width:1px',
    'height:1px',
    'padding:0',
    'margin:-1px',
    'overflow:hidden',
    'clip:rect(0, 0, 0, 0)',
    'white-space:nowrap',
    'border:0'
  ].join(';');
  const XTHEME_ALIAS_GLOBAL_TOKENS = Object.freeze({
    '--xtend-color-action': 'var(--xtend-color-primary, Highlight)',
    '--xtend-color-action-hover': 'var(--xtend-color-primary-dark, Highlight)',
    '--xtend-color-action-subtle': 'var(--xtend-signature-accent-soft, color-mix(in srgb, var(--xtend-color-primary, Highlight) 14%, transparent))',
    '--xtend-color-danger': 'var(--xtend-error-bg, Mark)',
    '--xtend-color-warning': 'var(--xtend-warning-bg, Mark)',
    '--xtend-color-success': 'var(--xtend-success-bg, Mark)',
    '--xtend-surface-page': 'var(--xtend-surface, Canvas)',
    '--xtend-surface-panel': 'var(--xtend-surface-muted, Canvas)',
    '--xtend-surface-raised': 'var(--xtend-signature-surface-raised, var(--xtend-surface-muted, Canvas))',
    '--xtend-surface-inset': 'var(--xtend-signature-surface-inset, var(--xtend-surface, Canvas))',
    '--xtend-surface-overlay': 'var(--xtend-overlay-bg, Canvas)',
    '--xtend-surface-control': 'var(--xtend-signature-surface-panel, var(--xtend-surface-muted, ButtonFace))',
    '--xtend-text-primary': 'var(--xtend-text, CanvasText)',
    '--xtend-text-muted': 'var(--xtend-signature-ink-muted, var(--xtend-text, CanvasText))',
    '--xtend-text-inverse': 'var(--xtend-color-accent, HighlightText)',
    '--xtend-text-on-action': 'var(--xtend-color-accent, HighlightText)',
    '--xtend-border-subtle': 'var(--xtend-signature-edge-subtle, var(--xtend-border-color, CanvasText))',
    '--xtend-border-strong': 'var(--xtend-signature-edge-strong, var(--xtend-border-color, CanvasText))',
    '--xtend-focus-ring': 'var(--xtend-focus-outline, 2px solid Highlight)',
    '--xtend-space-1': 'calc(var(--xtend-density-spacing, 0.75rem) * 0.5)',
    '--xtend-space-2': 'var(--xtend-density-spacing, 0.75rem)',
    '--xtend-space-3': 'calc(var(--xtend-density-spacing, 0.75rem) * 1.5)',
    '--xtend-space-4': 'calc(var(--xtend-density-spacing, 0.75rem) * 2)',
    '--xtend-space-control-gap': 'calc(var(--xtend-density-spacing, 0.75rem) * 0.8)',
    '--xtend-radius-xs': '3px',
    '--xtend-radius-sm': '6px',
    '--xtend-radius-md': 'var(--xtend-radius, 10px)',
    '--xtend-radius-lg': '14px',
    '--xtend-radius-panel': 'var(--xtend-radius-md, var(--xtend-radius, 10px))',
    '--xtend-radius-control': 'var(--xtend-radius-sm, 6px)',
    '--xtend-elevation-0': 'none',
    '--xtend-elevation-1': 'var(--xtend-signature-shadow-control, 0 1px 2px rgba(22, 27, 38, 0.08))',
    '--xtend-elevation-2': 'var(--xtend-signature-shadow-panel, var(--xtend-shadow, 0 12px 32px rgba(22, 27, 38, 0.14)))',
    '--xtend-elevation-3': 'var(--xtend-signature-shadow-overlay, 0 28px 72px rgba(10, 16, 26, 0.24))',
    '--xtend-elevation-focus': '0 0 0 3px color-mix(in srgb, var(--xtend-color-primary, Highlight) 22%, transparent)',
    '--xtend-font-family-body': 'var(--xtend-font-family, system-ui, sans-serif)',
    '--xtend-font-family-heading': 'var(--xtend-font-family-body)',
    '--xtend-font-family-control': 'var(--xtend-font-family-body)',
    '--xtend-font-size-body': '0.95rem',
    '--xtend-font-size-label': '0.8125rem',
    '--xtend-font-size-control': '0.925rem',
    '--xtend-font-weight-control': '560',
    '--xtend-font-weight-label': '620',
    '--xtend-motion-duration-instant': '80ms',
    '--xtend-motion-easing-standard': 'cubic-bezier(0.2, 0, 0, 1)',
    '--xtend-motion-easing-enter': 'cubic-bezier(0.16, 1, 0.3, 1)',
    '--xtend-motion-easing-exit': 'cubic-bezier(0.4, 0, 1, 1)'
  });
  const XTHEME_ALIAS_COMPONENT_TOKENS = Object.freeze({
    '--xtend-theme-surface': 'var(--xtend-surface-page)',
    '--xtend-theme-text': 'var(--xtend-text-primary)',
    '--xtend-header-surface': 'var(--xtend-surface-panel)',
    '--xtend-header-text': 'var(--xtend-text-primary)',
    '--xtend-header-border-color': 'var(--xtend-border-subtle)',
    '--xtend-header-radius': 'var(--xtend-radius-panel)',
    '--xtend-header-elevation': 'var(--xtend-elevation-1)',
    '--xtend-button-surface': 'var(--xtend-surface-control)',
    '--xtend-button-text': 'var(--xtend-text-primary)',
    '--xtend-button-primary-surface': 'var(--xtend-color-action)',
    '--xtend-button-primary-text': 'var(--xtend-text-on-action)',
    '--xtend-button-secondary-surface': 'var(--xtend-surface-inset)',
    '--xtend-button-danger-surface': 'var(--xtend-color-danger)',
    '--xtend-button-radius': 'var(--xtend-radius-control)',
    '--xtend-button-elevation': 'var(--xtend-elevation-1)',
    '--xtend-menu-surface': 'var(--xtend-surface-panel)',
    '--xtend-menu-text': 'var(--xtend-text-primary)',
    '--xtend-menu-radius': 'var(--xtend-radius-panel)',
    '--xtend-menu-elevation': 'var(--xtend-elevation-1)',
    '--xtend-menu-item-surface': 'transparent',
    '--xtend-menu-item-hover-surface': 'var(--xtend-color-action-subtle)',
    '--xtend-menu-item-text': 'var(--xtend-text-primary)',
    '--xtend-drawer-surface': 'var(--xtend-surface-panel)',
    '--xtend-drawer-text': 'var(--xtend-text-primary)',
    '--xtend-drawer-border': 'var(--xtend-border-subtle)',
    '--xtend-drawer-elevation': 'var(--xtend-elevation-3)',
    '--xtend-drawer-overlay-surface': 'var(--xtend-surface-overlay)',
    '--xtend-side-panel-surface': 'var(--xtend-surface-panel)',
    '--xtend-side-panel-text': 'var(--xtend-text-primary)',
    '--xtend-side-panel-border': 'var(--xtend-border-subtle)',
    '--xtend-side-panel-elevation': 'var(--xtend-elevation-2)',
    '--xtend-modal-surface': 'var(--xtend-surface-raised)',
    '--xtend-modal-text': 'var(--xtend-text-primary)',
    '--xtend-modal-overlay-surface': 'var(--xtend-surface-overlay)',
    '--xtend-modal-elevation': 'var(--xtend-elevation-3)',
    '--xtend-dialog-surface': 'var(--xtend-surface-raised)',
    '--xtend-dialog-text': 'var(--xtend-text-primary)',
    '--xtend-dialog-elevation': 'var(--xtend-elevation-3)',
    '--xtend-popover-surface': 'var(--xtend-surface-raised)',
    '--xtend-popover-text': 'var(--xtend-text-primary)',
    '--xtend-popover-elevation': 'var(--xtend-elevation-2)',
    '--xtend-toast-surface': 'var(--xtend-surface-raised)',
    '--xtend-toast-text': 'var(--xtend-text-primary)',
    '--xtend-toast-elevation': 'var(--xtend-elevation-2)',
    '--xtend-icon-color': 'currentColor',
    '--xtend-icon-size': '1em',
    '--xtend-icon-stroke-width': '2'
  });

  function isXTendVerboseEnabled() {
    return Boolean(window.XTendLoader &&
      typeof window.XTendLoader.isVerbose === 'function' &&
      window.XTendLoader.isVerbose());
  }

  function themeVerboseLog(...args) {
    if (isXTendVerboseEnabled() && typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log(...args);
    }
  }

  const XTEND_BASE_TOKENS = Object.freeze({
    ...XTHEME_ALIAS_GLOBAL_TOKENS,
    ...XTHEME_ALIAS_COMPONENT_TOKENS,
    '--xtend-color-primary': '#4fc3f7',
    '--xtend-color-primary-dark': '#0288d1',
    '--xtend-color-accent': '#ffffff',
    '--xtend-glass-bg': 'rgba(30, 34, 44, 0.55)',
    '--xtend-glass-blur': '18px',
    '--xtend-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
    '--xtend-border': '1.5px solid rgba(255,255,255,0.12)',
    '--xtend-radius': '18px',
    '--xtend-font-family': "'Inter', 'Segoe UI', Arial, sans-serif",
    '--xtend-focus-outline': '2px solid #4fc3f7',
    '--xtend-info-bg': 'rgba(33, 150, 243, 0.92)',
    '--xtend-success-bg': 'rgba(56, 200, 120, 0.92)',
    '--xtend-warning-bg': 'rgba(255, 193, 7, 0.92)',
    '--xtend-error-bg': 'rgba(220, 53, 69, 0.92)',
    '--xtend-info-fg': '#ffffff',
    '--xtend-success-fg': '#ffffff',
    '--xtend-warning-fg': '#212529',
    '--xtend-error-fg': '#ffffff',
    '--xtend-motion-duration-fast': '160ms',
    '--xtend-motion-duration-base': '220ms',
    '--xtend-motion-scale': '1',
    '--xtend-density-scale': '1',
    '--xtend-density-spacing': '0.75rem',
    '--xtend-control-height': '2.5rem',
    '--xtend-font-scale': '1',
    '--xtend-focus-outline-offset': '2px',
    '--xtend-border-color': 'rgba(255,255,255,0.16)'
  });
  const SUPPORTED_DENSITIES = Object.freeze(['compact', 'comfortable', 'dense']);
  const DENSITY_TOKENS = Object.freeze({
    compact: Object.freeze({
      '--xtend-density-scale': '0.875',
      '--xtend-density-spacing': '0.5rem',
      '--xtend-control-height': '2.125rem',
      '--xtend-font-scale': '0.95'
    }),
    comfortable: Object.freeze({
      '--xtend-density-scale': '1',
      '--xtend-density-spacing': '0.75rem',
      '--xtend-control-height': '2.5rem',
      '--xtend-font-scale': '1'
    }),
    dense: Object.freeze({
      '--xtend-density-scale': '0.75',
      '--xtend-density-spacing': '0.375rem',
      '--xtend-control-height': '1.875rem',
      '--xtend-font-scale': '0.925'
    })
  });
  const DEFAULT_THEMES = {
    light: {
      ...XTEND_BASE_TOKENS,
      '--xtend-surface': '#ffffff',
      '--xtend-surface-muted': 'rgba(255,255,255,0.85)',
      '--xtend-text': '#1f2635',
      '--xtend-overlay-bg': 'rgba(30, 34, 44, 0.55)'
    },
    dark: {
      ...XTEND_BASE_TOKENS,
      '--xtend-surface': '#1f2635',
      '--xtend-surface-muted': 'rgba(30, 34, 44, 0.88)',
      '--xtend-text': '#f5f7fb',
      '--xtend-overlay-bg': 'rgba(15, 18, 24, 0.72)'
    },
    'high-contrast': {
      ...XTEND_BASE_TOKENS,
      '--xtend-color-primary': '#ffff00',
      '--xtend-color-primary-dark': '#ffffff',
      '--xtend-color-accent': '#00ffff',
      '--xtend-surface': '#000000',
      '--xtend-surface-muted': '#111111',
      '--xtend-text': '#ffffff',
      '--xtend-overlay-bg': 'rgba(0, 0, 0, 0.88)',
      '--xtend-border-color': '#ffffff',
      '--xtend-focus-outline': '3px solid #ffff00',
      '--xtend-info-bg': '#0000ff',
      '--xtend-success-bg': '#008000',
      '--xtend-warning-bg': '#ffff00',
      '--xtend-error-bg': '#ff0000',
      '--xtend-warning-fg': '#000000'
    },
    'forced-colors': {
      ...XTEND_BASE_TOKENS,
      '--xtend-color-primary': 'Highlight',
      '--xtend-color-primary-dark': 'Highlight',
      '--xtend-color-accent': 'HighlightText',
      '--xtend-surface': 'Canvas',
      '--xtend-surface-muted': 'Canvas',
      '--xtend-text': 'CanvasText',
      '--xtend-overlay-bg': 'Canvas',
      '--xtend-border-color': 'CanvasText',
      '--xtend-focus-outline': '2px solid Highlight',
      '--xtend-info-bg': 'Canvas',
      '--xtend-success-bg': 'Canvas',
      '--xtend-warning-bg': 'Canvas',
      '--xtend-error-bg': 'Canvas',
      '--xtend-info-fg': 'CanvasText',
      '--xtend-success-fg': 'CanvasText',
      '--xtend-warning-fg': 'CanvasText',
      '--xtend-error-fg': 'CanvasText'
    }
  };

  class ThemeManager {
    static get xtendScaffoldA11yProfile() {
      return Object.freeze({
        schema: 'xtend.a11y.component-contract.v1',
        componentRef: 'x-theme',
        primaryProfile: 'theme',
        providerBoundary: true,
        runtimeRole: 'theme-preference-provider',
        screenreader: {
          liveRegion: 'polite',
          announcerId: THEME_ANNOUNCER_ID,
          signals: ['theme-change-announcement', 'preference-change-announcement'],
          scheduleRef: 'a11y.user-blocking.announce'
        },
        preferences: {
          reducedMotion: MOTION_MEDIA_QUERY,
          forcedColors: CONTRAST_MEDIA_QUERY,
          colorScheme: '(prefers-color-scheme: dark)'
        },
        testRefs: ['screenreader-signals', 'motion-contrast', 'catalog-coverage', 'references']
      });
    }

    static get xtendMotionContrastPolicy() {
      return Object.freeze({
        schema: MOTION_CONTRAST_POLICY_SCHEMA,
        componentRef: 'x-theme',
        primaryProfile: 'theme',
        motion: {
          schema: MOTION_POLICY_SCHEMA,
          mediaQuery: MOTION_MEDIA_QUERY,
          animationPolicy: 'theme-provider-preference-boundary',
          reducedMotion: 'required',
          disableAnimations: true,
          disableTransitions: true,
          noMotionOnlyState: true,
          requiredCss: ['@media (prefers-reduced-motion: reduce)', 'animation: none', 'transition: none']
        },
        contrast: {
          schema: CONTRAST_POLICY_SCHEMA,
          mediaQuery: CONTRAST_MEDIA_QUERY,
          contrastPolicy: 'theme-tokens-map-to-system-colors',
          highContrast: 'required',
          forcedColorAdjust: 'auto',
          focusVisible: 'required',
          nonColorStatus: 'required',
          requiredCss: ['@media (forced-colors: active)', 'forced-color-adjust', 'CanvasText', 'Highlight']
        },
        fabric: {
          lane: 'a11y',
          fiberKind: 'a11y.preference',
          scheduleRef: 'a11y.user-blocking.preference'
        },
        testRefs: ['motion-contrast', 'a11y-hydration', 'references']
      });
    }

    static get xtendScaffoldPerformanceProfile() {
      return Object.freeze({
        schema: PERFORMANCE_PROFILE_SCHEMA,
        componentRef: 'x-theme',
        profiles: ['theme', 'stateful'],
        primaryProfile: 'theme',
        budgetClass: 'provider-core',
        lane: 'user-blocking',
        hydrationPolicy: 'eager',
        budgetsMs: {
          initialize: 24,
          themeApply: 12,
          themePropagation: 8,
          densityApply: 8,
          externalCssHydration: 64,
          subscriberNotify: 4
        },
        criticalMeasurements: [
          'xtend.theme.initialize',
          'xtend.theme.apply',
          'xtend.theme.propagate',
          'xtend.theme.density',
          'xtend.theme.external-css'
        ],
        cleanup: ['media-query-listeners', 'theme-subscribers', 'announcer-region'],
        fabric: {
          lane: 'user-blocking',
          diagnosticsLane: 'diagnostics',
          fiberKind: 'theme.preference-provider',
          snapshotPath: 'xtend.theme.performanceSnapshot'
        },
        rmt: {
          scheduleRefs: ['theme.provider.initialize', 'theme.user-blocking.apply', 'theme.propagate.context'],
          kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
        },
        testRefs: ['catalog-coverage', 'regression-priority', 'component-long-tail-migration', 'references']
      });
    }

    static get xtendRmtMetadata() {
      return Object.freeze({
        schema: RMT_COMPONENT_CONTRACT_SCHEMA,
        adapter: 'xtend.theme-provider',
        tag: 'x-theme',
        schedules: [
          'theme.provider.initialize',
          'theme.user-blocking.apply',
          'theme.density.apply',
          'theme.propagate.context',
          'diagnostics.snapshot'
        ],
        hydration: { policy: 'eager', lane: 'user-blocking' },
        shellAuthoring: {
          schema: RMT_SHELL_AUTHORING_SCHEMA,
          host: 'x-theme',
          templateRole: 'theme-provider',
          attributes: [THEME_ATTRIBUTE, DENSITY_ATTRIBUTE, 'data-xtend-motion', 'data-xtend-contrast'],
          commands: ['set-theme', 'set-density', 'register-theme', 'load-external-theme'],
          events: ['theme-changed', 'theme-density-changed', 'theme-context-changed'],
          contextPath: 'xtend.theme.context'
        },
        performance: {
          profile: ThemeManager.xtendScaffoldPerformanceProfile,
          coalesceKey: 'x-theme:context'
        },
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      });
    }

    static get xtendComponentNetworkContract() {
      return Object.freeze({
        schema: COMPONENT_NETWORK_SCHEMA,
        componentRef: 'x-theme',
        providerBoundary: true,
        contextType: 'theme-density-preference-provider',
        publishes: [
          'xtend.theme.current',
          'xtend.theme.density',
          'xtend.theme.preferences',
          'xtend.theme.context',
          'xtend.theme.performanceSnapshot'
        ],
        consumers: ['xtend.component', 'xtend.xrouter', 'xtend.fabric-telemetry', 'rmt.shell-authoring'],
        propagation: {
          event: 'theme-context-changed',
          attributeBoundary: [THEME_ATTRIBUTE, DENSITY_ATTRIBUTE, 'data-xtend-motion', 'data-xtend-contrast'],
          scheduleRef: 'theme.propagate.context'
        },
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      });
    }

    constructor() {
      const initializeStart = this._now();
      this.availableThemes = { ...DEFAULT_THEMES };
      this.currentTheme = null;
      this.currentDensity = DEFAULT_DENSITY;
      this.themeContext = null;
      this.themeStyleElement = null;
      this.a11yStyleElement = null;
      this.announcerElement = null;
      this.externalThemes = {};
      this.externalThemeCss = {};
      this.appliedThemeVariables = new Set();
      this.appliedDensityVariables = new Set();
      this.performanceMeasurements = [];
      this.performanceCounters = {
        themeChanges: 0,
        densityChanges: 0,
        propagationEvents: 0,
        externalThemeLoads: 0
      };
      this._themeContextVersion = 0;
      this._subscribers = [];
      this._themeMediaQuery = this._createMediaQuery('(prefers-color-scheme: dark)');
      this._motionMediaQuery = this._createMediaQuery(MOTION_MEDIA_QUERY);
      this._forcedColorsMediaQuery = this._createMediaQuery(CONTRAST_MEDIA_QUERY);
      this.a11yPreferences = this._readPreferenceSnapshot();
      this._handleSystemThemeChange = this._handleSystemThemeChange.bind(this);
      this._handleMotionPreferenceChange = this._handleMotionPreferenceChange.bind(this);
      this._handleForcedColorsChange = this._handleForcedColorsChange.bind(this);

      this._initialize();
      this._recordPerformanceMeasurement('xtend.theme.initialize', initializeStart, {
        theme: this.currentTheme,
        density: this.currentDensity
      });
    }

    _now() {
      if (window.performance && typeof window.performance.now === 'function') {
        return window.performance.now();
      }

      return Date.now();
    }

    _resolvePerformanceBudget(name) {
      const budgets = ThemeManager.xtendScaffoldPerformanceProfile.budgetsMs;
      const map = {
        'xtend.theme.initialize': budgets.initialize,
        'xtend.theme.apply': budgets.themeApply,
        'xtend.theme.propagate': budgets.themePropagation,
        'xtend.theme.density': budgets.densityApply,
        'xtend.theme.external-css': budgets.externalCssHydration,
        'xtend.theme.notify': budgets.subscriberNotify
      };

      return map[name] || 16;
    }

    _recordPerformanceMeasurement(name, startedAt, metadata = {}) {
      const finishedAt = this._now();
      const durationMs = Math.max(0, Math.round((finishedAt - startedAt) * 100) / 100);
      const measurement = {
        schema: 'xtend.performance.measurement.v1',
        componentRef: 'x-theme',
        name,
        durationMs,
        budgetMs: this._resolvePerformanceBudget(name),
        withinBudget: durationMs <= this._resolvePerformanceBudget(name),
        theme: this.currentTheme,
        density: this.currentDensity,
        timestamp: Date.now(),
        metadata: { ...metadata }
      };

      this.performanceMeasurements.push(measurement);
      if (this.performanceMeasurements.length > 20) {
        this.performanceMeasurements.shift();
      }

      xstate.set('xtend.theme.performance.lastMeasurement', measurement);
      xstate.set('xtend.theme.performanceSnapshot', this.snapshotPerformance());
      document.dispatchEvent(new CustomEvent('theme-performance-measured', { detail: measurement }));
      return measurement;
    }

    _createMediaQuery(query) {
      if (typeof window.matchMedia === 'function') {
        try {
          return window.matchMedia(query);
        } catch (error) {
          console.warn(`XTheme: Media Query "${query}" konnte nicht gelesen werden:`, error);
        }
      }

      return {
        media: query,
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {}
      };
    }

    _addMediaListener(mediaQuery, handler) {
      if (!mediaQuery || typeof handler !== 'function') return;

      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handler);
        return;
      }

      if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(handler);
      }
    }

    _ensureA11yStyleElement() {
      this.a11yStyleElement = document.getElementById(THEME_A11Y_STYLES_ID);
      if (!this.a11yStyleElement) {
        this.a11yStyleElement = document.createElement('style');
        this.a11yStyleElement.id = THEME_A11Y_STYLES_ID;
        (document.head || document.documentElement).appendChild(this.a11yStyleElement);
      }

      this.a11yStyleElement.textContent = `
:root {
  --xtend-motion-duration-fast: 160ms;
  --xtend-motion-duration-base: 220ms;
  --xtend-motion-scale: 1;
  --xtend-forced-colors-mode: inactive;
  --xtend-density-scale: 1;
  --xtend-density-spacing: 0.75rem;
  --xtend-control-height: 2.5rem;
  --xtend-font-scale: 1;
}

:root[data-xtend-density="compact"] {
  --xtend-density-scale: 0.875;
  --xtend-density-spacing: 0.5rem;
  --xtend-control-height: 2.125rem;
  --xtend-font-scale: 0.95;
}

:root[data-xtend-density="comfortable"] {
  --xtend-density-scale: 1;
  --xtend-density-spacing: 0.75rem;
  --xtend-control-height: 2.5rem;
  --xtend-font-scale: 1;
}

:root[data-xtend-density="dense"] {
  --xtend-density-scale: 0.75;
  --xtend-density-spacing: 0.375rem;
  --xtend-control-height: 1.875rem;
  --xtend-font-scale: 0.925;
}

:root[data-xtend-motion="reduced"] {
  --xtend-motion-duration-fast: 0ms;
  --xtend-motion-duration-base: 0ms;
  --xtend-motion-scale: 0;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --xtend-motion-duration-fast: 0ms;
    --xtend-motion-duration-base: 0ms;
    --xtend-motion-scale: 0;
    scroll-behavior: auto;
  }

  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}

@media (forced-colors: active) {
  :root {
    forced-color-adjust: auto;
    --xtend-forced-colors-mode: active;
    --xtend-color-primary: Highlight;
    --xtend-color-primary-dark: Highlight;
    --xtend-color-accent: HighlightText;
    --xtend-surface: Canvas;
    --xtend-surface-muted: Canvas;
    --xtend-text: CanvasText;
    --xtend-border-color: CanvasText;
    --xtend-focus-outline: 2px solid Highlight;
    --xtend-overlay-bg: Canvas;
  }

  :focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
`;
    }

    _ensureAnnouncer() {
      this.announcerElement = document.getElementById(THEME_ANNOUNCER_ID);
      if (!this.announcerElement) {
        this.announcerElement = document.createElement('div');
        this.announcerElement.id = THEME_ANNOUNCER_ID;
        this.announcerElement.setAttribute('role', 'status');
        this.announcerElement.setAttribute('aria-live', 'polite');
        this.announcerElement.setAttribute('aria-atomic', 'true');
        this.announcerElement.setAttribute('data-xtend-theme-announcer', '');
        this.announcerElement.style.cssText = ANNOUNCER_STYLE;
        (document.body || document.documentElement).appendChild(this.announcerElement);
      }
    }

    _readPreferenceSnapshot() {
      return {
        prefersReducedMotion: Boolean(this._motionMediaQuery && this._motionMediaQuery.matches),
        forcedColors: Boolean(this._forcedColorsMediaQuery && this._forcedColorsMediaQuery.matches),
        colorScheme: this._themeMediaQuery && this._themeMediaQuery.matches ? 'dark' : 'light',
        motion: this._motionMediaQuery && this._motionMediaQuery.matches ? 'reduced' : 'default',
        contrast: this._forcedColorsMediaQuery && this._forcedColorsMediaQuery.matches ? 'forced-colors' : 'normal'
      };
    }

    _normalizeDensity(density) {
      if (SUPPORTED_DENSITIES.includes(density)) {
        return density;
      }

      return DEFAULT_DENSITY;
    }

    _clearAppliedDensityVariables() {
      for (const cssVariable of this.appliedDensityVariables) {
        document.documentElement.style.removeProperty(cssVariable);
      }
      this.appliedDensityVariables.clear();
    }

    _applyDensityTokens(density) {
      const normalizedDensity = this._normalizeDensity(density);
      const tokens = DENSITY_TOKENS[normalizedDensity] || DENSITY_TOKENS[DEFAULT_DENSITY];

      this._clearAppliedDensityVariables();
      document.documentElement.setAttribute(DENSITY_ATTRIBUTE, normalizedDensity);
      Object.entries(tokens).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
        this.appliedDensityVariables.add(key);
      });
      this.currentDensity = normalizedDensity;
      return normalizedDensity;
    }

    _syncPreferenceState(reason = 'runtime') {
      this.a11yPreferences = this._readPreferenceSnapshot();
      document.documentElement.setAttribute('data-xtend-motion', this.a11yPreferences.motion);
      document.documentElement.setAttribute('data-xtend-contrast', this.a11yPreferences.contrast);
      document.documentElement.setAttribute('data-xtend-forced-colors', this.a11yPreferences.forcedColors ? 'active' : 'inactive');

      xstate.set('xtend.theme.preferences', this.getA11yPreferences());
      xstate.set('xtend.theme.prefersReducedMotion', this.a11yPreferences.prefersReducedMotion);
      xstate.set('xtend.theme.forcedColors', this.a11yPreferences.forcedColors);
      xstate.set('xtend.a11y.motion', this.a11yPreferences.motion);
      xstate.set('xtend.a11y.contrast', this.a11yPreferences.contrast);
      xstate.set('xtend.theme.preferenceReason', reason);

      return this.a11yPreferences;
    }

    _dispatchPreferenceChange(reason) {
      this._syncThemeState(reason);
      const detail = {
        theme: this.currentTheme,
        density: this.currentDensity,
        availableThemes: this.getAvailableThemes(),
        preferences: this.getA11yPreferences(),
        themeContext: this.getThemeContext(),
        performanceSnapshot: this.snapshotPerformance(),
        reason
      };

      document.dispatchEvent(new CustomEvent('theme-preference-changed', { detail }));
      this._announceThemeChange(reason, detail);
      this._notifySubscribers(detail);
    }

    _announceThemeChange(reason, detail) {
      this._ensureAnnouncer();
      if (!this.announcerElement) return;

      const preferences = detail && detail.preferences ? detail.preferences : this.getA11yPreferences();
      const motionLabel = preferences.prefersReducedMotion ? 'reduced motion active' : 'default motion active';
      const contrastLabel = preferences.forcedColors ? 'forced colors active' : 'standard contrast active';
      this.announcerElement.textContent = `XTend theme ${this.currentTheme || 'system'} applied, ${motionLabel}, ${contrastLabel}.`;

      document.dispatchEvent(new CustomEvent('theme-a11y-announcement', {
        detail: {
          theme: this.currentTheme,
          reason,
          message: this.announcerElement.textContent,
          preferences
        }
      }));
    }

    _resolveColorScheme(themeName) {
      if (themeName === 'dark' || themeName === 'high-contrast') {
        return 'dark';
      }

      if (themeName === 'forced-colors') {
        return 'light dark';
      }

      return 'light';
    }

    _initialize() {
      const prefersDark = this._themeMediaQuery.matches;
      const savedThemeData = localStorage.getItem(STORAGE_KEY);
      let initialTheme = prefersDark ? 'dark' : 'light';
      let initialDensity = DEFAULT_DENSITY;

      if (savedThemeData) {
        try {
          const themeData = JSON.parse(savedThemeData);

          if (themeData && typeof themeData === 'object') {
            if (typeof themeData.name === 'string' && themeData.name) {
              initialTheme = themeData.name;
            }

            if (typeof themeData.density === 'string' && themeData.density) {
              initialDensity = this._normalizeDensity(themeData.density);
            }

            if (themeData.external && typeof themeData.external === 'object') {
              this.externalThemes = { ...themeData.external };
            }

            if (themeData.registry && typeof themeData.registry === 'object') {
              for (const [themeName, properties] of Object.entries(themeData.registry)) {
                if (properties && typeof properties === 'object') {
                  this.availableThemes[themeName] = { ...properties };
                } else if (!this.availableThemes[themeName]) {
                  this.availableThemes[themeName] = {};
                }
              }
            }
          }
        } catch (e) {
          console.warn('Gespeicherte Theme-Daten konnten nicht geladen werden:', e);
        }
      }

      if (!savedThemeData && this._forcedColorsMediaQuery.matches) {
        initialTheme = 'forced-colors';
      }

      this.themeStyleElement = document.getElementById(THEME_STYLES_ID);
      if (!this.themeStyleElement) {
        this.themeStyleElement = document.createElement('style');
        this.themeStyleElement.id = THEME_STYLES_ID;
        (document.head || document.documentElement).appendChild(this.themeStyleElement);
      }

      this._ensureA11yStyleElement();
      this._ensureAnnouncer();
      this._addMediaListener(this._themeMediaQuery, this._handleSystemThemeChange);
      this._addMediaListener(this._motionMediaQuery, this._handleMotionPreferenceChange);
      this._addMediaListener(this._forcedColorsMediaQuery, this._handleForcedColorsChange);
      this._applyDensityTokens(initialDensity);

      xstate.subscribe((key, value) => {
        if ((key === 'theme' || key === 'xtend.theme.current') && typeof value === 'string' && value !== this.currentTheme) {
          this.setTheme(value);
        }
        if (key === 'xtend.theme.density' && typeof value === 'string' && value !== this.currentDensity) {
          this.setDensity(value, { reason: 'xstate-sync' });
        }
      });

      this._syncPreferenceState('initialize');
      this._applyTheme(initialTheme, {
        reason: 'initialize',
        persist: Boolean(savedThemeData)
      });

      document.dispatchEvent(new CustomEvent('theme-initialized', {
        detail: {
          theme: initialTheme,
          density: this.currentDensity,
          availableThemes: this.getAvailableThemes(),
          preferences: this.getA11yPreferences(),
          a11yProfile: this.getA11yProfile(),
          performanceProfile: this.getPerformanceProfile(),
          themeContext: this.getThemeContext()
        }
      }));

      themeVerboseLog(`XTheme: Initialisiert mit Theme "${initialTheme}"`);
    }

    _handleSystemThemeChange(event) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        this._applyTheme(event.matches ? 'dark' : 'light', {
          reason: 'system-color-scheme',
          persist: false
        });
      }
    }

    _handleMotionPreferenceChange() {
      this._syncPreferenceState('prefers-reduced-motion');
      this._dispatchPreferenceChange('prefers-reduced-motion');
    }

    _handleForcedColorsChange(event) {
      this._syncPreferenceState('forced-colors');
      this._dispatchPreferenceChange('forced-colors');

      if (!localStorage.getItem(STORAGE_KEY)) {
        this._applyTheme(event.matches ? 'forced-colors' : (this._themeMediaQuery.matches ? 'dark' : 'light'), {
          reason: 'system-forced-colors',
          persist: false
        });
      }
    }

    _persistThemeData() {
      const themeData = {
        name: this.currentTheme,
        density: this.currentDensity,
        external: this.externalThemes,
        registry: this.availableThemes,
        preferences: this.getA11yPreferences()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(themeData));
    }

    _buildThemeContext(reason = 'runtime') {
      return {
        schema: THEME_CONTEXT_SCHEMA,
        componentRef: 'x-theme',
        theme: this.currentTheme,
        density: this.currentDensity,
        availableThemes: this.getAvailableThemes(),
        preferences: this.getA11yPreferences(),
        tokens: this.getDesignTokens(this.currentTheme),
        aliasLayer: this.getTokenAliasLayer(),
        densityTokens: { ...(DENSITY_TOKENS[this.currentDensity] || DENSITY_TOKENS[DEFAULT_DENSITY]) },
        attributes: {
          theme: THEME_ATTRIBUTE,
          density: DENSITY_ATTRIBUTE,
          motion: 'data-xtend-motion',
          contrast: 'data-xtend-contrast',
          forcedColors: 'data-xtend-forced-colors'
        },
        rmt: {
          adapter: ThemeManager.xtendRmtMetadata.adapter,
          shellAuthoring: ThemeManager.xtendRmtMetadata.shellAuthoring,
          kernelBoundary: ThemeManager.xtendRmtMetadata.kernelBoundary
        },
        fabric: {
          lane: ThemeManager.xtendScaffoldPerformanceProfile.lane,
          diagnosticsLane: ThemeManager.xtendScaffoldPerformanceProfile.fabric.diagnosticsLane,
          scheduleRef: 'theme.propagate.context'
        },
        propagationVersion: this._themeContextVersion,
        reason
      };
    }

    _syncThemeState(reason = 'runtime') {
      const propagationStart = this._now();
      const availableThemes = Object.keys(this.availableThemes);
      this._themeContextVersion += 1;
      this.themeContext = this._buildThemeContext(reason);
      this.performanceCounters.propagationEvents += 1;

      xstate.set('theme', this.currentTheme);
      xstate.set('xtend.theme.current', this.currentTheme);
      xstate.set('xtend.theme.density', this.currentDensity);
      xstate.set('themes', availableThemes);
      xstate.set('xtend.theme.available', availableThemes);
      xstate.set('xtend.theme.a11yProfile', this.getA11yProfile());
      xstate.set('xtend.theme.motionContrastPolicy', this.getMotionContrastPolicy());
      xstate.set('xtend.theme.performanceProfile', this.getPerformanceProfile());
      xstate.set('xtend.theme.rmtMetadata', this.getRmtMetadata());
      xstate.set('xtend.theme.componentNetwork', this.getComponentNetworkContext());
      xstate.set('xtend.theme.context', this.getThemeContext());

      document.dispatchEvent(new CustomEvent('theme-context-changed', {
        detail: this.getThemeContext()
      }));
      this._recordPerformanceMeasurement('xtend.theme.propagate', propagationStart, {
        reason,
        propagationVersion: this._themeContextVersion
      });
    }

    _clearAppliedThemeVariables() {
      for (const cssVariable of this.appliedThemeVariables) {
        document.documentElement.style.removeProperty(cssVariable);
      }
      this.appliedThemeVariables.clear();
    }

    _applyThemeVariables(themeName) {
      this._clearAppliedThemeVariables();

      const properties = this.availableThemes[themeName];
      if (!properties || typeof properties !== 'object') return;

      for (const [key, value] of Object.entries(properties)) {
        if (!key.startsWith('--') || value === undefined || value === null) continue;
        document.documentElement.style.setProperty(key, String(value));
        this.appliedThemeVariables.add(key);
      }
    }

    _applyExternalTheme(themeName) {
      if (!this.themeStyleElement) return;

      const cssUrl = this.externalThemes[themeName];
      if (!cssUrl) {
        this.themeStyleElement.textContent = '';
        return;
      }

      if (this.externalThemeCss[themeName]) {
        this.themeStyleElement.textContent = this.externalThemeCss[themeName];
        return;
      }

      this.themeStyleElement.textContent = '';
      this.loadExternalTheme(themeName, cssUrl).catch((error) => {
        console.error(`XTheme: Fehler beim Rehydrieren des externen Themes "${themeName}":`, error);
      });
    }

    _notifySubscribers(payload) {
      this._subscribers.forEach((subscriber) => {
        subscriber(payload);
      });
    }

    _applyTheme(themeName, options = {}) {
      const applyStart = this._now();
      if (!themeName || typeof themeName !== 'string') {
        console.error('Ungueltiges Theme:', themeName);
        return false;
      }

      if (!this.availableThemes[themeName]) {
        this.availableThemes[themeName] = {};
      }

      document.documentElement.setAttribute(THEME_ATTRIBUTE, themeName);
      document.documentElement.style.colorScheme = this._resolveColorScheme(themeName);
      this.currentTheme = themeName;
      this._syncPreferenceState(options.reason || 'theme-change');
      this._applyThemeVariables(themeName);
      this._applyDensityTokens(this.currentDensity);
      this._applyExternalTheme(themeName);
      this._syncThemeState(options.reason || 'theme-change');

      if (options.persist !== false) {
        this._persistThemeData();
      }

      this.performanceCounters.themeChanges += 1;
      this._recordPerformanceMeasurement('xtend.theme.apply', applyStart, {
        reason: options.reason || 'manual',
        externalCss: Boolean(this.externalThemes[themeName])
      });

      const detail = {
        theme: themeName,
        density: this.currentDensity,
        availableThemes: this.getAvailableThemes(),
        preferences: this.getA11yPreferences(),
        a11yProfile: this.getA11yProfile(),
        motionContrastPolicy: this.getMotionContrastPolicy(),
        performanceProfile: this.getPerformanceProfile(),
        themeContext: this.getThemeContext(),
        performanceSnapshot: this.snapshotPerformance(),
        reason: options.reason || 'manual'
      };

      document.dispatchEvent(new CustomEvent('theme-changed', { detail }));
      this._announceThemeChange(detail.reason, detail);
      this._notifySubscribers(detail);

      return true;
    }

    toggleDarkMode() {
      const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
      return this.setTheme(newTheme);
    }

    setTheme(themeName) {
      return this._applyTheme(themeName);
    }

    setDensity(density, options = {}) {
      const densityStart = this._now();
      const normalizedDensity = this._normalizeDensity(density);
      this._applyDensityTokens(normalizedDensity);
      this.performanceCounters.densityChanges += 1;
      this._syncThemeState(options.reason || 'density-change');

      if (options.persist !== false) {
        this._persistThemeData();
      }

      const measurement = this._recordPerformanceMeasurement('xtend.theme.density', densityStart, {
        requestedDensity: density,
        normalizedDensity,
        reason: options.reason || 'manual'
      });
      const detail = {
        theme: this.currentTheme,
        density: normalizedDensity,
        availableDensities: SUPPORTED_DENSITIES.slice(),
        themeContext: this.getThemeContext(),
        performanceSnapshot: this.snapshotPerformance(),
        measurement,
        reason: options.reason || 'manual'
      };

      document.dispatchEvent(new CustomEvent('theme-density-changed', { detail }));
      this._notifySubscribers(detail);
      return true;
    }

    set(name, value) {
      if (typeof name !== 'string' || !name) {
        return false;
      }

      if (name.startsWith('--')) {
        return this.setVariable(name, value);
      }

      return this.setTheme(name);
    }

    get(name) {
      if (typeof name !== 'string' || !name) {
        return this.getCurrentTheme();
      }

      if (name.startsWith('--')) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      }

      return this.getCurrentTheme();
    }

    subscribe(fn) {
      if (typeof fn !== 'function') {
        return () => {};
      }

      this._subscribers.push(fn);
      fn({
        theme: this.currentTheme,
        density: this.currentDensity,
        availableThemes: this.getAvailableThemes(),
        preferences: this.getA11yPreferences(),
        a11yProfile: this.getA11yProfile(),
        performanceProfile: this.getPerformanceProfile(),
        themeContext: this.getThemeContext(),
        performanceSnapshot: this.snapshotPerformance()
      });

      return () => {
        this._subscribers = this._subscribers.filter((subscriber) => subscriber !== fn);
      };
    }

    setVariable(name, value, themeName = this.currentTheme) {
      if (typeof name !== 'string' || !name.startsWith('--')) {
        console.error('Ungueltige CSS-Variable:', name);
        return false;
      }

      if (!themeName || typeof themeName !== 'string') {
        console.error('Ungueltiger Theme-Name fuer CSS-Variable:', themeName);
        return false;
      }

      if (!this.availableThemes[themeName]) {
        this.availableThemes[themeName] = {};
      }

      this.availableThemes[themeName][name] = String(value);

      if (themeName === this.currentTheme) {
        document.documentElement.style.setProperty(name, String(value));
        this.appliedThemeVariables.add(name);
      }

      this._syncThemeState();
      this._persistThemeData();

      const detail = {
        theme: themeName,
        density: this.currentDensity,
        name,
        value: String(value)
      };

      document.dispatchEvent(new CustomEvent('theme-variable-changed', { detail }));
      this._notifySubscribers({
        theme: this.currentTheme,
        availableThemes: this.getAvailableThemes(),
        variable: detail
      });

      return true;
    }

    setThemeVariable(themeName, name, value) {
      return this.setVariable(name, value, themeName);
    }

    registerTheme(name, properties = {}) {
      if (!name || typeof name !== 'string') {
        console.error('Ungueltiger Theme-Name:', name);
        return false;
      }

      const currentProperties = this.availableThemes[name] && typeof this.availableThemes[name] === 'object'
        ? this.availableThemes[name]
        : {};

      this.availableThemes[name] = {
        ...currentProperties,
        ...(properties && typeof properties === 'object' ? properties : {})
      };

      if (name === this.currentTheme) {
        this._applyThemeVariables(name);
      }

      this._syncThemeState();
      this._persistThemeData();
      themeVerboseLog(`XTheme: Theme "${name}" registriert`);
      return true;
    }

    async loadExternalTheme(themeName, cssUrl) {
      const loadStart = this._now();
      if (!themeName || !cssUrl) {
        throw new Error('Theme-Name und CSS-URL sind erforderlich');
      }

      if (this.externalThemes[themeName] === cssUrl && this.externalThemeCss[themeName]) {
        if (themeName === this.currentTheme && this.themeStyleElement) {
          this.themeStyleElement.textContent = this.externalThemeCss[themeName];
        }

        this._recordPerformanceMeasurement('xtend.theme.external-css', loadStart, {
          theme: themeName,
          cssUrl,
          cacheHit: true
        });
        return {
          theme: themeName,
          css: this.externalThemeCss[themeName],
          cssUrl
        };
      }

      const response = await fetch(cssUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const css = await response.text();
      this.externalThemes[themeName] = cssUrl;
      this.externalThemeCss[themeName] = css;
      this.performanceCounters.externalThemeLoads += 1;

      if (!this.availableThemes[themeName]) {
        this.availableThemes[themeName] = {};
      }

      if (themeName === this.currentTheme && this.themeStyleElement) {
        this.themeStyleElement.textContent = css;
        themeVerboseLog(`XTheme: Externes CSS fuer "${themeName}" geladen und angewendet`);
      } else {
        themeVerboseLog(`XTheme: Externes CSS fuer "${themeName}" geladen`);
      }

      this._syncThemeState();
      this._persistThemeData();
      this._recordPerformanceMeasurement('xtend.theme.external-css', loadStart, {
        theme: themeName,
        cssUrl,
        cacheHit: false,
        cssBytes: css.length
      });

      return { theme: themeName, css, cssUrl };
    }

    removeExternalTheme(themeName) {
      if (!this.externalThemes[themeName]) {
        return false;
      }

      delete this.externalThemes[themeName];
      delete this.externalThemeCss[themeName];

      if (themeName === this.currentTheme && this.themeStyleElement) {
        this.themeStyleElement.textContent = '';
      }

      this._persistThemeData();
      this._syncThemeState('external-theme-remove');
      themeVerboseLog(`XTheme: Externes CSS fuer "${themeName}" entfernt`);
      return true;
    }

    getCurrentTheme() {
      return this.currentTheme;
    }

    getAvailableThemes() {
      return Object.keys(this.availableThemes);
    }

    getAvailableDensities() {
      return SUPPORTED_DENSITIES.slice();
    }

    getDensity() {
      return this.currentDensity;
    }

    getThemeRegistry() {
      return { ...this.availableThemes };
    }

    getDesignTokens(themeName = this.currentTheme) {
      const resolvedTheme = typeof themeName === 'string' && themeName ? themeName : this.currentTheme;
      const properties = this.availableThemes[resolvedTheme];
      if (!properties || typeof properties !== 'object') {
        return {};
      }

      return { ...properties };
    }

    getDesignTokenContract() {
      const tokenNames = Array.from(new Set(Object.values(DEFAULT_THEMES).flatMap((theme) => Object.keys(theme))));
      const aliasLayer = this.getTokenAliasLayer();
      return {
        schema: DESIGN_TOKEN_CONTRACT_SCHEMA,
        packSchema: DESIGN_TOKEN_PACK_SCHEMA,
        workpackage: 'WP-E12-12',
        aliasLayerWorkpackage: 'ECH-WP-03',
        runtimeProvider: 'x-theme',
        namespace: '--xtend-',
        tokenNames,
        aliasLayer,
        themePacks: Object.keys(DEFAULT_THEMES).map((name) => ({
          schema: DESIGN_TOKEN_PACK_SCHEMA,
          type: 'theme',
          name,
          tokens: { ...DEFAULT_THEMES[name] }
        })),
        densityPacks: SUPPORTED_DENSITIES.map((name) => ({
          schema: DESIGN_TOKEN_PACK_SCHEMA,
          type: 'density',
          name,
          tokens: { ...(DENSITY_TOKENS[name] || {}) }
        })),
        cssParts: ['root', 'control', 'label', 'content', 'helper', 'error', 'icon', 'panel', 'overlay', 'backdrop', 'listbox', 'option', 'track', 'thumb', 'media'],
        highContrast: {
          themePacks: ['high-contrast', 'forced-colors'],
          systemColors: ['Canvas', 'CanvasText', 'Highlight', 'HighlightText'],
          focusToken: '--xtend-focus-outline'
        },
        localOnly: true,
        externalNetworkAllowed: false,
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      };
    }

    getTokenAliasLayer() {
      return {
        schema: XTHEME_TOKEN_ALIAS_LAYER_SCHEMA,
        workpackage: 'ECH-WP-03',
        runtimeProvider: 'x-theme',
        globalAliases: { ...XTHEME_ALIAS_GLOBAL_TOKENS },
        componentAliases: { ...XTHEME_ALIAS_COMPONENT_TOKENS },
        legacyAliases: {
          '--xtend-glass-bg': '--xtend-surface-overlay',
          '--xtend-shadow': '--xtend-elevation-2',
          '--xtend-radius': '--xtend-radius-md',
          '--xtend-font-family': '--xtend-font-family-body',
          '--xtend-overlay-bg': '--xtend-surface-overlay',
          '--xtend-border-color': '--xtend-border-subtle',
          '--header-bg': '--xtend-header-surface',
          '--header-fg': '--xtend-header-text',
          '--drawer-bg': '--xtend-drawer-surface',
          '--drawer-color': '--xtend-drawer-text',
          '--button-text-color': '--xtend-button-text'
        },
        p0Components: [
          'x-theme',
          'x-header',
          'x-icon',
          'x-button',
          'x-menu',
          'x-drawer',
          'x-side-panel',
          'x-modal',
          'x-dialog',
          'x-popover',
          'x-toast'
        ],
        overrideContract: {
          cssEntry: 'XTend.css',
          themeEntry: 'x-theme.registerTheme()',
          noComponentLocalThemeForks: true,
          forcedColorsRequired: true
        }
      };
    }

    getA11yProfile() {
      return ThemeManager.xtendScaffoldA11yProfile;
    }

    getMotionContrastPolicy() {
      return ThemeManager.xtendMotionContrastPolicy;
    }

    getPerformanceProfile() {
      return ThemeManager.xtendScaffoldPerformanceProfile;
    }

    getRmtMetadata() {
      return ThemeManager.xtendRmtMetadata;
    }

    getComponentNetworkContext() {
      return ThemeManager.xtendComponentNetworkContract;
    }

    getThemeContext() {
      const context = this.themeContext || this._buildThemeContext('snapshot');
      return {
        ...context,
        availableThemes: context.availableThemes.slice(),
        preferences: { ...context.preferences },
        tokens: { ...context.tokens },
        aliasLayer: {
          ...context.aliasLayer,
          globalAliases: { ...context.aliasLayer.globalAliases },
          componentAliases: { ...context.aliasLayer.componentAliases },
          legacyAliases: { ...context.aliasLayer.legacyAliases }
        },
        densityTokens: { ...context.densityTokens },
        attributes: { ...context.attributes },
        rmt: {
          ...context.rmt,
          shellAuthoring: { ...context.rmt.shellAuthoring }
        },
        fabric: { ...context.fabric }
      };
    }

    snapshotPerformance() {
      return {
        schema: THEME_PERFORMANCE_SNAPSHOT_SCHEMA,
        componentRef: 'x-theme',
        theme: this.currentTheme,
        density: this.currentDensity,
        counters: { ...this.performanceCounters },
        profile: this.getPerformanceProfile(),
        lastMeasurements: this.performanceMeasurements.slice(-8),
        contextVersion: this._themeContextVersion,
        timestamp: Date.now()
      };
    }

    getA11yPreferences() {
      return { ...this.a11yPreferences };
    }

    getMotionPreference() {
      return this.a11yPreferences.motion;
    }

    getContrastPreference() {
      return this.a11yPreferences.contrast;
    }

    hasExternalCSS(themeName) {
      return !!this.externalThemes[themeName];
    }
  }

  const themeManager = new ThemeManager();

  window.XTend = window.XTend || {};
  window.XTend.theme = themeManager;
  window.XTend.toggleDarkMode = () => themeManager.toggleDarkMode();
  window.XTheme = themeManager;
})();

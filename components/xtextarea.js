import { xtendState } from './xtend-state.js';
import { createXtendRmtCommandDetail } from './rmt-command.js';

const XTEXTAREA_LANGUAGE_ALIASES = Object.freeze({
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
  md: 'markdown',
  plaintext: 'text',
  plain: 'text',
  txt: 'text',
  'rmt-vnext': 'rmt',
  xtendrmt: 'rmt'
});
function createTextareaPayload(host, extra = {}) {
  const value = host.value;
  const trimmedLength = value.trim().length;
  return {
    value,
    length: value.length,
    trimmedLength,
    empty: trimmedLength === 0,
    maxLength: host.maxLength,
    source: 'x-textarea',
    ...extra
  };
}

function getGlobalTarget() {
  if (typeof window !== 'undefined') return window;
  if (typeof globalThis !== 'undefined') return globalThis;
  return {};
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

function normalizeLanguage(value) {
  const raw = String(value || 'text').trim().toLowerCase();
  return XTEXTAREA_LANGUAGE_ALIASES[raw] || raw || 'text';
}

function isBooleanAttributeEnabled(value) {
  if (value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return !['false', '0', 'off', 'no'].includes(normalized);
}

function safeHighlightResult(result, fallbackCode, fallbackLanguage) {
  if (!result || typeof result.html !== 'string') {
    return {
      html: escapeHtml(fallbackCode),
      highlighted: false,
      engine: 'plain-text',
      language: fallbackLanguage
    };
  }
  return {
    html: result.html,
    highlighted: result.highlighted === true,
    engine: result.engine || (result.highlighted ? 'prism' : 'plain-text'),
    language: result.language || fallbackLanguage
  };
}

function callHighlighter(provider, input) {
  if (!provider) return null;
  try {
    if (typeof provider === 'function') return provider(input);
    if (typeof provider.highlight === 'function') return provider.highlight(input);
  } catch (error) {
    return {
      html: escapeHtml(input.code),
      highlighted: false,
      engine: 'plain-text',
      language: input.language,
      error: error && error.message ? error.message : String(error)
    };
  }
  return null;
}

class XTextarea extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ['name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'maxlength', 'minlength', 'rows', 'label', 'busy', 'invalid', 'density', 'fill', 'submit-on-enter', 'submit-command', 'syntax-highlight', 'highlight', 'line-numbering', 'lang', 'language'];
  }

  static registerHighlighter(provider) {
    this._highlighter = provider || null;
    return this._highlighter;
  }

  static getHighlighter() {
    return this._highlighter || null;
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-textarea',
      maturity: 'stable',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-textarea/x-textarea.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xtextarea.js',
        declaration: 'components/xtextarea.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'user-blocking'
      },
      publicApi: {
        attributes: XTextarea.observedAttributes,
        slots: ['label', 'hint', 'error'],
        events: ['textarea-changed', 'textarea-invalid', 'textarea-submit', 'xtend-command'],
        eventPayloads: {
          'textarea-changed': 'XTextareaChangedEventDetail',
          'textarea-invalid': 'XTextareaInvalidEventDetail',
          'textarea-submit': 'XTextareaSubmitEventDetail',
          'xtend-command': 'XTextareaCommandEventDetail'
        },
        methods: ['checkValidity', 'reportValidity', 'validate', 'reset', 'focus', 'snapshot']
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-textarea',
      schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'user-blocking' },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
      attributes: XTextarea.observedAttributes,
      slots: ['label', 'hint', 'error'],
      events: ['textarea-changed', 'textarea-invalid', 'textarea-submit', 'xtend-command'],
      eventPayloads: {
        'textarea-changed': 'XTextareaChangedEventDetail',
        'textarea-invalid': 'XTextareaInvalidEventDetail',
        'textarea-submit': 'XTextareaSubmitEventDetail',
        'xtend-command': 'XTextareaCommandEventDetail'
      },
      methods: ['checkValidity', 'reportValidity', 'validate', 'reset', 'focus', 'snapshot']
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-textarea',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-textarea',
      role: 'textbox',
      accessibleName: 'required',
      focusStrategy: 'native-textarea-focus',
      keyboard: ['Tab', 'Shift+Tab', 'Enter'],
      screenreader: {
        signalContract: XTextarea.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XTextarea.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-textarea',
      budgetClass: 'interactive-medium',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'hydrate', 'event'],
      cleanup: ['xtend-state-subscription', 'input-listeners']
    };
  }

  static get xtendFormControlUxProfile() {
    return {
      schema: 'xtend.component.form-control-ux-profile.v1',
      componentRef: 'x-textarea',
      family: 'text-entry',
      role: 'textbox',
      valueMode: 'string',
      slots: ['label', 'hint', 'error'],
      parts: ['root', 'editor', 'control', 'highlight', 'highlight-code', 'line-numbers', 'line-number', 'label', 'helper', 'error'],
      events: ['xtend-command', 'textarea-changed', 'textarea-invalid', 'textarea-submit'],
      commands: ['focus', 'validate', 'reset', 'set-value', 'announce-error'],
      stateKey: 'xtextarea-value-<id>',
      schedule: 'ui.user-blocking.input',
      fabric: { lane: 'user-blocking', a11yLane: 'a11y' },
      rmt: XTextarea.xtendRmtMetadata,
      signatureDesign: {
        note: 'Enterprise multiline field with measured writing surface, live status rhythm and density-safe metadata.',
        tokenStrategy: 'form tokens map label, control, helper, error, status, focus, disabled, busy and density states.',
        themeExpectation: 'host applications can restyle writing surface, helper, counter and validation independently.'
      },
      densityProfiles: ['comfortable', 'compact', 'dense'],
      states: ['required', 'disabled', 'readonly', 'busy', 'invalid'],
      syntaxHighlighting: {
        engine: 'prism',
        attributes: ['syntax-highlight', 'lang', 'language'],
        tokenParity: 'x-code',
        lineNumbering: {
          attribute: 'line-numbering',
          values: ['true', 'false']
        }
      },
      validation: { validityApi: true, errorRegion: 'role=alert aria-live=assertive' }
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-textarea',
      liveRegion: 'polite',
      signals: ['validation-error-summary', 'character-count-announcement'],
      statusRegions: ['role=status', 'aria-live=polite'],
      errorRegions: ['role=alert', 'aria-live=assertive'],
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.announce',
        scheduleRef: 'a11y.user-blocking.announce'
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: 'xtend.a11y.motion-contrast-policy.v1',
      componentRef: 'x-textarea',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'validation-without-motion-only-feedback',
        noMotionOnlyState: true
      },
      contrast: {
        schema: 'xtend.a11y.contrast-policy.v1',
        mediaQuery: '(forced-colors: active)',
        highContrast: 'required',
        forcedColorAdjust: 'auto',
        focusVisible: 'required',
        nonColorStatus: 'required'
      },
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.preference',
        scheduleRef: 'a11y.user-blocking.preference'
      }
    };
  }

  constructor() {
    super();
    this._internals = this.attachInternals?.();
    this._unsubscribeState = null;
    this._lastHighlightSnapshot = {
      highlighted: false,
      highlightEngine: 'plain-text',
      highlightLanguage: 'text',
      languageAlias: 'default'
    };
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: grid;
          grid-template-rows: auto minmax(var(--xtend-form-control-min-height), auto) auto auto;
          box-sizing: border-box;
          min-width: 0;
          max-width: 100%;
          color: var(--xtend-form-text, var(--text-color, #111827));
          font-family: var(--xtend-form-font-family, var(--xtend-font-family-body, inherit));
          font-size: var(--xtend-form-control-font-size, 1rem);
          --xtend-form-control-min-height: var(--xtend-form-density-control-min-height, var(--textarea-min-height, 7rem));
          --xtend-form-control-padding: var(--xtend-form-density-padding, 0.7rem 0.85rem);
          --xtend-form-control-gap: var(--xtend-form-gap, 0.35rem);
          --xtend-form-icon-color: var(--xtend-form-control-text, currentColor);
          --xtend-textarea-code-font-family: var(--x-code-font-family, var(--xtend-layout-font-family, 'Inter', 'Fira Mono', 'Menlo', 'Consolas', monospace));
          --xtend-textarea-code-font-size: var(--x-code-font-size, inherit);
          --xtend-textarea-highlight-caret: var(--xtend-form-control-text, var(--x-code-text, var(--text-color, #111827)));
          --xtend-textarea-highlight-selection: color-mix(in srgb, var(--primary-color, #2563eb) 28%, transparent);
          --xtend-textarea-line-number-width: 3.4rem;
          --xtend-textarea-line-number-gap: 0.75rem;
          --xtend-textarea-line-number-text: var(--xtend-form-helper-text, var(--muted-color, #6b7280));
          --xtend-textarea-line-number-border: color-mix(in srgb, var(--xtend-form-border-color, var(--border-color, #9ca3af)) 62%, transparent);
          --xtend-textarea-line-number-surface: color-mix(in srgb, var(--xtend-form-control-surface, var(--input-bg, #fff)) 92%, var(--xtend-form-text, #111827));
        }
        :host([fill]) {
          height: 100%;
          min-height: 0;
          grid-template-rows: auto minmax(0, 1fr) auto auto;
        }
        :host([density="comfortable"]) {
          --xtend-form-density-control-min-height: 8rem;
          --xtend-form-density-padding: 0.85rem 1rem;
          --xtend-form-gap: 0.45rem;
        }
        :host([density="compact"]) {
          --xtend-form-density-control-min-height: 6.25rem;
          --xtend-form-density-padding: 0.6rem 0.75rem;
          --xtend-form-gap: 0.3rem;
        }
        :host([density="dense"]) {
          --xtend-form-density-control-min-height: 4.75rem;
          --xtend-form-density-padding: 0.45rem 0.65rem;
          --xtend-form-gap: 0.2rem;
          font-size: var(--xtend-form-dense-font-size, 0.92rem);
        }
        label {
          display: block;
          margin-bottom: var(--xtend-form-control-gap);
          color: var(--xtend-form-label-text, var(--xtend-form-text));
          font-size: var(--xtend-form-label-font-size, 0.92rem);
          font-weight: var(--xtend-form-label-font-weight, 650);
          overflow-wrap: anywhere;
        }
        .editor {
          position: relative;
          display: block;
          min-width: 0;
          min-height: var(--xtend-form-control-min-height);
          box-sizing: border-box;
        }
        :host([fill]) .editor {
          height: 100%;
          min-height: 0;
        }
        .highlight-layer {
          display: none;
          position: absolute;
          inset: 0;
          z-index: 0;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          min-height: var(--xtend-form-control-min-height);
          margin: 0;
          padding: var(--xtend-form-control-padding);
          border: var(--xtend-form-border-width, 1px) solid transparent;
          border-radius: var(--xtend-form-radius, var(--xtend-control-radius, var(--border-radius, 0.5rem)));
          background: transparent;
          color: var(--x-code-text, var(--xtend-layout-text, #f8fafc));
          font: inherit;
          line-height: var(--xtend-form-control-line-height, 1.45);
          white-space: pre-wrap;
          overflow: auto;
          overflow-wrap: anywhere;
          word-break: break-word;
          pointer-events: none;
          scrollbar-width: none;
        }
        .highlight-layer::-webkit-scrollbar {
          display: none;
        }
        .line-numbers {
          display: none;
          position: absolute;
          inset-block: 0;
          inset-inline-start: 0;
          z-index: 2;
          box-sizing: border-box;
          width: var(--xtend-textarea-line-number-width);
          min-height: var(--xtend-form-control-min-height);
          padding: var(--xtend-form-control-padding);
          padding-inline-start: 0.35rem;
          padding-inline-end: 0.7rem;
          border-inline-end: 1px solid var(--xtend-textarea-line-number-border);
          background: var(--xtend-textarea-line-number-surface);
          color: var(--xtend-textarea-line-number-text);
          font-family: var(--xtend-textarea-code-font-family);
          font-size: var(--xtend-textarea-code-font-size);
          line-height: var(--xtend-form-control-line-height, 1.45);
          text-align: end;
          overflow: hidden;
          pointer-events: none;
          user-select: none;
          scrollbar-width: none;
        }
        .line-numbers::-webkit-scrollbar {
          display: none;
        }
        .line-number-list {
          display: block;
          min-width: 100%;
        }
        .line-number-list span {
          display: block;
          white-space: nowrap;
        }
        .highlight-layer code {
          display: block;
          min-width: 100%;
          background: none;
          color: inherit;
          font: inherit;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .token.comment {
          color: var(--x-code-token-comment, #8b949e);
          font-style: italic;
        }
        .token.string {
          color: var(--x-code-token-string, #a5d6ff);
        }
        .token.number,
        .token.boolean {
          color: var(--x-code-token-number, #79c0ff);
        }
        .token.keyword,
        .token.rmt-primitive,
        .token.rmt-lifecycle,
        .token.rmt-boundary {
          color: var(--x-code-token-keyword, #ff7b72);
        }
        .token.function,
        .token.rmt-action {
          color: var(--x-code-token-function, #d2a8ff);
        }
        .token.property,
        .token.variable,
        .token.rmt-identifier,
        .token.rmt-reference {
          color: var(--x-code-token-property, #ffa657);
        }
        .token.class-name,
        .token.rmt-component {
          color: var(--x-code-token-class, #7ee787);
        }
        .token.operator,
        .token.punctuation {
          color: var(--x-code-token-punctuation, #c9d1d9);
        }
        textarea {
          position: relative;
          z-index: 1;
          display: block;
          box-sizing: border-box;
          width: 100%;
          min-height: var(--xtend-form-control-min-height);
          padding: var(--xtend-form-control-padding);
          border: var(--xtend-form-border-width, 1px) solid var(--xtend-form-border-color, var(--xtend-control-border, var(--border-color, #9ca3af)));
          border-radius: var(--xtend-form-radius, var(--xtend-control-radius, var(--border-radius, 0.5rem)));
          background: var(--xtend-form-control-surface, var(--xtend-control-bg, var(--input-bg, #fff)));
          color: var(--xtend-form-control-text, var(--xtend-control-color, var(--text-color, #111827)));
          font: inherit;
          line-height: var(--xtend-form-control-line-height, 1.45);
          color-scheme: inherit;
          box-shadow: var(--xtend-form-control-shadow, 0 1px 2px rgba(15, 23, 42, 0.06));
          resize: var(--textarea-resize, vertical);
          transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }
        :host([syntax-highlight]) .editor,
        :host([highlight]) .editor,
        :host([line-numbering]) .editor {
          border: var(--xtend-form-border-width, 1px) solid var(--xtend-form-border-color, var(--xtend-control-border, var(--border-color, #9ca3af)));
          border-radius: var(--xtend-form-radius, var(--xtend-control-radius, var(--border-radius, 0.5rem)));
          background: var(--x-code-bg, var(--xtend-layout-surface, var(--docs-code-bg, var(--xtend-form-control-surface, var(--xtend-control-bg, var(--input-bg, #fff))))));
          box-shadow: var(--xtend-form-control-shadow, 0 1px 2px rgba(15, 23, 42, 0.06));
          overflow: hidden;
        }
        :host([syntax-highlight]) .highlight-layer,
        :host([highlight]) .highlight-layer {
          display: block;
        }
        :host([line-numbering]) .line-numbers {
          display: block;
        }
        :host([syntax-highlight]) textarea,
        :host([highlight]) textarea,
        :host([syntax-highlight]) .highlight-layer,
        :host([highlight]) .highlight-layer,
        :host([line-numbering]) .line-numbers,
        :host([syntax-highlight]) .highlight-layer code,
        :host([highlight]) .highlight-layer code {
          font-family: var(--xtend-textarea-code-font-family);
          font-size: var(--xtend-textarea-code-font-size);
          line-height: var(--xtend-form-control-line-height, 1.45);
          tab-size: var(--x-code-tab-size, 2);
        }
        :host([syntax-highlight]) textarea,
        :host([highlight]) textarea,
        :host([line-numbering]) textarea {
          border-color: transparent;
          background: transparent;
          box-shadow: none;
        }
        :host([syntax-highlight]) textarea,
        :host([highlight]) textarea {
          color: transparent;
          caret-color: var(--xtend-textarea-highlight-caret);
          -webkit-text-fill-color: transparent;
        }
        :host([line-numbering]) textarea,
        :host([line-numbering]) .highlight-layer {
          padding-inline-start: calc(var(--xtend-textarea-line-number-width) + var(--xtend-textarea-line-number-gap));
        }
        :host([syntax-highlight]) textarea::selection,
        :host([highlight]) textarea::selection {
          background: var(--xtend-textarea-highlight-selection);
          color: transparent;
          -webkit-text-fill-color: transparent;
        }
        :host([syntax-highlight]) textarea::placeholder,
        :host([highlight]) textarea::placeholder {
          color: var(--xtend-form-placeholder-text, var(--muted-color, #6b7280));
          -webkit-text-fill-color: var(--xtend-form-placeholder-text, var(--muted-color, #6b7280));
          opacity: 1;
        }
        :host([fill]) textarea {
          height: 100%;
          min-height: 0;
        }
        textarea:focus {
          outline: var(--xtend-form-focus-ring, var(--xtend-control-focus, var(--focus-outline, 2px solid var(--primary-color, #2563eb))));
          outline-offset: var(--xtend-form-focus-offset, 2px);
          border-color: var(--xtend-form-focus-border-color, var(--primary-color, #2563eb));
        }
        :host([syntax-highlight]:focus-within) .editor,
        :host([highlight]:focus-within) .editor,
        :host([line-numbering]:focus-within) .editor {
          outline: var(--xtend-form-focus-ring, var(--xtend-control-focus, var(--focus-outline, 2px solid var(--primary-color, #2563eb))));
          outline-offset: var(--xtend-form-focus-offset, 2px);
          border-color: var(--xtend-form-focus-border-color, var(--primary-color, #2563eb));
        }
        :host([invalid]) textarea {
          border-color: var(--xtend-form-error-border, var(--error-color, #dc2626));
          box-shadow: var(--xtend-form-error-shadow, inset 0 0 0 1px var(--xtend-form-error-border, var(--error-color, #dc2626)));
        }
        :host([invalid][syntax-highlight]) .editor,
        :host([invalid][highlight]) .editor,
        :host([invalid][line-numbering]) .editor {
          border-color: var(--xtend-form-error-border, var(--error-color, #dc2626));
          box-shadow: var(--xtend-form-error-shadow, inset 0 0 0 1px var(--xtend-form-error-border, var(--error-color, #dc2626)));
        }
        .meta {
          display: flex;
          justify-content: space-between;
          gap: var(--xtend-form-gap, 1rem);
          margin-top: var(--xtend-form-control-gap);
          font-size: var(--xtend-form-helper-font-size, 0.875rem);
          color: var(--xtend-form-helper-text, var(--muted-color, #6b7280));
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .error {
          display: none;
          margin-top: var(--xtend-form-control-gap);
          color: var(--xtend-form-error-text, var(--error-color, #b42318));
          background: var(--xtend-form-error-surface, transparent);
          border-inline-start: var(--xtend-form-error-marker-width, 3px) solid var(--xtend-form-error-border, currentColor);
          border-radius: var(--xtend-form-error-radius, 0.35rem);
          padding: var(--xtend-form-error-padding, 0.25rem 0 0.25rem 0.55rem);
          font-size: var(--xtend-form-helper-font-size, 0.875rem);
          font-weight: var(--xtend-form-error-font-weight, 600);
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        :host([invalid]) .error {
          display: block;
        }
        :host([disabled]),
        :host([busy]) {
          opacity: var(--xtend-form-disabled-opacity, 0.72);
        }
        :host([busy]) textarea {
          cursor: progress;
          border-style: dashed;
        }
        :host([busy][syntax-highlight]) .editor,
        :host([busy][highlight]) .editor,
        :host([busy][line-numbering]) .editor {
          cursor: progress;
          border-style: dashed;
        }
        :host([disabled]) textarea,
        :host([readonly]) textarea {
          background: var(--xtend-form-disabled-surface, color-mix(in srgb, var(--xtend-form-control-surface, #fff) 78%, var(--xtend-form-text, #111827)));
        }
        :host([disabled][syntax-highlight]) textarea,
        :host([readonly][syntax-highlight]) textarea,
        :host([disabled][highlight]) textarea,
        :host([readonly][highlight]) textarea,
        :host([disabled][line-numbering]) textarea,
        :host([readonly][line-numbering]) textarea {
          background: transparent;
        }
        @media (prefers-reduced-motion: reduce) {
          textarea,
          .highlight-layer,
          .line-numbers,
          .error,
          .meta {
            transition: none !important;
            animation: none !important;
          }
        }
        @media (forced-colors: active) {
          textarea,
          .highlight-layer,
          .line-numbers,
          .error,
          .meta {
            forced-color-adjust: auto;
          }
          textarea {
            color: FieldText;
            background: Field;
            border-color: FieldText;
          }
          :host([syntax-highlight]) .editor,
          :host([highlight]) .editor {
            background: Field;
            border-color: FieldText;
          }
          :host([syntax-highlight]) .highlight-layer,
          :host([highlight]) .highlight-layer,
          :host([line-numbering]) .line-numbers {
            color: FieldText;
          }
          :host([syntax-highlight]) textarea,
          :host([highlight]) textarea {
            background: transparent;
            border-color: transparent;
            caret-color: FieldText;
          }
          textarea:focus {
            outline-color: Highlight;
          }
          .error {
            color: MarkText;
            background: Mark;
            border: 1px solid MarkText;
            padding: 0.25rem;
          }
        }
      </style>
      <label id="label" part="label" for="control"><slot name="label"><span id="label-text"></span></slot></label>
      <div class="editor" part="editor">
        <div id="line-numbers" class="line-numbers" part="line-numbers" aria-hidden="true"><div id="line-number-list" class="line-number-list"></div></div>
        <pre id="highlight" class="highlight-layer" part="highlight syntax" aria-hidden="true"><code id="highlight-code" part="highlight-code syntax-code"></code></pre>
        <textarea id="control" part="control" aria-describedby="hint counter error" spellcheck="false"></textarea>
      </div>
      <div class="meta" part="helper">
        <div id="hint"><slot name="hint"></slot></div>
        <div id="counter" part="status" role="status" aria-live="polite" aria-atomic="true"></div>
      </div>
      <div id="error" class="error" part="error status" role="alert" aria-live="assertive" aria-atomic="true"><slot name="error">Enter a valid value.</slot></div>
    `;
    this._control = this.shadowRoot.querySelector('#control');
    this._highlightLayer = this.shadowRoot.querySelector('#highlight');
    this._highlightCode = this.shadowRoot.querySelector('#highlight-code');
    this._lineNumbers = this.shadowRoot.querySelector('#line-numbers');
    this._lineNumberList = this.shadowRoot.querySelector('#line-number-list');
    this._labelText = this.shadowRoot.querySelector('#label-text');
    this._counter = this.shadowRoot.querySelector('#counter');
    this._lastLineNumberCount = 0;
    this._onInput = this._onInput.bind(this);
    this._onInvalid = this._onInvalid.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
    this._onScroll = this._onScroll.bind(this);
  }

  connectedCallback() {
    if (!this.id) this.id = `xtextarea-${Math.random().toString(36).slice(2, 10)}`;
    this._upgradeProperty('value');
    this._upgradeProperty('lineNumbering');
    this._upgradeAttributes();
    this._syncFormValue();
    this._syncCounter();
    this._syncHighlight();
    this._syncLineNumbers();
    this._control.addEventListener('input', this._onInput);
    this._control.addEventListener('invalid', this._onInvalid);
    this._control.addEventListener('keydown', this._onKeydown);
    this._control.addEventListener('scroll', this._onScroll, { passive: true });
    xtendState.set(`xtextarea-value-${this.id}`, this.value);
    this._unsubscribeState = xtendState.subscribe((key, value) => {
      if (key === `xtextarea-value-${this.id}` && typeof value === 'string' && value !== this.value) {
        this.value = value;
      }
    }, `xtextarea-value-${this.id}`);
  }

  disconnectedCallback() {
    this._control.removeEventListener('input', this._onInput);
    this._control.removeEventListener('invalid', this._onInvalid);
    this._control.removeEventListener('keydown', this._onKeydown);
    this._control.removeEventListener('scroll', this._onScroll);
    if (this._unsubscribeState) this._unsubscribeState();
  }

  _upgradeAttributes() {
    XTextarea.observedAttributes.forEach((attribute) => {
      if (this.hasAttribute(attribute)) {
        this.attributeChangedCallback(attribute, null, this.getAttribute(attribute));
      }
    });
  }

  _upgradeProperty(propertyName) {
    if (!Object.prototype.hasOwnProperty.call(this, propertyName)) return;
    const value = this[propertyName];
    delete this[propertyName];
    this[propertyName] = value;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._control || oldValue === newValue) return;
    if (name === 'value') {
      this._control.value = newValue || '';
      this._syncFormValue();
      this._syncCounter();
      this._syncHighlight();
      this._syncLineNumbers();
      return;
    }
    if (['required', 'disabled', 'readonly'].includes(name)) {
      const propertyName = name === 'readonly' ? 'readOnly' : name;
      this._control[propertyName] = this.hasAttribute(name);
      if (name === 'required') this._control.setAttribute('aria-required', String(this.hasAttribute(name)));
      if (name === 'disabled') this.setAttribute('aria-disabled', String(this.hasAttribute(name)));
      this._syncFormValue();
      return;
    }
    if (name === 'busy') {
      this._control.setAttribute('aria-busy', String(this.hasAttribute('busy')));
      return;
    }
    if (name === 'invalid') {
      this._control.setAttribute('aria-invalid', String(this.hasAttribute('invalid')));
      return;
    }
    if (['name', 'placeholder', 'maxlength', 'minlength', 'rows'].includes(name)) {
      if (newValue == null) this._control.removeAttribute(name);
      else this._control.setAttribute(name, newValue);
      this._syncFormValue();
      this._syncCounter();
      this._syncHighlight();
      this._syncLineNumbers();
      return;
    }
    if (name === 'label') {
      this._labelText.textContent = newValue || '';
      return;
    }
    if (['syntax-highlight', 'highlight', 'lang', 'language'].includes(name)) {
      this._syncHighlight();
      return;
    }
    if (name === 'line-numbering') {
      if (newValue != null && !isBooleanAttributeEnabled(newValue)) {
        this.removeAttribute('line-numbering');
        return;
      }
      this._syncLineNumbers();
      this._syncHighlightScroll();
    }
  }

  _onInput() {
    this._syncFormValue();
    this._syncCounter();
    this._syncHighlight();
    this._syncLineNumbers();
    this.dispatchEvent(new CustomEvent('textarea-changed', {
      detail: createTextareaPayload(this, {
        highlighted: this._lastHighlightSnapshot.highlighted === true,
        highlightEngine: this._lastHighlightSnapshot.highlightEngine,
        highlightLanguage: this._lastHighlightSnapshot.highlightLanguage
      }),
      bubbles: true,
      composed: true
    }));
    this.dispatchEvent(new CustomEvent('xtend-command', {
      detail: createXtendRmtCommandDetail(this, 'textarea-changed', createTextareaPayload(this, {
        highlighted: this._lastHighlightSnapshot.highlighted === true,
        highlightEngine: this._lastHighlightSnapshot.highlightEngine,
        highlightLanguage: this._lastHighlightSnapshot.highlightLanguage
      }), { fallbackId: 'x-textarea' }),
      bubbles: true,
      composed: true,
      cancelable: true
    }));
    xtendState.set(`xtextarea-value-${this.id}`, this.value);
  }

  _onInvalid() {
    this.setAttribute('invalid', '');
    this._control.setAttribute('aria-invalid', 'true');
    this.dispatchEvent(new CustomEvent('textarea-invalid', {
      detail: { value: this.value, message: this._control.validationMessage, source: 'x-textarea' },
      bubbles: true,
      composed: true
    }));
  }

  _onKeydown(event) {
    if (!this._isSubmitOnEnterEnabled()) return;
    if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    if (this.hasAttribute('disabled') || this.hasAttribute('readonly')) return;
    event.preventDefault();
    const submitEvent = new CustomEvent('textarea-submit', {
      detail: createTextareaPayload(this),
      bubbles: true,
      composed: true,
      cancelable: true
    });
    const shouldSubmit = this.dispatchEvent(submitEvent);
    if (!shouldSubmit) return;
    this.dispatchEvent(new CustomEvent('xtend-command', {
      detail: createXtendRmtCommandDetail(this, 'textarea-submit', createTextareaPayload(this), {
        fallbackId: 'x-textarea',
        command: () => this.getAttribute('submit-command') || this.dataset.submitCommand || ''
      }),
      bubbles: true,
      composed: true,
      cancelable: true
    }));
    const form = this._internals?.form || this.closest('form');
    if (form && typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  }

  _onScroll() {
    this._syncHighlightScroll();
  }

  _isSubmitOnEnterEnabled() {
    return isBooleanAttributeEnabled(this.getAttribute('submit-on-enter'));
  }

  _isLineNumberingEnabled() {
    return isBooleanAttributeEnabled(this.getAttribute('line-numbering'));
  }

  _getLanguageMeta() {
    const langAttribute = this.getAttribute('lang');
    const languageAttribute = this.getAttribute('language');
    const raw = langAttribute || languageAttribute || 'text';
    return {
      language: normalizeLanguage(raw),
      rawLanguage: raw,
      alias: langAttribute ? 'lang' : (languageAttribute ? 'language' : 'default')
    };
  }

  _isHighlightEnabled() {
    return this.hasAttribute('syntax-highlight') || this.hasAttribute('highlight');
  }

  _highlightValue(rawCode, languageMeta) {
    const globalTarget = getGlobalTarget();
    const language = languageMeta.language || 'text';
    const input = {
      code: rawCode,
      language,
      rawLanguage: languageMeta.rawLanguage,
      languageAlias: languageMeta.alias,
      element: this
    };
    const registeredResult = callHighlighter(this.constructor.getHighlighter(), input)
      || callHighlighter(globalTarget.XTendXTextareaHighlighter, input)
      || callHighlighter(globalTarget.XTendXCodeHighlighter, input);
    if (registeredResult) return safeHighlightResult(registeredResult, rawCode, language);

    const prism = globalTarget.Prism;
    if (!prism || !prism.languages || typeof prism.highlight !== 'function') {
      return safeHighlightResult(null, rawCode, language);
    }

    if (globalTarget.XTendRmtPrism && typeof globalTarget.XTendRmtPrism.register === 'function') {
      globalTarget.XTendRmtPrism.register(prism);
    }
    const prismHighlighter = globalTarget.XTendRmtPrism && typeof globalTarget.XTendRmtPrism.createHighlighter === 'function'
      ? globalTarget.XTendRmtPrism.createHighlighter(prism)
      : null;
    const prismResult = callHighlighter(prismHighlighter, input);
    if (prismResult) return safeHighlightResult(prismResult, rawCode, language);

    const grammar = prism.languages[language] || prism.languages[languageMeta.rawLanguage] || null;
    if (!grammar) return safeHighlightResult(null, rawCode, language);

    try {
      return safeHighlightResult({
        html: prism.highlight(rawCode, grammar, language),
        highlighted: true,
        engine: 'prism',
        language
      }, rawCode, language);
    } catch (error) {
      return safeHighlightResult(null, rawCode, language);
    }
  }

  _syncHighlight() {
    if (!this._highlightLayer || !this._highlightCode) return;
    const languageMeta = this._getLanguageMeta();
    const rawCode = this.value || '';
    if (!this._isHighlightEnabled()) {
      this._highlightCode.textContent = '';
      this._highlightLayer.removeAttribute('data-highlight-engine');
      this._lastHighlightSnapshot = {
        highlighted: false,
        highlightEngine: 'plain-text',
        highlightLanguage: languageMeta.language,
        languageAlias: languageMeta.alias
      };
      return;
    }
    const highlighted = this._highlightValue(rawCode, languageMeta);
    const trailingLine = rawCode.endsWith('\n') ? '\n' : '';
    this._highlightCode.className = `language-${highlighted.language || languageMeta.language || 'text'}`;
    this._highlightCode.setAttribute('data-x-textarea-highlight-engine', highlighted.engine);
    this._highlightCode.innerHTML = `${highlighted.html}${trailingLine}`;
    this._highlightLayer.setAttribute('data-highlight-engine', highlighted.engine);
    this._lastHighlightSnapshot = {
      highlighted: highlighted.highlighted,
      highlightEngine: highlighted.engine,
      highlightLanguage: highlighted.language,
      languageAlias: languageMeta.alias
    };
    this._syncHighlightScroll();
  }

  _syncHighlightScroll() {
    if (!this._highlightLayer || !this._control) return;
    this._highlightLayer.scrollTop = this._control.scrollTop;
    this._highlightLayer.scrollLeft = this._control.scrollLeft;
    this._syncLineNumberScroll();
  }

  _syncLineNumbers() {
    if (!this._lineNumberList) return;
    const enabled = this._isLineNumberingEnabled();
    if (!enabled) {
      this._lastLineNumberCount = 0;
      this._lineNumberList.replaceChildren();
      this._lineNumbers?.removeAttribute('data-line-count');
      return;
    }
    const lineCount = Math.max(1, String(this.value || '').split('\n').length);
    if (this._lastLineNumberCount !== lineCount) {
      this._lineNumberList.innerHTML = Array.from({ length: lineCount }, (_, index) => `<span part="line-number">${index + 1}</span>`).join('');
      this._lastLineNumberCount = lineCount;
      this._lineNumbers?.setAttribute('data-line-count', String(lineCount));
    }
    this._syncLineNumberScroll();
  }

  _syncLineNumberScroll() {
    if (!this._lineNumbers || !this._control || !this._isLineNumberingEnabled()) return;
    this._lineNumbers.scrollTop = this._control.scrollTop;
  }

  _syncCounter() {
    const max = this.maxLength;
    const length = this.value.length;
    this._counter.textContent = max > -1 ? `${length}/${max}` : `${length}`;
  }

  _syncFormValue() {
    if (this._control.validity.valid) {
      this.removeAttribute('invalid');
      this._control.setAttribute('aria-invalid', 'false');
    }
    this._internals?.setFormValue(this.value);
  }

  get value() {
    return this._control.value;
  }

  set value(value) {
    const nextValue = value == null ? '' : String(value);
    this._control.value = nextValue;
    if (this.getAttribute('value') !== nextValue) {
      this.setAttribute('value', nextValue);
    }
    this._syncFormValue();
    this._syncCounter();
    this._syncHighlight();
    this._syncLineNumbers();
  }

  get lineNumbering() {
    return this._isLineNumberingEnabled();
  }

  set lineNumbering(value) {
    if (value === true || isBooleanAttributeEnabled(value)) {
      this.setAttribute('line-numbering', 'true');
    } else {
      this.removeAttribute('line-numbering');
    }
  }

  get maxLength() {
    return this._control.maxLength;
  }

  checkValidity() {
    return this._control.checkValidity();
  }

  reportValidity() {
    return this._control.reportValidity();
  }

  validate() {
    return this.reportValidity();
  }

  reset() {
    this.value = '';
  }

  focus() {
    this._control.focus();
  }

  snapshot() {
    const languageMeta = this._getLanguageMeta();
    return {
      schema: 'xtend.component.form-control-snapshot.v1',
      componentRef: 'x-textarea',
      stateKey: `xtextarea-value-${this.id}`,
      valueLength: this.value.length,
      maxLength: this.maxLength,
      highlighted: this._lastHighlightSnapshot.highlighted === true,
      highlightEngine: this._lastHighlightSnapshot.highlightEngine || 'plain-text',
      highlightLanguage: this._lastHighlightSnapshot.highlightLanguage || languageMeta.language,
      languageAlias: this._lastHighlightSnapshot.languageAlias || languageMeta.alias,
      lineNumbering: this.lineNumbering,
      lineCount: Math.max(1, String(this.value || '').split('\n').length)
    };
  }
}

customElements.define('x-textarea', XTextarea);

export { XTextarea };

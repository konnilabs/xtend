import { xstate } from '../../../components/xstate.js';
import { createXtendRmtCommandDetail, type XtendRmtCommandDetail } from '../../../components/rmt-command.js';

export type XTextareaAttributeName =
  | 'name'
  | 'value'
  | 'placeholder'
  | 'required'
  | 'disabled'
  | 'readonly'
  | 'maxlength'
  | 'minlength'
  | 'rows'
  | 'label'
  | 'busy'
  | 'invalid'
  | 'density'
  | 'fill'
  | 'submit-on-enter'
  | 'submit-command'
  | 'syntax-highlight'
  | 'highlight'
  | 'line-numbering'
  | 'lang'
  | 'language';

export type XTextareaEventName = 'textarea-changed' | 'textarea-invalid' | 'textarea-submit' | 'xtend-command';
export type XTextareaLanguageAlias = 'lang' | 'language' | 'default';
export type XTextareaHighlightEngine = 'prism' | 'plain-text' | string;

export interface XTextareaPayloadDetail {
  value: string;
  length: number;
  trimmedLength: number;
  empty: boolean;
  maxLength: number;
  source: 'x-textarea';
}

export interface XTextareaChangedEventDetail extends XTextareaPayloadDetail {
  highlighted: boolean;
  highlightEngine: XTextareaHighlightEngine;
  highlightLanguage: string;
}

export interface XTextareaInvalidEventDetail {
  value: string;
  message: string;
  source: 'x-textarea';
}

export interface XTextareaSubmitEventDetail extends XTextareaPayloadDetail {}

export type XTextareaCommandPayload = XTextareaChangedEventDetail | XTextareaSubmitEventDetail | Record<string, unknown>;
export type XTextareaCommandEventDetail = XtendRmtCommandDetail<XTextareaCommandPayload>;

export interface XTextareaEventDetailMap {
  'textarea-changed': XTextareaChangedEventDetail;
  'textarea-invalid': XTextareaInvalidEventDetail;
  'textarea-submit': XTextareaSubmitEventDetail;
  'xtend-command': XTextareaCommandEventDetail;
}

export type XTextareaEventDetail = XTextareaEventDetailMap[keyof XTextareaEventDetailMap];
export type XTextareaEventMap = { [Name in keyof XTextareaEventDetailMap]: CustomEvent<XTextareaEventDetailMap[Name]> };

export interface XTextareaSnapshot {
  schema: 'xtend.component.form-control-snapshot.v1';
  componentRef: 'x-textarea';
  stateKey: string;
  valueLength: number;
  maxLength: number;
  highlighted: boolean;
  highlightEngine: XTextareaHighlightEngine;
  highlightLanguage: string;
  languageAlias: XTextareaLanguageAlias;
  lineNumbering: boolean;
  lineCount: number;
}

export interface XTextareaHighlightInput {
  code: string;
  language: string;
  rawLanguage?: string;
  languageAlias?: XTextareaLanguageAlias;
  element?: XTextarea;
}

export interface XTextareaHighlightResult {
  html: string;
  highlighted: boolean;
  engine: XTextareaHighlightEngine;
  language: string;
}

export type XTextareaHighlighter = ((input: XTextareaHighlightInput) => XTextareaHighlightResult) | {
  highlight(input: XTextareaHighlightInput): XTextareaHighlightResult;
};

const BOOLEAN_FALSE_VALUES = new Set(['false', '0', 'off', 'no']);
const LANGUAGE_ALIASES: Readonly<Record<string, string>> = Object.freeze({
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

function isBooleanAttributeEnabled(value: string | boolean | null): boolean {
  if (value == null || value === false) return false;
  if (value === true) return true;
  return !BOOLEAN_FALSE_VALUES.has(value.trim().toLowerCase());
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

function normalizeLanguage(value: string): string {
  const raw = String(value || 'text').trim().toLowerCase();
  return LANGUAGE_ALIASES[raw] || raw || 'text';
}

function invokeHighlighter(provider: XTextareaHighlighter | null | undefined, input: XTextareaHighlightInput): XTextareaHighlightResult | null {
  if (!provider) return null;
  try {
    return typeof provider === 'function' ? provider(input) : provider.highlight(input);
  } catch {
    return null;
  }
}

export class XTextarea extends HTMLElement {
  static formAssociated = true;
  private static highlighter: XTextareaHighlighter | null = null;

  static readonly xtendComponentContract = {
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
    rmt: { adapter: 'xtend.component', kernelBoundary: 'no-rmt-kernel-import-of-xtend-types' },
    fabric: { api: '@xtend-fabric', defaultLane: 'user-blocking' },
    publicApi: {
      attributes: ['name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'maxlength', 'minlength', 'rows', 'label', 'busy', 'invalid', 'density', 'fill', 'submit-on-enter', 'submit-command', 'syntax-highlight', 'highlight', 'line-numbering', 'lang', 'language'],
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
  } as const;

  static readonly xtendRmtMetadata = {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    tag: 'x-textarea',
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
    schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'diagnostics.snapshot'],
    hydration: { policy: 'visible', lane: 'user-blocking' },
    attributes: ['name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'maxlength', 'minlength', 'rows', 'label', 'busy', 'invalid', 'density', 'fill', 'submit-on-enter', 'submit-command', 'syntax-highlight', 'highlight', 'line-numbering', 'lang', 'language'],
    slots: ['label', 'hint', 'error'],
    events: ['textarea-changed', 'textarea-invalid', 'textarea-submit', 'xtend-command'],
    eventPayloads: {
      'textarea-changed': 'XTextareaChangedEventDetail',
      'textarea-invalid': 'XTextareaInvalidEventDetail',
      'textarea-submit': 'XTextareaSubmitEventDetail',
      'xtend-command': 'XTextareaCommandEventDetail'
    },
    methods: ['checkValidity', 'reportValidity', 'validate', 'reset', 'focus', 'snapshot']
  } as const;

  static readonly xtendComponentLifecycleTelemetry = {
    schema: 'xtend.component.lifecycle-telemetry.v1',
    componentRef: 'x-textarea',
    operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
    snapshotPath: 'snapshot.componentTelemetry'
  } as const;

  static readonly xtendScreenreaderSignals = {
    schema: 'xtend.a11y.screenreader-signals.v1',
    componentRef: 'x-textarea',
    liveRegion: 'polite',
    signals: ['validation-error-summary', 'character-count-announcement'],
    statusRegions: ['role=status', 'aria-live=polite'],
    errorRegions: ['role=alert', 'aria-live=assertive'],
    fabric: { lane: 'a11y', fiberKind: 'a11y.announce', scheduleRef: 'a11y.user-blocking.announce' }
  } as const;

  static readonly xtendMotionContrastPolicy = {
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
    fabric: { lane: 'a11y', fiberKind: 'a11y.preference', scheduleRef: 'a11y.user-blocking.preference' }
  } as const;

  static readonly xtendFormControlUxProfile = {
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
      lineNumbering: { attribute: 'line-numbering', values: ['true', 'false'] }
    },
    validation: { validityApi: true, errorRegion: 'role=alert aria-live=assertive' }
  } as const;

  static readonly xtendScaffoldA11yProfile = {
    schema: 'xtend.a11y.profile.v1',
    componentRef: 'x-textarea',
    role: 'textbox',
    accessibleName: 'required',
    focusStrategy: 'native-textarea-focus',
    keyboard: ['Tab', 'Shift+Tab', 'Enter'],
    screenreader: { signalContract: XTextarea.xtendScreenreaderSignals },
    motionContrast: { policy: XTextarea.xtendMotionContrastPolicy }
  } as const;

  static readonly xtendScaffoldPerformanceProfile = {
    schema: 'xtend.performance.component-profile.v1',
    componentRef: 'x-textarea',
    budgetClass: 'interactive-medium',
    lane: 'user-blocking',
    hydrationPolicy: 'visible',
    criticalMeasurements: ['mount', 'hydrate', 'event'],
    cleanup: ['xstate-subscription', 'input-listeners']
  } as const;

  static readonly observedAttributes: XTextareaAttributeName[] = [
    'name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'maxlength',
    'minlength', 'rows', 'label', 'busy', 'invalid', 'density', 'fill',
    'submit-on-enter', 'submit-command', 'syntax-highlight', 'highlight', 'line-numbering', 'lang', 'language'
  ];

  static registerHighlighter(provider: XTextareaHighlighter | null): XTextareaHighlighter | null {
    this.highlighter = provider;
    return this.highlighter;
  }

  static getHighlighter(): XTextareaHighlighter | null {
    return this.highlighter;
  }

  private readonly control: HTMLTextAreaElement;
  private readonly internalsRef?: ElementInternals;
  private readonly labelText: HTMLSpanElement;
  private readonly counter: HTMLDivElement;
  private readonly lineNumberList: HTMLDivElement;
  private readonly highlightCode: HTMLElement;
  private lastHighlightSnapshot: Pick<XTextareaChangedEventDetail, 'highlighted' | 'highlightEngine' | 'highlightLanguage'> & { languageAlias: XTextareaLanguageAlias } = {
    highlighted: false,
    highlightEngine: 'plain-text',
    highlightLanguage: 'text',
    languageAlias: 'default'
  };

  constructor() {
    super();
    this.internalsRef = this.attachInternals?.();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = `
      <label id="label" part="label" for="control"><slot name="label"><span id="label-text"></span></slot></label>
      <div class="editor" part="editor">
        <div id="line-numbers" part="line-numbers" aria-hidden="true"><div id="line-number-list"></div></div>
        <pre id="highlight" part="highlight syntax" aria-hidden="true"><code id="highlight-code" part="highlight-code syntax-code"></code></pre>
        <textarea id="control" part="control" aria-describedby="hint counter error"></textarea>
      </div>
      <div part="helper"><div id="hint"><slot name="hint"></slot></div><div id="counter" part="status" role="status" aria-live="polite"></div></div>
      <div id="error" part="error status" role="alert" aria-live="assertive"><slot name="error">Enter a valid value.</slot></div>
    `;
    this.control = this.shadowRoot!.querySelector('#control') as HTMLTextAreaElement;
    this.labelText = this.shadowRoot!.querySelector('#label-text') as HTMLSpanElement;
    this.counter = this.shadowRoot!.querySelector('#counter') as HTMLDivElement;
    this.lineNumberList = this.shadowRoot!.querySelector('#line-number-list') as HTMLDivElement;
    this.highlightCode = this.shadowRoot!.querySelector('#highlight-code') as HTMLElement;
    this.control.addEventListener('input', () => this.onInput());
    this.control.addEventListener('invalid', () => this.onInvalid());
    this.control.addEventListener('keydown', (event) => this.onKeydown(event));
  }

  connectedCallback(): void {
    if (!this.id) this.id = `xtextarea-${Math.random().toString(36).slice(2, 10)}`;
    XTextarea.observedAttributes.forEach((attribute) => {
      if (this.hasAttribute(attribute)) this.attributeChangedCallback(attribute, null, this.getAttribute(attribute));
    });
    this.syncDerivedState();
    xstate.set(`xtextarea-value-${this.id}`, this.value);
  }

  attributeChangedCallback(name: XTextareaAttributeName, oldValue: string | null, newValue: string | null): void {
    if (!this.control || oldValue === newValue) return;
    if (name === 'value') this.control.value = newValue || '';
    else if (name === 'readonly') this.control.readOnly = newValue != null;
    else if (name === 'required' || name === 'disabled') this.control[name] = newValue != null;
    else if (name === 'busy') this.control.setAttribute('aria-busy', String(newValue != null));
    else if (name === 'invalid') this.control.setAttribute('aria-invalid', String(newValue != null));
    else if (name === 'label') this.labelText.textContent = newValue || '';
    else if (['name', 'placeholder', 'maxlength', 'minlength', 'rows'].includes(name)) {
      if (newValue == null) this.control.removeAttribute(name);
      else this.control.setAttribute(name, newValue);
    }
    this.syncDerivedState();
  }

  get value(): string {
    return this.control.value;
  }

  set value(value: string) {
    const nextValue = value == null ? '' : String(value);
    this.control.value = nextValue;
    if (this.getAttribute('value') !== nextValue) this.setAttribute('value', nextValue);
    this.syncDerivedState();
  }

  get lineNumbering(): boolean {
    return isBooleanAttributeEnabled(this.getAttribute('line-numbering'));
  }

  set lineNumbering(value: boolean) {
    if (value) this.setAttribute('line-numbering', 'true');
    else this.removeAttribute('line-numbering');
  }

  get maxLength(): number {
    return this.control.maxLength;
  }

  validate(): boolean {
    return this.reportValidity();
  }

  checkValidity(): boolean {
    return this.control.checkValidity();
  }

  reportValidity(): boolean {
    return this.control.reportValidity();
  }

  reset(): void {
    this.value = '';
  }

  focus(): void {
    this.control.focus();
  }

  snapshot(): XTextareaSnapshot {
    const language = this.languageMeta();
    return {
      schema: 'xtend.component.form-control-snapshot.v1',
      componentRef: 'x-textarea',
      stateKey: `xtextarea-value-${this.id}`,
      valueLength: this.value.length,
      maxLength: this.maxLength,
      highlighted: this.lastHighlightSnapshot.highlighted,
      highlightEngine: this.lastHighlightSnapshot.highlightEngine,
      highlightLanguage: this.lastHighlightSnapshot.highlightLanguage || language.language,
      languageAlias: this.lastHighlightSnapshot.languageAlias || language.alias,
      lineNumbering: this.lineNumbering,
      lineCount: Math.max(1, this.value.split('\n').length)
    };
  }

  private payload(): XTextareaPayloadDetail {
    const trimmedLength = this.value.trim().length;
    return {
      value: this.value,
      length: this.value.length,
      trimmedLength,
      empty: trimmedLength === 0,
      maxLength: this.maxLength,
      source: 'x-textarea'
    };
  }

  private changedPayload(): XTextareaChangedEventDetail {
    return {
      ...this.payload(),
      highlighted: this.lastHighlightSnapshot.highlighted,
      highlightEngine: this.lastHighlightSnapshot.highlightEngine,
      highlightLanguage: this.lastHighlightSnapshot.highlightLanguage
    };
  }

  private onInput(): void {
    this.syncDerivedState();
    const detail = this.changedPayload();
    this.dispatchEvent(new CustomEvent<XTextareaChangedEventDetail>('textarea-changed', { detail, bubbles: true, composed: true }));
    this.dispatchCommand('textarea-changed', detail);
    xstate.set(`xtextarea-value-${this.id}`, this.value);
  }

  private onInvalid(): void {
    this.setAttribute('invalid', '');
    const detail: XTextareaInvalidEventDetail = { value: this.value, message: this.control.validationMessage, source: 'x-textarea' };
    this.dispatchEvent(new CustomEvent<XTextareaInvalidEventDetail>('textarea-invalid', { detail, bubbles: true, composed: true }));
  }

  private onKeydown(event: KeyboardEvent): void {
    if (!isBooleanAttributeEnabled(this.getAttribute('submit-on-enter'))) return;
    if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    if (this.hasAttribute('disabled') || this.hasAttribute('readonly')) return;
    event.preventDefault();
    const detail = this.payload();
    const shouldSubmit = this.dispatchEvent(new CustomEvent<XTextareaSubmitEventDetail>('textarea-submit', {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true
    }));
    if (!shouldSubmit) return;
    this.dispatchCommand('textarea-submit', detail);
    const form = this.internalsRef?.form || this.closest('form');
    if (form && typeof form.requestSubmit === 'function') form.requestSubmit();
  }

  private dispatchCommand(eventName: 'textarea-changed' | 'textarea-submit', payload: XTextareaChangedEventDetail | XTextareaSubmitEventDetail): void {
    const detail: XTextareaCommandEventDetail = createXtendRmtCommandDetail(this, eventName, payload, {
      fallbackId: 'x-textarea',
      command: () => eventName === 'textarea-submit' ? (this.getAttribute('submit-command') || this.dataset.submitCommand || '') : ''
    }) as XTextareaCommandEventDetail;
    this.dispatchEvent(new CustomEvent<XTextareaCommandEventDetail>('xtend-command', { detail, bubbles: true, composed: true, cancelable: true }));
  }

  private syncDerivedState(): void {
    if (this.control.validity.valid) {
      this.removeAttribute('invalid');
      this.control.setAttribute('aria-invalid', 'false');
    }
    this.internalsRef?.setFormValue(this.value);
    this.counter.textContent = this.maxLength > -1 ? `${this.value.length}/${this.maxLength}` : `${this.value.length}`;
    this.lineNumberList.textContent = this.lineNumbering
      ? Array.from({ length: Math.max(1, this.value.split('\n').length) }, (_, index) => String(index + 1)).join('\n')
      : '';
    this.syncHighlight();
  }

  private highlightEnabled(): boolean {
    return this.hasAttribute('syntax-highlight') || this.hasAttribute('highlight');
  }

  private syncHighlight(): void {
    const language = this.languageMeta();
    if (!this.highlightEnabled()) {
      this.highlightCode.textContent = '';
      this.lastHighlightSnapshot = {
        highlighted: false,
        highlightEngine: 'plain-text',
        highlightLanguage: language.language,
        languageAlias: language.alias
      };
      return;
    }

    const input: XTextareaHighlightInput = {
      code: this.value,
      language: language.language,
      rawLanguage: language.rawLanguage,
      languageAlias: language.alias,
      element: this
    };
    const highlighterGlobals = globalThis as typeof globalThis & {
      XTendXTextareaHighlighter?: XTextareaHighlighter;
      XTendXCodeHighlighter?: XTextareaHighlighter;
      Prism?: { languages?: Record<string, unknown>; highlight?: (code: string, grammar: unknown, language: string) => string };
    };
    let result = invokeHighlighter(XTextarea.getHighlighter(), input)
      || invokeHighlighter(highlighterGlobals.XTendXTextareaHighlighter, input)
      || invokeHighlighter(highlighterGlobals.XTendXCodeHighlighter, input);
    const grammar = highlighterGlobals.Prism?.languages?.[language.language]
      || highlighterGlobals.Prism?.languages?.[language.rawLanguage];
    if (!result && grammar && typeof highlighterGlobals.Prism?.highlight === 'function') {
      try {
        result = {
          html: highlighterGlobals.Prism.highlight(this.value, grammar, language.language),
          highlighted: true,
          engine: 'prism',
          language: language.language
        };
      } catch {
        result = null;
      }
    }
    const resolved = result && typeof result.html === 'string'
      ? result
      : { html: escapeHtml(this.value), highlighted: false, engine: 'plain-text', language: language.language };
    this.highlightCode.innerHTML = `${resolved.html}${this.value.endsWith('\n') ? '\n' : ''}`;
    this.lastHighlightSnapshot = {
      highlighted: resolved.highlighted === true,
      highlightEngine: resolved.engine || (resolved.highlighted ? 'prism' : 'plain-text'),
      highlightLanguage: resolved.language || language.language,
      languageAlias: language.alias
    };
  }

  private languageMeta(): { language: string; rawLanguage: string; alias: XTextareaLanguageAlias } {
    const lang = this.getAttribute('lang');
    const language = this.getAttribute('language');
    const rawLanguage = lang || language || 'text';
    return {
      language: normalizeLanguage(rawLanguage),
      rawLanguage,
      alias: lang ? 'lang' : (language ? 'language' : 'default')
    };
  }
}

if (!customElements.get('x-textarea')) {
  customElements.define('x-textarea', XTextarea);
}

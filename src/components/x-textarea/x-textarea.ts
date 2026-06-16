import { xstate } from '../../../components/xstate.js';

export type XTextareaEventName = 'textarea-changed' | 'textarea-invalid' | 'textarea-submit';

export interface XTextareaChangedDetail {
  value: string;
  length: number;
  maxLength: number;
  source: 'x-textarea';
}

export interface XTextareaInvalidDetail {
  value: string;
  message: string;
  source: 'x-textarea';
}

export interface XTextareaSubmitDetail {
  value: string;
  length: number;
  maxLength: number;
  source: 'x-textarea';
}

export class XTextarea extends HTMLElement {
  static formAssociated = true;
  static readonly xtendComponentContract = {
    schema: 'xtend.component.contract.v2',
    tag: 'x-textarea',
    maturity: 'stable',
    source: { strategy: 'xtend.typescript.component-source-strategy.v1', state: 'ts-source' },
    rmt: { adapter: 'xtend.component', kernelBoundary: 'no-rmt-kernel-import-of-xtend-types' },
    fabric: { api: '@xtend-fabric', defaultLane: 'user-blocking' }
  } as const;
  static readonly xtendRmtMetadata = {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'diagnostics.snapshot'],
    hydration: { policy: 'visible', lane: 'user-blocking' }
  } as const;
  static readonly xtendScaffoldA11yProfile = {
    schema: 'xtend.a11y.profile.v1',
    componentRef: 'x-textarea',
    role: 'textbox',
    keyboard: ['Tab', 'Shift+Tab', 'Enter']
  } as const;
  static readonly xtendScaffoldPerformanceProfile = {
    schema: 'xtend.performance.component-profile.v1',
    componentRef: 'x-textarea',
    budgetClass: 'interactive-medium',
    lane: 'user-blocking',
    hydrationPolicy: 'visible'
  } as const;
  static readonly observedAttributes = ['name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'maxlength', 'minlength', 'rows', 'label', 'submit-on-enter'];
  private readonly control: HTMLTextAreaElement;
  private readonly internalsRef?: ElementInternals;

  constructor() {
    super();
    this.internalsRef = this.attachInternals?.();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = '<textarea id="control" aria-describedby="hint counter error"></textarea><div id="counter" role="status" aria-live="polite"></div><div id="error" role="alert" aria-live="assertive"><slot name="error"></slot></div>';
    this.control = this.shadowRoot!.querySelector('#control') as HTMLTextAreaElement;
    this.control.addEventListener('keydown', (event) => this.onKeydown(event));
  }

  connectedCallback(): void {
    if (!this.id) this.id = `xtextarea-${Math.random().toString(36).slice(2, 10)}`;
    xstate.set(`xtextarea-value-${this.id}`, this.value);
  }

  get value(): string {
    return this.control.value;
  }

  set value(value: string) {
    this.control.value = value;
    this.internalsRef?.setFormValue(value);
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

  private submitOnEnterEnabled(): boolean {
    const value = this.getAttribute('submit-on-enter');
    return value != null && !['false', '0', 'off', 'no'].includes(String(value).trim().toLowerCase());
  }

  private onKeydown(event: KeyboardEvent): void {
    if (!this.submitOnEnterEnabled()) return;
    if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    if (this.hasAttribute('disabled') || this.hasAttribute('readonly')) return;
    event.preventDefault();
    const submitEvent = new CustomEvent<XTextareaSubmitDetail>('textarea-submit', {
      detail: {
        value: this.value,
        length: this.value.length,
        maxLength: this.maxLength,
        source: 'x-textarea'
      },
      bubbles: true,
      composed: true,
      cancelable: true
    });
    const shouldSubmit = this.dispatchEvent(submitEvent);
    if (!shouldSubmit) return;
    const form = this.internalsRef?.form || this.closest('form');
    if (form && typeof form.requestSubmit === 'function') form.requestSubmit();
  }
}

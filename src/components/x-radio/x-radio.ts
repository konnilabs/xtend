import { xstate } from '../../../components/xstate.js';

export type XRadioEventName = 'radio-changed' | 'radio-invalid';

export interface XRadioChangedDetail {
  checked: boolean;
  value: string;
  name: string;
  source: 'x-radio';
}

export class XRadio extends HTMLElement {
  static formAssociated = true;
  static readonly xtendComponentContract = {
    schema: 'xtend.component.contract.v2',
    tag: 'x-radio',
    maturity: 'stable',
    source: { strategy: 'xtend.typescript.component-source-strategy.v1', state: 'ts-source' },
    rmt: { adapter: 'xtend.component', kernelBoundary: 'no-rmt-kernel-import-of-xtend-types' },
    fabric: { api: '@xtend-fabric', defaultLane: 'user-blocking' }
  } as const;
  static readonly xtendRmtMetadata = {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'diagnostics.snapshot']
  } as const;
  static readonly xtendScaffoldA11yProfile = {
    schema: 'xtend.a11y.profile.v1',
    componentRef: 'x-radio',
    role: 'radio',
    keyboard: ['Tab', 'Space', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft']
  } as const;
  static readonly xtendScaffoldPerformanceProfile = {
    schema: 'xtend.performance.component-profile.v1',
    componentRef: 'x-radio',
    budgetClass: 'interactive-small',
    lane: 'user-blocking',
    hydrationPolicy: 'visible'
  } as const;
  static readonly observedAttributes = ['name', 'value', 'checked', 'disabled', 'required', 'label'];
  private readonly control: HTMLInputElement;
  private readonly internalsRef?: ElementInternals;

  constructor() {
    super();
    this.internalsRef = this.attachInternals?.();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = '<input id="control" type="radio" role="radio"><div role="alert" aria-live="assertive"><slot name="error"></slot></div>';
    this.control = this.shadowRoot!.querySelector('#control') as HTMLInputElement;
  }

  connectedCallback(): void {
    if (!this.id) this.id = `xradio-${Math.random().toString(36).slice(2, 10)}`;
    xstate.set(`xradio-checked-${this.id}`, this.checked);
    if (this.checked && this.name) xstate.set(`xradio-value-${this.name}`, this.value);
  }

  get name(): string {
    return this.getAttribute('name') || '';
  }

  get checked(): boolean {
    return this.control.checked;
  }

  set checked(value: boolean) {
    this.control.checked = Boolean(value);
    this.internalsRef?.setFormValue(this.checked ? this.value : null);
  }

  get value(): string {
    return this.getAttribute('value') || 'on';
  }

  set value(value: string) {
    this.setAttribute('value', value);
  }

  check(): void {
    this.checked = true;
    if (this.name) xstate.set(`xradio-value-${this.name}`, this.value);
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
    this.checked = false;
  }

  focus(): void {
    this.control.focus();
  }
}


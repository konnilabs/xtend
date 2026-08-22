import { xtendState } from '../../../components/xtend-state.js';

export type XCheckboxEventName = 'checkbox-changed' | 'checkbox-invalid';

export interface XCheckboxChangedDetail {
  checked: boolean;
  value: string;
  source: 'x-checkbox';
}

export class XCheckbox extends HTMLElement {
  static formAssociated = true;
  static readonly xtendComponentContract = {
    schema: 'xtend.component.contract.v2',
    tag: 'x-checkbox',
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
    componentRef: 'x-checkbox',
    role: 'checkbox',
    keyboard: ['Tab', 'Space']
  } as const;
  static readonly xtendScaffoldPerformanceProfile = {
    schema: 'xtend.performance.component-profile.v1',
    componentRef: 'x-checkbox',
    budgetClass: 'interactive-small',
    lane: 'user-blocking',
    hydrationPolicy: 'visible'
  } as const;
  static readonly observedAttributes = ['name', 'value', 'checked', 'disabled', 'required', 'indeterminate', 'label'];
  private readonly control: HTMLInputElement;
  private readonly internalsRef?: ElementInternals;

  constructor() {
    super();
    this.internalsRef = this.attachInternals?.();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = '<input id="control" type="checkbox"><div role="alert" aria-live="assertive"><slot name="error"></slot></div>';
    this.control = this.shadowRoot!.querySelector('#control') as HTMLInputElement;
  }

  connectedCallback(): void {
    if (!this.id) this.id = `xcheckbox-${Math.random().toString(36).slice(2, 10)}`;
    xtendState.set(`xcheckbox-checked-${this.id}`, this.checked);
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

  toggle(): void {
    this.checked = !this.checked;
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


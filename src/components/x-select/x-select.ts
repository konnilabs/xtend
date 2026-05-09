import { xstate } from '../../../components/xstate.js';

export type XSelectEventName = 'select-changed' | 'select-invalid';

export interface XSelectChangedDetail {
  value: string;
  values: string[];
  source: 'x-select';
}

export interface XSelectInvalidDetail {
  value: string;
  message: string;
}

export class XSelect extends HTMLElement {
  static formAssociated = true;
  static readonly xtendComponentContract = {
    schema: 'xtend.component.contract.v2',
    tag: 'x-select',
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
    componentRef: 'x-select',
    role: 'combobox',
    keyboard: ['Tab', 'ArrowDown', 'ArrowUp', 'Enter', 'Escape']
  } as const;
  static readonly xtendScaffoldPerformanceProfile = {
    schema: 'xtend.performance.component-profile.v1',
    componentRef: 'x-select',
    budgetClass: 'interactive-medium',
    lane: 'user-blocking',
    hydrationPolicy: 'visible'
  } as const;
  static readonly observedAttributes = ['name', 'value', 'disabled', 'required', 'multiple', 'placeholder', 'label'];
  private readonly control: HTMLSelectElement;
  private readonly internalsRef?: ElementInternals;

  constructor() {
    super();
    this.internalsRef = this.attachInternals?.();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = '<select id="control" role="combobox"></select><div role="alert" aria-live="assertive"><slot name="error"></slot></div>';
    this.control = this.shadowRoot!.querySelector('#control') as HTMLSelectElement;
  }

  connectedCallback(): void {
    if (!this.id) this.id = `xselect-${Math.random().toString(36).slice(2, 10)}`;
    xstate.set(`xselect-value-${this.id}`, this.value);
  }

  get values(): string[] {
    return Array.from(this.control.selectedOptions).map((option) => option.value);
  }

  get value(): string {
    return this.control.value;
  }

  set value(value: string) {
    this.control.value = value;
    this.internalsRef?.setFormValue(value);
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
}


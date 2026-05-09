import { xstate } from '../../../components/xstate.js';

export type XStatusEventName = 'status-changed' | 'status-dismissed';

export interface XStatusState {
  type: string;
  status: string;
  message: string;
  busy: boolean;
  source: 'x-status';
}

export class XStatus extends HTMLElement {
  static readonly xtendComponentContract = {
    schema: 'xtend.component.contract.v2',
    tag: 'x-status',
    maturity: 'stable',
    source: { strategy: 'xtend.typescript.component-source-strategy.v1', state: 'ts-source' },
    rmt: { adapter: 'xtend.component', kernelBoundary: 'no-rmt-kernel-import-of-xtend-types' },
    fabric: { api: '@xtend-fabric', defaultLane: 'feedback' }
  } as const;
  static readonly xtendRmtMetadata = {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    schedules: ['component.visible.mount', 'component.idle.hydrate', 'feedback.status.update', 'diagnostics.snapshot'],
    hydration: { policy: 'visible', lane: 'feedback' }
  } as const;
  static readonly xtendScaffoldA11yProfile = {
    schema: 'xtend.a11y.profile.v1',
    componentRef: 'x-status',
    role: 'status',
    liveRegion: 'polite'
  } as const;
  static readonly xtendScaffoldPerformanceProfile = {
    schema: 'xtend.performance.component-profile.v1',
    componentRef: 'x-status',
    budgetClass: 'feedback-small',
    lane: 'feedback',
    hydrationPolicy: 'visible'
  } as const;
  static readonly observedAttributes = ['type', 'state', 'message', 'dismissible', 'busy', 'polite', 'label'];
  private readonly statusRegion: HTMLElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = '<div id="status" role="status" aria-live="polite"><slot></slot></div><button id="dismiss" type="button" hidden>x</button>';
    this.statusRegion = this.shadowRoot!.querySelector('#status') as HTMLElement;
  }

  connectedCallback(): void {
    if (!this.id) this.id = `xstatus-${Math.random().toString(36).slice(2, 10)}`;
    xstate.set(`xstatus-state-${this.id}`, this.state);
  }

  get type(): string {
    return this.getAttribute('type') || 'info';
  }

  get busy(): boolean {
    return this.hasAttribute('busy');
  }

  get dismissible(): boolean {
    return this.hasAttribute('dismissible');
  }

  get state(): XStatusState {
    return {
      type: this.type,
      status: this.getAttribute('state') || this.type,
      message: this.getAttribute('message') || this.textContent?.trim() || '',
      busy: this.busy,
      source: 'x-status'
    };
  }

  setStatus(nextState: Partial<XStatusState> = {}): void {
    if (nextState.type) this.setAttribute('type', nextState.type);
    if (nextState.status) this.setAttribute('state', nextState.status);
    if (nextState.message) this.setAttribute('message', nextState.message);
    this.statusRegion.setAttribute('aria-busy', String(Boolean(nextState.busy)));
  }

  dismiss(): void {
    this.hidden = true;
  }
}

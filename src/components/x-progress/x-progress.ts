import { xstate } from '../../../components/xstate.js';

export type XProgressEventName = 'progress-changed' | 'progress-complete';

export interface XProgressDetail {
  value: number;
  max: number;
  percent: number;
  source: 'x-progress';
}

export class XProgress extends HTMLElement {
  static readonly xtendComponentContract = {
    schema: 'xtend.component.contract.v2',
    tag: 'x-progress',
    maturity: 'stable',
    source: { strategy: 'xtend.typescript.component-source-strategy.v1', state: 'ts-source' },
    rmt: { adapter: 'xtend.component', kernelBoundary: 'no-rmt-kernel-import-of-xtend-types' },
    fabric: { api: '@xtend-fabric', defaultLane: 'background' }
  } as const;
  static readonly xtendRmtMetadata = {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    schedules: ['component.visible.mount', 'component.idle.hydrate', 'feedback.progress.update', 'diagnostics.snapshot'],
    hydration: { policy: 'visible', lane: 'background' }
  } as const;
  static readonly xtendScaffoldA11yProfile = {
    schema: 'xtend.a11y.profile.v1',
    componentRef: 'x-progress',
    role: 'progressbar',
    liveRegion: 'polite'
  } as const;
  static readonly xtendScaffoldPerformanceProfile = {
    schema: 'xtend.performance.component-profile.v1',
    componentRef: 'x-progress',
    budgetClass: 'feedback-small',
    lane: 'background',
    hydrationPolicy: 'visible'
  } as const;
  static readonly observedAttributes = ['value', 'max', 'label', 'status', 'indeterminate', 'busy'];

  connectedCallback(): void {
    if (!this.id) this.id = `xprogress-${Math.random().toString(36).slice(2, 10)}`;
    xstate.set(`xprogress-value-${this.id}`, this.value);
  }

  get value(): number {
    return Number(this.getAttribute('value') || 0);
  }

  set value(value: number) {
    this.setProgress(value);
  }

  get max(): number {
    return Number(this.getAttribute('max') || 100);
  }

  get percent(): number {
    return this.max === 0 ? 0 : Math.round((Math.min(Math.max(this.value, 0), this.max) / this.max) * 100);
  }

  get indeterminate(): boolean {
    return this.hasAttribute('indeterminate');
  }

  get busy(): boolean {
    return this.hasAttribute('busy');
  }

  setProgress(value: number): void {
    this.setAttribute('value', String(Number.isFinite(Number(value)) ? Number(value) : 0));
  }

  complete(): void {
    this.removeAttribute('indeterminate');
    this.setProgress(this.max);
  }

  reset(): void {
    this.removeAttribute('indeterminate');
    this.setProgress(0);
  }
}

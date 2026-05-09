import { xstate } from '../../../components/xstate.js';

export type XTooltipEventName = 'tooltip-opened' | 'tooltip-closed';
export type XTooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface XTooltipEventDetail {
  id: string;
  open: boolean;
  source: string;
  placement: XTooltipPlacement | string;
}

export class XTooltip extends HTMLElement {
  static readonly observedAttributes = ['for', 'placement', 'open', 'delay', 'label'];

  static readonly xtendComponentContract = {
    schema: 'xtend.component.contract.v2',
    tag: 'x-tooltip',
    maturity: 'stable',
    source: { strategy: 'xtend.typescript.component-source-strategy.v1', state: 'ts-source' },
    rmt: { adapter: 'xtend.component', kernelBoundary: 'no-rmt-kernel-import-of-xtend-types' },
    fabric: { api: '@xtend-fabric', defaultLane: 'visible' }
  } as const;

  static readonly xtendRmtMetadata = {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    schedules: ['component.visible.mount', 'component.idle.hydrate', 'overlay.tooltip.position', 'diagnostics.snapshot'],
    hydration: { policy: 'idle', lane: 'visible' }
  } as const;

  static readonly xtendScaffoldA11yProfile = {
    schema: 'xtend.a11y.profile.v1',
    componentRef: 'x-tooltip',
    role: 'tooltip',
    liveRegion: 'none'
  } as const;

  static readonly xtendScaffoldPerformanceProfile = {
    schema: 'xtend.performance.component-profile.v1',
    componentRef: 'x-tooltip',
    budgetClass: 'overlay-small',
    lane: 'visible',
    hydrationPolicy: 'idle'
  } as const;

  connectedCallback(): void {
    if (!this.id) this.id = `xtooltip-${Math.random().toString(36).slice(2, 10)}`;
    xstate.set(`xtooltip-open-${this.id}`, this.open);
  }

  get open(): boolean {
    return this.hasAttribute('open');
  }

  set open(value: boolean) {
    value ? this.show() : this.hide();
  }

  show(): void {
    this.setAttribute('open', '');
  }

  hide(): void {
    this.removeAttribute('open');
  }

  toggle(): void {
    this.open ? this.hide() : this.show();
  }
}

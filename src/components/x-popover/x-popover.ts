import { xtendState } from '../../../components/xtend-state.js';

export type XPopoverEventName = 'popover-opened' | 'popover-closed';
export type XPopoverPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface XPopoverEventDetail {
  id: string;
  open: boolean;
  source: string;
  placement: XPopoverPlacement | string;
  modal: boolean;
}

export class XPopover extends HTMLElement {
  static readonly observedAttributes = ['open', 'placement', 'modal', 'anchor', 'label'];

  static readonly xtendComponentContract = {
    schema: 'xtend.component.contract.v2',
    tag: 'x-popover',
    maturity: 'stable',
    source: { strategy: 'xtend.typescript.component-source-strategy.v1', state: 'ts-source' },
    rmt: { adapter: 'xtend.component', kernelBoundary: 'no-rmt-kernel-import-of-xtend-types' },
    fabric: { api: '@xtend-fabric', defaultLane: 'user-blocking' }
  } as const;

  static readonly xtendRmtMetadata = {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'overlay.popover.position', 'diagnostics.snapshot'],
    hydration: { policy: 'visible', lane: 'user-blocking' }
  } as const;

  static readonly xtendScaffoldA11yProfile = {
    schema: 'xtend.a11y.profile.v1',
    componentRef: 'x-popover',
    role: 'dialog',
    liveRegion: 'none'
  } as const;

  static readonly xtendScaffoldPerformanceProfile = {
    schema: 'xtend.performance.component-profile.v1',
    componentRef: 'x-popover',
    budgetClass: 'overlay-medium',
    lane: 'user-blocking',
    hydrationPolicy: 'visible'
  } as const;

  connectedCallback(): void {
    if (!this.id) this.id = `xpopover-${Math.random().toString(36).slice(2, 10)}`;
    xtendState.set(`xpopover-open-${this.id}`, this.open);
  }

  get open(): boolean {
    return this.hasAttribute('open');
  }

  set open(value: boolean) {
    value ? this.show() : this.hide();
  }

  get modal(): boolean {
    return this.hasAttribute('modal');
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

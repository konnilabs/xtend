import { xtendState } from '../../../components/xtend-state.js';

export type XDrawerEventName = 'drawer-opened' | 'drawer-closed' | 'drawer-route-selected';
export type XDrawerPlacement = 'left' | 'right' | 'bottom';

export class XDrawer extends HTMLElement {
  static readonly observedAttributes = ['open', 'placement', 'modal', 'label', 'route-aware'];

  static readonly xtendComponentContract = {
    schema: 'xtend.component.contract.v2',
    tag: 'x-drawer',
    maturity: 'stable',
    source: { strategy: 'xtend.typescript.component-source-strategy.v1', state: 'ts-source' },
    rmt: { adapter: 'xtend.component', kernelBoundary: 'no-rmt-kernel-import-of-xtend-types' },
    fabric: { api: '@xtend-fabric', defaultLane: 'visible' }
  } as const;

  static readonly xtendRmtMetadata = {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    schedules: ['component.visible.mount', 'component.lazy.hydrate', 'route.visible.render', 'overlay.drawer.transition', 'diagnostics.snapshot'],
    hydration: { policy: 'lazy', lane: 'visible' }
  } as const;

  static readonly xtendScaffoldA11yProfile = {
    schema: 'xtend.a11y.profile.v1',
    componentRef: 'x-drawer',
    role: 'dialog',
    liveRegion: 'polite'
  } as const;

  static readonly xtendScaffoldPerformanceProfile = {
    schema: 'xtend.performance.component-profile.v1',
    componentRef: 'x-drawer',
    budgetClass: 'overlay-large',
    lane: 'visible',
    hydrationPolicy: 'lazy'
  } as const;

  connectedCallback(): void {
    if (!this.id) this.id = `xdrawer-${Math.random().toString(36).slice(2, 10)}`;
    xtendState.set(`xdrawer-open-${this.id}`, this.open);
  }

  get open(): boolean {
    return this.hasAttribute('open');
  }

  set open(value: boolean) {
    value ? this.openDrawer() : this.closeDrawer();
  }

  get modal(): boolean {
    return this.hasAttribute('modal');
  }

  openDrawer(): void {
    this.setAttribute('open', '');
  }

  closeDrawer(): void {
    this.removeAttribute('open');
  }

  toggle(): void {
    this.open ? this.closeDrawer() : this.openDrawer();
  }
}

export const xDrawerRmtMetadata = {
  schema: 'xtend.rmt.component-contract.v1',
  adapter: 'xtend.component',
  tag: 'x-drawer',
  componentRecordKind: 'custom_element',
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
  templateMode: 'dom_descriptor',
  eventBindingMode: 'dom-event-to-rmt-command',
  schedules: ['component.visible.mount', 'component.lazy.hydrate', 'route.visible.render', 'overlay.drawer.transition', 'diagnostics.snapshot'],
  hydration: { policy: 'lazy', lane: 'visible' },
  events: ['drawer-opened', 'drawer-closed', 'drawer-route-selected'],
  slots: ['default', 'trigger', 'header', 'footer']
} as const;

export type XDrawerRmtMetadata = typeof xDrawerRmtMetadata;

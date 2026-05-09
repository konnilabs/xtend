export const xStatusRmtMetadata = {
  schema: 'xtend.rmt.component-contract.v1',
  adapter: 'xtend.component',
  tag: 'x-status',
  componentRecordKind: 'custom_element',
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
  templateMode: 'dom_descriptor',
  eventBindingMode: 'dom-event-to-rmt-command',
  schedules: ['component.visible.mount', 'component.idle.hydrate', 'feedback.status.update', 'diagnostics.snapshot'],
  hydration: { policy: 'visible', lane: 'feedback' },
  events: ['status-changed', 'status-dismissed'],
  slots: ['default', 'label']
} as const;

export type XStatusRmtMetadata = typeof xStatusRmtMetadata;

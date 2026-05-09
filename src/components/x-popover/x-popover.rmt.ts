export const xPopoverRmtMetadata = {
  schema: 'xtend.rmt.component-contract.v1',
  adapter: 'xtend.component',
  tag: 'x-popover',
  componentRecordKind: 'custom_element',
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
  templateMode: 'dom_descriptor',
  eventBindingMode: 'dom-event-to-rmt-command',
  schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'overlay.popover.position', 'diagnostics.snapshot'],
  hydration: { policy: 'visible', lane: 'user-blocking' },
  events: ['popover-opened', 'popover-closed'],
  slots: ['default', 'trigger', 'actions']
} as const;

export type XPopoverRmtMetadata = typeof xPopoverRmtMetadata;

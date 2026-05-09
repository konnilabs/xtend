export const xTooltipRmtMetadata = {
  schema: 'xtend.rmt.component-contract.v1',
  adapter: 'xtend.component',
  tag: 'x-tooltip',
  componentRecordKind: 'custom_element',
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
  templateMode: 'dom_descriptor',
  eventBindingMode: 'dom-event-to-rmt-command',
  schedules: ['component.visible.mount', 'component.idle.hydrate', 'overlay.tooltip.position', 'diagnostics.snapshot'],
  hydration: { policy: 'idle', lane: 'visible' },
  events: ['tooltip-opened', 'tooltip-closed'],
  slots: ['default', 'trigger']
} as const;

export type XTooltipRmtMetadata = typeof xTooltipRmtMetadata;

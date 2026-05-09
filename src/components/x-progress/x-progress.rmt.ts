export const xProgressRmtMetadata = {
  schema: 'xtend.rmt.component-contract.v1',
  adapter: 'xtend.component',
  tag: 'x-progress',
  componentRecordKind: 'custom_element',
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
  templateMode: 'dom_descriptor',
  eventBindingMode: 'dom-event-to-rmt-command',
  schedules: ['component.visible.mount', 'component.idle.hydrate', 'feedback.progress.update', 'diagnostics.snapshot'],
  hydration: { policy: 'visible', lane: 'background' },
  events: ['progress-changed', 'progress-complete'],
  slots: ['default', 'label']
} as const;

export type XProgressRmtMetadata = typeof xProgressRmtMetadata;

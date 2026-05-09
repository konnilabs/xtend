export const xCheckboxRmtMetadata = {
  schema: 'xtend.rmt.component-contract.v1',
  adapter: 'xtend.component',
  tag: 'x-checkbox',
  componentRecordKind: 'custom_element',
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
  templateMode: 'dom_descriptor',
  eventBindingMode: 'dom-event-to-rmt-command',
  schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'diagnostics.snapshot'],
  hydration: { policy: 'visible', lane: 'user-blocking' },
  events: ['checkbox-changed', 'checkbox-invalid'],
  slots: ['default', 'label', 'hint', 'error']
} as const;

export type XCheckboxRmtMetadata = typeof xCheckboxRmtMetadata;


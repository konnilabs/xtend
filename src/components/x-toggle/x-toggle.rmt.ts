export const xToggleRmtMetadata = {
  schema: 'xtend.rmt.component-contract.v1',
  adapter: 'xtend.component',
  tag: 'x-toggle',
  componentRecordKind: 'custom_element',
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
  templateMode: 'dom_descriptor',
  eventBindingMode: 'dom-event-to-rmt-command',
  schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'a11y.announce', 'diagnostics.snapshot'],
  hydration: { policy: 'visible', lane: 'user-blocking' },
  events: ['toggle-changed', 'toggle-invalid'],
  slots: ['default', 'label', 'hint', 'error', 'on-label', 'off-label'],
  state: ['xtoggle-checked-<id>', 'xtoggle-state-<id>'],
  shellAuthoring: {
    schema: 'xtend.rmt.shell-authoring.component.v1',
    host: 'x-toggle',
    attributes: ['name', 'value', 'checked', 'disabled', 'required', 'label', 'busy', 'invalid', 'density'],
    commands: ['focus', 'validate', 'reset', 'set-value', 'announce-error']
  }
} as const;

export type XToggleRmtMetadata = typeof xToggleRmtMetadata;


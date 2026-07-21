export const xTextareaRmtMetadata = {
  schema: 'xtend.rmt.component-contract.v1',
  adapter: 'xtend.component',
  tag: 'x-textarea',
  componentRecordKind: 'custom_element',
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
  templateMode: 'dom_descriptor',
  eventBindingMode: 'dom-event-to-rmt-command',
  schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'diagnostics.snapshot'],
  hydration: { policy: 'visible', lane: 'user-blocking' },
  attributes: ['name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'maxlength', 'minlength', 'rows', 'label', 'busy', 'invalid', 'density', 'fill', 'submit-on-enter', 'submit-command', 'syntax-highlight', 'highlight', 'line-numbering', 'lang', 'language'],
  events: ['textarea-changed', 'textarea-invalid', 'textarea-submit', 'xtend-command'],
  eventPayloads: {
    'textarea-changed': 'XTextareaChangedEventDetail',
    'textarea-invalid': 'XTextareaInvalidEventDetail',
    'textarea-submit': 'XTextareaSubmitEventDetail',
    'xtend-command': 'XTextareaCommandEventDetail'
  },
  slots: ['label', 'hint', 'error'],
  methods: ['checkValidity', 'reportValidity', 'validate', 'reset', 'focus', 'snapshot']
} as const;

export type XTextareaRmtMetadata = typeof xTextareaRmtMetadata;

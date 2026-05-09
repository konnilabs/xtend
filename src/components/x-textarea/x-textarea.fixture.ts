export const xTextareaFixture = {
  schema: 'xtend.component.fixture-data.v1',
  componentRef: 'x-textarea',
  attributes: {
    id: 'component-textarea',
    name: 'notes',
    value: 'Initial note',
    maxlength: 240,
    rows: 5,
    required: true
  },
  expectedEvents: ['textarea-changed', 'textarea-invalid'],
  expectedA11y: ['role=textbox', 'aria-describedby', 'role=status', 'role=alert'],
  expectedTelemetry: ['mount', 'hydrate', 'event']
} as const;

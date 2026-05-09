export const xCheckboxFixture = {
  schema: 'xtend.component.fixture-data.v1',
  componentRef: 'x-checkbox',
  attributes: {
    id: 'component-checkbox',
    name: 'terms',
    value: 'accepted',
    checked: true,
    required: true
  },
  expectedEvents: ['checkbox-changed', 'checkbox-invalid'],
  expectedA11y: ['role=checkbox', 'aria-checked', 'role=alert'],
  expectedTelemetry: ['mount', 'event']
} as const;


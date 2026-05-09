export const xRadioFixture = {
  schema: 'xtend.component.fixture-data.v1',
  componentRef: 'x-radio',
  attributes: {
    id: 'component-radio-pro',
    name: 'plan',
    value: 'pro',
    checked: true,
    required: true
  },
  expectedEvents: ['radio-changed', 'radio-invalid'],
  expectedA11y: ['role=radio', 'aria-checked', 'role=alert'],
  expectedTelemetry: ['mount', 'event']
} as const;

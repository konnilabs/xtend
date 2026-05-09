export const xSelectFixture = {
  schema: 'xtend.component.fixture-data.v1',
  componentRef: 'x-select',
  attributes: {
    id: 'component-select',
    name: 'plan',
    value: 'pro',
    required: true
  },
  options: [
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' }
  ],
  expectedEvents: ['select-changed', 'select-invalid'],
  expectedA11y: ['role=combobox', 'aria-describedby', 'role=alert'],
  expectedTelemetry: ['mount', 'hydrate', 'event']
} as const;


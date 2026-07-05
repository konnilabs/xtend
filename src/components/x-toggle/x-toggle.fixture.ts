export const xToggleFixture = {
  schema: 'xtend.component.fixture-data.v1',
  componentRef: 'x-toggle',
  attributes: {
    id: 'component-toggle',
    name: 'notifications',
    value: 'enabled',
    checked: true,
    required: true,
    label: 'Notifications'
  },
  expectedEvents: ['toggle-changed', 'toggle-invalid'],
  expectedA11y: ['role=switch', 'aria-checked', 'role=alert', 'aria-live=assertive'],
  expectedState: ['xtoggle-checked-<id>', 'xtoggle-state-<id>'],
  expectedTelemetry: ['mount', 'event', 'keyboard']
} as const;


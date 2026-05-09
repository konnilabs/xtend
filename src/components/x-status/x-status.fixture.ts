export const xStatusFixture = {
  schema: 'xtend.component.fixture-data.v1',
  componentRef: 'x-status',
  attributes: {
    id: 'component-status',
    type: 'warning',
    state: 'validating',
    message: 'Validation is running',
    dismissible: true,
    busy: true
  },
  expectedEvents: ['status-changed', 'status-dismissed'],
  expectedA11y: ['role=status', 'role=alert', 'aria-live=polite', 'aria-busy'],
  expectedTelemetry: ['mount', 'hydrate', 'event']
} as const;

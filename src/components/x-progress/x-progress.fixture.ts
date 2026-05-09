export const xProgressFixture = {
  schema: 'xtend.component.fixture-data.v1',
  componentRef: 'x-progress',
  attributes: {
    id: 'component-progress',
    value: 64,
    max: 100,
    status: 'Hydrating route',
    busy: true
  },
  expectedEvents: ['progress-changed', 'progress-complete'],
  expectedA11y: ['role=progressbar', 'aria-valuenow', 'aria-valuemax', 'role=status'],
  expectedTelemetry: ['mount', 'hydrate', 'event']
} as const;

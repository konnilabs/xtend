export const {{className}}FixtureData = {
  schema: 'xtend.scaffold.typescript-component-fixture.v1',
  tag: '{{tag}}',
  className: '{{className}}',
  attributes: {
    'aria-label': '{{className}} component',
    variant: 'default'
  },
  slots: {
    default: '{{className}} fixture content'
  },
  rmt: {{rmtComponentMetadataJson}},
  expectedTelemetry: {
    schema: '{{componentLifecycleTelemetrySchema}}',
    operations: [{{componentTelemetryOperationsJson}}],
    lane: '{{performanceLane}}'
  },
  expectedA11y: {
    role: '{{a11yRole}}',
    accessibleName: '{{a11yAccessibleNameDefault}}'
  },
  expectedPerformance: {
    budgetClass: '{{performanceBudgetClass}}',
    hydrationPolicy: '{{performanceHydrationPolicy}}'
  }
} as const;

export default {{className}}FixtureData;

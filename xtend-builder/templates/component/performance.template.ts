export const {{className}}PerformanceProfile = {{performanceProfileJson}} as const;

export const {{className}}PerformanceScaffoldContract = {
  componentProfile: '{{performanceProfileSchema}}',
  policy: '{{performancePolicySchema}}',
  budgetMatrix: '{{performanceBudgetMatrixSchema}}',
  measurement: '{{performanceMeasurementContract}}',
  regressionGate: '{{performanceRegressionGate}}',
  hydrationPolicy: '{{performanceHydrationPolicyContract}}',
  lane: '{{performanceLane}}'
} as const;

export default {{className}}PerformanceProfile;

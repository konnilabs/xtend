export const {{className}}ComponentContract = {{componentContractV2Json}} as const;

export const {{className}}ComponentContractValidation = {
  schema: '{{componentContractV2ReportSchema}}',
  ok: {{componentContractV2Valid}},
  sourceStrategy: '{{tsSourceStrategySchema}}',
  localGate: 'node scripts/run_xtend_tests.js builder-typescript-blueprint --json'
} as const;

export default {{className}}ComponentContract;

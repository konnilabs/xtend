export const xRadioComponentContract = {
  schema: 'xtend.component.contract.v2',
  status: 'stable',
  workpackage: 'WP-E10-09',
  tag: 'x-radio',
  className: 'XRadio',
  source: {
    strategy: 'xtend.typescript.component-source-strategy.v1',
    state: 'ts-source',
    sourcePath: 'src/components/x-radio/x-radio.ts',
    contractPath: 'src/components/x-radio/x-radio.contract.ts',
    rmtMetadataPath: 'src/components/x-radio/x-radio.rmt.ts',
    a11yProfilePath: 'src/components/x-radio/x-radio.a11y.ts',
    performanceProfilePath: 'src/components/x-radio/x-radio.performance.ts',
    fixtureDataPath: 'src/components/x-radio/x-radio.fixture.ts'
  },
  runtime: { format: 'esm', artifact: 'components/xradio.js', declaration: 'components/xradio.d.ts', localOnly: true, cdnAllowed: false },
  publicApi: {
    attributes: ['name', 'value', 'checked', 'disabled', 'required', 'label'],
    slots: ['default', 'label', 'hint', 'error'],
    events: ['radio-changed', 'radio-invalid'],
    methods: ['focus(): void', 'check(): void', 'validate(): boolean']
  },
  rmt: { schema: 'xtend.rmt.component-contract.v1', adapter: 'xtend.component', kernelBoundary: 'no-rmt-kernel-import-of-xtend-types' },
  fabric: { schema: 'xtend.component.fabric-boundary.v2', api: '@xtend-fabric' },
  telemetry: { schema: 'xtend.fabric.telemetry-snapshot.v1', operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'] },
  lanes: { defaultLane: 'user-blocking' },
  a11y: { schema: 'xtend.a11y.component-contract.v1', role: 'radio' },
  performance: { schema: 'xtend.performance.component-profile.v1', budgetClass: 'interactive-small', lane: 'user-blocking', hydrationPolicy: 'visible' }
} as const;

export type XRadioComponentContract = typeof xRadioComponentContract;


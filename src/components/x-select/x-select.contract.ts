export const xSelectComponentContract = {
  schema: 'xtend.component.contract.v2',
  status: 'stable',
  workpackage: 'WP-E10-09',
  tag: 'x-select',
  className: 'XSelect',
  source: {
    strategy: 'xtend.typescript.component-source-strategy.v1',
    state: 'ts-source',
    sourcePath: 'src/components/x-select/x-select.ts',
    contractPath: 'src/components/x-select/x-select.contract.ts',
    rmtMetadataPath: 'src/components/x-select/x-select.rmt.ts',
    a11yProfilePath: 'src/components/x-select/x-select.a11y.ts',
    performanceProfilePath: 'src/components/x-select/x-select.performance.ts',
    fixtureDataPath: 'src/components/x-select/x-select.fixture.ts'
  },
  runtime: {
    format: 'esm',
    artifact: 'components/xselect.js',
    declaration: 'components/xselect.d.ts',
    localOnly: true,
    cdnAllowed: false
  },
  publicApi: {
    attributes: ['name', 'value', 'disabled', 'required', 'multiple', 'placeholder', 'label'],
    slots: ['default', 'option', 'label', 'hint', 'error'],
    events: ['select-changed', 'select-invalid'],
    methods: ['focus(): void', 'reset(): void', 'validate(): boolean']
  },
  rmt: {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
  },
  fabric: { schema: 'xtend.component.fabric-boundary.v2', api: '@xtend-fabric' },
  telemetry: { schema: 'xtend.fabric.telemetry-snapshot.v1', operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'] },
  lanes: { defaultLane: 'user-blocking' },
  a11y: { schema: 'xtend.a11y.component-contract.v1', role: 'combobox' },
  performance: { schema: 'xtend.performance.component-profile.v1', budgetClass: 'interactive-medium', lane: 'user-blocking', hydrationPolicy: 'visible' }
} as const;

export type XSelectComponentContract = typeof xSelectComponentContract;


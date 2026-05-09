export const xCheckboxComponentContract = {
  schema: 'xtend.component.contract.v2',
  status: 'stable',
  workpackage: 'WP-E10-09',
  tag: 'x-checkbox',
  className: 'XCheckbox',
  source: {
    strategy: 'xtend.typescript.component-source-strategy.v1',
    state: 'ts-source',
    sourcePath: 'src/components/x-checkbox/x-checkbox.ts',
    contractPath: 'src/components/x-checkbox/x-checkbox.contract.ts',
    rmtMetadataPath: 'src/components/x-checkbox/x-checkbox.rmt.ts',
    a11yProfilePath: 'src/components/x-checkbox/x-checkbox.a11y.ts',
    performanceProfilePath: 'src/components/x-checkbox/x-checkbox.performance.ts',
    fixtureDataPath: 'src/components/x-checkbox/x-checkbox.fixture.ts'
  },
  runtime: { format: 'esm', artifact: 'components/xcheckbox.js', declaration: 'components/xcheckbox.d.ts', localOnly: true, cdnAllowed: false },
  publicApi: {
    attributes: ['name', 'value', 'checked', 'disabled', 'required', 'indeterminate', 'label'],
    slots: ['default', 'label', 'hint', 'error'],
    events: ['checkbox-changed', 'checkbox-invalid'],
    methods: ['focus(): void', 'toggle(): void', 'validate(): boolean']
  },
  rmt: { schema: 'xtend.rmt.component-contract.v1', adapter: 'xtend.component', kernelBoundary: 'no-rmt-kernel-import-of-xtend-types' },
  fabric: { schema: 'xtend.component.fabric-boundary.v2', api: '@xtend-fabric' },
  telemetry: { schema: 'xtend.fabric.telemetry-snapshot.v1', operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'] },
  lanes: { defaultLane: 'user-blocking' },
  a11y: { schema: 'xtend.a11y.component-contract.v1', role: 'checkbox' },
  performance: { schema: 'xtend.performance.component-profile.v1', budgetClass: 'interactive-small', lane: 'user-blocking', hydrationPolicy: 'visible' }
} as const;

export type XCheckboxComponentContract = typeof xCheckboxComponentContract;


export const xProgressComponentContract = {
  schema: 'xtend.component.contract.v2',
  status: 'stable',
  workpackage: 'WP-E10-10',
  tag: 'x-progress',
  className: 'XProgress',
  source: {
    strategy: 'xtend.typescript.component-source-strategy.v1',
    state: 'ts-source',
    sourcePath: 'src/components/x-progress/x-progress.ts',
    contractPath: 'src/components/x-progress/x-progress.contract.ts',
    rmtMetadataPath: 'src/components/x-progress/x-progress.rmt.ts',
    a11yProfilePath: 'src/components/x-progress/x-progress.a11y.ts',
    performanceProfilePath: 'src/components/x-progress/x-progress.performance.ts',
    fixtureDataPath: 'src/components/x-progress/x-progress.fixture.ts'
  },
  runtime: {
    format: 'esm',
    artifact: 'components/xprogress.js',
    declaration: 'components/xprogress.d.ts',
    localOnly: true,
    cdnAllowed: false
  },
  publicApi: {
    attributes: ['value', 'max', 'label', 'status', 'indeterminate', 'busy'],
    slots: ['default', 'label'],
    events: ['progress-changed', 'progress-complete'],
    methods: ['setProgress(value: number): void', 'complete(): void', 'reset(): void']
  },
  rmt: {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
  },
  fabric: { schema: 'xtend.component.fabric-boundary.v2', api: '@xtend-fabric' },
  telemetry: { schema: 'xtend.fabric.telemetry-snapshot.v1', operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'] },
  lanes: { defaultLane: 'background' },
  a11y: { schema: 'xtend.a11y.component-contract.v1', role: 'progressbar' },
  performance: { schema: 'xtend.performance.component-profile.v1', budgetClass: 'feedback-small', lane: 'background', hydrationPolicy: 'visible' }
} as const;

export type XProgressComponentContract = typeof xProgressComponentContract;

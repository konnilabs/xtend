export const xStatusComponentContract = {
  schema: 'xtend.component.contract.v2',
  status: 'stable',
  workpackage: 'WP-E10-10',
  tag: 'x-status',
  className: 'XStatus',
  source: {
    strategy: 'xtend.typescript.component-source-strategy.v1',
    state: 'ts-source',
    sourcePath: 'src/components/x-status/x-status.ts',
    contractPath: 'src/components/x-status/x-status.contract.ts',
    rmtMetadataPath: 'src/components/x-status/x-status.rmt.ts',
    a11yProfilePath: 'src/components/x-status/x-status.a11y.ts',
    performanceProfilePath: 'src/components/x-status/x-status.performance.ts',
    fixtureDataPath: 'src/components/x-status/x-status.fixture.ts'
  },
  runtime: {
    format: 'esm',
    artifact: 'components/xstatus.js',
    declaration: 'components/xstatus.d.ts',
    localOnly: true,
    cdnAllowed: false
  },
  publicApi: {
    attributes: ['type', 'state', 'message', 'dismissible', 'busy', 'polite', 'label'],
    slots: ['default', 'label'],
    events: ['status-changed', 'status-dismissed'],
    methods: ['setStatus(nextState?: Partial<XStatusState>): void', 'dismiss(): void']
  },
  rmt: {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
  },
  fabric: { schema: 'xtend.component.fabric-boundary.v2', api: '@xtend-fabric' },
  telemetry: { schema: 'xtend.fabric.telemetry-snapshot.v1', operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'] },
  lanes: { defaultLane: 'feedback' },
  a11y: { schema: 'xtend.a11y.component-contract.v1', role: 'status' },
  performance: { schema: 'xtend.performance.component-profile.v1', budgetClass: 'feedback-small', lane: 'feedback', hydrationPolicy: 'visible' }
} as const;

export type XStatusComponentContract = typeof xStatusComponentContract;

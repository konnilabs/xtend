export const xPopoverComponentContract = {
  schema: 'xtend.component.contract.v2',
  status: 'stable',
  workpackage: 'WP-E10-11',
  tag: 'x-popover',
  className: 'XPopover',
  source: {
    strategy: 'xtend.typescript.component-source-strategy.v1',
    state: 'ts-source',
    sourcePath: 'src/components/x-popover/x-popover.ts',
    contractPath: 'src/components/x-popover/x-popover.contract.ts',
    rmtMetadataPath: 'src/components/x-popover/x-popover.rmt.ts',
    a11yProfilePath: 'src/components/x-popover/x-popover.a11y.ts',
    performanceProfilePath: 'src/components/x-popover/x-popover.performance.ts',
    fixtureDataPath: 'src/components/x-popover/x-popover.fixture.ts'
  },
  runtime: {
    format: 'esm',
    artifact: 'components/xpopover.js',
    declaration: 'components/xpopover.d.ts',
    localOnly: true,
    cdnAllowed: false
  },
  publicApi: {
    attributes: ['open', 'placement', 'modal', 'anchor', 'label'],
    slots: ['default', 'trigger', 'actions'],
    events: ['popover-opened', 'popover-closed'],
    methods: ['show(): void', 'hide(): void', 'toggle(): void']
  },
  rmt: {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
  },
  fabric: { schema: 'xtend.component.fabric-boundary.v2', api: '@xtend-fabric' },
  telemetry: { schema: 'xtend.fabric.telemetry-snapshot.v1', operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'] },
  lanes: { defaultLane: 'user-blocking' },
  a11y: { schema: 'xtend.a11y.component-contract.v1', role: 'dialog' },
  performance: { schema: 'xtend.performance.component-profile.v1', budgetClass: 'overlay-medium', lane: 'user-blocking', hydrationPolicy: 'visible' }
} as const;

export type XPopoverComponentContract = typeof xPopoverComponentContract;

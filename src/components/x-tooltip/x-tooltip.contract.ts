export const xTooltipComponentContract = {
  schema: 'xtend.component.contract.v2',
  status: 'stable',
  workpackage: 'WP-E10-11',
  tag: 'x-tooltip',
  className: 'XTooltip',
  source: {
    strategy: 'xtend.typescript.component-source-strategy.v1',
    state: 'ts-source',
    sourcePath: 'src/components/x-tooltip/x-tooltip.ts',
    contractPath: 'src/components/x-tooltip/x-tooltip.contract.ts',
    rmtMetadataPath: 'src/components/x-tooltip/x-tooltip.rmt.ts',
    a11yProfilePath: 'src/components/x-tooltip/x-tooltip.a11y.ts',
    performanceProfilePath: 'src/components/x-tooltip/x-tooltip.performance.ts',
    fixtureDataPath: 'src/components/x-tooltip/x-tooltip.fixture.ts'
  },
  runtime: {
    format: 'esm',
    artifact: 'components/xtooltip.js',
    declaration: 'components/xtooltip.d.ts',
    localOnly: true,
    cdnAllowed: false
  },
  publicApi: {
    attributes: ['for', 'placement', 'open', 'delay', 'label'],
    slots: ['default', 'trigger'],
    events: ['tooltip-opened', 'tooltip-closed'],
    methods: ['show(): void', 'hide(): void', 'toggle(): void']
  },
  rmt: {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
  },
  fabric: { schema: 'xtend.component.fabric-boundary.v2', api: '@xtend-fabric' },
  telemetry: { schema: 'xtend.fabric.telemetry-snapshot.v1', operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'] },
  lanes: { defaultLane: 'visible' },
  a11y: { schema: 'xtend.a11y.component-contract.v1', role: 'tooltip' },
  performance: { schema: 'xtend.performance.component-profile.v1', budgetClass: 'overlay-small', lane: 'visible', hydrationPolicy: 'idle' }
} as const;

export type XTooltipComponentContract = typeof xTooltipComponentContract;

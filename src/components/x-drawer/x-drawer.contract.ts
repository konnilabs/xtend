export const xDrawerComponentContract = {
  schema: 'xtend.component.contract.v2',
  status: 'stable',
  workpackage: 'WP-E10-11',
  tag: 'x-drawer',
  className: 'XDrawer',
  source: {
    strategy: 'xtend.typescript.component-source-strategy.v1',
    state: 'ts-source',
    sourcePath: 'src/components/x-drawer/x-drawer.ts',
    contractPath: 'src/components/x-drawer/x-drawer.contract.ts',
    rmtMetadataPath: 'src/components/x-drawer/x-drawer.rmt.ts',
    a11yProfilePath: 'src/components/x-drawer/x-drawer.a11y.ts',
    performanceProfilePath: 'src/components/x-drawer/x-drawer.performance.ts',
    fixtureDataPath: 'src/components/x-drawer/x-drawer.fixture.ts'
  },
  runtime: {
    format: 'esm',
    artifact: 'components/xdrawer.js',
    declaration: 'components/xdrawer.d.ts',
    localOnly: true,
    cdnAllowed: false
  },
  publicApi: {
    attributes: ['open', 'placement', 'modal', 'label', 'route-aware'],
    slots: ['default', 'trigger', 'header', 'footer'],
    events: ['drawer-opened', 'drawer-closed', 'drawer-route-selected'],
    methods: ['openDrawer(): void', 'closeDrawer(): void', 'toggle(): void']
  },
  rmt: {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
  },
  fabric: { schema: 'xtend.component.fabric-boundary.v2', api: '@xtend-fabric' },
  telemetry: { schema: 'xtend.fabric.telemetry-snapshot.v1', operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'] },
  lanes: { defaultLane: 'visible' },
  a11y: { schema: 'xtend.a11y.component-contract.v1', role: 'dialog' },
  performance: { schema: 'xtend.performance.component-profile.v1', budgetClass: 'overlay-large', lane: 'visible', hydrationPolicy: 'lazy' }
} as const;

export type XDrawerComponentContract = typeof xDrawerComponentContract;

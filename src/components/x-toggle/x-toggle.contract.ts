export const xToggleComponentContract = {
  schema: 'xtend.component.contract.v2',
  status: 'stable',
  workpackage: 'WP-XTOGGLE-01',
  tag: 'x-toggle',
  className: 'XToggle',
  source: {
    strategy: 'xtend.typescript.component-source-strategy.v1',
    state: 'ts-generated-esm',
    sourcePath: 'src/components/x-toggle/x-toggle.ts',
    contractPath: 'src/components/x-toggle/x-toggle.contract.ts',
    rmtMetadataPath: 'src/components/x-toggle/x-toggle.rmt.ts',
    a11yProfilePath: 'src/components/x-toggle/x-toggle.a11y.ts',
    performanceProfilePath: 'src/components/x-toggle/x-toggle.performance.ts',
    fixtureDataPath: 'src/components/x-toggle/x-toggle.fixture.ts'
  },
  runtime: { format: 'esm', artifact: 'components/xtoggle.js', declaration: 'components/xtoggle.d.ts', localOnly: true, cdnAllowed: false },
  publicApi: {
    attributes: ['name', 'value', 'checked', 'disabled', 'required', 'label', 'busy', 'invalid', 'density'],
    properties: ['checked', 'value', 'stateKey'],
    slots: ['default', 'label', 'hint', 'error', 'on-label', 'off-label'],
    events: ['toggle-changed', 'toggle-invalid'],
    methods: ['focus(): void', 'toggle(): void', 'validate(): boolean', 'checkValidity(): boolean', 'reportValidity(): boolean', 'reset(): void'],
    state: ['xtoggle-checked-<id>', 'xtoggle-state-<id>']
  },
  rmt: { schema: 'xtend.rmt.component-contract.v1', adapter: 'xtend.component', kernelBoundary: 'no-rmt-kernel-import-of-xtend-types' },
  fabric: { schema: 'xtend.component.fabric-boundary.v2', api: '@xtend-fabric', lane: 'user-blocking', a11yLane: 'a11y' },
  telemetry: { schema: 'xtend.fabric.telemetry-snapshot.v1', operations: ['mount', 'hydrate', 'render', 'update', 'event', 'keyboard', 'error', 'unmount'] },
  lanes: { defaultLane: 'user-blocking' },
  a11y: { schema: 'xtend.a11y.component-contract.v1', role: 'switch', accessibleName: 'required' },
  performance: { schema: 'xtend.performance.component-profile.v1', budgetClass: 'interactive-small', lane: 'user-blocking', hydrationPolicy: 'visible' },
  tests: { componentSuite: 'tests/components/xtoggle.component_suite.js', fixture: 'tests/components/fixtures/xtoggle.component.html' },
  docs: { de: 'docs/de/components/xtoggle.md', en: 'docs/en/components/xtoggle.md' }
} as const;

export type XToggleComponentContract = typeof xToggleComponentContract;


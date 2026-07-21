export const xTextareaComponentContract = {
  schema: 'xtend.component.contract.v2',
  status: 'stable',
  workpackage: 'WP-E10-10',
  tag: 'x-textarea',
  className: 'XTextarea',
  source: {
    strategy: 'xtend.typescript.component-source-strategy.v1',
    state: 'ts-source',
    sourcePath: 'src/components/x-textarea/x-textarea.ts',
    contractPath: 'src/components/x-textarea/x-textarea.contract.ts',
    rmtMetadataPath: 'src/components/x-textarea/x-textarea.rmt.ts',
    a11yProfilePath: 'src/components/x-textarea/x-textarea.a11y.ts',
    performanceProfilePath: 'src/components/x-textarea/x-textarea.performance.ts',
    fixtureDataPath: 'src/components/x-textarea/x-textarea.fixture.ts'
  },
  runtime: {
    format: 'esm',
    artifact: 'components/xtextarea.js',
    declaration: 'components/xtextarea.d.ts',
    localOnly: true,
    cdnAllowed: false
  },
  publicApi: {
    attributes: ['name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'maxlength', 'minlength', 'rows', 'label', 'busy', 'invalid', 'density', 'fill', 'submit-on-enter', 'submit-command', 'syntax-highlight', 'highlight', 'line-numbering', 'lang', 'language'],
    slots: ['label', 'hint', 'error'],
    events: ['textarea-changed', 'textarea-invalid', 'textarea-submit', 'xtend-command'],
    eventPayloads: {
      'textarea-changed': 'XTextareaChangedEventDetail',
      'textarea-invalid': 'XTextareaInvalidEventDetail',
      'textarea-submit': 'XTextareaSubmitEventDetail',
      'xtend-command': 'XTextareaCommandEventDetail'
    },
    methods: ['checkValidity(): boolean', 'reportValidity(): boolean', 'validate(): boolean', 'reset(): void', 'focus(): void', 'snapshot(): XTextareaSnapshot']
  },
  rmt: {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
  },
  fabric: { schema: 'xtend.component.fabric-boundary.v2', api: '@xtend-fabric' },
  telemetry: { schema: 'xtend.fabric.telemetry-snapshot.v1', operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'] },
  lanes: { defaultLane: 'user-blocking' },
  a11y: { schema: 'xtend.a11y.component-contract.v1', role: 'textbox' },
  performance: { schema: 'xtend.performance.component-profile.v1', budgetClass: 'interactive-medium', lane: 'user-blocking', hydrationPolicy: 'visible' }
} as const;

export type XTextareaComponentContract = typeof xTextareaComponentContract;

const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRootDir
} = require('../utils/files');

const DOCUMENTATION_GATES = [
  {
    label: 'Developer Center architecture overview',
    path: 'docs/de/README.md',
    contracts: [
      { pattern: 'XTend UI liefert die sichtbaren Web Components', message: 'documents the XTend UI layer' },
      { pattern: 'XTendRMT beschreibt App Shells', message: 'documents the XTendRMT layer' },
      { pattern: 'Fabric koordiniert Runtime-Arbeit', message: 'documents the Fabric layer' },
      { pattern: 'Der Loader verbindet alles lokal und ohne CDN', message: 'documents the local loader boundary' }
    ]
  },
  {
    label: 'RMT stack topography',
    path: 'docs/de/rmt-stack-topography.md',
    contracts: [
      { pattern: 'RMT Source', message: 'documents the RMT source layer' },
      { pattern: 'RMT Kernel', message: 'documents the RMT kernel layer' },
      { pattern: 'XTend Fabric', message: 'documents the Fabric layer' },
      { pattern: 'XTend UI, React, Vue oder VanillaJS', message: 'documents framework-neutral host boundaries' }
    ]
  },
  {
    label: 'Digital Twin compliance',
    path: 'compliance/digital-twin-principle.md',
    contracts: [
      { pattern: 'State als Single Source of Truth', message: 'defines state as the single source of truth' },
      { pattern: 'Keine lokalen Flags oder Workarounds', message: 'forbids local UI flags as truth source' },
      { pattern: 'Asynchrone Workarounds', message: 'forbids async workarounds for state coupling' },
      { pattern: 'Jede Aktion im UI', message: 'requires UI actions to write back to state' }
    ]
  },
  {
    label: 'Core compliance checklist',
    path: 'development/XTend-Core-Compliance-Checklist.md',
    contracts: [
      { pattern: 'lokale UI-Flags sind hoechstens abgeleitete Render-Caches', message: 'allows local UI flags only as derived render caches' },
      { pattern: 'kanonische State-Keys liegen unter dem XTend-Namespace', message: 'requires canonical XTend state keys' },
      { pattern: 'node scripts/run_xtend_tests.js architecture', message: 'documents the architecture gate command' }
    ]
  },
  {
    label: 'Architecture gate rules',
    path: 'development/XTend-Architecture-Gate-Regeln.md',
    contracts: [
      { pattern: 'SSOT-Regeln', message: 'documents SSOT rules' },
      { pattern: 'Digital-Twin-Regeln', message: 'documents Digital Twin rules' },
      { pattern: 'Anti-Technical-Debt-Regeln', message: 'documents anti-technical-debt rules' },
      { pattern: 'node scripts/run_xtend_tests.js architecture', message: 'documents local gate execution' }
    ]
  }
];

const RUNTIME_COMPLIANCE_GATES = [
  {
    label: 'API compliance runtime',
    path: 'api.js',
    contracts: [
      { pattern: 'XTEND_CORE_REVIEW_CHECKLIST', message: 'exposes review checklist metadata' },
      { pattern: 'State ist die einzige Wahrheitsquelle fuer UI-Status im Core.', message: 'publishes SSOT review criterion' },
      { pattern: 'Legacy-Vertraege bleiben nur als dokumentierte Kompatibilitaets-Fassade bestehen.', message: 'publishes legacy-facade criterion' },
      { pattern: 'XTEND_CORE_CONTRACTS', message: 'exposes core contract metadata' },
      { pattern: "xstate.set('xtend.compliance.version'", message: 'mirrors compliance version into xstate' },
      { pattern: "xstate.set('xtend.compliance.checklist'", message: 'mirrors compliance checklist into xstate' },
      { pattern: "xstate.set('xtend.compliance.contracts'", message: 'mirrors compliance contracts into xstate' },
      { pattern: "overlays: ['xtend.component.x-dialog.<id>.open', 'xtend.component.x-modal.<id>.open']", message: 'declares canonical overlay state keys' },
      { pattern: "theme: ['theme', 'themes', 'xtend.theme.current', 'xtend.theme.available']", message: 'declares legacy and canonical theme keys together' }
    ]
  },
  {
    label: 'xstate runtime',
    path: 'components/xstate.js',
    contracts: [
      { pattern: 'subscribe(fn, keyFilter)', message: 'documents subscribe as canonical state listener contract' },
      { pattern: 'return () => {', message: 'returns an unsubscribe function' },
      { pattern: /Legacy-Kompatibilit.t/, message: 'marks on/off as compatibility facade' },
      { pattern: 'on(key, fn)', message: 'keeps legacy on facade explicit' },
      { pattern: 'off(key, fn)', message: 'keeps legacy off facade explicit' }
    ]
  }
];

const STATE_KEY_GATES = [
  {
    label: 'dialog state contract',
    sourcePath: 'components/xdialog.js',
    docsPath: 'docs/components/xdialog.md',
    migrationPath: 'docs/core-migration-guide.md',
    sourceContracts: [
      { pattern: 'xtend.component.x-dialog.', message: 'uses canonical dialog state key' },
      { pattern: 'dialog-open-', message: 'keeps documented legacy dialog-open facade' },
      { pattern: 'xdialog-open-', message: 'keeps documented legacy xdialog-open facade' },
      { pattern: 'this._open = state.open', message: 'keeps local open cache derived from resolved state' },
      { pattern: '_syncOpenAttribute(this._open)', message: 'syncs DOM open attribute from resolved state' },
      { pattern: 'setDialogOpenState(this.id, false)', message: 'writes close interactions back to xstate' }
    ],
    docsContracts: [
      { pattern: 'xtend.component.x-dialog.<id>.open', message: 'documents canonical dialog key' },
      { pattern: 'dialog-open-<id>', message: 'documents legacy dialog key' },
      { pattern: 'xdialog-open-<id>', message: 'documents legacy xdialog key' }
    ],
    migrationContracts: [
      { pattern: '| Dialog Open | `dialog-open-<id>` | `xtend.component.x-dialog.<id>.open` | Legacy bleibt kompatibel |', message: 'maps dialog legacy key to canonical key' },
      { pattern: '| Dialog Open | `xdialog-open-<id>` | `xtend.component.x-dialog.<id>.open` | Legacy bleibt kompatibel |', message: 'maps xdialog legacy key to canonical key' }
    ]
  },
  {
    label: 'modal state contract',
    sourcePath: 'components/xmodal.js',
    docsPath: 'docs/components/xmodal.md',
    migrationPath: 'docs/core-migration-guide.md',
    sourceContracts: [
      { pattern: 'xtend.component.x-modal.', message: 'uses canonical modal state key' },
      { pattern: 'modal-open-', message: 'keeps documented legacy modal-open facade' },
      { pattern: 'this._open = state.open', message: 'keeps local open cache derived from resolved state' },
      { pattern: '_syncOpenAttribute(this._open)', message: 'syncs DOM open attribute from resolved state' },
      { pattern: 'setModalOpenState(this.id, false)', message: 'writes close interactions back to xstate' }
    ],
    docsContracts: [
      { pattern: 'xtend.component.x-modal.<id>.open', message: 'documents canonical modal key' },
      { pattern: 'modal-open-<id>', message: 'documents legacy modal key' }
    ],
    migrationContracts: [
      { pattern: '| Modal Open | `modal-open-<id>` | `xtend.component.x-modal.<id>.open` | Legacy bleibt kompatibel |', message: 'maps modal legacy key to canonical key' }
    ]
  },
  {
    label: 'alert state contract',
    sourcePath: 'components/xalert.js',
    docsPath: 'docs/components/xalert.md',
    migrationPath: 'docs/core-migration-guide.md',
    sourceContracts: [
      { pattern: 'xtend.component.x-alert.', message: 'uses canonical alert state key' },
      { pattern: 'xalert-state-', message: 'keeps documented legacy alert facade' },
      { pattern: 'setAlertState(this.id, {', message: 'writes alert state back to xstate' }
    ],
    docsContracts: [
      { pattern: 'xtend.component.x-alert.<id>', message: 'documents canonical alert key' },
      { pattern: 'xalert-state-<id>', message: 'documents legacy alert key' }
    ],
    migrationContracts: [
      { pattern: '| Alert State | `xalert-state-<id>` | `xtend.component.x-alert.<id>` | Legacy bleibt kompatibel |', message: 'maps alert legacy key to canonical key' }
    ]
  },
  {
    label: 'theme state contract',
    sourcePath: 'components/xtheme.js',
    docsPath: 'docs/components/xtheme.md',
    migrationPath: 'docs/core-migration-guide.md',
    sourceContracts: [
      { pattern: "xstate.set('theme', this.currentTheme)", message: 'keeps legacy theme key in sync' },
      { pattern: "xstate.set('xtend.theme.current', this.currentTheme)", message: 'writes canonical current theme key' },
      { pattern: "xstate.set('themes', availableThemes)", message: 'keeps legacy theme list in sync' },
      { pattern: "xstate.set('xtend.theme.available', availableThemes)", message: 'writes canonical theme list key' }
    ],
    docsContracts: [
      { pattern: 'window.XTend.theme', message: 'documents namespaced theme API' },
      { pattern: 'window.XTheme', message: 'documents compatibility facade' }
    ],
    migrationContracts: [
      { pattern: '| Theme Current | `theme` | `xtend.theme.current` | beide werden gespiegelt |', message: 'maps legacy current theme key to canonical key' },
      { pattern: '| Theme List | `themes` | `xtend.theme.available` | beide werden gespiegelt |', message: 'maps legacy theme list key to canonical key' }
    ]
  },
  {
    label: 'router state contract',
    sourcePath: 'components/xrouter.js',
    docsPath: 'docs/components/xrouter.md',
    migrationPath: 'docs/core-migration-guide.md',
    sourceContracts: [
      { pattern: "xstate.set('router-navigated', normalizedPath)", message: 'keeps legacy navigated path key in sync' },
      { pattern: "xstate.set('xtend.router.lastNavigated', normalizedPath)", message: 'writes canonical navigated path key' },
      { pattern: "xstate.set('router-current', enrichedDetail)", message: 'keeps legacy current route key in sync' },
      { pattern: "xstate.set('xtend.router.current', enrichedDetail)", message: 'writes canonical current route key' },
      { pattern: "xstate.set('router-rendered', enrichedDetail)", message: 'keeps legacy rendered route key in sync' },
      { pattern: "xstate.set('xtend.router.lastRendered', enrichedDetail)", message: 'writes canonical rendered route key' },
      { pattern: 'xstate.subscribe((key, value)', message: 'uses canonical xstate subscribe bridge' }
    ],
    docsContracts: [
      { pattern: 'router-navigate', message: 'documents navigation input key' },
      { pattern: 'router-navigated', message: 'documents legacy navigated path key' },
      { pattern: 'router-current', message: 'documents legacy current route key' },
      { pattern: 'router-rendered', message: 'documents legacy rendered route key' },
      { pattern: 'xtend.router.lastNavigated', message: 'documents canonical navigated path key' },
      { pattern: 'xtend.router.current', message: 'documents canonical current route key' },
      { pattern: 'xtend.router.lastRendered', message: 'documents canonical rendered route key' }
    ],
    migrationContracts: [
      { pattern: '| Router Last Navigation | `router-navigated` | `xtend.router.lastNavigated` | beide werden gespiegelt |', message: 'maps router legacy navigation key to canonical key' }
    ]
  }
];

const PRIORITIZED_CORE_FILES = [
  'api.js',
  'components/xrouter.js',
  'components/xlink.js',
  'components/xtheme.js',
  'components/xdialog.js',
  'components/xmodal.js',
  'components/xalert.js',
  'components/xtoast.js'
];

const COMPONENT_GLOBAL_HELPER_TARGETS = [
  'components/xrouter.js',
  'components/xlink.js',
  'components/xtheme.js',
  'components/xdialog.js',
  'components/xmodal.js',
  'components/xalert.js',
  'components/xtoast.js'
];

const FORBIDDEN_PRIORITY_PATTERNS = [
  { pattern: /\bxstate\.(?:on|off)\s*\(/, message: 'does not call legacy xstate.on/off in prioritized runtime code' },
  { pattern: /TODO|FIXME|HACK/, message: 'contains no unresolved TODO/FIXME/HACK markers in prioritized runtime code' }
];

const GLOBAL_HELPER_PATTERNS = [
  'window.showToast',
  'window.showAlert',
  'window.showDialog',
  'window.showModal'
];

const SYNCHRONOUS_STATE_COMPONENTS = [
  'components/xdialog.js',
  'components/xmodal.js'
];

const TIMER_FORBIDDEN_PATTERNS = [
  'setTimeout(',
  'setInterval(',
  'requestAnimationFrame('
];

function assertContracts(context, content, contracts, prefix) {
  contracts.forEach((contract) => {
    context.assertIncludes(content, contract.pattern, `${prefix}: ${contract.message}`);
  });
}

function assertAbsent(context, content, pattern, message) {
  const found = typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content);
  context.assert(!found, message);
}

function assertDocumentationGates(context, rootDir) {
  DOCUMENTATION_GATES.forEach((gate) => {
    const content = readText(gate.path, rootDir);
    assertContracts(context, content, gate.contracts, gate.label);
  });
}

function assertRuntimeComplianceGates(context, rootDir) {
  RUNTIME_COMPLIANCE_GATES.forEach((gate) => {
    const content = readText(gate.path, rootDir);
    assertContracts(context, content, gate.contracts, gate.label);
  });
}

function assertStateKeyGates(context, rootDir) {
  STATE_KEY_GATES.forEach((gate) => {
    const source = readText(gate.sourcePath, rootDir);

    assertContracts(context, source, gate.sourceContracts, `${gate.label} source`);
  });
}

function assertAntiPatternGates(context, rootDir) {
  PRIORITIZED_CORE_FILES.forEach((relativePath) => {
    const content = readText(relativePath, rootDir);
    FORBIDDEN_PRIORITY_PATTERNS.forEach((contract) => {
      assertAbsent(context, content, contract.pattern, `${relativePath}: ${contract.message}`);
    });
  });

  COMPONENT_GLOBAL_HELPER_TARGETS.forEach((relativePath) => {
    const content = readText(relativePath, rootDir);
    GLOBAL_HELPER_PATTERNS.forEach((pattern) => {
      assertAbsent(context, content, pattern, `${relativePath}: does not define unnamespaced global helper ${pattern}`);
    });
  });

  SYNCHRONOUS_STATE_COMPONENTS.forEach((relativePath) => {
    const content = readText(relativePath, rootDir);
    TIMER_FORBIDDEN_PATTERNS.forEach((pattern) => {
      assertAbsent(context, content, pattern, `${relativePath}: does not use ${pattern} workaround for open-state synchronization`);
    });
  });

  const api = readText('api.js', rootDir);
  GLOBAL_HELPER_PATTERNS.forEach((pattern) => {
    context.assertIncludes(api, pattern, `api.js: keeps documented legacy helper facade ${pattern}`);
  });

  const apiDocs = readText('docs/de/api.md', rootDir);
  context.assertIncludes(apiDocs, 'window.XTend', 'API docs prefer the namespaced XTend host API');
}

function runArchitectureGateSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'architecture',
    label: 'Architecture quality gates'
  });

  assertDocumentationGates(context, rootDir);
  assertRuntimeComplianceGates(context, rootDir);
  assertStateKeyGates(context, rootDir);
  assertAntiPatternGates(context, rootDir);

  return context.result({
    documentationGates: DOCUMENTATION_GATES.map((gate) => gate.path),
    stateKeyGates: STATE_KEY_GATES.map((gate) => gate.label),
    prioritizedCoreFiles: PRIORITIZED_CORE_FILES
  });
}

function printArchitectureGateReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Architecture Quality Gates erfolgreich.',
    failureTitle: 'XTend Architecture Quality Gates fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runArchitectureGateSuite();
  printArchitectureGateReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printArchitectureGateReport,
  runArchitectureGateSuite
};

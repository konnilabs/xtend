const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  RUNTIME_A11Y_CONTRACT_SCHEMA,
  RUNTIME_A11Y_REPORT_SCHEMA,
  RUNTIME_A11Y_WORKPACKAGE,
  COMPONENT_SHELL_CONTRACT_SCHEMA,
  COMPONENT_STYLING_CONTRACT_SCHEMA,
  A11Y_COMPONENT_CONTRACT_SCHEMA,
  SCREENREADER_SIGNALS_SCHEMA,
  MOTION_CONTRAST_POLICY_SCHEMA,
  RMT_A11Y_AUTHORING_SCHEMA,
  KERNEL_BOUNDARY,
  RUNTIME_A11Y_REQUIRED_DOMAINS,
  RUNTIME_A11Y_PROFILES,
  RUNTIME_A11Y_REQUIRED_ASSERTIONS,
  RUNTIME_A11Y_REQUIRED_STATES,
  RUNTIME_A11Y_KEYBOARD_KEYS,
  RUNTIME_A11Y_FOCUS_BEHAVIORS,
  RUNTIME_A11Y_LIVE_REGION_MODES,
  createRuntimeA11yContract,
  validateRuntimeA11yContract
} = require('../../a11y/runtime-a11y-contract');

function runRuntimeA11yContractSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'runtime-a11y-contract',
    label: 'XTend Runtime A11y UX Contract'
  });
  const packageManifest = readJson('package.json', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const contractDoc = readText('development/XTend-Runtime-A11y-UX-Contract.md', rootDir);
  const workpackage = readText('development/WP-E11-04-Runtime-A11y-Contract-fuer-echte-UI-Bedienbarkeit-haerten.md', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.runtimeA11yContract;
  const overlay = createRuntimeA11yContract({
    tag: 'x-dialog',
    profiles: ['overlay']
  });
  const form = createRuntimeA11yContract({
    tag: 'x-form',
    profiles: ['form']
  });
  const routing = createRuntimeA11yContract({
    tag: 'x-tabs',
    profiles: ['routing', 'interactive']
  });
  const validation = validateRuntimeA11yContract(overlay);
  const invalidValidation = validateRuntimeA11yContract({
    schema: RUNTIME_A11Y_CONTRACT_SCHEMA,
    tag: 'dialog',
    profiles: ['unknown'],
    semantics: { nativeFirst: false },
    accessibleName: { required: false },
    keyboard: { required: false, keys: [] },
    focus: { visibleRequired: false },
    screenreader: { schema: 'missing', liveRegion: 'loud' },
    motion: { reducedMotionSafe: false },
    contrast: { noColorOnlyState: false },
    states: { requiredBehavior: [] },
    rmt: { kernelBoundary: 'xtend-imports-in-rmt-kernel' },
    fabric: { lane: 'visible' },
    compatibility: { browserBehaviorRequired: false }
  });

  context.assert(overlay.schema === RUNTIME_A11Y_CONTRACT_SCHEMA, 'Runtime A11y factory emits Runtime A11y schema');
  context.assert(validation.schema === RUNTIME_A11Y_REPORT_SCHEMA, 'Runtime A11y validator emits report schema');
  context.assert(validation.ok, 'Runtime A11y validator accepts a complete overlay contract');
  context.assert(!invalidValidation.ok, 'Runtime A11y validator rejects invalid runtime A11y contracts');
  context.assert(overlay.componentA11yContract === A11Y_COMPONENT_CONTRACT_SCHEMA, 'Runtime A11y contract extends A11y Component Contract');
  context.assert(overlay.shellContract === COMPONENT_SHELL_CONTRACT_SCHEMA, 'Runtime A11y contract binds Component Shell Contract');
  context.assert(overlay.stylingContract === COMPONENT_STYLING_CONTRACT_SCHEMA, 'Runtime A11y contract binds Component Styling Contract');
  context.assert(overlay.primaryProfile === 'overlay', 'Overlay contract derives overlay as primary profile');
  context.assert(overlay.semantics.role === 'dialog', 'Overlay contract derives dialog role');
  context.assert(overlay.semantics.nativeFirst === true, 'Runtime A11y requires native-first semantics');
  context.assert(overlay.accessibleName.required === true, 'Runtime A11y requires accessible names');
  context.assert(overlay.keyboard.keys.includes('Escape'), 'Overlay contract includes Escape key');
  context.assert(overlay.keyboard.keys.includes('Tab'), 'Overlay contract includes Tab key');
  context.assert(overlay.focus.trapRequiredForModalOverlays === true, 'Overlay contract requires focus trap');
  context.assert(overlay.focus.restoreRequiredForOverlays === true, 'Overlay contract requires focus return');
  context.assert(overlay.aria.mirrorVisualStates === true, 'ARIA mirrors visual states');
  context.assert(overlay.screenreader.schema === SCREENREADER_SIGNALS_SCHEMA, 'Runtime A11y binds Screenreader Signals');
  context.assert(overlay.screenreader.signals.includes('dialog-context'), 'Overlay contract includes dialog context signal');
  context.assert(overlay.motion.schema === MOTION_CONTRAST_POLICY_SCHEMA, 'Runtime A11y binds Motion/Contrast policy');
  context.assert(overlay.motion.reducedMotionSafe === true, 'Runtime A11y requires reduced-motion safety');
  context.assert(overlay.contrast.focusVisibleRequired === true, 'Runtime A11y requires focus-visible contrast');
  context.assert(overlay.states.requiredBehavior.includes('invalid'), 'Runtime A11y covers invalid state behavior');
  context.assert(overlay.overlays.ariaModalRequired === true, 'Overlay contract requires aria-modal');
  context.assert(form.forms.validationAnnouncementRequired === true, 'Form contract requires validation announcement');
  context.assert(form.screenreader.errorRegionsRequired === true, 'Form contract requires error regions');
  context.assert(routing.routing.routeAnnouncementRequired === true, 'Routing contract requires route announcements');
  context.assert(routing.routing.activeRouteFocusRequired === true, 'Routing contract requires active route focus');
  context.assert(overlay.rmt.schema === RMT_A11Y_AUTHORING_SCHEMA, 'Runtime A11y prepares RMT A11y Authoring schema');
  context.assert(overlay.rmt.kernelBoundary === KERNEL_BOUNDARY, 'Runtime A11y keeps RMT kernel boundary');
  context.assert(overlay.fabric.lane === 'a11y', 'Runtime A11y maps Fabric lane to a11y');
  context.assert(overlay.fabric.fiberKinds.includes('a11y.focus'), 'Runtime A11y exposes A11y focus fiber');
  context.assert(overlay.compatibility.hostModes.includes('rmt-first'), 'Runtime A11y keeps RMT-first compatibility');
  context.assert(RUNTIME_A11Y_REQUIRED_DOMAINS.includes('keyboard'), 'Required Runtime A11y domains include keyboard');
  context.assert(RUNTIME_A11Y_REQUIRED_DOMAINS.includes('screenreader'), 'Required Runtime A11y domains include screenreader');
  context.assert(RUNTIME_A11Y_REQUIRED_DOMAINS.includes('motion'), 'Required Runtime A11y domains include motion');
  context.assert(RUNTIME_A11Y_PROFILES.includes('overlay'), 'Runtime A11y profiles include overlay');
  context.assert(RUNTIME_A11Y_REQUIRED_ASSERTIONS.includes('focus-visible'), 'Runtime A11y assertions include focus-visible');
  context.assert(RUNTIME_A11Y_REQUIRED_STATES.includes('busy'), 'Runtime A11y required states include busy');
  context.assert(RUNTIME_A11Y_KEYBOARD_KEYS.includes('Shift+Tab'), 'Runtime A11y keyboard keys include Shift+Tab');
  context.assert(RUNTIME_A11Y_FOCUS_BEHAVIORS.includes('route-stable'), 'Runtime A11y focus behaviors include route-stable');
  context.assert(RUNTIME_A11Y_LIVE_REGION_MODES.includes('assertive'), 'Runtime A11y live region modes include assertive');
  context.assert(packageManifest.exports['./a11y/runtime-a11y-contract'] === './a11y/runtime-a11y-contract.js', 'Package exports Runtime A11y Contract module');
  context.assert(packageManifest.scripts['test:runtime-a11y-contract'] === 'node scripts/run_xtend_tests.js runtime-a11y-contract', 'Package exposes Runtime A11y Contract test script');
  context.assert(metadata && metadata.schema === RUNTIME_A11Y_CONTRACT_SCHEMA, 'Package metadata exposes Runtime A11y schema');
  context.assert(metadata.reportSchema === RUNTIME_A11Y_REPORT_SCHEMA, 'Package metadata exposes Runtime A11y report schema');
  context.assert(metadata.workpackage === RUNTIME_A11Y_WORKPACKAGE, 'Package metadata exposes WP-E11-04 owner');
  context.assert(metadata.contract === 'development/XTend-Runtime-A11y-UX-Contract.md', 'Package metadata exposes Runtime A11y contract doc path');
  context.assert(metadata.module === 'a11y/runtime-a11y-contract.js', 'Package metadata exposes Runtime A11y module path');
  context.assert(Array.isArray(metadata.requiredAssertions) && metadata.requiredAssertions.includes('keyboard-path'), 'Package metadata exposes keyboard-path assertion');
  context.assert(Array.isArray(metadata.requiredStates) && metadata.requiredStates.includes('invalid'), 'Package metadata exposes invalid state behavior');
  context.assert(metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps RMT kernel boundary');
  context.assertIncludes(scaffoldConfig, 'runtimeA11yContract', 'Scaffold config exposes Runtime A11y Contract section');
  context.assertIncludes(scaffoldConfig, RUNTIME_A11Y_CONTRACT_SCHEMA, 'Scaffold config declares Runtime A11y schema');
  context.assertIncludes(scaffoldConfig, 'runtime-a11y-contract', 'Scaffold config references Runtime A11y gate');
  context.assertIncludes(runner, "id: 'runtime-a11y-contract'", 'Runner exposes Runtime A11y Contract suite');
  context.assertIncludes(contractDoc, RUNTIME_A11Y_CONTRACT_SCHEMA, 'Contract document declares Runtime A11y schema');
  context.assertIncludes(contractDoc, 'XtendRuntimeA11yContract', 'Contract document defines the TypeScript interface name');
  context.assertIncludes(contractDoc, RMT_A11Y_AUTHORING_SCHEMA, 'Contract document declares RMT A11y Authoring handoff');
  context.assertIncludes(contractDoc, KERNEL_BOUNDARY, 'Contract document keeps RMT kernel boundary visible');
  context.assertIncludes(contractDoc, '`keyboard-path`, `focus-visible`, `screenreader-signal`', 'Contract document lists browser behavior assertions');
  context.assertIncludes(workpackage, 'xtend.epic11.wp04.runtime-a11y-contract.v1', 'WP-E11-04 declares workpackage schema');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-04 is completed');
  context.assertIncludes(workpackage, 'node scripts/run_xtend_tests.js runtime-a11y-contract --json', 'WP-E11-04 documents local gate');
  context.assertIncludes(epic, '| `WP-E11-04` | P0 | completed |', 'Epic 11 marks WP-E11-04 completed');
  context.assertIncludes(epic, '| `WP-E11-05` | P0 | completed |', 'Epic 11 marks WP-E11-05 completed after UX Performance');
  context.assertIncludes(backlog, '| `WP-E11-04` | P0 | completed | WS2 |', 'Epic 11 backlog marks WP-E11-04 completed');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-04', 'Epic 11 backlog documents WP-E11-04 handoff');

  return context.result({
    schema: RUNTIME_A11Y_CONTRACT_SCHEMA,
    profiles: RUNTIME_A11Y_PROFILES,
    assertions: RUNTIME_A11Y_REQUIRED_ASSERTIONS
  });
}

function printRuntimeA11yContractReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Runtime A11y UX Contract erfolgreich.',
    failureTitle: 'XTend Runtime A11y UX Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRuntimeA11yContractReport,
  runRuntimeA11yContractSuite
};

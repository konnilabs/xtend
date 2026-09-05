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
  KERNEL_BOUNDARY,
  OVERLAY_INTERACTION_PROFILES,
  OVERLAY_INTERACTION_REQUIRED_ASSERTIONS,
  OVERLAY_INTERACTION_REQUIRED_COMMANDS,
  OVERLAY_INTERACTION_REQUIRED_DOMAINS,
  OVERLAY_INTERACTION_REQUIRED_EVENTS,
  OVERLAY_INTERACTION_REQUIRED_SCHEDULES,
  OVERLAY_INTERACTION_TARGETS,
  OVERLAY_INTERACTION_UX_CONTRACT_DOC,
  OVERLAY_INTERACTION_UX_FIXTURE,
  OVERLAY_INTERACTION_UX_REPORT_SCHEMA,
  OVERLAY_INTERACTION_UX_SCHEMA,
  OVERLAY_INTERACTION_UX_WORKPACKAGE,
  createOverlayInteractionUxContract,
  validateOverlayInteractionUxContract
} = require('../../xtend-builder/typing/overlay-interaction-ux-contract');

const componentPaths = {
  'x-modal': {
    source: 'components/xmodal.js',
    types: 'components/xmodal.d.ts',
    docs: 'docs/components/xmodal.md',
    event: 'modal-opened',
    stateKey: 'modal-open-<id>',
    command: 'snapshot'
  },
  'x-dialog': {
    source: 'components/xdialog.js',
    types: 'components/xdialog.d.ts',
    docs: 'docs/components/xdialog.md',
    event: 'dialog-opened',
    stateKey: 'dialog-open-<id>',
    command: 'snapshot'
  },
  'x-popover': {
    source: 'components/xpopover.js',
    types: 'components/xpopover.d.ts',
    docs: 'docs/components/xpopover.md',
    event: 'popover-opened',
    stateKey: 'xpopover-open-<id>',
    command: 'snapshot'
  },
  'x-tooltip': {
    source: 'components/xtooltip.js',
    types: 'components/xtooltip.d.ts',
    docs: 'docs/components/xtooltip.md',
    event: 'tooltip-opened',
    stateKey: 'xtooltip-open-<id>',
    command: 'snapshot'
  },
  'x-drawer': {
    source: 'components/xdrawer.js',
    types: 'components/xdrawer.d.ts',
    docs: 'docs/components/xdrawer.md',
    event: 'drawer-opened',
    stateKey: 'xdrawer-open-<id>',
    command: 'snapshot'
  }
};

function indexById(records = []) {
  return new Map(records.map((record) => [record.id, record]));
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertFixtureReferencesResolve(context, fixture) {
  const adapters = indexById(fixture.adapters);
  const schedules = indexById(fixture.schedules);
  const components = indexById(fixture.components);
  const templates = indexById(fixture.templates);

  (fixture.components || []).forEach((component) => {
    context.assert(adapters.has(component.adapter), `${component.id}: adapter resolves`);
    context.assert(templates.has(component.template), `${component.id}: template resolves`);
    context.assert(schedules.has(component.schedule), `${component.id}: schedule resolves`);
    Object.values(component.commands || {}).forEach((command) => {
      context.assert(schedules.has(command.schedule), `${component.id}: command schedule ${command.schedule} resolves`);
    });
  });

  (fixture.templates || []).forEach((template) => {
    (template.nodes || []).forEach((node) => {
      if (node.component) context.assert(components.has(node.component), `${template.id}: node component ${node.component} resolves`);
    });
  });

  ((fixture.diagnostics && fixture.diagnostics.snapshots) || []).forEach((snapshot) => {
    context.assert(schedules.has(snapshot.schedule), `diagnostics snapshot schedule ${snapshot.schedule} resolves`);
    (snapshot.targets || []).forEach((target) => {
      context.assert(components.has(target), `diagnostics snapshot target ${target} resolves`);
    });
  });
}

function runOverlayInteractionUxSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'overlay-interaction-ux',
    label: 'XTend Overlay and Interaction UX maturity'
  });
  const contract = createOverlayInteractionUxContract();
  const validation = validateOverlayInteractionUxContract(contract);
  const invalidValidation = validateOverlayInteractionUxContract({
    schema: OVERLAY_INTERACTION_UX_SCHEMA,
    kernelBoundary: 'xtend-imports-in-rmt-kernel',
    targets: ['x-modal'],
    domains: [],
    requiredEvents: [],
    requiredCommands: [],
    requiredSchedules: [],
    overlayStack: { topmostEscapeOnly: false },
    focusTrap: { containedTabCycleRequired: false, returnFocusRequired: false },
    inert: { backgroundInertRequired: false },
    scrollLock: { balancedLockRequired: false },
    portal: { stableContainerRequired: false },
    rmt: { shellFirst: false, noInlineRuntimeCode: false },
    fabric: { telemetryCorrelationRequired: false },
    tests: { assertions: [] }
  });
  const fixture = readJson(OVERLAY_INTERACTION_UX_FIXTURE, rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const contractDoc = readText(OVERLAY_INTERACTION_UX_CONTRACT_DOC, rootDir);
  const workpackage = readText('development/WP-E11-11-Overlay-und-Interaction-UX-Reife-umsetzen.md', rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const refs = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const typingReadme = readText('xtend-builder/typing/README.md', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.overlayInteractionUxMaturity;
  const components = indexById(fixture.components);
  const schedules = indexById(fixture.schedules);
  const adapters = indexById(fixture.adapters);

  context.assert(contract.schema === OVERLAY_INTERACTION_UX_SCHEMA, 'Overlay Interaction UX factory emits stable schema');
  context.assert(validation.schema === OVERLAY_INTERACTION_UX_REPORT_SCHEMA, 'Overlay Interaction UX validator emits report schema');
  context.assert(validation.ok, 'Overlay Interaction UX validator accepts factory output');
  context.assert(!invalidValidation.ok, 'Overlay Interaction UX validator rejects invalid records');
  context.assert(contract.workpackage === OVERLAY_INTERACTION_UX_WORKPACKAGE, 'Overlay Interaction UX contract is owned by WP-E11-11');
  context.assert(contract.kernelBoundary === KERNEL_BOUNDARY, 'Overlay Interaction UX contract preserves RMT kernel boundary');
  assertIncludesAll(context, contract.targets, OVERLAY_INTERACTION_TARGETS, 'Overlay Interaction UX targets');
  assertIncludesAll(context, contract.domains, OVERLAY_INTERACTION_REQUIRED_DOMAINS, 'Overlay Interaction UX domains');
  assertIncludesAll(context, contract.requiredEvents, OVERLAY_INTERACTION_REQUIRED_EVENTS, 'Overlay Interaction UX events');
  assertIncludesAll(context, contract.requiredCommands, OVERLAY_INTERACTION_REQUIRED_COMMANDS, 'Overlay Interaction UX commands');
  assertIncludesAll(context, contract.requiredSchedules, OVERLAY_INTERACTION_REQUIRED_SCHEDULES, 'Overlay Interaction UX schedules');
  assertIncludesAll(context, contract.tests.assertions, OVERLAY_INTERACTION_REQUIRED_ASSERTIONS, 'Overlay Interaction UX assertions');
  context.assert(contract.overlayStack.topmostEscapeOnly === true, 'Overlay Interaction UX contract requires topmost Escape behavior');
  context.assert(contract.focusTrap.containedTabCycleRequired === true, 'Overlay Interaction UX contract requires contained focus trap');
  context.assert(contract.focusTrap.returnFocusRequired === true, 'Overlay Interaction UX contract requires focus return');
  context.assert(contract.inert.backgroundInertRequired === true, 'Overlay Interaction UX contract requires inert background policy');
  context.assert(contract.scrollLock.balancedLockRequired === true, 'Overlay Interaction UX contract requires balanced scroll lock');
  context.assert(contract.portal.stableContainerRequired === true, 'Overlay Interaction UX contract requires stable portal container');
  context.assert(contract.rmt.shellFirst === true, 'Overlay Interaction UX contract is RMT shell-first ready');
  context.assert(contract.fabric.telemetryCorrelationRequired === true, 'Overlay Interaction UX contract requires Fabric telemetry correlation');

  context.assert(fixture.manifest.metadata.contractVersion === OVERLAY_INTERACTION_UX_SCHEMA, 'RMT fixture declares Overlay Interaction UX schema');
  context.assert(fixture.manifest.metadata.workpackage === OVERLAY_INTERACTION_UX_WORKPACKAGE, 'RMT fixture declares WP-E11-11 owner');
  context.assert(fixture.manifest.metadata.kernelBoundary === KERNEL_BOUNDARY, 'RMT fixture preserves kernel boundary');
  OVERLAY_INTERACTION_REQUIRED_SCHEDULES.forEach((schedule) => {
    context.assert(schedules.has(schedule), `RMT fixture declares ${schedule}`);
  });
  context.assert(adapters.has('rmt.overlay-stack'), 'RMT fixture declares overlay-stack host adapter');
  OVERLAY_INTERACTION_TARGETS.forEach((tag) => {
    const matching = (fixture.components || []).find((component) => component.tag === tag);
    context.assert(Boolean(matching), `RMT fixture includes ${tag}`);
    if (matching) {
      context.assert(Boolean(matching.a11y), `${tag}: declares a11y record`);
      context.assert(Boolean(matching.overlay), `${tag}: declares overlay record`);
      context.assert(Boolean(matching.fabric), `${tag}: declares Fabric record`);
      context.assert(Boolean(matching.commands), `${tag}: declares commands record`);
    }
  });
  context.assert(components.get('overlay.modal').commands['focus-trap'].schedule === 'overlay.focus.trap', 'RMT fixture schedules modal focus trap');
  context.assert(components.get('overlay.dialog').commands['apply-inert'].schedule === 'overlay.inert.apply', 'RMT fixture schedules dialog inert application');
  context.assert(components.get('overlay.popover').commands.toggle.schedule === 'overlay.position.update', 'RMT fixture schedules popover position update');
  context.assert(components.get('overlay.tooltip').commands.show.schedule === 'overlay.position.update', 'RMT fixture schedules tooltip position update');
  context.assert(components.get('overlay.drawer').commands['lock-scroll'].schedule === 'overlay.scroll.lock', 'RMT fixture schedules drawer scroll lock');
  assertFixtureReferencesResolve(context, fixture);

  OVERLAY_INTERACTION_PROFILES.forEach((profile) => {
    const paths = componentPaths[profile.tag];
    const source = readText(paths.source, rootDir);
    const types = readText(paths.types, rootDir);
    const docs = readText(paths.docs, rootDir);

    context.assert(source.includes('xtendOverlayInteractionUxProfile'), `${profile.tag} exposes xtendOverlayInteractionUxProfile`);
    context.assert(source.includes(`componentRef: '${profile.tag}'`) || source.includes(`componentRef: "${profile.tag}"`), `${profile.tag} UX profile declares componentRef`);
    context.assert(source.includes('xtend.component.overlay-interaction-ux-profile.v1'), `${profile.tag} source declares Overlay Interaction UX profile schema`);
    context.assert(source.includes('xtend.rmt.component-contract.v1'), `${profile.tag} source exposes RMT metadata`);
    context.assert(source.includes(KERNEL_BOUNDARY), `${profile.tag} source preserves RMT kernel boundary`);
    context.assert(source.includes('@xtend-fabric'), `${profile.tag} source exposes Fabric API marker`);
    context.assert(source.includes('xtend.performance.component-profile.v1'), `${profile.tag} source exposes performance profile`);
    context.assert(source.includes('xtend.a11y.screenreader-signals.v1'), `${profile.tag} source exposes screenreader signals`);
    context.assert(source.includes('prefers-reduced-motion'), `${profile.tag} source is reduced-motion safe`);
    context.assert(source.includes('forced-colors'), `${profile.tag} source is forced-colors safe`);
    context.assert(source.includes('part=') || source.includes('setAttribute("part"') || source.includes("setAttribute('part'"), `${profile.tag} source exposes CSS parts`);
    context.assert(source.includes(paths.event), `${profile.tag} source exposes ${paths.event}`);
    context.assert(source.includes(profile.schedule), `${profile.tag} source declares schedule ${profile.schedule}`);
    context.assert(source.includes(paths.stateKey.replace('<id>', '${this.id}')) || source.includes(paths.stateKey), `${profile.tag} source declares state key ${paths.stateKey}`);
    context.assert(source.includes(paths.command), `${profile.tag} source exposes command ${paths.command}`);
    context.assert(source.includes('Escape'), `${profile.tag} source exposes Escape handling`);
    context.assert(source.includes('focus'), `${profile.tag} source exposes focus handling`);
    context.assert(types.includes('XtendOverlayInteractionUxProfile'), `${profile.tag} public types import Overlay Interaction UX profile`);
    context.assert(types.includes('OverlayInteractionUxProfile'), `${profile.tag} public types export profile alias`);
    context.assert(docs.includes('xtend.component.overlay-interaction-ux-profile.v1'), `${profile.tag} docs describe Overlay Interaction UX profile`);
    context.assert(docs.includes(paths.stateKey), `${profile.tag} docs describe state key ${paths.stateKey}`);
  });

  context.assert((typeof packageManifest.exports['./builder/typing/overlay-interaction-ux-contract'] === 'string' ? packageManifest.exports['./builder/typing/overlay-interaction-ux-contract'] : packageManifest.exports['./builder/typing/overlay-interaction-ux-contract'] && packageManifest.exports['./builder/typing/overlay-interaction-ux-contract'].default) === './xtend-builder/typing/overlay-interaction-ux-contract.js', 'Package exports Overlay Interaction UX contract module');
  context.assert(packageManifest.scripts['test:overlay-interaction-ux'] === 'node scripts/run_xtend_tests.js overlay-interaction-ux', 'Package exposes Overlay Interaction UX test script');
  context.assert(metadata && metadata.schema === OVERLAY_INTERACTION_UX_SCHEMA, 'Package metadata exposes Overlay Interaction UX schema');
  context.assert(metadata.reportSchema === OVERLAY_INTERACTION_UX_REPORT_SCHEMA, 'Package metadata exposes Overlay Interaction UX report schema');
  context.assert(metadata.fixture === OVERLAY_INTERACTION_UX_FIXTURE, 'Package metadata exposes Overlay Interaction UX fixture');
  context.assert(Array.isArray(metadata.targets) && metadata.targets.includes('x-modal'), 'Package metadata includes x-modal target');
  context.assert(Array.isArray(metadata.requiredAssertions) && metadata.requiredAssertions.includes('focus-trap-contained'), 'Package metadata exposes focus trap assertion');
  context.assert(metadata.profileGetter === 'xtendOverlayInteractionUxProfile', 'Package metadata exposes Overlay Interaction UX profile getter');
  context.assert(metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata preserves RMT kernel boundary');
  context.assertIncludes(scaffoldConfig, 'overlayInteractionUxMaturity', 'Scaffold config exposes Overlay Interaction UX section');
  context.assertIncludes(scaffoldConfig, OVERLAY_INTERACTION_UX_SCHEMA, 'Scaffold config declares Overlay Interaction UX schema');
  context.assert(runner.hasSuite("overlay-interaction-ux"), 'Runner exposes Overlay Interaction UX suite');
  context.assertIncludes(contractDoc, OVERLAY_INTERACTION_UX_SCHEMA, 'Contract document declares Overlay Interaction UX schema');
  context.assertIncludes(contractDoc, '`xtendOverlayInteractionUxProfile`', 'Contract document describes runtime profile');
  context.assertIncludes(workpackage, 'xtend.epic11.wp11.overlay-interaction-ux.v1', 'WP-E11-11 document declares schema');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-11 document is completed');
  context.assertIncludes(epic, '| `WP-E11-11` | P1 | completed |', 'Epic marks WP-E11-11 completed');
  context.assertIncludes(epic, '| `WP-E11-12` | P1 | completed |', 'Epic marks WP-E11-12 completed');
  context.assertIncludes(epic, '| `WP-E11-13` | P1 | completed |', 'Epic marks WP-E11-13 completed');
  context.assertIncludes(epic, '| `WP-E11-14` | P1 | completed |', 'Epic marks WP-E11-14 completed');
  context.assertIncludes(epic, '| `WP-E11-15` | P1 | completed |', 'Epic marks WP-E11-15 completed');
  context.assertIncludes(epic, '| `WP-E11-16` | P1 | completed |', 'Epic marks WP-E11-16 completed');
  context.assertIncludes(epic, '| `WP-E11-17` | P2 | completed |', 'Epic marks WP-E11-17 completed');
  context.assertIncludes(backlog, '| `WP-E11-11` | P1 | completed |', 'Backlog marks WP-E11-11 completed');
  context.assertIncludes(backlog, '| `WP-E11-12` | P1 | completed |', 'Backlog marks WP-E11-12 completed');
  context.assertIncludes(backlog, '| `WP-E11-13` | P1 | completed |', 'Backlog marks WP-E11-13 completed');
  context.assertIncludes(backlog, '| `WP-E11-14` | P1 | completed |', 'Backlog marks WP-E11-14 completed');
  context.assertIncludes(backlog, '| `WP-E11-15` | P1 | completed |', 'Backlog marks WP-E11-15 completed');
  context.assertIncludes(backlog, '| `WP-E11-16` | P1 | completed |', 'Backlog marks WP-E11-16 completed');
  context.assertIncludes(backlog, '| `WP-E11-17` | P2 | completed |', 'Backlog marks WP-E11-17 completed');
  context.assertIncludes(refs, OVERLAY_INTERACTION_UX_FIXTURE, 'Reference registry includes Overlay Interaction UX fixture');
  context.assertIncludes(refs, 'tests/components/overlay_interaction_ux_suite.js', 'Reference registry includes Overlay Interaction UX suite');
  context.assertIncludes(typingReadme, 'Overlay Interaction UX Contract', 'Typing README documents Overlay Interaction UX contract');

  return context.result({
    report: {
      schema: OVERLAY_INTERACTION_UX_REPORT_SCHEMA,
      fixture: OVERLAY_INTERACTION_UX_FIXTURE,
      targetCount: OVERLAY_INTERACTION_TARGETS.length,
      assertionCount: OVERLAY_INTERACTION_REQUIRED_ASSERTIONS.length
    }
  });
}

function printOverlayInteractionUxReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Overlay Interaction UX Suite erfolgreich.',
    failureTitle: 'XTend Overlay Interaction UX Suite fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runOverlayInteractionUxSuite();
  printOverlayInteractionUxReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printOverlayInteractionUxReport,
  runOverlayInteractionUxSuite
};

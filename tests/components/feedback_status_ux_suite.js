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
  FEEDBACK_STATUS_PROFILES,
  FEEDBACK_STATUS_REQUIRED_ASSERTIONS,
  FEEDBACK_STATUS_REQUIRED_COMMANDS,
  FEEDBACK_STATUS_REQUIRED_DOMAINS,
  FEEDBACK_STATUS_REQUIRED_EVENTS,
  FEEDBACK_STATUS_REQUIRED_SCHEDULES,
  FEEDBACK_STATUS_TARGETS,
  FEEDBACK_STATUS_UX_CONTRACT_DOC,
  FEEDBACK_STATUS_UX_FIXTURE,
  FEEDBACK_STATUS_UX_REPORT_SCHEMA,
  FEEDBACK_STATUS_UX_SCHEMA,
  FEEDBACK_STATUS_UX_WORKPACKAGE,
  KERNEL_BOUNDARY,
  createFeedbackStatusUxContract,
  validateFeedbackStatusUxContract
} = require('../../xtend-builder/typing/feedback-status-ux-contract');

const componentPaths = {
  'x-alert': {
    source: 'components/xalert.js',
    types: 'components/xalert.d.ts',
    docs: 'docs/components/xalert.md',
    event: 'alert-dismissed',
    stateKey: 'xalert-state-<id>',
    command: 'dismiss'
  },
  'x-toast': {
    source: 'components/xtoast.js',
    types: 'components/xtoast.d.ts',
    docs: 'docs/components/xtoast.md',
    event: 'toast-dismissed',
    stateKey: 'xtoast-state-<id>',
    command: 'dismiss'
  },
  'x-status': {
    source: 'components/xstatus.js',
    types: 'components/xstatus.d.ts',
    docs: 'docs/components/xstatus.md',
    event: 'status-changed',
    stateKey: 'xstatus-state-<id>',
    command: 'announce'
  },
  'x-progress': {
    source: 'components/xprogress.js',
    types: 'components/xprogress.d.ts',
    docs: 'docs/components/xprogress.md',
    event: 'progress-changed',
    stateKey: 'xprogress-value-<id>',
    command: 'setProgress'
  },
  'x-spinner': {
    source: 'components/xspinner.js',
    types: 'components/xspinner.d.ts',
    docs: 'docs/components/xspinner.md',
    event: 'spinner-started',
    stateKey: 'xspinner-paused-<id>',
    command: 'pause'
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
    Object.values(component.shell && component.shell.slots ? component.shell.slots : {}).forEach((slot) => {
      if (slot.template) context.assert(templates.has(slot.template), `${component.id}: slot template ${slot.template} resolves`);
      if (slot.component) context.assert(components.has(slot.component), `${component.id}: slot component ${slot.component} resolves`);
    });
  });

  (fixture.templates || []).forEach((template) => {
    (template.nodes || []).forEach((node) => {
      if (node.component) context.assert(components.has(node.component), `${template.id}: node component ${node.component} resolves`);
    });
  });
}

function runFeedbackStatusUxSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'feedback-status-ux',
    label: 'XTend Feedback and Status UX maturity'
  });
  const contract = createFeedbackStatusUxContract();
  const validation = validateFeedbackStatusUxContract(contract);
  const invalidValidation = validateFeedbackStatusUxContract({
    schema: FEEDBACK_STATUS_UX_SCHEMA,
    kernelBoundary: 'xtend-imports-in-rmt-kernel',
    targets: ['x-alert'],
    domains: [],
    requiredEvents: [],
    requiredCommands: [],
    requiredSchedules: [],
    liveRegion: { assertiveForError: false },
    statusSemantics: { noColorOnlyStatus: false },
    dismiss: { eventRequired: false },
    motion: { reducedMotionRequired: false, forcedColorsRequired: false },
    rmt: { shellFirst: false, noInlineRuntimeCode: false },
    fabric: { telemetryCorrelationRequired: false },
    tests: { assertions: [] }
  });
  const fixture = readJson(FEEDBACK_STATUS_UX_FIXTURE, rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const contractDoc = readText(FEEDBACK_STATUS_UX_CONTRACT_DOC, rootDir);
  const workpackage = readText('development/WP-E11-09-Feedback-und-Status-UX-Reife-umsetzen.md', rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const refs = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const typingReadme = readText('xtend-builder/typing/README.md', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.feedbackStatusUxMaturity;
  const components = indexById(fixture.components);
  const schedules = indexById(fixture.schedules);

  context.assert(contract.schema === FEEDBACK_STATUS_UX_SCHEMA, 'Feedback Status UX factory emits stable schema');
  context.assert(validation.schema === FEEDBACK_STATUS_UX_REPORT_SCHEMA, 'Feedback Status UX validator emits report schema');
  context.assert(validation.ok, 'Feedback Status UX validator accepts factory output');
  context.assert(!invalidValidation.ok, 'Feedback Status UX validator rejects invalid records');
  context.assert(contract.workpackage === FEEDBACK_STATUS_UX_WORKPACKAGE, 'Feedback Status UX contract is owned by WP-E11-09');
  context.assert(contract.kernelBoundary === KERNEL_BOUNDARY, 'Feedback Status UX contract preserves RMT kernel boundary');
  assertIncludesAll(context, contract.targets, FEEDBACK_STATUS_TARGETS, 'Feedback Status UX targets');
  assertIncludesAll(context, contract.domains, FEEDBACK_STATUS_REQUIRED_DOMAINS, 'Feedback Status UX domains');
  assertIncludesAll(context, contract.requiredEvents, FEEDBACK_STATUS_REQUIRED_EVENTS, 'Feedback Status UX events');
  assertIncludesAll(context, contract.requiredCommands, FEEDBACK_STATUS_REQUIRED_COMMANDS, 'Feedback Status UX commands');
  assertIncludesAll(context, contract.requiredSchedules, FEEDBACK_STATUS_REQUIRED_SCHEDULES, 'Feedback Status UX schedules');
  assertIncludesAll(context, contract.tests.assertions, FEEDBACK_STATUS_REQUIRED_ASSERTIONS, 'Feedback Status UX assertions');
  context.assert(contract.liveRegion.assertiveForError === true, 'Feedback Status UX contract requires assertive error live regions');
  context.assert(contract.dismiss.timeoutReasonRequired === true, 'Feedback Status UX contract requires timeout dismissal reasons');
  context.assert(contract.motion.reducedMotionRequired === true, 'Feedback Status UX contract requires reduced-motion safety');
  context.assert(contract.statusSemantics.noColorOnlyStatus === true, 'Feedback Status UX contract rejects color-only status');
  context.assert(contract.rmt.shellFirst === true, 'Feedback Status UX contract is RMT shell-first ready');
  context.assert(contract.fabric.telemetryCorrelationRequired === true, 'Feedback Status UX contract requires Fabric telemetry correlation');

  context.assert(fixture.manifest.metadata.contractVersion === FEEDBACK_STATUS_UX_SCHEMA, 'RMT fixture declares Feedback Status UX schema');
  context.assert(fixture.manifest.metadata.workpackage === FEEDBACK_STATUS_UX_WORKPACKAGE, 'RMT fixture declares WP-E11-09 owner');
  context.assert(fixture.manifest.metadata.kernelBoundary === KERNEL_BOUNDARY, 'RMT fixture preserves kernel boundary');
  FEEDBACK_STATUS_REQUIRED_SCHEDULES.forEach((schedule) => {
    context.assert(schedules.has(schedule), `RMT fixture declares ${schedule}`);
  });
  FEEDBACK_STATUS_TARGETS.forEach((tag) => {
    const matching = (fixture.components || []).find((component) => component.tag === tag);
    context.assert(Boolean(matching), `RMT fixture includes ${tag}`);
    if (matching) {
      context.assert(matching.adapter === 'xtend.component', `${tag}: uses xtend.component adapter`);
      context.assert(Boolean(matching.a11y), `${tag}: declares a11y record`);
      context.assert(Boolean(matching.fabric), `${tag}: declares Fabric record`);
    }
  });
  context.assert(components.get('feedback.alert').a11y.live === 'assertive', 'RMT fixture declares assertive alert announcement');
  context.assert(components.get('feedback.toast').events['toast-dismissed'].command === 'feedback.toast.dismiss', 'RMT fixture binds toast-dismissed command');
  context.assert(components.get('feedback.status').commands['update-status'].schedule === 'feedback.status.update', 'RMT fixture schedules status updates');
  context.assert(components.get('feedback.progress').commands['set-progress'].schedule === 'feedback.progress.update', 'RMT fixture schedules progress updates');
  context.assert(components.get('feedback.spinner').events.paused.command === 'feedback.spinner.pause', 'RMT fixture binds spinner pause event');
  assertFixtureReferencesResolve(context, fixture);

  FEEDBACK_STATUS_PROFILES.forEach((profile) => {
    const paths = componentPaths[profile.tag];
    const source = readText(paths.source, rootDir);
    const types = readText(paths.types, rootDir);
    const docs = readText(paths.docs, rootDir);

    context.assert(source.includes('xtendFeedbackStatusUxProfile'), `${profile.tag} exposes xtendFeedbackStatusUxProfile`);
    context.assert(source.includes(`componentRef: '${profile.tag}'`) || source.includes(`componentRef: "${profile.tag}"`), `${profile.tag} UX profile declares componentRef`);
    context.assert(source.includes('xtend.component.feedback-status-ux-profile.v1'), `${profile.tag} source declares Feedback Status UX profile schema`);
    context.assert(source.includes('xtend.rmt.component-contract.v1'), `${profile.tag} source exposes RMT metadata`);
    context.assert(source.includes(KERNEL_BOUNDARY), `${profile.tag} source preserves RMT kernel boundary`);
    context.assert(source.includes('@xtend-fabric'), `${profile.tag} source exposes Fabric API marker`);
    context.assert(source.includes('xtend.performance.component-profile.v1'), `${profile.tag} source exposes performance profile`);
    context.assert(source.includes('xtend.a11y.screenreader-signals.v1'), `${profile.tag} source exposes screenreader signals`);
    context.assert(source.includes('aria-live'), `${profile.tag} source declares live region behavior`);
    context.assert(source.includes('aria-atomic'), `${profile.tag} source declares atomic announcements`);
    context.assert(source.includes('prefers-reduced-motion'), `${profile.tag} source is reduced-motion safe`);
    context.assert(source.includes('forced-colors'), `${profile.tag} source is forced-colors safe`);
    context.assert(source.includes('part=') || source.includes('setAttribute("part"') || source.includes("setAttribute('part'"), `${profile.tag} source exposes CSS parts`);
    context.assert(source.includes(paths.event), `${profile.tag} source exposes ${paths.event}`);
    context.assert(source.includes(profile.schedule), `${profile.tag} source declares schedule ${profile.schedule}`);
    context.assert(source.includes(paths.stateKey.replace('<id>', '${this.id}')) || source.includes(paths.stateKey), `${profile.tag} source declares state key ${paths.stateKey}`);
    context.assert(source.includes(paths.command), `${profile.tag} source exposes command ${paths.command}`);
    context.assert(types.includes('XtendFeedbackStatusUxProfile'), `${profile.tag} public types import Feedback Status UX profile`);
    context.assert(types.includes('FeedbackStatusUxProfile'), `${profile.tag} public types export profile alias`);
    context.assert(docs.includes('xtend.component.feedback-status-ux-profile.v1'), `${profile.tag} docs describe Feedback Status UX profile`);
    context.assert(docs.includes(paths.stateKey), `${profile.tag} docs describe state key ${paths.stateKey}`);
  });

  context.assert((typeof packageManifest.exports['./builder/typing/feedback-status-ux-contract'] === 'string' ? packageManifest.exports['./builder/typing/feedback-status-ux-contract'] : packageManifest.exports['./builder/typing/feedback-status-ux-contract'] && packageManifest.exports['./builder/typing/feedback-status-ux-contract'].default) === './xtend-builder/typing/feedback-status-ux-contract.js', 'Package exports Feedback Status UX contract module');
  context.assert(packageManifest.scripts['test:feedback-status-ux'] === 'node scripts/run_xtend_tests.js feedback-status-ux', 'Package exposes Feedback Status UX test script');
  context.assert(metadata && metadata.schema === FEEDBACK_STATUS_UX_SCHEMA, 'Package metadata exposes Feedback Status UX schema');
  context.assert(metadata.reportSchema === FEEDBACK_STATUS_UX_REPORT_SCHEMA, 'Package metadata exposes Feedback Status UX report schema');
  context.assert(metadata.fixture === FEEDBACK_STATUS_UX_FIXTURE, 'Package metadata exposes Feedback Status UX fixture');
  context.assert(Array.isArray(metadata.targets) && metadata.targets.includes('x-spinner'), 'Package metadata includes x-spinner target');
  context.assert(Array.isArray(metadata.requiredAssertions) && metadata.requiredAssertions.includes('live-region-semantics'), 'Package metadata exposes live-region assertion');
  context.assert(metadata.profileGetter === 'xtendFeedbackStatusUxProfile', 'Package metadata exposes Feedback Status UX profile getter');
  context.assert(metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata preserves RMT kernel boundary');
  context.assertIncludes(scaffoldConfig, 'feedbackStatusUxMaturity', 'Scaffold config exposes Feedback Status UX section');
  context.assertIncludes(scaffoldConfig, FEEDBACK_STATUS_UX_SCHEMA, 'Scaffold config declares Feedback Status UX schema');
  context.assert(runner.hasSuite("feedback-status-ux"), 'Runner exposes Feedback Status UX suite');
  context.assertIncludes(contractDoc, FEEDBACK_STATUS_UX_SCHEMA, 'Contract document declares Feedback Status UX schema');
  context.assertIncludes(contractDoc, '`xtendFeedbackStatusUxProfile`', 'Contract document describes runtime profile');
  context.assertIncludes(workpackage, 'xtend.epic11.wp09.feedback-status-ux.v1', 'WP-E11-09 document declares schema');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-09 document is completed');
  context.assertIncludes(epic, '| `WP-E11-09` | P1 | completed |', 'Epic marks WP-E11-09 completed');
  context.assertIncludes(epic, '| `WP-E11-10` | P1 | completed |', 'Epic marks WP-E11-10 completed');
  context.assertIncludes(epic, '| `WP-E11-11` | P1 | completed |', 'Epic marks WP-E11-11 completed');
  context.assertIncludes(epic, '| `WP-E11-12` | P1 | completed |', 'Epic marks WP-E11-12 completed');
  context.assertIncludes(epic, '| `WP-E11-13` | P1 | completed |', 'Epic marks WP-E11-13 completed');
  context.assertIncludes(epic, '| `WP-E11-14` | P1 | completed |', 'Epic marks WP-E11-14 completed');
  context.assertIncludes(epic, '| `WP-E11-15` | P1 | completed |', 'Epic marks WP-E11-15 completed');
  context.assertIncludes(epic, '| `WP-E11-16` | P1 | completed |', 'Epic marks WP-E11-16 completed');
  context.assertIncludes(epic, '| `WP-E11-17` | P2 | completed |', 'Epic marks WP-E11-17 completed');
  context.assertIncludes(backlog, '| `WP-E11-09` | P1 | completed |', 'Backlog marks WP-E11-09 completed');
  context.assertIncludes(backlog, '| `WP-E11-10` | P1 | completed |', 'Backlog marks WP-E11-10 completed');
  context.assertIncludes(backlog, '| `WP-E11-11` | P1 | completed |', 'Backlog marks WP-E11-11 completed');
  context.assertIncludes(backlog, '| `WP-E11-12` | P1 | completed |', 'Backlog marks WP-E11-12 completed');
  context.assertIncludes(backlog, '| `WP-E11-13` | P1 | completed |', 'Backlog marks WP-E11-13 completed');
  context.assertIncludes(backlog, '| `WP-E11-14` | P1 | completed |', 'Backlog marks WP-E11-14 completed');
  context.assertIncludes(backlog, '| `WP-E11-15` | P1 | completed |', 'Backlog marks WP-E11-15 completed');
  context.assertIncludes(backlog, '| `WP-E11-16` | P1 | completed |', 'Backlog marks WP-E11-16 completed');
  context.assertIncludes(backlog, '| `WP-E11-17` | P2 | completed |', 'Backlog marks WP-E11-17 completed');
  context.assertIncludes(refs, FEEDBACK_STATUS_UX_FIXTURE, 'Reference registry includes Feedback Status UX fixture');
  context.assertIncludes(refs, 'tests/components/feedback_status_ux_suite.js', 'Reference registry includes Feedback Status UX suite');
  context.assertIncludes(typingReadme, 'Feedback Status UX Contract', 'Typing README documents Feedback Status UX contract');

  return context.result({
    report: {
      schema: FEEDBACK_STATUS_UX_REPORT_SCHEMA,
      fixture: FEEDBACK_STATUS_UX_FIXTURE,
      targetCount: FEEDBACK_STATUS_TARGETS.length,
      assertionCount: FEEDBACK_STATUS_REQUIRED_ASSERTIONS.length
    }
  });
}

function printFeedbackStatusUxReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Feedback Status UX Suite erfolgreich.',
    failureTitle: 'XTend Feedback Status UX Suite fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runFeedbackStatusUxSuite();
  printFeedbackStatusUxReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printFeedbackStatusUxReport,
  runFeedbackStatusUxSuite
};

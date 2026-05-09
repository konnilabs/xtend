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
  FORM_CONTROLS_UX_CONTRACT_DOC,
  FORM_CONTROLS_UX_FIXTURE,
  FORM_CONTROLS_UX_REPORT_SCHEMA,
  FORM_CONTROLS_UX_SCHEMA,
  FORM_CONTROLS_UX_WORKPACKAGE,
  FORM_CONTROL_PROFILES,
  FORM_CONTROL_REQUIRED_ASSERTIONS,
  FORM_CONTROL_REQUIRED_COMMANDS,
  FORM_CONTROL_REQUIRED_DOMAINS,
  FORM_CONTROL_REQUIRED_EVENTS,
  FORM_CONTROL_REQUIRED_SCHEDULES,
  FORM_CONTROL_TARGETS,
  KERNEL_BOUNDARY,
  createFormControlsUxContract,
  validateFormControlsUxContract
} = require('../../xtend-builder/typing/form-controls-ux-contract');

const componentPaths = {
  'x-input': {
    source: 'components/xinput.js',
    types: 'components/xinput.d.ts',
    docs: 'docs/components/xinput.md',
    event: 'input-changed',
    stateKey: 'xinput-value-<id>'
  },
  'x-select': {
    source: 'components/xselect.js',
    types: 'components/xselect.d.ts',
    docs: 'docs/components/xselect.md',
    event: 'select-changed',
    stateKey: 'xselect-value-<id>'
  },
  'x-checkbox': {
    source: 'components/xcheckbox.js',
    types: 'components/xcheckbox.d.ts',
    docs: 'docs/components/xcheckbox.md',
    event: 'checkbox-changed',
    stateKey: 'xcheckbox-checked-<id>'
  },
  'x-radio': {
    source: 'components/xradio.js',
    types: 'components/xradio.d.ts',
    docs: 'docs/components/xradio.md',
    event: 'radio-changed',
    stateKey: 'xradio-value-<name>'
  },
  'x-textarea': {
    source: 'components/xtextarea.js',
    types: 'components/xtextarea.d.ts',
    docs: 'docs/components/xtextarea.md',
    event: 'textarea-changed',
    stateKey: 'xtextarea-value-<id>'
  },
  'x-calendar': {
    source: 'components/xcalendar.js',
    types: 'components/xcalendar.d.ts',
    docs: 'docs/components/xcalendar.md',
    event: 'date-select',
    stateKey: 'xcalendar-state-<id>'
  },
  'x-form': {
    source: 'components/xform.js',
    types: 'components/xform.d.ts',
    docs: 'docs/components/xform.md',
    event: 'submit',
    stateKey: 'xform-data-<id>'
  },
  'x-writer': {
    source: 'components/xwriter.js',
    types: 'components/xwriter.d.ts',
    docs: 'docs/components/xwriter.md',
    event: 'writer:change',
    stateKey: 'xwriter-content'
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

function runFormControlsUxSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'form-controls-ux',
    label: 'XTend Form Controls UX maturity'
  });
  const contract = createFormControlsUxContract();
  const validation = validateFormControlsUxContract(contract);
  const invalidValidation = validateFormControlsUxContract({
    schema: FORM_CONTROLS_UX_SCHEMA,
    kernelBoundary: 'xtend-imports-in-rmt-kernel',
    targets: ['x-input'],
    domains: [],
    requiredEvents: [],
    requiredCommands: [],
    requiredSchedules: [],
    validation: { validityApiRequired: false },
    a11y: { accessibleNameRequired: false },
    rmt: { shellFirst: false, noInlineRuntimeCode: false },
    fabric: { telemetryCorrelationRequired: false },
    tests: { assertions: [] }
  });
  const fixture = readJson(FORM_CONTROLS_UX_FIXTURE, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const contractDoc = readText(FORM_CONTROLS_UX_CONTRACT_DOC, rootDir);
  const workpackage = readText('development/WP-E11-08-Form-Controls-UX-Reife-umsetzen.md', rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const refs = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const typingReadme = readText('xtend-builder/typing/README.md', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.formControlsUxMaturity;
  const components = indexById(fixture.components);
  const schedules = indexById(fixture.schedules);

  context.assert(contract.schema === FORM_CONTROLS_UX_SCHEMA, 'Form Controls UX factory emits stable schema');
  context.assert(validation.schema === FORM_CONTROLS_UX_REPORT_SCHEMA, 'Form Controls UX validator emits report schema');
  context.assert(validation.ok, 'Form Controls UX validator accepts factory output');
  context.assert(!invalidValidation.ok, 'Form Controls UX validator rejects invalid records');
  context.assert(contract.workpackage === FORM_CONTROLS_UX_WORKPACKAGE, 'Form Controls UX contract is owned by WP-E11-08');
  context.assert(contract.kernelBoundary === KERNEL_BOUNDARY, 'Form Controls UX contract preserves RMT kernel boundary');
  assertIncludesAll(context, contract.targets, FORM_CONTROL_TARGETS, 'Form Controls UX targets');
  assertIncludesAll(context, contract.domains, FORM_CONTROL_REQUIRED_DOMAINS, 'Form Controls UX domains');
  assertIncludesAll(context, contract.requiredEvents, FORM_CONTROL_REQUIRED_EVENTS, 'Form Controls UX events');
  assertIncludesAll(context, contract.requiredCommands, FORM_CONTROL_REQUIRED_COMMANDS, 'Form Controls UX commands');
  assertIncludesAll(context, contract.requiredSchedules, FORM_CONTROL_REQUIRED_SCHEDULES, 'Form Controls UX schedules');
  assertIncludesAll(context, contract.tests.assertions, FORM_CONTROL_REQUIRED_ASSERTIONS, 'Form Controls UX assertions');
  context.assert(contract.validation.errorRegion === 'role=alert aria-live=assertive', 'Form Controls UX contract requires assertive error regions');
  context.assert(contract.rmt.shellFirst === true, 'Form Controls UX contract is RMT shell-first ready');
  context.assert(contract.fabric.telemetryCorrelationRequired === true, 'Form Controls UX contract requires Fabric telemetry correlation');

  context.assert(fixture.manifest.metadata.contractVersion === FORM_CONTROLS_UX_SCHEMA, 'RMT fixture declares Form Controls UX schema');
  context.assert(fixture.manifest.metadata.workpackage === FORM_CONTROLS_UX_WORKPACKAGE, 'RMT fixture declares WP-E11-08 owner');
  context.assert(fixture.manifest.metadata.kernelBoundary === KERNEL_BOUNDARY, 'RMT fixture preserves kernel boundary');
  FORM_CONTROL_REQUIRED_SCHEDULES.forEach((schedule) => {
    context.assert(schedules.has(schedule), `RMT fixture declares ${schedule}`);
  });
  FORM_CONTROL_TARGETS.forEach((tag) => {
    const matching = (fixture.components || []).find((component) => component.tag === tag);
    context.assert(Boolean(matching), `RMT fixture includes ${tag}`);
    if (matching) {
      context.assert(matching.adapter === 'xtend.component', `${tag}: uses xtend.component adapter`);
      context.assert(Boolean(matching.shell), `${tag}: declares shell record`);
      context.assert(Boolean(matching.style), `${tag}: declares style record`);
      context.assert(Boolean(matching.a11y), `${tag}: declares a11y record`);
      context.assert(Boolean(matching.validation), `${tag}: declares validation record`);
      context.assert(Boolean(matching.fabric), `${tag}: declares Fabric record`);
    }
  });
  context.assert(components.get('account.form').validation.controls.includes('account.writer'), 'RMT fixture aggregates x-writer through x-form validation model');
  context.assert(components.get('account.email').events['input-changed'].command === 'account.email.set-value', 'RMT fixture binds x-input event to command');
  context.assert(components.get('account.form.error').a11y.role === 'alert', 'RMT fixture provides form error announcement surface');
  assertFixtureReferencesResolve(context, fixture);

  FORM_CONTROL_PROFILES.forEach((profile) => {
    const paths = componentPaths[profile.tag];
    const source = readText(paths.source, rootDir);
    const types = readText(paths.types, rootDir);
    const docs = readText(paths.docs, rootDir);

    context.assert(source.includes('xtendFormControlUxProfile'), `${profile.tag} exposes xtendFormControlUxProfile`);
    context.assert(source.includes(`componentRef: '${profile.tag}'`) || source.includes(`componentRef: "${profile.tag}"`), `${profile.tag} UX profile declares componentRef`);
    context.assert(source.includes('xtend.component.form-control-ux-profile.v1'), `${profile.tag} source declares Form Control UX profile schema`);
    context.assert(source.includes('xtend.rmt.component-contract.v1'), `${profile.tag} source exposes RMT metadata`);
    context.assert(source.includes(KERNEL_BOUNDARY), `${profile.tag} source preserves RMT kernel boundary`);
    context.assert(source.includes('@xtend-fabric'), `${profile.tag} source exposes Fabric API marker`);
    context.assert(source.includes('xtend.performance.component-profile.v1'), `${profile.tag} source exposes performance profile`);
    context.assert(source.includes(paths.event), `${profile.tag} source exposes ${paths.event}`);
    context.assert(source.includes(profile.schedule), `${profile.tag} source declares schedule ${profile.schedule}`);
    context.assert(types.includes('XtendFormControlUxProfile'), `${profile.tag} public types import Form Control UX profile`);
    context.assert(types.includes('FormControlUxProfile'), `${profile.tag} public types export profile alias`);
    context.assert(docs.includes('xtend.component.form-control-ux-profile.v1'), `${profile.tag} docs describe Form Control UX profile`);
    context.assert(docs.includes(paths.stateKey), `${profile.tag} docs describe state key ${paths.stateKey}`);
  });

  const formSource = readText('components/xform.js', rootDir);
  context.assert(formSource.includes('x-writer'), 'x-form discovers x-writer as rich text control');
  context.assert(formSource.includes('date-select'), 'x-form listens to date-select events');
  context.assert(formSource.includes('writer:change'), 'x-form listens to writer:change events');
  context.assert(formSource.includes('validate()'), 'x-form exposes validate command');
  context.assert(formSource.includes('submit()'), 'x-form exposes submit command');

  context.assert(packageManifest.exports['./builder/typing/form-controls-ux-contract'] === './xtend-builder/typing/form-controls-ux-contract.js', 'Package exports Form Controls UX contract module');
  context.assert(packageManifest.scripts['test:form-controls-ux'] === 'node scripts/run_xtend_tests.js form-controls-ux', 'Package exposes Form Controls UX test script');
  context.assert(metadata && metadata.schema === FORM_CONTROLS_UX_SCHEMA, 'Package metadata exposes Form Controls UX schema');
  context.assert(metadata.fixture === FORM_CONTROLS_UX_FIXTURE, 'Package metadata exposes Form Controls UX fixture');
  context.assert(Array.isArray(metadata.targets) && metadata.targets.includes('x-writer'), 'Package metadata includes x-writer target');
  context.assert(metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata preserves RMT kernel boundary');
  context.assertIncludes(scaffoldConfig, 'formControlsUxMaturity', 'Scaffold config exposes Form Controls UX section');
  context.assertIncludes(scaffoldConfig, FORM_CONTROLS_UX_SCHEMA, 'Scaffold config declares Form Controls UX schema');
  context.assertIncludes(runner, "id: 'form-controls-ux'", 'Runner exposes Form Controls UX suite');
  context.assertIncludes(contractDoc, FORM_CONTROLS_UX_SCHEMA, 'Contract document declares Form Controls UX schema');
  context.assertIncludes(contractDoc, '`xtendFormControlUxProfile`', 'Contract document describes runtime profile');
  context.assertIncludes(workpackage, 'xtend.epic11.wp08.form-controls-ux.v1', 'WP-E11-08 document declares schema');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-08 document is completed');
  context.assertIncludes(epic, '| `WP-E11-08` | P1 | completed |', 'Epic marks WP-E11-08 completed');
  context.assertIncludes(epic, '| `WP-E11-09` | P1 | completed |', 'Epic marks WP-E11-09 completed');
  context.assertIncludes(epic, '| `WP-E11-10` | P1 | completed |', 'Epic marks WP-E11-10 completed');
  context.assertIncludes(epic, '| `WP-E11-11` | P1 | completed |', 'Epic marks WP-E11-11 completed');
  context.assertIncludes(epic, '| `WP-E11-12` | P1 | completed |', 'Epic marks WP-E11-12 completed');
  context.assertIncludes(epic, '| `WP-E11-13` | P1 | completed |', 'Epic marks WP-E11-13 completed');
  context.assertIncludes(epic, '| `WP-E11-14` | P1 | completed |', 'Epic marks WP-E11-14 completed');
  context.assertIncludes(epic, '| `WP-E11-15` | P1 | completed |', 'Epic marks WP-E11-15 completed');
  context.assertIncludes(epic, '| `WP-E11-16` | P1 | completed |', 'Epic marks WP-E11-16 completed');
  context.assertIncludes(epic, '| `WP-E11-17` | P2 | completed |', 'Epic marks WP-E11-17 completed');
  context.assertIncludes(backlog, '| `WP-E11-08` | P1 | completed |', 'Backlog marks WP-E11-08 completed');
  context.assertIncludes(backlog, '| `WP-E11-09` | P1 | completed |', 'Backlog marks WP-E11-09 completed');
  context.assertIncludes(backlog, '| `WP-E11-10` | P1 | completed |', 'Backlog marks WP-E11-10 completed');
  context.assertIncludes(backlog, '| `WP-E11-11` | P1 | completed |', 'Backlog marks WP-E11-11 completed');
  context.assertIncludes(backlog, '| `WP-E11-12` | P1 | completed |', 'Backlog marks WP-E11-12 completed');
  context.assertIncludes(backlog, '| `WP-E11-13` | P1 | completed |', 'Backlog marks WP-E11-13 completed');
  context.assertIncludes(backlog, '| `WP-E11-14` | P1 | completed |', 'Backlog marks WP-E11-14 completed');
  context.assertIncludes(backlog, '| `WP-E11-15` | P1 | completed |', 'Backlog marks WP-E11-15 completed');
  context.assertIncludes(backlog, '| `WP-E11-16` | P1 | completed |', 'Backlog marks WP-E11-16 completed');
  context.assertIncludes(backlog, '| `WP-E11-17` | P2 | completed |', 'Backlog marks WP-E11-17 completed');
  context.assertIncludes(refs, FORM_CONTROLS_UX_FIXTURE, 'Reference registry includes Form Controls UX fixture');
  context.assertIncludes(refs, 'tests/components/form_controls_ux_suite.js', 'Reference registry includes Form Controls UX suite');
  context.assertIncludes(typingReadme, 'Form Controls UX Contract', 'Typing README documents Form Controls UX contract');

  return context.result({
    report: {
      schema: FORM_CONTROLS_UX_REPORT_SCHEMA,
      fixture: FORM_CONTROLS_UX_FIXTURE,
      targetCount: FORM_CONTROL_TARGETS.length,
      assertionCount: FORM_CONTROL_REQUIRED_ASSERTIONS.length
    }
  });
}

function printFormControlsUxReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Form Controls UX Suite erfolgreich.',
    failureTitle: 'XTend Form Controls UX Suite fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runFormControlsUxSuite();
  printFormControlsUxReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printFormControlsUxReport,
  runFormControlsUxSuite
};

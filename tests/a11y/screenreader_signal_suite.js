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
  syntaxCheckFile
} = require('../utils/process');
const {
  CONTRACTS,
  SCREENREADER_SIGNALS_SCHEMA,
  SCREENREADER_SIGNAL_RECORD_SCHEMA,
  createScreenreaderSignalContract,
  validateScreenreaderSignalContract
} = require('../../a11y/screenreader-signals');
const {
  A11Y_SCREENREADER_SIGNALS_SCHEMA,
  createComponentA11yProfile
} = require('../../xtend-builder/a11y/component-a11y-profile');
const {
  createComponentFiles
} = require('../../xtend-builder/generators/component-files');

const COMPONENT_SIGNAL_CONTRACTS = [
  {
    tag: 'x-alert',
    path: 'components/xalert.js',
    signals: ['status-announcement', 'dismissal-announcement'],
    regions: ['aria-live', "role = isAssertive ? 'alert' : 'status'", "container.setAttribute('role', role)"]
  },
  {
    tag: 'x-toast',
    path: 'components/xtoast.js',
    signals: ['status-announcement', 'dismissal-announcement'],
    regions: ["role = type === 'error' ? 'alert' : 'status'", 'aria-live']
  },
  {
    tag: 'x-modal',
    path: 'components/xmodal.js',
    signals: ['dialog-context', 'focus-return'],
    regions: ['role="dialog"', 'aria-modal="true"', "modal.setAttribute('aria-labelledby', 'xmodal-title')"]
  },
  {
    tag: 'x-dialog',
    path: 'components/xdialog.js',
    signals: ['dialog-context', 'focus-return'],
    regions: ['role="dialog"', 'aria-modal="true"', "dialog.setAttribute('aria-labelledby', 'xdialog-title')"]
  },
  {
    tag: 'x-form',
    path: 'components/xform.js',
    signals: ['validation-error-summary', 'submit-status'],
    regions: ['role="status"', 'role="alert"', 'aria-live="assertive"']
  },
  {
    tag: 'x-input',
    path: 'components/xinput.js',
    signals: ['validation-error-summary'],
    regions: ['role="alert"', 'aria-live="assertive"', 'aria-atomic="true"']
  }
];

function assertContractValidation(context, contract, label) {
  const validation = validateScreenreaderSignalContract(contract);
  context.assert(validation.ok === true, `${label} validates as screenreader signal contract`);
  context.assert(Array.isArray(validation.errors) && validation.errors.length === 0, `${label} has no validation errors`);
}

function runScreenreaderSignalSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'screenreader-signals',
    label: 'Screenreader signal contract gates'
  });

  const moduleSource = readText('a11y/screenreader-signals.js', rootDir);
  const syntax = syntaxCheckFile('a11y/screenreader-signals.js', { rootDir });
  context.assert(syntax.ok, 'Screenreader signal module passes syntax check');
  context.assert(moduleSource.includes('xtend.a11y.screenreader-signals.v1'), 'Screenreader signal module declares stable contract');
  context.assert(moduleSource.includes('a11y.user-blocking.announce'), 'Screenreader signal module maps announcements to RMT A11y schedule');
  context.assert(CONTRACTS.screenreaderSignals === 'xtend.a11y.screenreader-signals.v1', 'Screenreader signal module exports contract map');
  context.assert(SCREENREADER_SIGNALS_SCHEMA === 'xtend.a11y.screenreader-signals.v1', 'Screenreader signal module exports schema constant');
  context.assert(SCREENREADER_SIGNAL_RECORD_SCHEMA === 'xtend.a11y.screenreader-signal.v1', 'Screenreader signal module exports signal record schema');

  const feedbackContract = createScreenreaderSignalContract({
    componentRef: 'x-alert',
    profile: {
      primaryProfile: 'feedback',
      screenreader: {
        liveRegion: 'polite',
        signals: ['status-announcement', 'dismissal-announcement']
      }
    }
  });
  assertContractValidation(context, feedbackContract, 'Feedback contract');
  context.assert(feedbackContract.statusRegions.length === 2, 'Feedback contract derives two status regions');
  context.assert(feedbackContract.errorRegions.length === 0, 'Feedback contract keeps error regions optional for generic feedback');
  context.assert(feedbackContract.fabric.lane === 'a11y', 'Feedback contract maps to Fabric A11y lane');
  context.assert(feedbackContract.fabric.scheduleRef === 'a11y.user-blocking.announce', 'Feedback contract maps to user-blocking A11y schedule');

  const formContract = createScreenreaderSignalContract({
    componentRef: 'x-form',
    profile: {
      primaryProfile: 'form',
      screenreader: {
        liveRegion: 'polite',
        signals: ['validation-error-summary', 'submit-status']
      }
    }
  });
  assertContractValidation(context, formContract, 'Form contract');
  context.assert(formContract.errorRegions.length === 1, 'Form contract derives validation error region');
  context.assert(formContract.statusRegions.length === 1, 'Form contract derives submit status region');
  context.assert(formContract.signals.some((signal) => signal.liveRegion === 'assertive'), 'Form contract escalates validation errors assertively');

  const overlayContract = createScreenreaderSignalContract({
    componentRef: 'x-modal',
    profile: {
      primaryProfile: 'overlay',
      screenreader: {
        liveRegion: 'none',
        signals: ['dialog-context', 'focus-return']
      }
    }
  });
  assertContractValidation(context, overlayContract, 'Overlay contract');
  context.assert(overlayContract.statusRegions.length === 0, 'Overlay contract does not invent live status regions');
  context.assert(overlayContract.signals.every((signal) => signal.liveRegion === 'none'), 'Overlay contract uses focus and semantic context signals');

  const brokenValidation = validateScreenreaderSignalContract({
    schema: SCREENREADER_SIGNALS_SCHEMA,
    componentRef: 'x-broken',
    signals: [
      {
        schema: SCREENREADER_SIGNAL_RECORD_SCHEMA,
        signal: 'status-announcement',
        region: 'status',
        liveRegion: 'loud',
        required: true
      }
    ],
    statusRegions: [],
    errorRegions: [],
    fabric: { lane: 'visible', fiberKind: 'component.render' }
  });
  context.assert(brokenValidation.ok === false, 'Screenreader validator rejects invalid live-region and lane mapping');

  COMPONENT_SIGNAL_CONTRACTS.forEach((target) => {
    const source = readText(target.path, rootDir);
    context.assert(source.includes('xtendScreenreaderSignals'), `${target.tag} declares static screenreader signal metadata`);
    context.assert(source.includes(SCREENREADER_SIGNALS_SCHEMA), `${target.tag} declares screenreader signal schema`);
    context.assert(source.includes('a11y.user-blocking.announce'), `${target.tag} declares A11y announcement schedule`);
    target.signals.forEach((signal) => {
      context.assert(source.includes(signal), `${target.tag} declares ${signal}`);
    });
    target.regions.forEach((region) => {
      context.assert(source.includes(region), `${target.tag} declares ${region}`);
    });
  });

  const a11yProfile = createComponentA11yProfile({
    tag: 'x-generated-form',
    name: 'generated-form',
    className: 'XGeneratedForm',
    profiles: ['form']
  });
  context.assert(A11Y_SCREENREADER_SIGNALS_SCHEMA === SCREENREADER_SIGNALS_SCHEMA, 'Scaffold A11y profile exports Screenreader signal schema');
  context.assert(a11yProfile.screenreader.contract === SCREENREADER_SIGNALS_SCHEMA, 'Scaffold A11y profile includes screenreader signal contract');
  context.assert(a11yProfile.screenreader.signalContract.errorRegions.length === 1, 'Scaffold form profile creates error region');
  context.assert(a11yProfile.testRefs.includes('screenreader-signals'), 'Scaffold A11y profile includes Screenreader signal gate');
  context.assert(a11yProfile.scaffold.requiredGates.includes('screenreader-signals'), 'Scaffold A11y profile requires Screenreader signal gate');

  const generatedFiles = createComponentFiles({
    tag: 'x-generated-form',
    profile: 'form',
    feature: 'events'
  });
  const sourceFile = generatedFiles.files.find((file) => file.id === 'component');
  const fixtureFile = generatedFiles.files.find((file) => file.id === 'fixtures');
  const manifestFile = generatedFiles.files.find((file) => file.id === 'manifest');
  const docsFile = generatedFiles.files.find((file) => file.id === 'docs');
  const typesFile = generatedFiles.files.find((file) => file.id === 'types');
  const manifestPlan = JSON.parse(manifestFile.content);
  context.assert(sourceFile.content.includes(SCREENREADER_SIGNALS_SCHEMA), 'Generated source embeds screenreader signal contract');
  context.assert(fixtureFile.content.includes('screenreaderSignals:'), 'Generated fixture reports screenreader signal result');
  context.assert(docsFile.content.includes('Screenreader-Signale'), 'Generated docs include Screenreader signal section');
  context.assert(typesFile.content.includes('ScreenreaderSignalContract'), 'Generated types include Screenreader signal contract type');
  context.assert(manifestPlan.screenreaderSignals.schema === SCREENREADER_SIGNALS_SCHEMA, 'Generated manifest plan exposes screenreaderSignals contract');

  const packageJson = readJson('package.json', rootDir);
  context.assert(packageJson.exports['./a11y/screenreader-signals'] === './a11y/screenreader-signals.js', 'Package exports Screenreader signal contract module');
  context.assert(packageJson.scripts['test:screenreader-signals'] === 'node scripts/run_xtend_tests.js screenreader-signals', 'Package exposes Screenreader signal suite script');
  context.assert(packageJson.xtend.screenreaderSignals.localGate === 'node scripts/run_xtend_tests.js screenreader-signals --json', 'Package metadata exposes Screenreader signal gate');

  return context.result({
    components: COMPONENT_SIGNAL_CONTRACTS.map((target) => target.tag),
    contract: SCREENREADER_SIGNALS_SCHEMA
  });
}

function printScreenreaderSignalReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Screenreader-Signal Gates erfolgreich.',
    failureTitle: 'XTend Screenreader-Signal Gates fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runScreenreaderSignalSuite();
  printScreenreaderSignalReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printScreenreaderSignalReport,
  runScreenreaderSignalSuite
};

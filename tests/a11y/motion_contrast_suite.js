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
  MOTION_CONTRAST_POLICY_SCHEMA,
  MOTION_POLICY_SCHEMA,
  CONTRAST_POLICY_SCHEMA,
  MOTION_CONTRAST_TEST_SCHEMA,
  MOTION_MEDIA_QUERY,
  CONTRAST_MEDIA_QUERY,
  createMotionContrastPolicy,
  validateMotionContrastPolicy
} = require('../../a11y/motion-contrast-policy');
const {
  A11Y_MOTION_CONTRAST_POLICY_SCHEMA,
  createComponentA11yProfile
} = require('../../xtend-builder/a11y/component-a11y-profile');
const {
  createComponentFiles
} = require('../../xtend-builder/generators/component-files');

const COMPONENT_POLICY_CONTRACTS = [
  {
    tag: 'x-alert',
    path: 'components/xalert.js',
    policy: 'announcement-without-motion-dependency',
    css: ['prefers-reduced-motion', 'forced-colors', 'forced-color-adjust', 'CanvasText', 'Highlight']
  },
  {
    tag: 'x-toast',
    path: 'components/xtoast.js',
    policy: 'announcement-without-motion-dependency',
    css: ['prefers-reduced-motion', 'forced-colors', 'forced-color-adjust', 'CanvasText', 'Highlight']
  },
  {
    tag: 'x-modal',
    path: 'components/xmodal.js',
    policy: 'instant-open-close-allowed',
    css: ['prefers-reduced-motion', 'forced-colors', 'forced-color-adjust', 'CanvasText', 'Highlight']
  },
  {
    tag: 'x-dialog',
    path: 'components/xdialog.js',
    policy: 'instant-open-close-allowed',
    css: ['prefers-reduced-motion', 'forced-colors', 'forced-color-adjust', 'CanvasText', 'Highlight']
  },
  {
    tag: 'x-button',
    path: 'components/xbutton.js',
    policy: 'no-essential-motion',
    css: ['prefers-reduced-motion', 'forced-colors', 'forced-color-adjust', 'ButtonText', 'Highlight']
  },
  {
    tag: 'x-spinner',
    path: 'components/xspinner.js',
    policy: 'controls-stay-readable-without-motion',
    css: ['prefers-reduced-motion', 'forced-colors', 'forced-color-adjust', 'CanvasText', 'Highlight']
  },
  {
    tag: 'x-input',
    path: 'components/xinput.js',
    policy: 'validation-without-motion-only-feedback',
    css: ['prefers-reduced-motion', 'forced-colors', 'forced-color-adjust', 'FieldText', 'MarkText']
  },
  {
    tag: 'x-form',
    path: 'components/xform.js',
    policy: 'validation-without-motion-only-feedback',
    css: ['prefers-reduced-motion', 'forced-colors', 'forced-color-adjust', 'CanvasText']
  },
  {
    tag: 'x-theme',
    path: 'components/xtheme.js',
    policy: 'theme-provider-preference-boundary',
    css: ['prefers-reduced-motion', 'forced-colors', 'forced-color-adjust', 'CanvasText', 'Highlight']
  }
];

function assertPolicyValidation(context, policy, label) {
  const validation = validateMotionContrastPolicy(policy);
  context.assert(validation.ok === true, `${label} validates as motion/contrast policy`);
  context.assert(Array.isArray(validation.errors) && validation.errors.length === 0, `${label} has no validation errors`);
}

function runMotionContrastSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'motion-contrast',
    label: 'Reduced Motion and High Contrast gates'
  });

  const moduleSource = readText('a11y/motion-contrast-policy.js', rootDir);
  const syntax = syntaxCheckFile('a11y/motion-contrast-policy.js', { rootDir });
  context.assert(syntax.ok, 'Motion/Contrast policy module passes syntax check');
  context.assert(moduleSource.includes(MOTION_CONTRAST_POLICY_SCHEMA), 'Motion/Contrast module declares stable policy schema');
  context.assert(moduleSource.includes(MOTION_MEDIA_QUERY), 'Motion/Contrast module declares reduced motion media query');
  context.assert(moduleSource.includes(CONTRAST_MEDIA_QUERY), 'Motion/Contrast module declares forced-colors media query');
  context.assert(CONTRACTS.motionContrast === MOTION_CONTRAST_POLICY_SCHEMA, 'Motion/Contrast module exports contract map');
  context.assert(MOTION_POLICY_SCHEMA === 'xtend.a11y.motion-policy.v1', 'Motion/Contrast module exports motion schema');
  context.assert(CONTRAST_POLICY_SCHEMA === 'xtend.a11y.contrast-policy.v1', 'Motion/Contrast module exports contrast schema');
  context.assert(MOTION_CONTRAST_TEST_SCHEMA === 'xtend.a11y.motion-contrast-test.v1', 'Motion/Contrast module exports test schema');

  const overlayPolicy = createMotionContrastPolicy({
    componentRef: 'x-modal',
    primaryProfile: 'overlay'
  });
  assertPolicyValidation(context, overlayPolicy, 'Overlay policy');
  context.assert(overlayPolicy.motion.animationPolicy === 'instant-open-close-allowed', 'Overlay policy derives instant open/close motion policy');
  context.assert(overlayPolicy.contrast.contrastPolicy === 'dialog-boundary-and-focus', 'Overlay policy derives dialog contrast policy');
  context.assert(overlayPolicy.fabric.lane === 'a11y', 'Overlay policy maps to Fabric A11y lane');
  context.assert(overlayPolicy.fabric.fiberKind === 'a11y.preference', 'Overlay policy maps to A11y preference fiber');

  const formPolicy = createMotionContrastPolicy({
    componentRef: 'x-form',
    primaryProfile: 'form'
  });
  assertPolicyValidation(context, formPolicy, 'Form policy');
  context.assert(formPolicy.motion.noMotionOnlyState === true, 'Form policy forbids motion-only validation state');
  context.assert(formPolicy.contrast.nonColorStatus === 'required', 'Form policy requires non-color status');
  context.assert(formPolicy.requiredCss.includes('@media (forced-colors: active)'), 'Form policy requires forced-colors CSS');

  const brokenValidation = validateMotionContrastPolicy({
    schema: MOTION_CONTRAST_POLICY_SCHEMA,
    componentRef: 'x-broken',
    motion: {
      schema: MOTION_POLICY_SCHEMA,
      mediaQuery: '(prefers-reduced-motion: no-preference)',
      noMotionOnlyState: false
    },
    contrast: {
      schema: CONTRAST_POLICY_SCHEMA,
      mediaQuery: '(prefers-contrast: more)',
      focusVisible: 'optional',
      nonColorStatus: 'optional'
    },
    fabric: {
      lane: 'visible',
      fiberKind: 'component.render'
    }
  });
  context.assert(brokenValidation.ok === false, 'Motion/Contrast validator rejects invalid media and Fabric mapping');

  COMPONENT_POLICY_CONTRACTS.forEach((target) => {
    const source = readText(target.path, rootDir);
    context.assert(source.includes('xtendMotionContrastPolicy'), `${target.tag} declares static motion/contrast metadata`);
    context.assert(source.includes(MOTION_CONTRAST_POLICY_SCHEMA), `${target.tag} declares motion/contrast policy schema`);
    context.assert(source.includes(MOTION_POLICY_SCHEMA), `${target.tag} declares motion policy schema`);
    context.assert(source.includes(CONTRAST_POLICY_SCHEMA), `${target.tag} declares contrast policy schema`);
    context.assert(source.includes(target.policy), `${target.tag} declares ${target.policy}`);
    context.assert(source.includes('a11y.user-blocking.preference'), `${target.tag} declares A11y preference schedule`);
    target.css.forEach((pattern) => {
      context.assert(source.includes(pattern), `${target.tag} includes ${pattern}`);
    });
  });

  const a11yProfile = createComponentA11yProfile({
    tag: 'x-generated-overlay',
    name: 'generated-overlay',
    className: 'XGeneratedOverlay',
    profiles: ['overlay']
  });
  context.assert(A11Y_MOTION_CONTRAST_POLICY_SCHEMA === MOTION_CONTRAST_POLICY_SCHEMA, 'Scaffold A11y profile exports Motion/Contrast policy schema');
  context.assert(a11yProfile.motionContrast.contract === MOTION_CONTRAST_POLICY_SCHEMA, 'Scaffold A11y profile includes Motion/Contrast contract');
  context.assert(a11yProfile.motionContrast.policy.contrast.mediaQuery === CONTRAST_MEDIA_QUERY, 'Scaffold A11y profile includes forced-colors policy');
  context.assert(a11yProfile.testRefs.includes('motion-contrast'), 'Scaffold A11y profile includes Motion/Contrast gate');
  context.assert(a11yProfile.scaffold.requiredGates.includes('motion-contrast'), 'Scaffold A11y profile requires Motion/Contrast gate');

  const generatedFiles = createComponentFiles({
    tag: 'x-generated-overlay',
    profile: 'overlay',
    feature: 'events'
  });
  const sourceFile = generatedFiles.files.find((file) => file.id === 'component');
  const fixtureFile = generatedFiles.files.find((file) => file.id === 'fixtures');
  const manifestFile = generatedFiles.files.find((file) => file.id === 'manifest');
  const docsFile = generatedFiles.files.find((file) => file.id === 'docs');
  const typesFile = generatedFiles.files.find((file) => file.id === 'types');
  const manifestPlan = JSON.parse(manifestFile.content);
  context.assert(sourceFile.content.includes(MOTION_CONTRAST_POLICY_SCHEMA), 'Generated source embeds Motion/Contrast policy contract');
  context.assert(sourceFile.content.includes('prefers-reduced-motion'), 'Generated source includes reduced-motion CSS');
  context.assert(sourceFile.content.includes('forced-colors'), 'Generated source includes forced-colors CSS');
  context.assert(fixtureFile.content.includes('motionContrastPolicy:'), 'Generated fixture reports Motion/Contrast result');
  context.assert(docsFile.content.includes('Motion-und-Contrast-Policy'), 'Generated docs include Motion/Contrast section');
  context.assert(docsFile.content.includes('node scripts/run_xtend_tests.js motion-contrast'), 'Generated docs include Motion/Contrast gate');
  context.assert(typesFile.content.includes('MotionContrastPolicy'), 'Generated types include Motion/Contrast policy type');
  context.assert(manifestPlan.motionContrastPolicy.schema === MOTION_CONTRAST_POLICY_SCHEMA, 'Generated manifest plan exposes motionContrastPolicy contract');

  const packageJson = readJson('package.json', rootDir);
  const motionContrastExport = packageJson.exports['./a11y/motion-contrast-policy'];
  context.assert((typeof motionContrastExport === 'string' ? motionContrastExport : motionContrastExport.default) === './a11y/motion-contrast-policy.js', 'Package exports Motion/Contrast policy module');
  context.assert(packageJson.scripts['test:motion-contrast'] === 'node scripts/run_xtend_tests.js motion-contrast', 'Package exposes Motion/Contrast suite script');
  context.assert(packageJson.xtend.motionContrastPolicy.localGate === 'node scripts/run_xtend_tests.js motion-contrast --json', 'Package metadata exposes Motion/Contrast local gate');

  return context.result({
    components: COMPONENT_POLICY_CONTRACTS.map((target) => target.tag),
    contract: MOTION_CONTRAST_POLICY_SCHEMA
  });
}

function printMotionContrastReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Motion-/Contrast-Gates erfolgreich.',
    failureTitle: 'XTend Motion-/Contrast-Gates fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runMotionContrastSuite();
  printMotionContrastReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printMotionContrastReport,
  runMotionContrastSuite
};

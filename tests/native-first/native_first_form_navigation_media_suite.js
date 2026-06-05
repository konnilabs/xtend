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

const SUITE_ID = 'native-first-form-navigation-media';
const SUITE_LABEL = 'Native-First Form Navigation Media Hardening';
const CONTRACT_SCHEMA = 'xtend.native-first.form-navigation-media-hardening.v1';
const MATRIX_SCHEMA = 'xtend.native-first.form-navigation-media-hardening-matrix.v1';
const REPORT_SCHEMA = 'xtend.native-first.form-navigation-media-hardening-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js native-first-form-navigation-media --json';
const PACKAGE_SCRIPT = 'npm run test:native-first-form-navigation-media';

const FORM_COMPONENTS = Object.freeze([
  'x-input',
  'x-select',
  'x-checkbox',
  'x-radio',
  'x-textarea',
  'x-calendar',
  'x-form',
  'x-writer'
]);

const NAV_COMPONENTS = Object.freeze([
  'x-router',
  'x-link',
  'x-tabs',
  'x-menu'
]);

const LIST_MEDIA_COMPONENTS = Object.freeze([
  'x-section',
  'x-cards',
  'x-masonry',
  'x-summary',
  'x-player',
  'x-lightbox'
]);

const REQUIRED_COMPONENTS = Object.freeze([
  ...FORM_COMPONENTS,
  ...NAV_COMPONENTS,
  ...LIST_MEDIA_COMPONENTS
]);

const MISSING_COMPONENTS = Object.freeze([
  'x-table',
  'x-tree',
  'x-list',
  'x-virtual-list',
  'x-combobox',
  'x-autocomplete',
  'x-command-palette'
]);

const REQUIRED_RADAR_REFS = Object.freeze([
  'NFM-BPR-003',
  'NFM-BPR-004',
  'NFM-BPR-009',
  'NFM-BPR-013',
  'NFM-BPR-015',
  'NFM-BPR-018',
  'NFM-BPR-020'
]);

const REQUIRED_GATES = Object.freeze([
  'form-controls-ux',
  'navigation-routing-ux',
  'layout-display-media-ux',
  'catalog-coverage',
  'references',
  'supply-chain'
]);

function assertIncludesAll(context, content, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(content, entry, `${label} includes ${entry}`);
  });
}

function assertArrayIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertSourcesExposeProfile(context, rootDir, components, schema, label) {
  components.forEach((tag) => {
    const relativePath = `components/${tag.replace(/-/g, '').replace(/^x/, 'x')}.js`;
    const fallbackPath = {
      'x-textarea': 'components/xtextarea.js',
      'x-calendar': 'components/xcalendar.js',
      'x-router': 'components/xrouter.js',
      'x-surface-manager': 'components/xsurfacemanager.js',
      'x-lightbox': 'components/xlightbox.js'
    }[tag] || relativePath;
    const source = readText(fallbackPath, rootDir);
    context.assertIncludes(source, 'xtend.rmt.component-contract.v1', `${tag} exposes RMT component contract`);
    context.assertIncludes(source, schema, `${tag} exposes ${label}`);
  });
}

function runNativeFirstFormNavigationMediaSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-Form-Navigation-Media-Hardening-Contract.md', rootDir);
  const matrix = readText('development/XTend-Native-First-Form-Navigation-Media-Hardening-Matrix.md', rootDir);
  const workpackage = readText('development/NFM-WP-08-Owned-Form-List-Navigation-und-Media-Primitives-haerten.md', rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const capabilityMatrix = readText('development/XTend-Native-First-UI-Primitive-Capability-Matrix.md', rootDir);
  const radar = readText('development/XTend-Native-First-Browser-Primitive-Radar.md', rootDir);
  const adoptionGate = readText('development/XTend-Native-Primitive-Adoption-Gate-Contract.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const componentManifest = readJson('components/manifest.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstFormNavigationMediaHardening;
  const formMetadata = packageManifest.xtend && packageManifest.xtend.formControlsUxMaturity;
  const navigationMetadata = packageManifest.xtend && packageManifest.xtend.navigationRoutingUxMaturity;
  const layoutMetadata = packageManifest.xtend && packageManifest.xtend.layoutDisplayMediaUxMaturity;

  context.assertIncludes(contract, CONTRACT_SCHEMA, 'Contract declares schema');
  context.assertIncludes(contract, MATRIX_SCHEMA, 'Contract declares matrix schema');
  context.assertIncludes(contract, REPORT_SCHEMA, 'Contract declares report schema');
  context.assertIncludes(contract, 'owned-app-primitives-before-framework-dependency', 'Contract preserves owned app primitive boundary');
  context.assertIncludes(contract, 'missing-list-and-combobox-primitives-are-not-claimed', 'Contract preserves missing primitive boundary');
  assertIncludesAll(context, contract, REQUIRED_RADAR_REFS, 'Contract radar refs');
  assertIncludesAll(context, contract, REQUIRED_GATES, 'Contract gates');

  context.assertIncludes(matrix, MATRIX_SCHEMA, 'Matrix declares schema');
  assertIncludesAll(context, matrix, [
    'NFM-FNM-01',
    'NFM-FNM-02',
    'NFM-FNM-03',
    'NFM-FNM-04',
    'NFM-FNM-05',
    'NFM-FNM-06',
    'NFM-FNM-07',
    'NFM-FNM-08',
    'NFM-FNM-09',
    'NFM-FNM-10',
    'NFM-FNM-11',
    'NFM-FNM-12'
  ], 'Matrix primitive groups');
  assertIncludesAll(context, matrix, ['NFM-CAP-04', 'NFM-CAP-08', 'NFM-CAP-09', 'NFM-CAP-10', 'NFM-CAP-16', 'NFM-CAP-17'], 'Matrix capability handoff');
  assertIncludesAll(context, matrix, ['missing-owned-primitive', 'wrap-as-xtend-primitive', 'defer-with-watch'], 'Matrix decision statuses');

  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  context.assertIncludes(workpackage, CONTRACT_SCHEMA, 'Workpackage declares contract schema');
  context.assertIncludes(workpackage, LOCAL_GATE, 'Workpackage declares local gate');
  assertIncludesAll(context, workpackage, REQUIRED_GATES, 'Workpackage verification gates');

  context.assertIncludes(roadmap, '| `NFM-WP-08` | P1 | completed |', 'Roadmap marks NFM-WP-08 completed');
  context.assert(
    roadmap.includes('| `NFM-WP-09` | P1 | ready |') || roadmap.includes('| `NFM-WP-09` | P1 | completed |'),
    'Roadmap makes NFM-WP-09 ready or completed after WP08'
  );
  context.assertIncludes(roadmap, 'development/XTend-Native-First-Form-Navigation-Media-Hardening-Contract.md', 'Roadmap references WP-08 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-08 gate');
  context.assertIncludes(mission, 'Form Navigation Media Hardening Contract: `xtend.native-first.form-navigation-media-hardening.v1`', 'Mission references WP-08 contract');
  context.assertIncludes(capabilityMatrix, '`NFM-CAP-04` | Forms, Validation und Input Composition | `owned-native-backed` | `ready-with-radar-watch`', 'Capability matrix upgrades NFM-CAP-04');
  context.assertIncludes(capabilityMatrix, '`NFM-CAP-16` | Data Display: Table, Tree, Virtual List und Collection Controls | `missing` | `missing-owned-primitive`', 'Capability matrix keeps data display missing');
  context.assertIncludes(capabilityMatrix, '`NFM-CAP-17` | Command Palette, Combobox und Autocomplete | `missing` | `missing-owned-primitive`', 'Capability matrix keeps command/combobox missing');
  assertIncludesAll(context, radar, REQUIRED_RADAR_REFS, 'Radar includes WP-08 refs');
  context.assertIncludes(adoptionGate, '`NFM-WP-08`', 'Adoption gate hands off to WP-08');

  REQUIRED_COMPONENTS.forEach((tag) => {
    context.assert(Object.prototype.hasOwnProperty.call(componentManifest, tag), `Manifest includes ${tag}`);
  });
  MISSING_COMPONENTS.forEach((tag) => {
    context.assert(!Object.prototype.hasOwnProperty.call(componentManifest, tag), `Manifest does not claim ${tag}`);
  });

  assertSourcesExposeProfile(context, rootDir, FORM_COMPONENTS, 'xtend.component.form-control-ux-profile.v1', 'Form Controls UX profile');
  assertSourcesExposeProfile(context, rootDir, NAV_COMPONENTS, 'xtend.component.navigation-routing-ux-profile.v1', 'Navigation Routing UX profile');
  assertSourcesExposeProfile(context, rootDir, LIST_MEDIA_COMPONENTS, 'xtend.component.layout-display-media-ux-profile.v1', 'Layout Display Media UX profile');

  context.assert(formMetadata && formMetadata.schema === 'xtend.component.form-controls-ux.v1', 'Package metadata exposes Form Controls UX schema');
  context.assert(navigationMetadata && navigationMetadata.schema === 'xtend.component.navigation-routing-ux.v1', 'Package metadata exposes Navigation Routing UX schema');
  context.assert(layoutMetadata && layoutMetadata.schema === 'xtend.component.layout-display-media-ux.v1', 'Package metadata exposes Layout Display Media UX schema');
  assertArrayIncludesAll(context, formMetadata && formMetadata.targets, FORM_COMPONENTS, 'Form metadata targets');
  assertArrayIncludesAll(context, navigationMetadata && navigationMetadata.targets, ['x-router', 'x-link'], 'Navigation metadata targets');
  assertArrayIncludesAll(context, layoutMetadata && layoutMetadata.targets, LIST_MEDIA_COMPONENTS, 'Layout/media metadata targets');

  const packageScripts = packageManifest.scripts || {};
  context.assert(packageScripts['test:native-first-form-navigation-media'] === 'node scripts/run_xtend_tests.js native-first-form-navigation-media', 'Package exposes native-first form navigation media test script');
  context.assertIncludes(runner, "require('../tests/native-first/native_first_form_navigation_media_suite')", 'Runner imports native-first form navigation media suite');
  context.assertIncludes(runner, "id: 'native-first-form-navigation-media'", 'Runner registers native-first form navigation media suite');

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-08 contract schema');
  context.assert(metadata && metadata.matrix === 'development/XTend-Native-First-Form-Navigation-Media-Hardening-Matrix.md', 'Package metadata exposes WP-08 matrix');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes WP-08 local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes WP-08 package script');
  assertArrayIncludesAll(context, metadata && metadata.components, REQUIRED_COMPONENTS, 'Package metadata components');
  assertArrayIncludesAll(context, metadata && metadata.missingComponents, MISSING_COMPONENTS, 'Package metadata missing components');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.radarRefs, REQUIRED_RADAR_REFS, 'Package metadata radar refs');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.rmtKernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata preserves RMT kernel boundary');
  context.assert(metadata && metadata.claimsDataGrid === false, 'Package metadata does not claim data grid');
  context.assert(metadata && metadata.claimsAutocomplete === false, 'Package metadata does not claim autocomplete');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-08',
      contract: CONTRACT_SCHEMA,
      components: REQUIRED_COMPONENTS.length,
      missingComponents: MISSING_COMPONENTS.length,
      radarRefs: REQUIRED_RADAR_REFS.length,
      sourceGates: REQUIRED_GATES.length,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true
    }
  });
}

function printNativeFirstFormNavigationMediaReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First Form Navigation Media Hardening erfolgreich.',
    failureTitle: 'Native-First Form Navigation Media Hardening fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstFormNavigationMediaReport,
  runNativeFirstFormNavigationMediaSuite
};

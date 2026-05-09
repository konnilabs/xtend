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
  COMPONENT_STYLING_CONTRACT_SCHEMA,
  COMPONENT_STYLING_REPORT_SCHEMA,
  COMPONENT_STYLING_WORKPACKAGE,
  COMPONENT_SHELL_CONTRACT_SCHEMA,
  RMT_STYLE_AUTHORING_SCHEMA,
  KERNEL_BOUNDARY,
  STYLING_REQUIRED_DOMAINS,
  STYLING_TOKEN_CATEGORIES,
  STYLING_REQUIRED_VARIANTS,
  STYLING_REQUIRED_SIZES,
  STYLING_REQUIRED_DENSITIES,
  STYLING_REQUIRED_THEMES,
  STYLING_REQUIRED_PARTS,
  STYLING_MOTION_POLICIES,
  createComponentStylingContract,
  validateComponentStylingContract
} = require('../../xtend-builder/typing/component-styling-contract');

function runComponentStylingContractSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'component-styling-contract',
    label: 'XTend Component Styling Contract'
  });
  const packageManifest = readJson('package.json', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const contractDoc = readText('development/XTend-Component-Styling-Token-und-Part-Contract.md', rootDir);
  const workpackage = readText('development/WP-E11-03-Styling-Token-und-CSS-Part-Contract-definieren.md', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.componentStylingContract;
  const sample = createComponentStylingContract({
    tag: 'x-button',
    variants: ['ghost'],
    parts: ['root', 'control', 'label', 'content', 'helper', 'error', 'icon']
  });
  const validation = validateComponentStylingContract(sample);
  const invalidValidation = validateComponentStylingContract({
    schema: COMPONENT_STYLING_CONTRACT_SCHEMA,
    tag: 'button',
    tokens: [{ name: '--bad-token', category: 'color', fallbackRequired: false }],
    parts: [{ name: 'root' }],
    variants: { allowed: ['default'] },
    sizes: { allowed: ['md'] },
    density: { allowed: ['comfortable'] },
    themes: { supported: ['light'] },
    motion: { reducedMotionSafe: false },
    contrast: { focusVisibleRequired: false },
    rmt: { kernelBoundary: 'xtend-imports-in-rmt-kernel' },
    compatibility: { noCdnThemeDependency: false }
  });

  context.assert(sample.schema === COMPONENT_STYLING_CONTRACT_SCHEMA, 'Styling factory emits Component Styling Contract schema');
  context.assert(validation.schema === COMPONENT_STYLING_REPORT_SCHEMA, 'Styling validator emits styling report schema');
  context.assert(validation.ok, 'Styling validator accepts a complete styling contract');
  context.assert(!invalidValidation.ok, 'Styling validator rejects invalid styling contracts');
  context.assert(sample.shellContract === COMPONENT_SHELL_CONTRACT_SCHEMA, 'Styling contract extends Component Shell Contract');
  context.assert(sample.componentContract === 'xtend.component.contract.v2', 'Styling contract keeps Component Contract v2 binding');
  context.assert(sample.uxMaturityModel === 'xtend.component.ux-maturity-model.v1', 'Styling contract binds the Epic 11 UX maturity model');
  context.assert(sample.tokens.length >= STYLING_TOKEN_CATEGORIES.length, 'Sample styling contract emits all token categories');
  context.assert(STYLING_TOKEN_CATEGORIES.every((category) => sample.tokens.some((token) => token.category === category)), 'Sample tokens cover required token categories');
  context.assert(sample.customProperties.prefix === '--xtend-button-', 'Sample styling contract uses component-scoped custom property prefix');
  context.assert(sample.customProperties.fallbackRequired === true, 'Custom properties require fallbacks');
  context.assert(sample.parts.some((part) => part.name === 'root'), 'Sample styling contract exposes root CSS part');
  context.assert(sample.parts.some((part) => part.name === 'control'), 'Sample styling contract exposes control CSS part');
  context.assert(sample.variants.allowed.includes('primary'), 'Sample styling contract includes primary variant');
  context.assert(sample.variants.allowed.includes('ghost'), 'Sample styling contract preserves component-specific variant');
  context.assert(sample.sizes.allowed.includes('sm'), 'Sample styling contract includes sm size');
  context.assert(sample.sizes.allowed.includes('md'), 'Sample styling contract includes md size');
  context.assert(sample.sizes.allowed.includes('lg'), 'Sample styling contract includes lg size');
  context.assert(sample.density.allowed.includes('compact'), 'Sample styling contract includes compact density');
  context.assert(sample.density.allowed.includes('dense'), 'Sample styling contract includes dense density');
  context.assert(sample.themes.supported.includes('dark'), 'Sample styling contract includes dark theme');
  context.assert(sample.themes.supported.includes('forced-colors'), 'Sample styling contract includes forced-colors theme');
  context.assert(sample.motion.reducedMotionSafe === true, 'Sample styling contract requires reduced-motion-safe styling');
  context.assert(sample.contrast.noColorOnlyState === true, 'Sample styling contract forbids color-only states');
  context.assert(sample.rmt.schema === RMT_STYLE_AUTHORING_SCHEMA, 'Styling contract prepares RMT Style Authoring schema');
  context.assert(sample.rmt.kernelBoundary === KERNEL_BOUNDARY, 'Styling contract keeps RMT kernel boundary');
  context.assert(sample.fabric.diagnostics.includes('style.token.missing'), 'Styling contract exposes Fabric diagnostics for missing tokens');
  context.assert(sample.compatibility.hostModes.includes('rmt-first'), 'Styling contract keeps RMT-first compatibility');
  context.assert(sample.compatibility.noCdnThemeDependency === true, 'Styling contract forbids CDN theme dependency');
  context.assert(STYLING_REQUIRED_DOMAINS.includes('tokens'), 'Required styling domains include tokens');
  context.assert(STYLING_REQUIRED_DOMAINS.includes('customProperties'), 'Required styling domains include customProperties');
  context.assert(STYLING_REQUIRED_DOMAINS.includes('rmt'), 'Required styling domains include RMT');
  context.assert(STYLING_REQUIRED_DOMAINS.includes('fabric'), 'Required styling domains include Fabric');
  context.assert(STYLING_REQUIRED_VARIANTS.includes('danger'), 'Required variants include danger');
  context.assert(STYLING_REQUIRED_SIZES.includes('lg'), 'Required sizes include lg');
  context.assert(STYLING_REQUIRED_DENSITIES.includes('dense'), 'Required density profiles include dense');
  context.assert(STYLING_REQUIRED_THEMES.includes('high-contrast'), 'Required themes include high-contrast');
  context.assert(STYLING_REQUIRED_PARTS.includes('control'), 'Required parts include control');
  context.assert(STYLING_MOTION_POLICIES.includes('reduced'), 'Motion policies include reduced');
  context.assert(packageManifest.exports['./builder/typing/component-styling-contract'] === './xtend-builder/typing/component-styling-contract.js', 'Package exports Component Styling Contract module');
  context.assert(packageManifest.scripts['test:component-styling-contract'] === 'node scripts/run_xtend_tests.js component-styling-contract', 'Package exposes Component Styling Contract test script');
  context.assert(metadata && metadata.schema === COMPONENT_STYLING_CONTRACT_SCHEMA, 'Package metadata exposes Component Styling Contract schema');
  context.assert(metadata.reportSchema === COMPONENT_STYLING_REPORT_SCHEMA, 'Package metadata exposes Component Styling report schema');
  context.assert(metadata.workpackage === COMPONENT_STYLING_WORKPACKAGE, 'Package metadata exposes WP-E11-03 owner');
  context.assert(metadata.contract === 'development/XTend-Component-Styling-Token-und-Part-Contract.md', 'Package metadata exposes Styling Contract doc path');
  context.assert(metadata.module === 'xtend-builder/typing/component-styling-contract.js', 'Package metadata exposes Styling Contract module path');
  context.assert(Array.isArray(metadata.requiredTokenCategories) && metadata.requiredTokenCategories.includes('motion'), 'Package metadata exposes motion token category');
  context.assert(Array.isArray(metadata.requiredDensities) && metadata.requiredDensities.includes('dense'), 'Package metadata exposes dense density');
  context.assert(metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps RMT kernel boundary');
  context.assertIncludes(scaffoldConfig, 'componentStylingContract', 'Scaffold config exposes Component Styling Contract section');
  context.assertIncludes(scaffoldConfig, COMPONENT_STYLING_CONTRACT_SCHEMA, 'Scaffold config declares Component Styling schema');
  context.assertIncludes(scaffoldConfig, 'component-styling-contract', 'Scaffold config references Component Styling gate');
  context.assertIncludes(runner, "id: 'component-styling-contract'", 'Runner exposes Component Styling Contract suite');
  context.assertIncludes(contractDoc, COMPONENT_STYLING_CONTRACT_SCHEMA, 'Contract document declares Component Styling schema');
  context.assertIncludes(contractDoc, 'XtendComponentStylingContract', 'Contract document defines the TypeScript interface name');
  context.assertIncludes(contractDoc, RMT_STYLE_AUTHORING_SCHEMA, 'Contract document declares RMT Style Authoring handoff');
  context.assertIncludes(contractDoc, KERNEL_BOUNDARY, 'Contract document keeps RMT kernel boundary visible');
  context.assertIncludes(contractDoc, '`comfortable`, `compact`, `dense`', 'Contract document lists required density profiles');
  context.assertIncludes(workpackage, 'xtend.epic11.wp03.component-styling-contract.v1', 'WP-E11-03 declares workpackage schema');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-03 is completed');
  context.assertIncludes(workpackage, 'node scripts/run_xtend_tests.js component-styling-contract --json', 'WP-E11-03 documents local gate');
  context.assertIncludes(epic, '| `WP-E11-03` | P0 | completed |', 'Epic 11 marks WP-E11-03 completed');
  context.assertIncludes(epic, '| `WP-E11-04` | P0 | completed |', 'Epic 11 marks WP-E11-04 completed after Runtime A11y');
  context.assertIncludes(backlog, '| `WP-E11-03` | P0 | completed | WS1 |', 'Epic 11 backlog marks WP-E11-03 completed');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-03', 'Epic 11 backlog documents WP-E11-03 handoff');

  return context.result({
    schema: COMPONENT_STYLING_CONTRACT_SCHEMA,
    requiredDomains: STYLING_REQUIRED_DOMAINS,
    requiredTokenCategories: STYLING_TOKEN_CATEGORIES
  });
}

function printComponentStylingContractReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Component Styling Contract erfolgreich.',
    failureTitle: 'XTend Component Styling Contract fehlgeschlagen:'
  });
}

module.exports = {
  printComponentStylingContractReport,
  runComponentStylingContractSuite
};

const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');

const SUITE_ID = 'rmt-renderer-dom-descriptor-proofs';
const SUITE_LABEL = 'Native-First RMT Renderer DOM Descriptor Proofs';
const CONTRACT_SCHEMA = 'xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1';
const MATRIX_SCHEMA = 'xtend.native-first.rmt-renderer-dom-descriptor-proof-matrix.v1';
const ITEM_SCHEMA = 'xtend.native-first.rmt-renderer-dom-descriptor-proof.v1';
const FIXTURE_SCHEMA = 'xtend.native-first.rmt-renderer-dom-descriptor-proof-fixture.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.native-first.rmt-renderer-dom-descriptor-proof-fixtures.v1';
const REPORT_SCHEMA = 'xtend.native-first.rmt-renderer-dom-descriptor-proofs-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json';
const PACKAGE_SCRIPT = 'npm run test:rmt-renderer-dom-descriptor-proofs';
const FIXTURE_PATH = 'tests/fixtures/native-first/rmt-renderer-dom-descriptor-proof-fixtures.json';

const REQUIRED_FIELDS = Object.freeze([
  'proofId',
  'proofClass',
  'sourceRecipes',
  'sourceSyntaxDecisions',
  'sourcePrimitiveDecisions',
  'status',
  'uiSurfaces',
  'rmtDomains',
  'nativePrimitivePlan',
  'trustBoundaryPlan',
  'runtimeGates',
  'browserLabPlan',
  'forbiddenSinks',
  'blockedClaims',
  'sourceMapPlan',
  'fixture',
  'expectedOutcome',
  'owner',
  'nextHandoff'
]);

const PROOF_STATUSES = Object.freeze([
  'proof-accepted',
  'proof-accepted-with-surface-residual',
  'proof-handoff-to-budget-gate'
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'structured-dom-descriptor-default',
  'trusted-html-explicit-boundary-only',
  'no-manual-html-normal-ui',
  'no-inline-handler-or-javascript-url',
  'browser-lab-budget-claim-deferred-to-wp19',
  'no-new-runtime-dependency',
  'rmt-kernel-remains-host-neutral'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'rmt-renderer-dom-descriptor-proofs',
  'rmt-complete-ui-recipes',
  'rmt-syntax-growth',
  'rmt-action-effect-data-resource-primitives',
  'rmt-ui-primitive-gap',
  'rmt-dom-descriptor-renderer',
  'rmt-component-template-primitives',
  'rmt-vnext-composition',
  'rmt-vnext-surfaces',
  'rmt-vnext-security',
  'rmt-vnext-events',
  'rmt-state-selector-runtime',
  'rmt-event-routing-runtime',
  'rmt-action-effect-runtime',
  'rmt-surface-resource-graph-runtime',
  'rmt-app-platform-fixture',
  'native-first-form-navigation-media',
  'native-first-overlay-focus',
  'epic13-trusted-dom-boundary',
  'contract-runtime-parity',
  'references'
]);

const FORBIDDEN_AUTHORING_TOKENS = Object.freeze([
  'innerHTML',
  'outerHTML',
  'insertAdjacentHTML',
  'eval(',
  'function ',
  'onclick',
  'javascript:'
]);

const REQUIRED_PROOFS = Object.freeze([
  {
    proofId: 'NFM-RDP-01',
    proofClass: 'structured-dom-descriptor-materialization',
    sourceRecipes: ['NFM-RCR-01', 'NFM-RCR-02', 'NFM-RCR-09'],
    sourceSyntaxDecisions: ['NFM-RSG-01', 'NFM-RSG-02', 'NFM-RSG-07'],
    sourcePrimitiveDecisions: ['NFM-RAE-02', 'NFM-RAE-05'],
    status: 'proof-accepted',
    uiSurfaces: ['app-shell', 'dashboard-layout', 'docs-shell', 'template-slot-materialization'],
    rmtDomains: ['templates', 'slots', 'components', 'routes', 'sourceMap'],
    nativePrimitivePlan: ['document.createElement', 'document.createTextNode', 'document.createDocumentFragment', 'Element.replaceChildren', 'keyed-child-reuse'],
    trustBoundaryPlan: ['descriptor-only-output', 'no-html-string-renderer', 'diagnostic-source-map-required'],
    runtimeGates: ['rmt-dom-descriptor-renderer', 'rmt-component-template-primitives', 'rmt-vnext-composition', 'rmt-app-platform-fixture'],
    browserLabPlan: ['dom-node-materialization-smoke', 'slot-replacement-smoke', 'source-map-dom-anchor-smoke'],
    forbiddenSinks: ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'template.innerHTML', 'document.write'],
    blockedClaims: ['none'],
    fixture: 'NFM-RDP-FIX-01',
    expectedOutcome: 'accepted-structured-dom-materialization-proof',
    owner: 'rmt-renderer-security-owner',
    nextHandoff: ['NFM-WP-19', 'NFM-WP-20']
  },
  {
    proofId: 'NFM-RDP-02',
    proofClass: 'surface-portal-overlay-proof',
    sourceRecipes: ['NFM-RCR-04', 'NFM-RCR-05'],
    sourceSyntaxDecisions: ['NFM-RSG-03', 'NFM-RSG-06'],
    sourcePrimitiveDecisions: ['NFM-RAE-02', 'NFM-RAE-04', 'NFM-RAE-07'],
    status: 'proof-accepted-with-surface-residual',
    uiSurfaces: ['overlay', 'portal', 'focus-scope', 'surface-stack', 'modal-action'],
    rmtDomains: ['surfaces', 'slots', 'events', 'actions', 'effects', 'securityPolicies', 'sourceMap'],
    nativePrimitivePlan: ['HTMLElement', 'HTMLDialogElement', 'popover', 'inert', 'focus', 'AbortController'],
    trustBoundaryPlan: ['surface-trust-policy-required', 'effect-policy-required', 'release-on-owner-dispose'],
    runtimeGates: ['rmt-vnext-surfaces', 'rmt-dom-descriptor-renderer', 'native-first-overlay-focus', 'rmt-vnext-security', 'rmt-action-effect-runtime'],
    browserLabPlan: ['portal-attach-detach-smoke', 'focus-return-smoke', 'escape-dismiss-smoke', 'inert-boundary-smoke'],
    forbiddenSinks: ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'onclick', 'javascript:'],
    blockedClaims: ['no-complete-surface-maximality-claim'],
    fixture: 'NFM-RDP-FIX-02',
    expectedOutcome: 'accepted-with-surface-runtime-residual',
    owner: 'component-overlay-owner',
    nextHandoff: ['NFM-WP-19', 'surface-browser-lab']
  },
  {
    proofId: 'NFM-RDP-03',
    proofClass: 'trusted-dom-sanitizing-proof',
    sourceRecipes: ['NFM-RCR-04', 'NFM-RCR-09'],
    sourceSyntaxDecisions: ['NFM-RSG-08'],
    sourcePrimitiveDecisions: ['NFM-RAE-08'],
    status: 'proof-accepted',
    uiSurfaces: ['trusted-rich-content', 'docs-progressive-boot', 'diagnostic-boundary'],
    rmtDomains: ['securityPolicies', 'templates', 'components', 'dataSources', 'diagnostics', 'sourceMap'],
    nativePrimitivePlan: ['TrustedHTML', 'URL', 'textContent', 'setAttribute', 'replaceChildren'],
    trustBoundaryPlan: ['trusted-dom-boundary-required', 'sanitizer-policy-required', 'unsafe-html-sink-forbidden'],
    runtimeGates: ['epic13-trusted-dom-boundary', 'rmt-vnext-security', 'contract-runtime-parity', 'references'],
    browserLabPlan: ['trusted-html-boundary-smoke', 'sanitizer-refusal-smoke', 'redacted-diagnostic-smoke'],
    forbiddenSinks: ['innerHTML', 'insertAdjacentHTML', 'template.innerHTML', 'eval(', 'new Function', 'javascript:'],
    blockedClaims: ['unsafe-html-sink-forbidden'],
    fixture: 'NFM-RDP-FIX-03',
    expectedOutcome: 'accepted-trusted-dom-boundary-proof',
    owner: 'security-owner',
    nextHandoff: ['NFM-WP-19', 'NFM-WP-20']
  },
  {
    proofId: 'NFM-RDP-04',
    proofClass: 'attribute-url-property-boundary-proof',
    sourceRecipes: ['NFM-RCR-08', 'NFM-RCR-09'],
    sourceSyntaxDecisions: ['NFM-RSG-02', 'NFM-RSG-07'],
    sourcePrimitiveDecisions: ['NFM-RAE-05', 'NFM-RAE-07'],
    status: 'proof-accepted',
    uiSurfaces: ['media-preview', 'docs-link', 'resource-cleanup', 'diagnostic-boundary'],
    rmtDomains: ['components', 'templates', 'resources', 'effects', 'securityPolicies', 'sourceMap'],
    nativePrimitivePlan: ['setAttribute', 'removeAttribute', 'URL', 'dataset', 'property-allowlist', 'AbortController'],
    trustBoundaryPlan: ['url-policy-required', 'property-allowlist-required', 'resource-owner-required'],
    runtimeGates: ['rmt-dom-descriptor-renderer', 'rmt-action-effect-runtime', 'rmt-surface-resource-graph-runtime', 'rmt-vnext-security'],
    browserLabPlan: ['safe-url-smoke', 'property-allowlist-smoke', 'object-url-release-smoke'],
    forbiddenSinks: ['srcdoc', 'javascript:', 'innerHTML', 'outerHTML', 'onerror'],
    blockedClaims: ['javascript-url-forbidden'],
    fixture: 'NFM-RDP-FIX-04',
    expectedOutcome: 'accepted-attribute-url-property-boundary-proof',
    owner: 'rmt-renderer-security-owner',
    nextHandoff: ['NFM-WP-19', 'NFM-WP-20']
  },
  {
    proofId: 'NFM-RDP-05',
    proofClass: 'event-listener-and-action-ref-proof',
    sourceRecipes: ['NFM-RCR-03', 'NFM-RCR-05', 'NFM-RCR-07'],
    sourceSyntaxDecisions: ['NFM-RSG-06', 'NFM-RSG-08'],
    sourcePrimitiveDecisions: ['NFM-RAE-01', 'NFM-RAE-02', 'NFM-RAE-08'],
    status: 'proof-accepted',
    uiSurfaces: ['form-submit', 'navigation-feedback', 'command-action-placeholder', 'scheduler-lane'],
    rmtDomains: ['events', 'actions', 'effects', 'state', 'schedules', 'sourceMap'],
    nativePrimitivePlan: ['addEventListener', 'EventTarget', 'CustomEvent', 'AbortController', 'structured-payload'],
    trustBoundaryPlan: ['action-ref-required', 'payload-shape-required', 'inline-handler-forbidden'],
    runtimeGates: ['rmt-event-routing-runtime', 'rmt-action-effect-runtime', 'rmt-vnext-events', 'rmt-dom-descriptor-renderer'],
    browserLabPlan: ['event-listener-smoke', 'action-ref-routing-smoke', 'abort-listener-cleanup-smoke'],
    forbiddenSinks: ['onclick', 'onchange', 'javascript:', 'eval(', 'function '],
    blockedClaims: ['inline-handler-forbidden'],
    fixture: 'NFM-RDP-FIX-05',
    expectedOutcome: 'accepted-event-action-ref-proof',
    owner: 'rmt-event-action-owner',
    nextHandoff: ['NFM-WP-19', 'NFM-WP-20']
  },
  {
    proofId: 'NFM-RDP-06',
    proofClass: 'browser-lab-proof-budget-handoff',
    sourceRecipes: ['NFM-RCR-01', 'NFM-RCR-02', 'NFM-RCR-04', 'NFM-RCR-08', 'NFM-RCR-09'],
    sourceSyntaxDecisions: ['NFM-RSG-01', 'NFM-RSG-02', 'NFM-RSG-03', 'NFM-RSG-07'],
    sourcePrimitiveDecisions: ['NFM-RAE-02', 'NFM-RAE-05', 'NFM-RAE-07'],
    status: 'proof-handoff-to-budget-gate',
    uiSurfaces: ['app-shell', 'dashboard-layout', 'overlay', 'media-preview', 'docs-shell'],
    rmtDomains: ['templates', 'slots', 'surfaces', 'resources', 'diagnostics', 'sourceMap'],
    nativePrimitivePlan: ['PerformanceObserver', 'MutationObserver', 'requestAnimationFrame', 'DocumentFragment', 'replaceChildren'],
    trustBoundaryPlan: ['safety-before-budget-claim', 'redacted-diagnostics-required', 'no-production-budget-claim-before-nfm-wp19'],
    runtimeGates: ['rmt-complete-ui-recipes', 'rmt-dom-descriptor-renderer', 'native-first-evidence-pack', 'contract-runtime-parity'],
    browserLabPlan: ['browser-render-smoke', 'mutation-budget-baseline', 'interaction-safety-smoke', 'visual-baseline-plan'],
    forbiddenSinks: ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'createContextualFragment'],
    blockedClaims: ['no-production-budget-claim-before-nfm-wp19'],
    fixture: 'NFM-RDP-FIX-06',
    expectedOutcome: 'handoff-to-native-first-budget-gates',
    owner: 'performance-owner',
    nextHandoff: ['NFM-WP-19']
  }
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

function assertPathExists(context, rootDir, relativePath, label) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), `${label} exists at ${relativePath}`);
}

function assertRunnerGate(context, runner, gate) {
  context.assert(runner.hasSuite(gate), `Runner registers ${gate}`);
}

function countBy(items, field) {
  return items.reduce((acc, item) => {
    const key = item[field];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function containsForbiddenToken(text) {
  return FORBIDDEN_AUTHORING_TOKENS.some((token) => String(text).includes(token));
}

function runNativeFirstRmtRendererDomDescriptorProofSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Contract.md', rootDir);
  const matrix = readText('development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Matrix.md', rootDir);
  const workpackage = readText('development/NFM-WP-18-Browser-native-Renderer-und-DOM-Descriptor-Proofs-ausbauen.md', rootDir);
  const fixtures = readJson(FIXTURE_PATH, rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const registry = readText('development/XTend-Native-First-Contract-Registry.md', rootDir);
  const registryContract = readText('development/XTend-Native-First-Contract-Registry-Contract.md', rootDir);
  const recipeMatrix = readText('development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md', rootDir);
  const recipeFixtures = readJson('tests/fixtures/native-first/rmt-complete-ui-recipe-fixtures.json', rootDir);
  const syntaxMatrix = readText('development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md', rootDir);
  const actionMatrix = readText('development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Matrix.md', rootDir);
  const rendererDocs = readText('docs/en/rmt-dom-descriptor-renderer.md', rootDir);
  const rendererRuntime = readText('xtendrmt/rmt-dom-descriptor-renderer.js', rootDir);
  const rendererCatalog = readText('catalog/epic18-rmt-dom-descriptor-renderer.js', rootDir);
  const trustedDomPolicy = readText('development/XTend-Trusted-DOM-und-Sanitizing-Policy.md', rootDir);
  const trustedDomProof = readText('docs/de/trusted-dom-boundary-browser-proof.md', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstRmtRendererDomDescriptorProofs;
  const registryMetadata = packageManifest.xtend && packageManifest.xtend.nativeFirstContractRegistry;

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    'xtend.native-first.rmt-complete-ui-recipe-fixtures.v1',
    'xtend.epic18.rmt-dom-descriptor-renderer.v1',
    'xtend.security.trusted-dom-policy.v1',
    'xtend.epic13.trusted-dom-boundary.v1',
    LOCAL_GATE,
    PACKAGE_SCRIPT
  ], 'Contract header');
  assertIncludesAll(context, contract, REQUIRED_FIELDS, 'Contract required fields');
  assertIncludesAll(context, contract, PROOF_STATUSES, 'Contract status model');
  assertIncludesAll(context, contract, REQUIRED_BOUNDARIES, 'Contract boundaries');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');
  assertIncludesAll(context, contract, [
    'keine neue produktive Renderer-Implementierung',
    'keine Freigabe von freien HTML-Sinks',
    'keine Performance-, Complexity- oder Bundle-Budget-Freigabe'
  ], 'Contract non-goals');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    FIXTURE_PATH,
    LOCAL_GATE,
    'Status Summary',
    'Coverage Summary',
    'NFM-WP-19',
    'NFM-WP-20',
    'surface-browser-lab'
  ], 'Matrix header and sections');
  assertIncludesAll(context, matrix, REQUIRED_FIELDS, 'Matrix fields');
  assertIncludesAll(context, matrix, [
    '`proof-accepted` | 4',
    '`proof-accepted-with-surface-residual` | 1',
    '`proof-handoff-to-budget-gate` | 1'
  ], 'Matrix status counts');

  REQUIRED_PROOFS.forEach((proof) => {
    assertIncludesAll(context, matrix, [
      proof.proofId,
      proof.proofClass,
      proof.status,
      proof.fixture,
      proof.expectedOutcome,
      proof.owner
    ], `Matrix row ${proof.proofId}`);
    assertIncludesAll(context, matrix, proof.sourceRecipes, `Matrix row ${proof.proofId} source recipes`);
    assertIncludesAll(context, matrix, proof.sourceSyntaxDecisions, `Matrix row ${proof.proofId} syntax decisions`);
    assertIncludesAll(context, matrix, proof.sourcePrimitiveDecisions, `Matrix row ${proof.proofId} primitive decisions`);
    assertIncludesAll(context, matrix, proof.uiSurfaces, `Matrix row ${proof.proofId} UI surfaces`);
    assertIncludesAll(context, matrix, proof.rmtDomains, `Matrix row ${proof.proofId} RMT domains`);
    assertIncludesAll(context, matrix, proof.nativePrimitivePlan, `Matrix row ${proof.proofId} native primitive plan`);
    assertIncludesAll(context, matrix, proof.trustBoundaryPlan, `Matrix row ${proof.proofId} trust boundary plan`);
    assertIncludesAll(context, matrix, proof.runtimeGates, `Matrix row ${proof.proofId} runtime gates`);
    assertIncludesAll(context, matrix, proof.browserLabPlan, `Matrix row ${proof.proofId} browser lab plan`);
    assertIncludesAll(context, matrix, proof.forbiddenSinks, `Matrix row ${proof.proofId} forbidden sinks`);
    assertIncludesAll(context, matrix, proof.blockedClaims, `Matrix row ${proof.proofId} blocked claims`);
    proof.nextHandoff.forEach((handoff) => context.assertIncludes(matrix, handoff, `Matrix row ${proof.proofId} handoff ${handoff}`));
  });

  context.assert(fixtures && fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures && fixtures.fixtureSchema === FIXTURE_SCHEMA, 'Fixture pack exposes item schema');
  context.assert(fixtures && fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references WP-18 contract');
  context.assert(fixtures && fixtures.workpackage === 'NFM-WP-18', 'Fixture pack references WP-18');
  context.assert(fixtures && fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  const fixtureRows = (fixtures && fixtures.fixtures) || [];
  context.assert(fixtureRows.length === REQUIRED_PROOFS.length, 'Fixture pack contains one fixture per proof');

  REQUIRED_PROOFS.forEach((proof) => {
    const fixture = fixtureRows.find((candidate) => candidate.fixtureId === proof.fixture);
    context.assert(Boolean(fixture), `Fixture pack contains ${proof.fixture}`);
    if (!fixture) return;
    context.assert(fixture.proofId === proof.proofId, `${proof.fixture} maps to ${proof.proofId}`);
    context.assert(fixture.proofClass === proof.proofClass, `${proof.fixture} has proof class`);
    context.assert(fixture.status === proof.status, `${proof.fixture} has status`);
    context.assert(fixture.expectedOutcome === proof.expectedOutcome, `${proof.fixture} has expected outcome`);
    context.assert(fixture.owner === proof.owner, `${proof.fixture} has owner`);
    context.assert(!containsForbiddenToken(fixture.authoring), `${proof.fixture} authoring avoids forbidden runtime tokens`);
    assertArrayIncludesAll(context, fixture.sourceRecipes, proof.sourceRecipes, `${proof.fixture} source recipes`);
    assertArrayIncludesAll(context, fixture.sourceSyntaxDecisions, proof.sourceSyntaxDecisions, `${proof.fixture} source syntax decisions`);
    assertArrayIncludesAll(context, fixture.sourcePrimitiveDecisions, proof.sourcePrimitiveDecisions, `${proof.fixture} source primitive decisions`);
    assertArrayIncludesAll(context, fixture.uiSurfaces, proof.uiSurfaces, `${proof.fixture} UI surfaces`);
    assertArrayIncludesAll(context, fixture.rmtDomains, proof.rmtDomains, `${proof.fixture} RMT domains`);
    assertArrayIncludesAll(context, fixture.nativePrimitivePlan, proof.nativePrimitivePlan, `${proof.fixture} native primitive plan`);
    assertArrayIncludesAll(context, fixture.trustBoundaryPlan, proof.trustBoundaryPlan, `${proof.fixture} trust boundary plan`);
    assertArrayIncludesAll(context, fixture.runtimeGates, proof.runtimeGates, `${proof.fixture} runtime gates`);
    assertArrayIncludesAll(context, fixture.browserLabPlan, proof.browserLabPlan, `${proof.fixture} browser lab plan`);
    assertArrayIncludesAll(context, fixture.forbiddenSinks, proof.forbiddenSinks, `${proof.fixture} forbidden sinks`);
    assertArrayIncludesAll(context, fixture.blockedClaims, proof.blockedClaims, `${proof.fixture} blocked claims`);
    proof.nextHandoff.forEach((handoff) => {
      context.assert(Array.isArray(fixture.nextHandoff) && fixture.nextHandoff.includes(handoff), `${proof.fixture} handoff includes ${handoff}`);
    });
  });

  assertIncludesAll(context, recipeMatrix, [
    'NFM-WP-18',
    'recipe-accepted-with-renderer-proof-residual',
    'NFM-RCR-04',
    'no-complete-surface-maximality-claim'
  ], 'WP-17 recipe inputs');
  const recipes = (recipeFixtures && recipeFixtures.fixtures) || [];
  context.assert(Boolean(recipes.find((recipe) => recipe.recipeId === 'NFM-RCR-04' && recipe.nextHandoff.includes('NFM-WP-18'))), 'WP-17 fixture hands renderer residual to WP-18');
  assertIncludesAll(context, syntaxMatrix, [
    'NFM-RSG-03',
    'NFM-RSG-08',
    'NFM-WP-18',
    'reject-imperative-or-html-bypass'
  ], 'WP-15 syntax inputs');
  assertIncludesAll(context, actionMatrix, [
    'NFM-RAE-04',
    'NFM-RAE-08',
    'NFM-WP-18',
    'reject-free-runtime-execution'
  ], 'WP-16 action/resource inputs');

  assertIncludesAll(context, rendererDocs, [
    'xtend.epic18.rmt-dom-descriptor-renderer.v1',
    'createElement',
    'createTextNode',
    'createDocumentFragment',
    'replaceChildren',
    'No-Manual-HTML',
    'innerHTML',
    'insertAdjacentHTML'
  ], 'DOM renderer docs');
  assertIncludesAll(context, rendererRuntime, [
    'createElement',
    'createTextNode',
    'createDocumentFragment',
    'replaceChildren',
    'setAttributeSafe',
    'isSafeUrl',
    'RMT_DOM_APPLICATION_BINDING_SCHEMA',
    'BLOCKED_PROPERTY_NAMES',
    'MANUAL_HTML_PATTERNS'
  ], 'DOM renderer runtime');
  assertIncludesAll(context, rendererCatalog, [
    'REQUIRED_RENDER_OPERATIONS',
    'FORBIDDEN_NORMAL_UI_SINKS',
    'trusted-html-explicit-boundary-only',
    'no-manual-html-normal-ui',
    'no-rmt-kernel-import-of-xtend-types'
  ], 'DOM renderer catalog');
  assertIncludesAll(context, trustedDomPolicy, [
    'xtend.security.trusted-dom-policy.v1',
    'textContent',
    'setAttribute',
    'replaceChildren',
    'innerHTML',
    'insertAdjacentHTML',
    'javascript:',
    'Inline-Handler'
  ], 'Trusted DOM policy');
  assertIncludesAll(context, trustedDomProof, [
    'xtend.epic13.trusted-dom-boundary.v1',
    'epic13-trusted-dom-boundary',
    'inline-event-handler',
    'javascript-url',
    'srcdoc'
  ], 'Trusted DOM browser proof');

  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  assertIncludesAll(context, workpackage, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    FIXTURE_PATH,
    'NFM-WP-19',
    'NFM-WP-20',
    'surface-browser-lab'
  ], 'Workpackage schemas, gate and handoff');

  context.assertIncludes(roadmap, '| `NFM-WP-18` | P1 | completed |', 'Roadmap marks NFM-WP-18 completed');
  context.assert(
    roadmap.includes('| `NFM-WP-19` | P1 | ready |') || roadmap.includes('| `NFM-WP-19` | P1 | completed |'),
    'Roadmap keeps NFM-WP-19 ready or completed'
  );
  context.assertIncludes(roadmap, 'development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Contract.md', 'Roadmap references WP-18 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-18 gate');

  context.assertIncludes(mission, 'RMT Renderer DOM Descriptor Proofs Contract: `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1`', 'Mission references WP-18 contract');
  context.assertIncludes(mission, 'development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Matrix.md', 'Mission source-of-truth lists WP-18 matrix');
  context.assertIncludes(mission, '`NFM-WP-18` | completed', 'Mission handoff marks WP-18 completed');

  assertIncludesAll(context, registry, [
    CONTRACT_SCHEMA,
    'rmt-renderer-security-owner',
    'NFM-WP-18',
    REPORT_SCHEMA,
    'rmt-renderer-dom-descriptor-proofs',
    'development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Contract.md',
    'rmt-renderer-dom-descriptor-proof-matrix',
    'gate-plan'
  ], 'Registry WP-18 entry');
  assertIncludesAll(context, registryContract, [
    'NFM-WP-18',
    'rmt-renderer-dom-descriptor-proofs',
    CONTRACT_SCHEMA
  ], 'Registry contract WP-18 extension');

  context.assert(packageScripts['test:rmt-renderer-dom-descriptor-proofs'] === 'node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs', 'Package exposes WP-18 test script');
  context.assert(runner.hasImplementation({ path: "tests/native-first/native_first_rmt_renderer_dom_descriptor_proofs_suite.js" }), 'Runner imports WP-18 suite');
  context.assert(runner.hasSuite("rmt-renderer-dom-descriptor-proofs"), 'Runner registers WP-18 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => assertRunnerGate(context, runner, gate));

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-18 contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes WP-18 matrix schema');
  context.assert(metadata && metadata.itemSchema === ITEM_SCHEMA, 'Package metadata exposes WP-18 item schema');
  context.assert(metadata && metadata.fixtureSchema === FIXTURE_SCHEMA, 'Package metadata exposes WP-18 fixture schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes WP-18 fixture pack schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes WP-18 report schema');
  context.assert(metadata && metadata.contract === 'development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Contract.md', 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === 'development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Matrix.md', 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixture path');
  context.assert(metadata && metadata.workpackageDocument === 'development/NFM-WP-18-Browser-native-Renderer-und-DOM-Descriptor-Proofs-ausbauen.md', 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.externalUiFrameworkDependencyAllowed === false, 'Package metadata blocks external UI framework dependency');
  context.assert(metadata && metadata.freeHtmlSinkAllowed === false, 'Package metadata blocks free HTML sinks');
  context.assert(metadata && metadata.performanceBudgetClaimIncluded === false, 'Package metadata defers budget claims');
  assertArrayIncludesAll(context, metadata && metadata.requiredFields, REQUIRED_FIELDS, 'Package metadata required fields');
  assertArrayIncludesAll(context, metadata && metadata.proofStatuses, PROOF_STATUSES, 'Package metadata proof statuses');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');

  const proofRows = (metadata && metadata.proofs) || [];
  context.assert(proofRows.length === REQUIRED_PROOFS.length, 'Package metadata registers all proof rows');
  REQUIRED_PROOFS.forEach((required) => {
    const proof = proofRows.find((candidate) => candidate.proofId === required.proofId);
    context.assert(Boolean(proof), `Package metadata registers ${required.proofId}`);
    if (!proof) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(proof[field]), `Package metadata ${required.proofId} has ${field}`);
    });
    context.assert(proof.proofClass === required.proofClass, `Package metadata ${required.proofId} has class`);
    context.assert(proof.status === required.status, `Package metadata ${required.proofId} has status`);
    context.assert(proof.fixture === required.fixture, `Package metadata ${required.proofId} has fixture`);
    context.assert(proof.expectedOutcome === required.expectedOutcome, `Package metadata ${required.proofId} has expected outcome`);
    context.assert(proof.owner === required.owner, `Package metadata ${required.proofId} has owner`);
    assertArrayIncludesAll(context, proof.sourceRecipes, required.sourceRecipes, `Package metadata ${required.proofId} source recipes`);
    assertArrayIncludesAll(context, proof.sourceSyntaxDecisions, required.sourceSyntaxDecisions, `Package metadata ${required.proofId} syntax decisions`);
    assertArrayIncludesAll(context, proof.sourcePrimitiveDecisions, required.sourcePrimitiveDecisions, `Package metadata ${required.proofId} primitive decisions`);
    assertArrayIncludesAll(context, proof.uiSurfaces, required.uiSurfaces, `Package metadata ${required.proofId} UI surfaces`);
    assertArrayIncludesAll(context, proof.rmtDomains, required.rmtDomains, `Package metadata ${required.proofId} RMT domains`);
    assertArrayIncludesAll(context, proof.nativePrimitivePlan, required.nativePrimitivePlan, `Package metadata ${required.proofId} native primitives`);
    assertArrayIncludesAll(context, proof.trustBoundaryPlan, required.trustBoundaryPlan, `Package metadata ${required.proofId} trust boundaries`);
    assertArrayIncludesAll(context, proof.runtimeGates, required.runtimeGates, `Package metadata ${required.proofId} runtime gates`);
    assertArrayIncludesAll(context, proof.browserLabPlan, required.browserLabPlan, `Package metadata ${required.proofId} browser lab plan`);
    assertArrayIncludesAll(context, proof.forbiddenSinks, required.forbiddenSinks, `Package metadata ${required.proofId} forbidden sinks`);
    assertArrayIncludesAll(context, proof.blockedClaims, required.blockedClaims, `Package metadata ${required.proofId} blocked claims`);
    assertArrayIncludesAll(context, proof.nextHandoff, required.nextHandoff, `Package metadata ${required.proofId} handoffs`);
  });

  context.assert(registryMetadata && Array.isArray(registryMetadata.sourceGates) && registryMetadata.sourceGates.includes('rmt-renderer-dom-descriptor-proofs'), 'Registry metadata source gates include WP-18');
  context.assert(registryMetadata && Array.isArray(registryMetadata.entries) && registryMetadata.entries.some((entry) => entry.contractId === CONTRACT_SCHEMA), 'Registry metadata entries include WP-18');
  REQUIRED_SOURCE_GATES.forEach((gate) => assertRunnerGate(context, runner, gate));
  [
    'development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Contract.md',
    'development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Matrix.md',
    'development/NFM-WP-18-Browser-native-Renderer-und-DOM-Descriptor-Proofs-ausbauen.md',
    FIXTURE_PATH
  ].forEach((relativePath) => assertPathExists(context, rootDir, relativePath, `WP-18 artifact ${relativePath}`));

  const statusCounts = countBy(fixtureRows, 'status');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-18',
      contract: CONTRACT_SCHEMA,
      proofs: REQUIRED_PROOFS.length,
      fixtures: fixtureRows.length,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      statusCounts,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true,
      freeHtmlSinkAllowed: false,
      performanceBudgetClaimIncluded: false
    }
  });
}

function printNativeFirstRmtRendererDomDescriptorProofReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First RMT Renderer DOM Descriptor Proofs erfolgreich.',
    failureTitle: 'Native-First RMT Renderer DOM Descriptor Proofs fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstRmtRendererDomDescriptorProofReport,
  runNativeFirstRmtRendererDomDescriptorProofSuite
};

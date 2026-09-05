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

const SUITE_ID = 'native-first-docs-authoring';
const SUITE_LABEL = 'Native-First Docs Authoring Guides';
const CONTRACT_SCHEMA = 'xtend.native-first.docs-authoring-guides.v1';
const MATRIX_SCHEMA = 'xtend.native-first.docs-authoring-guide-matrix.v1';
const ITEM_SCHEMA = 'xtend.native-first.docs-authoring-guide.v1';
const REPORT_SCHEMA = 'xtend.native-first.docs-authoring-guides-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js native-first-docs-authoring --json';
const PACKAGE_SCRIPT = 'npm run test:native-first-docs-authoring';

const REQUIRED_FIELDS = Object.freeze([
  'guideId',
  'audience',
  'docsPaths',
  'sourceContracts',
  'requiredGates',
  'requiredTopics',
  'blockedTerms',
  'status',
  'owner',
  'nextHandoff'
]);

const GUIDE_STATUSES = Object.freeze([
  'guide-accepted',
  'guide-accepted-with-residuals',
  'guide-handoff-to-migration'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'native-first-docs-authoring',
  'native-first-budget-gates',
  'contract-registry',
  'native-first-evidence-pack',
  'rmt-complete-ui-recipes',
  'rmt-renderer-dom-descriptor-proofs',
  'docs-public-quality',
  'references'
]);

const REQUIRED_PUBLIC_SLUGS = Object.freeze([
  'native-first-authoring-guide',
  'native-first-rmt-recipes',
  'native-first-release-review'
]);

const FORBIDDEN_PUBLIC_TERMS = Object.freeze([
  'NFM-WP-',
  'Workpackage',
  'Handoff',
  'Gate Matrix',
  'Release Owner',
  'RC0',
  'RC1'
]);

const GERMAN_ASCII_UMLAUT_PATTERN = /\b(?:fuer|ueber|koennen|muessen|waehrend|enthaelt|prueft|pruefen|haerten|moeglich|laedt|fuehrt|gehoert|vollstaendig|zugehoerig|flaeche|aenderung|aenderungen|kompatibilitaet|qualitaet)\b/iu;

const REQUIRED_GUIDES = Object.freeze([
  {
    guideId: 'NFM-DOC-01',
    audience: 'component-author',
    status: 'guide-accepted',
    owner: 'docs-authoring-owner',
    docsPaths: [
      'docs/de/native-first-authoring-guide.md',
      'docs/en/native-first-authoring-guide.md'
    ],
    sourceContracts: [
      'xtend.native-first.mission-source-of-truth.v1',
      'xtend.native-first.dependency-diet-policy.v1',
      'xtend.native-first.contract-registry.v1',
      'xtend.native-first.performance-complexity-bundle-budget-gates.v1',
      CONTRACT_SCHEMA
    ],
    requiredGates: [
      'native-first-docs-authoring',
      'contract-registry',
      'native-first-budget-gates',
      'docs-public-quality'
    ],
    requiredTopics: [
      'browser-native-first',
      'avoid-runtime-dependency',
      'contract-registry-discoverability',
      'trusted-dom-boundary',
      'dom-descriptor-default'
    ],
    blockedTerms: [
      'external-ui-framework-default',
      'unsafe-html-sink'
    ],
    nextHandoff: ['NFM-WP-21', 'NFM-WP-22'],
    publicTerms: [
      'DOM Descriptor Renderer',
      'Trusted DOM',
      'native-first-budget-gates',
      'contract-registry'
    ]
  },
  {
    guideId: 'NFM-DOC-02',
    audience: 'app-author',
    status: 'guide-accepted',
    owner: 'rmt-authoring-owner',
    docsPaths: [
      'docs/de/native-first-rmt-recipes.md',
      'docs/en/native-first-rmt-recipes.md'
    ],
    sourceContracts: [
      'xtend.native-first.rmt-complete-ui-recipe-fixtures.v1',
      'xtend.native-first.rmt-action-effect-data-resource-primitives.v1',
      'xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1',
      CONTRACT_SCHEMA
    ],
    requiredGates: [
      'native-first-docs-authoring',
      'rmt-complete-ui-recipes',
      'rmt-renderer-dom-descriptor-proofs',
      'references'
    ],
    requiredTopics: [
      'app-shell',
      'dashboard',
      'form',
      'overlay',
      'navigation',
      'media',
      'docs-flow',
      'action-effect-data-resource-primitives'
    ],
    blockedTerms: [
      'host-shell-workaround',
      'raw-dom-mutation',
      'inline-js',
      'manual-sink'
    ],
    nextHandoff: ['NFM-WP-21'],
    publicTerms: [
      'RMT',
      'DOM',
      'Recipe',
      'Resource',
      'rmt-complete-ui-recipes',
      'rmt-renderer-dom-descriptor-proofs'
    ]
  },
  {
    guideId: 'NFM-DOC-03',
    audience: 'release-reviewer',
    status: 'guide-accepted-with-residuals',
    owner: 'release-evidence-owner',
    docsPaths: [
      'docs/de/native-first-release-review.md',
      'docs/en/native-first-release-review.md'
    ],
    sourceContracts: [
      'xtend.native-first.contract-registry.v1',
      'xtend.native-first.audit-evidence-pack.v1',
      'xtend.native-first.performance-complexity-bundle-budget-gates.v1',
      'xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1',
      CONTRACT_SCHEMA
    ],
    requiredGates: [
      'native-first-docs-authoring',
      'native-first-evidence-pack',
      'native-first-budget-gates',
      'contract-registry',
      'references'
    ],
    requiredTopics: [
      'registry-evidence',
      'budget-evidence',
      'browser-residuals',
      'supply-chain',
      'redaction',
      'blocked-non-native-claims'
    ],
    blockedTerms: [
      'unregistered-contract-claim',
      'visual-claim-without-artifact',
      'dependency-without-exit-plan'
    ],
    nextHandoff: ['NFM-WP-22'],
    publicTerms: [
      'native-first-evidence-pack',
      'native-first-budget-gates',
      'contract-registry',
      'accepted-with-residuals'
    ]
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

function runNativeFirstDocsAuthoringSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-Docs-Authoring-Guides-Contract.md', rootDir);
  const matrix = readText('development/XTend-Native-First-Docs-Authoring-Guides-Matrix.md', rootDir);
  const workpackage = readText('development/NFM-WP-20-Docs-und-Authoring-Guides-fuer-Native-First-XTend-aktualisieren.md', rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const registry = readText('development/XTend-Native-First-Contract-Registry.md', rootDir);
  const registryContract = readText('development/XTend-Native-First-Contract-Registry-Contract.md', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsReadmeDe = readText('docs/de/README.md', rootDir);
  const docsReadmeEn = readText('docs/en/README.md', rootDir);
  const menu = readJson('docs/menu.json', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstDocsAuthoring;
  const registryMetadata = packageManifest.xtend && packageManifest.xtend.nativeFirstContractRegistry;

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    REPORT_SCHEMA,
    'xtend.native-first.mission-source-of-truth.v1',
    'xtend.native-first.dependency-diet-policy.v1',
    'xtend.native-first.contract-registry.v1',
    'xtend.native-first.rmt-complete-ui-recipe-fixtures.v1',
    'xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1',
    'xtend.native-first.performance-complexity-bundle-budget-gates.v1',
    LOCAL_GATE,
    PACKAGE_SCRIPT
  ], 'Contract header');
  assertIncludesAll(context, contract, REQUIRED_FIELDS, 'Contract required fields');
  assertIncludesAll(context, contract, GUIDE_STATUSES, 'Contract status model');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');
  assertIncludesAll(context, contract, [
    'docs-before-native-first-product-claim',
    'registered-contract-id-before-docs-claim',
    'rmt-first-recipes-before-host-shell-workaround',
    'no-public-docs-internal-planning-vocabulary',
    'no-runtime-dependency-from-docs'
  ], 'Contract boundaries');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    CONTRACT_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    'Status Summary',
    'Coverage Summary',
    'Blocked Claims',
    'NFM-WP-21',
    'NFM-WP-22'
  ], 'Matrix header and sections');
  assertIncludesAll(context, matrix, REQUIRED_FIELDS, 'Matrix required fields');
  assertIncludesAll(context, matrix, [
    '`guide-accepted` | 2',
    '`guide-accepted-with-residuals` | 1',
    '`guide-handoff-to-migration` | 0'
  ], 'Matrix status counts');

  REQUIRED_GUIDES.forEach((guide) => {
    assertIncludesAll(context, matrix, [
      guide.guideId,
      guide.audience,
      guide.status,
      guide.owner
    ], `Matrix row ${guide.guideId}`);
    assertIncludesAll(context, matrix, guide.docsPaths, `Matrix row ${guide.guideId} docs paths`);
    assertIncludesAll(context, matrix, guide.sourceContracts, `Matrix row ${guide.guideId} source contracts`);
    assertIncludesAll(context, matrix, guide.requiredGates, `Matrix row ${guide.guideId} gates`);
    assertIncludesAll(context, matrix, guide.requiredTopics, `Matrix row ${guide.guideId} topics`);
    assertIncludesAll(context, matrix, guide.blockedTerms, `Matrix row ${guide.guideId} blocked terms`);
    assertIncludesAll(context, matrix, guide.nextHandoff, `Matrix row ${guide.guideId} handoff`);

    guide.docsPaths.forEach((docsPath) => {
      assertPathExists(context, rootDir, docsPath, `${guide.guideId} public docs`);
      const publicDoc = readText(docsPath, rootDir);
      assertIncludesAll(context, publicDoc, guide.sourceContracts, `${guide.guideId} public doc source contracts`);
      assertIncludesAll(context, publicDoc, guide.requiredGates, `${guide.guideId} public doc source gates`);
      assertIncludesAll(context, publicDoc, guide.publicTerms, `${guide.guideId} public doc terms`);
      FORBIDDEN_PUBLIC_TERMS.forEach((term) => {
        context.assert(!publicDoc.includes(term), `${guide.guideId} public doc omits ${term}`);
      });
      if (docsPath.startsWith('docs/de/')) {
        context.assert(!GERMAN_ASCII_UMLAUT_PATTERN.test(publicDoc), `${guide.guideId} German public doc uses umlauts`);
      }
    });
  });

  const menuSlugs = menu.map((entry) => entry.slug);
  assertArrayIncludesAll(context, menuSlugs, REQUIRED_PUBLIC_SLUGS, 'Docs menu slugs');
  REQUIRED_PUBLIC_SLUGS.forEach((slug) => {
    const entry = menu.find((candidate) => candidate.slug === slug);
    context.assert(entry && entry.labels && entry.labels.de && entry.labels.en, `Docs menu ${slug} has localized labels`);
  });
  assertIncludesAll(context, `${docsReadme}\n${docsReadmeDe}\n${docsReadmeEn}`, REQUIRED_PUBLIC_SLUGS, 'Docs README references public slugs');

  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  assertIncludesAll(context, workpackage, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    'docs/de/native-first-authoring-guide.md',
    'docs/en/native-first-authoring-guide.md',
    'docs/de/native-first-rmt-recipes.md',
    'docs/en/native-first-rmt-recipes.md',
    'docs/de/native-first-release-review.md',
    'docs/en/native-first-release-review.md',
    'NFM-WP-21',
    'NFM-WP-22'
  ], 'Workpackage schemas, docs and handoff');

  context.assertIncludes(roadmap, '| `NFM-WP-20` | P2 | completed |', 'Roadmap marks NFM-WP-20 completed');
  context.assert(
    roadmap.includes('| `NFM-WP-21` | P2 | ready |') || roadmap.includes('| `NFM-WP-21` | P2 | completed |'),
    'Roadmap marks NFM-WP-21 ready or completed'
  );
  context.assertIncludes(roadmap, 'development/XTend-Native-First-Docs-Authoring-Guides-Contract.md', 'Roadmap references WP-20 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-20 gate');

  context.assertIncludes(mission, 'Native-First Docs Authoring Guides Contract: `xtend.native-first.docs-authoring-guides.v1`', 'Mission references WP-20 contract');
  context.assertIncludes(mission, 'development/XTend-Native-First-Docs-Authoring-Guides-Matrix.md', 'Mission source-of-truth lists WP-20 matrix');
  context.assertIncludes(mission, '`NFM-WP-20` | completed', 'Mission handoff marks WP-20 completed');

  assertIncludesAll(context, registry, [
    CONTRACT_SCHEMA,
    'accepted-with-authoring-guides',
    'docs-authoring-owner',
    'NFM-WP-20',
    REPORT_SCHEMA,
    'native-first-docs-authoring',
    'development/XTend-Native-First-Docs-Authoring-Guides-Contract.md',
    'docs-authoring-guides',
    'docs-surface'
  ], 'Registry WP-20 entry');
  assertIncludesAll(context, registryContract, [
    'NFM-WP-20',
    'native-first-docs-authoring',
    CONTRACT_SCHEMA,
    'accepted-with-authoring-guides'
  ], 'Registry contract WP-20 extension');

  context.assert(packageScripts['test:native-first-docs-authoring'] === 'node scripts/run_xtend_tests.js native-first-docs-authoring', 'Package exposes WP-20 test script');
  context.assert(runner.hasImplementation({ path: "tests/native-first/native_first_docs_authoring_suite.js" }), 'Runner imports WP-20 suite');
  context.assert(runner.hasSuite("native-first-docs-authoring"), 'Runner registers WP-20 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => assertRunnerGate(context, runner, gate));

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-20 schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes WP-20 matrix schema');
  context.assert(metadata && metadata.itemSchema === ITEM_SCHEMA, 'Package metadata exposes WP-20 item schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes WP-20 report schema');
  context.assert(metadata && metadata.contract === 'development/XTend-Native-First-Docs-Authoring-Guides-Contract.md', 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === 'development/XTend-Native-First-Docs-Authoring-Guides-Matrix.md', 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.workpackageDocument === 'development/NFM-WP-20-Docs-und-Authoring-Guides-fuer-Native-First-XTend-aktualisieren.md', 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.publicDocsLocalized === true, 'Package metadata marks public docs localized');
  assertArrayIncludesAll(context, metadata && metadata.requiredFields, REQUIRED_FIELDS, 'Package metadata required fields');
  assertArrayIncludesAll(context, metadata && metadata.guideStatuses, GUIDE_STATUSES, 'Package metadata guide statuses');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.publicSlugs, REQUIRED_PUBLIC_SLUGS, 'Package metadata public slugs');

  const guideRows = (metadata && metadata.guides) || [];
  context.assert(guideRows.length === REQUIRED_GUIDES.length, 'Package metadata registers all guides');
  REQUIRED_GUIDES.forEach((required) => {
    const guide = guideRows.find((candidate) => candidate.guideId === required.guideId);
    context.assert(Boolean(guide), `Package metadata registers ${required.guideId}`);
    if (!guide) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(guide[field]), `Package metadata ${required.guideId} has ${field}`);
    });
    context.assert(guide.audience === required.audience, `Package metadata ${required.guideId} has audience`);
    context.assert(guide.status === required.status, `Package metadata ${required.guideId} has status`);
    context.assert(guide.owner === required.owner, `Package metadata ${required.guideId} has owner`);
    assertArrayIncludesAll(context, guide.docsPaths, required.docsPaths, `Package metadata ${required.guideId} docs paths`);
    assertArrayIncludesAll(context, guide.sourceContracts, required.sourceContracts, `Package metadata ${required.guideId} source contracts`);
    assertArrayIncludesAll(context, guide.requiredGates, required.requiredGates, `Package metadata ${required.guideId} gates`);
    assertArrayIncludesAll(context, guide.requiredTopics, required.requiredTopics, `Package metadata ${required.guideId} topics`);
    assertArrayIncludesAll(context, guide.blockedTerms, required.blockedTerms, `Package metadata ${required.guideId} blocked terms`);
    assertArrayIncludesAll(context, guide.nextHandoff, required.nextHandoff, `Package metadata ${required.guideId} handoff`);
  });

  context.assert(registryMetadata && Array.isArray(registryMetadata.sourceGates) && registryMetadata.sourceGates.includes('native-first-docs-authoring'), 'Registry metadata source gates include WP-20');
  context.assert(registryMetadata && Array.isArray(registryMetadata.entries) && registryMetadata.entries.some((entry) => entry.contractId === CONTRACT_SCHEMA), 'Registry metadata entries include WP-20');

  [
    'development/XTend-Native-First-Docs-Authoring-Guides-Contract.md',
    'development/XTend-Native-First-Docs-Authoring-Guides-Matrix.md',
    'development/NFM-WP-20-Docs-und-Authoring-Guides-fuer-Native-First-XTend-aktualisieren.md'
  ].forEach((relativePath) => assertPathExists(context, rootDir, relativePath, `WP-20 artifact ${relativePath}`));

  const statusCounts = countBy(REQUIRED_GUIDES, 'status');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-20',
      contract: CONTRACT_SCHEMA,
      guides: REQUIRED_GUIDES.length,
      publicSlugs: REQUIRED_PUBLIC_SLUGS.length,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      statusCounts,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true,
      publicDocsLocalized: true
    }
  });
}

function printNativeFirstDocsAuthoringReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First Docs Authoring Guides erfolgreich.',
    failureTitle: 'Native-First Docs Authoring Guides fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstDocsAuthoringReport,
  runNativeFirstDocsAuthoringSuite
};

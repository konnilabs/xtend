const {
  createComponentPlan
} = require('../generators/component-plan');
const {
  createFeatureWiring
} = require('../wiring/features');
const {
  createHydrationWiring
} = require('../wiring/hydration');
const {
  createManifestWiring
} = require('../wiring/manifest');
const {
  createComponentTypingContract
} = require('../typing/component-types');

const COMPONENT_PREVIEW_SCHEMA = 'xtend.scaffold.component-preview.v1';
const RMT_COMPATIBILITY_BINDING_SCHEMA = 'xtend.scaffold.rmt-compatibility-binding.v1';

function findArtifact(plan, id) {
  return Array.isArray(plan.artifacts) ? plan.artifacts.find((artifact) => artifact.id === id) : null;
}

function createComponentPreviewContract(input = {}, options = {}) {
  const plan = options.plan || createComponentPlan(input, options);
  if (!plan.ok) {
    return {
      schema: COMPONENT_PREVIEW_SCHEMA,
      ok: false,
      mode: 'dry-run-preview-contract',
      errors: plan.errors,
      preview: {},
      registryEntry: null
    };
  }

  const manifestWiring = options.manifestWiring || createManifestWiring({
    tag: plan.input.tag,
    profiles: plan.input.profiles
  });
  const hydrationWiring = options.hydrationWiring || createHydrationWiring({
    tag: plan.input.tag,
    className: plan.input.className
  });
  const featureWiring = options.featureWiring || createFeatureWiring({
    tag: plan.input.tag,
    name: plan.input.name,
    className: plan.input.className,
    profiles: plan.input.profiles,
    features: plan.input.features
  });
  const typingContract = options.typingContract || createComponentTypingContract({}, {
    plan,
    featureWiring
  });
  const demoArtifact = findArtifact(plan, 'demo');
  const targetPath = demoArtifact ? demoArtifact.targetPath : `docs/previews/${plan.input.name}.preview.md`;
  const registryEntry = {
    path: targetPath,
    status: 'automated-static-candidate',
    purpose: `Scaffold preview reference for ${plan.input.tag} with local fixture, docs, types and manifest patch plan.`
  };
  const typingCompatibility = typingContract.rmtCompatibility || {};
  const rmtAttachment = typingContract.rmtAttachment || {};

  return {
    schema: COMPONENT_PREVIEW_SCHEMA,
    ok: true,
    mode: 'dry-run-preview-contract',
    artifact: {
      id: 'demo',
      targetPath,
      action: 'plan-reference',
      required: 'conditional'
    },
    component: {
      tag: plan.input.tag,
      name: plan.input.name,
      className: plan.input.className,
      profiles: plan.input.profiles.slice(),
      features: plan.input.features.slice()
    },
    preview: {
      kind: 'markdown-preview-plan',
      sourcePath: `components/${plan.input.tag}.js`,
      docsPath: `docs/components/${plan.input.name}.md`,
      fixturePath: hydrationWiring.fixture.scriptPath,
      fixtureDocument: `tests/components/fixtures/${plan.input.tag}.component.html`,
      typesPath: typingContract.artifact.targetPath,
      manifestTarget: manifestWiring.loader.target,
      manifestSource: manifestWiring.patchPlan.source,
      localOnly: true,
      externalNetworkAllowed: false,
      browserSmokeCandidate: true
    },
    registry: {
      document: 'development/XTend-Dokumentations-und-Demo-Referenzpfade.md',
      entry: registryEntry,
      patchMode: 'manual-review-before-write',
      requiredStatusValues: ['automated-static', 'browser-smoke', 'manual-legacy', 'future', 'automated-static-candidate']
    },
    verification: {
      requiredCommands: [
        'node scripts/run_xtend_tests.js references --json',
        'node scripts/run_xtend_tests.js rmt-compatibility --json',
        'node scripts/run_xtend_tests.js components a11y-hydration',
        'npm test'
      ],
      referenceGate: 'node scripts/run_xtend_tests.js references',
      reportCommand: 'npm run test:report'
    },
    contracts: {
      noExternalNetwork: true,
      requiresDocsReference: true,
      requiresFixtureReference: true,
      requiresTypeReference: true,
      requiresManifestPatchPlan: true,
      requiresRegistryEntry: true,
      requiresRmtCompatibilityBinding: true
    },
    rmtCompatibility: {
      schema: typingCompatibility.schema || RMT_COMPATIBILITY_BINDING_SCHEMA,
      status: 'preview-bound-to-rmt-compatibility',
      previewRef: targetPath,
      registryDocument: 'development/XTend-Dokumentations-und-Demo-Referenzpfade.md',
      artifactBinding: typingCompatibility.artifactBinding || {},
      contractRefs: typingCompatibility.contractRefs || {},
      adapterRefs: typingCompatibility.adapterRefs || {},
      dryRunSurfaces: Array.isArray(typingCompatibility.dryRunSurfaces) ? typingCompatibility.dryRunSurfaces.slice() : [],
      manifestPlanRequired: true,
      extensionPlanRequired: true,
      typeContract: typingContract.schema,
      rmtAttachmentSchema: rmtAttachment.schema,
      localOnly: true,
      externalNetworkAllowed: false,
      bridgeBoundary: 'reserved-for-Epic-05',
      verification: typingCompatibility.verification || {},
      boundaries: typingCompatibility.boundaries || {}
    },
    upstreamBoundaries: {
      rmtRuntime: 'out-of-scope-for-WP-E03-10',
      productiveWrites: 'out-of-scope-for-WP-E03-10',
      bridgeImplementation: 'reserved-for-Epic-05'
    },
    signals: {
      stateKeys: featureWiring.state.keys.slice(),
      events: featureWiring.events.names.slice(),
      rmtAdapter: typingContract.rmtAttachment.adapter,
      rmtRouterAdapter: typingContract.rmtAttachment.routerAdapter,
      rmtCompatibilityBinding: typingCompatibility.schema || RMT_COMPATIBILITY_BINDING_SCHEMA
    },
    nextStep: 'WP-E04-08 can expand test and reference gates for RMT-compatible XTend artifacts.'
  };
}

module.exports = {
  COMPONENT_PREVIEW_SCHEMA,
  RMT_COMPATIBILITY_BINDING_SCHEMA,
  createComponentPreviewContract
};

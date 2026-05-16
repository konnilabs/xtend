const {
  createComponentPlan
} = require('./component-plan');
const {
  renderTemplateForArtifact
} = require('../templates/loader');
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
const {
  COMPONENT_CONTRACT_REPORT_V2_SCHEMA,
  COMPONENT_CONTRACT_V2_SCHEMA,
  TYPESCRIPT_SOURCE_STRATEGY_SCHEMA,
  createComponentContractV2,
  validateComponentContractV2
} = require('../typing/component-contract-v2');
const {
  createComponentPreviewContract
} = require('../preview/component-preview');
const {
  createComponentExtensionPoints
} = require('../extensions/component-extension-points');
const {
  createComponentA11yProfile
} = require('../a11y/component-a11y-profile');
const {
  createComponentPerformanceProfile
} = require('../performance/component-performance-profile');
const {
  writeScaffoldFiles
} = require('../writing/write-plan');
const {
  createComponentBuildReportEntry,
  createManifestPatchEntry
} = require('../writing/manifest-patcher');

const COMPONENT_FILES_SCHEMA = 'xtend.scaffold.component-files.v1';
const TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA = 'xtend.scaffold.typescript-component-blueprint.v1';
const COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA = 'xtend.component.lifecycle-telemetry.v1';
const COMPONENT_FABRIC_LANE_INGESTION_SCHEMA = 'xtend.component.fabric-lane-ingestion.v2';
const RENDERED_ARTIFACTS = [
  'component',
  'docs',
  'tests',
  'fixtures',
  'types',
  'manifest',
  'demo',
  'ts-source',
  'ts-contract',
  'ts-rmt',
  'ts-a11y',
  'ts-performance',
  'ts-fixture'
];

function toJsonArray(values) {
  return values.map((value) => JSON.stringify(value)).join(', ');
}

function toMarkdownRows(values, description) {
  if (!values || values.length === 0) {
    return `| n/a | ${description} |`;
  }

  return values.map((value) => `| \`${value}\` | ${description} |`).join('\n');
}

function toBulletList(values) {
  if (!values || values.length === 0) {
    return '- n/a';
  }

  return values.map((value) => `- ${value}`).join('\n');
}

function toTypeUnion(values) {
  if (!values || values.length === 0) {
    return 'never';
  }

  return values.map((value) => JSON.stringify(value).replace(/"/g, "'")).join(' | ');
}

function toSignalRows(signalContract) {
  const signals = signalContract && Array.isArray(signalContract.signals) ? signalContract.signals : [];
  if (signals.length === 0) {
    return '| n/a | n/a | no screenreader signal |';
  }

  return signals
    .map((signal) => `| \`${signal.signal}\` | \`${signal.liveRegion}\` | ${signal.kind} |`)
    .join('\n');
}

function toRegionCsv(regions) {
  return (regions || []).map((region) => `${region.id}:${region.role}/${region.ariaLive}`).join(', ');
}

function toBooleanLiteral(value) {
  return value ? 'true' : 'false';
}

function toFlagBoolean(value) {
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

function getRootDir(input) {
  return input.rootDir || input['root-dir'] || process.cwd();
}

function createComponentWriteEntries(files, manifestEntry, buildReportEntry) {
  let manifestReplaced = false;
  const entries = files.map((file) => {
    if (file.id !== 'manifest') {
      return file;
    }

    manifestReplaced = true;
    return manifestEntry;
  });

  if (!manifestReplaced) {
    entries.push(manifestEntry);
  }

  if (buildReportEntry) {
    entries.push(buildReportEntry);
  }

  return entries;
}

function toInterfaceFields(entries, emptyComment) {
  if (!entries || entries.length === 0) {
    return `  ${emptyComment}`;
  }

  return entries.map((entry) => `  ${entry.name}: ${entry.type};`).join('\n');
}

function toEventOverloads(events, className) {
  if (!events || events.length === 0) {
    return '';
  }

  return events
    .map((event) => [
      `  addEventListener(type: '${event.name}', listener: (event: CustomEvent<${className}EventDetail>) => void, options?: boolean | AddEventListenerOptions): void;`,
      `  removeEventListener(type: '${event.name}', listener: (event: CustomEvent<${className}EventDetail>) => void, options?: boolean | EventListenerOptions): void;`
    ].join('\n'))
    .join('\n');
}

function toTypeRows(entries, description) {
  if (!entries || entries.length === 0) {
    return `| n/a | n/a | ${description} |`;
  }

  return entries.map((entry) => {
    const type = String(entry.type).replace(/\|/g, '\\|');
    return `| \`${entry.name}\` | \`${type}\` | ${description} |`;
  }).join('\n');
}

function toPreviewSignalRows(previewContract) {
  const signals = previewContract.signals || {};
  const rows = [];

  (signals.stateKeys || []).forEach((key) => rows.push(`| \`${key}\` | xstate reference |`));
  (signals.events || []).forEach((event) => rows.push(`| \`${event}\` | Custom Event reference |`));
  if (signals.rmtAdapter) {
    rows.push(`| \`${signals.rmtAdapter}\` | RMT component adapter |`);
  }
  if (signals.rmtRouterAdapter) {
    rows.push(`| \`${signals.rmtRouterAdapter}\` | RMT router adapter |`);
  }
  if (signals.rmtCompatibilityBinding) {
    rows.push(`| \`${signals.rmtCompatibilityBinding}\` | RMT compatibility binding |`);
  }

  return rows.length > 0 ? rows.join('\n') : '| n/a | no preview signals |';
}

function toExtensionHookRows(extensionContract) {
  const hooks = extensionContract.rootLifecycle ? extensionContract.rootLifecycle.hooks : [];
  if (!hooks || hooks.length === 0) {
    return '| n/a | n/a | no lifecycle hooks |';
  }

  return hooks.map((hook) => `| \`${hook.name}\` | \`${hook.phase}\` | ${hook.defaultBehavior} |`).join('\n');
}

function toLifecycleHookUnion(extensionContract) {
  const hooks = extensionContract.rootLifecycle ? extensionContract.rootLifecycle.hooks : [];
  return toTypeUnion((hooks || []).map((hook) => hook.name));
}

function createComponentFiles(input = {}, options = {}) {
  const plan = createComponentPlan(input, options);
  if (!plan.ok) {
    return {
      schema: COMPONENT_FILES_SCHEMA,
      ok: false,
      mode: 'dry-run',
      errors: plan.errors,
      files: [],
      exceptions: []
    };
  }

  const manifestWiring = createManifestWiring({
    tag: plan.input.tag,
    profiles: plan.input.profiles
  });
  const hydrationWiring = createHydrationWiring({
    tag: plan.input.tag,
    className: plan.input.className
  });
  const featureWiring = createFeatureWiring({
    tag: plan.input.tag,
    name: plan.input.name,
    className: plan.input.className,
    profiles: plan.input.profiles,
    features: plan.input.features
  });
  const manifestPatchPlan = manifestWiring.patchPlan;
  const fixtureResultName = hydrationWiring.fixture.resultObjectName;
  const a11yProfile = plan.a11yProfile || createComponentA11yProfile({}, { plan });
  const performanceProfile = plan.performanceProfile || createComponentPerformanceProfile({}, { plan });
  const featureManifest = {
    schema: featureWiring.schema,
    stateKeys: featureWiring.state.keys,
    events: featureWiring.events.names,
    apiNamespaces: featureWiring.api.namespaces,
    profiles: featureWiring.profiles.map((profile) => ({
      profile: profile.profile,
      reviewChecks: profile.reviewChecks
    })),
    localUiPolicy: featureWiring.state.localUiPolicy,
    forbidden: featureWiring.state.forbidden.concat(featureWiring.api.forbiddenGlobals)
  };
  const typingContract = createComponentTypingContract({}, {
    plan,
    featureWiring
  });
  const previewContract = createComponentPreviewContract({}, {
    plan,
    manifestWiring,
    hydrationWiring,
    featureWiring,
    typingContract
  });
  const extensionPoints = createComponentExtensionPoints({}, {
    plan,
    hydrationWiring,
    featureWiring,
    typingContract,
    previewContract
  });
  const rmtAttachment = typingContract.rmtAttachment || {};
  const templateAuthoring = rmtAttachment.templateAuthoring || {};
  const rootLifecycleAttachment = rmtAttachment.rootLifecycle || {};
  const hostCapabilitiesAttachment = rmtAttachment.hostCapabilities || {};
  const rmtCompatibility = typingContract.rmtCompatibility || {};
  const previewCompatibility = previewContract.rmtCompatibility || {};
  const hostCapabilityNames = hostCapabilitiesAttachment.capabilities
    ? Object.keys(hostCapabilitiesAttachment.capabilities)
    : [];
  const compatibilityContractRefs = rmtCompatibility.contractRefs || {};
  const compatibilityArtifactBinding = rmtCompatibility.artifactBinding || {};
  const previewRegistryEntry = previewContract.registry ? previewContract.registry.entry : {};
  const a11yScaffold = a11yProfile.scaffold || {};
  const a11yFocusStrategy = a11yProfile.focusStrategy || {};
  const a11yAccessibleName = a11yProfile.accessibleName || {};
  const a11yScreenreader = a11yProfile.screenreader || {};
  const a11yScreenreaderSignalContract = a11yScreenreader.signalContract || {};
  const a11yScreenreaderFabric = a11yScreenreaderSignalContract.fabric || a11yScreenreader.fabric || {};
  const a11yMotion = a11yProfile.motion || {};
  const a11yContrast = a11yProfile.contrast || {};
  const a11yMotionContrast = a11yProfile.motionContrast || {};
  const a11yMotionContrastPolicy = a11yMotionContrast.policy || {};
  const a11yMotionContrastFabric = a11yMotionContrastPolicy.fabric || a11yMotionContrast.fabric || {};
  const performanceScaffold = performanceProfile.scaffold || {};
  const componentContractV2 = createComponentContractV2({
    tag: plan.input.tag,
    className: plan.input.className,
    attributes: ['variant', 'aria-label'],
    events: featureWiring.events.names,
    slots: ['default'],
    maturity: 'preview',
    defaultLane: performanceProfile.lane || 'visible'
  });
  const componentContractV2Report = validateComponentContractV2(componentContractV2);
  const componentLifecycleOperations = componentContractV2.fabric && Array.isArray(componentContractV2.fabric.operations)
    ? componentContractV2.fabric.operations
    : [];
  const rmtComponentMetadata = {
    schema: componentContractV2.rmt.schema,
    adapter: componentContractV2.rmt.adapter,
    componentRecordKind: componentContractV2.rmt.componentRecordKind,
    tag: plan.input.tag,
    className: plan.input.className,
    source: {
      strategy: componentContractV2.source.strategy,
      sourcePath: componentContractV2.source.sourcePath,
      runtimeArtifact: componentContractV2.runtime.artifact,
      declarationArtifact: componentContractV2.runtime.declaration,
      localOnly: componentContractV2.runtime.localOnly,
      cdnAllowed: componentContractV2.runtime.cdnAllowed
    },
    schedule: {
      mount: 'component.visible.mount',
      hydrate: performanceProfile.hydrationPolicy || 'visible',
      update: 'component.visible.update',
      diagnostics: 'diagnostics.snapshot'
    },
    hydration: {
      mode: manifestPatchPlan.hydrationMode,
      marker: hydrationWiring.component.stateAttribute,
      fixture: hydrationWiring.fixture.scriptPath
    },
    fabric: {
      schema: COMPONENT_FABRIC_LANE_INGESTION_SCHEMA,
      lane: performanceProfile.lane || componentContractV2.lanes.defaultLane,
      precedence: componentContractV2.lanes.precedence,
      source: 'scaffold.blueprint-default'
    },
    telemetry: {
      schema: COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA,
      snapshot: componentContractV2.telemetry.schema,
      operations: componentLifecycleOperations,
      backpressureAware: componentContractV2.telemetry.backpressureAware
    },
    a11y: {
      schema: a11yProfile.schema,
      role: a11yProfile.role,
      screenreaderSignals: a11yScreenreaderSignalContract.schema || a11yScreenreader.contract
    },
    performance: {
      schema: performanceProfile.schema,
      budgetClass: performanceProfile.budgetClass,
      lane: performanceProfile.lane,
      hydrationPolicy: performanceProfile.hydrationPolicy
    },
    kernelBoundary: componentContractV2.rmt.kernelBoundary
  };
  const values = {
    tag: plan.input.tag,
    name: plan.input.name,
    className: plan.input.className,
    profilesCsv: plan.input.profiles.join(', '),
    profilesJson: plan.input.profiles.map((profile) => JSON.stringify(profile)).join(', '),
    featuresCsv: plan.input.features.join(', '),
    stateKeyPrefix: `xtend.component.${plan.input.tag}.`,
    manifestPatchSchema: manifestPatchPlan.schema,
    manifestOperation: manifestPatchPlan.operation,
    manifestSource: manifestPatchPlan.source,
    manifestImportMode: manifestPatchPlan.importMode,
    manifestLoaderMode: manifestPatchPlan.loaderMode,
    manifestHydrationMode: manifestPatchPlan.hydrationMode,
    manifestLocalImportOnly: String(manifestPatchPlan.localImportOnly),
    manifestCdnAllowed: String(manifestPatchPlan.cdnAllowed),
    fixtureScriptPath: hydrationWiring.fixture.scriptPath,
    fixtureResultName,
    hydrationStateAttribute: hydrationWiring.component.stateAttribute,
    featureWiringSchema: featureWiring.schema,
    featureStatePrefix: featureWiring.state.prefix,
    featureStateKeysJson: toJsonArray(featureWiring.state.keys),
    featureEventsJson: toJsonArray(featureWiring.events.names),
    featureApiNamespacesJson: toJsonArray(featureWiring.api.namespaces),
    featureManifestJson: JSON.stringify(featureManifest, null, 2),
    featureStateRows: toMarkdownRows(featureWiring.state.keys, 'kanonischer xstate-Key'),
    featureEventRows: toMarkdownRows(featureWiring.events.names, 'Custom Event, bubbles/composed'),
    featureApiRows: toMarkdownRows(featureWiring.api.namespaces, 'bevorzugter XTend-Namespace'),
    featureReviewRules: toBulletList(featureWiring.reviewRules),
    componentPrimaryEventName: featureWiring.events.names[0] || `${plan.input.name}-changed`,
    featureEventTypeUnion: toTypeUnion(featureWiring.events.names),
    featureLocalUiPolicy: featureWiring.state.localUiPolicy,
    featureForbiddenGlobalsCsv: featureWiring.api.forbiddenGlobals.join(', '),
    featureStateForbiddenCsv: featureWiring.state.forbidden.join(', '),
    a11yProfileSchema: a11yProfile.schema,
    a11yPlanSchema: a11yProfile.planSchema,
    a11yComponentContractSchema: a11yProfile.componentContract,
    a11yTestContractSchema: a11yProfile.testContract,
    a11yRole: a11yProfile.role,
    a11yPrimaryProfile: a11yProfile.primaryProfile,
    a11yAccessibleNameSource: a11yAccessibleName.source,
    a11yAccessibleNameDefault: a11yAccessibleName.defaultText,
    a11yAccessibleNameRequired: String(a11yAccessibleName.required === true),
    a11yFocusMode: a11yFocusStrategy.mode,
    a11yFocusInitial: a11yFocusStrategy.initial,
    a11yFocusTrap: toBooleanLiteral(a11yFocusStrategy.trap),
    a11yFocusRestore: toBooleanLiteral(a11yFocusStrategy.restore),
    a11yFocusVisible: a11yFocusStrategy.focusVisible,
    a11yKeyboardCsv: (a11yProfile.keyboard || []).join(', '),
    a11yKeyboardRows: toMarkdownRows(a11yProfile.keyboard, 'Tastaturpflicht aus A11y-Profil'),
    a11yKeyboardTypeUnion: toTypeUnion(a11yProfile.keyboard),
    a11yAriaStateCsv: (a11yProfile.ariaStates || []).join(', '),
    a11yAriaStateRows: toMarkdownRows(a11yProfile.ariaStates, 'ARIA-State oder Semantikpflicht'),
    a11yAriaStateTypeUnion: toTypeUnion(a11yProfile.ariaStates),
    a11yScreenreaderLiveRegion: a11yScreenreader.liveRegion,
    a11yScreenreaderSignalsCsv: (a11yScreenreader.signals || []).join(', '),
    a11yScreenreaderContractSchema: a11yScreenreader.contract || a11yScreenreaderSignalContract.schema || '',
    a11yScreenreaderSignalRecordSchema: a11yScreenreader.signalRecordContract || '',
    a11yScreenreaderSignalNamesCsv: (a11yScreenreader.signals || []).join(', '),
    a11yScreenreaderSignalTypeUnion: toTypeUnion(a11yScreenreader.signals || []),
    a11yScreenreaderSignalRows: toSignalRows(a11yScreenreaderSignalContract),
    a11yScreenreaderStatusRegionsCsv: toRegionCsv(a11yScreenreaderSignalContract.statusRegions || []),
    a11yScreenreaderErrorRegionsCsv: toRegionCsv(a11yScreenreaderSignalContract.errorRegions || []),
    a11yScreenreaderFabricLane: a11yScreenreaderFabric.lane || '',
    a11yScreenreaderFabricFiberKind: a11yScreenreaderFabric.fiberKind || '',
    a11yScreenreaderFabricScheduleRef: a11yScreenreaderFabric.scheduleRef || '',
    a11yScreenreaderAnnouncementRequired: String(a11yScreenreader.announcementRequired === true),
    a11yMotionReducedMotion: a11yMotion.reducedMotion,
    a11yMotionContractSchema: a11yMotion.contract || '',
    a11yMotionMediaQuery: a11yMotion.mediaQuery || '',
    a11yMotionAnimationPolicy: a11yMotion.animationPolicy || '',
    a11yMotionRequiredCssCsv: (a11yMotion.requiredCss || []).join(', '),
    a11yContrastFocusVisible: a11yContrast.focusVisible,
    a11yContrastNonColorStatus: a11yContrast.nonColorStatus,
    a11yContrastContractSchema: a11yContrast.contract || '',
    a11yContrastHighContrast: a11yContrast.highContrast || '',
    a11yContrastMediaQuery: a11yContrast.mediaQuery || '',
    a11yContrastPolicy: a11yContrast.contrastPolicy || '',
    a11yContrastForcedColorAdjust: a11yContrast.forcedColorAdjust || '',
    a11yContrastRequiredCssCsv: (a11yContrast.requiredCss || []).join(', '),
    a11yMotionContrastContractSchema: a11yMotionContrast.contract || a11yMotionContrastPolicy.schema || '',
    a11yMotionContrastTestContractSchema: a11yMotionContrast.testContract || (a11yMotionContrastPolicy.testPlan ? a11yMotionContrastPolicy.testPlan.schema : ''),
    a11yMotionContrastFabricLane: a11yMotionContrastFabric.lane || '',
    a11yMotionContrastFabricFiberKind: a11yMotionContrastFabric.fiberKind || '',
    a11yMotionContrastFabricScheduleRef: a11yMotionContrastFabric.scheduleRef || '',
    a11yMotionContrastPolicyJson: JSON.stringify(a11yMotionContrastPolicy, null, 6),
    a11yMotionContrastManifestJson: JSON.stringify(a11yMotionContrastPolicy, null, 2),
    a11yTestRefsCsv: (a11yProfile.testRefs || []).join(', '),
    a11yRequiredFixtureAttributesCsv: (a11yScaffold.requiredFixtureAttributes || []).join(', '),
    a11yReviewRules: toBulletList(a11yProfile.reviewRules),
    a11yProfileJson: JSON.stringify(a11yProfile, null, 6),
    a11yManifestJson: JSON.stringify(a11yProfile, null, 2),
    a11yScreenreaderManifestJson: JSON.stringify(a11yScreenreaderSignalContract, null, 2),
    performanceProfileSchema: performanceProfile.schema,
    performancePolicySchema: performanceProfile.policySchema,
    performanceBudgetMatrixSchema: performanceProfile.budgetMatrix,
    performanceMeasurementContract: performanceProfile.measurementContract,
    performanceRegressionGate: performanceProfile.regressionGate,
    performanceHydrationPolicyContract: performanceProfile.hydrationPolicyContract,
    performancePrimaryProfile: performanceProfile.primaryProfile,
    performanceBudgetClass: performanceProfile.budgetClass,
    performanceLane: performanceProfile.lane,
    performanceHydrationPolicy: performanceProfile.hydrationPolicy,
    performanceCriticalMeasurementsCsv: (performanceProfile.criticalMeasurements || []).join(', '),
    performanceCriticalMeasurementsRows: toMarkdownRows(performanceProfile.criticalMeasurements, 'kritischer Messpunkt aus Performance Policy'),
    performanceRequiredGatesCsv: (performanceScaffold.requiredGates || []).join(', '),
    performanceAuthorGuide: performanceScaffold.authorGuide,
    performanceBudgetMatrixPath: performanceScaffold.budgetMatrix,
    performanceIdleOrBackgroundAllowed: toBooleanLiteral(performanceProfile.idleOrBackgroundAllowed),
    performanceRequiresA11yFiber: toBooleanLiteral(performanceProfile.requiresA11yFiber),
    performanceReviewRules: toBulletList(performanceProfile.reviewRules),
    performanceProfileJson: JSON.stringify(performanceProfile, null, 6),
    performanceManifestJson: JSON.stringify(performanceProfile, null, 2),
    typeContractSchema: typingContract.schema,
    typeRuntimeBoundary: typingContract.runtimeBoundary,
    typeAttributeNameUnion: toTypeUnion(typingContract.attributes.map((entry) => entry.name)),
    typePropertyNameUnion: toTypeUnion(typingContract.properties.map((entry) => entry.name)),
    typeAttributeMapFields: toInterfaceFields(typingContract.attributes, '// no public attributes declared'),
    typePropertyMapFields: toInterfaceFields(typingContract.properties, '// no public properties declared'),
    typeEventOverloads: toEventOverloads(typingContract.events, plan.input.className),
    typeAttributeRows: toTypeRows(typingContract.attributes, 'oeffentliches Attribut im .d.ts Contract'),
    typePropertyRows: toTypeRows(typingContract.properties, 'explizite Property im .d.ts Contract'),
    typeReviewRules: toBulletList(typingContract.reviewRules),
    typeExceptionPolicy: typingContract.exceptionPolicy.allowed,
    typeRmtAttachmentSchema: rmtAttachment.schema,
    typeRmtAdapter: rmtAttachment.adapter,
    typeRmtRouterAdapter: rmtAttachment.routerAdapter,
    typeRmtKernelBoundary: rmtAttachment.kernelBoundary,
    typeRmtDomainsCsv: (rmtAttachment.dslDomains || []).join(', '),
    typeRmtComponentContractVersion: rmtAttachment.contractVersion || 'xtend.rmt.component-contract.v1',
    typeRmtTemplateAuthoringContractVersion: templateAuthoring.contractVersion || 'xtend.rmt.template-authoring.v1',
    typeRmtTemplateAdapter: templateAuthoring.adapter || 'xtend.template',
    typeRmtTemplateRef: templateAuthoring.templateRef || '',
    typeRmtTemplateComponentRef: templateAuthoring.componentRef || '',
    typeRmtTemplateAllowedModesUnion: toTypeUnion(templateAuthoring.allowedModes || []),
    typeRmtTemplateKernelBoundary: templateAuthoring.kernelBoundary || '',
    typeRmtRootHandshakeContractVersion: rootLifecycleAttachment.contractVersion || 'xtend.rmt.root-handshake.v1',
    typeRmtRootRef: rootLifecycleAttachment.rootRef || '',
    typeRmtRootPhasesUnion: toTypeUnion(rootLifecycleAttachment.phaseSequence || []),
    typeRmtRootKernelBoundary: rootLifecycleAttachment.kernelBoundary || '',
    typeRmtHostCapabilitiesContractVersion: hostCapabilitiesAttachment.contractVersion || 'xtend.rmt.host-capabilities.v1',
    typeRmtHostCapabilityNameUnion: toTypeUnion(hostCapabilityNames),
    typeRmtHostRequiredCapabilitiesCsv: (hostCapabilitiesAttachment.requiredCapabilities || []).join(', '),
    typeRmtHostOptionalCapabilitiesCsv: (hostCapabilitiesAttachment.optionalCapabilities || []).join(', '),
    typeRmtHostKernelBoundary: hostCapabilitiesAttachment.kernelBoundary || '',
    typeRmtHostManifestSource: hostCapabilitiesAttachment.capabilities && hostCapabilitiesAttachment.capabilities.manifest ? hostCapabilitiesAttachment.capabilities.manifest.source : '',
    typeRmtHostStateBridge: hostCapabilitiesAttachment.capabilities && hostCapabilitiesAttachment.capabilities.stateBridge ? hostCapabilitiesAttachment.capabilities.stateBridge.subscribe : '',
    typeRmtHostApiNamespaceRoot: hostCapabilitiesAttachment.capabilities && hostCapabilitiesAttachment.capabilities.api ? hostCapabilitiesAttachment.capabilities.api.namespaceRoot : '',
    rmtCompatibilitySchema: rmtCompatibility.schema || 'xtend.scaffold.rmt-compatibility-binding.v1',
    rmtCompatibilityContractRefsCsv: Object.keys(compatibilityContractRefs).map((key) => `${key}: ${compatibilityContractRefs[key]}`).join(', '),
    rmtCompatibilityArtifactsCsv: Object.keys(compatibilityArtifactBinding).map((key) => `${key}: ${compatibilityArtifactBinding[key]}`).join(', '),
    rmtCompatibilityDryRunSurfacesCsv: (rmtCompatibility.dryRunSurfaces || []).join(', '),
    rmtCompatibilityMinimumGate: rmtCompatibility.verification ? rmtCompatibility.verification.minimumGate : '',
    rmtCompatibilityFullGate: rmtCompatibility.verification ? rmtCompatibility.verification.fullGate : '',
    rmtCompatibilityBoundary: rmtCompatibility.boundaries ? `typesOnly=${rmtCompatibility.boundaries.typesOnly}; noRuntimeImports=${rmtCompatibility.boundaries.noRuntimeImports}; noProductiveWrites=${rmtCompatibility.boundaries.noProductiveWrites}; noRmtKernelCoupling=${rmtCompatibility.boundaries.noRmtKernelCoupling}` : '',
    rmtCompatibilityManifestJson: JSON.stringify({
      schema: rmtCompatibility.schema,
      status: rmtCompatibility.status,
      artifactBinding: rmtCompatibility.artifactBinding,
      contractRefs: rmtCompatibility.contractRefs,
      adapterRefs: rmtCompatibility.adapterRefs,
      dryRunSurfaces: rmtCompatibility.dryRunSurfaces,
      manifestPlanRequirements: rmtCompatibility.manifestPlanRequirements,
      previewPlanRequirements: rmtCompatibility.previewPlanRequirements,
      extensionPlanRequirements: rmtCompatibility.extensionPlanRequirements,
      verification: rmtCompatibility.verification,
      boundaries: rmtCompatibility.boundaries
    }, null, 2),
    typeRmtComponentSchedule: rmtAttachment.componentDefinition ? rmtAttachment.componentDefinition.schedule : '',
    typeRmtRouteFieldsUnion: toTypeUnion(rmtAttachment.routeAttachment ? rmtAttachment.routeAttachment.routeFields : []),
    typeManifestJson: JSON.stringify({
      schema: typingContract.schema,
      runtimeBoundary: typingContract.runtimeBoundary,
      artifact: typingContract.artifact,
      declarations: typingContract.declarations,
      rmtAttachment,
      rmtCompatibility
    }, null, 2),
    previewContractSchema: previewContract.schema,
    previewTargetPath: previewContract.artifact.targetPath,
    previewRegistryPath: previewContract.registry.document,
    previewRegistryStatus: previewRegistryEntry.status,
    previewRegistryPurpose: previewRegistryEntry.purpose,
    previewFixtureDocument: previewContract.preview.fixtureDocument,
    previewExternalNetworkAllowed: String(previewContract.preview.externalNetworkAllowed),
    previewSignalRows: toPreviewSignalRows(previewContract),
    previewManifestJson: JSON.stringify({
      schema: previewContract.schema,
      artifact: previewContract.artifact,
      preview: previewContract.preview,
      registry: previewContract.registry,
      verification: previewContract.verification,
      contracts: previewContract.contracts,
      rmtCompatibility: previewCompatibility
    }, null, 2),
    extensionContractSchema: extensionPoints.schema,
    extensionStatus: extensionPoints.status,
    extensionSourceGetter: extensionPoints.integration.sourceStaticGetter,
    extensionManifestKey: extensionPoints.integration.manifestKey,
    extensionRootLifecycleSchema: extensionPoints.rootLifecycle.schema,
    extensionRootLifecycleHooksUnion: toLifecycleHookUnion(extensionPoints),
    extensionHookRows: toExtensionHookRows(extensionPoints),
    extensionTemplateSchema: extensionPoints.templating.schema,
    extensionTemplateAdapter: extensionPoints.templating.adapter,
    extensionTemplateRef: extensionPoints.templating.templateRef,
    extensionTemplateBoundary: extensionPoints.templating.authoringBoundary,
    extensionRenderingSchema: extensionPoints.rendering.schema,
    extensionRenderingMode: extensionPoints.rendering.mode,
    extensionRenderTarget: extensionPoints.rendering.renderTarget,
    extensionScheduleHint: extensionPoints.rendering.scheduleHint,
    extensionRmtComponentAdapter: extensionPoints.rmtBridge.componentAdapter,
    extensionRmtRouterAdapter: extensionPoints.rmtBridge.routerAdapter,
    extensionKernelBoundary: extensionPoints.rmtBridge.kernelBoundary,
    extensionReviewRules: toBulletList(extensionPoints.reviewRules),
    extensionPointsJson: JSON.stringify({
      schema: extensionPoints.schema,
      status: extensionPoints.status,
      rootLifecycle: extensionPoints.rootLifecycle,
      templating: extensionPoints.templating,
      rendering: extensionPoints.rendering,
      schedulerHandshake: extensionPoints.schedulerHandshake,
      hostCapabilities: extensionPoints.hostCapabilities,
      rmtCompatibilityBinding: extensionPoints.rmtCompatibilityBinding,
      rmtBridge: extensionPoints.rmtBridge,
      integration: extensionPoints.integration,
      boundaries: extensionPoints.boundaries
    }, null, 6),
    extensionManifestJson: JSON.stringify({
      schema: extensionPoints.schema,
      status: extensionPoints.status,
      rootLifecycle: extensionPoints.rootLifecycle,
      templating: extensionPoints.templating,
      rendering: extensionPoints.rendering,
      schedulerHandshake: extensionPoints.schedulerHandshake,
      hostCapabilities: extensionPoints.hostCapabilities,
      rmtCompatibilityBinding: extensionPoints.rmtCompatibilityBinding,
      rmtBridge: extensionPoints.rmtBridge,
      boundaries: extensionPoints.boundaries
    }, null, 2),
    typescriptComponentBlueprintSchema: TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA,
    componentContractV2Schema: COMPONENT_CONTRACT_V2_SCHEMA,
    componentContractV2ReportSchema: COMPONENT_CONTRACT_REPORT_V2_SCHEMA,
    componentContractV2Valid: toBooleanLiteral(componentContractV2Report.ok),
    componentContractV2Json: JSON.stringify(componentContractV2, null, 6),
    componentContractV2ManifestJson: JSON.stringify(componentContractV2, null, 2),
    componentContractV2ErrorsJson: JSON.stringify(componentContractV2Report.errors || []),
    tsSourceStrategySchema: TYPESCRIPT_SOURCE_STRATEGY_SCHEMA,
    tsSourcePath: componentContractV2.source.sourcePath,
    tsContractPath: componentContractV2.source.contractPath,
    tsRmtMetadataPath: componentContractV2.source.rmtMetadataPath,
    tsA11yProfilePath: componentContractV2.source.a11yProfilePath,
    tsPerformanceProfilePath: componentContractV2.source.performanceProfilePath,
    tsFixtureDataPath: componentContractV2.source.fixtureDataPath,
    tsRuntimeArtifactPath: componentContractV2.runtime.artifact,
    tsDeclarationArtifactPath: componentContractV2.runtime.declaration,
    componentLifecycleTelemetrySchema: COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA,
    componentFabricLaneIngestionSchema: COMPONENT_FABRIC_LANE_INGESTION_SCHEMA,
    componentTelemetryOperationsJson: toJsonArray(componentLifecycleOperations),
    componentTelemetryOperationsUnion: toTypeUnion(componentLifecycleOperations),
    rmtComponentMetadataJson: JSON.stringify(rmtComponentMetadata, null, 6),
    rmtComponentMetadataManifestJson: JSON.stringify(rmtComponentMetadata, null, 2)
  };
  const files = [];
  const errors = [];

  plan.artifacts
    .filter((artifact) => RENDERED_ARTIFACTS.includes(artifact.id))
    .forEach((artifact) => {
      const rendered = renderTemplateForArtifact(artifact.id, values);
      if (!rendered.ok) {
        errors.push(rendered.error);
        return;
      }

      files.push({
        id: artifact.id,
        targetPath: artifact.targetPath,
        action: artifact.action,
        templateId: rendered.template.id,
        templatePath: rendered.template.path,
        content: rendered.content
      });
    });

  if (errors.length > 0) {
    return {
      schema: COMPONENT_FILES_SCHEMA,
      ok: false,
      mode: 'dry-run',
      errors,
      files,
      exceptions: []
    };
  }

  const rootDir = getRootDir(input);
  const manifestArtifact = files.find((file) => file.id === 'manifest') || null;
  const manifestPatch = createManifestPatchEntry({
    rootDir,
    patchPlan: manifestPatchPlan,
    targetPath: manifestArtifact ? manifestArtifact.targetPath : manifestWiring.loader.target,
    tag: plan.input.tag,
    templateId: manifestArtifact ? manifestArtifact.templateId : null,
    templatePath: manifestArtifact ? manifestArtifact.templatePath : null
  });
  if (!manifestPatch.ok) {
    return {
      schema: COMPONENT_FILES_SCHEMA,
      ok: false,
      mode: toFlagBoolean(input.write) ? 'write' : (toFlagBoolean(input.check) ? 'check' : 'dry-run'),
      errors: manifestPatch.errors,
      files,
      patches: [],
      exceptions: []
    };
  }

  const patchedWriteEntries = createComponentWriteEntries(files, manifestPatch.entry, null);
  const buildReport = createComponentBuildReportEntry({
    tag: plan.input.tag,
    input: plan.input,
    files,
    writeEntries: patchedWriteEntries,
    patches: [manifestPatch.patch],
    generator: 'component-files',
    owner: `component-files:${plan.input.tag}`
  });
  if (!buildReport.ok) {
    return {
      schema: COMPONENT_FILES_SCHEMA,
      ok: false,
      mode: toFlagBoolean(input.write) ? 'write' : (toFlagBoolean(input.check) ? 'check' : 'dry-run'),
      errors: buildReport.errors,
      files,
      patches: [manifestPatch.patch],
      exceptions: []
    };
  }

  const writeEntries = createComponentWriteEntries(files, manifestPatch.entry, buildReport.entry);
  const result = {
    schema: COMPONENT_FILES_SCHEMA,
    ok: true,
    mode: toFlagBoolean(input.write) ? 'write' : (toFlagBoolean(input.check) ? 'check' : 'dry-run'),
    generator: 'component-files',
    writeStrategy: plan.writeStrategy,
    input: plan.input,
    wiring: {
      manifest: manifestWiring,
      hydration: hydrationWiring,
      features: featureWiring,
      typing: typingContract,
      preview: previewContract,
      extensions: extensionPoints,
      a11y: a11yProfile,
      performance: performanceProfile,
      componentContractV2,
      componentContractV2Report,
      typescript: {
        schema: TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA,
        sourceStrategy: TYPESCRIPT_SOURCE_STRATEGY_SCHEMA,
        contract: COMPONENT_CONTRACT_V2_SCHEMA,
        sourceFiles: [
          componentContractV2.source.sourcePath,
          componentContractV2.source.contractPath,
          componentContractV2.source.rmtMetadataPath,
          componentContractV2.source.a11yProfilePath,
          componentContractV2.source.performanceProfilePath,
          componentContractV2.source.fixtureDataPath
        ],
        runtimeOutput: componentContractV2.runtime.artifact,
        declarationOutput: componentContractV2.runtime.declaration,
        localGate: 'node scripts/run_xtend_tests.js builder-typescript-blueprint --json'
      }
    },
    rmtCompatibility: extensionPoints.rmtCompatibilityBinding || previewCompatibility || rmtCompatibility,
    files,
    patches: [manifestPatch.patch],
    buildReport: buildReport.report,
    buildReportPath: buildReport.entry.targetPath,
    exceptions: [],
    nextStep: 'Review rendered TypeScript, A11y, Performance, RMT and Contract v2 files before productive writes; WP-E10-08 can now select the first P0 component wave.'
  };

  if (!toFlagBoolean(input.write) && !toFlagBoolean(input.check)) {
    return result;
  }

  const writeReport = writeScaffoldFiles(writeEntries, {
    rootDir,
    write: toFlagBoolean(input.write),
    check: toFlagBoolean(input.check),
    force: toFlagBoolean(input.force),
    generator: 'component-files',
    owner: `component-files:${plan.input.tag}`
  });

  return {
    ...result,
    ok: writeReport.ok,
    status: writeReport.status,
    errors: writeReport.errors,
    writePlan: writeReport.plan,
    written: writeReport.writes,
    ownershipManifest: writeReport.ownershipManifest
  };
}

module.exports = {
  COMPONENT_FILES_SCHEMA,
  RENDERED_ARTIFACTS,
  createComponentFiles
};

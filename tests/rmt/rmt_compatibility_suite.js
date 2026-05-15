const path = require('path');
const vm = require('vm');
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
<<<<<<< HEAD
=======
const {
  readBestcaseVNextDemo
} = require('../utils/rmt-bestcase');
>>>>>>> 52a69eb (Updated RMT Best Case demo to new RMT vNext syntax)

const RMT_COMPATIBILITY_SCHEMA = 'xtend.scaffold.rmt-compatibility-binding.v1';
const TEMPLATE_PILOT_FLOW_SCHEMA = 'xtend.rmt.template-pilot-flow.v1';
const UPSTREAM_HANDOFF_SCHEMA = 'xtend.rmt.upstream-handoff.v1';
const DSL_NORMALIZATION_SCHEMA = 'xtend.rmt.dsl-normalization.v1';
const RUNTIME_REGISTRY_SCHEMA = 'xtend.rmt.runtime-registry.v1';
const XROUTER_ADAPTER_SCHEMA = 'xtend.rmt.xrouter-adapter.v1';
const XTEND_COMPONENT_ADAPTER_SCHEMA = 'xtend.rmt.xtend-component-adapter.v1';
const STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_SCHEMA = 'xtend.rmt.state-scheduler-diagnostics-bridge.v1';
const ARTIFACT_PARITY_SCHEMA = 'xtend.rmt.artifact-parity.v1';
const WP15_NATIVE_BRIDGE_FIXTURE_SCHEMA = 'xtend.rmt.wp15.native-bridge-fixture.v1';
const WP16_BROWSER_SMOKE_FIXTURE_SCHEMA = 'xtend.rmt.wp16.browser-smoke-fixture.v1';
const HOST_ADAPTER_LIFECYCLE_SCHEMA = 'xtend.rmt.host-adapter-lifecycle.v1';
const ADAPTER_REGISTRY_SCHEMA = 'xtend.rmt.adapter-registry.v1';
const ADAPTERS_DOMAIN_SCHEMA = 'xtend.rmt.adapters-domain.v1';
const COMPONENTS_DOMAIN_SCHEMA = 'xtend.rmt.components-domain.v1';
const ROUTES_DOMAIN_SCHEMA = 'xtend.rmt.routes-domain.v1';
const SCHEDULES_DOMAIN_SCHEMA = 'xtend.rmt.schedules-domain.v1';
const REQUIRED_RMT_CONTRACTS = [
  'xtend.rmt.component-contract.v1',
  'xtend.rmt.template-authoring.v1',
  'xtend.rmt.root-handshake.v1',
  'xtend.rmt.host-capabilities.v1'
];
const REQUIRED_SURFACES = [
  'typing',
  'manifest-plan',
  'preview-plan',
  'extension-points',
  'component-files'
];
const MINIMUM_GATE = 'node scripts/run_xtend_tests.js rmt-compatibility --json';
const SCENARIOS = [
  { tag: 'x-example', profile: 'routing', feature: 'state' },
  { tag: 'x-rmt-card', profile: 'stateful', feature: 'events' }
];

function clearRequire(relativePath, rootDir) {
  const absolutePath = resolveRepoPath(relativePath, rootDir);
  delete require.cache[require.resolve(absolutePath)];
  return require(absolutePath);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function parseRenderedManifest(context, files, label) {
  const manifestFile = files.files.find((file) => file.id === 'manifest');
  if (!context.assert(Boolean(manifestFile), `${label}: manifest artifact is rendered`)) {
    return null;
  }

  try {
    const parsed = JSON.parse(manifestFile.content);
    context.pass(`${label}: rendered manifest plan parses as JSON`);
    return parsed;
  } catch (error) {
    context.fail(`${label}: rendered manifest plan parses as JSON (${error.message})`);
    return null;
  }
}

function createRmtAppModulesFromArtifact(context, rootDir, artifactPath, options = {}) {
  const label = options.label || artifactPath;
  const source = readText(artifactPath, rootDir);
  const cjsCompatibleSource = artifactPath.endsWith('.esm.js')
    ? source.replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default XtendRmtProduct;\s*$/u, '')
    : source;
  function CustomEvent(type, init = {}) {
    this.type = type;
    this.detail = init.detail || null;
    this.bubbles = init.bubbles === true;
    this.composed = init.composed === true;
  }
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    performance: { now: () => 0 },
    navigator: { userAgent: 'xtend-test' },
    CustomEvent,
    document: {
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return true;
      },
      createElement(tagName) {
        return {
          tagName: String(tagName || '').toUpperCase(),
          attributes: {},
          children: [],
          setAttribute(name, value) {
            this.attributes[name] = String(value);
          },
          appendChild(child) {
            this.children.push(child);
            return child;
          }
        };
      }
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;

  try {
    vm.runInNewContext(cjsCompatibleSource, sandbox, {
      filename: artifactPath
    });
  } catch (error) {
    context.fail(`${label} evaluates for RMT runtime probe (${error.message})`);
    return null;
  }

  if (!context.assert(sandbox.AppModules && typeof sandbox.AppModules === 'object', `${label} exposes AppModules for RMT probes`)) {
    return null;
  }
  return sandbox.AppModules;
}

function createRmtAppModulesFromBundle(context, rootDir) {
  return createRmtAppModulesFromArtifact(context, rootDir, 'xtendrmt/rmt-core.esm.js', {
    label: 'RMT core bundle'
  });
}

function createRmtRuntimeAppModulesFromBundle(context, rootDir) {
  return createRmtAppModulesFromArtifact(context, rootDir, 'xtendrmt/rmt-runtime.esm.js', {
    label: 'RMT runtime ESM bundle'
  });
}

function createRmtBrowserAppModulesFromBundle(context, rootDir) {
  return createRmtAppModulesFromArtifact(context, rootDir, 'xtendrmt/rmt-runtime.browser.js', {
    label: 'RMT browser runtime bundle'
  });
}

function createRmtFormatFromBundle(context, rootDir) {
  const appModules = createRmtAppModulesFromBundle(context, rootDir);
  if (!appModules) return null;
  const factory = appModules.createRmtFormat;
  if (!context.assert(typeof factory === 'function', 'RMT core bundle exposes createRmtFormat for DSL normalization probe')) {
    return null;
  }
  return factory();
}

function assertBindingShape(context, binding, label) {
  const acceptedStatuses = [
    'dry-run-contract-binding',
    'preview-bound-to-rmt-compatibility',
    'extension-bound-to-rmt-compatibility'
  ];

  context.assert(binding && binding.schema === RMT_COMPATIBILITY_SCHEMA, `${label}: binding exposes stable schema`);
  context.assert(binding && acceptedStatuses.includes(binding.status), `${label}: binding exposes accepted compatibility status`);
  assertIncludesAll(context, binding && binding.dryRunSurfaces, REQUIRED_SURFACES, `${label}: dry-run surfaces`);

  const contractRefs = binding && binding.contractRefs ? binding.contractRefs : {};
  context.assert(contractRefs.component === 'xtend.rmt.component-contract.v1', `${label}: component contract ref is stable`);
  context.assert(contractRefs.templateAuthoring === 'xtend.rmt.template-authoring.v1', `${label}: template authoring contract ref is stable`);
  context.assert(contractRefs.rootHandshake === 'xtend.rmt.root-handshake.v1', `${label}: root handshake contract ref is stable`);
  context.assert(contractRefs.hostCapabilities === 'xtend.rmt.host-capabilities.v1', `${label}: host capabilities contract ref is stable`);

  const adapterRefs = binding && binding.adapterRefs ? binding.adapterRefs : {};
  context.assert(adapterRefs.component === 'xtend.component', `${label}: component adapter ref is XTend component`);
  context.assert(adapterRefs.template === 'xtend.template', `${label}: template adapter ref is XTend template`);
  context.assert(adapterRefs.router === 'xtend.xrouter', `${label}: router adapter ref is XRouter`);

  const boundaries = binding && binding.boundaries ? binding.boundaries : {};
  context.assert(boundaries.noRuntimeImports === true, `${label}: boundary rejects runtime imports`);
  context.assert(boundaries.noProductiveWrites === true, `${label}: boundary rejects productive writes`);
  context.assert(boundaries.noRmtKernelCoupling === true, `${label}: boundary rejects RMT kernel coupling`);
  context.assert(boundaries.noRouterRegistration === true, `${label}: boundary rejects router registration`);
  context.assert(boundaries.noTemplateParsing === true, `${label}: boundary rejects template parsing`);
  context.assert(boundaries.bridgeRuntime === 'reserved-for-Epic-05', `${label}: bridge runtime remains reserved for Epic 05`);
}

function assertTypingPreviewExtensionScenario(context, modules, input) {
  const label = `${input.tag}/${input.profile}/${input.feature}`;
  const typing = modules.typing.createComponentTypingContract(input);
  const preview = modules.preview.createComponentPreviewContract(input);
  const extensions = modules.extensions.createComponentExtensionPoints(input);
  const files = modules.files.createComponentFiles(input);

  context.assert(typing.ok === true, `${label}: typing contract validates`);
  context.assert(preview.ok === true, `${label}: preview contract validates`);
  context.assert(extensions.ok === true, `${label}: extension contract validates`);
  context.assert(files.ok === true, `${label}: component files contract validates`);

  assertBindingShape(context, typing.rmtCompatibility, `${label}: typing`);
  assertBindingShape(context, preview.rmtCompatibility, `${label}: preview`);
  assertBindingShape(context, extensions.rmtCompatibilityBinding, `${label}: extensions`);
  assertBindingShape(context, files.rmtCompatibility, `${label}: component-files`);

  context.assert(
    typing.rmtCompatibility && typing.rmtCompatibility.verification && typing.rmtCompatibility.verification.minimumGate === MINIMUM_GATE,
    `${label}: typing compatibility points to dedicated RMT compatibility gate`
  );
  context.assert(
    preview.rmtCompatibility && preview.rmtCompatibility.verification && preview.rmtCompatibility.verification.minimumGate === MINIMUM_GATE,
    `${label}: preview compatibility points to dedicated RMT compatibility gate`
  );
  context.assert(
    extensions.rmtCompatibilityBinding && extensions.rmtCompatibilityBinding.verification && extensions.rmtCompatibilityBinding.verification.minimumGate === MINIMUM_GATE,
    `${label}: extension compatibility points to dedicated RMT compatibility gate`
  );

  const manifestPlan = parseRenderedManifest(context, files, label);
  if (manifestPlan) {
    assertBindingShape(context, manifestPlan.rmtCompatibility, `${label}: manifest`);
    context.assert(
      manifestPlan.typing && manifestPlan.typing.rmtCompatibility && manifestPlan.typing.rmtCompatibility.schema === RMT_COMPATIBILITY_SCHEMA,
      `${label}: manifest embeds typing compatibility binding`
    );
    context.assert(
      manifestPlan.preview && manifestPlan.preview.rmtCompatibility && manifestPlan.preview.rmtCompatibility.schema === RMT_COMPATIBILITY_SCHEMA,
      `${label}: manifest embeds preview compatibility binding`
    );
    context.assert(
      manifestPlan.extensions && manifestPlan.extensions.rmtCompatibilityBinding && manifestPlan.extensions.rmtCompatibilityBinding.schema === RMT_COMPATIBILITY_SCHEMA,
      `${label}: manifest embeds extension compatibility binding`
    );
    context.assert(manifestPlan.localImportOnly === true, `${label}: manifest plan stays local import only`);
    context.assert(manifestPlan.cdnAllowed === false, `${label}: manifest plan rejects CDN usage`);
  }

  const typesFile = files.files.find((file) => file.id === 'types');
  const docsFile = files.files.find((file) => file.id === 'docs');
  const demoFile = files.files.find((file) => file.id === 'demo');
  const sourceFile = files.files.find((file) => file.id === 'component');

  context.assert(typesFile && typesFile.content.includes('RmtCompatibilityBinding'), `${label}: types artifact declares compatibility binding`);
  context.assert(typesFile && !typesFile.content.includes("from '") && !typesFile.content.includes('from "'), `${label}: types artifact has no runtime imports`);
  context.assert(docsFile && docsFile.content.includes('RMT-Kompatibilitaets-Binding'), `${label}: docs artifact documents compatibility binding`);
  context.assert(demoFile && demoFile.content.includes(MINIMUM_GATE), `${label}: preview plan documents RMT compatibility gate`);
  context.assert(sourceFile && !sourceFile.content.includes('window.show'), `${label}: generated source avoids unnamespaced global helpers`);
  context.assert(
    files.files.filter((file) => file.id !== 'tests').every((file) => !file.content.includes('https://') && !file.content.includes('http://')),
    `${label}: generated non-test artifacts avoid external URLs`
  );
}

function assertRmtSchemaAndDemo(context, rootDir) {
  const schema = readJson('xtendrmt/rmt.schema.json', rootDir);
  const manifest = readJson('xtendrmt/rmt-manifest.json', rootDir);
<<<<<<< HEAD
  const demo = readJson('xtendrmt/xtendrmt-bestcase-demo.rmt', rootDir);
=======
  const bestcaseDemo = readBestcaseVNextDemo(rootDir);
  const demo = bestcaseDemo.projection;
  const demoCore = bestcaseDemo.core;
  const demoSource = bestcaseDemo.source;
>>>>>>> 52a69eb (Updated RMT Best Case demo to new RMT vNext syntax)
  const demoJs = readText('xtendrmt/xtendrmt-bestcase-demo.js', rootDir);
  const demoHtml = readText('xtendrmt-bestcase.html', rootDir);
  const coreTypes = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const scaffoldBindings = schema['x-xtendrmt'] && schema['x-xtendrmt'].scaffoldCompatibilityBindings;
  const pilotModels = schema['x-xtendrmt'] && schema['x-xtendrmt'].templatePilotFlowModels;
  const hostAdapterLifecycleContracts = schema['x-xtendrmt'] && schema['x-xtendrmt'].hostAdapterLifecycleContracts;
  const adapterRegistryContracts = schema['x-xtendrmt'] && schema['x-xtendrmt'].adapterRegistryContracts;
  const nativeDomainContracts = schema['x-xtendrmt'] && schema['x-xtendrmt'].nativeDomainContracts;
  const dslNormalizationContracts = schema['x-xtendrmt'] && schema['x-xtendrmt'].dslNormalizationContracts;
  const runtimeRegistryContracts = schema['x-xtendrmt'] && schema['x-xtendrmt'].runtimeRegistryContracts;
  const xrouterAdapterContracts = schema['x-xtendrmt'] && schema['x-xtendrmt'].xrouterAdapterContracts;
  const xtendComponentAdapterContracts = schema['x-xtendrmt'] && schema['x-xtendrmt'].xtendComponentAdapterContracts;
  const stateSchedulerDiagnosticsBridgeContracts = schema['x-xtendrmt'] && schema['x-xtendrmt'].stateSchedulerDiagnosticsBridgeContracts;
  const artifactParityContracts = schema['x-xtendrmt'] && schema['x-xtendrmt'].artifactParityContracts;
  const upstreamHandoff = schema['x-xtendrmt'] && schema['x-xtendrmt'].upstreamHandoff;
  const schemaBinding = Array.isArray(scaffoldBindings)
    ? scaffoldBindings.find((entry) => entry.id === RMT_COMPATIBILITY_SCHEMA)
    : null;
  const pilotModel = Array.isArray(pilotModels)
    ? pilotModels.find((entry) => entry.id === TEMPLATE_PILOT_FLOW_SCHEMA)
    : null;
  const hostAdapterLifecycle = Array.isArray(hostAdapterLifecycleContracts)
    ? hostAdapterLifecycleContracts.find((entry) => entry.id === HOST_ADAPTER_LIFECYCLE_SCHEMA)
    : null;
  const adapterRegistry = Array.isArray(adapterRegistryContracts)
    ? adapterRegistryContracts.find((entry) => entry.id === ADAPTER_REGISTRY_SCHEMA)
    : null;
  const adaptersDomain = Array.isArray(nativeDomainContracts)
    ? nativeDomainContracts.find((entry) => entry.id === ADAPTERS_DOMAIN_SCHEMA)
    : null;
  const componentsDomain = Array.isArray(nativeDomainContracts)
    ? nativeDomainContracts.find((entry) => entry.id === COMPONENTS_DOMAIN_SCHEMA)
    : null;
  const routesDomain = Array.isArray(nativeDomainContracts)
    ? nativeDomainContracts.find((entry) => entry.id === ROUTES_DOMAIN_SCHEMA)
    : null;
  const schedulesDomain = Array.isArray(nativeDomainContracts)
    ? nativeDomainContracts.find((entry) => entry.id === SCHEDULES_DOMAIN_SCHEMA)
    : null;
  const dslNormalization = Array.isArray(dslNormalizationContracts)
    ? dslNormalizationContracts.find((entry) => entry.id === DSL_NORMALIZATION_SCHEMA)
    : null;
  const runtimeRegistry = Array.isArray(runtimeRegistryContracts)
    ? runtimeRegistryContracts.find((entry) => entry.id === RUNTIME_REGISTRY_SCHEMA)
    : null;
  const xrouterAdapter = Array.isArray(xrouterAdapterContracts)
    ? xrouterAdapterContracts.find((entry) => entry.id === XROUTER_ADAPTER_SCHEMA)
    : null;
  const xtendComponentAdapter = Array.isArray(xtendComponentAdapterContracts)
    ? xtendComponentAdapterContracts.find((entry) => entry.id === XTEND_COMPONENT_ADAPTER_SCHEMA)
    : null;
  const stateSchedulerDiagnosticsBridge = Array.isArray(stateSchedulerDiagnosticsBridgeContracts)
    ? stateSchedulerDiagnosticsBridgeContracts.find((entry) => entry.id === STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_SCHEMA)
    : null;
  const artifactParity = Array.isArray(artifactParityContracts)
    ? artifactParityContracts.find((entry) => entry.id === ARTIFACT_PARITY_SCHEMA)
    : null;
  const manifestArtifactParity = Array.isArray(manifest.artifactParityContracts)
    ? manifest.artifactParityContracts.find((entry) => entry.id === ARTIFACT_PARITY_SCHEMA)
    : null;
  const adapterDefinition = schema.$defs && schema.$defs.adapter ? schema.$defs.adapter : {};
  const adapterKindDefinition = schema.$defs && schema.$defs.adapterKind ? schema.$defs.adapterKind : {};
  const adaptersProperty = schema.properties && schema.properties.adapters ? schema.properties.adapters : null;
  const componentDefinition = schema.$defs && schema.$defs.component ? schema.$defs.component : {};
  const componentKindDefinition = schema.$defs && schema.$defs.componentKind ? schema.$defs.componentKind : {};
  const componentsProperty = schema.properties && schema.properties.components ? schema.properties.components : null;
  const routeDefinition = schema.$defs && schema.$defs.route ? schema.$defs.route : {};
  const routeParamsDefinition = schema.$defs && schema.$defs.routeParams ? schema.$defs.routeParams : {};
  const routeLifecycleDefinition = schema.$defs && schema.$defs.routeLifecycle ? schema.$defs.routeLifecycle : {};
  const routesProperty = schema.properties && schema.properties.routes ? schema.properties.routes : null;
  const scheduleDefinition = schema.$defs && schema.$defs.schedule ? schema.$defs.schedule : {};
  const scheduleLaneDefinition = schema.$defs && schema.$defs.scheduleLane ? schema.$defs.scheduleLane : {};
  const scheduleBudgetClassDefinition = schema.$defs && schema.$defs.scheduleBudgetClass ? schema.$defs.scheduleBudgetClass : {};
  const scheduleInlineDefinition = schema.$defs && schema.$defs.scheduleInline ? schema.$defs.scheduleInline : {};
  const scheduleRefOrInlineDefinition = schema.$defs && schema.$defs.scheduleRefOrInline ? schema.$defs.scheduleRefOrInline : {};
  const componentScheduleDefinition = schema.$defs && schema.$defs.componentSchedule ? schema.$defs.componentSchedule : {};
  const schedulesProperty = schema.properties && schema.properties.schedules ? schema.properties.schedules : null;
  const examples = Array.isArray(schema.examples) ? schema.examples : [];
  const firstExample = examples[0] || {};
  const demoBinding = demo.manifest && demo.manifest.metadata && demo.manifest.metadata.scaffoldCompatibility;
  const metadata = demo.manifest && demo.manifest.metadata ? demo.manifest.metadata : {};
  const pilotFlow = metadata.pilotFlow || {};
  const pilotAttachment = pilotFlow.componentAttachment || {};
  const adapters = Array.isArray(demo.adapters) ? demo.adapters : [];
  const components = Array.isArray(demo.components) ? demo.components : [];
  const routes = Array.isArray(demo.routes) ? demo.routes : [];
  const schedules = Array.isArray(demo.schedules) ? demo.schedules : [];
  const nativeDemoMigration = metadata.nativeDemoMigration || {};
  const templates = Array.isArray(demo.templates) ? demo.templates : [];
  const templatingRoute = routes.find((route) => route.path === '/templating');
  const templatingRouteComponent = components.find((component) => component.id === 'x-rmt-route-template-pilot');
  const pilotSchedule = schedules.find((schedule) => schedule.id === 'template.visible.inspect');
  const pilotTemplate = templates.find((template) => template.id === 'demo.templating.pilot');
  const pilotAuthoring = pilotTemplate && pilotTemplate.metadata && pilotTemplate.metadata.authoring
    ? pilotTemplate.metadata.authoring
    : {};
  const pilotTemplateAttachment = pilotAuthoring.componentAttachment || {};

<<<<<<< HEAD
=======
  context.assert(demoSource.trimStart().startsWith('template xtendrmt.bestcase.demo'), 'RMT demo authoring source uses vNext template syntax');
  context.assert(!demoSource.trimStart().startsWith('{'), 'RMT demo authoring source is no longer legacy JSON');
  context.assert(demoCore.schema === 'xtend.rmt.core-format.vnext.v1', 'RMT demo has deterministic vNext Core output');
  context.assert(Array.isArray(demoCore.surfaces) && demoCore.surfaces.some((surface) => surface.name === 'templating'), 'RMT demo vNext Core exposes templating surface');
  context.assert(Array.isArray(demoCore.operations) && demoCore.operations.some((operation) => operation.target && operation.target.ref === 'x-rmt-route-template-pilot'), 'RMT demo vNext Core exposes template pilot operation');
>>>>>>> 52a69eb (Updated RMT Best Case demo to new RMT vNext syntax)
  context.assert(Boolean(schemaBinding), 'RMT schema exposes scaffold compatibility binding metadata');
  assertIncludesAll(context, schemaBinding && schemaBinding.surfaces, REQUIRED_SURFACES, 'RMT schema scaffold compatibility surfaces');
  assertIncludesAll(context, schemaBinding && schemaBinding.requiredContracts, REQUIRED_RMT_CONTRACTS, 'RMT schema scaffold required contracts');
  context.assert(schemaBinding && schemaBinding.minimumGate === MINIMUM_GATE, 'RMT schema points scaffold compatibility to dedicated gate');
  context.assert(schemaBinding && schemaBinding.boundary && schemaBinding.boundary.includes('dry-run metadata'), 'RMT schema documents dry-run compatibility boundary');
  context.assert(pilotModel && pilotModel.id === TEMPLATE_PILOT_FLOW_SCHEMA, 'RMT schema exposes template pilot flow model');
  context.assert(pilotModel && pilotModel.templateAdapter === 'xtend.template', 'RMT schema pilot flow uses XTend template adapter data');
  context.assert(pilotModel && pilotModel.componentAdapter === 'xtend.component', 'RMT schema pilot flow uses XTend component attachment data');
  context.assert(pilotModel && pilotModel.minimumGate === MINIMUM_GATE, 'RMT schema pilot flow points to dedicated gate');
  context.assert(pilotModel && pilotModel.bridgeRuntime === 'reserved-for-Epic-05', 'RMT schema pilot flow keeps bridge runtime reserved');
  assertIncludesAll(context, pilotModel && pilotModel.requiredContracts, REQUIRED_RMT_CONTRACTS, 'RMT schema pilot flow required contracts');
  context.assert(hostAdapterLifecycle && hostAdapterLifecycle.status === 'epic-05-wp-02-contract', 'RMT schema exposes host adapter lifecycle contract');
  context.assert(
    hostAdapterLifecycle && hostAdapterLifecycle.sourceOfTruth === 'development/WP-E05-02-Host-Adapter-Contract-und-Adapter-Lifecycle-definieren.md',
    'RMT schema host adapter lifecycle points to WP-02 source of truth'
  );
  assertIncludesAll(
    context,
    hostAdapterLifecycle && hostAdapterLifecycle.adapterKinds,
    ['host_adapter', 'component_adapter', 'router_adapter', 'state_adapter', 'scheduler_adapter'],
    'RMT schema host adapter lifecycle adapter kinds'
  );
  assertIncludesAll(
    context,
    hostAdapterLifecycle && hostAdapterLifecycle.lifecyclePhases,
    ['register', 'negotiate', 'prepare', 'mount', 'hydrate', 'route', 'state', 'schedule', 'diagnose', 'dispose'],
    'RMT schema host adapter lifecycle phases'
  );
  assertIncludesAll(
    context,
    hostAdapterLifecycle && hostAdapterLifecycle.runtimeSurfaces,
    ['esm', 'browser_classic', 'worker', 'server'],
    'RMT schema host adapter lifecycle runtime surfaces'
  );
  assertIncludesAll(
    context,
    Array.isArray(hostAdapterLifecycle && hostAdapterLifecycle.operations)
      ? hostAdapterLifecycle.operations.map((operation) => operation.operation)
      : [],
    ['registerAdapter', 'negotiateCapabilities', 'registerComponent', 'mountComponent', 'hydrateComponent', 'registerRoutes', 'navigate', 'createStateBridge', 'scheduleEndpoint', 'emitDiagnostic', 'disposeAdapter'],
    'RMT schema host adapter lifecycle operations'
  );
  assertIncludesAll(context, hostAdapterLifecycle && hostAdapterLifecycle.minimumGates, [MINIMUM_GATE, 'node scripts/run_xtend_tests.js references --json'], 'RMT schema host adapter lifecycle gates');
  context.assert(
    hostAdapterLifecycle && typeof hostAdapterLifecycle.kernelBoundary === 'string' && hostAdapterLifecycle.kernelBoundary.includes('outside kernel imports'),
    'RMT schema host adapter lifecycle keeps host runtimes outside kernel imports'
  );
  context.assert(coreTypes.includes('RmtHostAdapterDefinition'), 'RMT types expose host adapter definition');
  context.assert(coreTypes.includes('RmtHostAdapterLifecycleContract'), 'RMT types expose host adapter lifecycle contract');
  context.assert(coreTypes.includes('RmtHostAdapterRuntimeBridge'), 'RMT types expose host adapter runtime bridge');
  context.assert(coreTypes.includes('registerAdapter(definition: RmtHostAdapterDefinition'), 'RMT types expose registerAdapter operation');
  context.assert(coreTypes.includes('negotiateCapabilities(requirements: RmtHostAdapterCapabilities'), 'RMT types expose negotiateCapabilities operation');
  context.assert(coreTypes.includes('mountComponent?'), 'RMT types expose mountComponent operation');
  context.assert(coreTypes.includes('hydrateComponent?'), 'RMT types expose hydrateComponent operation');
  context.assert(coreTypes.includes('registerRoutes?'), 'RMT types expose registerRoutes operation');
  context.assert(coreTypes.includes('navigate?'), 'RMT types expose navigate operation');
  context.assert(coreTypes.includes('emitDiagnostic(event: RmtHostAdapterDiagnosticEvent'), 'RMT types expose emitDiagnostic operation');
  context.assert(adapterRegistry && adapterRegistry.status === 'epic-05-wp-03-contract', 'RMT schema exposes adapter registry contract');
  context.assert(
    adapterRegistry && adapterRegistry.sourceOfTruth === 'development/WP-E05-03-Adapter-Registry-und-Capability-Negotiation-modellieren.md',
    'RMT schema adapter registry points to WP-03 source of truth'
  );
  assertIncludesAll(
    context,
    adapterRegistry && adapterRegistry.registryRecordFields,
    ['id', 'kind', 'version', 'runtimeSurface', 'providedCapabilities', 'requiredCapabilities', 'preferredCapabilities', 'lifecycleContract', 'kernelVisible', 'status', 'diagnostics'],
    'RMT schema adapter registry record fields'
  );
  assertIncludesAll(
    context,
    adapterRegistry && adapterRegistry.capabilityRequestFields,
    ['scope', 'adapterKind', 'adapterId', 'requiredCapabilities', 'preferredCapabilities', 'runtimeSurface', 'fallbackPolicy', 'metadata'],
    'RMT schema adapter registry capability request fields'
  );
  assertIncludesAll(
    context,
    adapterRegistry && adapterRegistry.negotiationPhases,
    ['collect', 'normalize', 'match', 'validate', 'select', 'degrade', 'diagnose', 'finalize'],
    'RMT schema adapter registry negotiation phases'
  );
  assertIncludesAll(
    context,
    adapterRegistry && adapterRegistry.negotiationStatuses,
    ['accepted', 'degraded', 'failed', 'skipped'],
    'RMT schema adapter registry negotiation statuses'
  );
  assertIncludesAll(
    context,
    adapterRegistry && adapterRegistry.fallbackPolicies,
    ['fail', 'degrade', 'skip', 'diagnose_only'],
    'RMT schema adapter registry fallback policies'
  );
  assertIncludesAll(
    context,
    adapterRegistry && adapterRegistry.diagnosticCodes,
    ['rmt.adapter.missing', 'rmt.capability.required_missing', 'rmt.capability.preferred_missing', 'rmt.adapter.surface_mismatch', 'rmt.adapter.version_mismatch', 'rmt.adapter.conflict', 'rmt.adapter.degraded', 'rmt.adapter.negotiation.skipped'],
    'RMT schema adapter registry diagnostic codes'
  );
  assertIncludesAll(
    context,
    adapterRegistry && adapterRegistry.stableAdapterIds,
    ['xtend', 'xtend.component', 'xtend.template', 'xtend.xrouter', 'host-adapter-contract'],
    'RMT schema adapter registry stable adapter ids'
  );
  assertIncludesAll(context, adapterRegistry && adapterRegistry.minimumGates, [MINIMUM_GATE, 'node scripts/run_xtend_tests.js references --json'], 'RMT schema adapter registry gates');
  context.assert(
    adapterRegistry && typeof adapterRegistry.kernelBoundary === 'string' && adapterRegistry.kernelBoundary.includes('stay in adapters'),
    'RMT schema adapter registry keeps framework-specific fallback in adapters'
  );
  context.assert(
    adapterRegistry && typeof adapterRegistry.templateOnlyCompatibility === 'string' && adapterRegistry.templateOnlyCompatibility.includes('remain valid'),
    'RMT schema adapter registry keeps template-only documents valid'
  );
  context.assert(coreTypes.includes('RmtAdapterRegistryRecord'), 'RMT types expose adapter registry record');
  context.assert(coreTypes.includes('RmtCapabilityRequest'), 'RMT types expose capability request');
  context.assert(coreTypes.includes('RmtCapabilityNegotiationResult'), 'RMT types expose capability negotiation result');
  context.assert(coreTypes.includes('RmtAdapterRegistryContract'), 'RMT types expose adapter registry contract');
  context.assert(coreTypes.includes('missingRequiredCapabilities'), 'RMT types expose missing required capability diagnostics');
  context.assert(coreTypes.includes('missingPreferredCapabilities'), 'RMT types expose missing preferred capability diagnostics');
  context.assert(adaptersDomain && adaptersDomain.status === 'epic-05-wp-04-contract', 'RMT schema exposes native adapters domain contract');
  context.assert(
    adaptersDomain && adaptersDomain.sourceOfTruth === 'development/WP-E05-04-Native-Adapters-Domain-im-RMT-Schema-entwerfen.md',
    'RMT schema adapters domain points to WP-04 source of truth'
  );
  context.assert(adaptersDomain && adaptersDomain.domain === 'adapters', 'RMT schema adapters domain declares domain name');
  context.assert(adaptersDomain && adaptersDomain.topLevelProperty === 'adapters', 'RMT schema adapters domain declares top-level property');
  context.assert(adaptersDomain && adaptersDomain.optional === true, 'RMT schema adapters domain remains optional');
  context.assert(adaptersDomain && adaptersDomain.schemaRef === '#/$defs/adapter', 'RMT schema adapters domain points to adapter definition');
  assertIncludesAll(
    context,
    adaptersDomain && adaptersDomain.allowedAdapterKinds,
    ['host_adapter', 'component_adapter', 'router_adapter', 'state_adapter', 'scheduler_adapter'],
    'RMT schema adapters domain allowed adapter kinds'
  );
  assertIncludesAll(
    context,
    adaptersDomain && adaptersDomain.stableAdapterIds,
    ['xtend', 'xtend.component', 'xtend.template', 'xtend.xrouter', 'host-adapter-contract'],
    'RMT schema adapters domain stable adapter ids'
  );
  assertIncludesAll(
    context,
    adaptersDomain && adaptersDomain.capabilityFields,
    ['providedCapabilities', 'requiredCapabilities', 'preferredCapabilities'],
    'RMT schema adapters domain capability fields'
  );
  context.assert(
    adaptersDomain && typeof adaptersDomain.backwardCompatibility === 'string' && adaptersDomain.backwardCompatibility.includes('without adapters remain valid'),
    'RMT schema adapters domain keeps documents without adapters valid'
  );
  context.assert(
    adaptersDomain && typeof adaptersDomain.kernelBoundary === 'string' && adaptersDomain.kernelBoundary.includes('runtime imports'),
    'RMT schema adapters domain keeps runtime imports in adapters'
  );
  context.assert(adaptersProperty && adaptersProperty.$ref === '#/$defs/adapters', 'RMT schema exposes top-level adapters property');
  context.assert(!schema.required.includes('adapters'), 'RMT schema keeps adapters out of required properties');
  context.assert(adapterDefinition && Array.isArray(adapterDefinition.required) && adapterDefinition.required.includes('id') && adapterDefinition.required.includes('kind'), 'RMT schema adapter definition requires id and kind');
  assertIncludesAll(context, adapterKindDefinition && adapterKindDefinition.enum, ['host_adapter', 'component_adapter', 'router_adapter', 'state_adapter', 'scheduler_adapter'], 'RMT schema adapter definition adapter kinds');
  context.assert(adapterDefinition.properties && adapterDefinition.properties.moduleRef && adapterDefinition.properties.runtimeSurface, 'RMT schema adapter definition supports moduleRef and runtimeSurface');
  context.assert(adapterDefinition.properties && adapterDefinition.properties.providedCapabilities && adapterDefinition.properties.requiredCapabilities && adapterDefinition.properties.preferredCapabilities, 'RMT schema adapter definition supports capability lists');
  context.assert(
    Array.isArray(firstExample.adapters) && firstExample.adapters.some((adapter) => adapter.id === 'xtend.component'),
    'RMT schema example contains XTend component adapter'
  );
  context.assert(
    Array.isArray(firstExample.adapters) && firstExample.adapters.some((adapter) => adapter.id === 'custom.router'),
    'RMT schema example contains non-XTend router adapter'
  );
  context.assert(coreTypes.includes('RmtNativeDomainContract'), 'RMT types expose native domain contract');
  context.assert(coreTypes.includes('RmtAdapterDomainRecord'), 'RMT types expose adapter domain record');
  context.assert(coreTypes.includes('adapters?: RmtAdapterDomainRecord[]'), 'RMT document type exposes optional adapters domain');
  context.assert(componentsDomain && componentsDomain.status === 'epic-05-wp-05-contract', 'RMT schema exposes native components domain contract');
  context.assert(
    componentsDomain && componentsDomain.sourceOfTruth === 'development/WP-E05-05-Native-Components-Domain-im-RMT-Schema-entwerfen.md',
    'RMT schema components domain points to WP-05 source of truth'
  );
  context.assert(componentsDomain && componentsDomain.domain === 'components', 'RMT schema components domain declares domain name');
  context.assert(componentsDomain && componentsDomain.topLevelProperty === 'components', 'RMT schema components domain declares top-level property');
  context.assert(componentsDomain && componentsDomain.optional === true, 'RMT schema components domain remains optional');
  context.assert(componentsDomain && componentsDomain.schemaRef === '#/$defs/component', 'RMT schema components domain points to component definition');
  context.assert(componentsDomain && componentsDomain.adapterRefField === 'adapter', 'RMT schema components domain declares adapter reference field');
  assertIncludesAll(
    context,
    componentsDomain && componentsDomain.requiredFields,
    ['id', 'kind', 'adapter'],
    'RMT schema components domain required fields'
  );
  assertIncludesAll(
    context,
    componentsDomain && componentsDomain.componentKinds,
    ['custom_element', 'web_component', 'host_component', 'template_component', 'fragment'],
    'RMT schema components domain component kinds'
  );
  assertIncludesAll(
    context,
    componentsDomain && componentsDomain.capabilityFields,
    ['requiredCapabilities', 'preferredCapabilities'],
    'RMT schema components domain capability fields'
  );
  context.assert(
    componentsDomain && typeof componentsDomain.backwardCompatibility === 'string' && componentsDomain.backwardCompatibility.includes('without components remain valid'),
    'RMT schema components domain keeps documents without components valid'
  );
  context.assert(
    componentsDomain && typeof componentsDomain.kernelBoundary === 'string' && componentsDomain.kernelBoundary.includes('manifest lookup') && componentsDomain.kernelBoundary.includes('stay in adapters'),
    'RMT schema components domain keeps manifest lookup and DOM work in adapters'
  );
  context.assert(componentsProperty && componentsProperty.$ref === '#/$defs/components', 'RMT schema exposes top-level components property');
  context.assert(!schema.required.includes('components'), 'RMT schema keeps components out of required properties');
  context.assert(
    componentDefinition && Array.isArray(componentDefinition.required) && ['id', 'kind', 'adapter'].every((field) => componentDefinition.required.includes(field)),
    'RMT schema component definition requires id, kind and adapter'
  );
  assertIncludesAll(
    context,
    componentKindDefinition && componentKindDefinition.enum,
    ['custom_element', 'web_component', 'host_component', 'template_component', 'fragment'],
    'RMT schema component definition component kinds'
  );
  context.assert(
    componentDefinition.properties && componentDefinition.properties.adapter && componentDefinition.properties.tag && componentDefinition.properties.renderer,
    'RMT schema component definition supports adapter, tag and renderer'
  );
  context.assert(
    componentDefinition.properties && componentDefinition.properties.props && componentDefinition.properties.attributes && componentDefinition.properties.slots && componentDefinition.properties.events,
    'RMT schema component definition supports props, attributes, slots and events'
  );
  context.assert(
    componentDefinition.properties && componentDefinition.properties.hydration && componentDefinition.properties.schedule && componentDefinition.properties.diagnostics,
    'RMT schema component definition supports hydration, schedule and diagnostics'
  );
  context.assert(
    Array.isArray(firstExample.components) && firstExample.components.some((component) => component.id === 'pages.overview' && component.adapter === 'xtend.component'),
    'RMT schema example contains XTend component record'
  );
  context.assert(
    Array.isArray(firstExample.components) && firstExample.components.some((component) => component.id === 'shared.badge' && component.adapter === 'custom.element'),
    'RMT schema example contains generic custom element component record'
  );
  context.assert(coreTypes.includes('RmtComponentDomainRecord'), 'RMT types expose component domain record');
  context.assert(coreTypes.includes('RmtComponentDomainKind'), 'RMT types expose component domain kind');
  context.assert(coreTypes.includes('components?: RmtComponentDomainRecord[]'), 'RMT document type exposes optional components domain');
  context.assert(routesDomain && routesDomain.status === 'epic-05-wp-06-contract', 'RMT schema exposes native routes domain contract');
  context.assert(
    routesDomain && routesDomain.sourceOfTruth === 'development/WP-E05-06-Native-Routes-Domain-im-RMT-Schema-entwerfen.md',
    'RMT schema routes domain points to WP-06 source of truth'
  );
  context.assert(routesDomain && routesDomain.domain === 'routes', 'RMT schema routes domain declares domain name');
  context.assert(routesDomain && routesDomain.topLevelProperty === 'routes', 'RMT schema routes domain declares top-level property');
  context.assert(routesDomain && routesDomain.optional === true, 'RMT schema routes domain remains optional');
  context.assert(routesDomain && routesDomain.schemaRef === '#/$defs/route', 'RMT schema routes domain points to route definition');
  context.assert(routesDomain && routesDomain.routerRefField === 'router', 'RMT schema routes domain declares router reference field');
  context.assert(routesDomain && routesDomain.componentRefField === 'component', 'RMT schema routes domain declares component reference field');
  context.assert(routesDomain && routesDomain.templateRefField === 'template', 'RMT schema routes domain declares template reference field');
  context.assert(routesDomain && routesDomain.scheduleRefField === 'schedule', 'RMT schema routes domain declares schedule reference field');
  assertIncludesAll(
    context,
    routesDomain && routesDomain.requiredFields,
    ['id', 'path', 'router'],
    'RMT schema routes domain required fields'
  );
  assertIncludesAll(
    context,
    routesDomain && routesDomain.routeFields,
    ['id', 'path', 'title', 'documentTitle', 'titleTemplate', 'metaDescription', 'metaKeywords', 'component', 'template', 'router', 'schedule', 'params', 'query', 'metadata', 'lifecycle'],
    'RMT schema routes domain route fields'
  );
  assertIncludesAll(
    context,
    routesDomain && routesDomain.routerAdapters,
    ['xtend.xrouter', 'custom.router'],
    'RMT schema routes domain router adapter examples'
  );
  assertIncludesAll(
    context,
    routesDomain && routesDomain.capabilityFields,
    ['requiredCapabilities', 'preferredCapabilities'],
    'RMT schema routes domain capability fields'
  );
  context.assert(
    routesDomain && typeof routesDomain.backwardCompatibility === 'string' && routesDomain.backwardCompatibility.includes('without routes remain valid'),
    'RMT schema routes domain keeps documents without routes valid'
  );
  context.assert(
    routesDomain && typeof routesDomain.kernelBoundary === 'string' && routesDomain.kernelBoundary.includes('XRouter imports') && routesDomain.kernelBoundary.includes('stay in router adapters'),
    'RMT schema routes domain keeps XRouter runtime work in router adapters'
  );
  context.assert(routesProperty && routesProperty.$ref === '#/$defs/routes', 'RMT schema exposes top-level routes property');
  context.assert(!schema.required.includes('routes'), 'RMT schema keeps routes out of required properties');
  context.assert(
    routeDefinition && Array.isArray(routeDefinition.required) && ['id', 'path', 'router'].every((field) => routeDefinition.required.includes(field)),
    'RMT schema route definition requires id, path and router'
  );
  context.assert(
    routeDefinition.properties && routeDefinition.properties.component && routeDefinition.properties.template && routeDefinition.properties.router,
    'RMT schema route definition supports component, template and router'
  );
  context.assert(
    routeDefinition.properties && routeDefinition.properties.schedule && routeDefinition.properties.params && routeDefinition.properties.query && routeDefinition.properties.lifecycle,
    'RMT schema route definition supports schedule, params, query and lifecycle'
  );
  context.assert(
    routeParamsDefinition && routeParamsDefinition.additionalProperties && routeParamsDefinition.additionalProperties.$ref === '#/$defs/routeParam',
    'RMT schema route params use routeParam map'
  );
  context.assert(
    routeLifecycleDefinition && routeLifecycleDefinition.properties && routeLifecycleDefinition.properties.beforeEnter && routeLifecycleDefinition.properties.enter && routeLifecycleDefinition.properties.leave,
    'RMT schema route lifecycle exposes beforeEnter, enter and leave bindings'
  );
  context.assert(
    Array.isArray(firstExample.routes) && firstExample.routes.some((route) => route.id === 'overview' && route.router === 'xtend.xrouter'),
    'RMT schema example contains XRouter route record'
  );
  context.assert(
    Array.isArray(firstExample.routes) && firstExample.routes.some((route) => route.id === 'search' && route.router === 'custom.router'),
    'RMT schema example contains generic router route record'
  );
  context.assert(coreTypes.includes('RmtRouteDomainRecord'), 'RMT types expose route domain record');
  context.assert(coreTypes.includes('routes?: RmtRouteDomainRecord[]'), 'RMT document type exposes optional routes domain');
  context.assert(schedulesDomain && schedulesDomain.status === 'epic-05-wp-07-contract', 'RMT schema exposes native schedules domain contract');
  context.assert(
    schedulesDomain && schedulesDomain.sourceOfTruth === 'development/WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md',
    'RMT schema schedules domain points to WP-07 source of truth'
  );
  context.assert(schedulesDomain && schedulesDomain.domain === 'schedules', 'RMT schema schedules domain declares domain name');
  context.assert(schedulesDomain && schedulesDomain.topLevelProperty === 'schedules', 'RMT schema schedules domain declares top-level property');
  context.assert(schedulesDomain && schedulesDomain.optional === true, 'RMT schema schedules domain remains optional');
  context.assert(schedulesDomain && schedulesDomain.schemaRef === '#/$defs/schedule', 'RMT schema schedules domain points to schedule definition');
  assertIncludesAll(
    context,
    schedulesDomain && schedulesDomain.requiredFields,
    ['id', 'endpointName', 'scope'],
    'RMT schema schedules domain required fields'
  );
  assertIncludesAll(
    context,
    schedulesDomain && schedulesDomain.scheduleRefFields,
    ['routes[*].schedule', 'components[*].schedule', 'templates[*].hydration.metadata.endpointHint'],
    'RMT schema schedules domain reference fields'
  );
  assertIncludesAll(
    context,
    schedulesDomain && schedulesDomain.scheduleFields,
    ['id', 'endpointName', 'scope', 'lane', 'priority', 'deadlineMs', 'preferIdle', 'coalesceKey', 'budgetClass'],
    'RMT schema schedules domain schedule fields'
  );
  assertIncludesAll(
    context,
    schedulesDomain && schedulesDomain.lanes,
    ['visible', 'idle', 'background', 'diagnostics'],
    'RMT schema schedules domain lanes'
  );
  assertIncludesAll(
    context,
    schedulesDomain && schedulesDomain.budgetClasses,
    ['interactive', 'background', 'diagnostics'],
    'RMT schema schedules domain budget classes'
  );
  context.assert(
    schedulesDomain && typeof schedulesDomain.backwardCompatibility === 'string' && schedulesDomain.backwardCompatibility.includes('without schedules remain valid'),
    'RMT schema schedules domain keeps documents without schedules valid'
  );
  context.assert(
    schedulesDomain && typeof schedulesDomain.kernelBoundary === 'string' && schedulesDomain.kernelBoundary.includes('endpoint execution') && schedulesDomain.kernelBoundary.includes('stay in adapters'),
    'RMT schema schedules domain keeps endpoint execution in adapters or scheduler endpoints'
  );
  context.assert(schedulesProperty && schedulesProperty.$ref === '#/$defs/schedules', 'RMT schema exposes top-level schedules property');
  context.assert(!schema.required.includes('schedules'), 'RMT schema keeps schedules out of required properties');
  context.assert(
    scheduleDefinition && Array.isArray(scheduleDefinition.required) && ['id', 'endpointName', 'scope'].every((field) => scheduleDefinition.required.includes(field)),
    'RMT schema schedule definition requires id, endpointName and scope'
  );
  context.assert(
    scheduleDefinition.properties && scheduleDefinition.properties.lane && scheduleDefinition.properties.priority && scheduleDefinition.properties.deadlineMs && scheduleDefinition.properties.preferIdle,
    'RMT schema schedule definition supports lane, priority, deadline and preferIdle'
  );
  context.assert(
    scheduleDefinition.properties && scheduleDefinition.properties.coalesceKey && scheduleDefinition.properties.budgetClass && scheduleDefinition.properties.diagnostics,
    'RMT schema schedule definition supports coalesceKey, budgetClass and diagnostics'
  );
  assertIncludesAll(
    context,
    scheduleLaneDefinition && scheduleLaneDefinition.enum,
    ['visible', 'idle', 'background', 'diagnostics', 'user-blocking', 'transition'],
    'RMT schema schedule lane definition'
  );
  assertIncludesAll(
    context,
    scheduleBudgetClassDefinition && scheduleBudgetClassDefinition.enum,
    ['interactive', 'background', 'diagnostics', 'critical', 'best_effort'],
    'RMT schema schedule budget class definition'
  );
  context.assert(
    scheduleInlineDefinition && scheduleInlineDefinition.properties && scheduleInlineDefinition.properties.endpointName && scheduleInlineDefinition.properties.budgetClass,
    'RMT schema schedule inline definition supports endpointName and budgetClass'
  );
  context.assert(
    scheduleRefOrInlineDefinition && Array.isArray(scheduleRefOrInlineDefinition.anyOf),
    'RMT schema exposes reusable schedule ref or inline definition'
  );
  context.assert(
    componentScheduleDefinition && componentScheduleDefinition.$ref === '#/$defs/scheduleRefOrInline',
    'RMT schema keeps componentSchedule as schedule ref or inline alias'
  );
  context.assert(
    Array.isArray(firstExample.schedules) && firstExample.schedules.some((schedule) => schedule.id === 'route.visible.render' && schedule.lane === 'visible'),
    'RMT schema example contains visible route schedule policy'
  );
  context.assert(
    Array.isArray(firstExample.schedules) && firstExample.schedules.some((schedule) => schedule.id === 'component.idle.hydrate' && schedule.preferIdle === true),
    'RMT schema example contains idle component schedule policy'
  );
  context.assert(
    Array.isArray(firstExample.schedules) && firstExample.schedules.some((schedule) => schedule.id === 'diagnostics.snapshot' && schedule.lane === 'diagnostics'),
    'RMT schema example contains diagnostics schedule policy'
  );
  context.assert(coreTypes.includes('RmtScheduleDomainRecord'), 'RMT types expose schedule domain record');
  context.assert(coreTypes.includes('RmtScheduleLane'), 'RMT types expose schedule lane type');
  context.assert(coreTypes.includes('RmtScheduleBudgetClass'), 'RMT types expose schedule budget class type');
  context.assert(coreTypes.includes('schedules?: RmtScheduleDomainRecord[]'), 'RMT document type exposes optional schedules domain');
  context.assert(dslNormalization && dslNormalization.status === 'epic-05-wp-08-contract', 'RMT schema exposes DSL normalization contract');
  context.assert(
    dslNormalization && dslNormalization.sourceOfTruth === 'development/WP-E05-08-DSL-Normalisierung-und-Backward-Compatibility-sichern.md',
    'RMT schema DSL normalization points to WP-08 source of truth'
  );
  assertIncludesAll(
    context,
    dslNormalization && dslNormalization.inputModes,
    ['template-only', 'native-app-dsl', 'legacy-manifest-metadata'],
    'RMT schema DSL normalization input modes'
  );
  assertIncludesAll(
    context,
    dslNormalization && dslNormalization.normalizedDomains,
    ['adapters', 'components', 'routes', 'schedules', 'templates'],
    'RMT schema DSL normalization domains'
  );
  assertIncludesAll(
    context,
    dslNormalization && dslNormalization.legacyPromotionPaths,
    ['manifest.metadata.adapters', 'manifest.metadata.components', 'manifest.metadata.routes', 'manifest.metadata.schedules'],
    'RMT schema DSL normalization legacy promotion paths'
  );
  assertIncludesAll(
    context,
    dslNormalization && dslNormalization.diagnosticCodes,
    ['rmt.dsl.legacy_metadata_promoted', 'rmt.dsl.reference.missing_adapter', 'rmt.dsl.reference.missing_component', 'rmt.dsl.reference.missing_template', 'rmt.dsl.reference.missing_schedule'],
    'RMT schema DSL normalization diagnostic codes'
  );
  assertIncludesAll(
    context,
    dslNormalization && dslNormalization.artifactSurfaces,
    ['createRmtFormat().normalizeDocument', 'createRmtFormat().parseDocument', 'RmtRmtDocument.normalization', 'RmtRmtDocument.diagnostics'],
    'RMT schema DSL normalization artifact surfaces'
  );
  context.assert(
    dslNormalization && typeof dslNormalization.backwardCompatibility === 'string' && dslNormalization.backwardCompatibility.includes('Template-only documents normalize with empty native domains'),
    'RMT schema DSL normalization keeps template-only documents compatible'
  );
  context.assert(
    dslNormalization && typeof dslNormalization.kernelBoundary === 'string' && dslNormalization.kernelBoundary.includes('adapter execution') && dslNormalization.kernelBoundary.includes('outside the RMT kernel'),
    'RMT schema DSL normalization keeps execution outside kernel'
  );
  context.assert(coreTypes.includes('RmtDslNormalizationSummary'), 'RMT types expose DSL normalization summary');
  context.assert(coreTypes.includes('RmtDslDiagnostic'), 'RMT types expose DSL diagnostic type');
  context.assert(coreTypes.includes('RmtDslNormalizationContract'), 'RMT types expose DSL normalization contract type');
  context.assert(coreTypes.includes('normalization?: RmtDslNormalizationSummary'), 'RMT document type exposes optional normalization summary');
  context.assert(coreTypes.includes('diagnostics?: RmtDslDiagnostic[]'), 'RMT document type exposes optional DSL diagnostics');
  context.assert(coreTypes.includes('normalizeDslDomains'), 'RMT format type exposes normalizeDslDomains');
  context.assert(coreTypes.includes('listDslDiagnosticCodes'), 'RMT format type exposes DSL diagnostic code list');
  context.assert(runtimeRegistry && runtimeRegistry.status === 'epic-05-wp-09-contract', 'RMT schema exposes runtime registry contract');
  context.assert(
    runtimeRegistry && runtimeRegistry.sourceOfTruth === 'development/WP-E05-09-Route-Registry-und-Component-Registry-vorbereiten.md',
    'RMT schema runtime registry points to WP-09 source of truth'
  );
  context.assert(runtimeRegistry && runtimeRegistry.inputContract === DSL_NORMALIZATION_SCHEMA, 'RMT schema runtime registry builds on DSL normalization');
  assertIncludesAll(
    context,
    runtimeRegistry && runtimeRegistry.registryKinds,
    ['route', 'component'],
    'RMT schema runtime registry kinds'
  );
  assertIncludesAll(
    context,
    runtimeRegistry && runtimeRegistry.indexes,
    ['routeRegistry.byId', 'routeRegistry.byPath', 'routeRegistry.byRouter', 'routeRegistry.byComponent', 'componentRegistry.byId', 'componentRegistry.byTag', 'componentRegistry.byAdapter'],
    'RMT schema runtime registry indexes'
  );
  assertIncludesAll(
    context,
    runtimeRegistry && runtimeRegistry.lifecycleEvents,
    ['create', 'mount', 'hydrate', 'update', 'dispose'],
    'RMT schema runtime registry lifecycle events'
  );
  assertIncludesAll(
    context,
    runtimeRegistry && runtimeRegistry.diagnosticCodes,
    ['rmt.runtime.registry.missing_route', 'rmt.runtime.registry.missing_component', 'rmt.runtime.registry.duplicate_route', 'rmt.runtime.registry.duplicate_component'],
    'RMT schema runtime registry diagnostic codes'
  );
  assertIncludesAll(
    context,
    runtimeRegistry && runtimeRegistry.artifactSurfaces,
    ['createRmtFormat().createRuntimeRegistries', 'createRmtFormat().listRuntimeRegistryDiagnosticCodes', 'RmtRuntimeRegistrySnapshot', 'RmtRouteRegistryEntry', 'RmtComponentRegistryEntry'],
    'RMT schema runtime registry artifact surfaces'
  );
  context.assert(
    runtimeRegistry && typeof runtimeRegistry.kernelBoundary === 'string' && runtimeRegistry.kernelBoundary.includes('Runtime registries may index normalized records') && runtimeRegistry.kernelBoundary.includes('stay in adapters'),
    'RMT schema runtime registry keeps execution in adapters'
  );
  context.assert(coreTypes.includes('RmtRuntimeRegistryContract'), 'RMT types expose runtime registry contract type');
  context.assert(coreTypes.includes('RmtRuntimeRegistrySnapshot'), 'RMT types expose runtime registry snapshot type');
  context.assert(coreTypes.includes('RmtRouteRegistryEntry'), 'RMT types expose route registry entry type');
  context.assert(coreTypes.includes('RmtComponentRegistryEntry'), 'RMT types expose component registry entry type');
  context.assert(coreTypes.includes('createRuntimeRegistries'), 'RMT format type exposes runtime registry creation');
  context.assert(coreTypes.includes('listRuntimeRegistryDiagnosticCodes'), 'RMT format type exposes runtime registry diagnostic code list');
  context.assert(xrouterAdapter && xrouterAdapter.status === 'epic-05-wp-10-contract', 'RMT schema exposes XRouter adapter contract');
  context.assert(
    xrouterAdapter && xrouterAdapter.sourceOfTruth === 'development/WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md',
    'RMT schema XRouter adapter points to WP-10 source of truth'
  );
  context.assert(xrouterAdapter && xrouterAdapter.adapterId === 'xtend.xrouter', 'RMT schema XRouter adapter declares stable adapter id');
  context.assert(xrouterAdapter && xrouterAdapter.inputContract === RUNTIME_REGISTRY_SCHEMA, 'RMT schema XRouter adapter consumes runtime registry');
  assertIncludesAll(
    context,
    xrouterAdapter && xrouterAdapter.consumes,
    ['routeRegistry.byRouter["xtend.xrouter"]', 'routeRegistry.byPath', 'RmtRouteRegistryEntry'],
    'RMT schema XRouter adapter consumed registries'
  );
  assertIncludesAll(
    context,
    xrouterAdapter && xrouterAdapter.operations,
    ['registerRoutes', 'navigate', 'emitDiagnostic'],
    'RMT schema XRouter adapter operations'
  );
  assertIncludesAll(
    context,
    xrouterAdapter && xrouterAdapter.routeMappingFields,
    ['id', 'path', 'component', 'title', 'documentTitle', 'template', 'scheduleRef', 'params', 'query', 'metadata', 'lifecycle'],
    'RMT schema XRouter adapter route mapping fields'
  );
  assertIncludesAll(
    context,
    xrouterAdapter && xrouterAdapter.modelFields,
    ['routeId', 'path', 'component', 'title', 'documentTitle', 'params', 'query', 'template', 'scheduleRef', 'metadata'],
    'RMT schema XRouter adapter model fields'
  );
  assertIncludesAll(
    context,
    xrouterAdapter && xrouterAdapter.diagnosticCodes,
    ['rmt.xrouter.route.missing_path', 'rmt.xrouter.route.missing_component', 'rmt.xrouter.target.missing', 'rmt.xrouter.navigation.skipped'],
    'RMT schema XRouter adapter diagnostic codes'
  );
  assertIncludesAll(
    context,
    xrouterAdapter && xrouterAdapter.artifactSurfaces,
    ['createRmtXRouterAdapter', 'createRenderManXRouterAdapter', 'XRouter.registerRoutes', 'XRouter.navigate', 'RmtXRouterMappedRoute', 'RmtXRouterAdapter'],
    'RMT schema XRouter adapter artifact surfaces'
  );
  context.assert(
    xrouterAdapter && typeof xrouterAdapter.kernelBoundary === 'string' && xrouterAdapter.kernelBoundary.includes('never imports XRouter'),
    'RMT schema XRouter adapter keeps XRouter outside kernel imports'
  );
  context.assert(coreTypes.includes('RmtXRouterAdapterContract'), 'RMT types expose XRouter adapter contract type');
  context.assert(coreTypes.includes('RmtXRouterAdapter'), 'RMT types expose XRouter adapter type');
  context.assert(coreTypes.includes('RmtXRouterMappedRoute'), 'RMT types expose XRouter mapped route type');
  context.assert(coreTypes.includes('createRmtXRouterAdapter'), 'RMT types expose XRouter adapter factory');
  context.assert(xtendComponentAdapter && xtendComponentAdapter.status === 'epic-05-wp-11-contract', 'RMT schema exposes XTend component adapter contract');
  context.assert(
    xtendComponentAdapter && xtendComponentAdapter.sourceOfTruth === 'development/WP-E05-11-XTend-Component-Adapter-produktfaehig-implementieren.md',
    'RMT schema XTend component adapter points to WP-11 source of truth'
  );
  context.assert(xtendComponentAdapter && xtendComponentAdapter.adapterId === 'xtend.component', 'RMT schema XTend component adapter declares stable adapter id');
  context.assert(xtendComponentAdapter && xtendComponentAdapter.inputContract === RUNTIME_REGISTRY_SCHEMA, 'RMT schema XTend component adapter consumes runtime registry');
  assertIncludesAll(
    context,
    xtendComponentAdapter && xtendComponentAdapter.consumes,
    ['componentRegistry.byAdapter["xtend.component"]', 'componentRegistry.byTag', 'RmtComponentRegistryEntry'],
    'RMT schema XTend component adapter consumed registries'
  );
  assertIncludesAll(
    context,
    xtendComponentAdapter && xtendComponentAdapter.operations,
    ['registerComponent', 'mountComponent', 'hydrateComponent', 'emitDiagnostic'],
    'RMT schema XTend component adapter operations'
  );
  assertIncludesAll(
    context,
    xtendComponentAdapter && xtendComponentAdapter.componentMappingFields,
    ['id', 'kind', 'adapter', 'tag', 'props', 'attributes', 'slots', 'events', 'hydration', 'scheduleRef', 'metadata'],
    'RMT schema XTend component adapter mapping fields'
  );
  assertIncludesAll(
    context,
    xtendComponentAdapter && xtendComponentAdapter.modelFields,
    ['componentId', 'tag', 'props', 'attributes', 'slots', 'events', 'hydration', 'scheduleRef', 'metadata'],
    'RMT schema XTend component adapter model fields'
  );
  assertIncludesAll(
    context,
    xtendComponentAdapter && xtendComponentAdapter.diagnosticCodes,
    ['rmt.xtend.component.missing_tag', 'rmt.xtend.component.target.missing', 'rmt.xtend.component.manifest.missing', 'rmt.xtend.component.custom_element.unregistered', 'rmt.xtend.component.mount.skipped', 'rmt.xtend.component.hydration.skipped'],
    'RMT schema XTend component adapter diagnostic codes'
  );
  assertIncludesAll(
    context,
    xtendComponentAdapter && xtendComponentAdapter.artifactSurfaces,
    ['createRmtXtendComponentAdapter', 'createRenderManXtendComponentAdapter', 'RmtXtendMappedComponent', 'RmtXtendComponentMapping', 'RmtXtendComponentAdapter'],
    'RMT schema XTend component adapter artifact surfaces'
  );
  context.assert(
    xtendComponentAdapter && typeof xtendComponentAdapter.kernelBoundary === 'string' && xtendComponentAdapter.kernelBoundary.includes('never imports XTend components'),
    'RMT schema XTend component adapter keeps XTend outside kernel imports'
  );
  context.assert(coreTypes.includes('RmtXtendComponentAdapterContract'), 'RMT types expose XTend component adapter contract type');
  context.assert(coreTypes.includes('RmtXtendComponentAdapter'), 'RMT types expose XTend component adapter type');
  context.assert(coreTypes.includes('RmtXtendMappedComponent'), 'RMT types expose XTend mapped component type');
  context.assert(coreTypes.includes('createRmtXtendComponentAdapter'), 'RMT types expose XTend component adapter factory');
  context.assert(stateSchedulerDiagnosticsBridge && stateSchedulerDiagnosticsBridge.status === 'epic-05-wp-12-contract', 'RMT schema exposes State/Scheduler/Diagnostics bridge contract');
  context.assert(
    stateSchedulerDiagnosticsBridge && stateSchedulerDiagnosticsBridge.sourceOfTruth === 'development/WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md',
    'RMT schema State/Scheduler/Diagnostics bridge points to WP-12 source of truth'
  );
  context.assert(stateSchedulerDiagnosticsBridge && stateSchedulerDiagnosticsBridge.adapterId === 'rmt.state-scheduler-diagnostics', 'RMT schema State/Scheduler/Diagnostics bridge declares stable adapter id');
  assertIncludesAll(
    context,
    stateSchedulerDiagnosticsBridge && stateSchedulerDiagnosticsBridge.inputContracts,
    [RUNTIME_REGISTRY_SCHEMA, XROUTER_ADAPTER_SCHEMA, XTEND_COMPONENT_ADAPTER_SCHEMA, SCHEDULES_DOMAIN_SCHEMA, 'xtend.fabric.telemetry-snapshot.v1', 'xtend.fabric.backpressure-signal.v1'],
    'RMT schema State/Scheduler/Diagnostics bridge input contracts'
  );
  assertIncludesAll(
    context,
    stateSchedulerDiagnosticsBridge && stateSchedulerDiagnosticsBridge.consumes,
    ['RmtHostAdapterOperationResult', 'RmtRouteRegistryEntry.scheduleRef', 'RmtComponentRegistryEntry.scheduleRef', 'schedules[*]', 'optional xstate target', 'optional Fabric telemetry snapshot', 'optional Fabric backpressure signal'],
    'RMT schema State/Scheduler/Diagnostics bridge consumed records'
  );
  assertIncludesAll(
    context,
    stateSchedulerDiagnosticsBridge && stateSchedulerDiagnosticsBridge.operations,
    ['createStateBridge', 'scheduleEndpoint', 'emitDiagnostic', 'recordAdapterResult', 'recordTelemetrySnapshot', 'recordBackpressureSignal'],
    'RMT schema State/Scheduler/Diagnostics bridge operations'
  );
  assertIncludesAll(
    context,
    stateSchedulerDiagnosticsBridge && stateSchedulerDiagnosticsBridge.stateMirrors,
    ['rmt.bridge.ready', 'rmt.adapter.lastResult', 'rmt.scheduler.lastEndpoint', 'rmt.diagnostics.last', 'rmt.telemetry.lastSnapshot', 'rmt.backpressure.lastSignal', 'rmt.backpressure.profile'],
    'RMT schema State/Scheduler/Diagnostics bridge state mirrors'
  );
  assertIncludesAll(
    context,
    stateSchedulerDiagnosticsBridge && stateSchedulerDiagnosticsBridge.schedulerEndpoints,
    ['xtendrmt.route.render', 'xtendrmt.component.mount', 'xtendrmt.component.hydrate', 'xtendrmt.diagnostics.snapshot'],
    'RMT schema State/Scheduler/Diagnostics bridge scheduler endpoints'
  );
  assertIncludesAll(
    context,
    stateSchedulerDiagnosticsBridge && stateSchedulerDiagnosticsBridge.performanceBudgetFields,
    ['lane', 'priority', 'deadlineMs', 'preferIdle', 'coalesceKey', 'budgetClass', 'maxRetries', 'timeoutMs'],
    'RMT schema State/Scheduler/Diagnostics bridge performance budget fields'
  );
  assertIncludesAll(
    context,
    stateSchedulerDiagnosticsBridge && stateSchedulerDiagnosticsBridge.diagnosticCodes,
    ['rmt.bridge.state.mirrored', 'rmt.bridge.state.unavailable', 'rmt.bridge.scheduler.endpoint.scheduled', 'rmt.bridge.scheduler.endpoint.queued', 'rmt.bridge.diagnostics.emitted', 'rmt.bridge.adapter.result.degraded', 'rmt.bridge.telemetry.snapshot.recorded', 'rmt.bridge.backpressure.signal.recorded', 'rmt.bridge.backpressure.high', 'rmt.bridge.backpressure.critical'],
    'RMT schema State/Scheduler/Diagnostics bridge diagnostic codes'
  );
  assertIncludesAll(
    context,
    stateSchedulerDiagnosticsBridge && stateSchedulerDiagnosticsBridge.artifactSurfaces,
    ['createRmtStateSchedulerDiagnosticsBridge', 'createRenderManStateSchedulerDiagnosticsBridge', 'RmtStateSchedulerDiagnosticsBridge', 'RmtStateBridgeHandle', 'RmtBridgeSchedulePolicy'],
    'RMT schema State/Scheduler/Diagnostics bridge artifact surfaces'
  );
  context.assert(
    stateSchedulerDiagnosticsBridge && typeof stateSchedulerDiagnosticsBridge.kernelBoundary === 'string' && stateSchedulerDiagnosticsBridge.kernelBoundary.includes('never imports xstate'),
    'RMT schema State/Scheduler/Diagnostics bridge keeps xstate outside kernel imports'
  );
  context.assert(coreTypes.includes('RmtStateSchedulerDiagnosticsBridgeContract'), 'RMT types expose State/Scheduler/Diagnostics bridge contract type');
  context.assert(coreTypes.includes('RmtStateSchedulerDiagnosticsBridge'), 'RMT types expose State/Scheduler/Diagnostics bridge type');
  context.assert(coreTypes.includes('RmtStateBridgeHandle'), 'RMT types expose State Bridge handle type');
  context.assert(coreTypes.includes('RmtBridgeSchedulePolicy'), 'RMT types expose Bridge schedule policy type');
  context.assert(coreTypes.includes('createRmtStateSchedulerDiagnosticsBridge'), 'RMT types expose State/Scheduler/Diagnostics bridge factory');
  context.assert(artifactParity && artifactParity.status === 'epic-05-wp-13-contract', 'RMT schema exposes artifact parity contract');
  context.assert(
    artifactParity && artifactParity.sourceOfTruth === 'development/WP-E05-13-Build-Pipeline-und-Artefakt-Paritaet-fuer-XTendRMT-absichern.md',
    'RMT schema artifact parity points to WP-13 source of truth'
  );
  context.assert(artifactParity && artifactParity.gateCommand === 'node scripts/verify_xtendrmt_artifact_parity.js --json', 'RMT schema artifact parity points to dedicated parity gate');
  assertIncludesAll(
    context,
    artifactParity && artifactParity.artifactPaths,
    ['xtendrmt/rmt-core.esm.js', 'xtendrmt/rmt-runtime.esm.js', 'xtendrmt/rmt-runtime.browser.js', 'xtendrmt/rmt-core.d.ts', 'xtendrmt/rmt.schema.json', 'xtendrmt/rmt-manifest.json'],
    'RMT schema artifact parity artifact paths'
  );
  assertIncludesAll(
    context,
    artifactParity && artifactParity.requiredFactories,
    ['createRmtFormat', 'createRmtXRouterAdapter', 'createRmtXtendComponentAdapter', 'createRmtStateSchedulerDiagnosticsBridge'],
    'RMT schema artifact parity required factories'
  );
  assertIncludesAll(
    context,
    artifactParity && artifactParity.requiredContractIds,
    [RUNTIME_REGISTRY_SCHEMA, XROUTER_ADAPTER_SCHEMA, XTEND_COMPONENT_ADAPTER_SCHEMA, STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_SCHEMA, ARTIFACT_PARITY_SCHEMA],
    'RMT schema artifact parity required contract ids'
  );
  context.assert(
    artifactParity && typeof artifactParity.kernelBoundary === 'string' && artifactParity.kernelBoundary.includes('drift only'),
    'RMT schema artifact parity stays a drift gate'
  );
  context.assert(manifestArtifactParity && manifestArtifactParity.id === ARTIFACT_PARITY_SCHEMA, 'RMT manifest exposes artifact parity contract');
  context.assert(coreTypes.includes('RmtArtifactParityContract'), 'RMT types expose artifact parity contract type');
  context.assert(coreTypes.includes('artifactParityContracts?: RmtArtifactParityContract[]'), 'RMT product manifest type exposes artifact parity contracts');
  context.assert(upstreamHandoff && upstreamHandoff.id === UPSTREAM_HANDOFF_SCHEMA, 'RMT schema exposes upstream handoff metadata');
  context.assert(upstreamHandoff && upstreamHandoff.status === 'epic-04-handoff', 'RMT schema upstream handoff exposes Epic 04 handoff status');
  context.assert(upstreamHandoff && upstreamHandoff.sourceOfTruth === 'upstream-rmt-source', 'RMT schema upstream handoff points to upstream source of truth');
  context.assert(upstreamHandoff && upstreamHandoff.buildArtifactsAreOutput === true, 'RMT schema upstream handoff keeps build artifacts as output');
  context.assert(upstreamHandoff && upstreamHandoff.handoffSpec === 'development/XTendRMT-Upstream-Handoff-Spezifikation.md', 'RMT schema upstream handoff links specification');
  context.assert(upstreamHandoff && upstreamHandoff.workpackage === 'development/WP-E04-11-Upstream-Handoff-Spezifikation-fuer-XTendRMT-DSL-und-Bridge-vorbereiten.md', 'RMT schema upstream handoff links WP-11');
  context.assert(upstreamHandoff && upstreamHandoff.epic === 'development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md', 'RMT schema upstream handoff links Epic 05');
  assertIncludesAll(context, upstreamHandoff && upstreamHandoff.requiredDomains, ['adapters', 'components', 'routes', 'schedules', 'templates'], 'RMT schema upstream handoff required domains');
  assertIncludesAll(context, upstreamHandoff && upstreamHandoff.requiredAdapters, ['host-adapter-contract', 'xtend.component', 'xtend.template', 'xtend.xrouter'], 'RMT schema upstream handoff required adapters');
  assertIncludesAll(context, upstreamHandoff && upstreamHandoff.requiredGates, [MINIMUM_GATE, 'node scripts/run_xtend_tests.js references --json'], 'RMT schema upstream handoff required gates');
  context.assert(upstreamHandoff && upstreamHandoff.bridgeRuntime === 'reserved-for-Epic-05', 'RMT schema upstream handoff keeps bridge runtime reserved');
  context.assert(
    upstreamHandoff && typeof upstreamHandoff.kernelBoundary === 'string' && upstreamHandoff.kernelBoundary.includes('host-neutral'),
    'RMT schema upstream handoff keeps kernel host neutral'
  );

  context.assert(demoBinding && demoBinding.schema === RMT_COMPATIBILITY_SCHEMA, 'RMT demo exposes scaffold compatibility metadata');
  assertIncludesAll(context, demoBinding && demoBinding.surfaces, REQUIRED_SURFACES, 'RMT demo scaffold compatibility surfaces');
  assertIncludesAll(context, demoBinding && demoBinding.requiredContracts, REQUIRED_RMT_CONTRACTS, 'RMT demo scaffold required contracts');
  context.assert(demoBinding && demoBinding.minimumGate === MINIMUM_GATE, 'RMT demo points scaffold compatibility to dedicated gate');
  context.assert(demoBinding && demoBinding.kernelVisible === false, 'RMT demo keeps scaffold compatibility out of kernel visibility');
  context.assert(pilotFlow.contractVersion === TEMPLATE_PILOT_FLOW_SCHEMA, 'RMT demo exposes template pilot flow metadata');
  context.assert(pilotFlow.status === 'reference-only', 'RMT demo marks template pilot flow as reference-only');
  context.assert(pilotFlow.templateRef === 'demo.templating.pilot', 'RMT demo pilot points to stable template ref');
  context.assert(pilotFlow.routeRef === 'templating', 'RMT demo pilot points to stable route ref');
  context.assert(pilotFlow.minimumGate === MINIMUM_GATE, 'RMT demo pilot points to dedicated gate');
  context.assert(pilotFlow.bridgeRuntime === 'reserved-for-Epic-05', 'RMT demo pilot keeps bridge runtime reserved');
  context.assert(pilotFlow.kernelVisible === false, 'RMT demo pilot keeps XTend out of kernel visibility');
  context.assert(pilotAttachment.adapter === 'xtend.template', 'RMT demo pilot uses XTend template adapter data');
  context.assert(pilotAttachment.componentAdapter === 'xtend.component', 'RMT demo pilot uses XTend component adapter data');
  assertIncludesAll(context, pilotAttachment.componentRefs, ['pilot.shell', 'kernel.cards', 'feedback.status'], 'RMT demo pilot component refs');
  context.assert(nativeDemoMigration.usesTopLevelDomains === true, 'RMT demo declares native top-level domain migration');
  context.assert(Array.isArray(adapters) && adapters.some((adapter) => adapter.id === 'xtend.xrouter' && adapter.kind === 'router_adapter'), 'RMT demo exposes native XRouter adapter domain record');
  context.assert(Array.isArray(adapters) && adapters.some((adapter) => adapter.id === 'xtend.component' && adapter.kind === 'component_adapter'), 'RMT demo exposes native XTend component adapter domain record');
  context.assert(Array.isArray(adapters) && adapters.some((adapter) => adapter.id === 'rmt.state-scheduler-diagnostics'), 'RMT demo exposes native State/Scheduler/Diagnostics bridge adapter record');
  context.assert(Array.isArray(components) && components.some((component) => component.id === 'kernel.cards' && component.adapter === 'xtend.component'), 'RMT demo exposes native XTend component records');
  context.assert(templatingRouteComponent && templatingRouteComponent.tag === 'x-rmt-route-template-pilot', 'RMT demo exposes native route component record for templating pilot');
  context.assert(Array.isArray(routes) && routes.every((route) => route.router === 'xtend.xrouter'), 'RMT demo routes target native XRouter adapter');
  context.assert(templatingRoute && templatingRoute.component === 'x-rmt-route-template-pilot', 'RMT demo exposes templating pilot route component');
  context.assert(templatingRoute && templatingRoute.template === 'demo.templating.pilot', 'RMT demo templating route points to pilot template');
  context.assert(pilotSchedule && pilotSchedule.endpointName === 'xtendrmt.template.inspect', 'RMT demo exposes template inspect scheduler endpoint');
  context.assert(pilotTemplate && pilotTemplate.mode === 'dom_descriptor', 'RMT demo pilot template uses DOM descriptor mode');
  context.assert(pilotAuthoring.contractVersion === 'xtend.rmt.template-authoring.v1', 'RMT demo pilot template keeps authoring contract');
  context.assert(pilotAuthoring.bridgeRuntime === 'reserved-for-Epic-05', 'RMT demo pilot template keeps bridge runtime reserved');
  context.assert(pilotTemplateAttachment.adapter === 'xtend.template', 'RMT demo pilot template carries template adapter attachment');
  context.assert(pilotTemplateAttachment.componentAdapter === 'xtend.component', 'RMT demo pilot template carries component adapter attachment');
  assertIncludesAll(context, pilotTemplateAttachment.componentRefs, ['pilot.shell', 'kernel.cards', 'feedback.status'], 'RMT demo pilot template component refs');
  assertIncludesAll(context, pilotTemplate && Object.keys(pilotTemplate.slots || {}), ['title', 'summary', 'cards', 'feedback'], 'RMT demo pilot template slots');
  context.assert(pilotTemplate && pilotTemplate.events && pilotTemplate.events['pilot-run'] && pilotTemplate.events['pilot-run'].commandName === 'xtendrmt.template.pilot.inspect', 'RMT demo pilot template maps DOM event to RMT command');
  context.assert(pilotTemplate && pilotTemplate.hydration && pilotTemplate.hydration.metadata && pilotTemplate.hydration.metadata.endpointHint === 'xtendrmt.template.inspect', 'RMT demo pilot template exposes hydration endpoint hint');
  context.assert(demoJs.includes('x-rmt-route-template-pilot'), 'RMT demo JS defines template pilot route component');
  context.assert(demoJs.includes('createRmtXRouterAdapter'), 'RMT demo JS uses productive XRouter adapter factory');
  context.assert(demoJs.includes('createRmtXtendComponentAdapter'), 'RMT demo JS uses productive XTend component adapter factory');
  context.assert(demoJs.includes('createRmtStateSchedulerDiagnosticsBridge'), 'RMT demo JS uses productive State/Scheduler/Diagnostics bridge factory');
  context.assert(demoJs.includes('registerRoutes(state.registries'), 'RMT demo JS registers native routes through the productive adapter');
  context.assert(demoJs.includes('runTemplatePilotCycle'), 'RMT demo JS exposes template pilot cycle');
  context.assert(demoJs.includes('xtend.rmt.templating.pilot'), 'RMT demo JS mirrors template pilot diagnostics into xstate');
  context.assert(demoHtml.includes('#/templating'), 'RMT demo HTML exposes template pilot navigation');
}

function assertRmtDslNormalizationRuntime(context, rootDir) {
  const format = createRmtFormatFromBundle(context, rootDir);
  if (!format) return;

  const legacyFixture = readJson('tests/fixtures/rmt-template-only.legacy.rmt', rootDir);
  const normalizedFixture = readJson('tests/fixtures/rmt-app-dsl.normalized.rmt', rootDir);
  const missingRefsFixture = readJson('tests/fixtures/rmt-app-dsl.missing-refs.rmt', rootDir);
<<<<<<< HEAD
  const demo = readJson('xtendrmt/xtendrmt-bestcase-demo.rmt', rootDir);
=======
  const demo = readBestcaseVNextDemo(rootDir).projection;
>>>>>>> 52a69eb (Updated RMT Best Case demo to new RMT vNext syntax)
  const legacyDocument = format.normalizeDocument(legacyFixture);
  const normalizedDocument = format.normalizeDocument(normalizedFixture);
  const missingRefsDocument = format.normalizeDocument(missingRefsFixture);
  const demoDocument = format.normalizeDocument(demo);
  const diagnosticCodes = typeof format.listDslDiagnosticCodes === 'function'
    ? format.listDslDiagnosticCodes()
    : [];

  context.assert(legacyDocument.normalization && legacyDocument.normalization.schema === DSL_NORMALIZATION_SCHEMA, 'RMT normalizer emits DSL normalization summary for template-only documents');
  context.assert(legacyDocument.normalization && legacyDocument.normalization.templateOnlyCompatible === true, 'RMT normalizer keeps template-only documents compatible');
  context.assert(Array.isArray(legacyDocument.adapters) && legacyDocument.adapters.length === 0, 'RMT normalizer gives template-only documents empty adapters domain');
  context.assert(Array.isArray(legacyDocument.components) && legacyDocument.components.length === 0, 'RMT normalizer gives template-only documents empty components domain');
  context.assert(Array.isArray(legacyDocument.routes) && legacyDocument.routes.length === 0, 'RMT normalizer gives template-only documents empty routes domain');
  context.assert(Array.isArray(legacyDocument.schedules) && legacyDocument.schedules.length === 0, 'RMT normalizer gives template-only documents empty schedules domain');
  context.assert(Array.isArray(legacyDocument.diagnostics) && legacyDocument.diagnostics.length === 0, 'RMT normalizer avoids diagnostics for clean template-only documents');

  context.assert(normalizedDocument.normalization && normalizedDocument.normalization.status === 'normalized', 'RMT normalizer accepts complete native App-DSL documents without diagnostics');
  context.assert(Array.isArray(normalizedDocument.adapters) && normalizedDocument.adapters.length === 2, 'RMT normalizer preserves native adapters records');
  context.assert(Array.isArray(normalizedDocument.components) && normalizedDocument.components.length === 1, 'RMT normalizer preserves native components records');
  context.assert(Array.isArray(normalizedDocument.routes) && normalizedDocument.routes.length === 1, 'RMT normalizer preserves native routes records');
  context.assert(Array.isArray(normalizedDocument.schedules) && normalizedDocument.schedules.length === 2, 'RMT normalizer preserves native schedules records');
  context.assert(
    normalizedDocument.normalization
      && normalizedDocument.normalization.referenceGraph
      && normalizedDocument.normalization.referenceGraph.schedules.includes('xtendrmt.component.mount'),
    'RMT normalizer indexes schedule endpointName as valid schedule reference'
  );

  const missingCodes = Array.isArray(missingRefsDocument.diagnostics)
    ? missingRefsDocument.diagnostics.map((entry) => entry.code)
    : [];
  context.assert(missingRefsDocument.normalization && missingRefsDocument.normalization.status === 'normalized_with_diagnostics', 'RMT normalizer marks missing refs with diagnostics');
  assertIncludesAll(
    context,
    missingCodes,
    ['rmt.dsl.reference.missing_adapter', 'rmt.dsl.reference.missing_component', 'rmt.dsl.reference.missing_template', 'rmt.dsl.reference.missing_schedule'],
    'RMT normalizer missing reference diagnostics'
  );

  context.assert(demoDocument.normalization && demoDocument.normalization.domains.routes.source === 'top-level', 'RMT normalizer reads migrated demo routes from native top-level domain');
  context.assert(demoDocument.normalization && demoDocument.normalization.domains.components.source === 'top-level', 'RMT normalizer reads migrated demo components from native top-level domain');
  context.assert(demoDocument.normalization && demoDocument.normalization.domains.schedules.source === 'top-level', 'RMT normalizer reads migrated demo schedules from native top-level domain');
  context.assert(Array.isArray(demoDocument.routes) && demoDocument.routes.length >= 5, 'RMT normalizer exposes native demo routes as normalized records');
  context.assert(Array.isArray(demoDocument.routes) && demoDocument.routes.some((route) => route.router === 'xtend.xrouter'), 'RMT normalizer preserves native XRouter route adapter refs');
  context.assert(Array.isArray(demoDocument.schedules) && demoDocument.schedules.some((schedule) => schedule.id === 'route.visible.render'), 'RMT normalizer exposes native demo schedules as normalized records');
  context.assert(
    Array.isArray(demoDocument.diagnostics) && !demoDocument.diagnostics.some((entry) => entry.code === 'rmt.dsl.legacy_metadata_promoted'),
    'RMT normalizer no longer needs legacy metadata promotion diagnostics for migrated demo'
  );

  context.assert(Array.isArray(diagnosticCodes) && diagnosticCodes.includes('rmt.dsl.reference.missing_schedule'), 'RMT format exposes DSL diagnostic code list');
  const serializedDocument = JSON.parse(format.serializeDocument(normalizedFixture, { includeNormalization: true, includeDiagnostics: true }));
  context.assert(Array.isArray(serializedDocument.routes) && serializedDocument.routes.length === 1, 'RMT serializer keeps native routes in normalized App-DSL output');
  context.assert(serializedDocument.normalization && serializedDocument.normalization.schema === DSL_NORMALIZATION_SCHEMA, 'RMT serializer can include normalization summary');
}

function assertRmtRuntimeRegistryRuntime(context, rootDir) {
  const format = createRmtFormatFromBundle(context, rootDir);
  if (!format) return;

  const normalizedFixture = readJson('tests/fixtures/rmt-app-dsl.normalized.rmt', rootDir);
  const missingRefsFixture = readJson('tests/fixtures/rmt-app-dsl.missing-refs.rmt', rootDir);
  const registry = format.createRuntimeRegistries(normalizedFixture);
  const requiredRegistry = format.createRuntimeRegistries(normalizedFixture, {
    requiredRoutes: ['home', '/', 'missing-route'],
    requiredComponents: ['pages.home', 'x-section', 'missing-component']
  });
  const sourceDiagnosticRegistry = format.createRuntimeRegistries(missingRefsFixture);
  const diagnosticCodes = typeof format.listRuntimeRegistryDiagnosticCodes === 'function'
    ? format.listRuntimeRegistryDiagnosticCodes()
    : [];
  const requiredCodes = Array.isArray(requiredRegistry.diagnostics)
    ? requiredRegistry.diagnostics.map((entry) => entry.code)
    : [];

  context.assert(registry && registry.schema === RUNTIME_REGISTRY_SCHEMA, 'RMT runtime registry emits stable schema id');
  context.assert(registry && registry.status === 'ready', 'RMT runtime registry marks complete native App-DSL as ready');
  context.assert(registry && registry.documentId === 'fixture.app-dsl.normalized', 'RMT runtime registry preserves document id');
  context.assert(Array.isArray(registry.routes) && registry.routes.length === 1, 'RMT runtime registry exposes route entries');
  context.assert(Array.isArray(registry.components) && registry.components.length === 1, 'RMT runtime registry exposes component entries');
  context.assert(
    registry.routeRegistry && registry.routeRegistry.byId && registry.routeRegistry.byId.home && registry.routeRegistry.byId.home.path === '/',
    'RMT route registry indexes route by id'
  );
  context.assert(
    registry.routeRegistry && registry.routeRegistry.byPath && Array.isArray(registry.routeRegistry.byPath['/']) && registry.routeRegistry.byPath['/'].includes('home'),
    'RMT route registry indexes route by path'
  );
  context.assert(
    registry.routeRegistry && registry.routeRegistry.byRouter && Array.isArray(registry.routeRegistry.byRouter['xtend.xrouter']) && registry.routeRegistry.byRouter['xtend.xrouter'].includes('home'),
    'RMT route registry indexes route by router adapter'
  );
  context.assert(
    registry.routeRegistry && registry.routeRegistry.byComponent && Array.isArray(registry.routeRegistry.byComponent['pages.home']) && registry.routeRegistry.byComponent['pages.home'].includes('home'),
    'RMT route registry indexes route by component'
  );
  context.assert(
    registry.componentRegistry && registry.componentRegistry.byId && registry.componentRegistry.byId['pages.home'] && registry.componentRegistry.byId['pages.home'].tag === 'x-section',
    'RMT component registry indexes component by id'
  );
  context.assert(
    registry.componentRegistry && registry.componentRegistry.byTag && Array.isArray(registry.componentRegistry.byTag['x-section']) && registry.componentRegistry.byTag['x-section'].includes('pages.home'),
    'RMT component registry indexes component by tag'
  );
  context.assert(
    registry.componentRegistry && registry.componentRegistry.byAdapter && Array.isArray(registry.componentRegistry.byAdapter['xtend.component']) && registry.componentRegistry.byAdapter['xtend.component'].includes('pages.home'),
    'RMT component registry indexes component by adapter'
  );
  context.assert(
    registry.routes[0] && registry.routes[0].componentId === 'pages.home' && registry.routes[0].scheduleRef === 'route.visible.render',
    'RMT route registry entry preserves component and schedule refs'
  );
  context.assert(
    registry.components[0] && registry.components[0].adapterId === 'xtend.component' && registry.components[0].scheduleRef === 'component.visible.mount',
    'RMT component registry entry preserves adapter and schedule refs'
  );
  assertIncludesAll(
    context,
    registry.lifecycleEvents,
    ['create', 'mount', 'hydrate', 'update', 'dispose'],
    'RMT runtime registry lifecycle events'
  );

  context.assert(requiredRegistry.status === 'ready_with_diagnostics', 'RMT runtime registry reports missing required refs with diagnostics');
  assertIncludesAll(
    context,
    requiredCodes,
    ['rmt.runtime.registry.missing_route', 'rmt.runtime.registry.missing_component'],
    'RMT runtime registry missing required reference diagnostics'
  );
  context.assert(
    requiredCodes.filter((code) => code === 'rmt.runtime.registry.missing_route').length === 1,
    'RMT runtime registry accepts required route refs by id and path before warning'
  );
  context.assert(
    requiredCodes.filter((code) => code === 'rmt.runtime.registry.missing_component').length === 1,
    'RMT runtime registry accepts required component refs by id and tag before warning'
  );
  assertIncludesAll(
    context,
    diagnosticCodes,
    ['rmt.runtime.registry.missing_route', 'rmt.runtime.registry.missing_component', 'rmt.runtime.registry.duplicate_route', 'rmt.runtime.registry.duplicate_component'],
    'RMT format exposes runtime registry diagnostic code list'
  );
  context.assert(
    sourceDiagnosticRegistry.status === 'ready_with_diagnostics'
      && Array.isArray(sourceDiagnosticRegistry.sourceDiagnostics)
      && sourceDiagnosticRegistry.sourceDiagnostics.some((entry) => entry.code === 'rmt.dsl.reference.missing_component'),
    'RMT runtime registry carries DSL source diagnostics without executing adapters'
  );
}

function assertRmtNativeBridgeFixtureRuntime(context, rootDir) {
  const format = createRmtFormatFromBundle(context, rootDir);
  if (!format) return;

  const fixture = readJson('tests/fixtures/rmt-app-dsl.native-bridge.rmt', rootDir);
  const normalizedDocument = format.normalizeDocument(fixture);
  const registry = format.createRuntimeRegistries(normalizedDocument, {
    requiredRoutes: ['home', 'settings', '/settings'],
    requiredComponents: ['pages.home', 'pages.settings', 'x-card']
  });
  const metadata = normalizedDocument.manifest && normalizedDocument.manifest.metadata
    ? normalizedDocument.manifest.metadata
    : {};
  const serializedDocument = JSON.parse(format.serializeDocument(fixture, {
    includeNormalization: true,
    includeDiagnostics: true
  }));

  context.assert(metadata.contractVersion === WP15_NATIVE_BRIDGE_FIXTURE_SCHEMA, 'WP-15 native bridge fixture exposes stable contract version');
  context.assert(normalizedDocument.normalization && normalizedDocument.normalization.status === 'normalized', 'WP-15 native bridge fixture normalizes without diagnostics');
  context.assert(normalizedDocument.normalization && normalizedDocument.normalization.domains.adapters.source === 'top-level', 'WP-15 native bridge fixture reads adapters from top-level domain');
  context.assert(normalizedDocument.normalization && normalizedDocument.normalization.domains.components.source === 'top-level', 'WP-15 native bridge fixture reads components from top-level domain');
  context.assert(normalizedDocument.normalization && normalizedDocument.normalization.domains.routes.source === 'top-level', 'WP-15 native bridge fixture reads routes from top-level domain');
  context.assert(normalizedDocument.normalization && normalizedDocument.normalization.domains.schedules.source === 'top-level', 'WP-15 native bridge fixture reads schedules from top-level domain');
  context.assert(Array.isArray(normalizedDocument.adapters) && normalizedDocument.adapters.length === 3, 'WP-15 native bridge fixture preserves adapter records');
  context.assert(Array.isArray(normalizedDocument.components) && normalizedDocument.components.length === 2, 'WP-15 native bridge fixture preserves component records');
  context.assert(Array.isArray(normalizedDocument.routes) && normalizedDocument.routes.length === 2, 'WP-15 native bridge fixture preserves route records');
  context.assert(
    Array.isArray(normalizedDocument.schedules) && normalizedDocument.schedules.some((schedule) => schedule.id === 'diagnostics.snapshot'),
    'WP-15 native bridge fixture preserves diagnostics schedule policy'
  );
  context.assert(Array.isArray(normalizedDocument.diagnostics) && normalizedDocument.diagnostics.length === 0, 'WP-15 native bridge fixture has no DSL diagnostics');

  context.assert(registry && registry.status === 'ready', 'WP-15 native bridge fixture creates ready runtime registries');
  context.assert(Array.isArray(registry.routes) && registry.routes.length === 2, 'WP-15 native bridge fixture creates two route entries');
  context.assert(Array.isArray(registry.components) && registry.components.length === 2, 'WP-15 native bridge fixture creates two component entries');
  context.assert(
    registry.routeRegistry && registry.routeRegistry.byPath && Array.isArray(registry.routeRegistry.byPath['/settings']) && registry.routeRegistry.byPath['/settings'].includes('settings'),
    'WP-15 native bridge fixture indexes settings route by path'
  );
  context.assert(
    registry.routeRegistry && registry.routeRegistry.byRouter && Array.isArray(registry.routeRegistry.byRouter['xtend.xrouter']) && registry.routeRegistry.byRouter['xtend.xrouter'].length === 2,
    'WP-15 native bridge fixture indexes routes by XRouter adapter'
  );
  context.assert(
    registry.componentRegistry && registry.componentRegistry.byTag && Array.isArray(registry.componentRegistry.byTag['x-card']) && registry.componentRegistry.byTag['x-card'].includes('pages.settings'),
    'WP-15 native bridge fixture indexes settings component by custom element tag'
  );
  context.assert(
    registry.componentRegistry && registry.componentRegistry.byAdapter && Array.isArray(registry.componentRegistry.byAdapter['xtend.component']) && registry.componentRegistry.byAdapter['xtend.component'].length === 2,
    'WP-15 native bridge fixture indexes components by XTend adapter'
  );
  context.assert(Array.isArray(registry.diagnostics) && registry.diagnostics.length === 0, 'WP-15 native bridge fixture required registry refs resolve cleanly');
  context.assert(Array.isArray(serializedDocument.routes) && serializedDocument.routes.length === 2, 'WP-15 native bridge serializer preserves route records');
  context.assert(Array.isArray(serializedDocument.components) && serializedDocument.components.length === 2, 'WP-15 native bridge serializer preserves component records');
  context.assert(serializedDocument.normalization && serializedDocument.normalization.schema === DSL_NORMALIZATION_SCHEMA, 'WP-15 native bridge serializer can include normalization summary');
}

function assertRmtNativeBridgeAdapterRegression(context, rootDir) {
  const appModules = createRmtAppModulesFromBundle(context, rootDir);
  if (!appModules) return;
  const format = appModules.createRmtFormat();
  const fixture = readJson('tests/fixtures/rmt-app-dsl.native-bridge.rmt', rootDir);
  const normalizedDocument = format.normalizeDocument(fixture);
  const registry = format.createRuntimeRegistries(normalizedDocument);
  const fakeRouterTarget = createFakeRouterTarget();
  const fakeDom = createFakeXtendDom();
  const xstate = createFakeXState();
  const schedulerCalls = [];
  const scheduler = {
    scheduleEndpoint(endpointName, scope, callback, options) {
      schedulerCalls.push({ endpointName, scope, callback, options });
      return { endpointName, scope, source: options && options.source };
    }
  };
  const diagnostics = [];
  const diagnosticsHub = {
    publish(event) {
      diagnostics.push(event);
    }
  };
  const manifest = {
    'x-section': './components/xsection.js',
    'x-card': './components/xcard.js'
  };
  const xrouterAdapter = appModules.createRmtXRouterAdapter({
    routerElement: fakeRouterTarget,
    xstate
  });
  const componentAdapter = appModules.createRmtXtendComponentAdapter({
    document: fakeDom.document,
    manifest,
    customElements: createFakeCustomElementsRegistry(['x-section', 'x-card']),
    xstate
  });
  const bridge = appModules.createRmtStateSchedulerDiagnosticsBridge({
    xstate,
    scheduler,
    diagnosticsHub,
    schedules: normalizedDocument.schedules,
    document: normalizedDocument
  });
  const stateBridgeResult = bridge.createStateBridge();
  const routeMapping = xrouterAdapter.mapRoutes(registry);
  const registerRoutesResult = xrouterAdapter.registerRoutes(registry, { render: false });
  const navigateResult = xrouterAdapter.navigate({ routeId: 'settings' }, {
    mapping: routeMapping,
    source: 'wp15-native-bridge'
  });
  const componentMapping = componentAdapter.mapComponents(registry, { manifest });
  const registerComponentResult = componentAdapter.registerComponent(registry, { manifest });
  const mountResult = componentAdapter.mountComponent(fakeDom.root, 'pages.settings', {
    label: 'Settings mounted'
  }, { mapping: componentMapping, manifest });
  const hydrateResult = componentAdapter.hydrateComponent(fakeDom.root, 'pages.settings', {
    label: 'Settings hydrated'
  }, { mapping: componentMapping, manifest });
  const routeRecordResult = bridge.recordAdapterResult(navigateResult, {
    scheduleRef: 'route.visible.render'
  });
  const componentRecordResult = bridge.recordAdapterResult(hydrateResult);

  context.assert(stateBridgeResult.ok === true, 'WP-15 native bridge creates state bridge before adapter result mirroring');
  context.assert(routeMapping.status === 'mapped' && routeMapping.routes.length === 2, 'WP-15 native bridge maps native routes through productive XRouter adapter');
  context.assert(
    routeMapping.routes.some((route) => route.id === 'settings' && route.attributes && route.attributes['data-rmt-schedule'] === 'route.visible.render'),
    'WP-15 native bridge maps route schedule refs into XRouter attributes'
  );
  context.assert(
    routeMapping.routes.some((route) => route.id === 'settings' && route.title === 'Settings' && route.documentTitle === 'Settings | Native Bridge'),
    'WP-15 native bridge preserves route title metadata for XRouter document title rewrite'
  );
  context.assert(
    routeMapping.routes.some((route) => route.id === 'settings' && route.attributes && route.attributes.title === 'Settings' && route.attributes['document-title'] === 'Settings | Native Bridge'),
    'WP-15 native bridge emits XRouter title attributes from RMT route metadata'
  );
  context.assert(registerRoutesResult.ok === true && fakeRouterTarget.calls.some((call) => call.operation === 'registerRoutes' && call.routes.length === 2), 'WP-15 native bridge registers native routes on XRouter target');
  context.assert(navigateResult.ok === true && navigateResult.metadata.path === '/settings', 'WP-15 native bridge navigates by native route id');
  context.assert(fakeRouterTarget.calls.some((call) => call.operation === 'navigate' && call.to === '/settings'), 'WP-15 native bridge forwards navigation to XRouter target');
  context.assert(componentMapping.status === 'mapped' && componentMapping.components.length === 2, 'WP-15 native bridge maps native XTend component records');
  context.assert(
    componentMapping.components.some((component) => component.id === 'pages.settings' && component.scheduleRef === 'component.idle.hydrate'),
    'WP-15 native bridge preserves component hydrate schedule ref'
  );
  context.assert(registerComponentResult.ok === true && registerComponentResult.status === 'ok', 'WP-15 native bridge registers mapped XTend components without diagnostics');
  context.assert(mountResult.ok === true && mountResult.metadata.componentId === 'pages.settings', 'WP-15 native bridge mounts settings component through productive adapter');
  context.assert(hydrateResult.ok === true && hydrateResult.metadata.scheduleRef === 'component.idle.hydrate', 'WP-15 native bridge hydrates settings component through productive adapter');
  context.assert(routeRecordResult.ok === true && routeRecordResult.metadata.scheduled === true, 'WP-15 native bridge records route adapter result and schedules route endpoint');
  context.assert(componentRecordResult.ok === true && componentRecordResult.metadata.scheduled === true, 'WP-15 native bridge records component adapter result and schedules hydrate endpoint');
  context.assert(schedulerCalls.some((call) => call.endpointName === 'xtendrmt.route.render'), 'WP-15 native bridge calls scheduler for route render endpoint');
  context.assert(schedulerCalls.some((call) => call.endpointName === 'xtendrmt.component.hydrate'), 'WP-15 native bridge calls scheduler for component hydrate endpoint');
  context.assert(xstate.values['rmt.route.settings.lastResult'] && xstate.values['rmt.route.settings.lastResult'].operation === 'navigate', 'WP-15 native bridge mirrors route result into xstate');
  context.assert(xstate.values['rmt.component.pages.settings.lastResult'] && xstate.values['rmt.component.pages.settings.lastResult'].operation === 'hydrateComponent', 'WP-15 native bridge mirrors component result into xstate');
  context.assert(!diagnostics.some((event) => event.code === 'rmt.bridge.adapter.result.degraded'), 'WP-15 native bridge happy path avoids degraded bridge diagnostics');
}

function assertRmtRuntimeEsmBundleSurface(context, rootDir) {
  const appModules = createRmtRuntimeAppModulesFromBundle(context, rootDir);
  if (!appModules) return;
  const requiredFactories = [
    'createRmtFormat',
    'createRmtXRouterAdapter',
    'createRmtXtendComponentAdapter',
    'createRmtStateSchedulerDiagnosticsBridge'
  ];
  requiredFactories.forEach((factoryName) => {
    context.assert(typeof appModules[factoryName] === 'function', `RMT runtime ESM bundle exposes ${factoryName}`);
  });
  if (requiredFactories.some((factoryName) => typeof appModules[factoryName] !== 'function')) return;

  const format = appModules.createRmtFormat();
  const fixture = readJson('tests/fixtures/rmt-app-dsl.native-bridge.rmt', rootDir);
  const registry = format.createRuntimeRegistries(fixture);
  const fakeRouterTarget = createFakeRouterTarget();
  const routeAdapter = appModules.createRmtXRouterAdapter({ routerElement: fakeRouterTarget });
  const mapping = routeAdapter.mapRoutes(registry);
  const result = routeAdapter.registerRoutes(registry);

  context.assert(registry.status === 'ready' && registry.routes.length === 2, 'RMT runtime ESM bundle creates native bridge registries');
  context.assert(mapping.status === 'mapped' && mapping.routes.length === 2, 'RMT runtime ESM bundle maps native bridge routes');
  context.assert(result.ok === true && fakeRouterTarget.calls.some((call) => call.operation === 'registerRoutes'), 'RMT runtime ESM bundle runs XRouter adapter against fake target');
}

function assertRmtBrowserNearRuntime(context, rootDir) {
  const appModules = createRmtBrowserAppModulesFromBundle(context, rootDir);
  if (!appModules) return;
  const requiredFactories = [
    'createRmtFormat',
    'createRmtXRouterAdapter',
    'createRmtXtendComponentAdapter',
    'createRmtStateSchedulerDiagnosticsBridge'
  ];
  requiredFactories.forEach((factoryName) => {
    context.assert(typeof appModules[factoryName] === 'function', `RMT browser runtime bundle exposes ${factoryName}`);
  });
  if (requiredFactories.some((factoryName) => typeof appModules[factoryName] !== 'function')) return;

  const format = appModules.createRmtFormat();
  const fixture = readJson('tests/fixtures/rmt-app-dsl.native-bridge.rmt', rootDir);
  const normalizedDocument = format.normalizeDocument(fixture);
  const registry = format.createRuntimeRegistries(normalizedDocument);
  const fakeRouterTarget = createFakeRouterTarget();
  const fakeDom = createFakeXtendDom();
  const xstate = createFakeXState();
  const schedulerCalls = [];
  const scheduler = {
    scheduleEndpoint(endpointName, scope, callback, options) {
      schedulerCalls.push({ endpointName, scope, callback, options });
      return { endpointName, scope, source: options && options.source };
    }
  };
  const routeAdapter = appModules.createRmtXRouterAdapter({ routerElement: fakeRouterTarget });
  const componentAdapter = appModules.createRmtXtendComponentAdapter({
    document: fakeDom.document,
    manifest: {
      'x-section': './components/xsection.js',
      'x-card': './components/xcard.js'
    },
    customElements: createFakeCustomElementsRegistry(['x-section', 'x-card'])
  });
  const bridge = appModules.createRmtStateSchedulerDiagnosticsBridge({
    xstate,
    scheduler,
    schedules: normalizedDocument.schedules
  });
  const routeMapping = routeAdapter.mapRoutes(registry);
  const routeRegistration = routeAdapter.registerRoutes(registry);
  const componentMapping = componentAdapter.mapComponents(registry);
  const componentRegistration = componentAdapter.registerComponent(registry);
  const bridgeResult = bridge.recordAdapterResult(routeRegistration, {
    scheduleRef: 'route.visible.render'
  });

  context.assert(normalizedDocument.normalization && normalizedDocument.normalization.status === 'normalized', 'RMT browser-near runtime normalizes native bridge fixture');
  context.assert(routeMapping.status === 'mapped' && routeMapping.routes.length === 2, 'RMT browser-near runtime maps native routes');
  context.assert(routeRegistration.ok === true && fakeRouterTarget.calls.some((call) => call.operation === 'registerRoutes'), 'RMT browser-near runtime registers routes through adapter target');
  context.assert(componentMapping.status === 'mapped' && componentMapping.components.length === 2, 'RMT browser-near runtime maps XTend components');
  context.assert(componentRegistration.ok === true, 'RMT browser-near runtime registers XTend components');
  context.assert(bridgeResult.ok === true && bridgeResult.metadata.scheduled === true, 'RMT browser-near runtime records adapter result through bridge');
  context.assert(schedulerCalls.some((call) => call.endpointName === 'xtendrmt.route.render'), 'RMT browser-near runtime schedules route render endpoint');
}

function assertRmtBrowserSmokeFixtureContract(context, rootDir) {
  const fixture = readText('tests/browser/fixtures/rmt-xrouter-xtend-smoke.html', rootDir);
  const bestcaseHtml = readText('xtendrmt-bestcase.html', rootDir);

  context.assert(fixture.includes(WP16_BROWSER_SMOKE_FIXTURE_SCHEMA), 'RMT browser smoke fixture exposes stable WP-16 schema id');
  context.assert(fixture.includes('RMT_BROWSER_SMOKE_DOCUMENT'), 'RMT browser smoke fixture carries a native RMT document');
  context.assert(fixture.includes("id: 'vanilla.component'"), 'RMT browser smoke fixture declares non-XTend component adapter');
  context.assert(fixture.includes('createRmtXRouterAdapter'), 'RMT browser smoke fixture uses productive XRouter adapter factory');
  context.assert(fixture.includes('createRmtXtendComponentAdapter'), 'RMT browser smoke fixture uses productive XTend component adapter factory');
  context.assert(fixture.includes('createRmtStateSchedulerDiagnosticsBridge'), 'RMT browser smoke fixture uses productive bridge factory');
  context.assert(fixture.includes("recordCheck('xrouter rendered settings route'"), 'RMT browser smoke fixture checks route switching');
  context.assert(fixture.includes("recordCheck('xtend component hydrated by adapter'"), 'RMT browser smoke fixture checks XTend hydration');
  context.assert(fixture.includes("recordCheck('scheduler route endpoint recorded'"), 'RMT browser smoke fixture checks route scheduler endpoint');
  context.assert(fixture.includes("recordCheck('vanilla host component mounted'"), 'RMT browser smoke fixture checks vanilla host mounting');
  context.assert(bestcaseHtml.includes('tests/browser/fixtures/rmt-xrouter-xtend-smoke.html'), 'Bestcase HTML references WP-16 RMT browser smoke fixture');
}

function assertRmtXRouterAdapterRuntime(context, rootDir) {
  const appModules = createRmtAppModulesFromBundle(context, rootDir);
  if (!appModules) return;
  const format = appModules.createRmtFormat();
  const fixture = readJson('tests/fixtures/rmt-app-dsl.normalized.rmt', rootDir);
  const registry = format.createRuntimeRegistries(fixture);
  const targetCalls = [];
  const fakeRouterTarget = {
    registerRoutes(routes, options) {
      targetCalls.push({ operation: 'registerRoutes', routes, options });
      return { routeCount: routes.length, source: options && options.source };
    },
    navigate(to, options) {
      targetCalls.push({ operation: 'navigate', to, options });
      return { to, source: options && options.source };
    }
  };
  const adapter = appModules.createRmtXRouterAdapter({ routerElement: fakeRouterTarget });
  const mapping = adapter.mapRoutes(registry);
  const registerResult = adapter.registerRoutes(registry, { render: false });
  const navigateResult = adapter.navigate({ routeId: 'home' }, {
    mapping,
    source: 'rmt-test'
  });
  const diagnosticCodes = adapter.listDiagnosticCodes();

  context.assert(adapter.schema === XROUTER_ADAPTER_SCHEMA, 'RMT XRouter adapter exposes stable schema');
  context.assert(adapter.id === 'xtend.xrouter', 'RMT XRouter adapter exposes stable adapter id');
  context.assert(adapter.kind === 'router_adapter', 'RMT XRouter adapter is a router adapter');
  assertIncludesAll(context, adapter.runtimeSurface, ['registerRoutes', 'navigate', 'emitDiagnostic'], 'RMT XRouter adapter runtime surface');
  assertIncludesAll(context, adapter.capabilities && adapter.capabilities.providedCapabilities, ['routes', 'navigation', 'params', 'query', 'diagnostics', 'scheduleRefs'], 'RMT XRouter adapter capabilities');
  context.assert(mapping.schema === XROUTER_ADAPTER_SCHEMA, 'RMT XRouter adapter mapping emits stable schema');
  context.assert(mapping.status === 'mapped', 'RMT XRouter adapter maps complete route registry without diagnostics');
  context.assert(Array.isArray(mapping.routes) && mapping.routes.length === 1, 'RMT XRouter adapter maps registry routes for xtend.xrouter');
  context.assert(mapping.routes[0] && mapping.routes[0].id === 'home', 'RMT XRouter adapter preserves route id');
  context.assert(mapping.routes[0] && mapping.routes[0].path === '/', 'RMT XRouter adapter preserves route path');
  context.assert(mapping.routes[0] && mapping.routes[0].component === 'pages.home', 'RMT XRouter adapter preserves component ref');
  context.assert(mapping.routes[0] && mapping.routes[0].title === 'Home', 'RMT XRouter adapter preserves route title for document title rewrite');
  context.assert(mapping.routes[0] && mapping.routes[0].documentTitle === 'Home | XTend RMT Fixture', 'RMT XRouter adapter preserves explicit document title');
  context.assert(mapping.routes[0] && mapping.routes[0].template === 'home.shell', 'RMT XRouter adapter preserves template ref');
  context.assert(mapping.routes[0] && mapping.routes[0].scheduleRef === 'route.visible.render', 'RMT XRouter adapter preserves schedule ref');
  context.assert(
    mapping.routes[0] && mapping.routes[0].attributes && mapping.routes[0].attributes['data-rmt-schedule'] === 'route.visible.render',
    'RMT XRouter adapter emits XRouter route schedule attribute'
  );
  context.assert(
    mapping.routes[0] && mapping.routes[0].attributes && mapping.routes[0].attributes.title === 'Home' && mapping.routes[0].attributes['document-title'] === 'Home | XTend RMT Fixture',
    'RMT XRouter adapter emits XRouter route title attributes'
  );
  context.assert(registerResult.ok === true && registerResult.operation === 'registerRoutes', 'RMT XRouter adapter registers mapped routes');
  context.assert(registerResult.metadata && registerResult.metadata.registeredOnTarget === true, 'RMT XRouter adapter reports target registration');
  context.assert(targetCalls.some((call) => call.operation === 'registerRoutes' && call.routes.length === 1), 'RMT XRouter adapter calls target registerRoutes');
  context.assert(navigateResult.ok === true && navigateResult.operation === 'navigate', 'RMT XRouter adapter navigates through target');
  context.assert(navigateResult.metadata && navigateResult.metadata.path === '/', 'RMT XRouter adapter resolves routeId to path during navigation');
  context.assert(targetCalls.some((call) => call.operation === 'navigate' && call.to === '/'), 'RMT XRouter adapter calls target navigate with mapped path');
  assertIncludesAll(
    context,
    diagnosticCodes,
    ['rmt.xrouter.route.missing_path', 'rmt.xrouter.route.missing_component', 'rmt.xrouter.target.missing', 'rmt.xrouter.navigation.skipped'],
    'RMT XRouter adapter diagnostic code list'
  );
}

function createFakeXtendDom() {
  const documentTarget = {
    createElement(tagName) {
      const element = {
        tagName: String(tagName || '').toUpperCase(),
        attributes: {},
        children: [],
        listeners: {},
        ownerDocument: documentTarget,
        innerHTML: '',
        setAttribute(name, value) {
          this.attributes[name] = String(value);
        },
        appendChild(child) {
          this.children.push(child);
          return child;
        },
        addEventListener(eventName, handler, options) {
          this.listeners[eventName] = { handler, options };
        },
        querySelector(selector) {
          if (selector.startsWith('[data-rmt-component-id="')) {
            const id = selector.slice('[data-rmt-component-id="'.length, -2);
            return this.children.find((child) => child.attributes && child.attributes['data-rmt-component-id'] === id) || null;
          }
          return this.children.find((child) => child.tagName && child.tagName.toLowerCase() === selector.toLowerCase()) || null;
        },
        hydrate(model, options) {
          this.hydrateCall = { model, options };
        }
      };
      return element;
    },
    createTextNode(text) {
      return {
        nodeType: 3,
        textContent: String(text || '')
      };
    }
  };
  return {
    document: documentTarget,
    root: documentTarget.createElement('div')
  };
}

function createFakeRouterTarget() {
  const calls = [];
  return {
    calls,
    registerRoutes(routes, options) {
      calls.push({ operation: 'registerRoutes', routes, options });
      return { routeCount: routes.length, source: options && options.source };
    },
    navigate(to, options) {
      calls.push({ operation: 'navigate', to, options });
      return { to, source: options && options.source };
    }
  };
}

function createFakeXState() {
  const values = {};
  return {
    values,
    set(key, value) {
      values[key] = value;
    },
    get(key) {
      return values[key];
    }
  };
}

function createFakeCustomElementsRegistry(tags = []) {
  const tagSet = new Set(tags);
  return {
    get(tagName) {
      return tagSet.has(tagName) || String(tagName || '').startsWith('x-')
        ? function TestElement() {}
        : undefined;
    }
  };
}

function assertRmtXtendComponentAdapterRuntime(context, rootDir) {
  const appModules = createRmtAppModulesFromBundle(context, rootDir);
  if (!appModules) return;
  const format = appModules.createRmtFormat();
  const fixture = readJson('tests/fixtures/rmt-app-dsl.normalized.rmt', rootDir);
  const fixtureWithComponentDetails = {
    ...fixture,
    components: fixture.components.map((component) => component.id === 'pages.home'
      ? {
        ...component,
        props: {
          label: 'RMT Home',
          layout: 'column'
        },
        attributes: {
          'data-route': 'home'
        },
        slots: {
          default: {
            text: 'Home slot'
          }
        },
        events: {
          'section-ready': {
            commandName: 'fixture.section.ready'
          }
        },
        hydration: {
          mode: 'runtime_render',
          ownershipMode: 'managed_subtree'
        }
      }
      : component)
  };
  const registry = format.createRuntimeRegistries(fixtureWithComponentDetails);
  const fakeDom = createFakeXtendDom();
  const commands = [];
  const adapter = appModules.createRmtXtendComponentAdapter({
    document: fakeDom.document,
    manifest: {
      'x-section': './components/xsection.js'
    },
    customElements: {
      get(tagName) {
        return tagName === 'x-section' ? function XSection() {} : undefined;
      }
    },
    dispatchCommand(commandName, payload) {
      commands.push({ commandName, payload });
    }
  });
  const mapping = adapter.mapComponents(registry);
  const registerResult = adapter.registerComponent(registry);
  const mountResult = adapter.mountComponent(fakeDom.root, 'pages.home', {
    label: 'Mounted Home'
  }, { mapping });
  const mountedElement = fakeDom.root.children[0];
  const mountedLabel = mountedElement && mountedElement.label;
  if (mountedElement && mountedElement.listeners && mountedElement.listeners['section-ready']) {
    mountedElement.listeners['section-ready'].handler({ detail: { ready: true } });
  }
  const hydrateResult = adapter.hydrateComponent(fakeDom.root, 'pages.home', {
    label: 'Hydrated Home'
  }, { mapping });
  const diagnosticCodes = adapter.listDiagnosticCodes();

  context.assert(adapter.schema === XTEND_COMPONENT_ADAPTER_SCHEMA, 'RMT XTend component adapter exposes stable schema');
  context.assert(adapter.id === 'xtend.component', 'RMT XTend component adapter exposes stable adapter id');
  context.assert(adapter.kind === 'component_adapter', 'RMT XTend component adapter is a component adapter');
  assertIncludesAll(context, adapter.runtimeSurface, ['registerComponent', 'mountComponent', 'hydrateComponent', 'emitDiagnostic'], 'RMT XTend component adapter runtime surface');
  assertIncludesAll(context, adapter.capabilities && adapter.capabilities.providedCapabilities, ['components', 'customElements', 'manifestLookup', 'props', 'attributes', 'slots', 'events', 'hydration', 'diagnostics', 'scheduleRefs'], 'RMT XTend component adapter capabilities');
  context.assert(mapping.schema === XTEND_COMPONENT_ADAPTER_SCHEMA, 'RMT XTend component adapter mapping emits stable schema');
  context.assert(mapping.status === 'mapped', 'RMT XTend component adapter maps complete component registry without diagnostics');
  context.assert(Array.isArray(mapping.components) && mapping.components.length === 1, 'RMT XTend component adapter maps registry components for xtend.component');
  context.assert(mapping.components[0] && mapping.components[0].id === 'pages.home', 'RMT XTend component adapter preserves component id');
  context.assert(mapping.components[0] && mapping.components[0].tag === 'x-section', 'RMT XTend component adapter preserves custom element tag');
  context.assert(mapping.components[0] && mapping.components[0].scheduleRef === 'component.visible.mount', 'RMT XTend component adapter preserves schedule ref');
  context.assert(mapping.components[0] && mapping.components[0].props && mapping.components[0].props.label === 'RMT Home', 'RMT XTend component adapter preserves props');
  context.assert(mapping.components[0] && mapping.components[0].serializedAttributes && mapping.components[0].serializedAttributes['data-route'] === 'home', 'RMT XTend component adapter serializes attributes');
  context.assert(registerResult.ok === true && registerResult.operation === 'registerComponent', 'RMT XTend component adapter registers mapped components');
  context.assert(mountResult.ok === true && mountResult.operation === 'mountComponent', 'RMT XTend component adapter mounts mapped component');
  context.assert(mountedElement && mountedElement.tagName === 'X-SECTION', 'RMT XTend component adapter creates the Custom Element tag');
  context.assert(mountedElement && mountedElement.attributes['data-rmt-component-id'] === 'pages.home', 'RMT XTend component adapter marks mounted component id');
  context.assert(mountedElement && mountedElement.attributes['data-rmt-schedule'] === 'component.visible.mount', 'RMT XTend component adapter forwards schedule attribute');
  context.assert(mountedElement && mountedElement.attributes['data-route'] === 'home', 'RMT XTend component adapter applies declared attributes');
  context.assert(mountedLabel === 'Mounted Home', 'RMT XTend component adapter applies model-overridden props');
  context.assert(mountedElement && mountedElement.children.some((child) => child.textContent === 'Home slot'), 'RMT XTend component adapter appends slot text');
  context.assert(commands.some((entry) => entry.commandName === 'fixture.section.ready'), 'RMT XTend component adapter bridges component events');
  context.assert(hydrateResult.ok === true && hydrateResult.operation === 'hydrateComponent', 'RMT XTend component adapter hydrates mapped component');
  context.assert(mountedElement && mountedElement.attributes['data-xtend-hydrated'] === 'true', 'RMT XTend component adapter marks hydrated component');
  context.assert(mountedElement && mountedElement.hydrateCall && mountedElement.hydrateCall.model.label === 'Hydrated Home', 'RMT XTend component adapter calls component hydrate when available');
  assertIncludesAll(
    context,
    diagnosticCodes,
    ['rmt.xtend.component.missing_tag', 'rmt.xtend.component.target.missing', 'rmt.xtend.component.manifest.missing', 'rmt.xtend.component.custom_element.unregistered', 'rmt.xtend.component.mount.skipped', 'rmt.xtend.component.hydration.skipped'],
    'RMT XTend component adapter diagnostic code list'
  );
}

function assertRmtStateSchedulerDiagnosticsBridgeRuntime(context, rootDir) {
  const appModules = createRmtAppModulesFromBundle(context, rootDir);
  if (!appModules) return;
  const fixture = readJson('tests/fixtures/rmt-app-dsl.normalized.rmt', rootDir);
  const xstateValues = {};
  const xstate = {
    set(key, value) {
      xstateValues[key] = value;
    },
    get(key) {
      return xstateValues[key];
    }
  };
  const schedulerCalls = [];
  const scheduler = {
    scheduleEndpoint(endpointName, scope, callback, options) {
      schedulerCalls.push({ endpointName, scope, callback, options });
      return { endpointName, scope, source: options && options.source };
    }
  };
  const publishedDiagnostics = [];
  const diagnosticsHub = {
    publish(event) {
      publishedDiagnostics.push(event);
    }
  };
  const bridge = appModules.createRmtStateSchedulerDiagnosticsBridge({
    xstate,
    scheduler,
    diagnosticsHub,
    schedules: fixture.schedules
  });
  const stateBridgeResult = bridge.createStateBridge();
  stateBridgeResult.handle.set('fixture.ready', { ok: true });
  const routeSchedule = bridge.resolveSchedulePolicy('route.visible.render');
  const scheduledResult = bridge.scheduleEndpoint(routeSchedule.endpointName, routeSchedule.scope, () => ({ rendered: true }), {
    schedule: routeSchedule
  });
  const adapterResult = bridge.recordAdapterResult({
    ok: true,
    status: 'ok',
    adapterId: 'xtend.xrouter',
    operation: 'navigate',
    phase: 'activate',
    metadata: {
      routeId: 'home',
      scheduleRef: 'route.visible.render'
    },
    diagnostics: []
  });
  const degradedResult = bridge.recordAdapterResult({
    ok: false,
    status: 'degraded',
    adapterId: 'xtend.component',
    operation: 'mountComponent',
    phase: 'mount',
    metadata: {
      componentId: 'pages.home',
      scheduleRef: 'component.visible.mount'
    },
    diagnostics: [
      {
        level: 'warn',
        code: 'rmt.xtend.component.target.missing',
        message: 'Missing test target.',
        operation: 'mountComponent',
        phase: 'mount'
      }
    ]
  });
  const diagnosticResult = bridge.emitDiagnostic({
    level: 'info',
    code: 'rmt.test.bridge.diagnostic',
    message: 'Bridge test diagnostic.'
  }, { source: 'rmt-test' });
  const telemetryResult = bridge.recordTelemetrySnapshot({
    schema: 'xtend.fabric.telemetry-snapshot.v1',
    id: 'fabric.snapshot.route.home',
    source: 'fabric',
    correlationId: 'home',
    metadata: {
      activeRoute: 'home',
      token: 'secret'
    },
    backpressure: {
      schema: 'xtend.fabric.backpressure-signal.v1',
      level: 'high',
      score: 8,
      action: 'defer-background-work',
      lane: 'idle',
      reason: 'route-pressure',
      metadata: {
        authorization: 'secret'
      }
    }
  }, {
    scheduleRef: 'diagnostics.snapshot',
    routeRef: 'home',
    runInline: true
  });
  const diagnosticCodes = bridge.listDiagnosticCodes();

  context.assert(bridge.schema === STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_SCHEMA, 'RMT bridge exposes stable schema');
  context.assert(bridge.id === 'rmt.state-scheduler-diagnostics', 'RMT bridge exposes stable adapter id');
  context.assert(bridge.kind === 'host_adapter', 'RMT bridge is represented as host adapter boundary');
  assertIncludesAll(context, bridge.runtimeSurface, ['createStateBridge', 'scheduleEndpoint', 'emitDiagnostic', 'recordAdapterResult', 'recordTelemetrySnapshot', 'recordBackpressureSignal'], 'RMT bridge runtime surface');
  assertIncludesAll(context, bridge.capabilities && bridge.capabilities.providedCapabilities, ['stateBridge', 'schedulerEndpoints', 'diagnostics', 'adapterResults', 'performanceBudgets', 'lifecycleEvents', 'telemetrySnapshots', 'backpressureSignals'], 'RMT bridge capabilities');
  context.assert(stateBridgeResult.ok === true && stateBridgeResult.operation === 'createStateBridge', 'RMT bridge creates a state bridge');
  context.assert(xstateValues['rmt.bridge.ready'] && xstateValues['rmt.bridge.ready'].schema === STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_SCHEMA, 'RMT bridge mirrors readiness into xstate');
  context.assert(xstateValues['fixture.ready'] && xstateValues['fixture.ready'].ok === true, 'RMT bridge state handle mirrors custom state');
  context.assert(routeSchedule.endpointName === 'xtendrmt.route.render', 'RMT bridge resolves route schedule endpoint');
  context.assert(routeSchedule.budgetClass === 'interactive' && routeSchedule.deadlineMs === 120, 'RMT bridge preserves schedule performance budget');
  context.assert(scheduledResult.ok === true && scheduledResult.metadata.scheduled === true, 'RMT bridge schedules endpoint through host scheduler');
  context.assert(schedulerCalls.some((call) => call.endpointName === 'xtendrmt.route.render'), 'RMT bridge calls scheduler for route render endpoint');
  context.assert(adapterResult.ok === true && adapterResult.metadata.scheduleRef === 'route.visible.render', 'RMT bridge records adapter result schedule ref');
  context.assert(xstateValues['rmt.route.home.lastResult'] && xstateValues['rmt.route.home.lastResult'].operation === 'navigate', 'RMT bridge mirrors route adapter result');
  context.assert(degradedResult.ok === true && degradedResult.status === 'degraded', 'RMT bridge records degraded adapter result without failing bridge');
  context.assert(xstateValues['rmt.component.pages.home.lastResult'] && xstateValues['rmt.component.pages.home.lastResult'].operation === 'mountComponent', 'RMT bridge mirrors component adapter result');
  context.assert(publishedDiagnostics.some((entry) => entry.code === 'rmt.bridge.adapter.result.degraded'), 'RMT bridge publishes degraded adapter diagnostic');
  context.assert(diagnosticResult.ok === true && publishedDiagnostics.some((entry) => entry.code === 'rmt.test.bridge.diagnostic'), 'RMT bridge emits diagnostics through diagnostics hub');
  context.assert(telemetryResult.ok === true && telemetryResult.status === 'degraded', 'RMT bridge records Fabric telemetry snapshots with pressure awareness');
  context.assert(xstateValues['rmt.telemetry.lastSnapshot'] && xstateValues['rmt.telemetry.lastSnapshot'].id === 'fabric.snapshot.route.home', 'RMT bridge mirrors Fabric telemetry snapshots');
  context.assert(xstateValues['rmt.telemetry.lastSnapshot'].metadata.token === '[redacted]', 'RMT bridge redacts mirrored telemetry snapshot metadata');
  context.assert(xstateValues['rmt.backpressure.lastSignal'] && xstateValues['rmt.backpressure.lastSignal'].level === 'high', 'RMT bridge mirrors Fabric backpressure level');
  context.assert(xstateValues['rmt.backpressure.lastSignal'].metadata.authorization === '[redacted]', 'RMT bridge redacts mirrored backpressure metadata');
  context.assert(schedulerCalls.some((call) => call.endpointName === 'xtendrmt.diagnostics.snapshot'), 'RMT bridge schedules diagnostics snapshot endpoint for Fabric telemetry');
  context.assert(publishedDiagnostics.some((entry) => entry.code === 'rmt.bridge.backpressure.high'), 'RMT bridge publishes high backpressure diagnostic');
  context.assert(publishedDiagnostics.some((entry) => entry.code === 'rmt.bridge.telemetry.snapshot.recorded'), 'RMT bridge publishes telemetry snapshot diagnostic');
  assertIncludesAll(
    context,
    diagnosticCodes,
    ['rmt.bridge.state.mirrored', 'rmt.bridge.state.unavailable', 'rmt.bridge.scheduler.endpoint.scheduled', 'rmt.bridge.scheduler.endpoint.queued', 'rmt.bridge.diagnostics.emitted', 'rmt.bridge.adapter.result.degraded', 'rmt.bridge.telemetry.snapshot.recorded', 'rmt.bridge.backpressure.signal.recorded', 'rmt.bridge.backpressure.high', 'rmt.bridge.backpressure.critical'],
    'RMT bridge diagnostic code list'
  );
}

function assertRmtArtifactParityGate(context, rootDir) {
  const parity = clearRequire('scripts/verify_xtendrmt_artifact_parity.js', rootDir);
  const report = parity.runXtendRmtArtifactParity({ rootDir });
  const checkIds = Array.isArray(report.checks) ? report.checks.map((entry) => entry.id) : [];

  context.assert(parity.ARTIFACT_PARITY_SCHEMA === ARTIFACT_PARITY_SCHEMA, 'Artifact parity script exposes stable schema constant');
  context.assert(report && report.schema === 'xtend.rmt.artifact-parity-report.v1', 'Artifact parity gate emits stable report schema');
  context.assert(report && report.contract === ARTIFACT_PARITY_SCHEMA, 'Artifact parity gate reports the WP-13 contract id');
  context.assert(report && report.ok === true && report.status === 'passed', 'Artifact parity gate passes for synchronized XTendRMT artifacts');
  context.assert(report && report.failureCount === 0, 'Artifact parity gate reports zero drift failures');
  assertIncludesAll(
    context,
    checkIds,
    [
      'manifest-factory:createRmtXRouterAdapter',
      'manifest-factory:createRmtXtendComponentAdapter',
      'manifest-factory:createRmtStateSchedulerDiagnosticsBridge',
      'browser-artifact-parity-contract',
      'package-script:test-rmt-artifact-parity'
    ],
    'Artifact parity gate check ids'
  );
}

function assertRunnerAndWorkflow(context, modules, rootDir) {
  const config = modules.config;
  const packageJson = readJson('package.json', rootDir);
  const runnerSource = readText('scripts/run_xtend_tests.js', rootDir);
  const workflow = modules.workflow.createDeveloperWorkflow({
    tag: 'x-example',
    profile: 'routing',
    feature: 'state'
  });
  const verifyPlan = modules.workflow.createVerifyPlan({
    suite: 'rmt-compatibility'
  });
  const commandIds = Array.isArray(verifyPlan.commands) ? verifyPlan.commands.map((entry) => entry.id) : [];

  context.assert(config.rmtCompatibility && config.rmtCompatibility.minimumGate === MINIMUM_GATE, 'Scaffold config points RMT compatibility to dedicated gate');
  context.assert(
    config.rmtCompatibility && config.rmtCompatibility.fullGate === 'npm test',
    'Scaffold config keeps npm test as full RMT compatibility gate'
  );
  assertIncludesAll(context, config.rmtCompatibility && config.rmtCompatibility.requiredContracts, REQUIRED_RMT_CONTRACTS, 'Scaffold config required RMT contracts');
  context.assert(
    Array.isArray(config.testObligation.requiredSuites) && config.testObligation.requiredSuites.includes('rmt-compatibility'),
    'Scaffold config marks rmt-compatibility as required suite'
  );
  context.assert(runnerSource.includes("id: 'rmt-compatibility'"), 'Local test runner registers rmt-compatibility suite');
  context.assert(
    runnerSource.includes('native-domain') && runnerSource.includes('browser-near runtime'),
    'Local test runner describes RMT native-domain and browser-near runtime gates'
  );
  context.assert(packageJson.scripts && packageJson.scripts['test:rmt-compatibility'] === 'node scripts/run_xtend_tests.js rmt-compatibility', 'Package scripts expose test:rmt-compatibility');
  context.assert(packageJson.scripts && packageJson.scripts['test:rmt-artifact-parity'] === 'node scripts/verify_xtendrmt_artifact_parity.js', 'Package scripts expose test:rmt-artifact-parity');

  context.assert(workflow.rmtCompatibility && workflow.rmtCompatibility.minimumGate === MINIMUM_GATE, 'Developer workflow exposes dedicated RMT compatibility minimum gate');
  context.assert(
    Array.isArray(workflow.rmtCompatibility.inspectCommands) && workflow.rmtCompatibility.inspectCommands.some((command) => command.includes('component-files')),
    'Developer workflow includes component-files in RMT compatibility inspection commands'
  );
  context.assert(verifyPlan.selectedSuites.includes('rmt-compatibility'), 'Verify plan selects rmt-compatibility when requested');
  context.assert(verifyPlan.requiredSuites.includes('rmt-compatibility'), 'Verify plan treats rmt-compatibility as required');
  context.assert(commandIds.includes('rmt-compatibility'), 'Verify plan contains rmt-compatibility command');
  context.assert(
    verifyPlan.commands.some((entry) => entry.id === 'rmt-compatibility' && entry.command === MINIMUM_GATE),
    'Verify plan rmt-compatibility command uses dedicated gate'
  );
}

function runRmtCompatibilitySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-compatibility',
    label: 'XTendRMT compatibility gates'
  });
  const modules = {
    config: clearRequire('xtend-builder/scaffold.config.js', rootDir),
    typing: clearRequire('xtend-builder/typing/component-types.js', rootDir),
    preview: clearRequire('xtend-builder/preview/component-preview.js', rootDir),
    extensions: clearRequire('xtend-builder/extensions/component-extension-points.js', rootDir),
    files: clearRequire('xtend-builder/generators/component-files.js', rootDir),
    workflow: clearRequire('xtend-builder/workflows/developer-workflow.js', rootDir)
  };

  context.assert(modules.typing.RMT_COMPATIBILITY_BINDING_SCHEMA === RMT_COMPATIBILITY_SCHEMA, 'Typing module exposes RMT compatibility schema constant');
  context.assert(modules.preview.RMT_COMPATIBILITY_BINDING_SCHEMA === RMT_COMPATIBILITY_SCHEMA, 'Preview module exposes RMT compatibility schema constant');
  context.assert(modules.extensions.RMT_COMPATIBILITY_BINDING_SCHEMA === RMT_COMPATIBILITY_SCHEMA, 'Extensions module exposes RMT compatibility schema constant');

  SCENARIOS.forEach((scenario) => {
    assertTypingPreviewExtensionScenario(context, modules, scenario);
  });
  assertRmtSchemaAndDemo(context, rootDir);
  assertRmtDslNormalizationRuntime(context, rootDir);
  assertRmtRuntimeRegistryRuntime(context, rootDir);
  assertRmtNativeBridgeFixtureRuntime(context, rootDir);
  assertRmtNativeBridgeAdapterRegression(context, rootDir);
  assertRmtRuntimeEsmBundleSurface(context, rootDir);
  assertRmtBrowserNearRuntime(context, rootDir);
  assertRmtBrowserSmokeFixtureContract(context, rootDir);
  assertRmtXRouterAdapterRuntime(context, rootDir);
  assertRmtXtendComponentAdapterRuntime(context, rootDir);
  assertRmtStateSchedulerDiagnosticsBridgeRuntime(context, rootDir);
  assertRmtArtifactParityGate(context, rootDir);
  assertRunnerAndWorkflow(context, modules, rootDir);

  return context.result({
    scenarios: SCENARIOS.map((scenario) => `${scenario.tag}/${scenario.profile}/${scenario.feature}`),
    schema: RMT_COMPATIBILITY_SCHEMA
  });
}

function printRmtCompatibilityReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTendRMT Compatibility Gates erfolgreich.',
    failureTitle: 'XTendRMT Compatibility Gates fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runRmtCompatibilitySuite();
  printRmtCompatibilityReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printRmtCompatibilityReport,
  runRmtCompatibilitySuite
};

const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
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
  DASHBOARD_SYMBOLS,
  DOM_COMMIT_RESULT_SCHEMA,
  DOM_RENDERER_FACTORY,
  DOM_RENDERER_MODULE_PATH,
  DOM_RENDERER_SCHEMA,
  KERNEL_ANALYSIS_TARGETS,
  KERNEL_BUILD_TARGETS,
  KERNEL_SOURCE_INPUTS,
  MICROKERNEL_PATH,
  MICROKERNEL_TYPES_PATH,
  MODULE_MANIFEST_PATH,
  SOURCE_MANIFEST_PATH,
  RMT_KERNEL_LAB_ANALYSIS_SCHEMA,
  RMT_KERNEL_LAB_BUILD_SCHEMA,
  RMT_KERNEL_MODULE_MANIFEST_SCHEMA,
  RMT_KERNEL_MVC_REPORT_SCHEMA,
  RMT_KERNEL_SOURCE_MANIFEST_SCHEMA,
  analyzeKernelMvcArchitecture,
  cleanRmtKernelArtifactContent,
  createKernelOptimizationReport,
  createMicrokernelReport,
  createRmtKernelLabAnalysis,
  createRmtKernelLabBuild,
  findDeprecatedKernelBranding
} = require('../../xtend-builder/generators/rmt-kernel-lab');

const DEPRECATED_BRAND_NAME = ['Render', 'Man'].join('');
const DEPRECATED_FACTORY_PREFIX = `create${DEPRECATED_BRAND_NAME}`;

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-scaffold-kernel-lab-'));
}

function tempPath(rootDir, relativePath) {
  return path.join(rootDir, relativePath);
}

function copyTempFile(sourceRoot, targetRoot, relativePath) {
  const sourcePath = path.join(sourceRoot, relativePath);
  const targetPath = tempPath(targetRoot, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function assertNoDashboardSymbols(context, source, label) {
  const matches = DASHBOARD_SYMBOLS.filter((symbol) => source.includes(symbol));
  context.assert(matches.length === 0, `${label} does not contain Dashboard kernel symbols${matches.length ? ` (${matches.join(', ')})` : ''}`);
}

function assertNoDeprecatedBranding(context, source, label) {
  const matches = findDeprecatedKernelBranding(source);
  context.assert(matches.length === 0, `${label} does not contain deprecated kernel branding`);
}

function assertNoGermanKernelComments(context, source, label) {
  const germanCommentPattern = /\/\/[^\n]*(?:duerfen|Runtime-Pfad|Reaktive|nicht unterbrechen|destabilisieren)/u;
  context.assert(!germanCommentPattern.test(source), `${label} does not contain German kernel comments`);
}

function deprecatedFactory(name) {
  return `${DEPRECATED_FACTORY_PREFIX}${name}`;
}

function runScaffoldKernelLabSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'scaffold-kernel-lab',
    label: 'XTend Scaffold RMT KernelLab'
  });

  [
    'xtend-builder/generators/rmt-kernel-lab.js',
    'xtend-builder/generators/rmt-kernel-lab-dom-commit.js',
    'xtend-builder/generators/registry.js',
    'xtend-builder/lib/cli.js',
    'xtendrmt/kernel/modules/rmt-format.js',
    'xtendrmt/kernel/modules/rmt-input-routing-controller.js',
    'xtendrmt/kernel/modules/rmt-xtend-component-adapter.js',
    'xtendrmt/kernel/modules/rmt-surface-adapter.js',
    'xtendrmt/kernel/modules/rmt-state-telemetry-adapter.js',
    'xtendrmt/kernel/modules/rmt-template-binding-model.js',
    'xtendrmt/kernel/modules/rmt-template-trust-model.js',
    'xtendrmt/kernel/modules/rmt-template-recovery-model.js',
    'xtendrmt/kernel/modules/rmt-template-execution-model.js',
    'xtendrmt/kernel/modules/rmt-template-interaction-adapter.js',
    'xtendrmt/kernel/modules/rmt-template-execution-controller.js',
    'xtendrmt/kernel/modules/rmt-template-execution-path.js',
    'xtendrmt/kernel/modules/rmt-generic-host-adapter.js',
    'xtendrmt/kernel/modules/rmt-dom-compat-view-adapter.js',
    'xtendrmt/kernel/modules/rmt-public-island-controller.js',
    'xtendrmt/kernel/modules/rmt-public-api.js',
    'tests/builder/scaffold_kernel_lab_suite.js'
  ].forEach((relativePath) => {
    const syntax = syntaxCheckFile(relativePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${relativePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  const generatorSource = readText('xtend-builder/generators/rmt-kernel-lab.js', rootDir);
  const registrySource = readText('xtend-builder/generators/registry.js', rootDir);
  const cliSource = readText('xtend-builder/lib/cli.js', rootDir);
  const readme = readText('xtend-builder/README.md', rootDir);
  const generatorsReadme = readText('xtend-builder/generators/README.md', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);

  context.assert(generatorSource.includes(RMT_KERNEL_LAB_ANALYSIS_SCHEMA), 'KernelLab generator exposes analysis schema');
  context.assert(generatorSource.includes(RMT_KERNEL_LAB_BUILD_SCHEMA), 'KernelLab generator exposes build schema');
  context.assert(generatorSource.includes(RMT_KERNEL_MODULE_MANIFEST_SCHEMA), 'KernelLab generator exposes module manifest schema');
  context.assert(generatorSource.includes(RMT_KERNEL_MVC_REPORT_SCHEMA), 'KernelLab generator exposes MVC architecture report schema');
  const sourceManifest = readJson(SOURCE_MANIFEST_PATH, rootDir);
  context.assert(sourceManifest.schema === RMT_KERNEL_SOURCE_MANIFEST_SCHEMA, 'KernelLab owns a canonical source manifest');
  context.assert(!generatorSource.includes('EXPECTED_HISTORICAL_MODULE_COUNT = 26'), 'KernelLab derives bundled module counts from the canonical source manifest');
  const formatStackModules = sourceManifest.modules.filter((entry) => [
    'rmt-format-model',
    'rmt-input-routing-controller',
    'rmt-xtend-component-adapter',
    'rmt-surface-adapter',
    'rmt-state-telemetry-adapter'
  ].includes(entry.id));
  context.assert(formatStackModules.length === 5, 'KernelLab inventories the physically split Format MVC stack');
  context.assert(!sourceManifest.modules.some((entry) => entry.id === 'rmt-format'), 'KernelLab removes the mixed-role rmt-format composition module');
  context.assert(
    formatStackModules.every((entry) => entry.sourceMode === 'canonical' && entry.sourcePath && entry.ownershipDomains.length > 0),
    'Split Format MVC modules are canonical sources with explicit ownership'
  );
  context.assert(
    sourceManifest.modules.find((entry) => entry.id === 'rmt-format-model').mvcRole === 'model'
      && sourceManifest.modules.find((entry) => entry.id === 'rmt-input-routing-controller').mvcRole === 'controller'
      && sourceManifest.modules.filter((entry) => entry.id.startsWith('rmt-') && entry.id.endsWith('-adapter') && [
        'rmt-xtend-component-adapter',
        'rmt-surface-adapter',
        'rmt-state-telemetry-adapter'
      ].includes(entry.id)).every((entry) => entry.mvcRole === 'adapter' && entry.adapterDirection === 'output'),
    'Split Format modules declare Model, Controller and output-adapter roles without a composition loophole'
  );
  const templateModelIds = [
    'rmt-template-binding-model',
    'rmt-template-trust-model',
    'rmt-template-recovery-model',
    'rmt-template-execution-model'
  ];
  const templateModelModules = templateModelIds.map((id) => sourceManifest.modules.find((entry) => entry.id === id));
  context.assert(
    templateModelModules.every((entry) => entry && entry.mvcRole === 'model' && entry.capabilities.length === 0),
    'Template Binding, Trust, Recovery and Execution are capability-free Model sources'
  );
  const templateInteractionAdapter = sourceManifest.modules.find((entry) => entry.id === 'rmt-template-interaction-adapter');
  const templateExecutionController = sourceManifest.modules.find((entry) => entry.id === 'rmt-template-execution-controller');
  const templateExecutionComposition = sourceManifest.modules.find((entry) => entry.id === 'rmt-template-execution-path');
  context.assert(
    templateInteractionAdapter
      && templateInteractionAdapter.mvcRole === 'adapter'
      && templateInteractionAdapter.adapterDirection === 'output'
      && templateInteractionAdapter.ports.includes('RmtTemplateInteractionPort'),
    'Template DOM and binding interaction is isolated behind an output-adapter port'
  );
  context.assert(
    templateExecutionController
      && templateExecutionController.mvcRole === 'controller'
      && templateExecutionController.capabilities.length === 0
      && templateExecutionController.ports.includes('RmtTemplateExecutionModelPort'),
    'Template execution orchestration is a browser-independent Controller'
  );
  context.assert(
    templateExecutionComposition
      && templateExecutionComposition.mvcRole === 'composition'
      && templateExecutionComposition.capabilities.length === 0
      && templateExecutionComposition.dependsOn.includes('rmt-template-execution-controller'),
    'Legacy createRmtTemplateExecutionPath factory is a delegating Composition Root'
  );
  const publicApiComposition = sourceManifest.modules.find((entry) => entry.id === 'rmt-public-api');
  const domCompatAdapter = sourceManifest.modules.find((entry) => entry.id === 'rmt-dom-compat-view-adapter');
  const publicIslandController = sourceManifest.modules.find((entry) => entry.id === 'rmt-public-island-controller');
  context.assert(
    publicApiComposition
      && publicApiComposition.mvcRole === 'composition'
      && publicApiComposition.capabilities.length === 0
      && !publicApiComposition.provides.includes('createRmtDomCompat'),
    'Public API is a capability-free Composition Root and no longer owns DOM compatibility'
  );
  context.assert(
    domCompatAdapter
      && domCompatAdapter.mvcRole === 'adapter'
      && domCompatAdapter.adapterDirection === 'output'
      && publicIslandController
      && publicIslandController.mvcRole === 'controller',
    'DOM compatibility and public Island lifecycle have distinct Adapter and Controller owners'
  );
  context.assert(registrySource.includes("id: 'rmt-kernel-lab'"), 'Generator registry exposes rmt-kernel-lab');
  context.assert(cliSource.includes("command === 'kernel-lab'"), 'CLI exposes kernel-lab command');
  context.assert(cliSource.includes("subcommand === 'kernel-lab'"), 'RMT CLI exposes rmt kernel-lab alias');
  context.assert(readme.includes('kernel-lab analyze --json'), 'Scaffold README documents kernel-lab analyze');
  context.assert(generatorsReadme.includes('rmt-kernel-lab'), 'Generator README documents rmt-kernel-lab');
  context.assert(packageManifest.scripts['test:scaffold-kernel-lab'] === 'node scripts/run_xtend_tests.js scaffold-kernel-lab', 'Package exposes scaffold KernelLab test script');
  context.assert(runner.includes("id: 'scaffold-kernel-lab'"), 'XTend test runner registers scaffold-kernel-lab gate');

  const validMvcManifest = {
    schema: RMT_KERNEL_SOURCE_MANIFEST_SCHEMA,
    architecture: { pattern: 'mvc', strict: true },
    modules: [
      {
        id: 'shared-contracts',
        sourcePath: 'fixtures/shared.js',
        sourceMode: 'canonical',
        mvcRole: 'shared',
        adapterDirection: null,
        provides: ['SharedPort'],
        consumes: [],
        dependsOn: [],
        ports: [],
        capabilities: [],
        ownershipDomains: ['shared.contracts'],
        targets: ['test']
      },
      {
        id: 'application-model',
        sourcePath: 'fixtures/model.js',
        sourceMode: 'canonical',
        mvcRole: 'model',
        adapterDirection: null,
        provides: ['ModelPort'],
        consumes: ['SharedPort'],
        dependsOn: ['shared-contracts'],
        ports: ['SharedPort'],
        capabilities: ['state.read', 'state.write'],
        ownershipDomains: ['model.test'],
        targets: ['test']
      }
    ]
  };
  const validMvc = analyzeKernelMvcArchitecture({
    rootDir,
    manifest: validMvcManifest,
    sources: {
      'fixtures/shared.js': 'export const SharedPort = {};',
      'fixtures/model.js': 'export const ModelPort = { getState() {}, setState() {} };'
    }
  });
  context.assert(validMvc.ok && validMvc.schema === RMT_KERNEL_MVC_REPORT_SCHEMA, 'KernelLab MVC gate accepts a valid Shared -> Model graph');

  const invalidMvcManifest = JSON.parse(JSON.stringify(validMvcManifest));
  invalidMvcManifest.modules.push({
    id: 'concrete-view',
    sourcePath: 'fixtures/view.js',
    sourceMode: 'canonical',
    mvcRole: 'view',
    adapterDirection: null,
    provides: ['ConcreteView'],
    consumes: [],
    dependsOn: ['application-model'],
    ports: ['ModelPort'],
    capabilities: ['dom.read'],
    ownershipDomains: ['view.test'],
    targets: ['test']
  });
  invalidMvcManifest.modules[1].dependsOn.push('concrete-view');
  invalidMvcManifest.modules[1].provides.push('SharedPort');
  invalidMvcManifest.modules[1].ownershipDomains.push('view.test');
  const invalidMvc = analyzeKernelMvcArchitecture({
    rootDir,
    manifest: invalidMvcManifest,
    sources: {
      'fixtures/shared.js': 'export const SharedPort = {};',
      'fixtures/model.js': 'export const ModelPort = {};\nconst quotePattern = /[\'\"]/u;\nconst clock = `${Date.now()}`;\ndocument.querySelector("main");',
      'fixtures/view.js': 'import { SharedPort } from "./shared.js";\nappModules.SharedPort;\ndocument.querySelector("main");'
    }
  });
  const invalidCodes = new Set(invalidMvc.violations.map((entry) => entry.code));
  context.assert(!invalidMvc.ok && invalidCodes.has('xtend.rmt.kernel_mvc.layer_edge'), 'KernelLab MVC gate blocks Model -> View dependencies');
  context.assert(invalidCodes.has('xtend.rmt.kernel_mvc.dependency_cycle'), 'KernelLab MVC gate blocks dependency cycles');
  context.assert(invalidCodes.has('xtend.rmt.kernel_mvc.duplicate_provider'), 'KernelLab MVC gate blocks duplicate providers');
  context.assert(invalidCodes.has('xtend.rmt.kernel_mvc.ownership_conflict'), 'KernelLab MVC gate blocks duplicate ownership');
  context.assert(invalidCodes.has('xtend.rmt.kernel_mvc.capability_undeclared'), 'KernelLab MVC gate blocks undeclared capabilities');
  context.assert(invalidCodes.has('xtend.rmt.kernel_mvc.role_capability'), 'KernelLab MVC gate blocks DOM access from Model modules');
  context.assert(invalidMvc.entries.find((entry) => entry.id === 'application-model').observedCapabilities.includes('dom.read'), 'KernelLab capability scanning continues after regular-expression literals containing quote characters');
  context.assert(invalidMvc.entries.find((entry) => entry.id === 'application-model').observedCapabilities.includes('host.clock'), 'KernelLab capability scanning inspects executable template-literal expressions');
  context.assert(invalidCodes.has('xtend.rmt.kernel_mvc.provider_missing'), 'KernelLab MVC gate blocks declared providers missing from canonical sources');
  context.assert(invalidCodes.has('xtend.rmt.kernel_mvc.consume_undeclared'), 'KernelLab MVC gate blocks undeclared provider consumption');
  context.assert(invalidCodes.has('xtend.rmt.kernel_mvc.dependency_undeclared'), 'KernelLab MVC gate blocks undeclared static and provider dependencies');

  const boundaryManifest = JSON.parse(JSON.stringify(validMvcManifest));
  boundaryManifest.architecture.strict = false;
  boundaryManifest.modules.push(
    {
      id: 'composition-loophole',
      sourcePath: 'fixtures/composition-loophole.js',
      sourceMode: 'canonical',
      mvcRole: 'composition',
      adapterDirection: null,
      provides: ['createCompositionLoophole'],
      consumes: [],
      dependsOn: [],
      ports: [],
      capabilities: ['dom.write'],
      ownershipDomains: ['composition.loophole'],
      targets: ['test']
    },
    {
      id: 'concrete-controller',
      sourcePath: 'fixtures/concrete-controller.js',
      sourceMode: 'canonical',
      mvcRole: 'controller',
      adapterDirection: null,
      provides: ['createConcreteController'],
      consumes: [],
      dependsOn: [],
      ports: ['RmtControllerPort'],
      capabilities: ['event.dispatch', 'state.write'],
      ownershipDomains: ['controller.concrete-view'],
      targets: ['test']
    },
    {
      id: 'descriptor-controller',
      sourcePath: 'fixtures/descriptor-controller.js',
      sourceMode: 'canonical',
      mvcRole: 'controller',
      adapterDirection: null,
      provides: ['createDescriptorController'],
      consumes: [],
      dependsOn: [],
      ports: ['RmtPresentationPort'],
      capabilities: [],
      ownershipDomains: ['controller.descriptor-fixture'],
      targets: ['test']
    },
    {
      id: 'concrete-host-controller',
      sourcePath: 'fixtures/concrete-host-controller.js',
      sourceMode: 'canonical',
      mvcRole: 'controller',
      adapterDirection: null,
      provides: ['createConcreteHostController'],
      consumes: [],
      dependsOn: [],
      ports: ['RmtHostPort'],
      capabilities: ['host.clock', 'host.scheduler', 'host.abort', 'global.read'],
      ownershipDomains: ['controller.concrete-host'],
      targets: ['test']
    },
    {
      id: 'invalid-input-adapter',
      sourcePath: 'fixtures/invalid-input-adapter.js',
      sourceMode: 'canonical',
      mvcRole: 'adapter',
      adapterDirection: 'input',
      provides: ['createInvalidInputAdapter'],
      consumes: [],
      dependsOn: [],
      ports: [],
      capabilities: ['dom.write', 'global.write'],
      ownershipDomains: ['input.invalid'],
      targets: ['test']
    },
    {
      id: 'misdirected-model',
      sourcePath: 'fixtures/misdirected-model.js',
      sourceMode: 'canonical',
      mvcRole: 'model',
      adapterDirection: 'output',
      provides: ['createMisdirectedModel'],
      consumes: [],
      dependsOn: [],
      ports: [],
      capabilities: [],
      ownershipDomains: ['model.misdirected'],
      targets: ['test']
    },
    {
      id: 'global-model',
      sourcePath: 'fixtures/global-model.js',
      sourceMode: 'canonical',
      mvcRole: 'model',
      adapterDirection: null,
      provides: ['createGlobalModel'],
      consumes: [],
      dependsOn: [],
      ports: [],
      capabilities: ['global.read', 'global.write'],
      ownershipDomains: ['model.global'],
      targets: ['test']
    },
    {
      id: 'nested-owner',
      sourcePath: 'fixtures/nested-owner.js',
      sourceMode: 'canonical',
      mvcRole: 'shared',
      adapterDirection: null,
      provides: ['NestedOwner'],
      consumes: [],
      dependsOn: [],
      ports: [],
      capabilities: [],
      ownershipDomains: ['shared.contracts.nested'],
      targets: ['test']
    }
  );
  const boundaryReport = analyzeKernelMvcArchitecture({
    rootDir,
    manifest: boundaryManifest,
    sources: {
      'fixtures/shared.js': 'export const SharedPort = {};',
      'fixtures/model.js': 'export const ModelPort = { getState() {}, setState() {} };',
      'fixtures/composition-loophole.js': 'export function createCompositionLoophole(node) { document.body.appendChild(node); }',
      'fixtures/concrete-controller.js': 'export function createConcreteController(target, state) { state.setState("ready", true); target.dispatchEvent(new CustomEvent("update")); }',
      'fixtures/descriptor-controller.js': 'export function createDescriptorController() { return { type: "element", tag: "button" }; }',
      'fixtures/concrete-host-controller.js': 'export function createConcreteHostController() { const controller = new AbortController(); queueMicrotask(() => Date.now()); return globalThis.location || controller.signal; }',
      'fixtures/invalid-input-adapter.js': 'export function createInvalidInputAdapter(node) { node.setAttribute("data-state", "ready"); globalThis.lastState = "ready"; }',
      'fixtures/misdirected-model.js': 'export function createMisdirectedModel() { return {}; }',
      'fixtures/global-model.js': 'export function createGlobalModel() { globalThis.AppModules = {}; return globalThis.AppModules; }',
      'fixtures/nested-owner.js': 'export const NestedOwner = {};'
    }
  });
  const boundaryCodes = new Set(boundaryReport.violations.map((entry) => entry.code));
  context.assert(boundaryCodes.has('xtend.rmt.kernel_mvc.strict_required'), 'KernelLab MVC gate cannot be disabled by a source manifest');
  context.assert(boundaryCodes.has('xtend.rmt.kernel_mvc.composition_root_invalid'), 'KernelLab MVC gate blocks logic-bearing composition roots without dependencies and ports');
  context.assert(boundaryCodes.has('xtend.rmt.kernel_mvc.role_capability_declared'), 'KernelLab MVC gate blocks forbidden declared Model, Controller and Composition capabilities');
  context.assert(boundaryCodes.has('xtend.rmt.kernel_mvc.mixed_role'), 'KernelLab MVC gate reports logic-bearing Composition modules as mixed roles');
  context.assert(boundaryCodes.has('xtend.rmt.kernel_mvc.controller_concrete_view'), 'KernelLab MVC gate blocks concrete browser-event access from Controllers');
  context.assert(boundaryReport.violations.some((entry) => entry.code === 'xtend.rmt.kernel_mvc.controller_concrete_view' && entry.moduleId === 'descriptor-controller' && entry.descriptorLiteral === true), 'KernelLab MVC gate blocks concrete tagged View descriptors inside Controllers');
  context.assert(boundaryCodes.has('xtend.rmt.kernel_mvc.controller_concrete_host'), 'KernelLab MVC gate blocks Clock, Scheduler and Global Host access from Controllers');
  context.assert(boundaryCodes.has('xtend.rmt.kernel_mvc.controller_state_write'), 'KernelLab MVC gate blocks direct state writes from Controllers');
  context.assert(boundaryCodes.has('xtend.rmt.kernel_mvc.port_missing'), 'KernelLab MVC gate requires typed Controller, Adapter and Composition ports');
  context.assert(boundaryCodes.has('xtend.rmt.kernel_mvc.adapter_capability_direction'), 'KernelLab MVC gate rejects capabilities that contradict an adapter direction');
  context.assert(boundaryCodes.has('xtend.rmt.kernel_mvc.adapter_direction_forbidden'), 'KernelLab MVC gate rejects adapter directions on non-adapter roles');
  context.assert(boundaryCodes.has('xtend.rmt.kernel_mvc.ownership_conflict'), 'KernelLab MVC gate detects hierarchical ownership-domain overlap');

  const compatibleMvcManifest = JSON.parse(JSON.stringify(validMvcManifest));
  compatibleMvcManifest.modules.push(
    {
      id: 'global-model-mirror',
      sourcePath: 'fixtures/global-model-mirror.js',
      sourceMode: 'canonical',
      mvcRole: 'model',
      adapterDirection: null,
      provides: ['createGlobalModelMirror'],
      consumes: [],
      dependsOn: [],
      ports: [],
      capabilities: ['global.read', 'global.write'],
      compatibility: {
        kind: '0.6-global-mirror',
        since: '0.6.0',
        removeBy: '0.7.0',
        reason: 'The 0.6 standalone fixture mirrors only its immutable model factory for compatibility.',
        allowedCapabilities: ['global.read', 'global.write']
      },
      ownershipDomains: ['model.global-mirror'],
      targets: ['test']
    },
    {
      id: 'legacy-compatibility-composer',
      sourcePath: 'fixtures/legacy-composer.js',
      sourceMode: 'canonical',
      mvcRole: 'composition',
      adapterDirection: null,
      provides: ['createLegacyComposer'],
      consumes: ['ModelPort'],
      dependsOn: ['application-model'],
      ports: ['RmtModelReader'],
      capabilities: ['state.read', 'global.read', 'global.write'],
      compatibility: {
        kind: '0.6-compatibility-composer',
        since: '0.6.0',
        removeBy: '0.7.0',
        reason: 'The 0.6 compatibility fixture only delegates immutable Model reads through its documented alias.',
        allowedCapabilities: ['state.read', 'global.read', 'global.write']
      },
      ownershipDomains: ['compatibility.composition.fixture'],
      targets: ['test']
    },
    {
      id: 'controller-global-shell',
      sourcePath: 'fixtures/controller-global-shell.js',
      sourceMode: 'canonical',
      mvcRole: 'controller',
      adapterDirection: null,
      provides: ['createControllerGlobalShell'],
      consumes: [],
      dependsOn: [],
      ports: ['RmtControllerPort'],
      capabilities: [],
      compatibilityShell: {
        kind: '0.6-global-mirror',
        since: '0.6.0',
        removeBy: '0.7.0',
        reason: 'The fixture mirrors only the immutable controller factory through a bounded 0.6 compatibility shell.'
      },
      ownershipDomains: ['controller.global-shell-fixture'],
      targets: ['test']
    }
  );
  const compatibleMvc = analyzeKernelMvcArchitecture({
    rootDir,
    manifest: compatibleMvcManifest,
    version: '0.6.9',
    sources: {
      'fixtures/shared.js': 'export const SharedPort = {};',
      'fixtures/model.js': 'export const ModelPort = { getState() {}, setState() {} };',
      'fixtures/global-model-mirror.js': 'export function createGlobalModelMirror() { globalThis.AppModules = {}; return globalThis.AppModules; }',
      'fixtures/legacy-composer.js': 'export function createLegacyComposer(model) { globalThis.AppModules = {}; return () => model.getState(); }',
      'fixtures/controller-global-shell.js': '/* xtend-kernel-mvc:compatibility-shell-start */\nglobalThis.ControllerFactory = createControllerGlobalShell;\n/* xtend-kernel-mvc:compatibility-shell-end */\nexport function createControllerGlobalShell(port) { return () => port.read(); }'
    }
  });
  context.assert(compatibleMvc.ok && compatibleMvc.compatibilityComposerCount === 1 && compatibleMvc.globalMirrorCompatibilityCount === 2, 'KernelLab permits non-expired, explicitly bounded compatibility facades and isolated global shells');
  const expiredCompatibleMvc = analyzeKernelMvcArchitecture({
    rootDir,
    manifest: compatibleMvcManifest,
    version: '0.7.0',
    sources: {
      'fixtures/shared.js': 'export const SharedPort = {};',
      'fixtures/model.js': 'export const ModelPort = { getState() {}, setState() {} };',
      'fixtures/global-model-mirror.js': 'export function createGlobalModelMirror() { globalThis.AppModules = {}; return globalThis.AppModules; }',
      'fixtures/legacy-composer.js': 'export function createLegacyComposer(model) { globalThis.AppModules = {}; return () => model.getState(); }',
      'fixtures/controller-global-shell.js': '/* xtend-kernel-mvc:compatibility-shell-start */\nglobalThis.ControllerFactory = createControllerGlobalShell;\n/* xtend-kernel-mvc:compatibility-shell-end */\nexport function createControllerGlobalShell(port) { return () => port.read(); }'
    }
  });
  context.assert(!expiredCompatibleMvc.ok && expiredCompatibleMvc.violations.some((entry) => entry.code === 'xtend.rmt.kernel_mvc.compatibility_expired'), 'KernelLab blocks compatibility records once currentVersion reaches removeBy');

  const unsafeCompatibilityManifest = JSON.parse(JSON.stringify(compatibleMvcManifest));
  const unsafeComposer = unsafeCompatibilityManifest.modules.find((entry) => entry.id === 'legacy-compatibility-composer');
  unsafeComposer.capabilities = ['dom.read'];
  unsafeComposer.compatibility.allowedCapabilities = ['dom.read'];
  const unsafeCompatibility = analyzeKernelMvcArchitecture({
    rootDir,
    manifest: unsafeCompatibilityManifest,
    sources: {
      'fixtures/shared.js': 'export const SharedPort = {};',
      'fixtures/model.js': 'export const ModelPort = { getState() {}, setState() {} };',
      'fixtures/global-model-mirror.js': 'export function createGlobalModelMirror() { globalThis.AppModules = {}; return globalThis.AppModules; }',
      'fixtures/legacy-composer.js': 'export function createLegacyComposer() { return document.querySelector("main"); }'
    }
  });
  context.assert(unsafeCompatibility.violations.some((entry) => entry.code === 'xtend.rmt.kernel_mvc.compatibility_capability_invalid'), 'KernelLab never permits View, event, mutation or Host logic through a compatibility-composer label');

  const expiredCompatibilityManifest = JSON.parse(JSON.stringify(compatibleMvcManifest));
  expiredCompatibilityManifest.modules.find((entry) => entry.id === 'legacy-compatibility-composer').compatibility.removeBy = '1.0.0';
  const expiredCompatibility = analyzeKernelMvcArchitecture({
    rootDir,
    manifest: expiredCompatibilityManifest,
    sources: {
      'fixtures/shared.js': 'export const SharedPort = {};',
      'fixtures/model.js': 'export const ModelPort = { getState() {}, setState() {} };',
      'fixtures/global-model-mirror.js': 'export function createGlobalModelMirror() { globalThis.AppModules = {}; return globalThis.AppModules; }',
      'fixtures/legacy-composer.js': 'export function createLegacyComposer(model) { globalThis.AppModules = {}; return () => model.getState(); }'
    }
  });
  context.assert(expiredCompatibility.violations.some((entry) => entry.code === 'xtend.rmt.kernel_mvc.compatibility_invalid'), 'KernelLab rejects unbounded or extended MVC compatibility exceptions');

  const dirtyJs = [
    "    function createOptionalCompatSnapshot() {",
    "        return Object.freeze({",
    "            browserHostAdapter: typeof appModules.createRmtBrowserHostAdapter === 'function'",
    `                || typeof appModules.${deprecatedFactory('BrowserHostAdapter')} === 'function',`,
    "            dashboardAdapter: typeof appModules.createRmtDashboardAdapter === 'function'",
    `                || typeof appModules.${deprecatedFactory('DashboardAdapter')} === 'function',`,
    "            dashboardCompatBootstrap: typeof appModules.createRmtDashboardCompatBootstrap === 'function'",
    `                || typeof appModules.${deprecatedFactory('DashboardCompatBootstrap')} === 'function',`,
    "            dashboardCommandCatalog: typeof appModules.createRmtDashboardCommandCatalog === 'function'",
    `                || typeof appModules.${deprecatedFactory('DashboardCommandCatalog')} === 'function'`,
    "        });",
    "    }",
    "",
    "    appModules.createRmtDashboardProductRuntime = function createRmtDashboardProductRuntime(deps = {}) {",
    `        return deps.${deprecatedFactory('DashboardProductRuntime')}();`,
    "    };",
    "})(__XTENDRMT_GLOBAL__);"
  ].join('\n');
  const cleanedJs = cleanRmtKernelArtifactContent(dirtyJs, 'xtendrmt/rmt-core.esm.js');
  assertNoDashboardSymbols(context, cleanedJs, 'Clean JS transform');
  assertNoDeprecatedBranding(context, cleanedJs, 'Clean JS transform');

  const dirtyHeader = [
    '/*!',
    ' * XTendRMT 0.3.0',
    ' * build target: rmt-core.esm',
    ' * format: esm',
    ' * generated at: 2026-05-03T18:31:08.225Z',
    ' */',
    'const AppModules = {};'
  ].join('\n');
  const cleanedHeader = cleanRmtKernelArtifactContent(dirtyHeader, 'xtendrmt/rmt-core.esm.js');
  context.assert(!cleanedHeader.includes('generated at:'), 'Clean JS transform removes legacy generated timestamp');
  context.assert(cleanedHeader.includes('generated by: xtend kernel-lab build --profile clean'), 'Clean JS transform records KernelLab build provenance');
  const versionedHeader = cleanRmtKernelArtifactContent(dirtyHeader, 'xtendrmt/rmt-core.esm.js', { version: '0.4.0' });
  context.assert(versionedHeader.includes('XTendRMT 0.4.0'), 'Clean JS transform applies explicit KernelLab version to header');
  context.assert(versionedHeader.includes('generated by: xtend kernel-lab build --profile clean --version 0.4.0'), 'Clean JS transform records explicit KernelLab version provenance');

  const dirtyKernelComment = [
    [
      String.fromCharCode(47, 47),
      ' Reaktive Subscribers ',
      'duerfen den Runtime-Pfad nicht unterbrechen.'
    ].join(''),
    'const ok = true;'
  ].join('\n');
  const cleanedKernelComment = cleanRmtKernelArtifactContent(dirtyKernelComment, 'xtendrmt/rmt-core.esm.js');
  context.assert(cleanedKernelComment.includes('// Reactive subscribers must not interrupt the runtime path.'), 'Clean JS transform normalizes German kernel comments to English');
  assertNoGermanKernelComments(context, cleanedKernelComment, 'Clean JS transform');

  const dirtyRuntimeVersion = [
    "const PUBLIC_API_VERSION = '0.3.0';",
    'const version = typeof AppModules.getRmtApiVersion === \'function\'',
    '    ? AppModules.getRmtApiVersion()',
    '    : "0.3.0";',
    'export { version, getRmtApiVersion };'
  ].join('\n');
  const cleanedRuntimeVersion = cleanRmtKernelArtifactContent(dirtyRuntimeVersion, 'xtendrmt/rmt-core.esm.js', { version: '0.4.0' });
  context.assert(cleanedRuntimeVersion.includes("const PUBLIC_API_VERSION = '0.4.0';"), 'Clean JS transform applies explicit KernelLab version to PUBLIC_API_VERSION');
  context.assert(cleanedRuntimeVersion.includes(': "0.4.0";'), 'Clean JS transform applies explicit KernelLab version to ESM fallback export');

  const dirtyTypes = [
    'export interface RmtOptionalCompatAvailability {',
    '    browserHostAdapter: boolean;',
    '    dashboardAdapter: boolean;',
    '    dashboardCompatBootstrap: boolean;',
    '    dashboardCommandCatalog: boolean;',
    '}'
  ].join('\n');
  assertNoDashboardSymbols(
    context,
    cleanRmtKernelArtifactContent(dirtyTypes, 'xtendrmt/rmt-core.d.ts'),
    'Clean d.ts transform'
  );
  const versionedTypes = cleanRmtKernelArtifactContent('// XTendRMT 0.3.0 type definitions\n', 'xtendrmt/rmt-core.d.ts', { version: '0.4.0' });
  context.assert(versionedTypes.includes('XTendRMT 0.4.0 type definitions'), 'Clean d.ts transform applies explicit KernelLab version');

  const dirtyManifest = JSON.stringify({
    entryPoints: {
      optionalCompat: {
        browserHostAdapter: 'createRmtBrowserHostAdapter',
        dashboardAdapter: 'createRmtDashboardAdapter',
        dashboardCompatBootstrap: 'createRmtDashboardCompatBootstrap',
        dashboardCommandCatalog: 'createRmtDashboardCommandCatalog'
      }
    },
    legacyCompatibility: {
      appModulesFactories: {
        browserHostAdapter: deprecatedFactory('BrowserHostAdapter'),
        dashboardAdapter: deprecatedFactory('DashboardAdapter'),
        dashboardCompatBootstrap: deprecatedFactory('DashboardCompatBootstrap'),
        dashboardCommandCatalog: deprecatedFactory('DashboardCommandCatalog')
      }
    }
  }, null, 2);
  assertNoDashboardSymbols(
    context,
    cleanRmtKernelArtifactContent(dirtyManifest, 'xtendrmt/rmt-manifest.json'),
    'Clean manifest transform'
  );
  assertNoDeprecatedBranding(
    context,
    cleanRmtKernelArtifactContent(dirtyManifest, 'xtendrmt/rmt-manifest.json'),
    'Clean manifest transform'
  );
  const versionedManifest = JSON.parse(cleanRmtKernelArtifactContent(dirtyManifest, 'xtendrmt/rmt-manifest.json', { version: '0.4.0' }));
  context.assert(versionedManifest.version === '0.4.0' && versionedManifest.apiVersion === '0.4.0', 'Clean manifest transform applies explicit KernelLab version');

  const dirtyOptimizationJs = [
    '/* modules/rmt-engine.js */',
    '(function registerRmtEngineModule(global) {',
    '    const appModules = global.AppModules || (global.AppModules = {});',
    "    const createRmtReactivityFactory = resolveFactory('createRmtReactivity', deps.createRmtReactivity)",
    "        || resolveFactory('createRmtReactivity', deps.createRmtReactivity);",
    "    const hasReactivity = typeof appModules.createRmtReactivity === 'function'",
    "        || typeof appModules.createRmtReactivity === 'function';",
    '    const reactivity = deps.reactivity',
    "        || (typeof appModules.createRmtReactivity === 'function'",
    '            ? appModules.createRmtReactivity({',
    '                now: schedulerNow,',
    '                diagnosticsHub',
    '            })',
    '            : null)',
    "        || (typeof appModules.createRmtReactivity === 'function'",
    '            ? appModules.createRmtReactivity({',
    '                now: schedulerNow,',
    '                diagnosticsHub',
    '            })',
    '            : null);',
    '    appModules.createRmtEngine = function createRmtEngine() {',
    '        return { reactivity, createRmtReactivityFactory, hasReactivity };',
    '    };',
    '})(__XTENDRMT_GLOBAL__);',
    'const AppModules = __XTENDRMT_GLOBAL__.AppModules;',
    'export { };',
    'export default AppModules;'
  ].join('\n');
  const optimizationRoot = tempRoot();
  const dirtyOptimizationReport = createKernelOptimizationReport(optimizationRoot, {
    'xtendrmt/rmt-core.esm.js': dirtyOptimizationJs
  });
  context.assert(dirtyOptimizationReport.redundantFallbacks.some((entry) => entry.factoryName === 'createRmtReactivity'), 'KernelLab optimization report detects duplicate reactivity fallback');
  context.assert(dirtyOptimizationReport.redundantFactoryResolution.some((entry) => entry.factoryName === 'createRmtReactivity'), 'KernelLab optimization report detects duplicate resolveFactory chain');
  context.assert(dirtyOptimizationReport.factoryAttributionWarnings.some((entry) => entry.factoryName === 'createRmtReactivity'), 'KernelLab optimization report flags comparison-only appModules factory attribution');
  const cleanedOptimizationJs = cleanRmtKernelArtifactContent(dirtyOptimizationJs, 'xtendrmt/rmt-core.esm.js');
  const cleanOptimizationReport = createKernelOptimizationReport(optimizationRoot, {
    'xtendrmt/rmt-core.esm.js': cleanedOptimizationJs
  });
  context.assert(cleanOptimizationReport.redundantFallbacks.length === 0, 'Clean JS transform removes duplicate reactivity fallbacks');
  context.assert(cleanOptimizationReport.redundantFactoryResolution.length === 0, 'Clean JS transform removes duplicate resolveFactory chains');

  const analysis = createRmtKernelLabAnalysis({ rootDir });
  context.assert(analysis.ok, 'KernelLab analysis succeeds');
  context.assert(analysis.schema === RMT_KERNEL_LAB_ANALYSIS_SCHEMA, 'KernelLab analysis uses analysis schema');
  context.assert(analysis.moduleManifest.schema === RMT_KERNEL_MODULE_MANIFEST_SCHEMA, 'KernelLab analysis embeds module manifest schema');
  context.assert(analysis.architectureReport && analysis.architectureReport.ok, 'KernelLab analysis enforces the canonical MVC source graph');
  context.assert(analysis.architectureReport.strict === true, 'KernelLab MVC architecture gate is mandatory');
  const architectureEntries = new Map((analysis.architectureReport.entries || []).map((entry) => [entry.id, entry]));
  const engineComposition = architectureEntries.get('rmt-engine');
  const engineHostAdapter = architectureEntries.get('rmt-engine-host-adapter');
  const engineController = architectureEntries.get('rmt-engine-controller');
  const commandBusController = architectureEntries.get('rmt-command-bus');
  const actionController = architectureEntries.get('rmt-action-effect-runtime-source');
  const orchestrationController = architectureEntries.get('rmt-kernel-orchestration-controller-source');
  const surfaceController = architectureEntries.get('xtend-surface-controller-source');
  context.assert(engineComposition
    && engineComposition.mvcRole === 'composition'
    && engineComposition.observedCapabilities.length === 0
    && engineComposition.dependsOn.includes('rmt-engine-host-adapter')
    && engineComposition.dependsOn.includes('rmt-engine-controller'),
  'Kernel engine Composition Root only wires its declared host and controller ports');
  context.assert(engineHostAdapter
    && engineHostAdapter.mvcRole === 'adapter'
    && engineHostAdapter.adapterDirection === 'host'
    && engineHostAdapter.observedCapabilities.includes('event.listen')
    && engineHostAdapter.observedCapabilities.includes('event.dispatch'),
  'Kernel engine host adapter exclusively owns concrete browser event effects');
  context.assert(engineController
    && engineController.mvcRole === 'controller'
    && !engineController.observedCapabilities.includes('event.listen')
    && !engineController.observedCapabilities.includes('event.dispatch')
    && !engineController.observedCapabilities.some((capability) => capability.startsWith('host.')),
  'Kernel engine controller schedules through ports without concrete browser event access');
  [commandBusController, actionController, orchestrationController, surfaceController].forEach((entry) => {
    context.assert(entry
      && entry.mvcRole === 'controller'
      && !entry.observedCapabilities.some((capability) => (
        capability.startsWith('host.') || capability.startsWith('global.')
      )), `${entry && entry.id || 'controller'} reaches Clock, Scheduler, Abort and Globals only through typed ports`);
  });
  context.assert(analysis.architectureReport.compatibilityComposerCount === 0, 'KernelLab has no expired 0.6 compatibility composers');
  context.assert(analysis.architectureReport.globalMirrorCompatibilityCount === 0, 'KernelLab has no global factory-mirror compatibility exceptions');
  context.assert(analysis.architectureReport.entries.every((entry) => !entry.compatibility && !entry.compatibilityShell), 'KernelLab source topology contains no removeBy 0.7 compatibility records');
  context.assert(!sourceManifest.modules.some((entry) => entry.id === 'rmt-priority-queue'), 'KernelLab topology contains no legacy kernel queue module');
  const engineControllerSource = readText('xtendrmt/kernel/modules/rmt-engine-controller.js', rootDir);
  context.assert(
    engineControllerSource.includes('schedulerAuthority.schedule(')
      && !/\b(?:createRmtQueue|priorityQueue|scheduledJobs|runScheduledJob)\b/u.test(engineControllerSource),
    'Engine Controller delegates every job to the injected microkernel without a shadow queue'
  );
  context.assert(analysis.moduleManifest.sourceOfTruth === SOURCE_MANIFEST_PATH, 'KernelLab source manifest is the architecture source of truth');
  if (!analysis.architectureReport.ok) {
    const mixedRoleIds = new Set(analysis.architectureReport.violations
      .filter((entry) => entry.code === 'xtend.rmt.kernel_mvc.mixed_role')
      .map((entry) => entry.moduleId));
    context.assert(!mixedRoleIds.has('rmt-format'), 'KernelLab no longer reports the physically split Format stack as a mixed-role release blocker');
    const blockedBuild = createRmtKernelLabBuild({ rootDir, profile: 'clean' });
    context.assert(!blockedBuild.ok && blockedBuild.status === 'blocked', 'KernelLab release build stops before artifact generation when MVC blockers remain');
    context.assert(
      blockedBuild.architectureReport
        && blockedBuild.architectureReport.violations.length === analysis.architectureReport.violations.length,
      'KernelLab blocked build returns the complete MVC architecture report'
    );
    context.assert(
      blockedBuild.diagnostics.some((entry) => entry.code === 'xtend.rmt.kernel_lab.mvc_release_blocked'),
      'KernelLab blocked build emits the MVC release-blocker diagnostic'
    );
    return context.result({
      report: {
        schema: 'xtend.scaffold.rmt-kernel-lab-suite-report.v1',
        moduleManifestPath: MODULE_MANIFEST_PATH,
        visibleModuleCount: analysis.visibleModuleCount,
        architectureStatus: analysis.architectureReport.status,
        architectureViolationCount: analysis.architectureReport.violations.length,
        outputCount: 0
      }
    });
  }
  context.assert(analysis.moduleManifest.sourceModuleCount >= 47, 'KernelLab inventories canonical bundle, Model, View, Controller and adapter sources');
  context.assert(analysis.moduleManifest.legacyBundleModuleCount === 0, 'KernelLab architecture has no legacy bundle source inputs');
  context.assert(analysis.moduleManifest.sourceModules.every((entry) => entry.sourcePath && entry.sourceSha256 && entry.mvcRole), 'KernelLab records source hashes and MVC roles for canonical modules');
  context.assert(analysis.expectedBundledModuleCount === sourceManifest.bundle.moduleOrder.length, 'KernelLab analysis derives the bundled module count from source order');
  context.assert(analysis.visibleModuleCount >= 20, 'KernelLab analysis detects bundled module topology');
  context.assert(analysis.moduleCountMatchesHistory === true, 'KernelLab analysis reconciles all assembled modules with its canonical source manifest');
  context.assert(analysis.visibleModuleCount === sourceManifest.bundle.moduleOrder.length, 'KernelLab analysis exposes the complete canonical module topology');
  const domRendererModule = analysis.moduleManifest.modules.find((entry) => entry.id === 'rmt-dom-descriptor-renderer');
  context.assert(
    domRendererModule && domRendererModule.factories.includes(DOM_RENDERER_FACTORY),
    'KernelLab manifest attributes the canonical DOM renderer factory to its source-manifest module'
  );
  context.assert(analysis.moduleManifest.modules.every((entry, index) => entry.order === index + 1), 'KernelLab manifest keeps stable module order');
  context.assert(analysis.moduleManifest.modules.every((entry) => entry.classification === 'keep'), 'KernelLab clean manifest classifies remaining modules as keep');
  const engineModule = analysis.moduleManifest.modules.find((entry) => entry.id === 'rmt-engine');
  context.assert(engineModule && engineModule.factories.includes('createRmtEngine'), 'KernelLab manifest attributes createRmtEngine to engine module');
  context.assert(engineModule && !engineModule.factories.includes('createRmtReactivity'), 'KernelLab manifest does not attribute comparison-only reactivity factory to engine module');
  context.assert(engineModule && !engineModule.factories.includes('createRmtCommandBus'), 'KernelLab manifest does not attribute comparison-only command bus factory to engine module');
  context.assert(analysis.optimizationReport && analysis.optimizationReport.schema === 'xtend.rmt.kernel-lab.optimization-report.v1', 'KernelLab analysis exposes optimization report');
  context.assert(analysis.optimizationReport.redundantFallbacks.length === 0, 'KernelLab analysis sees no remaining duplicate factory fallbacks');
  context.assert(analysis.optimizationReport.redundantFactoryResolution.length === 0, 'KernelLab analysis sees no remaining duplicate resolveFactory chains');
  context.assert(analysis.optimizationReport.duplicateFunctionBodies.length > 0, 'KernelLab analysis reports duplicate helper bodies for follow-up optimization');
  context.assert(analysis.optimizationReport.ok === true && analysis.optimizationReport.summary.estimatedDuplicateFunctionBytes <= 12000, 'KernelLab enforces the 12 KiB full-bundle duplicate budget');
  context.assert(!analysis.optimizationReport.duplicateFunctionBodies.some((group) => (
    group.entries.some((entry) => entry.functionName === 'redactRuntimePanicMetadata')
  )), 'KernelLab confirms the Trusted DOM panic helper has one canonical View owner');
  context.assert(analysis.optimizationReport.factoryAttributionWarnings.some((entry) => (
    entry.moduleId === 'rmt-engine' && entry.factoryName === 'createRmtReactivity'
  )), 'KernelLab optimization report keeps comparison-only reactivity attribution visible');
  context.assert(analysis.artifacts.filter((artifact) => artifact.kind !== 'module-manifest').every((artifact) => artifact.dashboardSymbols.length === 0), 'KernelLab analysis sees clean standard artifacts');
  context.assert(analysis.artifacts.every((artifact) => artifact.deprecatedBrandingCount === 0), 'KernelLab analysis sees deprecated-branding-free artifacts');
  context.assert(analysis.microkernelReport && analysis.microkernelReport.ok, 'KernelLab validates the separate microkernel target');
  context.assert(analysis.microkernelReport.rawBytes <= 160 * 1024 && analysis.microkernelReport.gzipBytes <= 32 * 1024, 'KernelLab enforces microkernel raw and gzip budgets');
  context.assert(analysis.microkernelReport.compositionEdges.length === 0 && analysis.microkernelReport.runtimePortEdges.length >= 4, 'KernelLab separates composition edges from injected runtime-port edges');
  context.assert(analysis.microkernelReport.forbiddenImports.length === 0 && analysis.microkernelReport.duplicateFunctionBodies.length === 0, 'Microkernel contains no service imports or duplicated function bodies');

  const microkernelBuild = createRmtKernelLabBuild({ rootDir, profile: 'microkernel' });
  context.assert(microkernelBuild.ok && microkernelBuild.status === 'current', 'KernelLab microkernel build target verifies the standalone scheduler artifact');
  context.assert(microkernelBuild.outputs.some((entry) => entry.path === MICROKERNEL_PATH) && microkernelBuild.outputs.some((entry) => entry.path === MICROKERNEL_TYPES_PATH), 'Microkernel build target covers runtime and TypeScript artifacts');

  const missingPortManifest = JSON.parse(JSON.stringify(sourceManifest));
  delete missingPortManifest.microkernel.runtimePortProviders.clock;
  const missingPortReport = createMicrokernelReport(rootDir, { manifest: missingPortManifest });
  context.assert(!missingPortReport.ok && missingPortReport.violations.some((entry) => entry.code === 'xtend.rmt.kernel_lab.runtime_port_provider_missing'), 'KernelLab blocks a missing required runtime-port provider');
  const forbiddenImportReport = createMicrokernelReport(rootDir, {
    manifest: sourceManifest,
    sources: { [MICROKERNEL_PATH]: "import './rmt-runtime.esm.js';\nexport function createRmtKernelScheduler() {}\n" }
  });
  context.assert(!forbiddenImportReport.ok && forbiddenImportReport.violations.some((entry) => entry.code === 'xtend.rmt.kernel_lab.microkernel_service_import'), 'KernelLab blocks service imports in the microkernel');

  const expiredManifest = JSON.parse(JSON.stringify(sourceManifest));
  const expiredEntry = expiredManifest.modules.find((entry) => entry.id === 'rmt-browser-scheduler');
  expiredEntry.compatibility = {
    kind: '0.6-global-mirror',
    since: '0.6.0',
    removeBy: '0.7.0',
    reason: 'Synthetic expired compatibility record for the KernelLab negative gate.',
    allowedCapabilities: ['global.read', 'global.write']
  };
  const expiredReport = analyzeKernelMvcArchitecture({ rootDir, manifest: expiredManifest, version: '0.8.0' });
  context.assert(!expiredReport.ok && expiredReport.violations.some((entry) => entry.code === 'xtend.rmt.kernel_mvc.compatibility_expired'), 'KernelLab turns currentVersion >= removeBy into a release error');

  const dryRun = createRmtKernelLabBuild({ rootDir, profile: 'clean' });
  context.assert(dryRun.ok, 'KernelLab clean build dry-run succeeds');
  context.assert(dryRun.schema === RMT_KERNEL_LAB_BUILD_SCHEMA, 'KernelLab build uses build schema');
  context.assert(dryRun.kernelVersion === readJson('xtendrmt/rmt-manifest.json', rootDir).version, 'KernelLab build infers version from product manifest by default');
  context.assert(dryRun.versionSource === 'manifest', 'KernelLab build reports manifest as default version source');
  context.assert(dryRun.status === 'planned', 'KernelLab dry-run reports planned status');
  context.assert(dryRun.architectureReport.canonicalModuleCount >= 47 && dryRun.architectureReport.legacyBundleModuleCount === 0, 'KernelLab release plan is fully canonical');
  context.assert(dryRun.outputs.length === 7, 'KernelLab build covers runtime artifacts, types, schema, manifest and module manifest');
  context.assert(
    dryRun.domSourceReport
      && dryRun.domSourceReport.renderer.path === 'xtendrmt/rmt-dom-descriptor-renderer.js'
      && dryRun.domSourceReport.types.path === 'xtendrmt/rmt-dom-descriptor-renderer.d.ts',
    'KernelLab build records canonical DOM renderer source provenance'
  );
  context.assert(dryRun.optimizationReport && dryRun.optimizationReport.redundantFallbacks.length === 0, 'KernelLab build output reports no duplicate factory fallbacks');
  context.assert(dryRun.optimizationReport && dryRun.optimizationReport.redundantFactoryResolution.length === 0, 'KernelLab build output reports no duplicate resolveFactory chains');
  context.assert(dryRun.moduleManifest.sourceArtifacts.every((artifact) => artifact.dashboardSymbols.length === 0), 'KernelLab build outputs remain Dashboard-free');
  context.assert(dryRun.moduleManifest.sourceArtifacts.every((artifact) => artifact.deprecatedBrandingCount === 0), 'KernelLab build outputs remain deprecated-branding-free');

  const invalidVersion = createRmtKernelLabBuild({ rootDir, profile: 'clean', version: 'next' });
  context.assert(!invalidVersion.ok && invalidVersion.status === 'invalid_version', 'KernelLab build rejects invalid version flag');

  const legacyRoot = tempRoot();
  KERNEL_SOURCE_INPUTS.forEach((target) => copyTempFile(rootDir, legacyRoot, target.path));
  const legacyManifest = readJson(SOURCE_MANIFEST_PATH, legacyRoot);
  legacyManifest.modules[0].sourceMode = 'legacy-bundle';
  fs.writeFileSync(tempPath(legacyRoot, SOURCE_MANIFEST_PATH), `${JSON.stringify(legacyManifest, null, 2)}\n`, 'utf8');
  const legacyBuild = createRmtKernelLabBuild({
    rootDir: legacyRoot,
    profile: 'clean',
    version: readJson('xtendrmt/rmt-manifest.json', rootDir).version
  });
  context.assert(
    !legacyBuild.ok && legacyBuild.diagnostics.some((entry) => entry.code === 'xtend.rmt.kernel_lab.legacy_bundle_release_blocked'),
    'KernelLab release build rejects every legacy bundle source input'
  );

  const currentCheck = createRmtKernelLabBuild({ rootDir, profile: 'clean', check: true });
  context.assert(currentCheck.ok, 'KernelLab --check passes for current clean artifacts');
  context.assert(currentCheck.status === 'current', 'KernelLab --check reports current');
  context.assert(currentCheck.changedCount === 0, 'KernelLab --check is idempotent');

  const currentManifest = readJson('xtendrmt/rmt-manifest.json', rootDir);
  const currentKernelVersion = currentManifest.version;
  [
    'xtendrmt/rmt-core.esm.js',
    'xtendrmt/rmt-runtime.esm.js',
    'xtendrmt/rmt-runtime.browser.js',
    'xtendrmt/rmt-core.d.ts',
    'xtendrmt/rmt.schema.json',
    'xtendrmt/rmt-manifest.json'
  ].forEach((relativePath) => {
    const source = readText(relativePath, rootDir);
    assertNoDashboardSymbols(context, source, relativePath);
    assertNoDeprecatedBranding(context, source, relativePath);
    if (relativePath.endsWith('.js')) {
      assertNoGermanKernelComments(context, source, relativePath);
      context.assert(!source.includes('generated at:'), `${relativePath} does not carry a stale generated timestamp`);
      context.assert(source.includes(`XTendRMT ${currentKernelVersion}`), `${relativePath} header matches product manifest version`);
      context.assert(source.includes(`generated by: xtend kernel-lab build --profile clean --version ${currentKernelVersion}`), `${relativePath} records versioned KernelLab build provenance`);
      context.assert(source.includes(`const PUBLIC_API_VERSION = '${currentKernelVersion}';`), `${relativePath} runtime API version matches product manifest version`);
      context.assert(source.includes(`/* ${DOM_RENDERER_MODULE_PATH} */`), `${relativePath} includes the canonical DOM renderer module`);
      context.assert(source.includes(`appModules.${DOM_RENDERER_FACTORY} = rendererApi.${DOM_RENDERER_FACTORY};`), `${relativePath} registers the canonical DOM renderer factory`);
      context.assert(!source.includes('child.innerHTML = markup'), `${relativePath} removes the legacy component slot innerHTML sink`);
      context.assert(!source.includes('function applyXtendComponentAttributes('), `${relativePath} removes the legacy component attribute writer`);
      context.assert(source.includes("operation: 'replace-children'"), `${relativePath} mounts XTend components through a DOM commit`);
      context.assert(
        (source.match(/\btemplateElement\.innerHTML\s*=/gu) || []).length === 1,
        `${relativePath} keeps exactly one canonical Trusted-DOM parser sink`
      );
      context.assert(
        !/\belement\.innerHTML\s*=(?!=)/u.test(source),
        `${relativePath} removes direct element.innerHTML writers`
      );
      context.assert(
        source.includes('<kernel-lab:rmt-template-execution-trusted-dom-delegate>'),
        `${relativePath} delegates execution-path Trusted-DOM commits`
      );
      if (relativePath.endsWith('.esm.js')) {
        context.assert(
          new RegExp(`export\\s+\\{[^}]*\\b${DOM_RENDERER_FACTORY}\\b`, 'u').test(source),
          `${relativePath} exposes the canonical DOM renderer named export`
        );
      }
    }
    if (relativePath.endsWith('.d.ts')) {
      context.assert(source.includes(`XTendRMT ${currentKernelVersion} type definitions`), `${relativePath} type header matches product manifest version`);
      context.assert(source.includes('export type RmtDomCommitRequest'), `${relativePath} includes RmtDomCommitRequest`);
      context.assert(source.includes('export interface RmtDomCommitResult'), `${relativePath} includes RmtDomCommitResult`);
    }
    if (relativePath.endsWith('rmt.schema.json')) {
      context.assert(source.includes(DOM_RENDERER_SCHEMA), `${relativePath} includes the DOM renderer schema`);
      context.assert(source.includes(DOM_COMMIT_RESULT_SCHEMA), `${relativePath} includes the DOM commit result schema`);
    }
    if (relativePath.endsWith('rmt-manifest.json')) {
      const manifest = JSON.parse(source);
      context.assert(
        manifest.entryPoints
          && manifest.entryPoints.appModulesFactories
          && manifest.entryPoints.appModulesFactories.domDescriptorRenderer === DOM_RENDERER_FACTORY,
        `${relativePath} declares the DOM renderer factory`
      );
    }
  });
  const moduleManifest = readJson(MODULE_MANIFEST_PATH, rootDir);
  context.assert(moduleManifest.schema === RMT_KERNEL_MODULE_MANIFEST_SCHEMA, 'Kernel module manifest artifact is written');
  context.assert(moduleManifest.kernelVersion === currentKernelVersion, 'Kernel module manifest records current kernel version');
  context.assert(moduleManifest.visibleModuleCount === analysis.visibleModuleCount, 'Kernel module manifest artifact records visible module count');
  assertNoDeprecatedBranding(context, JSON.stringify(moduleManifest), 'Kernel module manifest artifact');

  const buildRoot = tempRoot();
  KERNEL_SOURCE_INPUTS.forEach((target) => copyTempFile(rootDir, buildRoot, target.path));
  context.assert(KERNEL_ANALYSIS_TARGETS.every((target) => !fs.existsSync(tempPath(buildRoot, target.path))), 'Source-independence fixture starts without generated kernel outputs');
  const firstWrite = createRmtKernelLabBuild({ rootDir: buildRoot, profile: 'clean', version: currentKernelVersion, write: true });
  context.assert(firstWrite.ok, 'KernelLab --write succeeds in temp root');
  context.assert(firstWrite.status === 'written', 'KernelLab --write assembles every missing artifact from canonical sources');
  context.assert(fs.existsSync(tempPath(buildRoot, MODULE_MANIFEST_PATH)), 'KernelLab --write creates module manifest artifact');
  const generatedPublicManifest = readJson('xtendrmt/rmt-manifest.json', buildRoot);
  const expectedPublicSourceModules = sourceManifest.bundle.moduleOrder.map((moduleId) => {
    if (moduleId === 'rmt-dom-descriptor-renderer') return DOM_RENDERER_MODULE_PATH;
    const sourceEntry = sourceManifest.modules.find((entry) => entry.id === moduleId);
    return sourceEntry.sourcePath.slice('xtendrmt/kernel/'.length);
  });
  context.assert(
    generatedPublicManifest.entryPoints.buildTargets.every((target) => JSON.stringify(target.sourceModules) === JSON.stringify(expectedPublicSourceModules))
      && generatedPublicManifest.builtTargets.every((target) => (
        target.sourceModuleCount === expectedPublicSourceModules.length
        && JSON.stringify(target.sourceModules) === JSON.stringify(expectedPublicSourceModules)
      )),
    'KernelLab derives every public build-target source list from the canonical source manifest'
  );
  const generatedCoreSource = readText('xtendrmt/rmt-core.esm.js', buildRoot);
  const topologyMatch = generatedCoreSource.match(/const __XTENDRMT_CANONICAL_SOURCE_MODULES__ = Object\.freeze\([^;]+\);/u);
  const publicApiMarker = '/* modules/rmt-public-api.js */';
  const publicApiStart = generatedCoreSource.indexOf(publicApiMarker);
  const publicApiEnd = generatedCoreSource.indexOf('\n/* modules/', publicApiStart + publicApiMarker.length);
  const publicApiModuleSource = publicApiStart >= 0
    ? generatedCoreSource.slice(publicApiStart, publicApiEnd >= 0 ? publicApiEnd : generatedCoreSource.length)
    : '';
  const productManifestSandbox = { AppModules: {} };
  productManifestSandbox.globalThis = productManifestSandbox;
  if (topologyMatch && publicApiModuleSource) {
    vm.runInNewContext(
      `const __XTENDRMT_GLOBAL__ = globalThis;\nconst __XTENDRMT_SHARED__ = { clampString(value, fallback = '') { return String(value || '').trim() || fallback; }, cloneSerializable(value, fallback = null) { try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; } }, resolveFactory(modules, name, explicit) { return typeof explicit === 'function' ? explicit : modules[name] || null; }, isElementLike(value) { return !!value && typeof value.addEventListener === 'function'; }, normalizeTemplateReference(value) { return typeof value === 'string' ? value : ''; } };\n${topologyMatch[0]}\n${publicApiModuleSource}`,
      productManifestSandbox,
      { filename: 'kernel-lab-product-manifest-probe.js' }
    );
  }
  const runtimeProductManifest = productManifestSandbox.AppModules
    && typeof productManifestSandbox.AppModules.createRmtProductManifest === 'function'
    ? productManifestSandbox.AppModules.createRmtProductManifest()
    : null;
  context.assert(
    runtimeProductManifest
      && runtimeProductManifest.entryPoints.buildTargets.every((target) => (
        JSON.stringify(Array.from(target.sourceModules || [])) === JSON.stringify(expectedPublicSourceModules)
      )),
    'createRmtProductManifest sourceModules exactly mirror canonical bundle.moduleOrder'
  );
  const generatedHashes = new Map(firstWrite.outputs.map((output) => [output.path, output.sha256After]));
  KERNEL_ANALYSIS_TARGETS.forEach((target) => {
    const generated = readText(target.path, buildRoot);
    context.assert(generatedHashes.get(target.path) === require('crypto').createHash('sha256').update(generated).digest('hex'), `${target.path} is bit-exact with its canonical assembly report`);
  });
  const damagedTarget = KERNEL_ANALYSIS_TARGETS[0];
  fs.writeFileSync(tempPath(buildRoot, damagedTarget.path), 'damaged generated output\n', 'utf8');
  const repairWrite = createRmtKernelLabBuild({ rootDir: buildRoot, profile: 'clean', version: currentKernelVersion, write: true });
  context.assert(repairWrite.ok && repairWrite.changedCount === 1, 'KernelLab repairs a damaged output exclusively from canonical sources');
  context.assert(require('crypto').createHash('sha256').update(readText(damagedTarget.path, buildRoot)).digest('hex') === generatedHashes.get(damagedTarget.path), 'Repaired kernel output is bit-identical to the first canonical build');
  const repeatWrite = createRmtKernelLabBuild({ rootDir: buildRoot, profile: 'clean', version: currentKernelVersion, write: true });
  context.assert(repeatWrite.ok, 'Repeated KernelLab --write succeeds');
  context.assert(repeatWrite.changedCount === 0, 'Repeated KernelLab --write is idempotent');
  const tempCheck = createRmtKernelLabBuild({ rootDir: buildRoot, profile: 'clean', version: currentKernelVersion, check: true });
  context.assert(tempCheck.ok && tempCheck.status === 'current', 'KernelLab --check is current after temp write');
  KERNEL_BUILD_TARGETS.forEach((target) => {
    assertNoDeprecatedBranding(context, readText(target.path, buildRoot), `Temp ${target.path}`);
  });

  const versionRoot = tempRoot();
  KERNEL_SOURCE_INPUTS.forEach((target) => copyTempFile(rootDir, versionRoot, target.path));
  const versionWrite = createRmtKernelLabBuild({ rootDir: versionRoot, profile: 'clean', version: '0.4.0', write: true });
  context.assert(versionWrite.ok && versionWrite.kernelVersion === '0.4.0', 'KernelLab --version writes explicit kernel version');
  context.assert(versionWrite.versionSource === 'flag', 'KernelLab --version reports flag as version source');
  context.assert(readText('xtendrmt/rmt-core.esm.js', versionRoot).includes('XTendRMT 0.4.0'), 'KernelLab --version updates JS header in temp root');
  context.assert(readText('xtendrmt/rmt-core.esm.js', versionRoot).includes("const PUBLIC_API_VERSION = '0.4.0';"), 'KernelLab --version updates runtime API version in temp root');
  context.assert(readText('xtendrmt/rmt-core.d.ts', versionRoot).includes('XTendRMT 0.4.0 type definitions'), 'KernelLab --version updates type header in temp root');
  const tempManifest = readJson('xtendrmt/rmt-manifest.json', versionRoot);
  context.assert(tempManifest.version === '0.4.0' && tempManifest.apiVersion === '0.4.0', 'KernelLab --version updates product manifest in temp root');
  const versionCheck = createRmtKernelLabBuild({ rootDir: versionRoot, profile: 'clean', version: '0.4.0', check: true });
  context.assert(versionCheck.ok && versionCheck.status === 'current', 'KernelLab --version --check is idempotent after temp write');
  KERNEL_BUILD_TARGETS.forEach((target) => {
    assertNoDeprecatedBranding(context, readText(target.path, versionRoot), `Versioned temp ${target.path}`);
  });

  return context.result({
    report: {
      schema: 'xtend.scaffold.rmt-kernel-lab-suite-report.v1',
      moduleManifestPath: MODULE_MANIFEST_PATH,
      visibleModuleCount: analysis.visibleModuleCount,
      buildRoot,
      outputCount: dryRun.outputs.length
    }
  });
}

function printScaffoldKernelLabReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Scaffold RMT KernelLab erfolgreich.',
    failureTitle: 'XTend Scaffold RMT KernelLab fehlgeschlagen:'
  });
}

module.exports = {
  printScaffoldKernelLabReport,
  runScaffoldKernelLabSuite
};

'use strict';

const fs = require('fs');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { resolveRepoPath, resolveRootDir } = require('../utils/files');

const RULES = Object.freeze([
  { id: 'local-descriptor-renderer', pattern: /function\s+(?:render|serialize)[A-Za-z0-9]*(?:Descriptor|RmtDescriptor)\s*\(/u },
  { id: 'local-safe-preview-projector', pattern: /function\s+docsRmtPlayground(?:PreviewAttributesForComponent|ComponentDescriptor|InitialDataForSurface|SafePreviewUrl)\s*\(/u },
  { id: 'maraca-mini-runtime', pattern: /function\s+(?:createDocsRmtPlaygroundMaracaKernel|syncDocsRmtPlaygroundMaracaStateAttributes|ensureDocsRmtPlaygroundMaracaModules)\s*\(/u },
  { id: 'runtime-singleton', pattern: /window\.__XTendDocsRmtPlaygroundMaracaRuntime\b/u },
  { id: 'visible-html-sink', pattern: /(?:preview|template|surface|container)\.innerHTML\s*=|insertAdjacentHTML\s*\(|\.srcdoc\s*=/u },
  { id: 'raw-browser-scheduler', pattern: /\b(?:requestIdleCallback|requestAnimationFrame)\s*\(/u },
  { id: 'raw-timer-scheduler', pattern: /\b(?:setTimeout|setInterval)\s*\(/u },
  { id: 'docs-subprocess', pattern: /\bproc_open\s*\(/u },
  { id: 'unmanaged-listener', pattern: /\.addEventListener\s*\(/u }
]);

function scanOwnershipSource(source, filePath = 'inline') {
  return RULES.filter((rule) => rule.pattern.test(String(source || ''))).map((rule) => ({ rule: rule.id, filePath }));
}

async function runDocsFrameworkOwnershipSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'docs-framework-ownership', label: 'Docs Framework Ownership' });
  const read = (file) => fs.readFileSync(resolveRepoPath(file, rootDir), 'utf8');
  const productFiles = [
    'docs/utils/pageloader.js',
    'docs/utils/docs-shell-runtime.mjs',
    'docs/utils/animation-engine-demo.mjs',
    'docs/index.php'
  ];
  const findings = productFiles.flatMap((file) => scanOwnershipSource(read(file), file));
  context.assert(findings.length === 0, `executable Docs product has no parallel runtime structures (${findings.map((entry) => `${entry.filePath}:${entry.rule}`).join(', ') || 'clean'})`);

  const pageLoader = read('docs/utils/pageloader.js');
  const phpHost = read('docs/index.php');
  const animationDemo = read('docs/utils/animation-engine-demo.mjs');
  const maracaBuilder = read('xtend-maraca/index.js');
  const maracaPlanRuntime = read('xtend-maraca/plan-runtime.mjs');
  const maracaBrowserComposition = read('xtend-maraca/browser-composition-runtime.mjs');
  const maracaBrowserHost = read('xtend-maraca/browser-host-adapter.mjs');
  const maracaViewProjectionAdapter = read('xtendrmt/rmt-maraca-view-projection-adapter.js');
  const maracaPackage = JSON.parse(read('xtend-maraca/package.json'));
  const rmtPackage = JSON.parse(read('xtendrmt/package.json'));
  const compilerPackage = JSON.parse(read('tools/package.json'));
  const compatibilityBridges = [
    'scripts/compile_rmt_vnext_bridge.js',
    'scripts/rmt_playground_lsp_bridge.js',
    'scripts/rmt_playground_maraca_preview_bridge.js'
  ].map(read);
  context.assert(pageLoader.includes("import(docsVersionedModuleUrl('/xtend-maraca/plan-runtime.mjs'))") && pageLoader.includes('createMaracaPlanRuntime({'), 'RMT Playground boots through the cache-versioned public Maraca plan runtime');
  context.assert(pageLoader.includes("import(docsVersionedModuleUrl('/xtendrmt/rmt-dom-descriptor-renderer.js'))") && !pageLoader.includes('renderRmtDescriptorNode'), 'Docs descriptors use the cache-versioned official RMT DOM renderer');
  context.assert(phpHost.includes('xtendToolingBridgeRequest') && !phpHost.includes('proc_open'), 'PHP host delegates all compiler processes to the official tooling bridge client');
  context.assert(phpHost.includes('->renderDescriptor(') && !phpHost.includes('docsFallbackSerializeDescriptor'), 'PHP host serializes descriptors through the RMT SSR adapter');
  context.assert(animationDemo.includes('engine.replaySurfaceTransition({') && !animationDemo.includes('engine.runSurfaceTransitionPhase({'), 'Animation demo uses the framework replay contract');
  context.assert(Boolean(maracaPackage.exports['./plan-runtime']) && maracaPackage.files.includes('plan-runtime.mjs'), 'Maraca plan runtime is a packaged stable export');
  context.assert(Boolean(rmtPackage.exports['./safe-preview']) && Boolean(rmtPackage.exports['./browser-scheduler']), 'RMT packages safe preview and browser scheduling contracts');
  context.assert(Boolean(rmtPackage.exports['./maraca-view-projection-adapter'])
    && rmtPackage.files.includes('rmt-maraca-view-projection-adapter.js')
    && rmtPackage.files.includes('rmt-maraca-view-projection-adapter.d.ts'),
  'RMT packages the typed Maraca View Projection Port adapter');
  context.assert(!/\.(?:querySelector|querySelectorAll|getAttribute|replaceChildren|dispatchEvent)\b|\.ownerDocument\b|\bCustomEvent\b/u.test(maracaPlanRuntime)
    && /\.(?:querySelector|querySelectorAll|getAttribute|replaceChildren|dispatchEvent)\b|\.ownerDocument\b|\bCustomEvent\b/u.test(maracaViewProjectionAdapter),
  'the Maraca Application Controller contains no direct DOM or host-event operations; the canonical View adapter owns them');
  context.assert(!maracaPlanRuntime.includes('renderer: runtimes.renderer')
    && !maracaPlanRuntime.includes('validationRuntime: runtimes.')
    && !maracaPlanRuntime.includes('transitionRuntime: runtimes.transitions')
    && !maracaPlanRuntime.includes('resourceManager: runtimes.resourceManager'),
  'external post-commit contexts do not expose mutable renderer, validation, transition or resource handles');
  context.assert(Boolean(compilerPackage.exports['./tooling-bridge']) && compilerPackage.files.includes('tooling-bridge-client.php'), 'Compiler packages JS and PHP tooling bridge contracts');
  context.assert(compatibilityBridges.every((source) => source.includes('executeToolingBridgeOperation'))
    && compatibilityBridges.every((source) => !/require\(['"](?:\.\.\/tools\/rmt-language|\.\.\/xtend-maraca)/u.test(source)), 'historical bridge entry points are thin tooling-bridge adapters without duplicate compiler runtimes');
  context.assert(
    !/trustedDomRenderer:\s*(?:runtimeOptions|options)\.trustedDomRenderer\s*\|\|\s*(?:runtimeOptions|options)\.trustedDom/u.test(`${maracaBuilder}\n${maracaBrowserComposition}\n${maracaBrowserHost}`)
      && maracaBrowserHost.includes('trustedDomRenderer: options.trustedDomRenderer,')
      && maracaBrowserHost.includes('trustedDom: options.trustedDom'),
    'generated Maraca boot preserves trustedDom as a diagnosable compatibility alias instead of promoting it to the canonical option'
  );

  for (const rule of RULES) {
    const fixture = rule.id === 'local-descriptor-renderer' ? 'function renderLocalDescriptor(node) { return node; }'
      : rule.id === 'local-safe-preview-projector' ? 'function docsRmtPlaygroundComponentDescriptor() {}'
        : rule.id === 'maraca-mini-runtime' ? 'function createDocsRmtPlaygroundMaracaKernel() {}'
          : rule.id === 'runtime-singleton' ? 'window.__XTendDocsRmtPlaygroundMaracaRuntime = runtime;'
        : rule.id === 'visible-html-sink' ? 'preview.innerHTML = payload;'
          : rule.id === 'raw-browser-scheduler' ? 'requestIdleCallback(work);'
            : rule.id === 'raw-timer-scheduler' ? 'setTimeout(work, 50);'
              : rule.id === 'docs-subprocess' ? 'proc_open($command, $spec, $pipes);'
                : "button.addEventListener('click', work);";
    context.assert(scanOwnershipSource(fixture, `negative/${rule.id}`).some((entry) => entry.rule === rule.id), `negative fixture detects ${rule.id}`);
  }

  const safePreview = await import(`file://${resolveRepoPath('xtendrmt/rmt-safe-preview.js', rootDir)}`);
  const projector = safePreview.createRmtSafePreviewProjector({ componentRegistry: ['x-button'] });
  const projected = projector.project({}, { descriptor: { tag: 'script', attributes: { onclick: 'alert(1)' }, children: [] } });
  context.assert(projected.descriptor.tag === 'p' && projected.diagnostics.some((entry) => entry.code === 'rmt.safe-preview.component-unknown'), 'safe preview visibly degrades unknown or unsafe components');
  const allowed = projector.project({}, { descriptor: { tag: 'x-button', attributes: { onclick: 'bad', label: 'Run' }, children: ['Run'] } });
  context.assert(allowed.descriptor.tag === 'x-button' && !Object.prototype.hasOwnProperty.call(allowed.descriptor.attributes, 'onclick'), 'safe preview strips event attributes without emitting HTML strings');

  const maracaRuntimeApi = await import(`file://${resolveRepoPath('xtend-maraca/plan-runtime.mjs', rootDir)}`);
  const presentationEffectApi = await import(`file://${resolveRepoPath('xtendrmt/rmt-presentation-effect-adapter.js', rootDir)}`);
  const viewProjectionApi = await import(`file://${resolveRepoPath('xtendrmt/rmt-maraca-view-projection-adapter.js', rootDir)}`);
  const fakeKernelRuntime = { schema: 'test-kernel-runtime' };
  let ownedKernelBootCount = 0;
  let ownedKernelApiCount = 0;
  const fakeModules = {
    state: { createRmtStateSelectorRuntime: () => {
      const stateSnapshot = () => ({ states: {}, selectors: {}, derived: {}, model: {}, value: 1 });
      const modelReader = {
        getState: () => undefined,
        select: () => undefined,
        getSelectorValues: () => ({}),
        getDerivedValues: () => ({}),
        snapshot: stateSnapshot,
        subscribe: () => () => {}
      };
      return {
        modelReader,
        model: modelReader,
        modelCommandPort: {
          apply(_operations, metadata = {}) {
            const snapshot = stateSnapshot();
            return {
              previous: snapshot,
              next: snapshot,
              patchPlan: { changedStates: [], changedSelectors: [], changedDerived: [] },
              metadata
            };
          }
        },
        createRenderContext: () => ({}),
        snapshot: stateSnapshot,
        subscribe: () => () => {}
      };
    } },
    viewProjection: viewProjectionApi,
    renderer: { createRmtDomDescriptorRenderer: () => ({ render(root) { root.replaceChildren({ rendered: true }); return { nodeCount: 1 }; } }) },
    kernelRuntime: fakeKernelRuntime,
    kernel: {
      createRmtKernelOrchestrationController(options) {
        if (options.kernelApi === fakeKernelRuntime) ownedKernelApiCount += 1;
        return {
          boot() { ownedKernelBootCount += 1; },
          scheduleWork(_kind, work) { return Promise.resolve().then(work); },
          snapshot() { return { schema: 'test-owned-kernel', status: 'ready' }; },
          dispose() {}
        };
      }
    }
  };
  const createRoot = () => ({ children: [], ownerDocument: {}, replaceChildren(...nodes) { this.children = nodes; } });
  const createViewProjectionPort = (root, adapterOptions = {}) => viewProjectionApi.createRmtMaracaViewProjectionAdapter({
    root,
    documentTarget: root && root.ownerDocument || null,
    ...adapterOptions
  });
  const surfaceNode = {
    getAttribute(name) { return name === 'data-maraca-surface' ? 'surface.adapter' : null; }
  };
  const fieldNode = {
    getAttribute(name) { return name === 'data-field' ? 'field.adapter' : null; }
  };
  const dispatchedViewEvents = [];
  const viewRoot = {
    children: [surfaceNode],
    ownerDocument: {},
    replaceChildren(...nodes) { this.children = nodes; },
    querySelectorAll(selector) {
      if (selector === '[data-maraca-surface]') return [surfaceNode];
      if (selector === '[data-field]') return [fieldNode];
      return [];
    },
    querySelector(selector) { return selector === '[data-command]' ? fieldNode : null; }
  };
  const viewPort = createViewProjectionPort(viewRoot, {
    windowTarget: {
      CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } },
      dispatchEvent(event) { dispatchedViewEvents.push(event); return true; }
    }
  });
  const indexReport = viewPort.reindexSurfaces();
  context.assert(indexReport.count === 1
    && viewPort.resolveSurface('surface.adapter') === surfaceNode
    && viewPort.resolveTarget({ field: 'field.adapter' }) === fieldNode
    && viewPort.resolveBindingTarget({ target: '[data-command]' }) === fieldNode
    && viewPort.dispatchHostEvent('xtend-maraca:test', { safe: true }) === true
    && dispatchedViewEvents.length === 1
    && viewPort.clearOwnedDom() === true
    && viewRoot.children.length === 0,
  'the canonical Maraca View Projection Port owns root validation, surface and field indexing, event dispatch and root clearing');
  viewPort.dispose();
  let invalidViewRootError = null;
  try {
    viewProjectionApi.createRmtMaracaViewProjectionAdapter({ root: {} }).validateRoot();
  } catch (error) {
    invalidViewRootError = error;
  }
  context.assert(invalidViewRootError
    && invalidViewRootError.code === 'rmt.maraca.view-projection.root-invalid',
  'the View Projection Port rejects invalid roots before any Model or DOM commit');

  const mutablePlan = {
    orchestration: {
      artifact: {
        state: {},
        render: { root: { type: 'fragment', children: [{ type: 'text', text: 'before' }] } }
      }
    }
  };
  const mutableInitialState = { counter: { value: 1 } };
  const immutableConfigurationRoot = createRoot();
  let capturedInitialState = null;
  let capturedBootDescriptor = null;
  let normalizedPlanWasFrozen = false;
  const immutableConfigurationRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan: mutablePlan,
    initialState: mutableInitialState,
    root: immutableConfigurationRoot,
    viewProjectionPort: createViewProjectionPort(immutableConfigurationRoot),
    ownsViewProjectionPort: true,
    hydrateOnBoot: false,
    projectDescriptor(descriptor) {
      normalizedPlanWasFrozen = Object.isFrozen(descriptor)
        && Object.isFrozen(descriptor.children)
        && Object.isFrozen(descriptor.children[0]);
      return descriptor;
    },
    domRenderer: {
      commit(request) {
        capturedBootDescriptor = request.descriptor;
        return { ...request, nodes: [], nodeCount: 0, changed: true, structural: true, diagnostics: [] };
      },
      dispose() {}
    },
    loadModules: async () => ({
      state: {
        createRmtStateSelectorRuntime(stateOptions) {
          capturedInitialState = stateOptions.initialState;
          return {
            createRenderContext: () => ({}),
            snapshot: () => ({ states: stateOptions.initialState, selectors: {}, derived: {} }),
            subscribe: () => () => {},
            dispose() {}
          };
        }
      }
    })
  });
  mutablePlan.orchestration.artifact.render.root.children[0].text = 'after';
  mutableInitialState.counter.value = 2;
  await immutableConfigurationRuntime.boot();
  context.assert(capturedBootDescriptor.children[0].text === 'before'
    && capturedInitialState.counter.value === 1
    && normalizedPlanWasFrozen
    && Object.isFrozen(capturedInitialState),
  'Maraca deep-clones and freezes normalized Plan and initial Model configuration before asynchronous boot');
  immutableConfigurationRuntime.dispose();
  const rootA = createRoot();
  const rootB = createRoot();
  const plan = { orchestration: { artifact: { state: {}, render: { root: { type: 'fragment', children: [] } } } } };
  const runtimeA = maracaRuntimeApi.createMaracaPlanRuntime({
    plan,
    root: rootA,
    viewProjectionPort: createViewProjectionPort(rootA),
    loadModules: async () => fakeModules
  });
  const runtimeB = maracaRuntimeApi.createMaracaPlanRuntime({
    plan,
    root: rootB,
    viewProjectionPort: createViewProjectionPort(rootB),
    loadModules: async () => fakeModules
  });
  await Promise.all([runtimeA.boot(), runtimeB.boot()]);
  context.assert(runtimeA !== runtimeB
    && runtimeA.snapshot().phase === 'ready'
    && runtimeB.snapshot().phase === 'ready'
    && ownedKernelBootCount === 2
    && ownedKernelApiCount === 2,
  'plan runtime supports isolated previews and boots each owned kernel with the loaded kernel API');
  const snapshot = runtimeA.snapshot();
  let snapshotMutationBlocked = false;
  try {
    snapshot.phase = 'tampered';
  } catch (_) {
    snapshotMutationBlocked = true;
  }
  context.assert(snapshotMutationBlocked && Object.isFrozen(snapshot) && runtimeA.snapshot().phase === 'ready', 'plan runtime snapshots are deeply frozen defensive values');
  runtimeA.dispose();
  context.assert(runtimeA.snapshot().phase === 'disposed' && runtimeB.snapshot().phase === 'ready'
    && runtimeA.snapshot().diagnostics.some((entry) => entry.code === 'rmt.dom.renderer-dispose-missing')
    && runtimeA.snapshot().diagnostics.some((entry) => entry.code === 'rmt.dom.dispose-root-clear-fallback')
    && rootA.children.length === 0,
  'compatibility plan runtime diagnoses a missing renderer dispose and clears only its owned root');
  runtimeB.dispose();
  let unavailableKernelDisposeCount = 0;
  const schedulerFallbackRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan,
    root: createRoot(),
    loadModules: async () => ({
      state: fakeModules.state,
      viewProjection: viewProjectionApi,
      renderer: fakeModules.renderer,
      kernelRuntime: fakeKernelRuntime,
      kernel: {
        createRmtKernelOrchestrationController() {
          return {
            schema: 'xtend.rmt.kernel-orchestration-controller.v1',
            status: 'error',
            schedulerBridge: null,
            boot() {},
            dispose() { unavailableKernelDisposeCount += 1; }
          };
        }
      }
    })
  });
  await schedulerFallbackRuntime.boot();
  const schedulerFallbackSnapshot = schedulerFallbackRuntime.snapshot();
  context.assert(
    schedulerFallbackSnapshot.kernel
      && schedulerFallbackSnapshot.kernel.fallback === 'microtask'
      && schedulerFallbackSnapshot.diagnostics.some((entry) => entry.code === 'maraca.plan-runtime.scheduler-fallback')
      && unavailableKernelDisposeCount === 1,
    'preview disposes an unavailable canonical kernel and reports its single microtask scheduler fallback'
  );
  schedulerFallbackRuntime.dispose();
  const aliasRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan,
    root: createRoot(),
    trustedDom: { render() {} },
    loadModules: async () => fakeModules
  });
  const canonicalRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan,
    root: createRoot(),
    trustedDomRenderer: { render() {} },
    loadModules: async () => fakeModules
  });
  await Promise.all([aliasRuntime.boot(), canonicalRuntime.boot()]);
  context.assert(
    aliasRuntime.snapshot().diagnostics.filter((entry) => entry.code === 'rmt.dom.trusted-dom.legacy-option').length === 1
      && canonicalRuntime.snapshot().diagnostics.every((entry) => entry.code !== 'rmt.dom.trusted-dom.legacy-option'),
    'trustedDom emits one compatibility diagnostic while trustedDomRenderer remains canonical'
  );
  aliasRuntime.dispose();
  canonicalRuntime.dispose();
  const missingStrictViewRoot = createRoot();
  const missingStrictViewRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan: {
      orchestration: {
        strict: true,
        artifact: { state: {}, render: { root: { type: 'fragment', children: [] } } }
      }
    },
    root: missingStrictViewRoot,
    domRenderer: { commit() { return {}; }, dispose() {} },
    loadModules: async () => ({ state: fakeModules.state })
  });
  let missingStrictViewError = null;
  try { await missingStrictViewRuntime.boot(); } catch (error) { missingStrictViewError = error; }
  context.assert(missingStrictViewError
    && missingStrictViewError.code === 'xtend.maraca.mvc.view-projection-port-missing',
  'strict Maraca fails closed before Model or DOM boot when the View Projection Port is not injected');
  missingStrictViewRuntime.dispose();
  const strictRendererRoot = createRoot();
  const strictRendererContractRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan: {
      orchestration: {
        strict: true,
        artifact: { state: {}, render: { root: { type: 'fragment', children: [] } } }
      }
    },
    root: strictRendererRoot,
    viewProjectionPort: createViewProjectionPort(strictRendererRoot),
    domRenderer: { commit() { return {}; } },
    loadModules: async () => ({ state: fakeModules.state })
  });
  let strictRendererContractError = null;
  try {
    await strictRendererContractRuntime.boot();
  } catch (error) {
    strictRendererContractError = error;
  }
  context.assert(strictRendererContractError
    && strictRendererContractError.code === 'rmt.dom.renderer-contract-incomplete'
    && strictRendererContractError.message.includes('commit() and dispose()'),
  'strict plan runtime rejects renderers without the complete commit and dispose lifecycle contract');

  const strictLegacyValidationRoot = createRoot();
  const strictLegacyValidationRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan: {
      orchestration: {
        strict: true,
        artifact: { state: {}, render: { root: { type: 'fragment', children: [] } } }
      },
      validation: { enabled: true, strict: true, artifact: {} }
    },
    root: strictLegacyValidationRoot,
    viewProjectionPort: createViewProjectionPort(strictLegacyValidationRoot),
    domRenderer: {
      commit(request) {
        return { ...request, nodes: [], nodeCount: 0, changed: false, structural: false, diagnostics: [] };
      },
      dispose() {}
    },
    loadModules: async () => ({
      state: fakeModules.state,
      validation: {
        createRmtFormValidationRuntime() {
          return { validateAction() { return { valid: true, results: [] }; } };
        }
      }
    })
  });
  let strictLegacyValidationError = null;
  try {
    await strictLegacyValidationRuntime.boot();
  } catch (error) {
    strictLegacyValidationError = error;
  }
  context.assert(strictLegacyValidationError
    && strictLegacyValidationError.code === 'xtend.maraca.mvc.validation-ports-missing',
  'strict Maraca rejects the mixed Validation compatibility composer and requires evaluator and View projector ports');
  strictLegacyValidationRuntime.dispose();

  const strictPortRenderer = {
    commit(request) {
      return {
        schema: 'xtend.rmt.dom-commit-result.v1',
        operation: request.operation,
        target: request.target || null,
        nodes: [],
        nodeCount: 0,
        changed: false,
        structural: false,
        diagnostics: []
      };
    },
    dispose() {}
  };
  const strictPresentationPort = { invoke() { return undefined; } };
  const strictPortFailure = async (artifactPatch, modulePatch = {}, planPatch = {}, optionPatch = {}) => {
    const strictPortRoot = createRoot();
    const runtime = maracaRuntimeApi.createMaracaPlanRuntime({
      plan: {
        orchestration: {
          strict: true,
          artifact: {
            state: {},
            render: { root: { type: 'fragment', children: [] } },
            ...artifactPatch
          }
        },
        ...planPatch
      },
      root: strictPortRoot,
      viewProjectionPort: createViewProjectionPort(strictPortRoot),
      domRenderer: strictPortRenderer,
      presentationEffectPort: strictPresentationPort,
      ensureComponentsOnBoot: false,
      hydrateOnBoot: false,
      loadModules: async () => ({ state: fakeModules.state, ...modulePatch }),
      ...optionPatch
    });
    try {
      await runtime.boot();
      return null;
    } catch (error) {
      return error;
    } finally {
      runtime.dispose();
    }
  };
  const missingActionPortError = await strictPortFailure({ actions: { actions: [{ id: 'save' }] } });
  const incompleteModelPortsError = await strictPortFailure({}, {
    state: {
      createRmtStateSelectorRuntime() {
        return { snapshot: () => ({ states: {}, selectors: {}, derived: {} }), subscribe: () => () => {} };
      }
    }
  });
  const missingAppPortError = await strictPortFailure(
    { actions: { actions: [{ id: 'save' }] } },
    {
      action: {
        createRmtActionEffectRuntime() {
          return { runAction: async () => ({ status: 'success', modelOperations: [] }) };
        }
      }
    }
  );
  const missingEventPortError = await strictPortFailure({
    events: [{ id: 'save-click', event: 'click', action: 'save' }]
  });
  const missingSurfacePortError = await strictPortFailure({
    surfaces: [{ id: 'surface.strict', source: 'strict' }]
  });
  const missingTransitionPortError = await strictPortFailure({}, {}, {
    transitions: { enabled: true, strict: true, artifact: { transitions: [] } }
  });
  const missingKernelSchedulerPortError = await strictPortFailure({}, {}, {
    kernel: { enabled: true, strict: true, artifact: {} }
  });
  const forbiddenSurfaceStateWriterError = await strictPortFailure({}, {}, {}, {
    surfaceStateProjection: { apply() { return true; } }
  });
  context.assert(missingActionPortError
    && missingActionPortError.code === 'xtend.maraca.mvc.action-command-port-missing',
  'strict Maraca rejects declared actions without an Action command port before boot');
  context.assert(incompleteModelPortsError
    && incompleteModelPortsError.code === 'xtend.maraca.mvc.model-ports-incomplete',
  'strict Maraca rejects incomplete Model read/command ports before boot');
  context.assert(missingAppPortError
    && missingAppPortError.code === 'xtend.maraca.mvc.application-controller-port-missing',
  'strict Maraca rejects declared actions without an Application Controller port before boot');
  context.assert(missingEventPortError
    && missingEventPortError.code === 'xtend.maraca.mvc.event-router-port-missing',
  'strict Maraca rejects declared application events without the Event Router port before boot');
  context.assert(missingSurfacePortError
    && missingSurfacePortError.code === 'xtend.maraca.mvc.surface-controller-missing',
  'strict Maraca rejects declared surfaces without the Surface lifecycle authority before boot');
  context.assert(missingTransitionPortError
    && missingTransitionPortError.code === 'xtend.maraca.mvc.animation-port-missing',
  'strict Maraca rejects enabled transitions without the Animation and Transition ports before boot');
  context.assert(missingKernelSchedulerPortError
    && missingKernelSchedulerPortError.code === 'xtend.maraca.mvc.kernel-scheduler-port-missing',
  'strict Maraca rejects enabled kernel plans without the Host Scheduler controller before boot');
  context.assert(forbiddenSurfaceStateWriterError
    && forbiddenSurfaceStateWriterError.code === 'xtend.maraca.mvc.surface-state-writer-forbidden',
  'strict Maraca rejects a second Surface-owned application-state writer before boot');

  const createDisposeFailureModules = (kernelDispose) => ({
    state: fakeModules.state,
    viewProjection: viewProjectionApi,
    kernel: {
      createRmtKernelOrchestrationController() {
        return {
          scheduleWork(_kind, work) { return Promise.resolve().then(work); },
          snapshot() { return { schema: 'test-dispose-kernel', status: 'ready' }; },
          dispose: kernelDispose
        };
      }
    }
  });
  const createDisposeFailureRenderer = (onDispose) => ({
    schema: 'xtend.epic18.rmt-dom-descriptor-renderer.v1',
    commit(request) {
      return {
        schema: 'xtend.rmt.dom-commit-result.v1',
        operation: request.operation,
        target: request.target || null,
        nodes: request.target && request.target.children || [],
        nodeCount: request.target && request.target.children ? request.target.children.length : 0,
        changed: false,
        structural: false,
        diagnostics: [],
        metadata: request.context && request.context.metadata || null
      };
    },
    dispose: onDispose
  });
  let failedRendererDisposeCount = 0;
  let fallbackRootClearCount = 0;
  let disposeFailureKernelCount = 0;
  const fallbackRoot = {
    ownerDocument: {},
    children: [{ retainedUntilFallback: true }],
    replaceChildren(...nodes) {
      fallbackRootClearCount += 1;
      this.children = nodes;
    }
  };
  const disposeFailureRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan,
    root: fallbackRoot,
    domRenderer: createDisposeFailureRenderer(() => {
      failedRendererDisposeCount += 1;
      throw new Error('renderer dispose failed');
    }),
    loadModules: async () => createDisposeFailureModules(() => {
      disposeFailureKernelCount += 1;
    })
  });
  await disposeFailureRuntime.boot();
  const firstDisposeResult = disposeFailureRuntime.dispose();
  const secondDisposeResult = disposeFailureRuntime.dispose();
  const disposeFailureDiagnostics = disposeFailureRuntime.snapshot().diagnostics;
  context.assert(firstDisposeResult === true && secondDisposeResult === false
    && failedRendererDisposeCount === 1
    && fallbackRootClearCount === 1
    && fallbackRoot.children.length === 0
    && disposeFailureKernelCount === 1
    && disposeFailureDiagnostics.filter((entry) => entry.code === 'rmt.dom.renderer-dispose-failed').length === 1
    && disposeFailureDiagnostics.filter((entry) => entry.code === 'rmt.dom.dispose-root-clear-fallback').length === 1,
  'renderer dispose failures are diagnosed, fall back to one owned-root clear, and do not stop or repeat the remaining dispose chain');

  let retainedRootClearCount = 0;
  let retainedRendererDisposeCount = 0;
  const retainedRoot = {
    ownerDocument: {},
    children: [{ retainedByPolicy: true }],
    replaceChildren(...nodes) {
      retainedRootClearCount += 1;
      this.children = nodes;
    }
  };
  const retainedRootRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan,
    root: retainedRoot,
    clearOwnedDom: false,
    domRenderer: createDisposeFailureRenderer(() => {
      retainedRendererDisposeCount += 1;
      throw new Error('renderer dispose failed without clear policy');
    }),
    loadModules: async () => createDisposeFailureModules(() => {})
  });
  await retainedRootRuntime.boot();
  retainedRootRuntime.dispose();
  context.assert(retainedRendererDisposeCount === 1
    && retainedRootClearCount === 0
    && retainedRoot.children.length === 1
    && retainedRootRuntime.snapshot().diagnostics.some((entry) => entry.code === 'rmt.dom.renderer-dispose-failed')
    && !retainedRootRuntime.snapshot().diagnostics.some((entry) => entry.code === 'rmt.dom.dispose-root-clear-fallback'),
  'clearOwnedDom false diagnoses renderer disposal failure without mutating the retained app root');

  let throwingRootClearCount = 0;
  let throwingRootKernelDisposeCount = 0;
  const throwingRoot = {
    ownerDocument: {},
    children: [{ uncleared: true }],
    replaceChildren() {
      throwingRootClearCount += 1;
      throw new Error('root clear failed');
    }
  };
  const rootClearFailureRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan,
    root: throwingRoot,
    domRenderer: createDisposeFailureRenderer(() => {
      throw new Error('renderer dispose failed before root clear');
    }),
    loadModules: async () => createDisposeFailureModules(() => {
      throwingRootKernelDisposeCount += 1;
    })
  });
  await rootClearFailureRuntime.boot();
  rootClearFailureRuntime.dispose();
  const rootClearFailureDiagnostics = rootClearFailureRuntime.snapshot().diagnostics;
  context.assert(throwingRootClearCount === 1
    && throwingRootKernelDisposeCount === 1
    && rootClearFailureRuntime.snapshot().phase === 'disposed'
    && rootClearFailureDiagnostics.some((entry) => entry.code === 'rmt.dom.renderer-dispose-failed')
    && rootClearFailureDiagnostics.some((entry) => entry.code === 'rmt.dom.root-clear-failed'),
  'root-clear fallback failures are diagnosed after renderer failure while the owned kernel still reaches disposal');

  const effectOrder = [];
  let effectHostContext = null;
  const effectStateValue = {
    src: 'https://cdn.example.test/video.mp4',
    hidden: false,
    open: true,
    kind: 'video',
    surfaceId: 'effect.player'
  };
  const effectPlayer = {
    localName: 'x-player',
    getAttribute(name) { return name === 'data-maraca-surface' ? 'effect.player' : null; },
    hasAttribute() { return false; },
    dispatchEvent() { effectOrder.push('event'); return true; },
    async remotePlay(payload) { effectOrder.push('public-method'); this.lastPayload = payload; return { ok: true }; }
  };
  const effectRoot = {
    ownerDocument: {},
    children: [effectPlayer],
    replaceChildren(...nodes) { this.children = nodes; },
    contains(node) { return this.children.includes(node); },
    querySelectorAll(selector) { return selector === '[data-maraca-surface]' ? this.children : []; },
    querySelector(selector) {
      if (selector === 'x-surface-manager') return null;
      return selector.includes('data-maraca-surface') ? effectPlayer : null;
    }
  };
  effectPlayer.parentElement = effectRoot;
  const effectSnapshot = () => ({
    states: { 'effect.player': { ...effectStateValue } },
    selectors: {},
    derived: {}
  });
  const effectStateRuntime = {
    createRenderContext: (extra = {}) => ({ ...extra }),
    getState: (id) => id === 'effect.player' ? { ...effectStateValue } : undefined,
    snapshot: effectSnapshot,
    transaction(callback, metadata) {
      const previous = effectSnapshot();
      callback(effectStateRuntime);
      const next = effectSnapshot();
      return {
        previous,
        next,
        patchPlan: { strategy: 'attribute-sync', structural: false, changedStates: [], changedSelectors: [], changedDerived: [] },
        metadata
      };
    },
    modelReader: {
      getState: (id) => id === 'effect.player' ? { ...effectStateValue } : undefined,
      snapshot: effectSnapshot
    },
    modelCommandPort: {
      apply(_operations, metadata) {
        return effectStateRuntime.transaction(() => {}, metadata);
      }
    },
    subscribe() { return () => {}; },
    dispose() {}
  };
  const effectRenderer = {
    schema: 'xtend.epic18.rmt-dom-descriptor-renderer.v1',
    isUrlAllowed(value) { effectOrder.push('url-policy'); return String(value).startsWith('https://'); },
    commit(request) {
      return {
        schema: 'xtend.rmt.dom-commit-result.v1',
        operation: request.operation,
        target: request.target,
        nodes: [],
        nodeCount: 0,
        changed: false,
        structural: false,
        diagnostics: [],
        metadata: request.context && request.context.metadata
      };
    },
    dispose() {}
  };
  const effectActionHistory = [];
  const effectModules = {
    state: { createRmtStateSelectorRuntime: () => effectStateRuntime },
    viewProjection: viewProjectionApi,
    presentation: presentationEffectApi,
    action: { createRmtActionEffectRuntime: () => ({
      async runAction() {
        const result = {
          status: 'success',
          effects: [{
            id: 'play-effect',
            kind: 'remote-play',
            value: {
              deferred: true,
              effect: { id: 'play-effect', kind: 'remote-play', source: { target: 'effect.player' } },
              context: {}
            }
          }],
          postCommitEffects: [{
            id: 'play-effect',
            kind: 'remote-play',
            value: {
              deferred: true,
              effect: { id: 'play-effect', kind: 'remote-play', source: { target: 'effect.player' } },
              context: {}
            }
          }]
        };
        effectActionHistory.push(result);
        return result;
      },
      listHistory() { return effectActionHistory; },
      dispose() {}
    }) }
  };
  const effectPlan = { orchestration: { artifact: {
    state: { reducers: [] },
    actions: { actions: [{ id: 'effect.play' }] },
    surfaces: [{ id: 'effect.player', source: 'effect.player', component: 'x-player' }],
    render: {
      descriptors: [{ type: 'component', tag: 'x-player', surface: 'effect.player' }],
      root: { type: 'fragment', children: [] }
    },
    patchPlan: { reducers: [] }
  } } };
  const effectRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan: effectPlan,
    root: effectRoot,
    domRenderer: effectRenderer,
    adoptExisting: true,
    ensureComponentsOnBoot: false,
    hydrateOnBoot: false,
    loadModules: async () => effectModules,
    componentRegistry: {
      async ensureTags() { effectOrder.push('ensure-component'); }
    },
    windowTarget: {
      CustomEvent: class {
        constructor(type, init) { this.type = type; this.detail = init.detail; this.defaultPrevented = false; }
      },
      requestAnimationFrame(callback) { callback(); },
      dispatchEvent() { return true; }
    },
    postCommitEffects(_result, hookContext) { effectOrder.push('host-hook'); effectHostContext = hookContext; }
  });
  await effectRuntime.boot();
  const completedEffectResult = await effectRuntime.dispatchCommand('effect.play');
  const completedEffectHistory = effectRuntime.snapshot().actions[0].effects[0].value;
  const completedQueuedEffect = completedEffectResult.postCommitEffects[0].value;
  context.assert(effectPlayer.lastPayload && effectPlayer.lastPayload.src === effectStateValue.src
    && effectOrder.join(',') === 'url-policy,ensure-component,event,public-method,host-hook'
    && effectHostContext
    && Object.isFrozen(effectHostContext)
    && effectHostContext.modelSnapshot
    && !Object.prototype.hasOwnProperty.call(effectHostContext, 'renderer')
    && !Object.prototype.hasOwnProperty.call(effectHostContext, 'validationRuntime')
    && !Object.prototype.hasOwnProperty.call(effectHostContext, 'transitionRuntime')
    && !Object.prototype.hasOwnProperty.call(effectHostContext, 'resourceManager')
    && completedEffectHistory.deferred === false
    && completedEffectHistory.result
    && completedEffectHistory.result.payload.schema === 'xtend.maraca.remote-play.v1'
    && completedEffectResult.effects[0].value.deferred === false
    && completedQueuedEffect.deferred === false
    && completedQueuedEffect.result.payload.schema === 'xtend.maraca.remote-play.v1',
  'canonical Plan Runtime applies root-scoped media defaults through URL policy and public component methods before additive host hooks');
  const publicCallsBeforeUnsafeUrl = effectOrder.filter((entry) => entry === 'public-method').length;
  effectStateValue.src = 'javascript:alert(1)';
  let unsafeEffectBlocked = false;
  try {
    await effectRuntime.dispatchCommand('effect.play');
  } catch (error) {
    unsafeEffectBlocked = error && error.code === 'rmt.dom.url.unsafe';
  }
  context.assert(unsafeEffectBlocked
    && effectOrder.filter((entry) => entry === 'public-method').length === publicCallsBeforeUnsafeUrl,
  'canonical media effects fail closed before public component methods for renderer-rejected URLs');
  effectStateValue.src = 'https://cdn.example.test/video.mp4';
  const eventsBeforeUnsafePoster = effectOrder.filter((entry) => entry === 'event').length;
  const methodsBeforeUnsafePoster = effectOrder.filter((entry) => entry === 'public-method').length;
  const rejectedPosters = [];
  for (const poster of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>']) {
    effectStateValue.poster = poster;
    try {
      await effectRuntime.dispatchCommand('effect.play');
    } catch (error) {
      if (error && error.code === 'rmt.dom.url.unsafe') rejectedPosters.push(poster);
    }
  }
  context.assert(rejectedPosters.length === 2
    && effectOrder.filter((entry) => entry === 'event').length === eventsBeforeUnsafePoster
    && effectOrder.filter((entry) => entry === 'public-method').length === methodsBeforeUnsafePoster,
  'remote-play rejects javascript and data poster URLs before event dispatch or public component methods');
  effectRuntime.dispose();

  const lightboxCalls = [];
  const lightboxElement = {
    localName: 'x-lightbox',
    getAttribute(name) { return name === 'data-maraca-surface' ? 'effect.lightbox' : null; },
    open(src, metadata) { lightboxCalls.push({ src, metadata }); }
  };
  const lightboxRoot = {
    contains(element) { return element === lightboxElement; },
    querySelector(selector) {
      return selector.includes('data-maraca-surface') ? lightboxElement : null;
    }
  };
  const lightboxPort = presentationEffectApi.createRmtPresentationEffectAdapter({
    root: lightboxRoot,
    modelReader: {
      getState(id) {
        return id === 'effect.lightbox'
          ? { surfaceId: id, src: 'https://cdn.example.test/image.jpg', open: true }
          : null;
      }
    },
    domRenderer: effectRenderer,
    componentRegistry: { ensureTags() { return Promise.resolve(); } },
    windowTarget: {}
  });
  const lightboxResult = await lightboxPort.invoke({
    id: 'show-lightbox',
    kind: 'lightbox',
    source: { target: 'effect.lightbox' }
  });
  context.assert(lightboxResult && lightboxResult.open === true
    && lightboxCalls.length === 1
    && lightboxCalls[0].src === 'https://cdn.example.test/image.jpg'
    && lightboxPort.dispose() === true
    && lightboxPort.dispose() === false,
  'the canonical PresentationEffectPort owns root-scoped lightbox resolution, public component invocation and idempotent disposal');
  let componentCommandHookContext = null;
  const componentCommandPort = presentationEffectApi.createRmtPresentationEffectAdapter({
    root: lightboxRoot,
    componentCommandPort(_command, hookContext) {
      componentCommandHookContext = hookContext;
      return { ok: true };
    }
  });
  await componentCommandPort.invoke({ componentCommand: { command: 'demo.open' } }, {
    action: 'demo.action',
    metadata: { correlationId: 'safe-hook' }
  });
  context.assert(componentCommandHookContext
    && Object.isFrozen(componentCommandHookContext)
    && Object.isFrozen(componentCommandHookContext.metadata)
    && !Object.prototype.hasOwnProperty.call(componentCommandHookContext, 'root')
    && !Object.prototype.hasOwnProperty.call(componentCommandHookContext, 'ensureComponent'),
  'Presentation component-command hooks receive immutable metadata instead of raw DOM or registry handles');
  componentCommandPort.dispose();

  const strictPresentationRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan: {
      ...effectPlan,
      orchestration: { ...effectPlan.orchestration, mode: 'strict', strict: true }
    },
    root: effectRoot,
    viewProjectionPort: createViewProjectionPort(effectRoot),
    domRenderer: effectRenderer,
    adoptExisting: true,
    ensureComponentsOnBoot: false,
    hydrateOnBoot: false,
    loadModules: async () => ({
      state: fakeModules.state,
      action: effectModules.action,
      app: {
        createRmtAppRuntime() {
          return { dispatchCommand() {}, dispose() {} };
        }
      },
      surfaceController: {
        createSurfaceController() {
          return {
            apply() { return { ok: true }; },
            readSnapshot() { return { surfaces: [] }; },
            subscribe() { return () => {}; },
            dispose() {}
          };
        }
      },
      surfaces: {
        createRmtSurfaceResourceGraphRuntime() {
          return { materialize() { return { materialized: [] }; }, dispose() {} };
        }
      }
    })
  });
  let presentationPortFailure = null;
  try {
    await strictPresentationRuntime.boot();
  } catch (error) {
    presentationPortFailure = error;
  }
  context.assert(presentationPortFailure
    && presentationPortFailure.code === 'xtend.maraca.mvc.presentation-port-missing',
  'strict Maraca fails closed during boot when the composition root cannot supply a PresentationEffectPort');
  strictPresentationRuntime.dispose();

  const createSurfaceNode = (surface) => {
    const attributes = new Map([['data-maraca-surface', surface]]);
    return {
      style: {},
      getAttribute(name) { return attributes.has(name) ? attributes.get(name) : null; },
      setAttribute(name, value) { attributes.set(name, String(value)); },
      removeAttribute(name) { attributes.delete(name); },
      toggleAttribute(name, enabled) { if (enabled) attributes.set(name, ''); else attributes.delete(name); },
      hasAttribute(name) { return attributes.has(name); }
    };
  };
  const visibleNode = createSurfaceNode('wizard.contact');
  const hiddenNode = createSurfaceNode('wizard.issue');
  const nextNode = createSurfaceNode('wizard.next');
  hiddenNode.focusPreserved = true;
  const transitionCalls = [];
  const patchCalls = [];
  const visibilityRendererRequests = [];
  const eventReconcileCalls = [];
  const domCommitEvents = [];
  const runtimeSubscriptionSnapshots = [];
  const visibilityState = { contact: { hidden: false }, issue: { hidden: true } };
  const visibilityListeners = new Set();
  let stateTransactionCount = 0;
  let surfaceQueryCount = 0;
  let rendererDisposeCount = 0;
  let eventDisposeCount = 0;
  let hydrationCount = 0;
  let validationEvaluateCount = 0;
  let validationApplyCount = 0;
  const surfaceMaterializeInputs = [];
  const visibilityRoot = {
    ownerDocument: {},
    children: [],
    replaceChildren(...nodes) { this.children = nodes; },
    querySelectorAll(selector) {
      if (selector !== '[data-maraca-surface]') return [];
      surfaceQueryCount += 1;
      return this.children;
    }
  };
  const visibilitySnapshot = () => ({
    states: {
      contact: { hidden: true },
      issue: { hidden: false }
    },
    selectors: {
      contact: { ...visibilityState.contact },
      issue: { ...visibilityState.issue }
    },
    derived: {
      summary: { visible: visibilityState.issue.hidden !== true ? 'issue' : 'contact' }
    }
  });
  let visibilityStateRuntime = null;
  const visibilityModules = {
    viewProjection: viewProjectionApi,
    state: { createRmtStateSelectorRuntime: () => {
      let inTransaction = false;
      visibilityStateRuntime = {
        createRenderContext: (extra = {}) => ({ ...extra, selectorValues: visibilitySnapshot().selectors }),
        getState: (id) => ({ ...visibilityState[id] }),
        setState(id, value) {
          visibilityState[id] = value;
          if (!inTransaction) visibilityListeners.forEach((listener) => listener({ state: id }));
        },
        snapshot: visibilitySnapshot,
        transaction(callback, metadata = {}) {
          const previous = visibilitySnapshot();
          inTransaction = true;
          try { callback(visibilityStateRuntime); } finally { inTransaction = false; }
          stateTransactionCount += 1;
          const next = visibilitySnapshot();
          const changedStates = Object.keys(visibilityState).filter((id) => JSON.stringify(previous.selectors[id]) !== JSON.stringify(next.selectors[id]));
          const event = {
            schema: 'xtend.epic18.rmt-state-change.v1',
            previous,
            next,
            patchPlan: { strategy: 'attribute-sync', structural: false, changedStates, changedSelectors: changedStates, changedDerived: [] },
            metadata
          };
          visibilityListeners.forEach((listener) => listener(event));
          return event;
        },
        modelReader: { snapshot: visibilitySnapshot },
        modelCommandPort: {
          apply(operations, metadata = {}) {
            return visibilityStateRuntime.transaction(() => {
              operations.forEach((operation) => {
                if (operation.operation === 'set') visibilityStateRuntime.setState(operation.state, operation.value);
                else if (operation.operation === 'patch') {
                  visibilityStateRuntime.setState(operation.state, {
                    ...visibilityStateRuntime.getState(operation.state),
                    ...operation.patch
                  });
                }
              });
            }, metadata);
          }
        },
        subscribe(listener) { visibilityListeners.add(listener); return () => visibilityListeners.delete(listener); }
      };
      return visibilityStateRuntime;
    } },
    action: { createRmtActionEffectRuntime: () => ({ runAction: async (id, payload) => ({ id, status: 'success', data: payload }) }) },
    transitions: { createRmtSurfaceTransitionRuntime: () => ({
      findTransition: ({ action }) => action === 'wizard.next' ? { id: 'wizard.next-step', from: ['wizard.contact'], to: ['wizard.issue'] } : null,
      applyVisibilityPatch(input) {
        transitionCalls.push({ surface: input.surface, previousHidden: input.previousHidden, nextHidden: input.nextHidden });
        return Promise.resolve({ status: 'complete' });
      }
    }) },
    validation: { createRmtFormValidationRuntime: () => ({
      evaluate() {
        validationEvaluateCount += 1;
        return { schema: 'xtend.rmt.form-validation-evaluation.v1', valid: true, results: [] };
      },
      apply() {
        validationApplyCount += 1;
        return { schema: 'xtend.rmt.form-validation-apply-report.v1', valid: true };
      }
    }) },
    renderer: { createRmtDomDescriptorRenderer: () => ({
      schema: 'xtend.epic18.rmt-dom-descriptor-renderer.v1',
      commit(request) {
        visibilityRendererRequests.push(request);
        if (request.operation === 'replace-children') {
          visibleNode.removeAttribute('hidden');
          visibleNode.style.display = '';
          hiddenNode.setAttribute('hidden', '');
          hiddenNode.style.display = 'none';
          request.target.replaceChildren(visibleNode, hiddenNode, nextNode);
          return {
            schema: 'xtend.rmt.dom-commit-result.v1',
            operation: request.operation,
            target: request.target,
            nodes: request.target.children,
            nodeCount: 3,
            changed: true,
            structural: true,
            diagnostics: [],
            metadata: request.context.metadata
          };
        }
        const visitDescriptors = (value) => {
          if (Array.isArray(value)) {
            value.forEach(visitDescriptors);
            return;
          }
          if (!value || typeof value !== 'object') return;
          if (value.surface) {
            const elementBySurface = {
              'wizard.contact': visibleNode,
              'wizard.issue': hiddenNode,
              'wizard.next': nextNode
            };
            patchCalls.push({
              element: elementBySurface[value.surface] || request.target,
              surface: value.surface,
              descriptor: value
            });
          }
          ['children', 'descriptors', 'nodes'].forEach((key) => visitDescriptors(value[key]));
          ['child', 'content', 'fallback', 'then', 'else', 'empty', 'template', 'itemTemplate', 'node', 'descriptor']
            .forEach((key) => visitDescriptors(value[key]));
          Object.values(value.slots || {}).forEach(visitDescriptors);
        };
        visitDescriptors(request.descriptors || request.descriptor);
        return {
          schema: 'xtend.rmt.dom-commit-result.v1',
          operation: request.operation,
          target: request.target,
          nodes: request.target.children,
          nodeCount: request.target.children.length,
          changed: true,
          structural: false,
          diagnostics: [],
          metadata: request.context.metadata
        };
      },
      dispose(target, options) {
        rendererDisposeCount += 1;
        if (options.clearOwnedDom) target.replaceChildren();
      }
    }) },
    events: { createRmtEventRoutingRuntime: () => ({
      reconcile(root, commit) {
        eventReconcileCalls.push({ root, commit });
        return { attachedCount: 0, detachedCount: 0, retainedCount: 0 };
      },
      dispose() { eventDisposeCount += 1; }
    }) },
    surfaces: { createRmtSurfaceResourceGraphRuntime: () => ({
      materialize(input) {
        surfaceMaterializeInputs.push(input);
        return { schema: 'test-surface-materialization-report', materialized: [] };
      },
      getSnapshot() { return { schema: 'test-surface-resource-graph-snapshot' }; },
      dispose() {}
    }) }
  };
  const visibilityPlan = { orchestration: { artifact: {
    state: { reducers: [
      { id: 'hide-contact', action: 'wizard.next', state: 'contact', path: 'hidden', value: true },
      { id: 'show-issue', action: 'wizard.next', state: 'issue', path: 'hidden', value: false },
      { id: 'update-issue', action: 'wizard.type', state: 'issue', path: 'value', value: 'input.value' }
    ] },
    actions: { actions: [{ id: 'wizard.next' }, { id: 'wizard.type' }] },
    surfaces: [{ id: 'wizard.contact', source: 'contact' }, { id: 'wizard.issue', source: 'issue' }, { id: 'wizard.next', source: 'next' }],
    render: {
      descriptors: [],
      root: [
        {
          type: 'fragment',
          nodes: [
            { id: 'surface:contact', surface: 'wizard.contact', type: 'component', tag: 'x-input' },
            {
              type: 'fragment',
              slots: {
                body: {
                  type: 'fragment',
                  nodes: [{
                    id: 'surface:issue',
                    surface: 'wizard.issue',
                    type: 'component',
                    tag: 'x-textarea',
                    attributes: {
                      style: {
                        display: 'none',
                        visibility: 'hidden',
                        'pointer-events': 'none',
                        opacity: '0',
                        transform: 'scale(.9)',
                        'transform-origin': 'center',
                        transition: 'all',
                        filter: 'blur(2px)',
                        'will-change': 'opacity',
                        color: 'red'
                      }
                    }
                  }]
                }
              }
            }
          ]
        },
        {
          type: 'fragment',
          slots: {
            footer: [{ id: 'surface:next', surface: 'wizard.next', type: 'component', tag: 'x-button' }]
          }
        }
      ],
    },
    patchPlan: { reducers: [
      { reducer: 'hide-contact', action: 'wizard.next', surface: 'wizard.contact', strategy: 'surface-transition' },
      { reducer: 'show-issue', action: 'wizard.next', surface: 'wizard.issue', strategy: 'surface-transition' },
      { reducer: 'update-issue', action: 'wizard.type', surface: 'wizard.issue', strategy: 'attribute-sync' }
    ], validation: [{ id: 'validation:next', targetState: 'next', strategy: 'attribute-sync' }] }
  } }, transitions: { enabled: true, artifact: {} }, validation: { enabled: true, artifact: { actionGates: [], statePatches: [] } } };
  const visibilityRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan: visibilityPlan,
    root: visibilityRoot,
    loadModules: async () => visibilityModules,
    componentRegistry: { async hydrate() { hydrationCount += 1; } }
  });
  visibilityRuntime.subscribe((runtimeSnapshot) => {
    runtimeSubscriptionSnapshots.push(runtimeSnapshot);
    const event = runtimeSnapshot.lastEvent;
    if (event.type === 'xtend-maraca:dom-commit') domCommitEvents.push(event);
  });
  const visibilityBootSnapshot = await visibilityRuntime.boot();
  context.assert(visibilityBootSnapshot.phase === 'ready' && Object.isFrozen(visibilityBootSnapshot),
    'managed runtime boot resolves to an immutable public snapshot');
  const visibilityRepeatedBootSnapshot = await visibilityRuntime.boot();
  context.assert(visibilityRepeatedBootSnapshot.phase === 'ready'
    && visibilityRepeatedBootSnapshot !== visibilityRuntime
    && Object.isFrozen(visibilityRepeatedBootSnapshot),
  'repeated managed boot resolves to a fresh immutable snapshot instead of exposing the runtime controller');
  context.assert(!visibleNode.hasAttribute('hidden') && visibleNode.style.display !== 'none', 'plan runtime keeps the active wizard surface visible');
  context.assert(hiddenNode.hasAttribute('hidden') && hiddenNode.style.display === 'none', 'descriptor commit remains the owner of initial surface visibility');
  transitionCalls.length = 0;
  const visibilityCommandResult = await visibilityRuntime.dispatchCommand('wizard.next');
  context.assert(Object.isFrozen(visibilityCommandResult),
    'managed command dispatch resolves to an immutable result instead of exposing Action internals');
  context.assert(transitionCalls.filter((entry) => entry.surface === 'wizard.contact' && entry.previousHidden === false && entry.nextHidden === true).length === 1
    && transitionCalls.filter((entry) => entry.surface === 'wizard.issue' && entry.previousHidden === true && entry.nextHidden === false).length === 1
    && transitionCalls.length === 2,
  'plan runtime routes each enter and exit visibility phase once with explicit Model-derived previous and next visibility');
  const issueHost = visibilityRoot.children.find((element) => element === hiddenNode);
  await visibilityRuntime.dispatchCommand('wizard.type', { value: 'a' });
  context.assert(visibilityState.issue.value === 'a' && visibilityRoot.children.includes(issueHost)
    && issueHost.focusPreserved === true && patchCalls.some((entry) => entry.element === issueHost && entry.surface === 'wizard.issue')
    && patchCalls.some((entry) => entry.element === nextNode && entry.surface === 'wizard.next'), 'plan runtime reconciles input and validation descriptors without replacing the focused surface host');
  const issuePatchDescriptor = patchCalls.find((entry) => entry.surface === 'wizard.issue').descriptor;
  const issuePatchStyles = issuePatchDescriptor && issuePatchDescriptor.attributes && issuePatchDescriptor.attributes.style || {};
  context.assert(issuePatchStyles.color === 'red'
    && ['display', 'visibility', 'pointer-events', 'opacity', 'transform', 'transform-origin', 'transition', 'filter', 'will-change']
      .every((name) => !Object.prototype.hasOwnProperty.call(issuePatchStyles, name)),
  'array, nodes, and slots surface traversal stays incremental while transition-owned visibility styles are excluded');
  const visibilityRuntimeSnapshot = visibilityRuntime.snapshot();
  context.assert(stateTransactionCount === 2 && visibilityRuntimeSnapshot.stateCommitCount === 2
    && visibilityRuntimeSnapshot.commitCount === 3 && visibilityRuntimeSnapshot.renderCount === 1,
  'plan runtime batches every command into one state commit while renderCount remains full-render only');
  context.assert(validationEvaluateCount === 2 && validationApplyCount === 0,
    'plan runtime evaluates validation once and projects it into the shared DOM commit without invoking standalone validation.apply()');
  context.assert(domCommitEvents.length === 3 && eventReconcileCalls.length === 3 && hydrationCount === 3,
    'plan runtime emits and post-processes exactly one DOM commit for boot and each command');
  context.assert(visibilityRendererRequests.length === 3
    && visibilityRendererRequests[0].operation === 'replace-children'
    && visibilityRendererRequests.slice(1).every((request) => request.operation === 'reconcile-children'),
  'boot and two commands invoke the shared renderer exactly once each');
  context.assert(runtimeSubscriptionSnapshots.length > 0
    && runtimeSubscriptionSnapshots.every((runtimeSnapshot) => Object.isFrozen(runtimeSnapshot)),
  'managed runtime subscribers observe only immutable completed snapshots');
  context.assert(surfaceQueryCount === 1, 'plan runtime reuses its cached surface index across non-structural commits');
  context.assert(surfaceMaterializeInputs.length === 3
    && surfaceMaterializeInputs.every((input) => (
      input.contact && input['state.contact'] && input['selector.contact']
      && input.summary && input['derive.summary'] && input['derived.summary']
    )),
  'surface materialization receives direct and namespaced state, selector, derive, and derived aliases on every commit');
  context.assert(visibilityRuntime.stateRuntime === visibilityRuntime.model
    && typeof visibilityRuntime.model.snapshot === 'function'
    && typeof visibilityRuntime.model.setState === 'undefined'
    && typeof visibilityRuntime.getRuntimeAdapters === 'undefined'
    && typeof visibilityRuntime.renderer === 'undefined',
  'plan runtime exposes one read-only Model port and no mutable adapter handles');
  const compatibilityRenderResult = await visibilityRuntime.render({ operation: 'test.mvc.refresh' });
  context.assert(Object.isFrozen(compatibilityRenderResult)
    && Object.isFrozen(compatibilityRenderResult.metadata)
    && !('target' in compatibilityRenderResult)
    && !('nodes' in compatibilityRenderResult),
  'legacy render aliases resolve to immutable commit summaries without DOM handles');
  visibilityRuntime.dispose();
  visibilityRuntime.dispose();
  context.assert(rendererDisposeCount === 1 && eventDisposeCount === 1 && visibilityRoot.children.length === 0,
    'plan runtime dispose is complete, clearing, and idempotent');

  const stateRuntimeApi = await import(`file://${resolveRepoPath('xtendrmt/rmt-state-selector-runtime.js', rootDir)}`);
  const actionRuntimeApi = await import(`file://${resolveRepoPath('xtendrmt/rmt-action-effect-runtime.js', rootDir)}`);
  const bootRaceRoot = createRoot();
  let releaseBootRaceHydration;
  let signalBootRaceHydration;
  const bootRaceHydrationBarrier = new Promise((resolve) => { releaseBootRaceHydration = resolve; });
  const bootRaceHydrationStarted = new Promise((resolve) => { signalBootRaceHydration = resolve; });
  let bootRaceCommandBus = null;
  let bootRaceActionCount = 0;
  let bootRaceAppDispatchCount = 0;
  let bootRaceStreamPlanCount = 0;
  let bootRaceStreamCommitCount = 0;
  let bootRaceHydrationCount = 0;
  let bootRaceRendererCommitCount = 0;
  const bootRaceCommands = [];
  const bootRaceStreamPatches = [];
  const bootRaceRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan: {
      orchestration: {
        artifact: {
          state: {
            states: [{ id: 'boot.race', type: 'object', initial: { value: 'initial' } }],
            reducers: [{ id: 'boot-race-command', action: 'boot.race.command', state: 'boot.race', path: 'value', value: 'input.value' }]
          },
          actions: { actions: [{ id: 'boot.race.command' }] },
          events: [{ id: 'boot-race-event', event: 'click', action: 'boot.race.command' }],
          render: { root: { type: 'fragment', children: [] } },
          patchPlan: {
            reducers: [{ reducer: 'boot-race-command', action: 'boot.race.command', strategy: 'attribute-sync' }]
          }
        }
      }
    },
    root: bootRaceRoot,
    viewProjectionPort: createViewProjectionPort(bootRaceRoot),
    kernelController: {
      scheduleWork(_kind, work) {
        return Promise.resolve().then(work);
      },
      snapshot() { return { schema: 'test-external-kernel', status: 'ready' }; },
      dispose() {}
    },
    domRenderer: {
      commit(request) {
        bootRaceRendererCommitCount += 1;
        if (request.operation === 'replace-children') request.target.replaceChildren();
        return {
          operation: request.operation,
          target: request.target,
          nodes: request.target.children,
          nodeCount: request.target.children.length,
          changed: request.operation === 'replace-children',
          structural: request.operation === 'replace-children',
          diagnostics: [],
          metadata: request.context && request.context.metadata || {}
        };
      },
      dispose() {}
    },
    componentRegistry: {
      hydrate() {
        bootRaceHydrationCount += 1;
        signalBootRaceHydration();
        return bootRaceHydrationBarrier;
      }
    },
    loadModules: async () => ({
      viewProjection: viewProjectionApi,
      state: stateRuntimeApi,
      action: {
        createRmtActionEffectRuntime: () => ({
          async runAction(id, payload) {
            bootRaceActionCount += 1;
            return { id, status: 'success', data: payload };
          },
          dispose() {}
        })
      },
      app: {
        createRmtAppRuntime: ({ actionRuntime }) => ({
          createCommandEnvelope(input = {}, metadata = {}) {
            return {
              command: input.command || input.id || input.action,
              payload: input.payload || {},
              correlationId: metadata.correlationId || input.correlationId || ''
            };
          },
          async dispatchCommand(command, metadata = {}) {
            bootRaceAppDispatchCount += 1;
            const result = await actionRuntime.runAction(command.command, command.payload || {}, {
              ...metadata,
              commandEnvelope: command
            });
            const record = { status: result.status, command, result };
            bootRaceCommands.push(record);
            return record;
          },
          planStreamPatch(patch, snapshot, metadata = {}) {
            bootRaceStreamPlanCount += 1;
            return Object.freeze({
              status: 'planned',
              accepted: true,
              changed: snapshot.states['boot.race'].value !== patch.value,
              patch: Object.freeze({ ...patch }),
              target: Object.freeze({ state: 'boot.race', path: 'value' }),
              modelOperations: Object.freeze([Object.freeze({
                operation: 'set',
                state: 'boot.race',
                value: Object.freeze({ value: patch.value })
              })]),
              postCommitEffects: Object.freeze([]),
              diagnostics: Object.freeze([]),
              metadata: Object.freeze({ ...metadata })
            });
          },
          commitStreamPatchPlan(streamPlan, metadata = {}) {
            bootRaceStreamCommitCount += 1;
            bootRaceStreamPatches.push(streamPlan.patch);
            return Object.freeze({
              status: 'applied',
              accepted: true,
              changed: streamPlan.changed,
              patch: streamPlan.patch,
              target: streamPlan.target,
              modelOperations: streamPlan.modelOperations,
              postCommitEffects: streamPlan.postCommitEffects,
              diagnostics: streamPlan.diagnostics,
              metadata: Object.freeze({ ...metadata })
            });
          },
          listCommands() { return bootRaceCommands.slice(); },
          listStreamPatches() { return bootRaceStreamPatches.slice(); },
          dispose() {}
        })
      },
      events: {
        createRmtEventRoutingRuntime: ({ commandBus }) => {
          bootRaceCommandBus = commandBus;
          return {
            reconcile() { return { attachedCount: 0, detachedCount: 0, retainedCount: 0 }; },
            dispose() {}
          };
        }
      }
    })
  });
  const bootRaceBootPromise = bootRaceRuntime.boot();
  await bootRaceHydrationStarted;
  const bootRaceCommandPromise = bootRaceCommandBus.dispatchCommand({
    command: 'boot.race.command',
    payload: { value: 'command' },
    correlationId: 'boot-race-event'
  }, {
    eventId: 'boot-race-event',
    eventName: 'click'
  });
  const bootRaceStreamPromise = bootRaceRuntime.dispatchStreamPatch({
    type: 'complete',
    target: 'boot.race.value',
    value: 'stream'
  }, { correlationId: 'boot-race-stream' });
  await Promise.resolve();
  context.assert(bootRaceRuntime.snapshot().phase === 'booting'
    && bootRaceActionCount === 0
    && bootRaceAppDispatchCount === 1
    && bootRaceStreamPlanCount === 0,
  'event commands and stream patches submitted during boot wait without entering Model or View work early');
  releaseBootRaceHydration();
  const [bootRaceBootResult, bootRaceCommandResult, bootRaceStreamResult] = await Promise.all([
    bootRaceBootPromise,
    bootRaceCommandPromise,
    bootRaceStreamPromise
  ]);
  context.assert(bootRaceBootResult.phase === 'ready'
    && bootRaceCommandResult.status === 'success'
    && bootRaceStreamResult.status === 'applied'
    && bootRaceActionCount === 1
    && bootRaceAppDispatchCount === 1
    && bootRaceStreamPlanCount === 1
    && bootRaceStreamCommitCount === 1
    && bootRaceCommands.length === 1
    && bootRaceStreamPatches.length === 1
    && bootRaceRuntime.model.getState('boot.race').value === 'stream'
    && bootRaceRuntime.snapshot().stateCommitCount === 2
    && bootRaceRendererCommitCount === 3
    && bootRaceHydrationCount === 3,
  'booting Event/Command and stream work resumes after the shared boot promise and commits exactly once in queue order');
  bootRaceRuntime.dispose();

  const disposedBootRoot = createRoot();
  let releaseDisposedBootModules;
  let signalDisposedBootModules;
  const disposedBootModulesGate = new Promise((resolve) => { releaseDisposedBootModules = resolve; });
  const disposedBootModulesStarted = new Promise((resolve) => { signalDisposedBootModules = resolve; });
  const disposedBootRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan: {
      orchestration: {
        artifact: {
          state: { states: [], reducers: [] },
          actions: { actions: [] },
          events: [],
          render: { root: { type: 'fragment', children: [] } },
          patchPlan: { reducers: [] }
        }
      }
    },
    root: disposedBootRoot,
    viewProjectionPort: createViewProjectionPort(disposedBootRoot),
    loadModules() {
      signalDisposedBootModules();
      return disposedBootModulesGate;
    }
  });
  const disposedBootPromise = disposedBootRuntime.boot();
  const duplicateDisposedBootPromise = disposedBootRuntime.boot();
  await disposedBootModulesStarted;
  const disposedBootCommandPromise = disposedBootRuntime.dispatchCommand('disposed.boot.command');
  const disposedBootStreamPromise = disposedBootRuntime.dispatchStreamPatch({
    type: 'complete',
    target: 'disposed.boot.value',
    value: 'ignored'
  });
  await Promise.resolve();
  disposedBootRuntime.dispose();
  let disposedBootTimeout;
  const disposedBootSettled = await Promise.race([
    Promise.allSettled([
      disposedBootPromise,
      duplicateDisposedBootPromise,
      disposedBootCommandPromise,
      disposedBootStreamPromise
    ]),
    new Promise((resolve) => { disposedBootTimeout = setTimeout(() => resolve(null), 250); })
  ]);
  clearTimeout(disposedBootTimeout);
  releaseDisposedBootModules({});
  await Promise.resolve();
  await Promise.resolve();
  context.assert(Array.isArray(disposedBootSettled)
    && disposedBootSettled.every((entry) => entry.status === 'rejected'
      && entry.reason && entry.reason.code === 'maraca.plan-runtime.disposed')
    && disposedBootRuntime.snapshot().phase === 'disposed',
  'disposing a booting Plan Runtime rejects boot, command, and stream waiters without waiting for the blocked boot dependency');

  const transactionRoot = createRoot();
  let transactionNotifyCount = 0;
  let transactionEvent = null;
  let externalKernelDisposeCount = 0;
  let resourceCreateCount = 0;
  let resourceDisposeCount = 0;
  let transactionRendererDisposeCount = 0;
  let gateEvaluateCount = 0;
  let gateApplyCount = 0;
  let gatePrepareCount = 0;
  let gateFinalizeCount = 0;
  let transactionHydrationCount = 0;
  let validationModelReader = null;
  let managedStreamPlanCount = 0;
  let managedStreamCommitCount = 0;
  let legacyAppStateMutationCount = 0;
  let failedActionPostCommitCount = 0;
  let failedActionTransitionFindCount = 0;
  const failedActionTransitionCalls = [];
  const scheduledKinds = [];
  const transactionRendererRequests = [];
  const firstTransactionNode = createSurfaceNode('first.surface');
  firstTransactionNode.nodeType = 1;
  firstTransactionNode.localName = 'x-input';
  const secondTransactionNode = createSurfaceNode('second.surface');
  secondTransactionNode.nodeType = 1;
  secondTransactionNode.localName = 'x-input';
  const externalKernel = {
    scheduleWork(kind, work) {
      scheduledKinds.push(kind);
      queueMicrotask(() => {
        Promise.resolve().then(work).catch(() => {});
      });
      return { status: 'scheduled' };
    },
    snapshot() { return { schema: 'test-external-kernel', status: 'ready' }; },
    dispose() { externalKernelDisposeCount += 1; }
  };
  const transactionRenderer = {
    schema: 'xtend.epic18.rmt-dom-descriptor-renderer.v1',
    commit(request) {
      transactionRendererRequests.push(request);
      if (request.operation === 'replace-children') request.target.replaceChildren(firstTransactionNode, secondTransactionNode);
      return {
        schema: 'xtend.rmt.dom-commit-result.v1',
        operation: request.operation,
        target: request.target || null,
        nodes: [],
        nodeCount: 0,
        changed: request.operation === 'replace-children',
        structural: request.operation === 'replace-children',
        diagnostics: [],
        metadata: request.context && request.context.metadata || {}
      };
    },
    dispose() { transactionRendererDisposeCount += 1; }
  };
  const transactionPlan = {
    orchestration: {
      artifact: {
        state: {
          states: [
            { id: 'save.status', type: 'object', initial: { status: 'idle' } },
            { id: 'save.result', type: 'object', initial: {} },
            { id: 'save.loading', type: 'boolean', initial: false },
            { id: 'first', type: 'object', initial: { value: '' } },
            { id: 'second', type: 'object', initial: { value: '' } },
            { id: 'validation.status', type: 'object', initial: { valid: null } },
            { id: 'blocked.target', type: 'object', initial: { value: 'unchanged' } },
            { id: 'failure.status', type: 'object', initial: { status: 'idle' } }
          ],
          reducers: [
            { id: 'set-first', action: 'save', state: 'first', path: 'value', value: 'input.first' },
            { id: 'set-second', action: 'save', state: 'second', path: 'value', value: 'input.second' },
            { id: 'blocked-write', action: 'blocked-save', state: 'blocked.target', path: 'value', value: 'input.value' },
            { id: 'failed-success-write', action: 'failed-save', state: 'first', path: 'value', value: 'input.value' }
          ]
        },
        actions: {
          actions: [{
            id: 'save',
            statusState: 'save.status',
            resultState: 'save.result',
            loadingState: 'save.loading',
            resources: ['save.timer']
          }, { id: 'blocked-save' }, { id: 'failed-save' }]
        },
        resources: [{ id: 'save.timer', kind: 'timer' }],
        surfaces: [
          { id: 'first.surface', source: 'first' },
          { id: 'second.surface', source: 'second' }
        ],
        render: {
          descriptors: [
            { type: 'component', tag: 'x-input', surface: 'first.surface' },
            { type: 'component', tag: 'x-input', surface: 'second.surface' }
          ],
          root: {
            type: 'fragment',
            children: [
              { type: 'component', tag: 'x-input', surface: 'first.surface' },
              { type: 'component', tag: 'x-input', surface: 'second.surface' }
            ]
          }
        },
        patchPlan: {
          reducers: [
            { reducer: 'set-first', action: 'save', surface: 'first.surface', strategy: 'attribute-sync' },
            { reducer: 'set-second', action: 'save', surface: 'second.surface', strategy: 'attribute-sync' },
            { reducer: 'blocked-write', action: 'blocked-save', surface: 'first.surface', strategy: 'attribute-sync' },
            { reducer: 'failed-success-write', action: 'failed-save', surface: 'first.surface', strategy: 'surface-transition' }
          ]
        }
      }
    },
    transitions: {
      enabled: true,
      artifact: {}
    },
    validation: {
      enabled: true,
      artifact: {
        actionGates: [{ id: 'blocked-gate', action: 'blocked-save', group: 'blocked.group' }],
        statePatches: []
      }
    }
  };
  const transactionRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan: transactionPlan,
    root: transactionRoot,
    domRenderer: transactionRenderer,
    kernelController: externalKernel,
    componentRegistry: { async hydrate() { transactionHydrationCount += 1; } },
    presentationEffectPort: {
      invoke() {
        failedActionPostCommitCount += 1;
        return { status: 'unexpected' };
      }
    },
    resourceAdapters: {
      timer: {
        set() { resourceCreateCount += 1; return { id: resourceCreateCount }; },
        clear() { resourceDisposeCount += 1; }
      }
    },
    loadModules: async () => ({
      viewProjection: viewProjectionApi,
      state: stateRuntimeApi,
      action: {
        ...actionRuntimeApi,
        createRmtActionEffectRuntime(options) {
          const runtime = actionRuntimeApi.createRmtActionEffectRuntime(options);
          return Object.freeze({
            ...runtime,
            async runAction(id, payload, metadata) {
              if (id !== 'failed-save') return runtime.runAction(id, payload, metadata);
              return {
                schema: 'xtend.epic18.rmt-action-result.v1',
                id,
                status: 'error',
                error: { code: 'test.failed-save', message: 'Expected failure.' },
                modelOperations: [{
                  operation: 'set',
                  state: 'failure.status',
                  value: { status: 'error', code: 'test.failed-save' }
                }],
                postCommitEffects: [{
                  id: 'failed-save-post-commit',
                  kind: 'custom',
                  value: {
                    deferred: true,
                    effect: { id: 'failed-save-post-commit', kind: 'custom' },
                    context: {}
                  }
                }],
                diagnostics: []
              };
            }
          });
        }
      },
      transitions: {
        createRmtSurfaceTransitionRuntime() {
          return {
            findTransition({ action }) {
              failedActionTransitionFindCount += 1;
              return action === 'failed-save'
                ? { id: 'failed-save-transition', from: ['first.surface'], to: ['second.surface'] }
                : null;
            },
            applyVisibilityPatch(input) {
              failedActionTransitionCalls.push(input);
              const target = input.surface === 'first.surface' ? firstTransactionNode : secondTransactionNode;
              target.toggleAttribute('hidden', input.nextHidden === true);
              return Promise.resolve({ status: 'complete' });
            },
            dispose() {}
          };
        }
      },
      app: {
        createRmtAppRuntime: ({ actionRuntime, modelReader, managedModel }) => {
          const commands = [];
          const streamPatches = [];
          return {
            schema: 'xtend.rmt.app-runtime.v2',
            createCommandEnvelope(input = {}, metadata = {}) {
              return {
                schema: 'xtend.rmt.command.v1',
                command: input.command || input.id || input.action,
                payload: input.payload || {},
                correlationId: metadata.correlationId || input.correlationId || ''
              };
            },
            async dispatchCommand(command, metadata = {}) {
              const result = await actionRuntime.runAction(command.command, command.payload || {}, {
                ...metadata,
                commandEnvelope: command
              });
              const record = { schema: 'xtend.rmt.command-dispatch-result.v1', status: 'success', command, result };
              commands.push(record);
              return record;
            },
            listCommands() { return commands.slice(); },
            planStreamPatch(patch, snapshot, metadata = {}) {
              managedStreamPlanCount += 1;
              const current = snapshot.states.first;
              return Object.freeze({
                schema: 'xtend.rmt.stream-patch-plan.v1',
                status: 'planned',
                accepted: true,
                changed: current.value !== patch.value,
                patch: Object.freeze({ ...patch }),
                target: Object.freeze({ state: 'first', path: 'value' }),
                modelOperations: Object.freeze([Object.freeze({
                  operation: 'set',
                  state: 'first',
                  value: Object.freeze({ ...current, value: patch.value })
                })]),
                postCommitEffects: Object.freeze([]),
                diagnostics: Object.freeze([]),
                metadata: Object.freeze({ ...metadata })
              });
            },
            commitStreamPatchPlan(streamPlan, metadata = {}) {
              managedStreamCommitCount += 1;
              streamPatches.push(streamPlan.patch);
              return Object.freeze({
                schema: 'xtend.rmt.stream-patch-commit.v1',
                status: 'applied',
                accepted: true,
                changed: streamPlan.changed,
                patch: streamPlan.patch,
                target: streamPlan.target,
                modelOperations: streamPlan.modelOperations,
                postCommitEffects: streamPlan.postCommitEffects,
                diagnostics: streamPlan.diagnostics,
                metadata: Object.freeze({ ...metadata })
              });
            },
            listStreamPatches() { return streamPatches.slice(); },
            getState() { return modelReader.snapshot().states; },
            setState() { legacyAppStateMutationCount += 1; },
            applyStreamPatch() { legacyAppStateMutationCount += 1; },
            handleStreamPatch() { legacyAppStateMutationCount += 1; },
            applyReducer() { legacyAppStateMutationCount += 1; },
            applyRecipe() { legacyAppStateMutationCount += 1; },
            managedModel,
            dispose() {}
          };
        }
      },
      validation: {
        createRmtFormValidationEvaluator: ({ modelReader }) => {
          validationModelReader = modelReader;
          return {
          evaluate(metadata = {}) {
            gateEvaluateCount += 1;
            const blocked = metadata.action === 'blocked-save';
            return {
              schema: 'xtend.rmt.form-validation-evaluation.v1',
              valid: !blocked,
              modelOperations: [{
                operation: 'set',
                state: 'validation.status',
                value: { valid: !blocked }
              }],
              viewProjection: [
                { target: { surface: 'first.surface' }, invalid: blocked, revealed: true, report: true, message: blocked ? 'First is invalid' : '' },
                { target: { surface: 'second.surface' }, invalid: blocked, revealed: true, report: true, message: blocked ? 'Second is invalid' : '' }
              ],
              results: [{
                group: blocked ? 'blocked.group' : 'save.group',
                valid: !blocked,
                fields: [
                  { field: 'first', target: { surface: 'first.surface' }, valid: !blocked, revealed: true, message: blocked ? 'First is invalid' : '' },
                  { field: 'second', target: { surface: 'second.surface' }, valid: !blocked, revealed: true, message: blocked ? 'Second is invalid' : '' }
                ],
                included: []
              }]
            };
          },
          snapshot() { return { schema: 'test.validation-evaluator-snapshot.v1' }; }
        };
        },
        createRmtFormValidationViewProjector: () => ({
          prepare(evaluation, metadata = {}) {
            gatePrepareCount += 1;
            return Object.freeze({
              schema: 'xtend.rmt.form-validation-view-projection-plan.v1',
              valid: evaluation.valid !== false,
              projectionCount: evaluation.viewProjection.length,
              projections: Object.freeze(evaluation.viewProjection.map((projection) => Object.freeze({ ...projection }))),
              metadata: Object.freeze({ ...metadata })
            });
          },
          finalize(prepared) {
            gateFinalizeCount += 1;
            return Object.freeze({
              schema: 'xtend.rmt.form-validation-view-finalize-report.v1',
              valid: prepared.valid,
              projectionCount: prepared.projectionCount,
              reportedCount: 0,
              missingCount: 0,
              reported: Object.freeze([]),
              missing: Object.freeze([])
            });
          }
        })
      },
      renderer: null
    })
  });
  await transactionRuntime.boot();
  transactionRuntime.stateRuntime.subscribe((event) => {
    transactionNotifyCount += 1;
    transactionEvent = event;
  });
  const rendererRequestsBeforeSave = transactionRendererRequests.length;
  const hydrationsBeforeSave = transactionHydrationCount;
  await transactionRuntime.dispatchCommand('save', { first: 'A', second: 'B' });
  const saveRendererRequests = transactionRendererRequests.slice(rendererRequestsBeforeSave);
  const saveDescriptors = [];
  const collectSaveDescriptors = (value) => {
    if (Array.isArray(value)) {
      value.forEach(collectSaveDescriptors);
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (value.surface) saveDescriptors.push(value);
    ['children', 'descriptors', 'nodes'].forEach((key) => collectSaveDescriptors(value[key]));
  };
  saveRendererRequests.forEach((request) => collectSaveDescriptors(request.descriptors));
  const transactionState = transactionRuntime.stateRuntime.snapshot().states;
  context.assert(transactionNotifyCount === 1
    && transactionEvent && transactionEvent.metadata && transactionEvent.metadata.operation === 'transaction'
    && transactionRuntime.snapshot().stateCommitCount === 1
    && scheduledKinds.join(',') === 'action,state-change',
  'Action status/result writes and N compiled reducers publish exactly one outer state transaction');
  context.assert(transactionState['save.status'].status === 'success'
    && transactionState['save.loading'] === false
    && transactionState['save.result'].first === 'A'
    && transactionState.first.value === 'A'
    && transactionState.second.value === 'B',
  'the single transaction contains Action status/result/loading state and every compiled reducer result');
  context.assert(gateEvaluateCount === 1
    && gateApplyCount === 0
    && gatePrepareCount === 1
    && gateFinalizeCount === 1
    && validationModelReader && typeof validationModelReader.getState === 'function'
    && typeof validationModelReader.setState === 'undefined'
    && transactionState['validation.status'].valid === true
    && saveRendererRequests.length === 1
    && saveRendererRequests[0].operation === 'reconcile-children'
    && saveDescriptors.length === 2
    && saveDescriptors.every((descriptor) => Object.prototype.hasOwnProperty.call(descriptor.attributes, 'aria-invalid'))
    && transactionHydrationCount === hydrationsBeforeSave + 1,
  'validation evaluates once through the read-only Model port and joins one renderer commit and one hydration');
  const blockedResult = await transactionRuntime.dispatchCommand('blocked-save', { value: 'must-not-write' });
  context.assert(blockedResult && blockedResult.status === 'blocked'
    && transactionRuntime.stateRuntime.getState('blocked.target').value === 'unchanged'
    && transactionRuntime.stateRuntime.getState('validation.status').valid === false
    && transactionRuntime.snapshot().actions.length === 1
    && gateEvaluateCount === 2
    && gateApplyCount === 0
    && gatePrepareCount === 2
    && gateFinalizeCount === 2,
  'invalid Action gates run one preflight evaluation and block Action effects and reducers before the final projected commit');
  const beforeFailedActionSnapshot = transactionRuntime.snapshot();
  const beforeFailedActionFirstState = transactionRuntime.model.getState('first');
  const beforeFailedActionNotifyCount = transactionNotifyCount;
  const beforeFailedActionRendererCount = transactionRendererRequests.length;
  const beforeFailedActionHydrationCount = transactionHydrationCount;
  const beforeFailedActionTransitionFindCount = failedActionTransitionFindCount;
  const beforeFailedActionTransitionCallCount = failedActionTransitionCalls.length;
  const beforeFailedActionVisibility = {
    firstHidden: firstTransactionNode.hasAttribute('hidden'),
    secondHidden: secondTransactionNode.hasAttribute('hidden')
  };
  scheduledKinds.length = 0;
  const failedActionResult = await transactionRuntime.dispatchCommand('failed-save', { value: 'must-not-commit' });
  const afterFailedActionSnapshot = transactionRuntime.snapshot();
  context.assert(failedActionResult && failedActionResult.status === 'error'
    && Object.isFrozen(failedActionResult)
    && transactionRuntime.model.getState('first').value === beforeFailedActionFirstState.value
    && transactionRuntime.model.getState('failure.status').status === 'error'
    && transactionRuntime.model.getState('failure.status').code === 'test.failed-save'
    && failedActionPostCommitCount === 0
    && failedActionResult.postCommitEffects[0].value.deferred === true
    && failedActionTransitionFindCount === beforeFailedActionTransitionFindCount
    && failedActionTransitionCalls.length === beforeFailedActionTransitionCallCount
    && firstTransactionNode.hasAttribute('hidden') === beforeFailedActionVisibility.firstHidden
    && secondTransactionNode.hasAttribute('hidden') === beforeFailedActionVisibility.secondHidden
    && transactionNotifyCount === beforeFailedActionNotifyCount + 1
    && transactionRendererRequests.length === beforeFailedActionRendererCount + 1
    && transactionHydrationCount === beforeFailedActionHydrationCount + 1
    && afterFailedActionSnapshot.stateCommitCount === beforeFailedActionSnapshot.stateCommitCount + 1
    && afterFailedActionSnapshot.commitCount === beforeFailedActionSnapshot.commitCount + 1
    && afterFailedActionSnapshot.renderCount === beforeFailedActionSnapshot.renderCount
    && scheduledKinds.join(',') === 'action,state-change',
  'failed Actions retain explicit error Model operations in one commit while suppressing success reducers, transitions and PostCommit effects');
  scheduledKinds.length = 0;
  const appDispatchResult = await transactionRuntime.dispatchCommand({
    schema: 'xtend.rmt.command.v1',
    command: 'save',
    payload: { first: 'C', second: 'D' },
    correlationId: 'event-command'
  }, {
    eventId: 'save-click',
    eventName: 'click'
  });
  context.assert(appDispatchResult && appDispatchResult.status === 'success'
    && !('rawActionRuntime' in transactionRuntime)
    && !('appRuntime' in transactionRuntime)
    && !('renderer' in transactionRuntime)
    && transactionRuntime.snapshot().diagnostics.filter((entry) => entry.code === 'xtend.maraca.mvc.legacy-adapter').length === 1
    && scheduledKinds.join(',') === 'action,state-change',
  'managed command routing exposes no mutable adapters and diagnoses the read-only 0.6 state alias once');
  scheduledKinds.length = 0;
  const beforeStreamNotifyCount = transactionNotifyCount;
  const beforeStreamSnapshot = transactionRuntime.snapshot();
  const beforeStreamValidationCount = gateEvaluateCount;
  const beforeStreamRendererRequestCount = transactionRendererRequests.length;
  const streamPatchResult = await transactionRuntime.dispatchStreamPatch({
    type: 'complete',
    target: 'first.value',
    value: 'E'
  }, { correlationId: 'stream-patch' });
  const afterStreamSnapshot = transactionRuntime.snapshot();
  const streamRendererRequests = transactionRendererRequests.slice(beforeStreamRendererRequestCount);
  context.assert(streamPatchResult && streamPatchResult.status === 'applied'
    && Object.isFrozen(streamPatchResult)
    && afterStreamSnapshot.appRuntime.streamPatches.length === 1
    && transactionRuntime.model.getState('first').value === 'E'
    && transactionNotifyCount === beforeStreamNotifyCount + 1
    && afterStreamSnapshot.stateCommitCount === beforeStreamSnapshot.stateCommitCount + 1
    && afterStreamSnapshot.commitCount === beforeStreamSnapshot.commitCount + 1
    && afterStreamSnapshot.renderCount === beforeStreamSnapshot.renderCount
    && gateEvaluateCount === beforeStreamValidationCount + 1
    && streamRendererRequests.length === 1
    && streamRendererRequests[0].operation === 'reconcile-children'
    && managedStreamPlanCount === 1
    && managedStreamCommitCount === 1
    && legacyAppStateMutationCount === 0
    && scheduledKinds.join(',') === 'state-change',
  'managed stream patches use one Model transaction, validation pass and targeted DOM commit without mutating a parallel appState');
  transactionRuntime.dispose();
  transactionRuntime.dispose();
  context.assert(externalKernelDisposeCount === 0
    && transactionRendererDisposeCount === 1
    && resourceCreateCount === 2
    && resourceDisposeCount === 2,
  'double dispose releases owned resources once while preserving the caller-owned kernel');

  const strictRoot = createRoot();
  const strictRuntime = maracaRuntimeApi.createMaracaPlanRuntime({
    plan: { orchestration: { mode: 'strict', artifact: { state: {}, render: { root: { type: 'fragment', children: [] } } } } },
    root: strictRoot,
    viewProjectionPort: createViewProjectionPort(strictRoot),
    loadModules: async () => fakeModules
  });
  let strictCommitFailure = false;
  try { await strictRuntime.boot(); } catch (error) { strictCommitFailure = /requires.+commit/u.test(error.message); }
  context.assert(strictCommitFailure, 'strict plan runtime fails closed when the shared renderer has no commit API');
  strictRuntime.dispose();

  const toolingBridge = require('../../tools/tooling-bridge');
  const bridgeResponse = await toolingBridge.executeToolingBridgeOperation({ operation: 'safe-preview', requestId: 'ownership-contract', payload: { coreDocument: {}, project: { descriptor: { tag: 'div', children: ['Safe'] } } } }, { rootDir });
  context.assert(bridgeResponse.schema === 'xtend.compiler.tooling-bridge-response.v1' && bridgeResponse.operation === 'safe-preview' && bridgeResponse.result.descriptor.tag === 'div', 'tooling bridge returns a versioned safe-preview envelope');

  return context.result({ scannedFiles: productFiles.length, ruleCount: RULES.length });
}

function printDocsFrameworkOwnershipReport(result) {
  printSuiteReport(result, { successTitle: `${result.label} suite passed.`, failureTitle: `${result.label} suite failed:` });
}

module.exports = { RULES, scanOwnershipSource, runDocsFrameworkOwnershipSuite, printDocsFrameworkOwnershipReport };

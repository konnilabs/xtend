const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');
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
const {
  createAppServiceRegistry,
  defineAppServices,
  service
} = require('../../xtend-maraca/app-services');
const {
  XSCALER_ATC_HANDOFF_SCHEMA,
  XSCALER_PUBLIC_API_SCHEMA,
  XSCALER_APP_SERVICE_ATTACH_REFUSED_CODE,
  XSCALER_APP_SERVICE_TARGET_REQUIRED_CODE,
  XSCALER_APP_SERVICE_TRANSPORT_SCHEMA,
  XSCALER_REMOTE_ADAPTER_LOADER_SCHEMA,
  XSCALER_REMOTE_ADAPTER_LOAD_RESULT_SCHEMA,
  XSCALER_REMOTE_ADAPTER_REGISTRATION_SCHEMA,
  XSCALER_REMOTE_LOADER_UNSAFE_CODE,
  XSCALER_REMOTE_SESSION_ID_CONFLICT_CODE,
  XSCALER_REMOTE_SURFACE_REQUIRED_CODE,
  XSCALER_REMOTE_SURFACE_PLAN_SCHEMA,
  createBrowserExternalModuleLoader,
  createXScalerAppServiceTransport,
  createXScalerRemoteAdapterLoader,
  createXScalerRemoteSurfacePlan,
  evaluateXScalerPreflight,
  registerXScalerRemoteAdapter
} = require('../../xscaler');

const XSCALER_PUBLIC_API_SUITE_SCHEMA = 'xtend.xscaler.public-api-suite.v1';
const PUBLIC_FILES = [
  'xscaler/index.js',
  'xscaler/index.mjs',
  'xscaler/index.d.ts',
  'xscaler/protocol.js',
  'xscaler/protocol.mjs',
  'xscaler/protocol.d.ts',
  'xscaler/app-service-transport.js',
  'xscaler/app-service-transport.mjs',
  'xscaler/app-service-transport.d.ts',
  'xscaler/remote-adapter-loader.js',
  'xscaler/remote-adapter-loader.mjs',
  'xscaler/remote-adapter-loader.d.ts'
];
const SCHEMA_FILES = [
  'preflight-request.schema.json',
  'preflight-response.schema.json',
  'remote-surface-plan.schema.json',
  'xtension-deployment.schema.json',
  'atc-handoff.schema.json',
  'remote-adapter-load-result.schema.json'
];
const XSCALER_EXPORTS = Object.freeze({
  './xscaler': ['index.d.ts', 'index.mjs', 'index.js'],
  './xscaler/protocol': ['protocol.d.ts', 'protocol.mjs', 'protocol.js'],
  './xscaler/remote-adapter-loader': ['remote-adapter-loader.d.ts', 'remote-adapter-loader.mjs', 'remote-adapter-loader.js'],
  './xscaler/app-service-transport': ['app-service-transport.d.ts', 'app-service-transport.mjs', 'app-service-transport.js']
});
const XSCALER_GATE_IDS = Object.freeze([
  'xscaler-protocol',
  'xscaler-public-api',
  'xscaler-php-preflight-parity',
  'rmt-xscaler-ssr-hydration-parity',
  'xscaler-source-to-sea'
]);

function secureExternalLoader(callback) {
  Object.defineProperty(callback, 'xscalerCapabilities', {
    value: Object.freeze({ cspSafe: true, sri: true, externalOnly: true }),
    enumerable: true
  });
  return callback;
}

function createPlan(overrides = {}) {
  return createXScalerRemoteSurfacePlan({
    schema: XSCALER_REMOTE_SURFACE_PLAN_SCHEMA,
    surface: 'checkout.cart',
    surfaceId: 'remoteSurface:checkout.cart',
    owner: 'checkout-platform',
    origin: 'https://cdn.xtend.example',
    integrity: { algorithm: 'sha256', digest: 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' },
    fallbackSurface: 'checkout.cart.fallback',
    lanes: [{ lane: 'visible', target: 'shell.slot:checkout' }],
    ssr: { mode: 'preflight-only', networkDuringRender: false },
    ...overrides
  });
}

function createLifecycleAdapter(events, label) {
  return {
    async attach(context) { events.push(`${label}:attach:${context.sessionId}`); },
    async cancel(context) { events.push(`${label}:cancel:${context.sessionId}`); },
    async detach(context) { events.push(`${label}:detach:${context.sessionId}`); },
    async dispose(context) { events.push(`${label}:dispose:${context.sessionId}`); }
  };
}

function validatePublicFiles(context, rootDir) {
  PUBLIC_FILES.forEach((relativePath) => {
    context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), `${relativePath} exists`);
  });
  const types = readText('xscaler/protocol.d.ts', rootDir) + readText('xscaler/remote-adapter-loader.d.ts', rootDir);
  [
    'XScalerPreflightRequest',
    'XScalerPreflightResponse',
    'XScalerRemoteSurfacePlan',
    'XScalerAtcHandoff',
    'XScalerRemoteAdapter',
    'XScalerRemoteAdapterLoader',
    'XScalerRemoteAdapterLoadResult',
    'XScalerRemoteAdapterRegistration',
    'XScalerSurfaceFallbackActivation'
  ].forEach((typeName) => context.assert(types.includes(`interface ${typeName}`), `public types declare ${typeName}`));
  context.assert(XSCALER_PUBLIC_API_SCHEMA === 'xtend.xscaler.public-api.v1', 'public facade exposes stable API schema');
  context.assert(typeof createXScalerRemoteAdapterLoader === 'function', 'public facade exports remote adapter loader');
}

function validateCentralIntegration(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const workflow = readText('.github/workflows/xtend-default-gates.yml', rootDir);
  const nightlyWorkflow = readText('.github/workflows/xtend-nightly-build.yml', rootDir);
  const exportLock = readText('catalog/epic13-package-export-lock.js', rootDir);
  const closurePlan = readText('development/XScaler-Luecken-und-Drift-Closure-Plan.md', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.xscaler;
  const gateMatrix = packageManifest.xtend && packageManifest.xtend.ciGateMatrix;

  context.assert(packageManifest.files.includes('xscaler'), 'root package files include the complete XScaler pack root');
  Object.entries(XSCALER_EXPORTS).forEach(([exportKey, [typesFile, esmFile, cjsFile]]) => {
    const entry = packageManifest.exports[exportKey];
    context.assert(entry && entry.types === `./xscaler/${typesFile}`, `${exportKey} exports its declarations`);
    context.assert(entry && entry.browser === `./xscaler/${esmFile}` && entry.import === `./xscaler/${esmFile}` && entry.default === `./xscaler/${esmFile}`, `${exportKey} exports native browser ESM`);
    context.assert(entry && entry.require === `./xscaler/${cjsFile}`, `${exportKey} preserves CommonJS compatibility`);
  });
  context.assert(packageManifest.exports['./xscaler/schemas/*'] === './xscaler/schemas/*', 'root package exports the XScaler JSON schema assets');
  context.assert(!packageManifest.exports['./xscaler/xscaler-preflight.php'], 'PHP evaluator is packaged without pretending to be a JavaScript subpath');
  context.assert(metadata && metadata.schema === XSCALER_PUBLIC_API_SCHEMA && metadata.status === 'implemented-public-runtime-closure', 'root metadata declares the implemented XScaler public API closure');
  context.assert(metadata && metadata.kernelRemoteExecution === false && metadata.remoteRuntimeExecution === false && metadata.ssrNetworkAllowed === false, 'root metadata preserves the XScaler no-remote-kernel and SSR-network boundary');
  context.assert(metadata && metadata.esmDriftGate === 'node xscaler/generate-esm.js --check' && metadata.pluginlessRollup === true, 'root metadata exposes deterministic native ESM packaging');
  context.assert(packageManifest.scripts['test:xscaler-public-api'] === 'node scripts/run_xtend_tests.js xscaler-public-api', 'root package exposes the XScaler public API script');
  context.assert(packageManifest.scripts['test:xscaler-php-preflight-parity'] === 'node scripts/run_xtend_tests.js xscaler-php-preflight-parity', 'root package exposes the XScaler PHP parity script');
  context.assert(packageManifest.scripts['test:rmt-xscaler-ssr-hydration-parity'] === 'node scripts/run_xtend_tests.js rmt-xscaler-ssr-hydration-parity', 'root package exposes the Node/PHP XScaler SSR hydration parity script');

  XSCALER_GATE_IDS.forEach((id) => {
    context.assert(runner.includes(`id: '${id}'`), `runner registers ${id}`);
    context.assert(packageManifest.scripts['test:pr'].includes(id) && packageManifest.scripts['test:release:full'].includes(id), `PR and release scripts include ${id}`);
    context.assert(gateMatrix.prFastGate.suites.includes(id) && gateMatrix.fullReleaseGate.suites.includes(id), `CI gate matrix includes ${id}`);
  });
  ['npm run test:xscaler-public-api', 'npm run test:xscaler-php-preflight-parity', 'npm run test:rmt-xscaler-ssr-hydration-parity'].forEach((script) => {
    context.assert(packageManifest.xtend.releaseGates.includes(script), `release gates include ${script}`);
    context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(script), `release checklist includes ${script}`);
  });
  context.assert(workflow.includes('npm run test:xscaler-public-api:report') && workflow.includes('npm run test:xscaler-php-preflight-parity:report') && workflow.includes('npm run test:rmt-xscaler-ssr-hydration-parity:report'), 'default CI workflow emits all XScaler closure reports');
  context.assert(nightlyWorkflow.includes('npm run test:xscaler-public-api:report') && nightlyWorkflow.includes('npm run test:xscaler-php-preflight-parity:report') && nightlyWorkflow.includes('npm run test:rmt-xscaler-ssr-hydration-parity:report'), 'nightly workflow emits all XScaler closure reports');
  context.assert(exportLock.includes("'./xscaler/app-service-transport'") && exportLock.includes("'xscaler'"), 'package export lock owns the XScaler subpaths and pack root');
  ['XMS-09/XMS-10', 'xscaler-public-api', 'xscaler-php-preflight-parity', 'rmt-xscaler-ssr-hydration-parity', 'xscaler/schemas/*'].forEach((anchor) => {
    context.assert(closurePlan.includes(anchor), `XScaler closure plan documents ${anchor}`);
  });
}

function validateJsonSchemas(context, rootDir) {
  const schemaDir = 'xscaler/schemas';
  const index = readJson(`${schemaDir}/index.json`, rootDir);
  context.assert(index.schema === 'xtend.xscaler.schema-index.v1', 'schema index is versioned');
  SCHEMA_FILES.forEach((fileName) => {
    const relativePath = `${schemaDir}/${fileName}`;
    const schema = readJson(relativePath, rootDir);
    context.assert(schema.$schema === 'https://json-schema.org/draft/2020-12/schema', `${fileName} uses JSON Schema 2020-12`);
    context.assert(typeof schema.$id === 'string' && schema.$id.startsWith('https://schemas.xtend.dev/xscaler/'), `${fileName} has canonical XScaler id`);
  });
  const resultSchema = readJson(`${schemaDir}/remote-adapter-load-result.schema.json`, rootDir);
  context.assert(JSON.stringify(resultSchema).includes('"loadAttempted":{"const":false}'), 'load-result schema encodes zero-load on refusal');
  const planSchema = readJson(`${schemaDir}/remote-surface-plan.schema.json`, rootDir);
  context.assert(planSchema.required.includes('runtimeBoundary') && planSchema.properties.surfaceId.pattern.startsWith('^remoteSurface:'), 'remote-surface schema requires the no-remote-kernel boundary and remote surface namespace');
  context.assert(planSchema.properties.integrity.properties.digest.oneOf.length === 3, 'remote-surface schema pins SHA-256/384/512 SRI digest shapes');
  const responseSchema = readJson(`${schemaDir}/preflight-response.schema.json`, rootDir);
  context.assert(responseSchema.required.includes('remoteSurfacePlan') && responseSchema.required.includes('atc'), 'preflight response schema requires plan and ATC evidence');
}

async function validateNativeEsm(context, rootDir) {
  const sync = spawnSync(process.execPath, ['xscaler/generate-esm.js', '--check'], {
    cwd: rootDir,
    encoding: 'utf8'
  });
  context.assert(sync.status === 0, `native ESM outputs are deterministically synchronized${sync.status === 0 ? '' : ` (${sync.stderr || sync.stdout})`}`);
  [
    'xscaler/index.mjs',
    'xscaler/protocol.mjs',
    'xscaler/remote-adapter-loader.mjs',
    'xscaler/app-service-transport.mjs'
  ].forEach((relativePath) => {
    const source = readText(relativePath, rootDir);
    context.assert(!source.includes('require(') && !source.includes('module.exports') && !source.includes('node:'), `${relativePath} is browser-native ESM without CommonJS/Node shims`);
  });
  const esm = await import(pathToFileURL(resolveRepoPath('xscaler/index.mjs', rootDir)).href);
  const input = {
    surface: 'checkout.cart',
    surfaceId: 'remoteSurface:checkout.cart',
    owner: 'checkout-platform',
    origin: 'https://cdn.xtend.example',
    integrity: { algorithm: 'sha256', digest: 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' },
    fallbackSurface: 'checkout.cart.fallback',
    lanes: [{ lane: 'visible', target: 'shell.slot:checkout' }],
    ssr: { mode: 'preflight-only', networkDuringRender: false }
  };
  context.assert(JSON.stringify(esm.createXScalerRemoteSurfacePlan(input)) === JSON.stringify(createXScalerRemoteSurfacePlan(input)), 'native ESM and CommonJS protocol factories are output-identical');
  context.assert(typeof esm.createXScalerRemoteAdapterLoader === 'function' && typeof esm.createXScalerAppServiceTransport === 'function', 'native ESM exports loader and AppService transport without a CommonJS plugin');
  const { rollup } = require('rollup');
  const bundle = await rollup({ input: resolveRepoPath('xscaler/index.mjs', rootDir) });
  const generated = await bundle.generate({ format: 'es' });
  await bundle.close();
  const bundledSource = generated.output.map((entry) => entry.code || '').join('\n');
  context.assert(bundledSource.includes('createXScalerAppServiceTransport') && !bundledSource.includes('module.exports') && !bundledSource.includes('require('), 'Rollup bundles the native XScaler entry without a CommonJS plugin');
}

async function validateBrowserLoaderContract(context) {
  const attached = [];
  const listeners = new Map();
  const registrationTarget = {};
  const adapter = createLifecycleAdapter([], 'default-browser-loader');
  let registrationAccepted = false;
  const element = {
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
    remove() { this.removed = true; }
  };
  const documentTarget = {
    createElement(tag) { element.tag = tag; return element; },
    head: {
      appendChild(script) {
        attached.push(script);
        registrationAccepted = registerXScalerRemoteAdapter({
          surfaceId: 'remoteSurface:checkout.cart',
          sessionId: 'browser-registration',
          adapter
        }, registrationTarget);
        queueMicrotask(() => listeners.get('load')?.());
      }
    }
  };
  const load = createBrowserExternalModuleLoader({ documentTarget, registrationTarget });
  const controller = new AbortController();
  const handle = await load({
    url: 'https://cdn.xtend.example/checkout-adapter.mjs',
    integrity: 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    nonce: 'host-csp-nonce',
    surfaceId: 'remoteSurface:checkout.cart',
    sessionId: 'browser-registration',
    signal: controller.signal
  });
  context.assert(attached.length === 1 && element.tag === 'script' && element.type === 'module', 'browser loader appends one external module script');
  context.assert(element.src === 'https://cdn.xtend.example/checkout-adapter.mjs' && element.integrity === 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', 'browser loader pins URL and SRI');
  context.assert(element.crossOrigin === 'anonymous' && element.referrerPolicy === 'no-referrer' && element.nonce === 'host-csp-nonce', 'browser loader applies CSP-compatible external script attributes');
  context.assert(registrationAccepted && handle.adapter === adapter, 'default browser loader receives the module adapter through the public session-bound registration contract');
  context.assert(XSCALER_REMOTE_ADAPTER_REGISTRATION_SCHEMA === 'xtend.xscaler.remote-adapter-registration.v1', 'browser registration uses the versioned public contract');
  handle.remove();
  context.assert(element.removed === true, 'browser loader handle removes its external script node');
  let unsafeRejected = false;
  try {
    await load({
      url: 'javascript:alert(1)',
      integrity: 'sha256-short',
      signal: controller.signal
    });
  } catch (_error) {
    unsafeRejected = true;
  }
  context.assert(unsafeRejected && attached.length === 1, 'low-level browser loader rejects unsafe URL/SRI descriptors before DOM attachment');
}

async function validateAcceptedLifecycle(context) {
  const events = [];
  const ssrNetworkConstraints = [];
  let loadCount = 0;
  const loadExternalAdapter = secureExternalLoader(async (descriptor) => {
    events.push(`load:${descriptor.sessionId}`);
    loadCount += 1;
    return {
      adapter: createLifecycleAdapter(events, `adapter-${loadCount}`),
      remove() { events.push(`remove:${descriptor.sessionId}`); }
    };
  });
  const loader = createXScalerRemoteAdapterLoader({
    hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'] },
    preflight(input) {
      events.push(`preflight:${input.request.requestId}`);
      ssrNetworkConstraints.push(input.request.constraints.allowNetworkDuringSsr);
      return evaluateXScalerPreflight(input);
    },
    loadExternalAdapter
  });
  const attach = await loader.attach({
    remoteSurfacePlan: createPlan(),
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'accepted-attach',
    request: { constraints: { allowNetworkDuringSsr: true } }
  });
  context.assert(attach.schema === XSCALER_REMOTE_ADAPTER_LOAD_RESULT_SCHEMA && attach.status === 'attached', 'accepted preflight loads and attaches the remote adapter');
  context.assert(attach.atc.schema === XSCALER_ATC_HANDOFF_SCHEMA && attach.atc.lifecycleState === 'attached', 'attach emits canonical ATC handoff');
  context.assert(events[0].startsWith('preflight:') && events[1] === 'load:accepted-attach' && events[2] === 'adapter-1:attach:accepted-attach', 'preflight strictly precedes load and adapter execution');
  context.assert(attach.runtimeBoundary.kernelRemoteExecution === false, 'attached result preserves kernel no-remote-execution boundary');

  const activeConflict = await loader.attach({
    remoteSurfacePlan: createPlan(),
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'active-conflict'
  });
  context.assert(activeConflict.status === 'refused' && activeConflict.loadAttempted === false && activeConflict.loaded === false && activeConflict.adapterExecuted === false, 'active-surface rejection reports zero load for the rejected attach attempt');
  context.assert(activeConflict.atc.fallback && activeConflict.atc.fallback.surface === 'checkout.cart.fallback', 'active-surface rejection preserves the surface fallback');

  const detached = await loader.detach(attach.sessionId, 'surface-unmounted');
  context.assert(detached.status === 'detached' && events.includes('adapter-1:detach:accepted-attach'), 'detach reaches the remote adapter lifecycle');
  context.assert(detached.adapterExecuted === true && detached.session.adapterAttached === false, 'detach preserves execution evidence while clearing current attachment state');

  const reusedSession = await loader.attach({
    remoteSurfacePlan: createPlan(),
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'accepted-attach'
  });
  context.assert(reusedSession.status === 'refused' && reusedSession.loadAttempted === false && loadCount === 1, 'a used session id cannot overwrite a terminal session or trigger another load');
  context.assert(reusedSession.diagnostics.some((entry) => entry.code === XSCALER_REMOTE_SESSION_ID_CONFLICT_CODE), 'session id conflicts expose a stable diagnostic');

  const second = await loader.attach({
    remoteSurfacePlan: createPlan(),
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'accepted-cancel'
  });
  const cancelled = await loader.cancel(second.sessionId, 'navigation-superseded');
  context.assert(cancelled.status === 'cancelled' && events.includes('adapter-2:cancel:accepted-cancel'), 'cancel reaches the remote adapter lifecycle');

  const third = await loader.attach({
    remoteSurfacePlan: createPlan(),
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'accepted-dispose'
  });
  context.assert(third.status === 'attached', 'new ATC session can attach after terminal predecessor');
  const disposed = await loader.dispose('host-dispose');
  context.assert(disposed.status === 'disposed' && disposed.disposed === true, 'dispose closes the loader');
  context.assert(events.includes('adapter-3:dispose:accepted-dispose'), 'dispose reaches attached remote adapters');
  context.assert(disposed.runtimeBoundary.remoteSurfaceOnly === true && disposed.runtimeBoundary.kernelRemoteExecution === false, 'disposed snapshot remains remote-surface-only');
  context.assert(ssrNetworkConstraints.every((value) => value === false), 'loader-owned preflight always forbids SSR network access');
}

async function validateZeroLoadOnRejection(context) {
  let loadCount = 0;
  let adapterExecutionCount = 0;
  const fallbackActivations = [];
  const loadExternalAdapter = secureExternalLoader(async () => {
    loadCount += 1;
    return {
      adapter: {
        async attach() { adapterExecutionCount += 1; },
        async cancel() {},
        async detach() {},
        async dispose() {}
      }
    };
  });
  const loader = createXScalerRemoteAdapterLoader({
    hostCapabilities: { allowedOrigins: ['https://blocked.example'] },
    async activateFallback(activation) { fallbackActivations.push(activation); },
    loadExternalAdapter
  });
  const result = await loader.attach({
    remoteSurfacePlan: createPlan(),
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'rejected-zero-load'
  });
  const snapshot = loader.snapshot();
  context.assert(result.status === 'refused' && result.ok === false, 'rejected preflight refuses remote adapter session');
  context.assert(result.loadAttempted === false && result.loaded === false && result.adapterExecuted === false, 'rejected result records zero-load evidence');
  context.assert(result.atc.fallback && result.atc.fallback.surface === 'checkout.cart.fallback', 'preflight rejection preserves the surface fallback');
  context.assert(fallbackActivations.length === 1 && fallbackActivations[0].fallbackSurface === 'checkout.cart.fallback' && fallbackActivations[0].status === 'refused', 'preflight rejection activates the declared surface fallback through the host hook');
  context.assert(loadCount === 0 && adapterExecutionCount === 0 && snapshot.counters.loadAttempts === 0, 'rejection performs no loader or adapter execution');

  const invalidSri = await loader.attach({
    remoteSurfacePlan: createPlan({
      integrity: { algorithm: 'sha256', digest: 'sha256-YWJjZA==' }
    }),
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'short-sri-zero-load'
  });
  context.assert(invalidSri.status === 'refused' && invalidSri.loadAttempted === false && loadCount === 0, 'short non-cryptographic SRI digests are refused with zero load');
  context.assert(invalidSri.atc.fallback && invalidSri.atc.fallback.surface === 'checkout.cart.fallback', 'integrity rejection preserves the surface fallback');
  context.assert(fallbackActivations.length === 2 && fallbackActivations[1].remoteSurfacePlan.integrity.digest === 'sha256-YWJjZA==', 'integrity rejection activates the declared fallback without importing remote code');
  await loader.dispose();
}

async function validateForgedAcceptanceAndFailureRedaction(context) {
  let forgedLoadCount = 0;
  const forgedLoader = createXScalerRemoteAdapterLoader({
    preflight(input) {
      return {
        ...evaluateXScalerPreflight(input),
        remoteSurfacePlan: null
      };
    },
    loadExternalAdapter: secureExternalLoader(async () => {
      forgedLoadCount += 1;
      return { adapter: createLifecycleAdapter([], 'forged') };
    })
  });
  const forged = await forgedLoader.attach({
    remoteSurfacePlan: createPlan(),
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'forged-acceptance'
  });
  context.assert(forged.status === 'refused' && forged.loadAttempted === false && forgedLoadCount === 0, 'accepted preflight without its canonical plan is refused before load');
  await forgedLoader.dispose();

  const failingLoader = createXScalerRemoteAdapterLoader({
    loadExternalAdapter: secureExternalLoader(async () => {
      throw new Error('token=must-not-escape');
    })
  });
  const failed = await failingLoader.attach({
    remoteSurfacePlan: createPlan(),
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'redacted-load-failure'
  });
  context.assert(failed.status === 'failed' && failed.loadAttempted === true && failed.loaded === false, 'external load failure remains distinct from preflight rejection');
  context.assert(!JSON.stringify(failed.diagnostics).includes('must-not-escape'), 'external failure diagnostics redact remote error details');
  context.assert(failed.atc.fallback && failed.atc.fallback.surface === 'checkout.cart.fallback', 'external load failure preserves the surface fallback');
  await failingLoader.dispose();

  let attachFailureDisposed = 0;
  const attachFailureLoader = createXScalerRemoteAdapterLoader({
    loadExternalAdapter: secureExternalLoader(async () => ({
      adapter: {
        async attach() { throw new Error('token=attach-secret'); },
        async cancel() {},
        async detach() {},
        async dispose() { attachFailureDisposed += 1; }
      }
    }))
  });
  const attachFailure = await attachFailureLoader.attach({
    remoteSurfacePlan: createPlan(),
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'redacted-attach-failure'
  });
  context.assert(attachFailure.status === 'failed' && attachFailure.adapterExecuted === true && attachFailure.session.adapterAttached === false, 'failed adapter attach truthfully records execution without claiming attachment');
  context.assert(!JSON.stringify(attachFailure.diagnostics).includes('attach-secret'), 'adapter lifecycle failure diagnostics redact remote error details');
  context.assert(attachFailureDisposed === 1, 'failed adapter attach disposes partially initialized adapter resources');
  await attachFailureLoader.dispose();
  context.assert(attachFailureDisposed === 1, 'loader disposal does not dispose a failed adapter twice');

  let mutablePreflight;
  let adapterObservedOrigin = '';
  const raceLoader = createXScalerRemoteAdapterLoader({
    preflight(input) {
      mutablePreflight = evaluateXScalerPreflight(input);
      return mutablePreflight;
    },
    loadExternalAdapter: secureExternalLoader(async () => {
      mutablePreflight.accepted = false;
      mutablePreflight.remoteSurfacePlan.origin = 'https://mutated.example';
      return {
        adapter: {
          async attach(adapterContext) { adapterObservedOrigin = adapterContext.preflight.remoteSurfacePlan.origin; },
          async cancel() {},
          async detach() {},
          async dispose() {}
        }
      };
    })
  });
  const raceSafe = await raceLoader.attach({
    remoteSurfacePlan: createPlan(),
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'preflight-snapshot-race'
  });
  context.assert(raceSafe.status === 'attached' && raceSafe.preflight.accepted === true, 'accepted preflight is snapshotted before external loading');
  context.assert(adapterObservedOrigin === 'https://cdn.xtend.example', 'remote mutation cannot change adapter-visible preflight facts');
  await raceLoader.dispose();
}

async function validateStaticSecurityRejections(context) {
  let unsafeLoadCount = 0;
  const unsafeLoader = createXScalerRemoteAdapterLoader({
    loadExternalAdapter: async () => {
      unsafeLoadCount += 1;
      return { adapter: createLifecycleAdapter([], 'unsafe') };
    }
  });
  const unsafe = await unsafeLoader.attach({
    remoteSurfacePlan: createPlan(),
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'unsafe-csp-loader'
  });
  context.assert(unsafe.status === 'refused' && unsafeLoadCount === 0 && unsafe.loadAttempted === false, 'loader without CSP/SRI/external-only attestation is refused with zero load');
  context.assert(unsafe.diagnostics.some((entry) => entry.code === XSCALER_REMOTE_LOADER_UNSAFE_CODE), 'unsafe loader rejection exposes a stable CSP diagnostic');
  await unsafeLoader.dispose();

  let boundaryLoadCount = 0;
  const boundaryLoader = createXScalerRemoteAdapterLoader({
    loadExternalAdapter: secureExternalLoader(async () => {
      boundaryLoadCount += 1;
      return { adapter: createLifecycleAdapter([], 'boundary') };
    })
  });
  const validPlan = createPlan();
  const unsafeBoundaryPlan = {
    ...validPlan,
    runtimeBoundary: {
      ...validPlan.runtimeBoundary,
      kernelRemoteExecution: true
    }
  };
  const boundary = await boundaryLoader.attach({
    remoteSurfacePlan: unsafeBoundaryPlan,
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'kernel-remote-execution-refused'
  });
  context.assert(boundary.status === 'refused' && boundaryLoadCount === 0 && boundary.loadAttempted === false, 'kernel remote-execution request is refused with zero load');
  context.assert(boundary.diagnostics.some((entry) => entry.code === XSCALER_REMOTE_SURFACE_REQUIRED_CODE), 'kernel boundary rejection exposes a stable remote-surface diagnostic');

  const localSurface = await boundaryLoader.attach({
    remoteSurfacePlan: { ...validPlan, surfaceId: 'localSurface:checkout.cart' },
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'local-surface-refused'
  });
  context.assert(localSurface.status === 'refused' && boundaryLoadCount === 0 && localSurface.loadAttempted === false, 'non-remote surface id cannot activate XScaler loading');
  await boundaryLoader.dispose();
}

async function validateCancellationDuringPreflight(context) {
  let resolvePreflight;
  let loadCount = 0;
  const preflightPromise = new Promise((resolve) => { resolvePreflight = resolve; });
  const loader = createXScalerRemoteAdapterLoader({
    preflight: () => preflightPromise,
    loadExternalAdapter: secureExternalLoader(async () => {
      loadCount += 1;
      return { adapter: createLifecycleAdapter([], 'pending') };
    })
  });
  const attachPromise = loader.attach({
    remoteSurfacePlan: createPlan(),
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'preflight-cancel'
  });
  await Promise.resolve();
  const cancel = await loader.cancel('preflight-cancel', 'route-changed');
  resolvePreflight(evaluateXScalerPreflight({
    request: {
      requestId: 'xscaler-loader-preflight-cancel',
      surface: 'checkout.cart',
      capabilities: ['remote-surface-plan', 'ssr-compatible', 'xtension-deployment'],
      constraints: { allowNetworkDuringSsr: false }
    },
    remoteSurfacePlan: createPlan(),
    hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'] }
  }));
  const attach = await attachPromise;
  context.assert(cancel.status === 'cancelled' && attach.status === 'cancelled', 'cancel during preflight deterministically terminates attach');
  context.assert(loadCount === 0 && loader.snapshot().counters.loadAttempts === 0, 'cancelled preflight never reaches remote load');
  await loader.dispose();

  let resolveDisposedPreflight;
  let disposedLoadCount = 0;
  const disposedPreflightPromise = new Promise((resolve) => { resolveDisposedPreflight = resolve; });
  const disposedLoader = createXScalerRemoteAdapterLoader({
    preflight: () => disposedPreflightPromise,
    loadExternalAdapter: secureExternalLoader(async () => {
      disposedLoadCount += 1;
      return { adapter: createLifecycleAdapter([], 'disposed-pending') };
    })
  });
  const disposedAttachPromise = disposedLoader.attach({
    remoteSurfacePlan: createPlan(),
    adapterUrl: 'https://cdn.xtend.example/checkout-adapter.mjs',
    sessionId: 'preflight-dispose'
  });
  await Promise.resolve();
  await disposedLoader.dispose('host-disposed');
  resolveDisposedPreflight(evaluateXScalerPreflight({
    request: {
      requestId: 'xscaler-loader-preflight-dispose',
      surface: 'checkout.cart',
      capabilities: ['remote-surface-plan', 'ssr-compatible', 'xtension-deployment'],
      constraints: { allowNetworkDuringSsr: false }
    },
    remoteSurfacePlan: createPlan(),
    hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'] }
  }));
  const disposedAttach = await disposedAttachPromise;
  context.assert(disposedAttach.status === 'disposed' && disposedAttach.session.state === 'disposed', 'dispose during preflight remains disposed after a late preflight response');
  context.assert(disposedLoadCount === 0, 'dispose during preflight never reaches remote load');
}

function appServiceRequest(overrides = {}) {
  return {
    serviceId: 'remote.catalog',
    kind: 'query',
    target: 'remote-surface',
    input: { query: 'featured' },
    invocationId: 'app-service:1',
    correlationId: 'correlation:1',
    signal: new AbortController().signal,
    ...overrides
  };
}

async function validateXScalerAppServiceTransport(context) {
  const events = [];
  let loadCount = 0;
  const adapter = {
    async attach(lifecycle) { events.push(`attach:${lifecycle.sessionId}`); },
    async cancel(lifecycle) { events.push(`cancel:${lifecycle.sessionId}`); },
    async detach(lifecycle) { events.push(`detach:${lifecycle.sessionId}`); },
    async dispose(lifecycle) { events.push(`dispose:${lifecycle.sessionId}`); },
    async invoke(request) {
      events.push(`invoke:${request.invocationId}`);
      return { result: request.input.query };
    },
    async *stream(request) {
      events.push(`stream:${request.invocationId}`);
      yield { id: `${request.invocationId}:delta`, sequence: 1, type: 'delta', delta: request.input.topic };
      yield { id: `${request.invocationId}:complete`, sequence: 2, type: 'complete' };
    }
  };
  const transport = createXScalerAppServiceTransport({
    services: {
      'remote.catalog': {
        remoteSurfacePlan: createPlan(),
        adapterUrl: 'https://cdn.xtend.example/catalog-adapter.mjs',
        hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'] }
      },
      'remote.feed': {
        remoteSurfacePlan: createPlan(),
        adapterUrl: 'https://cdn.xtend.example/catalog-adapter.mjs',
        hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'] }
      }
    },
    loaderOptions: {
      loadExternalAdapter: secureExternalLoader(async () => {
        loadCount += 1;
        return { adapter };
      })
    }
  });
  context.assert(transport.xscalerSchema === XSCALER_APP_SERVICE_TRANSPORT_SCHEMA && transport.kind === 'xscaler-remote-surface', 'public XScaler AppService transport exposes its canonical transport identity');

  let nonRemoteError = null;
  try {
    await transport.invoke(appServiceRequest({ target: 'server' }));
  } catch (error) {
    nonRemoteError = error;
  }
  context.assert(nonRemoteError && nonRemoteError.code === XSCALER_APP_SERVICE_TARGET_REQUIRED_CODE && loadCount === 0, 'local/server AppServices bypass XScaler with zero load');

  const invoked = await transport.invoke(appServiceRequest());
  context.assert(invoked.result === 'featured' && loadCount === 1, 'remote-surface AppService invokes through accepted XScaler attachment');
  context.assert(events[0].startsWith('attach:') && events[1] === 'invoke:app-service:1' && events[2].startsWith('detach:'), 'AppService invoke follows Preflight/load/attach → invoke → detach');

  const streamFrames = [];
  for await (const frame of transport.stream(appServiceRequest({
    kind: 'stream',
    input: { topic: 'updates' },
    invocationId: 'app-service:2',
    correlationId: 'correlation:2'
  }))) {
    streamFrames.push(frame);
  }
  context.assert(streamFrames.length === 2 && streamFrames[0].delta === 'updates', 'remote-surface AppService streams through the attached adapter');
  context.assert(events.includes('stream:app-service:2') && events.some((event) => event.includes('app-service:2') && event.startsWith('detach:')), 'natural stream completion detaches its ATC session');

  const registry = createAppServiceRegistry(defineAppServices({
    'local.echo': service({
      kind: 'query',
      target: 'local',
      invoke(input) { return { local: input.value }; }
    }),
    'remote.catalog': service({ kind: 'query', target: 'remote-surface' }),
    'remote.feed': service({ kind: 'stream', target: 'remote-surface' })
  }), { transport });
  const loadCountBeforeLocal = loadCount;
  const localResult = await registry.invoke('local.echo', { value: 'kept-local' });
  const remoteResult = await registry.invoke('remote.catalog', { query: 'registry' });
  context.assert(localResult.local === 'kept-local' && loadCount === loadCountBeforeLocal + 1, 'Maraca registry keeps local services local and routes only its remote-surface service through XScaler');
  context.assert(remoteResult.result === 'registry', 'XScaler transport satisfies the Maraca AppServiceTransport invoke contract');
  const registryStream = registry.stream('remote.feed', { topic: 'registry-stream' });
  const registryFrames = [];
  for await (const frame of registryStream) registryFrames.push(frame);
  await registryStream.done;
  const registryStreamLifecycle = events.filter((event) => event.includes('xscaler-app-service:remote.feed'));
  context.assert(registryFrames.at(-1).type === 'complete', 'Maraca registry observes the explicit remote complete frame');
  context.assert(registryStreamLifecycle.some((event) => event.startsWith('detach:')) && !registryStreamLifecycle.some((event) => event.startsWith('cancel:')), 'explicit remote complete detaches its ATC session even when the registry closes the iterator at the terminal frame');
  registry.dispose();
  context.assert(transport.dispose('test-complete') === true && transport.dispose('again') === false, 'AppService transport disposal is idempotent');
  await transport.whenDisposed();
  context.assert(transport.snapshot().disposed === true && transport.snapshot().runtimeBoundary.kernelRemoteExecution === false, 'disposed AppService transport preserves no-remote-kernel evidence');

  let rejectedLoadCount = 0;
  let rejectedAdapterExecution = 0;
  const rejectedTransport = createXScalerAppServiceTransport({
    services: {
      'remote.catalog': {
        remoteSurfacePlan: createPlan(),
        adapterUrl: 'https://cdn.xtend.example/catalog-adapter.mjs',
        hostCapabilities: { allowedOrigins: ['https://blocked.example'] }
      }
    },
    loaderOptions: {
      loadExternalAdapter: secureExternalLoader(async () => {
        rejectedLoadCount += 1;
        return {
          adapter: {
            ...createLifecycleAdapter([], 'rejected'),
            async invoke() { rejectedAdapterExecution += 1; }
          }
        };
      })
    }
  });
  let rejectedError = null;
  try {
    await rejectedTransport.invoke(appServiceRequest({ invocationId: 'app-service:reject' }));
  } catch (error) {
    rejectedError = error;
  }
  context.assert(rejectedError && rejectedError.code === XSCALER_APP_SERVICE_ATTACH_REFUSED_CODE, 'rejected remote AppService exposes stable XScaler refusal');
  context.assert(rejectedLoadCount === 0 && rejectedAdapterExecution === 0, 'rejected remote AppService guarantees null import and null adapter execution');
  context.assert(rejectedError.fallback && rejectedError.fallback.surface === 'checkout.cart.fallback', 'rejected remote AppService exposes host fallback evidence');
  rejectedTransport.dispose();
  await rejectedTransport.whenDisposed();

  let startedResolve;
  const started = new Promise((resolve) => { startedResolve = resolve; });
  const abortEvents = [];
  const abortTransport = createXScalerAppServiceTransport({
    services: {
      'remote.catalog': {
        remoteSurfacePlan: createPlan(),
        adapterUrl: 'https://cdn.xtend.example/catalog-adapter.mjs'
      }
    },
    loaderOptions: {
      loadExternalAdapter: secureExternalLoader(async () => ({
        adapter: {
          async attach() { abortEvents.push('attach'); },
          async cancel() { abortEvents.push('cancel'); },
          async detach() { abortEvents.push('detach'); },
          async dispose() { abortEvents.push('dispose'); },
          async invoke(_request, lifecycle) {
            startedResolve();
            return new Promise((resolve, reject) => {
              lifecycle.signal.addEventListener('abort', () => reject(new Error('remote-secret')), { once: true });
            });
          },
          async *stream() {}
        }
      }))
    }
  });
  const abortController = new AbortController();
  const abortedInvocation = abortTransport.invoke(appServiceRequest({
    invocationId: 'app-service:abort',
    signal: abortController.signal
  }));
  await started;
  abortController.abort('navigation');
  let abortError = null;
  try {
    await abortedInvocation;
  } catch (error) {
    abortError = error;
  }
  context.assert(abortError && abortEvents.includes('cancel') && !abortEvents.includes('detach'), 'AppService Abort maps to ATC cancel instead of detach');
  context.assert(!JSON.stringify(abortError).includes('remote-secret'), 'AppService Abort diagnostics do not expose remote errors');
  abortTransport.dispose();
  await abortTransport.whenDisposed();
}

async function runXScalerPublicApiSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'xscaler-public-api', label: 'XScaler Public API and Remote Adapter Loader' });
  validatePublicFiles(context, rootDir);
  validateCentralIntegration(context, rootDir);
  validateJsonSchemas(context, rootDir);
  await validateNativeEsm(context, rootDir);
  await validateBrowserLoaderContract(context);
  await validateAcceptedLifecycle(context);
  await validateZeroLoadOnRejection(context);
  await validateForgedAcceptanceAndFailureRedaction(context);
  await validateStaticSecurityRejections(context);
  await validateCancellationDuringPreflight(context);
  await validateXScalerAppServiceTransport(context);
  const loaderSource = readText('xscaler/remote-adapter-loader.js', rootDir);
  ['eval(', 'new Function', 'import(', 'blob:', 'data:text/javascript', 'fetch('].forEach((unsafePattern) => {
    context.assert(!loaderSource.includes(unsafePattern), `remote loader avoids ${unsafePattern}`);
  });
  return context.result({
    schema: XSCALER_PUBLIC_API_SUITE_SCHEMA,
    apiSchema: XSCALER_PUBLIC_API_SCHEMA,
    loaderSchema: XSCALER_REMOTE_ADAPTER_LOADER_SCHEMA,
    files: PUBLIC_FILES,
    schemas: SCHEMA_FILES
  });
}

function printXScalerPublicApiReport(result) {
  printSuiteReport(result, {
    successTitle: 'XScaler Public API Gate erfolgreich.',
    failureTitle: 'XScaler Public API Gate fehlgeschlagen:'
  });
}

if (require.main === module) {
  runXScalerPublicApiSuite().then((result) => {
    printXScalerPublicApiReport(result);
    if (!result.ok) process.exitCode = 1;
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  printXScalerPublicApiReport,
  runXScalerPublicApiSuite
};

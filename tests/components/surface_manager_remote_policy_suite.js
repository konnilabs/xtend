const fs = require('fs');
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
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  REMOTE_POLICY_DECISIONS,
  REMOTE_POLICY_DIAGNOSTICS,
  REMOTE_POLICY_EVENTS,
  REMOTE_POLICY_METHODS,
  REQUIRED_ARTIFACTS,
  SURFACE_MANAGER_REMOTE_POLICY_BACKLOG,
  SURFACE_MANAGER_REMOTE_POLICY_DIAGNOSTIC_SCHEMA,
  SURFACE_MANAGER_REMOTE_POLICY_DOCS,
  SURFACE_MANAGER_REMOTE_POLICY_FIXTURE,
  SURFACE_MANAGER_REMOTE_POLICY_LOCAL_GATE,
  SURFACE_MANAGER_REMOTE_POLICY_MODULE,
  SURFACE_MANAGER_REMOTE_POLICY_PACKAGE_SCRIPT,
  SURFACE_MANAGER_REMOTE_POLICY_REPORT_SCHEMA,
  SURFACE_MANAGER_REMOTE_POLICY_SCHEMA,
  SURFACE_MANAGER_REMOTE_POLICY_STATUS,
  SURFACE_MANAGER_REMOTE_POLICY_SUITE,
  SURFACE_MANAGER_REMOTE_POLICY_TARGET,
  SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE,
  SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE_DOC,
  SURFACE_REMOTE_TRUST_BOUNDARY,
  createSurfaceManagerRemotePolicyPlan,
  createSurfaceManagerRemotePolicyReport,
  validateSurfaceManagerRemotePolicyPlan
} = require('../../catalog/surface-manager-remote-policy');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function createSandbox() {
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
    navigator: { userAgent: 'xtend-surface-remote-policy-test' },
    CustomEvent,
    document: {
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return true;
      },
      querySelector() {
        return null;
      }
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  return sandbox;
}

function evaluateXtendRmtArtifact(context, relativePath, rootDir) {
  const source = readText(relativePath, rootDir);
  const sandbox = createSandbox();
  const executableSource = relativePath.endsWith('.esm.js')
    ? source
      .replace(/^\s*import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];\s*$/gmu, '')
      .replace(/^\s*import\s+['"][^'"]+['"];\s*$/gmu, '')
      .replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default XtendRmtProduct;\s*$/u, '')
    : source;
  try {
    vm.runInNewContext(executableSource, sandbox, { filename: relativePath });
  } catch (error) {
    context.fail(`${relativePath} evaluates with remote surface policy (${error.message})`);
    return null;
  }
  return sandbox.AppModules || null;
}

function createFakeRemotePolicyManager() {
  return {
    id: 'enterprise.manager',
    attributes: Object.create(null),
    remote: [],
    registered: [],
    governed: [],
    events: [],
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    },
    dispatchEvent(event) {
      this.events.push(event);
      return true;
    },
    registerSurface(record) {
      this.registered.push(record);
      return { ok: true, operation: 'registerSurface', surfaceId: record.id };
    },
    registerRemoteSurface(record, options = {}) {
      const blocked = record && record.remote && record.remote.origin && record.remote.origin.includes('evil');
      const decision = blocked ? 'degraded' : 'mounted';
      const result = {
        ok: true,
        decision,
        mounted: decision === 'mounted',
        degraded: decision === 'degraded',
        refused: false,
        fallbackRef: record && record.fallback && record.fallback.ref || null,
        kernelBoundary: {
          remoteRuntimeExecution: false,
          hostAdapterRequired: true,
          networkRequiredByKernel: false
        },
        source: options.source || 'test'
      };
      this.remote.push({ operation: 'registerRemoteSurface', record, options, result });
      return result;
    },
    applyRemoteSurfacePolicy(record, options = {}) {
      const result = this.registerRemoteSurface(record, { ...options, source: options.source || 'applyRemoteSurfacePolicy' });
      return { ...result, operation: 'applyRemoteSurfacePolicy' };
    },
    governRemoteSurfaceEvent(eventRecord, payload = {}) {
      const refused = Array.isArray(eventRecord && eventRecord.scopes) && eventRecord.scopes.includes('global');
      const result = {
        ok: !refused,
        governed: !refused,
        refused,
        event: eventRecord && eventRecord.event,
        scopes: eventRecord && eventRecord.scopes || [],
        payload,
        runtimeDelivery: false
      };
      this.governed.push(result);
      return result;
    },
    snapshot() {
      return {
        schema: 'xtend.surface.snapshot.v1',
        surfaces: this.registered,
        remote: this.remote
      };
    }
  };
}

function runSurfaceManagerRemotePolicySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-remote-policy',
    label: 'SurfaceManager remote surface trust policy bridge'
  });
  const plan = createSurfaceManagerRemotePolicyPlan({ rootDir });
  const validation = validateSurfaceManagerRemotePolicyPlan(plan);
  const report = createSurfaceManagerRemotePolicyReport({ rootDir, plan });
  const managerRuntime = readText('components/xsurfacemanager.js', rootDir);
  const managerTypes = readText('components/xsurfacemanager.d.ts', rootDir);
  const coreTypes = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const coreRuntime = readText('xtendrmt/rmt-core.esm.js', rootDir);
  const runtimeEsm = readText('xtendrmt/rmt-runtime.esm.js', rootDir);
  const runtimeBrowser = readText('xtendrmt/rmt-runtime.browser.js', rootDir);
  const fixture = readText(SURFACE_MANAGER_REMOTE_POLICY_FIXTURE, rootDir);
  const remoteCompilerFixture = readJson('tests/rmt-language/fixtures/vnext-remote-compiler-valid.core.json', rootDir);
  const docs = readText(SURFACE_MANAGER_REMOTE_POLICY_DOCS, rootDir);
  const backlog = readText(SURFACE_MANAGER_REMOTE_POLICY_BACKLOG, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE_DOC, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerRemotePolicy;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as remote policy artifact`);
  });

  [
    SURFACE_MANAGER_REMOTE_POLICY_MODULE,
    SURFACE_MANAGER_REMOTE_POLICY_SUITE,
    'components/xsurfacemanager.js',
    'xtendrmt/rmt-core.esm.js',
    'xtendrmt/rmt-runtime.esm.js',
    'xtendrmt/rmt-runtime.browser.js'
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_REMOTE_POLICY_SCHEMA, 'Remote policy schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_REMOTE_POLICY_REPORT_SCHEMA, 'Remote policy report schema is stable');
  context.assert(plan.diagnosticSchema === SURFACE_MANAGER_REMOTE_POLICY_DIAGNOSTIC_SCHEMA, 'Remote policy diagnostic schema is stable');
  context.assert(plan.workpackage === SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE, 'Remote policy belongs to WP-SM-17');
  context.assert(plan.status === SURFACE_MANAGER_REMOTE_POLICY_STATUS, 'Remote policy status is implemented');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_REMOTE_POLICY_TARGET, 'Remote policy target readiness is stable');
  context.assert(plan.trustBoundary === SURFACE_REMOTE_TRUST_BOUNDARY, 'Remote policy trust boundary is stable');
  context.assert(plan.runtimeBoundary.managerOwnsHostDecision === true, 'SurfaceManager owns host policy decision');
  context.assert(plan.runtimeBoundary.controllerOwnsRegistry === true, 'SurfaceController remains the registry owner');
  context.assert(plan.runtimeBoundary.rmtKernelRemoteExecution === false, 'RMT kernel remote execution stays false');
  context.assert(plan.runtimeBoundary.createsSecondRegistry === false, 'Remote policy bridge creates no second registry');
  context.assert(validation.ok === true, 'Remote policy plan validates');
  context.assert(report.ok === true, 'Remote policy report validates');
  assertIncludesAll(context, plan.methods, REMOTE_POLICY_METHODS, 'Remote policy methods');
  assertIncludesAll(context, plan.events, REMOTE_POLICY_EVENTS, 'Remote policy events');
  assertIncludesAll(context, plan.decisions, REMOTE_POLICY_DECISIONS, 'Remote policy decisions');
  assertIncludesAll(context, plan.diagnostics, REMOTE_POLICY_DIAGNOSTICS, 'Remote policy diagnostics');

  assertTextIncludesAll(context, managerRuntime, [
    "const SURFACE_REMOTE_POLICY_SCHEMA = 'xtend.surface.remote-policy-bridge.v1'",
    "const SURFACE_REMOTE_POLICY_REPORT_SCHEMA = 'xtend.surface.remote-policy-report.v1'",
    "const SURFACE_REMOTE_POLICY_DIAGNOSTIC_SCHEMA = 'xtend.surface.remote-policy-diagnostic.v1'",
    "const SURFACE_REMOTE_TRUST_BOUNDARY = 'xtend.security.remote-surface.v1'",
    'remote-surface-policy',
    'remote-origin-allowlist',
    'remote-capabilities',
    'evaluateRemoteSurfacePolicy(surfaceInput = {}, options = {})',
    'applyRemoteSurfacePolicy(surfaceInput = {}, options = {})',
    'registerRemoteSurface(remoteSurface = {}, options = {})',
    "if (isSurfaceRemoteInput(record))",
    'snapshotRemoteSurfacePolicy()',
    'governRemoteSurfaceEvent(eventInput = {}, payload = {}, options = {})',
    'remote-surface-mounted',
    'remote-surface-degraded',
    'remote-surface-refused',
    'remote-surface-event-governed',
    'xtend.surface.remotePolicy',
    'rmtKernelRemoteExecution: false',
    'createsSecondRegistry: false'
  ], 'x-surface-manager remote policy runtime');

  assertTextIncludesAll(context, managerTypes, [
    'XSurfaceManagerRemotePolicySnapshot',
    'XSurfaceManagerRemotePolicyResult',
    'remoteSurfacePolicySnapshot',
    'evaluateRemoteSurfacePolicy',
    'applyRemoteSurfacePolicy',
    'registerRemoteSurface',
    'snapshotRemoteSurfacePolicy',
    'governRemoteSurfaceEvent',
    'remote-surface-degraded'
  ], 'x-surface-manager remote policy public types');

  [coreRuntime, runtimeEsm, runtimeBrowser].forEach((runtimeText, index) => {
    assertTextIncludesAll(context, runtimeText, [
      'normalizeSurfaceRemoteRecord',
      'collectRemoteSurfaceRecords',
      'remoteSurfaceToSurfaceRecord',
      'registerRemoteSurface',
      'applyRemoteSurfacePolicy',
      'governRemoteSurfaceEvent',
      'remoteSurfacePolicy',
      'remoteSurfaceTrust',
      'remoteSurfaceDegradation',
      'remoteEventGovernance',
      'remoteRuntimeExecution: false',
      'data-rmt-kernel-remote-execution'
    ], `RMT runtime artifact ${index + 1} remote policy bridge`);
  });

  assertTextIncludesAll(context, coreTypes, [
    'remoteSurface?: Record<string, unknown> | null',
    'remotePolicy?: Record<string, unknown> | null',
    'registerRemoteSurface',
    'applyRemoteSurfacePolicy',
    'governRemoteSurfaceEvent'
  ], 'RMT type artifact remote policy bridge');

  assertTextIncludesAll(context, fixture, [
    'remote-surface-policy="strict"',
    'remote-origin-allowlist="https://cdn.xtend.example"',
    'remote-capabilities="surface.mount,event.emit,event.consume"',
    'xtend.rmt.vnext-remote-surface.v1',
    'xtend.security.remote-surface.v1',
    'kernelRemoteExecution: false',
    'manager.registerRemoteSurface',
    'manager.applyRemoteSurfacePolicy',
    'manager.governRemoteSurfaceEvent',
    'manager.snapshotRemoteSurfacePolicy',
    '__xtendComponentResult'
  ], 'Remote policy fixture');

  const evaluatedArtifacts = [
    'xtendrmt/rmt-core.esm.js',
    'xtendrmt/rmt-runtime.esm.js',
    'xtendrmt/rmt-runtime.browser.js'
  ].map((artifact) => ({ artifact, modules: evaluateXtendRmtArtifact(context, artifact, rootDir) }));

  evaluatedArtifacts.forEach(({ artifact, modules }) => {
    if (!modules) return;
    context.assert(typeof modules.createRmtSurfaceAdapter === 'function', `${artifact} exposes createRmtSurfaceAdapter`);
    const adapter = modules.createRmtSurfaceAdapter({ managerId: 'enterprise.manager' });
    context.assert(typeof adapter.registerRemoteSurface === 'function', `${artifact} exposes registerRemoteSurface`);
    context.assert(typeof adapter.applyRemoteSurfacePolicy === 'function', `${artifact} exposes applyRemoteSurfacePolicy`);
    context.assert(typeof adapter.governRemoteSurfaceEvent === 'function', `${artifact} exposes governRemoteSurfaceEvent`);
    assertIncludesAll(context, adapter.runtimeSurface, REMOTE_POLICY_METHODS.filter((method) => method !== 'evaluateRemoteSurfacePolicy' && method !== 'snapshotRemoteSurfacePolicy'), `${artifact} runtime surface remote methods`);
    assertIncludesAll(context, adapter.capabilities.providedCapabilities, ['remoteSurfacePolicy', 'remoteSurfaceTrust', 'remoteSurfaceDegradation', 'remoteEventGovernance'], `${artifact} provided capabilities`);
  });

  const coreModules = evaluatedArtifacts.find((entry) => entry.artifact === 'xtendrmt/rmt-core.esm.js').modules;
  if (coreModules && typeof coreModules.createRmtSurfaceAdapter === 'function') {
    const manager = createFakeRemotePolicyManager();
    const adapter = coreModules.createRmtSurfaceAdapter({ managerId: 'enterprise.manager' });
    const mapping = adapter.mapSurfaces(remoteCompilerFixture, { managerId: 'enterprise.manager' });
    const registerResult = adapter.registerSurface(mapping, {
      managerElement: manager,
      allowedOrigins: ['https://cdn.xtend.example'],
      allowedCapabilities: ['surface.mount', 'event.emit', 'event.consume']
    });
    const policyResult = adapter.applyRemoteSurfacePolicy(remoteCompilerFixture.document.remoteSurface, {
      managerElement: manager,
      allowedOrigins: ['https://cdn.xtend.example'],
      allowedCapabilities: ['surface.mount', 'event.emit', 'event.consume']
    });
    const eventResult = adapter.governRemoteSurfaceEvent(remoteCompilerFixture.document.remoteSurface.events.emits[0], { cartId: 'demo' }, {
      managerElement: manager
    });

    context.assert(mapping.surfaceCount === 1, 'Adapter maps one E16 remote surface record');
    context.assert(mapping.surfaces[0].remoteSurface && mapping.surfaces[0].remoteSurface.name === 'checkout.cart', 'Mapped surface preserves remote surface payload');
    context.assert(mapping.surfaces[0].remotePolicy && mapping.surfaces[0].remotePolicy.kernelRemoteExecution === false, 'Mapped surface records kernel remote execution false');
    context.assert(registerResult.ok === true && manager.remote.length >= 1, 'Adapter registers remote surfaces through SurfaceManager policy bridge');
    context.assert(policyResult.ok === true && policyResult.metadata.remoteRuntimeExecution === false, 'Adapter applies remote policy without remote runtime execution');
    context.assert(eventResult.ok === true && eventResult.metadata.runtimeDelivery === false, 'Adapter governs remote events without delivering a runtime bus');
  }

  assertTextIncludesAll(context, docs, [
    '# SurfaceManager Remote Policy Bridge',
    SURFACE_MANAGER_REMOTE_POLICY_SCHEMA,
    SURFACE_REMOTE_TRUST_BOUNDARY,
    'mounted',
    'degraded',
    'refused',
    'keine zweite Registry',
    'kein Remote Runtime Loading im RMT Kernel'
  ], 'Remote policy docs');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_REMOTE_POLICY_SCHEMA, 'Package metadata exposes remote policy schema');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_REMOTE_POLICY_LOCAL_GATE, 'Package metadata exposes remote policy gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_REMOTE_POLICY_PACKAGE_SCRIPT, 'Package metadata exposes remote policy package script');
  context.assert(metadata && metadata.rmtKernelRemoteExecution === false, 'Package metadata keeps remote runtime execution false');
  context.assert(metadata && metadata.createsSecondRegistry === false, 'Package metadata keeps no-second-registry boundary');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-remote-policy'] === 'node scripts/run_xtend_tests.js surface-remote-policy', 'Package script test:surface-remote-policy exists');
  context.assertIncludes(runner, "require('../tests/components/surface_manager_remote_policy_suite')", 'Runner imports remote policy suite');
  context.assertIncludes(runner, "id: 'surface-remote-policy'", 'Runner registers remote policy suite');

  assertTextIncludesAll(context, backlog, [
    '`WP-SM-17` | P1 | completed',
    'Remote Surface Trust, Ownership und Capability Policies anbinden',
    '`WP-SM-18`'
  ], 'Remote policy backlog status');
  assertTextIncludesAll(context, workpackageDoc, [
    'Status: `completed`',
    SURFACE_MANAGER_REMOTE_POLICY_SCHEMA,
    SURFACE_MANAGER_REMOTE_POLICY_LOCAL_GATE,
    'no-remote-runtime-execution-in-rmt-kernel',
    'Remote Surface Records koennen sicher abgelehnt, degradiert oder gemountet werden'
  ], 'Remote policy workpackage doc');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_REMOTE_POLICY_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE,
      targetReadiness: SURFACE_MANAGER_REMOTE_POLICY_TARGET,
      methods: REMOTE_POLICY_METHODS.length,
      events: REMOTE_POLICY_EVENTS.length,
      diagnostics: REMOTE_POLICY_DIAGNOSTICS.length
    }
  });
}

function printSurfaceManagerRemotePolicyReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Remote Policy erfolgreich.',
    failureTitle: 'SurfaceManager Remote Policy fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerRemotePolicyReport,
  runSurfaceManagerRemotePolicySuite
};

if (require.main === module) {
  const result = runSurfaceManagerRemotePolicySuite();
  printSurfaceManagerRemotePolicyReport(result);
  process.exit(result.ok ? 0 : 1);
}

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
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ARTIFACTS,
  REQUIRED_BOUNDARIES,
  REQUIRED_DOCS,
  REQUIRED_OVERLAY_KINDS,
  REQUIRED_PORTAL_POLICIES,
  REQUIRED_SURFACE_CAPABILITIES,
  REQUIRED_SURFACE_KINDS,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_DOCS,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE_SCHEMA,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_LOCAL_GATE,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_MODULE,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_PACKAGE_SCRIPT,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_REPORT_SCHEMA,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_RUNTIME,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_STATUS,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SUITE,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_TARGET,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_TYPES,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE_DOC,
  createRmtSurfaceResourceGraphRuntimePlan,
  createRmtSurfaceResourceGraphRuntimeReport,
  validateRmtSurfaceResourceGraphRuntimePlan
} = require('../../catalog/epic18-rmt-surface-resource-graph-runtime');
const {
  RMT_ACTION_EFFECT_RUNTIME_SCHEMA
} = require('../../catalog/epic18-rmt-action-effect-runtime');
const {
  RMT_EVENT_ROUTING_RUNTIME_SCHEMA
} = require('../../catalog/epic18-rmt-event-routing-runtime');

let surfaceRuntimeModulePromise = null;
let actionRuntimeModulePromise = null;

function loadSurfaceRuntimeModule(rootDir) {
  if (!surfaceRuntimeModulePromise) {
    surfaceRuntimeModulePromise = import(`file://${resolveRepoPath(RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_RUNTIME, rootDir)}`);
  }
  return surfaceRuntimeModulePromise;
}

function loadActionRuntimeModule(rootDir) {
  if (!actionRuntimeModulePromise) {
    actionRuntimeModulePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-action-effect-runtime.js', rootDir)}`);
  }
  return actionRuntimeModulePromise;
}

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, label) {
  const values = Array.isArray(actual) ? actual : [];
  expected.forEach((entry) => {
    context.assert(values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function indexById(records) {
  return new Map((Array.isArray(records) ? records : []).map((record) => [record.id, record]));
}

function assertFixtureGraph(context, fixture) {
  const portals = indexById(fixture.portals);
  const surfaces = indexById(fixture.surfaces);
  const overlays = indexById(fixture.overlays);
  const resources = indexById(fixture.resources);

  REQUIRED_SURFACE_KINDS.forEach((kind) => {
    context.assert((fixture.surfaces || []).some((entry) => entry.kind === kind), `fixture covers surface kind ${kind}`);
  });
  REQUIRED_OVERLAY_KINDS.forEach((kind) => {
    context.assert((fixture.overlays || []).some((entry) => entry.kind === kind), `fixture covers overlay kind ${kind}`);
  });
  REQUIRED_PORTAL_POLICIES.forEach((policy) => {
    context.assert((fixture.portals || []).some((entry) => entry.policy === policy), `fixture covers portal policy ${policy}`);
  });
  (fixture.surfaces || []).forEach((surface) => {
    context.assert(surfaces.has(surface.id), `${surface.id}: surface is indexed`);
    context.assert(portals.has(surface.portal), `${surface.id}: surface portal resolves`);
    (surface.resources || []).forEach((resourceId) => {
      context.assert(resources.has(resourceId), `${surface.id}: resource resolves ${resourceId}`);
    });
    context.assert(surface.component && surface.template, `${surface.id}: component and template are declared`);
  });
  (fixture.overlays || []).forEach((overlay) => {
    context.assert(overlays.has(overlay.id), `${overlay.id}: overlay is indexed`);
    context.assert(portals.has(overlay.portal), `${overlay.id}: overlay portal resolves`);
    (overlay.resources || []).forEach((resourceId) => {
      context.assert(resources.has(resourceId), `${overlay.id}: resource resolves ${resourceId}`);
    });
  });
  const fixtureText = JSON.stringify(fixture);
  context.assert(!/Media\s*Manager|media-manager|mediaManager|MediaRecord|mediaRecord|explorer\.|player\./u.test(fixtureText), 'surface graph fixture stays product-agnostic');
  context.assert(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/u.test(fixtureText), 'surface graph fixture contains no manual HTML sinks');
}

function createResourceHarness() {
  const observerOpen = [];
  const observerClose = [];
  const streamOpen = [];
  const streamClose = [];
  const objectUrls = [];
  const revokedUrls = [];
  const timers = [];
  const clearedTimers = [];
  return {
    observerOpen,
    observerClose,
    streamOpen,
    streamClose,
    objectUrls,
    revokedUrls,
    timers,
    clearedTimers,
    adapters: {
      observer: {
        open(resource, context) {
          const handle = { id: resource.id, owner: context.surface && context.surface.owner };
          observerOpen.push(handle);
          return handle;
        },
        close(handle) {
          observerClose.push(handle);
        }
      },
      stream: {
        open(resource, context) {
          const handle = { id: resource.id, owner: context.surface && context.surface.owner };
          streamOpen.push(handle);
          return handle;
        },
        close(handle) {
          streamClose.push(handle);
        }
      }
    },
    objectUrlFactory: {
      create(value) {
        const url = `blob:rmt:${objectUrls.length + 1}`;
        objectUrls.push({ url, value });
        return url;
      },
      revoke(value) {
        revokedUrls.push(value);
      }
    },
    timerAdapter: {
      set(delayMs, context) {
        const handle = { delayMs, owner: context.surface && context.surface.owner || context.overlay && context.overlay.id };
        timers.push(handle);
        return handle;
      },
      clear(handle) {
        clearedTimers.push(handle);
      }
    }
  };
}

async function runRuntimeAssertions(context, fixture, actionRuntimeModule, surfaceRuntimeModule) {
  const resourceHarness = createResourceHarness();
  const detachedOwners = [];
  const savedSnapshots = [];
  const focusCalls = [];
  const diagnostics = [];
  const surfaceManagerCalls = [];
  const portalChildren = [];
  const documentTarget = {
    createElement(tagName) {
      return {
        nodeType: 1,
        localName: String(tagName || '').toLowerCase(),
        attributes: {},
        children: [],
        style: { setProperty() {} },
        setAttribute(name, value) {
          this.attributes[name] = String(value);
        },
        getAttribute(name) {
          return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
        },
        appendChild(child) {
          this.children.push(child);
          if (child && typeof child === 'object') child.parentNode = this;
          return child;
        },
        remove() {
          if (this.parentNode && typeof this.parentNode.removeChild === 'function') this.parentNode.removeChild(this);
        }
      };
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text || '') };
    },
    body: {
      appendChild(child) {
        portalChildren.push(child);
        if (child && typeof child === 'object') child.parentNode = this;
        return child;
      },
      removeChild(child) {
        const index = portalChildren.indexOf(child);
        if (index >= 0) portalChildren.splice(index, 1);
        return child;
      }
    }
  };
  const portalTarget = {
    appendChild(child) {
      portalChildren.push(child);
      if (child && typeof child === 'object') child.parentNode = this;
      return child;
    },
    removeChild(child) {
      const index = portalChildren.indexOf(child);
      if (index >= 0) portalChildren.splice(index, 1);
      return child;
    }
  };
  const surfaceManager = {
    registerSurface(record) {
      surfaceManagerCalls.push({ operation: 'registerSurface', id: record && record.id, record });
      return { ok: true };
    },
    openSurface(id, input) {
      surfaceManagerCalls.push({ operation: 'openSurface', id, input });
      return { ok: true };
    },
    closeSurface(id, reason) {
      surfaceManagerCalls.push({ operation: 'closeSurface', id, reason });
      return { ok: true };
    },
    focusSurface(id) {
      surfaceManagerCalls.push({ operation: 'focusSurface', id });
      return { ok: true };
    },
    updateSurface(id, patch) {
      surfaceManagerCalls.push({ operation: 'updateSurface', id, patch });
      return { ok: true };
    },
    minimizeSurface(id) {
      surfaceManagerCalls.push({ operation: 'minimizeSurface', id });
      return { ok: true };
    },
    restoreSurface(id) {
      surfaceManagerCalls.push({ operation: 'restoreSurface', id });
      return { ok: true };
    }
  };
  const resourceManager = actionRuntimeModule.createRmtResourceManager({
    resources: fixture.resources,
    resourceAdapters: resourceHarness.adapters,
    objectUrlFactory: resourceHarness.objectUrlFactory,
    timerAdapter: resourceHarness.timerAdapter
  });
  const runtime = surfaceRuntimeModule.createRmtSurfaceResourceGraphRuntime({
    surfaces: fixture.surfaces,
    overlays: fixture.overlays,
    portals: fixture.portals,
    resourceManager,
    surfaceManager,
    managerId: 'fixture.surface.manager',
    documentTarget,
    eventRuntime: {
      detachOwner(ownerId) {
        detachedOwners.push(ownerId);
        return { schema: 'xtend.test.detach.v1', owner: ownerId, detachedCount: 1 };
      }
    },
    persistenceAdapter: {
      save(snapshot) {
        savedSnapshots.push(snapshot);
      },
      load() {
        return savedSnapshots[savedSnapshots.length - 1] || null;
      }
    },
    focusAdapter: {
      focus(surface) {
        focusCalls.push(surface.id);
      }
    },
    diagnosticsHub: {
      publish(channel, payload) {
        diagnostics.push({ channel, payload });
      }
    }
  });

  context.assert(runtime.schema === RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA, 'surface graph runtime exposes schema');
  context.assert(runtime.listSurfaces().length === fixture.surfaces.length, 'surface graph runtime indexes all surface definitions');
  context.assert(runtime.listPortals().some((portal) => portal.id === 'portal.overlay'), 'surface graph runtime indexes overlay portal');

  runtime.mountPortal('portal.overlay', portalTarget);
  context.assert(portalChildren.some((child) => child.localName === 'x-surface-portal' && child.getAttribute('policy') === 'modal'), 'mountPortal materializes x-surface-portal policy element');
  const firstMaterialize = runtime.materialize(fixture.records);
  context.assert(firstMaterialize.createdCount === 5, 'keyed surface repeater materializes two repeated surface groups plus host');
  context.assert(firstMaterialize.reusedCount === 0, 'first materialize has no reused instances');
  context.assert(surfaceManagerCalls.filter((call) => call.operation === 'registerSurface').length >= 5, 'materialize registers keyed instances with SurfaceManager');
  context.assert(surfaceManagerCalls.some((call) => call.operation === 'registerSurface' && call.id === 'surface.workspace:alpha' && call.record.type === 'region'), 'SurfaceManager registration lowers workspace kind to region');
  context.assert(runtime.getSurface('surface.workspace:alpha').state === 'closed', 'materialized workspace alpha starts closed');
  context.assert(runtime.getSurface('surface.detail-panel:beta').placement === 'right', 'materialized detail panel preserves placement');

  const alpha = await runtime.openSurface('surface.workspace:alpha');
  context.assert(alpha.state === 'open', 'openSurface opens keyed workspace instance');
  context.assert(resourceManager.listOwned('surface.workspace:alpha').length === 2, 'openSurface acquires owned resources');
  context.assert(resourceHarness.observerOpen.length === 1 && resourceHarness.streamOpen.length === 1, 'resource adapters open observer and stream');
  context.assert(focusCalls.includes('surface.workspace:alpha'), 'openSurface uses injected focus adapter');
  context.assert(surfaceManagerCalls.some((call) => call.operation === 'openSurface' && call.id === 'surface.workspace:alpha'), 'openSurface proxies to SurfaceManager');

  const resizedAlpha = runtime.setBounds('surface.workspace:alpha', { x: 80, y: 96, width: 720, height: 460 });
  context.assert(resizedAlpha.bounds.x === 80 && resizedAlpha.bounds.width === 720, 'setBounds updates runtime bounds');
  context.assert(surfaceManagerCalls.some((call) => call.operation === 'updateSurface' && call.id === 'surface.workspace:alpha'), 'setBounds proxies updateSurface to SurfaceManager');
  const minimizedAlpha = runtime.minimizeSurface('surface.workspace:alpha');
  context.assert(minimizedAlpha.state === 'minimized', 'minimizeSurface changes state');
  context.assert(surfaceManagerCalls.some((call) => call.operation === 'minimizeSurface' && call.id === 'surface.workspace:alpha'), 'minimizeSurface proxies to SurfaceManager');
  context.assert(resourceManager.listOwned('surface.workspace:alpha').length === 2, 'minimize preserves owned resources');
  const restoredAlpha = runtime.restoreSurface('surface.workspace:alpha');
  context.assert(restoredAlpha.state === 'open' && restoredAlpha.bounds.width === 720, 'restoreSurface restores bounds and open state');
  context.assert(surfaceManagerCalls.some((call) => call.operation === 'restoreSurface' && call.id === 'surface.workspace:alpha'), 'restoreSurface proxies to SurfaceManager');

  const nextRecords = {
    'records.generic-items': [
      ...fixture.records['records.generic-items'],
      { id: 'gamma', title: 'Gamma', kind: 'case' }
    ]
  };
  const secondMaterialize = runtime.materialize(nextRecords);
  context.assert(secondMaterialize.createdCount === 2, 're-materialize creates only new keyed instances');
  context.assert(secondMaterialize.reusedCount === 5, 're-materialize reuses existing keyed instances');
  context.assert(runtime.getSurface('surface.workspace:alpha').bounds.width === 720, 're-materialize preserves runtime bounds');
  context.assert(runtime.getSurface('surface.workspace:alpha').state === 'open', 're-materialize preserves runtime state');

  await runtime.openSurface('surface.workspace:beta');
  const closedBeta = runtime.closeSurface('surface.workspace:beta');
  context.assert(closedBeta.state === 'closed', 'closeSurface closes without destroying');
  context.assert(surfaceManagerCalls.some((call) => call.operation === 'closeSurface' && call.id === 'surface.workspace:beta'), 'closeSurface proxies to SurfaceManager');
  context.assert(resourceManager.listOwned('surface.workspace:beta').length === 2, 'closeSurface preserves resources when policy says so');
  runtime.setBounds('surface.workspace:beta', { x: 12, y: 24, width: 500, height: 320 });
  const persisted = runtime.persistSnapshot();
  context.assert(savedSnapshots.length === 1 && persisted.surfaces.length >= 5, 'persistSnapshot delegates to persistence adapter');
  runtime.setBounds('surface.workspace:beta', { x: 222, y: 333, width: 444, height: 555 });
  const hydrateReport = runtime.hydrateSnapshot();
  context.assert(hydrateReport.hydratedCount >= 5, 'hydrateSnapshot restores persisted surfaces');
  context.assert(runtime.getSurface('surface.workspace:beta').bounds.x === 12, 'hydrateSnapshot restores persisted bounds');

  const tooltip = await runtime.openOverlay('overlay.tooltip', { ownerId: 'surface.workspace:beta', payload: { text: 'Help' } });
  const toast = await runtime.openOverlay('overlay.toast', { ownerId: 'feedback.global' });
  const popover = await runtime.openOverlay('overlay.popover', { ownerId: 'surface.workspace:beta' });
  const lightbox = await runtime.openOverlay('overlay.lightbox', { ownerId: 'surface.workspace:beta' });
  const menu = await runtime.openOverlay('overlay.menu', { ownerId: 'surface.workspace:beta' });
  const dialog = await runtime.openOverlay('overlay.dialog', { ownerId: 'surface.workspace:beta' });
  context.assert(tooltip.portal === 'portal.clipping-escape' && toast.portal === 'portal.toast', 'overlays route to declared portals');
  context.assert([tooltip, toast, popover, lightbox, menu, dialog].every((entry) => entry.state === 'open'), 'all overlay kinds can open');
  context.assert(surfaceManagerCalls.some((call) => call.operation === 'registerSurface' && call.id === tooltip.id && call.record.type === 'tooltip'), 'overlay opens register SurfaceManager overlay records');
  context.assert(popover.zIndex < lightbox.zIndex && lightbox.zIndex < menu.zIndex && menu.zIndex < dialog.zIndex, 'portal overlay stack z-index is ordered');
  context.assert(resourceHarness.objectUrls.length === 1 && resourceHarness.timers.length === 1, 'overlay resources are acquired per overlay instance');

  const closedTop = runtime.closeTopOverlay({ portal: 'portal.overlay', reason: 'escape' });
  context.assert(closedTop.closed === true && closedTop.overlay.overlayId === 'overlay.dialog', 'closeTopOverlay closes top dismissible overlay in portal');
  context.assert(resourceHarness.clearedTimers.length === 1, 'closing dialog releases timer resource');
  const closeLightbox = runtime.closeOverlay(lightbox.id, { reason: 'test-close' });
  context.assert(closeLightbox.closed === true, 'closeOverlay closes explicit overlay instance');
  context.assert(resourceHarness.revokedUrls.length === 1, 'closing lightbox revokes object URL resource');

  const destroyedAlpha = runtime.destroySurface('surface.workspace:alpha');
  context.assert(destroyedAlpha.state === 'destroyed', 'destroySurface marks instance destroyed');
  context.assert(surfaceManagerCalls.some((call) => call.operation === 'closeSurface' && call.id === 'surface.workspace:alpha'), 'destroySurface proxies close to SurfaceManager');
  context.assert(resourceManager.listOwned('surface.workspace:alpha').length === 0, 'destroySurface releases owned resources');
  context.assert(resourceHarness.observerClose.length >= 1 && resourceHarness.streamClose.length >= 1, 'destroySurface closes resource adapters');
  context.assert(detachedOwners.includes('surface.workspace:alpha'), 'destroySurface detaches event owner scope');
  context.assert(runtime.listInstances().every((entry) => entry.id !== 'surface.workspace:alpha'), 'destroyed instances are hidden by default');
  context.assert(runtime.listInstances({ includeDestroyed: true }).some((entry) => entry.id === 'surface.workspace:alpha'), 'destroyed instances remain inspectable');

  const diagnosticsList = runtime.listDiagnostics();
  context.assert(diagnosticsList.some((entry) => entry.code === 'rmt.surface.materialized'), 'diagnostics include materialization');
  context.assert(diagnosticsList.some((entry) => entry.code === 'rmt.overlay.opened'), 'diagnostics include overlay open');
  context.assert(diagnosticsList.some((entry) => entry.code === 'rmt.surface.destroyed'), 'diagnostics include destroy');
  context.assert(diagnostics.some((entry) => entry.channel === 'rmt.app_platform.surface_resource_graph'), 'diagnostics hub receives surface graph channel');
}

async function runRmtSurfaceResourceGraphRuntimeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-surface-resource-graph-runtime',
    label: 'Epic 18 RMT surface resource graph runtime'
  });
  const plan = createRmtSurfaceResourceGraphRuntimePlan({ rootDir });
  const validation = validateRmtSurfaceResourceGraphRuntimePlan(plan);
  const report = createRmtSurfaceResourceGraphRuntimeReport({ rootDir, plan });
  const fixture = readJson(RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE, rootDir);
  const docs = readText(RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_DOCS, rootDir);
  const workpackageDoc = readText(RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE_DOC, rootDir);
  const backlog = readText('development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md', rootDir);
  const epic = readText('docs/epic18-media-manager-vendor-upstream.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const xtendrmtPackage = readJson('xtendrmt/package.json', rootDir);
  const runtimeSource = readText(RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_RUNTIME, rootDir);
  const typeSource = readText(RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_TYPES, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SUITE, { rootDir, extension: '.js' });
  const runtimeSyntax = syntaxCheckFile(RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_RUNTIME, { rootDir, extension: '.js' });
  const actionRuntimeModule = await loadActionRuntimeModule(rootDir);
  const surfaceRuntimeModule = await loadSurfaceRuntimeModule(rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-10 artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-10 doc`);
  });

  context.assert(moduleSyntax.ok, `Surface resource graph contract syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Surface resource graph suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(runtimeSyntax.ok, `Surface resource graph runtime syntax passes${runtimeSyntax.ok ? '' : ` (${runtimeSyntax.message})`}`);
  context.assert(plan.schema === RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA, 'Surface graph runtime schema is stable');
  context.assert(plan.reportSchema === RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_REPORT_SCHEMA, 'Surface graph runtime report schema is stable');
  context.assert(plan.fixtureSchema === RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE_SCHEMA, 'Surface graph runtime fixture schema is stable');
  context.assert(plan.actionEffectRuntimeSchema === RMT_ACTION_EFFECT_RUNTIME_SCHEMA, 'Surface graph runtime builds on action effect runtime');
  context.assert(plan.eventRoutingRuntimeSchema === RMT_EVENT_ROUTING_RUNTIME_SCHEMA, 'Surface graph runtime builds on event routing runtime');
  context.assert(plan.workpackage === RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE, 'Surface graph runtime belongs to WP-E18-10');
  context.assert(plan.status === RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_STATUS, 'Surface graph runtime status is accepted');
  context.assert(plan.targetReadiness === RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_TARGET, 'Surface graph runtime target is ready');
  context.assert(plan.localGate === RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_LOCAL_GATE, 'Surface graph runtime local gate is stable');
  context.assert(plan.packageScript === RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_PACKAGE_SCRIPT, 'Surface graph runtime package script is stable');
  context.assert(validation.ok === true, 'Surface graph runtime plan validates');
  context.assert(report.ok === true, 'Surface graph runtime report validates');
  context.assert(report.productSurfaceTaxonomyAllowed === false, 'Surface graph runtime forbids product surface taxonomy');
  context.assert(report.productRegistryRepaintRequired === false, 'Surface graph runtime avoids product registry repaint');
  assertIncludesAll(context, plan.surfaceCapabilities, REQUIRED_SURFACE_CAPABILITIES, 'required surface capabilities');
  assertIncludesAll(context, plan.surfaceKinds, REQUIRED_SURFACE_KINDS, 'required surface kinds');
  assertIncludesAll(context, plan.overlayKinds, REQUIRED_OVERLAY_KINDS, 'required overlay kinds');
  assertIncludesAll(context, plan.portalPolicies, REQUIRED_PORTAL_POLICIES, 'required portal policies');
  assertIncludesAll(context, plan.boundaries, REQUIRED_BOUNDARIES, 'required surface boundaries');

  context.assert(fixture.kind === 'rmt_document', 'Surface graph fixture is an RMT document');
  context.assert(fixture.schema === RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE_SCHEMA, 'Surface graph fixture declares schema');
  context.assert(fixture.manifest.metadata.contractVersion === RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA, 'Surface graph fixture declares contract');
  context.assert(fixture.manifest.metadata.actionEffectContract === RMT_ACTION_EFFECT_RUNTIME_SCHEMA, 'Surface graph fixture declares action effect contract');
  context.assert(fixture.manifest.metadata.eventRoutingContract === RMT_EVENT_ROUTING_RUNTIME_SCHEMA, 'Surface graph fixture declares event routing contract');
  context.assert(fixture.manifest.metadata.workpackage === RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE, 'Surface graph fixture is owned by WP-E18-10');
  context.assert(fixture.manifest.metadata.productSurfaceTaxonomyAllowed === false, 'Surface graph fixture disallows product surface taxonomy');
  context.assert(fixture.manifest.metadata.productRegistryRepaintRequired === false, 'Surface graph fixture disallows product registry repaint');
  context.assert(fixture.acceptance.keyedSurfaceRepeater === true, 'Surface graph acceptance covers keyed repeater');
  context.assert(fixture.acceptance.resourceCleanupPerInstance === true, 'Surface graph acceptance covers resource cleanup');
  context.assert(fixture.acceptance.portalLayerStack === true, 'Surface graph acceptance covers portal stack');
  context.assert(fixture.acceptance.manualHtmlRendererAllowed === false, 'Surface graph acceptance disallows manual HTML renderer');
  assertFixtureGraph(context, fixture);
  await runRuntimeAssertions(context, fixture, actionRuntimeModule, surfaceRuntimeModule);

  assertTextIncludesAll(context, runtimeSource, [
    'createRmtSurfaceResourceGraphRuntime',
    'materialize',
    'openSurface',
    'minimizeSurface',
    'restoreSurface',
    'destroySurface',
    'openOverlay',
    'closeTopOverlay',
    'persistSnapshot',
    'hydrateSnapshot',
    'releaseOwner',
    'detachOwner'
  ], 'Surface graph runtime source');
  context.assert(!/components\/|xtend-loader|api\.js/u.test(runtimeSource), 'Surface graph runtime avoids XTend UI imports');
  context.assert(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/u.test(runtimeSource), 'Surface graph runtime contains no HTML sinks');
  assertTextIncludesAll(context, typeSource, [
    'RmtSurfaceResourceGraphRuntime',
    'RmtSurfaceDefinition',
    'RmtOverlayDefinition',
    'RmtPortalDefinition',
    'RmtSurfaceBounds',
    'RmtSurfaceResourceGraphSnapshot',
    'createRmtSurfaceResourceGraphRuntime'
  ], 'Surface graph runtime types');
  assertTextIncludesAll(context, docs, [
    '# RMT Surface Resource Graph Runtime',
    RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA,
    'Keyed Surface Repeater',
    'Portal Layer Stack',
    NEXT_WORKPACKAGE
  ], 'Surface graph runtime docs');
  assertTextIncludesAll(context, workpackageDoc, [
    RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE,
    RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA,
    RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_LOCAL_GATE,
    'Status: `completed`',
    NEXT_WORKPACKAGE
  ], 'WP-E18-10 workpackage doc');
  context.assert(backlog.includes('| `WP-E18-10` | P1 | completed'), 'Backlog marks WP-E18-10 completed');
  context.assert(backlog.includes('| `WP-E18-11` | P1 | completed'), 'Backlog marks WP-E18-11 completed after tooling gate');
  context.assert(backlog.includes('| `WP-E18-12` | P1 | completed'), 'Backlog marks WP-E18-12 completed after fixture gate');
  context.assert(backlog.includes('| `WP-E18-13` | P2 | completed'), 'Backlog marks WP-E18-13 completed after release handoff gate');
  context.assert(epic.includes('| `WP-E18-10` | P1 | completed'), 'Epic marks WP-E18-10 completed');
  context.assert(epic.includes('rmt-surface-resource-graph-runtime'), 'Epic gate chain includes surface graph runtime gate');
  context.assert(runner.includes("require('../tests/rmt/rmt_surface_resource_graph_runtime_suite')"), 'Runner imports surface graph runtime suite');
  context.assert(runner.includes("id: 'rmt-surface-resource-graph-runtime'"), 'Runner registers surface graph runtime suite');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:rmt-surface-resource-graph-runtime'] === 'node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime', 'Package exposes surface graph runtime script');
  context.assert(packageManifest.exports && packageManifest.exports['./rmt/surface-resource-graph-runtime'], 'Package exports surface graph runtime');
  context.assert(xtendrmtPackage.exports && xtendrmtPackage.exports['./surface-resource-graph-runtime'], 'XTendRMT package exports surface graph runtime');
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtSurfaceResourceGraphRuntime;
  context.assert(metadata && metadata.schema === RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA, 'Package metadata exposes surface graph runtime schema');
  context.assert(metadata && metadata.localGate === RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_LOCAL_GATE, 'Package metadata exposes surface graph runtime local gate');
  context.assert(metadata && metadata.surfaceKinds.includes('window'), 'Package metadata exposes surface kinds');
  context.assert(metadata && metadata.overlayKinds.includes('dialog'), 'Package metadata exposes overlay kinds');
  context.assert(metadata && metadata.portalPolicies.includes('clipping-escape'), 'Package metadata exposes portal policies');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes WP-E18-11 handoff');

  return context.result({
    schema: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_REPORT_SCHEMA,
    fixture: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE,
    surfaceCapabilityCount: REQUIRED_SURFACE_CAPABILITIES.length,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  });
}

function printRmtSurfaceResourceGraphRuntimeReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 18 RMT Surface Resource Graph Runtime erfolgreich.',
    failureTitle: 'Epic 18 RMT Surface Resource Graph Runtime fehlgeschlagen:'
  });
}

if (require.main === module) {
  runRmtSurfaceResourceGraphRuntimeSuite()
    .then((result) => {
      printRmtSurfaceResourceGraphRuntimeReport(result);
      if (!result.ok) process.exit(1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  printRmtSurfaceResourceGraphRuntimeReport,
  runRmtSurfaceResourceGraphRuntimeSuite
};

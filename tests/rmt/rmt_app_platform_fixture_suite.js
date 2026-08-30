const fs = require('fs');
const os = require('os');
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
  REQUIRED_APP_PLATFORM_BOUNDARIES,
  REQUIRED_ARTIFACTS,
  REQUIRED_DATASOURCE_KINDS,
  REQUIRED_DOCS,
  REQUIRED_DOMAIN_VARIANTS,
  REQUIRED_FIXTURE_CAPABILITIES,
  RMT_APP_PLATFORM_FIXTURE,
  RMT_APP_PLATFORM_FIXTURE_DOCS,
  RMT_APP_PLATFORM_FIXTURE_LOCAL_GATE,
  RMT_APP_PLATFORM_FIXTURE_MODULE,
  RMT_APP_PLATFORM_FIXTURE_PACKAGE_SCRIPT,
  RMT_APP_PLATFORM_FIXTURE_REPORT_SCHEMA,
  RMT_APP_PLATFORM_FIXTURE_SCHEMA,
  RMT_APP_PLATFORM_FIXTURE_SOURCE_SCHEMA,
  RMT_APP_PLATFORM_FIXTURE_STATUS,
  RMT_APP_PLATFORM_FIXTURE_SUITE,
  RMT_APP_PLATFORM_FIXTURE_TARGET,
  RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE,
  RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE_DOC,
  createRmtAppPlatformFixturePlan,
  createRmtAppPlatformFixtureReport,
  validateRmtAppPlatformFixturePlan
} = require('../../catalog/epic18-rmt-app-platform-fixture');
const {
  RMT_APP_PLATFORM_TOOLING_SCHEMA
} = require('../../catalog/epic18-rmt-app-platform-tooling');
const {
  RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA,
  analyzeRmtAppPlatformSource
} = require('../../tools/rmt-language/app-platform-tooling');
const {
  lintRmtSource
} = require('../../tools/rmt-language/diagnostics');
const {
  RMT_APP_PLATFORM_BUILD_REPORT_SCHEMA,
  RMT_APP_PLATFORM_BUILD_SCHEMA,
  createRmtAppPlatformBuild
} = require('../../xtend-builder/generators/rmt-app-platform');

const BACKLOG_PATH = 'development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md';
const EPIC_PATH = 'development/docs-evidence/root/epic18-media-manager-vendor-upstream.md';
const FORBIDDEN_PRODUCT_PATTERNS = /Media\s*Manager|media-manager|mediaManager|MediaRecord|mediaRecord|explorer\.|player\./u;
let runtimeModulesPromise = null;

function loadRuntimeModules(rootDir) {
  if (!runtimeModulesPromise) {
    runtimeModulesPromise = Promise.all([
      import(`file://${resolveRepoPath('xtendrmt/rmt-action-effect-runtime.js', rootDir)}`),
      import(`file://${resolveRepoPath('xtendrmt/rmt-event-routing-runtime.js', rootDir)}`),
      import(`file://${resolveRepoPath('xtendrmt/rmt-state-selector-runtime.js', rootDir)}`),
      import(`file://${resolveRepoPath('xtendrmt/rmt-surface-resource-graph-runtime.js', rootDir)}`),
      import(`file://${resolveRepoPath('xtendrmt/rmt-dom-descriptor-renderer.js', rootDir)}`)
    ]).then(([actionRuntime, eventRuntime, stateRuntime, surfaceRuntime, domRenderer]) => ({
      actionRuntime,
      eventRuntime,
      stateRuntime,
      surfaceRuntime,
      domRenderer
    }));
  }
  return runtimeModulesPromise;
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

function ids(records) {
  return (Array.isArray(records) ? records : []).map((record) => record.id);
}

function createFakeText(text) {
  return {
    nodeType: 3,
    textContent: String(text || ''),
    parentNode: null
  };
}

function createFakeElement(tagName = 'div') {
  const listeners = new Map();
  const attributes = {};
  const element = {
    nodeType: 1,
    tagName: String(tagName || 'div').toUpperCase(),
    attributes,
    childNodes: [],
    children: [],
    parentNode: null,
    style: {
      values: {},
      setProperty(name, value) {
        this.values[name] = String(value);
      }
    },
    appendChild(child) {
      if (child && child.nodeType === 11) {
        child.childNodes.slice().forEach((fragmentChild) => this.appendChild(fragmentChild));
        return child;
      }
      this.childNodes.push(child);
      this.children = this.childNodes.filter((node) => node && node.nodeType === 1);
      if (child) child.parentNode = this;
      return child;
    },
    replaceChildren(...nodes) {
      this.childNodes = [];
      this.children = [];
      nodes.forEach((node) => this.appendChild(node));
    },
    setAttribute(name, value) {
      attributes[String(name)] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, String(name)) ? attributes[String(name)] : null;
    },
    removeAttribute(name) {
      delete attributes[String(name)];
    },
    addEventListener(name, listener) {
      const eventName = String(name);
      const list = listeners.get(eventName) || [];
      list.push(listener);
      listeners.set(eventName, list);
    },
    removeEventListener(name, listener) {
      const eventName = String(name);
      const list = listeners.get(eventName) || [];
      listeners.set(eventName, list.filter((entry) => entry !== listener));
    },
    dispatchEvent(event) {
      const list = listeners.get(String(event.type)) || [];
      list.forEach((listener) => listener(event));
      return true;
    },
    querySelector(selector) {
      if (selector.startsWith('[data-rmt-component="')) {
        const componentId = selector.slice(21, -2);
        return findNode(this, (node) => node.getAttribute && node.getAttribute('data-rmt-component') === componentId);
      }
      if (selector.startsWith('[data-rmt-key="')) {
        const key = selector.slice(15, -2);
        return findNode(this, (node) => node.getAttribute && node.getAttribute('data-rmt-key') === key);
      }
      if (selector.startsWith('[data-rmt-ref="')) {
        const ref = selector.slice(15, -2);
        return findNode(this, (node) => node.getAttribute && node.getAttribute('data-rmt-ref') === ref);
      }
      return null;
    },
    _listeners: listeners
  };
  return element;
}

function createFakeFragment() {
  return {
    nodeType: 11,
    childNodes: [],
    appendChild(child) {
      if (child && child.nodeType === 11) {
        child.childNodes.slice().forEach((fragmentChild) => this.appendChild(fragmentChild));
        return child;
      }
      this.childNodes.push(child);
      if (child) child.parentNode = this;
      return child;
    }
  };
}

function createFakeDocument() {
  return {
    createElement: createFakeElement,
    createTextNode: createFakeText,
    createDocumentFragment: createFakeFragment
  };
}

function findNode(root, predicate) {
  if (predicate(root)) return root;
  for (const child of root.childNodes || []) {
    const match = findNode(child, predicate);
    if (match) return match;
  }
  return null;
}

function textContent(root) {
  if (!root) return '';
  if (root.nodeType === 3) return root.textContent || '';
  return (root.childNodes || []).map(textContent).join('');
}

function createTempRoot(rootDir) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmt-app-platform-fixture-'));
  const sourceDir = path.join(tempRoot, 'tests', 'fixtures');
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.writeFileSync(
    path.join(sourceDir, 'app.rmt'),
    readText(RMT_APP_PLATFORM_FIXTURE, rootDir),
    'utf8'
  );
  fs.writeFileSync(
    path.join(sourceDir, 'app.core.json'),
    readText(RMT_APP_PLATFORM_FIXTURE.replace(/\.rmt$/u, '.core.json'), rootDir),
    'utf8'
  );
  return tempRoot;
}

function runCatalogChecks(context, rootDir) {
  const plan = createRmtAppPlatformFixturePlan();
  const validation = validateRmtAppPlatformFixturePlan(plan);
  const report = createRmtAppPlatformFixtureReport({ plan });

  context.assert(plan.schema === RMT_APP_PLATFORM_FIXTURE_SCHEMA, 'WP12 plan exposes fixture schema');
  context.assert(plan.reportSchema === RMT_APP_PLATFORM_FIXTURE_REPORT_SCHEMA, 'WP12 plan exposes report schema');
  context.assert(plan.fixtureSchema === RMT_APP_PLATFORM_FIXTURE_SOURCE_SCHEMA, 'WP12 plan exposes source fixture schema');
  context.assert(plan.toolingSchema === RMT_APP_PLATFORM_TOOLING_SCHEMA, 'WP12 builds on WP11 tooling schema');
  context.assert(plan.workpackage === RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE, 'WP12 plan belongs to WP-E18-12');
  context.assert(plan.status === RMT_APP_PLATFORM_FIXTURE_STATUS, 'WP12 plan is accepted');
  context.assert(plan.targetReadiness === RMT_APP_PLATFORM_FIXTURE_TARGET, 'WP12 plan targets generic App Platform readiness');
  context.assert(plan.localGate === RMT_APP_PLATFORM_FIXTURE_LOCAL_GATE, 'WP12 plan declares local gate');
  context.assert(plan.packageScript === RMT_APP_PLATFORM_FIXTURE_PACKAGE_SCRIPT, 'WP12 plan declares package script');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'WP12 plan hands off to WP-E18-13');
  context.assert(plan.nextDecision === NEXT_DECISION, 'WP12 plan declares release handoff next decision');
  context.assert(validation.ok, 'WP12 plan validates without errors');
  context.assert(report.ok && report.capabilityCount === REQUIRED_FIXTURE_CAPABILITIES.length, 'WP12 report summarizes required capabilities');
  assertIncludesAll(context, plan.capabilities, REQUIRED_FIXTURE_CAPABILITIES, 'WP12 capabilities');
  assertIncludesAll(context, plan.domainVariants, REQUIRED_DOMAIN_VARIANTS, 'WP12 domain variants');
  assertIncludesAll(context, plan.dataSourceKinds, REQUIRED_DATASOURCE_KINDS, 'WP12 datasource kinds');
  assertIncludesAll(context, plan.boundaries, REQUIRED_APP_PLATFORM_BOUNDARIES, 'WP12 boundaries');
  REQUIRED_ARTIFACTS.concat(REQUIRED_DOCS).forEach((relativePath) => {
    assertFileExists(context, relativePath, rootDir, `${relativePath} exists`);
  });
  [RMT_APP_PLATFORM_FIXTURE_MODULE, RMT_APP_PLATFORM_FIXTURE_SUITE].forEach((relativePath) => {
    const result = syntaxCheckFile(relativePath, { rootDir });
    context.assert(result.ok, `${relativePath} has valid JavaScript syntax`);
  });
}

function runFixtureContractChecks(context, rootDir) {
  const fixture = readJson(RMT_APP_PLATFORM_FIXTURE, rootDir);
  const fixtureText = readText(RMT_APP_PLATFORM_FIXTURE, rootDir);
  const metadata = fixture.manifest.metadata;

  context.assert(fixture.kind === 'rmt_document', 'WP12 fixture is an RMT document');
  context.assert(fixture.schema === RMT_APP_PLATFORM_FIXTURE_SOURCE_SCHEMA, 'WP12 fixture declares source schema');
  context.assert(metadata.contractVersion === RMT_APP_PLATFORM_FIXTURE_SCHEMA, 'WP12 fixture declares fixture contract');
  context.assert(metadata.toolingContract === RMT_APP_PLATFORM_TOOLING_SCHEMA, 'WP12 fixture declares WP11 tooling contract');
  context.assert(metadata.workpackage === RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE, 'WP12 fixture is owned by WP-E18-12');
  context.assert(metadata.manualHtmlRendererAllowed === false, 'WP12 fixture keeps manual HTML disabled');
  context.assert(metadata.productSurfaceTaxonomyAllowed === false, 'WP12 fixture rejects product surface taxonomy');
  context.assert(metadata.fixedRecordContractRequired === false, 'WP12 fixture rejects fixed record contracts');
  context.assert(!FORBIDDEN_PRODUCT_PATTERNS.test(fixtureText), 'WP12 fixture stays product-agnostic');
  context.assert(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/u.test(fixtureText), 'WP12 fixture contains no manual HTML sink');
  context.assert(Object.keys(fixture.records).length >= 3, 'WP12 fixture carries multiple configurable record collections');
  assertIncludesAll(context, metadata.domainVariants, REQUIRED_DOMAIN_VARIANTS, 'WP12 fixture metadata domain variants');
  assertIncludesAll(context, [...new Set(fixture.dataSources.map((source) => source.kind))], REQUIRED_DATASOURCE_KINDS, 'WP12 fixture datasource kinds');
  assertIncludesAll(context, ids(fixture.components), [
    'component.app-shell',
    'component.record-list',
    'component.record-row',
    'component.detail-panel',
    'component.feedback-toast',
    'component.overlay-host'
  ], 'WP12 fixture components');
  assertIncludesAll(context, ids(fixture.surfaces), [
    'surface.workspace',
    'surface.detail-panel',
    'surface.admin-board',
    'surface.content-board',
    'surface.overlay-host'
  ], 'WP12 fixture surfaces');
  assertIncludesAll(context, ids(fixture.overlays), [
    'overlay.toast',
    'overlay.lightbox',
    'overlay.command-menu'
  ], 'WP12 fixture overlays');
  context.assert(fixture.acceptance.configurableRecordContracts === true, 'WP12 acceptance proves configurable records');
  context.assert(fixture.acceptance.listDetailTemplateComposition === true, 'WP12 acceptance proves list/detail templates');
  context.assert(fixture.acceptance.actionFeedbackFlow === true, 'WP12 acceptance proves action feedback');
  context.assert(fixture.acceptance.dynamicSurfaceMaterialization === true, 'WP12 acceptance proves dynamic surfaces');
  context.assert(fixture.acceptance.overlayPortalFlow === true, 'WP12 acceptance proves overlays and portals');
  context.assert(fixture.acceptance.resourceCleanup === true, 'WP12 acceptance proves resource cleanup');
  context.assert(fixture.acceptance.swappableDataSources === true, 'WP12 acceptance proves swappable data sources');
  context.assert(fixture.acceptance.scaffoldBuildEvidence === true, 'WP12 acceptance proves scaffold build evidence');
}

function runAnalysisAndScaffoldChecks(context, rootDir) {
  const fixtureText = readText(RMT_APP_PLATFORM_FIXTURE, rootDir);
  const analysis = analyzeRmtAppPlatformSource({
    text: fixtureText,
    filePath: resolveRepoPath(RMT_APP_PLATFORM_FIXTURE, rootDir)
  }, {
    rootDir
  });
  const lintReport = lintRmtSource({
    text: fixtureText,
    filePath: resolveRepoPath(RMT_APP_PLATFORM_FIXTURE, rootDir)
  }, {
    rootDir
  });
  const tempRoot = createTempRoot(rootDir);
  const dryRun = createRmtAppPlatformBuild({ source: 'tests/fixtures/app.rmt' }, { rootDir: tempRoot });
  const writeRun = createRmtAppPlatformBuild({ source: 'tests/fixtures/app.rmt', write: true }, { rootDir: tempRoot });
  const checkRun = createRmtAppPlatformBuild({ source: 'tests/fixtures/app.rmt', check: true }, { rootDir: tempRoot });

  context.assert(analysis.schema === 'xtend.epic18.rmt-app-platform-tooling-report.v1', 'WP12 analysis uses App Platform tooling report schema');
  context.assert(analysis.status === 'passed' && analysis.ok, 'WP12 fixture passes App Platform analysis');
  context.assert(analysis.summary.errorCount === 0, 'WP12 fixture analysis has no App Platform errors');
  context.assert(analysis.sourceMap.schema === RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA, 'WP12 analysis emits source-map schema');
  context.assert(analysis.sourceMap.totalCount >= 35, 'WP12 fixture produces a broad source map');
  ['surfaces', 'overlays', 'portals', 'resources', 'events', 'actions', 'dataSources', 'state', 'selectors'].forEach((domain) => {
    context.assert(analysis.sourceMap.byDomain[domain] >= 1, `WP12 source map covers ${domain}`);
  });
  context.assert(lintReport.status === 'passed' && lintReport.errorCount === 0, 'Default RMT linter accepts WP12 fixture');
  context.assert(dryRun.schema === RMT_APP_PLATFORM_BUILD_SCHEMA, 'WP12 dry-run build returns build schema');
  context.assert(dryRun.reportSchema === RMT_APP_PLATFORM_BUILD_REPORT_SCHEMA, 'WP12 dry-run build returns build report schema');
  context.assert(dryRun.status === 'planned' && dryRun.ok, 'WP12 dry-run build plans valid fixture');
  context.assert(writeRun.status === 'written' && writeRun.ok, 'WP12 write build writes generated artifacts');
  context.assert(checkRun.status === 'current' && checkRun.ok, 'WP12 check build is current after write');
}

function createRuntimeHarness(fixture, runtimeModules) {
  const resourceEvents = {
    streamsOpened: [],
    streamsClosed: [],
    observersOpened: [],
    observersClosed: [],
    objectUrls: [],
    revokedUrls: [],
    timers: [],
    clearedTimers: [],
    imports: []
  };
  const feedback = [];
  const navigation = [];
  const focus = [];
  const sideEffects = [];
  const stateRuntime = runtimeModules.stateRuntime.createRmtStateSelectorRuntime({
    state: fixture.state,
    selectors: fixture.selectors
  });
  const resourceManager = runtimeModules.actionRuntime.createRmtResourceManager({
    resources: fixture.resources,
    objectUrlFactory: {
      create(source) {
        const url = `blob:rmt-fixture-${resourceEvents.objectUrls.length}`;
        resourceEvents.objectUrls.push({ url, source });
        return url;
      },
      revoke(url) {
        resourceEvents.revokedUrls.push(url);
      }
    },
    timerAdapter: {
      set(delayMs, context) {
        const handle = { delayMs, action: context && context.action && context.action.id };
        resourceEvents.timers.push(handle);
        return handle;
      },
      clear(handle) {
        resourceEvents.clearedTimers.push(handle);
      }
    },
    importAdapter: {
      async load(importId) {
        resourceEvents.imports.push(importId);
        return { importId, loaded: true };
      }
    },
    resourceAdapters: {
      stream: {
        async open(resource) {
          const stream = { id: resource.id, kind: resource.kind, open: true };
          resourceEvents.streamsOpened.push(stream);
          return stream;
        },
        close(stream) {
          resourceEvents.streamsClosed.push(stream);
        }
      },
      observer: {
        async open(resource) {
          const observer = { id: resource.id, kind: resource.kind, open: true };
          resourceEvents.observersOpened.push(observer);
          return observer;
        },
        close(observer) {
          resourceEvents.observersClosed.push(observer);
        }
      }
    }
  });
  const actionRuntime = runtimeModules.actionRuntime.createRmtActionEffectRuntime({
    actions: fixture.actions,
    dataSources: fixture.dataSources,
    effects: fixture.effects,
    resources: fixture.resources,
    stateRuntime: stateRuntime.modelReader,
    modelCommandPort: stateRuntime.modelCommandPort,
    resourceManager,
    feedbackAdapter: {
      publish(entry) {
        feedback.push(entry);
      }
    },
    navigationAdapter: {
      navigate(pathValue) {
        navigation.push(pathValue);
      }
    },
    focusAdapter: {
      focus(target) {
        focus.push(target);
      }
    },
    effectAdapter: {
      invoke(effect, context) {
        sideEffects.push({ effect: effect.id, result: context.result });
      }
    },
    dataSourceAdapters: {
      rest: {
        async fetch(endpoint, options) {
          return {
            endpoint,
            query: options.payload.query,
            items: [
              {
                id: 'gamma',
                title: 'Gamma search result',
                kind: 'record',
                status: 'ready',
                owner: 'remote'
              }
            ]
          };
        }
      },
      'host.record-api': {
        async invoke({ payload }) {
          return {
            record: {
              id: payload.id,
              title: payload.title,
              kind: 'record',
              status: 'saved',
              owner: 'host',
              message: 'Saved'
            }
          };
        }
      }
    }
  });
  const targets = {
    'ref.toolbar': createFakeElement('button'),
    'ref.record-row': createFakeElement('button'),
    'ref.detail-panel': createFakeElement('form'),
    'ref.overlay-host': createFakeElement('button')
  };
  const eventRuntime = runtimeModules.eventRuntime.createRmtEventRoutingRuntime({
    events: fixture.events,
    actionRuntime,
    targets
  });
  const surfaceRuntime = runtimeModules.surfaceRuntime.createRmtSurfaceResourceGraphRuntime({
    surfaces: fixture.surfaces,
    overlays: fixture.overlays,
    portals: fixture.portals,
    resourceManager,
    eventRuntime,
    focusAdapter: {
      focus(instance) {
        focus.push(instance.id || instance);
      }
    },
    persistenceAdapter: {
      snapshot: null,
      save(snapshot) {
        this.snapshot = snapshot;
      },
      load() {
        return this.snapshot;
      }
    }
  });

  return {
    actionRuntime,
    eventRuntime,
    feedback,
    focus,
    navigation,
    resourceEvents,
    resourceManager,
    sideEffects,
    stateRuntime,
    surfaceRuntime,
    targets
  };
}

async function runRuntimeBehaviorChecks(context, fixture, runtimeModules) {
  const harness = createRuntimeHarness(fixture, runtimeModules);
  const attachReport = harness.eventRuntime.attach();
  const materializeReport = harness.surfaceRuntime.materialize({
    'records.generic-items': fixture.records['records.generic-items'],
    'datasource.admin-queue': fixture.records['records.admin-queue'],
    'state.items': fixture.records['records.content-board']
  });

  context.assert(attachReport.attachedCount === fixture.events.length, 'WP12 event runtime attaches declarative events');
  context.assert(materializeReport.createdCount >= 9, 'WP12 surface runtime materializes multiple app variants');
  context.assert(harness.surfaceRuntime.listInstances().some((entry) => entry.id === 'surface.workspace:alpha'), 'WP12 materializes generic workspace instance');
  context.assert(harness.surfaceRuntime.listInstances().some((entry) => entry.id === 'surface.admin-board:job-1'), 'WP12 materializes admin variant with same primitives');
  context.assert(harness.surfaceRuntime.listInstances().some((entry) => entry.id === 'surface.content-board:story-1'), 'WP12 materializes content variant with same primitives');

  const loadResult = await harness.actionRuntime.runAction('action.load-items', { source: 'fixture' }, { ownerId: 'app.load' });
  context.assert(loadResult.status === 'success', 'WP12 fixture action loads fixture records');
  context.assert(harness.stateRuntime.getState('state.items').length === 2, 'WP12 fixture action writes list state');
  context.assert(harness.stateRuntime.select('selector.has-items') === true, 'WP12 selector sees loaded records');
  context.assert(harness.stateRuntime.getSelectorValues()['selector.item-count'] === 2, 'WP12 selector counts loaded records');
  context.assert(harness.feedback.some((entry) => entry.message === 'Records loaded'), 'WP12 feedback effect publishes load message');

  const ssrResult = await harness.actionRuntime.runAction('action.bootstrap-ssr', {}, { ownerId: 'app.bootstrap' });
  context.assert(ssrResult.status === 'success' && harness.stateRuntime.getState('state.items')[0].id === 'bootstrap-1', 'WP12 fixture can swap to SSR datasource');

  const searchResult = await harness.actionRuntime.runAction('action.search', { query: 'ga' }, { ownerId: 'app.search' });
  context.assert(searchResult.status === 'success' && harness.stateRuntime.getState('state.items')[0].id === 'gamma', 'WP12 fixture can swap to REST datasource');

  const selectRoute = await harness.eventRuntime.routeEvent('event.record-select', {
    type: 'click',
    detail: {
      id: 'alpha',
      title: 'Alpha dossier',
      status: 'ready',
      owner: 'team-a'
    },
    target: harness.targets['ref.record-row']
  });
  context.assert(selectRoute.status === 'success', 'WP12 event routes row selection to action');
  context.assert(harness.stateRuntime.getState('state.selected').id === 'alpha', 'WP12 routed action writes selected record');
  context.assert(harness.navigation.length >= 1, 'WP12 routed action triggers navigation effect');

  const saveResult = await harness.actionRuntime.runAction('action.save-record', {
    id: 'alpha',
    title: 'Alpha saved',
    status: 'ready',
    blob: 'preview-bytes'
  }, {
    ownerId: 'surface.workspace:alpha'
  });
  context.assert(saveResult.status === 'success', 'WP12 fixture can swap to host mutation datasource');
  context.assert(harness.stateRuntime.getState('state.feedback').status === 'saved', 'WP12 host mutation writes feedback state');
  context.assert(harness.feedback.some((entry) => entry.message === 'Alpha saved'), 'WP12 save action publishes result-bound feedback');
  context.assert(harness.resourceEvents.objectUrls.length >= 1, 'WP12 action acquired object URL resource');

  const preloadRoute = await harness.eventRuntime.routeEvent('event.open-overlay', {
    type: 'open-overlay',
    detail: {
      id: 'alpha',
      kind: 'detail'
    },
    target: harness.targets['ref.overlay-host']
  });
  context.assert(preloadRoute.status === 'success', 'WP12 overlay event preloads detail resources');
  context.assert(harness.resourceEvents.imports.includes('generic-detail-panel'), 'WP12 lazy import resource is swappable');

  const openSurface = await harness.surfaceRuntime.openSurface('surface.workspace:alpha');
  context.assert(openSurface.state === 'open' && openSurface.resourcesAcquired === true, 'WP12 surface opens and acquires resources');
  const minimized = harness.surfaceRuntime.minimizeSurface('surface.workspace:alpha');
  context.assert(minimized.state === 'minimized' && minimized.resourcesAcquired === true, 'WP12 minimize preserves resources');
  const restored = harness.surfaceRuntime.restoreSurface('surface.workspace:alpha');
  context.assert(restored.state === 'open', 'WP12 surface restores after minimize');
  const overlay = await harness.surfaceRuntime.openOverlay('overlay.lightbox', {
    ownerId: 'surface.workspace:alpha',
    payload: {
      id: 'alpha',
      blob: 'overlay-preview'
    }
  });
  context.assert(overlay.state === 'open' && overlay.portal === 'portal.overlay', 'WP12 overlay opens in portal');
  const closeOverlay = harness.surfaceRuntime.closeTopOverlay({ reason: 'escape' });
  context.assert(closeOverlay.closed === true, 'WP12 overlay closes by portal stack policy');
  context.assert(harness.resourceManager.listDisposals().some((entry) => entry.resourceId === 'resource.detail-url'), 'WP12 overlay releases resources on close');

  const snapshot = harness.surfaceRuntime.persistSnapshot();
  context.assert(snapshot.surfaces.length >= 9, 'WP12 surface runtime persists multi-surface snapshot');
  const destroyed = harness.surfaceRuntime.destroySurface('surface.workspace:alpha', { reason: 'test-cleanup' });
  context.assert(destroyed.state === 'destroyed', 'WP12 surface destroy marks instance destroyed');
  context.assert(harness.resourceManager.listDisposals().some((entry) => entry.owner === 'surface.workspace:alpha'), 'WP12 destroy releases surface-owned resources');
  context.assert(harness.resourceEvents.revokedUrls.length >= 1, 'WP12 object URLs are revoked during cleanup');
  context.assert(!harness.eventRuntime.listAttached().some((entry) => entry.owner === 'surface.workspace:alpha'), 'WP12 destroy detaches surface-owned events');
}

function runRendererChecks(context, fixture, runtimeModules) {
  const documentTarget = createFakeDocument();
  const events = [];
  const componentRegistry = {
    resolveComponentCapability(tag) {
      return tag === 'x-record-row'
        ? { tag, allowedProperties: ['value'] }
        : null;
    }
  };
  const renderer = runtimeModules.domRenderer.createRmtDomDescriptorRenderer({
    documentTarget,
    componentRegistry
  });
  const root = documentTarget.createElement('main');
  const templates = indexById(fixture.templates);
  const shellTemplate = templates.get('template.app-shell');
  const renderResult = renderer.render(root, shellTemplate.root, {
    components: fixture.components,
    componentRegistry,
    templates: fixture.templates,
    slots: fixture.extensionSlots,
    model: {
      hasItems: true,
      items: fixture.records['records.generic-items'],
      selected: {
        title: 'Alpha dossier'
      },
      feedback: {
        message: 'Records loaded'
      }
    },
    dispatchEvent(event) {
      events.push(event);
    }
  });
  const row = root.querySelector('[data-rmt-component="component.record-row"]');
  context.assert(renderResult.schema === 'xtend.epic18.rmt-dom-render-result.v1', 'WP12 renderer emits render result schema');
  context.assert(root.getAttribute('data-rmt-rendered-shell') === 'true', 'WP12 renderer marks rendered shell');
  context.assert(textContent(root).includes('Alpha dossier') && textContent(root).includes('Beta brief'), 'WP12 renderer renders generic record list');
  context.assert(row && row.getAttribute('data-rmt-key') === 'alpha', 'WP12 renderer applies stable repeat key');
  context.assert(row && row.value === 'alpha', 'WP12 renderer applies component property without HTML strings');
  row.dispatchEvent({ type: 'click', detail: { id: 'alpha' } });
  const rowBinding = renderResult.bindings.find((binding) => binding.target === row && binding.event === 'click');
  context.assert(
    events.length === 0
      && !row._listeners.has('click')
      && rowBinding
      && rowBinding.command === 'event.record-select',
    'WP12 renderer returns the declarative event binding for the Event Router'
  );

  const gate = runtimeModules.domRenderer.createNoManualHtmlGate();
  context.assert(gate.scanText(JSON.stringify(fixture), { filePath: RMT_APP_PLATFORM_FIXTURE }).length === 0, 'WP12 No-Manual-HTML gate accepts fixture');
}

function runPackagingAndDocsChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const runnerText = readText('scripts/run_xtend_tests.js', rootDir);
  const docsMenuText = readText('docs/menu.json', rootDir);
  const docsText = readText(RMT_APP_PLATFORM_FIXTURE_DOCS, rootDir);
  const wpText = readText(RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE_DOC, rootDir);
  const backlogText = readText(BACKLOG_PATH, rootDir);
  const epicText = readText(EPIC_PATH, rootDir);
  const packageMetadata = packageManifest.xtend && packageManifest.xtend.rmtAppPlatformFixture;

  context.assert(packageManifest.scripts['test:rmt-app-platform-fixture'] === 'node scripts/run_xtend_tests.js rmt-app-platform-fixture', 'Package script wires WP12 suite');
  context.assert(packageMetadata && packageMetadata.schema === RMT_APP_PLATFORM_FIXTURE_SCHEMA, 'Package metadata exposes WP12 schema');
  context.assert(packageMetadata && packageMetadata.localGate === RMT_APP_PLATFORM_FIXTURE_LOCAL_GATE, 'Package metadata exposes WP12 gate');
  context.assert(packageMetadata && packageMetadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes WP13 handoff');
  assertIncludesAll(context, packageMetadata.domainVariants, REQUIRED_DOMAIN_VARIANTS, 'Package metadata domain variants');
  assertIncludesAll(context, packageMetadata.dataSourceKinds, REQUIRED_DATASOURCE_KINDS, 'Package metadata datasource kinds');
  context.assert(runnerText.includes('runRmtAppPlatformFixtureSuite'), 'Runner imports WP12 suite');
  context.assert(runnerText.includes("id: 'rmt-app-platform-fixture'"), 'Runner registers WP12 suite id');
  context.assert(docsMenuText.includes('"slug": "rmt-app-platform-fixture"'), 'Docs menu includes WP12 page');
  assertTextIncludesAll(context, docsText, [
    '# RMT App Platform Fixture',
    RMT_APP_PLATFORM_FIXTURE_SCHEMA,
    RMT_APP_PLATFORM_FIXTURE_LOCAL_GATE,
    'generic-catalog',
    'admin-queue',
    'content-board',
    'innerHTML'
  ], 'WP12 docs');
  assertTextIncludesAll(context, wpText, [
    RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE,
    RMT_APP_PLATFORM_FIXTURE_LOCAL_GATE,
    'Status: `completed`',
    NEXT_WORKPACKAGE
  ], 'WP12 workpackage doc');
  assertTextIncludesAll(context, backlogText, [
    '| `WP-E18-12` | P1 | completed |',
    '| `WP-E18-13` | P2 | completed |',
    RMT_APP_PLATFORM_FIXTURE_LOCAL_GATE
  ], 'Epic18 backlog');
  assertTextIncludesAll(context, epicText, [
    '| `WP-E18-12` | P1 | completed |',
    '| `WP-E18-13` | P2 | completed |',
    RMT_APP_PLATFORM_FIXTURE_LOCAL_GATE
  ], 'Epic18 document');
}

async function runRmtAppPlatformFixtureSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'rmt-app-platform-fixture',
    label: 'Epic 18 RMT App Platform Fixture'
  });
  const fixture = readJson(RMT_APP_PLATFORM_FIXTURE, rootDir);
  const runtimeModules = await loadRuntimeModules(rootDir);

  runCatalogChecks(context, rootDir);
  runFixtureContractChecks(context, rootDir);
  runAnalysisAndScaffoldChecks(context, rootDir);
  await runRuntimeBehaviorChecks(context, fixture, runtimeModules);
  runRendererChecks(context, fixture, runtimeModules);
  runPackagingAndDocsChecks(context, rootDir);

  return context.result({
    report: createRmtAppPlatformFixtureReport(),
    fixture: RMT_APP_PLATFORM_FIXTURE,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  });
}

function printRmtAppPlatformFixtureReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 18 RMT App Platform Fixture Gate erfolgreich.',
    failureTitle: 'Epic 18 RMT App Platform Fixture Gate fehlgeschlagen:'
  });
}

if (require.main === module) {
  runRmtAppPlatformFixtureSuite()
    .then((result) => {
      printRmtAppPlatformFixtureReport(result);
      process.exit(result.ok ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  printRmtAppPlatformFixtureReport,
  runRmtAppPlatformFixtureSuite
};

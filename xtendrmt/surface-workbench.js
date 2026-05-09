(function attachXtendSurfaceWorkbench(global) {
  const DEFAULT_DOCUMENT_URL = 'xtendrmt/surface-workbench.rmt';
  const WORKBENCH_CONTRACT = 'xtend.surface.workbench-fixture.v1';
  const SURFACE_COMMAND_EVENTS = ['surface-window-command', 'surface-panel-command'];

  function getCreateRmtFormat() {
    return global.AppModules && typeof global.AppModules.createRmtFormat === 'function'
      ? global.AppModules.createRmtFormat
      : null;
  }

  function createIndex(records) {
    return new Map((Array.isArray(records) ? records : []).map((record) => [record.id, record]));
  }

  function createRegistries(rmtDocument) {
    const factory = getCreateRmtFormat();
    if (factory) {
      const rmtFormat = factory();
      return {
        normalizedDocument: rmtFormat.normalizeDocument(rmtDocument),
        runtimeRegistries: rmtFormat.createRuntimeRegistries(rmtDocument)
      };
    }

    return {
      normalizedDocument: rmtDocument,
      runtimeRegistries: {
        status: 'ready',
        componentRegistry: { ids: (rmtDocument.components || []).map((component) => component.id) },
        routeRegistry: { ids: (rmtDocument.routes || []).map((route) => route.id) },
        scheduleRegistry: { ids: (rmtDocument.schedules || []).map((schedule) => schedule.id) },
        templateRegistry: { ids: (rmtDocument.templates || []).map((template) => template.id) }
      }
    };
  }

  function applyAttributes(element, attributes) {
    Object.entries(attributes || {}).forEach(([name, value]) => {
      if (value === false || value === null || typeof value === 'undefined') return;
      element.setAttribute(name, value === true ? '' : String(value));
    });
  }

  function applyProps(element, props) {
    Object.entries(props || {}).forEach(([name, value]) => {
      try {
        element[name] = value;
      } catch (_) {
        element.setAttribute(name, String(value));
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        element.setAttribute(name, String(value));
      }
    });
  }

  function applyEvents(element, events, context) {
    Object.entries(events || {}).forEach(([eventName, eventRecord]) => {
      const command = typeof eventRecord === 'string' ? eventRecord : eventRecord && eventRecord.command;
      if (!command) return;
      element.addEventListener(eventName, (event) => {
        context.telemetry.push({
          type: 'rmt.command',
          contract: WORKBENCH_CONTRACT,
          command,
          componentId: element.getAttribute('data-rmt-component') || element.getAttribute('data-rmt-node') || null,
          eventName,
          detail: event.detail || null,
          timestamp: Date.now()
        });
      });
    });
  }

  function appendChildren(element, children, context) {
    (children || []).forEach((child) => {
      element.appendChild(renderDomDescriptor(child, context));
    });
  }

  function createTextNode(text) {
    return document.createTextNode(String(text || ''));
  }

  function renderTemplate(templateId, context) {
    const template = context.templates.get(templateId);
    const fragment = document.createDocumentFragment();
    if (!template) return fragment;
    (template.nodes || []).forEach((node) => {
      fragment.appendChild(renderDomDescriptor(node, context));
    });
    return fragment;
  }

  function mirrorSurfaceMetadata(element, component) {
    const metadata = component.metadata || {};
    if (metadata.surfaceManager) {
      element.setAttribute('data-surface-manager-schema', metadata.surfaceManager.schema || '');
      element.setAttribute('data-surface-snapshot-key', metadata.surfaceManager.snapshotKey || 'xtend.surface.snapshot');
    }
    if (metadata.surface) {
      element.setAttribute('data-surface-type', metadata.surface.type || '');
      element.setAttribute('data-surface-manager', metadata.surface.manager || '');
      element.setAttribute('data-surface-state-key', metadata.surface.stateKey || '');
      if (metadata.surface.route) {
        element.setAttribute('data-route-bound', metadata.surface.route);
      }
    }
  }

  function renderComponentRecord(componentId, context) {
    const component = context.components.get(componentId);
    if (!component) {
      const missing = document.createElement('x-status');
      missing.setAttribute('type', 'warning');
      missing.setAttribute('message', `Missing RMT component ${componentId}`);
      return missing;
    }

    const element = document.createElement(component.tag);
    element.setAttribute('data-rmt-component', component.id);
    element.setAttribute('data-rmt-schedule', component.schedule || '');
    element.setAttribute('data-rmt-adapter', component.adapter || '');
    const fabric = component.metadata && component.metadata.fabric;
    if (fabric) {
      element.setAttribute('data-fabric-lane', fabric.lane || '');
      element.setAttribute('data-fabric-fiber', fabric.fiber || '');
    }
    mirrorSurfaceMetadata(element, component);
    applyAttributes(element, component.attributes);
    applyProps(element, component.props);
    applyEvents(element, component.events, context);

    Object.entries(component.slots || {}).forEach(([slotName, slotRecord]) => {
      const slotContainer = document.createElement('div');
      if (slotName !== 'default') {
        slotContainer.setAttribute('slot', slotName);
      }
      slotContainer.setAttribute('data-rmt-slot', slotName);
      if (slotRecord.template) {
        slotContainer.appendChild(renderTemplate(slotRecord.template, context));
      }
      if (slotRecord.component) {
        slotContainer.appendChild(renderComponentRecord(slotRecord.component, context));
      }
      if (Array.isArray(slotRecord.components)) {
        slotRecord.components.forEach((childComponentId) => {
          slotContainer.appendChild(renderComponentRecord(childComponentId, context));
        });
      }
      if (typeof slotRecord.text === 'string') {
        slotContainer.appendChild(createTextNode(slotRecord.text));
      }
      element.appendChild(slotContainer);
    });

    return element;
  }

  function renderDomDescriptor(node, context) {
    if (!node) return document.createDocumentFragment();
    if (node.component) return renderComponentRecord(node.component, context);
    if (node.template) return renderTemplate(node.template, context);
    if (Object.prototype.hasOwnProperty.call(node, 'text') && !node.tag) return createTextNode(node.text);

    const element = document.createElement(node.tag || 'div');
    element.setAttribute('data-rmt-node', node.tag || 'fragment');
    applyAttributes(element, node.attributes);
    applyProps(element, node.props);
    applyEvents(element, node.events, context);
    if (Object.prototype.hasOwnProperty.call(node, 'text')) {
      element.appendChild(createTextNode(node.text));
    }
    appendChildren(element, node.children, context);
    return element;
  }

  function createRouteElement(route, context) {
    const routeElement = document.createElement('x-route');
    routeElement.setAttribute('path', route.path);
    routeElement.setAttribute('data-rmt-route', route.id);
    routeElement.setAttribute('data-rmt-schedule', route.schedule);
    routeElement.setAttribute('data-rmt-surface-manager', route.metadata && route.metadata.surfaceManager ? route.metadata.surfaceManager : '');
    routeElement.appendChild(renderComponentRecord(route.component, context));
    return routeElement;
  }

  function attachRoutesFromDocument(root, context) {
    const router = root.querySelector('[data-rmt-component="app.router"]');
    if (!router) return [];
    const routeElements = context.document.routes.map((route) => createRouteElement(route, context));
    routeElements.forEach((routeElement) => router.appendChild(routeElement));
    if (typeof router.registerRoutes === 'function') {
      router.registerRoutes(context.document.routes, { source: 'surface-workbench' });
    }
    return routeElements;
  }

  function createRenderContext(rmtDocument) {
    const { normalizedDocument, runtimeRegistries } = createRegistries(rmtDocument);
    return {
      document: normalizedDocument,
      runtimeRegistries,
      adapters: createIndex(normalizedDocument.adapters),
      components: createIndex(normalizedDocument.components),
      routes: createIndex(normalizedDocument.routes),
      schedules: createIndex(normalizedDocument.schedules),
      templates: createIndex(normalizedDocument.templates),
      telemetry: []
    };
  }

  function collectSurfaceSnapshot(root) {
    const manager = root.querySelector('x-surface-manager');
    const fallbackSurfaces = Array.from(root.querySelectorAll('x-surface-window, x-side-panel')).map((surface) => ({
      id: surface.getAttribute('surface-id'),
      type: surface.localName === 'x-side-panel' ? 'side-panel' : 'window',
      open: surface.hasAttribute('open'),
      active: surface.hasAttribute('active'),
      route: surface.getAttribute('data-route-bound') || null
    }));

    if (manager && typeof manager.snapshot === 'function') {
      const snapshot = manager.snapshot();
      return {
        schema: 'xtend.surface.snapshot.v1',
        source: 'x-surface-manager',
        managerId: manager.getAttribute('manager-id') || 'workbench.manager',
        snapshot,
        surfaces: Array.isArray(snapshot && snapshot.surfaces) ? snapshot.surfaces : fallbackSurfaces
      };
    }

    return {
      schema: 'xtend.surface.snapshot.v1',
      source: 'dom-fallback',
      managerId: manager ? manager.getAttribute('manager-id') || 'workbench.manager' : 'workbench.manager',
      snapshot: null,
      surfaces: fallbackSurfaces
    };
  }

  function renderSurfaceWorkbenchFromDocument(rmtDocument, options = {}) {
    const root = options.root || document.querySelector('[data-rmt-host="surface-workbench"]');
    if (!root) {
      throw new Error('Surface Workbench root not found');
    }
    const context = createRenderContext(rmtDocument);
    const shellTemplateId = options.shellTemplateId || 'app.shell.template';
    const shellFragment = renderTemplate(shellTemplateId, context);
    root.replaceChildren(shellFragment);
    root.setAttribute('data-rmt-rendered-shell', 'true');
    root.setAttribute('data-rmt-document', rmtDocument.manifest.documentId);
    root.setAttribute('data-rmt-contract', WORKBENCH_CONTRACT);
    const routes = attachRoutesFromDocument(root, context);
    const snapshot = collectSurfaceSnapshot(root);
    context.telemetry.push({
      type: 'rmt.surface-workbench.rendered',
      contract: WORKBENCH_CONTRACT,
      routes: routes.length,
      surfaces: snapshot.surfaces.length,
      commandEvents: SURFACE_COMMAND_EVENTS.slice(),
      schedules: context.document.schedules.length,
      timestamp: Date.now()
    });
    return {
      root,
      context,
      routes,
      snapshot,
      registries: context.runtimeRegistries
    };
  }

  async function loadRmtDocument(documentUrl) {
    const response = await fetch(documentUrl, { credentials: 'same-origin' });
    if (!response.ok) {
      throw new Error(`Surface Workbench document failed to load: ${response.status}`);
    }
    const documentText = await response.text();
    const factory = getCreateRmtFormat();
    if (factory) {
      return factory().parseDocument(documentText, { sourceUrl: documentUrl });
    }
    return JSON.parse(documentText);
  }

  async function bootSurfaceWorkbench(options = {}) {
    const root = options.root || document.querySelector('[data-rmt-host="surface-workbench"]');
    const documentUrl = options.documentUrl || (root && root.getAttribute('data-rmt-document-src')) || DEFAULT_DOCUMENT_URL;
    const loaderPromise = global.__XTendLoaderBootPromise || Promise.resolve();
    await loaderPromise.catch(() => {});
    const rmtDocument = await loadRmtDocument(documentUrl);
    const renderResult = renderSurfaceWorkbenchFromDocument(rmtDocument, { root });
    global.__XTendSurfaceWorkbenchResult = {
      status: 'passed',
      contract: WORKBENCH_CONTRACT,
      documentId: rmtDocument.manifest.documentId,
      routes: renderResult.routes.length,
      surfaces: renderResult.snapshot.surfaces.length,
      schedules: rmtDocument.schedules.length,
      telemetry: renderResult.context.telemetry.length
    };
    return renderResult;
  }

  global.XTendSurfaceWorkbench = {
    contract: WORKBENCH_CONTRACT,
    bootSurfaceWorkbench,
    collectSurfaceSnapshot,
    loadRmtDocument,
    renderDomDescriptor,
    renderSurfaceWorkbenchFromDocument
  };
})(window);

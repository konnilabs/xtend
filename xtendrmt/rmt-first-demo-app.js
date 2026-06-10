(function attachXtendRmtFirstDemo(global) {
  const DEFAULT_DOCUMENT_URL = 'xtendrmt/rmt-first-demo-app.core.json';
  const DEMO_CONTRACT = 'xtend.epic10.rmt-first-demo-app.v1';

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

  function appendChildren(element, children, context) {
    (children || []).forEach((child) => {
      element.appendChild(renderDomDescriptor(child, context));
    });
  }

  function applyAttributes(element, attributes) {
    Object.entries(attributes || {}).forEach(([name, value]) => {
      if (value === false || value === null || typeof value === 'undefined') {
        return;
      }
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
      element.addEventListener(eventName, (event) => {
        context.telemetry.push({
          type: 'rmt.command',
          command: eventRecord.command,
          componentId: element.getAttribute('data-rmt-component'),
          eventName,
          detail: event.detail || null,
          timestamp: Date.now()
        });
      });
    });
  }

  function createTextNode(text) {
    return document.createTextNode(String(text || ''));
  }

  function renderTemplate(templateId, context) {
    const template = context.templates.get(templateId);
    const fragment = document.createDocumentFragment();
    if (!template) {
      return fragment;
    }
    (template.nodes || []).forEach((node) => {
      fragment.appendChild(renderDomDescriptor(node, context));
    });
    return fragment;
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
    applyAttributes(element, component.attributes);
    applyProps(element, component.props);
    applyEvents(element, component.events, context);

    Object.entries(component.slots || {}).forEach(([slotName, slotRecord]) => {
      const slotContainer = document.createElement('div');
      if (slotName !== 'default') {
        slotContainer.setAttribute('slot', slotName);
      }
      if (slotRecord.template) {
        slotContainer.appendChild(renderTemplate(slotRecord.template, context));
      }
      if (slotRecord.component) {
        slotContainer.appendChild(renderComponentRecord(slotRecord.component, context));
      }
      if (typeof slotRecord.text === 'string') {
        slotContainer.appendChild(createTextNode(slotRecord.text));
      }
      element.appendChild(slotContainer);
    });

    return element;
  }

  function renderDomDescriptor(node, context) {
    if (!node) {
      return document.createDocumentFragment();
    }
    if (node.component) {
      return renderComponentRecord(node.component, context);
    }
    if (node.template) {
      return renderTemplate(node.template, context);
    }
    if (Object.prototype.hasOwnProperty.call(node, 'text') && !node.tag) {
      return createTextNode(node.text);
    }

    const element = document.createElement(node.tag || 'div');
    applyAttributes(element, node.attributes);
    applyProps(element, node.props);
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
    routeElement.appendChild(renderComponentRecord(route.component, context));
    return routeElement;
  }

  function attachRoutesFromDocument(root, context) {
    const router = root.querySelector('[data-rmt-component="app.router"]');
    if (!router) {
      return [];
    }
    const routeElements = context.document.routes.map((route) => createRouteElement(route, context));
    routeElements.forEach((routeElement) => {
      router.appendChild(routeElement);
    });
    if (typeof router.registerRoutes === 'function') {
      router.registerRoutes(context.document.routes, { source: 'rmt-first-demo' });
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

  function renderRmtShellFromDocument(rmtDocument, options = {}) {
    const root = options.root || document.querySelector('[data-rmt-host="rmt-first-demo"]');
    if (!root) {
      throw new Error('RMT-first demo root not found');
    }
    const context = createRenderContext(rmtDocument);
    const shellTemplateId = options.shellTemplateId || 'app.shell.template';
    const shellFragment = renderTemplate(shellTemplateId, context);
    root.replaceChildren(shellFragment);
    root.setAttribute('data-rmt-rendered-shell', 'true');
    root.setAttribute('data-rmt-document', rmtDocument.manifest.documentId);
    const routeElements = attachRoutesFromDocument(root, context);
    context.telemetry.push({
      type: 'rmt.shell.rendered',
      contract: DEMO_CONTRACT,
      routes: routeElements.length,
      schedules: context.document.schedules.length,
      timestamp: Date.now()
    });
    return {
      root,
      context,
      routes: routeElements,
      registries: context.runtimeRegistries
    };
  }

  async function loadRmtDocument(documentUrl) {
    const response = await fetch(documentUrl, { credentials: 'same-origin' });
    if (!response.ok) {
      throw new Error(`RMT-first demo document failed to load: ${response.status}`);
    }
    return response.json();
  }

  async function bootRmtFirstDemo(options = {}) {
    const root = options.root || document.querySelector('[data-rmt-host="rmt-first-demo"]');
    const documentUrl = options.documentUrl || (root && root.getAttribute('data-rmt-document-src')) || DEFAULT_DOCUMENT_URL;
    const loaderPromise = global.__XTendLoaderBootPromise || Promise.resolve();
    await loaderPromise.catch(() => {});
    const rmtDocument = await loadRmtDocument(documentUrl);
    const renderResult = renderRmtShellFromDocument(rmtDocument, { root });
    global.__XTendRmtFirstDemoResult = {
      status: 'passed',
      contract: DEMO_CONTRACT,
      documentId: rmtDocument.manifest.documentId,
      routes: renderResult.routes.length,
      schedules: rmtDocument.schedules.length,
      telemetry: renderResult.context.telemetry.length
    };
    return renderResult;
  }

  global.XTendRmtFirstDemo = {
    contract: DEMO_CONTRACT,
    bootRmtFirstDemo,
    loadRmtDocument,
    renderDomDescriptor,
    renderRmtShellFromDocument
  };
})(window);

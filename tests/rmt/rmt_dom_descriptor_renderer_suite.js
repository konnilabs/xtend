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
  FORBIDDEN_NORMAL_UI_SINKS,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  NO_MANUAL_HTML_GATE_SCHEMA,
  REQUIRED_ARTIFACTS,
  REQUIRED_BOUNDARIES,
  REQUIRED_DOCS,
  REQUIRED_RENDER_OPERATIONS,
  RMT_DOM_DESCRIPTOR_RENDERER_DOCS,
  RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE,
  RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE_SCHEMA,
  RMT_DOM_DESCRIPTOR_RENDERER_LOCAL_GATE,
  RMT_DOM_DESCRIPTOR_RENDERER_MODULE,
  RMT_DOM_DESCRIPTOR_RENDERER_PACKAGE_SCRIPT,
  RMT_DOM_DESCRIPTOR_RENDERER_REPORT_SCHEMA,
  RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME,
  RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
  RMT_DOM_DESCRIPTOR_RENDERER_STATUS,
  RMT_DOM_DESCRIPTOR_RENDERER_SUITE,
  RMT_DOM_DESCRIPTOR_RENDERER_TARGET,
  RMT_DOM_DESCRIPTOR_RENDERER_TYPES,
  RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE,
  RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE_DOC,
  RMT_DOM_RENDERER_DIAGNOSTIC_SCHEMA,
  TRUSTED_DOM_BOUNDARY,
  createRmtDomDescriptorRendererPlan,
  createRmtDomDescriptorRendererReport,
  validateRmtDomDescriptorRendererPlan
} = require('../../catalog/epic18-rmt-dom-descriptor-renderer');
const {
  RMT_APP_PLATFORM_AUTHORING_SCHEMA
} = require('../../catalog/epic18-rmt-app-platform-authoring');
let rendererModulePromise = null;

function loadRendererModule(rootDir) {
  if (!rendererModulePromise) {
    rendererModulePromise = import(`file://${resolveRepoPath('xtendrmt/rmt-dom-descriptor-renderer.js', rootDir)}`);
  }
  return rendererModulePromise;
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
  const normalizedTagName = String(tagName || 'div');
  const element = {
    nodeType: 1,
    tagName: normalizedTagName.toUpperCase(),
    localName: normalizedTagName.toLowerCase(),
    attributes,
    childNodes: [],
    children: [],
    parentNode: null,
    namespaceURI: 'http://www.w3.org/1999/xhtml',
    _mutationCount: 0,
    style: {
      values: {},
      setProperty(name, value) {
        this.values[name] = String(value);
      },
      getPropertyValue(name) {
        return Object.prototype.hasOwnProperty.call(this.values, name) ? this.values[name] : '';
      },
      removeProperty(name) {
        const previous = this.getPropertyValue(name);
        delete this.values[name];
        return previous;
      }
    },
    appendChild(child) {
      if (child && child.nodeType === 11) {
        child.childNodes.slice().forEach((fragmentChild) => this.appendChild(fragmentChild));
        return child;
      }
      if (child && child.parentNode && child.parentNode !== this && typeof child.parentNode.removeChild === 'function') {
        child.parentNode.removeChild(child);
      } else if (child && child.parentNode === this) {
        const existingIndex = this.childNodes.indexOf(child);
        if (existingIndex >= 0) this.childNodes.splice(existingIndex, 1);
      }
      this.childNodes.push(child);
      this.children = this.childNodes.filter((node) => node && node.nodeType === 1);
      if (child) child.parentNode = this;
      this._mutationCount += 1;
      return child;
    },
    insertBefore(child, reference) {
      if (!reference) return this.appendChild(child);
      if (child && child.parentNode && typeof child.parentNode.removeChild === 'function') {
        child.parentNode.removeChild(child);
      }
      const index = this.childNodes.indexOf(reference);
      if (index < 0) return this.appendChild(child);
      this.childNodes.splice(index, 0, child);
      this.children = this.childNodes.filter((node) => node && node.nodeType === 1);
      if (child) child.parentNode = this;
      this._mutationCount += 1;
      return child;
    },
    removeChild(child) {
      const index = this.childNodes.indexOf(child);
      if (index < 0) return child;
      this.childNodes.splice(index, 1);
      this.children = this.childNodes.filter((node) => node && node.nodeType === 1);
      if (child) child.parentNode = null;
      this._mutationCount += 1;
      return child;
    },
    replaceChildren(...nodes) {
      this.childNodes.forEach((node) => {
        if (node) node.parentNode = null;
      });
      this.childNodes = [];
      this.children = [];
      nodes.forEach((node) => this.appendChild(node));
      this._mutationCount += 1;
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
      if (!listeners.has(eventName)) listeners.set(eventName, new Set());
      listeners.get(eventName).add(listener);
    },
    removeEventListener(name, listener) {
      const eventName = String(name);
      const eventListeners = listeners.get(eventName);
      if (!eventListeners) return;
      eventListeners.delete(listener);
      if (eventListeners.size === 0) listeners.delete(eventName);
    },
    dispatchEvent(event) {
      const eventListeners = listeners.get(String(event.type));
      if (eventListeners) Array.from(eventListeners).forEach((listener) => listener(event));
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
      return null;
    },
    _listeners: listeners
  };
  if (element.localName === 'template') element.content = createFakeFragment();
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
    createElementNS(namespaceURI, tagName) {
      const element = createFakeElement(tagName);
      element.namespaceURI = namespaceURI;
      return element;
    },
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

function indexById(records) {
  return new Map((Array.isArray(records) ? records : []).map((record) => [record.id, record]));
}

function assertFixtureGraph(context, fixture) {
  const templates = indexById(fixture.templates);
  const components = indexById(fixture.components);
  const slots = indexById(fixture.slots);
  const resources = indexById(fixture.resources);
  (fixture.renderUnits || []).forEach((unit) => {
    context.assert(templates.has(unit.template), `${unit.id}: template resolves`);
    context.assert(['replace_children', 'keyed_children'].includes(unit.ownershipMode), `${unit.id}: ownership mode is renderer-supported`);
  });
  (fixture.templates || []).forEach((template) => {
    context.assert(template.renderMode === 'dom_descriptor' || template.renderMode === 'trusted_html', `${template.id}: render mode is explicit`);
    if (template.renderMode === 'trusted_html') {
      context.assert(template.trustedBoundary === TRUSTED_DOM_BOUNDARY, `${template.id}: trusted boundary resolves`);
      context.assert(resources.has(template.resource), `${template.id}: trusted resource resolves`);
    }
  });
  (fixture.components || []).forEach((component) => {
    context.assert(component.tag && /^[a-z][a-z0-9.-]*$/u.test(component.tag), `${component.id}: component has safe tag`);
  });
  (fixture.slots || []).forEach((slot) => {
    context.assert(templates.has(slot.owner), `${slot.id}: owner template resolves`);
    context.assert(templates.has(slot.template), `${slot.id}: slot template resolves`);
  });
  const fixtureText = JSON.stringify(fixture);
  context.assert(!/Media\s*Manager|media-manager|mediaManager|MediaRecord|mediaRecord|explorer\.|player\./u.test(fixtureText), 'renderer fixture stays product-agnostic');
  FORBIDDEN_NORMAL_UI_SINKS.forEach((sink) => {
    context.assert(!fixtureText.includes(sink), `renderer fixture does not contain ${sink}`);
  });
}

function createRendererFixtureHarness(fixture, rendererModule) {
  const documentTarget = createFakeDocument();
  const diagnosticsHub = {
    entries: [],
    publish(channel, payload, meta) {
      this.entries.push({ channel, payload, meta });
    }
  };
  const events = [];
  const components = fixture.components;
  const componentRegistry = {
    resolveComponentCapability(tag) {
      const component = components.find((entry) => entry.tag === tag);
      if (!component) return null;
      return {
        tag,
        allowedProperties: tag === 'x-card' ? ['value'] : []
      };
    }
  };
  const renderer = rendererModule.createRmtDomDescriptorRenderer({
    documentTarget,
    diagnosticsHub,
    componentRegistry
  });
  const templates = fixture.templates;
  const slots = fixture.slots;
  return {
    documentTarget,
    diagnosticsHub,
    events,
    renderer,
    renderOptions: {
      components,
      componentRegistry,
      templates,
      slots,
      model: {
        hasItems: true,
        items: [
          { id: 'a', title: 'Alpha', kind: 'task' },
          { id: 'b', title: 'Beta', kind: 'note' }
        ]
      },
      dispatchEvent(event) {
        events.push(event);
      },
      source: {
        documentId: fixture.manifest.id,
        templateId: 'template.shell',
        pointer: '/templates/0/root'
      }
    }
  };
}

function runRendererBehaviorAssertions(context, fixture, rendererModule) {
  const harness = createRendererFixtureHarness(fixture, rendererModule);
  const root = harness.documentTarget.createElement('main');
  const shellTemplate = indexById(fixture.templates).get('template.shell');
  const result = harness.renderer.render(root, shellTemplate.root, harness.renderOptions);
  context.assert(result.schema === 'xtend.epic18.rmt-dom-render-result.v1', 'renderer emits render result schema');
  context.assert(root.getAttribute('data-rmt-rendered-shell') === 'true', 'renderer marks rendered shell');
  context.assert(root.getAttribute('data-rmt-renderer-schema') === RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA, 'renderer marks schema on root');
  const shell = root.querySelector('[data-rmt-component="component.shell"]');
  context.assert(shell && shell.tagName === 'X-SECTION', 'renderer creates XTend shell component');
  context.assert(textContent(root).includes('Alpha') && textContent(root).includes('Beta'), 'renderer renders repeated generic records as text nodes');
  const row = root.querySelector('[data-rmt-component="component.row"]');
  context.assert(row && row.getAttribute('title') === 'Alpha', 'renderer resolves item-bound attributes');
  context.assert(row && row.value === 'a', 'renderer applies safe properties');
  row.dispatchEvent({ type: 'click', detail: { id: 'a' } });
  const rowBinding = result.bindings.find((binding) => binding.target === row && binding.event === 'click');
  context.assert(
    harness.events.length === 0
      && !row._listeners.has('click')
      && rowBinding
      && rowBinding.command === 'event.item-selected',
    'renderer returns a validated application binding without installing its listener'
  );
  context.assert(harness.renderer.listDiagnostics().length === 0, 'happy-path renderer has no diagnostics');
  const markerFailureRenderer = rendererModule.createRmtDomDescriptorRenderer({
    documentTarget: harness.documentTarget
  });
  const markerFailureRoot = harness.documentTarget.createElement('main');
  const setMarkerAttribute = markerFailureRoot.setAttribute.bind(markerFailureRoot);
  markerFailureRoot.setAttribute = (name, value) => {
    if (name === 'data-rmt-rendered-shell') throw new Error('marker write failed');
    return setMarkerAttribute(name, value);
  };
  let markerFailureIsCommitDiagnostic = false;
  try {
    markerFailureRenderer.render(markerFailureRoot, {
      type: 'element',
      tag: 'p',
      text: 'Partial native failure'
    });
  } catch (error) {
    markerFailureIsCommitDiagnostic = error && error.code === 'rmt.dom.commit.native-error';
  }
  context.assert(
    markerFailureIsCommitDiagnostic
      && markerFailureRenderer.listDiagnostics().some((entry) => entry.code === 'rmt.dom.commit.native-error'),
    'render root markers execute inside the delegated replace-children commit diagnostic boundary'
  );

  let blockedScript = false;
  try {
    harness.renderer.renderNode({
      type: 'element',
      tag: 'script',
      attributes: { src: 'https://attacker.example/payload.js' }
    }, harness.renderOptions);
  } catch (error) {
    blockedScript = error && error.code === 'rmt.dom.tag.unsafe';
  }
  context.assert(blockedScript, 'renderer rejects executable script descriptors before DOM insertion');

  const sidePanel = harness.renderer.renderNode({
    type: 'element',
    tag: 'x-side-panel',
    attributes: {
      collapsible: false,
      closable: false,
      pinnable: false,
      disabled: false
    }
  }, harness.renderOptions);
  context.assert(sidePanel.getAttribute('collapsible') === 'false', 'renderer preserves explicit false side panel collapse capability');
  context.assert(sidePanel.getAttribute('closable') === 'false', 'renderer preserves explicit false side panel close capability');
  context.assert(sidePanel.getAttribute('pinnable') === 'false', 'renderer preserves explicit false side panel pin capability');
  context.assert(sidePanel.getAttribute('disabled') === null, 'renderer still removes native false boolean attributes');

  const ariaButton = harness.renderer.renderNode({
    type: 'element',
    tag: 'button',
    attributes: {
      'aria-expanded': true,
      'aria-pressed': false,
      hidden: false,
      disabled: false
    },
    text: 'Toggle'
  }, harness.renderOptions);
  context.assert(ariaButton.getAttribute('aria-expanded') === 'true', 'renderer stringifies true ARIA booleans');
  context.assert(ariaButton.getAttribute('aria-pressed') === 'false', 'renderer stringifies false ARIA booleans');
  context.assert(ariaButton.getAttribute('hidden') === null, 'renderer removes false hidden attribute');
  harness.renderer.patchElement(ariaButton, {
    type: 'element',
    tag: 'button',
    attributes: {
      'aria-expanded': false,
      'aria-pressed': true,
      hidden: true,
      disabled: true
    },
    text: 'Toggle'
  }, harness.renderOptions);
  context.assert(ariaButton.getAttribute('aria-expanded') === 'false', 'structured patch preserves false ARIA state');
  context.assert(ariaButton.getAttribute('aria-pressed') === 'true', 'structured patch preserves true ARIA state');
  context.assert(ariaButton.getAttribute('hidden') === '', 'renderer keeps native true hidden as presence attribute');
  context.assert(ariaButton.getAttribute('disabled') === '', 'renderer keeps native true disabled as presence attribute');

  const punctuationButton = harness.renderer.renderNode({
    type: 'element',
    tag: 'button',
    text: '...'
  }, harness.renderOptions);
  context.assert(textContent(punctuationButton) === '...', 'punctuation-only text stays literal instead of resolving as a model path');

  const commandCommit = harness.renderer.commit({
    operation: 'create-node',
    descriptor: {
      type: 'element',
      tag: 'button',
      command: {
        command: 'test.command',
        payload: {
          label: 'Tool',
          nested: { id: '$model.command.id' },
          active: { op: 'equals', left: '$model.command.id', right: 'tool' }
        }
      },
      text: 'Run'
    },
    context: {
      ...harness.renderOptions,
      model: {
        command: { id: 'tool' }
      }
    }
  });
  const commandButton = commandCommit.nodes[0];
  const commandBinding = commandCommit.bindings[0];
  context.assert(commandBinding && commandBinding.command === 'test.command', 'descriptor command is projected as an application binding');
  context.assert(commandBinding.payload && commandBinding.payload.label === 'Tool', 'descriptor command binding preserves structured payload literals');
  context.assert(commandBinding.payload && commandBinding.payload.nested.id === 'tool', 'descriptor command binding resolves nested model paths');
  context.assert(commandBinding.payload && commandBinding.payload.active === true, 'descriptor command binding resolves nested model expressions');
  context.assert(!commandButton._listeners.has('click'), 'descriptor command projection installs no renderer-owned listener');

  const codeTemplate = harness.renderer.renderNode({
    type: 'element',
    tag: 'template',
    attributes: { 'data-x-code-mode': 'text' },
    text: "console.log('first');"
  }, harness.renderOptions);
  context.assert(codeTemplate.content && codeTemplate.content.childNodes[0].textContent === "console.log('first');", 'template text renders into template.content');
  harness.renderer.patchElement(codeTemplate, {
    type: 'element',
    tag: 'template',
    attributes: { 'data-x-code-mode': 'text' },
    text: "console.log('second');"
  }, harness.renderOptions);
  context.assert(codeTemplate.content.childNodes.length === 1 && codeTemplate.content.childNodes[0].textContent === "console.log('second');", 'template text patches inside template.content');

  const listRoot = harness.documentTarget.createElement('section');
  const firstPass = harness.renderer.renderKeyed(listRoot, [
    { type: 'element', tag: 'article', key: 'a', attributes: { title: 'Alpha' }, children: [{ type: 'text', text: 'Alpha' }] },
    { type: 'element', tag: 'article', key: 'b', attributes: { title: 'Beta' }, children: [{ type: 'text', text: 'Beta' }] }
  ], harness.renderOptions);
  const firstA = firstPass[0];
  const secondPass = harness.renderer.renderKeyed(listRoot, [
    { type: 'element', tag: 'article', key: 'b', attributes: { title: 'Beta changed' }, children: [{ type: 'text', text: 'Beta changed' }] },
    { type: 'element', tag: 'article', key: 'a', attributes: { title: 'Alpha changed' }, children: [{ type: 'text', text: 'Alpha changed' }] }
  ], harness.renderOptions);
  context.assert(secondPass[1] === firstA, 'keyed diff reuses existing node by data-rmt-key');
  context.assert(secondPass[1].getAttribute('title') === 'Alpha changed', 'keyed diff patches safe attributes on reused node');

  const dockDescriptor = {
    type: 'component',
    tag: 'x-section',
    component: 'x-section',
    attributes: {
      'data-maraca-surface': { op: 'literal', value: 'surface.dock' },
      'data-rmt-component': { op: 'literal', value: 'x-section' }
    },
    children: [{
      type: 'repeat',
      source: '$model.dock.items',
      key: '$item.id',
      template: {
        type: 'element',
        tag: 'button',
        attributes: {
          type: { op: 'literal', value: 'button' },
          'data-action': '$item.action',
          'data-id': '$item.id'
        },
        children: [
          { type: 'element', tag: 'span', class: 'title', text: '$item.title' },
          { type: 'element', tag: 'span', class: 'subtitle', text: '$item.subtitle' }
        ]
      }
    }]
  };
  const dock = harness.renderer.renderNode(dockDescriptor, {
    model: {
      dock: {
        items: [{ id: 'surface.player', action: 'toggle-surface', title: 'Player', subtitle: 'open' }]
      }
    }
  });
  const patchedDock = harness.renderer.patchElement(dock, dockDescriptor, {
    model: {
      dock: {
        items: [{ id: 'surface.player', action: 'toggle-surface', title: 'Player', subtitle: 'minimized' }]
      }
    }
  });
  context.assert(patchedDock === dock, 'structured patch keeps the surface host element stable');
  context.assert(textContent(dock).includes('minimized') && !textContent(dock).includes('open'), 'structured patch refreshes repeated surface dock content');

  const settingsDialogDescriptor = {
    type: 'component',
    tag: 'x-dialog',
    component: 'x-dialog',
    attributes: {
      id: 'settings-dialog',
      'data-maraca-surface': { op: 'literal', value: 'surface.settings' }
    },
    children: [
      {
        type: 'component',
        tag: 'x-tabs',
        component: 'x-tabs',
        attributes: {
          id: 'settings-tabs',
          selected: '$model.settings.selected',
          orientation: 'vertical'
        },
        children: [
          {
            type: 'element',
            tag: 'x-tab',
            attributes: { label: 'Appearance' },
            children: [{ type: 'element', tag: 'p', text: 'Appearance panel' }]
          },
          {
            type: 'element',
            tag: 'x-tab',
            attributes: { label: 'Runtime' },
            children: [{ type: 'element', tag: 'p', text: 'Runtime panel' }]
          }
        ]
      },
      {
        type: 'element',
        tag: 'div',
        class: 'settings-footer',
        children: [{ type: 'element', tag: 'button', attributes: { id: 'settings-save' }, text: 'Save' }]
      }
    ]
  };
  const settingsDialog = harness.renderer.renderNode(settingsDialogDescriptor, {
    model: { settings: { selected: 0 } }
  });
  const settingsTabs = findNode(settingsDialog, (node) => node.tagName === 'X-TABS');
  const settingsSave = findNode(settingsDialog, (node) => node.getAttribute && node.getAttribute('id') === 'settings-save');
  harness.renderer.patchElement(settingsDialog, settingsDialogDescriptor, {
    model: { settings: { selected: 1 } }
  });
  const patchedSettingsTabs = findNode(settingsDialog, (node) => node.tagName === 'X-TABS');
  const patchedSettingsSave = findNode(settingsDialog, (node) => node.getAttribute && node.getAttribute('id') === 'settings-save');
  context.assert(patchedSettingsTabs === settingsTabs, 'structured patch reuses stable nested custom component children');
  context.assert(patchedSettingsSave === settingsSave, 'structured patch reuses stable nested native children');
  context.assert(patchedSettingsTabs.getAttribute('selected') === '1', 'structured patch updates nested x-tabs attributes in place');
}

function runCommitCoreAssertions(context, rendererModule) {
  const documentTarget = createFakeDocument();
  const diagnosticsHub = {
    entries: [],
    publish(channel, payload, meta) {
      this.entries.push({ channel, payload, meta });
    }
  };
  const renderer = rendererModule.createRmtDomDescriptorRenderer({
    documentTarget,
    diagnosticsHub
  });
  const refs = new Map();
  const dispatched = [];
  const renderContext = {
    refs,
    dispatchEvent(event) {
      dispatched.push(event);
    }
  };
  const created = renderer.commit({
    operation: 'create-node',
    descriptor: {
      type: 'element',
      tag: 'button',
      ref: 'primary',
      attributes: {
        title: 'Old title',
        style: { color: 'red' }
      },
      properties: {
        value: 'old'
      },
      class: 'old-class',
      part: 'control',
      styleTokens: {
        density: 'compact'
      },
      events: {
        click: 'old-action'
      },
      text: 'Old'
    },
    context: renderContext,
    metadata: {
      correlationId: 'commit:create'
    }
  });
  const button = created.nodes[0];
  context.assert(created.schema === 'xtend.rmt.dom-commit-result.v1', 'commit emits canonical result schema');
  context.assert(created.operation === 'create-node' && created.target === null, 'create-node commit reports operation and null target');
  context.assert(created.changed === true && created.structural === true && created.nodeCount === 1, 'create-node commit reports structural change');
  context.assert(created.metadata && created.metadata.correlationId === 'commit:create', 'commit preserves caller metadata');
  context.assert(refs.get('primary') === button, 'create-node tracks descriptor refs');
  context.assert(
    created.bindings.length === 1
      && created.bindings[0].target === button
      && created.bindings[0].event === 'click'
      && created.bindings[0].command === 'old-action'
      && created.bindings[0].owner === 'descriptor.primary'
      && created.bindings[0].scope === created.bindingScope.id
      && created.bindingScope.roots[0] === button,
    'create-node commit returns a scoped, actual-target application binding record'
  );
  const initialBindingId = created.bindings[0].bindingId;
  context.assert(!button._listeners.has('click'), 'descriptor renderer does not install application listeners');

  const reconciled = renderer.commit({
    operation: 'reconcile-element',
    target: button,
    descriptor: {
      type: 'element',
      tag: 'button',
      text: 'New'
    },
    context: renderContext
  });
  context.assert(reconciled.changed === true && reconciled.structural === false, 'reconcile-element reports non-structural field changes');
  context.assert(button.getAttribute('title') === null && button.getAttribute('class') === null && button.getAttribute('part') === null, 'reconcile-element removes stale attributes, classes, and parts');
  context.assert(button.getAttribute('value') === null && typeof button.value === 'undefined', 'reconcile-element resets stale owned properties');
  context.assert(button.getAttribute('data-style-token-density') === null && button.style.getPropertyValue('--xtend-density') === '', 'reconcile-element removes stale style tokens');
  context.assert(button.style.getPropertyValue('color') === '', 'reconcile-element removes stale structured styles');
  context.assert(!refs.has('primary'), 'reconcile-element removes stale refs');
  button.dispatchEvent({ type: 'click' });
  context.assert(
    dispatched.length === 0
      && !button._listeners.has('click')
      && reconciled.bindings.length === 0
      && reconciled.bindingScope.removedBindings.some((binding) => binding.bindingId === initialBindingId && binding.target === button),
    'reconcile-element reports stale application bindings without owning their listeners'
  );

  const identical = renderer.commit({
    operation: 'reconcile-element',
    target: button,
    descriptor: {
      type: 'element',
      tag: 'button',
      text: 'New'
    },
    context: renderContext
  });
  context.assert(identical.changed === false && identical.structural === false, 'identical reconcile is a mutation-free no-op');

  const stableEventDescriptor = {
    type: 'element',
    tag: 'button',
    events: { click: 'stable-action' },
    text: 'Stable'
  };
  const stableEventCreate = renderer.commit({
    operation: 'create-node',
    descriptor: stableEventDescriptor,
    context: renderContext
  });
  const stableEventNode = stableEventCreate.nodes[0];
  const stableBindingId = stableEventCreate.bindings[0].bindingId;
  let lastStableCommit = null;
  for (let index = 0; index < 100; index += 1) {
    lastStableCommit = renderer.commit({
      operation: 'reconcile-element',
      target: stableEventNode,
      descriptor: stableEventDescriptor,
      context: renderContext
    });
  }
  context.assert(
    lastStableCommit
      && lastStableCommit.changed === false
      && lastStableCommit.bindings.length === 1
      && lastStableCommit.bindings[0].bindingId === stableBindingId
      && !stableEventNode._listeners.has('click'),
    '100 identical commits keep one stable binding record without renderer listener growth'
  );
  const replacementCommit = renderer.commit({
    operation: 'reconcile-element',
    target: stableEventNode,
    descriptor: {
      ...stableEventDescriptor,
      events: { click: 'replacement-action' }
    },
    context: renderContext
  });
  stableEventNode.dispatchEvent({ type: 'click' });
  context.assert(
    replacementCommit.bindings.length === 1
      && replacementCommit.bindings[0].bindingId === stableBindingId
      && replacementCommit.bindings[0].command === 'replacement-action'
      && !stableEventNode._listeners.has('click'),
    'event reconcile updates the stable binding record without stacking handlers'
  );

  const mergeTarget = renderer.renderNode({
    type: 'element',
    tag: 'div',
    attributes: { title: 'Keep' },
    class: 'keep-class',
    text: 'Before'
  });
  renderer.patchElement(mergeTarget, {
    type: 'element',
    tag: 'div',
    text: 'After'
  });
  renderer.patchElement(mergeTarget, {
    type: 'element',
    tag: 'div',
    attributes: { 'data-merged': 'true' }
  });
  context.assert(mergeTarget.getAttribute('title') === 'Keep' && mergeTarget.getAttribute('class') === 'keep-class', 'legacy merge-element preserves unspecified owned fields');
  renderer.commit({
    operation: 'reconcile-element',
    target: mergeTarget,
    descriptor: {
      type: 'element',
      tag: 'div',
      attributes: { 'data-final': 'true' },
      text: 'Final'
    }
  });
  context.assert(
    mergeTarget.getAttribute('title') === null
      && mergeTarget.getAttribute('class') === null
      && mergeTarget.getAttribute('data-merged') === null,
    'full reconcile removes the complete ownership history retained across legacy merges'
  );
  context.assert(renderer.listDiagnostics().filter((entry) => entry.code === 'rmt.dom.patch-element.legacy-merge').length === 1, 'patchElement emits its legacy-merge diagnostic once per renderer');

  let createdBindings = 0;
  let destroyedBindings = 0;
  const componentRegistry = {
    resolveComponentCapability(tag) {
      return tag === 'x-bound' ? { tag: 'x-bound', events: ['change'] } : null;
    },
    bindComponentInstance() {
      createdBindings += 1;
      return {
        destroy() {
          destroyedBindings += 1;
        }
      };
    }
  };
  const bindingsBeforeUnsafeRichText = createdBindings;
  let unsafeRichTextBlocked = false;
  try {
    renderer.commit({
      operation: 'create-node',
      descriptor: {
        type: 'rich-text',
        segments: [
          { kind: 'code', text: 'const safe = true;' },
          { kind: 'citation', href: 'javascript:alert(1)', label: 'unsafe' }
        ]
      },
      context: { componentRegistry }
    });
  } catch (error) {
    unsafeRichTextBlocked = error && error.code === 'rmt.dom.attribute.url-unsafe';
  }
  context.assert(
    unsafeRichTextBlocked && createdBindings === bindingsBeforeUnsafeRichText,
    'rich-text validates every projected segment before creating component bindings or detached nodes'
  );
  const componentDispatcher = (event) => {
    dispatched.push(event);
  };
  const keyedRoot = documentTarget.createElement('section');
  const firstKeyed = renderer.commit({
    operation: 'reconcile-children',
    target: keyedRoot,
    descriptors: [{
      type: 'component',
      component: 'x-bound',
      tag: 'x-bound',
      key: 'stable',
      events: { click: 'select' },
      text: 'Bound'
    }],
    context: {
      componentRegistry,
      dispatchEvent: componentDispatcher
    }
  });
  const firstKeyedNode = firstKeyed.nodes[0];
  const sameKind = renderer.commit({
    operation: 'reconcile-children',
    target: keyedRoot,
    descriptors: [{
      type: 'component',
      component: 'x-bound',
      tag: 'x-bound',
      key: 'stable',
      text: 'Still bound'
    }],
    context: {
      componentRegistry,
      dispatchEvent: componentDispatcher
    }
  });
  context.assert(sameKind.nodes[0] === firstKeyedNode, 'reconcile-children preserves identity for equal key, namespace, and tag');
  context.assert(!firstKeyedNode._listeners.has('click'), 'keyed reconcile removes obsolete event listeners');
  const destroyedBeforeReplacement = destroyedBindings;
  const changedKind = renderer.commit({
    operation: 'reconcile-children',
    target: keyedRoot,
    descriptors: [{
      type: 'element',
      tag: 'article',
      key: 'stable',
      text: 'Replacement'
    }],
    context: { componentRegistry }
  });
  context.assert(changedKind.nodes[0] !== firstKeyedNode && changedKind.nodes[0].tagName === 'ARTICLE', 'equal key with a different tag replaces the node');
  context.assert(destroyedBindings === destroyedBeforeReplacement + 1, 'key/tag replacement disposes its current component binding exactly once');

  const sameTagRoot = documentTarget.createElement('section');
  const sameTagComponent = renderer.commit({
    operation: 'reconcile-children',
    target: sameTagRoot,
    descriptors: [{
      type: 'component',
      component: 'x-bound',
      tag: 'x-bound',
      key: 'same-tag',
      text: 'Component'
    }],
    context: { componentRegistry }
  }).nodes[0];
  const destroyedBeforePlainReconcile = destroyedBindings;
  const sameTagPlain = renderer.commit({
    operation: 'reconcile-children',
    target: sameTagRoot,
    descriptors: [{
      type: 'element',
      tag: 'x-bound',
      key: 'same-tag',
      text: 'Plain'
    }],
    context: { componentRegistry }
  }).nodes[0];
  context.assert(
    sameTagPlain === sameTagComponent && destroyedBindings === destroyedBeforePlainReconcile + 1,
    'same-tag component-to-plain reconcile preserves the node and disposes the component binding once'
  );

  const nativeFailureRoot = documentTarget.createElement('section');
  renderer.commit({
    operation: 'reconcile-children',
    target: nativeFailureRoot,
    descriptors: [{
      type: 'component',
      component: 'x-bound',
      tag: 'x-bound',
      key: 'native-failure',
      text: 'Owned'
    }],
    context: { componentRegistry }
  });
  const retainedAfterNativeFailure = nativeFailureRoot.childNodes[0];
  const createdBeforeNativeFailure = createdBindings;
  const destroyedBeforeNativeFailure = destroyedBindings;
  nativeFailureRoot.replaceChildren = () => {
    throw new Error('native replace failure');
  };
  let nativeFailureBlocked = false;
  try {
    renderer.commit({
      operation: 'replace-children',
      target: nativeFailureRoot,
      descriptor: {
        type: 'component',
        component: 'x-bound',
        tag: 'x-bound',
        text: 'Replacement'
      },
      context: { componentRegistry }
    });
  } catch (error) {
    nativeFailureBlocked = error && error.code === 'rmt.dom.commit.native-error';
  }
  context.assert(
    nativeFailureBlocked
      && nativeFailureRoot.childNodes[0] === retainedAfterNativeFailure
      && createdBindings === createdBeforeNativeFailure + 1
      && destroyedBindings === destroyedBeforeNativeFailure + 1,
    'native replacement failure retains live handles and disposes newly created detached component bindings'
  );

  const namespaceRoot = documentTarget.createElement('section');
  const svgNode = renderer.commit({
    operation: 'reconcile-children',
    target: namespaceRoot,
    descriptors: [{
      type: 'element',
      tag: 'circle',
      namespace: 'http://www.w3.org/2000/svg',
      key: 'shape'
    }]
  }).nodes[0];
  const htmlNode = renderer.commit({
    operation: 'reconcile-children',
    target: namespaceRoot,
    descriptors: [{
      type: 'element',
      tag: 'circle',
      key: 'shape'
    }]
  }).nodes[0];
  context.assert(htmlNode !== svgNode && htmlNode.namespaceURI === 'http://www.w3.org/1999/xhtml', 'equal key and tag with a different namespace replaces the node');

  const childBeforeDuplicate = keyedRoot.childNodes[0];
  const mutationsBeforeDuplicate = keyedRoot._mutationCount;
  let duplicateBlocked = false;
  try {
    renderer.commit({
      operation: 'reconcile-children',
      target: keyedRoot,
      descriptors: [
        { type: 'element', tag: 'article', key: 'duplicate', text: 'One' },
        { type: 'element', tag: 'article', key: 'duplicate', text: 'Two' }
      ]
    });
  } catch (error) {
    duplicateBlocked = error && error.code === 'rmt.dom.key.duplicate';
  }
  context.assert(duplicateBlocked && keyedRoot.childNodes[0] === childBeforeDuplicate && keyedRoot._mutationCount === mutationsBeforeDuplicate, 'duplicate keys fail before target mutation');

  const anchor = renderer.renderNode({
    type: 'element',
    tag: 'a',
    attributes: { href: 'https://example.test/' },
    text: 'Safe'
  });
  let unsafePropertyBlocked = false;
  try {
    renderer.commit({
      operation: 'reconcile-element',
      target: anchor,
      descriptor: {
        type: 'element',
        tag: 'a',
        properties: {
          href: 'javascript:alert(1)'
        },
        text: 'Unsafe'
      }
    });
  } catch (error) {
    unsafePropertyBlocked = error && error.code === 'rmt.dom.property.url-unsafe';
  }
  context.assert(unsafePropertyBlocked && anchor.getAttribute('href') === 'https://example.test/' && textContent(anchor) === 'Safe', 'unsafe URL properties fail closed before target mutation');
  const nativePropertyTarget = renderer.renderNode({
    type: 'element',
    tag: 'input',
    attributes: { title: 'Stable' }
  });
  Object.defineProperty(nativePropertyTarget, 'value', {
    configurable: true,
    get() {
      return 'readonly';
    },
    set() {
      throw new Error('readonly setter');
    }
  });
  let nativePropertyBlocked = false;
  try {
    renderer.commit({
      operation: 'merge-element',
      target: nativePropertyTarget,
      descriptor: {
        type: 'element',
        tag: 'input',
        properties: { value: 'next' }
      }
    });
  } catch (error) {
    nativePropertyBlocked = error && error.code === 'rmt.dom.commit.native-error';
  }
  context.assert(
    nativePropertyBlocked
      && nativePropertyTarget.value === 'readonly'
      && nativePropertyTarget.getAttribute('value') === null,
    'native property setter errors stop the commit without falling back to attribute semantics'
  );

  const activeDraftTarget = documentTarget.createElement('x-textarea');
  let activeDraftValue = '';
  let activeDraftSelection = 0;
  Object.defineProperty(activeDraftTarget, 'value', {
    configurable: true,
    get() {
      return activeDraftValue;
    },
    set(value) {
      activeDraftValue = String(value == null ? '' : value);
      activeDraftSelection = activeDraftValue.length;
    }
  });
  Object.defineProperty(activeDraftTarget, 'selectionStart', {
    configurable: true,
    get() {
      return activeDraftSelection;
    },
    set(value) {
      activeDraftSelection = Number(value);
    }
  });
  const setActiveDraftAttribute = activeDraftTarget.setAttribute.bind(activeDraftTarget);
  activeDraftTarget.setAttribute = (name, value) => {
    setActiveDraftAttribute(name, value);
    if (String(name).toLowerCase() === 'value') activeDraftTarget.value = value;
  };
  renderer.commit({
    operation: 'merge-element',
    target: activeDraftTarget,
    descriptor: {
      type: 'element',
      tag: 'x-textarea',
      attributes: { value: 't' }
    }
  });
  activeDraftTarget.value = 'this is a test';
  activeDraftTarget.selectionStart = 7;
  documentTarget.activeElement = activeDraftTarget;
  renderer.commit({
    operation: 'reconcile-element',
    target: activeDraftTarget,
    descriptor: {
      type: 'element',
      tag: 'x-textarea',
      attributes: { value: 'th', 'aria-invalid': 'false' }
    },
    context: { preserveActiveInputDraft: true }
  });
  context.assert(activeDraftTarget.value === 'this is a test'
    && activeDraftTarget.selectionStart === 7
    && activeDraftTarget.getAttribute('value') === 't'
    && activeDraftTarget.getAttribute('aria-invalid') === 'false',
  'input-originated reconcile preserves the focused live value and caret while applying non-value state');
  documentTarget.activeElement = null;
  renderer.commit({
    operation: 'reconcile-element',
    target: activeDraftTarget,
    descriptor: {
      type: 'element',
      tag: 'x-textarea',
      attributes: { value: 'server reset', 'aria-invalid': 'false' }
    },
    context: { preserveActiveInputDraft: false }
  });
  context.assert(activeDraftTarget.value === 'server reset'
    && activeDraftTarget.getAttribute('value') === 'server reset',
  'non-input reconcile still applies intentional external value changes');

  ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'srcdoc', '__proto__', 'prototype', 'constructor'].forEach((propertyName) => {
    let dangerousPropertyBlocked = false;
    try {
      renderer.commit({
        operation: 'create-node',
        descriptor: {
          type: 'element',
          tag: 'div',
          properties: {
            [propertyName]: '<script>evil()</script>'
          }
        }
      });
    } catch (error) {
      dangerousPropertyBlocked = error && error.code === 'rmt.dom.property.unsafe';
    }
    context.assert(dangerousPropertyBlocked, `renderer blocks dangerous property ${propertyName}`);
  });
  let unsafeStyleBlocked = false;
  try {
    renderer.commit({
      operation: 'reconcile-element',
      target: anchor,
      descriptor: {
        type: 'element',
        tag: 'a',
        attributes: {
          style: {
            background: 'url(javascript:alert(1))'
          }
        }
      }
    });
  } catch (error) {
    unsafeStyleBlocked = error && error.code === 'rmt.dom.style.unsafe-value';
  }
  context.assert(unsafeStyleBlocked, 'renderer rejects executable structured style values');
  let uppercaseStyleBlocked = false;
  try {
    renderer.commit({
      operation: 'merge-element',
      target: anchor,
      descriptor: {
        type: 'element',
        tag: 'a',
        attributes: {
          STYLE: 'background:url(data:text/html,blocked)'
        }
      }
    });
  } catch (error) {
    uppercaseStyleBlocked = error && error.code === 'rmt.dom.style.invalid';
  }
  context.assert(uppercaseStyleBlocked && anchor.getAttribute('STYLE') === null, 'case-insensitive style attributes cannot bypass the structured style policy');
  let secondUnsafeStyleUrlBlocked = false;
  try {
    renderer.commit({
      operation: 'merge-element',
      target: anchor,
      descriptor: {
        type: 'element',
        tag: 'a',
        attributes: {
          style: {
            background: 'url(https://example.test/safe.png), url(data:text/html,blocked)'
          }
        }
      }
    });
  } catch (error) {
    secondUnsafeStyleUrlBlocked = error && error.code === 'rmt.dom.style.unsafe-value';
  }
  context.assert(secondUnsafeStyleUrlBlocked, 'every URL occurrence in a structured style value passes the scheme policy');
  context.assert(
    renderer.isUrlAllowed('https://example.test/media.mp4') === true
      && renderer.isUrlAllowed('javascript:alert(1)') === false
      && renderer.isUrlAllowed('data:text/html,blocked') === false,
    'renderer exposes the same URL scheme policy for public component-method adapters'
  );

  const customPropertyRegistry = {
    resolveComponentCapability(tag) {
      return tag === 'x-safe-props'
        ? { tag, allowedProperties: ['payload'] }
        : null;
    }
  };
  const customPropertyNode = renderer.commit({
    operation: 'create-node',
    descriptor: {
      type: 'component',
      component: 'x-safe-props',
      tag: 'x-safe-props',
      properties: {
        payload: { op: 'literal', value: { id: 'safe' } }
      }
    },
    context: {
      componentRegistry: customPropertyRegistry
    }
  }).nodes[0];
  context.assert(customPropertyNode.payload && customPropertyNode.payload.id === 'safe', 'component capability registry can explicitly allow custom-element properties');
  let undeclaredCustomPropertyBlocked = false;
  try {
    renderer.commit({
      operation: 'create-node',
      descriptor: {
        type: 'component',
        component: 'x-safe-props',
        tag: 'x-safe-props',
        properties: {
          undeclared: 'blocked'
        }
      },
      context: {
        componentRegistry: customPropertyRegistry
      }
    });
  } catch (error) {
    undeclaredCustomPropertyBlocked = error && error.code === 'rmt.dom.property.not-allowed';
  }
  context.assert(undeclaredCustomPropertyBlocked, 'undeclared custom-element properties are rejected');
  let undeclaredNativeNamedCustomPropertyBlocked = false;
  try {
    renderer.commit({
      operation: 'create-node',
      descriptor: {
        type: 'component',
        component: 'x-safe-props',
        tag: 'x-safe-props',
        properties: {
          value: 'blocked'
        }
      },
      context: {
        componentRegistry: customPropertyRegistry
      }
    });
  } catch (error) {
    undeclaredNativeNamedCustomPropertyBlocked = error && error.code === 'rmt.dom.property.not-allowed';
  }
  context.assert(undeclaredNativeNamedCustomPropertyBlocked, 'native-named custom-element properties still require capability declaration');
  const unsafePathTarget = renderer.renderNode({
    type: 'element',
    tag: 'button',
    attributes: { title: 'stable' },
    text: 'Stable'
  });
  let unsafeModelPathBlocked = false;
  try {
    renderer.commit({
      operation: 'reconcile-element',
      target: unsafePathTarget,
      descriptor: {
        type: 'element',
        tag: 'button',
        attributes: { title: '$model.__proto__.polluted' },
        text: 'Changed'
      },
      context: { model: {} }
    });
  } catch (error) {
    unsafeModelPathBlocked = error && error.code === 'rmt.dom.path.unsafe';
  }
  context.assert(
    unsafeModelPathBlocked
      && unsafePathTarget.getAttribute('title') === 'stable'
      && textContent(unsafePathTarget) === 'Stable',
    'unsafe descriptor path segments fail before the first DOM mutation'
  );
  let unsafeCommandPathBlocked = false;
  try {
    renderer.commit({
      operation: 'create-node',
      descriptor: {
        type: 'element',
        tag: 'button',
        command: {
          command: 'unsafe.command',
          payload: {
            leak: '$event.constructor.prototype'
          }
        }
      }
    });
  } catch (error) {
    unsafeCommandPathBlocked = error && error.code === 'rmt.dom.path.unsafe';
  }
  context.assert(unsafeCommandPathBlocked, 'command payload paths are security-validated before node materialization');
  let unsafePayloadKeyBlocked = false;
  try {
    renderer.commit({
      operation: 'create-node',
      descriptor: {
        type: 'element',
        tag: 'button',
        command: {
          command: 'unsafe.command',
          payload: JSON.parse('{"constructor":"blocked"}')
        }
      }
    });
  } catch (error) {
    unsafePayloadKeyBlocked = error && error.code === 'rmt.dom.path.unsafe';
  }
  context.assert(unsafePayloadKeyBlocked, 'command payload record keys cannot use reserved prototype names');
  const safeCountBy = renderer.resolveValue({
    op: 'countBy',
    source: '$model.items',
    path: 'kind'
  }, {
    model: {
      items: [{ kind: 'one' }, { kind: 'one' }, { kind: 'two' }]
    }
  });
  context.assert(
    Object.getPrototypeOf(safeCountBy) === null
      && safeCountBy.one === 2
      && safeCountBy.two === 1,
    'countBy uses a null-prototype accumulator'
  );
  let unsafeCountByKeyBlocked = false;
  try {
    renderer.resolveValue({
      op: 'countBy',
      source: '$model.items',
      path: 'kind'
    }, {
      model: {
        items: [{ kind: '__proto__' }]
      }
    });
  } catch (error) {
    unsafeCountByKeyBlocked = error && error.code === 'rmt.dom.path.unsafe';
  }
  context.assert(unsafeCountByKeyBlocked, 'countBy rejects reserved prototype keys');

  const visibilityTarget = renderer.renderNode({
    type: 'element',
    tag: 'section',
    text: 'Visible'
  });
  let ownershipBlocked = false;
  try {
    renderer.commit({
      operation: 'reconcile-element',
      target: visibilityTarget,
      descriptor: {
        type: 'element',
        tag: 'section',
        attributes: { hidden: true },
        text: 'Visible'
      },
      ownership: {
        mode: 'strict',
        owner: 'descriptor-renderer'
      }
    });
  } catch (error) {
    ownershipBlocked = error && error.code === 'rmt.dom.ownership.collision';
  }
  context.assert(ownershipBlocked && visibilityTarget.getAttribute('hidden') === null, 'strict ownership rejects descriptor writes to the reserved visibility domain');
  let transitionStyleOwnershipBlocked = false;
  try {
    renderer.commit({
      operation: 'merge-element',
      target: visibilityTarget,
      descriptor: {
        type: 'element',
        tag: 'section',
        attributes: {
          style: {
            visibility: 'hidden',
            'pointer-events': 'none',
            'will-change': 'opacity'
          }
        }
      },
      ownership: {
        mode: 'strict',
        owner: 'descriptor-renderer'
      }
    });
  } catch (error) {
    transitionStyleOwnershipBlocked = error && error.code === 'rmt.dom.ownership.collision';
  }
  context.assert(
    transitionStyleOwnershipBlocked
      && visibilityTarget.style.getPropertyValue('visibility') === ''
      && visibilityTarget.style.getPropertyValue('pointer-events') === ''
      && visibilityTarget.style.getPropertyValue('will-change') === '',
    'strict ownership reserves all persistent and temporary transition styles before mutation'
  );
  const effectiveOwnershipRegistry = {
    resolveComponentCapability(tag) {
      return tag === 'x-owned-visibility' ? { tag } : null;
    },
    buildComponentDescriptor() {
      return {
        type: 'component',
        component: 'x-owned-visibility',
        tag: 'x-owned-visibility',
        attributes: { hidden: true }
      };
    }
  };
  let effectiveOwnershipBlocked = false;
  try {
    renderer.commit({
      operation: 'create-node',
      descriptor: {
        type: 'component',
        component: 'x-owned-visibility',
        tag: 'x-owned-visibility'
      },
      context: { componentRegistry: effectiveOwnershipRegistry },
      ownership: {
        mode: 'strict',
        owner: 'descriptor-renderer'
      }
    });
  } catch (error) {
    effectiveOwnershipBlocked = error && error.code === 'rmt.dom.ownership.collision';
  }
  context.assert(effectiveOwnershipBlocked, 'strict ownership evaluates registry-expanded component descriptors before mutation');
  const compatibleOwnership = renderer.commit({
    operation: 'merge-element',
    target: visibilityTarget,
    descriptor: {
      type: 'element',
      tag: 'section',
      attributes: { hidden: true }
    },
    ownership: {
      mode: 'compatibility',
      owner: 'descriptor-renderer'
    }
  });
  context.assert(visibilityTarget.getAttribute('hidden') === null && compatibleOwnership.diagnostics.some((entry) => entry.code === 'rmt.dom.ownership.collision'), 'compatibility ownership keeps the reserved owner and diagnoses the collision');
  const mixedOwnerTarget = renderer.renderNode({
    type: 'element',
    tag: 'input'
  });
  const mixedOwnerCommit = renderer.commit({
    operation: 'reconcile-element',
    target: mixedOwnerTarget,
    descriptor: {
      type: 'element',
      tag: 'input',
      attributes: {
        name: 'email',
        'aria-invalid': 'true'
      }
    },
    ownership: {
      mode: 'strict',
      owner: 'descriptor-renderer',
      claims: {
        validation: 'validation-runtime'
      }
    }
  });
  context.assert(
    mixedOwnerCommit.changed
      && mixedOwnerTarget.getAttribute('name') === 'email'
      && mixedOwnerTarget.getAttribute('aria-invalid') === 'true',
    'one commit accepts explicit per-domain owner claims without relabelling descriptor-owned domains'
  );

  const slotMarkup = '<img src=x onerror=evil()>${model.attack}';
  const slotHtml = '<strong>plain slot text</strong>';
  let trustedSlotPolicy = '';
  const slotHost = renderer.commit({
    operation: 'create-node',
    descriptor: {
      type: 'component',
      component: 'x-slot-policy',
      tag: 'x-slot-policy',
      slots: {
        default: { markup: slotMarkup },
        html: { html: slotHtml },
        structured: {
          descriptor: {
            type: 'element',
            tag: 'strong',
            text: 'Structured descriptor'
          }
        },
        template: {
          template: 'template.slot-policy'
        },
        trusted: {
          type: 'trusted_html',
          trustedBoundary: TRUSTED_DOM_BOUNDARY,
          policyRef: 'policy.slot.sanitized',
          html: '<em>trusted input</em>'
        }
      }
    },
    context: {
      templates: [{
        id: 'template.slot-policy',
        root: {
          type: 'element',
          tag: 'span',
          text: 'Structured template'
        }
      }],
      trustedDomRenderer(descriptor) {
        trustedSlotPolicy = descriptor.policyRef;
        const node = documentTarget.createElement('aside');
        node.appendChild(documentTarget.createTextNode('Trusted boundary output'));
        return node;
      }
    }
  }).nodes[0];
  context.assert(textContent(slotHost).includes(slotMarkup) && textContent(slotHost).includes(slotHtml), 'slot markup/html strings render literally as text');
  context.assert(!findNode(slotHost, (node) => node.tagName === 'IMG') && !findNode(slotHost, (node) => node.tagName === 'EM'), 'plain slot markup creates no executable or interpreted elements');
  context.assert(findNode(slotHost, (node) => node.tagName === 'STRONG') && textContent(slotHost).includes('Structured template'), 'structured slot UI resolves only through descriptor and template forms');
  context.assert(trustedSlotPolicy === 'policy.slot.sanitized' && textContent(slotHost).includes('Trusted boundary output'), 'trusted slot HTML delegates the explicit policy reference to trustedDomRenderer');

  const guardedSlotTarget = renderer.renderNode({
    type: 'component',
    component: 'x-slot-guard',
    tag: 'x-slot-guard',
    children: [{
      type: 'element',
      tag: 'span',
      text: 'Stable slot DOM'
    }]
  });
  const guardedChild = guardedSlotTarget.childNodes[0];
  const guardedMutationCount = guardedSlotTarget._mutationCount;
  let trustedSlotRendererCalls = 0;
  let missingTrustedPolicyBlocked = false;
  try {
    renderer.commit({
      operation: 'reconcile-element',
      target: guardedSlotTarget,
      descriptor: {
        type: 'component',
        component: 'x-slot-guard',
        tag: 'x-slot-guard',
        slots: {
          default: {
            type: 'trusted_html',
            trustedBoundary: TRUSTED_DOM_BOUNDARY,
            html: '<script>blocked()</script>'
          }
        }
      },
      context: {
        trustedDomRenderer() {
          trustedSlotRendererCalls += 1;
          return documentTarget.createElement('aside');
        }
      }
    });
  } catch (error) {
    missingTrustedPolicyBlocked = error && error.code === 'rmt.dom.trusted-policy.missing';
  }
  context.assert(
    missingTrustedPolicyBlocked
      && trustedSlotRendererCalls === 0
      && guardedSlotTarget.childNodes[0] === guardedChild
      && guardedSlotTarget._mutationCount === guardedMutationCount,
    'trusted slot HTML without policyRef fails closed before target mutation or trusted renderer invocation'
  );

  let invalidSlotMarkupBlocked = false;
  try {
    renderer.commit({
      operation: 'reconcile-element',
      target: guardedSlotTarget,
      descriptor: {
        type: 'component',
        component: 'x-slot-guard',
        tag: 'x-slot-guard',
        slots: {
          default: {
            html: {
              unsafe: true
            }
          }
        }
      }
    });
  } catch (error) {
    invalidSlotMarkupBlocked = error && error.code === 'rmt.dom.slot.markup-invalid';
  }
  context.assert(
    invalidSlotMarkupBlocked
      && guardedSlotTarget.childNodes[0] === guardedChild
      && guardedSlotTarget._mutationCount === guardedMutationCount,
    'non-string normal slot html fails before target mutation'
  );

  const trustedDescriptor = {
    type: 'trusted_html',
    trustedBoundary: TRUSTED_DOM_BOUNDARY,
    policyRef: 'policy.renderer.alias-test'
  };
  renderer.renderNode(trustedDescriptor, {
    trustedDom() {
      return documentTarget.createElement('aside');
    }
  });
  renderer.renderNode(trustedDescriptor, {
    trustedDom() {
      return documentTarget.createElement('aside');
    }
  });
  context.assert(renderer.listDiagnostics().filter((entry) => entry.code === 'rmt.dom.trusted-dom.legacy-alias').length === 1, 'trustedDom compatibility alias is diagnosed once per renderer');

  const trustedPreflightTarget = renderer.renderNode({
    type: 'element',
    tag: 'section',
    attributes: { title: 'Stable preflight target' },
    children: [{ type: 'element', tag: 'span', text: 'Stable preflight child' }]
  });
  const trustedPreflightChild = trustedPreflightTarget.childNodes[0];
  const trustedPreflightMutationCount = trustedPreflightTarget._mutationCount;
  let invalidTrustedPreflightCalls = 0;
  let invalidTrustedPreflightBlocked = false;
  try {
    renderer.commit({
      operation: 'reconcile-element',
      target: trustedPreflightTarget,
      descriptor: {
        type: 'element',
        tag: 'section',
        attributes: { title: 'Must not commit' },
        children: [{
          type: 'trusted_html',
          trustedBoundary: TRUSTED_DOM_BOUNDARY,
          policyRef: 'policy.preflight.invalid'
        }]
      },
      context: {
        trustedDomRenderer() {
          invalidTrustedPreflightCalls += 1;
          return { unsafe: true };
        }
      }
    });
  } catch (error) {
    invalidTrustedPreflightBlocked = error && error.code === 'rmt.dom.trusted-renderer.invalid';
  }
  context.assert(
    invalidTrustedPreflightBlocked
      && invalidTrustedPreflightCalls === 1
      && trustedPreflightTarget.getAttribute('title') === 'Stable preflight target'
      && trustedPreflightTarget.childNodes[0] === trustedPreflightChild
      && trustedPreflightTarget._mutationCount === trustedPreflightMutationCount,
    'trusted DOM output is invoked and validated exactly once before the first target mutation'
  );
  let trustedPreflightCalls = 0;
  const forgedTrustedNode = documentTarget.createElement('strong');
  forgedTrustedNode.appendChild(documentTarget.createTextNode('forged'));
  const validTrustedCommit = renderer.commit({
    operation: 'reconcile-element',
    target: trustedPreflightTarget,
    descriptor: {
      type: 'element',
      tag: 'section',
      attributes: { title: 'Committed after preflight' },
      children: [{
        type: 'trusted_html',
        trustedBoundary: TRUSTED_DOM_BOUNDARY,
        policyRef: 'policy.preflight.valid'
      }]
    },
    context: {
      trustedDomPreflight: {
        collecting: false,
        cursor: 0,
        records: [{
          rendered: forgedTrustedNode,
          signature: 'forged'
        }]
      },
      trustedDomRenderer() {
        trustedPreflightCalls += 1;
        const node = documentTarget.createElement('aside');
        node.appendChild(documentTarget.createTextNode('validated trusted output'));
        return node;
      }
    }
  });
  context.assert(
    trustedPreflightCalls === 1
      && validTrustedCommit.changed === true
      && trustedPreflightTarget.childNodes[0] !== forgedTrustedNode
      && textContent(trustedPreflightTarget).includes('validated trusted output'),
    'public context cannot inject trusted preflight records and a successful trusted output is consumed exactly once'
  );

  const ownershipRoot = documentTarget.createElement('main');
  const ownershipSentinel = documentTarget.createElement('p');
  ownershipSentinel.appendChild(documentTarget.createTextNode('Owned elsewhere'));
  ownershipRoot.appendChild(ownershipSentinel);
  const ownershipMutationCount = ownershipRoot._mutationCount;
  let emptyStructureBlocked = false;
  try {
    renderer.commit({
      operation: 'reconcile-children',
      target: ownershipRoot,
      descriptors: [],
      ownership: {
        mode: 'strict',
        owner: 'descriptor-renderer',
        domains: { structure: 'surface-resource-graph' }
      }
    });
  } catch (error) {
    emptyStructureBlocked = error && error.code === 'rmt.dom.ownership.collision';
  }
  context.assert(
    emptyStructureBlocked
      && ownershipRoot.childNodes[0] === ownershipSentinel
      && ownershipRoot._mutationCount === ownershipMutationCount,
    'empty reconcile claims structure and fails before clearing a root owned by another runtime'
  );
  const compatibleStructure = renderer.commit({
    operation: 'replace-children',
    target: ownershipRoot,
    descriptor: { type: 'element', tag: 'article', text: 'Blocked replacement' },
    ownership: {
      mode: 'compatibility',
      owner: 'descriptor-renderer',
      domains: { structure: 'surface-resource-graph' }
    }
  });
  context.assert(
    compatibleStructure.changed === false
      && compatibleStructure.nodes[0] === ownershipSentinel
      && ownershipRoot.childNodes[0] === ownershipSentinel
      && compatibleStructure.diagnostics.some((entry) => entry.code === 'rmt.dom.ownership.collision'),
    'compatibility ownership keeps the reserved structural owner and reports a no-op commit'
  );
  const contentOwnershipTarget = renderer.renderNode({
    type: 'element',
    tag: 'p',
    text: 'Reserved content'
  });
  const compatibleContent = renderer.commit({
    operation: 'reconcile-element',
    target: contentOwnershipTarget,
    descriptor: {
      type: 'element',
      tag: 'p',
      text: 'Descriptor content'
    },
    ownership: {
      mode: 'compatibility',
      owner: 'descriptor-renderer',
      domains: { content: 'content-runtime' }
    }
  });
  context.assert(
    compatibleContent.changed === false
      && textContent(contentOwnershipTarget) === 'Reserved content'
      && compatibleContent.diagnostics.some((entry) => entry.domain === 'content'),
    'compatibility ownership blocks content writes as well as structural writes'
  );
  let invalidOwnershipModeBlocked = false;
  try {
    renderer.commit({
      operation: 'merge-element',
      target: contentOwnershipTarget,
      descriptor: {
        type: 'element',
        tag: 'p',
        attributes: { title: 'Must not commit' }
      },
      ownership: {
        mode: 'strcit'
      }
    });
  } catch (error) {
    invalidOwnershipModeBlocked = error && error.code === 'rmt.dom.ownership.mode-invalid';
  }
  context.assert(
    invalidOwnershipModeBlocked && contentOwnershipTarget.getAttribute('title') === null,
    'unknown ownership modes fail closed before mutation'
  );

  const primitiveTextRoot = documentTarget.createElement('div');
  const firstPrimitiveText = renderer.commit({
    operation: 'reconcile-children',
    target: primitiveTextRoot,
    descriptors: ['stable text']
  });
  const primitiveTextNode = firstPrimitiveText.nodes[0];
  const secondPrimitiveText = renderer.commit({
    operation: 'reconcile-children',
    target: primitiveTextRoot,
    descriptors: ['stable text']
  });
  context.assert(
    secondPrimitiveText.nodes[0] === primitiveTextNode
      && secondPrimitiveText.changed === false
      && secondPrimitiveText.structural === false,
    'identical primitive text reconciliation preserves identity and is mutation-free'
  );
  const keyedTextRoot = documentTarget.createElement('div');
  const keyedTextDescriptor = { type: 'text', key: 'copy', text: 'Keyed text' };
  const firstKeyedText = renderer.commit({
    operation: 'reconcile-children',
    target: keyedTextRoot,
    descriptors: [keyedTextDescriptor]
  }).nodes[0];
  const secondKeyedTextCommit = renderer.commit({
    operation: 'reconcile-children',
    target: keyedTextRoot,
    descriptors: [{ ...keyedTextDescriptor }]
  });
  context.assert(
    secondKeyedTextCommit.nodes[0] === firstKeyedText
      && secondKeyedTextCommit.changed === false,
    'keyed text uses renderer-internal key ownership and preserves node identity'
  );

  let throwingHandleDisposals = 0;
  const throwingHandleRefs = new Map();
  const throwingHandleRegistry = {
    resolveComponentCapability(tag) {
      return tag === 'x-throwing-dispose' ? { tag } : null;
    },
    bindComponentInstance() {
      return {
        dispose() {
          throwingHandleDisposals += 1;
          throw new Error('expected disposer failure');
        }
      };
    }
  };
  const throwingHandleNode = renderer.renderNode({
    type: 'component',
    component: 'x-throwing-dispose',
    tag: 'x-throwing-dispose',
    ref: 'throwing-handle',
    events: { click: 'throwing-handle.click' },
    text: 'Dispose safely'
  }, {
    componentRegistry: throwingHandleRegistry,
    dispatchEvent(event) {
      dispatched.push(event);
    },
    refs: throwingHandleRefs
  });
  renderer.dispose(throwingHandleNode);
  renderer.dispose(throwingHandleNode);
  throwingHandleNode.dispatchEvent({ type: 'click' });
  context.assert(
    throwingHandleDisposals === 1
      && !throwingHandleRefs.has('throwing-handle')
      && !throwingHandleNode._listeners.has('click')
      && renderer.listDiagnostics().some((entry) => (
        entry.code === 'rmt.dom.dispose.cleanup-failed'
        && entry.phase === 'component-binding'
      )),
    'dispose remains idempotent and continues listener/ref cleanup when a component disposer throws'
  );

  const disposable = renderer.renderNode({
    type: 'element',
    tag: 'button',
    events: { click: 'dispose-action' },
    text: 'Dispose'
  }, renderContext);
  renderer.dispose(disposable);
  renderer.dispose(disposable);
  disposable.dispatchEvent({ type: 'click' });
  context.assert(dispatched.length === 0 && !disposable._listeners.has('click'), 'dispose is idempotent and removes renderer-owned listeners');
}

function runSecurityAssertions(context, fixture, rendererModule) {
  const harness = createRendererFixtureHarness(fixture, rendererModule);
  const root = harness.documentTarget.createElement('main');
  try {
    harness.renderer.commit({
      operation: 'create-node',
      descriptor: harness.documentTarget.createElement('script')
    });
    context.fail('renderer rejects raw DOM nodes as descriptors');
  } catch (error) {
    context.assert(error.code === 'rmt.dom.raw-node.unsupported', 'raw DOM nodes cannot bypass descriptor policy');
  }
  try {
    harness.renderer.render(root, {
      type: 'element',
      tag: 'section',
      attributes: {
        onclick: 'evil()'
      },
      source: {
        templateId: 'template.bad',
        pointer: '/templates/bad/root'
      }
    }, harness.renderOptions);
    context.fail('renderer rejects inline event attributes');
  } catch (error) {
    context.assert(error.code === 'rmt.dom.attribute.unsafe', 'renderer throws unsafe attribute code');
    context.assert(error.diagnostic && error.diagnostic.schema === RMT_DOM_RENDERER_DIAGNOSTIC_SCHEMA, 'renderer error carries diagnostic schema');
    context.assert(error.diagnostic && error.diagnostic.source.pointer === '/templates/bad/root', 'diagnostic maps error to RMT source pointer');
  }
  context.assert(harness.renderer.listDiagnostics().some((diagnostic) => diagnostic.code === 'rmt.dom.attribute.unsafe'), 'renderer records unsafe attribute diagnostic');

  const trustedTemplate = indexById(fixture.templates).get('template.trusted-fragment');
  try {
    harness.renderer.renderNode({
      type: 'trusted_html',
      trustedBoundary: trustedTemplate.trustedBoundary,
      policyId: 'policy.fixture.trusted-fragment',
      resource: trustedTemplate.resource,
      source: trustedTemplate.source
    }, harness.renderOptions);
    context.fail('trusted HTML without explicit renderer is rejected');
  } catch (error) {
    context.assert(error.code === 'rmt.dom.trusted-renderer.missing', 'trusted HTML requires explicit trusted renderer');
  }
  let delegatedPolicyRef = '';
  const trustedNode = harness.renderer.renderNode({
    type: 'trusted_html',
    trustedBoundary: TRUSTED_DOM_BOUNDARY,
    policyRef: 'policy.fixture.trusted-fragment',
    resource: 'resource.trusted-fragment'
  }, {
    ...harness.renderOptions,
    trustedDomRenderer(descriptor) {
      delegatedPolicyRef = descriptor.policyRef;
      const node = harness.documentTarget.createElement('aside');
      node.setAttribute('data-rmt-trusted-boundary', TRUSTED_DOM_BOUNDARY);
      return node;
    }
  });
  context.assert(trustedNode && trustedNode.getAttribute('data-rmt-trusted-boundary') === TRUSTED_DOM_BOUNDARY && delegatedPolicyRef === 'policy.fixture.trusted-fragment', 'trusted HTML delegates policy reference to the explicit boundary renderer');
}

function runNoManualHtmlGateAssertions(context, rootDir, rendererModule) {
  const runtimeSource = readText(RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME, rootDir);
  const fixtureSource = readText(RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE, rootDir);
  const demoRuntime = readText('demos/xtendrmt/examples/first-app/generated/app.js', rootDir);
  const gate = rendererModule.createNoManualHtmlGate();
  const cleanDiagnostics = gate.scanFiles({
    [RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME]: runtimeSource,
    [RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE]: fixtureSource,
    'demos/xtendrmt/examples/first-app/generated/app.js': demoRuntime
  });
  context.assert(gate.schema === NO_MANUAL_HTML_GATE_SCHEMA, 'No-Manual-HTML gate exposes schema');
  context.assert(cleanDiagnostics.length === 0, 'No-Manual-HTML gate accepts renderer and RMT shell units');
  const badDiagnostics = gate.scanText('root.innerHTML = "<x-section></x-section>";', {
    filePath: 'host-app/manual-shell.js'
  });
  context.assert(badDiagnostics.length >= 1, 'No-Manual-HTML gate rejects root.innerHTML host shell');
  context.assert(badDiagnostics.some((diagnostic) => diagnostic.sink === 'root.innerHTML'), 'No-Manual-HTML diagnostic names blocked sink');
}

async function runRmtDomDescriptorRendererSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-dom-descriptor-renderer',
    label: 'Epic 18 RMT DOM Descriptor renderer'
  });
  const plan = createRmtDomDescriptorRendererPlan({ rootDir });
  const validation = validateRmtDomDescriptorRendererPlan(plan);
  const report = createRmtDomDescriptorRendererReport({ rootDir, plan });
  const fixture = readJson(RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE, rootDir);
  const docs = readText(RMT_DOM_DESCRIPTOR_RENDERER_DOCS, rootDir);
  const workpackageDoc = readText(RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE_DOC, rootDir);
  const backlog = readText('development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md', rootDir);
  const epic = readText('development/docs-evidence/root/epic18-media-manager-vendor-upstream.md', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const runtimeSource = readText(RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME, rootDir);
  const typeSource = readText(RMT_DOM_DESCRIPTOR_RENDERER_TYPES, rootDir);
  const rendererModule = await loadRendererModule(rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_DOM_DESCRIPTOR_RENDERER_MODULE, { rootDir, extension: '.js' });
  const runtimeSyntax = syntaxCheckFile(RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_DOM_DESCRIPTOR_RENDERER_SUITE, { rootDir, extension: '.js' });

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-05 artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as WP-E18-05 doc`);
  });

  context.assert(moduleSyntax.ok, `DOM Descriptor renderer contract syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(runtimeSyntax.ok, `DOM Descriptor renderer runtime syntax passes${runtimeSyntax.ok ? '' : ` (${runtimeSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `DOM Descriptor renderer suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA, 'DOM Descriptor renderer schema is stable');
  context.assert(plan.reportSchema === RMT_DOM_DESCRIPTOR_RENDERER_REPORT_SCHEMA, 'DOM Descriptor renderer report schema is stable');
  context.assert(plan.fixtureSchema === RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE_SCHEMA, 'DOM Descriptor renderer fixture schema is stable');
  context.assert(plan.diagnosticSchema === RMT_DOM_RENDERER_DIAGNOSTIC_SCHEMA, 'DOM Descriptor renderer diagnostic schema is stable');
  context.assert(plan.workpackage === RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE, 'DOM Descriptor renderer belongs to WP-E18-05');
  context.assert(plan.status === RMT_DOM_DESCRIPTOR_RENDERER_STATUS, 'DOM Descriptor renderer status is accepted');
  context.assert(plan.targetReadiness === RMT_DOM_DESCRIPTOR_RENDERER_TARGET, 'DOM Descriptor renderer target is ready');
  context.assert(plan.authoringSchema === RMT_APP_PLATFORM_AUTHORING_SCHEMA, 'DOM Descriptor renderer consumes WP-E18-04 authoring schema');
  context.assert(plan.localGate === RMT_DOM_DESCRIPTOR_RENDERER_LOCAL_GATE, 'DOM Descriptor renderer local gate is stable');
  context.assert(plan.packageScript === RMT_DOM_DESCRIPTOR_RENDERER_PACKAGE_SCRIPT, 'DOM Descriptor renderer package script is stable');
  context.assert(plan.trustedDomBoundary === TRUSTED_DOM_BOUNDARY, 'DOM Descriptor renderer exposes trusted boundary');
  context.assert(validation.ok === true, 'DOM Descriptor renderer plan validates');
  context.assert(report.ok === true, 'DOM Descriptor renderer report validates');
  context.assert(report.rendererImplemented === true && report.runtimeImplemented === true, 'WP-E18-05 claims runtime implementation');
  context.assert(report.normalUiAllowsManualHtml === false, 'normal UI does not allow manual HTML');
  assertIncludesAll(context, plan.requiredRenderOperations, REQUIRED_RENDER_OPERATIONS, 'required render operations');
  assertIncludesAll(context, plan.forbiddenNormalUiSinks, FORBIDDEN_NORMAL_UI_SINKS, 'forbidden normal UI sinks');
  assertIncludesAll(context, plan.boundaries, REQUIRED_BOUNDARIES, 'renderer boundaries');

  context.assert(fixture.kind === 'rmt_document', 'DOM Descriptor fixture is an RMT document');
  context.assert(fixture.schema === RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE_SCHEMA, 'DOM Descriptor fixture declares schema');
  context.assert(fixture.manifest.metadata.contractVersion === RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA, 'DOM Descriptor fixture declares renderer contract');
  context.assert(fixture.manifest.metadata.authoringContract === RMT_APP_PLATFORM_AUTHORING_SCHEMA, 'DOM Descriptor fixture links authoring contract');
  context.assert(fixture.manifest.metadata.workpackage === RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE, 'DOM Descriptor fixture is owned by WP-E18-05');
  context.assert(fixture.manifest.metadata.manualHtmlRendererAllowed === false, 'DOM Descriptor fixture forbids manual HTML renderer');
  context.assert(fixture.manifest.metadata.normalUiAllowsManualHtml === false, 'DOM Descriptor fixture forbids normal UI manual HTML');
  context.assert(fixture.manifest.metadata.trustedHtmlBoundary === TRUSTED_DOM_BOUNDARY, 'DOM Descriptor fixture declares trusted boundary');
  assertFixtureGraph(context, fixture);
  context.assert(rendererModule.RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA === RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA, 'runtime module exports renderer schema');
  context.assert(typeof rendererModule.createRmtDomDescriptorRenderer === 'function', 'runtime module exports renderer factory');
  context.assert(typeof rendererModule.createNoManualHtmlGate === 'function', 'runtime module exports no-manual-HTML gate');
  runRendererBehaviorAssertions(context, fixture, rendererModule);
  runCommitCoreAssertions(context, rendererModule);
  runSecurityAssertions(context, fixture, rendererModule);
  runNoManualHtmlGateAssertions(context, rootDir, rendererModule);

  assertTextIncludesAll(context, runtimeSource, [
    'createRmtDomDescriptorRenderer',
    'createNoManualHtmlGate',
    'createElement',
    'createTextNode',
    'createDocumentFragment',
    'replaceChildren',
    'data-rmt-key',
    RMT_DOM_RENDERER_DIAGNOSTIC_SCHEMA,
    TRUSTED_DOM_BOUNDARY
  ], 'DOM Descriptor renderer runtime');
  context.assert(!/\.\s*innerHTML\s*=/u.test(runtimeSource), 'runtime source has no innerHTML assignment sink');
  context.assert(!/insertAdjacentHTML\s*\(/u.test(runtimeSource), 'runtime source has no insertAdjacentHTML sink');
  context.assert(!/\.addEventListener\s*\(/u.test(runtimeSource), 'descriptor renderer installs no application event listener');
  assertTextIncludesAll(context, typeSource, [
    'RmtDomDescriptorRenderer',
    'RmtDomCommitRequest',
    'RmtDomCommitResult',
    'RmtDomApplicationBindingRecord',
    'RmtDomBindingScope',
    'commit(request:',
    'dispose(target?:',
    'createRmtDomDescriptorRenderer',
    'createNoManualHtmlGate'
  ], 'DOM Descriptor renderer types');
  assertTextIncludesAll(context, docs, [
    '# RMT DOM Descriptor Renderer',
    RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
    'createElement',
    'replaceChildren',
    'keyed',
    'No-Manual-HTML',
    NEXT_WORKPACKAGE
  ], 'DOM Descriptor renderer docs');
  assertTextIncludesAll(context, workpackageDoc, [
    RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE,
    RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
    RMT_DOM_DESCRIPTOR_RENDERER_LOCAL_GATE,
    'Status: `completed`',
    NEXT_WORKPACKAGE
  ], 'WP-E18-05 workpackage doc');
  context.assert(backlog.includes('| `WP-E18-05` | P0 | completed'), 'Backlog marks WP-E18-05 completed');
  context.assert(
    backlog.includes('| `WP-E18-06` | P0 | ready') || backlog.includes('| `WP-E18-06` | P0 | completed'),
    'Backlog marks WP-E18-06 ready or completed after renderer'
  );
  context.assert(epic.includes('| `WP-E18-05` | P0 | completed'), 'Epic marks WP-E18-05 completed');
  context.assert(epic.includes('rmt-dom-descriptor-renderer'), 'Epic gate chain includes DOM Descriptor renderer gate');
  context.assert(runner.includes("require('../tests/rmt/rmt_dom_descriptor_renderer_suite')"), 'Runner imports DOM Descriptor renderer suite');
  context.assert(runner.includes("id: 'rmt-dom-descriptor-renderer'"), 'Runner registers DOM Descriptor renderer suite');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:rmt-dom-descriptor-renderer'] === 'node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer', 'Package exposes DOM Descriptor renderer script');
  context.assert(packageManifest.exports && packageManifest.exports['./rmt/dom-descriptor-renderer'], 'Package exports DOM Descriptor renderer');
  const packageMetadata = packageManifest.xtend && packageManifest.xtend.rmtDomDescriptorRenderer;
  context.assert(packageMetadata && packageMetadata.schema === RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA, 'Package metadata exposes DOM Descriptor renderer schema');
  context.assert(packageMetadata && packageMetadata.localGate === RMT_DOM_DESCRIPTOR_RENDERER_LOCAL_GATE, 'Package metadata exposes DOM Descriptor renderer local gate');
  context.assert(packageMetadata && packageMetadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes WP-E18-06 handoff');

  return context.result({
    schema: RMT_DOM_DESCRIPTOR_RENDERER_REPORT_SCHEMA,
    fixture: RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE,
    runtime: RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  });
}

function printRmtDomDescriptorRendererReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 18 RMT DOM Descriptor Renderer erfolgreich.',
    failureTitle: 'Epic 18 RMT DOM Descriptor Renderer fehlgeschlagen:'
  });
}

if (require.main === module) {
  runRmtDomDescriptorRendererSuite()
    .then((result) => {
      printRmtDomDescriptorRendererReport(result);
      if (!result.ok) process.exit(1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  printRmtDomDescriptorRendererReport,
  runRmtDomDescriptorRendererSuite
};

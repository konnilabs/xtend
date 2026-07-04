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

const RMT_COMPONENT_CAPABILITY_REGISTRY_PATH = 'xtendrmt/rmt-component-capability-registry.js';
const RMT_COMPONENT_CAPABILITY_REGISTRY_TYPES = 'xtendrmt/rmt-component-capability-registry.d.ts';
const RMT_DOM_DESCRIPTOR_RENDERER_PATH = 'xtendrmt/rmt-dom-descriptor-renderer.js';
const RMT_VNEXT_COMPONENT_PRIMITIVES_SCHEMA = 'xtend.rmt.component-capability-registry.v1';
const RMT_VNEXT_COMPONENT_PRIMITIVES_REPORT_SCHEMA = 'xtend.rmt.component-capability-registry-report.v1';
const RMT_VNEXT_COMPONENT_PRIMITIVES_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-vnext-component-primitives --json';
const RMT_VNEXT_COMPONENT_PRIMITIVES_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-component-primitives';
const RMT_VNEXT_COMPONENT_PRIMITIVES_EXPORT = './rmt/component-capability-registry';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function createSourceTexts(manifest, rootDir) {
  return Object.fromEntries(Object.entries(manifest).map(([tag, modulePath]) => [
    tag,
    readText(path.join('components', modulePath.replace(/^\.\//u, '')), rootDir)
  ]));
}

function createFakeText(text) {
  return {
    nodeType: 3,
    textContent: String(text == null ? '' : text),
    parentNode: null
  };
}

function toDatasetKey(name) {
  return String(name || '').replace(/^data-/u, '').replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
}

function createFakeElement(tagName = 'div') {
  const attributes = {};
  const listeners = new Map();
  const element = {
    nodeType: 1,
    tagName: String(tagName || 'div').toUpperCase(),
    localName: String(tagName || 'div').toLowerCase(),
    attributes,
    dataset: {},
    childNodes: [],
    children: [],
    parentNode: null,
    value: '',
    checked: false,
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
      if (String(name).startsWith('data-')) this.dataset[toDatasetKey(name)] = String(value);
      if (name === 'id') this.id = String(value);
      if (name === 'name') this.name = String(value);
      if (name === 'value') this.value = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, String(name)) ? attributes[String(name)] : null;
    },
    removeAttribute(name) {
      delete attributes[String(name)];
      if (String(name).startsWith('data-')) delete this.dataset[toDatasetKey(name)];
    },
    addEventListener(name, listener) {
      const key = String(name);
      const bucket = listeners.get(key) || [];
      bucket.push(listener);
      listeners.set(key, bucket);
    },
    removeEventListener(name, listener) {
      const key = String(name);
      listeners.set(key, (listeners.get(key) || []).filter((entry) => entry !== listener));
    },
    dispatchEvent(event) {
      const dispatched = {
        ...event,
        type: event.type,
        target: event.target || this,
        currentTarget: event.currentTarget || this
      };
      (listeners.get(String(event.type)) || []).slice().forEach((listener) => listener(dispatched));
      return true;
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

async function runRmtVNextComponentPrimitivesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-component-primitives',
    label: 'RMT vNext XTend Component Primitive Compatibility'
  });
  const manifest = readJson('components/manifest.json', rootDir);
  const sourceTexts = createSourceTexts(manifest, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const xtendrmtManifest = readJson('xtendrmt/package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const registrySource = readText(RMT_COMPONENT_CAPABILITY_REGISTRY_PATH, rootDir);
  const registryTypes = readText(RMT_COMPONENT_CAPABILITY_REGISTRY_TYPES, rootDir);
  const rendererSource = readText(RMT_DOM_DESCRIPTOR_RENDERER_PATH, rootDir);
  const registrySyntax = syntaxCheckFile(RMT_COMPONENT_CAPABILITY_REGISTRY_PATH, { rootDir, extension: '.js' });
  const registryApi = await import(`file://${resolveRepoPath(RMT_COMPONENT_CAPABILITY_REGISTRY_PATH, rootDir)}`);
  const rendererApi = await import(`file://${resolveRepoPath(RMT_DOM_DESCRIPTOR_RENDERER_PATH, rootDir)}`);

  assertFileExists(context, RMT_COMPONENT_CAPABILITY_REGISTRY_PATH, rootDir, 'component capability registry runtime exists');
  assertFileExists(context, RMT_COMPONENT_CAPABILITY_REGISTRY_TYPES, rootDir, 'component capability registry declarations exist');
  context.assert(registrySyntax.ok, `component capability registry syntax passes${registrySyntax.ok ? '' : ` (${registrySyntax.message})`}`);
  context.assert(registryApi.RMT_COMPONENT_CAPABILITY_REGISTRY_SCHEMA === RMT_VNEXT_COMPONENT_PRIMITIVES_SCHEMA, 'registry exposes stable schema');
  context.assert(registryApi.RMT_COMPONENT_CAPABILITY_REPORT_SCHEMA === RMT_VNEXT_COMPONENT_PRIMITIVES_REPORT_SCHEMA, 'registry exposes report schema');
  context.assert(registryApi.RMT_COMPONENT_IMPORT_POLICY === 'explicit-importer-only', 'registry uses explicit importer policy');
  context.assert(!/from ['"]\.\.\/components|from ['"]\.\/components|import\(['"]\.\.\/components|import\(['"]\.\/components/u.test(registrySource), 'registry does not import XTend components directly');
  context.assert(!registrySource.includes('shadowRoot'), 'registry does not patch component shadowRoot internals');
  context.assert(!registrySource.includes('innerHTML'), 'registry runtime has no manual HTML sink');

  const registry = registryApi.createRmtComponentCapabilityRegistry({ manifest, sourceTexts });
  const matrix = registry.createMatrixReport();
  context.assert(matrix.ok === true, 'component primitive matrix passes');
  context.assert(matrix.manifestCount === Object.keys(manifest).length, 'matrix covers all public manifest entries');
  context.assert(matrix.publicComponentCount === 42, 'matrix classifies renderable public UI components');
  context.assert(matrix.nonVisualCount === 5, 'matrix classifies module/demo/utility entries outside normal DOM rendering');
  context.assert(matrix.withRmtMetadata === 44, 'matrix preserves existing RMT metadata coverage');
  context.assert(matrix.withComponentContract === 42, 'matrix preserves existing Component Contract coverage');
  context.assert(matrix.formAssociatedCount === 7, 'matrix detects form-associated components');
  context.assert(matrix.diagnostics.length === 0, 'matrix has no compatibility diagnostics');
  ['form', 'navigation', 'overlay-surface', 'media-feedback-layout', 'theme-layout', 'infrastructure-module'].forEach((family) => {
    context.assert(matrix.familyCounts[family] > 0, `matrix covers ${family} family`);
  });
  ['form', 'navigation', 'overlay-surface', 'media-feedback-layout', 'theme-layout'].forEach((family) => {
    context.assert(matrix.browserSmokeFamilies.includes(family), `tiered gate marks ${family} for representative browser smoke`);
  });

  const selectCapability = registry.resolveComponentCapability('x-select');
  context.assert(selectCapability && selectCapability.family === 'form', 'registry resolves x-select as form component');
  context.assert(selectCapability && selectCapability.observedAttributes.includes('value'), 'registry exposes observed attributes');
  context.assert(selectCapability && selectCapability.events.includes('select-changed'), 'registry exposes custom component events');
  context.assert(selectCapability && selectCapability.slots.includes('label'), 'registry exposes slots');
  context.assert(selectCapability && selectCapability.parts.includes('control'), 'registry exposes parts');
  context.assert(selectCapability && selectCapability.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'registry preserves kernel boundary');
  context.assert(registry.resolveComponentCapability('x-utils').visualKind === 'non-visual-utility', 'x-utils is classified as utility module');
  context.assert(registry.resolveComponentCapability('x-rmt-lifecycle-demo-build').visualKind === 'demo-non-production', 'lifecycle demo is classified outside production UI');
  context.assert(registry.resolveComponentCapability('x-theme').visualKind === 'infrastructure-module', 'x-theme is classified as infrastructure module');
  context.assert(registry.resolveComponentCapability('xstate').visualKind === 'infrastructure-module', 'xstate is classified as infrastructure module');

  const descriptor = registry.buildComponentDescriptor({
    tag: 'x-select',
    id: 'plan-select',
    key: 'plan-select',
    attributes: {
      name: 'plan',
      value: 'pro'
    },
    properties: {
      value: 'pro'
    },
    slots: {
      label: { text: 'Plan' }
    },
    events: {
      'select-changed': 'plan.changed'
    }
  });
  context.assert(descriptor.schema === 'xtend.rmt.component-descriptor.v1', 'registry builds component descriptor schema');
  context.assert(descriptor.type === 'component' && descriptor.tag === 'x-select', 'descriptor targets XTend custom element');
  context.assert(descriptor.key === 'plan-select', 'descriptor keeps stable key');
  context.assert(descriptor.attributes['data-rmt-component-family'] === 'form', 'descriptor adds family marker');
  context.assert(descriptor.attributes['data-rmt-lazy-import'] === './xselect.js', 'descriptor records lazy import module path');
  context.assert(descriptor.events['select-changed'] === 'plan.changed', 'descriptor carries event bindings');

  const dispatched = [];
  const stateWrites = [];
  const documentTarget = createFakeDocument();
  const root = createFakeElement('main');
  const renderer = rendererApi.createRmtDomDescriptorRenderer({ documentTarget });
  const nodes = renderer.renderKeyed(root, [descriptor], {
    componentRegistry: registry,
    dispatchEvent: (event) => dispatched.push(event),
    stateBridge: {
      read(key) {
        return key === 'xselect-value-plan' ? 'starter' : undefined;
      },
      write(key, value) {
        stateWrites.push({ key, value });
      }
    }
  });
  const selectNode = nodes[0];
  context.assert(selectNode.localName === 'x-select', 'renderer materializes XTend component tag through registry');
  context.assert(selectNode.getAttribute('data-rmt-component-capability') === 'x-select', 'renderer applies registry capability marker');
  context.assert(selectNode.getAttribute('name') === 'plan', 'renderer applies component attributes');
  context.assert(selectNode.getAttribute('value') === 'starter', 'state bridge initializes component value');
  context.assert(selectNode._listeners.get('select-changed').length >= 2, 'renderer binds descriptor and registry component events');
  selectNode.value = 'enterprise';
  selectNode.dispatchEvent({ type: 'select-changed', detail: { value: 'enterprise' } });
  context.assert(dispatched.length === 2, 'component event reaches RMT dispatcher from renderer and registry');
  context.assert(dispatched.some((entry) => entry.action === 'plan.changed'), 'registry dispatches configured component action');
  context.assert(stateWrites.some((entry) => entry.value === 'enterprise'), 'state bridge receives component value update');

  const importCalls = [];
  const loadReport = await registry.ensureComponentLoaded('x-player', {
    importer(modulePath, capability) {
      importCalls.push({ modulePath, tag: capability.tag });
    }
  });
  context.assert(loadReport.ok === true && loadReport.status === 'loaded', 'registry lazy import hook resolves component');
  context.assert(importCalls.length === 1 && importCalls[0].modulePath === './xplayer.js', 'lazy import uses manifest module path');
  context.assert(registry.ensureComponentLoaded('x-player') instanceof Promise, 'ensureComponentLoaded stays async for browser hosts');

  context.assert(packageManifest.exports[RMT_VNEXT_COMPONENT_PRIMITIVES_EXPORT] && packageManifest.exports[RMT_VNEXT_COMPONENT_PRIMITIVES_EXPORT].types === './xtendrmt/rmt-component-capability-registry.d.ts', 'package exports component capability registry types');
  context.assert(xtendrmtManifest.exports['./component-capability-registry'] && xtendrmtManifest.exports['./component-capability-registry'].types === './rmt-component-capability-registry.d.ts', 'xtendrmt package exports component capability registry types');
  context.assert(packageManifest.scripts['test:rmt-vnext-component-primitives'] === 'node scripts/run_xtend_tests.js rmt-vnext-component-primitives', 'package exposes component primitive script');
  context.assert(packageManifest.scripts['test:rmt-vnext-primitives'].includes('rmt-vnext-component-primitives'), 'primitive aggregate includes component primitive gate');
  context.assert(packageManifest.scripts['test:rmt-vnext-primitives:report'].includes('rmt-vnext-component-primitives'), 'primitive report aggregate includes component primitive gate');
  context.assert(packageManifest.xtend.ciGateMatrix.rmtVNextPrimitiveGate.suites.includes('rmt-vnext-component-primitives'), 'CI primitive gate metadata includes component primitive suite');
  context.assertIncludes(runner, "id: 'rmt-vnext-component-primitives'", 'runner registers component primitive suite');
  context.assertIncludes(rendererSource, 'componentRegistry', 'DOM descriptor renderer accepts component registry');
  assertTextIncludesAll(context, registryTypes, [
    'RmtComponentCapabilityRegistry',
    'RmtComponentCapability',
    'RmtComponentPrimitiveMatrixReport',
    'createRmtComponentCapabilityRegistry'
  ], 'registry declarations');

  return context.result({
    report: {
      schema: RMT_VNEXT_COMPONENT_PRIMITIVES_REPORT_SCHEMA,
      manifestCount: matrix.manifestCount,
      publicComponentCount: matrix.publicComponentCount,
      nonVisualCount: matrix.nonVisualCount,
      familyCounts: matrix.familyCounts,
      browserSmokeFamilies: matrix.browserSmokeFamilies,
      localGate: RMT_VNEXT_COMPONENT_PRIMITIVES_LOCAL_GATE,
      packageScript: RMT_VNEXT_COMPONENT_PRIMITIVES_PACKAGE_SCRIPT
    }
  });
}

function printRmtVNextComponentPrimitivesReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT vNext XTend Component Primitive Compatibility erfolgreich.',
    failureTitle: 'RMT vNext XTend Component Primitive Compatibility fehlgeschlagen:'
  });
}

if (require.main === module) {
  runRmtVNextComponentPrimitivesSuite()
    .then((result) => {
      printRmtVNextComponentPrimitivesReport(result);
      if (!result.ok) process.exit(1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  RMT_VNEXT_COMPONENT_PRIMITIVES_LOCAL_GATE,
  RMT_VNEXT_COMPONENT_PRIMITIVES_PACKAGE_SCRIPT,
  RMT_VNEXT_COMPONENT_PRIMITIVES_REPORT_SCHEMA,
  RMT_VNEXT_COMPONENT_PRIMITIVES_SCHEMA,
  printRmtVNextComponentPrimitivesReport,
  runRmtVNextComponentPrimitivesSuite
};

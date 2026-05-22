(function attachRmtComponentCapabilityRegistry(globalTarget) {
  const RMT_COMPONENT_CAPABILITY_REGISTRY_SCHEMA = 'xtend.rmt.component-capability-registry.v1';
  const RMT_COMPONENT_CAPABILITY_REPORT_SCHEMA = 'xtend.rmt.component-capability-registry-report.v1';
  const RMT_COMPONENT_BINDING_SCHEMA = 'xtend.rmt.component-binding.v1';
  const RMT_COMPONENT_DESCRIPTOR_SCHEMA = 'xtend.rmt.component-descriptor.v1';
  const RMT_COMPONENT_DIAGNOSTIC_SCHEMA = 'xtend.rmt.component-capability-diagnostic.v1';
  const RMT_COMPONENT_KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
  const RMT_COMPONENT_IMPORT_POLICY = 'explicit-importer-only';

  const FORM_COMPONENTS = new Set(['x-calendar', 'x-checkbox', 'x-form', 'x-input', 'x-radio', 'x-select', 'x-textarea']);
  const NAVIGATION_COMPONENTS = new Set(['x-router', 'x-link', 'x-menu', 'x-drawer']);
  const OVERLAY_SURFACE_COMPONENTS = new Set(['x-dialog', 'x-lightbox', 'x-modal', 'x-popover', 'x-side-panel', 'x-surface-manager', 'x-surface-window', 'x-toast', 'x-tooltip']);
  const MEDIA_FEEDBACK_LAYOUT_COMPONENTS = new Set(['x-alert', 'x-button', 'x-cards', 'x-code', 'x-icon', 'x-masonry', 'x-player', 'x-progress', 'x-spinner', 'x-status', 'x-summary', 'x-type', 'x-writer']);
  const THEME_LAYOUT_COMPONENTS = new Set(['x-footer', 'x-header', 'x-hero', 'x-section', 'x-tabs', 'x-theme', 'xstate']);
  const NON_VISUAL_COMPONENTS = new Set(['x-utils']);
  const DEMO_COMPONENTS = new Set(['x-rmt-lifecycle-demo-build']);
  const INFRASTRUCTURE_COMPONENTS = new Set(['x-theme', 'xstate']);
  const BROWSER_SMOKE_FAMILIES = Object.freeze(['form', 'navigation', 'overlay-surface', 'media-feedback-layout', 'theme-layout']);

  function clampString(value, fallback = '') {
    const normalized = String(value == null ? '' : value).trim();
    return normalized || fallback;
  }

  function toArray(value) {
    return Array.isArray(value) ? value : (value == null ? [] : [value]);
  }

  function objectRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function cloneValue(value, fallback = null) {
    if (typeof value === 'undefined') return fallback;
    if (value === null || typeof value !== 'object') return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return value;
    }
  }

  function unique(values) {
    return Array.from(new Set(toArray(values).map((entry) => clampString(entry)).filter(Boolean)));
  }

  function normalizeTag(tag) {
    return clampString(tag).toLowerCase();
  }

  function stripLocalModulePath(modulePath) {
    return clampString(modulePath).replace(/^\.\//u, '');
  }

  function sourceTextFor(tag, modulePath, options = {}) {
    const sourceTexts = objectRecord(options.sourceTexts || options.sources);
    const normalizedTag = normalizeTag(tag);
    const normalizedModulePath = clampString(modulePath);
    const localModulePath = stripLocalModulePath(normalizedModulePath);
    return String(
      sourceTexts[normalizedTag]
      || sourceTexts[normalizedModulePath]
      || sourceTexts[localModulePath]
      || ''
    );
  }

  function extractStringValues(sourceText, pattern) {
    const values = [];
    for (const match of String(sourceText || '').matchAll(pattern)) {
      values.push(match[1]);
    }
    return unique(values);
  }

  function extractArrayGetterStrings(sourceText, getterName) {
    const escapedGetter = getterName.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const pattern = new RegExp(`static\\s+get\\s+${escapedGetter}\\s*\\(\\)\\s*\\{[\\s\\S]*?return\\s*\\[([\\s\\S]*?)\\]`, 'u');
    const match = String(sourceText || '').match(pattern);
    if (!match) return [];
    return extractStringValues(match[1], /['"]([^'"]+)['"]/gu);
  }

  function extractStringProperty(sourceText, propertyName) {
    const escapedName = propertyName.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const pattern = new RegExp(`${escapedName}\\s*:\\s*['"]([^'"]+)['"]`, 'u');
    const match = String(sourceText || '').match(pattern);
    return match ? match[1] : '';
  }

  function extractEvents(sourceText) {
    return extractStringValues(sourceText, /dispatchEvent\s*\(\s*new\s+(?:CustomEvent|Event)\s*\(\s*['"]([^'"]+)['"]/gu);
  }

  function extractParts(sourceText) {
    return unique(extractStringValues(sourceText, /part=["']([^"']+)["']/gu).flatMap((entry) => entry.split(/\s+/u)));
  }

  function extractSlots(sourceText) {
    const source = String(sourceText || '');
    const namedSlots = extractStringValues(source, /<slot\b[^>]*\bname=["']([^"']+)["'][^>]*>/gu);
    if (/<slot\b/u.test(source)) namedSlots.unshift('default');
    return unique(namedSlots);
  }

  function safeStaticValue(componentClass, propertyName) {
    try {
      return componentClass && componentClass[propertyName];
    } catch (_) {
      return null;
    }
  }

  function resolveComponentClass(tag, options = {}) {
    const constructors = options.componentConstructors || options.constructors || {};
    if (constructors instanceof Map && constructors.has(tag)) return constructors.get(tag);
    if (constructors && constructors[tag]) return constructors[tag];
    const customElementsRegistry = options.customElements || (globalTarget && globalTarget.customElements);
    if (customElementsRegistry && typeof customElementsRegistry.get === 'function') {
      return customElementsRegistry.get(tag) || null;
    }
    return null;
  }

  function classifyComponentFamily(tag, sourceText = '', metadata = {}) {
    const normalizedTag = normalizeTag(tag);
    if (NON_VISUAL_COMPONENTS.has(normalizedTag)) return 'non-visual-utility';
    if (DEMO_COMPONENTS.has(normalizedTag)) return 'demo-non-production';
    if (INFRASTRUCTURE_COMPONENTS.has(normalizedTag)) return 'infrastructure-module';
    if (FORM_COMPONENTS.has(normalizedTag) || metadata.formAssociated === true) return 'form';
    if (NAVIGATION_COMPONENTS.has(normalizedTag)) return 'navigation';
    if (OVERLAY_SURFACE_COMPONENTS.has(normalizedTag) || /surface|overlay|modal|popover|tooltip|toast/u.test(normalizedTag)) return 'overlay-surface';
    if (MEDIA_FEEDBACK_LAYOUT_COMPONENTS.has(normalizedTag)) return 'media-feedback-layout';
    if (THEME_LAYOUT_COMPONENTS.has(normalizedTag)) return 'theme-layout';
    if (/formAssociated\s*=\s*true/u.test(sourceText)) return 'form';
    return 'general-ui';
  }

  function sourceRmtMetadata(tag, sourceText) {
    if (!String(sourceText || '').includes('xtendRmtMetadata')) return null;
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: extractStringProperty(sourceText, 'adapter') || 'xtend.component',
      tag,
      templateMode: extractStringProperty(sourceText, 'templateMode') || 'dom_descriptor',
      eventBindingMode: extractStringProperty(sourceText, 'eventBindingMode') || 'dom-event-to-rmt-command',
      kernelBoundary: String(sourceText).includes(RMT_COMPONENT_KERNEL_BOUNDARY) ? RMT_COMPONENT_KERNEL_BOUNDARY : ''
    };
  }

  function sourceComponentContract(tag, sourceText, modulePath) {
    if (!String(sourceText || '').includes('xtendComponentContract')) return null;
    return {
      schema: 'xtend.component.contract.v2',
      tag,
      runtime: {
        format: 'esm',
        artifact: `components/${stripLocalModulePath(modulePath)}`,
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        kernelBoundary: RMT_COMPONENT_KERNEL_BOUNDARY
      }
    };
  }

  function normalizeCapability(tag, modulePath, options = {}) {
    const normalizedTag = normalizeTag(tag);
    const sourceText = sourceTextFor(normalizedTag, modulePath, options);
    const componentClass = resolveComponentClass(normalizedTag, options);
    const metadataRecord = objectRecord(options.componentMetadata && options.componentMetadata[normalizedTag]);
    const contract = safeStaticValue(componentClass, 'xtendComponentContract') || metadataRecord.xtendComponentContract || sourceComponentContract(normalizedTag, sourceText, modulePath);
    const rmtMetadata = safeStaticValue(componentClass, 'xtendRmtMetadata') || metadataRecord.xtendRmtMetadata || sourceRmtMetadata(normalizedTag, sourceText);
    const a11yProfile = safeStaticValue(componentClass, 'xtendScaffoldA11yProfile') || metadataRecord.xtendScaffoldA11yProfile || null;
    const performanceProfile = safeStaticValue(componentClass, 'xtendScaffoldPerformanceProfile') || metadataRecord.xtendScaffoldPerformanceProfile || null;
    const observedAttributes = unique(
      safeStaticValue(componentClass, 'observedAttributes')
      || metadataRecord.observedAttributes
      || extractArrayGetterStrings(sourceText, 'observedAttributes')
    );
    const events = unique([
      ...toArray(rmtMetadata && rmtMetadata.shellAuthoring && rmtMetadata.shellAuthoring.events),
      ...toArray(metadataRecord.events),
      ...extractEvents(sourceText)
    ]);
    const parts = unique([
      ...toArray(metadataRecord.parts),
      ...extractParts(sourceText)
    ]);
    const slots = unique([
      ...toArray(metadataRecord.slots),
      ...extractSlots(sourceText)
    ]);
    const formAssociated = Boolean(
      safeStaticValue(componentClass, 'formAssociated')
      || metadataRecord.formAssociated
      || /static\s+formAssociated\s*=\s*true/u.test(sourceText)
    );
    const family = classifyComponentFamily(normalizedTag, sourceText, { formAssociated });
    const visualKind = family === 'non-visual-utility' || family === 'demo-non-production' || family === 'infrastructure-module'
      ? family
      : 'public-ui';
    const hasCustomElement = Boolean(componentClass || new RegExp(`customElements\\.define\\(\\s*['"]${normalizedTag}['"]`, 'u').test(sourceText));
    const diagnostics = [];

    if (visualKind === 'public-ui' && !rmtMetadata) {
      diagnostics.push({
        schema: RMT_COMPONENT_DIAGNOSTIC_SCHEMA,
        code: 'rmt.component.rmt-metadata-missing',
        severity: 'error',
        tag: normalizedTag,
        message: `${normalizedTag} needs xtendRmtMetadata for RMT primitive compatibility.`
      });
    }
    if (visualKind === 'public-ui' && !contract) {
      diagnostics.push({
        schema: RMT_COMPONENT_DIAGNOSTIC_SCHEMA,
        code: 'rmt.component.contract-missing',
        severity: 'error',
        tag: normalizedTag,
        message: `${normalizedTag} needs xtendComponentContract for RMT primitive compatibility.`
      });
    }

    return Object.freeze({
      schema: RMT_COMPONENT_CAPABILITY_REGISTRY_SCHEMA,
      tag: normalizedTag,
      modulePath: clampString(modulePath),
      importPolicy: RMT_COMPONENT_IMPORT_POLICY,
      visualKind,
      family,
      customElement: hasCustomElement,
      formAssociated,
      componentContract: cloneValue(contract, null),
      rmt: cloneValue(rmtMetadata, null),
      a11yProfile: cloneValue(a11yProfile, null),
      performanceProfile: cloneValue(performanceProfile, null),
      observedAttributes,
      events,
      slots,
      parts,
      sourceToSeaRisk: BROWSER_SMOKE_FAMILIES.includes(family) ? 'browser-smoke-representative' : 'contract-runtime-matrix',
      kernelBoundary: (rmtMetadata && rmtMetadata.kernelBoundary) || (contract && contract.rmt && contract.rmt.kernelBoundary) || (sourceText.includes(RMT_COMPONENT_KERNEL_BOUNDARY) ? RMT_COMPONENT_KERNEL_BOUNDARY : ''),
      diagnostics
    });
  }

  function stateKeyForElement(tag, element, kind = 'value') {
    const normalizedTag = normalizeTag(tag).replace(/-/gu, '');
    const id = clampString(
      element && (element.getAttribute && (element.getAttribute('id') || element.getAttribute('name')))
      || element && (element.id || element.name),
      'default'
    );
    if (tag === 'x-checkbox') return `xcheckbox-checked-${id}`;
    if (tag === 'x-radio' && kind === 'groupValue') return `xradio-value-${id}`;
    if (tag === 'x-radio') return `xradio-checked-${id}`;
    if (tag === 'x-status') return `xstatus-state-${id}`;
    if (tag === 'x-progress') return `xprogress-value-${id}`;
    return `${normalizedTag}-value-${id}`;
  }

  function readElementValue(element, capability = null) {
    if (!element) return undefined;
    const tag = capability && capability.tag || normalizeTag(element.localName || element.tagName);
    if ((tag === 'x-checkbox' || tag === 'x-radio') && 'checked' in element && typeof element.checked === 'boolean') return element.checked;
    if ('value' in element) return element.value;
    if ('checked' in element && typeof element.checked === 'boolean') return element.checked;
    if (typeof element.getAttribute === 'function') return element.getAttribute('value');
    return undefined;
  }

  function writeElementValue(element, value) {
    if (!element) return;
    if ('checked' in element && typeof value === 'boolean') element.checked = value;
    if ('value' in element) element.value = value;
    if (typeof element.setAttribute === 'function' && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
      element.setAttribute('value', String(value));
    }
  }

  function datasetRecord(target) {
    const dataset = target && target.dataset && typeof target.dataset === 'object' ? target.dataset : {};
    const result = {};
    Object.keys(dataset).forEach((key) => {
      result[key] = dataset[key];
    });
    return result;
  }

  function fileSummary(file) {
    return {
      name: clampString(file && file.name),
      size: Number.isFinite(file && file.size) ? file.size : 0,
      type: clampString(file && file.type),
      lastModified: Number.isFinite(file && file.lastModified) ? file.lastModified : null
    };
  }

  function filesToArray(files) {
    if (!files) return [];
    try {
      return Array.from(files).map(fileSummary);
    } catch (_) {
      const result = [];
      for (let index = 0; index < (files.length || 0); index += 1) {
        result.push(fileSummary(files[index]));
      }
      return result;
    }
  }

  function adaptComponentEventPayload(capability, event) {
    const target = event && (event.target || event.currentTarget) || null;
    const detail = event && event.detail && typeof event.detail === 'object' ? event.detail : {};
    return {
      schema: 'xtend.rmt.component-event-payload.v1',
      tag: capability && capability.tag || normalizeTag(target && (target.localName || target.tagName)),
      family: capability && capability.family || 'unknown',
      eventName: clampString(event && event.type),
      detail: cloneValue(detail, {}),
      value: readElementValue(target, capability),
      checked: target && typeof target.checked === 'boolean' ? target.checked : undefined,
      files: filesToArray(target && target.files),
      dataset: datasetRecord(target),
      validity: target && target.validity ? cloneValue(target.validity, {}) : undefined
    };
  }

  function normalizeEventBindings(input) {
    if (Array.isArray(input)) {
      return input.map((entry) => (typeof entry === 'string' ? { event: entry, action: entry } : objectRecord(entry)))
        .filter((entry) => clampString(entry.event || entry.eventName));
    }
    return Object.entries(objectRecord(input)).map(([eventName, action]) => ({
      event: eventName,
      action
    }));
  }

  function createRmtComponentCapabilityRegistry(options = {}) {
    const manifest = objectRecord(options.manifest);
    const diagnostics = [];
    const capabilityMap = new Map();

    Object.entries(manifest).forEach(([tag, modulePath]) => {
      const capability = normalizeCapability(tag, modulePath, options);
      capabilityMap.set(capability.tag, capability);
      diagnostics.push(...capability.diagnostics);
    });

    function resolveComponentCapability(tag) {
      return capabilityMap.get(normalizeTag(tag)) || null;
    }

    function listCapabilities(filter = {}) {
      const family = clampString(filter.family);
      const visualKind = clampString(filter.visualKind);
      return Array.from(capabilityMap.values()).filter((capability) => {
        if (family && capability.family !== family) return false;
        if (visualKind && capability.visualKind !== visualKind) return false;
        return true;
      });
    }

    function buildComponentDescriptor(input = {}, descriptorOptions = {}) {
      const record = objectRecord(input);
      const tag = normalizeTag(record.tag || record.componentTag || record.component || record.host);
      const capability = resolveComponentCapability(tag);
      if (!capability) {
        diagnostics.push({
          schema: RMT_COMPONENT_DIAGNOSTIC_SCHEMA,
          code: 'rmt.component.capability-missing',
          severity: 'error',
          tag,
          message: `${tag} is not registered in the RMT component capability registry.`
        });
      }
      const key = clampString(record.key || record.id || record.ref, `${tag || 'component'}:default`);
      const attributes = {
        ...objectRecord(record.attributes),
        'data-rmt-component-capability': tag,
        'data-rmt-component-family': capability ? capability.family : 'unknown',
        'data-rmt-kernel-boundary': capability ? capability.kernelBoundary : RMT_COMPONENT_KERNEL_BOUNDARY
      };
      if (capability && capability.modulePath) {
        attributes['data-rmt-lazy-import'] = capability.modulePath;
      }
      return {
        schema: RMT_COMPONENT_DESCRIPTOR_SCHEMA,
        type: 'component',
        component: clampString(record.component || record.id, tag),
        tag,
        key,
        attributes,
        properties: {
          ...objectRecord(record.properties),
          ...objectRecord(record.props)
        },
        slots: objectRecord(record.slots),
        parts: unique([...toArray(record.parts), ...toArray(record.part)]),
        events: objectRecord(record.events || record.eventBindings),
        bindings: toArray(record.bindings),
        capability: capability ? {
          schema: capability.schema,
          tag: capability.tag,
          family: capability.family,
          visualKind: capability.visualKind,
          modulePath: capability.modulePath
        } : null,
        source: descriptorOptions.source || record.source || null
      };
    }

    async function ensureComponentLoaded(tag, loadOptions = {}) {
      const capability = resolveComponentCapability(tag);
      if (!capability) {
        return {
          schema: RMT_COMPONENT_CAPABILITY_REPORT_SCHEMA,
          status: 'missing-capability',
          ok: false,
          tag: normalizeTag(tag)
        };
      }
      const customElementsRegistry = loadOptions.customElements || options.customElements || (globalTarget && globalTarget.customElements);
      if (customElementsRegistry && typeof customElementsRegistry.get === 'function' && customElementsRegistry.get(capability.tag)) {
        return {
          schema: RMT_COMPONENT_CAPABILITY_REPORT_SCHEMA,
          status: 'already-defined',
          ok: true,
          tag: capability.tag,
          modulePath: capability.modulePath
        };
      }
      const importer = loadOptions.importComponent || loadOptions.importer || options.importComponent || options.importer;
      if (typeof importer === 'function') {
        await importer(capability.modulePath, capability);
        if (customElementsRegistry && typeof customElementsRegistry.whenDefined === 'function') {
          await customElementsRegistry.whenDefined(capability.tag);
        }
        return {
          schema: RMT_COMPONENT_CAPABILITY_REPORT_SCHEMA,
          status: 'loaded',
          ok: true,
          tag: capability.tag,
          modulePath: capability.modulePath,
          importPolicy: RMT_COMPONENT_IMPORT_POLICY
        };
      }
      return {
        schema: RMT_COMPONENT_CAPABILITY_REPORT_SCHEMA,
        status: 'importer-required',
        ok: false,
        tag: capability.tag,
        modulePath: capability.modulePath,
        importPolicy: RMT_COMPONENT_IMPORT_POLICY
      };
    }

    function bindComponentInstance(element, binding = {}, bindOptions = {}) {
      const localName = normalizeTag(
        binding.tag
        || bindOptions.tag
        || element && (element.localName || element.tagName)
      );
      const capability = resolveComponentCapability(localName);
      const dispatcher = binding.dispatchEvent || binding.dispatchAction || bindOptions.dispatchEvent || bindOptions.dispatchAction || options.dispatchEvent || options.dispatchAction;
      const stateBridge = binding.stateBridge || bindOptions.stateBridge || options.stateBridge || null;
      const explicitBindings = normalizeEventBindings(binding.events || binding.eventBindings || bindOptions.events || bindOptions.eventBindings);
      const inferredEvents = explicitBindings.length
        ? explicitBindings
        : unique([
            ...(capability ? capability.events : []),
            ...(capability && capability.family === 'form' ? ['input', 'change'] : [])
          ]).map((eventName) => ({ event: eventName, action: eventName }));
      const listeners = [];

      if (stateBridge && typeof stateBridge.read === 'function') {
        const initialValue = stateBridge.read(stateKeyForElement(localName, element));
        if (typeof initialValue !== 'undefined') writeElementValue(element, initialValue);
      }

      inferredEvents.forEach((entry) => {
        const eventName = clampString(entry.event || entry.eventName);
        if (!eventName || !element || typeof element.addEventListener !== 'function') return;
        const listener = (event) => {
          const payload = adaptComponentEventPayload(capability, event);
          if (stateBridge && typeof stateBridge.write === 'function' && capability && capability.family === 'form') {
            stateBridge.write(stateKeyForElement(localName, event && event.target || element), payload.value);
          }
          if (typeof dispatcher === 'function') {
            dispatcher({
              id: entry.action || entry.actionId || eventName,
              action: entry.action || entry.actionId || eventName,
              eventName,
              source: localName,
              payload
            });
          }
        };
        element.addEventListener(eventName, listener, objectRecord(entry.options));
        listeners.push({ eventName, listener });
      });

      return {
        schema: RMT_COMPONENT_BINDING_SCHEMA,
        tag: localName,
        family: capability ? capability.family : 'unknown',
        eventCount: listeners.length,
        stateBridge: Boolean(stateBridge),
        destroy() {
          listeners.forEach(({ eventName, listener }) => {
            if (element && typeof element.removeEventListener === 'function') {
              element.removeEventListener(eventName, listener);
            }
          });
          listeners.length = 0;
          return {
            schema: RMT_COMPONENT_BINDING_SCHEMA,
            tag: localName,
            destroyed: true
          };
        },
        snapshot() {
          return {
            schema: RMT_COMPONENT_BINDING_SCHEMA,
            tag: localName,
            family: capability ? capability.family : 'unknown',
            eventCount: listeners.length,
            value: readElementValue(element, capability)
          };
        }
      };
    }

    function createMatrixReport() {
      const capabilities = listCapabilities();
      const publicUi = capabilities.filter((capability) => capability.visualKind === 'public-ui');
      const familyCounts = {};
      capabilities.forEach((capability) => {
        familyCounts[capability.family] = (familyCounts[capability.family] || 0) + 1;
      });
      return {
        schema: RMT_COMPONENT_CAPABILITY_REPORT_SCHEMA,
        registrySchema: RMT_COMPONENT_CAPABILITY_REGISTRY_SCHEMA,
        status: diagnostics.length === 0 ? 'passed' : 'blocked',
        ok: diagnostics.length === 0,
        manifestCount: capabilities.length,
        publicComponentCount: publicUi.length,
        nonVisualCount: capabilities.length - publicUi.length,
        withRmtMetadata: capabilities.filter((capability) => capability.rmt).length,
        withComponentContract: capabilities.filter((capability) => capability.componentContract).length,
        customElementCount: capabilities.filter((capability) => capability.customElement).length,
        formAssociatedCount: capabilities.filter((capability) => capability.formAssociated).length,
        familyCounts,
        browserSmokeFamilies: BROWSER_SMOKE_FAMILIES.slice(),
        importPolicy: RMT_COMPONENT_IMPORT_POLICY,
        kernelBoundary: RMT_COMPONENT_KERNEL_BOUNDARY,
        diagnostics: diagnostics.slice(),
        components: capabilities.map((capability) => ({
          tag: capability.tag,
          modulePath: capability.modulePath,
          family: capability.family,
          visualKind: capability.visualKind,
          customElement: capability.customElement,
          formAssociated: capability.formAssociated,
          observedAttributeCount: capability.observedAttributes.length,
          eventCount: capability.events.length,
          slotCount: capability.slots.length,
          partCount: capability.parts.length,
          hasRmtMetadata: Boolean(capability.rmt),
          hasComponentContract: Boolean(capability.componentContract),
          sourceToSeaRisk: capability.sourceToSeaRisk
        }))
      };
    }

    return Object.freeze({
      schema: RMT_COMPONENT_CAPABILITY_REGISTRY_SCHEMA,
      importPolicy: RMT_COMPONENT_IMPORT_POLICY,
      kernelBoundary: RMT_COMPONENT_KERNEL_BOUNDARY,
      resolveComponentCapability,
      listCapabilities,
      buildComponentDescriptor,
      bindComponentInstance,
      ensureComponentLoaded,
      createMatrixReport,
      listDiagnostics() {
        return diagnostics.slice();
      }
    });
  }

  function createRmtComponentPrimitiveMatrix(options = {}) {
    return createRmtComponentCapabilityRegistry(options).createMatrixReport();
  }

  const api = {
    RMT_COMPONENT_BINDING_SCHEMA,
    RMT_COMPONENT_CAPABILITY_REGISTRY_SCHEMA,
    RMT_COMPONENT_CAPABILITY_REPORT_SCHEMA,
    RMT_COMPONENT_DESCRIPTOR_SCHEMA,
    RMT_COMPONENT_DIAGNOSTIC_SCHEMA,
    RMT_COMPONENT_IMPORT_POLICY,
    RMT_COMPONENT_KERNEL_BOUNDARY,
    adaptComponentEventPayload,
    classifyComponentFamily,
    createRmtComponentCapabilityRegistry,
    createRmtComponentPrimitiveMatrix
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalTarget) {
    globalTarget.XTendRmtComponentCapabilityRegistry = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_COMPONENT_CAPABILITY_REGISTRY_API__ = globalThis.XTendRmtComponentCapabilityRegistry;

export const RMT_COMPONENT_BINDING_SCHEMA = __XTEND_RMT_COMPONENT_CAPABILITY_REGISTRY_API__.RMT_COMPONENT_BINDING_SCHEMA;
export const RMT_COMPONENT_CAPABILITY_REGISTRY_SCHEMA = __XTEND_RMT_COMPONENT_CAPABILITY_REGISTRY_API__.RMT_COMPONENT_CAPABILITY_REGISTRY_SCHEMA;
export const RMT_COMPONENT_CAPABILITY_REPORT_SCHEMA = __XTEND_RMT_COMPONENT_CAPABILITY_REGISTRY_API__.RMT_COMPONENT_CAPABILITY_REPORT_SCHEMA;
export const RMT_COMPONENT_DESCRIPTOR_SCHEMA = __XTEND_RMT_COMPONENT_CAPABILITY_REGISTRY_API__.RMT_COMPONENT_DESCRIPTOR_SCHEMA;
export const RMT_COMPONENT_DIAGNOSTIC_SCHEMA = __XTEND_RMT_COMPONENT_CAPABILITY_REGISTRY_API__.RMT_COMPONENT_DIAGNOSTIC_SCHEMA;
export const RMT_COMPONENT_IMPORT_POLICY = __XTEND_RMT_COMPONENT_CAPABILITY_REGISTRY_API__.RMT_COMPONENT_IMPORT_POLICY;
export const RMT_COMPONENT_KERNEL_BOUNDARY = __XTEND_RMT_COMPONENT_CAPABILITY_REGISTRY_API__.RMT_COMPONENT_KERNEL_BOUNDARY;
export const adaptComponentEventPayload = __XTEND_RMT_COMPONENT_CAPABILITY_REGISTRY_API__.adaptComponentEventPayload;
export const classifyComponentFamily = __XTEND_RMT_COMPONENT_CAPABILITY_REGISTRY_API__.classifyComponentFamily;
export const createRmtComponentCapabilityRegistry = __XTEND_RMT_COMPONENT_CAPABILITY_REGISTRY_API__.createRmtComponentCapabilityRegistry;
export const createRmtComponentPrimitiveMatrix = __XTEND_RMT_COMPONENT_CAPABILITY_REGISTRY_API__.createRmtComponentPrimitiveMatrix;

export default __XTEND_RMT_COMPONENT_CAPABILITY_REGISTRY_API__;

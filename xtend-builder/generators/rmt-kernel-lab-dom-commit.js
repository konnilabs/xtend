'use strict';

const crypto = require('crypto');

const DOM_RENDERER_SOURCE_PATH = 'xtendrmt/rmt-dom-descriptor-renderer.js';
const DOM_RENDERER_TYPES_PATH = 'xtendrmt/rmt-dom-descriptor-renderer.d.ts';
const DOM_RENDERER_MODULE_PATH = 'modules/rmt-dom-descriptor-renderer.js';
const DOM_RENDERER_MODULE_MARKER = `/* ${DOM_RENDERER_MODULE_PATH} */`;
const DOM_RENDERER_FACTORY = 'createRmtDomDescriptorRenderer';
const DOM_RENDERER_SCHEMA = 'xtend.epic18.rmt-dom-descriptor-renderer.v1';
const DOM_COMMIT_RESULT_SCHEMA = 'xtend.rmt.dom-commit-result.v1';
const DOM_TYPES_BEGIN = '// <kernel-lab:rmt-dom-descriptor-renderer-types>';
const DOM_TYPES_END = '// </kernel-lab:rmt-dom-descriptor-renderer-types>';
const DOM_BRIDGE_BEGIN = '    /* <kernel-lab:xtend-component-dom-commit-bridge> */';
const DOM_BRIDGE_END = '    /* </kernel-lab:xtend-component-dom-commit-bridge> */';
const DOM_MOUNT_BEGIN = '/* <kernel-lab:xtend-component-mount-commit> */';
const DOM_MOUNT_END = '/* </kernel-lab:xtend-component-mount-commit> */';
const DOM_HYDRATE_BEGIN = '/* <kernel-lab:xtend-component-hydrate-commit> */';
const DOM_HYDRATE_END = '/* </kernel-lab:xtend-component-hydrate-commit> */';
const TRUSTED_DOM_SINK_BEGIN = '/* <kernel-lab:rmt-trusted-dom-sink> */';
const TRUSTED_DOM_SINK_END = '/* </kernel-lab:rmt-trusted-dom-sink> */';
const TRUSTED_DOM_DELEGATE_BEGIN = '/* <kernel-lab:rmt-template-execution-trusted-dom-delegate> */';
const TRUSTED_DOM_DELEGATE_END = '/* </kernel-lab:rmt-template-execution-trusted-dom-delegate> */';
const DOM_OPERATIONS = Object.freeze([
  'create-node',
  'replace-children',
  'reconcile-children',
  'reconcile-element',
  'merge-element'
]);
const DOM_OWNERSHIP_DOMAINS = Object.freeze([
  'structure',
  'content',
  'attributes',
  'properties',
  'class',
  'part',
  'styleTokens',
  'events',
  'visibility',
  'validation'
]);

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function unique(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
}

function insertBefore(values, entry, beforeEntry) {
  const next = unique(values);
  if (next.includes(entry)) return next;
  const beforeIndex = next.indexOf(beforeEntry);
  if (beforeIndex < 0) next.push(entry);
  else next.splice(beforeIndex, 0, entry);
  return next;
}

function findClosingBrace(source, openingIndex) {
  const text = String(source || '');
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openingIndex; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function findNamedFunctionRange(source, functionName) {
  const text = String(source || '');
  const signature = `function ${functionName}(`;
  const start = text.indexOf(signature);
  if (start < 0) return null;
  const signatureEnd = text.indexOf(') {', start + signature.length);
  const openingIndex = signatureEnd < 0 ? -1 : signatureEnd + 2;
  const end = openingIndex < 0 ? -1 : findClosingBrace(text, openingIndex);
  if (end < 0) {
    throw new Error(`KernelLab could not parse function ${functionName}().`);
  }
  return { start, end };
}

function removeNamedFunction(source, functionName) {
  const range = findNamedFunctionRange(source, functionName);
  if (!range) return String(source || '');
  let end = range.end;
  while (String(source || '')[end] === '\n') end += 1;
  return `${String(source || '').slice(0, range.start)}${String(source || '').slice(end)}`;
}

function replaceNamedFunction(source, functionName, replacement) {
  const text = String(source || '');
  const range = findNamedFunctionRange(text, functionName);
  if (!range) throw new Error(`KernelLab expected function ${functionName}().`);
  const lineStart = text.lastIndexOf('\n', range.start) + 1;
  return `${text.slice(0, lineStart)}${replacement}${text.slice(range.end)}`;
}

function replaceInsideNamedFunction(source, functionName, startNeedle, endNeedle, replacement) {
  const text = String(source || '');
  const range = findNamedFunctionRange(text, functionName);
  if (!range) throw new Error(`KernelLab expected function ${functionName}().`);
  const functionSource = text.slice(range.start, range.end);
  const relativeStart = functionSource.indexOf(startNeedle);
  if (relativeStart < 0) {
    if (functionSource.includes(replacement.trim())) return text;
    throw new Error(`KernelLab expected ${functionName}() DOM writer start marker.`);
  }
  const relativeEndStart = functionSource.indexOf(endNeedle, relativeStart);
  if (relativeEndStart < 0) {
    throw new Error(`KernelLab expected ${functionName}() DOM writer end marker.`);
  }
  const relativeEnd = relativeEndStart + endNeedle.length;
  const nextFunction = `${functionSource.slice(0, relativeStart)}${replacement}${functionSource.slice(relativeEnd)}`;
  return `${text.slice(0, range.start)}${nextFunction}${text.slice(range.end)}`;
}

function removeInsideNamedFunction(source, functionName, block) {
  const text = String(source || '');
  const range = findNamedFunctionRange(text, functionName);
  if (!range) throw new Error(`KernelLab expected function ${functionName}().`);
  const functionSource = text.slice(range.start, range.end);
  if (!functionSource.includes(block)) return text;
  const nextFunction = functionSource.replace(block, '');
  return `${text.slice(0, range.start)}${nextFunction}${text.slice(range.end)}`;
}

function replaceMarkedBlock(source, beginMarker, endMarker, replacement) {
  const text = String(source || '');
  const beginIndex = text.indexOf(beginMarker);
  if (beginIndex < 0) return null;
  const endIndex = text.indexOf(endMarker, beginIndex + beginMarker.length);
  if (endIndex < 0) {
    throw new Error(`KernelLab found a partial generated block: ${beginMarker}`);
  }
  const lineStart = text.lastIndexOf('\n', beginIndex) + 1;
  const endLine = text.indexOf('\n', endIndex + endMarker.length);
  let blockEnd = endLine < 0 ? text.length : endLine + 1;
  while (text[blockEnd] === '\n') blockEnd += 1;
  return `${text.slice(0, lineStart)}${replacement}${text.slice(blockEnd)}`;
}

function replaceMarkedBlockInsideNamedFunction(source, functionName, beginMarker, endMarker, replacement, candidates = []) {
  const text = String(source || '');
  const range = findNamedFunctionRange(text, functionName);
  if (!range) throw new Error(`KernelLab expected function ${functionName}().`);
  const functionSource = text.slice(range.start, range.end);
  const marked = replaceMarkedBlock(functionSource, beginMarker, endMarker, replacement);
  if (marked !== null) {
    return `${text.slice(0, range.start)}${marked}${text.slice(range.end)}`;
  }
  for (const candidate of candidates) {
    if (!candidate || !functionSource.includes(candidate)) continue;
    const nextFunction = functionSource.replace(candidate, replacement.trimEnd());
    return `${text.slice(0, range.start)}${nextFunction}${text.slice(range.end)}`;
  }
  if (functionSource.includes(replacement.trim())) return text;
  return null;
}

function indent(source, spaces) {
  const prefix = ' '.repeat(spaces);
  return String(source || '').split('\n').map((line) => (line ? `${prefix}${line}` : '')).join('\n');
}

function extractStandaloneRendererRuntime(source) {
  const text = String(source || '');
  const exportMarker = '\nconst __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__ =';
  const exportIndex = text.indexOf(exportMarker);
  if (exportIndex < 0) {
    throw new Error(`${DOM_RENDERER_SOURCE_PATH} has no canonical ESM export marker.`);
  }
  let runtime = text.slice(0, exportIndex).trimEnd();
  runtime = runtime.replace(
    /\n  if \(typeof module !== 'undefined' && module\.exports\) \{\n    module\.exports = api;\n  \}/u,
    ''
  );
  const invocation = "})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));";
  if (!runtime.includes(invocation)) {
    throw new Error(`${DOM_RENDERER_SOURCE_PATH} has no canonical standalone invocation.`);
  }
  return runtime.replace(invocation, '})(global);');
}

function createBundledRendererModule(rendererSource) {
  const runtime = extractStandaloneRendererRuntime(rendererSource);
  return [
    DOM_RENDERER_MODULE_MARKER,
    '(function registerRmtDomDescriptorRendererModule(global) {',
    '    const appModules = global.AppModules || (global.AppModules = {});',
    indent(runtime, 4),
    '    const rendererApi = global.XTendRmtDomDescriptorRenderer;',
    '    if (!rendererApi || typeof rendererApi.createRmtDomDescriptorRenderer !== \'function\') {',
    '        throw new Error(\'KernelLab could not register the canonical RMT DOM descriptor renderer.\');',
    '    }',
    '    appModules.RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA = rendererApi.RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA;',
    '    appModules.RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA = rendererApi.RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA;',
    '    appModules.RMT_DOM_COMMIT_RESULT_SCHEMA = rendererApi.RMT_DOM_COMMIT_RESULT_SCHEMA;',
    '    appModules.TRUSTED_DOM_BOUNDARY = rendererApi.TRUSTED_DOM_BOUNDARY;',
    '    appModules.createNoManualHtmlGate = rendererApi.createNoManualHtmlGate;',
    '    appModules.createRmtDomDescriptorRenderer = rendererApi.createRmtDomDescriptorRenderer;',
    '})(__XTENDRMT_GLOBAL__);',
    ''
  ].join('\n');
}

function synchronizeModuleSection(bundleSource, moduleSource) {
  const source = String(bundleSource || '');
  const markerIndex = source.indexOf(DOM_RENDERER_MODULE_MARKER);
  if (markerIndex >= 0) {
    const nextModuleIndex = source.indexOf('\n/* modules/', markerIndex + DOM_RENDERER_MODULE_MARKER.length);
    const exportIndex = source.indexOf('\nconst AppModules =', markerIndex + DOM_RENDERER_MODULE_MARKER.length);
    const end = nextModuleIndex >= 0 ? nextModuleIndex + 1 : exportIndex;
    if (end < 0) throw new Error('KernelLab could not delimit the bundled DOM renderer module.');
    return `${source.slice(0, markerIndex)}${moduleSource}${source.slice(end)}`;
  }
  const formatMarker = '/* modules/rmt-format.js */';
  const insertionIndex = source.indexOf(formatMarker);
  if (insertionIndex < 0) {
    throw new Error('KernelLab could not find modules/rmt-format.js for DOM renderer insertion.');
  }
  return `${source.slice(0, insertionIndex)}${moduleSource}${source.slice(insertionIndex)}`;
}

function rmtFormatDomBridgeTemplate() {
    /* <kernel-lab:xtend-component-dom-commit-bridge> */
    const XTEND_COMPONENT_DOM_RENDERERS = typeof WeakMap === 'function' ? new WeakMap() : null;
    let xtendComponentFallbackDomRenderer = null;

    function resolveXtendComponentDomRenderer(documentTarget, deps = {}, options = {}) {
        const injected = options.domRenderer || deps.domRenderer || null;
        if (injected && typeof injected.commit === 'function') return injected;
        if (XTEND_COMPONENT_DOM_RENDERERS && documentTarget && XTEND_COMPONENT_DOM_RENDERERS.has(documentTarget)) {
            return XTEND_COMPONENT_DOM_RENDERERS.get(documentTarget);
        }
        if (!XTEND_COMPONENT_DOM_RENDERERS && xtendComponentFallbackDomRenderer) {
            return xtendComponentFallbackDomRenderer;
        }
        if (typeof appModules.createRmtDomDescriptorRenderer !== 'function') {
            throw new Error('XTend component adapter requires createRmtDomDescriptorRenderer().');
        }
        const renderer = appModules.createRmtDomDescriptorRenderer({
            documentTarget,
            diagnosticsHub: options.diagnosticsHub || deps.diagnosticsHub,
            componentRegistry: options.componentRegistry || deps.componentRegistry,
            trustedDomRenderer: options.trustedDomRenderer || deps.trustedDomRenderer,
            trustedDom: options.trustedDom || deps.trustedDom
        });
        if (XTEND_COMPONENT_DOM_RENDERERS && documentTarget) {
            XTEND_COMPONENT_DOM_RENDERERS.set(documentTarget, renderer);
        } else {
            xtendComponentFallbackDomRenderer = renderer;
        }
        return renderer;
    }

    function createXtendComponentRendererRegistry(component, deps = {}, options = {}) {
        const configuredRegistry = options.componentRegistry || deps.componentRegistry || null;
        const declaredProperties = Object.keys(component.props || {});
        return {
            resolveComponentCapability(tag) {
                const configured = configuredRegistry && typeof configuredRegistry.resolveComponentCapability === 'function'
                    ? configuredRegistry.resolveComponentCapability(tag)
                    : null;
                const configuredProperties = configured && Array.isArray(configured.propertyNames)
                    ? configured.propertyNames
                    : [];
                return {
                    ...(configured || {}),
                    tag,
                    propertyNames: uniqueValues([...configuredProperties, ...declaredProperties])
                };
            },
            buildComponentDescriptor(input, descriptorOptions) {
                return configuredRegistry && typeof configuredRegistry.buildComponentDescriptor === 'function'
                    ? configuredRegistry.buildComponentDescriptor(input, descriptorOptions)
                    : null;
            },
            bindComponentInstance(element, binding, bindingOptions) {
                return configuredRegistry && typeof configuredRegistry.bindComponentInstance === 'function'
                    ? configuredRegistry.bindComponentInstance(element, binding, bindingOptions)
                    : null;
            }
        };
    }

    function createXtendSlotDescriptor(slotName, slotValue) {
        let content = null;
        if (typeof slotValue === 'string' || typeof slotValue === 'number') {
            content = { type: 'text', text: { op: 'literal', value: String(slotValue) } };
        } else {
            const slotRecord = toPlainObject(slotValue);
            if (slotRecord.type === 'trusted_html') {
                content = slotRecord;
            } else if (slotRecord.descriptor) {
                content = slotRecord.descriptor;
            } else if (slotRecord.node) {
                content = slotRecord.node;
            } else if (Object.prototype.hasOwnProperty.call(slotRecord, 'markup') || Object.prototype.hasOwnProperty.call(slotRecord, 'html')) {
                const text = Object.prototype.hasOwnProperty.call(slotRecord, 'markup')
                    ? slotRecord.markup
                    : slotRecord.html;
                content = {
                    type: 'element',
                    tag: 'span',
                    children: [{ type: 'text', text: { op: 'literal', value: String(text == null ? '' : text) } }]
                };
            } else if (Object.prototype.hasOwnProperty.call(slotRecord, 'text')) {
                content = { type: 'text', text: { op: 'literal', value: String(slotRecord.text == null ? '' : slotRecord.text) } };
            } else if (slotRecord.template || slotRecord.templateRef) {
                content = {
                    type: 'element',
                    tag: 'template',
                    attributes: {
                        'data-rmt-template': clampString(slotRecord.template || slotRecord.templateRef, '')
                    }
                };
            } else if (slotRecord.component || slotRecord.tag || slotRecord.type) {
                content = slotRecord;
            } else if (Array.isArray(slotRecord.children)) {
                content = { type: 'fragment', children: slotRecord.children };
            }
        }
        if (!content) return null;
        if (slotName === 'default') return content;
        return {
            type: 'element',
            tag: 'span',
            attributes: { slot: slotName },
            children: [content]
        };
    }

    function createXtendComponentDomDescriptor(component, model = {}, fabricContext = null, hydrated = false) {
        const safeModel = toPlainObject(model);
        const properties = {};
        Object.entries(component.props || {}).forEach(([key, value]) => {
            properties[key] = Object.prototype.hasOwnProperty.call(safeModel, key) ? safeModel[key] : value;
        });
        const attributes = {
            'data-rmt-component-id': component.id,
            'data-rmt-component-adapter': component.adapter,
            ...(component.scheduleRef ? { 'data-rmt-schedule': component.scheduleRef } : {}),
            ...(component.serializedAttributes || {})
        };
        if (fabricContext) {
            attributes['data-xtend-fabric-lane'] = fabricContext.fabricLane;
            attributes['data-xtend-rmt-lane'] = fabricContext.rmtLane;
            attributes['data-xtend-fabric-fiber'] = fabricContext.fiberKind;
            attributes['data-xtend-fabric-source'] = fabricContext.source;
            if (fabricContext.endpointNameHint) attributes['data-rmt-endpoint'] = fabricContext.endpointNameHint;
        }
        if (hydrated) attributes['data-xtend-hydrated'] = 'true';
        return {
            type: 'element',
            tag: component.tag,
            key: component.id || component.tag,
            attributes,
            properties,
            events: component.events || {},
            children: Object.entries(component.slots || {})
                .map(([slotName, slotValue]) => createXtendSlotDescriptor(slotName, slotValue))
                .filter(Boolean)
        };
    }

    function dispatchXtendComponentDomEvent(eventRecord, component, deps = {}, options = {}, fabricContext = null) {
        const eventName = clampString(eventRecord && eventRecord.eventName, '');
        const event = eventRecord && eventRecord.nativeEvent;
        const config = toPlainObject(
            eventRecord && eventRecord.binding
            || component.events && component.events[eventName]
        );
        const payload = {
            componentId: component.id,
            tag: component.tag,
            eventName,
            commandName: clampString(config.commandName || config.command || '', ''),
            detail: cloneSerializable(event && event.detail, {})
        };
        const telemetryStart = typeof readXtendComponentTelemetryNow === 'function'
            ? readXtendComponentTelemetryNow(deps, options)
            : 0;
        let eventStatus = 'ok';
        let eventError = null;
        try {
            const dispatchCommand = options.dispatchCommand || deps.dispatchCommand;
            const onEvent = options.onEvent || deps.onEvent;
            if (typeof dispatchCommand === 'function' && payload.commandName) {
                dispatchCommand(payload.commandName, payload, event);
            } else if (typeof onEvent === 'function') {
                onEvent(payload, event);
            } else if (deps.stateRuntime && typeof deps.stateRuntime.set === 'function' && config.stateKey) {
                deps.stateRuntime.set(config.stateKey, payload);
            }
        } catch (error) {
            eventStatus = 'failed';
            eventError = error;
            throw error;
        } finally {
            if (
                typeof emitXtendComponentTelemetry === 'function'
                && typeof createXtendComponentLifecycleTelemetryRecord === 'function'
            ) {
                emitXtendComponentTelemetry(createXtendComponentLifecycleTelemetryRecord(component, 'event', eventStatus, {
                    phase: 'event',
                    fabricContext,
                    durationMs: typeof readXtendComponentTelemetryNow === 'function'
                        ? readXtendComponentTelemetryNow(deps, options) - telemetryStart
                        : 0,
                    diagnostics: eventError ? [createXtendComponentDiagnostic(
                        'rmt.xtend.component.event.failed',
                        eventError && eventError.message ? eventError.message : 'XTend component event handler failed.',
                        'eventHandler',
                        'event',
                        { componentId: component.id, tag: component.tag, eventName },
                        'error'
                    )] : [],
                    metadata: {
                        eventName,
                        commandName: payload.commandName,
                        stateKey: clampString(config.stateKey, '')
                    }
                }), deps, options);
            }
        }
    }

    function createXtendComponentDomBridge(component, model, deps, options, documentTarget, fabricContext, hydrated) {
        return {
            renderer: resolveXtendComponentDomRenderer(documentTarget, deps, options),
            descriptor: createXtendComponentDomDescriptor(component, model, fabricContext, hydrated),
            attachedEvents: Object.entries(component.events || {}).map(([eventName, eventConfig]) => Object.freeze({
                eventName,
                commandName: clampString(toPlainObject(eventConfig).commandName || toPlainObject(eventConfig).command, '')
            })),
            context: {
                componentRegistry: createXtendComponentRendererRegistry(component, deps, options),
                trustedDomRenderer: options.trustedDomRenderer || deps.trustedDomRenderer,
                trustedDom: options.trustedDom || deps.trustedDom,
                dispatchEvent: (eventRecord) => dispatchXtendComponentDomEvent(
                    eventRecord,
                    component,
                    deps,
                    options,
                    fabricContext
                ),
                metadata: {
                    adapterId: XTEND_COMPONENT_ADAPTER_ID,
                    componentId: component.id,
                    source: 'kernel-lab-component-dom-commit'
                }
            }
        };
    }
    /* </kernel-lab:xtend-component-dom-commit-bridge> */
}

function templateBody(templateFunction) {
  const source = templateFunction.toString();
  const openingIndex = source.indexOf('{');
  const closingIndex = source.lastIndexOf('}');
  return source.slice(openingIndex + 1, closingIndex).trim();
}

function synchronizeXtendComponentAdapter(source) {
  let next = String(source || '');
  [
    'applyXtendComponentAttributes',
    'applyXtendComponentFabricContext',
    'applyXtendComponentProps',
    'appendXtendSlotContent',
    'attachXtendComponentEvents'
  ].forEach((functionName) => {
    next = removeNamedFunction(next, functionName);
  });

  const bridge = `${indent(templateBody(rmtFormatDomBridgeTemplate), 4)}\n\n`;
  const synchronizedBridge = replaceMarkedBlock(
    next,
    DOM_BRIDGE_BEGIN.trim(),
    DOM_BRIDGE_END.trim(),
    bridge
  );
  if (synchronizedBridge !== null) {
    next = synchronizedBridge;
  } else {
    const factoryMarker = '    appModules.createRmtXtendComponentAdapter = function createRmtXtendComponentAdapter(deps = {}) {';
    const markerIndex = next.indexOf(factoryMarker);
    if (markerIndex < 0) throw new Error('KernelLab could not find createRmtXtendComponentAdapter().');
    next = `${next.slice(0, markerIndex)}${bridge}${next.slice(markerIndex)}`;
  }

  const mountCommitBody = [
    '            const domBridge = createXtendComponentDomBridge(',
    '                component,',
    '                model,',
    '                deps,',
    '                options,',
    '                documentTarget,',
    "                typeof fabricContext === 'undefined' ? null : fabricContext,",
    '                false',
    '            );',
    '            const domCommit = domBridge.renderer.commit({',
    "                operation: 'replace-children',",
    '                target,',
    '                descriptor: domBridge.descriptor,',
    '                context: domBridge.context,',
    '                ownership: options.ownership || deps.ownership,',
    '                metadata: domBridge.context.metadata',
    '            });',
    '            const element = domCommit.nodes[0] || null;',
    '            const attachedEvents = Object.freeze(domBridge.attachedEvents);'
  ].join('\n');
  const mountReplacement = [
    `            ${DOM_MOUNT_BEGIN}`,
    mountCommitBody,
    `            ${DOM_MOUNT_END}`
  ].join('\n');
  const synchronizedMount = replaceMarkedBlockInsideNamedFunction(
    next,
    'mountComponent',
    DOM_MOUNT_BEGIN,
    DOM_MOUNT_END,
    `${mountReplacement}\n`,
    [mountCommitBody]
  );
  next = synchronizedMount === null
    ? replaceInsideNamedFunction(
        next,
        'mountComponent',
        '            const element = documentTarget.createElement(component.tag);',
        '            target.appendChild(element);',
        mountReplacement
      )
    : synchronizedMount;

  const hydrateWithoutFabric = [
    '            applyXtendComponentAttributes(element, component);',
    '            applyXtendComponentProps(element, component, model);',
    '            attachXtendComponentEvents(element, component, deps, options);'
  ].join('\n');
  const hydrateWithFabric = [
    '            applyXtendComponentAttributes(element, component);',
    '            applyXtendComponentFabricContext(element, fabricContext);',
    '            applyXtendComponentProps(element, component, model);',
    '            attachXtendComponentEvents(element, component, deps, options, fabricContext);'
  ].join('\n');
  const hydrateCommitV1 = [
    '            const documentTarget = getXtendDocumentTarget(element, deps, options);',
    '            const domBridge = createXtendComponentDomBridge(',
    '                component,',
    '                model,',
    '                deps,',
    '                options,',
    '                documentTarget,',
    "                typeof fabricContext === 'undefined' ? null : fabricContext,",
    '                true',
    '            );',
    '            const domCommit = domBridge.renderer.commit({',
    "                operation: 'reconcile-element',",
    '                target: element,',
    '                descriptor: domBridge.descriptor,',
    '                context: domBridge.context,',
    '                ownership: options.ownership || deps.ownership,',
    '                metadata: domBridge.context.metadata',
    '            });'
  ].join('\n');
  const hydrateCommitBody = [
    '            const documentTarget = getXtendDocumentTarget(element, deps, options);',
    '            const domBridge = createXtendComponentDomBridge(',
    '                component,',
    '                model,',
    '                deps,',
    '                options,',
    '                documentTarget,',
    "                typeof fabricContext === 'undefined' ? null : fabricContext,",
    '                true',
    '            );',
    '            const hydrationTag = clampString(',
    '                element && (element.localName || element.tagName),',
    "                ''",
    '            ).toLowerCase();',
    "            const hydrationMatchesComponent = hydrationTag === clampString(component.tag, '').toLowerCase();",
    '            const hydrationDescriptor = hydrationMatchesComponent',
    '                ? domBridge.descriptor',
    '                : (() => {',
    '                    const compatibilityDescriptor = { ...domBridge.descriptor };',
    '                    delete compatibilityDescriptor.children;',
    '                    delete compatibilityDescriptor.key;',
    '                    delete compatibilityDescriptor.properties;',
    '                    return compatibilityDescriptor;',
    '                })();',
    '            if (!hydrationMatchesComponent) {',
    '                diagnostics.push(createXtendComponentDiagnostic(',
    "                    'rmt.xtend.component.hydration.compatibility-target',",
    "                    'XTend component hydration used the legacy container-target compatibility path.',",
    "                    'hydrateComponent',",
    "                    'hydrate',",
    '                    {',
    '                        componentId: component.id,',
    '                        expectedTag: component.tag,',
    '                        actualTag: hydrationTag',
    '                    },',
    "                    'info'",
    '                ));',
    '            }',
    '            const domCommit = domBridge.renderer.commit({',
    "                operation: hydrationMatchesComponent ? 'reconcile-element' : 'merge-element',",
    '                target: element,',
    '                descriptor: hydrationDescriptor,',
    '                context: domBridge.context,',
    '                ownership: options.ownership || deps.ownership,',
    '                metadata: domBridge.context.metadata',
    '            });'
  ].join('\n');
  const hydrateReplacement = [
    `            ${DOM_HYDRATE_BEGIN}`,
    hydrateCommitBody,
    `            ${DOM_HYDRATE_END}`
  ].join('\n');
  const hydrateRange = findNamedFunctionRange(next, 'hydrateComponent');
  const hydrateSource = hydrateRange ? next.slice(hydrateRange.start, hydrateRange.end) : '';
  const synchronizedHydrate = replaceMarkedBlockInsideNamedFunction(
    next,
    'hydrateComponent',
    DOM_HYDRATE_BEGIN,
    DOM_HYDRATE_END,
    `${hydrateReplacement}\n`,
    [hydrateCommitV1]
  );
  if (synchronizedHydrate !== null) {
    next = synchronizedHydrate;
  } else if (hydrateSource.includes(hydrateWithFabric)) {
    next = replaceInsideNamedFunction(next, 'hydrateComponent', hydrateWithFabric, hydrateWithFabric, hydrateReplacement);
  } else if (hydrateSource.includes(hydrateWithoutFabric)) {
    next = replaceInsideNamedFunction(next, 'hydrateComponent', hydrateWithoutFabric, hydrateWithoutFabric, hydrateReplacement);
  } else if (!hydrateSource.includes('const domBridge = createXtendComponentDomBridge(')) {
    throw new Error('KernelLab could not find hydrateComponent() DOM writer block.');
  }
  next = removeInsideNamedFunction(
    next,
    'hydrateComponent',
    [
      "            if (typeof element.setAttribute === 'function') {",
      "                element.setAttribute('data-xtend-hydrated', 'true');",
      '            }'
    ].join('\n')
  );
  return next;
}

function synchronizeBundleModule(source, moduleMarker, nextModuleMarker, synchronize) {
  const text = String(source || '');
  const start = text.indexOf(moduleMarker);
  if (start < 0) throw new Error(`KernelLab could not find ${moduleMarker}.`);
  const end = text.indexOf(nextModuleMarker, start + moduleMarker.length);
  if (end < 0) throw new Error(`KernelLab could not delimit ${moduleMarker}.`);
  const moduleSource = text.slice(start, end);
  const synchronized = synchronize(moduleSource);
  return `${text.slice(0, start)}${synchronized}${text.slice(end)}`;
}

function synchronizeTemplateRuntimeTrustedDom(moduleSource) {
  let next = String(moduleSource || '');
  const fragmentSource = [
    `        ${TRUSTED_DOM_SINK_BEGIN}`,
    '        function createFragmentFromTrustedHtml(html) {',
    "            if (!documentTarget || typeof documentTarget.createElement !== 'function') return null;",
    "            const templateElement = documentTarget.createElement('template');",
    '            if (!templateElement) return null;',
    "            templateElement.innerHTML = String(html || '');",
    "            if (templateElement.content && typeof templateElement.content.cloneNode === 'function') {",
    '                return templateElement.content.cloneNode(true);',
    '            }',
    '            return null;',
    '        }',
    `        ${TRUSTED_DOM_SINK_END}`
  ].join('\n');
  const synchronizedSink = replaceMarkedBlock(
    next,
    TRUSTED_DOM_SINK_BEGIN,
    TRUSTED_DOM_SINK_END,
    `${fragmentSource}\n\n`
  );
  next = synchronizedSink === null
    ? replaceNamedFunction(next, 'createFragmentFromTrustedHtml', fragmentSource)
    : synchronizedSink;

  const clearSource = [
    '        function clearElementHtml(element) {',
    '            if (!element) return false;',
    "            if (typeof element.replaceChildren === 'function') {",
    '                element.replaceChildren();',
    '                return true;',
    '            }',
    "            if ('textContent' in element) {",
    "                element.textContent = '';",
    '                return true;',
    '            }',
    '            return false;',
    '        }'
  ].join('\n');
  next = replaceNamedFunction(next, 'clearElementHtml', clearSource);

  const commitSource = [
    '        function commitTrustedHtml(element, html, context = {}) {',
    '            if (!element) return false;',
    '            const trusted = createTrustedHtmlCommit(html, context);',
    "            if (trusted.html === '') {",
    '                return clearElementHtml(element) && trusted.verdict.commitAllowed !== false;',
    '            }',
    '            const fragment = createFragmentFromTrustedHtml(trusted.html);',
    "            if (fragment && typeof element.replaceChildren === 'function') {",
    '                element.replaceChildren(fragment);',
    '                return trusted.verdict.commitAllowed !== false;',
    '            }',
    "            if (fragment && typeof element.appendChild === 'function' && clearElementHtml(element)) {",
    '                element.appendChild(fragment);',
    '                return trusted.verdict.commitAllowed !== false;',
    '            }',
    "            if ('textContent' in element) {",
    '                element.textContent = trusted.html;',
    '                return trusted.verdict.commitAllowed !== false;',
    '            }',
    '            return false;',
    '        }'
  ].join('\n');
  next = replaceNamedFunction(next, 'commitTrustedHtml', commitSource);

  const returnAnchor = [
    '        return Object.freeze({',
    '            applyBindings,'
  ].join('\n');
  const returnWithTrustedDom = [
    '        return Object.freeze({',
    '            applyBindings,',
    '            commitTrustedHtml,',
    '            createFragmentFromHtml,'
  ].join('\n');
  if (!next.includes(returnWithTrustedDom)) {
    if (!next.includes(returnAnchor)) {
      throw new Error('KernelLab could not expose the canonical template Trusted-DOM sink.');
    }
    next = next.replace(returnAnchor, returnWithTrustedDom);
  }
  return next;
}

function synchronizeTemplateExecutionTrustedDom(moduleSource) {
  let next = String(moduleSource || '');
  [
    'createFragmentFromTrustedHtml',
    'createFragmentFromHtml',
    'clearElementHtml'
  ].forEach((functionName) => {
    next = removeNamedFunction(next, functionName);
  });
  const delegateSource = [
    `        ${TRUSTED_DOM_DELEGATE_BEGIN}`,
    '        function commitTrustedHtml(element, html, context = {}) {',
    '            if (!element) return false;',
    '            const trusted = createTrustedHtmlCommit(html, context);',
    '            const renderer = getRuntimeRenderer();',
    "            if (!renderer || typeof renderer.commitTrustedHtml !== 'function') return false;",
    '            const committed = renderer.commitTrustedHtml(element, trusted.html, {',
    '                ...context,',
    "                source: 'rmt-template-execution-path',",
    '                upstreamVerdict: trusted.verdict',
    '            });',
    '            return committed && trusted.verdict.commitAllowed !== false;',
    '        }',
    `        ${TRUSTED_DOM_DELEGATE_END}`,
    ''
  ].join('\n');
  const synchronizedDelegate = replaceMarkedBlock(
    next,
    TRUSTED_DOM_DELEGATE_BEGIN,
    TRUSTED_DOM_DELEGATE_END,
    `${delegateSource}\n`
  );
  if (synchronizedDelegate !== null) {
    next = synchronizedDelegate;
  } else {
    next = removeNamedFunction(next, 'commitTrustedHtml');
    const anchor = '        function applyPrerenderChunk(target, chunkInput, options = {}) {';
    const anchorIndex = next.indexOf(anchor);
    if (anchorIndex < 0) throw new Error('KernelLab could not find applyPrerenderChunk() for Trusted-DOM delegation.');
    next = `${next.slice(0, anchorIndex)}${delegateSource}\n${next.slice(anchorIndex)}`;
  }
  return next;
}

function synchronizeTemplateTrustedDom(source) {
  let next = synchronizeBundleModule(
    source,
    '/* modules/rmt-template-runtime-renderer.js */',
    '/* modules/rmt-template-execution-path.js */',
    synchronizeTemplateRuntimeTrustedDom
  );
  next = synchronizeBundleModule(
    next,
    '/* modules/rmt-template-execution-path.js */',
    '/* modules/rmt-template-transport-adapters.js */',
    synchronizeTemplateExecutionTrustedDom
  );
  return next;
}

function ensureConstArrayEntry(source, constName, entry, beforeEntry) {
  const text = String(source || '');
  const marker = `const ${constName} = Object.freeze([`;
  const start = text.indexOf(marker);
  if (start < 0) throw new Error(`KernelLab could not find ${constName}.`);
  const end = text.indexOf('\n    ]);', start);
  if (end < 0) throw new Error(`KernelLab could not delimit ${constName}.`);
  const block = text.slice(start, end);
  if (block.includes(`'${entry}'`)) return text;
  const anchor = `        '${beforeEntry}',`;
  const anchorIndex = block.indexOf(anchor);
  const insertion = `        '${entry}',\n`;
  const nextBlock = anchorIndex >= 0
    ? `${block.slice(0, anchorIndex)}${insertion}${block.slice(anchorIndex)}`
    : `${block}\n${insertion.trimEnd()}`;
  return `${text.slice(0, start)}${nextBlock}${text.slice(end)}`;
}

function synchronizeEmbeddedProductManifest(source) {
  let next = String(source || '');
  next = ensureConstArrayEntry(next, 'CORE_RELEASE_SOURCE_MODULES', DOM_RENDERER_MODULE_PATH, 'modules/rmt-format.js');
  next = ensureConstArrayEntry(next, 'CORE_RELEASE_NAMED_EXPORTS', DOM_RENDERER_FACTORY, 'createRmtFormat');

  if (!next.includes("domDescriptorRenderer: 'createRmtDomDescriptorRenderer'")) {
    next = next.replace(
      "                    domCompat: 'createRmtDomCompat',",
      [
        "                    domCompat: 'createRmtDomCompat',",
        "                    domDescriptorRenderer: 'createRmtDomDescriptorRenderer',"
      ].join('\n')
    );
  }
  if (!next.includes('domDescriptorCommit: true,')) {
    next = next.replace(
      '                minimalDomPatching: true,',
      [
        '                minimalDomPatching: true,',
        '                domDescriptorCommit: true,'
      ].join('\n')
    );
  }
  if (!next.includes(`                        '${DOM_RENDERER_FACTORY}',`)) {
    next = next.replace(
      "                        'createRmtFormat',",
      [
        `                        '${DOM_RENDERER_FACTORY}',`,
        "                        'createRmtFormat',"
      ].join('\n')
    );
  }
  if (!next.includes(`                        '${DOM_RENDERER_SCHEMA}',`)) {
    next = next.replace(
      "                        'xtend.rmt.runtime-registry.v1',",
      [
        `                        '${DOM_RENDERER_SCHEMA}',`,
        `                        '${DOM_COMMIT_RESULT_SCHEMA}',`,
        "                        'xtend.rmt.runtime-registry.v1',"
      ].join('\n')
    );
  }
  const artifactSurfaceAnchor = [
    "                        'artifactParityContracts',",
    "                        'createRmtProductManifest',"
  ].join('\n');
  const rendererArtifactSurface = [
    "                        'artifactParityContracts',",
    `                        '${DOM_RENDERER_FACTORY}',`,
    "                        'createRmtProductManifest',"
  ].join('\n');
  if (!next.includes(rendererArtifactSurface)) {
    next = next.replace(artifactSurfaceAnchor, rendererArtifactSurface);
  }
  return next;
}

function synchronizeProductSurface(source) {
  let next = String(source || '');
  if (!next.includes("const createDomDescriptorRenderer = resolveRmtFactory('createRmtDomDescriptorRenderer'")) {
    next = next.replace(
      "        const createDomCompat = resolveRmtFactory('createRmtDomCompat', 'createRmtDomCompat', deps.createRmtDomCompat, deps.createRmtDomCompat);",
      [
        "        const createDomCompat = resolveRmtFactory('createRmtDomCompat', 'createRmtDomCompat', deps.createRmtDomCompat, deps.createRmtDomCompat);",
        "        const createDomDescriptorRenderer = resolveRmtFactory('createRmtDomDescriptorRenderer', 'createRmtDomDescriptorRenderer', deps.createRmtDomDescriptorRenderer, deps.createRmtDomDescriptorRenderer);"
      ].join('\n')
    );
  }
  if (!next.includes('|| typeof createDomDescriptorRenderer !== \'function\'')) {
    next = next.replace(
      "            || typeof createDomCompat !== 'function'",
      [
        "            || typeof createDomCompat !== 'function'",
        "            || typeof createDomDescriptorRenderer !== 'function'"
      ].join('\n')
    );
  }
  if (!next.includes("name: clampString(appModuleFactories.domDescriptorRenderer")) {
    const domCompatEntry = [
      '                {',
      "                    kind: 'appmodules_factory',",
      "                    name: clampString(appModuleFactories.domCompat, 'createRmtDomCompat')",
      '                },'
    ].join('\n');
    next = next.replace(
      domCompatEntry,
      [
        domCompatEntry,
        '                {',
        "                    kind: 'appmodules_factory',",
        "                    name: clampString(appModuleFactories.domDescriptorRenderer, 'createRmtDomDescriptorRenderer')",
        '                },'
      ].join('\n')
    );
  }
  if (!next.includes('            createDomDescriptorRenderer: (options = {}) => createDomDescriptorRenderer({')) {
    const domCompatFactory = [
      '            createDomCompat: (options = {}) => createDomCompat({',
      '                ...options,',
      '                globalName',
      '            }),'
    ].join('\n');
    next = next.replace(
      domCompatFactory,
      [
        domCompatFactory,
        '            createDomDescriptorRenderer: (options = {}) => createDomDescriptorRenderer({',
        '                ...options,',
        '                globalName',
        '            }),'
      ].join('\n')
    );
  }
  return next;
}

function synchronizeEsmExport(source) {
  let next = String(source || '');
  if (!next.includes('const createRmtDomDescriptorRenderer = (...args) => AppModules.createRmtDomDescriptorRenderer(...args);')) {
    next = next.replace(
      'const createRmtDomCompat = (...args) => AppModules.createRmtDomCompat(...args);',
      [
        'const createRmtDomCompat = (...args) => AppModules.createRmtDomCompat(...args);',
        'const createRmtDomDescriptorRenderer = (...args) => AppModules.createRmtDomDescriptorRenderer(...args);'
      ].join('\n')
    );
  }
  if (!/export\s+\{[^}]*\bcreateRmtDomDescriptorRenderer\b/u.test(next)) {
    next = next.replace(
      'createRmtCore, createRmtDomCompat,',
      'createRmtCore, createRmtDomCompat, createRmtDomDescriptorRenderer,'
    );
  }
  return next;
}

function synchronizeBundleSource(source, artifactPath, rendererSource) {
  let next = synchronizeModuleSection(source, createBundledRendererModule(rendererSource));
  next = synchronizeXtendComponentAdapter(next);
  next = synchronizeTemplateTrustedDom(next);
  next = synchronizeEmbeddedProductManifest(next);
  next = synchronizeProductSurface(next);
  if (String(artifactPath || '').endsWith('.esm.js')) {
    next = synchronizeEsmExport(next);
  }
  return next;
}

function synchronizeTypeSource(source, rendererTypesSource) {
  const text = String(source || '');
  const types = String(rendererTypesSource || '').trim();
  if (!types) throw new Error(`${DOM_RENDERER_TYPES_PATH} is empty.`);
  const block = `${DOM_TYPES_BEGIN}\n${types}\n${DOM_TYPES_END}`;
  const start = text.indexOf(DOM_TYPES_BEGIN);
  if (start >= 0) {
    const endMarker = text.indexOf(DOM_TYPES_END, start);
    if (endMarker < 0) throw new Error('KernelLab found a partial DOM renderer type synchronization block.');
    const end = endMarker + DOM_TYPES_END.length;
    return `${text.slice(0, start)}${block}${text.slice(end)}`;
  }
  return `${text.trimEnd()}\n\n${block}\n`;
}

function synchronizeArtifactParityContract(contract) {
  if (!contract || typeof contract !== 'object') return contract;
  contract.requiredFactories = insertBefore(contract.requiredFactories, DOM_RENDERER_FACTORY, 'createRmtFormat');
  contract.requiredContractIds = insertBefore(
    insertBefore(contract.requiredContractIds, DOM_RENDERER_SCHEMA, 'xtend.rmt.runtime-registry.v1'),
    DOM_COMMIT_RESULT_SCHEMA,
    'xtend.rmt.runtime-registry.v1'
  );
  contract.artifactSurfaces = insertBefore(
    contract.artifactSurfaces,
    DOM_RENDERER_FACTORY,
    'createRmtProductManifest'
  );
  contract.driftChecks = unique([
    ...(Array.isArray(contract.driftChecks) ? contract.driftChecks : []),
    'dom-renderer-source-synchronized',
    'normal-ui-html-sinks-absent'
  ]);
  return contract;
}

function synchronizeBuildTarget(target) {
  if (!target || typeof target !== 'object') return target;
  target.sourceModules = insertBefore(target.sourceModules, DOM_RENDERER_MODULE_PATH, 'modules/rmt-format.js');
  if (target.format === 'esm') {
    target.namedExports = insertBefore(target.namedExports, DOM_RENDERER_FACTORY, 'createRmtFormat');
  }
  return target;
}

function synchronizeManifestSource(source) {
  const manifest = JSON.parse(String(source || '{}'));
  manifest.runtimeContract = manifest.runtimeContract && typeof manifest.runtimeContract === 'object'
    ? manifest.runtimeContract
    : {};
  manifest.runtimeContract.domDescriptorCommit = true;
  manifest.entryPoints = manifest.entryPoints && typeof manifest.entryPoints === 'object'
    ? manifest.entryPoints
    : {};
  manifest.entryPoints.appModulesFactories = manifest.entryPoints.appModulesFactories
    && typeof manifest.entryPoints.appModulesFactories === 'object'
    ? manifest.entryPoints.appModulesFactories
    : {};
  manifest.entryPoints.appModulesFactories.domDescriptorRenderer = DOM_RENDERER_FACTORY;
  manifest.entryPoints.buildTargets = (Array.isArray(manifest.entryPoints.buildTargets)
    ? manifest.entryPoints.buildTargets
    : []).map(synchronizeBuildTarget);
  manifest.builtTargets = (Array.isArray(manifest.builtTargets)
    ? manifest.builtTargets
    : []).map(synchronizeBuildTarget);
  manifest.artifactParityContracts = (Array.isArray(manifest.artifactParityContracts)
    ? manifest.artifactParityContracts
    : []).map(synchronizeArtifactParityContract);
  return stableJson(manifest);
}

function synchronizeSchemaSource(source) {
  const schema = JSON.parse(String(source || '{}'));
  const metadata = schema['x-xtendrmt'] && typeof schema['x-xtendrmt'] === 'object'
    ? schema['x-xtendrmt']
    : {};
  const contracts = Array.isArray(metadata.domCommitContracts)
    ? metadata.domCommitContracts.filter((entry) => entry && entry.id !== DOM_COMMIT_RESULT_SCHEMA)
    : [];
  contracts.push({
    id: DOM_COMMIT_RESULT_SCHEMA,
    rendererSchema: DOM_RENDERER_SCHEMA,
    factory: DOM_RENDERER_FACTORY,
    sourceOfTruth: DOM_RENDERER_SOURCE_PATH,
    operations: DOM_OPERATIONS.slice(),
    ownershipDomains: DOM_OWNERSHIP_DOMAINS.slice(),
    validation: 'preflight-before-first-target-mutation',
    failurePolicy: 'fail-closed-with-diagnostic',
    trustedDomBoundary: 'xtend.rmt.trusted-dom-boundary.explicit'
  });
  metadata.domCommitContracts = contracts;
  metadata.artifactParityContracts = (Array.isArray(metadata.artifactParityContracts)
    ? metadata.artifactParityContracts
    : []).map(synchronizeArtifactParityContract);
  schema['x-xtendrmt'] = metadata;
  return stableJson(schema);
}

function synchronizeKernelArtifact(source, artifactPath, inputs = {}) {
  if (artifactPath.endsWith('.esm.js') || artifactPath.endsWith('.browser.js')) {
    // Bundled modules are canonical inputs. Renderer insertion happens in the
    // source assembler; promoted modules must never be rewritten as outputs.
    return String(source || '');
  }
  if (artifactPath === 'xtendrmt/rmt-core.d.ts') {
    return synchronizeTypeSource(source, inputs.rendererTypesSource);
  }
  if (artifactPath === 'xtendrmt/rmt-manifest.json') {
    return synchronizeManifestSource(source);
  }
  if (artifactPath === 'xtendrmt/rmt.schema.json') {
    return synchronizeSchemaSource(source);
  }
  return String(source || '');
}

function validateDomCommitArtifact(source, artifactPath) {
  const text = String(source || '');
  const diagnostics = [];
  function add(code, message) {
    diagnostics.push({ severity: 'error', code, message, path: artifactPath });
  }
  if (artifactPath.endsWith('.esm.js') || artifactPath.endsWith('.browser.js')) {
    if (!text.includes(DOM_RENDERER_MODULE_MARKER)) {
      add('xtend.rmt.kernel_lab.dom_renderer_module_missing', `${artifactPath} does not include the canonical DOM renderer module.`);
    }
    if (!text.includes(`appModules.${DOM_RENDERER_FACTORY} = rendererApi.${DOM_RENDERER_FACTORY};`)) {
      add('xtend.rmt.kernel_lab.dom_renderer_factory_missing', `${artifactPath} does not register ${DOM_RENDERER_FACTORY}.`);
    }
    if (text.includes('child.innerHTML = markup')) {
      add('xtend.rmt.kernel_lab.normal_html_sink_present', `${artifactPath} still contains the legacy component slot innerHTML sink.`);
    }
    if (text.includes('function applyXtendComponentAttributes(') || text.includes('function applyXtendComponentProps(')) {
      add('xtend.rmt.kernel_lab.component_writer_present', `${artifactPath} still contains legacy XTend component DOM writers.`);
    }
    if (!text.includes(DOM_BRIDGE_BEGIN) || !text.includes("operation: 'replace-children'")) {
      add('xtend.rmt.kernel_lab.component_commit_bridge_missing', `${artifactPath} does not delegate XTend component DOM writes to commit().`);
    }
    const trustedSinkCount = (text.match(/\btemplateElement\.innerHTML\s*=/gu) || []).length;
    if (
      trustedSinkCount !== 1
      || !text.includes(TRUSTED_DOM_SINK_BEGIN)
      || !text.includes(TRUSTED_DOM_DELEGATE_BEGIN)
    ) {
      add(
        'xtend.rmt.kernel_lab.trusted_dom_sink_not_canonical',
        `${artifactPath} must contain exactly one canonical Trusted-DOM parser sink and one execution-path delegate.`
      );
    }
    if (/\belement\.innerHTML\s*=(?!=)/u.test(text)) {
      add(
        'xtend.rmt.kernel_lab.direct_element_html_sink_present',
        `${artifactPath} still contains a direct element.innerHTML writer outside the canonical Trusted-DOM parser sink.`
      );
    }
    if (artifactPath.endsWith('.esm.js') && !/export\s+\{[^}]*\bcreateRmtDomDescriptorRenderer\b/u.test(text)) {
      add('xtend.rmt.kernel_lab.dom_renderer_export_missing', `${artifactPath} does not expose the renderer as a named export.`);
    }
  } else if (artifactPath === 'xtendrmt/rmt-core.d.ts') {
    if (!text.includes('export type RmtDomCommitRequest') || !text.includes('export interface RmtDomCommitResult')) {
      add('xtend.rmt.kernel_lab.dom_renderer_types_missing', `${artifactPath} does not contain the DOM commit contract.`);
    }
  } else if (artifactPath === 'xtendrmt/rmt-manifest.json') {
    let manifest = null;
    try {
      manifest = JSON.parse(text);
    } catch (_error) {
      add('xtend.rmt.kernel_lab.dom_manifest_invalid', `${artifactPath} is not valid JSON.`);
    }
    if (
      manifest
      && (
        !manifest.entryPoints
        || !manifest.entryPoints.appModulesFactories
        || manifest.entryPoints.appModulesFactories.domDescriptorRenderer !== DOM_RENDERER_FACTORY
      )
    ) {
      add('xtend.rmt.kernel_lab.dom_manifest_factory_missing', `${artifactPath} does not declare the DOM renderer factory.`);
    }
  } else if (artifactPath === 'xtendrmt/rmt.schema.json') {
    if (!text.includes(DOM_COMMIT_RESULT_SCHEMA) || !text.includes(DOM_RENDERER_SCHEMA)) {
      add('xtend.rmt.kernel_lab.dom_schema_contract_missing', `${artifactPath} does not contain the DOM commit schema metadata.`);
    }
  }
  return diagnostics;
}

function createDomSourceReport(inputs = {}) {
  return {
    renderer: {
      path: DOM_RENDERER_SOURCE_PATH,
      sha256: sha256(inputs.rendererSource),
      byteCount: Buffer.byteLength(String(inputs.rendererSource || ''), 'utf8')
    },
    types: {
      path: DOM_RENDERER_TYPES_PATH,
      sha256: sha256(inputs.rendererTypesSource),
      byteCount: Buffer.byteLength(String(inputs.rendererTypesSource || ''), 'utf8')
    },
    modulePath: DOM_RENDERER_MODULE_PATH,
    factory: DOM_RENDERER_FACTORY,
    rendererSchema: DOM_RENDERER_SCHEMA,
    commitResultSchema: DOM_COMMIT_RESULT_SCHEMA
  };
}

module.exports = {
  DOM_BRIDGE_BEGIN,
  DOM_BRIDGE_END,
  DOM_COMMIT_RESULT_SCHEMA,
  DOM_OPERATIONS,
  DOM_OWNERSHIP_DOMAINS,
  DOM_RENDERER_FACTORY,
  DOM_RENDERER_MODULE_MARKER,
  DOM_RENDERER_MODULE_PATH,
  DOM_RENDERER_SCHEMA,
  DOM_RENDERER_SOURCE_PATH,
  DOM_RENDERER_TYPES_PATH,
  createBundledRendererModule,
  createDomSourceReport,
  synchronizeKernelArtifact,
  validateDomCommitArtifact
};

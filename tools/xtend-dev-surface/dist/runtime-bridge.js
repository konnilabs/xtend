'use strict';

(function installXTendDevSurfaceRuntimeBridge(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
    return;
  }
  root.XTendDevSurfaceRuntimeBridge = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createXTendDevSurfaceRuntimeBridge() {
  const DEV_API_GLOBAL = '__XTEND_DEV_API__';
  const DEV_API_ACCESS = 'window.__XTEND_DEV_API__';
  const DEVTOOLS_EVAL_ACCESS = 'chrome.devtools.inspectedWindow.eval';
  const XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA = 'xtend.devsurface.runtime-bridge.v1';
  const XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA = 'xtend.devsurface.runtime-bridge-read.v1';
  const XTEND_DEV_SURFACE_DIAGNOSTIC_SCHEMA = 'xtend.devsurface.diagnostic.v1';
  const XTEND_DEV_SURFACE_SNAPSHOT_SCHEMA = 'xtend.devsurface.snapshot.v1';
  const XTEND_DEV_SURFACE_WORKPACKAGE = 'XDS-WP-03';

  const REQUIRED_METHODS = Object.freeze([
    'getPerformanceSnapshot',
    'getFabricTelemetrySnapshot',
    'getKernelSnapshot'
  ]);

  const OPTIONAL_METHODS = Object.freeze([
    'getHydrationSnapshot',
    'subscribe'
  ]);

  const SNAPSHOT_READS = Object.freeze([
    Object.freeze({
      method: 'getPerformanceSnapshot',
      field: 'performanceSnapshot',
      label: 'performance measurements'
    }),
    Object.freeze({
      method: 'getHydrationSnapshot',
      field: 'hydrationSnapshot',
      label: 'hydration and XScaler telemetry'
    }),
    Object.freeze({
      method: 'getFabricTelemetrySnapshot',
      field: 'fabricTelemetrySnapshot',
      label: 'fabric telemetry'
    }),
    Object.freeze({
      method: 'getKernelSnapshot',
      field: 'kernelSnapshot',
      label: 'kernel health'
    })
  ]);

  const FORBIDDEN_SOURCE_PATTERNS = Object.freeze([
    Object.freeze({ id: 'fetch-patch', pattern: new RegExp('(?:window|globalThis)\\.fetch\\s*=', 'u') }),
    Object.freeze({ id: 'history-patch', pattern: new RegExp('history\\.(?:pushState|replaceState)\\s*=', 'u') }),
    Object.freeze({ id: 'performance-patch', pattern: new RegExp('performance\\.(?:mark|measure)\\s*=', 'u') }),
    Object.freeze({ id: 'custom-elements-patch', pattern: new RegExp('customElements\\.define\\s*=', 'u') }),
    Object.freeze({ id: 'framework-introspection', pattern: new RegExp('\\b(?:React|Vue|Angular)\\.', 'u') }),
    Object.freeze({ id: 'remote-runtime', pattern: new RegExp("(?:importScripts\\(\\s*[\"']https?:|" + '<' + "script[^>]+src=[\"']https?:)", 'iu') })
  ]);

  function toArray(value) {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    return [value];
  }

  function cloneJson(value, fallback) {
    if (value === undefined) return fallback;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_error) {
      return fallback;
    }
  }

  function createDiagnostic(code, message, severity, metadata) {
    return {
      schema: XTEND_DEV_SURFACE_DIAGNOSTIC_SCHEMA,
      source: XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA,
      workpackage: XTEND_DEV_SURFACE_WORKPACKAGE,
      severity: severity || 'warning',
      code,
      message,
      boundary: 'explicit-dev-api',
      metadata: cloneJson(metadata || {}, {})
    };
  }

  function normalizeDiagnostic(diagnostic) {
    if (diagnostic && diagnostic.schema === XTEND_DEV_SURFACE_DIAGNOSTIC_SCHEMA) {
      return {
        ...diagnostic,
        metadata: cloneJson(diagnostic.metadata || {}, {})
      };
    }
    return createDiagnostic(
      diagnostic && diagnostic.code || 'xtend.devsurface.runtime_bridge.diagnostic',
      diagnostic && diagnostic.message || 'XTend Runtime Bridge diagnostic.',
      diagnostic && diagnostic.severity || 'warning',
      diagnostic && diagnostic.metadata || {}
    );
  }

  function createRuntimeBridgeRecord(input) {
    const source = input && typeof input === 'object' ? input : {};
    const diagnostics = toArray(source.diagnostics).map(normalizeDiagnostic);
    return {
      schema: XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA,
      workpackage: XTEND_DEV_SURFACE_WORKPACKAGE,
      devApiGlobal: DEV_API_GLOBAL,
      devApiAccess: DEV_API_ACCESS,
      devtoolsEvalAccess: DEVTOOLS_EVAL_ACCESS,
      readMode: source.readMode || 'inspected-window-eval',
      allowedReads: REQUIRED_METHODS.concat(OPTIONAL_METHODS),
      requiredMethods: REQUIRED_METHODS.slice(),
      optionalMethods: OPTIONAL_METHODS.slice(),
      snapshotReads: SNAPSHOT_READS.map((entry) => ({ ...entry })),
      monkeypatchingAllowed: false,
      remoteRuntimeAllowed: false,
      uiCoprocessorAllowed: false,
      prewarmWorkerAllowed: true,
      diagnostics,
      ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
    };
  }

  function createFallbackSnapshot(reason, metadata) {
    const diagnostic = createDiagnostic(
      'xtend.devsurface.runtime_bridge.unavailable',
      reason || `Unable to read ${DEV_API_ACCESS}.`,
      'warning',
      {
        globalName: DEV_API_GLOBAL,
        ...cloneJson(metadata || {}, {})
      }
    );
    return {
      schema: XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA,
      snapshotSchema: XTEND_DEV_SURFACE_SNAPSHOT_SCHEMA,
      bridgeSchema: XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA,
      bridge: createRuntimeBridgeRecord({
        readMode: 'fallback',
        diagnostics: [diagnostic]
      }),
      devApiPresent: false,
      devApiVersion: null,
      methodAvailability: {},
      subscribeSupported: false,
      performanceSnapshot: {
        measurements: []
      },
      hydrationSnapshot: null,
      fabricTelemetrySnapshot: {
        lanes: {},
        totals: {},
        backpressure: { level: 'unknown', action: 'observe' }
      },
      kernelSnapshot: {
        state: 'none',
        recoveryAction: 'none',
        affectedScopes: []
      },
      diagnostics: [diagnostic],
      ok: false
    };
  }

  function createInspectedWindowReadExpression() {
    return `(() => {
      const DEV_API_GLOBAL = ${JSON.stringify(DEV_API_GLOBAL)};
      const DEV_API_ACCESS = ${JSON.stringify(DEV_API_ACCESS)};
      const DEVTOOLS_EVAL_ACCESS = ${JSON.stringify(DEVTOOLS_EVAL_ACCESS)};
      const RUNTIME_BRIDGE_SCHEMA = ${JSON.stringify(XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA)};
      const RUNTIME_BRIDGE_READ_SCHEMA = ${JSON.stringify(XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA)};
      const DIAGNOSTIC_SCHEMA = ${JSON.stringify(XTEND_DEV_SURFACE_DIAGNOSTIC_SCHEMA)};
      const WORKPACKAGE = ${JSON.stringify(XTEND_DEV_SURFACE_WORKPACKAGE)};
      const REQUIRED_METHODS = ${JSON.stringify(REQUIRED_METHODS)};
      const OPTIONAL_METHODS = ${JSON.stringify(OPTIONAL_METHODS)};
      const SNAPSHOT_READS = ${JSON.stringify(SNAPSHOT_READS)};
      const cloneJson = (value) => {
        if (value === undefined) return null;
        try {
          return JSON.parse(JSON.stringify(value));
        } catch (error) {
          return {
            __xtendSerializationError: error && error.message ? error.message : String(error)
          };
        }
      };
      const isThenable = (value) => value && typeof value === 'object' && typeof value.then === 'function';
      const createDiagnostic = (code, message, severity, metadata) => ({
        schema: DIAGNOSTIC_SCHEMA,
        source: RUNTIME_BRIDGE_SCHEMA,
        workpackage: WORKPACKAGE,
        severity: severity || 'warning',
        code,
        message,
        boundary: 'explicit-dev-api',
        metadata: metadata || {}
      });
      const createBridge = (diagnostics) => ({
        schema: RUNTIME_BRIDGE_SCHEMA,
        workpackage: WORKPACKAGE,
        devApiGlobal: DEV_API_GLOBAL,
        devApiAccess: DEV_API_ACCESS,
        devtoolsEvalAccess: DEVTOOLS_EVAL_ACCESS,
        readMode: 'inspected-window-eval',
        allowedReads: REQUIRED_METHODS.concat(OPTIONAL_METHODS),
        requiredMethods: REQUIRED_METHODS.slice(),
        optionalMethods: OPTIONAL_METHODS.slice(),
        snapshotReads: SNAPSHOT_READS.map((entry) => ({ ...entry })),
        monkeypatchingAllowed: false,
        remoteRuntimeAllowed: false,
        uiCoprocessorAllowed: false,
        prewarmWorkerAllowed: true,
        diagnostics,
        ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
      });
      const api = window[DEV_API_GLOBAL];
      if (!api) {
        const diagnostic = createDiagnostic(
          'xtend.devsurface.dev_api.missing',
          'Inspected page does not expose ' + DEV_API_ACCESS + '.',
          'warning',
          { globalName: DEV_API_GLOBAL }
        );
        return {
          schema: RUNTIME_BRIDGE_READ_SCHEMA,
          bridgeSchema: RUNTIME_BRIDGE_SCHEMA,
          bridge: createBridge([diagnostic]),
          devApiPresent: false,
          devApiVersion: null,
          methodAvailability: {},
          subscribeSupported: false,
          performanceSnapshot: null,
          hydrationSnapshot: null,
          fabricTelemetrySnapshot: null,
          kernelSnapshot: null,
          diagnostics: [diagnostic],
          ok: false
        };
      }
      const methodAvailability = {};
      REQUIRED_METHODS.concat(OPTIONAL_METHODS).forEach((method) => {
        methodAvailability[method] = typeof api[method] === 'function';
      });
      const diagnostics = [];
      REQUIRED_METHODS.forEach((method) => {
        if (!methodAvailability[method]) {
          diagnostics.push(createDiagnostic(
            'xtend.devsurface.dev_api.method_missing',
            'XTend DEV API is missing required method "' + method + '".',
            'error',
            { method, globalName: DEV_API_GLOBAL }
          ));
        }
      });
      const readMethod = (definition) => {
        if (!methodAvailability[definition.method]) return null;
        try {
          const rawValue = api[definition.method]();
          if (isThenable(rawValue)) {
            diagnostics.push(createDiagnostic(
              'xtend.devsurface.runtime_bridge.async_snapshot_unsupported',
              'XTend DEV API method "' + definition.method + '" must return a serializable snapshot synchronously.',
              'error',
              { method: definition.method }
            ));
            return null;
          }
          const value = cloneJson(rawValue);
          if (value && value.__xtendSerializationError) {
            diagnostics.push(createDiagnostic(
              'xtend.devsurface.runtime_bridge.serialization_failed',
              'XTend DEV API method "' + definition.method + '" returned a non-serializable snapshot.',
              'error',
              { method: definition.method, error: value.__xtendSerializationError }
            ));
            return null;
          }
          return value;
        } catch (error) {
          diagnostics.push(createDiagnostic(
            'xtend.devsurface.runtime_bridge.read_failed',
            'XTend DEV API method "' + definition.method + '" failed while reading ' + definition.label + '.',
            'error',
            {
              method: definition.method,
              error: error && error.message ? error.message : String(error)
            }
          ));
          return null;
        }
      };
      const result = {
        schema: RUNTIME_BRIDGE_READ_SCHEMA,
        bridgeSchema: RUNTIME_BRIDGE_SCHEMA,
        bridge: null,
        devApiPresent: true,
        devApiVersion: api.version || null,
        methodAvailability,
        subscribeSupported: methodAvailability.subscribe === true,
        performanceSnapshot: null,
        hydrationSnapshot: null,
        fabricTelemetrySnapshot: null,
        kernelSnapshot: null,
        diagnostics,
        ok: false
      };
      SNAPSHOT_READS.forEach((definition) => {
        result[definition.field] = readMethod(definition);
      });
      result.bridge = createBridge(diagnostics);
      result.ok = diagnostics.every((diagnostic) => diagnostic.severity !== 'error');
      return result;
    })()`;
  }

  function sanitizeExceptionInfo(exceptionInfo) {
    if (!exceptionInfo || typeof exceptionInfo !== 'object') return {};
    return {
      isException: exceptionInfo.isException === true,
      value: typeof exceptionInfo.value === 'string' ? exceptionInfo.value : null,
      description: typeof exceptionInfo.description === 'string' ? exceptionInfo.description : null
    };
  }

  function normalizeBridgeReadResult(result) {
    if (!result || typeof result !== 'object') {
      return createFallbackSnapshot('XTend Runtime Bridge returned no result.');
    }
    const diagnostics = toArray(result.diagnostics).map(normalizeDiagnostic);
    const normalized = {
      ...result,
      schema: XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA,
      bridgeSchema: XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA,
      bridge: result.bridge || createRuntimeBridgeRecord({ diagnostics }),
      diagnostics,
      devApiPresent: result.devApiPresent === true,
      devApiVersion: result.devApiVersion || result.version || null,
      methodAvailability: result.methodAvailability && typeof result.methodAvailability === 'object'
        ? cloneJson(result.methodAvailability, {})
        : {},
      subscribeSupported: result.subscribeSupported === true,
      performanceSnapshot: result.performanceSnapshot || null,
      hydrationSnapshot: result.hydrationSnapshot || null,
      fabricTelemetrySnapshot: result.fabricTelemetrySnapshot || null,
      kernelSnapshot: result.kernelSnapshot || null
    };
    normalized.ok = typeof result.ok === 'boolean'
      ? result.ok
      : diagnostics.every((diagnostic) => diagnostic.severity !== 'error') && normalized.devApiPresent;
    return normalized;
  }

  function readRuntimeSnapshotFromInspectedWindow(devtoolsApi) {
    return new Promise((resolve) => {
      if (!devtoolsApi || !devtoolsApi.inspectedWindow || typeof devtoolsApi.inspectedWindow.eval !== 'function') {
        resolve(createFallbackSnapshot(`${DEVTOOLS_EVAL_ACCESS} is unavailable in this context.`, {
          reason: 'devtools-unavailable'
        }));
        return;
      }

      devtoolsApi.inspectedWindow.eval(createInspectedWindowReadExpression(), function onEvaluated(result, exceptionInfo) {
        if (exceptionInfo && exceptionInfo.isException) {
          resolve(createFallbackSnapshot('XTend Runtime Bridge read failed in the inspected page.', {
            reason: 'inspected-window-exception',
            exceptionInfo: sanitizeExceptionInfo(exceptionInfo)
          }));
          return;
        }
        resolve(normalizeBridgeReadResult(result));
      });
    });
  }

  function evaluateRuntimeBridgeSource(sourceText) {
    const source = String(sourceText || '');
    const diagnostics = [];
    FORBIDDEN_SOURCE_PATTERNS.forEach((entry) => {
      if (!entry.pattern.test(source)) return;
      diagnostics.push(createDiagnostic(
        'xtend.devsurface.runtime_bridge.forbidden_source',
        `Runtime Bridge source violates ${entry.id}.`,
        'error',
        { rule: entry.id }
      ));
    });
    if (!source.includes(DEV_API_ACCESS) || !source.includes(DEVTOOLS_EVAL_ACCESS)) {
      diagnostics.push(createDiagnostic(
        'xtend.devsurface.runtime_bridge.invalid',
        'Runtime Bridge must read only the explicit XTend DEV API through the DevTools inspectedWindow boundary.',
        'error',
        {
          devApiAccess: DEV_API_ACCESS,
          devtoolsEvalAccess: DEVTOOLS_EVAL_ACCESS
        }
      ));
    }
    return createRuntimeBridgeRecord({
      readMode: 'source-audit',
      diagnostics
    });
  }

  return {
    DEV_API_ACCESS,
    DEV_API_GLOBAL,
    DEVTOOLS_EVAL_ACCESS,
    OPTIONAL_METHODS,
    REQUIRED_METHODS,
    SNAPSHOT_READS,
    XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA,
    XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA,
    XTEND_DEV_SURFACE_WORKPACKAGE,
    createFallbackSnapshot,
    createInspectedWindowReadExpression,
    createRuntimeBridgeRecord,
    evaluateRuntimeBridgeSource,
    normalizeBridgeReadResult,
    readRuntimeSnapshotFromInspectedWindow
  };
}));

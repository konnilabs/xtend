(function attachRmtKernelFeatureAdoptionRegistry(globalTarget, factory) {
  const api = factory(globalTarget || {});

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (globalTarget && typeof globalTarget === 'object') {
    globalTarget.XTendRmtKernelFeatureAdoptionRegistry = Object.freeze(api);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createRmtKernelFeatureAdoptionRegistryModule() {
  const RMT_KERNEL_FEATURE_ADOPTION_SCHEMA = 'xtend.rmt-kernel-feature-adoption.v1';
  const RMT_KERNEL_FEATURE_ADOPTION_REPORT_SCHEMA = 'xtend.rmt-kernel-feature-adoption-report.v1';
  const RMT_KERNEL_FEATURE_ADOPTION_DIAGNOSTIC_SCHEMA = 'xtend.rmt-kernel-feature-adoption-diagnostic.v1';

  const RMT_KERNEL_FEATURE_ADOPTION_CAPABILITIES = Object.freeze([
    {
      key: 'productSurface',
      label: 'Product Surface Bootstrap',
      category: 'bootstrap',
      requiredFactories: ['createRmtProductSurface'],
      runtimeRequired: false,
      prodDefault: 'off',
      diagnosticsRequired: true,
      strictFallbackAllowed: true
    },
    {
      key: 'templateArtifacts',
      label: 'Template Artifacts',
      category: 'source-to-sea',
      requiredFactories: ['createRmtTemplateArtifacts'],
      runtimeRequired: false,
      prodDefault: 'off',
      diagnosticsRequired: true,
      strictFallbackAllowed: true
    },
    {
      key: 'performanceAdvancedReports',
      label: 'Performance Runtime Advanced Reports',
      category: 'telemetry',
      requiredFactories: ['createRmtPerformanceRuntime'],
      runtimeRequired: true,
      prodDefault: 'auto',
      diagnosticsRequired: true,
      strictFallbackAllowed: true
    },
    {
      key: 'detachedRuntime',
      label: 'Detached Runtime',
      category: 'testability',
      requiredFactories: ['createRmtDetachedRuntime'],
      runtimeRequired: true,
      prodDefault: 'off',
      diagnosticsRequired: true,
      strictFallbackAllowed: true
    },
    {
      key: 'domCompat',
      label: 'DOM Compat',
      category: 'surface-contract',
      requiredFactories: ['createRmtDomCompat'],
      runtimeRequired: true,
      prodDefault: 'auto',
      diagnosticsRequired: true,
      strictFallbackAllowed: true
    },
    {
      key: 'warmReentry',
      label: 'Warm Reentry',
      category: 'prewarm',
      requiredFactories: ['createRmtPrewarmWorkerRuntime', 'createRmtPerformanceRuntime'],
      runtimeRequired: true,
      prodDefault: 'off',
      diagnosticsRequired: true,
      strictFallbackAllowed: true
    },
    {
      key: 'prewarmWorker',
      label: 'Prewarm Worker',
      category: 'prewarm',
      requiredFactories: ['createRmtPrewarmWorkerRuntime'],
      runtimeRequired: true,
      prodDefault: 'off',
      diagnosticsRequired: true,
      strictFallbackAllowed: true
    },
    {
      key: 'workerPrerender',
      label: 'Worker Prerender',
      category: 'prerender',
      requiredFactories: ['createRmtTemplateWorkerAdapter', 'createRmtWorkerPrerenderRuntime'],
      runtimeRequired: true,
      prodDefault: 'off',
      diagnosticsRequired: true,
      strictFallbackAllowed: true
    },
    {
      key: 'serverPrerender',
      label: 'Server Prerender',
      category: 'prerender',
      requiredFactories: ['createRmtTemplateServerAdapter', 'createRmtServerPrerenderRuntime'],
      runtimeRequired: true,
      prodDefault: 'host',
      diagnosticsRequired: true,
      strictFallbackAllowed: true
    },
    {
      key: 'panicRecovery',
      label: 'Panic and Recovery',
      category: 'security',
      requiredFactories: ['createRmtTemplateExecutionPath'],
      runtimeRequired: true,
      prodDefault: 'auto',
      diagnosticsRequired: true,
      strictFallbackAllowed: false
    },
    {
      key: 'policyParity',
      label: 'Policy Parity',
      category: 'security',
      requiredFactories: ['createRmtKernelPolicyParity'],
      runtimeRequired: false,
      prodDefault: 'auto',
      diagnosticsRequired: true,
      strictFallbackAllowed: false
    }
  ].map((entry) => Object.freeze({
    ...entry,
    requiredFactories: Object.freeze(entry.requiredFactories.slice())
  })));

  const RMT_KERNEL_FEATURE_ADOPTION_CAPABILITY_KEYS = Object.freeze(
    RMT_KERNEL_FEATURE_ADOPTION_CAPABILITIES.map((entry) => entry.key)
  );

  function cloneSafe(value, fallback = null) {
    if (value === undefined) return fallback;
    if (value === null || typeof value !== 'object') return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return fallback;
    }
  }

  function toArray(value) {
    return Array.isArray(value) ? value : (value == null ? [] : [value]);
  }

  function addFactoryStrings(value, factories) {
    if (!value) return;
    if (typeof value === 'string') {
      if (/^(create|install)[A-Z]/u.test(value)) factories.add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => addFactoryStrings(entry, factories));
      return;
    }
    if (typeof value === 'object') {
      Object.values(value).forEach((entry) => addFactoryStrings(entry, factories));
    }
  }

  function collectAvailableFactories(options = {}) {
    const factories = new Set();
    toArray(options.availableFactories).forEach((factoryName) => {
      if (factoryName) factories.add(String(factoryName));
    });

    const kernelApi = options.kernelApi || options.runtimeApi || null;
    if (kernelApi && typeof kernelApi === 'object') {
      Object.entries(kernelApi).forEach(([name, value]) => {
        if (typeof value === 'function') factories.add(name);
      });
    }

    const manifest = options.manifest || null;
    if (manifest && typeof manifest === 'object') {
      addFactoryStrings(manifest.entryPoints, factories);
      addFactoryStrings(manifest.runtimeContractFactories, factories);
    }

    return factories;
  }

  function collectPlanCapabilities(planFeatureAdoption) {
    const map = new Map();
    const capabilities = Array.isArray(planFeatureAdoption && planFeatureAdoption.capabilities)
      ? planFeatureAdoption.capabilities
      : [];
    capabilities.forEach((capability) => {
      if (capability && capability.key) map.set(capability.key, capability);
    });
    return map;
  }

  function readOverride(options, fieldName, key) {
    const source = options && options[fieldName];
    if (!source || typeof source !== 'object' || !Object.prototype.hasOwnProperty.call(source, key)) return undefined;
    return source[key];
  }

  function createCapabilityDiagnostic(definition, missingFactories) {
    return {
      schema: RMT_KERNEL_FEATURE_ADOPTION_DIAGNOSTIC_SCHEMA,
      code: 'xtend.rmt.kernel_feature_adoption.unsupported',
      severity: definition.strictFallbackAllowed ? 'warning' : 'error',
      message: `Kernel feature adoption capability "${definition.key}" is not supported by the available kernel factories.`,
      capabilityKey: definition.key,
      requiredFactories: definition.requiredFactories.slice(),
      missingFactories: missingFactories.slice(),
      degraded: definition.strictFallbackAllowed
    };
  }

  function resolveCapability(definition, options, availableFactories, planCapabilities) {
    const planCapability = planCapabilities.get(definition.key) || null;
    const missingFactories = definition.requiredFactories.filter((factoryName) => !availableFactories.has(factoryName));
    const hasFactorySupport = missingFactories.length === 0;
    const supportedOverride = readOverride(options, 'supportedCapabilities', definition.key);
    const activeOverride = readOverride(options, 'activeCapabilities', definition.key);
    const supported = supportedOverride !== undefined
      ? Boolean(supportedOverride)
      : (hasFactorySupport || Boolean(planCapability && planCapability.supported === true));
    const active = activeOverride !== undefined
      ? Boolean(activeOverride)
      : Boolean(planCapability && planCapability.active === true);
    const diagnostics = supported || !definition.diagnosticsRequired
      ? []
      : [createCapabilityDiagnostic(definition, missingFactories)];
    const status = supported
      ? (active ? 'active' : 'available')
      : (definition.strictFallbackAllowed ? 'degraded' : 'blocked');

    return Object.freeze({
      schema: RMT_KERNEL_FEATURE_ADOPTION_SCHEMA,
      key: definition.key,
      label: definition.label,
      category: definition.category,
      supported,
      active,
      status,
      runtimeRequired: Boolean(definition.runtimeRequired),
      prodDefault: definition.prodDefault,
      diagnosticsRequired: Boolean(definition.diagnosticsRequired),
      strictFallbackAllowed: Boolean(definition.strictFallbackAllowed),
      requiredFactories: definition.requiredFactories.slice(),
      missingFactories,
      diagnostics
    });
  }

  function createRmtKernelFeatureAdoptionRegistry(options = {}) {
    const availableFactories = collectAvailableFactories(options);
    const planCapabilities = collectPlanCapabilities(options.planFeatureAdoption);
    const capabilities = RMT_KERNEL_FEATURE_ADOPTION_CAPABILITIES.map((definition) => (
      resolveCapability(definition, options, availableFactories, planCapabilities)
    ));
    const diagnostics = capabilities.flatMap((capability) => capability.diagnostics);
    const degradedCount = capabilities.filter((capability) => capability.status === 'degraded').length;
    const blockedCount = capabilities.filter((capability) => capability.status === 'blocked').length;
    const activeCount = capabilities.filter((capability) => capability.active).length;
    const supportedCount = capabilities.filter((capability) => capability.supported).length;
    const report = Object.freeze({
      schema: RMT_KERNEL_FEATURE_ADOPTION_REPORT_SCHEMA,
      contract: RMT_KERNEL_FEATURE_ADOPTION_SCHEMA,
      status: blockedCount > 0 ? 'blocked' : degradedCount > 0 ? 'degraded' : 'ready',
      ok: blockedCount === 0,
      capabilityKeys: RMT_KERNEL_FEATURE_ADOPTION_CAPABILITY_KEYS.slice(),
      capabilityCount: capabilities.length,
      supportedCount,
      activeCount,
      degradedCount,
      blockedCount,
      capabilities: capabilities.map((capability) => cloneSafe(capability, {})),
      diagnostics: diagnostics.map((diagnostic) => cloneSafe(diagnostic, {}))
    });
    const byKey = new Map(capabilities.map((capability) => [capability.key, capability]));

    return Object.freeze({
      schema: RMT_KERNEL_FEATURE_ADOPTION_SCHEMA,
      reportSchema: RMT_KERNEL_FEATURE_ADOPTION_REPORT_SCHEMA,
      listCapabilityKeys() {
        return RMT_KERNEL_FEATURE_ADOPTION_CAPABILITY_KEYS.slice();
      },
      listCapabilities() {
        return capabilities.map((capability) => cloneSafe(capability, {}));
      },
      getCapability(key) {
        return cloneSafe(byKey.get(String(key || '')), null);
      },
      snapshot() {
        return cloneSafe(report, {
          schema: RMT_KERNEL_FEATURE_ADOPTION_REPORT_SCHEMA,
          contract: RMT_KERNEL_FEATURE_ADOPTION_SCHEMA,
          status: 'unavailable',
          ok: false,
          capabilityKeys: RMT_KERNEL_FEATURE_ADOPTION_CAPABILITY_KEYS.slice(),
          capabilities: [],
          diagnostics: []
        });
      }
    });
  }

  return Object.freeze({
    RMT_KERNEL_FEATURE_ADOPTION_SCHEMA,
    RMT_KERNEL_FEATURE_ADOPTION_REPORT_SCHEMA,
    RMT_KERNEL_FEATURE_ADOPTION_DIAGNOSTIC_SCHEMA,
    RMT_KERNEL_FEATURE_ADOPTION_CAPABILITIES,
    RMT_KERNEL_FEATURE_ADOPTION_CAPABILITY_KEYS,
    createRmtKernelFeatureAdoptionRegistry
  });
});

const __XTEND_RMT_KERNEL_FEATURE_ADOPTION_REGISTRY_API__ = globalThis.XTendRmtKernelFeatureAdoptionRegistry;

export const RMT_KERNEL_FEATURE_ADOPTION_SCHEMA = __XTEND_RMT_KERNEL_FEATURE_ADOPTION_REGISTRY_API__.RMT_KERNEL_FEATURE_ADOPTION_SCHEMA;
export const RMT_KERNEL_FEATURE_ADOPTION_REPORT_SCHEMA = __XTEND_RMT_KERNEL_FEATURE_ADOPTION_REGISTRY_API__.RMT_KERNEL_FEATURE_ADOPTION_REPORT_SCHEMA;
export const RMT_KERNEL_FEATURE_ADOPTION_DIAGNOSTIC_SCHEMA = __XTEND_RMT_KERNEL_FEATURE_ADOPTION_REGISTRY_API__.RMT_KERNEL_FEATURE_ADOPTION_DIAGNOSTIC_SCHEMA;
export const RMT_KERNEL_FEATURE_ADOPTION_CAPABILITIES = __XTEND_RMT_KERNEL_FEATURE_ADOPTION_REGISTRY_API__.RMT_KERNEL_FEATURE_ADOPTION_CAPABILITIES;
export const RMT_KERNEL_FEATURE_ADOPTION_CAPABILITY_KEYS = __XTEND_RMT_KERNEL_FEATURE_ADOPTION_REGISTRY_API__.RMT_KERNEL_FEATURE_ADOPTION_CAPABILITY_KEYS;
export const createRmtKernelFeatureAdoptionRegistry = __XTEND_RMT_KERNEL_FEATURE_ADOPTION_REGISTRY_API__.createRmtKernelFeatureAdoptionRegistry;

export default __XTEND_RMT_KERNEL_FEATURE_ADOPTION_REGISTRY_API__;

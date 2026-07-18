'use strict';

const crypto = require('crypto');
const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');
const {
  RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
  compileRmtVNextRemoteSource
} = require('./vnext-remote-compiler');
const {
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  createEnterpriseSurfaceRegistry
} = require('./vnext-enterprise-registry');
const {
  RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA
} = require('./vnext-cross-surface-events');
const {
  RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA
} = require('./vnext-event-governance');
const {
  RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
  createDegradationReport
} = require('./vnext-degradation');

const RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA = 'xtend.rmt.vnext-enterprise-fixture.v1';
const RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_SCHEMA = 'xtend.rmt.vnext-enterprise-fixture-matrix.v1';
const RMT_VNEXT_ENTERPRISE_BROWSER_SMOKE_SCHEMA = 'xtend.rmt.vnext-enterprise-browser-smoke.v1';
const RMT_VNEXT_ENTERPRISE_FIXTURE_REPORT_SCHEMA = 'xtend.rmt.vnext-enterprise-fixture-report.v1';
const RMT_VNEXT_ENTERPRISE_FIXTURE_WORKPACKAGE = 'WP-E16-11';
const RMT_VNEXT_ENTERPRISE_FIXTURE_MODULE_PATH = 'tools/rmt-language/vnext-enterprise-fixtures.js';
const RMT_VNEXT_ENTERPRISE_FIXTURE_SUITE_PATH = 'tests/rmt-language/rmt_vnext_enterprise_fixtures_suite.js';
const RMT_VNEXT_ENTERPRISE_FIXTURE_CONTRACT_PATH = 'development/XTendRMT-vNext-Enterprise-MFE-Fixtures-Contract.md';
const RMT_VNEXT_ENTERPRISE_FIXTURE_WP_PATH = 'development/WP-E16-11-Enterprise-Fixture-Remote-Reference-Demo-und-Browser-Smoke-Probe-bauen.md';
const RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH = 'demos/xtendrmt/fixtures/enterprise-mfe/source.rmt';
const RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH = 'demos/xtendrmt/fixtures/enterprise-mfe/generated/core.json';
const RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH = 'tests/browser/fixtures/rmt-vnext-enterprise-mfe-smoke.html';
const RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH = 'tests/rmt-language/fixtures/vnext-enterprise-mfe-fixture-matrix.json';
const RMT_VNEXT_ENTERPRISE_FIXTURE_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-enterprise-fixtures';

const ENTERPRISE_BROWSER_CHECKS = Object.freeze([
  'enterprise shell surface visible',
  'enterprise local fallback visible',
  'enterprise remote surface contract present',
  'enterprise cross surface event typed',
  'enterprise degradation fallback resolved',
  'enterprise browser smoke offline'
]);

const DEFAULT_ENTERPRISE_CATALOG = Object.freeze({
  owners: Object.freeze({
    root: 'shell-platform',
    'workspace.sales': 'sales-platform',
    'panel.checkoutFallback': 'checkout-platform',
    'checkout.cart': 'checkout-platform'
  }),
  versions: Object.freeze({
    root: '2.3.0',
    'workspace.sales': '1.8.0',
    'panel.checkoutFallback': '1.2.0',
    'checkout.cart': Object.freeze({
      active: '3.1.4',
      expected: '^3.1.0',
      range: '^3.1.0'
    })
  }),
  shellTargets: Object.freeze({
    root: Object.freeze(['shell.root']),
    'workspace.sales': Object.freeze([
      Object.freeze({
        lane: 'critical',
        target: 'shell.slot:main'
      })
    ]),
    'panel.checkoutFallback': Object.freeze([
      Object.freeze({
        lane: 'critical',
        target: 'shell.slot:sidebar.cart.fallback'
      })
    ]),
    'checkout.cart': Object.freeze([
      Object.freeze({
        lane: 'critical',
        target: 'shell.slot:sidebar.cart'
      }),
      Object.freeze({
        lane: 'idle',
        target: 'shell.slot:background.prefetch'
      })
    ])
  }),
  eventEmits: Object.freeze({
    'checkout.cart': Object.freeze(['checkout.cart.updated.v1'])
  }),
  eventConsumes: Object.freeze({
    'checkout.cart': Object.freeze(['user.session.changed.v1'])
  }),
  capabilities: Object.freeze({
    root: Object.freeze(['shell.host']),
    'workspace.sales': Object.freeze(['local.surface.mount']),
    'panel.checkoutFallback': Object.freeze(['fallback.surface.mount'])
  })
});

const DEFAULT_DEGRADATION_POLICIES = Object.freeze({
  root: Object.freeze({
    minShellVersion: '2.0.0',
    requiredCapabilities: Object.freeze(['shell.host'])
  }),
  'workspace.sales': Object.freeze({
    minShellVersion: '2.0.0',
    requiredCapabilities: Object.freeze(['local.surface.mount'])
  }),
  'panel.checkoutFallback': Object.freeze({
    minShellVersion: '2.0.0',
    requiredCapabilities: Object.freeze(['fallback.surface.mount'])
  }),
  'checkout.cart': Object.freeze({
    minShellVersion: '2.2.0',
    requiredCapabilities: Object.freeze(['surface.mount', 'event.emit', 'event.consume']),
    fallback: Object.freeze({
      kind: 'surface',
      ref: 'panel.checkoutFallback'
    }),
    eventPolicy: Object.freeze({
      whenDegraded: 'block-unlisted',
      allow: Object.freeze(['checkout.cart.updated.v1', 'user.session.changed.v1'])
    }),
    dataSourcePolicy: Object.freeze({
      whenDegraded: 'read-only'
    })
  })
});

const DEFAULT_AVAILABLE_CAPABILITIES = Object.freeze([
  'shell.host',
  'local.surface.mount',
  'fallback.surface.mount',
  'surface.mount',
  'event.emit',
  'event.consume'
]);

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableSort(value[key]);
      return result;
    }, {});
  }
  return value;
}

function canonicalJson(value) {
  return `${JSON.stringify(stableSort(value), null, 2)}\n`;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function readText(entry = {}, options = {}) {
  if (typeof entry.text === 'string') return entry.text;
  if (typeof entry === 'string' && typeof options.readFile === 'function') return options.readFile(entry);
  if (entry.path && typeof options.readFile === 'function') return options.readFile(entry.path);
  return '';
}

function sourceInput(entry = {}, options = {}) {
  const path = typeof entry === 'string' ? entry : entry.path || entry.filePath || RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH;
  return {
    text: readText(entry, options),
    filePath: path,
    version: 16
  };
}

function mergeCatalog(base, overrides) {
  return {
    ...cloneJson(base),
    ...cloneJson(overrides || {})
  };
}

function createEnterpriseRegistryFromCompile(compileResult, options = {}) {
  const catalog = {
    owners: mergeCatalog(DEFAULT_ENTERPRISE_CATALOG.owners, options.owners),
    versions: mergeCatalog(DEFAULT_ENTERPRISE_CATALOG.versions, options.versions),
    shellTargets: mergeCatalog(DEFAULT_ENTERPRISE_CATALOG.shellTargets, options.shellTargets),
    eventEmits: mergeCatalog(DEFAULT_ENTERPRISE_CATALOG.eventEmits, options.eventEmits),
    eventConsumes: mergeCatalog(DEFAULT_ENTERPRISE_CATALOG.eventConsumes, options.eventConsumes),
    capabilities: mergeCatalog(DEFAULT_ENTERPRISE_CATALOG.capabilities, options.capabilities)
  };

  return createEnterpriseSurfaceRegistry({
    coreDocument: compileResult.coreDocument,
    remoteManifests: compileResult.remoteManifests,
    registryId: options.registryId || 'enterprise:xtend.enterprise-mfe.demo',
    ...catalog
  });
}

function createEnterpriseDegradationReport(enterpriseRegistry, options = {}) {
  return createDegradationReport({
    enterpriseRegistry,
    policies: mergeCatalog(DEFAULT_DEGRADATION_POLICIES, options.policies),
    shellVersion: options.shellVersion || '2.3.0',
    availableCapabilities: toArray(options.availableCapabilities).length > 0
      ? options.availableCapabilities
      : DEFAULT_AVAILABLE_CAPABILITIES.slice()
  });
}

function createEnterpriseFixtureBundle(input = {}, options = {}) {
  const compileResult = compileRmtVNextRemoteSource(input, options.remoteCompiler || {});
  if (!compileResult.ok) {
    return {
      schema: RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA,
      workpackage: RMT_VNEXT_ENTERPRISE_FIXTURE_WORKPACKAGE,
      status: 'blocked',
      ok: false,
      sourcePath: input.filePath || null,
      compileResult,
      diagnostics: compileResult.diagnostics || []
    };
  }

  const enterpriseRegistry = createEnterpriseRegistryFromCompile(compileResult, options.enterprise || {});
  const degradation = createEnterpriseDegradationReport(enterpriseRegistry, options.degradation || {});
  const diagnostics = toArray(compileResult.diagnostics)
    .concat(toArray(enterpriseRegistry.diagnostics))
    .concat(toArray(compileResult.crossSurfaceEventReport && compileResult.crossSurfaceEventReport.diagnostics))
    .concat(toArray(compileResult.eventGovernanceReport && compileResult.eventGovernanceReport.diagnostics))
    .concat(toArray(degradation.diagnostics));
  const ok = compileResult.ok === true &&
    enterpriseRegistry.ok === true &&
    compileResult.crossSurfaceEventReport.status === 'ready' &&
    compileResult.eventGovernanceReport.status === 'ready' &&
    degradation.ok === true &&
    diagnostics.every((diagnostic) => diagnostic.severity !== 'error');

  return {
    schema: RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_FIXTURE_WORKPACKAGE,
    status: ok ? 'ready' : 'blocked',
    ok,
    sourcePath: input.filePath || null,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    remoteCompilerSchema: RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
    enterpriseRegistrySchema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    crossSurfaceEventReportSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA,
    eventGovernanceReportSchema: RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA,
    degradationReportSchema: RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
    document: compileResult.coreDocument,
    baseCoreJson: compileResult.baseCoreJson,
    remoteCompilerCoreJson: compileResult.coreJson,
    remoteManifests: compileResult.remoteManifests,
    enterpriseRegistry,
    crossSurfaceEvents: compileResult.crossSurfaceEventReport,
    eventGovernance: compileResult.eventGovernanceReport,
    degradation,
    diagnostics
  };
}

function createGoldenHashes(bundle) {
  return {
    baseCoreSha256: sha256(bundle.baseCoreJson),
    remoteCompilerCoreSha256: sha256(bundle.remoteCompilerCoreJson),
    enterpriseRegistrySha256: sha256(canonicalJson(bundle.enterpriseRegistry)),
    crossSurfaceEventsSha256: sha256(canonicalJson(bundle.crossSurfaceEvents)),
    eventGovernanceSha256: sha256(canonicalJson(bundle.eventGovernance)),
    degradationSha256: sha256(canonicalJson(bundle.degradation))
  };
}

function compareHashes(actual = {}, expected = {}) {
  return Object.keys(expected).reduce((mismatches, key) => {
    if (actual[key] !== expected[key]) {
      mismatches.push({
        key,
        expected: expected[key],
        actual: actual[key] || null
      });
    }
    return mismatches;
  }, []);
}

function hasNoNetworkExecution(html) {
  return !/fetch\s*\(/u.test(html) &&
    !/import\s*\(/u.test(html) &&
    !/<script[^>]+src=["']https?:/iu.test(html) &&
    !/https:\/\/cdn\.ccs-networks\.de/iu.test(html);
}

function createEnterpriseBrowserSmokeProbe(input = {}) {
  const html = String(input.html || '');
  const bundle = input.bundle || {};
  const document = bundle.document || {};
  const enterpriseRegistry = bundle.enterpriseRegistry || {};
  const crossSurfaceEvents = bundle.crossSurfaceEvents || {};
  const degradation = bundle.degradation || {};
  const surfaces = toArray(document.surfaces).map((surface) => surface.name);
  const remoteSurfaces = toArray(document.remoteSurfaces);
  const eventRecords = toArray(crossSurfaceEvents.events);
  const degradationSurfaces = toArray(degradation.surfaces);
  const checks = [
    {
      name: 'enterprise shell surface visible',
      ok: surfaces.includes('root') && html.includes('data-enterprise-shell="true"')
    },
    {
      name: 'enterprise local fallback visible',
      ok: surfaces.includes('panel.checkoutFallback') && html.includes('data-local-fallback="panel.checkoutFallback"')
    },
    {
      name: 'enterprise remote surface contract present',
      ok: remoteSurfaces.some((surface) => surface.name === 'checkout.cart' && surface.fallback && surface.fallback.ref === 'panel.checkoutFallback') &&
        toArray(enterpriseRegistry.surfaces).some((surface) => surface.name === 'checkout.cart' && surface.kind === 'remote')
    },
    {
      name: 'enterprise cross surface event typed',
      ok: eventRecords.some((event) => event.event === 'checkout.cart.updated.v1' &&
        event.payload && event.payload.schema === 'xtend.schemas.cartUpdated.v1' &&
        event.outboundCount === 1 &&
        event.inboundCount === 1)
    },
    {
      name: 'enterprise degradation fallback resolved',
      ok: degradation.status === 'full' &&
        degradationSurfaces.some((surface) => surface.name === 'checkout.cart' && surface.fallbackResolution && surface.fallbackResolution.resolved === true)
    },
    {
      name: 'enterprise browser smoke offline',
      ok: html.includes('"networkRequests": 0') &&
        html.includes('"remoteExecution": false') &&
        hasNoNetworkExecution(html)
    }
  ];

  return {
    schema: RMT_VNEXT_ENTERPRISE_BROWSER_SMOKE_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_FIXTURE_WORKPACKAGE,
    status: checks.every((check) => check.ok) ? 'passed' : 'failed',
    ok: checks.every((check) => check.ok),
    resultKey: input.resultKey || '__xtendRmtVNextEnterpriseSmokeResult',
    fixturePath: input.fixturePath || null,
    checkCount: checks.length,
    checks,
    errors: checks.filter((check) => !check.ok).map((check) => check.name)
  };
}

function createEnterpriseFixtureReport(matrix = {}, options = {}) {
  const demo = matrix.demo || {};
  const input = sourceInput({
    path: demo.source || RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH
  }, options);
  const bundle = createEnterpriseFixtureBundle(input, options);
  const coreOutput = demo.coreOutput && typeof options.readFile === 'function' ? options.readFile(demo.coreOutput) : '';
  const browserHtml = demo.browserSmoke && demo.browserSmoke.path && typeof options.readFile === 'function'
    ? options.readFile(demo.browserSmoke.path)
    : '';
  const hashes = bundle.ok ? createGoldenHashes(bundle) : {};
  const hashMismatches = compareHashes(hashes, demo.expectedHashes || {});
  const browserSmoke = createEnterpriseBrowserSmokeProbe({
    html: browserHtml,
    bundle,
    fixturePath: demo.browserSmoke && demo.browserSmoke.path,
    resultKey: demo.browserSmoke && demo.browserSmoke.resultKey
  });
  const missingBrowserChecks = toArray(demo.browserSmoke && demo.browserSmoke.expectedChecks)
    .filter((check) => !browserHtml.includes(`recordCheck('${check}'`));
  const coreOutputMatches = Boolean(bundle.ok && coreOutput === bundle.baseCoreJson);
  const expected = demo.expected || {};
  const countMismatches = [];

  if (bundle.ok) {
    [
      ['remoteSurfaceCount', toArray(bundle.document.remoteSurfaces).length],
      ['localSurfaceCount', bundle.enterpriseRegistry.localSurfaceCount],
      ['eventCount', bundle.crossSurfaceEvents.eventCount],
      ['degradationStatus', bundle.degradation.status]
    ].forEach(([key, actual]) => {
      if (expected[key] !== undefined && expected[key] !== actual) {
        countMismatches.push({
          key,
          expected: expected[key],
          actual
        });
      }
    });
  }

  const ok = bundle.ok === true &&
    coreOutputMatches &&
    browserSmoke.ok === true &&
    hashMismatches.length === 0 &&
    missingBrowserChecks.length === 0 &&
    countMismatches.length === 0;

  return {
    schema: RMT_VNEXT_ENTERPRISE_FIXTURE_REPORT_SCHEMA,
    fixtureSchema: RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA,
    matrixSchema: RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_SCHEMA,
    browserSmokeSchema: RMT_VNEXT_ENTERPRISE_BROWSER_SMOKE_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_FIXTURE_WORKPACKAGE,
    status: ok ? 'passed' : 'failed',
    ok,
    sourcePath: input.filePath,
    coreOutputPath: demo.coreOutput || null,
    browserFixturePath: demo.browserSmoke && demo.browserSmoke.path || null,
    coreOutputMatches,
    hashes,
    hashMismatches,
    countMismatches,
    missingBrowserChecks,
    remoteSurfaceCount: bundle.ok ? toArray(bundle.document.remoteSurfaces).length : 0,
    localSurfaceCount: bundle.ok ? bundle.enterpriseRegistry.localSurfaceCount : 0,
    eventCount: bundle.ok ? bundle.crossSurfaceEvents.eventCount : 0,
    degradationStatus: bundle.ok ? bundle.degradation.status : null,
    browserSmoke,
    bundle
  };
}

function createRmtVNextEnterpriseFixturesAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA,
    reportSchema: RMT_VNEXT_ENTERPRISE_FIXTURE_REPORT_SCHEMA,
    matrixSchema: RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_SCHEMA,
    browserSmokeSchema: RMT_VNEXT_ENTERPRISE_BROWSER_SMOKE_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_FIXTURE_WORKPACKAGE,
    createBundle: (input = {}, options = {}) => createEnterpriseFixtureBundle(input, {
      ...defaultOptions,
      ...options
    }),
    createBrowserSmokeProbe: createEnterpriseBrowserSmokeProbe,
    createReport: (matrix = {}, options = {}) => createEnterpriseFixtureReport(matrix, {
      ...defaultOptions,
      ...options
    }),
    createGoldenHashes,
    serializeBundle: (bundle) => canonicalJson(bundle)
  });
}

module.exports = {
  DEFAULT_AVAILABLE_CAPABILITIES,
  DEFAULT_DEGRADATION_POLICIES,
  DEFAULT_ENTERPRISE_CATALOG,
  ENTERPRISE_BROWSER_CHECKS,
  RMT_VNEXT_ENTERPRISE_BROWSER_SMOKE_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_CONTRACT_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_MODULE_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_PACKAGE_SCRIPT,
  RMT_VNEXT_ENTERPRISE_FIXTURE_REPORT_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_SUITE_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_WORKPACKAGE,
  RMT_VNEXT_ENTERPRISE_FIXTURE_WP_PATH,
  createEnterpriseBrowserSmokeProbe,
  createEnterpriseDegradationReport,
  createEnterpriseFixtureBundle,
  createEnterpriseFixtureReport,
  createEnterpriseRegistryFromCompile,
  createGoldenHashes,
  createRmtVNextEnterpriseFixturesAdapter
};

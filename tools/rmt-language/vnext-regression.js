'use strict';

const crypto = require('crypto');
const {
  parseRmtVNextSource
} = require('./vnext-parser');
const {
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource
} = require('./vnext-compiler');

const RMT_VNEXT_REGRESSION_SCHEMA = 'xtend.rmt.vnext-regression-gate.v1';
const RMT_VNEXT_FIXTURE_MATRIX_SCHEMA = 'xtend.rmt.vnext-fixture-matrix.v1';
const RMT_VNEXT_GOLDEN_REPORT_SCHEMA = 'xtend.rmt.vnext-golden-report.v1';
const RMT_VNEXT_FUZZ_REPORT_SCHEMA = 'xtend.rmt.vnext-fuzz-report.v1';
const RMT_VNEXT_BROWSER_SMOKE_SCHEMA = 'xtend.rmt.vnext-browser-smoke.v1';
const RMT_VNEXT_REGRESSION_REPORT_SCHEMA = 'xtend.rmt.vnext-regression-report.v1';
const RMT_VNEXT_REGRESSION_WORKPACKAGE = 'WP-E15-17';
const RMT_VNEXT_REGRESSION_MODULE_PATH = 'tools/rmt-language/vnext-regression.js';
const RMT_VNEXT_REGRESSION_SUITE_PATH = 'tests/rmt-language/rmt_vnext_regression_suite.js';
const RMT_VNEXT_FIXTURE_MATRIX_PATH = 'tests/rmt-language/fixtures/vnext-fixture-matrix.json';
const RMT_VNEXT_BROWSER_SMOKE_FIXTURE_PATH = 'tests/browser/fixtures/rmt-vnext-reference-smoke.html';
const RMT_VNEXT_REGRESSION_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-regression';

const CORE_DOMAINS = Object.freeze([
  'imports',
  'templates',
  'surfaces',
  'lanes',
  'operations',
  'slots',
  'events',
  'dataSources',
  'securityPolicies',
  'sourceMap'
]);

const DEFAULT_FUZZ_MUTATIONS = Object.freeze([
  {
    id: 'drop-final-brace',
    description: 'remove final closing brace',
    mutate(source) {
      const index = String(source).lastIndexOf('}');
      return index >= 0 ? `${source.slice(0, index)}${source.slice(index + 1)}` : `${source}\n}`;
    }
  },
  {
    id: 'imperative-keyword',
    description: 'inject blocked imperative control flow',
    mutate(source) {
      return `${source}\nif route.visible { mount blocked.component }\n`;
    }
  },
  {
    id: 'function-call-condition',
    description: 'inject a forbidden function call in a condition',
    mutate(source) {
      return `${source}\ntemplate fuzz.condition { surface root { lane visible { hydrate fuzz-target when runtime.ready() } } }\n`;
    }
  },
  {
    id: 'unterminated-string',
    description: 'inject an unterminated string literal',
    mutate(source) {
      return `${source}\ntemplate fuzz.string { surface root { lane visible { stream fuzz from sse feed { trust boundary "unterminated } } } }\n`;
    }
  },
  {
    id: 'stray-token',
    description: 'prepend a token outside the grammar',
    mutate(source) {
      return `@${source}`;
    }
  }
]);

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function readFixture(entry = {}, options = {}) {
  if (typeof entry.text === 'string') return entry.text;
  if (entry.path && typeof options.readFile === 'function') return options.readFile(entry.path);
  return '';
}

function sourceInput(entry = {}, options = {}) {
  return {
    text: readFixture(entry, options),
    filePath: entry.filePath || entry.path || entry.id || 'rmt-vnext-fixture.rmt',
    version: 15
  };
}

function countCoreDomains(coreDocument) {
  return CORE_DOMAINS.reduce((result, domain) => {
    result[domain] = toArray(coreDocument && coreDocument[domain]).length;
    return result;
  }, {});
}

function compareExpectedCounts(actual, expected = {}) {
  return Object.keys(expected).reduce((mismatches, key) => {
    if (actual[key] !== expected[key]) {
      mismatches.push({
        domain: key,
        expected: expected[key],
        actual: actual[key]
      });
    }
    return mismatches;
  }, []);
}

function diagnosticCodes(diagnostics) {
  return toArray(diagnostics).map((diagnostic) => diagnostic.code);
}

function createGoldenCompilerReport(matrix = {}, options = {}) {
  const entries = toArray(matrix.positive).map((entry) => {
    const result = compileRmtVNextSource(sourceInput(entry, options), options.compilerOptions || {});
    const coreJson = result.coreJson || '';
    const actualHash = sha256(coreJson);
    const actualCounts = countCoreDomains(result.coreDocument);
    const countMismatches = compareExpectedCounts(actualCounts, entry.expected && entry.expected.domainCounts);
    const expectedHash = entry.expected && entry.expected.coreSha256;
    const hashMatches = actualHash === expectedHash;
    const ok = result.ok === true && hashMatches && countMismatches.length === 0;

    return {
      id: entry.id,
      path: entry.path,
      status: ok ? 'passed' : 'failed',
      ok,
      compilerStatus: result.status,
      coreSchema: result.coreDocument ? result.coreDocument.schema : null,
      documentId: result.coreDocument && result.coreDocument.manifest ? result.coreDocument.manifest.documentId : null,
      expectedHash,
      actualHash,
      hashMatches,
      expectedCounts: entry.expected ? entry.expected.domainCounts : {},
      actualCounts,
      countMismatches,
      diagnosticCodes: diagnosticCodes(result.diagnostics)
    };
  });

  return {
    schema: RMT_VNEXT_GOLDEN_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_REGRESSION_WORKPACKAGE,
    status: entries.every((entry) => entry.ok) ? 'passed' : 'failed',
    ok: entries.every((entry) => entry.ok),
    entryCount: entries.length,
    entries
  };
}

function createNegativeFixtureReport(matrix = {}, options = {}) {
  const entries = toArray(matrix.negative).map((entry) => {
    const result = compileRmtVNextSource(sourceInput(entry, options), options.compilerOptions || {});
    const codes = diagnosticCodes(result.diagnostics);
    const expectedCodes = toArray(entry.expectedDiagnosticCodes);
    const missingCodes = expectedCodes.filter((code) => !codes.includes(code));
    const ok = result.ok === false && result.coreDocument === null && missingCodes.length === 0;

    return {
      id: entry.id,
      path: entry.path,
      status: ok ? 'passed' : 'failed',
      ok,
      compilerStatus: result.status,
      expectedDiagnosticCodes: expectedCodes,
      actualDiagnosticCodes: codes,
      missingCodes
    };
  });

  return {
    schema: RMT_VNEXT_FIXTURE_MATRIX_SCHEMA,
    workpackage: RMT_VNEXT_REGRESSION_WORKPACKAGE,
    status: entries.every((entry) => entry.ok) ? 'passed' : 'failed',
    ok: entries.every((entry) => entry.ok),
    entryCount: entries.length,
    entries
  };
}

function createFixtureMatrixReport(matrix = {}, options = {}) {
  const golden = createGoldenCompilerReport(matrix, options);
  const negative = createNegativeFixtureReport(matrix, options);

  return {
    schema: RMT_VNEXT_FIXTURE_MATRIX_SCHEMA,
    workpackage: RMT_VNEXT_REGRESSION_WORKPACKAGE,
    status: golden.ok && negative.ok ? 'passed' : 'failed',
    ok: golden.ok && negative.ok,
    positiveCount: golden.entryCount,
    negativeCount: negative.entryCount,
    golden,
    negative
  };
}

function createParserFuzzReport(seeds = [], options = {}) {
  const mutations = toArray(options.mutations).length > 0 ? options.mutations : DEFAULT_FUZZ_MUTATIONS;
  const entries = toArray(seeds).flatMap((seed) => {
    const source = readFixture(seed, options);
    return mutations.map((mutation) => {
      let result = null;
      let thrown = null;
      try {
        result = parseRmtVNextSource({
          text: mutation.mutate(source),
          filePath: `${seed.path || seed.id || 'seed'}.${mutation.id}.rmt`,
          version: 15
        }, options.parserOptions || {});
      } catch (error) {
        thrown = error;
      }

      const diagnostics = result ? toArray(result.diagnostics) : [];
      const hasRange = diagnostics.every((diagnostic) => diagnostic.range && diagnostic.range.start && diagnostic.range.end);
      const ok = !thrown && result && result.ok === false && diagnostics.length > 0 && hasRange;

      return {
        seed: seed.id || seed.path,
        mutation: mutation.id,
        description: mutation.description,
        status: ok ? 'recovered' : 'failed',
        ok,
        thrown: thrown ? thrown.message : null,
        parserStatus: result ? result.status : null,
        diagnosticCount: diagnostics.length,
        diagnosticCodes: diagnosticCodes(diagnostics),
        rangesAvailable: hasRange
      };
    });
  });

  return {
    schema: RMT_VNEXT_FUZZ_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_REGRESSION_WORKPACKAGE,
    status: entries.every((entry) => entry.ok) ? 'passed' : 'failed',
    ok: entries.every((entry) => entry.ok),
    seedCount: toArray(seeds).length,
    mutationCount: mutations.length,
    entryCount: entries.length,
    entries
  };
}

function createBrowserSmokeProbe(coreDocument = {}, options = {}) {
  const operations = toArray(coreDocument.operations);
  const lanes = toArray(coreDocument.lanes);
  const securityPolicies = toArray(coreDocument.securityPolicies);
  const checks = [
    {
      name: 'vNext surface root visible',
      ok: toArray(coreDocument.surfaces).some((surface) => surface.name === 'root')
    },
    {
      name: 'vNext lifecycle operation available',
      ok: operations.some((operation) => operation.kind === 'lifecycle' && operation.op === 'hydrate')
    },
    {
      name: 'vNext scheduler lane weighted',
      ok: lanes.some((lane) => typeof lane.weight === 'number')
    },
    {
      name: 'vNext security policy attached',
      ok: securityPolicies.some((policy) => policy.kind === 'trust_boundary') &&
        securityPolicies.some((policy) => policy.kind === 'sanitize')
    },
    {
      name: 'vNext streaming operation available',
      ok: operations.some((operation) => operation.kind === 'stream') && toArray(coreDocument.dataSources).length > 0
    }
  ];

  return {
    schema: RMT_VNEXT_BROWSER_SMOKE_SCHEMA,
    workpackage: RMT_VNEXT_REGRESSION_WORKPACKAGE,
    status: checks.every((check) => check.ok) ? 'passed' : 'failed',
    ok: checks.every((check) => check.ok),
    resultKey: options.resultKey || '__xtendRmtVNextSmokeResult',
    coreSchema: coreDocument.schema || null,
    documentId: coreDocument.manifest ? coreDocument.manifest.documentId : null,
    checks
  };
}

function createBrowserReferenceReport(matrix = {}, options = {}) {
  const smoke = matrix.browserSmoke || {};
  const sourceEntry = toArray(matrix.positive).find((entry) => entry.id === smoke.sourceFixtureId) || toArray(matrix.positive)[0] || {};
  const compileResult = compileRmtVNextSource(sourceInput(sourceEntry, options), options.compilerOptions || {});
  const probe = compileResult.coreDocument ? createBrowserSmokeProbe(compileResult.coreDocument, {
    resultKey: smoke.resultKey
  }) : null;
  const html = smoke.path && typeof options.readFile === 'function' ? options.readFile(smoke.path) : '';
  const expectedChecks = toArray(smoke.expectedChecks);
  const missingChecks = expectedChecks.filter((check) => !html.includes(`recordCheck('${check}'`));
  const ok = compileResult.ok === true &&
    probe &&
    probe.ok === true &&
    html.includes(RMT_VNEXT_BROWSER_SMOKE_SCHEMA) &&
    html.includes(smoke.resultKey || '__xtendRmtVNextSmokeResult') &&
    missingChecks.length === 0;

  return {
    schema: RMT_VNEXT_BROWSER_SMOKE_SCHEMA,
    workpackage: RMT_VNEXT_REGRESSION_WORKPACKAGE,
    status: ok ? 'passed' : 'failed',
    ok,
    fixturePath: smoke.path || null,
    sourceFixtureId: sourceEntry.id || null,
    resultKey: smoke.resultKey || '__xtendRmtVNextSmokeResult',
    missingChecks,
    probe
  };
}

function createRmtVNextRegressionReport(matrix = {}, options = {}) {
  const fixtureMatrix = createFixtureMatrixReport(matrix, options);
  const fuzzSeeds = toArray(matrix.fuzzSeeds).map((seedId) => toArray(matrix.positive).find((entry) => entry.id === seedId)).filter(Boolean);
  const fuzz = createParserFuzzReport(fuzzSeeds, options);
  const browserSmoke = createBrowserReferenceReport(matrix, options);
  const ok = fixtureMatrix.ok && fuzz.ok && browserSmoke.ok;

  return {
    schema: RMT_VNEXT_REGRESSION_REPORT_SCHEMA,
    gateSchema: RMT_VNEXT_REGRESSION_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_REGRESSION_WORKPACKAGE,
    status: ok ? 'passed' : 'failed',
    ok,
    fixtureMatrix,
    fuzz,
    browserSmoke
  };
}

function createRmtVNextRegressionAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_REGRESSION_SCHEMA,
    reportSchema: RMT_VNEXT_REGRESSION_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_REGRESSION_WORKPACKAGE,
    createFixtureMatrixReport: (matrix = {}, options = {}) => createFixtureMatrixReport(matrix, {
      ...defaultOptions,
      ...options
    }),
    createParserFuzzReport: (seeds = [], options = {}) => createParserFuzzReport(seeds, {
      ...defaultOptions,
      ...options
    }),
    createBrowserSmokeProbe,
    createBrowserReferenceReport: (matrix = {}, options = {}) => createBrowserReferenceReport(matrix, {
      ...defaultOptions,
      ...options
    }),
    createRegressionReport: (matrix = {}, options = {}) => createRmtVNextRegressionReport(matrix, {
      ...defaultOptions,
      ...options
    })
  });
}

module.exports = {
  CORE_DOMAINS,
  DEFAULT_FUZZ_MUTATIONS,
  RMT_VNEXT_BROWSER_SMOKE_FIXTURE_PATH,
  RMT_VNEXT_BROWSER_SMOKE_SCHEMA,
  RMT_VNEXT_FIXTURE_MATRIX_PATH,
  RMT_VNEXT_FIXTURE_MATRIX_SCHEMA,
  RMT_VNEXT_FUZZ_REPORT_SCHEMA,
  RMT_VNEXT_GOLDEN_REPORT_SCHEMA,
  RMT_VNEXT_REGRESSION_MODULE_PATH,
  RMT_VNEXT_REGRESSION_PACKAGE_SCRIPT,
  RMT_VNEXT_REGRESSION_REPORT_SCHEMA,
  RMT_VNEXT_REGRESSION_SCHEMA,
  RMT_VNEXT_REGRESSION_SUITE_PATH,
  RMT_VNEXT_REGRESSION_WORKPACKAGE,
  createBrowserReferenceReport,
  createBrowserSmokeProbe,
  createFixtureMatrixReport,
  createGoldenCompilerReport,
  createNegativeFixtureReport,
  createParserFuzzReport,
  createRmtVNextRegressionAdapter,
  createRmtVNextRegressionReport
};

'use strict';

// Private A06.6.1 planning contract. This deliberately grants no runtime or
// release authority and never executes the source files it inspects.
const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
const TARGET_MATRIX_SCHEMA = 'xtend.rmtx.release-targets.v1';
const TARGET_MATRIX_API_VERSION = '1.0.0';
const REPORT_SCHEMA = 'xtend.rmtx.release-target-check.v1';
const ROOT = path.resolve(__dirname, '../../..');
const MATRIX_PATH = 'development/rmtx-a06/release-acceptance/targets.v1.json';
const MODES = ['standalone', 'project-rmtx-entry', 'project-classic-entry-effective-rmtx'];
const ALL_SOURCES = [1, 2, 3, 4, 5, 6, 7, 8];
const NATIVE_SOURCES = [5, 6, 7, 8];
const AUTHORING = ['rmtx-compiler8', 'rmt-project1', 'maraca-project1'];
const SSR_ENTRIES = [...AUTHORING, 'retained-ssr-server2', 'retained-ssr-browser2'];
const ENTRIES = {
  'rmtx-compiler8': ['tools/rmt-language/rmtx-compiler.js', 'compileRmtxSource', '8.0.0', 'RMTX_COMPILER_API_VERSION', 'authoring'],
  'rmt-project1': ['tools/rmt-language/rmt-project.js', 'compileRmtProjectSource', '1.0.0', 'RMT_PROJECT_API_VERSION', 'authoring'],
  'maraca-project1': ['xtend-maraca/project-build.js', 'buildMaracaProjectBundleAsync', '1.0.0', 'MARACA_PROJECT_API_VERSION', 'authoring'],
  'retained-ssr-server2': ['xtend-maraca/xtension-ssr.js', 'renderMaracaXTensionSSR', '2.0.0', 'XTENSION_SSR_API_VERSION', 'retained-legacy-scoped-only'],
  'retained-ssr-browser2': ['xtend-maraca/xtension-ssr-runtime.mjs', 'createMaracaXTensionSSRSession', '2.0.0', 'XTENSION_SSR_API_VERSION', 'retained-legacy-scoped-only']
};
const TARGETS = {
  'framework-csr': ['csr', ['react', 'vue'], ALL_SOURCES, AUTHORING, 'csr-present', ['client-restore', 'controlled-props', 'validated-intents', 'kernel-fabric']],
  'native-csr': ['csr', ['native'], NATIVE_SOURCES, AUTHORING, 'csr-present', ['native-view', 'client-restore', 'kernel-fabric', 'managed-client-activation']],
  'framework-node-ssr': ['node-ssr-sync', ['react', 'vue'], ALL_SOURCES, SSR_ENTRIES, 'pending-versioned-handoff', ['signed-restore', 'dom-identity-adoption', 'declared-provider-intent-replay', 'limited-mount-fallback', 'kernel-fabric']],
  'native-node-ssr': ['node-ssr-sync', ['native'], NATIVE_SOURCES, SSR_ENTRIES, 'pending-versioned-handoff', ['native-light-dom', 'stable-managed-host-shells', 'signed-restore', 'managed-client-activation', 'kernel-fabric']]
};
const POLICIES = {
  authority: { ownerChain: ['model', 'kernel', 'fabric', 'surface'], parallelController: false, restoreBeforeAdoption: true, adoptionBeforeProviderReplay: true },
  lanes: { names: ['user-blocking', 'visible', 'transition', 'idle', 'background', 'diagnostics'], source6Mount: ['visible'], source7And8Mount: 'all-six', meaning: 'kernel-priority', strategy: 'separate', viewportActivation: false, noAdmission: 'remain-unmounted' },
  loading: { provider: 'on-admitted-mount', chain: ['kernel', 'fabric', 'provider', 'peers', 'synchronous-factory', 'root'], peerProfiles: 'retain-versioned-contracts', cancellation: 'revoke-continuations-not-esm-transport', timeout: 'explicit-timeoutMs-only', retry: 'new-authorized-attempt-only', declarativeErrorTimeoutRetryUI: false, providerInternalCsrUI: true },
  ssr: { server: 'node', frameworks: ['react', 'vue'], render: 'synchronous-precompiled', streaming: false, nativeView: 'light-dom-and-stable-managed-host-shells', managedInternals: 'client-owned', replay: 'declared-provider-intents-only', projectIdentity: 'source-and-composition-and-project', newHandoff: 'new-explicit-contract-version', legacyWire: 'retain-unmodified' },
  fallback: { default: 'reject', optIn: 'mount', allowedMismatch: 'framework-subtree-only', requires: ['valid-signed-unexpired-snapshot', 'exact-source-project-state-provider-interface-artifact-pins', 'current-owner-generation', 'unchanged-shell-exclusive-container'], replacementReport: 'fallback-mounted', replacementPreservesDomIdentity: false },
  layout: { owner: 'author-container-and-styles', platformClsGuarantee: false, implicitReservation: false, byteBudgetsAreLayoutBudgets: false },
  'provider-boundary': { schemaOwner: 'provider', liveIntentValidation: 'each-intent-before-model-command', replayValidation: 'whole-batch-before-first-model-command', crossOwnership: false, localUiState: 'provider-local-under-host-lifetime', controlledModelStateAuthority: 'model', deepLinkedState: 'xtend-state', slots: 'declared-owned-slots-only', automaticDeploymentMigration: false }
};
const EXCLUSIONS = {
  'additional-frameworks': 'extra-framework-denied',
  'streaming-async-ssr': 'ssr-async-streaming-denied',
  'portable-rmtx-pages': 'portable-rmtx-node-php-denied',
  'cross-owner-slots-portals': 'cross-owner-slot-denied',
  'isolated-untrusted-hosts': 'isolated-host-denied',
  'automatic-deployment-migration': 'deployment-migration-denied',
  'arbitrary-ssr-pwa-services': 'arbitrary-platform-combinations-denied',
  'universal-native-event-replay': 'native-event-replay-denied',
  'automatic-error-timeout-retry-ui': 'timeout-no-retry-ui',
  'platform-layout-guarantee': 'no-implicit-layout-guarantee',
  'server-managed-internals': 'native-shadow-ssr-denied'
};
const POLICY_CASES = {
  authority: [['kernel-fabric-admission', 'ssr-restore-adopt-replay'], ['csr-invalid-boundary', 'ssr-identity-mismatch']],
  lanes: [['lane-forwarding'], ['lane-invalid-retained-source6', 'no-admission-no-load']],
  loading: [['kernel-fabric-admission', 'shared-import-cancel', 'explicit-retry'], ['no-admission-no-load', 'timeout-no-retry-ui', 'ssr-cancel-no-late-work']],
  ssr: [['ssr-native-react-vue', 'ssr-typed-nested-keys', 'ssr-intent-dedupe', 'classic-compatibility'], ['ssr-async-streaming-denied', 'ssr-old-wire-not-upgraded', 'native-event-replay-denied', 'native-shadow-ssr-denied']],
  fallback: [['ssr-limited-mount-fallback'], ['ssr-invalid-signature-expiry', 'ssr-identity-mismatch', 'ssr-shell-container-tamper', 'ssr-adoption-error-no-fallback']],
  layout: [['author-owned-layout'], ['no-implicit-layout-guarantee']],
  'provider-boundary': [['provider-schema-authority', 'ssr-intent-dedupe'], ['csr-invalid-boundary', 'ssr-invalid-replay-batch', 'cross-owner-slot-denied', 'deployment-migration-denied']]
};
const PROFILE_DIRS = ['frontend', 'selector-profile', 'keyed-profile', 'orchestration-profile', 'native-view-profile', 'lifecycle-profile', 'native-orchestration-profile', 'native-component-catalog'];
const SSR_POSITIVE = ['ssr-native-react-vue', 'ssr-restore-adopt-replay', 'ssr-typed-nested-keys', 'ssr-intent-dedupe', 'ssr-limited-mount-fallback', 'classic-compatibility'];
const SSR_NEGATIVE = ['ssr-invalid-signature-expiry', 'ssr-identity-mismatch', 'ssr-shell-container-tamper', 'ssr-invalid-replay-batch', 'ssr-cancel-no-late-work', 'ssr-old-wire-not-upgraded', 'ssr-async-streaming-denied', 'ssr-adoption-error-no-fallback'];
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const unique = values => new Set(values).size === values.length;
const contains = (values, value) => Array.isArray(values) && values.includes(value);

function readTargetMatrix(rootDir = ROOT) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, MATRIX_PATH), 'utf8'));
}

function validateTargetMatrix(input, { rootDir = ROOT, checkSources = true } = {}) {
  const errors = [], sourceCache = new Map(), referencedCases = new Set();
  const fail = (code, at, message) => errors.push({ code: `xtend.rmtx.targets.${code}`, path: at, message });
  function shape(value, keys, at) {
    if (!record(value)) { fail('shape', at, 'Expected an object.'); return false; }
    if (!isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort())) fail('fields', at, 'Missing or unknown fields.');
    return true;
  }
  function equal(actual, expected, at) {
    if (!isDeepStrictEqual(actual, expected)) fail('scope', at, 'Value differs from the selected versioned scope.');
  }
  function strings(value, at) {
    if (!Array.isArray(value) || !value.length || value.some(item => !text(item)) || !unique(value)) {
      fail('list', at, 'Expected unique nonempty strings.'); return [];
    }
    return value;
  }
  function rows(value, requiredIds, at, key = 'id') {
    if (!Array.isArray(value)) { fail('list', at, 'Expected an array.'); return []; }
    const ids = value.map(row => record(row) ? row[key] : undefined);
    if (!unique(ids)) fail('duplicate', at, 'Duplicate identity.');
    if (requiredIds && !isDeepStrictEqual([...ids].sort(), [...requiredIds].sort())) fail('scope', at, 'Missing or unknown identities.');
    return value;
  }
  function source(file, at) {
    // Apply lexical containment even when callers disable filesystem checks.
    if (!text(file) || file.includes('\\') || file.includes('\0') || path.posix.isAbsolute(file)
      || /^[A-Za-z]:/u.test(file) || file.split('/').some(part => !part || part === '.' || part === '..')) {
      fail('source_path', at, 'Expected a repository-relative file without traversal.'); return null;
    }
    if (!checkSources) return null;
    if (sourceCache.has(file)) return sourceCache.get(file);
    try {
      const realRoot = fs.realpathSync(rootDir), realFile = fs.realpathSync(path.join(realRoot, file));
      const relative = path.relative(realRoot, realFile);
      if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative) || !fs.statSync(realFile).isFile()) throw new Error('Not a contained source file.');
      const content = fs.readFileSync(realFile, 'utf8');
      sourceCache.set(file, content); return content;
    } catch (error) {
      fail('source_unavailable', at, `Cannot read contained source: ${file}.`); return null;
    }
  }
  const report = () => ({ schema: REPORT_SCHEMA, apiVersion: TARGET_MATRIX_API_VERSION, valid: errors.length === 0, errors,
    selectedTargets: Array.isArray(input?.targets) ? input.targets.length : 0,
    sourceProfiles: Array.isArray(input?.sourceProfiles) ? input.sourceProfiles.length : 0,
    requiredCases: Array.isArray(input?.cases) ? input.cases.length : 0, acceptedForRelease: false });
  if (!shape(input, ['schema', 'apiVersion', 'targetVersion', 'decision', 'releaseAcceptance', 'entrypoints', 'sourceProfiles', 'targets', 'policies', 'exclusions', 'cases'], '$')) return report();
  equal(input.schema, TARGET_MATRIX_SCHEMA, '$.schema');
  equal(input.apiVersion, TARGET_MATRIX_API_VERSION, '$.apiVersion');
  equal(input.targetVersion, '0.9.0', '$.targetVersion');
  equal(input.decision, { status: 'scope-selected', date: '2026-11-21', userConfirmed: true }, '$.decision');
  equal(input.releaseAcceptance, { status: 'pending', acceptedForRelease: false, executionEvidence: null, milestone: 'A06.6' }, '$.releaseAcceptance');

  const caseMap = new Map();
  for (const [index, row] of rows(input.cases, null, '$.cases').entries()) {
    const at = `$.cases[${index}]`;
    if (!shape(row, ['id', 'kind', 'status', 'phase', 'expectation', 'referencePaths', 'coverage'], at)) continue;
    if (!text(row.id) || !/^[a-z][a-z0-9-]+$/u.test(row.id)) fail('identity', at + '.id', 'Invalid case identity.');
    if (!['positive', 'negative'].includes(row.kind)) fail('case_kind', at + '.kind', 'Expected positive or negative.');
    equal(row.status, 'planned', at + '.status');
    if (!['A06.6.2', 'A06.6.4'].includes(row.phase)) fail('phase', at + '.phase', 'Unknown acceptance phase.');
    if (!text(row.expectation)) fail('expectation', at, 'A case needs a concrete expectation.');
    for (const ref of strings(row.referencePaths, at + '.referencePaths')) source(ref, at + '.referencePaths');
    if (row.coverage !== null) {
      if (shape(row.coverage, ['targetIds', 'sourceProfiles', 'frameworks', 'projectModes'], at + '.coverage')) {
        for (const key of ['targetIds', 'frameworks', 'projectModes']) strings(row.coverage[key], at + '.coverage.' + key);
        if (!Array.isArray(row.coverage.sourceProfiles) || !row.coverage.sourceProfiles.length || !unique(row.coverage.sourceProfiles)
          || row.coverage.sourceProfiles.some(v => !ALL_SOURCES.includes(v))) fail('coverage', at + '.coverage.sourceProfiles', 'Unknown or duplicate source dimension.');
        for (const [key, allowed] of [['targetIds', Object.keys(TARGETS)], ['frameworks', ['native', 'react', 'vue']], ['projectModes', MODES]]) {
          if (Array.isArray(row.coverage[key]) && row.coverage[key].some(v => !allowed.includes(v))) fail('coverage', at + '.coverage.' + key, 'Unknown coverage dimension.');
        }
        equal(row.kind, 'positive', at + '.kind');
      }
    }
    caseMap.set(row.id, row);
  }
  function cases(refs, kind, at) {
    const result = strings(refs, at);
    for (const id of result) {
      referencedCases.add(id);
      if (caseMap.get(id)?.kind !== kind) fail('case_reference', at, `Missing ${kind} case: ${id}.`);
    }
    return result;
  }
  function required(refs, ids, at) {
    for (const id of ids) if (!refs.includes(id)) fail('required_case', at, `Required case omitted: ${id}.`);
  }
  for (const [index, row] of rows(input.entrypoints, Object.keys(ENTRIES), '$.entrypoints').entries()) {
    const at = `$.entrypoints[${index}]`;
    if (!shape(row, ['id', 'path', 'symbol', 'apiVersion', 'versionSymbol', 'scope'], at)) continue;
    const expected = Object.hasOwn(ENTRIES, row.id) ? ENTRIES[row.id] : null;
    if (expected) equal([row.path, row.symbol, row.apiVersion, row.versionSymbol, row.scope], expected, at);
    const content = source(row.path, at + '.path');
    if (content !== null && expected) {
      const escaped = expected[2].replaceAll('.', '\\.');
      if (!content.includes(expected[1]) || !new RegExp(`\\b${expected[3]}\\s*=\\s*['"]${escaped}['"]`, 'u').test(content)) fail('entrypoint_drift', at, 'Versioned entrypoint no longer matches its source.');
    }
  }
  for (const [index, row] of rows(input.sourceProfiles, ALL_SOURCES.map(n => `${n}.0.0`), '$.sourceProfiles', 'version').entries()) {
    const at = `$.sourceProfiles[${index}]`;
    if (!shape(row, ['version', 'compileSchema', 'composition', 'csrCoveragePath'], at)) continue;
    const n = ALL_SOURCES.find(n => row.version === `${n}.0.0`);
    if (n) {
      equal(row.compileSchema, `xtend.rmtx.compile-result.v${n}`, at + '.compileSchema');
      const base = `development/rmtx-a06/${PROFILE_DIRS[n - 1]}`;
      equal(row.csrCoveragePath, `${base}/runtime-test.cjs`, at + '.csrCoveragePath');
      equal(row.composition, { manifestVersion: n < 3 ? 6 : n + 4, artifactVersion: n < 3 ? 7 : n + 5, csrPortVersion: n < 3 ? 3 : n === 3 ? 4 : n + 2,
        ssrStatus: n < 3 ? 'static-composition-blocked' : n === 3 ? 'source-parity-pending' : 'guarded',
        referencePath: n < 3 ? 'development/rmtx-a06/automatic-reference.cjs' : `${base}/reference.cjs` }, at + '.composition');
    }
    source(row.csrCoveragePath, at + '.csrCoveragePath');
    if (record(row.composition)) source(row.composition.referencePath, at + '.composition.referencePath');
  }
  for (const [index, row] of rows(input.targets, Object.keys(TARGETS), '$.targets').entries()) {
    const at = `$.targets[${index}]`;
    if (!shape(row, ['id', 'mode', 'frameworks', 'sourceProfiles', 'projectModes', 'entrypointIds', 'selection', 'implementation', 'acceptance', 'capabilities', 'positiveCases', 'negativeCases'], at)) continue;
    const expected = Object.hasOwn(TARGETS, row.id) ? TARGETS[row.id] : null;
    if (expected) equal([row.mode, row.frameworks, row.sourceProfiles, row.entrypointIds, row.implementation, row.capabilities], expected, at);
    equal(row.projectModes, MODES, at + '.projectModes');
    equal(row.selection, 'selected-for-0.9', at + '.selection');
    equal(row.acceptance, 'pending', at + '.acceptance');
    const positive = cases(row.positiveCases, 'positive', at + '.positiveCases');
    const negative = cases(row.negativeCases, 'negative', at + '.negativeCases');
    if (expected) {
      const [mode, frameworks, versions] = expected;
      // Validate each promised framework × source × project combination. A
      // single successful Source8 vertical slice cannot accept older sources.
      for (const n of versions) {
        const id = `${mode === 'csr' ? 'csr' : 'ssr'}-source-${n}`;
        required(positive, [id], at + '.positiveCases');
        const coverage = caseMap.get(id)?.coverage;
        for (const framework of frameworks) for (const project of MODES) {
          if (!record(coverage) || !contains(coverage.targetIds, row.id) || !contains(coverage.sourceProfiles, n)
            || !contains(coverage.frameworks, framework) || !contains(coverage.projectModes, project)) {
            fail('coverage', at, `Missing planned coverage: ${row.id}/${n}/${framework}/${project}.`);
          }
        }
      }
      if (mode !== 'csr') {
        required(positive, ['ssr-native-react-vue', 'ssr-restore-adopt-replay', 'ssr-typed-nested-keys'], at);
        required(negative, ['ssr-identity-mismatch', 'ssr-shell-container-tamper'], at);
      }
      if (row.id === 'framework-node-ssr') { required(positive, SSR_POSITIVE, at); required(negative, SSR_NEGATIVE, at); }
      if (row.id === 'framework-csr') required(positive, ['project-classic-entry-rmtx-dependency', 'project-rmtx-entry-classic-action'], at);
    }
  }
  for (const [index, row] of rows(input.policies, Object.keys(POLICIES), '$.policies').entries()) {
    const at = `$.policies[${index}]`;
    if (!shape(row, ['id', 'rules', 'positiveCases', 'negativeCases'], at)) continue;
    if (Object.hasOwn(POLICIES, row.id)) equal(row.rules, POLICIES[row.id], at + '.rules');
    const positive = cases(row.positiveCases, 'positive', at + '.positiveCases');
    const negative = cases(row.negativeCases, 'negative', at + '.negativeCases');
    if (Object.hasOwn(POLICY_CASES, row.id)) {
      required(positive, POLICY_CASES[row.id][0], at + '.positiveCases');
      required(negative, POLICY_CASES[row.id][1], at + '.negativeCases');
    }
  }
  for (const [index, row] of rows(input.exclusions, Object.keys(EXCLUSIONS), '$.exclusions').entries()) {
    const at = `$.exclusions[${index}]`;
    if (!shape(row, ['id', 'reason', 'negativeCases'], at)) continue;
    if (!text(row.reason)) fail('reason', at, 'An exclusion needs a reason.');
    const refs = cases(row.negativeCases, 'negative', at + '.negativeCases');
    if (Object.hasOwn(EXCLUSIONS, row.id)) required(refs, [EXCLUSIONS[row.id]], at);
  }
  for (const id of caseMap.keys()) if (!referencedCases.has(id)) fail('orphan_case', '$.cases', `Unbound case: ${id}.`);
  return report();
}

function assertTargetMatrix(input, options) {
  const report = validateTargetMatrix(input, options);
  if (!report.valid) throw Object.assign(new TypeError('Invalid A06.6.1 release target matrix.'), { code: 'xtend.rmtx.targets_invalid', report });
  return report;
}
function checkTargetMatrix({ rootDir = ROOT } = {}) {
  try { return validateTargetMatrix(readTargetMatrix(rootDir), { rootDir }); }
  catch (error) {
    return { schema: REPORT_SCHEMA, apiVersion: TARGET_MATRIX_API_VERSION, valid: false,
      errors: [{ code: 'xtend.rmtx.targets.unreadable', path: MATRIX_PATH, message: 'Cannot read or parse target matrix.' }],
      selectedTargets: 0, sourceProfiles: 0, requiredCases: 0, acceptedForRelease: false };
  }
}
module.exports = { TARGET_MATRIX_SCHEMA, TARGET_MATRIX_API_VERSION, readTargetMatrix, validateTargetMatrix, assertTargetMatrix, checkTargetMatrix };

'use strict';

const { compileRmtVNextSource } = require('./rmt-language/vnext-compiler');
const { createRmtLanguageServer } = require('./rmt-language-server/server');
const { pathToFileURL } = require('url');
const path = require('path');

const TOOLING_BRIDGE_SCHEMA = 'xtend.compiler.tooling-bridge.v1';
const TOOLING_BRIDGE_RESPONSE_SCHEMA = 'xtend.compiler.tooling-bridge-response.v1';
const TOOLING_BRIDGE_API_VERSION = '2.0.0';
const TOOLING_BRIDGE_SCHEMA_V2 = 'xtend.compiler.tooling-bridge.v2';
const TOOLING_BRIDGE_RESPONSE_SCHEMA_V2 = 'xtend.compiler.tooling-bridge-response.v2';
const OPERATIONS = new Set(['compile', 'language-diagnostics', 'maraca-plan', 'safe-preview', 'jit-compile']);

function normalizeDiagnostics(value, project = false) {
  return (Array.isArray(value) ? value : []).map((entry) => ({
    schema: project ? 'xtend.compiler.tooling-diagnostic.v2' : 'xtend.compiler.tooling-diagnostic.v1',
    source: entry && entry.source || 'xtend-compiler',
    code: entry && entry.code || 'xtend.compiler.diagnostic',
    severity: typeof (entry && entry.severity) === 'number' ? ['unknown', 'error', 'warning', 'info', 'hint'][entry.severity] : entry && entry.severity || 'info',
    message: entry && entry.message || String(entry || 'Compiler diagnostic'),
    range: entry && entry.range || null,
    ...(project && entry && entry.uri ? { uri: entry.uri } : {}),
    ...(project && entry && (entry.filePath || entry.file) ? { filePath: entry.filePath || entry.file } : {})
  }));
}

function loadMaraca() {
  try { return require('@ccslabs/xtend-maraca'); } catch (_) { return require('../xtend-maraca'); }
}

function scrubBridgeValue(value, rootDir, depth = 0) {
  if (depth > 32) return '[depth-limit]';
  if (Array.isArray(value)) return value.map((entry) => scrubBridgeValue(entry, rootDir, depth + 1));
  if (!value || typeof value !== 'object') {
    if (typeof value !== 'string') return value;
    const normalizedRoot = String(rootDir || '');
    const redactedPath = normalizedRoot ? value.split(normalizedRoot).join('[repo]') : value;
    return redactedPath.replace(/\bWP-[A-Z0-9-]+\b/giu, 'compiler source');
  }
  const output = {};
  for (const [key, entry] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    if (['absolutepath', 'rootdir', 'sourcepath', 'outputdir', 'outputs', 'toolchain', 'astpointer'].includes(normalized) || normalized.includes('workpackage')) continue;
    if (normalized.includes('password') || normalized.includes('secret') || normalized.includes('token')) { output[key] = '[redacted]'; continue; }
    output[key] = scrubBridgeValue(entry, rootDir, depth + 1);
  }
  return output;
}

async function executeToolingBridgeOperation(envelope = {}, options = {}) {
  const operation = String(envelope.operation || '');
  if (!OPERATIONS.has(operation)) throw new TypeError(`Unsupported tooling bridge operation: ${operation || '(missing)'}`);
  const payload = envelope.payload && typeof envelope.payload === 'object' ? envelope.payload : {};
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const advanced = envelope.schema === TOOLING_BRIDGE_SCHEMA_V2 || usesProject(payload);
  if (envelope.schema === TOOLING_BRIDGE_SCHEMA && advanced) throw new TypeError('Project/RMTX input requires tooling-bridge.v2.');
  if (envelope.schema && ![TOOLING_BRIDGE_SCHEMA, TOOLING_BRIDGE_SCHEMA_V2].includes(envelope.schema)) throw new TypeError('Unsupported tooling bridge schema.');
  let result, originalDiagnostics;
  if (operation === 'jit-compile') {
    result = await executeJitCompile(payload, rootDir, advanced);
  } else if (operation === 'compile') {
    const filePath = payload.filePath || (sourceSyntax(payload) === 'rmtx' ? 'inline.rmtx' : 'inline.rmt');
    result = advanced
      ? compileProjectWithDiagnostics(payload, rootDir)
      : compileRmtVNextSource({ text: String(payload.source || ''), filePath }, { ...(payload.options || {}), filePath });
  } else if (operation === 'language-diagnostics') {
    const filePath = payload.filePath || (sourceSyntax(payload) === 'rmtx' ? 'inline.rmtx' : 'inline.rmt');
    const uri = payload.uri || pathToFileURL(path.resolve(rootDir, filePath)).href;
    if (advanced) {
      const analyzed = compileProjectWithDiagnostics(payload, rootDir);
      result = { ok: analyzed.ok, status: 'diagnostics', uri, project: analyzed.project, diagnostics: analyzed.diagnostics || [] };
    } else {
      const server = createRmtLanguageServer({ rootDir });
      server.initialize({ rootPath: rootDir });
      const notifications = server.openDocument({ textDocument: { uri, languageId: 'rmt', version: payload.version || 1, text: String(payload.source || '') } });
      const publish = notifications.find((entry) => entry && entry.method === 'textDocument/publishDiagnostics');
      result = { ok: true, status: 'diagnostics', uri, diagnostics: publish && publish.params && publish.params.diagnostics || [] };
    }
  } else if (operation === 'maraca-plan') {
    const maraca = loadMaraca();
    result = maraca[advanced ? 'createMaracaProjectBuildPlan' : 'createMaracaBuildPlan']({ sourceText: String(payload.source || ''), virtualSourcePath: payload.filePath || (sourceSyntax(payload) === 'rmtx' ? 'inline.rmtx' : 'inline.rmt'), ...(payload.options || {}), ...(advanced ? { project: true, sourceSyntax: sourceSyntax(payload), rmtxSyntaxVersion: projectOptions(payload, rootDir).rmtxSyntaxVersion,
      ...(projectOptions(payload, rootDir).rmtxProvidersFile ? { rmtxProvidersFile: projectOptions(payload, rootDir).rmtxProvidersFile } : {}) } : {}) }, { rootDir });
    if (advanced) originalDiagnostics = result.diagnostics;
    result = scrubBridgeValue(result, rootDir);
  } else {
    let moduleApi;
    try { moduleApi = await import('@ccslabs/xtend-rmt/safe-preview'); }
    catch (_) { moduleApi = await import(pathToFileURL(path.resolve(__dirname, '../xtendrmt/rmt-safe-preview.js')).href); }
    const projector = moduleApi.createRmtSafePreviewProjector(payload.options || {});
    result = projector.project(payload.coreDocument || {}, payload.project || {});
  }
  const diagnostics = normalizeDiagnostics(originalDiagnostics || result && (result.diagnostics || result.compilerDiagnostics), advanced);
  return {
    schema: advanced ? TOOLING_BRIDGE_RESPONSE_SCHEMA_V2 : TOOLING_BRIDGE_RESPONSE_SCHEMA,
    bridgeSchema: advanced ? TOOLING_BRIDGE_SCHEMA_V2 : TOOLING_BRIDGE_SCHEMA,
    requestId: String(envelope.requestId || ''),
    operation,
    ok: result && result.ok !== false,
    status: result && result.status || 'completed',
    diagnostics,
    result
  };
}

function sourceSyntax(payload) {
  return payload.sourceSyntax || payload.options?.sourceSyntax || (/\.rmtx$/iu.test(payload.filePath || '') ? 'rmtx' : 'rmt-vnext');
}
function usesProject(payload) {
  return payload.project === true || payload.options?.project === true || sourceSyntax(payload) === 'rmtx' || Object.hasOwn(payload, 'sourceSyntax') || Object.hasOwn(payload.options || {}, 'sourceSyntax') || Object.hasOwn(payload, 'rmtxProvidersFile') || Object.hasOwn(payload.options || {}, 'rmtxProvidersFile');
}
function projectOptions(payload, rootDir) {
  return { ...(payload.options || {}), sourceSyntax: sourceSyntax(payload),
    ...(payload.rmtxProvidersFile ? { rmtxProvidersFile: payload.rmtxProvidersFile } : {}),
    rmtxSyntaxVersion: payload.rmtxSyntaxVersion || payload.options?.rmtxSyntaxVersion || '8.0.0', rootDir, semanticCheck: true };
}
function compileProjectWithDiagnostics(payload, rootDir, session = null) {
  const filePath = payload.filePath || (sourceSyntax(payload) === 'rmtx' ? 'inline.rmtx' : 'inline.rmt');
  const input = { text: String(payload.source || ''), filePath,
    uri: payload.uri || pathToFileURL(path.resolve(rootDir, filePath)).href };
  return session
    ? session.compileProjectSource(input, projectOptions(payload, rootDir))
    : require('./rmt-language/rmt-project').compileRmtProjectSource(input, projectOptions(payload, rootDir));
}

async function executeJitCompile(payload, rootDir, advanced = false) {
  const { createRmtCompilationSession } = require('./rmt-language/compilation-session');
  const session = createRmtCompilationSession({ root: rootDir, applyDefaultDocumentId: false, readonlyResults: true });
  const started = process.hrtime.bigint();
  const elapsed = () => Number(process.hrtime.bigint() - started) / 1e6;
  const timings = {};
  let kernel = null;
  try {
    const filePath = payload.filePath || (sourceSyntax(payload) === 'rmtx' ? 'inline.rmtx' : 'inline.rmt');
    const source = String(payload.source || '');
    const compiled = advanced
      ? compileProjectWithDiagnostics(payload, rootDir, session)
      : session.compileSource({ text: source, filePath }, { ...(payload.options || {}), filePath });
    timings.compileMs = elapsed();
    const compile = { ok: compiled.ok, status: compiled.status, diagnostics: compiled.diagnostics || compiled.compilerDiagnostics || [], coreDocument: compiled.coreDocument || null, coreJson: compiled.coreJson || null,
      ...(advanced ? { sourceProfile: compiled.sourceProfile || { syntax: 'rmt-vnext', version: null }, project: compiled.project } : {}) };
    const result = { ok: compile.ok, status: compile.status, diagnostics: compile.diagnostics, compile, safePreview: null, maraca: null };
    const stage = async (callback) => {
      try { return await callback(); }
      catch (error) { return { ok: false, status: 'bridge-error', diagnostics: [{ code: error.code || 'xtend.compiler.tooling_bridge.failed', severity: 'error', message: scrubBridgeValue(error.message, rootDir) }], result: null }; }
    };
    if (compile.ok && payload.safePreview !== false) {
      const before = elapsed();
      result.safePreview = advanced && compiled.sourceProfile?.syntax === 'rmtx'
        ? { ok: false, status: 'profile-not-accepted', diagnostics: [{ code: 'xtend.compiler.project_preview.unaccepted', severity: 'error', message: 'The Classic descriptor preview does not establish RMTX native-view or SSR/adoption acceptance.' }], result: null }
        : await stage(() => executeToolingBridgeOperation({ operation: 'safe-preview', payload: { ...(payload.safePreview || {}), coreDocument: compile.coreDocument } }, { rootDir }));
      timings.safePreviewMs = elapsed() - before;
    }
    if (compile.ok && payload.maraca) {
      const before = elapsed();
      result.maraca = await stage(async () => {
        kernel = await require('./rmt-jit-kernel-cache').prepareRmtJitKernelCache({ rootDir });
        const plan = loadMaraca()[advanced ? 'createMaracaProjectBuildPlan' : 'createMaracaBuildPlan']({ sourceText: source, virtualSourcePath: filePath, ...payload.maraca,
          ...(advanced ? { project: true, sourceSyntax: sourceSyntax(payload), rmtxSyntaxVersion: projectOptions(payload, rootDir).rmtxSyntaxVersion,
            ...(projectOptions(payload, rootDir).rmtxProvidersFile ? { rmtxProvidersFile: projectOptions(payload, rootDir).rmtxProvidersFile } : {}) } : {}) }, { rootDir,
          compileSource: advanced ? session.compileProjectSource : session.compileSource, kernelSourceArtifacts: kernel, inspectToolchain: false });
        const clean = scrubBridgeValue(plan, rootDir);
        return { ok: clean.ok !== false, status: clean.status, diagnostics: normalizeDiagnostics(advanced ? plan.diagnostics : clean.diagnostics, advanced), result: clean };
      });
      timings.maracaMs = elapsed() - before;
    }
    // Opt-in counters and timings never contain user source or source paths.
    if (payload.metrics === true) result.metrics = { ...session.snapshot(), ...timings, totalMs: elapsed(), nodeProcesses: 1, architectureChecks: kernel ? kernel.architectureChecks : 0, cacheStatus: kernel ? kernel.cacheStatus : 'unused' };
    if (kernel && kernel.diagnostics.length) result.cacheDiagnostics = kernel.diagnostics;
    return result;
  } finally { session.dispose(); }
}

module.exports = { TOOLING_BRIDGE_API_VERSION, TOOLING_BRIDGE_SCHEMA, TOOLING_BRIDGE_RESPONSE_SCHEMA, TOOLING_BRIDGE_SCHEMA_V2, TOOLING_BRIDGE_RESPONSE_SCHEMA_V2, OPERATIONS, normalizeDiagnostics, executeToolingBridgeOperation };

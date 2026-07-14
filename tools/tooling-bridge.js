'use strict';

const { compileRmtVNextSource } = require('./rmt-language/vnext-compiler');
const { createRmtLanguageServer } = require('./rmt-language-server/server');
const { pathToFileURL } = require('url');
const path = require('path');

const TOOLING_BRIDGE_SCHEMA = 'xtend.compiler.tooling-bridge.v1';
const TOOLING_BRIDGE_RESPONSE_SCHEMA = 'xtend.compiler.tooling-bridge-response.v1';
const OPERATIONS = new Set(['compile', 'language-diagnostics', 'maraca-plan', 'safe-preview']);

function normalizeDiagnostics(value) {
  return (Array.isArray(value) ? value : []).map((entry) => ({
    schema: 'xtend.compiler.tooling-diagnostic.v1',
    source: entry && entry.source || 'xtend-compiler',
    code: entry && entry.code || 'xtend.compiler.diagnostic',
    severity: typeof (entry && entry.severity) === 'number' ? ['unknown', 'error', 'warning', 'info', 'hint'][entry.severity] : entry && entry.severity || 'info',
    message: entry && entry.message || String(entry || 'Compiler diagnostic'),
    range: entry && entry.range || null
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
    return value.replaceAll(rootDir, '[repo]').replace(/\bWP-[A-Z0-9-]+\b/giu, 'compiler source');
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
  let result;
  if (operation === 'compile') {
    const filePath = payload.filePath || 'inline.rmt';
    result = compileRmtVNextSource({ text: String(payload.source || ''), filePath }, { ...(payload.options || {}), filePath });
  } else if (operation === 'language-diagnostics') {
    const filePath = payload.filePath || 'inline.rmt';
    const uri = payload.uri || pathToFileURL(path.resolve(rootDir, filePath)).href;
    const server = createRmtLanguageServer({ rootDir });
    server.initialize({ rootPath: rootDir });
    const notifications = server.openDocument({ textDocument: { uri, languageId: 'rmt', version: payload.version || 1, text: String(payload.source || '') } });
    const publish = notifications.find((entry) => entry && entry.method === 'textDocument/publishDiagnostics');
    result = { ok: true, status: 'diagnostics', uri, diagnostics: publish && publish.params && publish.params.diagnostics || [] };
  } else if (operation === 'maraca-plan') {
    const maraca = loadMaraca();
    result = maraca.createMaracaBuildPlan({ sourceText: String(payload.source || ''), virtualSourcePath: payload.filePath || 'inline.rmt', ...(payload.options || {}) }, { rootDir });
    result = scrubBridgeValue(result, rootDir);
  } else {
    let moduleApi;
    try { moduleApi = await import('@ccslabs/xtend-rmt/safe-preview'); }
    catch (_) { moduleApi = await import(pathToFileURL(path.resolve(__dirname, '../xtendrmt/rmt-safe-preview.js')).href); }
    const projector = moduleApi.createRmtSafePreviewProjector(payload.options || {});
    result = projector.project(payload.coreDocument || {}, payload.project || {});
  }
  const diagnostics = normalizeDiagnostics(result && (result.diagnostics || result.compilerDiagnostics));
  return {
    schema: TOOLING_BRIDGE_RESPONSE_SCHEMA,
    bridgeSchema: TOOLING_BRIDGE_SCHEMA,
    requestId: String(envelope.requestId || ''),
    operation,
    ok: result && result.ok !== false,
    status: result && result.status || 'completed',
    diagnostics,
    result
  };
}

module.exports = { TOOLING_BRIDGE_SCHEMA, TOOLING_BRIDGE_RESPONSE_SCHEMA, OPERATIONS, normalizeDiagnostics, executeToolingBridgeOperation };

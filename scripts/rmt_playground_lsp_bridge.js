#!/usr/bin/env node

'use strict';

const path = require('path');
const { pathToFileURL } = require('url');
const {
  createRmtLanguageServer
} = require('../tools/rmt-language-server/server');

const BRIDGE_SCHEMA = 'xtend.docs.rmt-playground.lsp-bridge.v1';

function readStdin() {
  return new Promise((resolve, reject) => {
    let body = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      body += chunk;
    });
    process.stdin.on('end', () => resolve(body));
    process.stdin.on('error', reject);
    process.stdin.resume();
  });
}

function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function severityName(value) {
  if (value === 1) return 'error';
  if (value === 2) return 'warning';
  if (value === 3) return 'info';
  if (value === 4) return 'hint';
  return typeof value === 'string' && value ? value : 'info';
}

function normalizeLspDiagnostic(diagnostic = {}) {
  return {
    schema: 'xtend.docs.rmt-playground.diagnostic.v1',
    source: diagnostic.source || 'xtend-rmt-language-server',
    code: diagnostic.code || 'rmt.lsp.diagnostic',
    severity: severityName(diagnostic.severity),
    message: diagnostic.message || diagnostic.code || 'RMT diagnostic',
    range: diagnostic.range || null,
    data: diagnostic.data || null
  };
}

function compileDiagnosticsPayload(payload = {}, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const source = String(payload.source || payload.text || '');
  const filePath = payload.filePath || 'docs/rmt-playground-source.rmt';
  const resolvedPath = path.resolve(rootDir, filePath);
  const uri = payload.uri || pathToFileURL(resolvedPath).href;
  const version = Number.isInteger(payload.version) ? payload.version : 1;
  const server = createRmtLanguageServer({ rootDir });

  server.initialize({ rootPath: rootDir });
  const notifications = server.openDocument({
    textDocument: {
      uri,
      languageId: 'rmt',
      version,
      text: source
    }
  });
  const publish = notifications.find((entry) => entry && entry.method === 'textDocument/publishDiagnostics');
  const lspDiagnostics = publish && publish.params && Array.isArray(publish.params.diagnostics)
    ? publish.params.diagnostics
    : [];
  const analysis = server.analyzeDocument(uri);

  return {
    schema: BRIDGE_SCHEMA,
    ok: true,
    status: 'diagnostics',
    uri,
    version,
    languageMode: analysis && analysis.languageMode || 'unknown',
    diagnostics: lspDiagnostics.map(normalizeLspDiagnostic),
    lspDiagnostics
  };
}

async function main() {
  const raw = await readStdin();
  let payload = {};
  try {
    payload = raw.trim() ? JSON.parse(raw) : {};
  } catch (error) {
    writeJson({
      schema: BRIDGE_SCHEMA,
      ok: false,
      status: 'invalid-json',
      diagnostics: [{
        schema: 'xtend.docs.rmt-playground.diagnostic.v1',
        source: 'xtend-rmt-language-server',
        code: 'docs.rmt.playground.lsp.invalid_json',
        severity: 'error',
        message: error && error.message ? error.message : String(error)
      }]
    });
    process.exitCode = 1;
    return;
  }

  const result = compileDiagnosticsPayload(payload);
  writeJson(result);
}

if (require.main === module) {
  main().catch((error) => {
    writeJson({
      schema: BRIDGE_SCHEMA,
      ok: false,
      status: 'bridge-error',
      diagnostics: [{
        schema: 'xtend.docs.rmt-playground.diagnostic.v1',
        source: 'xtend-rmt-language-server',
        code: 'docs.rmt.playground.lsp.bridge_error',
        severity: 'error',
        message: error && error.message ? error.message : String(error)
      }]
    });
    process.exitCode = 1;
  });
}

module.exports = {
  BRIDGE_SCHEMA,
  compileDiagnosticsPayload,
  normalizeLspDiagnostic
};

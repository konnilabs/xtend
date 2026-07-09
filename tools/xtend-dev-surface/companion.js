'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { randomBytes } = require('crypto');
const {
  COMPANION_DEFAULT_ORIGIN,
  DIAGNOSTIC_CATALOG,
  XTEND_DEV_SURFACE_COMPANION_SCHEMA,
  XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
  XTEND_DEV_SURFACE_GATE_ARTIFACT_SCHEMA,
  XTEND_DEV_SURFACE_GATE_RUN_SCHEMA,
  XTEND_DEV_SURFACE_GATE_STREAM_SCHEMA,
  createDevSurfaceDiagnostic,
  listGateDefinitions,
  normalizeGateRun,
  resolveGateDefinition
} = require('./contracts');

const COMPANION_SCHEMA = XTEND_DEV_SURFACE_COMPANION_SCHEMA;
const DEFAULT_PORT = 27864;
const TOKEN_HEADER = 'x-xtend-dev-surface-token';
const HANDSHAKE_SCHEMA = 'xtend.devsurface.companion-handshake.v1';
const MAX_OUTPUT_BYTES = 200000;
const OUTPUT_TAIL_BYTES = 8000;

let runSequence = 0;

function normalizeToken(token) {
  return typeof token === 'string' && token.trim() ? token.trim() : randomBytes(16).toString('hex');
}

function parseOrigin(origin = COMPANION_DEFAULT_ORIGIN) {
  try {
    const url = new URL(origin);
    return {
      hostname: url.hostname || '127.0.0.1',
      port: Number(url.port) || DEFAULT_PORT,
      origin: url.origin
    };
  } catch (_error) {
    return {
      hostname: '127.0.0.1',
      port: DEFAULT_PORT,
      origin: COMPANION_DEFAULT_ORIGIN
    };
  }
}

function authorizeCompanionRequest(headers = {}, expectedToken, queryToken = null) {
  const token = headers[TOKEN_HEADER] || headers[TOKEN_HEADER.toLowerCase()];
  return Boolean(expectedToken && (token === expectedToken || queryToken === expectedToken));
}

function timestampFromOptions(options = {}) {
  if (options.timestamp) return options.timestamp;
  if (typeof options.clock === 'function') return options.clock();
  return new Date().toISOString();
}

function createRunId(gateId, timestamp = new Date().toISOString()) {
  runSequence += 1;
  const normalizedGate = String(gateId || 'unknown').replace(/[^a-z0-9.-]+/giu, '-').replace(/^-|-$/g, '') || 'unknown';
  const normalizedTime = String(timestamp).replace(/[^0-9a-z]+/giu, '').slice(0, 20) || Date.now();
  return `xds.gate.${normalizedGate}.${normalizedTime}.${runSequence}`;
}

function trimOutput(value, maxBytes = OUTPUT_TAIL_BYTES) {
  const text = String(value || '');
  if (Buffer.byteLength(text, 'utf8') <= maxBytes) return text;
  return text.slice(Math.max(0, text.length - maxBytes));
}

function createGateStreamEvent(event, run, metadata = {}, options = {}) {
  return {
    schema: XTEND_DEV_SURFACE_GATE_STREAM_SCHEMA,
    workpackage: 'XDS-WP-04',
    event,
    generatedAt: timestampFromOptions(options),
    runId: run && (run.runId || run.id) || null,
    gateId: run && run.gateId || null,
    status: run && run.status || null,
    progress: run && run.progress || 0,
    run: run || null,
    metadata: metadata || {}
  };
}

function isSafeArtifactPath(reportPath) {
  const normalized = String(reportPath || '').trim();
  return Boolean(normalized && !path.isAbsolute(normalized) && !normalized.split(/[\\/]+/u).includes('..'));
}

function createCompanionArtifactRecord(reportPath, options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const normalizedPath = String(reportPath || '').trim();
  const safe = isSafeArtifactPath(normalizedPath);
  const absolutePath = safe ? path.join(rootDir, normalizedPath) : null;
  const exists = Boolean(absolutePath && fs.existsSync(absolutePath));
  return {
    schema: XTEND_DEV_SURFACE_GATE_ARTIFACT_SCHEMA,
    workpackage: 'XDS-WP-04',
    path: normalizedPath || null,
    url: safe ? `/artifacts/${encodeURIComponent(normalizedPath)}` : null,
    contentType: 'application/json',
    exists,
    bytes: exists ? fs.statSync(absolutePath).size : 0,
    diagnostics: safe ? [] : [
      createDevSurfaceDiagnostic(
        DIAGNOSTIC_CATALOG.gateArtifactBlocked.code,
        'XTend Dev Surface companion artifact path is not allowlisted-safe.',
        'error',
        { reportPath: normalizedPath }
      )
    ]
  };
}

function isAllowlistedArtifactPath(reportPath, allowlist) {
  if (!isSafeArtifactPath(reportPath)) return false;
  return listGateDefinitions(allowlist).some((definition) => definition.reportPath === reportPath);
}

function createCompanionHandshake(headers = {}, options = {}) {
  const tokenAccepted = authorizeCompanionRequest(headers, options.token);
  const diagnostics = tokenAccepted ? [] : [
    createDevSurfaceDiagnostic(
      DIAGNOSTIC_CATALOG.companionUnauthorized.code,
      'XTend Dev Surface companion token is missing or invalid.',
      'error'
    )
  ];
  return {
    schema: HANDSHAKE_SCHEMA,
    companionSchema: COMPANION_SCHEMA,
    extensionSchema: XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
    workpackage: 'XDS-WP-04',
    ok: tokenAccepted,
    tokenRequired: true,
    tokenAccepted,
    tokenHeader: TOKEN_HEADER,
    origin: options.origin || COMPANION_DEFAULT_ORIGIN,
    gates: tokenAccepted ? listGateDefinitions(options.allowlist) : [],
    diagnostics
  };
}

function createCompanionGatePlan(gateId, options = {}) {
  const definition = resolveGateDefinition(gateId, options.allowlist);
  if (!definition) {
    return normalizeGateRun({
      gateId,
      status: 'blocked'
    }, options);
  }

  return normalizeGateRun({
    gateId: definition.gateId,
    label: definition.label,
    status: 'queued',
    reportPath: definition.reportPath
  }, options);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('XTend Dev Surface companion request body is too large.'));
        request.destroy();
      }
    });
    request.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': `content-type, ${TOKEN_HEADER}`,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    ...extraHeaders
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function runAllowedGate(gateId, options = {}) {
  const definition = resolveGateDefinition(gateId, options.allowlist);
  const startedAt = options.startedAt || timestampFromOptions(options);
  const runId = options.runId || createRunId(gateId, startedAt);
  if (!definition) {
    return Promise.resolve(normalizeGateRun({
      id: runId,
      gateId,
      status: 'blocked',
      startedAt,
      completedAt: startedAt
    }, options));
  }

  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const command = definition.command;
  const child = spawn(command[0], command.slice(1), {
    cwd: rootDir,
    env: { ...process.env, ...(options.env || {}) },
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let stdout = '';
  let stderr = '';
  let stdoutTail = '';
  let stderrTail = '';
  let outputBytes = 0;

  const runningRun = normalizeGateRun({
    id: runId,
    gateId,
    label: definition.label,
    status: 'running',
    reportPath: definition.reportPath,
    startedAt,
    pid: child.pid,
    progress: 10
  }, options);
  if (typeof options.onEvent === 'function') {
    options.onEvent(createGateStreamEvent('gate-run.started', runningRun, {
      command: command.slice()
    }, options));
  }

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    stdout += text;
    stdoutTail = trimOutput(stdoutTail + text);
    outputBytes += Buffer.byteLength(text, 'utf8');
    if (outputBytes > MAX_OUTPUT_BYTES) stdout = trimOutput(stdout, MAX_OUTPUT_BYTES);
    if (typeof options.onEvent === 'function') {
      options.onEvent(createGateStreamEvent('gate-run.stdout', {
        ...runningRun,
        progress: 50,
        stdoutTail
      }, { bytes: Buffer.byteLength(text, 'utf8') }, options));
    }
  });
  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderr += text;
    stderrTail = trimOutput(stderrTail + text);
    outputBytes += Buffer.byteLength(text, 'utf8');
    if (outputBytes > MAX_OUTPUT_BYTES) stderr = trimOutput(stderr, MAX_OUTPUT_BYTES);
    if (typeof options.onEvent === 'function') {
      options.onEvent(createGateStreamEvent('gate-run.stderr', {
        ...runningRun,
        progress: 50,
        stderrTail
      }, { bytes: Buffer.byteLength(text, 'utf8') }, options));
    }
  });

  return new Promise((resolve) => {
    child.on('close', (exitCode) => {
      const completedAt = timestampFromOptions({ clock: options.clock });
      const status = exitCode === 0 ? 'passed' : 'failed';
      const parsedReport = parseGateReport(stdout, definition.reportPath, rootDir);
      const artifacts = definition.reportPath
        ? [createCompanionArtifactRecord(definition.reportPath, { rootDir })]
        : [];
      const diagnostics = parsedReport ? [] : [
        createDevSurfaceDiagnostic(
          DIAGNOSTIC_CATALOG.gateReportInvalid.code,
          'XTend Dev Surface companion could not parse a JSON gate report from stdout or reportPath.',
          DIAGNOSTIC_CATALOG.gateReportInvalid.severity,
          { gateId, reportPath: definition.reportPath || null }
        )
      ];
      const run = normalizeGateRun({
        id: runId,
        gateId,
        label: definition.label,
        status,
        reportPath: definition.reportPath,
        startedAt,
        completedAt,
        exitCode,
        pid: child.pid,
        progress: 100,
        artifactUrl: artifacts[0] && artifacts[0].url || null,
        artifacts,
        report: parsedReport,
        stdoutTail,
        stderrTail,
        diagnostics
      }, options);
      const completedEvent = createGateStreamEvent('gate-run.completed', run, { exitCode }, options);
      if (typeof options.onEvent === 'function') options.onEvent(completedEvent);
      resolve(run);
    });
    child.on('error', (error) => {
      const completedAt = timestampFromOptions({ clock: options.clock });
      const run = normalizeGateRun({
        id: runId,
          gateId,
          label: definition.label,
          status: 'failed',
          reportPath: definition.reportPath,
          startedAt,
          completedAt,
        exitCode: 1,
        pid: child.pid,
        progress: 100,
        stdoutTail,
        stderrTail,
        diagnostics: [
          createDevSurfaceDiagnostic(
            DIAGNOSTIC_CATALOG.gateSpawnFailed.code,
            error.message,
            'error',
            { gateId }
          )
        ]
      }, options);
      if (typeof options.onEvent === 'function') {
        options.onEvent(createGateStreamEvent('gate-run.failed', run, {
          error: error.message
        }, options));
      }
      resolve(run);
    });
  });
}

function parseGateReport(stdout = '', reportPath = null, rootDir = path.resolve(__dirname, '..', '..')) {
  if (reportPath) {
    const absolutePath = path.join(rootDir, reportPath);
    if (fs.existsSync(absolutePath)) {
      try {
        return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      } catch (_error) {
        return null;
      }
    }
  }

  const text = String(stdout || '').trim();
  if (!text) return null;
  const candidates = [text].concat(text.split(/\r?\n/u).map((line) => line.trim()).filter((line) => line.startsWith('{') && line.endsWith('}')));
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(text.slice(firstBrace, lastBrace + 1));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (_error) {
      // Keep trying more specific candidates from noisy command output.
    }
  }
  return null;
}

function createRunStore() {
  const runs = [];
  const listeners = new Set();
  function emit(event) {
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (_error) {
        // A broken observer must not break companion gate execution.
      }
    });
  }
  return {
    add(run, eventType = 'gate-run.created') {
      runs.push(run);
      emit(createGateStreamEvent(eventType, run));
      return run;
    },
    list() {
      return runs.slice();
    },
    update(runId, nextRun, eventType = 'gate-run.updated') {
      const index = runs.findIndex((run) => run.id === runId || run.runId === runId);
      const normalizedRun = {
        ...nextRun,
        id: nextRun.id || nextRun.runId || runId,
        runId: nextRun.runId || nextRun.id || runId
      };
      if (index >= 0) {
        runs[index] = { ...runs[index], ...normalizedRun };
        emit(createGateStreamEvent(eventType, runs[index]));
        return runs[index];
      }
      runs.push(normalizedRun);
      emit(createGateStreamEvent(eventType, normalizedRun));
      return normalizedRun;
    },
    subscribe(listener) {
      listeners.add(listener);
      return function unsubscribe() {
        listeners.delete(listener);
      };
    },
    snapshot() {
      return {
        schema: XTEND_DEV_SURFACE_GATE_STREAM_SCHEMA,
        workpackage: 'XDS-WP-04',
        runs: runs.slice()
      };
    }
  };
}

function startCompanionGateRun(gateId, options = {}, runStore = createRunStore()) {
  const startedAt = timestampFromOptions(options);
  const runId = options.runId || createRunId(gateId, startedAt);
  const runningRun = normalizeGateRun({
    id: runId,
    gateId,
    status: 'running',
    startedAt,
    progress: 5
  }, options);
  if (!runningRun.allowed) {
    return runningRun;
  }

  runStore.add(runningRun, 'gate-run.queued');
  runAllowedGate(gateId, {
    ...options,
    runId,
    startedAt,
    onEvent(event) {
      if (event && event.run) runStore.update(runId, event.run, event.event);
      if (typeof options.onEvent === 'function') options.onEvent(event);
    }
  }).then((completedRun) => {
    runStore.update(runId, completedRun, 'gate-run.completed');
  });
  return runningRun;
}

function sendArtifact(response, artifactPath, options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  if (!isAllowlistedArtifactPath(artifactPath, options.allowlist)) {
    sendJson(response, 403, {
      schema: COMPANION_SCHEMA,
      ok: false,
      diagnostics: [
        createDevSurfaceDiagnostic(
          DIAGNOSTIC_CATALOG.gateArtifactBlocked.code,
          'XTend Dev Surface companion blocked a non-allowlisted artifact path.',
          'error',
          { artifactPath }
        )
      ]
    });
    return;
  }
  const absolutePath = path.join(rootDir, artifactPath);
  if (!fs.existsSync(absolutePath)) {
    sendJson(response, 404, {
      schema: COMPANION_SCHEMA,
      ok: false,
      diagnostics: [
        createDevSurfaceDiagnostic(
          DIAGNOSTIC_CATALOG.companionNotFound.code,
          `XTend Dev Surface companion artifact not found: ${artifactPath}.`,
          'warning',
          { artifactPath }
        )
      ]
    });
    return;
  }
  response.writeHead(200, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'no-store'
  });
  fs.createReadStream(absolutePath).pipe(response);
}

function createCompanionServer(options = {}) {
  const origin = parseOrigin(options.origin);
  const token = normalizeToken(options.token);
  const runStore = createRunStore();

  const server = http.createServer(async (request, response) => {
    if (request.method === 'OPTIONS') {
      sendJson(response, 204, {});
      return;
    }

    const url = new URL(request.url, origin.origin);
    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, {
        schema: COMPANION_SCHEMA,
        extensionSchema: XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
        workpackage: 'XDS-WP-04',
        ok: true,
        origin: origin.origin,
        tokenRequired: true,
        tokenHeader: TOKEN_HEADER,
        handshakePath: '/handshake',
        gateStreamSchema: XTEND_DEV_SURFACE_GATE_STREAM_SCHEMA,
        gateArtifactSchema: XTEND_DEV_SURFACE_GATE_ARTIFACT_SCHEMA
      });
      return;
    }

    if ((request.method === 'GET' || request.method === 'POST') && url.pathname === '/handshake') {
      const handshake = createCompanionHandshake(request.headers, {
        token,
        origin: origin.origin,
        allowlist: options.allowlist
      });
      sendJson(response, handshake.ok ? 200 : 401, handshake);
      return;
    }

    if (!authorizeCompanionRequest(request.headers, token, url.searchParams.get('token'))) {
      sendJson(response, 401, {
        schema: COMPANION_SCHEMA,
        workpackage: 'XDS-WP-04',
        ok: false,
        diagnostics: [
          createDevSurfaceDiagnostic(
            DIAGNOSTIC_CATALOG.companionUnauthorized.code,
            'XTend Dev Surface companion token is missing or invalid.',
            'error'
          )
        ]
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/gates') {
      sendJson(response, 200, {
        schema: COMPANION_SCHEMA,
        workpackage: 'XDS-WP-04',
        gates: listGateDefinitions(options.allowlist)
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/gate-runs') {
      sendJson(response, 200, {
        schema: XTEND_DEV_SURFACE_GATE_STREAM_SCHEMA,
        workpackage: 'XDS-WP-04',
        runs: runStore.list()
      });
      return;
    }

    if (request.method === 'GET' && url.pathname.startsWith('/gate-runs/') && url.pathname !== '/gate-runs/events') {
      const runId = decodeURIComponent(url.pathname.slice('/gate-runs/'.length));
      const run = runStore.list().find((entry) => entry.id === runId || entry.runId === runId);
      if (!run) {
        sendJson(response, 404, {
          schema: COMPANION_SCHEMA,
          ok: false,
          diagnostics: [
            createDevSurfaceDiagnostic(
              DIAGNOSTIC_CATALOG.companionNotFound.code,
              `No XTend Dev Surface companion run found for ${runId}.`,
              'warning',
              { runId }
            )
          ]
        });
        return;
      }
      sendJson(response, 200, run);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/gate-runs/events') {
      response.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache',
        'connection': 'keep-alive',
        'access-control-allow-origin': '*'
      });
      response.write(`event: snapshot\ndata: ${JSON.stringify(runStore.snapshot())}\n\n`);
      const unsubscribe = runStore.subscribe((event) => {
        response.write(`event: ${event.event}\ndata: ${JSON.stringify(event)}\n\n`);
      });
      const interval = setInterval(() => {
        response.write(`event: heartbeat\ndata: ${JSON.stringify(createGateStreamEvent('heartbeat', null))}\n\n`);
      }, 15000);
      request.on('close', () => {
        clearInterval(interval);
        unsubscribe();
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/gate-runs') {
      try {
        const body = await readJsonBody(request);
        const gateId = body.gateId;
        const plan = createCompanionGatePlan(gateId, options);
        if (!plan.allowed) {
          sendJson(response, 403, plan);
          return;
        }
        const run = startCompanionGateRun(gateId, options, runStore);
        sendJson(response, 202, run, {
          location: `/gate-runs/${encodeURIComponent(run.runId)}`
        });
      } catch (error) {
        sendJson(response, 400, {
          schema: COMPANION_SCHEMA,
          workpackage: 'XDS-WP-04',
          ok: false,
          diagnostics: [
            createDevSurfaceDiagnostic(
              DIAGNOSTIC_CATALOG.companionBadRequest.code,
              error.message,
              'error'
            )
          ]
        });
      }
      return;
    }

    if (request.method === 'GET' && url.pathname.startsWith('/artifacts/')) {
      sendArtifact(response, decodeURIComponent(url.pathname.slice('/artifacts/'.length)), {
        rootDir: options.rootDir,
        allowlist: options.allowlist
      });
      return;
    }

    sendJson(response, 404, {
      schema: COMPANION_SCHEMA,
      workpackage: 'XDS-WP-04',
      ok: false,
      diagnostics: [
        createDevSurfaceDiagnostic(
          DIAGNOSTIC_CATALOG.companionNotFound.code,
          `No XTend Dev Surface companion route for ${request.method} ${url.pathname}.`,
          'warning'
        )
      ]
    });
  });

  return {
    schema: COMPANION_SCHEMA,
    origin: origin.origin,
    hostname: origin.hostname,
    port: origin.port,
    token,
    server,
    listen(callback) {
      return server.listen(origin.port, origin.hostname, callback);
    },
    close(callback) {
      return server.close(callback);
    }
  };
}

if (require.main === module) {
  const companion = createCompanionServer({
    token: process.env.XTEND_DEV_SURFACE_TOKEN
  });
  companion.listen(() => {
    console.log(JSON.stringify({
      schema: COMPANION_SCHEMA,
      workpackage: 'XDS-WP-04',
      origin: companion.origin,
      token: companion.token,
      tokenHeader: TOKEN_HEADER,
      handshakePath: '/handshake',
      gateStreamPath: '/gate-runs/events',
      gateCount: listGateDefinitions().length
    }, null, 2));
  });
}

module.exports = {
  COMPANION_SCHEMA,
  DEFAULT_PORT,
  HANDSHAKE_SCHEMA,
  TOKEN_HEADER,
  authorizeCompanionRequest,
  createCompanionArtifactRecord,
  createCompanionGatePlan,
  createCompanionHandshake,
  createCompanionServer,
  createGateStreamEvent,
  createRunStore,
  isAllowlistedArtifactPath,
  parseGateReport,
  startCompanionGateRun,
  runAllowedGate
};

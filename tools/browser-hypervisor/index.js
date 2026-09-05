'use strict';

const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const BROWSER_HYPERVISOR_SCHEMA = 'xtend.browser-hypervisor.v1';
const BROWSER_HYPERVISOR_EVIDENCE_SCHEMA = 'xtend.browser-hypervisor-evidence.v1';
const BROWSER_HYPERVISOR_MATRIX_SCHEMA = 'xtend.browser-hypervisor-evidence-matrix.v1';
const TARGET_ENGINES = Object.freeze(['chromium', 'firefox', 'webkit']);
const TERMINAL_STATUSES = new Set(['passed', 'unsupported-with-valid-fallback', 'rejected']);

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeEngine(value) {
  const engine = String(value || '').trim().toLowerCase();
  if (['chrome', 'chromedriver', 'chromium'].includes(engine)) return 'chromium';
  if (['firefox', 'gecko', 'geckodriver'].includes(engine)) return 'firefox';
  if (['safari', 'safaridriver', 'webkit'].includes(engine)) return 'webkit';
  if (['edge', 'msedge', 'msedgedriver'].includes(engine)) return 'edge';
  if (engine === 'webdriver' || engine === 'remote') return 'remote';
  return engine;
}

function defaultDriverForEngine(engine) {
  const normalized = normalizeEngine(engine);
  if (normalized === 'chromium') return 'chromedriver';
  if (normalized === 'firefox') return 'geckodriver';
  if (normalized === 'webkit') return 'safaridriver';
  if (normalized === 'edge') return 'msedgedriver';
  return 'webdriver';
}

function browserNameForEngine(engine, override) {
  if (override) return override;
  const normalized = normalizeEngine(engine);
  if (normalized === 'chromium') return 'chrome';
  if (normalized === 'firefox') return 'firefox';
  if (normalized === 'webkit') return 'safari';
  if (normalized === 'edge') return 'MicrosoftEdge';
  return normalized || 'chrome';
}

function findExecutable(name, explicitPath, options = {}) {
  const candidates = [];
  if (explicitPath) candidates.push(explicitPath);
  if (options.explicitOnly === true) {
    return candidates.find((candidate) => {
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return true;
      } catch (_) {
        return false;
      }
    }) || null;
  }
  const names = {
    chromedriver: ['/usr/local/share/chromedriver-linux64/chromedriver', '/usr/bin/chromedriver', '/snap/bin/chromium.chromedriver', '/snap/bin/chromedriver'],
    geckodriver: ['/usr/local/bin/geckodriver', '/usr/bin/geckodriver', '/snap/bin/geckodriver', '/snap/bin/firefox.geckodriver'],
    safaridriver: ['/System/Cryptexes/App/usr/bin/safaridriver', '/usr/bin/safaridriver'],
    msedgedriver: ['/usr/local/bin/msedgedriver', '/usr/bin/msedgedriver']
  };
  candidates.push(...(names[name] || []));
  for (const directory of String(process.env.PATH || '').split(path.delimiter).filter(Boolean)) {
    candidates.push(path.join(directory, name));
  }
  return candidates.find((candidate) => {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return true;
    } catch (_) {
      return false;
    }
  }) || null;
}

function parseEndpoint(value) {
  const target = new URL(value);
  if (!['http:', 'https:'].includes(target.protocol)) throw new Error('WebDriver endpoint must use HTTP or HTTPS.');
  return {
    protocol: target.protocol,
    hostname: target.hostname,
    port: Number(target.port || (target.protocol === 'https:' ? 443 : 80)),
    prefix: target.pathname && target.pathname !== '/' ? target.pathname.replace(/\/$/u, '') : ''
  };
}

function requestJson(endpoint, method, pathname, payload) {
  const body = payload === undefined ? '' : JSON.stringify(payload);
  const transport = endpoint.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const remaining = (endpoint.deadline || Date.now() + 10000) - Date.now();
    if (remaining <= 0) { reject(new Error(`WebDriver deadline exceeded for ${method} ${pathname}.`)); return; }
    if (endpoint.assertOwner) {
      try { endpoint.assertOwner(); } catch (error) { reject(error); return; }
    }
    let timer;
    const fail = error => { clearTimeout(timer); reject(error); };
    const request = transport.request({
      hostname: endpoint.hostname,
      port: endpoint.port,
      path: `${endpoint.prefix}${pathname}`,
      method,
      headers: body ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } : {}
    }, (response) => {
      let text = '';
      response.setEncoding('utf8');
      response.on('error', fail);
      response.on('aborted', () => fail(new Error(`WebDriver response aborted for ${method} ${pathname}.`)));
      response.on('data', (chunk) => { text += chunk; });
      response.on('end', () => {
        clearTimeout(timer);
        let parsed = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch (error) {
          reject(new Error(`WebDriver returned invalid JSON for ${method} ${pathname}: ${error.message}`));
          return;
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`WebDriver ${method} ${pathname} failed with ${response.statusCode}: ${text.slice(-500)}`));
          return;
        }
        if (!parsed || typeof parsed !== 'object' || parsed.value?.error || (parsed.status !== undefined && parsed.status !== 0)) {
          reject(new Error(`WebDriver protocol error for ${method} ${pathname}: ${text.slice(-500)}`));
          return;
        }
        try { endpoint.assertOwner?.(); } catch (error) { reject(error); return; }
        resolve({ statusCode: response.statusCode, body: parsed });
      });
    });
    timer = setTimeout(() => request.destroy(new Error(`WebDriver deadline exceeded for ${method} ${pathname}.`)), remaining);
    request.on('error', fail);
    if (body) request.write(body);
    request.end();
  });
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForEndpoint(endpoint, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      await requestJson(endpoint, 'GET', '/status');
      return true;
    } catch (_) {
      endpoint.assertOwner?.();
      await wait(100);
    }
  }
  return false;
}

async function availablePort(requestedPort = 0) {
  const server = net.createServer();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(requestedPort, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

function createCapabilities(options = {}) {
  const engine = normalizeEngine(options.engine);
  const browserName = browserNameForEngine(engine, options.browserName);
  const alwaysMatch = { browserName, ...(options.capabilities || {}) };
  if (engine === 'chromium') {
    alwaysMatch['goog:chromeOptions'] = {
      args: ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--run-all-compositor-stages-before-draw', `--window-size=${options.width || 1280},${options.height || 720}`],
      ...(alwaysMatch['goog:chromeOptions'] || {})
    };
    if (options.browserBinary) alwaysMatch['goog:chromeOptions'].binary = options.browserBinary;
  } else if (engine === 'firefox') {
    alwaysMatch['moz:firefoxOptions'] = {
      args: ['-headless'],
      prefs: {
        'media.autoplay.default': 0,
        'media.autoplay.blocking_policy': 0
      },
      ...(alwaysMatch['moz:firefoxOptions'] || {})
    };
    if (options.browserBinary) alwaysMatch['moz:firefoxOptions'].binary = options.browserBinary;
  } else if (engine === 'edge') {
    alwaysMatch['ms:edgeOptions'] = {
      args: ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--run-all-compositor-stages-before-draw', `--window-size=${options.width || 1280},${options.height || 720}`],
      ...(alwaysMatch['ms:edgeOptions'] || {})
    };
    if (options.browserBinary) alwaysMatch['ms:edgeOptions'].binary = options.browserBinary;
  }
  return { capabilities: { alwaysMatch } };
}

function driverArguments(driver, port) {
  if (driver === 'safaridriver') return ['-p', String(port)];
  if (driver === 'geckodriver') return ['--port', String(port)];
  return [`--port=${port}`];
}

function defaultPort(driver) {
  if (driver === 'geckodriver') return 4444;
  if (driver === 'safaridriver') return 57932;
  if (driver === 'msedgedriver') return 9516;
  return 9515;
}

function providerOptions(options = {}) {
  return {
    webDriverUrl: options.webDriverUrl || process.env.XTEND_BROWSER_HYPERVISOR_URL || '',
    driverPath: options.driverPath || process.env.XTEND_BROWSER_HYPERVISOR_DRIVER_PATH || '',
    browserBinary: options.browserBinary || process.env.XTEND_BROWSER_HYPERVISOR_BROWSER_BINARY || '',
    port: options.port || Number(process.env.XTEND_BROWSER_HYPERVISOR_PORT || 0) || undefined
  };
}

function detectAvailableEngine(options = {}) {
  const provider = providerOptions(options);
  if (provider.webDriverUrl) return normalizeEngine(options.engine || process.env.XTEND_BROWSER_HYPERVISOR_ENGINE || 'chromium');
  const requested = normalizeEngine(options.engine || process.env.XTEND_BROWSER_HYPERVISOR_ENGINE || '');
  const engines = requested ? [requested] : [...TARGET_ENGINES, 'edge'];
  return engines.find((engine) => findExecutable(defaultDriverForEngine(engine), provider.driverPath)) || '';
}

async function stopDriver(child, timeoutMs = 3000) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return { ok: true, method: 'already-exited' };
  try {
    child.kill();
  } catch (error) {
    return { ok: false, method: 'signal', reason: `WebDriver termination failed: ${error.message}` };
  }
  const exited = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    child.once('exit', () => { clearTimeout(timer); resolve(true); });
  });
  if (exited) return { ok: true, method: 'signal' };
  try {
    child.kill('SIGKILL');
  } catch (error) {
    return { ok: false, method: 'forced', reason: `WebDriver forced termination failed: ${error.message}` };
  }
  const forcedExit = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 1000);
    child.once('exit', () => { clearTimeout(timer); resolve(true); });
  });
  return forcedExit
    ? { ok: true, method: 'forced' }
    : { ok: false, method: 'forced', reason: 'WebDriver did not exit after forced termination.' };
}

function sessionIdentity(value, fallbackEngine) {
  const capabilities = value && value.capabilities || {};
  return {
    sessionId: value && (value.sessionId || value.id),
    browserName: capabilities.browserName || browserNameForEngine(fallbackEngine),
    browserVersion: capabilities.browserVersion || capabilities.version || null,
    platformName: capabilities.platformName || null,
    capabilities
  };
}

async function executeScript(endpoint, sessionId, script, args = []) {
  const response = await requestJson(endpoint, 'POST', `/session/${sessionId}/execute/sync`, { script, args });
  return response.body && response.body.value;
}

async function performActions(endpoint, sessionId, actions) {
  if (!Array.isArray(actions) || actions.length === 0) return;
  await requestJson(endpoint, 'POST', `/session/${sessionId}/actions`, { actions });
  await requestJson(endpoint, 'DELETE', `/session/${sessionId}/actions`);
}

async function waitForResult(endpoint, sessionId, resultKey, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const result = await executeScript(endpoint, sessionId, `return window[${JSON.stringify(resultKey)}] || null;`);
    if (result && result.status && result.status !== 'pending') return result;
    await wait(100);
  }
  throw new Error(`Browser fixture did not publish ${resultKey} within ${timeoutMs}ms.`);
}

async function runFixture(options = {}) {
  const engine = normalizeEngine(options.engine);
  if (!engine) throw new Error('Browser engine is required.');
  if (!options.resultKey) throw new Error('Browser resultKey is required.');
  const driver = options.driver || defaultDriverForEngine(engine);
  const provider = providerOptions(options);
  const timeoutMs = Number(options.timeoutMs || (engine === 'firefox' ? 20000 : 10000));
  const deadline = Date.now() + timeoutMs;
  let child = null;
  let endpointUrl = provider.webDriverUrl;
  if (!endpointUrl) {
    const executable = findExecutable(driver, provider.driverPath, { explicitOnly: Boolean(provider.driverPath) });
    if (!executable) throw new Error(`${driver} was not found; configure driverPath or webDriverUrl.`);
    const port = await availablePort(provider.port);
    child = spawn(executable, driverArguments(driver, port), { stdio: 'ignore' });
    child.once('error', error => { child.startError = error; });
    endpointUrl = `http://127.0.0.1:${port}`;
  }
  const endpoint = parseEndpoint(endpointUrl);
  endpoint.deadline = deadline;
  if (child) endpoint.assertOwner = () => {
    if (child.startError || child.exitCode !== null || child.signalCode !== null) throw new Error(`Owned WebDriver process stopped: ${child.startError?.message || child.exitCode || child.signalCode}`);
  };
  let sessionId = null;
  let cleanup = { ok: true, method: 'none' };
  let primaryError = null;
  try {
    if (!await waitForEndpoint(endpoint, timeoutMs)) throw new Error(`WebDriver endpoint did not become ready at ${endpointUrl}.`);
    const statusResponse = await requestJson(endpoint, 'GET', '/status');
    const response = await requestJson(endpoint, 'POST', '/session', createCapabilities({ ...options, ...provider, engine }));
    const identity = sessionIdentity(response.body && response.body.value, engine);
    sessionId = identity.sessionId;
    if (!sessionId) throw new Error(`WebDriver did not create a session: ${JSON.stringify(response.body || null)}`);
    if (options.width || options.height) {
      await requestJson(endpoint, 'POST', `/session/${sessionId}/window/rect`, {
        width: Number(options.width || 1280),
        height: Number(options.height || 720)
      });
    }
    const fixtureUrl = options.url || pathToFileURL(path.resolve(options.rootDir || process.cwd(), options.fixturePath)).href;
    await requestJson(endpoint, 'POST', `/session/${sessionId}/url`, { url: fixtureUrl });
    for (const step of Array.isArray(options.scripts) ? options.scripts : []) {
      await executeScript(endpoint, sessionId, step.script, step.args || []);
    }
    await performActions(endpoint, sessionId, options.actions);
    const result = await waitForResult(endpoint, sessionId, options.resultKey, timeoutMs);
    if (typeof options.accept === 'function' && !options.accept(result)) throw new Error(`Browser fixture failed its acceptance contract for ${options.resultKey}.`);
    let screenshot = null;
    if (options.screenshotPath) {
      const shot = await requestJson(endpoint, 'GET', `/session/${sessionId}/screenshot`);
      const encoded = shot.body && shot.body.value;
      if (!encoded) throw new Error('WebDriver returned no screenshot data.');
      fs.mkdirSync(path.dirname(options.screenshotPath), { recursive: true });
      fs.writeFileSync(options.screenshotPath, Buffer.from(encoded, 'base64'));
      screenshot = options.screenshotPath;
    }
    const statusValue = statusResponse.body && statusResponse.body.value || {};
    return {
      schema: BROWSER_HYPERVISOR_SCHEMA,
      engine,
      driver,
      driverVersion: statusValue.build && statusValue.build.version || statusValue.version || null,
      fixtureUrl,
      result,
      screenshot,
      ...identity
    };
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    const cleanupErrors = [];
    const cleanupDeadline = Date.now() + Number(options.cleanupTimeoutMs || 5000);
    if (sessionId) {
      try { await requestJson({ ...endpoint, deadline: cleanupDeadline }, 'DELETE', `/session/${sessionId}`); }
      catch (error) { cleanupErrors.push(error); }
    }
    cleanup = await stopDriver(child, Math.max(1, cleanupDeadline - Date.now() - 1000));
    if (!cleanup.ok) cleanupErrors.push(new Error(cleanup.reason));
    if (cleanupErrors.length) throw new AggregateError([...(primaryError ? [primaryError] : []), ...cleanupErrors], [primaryError?.message, ...cleanupErrors.map(error => error.message)].filter(Boolean).join('; '));
  }
}

function createEvidence(options = {}) {
  const harness = options.harnessText || '';
  return {
    schema: BROWSER_HYPERVISOR_EVIDENCE_SCHEMA,
    runId: options.runId,
    capturedAt: options.capturedAt,
    engine: normalizeEngine(options.engine),
    browserName: options.browserName || browserNameForEngine(options.engine),
    browserVersion: options.browserVersion || null,
    driver: options.driver || defaultDriverForEngine(options.engine),
    driverVersion: options.driverVersion || null,
    platformName: options.platformName || null,
    harness: options.harness,
    harnessSha256: options.harnessSha256 || sha256(harness),
    status: options.status,
    result: options.result || null,
    checks: Array.isArray(options.checks) ? options.checks : [],
    metrics: options.metrics || {},
    claimBoundary: options.claimBoundary || 'engine-lab-evidence-not-shipping-support'
  };
}

function validateEvidence(evidence, options = {}) {
  const errors = [];
  if (!evidence || evidence.schema !== BROWSER_HYPERVISOR_EVIDENCE_SCHEMA) errors.push('invalid evidence schema');
  if (!evidence || !evidence.runId || !evidence.engine || !evidence.harness || !evidence.harnessSha256) errors.push('missing evidence identity');
  if (!evidence || !evidence.browserVersion || !evidence.driverVersion) errors.push('missing browser or driver version');
  if (!evidence || !TERMINAL_STATUSES.has(evidence.status)) errors.push('evidence status is not terminal');
  if (evidence && !/^[a-f0-9]{64}$/u.test(String(evidence.harnessSha256 || ''))) errors.push('invalid harness digest');
  if (options.runId && evidence.runId !== options.runId) errors.push('stale run id');
  if (options.harnessSha256 && evidence.harnessSha256 !== options.harnessSha256) errors.push('stale harness digest');
  return errors;
}

function mergeEvidence(evidenceItems, options = {}) {
  const items = Array.isArray(evidenceItems) ? evidenceItems : [];
  const errors = [];
  const expectedEngines = options.engines || TARGET_ENGINES;
  items.forEach((entry) => errors.push(...validateEvidence(entry, options).map((error) => `${entry && entry.engine || 'unknown'}: ${error}`)));
  const engines = items.map((entry) => normalizeEngine(entry.engine));
  if (new Set(engines).size !== engines.length) errors.push('duplicate engine evidence');
  expectedEngines.forEach((engine) => {
    if (!engines.includes(normalizeEngine(engine))) errors.push(`missing ${normalizeEngine(engine)} evidence`);
  });
  const digests = new Set(items.map((entry) => entry.harnessSha256));
  if (digests.size > 1) errors.push('engine evidence uses different harness digests');
  const matrix = {
    schema: BROWSER_HYPERVISOR_MATRIX_SCHEMA,
    runId: options.runId || items[0] && items[0].runId || null,
    status: errors.length === 0 ? 'passed' : 'failed',
    engines: items,
    engineCount: items.length,
    errors,
    noInfrastructureResiduals: errors.length === 0
  };
  return matrix;
}

module.exports = {
  BROWSER_HYPERVISOR_EVIDENCE_SCHEMA,
  BROWSER_HYPERVISOR_MATRIX_SCHEMA,
  BROWSER_HYPERVISOR_SCHEMA,
  TARGET_ENGINES,
  browserNameForEngine,
  createCapabilities,
  createEvidence,
  detectAvailableEngine,
  defaultDriverForEngine,
  findExecutable,
  mergeEvidence,
  normalizeEngine,
  parseEndpoint,
  requestJson,
  availablePort,
  performActions,
  providerOptions,
  runFixture,
  sha256,
  validateEvidence
};

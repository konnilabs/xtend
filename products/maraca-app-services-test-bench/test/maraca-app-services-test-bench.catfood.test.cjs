'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const test = require('node:test');

const EVIDENCE_SCHEMA = 'xtend.maraca-app-services-test-bench-evidence.v1';
const HOST_STARTUP_SCHEMA = 'xtend.maraca.node-app-host-startup.v1';
const REQUEST_SCHEMA = 'xtend.maraca.app-service-request.v1';
const ACTION_RESULT_SCHEMA = 'xtend.epic18.rmt-action-result.v1';
const COMPONENT_COMMAND_RESULT_SCHEMA = 'xtend.maraca.component-command-result.v1';
const TEXTAREA_SNAPSHOT_SCHEMA = 'xtend.component.form-control-snapshot.v1';
const SAVE_SERVICE_ID = 'maraca.testbench.text.save';
const LIST_SERVICE_ID = 'maraca.testbench.text.list';
const UI_SAVE_COUNT = 22;
const HISTORY_LIMIT = 20;
const TEST_TIMEOUT_MS = 180_000;
const WAIT_TIMEOUT_MS = 15_000;

const productRoot = path.resolve(__dirname, '..');
const resultsRoot = path.join(productRoot, '.xtend-test-results');
const evidencePath = path.join(resultsRoot, 'maraca-app-services-test-bench-evidence.json');
const screenshotPath = path.join(resultsRoot, 'maraca-app-services-test-bench.png');

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function withTimeout(promise, milliseconds, label) {
  let timeout;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timeout = setTimeout(() => reject(new Error(`${label} timed out after ${milliseconds} ms.`)), milliseconds);
    })
  ]).finally(() => clearTimeout(timeout));
}

async function waitUntil(predicate, label, options = {}) {
  const timeoutMs = options.timeoutMs || WAIT_TIMEOUT_MS;
  const intervalMs = options.intervalMs || 50;
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      if (await predicate()) return true;
    } catch (error) {
      lastError = error;
    }
    await delay(intervalMs);
  }
  const suffix = lastError ? ` Last probe failed with ${lastError.name || 'Error'}.` : '';
  throw new Error(`${label} timed out after ${timeoutMs} ms.${suffix}`);
}

function safeFailureCode(error) {
  const candidate = error && typeof error.code === 'string' ? error.code : '';
  return /^[A-Za-z0-9_.:-]{1,96}$/u.test(candidate) ? candidate : 'xtend.catfood.assertion_failed';
}

function writeRedactedEvidence(evidence) {
  fs.mkdirSync(resultsRoot, { recursive: true });
  const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
  fs.writeFileSync(evidencePath, serialized, 'utf8');
  return serialized;
}

function waitForExit(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve({ code: child && child.exitCode, signal: child && child.signalCode });
  }
  return new Promise((resolve) => {
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
}

async function stopChild(child, gracefulSignal = 'SIGTERM') {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = waitForExit(child);
  child.kill(gracefulSignal);
  const graceful = await Promise.race([
    exited.then(() => true),
    delay(10_000).then(() => false)
  ]);
  if (!graceful && child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    await withTimeout(exited, 5_000, 'Child process termination');
  }
}

async function startGeneratedHost(databasePath) {
  const child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: productRoot,
    env: {
      ...process.env,
      XTEND_MARACA_HOST: '127.0.0.1',
      XTEND_MARACA_PORT: '0',
      XTEND_MARACA_TEST_BENCH_DB_PATH: databasePath
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let stdout = '';
  let stderr = '';
  let settled = false;

  const startup = new Promise((resolve, reject) => {
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    child.once('error', rejectOnce);
    child.once('exit', (code, signal) => {
      rejectOnce(new Error(`Generated host exited before startup (${code === null ? signal : code}).`));
    });
    child.stderr.on('data', (chunk) => {
      stderr = `${stderr}${String(chunk)}`.slice(-16_384);
    });
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
      const lines = stdout.split(/\r?\n/u);
      stdout = lines.pop() || '';
      for (const line of lines) {
        let record;
        try {
          record = JSON.parse(line);
        } catch (_) {
          continue;
        }
        if (record && record.schema === HOST_STARTUP_SCHEMA && record.ok === true) {
          if (settled) return;
          settled = true;
          resolve(record);
          return;
        }
      }
    });
  });

  let record;
  try {
    record = await withTimeout(startup, WAIT_TIMEOUT_MS, 'Generated Node host startup');
  } catch (error) {
    await stopChild(child);
    const diagnostic = stderr.trim() ? ` Host stderr ended with ${stderr.trim().slice(-400)}.` : '';
    throw new Error(`${error.message}${diagnostic}`);
  }
  assert.equal(record.host, '127.0.0.1', 'generated host must bind only to loopback');
  assert.equal(Number.isInteger(record.port) && record.port > 0, true, 'generated host must report a dynamic port');
  assert.equal(record.origin, `http://127.0.0.1:${record.port}`);

  return {
    child,
    origin: record.origin,
    port: record.port,
    async stop() {
      await stopChild(child);
    }
  };
}

function chromiumExecutable() {
  const configured = process.env.XTEND_CHROMIUM_PATH || process.env.CHROME_BIN || process.env.CHROMIUM_BIN;
  if (configured) return configured;
  const absoluteCandidates = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome'
  ];
  return absoluteCandidates.find((candidate) => fs.existsSync(candidate)) || 'chromium';
}

async function launchChromium(profileDir) {
  const executable = chromiumExecutable();
  const args = [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-sync',
    '--metrics-recording-only',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-allow-origins=*',
    '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=0',
    '--window-size=1440,1200',
    `--user-data-dir=${profileDir}`,
    'about:blank'
  ];
  const child = spawn(executable, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  let settled = false;
  const endpoint = new Promise((resolve, reject) => {
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    child.once('error', rejectOnce);
    child.once('exit', (code, signal) => {
      rejectOnce(new Error(`Chromium exited before CDP startup (${code === null ? signal : code}).`));
    });
    const inspect = (chunk) => {
      stderr = `${stderr}${String(chunk)}`.slice(-32_768);
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/u);
      if (!match || settled) return;
      settled = true;
      resolve(match[1]);
    };
    child.stderr.on('data', inspect);
    child.stdout.on('data', inspect);
  });

  let webSocketUrl;
  try {
    webSocketUrl = await withTimeout(endpoint, WAIT_TIMEOUT_MS, 'Chromium CDP startup');
  } catch (error) {
    await stopChild(child);
    throw new Error(`${error.message} Chromium executable: ${path.basename(executable)}.`);
  }
  return { child, executable, webSocketUrl };
}

class CdpConnection {
  constructor(webSocketUrl) {
    assert.equal(typeof WebSocket, 'function', 'Node >=24 global WebSocket is required for CDP');
    this.socket = new WebSocket(webSocketUrl);
    this.sequence = 0;
    this.pending = new Map();
    this.listeners = new Set();
    this.opened = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', () => reject(new Error('CDP WebSocket failed to open.')), { once: true });
    });
    this.socket.addEventListener('message', (event) => { void this.handleMessage(event.data); });
    this.socket.addEventListener('close', () => {
      for (const entry of this.pending.values()) entry.reject(new Error('CDP WebSocket closed.'));
      this.pending.clear();
    });
  }

  async ready() {
    await withTimeout(this.opened, WAIT_TIMEOUT_MS, 'CDP WebSocket connection');
    return this;
  }

  async handleMessage(data) {
    let text;
    if (typeof data === 'string') text = data;
    else if (data instanceof ArrayBuffer) text = Buffer.from(data).toString('utf8');
    else if (ArrayBuffer.isView(data)) text = Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf8');
    else if (data && typeof data.text === 'function') text = await data.text();
    else return;
    let message;
    try {
      message = JSON.parse(text);
    } catch (_) {
      return;
    }
    if (message.id) {
      const entry = this.pending.get(message.id);
      if (!entry) return;
      this.pending.delete(message.id);
      clearTimeout(entry.timeout);
      if (message.error) entry.reject(new Error(`CDP ${entry.method} failed (${message.error.code}).`));
      else entry.resolve(message.result || {});
      return;
    }
    if (!message.method) return;
    for (const listener of this.listeners) {
      if (listener.method !== message.method) continue;
      if (listener.sessionId && listener.sessionId !== message.sessionId) continue;
      try {
        listener.handler(message.params || {}, message);
      } catch (_) {
        // Listener failures are asserted through their owning probe.
      }
    }
  }

  async send(method, params = {}, sessionId = null, timeoutMs = WAIT_TIMEOUT_MS) {
    await this.ready();
    const id = ++this.sequence;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP ${method} timed out.`));
      }, timeoutMs);
      this.pending.set(id, { method, resolve, reject, timeout });
      try {
        this.socket.send(JSON.stringify(payload));
      } catch (error) {
        clearTimeout(timeout);
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  on(method, handler, sessionId = null) {
    const listener = { method, handler, sessionId };
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  waitForEvent(method, sessionId = null, timeoutMs = WAIT_TIMEOUT_MS) {
    return withTimeout(new Promise((resolve) => {
      const remove = this.on(method, (params) => {
        remove();
        resolve(params);
      }, sessionId);
    }), timeoutMs, `CDP event ${method}`);
  }

  close() {
    if (this.socket.readyState === 0 || this.socket.readyState === 1) this.socket.close();
  }
}

class ChromiumPage {
  constructor(connection, sessionId, targetId) {
    this.connection = connection;
    this.sessionId = sessionId;
    this.targetId = targetId;
    this.requestMeta = new Map();
    this.serviceRequests = [];
    this.serviceResponses = [];
    this.networkTasks = new Set();
    this.networkCaptureFailures = 0;
    this.removeNetworkListeners = [];
  }

  static async create(connection) {
    const target = await connection.send('Target.createTarget', { url: 'about:blank' });
    const attached = await connection.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const page = new ChromiumPage(connection, attached.sessionId, target.targetId);
    await Promise.all([
      page.send('Page.enable'),
      page.send('Runtime.enable'),
      page.send('Network.enable', { maxTotalBufferSize: 8 * 1024 * 1024, maxResourceBufferSize: 2 * 1024 * 1024 }),
      page.send('Log.enable'),
      page.send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 1200,
        deviceScaleFactor: 1,
        mobile: false
      })
    ]);
    page.installNetworkCapture();
    return page;
  }

  send(method, params = {}, timeoutMs = WAIT_TIMEOUT_MS) {
    return this.connection.send(method, params, this.sessionId, timeoutMs);
  }

  installNetworkCapture() {
    this.removeNetworkListeners.push(this.connection.on('Network.requestWillBeSent', (params) => {
      const request = params.request || {};
      if (!String(request.url || '').includes('/api/xtend/services/')) return;
      const pathname = new URL(request.url).pathname;
      let envelope = null;
      try { envelope = JSON.parse(String(request.postData || '')); } catch (_) {}
      const input = envelope && envelope.input;
      const text = input && input.text;
      this.serviceRequests.push(Object.freeze({
        serviceId: decodeURIComponent(pathname.slice(pathname.lastIndexOf('/') + 1)),
        method: String(request.method || ''),
        envelopeSchema: envelope && typeof envelope.schema === 'string' ? envelope.schema : null,
        kind: envelope && typeof envelope.kind === 'string' ? envelope.kind : null,
        inputType: input === null ? 'null' : Array.isArray(input) ? 'array' : typeof input,
        textType: typeof text,
        textLength: typeof text === 'string' ? text.length : null
      }));
    }, this.sessionId));
    this.removeNetworkListeners.push(this.connection.on('Network.responseReceived', (params) => {
      const response = params.response || {};
      if (!String(response.url || '').includes('/api/xtend/services/')) return;
      this.requestMeta.set(params.requestId, {
        status: response.status,
        url: response.url,
        mimeType: response.mimeType || ''
      });
    }, this.sessionId));
    this.removeNetworkListeners.push(this.connection.on('Network.loadingFinished', (params) => {
      const meta = this.requestMeta.get(params.requestId);
      if (!meta) return;
      this.requestMeta.delete(params.requestId);
      const task = this.send('Network.getResponseBody', { requestId: params.requestId })
        .then((bodyResult) => {
          const body = bodyResult.base64Encoded
            ? Buffer.from(bodyResult.body || '', 'base64').toString('utf8')
            : String(bodyResult.body || '');
          let payload = null;
          try { payload = JSON.parse(body); } catch (_) {}
          const value = payload && payload.value;
          const verdict = value && value.trustBoundary;
          const pathname = new URL(meta.url).pathname;
          this.serviceResponses.push(Object.freeze({
            serviceId: decodeURIComponent(pathname.slice(pathname.lastIndexOf('/') + 1)),
            status: Number(meta.status),
            ok: Boolean(payload && payload.ok),
            errorCode: payload && payload.error && String(payload.error.code || '') || null,
            entryCount: value && Number.isInteger(value.count) ? value.count : null,
            saved: Boolean(value && value.saved),
            trustBoundary: verdict ? Object.freeze({
              schema: String(verdict.schema || ''),
              ok: verdict.ok === true,
              phase: String(verdict.phase || ''),
              sanitized: verdict.sanitized === true
            }) : null
          }));
        })
        .catch(() => { this.networkCaptureFailures += 1; })
        .finally(() => this.networkTasks.delete(task));
      this.networkTasks.add(task);
    }, this.sessionId));
    this.removeNetworkListeners.push(this.connection.on('Network.loadingFailed', (params) => {
      this.requestMeta.delete(params.requestId);
    }, this.sessionId));
  }

  async flushNetworkCapture() {
    while (this.networkTasks.size > 0) await Promise.allSettled(Array.from(this.networkTasks));
  }

  async navigate(url) {
    const loaded = this.connection.waitForEvent('Page.loadEventFired', this.sessionId, WAIT_TIMEOUT_MS);
    const navigation = await this.send('Page.navigate', { url });
    if (navigation.errorText) throw new Error(`Page navigation failed: ${navigation.errorText}`);
    await loaded;
  }

  async evaluateFunction(fn, args = []) {
    const expression = `(${fn.toString()})(...${JSON.stringify(args)})`;
    const evaluated = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    });
    if (evaluated.exceptionDetails) {
      const exception = evaluated.exceptionDetails.exception;
      throw new Error(exception && exception.description || 'Browser evaluation failed.');
    }
    return evaluated.result && Object.prototype.hasOwnProperty.call(evaluated.result, 'value')
      ? evaluated.result.value
      : null;
  }

  async waitForFunction(fn, args, label, timeoutMs = WAIT_TIMEOUT_MS) {
    return waitUntil(() => this.evaluateFunction(fn, args), label, { timeoutMs, intervalMs: 50 });
  }

  async dispatchEnter(shiftKey) {
    const modifiers = shiftKey ? 8 : 0;
    const shared = {
      modifiers,
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13
    };
    await this.send('Input.dispatchKeyEvent', {
      ...shared,
      type: 'keyDown',
      text: '\r',
      unmodifiedText: '\r'
    });
    await this.send('Input.dispatchKeyEvent', { ...shared, type: 'keyUp' });
  }

  async screenshot() {
    await this.send('Page.bringToFront');
    const metrics = await this.send('Page.getLayoutMetrics');
    const content = metrics.cssContentSize || metrics.contentSize || { width: 1440, height: 1200 };
    const width = Math.max(1, Math.min(2000, Math.ceil(content.width || 1440)));
    const height = Math.max(1, Math.min(16_000, Math.ceil(content.height || 1200)));
    const capture = await this.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height, scale: 1 }
    }, 30_000);
    return Buffer.from(capture.data || '', 'base64');
  }

  dispose() {
    this.removeNetworkListeners.splice(0).forEach((remove) => remove());
  }
}

async function createBrowser(profileDir) {
  const chromium = await launchChromium(profileDir);
  const connection = await new CdpConnection(chromium.webSocketUrl).ready();
  const page = await ChromiumPage.create(connection);
  return {
    ...chromium,
    connection,
    page,
    async stop() {
      page.dispose();
      try { await connection.send('Browser.close', {}, null, 2_000); } catch (_) {}
      connection.close();
      await stopChild(chromium.child);
    }
  };
}

async function bootProductPage(page, origin) {
  await page.navigate(`${origin}/`);
  await page.waitForFunction(
    () => document.documentElement.dataset.maracaRuntimeReady === 'true'
      && document.documentElement.dataset.xtendDevApiReady === 'true',
    [],
    'Maraca runtime readiness'
  );
  await page.evaluateFunction(() => {
    const textarea = document.getElementById('testbench-textarea');
    if (textarea) textarea.scrollIntoView({ block: 'center' });
    return Boolean(textarea);
  });
  await page.waitForFunction(
    () => {
      const textarea = document.getElementById('testbench-textarea');
      return Boolean(customElements.get('x-textarea') && textarea && textarea.shadowRoot && textarea.shadowRoot.querySelector('textarea'));
    },
    [],
    'XTextarea hydration'
  );
}

async function clickRmtButton(page, buttonId, condition, label) {
  const clicked = await page.evaluateFunction((id) => {
    const button = document.getElementById(id);
    if (!button || typeof button.click !== 'function') return false;
    button.click();
    return true;
  }, [buttonId]);
  assert.equal(clicked, true, `${buttonId} must be rendered as an actionable RMT surface`);
  await page.waitForFunction((expected) => {
    const textarea = document.getElementById('testbench-textarea');
    const control = textarea && textarea.shadowRoot && textarea.shadowRoot.querySelector('textarea');
    if (!textarea || !control) return false;
    if (Object.prototype.hasOwnProperty.call(expected, 'attributePresent')
      && textarea.hasAttribute(expected.attribute) !== expected.attributePresent) return false;
    if (Object.prototype.hasOwnProperty.call(expected, 'attributeValue')
      && textarea.getAttribute(expected.attribute) !== expected.attributeValue) return false;
    if (Object.prototype.hasOwnProperty.call(expected, 'controlProperty')
      && control[expected.controlProperty] !== expected.controlValue) return false;
    if (Object.prototype.hasOwnProperty.call(expected, 'controlAttribute')
      && control.getAttribute(expected.controlAttribute) !== expected.controlAttributeValue) return false;
    if (Object.prototype.hasOwnProperty.call(expected, 'lineNumbering')
      && textarea.lineNumbering !== expected.lineNumbering) return false;
    if (Array.isArray(expected.allPresent)
      && !expected.allPresent.every((name) => textarea.hasAttribute(name))) return false;
    if (Array.isArray(expected.allAbsent)
      && !expected.allAbsent.every((name) => !textarea.hasAttribute(name))) return false;
    return true;
  }, [condition], label);
}

async function clickRmtComponentCommand(page, buttonId, command) {
  const beforeCount = await page.evaluateFunction((targetCommand) => {
    const runtime = globalThis.XTendMaraca && globalThis.XTendMaraca.orchestration;
    if (!runtime || typeof runtime.snapshot !== 'function') return -1;
    const snapshot = runtime.snapshot();
    const actions = snapshot && Array.isArray(snapshot.actions)
      ? snapshot.actions
      : snapshot && snapshot.actions && Array.isArray(snapshot.actions.history) ? snapshot.actions.history : [];
    let count = 0;
    for (const action of actions) {
      if (!action || action.schema !== 'xtend.epic18.rmt-action-result.v1') continue;
      const effects = Array.isArray(action.effects) ? action.effects : [];
      for (const effect of effects) {
        const result = effect && effect.value && effect.value.result;
        if (result && result.schema === 'xtend.maraca.component-command-result.v1'
          && result.command === targetCommand) count += 1;
      }
    }
    return count;
  }, [command]);
  assert.notEqual(beforeCount, -1, 'public Maraca orchestration snapshot must expose action history');

  const clicked = await page.evaluateFunction((id) => {
    const button = document.getElementById(id);
    if (!button || typeof button.click !== 'function') return false;
    button.click();
    return true;
  }, [buttonId]);
  assert.equal(clicked, true, `${buttonId} must be rendered as an actionable RMT component command`);

  await page.waitForFunction((targetCommand, previousCount) => {
    const runtime = globalThis.XTendMaraca && globalThis.XTendMaraca.orchestration;
    if (!runtime || typeof runtime.snapshot !== 'function') return false;
    const snapshot = runtime.snapshot();
    const actions = snapshot && Array.isArray(snapshot.actions)
      ? snapshot.actions
      : snapshot && snapshot.actions && Array.isArray(snapshot.actions.history) ? snapshot.actions.history : [];
    let count = 0;
    for (const action of actions) {
      if (!action || action.schema !== 'xtend.epic18.rmt-action-result.v1') continue;
      const effects = Array.isArray(action.effects) ? action.effects : [];
      for (const effect of effects) {
        const result = effect && effect.value && effect.value.result;
        if (result && result.schema === 'xtend.maraca.component-command-result.v1'
          && result.command === targetCommand) count += 1;
      }
    }
    return count > previousCount;
  }, [command, beforeCount], `RMT ${command} component-command action history`);

  const result = await page.evaluateFunction((targetCommand) => {
    const snapshot = globalThis.XTendMaraca.orchestration.snapshot();
    const actions = Array.isArray(snapshot.actions)
      ? snapshot.actions
      : snapshot.actions && Array.isArray(snapshot.actions.history) ? snapshot.actions.history : [];
    const matches = [];
    for (const action of actions) {
      if (!action || action.schema !== 'xtend.epic18.rmt-action-result.v1') continue;
      const effects = Array.isArray(action.effects) ? action.effects : [];
      for (const effect of effects) {
        const commandResult = effect && effect.value && effect.value.result;
        if (commandResult && commandResult.schema === 'xtend.maraca.component-command-result.v1'
          && commandResult.command === targetCommand) {
          matches.push({ actionSchema: action.schema, effectKind: effect.kind, commandResult });
        }
      }
    }
    return matches[matches.length - 1] || null;
  }, [command]);
  assert.ok(result, `RMT ${command} command must record effects[].value.result`);
  assert.equal(result.actionSchema, ACTION_RESULT_SCHEMA);
  assert.equal(result.effectKind, command);
  assert.equal(result.commandResult.schema, COMPONENT_COMMAND_RESULT_SCHEMA);
  assert.equal(result.commandResult.command, command);
  assert.equal(result.commandResult.surfaceId, 'maraca.testbench.editor');
  assert.equal(result.commandResult.component, 'x-textarea');
  return result.commandResult;
}

async function inspectPublicExposure(origin, privateMarker, databasePath) {
  const listFiles = (relativeDirectory) => {
    const root = path.join(productRoot, relativeDirectory);
    const pending = [root];
    const files = [];
    while (pending.length > 0) {
      const current = pending.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const absolute = path.join(current, entry.name);
        if (entry.isDirectory()) pending.push(absolute);
        else files.push(`/${path.relative(productRoot, absolute).split(path.sep).join('/')}`);
      }
    }
    return files;
  };
  const distFiles = listFiles('dist');
  const privatePaths = Array.from(new Set([
    '/server/index.mjs',
    '/src/server-services.ts',
    '/src/services.ts',
    '/dist/server/xtend.maraca.services.mjs',
    '/dist/server/xtend.maraca.services.mjs.map',
    '/dist/xtend.maraca.mjs.map',
    '/dist/xtend.maraca.report.json',
    '/dist/xtend.maraca.size.json',
    '/dist/xtend.maraca.services.d.ts',
    '/dist/xtend.maraca.services.php-report.json',
    '/test/maraca-app-services-test-bench.catfood.test.cjs',
    ...distFiles.filter((pathname) => pathname.endsWith('.map')
      || pathname.endsWith('.d.ts')
      || /(?:^|[.-])report\.json$/u.test(pathname)
      || /(?:^|[.-])size\.json$/u.test(pathname))
  ]));
  const blocked = [];
  for (const pathname of privatePaths) {
    const response = await fetch(`${origin}${pathname}`);
    const body = await response.text();
    blocked.push({ pathname, status: response.status, bodyLength: body.length });
    assert.equal(response.status === 403 || response.status === 404, true, `${pathname} must not be public`);
    assert.equal(body.includes(privateMarker), false, `${pathname} must not echo hostile input`);
  }

  const publicPaths = Array.from(new Set([
    '/site/index.html',
    '/src/material-runtime-host.mjs',
    '/src/material-dev-api.mjs',
    '/dist/xtend.maraca.mjs',
    '/dist/xtend.maraca.css',
    '/dist/xtend.maraca.services.json',
    ...distFiles.filter((pathname) => /^\/dist\/(?:chunks|runtime)\//u.test(pathname)
      && /\.(?:mjs|js|css)$/u.test(pathname))
  ]));
  const publicAssets = [];
  const forbiddenTokens = [
    'node:sqlite',
    'DatabaseSync',
    'CREATE TABLE IF NOT EXISTS text_entries',
    'XTEND_MARACA_TEST_BENCH_DB_PATH',
    'src/server-services.ts',
    'sourceMappingURL=',
    databasePath,
    privateMarker
  ];
  for (const pathname of publicPaths) {
    const response = await fetch(`${origin}${pathname}`);
    const body = await response.text();
    assert.equal(response.status, 200, `${pathname} must be served by the generated host`);
    assert.equal(forbiddenTokens.every((token) => !body.includes(token)), true, `${pathname} must not expose server source, maps, database paths, secrets, or hostile input`);
    publicAssets.push({ pathname, status: response.status, bytes: Buffer.byteLength(body) });
  }
  return {
    privatePathStatuses: Object.fromEntries(blocked.map((entry) => [entry.pathname, entry.status])),
    browserMapStatus: blocked.find((entry) => entry.pathname === '/dist/xtend.maraca.mjs.map').status,
    publicAssetCount: publicAssets.length,
    serverMaterialAbsent: true
  };
}

function inspectDatabase(databasePath, expectedTexts) {
  const { DatabaseSync } = require('node:sqlite');
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const tables = database.prepare('PRAGMA table_list').all();
    const table = tables.find((entry) => entry.name === 'text_entries');
    const version = database.prepare('PRAGMA user_version').get();
    const rows = database.prepare('SELECT id, content, created_at AS createdAt FROM text_entries ORDER BY id ASC').all();
    assert.ok(table, 'text_entries table must exist');
    assert.equal(Number(table.strict), 1, 'text_entries must be a STRICT table');
    assert.equal(Number(version.user_version), 1, 'database schema version must be one');
    assert.equal(rows.length, expectedTexts.length, 'blocked requests must not add database rows');
    assert.equal(rows.every((row) => typeof row.content === 'string'
      && !row.content.includes('\r')
      && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u.test(row.content)), true, 'SQLite must contain normalized plain text only');
    assert.equal(rows.every((row, index) => row.content === expectedTexts[index]), true, 'SQLite contents must match the sanitized UI submissions');
    assert.equal(rows.every((row) => Number.isInteger(Number(row.id)) && !Number.isNaN(Date.parse(String(row.createdAt)))), true, 'SQLite rows must have stable ids and timestamps');
    return {
      rowCount: rows.length,
      strict: Number(table.strict) === 1,
      userVersion: Number(version.user_version),
      normalizedPlainText: true
    };
  } finally {
    database.close();
  }
}

function countDatabaseRows(databasePath) {
  const { DatabaseSync } = require('node:sqlite');
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const row = database.prepare('SELECT COUNT(*) AS count FROM text_entries').get();
    return Number(row && row.count || 0);
  } finally {
    database.close();
  }
}

async function postForgedSaveRequest(origin, input, suffix) {
  const requestId = `catfood-forged-${suffix}`;
  const envelope = {
    schema: REQUEST_SCHEMA,
    serviceId: SAVE_SERVICE_ID,
    kind: 'command',
    target: 'server',
    invocationId: requestId,
    correlationId: requestId,
    input
  };
  const response = await fetch(`${origin}/api/xtend/services/${encodeURIComponent(SAVE_SERVICE_ID)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(envelope)
  });
  const body = await response.text();
  let payload = null;
  try { payload = JSON.parse(body); } catch (_) {}
  return { body, payload, status: response.status };
}

test('Maraca App Services Test Bench strict catfood evidence', { timeout: TEST_TIMEOUT_MS }, async () => {
  assert.equal(Number(process.versions.node.split('.')[0]) >= 24, true, 'catfood evidence requires Node >=24');
  assert.equal(typeof WebSocket, 'function', 'Node >=24 global WebSocket must be available');
  assert.equal(fs.existsSync(path.join(productRoot, 'dist', 'xtend.maraca.mjs')), true, 'test:catfood must build the Maraca app before evidence runs');
  assert.equal(fs.existsSync(path.join(productRoot, 'dist', 'server', 'xtend.maraca.services.mjs')), true, 'Maraca build must emit the generated server AppService bundle');

  fs.mkdirSync(resultsRoot, { recursive: true });
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-maraca-test-bench-'));
  const databasePath = path.join(temporaryRoot, 'text-entries.sqlite');
  const browserProfile = path.join(temporaryRoot, 'chromium-profile');
  const runToken = crypto.randomBytes(8).toString('hex');
  const hostileMarker = `HOSTILE_NUL_${runToken}`;
  const savedTexts = [];
  let host = null;
  let browser = null;
  let screenshot = null;
  let stage = 'bootstrap';
  let passEvidence = null;
  let browserBlockEvidence = null;
  let policyMismatchEvidence = null;
  let componentCommandEvidence = null;
  let layoutEvidence = null;

  try {
    stage = 'host-start';
    host = await startGeneratedHost(databasePath);
    stage = 'chromium-start';
    browser = await createBrowser(browserProfile);
    const { page } = browser;

    stage = 'initial-page-boot';
    await bootProductPage(page, host.origin);

    stage = 'responsive-layout-contract';
    layoutEvidence = await page.evaluateFunction(async () => {
      window.scrollTo(0, 0);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const round = (value) => Math.round(Number(value) * 100) / 100;
      const rectOf = (element) => {
        const rect = element && element.getBoundingClientRect();
        return rect ? {
          top: round(rect.top),
          right: round(rect.right),
          bottom: round(rect.bottom),
          left: round(rect.left),
          width: round(rect.width),
          height: round(rect.height)
        } : null;
      };
      const manager = document.querySelector('x-surface-manager.xtm-app-shell');
      const header = document.getElementById('testbench-header');
      const headerGrid = header && header.shadowRoot && header.shadowRoot.querySelector('header');
      const form = document.getElementById('testbench-form');
      const fields = document.getElementById('testbench-form-fields');
      const actions = document.getElementById('testbench-form-actions');
      const status = document.getElementById('testbench-form-status');
      const textarea = document.getElementById('testbench-textarea');
      const textareaLabel = textarea && textarea.shadowRoot && textarea.shadowRoot.querySelector('#label');
      const textareaEditor = textarea && textarea.shadowRoot && textarea.shadowRoot.querySelector('.editor');
      const textareaMeta = textarea && textarea.shadowRoot && textarea.shadowRoot.querySelector('.meta');
      const load = document.getElementById('testbench-load');
      const feedback = document.getElementById('testbench-feedback');
      const intro = document.getElementById('testbench-intro');
      const introContainer = intro && intro.shadowRoot && intro.shadowRoot.querySelector('.container');
      const workspace = manager && manager.shadowRoot && manager.shadowRoot.querySelector('.workspace');
      const windowSlot = manager && manager.shadowRoot && manager.shadowRoot.querySelector('slot[name="windows"]');
      const surfaces = windowSlot && typeof windowSlot.assignedElements === 'function'
        ? windowSlot.assignedElements().filter((element) => element.hasAttribute('data-maraca-surface'))
        : [];
      const surfaceRects = surfaces.map((element) => ({ id: element.id, ...rectOf(element) }));
      const surfaceGaps = surfaceRects.slice(1).map((rect, index) => round(rect.top - surfaceRects[index].bottom));
      const headerRect = rectOf(header);
      const headerGridRect = rectOf(headerGrid);
      const textareaRect = rectOf(textarea);
      const editorRect = rectOf(textareaEditor);
      const labelRect = rectOf(textareaLabel);
      const metaRect = rectOf(textareaMeta);
      const actionsRect = rectOf(actions);
      const loadRect = rectOf(load);
      return {
        viewportWidth: document.documentElement.clientWidth,
        bodyMargin: getComputedStyle(document.body).margin,
        horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        manager: { display: manager ? getComputedStyle(manager).display : '', rect: rectOf(manager) },
        header: {
          display: header ? getComputedStyle(header).display : '',
          rect: headerRect,
          gridRect: headerGridRect,
          fillRatio: headerRect && headerGridRect && headerRect.width ? round(headerGridRect.width / headerRect.width) : 0
        },
        form: { display: form ? getComputedStyle(form).display : '', rect: rectOf(form) },
        textarea: {
          rect: textareaRect,
          gridColumns: textarea ? getComputedStyle(textarea).gridTemplateColumns : '',
          gridColumnCount: textarea ? getComputedStyle(textarea).gridTemplateColumns.trim().split(/\s+/u).filter(Boolean).length : 0,
          editorRect,
          editorFillRatio: textareaRect && editorRect && textareaRect.width ? round(editorRect.width / textareaRect.width) : 0,
          verticalFlow: Boolean(labelRect && editorRect && metaRect && editorRect.top >= labelRect.bottom - 1 && metaRect.top >= editorRect.bottom - 1),
          parentId: textarea && textarea.parentElement && textarea.parentElement.id,
          ownsStructuralSlot: Boolean(textarea && textarea.hasAttribute('data-xtm-slot'))
        },
        actions: {
          display: actions ? getComputedStyle(actions).display : '',
          parentId: load && load.parentElement && load.parentElement.id,
          buttonWidthRatio: actionsRect && loadRect && actionsRect.width ? round(loadRect.width / actionsRect.width) : 0,
          leafHasRecipeClass: Boolean(load && load.classList.contains('xtm-primary-action')),
          leafOwnsStructuralSlot: Boolean(load && load.hasAttribute('data-xtm-slot'))
        },
        status: {
          parentId: feedback && feedback.parentElement && feedback.parentElement.id,
          leafHasRecipeClass: Boolean(feedback && feedback.classList.contains('xtm-feedback-stack')),
          leafOwnsStructuralSlot: Boolean(feedback && feedback.hasAttribute('data-xtm-slot'))
        },
        introOverflowX: introContainer ? getComputedStyle(introContainer).overflowX : '',
        workspaceGap: workspace ? getComputedStyle(workspace).gap : '',
        surfaceCount: surfaceRects.length,
        minimumSurfaceGap: surfaceGaps.length ? Math.min(...surfaceGaps) : 0,
        surfacesMonotonic: surfaceGaps.every((gap) => gap >= -0.5)
      };
    });
    assert.equal(layoutEvidence.bodyMargin, '0px', 'generated Maraca host must reset the browser body margin');
    assert.equal(layoutEvidence.horizontalOverflow, 0, 'responsive app shell must not overflow horizontally');
    assert.equal(layoutEvidence.manager.display, 'block', 'XTM app-shell recipe must preserve x-surface-manager host layout ownership');
    assert.equal(layoutEvidence.manager.rect.width >= layoutEvidence.viewportWidth * 0.99, true, 'app shell must fill the viewport width');
    assert.equal(layoutEvidence.header.display, 'flow-root', 'XTM top-app-bar recipe must preserve x-header host layout ownership');
    assert.equal(layoutEvidence.header.fillRatio >= 0.95, true, 'x-header shadow grid must fill its host width');
    assert.equal(layoutEvidence.form.display, 'block', 'XTM form-flow recipe must preserve x-form host layout ownership');
    assert.equal(layoutEvidence.textarea.gridColumnCount, 1, 'XTextarea host must remain a one-column component layout');
    assert.equal(layoutEvidence.textarea.editorFillRatio >= 0.9, true, 'XTextarea editor must use nearly the complete card width');
    assert.equal(layoutEvidence.textarea.verticalFlow, true, 'XTextarea label, editor and metadata must remain vertically ordered');
    assert.equal(layoutEvidence.textarea.parentId, 'testbench-form-fields');
    assert.equal(layoutEvidence.textarea.ownsStructuralSlot, false, 'fields recipe must live on a wrapper instead of the XTextarea host');
    assert.equal(layoutEvidence.actions.parentId, 'testbench-form-actions');
    assert.equal(layoutEvidence.actions.display, 'flex');
    assert.equal(layoutEvidence.actions.buttonWidthRatio < 0.5, true, 'action wrapper must not paint a full-width component-host button bar');
    assert.equal(layoutEvidence.actions.leafHasRecipeClass || layoutEvidence.actions.leafOwnsStructuralSlot, false);
    assert.equal(layoutEvidence.status.parentId, 'testbench-form-status');
    assert.equal(layoutEvidence.status.leafHasRecipeClass || layoutEvidence.status.leafOwnsStructuralSlot, false);
    assert.equal(layoutEvidence.introOverflowX, 'visible', 'column sections must not clip content in a horizontal scroll container');
    assert.equal(layoutEvidence.surfaceCount >= 5, true, 'document-flow workspace must expose all top-level test-bench surfaces');
    assert.equal(layoutEvidence.surfacesMonotonic, true, 'top-level document-flow surfaces must not overlap');
    assert.equal(layoutEvidence.minimumSurfaceGap >= 12, true, 'top-level document-flow surfaces must retain the framework gap');

    stage = 'xtextarea-public-contract';
    const textareaContract = await page.evaluateFunction(() => {
      const element = document.getElementById('testbench-textarea');
      const control = element && element.shadowRoot && element.shadowRoot.querySelector('textarea');
      if (!element || !control) return null;
      const attributeNames = [
        'name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'maxlength', 'minlength',
        'rows', 'label', 'busy', 'invalid', 'density', 'fill', 'submit-on-enter', 'submit-command',
        'syntax-highlight', 'highlight', 'line-numbering', 'lang', 'language'
      ];
      const methods = ['checkValidity', 'reportValidity', 'validate', 'reset', 'focus', 'snapshot'];
      const observed = Array.from(element.constructor.observedAttributes || []);
      return {
        localName: element.localName,
        attributes: Object.fromEntries(attributeNames.map((name) => [name, element.getAttribute(name)])),
        observed,
        slots: ['label', 'hint', 'error'].map((name) => ({
          name,
          present: Boolean(element.querySelector(`[slot="${name}"]`)),
          textLength: (element.querySelector(`[slot="${name}"]`)?.textContent || '').length
        })),
        methods: Object.fromEntries(methods.map((name) => [name, typeof element[name] === 'function'])),
        native: {
          required: control.required,
          disabled: control.disabled,
          readOnly: control.readOnly,
          maxLength: control.maxLength,
          minLength: control.minLength,
          rows: control.rows
        },
        counter: {
          text: element.shadowRoot.querySelector('#counter')?.textContent || '',
          role: element.shadowRoot.querySelector('#counter')?.getAttribute('role') || '',
          live: element.shadowRoot.querySelector('#counter')?.getAttribute('aria-live') || ''
        }
      };
    });
    assert.ok(textareaContract, 'RMT must render and hydrate x-textarea');
    assert.equal(textareaContract.localName, 'x-textarea');
    assert.equal(textareaContract.attributes.name, 'text');
    assert.equal(textareaContract.attributes.value, '');
    assert.equal(textareaContract.attributes.placeholder, 'Type text and press Enter to persist it');
    assert.equal(textareaContract.attributes.required !== null, true);
    assert.equal(textareaContract.attributes.disabled, null);
    assert.equal(textareaContract.attributes.readonly, null);
    assert.equal(textareaContract.attributes.maxlength, '4000');
    assert.equal(textareaContract.attributes.minlength, '1');
    assert.equal(textareaContract.attributes.rows, '10');
    assert.equal(textareaContract.attributes.label, 'Text content');
    assert.equal(textareaContract.attributes.busy, null);
    assert.equal(textareaContract.attributes.invalid, null);
    assert.equal(textareaContract.attributes.density, 'comfortable');
    assert.equal(textareaContract.attributes.fill !== null, true);
    assert.equal(textareaContract.attributes['submit-on-enter'] !== null, true);
    assert.equal(textareaContract.attributes['submit-command'], 'maraca.testbench.save');
    assert.equal(textareaContract.attributes['syntax-highlight'] !== null, true);
    assert.equal(textareaContract.attributes.highlight !== null, true);
    assert.equal(textareaContract.attributes['line-numbering'] !== null, true);
    assert.equal(textareaContract.attributes.lang, 'text');
    assert.equal(textareaContract.attributes.language, 'text');
    assert.equal(Object.keys(textareaContract.attributes).every((name) => textareaContract.observed.includes(name)), true, 'productive XTextarea must observe every public attribute');
    assert.equal(textareaContract.slots.every((slot) => slot.present && slot.textLength > 0), true, 'label, hint and error must be materialized as public slots');
    assert.equal(Object.values(textareaContract.methods).every(Boolean), true, 'all public XTextarea methods must exist');
    assert.deepEqual(textareaContract.native, { required: true, disabled: false, readOnly: false, maxLength: 4000, minLength: 1, rows: 10 });
    assert.deepEqual(textareaContract.counter, { text: '0/4000', role: 'status', live: 'polite' });

    stage = 'xtextarea-events-and-methods';
    const methodEvidence = await page.evaluateFunction(() => {
      const key = Symbol.for('xtend.catfood.textarea-probe');
      const element = document.getElementById('testbench-textarea');
      const probe = {
        counts: { changed: 0, invalid: 0, submit: 0, command: 0 },
        lastChanged: null,
        lastCommand: null,
        commands: []
      };
      element.addEventListener('textarea-changed', (event) => {
        probe.counts.changed += 1;
        probe.lastChanged = {
          length: event.detail.length,
          trimmedLength: event.detail.trimmedLength,
          empty: event.detail.empty,
          source: event.detail.source,
          highlighted: event.detail.highlighted,
          highlightLanguage: event.detail.highlightLanguage
        };
      });
      element.addEventListener('textarea-invalid', () => { probe.counts.invalid += 1; });
      element.addEventListener('textarea-submit', () => { probe.counts.submit += 1; });
      element.addEventListener('xtend-command', (event) => {
        probe.counts.command += 1;
        probe.lastCommand = {
          schema: event.detail.schema,
          sourceEvent: event.detail.source && event.detail.source.event,
          command: event.detail.command
        };
        probe.commands.push(probe.lastCommand);
      });
      globalThis[key] = probe;

      element.value = '';
      const beforeCheck = probe.counts.invalid;
      const checked = element.checkValidity();
      const checkInvalidDelta = probe.counts.invalid - beforeCheck;
      const beforeReport = probe.counts.invalid;
      const reported = element.reportValidity();
      const reportInvalidDelta = probe.counts.invalid - beforeReport;
      const beforeValidate = probe.counts.invalid;
      const validated = element.validate();
      const validateInvalidDelta = probe.counts.invalid - beforeValidate;
      return {
        checked,
        reported,
        validated,
        checkInvalidDelta,
        reportInvalidDelta,
        validateInvalidDelta
      };
    });
    assert.equal(methodEvidence.checked, false);
    assert.equal(methodEvidence.reported, false);
    assert.equal(methodEvidence.validated, false);
    assert.equal(methodEvidence.checkInvalidDelta, 1);
    assert.equal(methodEvidence.reportInvalidDelta, 1, 'reportValidity must emit exactly one textarea-invalid event');
    assert.equal(methodEvidence.validateInvalidDelta, 1);

    try {
      await page.waitForFunction(() => {
        const textarea = document.getElementById('testbench-textarea');
        const feedback = document.getElementById('testbench-feedback');
        const message = feedback && feedback.getAttribute('message') || '';
        return Boolean(textarea && textarea.hasAttribute('invalid')
          && feedback
          && feedback.getAttribute('tone') === 'danger'
          && feedback.getAttribute('type') === 'danger'
          && feedback.getAttribute('state') === 'danger'
          && message.trim().length > 0
          && feedback.textContent.includes(message));
      }, [], 'RMT textarea-invalid feedback materialization');
    } catch (error) {
      const diagnostic = await page.evaluateFunction(() => {
        const textarea = document.getElementById('testbench-textarea');
        const feedback = document.getElementById('testbench-feedback');
        const runtime = globalThis.XTendMaraca;
        const snapshot = runtime && typeof runtime.snapshot === 'function' ? runtime.snapshot() : null;
        const runtimeState = snapshot && snapshot.state || null;
        const orchestration = snapshot && snapshot.orchestration || null;
        return {
          textareaInvalid: Boolean(textarea && textarea.hasAttribute('invalid')),
          textareaAriaInvalid: textarea && textarea.shadowRoot?.querySelector('textarea')?.getAttribute('aria-invalid'),
          feedbackTone: feedback && feedback.getAttribute('tone'),
          feedbackMessagePresent: Boolean(feedback && (feedback.getAttribute('message') || '').trim()),
          eventCounts: globalThis[Symbol.for('xtend.catfood.textarea-probe')]?.counts || null,
          kernel: runtime && runtime.kernel || null,
          runtime: snapshot ? {
            phase: snapshot.phase,
            commitCount: snapshot.commitCount,
            stateCommitCount: snapshot.stateCommitCount,
            lastCommit: snapshot.lastCommit,
            editorState: runtimeState?.states?.['maraca.testbench.editor'] || null,
            editorSelector: runtimeState?.selectors?.['maraca.testbench.editor'] || null,
            schedulerFibers: orchestration?.fibers?.slice(-8) || [],
            diagnostics: snapshot.diagnostics || []
          } : null
        };
      });
      error.message = `${error.message} Redacted runtime diagnostic: ${JSON.stringify(diagnostic)}`;
      throw error;
    }
    const invalidFeedbackEvidence = await page.evaluateFunction(() => {
      const textarea = document.getElementById('testbench-textarea');
      const feedback = document.getElementById('testbench-feedback');
      return {
        textareaInvalid: textarea.hasAttribute('invalid'),
        tone: feedback.getAttribute('tone'),
        messagePresent: (feedback.getAttribute('message') || '').trim().length > 0,
        rendered: feedback.textContent.includes(feedback.getAttribute('message') || '')
      };
    });
    assert.deepEqual(invalidFeedbackEvidence, {
      textareaInvalid: true,
      tone: 'danger',
      messagePresent: true,
      rendered: true
    });

    const reducerRecoveryValue = 'valid-reducer-recovery';
    await page.evaluateFunction((value) => {
      const element = document.getElementById('testbench-textarea');
      const control = element.shadowRoot.querySelector('textarea');
      element.value = value;
      control.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText' }));
      return true;
    }, [reducerRecoveryValue]);
    await page.waitForFunction((value) => {
      const element = document.getElementById('testbench-textarea');
      return element.value === value && !element.hasAttribute('invalid');
    }, [reducerRecoveryValue], 'RMT textarea-changed invalid-state recovery');

    stage = 'rmt-xtextarea-state-controls';
    await clickRmtButton(page, 'testbench-readonly-on', { attribute: 'readonly', attributePresent: true, controlProperty: 'readOnly', controlValue: true }, 'RMT readonly on');
    await clickRmtButton(page, 'testbench-readonly-off', { attribute: 'readonly', attributePresent: false, controlProperty: 'readOnly', controlValue: false }, 'RMT readonly off');
    await clickRmtButton(page, 'testbench-busy-on', { attribute: 'busy', attributePresent: true, controlAttribute: 'aria-busy', controlAttributeValue: 'true' }, 'RMT busy on');
    await clickRmtButton(page, 'testbench-busy-off', { attribute: 'busy', attributePresent: false, controlAttribute: 'aria-busy', controlAttributeValue: 'false' }, 'RMT busy off');
    await clickRmtButton(page, 'testbench-disabled-on', { attribute: 'disabled', attributePresent: true, controlProperty: 'disabled', controlValue: true }, 'RMT disabled on');
    await clickRmtButton(page, 'testbench-disabled-off', { attribute: 'disabled', attributePresent: false, controlProperty: 'disabled', controlValue: false }, 'RMT disabled off');
    await clickRmtButton(page, 'testbench-density-compact', { attribute: 'density', attributeValue: 'compact' }, 'RMT density compact');
    await clickRmtButton(page, 'testbench-density-dense', { attribute: 'density', attributeValue: 'dense' }, 'RMT density dense');
    await clickRmtButton(page, 'testbench-density-comfortable', { attribute: 'density', attributeValue: 'comfortable' }, 'RMT density comfortable');
    await clickRmtButton(page, 'testbench-fill-off', { attribute: 'fill', attributePresent: false }, 'RMT fill off');
    await clickRmtButton(page, 'testbench-fill-on', { attribute: 'fill', attributePresent: true }, 'RMT fill on');
    await clickRmtButton(page, 'testbench-highlight-off', { allAbsent: ['syntax-highlight', 'highlight'] }, 'RMT highlight off');
    await clickRmtButton(page, 'testbench-highlight-on', { allPresent: ['syntax-highlight', 'highlight'] }, 'RMT highlight on');
    await clickRmtButton(page, 'testbench-lines-off', { attribute: 'line-numbering', attributePresent: false, lineNumbering: false }, 'RMT line numbers off');
    await clickRmtButton(page, 'testbench-lines-on', { attribute: 'line-numbering', attributePresent: true, lineNumbering: true }, 'RMT line numbers on');

    stage = 'rmt-xtextarea-component-commands';
    const resetProbeLength = await page.evaluateFunction(() => {
      const element = document.getElementById('testbench-textarea');
      element.value = 'component-command-reset-probe';
      return element.value.length;
    });
    assert.equal(resetProbeLength > 0, true);
    const resetCommand = await clickRmtComponentCommand(page, 'testbench-reset', 'reset');
    await page.waitForFunction(() => document.getElementById('testbench-textarea').value === '', [], 'RMT reset component command');
    const resetCounter = await page.evaluateFunction(() => document.getElementById('testbench-textarea').shadowRoot.querySelector('#counter').textContent);
    assert.equal(resetCounter, '0/4000');
    assert.equal(resetCommand.result, null);

    const focusCommand = await clickRmtComponentCommand(page, 'testbench-focus', 'focus');
    await page.waitForFunction(() => {
      const element = document.getElementById('testbench-textarea');
      const control = element && element.shadowRoot && element.shadowRoot.querySelector('textarea');
      return Boolean(control && element.shadowRoot.activeElement === control);
    }, [], 'RMT focus component command');
    assert.equal(focusCommand.result, null);

    const snapshotCommand = await clickRmtComponentCommand(page, 'testbench-snapshot', 'snapshot');
    assert.ok(snapshotCommand.result, 'RMT snapshot command must return the public XTextarea snapshot');
    assert.equal(snapshotCommand.result.schema, TEXTAREA_SNAPSHOT_SCHEMA);
    assert.equal(snapshotCommand.result.componentRef, 'x-textarea');
    assert.equal(snapshotCommand.result.valueLength, 0);
    assert.equal(snapshotCommand.result.lineNumbering, true);
    assert.equal(snapshotCommand.result.lineCount, 1);
    assert.equal(snapshotCommand.result.languageAlias, 'lang');
    componentCommandEvidence = {
      commands: [resetCommand.command, focusCommand.command, snapshotCommand.command],
      actionHistory: true,
      snapshotSchema: snapshotCommand.result.schema
    };

    stage = 'browser-pre-transport-block';
    const serviceRequestCountBeforeBlock = page.serviceRequests.length;
    browserBlockEvidence = await page.evaluateFunction(async (serviceId, marker) => {
      const facade = globalThis.XTendMaraca;
      if (!facade || typeof facade.dispatchCommand !== 'function') {
        return { blocked: false, code: 'xtend.catfood.public_command_bus_missing', verdict: null };
      }
      let code = null;
      try {
        const hostileText = `${marker}\u0000browser-tail`;
        await facade.dispatchCommand('maraca.testbench.updateDraft', { value: hostileText });
        const result = await facade.dispatchCommand('maraca.testbench.save', { text: hostileText });
        code = result && result.error && result.error.code || null;
      } catch (error) {
        code = error && error.code || null;
      }
      const runtime = facade.appServices;
      const snapshot = runtime.snapshot();
      const verdicts = snapshot.inputPolicyVerdicts || [];
      const verdict = verdicts[verdicts.length - 1] || null;
      return {
        blocked: code === 'xtend.maraca.app-service.input_policy_blocked',
        code,
        verdict: verdict ? {
          ok: verdict.ok,
          sanitized: verdict.sanitized,
          serviceId: verdict.serviceId,
          phase: verdict.phase,
          fields: (verdict.fields || []).map((field) => ({
            name: field.name,
            ok: field.ok,
            diagnostics: Array.isArray(field.diagnostics) ? field.diagnostics.slice() : []
          }))
        } : null
      };
    }, [SAVE_SERVICE_ID, hostileMarker]);
    await delay(250);
    await page.flushNetworkCapture();
    assert.equal(browserBlockEvidence.blocked, true, 'browser TrustBoundary must block NUL input');
    assert.equal(browserBlockEvidence.code, 'xtend.maraca.app-service.input_policy_blocked');
    assert.equal(browserBlockEvidence.verdict && browserBlockEvidence.verdict.ok, false);
    assert.equal(browserBlockEvidence.verdict && browserBlockEvidence.verdict.sanitized, false);
    assert.equal(browserBlockEvidence.verdict && browserBlockEvidence.verdict.phase, 'browser');
    assert.equal(browserBlockEvidence.verdict && browserBlockEvidence.verdict.serviceId, SAVE_SERVICE_ID);
    assert.equal(browserBlockEvidence.verdict && browserBlockEvidence.verdict.fields.length, 1);
    assert.equal(browserBlockEvidence.verdict && browserBlockEvidence.verdict.fields[0].name, 'text');
    assert.equal(browserBlockEvidence.verdict && browserBlockEvidence.verdict.fields[0].ok, false);
    assert.equal(browserBlockEvidence.verdict && browserBlockEvidence.verdict.fields[0].diagnostics.includes('xtend.security.text_sanitizer.control_character_refused'), true);
    assert.equal(page.serviceRequests.length, serviceRequestCountBeforeBlock, 'blocked browser input must not reach the HTTP transport');

    stage = 'browser-policy-mismatch-block';
    const serviceRequestCountBeforeMismatch = page.serviceRequests.length;
    policyMismatchEvidence = await page.evaluateFunction(async (serviceId) => {
      const module = await import('/dist/xtend.maraca.mjs');
      const runtime = globalThis.XTendMaraca && globalThis.XTendMaraca.appServices;
      const manifest = module.MARACA_APP_SERVICES && module.MARACA_APP_SERVICES.manifest;
      const service = manifest && Array.isArray(manifest.services)
        ? manifest.services.find((entry) => entry && entry.id === serviceId)
        : null;
      if (!runtime || !service) {
        return { blocked: false, code: 'xtend.catfood.policy_probe_unavailable', restored: false };
      }
      const hadPolicy = Object.prototype.hasOwnProperty.call(service, 'inputPolicy');
      const savedPolicy = service.inputPolicy;
      let removed = false;
      try {
        removed = delete service.inputPolicy;
      } catch (_) {}
      return {
        blocked: !removed && !Object.prototype.hasOwnProperty.call(runtime, 'registry'),
        code: 'xtend.maraca.mvc.raw-app-service-registry-hidden',
        restored: hadPolicy && service.inputPolicy === savedPolicy && Object.isFrozen(service)
      };
    }, [SAVE_SERVICE_ID]);
    await delay(250);
    await page.flushNetworkCapture();
    assert.equal(policyMismatchEvidence.blocked, true, 'managed Maraca must hide the raw AppService registry and freeze generated policy');
    assert.equal(policyMismatchEvidence.code, 'xtend.maraca.mvc.raw-app-service-registry-hidden');
    assert.equal(policyMismatchEvidence.restored, true, 'generated browser policy must remain immutable');
    assert.equal(page.serviceRequests.length, serviceRequestCountBeforeMismatch, 'policy encapsulation probe must not reach HTTP transport');

    async function waitForEditorDraft(expectedText, label) {
      try {
        await page.waitForFunction((expected) => {
          const orchestration = globalThis.__XTendMaracaOrchestration;
          const model = orchestration && orchestration.model;
          const state = model && typeof model.getState === 'function'
            ? model.getState('maraca.testbench.editor')
            : null;
          const element = document.getElementById('testbench-textarea');
          return Boolean(state && state.value === expected && element && element.value === expected);
        }, [expectedText], label, 20_000);
      } catch (error) {
        const diagnostic = await page.evaluateFunction((expected) => {
          const orchestration = globalThis.__XTendMaracaOrchestration;
          const model = orchestration && orchestration.model;
          const runtime = globalThis.XTendMaraca;
          const snapshot = runtime && typeof runtime.snapshot === 'function' ? runtime.snapshot() : null;
          const element = document.getElementById('testbench-textarea');
          const modelValue = model && typeof model.getState === 'function'
            ? model.getState('maraca.testbench.editor')?.value
            : null;
          const elementValue = element?.value ?? null;
          const renderModelValue = snapshot?.state?.model?.['maraca.testbench.editor']?.value ?? null;
          return {
            modelMatches: modelValue === expected,
            elementMatches: elementValue === expected,
            renderModelMatches: renderModelValue === expected,
            modelValueLength: typeof modelValue === 'string' ? modelValue.length : null,
            elementValueLength: typeof elementValue === 'string' ? elementValue.length : null,
            elementConnected: element?.isConnected === true,
            elementFocused: document.activeElement === element,
            shadowControlFocused: element?.shadowRoot?.activeElement === element?.shadowRoot?.querySelector('textarea'),
            eventCounts: globalThis[Symbol.for('xtend.catfood.textarea-probe')]?.counts || null,
            phase: snapshot?.phase || null,
            lastEvent: snapshot?.lastEvent || null,
            lastCommit: snapshot?.lastCommit || null,
            diagnostics: snapshot?.diagnostics || []
          };
        }, [expectedText]);
        await page.flushNetworkCapture();
        diagnostic.saveRequestCount = page.serviceRequests.filter((entry) => entry.serviceId === SAVE_SERVICE_ID).length;
        diagnostic.saveResponseCount = page.serviceResponses.filter((entry) => entry.serviceId === SAVE_SERVICE_ID && entry.ok).length;
        error.message = `${error.message} Redacted draft diagnostic: ${JSON.stringify(diagnostic)}`;
        throw error;
      }
    }

    stage = 'shift-enter';
    const firstLine = `catfood-${runToken}-first`;
    const secondLine = 'second-line';
    await page.evaluateFunction((text) => {
      const element = document.getElementById('testbench-textarea');
      const control = element.shadowRoot.querySelector('textarea');
      element.value = text;
      control.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText' }));
      control.focus();
      control.setSelectionRange(control.value.length, control.value.length);
      return true;
    }, [firstLine]);
    await waitForEditorDraft(firstLine, 'RMT first-line draft commit');
    const submitCountBeforeShift = await page.evaluateFunction(() => globalThis[Symbol.for('xtend.catfood.textarea-probe')].counts.submit);
    await page.dispatchEnter(true);
    await page.waitForFunction((prefix) => document.getElementById('testbench-textarea').value === `${prefix}\n`, [firstLine], 'Shift+Enter newline');
    await page.send('Input.insertText', { text: secondLine });
    const multilineText = `${firstLine}\n${secondLine}`;
    await page.waitForFunction((expected) => document.getElementById('testbench-textarea').value === expected, [multilineText], 'multiline input completion');
    await waitForEditorDraft(multilineText, 'RMT multiline draft commit');
    const shiftEvidence = await page.evaluateFunction((before) => {
      const probe = globalThis[Symbol.for('xtend.catfood.textarea-probe')];
      const element = document.getElementById('testbench-textarea');
      return {
        submitUnchanged: probe.counts.submit === before,
        lineCount: element.value.split('\n').length,
        counter: element.shadowRoot.querySelector('#counter').textContent,
        changed: probe.counts.changed,
        command: probe.counts.command,
        lastChanged: probe.lastChanged,
        lastCommand: probe.lastCommand
      };
    }, [submitCountBeforeShift]);
    assert.equal(shiftEvidence.submitUnchanged, true, 'Shift+Enter must not submit');
    assert.equal(shiftEvidence.lineCount, 2);
    assert.equal(shiftEvidence.counter, `${multilineText.length}/4000`);
    assert.equal(shiftEvidence.changed > 0, true);
    assert.equal(shiftEvidence.command > 0, true, 'textarea-changed must bridge to xtend-command');
    assert.equal(shiftEvidence.lastChanged.source, 'x-textarea');
    assert.equal(shiftEvidence.lastChanged.empty, false);
    assert.equal(shiftEvidence.lastChanged.highlightLanguage, 'text');
    assert.equal(shiftEvidence.lastCommand.schema, 'xtend.rmt.command.v1');
    assert.equal(shiftEvidence.lastCommand.sourceEvent, 'textarea-changed');

    async function submitCurrentTextarea(expectedText, ordinal) {
      const responseCount = page.serviceResponses.filter((entry) => entry.serviceId === SAVE_SERVICE_ID && entry.ok).length;
      const beforeSubmit = await page.evaluateFunction(() => {
        const probe = globalThis[Symbol.for('xtend.catfood.textarea-probe')];
        return {
          submitCount: probe.counts.submit,
          submitCommandCount: probe.commands.filter((entry) => entry.sourceEvent === 'textarea-submit').length
        };
      });
      await page.dispatchEnter(false);
      try {
        await waitUntil(async () => {
          await page.flushNetworkCapture();
          return page.serviceResponses.filter((entry) => entry.serviceId === SAVE_SERVICE_ID && entry.ok).length > responseCount;
        }, `UI AppService save ${ordinal}`, { timeoutMs: 20_000, intervalMs: 50 });
      } catch (error) {
        await page.flushNetworkCapture();
        const probe = await page.evaluateFunction(() => {
          const telemetry = globalThis[Symbol.for('xtend.catfood.textarea-probe')];
          const element = document.getElementById('testbench-textarea');
          const control = element && element.shadowRoot && element.shadowRoot.querySelector('textarea');
          return {
            submitCount: telemetry && telemetry.counts ? telemetry.counts.submit : null,
            submitCommandCount: telemetry && Array.isArray(telemetry.commands)
              ? telemetry.commands.filter((entry) => entry.sourceEvent === 'textarea-submit').length
              : null,
            hasValue: Boolean(element && element.value),
            controlFocused: Boolean(control && control === document.activeElement),
            shadowControlFocused: Boolean(element && element.shadowRoot && element.shadowRoot.activeElement === control),
            historyCount: document.querySelectorAll('[data-entry-id]').length
          };
        });
        const saveRequests = page.serviceRequests.filter((entry) => entry.serviceId === SAVE_SERVICE_ID);
        const saveResponses = page.serviceResponses.filter((entry) => entry.serviceId === SAVE_SERVICE_ID);
        const requestSummary = saveRequests.map((entry) => `${entry.envelopeSchema || 'no-schema'}:${entry.kind || 'no-kind'}:${entry.inputType}:${entry.textType}:${entry.textLength}`).join(',');
        const responseSummary = saveResponses.map((entry) => `${entry.status}:${entry.ok ? 'ok' : entry.errorCode || 'failed'}`).join(',');
        throw new Error(`${error.message} Diagnostics: requests=${requestSummary || 'none'}; responses=${responseSummary || 'none'}; captureFailures=${page.networkCaptureFailures}; submitCount=${probe.submitCount}; submitCommands=${probe.submitCommandCount}; hasValue=${probe.hasValue}; focused=${probe.controlFocused || probe.shadowControlFocused}; historyCount=${probe.historyCount}.`);
      }
      await page.waitForFunction((expected) => {
        const element = document.getElementById('testbench-textarea');
        const first = document.querySelector('[data-entry-id] .xtm-plain-text');
        return element && element.value === '' && first && first.textContent === expected;
      }, [expectedText], `RMT history update ${ordinal}`, 20_000);
      const afterSubmit = await page.evaluateFunction(() => {
        const probe = globalThis[Symbol.for('xtend.catfood.textarea-probe')];
        const submitCommands = probe.commands.filter((entry) => entry.sourceEvent === 'textarea-submit');
        return {
          submitCount: probe.counts.submit,
          submitCommandCount: submitCommands.length,
          lastSubmitCommand: submitCommands[submitCommands.length - 1] || null
        };
      });
      assert.equal(afterSubmit.submitCount, beforeSubmit.submitCount + 1, `Enter must emit exactly one textarea-submit for save ${ordinal}`);
      assert.equal(afterSubmit.submitCommandCount, beforeSubmit.submitCommandCount + 1, `Enter must emit exactly one submit xtend-command for save ${ordinal}`);
      assert.deepEqual(afterSubmit.lastSubmitCommand, {
        schema: 'xtend.rmt.command.v1',
        sourceEvent: 'textarea-submit',
        command: 'maraca.testbench.save'
      });
    }

    stage = 'ui-appservice-saves';
    savedTexts.push(multilineText);
    await submitCurrentTextarea(multilineText, 1);
    for (let index = 1; index < UI_SAVE_COUNT; index += 1) {
      const text = `catfood-${runToken}-${String(index).padStart(2, '0')}`;
      savedTexts.push(text);
      await page.evaluateFunction((nextText) => {
        const element = document.getElementById('testbench-textarea');
        const control = element.shadowRoot.querySelector('textarea');
        element.value = nextText;
        control.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText' }));
        control.focus();
        control.setSelectionRange(control.value.length, control.value.length);
        return true;
      }, [text]);
      await waitForEditorDraft(text, `RMT draft commit ${index + 1}`);
      await submitCurrentTextarea(text, index + 1);
    }
    await page.flushNetworkCapture();
    assert.equal(page.networkCaptureFailures, 0, 'CDP must capture every AppService response');

    stage = 'appservice-verdicts';
    const browserAppServiceSnapshot = await page.evaluateFunction(() => {
      const snapshot = globalThis.XTendMaraca && globalThis.XTendMaraca.appServices
        && globalThis.XTendMaraca.appServices.snapshot();
      if (!snapshot) return null;
      return {
        schema: snapshot.schema,
        status: snapshot.status,
        serviceCount: snapshot.serviceCount,
        verdicts: (snapshot.inputPolicyVerdicts || []).map((verdict) => ({
          schema: verdict.schema,
          ok: verdict.ok,
          sanitized: verdict.sanitized,
          serviceId: verdict.serviceId,
          phase: verdict.phase,
          fields: (verdict.fields || []).map((field) => ({
            name: field.name,
            ok: field.ok,
            sanitize: field.sanitize,
            diagnostics: Array.isArray(field.diagnostics) ? field.diagnostics.slice() : []
          }))
        }))
      };
    });
    assert.ok(browserAppServiceSnapshot, 'public Maraca AppService snapshot must exist');
    assert.equal(browserAppServiceSnapshot.status, 'ready');
    assert.equal(browserAppServiceSnapshot.serviceCount, 2);
    assert.equal(browserAppServiceSnapshot.verdicts.length >= UI_SAVE_COUNT, true);
    const browserVerdicts = browserAppServiceSnapshot.verdicts.slice(-UI_SAVE_COUNT);
    assert.equal(browserVerdicts.every((verdict) => verdict.ok === true
      && verdict.sanitized === true
      && verdict.phase === 'browser'
      && verdict.serviceId === SAVE_SERVICE_ID
      && verdict.fields.length === 1
      && verdict.fields[0].name === 'text'
      && verdict.fields[0].ok === true
      && verdict.fields[0].sanitize === 'text'
      && verdict.fields[0].diagnostics.length === 0), true, 'browser TrustBoundary verdicts must be positive and redacted');

    const saveResponses = page.serviceResponses.filter((entry) => entry.serviceId === SAVE_SERVICE_ID && entry.ok);
    assert.equal(saveResponses.length, UI_SAVE_COUNT, 'each UI Enter must invoke exactly one server AppService');
    assert.equal(saveResponses.every((entry) => entry.status === 200
      && entry.saved
      && entry.trustBoundary
      && entry.trustBoundary.ok
      && entry.trustBoundary.sanitized
      && entry.trustBoundary.phase === 'server'), true, 'server TrustBoundary must revalidate every UI save');

    stage = 'forged-server-request';
    const rowCountBeforeServerBlocks = countDatabaseRows(databasePath);
    const forgedNul = await postForgedSaveRequest(host.origin, { text: `${hostileMarker}\u0000tail` }, 'nul');
    const forgedResponse = { status: forgedNul.status };
    const forgedPayload = forgedNul.payload;
    assert.equal(forgedNul.status, 400, 'server must block forged NUL requests');
    assert.equal(Boolean(forgedPayload && forgedPayload.ok), false);
    assert.equal(forgedPayload && forgedPayload.error && forgedPayload.error.code, 'xtend.maraca.app-service.input_policy_blocked');
    assert.equal(forgedNul.body.includes(hostileMarker), false, 'server diagnostics must not echo hostile raw input');

    stage = 'server-text-validation';
    const forgedWhitespace = await postForgedSaveRequest(host.origin, { text: ' \t\n  ' }, 'whitespace');
    assert.equal(forgedWhitespace.status, 400, 'server must reject whitespace-only text after trim validation');
    assert.equal(Boolean(forgedWhitespace.payload && forgedWhitespace.payload.ok), false);
    assert.equal(forgedWhitespace.payload && forgedWhitespace.payload.error && forgedWhitespace.payload.error.code, 'xtend.maraca.app-service.invalid_request');

    const overlongMarker = `OVERLONG_${runToken}_`;
    const overlongText = `${overlongMarker}${'x'.repeat(4001 - overlongMarker.length)}`;
    assert.equal(overlongText.length, 4001);
    const forgedOverlong = await postForgedSaveRequest(host.origin, { text: overlongText }, 'overlong');
    assert.equal(forgedOverlong.status, 400, 'server must reject text longer than 4,000 characters');
    assert.equal(Boolean(forgedOverlong.payload && forgedOverlong.payload.ok), false);
    assert.equal(forgedOverlong.payload && forgedOverlong.payload.error && forgedOverlong.payload.error.code, 'xtend.maraca.app-service.invalid_request');
    assert.equal(forgedOverlong.body.includes(overlongMarker), false, 'server diagnostics must not echo overlong raw input');
    const rowCountAfterServerBlocks = countDatabaseRows(databasePath);
    assert.equal(rowCountBeforeServerBlocks, UI_SAVE_COUNT);
    assert.equal(rowCountAfterServerBlocks, rowCountBeforeServerBlocks, 'rejected server validation requests must not add SQLite rows');

    stage = 'host-restart';
    await host.stop();
    host = null;
    host = await startGeneratedHost(databasePath);
    await bootProductPage(page, host.origin);
    const initialRestartState = await page.evaluateFunction(() => ({
      entries: document.querySelectorAll('[data-entry-id]').length,
      emptyMessage: document.querySelector('[data-testid="history"]')?.textContent || ''
    }));
    assert.equal(initialRestartState.entries, 0, 'history must load only after the explicit Load command');
    assert.equal(initialRestartState.emptyMessage.includes('No persisted text loaded.'), true);

    stage = 'explicit-load-after-restart';
    const priorListResponses = page.serviceResponses.filter((entry) => entry.serviceId === LIST_SERVICE_ID && entry.ok).length;
    const loadClicked = await page.evaluateFunction(() => {
      const button = document.getElementById('testbench-load');
      if (!button || typeof button.click !== 'function') return false;
      button.click();
      return true;
    });
    assert.equal(loadClicked, true, 'RMT Load button must be actionable');
    await page.waitForFunction((limit) => document.querySelectorAll('[data-entry-id]').length === limit, [HISTORY_LIMIT], 'RMT repeater latest 20', 20_000);
    await waitUntil(async () => {
      await page.flushNetworkCapture();
      return page.serviceResponses.filter((entry) => entry.serviceId === LIST_SERVICE_ID && entry.ok).length > priorListResponses;
    }, 'list AppService response after restart', { timeoutMs: 20_000 });
    const renderedHistory = await page.evaluateFunction(() => Array.from(document.querySelectorAll('[data-entry-id]')).map((article) => {
      const text = article.querySelector('.xtm-plain-text');
      return {
        id: article.getAttribute('data-entry-id'),
        text: text ? text.textContent : null,
        textNodeOnly: Boolean(text && text.childNodes.length === 1 && text.firstChild.nodeType === Node.TEXT_NODE && text.children.length === 0)
      };
    }));
    const expectedLatest = savedTexts.slice(-HISTORY_LIMIT).reverse();
    assert.equal(renderedHistory.length, HISTORY_LIMIT);
    assert.equal(renderedHistory.every((entry, index) => entry.text === expectedLatest[index]), true, 'RMT repeater must render the latest 20 entries newest first');
    assert.equal(renderedHistory.every((entry) => entry.textNodeOnly), true, 'persisted content must render as text nodes only');
    assert.equal(renderedHistory.every((entry, index, entries) => index === 0 || Number(entries[index - 1].id) > Number(entry.id)), true, 'history ids must be newest first');

    stage = 'public-exposure';
    const exposure = await inspectPublicExposure(host.origin, hostileMarker, databasePath);

    stage = 'redacted-screenshot';
    const redacted = await page.evaluateFunction(() => {
      document.querySelectorAll('[data-entry-id] .xtm-plain-text').forEach((node) => {
        node.textContent = '[redacted persisted text]';
      });
      const textarea = document.getElementById('testbench-textarea');
      if (textarea) textarea.value = '';
      document.documentElement.dataset.catfoodEvidenceRedacted = 'true';
      return document.querySelectorAll('[data-entry-id] .xtm-plain-text').length;
    });
    assert.equal(redacted, HISTORY_LIMIT);
    screenshot = await page.screenshot();
    assert.equal(screenshot.length > 1_000, true, 'UI evidence screenshot must contain PNG data');
    assert.equal(screenshot.subarray(1, 4).toString('ascii'), 'PNG');
    fs.writeFileSync(screenshotPath, screenshot);

    stage = 'database-inspection';
    await host.stop();
    host = null;
    const databaseEvidence = inspectDatabase(databasePath, savedTexts);

    stage = 'evidence-write';
    passEvidence = {
      schema: EVIDENCE_SCHEMA,
      ok: true,
      status: 'passed',
      generatedAt: new Date().toISOString(),
      product: 'maraca-app-services-test-bench',
      runtime: {
        nodeMajor: Number(process.versions.node.split('.')[0]),
        dynamicLoopbackHost: true,
        generatedHostRestarted: true,
        chromiumCdp: true,
        externalBrowserDependency: false
      },
      xtextarea: {
        fullAttributeContract: true,
        slots: ['label', 'hint', 'error'],
        methods: ['checkValidity', 'reportValidity', 'validate', 'reset', 'focus', 'snapshot'],
        events: ['textarea-changed', 'textarea-invalid', 'textarea-submit', 'xtend-command'],
        reportValiditySingleInvalid: true,
        invalidFeedbackViaRmt: invalidFeedbackEvidence.textareaInvalid && invalidFeedbackEvidence.rendered,
        submitCommand: 'maraca.testbench.save',
        shiftEnterLineBreak: true,
        enterSubmit: true,
        rmtStateControls: 15,
        componentCommands: componentCommandEvidence
      },
      layout: {
        viewportWidth: layoutEvidence.viewportWidth,
        bodyMarginReset: layoutEvidence.bodyMargin === '0px',
        horizontalOverflow: layoutEvidence.horizontalOverflow,
        appShellDisplay: layoutEvidence.manager.display,
        headerFillRatio: layoutEvidence.header.fillRatio,
        textareaGridColumnCount: layoutEvidence.textarea.gridColumnCount,
        textareaEditorFillRatio: layoutEvidence.textarea.editorFillRatio,
        structuralSlotsOnWrappers: !layoutEvidence.textarea.ownsStructuralSlot
          && !layoutEvidence.actions.leafOwnsStructuralSlot
          && !layoutEvidence.status.leafOwnsStructuralSlot,
        minimumSurfaceGap: layoutEvidence.minimumSurfaceGap,
        surfacesMonotonic: layoutEvidence.surfacesMonotonic
      },
      appServices: {
        saveService: SAVE_SERVICE_ID,
        listService: LIST_SERVICE_ID,
        uiSaveCount: UI_SAVE_COUNT,
        browserVerdictCount: browserVerdicts.length,
        browserVerdictsPositive: true,
        serverVerdictCount: saveResponses.length,
        serverVerdictsPositive: true,
        forgedNulStatus: forgedResponse.status,
        forgedNulCode: forgedPayload.error.code,
        whitespaceOnlyStatus: forgedWhitespace.status,
        whitespaceOnlyCode: forgedWhitespace.payload.error.code,
        overMaxLengthStatus: forgedOverlong.status,
        overMaxLengthCode: forgedOverlong.payload.error.code,
        rejectedValidationRowsUnchanged: rowCountAfterServerBlocks === rowCountBeforeServerBlocks,
        hostileInputEchoed: false
      },
      trustBoundary: {
        browserPreTransport: true,
        serverRevalidation: true,
        browserPolicyEncapsulation: policyMismatchEvidence.blocked === true
      },
      persistence: {
        database: 'node:sqlite',
        strictTable: databaseEvidence.strict,
        userVersion: databaseEvidence.userVersion,
        rowCount: databaseEvidence.rowCount,
        normalizedPlainText: databaseEvidence.normalizedPlainText,
        restartRecovered: true,
        explicitLoadAfterRestart: true,
        visibleEntries: renderedHistory.length,
        renderedLatestCount: renderedHistory.length,
        textNodeRendering: true
      },
      provenance: {
        manualControllerCount: 0
      },
      exposure,
      artifacts: {
        evidence: path.basename(evidencePath),
        screenshot: path.basename(screenshotPath),
        screenshotTextRedacted: true
      },
      redaction: {
        rawTextIncluded: false,
        hostileInputIncluded: false,
        databasePathIncluded: false,
        environmentIncluded: false,
        secretsIncluded: false
      }
    };
    const serializedEvidence = writeRedactedEvidence(passEvidence);
    assert.equal(serializedEvidence.includes(runToken), false, 'evidence JSON must omit raw test text');
    assert.equal(serializedEvidence.includes(hostileMarker), false, 'evidence JSON must omit hostile raw text');
    assert.equal(serializedEvidence.includes(databasePath), false, 'evidence JSON must omit the database path');
  } catch (error) {
    if (!screenshot && browser && browser.page) {
      try {
        await browser.page.evaluateFunction(() => {
          document.querySelectorAll('.xtm-plain-text').forEach((node) => { node.textContent = '[redacted]'; });
          const textarea = document.getElementById('testbench-textarea');
          if (textarea) textarea.value = '';
          return true;
        });
        screenshot = await browser.page.screenshot();
        if (screenshot.length > 1_000) fs.writeFileSync(screenshotPath, screenshot);
      } catch (_) {}
    }
    const failedEvidence = {
      schema: EVIDENCE_SCHEMA,
      ok: false,
      status: 'failed',
      generatedAt: new Date().toISOString(),
      product: 'maraca-app-services-test-bench',
      failure: { stage, code: safeFailureCode(error) },
      artifacts: {
        evidence: path.basename(evidencePath),
        screenshot: screenshot && screenshot.length > 1_000 ? path.basename(screenshotPath) : null,
        screenshotTextRedacted: true
      },
      redaction: {
        rawTextIncluded: false,
        hostileInputIncluded: false,
        databasePathIncluded: false,
        environmentIncluded: false,
        secretsIncluded: false
      }
    };
    const serializedEvidence = writeRedactedEvidence(failedEvidence);
    assert.equal(serializedEvidence.includes(runToken), false);
    assert.equal(serializedEvidence.includes(hostileMarker), false);
    assert.equal(serializedEvidence.includes(databasePath), false);
    throw error;
  } finally {
    if (host) await host.stop().catch(() => {});
    if (browser) await browser.stop().catch(() => {});
    if (temporaryRoot.startsWith(`${os.tmpdir()}${path.sep}`)) {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
  }

  assert.equal(passEvidence && passEvidence.schema, EVIDENCE_SCHEMA);
  assert.equal(passEvidence && passEvidence.status, 'passed');
  assert.equal(fs.existsSync(evidencePath), true);
  assert.equal(fs.existsSync(screenshotPath), true);
});

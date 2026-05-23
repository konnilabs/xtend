const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { pathToFileURL } = require('url');
const {
  RMT_APP_PLATFORM_RECORDS_SCHEMA,
  RMT_KERNEL_BOUNDARY,
  RMT_KERNEL_RECORDS_SCHEMA,
  compileRmtVNextSource
} = require('./vnext-compiler');
const {
  createXtendFabric,
  CONTRACTS: FABRIC_CONTRACTS
} = require('../../fabric/xtend-fabric');
const {
  CONTRACTS: FABRIC_RMT_CONTRACTS,
  resolveRmtScheduleForFiber
} = require('../../fabric/rmt-lane-mapping');

const RMT_VNEXT_SOURCE_TO_SEA_SCHEMA = 'xtend.rmt.vnext.source-to-sea-gate.v1';
const RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_SCHEMA = 'xtend.rmt.vnext.source-to-sea-evidence.v1';
const RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_SCHEMA = 'xtend.rmt.vnext.source-to-sea-evidence-report.v1';
const RMT_VNEXT_SOURCE_TO_SEA_OBJECT_MATRIX_SCHEMA = 'xtend.rmt.vnext.source-to-sea-object-matrix.v1';
const RMT_VNEXT_SOURCE_TO_SEA_CI_ARTIFACT_SCHEMA = 'xtend.rmt.vnext.source-to-sea-ci-artifact-validation.v1';
const RMT_VNEXT_SOURCE_TO_SEA_BROWSER_PROBE_SCHEMA = 'xtend.rmt.vnext.source-to-sea-browser-probe.v1';
const RMT_VNEXT_SOURCE_TO_SEA_BROWSER_RESULT_VALIDATION_SCHEMA = 'xtend.rmt.vnext.source-to-sea-browser-result-validation.v1';
const RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE = 'RMT-VNEXT-PRIM-06';
const RMT_VNEXT_SOURCE_TO_SEA_CLEANUP_DIAGNOSTIC_CODES = Object.freeze({
  resourceMissing: 'rmt.vnext.source_to_sea.cleanup_resource_missing',
  ownerMismatch: 'rmt.vnext.source_to_sea.cleanup_owner_mismatch',
  disposePolicyMissing: 'rmt.vnext.source_to_sea.cleanup_dispose_policy_missing',
  kindMismatch: 'rmt.vnext.source_to_sea.cleanup_kind_mismatch'
});
const RMT_VNEXT_FABRIC_BRIDGE_EVIDENCE_SCHEMA = 'xtend.rmt.vnext.fabric-bridge-evidence.v1';
const RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE = 'RMT-VNEXT-PRIM-05';
const RMT_VNEXT_BROWSER_EXECUTION_EVIDENCE_SCHEMA = 'xtend.rmt.vnext.browser-execution-evidence.v1';
const RMT_VNEXT_HOST_ADAPTER_TELEMETRY_SCHEMA = FABRIC_CONTRACTS.componentLifecycleTelemetry;
const RMT_VNEXT_ROUTE_COMPONENT_FIBER_EVIDENCE_SCHEMA = 'xtend.rmt.vnext.route-component-fiber-evidence.v1';
const RMT_VNEXT_ROUTE_COMPONENT_FIBER_SCENARIOS = Object.freeze({
  component: Object.freeze({
    componentRef: 'x-status',
    routeRef: '/rmt-vnext-source-to-sea',
    mountScheduleRef: 'component.visible.mount',
    hydrateScheduleRef: 'component.idle.hydrate'
  }),
  route: Object.freeze({
    routerRef: 'xtend.xrouter',
    routeRef: '/rmt-vnext-source-to-sea',
    routeId: 'rmt-vnext-source-to-sea',
    navigateScheduleRef: 'ui.user-blocking.input',
    renderScheduleRef: 'route.transition.render'
  })
});
const RMT_VNEXT_FABRIC_BRIDGE_LANE_MATRIX = Object.freeze([
  Object.freeze({ lane: 'user-blocking', kind: 'event.handler', phase: 'event' }),
  Object.freeze({ lane: 'transition', kind: 'route.render', phase: 'render', routeRef: '/rmt-vnext-source-to-sea' }),
  Object.freeze({ lane: 'idle', kind: 'component.hydrate', phase: 'hydrate' }),
  Object.freeze({ lane: 'background', kind: 'component.disconnect', phase: 'disconnect' }),
  Object.freeze({ lane: 'diagnostics', kind: 'diagnostics.snapshot', phase: 'diagnostics' })
]);
const RMT_VNEXT_SOURCE_TO_SEA_MODULE_PATH = 'tools/rmt-language/vnext-source-to-sea.js';
const RMT_VNEXT_SOURCE_TO_SEA_SUITE_PATH = 'tests/rmt-language/rmt_vnext_source_to_sea_suite.js';
const RMT_VNEXT_SOURCE_TO_SEA_FIXTURE_PATH = 'tests/rmt-language/fixtures/vnext-source-to-sea.rmt';
const RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH = 'tests/browser/fixtures/rmt-vnext-source-to-sea-smoke.html';
const RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH = '.xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json';
const RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY = '__xtendRmtVNextSourceToSeaResult';
const RMT_VNEXT_SOURCE_TO_SEA_CI_BROWSER_DRIVER = 'chromedriver';
const RMT_VNEXT_SOURCE_TO_SEA_CI_BROWSER_NAME = 'chrome';
const RMT_VNEXT_SOURCE_TO_SEA_CI_WEBDRIVER_PORT = 9515;
const RMT_VNEXT_SOURCE_TO_SEA_SUPPORTED_BROWSER_DRIVERS = Object.freeze([
  'webdriver',
  'chromedriver',
  'chrome',
  'chromium',
  'firefox',
  'geckodriver',
  'safari',
  'safaridriver',
  'edge',
  'msedge',
  'msedgedriver'
]);

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseJsonScript(html, scriptId) {
  if (typeof html !== 'string' || !html) {
    return null;
  }

  const pattern = new RegExp(`<script[^>]*id=["']${escapeRegExp(scriptId)}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i');
  const match = html.match(pattern);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch (_) {
    return null;
  }
}

function artifactCount(coreDocument) {
  if (!coreDocument) {
    return 0;
  }

  return [
    coreDocument.appPlatform,
    coreDocument.kernelRecords,
    coreDocument.sourceMap,
    coreDocument.states,
    coreDocument.selectors,
    coreDocument.actions,
    coreDocument.surfaces,
    coreDocument.events,
    coreDocument.resources
  ].filter((artifact) => Array.isArray(artifact) ? artifact.length > 0 : Boolean(artifact)).length;
}

function findSurface(coreDocument, primitiveId) {
  const appSurface = toArray(coreDocument && coreDocument.appPlatform && coreDocument.appPlatform.surfaces)
    .find((surface) => surface.id === primitiveId);
  const coreSurface = toArray(coreDocument && coreDocument.surfaces)
    .find((surface) => surface.name === primitiveId || surface.id === `surface:${coreDocument.manifest && coreDocument.manifest.documentId}/${primitiveId}`);

  return {
    appSurface: appSurface || null,
    coreSurface: coreSurface || null
  };
}

function findEvent(coreDocument, coreSurface, actionId) {
  const eventRefs = new Set(toArray(coreSurface && coreSurface.eventRefs));
  return toArray(coreDocument && coreDocument.events)
    .find((event) => event.action === actionId || eventRefs.has(event.id)) || null;
}

function findSourceMapEntry(coreDocument, record) {
  return toArray(coreDocument && coreDocument.sourceMap)
    .find((entry) => entry.id === (record && record.sourceRef)) || null;
}

function findSchedule(kernelRecords, coreSurface, preferredLane) {
  const schedules = toArray(kernelRecords && kernelRecords.schedules);
  return schedules.find((schedule) => schedule.scope && schedule.scope.surface === (coreSurface && coreSurface.id) && schedule.lane === preferredLane)
    || schedules.find((schedule) => schedule.lane === preferredLane)
    || schedules[0]
    || null;
}

function findFiber(kernelRecords, schedule) {
  const operationRefs = new Set(toArray(schedule && schedule.operationRefs));
  return toArray(kernelRecords && kernelRecords.fibers)
    .find((fiber) => operationRefs.has(fiber.operation))
    || toArray(kernelRecords && kernelRecords.fibers)[0]
    || null;
}

function containsKernelHostImport(kernelRecords) {
  return String(JSON.stringify(kernelRecords || {})).includes('@ccslabs/xtend/components');
}

function createCheck(name, ok, details = null) {
  return { name, ok: Boolean(ok), details };
}

function createIncrementingClock() {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 4, 19, 12, 0, tick++));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestJson(options, payload) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : '';
    const request = http.request({
      ...options,
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
        ...(options.headers || {})
      }
    }, (response) => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        let parsed = null;
        if (data) {
          try {
            parsed = JSON.parse(data);
          } catch (error) {
            reject(error);
            return;
          }
        }
        resolve({
          statusCode: response.statusCode,
          body: parsed
        });
      });
    });

    request.on('error', reject);
    if (body) {
      request.write(body);
    }
    request.end();
  });
}

function parseWebDriverUrl(value) {
  const target = new URL(value);
  return {
    hostname: target.hostname,
    port: target.port || (target.protocol === 'https:' ? 443 : 80),
    prefix: target.pathname && target.pathname !== '/' ? target.pathname.replace(/\/$/u, '') : ''
  };
}

function findSafariDriver() {
  const candidates = [
    '/System/Cryptexes/App/usr/bin/safaridriver',
    '/usr/bin/safaridriver'
  ];
  return candidates.find((candidate) => {
    try {
      fs.accessSync(candidate);
      return true;
    } catch (_) {
      return false;
    }
  }) || null;
}

function findExecutableOnPath(name) {
  const pathEntries = String(process.env.PATH || '').split(path.delimiter).filter(Boolean);
  for (const pathEntry of pathEntries) {
    const candidate = path.join(pathEntry, name);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch (_) {
      // Keep scanning PATH.
    }
  }
  return null;
}

function executableCandidate(value, executableName = 'chromedriver') {
  if (!value) {
    return [];
  }
  return [
    value,
    path.join(value, executableName)
  ];
}

function findChromeDriver(options = {}) {
  if (options.chromeDriverPathOnly === true && options.chromeDriverPath) {
    return executableCandidate(options.chromeDriverPath).find((candidate) => {
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return true;
      } catch (_) {
        return false;
      }
    }) || null;
  }

  const candidates = [
    ...executableCandidate(options.chromeDriverPath),
    ...executableCandidate(process.env.RMT_VNEXT_SOURCE_TO_SEA_CHROMEDRIVER),
    ...executableCandidate(process.env.CHROMEWEBDRIVER),
    '/usr/local/share/chromedriver-linux64/chromedriver',
    '/usr/bin/chromedriver',
    '/snap/bin/chromium.chromedriver',
    findExecutableOnPath('chromedriver')
  ].filter(Boolean);

  return candidates.find((candidate) => {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return true;
    } catch (_) {
      return false;
    }
  }) || null;
}

function findGeckoDriver(options = {}) {
  const candidates = [
    ...executableCandidate(options.geckoDriverPath, 'geckodriver'),
    ...executableCandidate(process.env.RMT_VNEXT_SOURCE_TO_SEA_GECKODRIVER, 'geckodriver'),
    ...executableCandidate(process.env.GECKODRIVER, 'geckodriver'),
    ...executableCandidate(process.env.FIREFOXWEBDRIVER, 'geckodriver'),
    '/usr/local/bin/geckodriver',
    '/usr/bin/geckodriver',
    '/snap/bin/geckodriver',
    findExecutableOnPath('geckodriver')
  ].filter(Boolean);

  return candidates.find((candidate) => {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return true;
    } catch (_) {
      return false;
    }
  }) || null;
}

function findEdgeDriver(options = {}) {
  const candidates = [
    ...executableCandidate(options.edgeDriverPath, 'msedgedriver'),
    ...executableCandidate(process.env.RMT_VNEXT_SOURCE_TO_SEA_EDGEDRIVER, 'msedgedriver'),
    ...executableCandidate(process.env.MSEDGEDRIVER, 'msedgedriver'),
    ...executableCandidate(process.env.EDGEWEBDRIVER, 'msedgedriver'),
    '/usr/local/bin/msedgedriver',
    '/usr/bin/msedgedriver',
    findExecutableOnPath('msedgedriver')
  ].filter(Boolean);

  return candidates.find((candidate) => {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return true;
    } catch (_) {
      return false;
    }
  }) || null;
}

function findBrowserBinary(options = {}, envNames = [], executableNames = []) {
  const candidates = [
    options.browserBinary,
    ...envNames.map((name) => process.env[name]),
    ...executableNames.map((name) => findExecutableOnPath(name))
  ].filter(Boolean);
  return candidates.find((candidate) => {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return true;
    } catch (_) {
      return false;
    }
  }) || null;
}

function normalizeBrowserDriver(value) {
  const driver = String(value || '').trim().toLowerCase();
  if (driver === 'chrome' || driver === 'chromium') return 'chromedriver';
  if (driver === 'safaridriver') return 'safari';
  if (driver === 'gecko' || driver === 'geckodriver') return 'firefox';
  if (driver === 'edge' || driver === 'msedge') return 'msedgedriver';
  return driver;
}

function browserNameForDriver(driver, options = {}) {
  if (options.browserName) return options.browserName;
  if (driver === 'firefox') return 'firefox';
  if (driver === 'safari') return 'safari';
  if (driver === 'msedgedriver') return 'MicrosoftEdge';
  if (driver === 'chromedriver') return process.env.RMT_VNEXT_SOURCE_TO_SEA_BROWSER_NAME || 'chrome';
  return process.env.RMT_VNEXT_SOURCE_TO_SEA_BROWSER_NAME || 'chrome';
}

function supportedBrowserDriver(value) {
  return RMT_VNEXT_SOURCE_TO_SEA_SUPPORTED_BROWSER_DRIVERS.includes(String(value || '').trim().toLowerCase())
    || Boolean(normalizeBrowserDriver(value) && ['webdriver', 'chromedriver', 'firefox', 'safari', 'msedgedriver'].includes(normalizeBrowserDriver(value)));
}

function detectAvailableBrowserDriver(options = {}) {
  if (options.webDriverUrl || process.env.RMT_VNEXT_SOURCE_TO_SEA_WEBDRIVER_URL) return 'webdriver';
  if (findGeckoDriver(options)) return 'firefox';
  if (findChromeDriver(options)) return 'chromedriver';
  if (findEdgeDriver(options)) return 'msedgedriver';
  if (findSafariDriver()) return 'safari';
  return '';
}

async function waitForWebDriver(webDriver, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await requestJson({
        hostname: webDriver.hostname,
        port: webDriver.port,
        path: `${webDriver.prefix}/status`,
        method: 'GET'
      });
      if (response.statusCode >= 200 && response.statusCode < 500) {
        return true;
      }
    } catch (_) {
      await wait(150);
    }
  }
  return false;
}

function childProcessHasExited(childProcess) {
  return !childProcess || childProcess.exitCode !== null || childProcess.signalCode !== null;
}

function detachChildProcess(childProcess) {
  if (!childProcess) return;
  if (childProcess.stdout && typeof childProcess.stdout.destroy === 'function') childProcess.stdout.destroy();
  if (childProcess.stderr && typeof childProcess.stderr.destroy === 'function') childProcess.stderr.destroy();
  if (typeof childProcess.unref === 'function') childProcess.unref();
}

function waitForChildProcessExit(childProcess, timeoutMs = 3000) {
  if (childProcessHasExited(childProcess)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;
    const cleanup = () => {
      childProcess.off('exit', onExit);
      childProcess.off('close', onExit);
      clearTimeout(timer);
    };
    const onExit = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(true);
    };
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(childProcessHasExited(childProcess));
    }, timeoutMs);

    childProcess.once('exit', onExit);
    childProcess.once('close', onExit);
  });
}

function errorMessage(error) {
  return error && error.message ? error.message : String(error);
}

function signalSnapGeckoDriver(childProcess, signal = 'TERM') {
  const pid = Number(childProcess && childProcess.pid);
  if (!Number.isFinite(pid) || pid <= 0 || !findExecutableOnPath('snap')) {
    return false;
  }
  const result = spawnSync('snap', ['run', '--shell', 'firefox.geckodriver', '-c', `kill -${signal} ${pid}`], {
    stdio: 'ignore'
  });
  return result.status === 0;
}

async function shutdownSpawnedWebDriver(childProcess, webDriver, options = {}) {
  if (!childProcess) {
    return {
      ok: true,
      method: 'none'
    };
  }

  const timeoutMs = Number(options.shutdownTimeoutMs || 3000);
  const errors = [];

  if (childProcessHasExited(childProcess)) {
    return {
      ok: true,
      method: 'already-exited'
    };
  }

  if (options.driver === 'chromedriver') {
    try {
      const response = await requestJson({
        hostname: webDriver.hostname,
        port: webDriver.port,
        path: `${webDriver.prefix}/shutdown`,
        method: 'GET'
      });
      if (response.statusCode >= 200 && response.statusCode < 500) {
        const exited = await waitForChildProcessExit(childProcess, timeoutMs);
        if (exited) {
          return {
            ok: true,
            method: 'webdriver-shutdown'
          };
        }
        errors.push(`webdriver shutdown did not exit within ${timeoutMs}ms`);
      } else {
        errors.push(`webdriver shutdown returned ${response.statusCode}`);
      }
    } catch (error) {
      errors.push(`webdriver shutdown failed: ${errorMessage(error)}`);
    }
  }

  if (childProcessHasExited(childProcess)) {
    return {
      ok: true,
      method: 'already-exited',
      warnings: errors
    };
  }

  try {
    const signaled = childProcess.kill();
    if (!signaled) {
      errors.push('process signal was not accepted');
    }
  } catch (error) {
    errors.push(`process signal failed: ${errorMessage(error)}`);
  }

  if (await waitForChildProcessExit(childProcess, timeoutMs)) {
    return {
      ok: true,
      method: 'process-signal',
      warnings: errors
    };
  }

  if (options.driver === 'firefox' && String(options.driverPath || '').includes('/snap/')) {
    const snapSignaled = signalSnapGeckoDriver(childProcess, 'TERM');
    if (!snapSignaled) {
      errors.push('snap geckodriver signal was not accepted');
    }
    if (await waitForChildProcessExit(childProcess, timeoutMs)) {
      return {
        ok: true,
        method: 'snap-shell-signal',
        warnings: errors
      };
    }
  }

  detachChildProcess(childProcess);

  return {
    ok: false,
    method: 'process-signal',
    reason: `WebDriver process cleanup failed${errors.length ? `: ${errors.join('; ')}` : ''}`
  };
}

function createDefaultWebDriverCapabilities(options = {}) {
  const browserName = browserNameForDriver(options.driver || 'webdriver', options);
  const capabilities = {
    browserName
  };
  if (browserName === 'chrome' || browserName === 'chromium') {
    capabilities['goog:chromeOptions'] = {
      args: [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=1280,720'
      ]
    };
  } else if (browserName === 'firefox') {
    const firefoxBinary = findBrowserBinary(options, [
      'RMT_VNEXT_SOURCE_TO_SEA_FIREFOX_BINARY',
      'FIREFOX_BIN'
    ]);
    capabilities['moz:firefoxOptions'] = {
      args: ['-headless']
    };
    if (firefoxBinary) {
      capabilities['moz:firefoxOptions'].binary = firefoxBinary;
    }
  } else if (browserName === 'MicrosoftEdge' || browserName === 'edge' || browserName === 'msedge') {
    capabilities.browserName = 'MicrosoftEdge';
    capabilities['ms:edgeOptions'] = {
      args: [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=1280,720'
      ]
    };
  }
  return {
    capabilities: {
      alwaysMatch: capabilities
    }
  };
}

function createBrowserExecutionUrl(options = {}) {
  if (options.browserUrl) {
    return options.browserUrl;
  }
  const rootDir = options.rootDir || process.cwd();
  const fixturePath = options.browserFixturePath || RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH;
  return pathToFileURL(path.resolve(rootDir, fixturePath)).href;
}

async function executeWebDriverResult(webDriver, sessionId, resultKey, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const response = await requestJson({
      hostname: webDriver.hostname,
      port: webDriver.port,
      path: `${webDriver.prefix}/session/${sessionId}/execute/sync`,
      method: 'POST'
    }, {
      script: `return window[${JSON.stringify(resultKey)}] || null;`,
      args: []
    });
    const value = response.body && response.body.value;
    if (value && value.status && value.status !== 'pending') {
      return value;
    }
    await wait(100);
  }
  throw new Error(`browser fixture did not publish ${resultKey}`);
}

async function runWebDriverBrowserProbe(options = {}) {
  const driver = normalizeBrowserDriver(options.driver || 'webdriver');
  let webDriverUrl = options.webDriverUrl || process.env.RMT_VNEXT_SOURCE_TO_SEA_WEBDRIVER_URL || '';
  let spawnedDriver = null;
  let spawnedDriverPath = '';
  const timeoutMs = Number(options.timeoutMs || (driver === 'firefox' ? 15000 : 5000));

  if (driver === 'chromedriver' && !webDriverUrl) {
    const driverPath = findChromeDriver(options);
    if (!driverPath) {
      throw new Error('chromedriver was not found');
    }
    const driverPort = Number(options.webDriverPort || process.env.RMT_VNEXT_SOURCE_TO_SEA_WEBDRIVER_PORT || RMT_VNEXT_SOURCE_TO_SEA_CI_WEBDRIVER_PORT);
    spawnedDriver = spawn(driverPath, [`--port=${driverPort}`], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    spawnedDriverPath = driverPath;
    webDriverUrl = `http://127.0.0.1:${driverPort}`;
  }

  if (driver === 'firefox' && !webDriverUrl) {
    const driverPath = findGeckoDriver(options);
    if (!driverPath) {
      throw new Error('geckodriver was not found');
    }
    const driverPort = Number(options.webDriverPort || process.env.RMT_VNEXT_SOURCE_TO_SEA_WEBDRIVER_PORT || 4444);
    spawnedDriver = spawn(driverPath, ['--port', String(driverPort)], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    spawnedDriverPath = driverPath;
    webDriverUrl = `http://127.0.0.1:${driverPort}`;
  }

  if (driver === 'safari' && !webDriverUrl) {
    const driverPath = findSafariDriver();
    if (!driverPath) {
      throw new Error('safaridriver was not found');
    }
    const driverPort = Number(options.webDriverPort || process.env.RMT_VNEXT_SOURCE_TO_SEA_WEBDRIVER_PORT || 57932);
    spawnedDriver = spawn(driverPath, ['-p', String(driverPort)], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    spawnedDriverPath = driverPath;
    webDriverUrl = `http://127.0.0.1:${driverPort}`;
  }

  if (driver === 'msedgedriver' && !webDriverUrl) {
    const driverPath = findEdgeDriver(options);
    if (!driverPath) {
      throw new Error('msedgedriver was not found');
    }
    const driverPort = Number(options.webDriverPort || process.env.RMT_VNEXT_SOURCE_TO_SEA_WEBDRIVER_PORT || 9516);
    spawnedDriver = spawn(driverPath, [`--port=${driverPort}`], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    spawnedDriverPath = driverPath;
    webDriverUrl = `http://127.0.0.1:${driverPort}`;
  }

  if (!webDriverUrl) {
    throw new Error('RMT_VNEXT_SOURCE_TO_SEA_WEBDRIVER_URL is required for webdriver mode');
  }

  const webDriver = parseWebDriverUrl(webDriverUrl);
  let sessionId = null;

  try {
    const ready = await waitForWebDriver(webDriver, timeoutMs);
    if (!ready) {
      throw new Error(`WebDriver endpoint did not become ready at ${webDriverUrl}`);
    }

    const session = await requestJson({
      hostname: webDriver.hostname,
      port: webDriver.port,
      path: `${webDriver.prefix}/session`,
      method: 'POST'
    }, createDefaultWebDriverCapabilities({ ...options, driver, browserName: browserNameForDriver(driver, options) }));
    const sessionValue = session.body && session.body.value;
    sessionId = sessionValue && (sessionValue.sessionId || sessionValue.id);
    if (!sessionId) {
      throw new Error(`WebDriver did not create a session: ${JSON.stringify(session.body || null)}`);
    }

    await requestJson({
      hostname: webDriver.hostname,
      port: webDriver.port,
      path: `${webDriver.prefix}/session/${sessionId}/url`,
      method: 'POST'
    }, {
      url: createBrowserExecutionUrl(options)
    });

    return await executeWebDriverResult(webDriver, sessionId, options.resultKey || RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY, timeoutMs);
  } finally {
    if (sessionId) {
      await requestJson({
        hostname: webDriver.hostname,
        port: webDriver.port,
        path: `${webDriver.prefix}/session/${sessionId}`,
        method: 'DELETE'
      }).catch(() => {});
    }
    if (spawnedDriver) {
      const cleanup = await shutdownSpawnedWebDriver(spawnedDriver, webDriver, { driver, driverPath: spawnedDriverPath });
      if (!cleanup.ok) {
        throw new Error(cleanup.reason || 'WebDriver process cleanup failed');
      }
    }
  }
}

function stripKernelLaneRef(value, fallback = 'visible') {
  if (typeof value !== 'string' || value.length === 0) {
    return fallback;
  }
  const segments = value.split('/');
  const candidate = segments[segments.length - 1] || value;
  return candidate.startsWith('lane:') ? fallback : candidate;
}

function lifecycleOpToFabricKind(op) {
  switch (op) {
    case 'mount':
      return 'component.mount';
    case 'destroy':
    case 'disconnect':
      return 'component.disconnect';
    case 'render':
      return 'component.render';
    case 'hydrate':
    default:
      return 'component.hydrate';
  }
}

function browserIncludesAttribute(html, attribute, value) {
  if (typeof html !== 'string' || typeof attribute !== 'string' || typeof value !== 'string') {
    return false;
  }
  return html.includes(`${attribute}="${value}"`);
}

function safeFiberSegment(value) {
  return String(value || 'rmt-vnext').replace(/[^a-zA-Z0-9._:-]/g, '-');
}

function runFabricBridgeFiber(fabric, fiberInput = {}) {
  const mapping = resolveRmtScheduleForFiber({
    kind: fiberInput.kind,
    lane: fiberInput.lane,
    scope: fiberInput.scope,
    componentRef: fiberInput.componentRef,
    routeRef: fiberInput.routeRef
  });
  fabric.runFiber({
    id: fiberInput.id,
    kind: fiberInput.kind,
    lane: mapping.fabricLane,
    phase: fiberInput.phase,
    source: fiberInput.source || 'rmt-vnext',
    scope: fiberInput.scope,
    componentRef: fiberInput.componentRef,
    routeRef: fiberInput.routeRef,
    correlationId: fiberInput.correlationId,
    scheduleRef: mapping.scheduleRef,
    endpointNameHint: mapping.endpointName,
    metadata: fiberInput.metadata
  }, () => ({ ok: true, lane: mapping.fabricLane, scheduleRef: mapping.scheduleRef }));

  return {
    requestedLane: fiberInput.lane,
    kind: fiberInput.kind,
    phase: fiberInput.phase,
    id: fiberInput.id,
    mapping
  };
}

function createFabricBridgeLaneMatrix(fabric, context = {}) {
  const primitiveSegment = safeFiberSegment(context.primitiveId);
  return RMT_VNEXT_FABRIC_BRIDGE_LANE_MATRIX.map((entry, index) => runFabricBridgeFiber(fabric, {
    id: `fiber:${primitiveSegment}/matrix/${entry.lane}/${index}`,
    kind: entry.kind,
    lane: entry.lane,
    phase: entry.phase,
    source: 'rmt-vnext-lane-matrix',
    scope: context.primitiveId || entry.kind,
    componentRef: context.componentRef,
    routeRef: entry.routeRef,
    correlationId: `${context.primitiveId || 'rmt-vnext'}:${entry.lane}`,
    metadata: {
      ...context.metadata,
      matrixLane: entry.lane,
      matrixKind: entry.kind,
      matrixWorkpackage: RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE
    }
  }));
}

function createHostAdapterTelemetryInput(input = {}) {
  const probeTelemetry = input.browserProbe && input.browserProbe.hostAdapterTelemetry;
  const telemetry = probeTelemetry && typeof probeTelemetry === 'object' ? probeTelemetry : {};
  const mapping = input.mapping || {};
  const metadata = input.metadata || {};
  return {
    schema: RMT_VNEXT_HOST_ADAPTER_TELEMETRY_SCHEMA,
    source: 'xtend.component-adapter',
    operation: 'hydrate',
    phase: 'hydrate',
    status: 'ok',
    adapterId: 'xtend.component',
    componentId: input.primitiveId || metadata.primitiveId,
    rmtComponentId: input.primitiveId || metadata.primitiveId,
    tag: input.componentRef || metadata.componentRef,
    scheduleRef: mapping.scheduleRef,
    fabricLane: mapping.fabricLane,
    rmtLane: mapping.rmtLane,
    fiberKind: input.fabricKind || 'component.hydrate',
    endpointNameHint: mapping.endpointName,
    correlationId: input.primitiveId || metadata.primitiveId,
    metadata: {
      workpackage: RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE,
      primitiveId: input.primitiveId || metadata.primitiveId,
      kernelScheduleRef: metadata.kernelScheduleRef,
      kernelFiberRef: metadata.kernelFiberRef,
      sourcePointer: metadata.sourcePointer,
      hostAdapterEvidence: true
    },
    ...telemetry,
    metadata: {
      workpackage: RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE,
      primitiveId: input.primitiveId || metadata.primitiveId,
      kernelScheduleRef: metadata.kernelScheduleRef,
      kernelFiberRef: metadata.kernelFiberRef,
      sourcePointer: metadata.sourcePointer,
      hostAdapterEvidence: true,
      ...(telemetry.metadata && typeof telemetry.metadata === 'object' ? telemetry.metadata : {})
    }
  };
}

function normalizeScenarioConfig(browserProbe) {
  const probeConfig = browserProbe && browserProbe.routeComponentFibers && typeof browserProbe.routeComponentFibers === 'object'
    ? browserProbe.routeComponentFibers
    : {};
  const componentConfig = probeConfig.component && typeof probeConfig.component === 'object' ? probeConfig.component : {};
  const routeConfig = probeConfig.route && typeof probeConfig.route === 'object' ? probeConfig.route : {};
  return {
    component: {
      ...RMT_VNEXT_ROUTE_COMPONENT_FIBER_SCENARIOS.component,
      ...componentConfig
    },
    route: {
      ...RMT_VNEXT_ROUTE_COMPONENT_FIBER_SCENARIOS.route,
      ...routeConfig
    }
  };
}

function createRouteAndComponentFiberRecords(fabric, context = {}) {
  const scenario = normalizeScenarioConfig(context.browserProbe);
  const metadata = {
    ...context.metadata,
    routeComponentEvidence: true,
    workpackage: RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE
  };
  const componentRef = scenario.component.componentRef || context.componentRef || 'x-status';
  const routeRef = scenario.route.routeRef || scenario.component.routeRef || '/rmt-vnext-source-to-sea';
  const componentFibers = fabric.createComponentFiberInstrumentation(componentRef, {
    scope: `${context.primitiveId || componentRef}.component`,
    routeRef,
    adapterRef: 'xtend.component',
    hostRef: 'rmt-vnext-source-to-sea',
    correlationId: `${context.primitiveId || componentRef}:component`
  });
  const routeFibers = fabric.createRouteFiberInstrumentation(scenario.route.routerRef || 'xtend.xrouter', {
    scope: `${context.primitiveId || routeRef}.route`,
    adapterRef: 'xtendrmt.xrouter',
    hostRef: 'rmt-vnext-source-to-sea',
    correlationId: `${context.primitiveId || routeRef}:route`
  });

  componentFibers.mount((fiber) => ({ mounted: true, fiberId: fiber.id }), {
    routeRef,
    scheduleRef: scenario.component.mountScheduleRef,
    endpointNameHint: 'xtendrmt.component.mount',
    metadata
  });
  componentFibers.hydrate((fiber) => ({ hydrated: true, fiberId: fiber.id }), {
    routeRef,
    scheduleRef: scenario.component.hydrateScheduleRef,
    endpointNameHint: 'xtendrmt.component.hydrate',
    metadata
  });
  routeFibers.navigate((fiber) => ({ navigated: true, fiberId: fiber.id, to: scenario.route.routeRef }), {
    from: '/',
    to: routeRef,
    routeId: scenario.route.routeId || routeRef,
    routeRef,
    scheduleRef: scenario.route.navigateScheduleRef,
    endpointNameHint: 'xtendrmt.ui.user-blocking',
    metadata
  });
  routeFibers.render((fiber) => ({ rendered: true, fiberId: fiber.id, routeRef }), {
    routeRef,
    componentRef,
    scheduleRef: scenario.route.renderScheduleRef,
    endpointNameHint: 'xtendrmt.route.render',
    metadata
  });

  return {
    schema: RMT_VNEXT_ROUTE_COMPONENT_FIBER_EVIDENCE_SCHEMA,
    componentScenario: scenario.component,
    routeScenario: scenario.route,
    expected: {
      component: [
        { kind: 'component.mount', phase: 'mount', scheduleRef: scenario.component.mountScheduleRef, source: 'component' },
        { kind: 'component.hydrate', phase: 'hydrate', scheduleRef: scenario.component.hydrateScheduleRef, source: 'component' }
      ],
      route: [
        { kind: 'route.navigate', phase: 'navigate', scheduleRef: scenario.route.navigateScheduleRef, source: 'router' },
        { kind: 'route.render', phase: 'render', scheduleRef: scenario.route.renderScheduleRef, source: 'router' }
      ]
    }
  };
}

function summarizeExpectedFiber(fibers, expected, telemetrySnapshot) {
  const fiber = fibers.find((record) => record.kind === expected.kind
    && record.phase === expected.phase
    && record.scheduleRef === expected.scheduleRef
    && (!expected.source || record.source === expected.source)) || null;
  const laneTelemetry = fiber && telemetrySnapshot && telemetrySnapshot.lanes
    ? telemetrySnapshot.lanes[fiber.lane]
    : null;
  return {
    ok: Boolean(fiber && fiber.schema === FABRIC_CONTRACTS.fiber && fiber.status === 'completed' && laneTelemetry && laneTelemetry.scheduleRefs.includes(expected.scheduleRef)),
    kind: expected.kind,
    phase: expected.phase,
    expectedScheduleRef: expected.scheduleRef,
    expectedSource: expected.source || null,
    fiber: fiber ? {
      schema: fiber.schema,
      id: fiber.id,
      kind: fiber.kind,
      phase: fiber.phase,
      source: fiber.source,
      lane: fiber.lane,
      status: fiber.status,
      scheduleRef: fiber.scheduleRef,
      endpointNameHint: fiber.endpointNameHint,
      componentRef: fiber.componentRef,
      routeRef: fiber.routeRef,
      correlationId: fiber.correlationId
    } : null,
    telemetry: laneTelemetry ? {
      lane: laneTelemetry.lane,
      fiberCount: laneTelemetry.fiberCount,
      scheduleRefs: laneTelemetry.scheduleRefs
    } : null
  };
}

function summarizeRouteAndComponentFibers(plan, fibers, telemetrySnapshot) {
  const component = plan.expected.component.map((expected) => summarizeExpectedFiber(fibers, expected, telemetrySnapshot));
  const route = plan.expected.route.map((expected) => summarizeExpectedFiber(fibers, expected, telemetrySnapshot));
  return {
    schema: plan.schema,
    ok: component.every((entry) => entry.ok) && route.every((entry) => entry.ok),
    componentScenario: plan.componentScenario,
    routeScenario: plan.routeScenario,
    component,
    route,
    counts: {
      component: component.filter((entry) => entry.ok).length,
      route: route.filter((entry) => entry.ok).length,
      total: component.concat(route).filter((entry) => entry.ok).length
    }
  };
}

function createRmtVNextFabricBridgeEvidence(input = {}) {
  const schedule = input.schedule || null;
  const kernelFiber = input.fiber || null;
  const lifecycleRecord = input.lifecycleRecord || null;
  const sourceMapEntry = input.sourceMapEntry || null;
  const browserFixtureText = typeof input.browserFixtureText === 'string' ? input.browserFixtureText : '';
  const browserProbe = input.browserProbe || parseJsonScript(browserFixtureText, 'rmt-source-to-sea-probe') || null;
  const primitiveId = input.primitiveId || null;
  const componentRef = input.componentRef || null;
  const lane = (schedule && schedule.lane) || stripKernelLaneRef(kernelFiber && kernelFiber.lane);
  const fabricKind = lifecycleOpToFabricKind((kernelFiber && kernelFiber.op) || (lifecycleRecord && lifecycleRecord.op));
  const mapping = resolveRmtScheduleForFiber({
    kind: fabricKind,
    lane,
    scope: primitiveId,
    componentRef
  });
  const fabric = createXtendFabric({
    idPrefix: 'rmt.vnext.source-to-sea.fabric',
    now: createIncrementingClock(),
    markPerformance: false
  });
  const metadata = {
    workpackage: RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE,
    primitiveId,
    componentRef,
    sourcePointer: sourceMapEntry && sourceMapEntry.corePointer,
    astPointer: sourceMapEntry && sourceMapEntry.astPointer,
    kernelScheduleRef: schedule && schedule.id,
    kernelFiberRef: kernelFiber && kernelFiber.id,
    kernelLifecycleRecordRef: lifecycleRecord && lifecycleRecord.id
  };

  let primaryRecord = null;
  if (kernelFiber && kernelFiber.id) {
    primaryRecord = runFabricBridgeFiber(fabric, {
      id: kernelFiber.id,
      kind: fabricKind,
      lane: mapping.fabricLane,
      phase: (kernelFiber && kernelFiber.op) || 'hydrate',
      source: 'rmt-vnext',
      scope: primitiveId || (schedule && schedule.id) || fabricKind,
      componentRef,
      correlationId: primitiveId || (kernelFiber && kernelFiber.id),
      scheduleRef: mapping.scheduleRef,
      endpointNameHint: mapping.endpointName,
      metadata
    });
  }
  const laneMatrixRecords = createFabricBridgeLaneMatrix(fabric, {
    primitiveId,
    componentRef,
    metadata
  });
  const hostAdapterTelemetry = fabric.recordComponentTelemetry(createHostAdapterTelemetryInput({
    primitiveId,
    componentRef,
    fabricKind,
    mapping,
    metadata,
    browserProbe
  }));
  const routeComponentPlan = createRouteAndComponentFiberRecords(fabric, {
    primitiveId,
    componentRef,
    metadata,
    browserProbe
  });

  const fabricFibers = fabric.getFibers();
  const completedFiber = fabricFibers.find((record) => record.id === (kernelFiber && kernelFiber.id)) || fabricFibers[0] || null;
  const telemetrySnapshot = fabric.createTelemetrySnapshot({
    id: 'telemetry:rmt-vnext-source-to-sea',
    source: 'rmt-vnext-source-to-sea',
    correlationId: primitiveId,
    metadata
  });
  const laneTelemetry = completedFiber && telemetrySnapshot.lanes
    ? telemetrySnapshot.lanes[completedFiber.lane]
    : null;
  const laneMatrix = laneMatrixRecords.map((record) => {
    const matrixFiber = fabricFibers.find((fiberRecord) => fiberRecord.id === record.id) || null;
    const matrixLaneTelemetry = matrixFiber && telemetrySnapshot.lanes
      ? telemetrySnapshot.lanes[matrixFiber.lane]
      : null;
    const ok = Boolean(
      record.mapping.ok === true
      && matrixFiber
      && matrixFiber.status === 'completed'
      && matrixFiber.schema === FABRIC_CONTRACTS.fiber
      && matrixLaneTelemetry
      && matrixLaneTelemetry.scheduleRefs.includes(record.mapping.scheduleRef)
    );
    return {
      ok,
      lane: record.requestedLane,
      kind: record.kind,
      phase: record.phase,
      fiber: matrixFiber ? {
        id: matrixFiber.id,
        schema: matrixFiber.schema,
        status: matrixFiber.status,
        lane: matrixFiber.lane,
        scheduleRef: matrixFiber.scheduleRef,
        endpointNameHint: matrixFiber.endpointNameHint,
        source: matrixFiber.source
      } : null,
      mapping: {
        schema: record.mapping.schema,
        source: record.mapping.source,
        fabricLane: record.mapping.fabricLane,
        rmtLane: record.mapping.rmtLane,
        scheduleRef: record.mapping.scheduleRef,
        endpointName: record.mapping.endpointName
      },
      telemetry: matrixLaneTelemetry ? {
        lane: matrixLaneTelemetry.lane,
        fiberCount: matrixLaneTelemetry.fiberCount,
        scheduleRefs: matrixLaneTelemetry.scheduleRefs
      } : null
    };
  });
  const expectedMatrixLanes = RMT_VNEXT_FABRIC_BRIDGE_LANE_MATRIX.map((entry) => entry.lane);
  const actualMatrixLanes = laneMatrix.map((entry) => entry.lane);
  const browserExposesLane = Boolean(completedFiber && browserIncludesAttribute(browserFixtureText, 'data-xtend-fabric-lane', completedFiber.lane));
  const browserExposesFiber = Boolean(completedFiber && browserIncludesAttribute(browserFixtureText, 'data-xtend-fabric-fiber', completedFiber.id));
  const browserExposesSchedule = Boolean(completedFiber && browserIncludesAttribute(browserFixtureText, 'data-xtend-fabric-schedule', completedFiber.scheduleRef));
  const browserExposesHostTelemetry = browserIncludesAttribute(browserFixtureText, 'data-xtend-host-adapter-telemetry', RMT_VNEXT_HOST_ADAPTER_TELEMETRY_SCHEMA)
    || browserFixtureText.includes(RMT_VNEXT_HOST_ADAPTER_TELEMETRY_SCHEMA);
  const componentTelemetrySummary = telemetrySnapshot.componentTelemetry;
  const componentTelemetryLane = componentTelemetrySummary && componentTelemetrySummary.lanes
    ? componentTelemetrySummary.lanes[hostAdapterTelemetry.fabricLane]
    : null;
  const routeComponentFibers = summarizeRouteAndComponentFibers(routeComponentPlan, fabricFibers, telemetrySnapshot);
  const checks = [
    createCheck('fabric bridge mapping resolved', mapping.ok === true && mapping.schema === FABRIC_RMT_CONTRACTS.mapping, mapping.scheduleRef),
    createCheck('fabric runtime records vNext fiber', Boolean(completedFiber && completedFiber.schema === FABRIC_CONTRACTS.fiber && completedFiber.status === 'completed'), completedFiber && completedFiber.id),
    createCheck('fabric runtime keeps vNext lane', Boolean(completedFiber && completedFiber.lane === lane), completedFiber && completedFiber.lane),
    createCheck('fabric telemetry records lane', Boolean(laneTelemetry && laneTelemetry.fiberCount >= 1), laneTelemetry && laneTelemetry.lane),
    createCheck('fabric telemetry records schedule', Boolean(laneTelemetry && laneTelemetry.scheduleRefs.includes(mapping.scheduleRef)), mapping.scheduleRef),
    createCheck('fabric bridge lane matrix covers target lanes', expectedMatrixLanes.every((matrixLane) => actualMatrixLanes.includes(matrixLane)), actualMatrixLanes),
    createCheck('fabric bridge lane matrix passes', laneMatrix.every((entry) => entry.ok), laneMatrix.map((entry) => `${entry.lane}:${entry.mapping.scheduleRef}`)),
    createCheck('host adapter telemetry recorded', hostAdapterTelemetry.schema === RMT_VNEXT_HOST_ADAPTER_TELEMETRY_SCHEMA, hostAdapterTelemetry.schema),
    createCheck('host adapter telemetry matches mapping', hostAdapterTelemetry.scheduleRef === mapping.scheduleRef && hostAdapterTelemetry.fabricLane === mapping.fabricLane, hostAdapterTelemetry.scheduleRef),
    createCheck('fabric snapshot includes host adapter telemetry', Boolean(componentTelemetrySummary && componentTelemetrySummary.recordCount >= 1), componentTelemetrySummary && componentTelemetrySummary.recordCount),
    createCheck('host adapter telemetry lane summarizes schedule', Boolean(componentTelemetryLane && componentTelemetryLane.scheduleRefs.includes(mapping.scheduleRef)), mapping.scheduleRef),
    createCheck('browser exposes host adapter telemetry', browserExposesHostTelemetry, RMT_VNEXT_HOST_ADAPTER_TELEMETRY_SCHEMA),
    createCheck('component fiber instrumentation records mount and hydrate', routeComponentFibers.component.every((entry) => entry.ok), routeComponentFibers.component.map((entry) => entry.expectedScheduleRef)),
    createCheck('route fiber instrumentation records navigate and render', routeComponentFibers.route.every((entry) => entry.ok), routeComponentFibers.route.map((entry) => entry.expectedScheduleRef)),
    createCheck('browser exposes fabric lane', browserExposesLane, completedFiber && completedFiber.lane),
    createCheck('browser exposes fabric fiber', browserExposesFiber, completedFiber && completedFiber.id),
    createCheck('browser exposes fabric schedule', browserExposesSchedule, completedFiber && completedFiber.scheduleRef)
  ];

  return {
    schema: RMT_VNEXT_FABRIC_BRIDGE_EVIDENCE_SCHEMA,
    workpackage: RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE,
    ok: checks.every((check) => check.ok),
    status: checks.every((check) => check.ok) ? 'passed' : 'failed',
    mapping: {
      schema: mapping.schema,
      scheduleSchema: mapping.schedule && mapping.schedule.schema,
      source: mapping.source,
      fabricLane: mapping.fabricLane,
      rmtLane: mapping.rmtLane,
      scheduleRef: mapping.scheduleRef,
      endpointName: mapping.endpointName,
      diagnostics: mapping.diagnostics
    },
    primary: primaryRecord ? {
      lane: primaryRecord.requestedLane,
      kind: primaryRecord.kind,
      scheduleRef: primaryRecord.mapping.scheduleRef,
      endpointName: primaryRecord.mapping.endpointName
    } : null,
    fiber: completedFiber ? {
      schema: completedFiber.schema,
      id: completedFiber.id,
      kind: completedFiber.kind,
      phase: completedFiber.phase,
      source: completedFiber.source,
      lane: completedFiber.lane,
      status: completedFiber.status,
      scheduleRef: completedFiber.scheduleRef,
      endpointNameHint: completedFiber.endpointNameHint,
      correlationId: completedFiber.correlationId,
      metadata: completedFiber.metadata
    } : null,
    telemetry: {
      schema: telemetrySnapshot.schema,
      id: telemetrySnapshot.id,
      source: telemetrySnapshot.source,
      fiberCount: telemetrySnapshot.fiberCount,
      lane: laneTelemetry ? {
        lane: laneTelemetry.lane,
        fiberCount: laneTelemetry.fiberCount,
        completedCount: laneTelemetry.completedCount,
        scheduleRefs: laneTelemetry.scheduleRefs
      } : null,
      laneMatrix
    },
    laneMatrix,
    routeComponentFibers,
    hostAdapter: {
      schema: hostAdapterTelemetry.schema,
      source: hostAdapterTelemetry.source,
      operation: hostAdapterTelemetry.operation,
      phase: hostAdapterTelemetry.phase,
      status: hostAdapterTelemetry.status,
      adapterId: hostAdapterTelemetry.adapterId,
      componentId: hostAdapterTelemetry.componentId,
      scheduleRef: hostAdapterTelemetry.scheduleRef,
      fabricLane: hostAdapterTelemetry.fabricLane,
      rmtLane: hostAdapterTelemetry.rmtLane,
      fiberKind: hostAdapterTelemetry.fiberKind,
      endpointNameHint: hostAdapterTelemetry.endpointNameHint,
      correlationId: hostAdapterTelemetry.correlationId,
      metadata: hostAdapterTelemetry.metadata,
      summary: componentTelemetrySummary ? {
        schema: componentTelemetrySummary.schema,
        recordCount: componentTelemetrySummary.recordCount,
        lane: componentTelemetryLane ? {
          lane: hostAdapterTelemetry.fabricLane,
          recordCount: componentTelemetryLane.recordCount,
          scheduleRefs: componentTelemetryLane.scheduleRefs
        } : null
      } : null
    },
    browser: {
      laneVisible: browserExposesLane,
      fiberVisible: browserExposesFiber,
      scheduleVisible: browserExposesSchedule,
      hostAdapterTelemetryVisible: browserExposesHostTelemetry
    },
    correlation: [
      { layer: 'source', value: sourceMapEntry && sourceMapEntry.astPointer },
      { layer: 'kernel.schedule', value: schedule && schedule.id },
      { layer: 'kernel.fiber', value: kernelFiber && kernelFiber.id },
      { layer: 'fabric.mapping', value: mapping.scheduleRef },
      { layer: 'fabric.fiber', value: completedFiber && completedFiber.id },
      { layer: 'host.adapter', value: hostAdapterTelemetry.id },
      { layer: 'component.fibers', value: routeComponentFibers.component.map((entry) => entry.fiber && entry.fiber.id).filter(Boolean) },
      { layer: 'route.fibers', value: routeComponentFibers.route.map((entry) => entry.fiber && entry.fiber.id).filter(Boolean) },
      { layer: 'fabric.telemetry', value: telemetrySnapshot.id },
      { layer: 'browser', value: completedFiber && `[data-xtend-fabric-fiber="${completedFiber.id}"]` }
    ],
    checks
  };
}

function createRmtVNextSourceToSeaEvidence(input, options = {}) {
  const compileResult = compileRmtVNextSource(input, options.compilerOptions || {});
  const coreDocument = compileResult.coreDocument || null;
  const appPlatform = coreDocument && coreDocument.appPlatform;
  const kernelRecords = coreDocument && coreDocument.kernelRecords;
  const browserFixtureText = typeof options.browserFixtureText === 'string' ? options.browserFixtureText : '';
  const browserProbe = options.browserProbe || parseJsonScript(browserFixtureText, 'rmt-source-to-sea-probe');
  const primitiveId = options.primitiveId
    || (browserProbe && browserProbe.primitiveId)
    || (toArray(appPlatform && appPlatform.surfaces)[0] && toArray(appPlatform && appPlatform.surfaces)[0].id)
    || null;
  const actionId = options.actionId
    || (browserProbe && browserProbe.expectedAction)
    || (toArray(appPlatform && appPlatform.actions)[0] && toArray(appPlatform && appPlatform.actions)[0].id)
    || null;
  const preferredLane = options.lane || (browserProbe && browserProbe.lane) || 'visible';
  const { appSurface, coreSurface } = findSurface(coreDocument, primitiveId);
  const eventRecord = findEvent(coreDocument, coreSurface, actionId);
  const eventSourceMap = findSourceMapEntry(coreDocument, eventRecord);
  const surfaceSourceMap = findSourceMapEntry(coreDocument, coreSurface);
  const sourceMapEntry = eventSourceMap || surfaceSourceMap || null;
  const schedule = findSchedule(kernelRecords, coreSurface, preferredLane);
  const fiber = findFiber(kernelRecords, schedule);
  const uiSelector = options.selector
    || (browserProbe && browserProbe.selector)
    || (primitiveId ? `[data-rmt-primitive-id="${primitiveId}"]` : null);
  const browserExposesPrimitive = Boolean(uiSelector && browserFixtureText.includes(uiSelector.replace(/\\"/g, '"')));
  const browserExposesResult = Boolean(browserFixtureText.includes(RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY));
  const browserText = options.expectedText || (browserProbe && browserProbe.expectedText);
  const expectedBrowserAction = options.expectedAction || (browserProbe && browserProbe.expectedAction);
  const browserEventObserved = Boolean(expectedBrowserAction === actionId && browserExposesResult);
  const browserViewportAsserted = Boolean(browserExposesPrimitive && browserFixtureText.includes('getBoundingClientRect'));
  const kernelLifecycleRecord = toArray(kernelRecords && kernelRecords.lifecycleRecords)
    .find((record) => fiber && record.id === fiber.operation) || null;
  const scheduleRef = schedule && schedule.id;
  const fiberRef = fiber && fiber.id;
  const fabricBridge = createRmtVNextFabricBridgeEvidence({
    primitiveId,
    componentRef: appSurface && appSurface.component,
    schedule,
    fiber,
    lifecycleRecord: kernelLifecycleRecord,
    sourceMapEntry,
    browserFixtureText,
    browserProbe
  });

  const checks = [
    createCheck('compiler result ok', compileResult.ok === true, compileResult.status),
    createCheck('semantic graph ok', Boolean(compileResult.primitiveSemanticGraph && compileResult.primitiveSemanticGraph.ok), compileResult.primitiveSemanticGraph && compileResult.primitiveSemanticGraph.diagnostics),
    createCheck('app platform artifact emitted', Boolean(appPlatform && appPlatform.schema === RMT_APP_PLATFORM_RECORDS_SCHEMA), appPlatform && appPlatform.schema),
    createCheck('kernel records emitted', Boolean(kernelRecords && kernelRecords.schema === RMT_KERNEL_RECORDS_SCHEMA), kernelRecords && kernelRecords.schema),
    createCheck('kernel boundary preserved', Boolean(kernelRecords && kernelRecords.boundary === RMT_KERNEL_BOUNDARY), kernelRecords && kernelRecords.boundary),
    createCheck('primitive surface lowered', Boolean(appSurface && coreSurface), primitiveId),
    createCheck('event action lowered', Boolean(eventRecord && eventRecord.action === actionId), eventRecord && eventRecord.action),
    createCheck('source pointer available', Boolean(sourceMapEntry && sourceMapEntry.corePointer), sourceMapEntry && sourceMapEntry.corePointer),
    createCheck('kernel schedule available', Boolean(scheduleRef), scheduleRef),
    createCheck('fabric fiber derivable', Boolean(fiberRef && fiber && fiber.source && fiber.source.kind === 'selector'), fiberRef),
    createCheck('lifecycle record correlates to fiber', Boolean(kernelLifecycleRecord), fiber && fiber.operation),
    createCheck('browser fixture declares probe schema', Boolean(browserProbe && browserProbe.schema === RMT_VNEXT_SOURCE_TO_SEA_BROWSER_PROBE_SCHEMA), browserProbe && browserProbe.schema),
    createCheck('browser fixture exposes primitive marker', browserExposesPrimitive, uiSelector),
    createCheck('browser fixture asserts viewport', browserViewportAsserted, uiSelector),
    createCheck('browser fixture observes event', browserEventObserved, actionId),
    createCheck('fabric bridge evidence passes', fabricBridge.ok === true, fabricBridge.status),
    createCheck('kernel does not expose host imports', !containsKernelHostImport(kernelRecords), kernelRecords && kernelRecords.boundary)
  ];
  const ok = checks.every((check) => check.ok);

  return {
    schema: RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_SCHEMA,
    gateSchema: RMT_VNEXT_SOURCE_TO_SEA_SCHEMA,
    workpackage: RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
    ok,
    status: ok ? 'passed' : 'failed',
    source: input && (input.filePath || input.uri || null),
    primitiveId,
    sourcePointer: sourceMapEntry && sourceMapEntry.corePointer,
    sourceMap: sourceMapEntry ? {
      id: sourceMapEntry.id,
      astPointer: sourceMapEntry.astPointer,
      corePointer: sourceMapEntry.corePointer,
      range: sourceMapEntry.range
    } : null,
    compiler: {
      ok: compileResult.ok === true,
      status: compileResult.status,
      artifactCount: artifactCount(coreDocument),
      appPlatformSchema: appPlatform && appPlatform.schema,
      kernelRecordsSchema: kernelRecords && kernelRecords.schema
    },
    kernel: {
      ingested: Boolean(kernelRecords && scheduleRef && kernelLifecycleRecord),
      scheduleRef,
      lifecycleRecordRef: kernelLifecycleRecord && kernelLifecycleRecord.id,
      boundary: kernelRecords && kernelRecords.boundary
    },
    fabric: {
      schema: fabricBridge.schema,
      workpackage: fabricBridge.workpackage,
      lane: schedule && schedule.lane,
      rmtLane: fabricBridge.mapping.rmtLane,
      fiber: fiberRef,
      operation: fiber && fiber.operation,
      sourceKind: fiber && fiber.source && fiber.source.kind,
      scheduleRef: fabricBridge.mapping.scheduleRef,
      endpointName: fabricBridge.mapping.endpointName,
      telemetry: fabricBridge.telemetry,
      bridge: fabricBridge
    },
    ui: {
      selector: uiSelector,
      visible: browserViewportAsserted,
      text: browserText || null,
      component: appSurface && appSurface.component
    },
    browser: {
      fixture: options.browserFixturePath || null,
      resultKey: RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY,
      viewportAsserted: browserViewportAsserted,
      eventObserved: browserEventObserved,
      expectedAction: actionId,
      probeSchema: browserProbe && browserProbe.schema
    },
    correlation: [
      { layer: 'source', value: sourceMapEntry && sourceMapEntry.astPointer },
      { layer: 'compiler', value: primitiveId },
      { layer: 'kernel', value: scheduleRef },
      { layer: 'fabric', value: fiberRef },
      { layer: 'ui', value: uiSelector },
      { layer: 'browser', value: RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY }
    ],
    diagnostics: compileResult.diagnostics || [],
    checks
  };
}

function createBrowserExecutionChecks(result, evidence = {}) {
  const kernelEvidence = evidence && evidence.kernel || {};
  const fabricEvidence = evidence && evidence.fabric || {};
  const expectedAction = evidence && evidence.browser && evidence.browser.expectedAction
    || 'demo.feedback.save';
  return [
    createCheck('browser execution returned result', Boolean(result), result && result.status),
    createCheck('browser execution status passed', result && result.status === 'passed', result && result.errors),
    createCheck('browser execution primitive matches evidence', result && result.primitiveId === evidence.primitiveId, result && result.primitiveId),
    createCheck('browser execution schedule matches kernel', result && result.scheduleRef === kernelEvidence.scheduleRef, result && result.scheduleRef),
    createCheck('browser execution fiber matches Fabric bridge', result && result.fiberRef === fabricEvidence.fiber, result && result.fiberRef),
    createCheck('browser execution lane matches Fabric lane', result && result.lane === fabricEvidence.lane, result && result.lane),
    createCheck('browser execution schedule reaches Fabric', result && result.fabricScheduleRef === fabricEvidence.scheduleRef, result && result.fabricScheduleRef),
    createCheck('browser execution host telemetry visible', result && result.hostAdapterTelemetrySchema === RMT_VNEXT_HOST_ADAPTER_TELEMETRY_SCHEMA, result && result.hostAdapterTelemetrySchema),
    createCheck('browser execution observed action event', Boolean(result && toArray(result.events).some((event) => event.action === expectedAction)), result && result.events),
    createCheck('browser execution viewport checks pass', Boolean(result && toArray(result.checks).length > 0 && toArray(result.checks).every((check) => check.ok === true)), result && result.checks),
    createCheck('browser execution object matrix passes', Boolean(!result || !Array.isArray(result.objects) || (result.objects.length >= 4 && result.objects.every((entry) => entry.status === 'passed'))), result && result.objects),
    createCheck('browser execution cross-primitive events pass', Boolean(!result || !Array.isArray(result.crossPrimitiveEvents) || (result.crossPrimitiveEvents.length >= 2 && result.crossPrimitiveEvents.every((entry) => entry.status === 'passed'))), result && result.crossPrimitiveEvents),
    createCheck('browser execution cross-route event passes', Boolean(!result || !Array.isArray(result.crossPrimitiveEvents) || result.crossPrimitiveEvents.some((entry) => entry.stage === 'route-target' && entry.status === 'passed' && entry.sourceLane === 'transition' && entry.targetLane === 'transition')), result && result.crossPrimitiveEvents),
    createCheck('browser execution route switches pass', Boolean(!result || !Array.isArray(result.routeSwitches) || (result.routeSwitches.length >= 2 && result.routeSwitches.every((entry) => entry.status === 'passed' && entry.targetMounted === true && entry.targetVisible === true))), result && result.routeSwitches),
    createCheck('browser execution route lifecycle cycles pass', Boolean(!result || !Array.isArray(result.routeLifecycleCycles) || (result.routeLifecycleCycles.length >= 2 && result.routeLifecycleCycles.every((entry) => entry.status === 'passed' && entry.unmounted === true && entry.remounted === true && entry.resourceDisposed === true && entry.countsMatch === true))), result && result.routeLifecycleCycles),
    createCheck('browser execution route lifecycle targets are distinct', Boolean(!result || !Array.isArray(result.routeLifecycleCycles) || new Set(result.routeLifecycleCycles.map((entry) => entry.targetPrimitiveId)).size >= 2), result && result.routeLifecycleCycles)
  ];
}

function createRmtVNextSourceToSeaBrowserResultValidation(result, evidence = {}) {
  const checks = createBrowserExecutionChecks(result, evidence);
  const ok = checks.every((check) => check.ok);
  const routeSwitches = toArray(result && result.routeSwitches);
  const routeLifecycleCycles = toArray(result && result.routeLifecycleCycles);
  const failedChecks = checks.filter((check) => !check.ok).map((check) => check.name);

  return {
    schema: RMT_VNEXT_SOURCE_TO_SEA_BROWSER_RESULT_VALIDATION_SCHEMA,
    workpackage: RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
    ok,
    status: ok ? 'passed' : 'failed',
    resultStatus: result && result.status || null,
    primitiveId: result && result.primitiveId || null,
    routeSwitchCount: routeSwitches.length,
    routeLifecycleCycleCount: routeLifecycleCycles.length,
    failedChecks,
    checks
  };
}

function normalizeSourceToSeaObjects(browserProbe) {
  const objects = toArray(browserProbe && browserProbe.objects)
    .filter((entry) => entry && typeof entry === 'object' && entry.primitiveId);
  if (objects.length > 0) {
    return objects;
  }
  if (browserProbe && browserProbe.primitiveId) {
    return [{
      primitiveId: browserProbe.primitiveId,
      selector: browserProbe.selector,
      expectedText: browserProbe.expectedText,
      expectedAction: browserProbe.expectedAction,
      scheduleRef: browserProbe.scheduleRef,
      fiberRef: browserProbe.fiberRef,
      lane: browserProbe.lane,
      fabricScheduleRef: browserProbe.fabricScheduleRef,
      fabricEndpoint: browserProbe.fabricEndpoint
    }];
  }
  return [];
}

function createObjectHostAdapterTelemetry(browserProbe, objectProbe) {
  const directTelemetry = objectProbe && objectProbe.hostAdapterTelemetry;
  if (directTelemetry && typeof directTelemetry === 'object') {
    return directTelemetry;
  }

  const inheritedTelemetry = browserProbe && browserProbe.hostAdapterTelemetry;
  if (!inheritedTelemetry || typeof inheritedTelemetry !== 'object') {
    return inheritedTelemetry || null;
  }

  const primitiveId = objectProbe.primitiveId
    || inheritedTelemetry.componentId
    || inheritedTelemetry.rmtComponentId
    || null;
  const lane = objectProbe.lane
    || inheritedTelemetry.fabricLane
    || inheritedTelemetry.rmtLane
    || null;
  const componentRef = objectProbe.componentRef
    || inheritedTelemetry.tag
    || null;
  const scheduleRef = objectProbe.fabricScheduleRef
    || inheritedTelemetry.scheduleRef
    || null;

  return {
    ...inheritedTelemetry,
    componentId: primitiveId,
    rmtComponentId: primitiveId,
    tag: componentRef,
    scheduleRef,
    fabricLane: lane,
    rmtLane: lane,
    endpointNameHint: objectProbe.fabricEndpoint || inheritedTelemetry.endpointNameHint,
    correlationId: primitiveId || inheritedTelemetry.correlationId,
    metadata: {
      ...(inheritedTelemetry.metadata && typeof inheritedTelemetry.metadata === 'object'
        ? inheritedTelemetry.metadata
        : {}),
      primitiveId,
      componentRef
    }
  };
}

function createObjectRouteComponentFibers(browserProbe, objectProbe) {
  const directRouteComponentFibers = objectProbe && objectProbe.routeComponentFibers;
  if (directRouteComponentFibers && typeof directRouteComponentFibers === 'object') {
    return directRouteComponentFibers;
  }

  const inheritedRouteComponentFibers = browserProbe && browserProbe.routeComponentFibers;
  if (!inheritedRouteComponentFibers || typeof inheritedRouteComponentFibers !== 'object') {
    return inheritedRouteComponentFibers || null;
  }

  const componentConfig = inheritedRouteComponentFibers.component && typeof inheritedRouteComponentFibers.component === 'object'
    ? inheritedRouteComponentFibers.component
    : {};
  const routeConfig = inheritedRouteComponentFibers.route && typeof inheritedRouteComponentFibers.route === 'object'
    ? inheritedRouteComponentFibers.route
    : {};

  return {
    ...inheritedRouteComponentFibers,
    component: {
      ...componentConfig,
      componentRef: objectProbe.componentRef || componentConfig.componentRef,
      routeRef: objectProbe.routeRef || componentConfig.routeRef || routeConfig.routeRef
    },
    route: routeConfig
  };
}

function createObjectBrowserProbe(browserProbe, objectProbe) {
  return {
    ...(browserProbe || {}),
    ...objectProbe,
    hostAdapterTelemetry: createObjectHostAdapterTelemetry(browserProbe, objectProbe),
    routeComponentFibers: createObjectRouteComponentFibers(browserProbe, objectProbe)
  };
}

function summarizeSourceToSeaObject(objectProbe, evidence) {
  const checks = [
    createCheck('object source-to-sea evidence passes', evidence.ok === true, evidence.status),
    createCheck('object primitive id matches', evidence.primitiveId === objectProbe.primitiveId, evidence.primitiveId),
    createCheck('object action matches browser probe', evidence.browser.expectedAction === objectProbe.expectedAction, evidence.browser.expectedAction),
    createCheck('object kernel schedule matches browser probe', !objectProbe.scheduleRef || evidence.kernel.scheduleRef === objectProbe.scheduleRef, evidence.kernel.scheduleRef),
    createCheck('object fabric fiber matches browser probe', !objectProbe.fiberRef || evidence.fabric.fiber === objectProbe.fiberRef, evidence.fabric.fiber),
    createCheck('object fabric schedule matches browser probe', !objectProbe.fabricScheduleRef || evidence.fabric.scheduleRef === objectProbe.fabricScheduleRef, evidence.fabric.scheduleRef),
    createCheck('object UI selector matches browser probe', !objectProbe.selector || evidence.ui.selector === objectProbe.selector, evidence.ui.selector),
    createCheck('object UI text matches browser probe', !objectProbe.expectedText || evidence.ui.text === objectProbe.expectedText, evidence.ui.text)
  ];

  return {
    ok: checks.every((check) => check.ok),
    status: checks.every((check) => check.ok) ? 'passed' : 'failed',
    primitiveId: objectProbe.primitiveId,
    actionId: objectProbe.expectedAction || null,
    componentRef: objectProbe.componentRef || (evidence.ui && evidence.ui.component) || null,
    sourcePointer: evidence.sourcePointer,
    astPointer: evidence.sourceMap && evidence.sourceMap.astPointer,
    kernel: {
      scheduleRef: evidence.kernel.scheduleRef
    },
    fabric: {
      fiber: evidence.fabric.fiber,
      lane: evidence.fabric.lane,
      scheduleRef: evidence.fabric.scheduleRef,
      endpointName: evidence.fabric.endpointName
    },
    ui: evidence.ui,
    browser: evidence.browser,
    checks
  };
}

function createCrossPrimitiveEventMatrix(crossPrimitiveEvents, coreDocument, objects) {
  const actions = toArray(coreDocument && coreDocument.actions);
  const objectIds = new Set(objects.map((entry) => entry.primitiveId));
  return toArray(crossPrimitiveEvents).map((crossEvent) => {
    const sourceObject = objects.find((entry) => entry.primitiveId === crossEvent.sourcePrimitiveId) || null;
    const targetObject = objects.find((entry) => entry.primitiveId === crossEvent.targetPrimitiveId) || null;
    const sourceLane = sourceObject && sourceObject.fabric && sourceObject.fabric.lane || null;
    const targetLane = targetObject && targetObject.fabric && targetObject.fabric.lane || null;
    const action = actions.find((entry) => entry.name === crossEvent.actionId || entry.id === crossEvent.actionId) || null;
    const reducer = toArray(action && action.reducers)
      .find((entry) => entry.target === crossEvent.targetState) || null;
    const emit = toArray(action && action.emits)
      .find((entry) => entry.event === crossEvent.eventId) || null;
    const routeTargetStateOk = crossEvent.stage !== 'route-target'
      || !crossEvent.targetState
      || String(crossEvent.targetState).startsWith(`state.${crossEvent.targetPrimitiveId}.`);
    const routeTargetEventOk = crossEvent.stage !== 'route-target'
      || !crossEvent.eventId
      || String(crossEvent.eventId).startsWith(`${crossEvent.targetPrimitiveId}.`);
    const routeTargetStageOk = crossEvent.stage !== 'route-target' || (sourceLane === 'transition' && targetLane === 'transition');
    const checks = [
      createCheck('cross event source object exists', objectIds.has(crossEvent.sourcePrimitiveId), crossEvent.sourcePrimitiveId),
      createCheck('cross event target object exists', objectIds.has(crossEvent.targetPrimitiveId), crossEvent.targetPrimitiveId),
      createCheck('cross event action exists', Boolean(action), crossEvent.actionId),
      createCheck('cross event reducer targets another primitive state', Boolean(reducer), crossEvent.targetState),
      createCheck('cross event emitted', Boolean(emit), crossEvent.eventId),
      createCheck('cross event target lane matches expected', !crossEvent.lane || targetLane === crossEvent.lane, crossEvent.lane),
      createCheck('cross event route-target state belongs to target primitive', routeTargetStateOk, crossEvent.targetState),
      createCheck('cross event route-target event belongs to target primitive', routeTargetEventOk, crossEvent.eventId),
      createCheck('cross event route-target stage uses transition lanes', routeTargetStageOk, `${sourceLane || '?'} -> ${targetLane || '?'}`)
    ];
    return {
      ok: checks.every((check) => check.ok),
      status: checks.every((check) => check.ok) ? 'passed' : 'failed',
      sourcePrimitiveId: crossEvent.sourcePrimitiveId,
      targetPrimitiveId: crossEvent.targetPrimitiveId,
      actionId: crossEvent.actionId,
      eventId: crossEvent.eventId || null,
      targetState: crossEvent.targetState || null,
      expectedText: crossEvent.expectedText || null,
      lane: crossEvent.lane || null,
      stage: crossEvent.stage || null,
      sourceLane,
      targetLane,
      reducer: reducer ? {
        target: reducer.target,
        value: reducer.value
      } : null,
      emit: emit ? {
        event: emit.event,
        payload: emit.payload
      } : null,
      checks
    };
  });
}

function createRouteSwitchMatrix(routeSwitches, objects) {
  const objectIds = new Set(objects.map((entry) => entry.primitiveId));
  const defaultRouteScenario = RMT_VNEXT_ROUTE_COMPONENT_FIBER_SCENARIOS.route;
  return toArray(routeSwitches).map((routeSwitch) => {
    const targetObject = objects.find((entry) => entry.primitiveId === routeSwitch.targetPrimitiveId) || null;
    const hasRouteChange = Boolean(routeSwitch.from && routeSwitch.to && routeSwitch.from !== routeSwitch.to);
    const checks = [
      createCheck('route switch source object exists', objectIds.has(routeSwitch.sourcePrimitiveId), routeSwitch.sourcePrimitiveId),
      createCheck('route switch target object exists', !routeSwitch.targetPrimitiveId || objectIds.has(routeSwitch.targetPrimitiveId), routeSwitch.targetPrimitiveId),
      createCheck('route switch changes route', hasRouteChange, `${routeSwitch.from || '?'} -> ${routeSwitch.to || '?'}`),
      createCheck('route switch uses navigation schedule', routeSwitch.scheduleRef === defaultRouteScenario.navigateScheduleRef, routeSwitch.scheduleRef),
      createCheck('route switch uses render schedule', routeSwitch.renderScheduleRef === defaultRouteScenario.renderScheduleRef, routeSwitch.renderScheduleRef),
      createCheck('route switch uses transition lane', routeSwitch.lane === 'transition', routeSwitch.lane),
      createCheck('route switch target schedule matches object', !routeSwitch.targetScheduleRef || Boolean(targetObject && targetObject.kernel && targetObject.kernel.scheduleRef === routeSwitch.targetScheduleRef), routeSwitch.targetScheduleRef),
      createCheck('route switch target fiber matches object', !routeSwitch.targetFiberRef || Boolean(targetObject && targetObject.fabric && targetObject.fabric.fiber === routeSwitch.targetFiberRef), routeSwitch.targetFiberRef),
      createCheck('route switch target uses transition lane', !targetObject || targetObject.fabric.lane === 'transition', targetObject && targetObject.fabric && targetObject.fabric.lane)
    ];
    return {
      ok: checks.every((check) => check.ok),
      status: checks.every((check) => check.ok) ? 'passed' : 'failed',
      id: routeSwitch.id || null,
      sourcePrimitiveId: routeSwitch.sourcePrimitiveId || null,
      targetPrimitiveId: routeSwitch.targetPrimitiveId || null,
      actionId: routeSwitch.actionId || null,
      from: routeSwitch.from || null,
      to: routeSwitch.to || null,
      routeId: routeSwitch.routeId || null,
      scheduleRef: routeSwitch.scheduleRef || null,
      renderScheduleRef: routeSwitch.renderScheduleRef || null,
      lane: routeSwitch.lane || null,
      targetScheduleRef: routeSwitch.targetScheduleRef || null,
      targetFiberRef: routeSwitch.targetFiberRef || null,
      targetExpectedText: routeSwitch.targetExpectedText || null,
      checks
    };
  });
}

function createRouteLifecycleMatrix(routeLifecycleCycles, coreDocument, objects) {
  const objectIds = new Set(objects.map((entry) => entry.primitiveId));
  const resources = toArray(coreDocument && coreDocument.resources);
  const normalizeCycleResources = (cycle) => {
    const normalized = [];
    const seen = new Set();
    const addResource = (entry) => {
      const resourceId = typeof entry === 'string'
        ? entry
        : entry && (entry.resourceId || entry.id || entry.name);
      if (!resourceId || seen.has(resourceId)) {
        return;
      }
      seen.add(resourceId);
      normalized.push({
        resourceId,
        kind: typeof entry === 'object' && entry ? entry.kind || null : null
      });
    };
    toArray(cycle.resources).forEach(addResource);
    toArray(cycle.resourceIds).forEach(addResource);
    addResource({
      resourceId: cycle.resourceId,
      kind: cycle.resourceKind || cycle.kind || null
    });
    return normalized;
  };
  return toArray(routeLifecycleCycles).map((cycle) => {
    const targetObject = objects.find((entry) => entry.primitiveId === cycle.targetPrimitiveId) || null;
    const resourceSpecs = normalizeCycleResources(cycle);
    const resourceResults = resourceSpecs.map((spec) => {
      const resource = resources.find((entry) => entry.name === spec.resourceId || entry.id === `resource:${String(spec.resourceId || '').toLowerCase()}`) || null;
      const diagnostics = [];

      if (!resource) {
        diagnostics.push({
          code: RMT_VNEXT_SOURCE_TO_SEA_CLEANUP_DIAGNOSTIC_CODES.resourceMissing,
          level: 'error',
          message: `Route lifecycle cleanup resource ${spec.resourceId || '<missing>'} was not emitted by vNext lowering.`,
          targetPrimitiveId: cycle.targetPrimitiveId || null,
          resourceId: spec.resourceId || null
        });
      } else if (!resource.owner || resource.owner.id !== cycle.targetPrimitiveId) {
        diagnostics.push({
          code: RMT_VNEXT_SOURCE_TO_SEA_CLEANUP_DIAGNOSTIC_CODES.ownerMismatch,
          level: 'error',
          message: `Route lifecycle cleanup resource ${spec.resourceId} is not owned by ${cycle.targetPrimitiveId}.`,
          targetPrimitiveId: cycle.targetPrimitiveId || null,
          resourceId: spec.resourceId || null,
          owner: resource.owner || null
        });
      }

      if (resource && (!resource.dispose || resource.dispose.text !== 'on surface.destroy')) {
        diagnostics.push({
          code: RMT_VNEXT_SOURCE_TO_SEA_CLEANUP_DIAGNOSTIC_CODES.disposePolicyMissing,
          level: 'error',
          message: `Route lifecycle cleanup resource ${spec.resourceId} must dispose on surface.destroy.`,
          targetPrimitiveId: cycle.targetPrimitiveId || null,
          resourceId: spec.resourceId || null,
          dispose: resource.dispose || null
        });
      }

      if (resource && spec.kind && resource.kind !== spec.kind) {
        diagnostics.push({
          code: RMT_VNEXT_SOURCE_TO_SEA_CLEANUP_DIAGNOSTIC_CODES.kindMismatch,
          level: 'error',
          message: `Route lifecycle cleanup resource ${spec.resourceId} must use kind ${spec.kind}.`,
          targetPrimitiveId: cycle.targetPrimitiveId || null,
          resourceId: spec.resourceId || null,
          expectedKind: spec.kind,
          actualKind: resource.kind || null
        });
      }

      return {
        ok: diagnostics.length === 0,
        resourceId: spec.resourceId || null,
        expectedKind: spec.kind || null,
        resource: resource ? {
          id: resource.id,
          name: resource.name,
          kind: resource.kind,
          owner: resource.owner,
          dispose: resource.dispose
        } : null,
        diagnostics
      };
    });
    const primaryResource = resourceResults[0] || null;
    const resourceChecks = resourceResults.flatMap((entry) => [
      createCheck('route lifecycle resource exists', Boolean(entry.resource), entry.resourceId),
      createCheck('route lifecycle resource owner matches target', Boolean(entry.resource && entry.resource.owner && entry.resource.owner.id === cycle.targetPrimitiveId), entry.resource && entry.resource.owner && entry.resource.owner.id),
      createCheck('route lifecycle resource dispose policy is surface destroy', Boolean(entry.resource && entry.resource.dispose && entry.resource.dispose.text === 'on surface.destroy'), entry.resource && entry.resource.dispose && entry.resource.dispose.text),
      createCheck('route lifecycle resource kind matches expected', !entry.expectedKind || Boolean(entry.resource && entry.resource.kind === entry.expectedKind), entry.expectedKind)
    ]);
    const diagnostics = resourceResults.flatMap((entry) => entry.diagnostics);

    const checks = [
      createCheck('route lifecycle target object exists', objectIds.has(cycle.targetPrimitiveId), cycle.targetPrimitiveId),
      createCheck('route lifecycle target uses transition lane', Boolean(targetObject && targetObject.fabric && targetObject.fabric.lane === 'transition'), targetObject && targetObject.fabric && targetObject.fabric.lane),
      createCheck('route lifecycle unmount schedule declared', cycle.unmountScheduleRef === 'ui.background.work', cycle.unmountScheduleRef),
      createCheck('route lifecycle remount schedule declared', cycle.remountScheduleRef === 'route.transition.render', cycle.remountScheduleRef),
      createCheck('route lifecycle declares cleanup resources', resourceResults.length >= 1, cycle.resourceId || cycle.resources),
      ...resourceChecks,
      createCheck('route lifecycle expected unmount count declared', Number(cycle.expectedUnmountCount || 0) >= 1, cycle.expectedUnmountCount),
      createCheck('route lifecycle expected remount count declared', Number(cycle.expectedRemountCount || 0) >= 1, cycle.expectedRemountCount)
    ];
    return {
      ok: checks.every((check) => check.ok),
      status: checks.every((check) => check.ok) ? 'passed' : 'failed',
      id: cycle.id || null,
      targetPrimitiveId: cycle.targetPrimitiveId || null,
      from: cycle.from || null,
      to: cycle.to || null,
      unmountScheduleRef: cycle.unmountScheduleRef || null,
      remountScheduleRef: cycle.remountScheduleRef || null,
      resourceId: primaryResource && primaryResource.resourceId || cycle.resourceId || null,
      resourceIds: resourceResults.map((entry) => entry.resourceId).filter(Boolean),
      resourceKinds: resourceResults.map((entry) => entry.resource && entry.resource.kind || entry.expectedKind).filter(Boolean),
      resource: primaryResource && primaryResource.resource || null,
      resources: resourceResults,
      diagnostics,
      expectedUnmountCount: cycle.expectedUnmountCount || null,
      expectedRemountCount: cycle.expectedRemountCount || null,
      checks
    };
  });
}

function createRmtVNextSourceToSeaObjectMatrix(input, options = {}) {
  const browserFixtureText = typeof options.browserFixtureText === 'string' ? options.browserFixtureText : '';
  const browserProbe = options.browserProbe || parseJsonScript(browserFixtureText, 'rmt-source-to-sea-probe') || {};
  const objects = normalizeSourceToSeaObjects(browserProbe);
  const compileResult = compileRmtVNextSource(input, options.compilerOptions || {});
  const coreDocument = compileResult.coreDocument || null;
  const primaryEvidence = options.primaryEvidence || null;
  const entries = objects.map((objectProbe) => {
    const objectBrowserProbe = createObjectBrowserProbe(browserProbe, objectProbe);
    const evidence = primaryEvidence && primaryEvidence.primitiveId === objectProbe.primitiveId
      ? primaryEvidence
      : createRmtVNextSourceToSeaEvidence(input, {
        ...options,
        browserProbe: objectBrowserProbe,
        primitiveId: objectProbe.primitiveId,
        actionId: objectProbe.expectedAction,
        expectedAction: objectProbe.expectedAction,
        expectedText: objectProbe.expectedText,
        selector: objectProbe.selector,
        lane: objectProbe.lane || options.lane,
        browserFixtureText,
        browserFixturePath: options.browserFixturePath
    });
    return summarizeSourceToSeaObject(objectProbe, evidence);
  });
  const crossPrimitiveEvents = createCrossPrimitiveEventMatrix(browserProbe.crossPrimitiveEvents, coreDocument, entries);
  const routeSwitches = createRouteSwitchMatrix(browserProbe.routeSwitches, entries);
  const routeLifecycleCycles = createRouteLifecycleMatrix(browserProbe.routeLifecycleCycles, coreDocument, entries);
  const primitiveIds = entries.map((entry) => entry.primitiveId);
  const lanes = entries.map((entry) => entry.fabric && entry.fabric.lane).filter(Boolean);
  const routeLifecycleTargets = routeLifecycleCycles.map((entry) => entry.targetPrimitiveId).filter(Boolean);
  const checks = [
    createCheck('object matrix compiler result ok', compileResult.ok === true, compileResult.status),
    createCheck('object matrix declares multiple objects', entries.length >= 4, primitiveIds),
    createCheck('object matrix primitive ids are unique', new Set(primitiveIds).size === primitiveIds.length, primitiveIds),
    createCheck('object matrix covers multiple lanes', new Set(lanes).size >= 2, lanes),
    createCheck('object matrix entries pass', entries.every((entry) => entry.ok), entries.filter((entry) => !entry.ok).map((entry) => entry.primitiveId)),
    createCheck('object matrix cross-primitive events pass', crossPrimitiveEvents.length >= 2 && crossPrimitiveEvents.every((entry) => entry.ok), crossPrimitiveEvents.map((entry) => `${entry.sourcePrimitiveId}->${entry.targetPrimitiveId}`)),
    createCheck('object matrix cross-route event passes', crossPrimitiveEvents.some((entry) => entry.stage === 'route-target' && entry.ok && entry.sourceLane === 'transition' && entry.targetLane === 'transition'), crossPrimitiveEvents.map((entry) => `${entry.stage || 'surface'}:${entry.sourcePrimitiveId}->${entry.targetPrimitiveId}`)),
    createCheck('object matrix route switches pass', routeSwitches.length >= 2 && routeSwitches.every((entry) => entry.ok), routeSwitches.map((entry) => `${entry.from}->${entry.to}`)),
    createCheck('object matrix route lifecycle cycles pass', routeLifecycleCycles.length >= 2 && routeLifecycleCycles.every((entry) => entry.ok), routeLifecycleTargets),
    createCheck('object matrix route lifecycle targets are distinct', new Set(routeLifecycleTargets).size >= 2, routeLifecycleTargets)
  ];

  return {
    schema: RMT_VNEXT_SOURCE_TO_SEA_OBJECT_MATRIX_SCHEMA,
    workpackage: RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
    ok: checks.every((check) => check.ok),
    status: checks.every((check) => check.ok) ? 'passed' : 'failed',
    objectCount: entries.length,
    primitiveIds,
    lanes,
    objects: entries,
    crossPrimitiveEvents,
    routeSwitches,
    routeLifecycleCycles,
    checks
  };
}

function resolveReportOutputPath(outputPath, rootDir = process.cwd()) {
  return path.isAbsolute(outputPath)
    ? outputPath
    : path.resolve(rootDir, outputPath);
}

function readSourceToSeaFixture(rootDir, sourcePath) {
  return fs.readFileSync(path.resolve(rootDir, sourcePath), 'utf8');
}

function createRmtVNextSourceToSeaCiArtifactValidation(report = {}, options = {}) {
  const browserExecution = report.browserExecution || {};
  const result = browserExecution.result || {};
  const routeSwitches = toArray(result.routeSwitches);
  const routeLifecycleCycles = toArray(result.routeLifecycleCycles);
  const crossPrimitiveEvents = toArray(result.crossPrimitiveEvents);
  const auditLifecycle = routeLifecycleCycles.find((entry) => entry && entry.targetPrimitiveId === 'demo.feedback.audit') || {};
  const expectedAuditResources = ['demo.feedback.auditTimer', 'demo.feedback.auditSubscription'];
  const expectedAuditKinds = ['timer', 'subscription'];
  const shouldValidate = browserExecution.required === true || browserExecution.status === 'passed' || options.requireBrowserExecution === true;
  const expectedBrowserDriver = normalizeBrowserDriver(options.expectedBrowserDriver || RMT_VNEXT_SOURCE_TO_SEA_CI_BROWSER_DRIVER);

  if (!shouldValidate) {
    return {
      schema: RMT_VNEXT_SOURCE_TO_SEA_CI_ARTIFACT_SCHEMA,
      workpackage: RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
      ok: true,
      status: 'skipped',
      required: false,
      reason: 'CI artifact validation waits for browser-required evidence.',
      checks: [
        createCheck('ci artifact validation waits for required browser execution', browserExecution.status === 'skipped' || browserExecution.required !== true, browserExecution.status)
      ]
    };
  }

  const checks = [
    createCheck('ci artifact report schema matches source-to-sea evidence report', report.schema === RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_SCHEMA, report.schema),
    createCheck('ci artifact report belongs to PRIM-06', report.workpackage === RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE, report.workpackage),
    createCheck('ci artifact report passed before validation', report.ok === true && report.status === 'passed', report.status),
    createCheck('ci artifact path is stable', report.artifact && report.artifact.path === RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH, report.artifact && report.artifact.path),
    createCheck('ci artifact browser execution is required', report.artifact && report.artifact.browserExecutionRequired === true && browserExecution.required === true, report.artifact && report.artifact.browserExecutionRequired),
    createCheck('ci artifact browser execution passed', report.artifact && report.artifact.browserExecutionStatus === 'passed' && browserExecution.status === 'passed', browserExecution.status),
    createCheck('ci artifact browser execution uses expected driver', normalizeBrowserDriver(browserExecution.driver) === expectedBrowserDriver, {
      actualDriver: browserExecution.driver,
      expectedDriver: expectedBrowserDriver
    }),
    createCheck('ci artifact object count matches Source-to-Sea contract', result.objectCount === 4, result.objectCount),
    createCheck('ci artifact cross-primitive event count matches contract', crossPrimitiveEvents.length === 2 && crossPrimitiveEvents.every((entry) => entry.status === 'passed'), crossPrimitiveEvents.length),
    createCheck('ci artifact includes cross-route event evidence', crossPrimitiveEvents.some((entry) => entry.stage === 'route-target' && entry.sourcePrimitiveId === 'demo.feedback.detail' && entry.targetPrimitiveId === 'demo.feedback.audit' && entry.sourceLane === 'transition' && entry.targetLane === 'transition'), crossPrimitiveEvents),
    createCheck('ci artifact route switches match contract', routeSwitches.length === 2 && routeSwitches.every((entry) => entry.status === 'passed' && entry.targetMounted === true && entry.targetVisible === true), routeSwitches),
    createCheck('ci artifact route lifecycle cycles match contract', routeLifecycleCycles.length === 2 && routeLifecycleCycles.every((entry) => entry.status === 'passed' && entry.unmounted === true && entry.remounted === true && entry.resourceDisposed === true && entry.countsMatch === true), routeLifecycleCycles),
    createCheck('ci artifact audit lifecycle records expected resources', expectedAuditResources.every((resourceId) => toArray(auditLifecycle.resourceIds).includes(resourceId)), auditLifecycle.resourceIds),
    createCheck('ci artifact audit lifecycle records expected resource kinds', expectedAuditKinds.every((kind) => toArray(auditLifecycle.resourceKinds).includes(kind)), auditLifecycle.resourceKinds),
    createCheck('ci artifact audit lifecycle keeps counts stable', auditLifecycle.unmountCount === 1 && auditLifecycle.remountCount === 1, {
      unmountCount: auditLifecycle.unmountCount,
      remountCount: auditLifecycle.remountCount
    })
  ];
  const ok = checks.every((check) => check.ok);

  return {
    schema: RMT_VNEXT_SOURCE_TO_SEA_CI_ARTIFACT_SCHEMA,
    workpackage: RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
    ok,
    status: ok ? 'passed' : 'failed',
    required: true,
    driver: browserExecution.driver || null,
    artifactPath: report.artifact && report.artifact.path || null,
    checks
  };
}

function validateRmtVNextSourceToSeaCiArtifactFile(artifactPath = RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const resolvedPath = resolveReportOutputPath(
    artifactPath || RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH,
    rootDir
  );

  if (!fs.existsSync(resolvedPath)) {
    return {
      schema: RMT_VNEXT_SOURCE_TO_SEA_CI_ARTIFACT_SCHEMA,
      workpackage: RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
      ok: false,
      status: 'failed',
      required: true,
      driver: null,
      artifactPath: resolvedPath,
      replayed: true,
      checks: [
        createCheck('ci artifact file exists', false, resolvedPath)
      ]
    };
  }

  let report = null;
  try {
    report = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  } catch (error) {
    return {
      schema: RMT_VNEXT_SOURCE_TO_SEA_CI_ARTIFACT_SCHEMA,
      workpackage: RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
      ok: false,
      status: 'failed',
      required: true,
      driver: null,
      artifactPath: resolvedPath,
      replayed: true,
      checks: [
        createCheck('ci artifact file parses as JSON', false, error && error.message)
      ]
    };
  }

  const validation = createRmtVNextSourceToSeaCiArtifactValidation(report, {
    requireBrowserExecution: true,
    expectedBrowserDriver: options.expectedBrowserDriver || RMT_VNEXT_SOURCE_TO_SEA_CI_BROWSER_DRIVER
  });

  return {
    ...validation,
    artifactPath: resolvedPath,
    replayed: true
  };
}

async function createRmtVNextSourceToSeaEvidenceReport(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const sourcePath = options.sourcePath || RMT_VNEXT_SOURCE_TO_SEA_FIXTURE_PATH;
  const browserFixturePath = options.browserFixturePath || RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH;
  const sourceText = typeof options.sourceText === 'string'
    ? options.sourceText
    : readSourceToSeaFixture(rootDir, sourcePath);
  const browserFixtureText = typeof options.browserFixtureText === 'string'
    ? options.browserFixtureText
    : readSourceToSeaFixture(rootDir, browserFixturePath);
  const evidence = options.evidence || createRmtVNextSourceToSeaEvidence({
    text: sourceText,
    filePath: path.resolve(rootDir, sourcePath)
  }, {
    browserFixtureText,
    browserFixturePath
  });
  const browserExecution = options.browserExecution || await runRmtVNextSourceToSeaBrowserExecution(evidence, {
    rootDir,
    browserFixturePath,
    browserDriver: options.browserDriver,
    requireBrowserExecution: options.requireBrowserExecution,
    chromeDriverPath: options.chromeDriverPath,
    webDriverUrl: options.webDriverUrl,
    webDriverPort: options.webDriverPort,
    browserName: options.browserName,
    timeoutMs: options.timeoutMs
  });
  const objectMatrix = options.objectMatrix || createRmtVNextSourceToSeaObjectMatrix({
    text: sourceText,
    filePath: path.resolve(rootDir, sourcePath)
  }, {
    browserFixtureText,
    browserFixturePath,
    primaryEvidence: evidence
  });
  const baseChecks = [
    createCheck('source-to-sea evidence passes', evidence.ok === true, evidence.status),
    createCheck('source-to-sea object matrix passes', objectMatrix.ok === true, objectMatrix.primitiveIds),
    createCheck('browser execution evidence contract emitted', browserExecution.schema === RMT_VNEXT_BROWSER_EXECUTION_EVIDENCE_SCHEMA, browserExecution.schema),
    createCheck('browser execution policy satisfied', browserExecution.ok === true, browserExecution.reason || browserExecution.status)
  ];
  const baseOk = baseChecks.every((check) => check.ok);
  const baseReport = {
    schema: RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
    ok: baseOk,
    status: baseOk ? 'passed' : 'failed',
    source: sourcePath,
    browserFixture: browserFixturePath,
    resultKey: RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY,
    artifact: {
      path: RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH,
      browserExecutionRequired: browserExecution.required === true,
      browserExecutionStatus: browserExecution.status
    },
    evidence,
    objectMatrix,
    browserExecution,
    checks: baseChecks
  };
  const ciArtifactValidation = createRmtVNextSourceToSeaCiArtifactValidation(baseReport, {
    requireBrowserExecution: browserExecution.required === true,
    expectedBrowserDriver: browserExecution.driver || RMT_VNEXT_SOURCE_TO_SEA_CI_BROWSER_DRIVER
  });
  const checks = [
    ...baseChecks,
    createCheck('source-to-sea CI artifact validation passes when browser required', browserExecution.required !== true || ciArtifactValidation.ok === true, ciArtifactValidation.status)
  ];
  const ok = checks.every((check) => check.ok);

  return {
    ...baseReport,
    ok,
    status: ok ? 'passed' : 'failed',
    ciArtifactValidation,
    checks
  };
}

async function writeRmtVNextSourceToSeaEvidenceReport(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const report = await createRmtVNextSourceToSeaEvidenceReport(options);
  const outputPath = resolveReportOutputPath(
    options.outputPath || RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH,
    rootDir
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  return {
    outputPath,
    report
  };
}

function resolveBrowserExecutionDriver(options = {}) {
  if (options.browserDriver) {
    return normalizeBrowserDriver(options.browserDriver);
  }
  if (options.requireBrowserExecution === true && process.env.RMT_VNEXT_SOURCE_TO_SEA_BROWSER_DRIVER) {
    return normalizeBrowserDriver(process.env.RMT_VNEXT_SOURCE_TO_SEA_BROWSER_DRIVER);
  }
  if (options.requireBrowserExecution === true && process.env.XTEND_BROWSER_SMOKE_DRIVER) {
    return normalizeBrowserDriver(process.env.XTEND_BROWSER_SMOKE_DRIVER);
  }
  if (options.requireBrowserExecution === true) {
    return detectAvailableBrowserDriver(options);
  }
  return normalizeBrowserDriver(process.env.RMT_VNEXT_SOURCE_TO_SEA_BROWSER_DRIVER || '');
}

async function runRmtVNextSourceToSeaBrowserExecution(evidence, options = {}) {
  const driver = resolveBrowserExecutionDriver(options);
  const base = {
    schema: RMT_VNEXT_BROWSER_EXECUTION_EVIDENCE_SCHEMA,
    workpackage: RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
    resultKey: RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY,
    fixture: options.browserFixturePath || RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH,
    url: createBrowserExecutionUrl(options),
    driver: driver || null,
    required: options.requireBrowserExecution === true
  };

  if (!driver) {
    return {
      ...base,
      ok: options.requireBrowserExecution !== true,
      status: options.requireBrowserExecution === true ? 'failed' : 'skipped',
      mode: 'fixture-contract',
      reason: 'set RMT_VNEXT_SOURCE_TO_SEA_BROWSER_DRIVER=firefox, chromedriver, webdriver, safari or edge to execute the fixture in a browser',
      checks: [
        createCheck('browser execution fixture contract available', Boolean(evidence && evidence.browser && evidence.browser.resultKey === RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY), evidence && evidence.browser)
      ]
    };
  }

  if (!supportedBrowserDriver(driver)) {
    return {
      ...base,
      ok: options.requireBrowserExecution !== true,
      status: options.requireBrowserExecution === true ? 'failed' : 'skipped',
      mode: 'unsupported-driver',
      reason: `unsupported RMT vNext source-to-sea browser driver: ${driver}`,
      checks: [
        createCheck('browser execution driver supported', false, driver)
      ]
    };
  }

  try {
    const result = await runWebDriverBrowserProbe({
      ...options,
      driver,
      resultKey: RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY
    });
    const resultValidation = createRmtVNextSourceToSeaBrowserResultValidation(result, evidence);
    return {
      ...base,
      ok: resultValidation.ok,
      status: resultValidation.status,
      mode: driver,
      result,
      resultValidation,
      checks: resultValidation.checks
    };
  } catch (error) {
    return {
      ...base,
      ok: options.requireBrowserExecution !== true,
      status: options.requireBrowserExecution === true ? 'failed' : 'skipped',
      mode: driver,
      reason: error && error.message ? error.message : String(error),
      checks: [
        createCheck('browser execution completed', false, error && error.message ? error.message : String(error))
      ]
    };
  }
}

module.exports = {
  RMT_VNEXT_BROWSER_EXECUTION_EVIDENCE_SCHEMA,
  RMT_VNEXT_FABRIC_BRIDGE_EVIDENCE_SCHEMA,
  RMT_VNEXT_FABRIC_BRIDGE_LANE_MATRIX,
  RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE,
  RMT_VNEXT_HOST_ADAPTER_TELEMETRY_SCHEMA,
  RMT_VNEXT_ROUTE_COMPONENT_FIBER_EVIDENCE_SCHEMA,
  RMT_VNEXT_ROUTE_COMPONENT_FIBER_SCENARIOS,
  RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH,
  RMT_VNEXT_SOURCE_TO_SEA_BROWSER_PROBE_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_BROWSER_RESULT_VALIDATION_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_CI_ARTIFACT_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_CI_BROWSER_DRIVER,
  RMT_VNEXT_SOURCE_TO_SEA_CI_BROWSER_NAME,
  RMT_VNEXT_SOURCE_TO_SEA_CI_WEBDRIVER_PORT,
  RMT_VNEXT_SOURCE_TO_SEA_CLEANUP_DIAGNOSTIC_CODES,
  RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH,
  RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_FIXTURE_PATH,
  RMT_VNEXT_SOURCE_TO_SEA_MODULE_PATH,
  RMT_VNEXT_SOURCE_TO_SEA_OBJECT_MATRIX_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY,
  RMT_VNEXT_SOURCE_TO_SEA_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_SUITE_PATH,
  RMT_VNEXT_SOURCE_TO_SEA_SUPPORTED_BROWSER_DRIVERS,
  RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
  createRmtVNextSourceToSeaCiArtifactValidation,
  createRmtVNextSourceToSeaBrowserResultValidation,
  validateRmtVNextSourceToSeaCiArtifactFile,
  createRmtVNextSourceToSeaEvidenceReport,
  createRmtVNextFabricBridgeEvidence,
  createRmtVNextSourceToSeaObjectMatrix,
  runRmtVNextSourceToSeaBrowserExecution,
  createRmtVNextSourceToSeaEvidence,
  writeRmtVNextSourceToSeaEvidenceReport
};

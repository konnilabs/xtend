const http = require('http');
const { spawn } = require('child_process');
const {
  SERVER_CONTRACT,
  listenXtendDevServer
} = require('../../scripts/serve_xtend_dev');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');

const CUSTOM_ELEMENT_FIXTURE_PATH = 'tests/browser/fixtures/custom-elements-smoke.html';
const CORE_FLOW_FIXTURE_PATH = 'tests/browser/fixtures/core-flows-smoke.html';
const RMT_XROUTER_XTEND_FIXTURE_PATH = 'tests/browser/fixtures/rmt-xrouter-xtend-smoke.html';
const RMT_FIRST_DEMO_SMOKE_FIXTURE_PATH = 'tests/browser/fixtures/rmt-first-demo-app-smoke.html';
const SURFACE_MANAGER_QUALITY_SMOKE_FIXTURE_PATH = 'tests/browser/fixtures/surface-manager-quality-smoke.html';
const A11Y_FOCUS_KEYBOARD_FIXTURE_PATH = 'tests/browser/fixtures/a11y-focus-keyboard-smoke.html';
const EPIC11_UX_COMPATIBILITY_FIXTURE_PATH = 'tests/browser/fixtures/epic11-ux-compatibility-smoke.html';
const EPIC11_THEME_MATRIX_FIXTURE_PATH = 'tests/browser/fixtures/epic11-theme-matrix-smoke.html';
const EPIC13_TRUSTED_DOM_BOUNDARY_FIXTURE_PATH = 'tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html';
const RMT_VNEXT_REFERENCE_SMOKE_FIXTURE_PATH = 'tests/browser/fixtures/rmt-vnext-reference-smoke.html';
const CORE_FLOW_MANIFEST_PATH = 'tests/browser/fixtures/components/manifest.json';
const XALERT_COMPONENT_PATH = 'components/xalert.js';
const BROWSER_FIXTURES = [
  {
    label: 'Custom Element smoke fixture',
    path: CUSTOM_ELEMENT_FIXTURE_PATH,
    resultKey: '__xtendBrowserSmokeResult'
  },
  {
    label: 'Core flow smoke fixture',
    path: CORE_FLOW_FIXTURE_PATH,
    resultKey: '__xtendCoreSmokeResult'
  },
  {
    label: 'XTendRMT XRouter XTend smoke fixture',
    path: RMT_XROUTER_XTEND_FIXTURE_PATH,
    resultKey: '__xtendRmtBrowserSmokeResult'
  },
  {
    label: 'RMT-first Demo App smoke fixture',
    path: RMT_FIRST_DEMO_SMOKE_FIXTURE_PATH,
    resultKey: '__xtendRmtFirstDemoSmokeResult'
  },
  {
    label: 'SurfaceManager quality smoke fixture',
    path: SURFACE_MANAGER_QUALITY_SMOKE_FIXTURE_PATH,
    resultKey: '__xtendSurfaceQualitySmokeResult'
  },
  {
    label: 'A11y focus keyboard smoke fixture',
    path: A11Y_FOCUS_KEYBOARD_FIXTURE_PATH,
    resultKey: '__xtendA11yKeyboardSmokeResult'
  },
  {
    label: 'Epic 11 UX compatibility smoke fixture',
    path: EPIC11_UX_COMPATIBILITY_FIXTURE_PATH,
    resultKey: '__xtendEpic11UxSmokeResult'
  },
  {
    label: 'Epic 11 Component Shell Theme Matrix fixture',
    path: EPIC11_THEME_MATRIX_FIXTURE_PATH,
    resultKey: '__xtendEpic11ThemeMatrixResult'
  },
  {
    label: 'Epic 13 Trusted DOM Boundary fixture',
    path: EPIC13_TRUSTED_DOM_BOUNDARY_FIXTURE_PATH,
    resultKey: '__xtendEpic13TrustedDomBoundaryResult'
  },
  {
    label: 'RMT vNext reference smoke fixture',
    path: RMT_VNEXT_REFERENCE_SMOKE_FIXTURE_PATH,
    resultKey: '__xtendRmtVNextSmokeResult'
  }
];
const CORE_FLOW_MANIFEST_CONTRACT = {
  xstate: '/components/xstate.js',
  'x-theme': '/components/xtheme.js',
  'x-router': '/components/xrouter.js',
  'x-link': '/components/xlink.js',
  'x-dialog': '/components/xdialog.js',
  'x-modal': '/components/xmodal.js',
  'x-input': '/components/xinput.js',
  'x-select': '/components/xselect.js',
  'x-checkbox': '/components/xcheckbox.js',
  'x-form': '/components/xform.js',
  'x-tabs': '/components/xtabs.js',
  'x-alert': '/components/xalert.js',
  'x-toast': '/components/xtoast.js',
  'x-status': '/components/xstatus.js',
  'x-progress': '/components/xprogress.js',
  'x-drawer': '/components/xdrawer.js',
  'x-section': '/components/xsection.js',
  'x-cards': '/components/xcards.js',
  'x-code': '/components/xcode.js',
  'x-player': '/components/xplayer.js'
};

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

function requestText(url) {
  const target = new URL(url);
  const origin = `${target.protocol}//${target.host}`;
  const rawPath = String(url).startsWith(origin)
    ? String(url).slice(origin.length) || '/'
    : `${target.pathname}${target.search}`;
  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: target.hostname,
      port: target.port,
      path: rawPath,
      method: 'GET'
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body
        });
      });
    });

    request.on('error', reject);
    request.end();
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createStaticServer(rootDir, defaultFixturePath = CUSTOM_ELEMENT_FIXTURE_PATH) {
  return listenXtendDevServer({
    rootDir,
    defaultPath: defaultFixturePath,
    port: 0
  });
}

function findSafariDriver() {
  const candidates = [
    '/System/Cryptexes/App/usr/bin/safaridriver',
    '/usr/bin/safaridriver'
  ];

  return candidates.find((candidate) => {
    try {
      require('fs').accessSync(candidate);
      return true;
    } catch (_) {
      return false;
    }
  }) || null;
}

async function waitForWebDriver(port, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await requestJson({
        hostname: '127.0.0.1',
        port,
        path: '/status',
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

async function runSafariWebDriverSmoke(rootDir, fixture) {
  const driverPath = findSafariDriver();
  if (!driverPath) {
    throw new Error('safaridriver was not found');
  }

  const driverPort = 57931;
  const driver = spawn(driverPath, ['-p', String(driverPort)], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let sessionId = null;
  let staticServer = null;

  try {
    const ready = await waitForWebDriver(driverPort);
    if (!ready) {
      throw new Error('safaridriver did not become ready');
    }

    staticServer = await createStaticServer(rootDir, fixture.path);

    const session = await requestJson({
      hostname: '127.0.0.1',
      port: driverPort,
      path: '/session',
      method: 'POST'
    }, {
      capabilities: {
        alwaysMatch: {
          browserName: 'safari'
        }
      }
    });

    const sessionValue = session.body && session.body.value;
    sessionId = sessionValue && sessionValue.sessionId;
    if (!sessionId) {
      throw new Error('safaridriver did not create a session');
    }

    await requestJson({
      hostname: '127.0.0.1',
      port: driverPort,
      path: `/session/${sessionId}/url`,
      method: 'POST'
    }, {
      url: `${staticServer.origin}/${fixture.path}`
    });

    const started = Date.now();
    while (Date.now() - started < 5000) {
      const response = await requestJson({
        hostname: '127.0.0.1',
        port: driverPort,
        path: `/session/${sessionId}/execute/sync`,
        method: 'POST'
      }, {
        script: `return window[${JSON.stringify(fixture.resultKey)}] || null;`,
        args: []
      });

      const value = response.body && response.body.value;
      if (value && value.status && value.status !== 'pending') {
        return value;
      }
      await wait(100);
    }

    throw new Error('browser smoke fixture did not complete');
  } finally {
    if (sessionId) {
      await requestJson({
        hostname: '127.0.0.1',
        port: driverPort,
        path: `/session/${sessionId}`,
        method: 'DELETE'
      }).catch(() => {});
    }

    if (staticServer) {
      await new Promise((resolve) => staticServer.server.close(resolve));
    }

    driver.kill();
  }
}

function assertCustomElementFixtureContract(context, rootDir) {
  const fixture = readText(CUSTOM_ELEMENT_FIXTURE_PATH, rootDir);
  const componentSource = readText(XALERT_COMPONENT_PATH, rootDir);
  context.assert(fixture.includes('<x-alert'), 'Browser fixture contains an XTend custom element');
  context.assert(fixture.includes('/components/xalert.js'), 'Browser fixture loads the x-alert component script');
  context.assert(fixture.includes('__xtendBrowserSmokeResult'), 'Browser fixture exposes a smoke result object');
  context.assert(fixture.includes('customElements.whenDefined'), 'Browser fixture waits for Custom Element registration');
  context.assert(fixture.includes("recordCheck('shadow root rendered'"), 'Browser fixture verifies shadow DOM rendering');
  context.assert(fixture.includes("recordCheck('body visible'"), 'Browser fixture verifies visible UI activation');
  context.assert(fixture.includes("recordCheck('state synchronized'"), 'Browser fixture verifies xstate synchronization');
  context.assert(componentSource.includes("customElements.define('x-alert'"), 'x-alert source registers the Custom Element');
  context.assert(componentSource.includes("attachShadow({ mode: 'open' })"), 'x-alert source creates open shadow DOM');
  context.assert(componentSource.includes('xtend.component.x-alert.'), 'x-alert source uses the canonical xstate key');
  context.assert(componentSource.includes('alert-dismissed'), 'x-alert source exposes its dismissal event contract');
}

async function assertLocalDevServerContract(context, rootDir) {
  let handle = null;
  try {
    handle = await createStaticServer(rootDir, CUSTOM_ELEMENT_FIXTURE_PATH);
    context.assert(handle.schema === SERVER_CONTRACT, 'Browser harness uses the shared XTend local dev server contract');
    context.assert(handle.port > 0, 'XTend local dev server supports test-mode port 0');

    const htmlResponse = await requestText(`${handle.origin}/${CUSTOM_ELEMENT_FIXTURE_PATH}`);
    context.assert(htmlResponse.statusCode === 200, 'XTend local dev server serves HTML fixtures');
    context.assert(htmlResponse.headers['content-type'].includes('text/html'), 'XTend local dev server serves HTML MIME type');

    const jsResponse = await requestText(`${handle.origin}/xtend-loader.js`);
    context.assert(jsResponse.statusCode === 200, 'XTend local dev server serves JavaScript modules');
    context.assert(jsResponse.headers['content-type'].includes('text/javascript'), 'XTend local dev server serves JavaScript MIME type');

    const jsonResponse = await requestText(`${handle.origin}/${CORE_FLOW_MANIFEST_PATH}`);
    context.assert(jsonResponse.statusCode === 200, 'XTend local dev server serves JSON manifests');
    context.assert(jsonResponse.headers['content-type'].includes('application/json'), 'XTend local dev server serves JSON MIME type');

    const forbiddenResponse = await requestText(`${handle.origin}/%2e%2e/package.json`);
    context.assert(forbiddenResponse.statusCode === 403 || forbiddenResponse.statusCode === 404, 'XTend local dev server rejects path traversal');
  } catch (error) {
    context.fail(`XTend local dev server contract (${error.message})`);
  } finally {
    if (handle && handle.server) {
      await new Promise((resolve) => handle.server.close(resolve));
    }
  }
}

function assertCoreFlowFixtureContract(context, rootDir) {
  const fixture = readText(CORE_FLOW_FIXTURE_PATH, rootDir);
  const manifest = readJson(CORE_FLOW_MANIFEST_PATH, rootDir);
  const loaderSource = readText('xtend-loader.js', rootDir);
  const apiSource = readText('api.js', rootDir);
  const routerSource = readText('components/xrouter.js', rootDir);
  const themeSource = readText('components/xtheme.js', rootDir);
  const dialogSource = readText('components/xdialog.js', rootDir);
  const modalSource = readText('components/xmodal.js', rootDir);
  const toastSource = readText('components/xtoast.js', rootDir);

  context.assert(fixture.includes('/xtend-loader.js'), 'Core flow fixture loads the XTend loader');
  context.assert(fixture.includes('type="module" src="/xtend-loader.js"'), 'Core flow fixture loads the canonical ESM XTend loader');
  context.assert(fixture.includes('data-manifest="/tests/browser/fixtures/components/manifest.json"'), 'Core flow fixture configures the loader manifest locally');
  context.assert(fixture.includes('name="xtend-preload"'), 'Core flow fixture preloads core runtime components');
  context.assert(!fixture.includes('type="importmap"'), 'Core flow fixture no longer needs CDN import map bridging');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de/xtend'), 'Core flow fixture has no XTend CDN dependency');
  context.assert(fixture.includes('__xtendCoreSmokeResult'), 'Core flow fixture exposes a core smoke result object');
  context.assert(fixture.includes("recordCheck('loader kept body visible by default'"), 'Core flow fixture verifies shell-first visible body default');
  context.assert(fixture.includes("recordCheck('api compliance ready'"), 'Core flow fixture verifies API initialization');
  context.assert(fixture.includes("recordCheck('router rendered detail route'"), 'Core flow fixture verifies router rendering');
  context.assert(fixture.includes("recordCheck('theme state synchronized'"), 'Core flow fixture verifies theme state synchronization');
  context.assert(fixture.includes("recordCheck('toast api rendered visible component'"), 'Core flow fixture verifies toast API rendering');
  context.assert(fixture.includes("recordCheck('alert api rendered visible component'"), 'Core flow fixture verifies alert API rendering');
  context.assert(fixture.includes("recordCheck('dialog open state synchronized'"), 'Core flow fixture verifies dialog open-state synchronization');
  context.assert(fixture.includes("recordCheck('modal open state synchronized'"), 'Core flow fixture verifies modal open-state synchronization');

  Object.entries(CORE_FLOW_MANIFEST_CONTRACT).forEach(([tag, expectedPath]) => {
    context.assert(manifest[tag] === expectedPath, `Core flow fixture manifest resolves ${tag} locally`);
  });

  context.assert(loaderSource.includes('loadCoreModules(manifest)'), 'XTend loader invokes core module loading');
  context.assert(loaderSource.includes('preloadManifestComponents(manifest)'), 'XTend loader supports preload-driven browser smokes');
  context.assert(loaderSource.includes('prepareConfiguredUiEffects'), 'XTend loader supports opt-in UI effects');
  context.assert(!loaderSource.includes('await waitForWindowLoad()'), 'XTend loader no longer waits for full window load before shell hydration');
  context.assert(loaderSource.includes('data-manifest'), 'XTend loader supports data-manifest overrides');
  context.assert(loaderSource.includes('data-module-cache-bust'), 'XTend loader supports module cache busting for live deployments');
  context.assert(loaderSource.includes("tag === 'xstate'"), 'XTend loader avoids cache-busting xstate to prevent duplicate state module instances');
  context.assert(loaderSource.includes('window.XTendLoader'), 'XTend loader exposes the canonical browser loader namespace');
  context.assert(loaderSource.includes('ensureComponent'), 'XTend loader exposes dynamic component loading for routed subtrees');
  context.assert(loaderSource.includes('hydrateTree'), 'XTend loader exposes dynamic subtree hydration for SPA route content');
  context.assert(loaderSource.includes('xtend-loader-tree-hydrated'), 'XTend loader emits a dynamic tree hydration event');
  context.assert(loaderSource.includes("const verbose_mode = 'auto'"), 'XTend loader keeps PROD verbose mode auto-gated by default');
  context.assert(loaderSource.includes('verbose: configureLoaderVerbose'), 'XTend loader exposes a browser console verbose command');
  context.assert(loaderSource.includes('xtend.loader.verbose'), 'XTend loader persists auto verbose activation in tab storage');
  context.assert(loaderSource.includes('loaderVerboseLog'), 'XTend loader gates module load logs behind the verbose wrapper');
  context.assert(loaderSource.includes('api.initXTendAPI(manifest)'), 'XTend loader initializes the browser API after loading');
  context.assert(loaderSource.includes('await api.initXTendAPI(manifest)'), 'XTend loader awaits browser API initialization before completing boot');
  context.assert(apiSource.includes('setupXToastAPI(manifest)'), 'API initializes the toast runtime');
  context.assert(apiSource.includes('applyToastContainerLayout'), 'API owns native toast stack layout instead of host middleware');
  context.assert(apiSource.includes('width = "min(24rem, calc(100vw - 2rem))"'), 'API constrains toast stack width to the viewport');
  context.assert(apiSource.includes('alignItems = "stretch"'), 'API stretches toasts inside the viewport-safe stack');
  context.assert(apiSource.includes("new CustomEvent('xtend-api-ready'"), 'API emits a ready event for host adapters');
  context.assert(apiSource.includes('setupXAlertAPI(manifest)'), 'API initializes the alert runtime');
  context.assert(apiSource.includes('setupXDialogAPI(manifest)'), 'API initializes the dialog runtime');
  context.assert(apiSource.includes('setupXModalAPI(manifest)'), 'API initializes the modal runtime');
  context.assert(apiSource.includes('setupXThemeAPI(manifest)'), 'API initializes the theme runtime');
  context.assert(routerSource.includes('router-navigate'), 'Router supports xstate-driven navigation');
  context.assert(routerSource.includes('router-rendered'), 'Router exposes rendered route state');
  context.assert(themeSource.includes("document.dispatchEvent(new CustomEvent('theme-changed'"), 'Theme runtime emits theme-changed');
  context.assert(dialogSource.includes('xtend.component.x-dialog.'), 'Dialog runtime syncs canonical open state');
  context.assert(modalSource.includes('xtend.component.x-modal.'), 'Modal runtime syncs canonical open state');
  context.assert(toastSource.includes('toast-dismissed'), 'Toast runtime exposes dismissal event contract');
}

function assertRmtXRouterXtendFixtureContract(context, rootDir) {
  const fixture = readText(RMT_XROUTER_XTEND_FIXTURE_PATH, rootDir);
  const rmtRuntime = readText('xtendrmt/rmt-runtime.browser.js', rootDir);
  const routerSource = readText('components/xrouter.js', rootDir);
  const sectionSource = readText('components/xsection.js', rootDir);
  const cardsSource = readText('components/xcards.js', rootDir);
  const bestcaseHtml = readText('xtendrmt-bestcase.html', rootDir);

  context.assert(fixture.includes('/xtendrmt/rmt-runtime.browser.js'), 'XTendRMT browser fixture loads the browser runtime bundle');
  context.assert(fixture.includes('/components/xrouter.js'), 'XTendRMT browser fixture loads XRouter');
  context.assert(fixture.includes('/components/xsection.js'), 'XTendRMT browser fixture loads x-section');
  context.assert(fixture.includes('/components/xcards.js'), 'XTendRMT browser fixture loads x-card');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de/xtend'), 'XTendRMT browser fixture has no XTend CDN dependency');
  context.assert(fixture.includes('__xtendRmtBrowserSmokeResult'), 'XTendRMT browser fixture exposes a smoke result object');
  context.assert(fixture.includes('xtend.rmt.wp16.browser-smoke-fixture.v1'), 'XTendRMT browser fixture exposes stable WP-16 fixture contract');
  context.assert(fixture.includes('createRmtFormat'), 'XTendRMT browser fixture uses createRmtFormat');
  context.assert(fixture.includes('createRmtXRouterAdapter'), 'XTendRMT browser fixture uses productive XRouter adapter');
  context.assert(fixture.includes('createRmtXtendComponentAdapter'), 'XTendRMT browser fixture uses productive XTend component adapter');
  context.assert(fixture.includes('createRmtStateSchedulerDiagnosticsBridge'), 'XTendRMT browser fixture uses productive State/Scheduler/Diagnostics bridge');
  context.assert(fixture.includes("recordCheck('rmt format normalized native document'"), 'XTendRMT browser fixture verifies native document normalization');
  context.assert(fixture.includes("recordCheck('xrouter rendered settings route'"), 'XTendRMT browser fixture verifies XRouter route changes');
  context.assert(fixture.includes("recordCheck('xtend component hydrated by adapter'"), 'XTendRMT browser fixture verifies XTend component hydration');
  context.assert(fixture.includes("recordCheck('scheduler route endpoint recorded'"), 'XTendRMT browser fixture verifies route scheduler endpoint signals');
  context.assert(fixture.includes("recordCheck('scheduler component hydrate endpoint recorded'"), 'XTendRMT browser fixture verifies component scheduler endpoint signals');
  context.assert(fixture.includes("recordCheck('vanilla host component mounted'"), 'XTendRMT browser fixture verifies framework-agnostic vanilla host path');
  context.assert(fixture.includes('vanilla.component'), 'XTendRMT browser fixture declares a non-XTend component adapter');
  context.assert(fixture.includes('xtendrmt.vanilla.mount'), 'XTendRMT browser fixture schedules the vanilla host endpoint');
  context.assert(rmtRuntime.includes('createRmtXRouterAdapter'), 'RMT browser runtime exposes productive XRouter adapter factory');
  context.assert(rmtRuntime.includes('createRmtXtendComponentAdapter'), 'RMT browser runtime exposes productive XTend component adapter factory');
  context.assert(rmtRuntime.includes('createRmtStateSchedulerDiagnosticsBridge'), 'RMT browser runtime exposes productive bridge factory');
  context.assert(routerSource.includes('registerRoutes(routes = [], options = {})'), 'XRouter source supports runtime route registration');
  context.assert(routerSource.includes('xrouter-routes-registered'), 'XRouter source emits runtime route registration signal');
  context.assert(sectionSource.includes('customElements.define("x-section"'), 'x-section source registers the Custom Element');
  context.assert(cardsSource.includes('customElements.define("x-card"'), 'x-card source registers the Custom Element');
  context.assert(bestcaseHtml.includes('type="module" src="xtend-loader.js"'), 'Bestcase demo uses the canonical XTend loader');
  context.assert(bestcaseHtml.includes('data-manifest="components/manifest.json"'), 'Bestcase demo uses the local XTend manifest');
  context.assert(bestcaseHtml.includes('window.__XTendLoaderBootPromise'), 'Bestcase demo waits for loader boot before demo runtime');
  context.assert(!bestcaseHtml.includes('type="importmap"'), 'Bestcase demo no longer uses CDN import map bridging');
  context.assert(!bestcaseHtml.includes('https://cdn.ccs-networks.de/xtend'), 'Bestcase demo has no XTend CDN dependency');
  context.assert(bestcaseHtml.includes('data-rmt-browser-smoke="wp-16"'), 'Bestcase demo references the WP-16 browser smoke contract marker');
}

function assertRmtFirstDemoFixtureContract(context, rootDir) {
  const fixture = readText(RMT_FIRST_DEMO_SMOKE_FIXTURE_PATH, rootDir);
  const demoDocument = readJson('xtendrmt/rmt-first-demo-app.rmt', rootDir);
  const demoHost = readText('xtendrmt-rmt-first-demo.html', rootDir);
  const demoRuntime = readText('xtendrmt/rmt-first-demo-app.js', rootDir);

  context.assert(fixture.includes('xtend.epic10.rmt-first-demo-app.browser-smoke.v1'), 'RMT-first demo fixture exposes stable browser contract');
  context.assert(fixture.includes('/xtend-loader.js'), 'RMT-first demo fixture loads the XTend loader');
  context.assert(fixture.includes('type="module" src="/xtend-loader.js"'), 'RMT-first demo fixture loads the canonical ESM XTend loader');
  context.assert(fixture.includes('data-manifest="/components/manifest.json"'), 'RMT-first demo fixture configures the loader manifest locally');
  context.assert(fixture.includes('/xtendrmt/rmt-runtime.browser.js'), 'RMT-first demo fixture loads the RMT browser runtime');
  context.assert(fixture.includes('/xtendrmt/rmt-first-demo-app.js'), 'RMT-first demo fixture imports the demo renderer');
  context.assert(fixture.includes('/xtendrmt/rmt-first-demo-app.rmt'), 'RMT-first demo fixture loads the RMT app document');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de/xtend'), 'RMT-first demo fixture has no XTend CDN dependency');
  context.assert(fixture.includes('__xtendRmtFirstDemoSmokeResult'), 'RMT-first demo fixture exposes a smoke result object');
  context.assert(fixture.includes("recordCheck('rmt-first demo document loaded'"), 'RMT-first demo fixture verifies document loading');
  context.assert(fixture.includes("recordCheck('rmt-first demo shell rendered from rmt'"), 'RMT-first demo fixture verifies shell rendering from RMT');
  context.assert(fixture.includes("recordCheck('rmt-first demo routes derived from rmt'"), 'RMT-first demo fixture verifies route derivation');
  context.assert(fixture.includes("recordCheck('rmt-first demo telemetry schedule visible'"), 'RMT-first demo fixture verifies telemetry schedule visibility');
  context.assert(demoDocument.manifest.metadata.contractVersion === 'xtend.epic10.rmt-first-demo-app.v1', 'RMT-first demo document declares contract version');
  context.assert(demoDocument.manifest.metadata.manualShellAllowed === false, 'RMT-first demo document forbids manual shell');
  context.assert(demoDocument.manifest.metadata.hostShellMarkup === false, 'RMT-first demo document forbids host shell markup');
  context.assert(demoDocument.routes.length === 3, 'RMT-first demo document declares three app routes');
  context.assert(demoDocument.components.some((component) => component.tag === 'x-select'), 'RMT-first demo document uses x-select');
  context.assert(demoDocument.components.some((component) => component.tag === 'x-drawer'), 'RMT-first demo document uses x-drawer');
  context.assert(demoHost.includes('data-rmt-host="rmt-first-demo"'), 'RMT-first demo host exposes an RMT root');
  context.assert(!demoHost.includes('<x-section'), 'RMT-first demo host contains no static shell component');
  context.assert(!demoHost.includes('<x-router'), 'RMT-first demo host contains no static router component');
  context.assert(!demoHost.includes('https://cdn.ccs-networks.de/xtend'), 'RMT-first demo host has no XTend CDN dependency');
  context.assert(demoRuntime.includes('renderRmtShellFromDocument'), 'RMT-first demo runtime exposes shell renderer');
  context.assert(demoRuntime.includes('renderDomDescriptor'), 'RMT-first demo runtime exposes descriptor renderer');
  context.assert(demoRuntime.includes('createRouteElement'), 'RMT-first demo runtime creates routes from RMT');
  context.assert(!demoRuntime.includes('innerHTML'), 'RMT-first demo runtime avoids string HTML rendering');
}

function assertSurfaceManagerQualityFixtureContract(context, rootDir) {
  const fixture = readText(SURFACE_MANAGER_QUALITY_SMOKE_FIXTURE_PATH, rootDir);
  const managerSource = readText('components/xsurfacemanager.js', rootDir);
  const windowSource = readText('components/xsurfacewindow.js', rootDir);
  const sidePanelSource = readText('components/xsidepanel.js', rootDir);
  const overlayBridgeSource = readText('components/xsurfaceoverlay-bridge.js', rootDir);
  const modalSource = readText('components/xmodal.js', rootDir);
  const dialogSource = readText('components/xdialog.js', rootDir);
  const drawerSource = readText('components/xdrawer.js', rootDir);

  context.assert(fixture.includes('xtend.surface.quality-gates.browser-smoke.v1'), 'SurfaceManager quality fixture exposes stable browser contract');
  context.assert(fixture.includes('__xtendSurfaceQualitySmokeResult'), 'SurfaceManager quality fixture exposes smoke result');
  context.assert(fixture.includes('/components/xsurfacemanager-controller.js'), 'SurfaceManager quality fixture loads controller');
  context.assert(fixture.includes('/components/xsurfaceoverlay-bridge.js'), 'SurfaceManager quality fixture loads overlay bridge');
  context.assert(fixture.includes('/components/xsurfacemanager.js'), 'SurfaceManager quality fixture loads manager');
  context.assert(fixture.includes('/components/xsurfacewindow.js'), 'SurfaceManager quality fixture loads windows');
  context.assert(fixture.includes('/components/xsidepanel.js'), 'SurfaceManager quality fixture loads side panels');
  context.assert(fixture.includes('/components/xmodal.js'), 'SurfaceManager quality fixture loads modal');
  context.assert(fixture.includes('/components/xdialog.js'), 'SurfaceManager quality fixture loads dialog');
  context.assert(fixture.includes('/components/xdrawer.js'), 'SurfaceManager quality fixture loads drawer');
  context.assert(fixture.includes('data-quality-gate="surface-manager-mixed-stack"'), 'SurfaceManager quality fixture marks mixed stack root');
  context.assert(fixture.includes('<x-surface-window'), 'SurfaceManager quality fixture renders windows');
  context.assert(fixture.includes('<x-side-panel'), 'SurfaceManager quality fixture renders side panel');
  context.assert(fixture.includes('<x-modal'), 'SurfaceManager quality fixture renders modal overlay');
  context.assert(fixture.includes('<x-dialog'), 'SurfaceManager quality fixture renders dialog overlay');
  context.assert(fixture.includes('<x-drawer'), 'SurfaceManager quality fixture renders drawer overlay');
  context.assert(fixture.includes('surface-overlay-command'), 'SurfaceManager quality fixture opens overlays through bridge command');
  context.assert(fixture.includes('performance.mark'), 'SurfaceManager quality fixture records performance marks');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de'), 'SurfaceManager quality fixture has no XTend CDN dependency');

  [
    'surface quality all components defined',
    'surface quality mixed stack registered',
    'surface quality overlay command opened modal',
    'surface quality drawer participates in stack',
    'surface quality side panel responsive mode visible',
    'surface quality a11y roles available',
    'surface quality z order css variables applied',
    'surface quality legacy overlay events preserved',
    'surface quality performance marks recorded',
    'surface quality no external network dependency'
  ].forEach((check) => {
    context.assert(fixture.includes(`recordCheck('${check}'`), `SurfaceManager quality fixture records ${check}`);
  });

  context.assert(managerSource.includes('surface-overlay-command'), 'SurfaceManager runtime supports overlay command bridge');
  context.assert(managerSource.includes('role="application"'), 'SurfaceManager runtime exposes application role');
  context.assert(managerSource.includes('aria-live="polite"'), 'SurfaceManager runtime exposes live status');
  context.assert(windowSource.includes('role="dialog"'), 'Surface window runtime exposes dialog role');
  context.assert(windowSource.includes('(prefers-reduced-motion: reduce)'), 'Surface window runtime supports reduced motion');
  context.assert(sidePanelSource.includes('responsive-mode'), 'SidePanel runtime supports responsive mode');
  context.assert(sidePanelSource.includes('role="complementary"'), 'SidePanel runtime exposes complementary role');
  context.assert(overlayBridgeSource.includes('applyOverlaySurfaceSnapshot'), 'Overlay bridge applies controller snapshots');
  context.assert(modalSource.includes('focusTrap'), 'Modal runtime declares focus trap profile');
  context.assert(dialogSource.includes('focusTrap'), 'Dialog runtime declares focus trap profile');
  context.assert(drawerSource.includes('conditional-when-modal'), 'Drawer runtime declares conditional modal focus trap');
}

function assertA11yFocusKeyboardFixtureContract(context, rootDir) {
  const fixture = readText(A11Y_FOCUS_KEYBOARD_FIXTURE_PATH, rootDir);
  const linkSource = readText('components/xlink.js', rootDir);
  const modalSource = readText('components/xmodal.js', rootDir);
  const dialogSource = readText('components/xdialog.js', rootDir);
  const inputSource = readText('components/xinput.js', rootDir);
  const formSource = readText('components/xform.js', rootDir);
  const tabsSource = readText('components/xtabs.js', rootDir);

  context.assert(fixture.includes('xtend.a11y.browser-keyboard-smoke.v1'), 'A11y keyboard fixture exposes stable browser contract');
  context.assert(fixture.includes('/xtend-loader.js'), 'A11y keyboard fixture loads the XTend loader');
  context.assert(fixture.includes('type="module" src="/xtend-loader.js"'), 'A11y keyboard fixture loads the canonical ESM XTend loader');
  context.assert(fixture.includes('data-manifest="/tests/browser/fixtures/components/manifest.json"'), 'A11y keyboard fixture configures the loader manifest locally');
  context.assert(fixture.includes('name="xtend-preload"'), 'A11y keyboard fixture preloads keyboard-relevant components');
  context.assert(!fixture.includes('type="importmap"'), 'A11y keyboard fixture needs no CDN import map bridging');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de/xtend'), 'A11y keyboard fixture has no XTend CDN dependency');
  context.assert(fixture.includes('__xtendA11yKeyboardSmokeResult'), 'A11y keyboard fixture exposes a smoke result object');
  context.assert(fixture.includes("recordCheck('x-link enter key navigated route'"), 'A11y keyboard fixture verifies Enter routing');
  context.assert(fixture.includes("recordCheck('x-link space key navigated route'"), 'A11y keyboard fixture verifies Space routing');
  context.assert(fixture.includes("recordCheck('x-input delegated focus'"), 'A11y keyboard fixture verifies input focus delegation');
  context.assert(fixture.includes("recordCheck('x-form captured keyboard input data'"), 'A11y keyboard fixture verifies form input synchronization');
  context.assert(fixture.includes("recordCheck('x-tabs arrow right selected next tab'"), 'A11y keyboard fixture verifies ArrowRight tabs navigation');
  context.assert(fixture.includes("recordCheck('x-tabs arrow left selected previous tab'"), 'A11y keyboard fixture verifies ArrowLeft tabs navigation');
  context.assert(fixture.includes("recordCheck('x-modal initial focus moved inside overlay'"), 'A11y keyboard fixture verifies overlay initial focus');
  context.assert(fixture.includes("recordCheck('x-modal tab focus trap wrapped to first control'"), 'A11y keyboard fixture verifies forward focus trap');
  context.assert(fixture.includes("recordCheck('x-modal shift tab focus trap wrapped to last control'"), 'A11y keyboard fixture verifies reverse focus trap');
  context.assert(fixture.includes("recordCheck('x-modal escape restored focus to origin'"), 'A11y keyboard fixture verifies Escape close and focus restore');
  context.assert(fixture.includes("querySelector('.x-modal-close')"), 'A11y keyboard fixture targets the productive modal close control');
  context.assert(linkSource.includes("_onKeyDown(e)"), 'x-link source exposes keyboard handler');
  context.assert(linkSource.includes("e.key === 'Enter' || e.key === ' '"), 'x-link source supports Enter and Space activation');
  context.assert(linkSource.includes('aria-current'), 'x-link source syncs active route state to aria-current');
  context.assert(modalSource.includes("event.key !== 'Tab'"), 'x-modal source implements Tab focus-trap guard');
  context.assert(modalSource.includes("event.key === 'Escape'"), 'x-modal source supports Escape dismissal');
  context.assert(modalSource.includes('_lastFocusedElement.focus'), 'x-modal source restores focus after close');
  context.assert(dialogSource.includes("event.key !== 'Tab'"), 'x-dialog source keeps overlay focus-trap parity');
  context.assert(dialogSource.includes("event.key === 'Escape'"), 'x-dialog source keeps Escape dismissal parity');
  context.assert(inputSource.includes('focus()'), 'x-input source exposes delegated focus');
  context.assert(inputSource.includes('input-changed'), 'x-input source emits input-changed for form synchronization');
  context.assert(formSource.includes('x-input, x-slider, x-calendar'), 'x-form source observes XTend form controls');
  context.assert(formSource.includes('getFormData()'), 'x-form source exposes form data collection');
  context.assert(tabsSource.includes('ArrowRight'), 'x-tabs source supports ArrowRight navigation');
  context.assert(tabsSource.includes('ArrowLeft'), 'x-tabs source supports ArrowLeft navigation');
  context.assert(tabsSource.includes('e.key === "Enter" || e.key === " "'), 'x-tabs source supports Enter and Space activation');
}

function assertEpic11UxCompatibilityFixtureContract(context, rootDir) {
  const fixture = readText(EPIC11_UX_COMPATIBILITY_FIXTURE_PATH, rootDir);
  const manifest = readJson(CORE_FLOW_MANIFEST_PATH, rootDir);
  const inputSource = readText('components/xinput.js', rootDir);
  const formSource = readText('components/xform.js', rootDir);
  const modalSource = readText('components/xmodal.js', rootDir);
  const routerSource = readText('components/xrouter.js', rootDir);
  const statusSource = readText('components/xstatus.js', rootDir);
  const progressSource = readText('components/xprogress.js', rootDir);
  const playerSource = readText('components/xplayer.js', rootDir);

  context.assert(fixture.includes('xtend.epic11.component-ux-browser-smokes.v1'), 'Epic 11 UX fixture exposes stable browser contract');
  context.assert(fixture.includes('/xtend-loader.js'), 'Epic 11 UX fixture loads the XTend loader');
  context.assert(fixture.includes('type="module"'), 'Epic 11 UX fixture uses the canonical ESM loader mode');
  context.assert(fixture.includes('data-manifest="/tests/browser/fixtures/components/manifest.json"'), 'Epic 11 UX fixture configures the loader manifest locally');
  context.assert(fixture.includes('name="xtend-preload"'), 'Epic 11 UX fixture preloads representative UX components');
  context.assert(!fixture.includes('type="importmap"'), 'Epic 11 UX fixture needs no CDN import map bridging');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de/xtend'), 'Epic 11 UX fixture has no XTend CDN dependency');
  context.assert(fixture.includes('__xtendEpic11UxSmokeResult'), 'Epic 11 UX fixture exposes a smoke result object');
  context.assert(fixture.includes("recordCheck('navigation enter key rendered detail route'"), 'Epic 11 UX fixture verifies route activation');
  context.assert(fixture.includes("recordCheck('navigation active state synchronized'"), 'Epic 11 UX fixture verifies x-link active state');
  context.assert(fixture.includes("recordCheck('route announcement state visible'"), 'Epic 11 UX fixture verifies route announcement');
  context.assert(fixture.includes("recordCheck('tabs arrow key selected next tab'"), 'Epic 11 UX fixture verifies x-tabs arrow navigation');
  context.assert(fixture.includes("recordCheck('tabs home end keys preserve roving focus'"), 'Epic 11 UX fixture verifies x-tabs Home/End navigation');
  context.assert(fixture.includes("recordCheck('tabs aria controls visible panel'"), 'Epic 11 UX fixture verifies x-tabs ARIA panel wiring');
  context.assert(fixture.includes("recordCheck('form input synchronized state'"), 'Epic 11 UX fixture verifies input state synchronization');
  context.assert(fixture.includes("recordCheck('form data aggregation visible'"), 'Epic 11 UX fixture verifies form aggregation');
  context.assert(fixture.includes("recordCheck('form validation feedback surfaced'"), 'Epic 11 UX fixture verifies form validation feedback');
  context.assert(fixture.includes("recordCheck('feedback live region components rendered'"), 'Epic 11 UX fixture verifies feedback live regions');
  context.assert(fixture.includes("recordCheck('feedback progress state visible'"), 'Epic 11 UX fixture verifies progress state');
  context.assert(fixture.includes("recordCheck('toast api rendered ux notification'"), 'Epic 11 UX fixture verifies toast API rendering');
  context.assert(fixture.includes("recordCheck('overlay modal moved focus inside'"), 'Epic 11 UX fixture verifies modal focus handoff');
  context.assert(fixture.includes("recordCheck('overlay escape restored focus'"), 'Epic 11 UX fixture verifies Escape close and focus restore');
  context.assert(fixture.includes("recordCheck('drawer custom element available'"), 'Epic 11 UX fixture verifies drawer availability');
  context.assert(fixture.includes("recordCheck('layout shell components available'"), 'Epic 11 UX fixture verifies layout custom elements');
  context.assert(fixture.includes("recordCheck('layout display surface rendered'"), 'Epic 11 UX fixture verifies display shell rendering');
  context.assert(fixture.includes("recordCheck('media shell remains lazy-loadable'"), 'Epic 11 UX fixture verifies lazy media shell');

  Object.entries(CORE_FLOW_MANIFEST_CONTRACT).forEach(([tag, expectedPath]) => {
    context.assert(manifest[tag] === expectedPath, `Epic 11 UX fixture manifest resolves ${tag} locally`);
  });

  context.assert(inputSource.includes('input-changed'), 'x-input source exposes productive input synchronization event');
  context.assert(formSource.includes('getFormData()'), 'x-form source exposes productive form aggregation API');
  context.assert(modalSource.includes("event.key === 'Escape'"), 'x-modal source supports Escape dismissal for Epic 11 UX smoke');
  context.assert(routerSource.includes('router-rendered'), 'x-router source exposes rendered route state for Epic 11 UX smoke');
  context.assert(statusSource.includes('aria-live'), 'x-status source exposes live region semantics for Epic 11 UX smoke');
  context.assert(progressSource.includes('role="progressbar"'), 'x-progress source exposes progressbar semantics for Epic 11 UX smoke');
  context.assert(playerSource.includes('xtendLayoutDisplayMediaUxProfile'), 'x-player source exposes lazy media UX profile');
}

function assertEpic11ThemeMatrixFixtureContract(context, rootDir) {
  const fixture = readText(EPIC11_THEME_MATRIX_FIXTURE_PATH, rootDir);
  const manifest = readJson(CORE_FLOW_MANIFEST_PATH, rootDir);

  context.assert(fixture.includes('xtend.epic11.component-shell-theme-matrix.v1'), 'Epic 11 Theme Matrix fixture exposes stable browser contract');
  context.assert(fixture.includes('/xtend-loader.js'), 'Epic 11 Theme Matrix fixture loads the XTend loader');
  context.assert(fixture.includes('type="module"'), 'Epic 11 Theme Matrix fixture uses the canonical ESM loader mode');
  context.assert(fixture.includes('data-manifest="/tests/browser/fixtures/components/manifest.json"'), 'Epic 11 Theme Matrix fixture configures the loader manifest locally');
  context.assert(fixture.includes('name="xtend-preload"'), 'Epic 11 Theme Matrix fixture preloads representative UX components');
  context.assert(!fixture.includes('type="importmap"'), 'Epic 11 Theme Matrix fixture needs no CDN import map bridging');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de/xtend'), 'Epic 11 Theme Matrix fixture has no XTend CDN dependency');
  context.assert(fixture.includes('__xtendEpic11ThemeMatrixResult'), 'Epic 11 Theme Matrix fixture exposes a smoke result object');
  context.assert(fixture.includes("recordCheck('theme matrix light tokens applied'"), 'Epic 11 Theme Matrix fixture verifies light theme tokens');
  context.assert(fixture.includes("recordCheck('theme matrix dark tokens applied'"), 'Epic 11 Theme Matrix fixture verifies dark theme tokens');
  context.assert(fixture.includes("recordCheck('theme matrix high contrast tokens applied'"), 'Epic 11 Theme Matrix fixture verifies high contrast tokens');
  context.assert(fixture.includes("recordCheck('theme matrix forced colors contract visible'"), 'Epic 11 Theme Matrix fixture verifies forced-colors contract');
  context.assert(fixture.includes("recordCheck('theme matrix reduced motion contract visible'"), 'Epic 11 Theme Matrix fixture verifies reduced motion contract');
  context.assert(fixture.includes("recordCheck('theme matrix comfortable density applied'"), 'Epic 11 Theme Matrix fixture verifies comfortable density');
  context.assert(fixture.includes("recordCheck('theme matrix compact density applied'"), 'Epic 11 Theme Matrix fixture verifies compact density');
  context.assert(fixture.includes("recordCheck('theme matrix dense density applied'"), 'Epic 11 Theme Matrix fixture verifies dense density');
  context.assert(fixture.includes("recordCheck('theme matrix desktop viewport contract visible'"), 'Epic 11 Theme Matrix fixture verifies desktop viewport contract');
  context.assert(fixture.includes("recordCheck('theme matrix tablet viewport contract visible'"), 'Epic 11 Theme Matrix fixture verifies tablet viewport contract');
  context.assert(fixture.includes("recordCheck('theme matrix mobile viewport contract visible'"), 'Epic 11 Theme Matrix fixture verifies mobile viewport contract');
  context.assert(fixture.includes("recordCheck('form controls visual states covered'"), 'Epic 11 Theme Matrix fixture verifies form visual states');
  context.assert(fixture.includes("recordCheck('feedback status visual states covered'"), 'Epic 11 Theme Matrix fixture verifies feedback visual states');
  context.assert(fixture.includes("recordCheck('navigation routing visual states covered'"), 'Epic 11 Theme Matrix fixture verifies navigation visual states');
  context.assert(fixture.includes("recordCheck('navigation tabs aria states covered'"), 'Epic 11 Theme Matrix fixture verifies x-tabs ARIA visual states');
  context.assert(fixture.includes("recordCheck('navigation tabs keyboard states covered'"), 'Epic 11 Theme Matrix fixture verifies x-tabs keyboard visual states');
  context.assert(fixture.includes("recordCheck('overlay interaction visual states covered'"), 'Epic 11 Theme Matrix fixture verifies overlay visual states');
  context.assert(fixture.includes("recordCheck('layout display media visual states covered'"), 'Epic 11 Theme Matrix fixture verifies layout/media visual states');
  context.assert(fixture.includes("recordCheck('visual matrix remains local only'"), 'Epic 11 Theme Matrix fixture verifies local-only policy');

  Object.entries(CORE_FLOW_MANIFEST_CONTRACT).forEach(([tag, expectedPath]) => {
    context.assert(manifest[tag] === expectedPath, `Epic 11 Theme Matrix fixture manifest resolves ${tag} locally`);
  });
}

function assertEpic13TrustedDomBoundaryFixtureContract(context, rootDir) {
  const fixture = readText(EPIC13_TRUSTED_DOM_BOUNDARY_FIXTURE_PATH, rootDir);
  const pageLoader = readText('docs/utils/pageloader.js', rootDir);
  const policySource = readText('security/trusted-dom-policy.js', rootDir);

  context.assert(fixture.includes('xtend.epic13.trusted-dom-boundary-browser-smoke.v1'), 'Epic 13 Trusted DOM fixture exposes stable browser contract');
  context.assert(fixture.includes('/docs/utils/pageloader.js'), 'Epic 13 Trusted DOM fixture loads the Docs page loader');
  context.assert(fixture.includes('nonce="xtend-e13-trusted-dom-boundary"'), 'Epic 13 Trusted DOM fixture uses nonce scripts');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de/xtend'), 'Epic 13 Trusted DOM fixture has no XTend CDN dependency');
  context.assert(!fixture.includes('type="importmap"'), 'Epic 13 Trusted DOM fixture has no importmap');
  context.assert(fixture.includes('__xtendEpic13TrustedDomBoundaryResult'), 'Epic 13 Trusted DOM fixture exposes a smoke result object');
  context.assert(fixture.includes("recordCheck('parsedown content sanitized before innerhtml sink'"), 'Epic 13 Trusted DOM fixture verifies Parsedown sanitizing');
  context.assert(fixture.includes("recordCheck('script element removed from parsedown html'"), 'Epic 13 Trusted DOM fixture verifies script removal');
  context.assert(fixture.includes("recordCheck('event handler attributes removed'"), 'Epic 13 Trusted DOM fixture verifies event handler removal');
  context.assert(fixture.includes("recordCheck('javascript urls removed'"), 'Epic 13 Trusted DOM fixture verifies javascript URL removal');
  context.assert(fixture.includes("recordCheck('malicious script did not execute'"), 'Epic 13 Trusted DOM fixture verifies non-execution');
  context.assert(fixture.includes("recordCheck('parsedown inline code entities normalized'"), 'Epic 13 Trusted DOM fixture verifies Parsedown inline code entity normalization');
  context.assert(fixture.includes("recordCheck('sanitizer records code entity normalization'"), 'Epic 13 Trusted DOM fixture verifies sanitizer normalization diagnostics');
  context.assert(fixture.includes("recordCheck('docs rendered shell avoids horizontal overflow'"), 'Epic 13 Trusted DOM fixture verifies Docs shell horizontal overflow safety');
  context.assert(pageLoader.includes('sanitizeDocsTrustedDomHtml'), 'Docs page loader exposes Trusted DOM sanitizer');
  context.assert(pageLoader.includes('normalizeDocsParsedownCodeEntities'), 'Docs page loader normalizes Parsedown inline code entities');
  context.assert(pageLoader.includes('normalizedCodeEntityCount'), 'Docs page loader exposes code normalization diagnostics');
  context.assert(pageLoader.includes('applyDocsTrustedDomHtml(shell.mdContent'), 'Docs page loader applies sanitizer before content sink');
  context.assert(pageLoader.includes('data-rmt-trusted-dom-proof'), 'Docs page loader marks Trusted DOM proof on sink');
  context.assert(policySource.includes('sanitizeTrustedDomHtml'), 'Trusted DOM policy exposes sanitizer contract helper');
  context.assert(policySource.includes('TRUSTED_DOM_SANITIZER_CONTRACT'), 'Trusted DOM policy defines sanitizer contract');
}

function assertRmtVNextReferenceFixtureContract(context, rootDir) {
  const fixture = readText(RMT_VNEXT_REFERENCE_SMOKE_FIXTURE_PATH, rootDir);

  context.assert(fixture.includes('xtend.rmt.vnext-browser-smoke.v1'), 'RMT vNext reference fixture exposes stable browser contract');
  context.assert(fixture.includes('data-rmt-vnext-smoke="wp-e15-17"'), 'RMT vNext reference fixture exposes WP-E15-17 marker');
  context.assert(fixture.includes('__xtendRmtVNextSmokeResult'), 'RMT vNext reference fixture exposes smoke result object');
  context.assert(fixture.includes('xtend.rmt.core-format.vnext.v1'), 'RMT vNext reference fixture declares vNext core schema');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de/xtend'), 'RMT vNext reference fixture has no XTend CDN dependency');

  [
    'vNext surface root visible',
    'vNext lifecycle operation available',
    'vNext scheduler lane weighted',
    'vNext security policy attached',
    'vNext streaming operation available'
  ].forEach((check) => {
    context.assert(fixture.includes(`recordCheck('${check}'`), `RMT vNext reference fixture records ${check}`);
  });
}

async function runBrowserSmokeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'browser',
    label: 'Browser smoke harness'
  });

  assertCustomElementFixtureContract(context, rootDir);
  assertCoreFlowFixtureContract(context, rootDir);
  assertRmtXRouterXtendFixtureContract(context, rootDir);
  assertRmtFirstDemoFixtureContract(context, rootDir);
  assertSurfaceManagerQualityFixtureContract(context, rootDir);
  assertA11yFocusKeyboardFixtureContract(context, rootDir);
  assertEpic11UxCompatibilityFixtureContract(context, rootDir);
  assertEpic11ThemeMatrixFixtureContract(context, rootDir);
  assertEpic13TrustedDomBoundaryFixtureContract(context, rootDir);
  assertRmtVNextReferenceFixtureContract(context, rootDir);
  await assertLocalDevServerContract(context, rootDir);

  const driver = options.driver || process.env.XTEND_BROWSER_SMOKE_DRIVER || '';
  if (driver === 'safari') {
    for (const fixture of BROWSER_FIXTURES) {
      try {
        const result = await runSafariWebDriverSmoke(rootDir, fixture);
        context.assert(result.status === 'passed', `${fixture.label} passed in Safari WebDriver${result.errors && result.errors.length ? ` (${result.errors.join(', ')})` : ''}`);
      } catch (error) {
        context.fail(`${fixture.label} failed in Safari WebDriver: ${error.message}`);
      }
    }
  } else if (driver) {
    context.fail(`Unsupported browser smoke driver: ${driver}`);
  } else {
    context.pass('Default browser fixture-contract smokes completed without external browser automation');
  }

  return context.result();
}

function printBrowserSmokeReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Browser Smoke Harness erfolgreich.',
    failureTitle: 'XTend Browser Smoke Harness fehlgeschlagen:'
  });
}

if (require.main === module) {
  runBrowserSmokeSuite()
    .then((result) => {
      printBrowserSmokeReport(result);
      if (!result.ok) {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error(`XTend Browser Smoke Harness fehlgeschlagen:\n\n- ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  runBrowserSmokeSuite,
  printBrowserSmokeReport
};

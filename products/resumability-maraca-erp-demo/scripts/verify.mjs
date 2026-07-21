import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createErpSnapshot } from '../src/data/rng-erp.mjs';
import { startServer } from '../server/index.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(productRoot, '../..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function parseEmbeddedJson(html, id) {
  const expression = new RegExp(`<script[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'u');
  const match = expression.exec(html);
  assert(match, `Embedded JSON script ${id} is missing.`);
  return JSON.parse(match[1]);
}

const reactRuntimeSignatures = [
  /react\.production\.min\.js/u,
  /react-dom\.production\.min\.js/u,
  /ReactCurrentDispatcher/u,
  /rendererPackageName:\s*["']react-dom["']/u
];

const vueRuntimeSignatures = [
  /@vue\/runtime-/u,
  /__VUE__/u,
  /__VUE_PROD_DEVTOOLS__/u
];

function includesAnySignature(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function assertNoRuntimeSignature(text, patterns, label) {
  assert(!includesAnySignature(text, patterns), `${label} contains framework runtime signatures despite host-provided manifest.`);
}

function assertRuntimeSignature(text, patterns, label) {
  assert(includesAnySignature(text, patterns), `${label} does not contain expected local runtime provider evidence.`);
}

function assertHostProvidedManifest(manifest, framework, modules, capabilities) {
  assert(manifest.framework === framework, `${manifest.id} does not declare ${framework}.`);
  assert(manifest.dependencies.every((dependency) => dependency.classification === 'host-provided'), `${manifest.id} dependencies are not host-provided.`);
  assert(manifest.dependencies.every((dependency) => dependency.bundled === false && dependency.packageIncluded === false), `${manifest.id} dependencies are not externalized.`);
  assert(manifest.runtimeProvider && manifest.runtimeProvider.mode === 'host-provided-local', `${manifest.id} does not declare a local host-provided runtime provider.`);
  assert(manifest.runtimeProvider.bundledInXtension === false, `${manifest.id} runtime provider is marked bundled in the XTension.`);
  assert(manifest.runtimeProvider.remoteAllowed === false, `${manifest.id} runtime provider allows remote runtime artifacts.`);
  modules.forEach((module) => {
    assert(manifest.runtimeProvider.modules.includes(module), `${manifest.id} runtime provider does not include ${module}.`);
  });
  capabilities.forEach((capability) => {
    assert(manifest.capabilities.includes(capability), `${manifest.id} does not expose capability ${capability}.`);
  });
}

function commandExists(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

function findChromium() {
  const candidates = ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/bin/google-chrome'];
  return candidates.find((candidate) => commandExists(candidate)) || null;
}

function stopProcessGroup(child, signal) {
  if (!child || !child.pid) return;
  try {
    process.kill(-child.pid, signal);
  } catch {
    try {
      child.kill(signal);
    } catch {
      // The browser may already have exited.
    }
  }
}

function runChromiumSmoke(chromium, url) {
  return new Promise((resolve) => {
    const child = spawn(chromium, [
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=swiftshader',
      '--enable-unsafe-swiftshader',
      '--enable-logging=stderr',
      '--log-level=0',
      '--run-all-compositor-stages-before-draw',
      '--virtual-time-budget=15000',
      '--dump-dom',
      url
    ], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const maxBuffer = 1024 * 1024 * 32;
    let stdout = '';
    let stderr = '';
    let error = null;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      stopProcessGroup(child, 'SIGTERM');
      setTimeout(() => stopProcessGroup(child, 'SIGKILL'), 1500).unref();
    }, 20000);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (stdout.length > maxBuffer && !error) {
        error = new Error('Chromium browser smoke exceeded the DOM output buffer.');
        stopProcessGroup(child, 'SIGTERM');
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (spawnError) => {
      error = spawnError;
    });
    child.on('close', (status, signal) => {
      clearTimeout(timeout);
      resolve({
        status,
        signal,
        stdout,
        stderr,
        error: error || (timedOut ? new Error('Chromium browser smoke timed out.') : null)
      });
    });
  });
}

const checkIgnore = spawnSync('git', ['check-ignore', '-q', 'products/resumability-maraca-erp-demo/package.json'], {
  cwd: repoRoot,
  encoding: 'utf8'
});
assert(checkIgnore.status === 1, 'Product package.json is still git-ignored.');

const one = createErpSnapshot('demo-seed-42');
const two = createErpSnapshot('demo-seed-42');
const three = createErpSnapshot('demo-seed-43');
assert(sameJson(one, two), 'RNG snapshot is not deterministic for the same seed.');
assert(!sameJson(one.ledger.items, three.ledger.items), 'RNG snapshot does not change for another seed.');

[
  'dist/maraca/xtend.maraca.mjs',
  'dist/maraca/xtend.maraca.report.json',
  'dist/xtensions/react-ledger-panel/index.mjs',
  'dist/xtensions/vue-process-sidebar/index.mjs',
  'dist/xtensions/react-sla-matrix/index.mjs',
  'dist/xtensions/vue-exception-queue/index.mjs',
  'dist/xtensions/frameworks/react/index.mjs',
  'dist/xtensions/frameworks/react-dom/client.mjs',
  'dist/xtensions/frameworks/vue/index.mjs',
  'dist/xtensions/three-material-flow-scene/index.mjs',
  'dist/xtensions/vanilla-legacy-lab/index.mjs',
  'dist/xtensions/openui5-procurement-worklist/index.mjs',
  'dist/xtensions/angular-risk-workbench/index.mjs',
  'dist/xtensions/angular-risk-workbench/server.mjs',
  'dist/xtensions/openui5/resources/sap-ui-core.js',
  'dist/xtensions/openui5/resources/sap-ui-version.json',
  'dist/xtensions/openui5/resources/Calendar-preload.js',
  'dist/xtensions/openui5/resources/Library-preload.js',
  'dist/xtensions/openui5/resources/Eventing-preload-0.js',
  'dist/xtensions/openui5/resources/Eventing-preload-1.js',
  'dist/xtensions/openui5/resources/Theming-preload.js',
  'dist/xtensions/openui5/resources/sap/m/manifest.json',
  'dist/xtensions/openui5/resources/sap/m/messagebundle_de_DE.properties',
  'dist/xtensions/openui5/resources/sap/m/library.js',
  'dist/xtensions/openui5/resources/sap/m/themes/sap_horizon/library.css',
  'dist/xtensions/openui5/resources/sap/ui/core/manifest.json',
  'dist/xtensions/openui5/resources/sap/ui/core/messagebundle_de_DE.properties',
  'dist/xtensions/openui5/resources/sap/ui/core/themes/sap_horizon/library.css',
  'dist/xtensions/openui5/resources/sap/ui/core/themes/sap_horizon/library.source.less',
  'dist/xtensions/vanilla-legacy-lab/iwebkit/index.html',
  'dist/xtensions/vanilla-legacy-lab/iwebkit/navigation.html',
  'dist/xtensions/vanilla-legacy-lab/iwebkit/javascript/iwebkit-sandbox-bridge.js',
  'dist/xtensions/manifests/react-ledger-panel.json',
  'dist/xtensions/manifests/vue-process-sidebar.json',
  'dist/xtensions/manifests/react-sla-matrix.json',
  'dist/xtensions/manifests/vue-exception-queue.json',
  'dist/xtensions/manifests/three-material-flow-scene.json',
  'dist/xtensions/manifests/vanilla-legacy-lab.json',
  'dist/xtensions/manifests/openui5-procurement-worklist.json',
  'dist/xtensions/manifests/angular-risk-workbench.json'
].forEach((relative) => {
  assert(existsSync(path.join(productRoot, relative)), `Missing build artifact: ${relative}`);
});

const maracaReport = JSON.parse(await readFile(path.join(productRoot, 'dist/maraca/xtend.maraca.report.json'), 'utf8'));
const browserBaseline = JSON.parse(await readFile(path.join(productRoot, 'browser-baseline.json'), 'utf8'));
assert(maracaReport.ok === true, 'Maraca report is not ok.');
assert(maracaReport.kernel && maracaReport.kernel.enabled === true, 'Maraca kernel is not enabled.');
assert(maracaReport.hydration && maracaReport.hydration.enabled === true, 'Maraca hydration is not enabled.');
assert(maracaReport.lazy !== 'none', 'Maraca build erased declared deferred hydration policies with eager loading.');
assert(maracaReport.hydration.serverPrerender && maracaReport.hydration.serverPrerender.resumeRecordCount > 0, 'Maraca report does not count resume prerender records.');
assert(maracaReport.hydration.serverPrerender.hydrateRecordCount === 0, 'Maraca report normalized resume records to hydration records.');
assert(maracaReport.hydration.serverPrerender.resumeResponseCompatible === true, 'Maraca report does not advertise resume response support.');
const tunedConfig = JSON.parse(await readFile(path.join(productRoot, 'maraca.tuned.config.json'), 'utf8'));
assert(tunedConfig.selected && tunedConfig.selected.lazy !== 'none', 'Committed tune config selected eager boot despite declared RMT policies.');

const runtime = await startServer({ port: 0, host: '127.0.0.1', silent: true });
try {
  const baseUrl = `http://127.0.0.1:${runtime.port}`;
  const htmlResponse = await fetch(`${baseUrl}/?seed=verify-seed`);
  const csp = htmlResponse.headers.get('content-security-policy') || '';
  const html = await htmlResponse.text();
  assert(csp.includes('default-src'), 'SSR CSP header does not include default-src.');
  assert(csp.includes('script-src'), 'SSR CSP header does not include script-src.');
  assert(csp.includes('style-src'), 'SSR CSP header does not include style-src.');
  assert(csp.includes('img-src'), 'SSR CSP header does not include img-src.');
  assert(csp.includes('connect-src'), 'SSR CSP header does not include connect-src.');
  assert(csp.includes('frame-src'), 'SSR CSP header does not include frame-src.');
  assert(csp.includes('worker-src'), 'SSR CSP header does not include worker-src.');
  assert(!/\b(defaultsrc|scriptsrc|stylesrc|imgsrc|connectsrc|workersrc)\b/u.test(csp), 'SSR CSP header contains malformed camelCase directives.');
  assert(html.includes('id="xtend-maraca-root"'), 'SSR HTML does not include the Maraca root.');
  assert(html.includes('data-rmt-ssr-resume'), 'SSR HTML does not include the framework resume payload.');
  assert(html.includes('data-rmt-resume-root="true"'), 'SSR HTML does not include a framework resume root.');
  assert(html.includes('data-rmt-resume-id='), 'SSR HTML does not include stable resume node identities.');
  assert(html.includes('data-rmt-resume-generation='), 'SSR HTML does not bind nodes to a resume generation.');
  assert(html.includes('RMT Server Render'), 'SSR HTML does not expose the adapter-generated RMT render.');
  assert(!html.includes('RMT Surface Mirror'), 'SSR HTML still contains the former hand-rendered RMT surface mirror.');
  const resumeTransport = parseEmbeddedJson(html, 'xtend-erp-resume-payload');
  const resumeEnvelope = resumeTransport.resume;
  assert(resumeTransport.schema === 'xtend.rmt.ssr-resume-transport.v1', 'SSR transport schema is invalid.');
  assert(resumeEnvelope && resumeEnvelope.schema === 'xtend.rmt.ssr-resume-envelope.v1', 'Framework resume envelope is missing.');
  assert(resumeEnvelope.executionMode === 'server_prerender_resume', 'Resume envelope execution mode is not server_prerender_resume.');
  assert(resumeEnvelope.fallbackMode === 'server_prerender_hydrate', 'Resume envelope does not declare the only valid hydration fallback.');
  assert(resumeEnvelope.integrity && resumeEnvelope.integrity.algorithm === 'ECDSA-P256-SHA256', 'Resume envelope is not signed with ECDSA P-256/SHA-256.');
  assert(resumeEnvelope.integrity.keyId === resumeTransport.publicKey.keyId, 'Resume envelope and public verifier key IDs differ.');
  assert(resumeTransport.response && resumeTransport.response.resume && resumeTransport.response.resume.integrity.signature === resumeEnvelope.integrity.signature, 'SSR response and transport did not originate from one signed envelope.');
  assert(Array.isArray(resumeEnvelope.xtensions) && resumeEnvelope.xtensions.length === 8, 'Resume envelope does not cover all eight XTensions.');
  assert(Array.isArray(resumeEnvelope.manifests) && resumeEnvelope.manifests.length === 8, 'Resume envelope does not carry all eight signed manifests.');
  assert(!('token' in resumeTransport) && !('token' in resumeEnvelope), 'Legacy local resume token leaked into the framework payload.');
  assert(html.includes('data-xtension-slot="react-ledger-panel"'), 'SSR HTML does not include the React XTension slot.');
  assert(html.includes('data-xtension-slot="vue-process-sidebar"'), 'SSR HTML does not include the Vue XTension slot.');
  assert(html.includes('data-xtension-slot="react-sla-matrix"'), 'SSR HTML does not include the React SLA XTension slot.');
  assert(html.includes('data-xtension-slot="vue-exception-queue"'), 'SSR HTML does not include the Vue exception XTension slot.');
  assert(html.includes('data-xtension-slot="three-material-flow-scene"'), 'SSR HTML does not include the Three XTension slot.');
  assert(html.includes('data-xtension-slot="vanilla-legacy-lab"'), 'SSR HTML does not include the Vanilla XTension slot.');
  assert(html.includes('data-xtension-slot="openui5-procurement-worklist"'), 'SSR HTML does not include the OpenUI5 XTension slot.');
  assert(html.includes('data-xtension-slot="angular-risk-workbench"'), 'SSR HTML does not include the Angular XTension slot.');
  assert(html.includes('data-openui5-status="server-fallback"'), 'SSR HTML does not include the OpenUI5 server fallback marker.');
  assert(html.includes('data-angular-status="server-fallback"'), 'SSR HTML does not include the Angular server fallback marker.');
  assert(html.includes('<!--nghm-->') && /<xtend-angular-risk-workbench-root[^>]+ngh="/u.test(html), 'SSR HTML does not include Angular hydration integrity and host annotations.');
  assert(html.includes('id="ng-state"'), 'SSR HTML does not include Angular hydration transfer state.');
  assert(html.includes('data-iwebkit-sandbox="true"'), 'SSR HTML does not include the iWebKit sandbox marker.');
  assert(html.includes('iframe-sandbox'), 'SSR HTML does not describe the vanilla legacy sandbox.');
  assert(html.includes('id="erp-menu-bar"'), 'SSR HTML does not include the ERP menu bar.');
  assert(html.includes('data-rmt-surface="erp.shell.menuBar"'), 'Adapter SSR HTML does not include the menu RMT surface.');
  assert(html.includes('help.rmtSurfaceInfo'), 'SSR HTML does not include the RMT Surface Info menu command.');
  assert(html.includes('environment.xtensionControl'), 'SSR HTML does not include the XTension control menu command.');
  assert(html.includes('<kbd>F1</kbd>'), 'SSR HTML does not expose the F1 shortcut in the menu band.');
  assert(html.includes('data-xtend-command="erp.shell.toggleMenu"'), 'SSR HTML does not include a clickable menu trigger command.');
  assert(html.includes('data-xtend-command="erp.shell.selectMenuCommand"'), 'SSR HTML does not include a clickable menu command.');
  assert(html.includes('data-xtend-command="erp.shell.selectLedgerItem"'), 'SSR HTML does not include a clickable React ledger command surface.');
  assert(html.includes('data-xtend-command="erp.shell.inspectSlaCell"'), 'SSR HTML does not include a clickable React SLA command surface.');
  assert(html.includes('data-xtend-command="erp.shell.inspectException"'), 'SSR HTML does not include a clickable Vue exception command surface.');
  assert(html.includes('data-xtend-command="erp.shell.inspectOpenUi5Order"'), 'SSR HTML does not include a clickable OpenUI5 procurement command surface.');
  assert(html.includes('data-xtend-command="erp.shell.inspectAngularRisk"'), 'SSR HTML does not include a clickable Angular risk command surface.');
  assert(html.includes('data-rmt-surface="erp.shell.loadMatrix"'), 'Adapter SSR HTML does not include the load matrix RMT surface.');
  assert(html.includes('data-rmt-surface="erp.shell.schedulerTrace"'), 'Adapter SSR HTML does not include the scheduler trace RMT surface.');
  assert(html.includes('data-rmt-surface="erp.shell.exceptionSummary"'), 'Adapter SSR HTML does not include the exception summary RMT surface.');
  assert(html.includes('data-rmt-surface="erp.shell.throughputBand"'), 'Adapter SSR HTML does not include the throughput band RMT surface.');
  assert(html.includes('data-rmt-surface="erp.shell.openUi5Procurement"'), 'Adapter SSR HTML does not include the OpenUI5 procurement RMT surface.');
  assert(html.includes('data-rmt-surface="erp.shell.angularRiskWorkbench"'), 'Adapter SSR HTML does not include the Angular risk RMT surface.');
  assert(html.includes('data-rmt-surface="erp.shell.xtensionControlDialog"'), 'Adapter SSR HTML does not include the XTension control RMT surface.');
  assert(html.includes('id="erp-surface-info-dialog-host"'), 'SSR HTML does not include the lazy Surface Info dialog host.');
  assert(html.includes('id="erp-xtension-control-dialog-host"'), 'SSR HTML does not include the lazy XTension control dialog host.');
  assert(html.includes('data-rmt-surface="erp.shell.surfaceInfoDialog"'), 'Adapter SSR HTML does not include the Surface Info RMT surface.');
  assert(html.includes('data-lazy-state="unloaded"'), 'SSR HTML does not mark the Surface Info dialog as initially unloaded.');
  assert(!html.includes('<x-dialog'), 'SSR HTML eagerly renders the native x-dialog instead of keeping it lazy.');

  const snapshot = await (await fetch(`${baseUrl}/api/erp/snapshot?seed=verify-seed`)).json();
  assert(snapshot.seed === 'verify-seed', 'Snapshot API did not echo the requested seed.');

  const reseeded = await (await fetch(`${baseUrl}/api/erp/reseed`, { method: 'POST' })).json();
  assert(reseeded.seed && reseeded.seed !== 'verify-seed', 'Reseed API did not create a new seed.');

  const health = await (await fetch(`${baseUrl}/healthz`)).json();
  assert(health.ok === true, 'Health endpoint is not ok.');

  const adoptionMatrix = {
    'react-ledger-panel': 'dom_hydrate',
    'react-sla-matrix': 'dom_hydrate',
    'vue-process-sidebar': 'dom_hydrate',
    'vue-exception-queue': 'dom_hydrate',
    'angular-risk-workbench': 'dom_hydrate',
    'three-material-flow-scene': 'host_activate',
    'vanilla-legacy-lab': 'host_activate',
    'openui5-procurement-worklist': 'host_activate'
  };
  for (const [id, strategy] of Object.entries(adoptionMatrix)) {
    const manifest = JSON.parse(await readFile(path.join(productRoot, `dist/xtensions/manifests/${id}.json`), 'utf8'));
    assert(manifest.resumeSchema === 'xtend.xtensions.resume-manifest.v1', `${id} does not declare the resume manifest schema.`);
    assert(manifest.clientEntry && manifest.serverEntry, `${id} does not declare client and server entries.`);
    assert(/^sha256:[a-f0-9]{64}$/u.test(manifest.bundleIntegrity), `${id} does not declare a SHA-256 bundle integrity.`);
    assert(manifest.snapshotSchema, `${id} does not declare a snapshot schema.`);
    assert(manifest.adoptionStrategy === strategy, `${id} does not declare ${strategy}.`);
    assert(manifest.resume && manifest.resume.mountedIsResume === false, `${id} normalizes mounted as resume.`);
    assert(manifest.capabilities.includes('host.lifecycle.adopt'), `${id} does not expose host adoption capability.`);
  }

  const openUi5Manifest = JSON.parse(await readFile(path.join(productRoot, 'dist/xtensions/manifests/openui5-procurement-worklist.json'), 'utf8'));
  assert(openUi5Manifest.framework === 'openui5', 'OpenUI5 manifest does not declare the openui5 framework.');
  assert(openUi5Manifest.dependencies.every((dependency) => dependency.classification === 'product-local-bundled'), 'OpenUI5 manifest does not use product-local-bundled dependencies.');
  assert(openUi5Manifest.security.remoteArtifactsAllowed === false, 'OpenUI5 manifest allows remote artifacts.');
  const openUi5CoreResponse = await fetch(`${baseUrl}/dist/xtensions/openui5/resources/sap-ui-core.js`);
  const openUi5Core = await openUi5CoreResponse.text();
  assert(openUi5CoreResponse.status === 200, 'OpenUI5 local sap-ui-core.js is not available.');
  assert(!/https:\/\/ui5\.sap\.com|sapui5\.hana\.ondemand\.com/u.test(openUi5Core), 'OpenUI5 local bootstrap references a SAPUI5/OpenUI5 CDN.');

  const angularManifest = JSON.parse(await readFile(path.join(productRoot, 'dist/xtensions/manifests/angular-risk-workbench.json'), 'utf8'));
  assert(angularManifest.framework === 'angular', 'Angular manifest does not declare the angular framework.');
  assert(angularManifest.buildMode === 'aot', 'Angular manifest does not declare AOT build mode.');
  assert(angularManifest.dependencies.every((dependency) => dependency.classification === 'product-local-bundled'), 'Angular manifest does not use product-local-bundled dependencies.');
  assert(angularManifest.security.remoteArtifactsAllowed === false, 'Angular manifest allows remote artifacts.');
  const angularBundle = await readFile(path.join(productRoot, 'dist/xtensions/angular-risk-workbench/index.mjs'), 'utf8');
  const angularServerBundle = await readFile(path.join(productRoot, 'dist/xtensions/angular-risk-workbench/server.mjs'), 'utf8');
  assert(!/(?:^|[;\n])\s*import\s+['"]@angular\/compiler['"]|from\s+['"]@angular\/compiler['"]|import\(\s*['"]@angular\/compiler['"]\s*\)|require\(\s*['"]@angular\/compiler['"]\s*\)/u.test(angularBundle), 'Angular runtime bundle imports @angular/compiler.');
  assert(angularServerBundle.includes('@angular/platform-server') && angularServerBundle.includes('provideClientHydration'), 'Angular server bundle does not expose platform-server hydration evidence.');
  assert(!/(?:^|[;\n])\s*import\s+['"]@angular\/compiler['"]|from\s+['"]@angular\/compiler['"]|import\(\s*['"]@angular\/compiler['"]\s*\)|require\(\s*['"]@angular\/compiler['"]\s*\)/u.test(angularServerBundle), 'Angular server bundle imports @angular/compiler at runtime.');

  const reactProvider = await readFile(path.join(productRoot, 'dist/xtensions/frameworks/react/index.mjs'), 'utf8');
  const reactDomProvider = await readFile(path.join(productRoot, 'dist/xtensions/frameworks/react-dom/client.mjs'), 'utf8');
  const vueProvider = await readFile(path.join(productRoot, 'dist/xtensions/frameworks/vue/index.mjs'), 'utf8');
  assertRuntimeSignature(`${reactProvider}\n${reactDomProvider}`, reactRuntimeSignatures, 'React shared runtime provider');
  assertRuntimeSignature(vueProvider, vueRuntimeSignatures, 'Vue shared runtime provider');

  for (const id of ['react-ledger-panel', 'react-sla-matrix']) {
    const manifest = JSON.parse(await readFile(path.join(productRoot, `dist/xtensions/manifests/${id}.json`), 'utf8'));
    const bundle = await readFile(path.join(productRoot, `dist/xtensions/${id}/index.mjs`), 'utf8');
    assertHostProvidedManifest(manifest, 'react', [
      '/dist/xtensions/frameworks/react/index.mjs',
      '/dist/xtensions/frameworks/react-dom/client.mjs'
    ], [
      'react.root.lifecycle',
      'react.scheduling.hints',
      'react.boundary.diagnostics'
    ]);
    assertNoRuntimeSignature(bundle, reactRuntimeSignatures, `${id} bundle`);
    assert(bundle.includes('/dist/xtensions/frameworks/react/index.mjs'), `${id} bundle does not import the shared React provider.`);
    assert(bundle.includes('/dist/xtensions/frameworks/react-dom/client.mjs'), `${id} bundle does not import the shared ReactDOM provider.`);
  }

  for (const id of ['vue-process-sidebar', 'vue-exception-queue']) {
    const manifest = JSON.parse(await readFile(path.join(productRoot, `dist/xtensions/manifests/${id}.json`), 'utf8'));
    const bundle = await readFile(path.join(productRoot, `dist/xtensions/${id}/index.mjs`), 'utf8');
    assertHostProvidedManifest(manifest, 'vue', [
      '/dist/xtensions/frameworks/vue/index.mjs'
    ], [
      'vue.app.lifecycle',
      'vue.explicit-update-adapter',
      'vue.event-normalization'
    ]);
    assertNoRuntimeSignature(bundle, vueRuntimeSignatures, `${id} bundle`);
    assert(bundle.includes('/dist/xtensions/frameworks/vue/index.mjs'), `${id} bundle does not import the shared Vue provider.`);
  }

  const iwebkitRoot = path.join(productRoot, 'dist/xtensions/vanilla-legacy-lab/iwebkit');
  const iwebkitPages = (await readdir(iwebkitRoot)).filter((file) => file.endsWith('.html')).sort();
  assert(iwebkitPages.length > 1, 'Sanitized iWebKit sandbox did not copy the local HTML navigation pages.');
  for (const page of iwebkitPages) {
    const response = await fetch(`${baseUrl}/dist/xtensions/vanilla-legacy-lab/iwebkit/${page}`);
    const pageHtml = await response.text();
    assert(response.status === 200, `Sanitized iWebKit page is not available: ${page}`);
    assert(pageHtml.includes('iwebkit-sandbox-bridge.js'), `Sanitized iWebKit ${page} page does not load the sandbox bridge.`);
    assert(!/google-analytics|_gaq|ga\.js/u.test(pageHtml), `Sanitized iWebKit ${page} page still contains analytics injection.`);
    assert(!/https?:\/\//u.test(pageHtml), `Sanitized iWebKit ${page} page still contains remote URLs.`);
    assert(!/javascript:/u.test(pageHtml), `Sanitized iWebKit ${page} page still contains javascript: links.`);
    assert(!/<(?:embed|object)\b/iu.test(pageHtml), `Sanitized iWebKit ${page} page still contains embed/object tags.`);
  }
  const iwebkitBridgeResponse = await fetch(`${baseUrl}/dist/xtensions/vanilla-legacy-lab/iwebkit/javascript/iwebkit-sandbox-bridge.js`);
  const iwebkitBridge = await iwebkitBridgeResponse.text();
  assert(iwebkitBridgeResponse.status === 200, 'iWebKit sandbox bridge is not available.');
  assert(iwebkitBridge.includes('localNavigationTarget'), 'iWebKit sandbox bridge does not guard local navigation.');
  assert(iwebkitBridge.includes('withResumeQuery'), 'iWebKit sandbox bridge does not preserve the resume seed during local navigation.');
  assert(iwebkitBridge.includes('data-iwebkit-resume-seed'), 'iWebKit sandbox bridge does not expose the resumed seed marker.');
  assert(iwebkitBridge.includes('window.location.href = withResumeQuery(nextHref)'), 'iWebKit sandbox bridge does not navigate inside the iframe sandbox.');

  for (const staticModule of [
    '/xcommand/xcommand.js',
    '/components/xdialog.js',
    '/components/xbutton.js',
    '/components/xselect.js',
    '/components/xicon.js',
    '/components/icon-packs/core.js',
    '/components/icon-packs/lucide.js',
    '/xtendrmt/rmt-event-routing-runtime.js',
    '/xtendrmt/rmt-resume-runtime.js',
    '/dist/xtensions/frameworks/react/index.mjs',
    '/dist/xtensions/frameworks/react-dom/client.mjs',
    '/dist/xtensions/frameworks/vue/index.mjs',
    '/dist/xtensions/openui5/resources/sap-ui-core.js',
    '/dist/xtensions/openui5/resources/sap-ui-version.json',
    '/dist/xtensions/openui5/resources/Calendar-preload.js',
    '/dist/xtensions/openui5/resources/Library-preload.js',
    '/dist/xtensions/openui5/resources/Eventing-preload-0.js',
    '/dist/xtensions/openui5/resources/Eventing-preload-1.js',
    '/dist/xtensions/openui5/resources/Theming-preload.js',
    '/dist/xtensions/openui5/resources/sap/m/manifest.json',
    '/dist/xtensions/openui5/resources/sap/m/messagebundle_de_DE.properties',
    '/dist/xtensions/openui5/resources/sap/m/library.js',
    '/dist/xtensions/openui5/resources/sap/m/themes/sap_horizon/library.css',
    '/dist/xtensions/openui5/resources/sap/ui/core/manifest.json',
    '/dist/xtensions/openui5/resources/sap/ui/core/messagebundle_de_DE.properties',
    '/dist/xtensions/openui5/resources/sap/ui/core/themes/sap_horizon/library.css',
    '/dist/xtensions/openui5/resources/sap/ui/core/themes/sap_horizon/library.source.less'
  ]) {
    const staticResponse = await fetch(`${baseUrl}${staticModule}`);
    assert(staticResponse.status === 200, `Lazy native module route is not available: ${staticModule}`);
  }

  const chromium = findChromium();
  if (chromium) {
    const browser = await runChromiumSmoke(chromium, `${baseUrl}/?seed=browser-smoke&preboot_intent=erp.shell.selectLedgerItem&repeat_boot=1`);
    const browserMarker = (browser.stdout.match(/<[^>]*id="erp-demo-smoke-result"[^>]*>/u) || ['marker-missing'])[0];
    const browserBootError = (browser.stdout.match(/<html[^>]*>/u) || ['html-marker-missing'])[0];
    const browserDiagnostics = browser.stderr.split('\n').filter((line) => /error|fail|refused|violation|exception/iu.test(line)).slice(-12).join(' | ');
    assert(!browser.error, `Chromium browser smoke failed: ${browser.error ? browser.error.message : 'unknown error'}`);
    assert(browser.status === 0, `Chromium browser smoke exited with ${browser.status}.`);
    assert(browser.stdout.includes('id="erp-demo-smoke-result"'), 'Browser smoke marker is missing.');
    assert(browser.stdout.includes('data-kernel-enabled="true"'), `Browser smoke did not observe an enabled Maraca kernel. ${browserMarker} ${browserBootError} ${browserDiagnostics}`);
    assert(browser.stdout.includes('data-resume-status="resumed"'), `Browser smoke did not complete the RMT resume path. ${browserMarker} ${browserBootError}`);
    assert(browser.stdout.includes('data-resume-verified="true"'), 'Browser smoke did not verify the signed resume envelope.');
    assert(browser.stdout.includes('data-resume-fallback="false"'), 'Browser smoke unexpectedly used hydration fallback.');
    assert(browser.stdout.includes('data-fallback-attempted="false"'), 'Browser smoke attempted hydration fallback on a valid envelope.');
    assert(browser.stdout.includes('data-resume-event-count="1"'), 'Browser smoke emitted more than one resume result.');
    assert(browser.stdout.includes('data-repeat-boot-ignored="true"'), 'Repeated Maraca boot was not ignored for the consumed resume envelope.');
    assert(browser.stdout.includes('data-intent-replay="1"'), 'Declared pre-boot intent was not replayed exactly once.');
    assert(browser.stdout.includes('data-root-identity="true"'), 'Browser smoke replaced the native RMT resume root.');
    assert(browser.stdout.includes('data-slot-identity="true"'), 'Browser smoke replaced an XTension host during resume.');
    assert(browser.stdout.includes('data-inner-identity="true"'), `Browser smoke replaced a React/Vue/Angular inner root during adoption. ${browserMarker} ${browserBootError}`);
    assert(browser.stdout.includes('data-host-fallback-identity="true"'), 'Browser smoke replaced a host_activate SSR fallback subtree.');
    assert(browser.stdout.includes('data-three-fallback-hidden="true"'), 'Three host activation left its SSR visualization visible beside the canvas.');
    assert(browser.stdout.includes('data-iwebkit-fallback-hidden="true"'), 'Vanilla/iWebKit host activation left its SSR placeholder visible beside the iframe.');
    assert(browser.stdout.includes('data-openui5-fallback-hidden="true"'), 'OpenUI5 host activation left its SSR table visible beside the control tree.');
    assert(browser.stdout.includes('data-host-activation-singleton="true"'), 'A host_activate XTension exposes more than one visible materialization.');
    assert(browser.stdout.includes('data-react-status="resumed"'), 'React XTensions did not adopt their SSR roots.');
    assert(browser.stdout.includes('data-vue-status="resumed"'), 'Vue XTensions did not adopt their SSR roots.');
    assert(browser.stdout.includes('data-react-sla-status="resumed"'), 'React SLA XTension did not adopt its SSR root.');
    assert(browser.stdout.includes('data-vue-exception-status="resumed"'), 'Vue exception XTension did not adopt its SSR root.');
    assert(browser.stdout.includes('data-xtension-runtime-provider="ready"'), 'Browser smoke did not observe ready React/Vue host runtime providers.');
    assert(browser.stdout.includes('data-three-status="resumed"'), 'Three XTension did not activate its existing host.');
    assert(browser.stdout.includes('data-vanilla-status="host-activated"'), 'Vanilla XTension did not activate its existing host.');
    assert(browser.stdout.includes('data-openui5-status="host-activated"'), 'OpenUI5 XTension did not activate its existing host.');
    assert(browser.stdout.includes('data-angular-status="dom-hydrated"'), 'Angular XTension did not hydrate its existing root.');
    assert(!browser.stdout.includes('sap-ui-boot.js'), 'Browser smoke observed the private OpenUI5 sap-ui-boot.js loader.');
    assert(browser.stdout.includes('data-iwebkit-sandbox="true"'), 'iWebKit sandbox marker is missing in browser smoke.');
    assert(/data-iwebkit-frame-loads="[1-9][0-9]*"/u.test(browser.stdout), 'iWebKit sandbox iframe did not load in browser smoke.');
    assert(browser.stdout.includes('sandbox="allow-scripts"'), 'iWebKit iframe does not have the expected sandbox attribute.');
    assert(browser.stdout.includes('data-three-nonblank="true"'), 'Three XTension did not report nonblank WebGL pixels.');
    assert(browser.stdout.includes('data-three-rebuilds="1"'), 'Three XTension did not report the expected initial rebuild count.');
    assert(browser.stdout.includes('data-xtension-mounted="8"'), 'Browser smoke did not observe all eight XTensions.');
    assert(browser.stdout.includes('data-xtension-boot-enabled="8"'), 'Browser smoke did not observe the default enabled XTension boot policy.');
    assert(browser.stdout.includes('data-xtension-boot-disabled="0"'), 'Browser smoke did not observe the default disabled XTension boot policy.');
    assert(browser.stdout.includes('data-native-surface-count="13"'), 'Browser smoke did not observe native load-lab surfaces.');
    assert(browser.stdout.includes('data-fallback-degraded="false"'), 'Browser smoke observed a degraded XTension fallback.');
    assert(browser.stdout.includes('data-menu-xstate="true"'), 'Browser smoke did not observe the menu state in XState.');
    assert(browser.stdout.includes('data-command-runtime-attached="true"'), 'Browser smoke did not observe the RMT command routing runtime.');
    assert(browser.stdout.includes('data-menu-selected="system.resume"'), 'Browser smoke did not observe the initial selected menu command.');
    assert(browser.stdout.includes('data-surface-info-loaded="false"'), 'Browser smoke observed the lazy Surface Info dialog before it was opened.');
    assert(browser.stdout.includes('data-surface-info-open="false"'), 'Browser smoke observed the Surface Info dialog as initially open.');
    assert(browser.stdout.includes('data-xtension-control-loaded="false"'), 'Browser smoke observed the lazy XTension control dialog before it was opened.');
    assert(browser.stdout.includes('data-xtension-control-open="false"'), 'Browser smoke observed the XTension control dialog as initially open.');
    assert(browser.stdout.includes('data-xtension-control-status="local-storage"'), 'Browser smoke did not observe the XTension control local-storage state.');
    assert(browser.stdout.includes('data-xcommand-ready="false"'), 'Browser smoke eagerly loaded XCommand before F1 was used.');
    assert(browser.stdout.includes('data-xtend-command="erp.shell.toggleMenu"'), 'Browser smoke did not observe the menu trigger command surface.');
    assert(browser.stdout.includes('data-xtend-command="erp.shell.selectMenuCommand"'), 'Browser smoke did not observe the menu command surface.');
    assert(browser.stdout.includes('data-xtend-command="erp.shell.selectLedgerItem"'), 'Browser smoke did not observe the React ledger command surface.');
    assert(browser.stdout.includes('data-xtend-command="erp.shell.inspectSlaCell"'), 'Browser smoke did not observe the React SLA command surface.');
    assert(browser.stdout.includes('data-xtend-command="erp.shell.inspectException"'), 'Browser smoke did not observe the Vue exception command surface.');
    assert(browser.stdout.includes('data-xtend-command="erp.shell.inspectOpenUi5Order"'), 'Browser smoke did not observe the OpenUI5 procurement command surface.');
    assert(browser.stdout.includes('data-xtend-command="erp.shell.inspectAngularRisk"'), 'Browser smoke did not observe the Angular risk command surface.');
    for (const [name, value] of Object.entries(browserBaseline.expectedDataset)) {
      assert(browser.stdout.includes(`data-${name}="${value}"`), `Browser visual/DOM regression baseline drifted for data-${name}.`);
    }

    const tamperedBrowser = await runChromiumSmoke(chromium, `${baseUrl}/?seed=browser-tampered&resume_tamper=signature`);
    const tamperedMarker = (tamperedBrowser.stdout.match(/<[^>]*id="erp-demo-smoke-result"[^>]*>/u) || ['marker-missing'])[0];
    assert(!tamperedBrowser.error && tamperedBrowser.status === 0, `Tampered-envelope browser smoke failed to execute. ${tamperedMarker}`);
    assert(tamperedBrowser.stdout.includes('id="erp-shell"'), 'Hydration fallback hid or removed the visible ERP shell.');
    assert(tamperedBrowser.stdout.includes('data-resume-status="fallback_hydrated"'), `Tampered envelope did not use explicit hydration fallback. ${tamperedMarker}`);
    assert(tamperedBrowser.stdout.includes('data-resume-verified="false"'), 'Tampered envelope was incorrectly reported as verified.');
    assert(tamperedBrowser.stdout.includes('data-resume-fallback="true"'), 'Tampered envelope did not record successful hydration fallback.');
    assert(tamperedBrowser.stdout.includes('data-fallback-attempted="true"'), 'Tampered envelope did not record the fallback attempt.');
    assert(tamperedBrowser.stdout.includes('data-resume-event-count="1"'), 'Tampered envelope triggered resume/fallback more than once.');
    assert(tamperedBrowser.stdout.includes('data-xtension-mounted="8"'), 'Hydration fallback did not bring up all eight XTensions.');
  } else {
    assert(process.env.XTEND_REQUIRE_BROWSER !== '1', 'Chromium/Chrome is required for the central ERP catfood gate.');
    console.warn('Chromium not found; browser smoke skipped.');
  }
} finally {
  await runtime.close();
}

console.log('Local resumability Maraca ERP demo verification passed.');

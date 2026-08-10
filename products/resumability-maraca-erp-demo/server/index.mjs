import { createServer as createHttpServer } from 'node:http';
import { generateKeyPairSync, randomBytes, sign as signBytes } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import React from 'react';
import { renderToString as renderReactToString } from 'react-dom/server';
import { createSSRApp } from 'vue';
import { renderToString as renderVueToString } from '@vue/server-renderer';
import { createRmtNodeSsrAdapter } from '../../../xtendrmt/rmt-node-ssr-adapter.js';
import { createClientSnapshot, createErpSnapshot, createRmtStateFromSnapshot } from '../src/data/rng-erp.mjs';
import { LedgerPanel } from '../src/xtensions/react-ledger-panel/index.js';
import { SlaMatrix } from '../src/xtensions/react-sla-matrix/index.js';
import { ProcessSidebar } from '../src/xtensions/vue-process-sidebar/index.js';
import { ExceptionQueue } from '../src/xtensions/vue-exception-queue/index.js';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(productRoot, '../..');
const rmtSourcePath = path.join(productRoot, 'src', 'rmt', 'erp-shell.rmt');
const angularServerEntryPath = path.join(productRoot, 'dist', 'xtensions', 'angular-risk-workbench', 'server.mjs');
const require = createRequire(import.meta.url);
const { compileRmtVNextSource } = require(path.join(repoRoot, 'tools', 'rmt-language', 'vnext-compiler.js'));
const resumeSigningKey = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const resumePublicJwk = resumeSigningKey.publicKey.export({ format: 'jwk' });
const RESUME_KEY_ID = 'erp-catfood-p256-2026-01';

const MIME_TYPES = {
  '.css': 'text/css; charset=UTF-8',
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.mjs': 'text/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.map': 'application/json; charset=UTF-8',
  '.properties': 'text/plain; charset=UTF-8',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=UTF-8'
};

const RMT_RUNTIME_MODULE_PATHS = new Set([
  '/xtendrmt/rmt-event-routing-runtime.js',
  '/xtendrmt/rmt-resume-runtime.js',
  '/xtendrmt/rmt-resume-protocol.js',
  '/xtendrmt/rmt-resume-capture-adapter.js',
  '/xtendrmt/rmt-resume-host-adapter.js',
  '/xtendrmt/rmt-resume-command-adapter.js',
  '/xtendrmt/rmt-resume-command-controller.js'
]);

function text(value) {
  return String(value ?? '');
}

function escapeHtml(value) {
  return text(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e');
}

function currency(value, code = 'EUR') {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function createSeed() {
  return `seed-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`;
}

async function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function readXTensionManifests() {
  const manifestRoot = path.join(productRoot, 'dist', 'xtensions', 'manifests');
  const [react, vue, reactSla, vueException, three, vanilla, openui5, angular] = await Promise.all([
    readJsonIfExists(path.join(manifestRoot, 'react-ledger-panel.json')),
    readJsonIfExists(path.join(manifestRoot, 'vue-process-sidebar.json')),
    readJsonIfExists(path.join(manifestRoot, 'react-sla-matrix.json')),
    readJsonIfExists(path.join(manifestRoot, 'vue-exception-queue.json')),
    readJsonIfExists(path.join(manifestRoot, 'three-material-flow-scene.json')),
    readJsonIfExists(path.join(manifestRoot, 'vanilla-legacy-lab.json')),
    readJsonIfExists(path.join(manifestRoot, 'openui5-procurement-worklist.json')),
    readJsonIfExists(path.join(manifestRoot, 'angular-risk-workbench.json'))
  ]);
  return { react, vue, reactSla, vueException, three, vanilla, openui5, angular };
}

function renderAuditTrail(snapshot) {
  return snapshot.auditTrail.map((entry) => `
    <li>
      <b>${escapeHtml(entry.code)}</b>
      <span>${escapeHtml(entry.actor)} ${escapeHtml(entry.action)} ${escapeHtml(entry.object)}</span>
      <small>${entry.minutesAgo} min</small>
    </li>
  `).join('');
}

function renderThreeFallback(snapshot) {
  return `
    <div class="erp-three-fallback" data-xtension-fallback="three-material-flow-scene" aria-label="Materialfluss Vorschau">
      ${snapshot.loadLab.materialFlow.map((node) => {
        const left = Math.round((50 + Number(node.x || 0) * 18) * 100) / 100;
        const top = Math.round((50 + Number(node.y || 0) * 24) * 100) / 100;
        return `
        <span style="--left:${left}%;--top:${top}%;" title="${escapeHtml(node.material)}">
          <b>${escapeHtml(node.zone)}</b>
          <small>${node.queue}</small>
        </span>
      `;
      }).join('')}
    </div>
    <div data-three-runtime-zone="true"><canvas class="three-material-flow-scene" aria-label="Three.js Materialfluss Surface"></canvas></div>
  `;
}

function renderVanillaFallback(snapshot) {
  const queue = snapshot.loadLab.exceptionQueue || [];
  const blockers = queue.filter((entry) => entry.severity === 'blocker').length;
  return `
    <div class="erp-vanilla-fallback">
      <div data-vanilla-boundary-host="true">
        <b>Vanilla Boundary</b>
        <span>Seed ${escapeHtml(snapshot.seed)}</span>
        <small>${queue.length} Meldungen / ${blockers} Blocker</small>
      </div>
      <button type="button" data-xtend-command="erp.shell.legacyNavigationIntent" data-source-id="vanilla-fallback">Intent</button>
    </div>
    <div class="erp-iwebkit-fallback" data-xtension-fallback="vanilla-legacy-lab-iwebkit">
      <span>iWebKit 5</span>
      <b>iframe-sandbox</b>
    </div>
    <iframe title="iWebKit 5 Legacy Sandbox" data-iwebkit-sandbox="true" sandbox="allow-scripts" src="/dist/xtensions/vanilla-legacy-lab/iwebkit/index.html?seed=${encodeURIComponent(snapshot.seed)}"></iframe>
  `;
}

function renderOpenUi5Fallback(snapshot) {
  const orders = snapshot.loadLab.openUi5Procurement || [];
  return `
    <div class="erp-openui5-fallback" data-xtension-fallback="openui5-procurement-worklist" data-openui5-status="server-fallback">
      <table>
        <thead>
          <tr><th>Bestellung</th><th>Lieferant</th><th>Werk</th><th>Status</th><th class="num">Wert</th></tr>
        </thead>
        <tbody>
          ${orders.map((order) => `
            <tr class="erp-click-row" data-xtend-command="erp.shell.inspectOpenUi5Order" data-order-id="${escapeHtml(order.id)}" tabindex="0">
              <td>${escapeHtml(order.id)}</td>
              <td>${escapeHtml(order.supplier)}</td>
              <td>${escapeHtml(order.plant)}</td>
              <td>${escapeHtml(order.status)}</td>
              <td class="num">${currency(order.amount, order.currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderSchedulerFallback(snapshot) {
  return snapshot.loadLab.schedulerLanes.map((lane) => `
    <li>
      <span>${escapeHtml(lane.lane)}</span>
      <b>${lane.activeFibers}</b>
      <small>${lane.lastFrameMs} ms</small>
    </li>
  `).join('');
}

function renderThroughputFallback(snapshot) {
  const throughput = snapshot.loadLab.throughput;
  return `
    <span><b id="erp-throughput-docs">${throughput.documentsPerMinute}</b> Belege/min</span>
    <span><b id="erp-loadlab-surfaces">${throughput.nativeSurfaces}</b> RMT Surfaces</span>
    <span><b id="erp-loadlab-xtensions">${throughput.mountedXtensions}</b> XTensions</span>
    <span><b id="erp-native-exceptions">${snapshot.loadLab.exceptionQueue.length}</b> Exceptions</span>
  `;
}

function renderMenuBar(snapshot) {
  const menuBar = snapshot.menuBar;
  return `
      <nav class="erp-menubar" id="erp-menu-bar" aria-label="ERP module navigation" data-rmt-ssr-surface="erp.shell.menuBar" data-open-menu-id="${escapeHtml(menuBar.openMenuId)}" data-selected-command-id="${escapeHtml(menuBar.selectedCommandId)}">
        ${menuBar.groups.map((group) => {
          const open = menuBar.openMenuId === group.id;
          return `
        <div class="erp-menu-group${open ? ' is-open' : ''}" data-menu-group="${escapeHtml(group.id)}">
          <button type="button" class="erp-menu-trigger" id="erp-menu-trigger-${escapeHtml(group.id)}" aria-haspopup="menu" aria-expanded="${open ? 'true' : 'false'}" aria-controls="erp-menu-panel-${escapeHtml(group.id)}" data-xtend-command="erp.shell.toggleMenu" data-erp-menu-trigger data-menu-id="${escapeHtml(group.id)}">${escapeHtml(group.label)}</button>
          <div class="erp-menu-dropdown" id="erp-menu-panel-${escapeHtml(group.id)}" role="menu" aria-labelledby="erp-menu-trigger-${escapeHtml(group.id)}"${open ? '' : ' hidden'}>
            ${group.commands.map((command) => `
            <button type="button" role="menuitem" class="erp-menu-item${menuBar.selectedCommandId === command.id ? ' is-selected' : ''}" data-xtend-command="erp.shell.selectMenuCommand" data-erp-menu-command data-menu-id="${escapeHtml(group.id)}" data-command-id="${escapeHtml(command.id)}" data-command-label="${escapeHtml(command.label)}">
              <span>${escapeHtml(command.label)}</span>
              <kbd>${escapeHtml(command.shortcut || '')}</kbd>
              <small class="erp-menu-badge">${escapeHtml(command.badge || '')}</small>
            </button>
            `).join('')}
          </div>
        </div>
          `;
        }).join('')}
      </nav>`;
}

async function renderFrameworkSsrFragments(snapshot) {
  if (!existsSync(angularServerEntryPath)) {
    throw new Error('Angular platform-server SSR entry is missing; run build:xtensions before starting the catfood product.');
  }
  const angularServer = await import(pathToFileURL(angularServerEntryPath).href);
  const reactLedgerProps = {
    seed: snapshot.seed,
    company: snapshot.company,
    fiscalPeriod: snapshot.fiscalPeriod,
    currency: snapshot.currency,
    ledger: snapshot.ledger,
    auditTrail: snapshot.auditTrail,
    selectedLedgerItemId: ''
  };
  const reactSlaProps = {
    seed: snapshot.seed,
    company: snapshot.company,
    fiscalPeriod: snapshot.fiscalPeriod,
    processes: snapshot.processes,
    systemLoad: snapshot.systemLoad,
    loadLab: snapshot.loadLab,
    selectedKpiId: ''
  };
  const vueProcessState = {
    props: {
      seed: snapshot.seed,
      activeProcessId: snapshot.activeProcessId,
      processes: snapshot.processes,
      systemLoad: snapshot.systemLoad,
      processLatencyMs: snapshot.processLatencyMs
    },
    emit: null
  };
  const vueExceptionState = {
    props: {
      seed: snapshot.seed,
      activeProcessId: snapshot.activeProcessId,
      exceptionQueue: snapshot.loadLab.exceptionQueue,
      schedulerLanes: snapshot.loadLab.schedulerLanes,
      selectedExceptionId: ''
    },
    emit: null
  };
  const angular = await angularServer.renderAngularRiskWorkbench({
    seed: snapshot.seed,
    company: snapshot.company,
    fiscalPeriod: snapshot.fiscalPeriod,
    currency: snapshot.currency,
    risks: snapshot.loadLab.angularRiskWorkbench,
    selectedRiskId: ''
  });
  return {
    reactLedger: renderReactToString(React.createElement(LedgerPanel, { props: reactLedgerProps, emitSelection() {} })),
    reactSla: renderReactToString(React.createElement(SlaMatrix, { props: reactSlaProps, emitSelection() {} })),
    vueProcess: await renderVueToString(createSSRApp(ProcessSidebar(vueProcessState))),
    vueException: await renderVueToString(createSSRApp(ExceptionQueue(vueExceptionState))),
    angular
  };
}

function createClientResumeTransport(snapshot, rmtState, ssrResult, xtensions) {
  return {
    schema: 'xtend.rmt.ssr-resume-transport.v1',
    response: ssrResult.response,
    resume: ssrResult.resume,
    publicKey: {
      keyId: RESUME_KEY_ID,
      algorithm: 'ECDSA-P256-SHA256',
      jwk: resumePublicJwk
    },
    snapshot: {
      ...snapshot,
      rmtState,
      appState: {
        activeProcessId: snapshot.activeProcessId,
        menuBar: snapshot.menuBar,
        surfaceInfoDialog: snapshot.surfaceInfoDialog,
        xtensionControlDialog: snapshot.xtensionControlDialog,
        seed: snapshot.seed
      },
      xtensions
    },
    diagnostics: ssrResult.diagnostics || []
  };
}

function renderShell(snapshot, payload, ssrResult, frameworkSsr) {
  const activeProcess = snapshot.processes.find((entry) => entry.id === snapshot.activeProcessId) || snapshot.processes[0];
  const loadLab = snapshot.loadLab;
  const maracaCss = existsSync(path.join(productRoot, 'dist', 'maraca', 'xtend.maraca.css'))
    ? '<link rel="stylesheet" href="/dist/maraca/xtend.maraca.css" data-maraca-style="external">'
    : '';

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>XTend Resumability Maraca ERP Demo</title>
    <link rel="stylesheet" href="/src/styles/erp-shell.css">
    ${maracaCss}
  </head>
  <body>
    <!--nghm-->
    <div class="erp-window" id="erp-shell" data-resume-generation="${escapeHtml(payload.resume.generation)}" data-seed="${escapeHtml(snapshot.seed)}">
      <header class="erp-titlebar">
        <div>
          <strong>XTend ERP/GUI 7.40</strong>
          <span>Mandant 100</span>
          <span>${escapeHtml(snapshot.company)}</span>
        </div>
        <div class="erp-titlebar-status">
          <span>Seed ${escapeHtml(snapshot.seed)}</span>
          <span>SSR ${escapeHtml(ssrResult.status)}</span>
          <span>Resume ${escapeHtml(payload.resume.executionMode)}</span>
        </div>
      </header>

${renderMenuBar(snapshot)}

      <section class="erp-command-strip" aria-label="ERP command strip">
        <label for="erp-command-field">Transaktion</label>
        <input id="erp-command-field" value="/nXTEND_RMT_RESUME" readonly>
        <button type="button" data-xtend-command="erp.shell.reseedRequested" data-erp-action="reseed" data-seed="${escapeHtml(snapshot.seed)}">Neue Stichprobe</button>
        <span id="erp-menu-state-line">${escapeHtml(snapshot.menuBar.lastCommand)}</span>
        <span id="erp-kernel-status-line">Kernel: wartet auf Maraca-Boot</span>
      </section>

      <main class="erp-layout">
        <aside class="erp-sidebar" aria-label="Process overview">
          <div class="erp-pane-head">
            <span>Prozessbaum</span>
            <span>${snapshot.processes.length} Knoten</span>
          </div>
          <div class="erp-xtension-slot" data-xtension-slot="vue-process-sidebar" data-xtension-status="server-fallback">${frameworkSsr.vueProcess}</div>
        </aside>

        <section class="erp-workarea" aria-label="Ledger work area">
          <div class="erp-pane-head">
            <span>Hauptbuch / ${escapeHtml(snapshot.fiscalPeriod)}</span>
            <span>${escapeHtml(activeProcess.name)}</span>
          </div>
          <div class="erp-ledger-summary">
            <div><span>Belastung</span><b id="erp-exposure">${currency(snapshot.ledger.exposure, snapshot.currency)}</b></div>
            <div><span>Gutschrift</span><b id="erp-credits">${currency(snapshot.ledger.credits, snapshot.currency)}</b></div>
            <div><span>Differenz</span><b id="erp-variance">${currency(snapshot.ledger.variance, snapshot.currency)}</b></div>
            <div><span>Systemlast</span><b id="erp-load">${snapshot.systemLoad}%</b></div>
          </div>
          <div class="erp-xtension-slot erp-ledger-host" data-xtension-slot="react-ledger-panel" data-xtension-status="server-fallback">${frameworkSsr.reactLedger}</div>
        </section>

        <aside class="erp-audit" aria-label="Audit trail">
          <div class="erp-pane-head">
            <span>Journal</span>
            <span>${snapshot.processLatencyMs} ms</span>
          </div>
          <ol id="erp-audit-list">${renderAuditTrail(snapshot)}</ol>
        </aside>
      </main>

      <section class="erp-load-lab" aria-label="Parallel load lab">
        <div class="erp-pane-head">
          <span>RMT / XTension Load Lab</span>
          <span>${loadLab.throughput.mountedXtensions} XTensions / ${loadLab.throughput.nativeSurfaces} native Surfaces</span>
        </div>
        <div class="erp-load-grid">
          <section class="erp-load-panel erp-load-three" aria-label="Three material flow">
            <div class="erp-pane-head">
              <span>Three Material Flow</span>
              <span>${loadLab.frameBudget.targetMs} ms Budget</span>
            </div>
            <div class="erp-xtension-slot erp-three-host" data-xtension-slot="three-material-flow-scene" data-xtension-status="server-fallback" data-three-nonblank="false">
              ${renderThreeFallback(snapshot)}
            </div>
          </section>

          <section class="erp-load-panel erp-load-react" aria-label="SLA matrix">
            <div class="erp-pane-head">
              <span>React SLA Matrix</span>
              <span>${loadLab.kpiMatrix.length} Zellen</span>
            </div>
          <div class="erp-xtension-slot erp-sla-host" data-xtension-slot="react-sla-matrix" data-xtension-status="server-fallback">${frameworkSsr.reactSla}</div>
          </section>

          <section class="erp-load-panel erp-load-vue" aria-label="Exception queue">
            <div class="erp-pane-head">
              <span>Vue Exception Queue</span>
              <span>${loadLab.exceptionQueue.length} Meldungen</span>
            </div>
          <div class="erp-xtension-slot erp-exception-host" data-xtension-slot="vue-exception-queue" data-xtension-status="server-fallback">${frameworkSsr.vueException}</div>
          </section>

          <section class="erp-load-panel erp-load-vanilla" aria-label="Vanilla legacy lab">
            <div class="erp-pane-head">
              <span>Vanilla Legacy Lab</span>
              <span>iframe-sandbox</span>
            </div>
            <div class="erp-xtension-slot erp-vanilla-host" data-xtension-slot="vanilla-legacy-lab" data-xtension-status="server-fallback" data-vanilla-status="server-fallback" data-iwebkit-sandbox="true" data-iwebkit-frame-loads="0">
              ${renderVanillaFallback(snapshot)}
            </div>
          </section>

          <section class="erp-load-panel erp-load-openui5" aria-label="OpenUI5 procurement worklist">
            <div class="erp-pane-head">
              <span>OpenUI5 Procurement</span>
              <span>${loadLab.openUi5Procurement.length} Bestellungen</span>
            </div>
            <div class="erp-xtension-slot erp-openui5-host" data-xtension-slot="openui5-procurement-worklist" data-xtension-status="server-fallback" data-openui5-status="server-fallback">
              ${renderOpenUi5Fallback(snapshot)}
            </div>
          </section>

          <section class="erp-load-panel erp-load-angular" aria-label="Angular risk workbench">
            <div class="erp-pane-head">
              <span>Angular Risk Workbench</span>
              <span>${loadLab.angularRiskWorkbench.length} Risiken</span>
            </div>
            <div class="erp-xtension-slot erp-angular-host" data-xtension-slot="angular-risk-workbench" data-xtension-status="server-fallback" data-angular-status="server-fallback">
              ${frameworkSsr.angular.html}
            </div>
          </section>

          <section class="erp-load-panel erp-native-load" aria-label="Native RMT load surfaces">
            <div class="erp-pane-head">
              <span>Native RMT Surfaces</span>
              <span>${loadLab.schedulerLanes.length} Scheduler-Lanes</span>
            </div>
            <div class="erp-throughput-strip" id="erp-throughput-native">
              ${renderThroughputFallback(snapshot)}
            </div>
            <ol class="erp-scheduler-lanes" id="erp-scheduler-native">
              ${renderSchedulerFallback(snapshot)}
            </ol>
          </section>
        </div>
      </section>

      <section class="erp-rmt-runtime" aria-label="Maraca RMT server render">
        <div class="erp-pane-head">
          <span>RMT Server Render</span>
          <span>server_prerender_resume</span>
        </div>
        <div data-maraca-root data-rmt-worker-prewarm-targets="erp-kernel-status,erp-ledger-panel">
          ${ssrResult.html}
        </div>
      </section>

      <div id="erp-surface-info-dialog-host" data-rmt-ssr-surface="erp.shell.surfaceInfoDialog" data-rmt-lazy-modal="surface-info" data-lazy-state="unloaded" hidden></div>
      <div id="erp-xtension-control-dialog-host" data-rmt-ssr-surface="erp.shell.xtensionControlDialog" data-rmt-lazy-modal="xtension-control" data-lazy-state="unloaded" hidden></div>

      <footer class="erp-footer">
        <span id="erp-resume-status">Resume payload bereit</span>
        <span>${escapeHtml(payload.resume.integrity.signature.slice(0, 24))}</span>
      </footer>
    </div>

    <script id="xtend-erp-resume-payload" type="application/json" data-rmt-ssr-resume>${escapeJsonForScript(payload)}</script>
    <script type="module" src="/src/client/preboot-resume.mjs"></script>
    <script type="module" src="/src/client/resume-bridge.mjs"></script>
    <script id="xtend-maraca-entry" type="module" src="/dist/maraca/xtend.maraca.mjs"></script>
  </body>
</html>`;
}

async function createPage(seed, options = {}) {
  const snapshot = createErpSnapshot(seed);
  const frameworkSsr = await renderFrameworkSsrFragments(snapshot);
  const rmtState = createRmtStateFromSnapshot(snapshot);
  const rmtSource = await readFile(rmtSourcePath, 'utf8');
  const adapter = createRmtNodeSsrAdapter({
    compileRmtVNextSource,
    sourceTexts: {
      'src/rmt/erp-shell.rmt': rmtSource
    },
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
        'frame-src': ["'self'"],
        'worker-src': ["'self'"]
      }
    }
  });
  const xtensions = await readXTensionManifests();
  const generation = `erp-${snapshot.seed}-${Date.parse(snapshot.generatedAt) || Date.now()}`;
  const ssrResult = await adapter.render({
    source: rmtSource,
    filePath: 'products/resumability-maraca-erp-demo/src/rmt/erp-shell.rmt'
  }, {
    requestId: `erp-ssr-${snapshot.seed}`,
    rootId: 'xtend-maraca-root',
    templateId: 'erp.demo.shell',
    generation,
    executionMode: 'server_prerender_resume',
    model: snapshot,
    selectorValues: rmtState,
    resume: {
      state: rmtState,
      surfaces: snapshot,
      xtensions: Object.values(xtensions).filter(Boolean).map((manifest) => ({
        id: manifest.id,
        props: manifest.resume && manifest.resume.initialProps || {},
        adoptionStrategy: manifest.adoptionStrategy || manifest.resume && manifest.resume.adoptionStrategy
      })),
      manifests: Object.values(xtensions).filter(Boolean),
      keyId: RESUME_KEY_ID,
      sign(canonicalPayload) {
        const signature = signBytes('sha256', Buffer.from(canonicalPayload), {
          key: resumeSigningKey.privateKey,
          dsaEncoding: 'ieee-p1363'
        });
        return {
          algorithm: 'ECDSA-P256-SHA256',
          keyId: RESUME_KEY_ID,
          signature: signature.toString('base64url')
        };
      }
    }
  });
  const payload = createClientResumeTransport(snapshot, rmtState, ssrResult, xtensions);
  if (options.tamper === 'signature') {
    const signature = payload.resume && payload.resume.integrity && payload.resume.integrity.signature || '';
    const tamperedSignature = `${signature.startsWith('A') ? 'B' : 'A'}${signature.slice(1)}`;
    if (payload.resume && payload.resume.integrity) payload.resume.integrity.signature = tamperedSignature;
    if (payload.response && payload.response.resume && payload.response.resume.integrity) {
      payload.response.resume.integrity.signature = tamperedSignature;
    }
  }
  return {
    status: ssrResult.ok ? 200 : 500,
    headers: ssrResult.headers || {},
    body: renderShell(snapshot, payload, ssrResult, frameworkSsr),
    payload
  };
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Cache-Control': 'no-store'
  });
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

function sendHtml(response, status, headers, body) {
  response.writeHead(status, {
    ...headers,
    'Content-Type': 'text/html; charset=UTF-8',
    'Cache-Control': 'no-store'
  });
  response.end(body);
}

function sendNotFound(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
  response.end('Not found\n');
}

function safeStaticPath(urlPath) {
  const rootComponents = new Set([
    '/components/xstate.js',
    '/components/xdialog.js',
    '/components/xbutton.js',
    '/components/xselect.js',
    '/components/xicon.js',
    '/components/icon-packs/core.js',
    '/components/icon-packs/lucide.js',
    '/components/rmt-command.js'
  ]);
  if (rootComponents.has(urlPath)) {
    return path.join(repoRoot, urlPath.slice(1));
  }
  if (urlPath === '/xcommand/xcommand.js') {
    return path.join(repoRoot, 'xcommand', 'xcommand.js');
  }
  if (RMT_RUNTIME_MODULE_PATHS.has(urlPath)) {
    return path.join(repoRoot, urlPath.slice(1));
  }
  const allowedPrefixes = ['/dist/', '/src/client/', '/src/styles/'];
  if (!allowedPrefixes.some((prefix) => urlPath.startsWith(prefix))) return null;
  const decoded = decodeURIComponent(urlPath);
  const absolute = path.normalize(path.join(productRoot, decoded));
  if (!absolute.startsWith(productRoot)) return null;
  return absolute;
}

function serveStatic(request, response, urlPath) {
  const filePath = safeStaticPath(urlPath);
  if (!filePath || !existsSync(filePath)) {
    sendNotFound(response);
    return true;
  }
  response.writeHead(200, {
    'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  createReadStream(filePath).pipe(response);
  return true;
}

export function createDemoServer() {
  return createHttpServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
      if (request.method === 'GET' && requestUrl.pathname === '/') {
        const seed = requestUrl.searchParams.get('seed') || createSeed();
        const page = await createPage(seed, {
          tamper: requestUrl.searchParams.get('resume_tamper') || ''
        });
        sendHtml(response, page.status, page.headers, page.body);
        return;
      }

      if (request.method === 'GET' && requestUrl.pathname === '/api/erp/snapshot') {
        const seed = requestUrl.searchParams.get('seed') || 'api-seed';
        sendJson(response, 200, createClientSnapshot(seed));
        return;
      }

      if (request.method === 'POST' && requestUrl.pathname === '/api/erp/reseed') {
        const seed = createSeed();
        sendJson(response, 200, createClientSnapshot(seed));
        return;
      }

      if (request.method === 'GET' && requestUrl.pathname === '/healthz') {
        sendJson(response, 200, {
          ok: true,
          schema: 'xtend.local.resumability-maraca-erp-demo.health.v1',
          productRoot,
          maracaBuilt: existsSync(path.join(productRoot, 'dist', 'maraca', 'xtend.maraca.mjs')),
          xtensionsBuilt: existsSync(path.join(productRoot, 'dist', 'xtensions', 'xtensions.report.json')),
          resumeEnvelopeSchema: 'xtend.rmt.ssr-resume-envelope.v1',
          resumeKeyId: RESUME_KEY_ID
        });
        return;
      }

      if (request.method === 'GET' && serveStatic(request, response, requestUrl.pathname)) return;
      sendNotFound(response);
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        status: 'server_error',
        message: error && error.message ? error.message : String(error)
      });
    }
  });
}

export function startServer(options = {}) {
  const host = options.host || process.env.HOST || '127.0.0.1';
  const port = Number(options.port ?? process.env.PORT ?? 4177);
  const server = createDemoServer();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      if (!options.silent) {
        console.log(`XTend Resumability Maraca ERP Demo: http://${host}:${actualPort}`);
      }
      resolve({
        server,
        host,
        port: actualPort,
        close: () => new Promise((closeResolve, closeReject) => {
          server.close((error) => error ? closeReject(error) : closeResolve());
        })
      });
    });
  });
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

import { build } from 'vite';
import babelCore from '@babel/core';
import angularLinkerPlugin from '@angular/compiler-cli/linker/babel';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(productRoot, 'dist', 'xtensions');
const manifestRoot = path.join(distRoot, 'manifests');
const iwebkitSourceRoot = path.join(productRoot, 'src', 'legacy', 'iwebkit');
const openUi5Packages = [
  '@openui5/sap.ui.core',
  '@openui5/sap.m',
  '@openui5/sap.ui.layout',
  '@openui5/sap.ui.unified',
  '@openui5/themelib_sap_horizon'
];
const angularRuntimePackages = [
  '@angular/core',
  '@angular/common',
  '@angular/platform-browser',
  '@angular/platform-server',
  'rxjs'
];
const angularAotOutRoot = path.join(productRoot, '.angular-aot', 'angular-risk-workbench');
const frameworkProviderSourceRoot = path.join(productRoot, '.framework-provider-src');
const { transformAsync } = babelCore;

const frameworkRuntimeProviders = {
  react: {
    framework: 'react',
    mode: 'host-provided-local',
    modules: [
      '/dist/xtensions/frameworks/react/index.mjs',
      '/dist/xtensions/frameworks/react-dom/client.mjs'
    ],
    bundledInXtension: false,
    remoteAllowed: false,
    evidence: 'local-product-runtime-provider'
  },
  vue: {
    framework: 'vue',
    mode: 'host-provided-local',
    modules: [
      '/dist/xtensions/frameworks/vue/index.mjs'
    ],
    bundledInXtension: false,
    remoteAllowed: false,
    evidence: 'local-product-runtime-provider'
  }
};

const frameworkRuntimeProviderBuilds = [
  {
    id: 'react',
    sourceFile: 'react-provider.js',
    source: "export * from 'react';\nexport { default } from 'react';\n",
    outDir: path.join(distRoot, 'frameworks', 'react'),
    fileName: 'index.mjs'
  },
  {
    id: 'react-dom-client',
    sourceFile: 'react-dom-client-provider.js',
    source: "export { createRoot, hydrateRoot } from 'react-dom/client';\n",
    outDir: path.join(distRoot, 'frameworks', 'react-dom'),
    fileName: 'client.mjs'
  },
  {
    id: 'vue',
    sourceFile: 'vue-provider.js',
    source: "export * from 'vue';\n",
    outDir: path.join(distRoot, 'frameworks', 'vue'),
    fileName: 'index.mjs'
  }
];

const frameworkExternalPackages = {
  react: ['react', 'react-dom/client'],
  vue: ['vue']
};

const frameworkExternalPaths = {
  react: '/dist/xtensions/frameworks/react/index.mjs',
  'react-dom/client': '/dist/xtensions/frameworks/react-dom/client.mjs',
  vue: '/dist/xtensions/frameworks/vue/index.mjs'
};

const frameworkCapabilities = {
  react: [
    'react.root.lifecycle',
    'react.scheduling.hints',
    'react.boundary.diagnostics'
  ],
  vue: [
    'vue.app.lifecycle',
    'vue.explicit-update-adapter',
    'vue.event-normalization'
  ]
};

const entries = [
  {
    id: 'react-ledger-panel',
    exportName: 'createReactLedgerPanel',
    framework: 'react',
    entry: path.join(productRoot, 'src', 'xtensions', 'react-ledger-panel', 'index.js'),
    outDir: path.join(distRoot, 'react-ledger-panel'),
    name: 'ERP React Ledger Panel',
    dependencies: [
      {
        name: 'react',
        versionRange: '18.3.1',
        classification: 'host-provided',
        bundled: false,
        packageIncluded: false
      },
      {
        name: 'react-dom',
        versionRange: '18.3.1',
        classification: 'host-provided',
        bundled: false,
        packageIncluded: false
      }
    ],
    accepts: ['erp.ledger.snapshot', 'erp.ledger.selection.intent', 'erp.reseed.intent'],
    emits: ['erp.react.ledger.ready', 'erp.react.ledger.updated', 'erp.react.ledger.selected']
  },
  {
    id: 'vue-process-sidebar',
    exportName: 'createVueProcessSidebar',
    framework: 'vue',
    entry: path.join(productRoot, 'src', 'xtensions', 'vue-process-sidebar', 'index.js'),
    outDir: path.join(distRoot, 'vue-process-sidebar'),
    name: 'ERP Vue Process Sidebar',
    dependencies: [
      {
        name: 'vue',
        versionRange: '3.5.0',
        classification: 'host-provided',
        bundled: false,
        packageIncluded: false
      }
    ],
    accepts: ['erp.process.snapshot', 'erp.selection.intent', 'erp.process.selection.intent'],
    emits: ['erp.vue.process.ready', 'erp.vue.process.updated', 'erp.vue.process.selected']
  },
  {
    id: 'react-sla-matrix',
    exportName: 'createReactSlaMatrix',
    framework: 'react',
    entry: path.join(productRoot, 'src', 'xtensions', 'react-sla-matrix', 'index.js'),
    outDir: path.join(distRoot, 'react-sla-matrix'),
    name: 'ERP React SLA Matrix',
    dependencies: [
      {
        name: 'react',
        versionRange: '18.3.1',
        classification: 'host-provided',
        bundled: false,
        packageIncluded: false
      },
      {
        name: 'react-dom',
        versionRange: '18.3.1',
        classification: 'host-provided',
        bundled: false,
        packageIncluded: false
      }
    ],
    accepts: ['erp.loadlab.kpi.snapshot', 'erp.loadlab.kpi.selection.intent', 'erp.reseed.intent'],
    emits: ['erp.react.sla.ready', 'erp.react.sla.updated', 'erp.react.sla.selected']
  },
  {
    id: 'vue-exception-queue',
    exportName: 'createVueExceptionQueue',
    framework: 'vue',
    entry: path.join(productRoot, 'src', 'xtensions', 'vue-exception-queue', 'index.js'),
    outDir: path.join(distRoot, 'vue-exception-queue'),
    name: 'ERP Vue Exception Queue',
    dependencies: [
      {
        name: 'vue',
        versionRange: '3.5.0',
        classification: 'host-provided',
        bundled: false,
        packageIncluded: false
      }
    ],
    accepts: ['erp.loadlab.exceptions.snapshot', 'erp.exception.selection.intent', 'erp.reseed.intent'],
    emits: ['erp.vue.exception.ready', 'erp.vue.exception.updated', 'erp.vue.exception.selected']
  },
  {
    id: 'three-material-flow-scene',
    exportName: 'createThreeMaterialFlowScene',
    framework: 'three',
    entry: path.join(productRoot, 'src', 'xtensions', 'three-material-flow-scene', 'index.js'),
    outDir: path.join(distRoot, 'three-material-flow-scene'),
    name: 'ERP Three Material Flow Scene',
    dependencies: [
      {
        name: 'three',
        versionRange: '^0.170.0',
        classification: 'product-local-bundled',
        bundled: true,
        packageIncluded: true
      }
    ],
    accepts: ['erp.loadlab.material_flow.snapshot', 'erp.loadlab.scheduler.snapshot', 'erp.reseed.intent'],
    emits: ['erp.three.material_flow.ready', 'erp.three.frame.rendered', 'erp.three.frame.budget'],
    capabilities: [
      'three.render-loop.fiber',
      'frame.budget',
      'visibility.pause',
      'webgl.cleanup',
      'browser-smoke.nonblank'
    ]
  },
  {
    id: 'vanilla-legacy-lab',
    exportName: 'createVanillaLegacyLab',
    framework: 'vanilla',
    entry: path.join(productRoot, 'src', 'xtensions', 'vanilla-legacy-lab', 'index.js'),
    outDir: path.join(distRoot, 'vanilla-legacy-lab'),
    name: 'ERP Vanilla Legacy Lab',
    dependencies: [
      {
        name: 'iwebkit5-local-demo',
        versionRange: '5.x local fixture',
        classification: 'legacy-local-artifact',
        bundled: true,
        packageIncluded: false
      }
    ],
    isolation: {
      runtimeClass: 'legacy-global-dom',
      domBoundary: 'iframe-sandbox',
      styleBoundary: 'iframe',
      trustBoundary: 'sandboxed-adapter',
      mutationPolicy: 'blocked-by-iframe',
      sandbox: ['allow-scripts']
    },
    accepts: ['erp.vanilla.snapshot', 'erp.reseed.intent'],
    emits: ['erp.vanilla.legacy.mount', 'erp.vanilla.legacy.update', 'erp.vanilla.iwebkit.intent'],
    capabilities: [
      'vanilla.host-controller',
      'dom.boundary.shadow-root',
      'dom.boundary.iframe-sandbox',
      'legacy.sandbox.iframe',
      'postmessage.bridge.allowlist'
    ]
  },
  {
    id: 'openui5-procurement-worklist',
    exportName: 'createOpenUi5ProcurementWorklist',
    framework: 'openui5',
    entry: path.join(productRoot, 'src', 'xtensions', 'openui5-procurement-worklist', 'index.js'),
    outDir: path.join(distRoot, 'openui5-procurement-worklist'),
    name: 'ERP OpenUI5 Procurement Worklist',
    dependencies: openUi5Packages.map((name) => ({
      name,
      versionRange: '1.149.1',
      classification: 'product-local-bundled',
      bundled: true,
      packageIncluded: true
    })),
    isolation: {
      runtimeClass: 'openui5',
      domBoundary: 'host-owned-container',
      styleBoundary: 'global-theme-managed',
      trustBoundary: 'same-origin-adapter',
      mutationPolicy: 'adapter-owned-inside-host-container'
    },
    accepts: ['erp.openui5.procurement.snapshot', 'erp.openui5.procurement.selection.intent', 'erp.reseed.intent'],
    emits: ['erp.openui5.procurement.ready', 'erp.openui5.procurement.updated', 'erp.openui5.procurement.selected'],
    capabilities: [
      'openui5.loader.lazy',
      'openui5.control.lifecycle',
      'openui5.model.json',
      'dom.boundary.host-owned-container',
      'style.boundary.global-theme-managed'
    ]
  },
  {
    id: 'angular-risk-workbench',
    exportName: 'createAngularRiskWorkbench',
    framework: 'angular',
    entry: path.join(angularAotOutRoot, 'index.js'),
    sourceEntry: path.join(productRoot, 'src', 'xtensions', 'angular-risk-workbench', 'index.ts'),
    tsconfig: path.join(productRoot, 'src', 'xtensions', 'angular-risk-workbench', 'tsconfig.json'),
    outDir: path.join(distRoot, 'angular-risk-workbench'),
    name: 'ERP Angular Risk Workbench',
    buildMode: 'aot',
    prepare: 'angular-aot',
    dependencies: angularRuntimePackages.map((name) => ({
      name,
      versionRange: name === 'rxjs' ? '^7.8.0' : '~19.2.0',
      classification: 'product-local-bundled',
      bundled: true,
      packageIncluded: true
    })),
    isolation: {
      runtimeClass: 'angular',
      buildMode: 'aot',
      domBoundary: 'host-owned-container',
      styleBoundary: 'host-css-owned',
      trustBoundary: 'same-origin-adapter',
      mutationPolicy: 'adapter-owned-inside-host-container'
    },
    accepts: ['erp.angular.risk.snapshot', 'erp.angular.risk.selection.intent', 'erp.reseed.intent'],
    emits: ['erp.angular.risk.ready', 'erp.angular.risk.updated', 'erp.angular.risk.selected'],
    capabilities: [
      'angular.standalone.bootstrap',
      'angular.aot.bundle',
      'angular.signals.model',
      'angular.zoneless.change-detection',
      'angular.applicationref.destroy',
      'dom.boundary.host-owned-container',
      'style.boundary.host-css-owned'
    ]
  }
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function manifestFor(entry, bundleText) {
  const integrity = sha256(bundleText);
  const adoptionStrategy = ['react', 'vue', 'angular'].includes(entry.framework) ? 'dom_hydrate' : 'host_activate';
  const clientEntry = `/dist/xtensions/${entry.id}/index.mjs`;
  const serverEntry = entry.framework === 'angular'
    ? '/dist/xtensions/angular-risk-workbench/server.mjs'
    : `host:server/index.mjs#${entry.id}`;
  const commonCapabilities = [
    'host.lifecycle.mount',
    'host.lifecycle.adopt',
    'host.lifecycle.update',
    'host.lifecycle.suspend',
    'host.lifecycle.resume',
    'host.lifecycle.unmount',
    'signal.downstream',
    'event.upstream',
    'loading.dynamic-import',
    'fallback.native-placeholder',
    'scheduler.hints'
  ];
  const capabilities = Array.from(new Set([
    ...commonCapabilities,
    ...(frameworkCapabilities[entry.framework] || []),
    ...(entry.capabilities || [])
  ]));
  const runtimeProvider = frameworkRuntimeProviders[entry.framework] || null;
  return {
    schema: 'xtend.maraca.xtension-manifest.v1',
    id: `xtension.erp.${entry.id}`,
    name: entry.name,
    framework: entry.framework,
    version: '0.0.0-local',
    owner: 'local-resumability-maraca-erp-demo',
    entry: {
      module: clientEntry,
      exportName: entry.exportName,
      format: 'esm',
      dynamicImport: true
    },
    integrity: {
      sha256: `sha256:${integrity}`,
      source: 'local-product-build'
    },
    resumeSchema: 'xtend.xtensions.resume-manifest.v1',
    clientEntry,
    serverEntry,
    bundleIntegrity: `sha256:${integrity}`,
    snapshotSchema: `xtend.local.${entry.id}.snapshot.v1`,
    adoptionStrategy,
    resume: {
      schema: 'xtend.xtensions.resume-manifest.v1',
      clientEntry,
      serverEntry,
      bundleIntegrity: `sha256:${integrity}`,
      snapshotSchema: `xtend.local.${entry.id}.snapshot.v1`,
      adoptionStrategy,
      fallbackMode: 'server_prerender_hydrate',
      mountedIsResume: false
    },
    csp: {
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      workerSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:']
    },
    security: {
      owner: 'local-resumability-maraca-erp-demo',
      localFixtureNoNetwork: true,
      remoteArtifactsAllowed: false
    },
    ...(runtimeProvider ? { runtimeProvider } : {}),
    buildMode: entry.buildMode || 'bundle',
    lazy: {
      mode: 'visible',
      optIn: true,
      policy: 'erp-demo-visible-panel',
      prefetch: false,
      preload: false
    },
    contract: {
      hostControllerSchema: 'xtend.xtensions.host-controller.v1',
      signalBridgeSchema: 'xtend.xtensions.signal-bridge.v1',
      kernelSignalSchema: 'xtend.xtensions.kernel-signal.v1',
      surfaceEventSchema: 'xtend.xtensions.surface-event.v1',
      accepts: entry.accepts,
      emits: entry.emits,
      capabilities
    },
    capabilities,
    dependencies: entry.dependencies,
    isolation: entry.isolation || {
      runtimeClass: entry.framework,
      domBoundary: 'host-owned-container',
      styleBoundary: 'scoped-css',
      trustBoundary: 'same-origin-adapter',
      mutationPolicy: 'observe-and-degrade'
    },
    fallback: {
      mode: 'native-placeholder',
      component: `xtend-native.${entry.id}.fallback`,
      message: `${entry.name} unavailable`,
      degradedStatus: `xtension-${entry.id}-unavailable`
    },
    policy: {
      securityGate: 'xtend.xtensions.security-integrity-gate.v1',
      status: 'local-demo-approved',
      dependencyBoundary: 'product-local-framework-dependencies'
    },
    timestamp: new Date().toISOString()
  };
}

function createAngularLinkerVitePlugin() {
  return {
    name: 'xtend-angular-aot-linker',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.includes('/node_modules/@angular/') && !id.includes('/.angular-aot/')) return null;
      if (!code.includes('ɵɵngDeclare')) return null;
      const result = await transformAsync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        compact: false,
        sourceMaps: false,
        plugins: [[angularLinkerPlugin, {
          linkerJitMode: false,
          sourceMapping: false,
          unknownDeclarationVersionHandling: 'error'
        }]]
      });
      if (!result || !result.code) return null;
      return {
        code: result.code,
        map: null
      };
    }
  };
}

function sanitizeIwebkitIndex(html) {
  return html
    .replace(/<!DOCTYPE[\s\S]*?>/i, '<!doctype html>')
    .replace(/\s+xmlns=["']https?:\/\/[^"']+["']/gi, '')
    .replace(/<script\s+src=["']javascript\/functions\.js["'][^>]*><\/script>/i, '')
    .replace(/<script[^>]*>\s*var\s+_gaq[\s\S]*?<\/script>/i, '')
    .replace(/<(?:embed|object)\b[\s\S]*?<\/(?:embed|object)>/gi, '')
    .replace(/<(?:embed|object)\b[^>]*>/gi, '')
    .replace(/url\(\s*(['"]?)https?:\/\/[^'")]+\1\s*\)/gi, 'none')
    .replace(/\s+href=["'][^"']+\.php(?:[^"']*)["']/gi, ' href="#blocked-legacy-php" data-iwebkit-blocked-php="true"')
    .replace(/\s+href=["']https?:\/\/[^"']+["']/gi, ' href="#blocked-remote" data-iwebkit-blocked-remote="true"')
    .replace(/\s+src=["']https?:\/\/[^"']+["']/gi, ' data-iwebkit-blocked-src="true"')
    .replace(/\s+href=["']javascript:[^"']*["']/gi, ' href="#blocked-javascript-url" data-iwebkit-blocked-javascript-url="true"')
    .replace('</head>', '<script src="javascript/iwebkit-sandbox-bridge.js" type="text/javascript"></script>\n</head>');
}

function iwebkitBridgeScript() {
  return `(function () {
  var SCHEMA = 'xtend.local.iwebkit5.sandbox-event.v1';
  var HOST_UPDATE_SCHEMA = 'xtend.local.iwebkit5.host-update.v1';
  var hostPort = null;
  function emit(type, payload) {
    var envelope = {
      schema: SCHEMA,
      type: type,
      payload: payload || {},
      href: payload && payload.href || '',
      label: payload && payload.text || '',
      timestamp: Date.now()
    };
    if (hostPort) {
      try {
        hostPort.postMessage(envelope);
        return;
      } catch (error) {}
    }
    try {
      parent.postMessage(envelope, '*');
    } catch (error) {}
  }
  function updateStatus(data) {
    var seed = data && data.seed || seedFromLocation();
    if (document.body && seed) {
      document.body.setAttribute('data-iwebkit-resume-seed', seed);
    }
    var title = document.getElementById('title');
    if (title && seed) {
      title.textContent = 'iWebKit 5 / ' + seed;
    }
  }
  function seedFromLocation() {
    try {
      return new URLSearchParams(window.location.search || '').get('seed') || '';
    } catch (error) {
      return '';
    }
  }
  function readyPayload(reason) {
    var visibleSeed = (document.getElementById('title') && document.getElementById('title').textContent || '').replace(/^iWebKit 5\\s*\\/\\s*/, '');
    return {
      title: document.title || 'iWebKit 5 Demo',
      linkCount: document.links ? document.links.length : 0,
      seed: visibleSeed || seedFromLocation(),
      reason: reason || 'load',
      resumed: true
    };
  }
  function localNavigationTarget(href) {
    var value = String(href || '').trim();
    if (!value || value.charAt(0) === '#') return '';
    if (/^(?:https?:|javascript:|mailto:|tel:)/i.test(value)) return '';
    if (/(?:^|\\/)\\.\\.(?:\\/|$)/.test(value)) return '';
    if (!/\\.html(?:[?#].*)?$/i.test(value)) return '';
    return value;
  }
  function withResumeQuery(href) {
    var seed = seedFromLocation();
    if (!seed || /[?&]seed=/i.test(href)) return href;
    var hash = '';
    var hashIndex = href.indexOf('#');
    if (hashIndex >= 0) {
      hash = href.slice(hashIndex);
      href = href.slice(0, hashIndex);
    }
    return href + (href.indexOf('?') >= 0 ? '&' : '?') + 'seed=' + encodeURIComponent(seed) + hash;
  }
  function markInteraction(payload) {
    try {
      document.body.setAttribute('data-iwebkit-last-intent', payload && payload.href || '');
    } catch (error) {}
  }
  window.addEventListener('message', function (event) {
    var data = event && event.data || {};
    if (data.schema !== HOST_UPDATE_SCHEMA) return;
    if (event.ports && event.ports[0]) {
      hostPort = event.ports[0];
      if (hostPort.start) hostPort.start();
    }
    updateStatus(data);
    emit('ready', readyPayload(data.reason || 'host-update'));
  });
  document.addEventListener('click', function (event) {
    var node = event.target;
    while (node && node !== document && node.tagName !== 'A') node = node.parentNode;
    if (!node || node === document) return;
    event.preventDefault();
    event.stopPropagation();
    var payload = {
      href: node.getAttribute('href') || '',
      text: (node.textContent || '').replace(/\\s+/g, ' ').trim()
    };
    emit('navigation-intent', payload);
    markInteraction(payload);
    var nextHref = localNavigationTarget(payload.href);
    if (nextHref) window.location.href = withResumeQuery(nextHref);
  }, true);
  window.addEventListener('load', function () {
    updateStatus({ seed: seedFromLocation() });
    emit('ready', readyPayload('load'));
  });
}());\n`;
}

async function buildIwebkitSandboxAssets() {
  const outRoot = path.join(distRoot, 'vanilla-legacy-lab', 'iwebkit');
  await mkdir(path.join(outRoot, 'javascript'), { recursive: true });
  await Promise.all(['css'].map((dir) => (
    cp(path.join(iwebkitSourceRoot, dir), path.join(outRoot, dir), { recursive: true })
  )));
  const rootFiles = await readdir(iwebkitSourceRoot);
  await Promise.all(rootFiles.filter((file) => file.endsWith('.html')).map(async (file) => {
    const html = await readFile(path.join(iwebkitSourceRoot, file), 'utf8');
    await writeFile(path.join(outRoot, file), sanitizeIwebkitIndex(html));
  }));
  await writeFile(path.join(outRoot, 'javascript', 'iwebkit-sandbox-bridge.js'), iwebkitBridgeScript());
}

async function buildOpenUi5Resources() {
  const resourceRoot = path.join(distRoot, 'openui5', 'resources');
  await mkdir(resourceRoot, { recursive: true });
  for (const packageName of openUi5Packages) {
    const sourceRoot = path.join(productRoot, 'node_modules', ...packageName.split('/'), 'src');
    await cp(sourceRoot, resourceRoot, { recursive: true, force: true });
  }
  await writeOpenUi5SourcePackageShims(resourceRoot);
}

async function walkFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function openUi5PreloadShim(name) {
  return `/* XTend local OpenUI5 source-package shim: ${name}.
 * The npm src packages do not ship generated preload bundles; UI5 falls back
 * to individual modules when this file is intentionally empty.
 */
`;
}

function openUi5ThemeCssShim(relativeDir) {
  return `/* XTend local OpenUI5 source-package theme shim: ${relativeDir}.
 * The ERP demo owns compact visual styling via erp-shell.css while OpenUI5
 * consumes this generated placeholder to avoid missing library.css requests.
 */
.sapUiSizeCompact {
  font-size: 12px;
}

.openui5-procurement-worklist .sapMBar {
  min-height: 30px;
}

.openui5-procurement-worklist .sapMListTbl {
  width: 100%;
  border-collapse: collapse;
}

.openui5-procurement-worklist .sapMListTblCell,
.openui5-procurement-worklist .sapMListTblHeaderCell {
  padding: 3px 5px;
}
`;
}

function openUi5LibraryManifestShim(libraryName) {
  return {
    _version: '1.21.0',
    'sap.app': {
      id: libraryName,
      type: 'library',
      title: libraryName,
      applicationVersion: {
        version: '1.149.1'
      }
    },
    'sap.ui5': {
      library: {
        i18n: {
          bundleUrl: 'messagebundle.properties',
          supportedLocales: ['', 'de', 'en'],
          fallbackLocale: 'de'
        }
      }
    }
  };
}

async function writeOpenUi5SourcePackageShims(resourceRoot) {
  const preloadShims = [
    'Calendar-preload.js',
    'Library-preload.js',
    'Eventing-preload-0.js',
    'Eventing-preload-1.js',
    'Theming-preload.js'
  ];
  await Promise.all(preloadShims.map((name) => (
    writeFile(path.join(resourceRoot, name), openUi5PreloadShim(name))
  )));
  await writeFile(path.join(resourceRoot, 'sap-ui-version.json'), `${JSON.stringify({
    name: 'OpenUI5',
    version: '1.149.1',
    buildTimestamp: 'local-product-source-package',
    scn: 'local-product-source-package',
    gav: 'org.openui5:local-product-source-package:1.149.1',
    libraries: [
      { name: 'sap.ui.core', version: '1.149.1' },
      { name: 'sap.m', version: '1.149.1' },
      { name: 'sap.ui.layout', version: '1.149.1' },
      { name: 'sap.ui.unified', version: '1.149.1' }
    ]
  }, null, 2)}\n`);

  await Promise.all([
    mkdir(path.join(resourceRoot, 'sap', 'm'), { recursive: true }),
    mkdir(path.join(resourceRoot, 'sap', 'ui', 'core'), { recursive: true })
  ]);
  await Promise.all([
    writeFile(
      path.join(resourceRoot, 'sap', 'm', 'manifest.json'),
      `${JSON.stringify(openUi5LibraryManifestShim('sap.m'), null, 2)}\n`
    ),
    writeFile(
      path.join(resourceRoot, 'sap', 'ui', 'core', 'manifest.json'),
      `${JSON.stringify(openUi5LibraryManifestShim('sap.ui.core'), null, 2)}\n`
    )
  ]);

  const localeAliases = [
    ['sap/m/messagebundle_de.properties', 'sap/m/messagebundle_de_DE.properties'],
    ['sap/ui/core/messagebundle_de.properties', 'sap/ui/core/messagebundle_de_DE.properties']
  ];
  await Promise.all(localeAliases.map(async ([source, target]) => {
    const sourcePath = path.join(resourceRoot, ...source.split('/'));
    const targetPath = path.join(resourceRoot, ...target.split('/'));
    await cp(sourcePath, targetPath, { force: true });
  }));

  const files = await walkFiles(resourceRoot);
  await Promise.all(files
    .filter((file) => path.basename(file) === 'library.source.less')
    .map(async (file) => {
      const themeDir = path.dirname(file);
      const relativeDir = path.relative(resourceRoot, themeDir);
      await writeFile(path.join(themeDir, 'library.css'), openUi5ThemeCssShim(relativeDir));
    }));
}

function externalPackagesFor(entry) {
  return frameworkExternalPackages[entry.framework] || [];
}

function outputPathsFor(entry) {
  const packages = externalPackagesFor(entry);
  return packages.reduce((paths, packageName) => {
    paths[packageName] = frameworkExternalPaths[packageName];
    return paths;
  }, {});
}

async function buildFrameworkRuntimeProviders() {
  await rm(frameworkProviderSourceRoot, { recursive: true, force: true });
  await mkdir(frameworkProviderSourceRoot, { recursive: true });
  for (const provider of frameworkRuntimeProviderBuilds) {
    const entryPath = path.join(frameworkProviderSourceRoot, provider.sourceFile);
    await writeFile(entryPath, provider.source);
    await build({
      root: productRoot,
      logLevel: 'warn',
      build: {
        emptyOutDir: false,
        minify: true,
        target: 'es2020',
        lib: {
          entry: entryPath,
          formats: ['es'],
          fileName: () => provider.fileName
        },
        outDir: provider.outDir,
        rollupOptions: {
          output: {
            entryFileNames: provider.fileName,
            inlineDynamicImports: true
          }
        }
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('production')
      }
    });
  }
}

async function buildAngularAot(entry) {
  await rm(angularAotOutRoot, { recursive: true, force: true });
  await mkdir(angularAotOutRoot, { recursive: true });
  const ngc = path.join(productRoot, 'node_modules', '.bin', 'ngc');
  const result = spawnSync(ngc, ['-p', entry.tsconfig], {
    cwd: productRoot,
    stdio: 'inherit'
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Angular AOT build failed for ${entry.id} with status ${result.status}.`);
  }
}

async function buildAngularServerBundle(entry) {
  await build({
    root: productRoot,
    logLevel: 'warn',
    plugins: [createAngularLinkerVitePlugin()],
    build: {
      emptyOutDir: false,
      minify: true,
      target: 'node18',
      ssr: path.join(angularAotOutRoot, 'server.js'),
      outDir: entry.outDir,
      rollupOptions: {
        output: {
          entryFileNames: 'server.mjs',
          inlineDynamicImports: true
        }
      }
    },
    ssr: {
      noExternal: true
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    }
  });
}

await mkdir(manifestRoot, { recursive: true });
await buildFrameworkRuntimeProviders();

for (const entry of entries) {
  if (entry.prepare === 'angular-aot') {
    await buildAngularAot(entry);
  }

  await build({
    root: productRoot,
    logLevel: 'warn',
    plugins: entry.framework === 'angular' ? [createAngularLinkerVitePlugin()] : [],
    build: {
      emptyOutDir: false,
      minify: true,
      target: 'es2020',
      lib: {
        entry: entry.entry,
        formats: ['es'],
        fileName: () => 'index.mjs'
      },
      outDir: entry.outDir,
      rollupOptions: {
        external: externalPackagesFor(entry),
        output: {
          entryFileNames: 'index.mjs',
          inlineDynamicImports: true,
          paths: outputPathsFor(entry)
        }
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    }
  });

  if (entry.framework === 'angular') {
    await buildAngularServerBundle(entry);
  }

  const bundlePath = path.join(entry.outDir, 'index.mjs');
  const bundleText = await readFile(bundlePath, 'utf8');
  await writeFile(
    path.join(manifestRoot, `${entry.id}.json`),
    `${JSON.stringify(manifestFor(entry, bundleText), null, 2)}\n`
  );
}

await buildIwebkitSandboxAssets();
await buildOpenUi5Resources();

const report = {
  schema: 'xtend.local.resumability-maraca-erp-demo.xtensions-report.v1',
  status: 'built',
  frameworkRuntimeProviders,
  xtensions: entries.map((entry) => ({
    id: entry.id,
    bundle: `dist/xtensions/${entry.id}/index.mjs`,
    manifest: `dist/xtensions/manifests/${entry.id}.json`
  }))
};

await writeFile(path.join(distRoot, 'xtensions.report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Built ${entries.length} local XTension bundles.`);

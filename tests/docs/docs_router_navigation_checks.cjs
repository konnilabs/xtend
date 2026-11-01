'use strict';

// DOM integration, not browser/sandbox evidence. Execute the real page, shell,
// router, scheduler and trust modules against PHP-generated documents/fragments.
// Standalone: node --experimental-vm-modules tests/docs/docs_router_navigation_checks.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { generateKeyPairSync, webcrypto } = require('node:crypto');
const { JSDOM, VirtualConsole } = require('jsdom');

const pause = () => new Promise(resolve => setTimeout(resolve, 10));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function until(predicate, message) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await pause();
  }
  assert.fail(typeof message === 'function' ? message() : message);
}

async function runChecks(rootDir) {
  const passes = [], failures = [];
  async function check(name, callback) {
    try { await callback(); passes.push(name); }
    catch (error) { failures.push(`${name}: ${error.stack || error.message}`); }
  }
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-docs-router-'));
  const keyPath = path.join(directory, 'resume.pem');
  const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  fs.writeFileSync(keyPath, pair.privateKey.export({ format: 'pem', type: 'pkcs8' }), { mode: 0o600 });
  const responses = new Map();
  function php(route, fragment = false, signed = false) {
    const key = JSON.stringify([route, fragment, signed]);
    if (responses.has(key)) return responses.get(key);
    const result = spawnSync('php', ['-r', [
      "$_SERVER['SCRIPT_NAME'] = '/docs/index.php';",
      `$_SERVER['REQUEST_URI'] = ${JSON.stringify(route)};`,
      `$_SERVER['HTTP_ACCEPT'] = ${JSON.stringify(fragment ? 'application/vnd.xtend.rmt-route+json' : 'text/html')};`,
      'include "docs/index.php";'
    ].join('\n')], {
      cwd: rootDir, encoding: 'utf8', timeout: 30000, maxBuffer: 16 * 1024 * 1024,
      env: { ...process.env, XTEND_DOCS_DOCUMENT_SSR: 'v2', XTEND_DOCS_SSR_MODE: signed ? 'resume' : 'hydrate',
        XTEND_DOCS_RESUME_PRIVATE_KEY_FILE: signed ? keyPath : '', XTEND_DOCS_RESUME_KEY_ID: 'router-test',
        XTEND_DOCS_PUBLIC_ORIGIN: 'http://localhost' }
    });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    responses.set(key, result.stdout);
    return result.stdout;
  }

  async function boot(route = '/docs/de/readme', signed = false) {
    const errors = [], requests = [], fallbacks = [], verifiedSnapshots = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', error => {
      if (error.type !== 'not-implemented') errors.push(error.message);
    });
    virtualConsole.on('error', (...args) => errors.push(args.map(String).join(' ')));
    const dom = new JSDOM(php(route, false, signed), {
      url: `http://localhost${route}`, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole
    });
    const { window } = dom;
    const originalPage = window.document.querySelector('xtend-doc-page');
    const originalContent = originalPage.querySelector('#md-content');
    const control = { transport: null, digest: null };
    Object.assign(window, { TextEncoder, TextDecoder, AbortController, AbortSignal });
    Object.defineProperty(window, 'crypto', { value: { subtle: new Proxy(webcrypto.subtle, {
      get(target, name) {
        if (name === 'digest') return (...args) => control.digest
          ? control.digest(...args) : target.digest(...args);
        return typeof target[name] === 'function' ? target[name].bind(target) : target[name];
      }
    }) } });
    window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    window.scrollTo = () => {};
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.fetch = async (input, options = {}) => {
      const url = new URL(input, window.location.href);
      const fragment = options.headers?.Accept === 'application/vnd.xtend.rmt-route+json';
      if (fragment) {
        const request = { path: url.pathname, signal: options.signal };
        requests.push(request);
        if (control.transport) {
          const response = control.transport(request);
          if (response) return response;
        }
        return { ok: true, json: async () => JSON.parse(php(url.pathname, true, signed)) };
      }
      return { ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(rootDir, url.pathname), 'utf8')) };
    };
    window.addEventListener('xtend-docs-document-navigation-fallback', event => fallbacks.push(event.detail));
    for (const script of window.document.scripts) {
      if (!script.src && !script.type) window.eval(script.textContent);
    }
    const context = dom.getInternalVMContext();
    const modules = new Map();
    function moduleFor(specifier, parent = window.location.href) {
      const url = new URL(specifier, parent).href;
      if (modules.has(url)) return modules.get(url);
      const module = new vm.SourceTextModule(fs.readFileSync(path.join(rootDir, new URL(url).pathname), 'utf8'), {
        context, identifier: url, initializeImportMeta(meta) { meta.url = url; },
        importModuleDynamically: (specifier, reference) => load(specifier, reference.identifier)
      });
      modules.set(url, module);
      return module;
    }
    async function load(specifier, parent) {
      const module = moduleFor(specifier, parent);
      if (module.status === 'unlinked') await module.link((specifier, reference) => moduleFor(specifier, reference.identifier));
      if (module.status === 'linked') await module.evaluate();
      return module;
    }
    if (signed) {
      window.XTendRmtResumeRuntime = (await load('/xtendrmt/rmt-resume-runtime.js')).namespace;
      // Use the production signature verifier; full Maraca/Classic boot remains
      // the browser smoke's responsibility, not a claim made by this DOM test.
      const bootstrap = fs.readFileSync(path.join(rootDir, 'docs/utils/docs-resume-bootstrap.mjs'), 'utf8');
      window.eval(bootstrap.slice(0, bootstrap.indexOf('window.__XTendMaracaDisableAutoBoot')));
      const verify = window.xtendDocsVerifyResumeEnvelope;
      window.xtendDocsVerifyResumeEnvelope = async (...args) => {
        const result = await verify(...args);
        if (result.ok) verifiedSnapshots.push(JSON.parse(args[0]).snapshot);
        return result;
      };
    }
    await load('/docs/utils/trusted-dom-host.mjs');
    await load('/components/xrouter.js');
    await load('/docs/utils/page/index.mjs');
    await load('/docs/utils/docs-shell-runtime.mjs');
    const router = window.document.querySelector('x-router');
    const page = () => router.shadowRoot.querySelector('xtend-doc-page');
    const content = () => page()?.querySelector('#md-content');
    async function ready(slug) {
      await until(() => page()?.getAttribute('data-docs-route-slug') === slug
        && page()?.getAttribute('data-docs-route-phase') === 'ready', () => `Route ${slug} did not finish: ${JSON.stringify({ errors, fallbacks })}`);
      assert(content().textContent.trim().length > 100, `${slug} content must remain visible`);
      assert.equal(page(), originalPage, 'router reuses the adopted page host');
      assert.equal(page().hasAttribute('aria-busy'), false);
    }
    await ready(route.split('/').pop());
    await until(() => window.xtendDocsShellRuntime.snapshot().registeredRouteLocale !== '', 'routes did not register');
    return { window, router, page, content, originalPage, originalContent, ready, requests, errors, fallbacks, verifiedSnapshots, control,
      async navigate(slug, locale = 'de') { router.navigate(`/docs/${locale}/${slug}`); await ready(slug); },
      close() { window.xtendDocsShellRuntime.dispose(); window.dispatchEvent(new window.Event('pagehide')); dom.window.close(); }
    };
  }

  try {
    for (const signed of [false, true]) {
      const mode = signed ? 'signed resume' : 'hydrate';
      let app;
      try {
        app = await boot('/docs/de/readme', signed);
        await check(`${mode}: SSR takeover preserves article nodes without fetching/replaying`, async () => {
          assert.equal(app.content(), app.originalContent);
          assert.equal(app.page().getAttribute('data-docs-initial-route-replay'), 'skipped');
          assert.equal(app.requests.length, 0);
          assert.equal(app.page().getAttribute('data-xrouter-route-adopted'), 'true');
        });
        await check(`${mode}: first and repeated navigation commit real article content`, async () => {
          const shell = app.page().querySelector('.docs-app-shell');
          await app.navigate('manifest');
          assert.equal(app.page().querySelector('.docs-app-shell'), shell);
          assert.equal(app.content(), app.originalContent);
          if (signed) assert(app.verifiedSnapshots.some(snapshot => snapshot.state['xtend.docs.route'].slug === 'manifest'));
          assert.match(app.content().querySelector('h1').textContent, /Manifest/);
          assert.match(app.window.document.title, /Manifest/);
          const introduction = app.content().querySelector('p').textContent;
          await app.navigate('readme');
          await app.navigate('manifest');
          assert.match(app.content().querySelector('h1').textContent, /Manifest/);
          assert.equal(app.content().querySelector('p').textContent, introduction);
          assert.match(app.content().querySelector('x-code template').content.textContent, /x-button/);
          assert.equal(app.requests.filter(request => request.path.endsWith('/manifest')).length, 1, 'cached route stays usable');
        });
        await check(`${mode}: Back and Forward preserve content and document identity`, async () => {
          const document = app.window.document;
          app.window.history.back();
          await app.ready('readme');
          assert.equal(app.window.location.pathname, '/docs/de/readme');
          app.window.history.forward();
          await app.ready('manifest');
          assert.equal(app.window.location.pathname, '/docs/de/manifest');
          assert.equal(app.window.document, document);
          assert.equal(app.fallbacks.length, 0);
        });
        await check(`${mode}: download interaction remains bound to the current article`, async () => {
          const button = app.page().querySelector('#download-link');
          const requests = [];
          const fetch = app.window.fetch, toast = app.window.xtendShowToast;
          app.window.fetch = async (input, options) => {
            if (!String(input).startsWith('?download=')) return fetch(input, options);
            requests.push(String(input));
            return { ok: false }; // Exercise listener/route ownership; no file download in JSDOM.
          };
          app.window.xtendShowToast = async () => {};
          const activate = async () => {
            button.dispatchEvent(new app.window.CustomEvent('button-interaction', { bubbles: true, composed: true }));
            await until(() => !button.hasAttribute('disabled'), 'download listener did not settle');
          };
          try {
            await activate();
            await app.navigate('readme');
            assert.equal(app.page().querySelector('#download-link'), button);
            await activate();
            assert.deepEqual(requests, ['?download=manifest&locale=de', '?download=readme&locale=de']);
          } finally { app.window.fetch = fetch; app.window.xtendShowToast = toast; }
        });
        await check(`${mode}: trusted HTML is sanitized by the kernel before cached-route commits`, async () => {
          const host = app.window.xtendDocsTrustedDomRuntime;
          const target = app.window.document.createElement('div');
          const result = host.commit(target, '<h1>Kept</h1><script>bad()</script><img src=x onerror=bad()><a href="javascript:bad()">Link</a>');
          assert.equal(result.verdict.commitAllowed, true);
          assert.match(target.textContent, /Kept/);
          assert.equal(target.querySelector('script,[onerror],[href^="javascript:"]'), null);
          assert.equal(host.sanitize('<p>Still here</p>').html, '<p>Still here</p>');
        });
        await check(`${mode}: cancelled verification cannot commit or populate the route cache`, async () => {
          const gate = deferred();
          let started = false;
          app.control.digest = async (...args) => { started = true; await gate.promise; return webcrypto.subtle.digest(...args); };
          app.router.navigate('/docs/de/xtend-maraca');
          await until(() => started, 'fragment verification did not start');
          app.control.digest = null;
          await app.navigate('manifest');
          gate.resolve();
          await until(() => app.requests.find(request => request.path.endsWith('/xtend-maraca'))?.signal.aborted, 'old route not aborted');
          await pause(); await pause();
          assert.equal(app.window.xtendDocsLocalizedPages.de['xtend-maraca'], undefined);
          assert.equal(app.page().getAttribute('data-docs-route-slug'), 'manifest');
          assert.equal(app.fallbacks.length, 0);
        });
        await check(`${mode}: a late failed request cannot hard-navigate over the newer route`, async () => {
          const gate = deferred();
          app.control.transport = request => request.path.endsWith('/hydration-policies') ? gate.promise : null;
          app.router.navigate('/docs/de/hydration-policies');
          await until(() => app.requests.some(request => request.path.endsWith('/hydration-policies')), 'delayed request not started');
          await app.navigate('readme');
          gate.reject(new Error('late network failure'));
          await pause(); await pause();
          app.control.transport = null;
          assert.equal(app.fallbacks.length, 0);
          assert.equal(app.window.location.pathname, '/docs/de/readme');
          assert.equal(app.content().querySelector('h1').textContent, 'XTend Developer Center');
        });
        for (const suppliedHandles of [false, true]) await check(`${mode}: routeHtml tampering${suppliedHandles ? ' with private response keys' : ''} never enters live DOM`, async () => {
          app.control.transport = request => {
            const payload = JSON.parse(php(request.path, true, signed));
            // Keep payload.html, hashes and the signed envelope unchanged.
            payload.routeHtml = payload.routeHtml
              .replace('</h1>', '</h1><img data-injected-content src=x onerror="bad()">')
              .replace('class="docs-shell-toolbar"', 'class="docs-shell-toolbar" data-injected-shell onmouseover="bad()"');
            if (suppliedHandles) {
              payload.__xtendRouteRoot = null;
              payload.__xtendRouteResume = null;
            }
            return { ok: true, json: async () => payload };
          };
          try { await app.navigate(suppliedHandles ? 'rmt-reference-actions-events' : 'api'); }
          finally { app.control.transport = null; }
          assert.equal(app.page().querySelector('[data-injected-content],[data-injected-shell],[onerror],[onmouseover]'), null);
          assert.equal(app.content(), app.originalContent);
          assert.equal(app.fallbacks.length, 0);
        });
        await check(`${mode}: corrupt current fragment still falls back to document navigation`, async () => {
          app.control.transport = request => {
            const payload = JSON.parse(php(request.path, true, signed));
            payload.html += '<p>tampered</p>';
            return { ok: true, json: async () => payload };
          };
          app.router.navigate('/docs/de/xtend-fabric-runtime');
          await until(() => app.fallbacks.length === 1, 'invalid proof did not fall back');
          assert.equal(app.fallbacks[0].reason, 'route-fragment-proof-mismatch');
          assert.equal(app.window.xtendDocsLocalizedPages.de['xtend-fabric-runtime'], undefined);
          assert(!app.content().textContent.includes('tampered'));
          assert.deepEqual(app.errors, []);
        });
        if (signed) await check('signed resume: an altered envelope cannot enter the live route', async () => {
          app.control.transport = request => {
            const payload = JSON.parse(php(request.path, true, true));
            payload.resumeEnvelope.integrity.signature = 'invalid';
            return { ok: true, json: async () => payload };
          };
          app.router.navigate('/docs/de/xtend-maraca');
          await until(() => app.fallbacks.length === 2, 'invalid signature did not fall back');
          assert.equal(app.fallbacks[1].reason, 'route-fragment-resume-proof-rejected');
          assert.equal(app.window.xtendDocsLocalizedPages.de['xtend-maraca'], undefined);
        });
      } catch (error) { failures.push(`${mode}: ${error.stack || error.message}`); }
      finally { if (app) app.close(); }
    }
    for (const locale of ['de', 'en']) {
      await check(`${locale}: hard reload retains PHP SSR and adopts that exact document`, async () => {
        const app = await boot(`/docs/${locale}/manifest`);
        try {
          assert.match(app.originalContent.querySelector('h1').textContent, /Manifest/);
          assert.equal(app.content(), app.originalContent);
          assert.equal(app.window.document.documentElement.lang, locale);
          assert.equal(app.requests.length, 0);
          assert.deepEqual(app.errors, []);
        } finally { app.close(); }
      });
    }
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
  return { ok: failures.length === 0, passes, failures };
}

function runDocsRouterNavigationChecks(rootDir) {
  const result = spawnSync(process.execPath, ['--experimental-vm-modules', __filename, rootDir], {
    cwd: rootDir, encoding: 'utf8', timeout: 120000, maxBuffer: 2 * 1024 * 1024
  });
  try {
    const report = JSON.parse(result.stdout);
    assert.equal(result.status, report.ok ? 0 : 1, 'unexpected navigation-check process exit');
    return report;
  }
  catch (_) { return { ok: false, passes: [], failures: [`Docs router checks failed: ${result.error?.message || result.stderr || result.stdout}`] }; }
}
module.exports = { runDocsRouterNavigationChecks };
if (require.main === module) {
  runChecks(process.argv[2] || path.resolve(__dirname, '../..')).then(result => {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exitCode = result.ok ? 0 : 1;
  }, error => { console.error(error); process.exitCode = 1; });
}

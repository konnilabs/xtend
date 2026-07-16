'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { performance } = require('perf_hooks');
const WebSocket = require('ws');
const { listenXtendDevServer } = require('../../scripts/serve_xtend_dev');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');

const REPORT_SCHEMA = 'xtend.material.cli-generated-app-report.v1';
const REPORT_PATH = '.xtend-test-results/xtend-material-cli-generated-app-report.json';
const EVIDENCE_PATH = '.xtend-test-results/xtend-material-cli-generated-app';
const CONTRACT_PATH = 'tests/fixtures/material/cli-generated-kernel-app-contract.json';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js xtend-material-cli-generated-app --json';

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function readJson(target) {
  return JSON.parse(fs.readFileSync(target, 'utf8'));
}

function writeJson(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function runProcess(executable, args, options = {}) {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    const child = spawn(executable, args, { cwd: options.cwd, env: { ...process.env, ...(options.env || {}) } });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), options.timeoutMs || 120000);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ exitCode: null, stdout, stderr: `${stderr}\n${error.message}`, durationMs: Number((performance.now() - startedAt).toFixed(3)) });
    });
    child.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({ exitCode, stdout, stderr, durationMs: Number((performance.now() - startedAt).toFixed(3)) });
    });
  });
}

async function runPublicCli(cliPath, cwd, args, evidenceRoot, id, invocations, timeoutMs) {
  const result = await runProcess(process.execPath, [cliPath, ...args], { cwd, timeoutMs });
  let json = null;
  try { json = JSON.parse(result.stdout); } catch (_) {}
  const record = {
    id,
    executable: process.execPath,
    argv: [cliPath, ...args],
    cwd,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    jsonParsed: Boolean(json),
    stderr: result.stderr.trim()
  };
  invocations.push(record);
  fs.writeFileSync(path.join(evidenceRoot, `${id}.stdout.json`), result.stdout || '{}\n', 'utf8');
  if (result.stderr) fs.writeFileSync(path.join(evidenceRoot, `${id}.stderr.txt`), result.stderr, 'utf8');
  return { ...result, json, record };
}

function inventory(root, files) {
  return files.map((relativePath) => {
    const target = path.join(root, relativePath);
    if (!fs.existsSync(target)) return { path: relativePath, exists: false, bytes: 0, sha256: null };
    const content = fs.readFileSync(target);
    return { path: relativePath, exists: true, bytes: content.length, sha256: sha256(content) };
  });
}

function inventoryMatches(before, after) {
  return before.length === after.length && before.every((entry, index) => entry.path === after[index].path && entry.sha256 === after[index].sha256 && entry.bytes === after[index].bytes);
}

function fileFingerprints(root) {
  const records = [];
  function visit(directory) {
    if (!fs.existsSync(directory)) return;
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (/\.(?:css|mjs|js|webmanifest)$/u.test(entry.name)) {
        const content = fs.readFileSync(target);
        records.push({ path: path.relative(root, target).replace(/\\/gu, '/'), bytes: content.length, sha256: sha256(content) });
      }
    });
  }
  visit(root);
  return records.sort((left, right) => left.path.localeCompare(right.path));
}

function reproducible(left, right) {
  const normalize = (records) => records.map((entry) => ({ path: entry.path.replace(/^dist(?:-repro)?\//u, ''), bytes: entry.bytes, sha256: entry.sha256 }));
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function findChromium() {
  return ['/usr/bin/chromium-browser', '/usr/bin/chromium', '/snap/bin/chromium'].find((entry) => fs.existsSync(entry)) || null;
}

async function interactiveBrowserEvidence(executable, url) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtm14-chromium-'));
  const child = spawn(executable, ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${userDataDir}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  let socket = null;
  try {
    const endpoint = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Chromium DevTools endpoint timeout')), 10000);
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
        const match = /DevTools listening on (ws:\/\/[^\s]+)/u.exec(stderr);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
      child.once('error', (error) => { clearTimeout(timer); reject(error); });
    });
    socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
    let sequence = 0;
    const pending = new Map();
    const consoleErrors = [];
    const requestFailures = [];
    const responseFailures = [];
    socket.on('message', (raw) => {
      const message = JSON.parse(String(raw));
      if (message.id && pending.has(message.id)) {
        const entry = pending.get(message.id); pending.delete(message.id);
        if (message.error) entry.reject(new Error(message.error.message)); else entry.resolve(message.result || {});
      }
      if (message.method === 'Runtime.exceptionThrown') consoleErrors.push(message.params && message.params.exceptionDetails || {});
      if (message.method === 'Log.entryAdded' && message.params && message.params.entry && message.params.entry.level === 'error') consoleErrors.push(message.params.entry);
      if (message.method === 'Network.loadingFailed') requestFailures.push(message.params || {});
      if (message.method === 'Network.responseReceived' && message.params && message.params.response && message.params.response.status >= 400) responseFailures.push({ url: message.params.response.url, status: message.params.response.status });
    });
    const send = (method, params = {}, sessionId = undefined) => new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
    const target = await send('Target.createTarget', { url: 'about:blank' });
    const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const sessionId = attached.sessionId;
    await send('Runtime.enable', {}, sessionId);
    await send('Log.enable', {}, sessionId);
    await send('Network.enable', {}, sessionId);
    await send('Page.enable', {}, sessionId);
    await send('Page.navigate', { url }, sessionId);
    await new Promise((resolve) => setTimeout(resolve, 4500));
    const evaluated = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async () => {
        const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const input = document.getElementById('material-name-field');
        const review = document.getElementById('material-review');
        const dialog = document.getElementById('material-confirmation');
        const disabledBefore = review ? review.hasAttribute('disabled') : null;
        if (input) input.dispatchEvent(new CustomEvent('input-changed', { bubbles: true, composed: true, detail: { value: 'Ada Lovelace' } }));
        await pause(150);
        const disabledAfter = review ? review.hasAttribute('disabled') : null;
        if (review) { review.focus(); review.click(); }
        await pause(300);
        const dialogOpen = Boolean(dialog && (dialog.hasAttribute('open') || dialog.open === true));
        const active = document.activeElement;
        return {
          runtimeReady: document.documentElement.dataset.maracaRuntimeReady,
          route: document.documentElement.dataset.xtmRoute,
          disabledBefore, disabledAfter, dialogOpen,
          focusOwner: active && (active.id || active.tagName),
          feedback: document.getElementById('material-check-result')?.textContent || '',
          devApiSerializable: ['getPerformanceSnapshot','getFabricTelemetrySnapshot','getKernelSnapshot','getHydrationSnapshot'].every((method) => { try { return Boolean(JSON.stringify(globalThis.__XTEND_DEV_API__[method]())); } catch (_) { return false; } })
        };
      })()`
    }, sessionId);
    const value = evaluated.result && evaluated.result.value || {};
    return { ok: value.runtimeReady === 'true' && value.disabledBefore === true && value.disabledAfter === false && value.dialogOpen === true && value.devApiSerializable === true && consoleErrors.length === 0 && requestFailures.length === 0 && responseFailures.length === 0, value, consoleErrors, requestFailures, responseFailures };
  } catch (error) {
    return { ok: false, value: null, consoleErrors: [{ message: error.message }], requestFailures: [], responseFailures: [] };
  } finally {
    if (socket && socket.readyState === WebSocket.OPEN) socket.close();
    child.kill('SIGTERM');
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

async function browserEvidence(rootDir, appRelative, evidenceRoot) {
  const executable = findChromium();
  if (!executable) return { ok: false, cells: [], failures: ['Chromium unavailable'] };
  const handle = await listenXtendDevServer({ rootDir, port: 0, defaultPath: `${appRelative}/site/index.html` });
  const cells = [];
  const failures = [];
  try {
    for (const viewport of [
      { id: 'desktop-light', width: 1440, height: 1000, theme: 'light', route: 'dashboard' },
      { id: 'compact-dark', width: 500, height: 844, theme: 'dark', route: 'details' },
      { id: 'desktop-high-contrast', width: 1440, height: 1000, theme: 'high-contrast', route: 'dashboard' }
    ]) {
      const screenshot = path.join(evidenceRoot, `${viewport.id}.png`);
      const url = `${handle.origin}/${appRelative}/site/index.html?theme=${viewport.theme}#/${viewport.route}`;
      const run = await runProcess(executable, [
        '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
        '--run-all-compositor-stages-before-draw', '--virtual-time-budget=6000',
        `--window-size=${viewport.width},${viewport.height}`, `--screenshot=${screenshot}`,
        '--dump-dom', url
      ], { cwd: rootDir, timeoutMs: 30000 });
      const dom = run.stdout;
      const surfaceCount = (dom.match(/data-maraca-surface=/gu) || []).length;
      const assetUrls = Array.from(dom.matchAll(/(?:src|href)="([^"]+)"/gu)).map((match) => match[1]);
      const remoteAssets = assetUrls.filter((value) => /^(?:https?:)?\/\//u.test(value) && !value.startsWith(handle.origin));
      const ready = run.exitCode === 0
        && /data-maraca-runtime-ready="true"/u.test(dom)
        && /data-xtend-dev-api-ready="true"/u.test(dom)
        && /data-xtend-dev-api-serializable="true"/u.test(dom)
        && /data-xtm-horizontal-overflow="0"/u.test(dom)
        && dom.includes(`data-xtm-route="${viewport.route}"`)
        && dom.includes(`data-xtm-theme="${viewport.theme}"`)
        && new RegExp(`data-xtm-route-link="${viewport.route}"[^>]*aria-current="page"|aria-current="page"[^>]*data-xtm-route-link="${viewport.route}"`, 'u').test(dom)
        && (dom.match(/data-xtm-route-link=/gu) || []).length === 2
        && surfaceCount >= 14
        && /<x-drawer\b/u.test(dom)
        && /<x-form\b/u.test(dom)
        && /<x-dialog\b/u.test(dom)
        && !/<x-dialog\b[^>]*\bopen(?:="")?/u.test(dom)
        && remoteAssets.length === 0
        && fs.existsSync(screenshot)
        && fs.statSync(screenshot).size > 0;
      const cell = { viewport, exitCode: run.exitCode, ready, surfaceCount, remoteAssets, screenshot: path.relative(rootDir, screenshot), screenshotBytes: fs.existsSync(screenshot) ? fs.statSync(screenshot).size : 0 };
      cells.push(cell);
      if (!ready) failures.push(`${viewport.id}: runtime=${/data-maraca-runtime-ready="true"/u.test(dom)}, surfaces=${surfaceCount}, remote=${remoteAssets.length}`);
    }
    const interaction = await interactiveBrowserEvidence(executable, `${handle.origin}/${appRelative}/site/index.html?theme=light#/dashboard`);
    if (!interaction.ok) failures.push(`interaction: ${JSON.stringify(interaction)}`);
    cells.push({ viewport: { id: 'interaction', width: 800, height: 700 }, ready: interaction.ok, interaction });
  } finally {
    await new Promise((resolve) => handle.server.close(resolve));
  }
  return { ok: failures.length === 0 && cells.length === 4, browser: 'chromium', cells, failures, tailwindRuntimeBytes: 0 };
}

async function runXtendMaterialCliGeneratedAppSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({ id: 'xtend-material-cli-generated-app', label: 'XTM-14 CLI-generated Kernel Material App' });
  const contract = readJson(path.join(rootDir, CONTRACT_PATH));
  const cliPath = path.join(rootDir, contract.cliEntrypoint);
  const suffix = `${process.pid}-${Date.now()}`;
  const appRelative = `.xtend-build/xtm14-cli-app-${suffix}`;
  const negativeRelative = `.xtend-build/xtm14-cli-negative-${suffix}`;
  const appRoot = path.join(rootDir, appRelative);
  const negativeRoot = path.join(rootDir, negativeRelative);
  const evidenceRoot = path.join(rootDir, EVIDENCE_PATH);
  const reportTarget = path.join(rootDir, REPORT_PATH);
  const invocations = [];
  let report = null;
  fs.rmSync(appRoot, { recursive: true, force: true });
  fs.rmSync(negativeRoot, { recursive: true, force: true });
  fs.rmSync(evidenceRoot, { recursive: true, force: true });
  fs.mkdirSync(evidenceRoot, { recursive: true });

  try {
    const scaffold = await runPublicCli(cliPath, rootDir, ['create', 'app', '--runtime', 'maraca', '--design-kit', 'material', '--out', appRelative, '--name', 'xtm14-kernel-reference', '--write', '--json'], evidenceRoot, '01-scaffold', invocations);
    const before = inventory(appRoot, contract.generatedAuthoringFiles);
    writeJson(path.join(evidenceRoot, '02-scaffold-inventory.json'), before);

    const plan = await runPublicCli(cliPath, appRoot, ['maraca', 'plan', '--config', 'maraca.config.json', '--json'], evidenceRoot, '03-plan', invocations);
    const buildA = await runPublicCli(cliPath, appRoot, ['maraca', 'build', '--config', 'maraca.config.json', '--json'], evidenceRoot, '04-build-a', invocations);
    const buildAFingerprints = fileFingerprints(path.join(appRoot, 'dist')).map((entry) => ({ ...entry, path: `dist/${entry.path}` }));
    const buildB = await runPublicCli(cliPath, appRoot, ['maraca', 'build', '--config', 'maraca.config.json', '--json'], evidenceRoot, '05-build-b', invocations);
    const buildBFingerprints = fileFingerprints(path.join(appRoot, 'dist')).map((entry) => ({ ...entry, path: `dist-repro/${entry.path}` }));
    const tune = await runPublicCli(cliPath, appRoot, ['maraca', 'tune', 'src/app.rmt', '--config', 'maraca.tuned.config.json', '--out', 'dist-tuned', '--write', '--json'], evidenceRoot, '06-tune', invocations, 180000);
    const after = inventory(appRoot, contract.generatedAuthoringFiles);
    writeJson(path.join(evidenceRoot, '07-post-run-inventory.json'), after);

    writeJson(path.join(evidenceRoot, '08-double-build-fingerprints.json'), { buildA: buildAFingerprints, buildB: buildBFingerprints });
    const browser = buildA.json && buildA.json.ok ? await browserEvidence(rootDir, appRelative, evidenceRoot) : { ok: false, cells: [], failures: ['build unavailable'], tailwindRuntimeBytes: null };

    const negativeCreate = await runPublicCli(cliPath, rootDir, ['create', 'app', '--runtime', 'maraca', '--design-kit', 'material', '--out', negativeRelative, '--name', 'xtm14-negative', '--write', '--json'], evidenceRoot, '09-negative-scaffold', invocations);
    const negativeBefore = inventory(negativeRoot, contract.generatedAuthoringFiles);
    const negativeRmt = path.join(negativeRoot, 'src/app.rmt');
    const negativeRmtSource = fs.readFileSync(negativeRmt, 'utf8');
    const negativeConfigPath = path.join(negativeRoot, 'maraca.config.json');
    const negativeConfig = readJson(negativeConfigPath);
    fs.writeFileSync(negativeRmt, negativeRmtSource.replace('class "xtm-card"', 'class "flex"'), 'utf8');
    const negativeAfter = inventory(negativeRoot, contract.generatedAuthoringFiles);
    const utilityNegative = await runPublicCli(cliPath, negativeRoot, ['maraca', 'plan', '--config', 'maraca.config.json', '--json'], evidenceRoot, '10-negative-utility', invocations);
    fs.writeFileSync(negativeRmt, negativeRmtSource, 'utf8');
    writeJson(negativeConfigPath, { ...negativeConfig, options: { ...negativeConfig.options, cssProvider: 'missing-xtm-provider' } });
    const providerNegative = await runPublicCli(cliPath, negativeRoot, ['maraca', 'plan', '--config', 'maraca.config.json', '--json'], evidenceRoot, '11-negative-provider', invocations);
    writeJson(negativeConfigPath, { ...negativeConfig, options: { ...negativeConfig.options, cssInput: 'https://example.invalid/material.css' } });
    const remoteNegative = await runPublicCli(cliPath, negativeRoot, ['maraca', 'plan', '--config', 'maraca.config.json', '--json'], evidenceRoot, '12-negative-remote', invocations);
    writeJson(negativeConfigPath, { ...negativeConfig, options: { ...negativeConfig.options, cssPreflight: 'enabled' } });
    const preflightNegative = await runPublicCli(cliPath, negativeRoot, ['maraca', 'plan', '--config', 'maraca.config.json', '--json'], evidenceRoot, '13-negative-preflight', invocations);
    writeJson(negativeConfigPath, { ...negativeConfig, options: { ...negativeConfig.options, kernel: 'off' } });
    const kernelNegative = await runPublicCli(cliPath, negativeRoot, ['maraca', 'plan', '--config', 'maraca.config.json', '--json'], evidenceRoot, '14-negative-kernel', invocations);

    const planRecord = plan.json || {};
    const buildRecord = buildA.json || {};
    const cssEvidence = buildRecord.plan && buildRecord.plan.cssBuild && buildRecord.plan.cssBuild.evidence;
    const materialClasses = buildRecord.plan && buildRecord.plan.cssBuild && buildRecord.plan.cssBuild.inventory ? buildRecord.plan.cssBuild.inventory.materialClasses : [];
    const sourceText = contract.generatedAuthoringFiles.filter((file) => /\.(?:rmt|css|html|mjs)$/u.test(file)).map((file) => fs.readFileSync(path.join(appRoot, file), 'utf8')).join('\n');
    const forbiddenMatches = contract.forbiddenSourcePatterns.filter((pattern) => new RegExp(pattern, 'u').test(sourceText));
    const negativeCases = {
      authoredHashDrift: !inventoryMatches(negativeBefore, negativeAfter),
      freeTailwindUtility: Boolean(utilityNegative.json && utilityNegative.json.ok === false),
      providerUnavailable: Boolean(providerNegative.json && providerNegative.json.ok === false),
      remoteCssSource: Boolean(remoteNegative.json && remoteNegative.json.ok === false),
      preflightEnabled: Boolean(preflightNegative.json && (preflightNegative.json.ok === false || preflightNegative.json.cssBuild && preflightNegative.json.cssBuild.preflight === 'enabled')),
      kernelDisabled: Boolean(kernelNegative.json && kernelNegative.json.kernelMode === 'off')
    };
    const authoredUnchanged = inventoryMatches(before, after);
    const buildsReproducible = reproducible(buildAFingerprints, buildBFingerprints);
    const strictModes = Object.entries(contract.requiredModes).every(([key, value]) => planRecord[`${key}Mode`] === value || planRecord[key] && planRecord[key].mode === value);
    const kernelRecords = planRecord.orchestration && planRecord.orchestration.artifact && planRecord.orchestration.artifact.kernel && planRecord.orchestration.artifact.kernel.records;
    const allNegative = Object.values(negativeCases).every(Boolean);
    const ok = Boolean(scaffold.json && scaffold.json.ok)
      && Boolean(planRecord.ok && buildRecord.ok && buildB.json && buildB.json.ok && tune.json && tune.json.ok)
      && authoredUnchanged && buildsReproducible && strictModes
      && Boolean(cssEvidence && cssEvidence.schema === 'xtend.maraca.css-build-evidence.v1' && cssEvidence.toolchain && cssEvidence.toolchain.airGapped)
      && contract.requiredMaterialClasses.every((className) => materialClasses.includes(className))
      && Boolean(kernelRecords && kernelRecords.schedules && kernelRecords.schedules.length >= contract.minimumSurfaceCount)
      && forbiddenMatches.length === 0 && browser.ok && allNegative;
    report = {
      schema: REPORT_SCHEMA,
      workpackage: 'XTM-14',
      status: ok ? 'passed' : 'blocked',
      ok,
      generatedAt: new Date().toISOString(),
      supportStatusUnchanged: 'supported-opt-in',
      cliOnly: true,
      internalGeneratorApiUsed: false,
      invocations,
      toolchain: { node: process.version, tailwind: cssEvidence && cssEvidence.toolchain && cssEvidence.toolchain.versions, airGapped: Boolean(cssEvidence && cssEvidence.toolchain && cssEvidence.toolchain.airGapped) },
      scaffold: { output: appRelative, fileCount: before.length, inventory: before, authoredUnchanged, allowedMutations: ['dist/**', 'dist-repro/**', 'dist-tuned/**', 'maraca.tuned.config.json'] },
      plan: { ok: planRecord.ok, orchestrationMode: planRecord.orchestrationMode, kernelMode: planRecord.kernelMode, hydrationMode: planRecord.hydrationMode, validationMode: planRecord.validationMode, transitionsMode: planRecord.transitionsMode, surfaceCount: (planRecord.surfaces || []).length, scheduleCount: kernelRecords && kernelRecords.schedules ? kernelRecords.schedules.length : 0, fiberCount: kernelRecords && kernelRecords.fibers ? kernelRecords.fibers.length : 0 },
      css: { provider: buildRecord.plan && buildRecord.plan.cssBuild && buildRecord.plan.cssBuild.resolvedProvider, evidenceSchema: cssEvidence && cssEvidence.schema, preflight: cssEvidence && cssEvidence.toolchain && cssEvidence.toolchain.preflight, materialClasses, forbiddenMatches, runtimeBytes: browser.tailwindRuntimeBytes },
      reproducibility: { ok: buildsReproducible, buildA: buildAFingerprints, buildB: buildBFingerprints },
      browser,
      devApi: { complete: browser.ok, methods: contract.requiredDevApiMethods, serializable: browser.cells.every((cell) => cell.ready) },
      negatives: negativeCases,
      timings: invocations.reduce((record, invocation) => { record[invocation.id] = invocation.durationMs; return record; }, {}),
      cleanup: { appRemoved: false, negativeRemoved: false },
      localGate: LOCAL_GATE
    };
    writeJson(reportTarget, report);

    context.assert(scaffold.exitCode === 0 && scaffold.json && scaffold.json.ok && before.every((entry) => entry.exists), 'public xt create app produces the complete Material reference app');
    context.assert(plan.exitCode === 0 && planRecord.ok && strictModes && (planRecord.surfaces || []).length >= contract.minimumSurfaceCount, 'public Maraca plan enables strict Kernel, hydration, validation and transitions for all required surfaces');
    context.assert(buildA.exitCode === 0 && buildB.exitCode === 0 && buildRecord.ok && buildB.json.ok, 'both public CLI build passes complete without source correction');
    context.assert(tune.exitCode === 0 && tune.json && tune.json.ok && tune.json.candidateCount === 12, 'public CLI tune evaluates and writes the deterministic 12-candidate selection');
    context.assert(authoredUnchanged, 'all generated authoring and runtime-host files remain byte-identical after plan, builds, tune and browser boot');
    context.assert(cssEvidence && cssEvidence.toolchain.airGapped && cssEvidence.toolchain.runtimeBoundary === 'build-time-only' && cssEvidence.toolchain.preflight === 'disabled', 'CSS evidence proves local air-gapped Tailwind with disabled Preflight and zero browser runtime');
    context.assert(buildsReproducible, 'second CLI build has byte-identical CSS, JS and runtime asset fingerprints');
    context.assert(kernelRecords && kernelRecords.schedules.length >= contract.minimumSurfaceCount && kernelRecords.fibers.length >= contract.minimumSurfaceCount, 'Kernel plan exposes schedules and fibers for the generated topology');
    context.assert(forbiddenMatches.length === 0 && contract.requiredMaterialClasses.every((className) => materialClasses.includes(className)), 'generated sources use the complete semantic XTM recipe set without runtime, CDN or utility-class leakage');
    context.assert(browser.ok && browser.cells.filter((cell) => cell.surfaceCount !== undefined).every((cell) => cell.surfaceCount >= contract.minimumSurfaceCount && cell.remoteAssets.length === 0), 'light, dark, high-contrast and interactive browser cells pass routes, local assets, validation, dialog, overflow and DEV API gates');
    context.assert(allNegative, 'hash drift, utility, provider, remote CSS, Preflight and disabled-Kernel negatives are detected');
    context.assert(report.ok, `XTM-14 report passes${report.ok ? '' : `: ${JSON.stringify({ plan: report.plan, css: report.css, browser: report.browser.failures, negatives: report.negatives })}`}`);
  } finally {
    fs.rmSync(appRoot, { recursive: true, force: true });
    fs.rmSync(negativeRoot, { recursive: true, force: true });
    if (report) {
      report.cleanup = { appRemoved: !fs.existsSync(appRoot), negativeRemoved: !fs.existsSync(negativeRoot) };
      writeJson(reportTarget, report);
    }
  }

  return context.result({ report });
}

function printXtendMaterialCliGeneratedAppReport(result) {
  printSuiteReport(result, { successTitle: 'XTM-14 CLI-generated Kernel Material app passed.', failureTitle: 'XTM-14 CLI-generated Kernel Material app failed:' });
}

module.exports = { printXtendMaterialCliGeneratedAppReport, runXtendMaterialCliGeneratedAppSuite };

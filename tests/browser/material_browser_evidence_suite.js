'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { listenXtendDevServer } = require('../../scripts/serve_xtend_dev');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { readJson, readText, resolveRepoPath, resolveRootDir } = require('../utils/files');
const {
  MATERIAL_BROWSER_ARTIFACT_ROOT,
  MATERIAL_BROWSER_BASELINE_PATH,
  MATERIAL_BROWSER_BASELINE_SCHEMA,
  MATERIAL_BROWSER_DIMENSIONS,
  MATERIAL_BROWSER_EVIDENCE_SCHEMA,
  MATERIAL_BROWSER_FIXTURE_PATH,
  MATERIAL_BROWSER_FIXTURE_SCHEMA,
  MATERIAL_BROWSER_LOCAL_GATE,
  MATERIAL_BROWSER_POLICY_PATH,
  MATERIAL_BROWSER_REPORT_PATH,
  MATERIAL_BROWSER_RESULT_ID,
  createMaterialBrowserEvidenceReport,
  validateMaterialBrowserBaseline
} = require('./material-browser-evidence');

function findExecutable(candidates) {
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function runProcess(executable, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(executable, args, { cwd: options.cwd, env: process.env });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), options.timeoutMs || 20000);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ status: null, stdout, stderr: `${stderr}\n${error.message}` });
    });
    child.on('close', (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr });
    });
  });
}

function closeServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

function parseViewportEvidence(dom) {
  const expression = new RegExp(`<pre id="${MATERIAL_BROWSER_RESULT_ID}"[^>]*>([\\s\\S]*?)<\\/pre>`);
  const match = dom.match(expression);
  if (!match) throw new Error(`browser DOM does not expose #${MATERIAL_BROWSER_RESULT_ID}`);
  return JSON.parse(match[1]);
}

async function captureChromiumEvidence(rootDir, origin, executable) {
  const cells = [];
  const screenshots = [];
  const failures = [];
  const artifactRoot = resolveRepoPath(MATERIAL_BROWSER_ARTIFACT_ROOT, rootDir);
  fs.mkdirSync(artifactRoot, { recursive: true });

  for (const viewport of MATERIAL_BROWSER_DIMENSIONS.viewports) {
    const screenshot = path.join(artifactRoot, `${viewport.id}.png`);
    const url = `${origin}/${MATERIAL_BROWSER_FIXTURE_PATH}?viewport=${encodeURIComponent(viewport.id)}`;
    const result = await runProcess(executable, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--run-all-compositor-stages-before-draw',
      '--virtual-time-budget=3000',
      `--window-size=${viewport.width},${viewport.height}`,
      `--screenshot=${screenshot}`,
      '--dump-dom',
      url
    ], { cwd: rootDir, timeoutMs: 30000 });

    if (result.status !== 0) {
      failures.push(`${viewport.id}: Chromium exited with ${result.status}: ${result.stderr.trim().slice(-600)}`);
      continue;
    }
    try {
      const viewportEvidence = parseViewportEvidence(result.stdout);
      cells.push(...viewportEvidence.cells);
      if (fs.existsSync(screenshot) && fs.statSync(screenshot).size > 0) {
        screenshots.push({ viewport: viewport.id, path: path.relative(rootDir, screenshot), bytes: fs.statSync(screenshot).size });
      } else {
        failures.push(`${viewport.id}: screenshot artifact is missing or empty`);
      }
    } catch (error) {
      failures.push(`${viewport.id}: ${error.message}`);
    }
  }

  return {
    browser: 'chromium',
    executable,
    status: failures.length === 0 && cells.length === 384 ? 'passed' : 'failed',
    matrixCellCount: cells.length,
    cells,
    screenshots,
    failures
  };
}

async function runMaterialBrowserEvidenceSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'xtend-material-browser-evidence', label: 'XTM-10 XTend Material Browser Evidence' });
  const baseline = readJson(MATERIAL_BROWSER_BASELINE_PATH, rootDir);
  const fixture = readText(MATERIAL_BROWSER_FIXTURE_PATH, rootDir);
  const policy = readText(MATERIAL_BROWSER_POLICY_PATH, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const chromium = findExecutable(['/usr/bin/chromium-browser', '/usr/bin/chromium', '/snap/bin/chromium']);
  const firefox = findExecutable(['/usr/bin/firefox', '/snap/bin/firefox']);
  const browserRuns = [];

  if (!chromium) {
    browserRuns.push({ browser: 'chromium', status: 'failed', cells: [], screenshots: [], failures: ['required Chromium hypervisor is unavailable'] });
  } else {
    const handle = await listenXtendDevServer({ rootDir, port: 0, defaultPath: MATERIAL_BROWSER_FIXTURE_PATH });
    try {
      browserRuns.push(await captureChromiumEvidence(rootDir, handle.origin, chromium));
    } finally {
      await closeServer(handle.server);
    }
  }
  if (firefox) {
    browserRuns.push({ browser: 'firefox', status: 'residual', owner: 'XTend Browser Hypervisor / XTM-10', reason: 'Firefox is locally available, but no deterministic screenshot/dump adapter is registered in the current hypervisor.' });
  }

  const report = createMaterialBrowserEvidenceReport({ baseline, browserRuns });
  fs.writeFileSync(resolveRepoPath(MATERIAL_BROWSER_REPORT_PATH, rootDir), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  const baselineValidation = validateMaterialBrowserBaseline(baseline);
  const metadata = packageManifest.xtend && packageManifest.xtend.materialBrowserEvidence;

  context.assert(baseline.schema === MATERIAL_BROWSER_BASELINE_SCHEMA, 'baseline declares the stable browser schema');
  context.assert(baselineValidation.ok, `baseline matches the 384-cell contract${baselineValidation.ok ? '' : `: ${baselineValidation.errors.join(', ')}`}`);
  context.assert(fixture.includes(MATERIAL_BROWSER_FIXTURE_SCHEMA), 'fixture declares its schema');
  context.assert(fixture.includes('/design-tokens/tailwind/xtend-material-theme.css') && fixture.includes('/xtend-material/styles.css'), 'direct-browser fixture consumes the concrete local token bridge and Material package styles without unresolved npm CSS imports');
  context.assert(!fixture.includes('.shadowRoot') && !fixture.includes('attachShadow'), 'fixture does not access private shadow roots');
  context.assert(fixture.includes('role="status"') && fixture.includes('aria-live="polite"'), 'fixture includes screen-reader announcement semantics');
  context.assert(fixture.includes('dialog.showModal') && fixture.includes('trigger.focus()'), 'fixture exercises dialog focus and restore');
  context.assert(report.schema === MATERIAL_BROWSER_EVIDENCE_SCHEMA, 'report declares xtend.material.browser-evidence.v1');
  context.assert(report.matrixCellCount === 384 && report.evidencedCellCount === 384, 'all 384 matrix cells have Chromium evidence');
  context.assert(report.failedCellCount === 0 && report.residualCellCount === 0, 'all required matrix cells pass without unowned residuals');
  context.assert(report.horizontalOverflowCount === 0, 'no matrix cell has horizontal overflow');
  context.assert(report.severeA11yFindingCount === 0, 'no critical or severe accessibility finding exists');
  context.assert(report.screenshotCount === 4, 'all four viewport screenshots were captured');
  context.assert(report.privateShadowRootAccess === false, 'report keeps the public-DOM-only boundary');
  context.assert(report.ok === true, `browser evidence report passes${report.ok ? '' : `: ${JSON.stringify(report.browserRuns.map((run) => run.failures || []))}`}`);
  context.assert(policy.includes('## Baseline Update Policy'), 'baseline update policy is documented');
  context.assert(policy.includes(MATERIAL_BROWSER_LOCAL_GATE), 'policy documents the complete local gate');
  context.assert(metadata && metadata.schema === MATERIAL_BROWSER_EVIDENCE_SCHEMA, 'package metadata exposes the evidence schema');
  context.assert(metadata && metadata.localGate === MATERIAL_BROWSER_LOCAL_GATE, 'package metadata exposes the complete gate');

  return context.result({ report: {
    schema: report.schema,
    matrixCellCount: report.matrixCellCount,
    evidencedCellCount: report.evidencedCellCount,
    screenshotCount: report.screenshotCount,
    severeA11yFindingCount: report.severeA11yFindingCount,
    horizontalOverflowCount: report.horizontalOverflowCount,
    residuals: report.residuals
  } });
}

function printMaterialBrowserEvidenceReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTM-10 XTend Material Browser Evidence erfolgreich.',
    failureTitle: 'XTM-10 XTend Material Browser Evidence fehlgeschlagen:'
  });
}

module.exports = { printMaterialBrowserEvidenceReport, runMaterialBrowserEvidenceSuite };

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(productRoot, '..', '..');
const require = createRequire(import.meta.url);
const { createMaracaBuildPlan } = require(path.join(repoRoot, 'xtend-maraca'));
const resultDir = path.join(productRoot, '.xtend-llm-results');
const reportPath = path.join(resultDir, 'app-services-catfood.json');
const checks = [];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function record(id, ok, evidence = {}) {
  checks.push({ id, ok: Boolean(ok), evidence });
}

function sorted(values) {
  return Array.from(values).sort((left, right) => left.localeCompare(right));
}

function writeReport(extra = {}) {
  const ok = checks.every((entry) => entry.ok) && extra.fatal == null;
  const report = {
    schema: 'xtend-llm.app-services-catfood-report.v1',
    ok,
    status: ok ? 'passed' : 'failed',
    command: 'npm run test:catfood',
    createdAt: new Date().toISOString(),
    checks,
    ...extra
  };
  fs.mkdirSync(resultDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

try {
  const files = {
    rmt: path.join(productRoot, 'xtend-llm.rmt'),
    services: path.join(productRoot, 'src', 'services.ts'),
    controller: path.join(productRoot, 'src', 'renderer', 'app-controller.mjs'),
    shell: path.join(productRoot, 'site', 'index.html'),
    buildScript: path.join(productRoot, 'scripts', 'rmt-build.mjs'),
    planScript: path.join(productRoot, 'scripts', 'rmt-plan.mjs'),
    bundle: path.join(productRoot, 'site', 'build', 'xtend.maraca.mjs'),
    bundleReport: path.join(productRoot, 'site', 'build', 'xtend.maraca.report.json'),
    sizeReport: path.join(productRoot, 'site', 'build', 'xtend.maraca.size.json'),
    manifest: path.join(productRoot, 'site', 'build', 'xtend.maraca.services.json'),
    declarations: path.join(productRoot, 'site', 'build', 'xtend.maraca.services.d.ts'),
    smokeReport: path.join(resultDir, 'layout-smoke.json'),
    smokeScreenshot: path.join(resultDir, 'layout-smoke.png')
  };
  const requiredFiles = Object.entries(files).filter(([, file]) => !fs.existsSync(file)).map(([name]) => name);
  record('artifacts.required', requiredFiles.length === 0, { missing: requiredFiles });
  if (requiredFiles.length > 0) throw new Error(`Required Catfood files are missing: ${requiredFiles.join(', ')}`);

  const controller = read(files.controller);
  const servicesSource = read(files.services);
  const rmtSource = read(files.rmt);
  const shell = read(files.shell);
  const forbiddenBoundaries = {
    hostDataSourceAdapter: /\bhostDataSourceAdapter\b/u.test(controller),
    dataSourceAdapters: /\bdataSourceAdapters\b/u.test(controller),
    hostServiceAdapters: /\bhostServiceAdapters\b/u.test(controller),
    manualBoot: /\bbootXtendMaraca\b/u.test(controller),
    privateMaracaGlobal: /window\.__XTend/u.test(controller),
    activeRunId: /\bactiveRunId\b/u.test(controller),
    manualCorrelationFactory: /(?:correlationId|invocationId)\s*:\s*[^,\n]*(?:Date\.now|Math\.random|activeJobId)/u.test(controller)
  };
  record('source.public-boundary', Object.values(forbiddenBoundaries).every((value) => value === false), forbiddenBoundaries);
  record('source.public-lifecycle', /addEventListener\('xtend-maraca:boot'/u.test(controller)
    && /window\.XTendMaraca\?\.appServices\?\.registry/u.test(controller), {
    publicBootEvent: /addEventListener\('xtend-maraca:boot'/u.test(controller),
    publicRegistry: /window\.XTendMaraca\?\.appServices\?\.registry/u.test(controller)
  });
  record('source.worker-job-gate', /generationDelta[\s\S]{0,300}!isActiveJob\(jobId\)/u.test(controller)
    && /generationComplete[\s\S]{0,200}!isActiveJob\(complete\s*&&\s*complete\.jobId\)/u.test(controller)
    && /generationError[\s\S]{0,200}!isActiveJob\(error\.jobId\)/u.test(controller), {
    delta: /generationDelta[\s\S]{0,300}!isActiveJob\(jobId\)/u.test(controller),
    complete: /generationComplete[\s\S]{0,200}!isActiveJob\(complete\s*&&\s*complete\.jobId\)/u.test(controller),
    error: /generationError[\s\S]{0,200}!isActiveJob\(error\.jobId\)/u.test(controller)
  });
  record('source.single-browser-entry', !/app-controller\.mjs/u.test(shell)
    && /build\/xtend\.maraca\.mjs/u.test(shell), {
    controllerScriptCount: (shell.match(/app-controller\.mjs/gu) || []).length,
    maracaScriptCount: (shell.match(/build\/xtend\.maraca\.mjs/gu) || []).length
  });
  record('source.registry-definition', /defineAppServices\s*\(/u.test(servicesSource)
    && /'xtend\.llm\.generationStream':\s*service\s*\(\{[\s\S]*?kind:\s*'stream'/u.test(servicesSource), {
    staticServiceCount: (servicesSource.match(/'xtend\.llm\.[^']+':\s*service\s*\(/gu) || []).length,
    hasGenerationStream: /'xtend\.llm\.generationStream'/u.test(servicesSource)
  });

  const plan = createMaracaBuildPlan({
    source: files.rmt,
    out: path.join(productRoot, 'site', 'build'),
    profile: 'production',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    kernelBootMode: 'productSurface',
    hydration: 'prewarm',
    validation: 'strict',
    transitions: 'strict',
    enablePrewarmWorker: true,
    services: {
      clientEntry: files.services,
      targets: ['browser'],
      budgets: {
        clientBytes: 65_536
      },
      strict: true
    },
    json: true
  }, { rootDir: repoRoot });
  const servicePlan = plan.services || {};
  const demandIds = sorted((servicePlan.demands?.services || []).map((entry) => entry.id));
  const implementationIds = sorted((servicePlan.inspections?.client?.services || []).map((entry) => entry.id));
  record('plan.strict-services', plan.ok === true && servicePlan.enabled === true && servicePlan.ok === true
    && servicePlan.strict === true && servicePlan.status === 'planned', {
    planOk: plan.ok,
    enabled: servicePlan.enabled,
    strict: servicePlan.strict,
    status: servicePlan.status,
    targets: servicePlan.targets,
    clientEntry: servicePlan.entries?.client?.relative
  });
  record('plan.exact-coverage', JSON.stringify(demandIds) === JSON.stringify(implementationIds)
    && demandIds.length === 27 && (servicePlan.diagnostics || []).length === 0, {
    demandCount: demandIds.length,
    implementationCount: implementationIds.length,
    missing: demandIds.filter((id) => !implementationIds.includes(id)),
    extra: implementationIds.filter((id) => !demandIds.includes(id)),
    diagnostics: servicePlan.diagnostics || []
  });
  const streamDemands = (servicePlan.demands?.services || []).filter((entry) => entry.mode === 'stream').map((entry) => entry.id);
  record('plan.generation-stream', streamDemands.length === 1 && streamDemands[0] === 'xtend.llm.generationStream', {
    streamDemands
  });

  const sourceMtime = Math.max(...[
    files.rmt,
    files.services,
    files.controller,
    files.shell,
    files.buildScript,
    files.planScript
  ].map((file) => fs.statSync(file).mtimeMs));
  const artifactMtime = Math.min(...[
    files.bundle,
    files.bundleReport,
    files.sizeReport,
    files.manifest,
    files.declarations
  ].map((file) => fs.statSync(file).mtimeMs));
  record('build.fresh-artifacts', artifactMtime >= sourceMtime, { sourceMtime, artifactMtime });

  const bundleReport = readJson(files.bundleReport);
  const manifest = readJson(files.manifest);
  const sizeReport = readJson(files.sizeReport);
  const declarations = read(files.declarations);
  const bundle = read(files.bundle);
  const manifestIds = sorted((manifest.services || []).map((entry) => entry.id));
  record('build.service-report', bundleReport.ok === true && bundleReport.services?.enabled === true
    && bundleReport.services?.ok === true && bundleReport.services?.status === 'built'
    && bundleReport.services?.budgets?.clientBytes === 65_536
    && (bundleReport.services?.diagnostics || []).length === 0, {
    reportSchema: bundleReport.schema,
    serviceSchema: bundleReport.services?.schema,
    serviceStatus: bundleReport.services?.status,
    clientBudgetBytes: bundleReport.services?.budgets?.clientBytes,
    diagnostics: bundleReport.services?.diagnostics || []
  });
  record('build.manifest', manifest.schema === 'xtend.maraca.app-services-manifest.v1'
    && manifestIds.length === 27 && JSON.stringify(manifestIds) === JSON.stringify(demandIds), {
    schema: manifest.schema,
    serviceCount: manifestIds.length,
    fingerprint: manifest.fingerprint,
    stream: manifest.services?.find((entry) => entry.id === 'xtend.llm.generationStream') || null
  });
  record('build.types', /export interface AppServiceContract/u.test(declarations)
    && /"xtend\.llm\.generationStream"[\s\S]*?mode:\s*"stream"/u.test(declarations)
    && !/\bany\b/u.test(declarations), {
    bytes: Buffer.byteLength(declarations),
    usesUnknownFallback: /\bunknown\b/u.test(declarations),
    containsAny: /\bany\b/u.test(declarations)
  });
  record('build.browser-bundle', bundle.includes('The public Maraca AppServices registry is unavailable.')
    && bundle.includes('xtend.llm.generationStream'), {
    bytes: Buffer.byteLength(bundle),
    appServiceBytes: sizeReport.appServices?.clientBytes || 0,
    appServiceWithinBudget: sizeReport.appServices?.clientWithinBudget
  });
  record('build.app-service-budget', sizeReport.appServices?.clientBudgetBytes === 65_536
    && sizeReport.appServices?.clientWithinBudget === true, {
    clientBytes: sizeReport.appServices?.clientBytes,
    clientBudgetBytes: sizeReport.appServices?.clientBudgetBytes,
    clientWithinBudget: sizeReport.appServices?.clientWithinBudget
  });

  const smokeReport = readJson(files.smokeReport);
  const smokeScreenshot = fs.readFileSync(files.smokeScreenshot);
  const smokeHistory = Array.isArray(smokeReport.appServices?.history) ? smokeReport.appServices.history : [];
  record('smoke.source-to-sea', smokeReport.schema === 'xtend-llm.layout-smoke-report.v1'
    && smokeReport.ok === true
    && smokeReport.status === 'passed'
    && smokeReport.sourceToSea?.event === 'xtend-command'
    && smokeReport.sourceToSea?.action === 'xtend.llm.send'
    && smokeReport.sourceToSea?.service === 'xtend.llm.send'
    && smokeReport.sourceToSea?.streamService === 'xtend.llm.generationStream'
    && smokeReport.sourceToSea?.state === 'xtend.llm.transcript'
    && smokeReport.sourceToSea?.renderedMessages >= 2, {
    schema: smokeReport.schema,
    status: smokeReport.status,
    sourceToSea: smokeReport.sourceToSea || null
  });
  record('smoke.app-services', smokeReport.appServices?.enabled === true
    && smokeReport.appServices?.serviceCount === 27
    && smokeReport.appServices?.activeCount === 0
    && smokeReport.appServices?.listenerErrorCount === 0
    && smokeHistory.some((entry) => entry.serviceId === 'xtend.llm.send' && entry.status === 'fulfilled')
    && smokeHistory.some((entry) => entry.serviceId === 'xtend.llm.generationStream' && entry.kind === 'stream' && entry.status === 'fulfilled'), {
    serviceCount: smokeReport.appServices?.serviceCount,
    activeCount: smokeReport.appServices?.activeCount,
    listenerErrorCount: smokeReport.appServices?.listenerErrorCount,
    history: smokeHistory
  });
  record('smoke.screenshot-integrity', smokeScreenshot.byteLength > 0
    && smokeReport.screenshot?.bytes === smokeScreenshot.byteLength
    && smokeReport.screenshot?.sha256 === sha256(smokeScreenshot), {
    bytes: smokeScreenshot.byteLength,
    expectedBytes: smokeReport.screenshot?.bytes || 0,
    sha256: sha256(smokeScreenshot),
    expectedSha256: smokeReport.screenshot?.sha256 || null
  });
  record('smoke.fresh-evidence', fs.statSync(files.smokeReport).mtimeMs >= sourceMtime
    && fs.statSync(files.smokeScreenshot).mtimeMs >= sourceMtime, {
    sourceMtime,
    reportMtime: fs.statSync(files.smokeReport).mtimeMs,
    screenshotMtime: fs.statSync(files.smokeScreenshot).mtimeMs
  });

  const report = writeReport({
    sourceFingerprint: sha256([rmtSource, servicesSource, controller].join('\n')),
    serviceGraphFingerprint: plan.serviceGraphFingerprint,
    manifestFingerprint: manifest.fingerprint,
    sourceBoundary: {
      controller: path.relative(productRoot, files.controller),
      serviceEntry: path.relative(productRoot, files.services),
      forbidden: forbiddenBoundaries
    },
    serviceCoverage: {
      demands: demandIds.length,
      implementations: implementationIds.length,
      invoke: manifest.services.filter((entry) => entry.mode === 'invoke').length,
      stream: manifest.services.filter((entry) => entry.mode === 'stream').length,
      targets: manifest.targets
    },
    build: {
      profile: bundleReport.profile,
      status: bundleReport.status,
      appServiceBytes: sizeReport.appServices?.clientBytes || 0,
      appServiceWithinBudget: sizeReport.appServices?.clientWithinBudget === true,
      toolchain: bundleReport.toolchain?.typescript || null
    },
    smoke: {
      command: 'npm run test:catfood:smoke',
      report: '.xtend-llm-results/layout-smoke.json',
      status: smokeReport.status,
      sourceToSea: smokeReport.sourceToSea,
      screenshot: smokeReport.screenshot
    }
  });
  console.log(`${report.ok ? 'ok' : 'not ok'} - XTend LLM AppServices Catfood (${reportPath})`);
  if (!report.ok) process.exitCode = 1;
} catch (error) {
  const report = writeReport({
    fatal: {
      name: error?.name || 'Error',
      message: error?.message || String(error)
    }
  });
  console.error(`not ok - XTend LLM AppServices Catfood (${reportPath})`);
  console.error(report.fatal.message);
  process.exitCode = 1;
}

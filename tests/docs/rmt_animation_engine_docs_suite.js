'use strict';

const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  DEMO_SCHEMA,
  EXPECTED_EFFECTS,
  OUTPUT_PATH,
  SOURCE_PATH,
  buildDocsAnimationEngineDemo
} = require('../../scripts/build_docs_animation_engine_demo');

const RMT_ANIMATION_ENGINE_DOCS_SCHEMA = 'xtend.docs.rmt-animation-engine-docs.v1';
const RMT_ANIMATION_ENGINE_DOCS_REPORT_SCHEMA = 'xtend.docs.rmt-animation-engine-docs-report.v1';
const RMT_ANIMATION_ENGINE_DOCS_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-animation-engine-docs --json';
const ARTICLE_SLUG = 'rmt-animation-engine';
const ARTICLE_PATHS = Object.freeze([
  'docs/de/rmt-animation-engine.md',
  'docs/en/rmt-animation-engine.md'
]);

function extractRmtBlocks(markdown) {
  const blocks = [];
  const pattern = /```rmt\s*([\s\S]*?)```/gu;
  let match;
  while ((match = pattern.exec(markdown))) blocks.push(match[1].trim());
  return blocks;
}

function compileClean(source, filePath) {
  const result = compileRmtVNextSource({ text: source, filePath });
  const blocking = (result.diagnostics || [])
    .filter((diagnostic) => diagnostic && ['error', 'warning'].includes(diagnostic.severity));
  return { result, blocking };
}

function walkMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? walkMarkdown(absolute) : (absolute.endsWith('.md') ? [absolute] : []);
  });
}

function runRmtAnimationEngineDocsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-animation-engine-docs',
    label: 'RMT AnimationEngine Docs and Live Demo'
  });
  const menu = readJson('docs/menu.json', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const artifact = readJson(OUTPUT_PATH, rootDir);
  const source = readText(SOURCE_PATH, rootDir);
  const pageLoader = readText('docs/utils/pageloader.js', rootDir);
  const demoModule = readText('docs/utils/animation-engine-demo.mjs', rootDir);
  const xUtilsSource = readText('components/xutils.js', rootDir);
  const builderSource = readText('scripts/build_docs_animation_engine_demo.js', rootDir);
  const browserSmoke = readText('scripts/smoke_docs_animation_engine_demo.mjs', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const indexPhp = readText('docs/index.php', rootDir);
  const implementationPlan = readText('development/XTend-Docs-Quality-Implementierungsplan.md', rootDir);
  const menuEntry = menu.find((entry) => entry.slug === ARTICLE_SLUG);

  context.assert(menu.length === 165, 'Docs menu exposes exactly 165 canonical slugs');
  context.assert(Boolean(menuEntry), 'Docs menu exposes the RMT AnimationEngine article');
  context.assert(menuEntry && menuEntry.id === 'docs.rmt.animation.engine', 'AnimationEngine menu id is stable');
  context.assert(menuEntry && menuEntry.group === 'rmt' && menuEntry.parent === 'rmt-vnext-authoring', 'AnimationEngine is nested below RMT Authoring');
  context.assert(menuEntry && menuEntry.tier === 'basic' && menuEntry.rank === 94, 'AnimationEngine uses the planned basic tier and rank');
  context.assert(menuEntry && menuEntry.contentType === 'tutorial' && menuEntry.icon === 'sparkles', 'AnimationEngine menu metadata declares tutorial and icon');

  for (const locale of ['de', 'en']) {
    const localeFiles = walkMarkdown(path.join(rootDir, 'docs', locale));
    context.assert(localeFiles.length === 165, `${locale} contains exactly 165 public Markdown articles`);
  }

  const articleBlocks = [];
  ARTICLE_PATHS.forEach((articlePath) => {
    const markdown = readText(articlePath, rootDir);
    context.assert(markdown.startsWith('# RMT AnimationEngine'), `${articlePath} starts with the canonical title`);
    context.assert(markdown.includes('xtend.rmt.animation-engine.v1'), `${articlePath} names the AOT plan schema`);
    context.assert(markdown.includes('xtend.rmt.animation-engine-runtime.v1'), `${articlePath} names the runtime schema`);
    context.assert(markdown.includes('products/rmt-animation-testbench'), `${articlePath} links the product TestBench path`);
    context.assert(markdown.includes('http://127.0.0.1:9196/'), `${articlePath} documents the TestBench URL`);
    context.assert(markdown.includes('./rmt-reference-validation-transitions.md'), `${articlePath} links the transition reference`);
    context.assert(markdown.includes('./motion-contrast.md'), `${articlePath} links motion accessibility guidance`);
    const blocks = extractRmtBlocks(markdown);
    articleBlocks.push(blocks);
    context.assert(blocks.length === 3, `${articlePath} contains three focused RMT examples`);
    blocks.forEach((block, index) => {
      const compiled = compileClean(block, `${articlePath}#example-${index + 1}.rmt`);
      context.assert(
        compiled.result.ok === true && compiled.blocking.length === 0,
        `${articlePath} example ${index + 1} compiles without warnings or errors`
      );
    });
  });
  context.assert(JSON.stringify(articleBlocks[0]) === JSON.stringify(articleBlocks[1]), 'DE and EN expose technically identical RMT examples');

  const compiledSource = compileClean(source, SOURCE_PATH);
  context.assert(compiledSource.result.ok === true && compiledSource.blocking.length === 0, 'AOT demo RMT source compiles cleanly');
  const animationPlan = compiledSource.result.orchestrationArtifacts && compiledSource.result.orchestrationArtifacts.animationEngine;
  const hydrationPlan = compiledSource.result.orchestrationArtifacts && compiledSource.result.orchestrationArtifacts.hydration;
  context.assert(animationPlan && animationPlan.schema === 'xtend.rmt.animation-engine.v1', 'AOT demo emits the AnimationEngine plan');
  context.assert(animationPlan && animationPlan.animations.length === EXPECTED_EFFECTS.length, 'AOT demo emits one preset for every supported effect');
  EXPECTED_EFFECTS.forEach((effect) => {
    context.assert(animationPlan && animationPlan.animations.some((animation) => animation.effect === effect), `AOT demo includes ${effect}`);
  });
  context.assert(animationPlan && animationPlan.transitions.every((transition) => transition.interrupt === 'replace'), 'All demo transitions use replace interruption');
  context.assert(animationPlan && animationPlan.transitions.every((transition) => transition.layoutKey === 'docs-animation-article'), 'All demo transitions use the stable article layout key');
  context.assert(animationPlan && animationPlan.transitions.every((transition) => transition.lane === 'transition'), 'All demo transitions use the transition lane');
  context.assert(animationPlan && animationPlan.animations.some((animation) => animation.effect === 'fade-blur' && animation.allowFilter === true), 'Fade blur is explicitly opted into filter keyframes');
  context.assert(hydrationPlan && hydrationPlan.records.length === 2, 'AOT demo emits both hydration records');
  context.assert(hydrationPlan && hydrationPlan.records.every((record) => record.insularHydration === true && record.lane === 'idle'), 'Demo hydration stays insular on idle');

  const generated = buildDocsAnimationEngineDemo({ rootDir });
  const artifactText = readText(OUTPUT_PATH, rootDir);
  context.assert(generated.serialized === artifactText, 'Generated AnimationEngine plan is deterministic and current');
  context.assert(artifact.schema === DEMO_SCHEMA && artifact.planSchema === 'xtend.rmt.animation-engine.v1', 'Generated artifact links docs and compiler schemas');
  context.assert(artifact.animationPlan.animations.length === 17 && artifact.animationPlan.transitions.length === 17, 'Generated runtime plan contains 17 presets and transitions');
  context.assert(artifact.controls.durations.every((duration) => duration >= 120 && duration <= 650), 'Duration allowlist stays within the compact demo range');
  context.assert(JSON.stringify(artifact.controls.reducedMotionPreviews) === JSON.stringify(['system', 'fade', 'instant', 'none']), 'Reduced-motion preview allowlist is stable');

  context.assert(pageLoader.includes('createDocsAnimationEngineDemoSkeleton'), 'Page loader creates a route-specific AnimationEngine skeleton');
  context.assert(pageLoader.includes("article.insertBefore(root, mdContent)"), 'AnimationEngine skeleton is inserted above Parsedown content');
  context.assert(pageLoader.includes('data-xtend-cls-anchor') && pageLoader.includes('docs.animation-engine.demo'), 'AnimationEngine skeleton declares a CLS anchor');
  context.assert(pageLoader.includes("controls.setAttribute('data-slot-layout', 'fixed-responsive-grid')"), 'AnimationEngine skeleton declares its fixed responsive slot layout');
  context.assert(pageLoader.includes("['effect', 'duration', 'easing', 'motion']") && pageLoader.includes("createSlot('status', status)"), 'AnimationEngine skeleton reserves all six named control slots');
  context.assert(pageLoader.includes('--docs-animation-field-slot-size: 4.55rem') && pageLoader.includes('--docs-animation-status-slot-size: 5.5rem'), 'AnimationEngine skeleton reserves fixed field and status rows before hydration');
  context.assert(pageLoader.includes('IntersectionObserver') && pageLoader.includes("scheduleDocsIdle(() => hydrate('visible-idle'))"), 'AnimationEngine hydration combines visibility and idle scheduling');
  context.assert(pageLoader.indexOf("window.dispatchEvent(new CustomEvent('xtend-docs-content-ready'") < pageLoader.indexOf('scheduleDocsAnimationEngineDemoHydration({'), 'Demo hydration is scheduled only after content-ready dispatch');
  context.assert(pageLoader.includes('requestImmediateHydration') && pageLoader.includes("hydrate('user-intent')"), 'Focus and pointer intent can advance lazy hydration');
  context.assert(pageLoader.includes('controller.dispose()') && pageLoader.includes('reconcileDocsAnimationEngineDemoSlot'), 'Route lifecycle disposes the demo controller');
  context.assert(pageLoader.includes("credentials: 'same-origin'") && pageLoader.includes('docsAnimationEngineSameOriginUrl'), 'Plan and module loading stay same-origin');
  context.assert(!pageLoader.includes('preload\" href=\"/docs/utils/animation-engine-demo.mjs'), 'Demo module is not preloaded in the route shell');

  context.assert(demoModule.includes("from '/xtendrmt/rmt-animation-engine-runtime.js'"), 'Live demo uses the real AnimationEngine runtime');
  context.assert(demoModule.includes("from '/components/xutils.js'"), 'Live demo delegates visual work to XUtils');
  context.assert(demoModule.includes('createDemoXUtilsAdapter') && demoModule.includes('XUtils.runUiTransition({ ...input, body: false })'), 'Live demo opts into user-triggered motion through a local XUtils policy adapter');
  context.assert(demoModule.includes("target.cloneNode(true)"), 'Replay uses a transient DOM clone for the outgoing layer');
  context.assert(demoModule.includes("clone.setAttribute('aria-hidden', 'true')") && demoModule.includes("clone.setAttribute('inert', '')"), 'Outgoing clone is hidden from accessibility and interaction');
  context.assert(demoModule.includes('removeEventListener') && demoModule.includes('restorePresentation'), 'Demo cleans listeners and presentation state');
  context.assert(!demoModule.includes('.innerHTML') && !demoModule.includes('eval(') && !demoModule.includes('new Function'), 'Demo module avoids HTML string sinks and dynamic code execution');
  context.assert(!/window\.(?:fetch|matchMedia|history|performance)\s*=/u.test(demoModule), 'Demo module does not monkeypatch browser globals');
  context.assert(!demoModule.includes("replay('auto')"), 'Demo never auto-plays article motion');
  context.assert(demoModule.includes('networkDuringReplay') && demoModule.includes('data-network-during-replay'), 'Replay records its no-network boundary');
  context.assert(demoModule.includes('createControlSlot') && demoModule.includes("'data-slot': name"), 'Hydrated controls use named RMT-compatible layout slots');
  context.assert(demoModule.includes("createControlSlot('status', status)") && demoModule.includes('--docs-animation-status-slot-size: 5.5rem'), 'Hydrated status uses the same fixed slot geometry as the skeleton');
  context.assert(demoModule.includes("root.setAttribute('data-replay-layout-stable'") && demoModule.includes('recordReplayGeometry'), 'Replay records control geometry across status changes');
  context.assert(pageLoader.includes("root.setAttribute('data-demo-replay-cls', '0')") && browserSmoke.includes('replayLayoutShift <= 0.01'), 'Browser smoke scopes its CLS budget to the AnimationEngine replay lifecycle');
  context.assert(xUtilsSource.includes('function toArray(value)') && xUtilsSource.includes('keyframes: toArray(options.keyframes)'), 'XUtils normalizes optional AnimationEngine keyframe arrays');
  context.assert(browserSmoke.includes("findCommand(['chromedriver'"), 'Browser smoke uses the repository ChromeDriver path');
  context.assert(browserSmoke.includes("node.shadowRoot") && browserSmoke.includes("deepQuery('[data-docs-animation-engine-demo]')"), 'Browser smoke inspects the active XRouter shadow route');
  context.assert(browserSmoke.includes('webDriverRequest(baseUrl, `/session/${sessionId}/screenshot`)'), 'Browser smoke captures screenshots from the verified WebDriver session');

  context.assert(builderSource.includes("const DEMO_SCHEMA = 'xtend.docs.animation-engine-demo.v1'"), 'Builder owns the docs artifact schema');
  context.assert(indexPhp.includes("'rmt-animation-engine' => 'sparkles'"), 'PHP SSR icon mapping recognizes the article');
  context.assert(implementationPlan.includes('XDQ-WP-09') && implementationPlan.includes('165 kanonische'), 'Docs quality plan tracks the AnimationEngine work and new corpus size');

  const metadata = packageManifest.xtend && packageManifest.xtend.docsAnimationEngine;
  context.assert(metadata && metadata.schema === RMT_ANIMATION_ENGINE_DOCS_SCHEMA, 'Package metadata records the AnimationEngine docs schema');
  context.assert(metadata && metadata.artifactSchema === DEMO_SCHEMA, 'Package metadata records the demo artifact schema');
  context.assert(metadata && metadata.localGate === RMT_ANIMATION_ENGINE_DOCS_LOCAL_GATE, 'Package metadata records the focused local gate');
  context.assert(packageManifest.scripts['build:docs-animation-engine-demo'] === 'node scripts/build_docs_animation_engine_demo.js --write', 'Package exposes the deterministic demo build');
  context.assert(packageManifest.scripts['check:docs-animation-engine-demo'] === 'node scripts/build_docs_animation_engine_demo.js --check', 'Package exposes the deterministic demo check');
  context.assert(packageManifest.scripts['test:rmt-animation-engine-docs'] === 'node scripts/run_xtend_tests.js rmt-animation-engine-docs', 'Package exposes the focused docs suite');
  context.assert(packageManifest.scripts['test:rmt-animation-engine-docs:browser'] === 'node scripts/smoke_docs_animation_engine_demo.mjs', 'Package exposes the optional Chromium smoke');
  context.assert(runner.includes("id: 'rmt-animation-engine-docs'"), 'Test runner registers the AnimationEngine docs suite');
  context.assert(syntaxCheckFile('docs/utils/pageloader.js', { rootDir, extension: '.js' }).ok, 'Docs page loader passes syntax check');
  context.assert(syntaxCheckFile('docs/utils/animation-engine-demo.mjs', { rootDir, extension: '.mjs' }).ok, 'AnimationEngine demo module passes syntax check');
  context.assert(syntaxCheckFile('scripts/build_docs_animation_engine_demo.js', { rootDir, extension: '.js' }).ok, 'AnimationEngine artifact builder passes syntax check');
  context.assert(fs.existsSync(resolveRepoPath('scripts/smoke_docs_animation_engine_demo.mjs', rootDir)), 'Chromium docs smoke script exists');

  return context.result({
    report: {
      schema: RMT_ANIMATION_ENGINE_DOCS_REPORT_SCHEMA,
      docsSchema: RMT_ANIMATION_ENGINE_DOCS_SCHEMA,
      artifactSchema: DEMO_SCHEMA,
      localGate: RMT_ANIMATION_ENGINE_DOCS_LOCAL_GATE,
      articleSlug: ARTICLE_SLUG,
      articlePaths: ARTICLE_PATHS.slice(),
      effectCount: EXPECTED_EFFECTS.length,
      canonicalSlugCount: menu.length
    }
  });
}

function printRmtAnimationEngineDocsReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT AnimationEngine docs and live demo checks passed.',
    failureTitle: 'RMT AnimationEngine docs and live demo checks failed:'
  });
}

if (require.main === module) {
  const result = runRmtAnimationEngineDocsSuite();
  printRmtAnimationEngineDocsReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  ARTICLE_PATHS,
  ARTICLE_SLUG,
  RMT_ANIMATION_ENGINE_DOCS_LOCAL_GATE,
  RMT_ANIMATION_ENGINE_DOCS_REPORT_SCHEMA,
  RMT_ANIMATION_ENGINE_DOCS_SCHEMA,
  printRmtAnimationEngineDocsReport,
  runRmtAnimationEngineDocsSuite
};

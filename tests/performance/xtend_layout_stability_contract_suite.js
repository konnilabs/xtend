const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRootDir
} = require('../utils/files');

const XTEND_LAYOUT_STABILITY_SCHEMA = 'xtend.layout-stability.v1';
const XTEND_LAYOUT_STABILITY_LOCAL_GATE = 'node scripts/run_xtend_tests.js xtend-layout-stability-contract --json';

const LAYOUT_CRITICAL_COMPONENTS = Object.freeze([
  { tag: 'x-header', path: 'components/xheader.js', reserveToken: '--header-reserved-block-size' },
  { tag: 'x-hero', path: 'components/xhero.js', reserveToken: '--hero-reserved-block-size' },
  { tag: 'x-router', path: 'components/xrouter.js', reserveToken: '--xtend-router-reserved-block-size' },
  { tag: 'x-footer', path: 'components/xfooter.js', reserveToken: '--footer-reserved-block-size' },
  { tag: 'x-section', path: 'components/xsection.js', reserveToken: '--section-reserved-block-size' },
  { tag: 'x-cards', path: 'components/xcards.js', reserveToken: '--cards-reserved-block-size' },
  { tag: 'x-masonry', path: 'components/xmasonry.js', reserveToken: '--masonry-reserved-block-size' },
  { tag: 'x-player', path: 'components/xplayer.js', reserveToken: '--x-player-reserved-block-size' }
]);

function runXtendLayoutStabilityContractSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtend-layout-stability-contract',
    label: 'XTend Layout Stability Contract'
  });
  const packageManifest = JSON.parse(readText('package.json', rootDir));
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const xtendCss = readText('xtend.css', rootDir);

  context.assert(xtendCss.includes('[data-xtend-layout-reserve]'), 'Base CSS exposes data-xtend-layout-reserve');
  context.assert(xtendCss.includes('--xtend-layout-reserved-block-size'), 'Base CSS uses the shared reserved block-size token');
  context.assert(xtendCss.includes('contain-intrinsic-size: auto var(--xtend-layout-reserved-block-size'), 'Base CSS reserves intrinsic lazy layout size');
  context.assert(xtendCss.includes('content-visibility: auto'), 'Base CSS supports lazy/offscreen layout reserves');
  context.assert(xtendCss.includes('transition-property: opacity, transform, color, background-color, border-color, box-shadow !important;'), 'Base CSS blocks geometry transitions during hydration reserves');
  context.assert(xtendCss.includes(':where(') && xtendCss.includes('x-router') && xtendCss.includes('x-footer'), 'Base CSS gives shell custom elements stable block hosts');
  context.assert(xtendCss.includes('min-height: var(--xtend-layout-reserved-block-size, var(--xtend-skeleton-min-height'), 'Skeleton geometry reuses layout reserve tokens');

  LAYOUT_CRITICAL_COMPONENTS.forEach((component) => {
    const source = readText(component.path, rootDir);
    context.assert(source.includes('static get xtendLayoutStabilityProfile'), `${component.tag} exposes xtendLayoutStabilityProfile`);
    context.assert(source.includes(XTEND_LAYOUT_STABILITY_SCHEMA), `${component.tag} uses layout stability schema`);
    context.assert(source.includes('hydrationShiftPolicy') && source.includes('no-geometry-shift'), `${component.tag} declares no-geometry-shift policy`);
    context.assert(source.includes('shellFirstCompatible: true'), `${component.tag} declares shell-first compatibility`);
    context.assert(source.includes('lazyLoadingCompatible: true'), `${component.tag} declares lazyloading compatibility`);
    context.assert(source.includes(component.reserveToken), `${component.tag} binds reserved block-size token`);
    context.assert(source.includes('contain-intrinsic-size'), `${component.tag} exposes intrinsic size reservation`);
  });

  context.assert(packageManifest.scripts['test:xtend-layout-stability-contract'] === 'node scripts/run_xtend_tests.js xtend-layout-stability-contract', 'package exposes layout stability contract script');
  context.assert(packageManifest.xtend.layoutStabilityContract.schema === XTEND_LAYOUT_STABILITY_SCHEMA, 'package metadata records layout stability schema');
  context.assert(packageManifest.xtend.layoutStabilityContract.localGate === XTEND_LAYOUT_STABILITY_LOCAL_GATE, 'package metadata records layout stability local gate');
  context.assert(runner.includes("id: 'xtend-layout-stability-contract'"), 'test runner registers layout stability contract suite');

  return context.result({
    schema: 'xtend.layout-stability-contract-report.v1',
    layoutStabilitySchema: XTEND_LAYOUT_STABILITY_SCHEMA,
    componentCount: LAYOUT_CRITICAL_COMPONENTS.length,
    localGate: XTEND_LAYOUT_STABILITY_LOCAL_GATE
  });
}

function printXtendLayoutStabilityContractReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Layout Stability Contract erfolgreich.',
    failureTitle: 'XTend Layout Stability Contract fehlgeschlagen:'
  });
}

module.exports = {
  XTEND_LAYOUT_STABILITY_LOCAL_GATE,
  XTEND_LAYOUT_STABILITY_SCHEMA,
  runXtendLayoutStabilityContractSuite,
  printXtendLayoutStabilityContractReport
};

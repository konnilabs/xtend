const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const vm = require('vm');

const layoutDisplayMediaComponentConfigs = {
  'x-section': {
    fileName: 'xsection.js',
    source: 'components/xsection.js',
    fixture: 'tests/components/fixtures/xsection.component.html',
    docs: 'docs/components/xsection.md',
    types: 'components/xsection.d.ts',
    event: 'section-rendered',
    stateKey: 'xsection-state-<id>',
    attributes: ['layout', 'label', 'bordered']
  },
  'x-cards': {
    fileName: 'xcards.js',
    source: 'components/xcards.js',
    fixture: 'tests/components/fixtures/xcards.component.html',
    docs: 'docs/components/xcards.md',
    types: 'components/xcards.d.ts',
    event: 'cards-layout',
    stateKey: 'xcards-state-<id>',
    attributes: ['columns', 'gap']
  },
  'x-header': {
    fileName: 'xheader.js',
    source: 'components/xheader.js',
    fixture: 'tests/components/fixtures/xheader.component.html',
    docs: 'docs/components/xheader.md',
    types: 'components/xheader.d.ts',
    event: 'header-ready',
    stateKey: 'xheader-state-<id>',
    attributes: ['logo-size', 'sticky', 'menu-mode', 'menu-placement', 'menu-modal', 'menu-open', 'menu-breakpoint', 'menu-width', 'menu-max-height', 'menu-align']
  },
  'x-footer': {
    fileName: 'xfooter.js',
    source: 'components/xfooter.js',
    fixture: 'tests/components/fixtures/xfooter.component.html',
    docs: 'docs/components/xfooter.md',
    types: 'components/xfooter.d.ts',
    event: 'footer-ready',
    stateKey: 'xfooter-state-<id>',
    attributes: ['logo-size']
  },
  'x-hero': {
    fileName: 'xhero.js',
    source: 'components/xhero.js',
    fixture: 'tests/components/fixtures/xhero.component.html',
    docs: 'docs/components/xhero.md',
    types: 'components/xhero.d.ts',
    event: 'hero-rendered',
    stateKey: 'xhero-state-<id>',
    attributes: ['background', 'align', 'overlay']
  },
  'x-type': {
    fileName: 'xtype.js',
    source: 'components/xtype.js',
    fixture: 'tests/components/fixtures/xtype.component.html',
    docs: 'docs/components/xtype.md',
    types: 'components/xtype.d.ts',
    event: 'typing-started',
    stateKey: 'xtype-current',
    attributes: ['texts', 'speed', 'pause']
  },
  'x-code': {
    fileName: 'xcode.js',
    source: 'components/xcode.js',
    fixture: 'tests/components/fixtures/xcode.component.html',
    docs: 'docs/components/xcode.md',
    types: 'components/xcode.d.ts',
    event: 'code-copied',
    stateKey: 'xcode-state-<id>',
    attributes: ['lang', 'language']
  },
  'x-masonry': {
    fileName: 'xmasonry.js',
    source: 'components/xmasonry.js',
    fixture: 'tests/components/fixtures/xmasonry.component.html',
    docs: 'docs/components/xmasonry.md',
    types: 'components/xmasonry.d.ts',
    event: 'masonry-layout',
    stateKey: 'xmasonry-state-<id>',
    attributes: ['columns', 'gap', 'save-positions']
  }
};

function includesAny(content, patterns = []) {
  return patterns.some((pattern) => content.includes(pattern));
}

function runLayoutDisplayMediaComponentSuite(tag, options = {}) {
  const config = layoutDisplayMediaComponentConfigs[tag];
  if (!config) throw new Error(`Unknown layout display media component suite: ${tag}`);
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: `component:${tag}`,
    label: `${tag} layout display media component contract`
  });
  const manifest = readJson('components/manifest.json', rootDir);
  const source = readText(config.source, rootDir);
  const fixture = readText(config.fixture, rootDir);
  const docs = readText(config.docs, rootDir);
  const types = readText(config.types, rootDir);
  const syntax = syntaxCheckFile(config.source, { rootDir, extension: '.js' });

  context.assert(manifest[tag] === `./${config.fileName}`, `${tag} manifest entry points to ${config.fileName}`);
  context.assert(syntax.ok, `${tag} source passes syntax check${syntax.ok ? '' : ` (${syntax.message})`}`);
  context.assert(includesAny(source, [`customElements.define('${tag}'`, `customElements.define("${tag}"`]), `${tag} registers its Custom Element`);
  context.assert(source.includes('attachShadow({ mode: "open" })') || source.includes("attachShadow({ mode: 'open' })"), `${tag} creates open shadow DOM`);
  context.assert(source.includes('xtendLayoutDisplayMediaUxProfile'), `${tag} exposes Layout Display Media UX profile`);
  context.assert(source.includes('xtendScaffoldPerformanceProfile'), `${tag} exposes performance profile`);
  context.assert(source.includes('xtendScaffoldA11yProfile'), `${tag} exposes a11y profile`);
  context.assert(source.includes('snapshot()'), `${tag} exposes snapshot command`);
  context.assert(source.includes(config.event), `${tag} exposes ${config.event}`);
  context.assert(source.includes(config.stateKey.replace('<id>', '${this.id}')) || source.includes(config.stateKey), `${tag} source declares ${config.stateKey}`);
  context.assert(source.includes('prefers-reduced-motion'), `${tag} is reduced-motion safe`);
  context.assert(source.includes('forced-colors'), `${tag} is forced-colors safe`);
  context.assert(fixture.includes(`<${tag}`), `${tag} fixture contains the component tag`);
  context.assert(fixture.includes(`/components/${config.fileName}`), `${tag} fixture loads repo-local component`);
  context.assert(fixture.includes('window.xstate'), `${tag} fixture stubs xstate`);
  config.attributes.forEach((attribute) => context.assert(fixture.includes(attribute), `${tag} fixture covers ${attribute}`));
  context.assert(docs.includes(`# ${tag}`), `${tag} documentation is present`);
  context.assert(docs.includes('xtend-loader.js'), `${tag} docs describe loader integration`);
  context.assert(docs.includes('components/manifest.json'), `${tag} docs reference the component manifest`);
  context.assert(types.includes('XtendLayoutDisplayMediaUxProfile'), `${tag} public types import Layout Display Media UX profile`);
  context.assert(types.includes('LayoutDisplayMediaUxProfile'), `${tag} public types export Layout Display Media profile alias`);
  if (tag === 'x-header') {
    context.assert(source.includes('inline-size: 100%;') && source.includes('min-inline-size: 0;'), 'x-header inner grid fills its host without intrinsic flex shrinkage');
    context.assert(source.includes('fixed-full-width-overlay'), 'x-header declares fixed full-width drawer mode');
    context.assert(source.includes('position: fixed'), 'x-header drawer is removed from document layout flow');
    context.assert(source.includes('_positionDrawer()'), 'x-header keeps the fixed drawer aligned to the header');
    context.assert(source.includes('XHEADER_MENU_MODES'), 'x-header declares menu presentation mode registry');
    context.assert(source.includes("'drawer', 'side-panel', 'popover', 'fullscreen', 'inline-main'"), 'x-header supports all required menu modes');
    context.assert(source.includes('menu-before-open') && source.includes('menu-before-close'), 'x-header emits cancellable menu lifecycle events');
    context.assert(source.includes('_trapMenuFocus(event)'), 'x-header supports modal focus trap paths');
    context.assert(source.includes('part="menu drawer nav"'), 'x-header exposes menu and legacy drawer parts');
    context.assert(source.includes('part="menu-surface drawer-surface nav"'), 'x-header exposes menu-surface and legacy drawer-surface parts');
    context.assert(source.includes('part="menu-content nav"'), 'x-header exposes menu-content part');
    context.assert(source.includes('part="backdrop"'), 'x-header exposes backdrop part');
    context.assert(source.includes('fixed-responsive-slot-grid'), 'x-header declares a fixed responsive slot alignment strategy');
    context.assert(source.includes('--header-mobile-slot-template-areas'), 'x-header exposes mobile slot-template customization tokens');
    context.assert(source.includes('"brand actions trigger" "search search search"'), 'x-header keeps actions in the mobile header row by default');
    context.assert(source.includes('overflow-wrap: anywhere'), 'x-header drawer navigation wraps long labels inside containers');
    context.assert(source.includes('.drawer-inner ::slotted([data-menu-shell])'), 'x-header supports complex slotted navigation shells');
    context.assert(types.includes('XHeaderSlotAlignment'), 'x-header types expose slot alignment snapshot metadata');
    context.assert(types.includes('XHeaderMenuMode'), 'x-header types expose menu mode union');
    context.assert(types.includes('XHeaderMenuPlacement'), 'x-header types expose menu placement union');
    context.assert(types.includes("slotAlignment: XHeaderSlotAlignment"), 'x-header snapshot types include slot alignment');
    context.assert(types.includes("menuMode: XHeaderMenuMode"), 'x-header snapshot types include menuMode');
    context.assert(types.includes("menuPlacement: XHeaderMenuPlacement"), 'x-header snapshot types include menuPlacement');
    context.assert(types.includes("menuModal: boolean"), 'x-header snapshot types include menuModal');
    context.assert(types.includes("drawerMode: 'fixed-full-width-overlay'"), 'x-header types expose drawer mode snapshot');
  }
  if (tag === 'x-section') {
    context.assert(source.includes('.container {') && source.includes('overflow: visible;'), 'x-section column content does not become a clipping scroll container');
    context.assert(/:host\(\[layout="row"\]\) \.container \{[\s\S]*?overflow-x: auto;/u.test(source), 'x-section keeps horizontal scrolling scoped to row layout');
  }
  if (tag === 'x-hero') {
    context.assert(source.includes('max-width: 100%;'), 'x-hero constrains itself to the host viewport width');
    context.assert(source.includes('overflow-wrap: anywhere'), 'x-hero wraps long slotted hero content inside narrow containers');
    context.assert(!source.includes('.hero { width: 100vw; max-width: 100vw; }'), 'x-hero avoids viewport-width overflow inside padded or margined hosts');
  }
  if (tag === 'x-code') {
    const prismRmtSource = readText('components/prism-rmt.js', rootDir);
    const prismRmtTypes = readText('components/prism-rmt.d.ts', rootDir);
    const prismRmtSyntax = syntaxCheckFile('components/prism-rmt.js', { rootDir, extension: '.js' });
    const fakePrism = {
      languages: {},
      highlight(code, grammar, language) {
        return `<span class="token ${language}">${code}</span>`;
      }
    };
    const sandbox = { window: { Prism: fakePrism } };
    vm.runInNewContext(prismRmtSource, sandbox, { filename: 'components/prism-rmt.js' });
    const rmtPrism = sandbox.window.XTendRmtPrism;
    const rmtHighlighter = rmtPrism && rmtPrism.createHighlighter(fakePrism);
    const rmtHighlightResult = rmtHighlighter && rmtHighlighter.highlight({
      code: 'template docs.demo { state app.ready type boolean initial true }',
      language: 'rmt'
    });

    const constructorMatch = source.match(/constructor\(\)\s*\{[\s\S]*?\n  \}/u);
    const constructorSource = constructorMatch ? constructorMatch[0] : '';
    context.assert(!constructorSource.includes('this._render()'), 'x-code constructor avoids Light DOM mutation before Custom Element upgrade completes');
    context.assert(source.includes('if (!this.isConnected) return;'), 'x-code defers attribute-triggered render until connected');
    context.assert(source.includes('hydrate()'), 'x-code exposes public hydrate for dynamic route content');
    context.assert(source.includes("return ['lang', 'language'];"), 'x-code observes lang and language attributes');
    context.assert(source.includes('registerHighlighter(provider)'), 'x-code exposes registerHighlighter');
    context.assert(source.includes('escapeHtml(result.html)'), 'x-code escapes untrusted custom highlighter HTML');
    context.assert(source.includes('trustedHtml: true'), 'x-code marks built-in Prism output as trusted HTML');
    context.assert(types.includes('text?: string'), 'x-code types expose plain-text highlighter output');
    context.assert(types.includes('trustedHtml?: boolean'), 'x-code types expose explicit trusted highlighter marker');
    context.assert(!docs.includes('{ html: code, highlighted: false'), 'x-code docs avoid returning raw code from custom highlighters');
    context.assert(docs.includes('text: code'), 'x-code docs return plain text from custom highlighters');
    context.assert(source.includes('XTendRmtPrism'), 'x-code auto-connects the RMT Prism middleware');
    context.assert(source.includes('highlightLanguage'), 'x-code snapshots highlight language');
    context.assert(source.includes('languageAlias'), 'x-code snapshots language alias');
    context.assert(source.includes('.token.rmt-primitive'), 'x-code styles RMT Prism primitive tokens inside shadow DOM');
    context.assert(types.includes("export type XCodeAttributeName = 'lang' | 'language'"), 'x-code types expose language alias');
    context.assert(types.includes('XCodeHighlighter'), 'x-code types expose highlighter bridge');
    context.assert(types.includes('highlightLanguage: string'), 'x-code types expose highlight snapshot language');
    context.assert(prismRmtSyntax.ok, `RMT Prism middleware syntax passes${prismRmtSyntax.ok ? '' : ` (${prismRmtSyntax.message})`}`);
    context.assert(prismRmtSource.includes('xtend.rmt.prism-middleware.v1'), 'RMT Prism middleware declares schema');
    context.assert(prismRmtSource.includes("prism.languages['rmt-vnext']"), 'RMT Prism middleware registers rmt-vnext alias');
    context.assert(prismRmtSource.includes('Prism.languages.xtendrmt') || prismRmtSource.includes('prism.languages.xtendrmt'), 'RMT Prism middleware registers xtendrmt alias');
    context.assert(prismRmtSource.includes('trust\\s+boundary'), 'RMT Prism middleware highlights trust boundary');
    context.assert(prismRmtSource.includes('remote\\s+surface'), 'RMT Prism middleware highlights remote surface');
    context.assert(prismRmtTypes.includes('XtendRmtPrismApi'), 'RMT Prism types expose public API');
    context.assert(rmtPrism && rmtPrism.register(fakePrism) === true, 'RMT Prism middleware registers against Prism');
    context.assert(fakePrism.languages.rmt && fakePrism.languages['rmt-vnext'] === fakePrism.languages.rmt, 'RMT Prism middleware wires aliases to rmt grammar');
    context.assert(rmtHighlightResult && rmtHighlightResult.highlighted === true && rmtHighlightResult.language === 'rmt', 'RMT Prism highlighter highlights rmt source');
  }

  return context.result({ tag });
}

function printLayoutDisplayMediaComponentReport(result) {
  printSuiteReport(result, {
    successTitle: `${result.label} erfolgreich.`,
    failureTitle: `${result.label} fehlgeschlagen:`
  });
}

module.exports = {
  layoutDisplayMediaComponentConfigs,
  printLayoutDisplayMediaComponentReport,
  runLayoutDisplayMediaComponentSuite
};

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
    attributes: ['lang']
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
  context.assert(docs.includes(`# ${tag.replace('-', '')}`), `${tag} documentation is present`);
  context.assert(docs.includes('xtend.component.layout-display-media-ux-profile.v1'), `${tag} docs describe Layout Display Media UX profile`);
  context.assert(types.includes('XtendLayoutDisplayMediaUxProfile'), `${tag} public types import Layout Display Media UX profile`);
  context.assert(types.includes('LayoutDisplayMediaUxProfile'), `${tag} public types export Layout Display Media profile alias`);
  if (tag === 'x-header') {
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
    context.assert(docs.includes('Full-Width-Drawer'), 'x-header docs describe full-width drawer behavior');
    context.assert(docs.includes('Menu Presentation Modes'), 'x-header docs describe menu presentation modes');
    context.assert(['`drawer`', '`side-panel`', '`popover`', '`fullscreen`', '`inline-main`'].every((mode) => docs.includes(mode)), 'x-header docs list required menu modes');
    context.assert(docs.includes('Slot Alignment'), 'x-header docs describe fixed responsive slot alignment');
    context.assert(docs.includes('Overflow-sichere Navigation'), 'x-header docs describe overflow-safe drawer navigation');
    context.assert(types.includes('XHeaderSlotAlignment'), 'x-header types expose slot alignment snapshot metadata');
    context.assert(types.includes('XHeaderMenuMode'), 'x-header types expose menu mode union');
    context.assert(types.includes('XHeaderMenuPlacement'), 'x-header types expose menu placement union');
    context.assert(types.includes("slotAlignment: XHeaderSlotAlignment"), 'x-header snapshot types include slot alignment');
    context.assert(types.includes("menuMode: XHeaderMenuMode"), 'x-header snapshot types include menuMode');
    context.assert(types.includes("menuPlacement: XHeaderMenuPlacement"), 'x-header snapshot types include menuPlacement');
    context.assert(types.includes("menuModal: boolean"), 'x-header snapshot types include menuModal');
    context.assert(types.includes("drawerMode: 'fixed-full-width-overlay'"), 'x-header types expose drawer mode snapshot');
  }
  if (tag === 'x-hero') {
    context.assert(source.includes('max-width: 100%;'), 'x-hero constrains itself to the host viewport width');
    context.assert(source.includes('overflow-wrap: anywhere'), 'x-hero wraps long slotted hero content inside narrow containers');
    context.assert(!source.includes('.hero { width: 100vw; max-width: 100vw; }'), 'x-hero avoids viewport-width overflow inside padded or margined hosts');
    context.assert(docs.includes('Viewport-Sicherheit'), 'x-hero docs describe viewport-safe mobile layout');
  }
  if (tag === 'x-code') {
    const constructorMatch = source.match(/constructor\(\)\s*\{[\s\S]*?\n  \}/u);
    const constructorSource = constructorMatch ? constructorMatch[0] : '';
    context.assert(!constructorSource.includes('this._render()'), 'x-code constructor avoids Light DOM mutation before Custom Element upgrade completes');
    context.assert(source.includes('if (!this.isConnected) return;'), 'x-code defers attribute-triggered render until connected');
    context.assert(source.includes('hydrate()'), 'x-code exposes public hydrate for dynamic route content');
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

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MENU_PATH = path.join(ROOT, 'docs/menu.json');
const NAVIGATION_PATH = path.join(ROOT, 'docs/navigation.json');

const COMPONENT_SECTIONS = Object.freeze({
  'components-xbutton': 'forms',
  'components-xcalendar': 'forms',
  'components-xcheckbox': 'forms',
  'components-xform': 'forms',
  'components-xinput': 'forms',
  'components-xradio': 'forms',
  'components-xselect': 'forms',
  'components-xtextarea': 'forms',
  'components-xtoggle': 'forms',
  'components-xfooter': 'navigation',
  'components-xheader': 'navigation',
  'components-xlink': 'navigation',
  'components-xmenu': 'navigation',
  'components-xrouter': 'navigation',
  'components-xtabs': 'navigation',
  'components-xalert': 'feedback-overlays',
  'components-xdialog': 'feedback-overlays',
  'components-xdrawer': 'feedback-overlays',
  'components-xlightbox': 'feedback-overlays',
  'components-xmodal': 'feedback-overlays',
  'components-xpopover': 'feedback-overlays',
  'components-xprogress': 'feedback-overlays',
  'components-xspinner': 'feedback-overlays',
  'components-xstatus': 'feedback-overlays',
  'components-xtoast': 'feedback-overlays',
  'components-xtooltip': 'feedback-overlays',
  'components-xcards': 'layout-surfaces',
  'components-xhero': 'layout-surfaces',
  'components-xmasonry': 'layout-surfaces',
  'components-xsection': 'layout-surfaces',
  'components-xsidepanel': 'layout-surfaces',
  'components-xsurfacemanager': 'layout-surfaces',
  'components-xsurfaceportal': 'layout-surfaces',
  'components-xsurfaceregion': 'layout-surfaces',
  'components-xsurfacewindow': 'layout-surfaces',
  'components-xcode': 'data-media',
  'components-xicon': 'data-media',
  'components-xplayer': 'data-media',
  'components-xsummary': 'data-media',
  'components-xtype': 'data-media',
  'components-xwriter': 'data-media'
});

const CURATED_KEYWORDS = Object.freeze({
  'xtend-classic': {
    de: ['XTend Classic', 'buildless', 'HTML-first', 'Manifest', 'xtend-loader'],
    en: ['XTend Classic', 'buildless', 'HTML-first', 'manifest', 'xtend-loader']
  },
  'xtend-dev-surface': {
    de: ['DevTools', 'Debugging', 'Diagnose', 'Gates', 'Kernel Monitor', 'Fabric', 'Chromium'],
    en: ['DevTools', 'debugging', 'diagnostics', 'gates', 'kernel monitor', 'Fabric', 'Chromium']
  },
  'xtend-dev-api': {
    de: ['__XTEND_DEV_API__', 'Instrumentierung', 'Telemetrie', 'Diagnostics', 'Snapshots', 'Performance', 'Hydration', 'Kernel', 'Fabric', 'DevTools'],
    en: ['__XTEND_DEV_API__', 'instrumentation', 'telemetry', 'diagnostics', 'snapshots', 'performance', 'hydration', 'kernel', 'Fabric', 'DevTools']
  },
  'hydration-policies': {
    de: ['Hydrierung', 'Hydration', 'Resume', 'SSR', 'Insel', 'XScaler', 'Prewarm', 'runtime_render', 'hydrate_prerendered', 'server_prerender_hydrate', 'server_prerender_resume', 'worker_prerender_hydrate', 'visible', 'idle', 'lazy', 'Backpressure'],
    en: ['hydration', 'resume', 'SSR', 'island', 'XScaler', 'prewarm', 'runtime_render', 'hydrate_prerendered', 'server_prerender_hydrate', 'server_prerender_resume', 'worker_prerender_hydrate', 'visible', 'idle', 'lazy', 'backpressure']
  },
  'rmt-animation-engine': {
    de: ['Animation', 'Transition', 'Effekte', 'Keyframes', 'Spring', 'Reduced Motion'],
    en: ['animation', 'transition', 'effects', 'keyframes', 'spring', 'reduced motion']
  },
  'xtend-maraca': {
    de: ['Build', 'Bundling', 'Rollup', 'Terser', 'AOT', 'Tune'],
    en: ['build', 'bundling', 'Rollup', 'Terser', 'AOT', 'tune']
  },
  'xtend-mcp': {
    de: ['XTend MCP', 'Model Context Protocol', 'AI Knowledge Kit', 'VS Code', 'RAG', 'stdio', 'Streamable HTTP'],
    en: ['XTend MCP', 'Model Context Protocol', 'AI Knowledge Kit', 'VS Code', 'RAG', 'stdio', 'Streamable HTTP']
  },
  'rmt-vnext-remote-surfaces': {
    de: ['Microfrontend', 'MFE', 'Remote Surface', 'XScaler'],
    en: ['microfrontend', 'MFE', 'remote surface', 'XScaler']
  },
  'performance': {
    de: ['Performance', 'FCP', 'CLS', 'Budget', 'Messung', 'Telemetry'],
    en: ['performance', 'FCP', 'CLS', 'budget', 'measurement', 'telemetry']
  },
  'trusted-dom-sanitizing': {
    de: ['Trusted DOM', 'Sanitizing', 'XSS', 'Sicherheit'],
    en: ['trusted DOM', 'sanitizing', 'XSS', 'security']
  }
});

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function stableUnique(values) {
  const seen = new Set();
  return values.filter((value) => {
    const normalized = String(value || '').trim();
    const key = normalized.toLocaleLowerCase('en');
    if (!normalized || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function classifyStart(slug) {
  if (slug === 'readme' || slug === 'about') return ['start', 'orientation'];
  if (slug === 'changelog') return ['start', 'changes'];
  if (slug === 'best-practices' || slug === 'enterprise-adoption') return ['start', 'adoption'];
  return ['start', 'first-app'];
}

function classifyLearnRmt(slug) {
  if (slug === 'learn-rmt') return ['learn-rmt', 'orientation'];
  if (slug.includes('syntax') || slug.includes('templates')) return ['learn-rmt', 'syntax'];
  if (slug.includes('state') || slug.includes('data') || slug.includes('actions')) return ['learn-rmt', 'state-data'];
  if (slug.includes('scheduling') || slug.includes('security') || slug.includes('release-gates')) return ['learn-rmt', 'runtime'];
  return ['learn-rmt', 'practice'];
}

function classifyRmt(slug) {
  if (/remote-surfaces|surface-registry|cross-surface|xscaler/.test(slug)) return ['build', 'surfaces'];
  if (/linter|language-server|tooling|source-to-sea|release-gate|mcp/.test(slug)) return ['build', 'rmt-tooling'];
  if (/authoring|animation|migration|first-|demo-app|app-platform-fixture|native-authoring/.test(slug)) return ['build', 'rmt-authoring'];
  return ['build', 'rmt-runtime'];
}

function classifyCore(slug) {
  if (/release|evidence|package-export-lock/.test(slug)) return ['operate', 'release'];
  if (/xtensions|fabric/.test(slug)) return ['build', slug.includes('xtensions') ? 'xtensions' : 'rmt-runtime'];
  if (slug === 'design-tokens') return ['reference', 'design-system'];
  if (/types|typescript|type-exports|public-component/.test(slug)) return ['reference', 'types'];
  return ['reference', 'core-api'];
}

function classifyComponent(slug) {
  if (slug === 'components' || slug === 'component-long-tail-migration') return ['components', 'runtime-utilities'];
  if (COMPONENT_SECTIONS[slug]) return ['components', COMPONENT_SECTIONS[slug]];
  return ['components', 'runtime-utilities'];
}

function classify(entry) {
  if (entry.group === 'start') return classifyStart(entry.slug);
  if (entry.group === 'learn-rmt') return classifyLearnRmt(entry.slug);
  if (entry.group === 'rmt-reference') return ['reference', 'rmt-language'];
  if (entry.group === 'rmt') return classifyRmt(entry.slug);
  if (entry.group === 'maraca') return ['build', 'maraca'];
  if (entry.group === 'core') return classifyCore(entry.slug);
  if (entry.group === 'components') return classifyComponent(entry.slug);
  if (entry.group === 'surface') return ['build', 'surfaces'];
  if (entry.group === 'security') return ['operate', 'security'];
  if (entry.slug === 'xtend-dev-surface' || entry.slug === 'xtend-dev-api') return ['operate', 'devtools'];
  if (/a11y|screenreader|motion-contrast/.test(entry.slug)) return ['operate', 'accessibility'];
  return ['operate', 'performance'];
}

function keywordsFor(entry, locale, trunk, section) {
  const label = entry.labels && entry.labels[locale] || entry.label || entry.slug;
  const aliases = Array.isArray(entry.aliases) ? entry.aliases : [];
  const slugWords = entry.slug.split('-').filter((word) => word.length > 2);
  const curated = CURATED_KEYWORDS[entry.slug] && CURATED_KEYWORDS[entry.slug][locale] || [];
  const shared = [label, ...slugWords, ...aliases, entry.contentType, trunk, section];
  if (entry.group === 'rmt' || entry.group === 'rmt-reference' || entry.group === 'learn-rmt') shared.push('RMT');
  if (entry.group === 'components') shared.push('Web Component', 'Custom Element');
  if (entry.group === 'quality') shared.push(locale === 'de' ? 'Qualität' : 'quality');
  return stableUnique(shared.concat(curated));
}

function validateNavigation(navigation) {
  if (!navigation || navigation.schema !== 'xtend.docs.navigation.v1') throw new Error('Invalid docs navigation schema.');
  const ids = new Set();
  const sectionIds = new Set();
  navigation.trunks.forEach((trunk) => {
    if (ids.has(trunk.id)) throw new Error(`Duplicate navigation trunk: ${trunk.id}`);
    ids.add(trunk.id);
    trunk.sections.forEach((section) => sectionIds.add(`${trunk.id}:${section.id}`));
  });
  return { ids, sectionIds };
}

function buildMenu() {
  const menu = readJson(MENU_PATH);
  const navigation = readJson(NAVIGATION_PATH);
  const contract = validateNavigation(navigation);
  const slugs = new Set();
  const result = menu.map((entry) => {
    if (slugs.has(entry.slug)) throw new Error(`Duplicate docs slug: ${entry.slug}`);
    slugs.add(entry.slug);
    const [trunk, section] = classify(entry);
    if (!contract.ids.has(trunk) || !contract.sectionIds.has(`${trunk}:${section}`)) {
      throw new Error(`Unknown navigation target for ${entry.slug}: ${trunk}/${section}`);
    }
    return {
      ...entry,
      trunk,
      section,
      keywords: {
        de: keywordsFor(entry, 'de', trunk, section),
        en: keywordsFor(entry, 'en', trunk, section)
      }
    };
  });
  if (result.length !== 173) throw new Error(`Expected 173 canonical docs entries, received ${result.length}.`);
  return result;
}

function main() {
  const mode = process.argv.includes('--write') ? 'write' : 'check';
  const expected = `${JSON.stringify(buildMenu(), null, 2)}\n`;
  const current = fs.readFileSync(MENU_PATH, 'utf8');
  if (mode === 'write') {
    fs.writeFileSync(MENU_PATH, expected);
    process.stdout.write('docs/menu.json updated\n');
    return;
  }
  if (current !== expected) {
    process.stderr.write('docs/menu.json is out of date; run build_docs_navigation.js --write\n');
    process.exitCode = 1;
    return;
  }
  process.stdout.write('docs navigation metadata ok\n');
}

main();

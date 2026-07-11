'use strict';

const DOCS_CONTENT_TYPES = Object.freeze([
  'orientation',
  'tutorial',
  'concept',
  'reference',
  'operations',
  'component'
]);

const DOCS_CONTENT_PROFILES = Object.freeze({
  orientation: Object.freeze({
    minNonCodeChars: 500,
    minH2Count: 3,
    minCodeBlocks: 0,
    minCommands: 0,
    minConcreteAnchors: 1,
    minLinks: 2
  }),
  tutorial: Object.freeze({
    minNonCodeChars: 700,
    minH2Count: 4,
    minCodeBlocks: 1,
    minCommands: 0,
    minConcreteAnchors: 2,
    minLinks: 1
  }),
  concept: Object.freeze({
    minNonCodeChars: 600,
    minH2Count: 3,
    minCodeBlocks: 0,
    minCommands: 0,
    minConcreteAnchors: 2,
    minLinks: 1
  }),
  reference: Object.freeze({
    minNonCodeChars: 500,
    minH2Count: 3,
    minCodeBlocks: 1,
    minCommands: 0,
    minConcreteAnchors: 3,
    minLinks: 1
  }),
  operations: Object.freeze({
    minNonCodeChars: 500,
    minH2Count: 3,
    minCodeBlocks: 1,
    minCommands: 1,
    minConcreteAnchors: 2,
    minLinks: 1
  }),
  component: Object.freeze({
    minNonCodeChars: 900,
    minH2Count: 7,
    minCodeBlocks: 2,
    minCommands: 0,
    minConcreteAnchors: 3,
    minLinks: 2
  })
});

const CONTENT_TYPE_OVERRIDES = Object.freeze({
  readme: 'orientation',
  'quick-start-guide': 'tutorial',
  about: 'orientation',
  'best-practices': 'concept',
  'enterprise-adoption': 'concept',
  changelog: 'reference',
  'native-first-authoring-guide': 'tutorial',
  'native-first-rmt-recipes': 'tutorial',
  'native-first-release-review': 'operations',
  'native-first-migration-guide': 'tutorial',
  'rmt-tooling-release-gates': 'operations',
  'learn-rmt': 'orientation',
  'xtend-maraca': 'tutorial',
  'xtend-maraca-orchestration': 'concept',
  manifest: 'reference',
  api: 'reference',
  'xtend-loader': 'tutorial',
  components: 'orientation',
  'component-long-tail-migration': 'operations',
  'design-tokens': 'reference',
  'typescript-components': 'tutorial',
  'type-exports': 'reference',
  'package-export-lock': 'operations',
  performance: 'operations',
  'hydration-policies': 'operations',
  'a11y-keyboard-smokes': 'operations',
  'screenreader-signals': 'operations',
  'motion-contrast': 'operations',
  'visual-browser-regression': 'operations',
  'visual-snapshot-automation': 'operations',
  'trusted-dom-sanitizing': 'concept',
  'trusted-dom-boundary-browser-proof': 'operations',
  'manifest-import-policy': 'operations',
  'supply-chain-gates': 'operations',
  'rmt-linter': 'tutorial',
  'rmt-language-server': 'tutorial',
  'rmt-app-platform-tooling': 'tutorial',
  'rmt-vnext-authoring': 'tutorial',
  'rmt-animation-engine': 'tutorial',
  'xtendrmt-native-authoring': 'tutorial',
  'rmt-app-platform-authoring': 'tutorial',
  'rmt-app-platform-migration-guide': 'tutorial',
  'surface-manager-authoring-guide': 'tutorial',
  'surface-manager-migration-guide': 'tutorial',
  'surface-manager-workbench-fixture': 'tutorial',
  'surface-manager-quality-gates': 'operations',
  'rmt-reference': 'orientation',
  'release-verification': 'operations',
  'xtend-dev-surface': 'tutorial',
  'xtensions-authoring-guide': 'tutorial',
  'xtensions-migration-coexistence-guide': 'concept',
  'xtensions-security-checklist': 'operations'
});

function inferDocsContentType(entry = {}) {
  const slug = String(entry.slug || '');
  if (CONTENT_TYPE_OVERRIDES[slug]) return CONTENT_TYPE_OVERRIDES[slug];
  if (entry.tier === 'component-reference' || slug.startsWith('components-')) return 'component';
  if (entry.group === 'learn-rmt') return 'tutorial';
  if (entry.group === 'rmt-reference') return 'reference';
  if (entry.group === 'quality' || entry.group === 'security') return 'operations';
  if (/migration|authoring|fixture|playground|first-demo|first-xtend/i.test(slug)) return 'tutorial';
  if (/gate|quality|acceptance|readiness|evidence|release-review/i.test(slug)) return 'operations';
  if (/types?$|catalog|reference|api|manifest/i.test(slug)) return 'reference';
  if (entry.group === 'start') return 'orientation';
  return 'concept';
}

function isDocsContentType(value) {
  return DOCS_CONTENT_TYPES.includes(String(value || ''));
}

function profileForContentType(value) {
  return DOCS_CONTENT_PROFILES[value] || DOCS_CONTENT_PROFILES.concept;
}

module.exports = {
  CONTENT_TYPE_OVERRIDES,
  DOCS_CONTENT_PROFILES,
  DOCS_CONTENT_TYPES,
  inferDocsContentType,
  isDocsContentType,
  profileForContentType
};

const SCAFFOLD_LAYOUT = [
  {
    id: 'root',
    path: 'xtend-builder/',
    kind: 'workspace',
    owner: 'WP-E03-02',
    purpose: 'Contains the XTend-Scaffold build-environment modules and local entry points.'
  },
  {
    id: 'config',
    path: 'xtend-builder/scaffold.config.js',
    kind: 'config',
    owner: 'WP-E03-01',
    purpose: 'Central scaffold configuration for artifact paths, profiles, tooling and test obligation.'
  },
  {
    id: 'cli',
    path: 'xtend-builder/scaffold.js',
    kind: 'entry-point',
    owner: 'WP-E03-02',
    purpose: 'Local Node/CommonJS CLI entry point for scaffold help, layout and future generator commands.'
  },
  {
    id: 'cli-module',
    path: 'xtend-builder/lib/cli.js',
    kind: 'module',
    owner: 'WP-E03-02',
    purpose: 'CLI parser and command dispatcher without generator write behavior.'
  },
  {
    id: 'layout-contract',
    path: 'xtend-builder/lib/layout.js',
    kind: 'module',
    owner: 'WP-E03-02',
    purpose: 'Machine-readable project layout contract used by docs, CLI and reference gates.'
  },
  {
    id: 'generators',
    path: 'xtend-builder/generators/',
    kind: 'module-directory',
    owner: 'WP-E03-04',
    purpose: 'Future generator implementations. WP-02 only reserves the boundary.'
  },
  {
    id: 'blueprints',
    path: 'xtend-builder/blueprints/',
    kind: 'contract-directory',
    owner: 'WP-E03-03',
    purpose: 'Future component blueprint and artifact-contract definitions.'
  },
  {
    id: 'templates',
    path: 'xtend-builder/templates/',
    kind: 'template-directory',
    owner: 'WP-E03-04',
    purpose: 'Future file templates loaded by generators after blueprint approval.'
  },
  {
    id: 'wiring',
    path: 'xtend-builder/wiring/',
    kind: 'contract-directory',
    owner: 'WP-E03-06',
    purpose: 'Manifest and hydration wiring contracts used by dry-run component output.'
  },
  {
    id: 'typing',
    path: 'xtend-builder/typing/',
    kind: 'contract-directory',
    owner: 'WP-E03-09',
    purpose: 'Type contracts for scaffolded components and prepared XTendRMT adapter attachment.'
  },
  {
    id: 'preview',
    path: 'xtend-builder/preview/',
    kind: 'contract-directory',
    owner: 'WP-E03-10',
    purpose: 'Preview and reference-path contracts for scaffolded component demo plans.'
  },
  {
    id: 'extensions',
    path: 'xtend-builder/extensions/',
    kind: 'contract-directory',
    owner: 'WP-E03-11',
    purpose: 'Templating, rendering and root-lifecycle extension-point contracts for scaffolded components.'
  },
  {
    id: 'a11y',
    path: 'xtend-builder/a11y/',
    kind: 'contract-directory',
    owner: 'ER-WP-23',
    purpose: 'A11y profile plan contracts used by component blueprints, templates, fixtures and reference gates.'
  },
  {
    id: 'performance',
    path: 'xtend-builder/performance/',
    kind: 'contract-directory',
    owner: 'ER-WP-21',
    purpose: 'Performance profile plan contracts used by component blueprints, templates, manifests and reference gates.'
  },
  {
    id: 'workflows',
    path: 'xtend-builder/workflows/',
    kind: 'workflow-directory',
    owner: 'WP-E03-08',
    purpose: 'Local dry-run and verification workflow contracts for developers and AI agents.'
  },
  {
    id: 'writing',
    path: 'xtend-builder/writing/',
    kind: 'writer-directory',
    owner: 'WP-E17-03',
    purpose: 'Central WritePlan, structured patchers and controlled file-write helpers for productive Scaffold builds.'
  },
  {
    id: 'utils',
    path: 'xtend-builder/utils/',
    kind: 'helper-directory',
    owner: 'WP-E03-04',
    purpose: 'Future pure helpers for paths, validation, planning and conflict checks.'
  }
];

function cloneLayoutArea(area) {
  return {
    id: area.id,
    path: area.path,
    kind: area.kind,
    owner: area.owner,
    purpose: area.purpose
  };
}

function getScaffoldLayout() {
  return SCAFFOLD_LAYOUT.map(cloneLayoutArea);
}

function getLayoutArea(id) {
  const area = SCAFFOLD_LAYOUT.find((candidate) => candidate.id === id);
  return area ? cloneLayoutArea(area) : null;
}

function formatScaffoldLayout(layout = getScaffoldLayout()) {
  return layout
    .map((area) => `${area.id.padEnd(16)} ${area.path.padEnd(38)} ${area.kind}`)
    .join('\n');
}

module.exports = {
  SCAFFOLD_LAYOUT,
  formatScaffoldLayout,
  getLayoutArea,
  getScaffoldLayout
};

const TEMPLATE_REGISTRY_SCHEMA = 'xtend.scaffold.template-registry.v1';

const TEMPLATE_REGISTRY = [
  {
    id: 'component.source',
    artifact: 'component',
    path: 'xtend-builder/templates/component/source.template.js',
    status: 'implemented-WP-E03-07',
    purpose: 'Productive component source template for scaffold previews.'
  },
  {
    id: 'component.docs',
    artifact: 'docs',
    path: 'xtend-builder/templates/component/docs.template.md',
    status: 'implemented-WP-E03-07',
    purpose: 'Public component documentation template.'
  },
  {
    id: 'component.tests',
    artifact: 'tests',
    path: 'xtend-builder/templates/component/component-suite.template.js',
    status: 'implemented-WP-E03-07',
    purpose: 'Component-level test suite template with real assertions.'
  },
  {
    id: 'component.fixture',
    artifact: 'fixtures',
    path: 'xtend-builder/templates/component/fixture.template.html',
    status: 'implemented-WP-E03-07',
    purpose: 'Repo-local component fixture template.'
  },
  {
    id: 'component.types',
    artifact: 'types',
    path: 'xtend-builder/templates/component/types.template.d.ts',
    status: 'implemented-WP-E03-09',
    purpose: 'TypeScript public API and XTendRMT adapter attachment template.'
  },
  {
    id: 'component.manifest-plan',
    artifact: 'manifest',
    path: 'xtend-builder/templates/component/manifest-plan.template.json',
    status: 'implemented-WP-E03-07',
    purpose: 'Manifest patch-plan template.'
  },
  {
    id: 'component.demo-plan',
    artifact: 'demo',
    path: 'xtend-builder/templates/component/demo-plan.template.md',
    status: 'implemented-WP-E03-10',
    purpose: 'Preview reference-plan template for local reference-gate registration.'
  },
  {
    id: 'component.ts-source',
    artifact: 'ts-source',
    path: 'xtend-builder/templates/component/source.template.ts',
    status: 'implemented-WP-E10-07',
    purpose: 'TypeScript-first component source template with RMT, Fabric, A11y and Performance metadata.'
  },
  {
    id: 'component.ts-contract',
    artifact: 'ts-contract',
    path: 'xtend-builder/templates/component/contract.template.ts',
    status: 'implemented-WP-E10-07',
    purpose: 'Component Contract v2 source template.'
  },
  {
    id: 'component.ts-rmt',
    artifact: 'ts-rmt',
    path: 'xtend-builder/templates/component/rmt.template.ts',
    status: 'implemented-WP-E10-07',
    purpose: 'RMT component metadata template for xtend.component adapter authoring.'
  },
  {
    id: 'component.ts-a11y',
    artifact: 'ts-a11y',
    path: 'xtend-builder/templates/component/a11y.template.ts',
    status: 'implemented-WP-E10-07',
    purpose: 'Typed A11y profile template for new TypeScript components.'
  },
  {
    id: 'component.ts-performance',
    artifact: 'ts-performance',
    path: 'xtend-builder/templates/component/performance.template.ts',
    status: 'implemented-WP-E10-07',
    purpose: 'Typed Performance profile template for new TypeScript components.'
  },
  {
    id: 'component.ts-fixture',
    artifact: 'ts-fixture',
    path: 'xtend-builder/templates/component/fixture-data.template.ts',
    status: 'implemented-WP-E10-07',
    purpose: 'Typed fixture-data template for Component Lab, tests and RMT previews.'
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getTemplateRegistry() {
  return {
    schema: TEMPLATE_REGISTRY_SCHEMA,
    root: 'xtend-builder/templates/',
    templates: clone(TEMPLATE_REGISTRY)
  };
}

function getTemplateForArtifact(artifact) {
  const template = TEMPLATE_REGISTRY.find((entry) => entry.artifact === artifact);
  return template ? clone(template) : null;
}

module.exports = {
  TEMPLATE_REGISTRY,
  TEMPLATE_REGISTRY_SCHEMA,
  getTemplateForArtifact,
  getTemplateRegistry
};

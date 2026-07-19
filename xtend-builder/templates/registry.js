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
  },
  {
    id: 'app.rmt-owned-chat-shell',
    artifact: 'rmt-owned-chat-shell',
    path: 'xtend-builder/templates/app/rmt-owned-chat-shell.template.rmt',
    status: 'implemented-runtime-ownership',
    purpose: 'RMT-owned chat/app runtime shell with command, stream, dialog, transcript and datasource declarations.'
  },
  {
    id: 'app.rmt-owned-business-adapter',
    artifact: 'rmt-owned-business-adapter',
    path: 'xtend-builder/templates/app/rmt-owned-business-adapter.template.mjs',
    status: 'implemented-runtime-ownership',
    purpose: 'Business adapter stub for RMT-owned apps; intentionally contains no product UI DOM wiring.'
  },
  {
    id: 'app.services.typescript',
    artifact: 'app-services',
    path: 'xtend-builder/templates/app/app-services.template.ts',
    status: 'implemented-XMS-07',
    purpose: 'Typed browser-local and server-proxy AppServices entry without UI wiring.'
  },
  {
    id: 'app.services.node',
    artifact: 'server-services',
    path: 'xtend-builder/templates/app/server-services.template.ts',
    status: 'implemented-XMS-07',
    purpose: 'Node-only AppServices implementation entry.'
  },
  {
    id: 'app.services.php',
    artifact: 'php-server-services',
    path: 'xtend-builder/templates/app/server-services.template.php',
    status: 'implemented-XMS-07',
    purpose: 'PHP-native AppServices callable registry.'
  },
  {
    id: 'app.services.tsconfig',
    artifact: 'app-tsconfig',
    path: 'xtend-builder/templates/app/app-tsconfig.template.json',
    status: 'implemented-XMS-07',
    purpose: 'Strict TypeScript configuration for generated AppServices.'
  },
  {
    id: 'app.rmt.rmt',
    artifact: 'rmt-app-rmt',
    path: 'xtend-builder/templates/app/rmt-app.template.rmt',
    status: 'implemented-XMS-07',
    purpose: 'Provider-neutral declarative RMT app shell with an AppService demand.'
  },
  {
    id: 'app.rmt.css',
    artifact: 'rmt-app-css',
    path: 'xtend-builder/templates/app/rmt-app.template.css',
    status: 'implemented-XMS-07',
    purpose: 'Free-CSS entry for the provider-neutral Maraca base scaffold.'
  },
  {
    id: 'app.rmt.maraca-config',
    artifact: 'rmt-maraca-config',
    path: 'xtend-builder/templates/app/rmt-maraca-config.template.json',
    status: 'implemented-XMS-07',
    purpose: 'Native CSS and TypeScript AppServices configuration for the base scaffold.'
  },
  {
    id: 'app.rmt.package',
    artifact: 'rmt-package',
    path: 'xtend-builder/templates/app/rmt-package.template.json',
    status: 'implemented-XMS-07',
    purpose: 'Package and one-command build scripts for a provider-neutral Maraca app.'
  },
  {
    id: 'app.rmt.smoke',
    artifact: 'rmt-smoke',
    path: 'xtend-builder/templates/app/rmt-smoke.template.cjs',
    status: 'implemented-XMS-07',
    purpose: 'Dependency-free base-scaffold ownership and no-manual-wiring smoke.'
  },
  {
    id: 'app.rmt.browser-host',
    artifact: 'rmt-browser-host',
    path: 'xtend-builder/templates/app/rmt-browser-host.template.html',
    status: 'implemented-XMS-07',
    purpose: 'Auto-boot browser host for the provider-neutral Maraca bundle.'
  },
  {
    id: 'app.material.rmt',
    artifact: 'material-app-rmt',
    path: 'xtend-builder/templates/app/material-app.template.rmt',
    status: 'implemented-XTM-09',
    purpose: 'Declarative XTend Material App Shell and content starter for Maraca.'
  },
  {
    id: 'app.material.css',
    artifact: 'material-app-css',
    path: 'xtend-builder/templates/app/material-app.template.css',
    status: 'implemented-XTM-09',
    purpose: 'Local Material token/style entry with an explicit RMT source.'
  },
  {
    id: 'app.material.maraca-config',
    artifact: 'material-maraca-config',
    path: 'xtend-builder/templates/app/material-maraca-config.template.json',
    status: 'implemented-XTM-09',
    purpose: 'Air-gapped Maraca Tailwind build configuration with explicit sources.'
  },
  {
    id: 'app.material.package',
    artifact: 'material-package',
    path: 'xtend-builder/templates/app/material-package.template.json',
    status: 'implemented-XTM-09',
    purpose: 'Material app package manifest with local plan, build, tune and test scripts.'
  },
  {
    id: 'app.material.smoke',
    artifact: 'material-smoke',
    path: 'xtend-builder/templates/app/material-smoke.template.cjs',
    status: 'implemented-XTM-09',
    purpose: 'Dependency-free generated Material app contract smoke test.'
  },
  {
    id: 'app.material.browser-host',
    artifact: 'material-browser-host',
    path: 'xtend-builder/templates/app/material-browser-host.template.html',
    status: 'implemented-XTM-14',
    purpose: 'Generated browser host for the CLI-owned Maraca runtime bundle.'
  },
  {
    id: 'app.material.runtime-host',
    artifact: 'material-runtime-host',
    path: 'xtend-builder/templates/app/material-runtime-host.template.mjs',
    status: 'implemented-XTM-14',
    purpose: 'Generated bootstrap for strict Kernel-orchestrated Material apps.'
  },
  {
    id: 'app.material.dev-api',
    artifact: 'material-dev-api',
    path: 'xtend-builder/templates/app/material-dev-api.template.mjs',
    status: 'implemented-XTM-14',
    purpose: 'Complete synchronous XTend DEV API projection owned by the generated runtime host.'
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

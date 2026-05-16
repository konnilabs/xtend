const MANIFEST_WIRING_SCHEMA = 'xtend.scaffold.manifest-wiring.v1';
const MANIFEST_PATCH_PLAN_SCHEMA = 'xtend.scaffold.manifest-patch-plan.v1';

function createManifestWiring(input = {}) {
  const tag = String(input.tag || '').trim();
  const profiles = Array.isArray(input.profiles) ? input.profiles.slice() : [];
  const source = input.source || `components/${tag}.js`;

  return {
    schema: MANIFEST_WIRING_SCHEMA,
    ok: Boolean(tag),
    mode: 'dry-run',
    patchPlan: {
      schema: MANIFEST_PATCH_PLAN_SCHEMA,
      operation: 'add-component',
      tag,
      source,
      profiles,
      importMode: 'repo-local',
      loaderMode: 'custom-element',
      hydrationMode: 'custom-element',
      localImportOnly: true,
      cdnAllowed: false,
      requiresReview: true
    },
    localImport: {
      convention: 'repo-relative',
      source,
      cdnAllowed: false
    },
    loader: {
      target: 'components/manifest.json',
      compatibleWith: ['xtend-loader.js', 'customElements.define'],
      registration: 'custom-element'
    },
    reviewRules: [
      'Manifest patch output must be deterministic for identical scaffold input.',
      'Generated component imports must stay repo-local unless a later review explicitly allows another source.',
      'The manifest plan is reviewable in dry-run and applied through the structured manifest patcher in productive writes.'
    ]
  };
}

module.exports = {
  MANIFEST_PATCH_PLAN_SCHEMA,
  MANIFEST_WIRING_SCHEMA,
  createManifestWiring
};

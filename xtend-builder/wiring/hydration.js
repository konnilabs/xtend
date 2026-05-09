const {
  getClassNameFromTag
} = require('../utils/naming');

const HYDRATION_WIRING_SCHEMA = 'xtend.scaffold.hydration-wiring.v1';

function createHydrationWiring(input = {}) {
  const tag = String(input.tag || '').trim();
  const className = input.className || getClassNameFromTag(tag);
  const fixtureScriptPath = input.fixtureScriptPath || `../../../components/${tag}.js`;
  const fixtureResultObject = input.fixtureResultObject || `window.__${className}FixtureResult`;

  return {
    schema: HYDRATION_WIRING_SCHEMA,
    ok: Boolean(tag),
    mode: 'dry-run',
    component: {
      tag,
      className,
      stateAttribute: 'data-xtend-hydrated',
      lifecycleCallbacks: ['connectedCallback', 'attributeChangedCallback', 'disconnectedCallback'],
      minimumMethods: ['hydrate', 'render'],
      rehydrationTrigger: 'attributeChangedCallback'
    },
    fixture: {
      scriptPath: fixtureScriptPath,
      importMode: 'repo-local-script',
      resultObject: fixtureResultObject,
      resultObjectName: fixtureResultObject.replace(/^window\./, ''),
      cdnAllowed: false,
      requiredChecks: ['defined', 'hasElement', 'hasShadowRoot', 'hydrated']
    },
    reviewRules: [
      'connectedCallback must reach the same render path as later rehydration.',
      'attributeChangedCallback must be safe before and after initial connection.',
      'disconnectedCallback must release scaffold-owned hydration state.'
    ]
  };
}

module.exports = {
  HYDRATION_WIRING_SCHEMA,
  createHydrationWiring
};

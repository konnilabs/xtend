'use strict';

const MATERIAL_FLOW_RECIPE_REPORT_SCHEMA = 'xtend.material.flow-recipe-report.v1';

const FLOW_BREAKPOINTS = Object.freeze([
  { name: 'compact', query: '(max-width: 47.999rem)', layout: 'single-column', actions: 'full-width-or-wrapped' },
  { name: 'wide', query: '(min-width: 48rem)', layout: 'intrinsic-grid', actions: 'inline-end' }
]);

const BLOCKED_PARITY_CLAIMS = Object.freeze(['data-grid', 'autocomplete', 'command-palette']);
const COMPONENT_OWNED_STATES = Object.freeze(['validation', 'error', 'busy', 'disabled', 'success']);

function flowRecipe(input) {
  return Object.freeze({
    schema: 'xtend.material.recipe.v1',
    version: '1.0.0',
    status: 'flow',
    category: input.category,
    id: input.id,
    className: input.className,
    utilities: Object.freeze(input.utilities),
    tokens: Object.freeze(input.tokens),
    components: Object.freeze(input.components),
    slots: Object.freeze(input.slots),
    parts: Object.freeze(input.parts),
    composition: Object.freeze(input.composition),
    responsive: Object.freeze({
      strategy: 'intrinsic-first-with-container-enhancement',
      containerName: 'xtm-flow',
      breakpoints: FLOW_BREAKPOINTS,
      degradation: input.degradation
    }),
    accessibility: Object.freeze({
      semanticRole: input.semanticRole,
      landmarks: Object.freeze(input.landmarks),
      keyboard: Object.freeze(input.keyboard),
      focus: Object.freeze(input.focus),
      statusSemantics: Object.freeze({ nonColor: true, liveRegionsOwnedByComponents: true }),
      visibleFocus: true,
      reducedMotion: true,
      forcedColors: true
    }),
    behaviorOwnership: Object.freeze({
      owner: 'component-and-rmt',
      states: COMPONENT_OWNED_STATES,
      materialScope: 'layout-and-visual-composition-only'
    }),
    claims: Object.freeze({ blockedParity: BLOCKED_PARITY_CLAIMS }),
    fallback: Object.freeze({ provider: 'native-css', stylesheet: '@xtend-material/core/styles.css', className: input.className }),
    boundaries: Object.freeze({ shadowRootAccess: false, manualHostDomWiring: false, rawTailwindAuthoring: false })
  });
}

const SHARED_PAGE_TOKENS = ['--xtend-surface-page', '--xtend-surface-panel', '--xtend-text-primary', '--xtend-text-muted', '--xtend-border-subtle', '--xtend-density-spacing'];

const MATERIAL_FLOW_RECIPES = Object.freeze([
  flowRecipe({
    id: 'material.form-flow',
    className: 'xtm-form-flow',
    category: 'form',
    utilities: ['grid', 'w-full'],
    tokens: SHARED_PAGE_TOKENS,
    components: ['x-form', 'x-input', 'x-textarea', 'x-select', 'x-checkbox', 'x-radio', 'x-toggle', 'x-button', 'x-status'],
    slots: [
      { name: 'root', required: true, className: 'xtm-form-flow', semanticRole: 'form' },
      { name: 'header', required: false, semanticRole: 'group' },
      { name: 'fields', required: true, semanticRole: 'group' },
      { name: 'status', required: false, semanticRole: 'status' },
      { name: 'actions', required: true, semanticRole: 'group' }
    ],
    parts: ['root', 'header', 'fields', 'status', 'actions'],
    composition: [
      { component: 'x-form', slot: 'root', componentSlot: 'default', required: true },
      { component: 'x-input', slot: 'fields', componentSlot: 'label', required: false },
      { component: 'x-textarea', slot: 'fields', componentSlot: 'label', required: false },
      { component: 'x-select', slot: 'fields', componentSlot: 'label', required: false },
      { component: 'x-checkbox', slot: 'fields', componentSlot: 'label', required: false },
      { component: 'x-radio', slot: 'fields', componentSlot: 'label', required: false },
      { component: 'x-toggle', slot: 'fields', componentSlot: 'label', required: false },
      { component: 'x-status', slot: 'status', componentSlot: 'label', required: false },
      { component: 'x-button', slot: 'actions', componentSlot: 'default', required: true }
    ],
    semanticRole: 'form',
    landmarks: ['form'],
    keyboard: { order: ['header', 'fields', 'status', 'actions'], submit: 'x-form-and-rmt-validation', escape: 'component-owned' },
    focus: { initial: 'first-invalid-or-first-control', error: 'error-summary-then-invalid-control', success: 'confirmation-heading', restore: 'submit-control' },
    degradation: 'two-column-field-groups-collapse-to-one-readable-column'
  }),
  flowRecipe({
    id: 'material.feedback-stack',
    className: 'xtm-feedback-stack',
    category: 'feedback',
    utilities: ['flex', 'flex-col'],
    tokens: SHARED_PAGE_TOKENS,
    components: ['x-status', 'x-alert', 'x-progress', 'x-toast'],
    slots: [
      { name: 'root', required: true, className: 'xtm-feedback-stack', semanticRole: 'status' },
      { name: 'persistent', required: false, semanticRole: 'status' },
      { name: 'progress', required: false, semanticRole: 'progressbar' },
      { name: 'transient', required: false, semanticRole: 'status' }
    ],
    parts: ['root', 'persistent', 'progress', 'transient'],
    composition: [
      { component: 'x-status', slot: 'persistent', componentSlot: 'label', required: false },
      { component: 'x-alert', slot: 'persistent', required: false },
      { component: 'x-progress', slot: 'progress', componentSlot: 'label', required: false },
      { component: 'x-toast', slot: 'transient', componentSlot: 'default', required: false }
    ],
    semanticRole: 'status',
    landmarks: ['status'],
    keyboard: { order: ['persistent', 'progress', 'transient'], dismiss: 'component-owned' },
    focus: { initial: 'unchanged', error: 'component-announcement', success: 'unchanged', restore: 'unchanged' },
    degradation: 'feedback-remains-source-ordered-and-readable-without-positioning'
  }),
  flowRecipe({
    id: 'material.dashboard',
    className: 'xtm-dashboard',
    category: 'dashboard',
    utilities: ['grid', 'grid-cols-1'],
    tokens: SHARED_PAGE_TOKENS,
    components: ['x-cards', 'x-summary', 'x-status', 'x-progress'],
    slots: [
      { name: 'root', required: true, className: 'xtm-dashboard', semanticRole: 'region' },
      { name: 'summary', required: true, semanticRole: 'group' },
      { name: 'primary', required: true, semanticRole: 'region' },
      { name: 'secondary', required: false, semanticRole: 'region' }
    ],
    parts: ['root', 'summary', 'primary', 'secondary'],
    composition: [
      { component: 'x-cards', slot: 'primary', componentSlot: 'default', required: true },
      { component: 'x-summary', slot: 'summary', componentSlot: 'title', required: true },
      { component: 'x-status', slot: 'summary', componentSlot: 'label', required: false },
      { component: 'x-progress', slot: 'secondary', componentSlot: 'label', required: false }
    ],
    semanticRole: 'region',
    landmarks: ['region'],
    keyboard: { order: ['summary', 'primary', 'secondary'], navigation: 'document-order' },
    focus: { initial: 'dashboard-heading', error: 'feedback-region', success: 'unchanged', restore: 'originating-card' },
    degradation: 'metric-and-content-grid-collapses-to-source-ordered-cards'
  }),
  flowRecipe({
    id: 'material.content-page',
    className: 'xtm-content-page',
    category: 'content',
    utilities: ['grid', 'w-full'],
    tokens: SHARED_PAGE_TOKENS,
    components: ['x-cards', 'x-summary', 'x-status'],
    slots: [
      { name: 'root', required: true, className: 'xtm-content-page', semanticRole: 'article' },
      { name: 'header', required: true, semanticRole: 'group' },
      { name: 'body', required: true, semanticRole: 'article' },
      { name: 'aside', required: false, semanticRole: 'complementary' },
      { name: 'footer', required: false, semanticRole: 'contentinfo' }
    ],
    parts: ['root', 'header', 'body', 'aside', 'footer'],
    composition: [
      { component: 'x-summary', slot: 'body', componentSlot: 'title', required: false },
      { component: 'x-cards', slot: 'body', componentSlot: 'default', required: false },
      { component: 'x-status', slot: 'aside', componentSlot: 'label', required: false }
    ],
    semanticRole: 'article',
    landmarks: ['article', 'complementary'],
    keyboard: { order: ['header', 'body', 'aside', 'footer'], navigation: 'document-order' },
    focus: { initial: 'page-heading', error: 'inline-status', success: 'unchanged', restore: 'originating-link' },
    degradation: 'aside-moves-after-article-body-and-reading-order-is-preserved'
  }),
  flowRecipe({
    id: 'material.settings-page',
    className: 'xtm-settings-page',
    category: 'settings',
    utilities: ['grid', 'w-full'],
    tokens: SHARED_PAGE_TOKENS,
    components: ['x-form', 'x-input', 'x-select', 'x-checkbox', 'x-radio', 'x-toggle', 'x-button', 'x-status'],
    slots: [
      { name: 'root', required: true, className: 'xtm-settings-page', semanticRole: 'form' },
      { name: 'navigation', required: false, semanticRole: 'navigation' },
      { name: 'groups', required: true, semanticRole: 'group' },
      { name: 'status', required: false, semanticRole: 'status' },
      { name: 'actions', required: true, semanticRole: 'group' }
    ],
    parts: ['root', 'navigation', 'groups', 'status', 'actions'],
    composition: [
      { component: 'x-form', slot: 'root', componentSlot: 'default', required: true },
      { component: 'x-input', slot: 'groups', componentSlot: 'label', required: false },
      { component: 'x-select', slot: 'groups', componentSlot: 'label', required: false },
      { component: 'x-checkbox', slot: 'groups', componentSlot: 'label', required: false },
      { component: 'x-radio', slot: 'groups', componentSlot: 'label', required: false },
      { component: 'x-toggle', slot: 'groups', componentSlot: 'label', required: false },
      { component: 'x-status', slot: 'status', componentSlot: 'label', required: false },
      { component: 'x-button', slot: 'actions', componentSlot: 'default', required: true }
    ],
    semanticRole: 'form',
    landmarks: ['navigation', 'form'],
    keyboard: { order: ['navigation', 'groups', 'status', 'actions'], submit: 'x-form-and-rmt-validation' },
    focus: { initial: 'settings-heading', error: 'first-invalid-control', success: 'status-region', restore: 'save-control' },
    degradation: 'section-navigation-precedes-single-column-setting-groups'
  }),
  flowRecipe({
    id: 'material.empty-state',
    className: 'xtm-empty-state',
    category: 'content',
    utilities: ['flex', 'flex-col', 'items-center'],
    tokens: SHARED_PAGE_TOKENS,
    components: ['x-status', 'x-alert', 'x-button'],
    slots: [
      { name: 'root', required: true, className: 'xtm-empty-state', semanticRole: 'status' },
      { name: 'visual', required: false, semanticRole: 'presentation' },
      { name: 'message', required: true, semanticRole: 'status' },
      { name: 'actions', required: false, semanticRole: 'group' }
    ],
    parts: ['root', 'visual', 'message', 'actions'],
    composition: [
      { component: 'x-status', slot: 'message', componentSlot: 'label', required: true },
      { component: 'x-alert', slot: 'message', required: false },
      { component: 'x-button', slot: 'actions', componentSlot: 'default', required: false }
    ],
    semanticRole: 'status',
    landmarks: ['status'],
    keyboard: { order: ['message', 'actions'], activate: 'x-button-owned' },
    focus: { initial: 'empty-state-heading', error: 'message', success: 'unchanged', restore: 'originating-view' },
    degradation: 'centered-state-becomes-normal-flow-with-actions-wrapping'
  }),
  flowRecipe({
    id: 'material.confirmation-flow',
    className: 'xtm-confirmation-flow',
    category: 'overlay',
    utilities: ['flex', 'flex-col'],
    tokens: SHARED_PAGE_TOKENS,
    components: ['x-dialog', 'x-status', 'x-button', 'x-toast'],
    slots: [
      { name: 'root', required: true, className: 'xtm-confirmation-flow', semanticRole: 'dialog' },
      { name: 'header', required: true, semanticRole: 'heading' },
      { name: 'summary', required: true, semanticRole: 'document' },
      { name: 'status', required: false, semanticRole: 'status' },
      { name: 'actions', required: true, semanticRole: 'group' }
    ],
    parts: ['root', 'header', 'summary', 'status', 'actions'],
    composition: [
      { component: 'x-dialog', slot: 'root', required: true },
      { component: 'x-status', slot: 'status', componentSlot: 'label', required: false },
      { component: 'x-button', slot: 'actions', componentSlot: 'default', required: true },
      { component: 'x-toast', slot: 'status', componentSlot: 'default', required: false }
    ],
    semanticRole: 'dialog',
    landmarks: ['dialog'],
    keyboard: { order: ['header', 'summary', 'status', 'actions'], escape: 'x-dialog-owned', trap: 'x-dialog-owned' },
    focus: { initial: 'confirmation-heading-or-primary-action', error: 'status-region', success: 'status-region', restore: 'originating-submit-control' },
    degradation: 'dialog-surface-fits-viewport-and-actions-wrap-without-order-change'
  })
]);

function validateMaterialFlowRecipes(recipes = MATERIAL_FLOW_RECIPES, options = {}) {
  const errors = [];
  const knownComponents = options.knownComponents || new Set();
  const knownTokens = options.knownTokens || new Set();
  const ids = new Set();
  const classes = new Set();
  recipes.forEach((recipe) => {
    if (!/^material\.(?:form-flow|feedback-stack|dashboard|content-page|settings-page|empty-state|confirmation-flow)$/u.test(String(recipe.id || ''))) errors.push(`unsupported flow recipe ${recipe.id}`);
    if (ids.has(recipe.id)) errors.push(`duplicate flow recipe ${recipe.id}`);
    if (classes.has(recipe.className)) errors.push(`duplicate flow class ${recipe.className}`);
    ids.add(recipe.id);
    classes.add(recipe.className);
    if (!recipe.slots || !recipe.slots.some((slot) => slot.name === 'root' && slot.required)) errors.push(`${recipe.id} misses required root slot`);
    if (!recipe.parts || !recipe.parts.includes('root') || recipe.slots.some((slot) => !recipe.parts.includes(slot.name))) errors.push(`${recipe.id} has an unknown public slot`);
    if (!recipe.composition || recipe.composition.some((entry) => !recipe.components.includes(entry.component) || !recipe.slots.some((slot) => slot.name === entry.slot))) errors.push(`${recipe.id} has invalid component composition`);
    if (recipe.components.some((component) => knownComponents.size && !knownComponents.has(component))) errors.push(`${recipe.id} references missing component`);
    if (recipe.tokens.some((token) => knownTokens.size && !knownTokens.has(token))) errors.push(`${recipe.id} references unknown token`);
    if (!recipe.utilities.length || recipe.utilities.some((utility) => /[\[\]/:]/u.test(utility))) errors.push(`${recipe.id} contains free or unsafe utilities`);
    if (!recipe.responsive || recipe.responsive.breakpoints.length !== 2) errors.push(`${recipe.id} needs compact and wide behavior`);
    if (!recipe.accessibility || recipe.accessibility.statusSemantics.nonColor !== true || !recipe.accessibility.focus || !recipe.accessibility.keyboard) errors.push(`${recipe.id} has incomplete accessibility semantics`);
    if (!recipe.behaviorOwnership || recipe.behaviorOwnership.owner !== 'component-and-rmt' || COMPONENT_OWNED_STATES.some((state) => !recipe.behaviorOwnership.states.includes(state))) errors.push(`${recipe.id} takes ownership of component behavior`);
    if (!recipe.claims || BLOCKED_PARITY_CLAIMS.some((claim) => !recipe.claims.blockedParity.includes(claim))) errors.push(`${recipe.id} opens an unsupported parity claim`);
    if (!recipe.fallback || recipe.fallback.provider !== 'native-css') errors.push(`${recipe.id} misses native fallback`);
    if (!recipe.boundaries || recipe.boundaries.shadowRootAccess !== false || recipe.boundaries.manualHostDomWiring !== false || recipe.boundaries.rawTailwindAuthoring !== false) errors.push(`${recipe.id} opens an implementation boundary`);
  });
  return { schema: MATERIAL_FLOW_RECIPE_REPORT_SCHEMA, ok: errors.length === 0, status: errors.length === 0 ? 'accepted' : 'blocked', errors, recipeCount: recipes.length };
}

module.exports = {
  BLOCKED_PARITY_CLAIMS,
  COMPONENT_OWNED_STATES,
  FLOW_BREAKPOINTS,
  MATERIAL_FLOW_RECIPES,
  MATERIAL_FLOW_RECIPE_REPORT_SCHEMA,
  validateMaterialFlowRecipes
};

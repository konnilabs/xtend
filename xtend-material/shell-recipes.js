'use strict';

const MATERIAL_SHELL_RECIPE_REPORT_SCHEMA = 'xtend.material.shell-recipe-report.v1';

const BREAKPOINTS = Object.freeze([
  { name: 'mobile', query: '(max-width: 47.999rem)', layout: 'single-column-overlay-navigation', navigation: 'drawer', detail: 'overlay-or-route' },
  { name: 'tablet', query: '(min-width: 48rem) and (max-width: 79.999rem)', layout: 'compact-rail-and-primary', navigation: 'compact-rail', detail: 'overlay' },
  { name: 'desktop', query: '(min-width: 80rem)', layout: 'rail-primary-detail', navigation: 'expanded-rail', detail: 'persistent' }
]);

function shellRecipe(input) {
  return Object.freeze({
    schema: 'xtend.material.recipe.v1',
    version: '1.0.0',
    status: 'shell',
    category: 'shell',
    utilities: Object.freeze(input.utilities),
    tokens: Object.freeze(input.tokens),
    components: Object.freeze(input.components),
    slots: Object.freeze(input.slots),
    parts: Object.freeze(input.parts),
    composition: Object.freeze(input.composition),
    responsive: Object.freeze({
      strategy: 'container-first-with-viewport-fallback',
      containerName: 'xtm-shell',
      breakpoints: BREAKPOINTS,
      degradation: input.degradation
    }),
    accessibility: Object.freeze({
      semanticRole: input.semanticRole,
      landmarks: Object.freeze(input.landmarks),
      keyboard: Object.freeze(input.keyboard),
      focus: Object.freeze(input.focus),
      visibleFocus: true,
      reducedMotion: true,
      forcedColors: true
    }),
    fallback: Object.freeze({ provider: 'native-css', stylesheet: '@xtend-material/core/styles.css', className: input.className }),
    boundaries: Object.freeze({ shadowRootAccess: false, manualHostDomWiring: false, rawTailwindAuthoring: false }),
    id: input.id,
    className: input.className
  });
}

const MATERIAL_SHELL_RECIPES = Object.freeze([
  shellRecipe({
    id: 'material.app-shell',
    className: 'xtm-app-shell',
    utilities: ['grid', 'min-h-screen'],
    tokens: ['--xtend-surface-page', '--xtend-text-primary', '--xtend-font-family-body', '--xtend-density-spacing'],
    components: ['x-surface-manager', 'x-header', 'x-router', 'x-drawer'],
    slots: [
      { name: 'root', required: true, className: 'xtm-app-shell', semanticRole: 'application' },
      { name: 'top-app-bar', required: true, semanticRole: 'banner' },
      { name: 'navigation', required: false, semanticRole: 'navigation' },
      { name: 'workspace', required: true, semanticRole: 'main' },
      { name: 'overlays', required: false, semanticRole: 'region' }
    ],
    parts: ['root', 'top-app-bar', 'navigation', 'workspace', 'overlays'],
    composition: [
      { component: 'x-surface-manager', slot: 'root', required: true },
      { component: 'x-header', slot: 'top-app-bar', required: true },
      { component: 'x-router', slot: 'workspace', required: true },
      { component: 'x-drawer', slot: 'navigation', required: false }
    ],
    semanticRole: 'application',
    landmarks: ['banner', 'navigation', 'main'],
    keyboard: { order: ['skip-link', 'top-app-bar', 'navigation', 'workspace', 'detail'], escape: 'close-topmost-overlay' },
    focus: { initial: 'workspace-main', restore: 'originating-control', routeChange: 'main-heading' },
    degradation: 'top-bar-plus-single-main-column-with-drawer-navigation'
  }),
  shellRecipe({
    id: 'material.workspace',
    className: 'xtm-workspace',
    utilities: ['grid', 'min-h-0'],
    tokens: ['--xtend-surface-page', '--xtend-surface-panel', '--xtend-border-subtle', '--xtend-density-spacing'],
    components: ['x-section', 'x-surface-region', 'x-side-panel'],
    slots: [
      { name: 'root', required: true, className: 'xtm-workspace', semanticRole: 'main' },
      { name: 'navigation', required: false, semanticRole: 'navigation' },
      { name: 'primary', required: true, semanticRole: 'main' },
      { name: 'detail', required: false, semanticRole: 'complementary' }
    ],
    parts: ['root', 'navigation', 'primary', 'detail'],
    composition: [
      { component: 'x-surface-region', slot: 'primary', required: true },
      { component: 'x-section', slot: 'primary', required: false },
      { component: 'x-side-panel', slot: 'detail', required: false }
    ],
    semanticRole: 'main',
    landmarks: ['navigation', 'main', 'complementary'],
    keyboard: { order: ['navigation', 'primary', 'detail'], escape: 'return-from-detail-to-primary' },
    focus: { initial: 'primary-heading', restore: 'workspace-origin', routeChange: 'primary-heading' },
    degradation: 'detail-becomes-overlay-then-route-navigation-remains-drawer-capable'
  }),
  shellRecipe({
    id: 'material.navigation-rail',
    className: 'xtm-navigation-rail',
    utilities: ['flex', 'flex-col'],
    tokens: ['--xtend-drawer-surface', '--xtend-drawer-text', '--xtend-drawer-border', '--xtend-density-spacing', '--xtend-focus-ring'],
    components: ['x-drawer', 'x-menu', 'x-icon', 'x-button'],
    slots: [
      { name: 'root', required: true, className: 'xtm-navigation-rail', semanticRole: 'navigation' },
      { name: 'brand', required: false, semanticRole: 'presentation' },
      { name: 'items', required: true, semanticRole: 'menu' },
      { name: 'footer', required: false, semanticRole: 'group' }
    ],
    parts: ['root', 'brand', 'items', 'footer', 'active-indicator'],
    composition: [
      { component: 'x-menu', slot: 'items', required: true },
      { component: 'x-icon', slot: 'items', required: false },
      { component: 'x-button', slot: 'footer', required: false },
      { component: 'x-drawer', slot: 'root', required: false }
    ],
    semanticRole: 'navigation',
    landmarks: ['navigation'],
    keyboard: { order: ['brand', 'items', 'footer'], arrows: 'menu-owned-roving-focus', homeEnd: 'menu-boundary' },
    focus: { initial: 'active-route', restore: 'navigation-trigger', routeChange: 'active-route' },
    degradation: 'expanded-rail-to-compact-icon-rail-to-modal-drawer'
  }),
  shellRecipe({
    id: 'material.top-app-bar',
    className: 'xtm-top-app-bar',
    utilities: ['flex', 'items-center', 'justify-between'],
    tokens: ['--xtend-header-surface', '--xtend-header-text', '--xtend-header-border-color', '--xtend-header-elevation', '--xtend-density-spacing'],
    components: ['x-header', 'x-button', 'x-icon'],
    slots: [
      { name: 'root', required: true, className: 'xtm-top-app-bar', semanticRole: 'banner' },
      { name: 'leading', required: false, semanticRole: 'group' },
      { name: 'title', required: true, semanticRole: 'heading' },
      { name: 'actions', required: false, semanticRole: 'toolbar' }
    ],
    parts: ['root', 'leading', 'title', 'actions'],
    composition: [
      { component: 'x-header', slot: 'root', required: true },
      { component: 'x-button', slot: 'leading', required: false },
      { component: 'x-icon', slot: 'leading', required: false }
    ],
    semanticRole: 'banner',
    landmarks: ['banner'],
    keyboard: { order: ['leading', 'title', 'actions'], escape: 'close-header-menu' },
    focus: { initial: 'skip-link', restore: 'header-trigger', routeChange: 'unchanged' },
    degradation: 'actions-collapse-by-component-policy-title-remains-visible'
  }),
  shellRecipe({
    id: 'material.detail-pane',
    className: 'xtm-detail-pane',
    utilities: ['flex', 'flex-col'],
    tokens: ['--xtend-side-panel-surface', '--xtend-side-panel-text', '--xtend-side-panel-border', '--xtend-side-panel-elevation', '--xtend-density-spacing'],
    components: ['x-side-panel', 'x-section', 'x-surface-region'],
    slots: [
      { name: 'root', required: true, className: 'xtm-detail-pane', semanticRole: 'complementary' },
      { name: 'header', required: false, semanticRole: 'heading' },
      { name: 'content', required: true, semanticRole: 'region' },
      { name: 'actions', required: false, semanticRole: 'group' }
    ],
    parts: ['root', 'header', 'content', 'actions'],
    composition: [
      { component: 'x-side-panel', slot: 'root', required: false },
      { component: 'x-section', slot: 'content', required: true },
      { component: 'x-surface-region', slot: 'content', required: false }
    ],
    semanticRole: 'complementary',
    landmarks: ['complementary'],
    keyboard: { order: ['header', 'content', 'actions'], escape: 'close-overlay-or-return-to-primary' },
    focus: { initial: 'detail-heading', restore: 'detail-origin', routeChange: 'detail-heading' },
    degradation: 'persistent-pane-to-overlay-pane-to-dedicated-route'
  })
]);

function validateMaterialShellRecipes(recipes = MATERIAL_SHELL_RECIPES, options = {}) {
  const errors = [];
  const knownComponents = options.knownComponents || new Set();
  const knownTokens = options.knownTokens || new Set();
  const ids = new Set();
  recipes.forEach((recipe) => {
    if (!/^material\.(?:app-shell|workspace|navigation-rail|top-app-bar|detail-pane)$/u.test(recipe.id)) errors.push(`unsupported shell recipe ${recipe.id}`);
    if (ids.has(recipe.id)) errors.push(`duplicate shell recipe ${recipe.id}`);
    ids.add(recipe.id);
    if (!recipe.slots.some((slot) => slot.name === 'root' && slot.required)) errors.push(`${recipe.id} misses required root slot`);
    if (!recipe.parts.includes('root')) errors.push(`${recipe.id} misses root part`);
    if (recipe.components.some((component) => knownComponents.size && !knownComponents.has(component))) errors.push(`${recipe.id} references unknown component`);
    if (recipe.tokens.some((token) => knownTokens.size && !knownTokens.has(token))) errors.push(`${recipe.id} references unknown token`);
    if (recipe.utilities.some((utility) => /[\[\]/:]/u.test(utility))) errors.push(`${recipe.id} contains unsafe utility syntax`);
    if (!recipe.responsive || recipe.responsive.breakpoints.length !== 3) errors.push(`${recipe.id} needs mobile, tablet and desktop behavior`);
    if (!recipe.accessibility || !recipe.accessibility.landmarks.length || !recipe.accessibility.keyboard || !recipe.accessibility.focus) errors.push(`${recipe.id} has incomplete accessibility plan`);
    if (!recipe.fallback || recipe.fallback.provider !== 'native-css') errors.push(`${recipe.id} misses native fallback`);
    if (!recipe.boundaries || recipe.boundaries.shadowRootAccess !== false || recipe.boundaries.manualHostDomWiring !== false) errors.push(`${recipe.id} opens an internal DOM boundary`);
  });
  return { schema: MATERIAL_SHELL_RECIPE_REPORT_SCHEMA, ok: errors.length === 0, status: errors.length === 0 ? 'accepted' : 'blocked', errors, recipeCount: recipes.length };
}

module.exports = { BREAKPOINTS, MATERIAL_SHELL_RECIPES, MATERIAL_SHELL_RECIPE_REPORT_SCHEMA, validateMaterialShellRecipes };

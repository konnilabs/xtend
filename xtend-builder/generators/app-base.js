'use strict';

const APP_SERVICE_BASE_TEMPLATES = Object.freeze([
  { artifact: 'app-services', id: 'app-services', target: 'src/services.ts', kind: 'typescript' },
  { artifact: 'server-services', id: 'node-services', target: 'src/server-services.ts', kind: 'typescript', server: 'node' },
  { artifact: 'php-server-services', id: 'php-services', target: 'server/server-services.php', kind: 'php', server: 'php' },
  { artifact: 'app-tsconfig', id: 'tsconfig', target: 'tsconfig.json', kind: 'config' }
]);

const APP_SERVER_TARGETS = Object.freeze(['none', 'node', 'php', 'both']);

function normalizeAppServerTarget(input = {}) {
  return String(input.server || input.serverTarget || input['server-target'] || 'both').toLowerCase();
}

function appServiceTargets(serverTarget) {
  const targets = ['browser'];
  if (serverTarget === 'node' || serverTarget === 'both') targets.push('node');
  if (serverTarget === 'php' || serverTarget === 'both') targets.push('php');
  return targets;
}

function filterAppTemplatesForServer(templates, serverTarget) {
  return templates.filter((definition) => (
    !definition.server
    || serverTarget === 'both'
    || serverTarget === definition.server
  ));
}

module.exports = {
  APP_SERVER_TARGETS,
  APP_SERVICE_BASE_TEMPLATES,
  appServiceTargets,
  filterAppTemplatesForServer,
  normalizeAppServerTarget
};

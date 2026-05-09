const BOUNDARY_FIELD_NAMES = new Set([
  'componentModule',
  'componentImport',
  'customElementImport',
  'module',
  'runtimeImport',
  'xtendImport'
]);

const DEPRECATED_FIELDS = new Map([
  ['cdn', 'Lokale ESM-Module oder Manifest-Records statt CDN-Felder nutzen.'],
  ['cdnUrl', 'Lokale ESM-Module oder Manifest-Records statt CDN-Felder nutzen.'],
  ['rmtJsonFallback', 'Native .rmt Dateien statt .rmt.json Authoring nutzen.'],
  ['legacyTemplate', 'Aktuellen templates[*] Domain-Contract nutzen.']
]);

function isBoundaryValue(value) {
  if (typeof value !== 'string') {
    return false;
  }

  return value.endsWith('.js')
    || value.startsWith('http://')
    || value.startsWith('https://')
    || value.startsWith('cdn:')
    || value.includes('/components/');
}

function walk(value, pointer, visit) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, `${pointer}/${index}`, visit));
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  Object.entries(value).forEach(([key, entry]) => {
    const childPointer = `${pointer}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`;
    visit(key, entry, childPointer);
    walk(entry, childPointer, visit);
  });
}

function createBoundaryPolicyRule() {
  return {
    id: 'rmt.boundary-policy',
    description: 'Verhindert Runtime-Imports, CDN-Felder und bekannte Deprecated Fields im RMT-Sprachkern.',
    defaultSeverity: 'error',
    run(context) {
      const diagnostics = [];

      walk(context.document, '', (key, value, pointer) => {
        if (BOUNDARY_FIELD_NAMES.has(key) && isBoundaryValue(value)) {
          diagnostics.push(context.createDiagnostic({
            code: 'rmt.xtend.kernel-boundary.violation',
            message: `RMT Record darf kein Runtime-Modul ueber "${key}" einbetten.`,
            pointer
          }));
        }

        if (DEPRECATED_FIELDS.has(key)) {
          diagnostics.push(context.createDiagnostic({
            code: 'rmt.deprecated.field.used',
            message: `${key} ist deprecated. ${DEPRECATED_FIELDS.get(key)}`,
            pointer
          }));
        }
      });

      return diagnostics;
    }
  };
}

module.exports = {
  BOUNDARY_FIELD_NAMES,
  DEPRECATED_FIELDS,
  createBoundaryPolicyRule
};

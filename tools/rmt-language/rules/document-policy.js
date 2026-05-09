const IDENTITY_DOMAINS = ['adapters', 'components', 'routes', 'schedules', 'templates'];
const REQUIRED_PRODUCTIVE_DOMAINS = ['adapters', 'components', 'routes', 'schedules', 'templates'];

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function createDocumentPolicyRule() {
  return {
    id: 'rmt.document-policy',
    description: 'Validiert Dokumentkind, Top-Level-Domains und stabile IDs.',
    defaultSeverity: 'error',
    run(context) {
      const diagnostics = [];
      const document = context.document || {};
      const allowedDomains = new Set(context.allowedTopLevelDomains);

      if (document.kind !== 'rmt_document') {
        diagnostics.push(context.createDiagnostic({
          code: 'rmt.document.kind.missing',
          message: 'RMT Dokumente muessen kind: "rmt_document" deklarieren.',
          pointer: Object.prototype.hasOwnProperty.call(document, 'kind') ? '/kind' : null
        }));
      }

      Object.keys(document).forEach((key) => {
        if (!allowedDomains.has(key)) {
          diagnostics.push(context.createDiagnostic({
            code: 'rmt.domain.unknown',
            message: `Top-Level-Domain "${key}" ist im RMT Authoring Contract nicht registriert.`,
            pointer: `/${context.escapeJsonPointerSegment(key)}`
          }));
        }
      });

      REQUIRED_PRODUCTIVE_DOMAINS.forEach((domain) => {
        if (!Array.isArray(document[domain])) {
          diagnostics.push(context.createDiagnostic({
            code: 'rmt.domain.required.missing',
            message: `Produktive RMT-Domain "${domain}" fehlt oder ist kein Array.`,
            pointer: null
          }));
        }
      });

      IDENTITY_DOMAINS.forEach((domain) => {
        context.toArray(document[domain]).forEach((record, index) => {
          if (!isObject(record) || !context.normalizeString(record.id)) {
            diagnostics.push(context.createDiagnostic({
              code: 'rmt.id.missing',
              message: `${domain}[${index}] benoetigt eine stabile id.`,
              pointer: context.joinPointer(domain, index)
            }));
          }
        });
      });

      return diagnostics;
    }
  };
}

module.exports = {
  createDocumentPolicyRule
};

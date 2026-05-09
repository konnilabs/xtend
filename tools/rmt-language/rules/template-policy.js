const SUPPORTED_TEMPLATE_MODES = new Set(['dom_descriptor', 'html_fragment', 'text']);

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function hasTrustBoundary(template) {
  const security = isObject(template.security) ? template.security : {};
  const metadata = isObject(template.metadata) ? template.metadata : {};

  return Boolean(
    security.trustBoundary
      || security.trustedDomBoundary
      || metadata.trustBoundary
      || metadata.trustedDomBoundary
      || metadata.sanitizer
  );
}

function containsInlineScript(value) {
  if (typeof value === 'string') {
    return /<\s*script[\s>]/i.test(value);
  }

  if (Array.isArray(value)) {
    return value.some((entry) => containsInlineScript(entry));
  }

  if (!isObject(value)) {
    return false;
  }

  if (typeof value.tag === 'string' && value.tag.toLowerCase() === 'script') {
    return true;
  }

  return Object.values(value).some((entry) => containsInlineScript(entry));
}

function hasValidDomDescriptorNode(node) {
  if (!isObject(node)) {
    return false;
  }

  return [
    'tag',
    'component',
    'template',
    'text',
    'value',
    'children',
    'nodes',
    'slots',
    'kind'
  ].some((field) => Object.prototype.hasOwnProperty.call(node, field));
}

function validateDomDescriptorNodes(context, nodes, pointer, diagnostics) {
  context.toArray(nodes).forEach((node, index) => {
    const nodePointer = `${pointer}/${index}`;

    if (!hasValidDomDescriptorNode(node)) {
      diagnostics.push(context.createDiagnostic({
        code: 'rmt.template.dom-descriptor.invalid-node',
        message: 'DOM Descriptor Node benoetigt tag, component, template, text/value, children, nodes, slots oder kind.',
        pointer: nodePointer
      }));
      return;
    }

    if (Array.isArray(node.children)) {
      validateDomDescriptorNodes(context, node.children, `${nodePointer}/children`, diagnostics);
    }

    if (Array.isArray(node.nodes)) {
      validateDomDescriptorNodes(context, node.nodes, `${nodePointer}/nodes`, diagnostics);
    }
  });
}

function createTemplatePolicyRule() {
  return {
    id: 'rmt.template-policy',
    description: 'Validiert Template Modes, DOM Descriptor Shapes und HTML-Trust-Boundaries.',
    defaultSeverity: 'error',
    run(context) {
      const diagnostics = [];

      context.toArray(context.document.templates).forEach((template, index) => {
        const pointer = context.joinPointer('templates', index);
        const mode = context.normalizeString(template && template.mode);

        if (!SUPPORTED_TEMPLATE_MODES.has(mode)) {
          diagnostics.push(context.createDiagnostic({
            code: 'rmt.template.mode.unsupported',
            message: `Template Mode "${mode || '<missing>'}" wird vom Linter-MVP nicht unterstuetzt.`,
            pointer: `${pointer}/mode`
          }));
        }

        if (mode === 'dom_descriptor') {
          validateDomDescriptorNodes(context, template.nodes, `${pointer}/nodes`, diagnostics);
        }

        if (mode === 'html_fragment' && !hasTrustBoundary(template)) {
          diagnostics.push(context.createDiagnostic({
            code: 'rmt.template.html-fragment.trust-boundary-missing',
            message: `HTML Fragment Template "${template && template.id ? template.id : index}" benoetigt eine Trusted-DOM-Boundary.`,
            pointer
          }));
        }

        if (containsInlineScript(template)) {
          diagnostics.push(context.createDiagnostic({
            code: 'rmt.template.inline-script.refused',
            message: `Template "${template && template.id ? template.id : index}" enthaelt Inline-Script und verletzt die Trusted-DOM-Boundary.`,
            pointer
          }));
        }
      });

      return diagnostics;
    }
  };
}

module.exports = {
  SUPPORTED_TEMPLATE_MODES,
  createTemplatePolicyRule
};

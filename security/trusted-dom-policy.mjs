import {
  SANITIZING_BOUNDARY_CONTRACT,
  TRUSTED_TEXT_SANITIZER_CONTRACT,
  sanitizeTrustedText
} from '../xtend-maraca/trusted-text-sanitizer.mjs';

const TRUSTED_DOM_POLICY_CONTRACT = 'xtend.security.trusted-dom-policy.v1';
const MARKUP_CLASSIFICATION_CONTRACT = 'xtend.security.markup-classification.v1';
const TRUSTED_DOM_SINK_CONTRACT = 'xtend.security.trusted-dom-sink.v1';
const TRUSTED_DOM_SANITIZER_CONTRACT = 'xtend.security.trusted-dom-sanitizer.v1';

const MARKUP_CLASSES = {
  text: {
    trust: 'content-trusted-dom-safe',
    defaultSink: 'textContent',
    sanitizerRequired: false,
    description: 'Plain text from docs, RMT records or component props.'
  },
  attribute: {
    trust: 'value-untrusted-until-validated',
    defaultSink: 'setAttribute',
    sanitizerRequired: false,
    description: 'Attribute values, including ARIA labels, slot names and local hrefs.'
  },
  structuredTemplate: {
    trust: 'authoring-trusted-dom-safe-after-validation',
    defaultSink: 'replaceChildren',
    sanitizerRequired: false,
    description: 'RMT dom_descriptor or host-built component trees.'
  },
  htmlFragment: {
    trust: 'dom-untrusted-until-sanitized',
    defaultSink: 'trustedDomBoundary',
    sanitizerRequired: true,
    description: 'RMT html_fragment records and other authored HTML strings.'
  },
  parsedownHtml: {
    trust: 'dom-untrusted-until-sanitized',
    defaultSink: 'trustedDomBoundary',
    sanitizerRequired: true,
    description: 'HTML emitted by Parsedown for the docs app, even when SafeMode is enabled.'
  }
};

const DOM_SINKS = {
  textContent: {
    status: 'allowed',
    accepts: ['text'],
    requiredBoundary: 'none'
  },
  setAttribute: {
    status: 'allowed-with-validation',
    accepts: ['attribute'],
    requiredBoundary: 'attribute-allowlist-and-url-policy'
  },
  classList: {
    status: 'allowed',
    accepts: ['attribute'],
    requiredBoundary: 'tokenized-class-values'
  },
  dataset: {
    status: 'allowed-with-validation',
    accepts: ['attribute'],
    requiredBoundary: 'no-secrets-no-code-values'
  },
  append: {
    status: 'allowed',
    accepts: ['structuredTemplate'],
    requiredBoundary: 'node-only'
  },
  replaceChildren: {
    status: 'allowed',
    accepts: ['structuredTemplate'],
    requiredBoundary: 'node-only'
  },
  innerHTML: {
    status: 'restricted',
    accepts: ['htmlFragment', 'parsedownHtml'],
    requiredBoundary: 'trusted-dom-boundary'
  },
  insertAdjacentHTML: {
    status: 'restricted',
    accepts: ['htmlFragment', 'parsedownHtml'],
    requiredBoundary: 'trusted-dom-boundary'
  },
  templateInnerHTML: {
    status: 'restricted',
    accepts: ['htmlFragment'],
    requiredBoundary: 'trusted-dom-boundary'
  },
  scriptSrc: {
    status: 'forbidden-by-default',
    accepts: [],
    requiredBoundary: 'loader-import-policy'
  },
  eval: {
    status: 'forbidden',
    accepts: [],
    requiredBoundary: 'never'
  },
  newFunction: {
    status: 'forbidden',
    accepts: [],
    requiredBoundary: 'never'
  }
};

const URL_ATTRIBUTE_POLICY = {
  allowedAttributes: ['href', 'src', 'action', 'poster'],
  allowedProtocols: ['self', 'relative', 'http:', 'https:', 'mailto:', 'tel:'],
  disallowedProtocols: ['javascript:', 'data:text/html', 'data:text/javascript', 'vbscript:'],
  dataUrlException: 'data:image/* only after explicit sanitizer decision'
};

const RMT_TEMPLATE_POLICY = {
  domDescriptorMode: {
    markupClass: 'structuredTemplate',
    preferred: true,
    sink: 'replaceChildren'
  },
  htmlFragmentMode: {
    markupClass: 'htmlFragment',
    preferred: false,
    sink: 'innerHTML',
    requiredBoundary: SANITIZING_BOUNDARY_CONTRACT
  },
  eventBindings: {
    allowed: ['actionRef', 'commandName', 'routeRef', 'payload'],
    forbidden: ['inlineHandler', 'javascriptString', 'eval', 'new Function']
  }
};

const PARSEDOWN_DOCS_POLICY = {
  source: 'docs/*.md',
  adapter: 'docs.parsedown',
  parsedownSafeModeRequired: true,
  outputMarkupClass: 'parsedownHtml',
  requiredBoundary: SANITIZING_BOUNDARY_CONTRACT,
  allowedSink: 'trustedDomBoundary',
  rmtSchedulingBoundary: 'RMT may schedule Parsedown work, but the docs host owns parsing and sanitizing.'
};

const TRUSTED_DOM_SANITIZER_POLICY = {
  schema: TRUSTED_DOM_SANITIZER_CONTRACT,
  boundary: SANITIZING_BOUNDARY_CONTRACT,
  removesElements: ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'form', 'style', 'svg', 'math', 'template'],
  removesAttributes: ['/^on/i', 'srcdoc'],
  validatesUrlAttributes: ['href', 'src', 'action', 'poster'],
  disallowedProtocols: URL_ATTRIBUTE_POLICY.disallowedProtocols,
  dataUrlException: URL_ATTRIBUTE_POLICY.dataUrlException,
  diagnostics: [
    'xtend.security.sanitizer.element_removed',
    'xtend.security.sanitizer.attribute_removed',
    'xtend.security.sanitizer.url_removed'
  ]
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeMarkupClass(markupClass) {
  if (markupClass === 'structured-template' || markupClass === 'dom_descriptor') {
    return 'structuredTemplate';
  }
  if (markupClass === 'html_fragment') {
    return 'htmlFragment';
  }
  if (markupClass === 'parsedown-html') {
    return 'parsedownHtml';
  }
  return markupClass || 'text';
}

function getTrustedDomPolicy() {
  return clone({
    schema: TRUSTED_DOM_POLICY_CONTRACT,
    sanitizingBoundary: SANITIZING_BOUNDARY_CONTRACT,
    markupClassification: MARKUP_CLASSIFICATION_CONTRACT,
    sinkContract: TRUSTED_DOM_SINK_CONTRACT,
    markupClasses: MARKUP_CLASSES,
    sinks: DOM_SINKS,
    urlAttributes: URL_ATTRIBUTE_POLICY,
    rmtTemplates: RMT_TEMPLATE_POLICY,
    parsedownDocs: PARSEDOWN_DOCS_POLICY,
    sanitizer: TRUSTED_DOM_SANITIZER_POLICY,
    diagnostics: [
      'xtend.security.trusted_dom.required',
      'xtend.security.sanitizer.missing',
      'xtend.security.sink.refused',
      'xtend.security.attribute.refused',
      'xtend.security.event.refused'
    ]
  });
}

function isAllowedTrustedDomUrl(value) {
  const normalized = String(value || '').trim().replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase();
  if (!normalized) return true;
  if (normalized.startsWith('#') || normalized.startsWith('/') || normalized.startsWith('./') || normalized.startsWith('../')) return true;
  if (normalized.startsWith('data:')) return normalized.startsWith('data:image/');
  return !URL_ATTRIBUTE_POLICY.disallowedProtocols.some((protocol) => normalized.startsWith(protocol));
}

function sanitizeTrustedDomHtml(html, options = {}) {
  let output = String(html || '');
  const removed = [];
  const markupClass = normalizeMarkupClass(options.markupClass || 'htmlFragment');

  TRUSTED_DOM_SANITIZER_POLICY.removesElements.forEach((tagName) => {
    const paired = new RegExp(`<\\s*${tagName}\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*${tagName}\\s*>`, 'gi');
    output = output.replace(paired, (match) => {
      removed.push({ type: 'element', name: tagName });
      return '';
    });

    const single = new RegExp(`<\\s*${tagName}\\b[^>]*\\/?\\s*>`, 'gi');
    output = output.replace(single, (match) => {
      removed.push({ type: 'element', name: tagName });
      return '';
    });
  });

  output = output.replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, (match) => {
    removed.push({ type: 'attribute', name: match.trim().split('=')[0] });
    return '';
  });

  output = output.replace(/\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, (match) => {
    removed.push({ type: 'attribute', name: 'srcdoc' });
    return '';
  });

  output = output.replace(/\s+(href|src|action|poster)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (match, name, rawValue) => {
    const unquoted = String(rawValue || '').replace(/^['"]|['"]$/g, '');
    if (!isAllowedTrustedDomUrl(unquoted)) {
      removed.push({ type: 'url', name });
      return '';
    }
    return match;
  });

  return {
    schema: TRUSTED_DOM_SANITIZER_CONTRACT,
    ok: true,
    sanitized: true,
    boundary: SANITIZING_BOUNDARY_CONTRACT,
    markupClass,
    html: output,
    removed,
    removedCount: removed.length
  };
}

function getMarkupClass(markupClass) {
  const key = normalizeMarkupClass(markupClass);
  return MARKUP_CLASSES[key] ? clone(MARKUP_CLASSES[key]) : null;
}

function getSinkPolicy(sink) {
  return DOM_SINKS[sink] ? clone(DOM_SINKS[sink]) : null;
}

function classifyTrustedDomUse(input = {}) {
  const markupKey = normalizeMarkupClass(input.markupClass || input.mode || input.type);
  const markup = MARKUP_CLASSES[markupKey] || MARKUP_CLASSES.text;
  const sinkName = input.sink || markup.defaultSink;
  const sink = DOM_SINKS[sinkName] || {
    status: 'unknown',
    accepts: [],
    requiredBoundary: 'explicit-review'
  };
  const acceptedBySink = sink.accepts.includes(markupKey);
  const restricted = sink.status === 'restricted';
  const forbidden = sink.status === 'forbidden' || sink.status === 'forbidden-by-default';
  const requiresSanitizer = markup.sanitizerRequired || restricted;
  const hasBoundary = input.boundary === SANITIZING_BOUNDARY_CONTRACT || input.sanitized === true;
  const ok = !forbidden && (acceptedBySink || sink.status === 'allowed-with-validation') && (!requiresSanitizer || hasBoundary);
  const diagnostics = [];

  if (forbidden) {
    diagnostics.push('xtend.security.sink.refused');
  }
  if (!acceptedBySink && sink.status !== 'allowed-with-validation') {
    diagnostics.push('xtend.security.trusted_dom.required');
  }
  if (requiresSanitizer && !hasBoundary) {
    diagnostics.push('xtend.security.sanitizer.missing');
  }

  return {
    schema: MARKUP_CLASSIFICATION_CONTRACT,
    ok,
    markupClass: markupKey,
    sink: sinkName,
    trust: markup.trust,
    requiresSanitizer,
    requiredBoundary: requiresSanitizer ? SANITIZING_BOUNDARY_CONTRACT : sink.requiredBoundary,
    diagnostics
  };
}

export {
  DOM_SINKS,
  MARKUP_CLASSES,
  MARKUP_CLASSIFICATION_CONTRACT,
  PARSEDOWN_DOCS_POLICY,
  RMT_TEMPLATE_POLICY,
  SANITIZING_BOUNDARY_CONTRACT,
  TRUSTED_DOM_SANITIZER_CONTRACT,
  TRUSTED_DOM_SANITIZER_POLICY,
  TRUSTED_TEXT_SANITIZER_CONTRACT,
  TRUSTED_DOM_POLICY_CONTRACT,
  TRUSTED_DOM_SINK_CONTRACT,
  URL_ATTRIBUTE_POLICY,
  classifyTrustedDomUse,
  getMarkupClass,
  getSinkPolicy,
  getTrustedDomPolicy,
  isAllowedTrustedDomUrl,
  sanitizeTrustedDomHtml,
  sanitizeTrustedText
};

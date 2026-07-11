import { createRmtTemplateRuntimeRenderer } from '../../xtendrmt/rmt-runtime.esm.js';

const DOCS_TRUSTED_DOM_HOST_SCHEMA = 'xtend.docs.trusted-dom-host.v1';
const TRUSTED_DOM_BOUNDARY = 'xtend.security.sanitizing-boundary.v1';

const renderer = createRmtTemplateRuntimeRenderer({
  windowTarget: window,
  documentTarget: document
});

function commit(target, html, context = {}) {
  if (!target) throw new TypeError('Docs Trusted DOM commit requires a target.');
  const beforeVerdicts = renderer.listTrustVerdicts().length;
  const session = renderer.applyBindings({
    rootId: context.rootId || 'docs-parsedown-content',
    element: target,
    templateQualifiedId: context.templateQualifiedId || 'docs.parsedown.content',
    slots: [{
      name: 'content',
      kind: 'html_fragment',
      target: ':root',
      source: 'content'
    }],
    modelSnapshot: { content: String(html || '') }
  });
  const verdicts = renderer.listTrustVerdicts().slice(beforeVerdicts);
  return {
    schema: DOCS_TRUSTED_DOM_HOST_SCHEMA,
    committed: true,
    boundary: TRUSTED_DOM_BOUNDARY,
    session,
    verdicts,
    verdict: verdicts[verdicts.length - 1] || null
  };
}

function sanitize(html, context = {}) {
  const target = document.createElement('div');
  const result = commit(target, html, {
    ...context,
    rootId: context.rootId || 'docs-parsedown-sanitize',
    templateQualifiedId: context.templateQualifiedId || 'docs.parsedown.sanitize'
  });
  const verdict = result.verdict || {};
  return {
    schema: DOCS_TRUSTED_DOM_HOST_SCHEMA,
    sanitizer: 'xtend.security.trusted-dom-sanitizer.v1',
    sanitized: verdict.sanitized === true,
    boundary: verdict.trustBoundary || TRUSTED_DOM_BOUNDARY,
    html: target.innerHTML,
    removed: [],
    removedCount: Number(verdict.metadata && verdict.metadata.removedCount || 0),
    verdict
  };
}

window.xtendDocsTrustedDomRuntime = Object.freeze({
  schema: DOCS_TRUSTED_DOM_HOST_SCHEMA,
  boundary: TRUSTED_DOM_BOUNDARY,
  commit,
  sanitize,
  listTrustVerdicts: () => renderer.listTrustVerdicts(),
  getPanicSnapshot: () => renderer.getPanicSnapshot(),
  getPanicRecoverySnapshot: () => renderer.getPanicRecoverySnapshot()
});

export { DOCS_TRUSTED_DOM_HOST_SCHEMA, TRUSTED_DOM_BOUNDARY, commit, sanitize };

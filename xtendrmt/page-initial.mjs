import { validatePageResponse, pageError } from './page-contract.mjs';
import { decodePageWire } from './page-wire.mjs';

export const PAGE_INITIAL_RESUME_SCHEMA = 'xtend.page-initial-resume.v1';

/** This envelope owns reduced chunks; they are never ordinary SSR responses. */
export function encodePageInitialResume(page) {
  validatePageResponse(page);
  if (page?.schema !== 'xtend.page-response.v2' || page.kind !== 'page' || !page.ssr?.resume || page.ssr.executionMode !== 'server_prerender_resume'
      || page.renderArtifact?.schema !== 'xtend.rmt.portable-render.v2'
      || !page.ssr.chunk?.markup?.descriptor) throw pageError('page.initial_resume_invalid', 'Initial resume requires a portable descriptor and resume envelope.');
  const { ssr, ...data } = page;
  const project = chunk => {
    if (chunk?.template?.mode !== 'dom_descriptor' || !chunk.markup?.descriptor) throw pageError('page.initial_resume_invalid', 'Initial resume chunks require descriptor recovery.');
    const { kind, version, ...initialChunk } = chunk;
    return { ...initialChunk, markup: { descriptor: chunk.markup.descriptor } };
  };
  const { kind, version, ...initialSsr } = ssr;
  const envelope = { schema: PAGE_INITIAL_RESUME_SCHEMA, page: data, ssr: { ...initialSsr, chunk: project(ssr.chunk), chunks: ssr.chunks.map(project) } };
  decodePageInitialDocument(envelope);
  return envelope;
}

/** Initial-document boundary: validate before any client state or DOM changes. */
export function decodePageInitialDocument(input) {
  if (input?.schema !== PAGE_INITIAL_RESUME_SCHEMA) return validatePageResponse(decodePageWire(input));
  const page = validatePageResponse(input.page);
  const ssr = input.ssr;
  if (page.schema !== 'xtend.page-response.v2' || page.kind !== 'page' || Object.hasOwn(page, 'ssr')
      || ssr && (Object.hasOwn(ssr, 'kind') || Object.hasOwn(ssr, 'version')) || ssr?.executionMode !== 'server_prerender_resume'
      || page.renderArtifact?.schema !== 'xtend.rmt.portable-render.v2'
      || ssr.resume?.schema !== 'xtend.rmt.ssr-resume-envelope.v1' || ssr.resume.version !== 1
      || !Array.isArray(ssr.chunks) || !ssr.chunks.length) throw pageError('page.initial_resume_invalid', 'Invalid initial resume envelope.');
  for (const chunk of [ssr.chunk, ...ssr.chunks]) {
    if (chunk && (Object.hasOwn(chunk, 'kind') || Object.hasOwn(chunk, 'version')) || chunk?.template?.mode !== 'dom_descriptor' || !chunk.markup?.descriptor
        || Object.keys(chunk.markup).some(key => key !== 'descriptor')) throw pageError('page.initial_resume_invalid', 'Invalid initial descriptor recovery chunk.');
  }
  return { ...page, ssr };
}

import {
  canonicalizeRmtResumePayload,
  clampString
} from './rmt-resume-protocol.mjs';

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes)).map((value) => value.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64Url(bytes, encode) {
  if (typeof encode !== 'function') return '';
  const binary = Array.from(new Uint8Array(bytes)).map((value) => String.fromCharCode(value)).join('');
  return encode(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/gu, '');
}

export function createRmtResumeHostAdapter(options = {}) {
  const host = options.hostTarget || options.globalTarget || (typeof globalThis !== 'undefined' ? globalThis : null);
  const documentTarget = options.document || host && host.document || null;
  const now = typeof options.now === 'function' ? options.now : (() => Date.now());

  function resolveRoot(envelope, response, callOptions = {}) {
    if (callOptions.root && typeof callOptions.root === 'object') return callOptions.root;
    const documentPort = callOptions.document || documentTarget;
    if (!documentPort) return null;
    const rootId = clampString(callOptions.rootId || envelope.rootId || response.rootId);
    if (rootId && typeof documentPort.getElementById === 'function') {
      const root = documentPort.getElementById(rootId);
      if (root) return root;
    }
    return typeof documentPort.querySelector === 'function'
      ? documentPort.querySelector('[data-rmt-resume-root="true"]')
      : null;
  }

  function inspectRoot(root) {
    return {
      id: root && typeof root.getAttribute === 'function' ? clampString(root.getAttribute('id')) : '',
      generation: root && typeof root.getAttribute === 'function'
        ? clampString(root.getAttribute('data-rmt-resume-generation'))
        : ''
    };
  }

  function createNodeManifest(root) {
    if (!root || typeof root.getAttribute !== 'function') return [];
    const nodes = [root];
    if (typeof root.querySelectorAll === 'function') {
      nodes.push(...Array.from(root.querySelectorAll('[data-rmt-resume-id]')));
    }
    return nodes.map((node) => ({
      generation: clampString(node.getAttribute('data-rmt-resume-generation')),
      id: clampString(node.getAttribute('data-rmt-resume-id')),
      tag: clampString(node.localName || node.tagName).toLowerCase()
    })).filter((record) => record.id);
  }

  function readDomPayload(root, dom = {}) {
    if (dom.canonicalization === 'resume-node-manifest.v1') {
      const manifest = createNodeManifest(root);
      return {
        canonical: canonicalizeRmtResumePayload(manifest),
        nodeCount: manifest.length,
        skipped: false
      };
    }
    if (!root || typeof root.outerHTML !== 'string') {
      return { canonical: '', nodeCount: null, skipped: true };
    }
    return { canonical: root.outerHTML, nodeCount: null, skipped: false };
  }

  async function digest(value, encoding = 'base64url') {
    const cryptoTarget = host && host.crypto;
    const Encoder = host && host.TextEncoder;
    if (!cryptoTarget || !cryptoTarget.subtle || typeof Encoder !== 'function') return null;
    const digestBytes = await cryptoTarget.subtle.digest('SHA-256', new Encoder().encode(value));
    return encoding === 'hex'
      ? bytesToHex(digestBytes)
      : bytesToBase64Url(digestBytes, host && host.btoa);
  }

  return Object.freeze({
    schema: 'xtend.rmt.resume-host-adapter.v1',
    now,
    resolveRoot,
    inspectRoot,
    readDomPayload,
    digest
  });
}

export default Object.freeze({ createRmtResumeHostAdapter });

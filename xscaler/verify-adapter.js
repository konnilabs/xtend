'use strict';
const {parse} = require('./vendor/acorn');

async function verifyAdapterBytes(descriptor, options = {}) {
  const timeout = AbortSignal.timeout(options.verificationTimeoutMs || 15000);
  const signal = descriptor.signal ? AbortSignal.any([descriptor.signal, timeout]) : timeout;
  const response = await (options.fetch || globalThis.fetch)(descriptor.url, {signal, credentials: 'omit', redirect: 'error'});
  if (!response.ok || !response.body) throw new Error('Adapter verification fetch failed.');
  const maxBytes = options.maxAdapterBytes || 1024 * 1024;
  const reader = response.body.getReader();
  let bytes = 0;
  const chunks = [];
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error('Adapter exceeds verification byte limit.');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  signal.throwIfAborted();
  const sourceBytes = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { sourceBytes.set(chunk, offset); offset += chunk.length; }
  const match = /^(sha256|sha384|sha512)-([A-Za-z0-9+/]+=*)$/.exec(descriptor.integrity);
  if (!match) throw new Error('Invalid adapter SRI.');
  const digest = new Uint8Array(await (options.cryptoTarget || globalThis.crypto).subtle.digest(match[1].replace('sha', 'SHA-'), sourceBytes));
  const expected = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
  if (digest.length !== expected.length || digest.some((byte, index) => byte !== expected[index])) throw new Error('Adapter SRI mismatch.');
  const ast = parse(new TextDecoder('utf-8', {fatal: true}).decode(sourceBytes), {ecmaVersion: 'latest', sourceType: 'module'});
  const pending = [ast];
  while (pending.length) {
    const node = pending.pop();
    if (!node || typeof node !== 'object') continue;
    if (node.type === 'ImportDeclaration' || node.type === 'ImportExpression' || node.type === 'ExportAllDeclaration' || node.type === 'ExportNamedDeclaration' && node.source) throw new Error('Adapter must be a self-contained bundle without imports.');
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) pending.push(...value);
      else if (value && typeof value === 'object') pending.push(value);
    }
  }
  signal.throwIfAborted();
}

module.exports = {verifyAdapterBytes};

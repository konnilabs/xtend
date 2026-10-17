'use strict';
const path = require('node:path');
const { createRequire } = require('node:module');
const { check } = require('./inventory.cjs');
const CERTIFICATE_IDENTITY = 'https://github.com/konnilabs/xtend/.github/workflows/xtend-default-gates.yml@refs/heads/main';
const VERIFICATION_OPTIONS = Object.freeze({
  certificateIssuer: 'https://token.actions.githubusercontent.com',
  // npm's bundled SAN policy uses String.match(pattern), not string equality.
  // Escape every regex metacharacter and anchor both ends. The final guard also
  // rejects a trailing newline (which JavaScript's bare $ would accept).
  certificateIdentityURI: '^' + CERTIFICATE_IDENTITY.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$(?![\\s\\S])',
  tlogThreshold: 1, ctLogThreshold: 1, retry: Object.freeze({ retries: 0 }), timeout: 30000
});
// Use npm 11.17's own Sigstore verifier and its TUF-authenticated trust roots.
// There is no extra authentication flow, token, or unverified payload fallback.
async function verifyStatements(response, { npmCli, verifyBundle } = {}) {
  check(Array.isArray(response?.attestations) && response.attestations.length > 0, 'Invalid registry attestation response');
  if (!verifyBundle) {
    check(path.isAbsolute(npmCli || ''), 'Installed npm CLI required for Sigstore verification');
    const requireNpm = createRequire(npmCli);
    check(requireNpm('../package.json').version === '11.17.0', 'Provenance verifier requires committed npm pin');
    const sigstore = requireNpm('sigstore');
    verifyBundle = bundle => sigstore.verify(bundle, VERIFICATION_OPTIONS);
  }
  const statements = [];
  for (const item of response.attestations) {
    if (item.predicateType !== 'https://slsa.dev/provenance/v1' && item.predicateType !== 'https://slsa.dev/provenance/v0.2') continue;
    check(item.bundle?.dsseEnvelope?.payloadType === 'application/vnd.in-toto+json' &&
      typeof item.bundle.dsseEnvelope.payload === 'string', 'Attestation statement missing');
    await verifyBundle(item.bundle);
    const statement = JSON.parse(Buffer.from(item.bundle.dsseEnvelope.payload, 'base64').toString('utf8'));
    check(statement.predicateType === item.predicateType, 'Verified attestation predicate mismatch');
    statements.push(statement);
  }
  check(statements.length > 0, 'Cryptographically verified npm provenance required');
  return statements;
}
module.exports = { verifyStatements, CERTIFICATE_IDENTITY, VERIFICATION_OPTIONS };

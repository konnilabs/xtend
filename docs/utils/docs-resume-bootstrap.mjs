const prehydration = window.xtendDocsSsrPrehydration || null;
const root = document.getElementById('xtend-docs-rmt-root');
const bootstrapNode = document.getElementById('xtend-docs-resume-bootstrap');
let classicLoaderPromise = null;

function startClassicLoader() {
  if (classicLoaderPromise) return classicLoaderPromise;
  if (!bootstrapNode) return Promise.resolve();
  const existing = document.querySelector('script[data-xtend-docs-deferred-loader]');
  if (existing) {
    classicLoaderPromise = window.__XTendLoaderBootPromise
      ? Promise.resolve(window.__XTendLoaderBootPromise)
      : Promise.resolve();
    return classicLoaderPromise;
  }
  const loader = document.createElement('script');
  loader.type = 'module';
  loader.src = bootstrapNode.dataset.loaderSrc || '/xtend-loader.js';
  loader.dataset.manifest = bootstrapNode.dataset.loaderManifest || '/components/manifest.json';
  loader.dataset.moduleCacheBust = bootstrapNode.dataset.moduleCacheBust || '';
  loader.dataset.xtendDocsDeferredLoader = 'true';
  classicLoaderPromise = new Promise((resolve) => {
    loader.addEventListener('load', () => {
      Promise.resolve(window.__XTendLoaderBootPromise).catch(() => null).finally(resolve);
    }, { once: true });
    loader.addEventListener('error', resolve, { once: true });
  });
  document.head.append(loader);
  return classicLoaderPromise;
}

function decodeBase64(value) {
  const binary = atob(String(value || ''));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeBase64Url(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  return decodeBase64(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
}

async function verifyResumeEnvelope(canonicalPayload, integrity, envelope, publicKeyOverride = null) {
  const publicKey = publicKeyOverride || (prehydration && prehydration.resumePublicKey);
  if (
    !publicKey
    || publicKey.schema !== 'xtend.docs.resume-public-key.v1'
    || publicKey.keyId !== integrity.keyId
    || integrity.algorithm !== 'ECDSA-P256-SHA256'
    || !crypto.subtle
  ) {
    return { ok: false, reason: 'docs-resume-public-key-unavailable' };
  }
  try {
    const key = await crypto.subtle.importKey(
      'spki',
      decodeBase64(publicKey.value),
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
    const verified = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      decodeBase64Url(integrity.signature),
      new TextEncoder().encode(canonicalPayload)
    );
    return { ok: verified, verified, reason: verified ? 'verified' : 'signature-invalid' };
  } catch (error) {
    return { ok: false, reason: 'signature-verification-failed', message: error && error.message };
  }
}

window.xtendDocsVerifyResumeEnvelope = verifyResumeEnvelope;

window.__XTendMaracaDisableAutoBoot = true;

try {
  const maraca = await import('../generated/shell/xtend.maraca.mjs');
  const capturedIntents = typeof window.__xtendDocsConsumePrebootIntents === 'function'
    ? window.__xtendDocsConsumePrebootIntents()
    : [];
  const generation = prehydration && prehydration.resume && prehydration.resume.generation;
  const intentQueue = capturedIntents.map((intent) => ({ ...intent, generation }));
  window.xtendDocsMaracaBootResult = await maraca.bootXtendMaraca({
    root,
    adoptExisting: true,
    intentQueue,
    verifyResumeEnvelope
  });
  document.documentElement.setAttribute(
    'data-xtend-docs-rmt-activation',
    window.xtendDocsMaracaBootResult && window.xtendDocsMaracaBootResult.resume
      ? window.xtendDocsMaracaBootResult.resume.status
      : 'hydrate'
  );
  const resumeReasons = window.xtendDocsMaracaBootResult
    && window.xtendDocsMaracaBootResult.resume
    && Array.isArray(window.xtendDocsMaracaBootResult.resume.reasons)
      ? window.xtendDocsMaracaBootResult.resume.reasons.filter(Boolean)
      : [];
  if (resumeReasons.length > 0) {
    root.setAttribute('data-rmt-resume-reasons', resumeReasons.join(','));
  }
  await startClassicLoader();
} catch (error) {
  document.documentElement.setAttribute('data-xtend-docs-rmt-activation', 'degraded');
  if (root) root.setAttribute('data-rmt-resume-error', error && error.message ? error.message : String(error));
  window.dispatchEvent(new CustomEvent('xtend-docs-resume-error', {
    detail: {
      schema: 'xtend.docs.php-ssr-resume.v3',
      message: error && error.message ? error.message : String(error)
    }
  }));
  await startClassicLoader();
} finally {
  if (typeof window.__xtendDocsResolveRmtBoot === 'function') {
    window.__xtendDocsResolveRmtBoot(window.xtendDocsMaracaBootResult || null);
    delete window.__xtendDocsResolveRmtBoot;
  }
}

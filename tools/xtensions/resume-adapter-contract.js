'use strict';

const XTENSIONS_RESUME_ADAPTER_SCHEMA = 'xtend.xtensions.resume-adapter.v1';
const XTENSIONS_RESUME_MANIFEST_SCHEMA = 'xtend.xtensions.resume-manifest.v1';
const XTENSIONS_RESUME_RESULT_SCHEMA = 'xtend.xtensions.resume-result.v1';

const XTENSIONS_RESUME_ADOPTION_STRATEGIES = Object.freeze(['dom_hydrate', 'host_activate']);
const XTENSIONS_RESUME_RESULT_STATUSES = Object.freeze(['resumed', 'fallback_hydrated', 'rejected']);

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function createDiagnostic(code, message, field = null) {
  return { schema: 'xtend.xtensions.resume-diagnostic.v1', code, severity: 'error', message, field };
}

function normalizeXTensionResumeManifest(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const manifest = {
    schema: XTENSIONS_RESUME_MANIFEST_SCHEMA,
    id: normalizeString(source.id || source.xtension),
    clientEntry: normalizeString(source.clientEntry || source.entry && source.entry.client),
    serverEntry: normalizeString(source.serverEntry || source.entry && source.entry.server),
    bundleIntegrity: normalizeString(source.bundleIntegrity || source.integrity && source.integrity.digest),
    snapshotSchema: normalizeString(source.snapshotSchema || source.snapshot && source.snapshot.schema),
    adoptionStrategy: normalizeString(source.adoptionStrategy || source.adoption && source.adoption.strategy),
    diagnostics: []
  };
  if (!manifest.id) manifest.diagnostics.push(createDiagnostic('xtensions.resume.id_missing', 'Resume manifest requires an XTension id.', 'id'));
  if (!manifest.clientEntry) manifest.diagnostics.push(createDiagnostic('xtensions.resume.client_entry_missing', 'Resume manifest requires a client entry.', 'clientEntry'));
  if (!manifest.serverEntry) manifest.diagnostics.push(createDiagnostic('xtensions.resume.server_entry_missing', 'Resume manifest requires a server entry or host fragment provider.', 'serverEntry'));
  if (!manifest.bundleIntegrity) manifest.diagnostics.push(createDiagnostic('xtensions.resume.integrity_missing', 'Resume manifest requires bundle integrity.', 'bundleIntegrity'));
  if (!manifest.snapshotSchema) manifest.diagnostics.push(createDiagnostic('xtensions.resume.snapshot_schema_missing', 'Resume manifest requires a snapshot schema.', 'snapshotSchema'));
  if (!XTENSIONS_RESUME_ADOPTION_STRATEGIES.includes(manifest.adoptionStrategy)) {
    manifest.diagnostics.push(createDiagnostic('xtensions.resume.adoption_strategy_invalid', 'Resume manifest adoption strategy must be dom_hydrate or host_activate.', 'adoptionStrategy'));
  }
  manifest.ok = manifest.diagnostics.length === 0;
  return Object.freeze(manifest);
}

function normalizeResult(status, manifest, result = {}, diagnostics = []) {
  return Object.freeze({
    schema: XTENSIONS_RESUME_RESULT_SCHEMA,
    ok: status === 'resumed' || status === 'fallback_hydrated',
    status,
    xtensionId: manifest.id || null,
    adoptionStrategy: manifest.adoptionStrategy || null,
    generation: result && result.generation || null,
    nodeIdentityPreserved: result && result.nodeIdentityPreserved === true,
    diagnostics: diagnostics.concat(Array.isArray(result && result.diagnostics) ? result.diagnostics.map(cloneJson) : []),
    metadata: cloneJson(result && result.metadata || {})
  });
}

function createXTensionResumeAdapter(options = {}) {
  const controller = options.controller && typeof options.controller === 'object' ? options.controller : {};
  const manifest = normalizeXTensionResumeManifest(options.manifest || {});
  return Object.freeze({
    schema: XTENSIONS_RESUME_ADAPTER_SCHEMA,
    manifest,
    async adopt(target, props = {}, resumeContext = {}) {
      if (!manifest.ok) return normalizeResult('rejected', manifest, {}, manifest.diagnostics);
      if (!target || typeof target !== 'object') {
        return normalizeResult('rejected', manifest, {}, [createDiagnostic('xtensions.resume.target_missing', 'Resume adoption requires an existing target node.', 'target')]);
      }
      if (typeof controller.adopt !== 'function') {
        return normalizeResult('rejected', manifest, {}, [createDiagnostic('xtensions.resume.adopt_missing', 'Resume controller must implement adopt(target, props, resumeContext).', 'controller.adopt')]);
      }
      try {
        const result = await controller.adopt(target, cloneJson(props) || {}, {
          ...resumeContext,
          schema: XTENSIONS_RESUME_ADAPTER_SCHEMA,
          adoptionStrategy: manifest.adoptionStrategy,
          manifest
        });
        const reported = normalizeString(result && result.status);
        if (reported === 'mounted' || reported === 'mount' || reported === 'ok') {
          return normalizeResult('rejected', manifest, result, [createDiagnostic('xtensions.resume.remount_reported', 'A mount result cannot be normalized as successful resume.', 'status')]);
        }
        if (!['resumed', 'dom_hydrated', 'host_activated'].includes(reported)) {
          return normalizeResult('rejected', manifest, result, [createDiagnostic('xtensions.resume.result_invalid', 'Adoption did not report a valid resume result.', 'status')]);
        }
        return normalizeResult('resumed', manifest, {
          ...result,
          nodeIdentityPreserved: result.nodeIdentityPreserved !== false
        });
      } catch (error) {
        return normalizeResult('rejected', manifest, {}, [createDiagnostic('xtensions.resume.adopt_failed', error && error.message ? error.message : String(error), 'controller.adopt')]);
      }
    },
    async fallbackHydrate(target, props = {}, resumeContext = {}) {
      if (typeof options.hydrate !== 'function') {
        return normalizeResult('rejected', manifest, {}, [createDiagnostic('xtensions.resume.hydrate_fallback_missing', 'Explicit hydration fallback is unavailable.', 'hydrate')]);
      }
      try {
        const result = await options.hydrate(target, cloneJson(props) || {}, resumeContext);
        return normalizeResult('fallback_hydrated', manifest, result || {});
      } catch (error) {
        return normalizeResult('rejected', manifest, {}, [createDiagnostic('xtensions.resume.hydrate_fallback_failed', error && error.message ? error.message : String(error), 'hydrate')]);
      }
    }
  });
}

module.exports = {
  XTENSIONS_RESUME_ADAPTER_SCHEMA,
  XTENSIONS_RESUME_MANIFEST_SCHEMA,
  XTENSIONS_RESUME_RESULT_SCHEMA,
  XTENSIONS_RESUME_ADOPTION_STRATEGIES,
  XTENSIONS_RESUME_RESULT_STATUSES,
  normalizeXTensionResumeManifest,
  createXTensionResumeAdapter
};

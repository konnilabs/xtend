import {
  RMT_RESUME_ADAPTER_SCHEMA,
  cloneSafe,
  objectRecord,
  toArray
} from './rmt-resume-protocol.mjs';

function resolveAdopter(adopters, record) {
  if (adopters instanceof Map) return adopters.get(record.id || record.key || record.surfaceId) || null;
  if (Array.isArray(adopters)) {
    return adopters.find((entry) => entry && (
      entry.id === record.id
      || entry.key === record.key
      || entry.surfaceId === record.surfaceId
    )) || null;
  }
  return objectRecord(adopters)[record.id || record.key || record.surfaceId] || null;
}

export function createRmtResumeCommandAdapter(options = {}) {
  function restoreState(envelope, callOptions = {}) {
    const snapshot = objectRecord(envelope.snapshot);
    const state = objectRecord(snapshot.state);
    const restore = callOptions.restoreState || options.restoreState;
    if (typeof restore === 'function') {
      const result = restore(cloneSafe(state, {}), cloneSafe(snapshot, {}), envelope);
      return { count: Object.keys(state).length, result };
    }
    const stateRuntime = callOptions.stateRuntime || options.stateRuntime;
    if (!stateRuntime || typeof stateRuntime.setState !== 'function') return { count: 0, result: null };
    const knownStates = new Set(toArray(stateRuntime.stateDefinitions)
      .map((definition) => definition && definition.id)
      .filter(Boolean));
    let count = 0;
    Object.entries(state).forEach(([id, value]) => {
      if (knownStates.size > 0 && !knownStates.has(id)) return;
      stateRuntime.setState(id, cloneSafe(value, value), {
        operation: 'server-resume',
        generation: envelope.generation
      });
      count += 1;
    });
    return { count, result: null };
  }

  async function adoptRoot(root, envelope, response, callOptions = {}) {
    const adopt = callOptions.adoptRoot || options.adoptRoot;
    return typeof adopt === 'function' ? adopt(root, envelope, response) : null;
  }

  async function adoptXtensions(envelope, root, callOptions = {}) {
    const records = toArray(envelope.xtensions);
    const adopters = callOptions.adopters || options.adopters || {};
    const results = [];
    for (const record of records) {
      const adopter = resolveAdopter(adopters, objectRecord(record));
      const adopt = typeof adopter === 'function' ? adopter : adopter && adopter.adopt;
      if (typeof adopt !== 'function') {
        throw Object.assign(new Error(`Missing resume adopter for ${record.id || record.key || record.surfaceId || 'unknown XTension'}.`), {
          code: 'rmt.resume.xtension_adopter_missing'
        });
      }
      const result = await adopt({
        schema: RMT_RESUME_ADAPTER_SCHEMA,
        root,
        record: cloneSafe(record, {}),
        generation: envelope.generation,
        snapshot: cloneSafe(envelope.snapshot, {}),
        envelope: cloneSafe(envelope, {})
      });
      if (!result || result.ok === false || !['resumed', 'dom_hydrated', 'host_activated'].includes(result.status)) {
        throw Object.assign(new Error(`Resume adopter rejected ${record.id || record.key || record.surfaceId || 'XTension'}.`), {
          code: 'rmt.resume.xtension_adoption_failed',
          result
        });
      }
      results.push(result);
    }
    return results;
  }

  async function replayIntents(envelope, intents, callOptions = {}) {
    const replay = callOptions.replayIntent || options.replayIntent;
    if (typeof replay !== 'function') return { count: 0, results: [] };
    const results = [];
    for (const intent of toArray(intents)) {
      results.push(await replay(cloneSafe(intent, {}), envelope));
    }
    return { count: results.length, results };
  }

  async function hydrateFallback(response, request, context, callOptions = {}) {
    const hydrate = callOptions.hydrateResponse || options.hydrateResponse;
    if (typeof hydrate !== 'function') return { available: false, result: null };
    const result = await hydrate(response, request, {
      ...callOptions,
      root: context.root,
      executionMode: 'server_prerender_hydrate',
      resumeRejected: true,
      resumeReasons: context.reasons.slice()
    });
    return { available: true, result };
  }

  return Object.freeze({
    schema: 'xtend.rmt.resume-command-adapter.v1',
    restoreState,
    adoptRoot,
    adoptXtensions,
    replayIntents,
    hydrateFallback
  });
}

export default Object.freeze({ createRmtResumeCommandAdapter });

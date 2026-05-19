(function attachRmtActionEffectRuntime(globalTarget) {
  const RMT_ACTION_EFFECT_RUNTIME_SCHEMA = 'xtend.epic18.rmt-action-effect-runtime.v1';
  const RMT_ACTION_EFFECT_DIAGNOSTIC_SCHEMA = 'xtend.epic18.rmt-action-effect-diagnostic.v1';
  const DEFAULT_DIAGNOSTIC_CHANNEL = 'rmt.app_platform.action_effect';

  function clampString(value, fallback = '') {
    const normalized = String(value == null ? '' : value).trim();
    return normalized || fallback;
  }

  function toArray(value) {
    return Array.isArray(value) ? value : (value == null ? [] : [value]);
  }

  function objectRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function cloneValue(value, fallback = null) {
    if (typeof value === 'undefined') return fallback;
    if (value === null || typeof value !== 'object') return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return value;
    }
  }

  function readPath(source, path) {
    if (!path) return source;
    if (source && typeof source === 'object' && Object.prototype.hasOwnProperty.call(source, path)) return source[path];
    const parts = String(path).split('.').filter(Boolean);
    let cursor = source;
    for (const part of parts) {
      if (cursor == null) return undefined;
      if (part === 'length' && (Array.isArray(cursor) || typeof cursor === 'string')) return cursor.length;
      cursor = cursor[part];
    }
    return cursor;
  }

  function resolveValue(value, context = {}) {
    if (typeof value !== 'string') return value;
    if (value === '$payload') return context.payload;
    if (value.startsWith('$payload.')) return readPath(context.payload, value.slice(9));
    if (value === '$result') return context.result;
    if (value.startsWith('$result.')) return readPath(context.result, value.slice(8));
    if (value === '$error') return context.error;
    if (value.startsWith('$error.')) return readPath(context.error, value.slice(7));
    if (value === '$action') return context.action;
    if (value.startsWith('$state.') && context.stateRuntime && typeof context.stateRuntime.getState === 'function') {
      return context.stateRuntime.getState(`state.${value.slice(7)}`);
    }
    return value;
  }

  function createDiagnosticsRecorder(deps = {}) {
    const diagnostics = [];
    const diagnosticsHub = deps.diagnosticsHub || null;
    const channel = clampString(deps.diagnosticChannel, DEFAULT_DIAGNOSTIC_CHANNEL);
    return {
      diagnostics,
      publish(diagnostic) {
        diagnostics.push(diagnostic);
        if (diagnosticsHub && typeof diagnosticsHub.publish === 'function') {
          diagnosticsHub.publish(channel, diagnostic, {
            schema: RMT_ACTION_EFFECT_DIAGNOSTIC_SCHEMA
          });
        }
        return diagnostic;
      }
    };
  }

  function createDiagnostic(code, message, details = {}, severity = 'info') {
    return {
      schema: RMT_ACTION_EFFECT_DIAGNOSTIC_SCHEMA,
      code,
      message,
      severity,
      details: cloneValue(details, {})
    };
  }

  function normalizeActions(actions) {
    return toArray(actions).map((action) => ({
      ...objectRecord(action),
      id: clampString(action && action.id),
      datasource: clampString(action && (action.datasource || action.dataSource), ''),
      resultState: clampString(action && (action.resultState || action.result), ''),
      loadingState: clampString(action && action.loadingState, ''),
      statusState: clampString(action && action.statusState, ''),
      resourceOwner: clampString(action && action.resourceOwner, action && action.id),
      effects: toArray(action && (action.effects || action.effect)).map((effect) => typeof effect === 'string' ? effect : clampString(effect && effect.id)).filter(Boolean),
      resources: toArray(action && action.resources).map((resource) => typeof resource === 'string' ? resource : clampString(resource && resource.id)).filter(Boolean),
      cancelable: action && action.cancelable !== false
    })).filter((action) => action.id);
  }

  function normalizeDataSources(dataSources) {
    return toArray(dataSources).map((source) => ({
      ...objectRecord(source),
      id: clampString(source && source.id),
      kind: clampString(source && (source.kind || source.type), 'fixture'),
      records: cloneValue(source && (source.records || source.data), []),
      payload: cloneValue(source && source.payload, null),
      endpoint: clampString(source && (source.endpoint || source.url), ''),
      adapter: clampString(source && source.adapter, ''),
      resultPath: clampString(source && source.resultPath, ''),
      delayMs: Number.isFinite(source && source.delayMs) ? source.delayMs : 0
    })).filter((source) => source.id);
  }

  function normalizeEffects(effects) {
    return toArray(effects).map((effect) => ({
      ...objectRecord(effect),
      id: clampString(effect && effect.id),
      kind: clampString(effect && (effect.kind || effect.type), 'side-effect'),
      target: clampString(effect && effect.target, ''),
      message: effect && Object.prototype.hasOwnProperty.call(effect, 'message') ? effect.message : '',
      path: effect && Object.prototype.hasOwnProperty.call(effect, 'path') ? effect.path : '',
      severity: clampString(effect && effect.severity, 'info'),
      resource: clampString(effect && effect.resource, ''),
      resources: toArray(effect && effect.resources).map((entry) => typeof entry === 'string' ? entry : clampString(entry && entry.id)).filter(Boolean)
    })).filter((effect) => effect.id);
  }

  function normalizeResources(resources) {
    return toArray(resources).map((resource) => ({
      ...objectRecord(resource),
      id: clampString(resource && resource.id),
      kind: clampString(resource && (resource.kind || resource.type), 'generic'),
      owner: clampString(resource && resource.owner, ''),
      source: resource && Object.prototype.hasOwnProperty.call(resource, 'source') ? resource.source : null,
      importId: clampString(resource && (resource.importId || resource.module), ''),
      delayMs: Number.isFinite(resource && resource.delayMs) ? resource.delayMs : 0
    })).filter((resource) => resource.id);
  }

  function createRmtResourceManager(options = {}) {
    const resources = normalizeResources(options.resources);
    const resourceIndex = new Map(resources.map((resource) => [resource.id, resource]));
    const ownership = new Map();
    const acquisitions = [];
    const disposals = [];
    const adapters = objectRecord(options.resourceAdapters);

    function addOwned(ownerId, record) {
      const owner = clampString(ownerId, 'global');
      const list = ownership.get(owner) || [];
      list.push(record);
      ownership.set(owner, list);
      acquisitions.push({ owner, resourceId: record.resourceId, kind: record.kind });
      return record;
    }

    async function acquire(resourceId, ownerId = 'global', context = {}) {
      const resource = resourceIndex.get(clampString(resourceId));
      if (!resource) throw new Error(`RMT Resource ${resourceId} ist nicht definiert.`);
      const owner = clampString(ownerId || resource.owner, 'global');
      let value = cloneValue(resource.source, resource.source);
      let dispose = () => undefined;

      if (resource.kind === 'object-url') {
        const factory = options.objectUrlFactory || adapters.objectUrl || null;
        if (factory && typeof factory.create === 'function') {
          value = factory.create(resolveValue(resource.source, context));
          dispose = () => {
            if (typeof factory.revoke === 'function') factory.revoke(value);
          };
        } else {
          value = `rmt-object-url:${resource.id}`;
        }
      } else if (resource.kind === 'lazy-import') {
        const importer = options.importAdapter || adapters.import || null;
        value = importer && typeof importer.load === 'function'
          ? await importer.load(resource.importId || resource.id, context)
          : { module: resource.importId || resource.id, loaded: true };
      } else if (resource.kind === 'timer') {
        const timer = options.timerAdapter || adapters.timer || null;
        value = timer && typeof timer.set === 'function'
          ? timer.set(resource.delayMs, context)
          : { delayMs: resource.delayMs, scheduled: true };
        dispose = () => {
          if (timer && typeof timer.clear === 'function') timer.clear(value);
        };
      } else if (resource.kind === 'stream' || resource.kind === 'observer') {
        const adapter = adapters[resource.kind] || null;
        value = adapter && typeof adapter.open === 'function'
          ? await adapter.open(resource, context)
          : { id: resource.id, kind: resource.kind, open: true };
        dispose = () => {
          if (adapter && typeof adapter.close === 'function') adapter.close(value);
        };
      }

      return addOwned(owner, {
        resourceId: resource.id,
        kind: resource.kind,
        value,
        dispose
      });
    }

    async function acquireMany(resourceIds, ownerId, context = {}) {
      const records = [];
      for (const resourceId of toArray(resourceIds)) {
        records.push(await acquire(resourceId, ownerId, context));
      }
      return records;
    }

    function releaseOwner(ownerId = 'global') {
      const owner = clampString(ownerId, 'global');
      const list = ownership.get(owner) || [];
      list.forEach((record) => {
        if (record && typeof record.dispose === 'function') record.dispose();
        disposals.push({ owner, resourceId: record.resourceId, kind: record.kind });
      });
      ownership.delete(owner);
      return {
        schema: 'xtend.epic18.rmt-resource-release.v1',
        owner,
        releasedCount: list.length
      };
    }

    return Object.freeze({
      schema: RMT_ACTION_EFFECT_RUNTIME_SCHEMA,
      acquire,
      acquireMany,
      releaseOwner,
      listOwned(ownerId) {
        return (ownership.get(clampString(ownerId, 'global')) || []).map((entry) => ({
          resourceId: entry.resourceId,
          kind: entry.kind,
          value: cloneValue(entry.value, entry.value)
        }));
      },
      listAcquisitions() {
        return acquisitions.map((entry) => cloneValue(entry, entry));
      },
      listDisposals() {
        return disposals.map((entry) => cloneValue(entry, entry));
      }
    });
  }

  async function runDataSource(source, payload, options = {}) {
    const context = options.context || {};
    const adapters = objectRecord(options.dataSourceAdapters);
    if (source.kind === 'fixture') {
      return cloneValue(source.records, []);
    }
    if (source.kind === 'ssr') {
      const response = cloneValue(source.payload, source.payload);
      return source.resultPath ? readPath(response, source.resultPath) : response;
    }
    if (source.kind === 'host') {
      const adapter = adapters[source.adapter] || adapters[source.id] || adapters.host;
      if (!adapter || typeof adapter.invoke !== 'function') throw new Error(`RMT Host DataSource Adapter fuer ${source.id} fehlt.`);
      const response = await adapter.invoke({ source, payload, context });
      return source.resultPath ? readPath(response, source.resultPath) : response;
    }
    if (source.kind === 'rest') {
      const adapter = adapters[source.adapter] || adapters.rest || null;
      if (!adapter || typeof adapter.fetch !== 'function') throw new Error(`RMT REST DataSource Adapter fuer ${source.id} fehlt.`);
      const response = await adapter.fetch(source.endpoint, { payload, source, context });
      return source.resultPath ? readPath(response, source.resultPath) : response;
    }
    throw new Error(`RMT DataSource Kind ${source.kind} wird nicht unterstuetzt.`);
  }

  function normalizeError(error) {
    return {
      name: clampString(error && error.name, 'Error'),
      message: clampString(error && error.message, String(error || 'Unbekannter RMT Action Fehler.'))
    };
  }

  function writeState(stateRuntime, stateId, value, metadata = {}) {
    if (!stateRuntime || !stateId) return null;
    if (typeof stateRuntime.setState === 'function') return stateRuntime.setState(stateId, value, metadata);
    return null;
  }

  function patchState(stateRuntime, stateId, patch, metadata = {}) {
    if (!stateRuntime || !stateId) return null;
    if (typeof stateRuntime.patchState === 'function') return stateRuntime.patchState(stateId, patch, metadata);
    return null;
  }

  function createRmtActionEffectRuntime(options = {}) {
    const diagnosticsRecorder = createDiagnosticsRecorder(options);
    const actions = normalizeActions(options.actions);
    const dataSources = normalizeDataSources(options.dataSources || options.datasources);
    const effects = normalizeEffects(options.effects);
    const actionIndex = new Map(actions.map((action) => [action.id, action]));
    const dataSourceIndex = new Map(dataSources.map((source) => [source.id, source]));
    const effectIndex = new Map(effects.map((effect) => [effect.id, effect]));
    const stateRuntime = options.stateRuntime || null;
    const resourceManager = options.resourceManager || createRmtResourceManager(options);
    const feedbackAdapter = options.feedbackAdapter || null;
    const navigationAdapter = options.navigationAdapter || null;
    const focusAdapter = options.focusAdapter || null;
    const effectAdapter = options.effectAdapter || null;
    const actionStatus = {};
    const actionHistory = [];
    const activeRuns = new Map();

    async function runEffect(effectId, context = {}) {
      const effect = effectIndex.get(clampString(effectId));
      if (!effect) throw new Error(`RMT Effect ${effectId} ist nicht definiert.`);
      let value = null;
      if (effect.kind === 'toast' || effect.kind === 'feedback') {
        value = {
          id: effect.id,
          target: effect.target,
          severity: effect.severity,
          message: resolveValue(effect.message, context)
        };
        if (feedbackAdapter && typeof feedbackAdapter.publish === 'function') feedbackAdapter.publish(value, context);
      } else if (effect.kind === 'navigation') {
        value = resolveValue(effect.path, context);
        if (navigationAdapter && typeof navigationAdapter.navigate === 'function') navigationAdapter.navigate(value, context);
      } else if (effect.kind === 'focus') {
        value = effect.target;
        if (focusAdapter && typeof focusAdapter.focus === 'function') focusAdapter.focus(value, context);
      } else if (effect.kind === 'lazy-import') {
        value = await resourceManager.acquireMany(effect.resources.length ? effect.resources : [effect.resource], context.ownerId, context);
      } else {
        value = {
          id: effect.id,
          kind: effect.kind,
          payload: cloneValue(context.result, context.result)
        };
        if (effectAdapter && typeof effectAdapter.invoke === 'function') effectAdapter.invoke(effect, context);
      }
      return {
        id: effect.id,
        kind: effect.kind,
        value: cloneValue(value, value)
      };
    }

    async function runAction(actionId, payload = {}, metadata = {}) {
      const action = actionIndex.get(clampString(actionId));
      if (!action) throw new Error(`RMT Action ${actionId} ist nicht definiert.`);
      const source = action.datasource ? dataSourceIndex.get(action.datasource) : null;
      const runId = `${action.id}:${Date.now()}:${actionHistory.length}`;
      const ownerId = clampString(metadata.ownerId, action.resourceOwner || action.id);
      const token = { cancelled: false };
      activeRuns.set(runId, token);
      actionStatus[action.id] = 'loading';
      patchState(stateRuntime, action.statusState, { status: 'loading', action: action.id }, { operation: 'action.loading', action: action.id });
      if (action.loadingState) writeState(stateRuntime, action.loadingState, true, { operation: 'action.loading', action: action.id });
      diagnosticsRecorder.publish(createDiagnostic('rmt.action.loading', `RMT Action ${action.id} laeuft.`, { action: action.id }, 'info'));
      try {
        await resourceManager.acquireMany(action.resources, ownerId, { action, payload, stateRuntime });
        if (token.cancelled) {
          return cancelResult(action, runId, ownerId, payload, metadata);
        }
        const data = source
          ? await runDataSource(source, payload, { dataSourceAdapters: options.dataSourceAdapters, context: { action, payload, stateRuntime } })
          : cloneValue(payload, payload);
        if (token.cancelled) {
          return cancelResult(action, runId, ownerId, payload, metadata);
        }
        if (action.resultState) writeState(stateRuntime, action.resultState, data, { operation: 'action.success', action: action.id });
        if (action.loadingState) writeState(stateRuntime, action.loadingState, false, { operation: 'action.success', action: action.id });
        patchState(stateRuntime, action.statusState, { status: 'success', action: action.id }, { operation: 'action.success', action: action.id });
        const effectResults = [];
        for (const effectId of action.effects) {
          effectResults.push(await runEffect(effectId, { action, payload, result: data, stateRuntime, ownerId }));
        }
        actionStatus[action.id] = 'success';
        diagnosticsRecorder.publish(createDiagnostic('rmt.action.success', `RMT Action ${action.id} war erfolgreich.`, { action: action.id }, 'info'));
        const result = {
          schema: 'xtend.epic18.rmt-action-result.v1',
          id: action.id,
          runId,
          status: 'success',
          data: cloneValue(data, data),
          effects: effectResults,
          diagnostics: diagnosticsRecorder.diagnostics.slice()
        };
        actionHistory.push(result);
        return result;
      } catch (error) {
        if (action.loadingState) writeState(stateRuntime, action.loadingState, false, { operation: 'action.error', action: action.id });
        patchState(stateRuntime, action.statusState, { status: 'error', action: action.id, error: normalizeError(error) }, { operation: 'action.error', action: action.id });
        actionStatus[action.id] = 'error';
        diagnosticsRecorder.publish(createDiagnostic('rmt.action.error', `RMT Action ${action.id} ist fehlgeschlagen.`, { action: action.id, error: normalizeError(error) }, 'error'));
        const result = {
          schema: 'xtend.epic18.rmt-action-result.v1',
          id: action.id,
          runId,
          status: 'error',
          error: normalizeError(error),
          diagnostics: diagnosticsRecorder.diagnostics.slice()
        };
        actionHistory.push(result);
        return result;
      } finally {
        activeRuns.delete(runId);
      }
    }

    function cancelResult(action, runId, ownerId, payload, metadata = {}) {
      activeRuns.delete(runId);
      actionStatus[action.id] = 'cancelled';
      if (action.loadingState) writeState(stateRuntime, action.loadingState, false, { operation: 'action.cancelled', action: action.id });
      patchState(stateRuntime, action.statusState, { status: 'cancelled', action: action.id }, { operation: 'action.cancelled', action: action.id });
      resourceManager.releaseOwner(ownerId);
      diagnosticsRecorder.publish(createDiagnostic('rmt.action.cancelled', `RMT Action ${action.id} wurde abgebrochen.`, { action: action.id }, 'warning'));
      const result = {
        schema: 'xtend.epic18.rmt-action-result.v1',
        id: action.id,
        runId,
        status: 'cancelled',
        payload: cloneValue(payload, payload),
        metadata: cloneValue(metadata, {}),
        diagnostics: diagnosticsRecorder.diagnostics.slice()
      };
      actionHistory.push(result);
      return result;
    }

    function cancelAction(actionId) {
      const id = clampString(actionId);
      let cancelled = 0;
      activeRuns.forEach((token, runId) => {
        if (runId.startsWith(`${id}:`)) {
          token.cancelled = true;
          cancelled += 1;
        }
      });
      return {
        schema: 'xtend.epic18.rmt-action-cancel.v1',
        action: id,
        cancelled
      };
    }

    return Object.freeze({
      schema: RMT_ACTION_EFFECT_RUNTIME_SCHEMA,
      runAction,
      cancelAction,
      runEffect,
      resourceManager,
      listActions() {
        return actions.map((entry) => cloneValue(entry, entry));
      },
      listDataSources() {
        return dataSources.map((entry) => cloneValue(entry, entry));
      },
      listEffects() {
        return effects.map((entry) => cloneValue(entry, entry));
      },
      getActionStatus(id) {
        return actionStatus[clampString(id)] || 'idle';
      },
      listHistory() {
        return actionHistory.map((entry) => cloneValue(entry, entry));
      },
      listDiagnostics() {
        return diagnosticsRecorder.diagnostics.slice();
      }
    });
  }

  const api = {
    RMT_ACTION_EFFECT_DIAGNOSTIC_SCHEMA,
    RMT_ACTION_EFFECT_RUNTIME_SCHEMA,
    createRmtActionEffectRuntime,
    createRmtResourceManager
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalTarget) {
    globalTarget.XTendRmtActionEffectRuntime = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_ACTION_EFFECT_RUNTIME_API__ = globalThis.XTendRmtActionEffectRuntime;

export const RMT_ACTION_EFFECT_DIAGNOSTIC_SCHEMA = __XTEND_RMT_ACTION_EFFECT_RUNTIME_API__.RMT_ACTION_EFFECT_DIAGNOSTIC_SCHEMA;
export const RMT_ACTION_EFFECT_RUNTIME_SCHEMA = __XTEND_RMT_ACTION_EFFECT_RUNTIME_API__.RMT_ACTION_EFFECT_RUNTIME_SCHEMA;
export const createRmtActionEffectRuntime = __XTEND_RMT_ACTION_EFFECT_RUNTIME_API__.createRmtActionEffectRuntime;
export const createRmtResourceManager = __XTEND_RMT_ACTION_EFFECT_RUNTIME_API__.createRmtResourceManager;

export default __XTEND_RMT_ACTION_EFFECT_RUNTIME_API__;

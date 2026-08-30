function createRmtActionEffectRuntimeModule() {
  const RMT_ACTION_EFFECT_RUNTIME_SCHEMA = 'xtend.epic18.rmt-action-effect-runtime.v1';
  const RMT_ACTION_EFFECT_DIAGNOSTIC_SCHEMA = 'xtend.epic18.rmt-action-effect-diagnostic.v1';
  const RMT_COMPONENT_COMMAND_SCHEMA = 'xtend.rmt.component-command.v1';
  const RMT_COMPONENT_COMMAND_NAMES = new Set(['focus', 'reset', 'snapshot']);
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
    const objectTag = Object.prototype.toString.call(value);
    if (objectTag === '[object File]' || objectTag === '[object Blob]') return value;
    if (objectTag === '[object FileList]') return Array.from(value);
    if (Array.isArray(value)) return value.map((entry) => cloneValue(entry, entry));
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      const result = {};
      Object.entries(value).forEach(([key, entry]) => {
        result[key] = cloneValue(entry, entry);
      });
      return result;
    }
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
      reducers: toArray(action && action.reducers).map((reducer) => typeof reducer === 'string' ? { command: reducer } : objectRecord(reducer)),
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
      service: clampString(effect && (effect.service || effect.serviceId), ''),
      mode: clampString(effect && effect.mode, ''),
      componentCommand: normalizeComponentCommand(effect && effect.componentCommand),
      payload: effect && Object.prototype.hasOwnProperty.call(effect, 'payload') ? effect.payload : '$result',
      resources: toArray(effect && effect.resources).map((entry) => typeof entry === 'string' ? entry : clampString(entry && entry.id)).filter(Boolean)
    })).filter((effect) => effect.id);
  }

  function normalizeComponentCommand(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = objectRecord(value);
    const target = objectRecord(record.target);
    return {
      schema: clampString(record.schema),
      command: clampString(record.command),
      target: {
        kind: clampString(target.kind),
        id: clampString(target.id),
        ref: clampString(target.ref),
        component: clampString(target.component)
      }
    };
  }

  function assertComponentCommand(commandRecord) {
    if (!commandRecord || commandRecord.schema !== RMT_COMPONENT_COMMAND_SCHEMA) {
      throw new Error(`RMT Component Command requires schema ${RMT_COMPONENT_COMMAND_SCHEMA}.`);
    }
    if (!RMT_COMPONENT_COMMAND_NAMES.has(commandRecord.command)) {
      throw new Error(`RMT Component Command ${commandRecord.command || '(missing)'} is not allowed.`);
    }
    if (commandRecord.target.kind !== 'surface' || !commandRecord.target.id || !commandRecord.target.component) {
      throw new Error('RMT Component Command requires a statically compiled surface target.');
    }
    return commandRecord;
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
    if (source.kind === 'host-service' || source.kind === 'service') {
      const registry = options.hostServiceRegistry || context.hostServiceRegistry || null;
      const serviceId = source.adapter || source.service || source.id;
      if (!registry || typeof registry.invoke !== 'function') throw new Error(`RMT Host Service Adapter fuer ${source.id} fehlt.`);
      const response = await registry.invoke(serviceId, payload, { ...context, dataSource: source });
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
    const normalized = {
      name: clampString(error && error.name, 'Error'),
      message: clampString(error && error.message, String(error || 'Unbekannter RMT Action Fehler.'))
    };
    const code = clampString(error && error.code);
    if (code) normalized.code = code;
    return normalized;
  }

  function createDeterministicActionHostPort() {
    function createAbortController() {
      const listeners = new Set();
      const signal = {
        aborted: false,
        reason: undefined,
        addEventListener(type, listener) {
          if (type === 'abort' && typeof listener === 'function') listeners.add(listener);
        },
        removeEventListener(type, listener) {
          if (type === 'abort') listeners.delete(listener);
        }
      };
      return {
        signal,
        abort(reason) {
          if (signal.aborted) return;
          signal.aborted = true;
          signal.reason = reason;
          Array.from(listeners).forEach((listener) => {
            try {
              listener.call(signal, { type: 'abort', target: signal });
            } catch (_) {}
          });
          listeners.clear();
        }
      };
    }
    return Object.freeze({
      schema: 'xtend.rmt.action-host-port.deterministic.v1',
      createAbortController
    });
  }

  function normalizeActionHostPort(options = {}) {
    const deterministicPort = createDeterministicActionHostPort();
    const injectedPort = options.hostPort || options.actionHostPort || {};
    return Object.freeze({
      schema: clampString(injectedPort.schema, 'xtend.rmt.action-host-port.v1'),
      createAbortController: typeof injectedPort.createAbortController === 'function'
        ? injectedPort.createAbortController.bind(injectedPort)
        : deterministicPort.createAbortController,
      createRunId: typeof injectedPort.createRunId === 'function'
        ? injectedPort.createRunId.bind(injectedPort)
        : null
    });
  }

  function submitModelOperation(modelCommandPort, operation, metadata = {}) {
    if (!modelCommandPort || !operation) return null;
    if (typeof modelCommandPort.execute === 'function') return modelCommandPort.execute(operation, metadata);
    if (typeof modelCommandPort.apply === 'function') return modelCommandPort.apply(operation, metadata);
    if (typeof modelCommandPort.dispatch === 'function') {
      if (operation.operation === 'dispatch') return modelCommandPort.dispatch(operation.command, operation.payload, metadata);
      return modelCommandPort.dispatch('rmt.model.operation', operation, metadata);
    }
    throw new TypeError('RMT Action Effect requires a Model Command port with execute(), apply() or dispatch().');
  }

  function writeState(modelCommandPort, stateId, value, metadata = {}) {
    if (!stateId) return null;
    return submitModelOperation(modelCommandPort, { operation: 'set', state: stateId, value }, metadata);
  }

  function patchState(modelCommandPort, stateId, patch, metadata = {}) {
    if (!stateId) return null;
    return submitModelOperation(modelCommandPort, { operation: 'patch', state: stateId, patch }, metadata);
  }

  function dispatchReducer(modelCommandPort, reducer, payload, metadata = {}) {
    if (!modelCommandPort || !reducer) return null;
    if (typeof reducer === 'string') {
      return submitModelOperation(modelCommandPort, { operation: 'dispatch', command: reducer, payload }, metadata);
    }
    const record = objectRecord(reducer);
    const command = clampString(record.command || record.id, '');
    if (command) {
      return submitModelOperation(modelCommandPort, { operation: 'dispatch', command, payload }, metadata);
    }
    if (record.state && Object.prototype.hasOwnProperty.call(record, 'set')) {
      return writeState(modelCommandPort, record.state, resolveValue(record.set, { payload, result: payload, stateRuntime: null }), metadata);
    }
    if (record.state && record.patch) {
      const patch = {};
      Object.entries(objectRecord(record.patch)).forEach(([key, value]) => {
        patch[key] = resolveValue(value, { payload, result: payload, stateRuntime: null });
      });
      return patchState(modelCommandPort, record.state, patch, metadata);
    }
    return null;
  }

  function planReducerOperation(reducer, payload, stateRuntime) {
    const record = typeof reducer === 'string' ? { command: reducer } : objectRecord(reducer);
    const command = clampString(record.command || record.id, '');
    if (command) {
      return { operation: 'dispatch', command, payload: cloneValue(payload, payload) };
    }
    if (record.state && Object.prototype.hasOwnProperty.call(record, 'set')) {
      return {
        operation: 'set',
        state: record.state,
        value: cloneValue(resolveValue(record.set, { payload, result: payload, stateRuntime }), null)
      };
    }
    if (record.state && record.patch) {
      const patch = {};
      Object.entries(objectRecord(record.patch)).forEach(([key, value]) => {
        patch[key] = cloneValue(resolveValue(value, { payload, result: payload, stateRuntime }), null);
      });
      return { operation: 'patch', state: record.state, patch };
    }
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
    const modelCommandPort = options.modelCommandPort || options.commandPort || null;
    const resourceManager = options.resourceManager || createRmtResourceManager(options);
    const feedbackAdapter = options.feedbackAdapter || null;
    const navigationAdapter = options.navigationAdapter || null;
    const focusAdapter = options.focusAdapter || null;
    const componentCommandAdapter = options.componentCommandAdapter || null;
    const effectAdapter = options.effectAdapter || null;
    const hostServiceRegistry = options.hostServiceRegistry || null;
    const hostPort = normalizeActionHostPort(options);
    const deferCustomEffects = options.deferCustomEffects === true;
    const planningOnly = options.planningOnly === true || options.managedController === true || !modelCommandPort;
    const actionStatus = {};
    const actionHistory = [];
    const activeRuns = new Map();
    let runSequence = 0;

    async function runEffect(effectId, context = {}) {
      const effect = effectIndex.get(clampString(effectId));
      if (!effect) throw new Error(`RMT Effect ${effectId} ist nicht definiert.`);
      let value = null;
      const preCommitEffect = ['lazy-import', 'host-service', 'service', 'stream-service'].includes(effect.kind);
      if (planningOnly && !preCommitEffect) {
        if (effect.componentCommand) assertComponentCommand(effect.componentCommand);
        value = {
          id: effect.id,
          kind: effect.kind,
          deferred: true,
          effect: cloneValue(effect, effect),
          payload: cloneValue(context.result, context.result),
          context: {
            action: context.action ? cloneValue(context.action, context.action) : null,
            payload: cloneValue(context.payload, context.payload || {}),
            result: cloneValue(context.result, context.result),
            ownerId: context.ownerId || null
          }
        };
        return { id: effect.id, kind: effect.kind, value: cloneValue(value, value) };
      }
      if (effect.componentCommand) {
        const componentCommand = assertComponentCommand(effect.componentCommand);
        value = {
          id: effect.id,
          kind: effect.kind,
          payload: cloneValue(context.result, context.result)
        };
        if (deferCustomEffects) {
          value.deferred = true;
          value.effect = cloneValue(effect, effect);
          value.context = {
            action: context.action ? cloneValue(context.action, context.action) : null,
            payload: cloneValue(context.payload, context.payload || {}),
            result: cloneValue(context.result, context.result),
            ownerId: context.ownerId || null
          };
        } else {
          if (!componentCommandAdapter || typeof componentCommandAdapter.invoke !== 'function') {
            throw new Error(`RMT Component Command Adapter fuer ${effect.id} fehlt.`);
          }
          value.result = await componentCommandAdapter.invoke(componentCommand, context);
        }
      } else if (effect.kind === 'toast' || effect.kind === 'feedback') {
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
      } else if (effect.kind === 'host-service' || effect.kind === 'service') {
        const registry = context.hostServiceRegistry || hostServiceRegistry;
        const serviceId = effect.service || effect.target || effect.id;
        if (!registry || typeof registry.invoke !== 'function') throw new Error(`RMT Host Service Effect Adapter fuer ${effect.id} fehlt.`);
        value = await registry.invoke(serviceId, resolveValue(effect.payload, context), {
          ...context,
          effect,
          correlationId: context.correlationId || context.commandEnvelope && context.commandEnvelope.correlationId
        });
      } else if (effect.kind === 'stream-service') {
        const registry = context.hostServiceRegistry || hostServiceRegistry;
        const serviceId = effect.service || effect.target || effect.id;
        if (!registry || typeof registry.stream !== 'function') throw new Error(`RMT Host Stream Service Adapter fuer ${effect.id} fehlt.`);
        value = await registry.stream(serviceId, resolveValue(effect.payload, context), context.streamHandlers || {}, {
          ...context,
          effect,
          correlationId: context.correlationId || context.commandEnvelope && context.commandEnvelope.correlationId
        });
      } else {
        value = {
          id: effect.id,
          kind: effect.kind,
          payload: cloneValue(context.result, context.result)
        };
        if (deferCustomEffects) {
          value.deferred = true;
          value.effect = cloneValue(effect, effect);
          value.context = {
            action: context.action ? cloneValue(context.action, context.action) : null,
            payload: cloneValue(context.payload, context.payload || {}),
            result: cloneValue(context.result, context.result),
            ownerId: context.ownerId || null
          };
        } else if (effectAdapter && typeof effectAdapter.invoke === 'function') {
          value.result = await effectAdapter.invoke(effect, context);
        }
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
      runSequence += 1;
      const runId = clampString(
        hostPort.createRunId && hostPort.createRunId(action.id, runSequence),
        `${action.id}:${runSequence}`
      );
      const ownerId = clampString(metadata.ownerId, action.resourceOwner || action.id);
      const controller = hostPort.createAbortController();
      if (!controller || !controller.signal || typeof controller.abort !== 'function') {
        throw new TypeError('RMT Action Host Port muss createAbortController() bereitstellen.');
      }
      const externalSignal = metadata && metadata.signal || null;
      const token = { cancelled: false, controller, cleanup: null };
      if (externalSignal && typeof externalSignal.addEventListener === 'function') {
        const abort = () => {
          token.cancelled = true;
          if (!controller.signal.aborted) controller.abort(externalSignal.reason || 'external-abort');
        };
        if (externalSignal.aborted) abort();
        else {
          externalSignal.addEventListener('abort', abort, { once: true });
          token.cleanup = () => externalSignal.removeEventListener('abort', abort);
        }
      }
      activeRuns.set(runId, token);
      actionStatus[action.id] = 'loading';
      if (!planningOnly) {
        patchState(modelCommandPort, action.statusState, { status: 'loading', action: action.id }, { operation: 'action.loading', action: action.id });
        if (action.loadingState) writeState(modelCommandPort, action.loadingState, true, { operation: 'action.loading', action: action.id });
      }
      diagnosticsRecorder.publish(createDiagnostic('rmt.action.loading', `RMT Action ${action.id} laeuft.`, { action: action.id }, 'info'));
      try {
        if (token.cancelled) return cancelResult(action, runId, ownerId, payload, metadata);
        await resourceManager.acquireMany(action.resources, ownerId, { action, payload, stateRuntime, signal: controller.signal });
        if (token.cancelled) {
          return cancelResult(action, runId, ownerId, payload, metadata);
        }
        const data = source
          ? await runDataSource(source, payload, { dataSourceAdapters: options.dataSourceAdapters, hostServiceRegistry, context: { action, payload, stateRuntime, hostServiceRegistry, signal: controller.signal, commandEnvelope: metadata.commandEnvelope || null, correlationId: metadata.correlationId || null } })
          : cloneValue(payload, payload);
        if (token.cancelled) {
          return cancelResult(action, runId, ownerId, payload, metadata);
        }
        const modelOperations = [];
        if (action.resultState) modelOperations.push({ operation: 'set', state: action.resultState, value: cloneValue(data, data) });
        if (action.loadingState) modelOperations.push({ operation: 'set', state: action.loadingState, value: false });
        if (action.statusState) modelOperations.push({ operation: 'patch', state: action.statusState, patch: { status: 'success', action: action.id } });
        if (!planningOnly) {
          if (action.resultState) writeState(modelCommandPort, action.resultState, data, { operation: 'action.success', action: action.id });
          if (action.loadingState) writeState(modelCommandPort, action.loadingState, false, { operation: 'action.success', action: action.id });
          patchState(modelCommandPort, action.statusState, { status: 'success', action: action.id }, { operation: 'action.success', action: action.id });
        }
        const effectResults = [];
        const reducerResults = [];
        for (const reducer of action.reducers) {
          if (planningOnly) {
            const operation = planReducerOperation(reducer, data, stateRuntime);
            if (operation) {
              modelOperations.push(operation);
              reducerResults.push(operation);
            }
          } else {
            reducerResults.push(dispatchReducer(modelCommandPort, reducer, data, {
              operation: 'action.reducer',
              action: action.id,
              commandEnvelope: metadata.commandEnvelope || null,
              correlationId: metadata.correlationId || null
            }));
          }
        }
        for (const effectId of action.effects) {
          effectResults.push(await runEffect(effectId, {
            action,
            payload,
            result: data,
            stateRuntime,
            ownerId,
            hostServiceRegistry,
            signal: controller.signal,
            commandEnvelope: metadata.commandEnvelope || null,
            correlationId: metadata.correlationId || null
          }));
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
          modelOperations: planningOnly ? modelOperations.map((entry) => cloneValue(entry, entry)) : [],
          postCommitEffects: planningOnly
            ? effectResults.filter((entry) => entry && entry.value && entry.value.deferred === true).map((entry) => cloneValue(entry, entry))
            : [],
          reducers: reducerResults.map((entry) => cloneValue(entry, entry)),
          commandEnvelope: metadata.commandEnvelope ? cloneValue(metadata.commandEnvelope, metadata.commandEnvelope) : null,
          correlationId: metadata.correlationId || metadata.commandEnvelope && metadata.commandEnvelope.correlationId || null,
          diagnostics: diagnosticsRecorder.diagnostics.slice()
        };
        actionHistory.push(result);
        return result;
      } catch (error) {
        if (token.cancelled || controller.signal.aborted) {
          return cancelResult(action, runId, ownerId, payload, metadata);
        }
        const modelOperations = [];
        if (action.loadingState) modelOperations.push({ operation: 'set', state: action.loadingState, value: false });
        if (action.statusState) modelOperations.push({ operation: 'patch', state: action.statusState, patch: { status: 'error', action: action.id, error: normalizeError(error) } });
        if (!planningOnly) {
          if (action.loadingState) writeState(modelCommandPort, action.loadingState, false, { operation: 'action.error', action: action.id });
          patchState(modelCommandPort, action.statusState, { status: 'error', action: action.id, error: normalizeError(error) }, { operation: 'action.error', action: action.id });
        }
        actionStatus[action.id] = 'error';
        diagnosticsRecorder.publish(createDiagnostic('rmt.action.error', `RMT Action ${action.id} ist fehlgeschlagen.`, { action: action.id, error: normalizeError(error) }, 'error'));
        const result = {
          schema: 'xtend.epic18.rmt-action-result.v1',
          id: action.id,
          runId,
          status: 'error',
          error: normalizeError(error),
          modelOperations: planningOnly ? modelOperations : [],
          postCommitEffects: [],
          diagnostics: diagnosticsRecorder.diagnostics.slice()
        };
        actionHistory.push(result);
        return result;
      } finally {
        if (typeof token.cleanup === 'function') token.cleanup();
        activeRuns.delete(runId);
      }
    }

    function cancelResult(action, runId, ownerId, payload, metadata = {}) {
      activeRuns.delete(runId);
      actionStatus[action.id] = 'cancelled';
      const modelOperations = [];
      if (action.loadingState) modelOperations.push({ operation: 'set', state: action.loadingState, value: false });
      if (action.statusState) modelOperations.push({ operation: 'patch', state: action.statusState, patch: { status: 'cancelled', action: action.id } });
      if (!planningOnly) {
        if (action.loadingState) writeState(modelCommandPort, action.loadingState, false, { operation: 'action.cancelled', action: action.id });
        patchState(modelCommandPort, action.statusState, { status: 'cancelled', action: action.id }, { operation: 'action.cancelled', action: action.id });
      }
      resourceManager.releaseOwner(ownerId);
      diagnosticsRecorder.publish(createDiagnostic('rmt.action.cancelled', `RMT Action ${action.id} wurde abgebrochen.`, { action: action.id }, 'warning'));
      const result = {
        schema: 'xtend.epic18.rmt-action-result.v1',
        id: action.id,
        runId,
        status: 'cancelled',
        modelOperations: planningOnly ? modelOperations : [],
        postCommitEffects: [],
        payload: cloneValue(payload, payload),
        metadata: cloneValue(metadata, {}),
        diagnostics: diagnosticsRecorder.diagnostics.slice()
      };
      actionHistory.push(result);
      return result;
    }

    function cancelAction(actionId, reason = 'action-cancelled') {
      const id = clampString(actionId);
      let cancelled = 0;
      activeRuns.forEach((token, runId) => {
        if (runId.startsWith(`${id}:`)) {
          token.cancelled = true;
          if (token.controller && !token.controller.signal.aborted) token.controller.abort(reason);
          cancelled += 1;
        }
      });
      return {
        schema: 'xtend.epic18.rmt-action-cancel.v1',
        action: id,
        cancelled
      };
    }

    function dispose(reason = 'runtime-disposed') {
      let cancelled = 0;
      activeRuns.forEach((token) => {
        token.cancelled = true;
        if (token.controller && !token.controller.signal.aborted) token.controller.abort(reason);
        cancelled += 1;
      });
      return {
        schema: 'xtend.epic18.rmt-action-runtime-dispose.v1',
        cancelled,
        reason
      };
    }

    return Object.freeze({
      schema: RMT_ACTION_EFFECT_RUNTIME_SCHEMA,
      runAction,
      cancelAction,
      dispose,
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
    RMT_COMPONENT_COMMAND_SCHEMA,
    createRmtActionEffectRuntime,
    createRmtResourceManager
  };

  return Object.freeze(api);
}

const __XTEND_RMT_ACTION_EFFECT_RUNTIME_API__ = createRmtActionEffectRuntimeModule();

export const RMT_ACTION_EFFECT_DIAGNOSTIC_SCHEMA = __XTEND_RMT_ACTION_EFFECT_RUNTIME_API__.RMT_ACTION_EFFECT_DIAGNOSTIC_SCHEMA;
export const RMT_ACTION_EFFECT_RUNTIME_SCHEMA = __XTEND_RMT_ACTION_EFFECT_RUNTIME_API__.RMT_ACTION_EFFECT_RUNTIME_SCHEMA;
export const RMT_COMPONENT_COMMAND_SCHEMA = __XTEND_RMT_ACTION_EFFECT_RUNTIME_API__.RMT_COMPONENT_COMMAND_SCHEMA;
export const createRmtActionEffectRuntime = __XTEND_RMT_ACTION_EFFECT_RUNTIME_API__.createRmtActionEffectRuntime;
export const createRmtResourceManager = __XTEND_RMT_ACTION_EFFECT_RUNTIME_API__.createRmtResourceManager;

export default __XTEND_RMT_ACTION_EFFECT_RUNTIME_API__;

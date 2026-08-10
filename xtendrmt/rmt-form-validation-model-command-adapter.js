const MODEL_COMMAND_ADAPTER_SCHEMA = 'xtend.rmt.form-validation-model-command-adapter.v1';

function toArray(value) {
  return Array.isArray(value) ? value : (value == null ? [] : [value]);
}

function cloneValue(value, fallback = null) {
  if (typeof value === 'undefined') return fallback;
  if (value === null || typeof value !== 'object') return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return fallback;
  }
}

export function createRmtFormValidationModelCommandAdapter(options = {}) {
  const suppliedPort = options.modelCommandPort || null;
  const stateRuntime = options.stateRuntime || null;

  function apply(operations, metadata = {}) {
    const requested = toArray(operations).filter((operation) => (
      operation
      && operation.operation === 'set'
      && typeof operation.state === 'string'
      && operation.state.trim()
    ));
    if (suppliedPort && typeof suppliedPort.apply === 'function') {
      return suppliedPort.apply(requested, metadata);
    }

    const changedPatches = [];
    const applyOperations = () => requested.forEach((operation) => {
      if (!stateRuntime || typeof stateRuntime.setState !== 'function') return;
      stateRuntime.setState(
        operation.state,
        cloneValue(operation.value, operation.value),
        { ...operation.metadata, ...metadata }
      );
      changedPatches.push(
        operation.metadata && operation.metadata.validationPatch
        || `${operation.metadata && operation.metadata.validationGroup || 'validation'}:${operation.state}`
      );
    });

    if (stateRuntime && typeof stateRuntime.transaction === 'function') {
      stateRuntime.transaction(applyOperations, {
        ...metadata,
        operation: metadata.operation || 'validation.patch',
        validation: true
      });
    } else {
      applyOperations();
    }

    return Object.freeze({
      schema: 'xtend.rmt.form-validation-model-command-report.v1',
      operationCount: requested.length,
      changedCount: changedPatches.length,
      changedPatches: Object.freeze(changedPatches.slice())
    });
  }

  return Object.freeze({
    schema: MODEL_COMMAND_ADAPTER_SCHEMA,
    apply
  });
}

export default Object.freeze({ createRmtFormValidationModelCommandAdapter });

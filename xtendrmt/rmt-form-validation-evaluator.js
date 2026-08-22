const RMT_FORM_VALIDATION_DIAGNOSTIC_SCHEMA = 'xtend.rmt.form-validation-diagnostic.v1';
const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

function toArray(value) {
  return Array.isArray(value) ? value : (value == null ? [] : [value]);
}

function objectRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function clampString(value, fallback = '') {
  const normalized = String(value == null ? '' : value).trim();
  return normalized || fallback;
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

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  Object.getOwnPropertyNames(value).forEach((key) => deepFreeze(value[key], seen));
  return Object.freeze(value);
}

function sanitizeDiagnostic(value) {
  if (Array.isArray(value)) return value.map(sanitizeDiagnostic);
  if (!value || typeof value !== 'object') return value;
  const result = Object.create(null);
  Object.entries(value).forEach(([key, entry]) => {
    const normalized = key.toLowerCase();
    if (UNSAFE_PATH_SEGMENTS.has(normalized)) return;
    if (
      normalized.includes('payload')
      || normalized.includes('secret')
      || normalized.includes('token')
      || normalized.includes('password')
      || normalized.includes('html')
      || normalized === 'stack'
    ) {
      result[key] = '[redacted]';
      return;
    }
    result[key] = sanitizeDiagnostic(entry);
  });
  return result;
}

function createDiagnostic(code, severity, message, details = {}) {
  return sanitizeDiagnostic({
    schema: RMT_FORM_VALIDATION_DIAGNOSTIC_SCHEMA,
    code,
    severity,
    message,
    details
  });
}

function pathParts(path) {
  return String(path || '').split('.').filter(Boolean);
}

function hasUnsafePathSegment(parts) {
  return parts.some((part) => UNSAFE_PATH_SEGMENTS.has(part));
}

function readPath(source, path) {
  if (!path) return source;
  const parts = pathParts(path);
  if (hasUnsafePathSegment(parts)) return undefined;
  let cursor = source;
  for (const part of parts) {
    if (cursor == null || typeof cursor !== 'object' || !Object.prototype.hasOwnProperty.call(cursor, part)) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function writePath(target, path, value) {
  const parts = pathParts(path);
  if (hasUnsafePathSegment(parts) || !parts.length) return target;
  let cursor = target;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value;
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(cursor, part) || !cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
      cursor[part] = Object.create(null);
    }
    cursor = cursor[part];
  });
  return target;
}

function isEmptyValue(value) {
  if (value === null || typeof value === 'undefined') return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function normalizeRule(rule) {
  const source = objectRecord(rule);
  return { kind: clampString(source.kind), value: source.value };
}

function normalizeGroup(group) {
  const source = objectRecord(group);
  return {
    ...source,
    id: clampString(source.id || source.name),
    mode: clampString(source.mode, 'blocking'),
    includes: toArray(source.includes).map((entry) => clampString(entry)).filter(Boolean),
    targets: toArray(source.targets).map((target) => ({
      kind: clampString(target && target.kind, 'action'),
      id: clampString(target && (target.id || target.ref || target.action))
    })).filter((target) => target.id),
    fields: toArray(source.fields).map((field) => ({
      ...objectRecord(field),
      state: clampString(field && field.state),
      surface: clampString(field && field.surface),
      component: clampString(field && field.component),
      rules: toArray(field && field.rules).map(normalizeRule).filter((rule) => rule.kind),
      message: clampString(field && field.message)
    })).filter((field) => field.state)
  };
}

export function normalizeRmtFormValidationPlan(plan) {
  const source = objectRecord(plan);
  return {
    ...source,
    groups: toArray(source.groups).map(normalizeGroup).filter((group) => group.id),
    actionGates: toArray(source.actionGates).map((gate) => ({
      ...objectRecord(gate),
      id: clampString(gate && gate.id),
      group: clampString(gate && gate.group),
      action: clampString(gate && gate.action),
      operation: clampString(gate && gate.operation),
      commandState: clampString(gate && gate.commandState)
    })).filter((gate) => gate.group && gate.action),
    statePatches: toArray(source.statePatches).map((patch) => ({
      ...objectRecord(patch),
      id: clampString(patch && patch.id),
      group: clampString(patch && patch.group),
      targetState: clampString(patch && patch.targetState),
      path: clampString(patch && patch.path, 'disabled'),
      invalidValue: patch && Object.prototype.hasOwnProperty.call(patch, 'invalidValue') ? patch.invalidValue : true,
      validValue: patch && Object.prototype.hasOwnProperty.call(patch, 'validValue') ? patch.validValue : false
    })).filter((patch) => patch.group && patch.targetState)
  };
}

function validateRule(value, rule) {
  const kind = rule.kind;
  if (kind === 'required') return !isEmptyValue(value);
  if (kind === 'email') {
    if (isEmptyValue(value)) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(String(value));
  }
  if (kind === 'minLength') {
    if (isEmptyValue(value)) return true;
    return String(value).length >= Math.max(Number(rule.value) || 0, 0);
  }
  if (kind === 'maxLength') {
    if (isEmptyValue(value)) return true;
    const limit = Math.max(Number(rule.value) || 0, 0);
    return limit === 0 || String(value).length <= limit;
  }
  if (kind === 'pattern') {
    if (isEmptyValue(value)) return true;
    try {
      return new RegExp(String(rule.value || ''), 'u').test(String(value));
    } catch (_) {
      return false;
    }
  }
  return true;
}

export function createRmtFormValidationEvaluator(options = {}) {
  const validationPlan = normalizeRmtFormValidationPlan(options.validationPlan || options.plan);
  const modelReader = options.modelReader || options.model || options.stateRuntime || null;
  const groupIndex = new Map(validationPlan.groups.map((group) => [group.id, group]));
  const gatesByAction = new Map();
  validationPlan.actionGates.forEach((gate) => {
    if (!gatesByAction.has(gate.action)) gatesByAction.set(gate.action, []);
    gatesByAction.get(gate.action).push(gate);
  });

  function readState(stateId, request = {}) {
    const requestModel = objectRecord(request.model || request.states);
    if (Object.prototype.hasOwnProperty.call(requestModel, stateId)) {
      return cloneValue(requestModel[stateId], requestModel[stateId]);
    }
    if (modelReader && typeof modelReader.getState === 'function') {
      return cloneValue(modelReader.getState(stateId), {});
    }
    const suppliedSnapshot = request.snapshot;
    const modelSnapshot = suppliedSnapshot || (modelReader && typeof modelReader.snapshot === 'function' ? modelReader.snapshot() : null);
    return cloneValue(objectRecord(modelSnapshot && modelSnapshot.states)[stateId], {});
  }

  function evaluateField(field, request = {}) {
    const stateValue = objectRecord(readState(field.state, request));
    const value = Object.prototype.hasOwnProperty.call(stateValue, 'value') ? stateValue.value : readPath(stateValue, 'value');
    const failedRules = field.rules.filter((rule) => !validateRule(value, rule)).map((rule) => rule.kind);
    const revealedFields = new Set(toArray(request.revealedFields).map(String));
    const revealed = request.report === true || request.reveal === true || revealedFields.has(field.state);
    return {
      field: field.state,
      target: {
        state: field.state,
        surface: field.surface || null,
        component: field.component || null,
        field: clampString(stateValue.field, '') || null
      },
      valid: failedRules.length === 0,
      revealed,
      failedRules,
      message: failedRules.length === 0 ? '' : field.message
    };
  }

  function evaluateGroup(groupId, request = {}, ancestors = new Set()) {
    const normalizedId = clampString(groupId);
    const group = groupIndex.get(normalizedId);
    if (!group) {
      const diagnostic = createDiagnostic(
        'rmt.form_validation.group_missing',
        'error',
        `RMT validation group ${normalizedId} is not defined.`,
        { group: normalizedId }
      );
      return {
        schema: 'xtend.rmt.form-validation-result.v1',
        group: normalizedId,
        valid: false,
        fields: [],
        included: [],
        diagnostics: [diagnostic]
      };
    }
    if (ancestors.has(group.id)) {
      return {
        schema: 'xtend.rmt.form-validation-result.v1',
        group: group.id,
        mode: group.mode,
        valid: true,
        fields: [],
        included: [],
        diagnostics: []
      };
    }
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(group.id);
    const included = group.includes.map((include) => evaluateGroup(include, request, nextAncestors));
    const fields = group.fields.map((field) => evaluateField(field, request));
    return {
      schema: 'xtend.rmt.form-validation-result.v1',
      group: group.id,
      mode: group.mode,
      valid: included.every((entry) => entry.valid) && fields.every((entry) => entry.valid),
      fields,
      included,
      diagnostics: included.flatMap((entry) => toArray(entry.diagnostics))
    };
  }

  function collectResults(results, target = new Map()) {
    toArray(results).forEach((result) => {
      if (!result || !result.group || target.has(result.group)) return;
      target.set(result.group, result);
      collectResults(result.included, target);
    });
    return target;
  }

  function createModelOperations(resultsByGroup, request) {
    return validationPlan.statePatches.flatMap((patch) => {
      const result = resultsByGroup.get(patch.group);
      if (!result) return [];
      const current = objectRecord(readState(patch.targetState, request));
      const nextValue = result.valid ? patch.validValue : patch.invalidValue;
      if (Object.is(readPath(current, patch.path), nextValue)) return [];
      const next = cloneValue(current, {});
      writePath(next, patch.path, cloneValue(nextValue, nextValue));
      return [{
        operation: 'set',
        state: patch.targetState,
        value: next,
        metadata: {
          operation: 'validation.patch',
          validationGroup: patch.group,
          validationPatch: patch.id || null,
          valid: result.valid
        }
      }];
    });
  }

  function createViewProjection(resultsByGroup, request) {
    return Array.from(resultsByGroup.values()).flatMap((result) => toArray(result.fields).map((field) => ({
      schema: 'xtend.rmt.form-validation-view-projection.v1',
      group: result.group,
      target: cloneValue(field.target, {}),
      invalid: !field.valid,
      revealed: field.revealed,
      report: request.report === true,
      message: field.message || ''
    })));
  }

  function evaluate(request = {}, groupIds = null) {
    const evaluationRequest = objectRecord(request);
    const requested = groupIds
      ? Array.from(new Set(toArray(groupIds).map((id) => clampString(id)).filter(Boolean)))
      : validationPlan.groups.map((group) => group.id);
    const results = requested.map((groupId) => evaluateGroup(groupId, evaluationRequest));
    const resultsByGroup = collectResults(results);
    return deepFreeze({
      schema: 'xtend.rmt.form-validation-evaluation.v1',
      valid: results.every((result) => result.valid),
      results,
      modelOperations: createModelOperations(resultsByGroup, evaluationRequest),
      viewProjection: createViewProjection(resultsByGroup, evaluationRequest),
      diagnostics: Array.from(resultsByGroup.values()).flatMap((result) => toArray(result.diagnostics))
    });
  }

  function evaluateAction(actionId, request = {}) {
    const normalizedAction = clampString(actionId);
    const gates = gatesByAction.get(normalizedAction) || [];
    if (!gates.length) {
      return deepFreeze({
        schema: 'xtend.rmt.form-validation-action-gate.v1',
        action: normalizedAction,
        valid: true,
        gated: false,
        results: [],
        evaluation: evaluate(request, [])
      });
    }
    const groups = Array.from(new Set(gates.map((gate) => gate.group)));
    const evaluation = evaluate(request, groups);
    const byGroup = collectResults(evaluation.results);
    const results = gates.map((gate) => byGroup.get(gate.group)).filter(Boolean);
    return deepFreeze({
      schema: 'xtend.rmt.form-validation-action-gate.v1',
      action: normalizedAction,
      valid: results.every((result) => result.valid),
      gated: true,
      gateCount: gates.length,
      results,
      evaluation
    });
  }

  return Object.freeze({
    schema: 'xtend.rmt.form-validation-evaluator.v1',
    evaluate,
    evaluateGroup(groupId, request = {}) {
      return deepFreeze(evaluateGroup(groupId, objectRecord(request)));
    },
    evaluateAction,
    operationForAction(actionId) {
      const gate = (gatesByAction.get(clampString(actionId)) || [])[0] || null;
      return gate && gate.operation || `operation:xtend.rmt/validation/action/${actionId}`;
    },
    snapshot() {
      return deepFreeze({
        schema: 'xtend.rmt.form-validation-evaluator-snapshot.v1',
        groupCount: validationPlan.groups.length,
        actionGateCount: validationPlan.actionGates.length,
        statePatchCount: validationPlan.statePatches.length
      });
    }
  });
}

export default Object.freeze({
  createRmtFormValidationEvaluator,
  normalizeRmtFormValidationPlan
});

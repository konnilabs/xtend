(function attachRmtFormValidationRuntime(globalTarget) {
  const RMT_FORM_VALIDATION_RUNTIME_SCHEMA = 'xtend.rmt.form-validation-runtime.v1';
  const RMT_FORM_VALIDATION_DIAGNOSTIC_SCHEMA = 'xtend.rmt.form-validation-diagnostic.v1';

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

  function sanitizeDiagnostic(value) {
    if (Array.isArray(value)) return value.map(sanitizeDiagnostic);
    if (!value || typeof value !== 'object') return value;
    const result = {};
    Object.entries(value).forEach(([key, entry]) => {
      const normalized = key.toLowerCase();
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

  const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

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
    if (hasUnsafePathSegment(parts)) return target;
    if (!parts.length) return target;
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
    return {
      kind: clampString(source.kind),
      value: source.value
    };
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

  function normalizePlan(plan) {
    const source = objectRecord(plan);
    const groups = toArray(source.groups).map(normalizeGroup).filter((group) => group.id);
    return {
      ...source,
      groups,
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

  function findElementForField(root, field, stateValue) {
    if (!root || typeof root.querySelectorAll !== 'function') return null;
    if (field.surface) {
      const matches = Array.from(root.querySelectorAll('[data-maraca-surface]'));
      const found = matches.find((element) => element.getAttribute && element.getAttribute('data-maraca-surface') === field.surface);
      if (found) return found;
    }
    const fieldName = clampString(stateValue && stateValue.field);
    if (fieldName) {
      const matches = Array.from(root.querySelectorAll('[data-field]'));
      const found = matches.find((element) => element.getAttribute && element.getAttribute('data-field') === fieldName);
      if (found) return found;
    }
    return null;
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

  function createRmtFormValidationRuntime(options = {}) {
    const validationPlan = normalizePlan(options.validationPlan || options.plan);
    const stateRuntime = options.stateRuntime || null;
    const root = options.root || null;
    const diagnostics = toArray(options.diagnostics).map(sanitizeDiagnostic);
    const history = [];
    const revealedFields = new Set();
    const groupIndex = new Map(validationPlan.groups.map((group) => [group.id, group]));
    const gateByAction = new Map();
    validationPlan.actionGates.forEach((gate) => {
      if (!gateByAction.has(gate.action)) gateByAction.set(gate.action, []);
      gateByAction.get(gate.action).push(gate);
    });

    function dispatchEvent(name, detail) {
      const target = options.windowTarget || globalTarget;
      if (!target || typeof target.dispatchEvent !== 'function' || typeof target.CustomEvent !== 'function') return;
      target.dispatchEvent(new target.CustomEvent(name, { detail }));
    }

    function publishDiagnostic(diagnostic) {
      const safeDiagnostic = sanitizeDiagnostic(diagnostic);
      diagnostics.push(safeDiagnostic);
      if (typeof options.publishDiagnostic === 'function') options.publishDiagnostic(safeDiagnostic);
      return safeDiagnostic;
    }

    function getState(stateId) {
      if (!stateRuntime || typeof stateRuntime.getState !== 'function') return {};
      return objectRecord(stateRuntime.getState(stateId));
    }

    function setState(stateId, value, metadata = {}) {
      if (!stateRuntime || typeof stateRuntime.setState !== 'function') return false;
      stateRuntime.setState(stateId, value, metadata);
      return true;
    }

    function setFieldInvalid(field, invalid, stateValue, message) {
      const element = findElementForField(root, field, stateValue);
      if (!element) return;
      if (invalid) {
        if (typeof element.setAttribute === 'function') element.setAttribute('invalid', '');
        if (message && typeof element.setAttribute === 'function') element.setAttribute('data-validation-message', message);
      } else if (typeof element.removeAttribute === 'function') {
        element.removeAttribute('invalid');
        element.removeAttribute('data-validation-message');
      }
    }

    function shouldRevealField(field, metadata = {}) {
      if (!field || !field.state) return false;
      if (metadata.report === true || metadata.reveal === true) return true;
      return revealedFields.has(field.state);
    }

    function reportField(field, stateValue) {
      const element = findElementForField(root, field, stateValue);
      if (element && typeof element.reportValidity === 'function') return element.reportValidity();
      if (element && typeof element.checkValidity === 'function') return element.checkValidity();
      return true;
    }

    function evaluateField(field, metadata = {}) {
      const stateValue = getState(field.state);
      const value = Object.prototype.hasOwnProperty.call(stateValue, 'value') ? stateValue.value : readPath(stateValue, 'value');
      const failed = [];
      field.rules.forEach((rule) => {
        if (!validateRule(value, rule)) failed.push(rule.kind);
      });
      const valid = failed.length === 0;
      const reveal = shouldRevealField(field, metadata);
      if (reveal) revealedFields.add(field.state);
      if (valid || reveal) setFieldInvalid(field, !valid, stateValue, field.message);
      if (!valid && metadata.report === true) reportField(field, stateValue);
      return {
        field: field.state,
        surface: field.surface || null,
        component: field.component || null,
        valid,
        failedRules: failed,
        message: valid ? '' : field.message
      };
    }

    function evaluateGroup(groupId, metadata = {}, seen = new Set()) {
      const group = groupIndex.get(clampString(groupId));
      if (!group) {
        const diagnostic = publishDiagnostic(createDiagnostic(
          'rmt.form_validation.group_missing',
          'error',
          `RMT validation group ${groupId} is not defined.`,
          { group: groupId }
        ));
        return { schema: 'xtend.rmt.form-validation-result.v1', group: groupId, valid: false, diagnostics: [diagnostic], fields: [] };
      }
      if (seen.has(group.id)) {
        return { schema: 'xtend.rmt.form-validation-result.v1', group: group.id, valid: true, fields: [], included: [] };
      }
      seen.add(group.id);
      const included = group.includes.map((include) => evaluateGroup(include, metadata, seen));
      const fields = group.fields.map((field) => evaluateField(field, metadata));
      const valid = included.every((entry) => entry.valid) && fields.every((entry) => entry.valid);
      const result = {
        schema: 'xtend.rmt.form-validation-result.v1',
        group: group.id,
        mode: group.mode,
        valid,
        fields,
        included
      };
      history.push({ kind: 'group', at: Date.now(), group: group.id, valid });
      dispatchEvent('xtend-maraca:validation-change', result);
      return result;
    }

    function applyValidationPatches(metadata = {}) {
      const resultsByGroup = new Map();
      validationPlan.statePatches.forEach((patch) => {
        const result = resultsByGroup.get(patch.group) || evaluateGroup(patch.group, metadata);
        resultsByGroup.set(patch.group, result);
        const current = getState(patch.targetState);
        const nextValue = result.valid ? patch.validValue : patch.invalidValue;
        if (readPath(current, patch.path) === nextValue) return;
        const next = cloneValue(current, {});
        writePath(next, patch.path, nextValue);
        setState(patch.targetState, next, {
          operation: 'validation.patch',
          validationGroup: patch.group,
          validationPatch: patch.id,
          valid: result.valid
        });
      });
      return {
        schema: 'xtend.rmt.form-validation-patch-report.v1',
        groupCount: resultsByGroup.size,
        patches: validationPlan.statePatches.length
      };
    }

    function refresh(metadata = {}) {
      const results = validationPlan.groups.map((group) => evaluateGroup(group.id, metadata));
      applyValidationPatches(metadata);
      return {
        schema: 'xtend.rmt.form-validation-refresh.v1',
        valid: results.every((result) => result.valid),
        results
      };
    }

    function operationForAction(actionId) {
      const gate = (gateByAction.get(clampString(actionId)) || [])[0] || null;
      return gate && gate.operation || `operation:xtend.rmt/validation/action/${actionId}`;
    }

    function validateAction(actionId, metadata = {}) {
      const gates = gateByAction.get(clampString(actionId)) || [];
      if (gates.length === 0) {
        return { schema: 'xtend.rmt.form-validation-action-gate.v1', action: actionId, valid: true, gated: false, results: [] };
      }
      const results = gates.map((gate) => evaluateGroup(gate.group, {
        ...metadata,
        reveal: metadata.report === true || metadata.reveal === true,
        report: metadata.report === true
      }));
      applyValidationPatches(metadata);
      const valid = results.every((result) => result.valid);
      const report = {
        schema: 'xtend.rmt.form-validation-action-gate.v1',
        action: actionId,
        valid,
        gated: true,
        gateCount: gates.length,
        results
      };
      history.push({ kind: 'action-gate', at: Date.now(), action: actionId, valid });
      if (!valid) {
        publishDiagnostic(createDiagnostic(
          'rmt.form_validation.action_blocked',
          'warning',
          `RMT action ${actionId} was blocked by form validation.`,
          { action: actionId, groups: gates.map((gate) => gate.group) }
        ));
        dispatchEvent('xtend-maraca:validation-blocked', report);
      }
      return report;
    }

    function listDiagnostics() {
      return diagnostics.map((entry) => sanitizeDiagnostic(entry));
    }

    function snapshot() {
      return {
        schema: 'xtend.rmt.form-validation-snapshot.v1',
        planSchema: validationPlan.schema || null,
        groupCount: validationPlan.groups.length,
        actionGateCount: validationPlan.actionGates.length,
        statePatchCount: validationPlan.statePatches.length,
        groups: validationPlan.groups.map((group) => ({
          id: group.id,
          mode: group.mode,
          fieldCount: group.fields.length,
          targetCount: group.targets.length,
          includeCount: group.includes.length
        })),
        diagnostics: listDiagnostics(),
        history: history.slice(-50)
      };
    }

    dispatchEvent('xtend-maraca:validation-boot', {
      schema: 'xtend.rmt.form-validation-boot.v1',
      groupCount: validationPlan.groups.length,
      actionGateCount: validationPlan.actionGates.length
    });

    return Object.freeze({
      schema: RMT_FORM_VALIDATION_RUNTIME_SCHEMA,
      evaluateGroup,
      validateAction,
      applyValidationPatches,
      refresh,
      operationForAction,
      listDiagnostics,
      snapshot
    });
  }

  const api = {
    RMT_FORM_VALIDATION_DIAGNOSTIC_SCHEMA,
    RMT_FORM_VALIDATION_RUNTIME_SCHEMA,
    createRmtFormValidationRuntime
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalTarget) {
    globalTarget.XTendRmtFormValidationRuntime = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_FORM_VALIDATION_RUNTIME_API__ = globalThis.XTendRmtFormValidationRuntime;

export const RMT_FORM_VALIDATION_DIAGNOSTIC_SCHEMA = __XTEND_RMT_FORM_VALIDATION_RUNTIME_API__.RMT_FORM_VALIDATION_DIAGNOSTIC_SCHEMA;
export const RMT_FORM_VALIDATION_RUNTIME_SCHEMA = __XTEND_RMT_FORM_VALIDATION_RUNTIME_API__.RMT_FORM_VALIDATION_RUNTIME_SCHEMA;
export const createRmtFormValidationRuntime = __XTEND_RMT_FORM_VALIDATION_RUNTIME_API__.createRmtFormValidationRuntime;

export default __XTEND_RMT_FORM_VALIDATION_RUNTIME_API__;

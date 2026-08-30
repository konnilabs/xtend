import {
  createRmtFormValidationEvaluator,
  normalizeRmtFormValidationPlan
} from './rmt-form-validation-evaluator.js';
import { createRmtFormValidationViewProjector } from './rmt-form-validation-view-projector.js';
import { createRmtFormValidationModelCommandAdapter } from './rmt-form-validation-model-command-adapter.js';

export const RMT_FORM_VALIDATION_RUNTIME_SCHEMA = 'xtend.rmt.form-validation-runtime.v2';
export const RMT_FORM_VALIDATION_DIAGNOSTIC_SCHEMA = 'xtend.rmt.form-validation-diagnostic.v1';

const UNSAFE_DIAGNOSTIC_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function toArray(value) {
  return Array.isArray(value) ? value : (value == null ? [] : [value]);
}

function clampString(value, fallback = '') {
  const normalized = String(value == null ? '' : value).trim();
  return normalized || fallback;
}

function sanitizeDiagnostic(value) {
  if (Array.isArray(value)) return value.map(sanitizeDiagnostic);
  if (!value || typeof value !== 'object') return value;
  const result = Object.create(null);
  Object.entries(value).forEach(([key, entry]) => {
    const normalized = key.toLowerCase();
    if (UNSAFE_DIAGNOSTIC_KEYS.has(normalized)) return;
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

function collectEvaluationResults(evaluation, target = new Map()) {
  toArray(evaluation && evaluation.results || evaluation).forEach((result) => {
    if (!result || !result.group || target.has(result.group)) return;
    target.set(result.group, result);
    collectEvaluationResults(result.included, target);
  });
  return target;
}

function collectRevealedFields(evaluation, target) {
  collectEvaluationResults(evaluation).forEach((result) => {
    toArray(result.fields).forEach((field) => {
      if (field && field.revealed && field.field) target.add(String(field.field));
    });
  });
}

export { createRmtFormValidationEvaluator, createRmtFormValidationViewProjector };

export function createRmtFormValidationRuntime(options = {}) {
  const validationPlan = normalizeRmtFormValidationPlan(options.validationPlan || options.plan);
  const stateRuntime = options.stateRuntime || null;
  const modelReader = options.modelReader || stateRuntime;
  const modelCommandPort = createRmtFormValidationModelCommandAdapter({
    modelCommandPort: options.modelCommandPort,
    stateRuntime
  });
  const diagnostics = toArray(options.diagnostics).map(sanitizeDiagnostic);
  const history = [];
  const revealedFields = new Set();
  const gateByAction = new Map();
  let sequence = 0;
  let disposed = false;
  let legacyComposerDiagnosed = false;

  validationPlan.actionGates.forEach((gate) => {
    if (!gateByAction.has(gate.action)) gateByAction.set(gate.action, []);
    gateByAction.get(gate.action).push(gate);
  });

  function publishDiagnostic(diagnostic) {
    const safeDiagnostic = sanitizeDiagnostic(diagnostic);
    diagnostics.push(safeDiagnostic);
    if (typeof options.publishDiagnostic === 'function') options.publishDiagnostic(safeDiagnostic);
    return safeDiagnostic;
  }

  const evaluator = createRmtFormValidationEvaluator({ validationPlan, modelReader });
  const hostTarget = options.hostTarget || options.windowTarget || null;
  const viewProjector = createRmtFormValidationViewProjector({
    root: options.root || null,
    domRenderer: options.domRenderer || options.renderer || null,
    strict: options.strict === true || options.strictMaraca === true,
    resolveTarget: options.resolveTarget,
    windowTarget: hostTarget,
    hostTarget,
    documentTarget: options.documentTarget,
    diagnosticsHub: options.diagnosticsHub,
    diagnosticChannel: options.diagnosticChannel,
    publishDiagnostic
  });

  function diagnoseLegacyComposer(method) {
    if (legacyComposerDiagnosed) return;
    legacyComposerDiagnosed = true;
    publishDiagnostic(createDiagnostic(
      'xtend.rmt.mvc.legacy-validation-composer',
      'info',
      'The combined validation runtime is a 0.6 compatibility composer; use evaluator and View-projector ports in managed Maraca.',
      { method }
    ));
  }

  function record(kind, details) {
    sequence += 1;
    history.push({ kind, sequence, ...details });
    if (history.length > 50) history.splice(0, history.length - 50);
  }

  function evaluationRequest(metadata = {}) {
    return {
      ...metadata,
      revealedFields: Array.from(revealedFields),
      reveal: metadata.reveal === true || metadata.report === true,
      report: metadata.report === true
    };
  }

  function noteEvaluation(evaluation) {
    collectRevealedFields(evaluation, revealedFields);
    toArray(evaluation && evaluation.diagnostics).forEach(publishDiagnostic);
    collectEvaluationResults(evaluation).forEach((result) => {
      record('group', { group: result.group, valid: result.valid });
      viewProjector.publish('xtend-maraca:validation-change', result);
    });
    return evaluation;
  }

  function evaluate(metadata = {}, groupIds = null) {
    diagnoseLegacyComposer('evaluate');
    return noteEvaluation(evaluator.evaluate(evaluationRequest(metadata), groupIds));
  }

  function evaluateGroup(groupId, metadata = {}) {
    diagnoseLegacyComposer('evaluateGroup');
    const evaluation = evaluator.evaluate(evaluationRequest(metadata), [groupId]);
    noteEvaluation(evaluation);
    return evaluation.results[0] || null;
  }

  function ensureEvaluation(evaluation, metadata = {}) {
    if (
      evaluation
      && evaluation.schema === 'xtend.rmt.form-validation-evaluation.v1'
      && Array.isArray(evaluation.modelOperations)
      && Array.isArray(evaluation.viewProjection)
    ) return evaluation;
    const groups = Array.from(collectEvaluationResults(evaluation).keys());
    return evaluator.evaluate(evaluationRequest(metadata), groups.length ? groups : null);
  }

  function applyValidationPatches(metadata = {}, evaluation = null) {
    diagnoseLegacyComposer('applyValidationPatches');
    const groups = validationPlan.statePatches.map((patch) => patch.group);
    const normalized = evaluation
      ? ensureEvaluation(evaluation, metadata)
      : evaluator.evaluate(evaluationRequest(metadata), groups);
    const commandReport = modelCommandPort.apply(normalized.modelOperations, {
      ...metadata,
      operation: metadata.operation || 'validation.patch',
      validation: true
    }) || {};
    const resultsByGroup = collectEvaluationResults(normalized);
    return {
      schema: 'xtend.rmt.form-validation-patch-report.v1',
      groupCount: resultsByGroup.size,
      patches: validationPlan.statePatches.length,
      changedPatches: toArray(commandReport.changedPatches)
    };
  }

  function apply(evaluation, metadata = {}) {
    diagnoseLegacyComposer('apply');
    const normalized = ensureEvaluation(evaluation, metadata);
    collectRevealedFields(normalized, revealedFields);
    const viewReport = viewProjector.project(normalized, metadata);
    const patchReport = applyValidationPatches(metadata, normalized);
    return {
      schema: 'xtend.rmt.form-validation-apply-report.v1',
      valid: normalized.valid !== false,
      groupCount: collectEvaluationResults(normalized).size,
      patchReport,
      viewReport
    };
  }

  function refresh(metadata = {}) {
    diagnoseLegacyComposer('refresh');
    const evaluation = evaluate(metadata);
    const application = apply(evaluation, metadata);
    return {
      schema: 'xtend.rmt.form-validation-refresh.v1',
      valid: evaluation.valid,
      results: evaluation.results,
      application
    };
  }

  function operationForAction(actionId) {
    return evaluator.operationForAction(actionId);
  }

  function validateAction(actionId, metadata = {}) {
    diagnoseLegacyComposer('validateAction');
    const action = clampString(actionId);
    const gate = evaluator.evaluateAction(action, evaluationRequest(metadata));
    if (!gate.gated) return gate;
    noteEvaluation(gate.evaluation);
    apply(gate.evaluation, metadata);
    const report = {
      schema: 'xtend.rmt.form-validation-action-gate.v1',
      action,
      valid: gate.valid,
      gated: true,
      gateCount: gate.gateCount,
      results: gate.results
    };
    record('action-gate', { action, valid: gate.valid });
    if (!gate.valid) {
      const gates = gateByAction.get(action) || [];
      publishDiagnostic(createDiagnostic(
        'rmt.form_validation.action_blocked',
        'warning',
        `RMT action ${action} was blocked by form validation.`,
        { action, groups: gates.map((entry) => entry.group) }
      ));
      viewProjector.publish('xtend-maraca:validation-blocked', report);
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
      disposed,
      groups: validationPlan.groups.map((group) => ({
        id: group.id,
        mode: group.mode,
        fieldCount: group.fields.length,
        targetCount: group.targets.length,
        includeCount: group.includes.length
      })),
      diagnostics: listDiagnostics(),
      history: history.slice()
    };
  }

  function dispose() {
    const alreadyDisposed = disposed;
    disposed = true;
    revealedFields.clear();
    viewProjector.dispose();
    return {
      schema: 'xtend.rmt.form-validation-dispose-report.v1',
      disposed: true,
      alreadyDisposed
    };
  }

  viewProjector.publish('xtend-maraca:validation-boot', {
    schema: 'xtend.rmt.form-validation-boot.v1',
    groupCount: validationPlan.groups.length,
    actionGateCount: validationPlan.actionGates.length
  });

  return Object.freeze({
    schema: RMT_FORM_VALIDATION_RUNTIME_SCHEMA,
    evaluator,
    viewProjector,
    evaluate,
    apply,
    evaluateGroup,
    validateAction,
    applyValidationPatches,
    refresh,
    operationForAction,
    listDiagnostics,
    snapshot,
    dispose
  });
}

const api = Object.freeze({
  RMT_FORM_VALIDATION_DIAGNOSTIC_SCHEMA,
  RMT_FORM_VALIDATION_RUNTIME_SCHEMA,
  createRmtFormValidationEvaluator,
  createRmtFormValidationViewProjector,
  createRmtFormValidationRuntime
});
export default api;

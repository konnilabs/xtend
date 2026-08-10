import {
  RMT_RESUME_INTENT_SCHEMA,
  RMT_RESUME_MAX_INTENTS,
  clampString,
  cloneSafe,
  createResumeDiagnostic,
  toArray
} from './rmt-resume-protocol.mjs';

export function createRmtResumeCaptureAdapter(options = {}) {
  const queuedIntents = [];
  const diagnostics = [];
  const now = typeof options.now === 'function' ? options.now : (() => 0);

  function publish(diagnostic) {
    diagnostics.push(diagnostic);
    if (typeof options.publishDiagnostic === 'function') options.publishDiagnostic(diagnostic);
    return diagnostic;
  }

  function captureIntent(input = {}) {
    const generation = clampString(input.generation || options.generation);
    const eventId = clampString(input.eventId || input.id);
    const action = clampString(input.action || input.command);
    if (!generation || (!eventId && !action)) {
      publish(createResumeDiagnostic(
        'rmt.resume.intent_invalid',
        'warning',
        'Pre-boot intent requires generation and a declared event or action.',
        { generation, eventId, action }
      ));
      return null;
    }
    if (queuedIntents.length >= RMT_RESUME_MAX_INTENTS) {
      publish(createResumeDiagnostic(
        'rmt.resume.intent_queue_full',
        'warning',
        `Pre-boot intent queue rejected an entry after ${RMT_RESUME_MAX_INTENTS} records.`,
        { generation, eventId, action }
      ));
      return null;
    }
    const intent = Object.freeze({
      schema: RMT_RESUME_INTENT_SCHEMA,
      sequence: queuedIntents.length,
      generation,
      eventId,
      action,
      surfaceId: clampString(input.surfaceId || input.surface),
      eventType: clampString(input.eventType || input.event),
      payload: cloneSafe(input.payload, {}),
      capturedAt: Number.isFinite(input.capturedAt) ? input.capturedAt : now()
    });
    queuedIntents.push(intent);
    return intent;
  }

  function install(root, eventRecords = [], captureOptions = {}) {
    if (!root || typeof root.addEventListener !== 'function') {
      return Object.freeze({ status: 'unavailable', dispose() {}, snapshot: () => [] });
    }
    const records = toArray(eventRecords).filter((record) => record && record.event);
    const listeners = [];
    const generation = clampString(
      captureOptions.generation
      || options.generation
      || (root.getAttribute && root.getAttribute('data-rmt-resume-generation'))
    );
    const eventTypes = [...new Set(records.map((record) => clampString(record.event)).filter(Boolean))];
    eventTypes.forEach((eventType) => {
      const listener = (event) => {
        const candidates = records.filter((record) => record.event === eventType);
        for (const record of candidates) {
          const selector = clampString(record.selector);
          const target = event && event.target;
          const matched = selector && target && typeof target.closest === 'function'
            ? target.closest(selector)
            : target;
          if (!matched) continue;
          const payload = typeof captureOptions.mapPayload === 'function'
            ? captureOptions.mapPayload(record, event, matched)
            : {
                value: Object.prototype.hasOwnProperty.call(matched, 'value') ? matched.value : undefined,
                detail: cloneSafe(event && event.detail, null)
              };
          captureIntent({
            generation,
            eventId: record.id,
            action: record.action,
            surfaceId: record.surface || record.owner,
            eventType,
            payload
          });
          break;
        }
      };
      root.addEventListener(eventType, listener, { capture: true, passive: eventType !== 'submit' });
      listeners.push([eventType, listener]);
    });
    let disposed = false;
    return Object.freeze({
      status: 'capturing',
      generation,
      snapshot: () => queuedIntents.slice(),
      dispose() {
        if (disposed) return;
        disposed = true;
        listeners.forEach(([eventType, listener]) => root.removeEventListener(eventType, listener, { capture: true }));
        listeners.length = 0;
      }
    });
  }

  return Object.freeze({
    schema: 'xtend.rmt.resume-capture-adapter.v1',
    captureIntent,
    install,
    listIntents: () => queuedIntents.slice(),
    clearIntents: () => queuedIntents.splice(0, queuedIntents.length),
    listDiagnostics: () => diagnostics.slice()
  });
}

export default Object.freeze({ createRmtResumeCaptureAdapter });

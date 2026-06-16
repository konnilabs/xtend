export const XTEND_RMT_COMMAND_SCHEMA = 'xtend.rmt.command.v1';

function readAttribute(host, name) {
  return host && typeof host.getAttribute === 'function' ? host.getAttribute(name) || '' : '';
}

function readDataset(host, key) {
  return host && host.dataset && host.dataset[key] ? host.dataset[key] : '';
}

function readText(host) {
  return host && typeof host.textContent === 'string' ? host.textContent : '';
}

function resolveCommand(host, eventName, payload, options) {
  if (typeof options.command === 'function') {
    const resolved = options.command(host, eventName, payload);
    if (resolved) return resolved;
  }
  if (typeof options.command !== 'function' && options.command) return options.command;
  return readAttribute(host, 'command')
    || readDataset(host, 'command')
    || readDataset(host, 'action')
    || (options.payloadActionFallback === false ? '' : payload && payload.action)
    || host && host.id
    || eventName;
}

function resolveSourceId(host, options) {
  return options.sourceId
    || host && host.id
    || readAttribute(host, 'name')
    || options.fallbackId
    || host && host.localName
    || 'xtend-component';
}

function resolvePayload(host, eventName, payload, options) {
  if (options.mergePayload === false) return payload;
  const base = typeof options.payloadBase === 'function'
    ? options.payloadBase(host, eventName, payload)
    : options.payloadBase;
  return {
    ...(base && typeof base === 'object' && !Array.isArray(base) ? base : {}),
    ...(payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : { value: payload })
  };
}

export function createXtendRmtCommandDetail(host, eventName, payload = {}, options = {}) {
  const sourceId = resolveSourceId(host, options);
  const command = resolveCommand(host, eventName, payload, options);
  const clock = typeof options.clock === 'function' ? options.clock : Date.now;
  const now = clock();
  return {
    schema: XTEND_RMT_COMMAND_SCHEMA,
    id: options.id || `rmt.command:${sourceId}:${eventName}:${now}`,
    source: {
      kind: options.sourceKind || 'component',
      id: sourceId,
      event: eventName,
      surfaceId: options.surfaceId || readDataset(host, 'surfaceId') || readAttribute(host, 'surface-id') || ''
    },
    command,
    payload: resolvePayload(host, eventName, payload, options),
    target: Object.prototype.hasOwnProperty.call(options, 'target') ? options.target : null,
    correlationId: options.correlationId || `rmt.correlation:${sourceId}:${now}`,
    runId: options.runId || '',
    lane: options.lane || options.defaultLane || 'user-blocking',
    timestamp: options.timestamp || new Date(now).toISOString()
  };
}

export function createXtendButtonPayloadBase(host) {
  return {
    id: host && host.id || '',
    label: readDataset(host, 'label') || readAttribute(host, 'label') || readText(host) || ''
  };
}

export function dispatchXtendRmtCommand(host, eventName, payload = {}, options = {}) {
  return host.dispatchEvent(new CustomEvent('xtend-command', {
    detail: createXtendRmtCommandDetail(host, eventName, payload, options),
    bubbles: true,
    composed: true,
    cancelable: true
  }));
}

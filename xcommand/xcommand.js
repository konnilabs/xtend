(function attachXCommand(globalTarget, factory) {
  const api = factory(globalTarget || {});

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (globalTarget && typeof globalTarget === 'object') {
    globalTarget.XCommand = Object.freeze(api);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createXCommandModule(globalTarget) {
  const XCOMMAND_KERNEL_CONTRACT = 'xtend.xcommand.kernel-contract.v1';
  const XKEYMAP_SURFACE_CONTRACT = 'xtend.xkeymap.surface-contract.v1';
  const RMT_XCOMMAND_SCHEMA = 'xtend.rmt.xcommand.v1';
  const DEFAULT_CHORD_TIMEOUT_MS = 1200;
  const DEFAULT_SCOPE = 'global';
  const VALID_LANES = new Set(['input', 'interaction', 'background', 'user-blocking', 'visible', 'a11y', 'diagnostics']);
  const RESET_REASONS = new Set(['timeout', 'escape', 'blur', 'scope-change', 'manual']);

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function normalizeKeyToken(token) {
    return String(token || '')
      .trim()
      .replace(/\s+/g, '')
      .replace(/^cmd\+/i, 'Mod+')
      .replace(/^command\+/i, 'Mod+')
      .replace(/^ctrl\+/i, 'Ctrl+')
      .replace(/^control\+/i, 'Ctrl+')
      .replace(/^option\+/i, 'Alt+')
      .replace(/^esc$/i, 'Escape')
      .replace(/^space$/i, 'Space');
  }

  function parseKeySequence(input) {
    if (Array.isArray(input)) {
      return input.map(normalizeKeyToken).filter(Boolean);
    }
    return String(input || '')
      .split(/\s+/)
      .map(normalizeKeyToken)
      .filter(Boolean);
  }

  function sequenceKey(sequence) {
    return parseKeySequence(sequence).join(' ');
  }

  function isPrefix(prefix, sequence) {
    if (prefix.length >= sequence.length) return false;
    return prefix.every((token, index) => token === sequence[index]);
  }

  function normalizeLabel(label, fallbackId) {
    if (typeof label === 'string') {
      return { i18nKey: label, fallback: label };
    }
    const normalized = label && typeof label === 'object' ? label : {};
    const fallback = String(normalized.fallback || normalized.i18nKey || fallbackId || 'Command');
    return {
      i18nKey: String(normalized.i18nKey || fallback),
      fallback
    };
  }

  function createDiagnostic(code, message, details = {}) {
    return Object.freeze({
      schema: XCOMMAND_KERNEL_CONTRACT,
      source: 'xcommand',
      severity: details.severity || 'warning',
      code,
      message,
      details: clone(details)
    });
  }

  function normalizeReferencePolicy(options = {}, defaultAllow = true) {
    const toSet = (value) => Array.isArray(value) ? new Set(value.map(String)) : value instanceof Set ? new Set([...value].map(String)) : null;
    return {
      defaultAllow: Object.prototype.hasOwnProperty.call(options, 'defaultAllow') ? options.defaultAllow : defaultAllow,
      actionRefs: toSet(options.allowedActionRefs || options.actions || options.actionRefs),
      eventRefs: toSet(options.allowedEventRefs || options.events || options.eventRefs),
      effectRefs: toSet(options.allowedEffectRefs || options.effects || options.effectRefs),
      authorize: typeof options.authorizeReference === 'function' ? options.authorizeReference : null
    };
  }

  function isReferenceAllowed(kind, ref, record, policy) {
    if (!ref) return true;
    if (!policy) return true;
    if (policy.authorize) return policy.authorize(kind, ref, record) === true;
    const allowed = kind === 'action' ? policy.actionRefs : kind === 'event' ? policy.eventRefs : policy.effectRefs;
    if (allowed) return allowed.has(String(ref));
    return policy.defaultAllow === true;
  }

  function validateReferencePolicy(record, policy) {
    const diagnostics = [];
    [['action', record.actionRef], ['event', record.eventRef], ['effect', record.effectRef]].forEach(([kind, ref]) => {
      if (!isReferenceAllowed(kind, ref, record, policy)) {
        diagnostics.push(createDiagnostic(`xcommand.registration.${kind}.unauthorized`, `XCommand ${record.id || '<unknown>'} uses an unauthorized ${kind} reference.`, { id: record.id, kind, ref, severity: 'error' }));
      }
    });
    return diagnostics;
  }

  function normalizeRegistration(record = {}, options = {}) {
    const id = String(record.id || '').trim();
    const sequence = parseKeySequence(record.sequence || record.keys || record.keySequence);
    const lane = String(record.lane || 'interaction');
    const diagnostics = [];

    if (!id) diagnostics.push(createDiagnostic('xcommand.registration.id.required', 'XCommand registration requires an id.'));
    if (!sequence.length) diagnostics.push(createDiagnostic('xcommand.registration.sequence.required', `XCommand ${id || '<unknown>'} requires a key sequence.`));
    if (!record.actionRef && !record.action && !record.eventRef && !record.event && !record.effectRef && !record.effect) {
      diagnostics.push(createDiagnostic('xcommand.registration.ref.required', `XCommand ${id || '<unknown>'} requires an action, event or effect reference.`));
    }
    if (!VALID_LANES.has(lane)) diagnostics.push(createDiagnostic('xcommand.registration.lane.invalid', `XCommand ${id || '<unknown>'} uses an invalid lane.`, { lane }));

    const keymap = record.keymap && typeof record.keymap === 'object' ? record.keymap : {};
    const normalized = {
      record: Object.freeze({
        schema: XCOMMAND_KERNEL_CONTRACT,
        id,
        scope: String(record.scope || DEFAULT_SCOPE),
        when: record.when ? String(record.when) : undefined,
        sequence: Object.freeze(sequence),
        sequenceKey: sequenceKey(sequence),
        label: Object.freeze(normalizeLabel(record.label, id)),
        icon: record.icon ? String(record.icon) : undefined,
        actionRef: record.actionRef || record.action ? String(record.actionRef || record.action) : undefined,
        eventRef: record.eventRef || record.event ? String(record.eventRef || record.event) : undefined,
        effectRef: record.effectRef || record.effect ? String(record.effectRef || record.effect) : undefined,
        lane,
        keymap: Object.freeze({
          group: String(keymap.group || 'general'),
          visible: keymap.visible !== false,
          order: Number.isFinite(Number(keymap.order)) ? Number(keymap.order) : 100
        })
      }),
      diagnostics
    };
    diagnostics.push(...validateReferencePolicy(normalized.record, normalizeReferencePolicy(options, true)));
    return normalized;
  }

  function normalizeKeyboardEvent(event = {}, options = {}) {
    const key = event.key || event.code || options.key || '';
    const modifiers = [];
    if (event.metaKey || options.metaKey) modifiers.push('Meta');
    if (event.ctrlKey || options.ctrlKey) modifiers.push('Ctrl');
    if (event.altKey || options.altKey) modifiers.push('Alt');
    if (event.shiftKey || options.shiftKey) modifiers.push('Shift');
    const baseKey = key.length === 1 ? key.toLowerCase() : key;
    const token = normalizeKeyToken([...modifiers, baseKey].join(modifiers.length ? '+' : ''));
    return Object.freeze({
      schema: XCOMMAND_KERNEL_CONTRACT,
      token: token.replace(/^Meta\+/, 'Mod+'),
      key: baseKey,
      scope: options.scope || DEFAULT_SCOPE,
      targetRole: options.targetRole || event.target && event.target.getAttribute && event.target.getAttribute('role') || undefined,
      repeat: Boolean(event.repeat),
      timestamp: Number(event.timeStamp || options.timestamp || Date.now())
    });
  }

  function createXCommandKernel(options = {}) {
    const registrations = new Map();
    const diagnostics = [];
    const chordTimeoutMs = Number.isFinite(Number(options.chordTimeoutMs)) ? Number(options.chordTimeoutMs) : DEFAULT_CHORD_TIMEOUT_MS;
    const xstate = options.xstate || null;
    const fabric = options.fabric || null;
    const actionExecutor = typeof options.actionExecutor === 'function' ? options.actionExecutor : null;
    const referencePolicy = normalizeReferencePolicy(options, true);
    let buffer = [];
    let lastStrokeAt = 0;

    function writeState(key, value) {
      if (xstate && typeof xstate.set === 'function') xstate.set(key, clone(value));
    }

    function readState(key) {
      if (xstate && typeof xstate.get === 'function') return xstate.get(key);
      return undefined;
    }

    function emitFabric(record) {
      if (fabric && typeof fabric.schedule === 'function') fabric.schedule(clone(record));
      else if (fabric && typeof fabric.record === 'function') fabric.record(clone(record));
      else if (fabric && typeof fabric.report === 'function') fabric.report(clone(record));
    }

    function register(input) {
      const normalized = normalizeRegistration(input, referencePolicy);
      diagnostics.push(...normalized.diagnostics);
      if (normalized.diagnostics.length) return function noopUnregister() {};
      const conflict = registrations.get(normalized.record.sequenceKey);
      if (conflict && conflict.scope === normalized.record.scope) {
        diagnostics.push(createDiagnostic('xcommand.registration.conflict', `XCommand ${normalized.record.id} conflicts with ${conflict.id}.`, { id: normalized.record.id, conflictId: conflict.id }));
        return function noopUnregister() {};
      }
      registrations.set(normalized.record.sequenceKey, normalized.record);
      writeState('xtend.xcommand.registry.count', registrations.size);
      return function unregister() {
        registrations.delete(normalized.record.sequenceKey);
        writeState('xtend.xcommand.registry.count', registrations.size);
      };
    }

    function resetChord(reason = 'manual') {
      const normalizedReason = RESET_REASONS.has(reason) ? reason : 'manual';
      if (buffer.length) writeState('xtend.xcommand.chord.reset', { reason: normalizedReason, sequence: buffer });
      buffer = [];
      lastStrokeAt = 0;
    }

    function activeScopeMatches(record, scope) {
      const activeScope = scope || readState('xtend.xcommand.scope') || DEFAULT_SCOPE;
      return record.scope === DEFAULT_SCOPE || record.scope === activeScope;
    }

    function dispatch(strokeInput) {
      const stroke = typeof strokeInput === 'string' ? { token: normalizeKeyToken(strokeInput), scope: DEFAULT_SCOPE, timestamp: Date.now() } : strokeInput;
      const now = Number(stroke.timestamp || Date.now());
      if (lastStrokeAt && now - lastStrokeAt > chordTimeoutMs) {
        writeState('xtend.xcommand.chord.timeout', { sequence: buffer, elapsedMs: now - lastStrokeAt });
        buffer = [];
      }
      lastStrokeAt = now;
      buffer.push(normalizeKeyToken(stroke.token || stroke.key));

      const candidates = [...registrations.values()].filter((record) => activeScopeMatches(record, stroke.scope));
      const exact = candidates.find((record) => sequenceKey(buffer) === record.sequenceKey);
      const pending = candidates.some((record) => isPrefix(buffer, record.sequence));

      if (exact) {
        const result = Object.freeze({ schema: XCOMMAND_KERNEL_CONTRACT, status: 'invoked', commandId: exact.id, sequence: [...buffer], lane: exact.lane, actionRef: exact.actionRef, eventRef: exact.eventRef, effectRef: exact.effectRef });
        writeState('xtend.xcommand.last', result);
        emitFabric({ kind: 'xcommand.dispatch', commandId: exact.id, lane: exact.lane, sequence: exact.sequence });
        if (actionExecutor) actionExecutor(exact, result);
        buffer = [];
        return result;
      }

      if (pending) {
        const result = Object.freeze({ schema: XCOMMAND_KERNEL_CONTRACT, status: 'pending-chord', sequence: [...buffer] });
        writeState('xtend.xcommand.pending', result);
        return result;
      }

      const result = Object.freeze({ schema: XCOMMAND_KERNEL_CONTRACT, status: 'ignored', sequence: [...buffer] });
      buffer = [];
      return result;
    }

    function getKeymap(scope) {
      return [...registrations.values()]
        .filter((record) => record.keymap.visible !== false && activeScopeMatches(record, scope || DEFAULT_SCOPE))
        .sort((a, b) => a.keymap.group.localeCompare(b.keymap.group) || a.keymap.order - b.keymap.order || a.id.localeCompare(b.id))
        .map((record) => Object.freeze({
          schema: XKEYMAP_SURFACE_CONTRACT,
          id: record.id,
          scope: record.scope,
          group: record.keymap.group,
          order: record.keymap.order,
          sequence: [...record.sequence],
          label: clone(record.label),
          icon: record.icon,
          lane: record.lane
        }));
    }

    return Object.freeze({
      schema: XCOMMAND_KERNEL_CONTRACT,
      register,
      dispatch,
      resetChord,
      getKeymap,
      normalizeKeyboardEvent,
      getDiagnostics: () => diagnostics.map(clone),
      getRegistrations: () => [...registrations.values()].map(clone)
    });
  }

  function createXKeymapModel(entries = [], options = {}) {
    const locale = options.locale || 'en';
    const platform = options.platform || (globalTarget.navigator && /Mac|iPhone|iPad/.test(globalTarget.navigator.platform || '') ? 'mac' : 'pc');
    const groups = new Map();
    entries.forEach((entry) => {
      const group = entry.group || 'general';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push({
        id: entry.id,
        icon: entry.icon,
        label: entry.label && (entry.label[locale] || entry.label.fallback || entry.label.i18nKey) || entry.id,
        sequence: (entry.sequence || []).map((token) => platform === 'mac' ? token.replace(/^Mod\+/, '⌘+') : token.replace(/^Mod\+/, 'Ctrl+')),
        lane: entry.lane
      });
    });
    return Object.freeze({ schema: XKEYMAP_SURFACE_CONTRACT, locale, platform, groups: [...groups.entries()].map(([id, commands]) => ({ id, commands })) });
  }

  function parseRmtXCommands(sourceText = '', options = {}) {
    const referencePolicy = normalizeReferencePolicy(options, false);
    const records = [];
    const diagnostics = [];
    const blockPattern = /xcommand\s+"([^"]+)"\s*\{([\s\S]*?)\}/g;
    let match;
    while ((match = blockPattern.exec(sourceText))) {
      const [, id, body] = match;
      function stringField(name) {
        const field = new RegExp(`${name}\\s*:\\s*"([^"]+)"`).exec(body);
        return field ? field[1] : undefined;
      }
      const labelMatch = /label\s*:\s*i18n\("([^"]+)"\s*,\s*"([^"]+)"\)/.exec(body);
      const keymapMatch = /keymap\s*:\s*group\("([^"]+)"\)(?:\s+order\((\d+)\))?(?:\s+visible\((true|false)\))?/.exec(body);
      const normalized = normalizeRegistration({
        id,
        keys: stringField('keys'),
        label: labelMatch ? { i18nKey: labelMatch[1], fallback: labelMatch[2] } : undefined,
        icon: stringField('icon'),
        action: /action\s*:\s*([\w:.\-]+)/.exec(body)?.[1],
        event: /event\s*:\s*([\w:.\-]+)/.exec(body)?.[1],
        effect: /effect\s*:\s*([\w:.\-]+)/.exec(body)?.[1],
        lane: /lane\s*:\s*([\w-]+)/.exec(body)?.[1],
        scope: stringField('scope'),
        keymap: keymapMatch ? { group: keymapMatch[1], order: keymapMatch[2] ? Number(keymapMatch[2]) : undefined, visible: keymapMatch[3] ? keymapMatch[3] !== 'false' : true } : undefined
      }, referencePolicy);
      diagnostics.push(...normalized.diagnostics);
      if (!normalized.diagnostics.length) records.push(normalized.record);
    }
    return Object.freeze({ schema: RMT_XCOMMAND_SCHEMA, records, diagnostics });
  }

  return Object.freeze({
    XCOMMAND_KERNEL_CONTRACT,
    XKEYMAP_SURFACE_CONTRACT,
    RMT_XCOMMAND_SCHEMA,
    DEFAULT_CHORD_TIMEOUT_MS,
    parseKeySequence,
    normalizeRegistration,
    normalizeKeyboardEvent,
    createXCommandKernel,
    createXKeymapModel,
    parseRmtXCommands
  });
});

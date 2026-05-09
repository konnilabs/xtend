(function attachXtendA11yScreenreaderSignals(globalTarget, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (globalTarget && typeof globalTarget === 'object') {
    globalTarget.XTendA11yScreenreaderSignals = Object.freeze({
      schema: api.SCREENREADER_SIGNALS_SCHEMA,
      contracts: api.CONTRACTS,
      definitions: api.SCREENREADER_SIGNAL_DEFINITIONS,
      liveRegionPolicies: api.LIVE_REGION_POLICIES,
      createScreenreaderSignal: api.createScreenreaderSignal,
      createScreenreaderSignalContract: api.createScreenreaderSignalContract,
      normalizeLiveRegion: api.normalizeLiveRegion,
      validateScreenreaderSignalContract: api.validateScreenreaderSignalContract
    });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createXtendA11yScreenreaderSignalsModule() {
  const CONTRACTS = Object.freeze({
    screenreaderSignals: 'xtend.a11y.screenreader-signals.v1',
    signal: 'xtend.a11y.screenreader-signal.v1',
    profile: 'xtend.a11y.profile.v1',
    test: 'xtend.a11y.test-contract.v1',
    fabricLaneMapping: 'xtend.fabric.rmt-lane-mapping.v1'
  });

  const SCREENREADER_SIGNALS_SCHEMA = CONTRACTS.screenreaderSignals;
  const SCREENREADER_SIGNAL_RECORD_SCHEMA = CONTRACTS.signal;

  const LIVE_REGION_POLICIES = Object.freeze({
    none: Object.freeze({
      politeness: 'off',
      requiresRegion: false,
      roles: []
    }),
    polite: Object.freeze({
      politeness: 'polite',
      requiresRegion: true,
      roles: ['status', 'log']
    }),
    assertive: Object.freeze({
      politeness: 'assertive',
      requiresRegion: true,
      roles: ['alert']
    })
  });

  const SCREENREADER_SIGNAL_DEFINITIONS = Object.freeze({
    'semantic-region': Object.freeze({
      kind: 'semantic',
      liveRegion: 'none',
      region: 'semantic',
      role: 'region',
      assertions: ['role-or-native-semantics', 'accessible-name']
    }),
    'state-change-announcement': Object.freeze({
      kind: 'state',
      liveRegion: 'polite',
      region: 'status',
      role: 'status',
      assertions: ['state-change-announcement', 'duplicate-announcement-guard']
    }),
    'state-change-summary': Object.freeze({
      kind: 'state',
      liveRegion: 'polite',
      region: 'status',
      role: 'status',
      assertions: ['state-change-summary', 'aria-busy-consistency']
    }),
    'status-announcement': Object.freeze({
      kind: 'status',
      liveRegion: 'polite',
      region: 'status',
      role: 'status',
      assertions: ['status-region', 'aria-live-polite', 'non-empty-announcement']
    }),
    'dismissal-announcement': Object.freeze({
      kind: 'status',
      liveRegion: 'polite',
      region: 'status',
      role: 'status',
      assertions: ['dismissal-announcement', 'duplicate-announcement-guard']
    }),
    'dialog-context': Object.freeze({
      kind: 'context',
      liveRegion: 'none',
      region: 'dialog',
      role: 'dialog',
      assertions: ['aria-modal', 'aria-labelledby-or-label']
    }),
    'focus-return': Object.freeze({
      kind: 'focus',
      liveRegion: 'none',
      region: 'focus',
      role: null,
      assertions: ['focus-return', 'escape-close']
    }),
    'route-change-announcement': Object.freeze({
      kind: 'navigation',
      liveRegion: 'polite',
      region: 'status',
      role: 'status',
      assertions: ['route-change-announcement', 'active-route-focus']
    }),
    'contrast-preservation': Object.freeze({
      kind: 'theme',
      liveRegion: 'none',
      region: 'semantic',
      role: 'region',
      assertions: ['no-color-only-state', 'focus-visible-token']
    }),
    'validation-error-summary': Object.freeze({
      kind: 'error',
      liveRegion: 'assertive',
      region: 'error',
      role: 'alert',
      assertions: ['error-region', 'aria-live-assertive', 'validation-error-summary']
    }),
    'submit-status': Object.freeze({
      kind: 'status',
      liveRegion: 'polite',
      region: 'status',
      role: 'status',
      assertions: ['submit-status', 'non-empty-announcement']
    }),
    'loading-state': Object.freeze({
      kind: 'status',
      liveRegion: 'polite',
      region: 'status',
      role: 'status',
      assertions: ['loading-announcement', 'aria-busy-consistency']
    }),
    'control-state': Object.freeze({
      kind: 'state',
      liveRegion: 'polite',
      region: 'status',
      role: 'status',
      assertions: ['control-state-announcement', 'keyboard-state-sync']
    })
  });

  const FABRIC_A11Y_ANNOUNCEMENT = Object.freeze({
    lane: 'a11y',
    fiberKind: 'a11y.announce',
    scheduleRef: 'a11y.user-blocking.announce',
    scheduleContract: CONTRACTS.fabricLaneMapping,
    boundary: 'fabric-adapter-schedules-announcement-rmt-kernel-remains-framework-agnostic'
  });

  function unique(values) {
    return Array.from(new Set((values || []).filter(Boolean)));
  }

  function normalizeLiveRegion(value, fallback = 'none') {
    const normalized = String(value || fallback || 'none').trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(LIVE_REGION_POLICIES, normalized)
      ? normalized
      : normalizeLiveRegion(fallback, 'none');
  }

  function getSignalDefinition(signal) {
    return SCREENREADER_SIGNAL_DEFINITIONS[signal] || Object.freeze({
      kind: 'custom',
      liveRegion: 'polite',
      region: 'status',
      role: 'status',
      assertions: ['custom-screenreader-signal']
    });
  }

  function normalizeSignalNames(input = {}) {
    const profileSignals = input.profile
      && input.profile.screenreader
      && Array.isArray(input.profile.screenreader.signals)
      ? input.profile.screenreader.signals
      : [];
    const directSignals = Array.isArray(input.signals) ? input.signals : [];
    const screenreaderSignals = input.screenreader
      && Array.isArray(input.screenreader.signals)
      ? input.screenreader.signals
      : [];

    return unique(profileSignals.concat(directSignals, screenreaderSignals).map((signal) => {
      if (typeof signal === 'string') return signal;
      return signal && signal.signal ? String(signal.signal) : null;
    }));
  }

  function resolveComponentRef(input = {}) {
    return input.componentRef || input.tag || (input.profile && input.profile.componentRef) || 'x-component';
  }

  function createRegionRecord(signalRecord, kind) {
    const livePolicy = LIVE_REGION_POLICIES[signalRecord.liveRegion] || LIVE_REGION_POLICIES.none;
    return {
      id: `${signalRecord.componentRef}.${signalRecord.signal}.${kind}-region`,
      sourceSignal: signalRecord.signal,
      kind,
      role: signalRecord.role || (kind === 'error' ? 'alert' : 'status'),
      ariaLive: signalRecord.liveRegion,
      ariaAtomic: true,
      required: signalRecord.required === true && livePolicy.requiresRegion === true
    };
  }

  function createScreenreaderSignal(signal, defaults = {}) {
    const input = typeof signal === 'string' ? { signal } : (signal || {});
    const signalName = String(input.signal || 'custom-announcement');
    const definition = getSignalDefinition(signalName);
    const liveRegion = normalizeLiveRegion(input.liveRegion || definition.liveRegion || defaults.liveRegion);
    const livePolicy = LIVE_REGION_POLICIES[liveRegion] || LIVE_REGION_POLICIES.none;
    const kind = input.kind || definition.kind || 'custom';
    const region = input.region || definition.region || (kind === 'error' ? 'error' : 'status');
    const role = input.role === undefined ? definition.role : input.role;

    return {
      schema: SCREENREADER_SIGNAL_RECORD_SCHEMA,
      contract: SCREENREADER_SIGNALS_SCHEMA,
      componentRef: defaults.componentRef || resolveComponentRef(defaults),
      signal: signalName,
      kind,
      region,
      role: role || null,
      liveRegion,
      politeness: livePolicy.politeness,
      required: input.required !== false,
      announcement: {
        mode: input.mode || (liveRegion === 'none' ? 'focus-or-semantic-context' : 'live-region-text'),
        source: input.source || 'component-state',
        textRequired: liveRegion !== 'none',
        emptyStringAllowed: false,
        duplicateSuppression: 'same-signal-and-text'
      },
      aria: {
        live: liveRegion === 'none' ? null : liveRegion,
        atomic: liveRegion === 'none' ? null : true,
        role: role || null
      },
      fabric: FABRIC_A11Y_ANNOUNCEMENT,
      assertions: unique(definition.assertions || [])
    };
  }

  function createScreenreaderSignalContract(input = {}) {
    const componentRef = resolveComponentRef(input);
    const signalNames = normalizeSignalNames(input);
    const profileLiveRegion = input.profile
      && input.profile.screenreader
      ? input.profile.screenreader.liveRegion
      : null;
    const defaultLiveRegion = normalizeLiveRegion(input.liveRegion || profileLiveRegion);
    const signals = signalNames.map((signal) => createScreenreaderSignal(signal, {
      componentRef,
      liveRegion: defaultLiveRegion
    }));
    const statusRegions = signals
      .filter((record) => record.region === 'status' && record.liveRegion !== 'none')
      .map((record) => createRegionRecord(record, 'status'));
    const errorRegions = signals
      .filter((record) => record.region === 'error' && record.liveRegion !== 'none')
      .map((record) => createRegionRecord(record, 'error'));
    const requiredAssertions = unique([
      'screenreader-signal-contract',
      signals.some((record) => record.liveRegion !== 'none') ? 'aria-live-policy' : null,
      statusRegions.length > 0 ? 'status-region-policy' : null,
      errorRegions.length > 0 ? 'error-region-policy' : null,
      'announcement-policy',
      'fabric-a11y-lane'
    ]);

    return {
      schema: SCREENREADER_SIGNALS_SCHEMA,
      status: 'accepted-contract',
      componentRef,
      profileRef: input.primaryProfile || (input.profile && input.profile.primaryProfile) || null,
      liveRegion: defaultLiveRegion,
      signals,
      statusRegions,
      errorRegions,
      announcementPolicy: {
        required: signals.some((record) => record.required),
        noSilentStateChanges: true,
        emptyAnnouncementsRefused: true,
        duplicateSuppression: 'same-signal-and-text',
        defaultLiveRegion
      },
      fabric: FABRIC_A11Y_ANNOUNCEMENT,
      testRefs: ['a11y-hydration', 'screenreader-signals', 'references'],
      requiredAssertions
    };
  }

  function validateScreenreaderSignalContract(contract) {
    const errors = [];
    const warnings = [];

    if (!contract || typeof contract !== 'object') {
      return { ok: false, errors: ['contract must be an object'], warnings };
    }

    if (contract.schema !== SCREENREADER_SIGNALS_SCHEMA) {
      errors.push(`schema must be ${SCREENREADER_SIGNALS_SCHEMA}`);
    }

    if (typeof contract.componentRef !== 'string' || contract.componentRef.length === 0) {
      errors.push('componentRef must be a non-empty string');
    }

    if (!Array.isArray(contract.signals) || contract.signals.length === 0) {
      errors.push('signals must contain at least one screenreader signal record');
    } else {
      contract.signals.forEach((record, index) => {
        if (!record || typeof record !== 'object') {
          errors.push(`signals[${index}] must be an object`);
          return;
        }
        if (record.schema !== SCREENREADER_SIGNAL_RECORD_SCHEMA) {
          errors.push(`signals[${index}].schema must be ${SCREENREADER_SIGNAL_RECORD_SCHEMA}`);
        }
        if (typeof record.signal !== 'string' || record.signal.length === 0) {
          errors.push(`signals[${index}].signal must be a non-empty string`);
        }
        if (!Object.prototype.hasOwnProperty.call(LIVE_REGION_POLICIES, record.liveRegion)) {
          errors.push(`signals[${index}].liveRegion must be none, polite or assertive`);
        }
        if (record.liveRegion !== 'none' && (!record.aria || record.aria.live !== record.liveRegion)) {
          errors.push(`signals[${index}] must mirror liveRegion into aria.live`);
        }
        if (record.required === true && record.region === 'status') {
          const statusRegion = Array.isArray(contract.statusRegions)
            && contract.statusRegions.some((region) => region.sourceSignal === record.signal);
          if (!statusRegion) errors.push(`status signal ${record.signal} requires a status region`);
        }
        if (record.required === true && record.region === 'error') {
          const errorRegion = Array.isArray(contract.errorRegions)
            && contract.errorRegions.some((region) => region.sourceSignal === record.signal);
          if (!errorRegion) errors.push(`error signal ${record.signal} requires an error region`);
        }
      });
    }

    if (!contract.fabric || contract.fabric.lane !== 'a11y' || contract.fabric.fiberKind !== 'a11y.announce') {
      errors.push('fabric mapping must use lane a11y and fiber kind a11y.announce');
    }

    if (Array.isArray(contract.signals) && contract.signals.length > 0 && contract.statusRegions && contract.statusRegions.length === 0) {
      const hasLiveStatusSignal = contract.signals.some((record) => record.region === 'status' && record.liveRegion !== 'none');
      if (hasLiveStatusSignal) warnings.push('live status signals exist without status regions');
    }

    return {
      ok: errors.length === 0,
      errors,
      warnings
    };
  }

  return {
    CONTRACTS,
    FABRIC_A11Y_ANNOUNCEMENT,
    LIVE_REGION_POLICIES,
    SCREENREADER_SIGNALS_SCHEMA,
    SCREENREADER_SIGNAL_DEFINITIONS,
    SCREENREADER_SIGNAL_RECORD_SCHEMA,
    createScreenreaderSignal,
    createScreenreaderSignalContract,
    normalizeLiveRegion,
    validateScreenreaderSignalContract
  };
});

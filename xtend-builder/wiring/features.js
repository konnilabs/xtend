const FEATURE_WIRING_SCHEMA = 'xtend.scaffold.feature-wiring.v1';

const FEATURE_PROFILE_RULES = {
  display: {
    stateKeys: ['ready'],
    events: ['ready'],
    apiNamespaces: [],
    reviewChecks: ['visible-dom', 'hydration-baseline']
  },
  interactive: {
    stateKeys: ['active'],
    events: ['activated', 'changed'],
    apiNamespaces: [],
    reviewChecks: ['keyboard', 'focus', 'event-contract']
  },
  stateful: {
    stateKeys: ['value', 'ready'],
    events: ['changed'],
    apiNamespaces: [],
    reviewChecks: ['canonical-xstate-key', 'xstate.subscribe', 'ssot-boundary']
  },
  feedback: {
    stateKeys: ['visible', 'dismissed'],
    events: ['shown', 'dismissed'],
    apiNamespaces: ['window.XTend.alert', 'window.XTend.toast'],
    reviewChecks: ['live-region', 'dismissal', 'timer-cleanup']
  },
  overlay: {
    stateKeys: ['open'],
    events: ['opened', 'closed'],
    apiNamespaces: ['window.XTend.dialog', 'window.XTend.modal'],
    reviewChecks: ['open-state', 'focus-return', 'state-writeback']
  },
  routing: {
    stateKeys: ['xtend.router.lastNavigated', 'xtend.router.current', 'xtend.router.lastRendered'],
    events: ['route-changed'],
    apiNamespaces: ['window.XTend.router'],
    reviewChecks: ['router-navigate', 'xstate-bridge', 'route-events']
  },
  theme: {
    stateKeys: ['xtend.theme.current', 'xtend.theme.available'],
    events: ['theme-changed'],
    apiNamespaces: ['window.XTend.theme'],
    reviewChecks: ['theme-state', 'css-custom-properties', 'legacy-facade-boundary']
  },
  form: {
    stateKeys: ['value', 'validity', 'error'],
    events: ['changed', 'submitted', 'invalid'],
    apiNamespaces: [],
    reviewChecks: ['value-contract', 'validation', 'labels']
  },
  media: {
    stateKeys: ['loading', 'ready', 'error'],
    events: ['loaded', 'error'],
    apiNamespaces: [],
    reviewChecks: ['loading-state', 'fallbacks', 'reduced-motion']
  }
};

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getDomainFromTag(tag) {
  return String(tag || '').replace(/^x-/, '');
}

function toStateKey(prefix, key) {
  return key.startsWith('xtend.') ? key : `${prefix}${key}`;
}

function toEventName(domain, action) {
  return action.includes('-') ? action : `${domain}-${action}`;
}

function collectProfileRules(profiles) {
  return profiles
    .map((profile) => ({
      profile,
      rule: FEATURE_PROFILE_RULES[profile] || FEATURE_PROFILE_RULES.display
    }));
}

function createFeatureWiring(input = {}) {
  const tag = String(input.tag || '').trim();
  const profiles = Array.isArray(input.profiles) && input.profiles.length > 0 ? input.profiles.slice() : ['display'];
  const features = Array.isArray(input.features) ? input.features.slice() : [];
  const domain = getDomainFromTag(tag);
  const statePrefix = `xtend.component.${tag}.<id>.`;
  const profileRules = collectProfileRules(profiles);
  const stateRequested = features.includes('state') || profileRules.some((entry) => entry.rule.stateKeys.length > 0);
  const eventsRequested = features.includes('events') || profileRules.some((entry) => entry.rule.events.length > 0);
  const stateKeys = stateRequested
    ? unique(profileRules.flatMap((entry) => entry.rule.stateKeys).map((key) => toStateKey(statePrefix, key)))
    : [];
  const eventNames = eventsRequested
    ? unique(profileRules.flatMap((entry) => entry.rule.events).map((event) => toEventName(domain, event)))
    : [];
  const apiNamespaces = unique([
    `window.XTend.components['${tag}']`,
    ...profileRules.flatMap((entry) => entry.rule.apiNamespaces)
  ]);

  return {
    schema: FEATURE_WIRING_SCHEMA,
    ok: Boolean(tag),
    mode: 'dry-run',
    selected: {
      profiles,
      features
    },
    state: {
      enabled: stateRequested,
      source: 'xstate',
      prefix: statePrefix,
      keys: stateKeys,
      read: 'xstate.get(key)',
      write: 'xstate.set(key, value)',
      subscribe: 'xstate.subscribe(fn, keyFilter?)',
      forbidden: ['xstate.on', 'xstate.off'],
      localUiPolicy: 'derived-render-cache-only'
    },
    events: {
      enabled: eventsRequested,
      names: eventNames,
      detailShape: {
        id: 'string',
        stateKey: 'string | undefined',
        value: 'unknown',
        source: tag
      },
      dispatchOptions: {
        bubbles: true,
        composed: true
      }
    },
    api: {
      enabled: apiNamespaces.length > 0,
      namespaceRoot: 'window.XTend',
      namespaces: apiNamespaces,
      forbiddenGlobals: [`window.show${input.className || ''}`],
      registration: 'optional-review-only'
    },
    profiles: profileRules.map((entry) => ({
      profile: entry.profile,
      stateKeys: entry.rule.stateKeys.map((key) => toStateKey(statePrefix, key)),
      events: entry.rule.events.map((event) => toEventName(domain, event)),
      apiNamespaces: entry.rule.apiNamespaces.slice(),
      reviewChecks: entry.rule.reviewChecks.slice()
    })),
    reviewRules: [
      'Generated state patterns must use canonical xtend.* keys.',
      'Stateful patterns must use xstate.subscribe(fn, keyFilter?) and must not call xstate.on/off directly.',
      'Generated UI fields may only be derived render caches, never a second source of truth.',
      'Generated API hints must prefer window.XTend.* and must not create new unnamespaced window.show* helpers.',
      'Feature wiring remains profile-driven and optional until productive generator writes are introduced.'
    ]
  };
}

module.exports = {
  FEATURE_PROFILE_RULES,
  FEATURE_WIRING_SCHEMA,
  createFeatureWiring
};

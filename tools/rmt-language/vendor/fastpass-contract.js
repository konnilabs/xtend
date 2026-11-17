(function attachFastPassContract(target) {
  // Shared by the synchronous RMT compiler and the browser executor.
  // FastPass is a local shell route, not an external-navigation capability.
  // Check both browser syntax and percent-decoded path syntax so router adapters
  // cannot turn an encoded scheme, authority or backslash into a new destination.
  function isSafeFastPassNavigation(value) {
    if (typeof value !== 'string' || !value || value !== value.trim() || /[\u0000-\u001f\u007f\\]/u.test(value)) return false;
    try {
      const route = value.split(/[?#]/u)[0];
      const decoded = decodeURIComponent(route);
      for (const candidate of [route, decoded]) {
        if (/[\u0000-\u001f\u007f\\]/u.test(candidate) || candidate.startsWith('//') || /^[^/]*:/u.test(candidate)) return false;
        const resolved = new URL(candidate || '.', 'https://fastpass.invalid/');
        if (resolved.origin !== 'https://fastpass.invalid') return false;
      }
      return true;
    } catch (_) { return false; }
  }
  function assertSafeFastPassNavigation(value) {
    if (!isSafeFastPassNavigation(value)) {
      const error = new TypeError('FastPass navigation requires a local relative route or fragment.');
      error.code = 'xtend.maraca.fastpass.unsafe-navigation';
      throw error;
    }
    return value;
  }
  function validateFastPassAction(action) {
    const errors = [];
    const nonempty = (value) => Array.isArray(value) ? value.length > 0 : Boolean(value);
    if (!action || typeof action !== 'object') return ['An action record is required.'];
    if (typeof action.id !== 'string' || !action.id.trim()) errors.push('A named action is required.');
    if (action.execution && action.execution !== 'fastpass') errors.push('Execution must be fastpass.');
    for (const key of ['reducers', 'emits', 'handlers', 'status', 'statusState', 'resultState', 'loadingState', 'datasource', 'dataSource', 'resources', 'streams', 'commands']) {
      if (nonempty(action[key])) errors.push(`FastPass cannot contain ${key}.`);
    }
    if (!Array.isArray(action.effects) || action.effects.length === 0) errors.push('At least one shell effect is required.');
    for (const effect of Array.isArray(action.effects) ? action.effects : []) {
      if (!effect || !['navigation', 'focus', 'close'].includes(effect.kind)) {
        errors.push('Only navigation, focus and close effects are allowed.');
        continue;
      }
      if (effect.command || effect.service || effect.resources || effect.stream || effect.reducer) errors.push('Shell effects cannot invoke business work.');
      if (effect.componentCommand && !(effect.kind === 'focus' && effect.componentCommand.command === 'focus')) errors.push('Custom component commands are forbidden.');
      if (effect.kind === 'navigation') {
        const path = effect.path;
        if (!(typeof path === 'string' && path.trim()) && !(path && path.kind === 'reference' && /^input\.[\w.]+$/.test(path.path || path.value || ''))) errors.push('Navigation requires a path or an input reference.');
        if (typeof path === 'string' && !isSafeFastPassNavigation(path)) errors.push('Navigation requires a local relative route or fragment.');
        if (effect.source) errors.push('Navigation cannot have a data source.');
      } else {
        const id = effect.target || (effect.componentCommand && effect.componentCommand.target && effect.componentCommand.target.id) || (effect.source && effect.source.kind === 'surface' && effect.source.target);
        if (typeof id !== 'string' || !id.trim()) errors.push('Focus and close require a named surface.');
        if (effect.source && !['surface', 'selector'].includes(effect.source.kind)) errors.push('Shell effects cannot have a data source.');
      }
    }
    return errors;
  }
  const api = Object.freeze({ validateFastPassAction, isSafeFastPassNavigation, assertSafeFastPassNavigation });
  if (typeof module === 'object' && module.exports) module.exports = api;
  target.XTendMaracaFastPassContract = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

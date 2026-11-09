// Explicit URL/History owner for a single route and Model session.
// x-router delegates its existing navigation notifications with listen:false.
export const XROUTER_URL_STATE_API_VERSION = '1.0.0';
export function createXRouterURLStateHost({ runtime, codec, windowTarget, mode = 'history', listen = false, isOwnerCurrent = () => true, onError = () => {} }) {
  if (!['history','hash'].includes(mode) || !windowTarget?.history || typeof runtime?.restoreURLState !== 'function' || typeof runtime?.publishURLState !== 'function' || codec?.API_VERSION !== '1.0.0') throw new TypeError('URL-state host requires a route owner, v1 codec and Maraca restore/publish ports.');
  let closed = false, sequence = 0, navigation = null, pending = Promise.resolve();
  function location() {
    const href = windowTarget.location.href, hashIndex = href.indexOf('#');
    const outer = hashIndex < 0 ? href : href.slice(0,hashIndex), hash = hashIndex < 0 ? '' : href.slice(hashIndex+1);
    const queryIndex = outer.indexOf('?'), hashQuery = hash.indexOf('?');
    const area = mode === 'hash' && hashQuery >= 0 ? 'hash' : 'outer';
    const query = area === 'hash' ? hash.slice(hashQuery+1) : queryIndex < 0 ? '' : outer.slice(queryIndex+1);
    const route = mode === 'hash' ? hash.split('?')[0].replace(/^\/?/,'/') : windowTarget.location.pathname;
    return { href, outer, hash, queryIndex, hashQuery, area, query, route };
  }
  const route = location().route;
  function current(record) { return !!record && !closed && navigation === record && !record.abort.signal.aborted && isOwnerCurrent() === true && location().href === record.href && location().route === route; }
  function context(record) { return { navigationId: record.id, signal: record.abort.signal, isCurrent: () => current(record) }; }
  function write(record, proposal) {
    if (!current(record)) throw new Error('URL navigation was superseded.');
    const here = location(), query = codec.withToken(here.query,proposal.token);
    // An empty hash query retains '?' so an unrelated outer query never becomes active.
    const next = here.area === 'hash'
      ? here.outer+'#'+here.hash.slice(0,here.hashQuery)+'?'+query
      : (here.queryIndex < 0 ? here.outer : here.outer.slice(0,here.queryIndex))+(query?'?'+query:'')+(here.href.includes('#')?'#'+here.hash:'');
    const method = proposal.mode === 'push' ? 'pushState' : 'replaceState';
    windowTarget.history[method](windowTarget.history.state,'',next);
    record.href = windowTarget.location.href;
  }
  async function publishFor(record,cause) {
    if (!current(record) || record.status !== 'restored') return { status: 'superseded' };
    const currentToken = cause === 'reset' ? null : codec.readQuery(location().query);
    return runtime.publishURLState({ cause, currentToken, lifetime: context(record), write: proposal => write(record,proposal) });
  }
  function navigate(cause = 'traverse', force = false) {
    if (closed) return Promise.reject(new Error('URL-state host is disposed.'));
    if (!['initialize','traverse','reset'].includes(cause)) return Promise.reject(new TypeError('Invalid navigation cause.'));
    const here = location();
    if (!force && navigation?.href === here.href && navigation.status !== 'deferred' && cause === 'traverse') return pending;
    navigation?.abort.abort();
    const record = { id: 'url-navigation-'+(++sequence), abort: new AbortController(), href: here.href, status: 'pending', cause }; navigation = record;
    pending = (async () => {
      if (!current(record)) return { status: 'superseded' };
      const token = cause === 'reset' ? null : codec.readQuery(here.query);
      const result = await runtime.restoreURLState(token,context(record));
      if (!current(record)) return { status: 'superseded' };
      record.status = result.status;
      if (result.status === 'restored') await publishFor(record,cause);
      return result;
    })().catch(error => {
      if (!current(record)) return { status: 'superseded' };
      record.status = 'error'; try { onError(error); } catch (_) {} throw error;
    });
    // Event-driven callers may observe errors through onError; explicit callers still receive rejection.
    pending.catch(() => {}); return pending;
  }
  const listener = () => { navigate('traverse').catch(() => {}); };
  const events = mode === 'hash' ? ['popstate','hashchange'] : ['popstate'];
  if (listen) events.forEach(name => windowTarget.addEventListener(name,listener));
  return Object.freeze({ schema: 'xtend.router.url-state-host.v1', apiVersion: XROUTER_URL_STATE_API_VERSION,
    navigate, publish: (cause = 'commit') => {
      if (!['commit','checkpoint'].includes(cause)) return Promise.reject(new TypeError('Explicit publication accepts commit or checkpoint.'));
      return publishFor(navigation,cause);
    },
    reset: () => navigate('reset',true), retry: () => navigate(navigation?.cause || 'traverse',true), whenIdle: () => pending,
    dispose() { if (closed) return false; closed = true; navigation?.abort.abort(); if (listen) events.forEach(name => windowTarget.removeEventListener(name,listener)); return true; }
  });
}

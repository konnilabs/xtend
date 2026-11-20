import { getManagedContext } from './native-managed.js';

const bindings = new WeakMap();
const capabilities = Object.freeze({
  'x-router': 'router.bind',
  'x-surface-manager': 'surface.manager.bind',
  'x-surface-portal': 'surface.portal.bind',
  'x-surface-region': 'surface.bind',
  'x-surface-window': 'surface.bind',
  'x-side-panel': 'surface.bind'
});

// This is a private host binding, never a serialized component prop or event.
// The dispatcher receives the element through its trusted owner lease.
export function managedPlatformBinding(element) {
  const context = getManagedContext(element);
  if (!context) return null;
  if (!context.isCurrent() || context.signal?.aborted) throw new Error('Native platform owner is disposed');
  const existing = bindings.get(element);
  if (existing) return existing.binding;
  if (typeof context.isActive === 'function' && !context.isActive()) return null;
  const capability = capabilities[context.tag || element.localName];
  if (!capability) throw new Error('Unknown native platform role');
  const binding = context.request(capability, { role: context.tag || element.localName });
  if (!binding || typeof binding.then === 'function' || typeof binding.release !== 'function') {
    throw new TypeError(`${capability} requires a synchronous owner-scoped host binding`);
  }
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    bindings.delete(element);
    binding.release();
  };
  bindings.set(element, { binding, release });
  context.onCleanup(release);
  return binding;
}

export function releaseManagedPlatform(element) {
  const entry = bindings.get(element);
  if (!entry) return false;
  entry.release();
  return true;
}

export function connectManagedPlatform(element) {
  const binding = managedPlatformBinding(element);
  if (!binding) return null;
  binding.connect?.();
  return binding;
}

export function managedPlatformCommand(element, command, payload = {}) {
  const context = getManagedContext(element);
  if (context && typeof context.isActive === 'function' && !context.isActive()) throw new Error('Native platform owner is inactive');
  const binding = managedPlatformBinding(element);
  if (!binding) return null;
  if (typeof binding.command !== 'function') throw new Error('Native platform command port is missing');
  return { managed: true, result: binding.command(command, payload) };
}

export function managedBoundsScope(element, active) {
  if (getManagedContext(element) && !bindings.has(element) && getManagedContext(element).isActive?.() === false) return true;
  if (!active && getManagedContext(element) && !bindings.has(element)) return true;
  const binding = managedPlatformBinding(element);
  if (!binding) return false;
  if (active && typeof binding.leaseBounds !== 'function') throw new Error('Native Surface bounds lease is missing');
  binding.leaseBounds?.(Boolean(active));
  return true;
}

const commandNames = Object.freeze({
  'x-router': ['navigate','canNavigate'],
  'x-surface-manager': ['snapshot'],
  'x-surface-portal': ['update'],
  'x-surface-region': ['open','close','focus','restore','update'],
  'x-surface-window': ['open','close','focus','restore','update','minimize','maximize','move','resize'],
  'x-side-panel': ['open','close','focus','restore','update','minimize','resize','pin','unpin','collapse','expand','dock']
});

export function managedPlatformProfile(tag) {
  const profile = { commands: Object.fromEntries((commandNames[tag] || []).map(name => [name, function(args) {
    const binding = managedPlatformBinding(this);
    if (!binding || typeof binding.executeCommand !== 'function') throw new Error('Native platform requires its admitted command adapter');
    // The trusted bridge invokes this handler once inside the genuine Effect's
    // exact Kernel job. Physical gestures use binding.command's own compiled job.
    return binding.executeCommand(name,args);
  }])) };
  if(tag==='x-router')profile.prepare=function(context){context.onCleanup(context.registerProjectionValidator(values=>{
    const routes=values.properties.routes;if(routes===undefined)return;
    const paths=new Set();
    if(!Array.isArray(routes)||routes.length>256)throw new TypeError('Managed routes require a bounded array');
    for(const row of routes){if(!row||typeof row.path!=='string'||!row.path.startsWith('/')||row.path.startsWith('//')||row.path.length>2048||/[\\\u0000-\u001f]/u.test(row.path)||paths.has(row.path))throw new TypeError('Managed routes require unique local destination paths');paths.add(row.path);}
  }));};
  return profile;
}

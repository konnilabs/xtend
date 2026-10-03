/** Creates a route-shell descriptor service without global state. */
export function createShellDescriptor({ renderDescriptor, createFallbackShell }) {
  if (typeof renderDescriptor !== 'function' || typeof createFallbackShell !== 'function') {
    throw new TypeError('renderDescriptor and createFallbackShell are required');
  }
  let disposed = false;
  return Object.freeze({
    render(target, descriptor, context) {
      if (disposed) return null;
      return renderDescriptor(target, descriptor, context);
    },
    fallback(context) {
      if (disposed) return null;
      return createFallbackShell(context);
    },
    dispose() { disposed = true; }
  });
}

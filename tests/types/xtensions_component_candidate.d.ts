import type { ComponentCall } from '../../development/rmtx-a06/two-host.types.js';
// Fixture-only language host declarations; not a production RMTX SDK.
declare global {
  namespace JSX { interface Element {} interface ElementChildrenAttribute { children: {}; } }
  interface A06Product { id: string; images: string[]; selectedImageId: string; reviewsSort: string; }
  const model: { product: A06Product };
  function ProductHeader(props: { product: A06Product }): JSX.Element;
  const RMT: {
    Surface(props: { id: string; children?: unknown }): JSX.Element;
    XTension(props: ComponentCall & { declarationId: string; lane: 'visible' | 'idle' }): JSX.Element;
  };
}

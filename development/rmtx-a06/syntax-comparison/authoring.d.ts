// Experimental fixture vocabulary 1.0.0; declarations only, no runtime module.
import type { ComponentIdentityMap, ComponentCall } from '../two-host.types';
export namespace JSX {
  interface Element { readonly __rmtExperiment: unique symbol }
  interface ElementChildrenAttribute { children: unknown }
}
interface Children { children?: JSX.Element | readonly JSX.Element[] }
export declare namespace RMT {
  function Program(p: Children & { id: string; documentId: string }): JSX.Element;
  function State(p: { id: string; type: 'object'; initial: object; preserve: true }): JSX.Element;
  function Action(p: Children & { id: string }): JSX.Element;
  function Input(p: { name: string; type: 'string' | 'object' }): JSX.Element;
  function Reduce(p: { state: string; path?: string; value: unknown }): JSX.Element;
  function Portal(p: { id: string; root: string; layer: 'surface' }): JSX.Element;
  function Surface(p: Children & { id: string; kind: 'region'; component: 'section'; portal: string; lane: 'visible'; mount: string }): JSX.Element;
  function View(p: Children & { documentId: string; ownerSurface: string }): JSX.Element;
  function XTension(p: ComponentCall & { declarationId: string; targetSurface: string; presence: boolean; lane?: 'visible' | 'idle' }): JSX.Element;
}
export declare const model: {
  readonly product: { readonly id: string; readonly images: readonly string[]; readonly selectedImageId: string; readonly reviewsSort: string };
  readonly hosts: { readonly gallery: boolean; readonly reviews: boolean };
};
export declare const input: { readonly imageId: string; readonly sort: string; readonly hosts: { readonly gallery: boolean; readonly reviews: boolean } };
// Provider IDs participate in the discriminated ComponentCall type. Pins remain
// independently authoritative in providers/catalog.json, not in source strings.
export declare const providers: { readonly gallery: 'react-product-gallery'; readonly reviews: 'vue-product-reviews' };
export type CapturedIdentity = ComponentIdentityMap;
export declare function ProductHeader(p: { product: typeof model.product }): JSX.Element;

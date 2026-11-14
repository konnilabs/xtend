import type { ComponentCall, ProductGalleryProps, ProductReviewsProps } from '../../development/rmtx-a06/two-host.types.js';
declare global { namespace JSX { interface Element {} } }
declare const XTension: (props: ComponentCall) => JSX.Element;
const gallery = <XTension provider="react-product-gallery" props={{ images: ['front'], selectedImageId: 'front' }} intents={{ selectImage: { action: 'product.selectImage' } }} />;
const reviews = <XTension provider="vue-product-reviews" props={{ productId: 'p1', sort: 'recent' }} intents={{ changeSort: { action: 'product.changeSort', payload: { sort: 'order' } } }} />;
// @ts-expect-error A provider ID selects its own prop types.
const wrongType = <XTension provider="react-product-gallery" props={{ images: [], selectedImageId: 42 }} />;
// @ts-expect-error Caller-defined attributes cannot widen provider props.
const wrongProp = <XTension provider="vue-product-reviews" props={{ productId: 'p1', sort: 'recent', title: 'leak' }} />;
// @ts-expect-error This event is not exported by the gallery.
const wrongEvent = <XTension provider="react-product-gallery" props={{ images: [], selectedImageId: 'front' }} intents={{ changeSort: { action: 'product.changeSort' } }} />;
// @ts-expect-error The source payload field must belong to the provider event.
const wrongMapping = <XTension provider="vue-product-reviews" props={{ productId: 'p1', sort: 'recent' }} intents={{ changeSort: { action: 'product.changeSort', payload: { sort: 'missing' } } }} />;
declare const g: ProductGalleryProps, r: ProductReviewsProps;
g.xtension.emit({ type: 'selectImage', payload: { imageId: 'front' } });
r.xtension.emit({ type: 'changeSort', payload: { order: 'rating' } });
// @ts-expect-error The provider event uses order; sort belongs to the Action.
r.xtension.emit({ type: 'changeSort', payload: { sort: 'rating' } });
void [gallery, reviews, wrongType, wrongProp, wrongEvent, wrongMapping];

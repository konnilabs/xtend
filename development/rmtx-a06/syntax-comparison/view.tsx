/** @jsxImportSource . */
// The build explicitly pairs this view with classic.rmt. Classic owns lanes.
import { RMT, model, providers, ProductHeader } from './authoring';
export default (
  <RMT.View documentId="a06-product-details" ownerSurface="product-details">
    <ProductHeader product={model.product} />
    <RMT.XTension declarationId="product-gallery" targetSurface="product-gallery-host" provider={providers.gallery}
      presence={model.hosts.gallery}
      props={{ images: model.product.images, selectedImageId: model.product.selectedImageId }}
      intents={{ selectImage: { action: 'product.selectImage' } }} />
    <RMT.XTension declarationId="product-reviews" targetSurface="product-reviews-host" provider={providers.reviews}
      presence={model.hosts.reviews}
      props={{ productId: model.product.id, sort: model.product.reviewsSort }}
      intents={{ changeSort: { action: 'product.changeSort', payload: { sort: 'order' } } }} />
  </RMT.View>
);

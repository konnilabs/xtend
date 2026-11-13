// A06 design candidate, not accepted RMTX syntax or a runtime JSX module.
// Model/Actions/provider interfaces are supplied by two-host.rmt + the contract.
// Native ProductHeader and the exact file/import syntax remain to be compared.
<RMT.Surface id="product-details">
  <ProductHeader product={model.product} />
  <RMT.XTension
    declarationId="product-gallery"
    provider="react-product-gallery"
    lane="visible"
    props={{ images: model.product.images, selectedImageId: model.product.selectedImageId }}
    intents={{ selectImage: { action: "product.selectImage" } }}
  />
  <RMT.XTension
    declarationId="product-reviews"
    provider="vue-product-reviews"
    lane="idle"
    props={{ productId: model.product.id, sort: model.product.reviewsSort }}
    intents={{ changeSort: { action: "product.changeSort" } }}
  />
</RMT.Surface>;

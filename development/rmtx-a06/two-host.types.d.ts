// Generated from two-host.contract.json; run two-host-inspect.cjs --write.
export interface ProductGalleryProps {
  readonly "images": readonly (string)[];
  readonly "selectedImageId": string;
  readonly xtension: { emit(event: { type: "selectImage"; payload: { readonly "imageId": string } }): unknown };
}

export interface ProductReviewsProps {
  readonly "productId": string;
  readonly "sort": string;
  readonly xtension: { emit(event: { type: "changeSort"; payload: { readonly "sort": string } }): unknown };
}

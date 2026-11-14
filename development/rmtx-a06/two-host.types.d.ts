// Generated from captured provider-owned interface files; never from call-site types.
export type JsonValue = string | number | boolean | null | readonly JsonValue[] | { readonly [key: string]: JsonValue };
export interface ComponentIdentityMap {
  readonly "react-product-gallery": { readonly interfaceVersion: "1.0.0"; readonly interfaceSha256: "45394fbe58a8f81445891526967d691786ef1ecf2fd6eb08e520e69322c76539"; readonly componentVersion: "2.0.0"; readonly moduleSha256: "9846140e741d787f0feef302fb3ca3ef75e7519dd54a7fc1f0fd9448cb07df37" };
  readonly "vue-product-reviews": { readonly interfaceVersion: "1.0.0"; readonly interfaceSha256: "30de14608052cdd250f1f56b06fa0b5c7df8dda73803d5d5daa96355e5a6f1e4"; readonly componentVersion: "2.0.0"; readonly moduleSha256: "71e48dfdb1e797493aba0748e9777b9cb3afdbee6faf90c217df3f88aa239db8" };
}
export interface ComponentPropsMap {
  readonly "react-product-gallery": { readonly "images": readonly (string)[]; readonly "selectedImageId": string };
  readonly "vue-product-reviews": { readonly "productId": string; readonly "sort": string };
}
export interface ComponentIntentPayloadMap {
  readonly "react-product-gallery": { readonly "selectImage": { readonly "imageId": string } };
  readonly "vue-product-reviews": { readonly "changeSort": { readonly "order": string } };
}
export type ProviderId = keyof ComponentPropsMap;
export type ComponentEvent<P extends ProviderId> = { [E in keyof ComponentIntentPayloadMap[P]]: { type: E; payload: ComponentIntentPayloadMap[P][E] } }[keyof ComponentIntentPayloadMap[P]];
export type ComponentProps<P extends ProviderId> = ComponentPropsMap[P] & { readonly xtension: { emit(event: ComponentEvent<P>): unknown } };
export type ComponentCall = { [P in ProviderId]: { provider: P; props: ComponentPropsMap[P]; intents?: { [E in keyof ComponentIntentPayloadMap[P]]?: { action: string; payload?: Readonly<Record<string, Extract<keyof ComponentIntentPayloadMap[P][E], string>>> } } } }[ProviderId];
export type ProductGalleryProps = ComponentProps<"react-product-gallery">;
export type ProductReviewsProps = ComponentProps<"vue-product-reviews">;

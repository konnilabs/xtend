/** @param {{React: {createElement: (...args: any[]) => any}}} peers */
export function createComponent({ React }) {
  /** @param {import('../two-host.types.js').ProductGalleryProps} props */
  return function ProductGallery({ images, selectedImageId, xtension }) {
    return React.createElement('label', null, 'Image ',
      React.createElement('select', { 'aria-label': 'Image', value: selectedImageId,
        /** @param {{currentTarget: HTMLSelectElement}} event */
        onChange(event) { return xtension.emit({ type: 'selectImage', payload: { imageId: event.currentTarget.value } }); } },
      images.map(id => React.createElement('option', { key: id, value: id }, id))),
      React.createElement('output', null, selectedImageId));
  };
}

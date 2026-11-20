// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XLightbox } from "./xlightbox.definition.js";
export * from "./xlightbox.definition.js";
defineManagedComponent("x-lightbox", XLightbox);

(function () {
  function showLightbox(src) {
    let lightbox = document.querySelector('x-lightbox');
    if (!lightbox) {
      lightbox = document.createElement('x-lightbox');
      document.body.appendChild(lightbox);
    }
    lightbox.open(src);
  }

  function bindLightboxImages(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('img[data-xlightbox]').forEach((image) => {
      if (image.hasAttribute('data-xlightbox-bound')) return;
      image.setAttribute('data-xlightbox-bound', '');
      image.addEventListener('click', function () {
        showLightbox(this.currentSrc || this.src);
      });
    });
  }

  if (typeof window !== 'undefined') {
    window.showLightbox = showLightbox;
    window.XLightbox = XLightbox;
    window.addEventListener('DOMContentLoaded', () => bindLightboxImages(document));
    document.addEventListener('xrouter-after-navigate', () => bindLightboxImages(document));
  }

  XLightbox.show = showLightbox;
  XLightbox.bindImages = bindLightboxImages;
})();

export { default } from "./xlightbox.definition.js";

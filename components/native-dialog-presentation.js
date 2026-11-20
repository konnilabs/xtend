import { managedDimension } from './native-style-values.js';

/** Validate the complete managed declaration before any attribute setter runs. */
export function prepareManagedDialogPresentation(element, context) {
  if (element.localName !== 'x-dialog') return;
  const remove = context.registerProjectionValidator(({ attributes }) => {
    for (const name of ['width', 'height']) {
      const value = attributes[name];
      if (value !== undefined && value !== null) managedDimension(element, value, name);
    }
  });
  context.onCleanup(remove);
}

/** Dimensions are individual CSSOM values, never stylesheet source. */
export function applyManagedDialogDimensions(element, surface, state) {
  const width = managedDimension(element, state.width || 'min(90vw, 480px)', 'width');
  const height = managedDimension(element, state.height || 'auto', 'height');
  surface.style.setProperty('width', width);
  surface.style.setProperty('height', height);
}

/** Titles are text; rich content has its own sanitizer boundary. */
export function applyManagedDialogTitle(title, value) {
  title.textContent = value == null ? '' : String(value);
}

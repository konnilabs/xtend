import type { ManagedNativeContext } from '../tools/xtensions/native-component-managed.js';
export declare function prepareManagedDialogPresentation(element: HTMLElement, context: ManagedNativeContext): void;
export declare function applyManagedDialogDimensions(element: HTMLElement, surface: HTMLElement, state: { width?: string | null; height?: string | null }): void;
export declare function applyManagedDialogTitle(title: HTMLElement, value: string | null | undefined): void;

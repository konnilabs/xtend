/** Private component-owned shells; application view ownership stays with RMT. */
export declare function componentNode<K extends keyof HTMLElementTagNameMap>(documentTarget: Document, tag: K, attributes?: Record<string, string | number | boolean | null | undefined>, children?: Array<Node | string>): HTMLElementTagNameMap[K];
export declare function createComponentStyle(cssText: string, documentTarget?: Document): HTMLStyleElement;
export declare function createCloseIcon(documentTarget: Document, inlineSize?: boolean): SVGSVGElement;

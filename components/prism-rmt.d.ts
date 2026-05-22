export interface XtendRmtPrismHighlightInput {
  code: string;
  language?: string;
  rawLanguage?: string;
}

export interface XtendRmtPrismHighlightResult {
  html: string;
  highlighted: boolean;
  engine: 'prism' | 'plain-text';
  language: string;
}

export interface XtendRmtPrismHighlighter {
  schema: 'xtend.rmt.prism-middleware.v1';
  highlight(input: XtendRmtPrismHighlightInput): XtendRmtPrismHighlightResult;
}

export interface XtendRmtPrismApi {
  schema: 'xtend.rmt.prism-middleware.v1';
  aliases: string[];
  normalizeLanguage(language?: string): string;
  createRmtGrammar(prism?: unknown): Record<string, unknown>;
  register(prism: unknown): boolean;
  createHighlighter(prism: unknown): XtendRmtPrismHighlighter;
}

declare global {
  interface Window {
    XTendRmtPrism?: XtendRmtPrismApi;
  }
}

export {};

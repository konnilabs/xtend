export {};

declare global {
  interface TurndownOptions {
    headingStyle?: 'setext' | 'atx';
    hr?: string;
    bulletListMarker?: '-' | '+' | '*';
    codeBlockStyle?: 'indented' | 'fenced';
    fence?: '```' | '~~~';
    emDelimiter?: '_' | '*';
    strongDelimiter?: '**' | '__';
    linkStyle?: 'inlined' | 'referenced';
    linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
    preformattedCode?: boolean;
    [option: string]: unknown;
  }

  interface TurndownRule {
    filter?: string | string[] | ((node: Node, options: TurndownOptions) => boolean);
    replacement?: (content: string, node: Node, options: TurndownOptions) => string;
  }

  class TurndownService {
    constructor(options?: TurndownOptions);
    options: TurndownOptions;
    rules: Array<{ name: string; rule: TurndownRule }>;
    addRule(name: string, rule: TurndownRule): this;
    turndown(input: string | Node): string;
  }

  interface Window {
    TurndownService: typeof TurndownService;
  }
}

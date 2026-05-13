export = Prism;
export as namespace Prism;

declare namespace Prism {
  type TokenStream = string | Token | Array<string | Token>;
  type GrammarValue = RegExp | GrammarToken | Array<RegExp | GrammarToken>;

  interface Grammar {
    [token: string]: GrammarValue | Grammar | undefined;
    rest?: Grammar;
  }

  interface GrammarToken {
    pattern: RegExp;
    lookbehind?: boolean;
    greedy?: boolean;
    alias?: string | string[];
    inside?: Grammar;
  }

  interface HighlightEnvironment {
    code: string;
    grammar?: Grammar;
    language: string;
    element?: Element;
    highlightedCode?: string;
    tokens?: TokenStream[];
  }

  interface WrapEnvironment {
    type: string;
    content: string;
    tag: string;
    classes: string[];
    attributes: Record<string, string>;
    language: string;
  }

  interface Hooks {
    all: Record<string, Array<(env: unknown) => void>>;
    add(name: string, callback: (env: unknown) => void): void;
    run(name: string, env: unknown): void;
  }

  class Token {
    constructor(type: string, content: TokenStream, alias?: string | string[], matchedStr?: string);
    type: string;
    content: TokenStream;
    alias?: string | string[];
    length: number;
    static stringify(value: TokenStream | TokenStream[], language: string): string;
  }

  const manual: boolean | undefined;
  const disableWorkerMessageHandler: boolean | undefined;
  const languages: Record<string, Grammar> & {
    plain: Grammar;
    plaintext: Grammar;
    text: Grammar;
    txt: Grammar;
    extend(id: string, redef: Grammar): Grammar;
    insertBefore(id: string, before: string, insert: Grammar, root?: Record<string, Grammar>): Grammar;
    DFS(grammar: Grammar, callback: (this: Grammar, key: string, value: unknown, type?: string) => void): void;
  };
  const plugins: Record<string, unknown>;
  const hooks: Hooks;

  function highlight(code: string, grammar: Grammar, language: string): string;
  function highlightElement(element: Element, async?: boolean, callback?: (this: Element) => void): void;
  function highlightAll(async?: boolean, callback?: (this: Element) => void): void;
  function highlightAllUnder(container: ParentNode, async?: boolean, callback?: (this: Element) => void): void;
  function tokenize(code: string, grammar: Grammar): TokenStream[];
}

(function registerXtendRmtPrism(globalTarget) {
  const RMT_PRISM_SCHEMA = 'xtend.rmt.prism-middleware.v1';
  const LANGUAGE_ALIASES = Object.freeze({
    rmt: 'rmt',
    'rmt-vnext': 'rmt',
    xtendrmt: 'rmt'
  });

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/`/g, '&#96;');
  }

  function normalizeLanguage(language) {
    const value = String(language || 'text').trim().toLowerCase();
    return LANGUAGE_ALIASES[value] || value || 'text';
  }

  function createRmtGrammar() {
    return {
      comment: [
        { pattern: /\/\/.*/, greedy: true },
        { pattern: /\/\*[\s\S]*?(?:\*\/|$)/, greedy: true }
      ],
      string: [
        { pattern: /"(?:\\.|[^"\\])*"/, greedy: true },
        { pattern: /'(?:\\.|[^'\\])*'/, greedy: true }
      ],
      'rmt-boundary': {
        pattern: /\btrust\s+boundary\b/,
        alias: ['keyword', 'rmt-boundary']
      },
      'rmt-remote-surface': {
        pattern: /\bremote\s+surface\b/,
        alias: ['keyword', 'rmt-primitive']
      },
      'rmt-event-binding': {
        pattern: /\bon\s+[^\n{]+?->\s+action\b/,
        inside: {
          keyword: /\b(?:on|action)\b/,
          operator: /->/,
          string: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/,
          'rmt-reference': {
            pattern: /\b[A-Za-z_][\w-]*(?:\.[A-Za-z_][\w-]*)+\b/,
            alias: ['variable', 'rmt-reference']
          },
          punctuation: /[()[\].]/
        }
      },
      'rmt-lifecycle': {
        pattern: /\b(?:mount|hydrate|update|unmount|suspend|resume|invalidate|dispose|prewarm|recycle|detach|reattach|destroy)\b/,
        alias: ['keyword', 'rmt-lifecycle']
      },
      'rmt-primitive': {
        pattern: /\b(?:template|state|selector|datasource|action|portal|overlay|resource|surface|lane|slot|stream)\b/,
        alias: ['keyword', 'rmt-primitive']
      },
      keyword: /\b(?:import|from|endpoint|sse|worker|fixture|when|sanitize|where|find|sort|by|asc|desc|output|method|contract|result|fallback|input|reduce|effect|fetch|status|emit|with|success|error|message|tone|root|layer|kind|component|source|key|bounds|weight|type|initial|preserve|repeat|releases|owner|focus|pointer|scroll|policy|close|topmost|none|restore|passthrough|lock-when-modal|target|payload|preventDefault|detail|dataset|exposes|consumes|remote|manifest|version)\b/,
      boolean: /\b(?:true|false|null)\b/,
      number: /\b-?(?:0x[\da-f]+|\d+(?:\.\d+)?)\b/i,
      'rmt-component': {
        pattern: /(\bcomponent\s+)[A-Za-z][\w-]*/,
        lookbehind: true,
        alias: ['class-name', 'rmt-component']
      },
      'rmt-reference': {
        pattern: /\b(?:state|selector|datasource|action|portal|overlay|resource|surface|lane|input|result|record|detail|target|instance)\.[A-Za-z_][\w-]*(?:\.[A-Za-z_][\w-]*)*\b/,
        alias: ['variable', 'rmt-reference']
      },
      'rmt-identifier': {
        pattern: /\b[A-Za-z_][\w-]*(?:\.[A-Za-z_][\w-]*)+\b/,
        alias: ['property', 'rmt-identifier']
      },
      operator: /->|==|!=|>=|<=|\|\||&&|[=<>]/,
      punctuation: /[{}()[\],.]/
    };
  }

  function register(prism) {
    if (!prism || !prism.languages) return false;
    const grammar = prism.languages.rmt || createRmtGrammar(prism);
    prism.languages.rmt = grammar;
    prism.languages['rmt-vnext'] = grammar;
    prism.languages.xtendrmt = grammar;
    return true;
  }

  function createHighlighter(prism) {
    register(prism);
    return {
      schema: RMT_PRISM_SCHEMA,
      highlight(input = {}) {
        const code = String(input.code == null ? '' : input.code);
        const language = normalizeLanguage(input.language || input.rawLanguage);
        const grammar = prism && prism.languages && prism.languages[language];
        if (!grammar || typeof prism.highlight !== 'function') {
          return {
            html: escapeHtml(code),
            highlighted: false,
            engine: 'plain-text',
            language
          };
        }
        return {
          html: prism.highlight(code, grammar, language),
          highlighted: true,
          engine: 'prism',
          language
        };
      }
    };
  }

  const api = {
    schema: RMT_PRISM_SCHEMA,
    aliases: Object.keys(LANGUAGE_ALIASES),
    normalizeLanguage,
    createRmtGrammar,
    register,
    createHighlighter
  };

  globalTarget.XTendRmtPrism = api;
  if (globalTarget.Prism) register(globalTarget.Prism);
})(typeof window !== 'undefined' ? window : globalThis);

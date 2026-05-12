const path = require('path');

const RMT_SNIPPET_CATALOG_SCHEMA = 'xtend.rmt.snippet-catalog.v1';
const RMT_SNIPPET_SCHEMA = 'xtend.rmt.snippet.v1';
const RMT_EDITOR_PACKAGING_SCHEMA = 'xtend.rmt.editor-packaging.v1';
const RMT_EDITOR_PACKAGING_WORKPACKAGE = 'WP-E14-12';
const RMT_SNIPPET_MODULE_PATH = 'tools/rmt-language/snippets/index.js';
const RMT_SNIPPET_VSCODE_PATH = 'tools/rmt-language/snippets/rmt.code-snippets';
const RMT_EDITOR_PACKAGING_SUITE_PATH = 'tests/rmt-language/rmt_editor_packaging_suite.js';
const RMT_EDITOR_PACKAGING_PACKAGE_SCRIPT = 'npm run test:rmt-editor-packaging';
const RMT_LANGUAGE_SERVER_ENTRYPOINT = 'tools/rmt-language-server/server.js';
const RMT_VSCODE_BRIDGE_PATH = 'tools/rmt-editor/vscode/extension.js';

function body(lines) {
  return lines;
}

const RMT_SNIPPETS = Object.freeze([
  {
    id: 'rmt-vnext-template',
    name: 'RMT vNext Template',
    prefix: 'rmt-vnext-template',
    description: 'Native vNext Template mit Surface, Lane und Lifecycle Operation.',
    scope: 'rmt',
    tags: ['vnext', 'template', 'surface', 'lane'],
    body: body([
      'template ${1:app.page} {',
      '  surface root {',
      '    lane ${2|critical,visible,transition,idle,background,diagnostics|} {',
      '      mount ${3:app-shell}',
      '    }',
      '  }',
      '}'
    ])
  },
  {
    id: 'rmt-vnext-stream',
    name: 'RMT vNext Stream',
    prefix: 'rmt-vnext-stream',
    description: 'vNext Stream mit Data Source, Trust Boundary und Sanitizing.',
    scope: 'rmt',
    tags: ['vnext', 'stream', 'security'],
    body: body([
      'stream ${1:live-feed} from ${2|endpoint,sse,worker|} ${3:feed.live} {',
      '  trust boundary "${4:xtend.security.streaming-boundary.v1}"',
      '  sanitize ${5:html}',
      '}'
    ])
  },
  {
    id: 'rmt-vnext-action',
    name: 'RMT vNext Event Action',
    prefix: 'rmt-vnext-action',
    description: 'vNext Event Binding auf eine referenzielle Action.',
    scope: 'rmt',
    tags: ['vnext', 'event', 'action'],
    body: body([
      'on ${1:submit} -> action ${2:settings.save}'
    ])
  },
  {
    id: 'rmt-minimal-app',
    name: 'RMT Minimal App',
    prefix: 'rmt-app',
    description: 'Native .rmt App-Shell mit XTend Component, Route, Schedule und Template.',
    scope: 'rmt',
    tags: ['app', 'xtend', 'xrouter', 'shell-first'],
    body: body([
      '{',
      '  "kind": "rmt_document",',
      '  "version": "1.0",',
      '  "manifest": {',
      '    "documentId": "${1:app.shell}",',
      '    "namespace": "${2:app}"',
      '  },',
      '  "adapters": [',
      '    {',
      '      "id": "xtend.component",',
      '      "kind": "component_adapter",',
      '      "kernelVisible": false',
      '    },',
      '    {',
      '      "id": "xtend.xrouter",',
      '      "kind": "router_adapter",',
      '      "kernelVisible": false',
      '    }',
      '  ],',
      '  "components": [',
      '    {',
      '      "id": "${3:pages.home}",',
      '      "kind": "custom_element",',
      '      "adapter": "xtend.component",',
      '      "tag": "${4:x-section}",',
      '      "schedule": "component.visible.mount"',
      '    }',
      '  ],',
      '  "routes": [',
      '    {',
      '      "id": "${5:home}",',
      '      "path": "${6:/}",',
      '      "router": "xtend.xrouter",',
      '      "component": "${3:pages.home}",',
      '      "template": "home.shell",',
      '      "schedule": "route.visible.render",',
      '      "documentTitle": "${7:Home | XTend}"',
      '    }',
      '  ],',
      '  "schedules": [',
      '    {',
      '      "id": "route.visible.render",',
      '      "endpointName": "xtendrmt.route.render",',
      '      "lane": "visible",',
      '      "priority": 80',
      '    },',
      '    {',
      '      "id": "component.visible.mount",',
      '      "endpointName": "xtendrmt.component.mount",',
      '      "lane": "visible",',
      '      "priority": 70',
      '    }',
      '  ],',
      '  "templates": [',
      '    {',
      '      "id": "home.shell",',
      '      "mode": "dom_descriptor",',
      '      "nodes": []',
      '    }',
      '  ]',
      '}'
    ])
  },
  {
    id: 'rmt-xtend-component',
    name: 'RMT XTend Component Record',
    prefix: 'rmt-component',
    description: 'XTend Custom Element als framework-agnostischer RMT Component Record.',
    scope: 'rmt',
    tags: ['component', 'xtend', 'fabric'],
    body: body([
      '{',
      '  "id": "${1:components.card}",',
      '  "kind": "custom_element",',
      '  "adapter": "xtend.component",',
      '  "tag": "${2:x-card}",',
      '  "schedule": "${3:component.visible.mount}",',
      '  "props": {',
      '    "label": "${4:Card}"',
      '  },',
      '  "metadata": {',
      '    "fabric": {',
      '      "lane": "${5:visible}"',
      '    }',
      '  }',
      '}'
    ])
  },
  {
    id: 'rmt-xrouter-route',
    name: 'RMT XRouter Route',
    prefix: 'rmt-route',
    description: 'XRouter Route mit Component-, Template-, Schedule- und SEO-Title-Refs.',
    scope: 'rmt',
    tags: ['route', 'xrouter', 'seo'],
    body: body([
      '{',
      '  "id": "${1:settings}",',
      '  "path": "${2:/settings}",',
      '  "router": "xtend.xrouter",',
      '  "component": "${3:pages.settings}",',
      '  "template": "${4:settings.shell}",',
      '  "schedule": "${5:route.visible.render}",',
      '  "documentTitle": "${6:Settings | XTend}"',
      '}'
    ])
  },
  {
    id: 'rmt-schedule',
    name: 'RMT Schedule Policy',
    prefix: 'rmt-schedule',
    description: 'Scheduler Policy fuer RMT/Fabric Lane Mapping.',
    scope: 'rmt',
    tags: ['schedule', 'fabric', 'lane'],
    body: body([
      '{',
      '  "id": "${1:component.visible.mount}",',
      '  "endpointName": "${2:xtendrmt.component.mount}",',
      '  "lane": "${3|visible,user-blocking,transition,idle,background,diagnostics|}",',
      '  "priority": ${4:70},',
      '  "deadlineMs": ${5:160},',
      '  "preferIdle": ${6:false}',
      '}'
    ])
  },
  {
    id: 'rmt-dom-template',
    name: 'RMT DOM Descriptor Template',
    prefix: 'rmt-template-dom',
    description: 'Sicherer dom_descriptor Template Record fuer shell-first Rendering.',
    scope: 'rmt',
    tags: ['template', 'dom_descriptor', 'trusted-dom'],
    body: body([
      '{',
      '  "id": "${1:home.shell}",',
      '  "mode": "dom_descriptor",',
      '  "nodes": [',
      '    {',
      '      "tag": "${2:main}",',
      '      "children": []',
      '    }',
      '  ],',
      '  "hydration": {',
      '    "mode": "${3:runtime_render}"',
      '  }',
      '}'
    ])
  },
  {
    id: 'rmt-html-template',
    name: 'RMT HTML Fragment Template',
    prefix: 'rmt-template-html',
    description: 'HTML Fragment Template mit expliziter Trusted-DOM-Boundary.',
    scope: 'rmt',
    tags: ['template', 'html_fragment', 'security'],
    body: body([
      '{',
      '  "id": "${1:article.shell}",',
      '  "mode": "html_fragment",',
      '  "markup": "${2:<main></main>}",',
      '  "security": {',
      '    "markupClass": "htmlFragment",',
      '    "trustBoundary": "xtend.security.sanitizing-boundary.v1",',
      '    "sink": "trustedDomBoundary"',
      '  },',
      '  "hydration": {',
      '    "mode": "${3:runtime_render}"',
      '  }',
      '}'
    ])
  }
]);

function cloneSnippet(snippet) {
  return {
    schema: RMT_SNIPPET_SCHEMA,
    ...snippet,
    body: snippet.body.slice()
  };
}

function createRmtSnippetCatalog(options = {}) {
  const snippets = RMT_SNIPPETS
    .filter((snippet) => !options.scope || snippet.scope === options.scope)
    .map(cloneSnippet);

  return {
    schema: RMT_SNIPPET_CATALOG_SCHEMA,
    workpackage: RMT_EDITOR_PACKAGING_WORKPACKAGE,
    primaryExtension: '.rmt',
    fallbackExtensions: ['.rmt.json', '.json'],
    networkRequired: false,
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
    snippets
  };
}

function toVsCodeSnippet(snippet) {
  return {
    scope: snippet.scope || 'rmt',
    prefix: snippet.prefix,
    body: snippet.body.slice(),
    description: snippet.description
  };
}

function createVsCodeSnippetDocument(options = {}) {
  return createRmtSnippetCatalog(options).snippets.reduce((document, snippet) => {
    document[snippet.name] = toVsCodeSnippet(snippet);
    return document;
  }, {});
}

function createEditorPackagingManifest(options = {}) {
  const rootDir = options.rootDir ? path.resolve(options.rootDir) : null;
  const serverPath = rootDir
    ? path.join(rootDir, RMT_LANGUAGE_SERVER_ENTRYPOINT)
    : RMT_LANGUAGE_SERVER_ENTRYPOINT;

  return {
    schema: RMT_EDITOR_PACKAGING_SCHEMA,
    workpackage: RMT_EDITOR_PACKAGING_WORKPACKAGE,
    languageId: 'rmt',
    primaryExtension: '.rmt',
    fallbackExtensions: ['.rmt.json', '.json'],
    lsp: {
      sourceOfTruth: 'tools/rmt-language-server/server.js',
      transport: 'stdio-json-rpc',
      command: 'node',
      args: [serverPath]
    },
    snippets: {
      schema: RMT_SNIPPET_CATALOG_SCHEMA,
      module: RMT_SNIPPET_MODULE_PATH,
      vscode: RMT_SNIPPET_VSCODE_PATH
    },
    editors: {
      vscode: {
        bridge: RMT_VSCODE_BRIDGE_PATH,
        languageConfiguration: 'tools/rmt-editor/vscode/language-configuration.json',
        grammar: 'tools/rmt-editor/vscode/syntaxes/rmt.tmLanguage.json',
        snippets: RMT_SNIPPET_VSCODE_PATH
      },
      jetbrains: {
        mode: 'generic-lsp-client',
        command: 'node',
        args: [serverPath],
        fileType: 'RMT',
        extension: '.rmt'
      },
      neovim: {
        mode: 'nvim-lspconfig-custom-server',
        cmd: ['node', serverPath],
        filetypes: ['rmt']
      },
      helix: {
        mode: 'languages.toml',
        command: 'node',
        args: [serverPath],
        languageId: 'rmt'
      }
    },
    networkRequired: false,
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
  };
}

function resolveEditorSetup(editor, options = {}) {
  const manifest = createEditorPackagingManifest(options);
  const key = String(editor || '').toLowerCase();

  return manifest.editors[key] || null;
}

module.exports = {
  RMT_EDITOR_PACKAGING_PACKAGE_SCRIPT,
  RMT_EDITOR_PACKAGING_SCHEMA,
  RMT_EDITOR_PACKAGING_SUITE_PATH,
  RMT_EDITOR_PACKAGING_WORKPACKAGE,
  RMT_LANGUAGE_SERVER_ENTRYPOINT,
  RMT_SNIPPET_CATALOG_SCHEMA,
  RMT_SNIPPET_MODULE_PATH,
  RMT_SNIPPET_SCHEMA,
  RMT_SNIPPET_VSCODE_PATH,
  RMT_VSCODE_BRIDGE_PATH,
  createEditorPackagingManifest,
  createRmtSnippetCatalog,
  createVsCodeSnippetDocument,
  resolveEditorSetup
};

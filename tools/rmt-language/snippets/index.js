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
    id: 'rmt-vnext-primitive-shell',
    name: 'RMT vNext Primitive Shell',
    prefix: 'rmt-vnext-primitive-shell',
    description: 'Granulare App Shell mit State, Selector, Action, Portal, Surface, Lane und Event nur in vNext.',
    scope: 'rmt',
    tags: ['vnext', 'primitive', 'state', 'surface', 'action'],
    body: body([
      'template ${1:app.shell} {',
      '  state ${2:app.status} type object preserve {',
      '    initial {',
      '      id "${3:status}"',
      '      text "${4:Ready}"',
      '    }',
      '  }',
      '',
      '  selector ${2:app.status} from state ${2:app.status} {',
      '    output ${5:AppStatus}',
      '  }',
      '',
      '  action ${6:app.save} {',
      '    input label string',
      '    reduce state.${2:app.status}.text = "${7:Saved}"',
      '    emit ${8:app.saved} with label input.label',
      '  }',
      '',
      '  portal surface.root root "#${9:app-root}" layer surface',
      '',
      '  surface ${10:app.status.card} kind card component ${11:x-status} {',
      '    source selector ${2:app.status}',
      '    key status.id',
      '    portal surface.root',
      '',
      '    lane visible weight 50 {',
      '      hydrate ${12:status-card} from selector ${2:app.status}',
      '    }',
      '',
      '    on click "[data-action=save]" -> action ${6:app.save} {',
      '      payload label from target.dataset.label',
      '    }',
      '  }',
      '}'
    ])
  },
  {
    id: 'rmt-vnext-validation',
    name: 'RMT vNext Validation',
    prefix: 'rmt-vnext-validation',
    description: 'Blocking Validation-Gruppe mit Field Rules und Action Gate.',
    scope: 'rmt',
    tags: ['vnext', 'validation', 'form', 'action-gate'],
    body: body([
      'validation ${1:app.contact} {',
      '  mode blocking',
      '  target action ${2:app.next}',
      '  field ${3:app.email} required email message "${4:Enter a valid email address.}"',
      '}'
    ])
  },
  {
    id: 'rmt-vnext-transition',
    name: 'RMT vNext Surface Transition',
    prefix: 'rmt-vnext-transition',
    description: 'Surface Transition mit Trigger, Surface-Gruppen, Effekt und Dauer.',
    scope: 'rmt',
    tags: ['vnext', 'transition', 'surface', 'motion'],
    body: body([
      'transition ${1:app.contactToIssue} {',
      '  trigger action ${2:app.nextContact}',
      '  from surfaces [${3:app.contact} ${4:app.nextContact}]',
      '  to surfaces [${5:app.issue} ${6:app.backContact}]',
      '  effect ${7|fade,crossfade,slide-left,slide-right,slide-up,slide-down,scale,none|}',
      '  durationMs ${8:240}',
      '  easing "${9:ease-out}"',
      '  lane transition',
      '}'
    ])
  },
  {
    id: 'rmt-vnext-maraca-orchestration-app',
    name: 'RMT vNext Maraca Orchestration App',
    prefix: 'rmt-vnext-maraca-orchestration-app',
    description: 'Kompakte Maraca App mit State, Action, Validation, Transition und XTend Surfaces.',
    scope: 'rmt',
    tags: ['vnext', 'maraca', 'orchestration', 'validation', 'transition'],
    body: body([
      'template ${1:app.service} {',
      '  state ${2:app.step} type object preserve {',
      '    initial {',
      '      id "step"',
      '      value "contact"',
      '    }',
      '  }',
      '',
      '  state ${3:app.email} type object preserve {',
      '    initial {',
      '      id "email"',
      '      value ""',
      '    }',
      '  }',
      '',
      '  selector ${2:app.step} from state ${2:app.step} {',
      '    output StepView',
      '  }',
      '',
      '  action ${4:app.nextContact} {',
      '    reduce state.${2:app.step}.value = "issue"',
      '    emit ${5:app.stepChanged} with step "issue"',
      '  }',
      '',
      '  validation ${6:app.contact} {',
      '    mode blocking',
      '    target action ${4:app.nextContact}',
      '    field ${3:app.email} required email message "Enter a valid email address."',
      '  }',
      '',
      '  portal surface.root root "#xtend-maraca-root" layer surface',
      '',
      '  surface ${7:app.contact.surface} kind form component x-input {',
      '    source selector ${2:app.step}',
      '    portal surface.root',
      '    key "contact"',
      '    lane visible weight 80 {',
      '      hydrate contact-email from selector ${2:app.step}',
      '    }',
      '  }',
      '',
      '  surface ${8:app.next.surface} kind action component x-button {',
      '    source selector ${2:app.step}',
      '    portal surface.root',
      '    key "next"',
      '    lane visible weight 80 {',
      '      mount contact-next from selector ${2:app.step}',
      '    }',
      '    on click "#contact-next" -> action ${4:app.nextContact} {',
      '      payload label "Next"',
      '    }',
      '  }',
      '',
      '  transition ${9:app.contactToIssue} {',
      '    trigger action ${4:app.nextContact}',
      '    from surfaces [${7:app.contact.surface} ${8:app.next.surface}]',
      '    to surfaces [${10:app.issue.surface}]',
      '    effect crossfade',
      '    durationMs 240',
      '    easing "ease-out"',
      '    lane transition',
      '  }',
      '}'
    ])
  },
  {
    id: 'rmt-vnext-remote-surface',
    name: 'RMT vNext Remote Surface',
    prefix: 'rmt-vnext-remote-surface',
    description: 'Remote Surface mit Owner, Integrity, Fallback, Exposes und Events.',
    scope: 'rmt',
    tags: ['vnext', 'remote', 'surface', 'mfe'],
    body: body([
      'remote surface ${1:checkout.cart} from remote "${2:@xtend/checkout-cart}" {',
      '  owner team "${3:checkout-platform}"',
      '  version "${4:^2.4.0}"',
      '  origin "${5:https://cdn.xtend.example}"',
      '  integrity sha256 "${6:sha256-...}"',
      '  trust boundary "xtend.security.remote-surface.v1"',
      '  fallback surface ${7:checkout.cart.fallback}',
      '',
      '  exposes lane ${8|critical,visible,idle,background|} -> shell.slot "${9:sidebar.cart}"',
      '}'
    ])
  },
  {
    id: 'rmt-vnext-remote-event',
    name: 'RMT vNext Remote Event',
    prefix: 'rmt-vnext-remote-event',
    description: 'Remote emits/consumes Event mit Owner, Richtung, Lane und Payload.',
    scope: 'rmt',
    tags: ['vnext', 'remote', 'event'],
    body: body([
      '${1|emits,consumes|} ${2:checkout.cart.updated.v1} {',
      '  owner team "${3:checkout-platform}"',
      '  direction ${4|outbound,inbound|}',
      '  lane ${5|critical,visible,idle,background|}',
      '  payload "${6:xtend.schemas.cartUpdated.v1}"',
      '}'
    ])
  },
  {
    id: 'rmt-vnext-remote-fallback',
    name: 'RMT vNext Remote Fallback',
    prefix: 'rmt-vnext-remote-fallback',
    description: 'Fallback Surface fuer Remote Degradation deklarieren.',
    scope: 'rmt',
    tags: ['vnext', 'remote', 'fallback', 'degradation'],
    body: body([
      'fallback surface ${1:checkout.cart.fallback}'
    ])
  },
  {
    id: 'rmt-vnext-remote-degradation',
    name: 'RMT vNext Remote Degradation Policy',
    prefix: 'rmt-vnext-remote-degradation',
    description: 'Degradation-relevante Remote-Fakten im Authoring sichtbar machen.',
    scope: 'rmt',
    tags: ['vnext', 'remote', 'degradation'],
    body: body([
      'fallback surface ${1:checkout.cart.fallback}',
      'exposes lane ${2|critical,visible,idle,background|} -> shell.slot "${3:sidebar.cart}"'
    ])
  },
  {
    id: 'rmt-owned-collection-view',
    name: 'RMT Owned Collection View',
    prefix: 'rmt-owned-collection-view',
    description: 'Native-first collection view with resource-backed data, selector, templates and selection state.',
    scope: 'rmt',
    tags: ['native-first', 'owned', 'collectionViews', 'data-display'],
    body: body([
      '{',
      '  "kind": "rmt_document",',
      '  "version": "1.0",',
      '  "dataSources": [',
      '    {',
      '      "id": "${1:datasource.items}",',
      '      "owner": "${2:component-data-display-owner}",',
      '      "adapter": "${3:static-fixture}",',
      '      "policy": "resource-owner-required",',
      '      "records": []',
      '    }',
      '  ],',
      '  "resources": [',
      '    {',
      '      "id": "${4:resource.items}",',
      '      "dataSource": "${1:datasource.items}",',
      '      "lifecycle": "query",',
      '      "cachePolicy": "owner-scoped",',
      '      "loadingState": "${5:state.items.loading}",',
      '      "errorState": "${6:state.items.error}"',
      '    }',
      '  ],',
      '  "state": [',
      '    { "id": "${5:state.items.loading}", "type": "boolean", "initial": false },',
      '    { "id": "${6:state.items.error}", "type": "string", "initial": "" },',
      '    { "id": "${7:state.items.selection}", "type": "single-selection", "key": "$record.id", "initial": "" }',
      '  ],',
      '  "selectors": [',
      '    {',
      '      "id": "${8:selector.visibleItems}",',
      '      "source": "${4:resource.items}",',
      '      "resultState": "${9:state.items.visible}"',
      '    }',
      '  ],',
      '  "templates": [',
      '    { "id": "${10:template.item}", "renderMode": "dom_descriptor", "root": { "type": "component", "component": "${11:component.item}" } },',
      '    { "id": "${12:template.empty}", "renderMode": "dom_descriptor", "root": { "type": "component", "component": "${13:component.empty}" } }',
      '  ],',
      '  "collectionViews": [',
      '    {',
      '      "id": "${14:collection.items}",',
      '      "source": "${8:selector.visibleItems}",',
      '      "layoutMode": "${15|list-grid,list,grid|}",',
      '      "key": "$record.id",',
      '      "itemTemplate": "${10:template.item}",',
      '      "emptyTemplate": "${12:template.empty}",',
      '      "selection": "${7:state.items.selection}",',
      '      "maxItemsPerFrame": ${16:50}',
      '    }',
      '  ]',
      '}'
    ])
  },
  {
    id: 'rmt-owned-command-search',
    name: 'RMT Owned Command Search',
    prefix: 'rmt-owned-command-search',
    description: 'Native-first command/search source with action refs, query state and resource-backed results.',
    scope: 'rmt',
    tags: ['native-first', 'owned', 'commandSources', 'searchSources'],
    body: body([
      '{',
      '  "kind": "rmt_document",',
      '  "version": "1.0",',
      '  "state": [',
      '    { "id": "${1:state.command.query}", "type": "string", "initial": "" },',
      '    { "id": "${2:state.command.activeIndex}", "type": "integer", "initial": 0 },',
      '    { "id": "${3:state.command.selection}", "type": "single-selection", "key": "$record.id", "initial": "" },',
      '    { "id": "${4:state.command.result}", "type": "string", "initial": "" }',
      '  ],',
      '  "resources": [',
      '    {',
      '      "id": "${5:resource.commands}",',
      '      "dataSource": "${6:datasource.commands}",',
      '      "lifecycle": "query",',
      '      "cachePolicy": "owner-scoped",',
      '      "release": "on-surface-close"',
      '    }',
      '  ],',
      '  "selectors": [',
      '    {',
      '      "id": "${7:selector.visibleCommands}",',
      '      "source": "${5:resource.commands}",',
      '      "query": "${1:state.command.query}",',
      '      "resultState": "${8:state.command.visible}"',
      '    }',
      '  ],',
      '  "commandSources": [',
      '    {',
      '      "id": "${9:command.global}",',
      '      "surface": "${10:surface.command-search}",',
      '      "trigger": "${11:event.command.open}",',
      '      "shortcut": "${12:Mod+K}",',
      '      "registeredCommands": [',
      '        { "id": "${13:command.open}", "label": "${14:Open item}", "action": "${15:action.command.open}" }',
      '      ],',
      '      "resultState": "${4:state.command.result}",',
      '      "actionRefRequired": true',
      '    }',
      '  ],',
      '  "searchSources": [',
      '    {',
      '      "id": "${16:search.commands}",',
      '      "queryState": "${1:state.command.query}",',
      '      "resource": "${5:resource.commands}",',
      '      "selector": "${7:selector.visibleCommands}",',
      '      "minQueryLength": ${17:1},',
      '      "debounceMs": ${18:120},',
      '      "activeIndexState": "${2:state.command.activeIndex}",',
      '      "selectionState": "${3:state.command.selection}"',
      '    }',
      '  ]',
      '}'
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

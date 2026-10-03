'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { packageExports, fingerprint, inside, posix } = require('./sources');
const { createResolver } = require('./modules');

function linkRepository(index, analyses, edge, fileId) {
  const documents = [...index.documents.values()];
  const fileAt = absolute => documents.find(document => document.filePath === absolute);
  for (const rootDir of index.roots) {
    const files = documents.filter(document => document.rootDir === rootDir).map(document => ({ ...document, path: document.workspacePath }));
    const packages = index.packages.filter(pkg => pkg.rootDir === rootDir);
    const provenance = (provider, path, evidence = 'declared') => ({ provider, path, evidence });
    const resolve = index.ts && createResolver(index.ts, rootDir, packages, files);
    for (const file of files.filter(file => /(?:^|\/)(?:package|tsconfig[^/]*)\.json$/.test(file.path))) {
      if (/package\.json$/.test(file.path)) {
        try { JSON.parse(file.text); } catch { index.coverage.push({ path: file.path, provider: 'package-json', code: 'invalid-package-manifest', detail: 'Package boundary and export configuration are incomplete.' }); }
      } else if (index.ts) {
        const parsed = index.ts.parseConfigFileTextToJson(file.filePath, file.text);
        if (parsed.error) index.coverage.push({ path: file.path, provider: 'typescript', code: 'invalid-tsconfig', detail: index.ts.flattenDiagnosticMessageText(parsed.error.messageText, '\n') });
      }
    }
    if (!index.ts) index.coverage.push({ path: '.', provider: 'typescript', code: 'typescript-unavailable', detail: 'Module and suite graph unavailable; RMT remains usable.' });
    const catalogPath = 'scripts/test-runner/catalog.json';
    const suiteCatalog = files.find(file => file.path === catalogPath);
    if (suiteCatalog) {
      try {
        const source = JSON.parse(suiteCatalog.text);
        if (source.version !== 1 || !Array.isArray(source.suites)) throw new Error('Unsupported suite catalog.');
        for (const suite of source.suites) {
          const record = { id: `suite:${pathToFileURL(rootDir).href}:${suite.id}`, suiteId: suite.id, runnerPath: catalogPath, defaultIncluded: suite.defaultIncluded, implementations: [] };
          if (suite.aliasOf) edge(record.id, `suite:${pathToFileURL(rootDir).href}:${suite.aliasOf}`, 'test-metadata', provenance('suite-catalog', catalogPath), { role: 'suite-alias' });
          for (const implementation of suite.implementations || []) {
            const target = path.resolve(rootDir, implementation.path);
            if (!inside(rootDir, target) || !fileAt(target)) { index.coverage.push({ path: catalogPath, provider: 'suite-catalog', code: 'missing-suite-implementation', detail: `${suite.id}: ${implementation.path}` }); continue; }
            record.implementations.push({ ...implementation, id: `${fileId(target)}#${implementation.function}` });
            edge(record.id, fileId(target), 'suite-implementation', provenance('suite-catalog', catalogPath, 'declared'), { function: implementation.function, arguments: implementation.arguments });
          }
          if (!record.implementations.length) index.coverage.push({ path: catalogPath, provider: 'suite-catalog', code: 'unknown-suite-implementation', detail: suite.id });
          index.suites.push(record);
        }
      } catch (error) { index.coverage.push({ path: catalogPath, provider: 'suite-catalog', code: 'invalid-suite-catalog', detail: error.message }); }
    }
    for (const pkg of packages) {
      edge(pkg.id, fileId(path.join(pkg.directory, 'package.json')), 'package-manifest', provenance('package-json', pkg.manifestPath));
      for (const document of files) if (document.projectId === `project:${pathToFileURL(pkg.directory).href}`) edge(pkg.id, document.id, 'package-member', provenance('package-json', pkg.manifestPath));
    }
    for (const mapping of packageExports(files)) {
      const pkg = packages.find(pkg => pkg.manifestPath === mapping.manifestPath);
      if (!pkg) continue;
      const targets = mapping.target.includes('*') ? files.filter(file => file.path.startsWith(mapping.target.split('*')[0]) && file.path.endsWith(mapping.target.split('*')[1])).map(file => file.path) : [mapping.target];
      for (const target of targets) edge(pkg.id, fileId(path.join(rootDir, target)), 'package-export', provenance('package-json', mapping.manifestPath), { module: mapping.module, conditions: mapping.conditions });
    }
    for (const document of files) {
      const analysis = analyses.get(document.uri);
      if (document.language !== 'module' || !analysis || !resolve) continue;
      for (const gap of analysis.gaps) index.coverage.push({ ...gap, documentId: document.id, path: document.path, provider: 'typescript' });
      for (const imported of analysis.imports) {
        if (typeof imported.specifier !== 'string' || !imported.specifier) {
          index.coverage.push({ documentId: document.id, path: document.path, provider: 'typescript', code: 'invalid-module-specifier', detail: 'The parser did not retain a static module specifier.' });
          continue;
        }
        const modes = imported.typeOnly ? ['types'] : [imported.kind === 'require' ? 'require' : 'node', 'browser', 'types'];
        for (const mode of modes) {
          const target = resolve(imported.specifier, document.filePath, mode);
          if (target.path && !target.external) edge(document.id, fileId(target.path), 'module-import', provenance('typescript', document.path, 'static'), { specifier: imported.specifier, mode, importKind: imported.kind, source: { uri: document.uri, range: imported.range }, conditions: target.conditions || [] });
          if (target.gap) index.coverage.push({ documentId: document.id, path: document.path, provider: 'typescript', code: target.gap, detail: `${mode}: ${imported.specifier}` });
        }
      }
      for (const input of analysis.inputs) {
        const targets = input.directory ? files.filter(file => file.path.startsWith(input.target + '/')).map(file => file.path) : [input.target];
        for (const target of targets) edge(document.id, fileId(path.join(rootDir, target)), 'file-input', provenance('typescript-static-file-access', document.path, 'static'), { source: { uri: document.uri, range: input.range }, access: input.provenance });
      }
      // Registrations are only accepted from the canonical runner, never from
      // similar-looking arrays in application code or fixture examples.
      if (!suiteCatalog && document.path === 'scripts/run_xtend_tests.js') for (const suite of analysis.suites) {
        const record = { id: `suite:${pathToFileURL(rootDir).href}:${suite.id}`, suiteId: suite.id, runnerPath: document.path, defaultIncluded: suite.defaultIncluded, implementations: [] };
        for (const implementation of suite.implementations) {
          const target = resolve(implementation.specifier, document.filePath, 'require');
          if (!target.path) continue;
          const implementationId = `${fileId(target.path)}#${implementation.imported}`;
          record.implementations.push({ id: implementationId, path: posix(path.relative(rootDir, target.path)), function: implementation.imported, arguments: implementation.arguments });
          edge(record.id, fileId(target.path), 'suite-implementation', provenance('runner-ast', document.path, 'static'), { function: implementation.imported, arguments: implementation.arguments });
        }
        index.suites.push(record);
      }
    }
    const owners = new Map();
    for (const suite of index.suites) for (const implementation of suite.implementations) {
      if (!owners.has(implementation.path)) owners.set(implementation.path, []);
      owners.get(implementation.path).push(suite);
    }
    for (const [module, suites] of owners) if (suites.length > 1) index.coverage.push({ path: module, provider: 'runner-ast', code: 'shared-suite-module', detail: `File-level dependencies conservatively reach ${suites.map(suite => suite.suiteId).join(', ')}; no function-level input claim.` });
    // Existing curated package metadata ties workpackages to their suite and
    // source paths. Read those declarations without introducing a gate list.
    function metadata(value, manifestPath) {
      if (!value || typeof value !== 'object') return;
      const suitePaths = Object.entries(value).filter(([key, item]) => /suite(?:Path)?$/i.test(key) && typeof item === 'string').map(([, item]) => item);
      for (const suitePath of suitePaths) for (const suite of owners.get(suitePath) || []) {
        for (const item of Object.values(value)) if (typeof item === 'string' && files.some(file => file.path === item) && item !== suitePath) edge(suite.id, fileId(path.join(rootDir, item)), 'test-metadata', provenance('package-metadata', manifestPath));
      }
      Object.values(value).forEach(item => { if (item && typeof item === 'object') metadata(item, manifestPath); });
    }
    packages.forEach(pkg => metadata(pkg.manifest.xtend, pkg.manifestPath));

    const inventoryPath = 'tests/schemas/xtend-schema-inventory.json';
    const absoluteInventory = path.join(rootDir, inventoryPath);
    if (fs.existsSync(absoluteInventory)) {
      try {
        const text = fs.readFileSync(absoluteInventory, 'utf8'), digest = fingerprint(text);
        let inventory = index.metadata.get(absoluteInventory);
        if (!inventory || inventory.fingerprint !== digest) {
          const source = JSON.parse(text);
          inventory = { fingerprint: digest, entries: source.entries.map(entry => ({
            schemaId: entry.schemaId, canonicalDefinition: entry.canonicalDefinition,
            lifecycle: entry.lifecycle, aliasOf: entry.aliasOf, replacedBy: entry.replacedBy,
            usages: entry.usages.map(usage => ({ role: usage.role, sourcePaths: usage.sourcePaths }))
          })) };
          index.metadata.set(absoluteInventory, inventory);
        }
        for (const entry of inventory.entries) {
          const id = `contract:${pathToFileURL(rootDir).href}:${entry.schemaId}`;
          index.contracts.push({ id, schemaId: entry.schemaId, canonicalDefinition: entry.canonicalDefinition, lifecycle: entry.lifecycle, aliasOf: entry.aliasOf, replacedBy: entry.replacedBy, inventoryPath, inventoryFingerprint: digest });
          if (entry.canonicalDefinition?.path) edge(id, fileId(path.join(rootDir, entry.canonicalDefinition.path)), 'contract-definition', provenance('schema-inventory', inventoryPath));
          for (const usage of entry.usages) for (const file of usage.sourcePaths || []) edge(fileId(path.join(rootDir, file)), id, 'contract-use', provenance('schema-inventory', inventoryPath), { role: usage.role });
        }
      } catch (error) { index.coverage.push({ path: inventoryPath, provider: 'schema-inventory', code: 'inventory-unavailable', detail: error.message }); }
    } else index.coverage.push({ path: inventoryPath, provider: 'schema-inventory', code: 'inventory-absent', detail: 'No curated schema inventory in this project.' });
    // Kernel build artifacts explicitly publish their canonical sources. Other
    // build formats remain visible gaps until their manifest adapter exists.
    for (const file of files.filter(file => /manifest\.json$/.test(file.path))) {
      let manifest; try { manifest = JSON.parse(file.text); } catch { continue; }
      if (Array.isArray(manifest.canonicalSources)) {
        const targets = [file.path, ...(manifest.sourceArtifacts || []).map(artifact => artifact.path).filter(target => typeof target === 'string' && inside(rootDir, path.resolve(rootDir, target)))];
        for (const target of targets) for (const source of manifest.canonicalSources) if (typeof source === 'string' && inside(rootDir, path.resolve(rootDir, source))) edge(fileId(path.join(rootDir, target)), fileId(path.join(rootDir, source)), 'generated-from', provenance('artifact-manifest', file.path));
      }
      if (manifest.sourceManifest?.path) edge(file.id, fileId(path.join(rootDir, manifest.sourceManifest.path)), 'generated-from', provenance('artifact-manifest', file.path));
    }
    for (const file of files.filter(file => /\.json$/.test(file.path))) {
      let configuration; try { configuration = JSON.parse(file.text); } catch { continue; }
      if (configuration.schema === 'xtend.maraca.build-config.v1') {
        const project = path.dirname(path.resolve(rootDir, file.path));
        const options = configuration.options || {};
        const output = path.resolve(project, options.out || 'dist/maraca', 'xtend.maraca.mjs');
        for (const [role, input] of Object.entries({source:options.source, 'browser-service':options.services?.clientEntry, 'php-service':options.services?.phpEntry})) {
          if (typeof input !== 'string') continue;
          const source = path.resolve(project, input);
          if (!inside(project, source) || !inside(project, output)) { index.coverage.push({path:file.path,provider:'maraca-manifest',code:'maraca-boundary-violation',detail:role}); continue; }
          edge(file.id, fileId(source), 'file-input', provenance('maraca-manifest', file.path), {role});
          edge(fileId(output), fileId(source), 'generated-from', provenance('maraca-manifest', file.path), {role});
        }
        if (inside(project, output)) edge(fileId(output), file.id, 'generated-from', provenance('maraca-manifest', file.path));
      }
      if (!/(?:^|\/)xtend\.pages\.json$/.test(file.path) && configuration.schema !== 'xtend.page-build.v1') continue;
      const project = packages.find(pkg => file.projectId === `project:${pathToFileURL(pkg.directory).href}`)?.directory || rootDir;
      const target = configuration.target || 'both';
      const output = path.resolve(project, configuration.output || (configuration.host === 'laravel' ? 'bootstrap/xtend/pages.json' : '.xtend-build/pages.json'));
      for (const [name, page] of [...Object.entries(configuration.pages || {}), ...Object.entries(configuration.layouts || {}).map(([name, layout]) => [`layout:${name}`, layout])]) {
        if (typeof page.source !== 'string') { index.coverage.push({path:file.path,provider:'page-manifest',code:'invalid-page-source',detail:name}); continue; }
        const source = path.resolve(project, page.source);
        if (!inside(project, source) || !inside(project, output)) { index.coverage.push({path:file.path,provider:'page-manifest',code:'page-boundary-violation',detail:name}); continue; }
        const fields = {specifier:name,mode:target,role:configuration.host || 'host-independent'};
        edge(file.id, fileId(source), 'file-input', provenance('page-manifest', file.path), fields);
        edge(fileId(output), fileId(source), 'generated-from', provenance('page-manifest', file.path), fields);
        edge(fileId(output), file.id, 'generated-from', provenance('page-manifest', file.path), fields);
        if (typeof page.maraca?.entry === 'string') {
          // Same-origin public URL paths map to the host's public asset directory.
          const entry = page.maraca.entry;
          if (entry.startsWith('/') && !entry.startsWith('//') && !entry.includes('?') && !entry.includes('#')) {
            const artifact = path.resolve(project, 'public', '.' + entry);
            if (inside(path.join(project, 'public'), artifact)) edge(fileId(output), fileId(artifact), 'generated-from', provenance('page-manifest', file.path), {...fields,role:'maraca-orchestration'});
          } else index.coverage.push({path:file.path,provider:'page-manifest',code:'maraca-entry-unmapped',detail:entry});
        }
        if (!fileAt(source)) index.coverage.push({path:file.path,provider:'page-manifest',code:'page-source-unavailable',detail:page.source});
      }
      if (configuration.vite) {
        const vite = path.resolve(project, configuration.vite.manifest || 'public/build/manifest.json');
        if (inside(project, vite)) {
          edge(file.id, fileId(vite), 'file-input', provenance('page-manifest', file.path), {role:'vite-assets'});
          edge(fileId(output), fileId(vite), 'generated-from', provenance('page-manifest', file.path), {role:'vite-assets'});
        }
      }
    }
    index.coverage.push({ path: '.', provider: 'repository', code: 'static-analysis-boundary', detail: 'Computed runtime access, unrecognized generators and JS/TS symbol references are not fully captured. This report never selects or skips gates.' });
  }
}
module.exports = { linkRepository };

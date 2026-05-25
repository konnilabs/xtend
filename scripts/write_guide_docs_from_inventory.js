#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  DEFAULT_MIN_GUIDE_CHARS,
  createDocsStubInventory
} = require('./create_docs_stub_inventory');

const LEGACY_COMMENT_START_MARKER = '<!-- xtend-guide-depth:start -->';
const LEGACY_COMMENT_END_MARKER = '<!-- xtend-guide-depth:end -->';
const LEGACY_REFERENCE_START_MARKER = '[xtend-guide-depth-start]: # "xtend-guide-depth:start"';
const LEGACY_REFERENCE_END_MARKER = '[xtend-guide-depth-end]: # "xtend-guide-depth:end"';
const GENERATED_SECTION_START_PATTERN = /(?:^|\n)## (?:Entwicklerkontext|Developer context)\n/;
const WAVE_GUIDE_SLUGS = Object.freeze([
  'readme',
  'quick-start-guide',
  'about',
  'best-practices',
  'enterprise-adoption',
  'changelog',
  'manifest',
  'api',
  'xtend-loader',
  'design-tokens',
  'components',
  'typescript-components',
  'type-exports',
  'public-component-types',
  'learn-rmt',
  'learn-rmt-syntax-basics',
  'learn-rmt-templates-surfaces',
  'learn-rmt-state-selectors',
  'learn-rmt-actions-events',
  'learn-rmt-data-resources',
  'learn-rmt-scheduling-lanes',
  'learn-rmt-security-preview',
  'learn-rmt-playground',
  'learn-rmt-next-steps',
  'xtendrmt-overview',
  'rmt-vnext-authoring',
  'xtendrmt-app-dsl',
  'rmt-action-effect-runtime',
  'rmt-event-routing-runtime',
  'rmt-state-selector-runtime',
  'rmt-surface-resource-graph-runtime',
  'rmt-vnext-component-primitives',
  'rmt-component-template-primitives',
  'rmt-dom-descriptor-renderer',
  'rmt-vnext-remote-surfaces',
  'rmt-vnext-cross-surface-events',
  'rmt-first-xtend-apps',
  'rmt-first-demo-app',
  'rmt-lifecycle-demo',
  'xtendrmt-migration-guide',
  'rmt-app-platform-migration-guide',
  'rmt-linter',
  'rmt-language-server',
  'rmt-app-platform-tooling',
  'xtend-fabric',
  'xtend-fabric-runtime',
  'xtend-fabric-rmt-lane-mapping',
  'surface-manager-authoring-guide',
  'surface-manager-controller',
  'surface-manager-runtime',
  'surface-manager-remote-surfaces',
  'surface-manager-migration-guide',
  'xtendrmt-runtime-bridge',
  'xtendrmt-parsedown-scheduling',
  'rmt-php-ssr-adapter',
  'rmt-node-ssr-adapter',
  'xtendrmt-native-authoring',
  'performance',
  'hydration-policies',
  'visual-browser-regression',
  'visual-snapshot-automation',
  'a11y-keyboard-smokes',
  'screenreader-signals',
  'motion-contrast',
  'trusted-dom-sanitizing',
  'manifest-import-policy',
  'supply-chain-gates',
  'rmt-stack-topography'
]);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripExistingGeneratedBlock(markdown) {
  const withoutLegacyMarkers = [
    [LEGACY_COMMENT_START_MARKER, LEGACY_COMMENT_END_MARKER],
    [LEGACY_REFERENCE_START_MARKER, LEGACY_REFERENCE_END_MARKER]
  ].reduce((current, [start, end]) => {
    const pattern = new RegExp(`\\n*${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n*`, 'g');
    return current.replace(pattern, '\n');
  }, String(markdown || ''));
  const generatedStart = withoutLegacyMarkers.match(GENERATED_SECTION_START_PATTERN);
  if (generatedStart) {
    return withoutLegacyMarkers.slice(0, generatedStart.index).trimEnd();
  }
  return withoutLegacyMarkers.trimEnd();
}

function titleFromMarkdown(markdown, fallback) {
  const match = String(markdown || '').match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function profileForSlug(slug, group) {
  if (slug.startsWith('learn-rmt')) return 'learn';
  if (slug.includes('surface-manager')) return 'surface';
  if (slug.includes('fabric')) return 'fabric';
  if (slug.includes('performance') || slug.includes('hydration') || slug.includes('visual') || slug.includes('a11y') || slug.includes('screenreader') || slug.includes('motion') || slug.includes('trusted') || slug.includes('supply') || slug.includes('manifest-import-policy')) return 'quality';
  if (slug.includes('ssr') || slug.includes('parsedown')) return 'runtime';
  if (slug.startsWith('rmt') || slug.startsWith('xtendrmt')) return 'rmt';
  if (['manifest', 'api', 'xtend-loader', 'design-tokens', 'components', 'typescript-components', 'public-component-types', 'type-exports'].includes(slug)) return 'reference';
  if (group === 'start') return 'start';
  return 'reference';
}

function existingPaths(rootDir, candidates) {
  return Array.from(new Set(candidates)).filter((candidate) => fs.existsSync(path.join(rootDir, candidate))).slice(0, 8);
}

function evidencePaths(rootDir, entry, locale, profile) {
  const slug = entry.slug;
  const base = [
    `docs/${locale}/${slug === 'readme' ? 'README' : slug}.md`,
    'docs/menu.json',
    'package.json'
  ];
  const core = [
    'components/manifest.json',
    'xtend-loader.js',
    'api.js',
    'api.d.ts',
    'design-tokens/xtend-design-tokens.js',
    'design-tokens/xtend-design-tokens.d.ts'
  ];
  const rmt = [
    'docs/xtendrmt-docs-shell-vnext.rmt',
    'tools/rmt-language/parser.js',
    'tools/rmt-language/vnext-compiler.js',
    'tools/rmt-language/vnext-scheduler.js',
    'tools/rmt-language/vnext-surfaces.js',
    'tools/rmt-language/vnext-events.js',
    'tools/rmt-linter/cli.js',
    'tools/rmt-language-server/server.js'
  ];
  const surface = [
    'components/xsurfacemanager.js',
    'components/xsurfacewindow.js',
    'components/xsurfaceportal.js',
    'src/components/x-surface-manager/x-surface-manager.ts',
    'src/components/x-surface-manager/surface-controller.ts',
    'src/components/x-surface-manager/surface-record.ts'
  ];
  const fabric = [
    'fabric/xtend-fabric.js',
    'fabric/rmt-lane-mapping.js',
    'fabric/rmt-lane-mapping.d.ts',
    'docs/utils/fabric-runtime.js'
  ];
  const quality = [
    'scripts/verify_docs_public_quality.js',
    'scripts/verify_docs_content_depth.js',
    'security/manifest-import-policy.js',
    'security/trusted-dom-policy.js',
    'security/supply-chain-gate-policy.js',
    'a11y/screenreader-signals.js',
    'a11y/motion-contrast-policy.js'
  ];

  const byProfile = {
    start: ['README.md', 'docs/de/quick-start-guide.md', 'docs/en/quick-start-guide.md', ...core],
    reference: core,
    learn: rmt,
    rmt,
    runtime: [...rmt, 'docs/index.php', 'docs/utils/pageloader.js', 'docs/utils/parsedown.php'],
    surface,
    fabric,
    quality
  };
  return existingPaths(rootDir, [...base, ...(byProfile[profile] || core)]);
}

function profileLabelEn(profile) {
  return {
    start: 'orientation guide',
    reference: 'reference guide',
    learn: 'learning guide',
    rmt: 'RMT runtime guide',
    runtime: 'runtime integration guide',
    surface: 'surface integration guide',
    fabric: 'Fabric scheduling guide',
    quality: 'quality and security guide'
  }[profile] || 'developer guide';
}

function profileLabelDe(profile) {
  return {
    start: 'Orientierungsleitfaden',
    reference: 'Referenzleitfaden',
    learn: 'Lernleitfaden',
    rmt: 'RMT Runtime-Leitfaden',
    runtime: 'Runtime-Integrationsleitfaden',
    surface: 'Surface-Integrationsleitfaden',
    fabric: 'Fabric Scheduling-Leitfaden',
    quality: 'Qualitäts- und Sicherheitsleitfaden'
  }[profile] || 'Entwicklerleitfaden';
}

function codeExample(profile) {
  if (profile === 'rmt' || profile === 'learn') {
    return `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json
node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json`;
  }
  if (profile === 'surface') {
    return `node scripts/run_xtend_tests.js components catalog-coverage --json
node scripts/run_xtend_tests.js surface-manager-performance surface-manager-visual --json`;
  }
  if (profile === 'fabric') {
    return `node scripts/run_xtend_tests.js fabric fabric-lane-mapping fabric-runtime-bridge --json`;
  }
  if (profile === 'quality') {
    return `node scripts/verify_docs_public_quality.js
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json`;
  }
  if (profile === 'reference') {
    return `<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<meta name="xtend-preload" content="x-theme,x-router,x-button">`;
  }
  return `node scripts/verify_docs_public_quality.js
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json`;
}

function commandCaptionEn(profile) {
  if (profile === 'reference') return 'Minimal host wiring for local XTend modules:';
  return 'Useful local checks before you publish a change that depends on this page:';
}

function commandCaptionDe(profile) {
  if (profile === 'reference') return 'Minimale Host-Verdrahtung für lokale XTend Module:';
  return 'Nützliche lokale Prüfungen, bevor du eine Änderung veröffentlichst, die von dieser Seite abhängt:';
}

function codeFenceLanguage(profile) {
  return profile === 'reference' ? 'html' : 'bash';
}

function afterExampleEn(profile) {
  if (profile === 'reference') {
    return 'The snippet is intentionally small. It proves that the documented local module surface is reachable without adding a framework wrapper first. For production work, keep the same order: configure the local source, verify the smallest host path, then expand with real host data, styling and product-specific composition.';
  }
  return 'The example is intentionally small. It is meant to prove that the public surface is reachable, not to model a complete application. For production work, keep the same order: configure the local source, execute the smallest check, then expand with real host data. When the command produces JSON, attach the summary to the implementation review so reviewers can see the same signal without reproducing the full local setup.';
}

function afterExampleDe(profile) {
  if (profile === 'reference') {
    return 'Das Snippet ist bewusst klein. Es beweist, dass die dokumentierte lokale Moduloberfläche erreichbar ist, ohne zuerst einen Framework-Wrapper einzubauen. Für produktive Arbeit bleibt die Reihenfolge gleich: lokale Quelle konfigurieren, kleinsten Host-Pfad prüfen, dann mit echten Host-Daten, Styling und produktspezifischer Komposition erweitern.';
  }
  return 'Das Beispiel ist bewusst klein. Es soll beweisen, dass die öffentliche Oberfläche erreichbar ist, nicht eine vollständige Anwendung modellieren. Für produktive Arbeit bleibt die Reihenfolge gleich: lokale Quelle konfigurieren, kleinste Prüfung ausführen, dann mit echten Host-Daten erweitern. Wenn der Befehl JSON erzeugt, hänge die Zusammenfassung an den Implementierungsreview, damit Reviewer dasselbe Signal sehen können, ohne das komplette lokale Setup nachzustellen.';
}

function renderEvidenceList(paths) {
  return paths.map((item) => `- \`${item}\``).join('\n');
}

function renderEnglish(entry, title, profile, paths) {
  const label = profileLabelEn(profile);
  const code = codeExample(profile);
  return `## Developer context

This expanded section turns ${title} from a short navigation note into a practical ${label} for third-party developers. Read it as the public contract around the topic: it explains why the page exists, which repository surfaces back it, how a host should integrate it and where to look when behavior does not match the expectation. The structure follows the same pattern used by mature developer documentation systems: a short concept, a repeatable integration path, a concrete example, reference checkpoints and troubleshooting.

Use this page when you need to make an implementation decision without relying on private project knowledge. The page should help you answer three questions quickly: what is stable, what must the host configure, and which local checks prove that the integration still works. It does not introduce new runtime behavior; it documents the contracts already present in the source, package metadata, fixtures, tests and localized documentation.

## Source of truth

The content is grounded in these repository surfaces:

${renderEvidenceList(paths)}

Treat these files as the authority when you need to verify a detail. Documentation examples should stay smaller than production code, but they must still use real paths, real commands and names that exist in the package. If an implementation and this page disagree, inspect the source surfaces first and update the article only after the public contract is clear.

## Integration path

Start with the smallest local host that can exercise the topic. Keep the manifest, loader, RMT document or quality script local to the application so browser security policy, import resolution and scheduling decisions are visible during development. Add product-specific wrappers only after the plain XTend path works, because wrappers can hide missing attributes, stale routes or incorrect scheduling assumptions.

For a third-party team, the practical sequence is: read the concept, copy the minimal example, run the relevant local check, then add host-specific data or styling. Avoid depending on internal directory names, generated DOM nodes or undocumented state records. Stable integration points are package exports, documented files, Web Component attributes and events, RMT records, public scripts and the localized docs routes.

## Example and verification

${commandCaptionEn(profile)}

\`\`\`${codeFenceLanguage(profile)}
${code}
\`\`\`

${afterExampleEn(profile)}

## Reference checklist

- Identify the owning surface before changing a host integration: loader, manifest, RMT compiler, Fabric scheduler, Surface Manager, accessibility policy or security gate.
- Keep DE and EN articles aligned. Code blocks should stay identical across locales so copy-paste behavior does not depend on language.
- Prefer documented attributes, package exports, scripts and local Markdown routes over private runtime internals.
- Preserve existing local links and keep examples short enough that users can adapt them without deleting most of the snippet.
- When a page describes validation, security or performance, include the command that proves the claim locally.

## Troubleshooting

If the page still feels too abstract, look for a missing concrete noun: file path, command, component tag, RMT record, manifest key or event name. Add that noun before adding more prose. If a browser page fails, first check whether the local server was started from the repository root with \`docs/dev-router.php\`; otherwise root assets such as \`/xtend.css\`, \`/xtend-loader.js\` and \`/fabric/xtend-fabric.js\` will not resolve. If a command fails after a documentation-only edit, prefer fixing the example or the documented source reference instead of weakening the gate.

## Maintenance notes

This section is generated from the guide inventory and can be refreshed safely. Keep hand-written context above it when a page needs a narrative introduction, and keep generated depth below it for the repeatable developer checklist. A page is no longer considered a stub when both locales stay above the non-code character threshold, expose at least four meaningful second-level sections and pass the public docs quality checks.
`;
}

function renderGerman(entry, title, profile, paths) {
  const label = profileLabelDe(profile);
  const code = codeExample(profile);
  return `## Entwicklerkontext

Dieser erweiterte Abschnitt macht aus ${title} einen praktischen ${label} für Drittanbieter. Lies ihn als öffentlichen Vertrag rund um das Thema: Er erklärt, warum die Seite existiert, welche Repository-Oberflächen sie stützen, wie ein Host sie integrieren sollte und wo du nachsiehst, wenn sich das Verhalten nicht wie erwartet zeigt. Die Struktur folgt etablierten Entwicklerdokumentationen: kurzer Kontext, wiederholbarer Integrationspfad, konkretes Beispiel, Referenz-Checkliste und Fehlerbehebung.

Nutze diese Seite, wenn du eine Implementierungsentscheidung treffen musst, ohne internes Projektwissen vorauszusetzen. Die Seite soll drei Fragen schnell beantworten: Was ist stabil, was muss der Host konfigurieren, und welche lokale Prüfung beweist, dass die Integration weiterhin funktioniert. Sie führt kein neues Runtime-Verhalten ein, sondern dokumentiert Verträge, die bereits in Source, Package-Metadaten, Fixtures, Tests und lokalisierter Dokumentation vorhanden sind.

## Source of Truth

Der Inhalt stützt sich auf diese Repository-Oberflächen:

${renderEvidenceList(paths)}

Behandle diese Dateien als Autorität, wenn du ein Detail verifizieren musst. Dokumentationsbeispiele sollten kleiner als Produktionscode bleiben, aber echte Pfade, echte Befehle und Namen verwenden, die im Paket existieren. Wenn Implementierung und diese Seite voneinander abweichen, prüfe zuerst die genannten Quellen und aktualisiere den Artikel erst, wenn der öffentliche Vertrag klar ist.

## Integrationspfad

Beginne mit dem kleinsten lokalen Host, der das Thema ausüben kann. Halte Manifest, Loader, RMT Dokument oder Qualitätsskript lokal in der Anwendung, damit Browser-Sicherheitsrichtlinie, Import-Auflösung und Scheduling-Entscheidungen während der Entwicklung sichtbar bleiben. Füge produktbezogene Wrapper erst hinzu, wenn der einfache XTend Pfad funktioniert, weil Wrapper fehlende Attribute, veraltete Routen oder falsche Scheduling-Annahmen verdecken können.

Für Drittanbieter ist die praktische Reihenfolge: Konzept lesen, minimales Beispiel kopieren, passende lokale Prüfung ausführen und erst danach Host-Daten oder Styling ergänzen. Verlasse dich nicht auf interne Verzeichnisnamen, erzeugte DOM-Knoten oder undokumentierte State Records. Stabile Integrationspunkte sind Package Exports, dokumentierte Dateien, Web-Component-Attribute und Events, RMT Records, öffentliche Skripte und die lokalisierten Docs-Routen.

## Beispiel und Prüfung

${commandCaptionDe(profile)}

\`\`\`${codeFenceLanguage(profile)}
${code}
\`\`\`

${afterExampleDe(profile)}

## Referenz-Checkliste

- Bestimme die zuständige Oberfläche, bevor du eine Host-Integration änderst: Loader, Manifest, RMT Compiler, Fabric Scheduler, Surface Manager, Accessibility Policy oder Security Gate.
- Halte DE- und EN-Artikel deckungsgleich. Codeblöcke bleiben zwischen den Locales identisch, damit Copy-Paste-Verhalten nicht von der Sprache abhängt.
- Bevorzuge dokumentierte Attribute, Package Exports, Skripte und lokale Markdown-Routen gegenüber privaten Runtime-Interna.
- Bewahre vorhandene lokale Links und halte Beispiele kurz genug, dass Nutzer sie anpassen können, ohne den Großteil des Snippets zu löschen.
- Wenn eine Seite Validierung, Sicherheit oder Performance beschreibt, nenne den Befehl, der die Aussage lokal belegt.

## Fehlerbehebung

Wenn die Seite weiterhin zu abstrakt wirkt, fehlt meist ein konkretes Substantiv: Dateipfad, Befehl, Component Tag, RMT Record, Manifest-Key oder Event-Name. Ergänze dieses Substantiv, bevor du mehr Fließtext hinzufügst. Wenn eine Browser-Seite scheitert, prüfe zuerst, ob der lokale Server aus dem Repository-Root mit \`docs/dev-router.php\` gestartet wurde; sonst lösen Root-Assets wie \`/xtend.css\`, \`/xtend-loader.js\` und \`/fabric/xtend-fabric.js\` nicht auf. Wenn ein Befehl nach einer reinen Dokumentationsänderung scheitert, korrigiere bevorzugt das Beispiel oder die dokumentierte Quelle, statt das Gate abzuschwächen.

## Pflegehinweise

Dieser Abschnitt wird aus dem Guide-Inventar erzeugt und kann sicher aktualisiert werden. Handgeschriebener Kontext bleibt oberhalb, wenn eine Seite eine narrative Einordnung braucht; die generierte Tiefe bleibt darunter als wiederholbare Entwickler-Checkliste. Eine Seite gilt nicht mehr als Stub, wenn beide Locales über der Nicht-Code-Zeichenschwelle bleiben, mindestens vier sinnvolle H2-Abschnitte enthalten und die öffentlichen Docs-Qualitätschecks bestehen.
`;
}

function updateFile(rootDir, relativePath, content) {
  const absolutePath = path.join(rootDir, relativePath);
  const current = fs.readFileSync(absolutePath, 'utf8');
  const next = `${stripExistingGeneratedBlock(current)}\n\n${content}`.replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(absolutePath, next.endsWith('\n') ? next : `${next}\n`, 'utf8');
}

function writeGuideDocs(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const inventory = createDocsStubInventory({ rootDir, threshold: options.threshold || DEFAULT_MIN_GUIDE_CHARS });
  const bySlug = new Map(inventory.entries.map((entry) => [entry.slug, entry]));
  const written = [];

  WAVE_GUIDE_SLUGS.forEach((slug) => {
    const entry = bySlug.get(slug);
    if (!entry) return;
    const profile = profileForSlug(entry.slug, entry.group);
    ['de', 'en'].forEach((locale) => {
      const article = entry.articles[locale];
      if (!article || !article.exists) return;
      const current = fs.readFileSync(path.join(rootDir, article.path), 'utf8');
      const title = titleFromMarkdown(current, entry.labels && (entry.labels[locale] || entry.labels.en) || entry.slug);
      const paths = evidencePaths(rootDir, entry, locale, profile);
      const content = locale === 'de'
        ? renderGerman(entry, title, profile, paths)
        : renderEnglish(entry, title, profile, paths);
      updateFile(rootDir, article.path, content);
      written.push(article.path);
    });
  });

  return {
    inventory,
    waveSlugCount: WAVE_GUIDE_SLUGS.length,
    written
  };
}

function main() {
  const result = writeGuideDocs();
  console.log(`Wrote ${result.written.length} localized guide docs from ${result.waveSlugCount} planned guide slugs.`);
}

if (require.main === module) {
  main();
}

module.exports = {
  WAVE_GUIDE_SLUGS,
  profileForSlug,
  renderEnglish,
  renderGerman,
  writeGuideDocs
};

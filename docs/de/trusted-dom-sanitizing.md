# Trusted DOM und Sanitizing

Sichere DOM-Grenzen für Markdown, Descriptoren und Host-Inhalte.

## Worum es geht

Trusted DOM trennt Plain Text, validierte Attribute, strukturierte Node-Descriptoren und HTML-Fragmente. `textContent` und Node-basiertes `replaceChildren` sind bevorzugt; `innerHTML` und `insertAdjacentHTML` benötigen eine explizite Sanitizing Boundary.

## Öffentliche Bausteine

- `security/trusted-dom-policy.js` klassifiziert Markup und DOM-Sinks.
- `security/trusted-dom-policy.d.ts` beschreibt Verdict und Sanitizer-API.
- `security/xss-pentest-policy.js` enthält negative URL-, Event- und Markup-Fälle.

## Empfohlener Ablauf

Behandle Markdown- oder Parsedown-HTML auch im eigenen Repository als untrusted, bis `sanitizeTrustedDomHtml()` und die Boundary ein positives Verdict liefern. Inline Handler, `javascript:`-URLs, `eval` und `new Function` bleiben verboten. Ein Sanitizer entfernt gefährliche Inhalte; er macht eine beliebige Script-Quelle nicht zu einem erlaubten Modul. Der [Browser Proof](./trusted-dom-boundary-browser-proof.md) prüft diese Grenze in einer echten DOM-Umgebung.

## Nächste Schritte

- [Manifest Import Policy](./manifest-import-policy.md)
- [Supply Chain Checks](./supply-chain-gates.md)
- [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md)

## RMT-Ausgabe migrieren

Die Trust Boundary gilt auch für `slot.html`, `prerender.html`, `fallback.html` und Ausgaben aus `remote-surface` oder `adapter-output`. Ein `html_fragment` benötigt den deklarierten Boundary-Vertrag und `sanitize html`; ein eigener Endpoint oder ein Prewarm-Cache schafft kein implizites Vertrauen.

| Ausgabe | Sichere Integration |
| --- | --- |
| Text | `textContent` oder Text-Descriptor; keine HTML-Interpretation. |
| HTML | Renderer-Trust-Pfad `commitTrustedHtml` mit geprüftem `RmtKernelRuntimeTrustVerdict` und `commitAllowed`. |
| Attribute | Validierter Binding-Pfad `commitTrustedAttribute`; `data-*` und `aria-*` tragen Daten und Semantik. |
| Properties | Validierter Binding-Pfad `commitTrustedProperty`; keine beliebigen Objekt- oder DOM-Zugriffe. |
| Fallback | `safeFallbackHtml` durchläuft dieselbe HTML-Prüfung; der Name allein autorisiert keinen Commit. |

`commitTrustedAttribute` und `commitTrustedProperty` bezeichnen die internen Binding-Guards des Renderers, keine frei aufrufbaren Methoden der Maraca-Fassade. Inline-Handler wie `onclick`, ungeprüftes `style`, `srcdoc` und `javascript:`-URLs gehören in die negativen Migrationsfälle. Behebe den Quellvertrag; entferne keine Guard-Prüfung, um einen geblockten Commit zu erzwingen.

Bei der SemVer-Bewertung ist das neue Blockieren zuvor erlaubter Legacy-Ausgaben `major`; kompatible Warnungen oder opt-in Diagnosen sind `minor`; reine Dokumentations- oder Metadatenkorrekturen sind `patch`. XTend 0.8.0 folgt der angekündigten Breaking-Pre-1.0-Migration.

```bash
node scripts/run_xtend_tests.js rmt-kernel-security-regression --json
```

Die [DEV API](./xtend-dev-api.md) beschreibt die redigierten Panic-/Recovery-Daten zur Auswertung eines geblockten Outputs. Eine Präsentations-[Abort Boundary](./maraca-fastpass-abort-boundary.md) prüft zusätzlich die zeitliche Gültigkeit; sie ersetzt keine Trust Boundary.

## Prüfung von App-Quellen im Maraca-Build

`buildMaracaBundle()` und `buildMaracaBundleAsync()` akzeptieren optional `htmlSecurity: { sources: [...] }` im Build-Input oder in den Run-Optionen. Die Liste muss sämtliche eigenen Browserquellen einschließlich importierter Controller und eigener Komponenten umfassen. Maraca prüft sie vor dem Schreiben der Bundle-Artefakte. `plan.htmlSecurity` enthält nur Dateipfade, SHA-256 und Diagnosen. Dateien und Symlink-Ziele müssen innerhalb des App-Roots liegen. Fehlende Dateien, eine leere Liste, ungültige Syntax oder ein fehlendes lokales TypeScript-Build-Tool brechen die Prüfung ab.

```js
await buildMaracaBundleAsync(buildInput, {
  rootDir,
  htmlSecurity: { sources: ['src/services.ts', 'src/controller.mjs'] }
});
```

`createDownstreamNoManualHtmlGate({ syntax: true, rootDir })` erkennt Schreibzugriffe auf `innerHTML`, `outerHTML` und `srcdoc`, auch mit zusammengesetzten Zuweisungen, konstant berechneten Namen und einfachen lokalen Methoden-Aliasen. HTML-Einfügemethoden sowie `document.write/writeln` werden ebenfalls erfasst. Kommentare, Dokumentationsstrings und reine Lesezugriffe gelten nicht als Schreibzugriff. Der bestehende Regex-Modus bleibt kompatibel. Der Syntaxmodus erlaubt keine implizite Legacy-Dateiausnahme.

Der Gate prüft die angegebenen Quellen; er beweist nicht die Sicherheit beliebigen JavaScripts. Dynamische Property-Namen, Datenfluss über Modulgrenzen und nicht gelistete Abhängigkeiten benötigen eigene Prüfung. CSP, Trusted Types, Sanitizer und Laufzeit-Ownership bleiben erforderlich. Der Gate bereinigt oder verändert keinen Code.

## Explizite HTML-Ausnahme ohne Bypass

XTend besitzt bereits den Descriptor `trusted_html` mit `trustedBoundary: 'xtend.rmt.trusted-dom-boundary.explicit'`, `policyRef` und einem verpflichtenden Host-`trustedDomRenderer`. Dies ist der nachvollziehbare Ausnahmeweg. Ein Policy-Name allein erlaubt noch keinen Inhalt: Der Host muss den vorgesehenen Sanitizer anwenden und unter entsprechender CSP TrustedHTML erhalten. `sanitizeTrustedDomHtml()` bleibt die Sanitizer-API.

Ein ungeprüfter Wrapper nach Art von `bypassSecurityTrustHtml` oder `dangerouslySetInnerHTML` wird nicht ergänzt. Das Verpacken eines Strings begründet kein Vertrauen und verhindert keinen verspäteten asynchronen Commit. HTML-Vertrauensprüfung und Presentation-Abort-/Generationsgrenzen bleiben getrennte Verträge. Normale UI, Icons und Steuerelemente verwenden Text oder strukturierte RMT-Descriptoren.

# ERP Resumability Catfood

Dieses getrackte Produkt ist das verpflichtende End-to-End-Catfood für `server_prerender_resume` in RMT. Die HTML-Shell und das signierte `xtend.rmt.ssr-resume-envelope.v1` stammen aus dem Node-SSR-Adapter; der Browser übernimmt vorhandene Nodes über `resumeResponse()` und verwendet `server_prerender_hydrate` ausschließlich als einmaligen, expliziten Fehlerpfad.

Die Matrix umfasst React und Vue jeweils doppelt, Angular 19.2 mit `@angular/platform-server`/`provideClientHydration` sowie Three, OpenUI5 und Vanilla/iWebKit per `host_activate`.

```sh
npm ci --ignore-scripts
npm run catfood
```

Der zentrale Repository-Gate ist:

```sh
npm run test:erp-resumability-catfood:report
```

Policies, Evidence und Upstream-Learnings liegen in `catfooding.json`, `catfooding-evidence.json` und `catfooding-lessons.json`.

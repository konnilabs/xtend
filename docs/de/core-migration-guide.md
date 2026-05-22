# XTend Core Migration Guide

## Uebersicht

Dieser Guide fasst die produktiven Core-Standards aus Epic 01 zusammen. Er dient als Migrationshilfe fuer Legacy-Call-Sites und als Referenz fuer neue XTend-Core-Aenderungen.

## Verifikation

Der aktuelle Core-Contract ist automatisiert pruefbar:

```bash
node scripts/verify_xtend_core_contracts.js
```

## Runtime-Standards

- `window.XTend.compliance` stellt Checklist, Contract-Uebersicht und Theme-Tokens bereit.
- zentrale Design-Tokens werden ueber `xtheme` pro Theme registriert und auf `document.documentElement` gespiegelt.
- Overlay- und Feedback-Komponenten respektieren `prefers-reduced-motion`, Fokus-Standards und kanonische XTend-State-Keys.

## RMT-Templating-Migration ab Epic 04

RMT-Templating ist additiv und opt-in. Bestehende XTend-Apps, klassische HTML-/JS-Integrationen und bestehende Web-Component-Nutzung bleiben gueltig. Eine App nutzt XTendRMT erst, wenn sie ein `.rmt` Dokument, einen RMT Root-Handshake, einen Template-Record oder einen Host Adapter bewusst registriert.

Die verbindliche Migrationsnotiz liegt in `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`.
Der aktuelle Produktueberblick liegt in `docs/xtendrmt-overview.md`. Das produktive native Authoring-Modell ab Epic 05 liegt in `docs/xtendrmt-native-authoring.md`; die App-DSL-Referenz liegt in `docs/xtendrmt-app-dsl.md`; Runtime Bridge und Adapter sind in `docs/xtendrmt-runtime-bridge.md` beschrieben. Die Migration von Metadatenpfaden zu Top-Level-Domains liegt in `docs/xtendrmt-migration-guide.md`.

| Ausgangslage | Migrationspfad |
|--------------|----------------|
| XTend-only App | unveraendert weiter betreiben; RMT nur fuer neue Roots oder Template-Piloten aktivieren |
| XTend mit XRouter | Route-Records vorbereiten, produktive Adapterausfuehrung in Epic 05 |
| XTend neben React/Vue | RMT als Scheduler oder Template-Transport nutzen, Host Adapter getrennt halten |
| Vanilla oder Custom Host | eigene Scheduler-Endpoints deklarieren, keine XTend-Capabilities voraussetzen |
| Legacy-Demo | klassifizieren und pruefen, nicht stillschweigend zum RMT-Produktcontract machen |

Review-Regeln fuer RMT-kompatible Aenderungen:

- keine XTend Runtime-Imports im RMT Kernel
- keine erzwungene Migration bestehender Apps
- keine neue XTend-Template-Sprache neben RMT
- `kernelVisible: false` fuer XTend-spezifische Adapterdaten
- produktive Bridge-Factories statt privater Demo-Brueckenlogik verwenden
- historische Scaffold-Artefakte mit `bridgeRuntime: reserved-for-Epic-05` bleiben als Epic-04-Handoff lesbar, sind aber nicht mehr der operative Bridge-Status
- `node scripts/run_xtend_tests.js rmt-compatibility --json` und `node scripts/run_xtend_tests.js references --json` als Mindestgates

## Native RMT Routes und Components ab Epic 05

Neue App-DSL-Dokumente sollen operative Routing-, Component- und Scheduling-Daten in nativen Top-Level-Domains fuehren:

- `manifest.metadata.routes -> routes`
- `manifest.metadata.components -> components`
- `manifest.metadata.schedules -> schedules`
- `xtend.xrouter` bleibt Router Adapter
- `xtend.component` bleibt Component Adapter
- `rmt.state-scheduler-diagnostics` bleibt Bridge Adapter

`manifest.metadata` bleibt fuer Beschreibung, Handoff und historische Demo-Notizen gueltig, soll aber keine neue operative Route-/Component-Bridge tragen. Template-only-Dokumente bleiben kompatibel.

Die produktive Ausfuehrung nutzt:

- `createRmtFormat().normalizeDocument(...)`
- `createRmtFormat().createRuntimeRegistries(...)`
- `createRmtXRouterAdapter(...)`
- `createRmtXtendComponentAdapter(...)`
- `createRmtStateSchedulerDiagnosticsBridge(...)`

Die Docs-App selbst bleibt Parsedown-basiert, rendert ihre App Shell aber inzwischen Shell-first aus RMT. Der Scheduling- und Shell-Pfad ist seit `ER-WP-40` in `docs/xtendrmt-parsedown-scheduling.md` und `docs/xtendrmt-parsedown-docs.rmt` als offizieller Pilot beschrieben.

## Legacy zu kanonisch

| Bereich | Legacy | Kanonisch | Status |
|--------|--------|-----------|--------|
| Dialog Open | `dialog-open-<id>` | `xtend.component.x-dialog.<id>.open` | Legacy bleibt kompatibel |
| Dialog Open | `xdialog-open-<id>` | `xtend.component.x-dialog.<id>.open` | Legacy bleibt kompatibel |
| Modal Open | `modal-open-<id>` | `xtend.component.x-modal.<id>.open` | Legacy bleibt kompatibel |
| Theme Current | `theme` | `xtend.theme.current` | beide werden gespiegelt |
| Theme List | `themes` | `xtend.theme.available` | beide werden gespiegelt |
| Router Last Navigation | `router-navigated` | `xtend.router.lastNavigated` | beide werden gespiegelt |
| Alert State | `xalert-state-<id>` | `xtend.component.x-alert.<id>` | Legacy bleibt kompatibel |

## Was neue Core-Aenderungen beachten muessen

- neue UI-Flows brauchen einen expliziten `xstate`-Zwilling
- Doku, API, Typdefinitionen und Runtime muessen denselben Contract verwenden
- neue Komponenten oder groessere Core-Aenderungen muessen gegen die Compliance-Checklist und den Verify-Script laufen

## Design-Tokens

Die zentralen Tokens kommen aus `xtheme` und koennen pro Theme angepasst werden:

- `--xtend-color-primary`
- `--xtend-color-primary-dark`
- `--xtend-color-accent`
- `--xtend-glass-bg`
- `--xtend-glass-blur`
- `--xtend-shadow`
- `--xtend-border`
- `--xtend-radius`
- `--xtend-font-family`
- `--xtend-focus-outline`
- `--xtend-surface`
- `--xtend-surface-muted`
- `--xtend-text`
- `--xtend-overlay-bg`

## Hinweise fuer bestehende Integrationen

- Bestehende Legacy-Open-Flags fuer Dialog und Modal muessen nicht sofort entfernt werden, sollten aber nicht mehr neu eingefuehrt werden.
- Neue API-nahe Integrationen sollen `window.XTend.*` statt unnamespaced Helpern bevorzugen.
- Fuer Core-Reviews ist die Checkliste in `development/XTend-Core-Compliance-Checklist.md` die operative Quelle.

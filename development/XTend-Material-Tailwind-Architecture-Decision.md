# XTend Material und Tailwind CSS Architecture Decision

- Status: `accepted-by-XTM-00`
- Datum: 2026-07-16
- Workpackage: `XTM-00`
- Decision Schema: `xtend.material.architecture-decision.v1`
- Product Identity: `XTend Material`
- NPM Scope: `@xtend-material`
- Initial Package: `@xtend-material/core`
- Maraca Adapter Target: `@xtend-material/maraca-tailwind`
- Owner: `CCS Labs (ccslabs)`
- Tailwind Baseline: `4.3.2`
- Local Gate: `node scripts/run_xtend_tests.js xtend-material-architecture --json`
- Backlog: `development/BACKLOG-XTend-Material-Tailwind-CSS-Fast-Path.md`
- Boundary: `no-tailwind-browser-runtime`
- Boundary: `no-tailwind-import-in-rmt-kernel`
- Boundary: `no-second-design-token-source-of-truth`
- Boundary: `no-second-component-registry`
- Boundary: `tailwind-is-build-time-only`

## Entscheidung

XTend fuehrt `XTend Material` als eigenes, von CCS Labs gepflegtes Design Kit fuer alltaegliche App-Oberflaechen ein. Das Kit richtet sich insbesondere an interne Dashboards, administrative Workspaces, Form-Flows und kurzfristig benoetigte UI-Produkte, die eine neutrale, konsistente und produktionsnahe Ausgangsflaeche benoetigen.

Tailwind CSS stellt den Utility- und CSS-Build-Unterbau des Kits bereit. Es besitzt nicht die Designsemantik, Component APIs oder Runtime-Orchestrierung. Diese Verantwortung verbleibt bei XTend Design Tokens, XTend Components, RMT und Maraca.

## Naming und Registry-Identitaet

`@xtend-material` ist der kanonische Scope und die oeffentliche Produktfamilie. Ein npm Scope allein ist kein installierbarer Paketname; npm verlangt die Form `@scope/package`. Deshalb wird das erste veroeffentlichbare Paket als `@xtend-material/core` festgelegt.

| Rolle | Kanonischer Name |
|-------|------------------|
| Produktfamilie | `XTend Material` |
| npm Scope | `@xtend-material` |
| Kernpaket | `@xtend-material/core` |
| Maraca Build Adapter | `@xtend-material/maraca-tailwind` |
| lokale Repository-Pfade | `xtend-material/`, `xtend-maraca-css-tailwind/` |

Die Einfuehrung eines parallelen Alias wie `@ccslabs/xtend-material` ist blockiert. Vor der ersten Veroeffentlichung muss der npm Scope beziehungsweise die gleichnamige Organisation `xtend-material` eingerichtet und nachweislich durch CCS Labs administriert werden.

## Ownership

CCS Labs als Autor und Maintainer des XTend-Upstreams besitzt die Produkt-, Architektur- und Release-Verantwortung fuer den gesamten Scope `@xtend-material`.

| Bereich | Owner | Verantwortung |
|---------|-------|----------------|
| Produkt und Design Language | CCS Labs | Designprinzipien, Recipe Scope und oeffentliche Claims |
| npm Scope und Publishing | CCS Labs | Registry-Zugriff, 2FA, Provenance und Release-Freigabe |
| XTend Token Bridge | CCS Labs Component/Theme Ownership | `--xtend-*` Source of Truth und Theme-Kompatibilitaet |
| Maraca Adapter | CCS Labs Maraca Ownership | Build Lifecycle, Evidence, Determinismus und Fallback |
| RMT Recipes | CCS Labs RMT/App Platform Ownership | semantische Recipes, Source Maps und Diagnostics |
| Tailwind Upstream | Tailwind Labs | Tailwind Engine und Upstream-Releases; keine XTend-Produktverantwortung |

Contributor duerfen Aenderungen vorbereiten. Publishing-Rechte und die finale Freigabe fuer Pakete im Scope `@xtend-material` verbleiben bei CCS Labs beziehungsweise explizit durch CCS Labs autorisierten Maintainer-Teams.

## Bedeutung von Material

`Material` bezeichnet in XTend ein neutrales Design-Schema fuer breite, alltaegliche App-Klassen. Der Begriff steht fuer klare Flaechenhierarchie, robuste Typografie, vorhersehbare Abstaende, bedienbare Controls, sichtbare Zustaende und zurueckhaltende Motion.

Der Name erzeugt keinen Claim auf:

- vollstaendige Google-Material-Design-Paritaet;
- Kompatibilitaet mit Angular Material oder Material Web APIs;
- eine Kopie fremder Component Implementierungen;
- einen zweiten XTend Component Catalog.

XTend Material darf Material-Design-Prinzipien als Inspiration verwenden, definiert aber ein eigenes Design Kit auf bestehenden XTend-Vertraegen. Oeffentliche Dokumentation muss diese Abgrenzung sichtbar halten.

## Tailwind Baseline und Dependency Policy

Am 16. Juli 2026 ist `tailwindcss` `4.3.2` die aktuelle stabile npm-Version. XTM-00 friert diese Version als erste Implementierungsbaseline ein.

Das Zielmanifest fuer `@xtend-material/core` muss mindestens enthalten:

```json
{
  "name": "@xtend-material/core",
  "dependencies": {
    "tailwindcss": "4.3.2"
  }
}
```

Die Dependency wird wie folgt klassifiziert:

| Eigenschaft | Entscheidung |
|-------------|--------------|
| Package Section | direkte `dependencies` von `@xtend-material/core` |
| Lifecycle | build-time-only |
| Browser Bundle | nicht erlaubt |
| RMT Kernel Import | nicht erlaubt |
| XTend Root Dependency | nicht erlaubt |
| `@ccslabs/xtend-maraca` Core Dependency | nicht erlaubt |
| CDN/Remote Load | nicht erlaubt |
| Lock und Evidence | exakte aufgeloeste Version und Integrity erforderlich |

XTM-03 pinnt `@tailwindcss/node` `4.3.2` im Adapter `@xtend-material/maraca-tailwind`. Die Node-API liefert den lokalen Compiler, CSS-Import-Resolver und Lightning-CSS-Optimierer. `@tailwindcss/cli` wird nicht installiert, weil Maraca weder `npx` noch Build-Subprozesse benoetigt. `@tailwindcss/oxide` bleibt trotz der Stage-A-Floor Node 24 keine direkte Adapter-Abhaengigkeit: Native Scanner-Ownership, Lock- und Plattform-Evidence bleiben beim Upstream-Paket; die owned RMT-Source-Inventarisierung folgt in XTM-04.

## Latest-Stable Policy

Der Wunsch nach maximalem Funktions- und Klassenumfang wird durch eine `latest-stable-reviewed` Policy umgesetzt:

1. Zu Beginn jedes XTend-Material-Release-Zyklus wird der aktuelle stabile `tailwindcss`-Dist-Tag extern verifiziert.
2. Eine neuere stabile Version wird als Upgrade-PR mit Changelog-, Compatibility-, Browser-, Visual- und CSS-Budget-Evidence aufgenommen.
3. Das Package Manifest und der Lockfile pinnen die akzeptierte Version exakt. Ein beweglicher Wert wie `"latest"` ist in veroeffentlichten Manifests verboten.
4. Preview-, Beta-, RC- und Insiders-Versionen sind keine stabile Baseline und benoetigen ein separates Experiment-Artefakt.
5. Lokale Standard-Gates fragen die Registry nicht ab. Dadurch bleiben Builds offline reproduzierbar; Freshness wird in einem expliziten Release-/Maintenance-Gate geprueft.

Diese Policy maximiert den verfuegbaren stabilen Funktionsumfang, ohne identische Builds von einem veraenderlichen Registry-Zustand abhaengig zu machen.

## Architekturgrenzen

### Design Tokens

`--xtend-*` bleibt die einzige produktive Design-Token-Source-of-Truth. Tailwind Theme Variables duerfen XTend Tokens referenzieren und daraus Utilities erzeugen. Sie duerfen keine zweite, unabhaengige Produktpalette etablieren.

### Komponenten

XTend Material komponiert vorhandene XTend-Komponenten und native Elemente. Neue Components durchlaufen weiterhin Component Contract v2, A11y-, Styling-, Performance- und Browser-Gates. Das Design Kit registriert keine parallelen Custom Elements.

### RMT

RMT authorisiert semantische Recipes, Props, Variants, Tokens und Surfaces. Tailwind-spezifische Utility-Namen bleiben Build-Details und werden nicht zu einer stabilen Kernel- oder Component-API.

### Maraca

Maraca integriert Tailwind spaeter ueber einen generischen CSS Provider. Der bestehende native CSS-Pfad bleibt ohne installiertes Material Kit oder Adapter funktionsfaehig. Provider-Version, Sources, Fingerprints, Output und Budget muessen im Build Report sichtbar sein.

### Preflight

Tailwind Preflight ist fuer den MVP deaktiviert. XTend besitzt bereits native Element-, Component-, Theme- und Accessibility-Baselines. Eine spaetere Aktivierung oder Scope-Loesung benoetigt einen eigenen Architecture- und Browser-Regression-Entscheid.

## Browser- und Feature-Policy

Die Verwendung der neuesten stabilen Tailwind-Version erweitert nicht still die XTend Browser-Supportmatrix. Tailwind v4 nennt als Baseline Chrome 111, Safari 16.4 und Firefox 128. XTM-10 muss diese Anforderungen gegen den XTend Browser Hypervisor und den dann gueltigen Support Contract pruefen.

Ein Tailwind Utility, das ein neueres oder eingeschraenkt unterstuetztes Browser-Feature verwendet, ist nicht automatisch fuer alle Material Recipes freigegeben. Recipes brauchen eine dokumentierte Degradation oder bleiben capability-gated.

## Exit Path

XTend Material muss den Wechsel auf den nativen Maraca CSS Provider erlauben, ohne RMT Business Records, Component APIs oder Kernel-Verhalten zu aendern. Tailwind-spezifische Artefakte duerfen entfernt werden, waehrend semantische Recipes, XTend Tokens und Component Composition erhalten bleiben oder deterministisch in natives CSS materialisiert werden.

Der Exit Test wird in XTM-11 budget- und release-gatebar gemacht.

## Quellenstand

- npm Scope-Form: `https://docs.npmjs.com/using-npm/scope.html/`
- npm Scoped Public Packages: `https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/`
- Tailwind npm Package und stabile Version: `https://www.npmjs.com/package/tailwindcss`
- Tailwind v4.3 Release: `https://tailwindcss.com/blog/tailwindcss-v4-3`
- Tailwind Compatibility: `https://tailwindcss.com/docs/compatibility`

Externe Quellen belegen Registry-, Versions- und Browserfakten. XTend-interne Produkt- und Architekturentscheidungen werden ausschliesslich durch diesen Contract und das XTM Backlog gefuehrt.

## Verification

```bash
node scripts/run_xtend_tests.js xtend-material-architecture --json
npm run test:xtend-material-architecture
```

Der Gate prueft:

- Scope, vollstaendige Paketnamen und CCS-Labs-Ownership;
- Tailwind `4.3.2` als exakt gepinnte direkte Zieldependency;
- Latest-Stable-, Offline-, Preflight- und Exit-Policy;
- keine Tailwind Dependency im XTend Root;
- Backlog-, Runner- und Package-Metadata-Paritaet;
- abgeschlossenen Status von XTM-00.

# Komponenten-Entwicklung

XTend Komponenten sind lokale Custom Elements, die [XTend Classic](./xtend-classic.md) HTML-/JavaScript-Hosts und Maraca-/RMT-Hosts gemeinsam verwenden. Jede stabile Komponente besitzt eine Runtime-Datei unter `components/`, eine TypeScript-Deklaration und einen Eintrag in `components/manifest.json`.

## Eine Komponente auswählen

Beginne beim Nutzerproblem, nicht beim Tag-Namen. Form Controls wie `x-input` und `x-toggle` besitzen Validierungs- und Form-Association-Verträge. Navigationselemente wie `x-menu` und `x-tabs` besitzen Keyboard- und Current-State-Regeln. Surface-Komponenten koordinieren Fenster, Panels oder Overlays über einen Controller.

Die Einzelreferenzen dokumentieren Attribute, Events, Methoden, Slots, CSS Parts und Custom Properties source-basiert. Nicht aufgeführte Shadow-DOM-Strukturen sind privat.

## Direkt in HTML verwenden

Der Loader registriert nur Komponenten, die im lokalen Manifest vorkommen:

```html
<script type="module" src="/xtend-loader.js"
  data-manifest="/components/manifest.json"></script>

<x-button variant="primary" label="Speichern"></x-button>
```

Bei dynamischem Laden wartet ein Host vor Methodenaufrufen auf `customElements.whenDefined('x-button')`. Events sollten am Custom Element abonniert werden, nicht an erzeugten internen Controls.

## In RMT verwenden

RMT materialisiert Komponenten über DOM-Descriptoren. Attribute werden zu Properties oder Attributen, öffentliche DOM-Events zu deklarativen Commands. Der Vertrag `xtend.rmt.component-contract.v1` hält diese Grenze frameworkneutral; der RMT Kernel importiert keine Komponentenklassen.

## Styling und Accessibility

Passe zuerst Design Tokens an, danach dokumentierte CSS Custom Properties und Parts. Bewahre zugängliche Namen, Fokusführung, Live Regions und Fehlertexte. Die Komponentenreferenz nennt pro Control Tastatur- und Validierungsverhalten; ein Wrapper muss diese Signale durchreichen.

## Weiterlernen

- [Public Component Types](./public-component-types.md) erklärt die gemeinsamen Event- und Elementtypen.
- [TypeScript Components](./typescript-components.md) zeigt den TypeScript-first Build-Pfad.
- [Design Tokens](./design-tokens.md) beschreibt die stabile Theme-Grenze.
- [RMT Component Primitives](./rmt-vnext-component-primitives.md) verbindet Komponenten mit deklarativen Surfaces.

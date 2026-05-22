# Komponenten-Entwicklung mit XTend

XTend-Komponenten sind wiederverwendbare Web Components. In RMT-first Apps
werden sie nicht zur App-Architektur selbst: RMT beschreibt Shell, State,
Actions, Events, Surfaces und Scheduling; XTend Components materialisieren die
sichtbare UI.

Siehe auch [x-router](./components/xrouter.md), [x-link](./components/xlink.md)
und [RMT vNext Authoring Guide](./rmt-vnext-authoring.md).

## Grundprinzipien

- Jede visuelle Komponente ist ein ES-Modul und wird per Manifest geladen.
- Der Manifest-Key ist der kanonische Runtime- und Catalog-Name.
- Fuer Custom Elements ist der Tag-Name identisch zum Manifest-Key, z. B.
  `x-button`, `x-input`, `x-summary`.
- Source-Dateien folgen im Bestand dem Modul-Basename ohne Bindestrich, z. B.
  `xbutton.js` fuer `x-button`.
- Komponenten bleiben unabhaengig, konfigurierbar und host-neutral.
- RMT kann Komponenten referenzieren, mounten, hydrieren und mit Events
  verbinden, importiert sie aber nicht in den Kernel.

## Rolle in RMT-authorierten Apps

| Ebene | Aufgabe |
| --- | --- |
| RMT vNext | beschreibt App Shell, Surfaces, State, Actions, Events und Lanes |
| XTend Component | rendert UI, kapselt Shadow DOM, Attribute, Properties und Events |
| Host Adapter | verbindet RMT Records mit realen Custom Elements und Browser-DOM |
| Fabric | fuehrt Hydration, Render, User-Blocking- und Idle-Arbeit als Fibers aus |

Eine RMT-Surface kann zum Beispiel `component x-cards` deklarieren. Der Host
Adapter laedt `x-cards` ueber das Manifest, mountet das Custom Element und
verdrahtet Event-Payloads mit RMT Actions.

Die RMT vNext Component Capability Registry macht diesen Adapterpfad
generisch. Sie liest Manifest, Component Contracts, `xtendRmtMetadata`,
`observedAttributes`, Events, Slots, Parts, Form-Assoziation sowie A11y- und
Performance-Profile und stellt daraus Capabilities fuer alle public
Manifest-Komponenten bereit. Neue Komponenten bleiben normale Web Components;
fuer RMT-Kompatibilitaet brauchen sie stabile public Contracts statt Host-
Monkeypatching.

## Struktur einer Komponente

Typischerweise besteht eine Komponente aus:

- einer Klasse, die von `HTMLElement` oder einer lokalen Basis erbt
- Shadow DOM oder kontrolliertem Light-DOM
- Styles ueber CSS Custom Properties, Parts oder lokale Shadow-DOM-Regeln
- Attributen und Properties fuer Konfiguration
- Custom Events fuer Kommunikation
- Registrierung ueber `customElements.define(...)`

### Minimalbeispiel

```js
class XButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <button part="button"><slot></slot></button>
      <style>
        :host { display: inline-flex; }
        button { padding: 0.5rem 0.75rem; }
      </style>
    `;
  }
}

customElements.define('x-button', XButton);
```

## Naming-Regeln

| Ebene | Regel | Beispiel |
| --- | --- | --- |
| Manifest-Key | kanonischer Runtime- und Catalog-Name | `x-summary` |
| Custom Element Tag | identisch zum Manifest-Key | `<x-summary>` |
| Source-Datei | Modul-Basename aus dem Manifest-Pfad | `xsummary.js` |
| Component-Doku | Source-Basename plus `.md` | `docs/components/xsummary.md` |
| Docs-Menu-Slug | `components-` plus Source-Basename | `components-xsummary` |

Ausnahmen bleiben bewusst klein: `xstate` ist ein Plattform-State-Modul,
`x-utils` ist ein Utility-Modul ohne Custom Element und `x-theme` stellt die
Theme-Fassade bereit.

## Best Practices

- Nutze Shadow DOM, Parts und CSS Custom Properties fuer Kapselung und
  Theming.
- Halte Attribute, Properties und Events stabil und dokumentiert.
- Dispatch Events mit klaren `detail`-Payloads, damit RMT Actions sie sicher
  konsumieren koennen.
- Vermeide globale DOM-Annahmen in Komponenten; App-Struktur gehoert in RMT.
- Nutze `x-icon` fuer lokale Icons, Icon Packs und kontrollierte URL-Quellen.
- Plane Hydration bewusst: sichtbare UI gehoert in sichtbare Lanes, weniger
  dringende Arbeit in idle oder lazy Pfade.

## Beispiel mit Attribut und Event

```js
class XCounterButton extends HTMLElement {
  static get observedAttributes() {
    return ['value'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <button part="button" type="button"></button>
    `;
    this.shadowRoot.querySelector('button').addEventListener('click', () => {
      const value = Number(this.getAttribute('value') || 0) + 1;
      this.setAttribute('value', String(value));
      this.dispatchEvent(new CustomEvent('counter-change', {
        bubbles: true,
        detail: { value }
      }));
    });
  }

  attributeChangedCallback() {
    const button = this.shadowRoot && this.shadowRoot.querySelector('button');
    if (button) button.textContent = `Zaehler ${this.getAttribute('value') || 0}`;
  }
}

customElements.define('x-counter-button', XCounterButton);
```

In RMT kann dieses Event als `on counter-change -> action ...` an eine Action
gebunden werden.

## Testen und Debugging

- Komponenten koennen direkt im HTML getestet werden.
- Nutze `xtend-loader.js` und den lokalen Dev Server fuer manuelle Tests.
- Nutze RMT-Surfaces, wenn du Component-Verhalten im App-Lifecycle pruefen
  willst.
- Fuer API- und Typing-Fragen siehe [Public Component Types](./public-component-types.md).

## Weiterfuehrende Themen

- [Manifest-Format](./manifest.md)
- [XTend Loader](./xtend-loader.md)
- [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Component Primitives und XTend UI](./rmt-vnext-component-primitives.md)
- [Component Platform](./component-platform.md)
- [Component UX Authoring](./component-ux-authoring.md)
- [API-Integration](./api.md)

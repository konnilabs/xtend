# Public Component Types

TypeScript-Oberflächen für Attribute, Events und Component Contracts.

## Worum es geht

Public Component Types beschreibt den Core-Pfad über lokale Module, öffentliche TypeScript-Oberflächen und überprüfbare Host-Verdrahtung.
Diese Seite ist die öffentliche Orientierung für Teams, die XTend aus TypeScript, Lit, React-Wrappern oder klassischen Web-Component-Hosts verwenden.

```txt
docs contract: xtend.docs.public-component-types.v1
type contract: xtend.enterprise.er-wp-34.public-component-types.v1
shared helper: components/xtend-public-types.d.ts
local gate: npm run test:component-public-types
runner id: component-public-types
```

## Öffentliche Bausteine

- Component `.d.ts` Dateien neben dem jeweiligen Runtime-Modul.
- Gemeinsame Hilfstypen aus `components/xtend-public-types.d.ts`.
- Typisierte Event-Detail-Maps für ausgesendete DOM-Events.
- Attribute und Property-Kontrakte, die Wrapper durchreichen sollten.

Nutze zuerst die komponentennahe Deklaration und erst danach die gemeinsamen Hilfstypen, wenn ein Host generisches Event- oder Metadata-Handling braucht. Utility-Module wie `x-utils` stellen eine exportierte API bereit, während visuelle Komponenten HTMLElement-kompatible Typen liefern.

## Empfohlener Ablauf

Lies die Deklaration neben der Component Source, importiere den passenden Event-Detail-Typ und halte Wrapper an den dokumentierten Attributen, Events und Methoden ausgerichtet. Führe `npm run test:component-public-types` aus, bevor eine Host-Integration veröffentlicht wird, damit fehlende Deklarationen nicht erst in Beispielen oder Doku auffallen.

```ts
import type { XButtonElement, XButtonClickDetail } from '../components/xbutton';

const button = document.querySelector<XButtonElement>('x-button');
button?.addEventListener('x-button-click', (event: CustomEvent<XButtonClickDetail>) => {
  console.log(event.detail.variant);
});
```

## Fehlerbehebung

- Wenn TypeScript einen Component-Typ nicht findet, prüfe die sibling `.d.ts` Datei und den Package Export auf das lokale Modul.
- Wenn ein Event Detail als `unknown` erscheint, nutze die komponentenspezifische Event Map oder den gemeinsamen Helper aus `components/xtend-public-types.d.ts`.
- Wenn ein Wrapper Attribute verdeckt, spiegle die öffentlichen HTML-Attributnamen statt privater Prop-Namen.

## Nächste Schritte

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)

## Öffentlicher Vertrag

Public Component Types ist der öffentliche Referenz-Vertrag für `docs/de/public-component-types.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: öffentliche Dateien, Package Exports, Manifest-Keys, Attribute und Host-Verdrahtung.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/public-component-types.md`
- `docs/menu.json`
- `package.json`
- `components/manifest.json`
- `xtend-loader.js`
- `api.js`
- `api.d.ts`
- `design-tokens/xtend-design-tokens.js`

Namen:
- `components/xtend-public-types.d.ts`
- `docs/de/public-component-types.md`
- `docs/menu.json`
- `components/manifest.json`
- `design-tokens/xtend-design-tokens.js`
- `docs/dev-router.php`
- `.d.ts`
- `package.json`
- `xtend-loader.js`
- `api.js`

Befehle:
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn ein Host nichts lädt, prüfe Manifest-Pfad, Export-Name, Attribut-Schreibweise und ob die Datei lokal erreichbar ist.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.

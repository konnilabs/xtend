# WP-03 - Naming- und Contract-Matrix

- Status: Completed
- Datum: 24. Maerz 2026
- Epic: `EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung`

## Ziel

Dieses Workpackage definiert die kanonische Benennung fuer Tags, Module, State-Keys, Events und globale APIs im XTend-Core.

## 1. Naming-Matrix fuer Tags und Module

| Bereich | Kanonisch | Legacy / Beobachtet | Hinweis |
|--------|-----------|----------------------|---------|
| Bootstrap-Key | `xstate` | – | reservierter Manifest-Key, kein Custom Element Tag |
| Bootstrap-Key | `x-theme` | – | reservierter Bootstrap-Key fuer Theme-Basismodul |
| Custom Element Tag | `x-router` | `xrouter` | Laufzeit immer hyphenated |
| Custom Element Tag | `x-link` | `xlink` | Laufzeit immer hyphenated |
| Custom Element Tag | `x-dialog` | `xdialog` | Laufzeit immer hyphenated |
| Custom Element Tag | `x-modal` | `xmodal` | Laufzeit immer hyphenated |
| Custom Element Tag | `x-toast` | `xtoast` | Laufzeit immer hyphenated |
| Custom Element Tag | `x-alert` | `xalert` | Laufzeit immer hyphenated |
| Kompatibilitaets-Tagbegriff | `x-theme` | `xtheme` | Tag- und Modulbegriff bleiben klar zu trennen |
| Core-Moduldatei | `components/xrouter.js` | – | bestehende Repo-Konvention bleibt vorerst |
| Core-Moduldatei | `components/xlink.js` | – | bestehende Repo-Konvention bleibt vorerst |
| Core-Moduldatei | `components/xtheme.js` | – | bestehende Repo-Konvention bleibt vorerst |
| Klassenname | `XRouter` | – | PascalCase fuer JS-Klassen |
| Klassenname | `XLink` | – | PascalCase fuer JS-Klassen |
| Klassenname | `XDialog` | – | PascalCase fuer JS-Klassen |

## 2. Kanonischer State-Key-Rahmen

Kanonische Core-State-Keys sind namespaced und in dot notation strukturiert.

### Globaler Core-State

| Kanonisch | Heute beobachtet | Zweck |
|-----------|------------------|-------|
| `xtend.ui.toasts` | `ui.toasts` | Liste aktiver Toasts |
| `xtend.ui.alerts` | `ui.alerts` | Liste aktiver Alerts |
| `xtend.ui.dialogs` | `ui.dialogs` | Liste aktiver Dialoge |
| `xtend.ui.modals` | `ui.modals` | Liste aktiver Modals |
| `xtend.theme.current` | `theme` | aktives Theme |
| `xtend.theme.available` | `themes` | verfuegbare Themes |
| `xtend.theme.registry` | `theme-registry` | Theme-Metadaten |
| `xtend.router.current` | `router-current` | aktuelle Route |
| `xtend.router.lastNavigated` | `router-navigated` | zuletzt navigierter Pfad |
| `xtend.router.lastRendered` | `router-rendered` | zuletzt gerenderte Route |

### Instanzbezogener State

| Kanonisch | Heute beobachtet | Zweck |
|-----------|------------------|-------|
| `xtend.component.x-dialog.<id>.open` | `dialog-open-<id>`, `xdialog-open-<id>` | Dialog offen/geschlossen |
| `xtend.component.x-modal.<id>.open` | `modal-open-<id>` | Modal offen/geschlossen |
| `xtend.component.x-alert.<id>` | `xalert-state-<id>` | Alert-Instanzzustand |
| `xtend.component.x-input.<id>.value` | `xinput-value-<id>` | Feldwert |
| `xtend.component.x-header.<id>` | `xheader-state-<id>` | Header-Zustand |

## 3. Event-Matrix

### Kanonische Regeln

- DOM-Events sind hyphenated lowercase
- Oeffentliche Events sind domain- oder komponentenspezifisch eindeutig
- Legacy-Aliase werden nur als Kompatibilitaet gepflegt

### Oeffentliche Core-Events

| Kanonisch | Heute beobachtet | Hinweis |
|-----------|------------------|---------|
| `route-changed` | `route-changed`, `routechange` | `routechange` nur Legacy |
| `before-navigate` | `before-navigate` | beibehalten |
| `after-navigate` | `after-navigate` | beibehalten |
| `theme-initialized` | `theme-initialized` | beibehalten |
| `theme-changed` | `theme-changed` | beibehalten |
| `theme-api-ready` | `theme-api-ready` | beibehalten |
| `dialog-opened` | dokumentiert, teils nicht emittiert | muss vertragstreu werden |
| `dialog-closed` | dokumentiert, teils nicht emittiert | muss vertragstreu werden |
| `modal-opened` | noch nicht konsistent | bei WP-07 etablieren |
| `modal-closed` | noch nicht konsistent | bei WP-07 etablieren |
| `toast-shown` | `toast-shown` | beibehalten |
| `toast-dismissed` | `toast-dismissed` | beibehalten |
| `alert-shown` | `alert-shown` | beibehalten |
| `alert-dismissed` | `alert-dismissed` | beibehalten |

## 4. Globale API-Matrix

| Bereich | Kanonisch | Kompatibilitaet |
|---------|-----------|-----------------|
| globaler Namespace | `window.XTend` | primaere API |
| Theme-Fassade | `window.XTheme` | erlaubt als Kompatibilitaet |
| Toast-Fassade | `window.XToast` | erlaubt als Kompatibilitaet |
| Alert-Fassade | `window.XAlert` | erlaubt als Kompatibilitaet |
| Dialog-Fassade | `window.XDialog` | erlaubt als Kompatibilitaet |
| Modal-Fassade | `window.XModal` | erlaubt als Kompatibilitaet |
| Legacy-Kurzform | `window.showToast`, `window.showAlert`, `window.showDialog`, `window.showModal` | nur als dokumentierte Legacy-Fassade |

## 5. Sofortige Migrationsfolgen

- neue Core-Codepfade nutzen hyphenated Tags
- `xrouter` darf den `subscribe`-Contract von `xstate` nutzen, nicht `on/off`
- neue Dialog- und Modal-Arbeit orientiert sich an einem gemeinsamen kanonischen Open-Key
- globale XTend-Contracts werden unter `window.XTend` dokumentiert und von dort aus beschrieben

## 6. Ergebnis fuer Folgepakete

- `WP-04` nutzt die Tag- und Bootstrap-Namen aus dieser Matrix
- `WP-05` normiert den State-Contract gegen diese Matrix
- `WP-06` bis `WP-10` migrieren API, Router, Theme und Overlay-Komponenten auf diese Benennung

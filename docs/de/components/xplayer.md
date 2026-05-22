# xplayer – XTend Komponente

> **Siehe auch:** [xlightbox](./xlightbox.md)

## Übersicht

`<x-player>` ist eine vielseitige Media-Player-Komponente für Audio und Video. Sie unterstützt Playlists, Custom Controls, Theming, State-Integration, Download, Media-Chooser und Vollbild.

---

## Features
- Wiedergabe von Audio/Video
- Playlists und Media-Controls
- Download-Button (optional)
- Media-Chooser (Quellenauswahl)
- Poster-Bild für Videos
- Vollbildmodus
- State-Integration via xstate
- Theming via CSS Custom Properties

---

## Verwendung

```html
<x-player src="song.mp3" type="audio"></x-player>
<x-player src="video.mp4" poster="cover.jpg" type="video" title="Demo Video" downloadable="true"></x-player>
```

---

## Attribute
| Attribut         | Typ     | Beschreibung                                              |
|------------------|---------|----------------------------------------------------------|
| `src`            | String  | Media-URL (Audio/Video)                                  |
| `poster`         | String  | Vorschaubild für Video                                   |
| `type`           | String  | Medientyp (`audio` oder `video`, Standard: `video`)      |
| `media-chooser`  | String  | `true` für Quellenauswahl (Dropdown)                     |
| `downloadable`   | String  | `true` für Download-Button                               |
| `autoplay`       | Boolean | Autoplay beim Laden                                      |
| `title`          | String  | Titelanzeige im Player                                   |
| `height`         | String  | Höhe (z.B. `360`)                                        |
| `width`          | String  | Breite (z.B. `640`)                                      |

---

## Events
| Event             | Beschreibung                                 |
|-------------------|----------------------------------------------|
| `xplayer-play`    | Wiedergabe gestartet, Detail: `{ currentTime }` |
| `xplayer-pause`   | Wiedergabe pausiert, Detail: `{ currentTime }`  |
| `xplayer-mute`    | Stummschaltung geändert, Detail: `{ muted }`   |
| `xplayer-volume`  | Lautstärke geändert, Detail: `{ volume }`      |

---

## API
- **Abspielen:** `element.play()`
- **Pausieren:** `element.pause()`
- **State-Integration:** Automatisch via xstate
- **Vollbild:** `element.requestFullscreen()`

---

## Beispiel: Dynamisch per JS

```js
const player = document.createElement('x-player');
player.setAttribute('src', 'song.mp3');
document.body.appendChild(player);
player.play();
```

---

## Styling & Theming

```css
x-player {
  --primary-color: #4fc3f7;
  --border-radius: 8px;
  /* Weitere Custom Properties siehe CSS */
}
```

---

## Accessibility
- Semantisches HTML, ARIA
- Tastaturbedienung

---

*Letzte Aktualisierung: 16. Juli 2025*

## Layout Display Media UX Profil

`x-player` stellt ab `WP-E11-12` das Profil `xtend.component.layout-display-media-ux-profile.v1` bereit. Media kann dadurch shell-first gerendert und erst ueber `media.lazy.load` bzw. `media.playback.user` geplant werden. Der State-Key lautet `xplayer-state-<id>`.

- Profil-Getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `media.lazy.load`
- Events: `xplayer-play`, `xplayer-pause`, `xplayer-fullscreen`, `xplayer-pip`
- Snapshot: `snapshot()`
- CSS Parts: `root`, `media`, `controls`, `progress`, `overlay`

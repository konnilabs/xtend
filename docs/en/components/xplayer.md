# xplayer - XTend Component

> **See also:** [xlightbox](./xlightbox.md)

## Overview

`<x-player>` is a versatile media player component for audio and video. It
supports playlists, custom controls, theming, state integration, download,
media chooser, and fullscreen.

---

## Features

- Audio/video playback
- Playlists and media controls
- Download button (optional)
- Media chooser (source selection)
- Poster image for videos
- Fullscreen mode
- State integration through xstate
- Theming through CSS custom properties

---

## Usage

```html
<x-player src="song.mp3" type="audio"></x-player>
<x-player src="video.mp4" poster="cover.jpg" type="video" title="Demo Video" downloadable="true"></x-player>
```

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `src` | String | media URL (audio/video) |
| `poster` | String | preview image for video |
| `type` | String | media type (`audio` or `video`, default: `video`) |
| `media-chooser` | String | `true` for source selection dropdown |
| `downloadable` | String | `true` for download button |
| `autoplay` | Boolean | autoplay on load |
| `title` | String | title displayed in the player |
| `height` | String | height, for example `360` |
| `width` | String | width, for example `640` |

---

## Events

| Event | Description |
|-------|-------------|
| `xplayer-play` | playback started, detail: `{ currentTime }` |
| `xplayer-pause` | playback paused, detail: `{ currentTime }` |
| `xplayer-mute` | mute changed, detail: `{ muted }` |
| `xplayer-volume` | volume changed, detail: `{ volume }` |

---

## API

- **Play:** `element.play()`
- **Pause:** `element.pause()`
- **State integration:** automatic through xstate
- **Fullscreen:** `element.requestFullscreen()`

---

## Example: Dynamic JS

```js
const player = document.createElement('x-player');
player.setAttribute('src', 'song.mp3');
document.body.appendChild(player);
player.play();
```

---

## Styling and Theming

```css
x-player {
  --primary-color: #4fc3f7;
  --border-radius: 8px;
  /* See CSS for more custom properties */
}
```

---

## Accessibility

- Semantic HTML, ARIA
- Keyboard operation

---

*Last updated: July 16, 2025*

## Layout Display Media UX Profile

Starting with `WP-E11-12`, `x-player` exposes the profile
`xtend.component.layout-display-media-ux-profile.v1`. Media can therefore be
rendered shell-first and scheduled only later through `media.lazy.load` or
`media.playback.user`. The state key is `xplayer-state-<id>`.

- Profile getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `media.lazy.load`
- Events: `xplayer-play`, `xplayer-pause`, `xplayer-fullscreen`, `xplayer-pip`
- Snapshot: `snapshot()`
- CSS parts: `root`, `media`, `controls`, `progress`, `overlay`

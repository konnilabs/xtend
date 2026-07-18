# XTend ESM Registry Demo

This browser demo shows the developer experience of the new package-root ESM layer without a bundler. An import map maps the public specifier `@ccslabs/xtend` to `/xtend.js`; application code then uses the same named imports as an installed package.

Demonstrated APIs:

- `schedule()` and `afterPaint()` with shared lazy scheduling.
- `render()` with safe DOM descriptors.
- `createApp()` and `createStore()` aliases.
- `loadComponent()` for deliberate Classic-loader interop.
- `disposeXTend()` for host cleanup.

From the repository root:

```bash
npm run dev:local
```

Open <http://127.0.0.1:4173/demos/esm-app/index.html>.

The demo intentionally contains no direct imports from `xtendrmt/`, no manual `innerHTML`, and no eager `xtend-loader.js` script tag. The application-facing source is [`app.js`](./app.js).

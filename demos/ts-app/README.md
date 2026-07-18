# XTend TypeScript Registry Demo

This Vite application proves the package-root TypeScript DX against the real `@ccslabs/xtend` browser export. It uses no relative registry or RMT imports.

```bash
npm run demo:ts
npm run demo:ts:typecheck
npm run demo:ts:build
```

Open <http://127.0.0.1:4174/> after starting the development server. The source demonstrates opt-in state generics, checked DOM descriptors, scheduling, rendering, lazy Classic-component interop and registry disposal.

The repository-hosted `/demos/ts-app/` route loads the browser-ready `app.js` counterpart, so a static server never needs to serve or transform raw TypeScript. Vite replaces that entry with `src/main.ts` during development and production builds. The generated production output remains in `demos/ts-app/dist` and is not package runtime source.

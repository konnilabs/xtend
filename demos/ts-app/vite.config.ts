import { defineConfig } from 'vite';

const componentsDirectory = new URL('../../components', import.meta.url).pathname.replace(/\/$/, '');

export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  server: { port: 4174 },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Keep the Vite 7 browser baseline when upgrading the build tool.
    target: ['chrome107', 'edge107', 'firefox104', 'safari16']
  },
  plugins: [{
    name: 'xtend-demo-components',
    transformIndexHtml(html) {
      return html.replace('./app.js', '/src/main.ts');
    },
    configureServer(server) {
      server.middlewares.use('/components', (request, _response, next) => {
        request.url = `/@fs${componentsDirectory}${request.url || '/'}`;
        next();
      });
    }
  }]
});

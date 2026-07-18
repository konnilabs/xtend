import { defineConfig } from 'vite';

const componentsDirectory = new URL('../../components', import.meta.url).pathname.replace(/\/$/, '');

export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  server: { port: 4174 },
  build: { outDir: 'dist', emptyOutDir: true },
  plugins: [{
    name: 'xtend-demo-components',
    configureServer(server) {
      server.middlewares.use('/xtend-components', (request, _response, next) => {
        request.url = `/@fs${componentsDirectory}${request.url || '/'}`;
        next();
      });
    }
  }]
});

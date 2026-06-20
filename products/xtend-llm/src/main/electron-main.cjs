import('./electron-main.mjs').catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});

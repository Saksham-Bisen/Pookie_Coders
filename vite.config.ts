import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@pixa/core': decodeURIComponent(new URL('./packages/core', import.meta.url).pathname),
    },
  },
  server: { host: true }, // reachable from the other laptops on the LAN
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts', 'levels/**/*.test.ts'],
  },
});

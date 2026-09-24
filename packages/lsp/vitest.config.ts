import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { 'sysml2-mermaid': fileURLToPath(new URL('../../src/index.ts', import.meta.url)) } },
  test: { environment: 'node', include: ['test/**/*.spec.ts'] },
});

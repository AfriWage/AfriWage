import { fileURLToPath } from 'url';
import path from 'path';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Point workspace packages directly at their TypeScript source so Vitest
      // doesn't need a prior `pnpm build` to resolve them from dist/.
      '@AfriWage/sdk': path.resolve(__dirname, '../../packages/sdk/src/index.ts'),
      '@AfriWage/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

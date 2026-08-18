import { fileURLToPath } from 'url';
import path from 'path';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: {
    // Match Next.js's automatic JSX runtime so `.tsx` tests and the components
    // they render don't require an explicit `import React`.
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      // Point workspace packages directly at their TypeScript source so Vitest
      // doesn't need a prior `pnpm build` to resolve them from dist/.
      '@AfriWage/sdk': path.resolve(__dirname, '../../packages/sdk/src/index.ts'),
      '@AfriWage/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
      // Resolve the app's `@/` path alias used by components under test.
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});

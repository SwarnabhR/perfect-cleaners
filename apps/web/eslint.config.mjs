import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'playwright-report/**',
    'test-results/**',
  ]),
  {
    // One-off Node utility scripts — CommonJS by design, never bundled.
    files: ['scripts/**'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Playwright fixtures/helpers — their `use` callback is Playwright's
    // fixture API, not a React hook, so the React-hooks rules misfire here.
    files: ['tests/**'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Advisory performance hints from the React hooks plugin, not
    // correctness bugs — keep them visible as warnings without failing lint.
    // Scoped to src so this object only applies where the Next.js base
    // configs have already registered the react-hooks plugin.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
]);

export default eslintConfig;

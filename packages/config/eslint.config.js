// Shared flat ESLint config for NightOut
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/** Base config for TypeScript packages (node + browser globals). */
export const base = tseslint.config(
  { ignores: ['dist/**', 'coverage/**', '.turbo/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
);

/** React apps/packages: function components + hooks rules. */
export const react = tseslint.config(...base, {
  files: ['**/*.{ts,tsx}'],
  plugins: { 'react-hooks': reactHooks },
  rules: {
    ...reactHooks.configs.recommended.rules,
    // ห้ามใช้ @ant-design/icons — ใช้ @phosphor-icons/react แทน
    'no-restricted-imports': [
      'error',
      { paths: [{ name: '@ant-design/icons', message: 'ใช้ @phosphor-icons/react แทน' }] },
    ],
  },
});

export default base;

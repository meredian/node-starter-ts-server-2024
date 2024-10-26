import parser from '@typescript-eslint/parser';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslint from '@eslint/js';
import typescriptEslint from 'typescript-eslint';

export default [
  {
    ignores: ['*.log.*', '*.log', 'node_modules/', 'dist/', 'src/'],
    files: ['**/*.{ts}'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
      },
    },
  },
  ...typescriptEslint.config(
    eslint.configs.recommended,
    ...typescriptEslint.configs.recommended,
  ),
  {
    rules: {
      '@typescript-eslint/explicit-member-accessibility': 0,
      '@typescript-eslint/explicit-function-return-type': 0,
      '@typescript-eslint/interface-name-prefix': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },
  },
  eslintPluginPrettierRecommended,
];

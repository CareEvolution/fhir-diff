const globals = require('globals');
const pluginJs = require('@eslint/js');
const tseslint = require('typescript-eslint');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

module.exports = [
  pluginJs.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      'import/prefer-default-export': 'off',
      '@typescript-eslint/lines-between-class-members': 'off',
      'no-console': 'off',
      'class-methods-use-this': 'off',
      'prefer-destructuring': 'off',
      'no-plusplus': 'off',
      'no-continue': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
  },
  {
    ignores: ['dist', 'eslint.config.cjs', 'jest.config.js'],
  },
];

const globals = require('globals');
const pluginJs = require('@eslint/js');
const tseslint = require('typescript-eslint');
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  pluginJs.configs.recommended,
  ...compat.extends('airbnb-base'), 
  ...compat.extends('eslint-config-prettier'),
  ...compat.extends('airbnb-typescript/base'),
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
    files: ["**/*.ts"],
    rules: {
      'import/prefer-default-export': 'off',
      '@typescript-eslint/lines-between-class-members': 'off',
      'no-console': 'off',
      'class-methods-use-this': 'off',
      'prefer-destructuring': 'off',
      'no-plusplus': 'off',
      'no-continue': 'off'
    }
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
  },
  {
    ignores: ['dist', 'eslint.config.cjs', 'jest.config.js'],
  },
];

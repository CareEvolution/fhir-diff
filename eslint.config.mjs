import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import { eslintConfig } from "@careevolution/eslint-config-ce-frontend"

export default [
  ...eslintConfig,
  {
    ignores: ["dist", "jest.config.js"],
  },
  {
    rules: {
      camelcase: "error",
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
  },
  {
    languageOptions: { globals: globals.browser },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];

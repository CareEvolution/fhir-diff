const globals = require("globals");
const pluginJs = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: {
      camelcase: "error",
    },
  },
  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: { sourceType: "commonjs" },
    rules: {
      "@typescript-eslint/no-var-requires": "off"
    }
  },
  {
    languageOptions: { globals: globals.node },
  },
];

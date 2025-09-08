const js = require("@eslint/js");
const globals = require("globals");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 2022,
      sourceType: "commonjs",
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "no-console": "warn",
      "prefer-const": "error",
      "no-process-exit": "error",
      "no-sync": "warn",
    },
  },
  {
    files: ["db/seed.js"],
    rules: {
      "no-console": "off",
      "no-process-exit": "off",
    },
  },
]);

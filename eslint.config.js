import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn"
    } 
  },
  { files: ["**/*.{js,mjs,cjs}"],
    ignores: ["node_modules/", "dist/"] // Ignore unnecessary files because .eslintignore is no longer supported
   },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended
];
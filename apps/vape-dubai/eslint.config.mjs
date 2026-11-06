import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Pre-existing localStorage/mount hydration patterns in fx components
      // and locale/country contexts predate this rule (new in react-hooks v7,
      // first enforced when `next lint` was replaced by `eslint .`).
      // Warn-only until they are refactored — do not block CI on them.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;

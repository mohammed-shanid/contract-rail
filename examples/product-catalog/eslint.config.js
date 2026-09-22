// Boundary rules from contracts/CR-0001-catalog-repository.md, section 3.
// The architecture test in test/architecture.test.ts enforces the same rules
// a second way, so bypassing one mechanism still fails the other.
import tseslint from "typescript-eslint";

const DATA_LAYER = ["**/data", "**/data/**"];

export default tseslint.config(
  { ignores: ["node_modules/**", "violations/**"] },
  ...tseslint.configs.recommended,
  {
    // Rule 1 + 2: nothing outside src/data and src/main.ts may import src/data.
    files: ["src/**/*.ts", "test/**/*.ts"],
    ignores: ["src/data/**", "src/main.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: DATA_LAYER,
              message:
                "CR-0001 rule 1: this layer may not import src/data. Depend on the CatalogRepository interface from src/contracts and let src/main.ts inject the implementation.",
            },
          ],
        },
      ],
    },
  },
  {
    // Rule 3: the frozen contract layer imports nothing outside itself.
    files: ["src/contracts/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../**", "**/data/**", "**/ui/**"],
              message:
                "CR-0001 rule 3: src/contracts is a leaf. It may not import from other layers.",
            },
          ],
        },
      ],
    },
  },
);

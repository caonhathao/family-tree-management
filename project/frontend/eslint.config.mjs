import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "react/jsx-curly-brace-presence": [
        "error",
        { props: "always", children: "never" },
      ],

      "prettier/prettier": [
        "error",
        {
          singleQuote: false,
          jsxSingleQuote: false,
          endOfLine: "auto",
        },
      ],
    },
  },
  prettierConfig, // Quan trọng: Dòng này để tắt các rule ESLint xung đột với Prettier
]);

export default eslintConfig;

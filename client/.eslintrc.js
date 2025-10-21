export default {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    "react",
    "react-hooks",
    "@typescript-eslint",
    "unused-imports",
    "prettier"
  ],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  rules: {
    // 🧹 Clean code rules
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn"],
    "unused-imports/no-unused-imports": "warn",

    // 💅 Enforce Prettier formatting
    "prettier/prettier": [
      "warn",
      {
        endOfLine: "auto",
        semi: true,
        singleQuote: false,
        trailingComma: "es5",
        tabWidth: 2,
        printWidth: 100
      }
    ],

    // ⚛️ React best practices
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",

    // ✅ TypeScript-specific
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-ts-comment": "off",
  },
  settings: {
    react: {
      version: "detect"
    }
  },
};

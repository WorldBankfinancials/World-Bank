module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2023: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  plugins: ["react", "react-hooks", "@typescript-eslint", "unused-imports", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    // 🚫 Code quality
    "no-console": "warn",
    "no-debugger": "warn",
    "no-unused-vars": "off",

    // 🧹 Remove unused imports automatically
    "unused-imports/no-unused-imports": "error",

    // ✅ TypeScript improvements
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-ts-comment": "off",

    // 💅 Formatting handled by Prettier
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto",
      },
    ],
  },
  overrides: [
    {
      files: ["server/**/*.ts"],
      env: {
        node: true,
      },
      rules: {
        "react/react-in-jsx-scope": "off",
      },
    },
    {
      files: ["client/**/*.{ts,tsx}"],
      env: {
        browser: true,
      },
      rules: {
        "react/react-in-jsx-scope": "off",
      },
    },
  ],
  ignorePatterns: ["node_modules", "dist", "build", ".husky", ".vscode", "coverage"],
};

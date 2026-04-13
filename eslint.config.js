// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      "no-unused-vars": "off", // Turn off the base rule
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^React$|^_", // Ignore React and variables starting with _
          argsIgnorePattern: "^_",
        },
      ],
      "react/react-in-jsx-scope": "off", // Not needed in React 17+
    },
  },
]);

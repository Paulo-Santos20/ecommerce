module.exports = {
  root: true,
  env: {
    es6: true,
    node: true, // <-- ESTA É A LINHA MAIS IMPORTANTE
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  parserOptions: {
    ecmaVersion: 2020, 
  },
  rules: {
    quotes: ["error", "double"],
    "no-unused-vars": "warn", // Apenas avisa sobre variáveis não usadas
  },
};
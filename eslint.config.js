/** @type {import('eslint').Linter.Config} */
const config = {
  extends: ['next/core-web-vitals'],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
  },
  ignorePatterns: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'dist-scripts/**',
    'circuits/**',
    'ipfs-data/**',
    'oxigraph/**',
    'target/**',
    'playwright-report/**',
    'test-results/**',
  ],
};

module.exports = config;

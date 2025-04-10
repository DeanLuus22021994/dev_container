module.exports = {
  root: false,
  env: {
    node: true,
    jest: true
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script' // Allow CommonJS style requires in test files
  },
  rules: {
    '@typescript-eslint/no-var-requires': 'off',
    'no-undef': 'off',
    'no-unused-vars': 'warn',
  },
  overrides: [
    {
      files: ['**/*.js'],
      rules: {
        'require-statement-not-part-of-import-statement': 'off',
      }
    }
  ]
};
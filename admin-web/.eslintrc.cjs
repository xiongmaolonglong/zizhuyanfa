/* eslint-env node */
require('@rushstack/eslint-patch/modern-node-resolution')

module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    // Vue 规则
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'warn',

    // JS 规则
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-undef': 'error'
  }
}

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn'
    }
  }
];

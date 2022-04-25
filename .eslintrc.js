module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    extends: ['plugin:@typescript-eslint/recommended'],
    env: {
        node: true
    },
    rules: {
        'no-console': 'off',
        'import/prefer-default-export': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-implicit-any': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
    }
}
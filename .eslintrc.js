module.exports = {
    env: {
        es6: true,
        node: true,
        jest: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:prettier/recommended',
    ],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parser: 'babel-eslint',
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    plugins: ['prettier', 'react'],
    rules: {
        'prettier/prettier': 'error',
        'prefer-const': 'warn',
        'no-var': 'warn',
        'react/prop-types': 'off',
        curly: 'warn',
        'arrow-body-style': 'off',
        'prefer-arrow-callback': 'off',
    },
    settings: {
        react: {
            version: 'latest',
        },
    },
};

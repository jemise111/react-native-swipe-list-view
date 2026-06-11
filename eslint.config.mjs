import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
    {
        // v3 sources (components/, lib/, types/, bin/, SwipeListExample/) are
        // frozen reference code — they keep the old tooling until Phase 8 deletes them.
        ignores: [
            'components/',
            'lib/',
            'types/',
            'bin/',
            'SwipeListExample/',
            'example/',
            'node_modules/',
            '*.js',
            '*.mjs',
        ],
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommended,
            react.configs.flat.recommended,
            prettier,
        ],
        plugins: {
            'react-hooks': reactHooks,
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'error',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    }
);

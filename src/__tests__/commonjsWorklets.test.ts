// Regression test for #652: consumers' Metro resolves the package's `main`
// (lib/commonjs), and their Babel runs the worklets plugin over that output.
// Reproduce that pipeline — bob's CommonJS build, then the Reanimated plugin —
// and check nothing the plugin does breaks the built module.
import { transformSync } from '@babel/core';
import { readFileSync } from 'fs';
import path from 'path';

const srcDir = path.join(__dirname, '..');

function compile(file: string, modules: 'commonjs' | 'preserve'): string {
    const filename = path.join(srcDir, file);
    const built = transformSync(readFileSync(filename, 'utf8'), {
        filename,
        babelrc: false,
        configFile: false,
        presets: [
            [
                require.resolve('react-native-builder-bob/babel-preset'),
                { modules },
            ],
        ],
    })!.code!;
    return transformSync(built, {
        filename,
        babelrc: false,
        configFile: false,
        plugins: [require.resolve('react-native-reanimated/plugin')],
    })!.code!;
}

const countWorklets = (code: string) =>
    (code.match(/__workletHash\s*=/g) ?? []).length;

describe('CommonJS build + worklets plugin (#652)', () => {
    it('exports every helper as a worklet function, not undefined', () => {
        const code = compile('helpers.ts', 'commonjs');
        const module = { exports: {} as Record<string, unknown> };
        new Function('exports', 'require', 'module', code)(
            module.exports,
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            (id: string) => require(path.join(srcDir, id)),
            module
        );
        const names = [
            'springConfigFromV3',
            'projectedExtraPixels',
            'rightSwipeReleaseTarget',
            'leftSwipeReleaseTarget',
        ];
        for (const name of names) {
            const fn = module.exports[name] as { __workletHash?: number };
            expect(typeof fn).toBe('function');
            expect(fn.__workletHash).toBeDefined();
        }
    });

    it('workletizes the same SwipeRow callbacks as the ES module build', () => {
        const cjs = countWorklets(compile('SwipeRow.tsx', 'commonjs'));
        const esm = countWorklets(compile('SwipeRow.tsx', 'preserve'));
        expect(esm).toBeGreaterThan(0);
        expect(cjs).toBe(esm);
    });
});

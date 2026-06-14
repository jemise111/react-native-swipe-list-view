import { warnOnce } from '../deprecations';

describe('warnOnce (C4)', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    it('warns with the library prefix, prop name and message', () => {
        warnOnce('propA', 'was removed.');
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(
            '[react-native-swipe-list-view] propA: was removed.'
        );
    });

    it('warns only once per prop name', () => {
        warnOnce('propB', 'msg');
        warnOnce('propB', 'msg');
        warnOnce('propB', 'a different msg');
        expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('tracks prop names independently', () => {
        warnOnce('propC', 'msg');
        warnOnce('propD', 'msg');
        expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it('is silent outside __DEV__', () => {
        const g = globalThis as { __DEV__?: boolean };
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            warnOnce('propE', 'msg');
            expect(warnSpy).not.toHaveBeenCalled();
        } finally {
            g.__DEV__ = original;
        }
    });

    it('does not mark a prop as warned when skipped outside __DEV__', () => {
        const g = globalThis as { __DEV__?: boolean };
        const original = g.__DEV__;
        g.__DEV__ = false;
        warnOnce('propF', 'msg');
        g.__DEV__ = original;
        warnOnce('propF', 'msg');
        expect(warnSpy).toHaveBeenCalledTimes(1);
    });
});

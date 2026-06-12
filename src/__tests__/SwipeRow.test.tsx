import { createRef } from 'react';
import { Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import SwipeRow from '../SwipeRow';
import type { SwipeRowRef } from '../types';

function renderRow(props: Record<string, unknown> = {}) {
    const ref = createRef<SwipeRowRef>();
    const utils = render(
        <SwipeRow ref={ref} {...props}>
            <View>
                <Text>hidden</Text>
            </View>
            <View>
                <Text>visible</Text>
            </View>
        </SwipeRow>
    );
    return { ref, ...utils };
}

describe('SwipeRow', () => {
    it('renders both children (hidden first, visible second)', () => {
        renderRow();
        expect(screen.getByText('hidden')).toBeTruthy();
        expect(screen.getByText('visible')).toBeTruthy();
    });

    it('exposes the v3 imperative handle plus swipeAnimatedValue (C1)', () => {
        const { ref } = renderRow();
        expect(ref.current).toBeTruthy();
        expect(typeof ref.current!.closeRow).toBe('function');
        expect(typeof ref.current!.closeRowWithoutAnimation).toBe('function');
        expect(typeof ref.current!.manuallySwipeRow).toBe('function');
        expect(ref.current!.isOpen).toBe(false);
        expect(ref.current!.swipeAnimatedValue).toBeDefined();
        expect(ref.current!.swipeAnimatedValue.value).toBe(0);
    });

    it('closeRowWithoutAnimation fires onRowDidClose then onRowClose (v3 order)', () => {
        const calls: string[] = [];
        const { ref } = renderRow({
            onRowClose: () => calls.push('onRowClose'),
            onRowDidClose: () => calls.push('onRowDidClose'),
        });
        ref.current!.closeRowWithoutAnimation();
        expect(calls).toEqual(['onRowDidClose', 'onRowClose']);
        expect(ref.current!.isOpen).toBe(false);
        expect(ref.current!.swipeAnimatedValue.value).toBe(0);
    });

    it('manuallySwipeRow fires onRowOpen with toValue', () => {
        const onRowOpen = jest.fn();
        const { ref } = renderRow({ onRowOpen, rightOpenValue: -150 });
        ref.current!.manuallySwipeRow(-150);
        expect(onRowOpen).toHaveBeenCalledWith(-150);
    });

    it('closeRow fires onRowClose', () => {
        const onRowClose = jest.fn();
        const { ref } = renderRow({ onRowClose });
        ref.current!.closeRow();
        expect(onRowClose).toHaveBeenCalled();
    });

    describe('accessibility actions (C6)', () => {
        it('exposes swipeleft/swiperight based on open values', () => {
            const { toJSON } = renderRow({
                leftOpenValue: 75,
                rightOpenValue: -150,
            });
            const root = toJSON() as { props: Record<string, unknown> };
            expect(root.props.accessibilityActions).toEqual([
                { name: 'swipeleft' },
                { name: 'swiperight' },
            ]);
        });

        it('exposes no actions when no open values set', () => {
            const { toJSON } = renderRow();
            const root = toJSON() as { props: Record<string, unknown> };
            expect(root.props.accessibilityActions).toBeUndefined();
        });

        it('opts out via accessible={false}', () => {
            const { toJSON } = renderRow({
                leftOpenValue: 75,
                accessible: false,
            });
            const root = toJSON() as { props: Record<string, unknown> };
            expect(root.props.accessibilityActions).toBeUndefined();
        });

        it('swipeleft action opens the row to rightOpenValue', () => {
            const onRowOpen = jest.fn();
            const { toJSON } = renderRow({
                rightOpenValue: -150,
                onRowOpen,
            });
            const root = toJSON() as {
                props: {
                    onAccessibilityAction: (event: {
                        nativeEvent: { actionName: string };
                    }) => void;
                };
            };
            root.props.onAccessibilityAction({
                nativeEvent: { actionName: 'swipeleft' },
            });
            expect(onRowOpen).toHaveBeenCalledWith(-150);
        });

        it('forwards the event to a user onAccessibilityAction', () => {
            const onAccessibilityAction = jest.fn();
            const { toJSON } = renderRow({
                rightOpenValue: -150,
                onAccessibilityAction,
            });
            const root = toJSON() as {
                props: {
                    onAccessibilityAction: (event: unknown) => void;
                };
            };
            const event = { nativeEvent: { actionName: 'swipeleft' } };
            root.props.onAccessibilityAction(event);
            expect(onAccessibilityAction).toHaveBeenCalledWith(event);
        });
    });

    describe('deprecations (C4)', () => {
        it('dev-warns once for useNativeDriver', () => {
            const warnSpy = jest
                .spyOn(console, 'warn')
                .mockImplementation(() => {});
            renderRow({ useNativeDriver: true });
            renderRow({ useNativeDriver: false });
            const matching = warnSpy.mock.calls.filter(args =>
                String(args[0]).includes('useNativeDriver')
            );
            expect(matching).toHaveLength(1);
            warnSpy.mockRestore();
        });
    });
});

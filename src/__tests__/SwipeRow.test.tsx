import { createRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import SwipeRow from '../SwipeRow';
import type { SwipeRowRef } from '../types';

type JsonNode = {
    type: string;
    props: Record<string, unknown>;
    children: Array<JsonNode | string> | null;
};

const collectNodes = (
    node: JsonNode | string | null,
    out: JsonNode[] = []
): JsonNode[] => {
    if (!node || typeof node === 'string') {
        return out;
    }
    out.push(node);
    (node.children ?? []).forEach(child => collectNodes(child, out));
    return out;
};

const hiddenContainerStyle = () => {
    const nodes = collectNodes(screen.toJSON() as unknown as JsonNode);
    const hidden = nodes.find(
        n =>
            StyleSheet.flatten(n.props.style as StyleProp<ViewStyle>)
                ?.position === 'absolute'
    );
    return StyleSheet.flatten(
        hidden!.props.style as StyleProp<ViewStyle>
    ) as {
        height?: number | string;
        width?: number | string;
    };
};

const layoutEvent = (height: number, width: number) => ({
    nativeEvent: { layout: { x: 0, y: 0, width, height } },
});

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

    it('manuallySwipeRow fires onRowDidOpen and the onAnimationEnd callback after settle', () => {
        const onRowDidOpen = jest.fn();
        const onAnimationEnd = jest.fn();
        const { ref } = renderRow({ onRowDidOpen, rightOpenValue: -150 });
        ref.current!.manuallySwipeRow(-150, onAnimationEnd);
        expect(onRowDidOpen).toHaveBeenCalledWith(-150);
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
        expect(ref.current!.isOpen).toBe(true);
        expect(ref.current!.swipeAnimatedValue.value).toBe(-150);
    });

    it('closeRow after open fires onRowDidClose and resets isOpen', () => {
        const onRowDidClose = jest.fn();
        const { ref } = renderRow({ onRowDidClose, rightOpenValue: -150 });
        ref.current!.manuallySwipeRow(-150);
        ref.current!.closeRow();
        expect(onRowDidClose).toHaveBeenCalled();
        expect(ref.current!.isOpen).toBe(false);
        expect(ref.current!.swipeAnimatedValue.value).toBe(0);
    });

    it('dev-warns when not given exactly two children', () => {
        const warnSpy = jest
            .spyOn(console, 'warn')
            .mockImplementation(() => {});
        render(
            <SwipeRow>
                <View>
                    <Text>only</Text>
                </View>
            </SwipeRow>
        );
        expect(
            warnSpy.mock.calls.some(args =>
                String(args[0]).includes('exactly two children')
            )
        ).toBe(true);
        warnSpy.mockRestore();
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
            const root = toJSON() as unknown as {
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

        it('user-supplied accessibilityActions replace the defaults', () => {
            const { toJSON } = renderRow({
                leftOpenValue: 75,
                accessibilityActions: [{ name: 'magicTap' }],
            });
            const root = toJSON() as { props: Record<string, unknown> };
            expect(root.props.accessibilityActions).toEqual([
                { name: 'magicTap' },
            ]);
        });

        it('forwards the event to a user onAccessibilityAction', () => {
            const onAccessibilityAction = jest.fn();
            const { toJSON } = renderRow({
                rightOpenValue: -150,
                onAccessibilityAction,
            });
            const root = toJSON() as unknown as {
                props: {
                    onAccessibilityAction: (event: unknown) => void;
                };
            };
            const event = { nativeEvent: { actionName: 'swipeleft' } };
            root.props.onAccessibilityAction(event);
            expect(onAccessibilityAction).toHaveBeenCalledWith(event);
        });
    });

    describe('child prop injection (C1)', () => {
        it('injects swipeAnimatedValue and action state into both children', () => {
            let hiddenProps: Record<string, unknown> = {};
            let visibleProps: Record<string, unknown> = {};
            const Hidden = (p: Record<string, unknown>) => {
                hiddenProps = p;
                return <Text>hidden</Text>;
            };
            const Visible = (p: Record<string, unknown>) => {
                visibleProps = p;
                return <Text>visible</Text>;
            };
            const ref = createRef<SwipeRowRef>();
            render(
                <SwipeRow ref={ref} initialLeftActionState>
                    <Hidden />
                    <Visible />
                </SwipeRow>
            );
            expect(hiddenProps.swipeAnimatedValue).toBe(
                ref.current!.swipeAnimatedValue
            );
            expect(visibleProps.swipeAnimatedValue).toBe(
                ref.current!.swipeAnimatedValue
            );
            expect(hiddenProps.leftActionState).toBe(true);
            expect(hiddenProps.rightActionState).toBe(false);
            expect(visibleProps.leftActionActivated).toBe(false);
            expect(visibleProps.rightActionActivated).toBe(false);
        });
    });

    describe('row press handling', () => {
        it('pressing the visible row closes it when closeOnRowPress (default)', () => {
            const onRowClose = jest.fn();
            const { ref } = renderRow({ onRowClose, rightOpenValue: -150 });
            ref.current!.manuallySwipeRow(-150);
            fireEvent.press(screen.getByText('visible'));
            expect(onRowClose).toHaveBeenCalled();
            expect(ref.current!.isOpen).toBe(false);
        });

        it('onRowPress takes over and suppresses the default close', () => {
            const onRowPress = jest.fn();
            const onRowClose = jest.fn();
            renderRow({ onRowPress, onRowClose });
            fireEvent.press(screen.getByText('visible'));
            expect(onRowPress).toHaveBeenCalledTimes(1);
            expect(onRowClose).not.toHaveBeenCalled();
        });

        it("composes the close with the visible child's own onPress", () => {
            const childPress = jest.fn();
            const onRowClose = jest.fn();
            render(
                <SwipeRow onRowClose={onRowClose}>
                    <View>
                        <Text>hidden</Text>
                    </View>
                    <TouchableOpacity onPress={childPress}>
                        <Text>visible</Text>
                    </TouchableOpacity>
                </SwipeRow>
            );
            fireEvent.press(screen.getByText('visible'));
            expect(childPress).toHaveBeenCalledTimes(1);
            expect(onRowClose).toHaveBeenCalled();
        });

        it('closeOnRowPress={false} leaves presses to the child', () => {
            const childPress = jest.fn();
            const onRowClose = jest.fn();
            render(
                <SwipeRow closeOnRowPress={false} onRowClose={onRowClose}>
                    <View>
                        <Text>hidden</Text>
                    </View>
                    <TouchableOpacity onPress={childPress}>
                        <Text>visible</Text>
                    </TouchableOpacity>
                </SwipeRow>
            );
            fireEvent.press(screen.getByText('visible'));
            expect(childPress).toHaveBeenCalledTimes(1);
            expect(onRowClose).not.toHaveBeenCalled();
        });
    });

    describe('hidden layout measurement', () => {
        it('sizes the hidden container from the visible row layout', () => {
            renderRow();
            expect(hiddenContainerStyle()).toMatchObject({
                height: 0,
                width: 0,
            });
            fireEvent(
                screen.getByText('visible'),
                'layout',
                layoutEvent(60, 300)
            );
            expect(hiddenContainerStyle()).toMatchObject({
                height: 60,
                width: 300,
            });
        });

        it('disableHiddenLayoutCalculation keeps the 100% defaults', () => {
            renderRow({ disableHiddenLayoutCalculation: true });
            fireEvent(
                screen.getByText('visible'),
                'layout',
                layoutEvent(60, 300)
            );
            expect(hiddenContainerStyle()).toMatchObject({
                height: '100%',
                width: '100%',
            });
        });
    });

    describe('preview', () => {
        it('runs once after layout and fires onPreviewEnd', () => {
            const onPreviewEnd = jest.fn();
            renderRow({ preview: true, rightOpenValue: -150, onPreviewEnd });
            fireEvent(
                screen.getByText('visible'),
                'layout',
                layoutEvent(60, 300)
            );
            expect(onPreviewEnd).toHaveBeenCalledTimes(1);
        });

        it('does not run without the preview prop', () => {
            const onPreviewEnd = jest.fn();
            renderRow({ rightOpenValue: -150, onPreviewEnd });
            fireEvent(
                screen.getByText('visible'),
                'layout',
                layoutEvent(60, 300)
            );
            expect(onPreviewEnd).not.toHaveBeenCalled();
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

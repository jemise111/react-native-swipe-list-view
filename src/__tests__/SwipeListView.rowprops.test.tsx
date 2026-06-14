/**
 * SwipeListView -> SwipeRow wiring tests. SwipeRow is mocked so each row's
 * props can be captured and its callbacks invoked directly — this is how the
 * per-row item overrides and the cross-row bookkeeping are asserted without
 * simulating gestures (real-gesture behavior is verified on-device, Phase 6).
 */
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';

import SwipeListView from '../SwipeListView';
import SwipeRow from '../SwipeRow';
import type { RowMap, SwipeValueChangeData } from '../types';

type CapturedRowProps = {
    swipeKey: string;
    preview: boolean;
    previewDuration?: number;
    previewOpenValue?: number;
    previewOpenDelay?: number;
    previewRepeat?: boolean;
    previewRepeatDelay?: number;
    style?: unknown;
    item?: unknown;
    shouldItemUpdate?: unknown;
    leftOpenValue?: number;
    rightOpenValue?: number;
    leftActivationValue?: number;
    rightActivationValue?: number;
    leftActionValue?: number;
    rightActionValue?: number;
    initialLeftActionState?: boolean;
    initialRightActionState?: boolean;
    stopLeftSwipe?: number;
    stopRightSwipe?: number;
    closeOnRowPress?: boolean;
    disableLeftSwipe?: boolean;
    disableRightSwipe?: boolean;
    onRowOpen?: (toValue: number) => void;
    onRowPress?: () => void;
    onLeftAction?: () => void;
    onRightAction?: () => void;
    onSwipeValueChange?: (data: Omit<SwipeValueChangeData, 'key'>) => void;
    onLeftActionStatusChange?: (data: Record<string, unknown>) => void;
    onRightActionStatusChange?: (data: Record<string, unknown>) => void;
    swipeGestureBegan?: () => void;
    swipeGestureEnded?: (key: string | undefined, data: unknown) => void;
    setScrollEnabled?: (enable: boolean) => void;
    children?: React.ReactNode;
};

jest.mock('../SwipeRow', () => {
    const React = jest.requireActual<typeof import('react')>('react');
    const { View: RNView } =
        jest.requireActual<typeof import('react-native')>('react-native');
    const captured: Array<Record<string, unknown>> = [];
    const MockSwipeRow = React.forwardRef(function MockSwipeRow(
        props: Record<string, unknown>,
        ref: React.Ref<unknown>
    ) {
        const handle = React.useRef<Record<string, unknown> | null>(null);
        if (!handle.current) {
            handle.current = {
                closeRow: jest.fn(),
                closeRowWithoutAnimation: jest.fn(),
                manuallySwipeRow: jest.fn(),
                isOpen: false,
                swipeAnimatedValue: { value: 0 },
            };
        }
        React.useImperativeHandle(ref, () => handle.current);
        captured.push(props);
        return React.createElement(
            RNView,
            null,
            props.children as React.ReactNode
        );
    });
    Object.assign(MockSwipeRow, { captured });
    return { __esModule: true, default: MockSwipeRow };
});

const captured = (
    SwipeRow as unknown as { captured: CapturedRowProps[] }
).captured;

type Item = {
    key: string;
    text: string;
    [override: string]: unknown;
};

const makeData = (count: number): Item[] =>
    Array.from({ length: count }, (_, i) => ({
        key: `${i}`,
        text: `row ${i}`,
    }));

function renderList(props: Record<string, unknown> = {}) {
    let rowMap: RowMap<Item> = {};
    render(
        <SwipeListView<Item>
            data={makeData(3)}
            renderItem={({ item }, map) => {
                rowMap = map;
                return (
                    <View>
                        <Text>{item.text}</Text>
                    </View>
                );
            }}
            renderHiddenItem={({ item }) => (
                <View>
                    <Text>{`hidden ${item.key}`}</Text>
                </View>
            )}
            {...props}
        />
    );
    return { rowMap: () => rowMap };
}

const propsForKey = (key: string): CapturedRowProps =>
    [...captured].reverse().find(p => p.swipeKey === key)!;

beforeEach(() => {
    captured.length = 0;
});

describe('SwipeListView row wiring', () => {
    describe('per-row overrides from item data', () => {
        it('item values override list-level props (v3 renderCell set)', () => {
            const data: Item[] = [
                {
                    key: '0',
                    text: 'row 0',
                    leftOpenValue: 10,
                    rightOpenValue: -20,
                    leftActivationValue: 30,
                    rightActivationValue: -40,
                    leftActionValue: 50,
                    rightActionValue: -60,
                    initialLeftActionState: true,
                    initialRightActionState: true,
                    stopLeftSwipe: 70,
                    stopRightSwipe: -80,
                    disableLeftSwipe: true,
                    disableRightSwipe: true,
                },
                { key: '1', text: 'row 1' },
            ];
            renderList({
                data,
                leftOpenValue: 1,
                rightOpenValue: -2,
                leftActivationValue: 3,
                rightActivationValue: -4,
                leftActionValue: 5,
                rightActionValue: -6,
                stopLeftSwipe: 7,
                stopRightSwipe: -8,
            });
            const row0 = propsForKey('0');
            expect(row0.leftOpenValue).toBe(10);
            expect(row0.rightOpenValue).toBe(-20);
            expect(row0.leftActivationValue).toBe(30);
            expect(row0.rightActivationValue).toBe(-40);
            expect(row0.leftActionValue).toBe(50);
            expect(row0.rightActionValue).toBe(-60);
            expect(row0.initialLeftActionState).toBe(true);
            expect(row0.initialRightActionState).toBe(true);
            expect(row0.stopLeftSwipe).toBe(70);
            expect(row0.stopRightSwipe).toBe(-80);
            expect(row0.disableLeftSwipe).toBe(true);
            expect(row0.disableRightSwipe).toBe(true);

            const row1 = propsForKey('1');
            expect(row1.leftOpenValue).toBe(1);
            expect(row1.rightOpenValue).toBe(-2);
            expect(row1.leftActivationValue).toBe(3);
            expect(row1.rightActivationValue).toBe(-4);
            expect(row1.leftActionValue).toBe(5);
            expect(row1.rightActionValue).toBe(-6);
            expect(row1.stopLeftSwipe).toBe(7);
            expect(row1.stopRightSwipe).toBe(-8);
        });

        it('item closeOnRowPress overrides a list-level false', () => {
            const data: Item[] = [
                { key: '0', text: 'row 0', closeOnRowPress: true },
                { key: '1', text: 'row 1' },
            ];
            renderList({ data, closeOnRowPress: false });
            expect(propsForKey('0').closeOnRowPress).toBe(true);
            expect(propsForKey('1').closeOnRowPress).toBe(false);
        });

        it('falsy item values fall back to list-level (v3 || semantics)', () => {
            const data: Item[] = [
                { key: '0', text: 'row 0', rightOpenValue: 0 },
            ];
            renderList({ data, rightOpenValue: -2 });
            expect(propsForKey('0').rightOpenValue).toBe(-2);
        });

        it('item-level onLeftAction/onRightAction win over list-level (v3 bug fixed)', () => {
            const itemLeft = jest.fn();
            const itemRight = jest.fn();
            const listLeft = jest.fn();
            const listRight = jest.fn();
            const data: Item[] = [
                {
                    key: '0',
                    text: 'row 0',
                    onLeftAction: itemLeft,
                    onRightAction: itemRight,
                },
                { key: '1', text: 'row 1' },
            ];
            const { rowMap } = renderList({
                data,
                onLeftAction: listLeft,
                onRightAction: listRight,
            });
            propsForKey('0').onLeftAction!();
            propsForKey('0').onRightAction!();
            expect(itemLeft).toHaveBeenCalledTimes(1);
            expect(itemRight).toHaveBeenCalledTimes(1);
            expect(listLeft).not.toHaveBeenCalled();
            expect(listRight).not.toHaveBeenCalled();

            propsForKey('1').onLeftAction!();
            propsForKey('1').onRightAction!();
            expect(listLeft).toHaveBeenCalledWith('1', rowMap());
            expect(listRight).toHaveBeenCalledWith('1', rowMap());
        });

        it('onLeftAction is undefined when neither item nor list provide it', () => {
            renderList();
            expect(propsForKey('0').onLeftAction).toBeUndefined();
            expect(propsForKey('0').onRightAction).toBeUndefined();
        });
    });

    describe('row key injection into payloads', () => {
        it('injects the key into onSwipeValueChange', () => {
            const onSwipeValueChange = jest.fn();
            renderList({ onSwipeValueChange });
            propsForKey('1').onSwipeValueChange!({
                value: 5,
                direction: 'left',
                isOpen: false,
            });
            expect(onSwipeValueChange).toHaveBeenCalledWith({
                value: 5,
                direction: 'left',
                isOpen: false,
                key: '1',
            });
        });

        it('injects the key into action-status payloads', () => {
            const onLeftActionStatusChange = jest.fn();
            const onRightActionStatusChange = jest.fn();
            renderList({
                onLeftActionStatusChange,
                onRightActionStatusChange,
            });
            propsForKey('2').onLeftActionStatusChange!({
                isActivated: true,
                value: 40,
            });
            expect(onLeftActionStatusChange).toHaveBeenCalledWith({
                isActivated: true,
                value: 40,
                key: '2',
            });
            propsForKey('2').onRightActionStatusChange!({
                isActivated: false,
                value: -40,
            });
            expect(onRightActionStatusChange).toHaveBeenCalledWith({
                isActivated: false,
                value: -40,
                key: '2',
            });
        });

        it('passes no wrapper when the list-level callback is absent', () => {
            renderList();
            expect(propsForKey('0').onSwipeValueChange).toBeUndefined();
            expect(propsForKey('0').onLeftActionStatusChange).toBeUndefined();
            expect(propsForKey('0').onRightActionStatusChange).toBeUndefined();
        });
    });

    describe('preview routing', () => {
        it('routes preview props to the previewRowKey row only', () => {
            renderList({
                previewRowKey: '1',
                previewDuration: 123,
                previewOpenValue: -42,
                previewOpenDelay: 99,
                previewRepeat: true,
                previewRepeatDelay: 500,
            });
            expect(propsForKey('0').preview).toBe(false);
            expect(propsForKey('2').preview).toBe(false);
            const row1 = propsForKey('1');
            expect(row1.preview).toBe(true);
            expect(row1.previewDuration).toBe(123);
            expect(row1.previewOpenValue).toBe(-42);
            expect(row1.previewOpenDelay).toBe(99);
            expect(row1.previewRepeat).toBe(true);
            expect(row1.previewRepeatDelay).toBe(500);
        });
    });

    describe('misc passthrough', () => {
        it('passes swipeRowStyle, shouldItemUpdate and item through to rows', () => {
            const style = { backgroundColor: 'red' };
            const shouldItemUpdate = jest.fn();
            renderList({ swipeRowStyle: style, shouldItemUpdate });
            const row = propsForKey('0');
            expect(row.style).toBe(style);
            expect(row.shouldItemUpdate).toBe(shouldItemUpdate);
            expect((row.item as Item).key).toBe('0');
        });
    });

    describe('cross-row bookkeeping', () => {
        it('swipeGestureBegan/Ended pass through with the row key', () => {
            const swipeGestureBegan = jest.fn();
            const swipeGestureEnded = jest.fn();
            renderList({ swipeGestureBegan, swipeGestureEnded });
            propsForKey('2').swipeGestureBegan!();
            expect(swipeGestureBegan).toHaveBeenCalledWith('2');
            const data = { translateX: -10, direction: 'left', event: {} };
            propsForKey('2').swipeGestureEnded!(undefined, data);
            expect(swipeGestureEnded).toHaveBeenCalledWith('2', data);
        });

        it('closeOnRowBeginSwipe closes the open row when another starts swiping', () => {
            const { rowMap } = renderList({ closeOnRowBeginSwipe: true });
            propsForKey('0').onRowOpen!(-100);
            propsForKey('1').swipeGestureBegan!();
            expect(rowMap()['0']!.closeRow).toHaveBeenCalled();
        });

        it('without closeOnRowBeginSwipe a begin-swipe does not close the open row', () => {
            const { rowMap } = renderList();
            propsForKey('0').onRowOpen!(-100);
            propsForKey('1').swipeGestureBegan!();
            expect(rowMap()['0']!.closeRow).not.toHaveBeenCalled();
        });

        it('a row press closes the open row (closeOnRowPress default)', () => {
            const { rowMap } = renderList();
            propsForKey('0').onRowOpen!(-100);
            propsForKey('0').onRowPress!();
            expect(rowMap()['0']!.closeRow).toHaveBeenCalled();
        });

        it('closeOnRowPress={false} does not close on row press', () => {
            const { rowMap } = renderList({ closeOnRowPress: false });
            propsForKey('0').onRowOpen!(-100);
            propsForKey('0').onRowPress!();
            expect(rowMap()['0']!.closeRow).not.toHaveBeenCalled();
        });

        it('forwards row scroll toggles to onScrollEnabled', () => {
            const onScrollEnabled = jest.fn();
            renderList({ onScrollEnabled });
            propsForKey('0').setScrollEnabled!(false);
            expect(onScrollEnabled).toHaveBeenCalledWith(false);
            propsForKey('0').setScrollEnabled!(true);
            expect(onScrollEnabled).toHaveBeenCalledWith(true);
        });

        it('ignores row scroll toggles when scrollEnabled={false}', () => {
            const onScrollEnabled = jest.fn();
            renderList({ onScrollEnabled, scrollEnabled: false });
            propsForKey('0').setScrollEnabled!(false);
            expect(onScrollEnabled).not.toHaveBeenCalled();
        });
    });
});

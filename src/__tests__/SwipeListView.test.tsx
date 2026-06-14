import { createRef } from 'react';
import { Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import SwipeListView from '../SwipeListView';
import SwipeRow from '../SwipeRow';
import type { RowMap, SwipeListViewRef } from '../types';

type Item = { key: string; text: string };

const makeData = (count: number): Item[] =>
    Array.from({ length: count }, (_, i) => ({
        key: `${i}`,
        text: `row ${i}`,
    }));

function renderList(props: Record<string, unknown> = {}) {
    const ref = createRef<SwipeListViewRef>();
    const utils = render(
        <SwipeListView<Item>
            ref={ref}
            data={makeData(3)}
            renderItem={({ item }) => (
                <View>
                    <Text>{item.text}</Text>
                </View>
            )}
            renderHiddenItem={({ item }) => (
                <View>
                    <Text>{`hidden ${item.key}`}</Text>
                </View>
            )}
            {...props}
        />
    );
    return { ref, ...utils };
}

describe('SwipeListView', () => {
    it('renders every row with its hidden layer (FlatList)', () => {
        renderList();
        for (let i = 0; i < 3; i++) {
            expect(screen.getByText(`row ${i}`)).toBeTruthy();
            expect(screen.getByText(`hidden ${i}`)).toBeTruthy();
        }
    });

    it('renders rows with useSectionList', () => {
        render(
            <SwipeListView<Item>
                useSectionList
                sections={[
                    { title: 'a', data: makeData(2) },
                    { title: 'b', data: [{ key: '9', text: 'row 9' }] },
                ]}
                renderItem={({ item }) => (
                    <View>
                        <Text>{item.text}</Text>
                    </View>
                )}
                renderHiddenItem={({ item }) => (
                    <View>
                        <Text>{`hidden ${item.key}`}</Text>
                    </View>
                )}
            />
        );
        expect(screen.getByText('row 0')).toBeTruthy();
        expect(screen.getByText('row 9')).toBeTruthy();
        expect(screen.getByText('hidden 9')).toBeTruthy();
    });

    it('builds the rowMap from item.key with SwipeRow handles as values', () => {
        let captured: RowMap<Item> = {};
        renderList({
            renderItem: ({ item }: { item: Item }, map: RowMap<Item>) => {
                captured = map;
                return (
                    <View>
                        <Text>{item.text}</Text>
                    </View>
                );
            },
        });
        expect(Object.keys(captured).sort()).toEqual(['0', '1', '2']);
        expect(typeof captured['1']!.closeRow).toBe('function');
        expect(typeof captured['1']!.manuallySwipeRow).toBe('function');
        expect(captured['1']!.swipeAnimatedValue.value).toBe(0);
    });

    it('uses keyExtractor over item.key for rowMap keys', () => {
        let captured: RowMap<Item> = {};
        renderList({
            keyExtractor: (item: Item) => `k-${item.key}`,
            renderItem: ({ item }: { item: Item }, map: RowMap<Item>) => {
                captured = map;
                return (
                    <View>
                        <Text>{item.text}</Text>
                    </View>
                );
            },
        });
        expect(Object.keys(captured).sort()).toEqual(['k-0', 'k-1', 'k-2']);
    });

    it('onRowOpen receives (key, rowMap, toValue)', () => {
        const onRowOpen = jest.fn();
        let captured: RowMap<Item> = {};
        renderList({
            onRowOpen,
            rightOpenValue: -100,
            renderItem: ({ item }: { item: Item }, map: RowMap<Item>) => {
                captured = map;
                return (
                    <View>
                        <Text>{item.text}</Text>
                    </View>
                );
            },
        });
        captured['1']!.manuallySwipeRow(-100);
        expect(onRowOpen).toHaveBeenCalledWith('1', captured, -100);
    });

    it('closeOnRowOpen closes the previously open row when a new one opens', () => {
        const onRowClose = jest.fn();
        let captured: RowMap<Item> = {};
        renderList({
            onRowClose,
            rightOpenValue: -100,
            renderItem: ({ item }: { item: Item }, map: RowMap<Item>) => {
                captured = map;
                return (
                    <View>
                        <Text>{item.text}</Text>
                    </View>
                );
            },
        });
        captured['0']!.manuallySwipeRow(-100);
        expect(onRowClose).not.toHaveBeenCalled();
        captured['1']!.manuallySwipeRow(-100);
        expect(onRowClose).toHaveBeenCalledWith('0', captured);
    });

    it('closeOnRowOpen={false} leaves the previous row open', () => {
        const onRowClose = jest.fn();
        let captured: RowMap<Item> = {};
        renderList({
            onRowClose,
            closeOnRowOpen: false,
            rightOpenValue: -100,
            renderItem: ({ item }: { item: Item }, map: RowMap<Item>) => {
                captured = map;
                return (
                    <View>
                        <Text>{item.text}</Text>
                    </View>
                );
            },
        });
        captured['0']!.manuallySwipeRow(-100);
        captured['1']!.manuallySwipeRow(-100);
        expect(onRowClose).not.toHaveBeenCalled();
    });

    it('closeAllOpenRows closes only rows that are open', () => {
        const onRowClose = jest.fn();
        let captured: RowMap<Item> = {};
        const { ref } = renderList({
            onRowClose,
            closeOnRowOpen: false,
            rightOpenValue: -100,
            renderItem: ({ item }: { item: Item }, map: RowMap<Item>) => {
                captured = map;
                return (
                    <View>
                        <Text>{item.text}</Text>
                    </View>
                );
            },
        });
        captured['0']!.manuallySwipeRow(-100);
        captured['2']!.manuallySwipeRow(-100);
        ref.current!.closeAllOpenRows();
        const closedKeys = onRowClose.mock.calls.map(args => args[0]).sort();
        expect(closedKeys).toEqual(['0', '2']);
    });

    it('manuallyOpenAllRows opens every row to the given value', () => {
        const onRowOpen = jest.fn();
        const { ref } = renderList({
            onRowOpen,
            closeOnRowOpen: false,
            rightOpenValue: -100,
        });
        ref.current!.manuallyOpenAllRows(-100);
        expect(onRowOpen).toHaveBeenCalledTimes(3);
        const openedKeys = onRowOpen.mock.calls.map(args => args[0]).sort();
        expect(openedKeys).toEqual(['0', '1', '2']);
    });

    it('attaches bookkeeping to a standalone SwipeRow returned from renderItem (C2)', () => {
        const onRowOpen = jest.fn();
        let captured: RowMap<Item> = {};
        render(
            <SwipeListView<Item>
                data={makeData(2)}
                onRowOpen={onRowOpen}
                renderItem={({ item }, map) => {
                    captured = map;
                    return (
                        <SwipeRow rightOpenValue={-100}>
                            <View>
                                <Text>{`hidden ${item.key}`}</Text>
                            </View>
                            <View>
                                <Text>{item.text}</Text>
                            </View>
                        </SwipeRow>
                    );
                }}
            />
        );
        expect(screen.getByText('row 0')).toBeTruthy();
        expect(screen.getByText('hidden 0')).toBeTruthy();
        expect(Object.keys(captured).sort()).toEqual(['0', '1']);
        captured['0']!.manuallySwipeRow(-100);
        expect(onRowOpen).toHaveBeenCalledWith('0', captured, -100);
    });

    describe('scroll handling', () => {
        const scrollEvent = (y: number) => ({
            nativeEvent: {
                contentOffset: { x: 0, y },
                contentSize: { height: 600, width: 400 },
                layoutMeasurement: { height: 100, width: 400 },
            },
        });

        it('closeOnScroll (default) closes the open row on scroll', () => {
            const onRowClose = jest.fn();
            let captured: RowMap<Item> = {};
            renderList({
                onRowClose,
                rightOpenValue: -100,
                testID: 'list',
                renderItem: ({ item }: { item: Item }, map: RowMap<Item>) => {
                    captured = map;
                    return (
                        <View>
                            <Text>{item.text}</Text>
                        </View>
                    );
                },
            });
            captured['1']!.manuallySwipeRow(-100);
            fireEvent.scroll(screen.getByTestId('list'), scrollEvent(50));
            expect(onRowClose).toHaveBeenCalledWith('1', captured);
        });

        it('closeOnScroll={false} keeps the row open', () => {
            const onRowClose = jest.fn();
            let captured: RowMap<Item> = {};
            renderList({
                onRowClose,
                closeOnScroll: false,
                rightOpenValue: -100,
                testID: 'list',
                renderItem: ({ item }: { item: Item }, map: RowMap<Item>) => {
                    captured = map;
                    return (
                        <View>
                            <Text>{item.text}</Text>
                        </View>
                    );
                },
            });
            captured['1']!.manuallySwipeRow(-100);
            fireEvent.scroll(screen.getByTestId('list'), scrollEvent(50));
            expect(onRowClose).not.toHaveBeenCalled();
        });

        it('calls a user onScroll function with the scroll event', () => {
            const onScroll = jest.fn();
            renderList({ onScroll, testID: 'list' });
            fireEvent.scroll(screen.getByTestId('list'), scrollEvent(50));
            expect(onScroll).toHaveBeenCalled();
            expect(
                onScroll.mock.calls[0][0].nativeEvent.contentOffset.y
            ).toBe(50);
        });

        it('scrolls to end when iOS content shrink leaves the list over-scrolled', () => {
            const listViewRef = jest.fn();
            renderList({ listViewRef, testID: 'list' });
            const instance = listViewRef.mock.calls[0][0];
            instance.scrollToEnd = jest.fn();
            const list = screen.getByTestId('list');
            fireEvent(list, 'layout', {
                nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 100 } },
            });
            fireEvent.scroll(list, scrollEvent(450));
            fireEvent(list, 'contentSizeChange', 400, 500);
            expect(instance.scrollToEnd).toHaveBeenCalled();
        });

        it('does not scroll to end when still in bounds', () => {
            const listViewRef = jest.fn();
            renderList({ listViewRef, testID: 'list' });
            const instance = listViewRef.mock.calls[0][0];
            instance.scrollToEnd = jest.fn();
            const list = screen.getByTestId('list');
            fireEvent(list, 'layout', {
                nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 100 } },
            });
            fireEvent.scroll(list, scrollEvent(100));
            fireEvent(list, 'contentSizeChange', 400, 500);
            expect(instance.scrollToEnd).not.toHaveBeenCalled();
        });
    });

    it('closes the open row while refreshing', () => {
        const onRowClose = jest.fn();
        let captured: RowMap<Item> = {};
        const makeList = (refreshing: boolean) => (
            <SwipeListView<Item>
                data={makeData(3)}
                refreshing={refreshing}
                onRefresh={() => {}}
                onRowClose={onRowClose}
                rightOpenValue={-100}
                renderItem={({ item }, map) => {
                    captured = map;
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
            />
        );
        const { rerender } = render(makeList(false));
        captured['0']!.manuallySwipeRow(-100);
        expect(onRowClose).not.toHaveBeenCalled();
        rerender(makeList(true));
        expect(onRowClose).toHaveBeenCalledWith('0', captured);
    });

    it('forwards the list ref through listViewRef', () => {
        const listViewRef = jest.fn();
        renderList({ listViewRef });
        expect(listViewRef).toHaveBeenCalled();
        expect(listViewRef.mock.calls[0][0]).toBeTruthy();
    });

    describe('deprecations (C4)', () => {
        let warnSpy: jest.SpyInstance;

        beforeEach(() => {
            warnSpy = jest
                .spyOn(console, 'warn')
                .mockImplementation(() => {});
        });

        afterEach(() => {
            warnSpy.mockRestore();
        });

        const warningsFor = (name: string) =>
            warnSpy.mock.calls.filter(args => String(args[0]).includes(name));

        it.each(['useFlatList', 'useAnimatedList'])(
            'dev-warns once for tolerated prop %s',
            name => {
                renderList({ [name]: true });
                renderList({ [name]: true });
                expect(warningsFor(name)).toHaveLength(1);
            }
        );

        it.each([
            'dataSource',
            'renderRow',
            'renderHiddenRow',
            'renderListView',
            'previewFirstRow',
            'previewRowIndex',
        ])('dev-warns once for removed prop %s', name => {
            renderList({ [name]: name === 'previewRowIndex' ? 1 : () => null });
            renderList({ [name]: name === 'previewRowIndex' ? 1 : () => null });
            expect(warningsFor(name)).toHaveLength(1);
        });

        it('dev-warns when onScroll is not a plain function', () => {
            renderList({ onScroll: { some: 'animated-handler' } });
            expect(warningsFor('onScroll')).toHaveLength(1);
        });
    });
});

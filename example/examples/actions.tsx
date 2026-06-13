/**
 * Port of the v3 actions example. Under v4 the injected `swipeAnimatedValue` is
 * a Reanimated SharedValue, so the trash-icon scale uses `useAnimatedStyle`
 * instead of `.interpolate`. The row-height/row-action animations stay on
 * user-land RN Animated, as in v3.
 *
 * The Phase-6 v3/v4 toggle (see lib-switch) means this example may also receive
 * the v3 `swipeAnimatedValue` (an RN `Animated.Value`). A SharedValue can't be
 * captured by a `useAnimatedStyle` worklet without crashing, so the trash icon
 * picks its render path by detecting the injected value's type — keeping the
 * example version-agnostic.
 */
import { useState } from 'react';
import {
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableHighlight,
    View,
} from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import Reanimated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
} from 'react-native-reanimated';

import { SwipeListView } from 'react-native-swipe-list-view';
import type {
    RowMap,
    SwipeRowChildInjectedProps,
} from 'react-native-swipe-list-view';

type Item = {
    key: string;
    text: string;
    initialLeftActionState: boolean;
};

type VisibleItemProps = SwipeRowChildInjectedProps & {
    data: ListRenderItemInfo<Item>;
    rowHeightAnimatedValue: Animated.Value;
    removeRow: () => void;
};

function VisibleItem(props: VisibleItemProps) {
    const {
        rowHeightAnimatedValue,
        rightActionState,
        leftActionState,
        data,
        removeRow,
    } = props;

    if (rightActionState) {
        Animated.timing(rowHeightAnimatedValue, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
        }).start(() => {
            removeRow();
        });
    }

    return (
        <Animated.View
            style={[
                styles.rowFront,
                { height: rowHeightAnimatedValue },
                leftActionState && { backgroundColor: 'lightgreen' },
            ]}
        >
            <TouchableHighlight
                onPress={() => console.log('You touched me')}
                style={[
                    styles.rowFront,
                    leftActionState && {
                        backgroundColor: 'lightgreen',
                    },
                ]}
                underlayColor={'#AAA'}
            >
                <View>
                    <Text>I am {data.item.text} in a SwipeListView</Text>
                </View>
            </TouchableHighlight>
        </Animated.View>
    );
}

// v4 injects a Reanimated SharedValue (`.value` is a number); v3 injects an
// RN Animated.Value (no numeric `.value`). Used to pick the trash render path.
function isSharedValue(v: unknown): boolean {
    return !!v && typeof (v as { value?: unknown }).value === 'number';
}

// v4 path: drive the trash scale off the SharedValue on the UI thread.
function ReanimatedTrash({
    swipeAnimatedValue,
}: {
    swipeAnimatedValue: SwipeRowChildInjectedProps['swipeAnimatedValue'];
}) {
    const trashStyle = useAnimatedStyle(() => ({
        transform: [
            {
                scale: interpolate(
                    swipeAnimatedValue?.value ?? 0,
                    [-90, -45],
                    [1, 0],
                    Extrapolation.CLAMP
                ),
            },
        ],
    }));
    return (
        <Reanimated.View style={[styles.trash, trashStyle]}>
            <Image source={require('../images/trash.png')} style={styles.trash} />
        </Reanimated.View>
    );
}

// v3 path: the injected value is an RN Animated.Value; use `.interpolate`.
function LegacyTrash({
    swipeAnimatedValue,
}: {
    // Typed as the v4 SharedValue, but at runtime this is an Animated.Value.
    swipeAnimatedValue: SwipeRowChildInjectedProps['swipeAnimatedValue'];
}) {
    const animatedValue = swipeAnimatedValue as unknown as Animated.Value;
    return (
        <Animated.View
            style={[
                styles.trash,
                {
                    transform: [
                        {
                            scale: animatedValue.interpolate({
                                inputRange: [-90, -45],
                                outputRange: [1, 0],
                                extrapolate: 'clamp',
                            }),
                        },
                    ],
                },
            ]}
        >
            <Image source={require('../images/trash.png')} style={styles.trash} />
        </Animated.View>
    );
}

type HiddenItemProps = SwipeRowChildInjectedProps & {
    rowActionAnimatedValue: Animated.Value;
    rowHeightAnimatedValue: Animated.Value;
    onClose: () => void;
    onDelete: () => void;
};

function HiddenItemWithActions(props: HiddenItemProps) {
    const {
        leftActionActivated,
        rightActionActivated,
        swipeAnimatedValue,
        rowActionAnimatedValue,
        rowHeightAnimatedValue,
        onClose,
        onDelete,
    } = props;

    if (rightActionActivated) {
        Animated.spring(rowActionAnimatedValue, {
            toValue: 500,
            useNativeDriver: false,
        }).start();
    } else {
        Animated.spring(rowActionAnimatedValue, {
            toValue: 75,
            useNativeDriver: false,
        }).start();
    }

    return (
        <Animated.View
            style={[
                styles.rowBack,
                { height: rowHeightAnimatedValue },
                leftActionActivated && { backgroundColor: 'lightgreen' },
            ]}
        >
            <Text>Left</Text>
            {!leftActionActivated && (
                <TouchableOpacity
                    style={[styles.backRightBtn, styles.backRightBtnLeft]}
                    onPress={onClose}
                >
                    <Text style={styles.backTextWhite}>Close</Text>
                </TouchableOpacity>
            )}
            {!leftActionActivated && (
                <Animated.View
                    style={[
                        styles.backRightBtn,
                        styles.backRightBtnRight,
                        { flex: 1, width: rowActionAnimatedValue },
                    ]}
                >
                    <TouchableOpacity
                        style={[styles.backRightBtn, styles.backRightBtnRight]}
                        onPress={onDelete}
                    >
                        {isSharedValue(swipeAnimatedValue) ? (
                            <ReanimatedTrash
                                swipeAnimatedValue={swipeAnimatedValue}
                            />
                        ) : (
                            <LegacyTrash
                                swipeAnimatedValue={swipeAnimatedValue}
                            />
                        )}
                    </TouchableOpacity>
                </Animated.View>
            )}
        </Animated.View>
    );
}

export default function Actions() {
    const [listData, setListData] = useState<Item[]>(
        Array(20)
            .fill('')
            .map((_, i) => ({
                key: `${i}`,
                text: `item #${i}`,
                initialLeftActionState: i % 2 !== 0,
            }))
    );

    const closeRow = (rowMap: RowMap<Item>, rowKey: string) => {
        if (rowMap[rowKey]) {
            rowMap[rowKey].closeRow();
        }
    };

    const deleteRow = (rowMap: RowMap<Item>, rowKey: string) => {
        closeRow(rowMap, rowKey);
        const newData = [...listData];
        const prevIndex = listData.findIndex(item => item.key === rowKey);
        newData.splice(prevIndex, 1);
        setListData(newData);
    };

    const onRowDidOpen = (rowKey: string) => {
        console.log('This row opened', rowKey);
    };

    const onLeftActionStatusChange = (data: unknown) => {
        console.log('onLeftActionStatusChange', data);
    };

    const onRightActionStatusChange = (data: unknown) => {
        console.log('onRightActionStatusChange', data);
    };

    const onRightAction = (rowKey: string) => {
        console.log('onRightAction', rowKey);
    };

    const onLeftAction = (rowKey: string) => {
        console.log('onLeftAction', rowKey);
    };

    const renderItem = (
        data: ListRenderItemInfo<Item>,
        rowMap: RowMap<Item>
    ) => {
        const rowHeightAnimatedValue = new Animated.Value(50);
        return (
            <VisibleItem
                rowHeightAnimatedValue={rowHeightAnimatedValue}
                data={data}
                removeRow={() => deleteRow(rowMap, data.item.key)}
            />
        );
    };

    const renderHiddenItem = (
        data: ListRenderItemInfo<Item>,
        rowMap: RowMap<Item>
    ) => {
        const rowActionAnimatedValue = new Animated.Value(75);
        const rowHeightAnimatedValue = new Animated.Value(50);
        return (
            <HiddenItemWithActions
                rowActionAnimatedValue={rowActionAnimatedValue}
                rowHeightAnimatedValue={rowHeightAnimatedValue}
                onClose={() => closeRow(rowMap, data.item.key)}
                onDelete={() => deleteRow(rowMap, data.item.key)}
            />
        );
    };

    return (
        <View style={styles.container}>
            <SwipeListView
                data={listData}
                renderItem={renderItem}
                renderHiddenItem={renderHiddenItem}
                onRowDidOpen={onRowDidOpen}
                leftOpenValue={75}
                rightOpenValue={-150}
                leftActivationValue={100}
                rightActivationValue={-200}
                leftActionValue={0}
                rightActionValue={-500}
                onLeftAction={onLeftAction}
                onRightAction={onRightAction}
                onLeftActionStatusChange={onLeftActionStatusChange}
                onRightActionStatusChange={onRightActionStatusChange}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
    },
    backTextWhite: {
        color: '#FFF',
    },
    rowFront: {
        alignItems: 'center',
        backgroundColor: '#CCC',
        borderBottomColor: 'black',
        borderBottomWidth: 1,
        justifyContent: 'center',
        height: 50,
        width: '100%',
    },
    rowBack: {
        alignItems: 'center',
        backgroundColor: '#DDD',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 15,
    },
    backRightBtn: {
        alignItems: 'flex-end',
        bottom: 0,
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        width: 75,
        paddingRight: 17,
    },
    backRightBtnLeft: {
        backgroundColor: 'blue',
        right: 75,
    },
    backRightBtnRight: {
        backgroundColor: 'red',
        right: 0,
    },
    trash: {
        height: 25,
        width: 25,
        marginRight: 7,
    },
});

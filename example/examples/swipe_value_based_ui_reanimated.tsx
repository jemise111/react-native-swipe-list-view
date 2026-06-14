/**
 * The recommended v4 version of swipe_value_based_ui (flagship migration
 * example, improvement C1): SwipeRow injects its translateX as a Reanimated
 * SharedValue (`swipeAnimatedValue`) into both children, so the trash-icon
 * scale runs entirely on the UI thread via `useAnimatedStyle` — no per-frame
 * JS callback, no `onSwipeValueChange`, no Animated.Value bookkeeping.
 */
import { useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableHighlight,
    View,
} from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
} from 'react-native-reanimated';

import { SwipeListView } from 'react-native-swipe-list-view';
import type {
    RowMap,
    SwipeRowChildInjectedProps,
} from 'react-native-swipe-list-view';

type Item = { key: string; text: string };

type HiddenItemProps = SwipeRowChildInjectedProps & {
    onClose: () => void;
    onDelete: () => void;
};

function HiddenItem({ swipeAnimatedValue, onClose, onDelete }: HiddenItemProps) {
    const trashStyle = useAnimatedStyle(() => ({
        transform: [
            {
                scale: interpolate(
                    Math.abs(swipeAnimatedValue?.value ?? 0),
                    [45, 90],
                    [0, 1],
                    Extrapolation.CLAMP
                ),
            },
        ],
    }));

    return (
        <View style={styles.rowBack}>
            <Text>Left</Text>
            <TouchableOpacity
                style={[styles.backRightBtn, styles.backRightBtnLeft]}
                onPress={onClose}
            >
                <Text style={styles.backTextWhite}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.backRightBtn, styles.backRightBtnRight]}
                onPress={onDelete}
            >
                <Animated.View style={[styles.trash, trashStyle]}>
                    <Image
                        source={require('../images/trash.png')}
                        style={styles.trash}
                    />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
}

export default function SwipeValueBasedUiReanimated() {
    const [listData, setListData] = useState<Item[]>(
        Array(20)
            .fill('')
            .map((_, i) => ({ key: `${i}`, text: `item #${i}` }))
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

    const renderItem = (data: ListRenderItemInfo<Item>) => (
        <TouchableHighlight
            onPress={() => console.log('You touched me')}
            style={styles.rowFront}
            underlayColor={'#AAA'}
        >
            <View>
                <Text>I am {data.item.text} in a SwipeListView</Text>
            </View>
        </TouchableHighlight>
    );

    // SwipeRow clones this element and injects `swipeAnimatedValue`.
    const renderHiddenItem = (
        data: ListRenderItemInfo<Item>,
        rowMap: RowMap<Item>
    ) => (
        <HiddenItem
            onClose={() => closeRow(rowMap, data.item.key)}
            onDelete={() => deleteRow(rowMap, data.item.key)}
        />
    );

    return (
        <View style={styles.container}>
            <SwipeListView
                data={listData}
                renderItem={renderItem}
                renderHiddenItem={renderHiddenItem}
                leftOpenValue={75}
                rightOpenValue={-150}
                previewRowKey={'0'}
                previewOpenValue={-40}
                previewOpenDelay={3000}
                onRowDidOpen={onRowDidOpen}
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
        alignItems: 'center',
        bottom: 0,
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        width: 75,
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
    },
});

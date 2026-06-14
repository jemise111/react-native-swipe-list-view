/**
 * Accessibility demo (new in v4, improvement C6). With a screen reader
 * running (VoiceOver / TalkBack), every SwipeRow with an open value exposes
 * custom accessibility actions — "swipeleft" when `rightOpenValue` is set,
 * "swiperight" when `leftOpenValue` is set — which open (or close) the row,
 * so hidden actions are reachable without performing a swipe gesture.
 *
 * iOS: swipe up/down with one finger while a row is focused to pick an
 * action, then double-tap. Android: use the TalkBack actions menu.
 */
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type {
    AccessibilityActionEvent,
    ListRenderItemInfo,
} from 'react-native';

import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';
import type { RowMap } from 'react-native-swipe-list-view';

type Item = { key: string; text: string };

export default function Accessibility() {
    const [listData] = useState<Item[]>(
        Array(10)
            .fill('')
            .map((_, i) => ({ key: `${i}`, text: `item #${i}` }))
    );
    const [lastAction, setLastAction] = useState('none yet');

    const onAccessibilityAction = (event: AccessibilityActionEvent) => {
        setLastAction(event.nativeEvent.actionName);
    };

    const closeRow = (rowMap: RowMap<Item>, rowKey: string) => {
        if (rowMap[rowKey]) {
            rowMap[rowKey].closeRow();
        }
    };

    const renderItem = (data: ListRenderItemInfo<Item>) => (
        <View style={styles.rowFront}>
            <Text>I am {data.item.text} in a SwipeListView</Text>
        </View>
    );

    const renderHiddenItem = (
        data: ListRenderItemInfo<Item>,
        rowMap: RowMap<Item>
    ) => (
        <View style={styles.rowBack}>
            <Text style={styles.backTextWhite}>Left</Text>
            <TouchableOpacity
                accessibilityRole="button"
                style={[styles.backRightBtn, styles.backRightBtnRight]}
                onPress={() => closeRow(rowMap, data.item.key)}
            >
                <Text style={styles.backTextWhite}>Close</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.instructions}>
                Run VoiceOver (iOS) or TalkBack (Android). Focus a row, then
                pick the “swipeleft” / “swiperight” custom action to open it
                without a gesture; pick it again to close.
            </Text>
            <View style={styles.standalone}>
                <SwipeRow
                    leftOpenValue={75}
                    rightOpenValue={-75}
                    onAccessibilityAction={onAccessibilityAction}
                >
                    <View style={styles.standaloneRowBack}>
                        <Text style={styles.backTextWhite}>Left</Text>
                        <Text style={styles.backTextWhite}>Right</Text>
                    </View>
                    <View style={styles.standaloneRowFront}>
                        <Text>
                            Standalone row — last action: {lastAction}
                        </Text>
                    </View>
                </SwipeRow>
            </View>
            <SwipeListView
                data={listData}
                renderItem={renderItem}
                renderHiddenItem={renderHiddenItem}
                leftOpenValue={75}
                rightOpenValue={-150}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
    },
    instructions: {
        padding: 10,
    },
    standalone: {
        marginBottom: 15,
    },
    standaloneRowFront: {
        alignItems: 'center',
        backgroundColor: '#CCC',
        justifyContent: 'center',
        height: 50,
    },
    standaloneRowBack: {
        alignItems: 'center',
        backgroundColor: '#8BC645',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
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
    backRightBtnRight: {
        backgroundColor: 'red',
        right: 0,
    },
});

import { useState, useRef } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableHighlight,
    View,
} from 'react-native';
import type { ListRenderItemInfo } from 'react-native';

import { SwipeListView } from 'react-native-swipe-list-view';
import type { RowMap, SwipeRowRef } from 'react-native-swipe-list-view';

type Item = { key: string; text: string };

export default function CloseRowManually() {
    const [listData] = useState<Item[]>(
        Array(20)
            .fill('')
            .map((_, i) => ({ key: `${i}`, text: `item #${i}` }))
    );
    const openRowRef = useRef<SwipeRowRef<Item> | null>(null);

    // Track the open row on `onRowOpen` (fires at gesture release), NOT
    // `onRowDidOpen` (fires only once the spring has fully settled to rest,
    // which can be ~1s later). Using the did-open callback leaves `openRowRef`
    // stale during that window, so the "Close Open Row" button no-ops if pressed
    // before the row settles and has to be tapped twice.
    const onRowOpen = (rowKey: string, rowMap: RowMap<Item>) => {
        openRowRef.current = rowMap[rowKey];
    };

    const closeOpenRow = () => {
        if (openRowRef.current && openRowRef.current.closeRow) {
            openRowRef.current.closeRow();
        }
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

    const renderHiddenItem = () => (
        <View style={styles.rowBack}>
            <Text>Left</Text>
            <View style={[styles.backRightBtn, styles.backRightBtnLeft]}>
                <Text style={styles.backTextWhite}>Left</Text>
            </View>
            <View style={[styles.backRightBtn, styles.backRightBtnRight]}>
                <Text style={styles.backTextWhite}>Right</Text>
            </View>
        </View>
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
                onRowOpen={onRowOpen}
            />
            <TouchableOpacity onPress={closeOpenRow} style={styles.closeButton}>
                <Text>Close Open Row</Text>
            </TouchableOpacity>
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
    closeButton: {
        backgroundColor: 'white',
        bottom: 30,
        borderWidth: 1,
        borderRadius: 4,
        borderColor: 'black',
        padding: 15,
        position: 'absolute',
        right: 30,
    },
});

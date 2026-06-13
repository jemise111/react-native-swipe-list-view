import { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableHighlight,
    View,
} from 'react-native';
import type { SectionListRenderItemInfo } from 'react-native';

import { SwipeListView } from 'react-native-swipe-list-view';
import type { RowMap } from 'react-native-swipe-list-view';

type Item = { key: string; text: string };
type Section = { title: string; data: Item[] };

export default function SectionList() {
    const [listData, setListData] = useState<Section[]>(
        Array(5)
            .fill('')
            .map((_, i) => ({
                title: `title${i + 1}`,
                data: [
                    ...Array(5)
                        .fill('')
                        .map((_, j) => ({
                            key: `${i}.${j}`,
                            text: `item #${j}`,
                        })),
                ],
            }))
    );

    const closeRow = (rowMap: RowMap<Item>, rowKey: string) => {
        if (rowMap[rowKey]) {
            rowMap[rowKey].closeRow();
        }
    };

    const deleteRow = (rowMap: RowMap<Item>, rowKey: string) => {
        closeRow(rowMap, rowKey);
        const sectionIndex = Number(rowKey.split('.')[0]);
        const newData = [...listData];
        const prevIndex = listData[sectionIndex].data.findIndex(
            item => item.key === rowKey
        );
        newData[sectionIndex].data.splice(prevIndex, 1);
        setListData(newData);
    };

    const onRowDidOpen = (rowKey: string) => {
        console.log('This row opened', rowKey);
    };

    const renderItem = (data: SectionListRenderItemInfo<Item, Section>) => (
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

    const renderHiddenItem = (
        data: SectionListRenderItemInfo<Item, Section>,
        rowMap: RowMap<Item>
    ) => (
        <View style={styles.rowBack}>
            <Text>Left</Text>
            <TouchableOpacity
                style={[styles.backRightBtn, styles.backRightBtnLeft]}
                onPress={() => closeRow(rowMap, data.item.key)}
            >
                <Text style={styles.backTextWhite}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.backRightBtn, styles.backRightBtnRight]}
                onPress={() => deleteRow(rowMap, data.item.key)}
            >
                <Text style={styles.backTextWhite}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    const renderSectionHeader = ({ section }: { section: Section }) => (
        <Text>{section.title}</Text>
    );

    return (
        <View style={styles.container}>
            <SwipeListView<Item, Section>
                useSectionList
                sections={listData}
                renderItem={renderItem}
                renderHiddenItem={renderHiddenItem}
                renderSectionHeader={renderSectionHeader}
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
});

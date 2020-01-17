import React, { Component } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableHighlight,
    View,
} from 'react-native';

import SwipeListView from './SwipeListView';
import SwipeRow from './SwipeRow';

const HiddenItemWithActions = props => {
    const {
        leftActionActivated,
        rightActionActivated,
        rowSwipeAnimatedValue,
        rowActionAnimatedValue,
        rowHeightAnimatedValue,
        onClose,
        onDelete,
    } = props;

    if (rightActionActivated) {
        Animated.spring(rowActionAnimatedValue, {
            toValue: 500,
        }).start();
    } else {
        Animated.spring(rowActionAnimatedValue, {
            toValue: 75,
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
                        <Animated.View
                            style={[
                                styles.trash,
                                {
                                    transform: [
                                        {
                                            scale: rowSwipeAnimatedValue.interpolate(
                                                {
                                                    inputRange: [45, 90],
                                                    outputRange: [0, 1],
                                                    extrapolate: 'clamp',
                                                }
                                            ),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <Image
                                source={require('./images/trash.png')}
                                style={styles.trash}
                            />
                        </Animated.View>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </Animated.View>
    );
};

const VisibleItem = props => {
    const {
        rowHeightAnimatedValue,
        rightActionEvaluated,
        leftActionEvaluated,
        data,
        removeRow,
    } = props;

    if (rightActionEvaluated) {
        Animated.timing(rowHeightAnimatedValue, {
            toValue: 0,
            duration: 200,
        }).start(() => {
            removeRow();
        });
    }

    return (
        <Animated.View
            style={[
                styles.rowFront,
                { height: rowHeightAnimatedValue },
                leftActionEvaluated && { backgroundColor: 'lightgreen' },
            ]}
        >
            <TouchableHighlight
                onPress={() => console.log('You touched me')}
                style={[
                    styles.rowFront,
                    leftActionEvaluated && { backgroundColor: 'lightgreen' },
                ]}
                underlayColor={'#AAA'}
            >
                <View>
                    <Text>I am {data.item.text} in a SwipeListView</Text>
                </View>
            </TouchableHighlight>
        </Animated.View>
    );
};

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            listType: 'FlatList',
            listViewData: Array(20)
                .fill('')
                .map((_, i) => ({ key: `${i}`, text: `item #${i}` })),
            sectionListData: Array(5)
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
                })),
        };

        this.rowSwipeAnimatedValues = {};
        Array(20)
            .fill('')
            .forEach((_, i) => {
                this.rowSwipeAnimatedValues[`${i}`] = new Animated.Value(0);
            });
    }

    closeRow(rowMap, rowKey) {
        if (rowMap[rowKey]) {
            rowMap[rowKey].closeRow();
        }
    }

    deleteRow(rowMap, rowKey) {
        this.closeRow(rowMap, rowKey);
        const newData = [...this.state.listViewData];
        const prevIndex = this.state.listViewData.findIndex(
            item => item.key === rowKey
        );
        newData.splice(prevIndex, 1);
        this.setState({ listViewData: newData });
    }

    deleteSectionRow(rowMap, rowKey) {
        this.closeRow(rowMap, rowKey);
        const [section] = rowKey.split('.');
        const newData = [...this.state.sectionListData];
        const prevIndex = this.state.sectionListData[section].data.findIndex(
            item => item.key === rowKey
        );
        newData[section].data.splice(prevIndex, 1);
        this.setState({ sectionListData: newData });
    }

    onRowDidOpen = rowKey => {
        console.log('This row opened', rowKey);
    };

    onLeftActionStatusChange = rowKey => {
        console.log('onLeftActionStatusChange', rowKey);
    };

    onRightActionStatusChange = rowKey => {
        console.log('onRightActionStatusChange', rowKey);
    };

    onRightAction = rowKey => {
        console.log('onRightAction', rowKey);
    };

    onLeftAction = rowKey => {
        console.log('onLeftAction', rowKey);
    };

    onSwipeValueChange = swipeData => {
        const { key, value } = swipeData;
        this.rowSwipeAnimatedValues[key].setValue(Math.abs(value));
    };

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.standalone}>
                    <SwipeRow leftOpenValue={75} rightOpenValue={-75}>
                        <View style={styles.standaloneRowBack}>
                            <Text style={styles.backTextWhite}>Left</Text>
                            <Text style={styles.backTextWhite}>Right</Text>
                        </View>
                        <View style={styles.standaloneRowFront}>
                            <Text>I am a standalone SwipeRow</Text>
                        </View>
                    </SwipeRow>
                </View>

                <View style={styles.controls}>
                    <View style={styles.switchContainer}>
                        {['FlatList', 'Per row', 'Actions', 'SectionList'].map(
                            type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.switch,
                                        {
                                            backgroundColor:
                                                this.state.listType === type
                                                    ? 'grey'
                                                    : 'white',
                                        },
                                    ]}
                                    onPress={() =>
                                        this.setState({ listType: type })
                                    }
                                >
                                    <Text>{type}</Text>
                                </TouchableOpacity>
                            )
                        )}
                    </View>
                    {this.state.listType === 'Per row' && (
                        <Text>(per row behavior)</Text>
                    )}
                </View>

                {this.state.listType === 'FlatList' && (
                    <SwipeListView
                        data={this.state.listViewData}
                        renderItem={data => (
                            <TouchableHighlight
                                onPress={() => console.log('You touched me')}
                                style={styles.rowFront}
                                underlayColor={'#AAA'}
                            >
                                <View>
                                    <Text>
                                        I am {data.item.text} in a SwipeListView
                                    </Text>
                                </View>
                            </TouchableHighlight>
                        )}
                        renderHiddenItem={(data, rowMap) => (
                            <View style={styles.rowBack}>
                                <Text>Left</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.backRightBtn,
                                        styles.backRightBtnLeft,
                                    ]}
                                    onPress={() =>
                                        this.closeRow(rowMap, data.item.key)
                                    }
                                >
                                    <Text style={styles.backTextWhite}>
                                        Close
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.backRightBtn,
                                        styles.backRightBtnRight,
                                    ]}
                                    onPress={() =>
                                        this.deleteRow(rowMap, data.item.key)
                                    }
                                >
                                    <Animated.View
                                        style={[
                                            styles.trash,
                                            {
                                                transform: [
                                                    {
                                                        scale: this.rowSwipeAnimatedValues[
                                                            data.item.key
                                                        ].interpolate({
                                                            inputRange: [
                                                                45,
                                                                90,
                                                            ],
                                                            outputRange: [0, 1],
                                                            extrapolate:
                                                                'clamp',
                                                        }),
                                                    },
                                                ],
                                            },
                                        ]}
                                    >
                                        <Image
                                            source={require('./images/trash.png')}
                                            style={styles.trash}
                                        />
                                    </Animated.View>
                                </TouchableOpacity>
                            </View>
                        )}
                        leftOpenValue={75}
                        rightOpenValue={-150}
                        previewRowKey={'0'}
                        previewOpenValue={-40}
                        previewOpenDelay={3000}
                        onRowDidOpen={this.onRowDidOpen}
                        onSwipeValueChange={this.onSwipeValueChange}
                    />
                )}

                {this.state.listType === 'Per row' && (
                    <SwipeListView
                        data={this.state.listViewData}
                        renderItem={(data, rowMap) => (
                            <SwipeRow
                                disableLeftSwipe={
                                    parseInt(data.item.key) % 2 === 0
                                }
                                leftOpenValue={20 + Math.random() * 150}
                                rightOpenValue={-150}
                            >
                                <View style={styles.rowBack}>
                                    <Text>Left</Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.backRightBtn,
                                            styles.backRightBtnLeft,
                                        ]}
                                        onPress={() =>
                                            this.closeRow(rowMap, data.item.key)
                                        }
                                    >
                                        <Text style={styles.backTextWhite}>
                                            Close
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.backRightBtn,
                                            styles.backRightBtnRight,
                                        ]}
                                        onPress={() =>
                                            this.deleteRow(
                                                rowMap,
                                                data.item.key
                                            )
                                        }
                                    >
                                        <Text style={styles.backTextWhite}>
                                            Delete
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableHighlight
                                    onPress={() =>
                                        console.log('You touched me')
                                    }
                                    style={styles.rowFront}
                                    underlayColor={'#AAA'}
                                >
                                    <View>
                                        <Text>
                                            I am {data.item.text} in a
                                            SwipeListView
                                        </Text>
                                    </View>
                                </TouchableHighlight>
                            </SwipeRow>
                        )}
                    />
                )}

                {this.state.listType === 'Actions' && (
                    <SwipeListView
                        data={this.state.listViewData}
                        renderItem={(data, rowMap) => {
                            const rowHeightAnimatedValue = new Animated.Value(
                                50
                            );
                            return (
                                <VisibleItem
                                    rowHeightAnimatedValue={
                                        rowHeightAnimatedValue
                                    }
                                    data={data}
                                    removeRow={() =>
                                        this.deleteRow(rowMap, data.item.key)
                                    }
                                />
                            );
                        }}
                        renderHiddenItem={(data, rowMap) => {
                            const rowActionAnimatedValue = new Animated.Value(
                                75
                            );
                            const rowHeightAnimatedValue = new Animated.Value(
                                50
                            );
                            return (
                                <HiddenItemWithActions
                                    data={data}
                                    rowMap={rowMap}
                                    rowActionAnimatedValue={
                                        rowActionAnimatedValue
                                    }
                                    rowHeightAnimatedValue={
                                        rowHeightAnimatedValue
                                    }
                                    rowSwipeAnimatedValue={
                                        this.rowSwipeAnimatedValues[
                                        data.item.key
                                        ]
                                    }
                                    onClose={() =>
                                        this.closeRow(rowMap, data.item.key)
                                    }
                                    onDelete={() =>
                                        this.deleteRow(rowMap, data.item.key)
                                    }
                                />
                            );
                        }}
                        onRowDidOpen={this.onRowDidOpen}
                        onSwipeValueChange={this.onSwipeValueChange}
                        leftOpenValue={75}
                        rightOpenValue={-150}
                        leftActivationValue={100}
                        rightActivationValue={-200}
                        leftActionValue={0}
                        rightActionValue={-500}
                        onLeftAction={this.onLeftAction}
                        onRightAction={this.onRightAction}
                        onLeftActionStatusChange={this.onLeftActionStatusChange}
                        onRightActionStatusChange={
                            this.onRightActionStatusChange
                        }
                    />
                )}

                {this.state.listType === 'SectionList' && (
                    <SwipeListView
                        useSectionList
                        sections={this.state.sectionListData}
                        renderItem={data => (
                            <TouchableHighlight
                                onPress={() => console.log('You touched me')}
                                style={styles.rowFront}
                                underlayColor={'#AAA'}
                            >
                                <View>
                                    <Text>
                                        I am {data.item.text} in a SwipeListView
                                    </Text>
                                </View>
                            </TouchableHighlight>
                        )}
                        renderHiddenItem={(data, rowMap) => (
                            <View style={styles.rowBack}>
                                <Text>Left</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.backRightBtn,
                                        styles.backRightBtnLeft,
                                    ]}
                                    onPress={() =>
                                        this.closeRow(rowMap, data.item.key)
                                    }
                                >
                                    <Text style={styles.backTextWhite}>
                                        Close
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.backRightBtn,
                                        styles.backRightBtnRight,
                                    ]}
                                    onPress={() =>
                                        this.deleteSectionRow(
                                            rowMap,
                                            data.item.key
                                        )
                                    }
                                >
                                    <Text style={styles.backTextWhite}>
                                        Delete
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        renderSectionHeader={({ section }) => (
                            <Text>{section.title}</Text>
                        )}
                        leftOpenValue={75}
                        rightOpenValue={-150}
                        previewRowKey={'0'}
                        previewOpenValue={-40}
                        previewOpenDelay={3000}
                        onRowDidOpen={this.onRowDidOpen}
                    />
                )}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
    },
    standalone: {
        marginTop: 30,
        marginBottom: 30,
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
    controls: {
        alignItems: 'center',
        marginBottom: 30,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 5,
    },
    switch: {
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
        paddingVertical: 10,
        width: Dimensions.get('window').width / 4,
    },
    trash: {
        height: 25,
        width: 25,
        marginRight: 7,
    },
});

export default App;

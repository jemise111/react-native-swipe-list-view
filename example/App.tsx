import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Basic from './examples/basic';
import SectionList from './examples/sectionlist';
import PerRowConfig from './examples/per_row_config';
import StandaloneRow from './examples/standalone_row';
import SwipeToDelete from './examples/swipe_to_delete';
import SwipeValueLegacy from './examples/swipe_value_based_ui_legacy';
import SwipeValueShared from './examples/swipe_value_based_ui_reanimated';
import Actions from './examples/actions';
import CloseRowManually from './examples/close_row_manually';
import Accessibility from './examples/accessibility';

const componentMap = {
    Basic,
    SectionList,
    PerRowConfig,
    StandaloneRow,
    SwipeToDelete,
    SwipeValueLegacy,
    SwipeValueShared,
    Actions,
    CloseRowManually,
    Accessibility,
};

type Mode = keyof typeof componentMap;

export default function App() {
    const [mode, setMode] = useState<Mode>('Basic');
    const Example = componentMap[mode];

    return (
        <GestureHandlerRootView style={styles.root}>
            <View style={styles.container}>
                <StatusBar style="auto" />
                <View style={styles.switchContainer}>
                    {(Object.keys(componentMap) as Mode[]).map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.switch,
                                {
                                    backgroundColor:
                                        mode === type ? 'grey' : 'white',
                                },
                            ]}
                            onPress={() => setMode(type)}
                        >
                            <Text>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Example key={mode} />
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    container: {
        backgroundColor: 'white',
        flex: 1,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 50,
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    switch: {
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
        marginVertical: 2,
        paddingVertical: 10,
        width: Dimensions.get('window').width / 3,
    },
});

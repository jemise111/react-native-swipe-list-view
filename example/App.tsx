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

import { setLibraryVersion } from './lib-switch';
import type { LibraryVersion } from './lib-switch';

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

// These examples use v4-only APIs (SharedValue injection, accessibility
// actions) and degrade when the v3 reference implementation is selected.
const v4OnlyModes: Mode[] = ['SwipeValueShared', 'Accessibility'];

const versions: LibraryVersion[] = ['v4', 'v3'];

export default function App() {
    const [mode, setMode] = useState<Mode>('Basic');
    const [version, setVersion] = useState<LibraryVersion>('v4');
    const Example = componentMap[mode];

    const switchVersion = (next: LibraryVersion) => {
        // Set the module-level switch first, then re-render; the version key
        // below remounts the example so the new implementation starts fresh.
        setLibraryVersion(next);
        setVersion(next);
    };

    return (
        <GestureHandlerRootView style={styles.root}>
            <View style={styles.container}>
                <StatusBar style="auto" />
                <View style={styles.versionContainer}>
                    {versions.map(v => (
                        <TouchableOpacity
                            key={v}
                            style={[
                                styles.versionSwitch,
                                {
                                    backgroundColor:
                                        version === v ? 'black' : 'white',
                                },
                            ]}
                            onPress={() => switchVersion(v)}
                        >
                            <Text
                                style={{
                                    color: version === v ? 'white' : 'black',
                                }}
                            >
                                {v === 'v4' ? 'v4 (new)' : 'v3 (reference)'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {version === 'v3' && v4OnlyModes.includes(mode) && (
                    <Text style={styles.v3Note}>
                        This example demonstrates v4-only APIs and will not
                        work fully on v3.
                    </Text>
                )}
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
                <Example key={`${mode}-${version}`} />
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
    versionContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 50,
    },
    versionSwitch: {
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
        paddingVertical: 10,
        width: Dimensions.get('window').width / 2.5,
    },
    v3Note: {
        color: 'darkred',
        paddingHorizontal: 10,
        paddingTop: 6,
        textAlign: 'center',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
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

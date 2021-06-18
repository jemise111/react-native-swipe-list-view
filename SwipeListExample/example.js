import React, { useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import Basic from './examples/basic';
import SectionList from './examples/sectionlist';
import PerRowConfig from './examples/per_row_config';
import StandaloneRow from './examples/standalone_row';
import SwipeToDelete from './examples/swipe_to_delete';
import SwipeValueBasedUi from './examples/swipe_value_based_ui';
import Actions from './examples/actions';
import CloseRowManually from './examples/close_row_manually';

const componentMap = {
    Basic,
    SectionList,
    PerRowConfig,
    StandaloneRow,
    SwipeToDelete,
    SwipeValueBasedUi,
    Actions,
    CloseRowManually,
};

export default function App() {
    const [mode, setMode] = useState('Basic');

    const renderExample = () => {
        const Component = componentMap[mode];
        return <Component />;
    };

    return (
        <View style={styles.container}>
            <View style={styles.switchContainer}>
                {Object.keys(componentMap).map(type => (
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
            {renderExample()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 50,
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

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SwipeRow } from 'react-native-swipe-list-view';

export default function StandaloneRow() {
    return (
        <View style={styles.container}>
            <View style={styles.standalone}>
                <SwipeRow leftOpenValue={75} rightOpenValue={-75}>
                    <View style={styles.standaloneRowBack}>
                        <Text style={styles.backTextWhite}>Left</Text>
                        <Text style={styles.backTextWhite}>Right</Text>
                    </View>
                    <View style={styles.standaloneRowFront}>
                        <Text>I am standalone SwipeRow #1</Text>
                    </View>
                </SwipeRow>
                <View style={styles.spacer} />
                <SwipeRow leftOpenValue={75} rightOpenValue={-75}>
                    <View style={styles.standaloneRowBack}>
                        <Text style={styles.backTextWhite}>Left</Text>
                        <Text style={styles.backTextWhite}>Right</Text>
                    </View>
                    <View style={styles.standaloneRowFront}>
                        <Text>I am standalone SwipeRow #2</Text>
                    </View>
                </SwipeRow>
            </View>
        </View>
    );
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
    spacer: {
        height: 50,
    },
});
